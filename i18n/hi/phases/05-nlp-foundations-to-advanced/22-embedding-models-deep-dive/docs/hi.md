# एम्बेडिंग मॉडल  2026 गहराई解析

> Word2Vec प्रत्येक शब्द के लिए एक वेक्टर प्रदान करता है। आधुनिक एम्बेडिंग मॉडल प्रत्येक खंड के लिए एक वेक्टर प्रदान करते हैं, विभिन्न भाषाओं का समर्थन करते हैं, और दुर्लभ, घने और बहु-वेक्टर प्रदान करते हैं।

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

## 问题

आपके RAG सिस्टम में 40% का समय है गलत段落 को खोज लिया गया है।

2026 में चयनित एम्बेडिंग, का मतलब है कि पांच आयामों पर लेने के लिएः

1. **Dense vs sparse vs multi-vector。**प्रत्येक खंड एक वेक्टर, या प्रत्येक टोकन एक वेक्टर, या शब्दों का एक दुर्लभ वजन बैग
2. **语言覆盖。**单语 अंग्रेज़ी मॉडल 在纯英语 任务上仍然胜出──बहुभाषी मॉडल 在 corpus 混合时胜出──
3. **Context length。**512 टोकन बनाम 8,192 बनाम 32,768, जबकि वास्तविक प्रभावी क्षमता आमतौर पर केवल 60-70% के लिए अधिकतम मान है।
4. **Dimension budget。**3,072 个 पूर्ण परिशुद्धता तैरने = प्रत्येक वेक्टर 12 KB── 100M वेक्टर 时, भंडारण शुल्क $1,300/महीने है──मैत्रियोश्का काटना 4× घटाया जा सकता है──
5. **Open vs hosted。**खुला वजन मतलब है कि आप नियंत्रण स्टैक और डेटा को और होस्ट किया गया मतलब है कि आप नियंत्रण के साथ विनिमय हमेशा नवीनतम है

इस वर्ग में ये विकल्प स्पष्ट होंगे, आपको पिछले सीजन के फैशन के आधार पर नहीं बल्कि सबूतों के आधार पर चुनने दें।

## 概念

![Dense, sparse, and multi-vector embeddings](../assets/embedding-modes.svg)

**Dense embeddings。**प्रत्येक खंड एक वेक्टर (आमतौर पर 384-3,072 आयाम) ◊ सह-अस्तित्व 按语义接近对段落排序──OpenAI ◊`text-embedding-3-large`、BGE-M3 घने मोड、यात्रा-3──默认选择──

**Sparse embeddings。**SPLADE-style── एक ट्रांसफार्मर प्रत्येक वाक्यांश टोकन के लिए 预测权重, फिर इसका अधिकांश हिस्सा शून्य में रखा जायेगा। परिणाम यह है कि वाक्यांश के लिए एक दुर्लभ वेक्टर है।

**Multi-vector (late interaction)。**ColBERTv2、Jina-ColBERT── प्रत्येक टोकन एक वेक्टर── MaxSim 打分: प्रत्येक क्वेरी टोकन के लिए, सबसे समान दस्तावेज़ टोकन ढूंढें,并累加分数── भंडारण और打分更昂贵, लेकिन लंबी क्वेरी में 和 डोमेन-विशिष्ट corpora 上胜出──

**BGE-M3：三者合一。**单个模型 同时输出密度、sparse 和多向量表示── प्रत्येक प्रकार स्वतंत्र प्रश्न हो सकता है;分数通过权重数 融合──当你希望从一个检查点 获得灵活性时,这是2026年的默认选择──

**Matryoshka Representation Learning。** प्रशिक्षण विधि से वेक्टर के पहले N 个 आयामों को सक्षम बनाता है 本身就是有用的独立嵌入式──将 1,536-dim Vector 截断到 256 dim, केवल 1% सटीकता के साथ 换取 6x भंडारण बचत──OpenAI पाठ-3、Cohere v4、Voyage-4、Jina v5、Gemini Embedding 2、Nomic v1.5+ 支持──

### एमटीईबी की रैंकिंग बोर्ड ने सिर्फ कुछ ही कहानियां बताई हैं

Massive Text Embedding Benchmark 在发布时(2022) में शामिल 8 类任务 में से 56 个任务, MTEB v2 में विस्तारित होकर 100+ 任务──2026 साल की शुरुआत में, Gemini Embedding 2 在检索上排名第一(67.71 MTEB-R)──Cohere Embed-v4 领先一般(65.2 MTEB)──BGE-M3 领先 ओपन-वेट बहुभाषी डोमेन(63.0)──Leaderboard आवश्यक है, लेकिन अपर्याप्त, हमेशा आपके बेंचमार्क में रहना चाहिए──

### तीन स्तरीय मोड

| Use case | Pattern |
|----------|---------|
| 快速 first-pass | Dense bi-encoder (BGE-M3, text-3-small) |
| Recall boost | Sparse (SPLADE, BGE-M3 sparse) + RRF fuse |
| top-50 上的 Precision | Multi-vector (ColBERTv2) 或 cross-encoder reranker |

अधिकांश उत्पादन स्टैक 会同时使用三者──


```figure
gx-matryoshka
```

##  इसे निर्माण

### 步骤 1: बेसलाइन  उपयोग वाक्य-BERT के घने एम्बेडमेंट

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

`normalize_embeddings=True`让点产品等于宇宙相似之──始终设置之──

### 步骤 2: मैट्रियोशका काटना

```python
def truncate(vectors, dim):
    out = vectors[:, :dim]
    return out / np.linalg.norm(out, axis=1, keepdims=True)

emb_256 = truncate(emb, 256)
emb_128 = truncate(emb, 128)
```

截断后重新正常化──Nomic v1.5、OpenAI text-3 和 Voyage-4 都经过训练,因此前几层级基本无损──非马特里奥斯卡模型 (原始 Sentence-BERT) 在被截断时会急剧退化──

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

तीन सूचकांक, एक निष्कर्ष कॉल.

```python
dense_score = ... # cosine over dense_vecs
sparse_score = model.compute_lexical_matching_score(q_lex, d_lex)
colbert_score = model.colbert_score(q_col, d_col)
final = 0.4 * dense_score + 0.2 * sparse_score + 0.4 * colbert_score
```

अपने डोमेन में ऊपर वजन समायोजित करेंः

### 步骤 4: पर अनुकूलित कार्य ऊपर करने के लिए MTEB मूल्यांकन

```python
from mteb import MTEB

tasks = ["ArguAna", "SciFact", "NFCorpus"]
evaluation = MTEB(tasks=tasks)
results = evaluation.run(encoder, output_folder="./mteb-results")
```

एक प्रतिनिधिमूलक* समूह में उम्मीदवारों के मॉडल चल रहे हैं।

### 步骤 5: शून्य से हाथ से लिखना cosine

见 `code/main.py`◊ औसत हैशिंग ट्रिक एम्बेडमेंट्स ((仅 仅 ) ・无法与变压器 एम्बेडमेंट्स 竞争,但展示了形状:tokenize → vector → normalize → dot product──

## 常见陷

- **query 和 doc 使用同一个 model。**कुछ मॉडल ([[यात्रा、जीन-कोलबर्ट) असंबद्ध एन्कोडिंग, क्वेरी तथा दस्तावेज़ का उपयोग करते हैं 会经过不同路径──始终检查模型卡──
- **缺少 prefix。** `bge-*`मॉडल 需要在查询前加上 `"Represent this sentence for searching relevant passages: "`                                                                                                                                                                                                                                                              
- **过度裁剪 Matryoshka。**1,536 → 256 सामान्य सुरक्षा──1,536 → 64 असुरक्षित── कृपया अपने मूल्यांकन सेट पर परीक्षण करें──
- **Context truncation。**अधिकांश मॉडल में अधिकतम लंबाई के इनपुट से अधिक का समय होता है।
- **忽略 latency tail。**MTEB स्कोर  छुपा p99 विलंबता ∙ एक 600M मॉडल 335M मॉडल से अधिक हो सकता है 2 分, लेकिन प्रत्येक क्वेरी में 3x ∙

## इसका उपयोग करें

2026 स्टैकः

| Situation | Pick |
|-----------|------|
| 仅 English、快速、API | `text-embedding-3-large` 或 `voyage-3-large` |
| Open-weight、English | `BAAI/bge-large-en-v1.5` |
| Open-weight、multilingual | `BAAI/bge-m3` 或 `Qwen3-Embedding-8B` |
| Long context (32k+) | Voyage-3-large, Cohere embed-v4, Qwen3-Embedding-8B |
| CPU-only deployment | Nomic Embed v2 (137M params, MoE) |
| Storage-constrained | Matryoshka-truncated + int8 quantization |
| Keyword-heavy queries | 添加 SPLADE sparse，并与 dense 做 RRF-fuse |

2026 模式: BGE-M3 या पाठ-3-बड़ा  प्रारंभ, MTEB का उपयोग करके अपने डोमेन पर मूल्यांकन करें; यदि कोई डोमेन-विशिष्ट मॉडल  अग्रणी 3 से अधिक 分, पुनः चेंज करें

##  इसे जारी करें

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

## अभ्यास

1. **Easy。**उपयोग `bge-small-en-v1.5`以 पूर्ण dim (384) 编码 100 个句子, फिर以 Matryoshka 128 编码──在 10 个查询上测量MRR ड्रॉप──
2. **Medium。**RRF संलयन क्या सर्वश्रेष्ठ एकल मोड से अधिक है?
3. **Hard。**अपने शीर्ष 2 डोमेन कार्यों में ऊपर तीन उम्मीदवार मॉडल 运行MTEB―― रिपोर्ट MTEB स्कोर、100-क्वेरी बैच ऊपर p99 विलंबता, साथ ही $/1M क्वेरी── चुनें Pareto-उपтимаल का एक──

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

##  आगे पढ़ें

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084) द्वि-संकेतक 论文。
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316) रैंकिंग बोर्ड 论文──
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216) 统一三种 मोड का मॉडल。
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) आयाम-शिखरे  प्रशिक्षण लक्ष्य
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488) उत्पादन के बीच देर से बातचीत
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) 实时排名──
