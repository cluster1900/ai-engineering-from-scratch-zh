---
id: embeddings-vector-search
title: Embeddings and Vector Search
code: EV
subtitle: 编码文本、选择度量、确定向量规模、选择索引并修复召回率差的问题。Python、NumPy 与 FAISS。
hue: 170
sources: phases/11-llm-engineering/04-embeddings, phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword, phases/05-nlp-foundations-to-advanced/14-information-retrieval-search, phases/01-math-foundations/14-norms-and-distances, phases/02-ml-fundamentals/06-knn-and-distances, phases/04-computer-vision/20-image-retrieval-metric, phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense
source_hash: 16665e2c8ff93f4e
---

## 先检索，再重排
type: architecture
from: phases/11-llm-engineering/04-embeddings/docs/en.md, phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/docs/en.md, phases/05-nlp-foundations-to-advanced/14-information-retrieval-search/docs/en.md

```arch
node | docs | 1,1 | Documents | split into chunks
node | enc | 2,1 | Bi-encoder | text to vector
node | norm | 3,1 | L2 normalize | unit length
node | idx | 4,1 | Vector index | HNSW or flat
node | q | 1,2 | Query | same model, query prefix
node | out | 2,2 | Top 10 | to the reader
node | rerank | 3,2 | Cross-encoder | scores pairs
node | topk | 4,2 | Top 100 | ANN search
edge | docs | enc | chunks
edge | q | enc | embed
edge | enc | norm |
edge | norm | idx | add
edge | idx | topk | search
edge | topk | rerank |
edge | rerank | out | top 10
```

## 编码、搜索、截断
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/14-information-retrieval-search/docs/en.md, phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md

```python
encoder = SentenceTransformer("BAAI/bge-small-en-v1.5")  # 384 dim
embeddings = encoder.encode(corpus, normalize_embeddings=True)  # unit vectors
q_emb = encoder.encode([query], normalize_embeddings=True)
sims = (embeddings @ q_emb.T).flatten()  # dot equals cosine
order = np.argsort(-sims)[:top_k]        # best first
def truncate(vectors, dim):              # Matryoshka cut
    out = vectors[:, :dim]
    return out / np.linalg.norm(out, axis=1, keepdims=True)  # renormalize
emb_256 = truncate(emb, 256)
index = faiss.IndexFlatL2(dimension)     # exact search
index.add(embeddings)
distances, indices = index.search(query_vectors, k=5)
```

## 任务
type: task-table
from: phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/docs/en.md, phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/code/main.py, phases/11-llm-engineering/04-embeddings/code/embeddings.py, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/docs/en.md

| 任务 | 代码 |
|---|---|
| 截断一个向量 | `truncate_matryoshka(vec, 64)` |
| 二值化一个向量 | `binarize(vec)` |
| 按汉明距离搜索 | `engine.index.search(query_vec, top_k=5, metric="hamming")` |
| 融合稠密与稀疏排名 | `rrf_fuse([dense_ranked[:5], sparse_scores[:5]])` |
| 加载 BGE-M3 | `BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)` |
| 做一次类比 | `analogy(vocab, W, "man", "king", "woman")` |
| 未见过的词的向量 | `fasttext_vector(word, ngram_table)` |
| 在 MTEB 任务上评估 | `evaluation.run(encoder, output_folder="./mteb-results")` |

## 相似度数学
type: concepts
from: phases/11-llm-engineering/04-embeddings/docs/en.md, phases/11-llm-engineering/04-embeddings/code/embeddings.py, phases/01-math-foundations/14-norms-and-distances/docs/en.md, phases/04-computer-vision/20-image-retrieval-metric/docs/en.md, phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/docs/en.md, phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/code/main.py

- **余弦**：$\cos(a, b) = \frac{a \cdot b}{\lVert a \rVert \, \lVert b \rVert}$。范围 -1 到 1。忽略长度。
- **余弦距离**：$1 - \cos(a, b)$。范围 0 到 2。
- **点积**：$\sum_i a_i b_i$。单位向量上等于余弦。
- **L2**：$\sqrt{\sum_i (a_i - b_i)^2}$。越小越近。
- **单位向量**：$\lVert a - b \rVert^2 = 2 - 2 \cos(a, b)$。
- **汉明**：二值化后不同比特的个数。
- **MaxSim**：为每个查询 token 取最匹配的文档 token，再求和。
- **RRF**：对各个排名求 $\sum \frac{1}{k + \text{rank} + 1}$，rank 从 0 开始。

## HNSW 搜索
type: flow
from: phases/11-llm-engineering/04-embeddings/docs/en.md, phases/01-math-foundations/14-norms-and-distances/docs/en.md

1. **构建**：把每个向量放进多层图，与近似邻居相连。
2. **顶层**：稀疏，在相距较远的簇之间有长连接。
3. **底层**：稠密，包含所有向量，连接都很短。
4. **进入**：查询从顶层开始。
5. **下降**：贪心地移向更近的节点，然后下降一层。
6. **返回**：以 $O(\log n)$ 而非 $O(n)$ 得到近似 top-k。
7. **代价**：召回率通常为 95 到 99 percent。1000 万向量时只需毫秒级。

## 选择索引
type: command-table
from: phases/04-computer-vision/20-image-retrieval-metric/docs/en.md, phases/01-math-foundations/14-norms-and-distances/docs/en.md, phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md

| 命令 | 作用 |
|---|---|
| `IndexFlatIP` | 精确内积。单位向量上即余弦。约 100k 个向量 |
| `IndexFlatL2` | 精确 L2，无需训练。最多约 1M 个向量 |
| `IndexIVFFlat` | K 个单元，只搜最近的几个。需要训练。约 10M |
| `IndexIVFPQ` | IVF 加乘积量化。100M 及以上 |
| `IndexHNSW` | 图索引。查询多时最快。索引较大 |
| LSH | 随机哈希投影。近重复检测 |
| KD 树、球树 | 精确。只适用于低维和中维 |

## 规模与压缩
type: concepts
from: phases/11-llm-engineering/04-embeddings/docs/en.md, phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/docs/en.md

- **float32，1536 维**：每个向量 6,144 字节。1000 万个需要 61 GB。
- **3,072 维**：全精度时每个向量 12 KB。
- **二值**：每个向量 192 字节，小 32x。召回率损失 5 到 10 percent。
- **重新打分**：先用二值向量粗筛，再对前 1000 个用全精度打分。
- **Matryoshka，1536 取 256**：存储减少 6x，损失约 3 到 5 percent。
- **安全截断**：1,536 截到 256 通常安全，1,536 截到 64 则不然。

## 代码中的默认值
type: defaults
from: phases/11-llm-engineering/04-embeddings/code/embeddings.py, phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/code/main.py, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `chunk_size` | 200 | 每个分块的词数，`chunk_text` |
| `overlap` | 50 | 相邻两块共享的词数 |
| `top_k` | 5 | 每次搜索的结果数 |
| `metric` | `"cosine"` | 也支持 dot、euclidean、hamming |
| RRF `k` | 60 | `rrf_fuse` |
| `hash_embed` 维度 | 256 | 哈希技巧演示用的嵌入器 |
| `n_min` | 3 | FastText n-gram，`n_max` 6 |
| `x_max` | 100 | GloVe 加权，`alpha` 0.75 |

## 故障排查
type: troubleshooting
from: phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/docs/en.md, phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/code/main.py, phases/04-computer-vision/20-image-retrieval-metric/docs/en.md, phases/11-llm-engineering/04-embeddings/docs/en.md, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md, phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| bge 召回率低 3 到 5 个点 | 没有查询前缀 | 加上模型卡中的前缀 |
| 截断后的向量排序很差 | 截断后没有重新归一化 | 再除一次范数 |
| 截断后召回率下降 | 截得太狠，或没有 Matryoshka 训练 | 在你的评估集上验证 |
| 最近邻结果变化 | 混用了余弦和 L2 的约定 | 与训练时的度量保持一致 |
| 查询和文档匹配不上 | 非对称模型 | 查看模型卡 |
| `cosine: dim mismatch` | 向量维度不同 | 两边使用同一个模型、同一维度 |
| 长文档什么都匹配不上 | 一个向量平均了所有主题 | 按 256 到 512 token 分块，重叠 50 |
| 未见过的词没有向量 | Word2Vec 和 GloVe 没有回退机制 | 使用 FastText n-gram |

## 缩写
type: glossary
from: phases/01-math-foundations/14-norms-and-distances/docs/en.md, phases/11-llm-engineering/04-embeddings/docs/en.md, phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/docs/en.md, phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/docs/en.md

- **ANN**：Approximate Nearest Neighbor（近似最近邻）。精度略有损失，速度大幅提升。
- **HNSW**：Hierarchical Navigable Small World。多层图索引。
- **IVF**：倒排文件索引。只搜索少数几个簇。
- **PQ**：乘积量化。在压缩空间中搜索。
- **LSH**：局部敏感哈希。随机哈希投影。
- **MTEB**：Massive Text Embedding Benchmark。发布时 56 个任务，v2 有 100+ 个。
- **BEIR**：18 个零样本检索任务。
- **OOV**：Out of vocabulary（未登录词）。训练中没见过的词。

## 问答
type: qa
from: phases/11-llm-engineering/04-embeddings/docs/en.md, phases/01-math-foundations/14-norms-and-distances/docs/en.md, phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/docs/en.md, phases/05-nlp-foundations-to-advanced/14-information-retrieval-search/docs/en.md, phases/04-computer-vision/20-image-retrieval-metric/docs/en.md

- **余弦还是点积？** 在 L2 归一化的向量上，选哪个都一样。
- **为什么用 ANN？** 1M 乘 1536 的暴力搜索每次查询需要 15 亿次乘加。
- **为什么要重排？** cross-encoder 把查询和文档放在一起读。更慢但更准。
- **为什么用 RRF 而不是分数相加？** BM25 无上界，余弦在 -1 到 1 之间。排名才可比较。
- **RAG 检索器看哪个指标？** Recall@k。没有正确的段落，就没有答案。

## 提示
type: tips
from: phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/docs/en.md, phases/04-computer-vision/20-image-retrieval-metric/docs/en.md, phases/05-nlp-foundations-to-advanced/14-information-retrieval-search/docs/en.md, phases/11-llm-engineering/04-embeddings/docs/en.md

- 始终设置 `normalize_embeddings=True`。
- 在你自己的查询上做基准测试。排行榜名次不够。
- 只有新模型在你的领域上领先 3 个点以上才更换。
- 并排报告 recall@1、@5 和 @10。
- 测量 p99 延迟。MTEB 分数看不出它。
- 某个查询失败时，对比稀疏排名与稠密排名的差异。
