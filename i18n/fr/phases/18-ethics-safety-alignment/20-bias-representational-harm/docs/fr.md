# Les préjugés et les préjudices manifestants dans les LLM

> Gallegos, Rossi, Barrow, Tanjim, Kim, Dernoncourt, Yu, Zhang, Ahmed (Linguistique computative 2024, arXiv:2309.00770)。2024 année de base, va faire état de blessures sexuelles 刻板印象、抹除) et de blessures répartisées 资源分配不平等) (PNAS Nexus, mars 2025) Dans une évaluation automatique de 20 niveaux d'entrée en classe, mesurer GPT-3.5 Turbo、GPT-4o、Gemini 1.5 Flash、Claude 3.5 Sonnet、Llama 3-70B 上的交叉性性别 x race 偏见──WinoIdentity (COLM 2025, arXiv:2508.07111) a introduit une évaluation équitable de l'identité du sexe basée sur l'incertitude──Yu & Ananiadou 2025 识别 MLP 层中的 généros neurones;Ahsan & Wallace 2025  Using SAEs 揭露临床场中的种族偏见;Zhou et al. 2024 (UniBias) 通过操纵注意头 进行去偏──元批判 (arXiv:2508.11067): 10 年文献过度聚焦于二元性别偏见──

**类型：**Construction
**语言：**Python (stdlib, sonde de biais basée sur l'intégration de jouets)
**先修要求：**Phase 05 (embedding de mots), phase 18 · 01 (instruction suivante)
**时间：**- 60 minutes

## Objectif de l'apprentissage

- ☐ définir les préjudices et les préjudices de distribution, et donner chacun un exemple dans le cadre de la déploiement du MLL:
- Il a été démontré que les trois catégories d'indicateurs d'évaluation de Gallegos et coll.
- Décrire la croisée et pourquoi la mesure de l'équité basée sur l'incertitude de la WinoIdentity a comblé le manque d'évaluation du biais de l'axe unique.
- 描述两种偏见的机制可解释性方法:

##  problématique

Le cours précédent couvrait les préjugés intentionnels (prison break, scheming) et la gestion de la sécurité. Les préjugés sont des préjugés qui surviennent involontairement, qui peuvent être l'origine d'une méthode de formation de la distribution de données, ou d'un choix de conception cumulé.

## 概念

### Expression sexuelle contre division sexuelle

- **表征性伤害。**Une infirmière est représentée comme une LLM entièrement féminine, produisant des blessures manifestes.
- **分配性伤害。**Les résultats de la recherche de la formation en droit sont les résultats de l'égalité de la nature.

Deuxièmement, il n'est pas le même. Un modèle peut exprimer une image sans partialité, produire une représentation multiculturelle, tout en donnant une partition différente.

### 3 catégorie d'indicateurs d'évaluation (Gallegos et coll. 2024)

- **基于 Embedding。**Dans les embellissements pré-RLHF, il est possible de faire des tests WEAT 风格测试.
- **基于概率。**刻板印象确认型补全与刻板印象违反型补全的日志-probabilité──Decoder 侧测量──能捕捉部分行为偏见──
- **基于生成文本。**Dans le texte généré, effectuer des mesures de tâches.

### 交叉性

En ce qui concerne les femmes, il est difficile de comprendre que les femmes noires et les hommes noirs sont punis plus que les femmes blanches.

WinoIdentity (COLM 2025) introduit l'équité de croisement basée sur l'incertitude. Il mesure le modèle de différence de résultats sur différents groupes d'identités de croisement, et non seulement de mesure de points de prédiction. Il peut capturer certaines situations: le modèle est également erroné pour chaque groupe, mais il est plus incertain pour certains groupes, ce qui entraîne un comportement de distribution différent.

### 机制方法

Les travaux explicatifs de 2024 à 2025 permettent de permettre aux préjugés d'être acceptés au niveau du mécanisme:

- **Gender neurons (Yu & Ananiadou 2025)。** Les neurones spécifiques de la PMP associés à des comportements sexistes différents  Les neurones peuvent réduire l'écart entre les sexes à un coût limité de capacité 
- **通过 SAEs 识别临床种族偏见 (Ahsan & Wallace 2025)。**Les caractéristiques de l'autoencodeur Sparse vont représenter l'intérieur de la décomposition en dimensions expliquables; peuvent identifier et inhiber les caractéristiques liées à la race.
- **UniBias (Zhou et al. 2024)。**Utilisation de la manipulation de la tête d'attention à tir zéro. Les têtes spécifiques augmenteront la sensibilité de la classe d'identité.

### Réponse

Cette étude a été menée par le groupe de recherche de l'étude de la recherche sur les préjugés de genre dans le domaine de l'hypnose et de la psychologie.

### C'est dans la phase 18 .

Les leçons 20-21 Formellement couvrir les préjugés et l'équité. Leçon 22 couvrir la vie privée. Leçon 23 couvrir le marquage d'eau.


```figure
an-bias-two-harms
```

## Utilisez-le

`code/main.py`Construire une sonde de biais basée sur l'intégration de jouets: dans le simple commun de l'intégration, mesurez la distance entre les mots identité et les mots attributes. Vous pouvez injecter un indice de biais et observer.

## Je le livre.

本课产 出 `outputs/skill-bias-eval.md` une carte modèle ou une déclaration équitable, qui sera basée sur trois catégories d'indicateurs:

## 练习

1. 运行  référencement`code/main.py`◊ Rapport sur les préjugés                                                                                                                                                                                                                                                           

2. Avec une enquête de généralisation, de race, de carrière, de famille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille, de taille

3. 阅读 An et al. 2025 (PNAS Nexus) : trouver les deux effets intermédiaires de leur rapport, et ces effets seront évalués par un seul axe de genre 漏掉:

4. Yu & Ananiadou 2025 Identifiez les neurones de genre  Concevez une expérience de démonstration de fausse identité, pour distinguer  Ces neurones  conduisent à des préjugés de genre  et  Ces neurones  sont liés 

5. Les critiques ont estimé que le domaine était trop étroit pour se concentrer sur le genre.

## 关键术语

| 术语 | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| 表征性伤害 | “刻板印象 / 抹除” | 对某个群体的有偏描绘 |
| 分配性伤害 | “不平等决策” | 针对某个群体的有偏物质结果 |
| WEAT | “Embedding 测试” | Word Embedding Association Test；基于共现的偏见 probe |
| 交叉性 | “组合身份效应” | 在多个身份轴线交汇处出现的偏见 |
| Gender neurons | “MLP 偏见 neurons” | 激活与性别特异行为相关的特定 neurons |
| SAE feature | “可解释维度” | Sparse-autoencoder 识别出的 feature；可用于机制性偏见分析 |
| UniBias | “attention-head 去偏” | 通过重新加权 attention heads 进行 zero-shot 去偏 |

## 延伸阅读

- [Gallegos et al. — Bias and Fairness in LLMs: A Survey (arXiv:2309.00770, Computational Linguistics 2024)](https://arxiv.org/abs/2309.00770) 经典综述
- [An et al. — Intersectional resume-evaluation bias (PNAS Nexus, March 2025)](https://academic.oup.com/pnasnexus/article/4/3/pgaf089/8111343) 五模型交叉性研究
- [WinoIdentity — 基于不确定性的交叉公平性（arXiv:2508.07111, COLM 2025）](https://arxiv.org/abs/2508.07111) Nouveau indice de référence
- [UniBias — attention-head manipulation (Zhou et al. 2024, ACL)](https://arxiv.org/abs/2405.20612)- Je ne veux pas de toi.
