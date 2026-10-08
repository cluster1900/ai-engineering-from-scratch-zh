# Classification audio  De la MFCC à la K-NN à AST et BEATs

> De 狗叫 vs 警笛到这是哪种语言,都属于音频分类──特征是 mels──架构每十年都会变化──评估仍然是AUC、F1 和按类回忆──

**类型：**Construction
**语言：**Python
**先修要求：**Phase 6 · 02 (spectrogrammes et mécanismes), phase 3 · 06 (CNN), phase 5 · 08 (CNN et RNN pour le texte)
**时间：**- 75 minutes

##  problématique

Vous avez un film de 10 secondes. Vous savez ce que c'est ?

Le problème principal n'est pas le réseau, mais les données. Il existe une série de changements de domaine sérieux.

## 概念

![Audio classification ladder: k-NN on MFCCs to AST to BEATs](../assets/audio-classification.svg)

**MFCC 上的 k-NN（1990 年代基线）。**按片段展平 MFCC, calculer avec la similitude cosine de la base de données de l'échantillon de marque, retourner la majorité du vote du top K.

**log-mels 上的 2D CNN（2015-2019）。**Je ne sais pas .`(T, n_mels)`Log-mail 当作图像处理──应用 ResNet-18 或 VGG-style──对时间轴做全球平均积分──对类别做软max──在大多数2026年 kaggle 竞赛中, this is still a基线──

**Audio Spectrogram Transformer, AST（2021-2024）。**Pour le logiciel d'apprentissage supervisé, il s'agit du logiciel de logiciel audioSET (en anglais: AudioSet) (en anglais: AudioSet).

**BEATs 和 WavLM-base（2024-2026）。**En effet, les données de votre travail sont généralement utilisées pour la formation de la formation en ligne.

**Whisper-encoder 作为冻结 backbone（2024）。**取 Whisper 的编码器, 取掉 decoder,接一个线性分类器──在语言ID 和简单事件分类 上接近 SOTA,并且不需要音频增强──这是免费午餐基线──

### Le déséquilibre est le vrai défi

ESC-50:50 类, par classe 40 个片段 平衡、简单。UrbanSound8K:10 类,10:1 不平衡。AudioSet:632 类, il existe une longue queue de 100.000:1──有效技术包括:

- 訓練時均衡 échantillonnage(评估时不要)
- Mixup:将两个片段(及其标签) 线性插值作为增强──
- Spécification: Avec le temps et la bande de fréquence.

###  évaluer

- Exclusif pour plusieurs classes: commandes de parole: précision de haut à haut, précision de haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haut à haute précision à haute précision à haute précision à haute précision à haute précision à haute précision à haute précision à haute précision à haute précision à haute précision à haute précision à haute précision à haute précision à haute précision.
-                                                                                                                                                                                                                                                               
- 严重不平衡: rappel par classe + macro F1。

Vous devriez savoir de 2026 chiffres:

| Benchmark | Baseline | SOTA 2026 | Source |
|-----------|----------|-----------|--------|
| ESC-50 | 82% (AST) | 97.0% (BEATs-iter3) | BEATs paper (2024) |
| AudioSet mAP | 0.485 (AST) | 0.548 (BEATs-iter3) | HEAR leaderboard 2026 |
| Speech Commands v2 | 98% (CNN) | 99.0% (Audio-MAE) | HEAR v2 results |


```figure
mfcc-pipeline
```

## - Je le construis.

### 步骤 1: réparer

```python
def featurize_mfcc(signal, sr, n_mfcc=13, n_mels=40, frame_len=400, hop=160):
    mag = stft_magnitude(signal, frame_len, hop)
    fb = mel_filterbank(n_mels, frame_len, sr)
    mels = apply_filterbank(mag, fb)
    log = log_transform(mels)
    return [dct_ii(frame, n_mfcc) for frame in log]
```

### 步骤 2: résumé de la longueur fixe

```python
def summarize(mfcc_frames):
    n = len(mfcc_frames[0])
    mean = [sum(f[i] for f in mfcc_frames) / len(mfcc_frames) for i in range(n)]
    var = [
        sum((f[i] - mean[i]) ** 2 for f in mfcc_frames) / len(mfcc_frames) for i in range(n)
    ]
    return mean + var
```

简单但很强:跨时间的平均 +变化 会为13coef MFCC 得到一个26dim 固定 Embedding──瞬间运行完成──直到2017年, elle est encore en train de vaincre SOTA NN 基线──

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

### Étape 4: mise à niveau à la chaîne de télévision

Dans PyTorch:

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

3M 参数──在单张 RTX 4090 上用约10分钟训练 ESC-50── précision 80%+──

### 步骤 5:2026 默认方案  réglage des battements

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

Pour les battements, par`beats`库使用 `microsoft/BEATs-base`Les transformateurs API ont la même forme.

## Utilisez-le

L'étape 2026:

| Situation | Start with |
|-----------|-----------|
| Tiny dataset (<1000 clips) | MFCC means 上的 k-NN（你的基线）+ audio augmentation |
| Medium dataset (1K–100K) | BEATs 或 AST fine-tune |
| Large dataset (>100K) | 从头训练或 fine-tune Whisper-encoder |
| Real-time, edge | 40-MFCC CNN，quantized to int8（KWS-style） |
| Multi-label (AudioSet) | BEATs-iter3，配合 BCE loss + mixup + SpecAugment |
| Language ID | MMS-LID, SpeechBrain VoxLingua107 baseline |

Règles de décision:**从冻结 backbone 开始，而不是新模型**Une tête de battement peut atteindre 95% de SOTA en quelques heures, plutôt que plusieurs semaines.

## Je le livre.

保存为 `outputs/skill-classifier-designer.md` Pour une classification audio déterminée  tâche de sélection de l'architecture, des augmentations, de la stratégie d'équilibre de classe, et de la métrique d'évaluation

## 练习

1. **Easy.**运行  référencement`code/main.py`◊ Il se trouve dans un ensemble de données synthétiques de 4 classes ([[不同音高的纯调]])
2. **Medium.**Uzal [mean, var, skew, kurtosis] 替换 `summarize`Dans le même ensemble de données synthétiques, le regroupement de 4 moments a-t-il surpassé le mean+var ?
3. **Hard.**Utilisation `torchaudio`, dans le cadre de l'ESC-50 plier 1 上训练一个2D CNN──报告5 fois la précision de la validation croisée──添加规格(时间面具 = 20,频面具 = 10)并报告 delta──

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

- [Gong, Chung, Glass (2021). AST: Audio Spectrogram Transformer](https://arxiv.org/abs/2104.01778) L'architecture représentative de l'année 2021  2024
- [Chen et al. (2022, rev. 2024). BEATs: Audio Pre-Training with Acoustic Tokenizers](https://arxiv.org/abs/2212.09058) 2024+ 默认方案──
- [Park et al. (2019). SpecAugment](https://arxiv.org/abs/1904.08779) L'augmentation audio de la mainstream
- [Piczak (2015). ESC-50 dataset](https://github.com/karolpiczak/ESC-50) 延续至今 du benchmark de 50 classes 
- [Gemmeke et al. (2017). AudioSet](https://research.google.com/audioset/) Taxonomie YouTube de classe 632; encore est un standard d'or.
