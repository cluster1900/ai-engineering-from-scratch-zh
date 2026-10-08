# التصنيف الصوتي  من MFCC 上的 k-NN إلى AST 和 BEATs

> من 狗叫 vs 警笛到这是哪种语言,都属于音频分类──特征是 mels──架构每十年都会变化──评估仍然是AUC、F1 和按类回忆──

**类型：**الإنشاء
**语言：**بايثون
**先修要求：**المرحلة 6 · 02 (القطاعات الطيفية والحالة المزيفة) ، المرحلة 3 · 06 (CNNs) ، المرحلة 5 · 08 (CNNs & RNNs for Text)
**时间：**75 دقيقة

## 问题

أنت حصلت على 10 ثانية الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الصوت الص

النقطة الأساسية ليست شبكة، بل بيانات. 音频 DATACET يوجد نوع كبير من عدم التوازن. 强 النطاقات التحول. 干净 vs 杂) و ضجيج العلامات. 是谁决定城市和餐厅噪音的区别?) 80% من المشكلة هي في ترتيب وتزايد وتقييم، بدلا من تحويل CNN إلى Transformer‬.

## 概念

![Audio classification ladder: k-NN on MFCCs to AST to BEATs](../assets/audio-classification.svg)

**MFCC 上的 k-NN（1990 年代基线）。**按片段展平 MFCC,计算它与带标签样本库的共数相似性,返回顶K的多数投票──在干净的小数据集(Speech Commands、ESC-50) 上出乎意料地强──不需要GPU 即可运行──

**log-mels 上的 2D CNN（2015-2019）。**- لا .`(T, n_mels)`لوغ ميل 当作图像处理──应用ResNet-18 أو VGG-style──对时间轴做全球平均积分──对类别做软max──在大多数 2026年 kaggle 竞赛中,这仍然是基线──

**Audio Spectrogram Transformer, AST（2021-2024）。**سوف تصحيح الملفات الموثوقة على الملفات الموثوقة (مثل 16 × 16 ملصقات) ، إضافة إضافة المواقع،并送入 ViT── بالنسبة للتعلم المشرف عليه، فإنه هو AudioSet 上 上的 SOTA(MAP 0.485)──

**BEATs 和 WavLM-base（2024-2026）。**في عدد الملايين من ساعات الصوتية القيام بتدريبات سابقة ذاتية الإشراف. باستخدام 1-10% من البيانات المراقبة التي تحتاجها في الأصل. في المهام على تحسينها. حتى عام 2026 ، هذا هو نقطة البدء المشتركة في المقطع غير الصوتية.

**Whisper-encoder 作为冻结 backbone（2024）。**取 Whisper 的编码器, 取掉 decoder,接一个线性分类器──在语言ID 和简单事件分类 上接近 SOTA,并且不需要音频增强──这是免费午餐基线──

### التفاوت هو التحدي الحقيقي

ESC-50:50 类, لكل 类 40 个片段 平衡、简单。UrbanSound8K:10 类,10:1 不平衡──AudioSet:632 类,存在100,000:1长尾──有效技术包括:

- 訓練時均衡采样 (قياس وقت لا)
- اختلاط: سوف تكون اثنين من المقطع و مع ذلك العلامات
- المواصفات:随机遮盖时间和频率带──简单,但关键──

### 评估

- الحصص متعددة الفئات ((أوامر الكلام): دقة 1 عالية
- 多类多标签(AudioSet、UrbanSound-style): متوسط دقة (mAP)
- 严重不平衡: استدعاء لكل فئة + كلية F1。

يجب أن تعرفي من 2026

| Benchmark | Baseline | SOTA 2026 | Source |
|-----------|----------|-----------|--------|
| ESC-50 | 82% (AST) | 97.0% (BEATs-iter3) | BEATs paper (2024) |
| AudioSet mAP | 0.485 (AST) | 0.548 (BEATs-iter3) | HEAR leaderboard 2026 |
| Speech Commands v2 | 98% (CNN) | 99.0% (Audio-MAE) | HEAR v2 results |


```figure
mfcc-pipeline
```

## بناءها

### 步骤 1: إعادة التأثير

```python
def featurize_mfcc(signal, sr, n_mfcc=13, n_mels=40, frame_len=400, hop=160):
    mag = stft_magnitude(signal, frame_len, hop)
    fb = mel_filterbank(n_mels, frame_len, sr)
    mels = apply_filterbank(mag, fb)
    log = log_transform(mels)
    return [dct_ii(frame, n_mfcc) for frame in log]
```

### الخطوة الثانية: ملخص طول ثابت

```python
def summarize(mfcc_frames):
    n = len(mfcc_frames[0])
    mean = [sum(f[i] for f in mfcc_frames) / len(mfcc_frames) for i in range(n)]
    var = [
        sum((f[i] - mean[i]) ** 2 for f in mfcc_frames) / len(mfcc_frames) for i in range(n)
    ]
    return mean + var
```

简单但很强:跨时间的平均 + 变化 会为13coef MFCC 得到一个26dim 固定 Embedding──瞬间运行完成──直到2017年,它在ESC-50上仍然能击败SOTA NN 基线──

### 步骤 3: ك-ن

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

### الخطوة الرابعة: تحديث إلى "الطبقة"

في "بيتورش"

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

3M 参数──在单张 RTX 4090 上用约 10 分钟训练 ESC-50──精度 80%+──

### 步骤 5:2026 默认方案  تحسينات

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

لـ "بيتس"`beats`库使用 `microsoft/BEATs-base`صيغة مبدئية API نفسها

## استخدمها

2026 كومة:

| Situation | Start with |
|-----------|-----------|
| Tiny dataset (<1000 clips) | MFCC means 上的 k-NN（你的基线）+ audio augmentation |
| Medium dataset (1K–100K) | BEATs 或 AST fine-tune |
| Large dataset (>100K) | 从头训练或 fine-tune Whisper-encoder |
| Real-time, edge | 40-MFCC CNN，quantized to int8（KWS-style） |
| Multi-label (AudioSet) | BEATs-iter3，配合 BCE loss + mixup + SpecAugment |
| Language ID | MMS-LID, SpeechBrain VoxLingua107 baseline |

قواعد القرار:**从冻结 backbone 开始，而不是新模型**❖ التنسيق الجيد رأس واحد يمكن أن يصل إلى 95% SOTA في ساعات قليلة، بدلا من عدد الأسابيع

## 交付 it

保存为 `outputs/skill-classifier-designer.md` لتصنيف الصوت المحدد 任务选择架构、增幅、阶级平衡策略 和评估 метриك‬

## التدريب

1. **Easy.**运行 `code/main.py`◊ انها سوف تكون في مجموعة بيانات اصطناعية من 4 فئة (不同音高的纯音) على التدريب k-NN MFCC 基线―― تقرير المصفوفة الارتباك
2. **Medium.**用 [معنى، var، منحرف، كورتوس] 替换 `summarize`في نفس مجموعة بيانات اصطناعية على، 4 اللحظة تجمع هل فاز على المتوسط+var؟
3. **Hard.**استخدام `torchaudio`، في ESC-50 طي 1 上訓練 a 2D CNN── تقرير دقة التحقق المتقاطع 5 مرات── إضافة SpecAugment(قناع الزمن = 20، قناع التردد = 10)并 تقرير دلتا──

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

- [Gong, Chung, Glass (2021). AST: Audio Spectrogram Transformer](https://arxiv.org/abs/2104.01778) 20212024 سنة تمثيلية بنية
- [Chen et al. (2022, rev. 2024). BEATs: Audio Pre-Training with Acoustic Tokenizers](https://arxiv.org/abs/2212.09058) 2024+ 默认方案──
- [Park et al. (2019). SpecAugment](https://arxiv.org/abs/1904.08779) 主流 إضافة الصوت
- [Piczak (2015). ESC-50 dataset](https://github.com/karolpiczak/ESC-50) 延续至今50 درجة مقياسة
- [Gemmeke et al. (2017). AudioSet](https://research.google.com/audioset/) 632 الفئة تصنيف يوتيوب؛ لا يزال هو معيار الذهب
