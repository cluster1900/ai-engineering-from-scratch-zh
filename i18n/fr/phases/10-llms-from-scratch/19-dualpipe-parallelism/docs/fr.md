# Parallélisme à double tuyau

> DeepSeek-V3 utilise 2 048 张 H800 GPUs  entraînement, les experts MoE sont dispersés sur plusieurs nœuds. Tous les experts de communication à tous. Chaque 1 heure de GPU de calcul nécessite 1 heure de communication à GPU. Les GPU ont la moitié du temps dans l'espace. DualPipe. DeepSeek,2024 est un pipeline bidirectionnel, il va aller de l'avant et en arrière.

**Type:** Learn
**Languages:** Python (stdlib, schedule simulator)
**Prerequisites:** Phase 10 · 05（distributed training、FSDP、DeepSpeed），Phase 10 · 14（open-model architectures 和 MoE）
**Time:** ~60 minutes

## Objectif de l'apprentissage
- Découvrez les quatre composantes de la pièce du DualPipe vers l'avant et vers l'arrière, et pourquoi chaque partie a sa propre fenêtre de superposition.
- 解释大规模下管道泡 问题,以及 泡无 在实践中和在营销语境中的区别──
- Handwerk suivre 8 rangs PP et 16 micro-parties du calendrier DualPipe,并 confirmer le flux vers l'avant et le flux inversé 会填充彼此的空槽位──
- Il s'agit d'une série de projets de recherche et de développement qui ont été réalisés par des chercheurs en recherche et développement.

##  problématique
Dans les GPU H800 2K, le modèle MoE 671B se trouve sur trois bouteilles:

1. **内存压力。**Chaque GPU possède une partie du modèle. 8K de séquence, 61 couches, 128 têtes.
2. **Pipeline bubbles。**Le parallélisme traditionnel du pipeline (GPipe、1F1B) permettra aux GPU d'attendre l'entrée de son stade ou de se retrouver dans l'espace.
3. **跨节点 all-to-all。**En utilisant le parallélisme des experts, le MoE va déployer des experts répartis en plusieurs nœuds. Chaque passage à l'avant provoque une fois tout-à-tout, pour envoyer des jetons à leurs propres experts, puis provoque une autre fois tout-à-tout.

Ces problèmes ont chacun une solution unique: mémoire avec point de contrôle de gradient, bulles de tuyau avec Zero Bubble (Sea AI Lab, 2023)), tout-à-tout avec des noyaux de communication parallèles d'experts. DualPipe fait faire pour les faire travailler ensemble. Ce calendrier est en un seul morceau de calcul et de communication, tout en se déroulant du pipeline dans les micro-parties, et l'utilisation du calendrier qui en résulte va être tout-à-tout cachée dans la fenêtre de calcul.

rapport résultat: dans le cadre de l'entraînement de la série DeepSeek-V3, les bulles de tuyau sont presque éliminées, le taux d'utilisation de la GPU dépasse 95%.

## 概念
### Parallélisme du pipeline 复习

Pour décomposer un modèle N-couche en P 个设备上――设备 `i` possèdent des couches `i * N/P .. (i+1) * N/P - 1` un micro-batch d'un appareil 0 à P-1  exécuter en avant, puis de P-1 à 0  exécuter en arrière  chaque appareil ne peut commencer sa propre phase d'avancement qu'après l'envoi de son produit par un appareil précédent;  seulement après l'envoi de l'appareil de la base  Gradient  pour commencer à revenir en arrière 

GPipe(Huang et al., 2019) une fois régulation d'un micro-batch, ce qui va gaspiller la majeure partie du temps de la GPU.

DualPipe est la prochaine étape.

### C'est une décomposition en morceaux.

Chaque morceau avant est décomposé en quatre parties:

- **Attention。**Les projections Q/K/V Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œil Œ
- **All-to-all dispatch。**Envoyer des jetons à leurs experts.
- **MLP。**L'expert du ministère de l'Économie et de la Santé 計算。
- **All-to-all combine。**Les résultats des experts seront rapportés à travers les points de communication.

Une partie arrière se joignira à ces parties Gradient 版本。 DualPipe les réguler, faire tout-à-tout expédier avec attention  calculer et faire tout-à-tout combiner avec MLP  calculer et faire la suite 

### 思路 2: planification bidirectionnelle

La plupart des programmes de pipeline à partir de l'étape 0 pour les micro-parties, et à partir de l'étape P-1──DualPipe à partir des deux extrémités simultanément pour les micro-parties──Étape 0 verra les micro-parties à l'avant qui démarrent de là;étape P-1 verra aussi les micro-parties à l'avant qui démarrent de là──

Pour y parvenir, appareil `i`¢ doit également avoir une couche de tuyau précoce ¢`i`Et la couche de tuyau en fin de phase `P - 1 - i` c'est la partie du du dual dans DualPipe: chaque appareil conserve deux couches de modèle qu'il doit servir (une pour chaque direction)  Dans la taille de DeepSeek-V3, c'est 2x le coût de reproduction par paramètre c'est acceptable, parce que le parallélisme des experts  a déjà dispersé les experts MoE très rarement, la reproduction de deux couches non experts ne comporte pas de gros coûts

Le point clé est que, le courant d'un côté vers l'avant et le courant de l'autre vers l'arrière, se trouvent dans un calendrier unique, la position des bulles s'accumulent.

### Un calendrier suivi à la main

考虑 P = 4 rangs、8 micro-parties,分为 4 个前进 / 4 个反转──时间从左到右移动;行是设备级──

```
           Time →
rank 0:  F1 F2 F3 F4  F5R F6R F7R F8R  B1 B2 B3 B4  ...
rank 1:     F1 F2 F3  F4/F5R F6R F7R   B1 B2 ...
rank 2:        F1 F2  F3/F5R F4/F6R    B1 ...
rank 3:           F1  F2/F5R F3/F6R    ...
```

读取 F4/F5R 这种记法:rank 1 在同一时间槽中,同时运行微批4的前进(在管道中从左到右) 和微批5的前进(从右到左)  这就是 双向 在操作层面的含义──

Dans le classement 2, les courants de croisement sont plus tôt surchargés; dans le classement 0 et P-1, ils sont plus tard surchargés. Dans le classement stable, chaque classement fonctionne dans la direction X, vers l'avant, et dans la direction Y, vers l'arrière.

### Comptabilité des bulles

标准 1F1B bulle de pipeline( chaque rang 浪费的时间):

```
bubble_1F1B = (P - 1) * forward_chunk_time
```

La bulle zéro  amélioration la réduira, mais ne peut pas descendre à zéro. DualPipe Dans la phase de stabilisation, si le nombre de micro-batches peut être doublé par la profondeur du pipeline 整除, il y aura une bulle zéro.

营销语境中: 泡无──技术语境中:泡 不会随着微批数量增长──Sea AI Lab 的后续分析(DualPipeV / Cut-in-half) indique que seul dans le parallélisme expert non seulement il y a une bulle zéro; dans le tout-à-tout en EP 驱动的下, il y a toujours des plans 妥协──

### DualPipeV  le raffinement

Sea AI Lab(2025) observe, lorsque les EP comm se chevauchent non est un point de départ, 2x 参数复制是浪费的。 leur schéma DualPipeV va être un schéma bidirectionnel 折叠 dans un schéma V-shaped, en fonctionnement en une seule partie .

取舍如下:

| Feature | DualPipe | DualPipeV | 1F1B | Zero Bubble |
|---------|---------|-----------|------|------------|
| 每个设备的参数副本 | 2 | 1 | 1 | 1 |
| Bubble vs micro-batches | constant | small growth | grows | grows |
| Compute-comm overlap | full | partial | minimal | partial |
| Use when | EP-heavy MoE | dense or EP-light | baseline | any pipeline |

### Qu' est-ce que cela signifie ?

La pré-entraînement de DeepSeek-V3 sur 2.048 张 H800 GPU a consommé 14,8T de jetons, environ 2,8M d'heures de GPU. Si l'on utilise le simple 1F1B, ils perdent 12 à 15% de ces bulles de pipeline, soit 340 à 420K d'heures de GPU, assez pour entraîner un modèle complet de 70B. DualPipe a récupéré la plupart de ces jetons. Il n'y a pas de journal interne, il est très difficile de mesurer directement sa contribution, mais la déclaration dans le thème est que la formation moyenne de GPU utilise plus de 95%.

Pour une utilisation à petite échelle (moins de 1k GPU), DualPipe, certaines surcharges: bulles de tuyau par rapport au coût total sont plus petites, et la formation à modèle dense est très peu touchée à tout-à-tout.

### Il est dans la position du milieu de l' empilée

- Avec **FSDP**(Phase 10 · 05)互补──FSDP va décomposer les paramètres du modèle;
- Avec **ZeRO-3**Les taux de décomposition des gradients de ZERO sont les mêmes que les taux de décomposition des gradients de ZERO.
- 需要针对具体集团拓学 调优的 **custom all-to-all kernels**Les noyaux open source de DeepSeek sont à réaliser.


```figure
expert-capacity
```

## Utilisez-le
`code/main.py`C'est un simulateur de calendrier de pipeline.`(P, n_micro_batches, schedule)`,并印 1F1B、Zero Bubble、DualPipe 和 DualPipeV de l'utilisation de phase stable de chacun. Il s'agit d'un outil pédagogique: le nombre et la définition des propositions dans le thème sont en accord, mais pas une déclaration sur l'accélération de la production de la réalité.

Le simulateur a une valeur de: avec différents P et micro-batch counts 运行它, observez la fraction de bulle de 1F1B 如何增长, alors que DualPipe 会──

Pour les participants, il est nécessaire de prendre en compte:

- 选择一个能被你的微批数 整除的管道-parallèle de profondeur。
- ¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢
- La première fois que je l'ai réalisé, j'ai passé une semaine à faire des essais.
- Monitorer le taux d'utilisation de la GPU de chaque rang, et non seulement le taux d'utilisation globale.

## Je le livre.
本课会生成 `outputs/skill-dualpipe-planner.md` déterminer une spécification du cluster de formation (GPU), elle propose une stratégie de parallélisme de pipeline, un algorithme de planification à utiliser, ainsi qu'une fraction de bulle prévue en fonction de la taille de l'objectif.

## 练习
1. Dans le`(P=8, micro_batches=16, schedule=dualpipe)`et `(P=8, micro_batches=16, schedule=1f1b)`上运行 `code/main.py` L'utilisation de la GPU calculée 差异,并将其表示为每百万训练代币回收的 GPU-hours──

2. Le dessin`(P=4, micro_batches=8, schedule=dualpipe)`Avec un micro-batch ID et une direction pour marquer chaque tronc de temps, trouvez le premier tronc de temps sans bulles.

3. 阅读DeepSeek-V3 rapport technique ((arXiv:2412.19437) 图 5──找出DualPipe forward piece 中全到全发送的重叠窗口──解释计算时间表 如何隐藏它──

4. 計算 DualPipe pour un modèle dense 70B de P=8 étapes de pipeline, ainsi que pour un modèle 671B MoE de P=16 étapes de pipeline, 2x 参数开销―― explique pourquoi le ratio de débouchés dans le cas de MoE est plus petit(La plupart des paramètres sont des experts, et sont divisés en groupes EP de grande taille)

5. Pour la première fois, le projet de recherche de l'architecte de la chimère a été réalisé en 2021 et a été réalisé en 2021 par le même programmeur.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Pipeline bubble | “每个 rank 的空闲时间” | pipeline stage 等待其输入或 Gradient 时浪费的 GPU cycles |
| 1F1B | “默认 pipeline schedule” | one forward / one backward 交错调度；DualPipe 击败的 baseline |
| Zero Bubble | “Sea AI Lab 2023” | 将 backward 拆成 B（input Gradient）和 W（weight Gradient）；几乎完全收紧 pipeline |
| DualPipe | “DeepSeek-V3 schedule” | bidirectional pipeline + compute-comm overlap；bubbles 不随 micro-batch count 增长 |
| DualPipeV | “Cut-in-half” | V-shape 改进版，以略大的 bubbles 为代价去掉 2x 参数复制 |
| Chunk | “pipeline work 的单位” | 一个 micro-batch 通过一个 pipeline stage 的 forward 或 backward pass |
| All-to-all dispatch | “把 tokens 发送给 experts” | 将 tokens 路由到其分配的 MoE experts 的跨节点通信 |
| All-to-all combine | “把 expert outputs 带回来” | MLP 之后收集 expert outputs 的跨节点通信 |
| Expert Parallelism (EP) | “Experts across GPUs” | 将 MoE experts 分片到 ranks 上，使不同 GPUs 持有不同 experts |
| Pipeline Parallelism (PP) | “Layers across GPUs” | 将 model layers 分片到 ranks 上；DualPipe 调度的维度 |
| Bubble fraction | “浪费的 GPU 时间” | (bubble_time / total_time)；DualPipe 推向零的比例 |

## 延伸阅读
- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437), Section 3.3.2 and Figure 5](https://arxiv.org/abs/2412.19437) Principaux du dualpipe  référence
- [DeepSeek — DualPipe GitHub repository](https://github.com/deepseek-ai/DualPipe) mise en œuvre de référence open source, contenant du mode DualPipeV
- [Qi et al. — Zero Bubble Pipeline Parallelism (arXiv:2401.10241, Sea AI Lab 2023)](https://arxiv.org/abs/2401.10241) Zéro bulle avant
- [Sea AI Lab — DualPipe could be better without the Dual](https://sail.sea.com/blog/articles/63)  affecter le mode de déconnexion de DeepSeek EP de DualPipeV  analyse
- [Narayanan et al. — PipeDream / 1F1B (arXiv:1806.03377, 2018-2021)](https://arxiv.org/abs/1806.03377) DualPipe par rapport à l'horaire 1F1B
- [Huang et al. — GPipe (arXiv:1811.06965, 2018)](https://arxiv.org/abs/1811.06965) Parallélisme du pipeline original 论文和泡 问题
