# METR Horizons temporels et évaluation des capacités extérieures

> METR(précurant pour ARC Evals) depuis le 12 janvier 2023 pour devenir indépendant 501 ((c) 3) 组织──他们的时间视野1.1基准(2026年1月) 将任务成功概率与 log(专家人类完成时间) 拟合为一个物流曲线;在50% 概率处交点定义为模型的时间视野──20252026年 参与集 覆盖 GPT-5.1、1GPT-5.1-Codex-Max,以及原型监控评估(监控能力是否发现侧任务;代理能否规避) 基准套件:CASH MLT180+ 个别、已设置了SWE、推理测任务; 分钟到8小时) RE-Bench 71 专家带带基线任务的 MLWA 署 AWA    记录                                                                                                                                                       

**类型：**Apprenez à le faire
**语言：**Python (stdlib, estimateur d'horizon logistique)
**先修：**Phase 15 · 01 (agents à long horizon), phase 15 · 19 (RSP)
**时间：**- 60 minutes

##  problématique

Les valeurs des politiques d'échelle (lesson 19, 20) dépendent des résultats de mesure qu'elles citent. La autonomie à long terme est définie dans le texte de politique; elles ne deviennent exécutables que lorsque des chiffres spécifiques sont évalués.

METR est une organisation d'évaluation externe de 20242026 ans, qui définit de nombreux numéros. Ils évaluent les modèles frontaliers, généralement réalisés avant la publication du modèle, dans les conditions de signature de la NDA avec le laboratoire, et ensuite publient des thèses de méthodologie. Le Time Horizon 1.1 est leur résultat central: un modèle qui réduira les capacités en une seule unité de lecture humaine. Ce modèle peut être réalisé de manière fiable à 50%.

Cette partie de ce cours concerne le méthodologie de calcul de l'horizon, une partie concerne la façon d'expliquer pourquoi l'horizon est le sommet et non le déploiement de prévisions.

## 概念

### METR 背景

- 成立时间:2023 年 12 月(前身为 ARC Evals,拆分为独立 501(c)(3))
- 范围: évaluer les capacités autonomes des modèles frontaliers, généralement réalisées avant la publication.
- 合作实验室:Anthropic、OpenAI(20252026 Engagement multiple)
- 重要交付物:Horizon temporel 1.0(2025 年 3 月) 、Horizon temporel 1.1(2026 年 1 月) 、原型监控评估──

### L'horizon temporel 拟合

方法论(de METR blog 和 papiers):

1. 收集一个任务套件,覆盖分钟级到小时级的专家完成时间──当前套件:HCAST(180+个任务)、RE-Bench(71个任务)、SWAA──
2. 让模型运行每个任务;记录成功或失败──
3. 拟合一条 逻辑曲线:P(success) 是 log(专家完成时间) 的函数──
4. L'horizon est le succès = 0,5 de la période de spécialisation.

La forme logistique-fit est adaptée, car il existe généralement une relation croissante et proche entre la capacité et la difficulté de la tâche. 50% de points est une option.

### 2026 année 1 mois chiffre

Selon l'horizon temporel 1.1:

- Claude Opus 4.6: en 50% de fiabilité en bas environ 14 heures, du temps horizon 1.1 ((2026 année 1 mois)
- Le temps de doublement de l'horizon temporel de l'action à la manière de l'HCAST: Horaire horizon 1.1 (en janvier 2026) Rapport post-2023 拟合约为 4.3 个月(130.8 天); chiffre d'environ 7 个月是 Horaire horizon 1.0 en 20192025 总量拟合, et TH1.1 en 2023 avec chiffres post-2023 报告一起.

C'est la phase 15 后续引用的具体数字──Anthropic's RSP v3.0Lesson 19) et DeepMind's FSF v3Lesson 20) ont été cités comme étant l'une des mesures des évaluations de seuils d'entrée──

### Suites de référence

- **HCAST**Le nombre de tâches de l'équipe de recherche est de 8 à 8 minutes.
- **RE-Bench**Les travaux de recherche et développement de l'IA sont réalisés en fonction de la capacité de l'IA à atteindre le seuil de R&D-4.
- **SWAA**:较短任务; utilisé pour la courbe de l'horizon de la formation à l'échelle de la classe moyenne.

### Évaluation de la surveillance

20252026 工作 METR contient des prototypes de surveillance-évaluation:moniteur 能否发现模型正在执行副任务 (en dehors des exigences de l'opérateur);agent 能否规避monitor──这些直接输入到OpenAI PF v2 的Undermining Safeguards类别, ainsi que le suivi des alignements trompeurs dans DeepMind FSF v3(Légation 20)──

### Pourquoi les horizons sont en haut ?

- **理想化工具**Les tâches de référence 给模型提供干净工具和格式良好的数据──真实部署更混乱──
- **没有真实后果**Le modèle ne sera pas vraiment débloqué aux clients, supprimer les données réelles ou contacter les personnes réelles.
- **Eval-context gaming**Le rapport international sur la sécurité de l'IA de 2026 en est le résultat.
- **没有真实用户差异**: les requêtes de référence sont structurées.

L'horizon est la capacité maximale dans des conditions favorables. La fiabilité de déploiement est un autre chiffre, plus bas, et l'équipe doit mesurer sa propre distribution pour le savoir.

### Signification de l'évaluateur du ministère extérieur

L'évaluation extérieure est importante, car les laboratoires internes ont le pouvoir d'optimiser leurs rapports. L'indépendance du METR: un 501 (c) (3) possédant des méthodologies ouvertes et des documents examinés par des pairs, est une mesure de réduction structurelle.

### 如何在实践中使用视界 数字

- **作为能力过滤器**Si l'horizon d'un modèle est nettement inférieur à celui de l'expert, ne le mettez pas en ligne de manière autonome.
- **作为趋势指标**Le temps double vous dit que même sans nouvelles mesures d'atténuation, la pratique actuelle peut rester sûre pendant longtemps.
- **作为 prior**Le horizon de l'heure est le point de départ.


```figure
a5-horizon-fit
```

## Utilisez-le

`code/main.py`基于合成结果集, réalisé logistique de réussite des tâches avec logement 专家时间. 报告50% horizon  METR 的主指标) 10% horizon 保守) 及90% horizon 乐观) ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                                                                                                   

## Je le livre.

`outputs/skill-horizon-interpretation.md`审查 la revendication de l'horizon du fournisseur,并产出基准索赔与部署现实之间的差距分析──

## 练习

1. 运行  référencement`code/main.py` Confirmer que 50% de l'horizon qui s'est réalisé correspond à la réalité de la terre synthétique  Réduire la grille de temps de travail à moitié;

2. 阅读METR's Time Horizon 1.1 blog post. Découvrez les tâches spécifiques les plus et les moins fiables.

3. 阅读 METR 的Messing Autonomous AI Capabilities资源──列出 HCAST 任务类别──选择一个你会在生产任务中赋予更高权重的类别,并说明理由──

4. Pour évaluer le contexte de jeu  introduire le simulateur: traduire en succès environ 20% des défaites de tâches  Rapporter un nouvel horizon  Cela signifie presque 20% du taux de jeu  Comment affecter les chiffres d'observation 

5. 基于 votre propre backlog de bugs ou un ensemble de tâches représentatives, concevoir une évaluation de l'horizon interne ∙ Décrire la collecte de données ∙ adaptation, ainsi que le sort vous dire quoi ∙

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| METR | “外部评估者” | 前身为 ARC Evals；自 2023 年 12 月起为独立 501(c)(3) |
| Time Horizon | “能力度量” | 来自 logistic fit 的、50% 可靠性下的专家任务长度 |
| HCAST | “METR 的主套件” | 180+ 个任务，跨度从 1 分钟到 8+ 小时 |
| RE-Bench | “Research engineering” | 71 个带人类 baseline 的 ML research-engineering 任务 |
| SWAA | “短任务套件” | 校准 horizon curve 的低端 |
| Doubling time | “增长率” | 50% horizon 翻倍所需时间；按 HCAST 约 7 个月 |
| Eval-context gaming | “模型行为不同” | 测试与部署之间有记录的行为差距 |
| Upper bound | “Horizon 是上限” | benchmark horizon > 负载下的 deployment reliability |

## 延伸阅读

- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) HCAST、RE-Bench、SWAA 规格──
- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) Origini papier d'horizon
- [METR — Time Horizon 1.1 (January 2026)](https://metr.org/research/) 当前数字和方法论──
- [Epoch AI — METR Time Horizons benchmark](https://epoch.ai/benchmarks/metr-time-horizons)Je suis en train de suivre.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于 METR mesures de vue interne。
