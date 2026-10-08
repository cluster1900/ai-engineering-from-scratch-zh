# Les lois de l'échelle

> 2020年 Kaplan 论文说:模型越大,Loss 越低──2022年 Hoffmann 论文说:你们训练不足──Computer 会进入两个桶:参数和Token,而两者分配不显而易见──

**Type:** Learn
**Languages:** Python
**先修要求:**La phase 7 · 05 (transformateur complet), la phase 7 · 07 (GPT)
**Time:** ~45 分钟

##  problématique

Quand vous avez un entraînement pour calculer les C FLOPs et que vous voulez obtenir le meilleur modèle, vous êtes confronté à deux rotations:

1. **多少参数 (N)？**Le modèle est plus grand, la capacité est plus élevée.
2. **多少训练 Token (D)？**Les données sont plus nombreuses, la capacité d'utilisation est plus grande.

Les FLOP sont de près en`6 × N × D`Vous pouvez augmenter N, diminuer D, ou augmenter D, diminuer N...

Avant 2022, la réponse est de faire tout ce qui est en son pouvoir pour augmenter le nombre de tokens. Le GPT-3 (2020) est un paramètre de 175B, avec environ 300B Token.

Hoffmann et coll. (2022) ont formé un groupe de modèles de famille de petits Chinchilla, découvrant différentes conclusions: le meilleur pourcentage est plus proche.**每个参数 20 个 Token** GPT-3  entraînement insuffisant 10×──Chinchilla(70B 参数,1.4T Token) Dans le cas de la supposition de coûts faibles 2,5×, dans tous les points de référence, 上都击败 GPT-3(175B,300B Token)

2026 est le monde de Chinchilla, mais il y a un tournant important. Llama 3 8B est en train de former 15 milliards de tokens, la proportion est de 1 875 Tokens par paramètre. Pour un modèle d'utilisation à grande échelle, le coût de la logique est plus important que le coût de la formation, donc pour une utilisation plus petite, il faut faire des exercices excessifs.

## 概念

![Chinchilla 曲线：不同 N/D 比例下的 Loss vs compute](../assets/scaling-laws.svg)

### Loi Hoffmann

Il est en train de perdre.

```
L(N, D) = A / N^α + B / D^β + E
```

- `N`= 参数(非 Embedding)
- `D`= 训练 Token。
- `α ≈ 0.34`- Je suis là .`β ≈ 0.28`Je suis en train de faire une petite fête.
- `E ≈ 1.69`Il y a une perte de valeur.
- `A ≈ 406`- Je suis là .`B ≈ 411`Il y a une autre.

 Avec l'expansion, deux éléments se pesent les uns les autres `N`求导并求解:

```
N_opt ≈ 0.6 × (C/6)^0.5
D_opt ≈ 0.6 × (C/6)^0.5
D_opt / N_opt ≈ 20
```

Optimale de calcul: chaque paramètre 20 Tokens

### Pourquoi tu fais encore trop d'entraînement ?

Le coût de formation ne sera payé qu'une seule fois, le coût de formation ne sera toujours payé.

Pour le service mensuel de 1 milliard de Token, le chatbot de la Commission a estimé le coût total du projet.

- Il peut être placé dans la GPU de consommation.
- La différence est que la Chine est un peu plus optimiste que la Chine.
- Pour la plupart des tâches, la qualité est assez proche.

DeepMind 2024年论文("Le surentraînement est le nouveau meilleur") va former ce point.

### 涌现 vs 平滑性

Il y a aussi des techniques de calcul qui peuvent être utilisées pour faire des calculs.

Schaeffer et coll. (2023) considèrent que c'est une mesure de faux-image:涌现指标使用不连续评分(l'exactitude de la correspondance、值),会隐藏底层logits的平滑改进──连续指标──cross-entropy) montre que la ligne de courbe est plate──

En 2026, le consensus est que la perte continue est prévisible.

### 2026 année de l'image

Les lois de mise à l'échelle sont toujours valides, mais:

| 因素 | 如何变化 |
|--------|-------------|
| 数据质量 | 筛选“好”Token（Phi-style）可使曲线移动，相当于 >2× effective compute |
| MoE | 总参数与 active FLOPs 解耦；Scaling Laws 按 per-active-FLOP 计算 |
| 后训练 | 某些能力（指令遵循、代码）受 SFT+RLHF 的影响比 pretraining 更大 |
| Multimodal | 图像 + 文本 Token 一起缩放；每种模态有单独曲线 |
| 合成数据 | 模型生成训练数据；effective compute 可以复合增长 |

L'optimisateur de Muon (Kimi Moonlight, 2024) montre que, en comparaison avec AdamW, il y a environ 2 fois de compute efficace en augmentation.


```figure
scaling-laws
```

## - Je le construis.

Je vous en prie .`code/main.py` Nous avons réalisé la méthode de perte de Chinchilla, et en calculant plusieurs  budgétaire `(N, D)`Il y a une autre.

### 步骤 1: Perte de la canne à sucre

```python
def chinchilla_loss(N, D, A=406.4, B=410.7, alpha=0.34, beta=0.28, E=1.69):
    return A / N ** alpha + B / D ** beta + E
```

Dans le fixe `C = 6ND`Je vais le faire.`L`          `(N, D)`Pour trouver la valeur minimale,

### 步骤 2: 计算最优边界

Pour le`1e17`À la`1e25`Compte de FLOPs  Budget, trouver dans le cadre `6ND = C`La réduction des pertes`(N, D)` Pourcentage de la vérification`D/N ≈ 20`Il y a une autre.

### 步骤 3: coût de formation excessif

計算訓練一個小 10× 的模型(最优 N 的 1/10,最优 D 的 10×) 付出的额外损失──报告换来的推理 FLOP 节省(与 N 成正比)──

### 步骤 4: Comparer avec le modèle réel

Remplissez le GPT-3、Chinchilla、Llama 3 8B、DeepSeek-V3(params actifs)`(N, D)`Pour,并比较预测 Loss与报告 Loss──

## Utilisez-le

Tu ne peux pas trop t'entraîner à la frontière, mais les lois de l'échelle peuvent te dire:

1. **你的 fine-tune 是否有足够数据。**Si les données spécifiques de la tâche sont inférieures à la base du modèle, chaque paramètre de 20 jetons, l'expectation sera dans un certain niveau de perte 处和。
2. **是否选择更大的 base model。**Si tout votre budget est consacré à la réflexion, choisissez un modèle plus petit, entraînez un modèle plus long.
3. **收益在哪里递减。**Plus de 1000 fois plus de changement de log-perte devient bruit.

**2026 年的研究轨迹：**

- **数据受限状态。**Le nombre de jetons de haut niveau est limité. Les pré-entraînements frontaliers approchent de cette limite.
- **Compute-multiplier 技巧。**Moon Optimizer, MoE, meilleur données selection, chaque type de mouvement est un nombre absolu, plutôt que de la ligne de rapprochement.
- **RL 的 Scaling Laws。**开放问题── Les premières preuves montrent qu'il existe une loi de pouvoir dans les échantillons de RL, mais les indices et la pré-entraînement sont très différents──

## Je le livre.

Je vous en prie .`outputs/skill-training-budget-estimator.md` Cette compétence sera utilisée dans un calcul de budget, déploiement de contraintes et de objectifs, en cas de perte de capacité, pour une nouvelle formation et de sélection de fonctionnement.`(N, D, hours, GPU)`Il y a une autre.

## 练习

1. **Easy.**运行  référencement`code/main.py` Impression de calcul  budget `1e20`- Je suis là.`1e22`- Je suis là.`1e24`Je suis en train de faire une petite boucle .`(N, D)` Comparer avec le modèle réel
2. **Medium.**实现 Hoffmann Loss-as-function-of-compute 曲线──为 compute-optimal frontier 绘制 Loss vs `log10(C)`Identifier cette loi prédire notre temps nécessaire`>10^28`Les FLOP 才能让交叉ენტropie 再降低 0.1──
3. **Hard.**Dans le même ensemble de données, 5 modèles sont formés à partir de 100K à 10M, pour s'adapter à votre propre loi d'échelle.`α`et `E`◊ Comment votre indice correspond-il aux résultats publiés ?

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| Parameters (N) | “模型大小” | 非 Embedding 权重数量；决定容量。 |
| Tokens (D) | “训练数据” | 见过的训练 Token 数；决定参数被利用得有多充分。 |
| Compute (C) | “花费的 FLOPs” | 对标准 Transformer 来说，约为 `6 × N × D`。 |
| Chinchilla-optimal | “D/N ≈ 20” | 最小化 pretraining 每 FLOP Loss 的比例。 |
| Over-training | “超过 Chinchilla” | 花费额外训练 FLOPs 来节省推理 FLOPs；D/N >> 20。 |
| Irreducible loss | “底部” | Scaling Law 中的 `E` 项；数据本身的熵。 |
| Emergent capability | “规模上的突然跳变” | 通常是评分器伪影；连续 Loss 是平滑的。 |
| Effective compute | “训练效率倍增器” | 更好的数据 / Optimizer / 架构会倍增每个 FLOP 的作用距离。 |

## 延伸阅读

- [Kaplan et al. (2020). Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) 第一篇 Loi de l'échelle 论文; entraînement insuffisant。
- [Hoffmann et al. (2022). Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)- Je suis un peu dégoûté.
- [Schaeffer et al. (2023). Are Emergent Abilities of Large Language Models a Mirage?](https://arxiv.org/abs/2304.15004) 涌现作为测量伪影──
- [Sardana, Frankle (2024). Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws](https://arxiv.org/abs/2401.00448)Pourquoi la surentraînement de Llama s'adapte à sa charge de travail ?
- [Jordan et al. (2024). Muon: An optimizer for hidden layers in neural networks](https://kellerjordan.github.io/posts/muon/) 2x multiplicateur de calcul
