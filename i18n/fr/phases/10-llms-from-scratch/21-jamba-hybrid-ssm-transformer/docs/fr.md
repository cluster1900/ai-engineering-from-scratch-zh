# Jamba  Transformateur SSM hybride

> Le modèle spatial d'État (SSM) et le Transformer 想要的东西不同──Transformer 通过 Attention 换取质量,但代价是二次复杂度──SSM 通过递递推换取线性时间推理和常量内存,但质量落后──AI21 的Jamba(2024年3月) et Jamba 1.5(2024年8月) les mettent dans le même modèle: chaque 7 Mamba 层配 1 变压器层, chaque bloc utilise MoE,并提供可在单张80GB GPU 上运行的 256k窗口──Mamba-3(ICLR 2026) 通过数量空间和MIMO投影 强化SSM 侧──本端值到端阅读这两类架构,解释为什么这种纯M和Transformer 长期未经过的混合配合,持续尝试在中延伸而保留.

**Type:** Learn
**Languages:** Python (stdlib, layer-mix calculator)
**前置要求:**Phase 10 · 14 (architectures de modèle ouvert), phase 10 · 17 (attention native rare)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- 解释 Jamba bloc 中的三个原始:Tranformateur stratification、Mamba stratification、MoE, ainsi que 1:7:even
- Le système de gestion de la quantité de données est un système de gestion de la quantité de données.
- 计算 Jamba 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型 模型  模型 模型 模型  模型 模型 模型  模型 模型    模型     模型 模型  模型 
- Il y a trois innovations de Mamba-3: une discrétion exponentielle trapézoïdale, une mise à jour de l'état à valeur complexe, un MIMO, ainsi que des problèmes de chaque innovation.

##  problématique
Attention à la longueur de séquence est une seconde complexité. Le modèle spatial d'état est linéaire. Cette différence est constamment augmentée: dans 256k jetons.

Pure-SSM 模型(Mamba、Mamba-2) à petite échelle peut correspondre à la perplexité du transformateur, mais en retard sur la tâche de suivi de l'état, et en échec sur certaines catégories de récupération dans le contexte.

显而易见的修复方法:两者都用──在需要精确召回的地方放变压器层──其他地方使用SSM层──调节比例──Jamba est le premier modèle de production de ce type de hybrid 配方 à livrer de manière à l'échelle globale.

Le cours se déroule en lisant ces trois articles et en choisissant le modèle de pensée correctement.

## 概念
### Un SSM en une page

Modèle spatial de l'État                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `h`处理序列 `x_1, ..., x_N`- Le numéro de la liste:

```
h_t = A h_{t-1} + B x_t
y_t = C h_t
```

Chaque étape, l'état passe par la dynamique.`A`演化,接收输入 `B x_t`,并输出 `C h_t`Il y a une autre.`A, B, C`Tout le monde peut apprendre.`y_t`Je n' ai besoin que de toi.`h_{t-1}`et `x_t`Je n' ai pas besoin de plus tôt.`x`内存是常量──推理是每个符号 O(1)。

La qualité de l'image est essentielle.`A`Le modèle de formation est un modèle de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation de formation.`A, B, C`替换为依赖数据的形式 (也就是 选择性 部分) ∼ Mamba-2 ∼2024) a encore simplifié la structure. Mamba-3 ∼2026) 则在特定位置重新加入复杂性──

La principale caractéristique est que, pour le décodeur LLM, la couche SSM peut être utilisée comme un substitut direct de la couche Attention, en remplaçant le cache KV en constante croissance par un état de couche fixe de taille.

### Le bloc de Jamba

Le bloc de Jamba est en double numérique:

- `l`:Réaction attention-mamba。Jamba 使用 `l = 8`, indique chaque 7 Mamba 层配 1 个 Transformer 层(7 Mamba + 1 Attention = 每组 8 层) ⋅
- `e`: fréquence MoE。Jamba 使用 `e = 2`, indique chaque couche d'application MoE

La première partie de la liste des blocs:

```
M  M  M  M  M  M  M  A    (7 Mamba + 1 Attention)
|  M  |  M  |  M  |  M    (where | marks MoE applied)
```

Chaque bloc de Jamba est de 8 niveaux. La profondeur est de 4 niveaux.

### Pourquoi le rapport 1:7

AI21 a fait des ablations: quel type d'attention à Mamba par exemple peut-il obtenir la meilleure perplexité par paramètre et le rappel dans le contexte ?

- Attention 太多(1:1): la qualité augmente, mais la mémoire et la vitesse varient.
- Attention 太少(1:15):内存 très bien, mais dans le contexte de récupération 失败。
- Le meilleur est de 1:7 ou 1:8

L'équipement de transformation est en train de réaliser des travaux de transformation, de traitement des couches de transformation et de suivi des conditions.

### Codification de position

Les couches de Mamba 本身具有位置感知能力(通過递推) ・ les premiers hybrides à base de Mamba  Attention layers 没有使用 RoPE,因为 SSM layers 提供位置信息。Jamba 1.5 为 Attention layers 添加 RoPE,以增强更长的语境概括;这是基于经验长语境评估的后进──

### Le budget de la mémoire

Pour Jamba-1 形状(32 层:28 Mamba + 4 Attention, cachée 4096,32 têtes d'attention):

- KV cache( seulement couches d'attention): dans 256k BF16 下为 `2 * 4 * 32 * 128 * 256k * 2 = 8.4 GB`                                                                                                                                                                                                                                                              
- État du MSS: chaque préfixe de jeton 为 `28 * hidden * state_size`, mais c'est un niveau fixe de taille, pas avec la longueur de la séquence.`28 * 4096 * 16 * 2 = 3.7 MB`Il y a une autre.

Avec le même transformateur de 32 couches de 32 têtes pleines de MHA`2 * 32 * 32 * 128 * 256k * 2 = 128 GB` la mise en cache de KV  réduit de 8x── même par rapport à la plupart des GQA utilisés en 2024 模型(8) baseline(`2 * 32 * 8 * 128 * 256k * 2 = 32 GB`Le hybride de Jamba est de 1:7 et il est encore de 16 Go.

C'est ce qu'AI21 dit de la seule mise en cache de la GPU de 80 Go de 256k dans le contexte du transformateur pur à plein MHA. Même la ligne de base de la GQA n'offre presque aucun poids et aucune activation.

### Mamba-3: ligne de base de l'année 2026

Mamba-3(ICLR 2026, arXiv:2603.15569) a introduit trois innovations dans le domaine du SSM pur:

1. **Exponential-trapezoidal discretization.**Utilisation de la méthode Euler dans Mamba-2 en utilisant une plus grande puissance d'expression.`x_t`La convulsion extérieure supérieure.

2. **Complex-valued state update.**之前的Mamba 将状态矩阵从复杂(S4)降低为真实对角形(Mamba),再降低为规模身份(Mamba-2) ・・・Mamba-3 重新加入复杂值, équivalent à effectuer une intégration rotative dépendante des données dans l'état。 Ceci a restauré la capacité de suivi de l'état 简化所牺牲的现实值之前──

3. **Multi-input multi-output (MIMO) projections.**Non pas en utilisant des projections de taille de fonctionnalité, mais en utilisant des projections de valeur de matrice.

Dans la gamme de paramètres 1.5B, Mamba-3 sera en moyenne plus précis que Gated DeltaNet, améliorant la précision en aval de 0,6 points; la variante MIMO augmentera de plus en plus de 1,2 points, augmentant de 1,8 points.

Mamba-3 n'est pas encore livré dans la production hybride à grande échelle, mais il est évidemment la prochaine génération de Jamba-class 模型 SSM 侧的候选方案.

### 何時使用 hybride

Hybride 适合:

- Context 足足长, jusqu'à ce que le cache KV Transformer pur 变得痛苦(64k+)。
- 任务混合了短距離结构 (adapté à SSM) et à long terme (recaller) 需要变压器)
- Vous voulez être déployé sur un seul GPU, et le cache KV du Transformer est en place.

Hybride 不适合:

- Context 很短(低于16k) ・SSM Overhead 被浪费;pure Transformer 足足好。
- 任务需要在任何地方  Attention  深度推理、多文档交叉引用)  Hybrid 中 Attention layers 稀疏性会伤害效果──
- Vous êtes en train de développer des modèles de frontière de plusieurs milliards de paramètres.

### Le paysage concurrentiel

| Model | Family | Scale | Unique claim |
|-------|--------|------|-------------|
| Mamba-2 | pure SSM | 3B | linear time, constant memory |
| Jamba | hybrid | 52B/12B | 256k on 80GB |
| Jamba 1.5 Large | hybrid | 398B/94B | enterprise-grade long-context |
| Mamba-3 | pure SSM | 1.5B (paper) | state-tracking restored |
| DeepSeek-V3 | pure Transformer + MoE | 671B/37B | frontier capability |

Le modèle 2026: la frontière principale du MoE est celle des transformateurs purs, mais les hybrides occupent plus de 256 000 secteurs de la région.


```figure
swiglu-ffn
```

## Utilisez-le
`code/main.py`C'est un calculateur de stockage utilisé pour les architectures hybrides.

- 目标 context 下的 KV cache──
- La mémoire de l'état SSM.
- Une série de formes de modèle dans le contexte N 下的总内存──

Le calculateur prend en charge:

- L'indice de base de la transformation pure est la cache KV 随 N 增长)
- Hybride à style Jamba 1:7
- Le pur-SSM(completement pas de cache KV)。

Pour les formes publiées, le chiffre provient directement de Jamba-1 et Jamba-1.5 论文; pour les variations hypothétiques, il est extrêmement populaire.

Réfléchissez à la rédaction de la série:

- La plupart des producteurs de services de télévision et de télévision (VLLM、SGLang) soutiennent Jamba 和 Mamba。
- Dans le même VRAM, vous pouvez accueillir plus de séquences de Jamba que les séquences Transformer.
- Mamba-3 n'est pas encore livré en production, il s'agit simplement d'une prévisualisation de recherche de 1.5B.

## Je le livre.
本课会产出 `outputs/skill-hybrid-picker.md` la spécification de la charge de travail déterminée (profil de longueur de contexte, mix de tâches, budget de mémoire), elle sera recommandée entre le transformateur pur, le hybrid de style Jamba et le SSM pur, et indiquera clairement le poids de stockage et de qualité.

## 练习
1. 运行  référencement`code/main.py`, calculé 32 couches Transformer pur (clandestine 4096,32 têtes) et hybride Jamba-1 de même forme dans le contexte 256k

2. 修改计算器,建模 1:3 hybrid(4 Mamba: 1 Attention) et 1:15 hybrid(14 Mamba: 1 Attention)。 dessiner KV cache vs ratio。在哪个比率 下 KV cache等于SSM state memory?

3. 阅读 Jamba 论文(arXiv:2403.19887) 第 3 节──解释为什么AI21使用Mamba-1而不是Mamba-2,尽管Mamba-2 更快──提示:混合式除除部分记录了这一点──

4. 計算 Jamba 1.5 Large 中 MoE-every-other-layer 参数 overhead(总计 398B,激活 94B) ・・・将活比与DeepSeek-V3(37B/671B) Comparer,并解释为什么 Jamba's架构会把活比推得更高──

5. 阅读 Mamba-3 论文(arXiv:2603.15569) 的第 3 节──用三句话解释为什么复杂-valued state update 等价于数据依赖的旋转嵌入──把答案关联到阶段 7 · RoPE推导──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| State space model (SSM) | “带固定状态的递推” | 具有学习到的递推 `h_t = A h_{t-1} + B x_t` 的层；每个 token 使用常量内存 |
| Selective SSM | “Mamba 的技巧” | 依赖数据的 A、B、C 参数，使模型在线性时间下获得类似 gating 的选择性 |
| Attention-to-Mamba ratio | “多少个 Attention layers” | 在 Jamba 中，`l = 8` 表示每 7 个 Mamba layers 配 1 个 Attention layer |
| Jamba block | “8 层一组” | 一个 Attention + 七个 Mamba + 在交替位置使用 MoE |
| SSM state | “隐藏缓冲区” | 固定大小的逐层状态，用于替代 Mamba layers 的 KV cache |
| 256k context | “Jamba 的旗舰数字” | Jamba-1 可在单张 80GB GPU 上容纳的序列长度；pure Transformer 在该大小下无法做到 |
| Mamba-3 | “2026 pure SSM” | 当前最佳 pure-SSM architecture，具有 complex state + MIMO；是 hybrid 重新构建时围绕的 baseline |
| MIMO | “Multi-input multi-output” | Mamba-3 的创新，使用 matrix-valued projections 而不是逐 feature 标量 |
| Exponential-trapezoidal discretization | “Mamba-3 的递推” | 更有表达力的递推，包含 Mamba-2 的 Euler-method discretization |
| Hybrid architecture | “混合 Attention 和 SSM” | 任何交错 Transformer 和 SSM layers 的模型；Jamba 是生产级原型 |

## 延伸阅读
- [Lieber et al. — Jamba: A Hybrid Transformer-Mamba Language Model (arXiv:2403.19887)](https://arxiv.org/abs/2403.19887) 原始 Jamba 论文, ablations de ratio,256k contexte 声明
- [AI21 — Jamba 1.5: Hybrid Transformer-Mamba at Scale (arXiv:2408.12570)](https://arxiv.org/abs/2408.12570)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Gu, Dao — Mamba: Linear-Time Sequence Modeling with Selective State Spaces (arXiv:2312.00752)](https://arxiv.org/abs/2312.00752) Jamba 构建所 Basé sur le SSM 论文
- [Dao, Gu — Mamba-2 (arXiv:2405.21060)](https://arxiv.org/abs/2405.21060)  simplification de l'espace de l'État structuré 后继者
- [Lahoti et al. — Mamba-3 (arXiv:2603.15569, ICLR 2026)](https://arxiv.org/abs/2603.15569) État à valeur complexe  MIMO  2026 frontière pur-SSM
- [Gu et al. — Efficiently Modeling Long Sequences with Structured State Spaces (arXiv:2111.00396)](https://arxiv.org/abs/2111.00396) S4 论文, face vers LLM
