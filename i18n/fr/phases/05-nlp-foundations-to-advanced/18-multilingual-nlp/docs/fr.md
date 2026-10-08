# L'apprentissage de la langue

> Un modèle, plus de 100 langues, dont la plupart ne disposent pas de données d'entraînement.

**Type:** Learn
**Languages:** Python
**先修要求：**La phase 5 · 04 (GloVe, FastText, Subword), la phase 5 · 11 (traduction automatique)
**Time:** ~45 分钟

##  problématique

Il y a des milliards d'échantillons de NLP en anglais avec des étiquettes. Il y en a des milliers en urdu.

Le modèle multilingue est en train de former un modèle en plusieurs langues pour résoudre ce problème. Le partage indique que le modèle peut transférer sa capacité d'apprentissage de la langue à basse source de ressources. L'analyse émotionnelle anglaise permet de peaufiner le modèle, ce qui permet de donner une prédiction émotionnelle assez correcte à l'Urdu.

Ce cours expliquera les mesures de poids et les modèles classiques, ainsi que la décision prise par une équipe qui commence régulièrement à travailler en plusieurs langues:

## 概念

![通过共享多语言 Embedding space 实现跨语言迁移](../assets/multilingual.svg)

**共享词表。**Le mot "SentencePiece" ou "WordPiece Tokenizer" est un mot commun utilisé dans tous les textes de la langue cible.`anti-`Je vais avoir le même jeton.

**共享表示。**Dans plusieurs langues, les expressions similaires à celles du langage masqué sont également exprimées dans les expressions "chat" et "gato" en français.

**Zero-shot 迁移。**Dans une langue (habituellement anglais), le modèle est bien ajusté et fonctionne dans toutes les autres langues supportées par le modèle. Pour les langues de type relativement proches, les résultats sont très forts; pour les langues plus éloignées, les résultats sont moins faibles.

**Few-shot fine-tuning。**En langue cible, ajouter 100 à 500 échantillons avec des étiquettes. Le taux de précision des tâches de catégorie va monter à 95 à 98% de la base de l'anglais.

## 模型

| Model | Year | Coverage | Notes |
|-------|------|----------|-------|
| mBERT | 2018 | 104 languages | 在 Wikipedia 上训练。第一个实用的多语言 LM。低资源语言表现较弱。 |
| XLM-R | 2019 | 100 languages | 在 CommonCrawl 上训练（比 Wikipedia 大得多）。确立了跨语言 baseline。Base 270M，Large 550M。 |
| XLM-V | 2023 | 100 languages | 具有 1M-token 词表的 XLM-R（相比 250k）。低资源语言表现更好。 |
| mT5 | 2020 | 101 languages | 用于多语言生成的 T5 架构。 |
| NLLB-200 | 2022 | 200 languages | Meta 的翻译模型；包含 55 种低资源语言。 |
| BLOOM | 2022 | 46 languages + 13 programming | 以多语言方式训练的开放 176B LLM。 |
| Aya-23 | 2024 | 23 languages | Cohere 的多语言 LLM。在阿拉伯语、印地语、斯瓦希里语上表现强。 |

按用例选择──分类任务可以把XLM-R-base 作为稳定的默认值──生成任务需要根据翻译还是开放生成,在mT5或NLLB 之间选择──LLM 风格工作可以搭配 Aya-23或Claude,并使用明确的多语言提示──

## 源语言决策(2026 研究)

La plupart des équipes utilisent l'anglais comme langue de mise à jour.

La taille des langues est plus élevée que la taille des matières premières. Pour les langues de la population indonésienne, l'indien est plus élevé que l'anglais.**qWALS**Une quantification a été effectuée à ce sujet en 2026 (basée sur les caractéristiques de l'Atlas mondial des structures linguistiques).**LANGRANK**(Lin et coll., ACL 2019) est une autre méthode plus ancienne, qui combine la similitude linguistique, la taille du langage et les relations de parenthèses, pour classer les langues candidates.

Règles pratiques: si votre langue cible a un type de langue à forte affinité, essayez d'abord de la régler, puis de la régler avec l'anglais.


```figure
n5-crosslingual-bridge
```

## Construction

### 步骤 1: tir à zéro 跨语言分类

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tok = AutoTokenizer.from_pretrained("joeddav/xlm-roberta-large-xnli")
model = AutoModelForSequenceClassification.from_pretrained("joeddav/xlm-roberta-large-xnli")


def classify(text, candidate_labels, hypothesis_template="This text is about {}."):
    scores = {}
    for label in candidate_labels:
        hypothesis = hypothesis_template.format(label)
        inputs = tok(text, hypothesis, return_tensors="pt", truncation=True)
        with torch.no_grad():
            logits = model(**inputs).logits[0]
        entail_score = torch.softmax(logits, dim=-1)[2].item()
        scores[label] = entail_score
    return dict(sorted(scores.items(), key=lambda x: -x[1]))


print(classify("I love this product!", ["positive", "negative", "neutral"]))
print(classify("मुझे यह उत्पाद पसंद है!", ["positive", "negative", "neutral"]))
print(classify("J'adore ce produit !", ["positive", "negative", "neutral"]))
```

Un modèle, trois langues, la même API. XLM-R dans le NLI numérique entraînement, par le biais de la ruse d'engagement 能很好地迁移到分类任务.

### 步骤 2: 多语言 Embedding espace

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

pairs = [
    ("The cat is sleeping.", "Le chat dort."),
    ("The cat is sleeping.", "El gato está durmiendo."),
    ("The cat is sleeping.", "Die Katze schläft."),
    ("The cat is sleeping.", "The dog is barking."),
]

for eng, other in pairs:
    emb_eng = model.encode([eng], normalize_embeddings=True)[0]
    emb_other = model.encode([other], normalize_embeddings=True)[0]
    sim = float(np.dot(emb_eng, emb_other))
    print(f"  {eng!r} <-> {other!r}: cos={sim:.3f}")
```

译文会落在嵌入空间 中相近位置――另一句不同的英语句句会落得更远―― c'est la raison pour laquelle la recherche et le regroupement et la similitude peuvent fonctionner――

### 步骤 3: quelques coups de mise à jour

```python
from transformers import TrainingArguments, Trainer
from datasets import Dataset


def few_shot_finetune(base_model, base_tokenizer, examples):
    ds = Dataset.from_list(examples)

    def tokenize_fn(ex):
        out = base_tokenizer(ex["text"], truncation=True, max_length=128)
        out["labels"] = ex["label"]
        return out

    ds = ds.map(tokenize_fn)
    args = TrainingArguments(
        output_dir="out",
        per_device_train_batch_size=8,
        num_train_epochs=5,
        learning_rate=2e-5,
        save_strategy="no",
    )
    trainer = Trainer(model=base_model, args=args, train_dataset=ds)
    trainer.train()
    return base_model
```

 Pour 100 à 500 个目标语言样本,`num_train_epochs=5`et `learning_rate=2e-5`Un taux d'apprentissage plus élevé entraînera la chute de la multilinguisme, ce qui permettra d'obtenir un modèle uniquement en anglais.

## Réellement efficace

- **在 held-out 集上按语言统计准确率。**Ne pas se regrouper.
- **与单语言 baseline 对比。**Pour des langues assez nombreuses, le modèle monolinguiste de formation est parfois supérieur au modèle multilinguiste.
- **Entity-level 测试。**Le système de rédaction de caractères éloignés du latin est généralement moins bien symbolisé.
- **跨语言一致性。**Lorsque deux langues expriment le même sens, elles doivent avoir le même sens.

## Utilisation

2026 技术:

| Task | Recommended |
|-----|-------------|
| Classification, 100 languages | XLM-R-base (~270M) fine-tuned |
| Zero-shot text classification | `joeddav/xlm-roberta-large-xnli` |
| Multilingual sentence embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Translation, 200 languages | `facebook/nllb-200-distilled-600M`（见 lesson 11） |
| Generative multilingual | Claude, GPT-4, Aya-23, mT5-XXL |
| Low-resource language NLP | XLM-V 或在相关高资源语言上做 domain-specific fine-tune |

Si les performances sont importantes, il faut certainement mettre en place des ajustements de langage cibles  pré-reserve budget──Zéro-shot est le point de départ, pas la réponse finale──

### Tokenization 成本(低资源语言会出什么问题)

Le modèle multi-linguiste partage un tokenizer entre toutes les langues. Ce mot est formé sur le langage dominé par l'anglais, le français, le espagnol, le chinois, l'allemand. Pour toute langue en dehors du groupe dominant, trois classes de coûts se superposent:

- **Fertility 成本。**Les textes de langues à faible ressource seront tokenized en plus grand nombre que les textes en anglais. Un texte indien peut avoir besoin d'un token de 3 à 5 fois le prix de la phrase anglaise. Ce texte de 3 à 5 fois va absorber votre fenêtre de texte, votre efficacité de formation et votre budget de retard.
- **变体恢复成本。**Chaque erreur d'orthographe, chaque variation de symbole supplémentaire, chaque réglementation de code unique, chaque changement de taille, se transforme en une séquence de démarrage froide dans l'espace de l'embedding.
- **容量外溢成本。**Les concepts 1 et 2 seront consommés sur la position, la profondeur et la dimension d'embedding.

 Les symptômes réels sont: votre modèle s'entraîne normalement en hindi, la perte de courbe semble correcte, la perplexité égale semble raisonnable, la production de production se produit mais avec des erreurs subtiles.**Tokenizer 坏了，靠扩大数据规模救不回来。**

缓解方式: choisir un tokenizer pour atteindre un objectif de langue  XLM-V 词表表就是直接修复  训练前在 目标文本上验证 टोकenization fertilité  文字表`byte_fallback=True`,GPT-2 风格 BPE de niveau octet), s'assurer qu'il n'y aura jamais de OOV

## 交付

保存为 `outputs/skill-multilingual-picker.md`- Le numéro de la liste:

```markdown
---
name: multilingual-picker
description: 为多语言 NLP 任务选择源语言、目标模型和评估计划。
version: 1.0.0
phase: 5
lesson: 18
tags: [nlp, multilingual, cross-lingual]
---

给定需求（目标语言、任务类型、每种语言可用的带标签数据），输出：

1. Fine-tuning 的源语言。默认英语；如果目标语言有类型学上接近的高资源语言，检查 LANGRANK 或 qWALS。
2. Base model。XLM-R（classification）、mT5（generation）、NLLB（translation）、Aya-23（generative LLM）。
3. Few-shot 预算。如果可用，从 100-500 个目标语言样本开始。只有在标注不可行时才使用 zero-shot。
4. 评估计划。按语言统计准确率（不是聚合）、跨语言一致性、非拉丁文字上的 entity-level F1。

拒绝交付没有按语言评估的多语言模型，因为聚合指标会掩盖长尾失败。将 tokenization 覆盖率低的书写系统（阿姆哈拉语、提格里尼亚语、许多非洲语言）标记为需要带 byte-fallback 的模型（带 byte_fallback=True 的 SentencePiece，或像 GPT-2 一样的 byte-level tokenizer）。
```

## 练习

1. **Easy.**Dans les langues anglaise, française, indienne et arabe, chaque langue a 10 phrases, fonctionne un pipeline de classification à zéro coup de pouce.
2. **Medium.**Utilisation `paraphrase-multilingual-MiniLM-L12-v2`Dans un petit langage mixte, il est possible de créer un référentiel de langue différente.
3. **Hard.**Dans les tâches de classification des langues indiennes, les deux programmes utilisent des échantillons de langues cibles de 500 pour effectuer des ajustements de quelques coups. Le rapport montre quelles langues d'origine ont obtenu un meilleur taux de précision en indiens, ainsi qu'une meilleure production.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Multilingual model | 一个模型，多种语言 | 跨语言共享词表和参数。 |
| Cross-lingual transfer | 在一种语言上训练，在另一种语言上运行 | 在源语言上 fine-tune，在没有目标语言标签的情况下在目标语言上评估。 |
| Zero-shot | 没有目标语言标签 | 不在目标语言上 fine-tune 的迁移。 |
| Few-shot | 少量目标标签 | 用于 fine-tuning 的 100-500 个目标语言样本。 |
| mBERT | 第一个多语言 LM | 在 Wikipedia 上预训练的 104 语言 BERT。 |
| XLM-R | 标准跨语言 baseline | 在 CommonCrawl 上预训练的 100 语言 RoBERTa。 |
| NLLB | Meta 的 200 语言 MT | No Language Left Behind。包含 55 种低资源语言。 |

## 延伸阅读

- [Conneau et al. (2019). Unsupervised Cross-lingual Representation Learning at Scale](https://arxiv.org/abs/1911.02116) XLM-R 论文。
- [Pires, Schlinger, Garrette (2019). How Multilingual is Multilingual BERT?](https://arxiv.org/abs/1906.01502) 开启跨语言迁移研究线的分析论文──
- [Costa-jussà et al. (2022). No Language Left Behind](https://arxiv.org/abs/2207.04672) NLLB-200 论文。
- [Üstün et al. (2024). Aya Model: An Instruction Finetuned Open-Access Multilingual Language Model](https://arxiv.org/abs/2402.07827) Aya,Cohere's Multilingual LLM。
- [Language Similarity Predicts Cross-Lingual Transfer Learning Performance (2026)](https://www.mdpi.com/2504-4990/8/3/65) QWALS / LANGRANK 源语言论文。
