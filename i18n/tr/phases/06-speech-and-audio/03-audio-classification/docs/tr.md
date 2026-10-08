# Ses sınıflandırması  MFCC'den yukarıdaki k-NN'e AST ve BEAT'e

> 狗叫 vs 警笛到这是哪种语言,都属于音频分类──特征是 mels──架构每十年都会变化──评估仍然是AUC、F1 和按类回忆──

**类型：**Yapım
**语言：**Python
**先修要求：**6 · 02 aşaması (Spektrogramlar ve Mel), 3 · 06 aşaması (CNN), 5 · 08 aşaması (Teks için CNN ve RNN)
**时间：**~ 75 dakika

## 问题

Siz bir 10 saniye sesli film aldısınız. Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir? Bu nedir?

核心难点不是网络,而是数据──音频数据集存在严重类别不平衡、强域转移(干净 vs 杂) 和标签噪声(是谁决定城市和餐厅噪音的区别?)──80%'nin sorunu CNN'i Transformer'a dönüştürmek yerine düzenleme、増や評価, 整理、 増やし, 評価, 整理、 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし, 増やし,

## 概念

![Audio classification ladder: k-NN on MFCCs to AST to BEATs](../assets/audio-classification.svg)

**MFCC 上的 k-NN（1990 年代基线）。**按片段展平 MFCC,计算它与带标签样本库的共数相似性,返回顶 K'ın çoğunluk oyları──在干净的小数据集──Speech Commands、ESC-50) 上出乎意料地强──不需要 GPU 即可运行──

**log-mels 上的 2D CNN（2015-2019）。**- Ne ?`(T, n_mels)`log-mel 当作图像处理──应用 ResNet-18 或 VGG-style──对时间轴做全球平均积分──对类别做软max──在大多数 2026年 kaggle 竞赛中,这仍然是基线──

**Audio Spectrogram Transformer, AST（2021-2024）。**Bu, bir videoyu oluşturur ve bir videoyu oluşturur.

**BEATs 和 WavLM-base（2024-2026）。**Bu, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısım olarak, bir kısmına, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmıyla, bir kısmına, bir kısmına, bir kısmına, bir kısmına, bir kısmına, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, bir olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak, olarak

**Whisper-encoder 作为冻结 backbone（2024）。**取 Whisper'ın kodlayıcısını, dekodlayıcısını kaldır, bir çizgi sınıflandırıcıyı kullan.

### 类别不平衡才是真正的挑战

ESC-50:50 类,每类 40 个片段 平衡、简单。UrbanSound8K:10 类,10:1 不平衡。AudioSet:632 类,存在100,000:1 long tail──有效技术包括:

- 訓練時均衡 örnekleme (Balanceli örnekleme)
- Karıştırma: ödemek olarak iki parça ve bir de bir ⇒ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞
- SpecAugment:随机遮盖时间和频率带──简单,但关键──

### 评估

- Çok sınıflı özel(Dediklama Komutları): üst-1 doğruluk、 üst-5 doğruluk。
- 多类多标签(AudioSet、UrbanSound-style): ortalama ortalama hassasiyet (mAP)。
- 严重不平衡: sınıf başına geri çağırma + makro F1。

2026'da bilmen gereken bir şey var.

| Benchmark | Baseline | SOTA 2026 | Source |
|-----------|----------|-----------|--------|
| ESC-50 | 82% (AST) | 97.0% (BEATs-iter3) | BEATs paper (2024) |
| AudioSet mAP | 0.485 (AST) | 0.548 (BEATs-iter3) | HEAR leaderboard 2026 |
| Speech Commands v2 | 98% (CNN) | 99.0% (Audio-MAE) | HEAR v2 results |


```figure
mfcc-pipeline
```

## Yapın onu.

### 步骤1:featurize

```python
def featurize_mfcc(signal, sr, n_mfcc=13, n_mels=40, frame_len=400, hop=160):
    mag = stft_magnitude(signal, frame_len, hop)
    fb = mel_filterbank(n_mels, frame_len, sr)
    mels = apply_filterbank(mag, fb)
    log = log_transform(mels)
    return [dct_ii(frame, n_mfcc) for frame in log]
```

### 步骤 2: sabit uzunluk özet

```python
def summarize(mfcc_frames):
    n = len(mfcc_frames[0])
    mean = [sum(f[i] for f in mfcc_frames) / len(mfcc_frames) for i in range(n)]
    var = [
        sum((f[i] - mean[i]) ** 2 for f in mfcc_frames) / len(mfcc_frames) for i in range(n)
    ]
    return mean + var
```

简单但很强:跨时间的平均 +变化 会为13coef MFCC 得到一个26dim 固定 Embedding──瞬间运行完成──直到2017年, ESC-50 上仍能击败SOTA NN 基线──

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

### Adım 4: CNN'in log-mels'ine yükseltme

PyTorch'te:

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

3M 参数──在单张 RTX 4090 上用约10分训练 ESC-50──精度80%+──

### 步骤 5:2026 默认方案  ince ayarlı BEATs

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

对于Beats,通过 `beats`Kullanım 库`microsoft/BEATs-base`;transformör API'nin şekli aynı

## Kullan

2026 yığın:

| Situation | Start with |
|-----------|-----------|
| Tiny dataset (<1000 clips) | MFCC means 上的 k-NN（你的基线）+ audio augmentation |
| Medium dataset (1K–100K) | BEATs 或 AST fine-tune |
| Large dataset (>100K) | 从头训练或 fine-tune Whisper-encoder |
| Real-time, edge | 40-MFCC CNN，quantized to int8（KWS-style） |
| Multi-label (AudioSet) | BEATs-iter3，配合 BCE loss + mixup + SpecAugment |
| Language ID | MMS-LID, SpeechBrain VoxLingua107 baseline |

决策规则:**从冻结 backbone 开始，而不是新模型**❖Düzgün ayarlama Bir BEATs başı birkaç saat içinde %95 SOTA'ya ulaşabilir.

## - Söyle.

保存为 `outputs/skill-classifier-designer.md`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊                                                                                                                                                                                                                                  

## 练习

1. **Easy.**运行  İşlem`code/main.py`◊ Bu 4 sınıf sentetik veri kümesi üzerinde gerçekleşir.
2. **Medium.**Uzal [mean, var, skew, kurtosis] 替换 `summarize`                                                                                                                                                                                                                                                              
3. **Hard.**Kullanım`torchaudio`, ESC-50 katında 1 上訓練 2D CNN。 rapor 5 kat çapraz doğrulama doğruluğu。追加 SpecAugment(zaman maskası = 20, frekans maskası = 10)并報告 delta。

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

- [Gong, Chung, Glass (2021). AST: Audio Spectrogram Transformer](https://arxiv.org/abs/2104.01778) 20212024 yılının temsilcilik yapısı。
- [Chen et al. (2022, rev. 2024). BEATs: Audio Pre-Training with Acoustic Tokenizers](https://arxiv.org/abs/2212.09058)2024+ 默认方案──
- [Park et al. (2019). SpecAugment](https://arxiv.org/abs/1904.08779) 主流 ses artışı。
- [Piczak (2015). ESC-50 dataset](https://github.com/karolpiczak/ESC-50) 延续至今'in 50 sınıf referansı¬
- [Gemmeke et al. (2017). AudioSet](https://research.google.com/audioset/) 632 sınıfı YouTube taksonomisi; hala altın standarttır。
