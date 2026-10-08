# Agent de codage autonome 版图(2026)

> SWE-bench Verified dans les trois années à venir de 4%  augmenté à 80,9%  Le même Claude Sonnet 4.5 en SWE-agent v1 en hauteur de 43,2%, en Cline autonome en hauteur de 59,8%  Aujourd'hui, l'échafaudage et le modèle autour du modèle sont aussi importants que le modèle lui-même  OpenHands(précédent pour OpenDevin) est la plateforme la plus active sous licence MIT, son CodeAct loop va exécuter des actions Python directement dans la boîte à sable, et non JSON appels  头条 numérique couvre un problème de méthodologie  100 个 SWE-bench Verified 任务中有 161 个只需要1:52 行修改, alors que SWE-bench Pro10 行任务)                                                                                                                                                                

**类型：**Apprendre à apprendre
**语言：**Python(stdlib,CodeAct vs JSON outil-appel à la comparation)
**先修要求：**Phase 14 · 07(Utilisation des outils),Phase 15 · 01(Agent à long horizon)
**时间：**Il est 45 minutes.

##  problématique

La question la plus vraie est la suivante: dans la distribution des tâches correspondant à mon travail, en utilisant l'échafaudage que je vais utiliser dans la production, comment puis-je obtenir une fiabilité de bout en bout ?

Entre 2022 et 2026, ce domaine reconnaît l'échafaudage  échafaudage  récupération de couche ‧ planificateur ‧ sandbox ‧ éditer- vérifier boucle ‧ format de rétroaction  est de la charge de la structure ‧ Claude Sonnet 4.5 ‧ SWE-bench ‧ Verifié ‧ sur SWE-agent v1 ‧ est de 43,2%; le même modèle placé sur l'échafaudage autonome de Cline ‧ est de 59,8% ‧ sur le même poids, la différence absolue est de 16,6 ‧ ‧ un modèle de base est un composant; ‧ boucle ‧ est un produit ‧

Le problème qui s'ensuit est le point de référence 和会掩盖退步──SWE-bench Verified 已接近和,而易任务尾(500 个任务中有 161 个只需要 ≤2 行) 会拉高顶部分数──真实世界质量更适合在SWE-bench Pro(10+ 行修改) de la même manière, où le même système de pointe est encore seulement 2359%──

## 概念

### Utiliser un mot pour comprendre le banc de la SWE

SWE-bench(Jimenez et al.) sélectionnez avec des correctifs de base de la vérité de véritables problèmes GitHub,并要求代理 生成一个补丁,让测试套件 通过──SWE-bench Verified(OpenAI,2024) est un 500 任务子集, passé à travers l'homme de la main 选,移除含糊和损坏的任务──SWE-bench Pro 是更难的后后版本  任务要求 10+ 行修改, les agents frontaliers actuels sont divisés en 2359%──

### 2022 → 2026 曲线真正说明了什么

- **2022**Les modèles de recherche dans le premier groupe SWE sont de 4% en moyenne.
- **2024**:GPT-4 + échafaudage de style Devin environ 14%; agent SWE environ 12%
- **2025**Le sonnet de Claude 3.5/3.7 est augmenté à 4055%
- **2026**Le classement de l'ère de l'IA sera suivi en temps réel.

Cette tendance provient de trois sources: meilleur modèle de base, meilleur échafaudage, plus de repères de codeact, de réflexion, de vérificateur, ainsi que de meilleurs repères, plus de repères vérifiés.

### CodeAct par rapport à JSON 工具调用

OpenHands(All-Hands-AI,arXiv:2407.16741, prologue pour OpenDevin) a fait un pari d'architecture spécifique: non pas faire en sorte que le modèle émette des appels à l'outil JSON de l'hôte, mais plutôt faire en sorte que le modèle émette du code Python, et fonctionne dans le noyau de style Jupyter dans une boîte à sable.

权衡如下:

- **JSON tool calls**: chaque action est une seule fois; facile à vérifier; composition est limitée; plus sûr, car chaque appel est effectué par un validateur explicite.
- **CodeAct**Une action peut être un programme entier; posséder une composition; nécessiter une boîte à sable durcie(OpenHands utiliser l'isolement Docker); modes d'échec comprenant le temps de fonctionnement de la boîte à sable 允许的任何行为。

两种架构都已用于生产──CodeAct 在开放平台中占主导(OpenHands、smolagents)──JSON tool calls 在管理服务中仍占主导──Anthropic Managed Agents、OpenAI Assistants),因为提供商 控制执行者──

### 2026 版图中的 échafaudages

| Scaffold | License | Execution model | Notable property |
|---|---|---|---|
| OpenHands (OpenDevin) | MIT | Docker 中的 CodeAct | 最活跃的 open platform；event-stream 可 replay |
| SWE-agent | MIT | Agent-Computer Interface (ACI) | 第一个端到端 SWE-bench scaffold |
| Aider | Apache-2 | local repo 中 edit-via-diff | Minimal scaffold，regression stability 强 |
| Cline | Apache-2 | 带 tool policy 的 VS Code agent | Sonnet 4.5 上得分最高的 open scaffold |
| Devin (Cognition) | Proprietary | Managed VM + planner | 第一个“AI software engineer”产品类别 |
| Claude Code | Proprietary | Permission modes + routines | Lesson 10 会详细讲解 agent loop |

### Pourquoi les échafaudages ?

Une fois de codage est une trajectorie à long horizon.

1. **Retrieval**Le référencement de l'agent de la SWE, l'indice de fichiers ACI, OpenHands et le référencement de l'Aider sont en train de résoudre ce problème.
2. **Verifier loop**::运行测试、读取堆积痕迹、再试,在SWE-bench 上能带来10+ 分差──
3. **Failure containment**Le même modèle de boîtier de roulement peut empêcher les dommages accumulés.

### Indice de référence 和与 réel distribution

OpenHands Autors et Epoch AI ont indiqué que la banque SWE Verified existant une queue facile: 500 个任务中有 161 个只需要12 行修改。高分部分由这个 queue 驱动。SWE-bench Pro 限定为10+ 行修改, même dans les systèmes frontaliers,分数也只有2359%。 Ta distribution de production est presque certainement plus proche de Pro, plutôt que Verified。

选择代理的含义是: dans votre propre backlog de bugs 上运行一个类似Pro 的子集──truly important分数,是代表您实际交付内容的任务上的分数──


```figure
a5-scaffold-delta
```

## Utilisez-le

`code/main.py`Dans une distribution de mini-tasks fixe, comparez les échafaudages de deux agents de jouets:

1. Une .**JSON tool-call**Échafaudage, à chaque tour, prendre une action.
2. Une .**CodeAct**Chaque action peut être émise en Python.

两者都使用 stub model(réguliers déterministes), donc comparer le plancher avec le modèle质量隔离――输见显示 CodeAct plancher Utiliser moins de tours 解决更多任务,代价是每个动作的爆炸半径更大――

## Je le livre.

`outputs/skill-scaffold-audit.md` vous aider à adopter l'échafaudage proposé d'agents de codage  avant de procéder à un audit: qualité de récupération ‧ présence de vérificateur ‧ isolation des sablettes, ainsi que conformité des points de référence à la distribution ‧

## 练习

1. 运行  référencement`code/main.py`Dans le même ensemble de tâches, chaque échafaudage a besoin de combien de tours?

2. 阅读OpenHands paper(arXiv:2407.16741)。 Le document considère que CodeAct sur des tâches complexes est meilleur que les appels à l'outil JSON。 trouver le papier 承认一个失败模式,并写一句话说明该模式 什么时候会在生产中占主导──

3. De votre backlog de bugs, choisissez un besoin à travers deux fichiers  modifier 10+ 行的任务── estimer le modèle de frontière sur (a) les appels des outils JSON 和 (b) CodeAct 下的端到端成功概率──说明差距的理由──

4. SWE-bench Verified Il y a 161 tâches de 1 2 行                                                                                                                                                                                                                                                       

5. 阅读 Introduction du SWE-bench Verified(OpenAI) ―― expliquer la méthodologie spécifique utilisée pour déménager des tâches ambiguës,并说出一种 curation 会漏掉的类别──

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|---|---|---|
| SWE-bench | “Coding benchmark” | 带有 ground-truth patches 和 test suites 的真实 GitHub issues |
| SWE-bench Verified | “Cleaned subset” | 500 个经过人工筛选的任务，存在 easier-tail |
| SWE-bench Pro | “Harder subset” | 10+ 行修改；frontier 得分为 23–59% |
| CodeAct | “Code-as-action” | Agent 发出 Python；Jupyter-style kernel 在 sandbox 中执行 |
| JSON tool call | “Function calling” | 每个 action 都是执行前经过验证的 structured JSON payload |
| Scaffold | “Agent framework” | 围绕基础模型的 retrieval + planner + executor + verifier loop |
| ACI (Agent-Computer Interface) | “SWE-agent's format” | 为 LLM ergonomics 设计的 command set，而不是 human shells |
| Verifier loop | “Test-and-retry” | 运行 tests、读取 output、修订 patch；最大的非模型可靠性收益 |

## 延伸阅读

- [Jimenez et al. — SWE-bench](https://www.swebench.com/) Originaire et méthodologie
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) sous-ensemble curaté                                                                                                                                                                                                                                                           
- [Wang et al. — OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) CodeAct 架构和事件流 设计──
- [Epoch AI — SWE-bench leaderboard](https://epoch.ai/benchmarks) 实时追踪的分数──
- [Anthropic — Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) cadrage de fiabilité des agents de codage à long horizon。
