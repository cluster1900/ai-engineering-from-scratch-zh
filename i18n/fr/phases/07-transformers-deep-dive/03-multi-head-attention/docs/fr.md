# Une attention à plusieurs têtes

> Une tête d'attention une fois apprendre une relation.

**类型：**Construction
**语言：**Python
**前置知识：**Phase 7 · 02 ((Autoportrait à partir de zéro)
**时间：**- 75 minutes

##  problématique

个个自我注意头 会计算一个注意矩阵―― Cette matrice 捕捉一种 relation, généralement celle qui peut minimiser les pertes sur les signaux de formation en cours―― si dans vos données, l'accord sujet-verbe、co-référence、discours à long terme 和 syntaxique chunking                                                                                                                                                                                                                           

Le papier Vaswani de 2017 a donné une modification:并行运行多个注意功能, chacun a ses propres projections Q、K、V, puis le faire sortir avec un coup de tête.`d_model / n_heads`Le nombre de participants reste le même.

L'attention multi-tête est la configuration par défaut de tous les transformateurs en 2026[6]. Le seul débat se pose ici est de savoir combien de têtes doivent être utilisées, ainsi que les clés et les valeurs y a-t-il des projections communes ou non.

## 概念

![Multi-head attention splits, attends, concatenates](../assets/multi-head-attention.svg)

**Split。**取形为 `(N, d_model)``X`△分别 projection jusqu'à la forme`(N, d_model)`Le Q 、K 、V ∙ La forme pour `(N, n_heads, d_head)`, parmi lesquels `d_head = d_model / n_heads`❖ Transposer pour`(n_heads, N, d_head)`Il y a une autre.

**并行 Attend。**Dans chaque tête, dans chaque opération, on évalue l'attention du produit.`(N, d_head)` Ces têtes fonctionnent dans différents espaces de l'intégration, et ne communiquent pas entre elles pendant le calcul de l'attention.

**Concatenate 并 project。**Je vais mettre les têtes en pile`(N, d_model)`, puis multiplié en forme`(d_model, d_model)`                   `W_o`Il y a une autre.`W_o`Les têtes sont mises en place en position mixte.

**为什么有效。**Chaque tête peut être spécialisée, sans nécessité avec d'autres têtes 争抢表征预算── 20192024 années d'études de sonde  montrent différents rôles de tête: têtes de position ٬ attendent la tête du jeton précédent ٬ têtes de copie ٬ têtes d'entité nommée ٬ têtes d'induction ٬ elles constituent un mécanisme de base de l'apprentissage dans le contexte ٬

**2026 年的变体谱系：**

| Variant | Q heads | K/V heads | Used by |
|---------|---------|-----------|---------|
| Multi-head (MHA) | N | N | GPT-2, BERT, T5 |
| Multi-query (MQA) | N | 1 | PaLM, Falcon |
| Grouped-query (GQA) | N | G (e.g. N/8) | Llama 2 70B, Llama 3+, Qwen 2+, Mistral |
| Multi-head latent (MLA) | N | compressed to low-rank | DeepSeek-V2, V3 |

La GQA est un programme standard moderne, car elle peut être appliquée.`N/G`Le nombre de fois réduit la mémoire de cache KV, tout en maintenant presque la qualité complète.


```figure
multihead-split
```

## - Je le construis.

### Pas 1: Étant donné notre attention unique, nous avons déjà des têtes divisées.

取 Leçon 02 里的 `SelfAttention`, avec un coup de coupe / concat`code/main.py`Il y a une réalité:

```python
def split_heads(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)  # (heads, n, d_head)

def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

Une fois de remodeler et une fois de transposer. Pas de boucle.`nn.MultiheadAttention`Je vais faire quelque chose.

### 步骤 2: attention du produit par tête 运行

Chaque tête a sa propre tranche de Q、K、V. Attention, il est fait en masse.

```python
def mha_forward(X, W_q, W_k, W_v, W_o, n_heads):
    Q = X @ W_q
    K = X @ W_k
    V = X @ W_v
    Qh = split_heads(Q, n_heads)         # (heads, n, d_head)
    Kh = split_heads(K, n_heads)
    Vh = split_heads(V, n_heads)
    scores = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(Qh.shape[-1])
    weights = softmax(scores, axis=-1)
    out = weights @ Vh                    # (heads, n, d_head)
    concat = combine_heads(out)
    return concat @ W_o, weights
```

Sur le vrai matériel,`Qh @ Kh.transpose(...)`Oui, c'est une.`bmm`◊GPU 看到的是形状为 `(heads, N, d_head) × (heads, d_head, N) -> (heads, N, N)`Les têtes de matelots en lots sont très bon marché.

### 步骤 3: Groupe de requêtes Attention 变体

 seulement les projections de la clé et de la valeur 会改变──Q 获得 `n_heads`个群;K 和 V 获得 `n_kv_heads < n_heads`个 groupes,并被重复以匹配:

```python
def gqa_project(X, W, n_kv_heads, n_heads):
    kv = split_heads(X @ W, n_kv_heads)       # (kv_heads, n, d_head)
    repeat = n_heads // n_kv_heads
    return np.repeat(kv, repeat, axis=0)      # (n_heads, n, d_head)
```

En conséquence, cela économise la mémoire, car le cache KV ne se conserve que.`n_kv_heads`份副本, plutôt que `n_heads`份──Llama 3 70B Utilize 64 个查询头 和 8 个 KV头,也就是 8× 的缓存 缩减──

### Étape 4: essayez chaque tête apprendre ce que vous avez appris

Dans une phrase courte, 4 têtes sont utilisées pour faire fonctionner le MHA.`(N, N)`Attention matrice. Vous verrez différentes têtes même dans l'initialisation aléatoire.

## Utilisez-le

Dans PyTorch, une version:

```python
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=512, num_heads=8, batch_first=True)
```

GQA de PyTorch 2.5+

```python
from torch.nn.functional import scaled_dot_product_attention

# scaled_dot_product_attention auto-dispatches Flash Attention on CUDA.
# For GQA, pass Q of shape (B, n_heads, N, d_head) and K,V of shape
# (B, n_kv_heads, N, d_head). PyTorch handles the repeat.
out = scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)
```

**多少个 heads？**Règles d'expérience des modèles de production à partir de 2026:

| Model size | d_model | n_heads | d_head |
|------------|---------|---------|--------|
| Small (~125M) | 768 | 12 | 64 |
| Base (~350M) | 1024 | 16 | 64 |
| Large (~1B) | 2048 | 16 | 128 |
| Frontier (~70B) | 8192 | 64 | 128 |

`d_head` presque toujours en 64 ou 128  c'est une tête  voir combien unités de contenu  en moins de 32, les têtes  commenceront avec le facteur d'échelle `sqrt(d_head)`Vous perdrez les bénéfices de nombreux petits spécialistes.

## Je le livre.

Je vous en prie .`outputs/skill-mha-configurator.md`◊ cette compétence sera basée sur le budget paramétrique, la longueur de la séquence et l'objectif de déploiement, pour le nouveau Transformer  recommander le nombre de têtes, le nombre de têtes et la stratégie de projection ◊

## 练习

1. **简单。**取 `code/main.py`Le MHA est fixé.`d_model=64`Dans le cas présent,`n_heads`De 1 à 16... en copie synthétique... en dessinant un petit modèle à couche... en perdant... plus de têtes...
2. **中等。**实现 MQA(Tous les têtes de requête 共享一个KV tête)。 Mesurer le nombre de paramètres 相比全MHA下降了多少──计算推断 时 N=2048 下 KV-cache size 缩小了多少──
3. **困难。**实现 un minuscule 版本 de Multi-head Attention latente:`r`L'attention est à l'heure de la réaction.`r`取到多少时, cache mémoire 会降到全MHA的1/8以下,同时质量仍然保持在验证的1bit内 以内?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Head | “一个单独的 attention circuit” | 一个维度为 `d_head = d_model / n_heads` 的 Q/K/V projection，拥有自己的 attention matrix。 |
| d_head | “Head dimension” | Per-head hidden width；在 production 中几乎总是 64 或 128。 |
| Split / combine | “Reshape tricks” | Attention 前后的 `(N, d_model) ↔ (n_heads, N, d_head)` reshape+transpose。 |
| W_o | “Output projection” | Concatenating heads 之后应用的 `(d_model, d_model)` matrix；heads 在这里混合。 |
| MQA | “One KV head” | Multi-Query Attention：单个共享 K/V projection。KV cache 最小，但有一些质量损失。 |
| GQA | “The default since Llama 2” | `n_kv_heads < n_heads` 的 Grouped-Query Attention；通过重复来匹配 Q。 |
| MLA | “DeepSeek 的技巧” | Multi-head Latent Attention：K,V 被压缩到 low-rank latent，并在 attend time 解压。 |
| Induction head | “in-context learning 背后的 circuit” | 一对 heads，检测之前的出现位置，并复制其后跟随的内容。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need §3.2.2](https://arxiv.org/abs/1706.03762) Originaire de la plupart des règles
- [Shazeer (2019). Fast Transformer Decoding: One Write-Head is All You Need](https://arxiv.org/abs/1911.02150) MQA 论文。
- [Ainslie et al. (2023). GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245) 如何在训练后把 MHA 转换为 GQA──
- [DeepSeek-AI (2024). DeepSeek-V2 Technical Report](https://arxiv.org/abs/2405.04434) MLA, ainsi que pourquoi il est en mémoire cache  优于 MHA/GQA
- [Olsson et al. (2022). In-context Learning and Induction Heads](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html) Du point de vue mécaniste, les têtes sont réellement faites.
