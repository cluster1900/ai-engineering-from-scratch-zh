# From零构建 Transformer  Capstone  projet

> Il est un modèle.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 01 到 13。不要跳过。
**Time:** 约 120 分钟

##  problématique

Vous avez déjà lu chaque article. Vous avez réalisé l'attention, les multiples têtes, les décompositions, les codes de position, les encoders et les blocs de décodeurs, les pertes de BERT et GPT, le cache MoE, KV, maintenant, faites-les collaborer dans une tâche réelle.

Cette pierre angulaire: dans une programmation de langage au niveau des caractères  tâche de mise à niveau de former un petit transformateur à décodeur uniquement ⋅ elle lit Shakespeare ⋅ elle génère un nouveau Shakespeare ⋅ elle est assez petite, peut être terminée en 10 minutes sur un ordinateur portable ⋅ elle est également assez correcte, à condition de changer en un plus grand ensemble de données et de faire plus de temps de formation, on peut obtenir un véritable LM ⋅

C'est le tutoriel de ce cours nanoGPT── il n'est pas original  Karpathy 2023  tutoriel de nanoGPT                                                                                                                                                                                                                                            

## 概念

![Transformer-from-scratch block diagram](../assets/capstone.svg)

架构标注如下:

```
input tokens (B, N)
   │
   ▼
token embedding + positional embedding  ◀── Lesson 04 (RoPE option)
   │
   ▼
┌──── block × L ────────────────────┐
│  RMSNorm                          │  ◀── Lesson 05
│  MultiHeadAttention (causal)      │  ◀── Lesson 03 + 07 (causal mask)
│  residual                         │
│  RMSNorm                          │
│  SwiGLU FFN                       │  ◀── Lesson 05
│  residual                         │
└────────────────────────────────── ┘
   │
   ▼
final RMSNorm
   │
   ▼
lm_head (tied to token embedding)
   │
   ▼
logits (B, N, V)
   │
   ▼
shift-by-one cross-entropy            ◀── Lesson 07
```

### Nous avons livré quoi ?

- `GPTConfig` 统一配置 Tous les hyperparametres de la région
- `MultiHeadAttention` cause  batch,并带有可选的闪电风格的路径  PyTorch 的`scaled_dot_product_attention`)。
- `SwiGLUFFN` 现代 FFN。
- `Block` pré-norme, avec résiduel 包裹注意 + FFN。
- `GPT` intégrations  blocs empilés  tête de LM  générer )
- Utilisez la boucle d'entraînement de la coupe de gradients de l'AdamW, du cosine LR.
- Le symbole de Shakespeare dans la littérature.

### Nous ne livrons rien

- RoPE  Leçon 04 已从概念上实现──这里为了简单使用学习位置嵌入式──练习会要求你换成 RoPE──
- Chaque étape de la génération sera dans le préfixe complet.
- Attention à la lumière  PyTorch 2.0+ 会在输入匹配时自动发送;我们使用 `F.scaled_dot_product_attention`Il y a une autre.
- MoE  Chaque bloc utilise un seul FFN── tu as déjà vu MoE dans la leçon 11.

### 目标指标

Sur un ordinateur portable Mac M2, un GPT à 4 couches, à 4 têtes, d_model=128`tinyshakespeare.txt`上训练 2000 étapes:

- Perte d'entraînement en 6 minutes environ de 4,2 à 1,5...
- 采样输出 looks like Shakespeare:古风词汇、换行, ainsi que ROMEO:
- Perte de valeur (environ 10% du texte) étroitement suivie de la perte de formation;


```figure
n5-block-stack
```

## - Je le construis.

本课使用 PyTorch。安装 `torch`(construction du CPU 即可)`code/main.py`❖ Les résultats de la rédaction:

- Si la défaillance est la conséquence`tinyshakespeare.txt`(Ou lire le titre)
- Tokenizer char au niveau octet
- Le train/val est divisé par 90/10
- Dans le support de hardware, utilisez la boucle d'entraînement de l'autocast bf16.
- prélèvement après la formation 

### 步骤 1: données

```python
text = open("tinyshakespeare.txt").read()
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
encode = lambda s: [stoi[c] for c in s]
decode = lambda xs: "".join(itos[x] for x in xs)
```

65 个唯一字符──极小的词汇──适合4byte vocab_size──没有BPE,也没有代币器 麻烦──

### 步骤 2: modèle

参见 `code/main.py`◊ Ce bloc est la leçon 05  pré-norme ◊ RMSNorm ◊ SwiGLU ◊ causelle MHA ◊ 4/4/128 ◊ compte de paramètres: environ 800K ◊

### 步骤 3: cycle de formation

随机取一批长度为 256 标签窗口──前面──转变-by-one cross-entropy──后面──AdamW step──Log──重复──

```python
for step in range(max_steps):
    x, y = get_batch("train")
    logits = model(x)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    opt.zero_grad()
```

### 步骤 4: échantillon

Donnez un prompt, répétez-le, faites un échantillon, apportez, puis continuez à 500 jetons.

### 步骤 5: lire la sortie

2 000 étapes 后:

```
ROMEO:
Away and mild will not thy friend, that thou shalt wit:
The chief that well shame and hath been his friends,
...
```

Ce n'est pas Shakespeare, mais il a la forme de Shakespeare, et pour les 800K de paramètres et les ordinateurs portables, c'est un succès évident.

## Utilisez-le

Cette pierre angulaire est une architecture de référence. Pour l'étendre à quelque chose de réellement utilisable, il y a trois directions:

1. **更换 tokenizer。**Utilisation de BPE`tiktoken.get_encoding("cl100k_base")`)― La taille du vocab Le nombre de vocables passe de 65 à environ 50 000― La capacité du modèle doit être augmentée pour être compensée―
2. **在更大的 corpus 上训练。**Utilisation `OpenWebText`Ou `fineweb-edu`(HuggingFace) ~~ On utilise des jetons 10B  entraînement un GPT de 125M-param environ besoin de 24 heures ~~
3. **添加 RoPE + KV cache + Flash Attention。**Les exercices suivants vous guideront à chaque étape.

Il est possible de générer un GPT de 125M, mais ce n'est pas un modèle frontalier. Mais le même code est plus grand que le même moyen utilisé par l'Institut Carpathy, EleutherAI et Allen pour former des points de contrôle de recherche en 2026.

## Je le livre.

参见 `outputs/skill-transformer-review.md` Cette compétence sera axée sur la justesse de la couverture des cours, examiner une mise en œuvre transformatrice à partir de zéro.

## 练习

1. **Easy.**运行  référencement`code/main.py` L'évaluation du modèle que vous avez entraîné La dernière étape de la perte de validation est inférieure à 2,0 ⋅`max_steps`La perte de valeur de 2000 à 5000 dollars s'améliore-t-elle encore ?
2. **Medium.**Utiliser le RoPE pour remplacer les embellissements positionnels apprises.`MultiHeadAttention`内部对 Q 和 K 应用转转――训练并验证 val loss 至少同样低――
3. **Medium.**Dans la boucle de prélèvement, la mise en œuvre du cache KV, en particulier dans les cas de cache et sans cache, génère 500 jetons.
4. **Hard.**Donnez le modèle à la deuxième tête, pour prévoir le prochain plus un jeton.
5. **Hard.**Utilisez 4 experts MoE  remplacement de chaque bloc de FFN ⋅ routeur + top-2 routing ⋅ dans les conditions de correspondance des paramètres actifs, observez la perte de valeur ⋅ modification ⋅

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| nanoGPT | “Karpathy 的 tutorial repo” | 最小化的 decoder-only transformer training code，约 300 LOC；canonical reference。 |
| tinyshakespeare | “标准 toy corpus” | 约 1.1 MB 文本；自 2015 年以来几乎每个 character-LM tutorial 都使用它。 |
| Tied embeddings | “共享 input/output matrix” | LM head weight = token embedding matrix 的转置；节省 parameters，并提升质量。 |
| bf16 autocast | “Training precision trick” | 用 bf16 运行 forward/back，在 fp32 中保留 optimizer state；自 2021 年以来成为标准做法。 |
| Gradient clipping | “阻止 spikes” | 将 global grad norm 限制在 1.0；防止 training blowups。 |
| Cosine LR schedule | “2020+ 默认选择” | LR 先线性上升（warmup），然后按 cosine 形状衰减到峰值的 10%。 |
| MFU | “Model FLOP Utilization” | 实际达到的 FLOPs / 理论峰值；2026 年 40% dense、30% MoE 已经很强。 |
| Val loss | “Held-out loss” | 在 model 从未见过的数据上计算 Cross-Entropy；overfit detector。 |

## 延伸阅读

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) 经典的 mise en œuvre annotée.
