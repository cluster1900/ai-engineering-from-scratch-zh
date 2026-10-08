# Attention différentielle (V2)

> Softmax Attention 会在每一个不匹配的代币上分散少量概率──在100k个代币上, ces bruits accumuleront et submergeront le signal──Differential Transformer(Ye et al., ICLR 2025) 通过将 Attention 计算为两个 softmax差来来解决这个问题,从而减去共享噪音下限──DIFF V2(Microsoft, 2026年1月) 面向生产的重写版本:decode latency与基线 Transformer 持平,无需Flash kernels,并兼容. Attention──本课程将端端讲解V1到V2,并提供可运行差分操作玩具实现,使用Std Python 即可运行──

**类型:**Construction
**语言:**Python (stdlib)
**前置要求:**Phase 7 · 02 (auto-attention), Phase 7 · 15 (variantes d'attention), Phase 10 · 14 (marche de l'architecture)
**时间:**- 60 minutes

## Objectif de l'apprentissage

- 准确说明为什么 softmax Attention 存在噪音下限,以及为什么随着背景长度而增长.
- 推导 attention différentielle 公式,并解释为什么相减会抵消共享噪音成分,同时保留信号──
- 讲解 V1 à V2 différences: quels sont les éléments plus rapides, plus simples, plus stables, ainsi que pourquoi chaque changement de niveau de production de pré-formation sont nécessaires.
- Utilisez Python purement à partir de zéro pour réaliser l'attention différentielle et effectuez une requête synthétique de signal-plus-bruit.

##  problématique

Attention, il y a une nature mathématique, à grande échelle, il devient un problème d'ingénierie.`q`Attention, le poids est`softmax(qK^T / sqrt(d))` Softmax 永远无法产生精确的零值每个不匹配的代币都会得到一些正质量──这个残余质量就是噪音,并且会随着背景长度扩大── 在128k 个代币下,即使每个不匹配的代币只获得0.001%的概率,127,999 代币合并也会贡献约12%的总量──模型必须学会绕开一个随着背景 增长的噪音下限──

En effet, cette performance s'est produite pour Attention head 干扰:long-context RAG 幻觉引用、100k-Token 检索任务中的 lost-in-the-middle 失败, ainsi que l'aiguille-in-haystack benchmark dans les plus de 32k 后出现细微精度下降──Differential Transformer 论文 ((arXiv:2410.05258, ICLR 2025) ont mesuré cette différence:DIFF Transformers par rapport aux lignes de base de la même taille  obtenu une plus faible perplexité、 une plus grande précision dans le long du contexte, ainsi que moins d'hallucinations──

Le DIFF V1 a trois problèmes, ce qui l'empêche d'entrer dans le pipeline de pré-entraînement de la première ligne. Son cache de valeur doit être chargé deux fois à chaque étape de décode, il nécessite des noyaux CUDA personnalisés, détruisant la compatibilité de FlashAttention, et sa norme RMS par tête dans des entraînements à long terme à plus de 70B entraînera une instabilité.

## 核心概念

### Softmax de bruit en bas de limite

 Pour la requête `q`和 clés `K = [k_1, ..., k_N]`Attention, le poids est:

```
w_i = exp(q . k_i / sqrt(d)) / sum_j exp(q . k_j / sqrt(d))
```

- Je ne sais pas .`w_i`Ça va être nul.`k_i`Avec `q`- Je suis pas d'accord.`q . k_i`C'est aussi une variation de 0 à 0`||q||^2 / d` Après la normalisation de la softmax, chaque jeton est toujours en train de s'accroître et de contribuer `O(1/N)`△无关 Token 的总贡献是 `O((N-1)/N) = O(1)`Ce n'est pas une petite quantité.

模型想要的更像是硬顶-k:在匹配代币上给高权重,在其他位置接近零──软max 过平滑,无法直接做到这一点──

### Des différences

Pour chaque tête de Q et K projections 拆成两份:Q = (Q_1, Q_2),K = (K_1, K_2)。计算两个

```
A_1 = softmax(Q_1 K_1^T / sqrt(d))
A_2 = softmax(Q_2 K_2^T / sqrt(d))
```

输出:

```
DiffAttn = (A_1 - lambda * A_2) V
```

Si deux cartes ont un poids approximatif moyen sur 127 000 Tokens sans lien, ces parties s'opposent mutuellement. Signal  Peak Poids sur les deux Tokens ne sera pas toléré que lorsque les deux cartes apparaîtront de la même amplitude, alors que le modèle ne sera pas maintenu après l'entraînement.

`lambda`C'est un seul et unique modèle à apprendre.`lambda = exp(lambda_q1 dot lambda_k1) - exp(lambda_q2 dot lambda_k2) + lambda_init`Il peut être négatif.`lambda_init`默认是类似于0.8 的小正数──

### Pourquoi ça ressemble à un bruit de tête

On peut l'imaginer comme deux microphones bruyants enregistrés dans le même son. Tous deux enregistrent le locuteur ainsi que le bruit de fond associé. D'un signal en diminuant l'autre, le bruit commun diminue. Le bruit peut être conservé, car les deux signaux sont suffisamment différents en phase ou en amplitude, ne pouvant pas être complètement neutralisés.`lambda`C'est exactement ce que j'ai appris.

### V1 contre V2: différence

V1  maintenu le même paramètre que le transformateur de base ⋅ Pour que chaque tête ait deux requêtes, il réduira la dimension de la tête ⋅ à la moitié. Ceci a sacrifié la capacité d'expression de la tête, ce qui est plus douloureux, c'est aussi de faire que la valeur de chaque tête ⋅ à la moitié ⋅ à la cache. Décode Chaque étape doit charger la valeur de cache ⋅ à deux reprises ⋅ à chaque branche de softmax une fois ⋅ à chaque fois.

V2 va faire des têtes de requête numéros multipliés,并保持 KV têtes 不变(de la projection en amont 借用参数) ――Tête dimension 保持与基线相同──相减后, extra dimension sera projetée de nouveau, en correspondant à la projection O_W du transformateur baseline── trois choses se produisent simultanément:

1. La vitesse de décode par rapport à la ligne de base
2. FlashAttention 可原样运行( pas besoin de noyau personnalisé)
3. Décodez l'intensité arithmétique de l'heure   améliorer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

V2 a également déménagé V1 pour stabiliser la RMSNorm par tête. Dans la taille de la formation préalable au niveau 70B, cette RMSNorm permettra de stabiliser la formation de la dernière phase.

### Pourquoi l'utiliser ?

| Workload | Benefit |
|----------|---------|
| Long-context RAG (64k+) | 更干净的 Attention maps，更少幻觉引用 |
| Needle-in-haystack benchmarks | 32k 之后 accuracy 显著提升 |
| Multi-document QA | 更少跨文档干扰 |
| Code completion at 8k | 收益有限，不值得改变 architecture |
| Short chat (< 4k) | 基本与 baseline 不可区分 |

收益会随着背景长度 增长而增加──在4k Token 下,噪音下限足够小,标准注意力 已可用──在128k 下, il va commencer à avoir des effets néfastes.

### Comment ça se passe avec les autres boutons 2026 ?

| Feature | Compatible with DIFF V2? |
|---------|------------------------|
| GQA | 是（V2 增加 Q heads，而不是 KV heads） |
| MLA (DeepSeek) | 原则上是，但尚无公开论文将二者结合 |
| MoE | 是（Attention 独立于 MLP block） |
| RoPE | 是（不变） |
| YaRN / long-context scaling | 是（正是 DIFF 最有帮助的场景） |
| FlashAttention | 是，V2 支持（V1 不支持） |
| Speculative decoding | 是（Attention 改动对 spec-decode loop 不可见） |


```figure
differential-attention
```

## - Je le construis.

`code/main.py`Utilisation de Python  réalisé une attention différentielle  Une requête de jouet avec une structure de signal-plus-bruit déjà connue, vous permet de mesurer directement le taux d'oxydation du bruit 

### 步骤 1: attention à la douceur max standard

Opérations de matrice stdlib: liste de listes  matmul·, avec la valeur maximale réduite pour assurer la stabilité de la valeur numérique 

```python
def softmax(row):
    m = max(row)
    exps = [math.exp(x - m) for x in row]
    s = sum(exps)
    return [e / s for e in exps]
```

### Étape 2: Décomposer en deux

V1 风格:将头寸 减半──V2 风格: maintenir la tête dimension,并将头数量加倍──toy implementation 为了教学清晰使用 V1数学完全相同,只有会计不同──

### 步骤 3: 两个 branches de la maxime douce + 相减

```python
A1 = [softmax([dot(q1, k) / scale for k in K1]) for q1 in Q1]
A2 = [softmax([dot(q2, k) / scale for k in K2]) for q2 in Q2]
diff_weights = [[a1 - lam * a2 for a1, a2 in zip(r1, r2)] for r1, r2 in zip(A1, A2)]
out = [[sum(w * v[j] for w, v in zip(row, V)) for j in range(d_v)] for row in diff_weights]
```

Remarque: la sortie de poids peut être négative. Ce n'est pas un problème.

### 步骤 4: La mesure du bruit

Construire une séquence de synthèse de 1024 séquences  Le signal Token                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

### 步骤 5: V1 contre V2 参数核算

给定一个配置 ((hidden=4096, heads=32, d_head=128),打印:

- Transformateur de base: Q、K、V`hidden * hidden`, MLP pour 4 * caché
- DIFF V1: Q、K de taille à taille`hidden * hidden`Je suis un petit garçon.`hidden * hidden`(不变), tête faible en intérieur diminution à moitié, augmentation par tête `lambda`Les têtes sont des têtes.
- DIFF V2: Q`2 * hidden * hidden`Je suis un petit garçon.`hidden * hidden`Je suis un petit garçon.`hidden * hidden`◊ la taille supplémentaire sera augmentée en O_W`lambda`- Je suis un homme.

Jouet 会测量 V2 额外参数成本(大约每个注意区 额外 `hidden * hidden`),并打印出来──

## Utilisez-le

截至 2026 年 4 月,DIFF V2 尚未发布在每个生产推断服务器中,但vLLM 和 SGLang 正在推进集成.

- Microsoft 内部 long-context 生产模型。
- Résumé du projet de recherche de formation open model de plusieurs facettes dans un contexte de 256k+.
- L'attention DIFF et l'attention des fenêtres coulissantes sont combinées dans des architectures hybrides en échange de couches.

Vous choisirez son scénario en 2026:

- De zéro entraînement un nouveau modèle de contexte efficace à 64k+.
- L'équilibre de la structure de l'image est un modèle de long contexte, et perdu dans le milieu.

Tu ne choisirais pas sa scène:

- Vous êtes en train de servir un modèle dense pré-entraîné à long terme avec des performances stables.
- Votre contexte est toujours inférieur à 16K.

## Je le livre.

本课会生成 `outputs/skill-diff-attention-integrator.md` déterminer une architecture de modèle, la longueur du contexte cible, le profil d'hallucination et le budget de formation, elle générera un plan d'intégration, utilisé pour attirer l'attention différentielle  ajouter une nouvelle course pré-entraînement ou un nouvel ajustement LoRA 

## 练习

1. 运行  référencement`code/main.py` Évaluation dans la requête synthétique 上,attention différentielle  rapport rapport rapport signal-bruit 高于标准 softmax Attention。 modifier la amplitude du bruit,并展示标准 Attention 变得不可用交叉点──

2. Pour un modèle de classe 7B ((hidden=4096, heads=32, d_head=128, 32 couches), calculer les variations de paramètres de la base à la DIFF V1 ainsi que les variations de paramètres de la base à la DIFF V2.

3. 阅读DIFF V1 论文(arXiv:2410.05258) 文章, Section 3, ainsi que la section 2 du blog DIFF V2 Hugging Face 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章, 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章 文章   文章 文章 文章    文章 文章     文章     文章                   文章                                                                                                                                                 

4. 实现一个 ablation:分别用 `lambda = 0`(pure première douceur max)`lambda = 1`(完整相减) Calculer l'attention différentielle.`lambda`Il y a une autre.

5. Pour le jeu  étendre à GQA + DIFF V2── sélectionner 8 têtes KV et 32 têtes Q── montrer la taille du cache KV avec la même (8, 32)  configure de base modèle GQA 匹配──

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Differential attention | “两个 softmax 相减” | 将 Q、K 拆成两半，计算两个 softmax maps，从第一个中减去第二个（由 lambda 缩放），然后乘以 V |
| Noise floor | “softmax 的非零尾部” | Softmax 放在每个无关 Token 上的 O(1/N) 权重，在 long contexts 中会累加到 O(1) |
| lambda | “相减的缩放系数” | 每个 head 的可学习标量，参数化为 `exp(lq1.lk1) - exp(lq2.lk2) + lambda_init`；可以为负 |
| DIFF V1 | “ICLR 2025 版本” | 原始 Differential Transformer；将 head dim 减半以保持参数量，需要 custom kernel，decode 更慢 |
| DIFF V2 | “2026 年 1 月修复版” | 在保持 KV heads 的同时将 Q heads 加倍；decode speed 与 baseline 持平，并兼容 FlashAttention |
| Per-head RMSNorm | “V1 稳定器” | V1 在差分之后应用的额外 norm；V2 移除了它，以避免后期训练不稳定 |
| Signal-to-noise ratio | “有多少 Attention 被浪费了” | 真实 signal 位置上的权重与无关位置平均权重之间的比率 |
| Lost in the middle | “Long-context failure mode” | 一个实证现象：长 context 中间位置文档的检索 accuracy 会下降——DIFF attention 可以缓解这一点 |
| Arithmetic intensity | “每加载一个 byte 对应多少 FLOPs” | V2 在 decode 时通过每次 KV 加载对应双倍 queries 来提高的比率；对 memory-bound decode 很重要 |

## 延伸阅读

- [Ye et al. — Differential Transformer (arXiv:2410.05258, ICLR 2025)](https://arxiv.org/abs/2410.05258) Originiels, contenant des ablations de la théorie et du long contexte
- [Microsoft unilm — Differential Transformer V2 (Hugging Face blog, January 2026)](https://huggingface.co/blog/microsoft/diff-attn-v2) 面向生产的重写版本,匹配基线解码,并兼容FlashAttention
- [Understanding Differential Transformer Unchains Pretrained Self-Attentions (arXiv:2505.16333)](https://arxiv.org/abs/2505.16333)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Shared DIFF Transformer (arXiv:2501.17900)](https://arxiv.org/html/2501.17900) 参数共享变体
- [Vaswani et al. — Attention Is All You Need (arXiv:1706.03762)](https://arxiv.org/abs/1706.03762) Transformateur de base de la phase de réduction du DIFF
- [Liu et al. — Lost in the Middle (arXiv:2307.03172)](https://arxiv.org/abs/2307.03172) L'attention du FIFG 面向的长文本基准
