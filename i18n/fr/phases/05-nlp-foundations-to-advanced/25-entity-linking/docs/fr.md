# 实体链接与消歧

> NER 找到了 "Paris"──Entité reliant 必須決定:Paris, France?Paris Hilton?Paris, Texas?Paris(Prince de Troie?

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 分钟

##  problématique

"Jordan bat la presse". Tu as dit "Jordan" comme une personne.

- Michael Jordan ?
- Michael B. Jordan ?
- Michael I. Jordan, professeur de médecine de Berkeley, est-ce que cette confusion existe vraiment dans les documents de médecine de base ?
- La Jordanie ?
- Jordan (nom hébreu)?

L'entité liant (EL) va rendre chaque mention résolue à la base de connaissances.

1. **Candidate generation。**Pour "Jordan", quelles sont les entrées KB possibles ?
2. **Disambiguation。**Pour déterminer qui est le candidat le plus réel ?

Les deux étapes peuvent être apprises. Les deux étapes ont un point de référence.

## 概念

![Entity linking pipeline: mention → candidates → disambiguated entity](../assets/entity-linking.svg)

**Candidate generation。**给定 mention surface form (("Jordan"), dans l'index des alias 中查找 candidats。 les dictionnaires des alias de Wikipédia 覆盖大多数命名的实体:"JFK" → John F. Kennedy、Jacqueline Kennedy、JFK airport、JFK(movie)。典型索引 会为每个提名 返回 10-30 个候选人。

**Disambiguation：三种方法。**

1. **Prior + context (Milne & Witten, 2008)。** `P(entity | mention) × context-similarity(entity, text)`◊ Effectivement bon ◊ rapide ◊ pas besoin d'entraînement
2. **Embedding-based (ESS / REL / Blink)。**Encode mention + contexte。Encode Description de chaque candidat。 choix cosine 最大的──2020-2024 年的默认方法──
3. **Generative (GENRE, 2021; LLM-based, 2023+)。**逐 Token décodeur de l'entité du nom canonique── est limité à un tri des noms d'entité valides, donc le输出保证是有效 KB id──

**End-to-end vs pipeline。**现代 models (ELQ、BLINK、ExtEnd、GENRE) dans une seule passe 中运行 NER + génération candidate + désambiguation。 Les systèmes de pipeline sont toujours en production, parce que vous pouvez remplacer les composants。

### 两个 indicateurs

- **Mention recall (candidate gen)。**Le nombre de candidats est de 0,5% en moyenne.
- **Disambiguation accuracy / F1。**Pour les candidats, le top 1 est toujours correct.

始终同时报告两者──一个在80%候选人回忆 上有99%的歧义的系统,本质上是80%的管道──


```figure
gx-entity-linking
```

## - Je le construis.

### 步骤 1: rediriger depuis Wikipedia  créer un index d'alias

```python
alias_to_entities = {
    "jordan": ["Q41421 (Michael Jordan)", "Q810 (Jordan, country)", "Q254110 (Michael B. Jordan)"],
    "paris":  ["Q90 (Paris, France)", "Q663094 (Paris, Texas)", "Q55411 (Paris Hilton)"],
    "apple":  ["Q312 (Apple Inc.)", "Q89 (apple, fruit)"],
}
```

Les données de l'alias de Wikipédia: environ 18 millions de paires 个 (alias, entité) ⋅ de Wikidata dumps 下载──存为 inversé index──

### 步骤 2: Déambiguation basée sur le contexte

```python
def disambiguate(mention, context, alias_index, entity_desc):
    candidates = alias_index.get(mention.lower(), [])
    if not candidates:
        return None, 0.0
    context_words = set(tokenize(context))
    best, best_score = None, -1
    for entity_id in candidates:
        desc_words = set(tokenize(entity_desc[entity_id]))
        union = len(context_words | desc_words)
        score = len(context_words & desc_words) / union if union else 0.0
        if score > best_score:
            best, best_score = entity_id, score
    return best, best_score
```

La superposition de Jaccard est un jouet. Avec des emblèmes.`code/main.py`étape 2):

### 步骤 3: basé sur l'intégration

```python
from sentence_transformers import SentenceTransformer
encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_mention(text, mention_span):
    start, end = mention_span
    marked = f"{text[:start]} [MENTION] {text[start:end]} [/MENTION] {text[end:]}"
    return encoder.encode([marked], normalize_embeddings=True)[0]

def embed_entity(entity_id, description):
    return encoder.encode([f"{entity_id}: {description}"], normalize_embeddings=True)[0]
```

Dans le temps d'index, pour chaque entité KB intégrant une fois. Dans le temps de requête, pour mentionner + intégrer le contexte une fois. Dans le pool de candidats, faire un produit de point, choisir la valeur maximale.

### 步骤 4: entité générative liant ((概念)

GENRE 会逐字符解码实体的维基百科标题──Conditioned decoding(见课 20) 确保只能输出有效标题──它与 KB-backed trie 紧密集成──现代后继是 REL-GEN,以及带结构化输出的LLM-prompted EL──

```python
prompt = f"""Text: {text}
Mention: {mention}
List the best Wikipedia title for this mention.
Respond with JSON: {{"title": "..."}}"""
```

结合 liste blanche `choice`), c'est le pipeline électrique le plus facile de 2026 ans.

### Étape 5: évaluation au niveau de l'AIDA-CoNLL

AIDA-CoNLL est le standard EL référence:1,393 篇 articles Reuters、34k mentions、entités de Wikipédia。 rapport en KB précision(`P@1`) et le taux de détection de NIL hors KB。

## La trappe

- **NIL handling。**Certains mentionnements ne sont pas dans KB.
- **Mention boundary errors。**La banque américaine n'a pas encore fait son choix.
- **Popularity bias。**Les systèmes d'entraînement seront très fréquents.
- **Cross-lingual EL。**Pour mettre en ligne les mentions dans le texte chinois, il faut un codage multilingue ou une étape de traduction.
- **KB staleness。**Les nouveaux produits ne sont pas disponibles sur Wikipedia.

## Utilisez-le

Stack de l'année 2026:

| Situation | Pick |
|-----------|------|
| 通用 English + Wikipedia | BLINK or REL |
| Cross-lingual, KB = Wikipedia | mGENRE |
| LLM-friendly, 少量 mentions/day | Prompt Claude/GPT-4 with candidate list + constrained JSON |
| Domain-specific KB（medical, legal） | Custom BERT with KB-aware retrieval + fine-tune on domain AIDA-style set |
| 极低 latency | Exact-match prior only (Milne-Witten baseline) |
| Research SOTA | GENRE / ExtEnD / generative LLM-EL |

2026 年可上线的生产模式:NER → coref → 对每个提及做EL → 将集群 折叠成每个集群 一个可ноническая实体――输出:document 中每个实体 一个 KB id,而不是每个提及 一个――

## Je le livre.
保存为 `outputs/skill-entity-linker.md`- Le numéro de la liste:

```markdown
---
name: entity-linker
description: Design an entity linking pipeline — KB, candidate generator, disambiguator, evaluation.
version: 1.0.0
phase: 5
lesson: 25
tags: [nlp, entity-linking, knowledge-graph]
---

Given a use case (domain KB, language, volume, latency budget), output:

1. Knowledge base. Wikidata / Wikipedia / custom KB. Version date. Refresh cadence.
2. Candidate generator. Alias-index, embedding, or hybrid. Target mention recall @ K.
3. Disambiguator. Prior + context, embedding-based, generative, or LLM-prompted.
4. NIL strategy. Threshold on top score, classifier, or explicit NIL candidate.
5. Evaluation. Mention recall @ 30, top-1 accuracy, NIL-detection F1 on held-out set.

Refuse any EL pipeline without a mention-recall baseline (you cannot evaluate a disambiguator without knowing candidate gen surfaced the right entity). Refuse any pipeline using LLM-prompted EL without constrained output to valid KB ids. Flag systems where popularity bias affects minority entities (e.g. name-clashes) without domain fine-tuning.
```

## 练习

1. **Easy。**Dans le`code/main.py`Le nombre de personnes concernées est de plus de 30 000 personnes.
2. **Medium。**Utilisation de la phrase transformer encode 50 个 ambiguous mentions。Embed Chaque candidat de description。Comparer la désambiguation basée sur l'embedding 和 Jaccard contexte chevauchement。
3. **Hard。**构建一个1k-entité domaine KB(例如你公司的员工+产品) ――实现端到端 NER + EL──在100 条中延长的句子上测量精度和回忆──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Entity linking (EL) | Link 到 Wikipedia | 将 mention 映射到唯一 KB entry。 |
| Candidate generation | 它可能是谁？ | 为 mention 返回一个 plausible KB entries 的 shortlist。 |
| Disambiguation | 选对的那个 | 使用 context 为 candidates 打分，选择 winner。 |
| Alias index | Lookup table | 从 surface form → candidate entities 的映射。 |
| NIL | 不在 KB 中 | 明确预测没有匹配的 KB entry。 |
| KB | Knowledge base | Wikidata、Wikipedia、DBpedia，或你的 domain KB。 |
| AIDA-CoNLL | Benchmark | 带 gold entity links 的 1,393 篇 Reuters articles。 |

## 延伸阅读
- [Milne, Witten (2008). Learning to Link with Wikipedia](https://www.cs.waikato.ac.nz/~ihw/papers/08-DM-IHW-LearningToLinkWithWikipedia.pdf) préalable fondamental+context 方法。
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) 基于 Embedding 的主力方法──
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) 带 de décoding restreint EL ⋅ génératif
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf) référence 论文。
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969) 开源 production stack。
