# Naturelanguage推理  文本含

> "t implique h" signifie que l'homme qui lit t 后会得出 h 为真结论──NLI est une tâche de prédiction / contradiction / neutralité── sur le dessus sèche, mais qui joue un rôle clé dans la production──

**类型：**Apprendre à apprendre
**语言：**Python
**先修：**La phase 5 · 05 (analyse des sentiments), la phase 5 · 13 (réponse à la question)
**时间：**- 60 minutes

##  problématique

Tu as construit un résumé. Il a généré un résumé. Comment sais-tu que ce résumé ne contient pas d'hallucinations ?

Vous avez construit un chatbot. Il a répondu "oui". Comment savez-vous cette réponse ?

Vous avez besoin de 10 000 articles de presse par sujet. Vous n'avez pas de labels de formation.

Ces trois problèmes peuvent être résumés en Inference du langage naturel.`t`Et une hypothèse`h`- Je suis désolé .`h`C' est de `t`Entraîné, contradictoire ou neutre ?

- **Hallucination check:** `t`= document source,`h`= affirmation sommaire── pas implication = hallucination──
- **Grounded QA:** `t`= passage récupéré,`h`= réponse générée― pas implication = fabrication―
- **Zero-shot classification:** `t`= document,`h`= étiquette verbale ("Il s'agit de sport")―Entraînement = étiquette prévue―

Une tâche, trois usages de production. C'est pourquoi chaque cadre d'évaluation RAG est associé à un modèle NLI.

## 概念

![NLI: three-way classification, premise vs hypothesis](../assets/nli.svg)

**三个 labels。**

- **Entailment.** `t`- Je suis là.`h`"Le chat est sur le tapis" signifie "Il y a un chat".
- **Contradiction.** `t`→`h`"Le chat est sur le tapis" contredit "Il n'y a pas de chat".
- **Neutral.**"Le chat est sur le tapis" à "Le chat a faim".

**不是逻辑 entailment。**NLI est une *déclaration de langue naturelle*, et c'est le contenu que l'on peut tirer de la conclusion de l'humanité, plutôt que de la logique stricte.

**Datasets。**

- **SNLI**(2015)──570k 人工标注对,以图像标题 作为前提──领域较窄──
- **MultiNLI**Il s'agit d'une formation de base de la formation professionnelle.
- **ANLI**(2019) ――NLI antagonistes― humains spécialement élaborés pour frapper les modèles existants―
- **DocNLI, ConTRoL**(202021) ・ Prémissions de longueur de document―测试 multi-hop 和 inférence à longue portée―

**架构。**Un encodeur transformateur (BERT, RoBERTA, DeBERTA)`[CLS] premise [SEP] hypothesis [SEP]`Il y a une autre.`[CLS]`输入到3 way softmax──在 MNLI 上训练,在持久的基准上评估,在分类对上获得90%+精度──

**通过 NLI 做 zero-shot。**给定一个文件 和候选标签,把每个标签 转成一个假设("Ce texte est sur le sport")`zero-shot-classification`Le mécanisme de l'échappement du pipeline


```figure
nli-router
```

## - Je le construis.

### 步骤 1: 运行一个预训练的NLI modèle

```python
from transformers import pipeline

nli = pipeline("text-classification",
               model="facebook/bart-large-mnli",
               top_k=None)  # return all labels; replaces deprecated return_all_scores=True

premise = "The cat is sleeping on the couch."
hypothesis = "There is a cat in the room."

result = nli({"text": premise, "text_pair": hypothesis})[0]
print(result)
# [{'label': 'entailment', 'score': 0.97},
#  {'label': 'neutral', 'score': 0.02},
#  {'label': 'contradiction', 'score': 0.01}]
```

pour les NLI de niveau de production,`facebook/bart-large-mnli`et `microsoft/deberta-v3-large-mnli`Il est également un des principaux acteurs de la série.

### 步骤 2: Classification à tir zéro

```python
zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

text = "The stock market rallied after the central bank cut interest rates."
labels = ["finance", "sports", "politics", "technology"]

result = zs(text, candidate_labels=labels)
print(result)
# {'labels': ['finance', 'politics', 'technology', 'sports'],
#  'scores': [0.92, 0.05, 0.02, 0.01]}
```

默认 template is "Cet exemple est à propos de {label}."―可用 `hypothesis_template`Définition: ne nécessite pas de données de formation: ne nécessite pas de réglage:

### 步骤 3: Vérifiez la fidélité de RAG

```python
def is_faithful(answer, context, threshold=0.5):
    result = nli({"text": context, "text_pair": answer})[0]
    entail = next(s for s in result if s["label"] == "entailment")
    return entail["score"] > threshold
```

C'est le cœur de la fidélité du RAGAS. La réponse générée est divisée en revendications atomiques. Chaque revendication est proportionnelle au contexte retenu par rapport au rapport.

### 步骤 4: Handwriting NLI classifier (conception de l'écriture)

Regardez !`code/main.py`Le jeu est utilisé uniquement par le système de calcul de la valeur de la valeur de l'objet.`{entail, contradict, neutral}`La haute entropie croisée.

## La trappe

- **Hypothesis-only shortcuts.**Les modèles ne font que regarder l'hypothèse de pouvoir obtenir un taux de prédiction d'environ 60% sur le SNLI, car "non""",personne""",ne jamais" est lié à la contradiction.
- **Lexical overlap heuristic.**Les résultats de la recherche ont été obtenus en fonction des résultats obtenus par la Commission.
- **Document-length degradation.**Modèles NLI à phrase unique dans des locaux de document longueurs 上会下降 20+ F1──长上下文应使用 DocNLI-trained models──
- **Zero-shot template sensitivity.**"Cet exemple concerne {label}"、"{label}"、"Le sujet est {label}" 之间可能导致精度 波动 10+ points──需要调优模板──
- **Domain mismatch.**Les études de médecine et de médecine dans les domaines de la formation en anglais général (MnLI) nécessitent des modèles spécialisés de NLI (SciNLI, MedNLI, etc.).

## Utilisez-le

L'étape 2026:

| Use case | Model |
|---------|-------|
| 通用 NLI | `microsoft/deberta-v3-large-mnli` |
| 快速 / edge | `cross-encoder/nli-deberta-v3-base` |
| Zero-shot classification（轻量） | `facebook/bart-large-mnli` |
| Document-level NLI | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Multilingual | `MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli` |
| RAG 中的 hallucination detection | RAGAS / DeepEval 内部的 NLI layer |

Le méta-pattern de 2026: NLI est un modèle de compréhension de texte. Si vous avez besoin de juger si vous approuvez B? ou si vous contredit B? avant de lancer un autre appel à l'LLM, pensez d'abord à NLI.

## Je le livre.

保存为 `outputs/skill-nli-picker.md`- Le numéro de la liste:

```markdown
---
name: nli-picker
description: Pick an NLI model, label template, and evaluation setup for a classification / faithfulness / zero-shot task.
version: 1.0.0
phase: 5
lesson: 21
tags: [nlp, nli, zero-shot]
---

Given a use case (faithfulness check, zero-shot classification, document-level inference), output:

1. Model. Named NLI checkpoint. Reason tied to domain, length, language.
2. Template (if zero-shot). Verbalization pattern. Example.
3. Threshold. Entailment cutoff for the decision rule. Reason based on calibration.
4. Evaluation. Accuracy on held-out labeled set, hypothesis-only baseline, adversarial subset.

Refuse to ship zero-shot classification without a 100-example labeled sanity check. Refuse to use a sentence-level NLI model on document-length premises. Flag any claim that NLI solves hallucination — it reduces it; it does not eliminate it.
```

## 练习

1. **Easy.**Dans 20 个手写的(prémisse, hypothèse, étiquette)`facebook/bart-large-mnli`,覆盖所有三类──测量精度──加入对抗 "subsequence heuristique" traps("Je n'ai pas mangé le gâteau" vs "J'ai mangé le gâteau"), voir si elle va manquer de fonctionnement──
2. **Medium.**Dans les 100 articles de l' AG, les titres des nouvelles`"This text is about {label}"`- Je suis là.`"The topic is {label}"`et `"{label}"` Rapporter le swing de précision
3. **Hard.**Construire un vérificateur de fidélité RAG: décomposition des revendications atomiques + chaque revendication faire des NLI。 dans 50 个带金背景的RAG-generated answers 上评估──测量对人工标签的错阳性和错负率──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| NLI | Natural Language Inference | premise-hypothesis 关系的 3-way classification。 |
| RTE | Recognizing Textual Entailment | NLI 的旧名称；同一任务。 |
| Entailment | "t implies h" | 给定 t，典型读者会得出 h 为真的结论。 |
| Contradiction | "t rules out h" | 给定 t，典型读者会得出 h 为假的结论。 |
| Neutral | "undecided" | 从 t 到 h 双向都无法推断。 |
| Zero-shot classification | NLI as classifier | 把 labels verbalize 成 hypotheses，选择最大 entailment。 |
| Faithfulness | 答案是否有支持？ | 在（retrieved context, generated answer）上做 NLI。 |

## 延伸阅读
- [Bowman et al. (2015). A large annotated corpus for learning natural language inference](https://arxiv.org/abs/1508.05326) SNLI。
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) MultiNLI。
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) Indice de référence ANLI。
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) NLI-as-classifier。
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654) L'année 2026 de la NLI
