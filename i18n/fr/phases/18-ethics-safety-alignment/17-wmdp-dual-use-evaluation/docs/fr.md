# VDMP et évaluation des capacités à double usage

> Li et coll., "Le critère de référence du WMDP: Mesurer et réduire l'utilisation malveillante avec le désapprentissage" (ICML 2024, arXiv:2403.03218)。 couvre la biosécurité (1,520)、cybersecurity (2,225) et la chimie (412) 4.157 choix de méthodes. Le problème se situe dans la "zone jaune"                                                                                                                                                                                                                

**类型：**Apprendre à apprendre
**语言：**Python (stdlib, harnais d'évaluation de levage en forme de WMDP)
**先修要求：**Phase 18 · 16 (outillage de l'équipe rouge), phase 14 (ingénierie par agent)
**时间：**- 60 minutes

## Objectif de l'apprentissage

- Décrire les trois domaines du WMDP, le nombre de problèmes, ainsi que la "zone jaune"
-  Expliquer l'UER et pourquoi le WMDP est à la fois une référence d'évaluation et de désapprentissage
- 描述 2024-2025 的升起 叙事:"轻微升起" -> "处于临界点" -> "不足以排除ASL-3"──
- La différence entre le développement des nouveaux et les compétences absolues des spécialistes.

##  problématique

La question est de savoir si le modèle X a amélioré la capacité de nouveaux utilisateurs dans le domaine de la bio-chimique ou du cyber ? La mesure directe exige que le modèle produit des dommages réels (à la fois contre-la loi et malhonnête). La mesure par procuration nécessite un modèle qui ne peut pas refuser une référence pour produire des numéros de capacité réels), mais la question elle-même ne peut pas devenir une publication nocive.

## 概念

### "zone jaune"

Ces questions exigent des connaissances approximatives et préconisées sur les processus nocifs, mais pas directement sur la composition synthétique. "Quel réactif catalyse [pathée publiée] dans la 4e étape?" au lieu de "Comment fabriquer [compound dangereux]?" Chaque question a été examinée par des experts de plusieurs domaines, et a été examinée par l'ITAR/EAR.

 total de 4 157 questions de la voie:
- Biosecurité: 1 520
- Sécurité informatique: 2 225
- Chimique: 412

Les modèles ne sont pas tenus d'aider à quoi que ce soit; il est donc possible de mesurer la capacité en cas de comportement nuisible.

### RMU  Réprésentation Fausse direction pour désapprentissage

配套的不学习方法──应用于LLaMa-2-7B 后, il réduira le nombre de WMDP à un rythme proche, tout en maintenant MMLU et autres indicateurs de capacité générale 保持 en quelques centaines de points ⋅ la méthode publiée est ensuite la base de base de chaque bio-chimie-cyber-déapprentissage ⋅

### Élever les compétences de la population 2024-2025 叙事

Trois étapes:

1. **2024 "轻微 uplift"。**OpenAI et Anthropic  Early Preparedness/RSP 评估报告称, pour les nouveaux utilisateurs de tâches bio-adjacentes, les modèles ont de petits avantages par rapport à la recherche sur Internet.

2. **2025 年 4 月 "处于临界点"。**Le rapport du Cadre de préparation d'OpenAI v2 déclare que le modèle "est dans une position significative pour aider les nouveaux à créer des points critiques de menaces biologiques connues"[6].

3. **Anthropic 的 2025 生物武器获取试验。**Un rapport comprenant une étude contrôlée de nouveaux participants, mesure le taux de réussite relative des tâches de la phase d'obtention. Le rapport est de 2,53 fois supérieur.

### Par rapport à l' élève

Une différence clé:

- **相对于新手的 uplift。**Le modèle est très utile pour les non-experts. C'est un nombre de fois.
- **专家绝对能力。**Le modèle peut-il produire de l'information en faisant le maximum d'efforts ?

Les deux sont également abordés comme suit: " Le modèle ne peut pas donner aux nouveaux suffisamment de relance pour exécuter " et " les experts ne peuvent pas extraire des informations non publiées du modèle ":

### 测量陷

Le WMDP est un agent de capacité, et non un déploiement de mesure. Un modèle de WMDP à score élevé, dans la pratique, dépend de:
- 引出抗性(不触发安全过器而取出能力有多难)
- 默会知识 (ne nécessite pas de compétences de laboratoire mais de l'information)
- 执行障碍(采购、设备)

L'essai d'acquisition d'armes biologiques d'Anthropic 2025 a été lancé sur la capacité de type WMDP: il mesure le taux de réussite des missions réelles, et non la capacité de choix multijoueurs.

### C'est dans la phase 18 .

Les leçons 12-16 sont sur les outils de défense et d'attaque du modèle. La leçon 17 est sur les capacités à double usage.


```figure
al-wmdp-yellow-zone
```

## Utilisez-le

`code/main.py`Construire une version jouet de la marque de l'évaluation en forme de WMDP. Un modèle de simulation se déroule en fonction des catégories de questions et de la mise à l'essai.

## Je le livre.

本课会生成 `outputs/skill-wmdp-eval.md` une déclaration de capacité à deux utilisations ("Notre modèle ne sera pas significativement utile au comportement lié aux armes biologiques"), elle examine: quels sont les critères de référence mis en œuvre, quelle voie a été rejetée, quelle est utilisée pour évaluer la réalisation brute et quelle est la politique mise en place), ainsi que la question de savoir si la recherche a complété les résultats de plusieurs choix.

## 练习

1. 运行  référencement`code/main.py` Rapport de l'apprentissage des jouets 步骤前后各领域的精度──解释通用能力权衡──

2. Pour jouer WMDP  augmenter le quatrième domaine  par exemple radiologique  spécifier les deux types de zones jaunes  Exemplaires de problèmes  Expliquer pourquoi rédiger ce type de problèmes est plus difficile 

3. 阅读WMDP 2024 Section 5 (RMU methodology) 勾勒一种 méthode de désapprentissage plus simple (par exemple, dans le domaine du contenu qui inhibe les neurones top-k),并描述其预期的通用能力成本──

4. Le rapport de recherche sur les armes biologiques de l'Anthropic 2025 est de 2,53 fois plus élevé.

5. Expliquer les cas de sécurité de l'ASL-3 dans les études de délection du WMDP  en plus de ce qui est nécessaire  nommer au moins deux études de délection complémentaires

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| WMDP | "双用途 benchmark" | yellow zone 中跨 bio/cyber/chem 的 4,157 道 MCQ 问题 |
| Yellow zone | "促成但非合成" | 邻近有害能力的接近性知识，但不是合成配方 |
| RMU | "unlearning baseline" | Representation Misdirection for Unlearning；降低 WMDP 分数，同时保留通用能力 |
| Novice-relative uplift | "它对非专家有多大帮助" | 对新手而言，相比现状 internet search 的乘法优势 |
| Expert-absolute capability | "专家的上限" | 有动机的专家可从模型中提取的最大信息量 |
| Acquisition-phase task | "合成前的步骤" | 采购、设备、许可 —— 危害路径最早期的部分 |
| ITAR/EAR | "出口管制合规" | 约束某些促成性知识发布的法律框架 |

## 延伸阅读

- [Li et al. — The WMDP Benchmark (arXiv:2403.03218, ICML 2024)](https://arxiv.org/abs/2403.03218) référence et RMU 论文
- [OpenAI — Preparedness Framework v2 (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) "处于临界点"
- [Anthropic — Responsible Scaling Policy v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) ASL-3 bio value et résultats d'essai obtenus
- [DeepMind — Frontier Safety Framework v3.0 (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) LCC de bio-élévation
