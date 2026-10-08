# Embedding Models  2026 profundidade解析

> Word2Vec para cada palavra fornece um vetor. Modelos de incorporação moderna para cada parágrafo fornecem um vetor.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

## 问题

Seu sistema RAG tem 40% de tempo de pesquisa de erro. O problema é muito raramente um banco de dados vetorial ou um prompt.

Em 2026 escolher incorporar, significa que deve ser tomado em cinco dimensões:

1. **Dense vs sparse vs multi-vector。**Cada parágrafo um vetor, ou cada token um vetor, ou um saco de palavras com pouca peso.
2. **语言覆盖。**单语 英文模特 在纯英语 任务上仍然胜出──多语模特 在 corpus 混合时胜出──
3. **Context length。**512 Tokens vs 8.192 vs 32.768, enquanto a capacidade real válida geralmente é de apenas 60-70% do valor máximo.
4. **Dimension budget。**3,072 个 floats de precisão total = Cada vetor 12 KB── até 100M vetores 时, custo de armazenamento é de US $ 1.300/mês── matryoshka truncation 可将其减少4×──
5. **Open vs hosted。**Pesos abertos significa que você controla a pilha e dados.

Esta aula irá explicar estas tendências, deixando-o baseado em evidências, e não em que se baseia na população do ano passado.

## 概念

![Dense, sparse, and multi-vector embeddings](../assets/embedding-modes.svg)

**Dense embeddings。**Cada segmento de um vetor (normalmente 384-3,072 dimensões)`text-embedding-3-large`、BGE-M3 modo denso、Voyage-3―默认选择―

**Sparse embeddings。**SPLADE-style──a Transformer para cada token de vocab 预测权重, então colocará a maior parte dele em zero──outro resultado é o vector escasso para o vocabão  capturar a correspondência léxica(semelhante ao BM25), mas usando pesos de termos aprendidos──para consultas pesadas em palavras-chave 很强──

**Multi-vector (late interaction)。**ColBERTv2、Jina-ColBERT── cada token um vector── usar MaxSim 打分: para cada token de consulta, encontrar o token de documento mais semelhante,并累加分数── armazenamento e打分更昂贵, mas em longas consultas 和 corpora específicas de domínio 上胜出──

**BGE-M3：三者合一。**单个模型 同时输出密度、sparse 和多向量表示──每种都可以独立查询;分数通过权重积融合──当你希望从一个检查点获得灵活性时,这是2026年的默认选择──

**Matryoshka Representation Learning。**訓練方式使Vector's前 N 个维度 本身就是有用的独立嵌入式. 将 1,536-dim Vector 截断到 256 dim,只需约1%精度. 换取 6x storage savings. OpenAI text-3、Cohere v4、Voyage-4、Jina v5、Gemini Embedding 2、Nomic v1.5+ 支持.

### O ranking da MTEB só falava de uma parte da história .

Massive Text Embedding Benchmark 在发布时(2022) abranger 56 个任务, em MTEB v2 扩展到100+任务──2026年初,Gemini Embedding 2 在检索上排名第一(67.71 MTEB-R)──Cohere Embed-v4 领先一般(65.2 MTEB)──BGE-M3 领先开权多语域──63.0)──Leaderboard 是必要的,但不充分,始终在你的基准──

### 3 Modus

| Use case | Pattern |
|----------|---------|
| 快速 first-pass | Dense bi-encoder (BGE-M3, text-3-small) |
| Recall boost | Sparse (SPLADE, BGE-M3 sparse) + RRF fuse |
| top-50 上的 Precision | Multi-vector (ColBERTv2) 或 cross-encoder reranker |

A maioria das pilhas de produção 会同時使用三者──


```figure
gx-matryoshka
```

## Construí-lo

### 步骤 1: linha de base  Use Sentence-BERT de embutidos densos

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

### 步骤 2: Truncation de matrioshka

```python
def truncate(vectors, dim):
    out = vectors[:, :dim]
    return out / np.linalg.norm(out, axis=1, keepdims=True)

emb_256 = truncate(emb, 256)
emb_128 = truncate(emb, 128)
```

截断后重新正常化──Nomic v1.5、OpenAI text-3 和 Voyage-4 都经过训练, portanto, os primeiros vários níveis são básicos e não prejudicados──Non-Matryoshka modelos ([[original Sentence-BERT]]) 在被截断时会急剧退化──

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

Três índices, uma chamada de inferência. Fusão de pontos:

```python
dense_score = ... # cosine over dense_vecs
sparse_score = model.compute_lexical_matching_score(q_lex, d_lex)
colbert_score = model.colbert_score(q_col, d_col)
final = 0.4 * dense_score + 0.2 * sparse_score + 0.4 * colbert_score
```

Em seu domínio, os pesos são mais altos.

### 步骤 4: Na tarefa personalizada 上 fazer MTEB eval

```python
from mteb import MTEB

tasks = ["ArguAna", "SciFact", "NFCorpus"]
evaluation = MTEB(tasks=tasks)
results = evaluation.run(encoder, output_folder="./mteb-results")
```

Em um subconjunto de um grupo de candidatos com uma representação, não acredite apenas na classificação do ranking, seu domínio é muito importante.

### 步骤 5: From零手写 cosine

- Não .`code/main.py` Embutidos de Hashing Trick em média (solo em poucas horas)  Não pode comparar-se com embutidos de transformadores 竞争, mas mostrou forma:tokenize → vector → normalize → dot product。

## 常见陷

- **query 和 doc 使用同一个 model。**Alguns modelos (Voyage、Jina-ColBERT) usam codificação assimétrica, consulta, consulta e documento 会经过不同路径──始终检查模型卡──
- **缺少 prefix。** `bge-*`Modelos 需要在查询 前加上 `"Represent this sentence for searching relevant passages: "`◊ esquece palavras lembre-se 会差 3-5 个点。
- **过度裁剪 Matryoshka。**1,536 → 256 Normalmente segurança―1,536 → 64 Não segurança―Please in your evalu set 上验证―
- **Context truncation。**A maioria dos modelos vai cortar mais que a maior extensão de entrada.
- **忽略 latency tail。**MTEB pontuações  ocultar p99 latência― um modelo de 600M talvez superior a modelo 335M  2 分, mas por consulta  成本高 3×―

## Use-o

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

2026 模式: desde BGE-M3 ou texto-3-large 开始, use MTEB em seu domínio 上评估; se um modelo específico de domínio 领先超过3分, re-切换──

##  Publicá-lo

保存为 `outputs/skill-embedding-picker.md`- Não .

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

1. **Easy。**Utilização `bge-small-en-v1.5`Em 10 perguntas, a MRT cai em 10 palavras.
2. **Medium。**Em 500 passagens de seu domínio, acima comparado BGE-M3 dense, sparse, colbert, qual está em recall@10 上胜出?
3. **Hard。**Em suas duas principais tarefas de domínio, você pode selecionar um pareto-óptimo para as perguntas de $ 1M.

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

##  weiterlesen

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084) bi-encoder 论文。
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316) quadro de resultados 论文──
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216)Modelo de modo  统一三种
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) dimensão-escaladinha 訓練目標。
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488) Interação tardia entre a produção
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) 实时排名──
