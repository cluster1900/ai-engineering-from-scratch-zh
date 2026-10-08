# 音频分类 从MFCC上升的 k-NN到 AST 和 BEAT

> 从狗叫 VS 警笛到这是哪种语言,都属于音频分类.

**类型：**构建
**语言：**字符串
**先修要求：**阶段6 · 02 (光谱图和MEL),阶段3 · 06 (CNN),阶段5 · 08 (文本的CNN和RNN)
**时间：**七十五分钟

## 问题

你得到了一个10秒音频片段. 你想知道:它是什么?城市声音.

核心难点不是网络,而是数据――音频数据集存在严重的类别不平衡、强域转移(干净 vs 杂) 和标签噪音(是谁决定了城市聊和餐厅噪音的区别?)──80%的问题是整理,增加和评估,而不是把CNN转换为变压器────

## 概念

![Audio classification ladder: k-NN on MFCCs to AST to BEATs](../assets/audio-classification.svg)

**MFCC 上的 k-NN（1990 年代基线）。**按片段展平 MFCC,计算它与标签样本库的共数相似性,返回顶部K的多数投票──在干净的小数据集中(Speech Commands、ESC-50) 上出乎意料地强──不需要GPU 即可运行──

**log-mels 上的 2D CNN（2015-2019）。**让我`(T, n_mels)`对于类别做软max──在大多数2026年卡格尔竞赛中,这仍然是基线──

**Audio Spectrogram Transformer, AST（2021-2024）。**将登录邮件补丁 (例如16×16补丁),添加位置嵌入,并送入ViT──对于监督学习,它是 AudioSet 上的 SOTA(MAP 0.485)──

**BEATs 和 WavLM-base（2024-2026）。**在数百万小时音频上做自主监督预训练――使用你原本需要的监督数据的1-10% 在任务上细节调整――到2026年,这是非语音音频的默认起点――BEATs-iter3 在使用1/4计算的情况下,在AudioSet上比AST高1-2mAP――

**Whisper-encoder 作为冻结 backbone（2024）。**取 Whisper 的编码器,删除解码器,接下来一个线性分类器──在语言ID 和简单事件分类上接近SOTA,并且不需要音频增强──这是免费午餐基线──

### 类别不平衡才是真正的挑战

标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签

- 训练时平衡样本测试 (评估时不要)
- 混合:将两个片段 (将两个片段) 和标签) 线性插值作为增强.
- 频率带和时间遮盖随机.

### 评估

- 专用多级语音命令:最准的1个,最准的5个.
- 多类多标签(AudioSet、UrbanSound-style):平均精度 (mAP) 
- 严重不平衡:每班召回+宏F1──

你应该知道的2026年数字:

| Benchmark | Baseline | SOTA 2026 | Source |
|-----------|----------|-----------|--------|
| ESC-50 | 82% (AST) | 97.0% (BEATs-iter3) | BEATs paper (2024) |
| AudioSet mAP | 0.485 (AST) | 0.548 (BEATs-iter3) | HEAR leaderboard 2026 |
| Speech Commands v2 | 98% (CNN) | 99.0% (Audio-MAE) | HEAR v2 results |


```figure
mfcc-pipeline
```

## 构建它

### 步骤1:表现

```python
def featurize_mfcc(signal, sr, n_mfcc=13, n_mels=40, frame_len=400, hop=160):
    mag = stft_magnitude(signal, frame_len, hop)
    fb = mel_filterbank(n_mels, frame_len, sr)
    mels = apply_filterbank(mag, fb)
    log = log_transform(mels)
    return [dct_ii(frame, n_mfcc) for frame in log]
```

### 步骤2:固定长度总结

```python
def summarize(mfcc_frames):
    n = len(mfcc_frames[0])
    mean = [sum(f[i] for f in mfcc_frames) / len(mfcc_frames) for i in range(n)]
    var = [
        sum((f[i] - mean[i]) ** 2 for f in mfcc_frames) / len(mfcc_frames) for i in range(n)
    ]
    return mean + var
```

简单但很强:跨时间的平均+变异 会为13个 MFCC 得到一个26个维的固定嵌入式――瞬间运行完成――直到2017年,它仍然能在ESC-50上击败SOTA NN基线――

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

### 步骤4:升级到CNN上方的日志

在 PyTorch 中:

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

,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,

### 步骤 5:2026 默认方案 细调 BEATs

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

对于BAT,通过`beats`库使用 `microsoft/BEATs-base`变压器API的形状相同.

## 使用它

根据第1个单元的规定,

| Situation | Start with |
|-----------|-----------|
| Tiny dataset (<1000 clips) | MFCC means 上的 k-NN（你的基线）+ audio augmentation |
| Medium dataset (1K–100K) | BEATs 或 AST fine-tune |
| Large dataset (>100K) | 从头训练或 fine-tune Whisper-encoder |
| Real-time, edge | 40-MFCC CNN，quantized to int8（KWS-style） |
| Multi-label (AudioSet) | BEATs-iter3，配合 BCE loss + mixup + SpecAugment |
| Language ID | MMS-LID, SpeechBrain VoxLingua107 baseline |

决策规则:**从冻结 backbone 开始，而不是新模型**,一个BATs头可以在几小时内达到95%的SOTA,而不是数周.

## 交付它

保存为`outputs/skill-classifier-designer.md`△为给定音频分类 任务选择架构,增长,类平衡策略和评估指标.

## 练习

1. **Easy.**运行`code/main.py`△它会在一个4级合成数据集中进行训练 (不同音高的纯调)  K-NN MFCC 基线――报告混矩阵――
2. **Medium.**用[意思,var, skew,kurtosis] 替换 `summarize`在同一个合成数据集中,4分钟的聚合是否胜过 mean+var?
3. **Hard.**使用 `torchaudio`报告 5 倍的交叉验证准确性──添加规格缩罩= 20,频率罩= 10)并报告三角形罩──

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

- [Gong, Chung, Glass (2021). AST: Audio Spectrogram Transformer](https://arxiv.org/abs/2104.01778) 20212024年代表性架构──
- [Chen et al. (2022, rev. 2024). BEATs: Audio Pre-Training with Acoustic Tokenizers](https://arxiv.org/abs/2212.09058) 2024+ 默认方案
- [Park et al. (2019). SpecAugment](https://arxiv.org/abs/1904.08779) 主流音频增强
- [Piczak (2015). ESC-50 dataset](https://github.com/karolpiczak/ESC-50) 延续至今的50级基准.
- [Gemmeke et al. (2017). AudioSet](https://research.google.com/audioset/) 632级YouTube类别;仍然是黄金标准.
