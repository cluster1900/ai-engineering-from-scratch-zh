# Résolution sur la coréférence

> Elle lui a fait un appel. Il n'a pas répondu. Médecins sont en train de manger.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 07 (POS & Parsing)
**Time:** ~60 分钟

##  problématique
Il est très difficile de résumer chaque mention d'Apple Inc. 文章写着 Apple 时很简单──写成 the company、the、Cupertino's technology giant或Jobs's firm 时就很难──如果不把这些提及解析到同一实体,你的NER pipeline会错失 60-80% de la mention──

Coreference Resolution 会把所有指向同一个真世界实体的表达链接到一个集群中──它是表层NLP (NER, parsing) 和下游语义任务 (IE,QA,总结,KG) 合剂──

Pourquoi est-ce important en 2026:

- Résumé:Le PDG a annoncé... vs Tim Cook a annoncé...  résumé 应该说出 CEO的名字──
- Réponse à la question: A qui a-t-elle appelé ? 需要解析 她──
- Extraction d'informations: un graphique de connaissances 里同时有 PER1 fondé Apple 和 Jobs fondé Apple 作为不同条目,这是错的──
- La mention dans le même article est une référence croisée de documents.

## 概念
![Coreference clustering: mentions → entities](../assets/coref.svg)

**The task.**输入: un document, 输出:mention, cluster, dont chaque cluster est orienté vers une entité.

**Mention types.**

- **Named entity.**Tim Cook
- **Nominal.**Le PDG, l'entreprise
- **Pronominal.**Il l'a fait.
- **Appositive.**Tim Cook, directeur général d'Apple,

**Architectures.**

1. **Rule-based (Hobbs, 1978).**Basé sur la résolution du pronom de l'arbre syntaxique, utilisez des règles de grammaire.
2. **Mention-pair classifier.**Pour chaque référence, prévoir s'ils sont plus importants.
3. **Mention-ranking.**Pour chaque mention, la liste des candidats a été précédée, y compris la liste des candidats sans précédent.
4. **Span-based end-to-end (Lee et al., 2017).**Le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformateur, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de transformation, le codeur de mise en page d'information, le codeurgence, le codeurgence, le codeurgence, et le codeurgence.
5. **Generative (2024+).**Prompte un LLM:Liste de chaque pronom dans ce texte et son antécédent. 在简单案例上效果不错,但在长文档和少见引用上会吃力──

**The evaluation metrics.**Il y a cinq indicateurs standard (MUC、B3、CEAF、BLANC、LEA), car il n'y a pas un seul indicateur capable de capturer complètement le clusterage de la qualité.

**Known hard cases.**

- description définie de l'entité introduite à plusieurs pages de la page précédente:
- Le pont anaphora les roues → 之前提到一辆车)
- En français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français, en français,
- Cataphora (pronom de l'anglais:**she**Elle est entrée, Mary sourit.


```figure
coref-links
```

## - Je le construis.
### 步骤 1: Coreference neurale prétrainée (AllenNLP / spaCy-expérimental)

```python
import spacy
nlp = spacy.load("en_coreference_web_trf")   # experimental model
doc = nlp("Apple announced new products. The company said they would ship soon.")
for cluster in doc._.coref_clusters:
    print(cluster, "->", [m.text for m in cluster])
```

Dans un document plus long, vous obtiendrez un résultat similaire:
- Cluster 1: [Apple, la société, ils]
- Cluster 2: [nouveaux produits]

### 步骤 2: résolveur pronom sur base de règles (enseignement)

Regardez !`code/main.py`En utilisant uniquement stdlib

1. 抽取 mention: entités nommées (en anglais)  pronoms (en anglais)  recherche directe (en anglais)  descriptions définies (en anglais)  la X) 
2. Pour chaque pronom, voir précédemment K 个 mention,并按以下因素打分:
   - accord de genre/numéro (heuristique)
   - récente ((越近越优)
   - rôle syntaxique (objet prioritaire)
3. 链接最高分前──

Il est impossible de rivaliser avec les modèles neuraux, mais il montre l'espace de recherche, ainsi que le modèle de bout en bout, les décisions à prendre.

### Étape 3: Utilisation des LLM

```python
prompt = f"""Text: {text}

List every pronoun and noun phrase that refers to a person or company.
Cluster them by what they refer to. Output JSON:
[{{"entity": "Apple", "mentions": ["Apple", "the company", "it"]}}, ...]
"""
```

Il faut noter deux modes d'échec.

### 步骤 4: évaluation

标准 conll-2012 script 会计算 MUC、B3、CEAF-φ4,并报告平均值──对于内部 eval,先在带标注的测试集 上做跨度级精度和回忆,再加入提到链接 F1──

## La trappe
- **Singleton explosion.**Certains systèmes vont mettre chaque mention dans leur propre cluster. B3 Comparer avec la capacité.
- **Pronouns in long context.**Œuvre de plus de 2 000 jetons                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
- **Gender assumptions.**硬编码性别规则 会在非二进制参考,组织,动物 上失效──使用学习模型或中立分数──
- **LLM drift on long docs.**单次 API 调用不可靠地对50+ 段落中的提及 聚类──使用滑窗+ merge──

## Utilisez-le
Stack de l'année 2026:

| Situation | Pick |
|-----------|------|
| English, single document | `en_coreference_web_trf` (spaCy-experimental) 或 AllenNLP neural coref |
| Multilingual | 在 OntoNotes 或 Multilingual CoNLL 上训练的 SpanBERT / XLM-R |
| Cross-document event coref | 专门的 end-to-end models（2025–26 SOTA） |
| Quick LLM baseline | 带 structured-output coref prompt 的 GPT-4o / Claude |
| Production dialog systems | Rule-based fallback + neural primary + critical slots 的 manual review |

2026 年能上线的集成模式:先运行 NER,再运行 coref,把 coref clusters 合并进 NER entités。下游任务看到的是每个集团一个实体,而不是每个提到一个实体。

## Je le livre.
保存为 `outputs/skill-coref-picker.md`- Le numéro de la liste:

```markdown
---
name: coref-picker
description: Pick a coreference approach, evaluation plan, and integration strategy.
version: 1.0.0
phase: 5
lesson: 24
tags: [nlp, coref, information-extraction]
---

Given a use case (single-doc / multi-doc, domain, language), output:

1. Approach. Rule-based / neural span-based / LLM-prompted / hybrid. One-sentence reason.
2. Model. Named checkpoint if neural.
3. Integration. Order of operations: tokenize → NER → coref → downstream task.
4. Evaluation. CoNLL F1 (MUC + B³ + CEAF-φ4 average) on held-out set + manual cluster review on 20 documents.

Refuse LLM-only coref for documents over 2,000 tokens without sliding-window merge. Refuse any pipeline that runs coref without a mention-level precision-recall report. Flag gender-heuristic systems deployed in demographically diverse text.
```

## 练习
1. **Easy.**Dans le`code/main.py`Le résolveur basé sur des règles de fonctionnement.
2. **Medium.**Dans un article d'actualité, utilisez un modèle de noyau neuronal prétrainé.
3. **Hard.**构建一个核心的增强NER管道:先 NER,再通过核心的集群 合并──衡量100 篇文章上对NER-only entities-coverage improvement──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mention | 一个 reference | 一段指向某个 entity 的文本（name、pronoun、noun phrase）。 |
| Antecedent | “it” 指向什么 | 后续 mention 与之 corefer 的更早 mention。 |
| Cluster | entity 的 mentions | 全部指向同一个真实世界 entity 的 mention 集合。 |
| Anaphora | 后向 reference | 后续 mention 指向更早内容（“he” → “John”）。 |
| Cataphora | 前向 reference | 更早 mention 指向后续内容（“When he arrived, John...”）。 |
| Bridging | 隐式 reference | “I bought a car. The wheels were bad.”（那辆 car 的 wheels。） |
| CoNLL F1 | leaderboard 上的数字 | MUC、B³、CEAF-φ4 F1 scores 的平均值。 |

## 延伸阅读
- [Jurafsky & Martin, SLP3 Ch. 26 — Coreference Resolution and Entity Linking](https://web.stanford.edu/~jurafsky/slp3/26.pdf) 经典教材章节──
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045) 基于 span de端到端──
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) 改进 coref de la pré-entraînement
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/) référence
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064) méthode classique basée sur des règles
