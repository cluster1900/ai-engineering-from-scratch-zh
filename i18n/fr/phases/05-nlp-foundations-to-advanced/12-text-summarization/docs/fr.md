# Résumé du texte

> Le système extractif vous dit ce que le document dit. Le système abstractif vous dit ce que l'auteur veut exprimer.

**类型：**Construire
**语言：**Python
**先修：**La phase 5 · 02 (BoW + TF-IDF), la phase 5 · 11 (traduction automatique)
**时间：**- 75 minutes

##  problématique

Un article de 2000 mots dans votre flux. Vous devez saisir son cœur avec 120 mots. Vous pouvez choisir trois phrases les plus importantes dans votre article. Vous pouvez aussi réécrire votre propre article.

La résumé extractive est un problème de rangement.`k`个──输出总是语法正确的, car il est extrait de l'original par mot.

La résumation abstraite est un problème de production. Un transformateur dans les conditions d'entrée produit un nouveau texte.

Le cours se construit sur les deux et montre leur mode d'échec.

## 概念

![Extractive TextRank vs abstractive transformer](../assets/summarization.svg)

**Extractive。**Le texte est considéré comme un graphique, dont les nœuds sont des phrases, les extrémités sont des similitudes.**TextRank**(Mihalcea et Tarau, 2004)

**Abstractive。**Dans les paires de résumé-document, le Pegasus utilise particulièrement l'objectif de pré-entraînement des phrases à la différence, ce qui le rend très adapté à la résumé dans les situations où il n'est pas nécessaire de faire trop de réglage.

Utilisation **ROUGE**(Récommendable-Orienté Enseignement pour l'évaluation de la gisting) évaluation。ROUGE-1 和 ROUGE-2 衡量 unigram 和 bigram overlap。ROUGE-L 衡量最长的常见次序──越高越好,但40 ROUGE-L 算好,50 算例外──每篇论文都会报告这三项──使用 `rouge-score`le paquet


```figure
summarize-collapse
```

## Construction

### 步骤 1: TextRank (extractif)

```python
import math
import re
from collections import Counter


def sentence_split(text):
    return re.split(r"(?<=[.!?])\s+", text.strip())


def similarity(s1, s2):
    w1 = Counter(s1.lower().split())
    w2 = Counter(s2.lower().split())
    intersection = sum((w1 & w2).values())
    denom = math.log(len(w1) + 1) + math.log(len(w2) + 1)
    if denom == 0:
        return 0.0
    return intersection / denom


def textrank(text, top_k=3, damping=0.85, iterations=50, epsilon=1e-4):
    sentences = sentence_split(text)
    n = len(sentences)
    if n <= top_k:
        return sentences

    sim = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                sim[i][j] = similarity(sentences[i], sentences[j])

    scores = [1.0] * n
    for _ in range(iterations):
        new_scores = [1 - damping] * n
        for i in range(n):
            total_out = sum(sim[i]) or 1e-9
            for j in range(n):
                if sim[i][j] > 0:
                    new_scores[j] += damping * sim[i][j] / total_out * scores[i]
        if max(abs(s - ns) for s, ns in zip(scores, new_scores)) < epsilon:
            scores = new_scores
            break
        scores = new_scores

    ranked = sorted(range(n), key=lambda k: scores[k], reverse=True)[:top_k]
    ranked.sort()
    return [sentences[i] for i in ranked]
```

Il y a deux choses à retenir. La fonction de similitude utilise des mots de coïncidence normalisés par jour, c'est le cosine des vecteurs de la page de la page de la page.

### 步骤 2: Utiliser BART faire abstractif

```python
from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

article = """(long news article text)"""

summary = summarizer(article, max_length=120, min_length=60, do_sample=False)
print(summary[0]["summary_text"])
```

BART-grand-CNN dans le corpus CNN/DailyMail 上 ️-tune ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

### 步骤 3: évaluation ROUGE

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
scores = scorer.score(reference_summary, generated_summary)
print({k: round(v.fmeasure, 3) for k, v in scores.items()})
```

始终使用 stemming──否则, "running" 和 "run" 会被算作不同词,ROUGE 会低估──

### ROSS 之外(2026 évaluation résumée)

Depuis deux décennies, ROUGE a toujours été une métrique de résumé dominante, mais en 2026 elle n'est plus utilisée en solo.

- **BERTScore**(semblance d'intégration contextuelle) a été continuellement adoptée en 2023 avant et après, la plupart des documents de résumé sont actuellement publiés en association avec ROUGE.
- **BARTScore**视为世代: selon la probabilité de donner un résumé de BART pré-entraîné dans une source donnée 时 来打分.
- **MoverScore**(enracinements contextuels de la distance du Mover Terre) atteint le premier rang parmi les benchmarks de résumé de 2025, car il est plus efficace que ROUGE pour capturer la superposition sémantique.
- **FactCC**et **QA-based faithfulness**En 2021-2023 année très fréquente, actuellement fréquente **G-Eval**替代(1 GPT-4 prompt chain, par le biais de la pensée de la chaîne de raisonnement à la cohérence, la cohérence, la fluidité, la pertinence 打分)
- **G-Eval**Dans la rubrique "Design Good", les juges de la LLM sont d'environ 80% d'accord avec les juges humains.

Recommandation de production: rapport ROUGE-L utilisé pour la comparaison héréditaire, BERTScore utilisé pour la superposition sémantique, G-Eval utilisé pour la cohérence et la factualité,

### 步骤 4: réalité 问题

Les résumés abstraits sont faciles à créer des hallucinations. Les résumés extractifs sont très peu susceptibles d'être hallucinés, car les sorties sont tirées de la source de la phrase, même si les sources sont mises à jour dans la culture, le temps ou l'erreur de référence, elles peuvent toujours être mal guidées.

Il faut une hallucination.

- **Entity swap。**La source 写是 "John Smith". Résumé 写成 "John Brown".
- **Number drift。**La source 写是 "25.000". Résumé 写成 "25 millions".
- **Polarity flip。**Source 写成 est "rejeté l'offre". Résumé 写成 "accepté l'offre".
- **Fact invention。**La source ne mentionne pas le PDG.

Approches d'évaluation efficaces:

- **FactCC。**Un classifiateur binaire, entraînement objectif est l'implication entre la phrase source et la phrase résumée 。 prédiction factuelle/non factuelle。
- **QA-based factuality。**让QA model 提出答案在源中问题──如果总结 支持不同答案,则标记──
- **Entity-level F1。**Comparer la source avec les entités nommées au sein du résumé.

 Pour tout facteur d'utilisation  important content                                                                                                                                                                                                                                                         

## Utilisation

L'étape 2026:

| Use case | Recommended |
|---------|-------------|
| News, 3-5 sentence summary, English | `facebook/bart-large-cnn` |
| Scientific papers | `google/pegasus-pubmed` or a tuned T5 |
| Multi-document, long-form | Any LLM with 32k+ context, prompted |
| Dialog summarization | `philschmid/bart-large-cnn-samsum` |
| Extractive, low hallucination risk by construction | TextRank or `sumy`'s LSA / LexRank |

En 2026 les LLM dans un long contexte sont généralement plus compétitifs que les modèles spécialisés.

##  édition

保存为 `outputs/skill-summary-picker.md`- Le numéro de la liste:

```markdown
---
name: summary-picker
description: 选择 extractive 或 abstractive、指定 library、factuality check。
version: 1.0.0
phase: 5
lesson: 12
tags: [nlp, summarization]
---

给定一个任务（document type、compliance requirement、length、compute budget），输出：

1. Approach。Extractive 或 abstractive。用一句话解释原因。
2. Starting model / library。写出名称。`sumy.TextRankSummarizer`、`facebook/bart-large-cnn`、`google/pegasus-pubmed`，或一个 LLM prompt。
3. Evaluation plan。ROUGE-1、ROUGE-2、ROUGE-L（使用带 stemming 的 rouge-score）。如果是 abstractive，再加 factuality check。
4. 一个需要探查的 failure mode。Entity swap 是 abstractive news summarization 中最常见的问题；标记 source entities 未出现在 summary 中的 samples。

如果没有 factuality gate，则拒绝对 medical、legal、financial 或 regulated content 使用 abstractive summarization。将超过 model context window 的输入标记为需要 chunked map-reduce summarization（而不是简单 truncation）。
```

## 练习

1. **Easy。**Dans le cadre de la rédaction de la série, le texte est publié en ligne en ligne en ligne.
2. **Medium。**实现 entité-niveau factualité: de source 和 résumé 中抽取命名 entités(spaCy), calculent entités source dans résumé, ainsi que les entités résumé en comparaison avec la source △ haute précision、 faible rappel △ sécurité mais simplement; faible précision △ entités hallucinées。
3. **Hard。**Dans les 50 articles de CNN/DailyMail, la comparaison entre BART-Grande-CNN et un LLM est établie.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Extractive | 选句子 | 从 source 中逐字返回句子。永不 hallucinate。 |
| Abstractive | 重写 | 在 source 条件下生成新文本。可能 hallucinate。 |
| ROUGE | Summary metric | system output 与 reference 之间的 N-gram / LCS overlap。 |
| TextRank | Graph-based extractive | sentence similarity graph 上的 PageRank。 |
| Factuality | 是否正确 | summary claims 是否由 source 支持。 |
| Hallucination | 编造内容 | summary 中 source 不支持的内容。 |

## 延伸阅读

- [Mihalcea and Tarau (2004). TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/) extractif 经典论文。
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training](https://arxiv.org/abs/1910.13461) BART 论文。
- [Zhang et al. (2019). PEGASUS: Pre-training with Extracted Gap-sentences](https://arxiv.org/abs/1912.08777) Pegasus 和 objectif de la phrase à écart
- [Lin (2004). ROUGE: A Package for Automatic Evaluation of Summaries](https://aclanthology.org/W04-1013/)- Le papier rouge.
- [Maynez et al. (2020). On Faithfulness and Factuality in Abstractive Summarization](https://arxiv.org/abs/2005.00661) papier de paysage de la réalité。
