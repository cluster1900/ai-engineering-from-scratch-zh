# Nhập Model  2026 深度解析

> Word2Vec cho mỗi từ cung cấp một vector。Modern Embedding Models cho mỗi đoạn cung cấp một vector, hỗ trợ跨语言,并 cung cấp ít、 mật độ 和 đa vector 视图,尺寸可适应你的索引──选错了,你的RAG就会检查到错误内容──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

## 问题

Hệ thống RAG của bạn có 40% thời gian tìm kiếm đã sai đoạn.

Trong năm 2026 chọn nhúng, có nghĩa là phải lấy trên 5 chiều:

1. **Dense vs sparse vs multi-vector。**Mỗi đoạn một vector, hoặc mỗi token một vector, hoặc một túi nặng hiếm của từ.
2. **语言覆盖。**单语 tiếng Anh mô hình trong đơn thuần tiếng Anh 任务上仍然胜出──多语言模型在 corpus 混合时胜出──
3. **Context length。**512 Tokens vs 8.192 vs 32.768, và dung lượng hiệu quả thực sự thường chỉ có 60-70% của giá trị tối đa.
4. **Dimension budget。**3,072 个 toàn độ chính xác nổi = Mỗi Vector 12 KB── đến 100M Vectors 时, phí lưu trữ là $ 1,300/tháng──Matryoshka cắt giảm có thể giảm 4×──
5. **Open vs hosted。**Open-weight có nghĩa là bạn kiểm soát hàng và dữ liệu.

Bài học này sẽ xác định những lựa chọn này, để bạn dựa trên bằng chứng, chứ không phải dựa trên những gì đã phổ biến trong mùa trước.

## 概念

![Dense, sparse, and multi-vector embeddings](../assets/embedding-modes.svg)

**Dense embeddings。**Mỗi đoạn một vector (thường là 384-3,072 chiều) ✿ Còng giống nhau 按语义接近对段落排序✿OpenAI`text-embedding-3-large`、BGE-M3 phong phú chế độ、Voyage-3──默认选择──

**Sparse embeddings。**SPLADE-style──a Transformer cho mỗi biểu tượng từ ngữ 预测权重, sau đó sẽ đặt phần lớn của nó vào 0── kết quả là một vector nhỏ gọn của từ ngữ ︎ bắt được sự phù hợp từ ngữ( giống như BM25), nhưng sử dụng các trọng lượng từ học ︎ đối với các truy vấn nặng từ khóa 很强──

**Multi-vector (late interaction)。**ColBERTv2、Jina-ColBERT── mỗi token một vector── sử dụng MaxSim 打分: đối với mỗi token truy vấn, tìm thấy các token tài liệu tương tự nhất,并累加分数── lưu trữ và打分更昂贵, nhưng trong các truy vấn dài 和 các tập đoàn cụ thể về miền 上胜出──

**BGE-M3：三者合一。**单个模型 同时输出密度、sparse 和多向表示──每种都可以独立查询;分数通过权重数量融合──当你希望从一个检查点获得灵活性时,这是2026年的默认选择──

**Matryoshka Representation Learning。**训练方式使 Vector's trước N 个维度 本身就是有用的独立嵌入. 将 1,536-dim Vector 截断到 256 dim, chỉ sử dụng khoảng 1% chính xác để đổi lấy 6x lưu trữ tiết kiệm.

### Đơn vị xếp hạng MTEB chỉ nói một phần câu chuyện

Massive Text Embedding Benchmark 在发布时(2022) 覆盖 8 类任务中 56 个任务,扩展到 100+任务在 MTEB v2 中.2026 年初,Gemini Embedding 2 在检索上排名第一(67.71 MTEB-R) ✿Cohere Embed-v4 领先一般(65.2 MTEB) ✿BGE-M3 领先开权多语言域(63.0) ✿Leaderboard là cần thiết, nhưng không đầy đủ, luôn luôn luôn ở trên điểm chuẩn của bạn.

### 3 tầng

| Use case | Pattern |
|----------|---------|
| 快速 first-pass | Dense bi-encoder (BGE-M3, text-3-small) |
| Recall boost | Sparse (SPLADE, BGE-M3 sparse) + RRF fuse |
| top-50 上的 Precision | Multi-vector (ColBERTv2) 或 cross-encoder reranker |

Phần lớn các hàng sản xuất 会同时使用三者──


```figure
gx-matryoshka
```

##  xây dựng nó

### 步骤 1: đường cơ sở  Sử dụng các nhúng dày đặc của Sentence-BERT

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

`normalize_embeddings=True`让点产品等于 cosine similarity──始终设置它──

### 步骤 2: Matryoshka cắt ngắn

```python
def truncate(vectors, dim):
    out = vectors[:, :dim]
    return out / np.linalg.norm(out, axis=1, keepdims=True)

emb_256 = truncate(emb, 256)
emb_128 = truncate(emb, 128)
```

截断后重新正常化──Nomic v1.5、OpenAI text-3 和 Voyage-4 đã trải qua đào tạo, do đó, vài cấp trước cơ bản không bị tổn thất──Non-Matryoshka mô hình(原始 Sentence-BERT) 在被截断时会急剧退化──

### Bước 3: BGE-M3 多功能性

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

Ba chỉ số, một lần gọi kết luận.

```python
dense_score = ... # cosine over dense_vecs
sparse_score = model.compute_lexical_matching_score(q_lex, d_lex)
colbert_score = model.colbert_score(q_col, d_col)
final = 0.4 * dense_score + 0.2 * sparse_score + 0.4 * colbert_score
```

Trong lĩnh vực của bạn lên调 trọng lượng.

### 步骤 4: Trong nhiệm vụ tùy chỉnh 上 làm MTEB đánh giá

```python
from mteb import MTEB

tasks = ["ArguAna", "SciFact", "NFCorpus"]
evaluation = MTEB(tasks=tasks)
results = evaluation.run(encoder, output_folder="./mteb-results")
```

Trong một tập hợp có đại diện, các mô hình ứng cử viên được vận hành. Đừng chỉ tin vào xếp hạng bảng xếp hạng, miền của bạn rất quan trọng.

### 步骤 5: Từ零手写 cosine

见 `code/main.py` Phân tích Hashing Trick trung bình (仅仅 sdlib) ・无法与变压器嵌入 竞争,但展示了形状:tokenize → vector → normalize → dot product。

## 常见陷

- **query 和 doc 使用同一个 model。**Một số mô hình (Voyage、Jina-ColBERT) sử dụng mã hóa không đối xứng, truy vấn 和 tài liệu 会经过不同路径──始终检查模型卡──
- **缺少 prefix。** `bge-*`mô hình  cần trong các truy vấn 前加上 `"Represent this sentence for searching relevant passages: "`◊ quên từ nhớ 会差 3-5 个点。
- **过度裁剪 Matryoshka。**1,536 → 256 thường an toàn──1,536 → 64 không an toàn──请在你的评估设置上验证──
- **Context truncation。**Hầu hết các mô hình sẽ bị cắt ngang hơn các bước nhập dài nhất.
- **忽略 latency tail。**MTEB điểm  ẩn p99 độ trễ. Một mô hình 600M có thể cao hơn mô hình 335M cao 2 分, nhưng mỗi truy vấn thành phần cao 3×.

## Sử dụng nó

2026:

| Situation | Pick |
|-----------|------|
| 仅 English、快速、API | `text-embedding-3-large` 或 `voyage-3-large` |
| Open-weight、English | `BAAI/bge-large-en-v1.5` |
| Open-weight、multilingual | `BAAI/bge-m3` 或 `Qwen3-Embedding-8B` |
| Long context (32k+) | Voyage-3-large, Cohere embed-v4, Qwen3-Embedding-8B |
| CPU-only deployment | Nomic Embed v2 (137M params, MoE) |
| Storage-constrained | Matryoshka-truncated + int8 quantization |
| Keyword-heavy queries | 添加 SPLADE sparse，并与 dense 做 RRF-fuse |

2026 模式: từ BGE-M3 hoặc text-3-large  bắt đầu, sử dụng MTEB trong miền của bạn 上评估; nếu một mô hình cụ thể về miền 领先 hơn 3 分, tái chuyển đổi.

##  phát hành nó

保存为 `outputs/skill-embedding-picker.md`- Có thể là:

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

1. **Easy。**Sử dụng `bge-small-en-v1.5`以 full dim (384) 编码 100 个句子, sau đó以 Matryoshka 128 编码──在 10 个查询上测量 MRR drop──
2. **Medium。**Trong 500 đoạn trong tên miền của bạn trên so sánh BGE-M3 dày đặc, thô lỗ và colbert.
3. **Hard。**Trong các nhiệm vụ miền 2 hàng đầu của bạn 上对三个候选模型运行MTEB――报告MTEB điểm số、100-query batch 上的p99延迟,以及$/1M queries──选择Pareto-optimal的那个──

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

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084) bi-encoder 论文。
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316) bảng xếp hạng 论文。
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216) 统一三种模式的模型──
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) chiều kích-cào thang 训练目标。
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488) tương tác muộn giữa sản xuất
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) 实时排名──
