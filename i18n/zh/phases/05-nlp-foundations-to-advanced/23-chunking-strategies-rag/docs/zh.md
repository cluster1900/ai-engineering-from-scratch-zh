# 拉格的缩策略

> 断配置对检索质量的影响与嵌入模型的选择一样大 (((Vectara NAACL 2025) ⋅如果断做错了,再多重新排名也救不了。

**类型：**建立
**语言：**字符串
**先修要求：**阶段5 · 14(信息检索),阶段5 · 22(嵌入模式)
**时间：**约60分钟

## 问题

你把一个50页的合同放进RAG系统中.用户问:终止条款是什么?回收器返回封面页面为什么?因为模型是在512个代码块上训练的,而终止条款位于第20页,跨越分页,并且没有把它和查询关联起来的局部关键词.

解决方案不是买一个更好的嵌入式模型. 解决方案是化. 更多?不要重叠? 在哪里分裂?是否带周围上下文?

2026年2月的基准显示出令人惊的结果:

- 微星的2026研究:复发性512代币分断 击败了语义分断,准确率69% → 54%──
- 由于这种情况,我们可以看到一些新的方法.
- 背景悬崖:响应质量在约2,500个背景代币附近急剧下降.

显而易见的答案: 语义分断,20%重叠1000个代币) 通常是错误的. 本课程包括六种策略,

## 概念

![在同一段落上可视化六种 chunking 策略](../assets/chunking.svg)

**Fixed chunking。**每个字符或代币一次切分. 最简单的基线.

**Recursive。**长链的`RecursiveCharacterTextSplitter`首先尝试按`\n\n`分开,再按`\n`按下`.`能干净地倒退.

**Semantic。**嵌入 每个句子――计算相邻句子之间的共数相似性―― 在相似性下降于门的地方分区――保留主题一致性――更慢;有时会产生很小的40个Token 片段,伤害检索――

**Sentence。**按句子边界分开――每个部分 一句子,或 N个句子的窗口――以一小部分成本,在约5k代币内接近语义分断――

**Parent-document。**存储小小的儿童块 用于检查,同时存储更大的父母块 用于上下文──通过孩子检查;返回父母──优雅降级:即使孩子块不好,仍将返回合理的父母──

**Late chunking（2024）。**先在代币级别嵌入整个文档,然后把代币嵌入池成块嵌入.保留跨块的上下文.适用于长文本嵌入器.

**Contextual retrieval（Anthropic，2024）。**给每一个部分 前置一段由LLM 生成的摘要,说明它在文档中的位置( 这部分是终止条款的第3.2节...) ⋅在人类学 自己的基准中带来 35-50% 的检索提升──索引成本高──

### 胜过所有默认值的规则

让分片大小匹配查询类型:

| Query type | Chunk size |
|------------|-----------|
| Factoid（“CEO 的名字是什么？”） | 256-512 tokens |
| Analytical / multi-hop | 512-1024 tokens |
| Whole-section comprehension | 1024-2048 tokens |

据NVIDIA的2026年基准显示,该部分应足够大,能包含答案和局部上下文;也应足够小,让回收器的顶部K集中在答案上,而不是上下文噪音上.


```figure
n5-chunk-cuts
```

## 构建它

### 步骤1:固定和递归的碎片化

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

### 步骤 2:语义分断

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

在你的领域上调优`threshold`高片段化低 一个巨大的块

### 步骤3:父母文件

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

关键洞察:对父母去重.多个孩子可能被映射到同一个父母.全部回归会浪费上下文.

### 步骤4:环境检索

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

索引文本化块――查询时,查询会受益于额外的周围信号――

### 步骤5:评估

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

始终基准. 你的身体的最佳策略可能和任何博客文章都不一致.

## 陷

- **只在 factoid queries 上评估 chunking。**通过查询类型分层的评价组.
- **没有最小尺寸的 semantic chunking。**发出40个标记片段,伤害检索,始终强制执行`min_tokens`,我知道.
- **把 overlap 当作 cargo cult。**2026年研究发现重叠通常带来零收益,但会让索引成本翻倍.
- **没有 min/max 约束。**五个代币或五千个代币的块都会破坏检查.
- **跨 doc chunking。**永远不要让一个块跨越两个文档.

## 使用它

2026 年的堆:

| Situation | Strategy |
|-----------|----------|
| First build, unknown corpus | Recursive, 512 tokens, no overlap |
| Factoid QA | Recursive, 256-512 tokens |
| Analytical / multi-hop | Recursive, 512-1024 tokens + parent-document |
| Heavy cross-reference（contracts, papers） | Late chunking or contextual retrieval |
| Conversational / dialog corpus | Turn-level chunks + speaker metadata |
| Short utterances（tweets, reviews） | One document = one chunk |

从复式512开始──在50查询评估设置 上测量回调@5──然后再调优──

## 交付它

保存为`outputs/skill-chunker.md`其他:

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

1. **Easy。**用固定的512,0) 度复数的512,0) 和递归的512,100) 对一个20页文档进行分片――比较分片数和边界质量――
2. **Medium。**基于5个文档构建一个30个查询评估集――测量递归、语义和父母文档的回忆@5──哪个获胜?它和博客文章的结论一致吗?
3. **Hard。**实现文本检索――测量相对基线递归的MRR提升――报告索引成本 (LLM调用) 与准确率收益――

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
- [Vectara (2024, NAACL 2025). Chunking configurations analysis](https://arxiv.org/abs/2410.13070)分化与嵌入 选择同样重要.
- [Jina AI — Late Chunking in Long-Context Embedding Models (2024)](https://jina.ai/news/late-chunking-in-long-context-embedding-models/)晚上碎的论文.
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)使用LLM 生成的上下文前带来35-50%的检索提升.
- [NVIDIA 2026 chunk-size benchmark — Premai summary](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/) 按查询类型选择部分尺寸──
