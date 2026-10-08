# Pourquoi les transformateurs  RNN                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

> RNNs: un traitement d'un Token. Les transformateurs: un traitement de tous les Tokens. Cette seule structure a changé après 2017 en profondeur.

**类型：**Apprendre à apprendre
**语言：**Python
**先修要求：**La phase 3 (centre d'apprentissage profond), la phase 5 · 09 (sequence à séquence), la phase 5 · 10 (mécanisme d'attention)
**时间：**- 45 minutes

##  problématique

Avant 2017, chaque modèle de séquence le plus avancé de la planète était récurrent sur le réseau neuronal. Les LST et les GRU ont dominé pendant une demi-décennie.

Ils ont trois faiblesses mortelles.`t+1`需要来自Token `t`Un séquence de 1,024-tokens signifie qu'en un cycle, une GPU peut exécuter 1 000 000 fois des opérations de float points pour effectuer 1 024 étapes en série.

Les gradients de disparition signifient 50 Tokens  Les informations précédentes ont été compressées à travers 50 niveaux non-lineaires  Les unités récurrentes de la porte  LSTM, GRU) ont atténué cette compréhension, mais n'ont jamais éliminé la dépendance à long terme  Le livre que j'ai lu l'été dernier dans un avion pour Kyoto était...经常失败──

La source est de 5 Tokens ou 500 Tokens sans importance; le boîtier est toujours de la même forme.

Le thème de 2017 Attention Is All You Need  propose une idée dynamique: abandonner complètement la récurrence―: laisser chaque position et la place à chaque autre position―: utiliser une seule grande matrice de multiplication  entraînement, plutôt que de 1,024 fois de calcul en ordre―:

En 2026, ce résultat a déjà dominé toutes les modalités.

## 概念

![RNN sequential compute vs Transformer parallel attention](../assets/rnn-vs-transformer.svg)

**Recurrence 是瓶颈。**RNN 计算 `h_t = f(h_{t-1}, x_t)`Chaque étape dépend de l'étape précédente.`h_4`之前计算 `h_5`❖ Avec plus de 10 000 GPU modernes et de plus en plus de la base, cela gaspillera 99% de la surface sur la longue séquence.

**Attention 是广播。**L' attention personnelle sera pour chaque couple .`(i, j)`Comme le temps le calcule`output_i = sum_j(a_ij * v_j)`◊ Toute la matrice d'attention N×N 会在一次批量中填满──没有任何步骤依赖另一个步骤──GPUs 喜欢这一点──

**加速不是常数。**C' est ça .`O(N)`profondeur de série 和 `O(1)`En pratique, dans le même cas, les transformateurs de chaque époque entraînent à 510×; avec l'augmentation de la longueur du séquence, la différence continue de s'étendre jusqu'à ce qu'elle touche l'attention.`O(N²)`Le mur de mémoire(Flash Attention  后来修复了这个点见课 12)

**transformers 的代价。**La mémoire de l' attention`O(N²)`扩展──2K context 没问题──128K context 则需要滑窗、RoPE extrapolation、Flash Attention tiling,或线性注意变量──Recurrence 在时间和内存上都是`O(N)`Les transformateurs utilisent le temps pour changer de mémoire, puis, en passant par la même route, gagnent le temps.

**Inductive bias 的转变。**Les transformateurs ne font pas de suppositions pour chaque position sont des candidats à l'attention. C'est pourquoi les transformateurs ont besoin de plus de données pour bien s'entraîner, mais une fois qu'ils ont assez de données, ils peuvent se développer encore plus.


```figure
rnn-vs-parallel
```

## - Je le construis.

Il n'y a pas de réseau neural. Nous avons utilisé des valeurs numériques pour simuler le cœur du bloc, pour vous faire sentir la différence sur votre ordinateur.

### 步骤 1: Mesurer la profondeur de série

Je vous en prie .`code/main.py`△ Nous construisons deux fonctions― une △ Sequence de code pour la chaîne de complément △ Sequence, similaire à RNN)― une autre △ Elle est codée pour la ligne de code △ Sequence de code △ Sequence de code △ Attention)― La même mathématique, différentes dépendances △

```python
def rnn_style(xs):
    h = 0.0
    for x in xs:
        h = 0.9 * h + x   # can't parallelize: h depends on previous h
    return h

def attention_style(xs):
    return sum(xs) / len(xs)  # every x is independent
```

Nous sommes prêts à utiliser des séries de longueur maximale de 100 000 fois. La version RNN est O (N), et utilise un seul pipeline de processeur.`sum()`Il est utilisé pour réaliser et ne génère pas d'explicateurs à chaque étape.

### 步骤 2: 计算 théorique

Les deux algorithmes sont faits en N. De plus en plus, la différence réside dans la profondeur de dépendance: avant que la prochaine étape puisse commencer, il doit y avoir beaucoup d'opérations en ordre.

### Étape 3: Expansion de l'expérience sur la longue séquence

Nous imprimons un tableau de calendrier, pour que l'écart de temps soit visible. Dans le journal Mac de 2026, la séquence de moins de 1000 éléments sera trop rapide et difficile à mesurer. La séquence de 100 000 éléments affichera une analyse linéaire claire.

## Utilisez-le

2026 年什么时候仍然选择 RNN:

| 情况 | 选择 |
|-----------|------|
| Streaming inference，一次一个 Token，常量内存 | RNN or state-space model (Mamba, RWKV) |
| 超长序列（>1M tokens），Attention memory 爆炸 | Linear attention, Mamba 2, Hyena |
| 没有 matmul accelerator 的 edge device | Depthwise-separable RNN 在 FLOPs/watt 上仍然胜出 |
| 其他任何情况（训练、batched inference、最高 128K 的 context） | Transformer |

Les modèles spatiaux de l'État (SSM) comme Mamba, sont en fait des RNN structurés, ce qui les rend plus précieux:`O(N)`La mémoire de scan, ainsi que la formation de suivi réalisée par le scan sélectif, ont été utilisées pour améliorer l'échelle de long-contextes et récupérer 90% de la qualité des transformateurs.

## Je le livre.

Je vous en prie .`outputs/skill-architecture-picker.md` Cette compétence sera limitée en fonction de la longueur, du rendement et du budget de formation, pour une nouvelle séquence de sélection de problèmes de structure.

## 练习

1. **简单。**De `code/main.py`À la sortie`rnn_style`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,
2. **中等。**Utilisation pure Python pour réaliser le préfixe parallèle-summe (Hillis-Steele scan) ▽验证 il se produit à la longueur de 1024 时与序列扫描相对数值输出──计算深度──
3. **困难。**Récupération de l'attention à la GPU en PyTorch. Avec la longueur de séquence de 64 à 65 536, à deux temps.

## 关键术语

| 术语 | 人们常说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Recurrence | “RNNs 是顺序的” | step `t` 依赖 step `t-1` 的计算方式，迫使执行沿时间轴串行进行。 |
| Serial depth | “图有多深” | 依赖操作的最长链；即使在无限硬件上也会限制 wall-clock。 |
| Attention | “让 Tokens 彼此查看” | Weighted sum `sum_j a_ij v_j`，其中 `a_ij` 来自位置 i 和 j 之间的相似度分数。 |
| Context window | “模型能看到多少” | 一个 Attention layer 可作为输入的位置数量；quadratic memory cost 在这里扩展。 |
| Inductive bias | “架构内置的假设” | 关于数据形态的先验；CNNs 假设 translation invariance，RNNs 假设 recency。 |
| State-space model | “背后有代数的 RNN” | 为通过结构化 state-space matrices 实现并行训练而参数化的 recurrence。 |
| Quadratic bottleneck | “为什么 context 这么昂贵” | Attention memory = 序列长度上的 `O(N²)`；Flash Attention 隐藏的是常数，而不是扩展规律。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) Cet article met fin à la récurrence de la PNL principale.
- [Bahdanau, Cho, Bengio (2014). Neural MT by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) Attention à la naissance, alors qu'il est connecté à RNN
- [Hochreiter, Schmidhuber (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) 原始 LSTM 论文, comme un enregistrement
- [Gu, Dao (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752) Réponse récurrente moderne à la question des transformateurs 
