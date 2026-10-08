# Le transformateur complet  Encoder + Décoder

> Attention est le principal. Tout ce qui reste, la normalisation, l'avancement, l'attention croisée, vous permet de la mettre en scène.

**Type:** Build
**Languages:** Python
**先修要求:**La phase 7 · 02 (auto-attention), la phase 7 · 03 (attention multi-tête), la phase 7 · 04 (encoding de position)
**Time:** ~75 minutes

##  problématique
Une seule couche d'attention est un attribut, pas un modèle. Chaque couche de matmul ne suffit pas pour la langue.

En 2017, Vaswani a décidé de prendre six décisions de conception, en transformant une couche d'attention en un bloc à assembler.

Ce cours est consacré à cette structure.

## 概念
![Encoder and decoder block internals, wired](../assets/full-transformer.svg)

### 六个组成部分

1. **Embedding + positional signal.**Les jetons → Vecteurs。Position 通过 RoPE(现代) ou sinusoïdale(经典)注入。
2. **Self-attention.**Chaque position est occupée par l'autre position.
3. **Feed-forward network (FFN).**按 position 作用的两层MLP:`W_2 · activation(W_1 · x)`◊ le ratio d'expansion est de 4×♦
4. **Residual connection.** `x + sublayer(x)`Sans elle, les gradients disparaîtront après environ 6 niveaux.
5. **Layer normalization.** `LayerNorm`Ou `RMSNorm`(现代) ・ un flux résiduel stable
6. **Cross-attention (decoder only).**Les requêtes du décodeur, les clés et les valeurs du codeur de sortie.

### Bloc de codeur ((BERT、T5 codeur 使用)

```
x → LN → MHA(self) → + → LN → FFN → + → out
                     ^              ^
                     |              |
                     └── residual ──┘
```

Le codeur est bidirectionnel, il n'y a pas de masquage, toutes les positions sont visibles.

### Bloc de décodeur ((GPT、T5 décodeur 使用)

```
x → LN → MHA(masked self) → + → LN → MHA(cross to encoder) → + → LN → FFN → + → out
```

Décoder Chaque bloc a trois sous-couches. Le centre de l'attention transversale est le seul endroit où l'information passe du décodeur vers le décodeur. Dans une architecture purement décodeur uniquement, l'attention transversale sera ignorée, mais seuls les masques seront conservés.

### Pré-norme contre post-norme

Le thème de la rédaction`x + sublayer(LN(x))`contre`LN(x + sublayer(x))` Après la norme en 2019 ou presque  Si on ne fait pas un réchauffement minutieux, il est difficile de s'entraîner très profondément  Avant la norme  dans la sous-couche * avant * usage `LN`) est la première option de 2026: Llama, Qwen, GPT-3+, Mistral, sont utilisés.

### Bloc de modernisation de 2026

Vaswani 2017 utilise LayerNorm + ReLU。现代 stack 替换了两者──生产级块 实际看起来是这样:

| Component | 2017 | 2026 |
|-----------|------|------|
| Normalization | LayerNorm | RMSNorm |
| FFN activation | ReLU | SwiGLU |
| FFN expansion | 4× | 2.6×（SwiGLU 使用三个 matrices，总参数量匹配） |
| Position | Sinusoidal absolute | RoPE |
| Attention | Full MHA | GQA（或 MLA） |
| Bias terms | Yes | No |

RMSNorm a perdu le centre moyen de LayerNorm (moins une fois de soustraction), économiser le calcul et, par expérience, voir au moins la même stabilité.`Swish(W1 x) ⊙ W3 x`) dans les essais de Llama、PaLM 和 Qwen 文中稳定优优于 ReLU/GELU FFN,ppl 约提升 0.5 个点──

### Compte de paramètres

Pour une`d_model = d`且 FFN expansion 为 `r`Le bloc:

- MHA: `4 · d²`(Projections Q, K, V, O)
- FFN (SwiGLU): `3 · d · (r · d)`- Je suis là.`3rd²`
- Normes: 可忽略

- Je suis là .`d = 4096, r = 2.6, layers = 32`(大致对应 Llama 3 8B)`32 · (4·4096² + 3·2.6·4096²) ≈ 32 · (16 + 32) M = ~1.5B parameters per layer × 32 ≈ 7B`(rejoint les emblèmes et la tête)


observer un vecteur  comment il traverse un seul bloc: Attention entre position mélangé information, résiduel  把信号 continue vers l'avant, FFN faire changer, alors que la norme 让残流 保持稳定──

```figure
transformer-block
```

## - Je le construis.
### 步骤 1: blocs de construction

Utilisation de la leçon 03 中的小型 `Matrix`classe ((pour l'indépendance a été rédigée à ce dossier):

- `layer_norm(x, eps=1e-5)` 减去 mean,除以 std。
- `rms_norm(x, eps=1e-6)` À l'exception du RMS.
- `gelu(x)`et `silu(x) * W3 x`Je suis désolé.
- `ffn_swiglu(x, W1, W2, W3)`Il y a une autre.
- `encoder_block(x, params)`et `decoder_block(x, enc_out, params)`Il y a une autre.

完整线路 见 `code/main.py`Il y a une autre.

### étape 2: fil un encodeur à 2 couches et un décodeur à 2 couches

Les mettre en place. Les encoder vont être mis en valeur.

```python
def encode(tokens, params):
    x = embed(tokens, params.emb) + sinusoidal(len(tokens), params.d)
    for block in params.encoder_blocks:
        x = encoder_block(x, block)
    return x

def decode(target_tokens, encoder_out, params):
    x = embed(target_tokens, params.emb) + sinusoidal(len(target_tokens), params.d)
    for block in params.decoder_blocks:
        x = decoder_block(x, encoder_out, block)
    return x
```

### 步骤 3: Dans l' exemple de jouet 上运行 à l' avance

输入一个6token source 和一个5token target──验证输出形 是 `(5, vocab)`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖

### 步骤 4: 换成 RMSNorm + SwiGLU

Utilisez RMSNorm 和 SwiGLU 替换 LayerNorm 和 ReLU-FFN── confirmer les formes 仍然匹配──这是2026年现代化, il suffit d'une seule fonction 替换──

## Utilisez-le
Les mises en œuvre de référence PyTorch/TF:`nn.TransformerEncoderLayer`- Je suis là.`nn.TransformerDecoderLayer` Mais la plupart des codes de production de 2026 seront auto-réalisés parce que:

- L'attention flash est dans l'attention  interne调用, plutôt que par`nn.MultiheadAttention`Il y a une autre.
- GQA / MLA 不在 stdlib référence 中──
- RoPE、RMSNorm、SwiGLU n'est pas une défaillance PyTorch。

HF `transformers`Il y a des blocs de référence clairs, à lire:`modeling_llama.py`C'est un bloc canonique de décodeur seulement en 2026...

**Encoder vs decoder vs encoder-decoder — 什么时候选择：**

| Need | Pick | Example |
|------|------|---------|
| Classification、embeddings、基于文本的 QA | Encoder-only | BERT, DeBERTa, ModernBERT |
| Text generation、chat、code、reasoning | Decoder-only | GPT, Llama, Claude, Qwen |
| Structured input → structured output（translation、summarization） | Encoder-decoder | T5, BART, Whisper |

Le décodeur-seul dans les tâches linguistiques, parce qu'il est le plus facile à faire à l'échelle, et à la fois à traiter la compréhension et la génération.

## Je le livre.
Je vous en prie .`outputs/skill-transformer-block-reviewer.md` Cette compétence sera mise en œuvre en 2026 en fonction de l'examen de la configuration par défaut d'un nouveau bloc de transformateur, et sera marquée par la défaillance de la partie pré-norme, RoPE, RMSNorm, GQA, FFN ratio d'expansion)

## 练习
1. **Easy.**统计你的encoder_block 在 `d_model=512, n_heads=8, ffn_expansion=4, swiglu=True`时的参数── 通过实现该块并使用 `sum(p.numel() for p in block.parameters())`La preuve
2. **Medium.**De la post-norme 切换到前-norme──初始化两者, et en entrée aléatoire 上测量堆叠 12 niveaux后的激活规范──后-norme 应会爆炸;前-norme 应保持有界──
3. **Hard.**Dans la tâche de copie du jouet`x`) sur la réalisation d'un encodeur-décodeur à 4 couches.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Block | “一个 transformer layer” | norm + attention + norm + FFN 的 stack，并包在 residual connections 中。 |
| Residual | “Skip connection” | `x + f(x)` output；让 gradients 能够流过 deep stacks。 |
| Pre-norm | “先 normalize，不是之后” | 现代形式：`x + sublayer(LN(x))`。无需 warmup 技巧也能训练得更深。 |
| RMSNorm | “没有 mean 的 LayerNorm” | 除以 RMS；少一个 op，经验稳定性相同。 |
| SwiGLU | “大家都切换过去的 FFN” | `Swish(W1 x) ⊙ W3 x → W2`。在 LM ppl 上优于 ReLU/GELU。 |
| Cross-attention | “decoder 如何看到 encoder” | Q 来自 decoder、K/V 来自 encoder outputs 的 MHA。 |
| FFN expansion | “中间 MLP 有多宽” | hidden-size 与 d_model 的比率，通常为 4（LayerNorm）或 2.6（SwiGLU）。 |
| Bias-free | “去掉 +b 项” | 现代 stacks 在线性层中省略 biases；ppl 略有提升，model 更小。 |

## 延伸阅读
- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) Spécification du bloc original
- [Xiong et al. (2020). On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745)Pourquoi la pré-norme au plus profond des niveaux est meilleure que la post-norme ?
- [Zhang, Sennrich (2019). Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467) RMSNorm。
- [Shazeer (2020). GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) SwiGLU 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) bloc canonique 2026 à décodeur uniquement。
