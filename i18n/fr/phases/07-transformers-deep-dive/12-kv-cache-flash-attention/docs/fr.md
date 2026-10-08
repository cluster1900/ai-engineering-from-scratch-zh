# KV Cache, attention flash et optimisation de la proposition

> L'entraînement est en phase avec la limitation de FLOP.

**Type:** Build
**Languages:** Python
**先修要求：**La phase 7 · 02 (auto-attention), la phase 7 · 05 (transformateur complet), la phase 7 · 07 (GPT)
**Time:** ~75 minutes

##  problématique

Un décodeur de retour automatique simple`N`个代币 需要做 `O(N²)`工作: chaque étape sera recalculée sur la totalité de la réponse de la 4K-token, ce qui signifie 16M fois d'attention 运算, la plupart d'entre eux sont redondants 工作: chaque état caché de la première jeton une fois calculé est déterminé  vous avez seulement besoin de faire la requête de la nouvelle jeton  去和此前所有的代币 缓存下来的钥匙和值做计算

En outre, l'attention elle-même va également transporter une grande quantité de données. L'attention standard se matérialise dans une matrice de score N×N, une sortie de softmax N×d, une sortie finale N×d.

Dao et al. ont proposé deux optimisations, en passant de la lenteur à la lenteur:

1. **KV cache。**存储每个前代币的K和V向量──每个新代币的注意都是一个查询对缓存键的计算──推理从每个代步的推理`O(N²)`- Je ne sais pas .`O(N)`Il y a une autre.
2. **Flash Attention。**Pour l'attention  calculer la taille des carreaux, rendre la matrice N×N complète  ne pénétrera jamais dans le HBM。 tous les softmax + matmul sont terminés dans le SRAM。 en A100 en haut accélération du mur-horloge pour 24×; en support du H100 de FP8 pour 510×。

D'ici 2026, les deux sont déjà conçus. Chaque classe de production propose une hypothèse de leur existence.

## 核心概念

![KV cache growth and Flash Attention tiling](../assets/kv-cache-flash-attn.svg)

### Mathématiques de cache KV

Chaque couche de décodeur, chaque jeton, chaque tête:

```
bytes_per_token_per_layer = 2 * d_head * dtype_size
                          ^
                          K and V
```

Pour un modèle 7B, 32 couches 32 têtes d'un modèle:

```
per token per layer = 2 * 128 * 2 = 512 bytes
per token (32 layers) = 16 KB
per 32K context = 512 MB
```

Pour les Llama 3 70B ((80 层、d_head=128、 utiliser 8 个 KV heads of GQA):

```
per token per layer = 2 * 8 * 128 * 2 = 4096 bytes (4 KB)
per 32K context = 10.4 GB
```

C'est pourquoi, dans le contexte de 128K, le cache KV de la taille de la série 1 occuperait une grande partie du stockage de 40 Go de l'A100.

**GQA 是 KV-cache 的关键收益。**Utilisation de 64 têtes de MHA 会需要32 GB──MLA encore pouvoir se compresser davantage──

### Attention à la lumière

Attention à la norme:

```
S = Q @ K^T          (HBM read, N×N, HBM write)
P = softmax(S)       (HBM read, HBM write)
O = P @ V            (HBM read, HBM write)
```

Trois fois HBM 往返── sur H100, HBM 带宽 est de 3 TB/s; SRAM est de 30 TB/s── par rapport à tout le contenu conservé sur la puce, chaque fois HBM 往返都会带来约10倍的减速──

Attention à la lumière:

```
for each block of Q (tile size ~128 × 128):
    load Q_tile into SRAM
    for each block of K, V:
        load K_tile, V_tile into SRAM
        compute S_tile = Q_tile @ K_tile^T     (SRAM)
        running softmax aggregation             (SRAM)
        accumulate into O_tile                  (SRAM)
    write O_tile to HBM
```

Chaque carreaux ne nécessite qu'une seule HBM.`O(N²)`- Je ne sais pas .`O(N)`❖ Pass rétrograde 会从前进pass 中重新计算部分值,而不是把它们全部存存下来

**数值技巧。**Retour à la douceur max dans les carreaux entre les réparations`(max, sum)`, donc la définition finale est précise. Ceci n'est pas approximatif.

**版本演进：**

| Version | Year | Key change | Speedup on reference hardware |
|---------|------|-----------|-------------------------------|
| Flash 1 | 2022 | Tiled SRAM kernel | A100 上 2× |
| Flash 2 | 2023 | 更好的并行性，causal-first ordering | A100 上 3× |
| Flash 3 | 2024 | Hopper asynchrony、FP8 | H100 上 1.5–2×（~740 TFLOPs FP16） |
| Flash 4 | 2026 | Blackwell 5-stage pipeline、software exp2 | Inference-first（最初仅 forward） |

Flash 4 发布时只支持前进通过──训练仍然使用 Flash 3──Flash 4 的 GQA 和 varlen 支持仍在等中(2026年中)──

### Décodage spéculatif  另一个延迟优化

廉价模型提出 N 个代币――大模型并行验证全部N 个代币――如果验证接受 k 个代币,你就就用1次大模型前进通过 换来 k 次生成――对于代码和散文,典型 k=35──

2026:
- **EAGLE 2 / Medusa。**Les états cachés du vérificateur sont réunis, 2  3 × accélération, et sans perte de qualité.
- **Speculative decoding with draft model。**Il y a 2 à 4 fois de vitesse sur le matériel de consommation.
- **Lookahead decoding。**Iteration Jacobi; pas besoin de modèle de projet.

### Partage continu

经典批发推断: attendre la séquence la plus lente 结束, puis lancer un nouveau lot ⋅当短响应提前结束时,会浪费GPU⋅

Les requêtes sont effectuées en série, les demandes sont modifiées en série. Pour les besoins de travail, la capacité de charge est augmentée de 510×。

### PagedAttention  Mettre KV cache 当作虚拟内存

Le cache de KV est utilisé à 16 blocs de jetons pour la distribution; table de page va déployer la position logique dans les blocs physiques. Il peut être partagé entre les deux.


拖动维度参数, observez la taille du cache 如何变化──把序列长度或批量大小 推高, vous le verrez rapidement dépasser la capacité d'un seul GPU──

```figure
kv-cache-sizer
```

```figure
flash-attention-memory
```

## - Je le construis.

Je vous en prie .`code/main.py`❖ Nous réalisons:

1. Une simple.`O(N²)`décodeur incrémental.
2. Une .`O(N)`Décoder en cache KV
3. Une analogie de Flash Attention running-max algorithme de softmax en carreaux

### 步骤 1: cache KV

```python
class KVCache:
    def __init__(self, n_layers, n_heads, d_head):
        self.K = [[[] for _ in range(n_heads)] for _ in range(n_layers)]
        self.V = [[[] for _ in range(n_heads)] for _ in range(n_layers)]

    def append(self, layer, head, k, v):
        self.K[layer][head].append(k)
        self.V[layer][head].append(v)

    def read(self, layer, head):
        return self.K[layer][head], self.V[layer][head]
```

很简单: dans chaque couche  de chaque tête de la liste, continuez à ajouter des vecteurs K V de chaque symbole

### 步骤 2: doux de la carreaux

```python
def tiled_softmax_dot(q, K, V, tile=4):
    """Flash-attention-style softmax(qK^T)V with running max/sum."""
    m = float("-inf")
    s = 0.0
    out = [0.0] * len(V[0])
    for start in range(0, len(K), tile):
        k_block = K[start:start + tile]
        v_block = V[start:start + tile]
        scores = [sum(qi * ki for qi, ki in zip(q, k)) for k in k_block]
        new_m = max(m, *scores)
        exp_old = math.exp(m - new_m) if m != float("-inf") else 0.0
        exp_new = [math.exp(sc - new_m) for sc in scores]
        s = s * exp_old + sum(exp_new)
        for j in range(len(out)):
            out[j] = out[j] * exp_old + sum(e * v[j] for e, v in zip(exp_new, v_block))
        m = new_m
    return [o / s for o in out]
```

输出与一次性计算 `softmax(qK) V`Un peu identique, mais à tout moment, le jeu de travail n'est qu'un seul.`tile × d_head`bloc, plutôt que de complet `N × d_head`Il y a une autre.

### 步骤 3: Dans la génération de 100 jetons 上比较 naïf vs décodage caché

统计注意 操作数。Naïve:`O(N²)`= 5050♦ en caisse:`O(N)`= 100... - Je vais vous en faire une.

## Utilisez-le

```python
# HuggingFace transformers auto-enables KV cache on decoder-only generate().
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.2-3B",
    attn_implementation="flash_attention_2",  # use FA3 if Hopper
    torch_dtype="bfloat16",
)
# generate() uses KV cache automatically
```

VLLM 生产部署:

```bash
pip install vllm
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --tensor-parallel-size 4 \
    --max-model-len 32768 \
    --enable-prefix-caching \
    --kv-cache-dtype fp8
```

Le préfixe de mise en cache de l'application est un préfixe de mise en cache de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de l'application de la mise en cache de cache de cache de l'application de l'application de l'application de l'application de l'application de l'application de la mise en ligne de cache de cache de cache de cache de cache est souvent peut entraîner 5 fois augmenter.

## Je le livre.

Je vous en prie .`outputs/skill-inference-optimizer.md`◊ Cette compétence sera utilisée pour la mise en œuvre de nouvelles recommandations de la Sélection d'attention, de la stratégie de cache KV, de la quantification et du décoding spéculatif.

## 练习

1. **Easy.**运行  référencement`code/main.py` Confirmer les décodeurs naïfs et cachés  produire la même sortie; attention aux différences op-count 
2. **Medium.**实现 préfixe caching: donner une demande P 和多个完成, d'abord à P 运行一次前行来填充KV缓存, puis par chaque réalisation 分支──测量对对每一个完成 重新编码 P 的速度──
3. **Hard.**实现一个玩具版 PagedAttention:KV cache Utilise un bloc fixe de 16 jetons,并带有免费列表──当一个序列 完成时,把它的块归回池中──模拟1000 个长度不同的聊天完成──比较它与连续分配的内存碎片情况──

## 关键术语

| Term | 人们的说法 | 它实际上的含义 |
|------|------------|----------------|
| KV cache | “让 decoding 变快的技巧” | 存储每个前缀 token 的 K 和 V；新 queries attend to 它们，而不是重新计算。 |
| HBM | “GPU 主内存” | High Bandwidth Memory；H100 上 80 GB，B200 上 192 GB。带宽约 3 TB/s。 |
| SRAM | “片上内存” | 每个 SM 的高速内存，H100 上每个 SM 约 256 KB。带宽约 30 TB/s。 |
| Flash Attention | “Tiled attention kernel” | 在 HBM 中不物化 N×N 的情况下计算 attention。 |
| Continuous batching | “No-wait batching” | 不清空 batch，直接换出完成的 sequences、换入新的 sequences。 |
| PagedAttention | “vLLM 的核心卖点” | KV cache 以固定 blocks 分配，并通过 page table 管理；消除碎片。 |
| Prefix caching | “复用长 prompts” | 在请求之间缓存共享前缀的 KV；对 agents 来说是重大成本削减。 |
| Speculative decoding | “Draft + verify” | 廉价 draft model 提出 tokens；大模型在一次 pass 中验证 k 个。 |

## 延伸阅读

- [Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135)- Le flash 1
- [Dao (2023). FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691)- Le flash 2
- [Shah et al. (2024). FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608)- Flash 3 ?
- [FlashAttention-4 release notes (Dao-AILab, 2026)](https://github.com/Dao-AILab/flash-attention) L'équipement de production de 5 étapes de Blackwell et de logiciels exp2 技巧;
- [Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) vLLM 论文。
- [Leviathan et al. (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) Décodage des spécifications。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077)  本课引用的集成草案方法的EAGLE-1/2 paper──
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) Approche de la Méduse citée par l'Eagle 
- [vLLM docs — PagedAttention](https://docs.vllm.ai/en/latest/design/kernel/paged_attention.html) 关于16 blocs de jetons et la conception de table de page de plongée canonique en profondeur―
