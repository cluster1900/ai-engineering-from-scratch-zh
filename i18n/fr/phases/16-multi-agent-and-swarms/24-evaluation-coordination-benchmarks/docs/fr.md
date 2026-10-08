# 评估与协调 Les critères de référence

> Les cinq critères de référence pour les années 2025-2026 couvrent le domaine de l'évaluation multi-agents.**MultiAgentBench / MARBLE**(ACL 2025, arXiv:2503.01935) utilisant des indicateurs clés  évaluer l'étoile/chaîne/arbre/graphe 拓;**graph 最适合 research**, la planification cognitive augmente de 3% les réalisations de ces étapes.**COMMA**évaluer la coordination multimodal asymétrique-information; y compris GPT-4o, les modèles les plus avancés sont difficiles à dépasser la ligne de base aléatoire.**MedAgentBoard**Il est également fréquent de constater que le multi-agent n'est pas supérieur à un seul LLM.**AgentArch**(arXiv:2509.10769) référence 结合 outil-utilisation + mémoire + orchestration 的企业代理架构──**SWE-bench Pro**(le secteur de l'énergie)[arXiv:2509.16941](https://arxiv.org/abs/2509.16941)Il s'agit d'un test réel de la contamination. Selon le rapport de Claude Opus 4.7 (April 2026)**64.3%**,并显然使用代理-teams coordination(nu encore publié Source primaire anthropic  先视为初步结果);Verdent(agent échafaudage)**76.1% pass@1**(le secteur de l'énergie)[Verdent technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report))。**AAAI 2026 Bridge Program WMAC**(le secteur de l'énergie)https://multiagents.org/2026/）是2026 年社区焦点──本课基于 MARBLE 的指标,运行拓学-vs-指标扫,并固定仅通过SWE-bench Verified 不是通用化证据 这条规则──

**类型：**Apprenez à le faire
**语言：**Python (stdlib)
**先修：**Phase 16 · 15 (topologie du vote et du débat), phase 16 · 23 (modalités d'échec)
**时间：**À environ 75 minutes.

##  problématique

Lorsque l'un des articles affirme que notre système multi-agents est meilleur, la question est: par rapport à quoi est-il meilleur, sur quelles missions est-il meilleur, comment mesurer?

 sans partage de critères de référence, vous ne pouvez pas comparer significativement deux systèmes multi-agents― pire encore, sans critères de référence, les modèles frontaliers pourraient être contaminés― d'ici à 2025

Le cours de 2026 présente cinq critères de référence canoniques, qui indiquent chaque référence:

## 概念

### Le groupe de travail de la Commission

arXiv:2503.01935── dans les tâches de recherche, de codage et de planification, 上评估四种协调拓类 (star,chain,tree,graph)── basées sur des indicateurs clés de la mielle, suivi des progrès, et non seulement sur le succès final──

测量结果:

- **Graph**La topologie, la meilleure adaptation aux scénarios de recherche;
- **Chain**Le codeur de raffinage progressif est le mieux adapté.
- **Star**Pour une consolidation rapide et factuelle, il convient de noter que les taux de conversion sont les plus élevés.
- **Coordination tax**Dans le graphique ci-dessus, plus de 4 agents apparaissent.
- **Cognitive planning**Dans les différentes topologies, la réalisation des étapes a augmenté d'environ 3%.

Utilisation de la technologie de la communication (UTC)https://github.com/ulab-uiuc/MARBLE）提供l'évaluateur

### COMMA  Multimodal non对称信息

覆盖代理 具有不同观察方式、且必须在没有完整信息共享的情况下协调任务──报告结果不适合:包括GPT-4o在内的边界模型 在COMMA的代理-agents合作上很难超过**random baseline** signal is: modalités multi-agents  formation insuffisante  évaluation insuffisante  LLM 能更合理处理单modality cooperation; coordination multi-modality 会崩。

Utilisation de la situation: votre système possède une coordination multimodal ou asymétrique-information.

### Test de stress de domaine MedAgentBoard 

Les résultats de la recherche ont été obtenus en 2006 et ont été évalués en 2006 et ont été évalués en 2007.

 lorsque les sous-tâches peuvent être clairement détachées diagnostic + traitement), la décomposition des tâches est utile; lorsque les coûts de coordination dépassent les gains de spécialisation  (la génération de rapports), cela nuit aux résultats.

Utilisation de scénario: votre domaine a des lignes de base claires pour un seul LLM. Si l'expérience de MedAgentBoard peut être généralisée, alors de nombreux systèmes multi-agents proposés sont sur-ingénieurs.

### AgentArch  architectures d'entreprise

Les outils sont utilisés pour la mémoire et l'orchestration.

Utilisation de scénario: Vous êtes en train de concevoir une pile d'agents d'entreprise, et vous devez prouver la rationalité de chaque étape.

### SWE-bench Pro  现实检验

Le projet de conception est de maintenir la durée de la formation en cours par rapport à la dernière période de formation.**未污染**Les modèles frontaliers sont en moyenne de 23% pour les pro et de plus de 70% pour les vérifiés.

2026 年 4 月分数:
- Claude Opus 4.7 sur Pro: **64.3%**(rapport称显式使用代理-teams coordination; encore non publié Source primaire anthropic  先视为初步结果)
- L'échafaudage de l'agent est vérifié:**76.1% pass@1**(le secteur de l'énergie)[technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report))。
- Non utilisant l'échafaudage des agents de bord score brut sur Pro: ~23-35%[SWE-bench Pro paper](https://arxiv.org/abs/2509.16941))。

 nous avons battu le banc SWE Verified不再是能力证证──Pro is current gating test──Agent-équipe échafaudage sur Pro  sur produire des bénéfices mesurables (environ 30-40 points delta), c'est l'un des arguments empiriques les plus forts de 2026 pour soutenir la coordination multi-agent ──

### AAAI 2026 WMAC

Le programme de pont 2026 de l'AAAI  Atelier sur la coordination multi-agentshttps://multiagents.org/2026/）。这是Les documents acceptés et les procédures d'atelier sont le lieu canonique d'évaluation des nouveaux méthodes; lors de la prise de décision de production, la priorité doit être donnée aux revendications acceptées par le WMAC, plutôt qu'aux pré-impressions arXiv.

### Uzh怀疑态度 Lire les réclamations de référence  Liste de contrôle 2026

Quand quelqu'un a prétendu un résultat multi-agent:

1. **哪个 benchmark，哪个 split？**Les chiffres du rapport SWE-bench Verified et Pro sont très différents.
2. **Contamination check。**Le point de référence est-il publié après la clôture de formation du modèle testé ?
3. **Baseline comparison。**Comparer avec le travail multi-agent précédent de base de l'LLM unique, aléatoire et non avec la version non réglée du même système, comparer avec le travail multi-agent précédent.
4. **Statistical significance。**N essais, p-value, intervalle de confiance, variance des modèles frontaliers, très élevées, courres uniques,
5. **Task diversity。**Une tâche ou plusieurs ? La généralisation est importante pour la production.
6. **Cost disclosure。**Les jetons par tâche ∞ mur-horloge∞20x La solution de 90% de la valeur est la décision d'entreprise, pas la déclaration de capacité∞

### Les benchmarks actuels mesurent le mauvais contenu

- **Long-horizon coordination。**L'interaction entre les murs et les montres a duré plusieurs jours.
- **Adversarial resilience。**Que se passe-t-il quand un agent est attaqué ou attaqué ?
- **Drift under deployment。**Les points de référence sont statiques; la production est répartie en mutations.
- **Cost-normalized performance。**La plupart des indicateurs de référence rapportent une précision brute, et non une précision par dollar.

Pour vous, construire votre propre référence interne est généralement la bonne pratique.


```figure
a5-bench-gap
```

## - Je le construis.
`code/main.py`C'est une promenade non interactive:

- Dans la tâche de jouet, il y a trois systèmes multi-agents.
- Pour chaque système calculent des mesures marquées de style MARBLE.
-                                                                                                                                                                                                                                                               
- 显式比较随机基线──
- 打印 carte de résultats des réclamations de référence

运行:

```bash
python3 code/main.py
```

预期输出: carte de score du système, contenant la précision brute, la réalisation des étapes, le coût par tâche, le delta de référence aléatoire, ainsi que la note de contrôle de la contamination.

## Utilisez-le
`outputs/skill-benchmark-reader.md`读取任意多代理基准索赔,并应用审查检查清单──输出:grade 和 caveats──

## Je le livre.
Produit et produits

- **构建 internal benchmark**Les critères de référence publics peuvent fournir des informations, mais ne peuvent pas être remplacés.
- **在每次比较中包含 random baseline。**Si vous ne pouvez pas dépasser le hasard dans une tâche de coordination, alors la tâche peut être mal définie.
- **同时报告 cost 和 accuracy。**Coût des jetons et des horloges murales.
- **每季度重建 benchmark。**Distribution de la production 会 changer; vieux indices de référence 会误导──
- **避免 published-benchmark overfitting。**Si votre équipe s'est spécialisée dans l'optimisation des chiffres Pro, vous serez de retour en production.

## 练习

1. 运行  référencement`code/main.py` Découvrez lequel des trois systèmes de simulation a le meilleur coût par étape.
2. 阅读 MultiAgentBench(arXiv:2503.01935)。 Pour votre propre domaine de tâches, jugez MARBLE 会推四种TOPOLOGY 中的哪一种──根据论文结果说明理由──
3. 阅读SWE-bench Pro paper── comment peut-elle résister à la contamination?
4. 阅读 COMMA 关于多摩达协调的发现――设计一个可以加入内部基准的简单多摩达协调任务――什么可以算作有用信号?
5. La liste des réclamations de référence sera appliquée à un article récent sur les multiples agents.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| MARBLE | "MultiAgentBench" | ACL 2025；带 milestone KPIs 的 star/chain/tree/graph topologies。 |
| COMMA | "Multimodal benchmark" | Multimodal asymmetric-info coordination；frontier models 相比 random 表现吃力。 |
| MedAgentBoard | "Domain stress test" | 四个医疗类别；经常发现 multi-agent 并不优于 single-LLM。 |
| AgentArch | "Enterprise benchmark" | Tools + memory + orchestration 分层组合。 |
| SWE-bench Pro | "Contamination-resistant" | 1865 个问题、41 个 repos；在 Verified 上约 23% vs 70%+（contamination signal）。 |
| Milestone achievement | "Partial credit" | 奖励进展而不只奖励最终成功的 benchmarks。 |
| Contamination | "Benchmark leaked into training" | 发布后，benchmarks 进入训练语料；分数膨胀。 |
| WMAC | "AAAI 2026 Bridge Program" | Workshop on Multi-Agent Coordination；社区焦点。 |

## 延伸阅读

- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) 带 milestone KPIs de référence de la topologie
- [MARBLE repository](https://github.com/ulab-uiuc/MARBLE) mise en œuvre de référence
- [MedAgentBoard](https://arxiv.org/abs/2505.12371) Test de stress de domaine; multi-agent n'est généralement pas meilleur que
- [AgentArch](https://arxiv.org/abs/2509.10769) architectures d'agents d'entreprise
- [SWE-bench leaderboards](https://www.swebench.com/) modèles frontaliers de vérifiés et de pro
- [AAAI 2026 WMAC](https://multiagents.org/2026/) 2026 年社区焦点
