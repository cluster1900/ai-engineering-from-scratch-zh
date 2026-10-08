# Codification de position  Sinusoïdale, RoPE, ALiBi

> Attention à la répartition insensée. Pas de signal de position. Le chat s'est assis sur le tapis et le chat sur le tapis.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**Time:** ~45 分钟

## Le problème

Attention de produit à l'échelle de point à l'ordre non sensible.`softmax(Q K^T / √d) V`Par des similitudes par paires 计算得到──打乱 `X`Les émissions sont également perturbées de la même manière. Attention, rien ne se passe à l'intérieur.

Ce n'est pas un bug dans le modèle de sacs de mots, mais pour le langage, le code, l'audio, la vidéo, et tout ordre qui porte un sens, c'est mortel.

La méthode de réparation est de mettre la position dans les embeddings de quelque manière que ce soit.

1. **Absolute sinusoidal**(Vaswani 2017)  position de la société`sin/cos`Il n'y a pas besoin d'apprendre les paramètres, mais l'extrapolation en dehors de la longueur de l'entraînement est très faible.
2. **RoPE — Rotary Position Embeddings**(Su 2021) ・ selon la position 成比例 angle de rotation Q 和 K vecteurs。 directement dans le produit dot middle编码 *relative* position。2026年的主流选择。
3. **ALiBi — Attention with Linear Biases**(Près 2022)。 complètement sauté enracinements; selon la distance 给注意分加上头条线性罚──长度外分 极佳──

截至 2026年, presque tous les modèles frontaliers ouverts utilisent RoPE:Llama 2/3/4、Qwen 2/3、Mistral、Mixtral、DeepSeek-V3、Kimi。

## Le concept

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### Une forme sinusoïdale absolue

预先计算一个形 为 `(max_len, d_model)`La Matrice fixe`PE`- Le numéro de la liste:

```
PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
```

Ensuite, attention avant d'exécuter`X' = X + PE[:N]`◊ chaque dimension sont des sinus de différentes fréquences ◊ modèle de l'apprentissage du modèle de phase 中读取位置 ◊超过 `max_len`后会失败: lorsque le modèle ne voit que les positions 02047 时, rien ne lui dit que la position 2048 会发生──

### REPE

旋转 Q 和 K vecteurs( ne sont pas intégrés)`(2i, 2i+1)`- Le numéro de la liste:

```
[q'_2i    ]   [ cos(pos·θ_i)  -sin(pos·θ_i) ] [q_2i   ]
[q'_2i+1  ] = [ sin(pos·θ_i)   cos(pos·θ_i) ] [q_2i+1 ]

θ_i = base^(-2i / d_head),  base = 10000 by default
```

Pour la position`pos_k`应用相同旋转──dot produit `q'_m · k'_n`Je deviendrai dépendant.`(m - n)`La fonction est:**attention score 只依赖 relative distance**, bien que le tour soit fait par des positions absolues.

扩展 RoPE: se peut réduire `base`(NTK-conscient、YaRN、LongRoPE), afin d'extrapolier dans un contexte de re-entraînement à un contexte plus long。Llama 3 est utilisé de cette manière de passer de 8K à 128K en contexte。

### Le groupe

跳过嵌入 技巧──直接给注意分加偏见:

```
attn_score[i, j] = (q_i · k_j) / √d  -  m_h · |i - j|
```

Parmi eux `m_h`C'est une pente spécifique à la tête.`1 / 2^(8·h/H)`Les étoiles de proximité sont augmentées; les étoiles de proximité sont pénalisées.

### 2026 année à choisir quoi

| Variant | Extrapolation | Training cost | Used by |
|---------|---------------|---------------|---------|
| Absolute sinusoidal | 差 | 免费 | original transformer, early BERT |
| Learned absolute | 无 | 很小 | GPT-2, GPT-3 |
| RoPE | 配合 scaling 时很好 | 免费 | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | 极佳 | fine-tune stage | Qwen2-1M, Llama 3.1 128K |
| ALiBi | 极佳 | 免费 | BLOOM, MPT, Baichuan |

RoPE 胜出, est parce qu'il peut directement insérer l'attention et ne change pas l'architecture, peut coder la position relative, et de sa `base`L'hyperparamètre pour le long-context fine-tuning a fourni une clarté de rotation.


```figure
rope-explorer
```

## Faites-le

### Étape 1: codage sinusoïdale

Je vous en prie .`code/main.py`∼4 行计算:

```python
def sinusoidal(N, d):
    pe = [[0.0] * d for _ in range(N)]
    for pos in range(N):
        for i in range(d // 2):
            theta = pos / (10000 ** (2 * i / d))
            pe[pos][2 * i]     = math.sin(theta)
            pe[pos][2 * i + 1] = math.cos(theta)
    return pe
```

Dans la première couche d'attention, il sera ajouté à l'intégration de la matrice.

### Étape 2: 应用于 Q、K's RoPE

ROPE 会在 Q 和 K 上原地操作──对对对对:

```python
def apply_rope(x, pos, base=10000):
    d = len(x)
    out = list(x)
    for i in range(d // 2):
        theta = pos / (base ** (2 * i / d))
        c, s = math.cos(theta), math.sin(theta)
        a, b = x[2 * i], x[2 * i + 1]
        out[2 * i]     = a * c - b * s
        out[2 * i + 1] = a * s + b * c
    return out
```

关键: à la position `m`de Q et position `n`Le produit de leur point s'applique à chaque paire de coordonnées.`cos((m-n)·θ_i)`Parce que le temps est venu pour que je puisse me faire une idée de ce que je fais.

### Étape 3: Pistes de l'ALIBi et biais

```python
def alibi_bias(n_heads, seq_len):
    # slope_h = 2 ** (-8 * h / n_heads) for h = 1..n_heads
    slopes = [2 ** (-8 * (h + 1) / n_heads) for h in range(n_heads)]
    bias = []
    for m in slopes:
        row = [[-m * abs(i - j) for j in range(seq_len)] for i in range(seq_len)]
        bias.append(row)
    return bias  # add to attention scores before softmax
```

Il va`bias[h]`À la tête`h``(seq_len, seq_len)`Matrice de score d'attention 上, puis softmax

### Étape 4: 验证 Propriété relative à la distance de la RoPE

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `a, b`✿ Précédemment `(pos_a, pos_b)`Retour à la ligne`(pos_a + k, pos_b + k)`旋转──two dot products 必须在浮点错误内相等──这个性质就是RoPE的全部意义它对绝对的抵消不变,只关乎相对差距──

## Utilisez-le

PyTorch 2.5+`torch.nn.functional`中提供 RoPE utilitaires。 la plupart des produits sont utilisés `flash_attn`Ou `xformers`,RoPE 会在注意内核内应用.

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**2026 年的 Long-context 技巧：**

- **NTK-aware interpolation。**De 4K  étendre à 16K + 时,将 `base`Réinitialisation`base * (scale_factor)^(d/(d-2))`Il y a une autre.
- **YaRN。**En plus de l'interpolation intelligente, il est possible de conserver l'entropie de l'attention dans de longs contextes.
- **LongRoPE。**Microsoft 2024 年方法, utiliser la recherche évolutionnaire pour chaque dimension  sélectionner les facteurs d'échelle―Phi-3-Long
- **Position interpolation + fine-tuning。**Il suffit de régler les positions en fonction du facteur d'extension.

## La faire partir

Je vous en prie .`outputs/skill-positional-encoding-picker.md`◊ Cette compétence sera basée sur la longueur du contexte cible, les besoins d'extrapolation et le budget de formation, pour une nouvelle stratégie de codage.

## Exercices

1. **Easy。**Il va`max_len=512, d=128`Le sinusoïdal`PE`Matrice 绘制为热图──确认随着维度指数 增大,条纹 变宽的图案──
2. **Medium。**实现 NTK-conscient RoPE scaling── dans les séquences de longueur 256 上训练微小LM, puis dans la longueur 1024 上分别测试有 scaling 和无 scaling的情况──测量困难──
3. **Hard。**Dans le même module d'attention, réaliser ALiBi et RoPE. Dans les séquences de longueur 512 de la séquence, utiliser la tâche de copie.

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Positional encoding | “告诉 attention 顺序” | 添加到 embeddings 或 attention 中、用于编码 position 的任意 signal。 |
| Sinusoidal | “最初那个” | 以 geometric frequencies 加到 embeddings 上的 `sin/cos`；不能 extrapolate。 |
| RoPE | “Rotary embeddings” | 按 position-dependent angle 旋转 Q、K；dot product 编码 relative distance。 |
| ALiBi | “Linear bias trick” | 将 `-m·\|i-j\|` 加到 attention scores；不需要 embedding，extrapolation 很强。 |
| base | “RoPE 的旋钮” | RoPE 中的 frequency scaler；增大它可在 inference 时扩展 context。 |
| NTK-aware | “一种 RoPE scaling trick” | 重新缩放 `base`，让 context 扩展时 high-frequency dims 不会被挤压。 |
| YaRN | “高级那个” | 保留 attention entropy 的 per-dimension interpolation+extrapolation。 |
| Extrapolation | “能在训练长度之外工作” | position scheme 能否在训练时见过的 `max_len` 之外给出正确输出？ |

## Pour en savoir plus

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) Originaire sinusoïdale
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) Papel RoPE
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409) ALiBi。
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071) l'état de l'art de l'échelle RoPE。
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) Meta's Llama 2 papier à long contexte
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753) Microsoft 方法, été Phi-3-Long utiliser, et utiliser 部分引用。
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) Les différentes implémentations de la gamme de production de schéma d'échelle RoPE (défaut, linéaire, dynamique, YaRN, LongRoPE, Llama-3)
