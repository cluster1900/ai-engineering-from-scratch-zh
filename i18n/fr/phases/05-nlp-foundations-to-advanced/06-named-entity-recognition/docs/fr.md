# Reconnaissance de l'entité nommée

> Pour le faire, il est très simple de trouver un terme.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

##  problématique

"Apple a poursuivi Google pour son accord de recherche sur l'iPhone aux États-Unis". 五个实体:Apple (ORG)  Google (ORG) 、iPhone (PRODUCT) 、search deal(也许算) 、US (GPE) ⋅

NER est chaque article structurée extraire du pipeline  basse puissance 简历解析、合规日志扫描、病历匿名化、搜索查询理解、chatbot 回复的 grounding、法律合同抽取──你几乎看不见它;但你一直依赖它──

Le cours est basé sur des règles, le modèle de développement est le point de départ de ce cours.

## 概念

**BIO tagging**(ou BILOU) 把实体抽取转化为序列标注问题──为每个标注`B-TYPE`(实体开始)`I-TYPE`(en interne) ou `O`(à l'extérieur de tout corps)

```
Apple    B-ORG
sued     O
Google   B-ORG
over     O
its      O
iPhone   B-PRODUCT
search   O
deal     O
in       O
the      O
US       B-GPE
.        O
```

Il y a beaucoup de choses qui se passent.`New B-GPE`- Je suis là.`York I-GPE`- Je suis là.`City I-GPE`❖ Comprendre le modèle de la bio peut être tiré de toute la durée.

架构演进:

- **Rule-based.**Regex + gazetteer 查找──对已知实体精度 高,对新实体覆盖 为零──
- **HMM.**Le modèle de Markov caché, la probabilité d'émission de jetons de la balise, ainsi que la probabilité de transition de la balise vers la balise, le décodeur Viterbi, la formation sur les données de la balise.
- **CRF.**Le champ aléatoire conditionnel── est similaire à HMM, mais appartient au modèle discriminatif, de sorte qu'il peut mélanger des caractéristiques (la forme du mot, la taille de la lettre, le nom du mot) − jusqu'en 2026, il est toujours un élément de production classique dans le Low Resource Deployment.
- **BiLSTM-CRF.**Utilisation de la fonction de la fonction de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur de la personne à l'intérieur.
- **Transformer-based.**Utilisation de la tête de classification des jetons 微调 BERT──准确率最高──计算量最大──


```figure
ner-bio-tagging
```

## - Je le construis.

### 步骤 1: les aides à l'étiquetage de la bio

```python
def spans_to_bio(tokens, spans):
    labels = ["O"] * len(tokens)
    for start, end, label in spans:
        labels[start] = f"B-{label}"
        for i in range(start + 1, end):
            labels[i] = f"I-{label}"
    return labels


def bio_to_spans(tokens, labels):
    spans = []
    current = None
    for i, label in enumerate(labels):
        if label.startswith("B-"):
            if current:
                spans.append(current)
            current = (i, i + 1, label[2:])
        elif label.startswith("I-") and current and current[2] == label[2:]:
            current = (current[0], i + 1, current[2])
        else:
            if current:
                spans.append(current)
                current = None
    if current:
        spans.append(current)
    return spans
```

```python
>>> tokens = ["Apple", "sued", "Google", "over", "iPhone", "sales", "."]
>>> labels = ["B-ORG", "O", "B-ORG", "O", "B-PRODUCT", "O", "O"]
>>> bio_to_spans(tokens, labels)
[(0, 1, 'ORG'), (2, 3, 'ORG'), (4, 5, 'PRODUCT')]
```

### 步骤 2: Caractéristiques fabriquées à la main

Pour le classique, les caractéristiques sont les suivantes:

```python
def token_features(token, prev_token, next_token):
    return {
        "lower": token.lower(),
        "is_upper": token.isupper(),
        "is_title": token.istitle(),
        "has_digit": any(c.isdigit() for c in token),
        "suffix_3": token[-3:].lower(),
        "shape": word_shape(token),
        "prev_lower": prev_token.lower() if prev_token else "<BOS>",
        "next_lower": next_token.lower() if next_token else "<EOS>",
    }


def word_shape(word):
    out = []
    for c in word:
        if c.isupper():
            out.append("X")
        elif c.islower():
            out.append("x")
        elif c.isdigit():
            out.append("d")
        else:
            out.append(c)
    return "".join(out)
```

`word_shape("iPhone")`Retour`xXxxxx`Il y a une autre.`word_shape("USA-2024")`Retour`XXX-dddd`◊ la mode d'écriture pour les noms spéciaux est un haut signal caractéristique.

### 步骤 3: une base de dictionnaire basée sur des règles simples

```python
ORG_GAZETTEER = {"Apple", "Google", "Microsoft", "OpenAI", "Meta", "Amazon", "Netflix"}
GPE_GAZETTEER = {"US", "USA", "UK", "India", "Germany", "France"}
PRODUCT_GAZETTEER = {"iPhone", "Android", "Windows", "ChatGPT", "Claude"}


def rule_based_ner(tokens):
    labels = []
    for token in tokens:
        if token in ORG_GAZETTEER:
            labels.append("B-ORG")
        elif token in GPE_GAZETTEER:
            labels.append("B-GPE")
        elif token in PRODUCT_GAZETTEER:
            labels.append("B-PRODUCT")
        else:
            labels.append("O")
    return labels
```

Il y a des millions d'articles de Wikipédia et de DBpedia 抓取的条目──Couverture 很好──Disambiguation(Compagnie Apple vs 水果 Apple)

### 步骤 4: CRF 步骤(草图, pas réalisé en entier)

Si le sujet n'est pas fondé sur la probabilité, il est impossible de rédiger un CRF complet à partir de zéro avec 50 lignes.`sklearn-crfsuite`- Le numéro de la liste:

```python
import sklearn_crfsuite

def to_features(tokens):
    out = []
    for i, tok in enumerate(tokens):
        prev = tokens[i - 1] if i > 0 else ""
        nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
        out.append({
            "word.lower()": tok.lower(),
            "word.isupper()": tok.isupper(),
            "word.istitle()": tok.istitle(),
            "word.isdigit()": tok.isdigit(),
            "word.suffix3": tok[-3:].lower(),
            "word.shape": word_shape(tok),
            "prev.word.lower()": prev.lower(),
            "next.word.lower()": nxt.lower(),
            "BOS": i == 0,
            "EOS": i == len(tokens) - 1,
        })
    return out


crf = sklearn_crfsuite.CRF(algorithm="lbfgs", c1=0.1, c2=0.1, max_iterations=100, all_possible_transitions=True)
X_train = [to_features(s) for s in sentences_tokenized]
crf.fit(X_train, bio_labels_train)
```

`c1`et `c2`L1 et L2 sont régulièrement régulières.`all_possible_transitions=True`让模型学习非法序列 (par exemple)`O`- Je suis là.`I-ORG`) La probabilité est faible, c'est la CRF qui impose une forme de bio-uniforme sans avoir besoin de votre écriture manuelle.

### Étape 5: BiLSTM-CRF  augmenté

Les caractéristiques sont modifiées en fonction de la taille de la carte de crédit.

```python
import torch
import torch.nn as nn


class BiLSTM_CRF_Head(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_labels):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(hidden_dim * 2, n_labels)

    def forward(self, token_ids):
        e = self.embed(token_ids)
        h, _ = self.lstm(e)
        emissions = self.fc(h)
        return emissions
```

L'utilisation de la CRF`torchcrf.CRF`(Pip install pytorch-crf) ⋅ par rapport à la CRF fabriquée à la main, la taille est mesurable, mais à moins que vous ayez des milliers de points de repère, la taille est généralement plus petite que vous l'espériez ⋅

## Utilisez-le

L'espace est ouvert à la production de NER.

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple sued Google over its iPhone search deal in the US.")
for ent in doc.ents:
    print(f"{ent.text:20s} {ent.label_}")
```

```
Apple                ORG
Google               ORG
iPhone               ORG
US                   GPE
```

Attention !`iPhone`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `ORG`Au lieu de`PRODUCT`,spaCy petit modèle pour la couverture de l'entité produit 较弱──grande modèle(`en_core_web_lg`)表现更好──modèle transformateur(`en_core_web_trf`Je vais être mieux.

NER basé sur le BERT de Hugging Face:

```python
from transformers import pipeline

ner = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
print(ner("Apple sued Google over its iPhone in the US."))
```

```
[{'entity_group': 'ORG', 'word': 'Apple', ...},
 {'entity_group': 'ORG', 'word': 'Google', ...},
 {'entity_group': 'MISC', 'word': 'iPhone', ...},
 {'entity_group': 'LOC', 'word': 'US', ...}]
```

`aggregation_strategy="simple"`Vous aurez des étiquettes de niveau de jeton, et vous devez vous joindre à elles.

### NER à base de LLM (en anglais seulement)

Le NER de licence zéro et de licence de licence de quelques coups est désormais en mesure de s'adapter à des modèles de compétition bien ajustés dans de nombreux domaines; en cas de manque de données de marque, le rendement est nettement meilleur.

- **Zero-shot prompting.**给LLM 一组实体类型和一个示例方案――要求输出 JSON――开箱可用; 在新领域准确率中等――
- **ZeroTuneBio-style prompting.**Le processus de répartition des tâches en extraction de candidats → explication de sens → jugement → ré-vérification.
- **Dynamic prompting with RAG.**Pour chaque appel d'induction, le plus similaire à chaque étiquette de graines de marque est recherché dans un ensemble de petites étiquettes; la construction de quelques tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tentatives de tent
- **Per-entity-type decomposition.**Pour les archives longues, une fois de plus, tous les types de corps sont extraits en même temps.

截至2026年的生产建议: Before gathering training data, first make an LLM zero-shot baseline──很多时候F1 已经足够好,你根本不需要细节调──

### 经典 NER 仍然胜出的地方

Même si des LLM existent déjà, les NER classiques sont toujours en vigueur dans les situations suivantes:

- Budget de latence inférieur à 50 ms.
- Vous avez des milliers d'exemples de marque, et vous avez besoin de 98% + F1
-  domaines ayant une ontologie stable, une formation préalable en CRF ou en BiLSTM 迁移效果良好──
- 监管约束要求 on-premes、非生成式模型──

### Il va manquer à certains endroits.

- **Domain shift.**En tant que NER de formation en CoNLL, il faut être bien ajusté dans votre domaine.
- **Nested entities.**"Bank of America Tower" est également un modèle de système de gestion et de facilité.
- **Long entities.**"Corporation fédérale d'assurance dépôt des États-Unis".`aggregation_strategy`Ou après traitement.
- **Sparse types.**医疗 NER 标签包括 DRUG_BRAND、ADVERSE_EVENT、DOSE。通用模型完全不了解这些──Scispacy 和 BioBERT 是此的起点──

## Je le livre.

保存为 `outputs/skill-ner-picker.md`- Le numéro de la liste:

```markdown
---
name: ner-picker
description: 为给定抽取任务选择合适的 NER 方法。
version: 1.0.0
phase: 5
lesson: 06
tags: [nlp, ner, extraction]
---

给定一个任务描述（领域、标签集、语言、延迟、数据量），输出：

1. 方法。Rule-based + gazetteer、CRF、BiLSTM-CRF，或 transformer fine-tune。
2. 起始模型。命名它（spaCy model ID、Hugging Face checkpoint ID，或 "custom, trained from scratch"）。
3. 标注策略。BIO、BILOU，或 span-based。用一句话说明理由。
4. 评估。使用 `seqeval`。始终报告 entity-level F1（不是 token-level）。

除非用户已经有 pretrained domain model，否则拒绝建议在少于 500 个标注样例上 fine-tuning transformer。如果存在 nested entities，标记为需要 span-based 或 multi-pass models。如果用户提到 "production scale"，且标签与 CoNLL-2003 相同，则要求进行 gazetteer audit。
```

## 练习

1. **Easy.** réaliser `bio_to_spans`(le secteur de l'énergie)`spans_to_bio`Il a été testé en 10 phrases pour vérifier la cohérence du voyage aller-retour.
2. **Medium.**Dans le coNLL-2003 anglais NER dataset 上 тренинг 上的 sklearn-crfsuite CRF。使用 `seqeval`rapport par entité F1──type résultat: ~84 F1──
3. **Hard.**Dans un domaine spécifique, les données de la REN sont affinées dans les domaines médicaux, juridiques ou financiers.`distilbert-base-cased`◊ Avec un modèle de petite taille par rapport à ◊ enregistrer des vérifications de fuites de données,并写下让你意外的发现──

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| NER | 提取名称 | 给 token spans 标注类型（PERSON、ORG、GPE、DATE，...）。 |
| BIO | Tagging scheme | `B-X` 表示开始，`I-X` 表示继续，`O` 表示外部。 |
| BILOU | 更好的 BIO | 增加 `L-X`（last）、`U-X`（unit），让边界更清晰。 |
| CRF | 结构化 classifier | 对 labels 之间的 transitions 建模，而不只是 emissions。强制有效序列。 |
| Nested NER | 重叠实体 | 一个 span 是与其子 span 不同的实体。BIO 无法表达这一点。 |
| Entity-level F1 | 正确的 NER metric | 预测 span 必须与真实 span 完全匹配。Token-level F1 会高估准确率。 |

## 延伸阅读

- [Lample et al. (2016). Neural Architectures for Named Entity Recognition](https://arxiv.org/abs/1603.01360) BiLSTM-CRF 论文──经典──
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805)  Introduction plus tard devenu le standard de la classification des jetons 
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities) `Doc.ents`et `Span`Références pratiques de chaque attribut.
- [seqeval](https://github.com/chakki-works/seqeval)                                                                                                                                                                                                                                                              
