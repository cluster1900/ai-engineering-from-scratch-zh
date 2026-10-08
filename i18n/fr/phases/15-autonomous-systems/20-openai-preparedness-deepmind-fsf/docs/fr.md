# Le cadre de préparation à l'OpenAI et le cadre de sécurité frontalière de DeepMind

> Le cadre de préparation d'OpenAI v2(4月 du 2025) introduit les catégories de recherche: Autonomie à long terme, Sandbagging, Réplication autonome et Adaptation, Garanties de réduction, elles diffèrent des catégories suivantes. Les catégories suivantes seront incitées à publier des rapports de capacités ainsi que des rapports de garanties, et le FSF v3 du Groupe consultatif en matière de sécurité sera examiné.

**Type:** Learn
**Languages:** Python (stdlib, three-framework decision-table diff tool)
**Prerequisites:** Phase 15 · 19 (Anthropic RSP)
**Time:** ~45 minutes

##  problématique

Leçon 19 仔細讀讀了人類學的規模化政策──本课通过讀讀OpenAI和DeepMind的政策來補完全景──These three-part document are the same product, de traitement du même problème: frontière lab 什么时候应该暂停或限制一个模型; ils tendent à être similaires dans un petit groupe de catégories, mais aussi à des positions spécifiques importantes.

趋同之处: 三者都把长远自主权 标记为值得追踪的能力类别──三者都承认欺骗行为(alignment faking、sandbagging) est un type spécifique de risque──三者都有内部审查机构──分歧之处:OpenAI 将类别分为Tracked(强制缓解) 和Research(不自动触发)──DeepMind 将自主权 纳入两个领域,而不是单独命名──实验室将使用Tracked Research,Critical vs Moderate、Tier-1 vs Tier-2等名称;能力落在哪个桶里,将在不同的实验室产生不同的操作后果──

Les mettre ensemble est une pratique utile. Une même capacité en Anthropic peut être une atténuation obligatoire, en OpenAI peut être une surveillance mais pas un déclenchement, en DeepMind peut être une surveillance dans un domaine spécifique.

## 概念

### Le cadre de préparation d'OpenAI v2(2025 年 4 月)

结构:

- **Tracked Categories**Les mesures de sécurité sont mises en œuvre par le Groupe consultatif en matière de sécurité.
- **Research Categories**Le projet de recherche de la Commission sur les mesures de lutte contre les épidémies de la grippe a été lancé en décembre 2007.

Les catégories de recherche ne seront pas automatiquement sensibilisées aux mesures de réduction. Le mot de passe de la politique est "atténuations potentielles".

### Le cadre de sécurité de la frontière de l'esprit profond v3(2025 年 9 月;Niveaux de capacité de suivi 于 2026 年 4 月 17 日加入)

结构:

- **Critical Capability Levels (CCLs)**La capacité de la technologie dans les cinq domaines suivants: Cyber, Bio, ML R&D, CBRN, Autonomie,
- **Tracked Capability Levels**:2026 年 4 月加入额外粒度──具体例:ML R&D autonomie niveau 1 = 以 Comparé aux outils humains + IA
- **Deceptive alignment monitoring**:明确承诺 à la surveillance automatisée de l'utilisation abusive de la raisonnement par des instruments.

L'autonomie est différente de l'OpenAI. Le DeepMind ne considère pas l'autonomie comme un domaine de haut niveau; elle est intégrée dans l'autonomie et peut causer des dommages.

### 3° Les tendances communes

- 内部 Groupe consultatif en matière de sécurité (分别命名为人类SAG、OpenAISAG、DeepMind internal committee)
- 明确提到欺骗性配合/配合伪造 是一类风险──
- Éclairements de rythme et de durée de vie du FSE: Rapport de conduite sur la sécurité frontalière, Rapport sur les risques, Rapports sur les capacités et les garanties, Rapports sur la mise à jour du FSE, Rapports sur les capacités et les garanties, Rapports sur les mesures de sécurité et de sécurité, Rapports sur les risques et les risques, Rapports sur les capacités et les garanties, Rapports sur les mesures de sécurité et de sécurité, Rapports sur les risques et les risques, Rapports sur les mesures de sécurité et de sécurité, Rapports sur les mesures de sécurité et de sécurité, Rapports sur les risques et les risques, Rapports sur les mesures de sécurité et de sécurité, Rapports sur les mesures de sécurité et de sécurité environnementales, Rapports sur les mesures de sécurité et de sécurité environnementales (Réponses à la mise à jour du FSE)
- La défense de la surveillance est limitée. La profondeur de la pensée dit clairement: "la surveillance automatisée ne restera pas suffisante à long terme".

### Où sont les différences entre eux

- **Anthropic**:v3.0 移除了暂停承诺;AI R&D-4 threshold is被命名的下一个门──
- **OpenAI**:Tracked vs Research 拆分;Categories de recherche (incluant l'autonomie à longue portée) ne seront pas automatiques.
- **DeepMind**L'autonomie est intégrée dans d'autres domaines; les niveaux de capacité suivis sont ajoutés à la plus petite proportion en 2026.

### Le sable: une capacité spécifique à rendre les choses compliquées

Sandbagging (模型在评估中策略性表现不佳) se trouve dans les catégories de recherche d'OpenAI.

Si un modèle est évalué en sandbag, alors la capacité de chaque cadre sera sous-estimée. Le cadre est seulement valable lorsque la mesure est valide. C'est pourquoi, en plus de l'auto-évaluation du laboratoire, il est nécessaire de mesurer à l'extérieur.

### 政策阅读技能

- 定位: chaque compétence dont vous êtes préoccupé devrait être trouvée dans la politique.
- C'est la recherche ou la recherche qui est suivie mais non suivie ?
- Résumé: Le programme est-il mis à jour selon le calendrier de la déclaration, ou est-il seulement mis à jour après un événement spécifique?
- 独立性: Externe review is compulsory or optional?Anthropic avec Apollo et US AI Safety Institute 合作;OpenAI avec METR 合作;DeepMind principalement dépend de SAG interne。


```figure
a5-tracked-vs-research
```

## Utilisez-le

`code/main.py` mettre en œuvre un outil de différenciation de table de décision minuscule  donner une capacité  autonomie  alignement trompeur  R&D automatisation  cyber-élevage  etc., il produira trois politiques séparément comment se classent ces capacités, ainsi que de déclencher des mesures de réduction  Il s'agit d'un outil de lecture, pas d'un outil de politique 

## Je le livre.

`outputs/skill-cross-policy-diff.md`Utiliser trois cadres comme référence, pour une capacité spécifique à générer des politiques en matière de comparaison.

## 练习

1. 运行  référencement`code/main.py` Confirmer la conformité des sorties et des politiques de l'outil différent, au moins vérifier la capacité de vérification des documents de la source de données 

2. 完整阅读 OpenAI Preparedness Framework v2──识别每个研究类别──对每项,用一句话说明为什么它在研究而不是追踪──

3. 完整阅读 DeepMind FSF v3, ainsi que les niveaux de capacité de suivi de l'année 2026 更新──识别 ML R&D autonomie niveau 1 具体评估标准──你会如何从外部测量它?

4. Sandbagging 位于 OpenAI's Research Categories。 concevoir une évaluation, obligeant le modèle de sable à exposer sa réelle capacité。 cité Leçon 1 dans la discussion sur l'évaluation-context-gaming。

5. 针对某项具体能力 (由你选择) 比较三项政策――说明你认为哪些政策的分类最严谨的,哪些最不严谨的,用源文本证明――

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Preparedness Framework | “OpenAI 的 scaling policy” | PF v2（2025 年 4 月）；Tracked vs Research categories |
| Tracked Category | “Mandatory mitigation” | 触发 Capabilities + Safeguards Reports；SAG review |
| Research Category | “Monitored only” | 被追踪但没有自动缓解措施；包括 Long-range Autonomy |
| Frontier Safety Framework | “DeepMind 的 scaling policy” | FSF v3（2025 年 9 月）+ Tracked Capability Levels（2026 年 4 月） |
| CCL | “Critical Capability Level” | DeepMind 每个领域的阈值（Cyber、Bio、ML R&D、CBRN） |
| ML R&D autonomy level 1 | “R&D automation” | 以有竞争力的成本完全自动化 AI R&D pipeline |
| Sandbagging | “Strategic underperformance” | 模型在 evals 中表现不佳；位于 OpenAI Research Categories |
| Instrumental reasoning | “Means-ends reasoning” | 关于如何实现目标的推理；DeepMind monitoring 的目标 |

## 延伸阅读

- [OpenAI — Updating our Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/)- Je suis en train de vous dire.
- [OpenAI — Preparedness Framework v2 PDF](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) 完整文档──
- [DeepMind — Strengthening our Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) FSF v3 公告──
- [DeepMind — Updating the Frontier Safety Framework (April 2026)](https://deepmind.google/blog/updating-the-frontier-safety-framework/) Niveaux de capacité suivis 增补。
- [Gemini 3 Pro FSF Report](https://storage.googleapis.com/deepmind-media/gemini/gemini_3_pro_fsf_report.pdf) Rapport de risque du FSE 形式 示例。
