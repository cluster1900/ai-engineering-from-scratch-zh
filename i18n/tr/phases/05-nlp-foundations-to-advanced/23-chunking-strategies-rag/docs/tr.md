# RAG'in Çunking 策略

> Çunking  Configuration on Checkso Quality's impact with Embedding model's selection is as big ((Vectara NAACL 2025) ◊ Çunking yaparsa hata yaparsa, tekrar yeniden sıralama da yapılmaz.

**类型：**Yapım
**语言：**Python
**先修要求：**5 · 14(Maarif Alım), 5 · 22(Embedding Models)
**时间：**60 dakika kadar .

## 问题

RG sistemine 50 sayfalık bir sözleşme koyun. Kullanıcı soruyor: 终止条款是什么? retriever 返回封面页面──为什么?

解決は買更好的嵌入型──解決は chunking──多大? 複合不要? 在哪里分裂?是否带周围上下文?

2026 yılının 2 ayı  şaşırtıcı sonuçlar gösterdi:

- Vectara'nın 2026 Araştırması: 512-Token Çunking  Yıkmış semantik Çunking,准确率 69% → 54%
- SPLADE + Mistral-8B on Natural Questions 上: overlap  hiç ölçülebilir bir fayda getirmedi
- Konekst klifi:response 质量在约2,500 个 context tokens 附近急剧下降──

                                                                                                                                                                                                                                                              

## 概念

![在同一段落上可视化六种 chunking 策略](../assets/chunking.svg)

**Fixed chunking。**Her N 个字符或代币 切分一次――最简单的基线――会在句子中断――压缩性好,一致性差――

**Recursive。**LangChain'ın `RecursiveCharacterTextSplitter`İlk deneme`\n\n`bölünmüş, yeniden`\n`, tekrar`.`,再按空格──能够干净地倒退──2026 yılının belirgin seçimi──

**Semantic。**Her cümleyi yerleştirmek. Kısaca 40 tonluk bir bölümün oluşması, bir bölümü oluşturmak.

**Sentence。**按句子边界分割──每个句子 一个句子,或 N个句子的窗口──以一小部分成本,在约5k 代币内内接近语义分断──

**Parent-document。**存储小的儿童块 用于检索,同时存储更大的父母块 用于上下文──通过孩子 检索;返回父母──优雅降级: Even child chunks not good, still will return to reasonable parents──

**Late chunking（2024）。**Önceden Token seviyesinde yerleştir 整个文档, sonra Token embedings pool 成 chunk embedings──保留跨 chunk 的上下文──适用于长文本嵌入器(BGE-M3、Jina v3)──计算成本更高──

**Contextual retrieval（Anthropic，2024）。**给每块 前置一段由LLM 生成的摘要,说明它在文档中的位置(Bu parça sona erme hükümlerinin 3.2 bölümünde yer almaktadır...) ◊ Antropic 自己的基准中带来 35-50% 的检索提升──索引成本高──

### Tüm standart kuralları

让 bit size 匹配 sorgu tipi:

| Query type | Chunk size |
|------------|-----------|
| Factoid（“CEO 的名字是什么？”） | 256-512 tokens |
| Analytical / multi-hop | 512-1024 tokens |
| Whole-section comprehension | 1024-2048 tokens |

NVIDIA'nın 2026 referansı, çıklığı çıkça büyük olmalı, cevap ve bölüm üzerinde aşağı yazıyı içerebilir; çıkça küçük olmalı, retriever'in üst-K'sını aşağı yazının gürültüsüne değil, cevap üzerinde odaklanmasını sağlar.


```figure
n5-chunk-cuts
```

## Yapın onu.

### 步骤 1: sabit ve rekürsiv parçalanma

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

### 步骤 2: semantik parçalanma

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

Senin alanında `threshold`太高 → 片段化太低 → 一个巨大的块

### 步骤 3: Ebeveyn belgesi

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

关键洞察: ebeveynlere git. Birçok çocuk aynı ebeveynle birlikte olabilir.

### 步骤 4: bağlamsal geri alım

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

索引文脈化块──查询时,检索会受益额外周围信号──

### 5 adım: değerlendirmek

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

始终基准──你的体育的最佳策略可能和任何博客帖 都不一致──

## 陷

- **只在 factoid queries 上评估 chunking。**Çoklu hop sorguları 会揭示非常不同的优胜者──使用按查询类型 分层的 eval set──
- **没有最小尺寸的 semantic chunking。**40 tane bir parça çıkaracak, yaralanma kontrolü...`min_tokens`- Evet.
- **把 overlap 当作 cargo cult。**2026'da yapılan araştırmalar, birbiriyle örtüşmeyi bulur.
- **没有 min/max 约束。**5 token veya 5000 tokenin parçaları tam olarak kontrol altına alınır.
- **跨 doc chunking。**Bir parça bırakma iki dosyayı geçme.

## Kullan

2026 yılının birimi:

| Situation | Strategy |
|-----------|----------|
| First build, unknown corpus | Recursive, 512 tokens, no overlap |
| Factoid QA | Recursive, 256-512 tokens |
| Analytical / multi-hop | Recursive, 512-1024 tokens + parent-document |
| Heavy cross-reference（contracts, papers） | Late chunking or contextual retrieval |
| Conversational / dialog corpus | Turn-level chunks + speaker metadata |
| Short utterances（tweets, reviews） | One document = one chunk |

Arama sayısı: 50 sorgu değerlendirme seti: 上测量 recall@5。然后再调优。

## - Söyle.

保存为 `outputs/skill-chunker.md`- ...

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

1. **Easy。**Bu, bir 20 sayfalık dosya için bir parça olarak yapılmasını sağlar.
2. **Medium。**5 dosya üzerine kurulmuş 30 sorunun değerlendirme seti oluşturulur.
3. **Hard。** Konekstel geri alımı gerçekleştirmek.

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

- [Yepes et al. / LangChain — Recursive Character Splitting docs](https://python.langchain.com/docs/how_to/recursive_text_splitter/) 生产环境中的默认选择──
- [Vectara (2024, NAACL 2025). Chunking configurations analysis](https://arxiv.org/abs/2410.13070) parçalanma ve yerleştirme  Seçim aynı zamanda önemlidir.
- [Jina AI — Late Chunking in Long-Context Embedding Models (2024)](https://jina.ai/news/late-chunking-in-long-context-embedding-models/) geç kalmak 论文。
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) LLM Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst Üst
- [NVIDIA 2026 chunk-size benchmark — Premai summary](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/) 查询类型 选择 块大小──
