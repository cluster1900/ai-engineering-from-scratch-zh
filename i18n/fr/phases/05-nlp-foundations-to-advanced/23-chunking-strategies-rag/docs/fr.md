# Réglementation de la RAG

> Le chunking  configure sur l'impact de la qualité des recherches comme le choix du modèle d'intégration  Vectara NAACL 2025) 

**类型：**Construire
**语言：**Python
**先修要求：**Phase 5 · 14(Récupération d'informations),Phase 5 · 22(Modèles d'intégration)
**时间：**À environ 60 minutes.

##  problématique

Vous avez mis un contrat de 50 pages dans le système RAG. Les utilisateurs demandent: qu'est-ce que la résiliation de l'article ?

La solution n'est pas de trouver un meilleur modèle d'intégration. La solution est de se déchiqueter.

Le bilan de février 2026 montre des résultats surprenants:

- Vectara's 2026 研究:recursive 512-Token chunking  battit le chunking sémantique, précision 69% → 54%
- SPLADE + Mistral-8B dans les questions naturelles 上: surlapage   pas apporté aucun bénéfice mesurable 
- Cliff de contexte:response 质量在约2,500 个 context tokens 附近急剧下降──

 évidemment                                                                                                                                                                                                                                                             

## 概念

![在同一段落上可视化六种 chunking 策略](../assets/chunking.svg)

**Fixed chunking。**Chaque N 个字符或代币 切分一次──最简单的基线──会在句子中断──压缩性好,一致性差──

**Recursive。**LangChain `RecursiveCharacterTextSplitter`✿ Précédent`\n\n`Partage, reprise`\n`, à nouveau`.`, repressue le temps libre, et peut être réutilisée pour la reprise.

**Semantic。**Embed Each sentence. 計算相邻句子之间的共性. ⇒ Dans la similitude 低于门的地方分裂. ⇒ Restez sujet cohérence. ⇒

**Sentence。**按句子边界分化──每个句子 一个句子,或 N个句子的窗口──以一小部分成本,在约5k代币以内接近语义分化──

**Parent-document。**存储小的孩子块 用于检索,同时存储更大的父母块 用于上下文──通过孩子 检索;回归父母──优雅降级: Même si les enfants sont mauvais, ils reviendront toujours à leurs parents raisonnables──

**Late chunking（2024）。**Avant de mettre en place le niveau de jeton tout le document, puis de mettre en place le pool de jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, les jetons, etc.

**Contextual retrieval（Anthropic，2024）。**给每块 前置一段由LLM 生成的摘要,说明它在文档中的位置(This piece is section 3.2 of the termination clauses...) ⋅ 在人类 自己的基准中带来 35-50% 的检索提升──索引成本高──

### 胜过所有默认值的规则

让 chunk size 匹配 type de requête:

| Query type | Chunk size |
|------------|-----------|
| Factoid（“CEO 的名字是什么？”） | 256-512 tokens |
| Analytical / multi-hop | 512-1024 tokens |
| Whole-section comprehension | 1024-2048 tokens |

Le benchmark 2026 de NVIDIA.  section  devrait être assez grand, capable de contenir les réponses et les environnements;  aussi devrait être assez petit, pour que le top-K du retriever  se concentre sur les réponses, plutôt que sur le bruit des environnements.


```figure
n5-chunk-cuts
```

## - Je le construis.

### 步骤 1: fractionnement fixe et récursif

```python
def chunk_fixed(text, size=512, overlap=0):
    step = size - overlap
    return [text[i:i + size] for i in range(0, len(text), step)]


def chunk_recursive(text, size=512, seps=("\n\n", "\n", ". ", " ")):
    if len(text) <= size:
        return [text]
    for sep in seps:
        if sep not in text:
            continue
        parts = text.split(sep)
        chunks = []
        buf = ""
        for p in parts:
            if len(p) > size:
                if buf:
                    chunks.append(buf)
                    buf = ""
                chunks.extend(chunk_recursive(p, size=size, seps=seps[1:] or (" ",)))
                continue
            candidate = buf + sep + p if buf else p
            if len(candidate) <= size:
                buf = candidate
            else:
                if buf:
                    chunks.append(buf)
                buf = p
        if buf:
            chunks.append(buf)
        return [c for c in chunks if c.strip()]
    return chunk_fixed(text, size)
```

### 步骤 2: décomposition sémantique

```python
def chunk_semantic(text, encoder, threshold=0.6, min_chars=200, max_chars=2048):
    sentences = split_sentences(text)
    if not sentences:
        return []
    embs = encoder.encode(sentences, normalize_embeddings=True)
    chunks = [[sentences[0]]]
    for i in range(1, len(sentences)):
        sim = float(embs[i] @ embs[i - 1])
        current_len = sum(len(s) for s in chunks[-1])
        if sim < threshold and current_len >= min_chars:
            chunks.append([sentences[i]])
        else:
            chunks[-1].append(sentences[i])

    result = []
    for group in chunks:
        text_group = " ".join(group)
        if len(text_group) > max_chars:
            result.extend(chunk_recursive(text_group, size=max_chars))
        else:
            result.append(text_group)
    return result
```

Dans votre domaine de la qualité`threshold`Il est trop haut, trop bas, trop haut, trop bas, trop bas, trop bas, trop haut.

### 步骤 3: document de parenté

```python
def chunk_parent_child(text, parent_size=2048, child_size=256):
    parents = chunk_recursive(text, size=parent_size)
    mapping = []
    for p_idx, parent in enumerate(parents):
        children = chunk_recursive(parent, size=child_size)
        for child in children:
            mapping.append({"child": child, "parent_idx": p_idx, "parent": parent})
    return mapping


def retrieve_parent(child_query, mapping, encoder, top_k=3):
    child_embs = encoder.encode([m["child"] for m in mapping], normalize_embeddings=True)
    q_emb = encoder.encode([child_query], normalize_embeddings=True)[0]
    scores = child_embs @ q_emb
    top = np.argsort(-scores)[:top_k]
    seen, parents = set(), []
    for i in top:
        if mapping[i]["parent_idx"] not in seen:
            parents.append(mapping[i]["parent"])
            seen.add(mapping[i]["parent_idx"])
    return parents
```

关键洞察: à la fois les parents et les enfants peuvent être transformés en un seul parent;

### 步骤 4: récupération contextuelle (pattern anthropique)

```python
def contextualize_chunks(document, chunks, llm):
    context_prompts = [
        f"""<document>{document}</document>
Here is the chunk to situate: <chunk>{c}</chunk>
Write 50-100 words placing this chunk in the document's context."""
        for c in chunks
    ]
    contexts = llm.batch(context_prompts)
    return [f"{ctx}\n\n{c}" for ctx, c in zip(contexts, chunks)]
```

Les données de référence sont en cours de révision.

### 步骤 5: évaluer

```python
def recall_at_k(queries, corpus_chunks, encoder, k=5):
    chunk_embs = encoder.encode(corpus_chunks, normalize_embeddings=True)
    hits = 0
    for q_text, gold_idxs in queries:
        q_emb = encoder.encode([q_text], normalize_embeddings=True)[0]
        top = np.argsort(-(chunk_embs @ q_emb))[:k]
        if any(i in gold_idxs for i in top):
            hits += 1
    return hits / len(queries)
```

始终基准──你的体育的最佳策略可能和任何博客帖都不一致──

## La trappe

- **只在 factoid queries 上评估 chunking。**Les requêtes multi-hop seront très différentes.
- **没有最小尺寸的 semantic chunking。**Il y aura 40 pièces de code, des contrôles de blessures.`min_tokens`Il y a une autre.
- **把 overlap 当作 cargo cult。**Les résultats de l'étude réalisée en 2026 ont généralement des avantages négatifs, mais permettent de doubler le coût de l'indice.
- **没有 min/max 约束。**5 jetons ou 5000 jetons seront détruits.
- **跨 doc chunking。**Ne laisse jamais un morceau traverser deux documents.

## Utilisez-le

Stack de l'année 2026:

| Situation | Strategy |
|-----------|----------|
| First build, unknown corpus | Recursive, 512 tokens, no overlap |
| Factoid QA | Recursive, 256-512 tokens |
| Analytical / multi-hop | Recursive, 512-1024 tokens + parent-document |
| Heavy cross-reference（contracts, papers） | Late chunking or contextual retrieval |
| Conversational / dialog corpus | Turn-level chunks + speaker metadata |
| Short utterances（tweets, reviews） | One document = one chunk |

Depuis le 512 récursif 开始──在50query eval set 上测量 recall@5──然后再调优──

## Je le livre.

保存为 `outputs/skill-chunker.md`- Le numéro de la liste:

```markdown
---
name: chunker
description: Pick a chunking strategy, size, and overlap for a given corpus and query distribution.
version: 1.0.0
phase: 5
lesson: 23
tags: [nlp, rag, chunking]
---

Given a corpus (document types, avg length, domain) and query distribution (factoid / analytical / multi-hop), output:

1. Strategy. Recursive / sentence / semantic / parent-document / late / contextual. Reason.
2. Chunk size. Token count. Reason tied to query type.
3. Overlap. Default 0; justify if >0.
4. Min/max enforcement. `min_tokens`, `max_tokens` guards.
5. Evaluation plan. Recall@5 on 50-query stratified eval set (factoid, analytical, multi-hop).

Refuse any chunking strategy without min/max chunk size enforcement. Refuse overlap above 20% without an ablation showing it helps. Flag semantic chunking recommendations without a min-token floor.
```

## 练习

1. **Easy。**Il est possible de faire une comparaison de la quantité et de la qualité des limites de l'article.
2. **Medium。**基于 5 文档构建一个30query eval set――测量递归、语义 和 parent-document的回忆@5──哪个获胜?
3. **Hard。** réaliser la récupération contextuelle,  mesurer la RMR de la récursive par rapport à la ligne de base,  augmenter le coût de l'indexation du rapport,  appeler à la LLM,  augmenter le taux de précision,  augmenter le coût de l'indexation du rapport.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Chunk | 文档的一块 | 被 Embedding、索引和检索的子文档单元。 |
| Overlap | 安全余量 | 相邻 chunks 之间共享的 N 个 tokens；在 2026 benchmarks 中通常没用。 |
| Semantic chunking | 智能 chunking | 在相邻句子的 Embedding similarity 下降处 split。 |
| Parent-document | 两级检索 | 检索小的 children，返回更大的 parents。 |
| Late chunking | Embedding 后再 chunk | 在 Token level embed 完整 doc，再 pool 成 chunk vectors。 |
| Contextual retrieval | Anthropic 的技巧 | 在索引前，把 LLM 生成的摘要前置到每个 chunk。 |
| Context cliff | 2500-Token 墙 | RAG 中在约 2.5k context tokens 附近观察到的质量下降（2026 年 1 月）。 |

## 延伸阅读

- [Yepes et al. / LangChain — Recursive Character Splitting docs](https://python.langchain.com/docs/how_to/recursive_text_splitter/)                                                                                                                                                                                                                                                              
- [Vectara (2024, NAACL 2025). Chunking configurations analysis](https://arxiv.org/abs/2410.13070) le déchiquetage et l'intégration  la sélection est tout aussi importante.
- [Jina AI — Late Chunking in Long-Context Embedding Models (2024)](https://jina.ai/news/late-chunking-in-long-context-embedding-models/)- Je suis en retard.
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) Utilisation de l'LLM 生成                                                                                                                                                                                                                                                         
- [NVIDIA 2026 chunk-size benchmark — Premai summary](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/) 按查询类型 选择分量量──
