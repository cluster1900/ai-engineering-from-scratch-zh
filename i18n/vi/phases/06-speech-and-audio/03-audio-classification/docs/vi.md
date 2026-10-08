# Audio Classification  Từ MFCC trên của k-NN đến AST và BEATs

> Từ  chó gọi với 警笛  đến  đây là loại ngôn ngữ , tất cả thuộc về âm thanh  Classification──trước tính là mels── cấu trúc mỗi thập kỷ đều thay đổi── đánh giá vẫn là AUC、F1 和按类回忆──

**类型：**构建
**语言：**Python
**先修要求：**Giai đoạn 6 · 02 (Spectograms & Mel), Giai đoạn 3 · 06 (CNN), Giai đoạn 5 · 08 (CNN & RNN for Text)
**时间：**~ 75 phút

## 问题

Bạn nhận được một đoạn phim âm thanh 10 giây. Bạn nghĩ rằng: 它是什么? 城市声音(警笛、电钻、狗) 、语音命令(yes/no/stop) 、语言 ID(en/es/ar) 、说话人情绪(angry/neutral), hoặc âm thanh môi trường(inner/outdoor, babble) ⋅ tất cả những điều này là *音频分类*, và vào năm 2026,基线架构已经成熟:log-mel → CNN hoặc Transformer → softmax。

核心难点不是网络,而是数据――音频数据集存在严重的类别不平衡、强域转移(干净 vs 杂) 和标签噪音(是谁决定城市和餐厅噪音的区别?)──80%的问题 nằm trong việc sắp xếp, tăng cường và đánh giá, thay vì chuyển CNN thành Transformer──

## 概念

![Audio classification ladder: k-NN on MFCCs to AST to BEATs](../assets/audio-classification.svg)

**MFCC 上的 k-NN（1990 年代基线）。**按片段展平 MFCC,计算它与带标签样本库的共数相似性,返回顶 K 的多数票――在干净的小数据集(Speech Commands、ESC-50) 上出乎意料地强──不需要 GPU 即可运行──

**log-mels 上的 2D CNN（2015-2019）。**- Đưa đi.`(T, n_mels)`log-mel 当作图像处理──应用 ResNet-18 或 VGG-style──对时间轴做全球平均积分──对类别做软max──在大多数2026年 kaggle 竞赛中,这仍然是基线──

**Audio Spectrogram Transformer, AST（2021-2024）。**将 log-mail patchify (ví dụ: 16×16 patches), thêm vị trí nhúng,并送入 ViT── đối với việc học theo giám sát, nó là AudioSet 上的 SOTA(mAP 0.485)──

**BEATs 和 WavLM-base（2024-2026）。**Trong hàng triệu giờ nghe trên các chương trình tự giám sát trước khi tập luyện. Với 1-10% dữ liệu giám sát bạn cần thực hiện trong nhiệm vụ.

**Whisper-encoder 作为冻结 backbone（2024）。**取 Whisper 的编码器, bỏ decoder,接一个线性分类器──在语言ID 和简单事件分类 上接近 SOTA,并且不需要音频增强──这是免费午餐基线──

### 类别不平衡才是真正的挑战

ESC-50:50 类, mỗi类 40 个片段 平衡、简单。UrbanSound8K:10 类,10:1 不平衡。AudioSet:632 类, có 100.000:1 đuôi dài。有效技术包括:

- 训练时 cân bằng lấy mẫu () 
- Mixup:将两个片段(及其标签) 线性插值作为增强──
- SpecAugment:随机遮盖时间和频率带──简单,但关键──

### 评估

- Tác dụng độc quyền đa lớp:Tác dụng lệnh nói: độ chính xác trên 1  độ chính xác trên 5 
- 多类多标签(AudioSet、UrbanSound-style):đơn độ chính xác trung bình (mAP)。
- 严重不平衡: mỗi lớp thu hồi + macro F1。

Bạn nên biết về 2026 số:

| Benchmark | Baseline | SOTA 2026 | Source |
|-----------|----------|-----------|--------|
| ESC-50 | 82% (AST) | 97.0% (BEATs-iter3) | BEATs paper (2024) |
| AudioSet mAP | 0.485 (AST) | 0.548 (BEATs-iter3) | HEAR leaderboard 2026 |
| Speech Commands v2 | 98% (CNN) | 99.0% (Audio-MAE) | HEAR v2 results |


```figure
mfcc-pipeline
```

##  xây dựng nó

### 步骤 1:featurise

```python
def featurize_mfcc(signal, sr, n_mfcc=13, n_mels=40, frame_len=400, hop=160):
    mag = stft_magnitude(signal, frame_len, hop)
    fb = mel_filterbank(n_mels, frame_len, sr)
    mels = apply_filterbank(mag, fb)
    log = log_transform(mels)
    return [dct_ii(frame, n_mfcc) for frame in log]
```

### 步骤 2: Kết luận dài cố định

```python
def summarize(mfcc_frames):
    n = len(mfcc_frames[0])
    mean = [sum(f[i] for f in mfcc_frames) / len(mfcc_frames) for i in range(n)]
    var = [
        sum((f[i] - mean[i]) ** 2 for f in mfcc_frames) / len(mfcc_frames) for i in range(n)
    ]
    return mean + var
```

简单但很强:跨时间的平均 +变化 会为13coef MFCC 得到一个26dim 固定嵌入──瞬间运行完成──直到2017年, nó vẫn có thể đánh bại SOTA NN 基线──

### 步骤 3:k-NN

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1e-12
    nb = math.sqrt(sum(x * x for x in b)) or 1e-12
    return dot / (na * nb)

def knn_classify(q, bank, labels, k=5):
    sims = sorted(range(len(bank)), key=lambda i: -cosine(q, bank[i]))[:k]
    votes = Counter(labels[i] for i in sims)
    return votes.most_common(1)[0][0]
```

### Bước 4: nâng cấp lên log-mels trên CNN

Trong PyTorch 中:

```python
import torch.nn as nn

class AudioCNN(nn.Module):
    def __init__(self, n_mels=80, n_classes=50):
        super().__init__()
        self.body = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(1),
        )
        self.head = nn.Linear(128, n_classes)

    def forward(self, x):  # x: (B, 1, T, n_mels)
        return self.head(self.body(x).flatten(1))
```

3M 参数──在单张 RTX 4090 上用约10分钟训练 ESC-50──精度80%+──

### 步骤 5:2026 默认方案  fine-tune BEATs

```python
from transformers import ASTFeatureExtractor, ASTForAudioClassification

ext = ASTFeatureExtractor.from_pretrained("MIT/ast-finetuned-audioset-10-10-0.4593")
model = ASTForAudioClassification.from_pretrained(
    "MIT/ast-finetuned-audioset-10-10-0.4593",
    num_labels=50,
    ignore_mismatched_sizes=True,
)

inputs = ext(audio, sampling_rate=16000, return_tensors="pt")
logits = model(**inputs).logits
```

对于BATs, qua `beats`库使用 `microsoft/BEATs-base`;Tình dạng của các biến thể API giống nhau:

## Sử dụng nó

2026:

| Situation | Start with |
|-----------|-----------|
| Tiny dataset (<1000 clips) | MFCC means 上的 k-NN（你的基线）+ audio augmentation |
| Medium dataset (1K–100K) | BEATs 或 AST fine-tune |
| Large dataset (>100K) | 从头训练或 fine-tune Whisper-encoder |
| Real-time, edge | 40-MFCC CNN，quantized to int8（KWS-style） |
| Multi-label (AudioSet) | BEATs-iter3，配合 BCE loss + mixup + SpecAugment |
| Language ID | MMS-LID, SpeechBrain VoxLingua107 baseline |

决策规则:**从冻结 backbone 开始，而不是新模型**❖ Định chỉnh một đầu BEATs có thể đạt đến 95% SOTA trong vài giờ, thay vì vài tuần.

## 交付 nó

保存为 `outputs/skill-classifier-designer.md` Để phân loại âm thanh nhất định  nhiệm vụ chọn kiến trúc, tăng cường, chiến lược cân bằng lớp học và đánh giá métrics

## 练习

1. **Easy.**运行 `code/main.py`◊ Nó sẽ được thực hiện trong một tập dữ liệu tổng hợp 4 lớp (不同音高的纯调) trên tập luyện k-NN MFCC 基线―― báo cáo trật tự ma trận.
2. **Medium.**用 [có nghĩa là, var, skew, kurtosis] 替换 `summarize`Trong cùng một bộ dữ liệu tổng hợp trên, 4 khoảnh khắc tập hợp có thắng trung bình + var?
3. **Hard.**Sử dụng `torchaudio`, trên ESC-50 gấp 1 上训练 một 2D CNN。 báo cáo độ chính xác xác xác thực chéo 5 lần。 thêm SpecAugment(time mask = 20, freq mask = 10)并 báo cáo delta。

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| AudioSet | 音频领域的 ImageNet | Google 的 2M-clip、632-class weakly-labeled YouTube dataset。 |
| ESC-50 | 小型 Classification benchmark | 50 类 × 40 个环境声音片段。 |
| AST | Audio Spectrogram Transformer | log-mel patches 上的 ViT；2021 SOTA。 |
| BEATs | Self-supervised audio | Microsoft 模型，iter3 截至 2026 年领先 AudioSet。 |
| Mixup | 成对 augmentation | `x = λ·x1 + (1-λ)·x2; y = λ·y1 + (1-λ)·y2`。 |
| SpecAugment | 基于 mask 的 augmentation | 将 spectrogram 的随机时间和频率 band 置零。 |
| mAP | 主要 multi-label metric | 跨类别和阈值的 mean average precision。 |

## 延伸阅读

- [Gong, Chung, Glass (2021). AST: Audio Spectrogram Transformer](https://arxiv.org/abs/2104.01778)                                                                                                                                                                                                                                                              
- [Chen et al. (2022, rev. 2024). BEATs: Audio Pre-Training with Acoustic Tokenizers](https://arxiv.org/abs/2212.09058) 2024+ 默认方案──
- [Park et al. (2019). SpecAugment](https://arxiv.org/abs/1904.08779) 主流 tăng âm thanh
- [Piczak (2015). ESC-50 dataset](https://github.com/karolpiczak/ESC-50) 延续至今 của 50 lớp chuẩn 
- [Gemmeke et al. (2017). AudioSet](https://research.google.com/audioset/) Đánh giá YouTube lớp 632; vẫn là tiêu chuẩn vàng。
