# AlphaEvolve  演化式编码 agents

> Il a également trouvé une heuristique de réglage Borg dans la gamme de Google, qui a récupéré environ 0,7% des ressources de calcul en groupe dans l'environnement de production. Cette structure est destinée à rester simple.

**Type:** Learn
**Languages:** Python (stdlib, evolutionary-loop toy)
**Prerequisites:** Phase 15 · 01（长周期 framing），Phase 15 · 02（self-taught reasoning）
**Time:** 约 60 分钟

##  problématique

Les LLM peuvent écrire du code. Les algorithmes d'évolution peuvent être recherchés dans l'espace de code. Ces deux méthodes ont été tentées séparément pendant des décennies, et elles ont atteint des limites. Les limites supérieures de LLM sont fictives: le modèle écrit comme raisonnable, mais ne parvient pas à obtenir le code de ses fonctions. Les limites supérieures de l'évolution sont les coûts de recherche.

AlphaEvolve(Novikov et coll., DeepMind, arXiv:2506.13131, juin 2025) les regroupe. LLM propose un éditeur ciblé pour la base de données de programmes; évaluateur automatique pour chaque variable; élevé pour devenir parent de la prochaine génération.

Les résultats du rapport de thèse comprennent: 48 fois le nombre de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois de fois

Cette structure est donc efficace, parce que l'évaluateur peut contrôler les machines.

## 概念

###  cycle

1. D'un programme de semence vrai mais excellent`P_0`Je commence.
2. 维护一个变体程序数据库, chaque变体 est évalué par un évaluateur 打分──
3. De la base de données, on peut en prendre un ou plusieurs parents (à la mode des élites de la carte ou à l'île).
4. Rapide LLM avec Gemini Flash 生成大量候选, avec Gemini Pro 处理困难候选)产出父母的修改变体──
5. 编译、运行, et a tenu à évaluer 上评估该变体──
6. 根据分数和功能 Vector 将其插入数据库──
7. Je vous en prie.

Il y a deux détails importants. Premièrement, Prompt à LLM n'est pas seulement un programme parent, il comprend généralement plusieurs variantes de base de données, ainsi que la signature de l'évaluateur, ainsi que la description de tâches courts. La tâche du modèle est de proposer un changement de direction possible pour augmenter le nombre de participants. Deuxièmement, la base de données est structurée.

### Pourquoi l'évaluateur est inconvenant

Les bénéfices d'AlphaEvolve proviennent des domaines de l'évaluation rapide, de la détermination et de la difficulté à tromper:

- **Matrix multiplication algorithm**: un test unitaire, utilisé pour exécuter la matrice 乘法并逐位 检查相等性。
- **Borg scheduling heuristic**Un simulateur de production, utilisé pour la mise en place de ressources de calcul de l'ensemble des charges et des déchets.
- **FlashAttention kernel**: correctness test加真实硬件 sur le mur de l'horloge de référence
- **Gemini training throughput**:以每步GPU-secondes 衡量──

Dans chaque cas, l'évaluateur a capturé les erreurs de catégorie qui auraient dû dominer le LLM: déclarations de validité fictives, déclarations de performance qui ont disparu sur le matériel, ainsi que les défaillances des cas de bordure.

### Le piratage de récompense est l'autre face de la même déclaration

演化会优化评估者 测量任何东西――如果评价者不完美,循环就会找到这种不完美――在未经验证领域,循环会优化表层特征,而不是预期行为――DeepMind souligne clairement dans le thesis:

Les résultats de la recherche de la récompense dans le cycle de recherche 2025-2026 具体例:

- 奖励完成时间的优化目标,会奖励提交空解法──
- 奖励测试内正确性的基准 分数,会奖励记忆测试并过拟应──
- Un code qualité proxy Récompensation suppression de l'écriture et réécriture de la modification nom, même si la signification ne change pas.

Le système de révision de l'AlphaEvolve: utilisez un évaluateur de LLM qui n'a jamais été vu et générez des entrées lors de l'évaluation.

### Pourquoi la recherche de LLM + 优于单独使用任一方

L'LLM peut générer des modifications qui peuvent être compilées, en termes de langage, et qui semblent raisonnables.

En revanche, l'évaluateur va capturer la fiction de LLM. Les LLM vont affirmer avec confiance qu'une fonction est O (n) n en cas de limite, mais elle est en fait O (n) n.

### AlphaEvolve dans la pile de frontière

| System | Generator | Evaluator | Domain | Example win |
|---|---|---|---|---|
| AlphaEvolve | Gemini | correctness + benchmark | algorithms, kernels, schedulers | 48-mul 4x4 matmul |
| FunSearch (DeepMind, 2023) | PaLM / Codey | correctness | combinatorial math | cap-set lower bounds |
| AI Scientist v2 (Sakana, L5) | GPT/Claude | LLM critique + experiment | ML research | ICLR workshop paper |
| Darwin Godel Machine (L4) | agent scaffolding | SWE-bench / Polyglot | agent code | 20% → 50% SWE-bench |

Ces quatre systèmes sont tous des variants du même composé: générateur plus évaluateur, cycle de reconduction.


```figure
alphaevolve-loop
```

## Utilisez-le

`code/main.py`Dans un jeu de régrésion symbolique  sur le problème de réaliser un cycle minimal AlphaEvolve-like  dans LLM est un proxy stdlib, proposera à la programmation de calcul des fonctions cibles de la mutation de langage  dans évaluateur  dans les tests de mise à jour  sur les points de mesure moyenne de l'erreur

观察:

- Le meilleur score de la génération.
- Le réseau de MAP-Elites                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
- 移除 test tenu-out  évaluateur de formation seulement) comment faire apparaître un cycle surprenant 

## Je le livre.

`outputs/skill-evaluator-rigor-audit.md`Dans un nouveau domaine, envisagez les conditions préalables du cycle de type AlphaEvolve: votre évaluateur peut-il vraiment capturer vos défauts préoccupants ?

## 练习

1. 运行  référencement`code/main.py` enregistrer le meilleur nombre de trajets  empêcher l'utilisation de l'évaluation de la situation`--no-holdout`)并重新运行──量化过拟合──

2. 阅读 AlphaEvolve 论文中关于MAP-elite grille 的第3部分──为一个新问题──例如编译优化通过)

3. 48 fois plus de 4x4  résultat d'améliorer 56 ans plus tard le 49-mul de Strassen 上界── Lire l'article Appendice F, et utiliser trois phrases pour expliquer pourquoi cette question est particulièrement facile à faire, ainsi que pourquoi la plupart des domaines ne sont pas comme ça──

4.  proposer un domaine où AlphaEvolve aura échoué ‒ préciser les raisons de l'échec ‒

5. 针对你熟悉的一个领域,写出你会使用的评价者签名──包括 (a) 正确性条件, (b) 性能指标, (c) 输入生成规则, (d) 至少一个反奖励黑客检查──

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| AlphaEvolve | “DeepMind 的演化式编码 agent” | Gemini + 程序数据库 + 可机器检查的 evaluator |
| MAP-elites | “保留多样性的 archive” | 由 feature Vectors 作为 key 的 grid；每个 cell 保存具有该 descriptor 的最佳变体 |
| Island model | “并行演化子种群” | 会周期性迁移的独立种群；防止过早收敛 |
| Machine-checkable evaluator | “确定性 oracle” | LLM 无法伪造的 unit test、simulator 或 benchmark，是这个循环的前置条件 |
| Reward hacking | “优化测量值，而不是目标” | 循环找到一种最大化分数但不完成预期任务的方法 |
| Seed program | “起点” | 循环从中演化的初始正确但次优程序 |
| Held-out evaluator | “LLM 从未见过的评估数据” | 在评估时生成的输入，用于防止记忆 |

## 延伸阅读

- [Novikov et al. (2025). AlphaEvolve: A coding agent for scientific and algorithmic discovery](https://arxiv.org/abs/2506.13131) 完整论文──
- [DeepMind blog on AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) 供应商撰写的结果说明──
- [AlphaEvolve results repository](https://github.com/google-deepmind/alphaevolve_results) 被发现的算法, incluant le matmul 48-mul 4x4
- [Romera-Paredes et al. (2023). Mathematical discoveries from program search with LLMs (FunSearch)](https://www.nature.com/articles/s41586-023-06924-6)Le système de l'avant-garde.
- [Anthropic — Responsible Scaling Policy v3.0 (Feb 2026)](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) L'autonomie de l'évaluateur est définie comme une direction de recherche clé.
