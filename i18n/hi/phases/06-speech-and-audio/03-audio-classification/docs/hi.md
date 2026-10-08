# ऑडियो वर्गीकरण  से MFCC ऊपर के k-NN तक AST और बीएटी

> 狗叫 vs 警笛到这是哪种语言,都属于音频分类──特征是 mels──架构每十年都会变化──评估仍然是AUC、F1 和按类回忆──

**类型：**构建
**语言：**पायथन
**先修要求：**चरण 6 · 02 (स्पेक्ट्रोग्राम और मेल), चरण 3 · 06 (सीएनएन), चरण 5 · 08 (सीएनएन और पाठ के लिए आरएनएन)
**时间：**~ 75 मिनट

## 问题

आप एक 10 सेकंड का वीडियो प्राप्त करते हैं। आप यह जानते हैंः 它是什么? 城市声音(警笛、电钻、狗) 、语音命令(हाँ/नहीं/स्टॉप) 、语言 ID(en/es/ar) 、说话人情绪(愤怒/中立), या पर्यावरण आवाज(室内/室外, बालबुले) 👇 ये सभी *音频 वर्गीकरण* हैं, जबकि 2026 में,基线架构已经成熟:log-mel → CNN या ट्रांसफॉर्मर → softmax──

核心难点不是网络,而是数据――音频数据集存在严重的类别不平衡、强域转移(干净 vs 杂) 和标签噪音(是谁决定城市和餐厅噪音的区别?)──80% का मुद्दा CNN 转换成变压器的整理,增加和评估,而不是把CNN 转换成变压器的问题──

## 概念

![Audio classification ladder: k-NN on MFCCs to AST to BEATs](../assets/audio-classification.svg)

**MFCC 上的 k-NN（1990 年代基线）。**按片段展平 MFCC,计算它与带标签样本库的共数相似性,返回顶部K的多数票――在干净的小数据集――Speech Commands、ESC-50) 上出乎意料地强──不需要GPU 即可运行──

**log-mels 上的 2D CNN（2015-2019）。**`(T, n_mels)`लॉग-मेल 当作图像处理──应用 ResNet-18 अथवा VGG-style──对时间轴做全球平均积分──对类别做软max──在大多数 2026年卡格尔竞赛中,这仍然是基线──

**Audio Spectrogram Transformer, AST（2021-2024）。**यह एक ऑडियोसेट है जो एक वीडियो को जोड़ता है।

**BEATs 和 WavLM-base（2024-2026）。**कई मिलियन घंटे के दौरान स्वयं-निरीक्षण पूर्व प्रशिक्षण करें। आपके मूल आवश्यकताओं के 1-10% के साथ निगरानी डेटा का उपयोग करें।

**Whisper-encoder 作为冻结 backbone（2024）。**取 Whisper 的编码器, 取掉解码器,接一个线性分类器──在语言ID 和简单事件分类 上接近 SOTA,并且不需要音频增强──这是免费午餐基线──

### 类别 असंतुलन ही असली चुनौती है

ESC-50:50 类, प्रति वर्ग 40 个片段 平衡、简单。UrbanSound8K:10 类,10:1 不平衡──AudioSet:632 类,存在 100,000:1 लंबी पूंछ──有效技术包括:

- 訓練時 संतुलित नमूनाकरण (आवेदन समय नहीं)
- मिश्रण:将两个片段(及其标签) 线性插值作为增强──
- स्पेस एगमेंटः随机遮盖时间和频率带──简单,但关键──

### 评估

- बहु-वर्ग विशेष ((भाषण आदेश): शीर्ष-1 सटीकता、 शीर्ष-5 सटीकता。
- 多类多标签(AudioSet、UrbanSound-style):औसत औसत सटीकता (mAP)
- 严重不平衡: प्रति वर्ग रिकॉल + मैक्रो F1──

आप पता होना चाहिए की 2026 संख्याः

| Benchmark | Baseline | SOTA 2026 | Source |
|-----------|----------|-----------|--------|
| ESC-50 | 82% (AST) | 97.0% (BEATs-iter3) | BEATs paper (2024) |
| AudioSet mAP | 0.485 (AST) | 0.548 (BEATs-iter3) | HEAR leaderboard 2026 |
| Speech Commands v2 | 98% (CNN) | 99.0% (Audio-MAE) | HEAR v2 results |


```figure
mfcc-pipeline
```

##  इसे निर्माण

### 步骤 1:featurise

```python
def featurize_mfcc(signal, sr, n_mfcc=13, n_mels=40, frame_len=400, hop=160):
    mag = stft_magnitude(signal, frame_len, hop)
    fb = mel_filterbank(n_mels, frame_len, sr)
    mels = apply_filterbank(mag, fb)
    log = log_transform(mels)
    return [dct_ii(frame, n_mfcc) for frame in log]
```

### 步骤 2: तय लंबाई सारांश

```python
def summarize(mfcc_frames):
    n = len(mfcc_frames[0])
    mean = [sum(f[i] for f in mfcc_frames) / len(mfcc_frames) for i in range(n)]
    var = [
        sum((f[i] - mean[i]) ** 2 for f in mfcc_frames) / len(mfcc_frames) for i in range(n)
    ]
    return mean + var
```

简单但很强:跨时间的平均 +变化 会为13 को夫 MFCC 得到一个26-dimen 固定嵌入──瞬间运行完成──直到2017年, यह ESC-50上仍能击败SOTA NN 基线──

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

### चरण 4: अपग्रेड करने के लिए लॉग-मेल ऊपर CNN

PyTorch में:

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

### 步骤 5:2026 默认方案  ठीक-ट्यून बीएटीएस

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

对于BATs,通过 `beats`库使用 `microsoft/BEATs-base`;ट्रांसफॉर्मर एपीआई का आकार समान है

## इसका उपयोग करें

2026 स्टैकः

| Situation | Start with |
|-----------|-----------|
| Tiny dataset (<1000 clips) | MFCC means 上的 k-NN（你的基线）+ audio augmentation |
| Medium dataset (1K–100K) | BEATs 或 AST fine-tune |
| Large dataset (>100K) | 从头训练或 fine-tune Whisper-encoder |
| Real-time, edge | 40-MFCC CNN，quantized to int8（KWS-style） |
| Multi-label (AudioSet) | BEATs-iter3，配合 BCE loss + mixup + SpecAugment |
| Language ID | MMS-LID, SpeechBrain VoxLingua107 baseline |

决策规则:**从冻结 backbone 开始，而不是新模型**❖ एक बीएटीएस सिर कुछ घंटों में 95% एसओटीए तक पहुंच सकता है, न कि कुछ हफ्तों में

## 交付 यह

保存为 `outputs/skill-classifier-designer.md`◊ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒    ⇒      ⇒ ⇒   ⇒ ⇒             ⇒                                                                                                                                                      

## अभ्यास

1. **Easy.**运行 `code/main.py` यह एक 4 वर्ग सिंथेटिक डेटासेट में होगा भिन्न音高的纯音) ऊपर प्रशिक्षण k-NN MFCC 基线── रिपोर्ट भ्रम मैट्रिक्स──
2. **Medium.**उपयोग [मतलब, var, skew, kurtosis] 替换 `summarize`  एक ही सिंथेटिक डेटा सेट में ऊपर, 4-मॉमेंट पूलिंग क्या mean+var से अधिक जीत गया?
3. **Hard.**उपयोग `torchaudio`, में ESC-50 फोल्ड 1 上 प्रशिक्षण एक 2D CNN── रिपोर्ट 5 गुना क्रॉस-वैलिडेशन सटीकता── जोड़ना स्पेसअगमेंट(टाइम मास्क = 20, आवृत्ति मास्क = 10)并 रिपोर्ट डेल्टा──

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

- [Gong, Chung, Glass (2021). AST: Audio Spectrogram Transformer](https://arxiv.org/abs/2104.01778) 20212024 वर्ष की प्रतिनिधि संरचना
- [Chen et al. (2022, rev. 2024). BEATs: Audio Pre-Training with Acoustic Tokenizers](https://arxiv.org/abs/2212.09058) 2024+ 默认方案──
- [Park et al. (2019). SpecAugment](https://arxiv.org/abs/1904.08779) मुख्य प्रवाह ऑडियो वृद्धि
- [Piczak (2015). ESC-50 dataset](https://github.com/karolpiczak/ESC-50) 延续至今 का 50 वर्ग बेंचमार्क──
- [Gemmeke et al. (2017). AudioSet](https://research.google.com/audioset/) 632 श्रेणी YouTube टैक्सोनोमी; अभी भी स्वर्ण मानक है。
