# Attention 变体  Fenêtre coulissante, épargne, différentielle

> L'attention totale est un cercle. Chaque jeton peut voir chaque jeton, et la mémoire en est responsable.

**Type:** Build
**Languages:** Python
**先修要求:**Phase 7 · 02 (auto-attention), phase 7 · 03 (multi-tête), phase 7 · 12 (KV cache / attention flash)
**Time:** ~60 minutes

##  problématique

Attention totale sur la durée de la séquence`O(N²)`, calculer le coût aussi `O(N²)`Pour un Llama de 128K, c'est à dire 160 milliards d'attentions à chaque couche, à 80 fois plus.`O(N²)`L'activation est en stock, mais ne change pas le coût de calcul de chaque jeton.

Trois catégories de changements de la matrice d'attention

1. **Sliding window attention (SWA).**Chaque jeton ne suit que le jeton voisin dans la fenêtre fixe, plutôt que le préfixe complet.`O(N · W)`, parmi lesquels `W`Il est à la grandeur de la fenêtre.
2. **Sparse / block attention.**只有选定的 `(i, j)`Pour le jeu, le reste est forcé à être à charge zéro.
3. **Differential attention.**Utilisation indépendante de la projection Q/K 计算两张 Attention map,再相减――消除将把权重泄漏到前几个代币的 注意沉──Microsoft's DIFF Transformer(2024)──

Ces éléments peuvent être connus. Un modèle frontalier de 2026 s'y mélange: la plupart des niveaux sont SWA-1024, chaque cinq niveaux a une couche globale de pleine attention, il y a aussi une petite quantité de têtes différentielles utilisées pour résoudre les problèmes.

## 概念

### Attention à la fenêtre coulissante (SWA)

La position`i`Pour chaque requête, il suffit de répondre.`[i - W, i]`(SWA de cause à effet) ou `[i - W/2, i + W/2]`Location dans le tableau de bord`-inf`Il y a une autre.

```
full causal:           sliding window (W=4):
positions 0-7          positions 0-7, W=4
    0 1 2 3 4 5 6 7        0 1 2 3 4 5 6 7
0 | x                0 |  x
1 | x x              1 |  x x
2 | x x x            2 |  x x x
3 | x x x x          3 |  x x x x
4 | x x x x x        4 |    x x x x
5 | x x x x x x      5 |      x x x x
6 | x x x x x x x    6 |        x x x x
7 | x x x x x x x x  7 |          x x x x
```

Pour le`N = 8192`et `W = 1024`Le score de la Matrix est de 1024 × 8192 points, ce qui réduit de 8 fois.

**KV cache 会随 SWA 缩小。**Chaque étage doit être conservé.`W`Pour une configuration similaire à Gemma-3, la fenêtre 1024 (128K context), le cache KV va diminuer de 128×。

**质量成本。**纯SWA Transformer 难以处理长距离检索――修复方法:在SWA 层间交错全重视层――Gemma 3 使用 5:1 SWA:global――Mistral 7B 使用因果性SWA stack,信息通过重叠窗向前流动每层都将有效感受野扩展`W`- Je suis passé .`L`Le modèle peut aller vers l'arrière.`L × W`- Je suis un symbole.

### Attention à l' épargne / blocage

预先选择一个  Je suis là`N × N`Le modèle de l'épargne.

- **Local + strided (OpenAI sparse transformer).**Attends jusqu' à la dernière .`W`个 Token, encore une fois sur le précédent chaque séparation `stride`Localisation du symbole.`O(N · sqrt(N))`计算同时捕捉局部和长距离信息──
- **Longformer / BigBird.**Ventile locale + minuscule quantité de jetons mondiaux (par exemple)`[CLS]`), ces jetons attend jusqu'à tous les jetons, sont également attendus par tous les jetons + liens aléatoires.
- **Native Sparse Attention (DeepSeek, 2025).**Apprendre à faire`(Q, K)`bloc important; dans le noyau 层面跳过零 bloc──兼容 FlashAttention──

Sparse Attention est une technique de kernel 故事──数学很简单──mask score Matrix; les bénéfices proviennent de la mise à jour de l'application SRAM──FlashAttention-3 和 FlexAttention API de 2026 让自定义稀模式 成为PyTorch's equivalent ability──

### L'attention différentielle (transformateur DIFF, 2024)

常规注意 有一个 注意沉 问题:softmax 强制每一行求和为 1, donc ceux qui ne veulent pas attendre particulièrement à tout contenu du Token vont porter le poids du poids vers le premier Token (或前几个 Token)  上.

Attention différentielle 通过计算**两张**La carte de l'attention n'a pas été réduite pour résoudre ce problème:

```
A1 = softmax(Q1 K1^T / √d)
A2 = softmax(Q2 K2^T / √d)
DiffAttn = (A1 - λ · A2) V
```

Parmi eux `λ`est une échelle de l'apprentissage obtenue (habituellement 0,50.8)。A1 捕捉真内容权重;A2 捕捉 sink。相减会抵消 sink,把权重重新分配给相关代币。

報告結果(Microsoft 2024):perplexité 降低 510%, dans le même trainage durée 延长 1.52×,aiguille dans le paquet de foin 检索更敏。

### 变体对比

| Variant | Compute | KV cache | Quality vs full | Production use |
|---------|---------|----------|-----------------|----------------|
| Full attention | O(N²) | O(N) per layer | baseline | 每个模型的默认层 |
| SWA (window 1024) | O(N·W) | O(W) per layer | -0.1 ppl，搭配 global layers 效果好 | Gemma 2/3, Phi-3-Long |
| Local + strided sparse | O(N·√N) | mixed | 类似 SWA | OpenAI sparse transformer, Longformer |
| BigBird (local + global + random) | O(N) approx | mixed | 在 2× context 下匹配 full | early long-context BERT |
| Native Sparse (DeepSeek-V3.2) | O(N · active fraction) | O(N) | within 0.05 ppl | DeepSeek-V3.2, 2025 |
| Differential | O(2·N²) | O(2N) | -5 to -10% ppl | DIFF Transformer, early 2026 models |


```figure
gqa-kv-sharing
```

## - Je le construis.

Je vous en prie .`code/main.py` Nous avons réalisé un comparateur de masques causaux, en montrant une attention complète, SWA, locale+scrépite et différentielle, en séquence de jouets.

### 步骤 1: masque causal complet (baseline)

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

De la ligne de base de la leçon 07;; le poids du côté supérieur est de zéro;;

### 步骤 2: masque de cause de la fenêtre coulissante

```python
def swa_mask(n, window):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
    return M
```

Un paramètre`window`Je suis là.`window >= n`时,会恢复 pleine attention causal.`window = 1`Chaque jeton est à son tour.

### 步骤 3: masque local + à pas de poids

```python
def strided_mask(n, window, stride):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
        for j in range(0, i + 1, stride):
            M[i][j] = 0.0
    return M
```

密集 local window  加上从序列开头开始每隔`stride`个 Token's position── Avec l'augmentation du nombre de couches supplémentaires, les sensations sont augmentées ∞

### 步骤 4: attention différentielle

```python
def diff_attention(Q1, K1, Q2, K2, V, lam):
    A1 = softmax_causal(Q1 @ K1.T / sqrt_d)
    A2 = softmax_causal(Q2 @ K2.T / sqrt_d)
    return (A1 - lam * A2) @ V
```

两次 Attention pass, using learning get mixing coefficient 相减──在代码中, nous comparons une seule attention avec une carte thermique de concentration-sink de l'attention différentielle Attention,并观察 sink 缩──

### 步骤 5: Tailles de cache KV

Dans le`N = 131072`Préparer des échelles de cache pour chaque variable. SWA et variations rares diminuent de 10 à 100 fois.

## Utilisez-le

Modèle de production de 2026:

```python
from transformers import AutoModelForCausalLM
# Gemma 3 mixes SWA (window=1024) and global layers at 5:1.
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-27b-it")
# print(model.config.sliding_window, model.config.layer_types)
```

PyTorch 2.5+ 中的 FlexAttention  acceptez une fonction de masque:

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)
```

Ceci se traduit par le noyau Triton automatique. Pour le modèle habituel, la vitesse est à 10% de FlashAttention-3, et la fonction de masque est un Python appelable.

**何时选择哪一种：**

- **Pure full attention** Chaque couche est adaptée au plus haut de 16K de contexte, ou en tant que test de qualité.
- **SWA + global mix** 长 context(>32K), entraînement et inférence 受内存限制──2026年 32K以上的默认选择──
- **Sparse block attention** Self-definition du noyau、self-definition pattern── réservé à des tâches spéciales (en anglais seulement).
- **Differential attention**  Toute contamination de la prise d'attention causera des blessures

## Je le livre.

Je vous en prie .`outputs/skill-attention-variant-picker.md` Cette compétence sera basée sur la longueur du contexte de l'objectif, la demande de recherche et le profil de calcul de formation/inference, pour choisir un nouveau modèle de topologie d'attention.

## 练习

1. **Easy.**运行  référencement`code/main.py` vérification `window=4`Les 4 derniers Tokens sont disponibles à la fois en ligne et en ligne.`window=n`Réalisation de l'attention causal totale
2. **Medium.**Dans la leçon 07 , la pierre angulaire est mise en œuvre .`window=1024`En attendant, je suis en train de faire un peu de travail.
3. **Hard.**Dans le cadre de la mise en œuvre de la combinaison de couches 5:1 de style Gemma-3, 5 niveaux SWA, 1 niveaux globaux) ⋅ en termes de correspondance, la perte de mémoire et la qualité de la génération par rapport à la base de base pure-SWA et pure-global.
4. **Hard.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `λ`Dans le cas de la correspondance par paramètres, mesurer la précision de la récupération par rapport à la base d'attention unique.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sliding window attention (SWA) | "Local attention" | 每个 query attend 到最近 `W` 个 Token；KV cache 缩小到 `O(W)`。 |
| Effective receptive field | "模型能向后看多远" | 在一个窗口为 `W` 的 `L` 层 SWA stack 中，最多 `L × W` 个 Token。 |
| Longformer / BigBird | "Local + global + random" | Sparse pattern，包含少量始终 attend 的 global tokens；早期 long-context 方法。 |
| Native Sparse Attention | "DeepSeek's kernel trick" | 学习 block-level sparsity；在保持质量的同时，在 kernel 层面跳过零 block。 |
| Differential attention | "Two maps, one subtracts" | DIFF Transformer：从第一张 Attention map 中减去学习得到的 `λ` 倍第二张 Attention map，以抵消 attention sinks。 |
| Attention sink | "权重泄漏到 token 0" | Softmax normalization 强制行求和为 1；信息量不足的 query 会把权重倾倒到位置 0。 |
| FlexAttention | "Mask-as-Python" | PyTorch 2.5+ API，可将任意 mask function 编译成 FlashAttention 形状的 kernel。 |
| Layer type mix | "5:1 SWA-to-global" | 在 stack 中交错 sparse 和 full Attention 层，以更低内存保持质量。 |

## 延伸阅读

- [Beltagy, Peters, Cohan (2020). Longformer: The Long-Document Transformer](https://arxiv.org/abs/2004.05150) 经典的滑窗 + global-token 论文。
- [Zaheer et al. (2020). Big Bird: Transformers for Longer Sequences](https://arxiv.org/abs/2007.14062) local + mondial + aléatoire。
- [Child et al. (2019). Generating Long Sequences with Sparse Transformers](https://arxiv.org/abs/1904.10509) Le modèle local+réciproque d'OpenAI
- [Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical Size](https://arxiv.org/abs/2408.00118) 1:1 SWA: mélange mondial
- [Gemma Team (2025). Gemma 3 technical report](https://arxiv.org/abs/2503.19786)Le mix 5:1 de la fenêtre est désormais un format standard.
- [Ye et al. (2024). Differential Transformer](https://arxiv.org/abs/2410.05258) Transformateur DIFF 论文。
- [Yuan et al. (2025). Native Sparse Attention](https://arxiv.org/abs/2502.11089) Attention à la sparsité apprise de DeepSeek-V3.2
- [PyTorch — FlexAttention blog and docs](https://pytorch.org/blog/flexattention/) Utilisez le modèle de référence API de masque comme appelable.
