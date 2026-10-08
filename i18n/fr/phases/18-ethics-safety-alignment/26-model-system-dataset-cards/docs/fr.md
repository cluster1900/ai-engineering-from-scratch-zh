# Modèle ∆ Système et cartes de jeu de données

> Les trois types de documents constituent une structure de transparence de l'IA. 2019),  Étiquette nutritionnelle du modèle: formation données  Quantité de l'analyse  Étronique de la valeur  Fait attention; seulement 0,3% des cartes modèle Hugging Face  enregistrent l'éthique de la valeur  Oreamuno et al. 2023) ・Datables de données pour les ensembles de données (Gebru et al. 2018, CACM) 动机、组成、收集过程、标注、分发、维护;类比电子元件数据 Sheet──Data Cards(Pushkarna et al., Google 2022) 模块化分层细节(telescopic、periscopic、microscopic), en tant qu'éléments frontaliers face à différents lecteurs──2024-2025 L'année dernière, le nombre de personnes qui ont reçu des cartes de modèle a augmenté de 29% en moyenne. L'équipe de la Commission a été informée de la situation de la situation dans laquelle elle a été placée. Le rapport de développement durable de la région de la Côte d'Ivoire (CEDEFOP) a été complété par le rapport de la Commission (Jouneaux et coll. Le programme de référencement de l'UE et de l'UE est en cours de développement.

**Type:** Build
**Languages:** Python (stdlib, model-card + datasheet + system-card generator)
**Prerequisites:** Phase 18 · 18（安全框架），Phase 18 · 24（监管）
**Time:** ~60 分钟

## Objectif de l'apprentissage

- 描述 Mitchell et coll. 2019 原始模型卡 和 Gebru et coll. 2018 feuille de données。
- 描述 Data Cards 的 répartition télescopique/périscopique/microscopique
- 描述 System Cards  et leur portée de couverture de bout en bout.
- Il s'agit d'une série de projets qui visent à améliorer la qualité de la vie et à améliorer la qualité de la vie.

##  problématique

Leur objectif est de fournir des informations sur les différents types de données et de la manière dont ils peuvent être utilisés pour les analyses de données et de la gestion de la situation.

## 概念

### Les cartes modèle (Michell et coll. 2019)

章节:
- Détails du modèle.
- Utilisation prévue:
- Facteurs (pour évaluer les facteurs de population ou environnementaux)
- Les mesures
- Données d'évaluation:
- Données de formation
- Analyse quantitative (en fonction des facteurs,
- Les considérations éthiques.
- Attention et recommandations

adoption:Oreamuno et collègues ont constaté que les résultats de l'audit de 2023 des cartes de modèle Hugging Face, seulement 0,3% ont enregistré des critères éthiques.

### Les fiches de données pour les ensembles de données (Gebru et coll. 2018)

类比电子元件 fichier de données.
- Motivation (pourquoi créer ce groupe de données)
- Composition (en)
- Processus de collecte (en anglais)
- Étiquetage (如适用)
- Uses (), pré-utilisation, interdiction d'utilisation, risque de mort
- Distribution
- Maintenance et maintenance

 发表于 CACM 2021──datasheet 是上游文档;model card 依赖数据 Sheet 的准确性──

### Carte de données (Pushkarna et coll., Google 2022)

模块化分层细节──三缩层级:
- **Telescopic。**面向非专家的高层摘要──
- **Periscopic。**面向 ML praticiens de niveau moyen
- **Microscopic。**面向审计员详细特征级文档──

边界对象框架: différents lecteurs tirent différentes informations du même document.

### Carte de système

范围:端到端 AI 系统, incluant le modèle + 安全 + 部署上下文── chapitres comprennent généralement:
- Capacité de sécurité
- Injection rapide 防护。
- Exfiltration des données 检测。
- Restez en accord avec les valeurs humaines déclarées.
- - Je suis en train de vous parler.

Sidhpurwala 2024 和 Meta 系统级透明工作──"Bluprints of Trust" (arXiv:2509.20394) va former la carte système en tant que modèle de carte dans le cadre de la mise en œuvre de la carte.

### Développement des années 2024-2025

- **CardGen (Liu et al. 2024)。**通过LLM自动生成模型卡;报告称在标准化米切尔 2019 字段上, que beaucoup de cartes écrites par l'homme 具有更高客观性──
- **下载相关性 (Liang et al. 2024)。**Les cartes de modèle détaillées sont liées à une augmentation du taux de téléchargement de HF de plus de 29% en raison de la pression de l'adoption actuelle, non seulement en fonction des règles, mais également en fonction du marché.
- **Laminator (Duddu et al. 2024)。**通过硬件 TEE / 加密签名实现可验证证明允许模型卡 携带索赔的证明,而不是只是索赔本身
- **Sustainability (Jouneaux et al. July 2025)。**增加碳、水和计算能耗足迹; 新兴 ISO 标准──
- **Regulatory cards。**Loi sur l'IA de l'UE (leçon 24)Code de pratique de l'IPGAP Transparence 章节要求模型卡

### C'est dans la phase 18 .

Les leçons 24-25 sont la surveillance et la CVE. Les leçons 26 sont les documents. Les leçons 27 sont la formation en gestion des données.


```figure
an-card-scopes
```

## Utilisez-le

`code/main.py`Pour un déploiement de jouets, une carte modèle minimale, une feuille de données et une carte système sont générées. Chacun suit la structure du chapitre de la règle.

## Je le livre.

本课产 出 `outputs/skill-card-audit.md` déterminer un modèle de carte ‧ feuille de données ou carte système, elle comprendra le chapitre de l'audit ‧ groupe de valeurs, ainsi que l'existence de preuves vérifiables ‧

## 练习

1. 运行  référencement`code/main.py`◊ Check generated cards──识别薄弱章节((仅占位符),并说明什么证据可以加强它们──

2. 扩展模型卡,加入跨两个人口统计群体的量化分组分析 (Leçon 20)

3. 阅读Oreamuno et coll. 2023 关于 0.3% 采用率的内容── propose une modification structurelle des règles relatives aux modèles de cartes 规范, afin d'améliorer les taux d'adoption des considérations éthiques──

4. Laminator (Duddu et coll. 2024) Utilise des TEE pour effectuer des vérifications ⋅ concevoir un modèle de carte ⋅ pour supporter des vérifications de résultat d'évaluation, et décrire le rôle du vérificateur ⋅

5. Pour vous, un projet ou une simulation de déploiement rédigez une carte système, pas une carte modèle.

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Model Card | "the Mitchell card" | Mitchell et al. 2019 针对 ML models 的标准文档 |
| Datasheet | "the Gebru datasheet" | Gebru et al. 2018 针对数据集的标准文档 |
| Data Card | "the Pushkarna card" | Google 2022 模块化分层数据文档 |
| System Card | "the deployment card" | 包括安全栈在内的端到端 AI 系统文档 |
| Boundary object | "different readers, one doc" | Data Cards 框架：同一文档服务不同受众 |
| Verifiable attestation | "the Laminator attestation" | 附加到文档 claim 上的加密或 TEE 证明 |
| Sustainability field | "carbon / water footprint" | 2025 年出现的环境核算补充项 |

## 延伸阅读

- [Mitchell et al. — Model Cards for Model Reporting (arXiv:1810.03993, FAT* 2019)](https://arxiv.org/abs/1810.03993) 规范 carte modèle
- [Gebru et al. — Datasheets for Datasets (CACM 2021, arXiv:1803.09010)](https://arxiv.org/abs/1803.09010) feuille de données 论文
- [Pushkarna et al. — Data Cards (Google 2022)](https://arxiv.org/abs/2204.01075) Équelles sont les données
- [Sidhpurwala et al. — Blueprints of Trust (arXiv:2509.20394)](https://arxiv.org/abs/2509.20394) Carte système  formalité
