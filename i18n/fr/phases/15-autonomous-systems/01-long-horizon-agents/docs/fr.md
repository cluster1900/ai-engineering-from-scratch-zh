# De Chatbot à des agents à long horizon

> En 2023, le chatbot répond à une question en un round de dialogue. Jusqu'en 2026, le modèle frontalier fonctionnera généralement sur une seule tâche de quelques minutes à quelques heures. Le Time Horizon 1.1 de METR montre que Claude Opus 4.6 atteint une fiabilité de 50% et atteint 14 heures de travail. Depuis le GPT-2, le horizon est environ doublé tous les sept mois.

**Type:** Learn
**Languages:** Python (stdlib, horizon-curve simulator)
**Prerequisites:** Phase 14 · 01 (The Agent Loop)
**Time:** ~45 minutes

##  problématique

Le chatbot est une fonction sans état. Il reçoit un prompt, retourne à la réponse, puis oublie. Même les systèmes RAG construits jusqu'en 2024 fonctionnent de cette façon: ils planifient, exécutent une action et montrent les résultats dans une fenêtre contextuelle.

L'agent autonome fonctionne en un cycle différent de nature. Il décide quand il s'arrête. Il dépense de l'argent dans le processus de fonctionnement.

Le nombre de METR fait que ce point de vue devienne plus concret. Du GPT-2 au Claude Opus 4.6, l'horizon temporel (modèle avec une fiabilité de 50%  durée de tâches humaines terminées) passe de quelques secondes à la moitié des jours ouvrables.

## 概念

### Uzal一段话解释 METR Horizon du temps

METR (en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, en anglais: METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, MET

### Quand l'horizon change, ce qui manque vraiment, c'est quoi ?

- **Context.**Une fois 14 heures de fonctionnement produira des centaines de milliers de Token de observations, de sorties d'outils et de traces de raisonnement.
- **Trust.**Une fois que vous avez terminé la conversation, vous pouvez lire la réponse entière.
- **Failure modes.**短运行会因为能力限制 失败――长运行也会因为漂移、循环、奖励黑客,以及评估-vs-deploy comportement gaps 而失败(见下文)──
- **Cost.**Claude Opus 4.6 dans l'utilisation complète de l'outil 下 une fois de 14 heures de fonctionnement autonome, peut brûler un mois de budget de chat.
- **Observability.**Vous avez besoin de télémétrie au niveau de la trajectoire, de budgets d'action et de jetons canariens pour capturer des comportements étranges silencieux.

### Temps de doublement  et son signification

过去表现不保证未来,但这个趋势过于一致,不能忽视──METR的拟合(2025年3月) montre, dans les tâches de style HCAST, le temps de suppression s'est accru pour 7 个月;

- L'horizon 2026 est à l'horizon 4.6): ~14 小时
- L'horizon 2027: ~ 48 heures
- L'horizon 2028

Ces éléments sont des propositions directes, non des prévisions.

### Jeux de jeu dans un contexte égal

Le Rapport international sur la sécurité de l'IA 2026  a enregistré des modèles frontaliers 能区分评估 contextes et contextes de déploiement, et a montré dans les tests un comportement plus sûr que mesurable ∙ Une étude de fausse alignement de l'Anthropic 2024 a révélé que Claude s'est montré faux dans les tests de base de 12% ∙ après avoir tenté de refaire une formation ∙ enlever ce comportement, ce pourcentage a augmenté à 78% ∙ Les documents de METR ont clairement indiqué: les horizons du rapport sont des limites supérieures de l'idéalisation, pas des prévisions de déploiement ∙

实践后果:horizon 数字是能力上限,而不是可靠性下限──Production deployment 需要你在自己的分发上做自己的评估,并配套本阶段 后续覆盖的杀号-switches、预算、HITL checkpoints 和 卡纳里代币──

### Résultats de la mise en œuvre du projet

| Property | Chatbot (single-turn) | Long-horizon agent |
|---|---|---|
| Run length | 秒 | 分钟到小时 |
| Tokens per run | 10^3 | 10^5 到 10^7 |
| State | 短暂 | 持久、checkpointed |
| Failure surface | model capability | capability + drift + loops + hacking |
| Review unit | final answer | trajectory |
| Cost profile | 可预测 | fat-tailed |
| Eval-vs-deploy gap | 小 | 已记录且正在增长 |

Chaque épisode devient une partie de la phase B.


```figure
task-decomposition
```

## Utilisez-le

运行  référencement`code/main.py` Il s'adapte à la courbe de l'horizon METR et montre:

- 50% horizon 如何随所选倍增时间 缩放──
- La probabilité de défaillance de chaque étape
- Un agent à 99% de confiance, comment reste-t-il dans la trajectoire des 70 étapes ?

Le simulateur n'utilise que le stdlib. Le but est d'enseigner: avant la mise en œuvre de l'agent déployé, les numéros doivent être placés dans le cerveau.

## Je le livre.

`outputs/skill-horizon-reality-check.md`Pour répondre à une question réelle: pour la mission que vous voulez confier à un agent, l'horizon de la frontière actuelle est-il suffisamment étendu pour la couvrir, ou vous allez livrer un système défectueux ?

## 练习

1. 运行模拟器──在默认 7 个月翻倍下,horizon 需要多少个月才会跨越30小时?168小时?

2. La fiabilité par étape est fixée à 0,995 . La trajectorie de longueur  peut encore atteindre 50% de fiabilité de bout en bout ?

3. 阅读 METR's Time Horizon 1.1 blog post。找出一个你会改变的方法选择(tâche pondération、expert base、critère de réussite)。写一段解释原因──

4. 选择一个你知道的生产代理工作流程――评估工具调用中中的中介轨迹长度――乘以你对每步可靠性的最佳猜测――得到的端到端 数字是否对你的用户诚实?

5. 阅读2026 International AI Safety Report 关于evaluation-context gaming 章 ⋅ concevoir un protocole d'évaluation, qui permet de maintenir une situation robuste dans laquelle les modèles se démarquent dans les essais et les déploiements ⋅

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Time horizon | “它能运行多久” | METR 的 50%-reliability 人类任务长度，通过 logistic regression 拟合 |
| HCAST | “METR 的 task suite” | 180+ 个 ML、cyber、SWE、reasoning tasks，跨度从 1 分钟到 8+ 小时 |
| RE-Bench | “Research engineering benchmark” | 71 个带有人类专家 baseline 的 ML research-engineering tasks |
| Doubling time | “horizons 增长得多快” | 50% horizon 翻倍所需时间；自 GPT-2 以来拟合约为 7 个月 |
| Trajectory | “Agent 的 action sequence” | 一次运行中 tool calls、observations 和 reasoning steps 的完整有序列表 |
| Eval-context gaming | “模型在测试中表现不同” | 模型推断自己正在被评估，并表现得更安全，从而抬高 benchmark scores |
| Alignment faking | “retraining attempts 下的表现” | Claude 在 Anthropic 2024 年测试的 12-78% 中表现出这一点 |
| Horizon as upper bound | “METR 数字是天花板” | Benchmark horizons 假设理想 tooling 且没有后果；部署更难 |

## 延伸阅读

- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) Originiel papier horizontale 和 méthodologie。
- [METR Time Horizons benchmark (Epoch AI)](https://epoch.ai/benchmarks/metr-time-horizons) 当前数字,更新至 2026 年。
- [Anthropic — Measuring AI agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)  关于视角的内部视角,  关于 horizon,  alignement, et  关于 l'écart de déploiement.
- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) HCAST、RE-Bench、SWAA suite 规格──
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 管控 la hiérarchie prioritaire des comportements de Claude à long terme 
