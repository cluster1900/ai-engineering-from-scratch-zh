# Mécanisme d'attention  突破

> Le décodeur ne se tourne plus vers un résumé comprimé, mais commence à regarder l'ensemble de la source.

**Type:** Build
**Languages:** Python
**先修要求：**Phase 5 · 09(Modèles de séquence en séquence)
**Time:** ~45 分钟

##  problématique

Leçon 09: Une fois que la quantité de code est échouée, le GRU codeur-découreur entraîné à la tâche de copie des jouets, la longueur de 5 heures est de 89%, la longueur de 80 heures approche de la situation. La raison est structurelle, pas le bug de l'entraînement: le codeur 提取到的每一点信息都必须塞进一个固定的大小的隐藏状态,而解码器再看不到别的东西──

Bahdanau、Cho 和 Bengio a publié en 2014 un 三行修复── ne pas simplement donner l'état final du codeur à un décodeur, mais conserver chaque état du codeur── dans chaque étape du décodeur, calculer l'augmentation du pouvoir des États de codeur, dont le pouvoir de codeur 现在需要看码器 位置`i`Le nombre de décodeurs est variable à chaque étape.

Voilà l'idée complète. Les transformateurs l'ont étendue. L'attention personnelle l'applique à une seule séquence. L'attention multi-tête et la mise en œuvre. Mais la version 2014 a déjà brisé le bouteille.

## 概念

![Bahdanau attention: decoder queries all encoder states](../assets/attention.svg)

Dans chaque étape décodeur `t`- Le numéro de la liste:

1. Utiliser un décodeur dans l' état caché `s_{t-1}` comme **query**Il y a une autre.
2. Le mettre à l' état caché avec chaque codeur `h_1, ..., h_T`Chaque encodeur est à la place d'un escalar.
3. Pour les scores faire douxmax, obtenir des poids d'attention`α_{t,1}, ..., α_{t,T}`, ils sont tous ensemble pour 1 .
4. Vecteur de contexte `c_t = Σ α_{t,i} * h_i`◊ les états de l'encodeur
5. Décoder 接收 `c_t`Au-dessus d'un précédent jeton de sortie, générer un autre jeton.

Lorsque le décodeur a besoin de mettre "Je" 翻译成 "I", il permet à "Je" d'établir un état d'encodeur supérieur 权重大,其他位置权重小── quand il a besoin de "not", il permet à "passer" 权重大──vecteur de contexte dans chaque étape de la transformation──

## Les formes ((( le plus facile de mordre des gens)

C'est la première fois que tout le monde est dans le mauvais sens.

| Thing | Shape | Notes |
|-------|-------|-------|
| Encoder hidden states `H` | `(T_enc, d_h)` | 如果是 BiLSTM，`d_h = 2 * d_hidden` |
| Decoder hidden state `s_{t-1}` | `(d_s,)` | 一个 vector |
| Attention score `e_{t,i}` | scalar | 每个 encoder 位置一个 |
| Attention weight `α_{t,i}` | scalar | 对所有 `i` 做 softmax 之后 |
| Context vector `c_t` | `(d_h,)` | 与一个 encoder state 的 shape 相同 |

**Bahdanau（additive）score。** `e_{t,i} = v_α^T * tanh(W_a * s_{t-1} + U_a * h_i)`Il y a une autre.

- `s_{t-1}`La forme est `(d_s,)`- Je suis désolé .`h_i`La forme est `(d_h,)`Il y a une autre.
- `W_a`La forme est `(d_attn, d_s)`Il y a une autre.`U_a`La forme est `(d_attn, d_h)`Il y a une autre.
- Elles sont en forme de tanh  interne  phase ajoutée `(d_attn,)`Il y a une autre.
- `v_α`La forme est `(d_attn,)` avec`v_α`Faire un produit intérieur, en réduisant en une échelle.**这就是 `v_α` 的作用。**Ce n'est pas une magie. C'est une projection du vecteur attention-dimension.

**Luong（multiplicative）score。**Trois changements:

- `dot`Le numéro de la liste:`e_{t,i} = s_t^T * h_i` les exigences`d_s == d_h`Si votre codeur est bidirectionnel, sautez dessus.
- `general`Le numéro de la liste:`e_{t,i} = s_t^T * W * h_i`, parmi lesquels `W`La forme est `(d_s, d_h)`                                                                                                                                                                                                                                                              
- `concat`En effet, les deux premières sont moins chères.

**一个值得点名的 Bahdanau / Luong gotcha。**Bahdanau 使用 `s_{t-1}`(生成当前 word *之前* 的解码状态)。Long 使用 `s_t`(états de génération* après*) ◊ Les mélanger produira des dégradations de débogage très difficiles ◊ choisir un article, puis en tenir compte ◊


```figure
attention-heatmap
```

## - Je le construis.

### 步骤 1: additif

```python
import numpy as np


def additive_attention(decoder_state, encoder_states, W_a, U_a, v_a):
    projected_dec = W_a @ decoder_state
    projected_enc = encoder_states @ U_a.T
    combined = np.tanh(projected_enc + projected_dec)
    scores = combined @ v_a
    weights = softmax(scores)
    context = weights @ encoder_states
    return context, weights


def softmax(x):
    x = x - np.max(x)
    e = np.exp(x)
    return e / e.sum()
```

Je vais vérifier tes formes.`encoder_states`La forme est `(T_enc, d_h)`Il y a une autre.`projected_enc`La forme est `(T_enc, d_attn)`Il y a une autre.`projected_dec`La forme est `(d_attn,)`, et sera diffusée.`combined`La forme est `(T_enc, d_attn)`Il y a une autre.`scores`La forme est `(T_enc,)`Il y a une autre.`weights`La forme est `(T_enc,)`Il y a une autre.`context`La forme est `(d_h,)`Je peux le publier.

### 步骤 2: Luong dot 和 général

```python
def dot_attention(decoder_state, encoder_states):
    scores = encoder_states @ decoder_state
    weights = softmax(scores)
    return weights @ encoder_states, weights


def general_attention(decoder_state, encoder_states, W):
    projected = W.T @ decoder_state
    scores = encoder_states @ projected
    weights = softmax(scores)
    return weights @ encoder_states, weights
```

Chaque article est en trois lignes. C'est la raison pour laquelle Luong peut être créé.

### 步骤 3: Un exemple de valeur numérique complète

给定三个 encoder states ((大致对应 "cat"、"sat"、"mat") ainsi qu'un état décoder le plus proche du premier état, la distribution de l'attention se concentrera en position 0。 Si l'état décoder 移动到更接近最后一个编码状态, l'attention se déplacera à la position 2。 Le vecteur de contexte suivra 。

```python
H = np.array([
    [1.0, 0.0, 0.2],
    [0.5, 0.5, 0.1],
    [0.1, 0.9, 0.3],
])

s_close_to_cat = np.array([0.9, 0.1, 0.2])
ctx, w = dot_attention(s_close_to_cat, H)
print("weights:", w.round(3))
```

```
weights: [0.464 0.305 0.231]
```

La première ligne est de gagner. Puis, le décodeur est de se déplacer vers le troisième état, observez comment les poids se déplacent.

### Étape 4: Pourquoi est-ce que c'est le pont des transformateurs ?

Je suis en train de faire une petite histoire.

- **Query**= état du décodeur `s_{t-1}`
- **Key**= états de codeur ((( nous avons trouvé des objets de division)
- **Value**= états d'encodeur (objet de notre plus de pouvoir de requête)

Dans l'attention classique, les clés et les valeurs sont la même chose. L'attention à soi les séparera: vous pouvez faire une requête de séquence, elle-même, et pour K et V. Utilisez différentes projections apprises.

Le nombre de points est le même. Les formes sont les mêmes.

## Utilisez-le

PyTorch et TensorFlow fournissent directement une attention.

```python
import torch
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=128, num_heads=8, batch_first=True)
query = torch.randn(2, 5, 128)
key = torch.randn(2, 10, 128)
value = torch.randn(2, 10, 128)

output, weights = mha(query, key, value)
print(output.shape, weights.shape)
```

```
torch.Size([2, 5, 128]) torch.Size([2, 5, 10])
```

C'est une couche d'attention de transformateur. Le lot de requête a 5 positions, le lot de clé/valeur a 10 positions, chacune est de 128 dimensions, 8 têtes.`output`Il s'agit de nouvelles requêtes augmentées par le contexte.`weights`Vous pouvez visualiser une matrice d'alignement 5x10.

### L'attention classique est toujours importante

- Les concepts de la RNN sont tous visibles.
- Transformateurs 放不下的 sur le dispositif de séquence 任务。
- 任何2014-2017 paper──不知道Bahdanau的约定,你会读错它──
- L'analyse de l'alignement de la petite particule de MT en MT. Les poids d'attention rouges, même dans les modèles de transformateurs, sont également un outil d'interprétation, mais pour les comprendre, il faut savoir ce qu'ils sont.

### Attention-poids-comme explication

Les poids d'attention sont des poids à travers les positions et des poids à travers les positions.

它们看不出那么解释──Jain 和 Wallace(2019) indiquent que, parmi certaines tâches, les répartitions d'attention peuvent être remplacées, et sont remplacées par des alternatives arbitraires, sans changer les prédictions du modèle── sans ablation ou vérification contrefactuelle, ne jamais mettre de poids d'attention 报告为推理证──

##  La publier

保存为 `outputs/prompt-attention-shapes.md`- Le numéro de la liste:

```markdown
---
name: attention-shapes
description: Debug shape bugs in attention implementations.
phase: 5
lesson: 10
---

给定一个损坏的 attention implementation，你需要识别 shape mismatch。输出：

1. 哪个 matrix 的 shape 错了。命名这个 tensor。
2. 它的 shape 应该是什么，从 (d_s, d_h, d_attn, T_enc, T_dec, batch_size) 推导。
3. 一行修复。Transpose、reshape 或 project。
4. 一个捕获 regressions 的测试。通常是：assert `output.shape == (batch, T_dec, d_h)` and `weights.shape == (batch, T_dec, T_enc)` and `weights.sum(dim=-1) close to 1`。

拒绝建议会静默 broadcast 的修复。被 broadcast 隐藏的 bugs 之后会表现为静默 accuracy degradation，这是最糟糕的一类 attention bug。

对于 Bahdanau 混淆，坚持 decoder input 是 `s_{t-1}`（pre-step state）。对于 Luong，是 `s_t`（post-step state）。对于 dot-product，把 query 和 key 之间的 dimension mismatch 标记为新手最常见错误。
```

## 练习

1. **Easy.** réaliser `softmax`masking, faire encoder 中的填充令子 获得零注意重量──在包含可变长度序列的批上测试──
2. **Medium.**Je vous en prie .`general`形式添加 attention à plusieurs têtes`d_h`- Je suis désolé .`n_heads`组, chaque tête 运行注意, puis concatenate──验证 情况与你之前的实现一致──
3. **Hard.**En cours de lecture 09 de la copie du jouet  tâche sur l'entraînement d'un avec l'attention de Bahdanau GRU encodeur-décodeur ∞ dessiner la précision par rapport à la longueur de la séquence ∞ avec la baseline de comparaison avec le manque d'attention ∞ Vous devriez voir la longueur augmenter lorsque la différence s'étend, ce qui confirme l'attention ∞

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Attention | 看东西 | 对 value sequence 做加权平均，weights 由 query-key similarity 计算。 |
| Query, Key, Value | QKV | 三个 projections：Q 发问，K 是要匹配的内容，V 是要返回的内容。 |
| Additive attention | Bahdanau | Feed-forward score: `v^T tanh(W q + U k)`。 |
| Multiplicative attention | Luong dot / general | Score 是 `q^T k` 或 `q^T W k`。更便宜，在大多数任务上 accuracy 相同。 |
| Alignment matrix | 好看的图 | Attention weights 作为 `(T_dec, T_enc)` 网格。读取它可以看到 model attend 到了什么。 |

## 延伸阅读
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)Ce journal.
- [Luong, Pham, Manning (2015). Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025) 三种分分变体 及其比较──
- [Jain and Wallace (2019). Attention is not Explanation](https://arxiv.org/abs/1902.10186)                                                                                                                                                                                                                                                              
- [Dive into Deep Learning — Bahdanau Attention](https://d2l.ai/chapter_attention-mechanisms-and-transformers/bahdanau-attention.html) Utilisation de PyTorch 
