# Les critères de référence:SWE-bench,GAIA,AgentBench

> Trois critères de référence 构成 2026年代理评价的点──SWE-bench 测试代码 patching──GAIA 测试一般主义工具使用──AgentBench 测试多环境推理──要了解它们的组成、污染、叙事,以及它们不衡量什么──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 06 (Tool Use)
**Time:** ~60 minutes

## Objectif de l'apprentissage

- Pour expliquer pourquoi il est utilisé dans les tests unitaires 作为门──
- Expliquer pourquoi le SWE-bench Verified (OpenAI, 500 tâches) existe, ainsi que ce qu'il a déplacé.
- 描述 GAIA 的设计:对人类简单,对 AI 困难;三个难度等级──
- Il est également un des principaux bloqueurs de la loi sur les droits d'auteur open source.
- 总结 La contamination de la SWE-bench+ 发现及其影响──

##  problématique

Les classements vous diront quel modèle a gagné dans un certain benchmark.

- Les résultats de la recherche ont été analysés dans le cadre de la recherche sur les résultats de la recherche.
- Le code est un code de référence.
- L'évaluation est-elle robuste ?

Avant de citer un certain nombre, apprenez d'abord ces trois points de référence et leurs modes d'échec.

## 概念

### SWE-bench ((Jimenez et coll., ICLR 2024 orale)

- Il y a eu 2 294 vrais problèmes de GitHub.
- Agent 得到:pré-fix commit 的代码库 + description du problème de langue naturelle。
- Un patch.
- Évaluateur: application patch,运行 repo's test suite。patch 必须让 FAIL_TO_PASS tests((之前失败,现在通过)翻转,同时不破坏 PASS_TO_PASS tests。

SWE-agent ((Yang et al., 2024) atteint 12,5% au moment de la publication, dont le principal objectif est les interfaces agent-ordinateur ((commandes de l'éditeur de fichiers、modèle 能理解的搜索语法) ]]

### Banque SWE vérifiée

OpenAI, 2024: 8 月 ・ curated artificiellement 500 sous-ensemble de tâches ⋅ dégagé de problèmes ambigues ⋅ tests peu fiables, ainsi que de résoudre des tâches non précises ⋅ il est  votre agent ⋅ y a-t-il des patches réelles ⋅ principal référence ⋅

### Contamination

-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- **SWE-bench+** a trouvé 32,67% de correctifs réussis dans le texte de l'émission ont divulgué des solutions                                                                                                                                                                                                                                                  
- Il a été vérifié, mais n'a pas été totalement contaminé.

实践影响: un modèle dans le SWE-bench obtient 50%, dans le SWE-bench+ 上可能只有 35%──

### GAIA(Mialon et coll., novembre 2023)

- 466 questions; 300 d'entre elles sont réservées au classement privé de huggingface.co/gaia-benchmark.
- 设计理念:对人类在概念上简单(92%), mais pour l'IA 困难(带插件的GPT-4:15%) 
- 测试 raisonnement Multimodal web utilisation d'outils
- 3° niveau nécessite des chaînes d'outils longues.

GAIA est utilisé pour mesurer la capacité généraliste.

### L'agent Bench ((Liu et coll., ICLR 2024)

- 8 environnements, couverture de code ((Bash、DB、KG) 、jeux ((Alfworld、LTP) 、web(WebShop、Mind2Web) et génération ouverte―
- Multi-tours, chaque division de 4K à 13K tournées.
- Les méthodes de formation et de formation sont les principales: le raisonnement à long terme, la prise de décision et l'instruction suivie sont les blocages commerciaux de la LSS.

### Ces ne mesurent pas quoi

- Le coût de l'exploitation du monde réel
- Conditions adverses, comportement de sécurité.
- Vous pouvez utiliser vos propres évaluations,L'enseignement 30)
- Les défaillances de la queue (marque de référence)

### Benchmarking 常见错误

- **执着于单一数字。**SWE-bench 50%  Dites votre information moins que P50/P75/P95 coût + distribution étape 
- **Contaminated claims。**报告 SWE-bench 却不提 Verifié ou SWE-bench+ est trompeur de
- **Benchmark-as-development-target。**Pour une référence, l'utilité de la production sera optimisée.


```figure
ae-swebench-gate
```

## - Je le construis.

`code/main.py`实现 un harnais à l'image de banc:

- Les tâches de correction de bugs synthétiques ((3 tâches)
- Un agent scripté, proposera des correctifs.
- Un testiste, pour vérifier FAIL_TO_PASS
- Un classificateur de difficulté GAIA basé sur la profondeur de décomposition des questions.

Je vais le faire.

```
python3 code/main.py
```

输出会展示每一个任务+每一个难度的解决率,并让评价者规则变得具体――

## Utilisez-le

- **SWE-bench Verified**Utilisation des agents de code.
- **GAIA**Utilisez des agents généralistes. Utilisez des divisions privées.
- **AgentBench**Utilisé pour la comparaison multi-environnement:
- **Custom evals**(Létion 30) Pour utiliser la forme réelle de votre produit.

## Je le livre.

`outputs/skill-benchmark-harness.md`Pour une paire de code-base-tâche, construire un harnais de style SWE-bench, avec une fermeture FAIL_TO_PASS / PASS_TO_PASS.

## 练习

1. Pour le faire, vous devez choisir votre propre. Pour les bugs connus, vous devez rédiger 3 tests FAIL_TO_PASS.
2. Ajouter une métrique de comptage des étapes. Dans vos 3 tâches, à chaque résolution, combien d'acteurs de mesures ?
3. 阅读 SWE-bench+ paper。实现一个解决方案-leakage check(将发行文与不同做模式匹配)。
4. Une question de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de l'Agence de la GPT.
5. 阅读 AgentBench's breakdown par environnement. Quel environnement 映射你的产品表面?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| SWE-bench | “Code agent benchmark” | 2,294 个 GitHub issues；patch 必须翻转 FAIL_TO_PASS tests |
| SWE-bench Verified | “Clean SWE-bench” | 500 个由人工 curated 的 tasks，OpenAI |
| FAIL_TO_PASS | “Fix gate” | 之前 failing、patch 后必须 passing 的 tests |
| PASS_TO_PASS | “No-regression gate” | 之前 passing 且必须仍然 passing 的 tests |
| GAIA | “Generalist benchmark” | 466 个 human-easy / AI-hard 的 multi-tool questions |
| AgentBench | “Multi-env benchmark” | 8 个 environments；long-horizon multi-turn |
| Contamination | “Training-set leak” | benchmark tasks 出现在 model training 中 |
| SWE-bench+ | “Contamination audit” | 在 successful SWE-bench patches 中发现 32.67% solution leakage |

##  ultérieur

- [Jimenez et al., SWE-bench (arXiv:2310.06770)](https://arxiv.org/abs/2310.06770) Indice de référence original
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选子集
- [Mialon et al., GAIA (arXiv:2311.12983)](https://arxiv.org/abs/2311.12983) référence générale
- [Liu et al., AgentBench (arXiv:2308.03688)](https://arxiv.org/abs/2308.03688) Suite de plusieurs environnements
