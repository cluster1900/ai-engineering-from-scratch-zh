# إضافة النماذج  2026 深度解析

> Word2Vec 为每一个词提供一个向量――现代嵌入模型 为每段落提供一个向量,支持跨语言,并提供稀疏,密度和多向量 视图,尺寸可适应你的索引――选择错了,你的RAG 就会检查到错误内容――

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

## 问题

نظام RAG لديك 40% من الوقت في الوصول إلى الخطأ.

في 2026 سنة اختيار إضافة، يعني أن تأخذ على خمسة أبعاد:

1. **Dense vs sparse vs multi-vector。**كلّ جزء من متجه، أو كلّ رمز متجه، أو حقيبة متزنة نادرة من الكلمات
2. **语言覆盖。**单语 الإنجليزية النماذج في لغة إنجليزية 任务上仍然胜出──多语言模型在 corpus 混合时胜出──
3. **Context length。**512 Tokens vs 8,192 vs 32,768, بينما القدرة الفعالة الحقيقية عادة ما تكون 60 إلى 70٪ فقط من القيمة القصوى.
4. **Dimension budget。**3,072 个 كامل دقة العائمة = كل متجه 12 كيبايت ⋅ إلى 100 مليون متجه 时, تكلفة التخزين هي 1300 دولار / شهر ⋅ ماتريوشكا قصة يمكن أن تقللها 4 × ⋅
5. **Open vs hosted。**الوزن المفتوح يعني أنك تتحكم في كومة البيانات والمعلومات.

هذا الدراسة ستوضح هذه التجارة، دعك تستند إلى الأدلة، وليس على أساس ما كان منتشراً في السنة السابقة.

## 概念

![Dense, sparse, and multi-vector embeddings](../assets/embedding-modes.svg)

**Dense embeddings。**كلّ جزء من متجهة عادةً 384-3،072 بعدة)`text-embedding-3-large`、BGE-M3 وضع كثيف 、Voyage-3──默认选择──

**Sparse embeddings。**نمط SPLADE-‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**Multi-vector (late interaction)。**كولبرتف2、 جينا كولبرت‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**BGE-M3：三者合一。**单个模型 同时输出密度、sparse 和多向量表示──每种都可以独立查询;分数通过权重总量 融合──当你希望从一个检查点 获得灵活性时,这是2026年默认选择──

**Matryoshka Representation Learning。**訓練方式 يجعل من قبل N 个维度 من المتجه 本身就是有用ة التوابل المستقلة. 将 1,536-dim Vector 截断到 256 dim, فقط باستخدام دقة حوالي 1% 换取 6× التخزين التوفيرات.

### قائمة الـ MTEB فقط تحدث عن جزء من القصة

مقياس إضافة النص الضخم في وقت الإصدار(2022) تغطي 56 مهمة من بين 8 类任务، تمتد في MTEB v2 إلى 100 任务.

### ثلاثة مستويات

| Use case | Pattern |
|----------|---------|
| 快速 first-pass | Dense bi-encoder (BGE-M3, text-3-small) |
| Recall boost | Sparse (SPLADE, BGE-M3 sparse) + RRF fuse |
| top-50 上的 Precision | Multi-vector (ColBERTv2) 或 cross-encoder reranker |

معظم مجموعات الإنتاج 会同時使用三者──


```figure
gx-matryoshka
```

## بناءها

### 步骤 1: خط أساسي  استخدام جملة-BERT من التوابل الكثيفة

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

### 步骤 2: تقطيع المطروشكا

```python
def truncate(vectors, dim):
    out = vectors[:, :dim]
    return out / np.linalg.norm(out, axis=1, keepdims=True)

emb_256 = truncate(emb, 256)
emb_128 = truncate(emb, 128)
```

截断后重新正常化──Nomic v1.5、OpenAI text-3 和 Voyage-4 都经过训练,因此 قبل عدد قليل من المستويات أساسا لا ضرر لها──غير الماتريوشكا نماذج (((原始 Sentence-BERT) 在被截断时会急剧退化──

### الخطوة الثالثة: BGE-M3 多功能性

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

ثلاثة مؤشرات، واحدة استنتاج دعوة.

```python
dense_score = ... # cosine over dense_vecs
sparse_score = model.compute_lexical_matching_score(q_lex, d_lex)
colbert_score = model.colbert_score(q_col, d_col)
final = 0.4 * dense_score + 0.2 * sparse_score + 0.4 * colbert_score
```

في مجالك أعلى تعديل الوزن

### الخطوة 4: في مهمة مخصصة 上做 MTEB eval

```python
from mteb import MTEB

tasks = ["ArguAna", "SciFact", "NFCorpus"]
evaluation = MTEB(tasks=tasks)
results = evaluation.run(encoder, output_folder="./mteb-results")
```

في مجموعة من المنتخبين ذوي الـ*ممثلة* لا تصدق فقط في رتبة قائمة المنتخبين، إن نطاقك مهم جداً

### الخطوة 5: من صفر يدوسين

见 `code/main.py` متوسط إدخالات حركة الهاشينج  مجرد مجرد) ・不能与变压器嵌入 竞争,但展示了形状:tokenize → vector → normalize → dot product‬

## 常见陷

- **query 和 doc 使用同一个 model。**بعض النماذج (التسجيلات) تستخدم تشفيرات غير متماثلة، استفسارات ومستندات تحدث عبر طرق مختلفة.
- **缺少 prefix。** `bge-*`النماذج 需要在查询 前加上 `"Represent this sentence for searching relevant passages: "`◊ نسيان كلمة تذكر 会差 3-5 个点。
- **过度裁剪 Matryoshka。**1,536 → 256 عادة الأمان‬ 1,536 → 64 غير آمن‬ ‫رجاء في مجموعة تقييمك ‬ 上验证‬‬
- **Context truncation。**معظم النماذج سوف تكون صامتة أكثر من أقصى طول من النقاط.
- **忽略 latency tail。**درجات MTEB  خفيت p99 تأخير ‬ نموذج 600M ربما مقارنة مع نموذج 335M عالية 2 分، ولكن كل استفسار 成本高 3×‬

## استخدمها

2026 كومة:

| Situation | Pick |
|-----------|------|
| 仅 English、快速、API | `text-embedding-3-large` 或 `voyage-3-large` |
| Open-weight、English | `BAAI/bge-large-en-v1.5` |
| Open-weight、multilingual | `BAAI/bge-m3` 或 `Qwen3-Embedding-8B` |
| Long context (32k+) | Voyage-3-large, Cohere embed-v4, Qwen3-Embedding-8B |
| CPU-only deployment | Nomic Embed v2 (137M params, MoE) |
| Storage-constrained | Matryoshka-truncated + int8 quantization |
| Keyword-heavy queries | 添加 SPLADE sparse，并与 dense 做 RRF-fuse |

2026 模式: من BGE-M3 أو النص-3-كبيرة 开始, باستخدام MTEB في مجال الخاص بك 上评估; إذا كان نموذج محدد للمجال 领先超过 3 分,再切换──

## أصدرها

保存为 `outputs/skill-embedding-picker.md`:

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

## التدريب

1. **Easy。**استخدام `bge-small-en-v1.5`إيه كاملة (384) 编码 100 个句子, ثم إيه ماتريوشكا 128 编码──在 10 个查询 上测量 MRR drop──
2. **Medium。**في 500 مقطع من مجالك 上比较 BGE-M3 كثيفة     和 colbert                                                                                                                                                                                                                                                 
3. **Hard。**في أعلى وظائف المجال 2 لديك على ثلاثة نماذج مرشحة 运行 MTEB‬ 报告 MTEB score‬ 100-query batch  上的 p99 latency,以及 $/1M queries‬ ‬ ‬ ‬ ‬ ‬ اختروا تلك التي تكون مثالية للطابق الباريتو‬‬‬

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

##  المزيد阅读

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084) دوي-مُرمّع 论文。
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316) قائمة النتائج 论文。
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216) 统一三种模式的模型──
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) درجة-السلسلة 訓練目標。
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488) التفاعل المتأخر في الإنتاج
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) 实时排名──
