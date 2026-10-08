# Modelos de incorporación  2026 profundidad解析

> Word2Vec para cada palabra proporciona un vector. Modelos de incorporación moderna para cada sección proporciona un vector.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

##  problemas

Tu sistema RAG tiene un 40% de tiempo de búsqueda de errores en el segmento.

En 2026 la opción de incorporar significa que debe ser tomado en cinco dimensiones:

1. **Dense vs sparse vs multi-vector。**Cada pasaje un vector, o cada token un vector, o una bolsa de palabras poco pesada.
2. **语言覆盖。**单语 英文模特 在纯英语 任务上仍然胜出──Multilingue models 在 corpus 混合时胜出──
3. **Context length。**512 Tokens vs 8.192 vs 32.768, mientras que la capacidad efectiva real suele ser del 60-70% del valor máximo.
4. **Dimension budget。**3,072 个 floats de precisión total = Cada vector 12 KB── hasta 100M Vectores 时, el costo de almacenamiento es de $1,300/mes──Matryoshka truncation puede reducirse 4×──
5. **Open vs hosted。**Peso abierto significa que tienes control de la pila y los datos.

Este curso explicará estas opciones, que te basen en la elección de la evidencia, no en lo que se ha hecho en la temporada pasada.

## 概念

![Dense, sparse, and multi-vector embeddings](../assets/embedding-modes.svg)

**Dense embeddings。**Cada segmento de un vector (normalmente 384-3,072 dimensiones)`text-embedding-3-large`、BGE-M3 modo denso、Voyage-3―默认选择―

**Sparse embeddings。**SPLADE-style──un transformador para cada token de vocablas 预测权重, luego colocará la mayor parte de ellos en zERO──结果是大小为 ‧Vocabular ‧的稀疏向量──捕获词典匹配(类似BM25), pero utiliza pesos de términos aprendidos── para consultas de palabras clave 很强──

**Multi-vector (late interaction)。**ColBERTv2、Jina-ColBERT── cada token un vector──use MaxSim 打分: para cada token de consulta, encontrar el token de documento más similar,并累加分数── almacenamiento y打分更昂贵, pero en consultas largas 和 corpora específicas de dominio 上胜出──

**BGE-M3：三者合一。**单个模型 同时输出密度、sparse 和多向量表示――每种都可以独立查询;分数通过权重数 融合――当你希望从一个检查点 获得灵活性时,这是2026年的默认选择――

**Matryoshka Representation Learning。**訓練方式使Vector's前 N 个维度 本身就是有用的独立嵌入式. 将 1,536-dim Vector 截断到 256 dim,只需约1%精度. 换取6x存储节省. OpenAI text-3、Cohere v4、Voyage-4、Jina v5、Gemini Embedding 2、Nomic v1.5+ 支持.

### El tablero de clasificación de MTEB sólo ha contado parte de la historia

Massive Text Embedding Benchmark 在发布时(2022) 覆盖 8 类任务中 56 个任务, expandió a 100+ 任务在 MTEB v2 中.

### Tres niveles

| Use case | Pattern |
|----------|---------|
| 快速 first-pass | Dense bi-encoder (BGE-M3, text-3-small) |
| Recall boost | Sparse (SPLADE, BGE-M3 sparse) + RRF fuse |
| top-50 上的 Precision | Multi-vector (ColBERTv2) 或 cross-encoder reranker |

La mayoría de las estacas de producción 会同時使用三者──


```figure
gx-matryoshka
```

## Construirlo

### 步骤 1: línea de base  utiliza los embebidos densos de Sentence-BERT

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

`normalize_embeddings=True`让点产品等于 cosin similaridad──始终设置它──

### 步骤 2: Truncamiento de matrioshka

```python
def truncate(vectors, dim):
    out = vectors[:, :dim]
    return out / np.linalg.norm(out, axis=1, keepdims=True)

emb_256 = truncate(emb, 256)
emb_128 = truncate(emb, 128)
```

截断后重新正常化──Nomic v1.5、OpenAI text-3 和 Voyage-4 都经过训练, por lo tanto, los primeros niveles de los modelos no matrioshka ([[original Sentence-BERT]]) están en una rápida degradación en el momento de la interrupción──

### Paso 3: BGE-M3 多功能性

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

Tres índices, una llamada de inferencia. Fusión de puntajes:

```python
dense_score = ... # cosine over dense_vecs
sparse_score = model.compute_lexical_matching_score(q_lex, d_lex)
colbert_score = model.colbert_score(q_col, d_col)
final = 0.4 * dense_score + 0.2 * sparse_score + 0.4 * colbert_score
```

En tu dominio, los pesos de arriba...

### Paso 4: En tarea personalizada 上 hacer MTEB eval

```python
from mteb import MTEB

tasks = ["ArguAna", "SciFact", "NFCorpus"]
evaluation = MTEB(tasks=tasks)
results = evaluation.run(encoder, output_folder="./mteb-results")
```

En un subconjunto de modelos candidatos con una representación, no sólo creas en el ranking de la lista de líderes, tu dominio es muy importante.

### Paso 5: Desde cero

¿ Qué ?`code/main.py` Embebedidos de Hashing Trick promedio (Study)  Impossible de comparar con los embebedidos de transformadores 竞争, pero mostró forma:tokenize → vector → normalize → product dot。

## 常见陷

- **query 和 doc 使用同一个 model。**Algunos modelos (Voyage、Jina-ColBERT) utilizan codificación asimétrica, consulta y documento 会经过不同路径──始终检查模型卡──
- **缺少 prefix。** `bge-*`Modelos  necesitan en consultas 前加上 `"Represent this sentence for searching relevant passages: "`◊ olvidar palabras recordar 会差 3-5 个点。
- **过度裁剪 Matryoshka。**1,536 → 256 Normal seguridad──1,536 → 64 No seguridad──Por favor en su conjunto de evaluaciones 上验证──
- **Context truncation。**La mayoría de los modelos se quedan en silencio más que la máxima longitud de entrada.
- **忽略 latency tail。**MTEB puntuaciones  ocultar p99 latencia― un modelo de 600M puede ser superior a 335M modelo alto 2 分, pero por cada consulta 成本高 3×―

## Usalo

Estaca 2026:

| Situation | Pick |
|-----------|------|
| 仅 English、快速、API | `text-embedding-3-large` 或 `voyage-3-large` |
| Open-weight、English | `BAAI/bge-large-en-v1.5` |
| Open-weight、multilingual | `BAAI/bge-m3` 或 `Qwen3-Embedding-8B` |
| Long context (32k+) | Voyage-3-large, Cohere embed-v4, Qwen3-Embedding-8B |
| CPU-only deployment | Nomic Embed v2 (137M params, MoE) |
| Storage-constrained | Matryoshka-truncated + int8 quantization |
| Keyword-heavy queries | 添加 SPLADE sparse，并与 dense 做 RRF-fuse |

2026 模式: desde BGE-M3 o texto-3-large 开始, utilizar MTEB en tu dominio 上评估; si un modelo específico de dominio 领先超过 3 分, re-切换──

##  Publicarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-embedding-picker.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy。**Uso `bge-small-en-v1.5`Es el número completo (384) 编码 100 个句子, luego es Matryoshka 128 编码──在 10 个查询上测量MRR drop──
2. **Medium。**En los 500 pasajes de tu dominio, ¿qué es mejor que la fusión de RF en el mejor modo?
3. **Hard。**En tus dos principales tareas de dominio, por ejemplo, para tres modelos candidatos 运行MTEB― 报告MTEB score―100-query batch 上的p99 latency, así como $/1M queries― 选择Pareto-optimal的那个―

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Dense embedding | 这个 Vector | 每段文本一个 fixed-size Vector。用 Cosine similarity 排序。 |
| Sparse embedding | Learned BM25 | 每个 vocab token 一个权重；大多为零；end-to-end 训练。 |
| Multi-vector | ColBERT-style | 每个 Token 一个 Vector；MaxSim scoring；更大的 index，更好的 recall。 |
| Matryoshka | Russian doll trick | 前 N dims 本身就是有效的更小 embedding。 |
| MTEB | 这个 benchmark | Massive Text Embedding Benchmark，发布时 56 个任务，v2 中 100+。 |
| BEIR | 这个 retrieval benchmark | 18 个 zero-shot retrieval tasks；常被引用来衡量 cross-domain robustness。 |
| Asymmetric encoding | Query ≠ doc path | Model 对 queries 和 documents 使用不同 projections。 |

##  más阅读

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084) bi-encoder 论文。
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316) tabla de clasificación 论文。
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216) 统一三种模式的模型──
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) dimensiones-escalera 训练目标。
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488) Interacción tardía entre la producción
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) 实时排名──
