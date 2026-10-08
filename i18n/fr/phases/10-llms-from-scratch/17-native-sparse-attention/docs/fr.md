# Attention à l' épargne native (NSA)

> En 64k Token, Attention va dévorer 70-80% du décode 延迟。 chaque modèle ouvert 实验室 a son programme de modification。DeepSeek's NSA(ACL 2025 best paper) est un programme de réelle stabilité: trois lignes Attention 分支, c'est-à-dire une marque de grosseur après compression、 sélectivité retenue de petitseur Token, ainsi que des fenêtres coulissantes utilisées dans le contexte local, via une porte apprise 组合 ensemble。 il est matériellement aligné (kernel-friendly)、nativement entraîneable (en même temps) pour une pré-entraînement, et non pas en temps d'inférence 时外), et en 64k décode, il est plus rapide que FlashAttention, atteint ou dépassant la qualité de l'attention complet。 Ben est connecté à la fin de la construction de ces trois segments, montrant pourquoi cette rareté peut être mise en œuvre à la fin de la fin de la fin de la fin de la micro-définition.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 12 (KV cache, flash-attention), Phase 7 · 15 (attention variants), Phase 10 · 16 (differential attention)
**Time:** ~60 minutes

## Objectif de l'apprentissage

- Parlez des trois branches de l'Agence nationale de sécurité, ainsi que de ce que chaque branche capture.
- Expliquer pourquoi la NSA est naturellement entraîneable, alors que la méthode d'attention rare précédente ne peut être utilisée que pour déduire.
- Dans le contexte 64k, en fonction de la taille du bloc de compression et de la sélection du top-k, calculer NSA comparativement attention totale de l'attention 计算节省量。
- Dans une courte séquence de synthèse, en utilisant stdlib Python 实现三分支组合,并验证 gating weights 

##  problématique

序列长度为 N 时,Full attention 的时间成本是 `O(N^2)`, pour chaque couche de KV cache est `O(N)` Dans les 64k Token, calcul et bande passante mémoire 数字都非常灾难──NSA 论文中的理论估计测量值显示:在 64k 下,Attention 占总解码 延迟的 70-80%──后续所有指标,包括 TTFT、tokens/sec、每百万 Token 成本,都被注意 成本主导──

L'attention éparsée est une réponse évidente. L'effort de répartition en deux catégories consiste à: la réparité de modèle fixe (sliding-window、strided、block-local) va abandonner l'information et échouer à la tâche de rappel à long terme. L'éparsité de temps d'inférence (KV cache pruning、H2O、StreamingLLM) est utilisée dans les modèles de pré-entraînement densément attentifs, ne pouvant récupérer qu'une petite partie de l'accélération potentielle, car le modèle n'a jamais été requis à travers des modèles épars.

Native Sparse Attention(Yuan et al., DeepSeek + PKU + UW, ACL 2025 meilleur document, arXiv:2502.11089)

## 概念

### Trois branches

Pour chaque requête, l'Agence nationale de sécurité (NSA) se réunit à trois reprises pour le cache KV.

1. **Compressed branch.**Les jetons sont classés en gros`l`Les blocs sont généralement de 32 ou 64) ⋅ chaque bloc ⋅ est comprimé en un seul jeton de résumé ⋅ est comprimé en un petit MLP ⋅ est comprimé en un seul jeton de résumé ⋅ est comprimé en un seul jeton.

2. **Selected branch.**Utilisez les points d'attention de la branche comprimée, identifier les points d'attention de la branche comprimée, et cliquer sur le lien suivant.

3. **Sliding-window branch.**La requête sera attendue jusqu'à la dernière .`W`个 Token (habituellement 512), utilisé dans le contexte local.

Trois branches de sortie par le biais de la porte de position apprise 组合:

```
out = g_cmp * out_cmp + g_sel * out_sel + g_win * out_win
```

`g_cmp, g_sel, g_win`Les poids de porte de la petite MLP sont généralement multipliés par 1, mais peuvent être considérés indépendamment par les différents poids.

### Pourquoi est-ce que c'est un entraîneur natif ?

sélection 步骤(top-k blocs) est dispersée. Les opérations dispersées perturberont le flux de gradient.

La NSA a détourné ce point: Attention de branche comprimée En effet, elle joue un rôle dans l'ensemble du séquence de la petite grosseur Attention, la plus haute opération est simplement de réutiliser la branche comprimée au plus haut point Attention, pour choisir les points de concentration nécessaires à la charge de blocs de petite grosseur.`top_k`L'opération est en avant vers le graphique de calcul. Il ne fonctionne que sur les blocs qui seront chargés dans la mémoire.

C'est pourquoi la NSA peut être utilisée de bout en bout pour la pré-formation. Le modèle va apprendre à parcourir trois branches de l'information, à générer un modèle rare et à accélérer la livraison réelle des engagements.

### Noyau aligné sur le matériel

Le noyau de la NSA est pour la hiérarchie de mémoire GPU moderne 设计的──nuyau 按 GQA group 加载查询(external loop), pour chaque groupe 获取对应的稀少KV块(inner loop),并 SRAM 上运行注意──由于每个查询组 看到相同的选区块──选择是 per query-group,而不是 per query-head),KV 加载会在组内摊销──算术强度维持在较高水平──

论文报告称, les noyaux de Triton sont décodés en 64k 上比 FlashAttention 快 9x, et le ratio de vitesse augmentera avec la longueur de la séquence.

### 计算预算

Pour faire`N`Pour la longueur du processus,`l`Pour la taille du bloc de compression,`k`Pour le nombre de sélections,`w`Pour la fenêtre coulissante,`b`Pour la taille du bloc sélectionnée(habituellement égal à `l`)。

- Branche comprimée: chaque requête a`O(N/l)`个 keys, donc le total `O(N * N / l)`Il y a une autre.
- Branche sélectionnée: chaque requête`O(k * b)`个 keys, donc le total `O(N * k * b)`Il y a une autre.
- Branche coulissante: chaque requête a`O(w)`个 keys, donc le total `O(N * w)`Il y a une autre.

总计:`O(N * (N/l + k*b + w))`Il y a une autre.

- Je suis là .`N = 64k, l = 64, k = 16, b = 64, w = 512`: chaque requête de coût`1000 + 1024 + 512 = 2536 keys`❖ Toute l'attention est`64000 keys` Compte réduit de 25 fois 

- Je suis là .`N = 128k, l = 64, k = 16, b = 64, w = 512`: chaque requête de coût`2000 + 1024 + 512 = 3536 keys`❖ Toute l'attention est`128000 keys` Réduire 36 fois  Les bénéfices augmentent avec la longueur de la séquence, c'est son but central 

### Comment comparer

| Method | Differentiable | Real inference speedup | Long-range recall |
|--------|---------------|----------------------|-------------------|
| Sliding window only | yes | yes | fails |
| Strided / block-sparse | yes | yes | partial |
| KV pruning (H2O, StreamingLLM) | N/A (inference-time) | yes | partial |
| MoBA (Moonshot) | partial | yes | good |
| NSA | yes (natively) | yes (9x at 64k) | matches full attention |

MoBA(Moonshot, arXiv:2502.13189) est également publié, a également adopté une approche similaire à trois victoires sur un seul, va MoE de principe appliqué aux blocs d'attention.


```figure
sliding-window-attention
```

## - Je le construis.

`code/main.py`Dans une courte séquence de synthèse réalisée en trois branches, il montre:

- Compression MLP (pour apprendre clairement, utiliser une base de base simple; NSA réelle utiliser MLP apprise)
- Par les scores de branches compressées 驱动的顶-k块选择──
- Récemment`w`个Token 上的 glisser-déposer Attention
- Combinaison fermées
- Prenez une attention particulière à l'impression de calcul comparatif.

### 步骤 1: Compresser les jetons en blocs

```python
def compress(K, l):
    n = len(K)
    n_blocks = (n + l - 1) // l
    out = []
    for b in range(n_blocks):
        start, end = b * l, min((b + 1) * l, n)
        block = K[start:end]
        summary = [sum(row[d] for row in block) / len(block) for d in range(len(K[0]))]
        out.append(summary)
    return out
```

### 步骤 2: branche compressée Attention

运行 query 针对压缩键的软max Attention──compressed-branch scores 同时作为顶级k选择的信号──

### 步骤 3: sélection du bloc supérieur

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `k`个压缩块的索引──加载这些块 中的原始未压缩代币,并在其上运行注意──

### 步骤 4: fenêtre coulissante Attention

Pour finir .`w`个 Token,并针对它们运行标准 Attention。

### 步骤 5: porte + combiner

Question 上的小型 MLP 产生三个门权量――最终输出是三个分支输出的权值总量――

### 步骤 6: compte par compute

打印每个分支、每个查询参加的键 数量以及总数──与 `N`(attention totale) faire une comparaison.`l = 32, k = 4, w = 128`,NSA chaque requête voir`32 + 128 + 128 = 288`Les clés, et l'attention totale est de 1024, réduit de 3,5x.

## Utilisez-le

La NSA est en train de rechercher profondément son propre pipeline de pré-entraînement dans un contexte long.

- **DeepSeek internal**:native, déjà publié le droit d'utiliser la NSA ou le DSA (Deepseek Sparse Attention)
- **vLLM**: est en train de développer un support expérimental de la NSA pour les poids de DeepSeek-V3.x
- **SGLang**: des références de la NSA ont été publiées; le parcours de production suit le VLLM;;
- **llama.cpp / CPU**: non supporté; en débit de CPU, la décomposition du noyau n'est pas valable.

Quelle est la durée de la NSA ?

- 面向64k+ contextes, et il existe un budget de calcul strict de pré-formation ou de cours de formation continue.
- Pour DeepSeek, faire des inférences sur ses propres points de contrôle dans le long contexte. Ces poids sont natifs de la NSA.

什么时候不要使用:

- Servir un modèle prétrainé à une attention dense 现有密集关注──没有继续培训,无法后装 NSA──
- Le contexte est inférieur à 16k.
- Le chat interactif de lot 1 ― décodeur sensible au retard ― sera bénéfique, mais seulement dans de longs contextes.

## Je le livre.

本课会产出 `outputs/skill-nsa-integrator.md` Donner une spécification de pré-entraînement de longue durée, elle produira un plan d'intégration NSA: taille de bloc de compression, vitre coulissante, largeur de porte MLP, choix de noyau, ainsi que des évaluations spécifiques de longue durée pour démontrer que l'architecture devient plus raisonnable.

## 练习

1. Dans 1024-Token  Synthèse séquence sur la mise en œuvre `code/main.py` Dans trois réglages de mise en place `(l, k, w)`Il est possible de faire des calculs imprimés.

2. Le compresseur de pools moyens sera remplacé par un petit MLP appris ((2-couche, caché 32) ⋅ dans un signal est un bloc  moyenne valeur de la tâche de synthèse sur l'entraînement ⋅ mesurer il est dans les données détenues en haut par rapport à la base de la pools moyens gap de perplexité ⋅

3. 实现 gate MLP── elle est utilisée comme requête 作为输入,输出三个规模──展示 gate 的行为是合理的:在随机查询上接近均权重;当查询命中远之前的块时,给选择分支给出较高权重──

4. 计算 NSA-activated 70B 模型 in 128k context 下的 KV cache memory budget。KV heads 为 8,head dim 为 128,BF16。与全注意以及 MLA(Phase 10 · 14 显示了MLA的数字) faire une comparaison。

5. 阅读 NSA 论文(arXiv:2502.11089) 第4 节,并用三句话解释为什么压缩分支的注意分会被重复用于顶级k选择,而不是计算一个单独的路由分数――将答案关联到渐进流――

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Compressed branch | “粗粒度视图” | 在 block-averaged keys 上做 Attention，以每个 query `O(N/l)` 个 keys 提供 global context |
| Selected branch | “Top-k blocks” | 在 compressed-branch scores 最高的 `k` 个 blocks 上做细粒度 Attention |
| Sliding window | “Local context” | 在最后 `W` 个 Token 上做 Attention，以捕获短程模式 |
| Native trainability | “打开 sparsity 进行 pre-train” | sparsity pattern 在 pre-training 期间学习，而不是在 inference 时外挂 |
| Compression block size l | “粗粒度视图的 group size” | 多少个 Token 被合并成一个 summary；通常为 32-64 |
| Top-k | “要保留的 blocks” | 读取其未压缩 Token 的 compressed blocks 数量；通常为 16 |
| Sliding window W | “Local attention radius” | 通常为 512；更短会损害 local coherence，更长会浪费计算 |
| Branch gate | “如何混合三个分支” | per-position MLP 输出，对三个分支的贡献加权 |
| Hardware alignment | “Kernel-friendly sparsity” | 选择 sparse pattern，使实际 GPU kernel 能达到理论 speedup |
| DSA | “NSA 的后继者” | Deepseek Sparse Attention，DeepSeek 系谱中继 NSA 之后的架构 |

## 延伸阅读

- [Yuan et al. — Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention (arXiv:2502.11089, ACL 2025 Best Paper)](https://arxiv.org/abs/2502.11089) 论文
- [DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) NSA 面向的架构家族
- [Moonshot AI — MoBA: Mixture of Block Attention for Long-Context LLMs (arXiv:2502.13189)](https://arxiv.org/abs/2502.13189) 同期工作, à l'intention des blocs
- [Beltagy et al. — Longformer: The Long-Document Transformer (arXiv:2004.05150)](https://arxiv.org/abs/2004.05150) fenêtre coulissante 起源
- [Xiao et al. — StreamingLLM: Efficient Streaming Language Models with Attention Sinks (arXiv:2309.17453)](https://arxiv.org/abs/2309.17453) NSA 改进的推理-时间稀缺基线
- [Dao et al. — FlashAttention-2 (arXiv:2307.08691)](https://arxiv.org/abs/2307.08691)Les noyaux de la NSA ont été battus en 64K.
