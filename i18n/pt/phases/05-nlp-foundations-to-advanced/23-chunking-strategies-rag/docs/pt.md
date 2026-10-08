# RAG  Chunking estratégia

> Chunking  configurar o impacto sobre a qualidade da pesquisa é tão grande quanto a seleção do modelo de embutidação  Vectara NAACL 2025)

**类型：**Construir
**语言：**Python
**先修要求：**Fase 5 · 14(Recuperar informações),Fase 5 · 22(Modelos de incorporação)
**时间：**Cerca de 60 minutos

## 问题

Você colocou um contrato de 50 páginas no sistema RAG. Pergunta do usuário: 终止条款是什么? retriever 返回封面页面. 为什么?

 solução não é  comprar um melhor modelo de incorporação                                                                                                                                                                                                                                                        

O índice de referência de Fevereiro de 2026 mostrou resultados surpreendentes:

- Vectara's 2026 研究:recursiva 512-Token Chunking  bateu o chunking semântico, Precisação Rate 69% → 54%
- SPLADE + Mistral-8B em Questões Naturais 上: sobreposição  não traz qualquer benefício a medir.
- Cliff de contexto:response 质量在约2,500 个 context tokens 附近急剧下降──

 Obviamente                                                                                                                                                                                                                                                             

## 概念

![在同一段落上可视化六种 chunking 策略](../assets/chunking.svg)

**Fixed chunking。**Cada N caracteres ou tokens 切分一次──最简单的基线──会在句子中断──压缩性好,一致性差──

**Recursive。**LangChain `RecursiveCharacterTextSplitter`❖ Primeiro tentar`\n\n`dividido, repressão`\n`, re-`.`, re按空格──能够干净地 fallback──2026 年の默认选择──

**Semantic。**Embed Cada frase. 計算相邻句子之间的共平相似性.  在相似性 低于门的地方分分. 保留主题一致性.

**Sentence。**按句子边界分化──每个句子 一个句子,或 N个句子的窗口──以一小部分成本,在约5k tokens 以内接近语义分化──

**Parent-document。**存储小儿块 用于检索,同时存储更大的父母块 用于上下文──通过孩子 检索;返回父母──优雅降级: Mesmo que os filhos não sejam bons, ainda retornarão aos pais razoáveis──

**Late chunking（2024）。**Antes embebedar o nível de Token em todo o arquivo, depois embebedar o conjunto de embeddings de Token em pedaços.

**Contextual retrieval（Anthropic，2024）。**给每块 前置一段由 LLM 生成的摘要,说明它在文档中的位置(This piece is section 3.2 of the termination clauses...) ⋅ em Antropic 自己的基准中带来 35-50% 的检索提升──索引成本高──

### 胜过所有默认值的规则

让 tcunk size 匹配 tipo de consulta:

| Query type | Chunk size |
|------------|-----------|
| Factoid（“CEO 的名字是什么？”） | 256-512 tokens |
| Analytical / multi-hop | 512-1024 tokens |
| Whole-section comprehension | 1024-2048 tokens |

O benchmark de 2026 da NVIDIA. Cunk  deve ser grande o suficiente para conter a resposta e a localização da seguinte página; também deve ser pequeno o suficiente para que o top-K do retriever se concentre na resposta, em vez de no baixo.


```figure
n5-chunk-cuts
```

## Construí-lo

### 步骤 1: fixa e recorrente

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

### 步骤 2: fragmentação semântica

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

Na tua área de atuação`threshold`太高 → 片段化太低 → 一个巨大的块

### 步骤 3: documento de origem

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

关键洞察: para os pais 去重──多个孩子可能映射到同一个父母;全部回归会浪费上下文──

### 步骤 4: recuperação contextual (patrão antropológico)

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

索引文本化块――查询时,检索会受益于额外的周围信号――

### 步骤 5: avaliar

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

## 陷

- **只在 factoid queries 上评估 chunking。**Queries multi-hop 会揭示非常不同的优胜者──使用按查询类型 分层的评测集合──
- **没有最小尺寸的 semantic chunking。**Vai produzir 40 tokens, danos e danos.`min_tokens`- Não.
- **把 overlap 当作 cargo cult。**Os resultados de estudos de 2026 encontram sobreposições que normalmente trazem inúmeros benefícios, mas que permitem que o custo dos índices seja duplicado.
- **没有 min/max 约束。**5 tokens ou 5000 tokens são destruídos.
- **跨 doc chunking。**Nunca deixe um pedaço de documentos cruzarem os dois.

## Use-o

Estaca de 2026:

| Situation | Strategy |
|-----------|----------|
| First build, unknown corpus | Recursive, 512 tokens, no overlap |
| Factoid QA | Recursive, 256-512 tokens |
| Analytical / multi-hop | Recursive, 512-1024 tokens + parent-document |
| Heavy cross-reference（contracts, papers） | Late chunking or contextual retrieval |
| Conversational / dialog corpus | Turn-level chunks + speaker metadata |
| Short utterances（tweets, reviews） | One document = one chunk |

Desde o recorrente 512 開始──在50query eval set 上测量 recall@5──然后再调优──

## Entrega-o

保存为 `outputs/skill-chunker.md`- Não .

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

1. **Easy。**Usado por um conjunto de 20 páginas de documentos.
2. **Medium。**Baseado em 5 documentos, construção de um conjunto de avaliação de 30 perguntas. Messação recorrente, semântica e documento-mãe.
3. **Hard。** Realizar a recuperação contextual.  Medir o MRR 提升对基线递归的 MRR 提升.  Reporting indexing cost.

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

- [Yepes et al. / LangChain — Recursive Character Splitting docs](https://python.langchain.com/docs/how_to/recursive_text_splitter/)  生产环境中的默认选择──
- [Vectara (2024, NAACL 2025). Chunking configurations analysis](https://arxiv.org/abs/2410.13070) Chunking 与 Embedding 选择同样重要──
- [Jina AI — Late Chunking in Long-Context Embedding Models (2024)](https://jina.ai/news/late-chunking-in-long-context-embedding-models/) tarde chunking 论文。
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) Usar LLM 生成的上下文前带来 35-50% de teste de aumento。
- [NVIDIA 2026 chunk-size benchmark — Premai summary](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/) 按查询类型 选择 块大小──
