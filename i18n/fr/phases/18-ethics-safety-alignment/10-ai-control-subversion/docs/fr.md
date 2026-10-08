# Contrôle de l'IA  en situation de revers

> Greenblatt, Shlegeris, Sachan, Roger (Redwood Research, arXiv:2312.06942, ICML 2024): Contrôle 重新定义了安全问题:给定一个不可信强模型 U, it might be optimised in a counterpoint way against you, quels protocoles peuvent vous permettre d'extraire du travail utile en même temps que la probabilité de résultats inacceptables limités? Les ressources disponibles comprennent un modèle T crédible, un budget de main-d'œuvre humain fiable H, ainsi que la capacité de modifier U 输出. Dans ce cadre, dans les tâches de code-backdoor 任务, l'édition de confiance dans le Pareto sens de la surveillance non fiable. Ce cadre hérite de la pire hypothèse dans le domaine de la sécurité: la nature est la probabilité de mesurer la pression de l'équipe rouge sous la pression de l'équipe rouge, une pression de l'équipe rouge représente une pression de sécurité par laquelle l'équipe U ne peut pas obtenir de résultats concrets; dans ce cadre, la pression de l'équipe rouge U ⋅ est inacceptable.

**Type:** 学习
**Languages:** Python (stdlib，code-backdoor 任务上的 safety-vs-usefulness frontier)
**前置要求：**Phase 18 · 07 (agent de sommeil), phase 18 · 08 (planification), phase 18 · 09 (faux d'alignement)
**Time:** ~75 分钟

## Objectif de l'apprentissage

- 定义 AI Control 威胁模型:不可信强模型 U、可信弱模型 T、可信人类预算 H。
-  description de la modification de confiance  protocole, ainsi que pourquoi il est dans ICML 2024 code-backdoor  tâche sur Pareto-domine la surveillance non fiable ⋅
- 解释: L'alignement entre le contrôle et le respect des droits humains
- Il y a trois limites du contrôle: l'homme ne peut pas se développer, le modèle faible de la crédibilité finira par tomber en panne, le contrôle ne produira pas de modèle fort digne de confiance.

##  problématique

Le problème de sécurité est réécrit comme: " Pouvons-nous tirer du travail utile d'un modèle de méfiance sans lui donner l'occasion de produire des résultats inacceptables ? "

## 概念

### 威胁模型

Contrôle 假设:
- Il est possible que vous ayez une capacité à être résistant à la violence sexuelle.
- T  可信弱模型──能力较弱,但已知不是对抗性──
- H  可信人类劳动──预算很小;无法扩展──

Le système doit utiliser U pour produire des résultats utiles. Les utilisateurs tentent de produire des résultats concrets inacceptables (par exemple, la publication de code dans la porte arrière), tout en maintenant une certaine proportion de travail utile légitime, afin de gagner en utilité.

Le contrôle  abandonne la confiance U. Il se pose la question: en cas de méfiance U, quels accords peuvent maintenir la sécurité ?

### ICML 2024 porte arrière 任务

Les prompts sont des questions de programmation de niveau de compétition. U génère une solution de candidature. Un oracle caché sera marqué pour le cas de la solution contenant une porte arrière. Une entrée spécifique permettra au code de produire une sortie erronée. Red team contrôle U et permet de voir tous les détails de l'intérieur du protocole.

### Comparatif de quatre accords

- **Baseline:**直接发布 U 的输出──Utilité সর্বোত্তম──Sécurité 最低──
- **Upfront auditing:**Pour tous les produits et services, la sécurité est la plus élevée.
- **Untrusted Monitoring:**Le deuxième exemple de U donne la sortie du premier exemple; H 审计被标记的输出――风险:两个 U 实例可能串通――
- **Trusted Editing:**T ∈ ∈ ∈ ∈ ∈ ∈ ∈ ∈ ∈ ∈ ∈ ∈ ∈ ∈ ∈ 

Greenblatt et al. 发现 Trusted Editing Pareto-domine le Moniteur non fiable: dans chaque sécurité 水平上有更高有用性──

### Pourquoi la rédaction de confiance gagne

Le deuxième exemple de la surveillance non fiable  Require U ne peut pas se coordonner avec le premier exemple 串通可能通过steganographic cues或共享训练先例 发生──协议必须投入预算到勾结-resistance (paraphrasing、obfuscation), ce qui réduira le signal du moniteur──Trouble Editing 完全是避免串通,因为T可信的:按假设,T 提出的任何编辑都不是对抗性的──代价是T 能力较弱,因此它可能过度拒绝,或错过微妙的后门──

### Quatre accords

1. Vous jouez un rôle: seul producteur, moniteur, ou les deux sont...
2. T 扮演什么角色: éditeur, moniteur ou échantillonneur
3. H 如何分配:audit uniforme,audit aléatoire ou audit dirigé par le pavillon.
4. - Le rapport de résistance à la collusion

### L'alignement par rapport au contrôle

- L'alignement: U est-il sûr de pouvoir faire confiance? 第 2、4、5、6、7、8、9 课都与此相关──
- Contrôle:  我们能否在不信任的情况下安全使用 U?

L'alignement est l'attribut du modèle. Le contrôle est l'attribut du protocole de déploiement. Le contrôle ne produit pas de modèles alignés. Il se produit par l'utilisation sûre de modèles qui ne sont pas en phase avec le modèle.

### Trois limites fondamentales

- Les ressources humaines sont insuffisantes.
- Le signal de modification de T deviendra un bruit.
- Le contrôle n'est pas une alignement. Le contrôle peut échouer dans l'ASL-3.

### Progresses de l'année 2025

Le Royaume-Uni AISI 和 Redwood 合作研究 Control Safety Cases (metr.org / redwoodresearch.org 2025): le cas de sécurité de contrôle 论证 est, selon la meilleure hypothèse de la situation de l'UE, que cet accord limite la probabilité de résultat inacceptable.

### Il est en phase 18 .

Leur rôle est de faire preuve de confiance et de confiance en eux.


```figure
al-control-protocol
```

## Utilisez-le

`code/main.py`Dans un jeu de porte arrière 任务上模拟四种协议──U 生成输出; dont une partie avec une porte arrière(équipe rouge politique)──T 批准或编辑──H 在预算内被调用──H 在预算内被调用──你可以扫描预算和勾结 参数,以复现Greenblatt et al. 2024

## Je le livre.

本课生成 `outputs/skill-control-protocol-audit.md` Donner une description du protocole de déploiement, il reconnaîtra les rôles U / T / H, nommera des vecteurs de collusion, et estimera que le protocole se situe à la frontière de l'utilité-sécurité en bas de la pression de l'équipe rouge.

## 练习

1. 运行  référencement`code/main.py` Réalisation de la confidentialité et de l'utilité de la surveillance non fiable  Identification de la collusion de la surveillance non fiable 假设变得关键的预算区间

2. Ajouter un nouveau protocole:T avec un échantillon à basse température, puis U 编辑 T 的输出──衡量它在边界上的位置──为什么它比 Trusted Editing 失败更灾难性?

3. 2024 论文假设 U can see agreement. 设计一个协议对 U 隐藏哪些输出正在审计中. 协议对部署基础设施有什么要求?

4. 阅读 Greenblatt et coll. 2024 Section 7(collusion) ⋅ proposer une mesure de résistance à la collusion,并解释它的预期的有用性 成本──

5. Pour une utilisation U = GPT-4-classe T = GPT-3.5-classe H = 审计 1% 输出部署, clairement exprimer un cas de sécurité de contrôle.

## 关键术语

| Term | 人们通常怎么说 | 它实际上的含义 |
|------|-----------------|------------------------|
| AI Control | “safety under subversion” | 在最坏情况 U 下限制不可接受结果的协议设计 |
| Untrusted model (U) | “强模型” | 我们想从中提取工作、但并不信任的有能力模型 |
| Trusted model (T) | “弱模型” | 一个较弱、已知不是对抗性的模型，用作 editor/monitor |
| Trusted human (H) | “审计预算” | 有界的专家劳动；昂贵；ground-truth 信号 |
| Trusted Editing | “T edits U” | T 作为 U 输出 gate 的协议；H 被用于模糊输出 |
| Untrusted Monitoring | “U monitors U” | 第二个 U 实例给输出打分的协议；只有额外投入后才具备 collusion-resistance |
| Control safety case | “正式论证” | 书面论证：一个协议在最坏情况 U 下限制对手成功率 |

## 延伸阅读

- [Greenblatt, Shlegeris, Sachan, Roger — AI Control (arXiv:2312.06942)](https://arxiv.org/abs/2312.06942) 经典 ICML 2024 论文
- [Redwood Research — Recent AI Control papers index](https://redwoodresearch.substack.com/) 2024-2025 后续研究
- [UK AISI + METR — Control safety cases](https://metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies/) 面向边境实验室的运营化
- [Hubinger et al. — Sleeper Agents (Lesson 7, arXiv:2401.05566)](https://arxiv.org/abs/2401.05566) contrôle et la présomption de la menace
