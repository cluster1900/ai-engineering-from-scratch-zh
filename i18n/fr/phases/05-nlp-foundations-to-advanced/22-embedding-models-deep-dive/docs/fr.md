# Modèles d'intégration  2026

> Word2Vec pour chaque mot fournit un vecteur. Modèles modernes d'intégration pour chaque segment fournissent un vecteur.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

##  problématique

Votre système RAG a 40% de temps de recherche à l'erreur de passage.

En 2026 la sélection d'intégration signifie que vous devez prendre en cinq dimensions:

1. **Dense vs sparse vs multi-vector。**Chaque passage est un vecteur, ou chaque jeton, ou un sac de mots peu pondérés.
2. **语言覆盖。**单语 英文模特 在纯英语 任务上仍然胜出──多语模特 在 corpus 混合时胜出──
3. **Context length。**512 Tokens vs 8.192 vs 32.768, tandis que la capacité réelle et efficace n'est généralement que de 60-70% de la valeur maximale.
4. **Dimension budget。**3,072 个 floats de précision totale = chaque vecteur 12 KB──à 100M Vecteurs 时, le coût de stockage est de 1 300 $/mois──matryoshka truncation 可将其减少4×──
5. **Open vs hosted。**Le poids ouvert signifie que vous contrôlez la pile et les données.

Ce cours va vous expliquer ces choix, vous laisser basé sur des preuves, et non sur ce qui a été populaire au cours de la dernière saison.

## 概念

![Dense, sparse, and multi-vector embeddings](../assets/embedding-modes.svg)

**Dense embeddings。**Chaque passage d'un vecteur (habituellement 384-3,072 dimensions)`text-embedding-3-large`、BGE-M3 mode dense、Voyage-3──默认选择──

**Sparse embeddings。**SPLADE-style── un transformateur pour chaque jeton de vocabulaire 预测权重, puis la plupart d'entre eux seront placés à zéro── résultat est un vecteur rare pour le vocabulaire  Capture le parallèle lexique( similaire à BM25), mais utilise des poids de termes appris── pour les requêtes de mots clés lourds 很强──

**Multi-vector (late interaction)。**ColBERTv2、Jina-ColBERT── chaque jeton un vecteur── utiliser MaxSim 打分: pour chaque jeton de requête, trouver le plus similaire jeton de document,并累加分数── stockage et打分更昂贵, mais dans les longues requêtes 和 domaines spécifiques corpora 上胜出──

**BGE-M3：三者合一。**单个模型 同时输出密度、sparse 和多向量表示――每种都可以独立查询;分数通过权重数 融合――当你希望从一个检查点 获得灵活性时,这是2026年默认选择――

**Matryoshka Representation Learning。**Le vecteur de 1,536 dimensions est interrompu à 256 dimensions, avec seulement une précision d'environ 1% en échange d'économies de stockage de 6 fois.

### Le classement de la MTEB ne raconte que quelques-unes des histoires

Massive Text Embedding Benchmark dans la publication du volume en 2022) couvre 56 tâches parmi 8 catégories de tâches, étendues à plus de 100 tâches dans MTEB v2 en 2026.

### Mode de trois niveaux

| Use case | Pattern |
|----------|---------|
| 快速 first-pass | Dense bi-encoder (BGE-M3, text-3-small) |
| Recall boost | Sparse (SPLADE, BGE-M3 sparse) + RRF fuse |
| top-50 上的 Precision | Multi-vector (ColBERTv2) 或 cross-encoder reranker |

La plupart des piles de production seront utilisées simultanément.


```figure
gx-matryoshka
```

## - Je le construis.

### 步骤 1: baseline  utiliser les emblèmes denses de Sentence-BERT

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

`normalize_embeddings=True`让点产品等于宇宙相似之──始终设置它──

### 步骤 2: Truncation de la matryoshka

```python
def truncate(vectors, dim):
    out = vectors[:, :dim]
    return out / np.linalg.norm(out, axis=1, keepdims=True)

emb_256 = truncate(emb, 256)
emb_128 = truncate(emb, 128)
```

截断后重新正常化──Nomi v1.5、OpenAI text-3 和 Voyage-4 ont été entraînés, de sorte que les premiers niveaux de niveau sont fondamentalement inexistants──Non-matryoshka modèles(original Sentence-BERT) sont rapidement dégradés lorsqu'ils sont coupés──

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

Trois indices, une seule appel d'inférence.

```python
dense_score = ... # cosine over dense_vecs
sparse_score = model.compute_lexical_matching_score(q_lex, d_lex)
colbert_score = model.colbert_score(q_col, d_col)
final = 0.4 * dense_score + 0.2 * sparse_score + 0.4 * colbert_score
```

Dans votre domaine, les poids sont en haut.

### 步骤 4: Dans la tâche personnalisée 上 faire MTEB évaluer

```python
from mteb import MTEB

tasks = ["ArguAna", "SciFact", "NFCorpus"]
evaluation = MTEB(tasks=tasks)
results = evaluation.run(encoder, output_folder="./mteb-results")
```

Dans un ensemble de modèles de candidature ayant une représentation, ne croyez pas seulement au classement du classement, votre domaine est important.

### 步骤 5: De zéro à écrit cosine

Je vous en prie .`code/main.py` Embeddings de Hashing Trick moyennes (environ)  Impossible avec les embeddings de transformateurs 竞争, mais a montré la forme:tokenize → vecteur → normaliser → produit de point。

## 常见陷

- **query 和 doc 使用同一个 model。**Certains modèles utilisent des codage asymétriques, des requêtes et des documents.
- **缺少 prefix。** `bge-*`Modèles 需要在查询 前加上 `"Represent this sentence for searching relevant passages: "`◊ oublier les mots rappeller 会差 3-5 个点。
- **过度裁剪 Matryoshka。**1,536 → 256 Normalement sécurité──1,536 → 64 Non sécurisée──Please in your evalu set 上验证──
- **Context truncation。**La plupart des modèles seront silencieux et interrompu au-delà de la longueur maximale de l'entrée.
- **忽略 latency tail。**Les scores MTEB  cachent une latence de p99― un modèle 600M peut être supérieur à un modèle 335M élevé 2%, mais pour chaque requête, il est élevé 3×―

## Utilisez-le

L'étape 2026:

| Situation | Pick |
|-----------|------|
| 仅 English、快速、API | `text-embedding-3-large` 或 `voyage-3-large` |
| Open-weight、English | `BAAI/bge-large-en-v1.5` |
| Open-weight、multilingual | `BAAI/bge-m3` 或 `Qwen3-Embedding-8B` |
| Long context (32k+) | Voyage-3-large, Cohere embed-v4, Qwen3-Embedding-8B |
| CPU-only deployment | Nomic Embed v2 (137M params, MoE) |
| Storage-constrained | Matryoshka-truncated + int8 quantization |
| Keyword-heavy queries | 添加 SPLADE sparse，并与 dense 做 RRF-fuse |

Modèle 2026: de BGE-M3 ou texte-3-grand  commencer, utiliser MTEB dans votre domaine  上评估; si un modèle spécifique à votre domaine 领先 3 分, re-切换──

##  La publier

保存为 `outputs/skill-embedding-picker.md`- Le numéro de la liste:

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

1. **Easy。**Utilisation `bge-small-en-v1.5`À la fin de la série, le nombre de requêtes est de 10 à 10 questions.
2. **Medium。**Dans les 500 passages de votre domaine, comparez le BGE-M3 dense, sparse et colbert.
3. **Hard。**Dans vos 2 principales tâches de domaine, choisissez les trois modèles candidats 运行MTEB― 报告MTEB score、100-queries batch 上的p99 latency, ainsi que les requêtes de 1M$― 选择Pareto-optimal的那个―

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

##  ultérieur

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084) bi-encodeur 论文。
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316) tableau de classement 论文。
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216) 统一三种模式的模型──
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) dimension-échelle 训练目标。
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488) Interaction tardive entre la production
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) 实时排名──
