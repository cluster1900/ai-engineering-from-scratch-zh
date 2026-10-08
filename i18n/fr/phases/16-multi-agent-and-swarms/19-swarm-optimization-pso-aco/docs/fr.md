# 面向 LLM's Swarm Optimisation (PSO, ACO)

> L'optimisation de la bioinitiation est en train de revenir dans le domaine de la maîtrise de la loi.**LMPSO**(arXiv:2504.09247) utilise PSO, dont la vitesse de chaque particule est un prompt, LLM 生成下一个候选人; il est dans la production de processus structurés ([[expression mathématique]], processus)**Model Swarms**(arXiv:2410.11163) Traiter chaque expert LLM 视为模型权重多元 上一个PSO particule,并报告在9数据集上相比12基线有**13.3% average gain**, et chaque tour ne nécessite que 200 instances.**SwarmPrompt**(ICAART 2025) sera utilisé pour l'optimisation rapide.**AMRO-S**(arXiv:2603.12933) sont des spécialistes en phéromones initiés par l'ACO, utilisés pour le parcours de la LLM multi-agent  **4.7x speedup**、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、 、    、 、    、 、                                                                                                              

**类型：**Apprendre + construire
**语言：**Python (stdlib)
**先修：**La phase 16 · 09 (réseaux parallèles de covoiturage), la phase 16 · 14 (consensus et BFT)
**时间：**- 75 minutes

##  problématique

Vous avez un prompt, en évaluation des tâches, score de 62%── vous voulez l'améliorer── la pratique simple est de modifier manuellement sans degré, mais cette façon d'élargir est très mauvaise── le renforcement de l'apprentissage  nécessite des signaux de récompense et suffisamment de déploiements pour s'entraîner── par des commandes faire la répartition et non pas réelle  le prompt est un fichier dispersé, pas un paramètre acceptable──

L'optimisation biologique classique  utilise le PSO dans le domaine de la recherche continue  utilise le ACO dans le choix des chemins  est conçu pour ce scénario: sans Gradient  basé sur des groupes de personnes  chaque évaluation, en utilisant des LLM  en combinaison avec des étapes de recherche sans Gradient , on peut obtenir un optimisateur pratique et extraordinaire 

Le même modèle s'applique également aux systèmes multi-agents. L'agent *routing*。ACO 风格的热门轨迹 会记录哪个代理在哪类任务上表现最好,让路由器利用这个轨迹,并让热门衰减,以便路线可以重新发现。

## 概念

### Récupération de l'OPS (Kennedy & Eberhart 1995)

Optimisation de l'accumulation de particules: 种群── chaque particule a une position `x_i`et la vitesse `v_i`❖ Pour chaque itération:

```
v_i <- w * v_i + c1 * r1 * (p_best_i - x_i) + c2 * r2 * (g_best - x_i)
x_i <- x_i + v_i
evaluate fitness(x_i)
update p_best_i if improved
update g_best if global best
```

Parmi eux `p_best`C'est le meilleur résultat de la particule.`g_best`C'est le meilleur résultat de l'envahisseur,`w, c1, c2`Il s'agit d'inertie + de poids cognitif + social,`r1, r2`C'est une chose.

### LLM 输出上 PSO  LMPSO

arXiv:2504.09247 将 PSO 适配到LLM 生成的结构化输出(mathematical expression 程序) ⋅ chaque particule est une sortie candidate。Velocity is a *prompt*, description how to put current output towards personal/global best 修改──LLM ⋅Velocity prompt 生成 new output──Velocity inertia is similar ⋅Make small incremental changes ⋅Prompt ⋅

Cela fonctionne bien dans les cas suivants:
- 输出是结构化的 (可解析,可评估)
- La forme physique est automatique.
- La population est plus petite (~10-30 particules), donc le total des appels de LLM est maintenu en contrôle.

Lorsque la forme physique nécessite une révision artificielle, elle ne fonctionne pas bien.

### Des essaims modèles

arXiv:2410.11163 Va être le PSO de la couche de sortie 带到 *model* layer。 chaque particle est un expert LLM(paramètres)。Swarm 通过无 Gradient update 将参数向集体最佳 移动。报告结果:在 9 个数据集、12 基线上平均提升13.3%,且每轮只需要200 个实例──

关键洞察是 LLM experts 已经在共享参数多元中彼此接近(adaptateur weights、LoRA deltas) ⋅ 在这个低维子空间上做PSO 成本低且有效──

### Récupération de l'ACO (Dorigo 1992)

Optimisation de la colonie de fourmis:ants 遍历图; chaque tracé 都有 pheromone trail──Anth's mobile概率按 pheromone strength 加权──完成任务的 ants 会按解决方案质量 成比例地存储 pheromone──pheromone 会随时间衰减──

### AMRO-S  Utilisé pour le routage de l' agent ACO

ArXiv:2603.12933 Utiliser ACO faire des itinéraires multi-agents。 Chaque type de tâche est une destination; chaque agent est une 条可能路途──产出好结果的路途 会强化热──关键贡献:

- **可解释的 routing evidence。**La force phéromonique est un signal que l'homme peut lire.
- **Quality-gated asynchronous update。**Les phéromones ne sont mises à jour que lors des contrôles de qualité, ce qui permettra d'en tirer des conclusions et d'apprendre à les comprendre.
- Dans le multi-agent routage référence à réaliser **4.7x speedup**Il y a une autre.

La qualité est importante: sans elle, les agents rapides mais erronés accumulent des phéromones, le système se bloque sur de mauvaises routes.

### 什么时候为 LLM 使用 PSO / ACO

**使用 PSO 当：**
- L'espace de recherche est continu, ou peut être cartographié jusqu'à continu paramètres (immédiatement Embeddings, poids LoRA, valeur générée paramètres)
- La condition physique est facile à utiliser et elle est automatique.
- La population peut être très petite (de 10 à 30)

**使用 ACO 当：**
- Vous avez un routage ou une sélection de chemin.
- Les décisions seront renforcées au fil du temps (les mêmes types de tâches apparaîtront à nouveau).
- Vous avez besoin de preuves explicatives pour prendre des décisions.

**不要使用二者当：**
- Fitness  nécessite une révision artificielle 
- L'espace de recherche est dispersé et assemblé, tandis que le PSO ne peut pas couvrir les algorithmes génétiques modifiés.
- Les décisions en temps réel  nécessitent une latence stricte PSO/ACO 相比单通路的收较慢)

### Pourquoi la bio-inspiration ?

基于 Gradient 方法需要可微信号──LLM sorties 和路由决策 并不自然可微──Pseudo-gradient 方法(reinforcement-learning routers、DPO-style prompt tuners) 可行,但需要昂贵的训练──

PSO et ACO n'ont besoin que d'une fonction d'évaluation. Si vous pouvez optimiser votre choix de sortie ou de routage, vous pouvez optimiser votre espace.

###  limite de travail

- **Population budget。**N particules × T itérations × coût par éval¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬ pour chaque évaluation de la MLL$0.02 / call 的情况，一个 20-particle PSO 跑 50 iterations 大约花费 ~$20 ⋅ selon le plan
- **Exploration vs exploitation。**Le taux de dégradation des phéromones et l'inertie de l'OPS sont échangés; la dégradation est trop rapide → les solutions oubliées; trop lent → l'optimisation locale précoce.
- **Catastrophic drift。**Si le paysage du fitness change, les deux types de données peuvent converger, puis diverger, pour contrôler la stabilité du meilleur fitness.


```figure
swarm-stigmergy
```

## Construction

`code/main.py`实现:

- `LMPSO` Dans les paramètres de la numérotation de la température, les poids de la hauteur de k)                                                                                                                                                                                                                                                 
- `AMRO_S` ACO 风格 routing──3 个 agents、4 种任务类型、phéromone matrix、100 个 routed tasks──打印一段时间内(task_type → agent choices)
- Pour la même fonction, comparer le routage aléatoire avec le routage ACO, mesurer la qualité et la latence.

运行:

```
python3 code/main.py
```

预期输出:
- LMPSO:g_best fitness en 30 itérations, de la valeur de l'événement à la valeur de la performance.
- AMRO-S:tableau de phéromones  stable à chaque type de tâche pour répondre à un agent correct; routing ACO en qualité en haut par rapport au hasard, haute de ~30-40%, tout en réduisant la latence ((moins de retrait) 

## Utilisation

`outputs/skill-swarm-optimizer.md` aider dans les algorithmes génétiques et les optimisateurs basés sur les gradients  entre sélection, pour les problèmes d'optimisation de LLM / agent ⋅

## 交付

- **从小开始。**Les particules sont de 20 à 20 iteraisons, mais seulement lorsque la courbe de convergence est de plus en plus large.
- **记录每轮 pheromones 或 g_best。**没有 trace 的群优化器 很难调试──
- **Quality-gate updates。**Œuvres de l'ACO: rapidement mais mal les agents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
- **在 distribution shift 时 reset decay。**Lorsque la distribution de l'évaluation change, les phéromones de vieillissement sont dépassés; le taux de déclin est réinitialisé ou temporairement multiplié.
- **限制每轮成本。** Output cost-per-iteration métrique― un tour coûte 500$― ne produit que 0,5% de hausse du PSO non capable de naviguer―

## 练习

1. 运行  référencement`code/main.py` Observer la convergence de la LMPSO  modifier la taille de la population 为 5、10、20、50──在哪个尺寸上时间到 konverge 开始和?
2. 实现一个 catastrophic drift 实验:在回复30 后改变健身功能──PSO 适应得多快?Reset `p_best`Vous avez de l'aide ?
3. 给AMRO-S 添加质量门: 只有 eval score > 0.7 of runs 才存储 pheromone──与未加加门的版本相比, this how changes convergence?
4. 阅读 LMPSO(arXiv:2504.09247)。把论文中的 速度作为一个提示 映射回你的数值速度──模拟中丢失了什么,又保留了什么?
5. 阅读 AMRO-S(arXiv:2603.12933)。实现带异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| PSO | "Particle Swarm Optimization" | Kennedy-Eberhart 1995。基于种群的无 Gradient Optimizer。 |
| ACO | "Ant Colony Optimization" | Dorigo 1992。通过 pheromone trails 进行 path/route optimization。 |
| LMPSO | "PSO with LLM generation" | arXiv:2504.09247。Velocity 是 prompt；LLM 生成 candidates。 |
| Model Swarms | "PSO on expert weights" | arXiv:2410.11163。在 model parameter subspace 上进行无 Gradient update。 |
| AMRO-S | "ACO for agent routing" | arXiv:2603.12933。覆盖 task-type × agent 的 pheromone matrix。 |
| p_best / g_best | "Personal / global best" | 每个 particle 和整个 swarm 目前找到的最佳 solutions。 |
| Pheromone | "Routing memory" | Edge 上的强度；随时间衰减；根据 quality deposit。 |
| Quality-gated update | "Only learn from good runs" | 以 quality check 为条件进行 pheromone deposit。 |
| Catastrophic drift | "Distribution shift" | Fitness landscape 改变；旧的 p_best 和 pheromones 变得过时。 |

## 延伸阅读

- [Kennedy & Eberhart — Particle Swarm Optimization](https://ieeexplore.ieee.org/document/488968) 1995 论文
- [Dorigo — Ant Colony Optimization](https://www.aco-metaheuristic.org/about.html) 1992 année ACO 基础
- [LMPSO — Language Model Particle Swarm Optimization](https://arxiv.org/abs/2504.09247) 面向结构化 des résultats de la LLM
- [Model Swarms — gradient-free LLM expert optimization](https://arxiv.org/abs/2410.11163) Dans le sous-espace de poids du modèle
- [AMRO-S — ant-colony multi-agent routing](https://arxiv.org/abs/2603.12933) 带 qualité de la passerelle de routing à phéromone
