# Le cadre de sécurité de la RSP, du PF, du FSF

> Trois principaux cadres de laboratoire définissent la gestion des capacités frontalières de l'industrie en 2026: Politique d'échelle responsable anthropique v3.0 ((2 月 de 2026) introduit des niveaux de sécurité de l'IA à couches distinctes ((ASL-1 à ASL-5+), dont l'ASL-3 a été lancé en mai 2025 pour des modèles liés au CBRN.

**Type:** Learn
**Languages:** none
**Prerequisites:** Phase 18 · 17 (WMDP), Phase 18 · 07-09 (deception failures)
**Time:** ~75 分钟

## Objectif de l'apprentissage
- 描述 Antropic's ASL de la structure de couche, ainsi que ce qui a déclenché ASL-3:
- Il est également possible de trouver des informations sur les différents types de données.
- 描述 DeepMind's Critical Capability Level 结构和 危害操纵 CCL──
- Expliquer les clauses d'ajustement des concurrents et expliquer pourquoi elles influenceront le comportement des concurrents.
- 定义安全案例,并描述三支柱结构 (surveillance, illégabilité, incapacité)

##  problématique
Le détournement est possible, la capacité à double usage existe, l'évaluation est également limitée, le modèle de bordure est nécessaire dans les laboratoires, qui peuvent:
- 定义何时需要新的保障的值──
- 定义规模 前所需的评估──
- Décrire le cas de sécurité.
- 处理竞赛动态问题(si un concurrent publie sans garantie, vous devriez comment faire?)

Ces trois cadres de 2025-2026 représentent les pratiques les plus avancées actuelles: ils ne sont pas parfaits, ils sont toujours en cours de développement, et les différents laboratoires sont suffisamment harmonisés pour que les problèmes de gouvernance deviennent maintenant suffisants ou non, plutôt qu'ils existent ou non.

## 概念
### Politique d'échelle responsable anthropic v3.0(2026 年 2 月)

ASL 结构:
- ASL-1: non modèle frontalier (en anglais seulement)
- ASL-2: actuellement la ligne de base de la frontière; utilisation des garanties de la norme 部署。
- ASL-3: risque de catastrophe d'utilisation erronée significativement plus élevé; CBRN 相关能力──于 2025 年 5 月启动──
- ASL-4:Trouble de traversée de la R&D-2 de l'IA; peut être automatisé dans les modèles de recherche de l'IA de classe d'entrée.
- ASL-5+: R&D avancé de l'IA; capable d'accélérer de manière significative la mise à l'échelle efficace des modèles

Le nouveau contenu de la version 3.0:
- Carte routière de sécurité des frontières (en anglais seulement)
- Rapports de risque (quarterly published, partially through external review)
- R&D d'IA est divisé en R&D-2 et R&D-4 de l'IA.
- Une fois que l'IA R&D-4 a été dépassée, il faut un cas de sécurité affirmé, identifier les objectifs mal alignés et les risques de mal alignement.

### Cadre de préparation à l'OpenAI v2(2025 年 4 月 15 日)

Cinq critères de capacité de traçabilité:
- **Plausible.**Il existe un modèle de menace raisonnable.
- **Measurable.**Il peut être effectué une évaluation expérimentale.
- **Severe.**Le danger est grand.
- **Net-new.**Il n'y a pas de risque de grandir.
- **Instantaneous-or-irremediable.**Les risques peuvent survenir rapidement ou être inexorables.

满足全部五项的能力会被追踪──其他能力不会──

D'autres structures de PF v2:
- Les rapports des capacités (模型能做什么) et les rapports des mesures de protection (有哪些控制措施) sont séparés.
- Le groupe consultatif en matière de sécurité  effectuer une révision.
- Le Comité de sécurité du Conseil de Direction
- "Clausule d'ajustement": si un autre laboratoire publie sans aucune garantie comparable, OpenAI peut réduire les exigences.

### Le cadre de sécurité de la frontière DeepMind v3.0(2025 年 9 月)

Le niveau de capacité critique selon les domaines répartis:
- Le renforcement des armes biologiques
- Le cyber-accès
- ML Accélération de la R&D
- Manipulation nocive (v3.0 新增): peut changer de manière significative les croyances/actions dans une situation de risque élevé.

v2.0(2025 年 2 月) a augmenté l'alignement trompeur 部分,并为 ML R&D CCL 增加更高的安全等级──

### L'alignement entre les laboratoires

- "Les seuils de capacité"
- "Le niveau de capacité critique".
- OpenAI "Pouvoir de capacité élevé".

没有行业标准术语──结构上一致: capacité frontalière de trois niveaux,并配有公开评估标准──三者都包含竞争对手调整条款(自2025年起)──

### Cas de sécurité

Le cas de sécurité est un document écrit qui explique que dans le pire des cas, la mise en œuvre d'un projet est acceptable et sûre.

- **Monitoring.**Si un mauvais comportement se produit, nous pouvons le vérifier ?
- **Illegibility.**Le modèle manque-t-il de capacité à mettre en œuvre un plan cohérent pour causer des dommages?
- **Incapability.**Le modèle manque-t-il de capacité à causer des dommages?

Différents cas de sécurité 针对不同支柱──对于ASL-3 CBRN, incapacité (通过不学习) 是主要目标──对于欺骗性,监控和不读性是目标──对于网络升级,三者都相关──

### Le problème de la dynamique de la course

Les critiques estiment que les clauses d'ajustement des concurrents sont litigieuses. Les critiques estiment que ces dernières créent une concurrence progressive: si trois laboratoires sont à l'origine des concurrents et réduisent leurs exigences, l'équilibre se transforme en une situation de sécurité.

Le Royaume-Uni AISI, les États-Unis CAISI et l'UE AI Office (§ 24 课) est un cadre de gestion externe à la réaction.

### Il est en phase 18 .

Le programme de recherche et de développement de l'équipe de recherche et de développement (MATS, Redwood, Apollo, METR) a été lancé en décembre dernier par le Centre de recherche et de développement (CEDEFOP).


```figure
al-asl-ladder
```

## Utilisez-le
Le cours n'a pas de code. Lire trois sources principales: RSP v3.0、PF v2、FSF v3.0──.

## Je le livre.
本课产 出 `outputs/skill-framework-diff.md` Donner un cadre de sécurité ou une note de sortie, il comparera les définitions de seuils du cadre, les évaluations nécessaires et la structure du cas de sécurité avec le RSP v3.0 、PF v2 、FSF v3.0 , et marquera les différences entre les laboratoires ∼

## 练习
1. 阅读RSP v3.0、PF v2 和 FSF v3.0──整理一张表, listing of each laboratory's CBRN threshold、 their respective AI R&D thresholds, as well as their respective pre-deployment evaluation requirements──

2. Les trois cadres (en 2025) contiennent une clause d'ajustement des concurrents.

3. Pour une dépassement du seuil de R&D-4 de l'IA anthropologique, le modèle de conception de cas de sécurité, la surveillance, l'irrégularité, l'incapacité, les besoins individuels sont prouvés.

4. La FSF de DeepMind v3.0 introduit la CCL de manipulation nocive. Elle propose trois mesures expérimentales, pour montrer que le modèle a dépassé ce seuil.

5. 阅读 METR's "Elements communs de la politique de sécurité de l'IA frontalière" (en 2025):

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| RSP | "Anthropic's framework" | Responsible Scaling Policy；ASL tiers；v3.0 2026 年 2 月 |
| PF | "OpenAI's framework" | Preparedness Framework；五项标准；v2 2025 年 4 月 |
| FSF | "DeepMind's framework" | Frontier Safety Framework；CCLs；v3.0 2025 年 9 月 |
| ASL-3 | "biosafety level 3-analog" | Anthropic 针对 CBRN 相关能力的层级；于 2025 年 5 月启动 |
| CCL | "critical capability level" | DeepMind 的 threshold construct；按领域划分 |
| Safety case | "the formal argument" | 书面论证，说明在 worst-case U 下部署是可接受地安全的 |
| Adjustment clause | "competitor defection allowance" | 如果竞争对手在没有可比 safeguards 的情况下发布，框架中允许降低要求的条款 |

## 延伸阅读
- [Anthropic — Responsible Scaling Policy v3.0（2026 年 2 月）](https://www.anthropic.com/responsible-scaling-policy) L'ASL 层级、路线图、AI R&D 解
- [OpenAI — Updating the Preparedness Framework (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) 五项标准,调整条款
- [DeepMind — Strengthening our Frontier Safety Framework (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) CCL v3.0, Manipulation dangereuse
- [METR — Common Elements of Frontier AI Safety Policies (2025)](https://metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies/) comparaison entre laboratoires
