# 嵌入模型  2026 深度解析

> Word2Vec 为每一个词提供一个向量――现代嵌入式模型 为每段落提供一个向量,支持跨语言,并提供稀疏,密集和多向量 视图,尺寸可适应你的索引――选错了,你的RAG就会检查到错误内容――

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

## 问题

你的RAG系统有40%的检索到了错误段落.

在2026年选择嵌入,意味着要在五维度上取舍:

1. **Dense vs sparse vs multi-vector。**每段落一个向量,或每个标志一个向量,或一个稀有重量袋子的词.
2. **语言覆盖。**单语英语模型 在纯英语 任务上仍然胜出──多语言模型 在体内混合时胜出──
3. **Context length。**512 代币对 8,192 与 32,768 代币对,而实际有效容量通常只有标称最大值的 60-70%──
4. **Dimension budget。**3,072 个全精度浮动器 = 每个向量 12 KB──到 100M 矢量时,储存费用是 $ 1,300/月──马特里奥斯卡切割可减少 4 ×──
5. **Open vs hosted。**开放权力意味着你控制了数据堆和数据.

根据证据选择而不是上个季度流行什么.

## 概念

![Dense, sparse, and multi-vector embeddings](../assets/embedding-modes.svg)

**Dense embeddings。**每段落一个向量 (通常是384-3,072维度) .`text-embedding-3-large`△BGE-M3密集模式 △旅行-3──默认选择──

**Sparse embeddings。**变压器为每个语音符号预测权重,然后将其中大部分置零.结果是大小为 语音的稀疏向量.

**Multi-vector (late interaction)。**对于每个查询代币,找到最相似的文档代币,并累加分数量――存储和打分更昂贵,但在长期查询和域特定的 corpora 上胜出――

**BGE-M3：三者合一。**单个模型 同时输出密度、空间 和多向量表示――每种都可以独立查询;分数通过权重数量融合――当你希望从一个检查点获得灵活性时,这是2026年默认选择――

**Matryoshka Representation Learning。**训练方式使向量前 N 个维度 本身就是有用的独立嵌入式.将 1,536 维度向量 截断到 256 维度,只需约 1% 的精度 换取 6 倍的存储节省.

### 们的榜单只讲了部分故事

广大文本嵌入基准在发布时(2022) 覆盖8类任务中56个任务,在MTEB v2 中扩展到100多个任务――2026年初,Gemini Embedding 2 在检索上排名第一(67.71MTEB-R) ‧Cohere Embed-v4 领先一般(65.2MTEB) ・BGE-M3 领先的开放权重多语言域名(63.0) ・Leaderboard 是必要的,但不充分,始终需要在你的基准――

### 三层模式

| Use case | Pattern |
|----------|---------|
| 快速 first-pass | Dense bi-encoder (BGE-M3, text-3-small) |
| Recall boost | Sparse (SPLADE, BGE-M3 sparse) + RRF fuse |
| top-50 上的 Precision | Multi-vector (ColBERTv2) 或 cross-encoder reranker |

大多数生产堆会同时使用三者──


```figure
gx-matryoshka
```

## 构建它

### 步骤1:基线  使用 Sentence-BERT 的密集嵌入

```python
from sentence_transformers import SentenceTransformer
import numpy as np

encoder = SentenceTransformer("BAAI/bge-small-en-v1.5")
corpus = [
    "The first iPhone launched in 2007.",
    "Apple released the iPod in 2001.",
    "Android is an operating system from Google.",
]
emb = encoder.encode(corpus, normalize_embeddings=True)

query = "When was the iPhone released?"
q_emb = encoder.encode([query], normalize_embeddings=True)[0]
scores = emb @ q_emb
print(sorted(enumerate(scores), key=lambda x: -x[1]))
```

`normalize_embeddings=True`让点产品等于宇宙相似性──始终设置它──

### 步骤 2: 马特里奥斯卡切割

```python
def truncate(vectors, dim):
    out = vectors[:, :dim]
    return out / np.linalg.norm(out, axis=1, keepdims=True)

emb_256 = truncate(emb, 256)
emb_128 = truncate(emb, 128)
```

截断后重新正常化. 诺米克 v1.5、OpenAI文本-3 和旅行-4 都经过训练,因此前几层级基本无损.

### 步骤3:BGE-M3 多功能性

```python
from FlagEmbedding import BGEM3FlagModel

model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)

output = model.encode(
    corpus,
    return_dense=True,
    return_sparse=True,
    return_colbert_vecs=True,
)
# output["dense_vecs"]:    (n_docs, 1024)
# output["lexical_weights"]: list of dict {token_id: weight}
# output["colbert_vecs"]:  list of (n_tokens, 1024) arrays
```

两个指数,一个推断调用.

```python
dense_score = ... # cosine over dense_vecs
sparse_score = model.compute_lexical_matching_score(q_lex, d_lex)
colbert_score = model.colbert_score(q_col, d_col)
final = 0.4 * dense_score + 0.2 * sparse_score + 0.4 * colbert_score
```

在你的领域上调重量――

### 步骤 4: 在定制任务上做MTEB评估

```python
from mteb import MTEB

tasks = ["ArguAna", "SciFact", "NFCorpus"]
evaluation = MTEB(tasks=tasks)
results = evaluation.run(encoder, output_folder="./mteb-results")
```

在一个具有代表性*的子集中运行候选模式――不要只相信排名榜的排名,你的域名很重要――

### 步骤5: 从零手写 cosine

见`code/main.py`△平均哈希技嵌入式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除式除除除除除除除除式除除除除除除

## 常见陷

- **query 和 doc 使用同一个 model。**有些模型 (Voyage、Jina-ColBERT) 使用不对称编码,查询和文件 会经历不同路径──始终检查模型卡──
- **缺少 prefix。** `bge-*`需要在查询前加上`"Represent this sentence for searching relevant passages: "`忘记的话记得 会差3-5个点.
- **过度裁剪 Matryoshka。**您的评价设置上验证.
- **Context truncation。**大多数模型会静默截断超过最大长度的输入.
- **忽略 latency tail。** MTEB 评分 隐藏了p99延迟――一个600M模型可能比335M模型高2分,但每次查询 成本高3×──

## 使用它

根据第1个单元的规定,

| Situation | Pick |
|-----------|------|
| 仅 English、快速、API | `text-embedding-3-large` 或 `voyage-3-large` |
| Open-weight、English | `BAAI/bge-large-en-v1.5` |
| Open-weight、multilingual | `BAAI/bge-m3` 或 `Qwen3-Embedding-8B` |
| Long context (32k+) | Voyage-3-large, Cohere embed-v4, Qwen3-Embedding-8B |
| CPU-only deployment | Nomic Embed v2 (137M params, MoE) |
| Storage-constrained | Matryoshka-truncated + int8 quantization |
| Keyword-heavy queries | 添加 SPLADE sparse，并与 dense 做 RRF-fuse |

2026 模式:从BGE-M3或文本-3大开始,使用MTEB在你的域名上评估;如果某个域名特定模型领先超过3分,再切换――

## 发布它

保存为`outputs/skill-embedding-picker.md`其他:

```markdown
---
name: embedding-picker
description: 为给定 corpus 和 deployment 选择 embedding model、dimension 和 retrieval mode。
version: 1.0.0
phase: 5
lesson: 22
tags: [nlp, embeddings, retrieval]
---

给定一个 corpus（size、languages、domain、avg length）、deployment target（cloud / edge / on-prem）、latency budget 和 storage budget，输出：

1. Model。命名的 checkpoint 或 API。一句话说明理由。
2. Dimension。Full / Matryoshka-truncated / int8-quantized。给出与 storage budget 相关的理由。
3. Mode。Dense / sparse / multi-vector / hybrid。说明理由。
4. 如果 model card 要求，给出 query prefix / template。
5. Evaluation plan。与 domain 相关的 MTEB tasks + 使用 nDCG@10 的 held-out domain eval。

拒绝在没有 domain validation 的情况下建议将 Matryoshka 截断到 <64 dims。拒绝为 10k passages 以下的 corpora 推荐 ColBERTv2（overhead 不合理）。标记被路由到 512-token windows models 的 long-document corpora（>8k tokens）。
```

## 练习

1. **Easy。**使用 `bge-small-en-v1.5`在10个查询中,上测量MRR滴下.
2. **Medium。**在来自您的域的500个段落上比较BGE-M3密度,稀疏和色.
3. **Hard。**在你的前2个域任务上对三个候选模型运行MTEB――报告MTEB分数,1000个查询批量上的p99延迟,以及$/1M查询――选择Pareto最佳的那个――

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Dense embedding | 这个 Vector | 每段文本一个 fixed-size Vector。用 Cosine similarity 排序。 |
| Sparse embedding | Learned BM25 | 每个 vocab token 一个权重；大多为零；end-to-end 训练。 |
| Multi-vector | ColBERT-style | 每个 Token 一个 Vector；MaxSim scoring；更大的 index，更好的 recall。 |
| Matryoshka | Russian doll trick | 前 N dims 本身就是有效的更小 embedding。 |
| MTEB | 这个 benchmark | Massive Text Embedding Benchmark，发布时 56 个任务，v2 中 100+。 |
| BEIR | 这个 retrieval benchmark | 18 个 zero-shot retrieval tasks；常被引用来衡量 cross-domain robustness。 |
| Asymmetric encoding | Query ≠ doc path | Model 对 queries 和 documents 使用不同 projections。 |

## 进一步阅读

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084)双编码器论文
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316)排名榜论文
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216)统一三种模式的模型.
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147)维度梯子 训练目标.
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488)生产中的晚间交互――
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) 实时排名──
