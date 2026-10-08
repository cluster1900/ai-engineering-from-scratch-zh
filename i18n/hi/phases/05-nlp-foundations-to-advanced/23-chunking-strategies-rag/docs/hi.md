# RAG की चंकिंग 策略

> चकनाचुरण 配置对检索质量的影响与嵌入模型的选择一样大(Vectara NAACL 2025) 👇 यदि चकनाचुरण गलत हो गया है, तो फिर से पुनः रैंक भी नहीं किया गया है。

**类型：**निर्माण
**语言：**पायथन
**先修要求：**चरण 5 · 14(सूचना प्राप्त करना),चरण 5 · 22(इम्बेडिंग मॉडल)
**时间：**≈ 60 मिनट

## 问题

आपने एक 50 पन्नों का अनुबंध RAG 系统 में डाला है। उपयोगकर्ता प्रश्नः 终止条款是什么? retriever 返回封面页面──为什么? चूंकि मॉडल 512-Token टुकड़े में प्रशिक्षित है, जबकि समाप्ति条款 20 पन्नों पर स्थित है, विभाजन पृष्ठ के पार है, और इसे और क्वेरी 关联 उत्पन्न स्थानिक कीवर्ड में नहीं रखा गया है।

 समाधान  खरीदें एक बेहतर एम्बेडिंग मॉडल                                                                                                                                                                                                                                                         

2026 के फरवरी के बेंचमार्क ने आश्चर्यजनक परिणाम दिखाएः

- वेक्टरा का 2026 अध्ययन:रिकर्सिव 512-टोकन चकमिंग  सेमेटिक चकमिंग को हराया, सटीकता दर 69% → 54%
- SPLADE + मिस्ट्रल-8B में प्राकृतिक प्रश्न 上: ओवरलैप  कोई भी मापने योग्य लाभ नहीं लाया
- संदर्भ क्लिफ: प्रतिक्रिया 质量在约 2,500 个 संदर्भ टोकन 附近急剧下降──

 स्पष्ट स्पष्ट  का उत्तर  अर्थिक टुकड़ा करना  20% ओवरलैप  1000 टोकन) आमतौर पर गलत है  इस कक्षा में छह प्रकार के तरीके हैं  सीधेपन का निर्माण करने के लिए, और आपको बताएं कि किस समय किस प्रकार का उपयोग करना है 

## 概念

![在同一段落上可视化六种 chunking 策略](../assets/chunking.svg)

**Fixed chunking。**प्रत्येक N 个字符或代币 切分一次──最简单的基线──会在句子中断──压缩性好,一致性差──

**Recursive。**लैंगचेन की `RecursiveCharacterTextSplitter`✿ पहले प्रयास करें`\n\n`विभाजित, पुनः按 `\n`, पुनः按 `.`, पुनः按空格──能够干净地倒退──2026 साल का默认选择──

**Semantic。**प्रत्येक वाक्य में सम्मिलित करें। गणना करें आसन्न वाक्य के बीच कॉसिन समानताएँ। समानता में तुल के नीचे स्थानिक विभाजनों को सम्मिलित करें। विषय की संरेखण को बनाए रखें।

**Sentence。**按句子边界分化── प्रत्येक टुकड़ा एक वाक्य, या N 个句子的窗口──以一小部分成本,在约5k टोकन以内接近语义分化──

**Parent-document。** भंडारण छोटे बच्चे के टुकड़े खोज के लिए उपयोग किए जाते हैं, साथ ही बड़े माता-पिता के टुकड़े खोज के लिए उपयोग किए जाते हैं।

**Late chunking（2024）。**पहले टोकन स्तर एम्बेड करें  संपूर्ण文档, फिर टोकन एम्बेडिंग पूल को 成 टुकड़ा एम्बेडिंग करें──保留跨 टुकड़ा के上下文── दीर्घ संदर्भ एम्बेडरों के लिए उपयुक्त(BGE-M3、Jina v3)──计算成本更高──

**Contextual retrieval（Anthropic，2024）。**यह खंड समाप्ति खंडों के अनुभाग 3.2 है...)                                                                                                                                                                                                                                                       

### 胜过所有默认值的规则

让 टुकड़ा आकार 匹配 क्वेरी प्रकारः

| Query type | Chunk size |
|------------|-----------|
| Factoid（“CEO 的名字是什么？”） | 256-512 tokens |
| Analytical / multi-hop | 512-1024 tokens |
| Whole-section comprehension | 1024-2048 tokens |

NVIDIA का 2026 बेंचमार्क  टुकड़ा  पर्याप्त बड़ा होना चाहिए, जो उत्तर और स्थान पर नीचे के पाठ को शामिल कर सके;  पर्याप्त छोटा होना चाहिए, जिससे रिट्रीवर का शीर्ष-के उत्तर पर ध्यान केंद्रित करे, न कि नीचे के शोर पर


```figure
n5-chunk-cuts
```

##  इसे निर्माण

### 步骤 1: स्थिर और पुनरावर्ती टुकड़े टुकड़े

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

### 步骤 2: अर्थिक टुकड़ा

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

अपने क्षेत्र में अनुकूलन`threshold`  片段化                                                                                                                                                                                                                                                          

### 步骤 3: अभिभावक दस्तावेज

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

关键洞察: माता-पिता के लिए 去重──多个孩子可能映射到同一个父母;全部回归会浪费上下文──

### 步骤 4: संदर्भिक निकासी

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

索引 संदर्भित टुकड़े 查询时,检索会受益额外的周围信号

### 步骤 5: मूल्यांकन

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

始终基准──你的体育的最佳策略可能和任何博客文章都不一致──

## 陷

- **只在 factoid queries 上评估 chunking。**मल्टी-हॉप क्वेरी 会揭示非常不同的优胜者──使用按查询类型 分层的评价集合──
- **没有最小尺寸的 semantic chunking。**40 टोकन के टुकड़े उत्पन्न होंगे, चोटों की जांच होगी,`min_tokens`
- **把 overlap 当作 cargo cult。**2026 में, शोध में पाया गया कि ओवरलैप आमतौर पर शून्य लाभ लाता है, लेकिन यह सूचकांक लागत को दोगुना कर देगा।
- **没有 min/max 约束。**5 टोकन या 5000 टोकन के टुकड़े नष्ट कर देंगे जांच कर रहे हैं।
- **跨 doc chunking。**永远不要让一个块 跨越两个文档──始终按docchunking,然后再合并──

## इसका उपयोग करें

2026 वर्ष का स्टैकः

| Situation | Strategy |
|-----------|----------|
| First build, unknown corpus | Recursive, 512 tokens, no overlap |
| Factoid QA | Recursive, 256-512 tokens |
| Analytical / multi-hop | Recursive, 512-1024 tokens + parent-document |
| Heavy cross-reference（contracts, papers） | Late chunking or contextual retrieval |
| Conversational / dialog corpus | Turn-level chunks + speaker metadata |
| Short utterances（tweets, reviews） | One document = one chunk |

रिक्र्सिव 512 开始──在50 क्वेरी eval सेट 上测量 recall@5──然后再调优──

## 交付 यह

保存为 `outputs/skill-chunker.md`:

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

## अभ्यास

1. **Easy。**प्रयोग निश्चित ((512, 0) 、 पुनरावर्ती ((512, 0) 和 पुनरावर्ती ((512, 100) एक 20 पृष्ठ के दस्तावेज़ पर भाग करना
2. **Medium。**五文档基础上构建一个30查询 eval सेट――测量递归、语义和父母文档的回忆@5──哪个获胜?
3. **Hard。** संदर्भिक पुनर्प्राप्ति को प्राप्त करना── मापने के लिए मूल रेखा के प्रति आवर्तक के MRR 提升── रिपोर्ट इंडेक्सिंग लागत (LLM कॉल)

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
- [Vectara (2024, NAACL 2025). Chunking configurations analysis](https://arxiv.org/abs/2410.13070) चकचकीकरण एवं सम्मिलन  चयन भी उतना ही महत्वपूर्ण है
- [Jina AI — Late Chunking in Long-Context Embedding Models (2024)](https://jina.ai/news/late-chunking-in-long-context-embedding-models/) देर से चकनाचूर 论文。
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) LLM का उपयोग करके उत्पादन के ऊपर नीचे नीचे  अग्रिम 35-50% की जांच वृद्धि लाया है।
- [NVIDIA 2026 chunk-size benchmark — Premai summary](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/) अनुरूप प्रकार 选择 टुकड़ा आकार。
