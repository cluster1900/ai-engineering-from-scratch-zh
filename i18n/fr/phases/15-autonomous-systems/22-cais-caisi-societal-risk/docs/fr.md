# CAIS、CAISI et la taille sociale

> Le Centre pour la sécurité de l'IA (Centre for AI Safety, CAIS, San Francisco, fondé en 2022) a publié quatre types de cadres de risque: utilisation malveillante de l'IA, courses d'IA, organisation de risque, Rogue AI, ainsi que la déclaration de l'extinction de risque de mai 2023, signée par des centaines de professeurs et de dirigeants d'entreprises. Ce document publié en 2026 comprend: Dashboard d'évaluation de l'IA sur le modèle frontalier, Index du travail à distance, évaluation de l'IA avec l'IA à grande échelle, document de stratégie de cyberintelligence, newsletter de Frontiers. Un autre organisme: NIST Center for AI Standards and Innovation (Centrepreneur de l'IA) a été créé en Californie.

**类型：**Apprendre à apprendre
**语言：**Python (stdlib, four classe de mesures de réparation et de réparation)
**先修要求：**La phase 15 · 19(RSP),la phase 15 · 20(PF + FSF)
**时间：**Il est 45 minutes.

##  problématique

Les cours 19 et 20 présentent les politiques d'échelle de l'intérieur du laboratoire. Les cours 21 présentent l'évaluation des capacités indépendantes.

Il y a deux entités différentes qui sont importantes. Le CAIS est une organisation de recherche à but non lucratif, qui a publié un cadre pour réfléchir à la risque d'IA, et coordonne les déclarations publiques. Le CAISI est le centre du gouvernement américain à l'intérieur du NIST, responsable de l'accord volontaire de fonctionnement du laboratoire et de l'évaluation des capacités non impliquées. Ces deux noms sont similaires, mais leur mission ne se chevauchent pas. Les praticiens devraient en même temps les comprendre.

Le cadre de gestion des risques de catastrophe de l'État de Californie est le premier règlement américain de surveillance des risques de catastrophe de l'État. La description de ce projet de loi est importante, car dans la politique technologique américaine, la surveillance des États est souvent préalable à l'action fédérale.

## 概念

### CAIS  Centre de sécurité de l'IA

- 创立时间:2022年, San Francisco, par Dan Hendrycks 及同事创立(Zhang
- 状态:501 ((c) ((3) non-profit organisations
- Résultats importants de l'année 2023: Déclaration sur le risque d'extinction, signée conjointement par des centaines de chercheurs et de PDG. Déclaration écrit:  Réduire le risque d'extinction de l'IA, devrait être une priorité mondiale avec les pandémies et les guerres nucléaires, etc.
- Résultats de l'année 2026: pour le modèle frontalier  évaluation du tableau de bord de l'IA  Index du travail à distance  Joint publication) Œuvre de stratégie de super-intelligence  Bulletin d'information de l'AI Frontiers 

### Quatre catégories de risques

Le cadre de CAIS décrit les risques de catastrophe de l'IA en quatre catégories principales:

1. **恶意使用**: les acteurs mal intentionnés utilisent l'IA pour causer des dommages et intérêts (synthèse d'armes biologiques, désinformation, cyberattaques)
2. **AI races**La concurrence entre les laboratoires, les entreprises ou les pays favorise le déploiement au-delà des frontières de sécurité.
3. **组织风险**Les résultats de la recherche ont été très positifs.
4. **Rogue AIs**La capacité suffisamment forte de l'IA pour poursuivre des objectifs en conflit avec le bien-être humain.

Ce n'est pas la seule loi de classification; mais elle est la plus citée. Les catégories ne sont pas mutuellement exclusives.

###  Organisations existent dans quelles régions

Parmi les quatre catégories, le risque d'organisation est le plus pratique pour les praticiens. La culture de sécurité d'un laboratoire, la rigueur de son audit, la défense des couches et la sécurité de l'information, décident de la mise en ligne de son modèle, de la mise en œuvre réelle des mesures de contrôle de la classe 10 à 18, ou bien ces mesures de contrôle sont simplement des éléments de liste de contrôle non vérifiés.

具体的组织风险杆包括:

- **安全文化**Le groupe a-t-il trouvé un avantage dans la prévision de l'emploi ?
- **严格审计**Les audits internes et externes sont nécessaires.
- **多层防御**Il n'y a pas assez de couches.
- **信息安全**: les poids du modèle  fuite  données évaluables  fuite  surveillance  détournement  fuite technique  RAND SL-4 de la section 19  cours est un critère spécifique 

### CAISI  Centre de Normes et d'innovation en matière d'IA

- Dans le NIST, il y a une opération.
- Avec les laboratoires frontaliers, l'accord est en vigueur.
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- Il est également possible de lire le texte de la page d'accueil de l'éditeur.

Le rôle de CAISI est de fournir des informations publiques et gouvernementales aux METR privées de laboratoires de coopération (§ 21).

### Californie SB-53

Le projet de loi du Sénat de Californie (constitution du Sénat de Californie) de 2025 (constitution du Sénat de Californie) traite les modèles frontaliers de catastrophe de la région.

- 触发州级义务的特定能力值──
- La protection des dénonciateurs des employés du laboratoire d'IA
-  les besoins en matière de déclaration de catastrophe.

Si elle est signée, elle deviendra la première loi américaine sur la surveillance des risques de catastrophe au niveau des États-Unis. Quelle que soit l'état de signature, l'expression de la loi affectera la façon dont les autres parlements des États traiteront le problème.

### Le risque de croissance sociale n'est pas un problème de niveau unique.

La phase 15 du processus de défense en profondeur est également applicable au niveau social. Il n'y a pas de structure ou de cadre unique qui puisse mettre fin à la catastrophe.

- 实验室 édite des politiques d'échelle (第 19、20 课)
- Les résultats de l'évaluation sont:
- Il est également possible de faire une enquête auprès des autorités de l'État.
- Les projets de développement et de développement sont des projets de développement et de développement.
- 实践者构建多层控制 (第 1018 课)

C'est le résumé final de cette phase: chaque cours précédent est une couche d'une seule couche, l'intégrité de l'ensemble est plus importante que la force de toute couche.


```figure
a5-four-risks
```

## Utilisez-le

`code/main.py` mettre en œuvre un petit outil de liste des risques.  Déterminer un projet de déploiement, il sera marqué par le programme en fonction des quatre catégories de risques, et revenir à la liste de contrôle des mesures de réduction.  Il est un outil d'aide à la lecture pour comprendre le cadre, et non un substitut pour le jugement humain.

## Je le livre.

`outputs/skill-societal-risk-review.md`Une déploiement est examiné du point de vue de la situation des risques à l'échelle sociale: il concerne les catégories de risques, les mesures de réduction déjà prises, les risques exposés à l'organisation et les risques.

## 练习

1. 运行  référencement`code/main.py` introduire trois composés de différentes tailles de déploiement.

2. 完整阅读 CAIS 四类风险论文──选择一个风险类别,写两段说明你认为该类别中最重要的是什么──

3. Lisez le projet de loi de la Californie SB-53 présentement publié. Découvrez une disposition que vous pensez renforcer le comportement des risques catastrophiques, ainsi qu'une disposition que vous pensez en diminuer la force.

4.  choisi une production d'IA que vous connaissez  déploiement de votre propre ou de développement public)  selon l'organisation 杆 pour son évaluation: sécurité culture 审计严格程度 多层防防信息安全  Quels sont les coûts les plus faibles ?

5. 勾勒一个反映一年额外能力进步和一年额外外署经验的2028 版四类风险框架――tu vas ajouter, supprimer ou reconditionner quoi?

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|---|---|---|
| CAIS | “Center for AI Safety” | 非营利组织；四类风险框架；2023 年灭绝声明 |
| CAISI | “US government AI safety” | NIST Center；自愿协议；非涉密 evals |
| Four-risk framework | “CAIS 的分类法” | 恶意使用、AI races、组织风险、Rogue AIs |
| Malicious use | “恶意行为者使用 AI” | Bioweapons、disinformation、cyberattacks |
| AI races | “竞争压力” | 实验室/公司/国家推动部署越过安全边界 |
| Organizational risk | “实验室内部失败” | 安全文化、审计、防御、infosec |
| Rogue AI | “Misaligned agent” | 有能力的 AI 追求与人类福祉冲突的目标 |
| California SB-53 | “州级监管” | 2025–2026 年法案；如果签署，将成为 US 第一个州级灾难性风险监管法规 |

## 延伸阅读

- [Center for AI Safety](https://safe.ai/) Quatre catégories de cadres de risque
- [CAIS — AI Risks that Could Lead to Catastrophe](https://safe.ai/ai-risk) 四类风险论文──
- [CAIS — May 2023 statement on extinction risk](https://safe.ai/statement-on-ai-risk) 简短的联合声明。
- [NIST CAISI](https://www.nist.gov/caisi) 面向政府的AI standards and innovation center──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) Connecter les engagements au niveau du laboratoire au cadre social de la dimension sociale.
