# Eklenti Modeller  2026 深度解析

> Word2Vec için her kelime bir vektör sağlar. Modern Embedding Models için her bölüm bir vektör sağlar.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

## 问题

RAG sisteminiz %40'da bir hata aşamasını tespit etti.

2026 yılında seçilen yerleştirme, beş boyutta bir şekilde kullanılması anlamına gelir:

1. **Dense vs sparse vs multi-vector。**Her bölümde bir vektör, veya her bir simge, bir vektör, veya nadir ağırlıklı bir kelime çantası.
2. **语言覆盖。**单语 İngilizce modeller 在纯英语 任务上仍然胜出──多语言模型 在 corpus 混合时胜出──
3. **Context length。**512 Token vs 8.192 vs 32.768, gerçek etkin kapasite ise genellikle en büyük değerinin sadece 60-70%'i vardır.
4. **Dimension budget。**3,072 个 tam hassas yüzen = Her vektör 12 KB── 100M vektör 时, depolama masrafı $1,300/ay──Matryoshka kesimi 4×─ azaldılabilir.
5. **Open vs hosted。**Açık ağırlık demek kontrol yığın ve veriler. Ev sahibi demek demek kontrol hakkı ile her zaman en son değişmek demek.

Bu ders, bu değerleri belirleyecek ve son dönemlerde popüler olan şeylerin yerine kanıtlara dayalı seçim yapmanızı sağlayacak.

## 概念

![Dense, sparse, and multi-vector embeddings](../assets/embedding-modes.svg)

**Dense embeddings。**Her bölümde bir vektör vardır. Genellikle 384-3,072 boyutlarda.`text-embedding-3-large`、BGE-M3 yoğun modı、Voyage-3──默认选择──

**Sparse embeddings。**SPLADE-style──a Transformer for each vocab token 预测权重, then will put most of it to zero── sonuçta ise büyüklükte sözcüklerin sıfır vektörleri vardır.

**Multi-vector (late interaction)。**ColBERTv2、Jina-ColBERT── her bir token bir vektör── MaxSim 打分: her bir sorgu tokenine karşı, en benzer belge tokenini bul,并累加分数── depolama ve打分更昂贵, ancak uzun sorgularda 和 etki alanı özel corpora 上胜出──

**BGE-M3：三者合一。**单个模型 同时输出密度、sparse 和多向表示──每种都可以独立查询;分数通过权重积分融合──当你希望从一个检查点 获得灵活性时,这是2026年的默认选择──

**Matryoshka Representation Learning。**訓練方式使Vector'ın ön N 个 boyutları 本身就是有用的独立嵌入式──将 1,536-dim Vector 截断到 256 dim,只用约1%精度 换取6x存储节省──OpenAI text-3、Cohere v4、Voyage-4、Jina v5、Gemini Embedding 2、Nomic v1.5+ 支持──

### MTEB liderlik tabloları sadece kısım hikayeleri anlatıyor .

Massive Text Embedding Benchmark Posted on: WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB WEB

### Üç katlı mod

| Use case | Pattern |
|----------|---------|
| 快速 first-pass | Dense bi-encoder (BGE-M3, text-3-small) |
| Recall boost | Sparse (SPLADE, BGE-M3 sparse) + RRF fuse |
| top-50 上的 Precision | Multi-vector (ColBERTv2) 或 cross-encoder reranker |

Çoğu üretim aşamasında aynı anda üç kişi kullanılır.


```figure
gx-matryoshka
```

## Yapın onu.

### 步骤 1: baseline  使用 Sentence-BERT'in yoğun yerleşimleri

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

### 步骤 2: Matryoshka kesimi

```python
def truncate(vectors, dim):
    out = vectors[:, :dim]
    return out / np.linalg.norm(out, axis=1, keepdims=True)

emb_256 = truncate(emb, 256)
emb_128 = truncate(emb, 128)
```

截断后重新正常化──Nomic v1.5、OpenAI text-3 和 Voyage-4 都经过训练,因此前几层级基本无损──Non-Matryoshka modeller(原始 Sentence-BERT) 在被截断时会急剧退化──

### 步骤 3: BGE-M3 多功能性

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

Üç indeksi, bir sonucu arama.

```python
dense_score = ... # cosine over dense_vecs
sparse_score = model.compute_lexical_matching_score(q_lex, d_lex)
colbert_score = model.colbert_score(q_col, d_col)
final = 0.4 * dense_score + 0.2 * sparse_score + 0.4 * colbert_score
```

Senin alanında ağırlıkları yükseltmek için.

### 步骤 4: 在定制任务上做MTEB eval

```python
from mteb import MTEB

tasks = ["ArguAna", "SciFact", "NFCorpus"]
evaluation = MTEB(tasks=tasks)
results = evaluation.run(encoder, output_folder="./mteb-results")
```

Bir temsilcilik* olan bir grupta aday modellerini yürütmek için.

### 5 adım: Zıfırdan yaz cosine

Görüyorum .`code/main.py`◊ Ortalama Hashing Trick yerleşimleri((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((

## 常见陷

- **query 和 doc 使用同一个 model。**Bazı modeller ((Voyage、Jina-ColBERT) asimetrik kodlama, sorgulama, dokümanlama, farklı yollarla geçiş yapmaktadır.
- **缺少 prefix。** `bge-*`modeller 需要在查询 前加上 `"Represent this sentence for searching relevant passages: "`❖ unutma ❖ hatırla 会差 3-5 个点。
- **过度裁剪 Matryoshka。**1,536 → 256 Normal Güvenlik──1,536 → 64 Güvensizlik── Lütfen değerlendirme ayarınızda yukarı doğrulamayı seçin──
- **Context truncation。**Büyük çoğunluktan modeller, en büyük uzunluğun en büyük girişinden daha fazla kesintisi olacaktır.
- **忽略 latency tail。**MTEB puanları p99 gecikmeyi saklıyor. 600M modeli 335M modeliyle karşılaştırıldığında 2 % yüksek olabilir.

## Kullan

2026 yığın:

| Situation | Pick |
|-----------|------|
| 仅 English、快速、API | `text-embedding-3-large` 或 `voyage-3-large` |
| Open-weight、English | `BAAI/bge-large-en-v1.5` |
| Open-weight、multilingual | `BAAI/bge-m3` 或 `Qwen3-Embedding-8B` |
| Long context (32k+) | Voyage-3-large, Cohere embed-v4, Qwen3-Embedding-8B |
| CPU-only deployment | Nomic Embed v2 (137M params, MoE) |
| Storage-constrained | Matryoshka-truncated + int8 quantization |
| Keyword-heavy queries | 添加 SPLADE sparse，并与 dense 做 RRF-fuse |

2026 模式: BGE-M3 veya metin-3 büyük  başlayın, MTEB ile alanınızda  评估; eğer bir alan-specifik model  lider 3 分, yeniden değiştirmek

## Yayınla

保存为 `outputs/skill-embedding-picker.md`- ...

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

1. **Easy。**Kullanım`bge-small-en-v1.5`E tam dim (384) 编码 100 个句子, sonra E Matryoshka 128 编码──在 10 个查询上测量 MRR drop──
2. **Medium。**Bu arada, RRF füzyonu en iyi tek moddan mı üstün?
3. **Hard。**Top 2 alan görevlerinizde, üç aday modeli için MTEB çalıştırın. MTEB puanını rapor edin. 100 sorgu seri için p99 gecikme süresi, ayrıca $ 1M sorguları için pareto-optimal olanı seçin.

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

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084) iki kodlayıcı 论文。
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316) liderlik tabloları 论文。
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216) 统一三种 mode modelı。
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) boyut merdivenleri 訓練目標。
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488) üretim arasında geç etkileşim
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) 实时排名──
