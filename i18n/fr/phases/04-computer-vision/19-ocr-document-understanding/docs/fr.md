# RCR et compréhension des documents

> OCR est un pipeline de trois étapes  检查文字框、识别字符,然后排布它们──每个现代 OCR system 都会重新排序这些阶段,或将它们合并──

**类型：**学习 + 使用
**语言：**Python
**先修要求：**Phase 4 Leçon 06 (détection), phase 7 Leçon 02 (auto-attention)
**时间：**- 45 minutes

## Objectif de l'apprentissage

- 追踪经典 OCR pipeline(detect -> reconnaître -> mise en page) ainsi que moderne bout à bout 替代方案(Donut, Qwen-VL-OCR)
- Pour la formation OCR séquence à séquence  réaliser CTC(Classification temporelle connexioniste) perte
- Utilisation de PaddleOCR ou EasyOCR pour analyser les documents de production, sans formation
- 区分 OCR、layout parsing 和 document understanding,并为每个任务选择正确工具

##  problématique

充满文本的图像 无处不在:收据,发票,ID,扫描书籍,表单,白板,标牌,截图―― 从中提取结构化数据  不仅是字符,而是这是总金额  是价值最高的应用视觉问题之一

Ce domaine est divisé en trois niveaux de compétences:

1. **OCR proper**:把 pixel 转换成 text──
2. **Layout parsing**:把 OCR output 分组为 regions (titre, corps, table, en-tête)
3. **Document understanding**: depuis la mise en page 中提取 champs structurés("facture_total = $42.50")

Chaque couche a des méthodes classiques et des méthodes modernes, et je veux que l'image soit plus grande que ce que la plupart des équipes réalisent.

## 概念

### 经典 pipeline

```mermaid
flowchart LR
    IMG["Image"] --> DET["Text detection<br/>(DB, EAST, CRAFT)"]
    DET --> BOX["Word/line<br/>bounding boxes"]
    BOX --> CROP["Crop each region"]
    CROP --> REC["Recognition<br/>(CRNN + CTC)"]
    REC --> TXT["Text strings"]
    TXT --> LAY["Layout<br/>ordering"]
    LAY --> OUT["Reading-order text"]

    style DET fill:#dbeafe,stroke:#2563eb
    style REC fill:#fef3c7,stroke:#d97706
    style OUT fill:#dcfce7,stroke:#16a34a
```

- **Text detection**Les quadrilatères de la forme de la phrase
- **Recognition**Pour chaque région, couper à hauteur fixe, lancer CNN + BiLSTM + CTC pour générer une séquence de caractères.
- **Layout**Réinitialiser l'ordre de lecture de l'écriture latine pour se haut et bas, de gauche à droite, arabe

### Utiliser un mot pour comprendre le CTC

La reconnaissance OCR se fera à partir d'une carte de fonctionnalités de longueur fixe 生成可变长度序列──CTC(Graves et al., 2006) 让你无需字符级配线 就能训练它──模型在每时间步上输出一个覆盖(语音+空白) de distribution;CTC loss 会对所有配线做边缘化,这些配线在合并重复并移除空白 后会返原为目标文──

```
raw output: "h h h _ _ e e l l _ l l o _ _"
after merge repeats and remove blanks: "hello"
```

CTC est la cause de l'effet du CRN en 2015, et continue de s'entraîner sur la majorité des modèles OCR de production en 2026.

### Modèles modernes de bout en bout

- **Donut**(Kim et coll., 2022)  Un encodeur ViT + un décodeur de texte;读取 image 并直接输出 JSON──没有文字探测器,没有布局模块──
- **TrOCR** Utilisé par le décodeur de transformateur ViT + de l'OCR de niveau de ligne。
- **Qwen-VL-OCR / InternVL** Pour les tâches OCR, des modèles de langage de vision complets sont affinés; en 2026
- **PaddleOCR** Paquet de production mature 中的经典 DB + CRNN pipeline; est encore en source ouverte 主力。

Les modèles de bout en bout ont besoin de plus de données et de calcul, mais ont surpassé l'accumulation d'erreurs de pipelines à plusieurs étapes.

### Partage de la mise en page

对于结构文件,运行布局检测器(LayoutLMv3, DocLayNet),为每个地区 标注标签:Titre, paragraphe, figure, tableau, note de bas de page。Lire l'ordre 于是变成按布局顺序 遍历地区 并拼接──

对于表格,使用 **Key-Value extraction**Les modèles de données sont:

### Mesures d'évaluation

- **Character Error Rate (CER)** Distance de Levenshtein / longueur de référence──越低越好──Objectif de production:干净 scans 上 < 2%──
- **Word Error Rate (WER)**Le niveau de la parole est le même.
- **structured fields 上的 F1** Utilisation des tâches de valeur clé; mesure `{invoice_total: 42.50}`Il est vrai qu'il y a des problèmes.
- **JSON 上的 Edit distance** Utilisé pour l'analyse de documents de bout en bout; le papier de douane  introduit une distance de modification d'arbre normalisée。


```figure
cv3-ctc-collapse
```

## - Je le construis.

### 步骤 1: CTC Perte + décodeur avide

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


def ctc_loss(log_probs, targets, input_lengths, target_lengths, blank=0):
    """
    log_probs:      (T, N, C) log-softmax over vocab including blank at index 0
    targets:        (N, S) int targets (no blanks)
    input_lengths:  (N,) per-sample time steps used
    target_lengths: (N,) per-sample target length
    """
    return F.ctc_loss(log_probs, targets, input_lengths, target_lengths,
                      blank=blank, reduction="mean", zero_infinity=True)


def greedy_ctc_decode(log_probs, blank=0):
    """
    log_probs: (T, N, C) log-softmax
    returns: list of index sequences (blanks removed, repeats merged)
    """
    preds = log_probs.argmax(dim=-1).transpose(0, 1).cpu().tolist()
    out = []
    for seq in preds:
        decoded = []
        prev = None
        for idx in seq:
            if idx != prev and idx != blank:
                decoded.append(idx)
            prev = idx
        out.append(decoded)
    return out
```

`F.ctc_loss`En utilisation de CuDNN de haute efficacité en temps de mise en œuvre, le décodeur avide est plus simple que la recherche par faisceau, généralement différent de celui du CER de 1% en en intérieur.

### 步骤 2: Reconnaisseur de CRNN minuscule

Utilisé sur la ligne OCR du minimum CNN + BiLSTM.

```python
class TinyCRNN(nn.Module):
    def __init__(self, vocab_size=40, hidden=128, feat=32):
        super().__init__()
        self.cnn = nn.Sequential(
            nn.Conv2d(1, feat, 3, 1, 1), nn.BatchNorm2d(feat), nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(feat, feat * 2, 3, 1, 1), nn.BatchNorm2d(feat * 2), nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(feat * 2, feat * 4, 3, 1, 1), nn.BatchNorm2d(feat * 4), nn.ReLU(inplace=True),
            nn.MaxPool2d((2, 1)),
            nn.Conv2d(feat * 4, feat * 4, 3, 1, 1), nn.BatchNorm2d(feat * 4), nn.ReLU(inplace=True),
            nn.MaxPool2d((2, 1)),
        )
        self.rnn = nn.LSTM(feat * 4, hidden, bidirectional=True, batch_first=True)
        self.head = nn.Linear(hidden * 2, vocab_size)

    def forward(self, x):
        # x: (N, 1, H, W)
        f = self.cnn(x)                # (N, C, H', W')
        f = f.mean(dim=2).transpose(1, 2)  # (N, W', C)
        h, _ = self.rnn(f)
        return F.log_softmax(self.head(h).transpose(0, 1), dim=-1)  # (W', N, vocab)
```

La hauteur de l'entrée fixe de la CNN max-pools 会把高度 pressée à 1);; la largeur est la dimension temporelle du CTC;;

### 步骤 3: RCR synthétique

生成白底黑字的数字字符串, utilisé pour le test de fumée de bout en bout

```python
import numpy as np

def synthetic_line(text, height=32, char_width=16):
    W = char_width * len(text)
    img = np.ones((height, W), dtype=np.float32)
    for i, c in enumerate(text):
        x = i * char_width
        shade = 0.0 if c.isalnum() else 0.5
        img[6:height - 6, x + 2:x + char_width - 2] = shade
    return img


def build_batch(strings, vocab):
    H = 32
    W = 16 * max(len(s) for s in strings)
    imgs = np.ones((len(strings), 1, H, W), dtype=np.float32)
    target_lengths = []
    targets = []
    for i, s in enumerate(strings):
        imgs[i, 0, :, :16 * len(s)] = synthetic_line(s)
        ids = [vocab.index(c) for c in s]
        targets.extend(ids)
        target_lengths.append(len(ids))
    return torch.from_numpy(imgs), torch.tensor(targets), torch.tensor(target_lengths)


vocab = ["_"] + list("0123456789abcdefghijklmnopqrstuvwxyz")
imgs, targets, lengths = build_batch(["hello", "world"], vocab)
print(f"images: {imgs.shape}   targets: {targets.shape}   lengths: {lengths.tolist()}")
```

Réel ensemble de données OCR 会添加字体、噪音、旋转、模糊 和色──le pipeline ci-dessus est le même──

### 步骤 4: Essai de formation

```python
model = TinyCRNN(vocab_size=len(vocab))
opt = torch.optim.Adam(model.parameters(), lr=1e-3)

for step in range(200):
    strings = ["abc" + str(step % 10)] * 4 + ["xyz" + str((step + 1) % 10)] * 4
    imgs, targets, target_lens = build_batch(strings, vocab)
    log_probs = model(imgs)  # (W', 8, vocab)
    input_lens = torch.full((8,), log_probs.size(0), dtype=torch.long)
    loss = ctc_loss(log_probs, targets, input_lens, target_lens, blank=0)
    opt.zero_grad(); loss.backward(); opt.step()
```

Dans cette simple données synthétiques, la perte devrait être de 200 étapes à partir de ~3 à ~0.2

## Utilisez-le

条 路径 de production:

- **PaddleOCR** 成熟、快速、多语言──一行用法:`paddleocr.PaddleOCR(lang="en").ocr(image_path)`Il y a une autre.
- **EasyOCR** Python natif 多语言 PyTorch colonne vertébrale
- **Tesseract** 经典方法; on utilise encore les anciens documents de scan dans les modèles qui présentent des difficultés.

Pour l'analyse de documents de bout en bout, utiliser Donut ou VLM:

```python
from transformers import DonutProcessor, VisionEncoderDecoderModel

processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
```

Pour les formulaires recevoir, envoyer et structurer à répéter, doublons à la raffinée, pour les OCR de tout document ou de tout raisonnement, le VLM de Qwen-VL-OCR est actuellement accepté.

## Je le livre.

Le programme de formation

- `outputs/prompt-ocr-stack-picker.md` Une demande, en fonction du type de document, du langage et de la structure  select Tesseract / PaddleOCR / Donut / VLM-OCR。
- `outputs/skill-ctc-decoder.md` Une compétence, va commencer à écrire avide et à rechercher des décodeurs CTC, y compris la normalisation de la longueur.

## 练习

1. **（简单）**Dans les chaînes numériques aléatoires à 5 chiffres, élève le petit CRNN 500 étapes.
2. **（中等）**Utiliser la recherche de faisceaux ((beam_width=5) pour remplacer le décoding avide―rapport CER delta―recherche de faisceaux
3. **（困难）**Dans le cadre de la mise en œuvre de la loi sur les droits de propriété intellectuelle, le PaddleOCR est utilisé pour la mise en œuvre de la loi sur les droits de propriété intellectuelle.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|----------------------|
| OCR | “Text from pixels” | 将 image regions 转换为 character sequences |
| CTC | “Alignment-free loss” | 无需 per-timestep labels 即可训练 sequence model 的 Loss；对 alignments 做 marginalise |
| CRNN | “Classic OCR model” | Conv feature extractor + BiLSTM + CTC；这个 2015 baseline 仍用于 production |
| Donut | “End-to-end OCR” | ViT encoder + text decoder；直接从 image 输出 JSON |
| Layout parsing | “Find regions” | 在 document 中检测并标注 Title/Table/Figure/Paragraph regions |
| Reading order | “Text sequence” | 将 recognised regions 排列成 sentence；对拉丁文字很简单，对 mixed layouts 并不简单 |
| CER / WER | “Error rates” | character 或 word granularity 上的 Levenshtein distance / reference length |
| VLM-OCR | “LLM that reads” | 为 OCR tasks 训练或提示的 vision-language model；当前在复杂 documents 上是 SOTA |

## 延伸阅读

- [CRNN (Shi et al., 2015)](https://arxiv.org/abs/1507.05717) Originaire CNN+RNN+CTC architecture
- [CTC (Graves et al., 2006)](https://www.cs.toronto.edu/~graves/icml_2006.pdf) Originiel papier CTC;密集包含算法思想
- [Donut (Kim et al., 2022)](https://arxiv.org/abs/2111.15664) 无 OCR 的文档理解变压器
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) 开源生产级 OCR pile
