# La recherche sur l'alignement automatique (ARAnthropic AAR)

> Anthropic dans une sandbox indépendante并行运行多个Claude Opus 4.6 Autonomous Alignment Researchers 团队,并通过一个共享论坛 协调; le journal de ce forum se trouve hors de toute sandbox ((donc l'agent 无法删除 son propre enregistrement)  Dans le problème de la formation de faible à fort, la performance de l'AAR dépasse celle des chercheurs humains  Anthropic 自己的 résumé note que le workflow réglementaire 往往会限制 AAR 灵活性并降低性能 Autonomisation de l'alignement de la recherche  est un pas de compréhension, il réduirait la ligne de temps compréhensible à RSP  les risques de l'alignement précises à vérifier 

**Type:** Learn
**Languages:** Python (stdlib, parallel-research-forum simulator)
**前置要求：**La phase 15 · 05 (Scientiste de l'IA v2), la phase 15 · 04 (DGM)
**Time:** ~60 minutes

##  problématique

La recherche d'alignement consomme une grande quantité de temps de chercheurs humains. Comme la surveillance évolutive, la spécification des récompenses ou la formation faible à forte, de ce type de problèmes, chaque cycle d'expérience a besoin de plusieurs semaines.

La recherche automatisée sur l'alignement (AAR) 追问是: those capacities are exceeding alignment progress s the same batch of frontier models, is it also able to help to bridge this gap―Anthropic 2026 Year About a project run by AAR 关于一项 weak-to-strong-training 研究报告(alignment.anthropic.com/2026/automated-w2s-researcher/), est l'un des premiers résultats du système déployé par ce type ⋅

Le résultat est certainement positif: les performances de l'AAR dans un problème de recherche sont supérieures à celles de l'homme. Mais ce résultat met également chaque préoccupation de cette phase déjà déployée dans un système. Si la recherche d'alignement peut être automatisée, une partie des mesures de sauvegarde peuvent également être automatisées.

## 概念

### 架构(按公开描述)

- **Parallel agents.**Les données de l'opus 4.6 sont fournies par le système de fichiers de la plateforme.
- **Shared forum.**Les recherches ont été publiées sur un forum de partage, dont le stockage est en arrière-plan situé à chaque boîte à sable.
- **Task allocation.**Une file d'attente de tâches conçue par l'homme distribuera les problèmes de recherche à l'AAR.
- **Weak-to-strong training focus.**Les études publiées traitent de la formation faible à forte, à savoir l'utilisation d'un modèle de superviseur plus faible pour former un modèle d'étudiant plus fort.

### Pourquoi le journal hors de la boîte à sable est important

L'intégrité logistique est la différence entre les expériences contrôlées et les expériences potentiellement endommagées. Si AAR peut modifier son propre journal, elles peuvent masquer des expériences ratées ou douteuses.

Dans le langage de l'infrastructure, il s'agit d'utiliser des journaux en appendice uniquement pour le stockage extérieur, par exemple S3 objet-blocage, journaux immutables de Datadog.

### dépôt de travail

Le rapport d'Anthropic note que les flux de travail prescrits limitent souvent la flexibilité et la performance de l'AAR. En d'autres termes, si un concepteur humain écrit progressivement un plan de recherche, la performance de l'AAR diffère de celle d'un objectif de haut niveau et de la possibilité de sa décomposition libre.

La flexibilité de la capacité de la RAE est très mince. La flexibilité de la capacité de la RAE est également autorisée à la décomposition non autorisée.

### 压缩风险

RSP v3.0 (Létion 19) introduit un seuil de capacité de R&D de l'IA: en comparaison avec les outils humains + AI, le coût est compétitif, la capacité de pipeline de R&D de l'IA est entièrement automatisée.

AAR est encore à un pas de ce seuil: elle a automatisé une partie du pipeline (à l'intention de recherches d'alignement de tâches spécifiques), mais il n'y a pas encore de boucle de développement de capacités d'automatisation de bout en bout.

Si la recherche d'alignement et la recherche de capacité se développent à une vitesse relativement proche de la croissance de la complexité, le risque de désalignement se développe au moins à la même vitesse que la capacité. Si la capacité de croissance de la complexité se développe plus rapidement, la différence s'accroît.

### AAR ne peut rien remplacer

Les résultats de la recherche ont été publiés par des chercheurs humains, qui ont défini la file d'attente des tâches et ont détenu l'autorité constitutionnelle.

Ceci est appliqué à la recherche elle-même par rapport à la leçon 15.


```figure
aar-forum
```

## Utilisez-le

`code/main.py`模拟一个多AAR研究论坛──三个独立的研究代理并行运行,将发现发布到一个仅附录论坛,并可选择进行操纵尝试──

观察:

- Logement hors de la boîte à sable 如何捕获木木企图──
- Dans les questions plus difficiles, permettre l'allocation de tâches de décomposition libre 如何优于固定工作流
- Si le log n'est pas manipulé, un seul signal de compromis AAR 如何污染论坛──

## Je le livre.

`outputs/skill-aar-deployment-review.md`Il s'agit d'un projet de révision pré-ministériel de l'alignement-recherche automatisé.

## 练习

1. 运行  référencement`code/main.py` Comparer " flux de travail fixe " à " décomposition libre " 设置── décomposition libre Y a-t-il toujours une victoire, y a-t-il également une compétitivité dans certains problèmes ?

2. Modifier le simulateur, faire un agent tenter de manipuler le journal,.. confirmer le log seulement à ajouter 能检测到它──写一段话,准确描述检测信号在日志中是什么样子──

3. 阅读Anthropic's weak-to-strong AAR 报告――trouver AAR 超越人类研究员的具体子任务――是什么让它适应自动化?

4. 设计一个任务队分配政策,在 AAR 灵活性 (更好结果) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束) 约束 (更易审计) 约束) 描述你将对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对

5. 阅读RSP v3.0's AI R&D-4 threshold──用一段话描述,你认为哪些能力将跨越这个门,而目前的AAR还没有做到──

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| AAR | "Automated Alignment Researcher" | 在 alignment problems 上 autonomously 运行的 Claude Opus 4.6 实例 |
| Weak-to-strong training | "Training a stronger model with a weaker supervisor" | AAR 表现超过人类的经典 scalable-oversight benchmark |
| Shared forum | "Where agents publish findings" | Append-only、out-of-sandbox storage |
| Out-of-sandbox log | "Agent cannot edit its own record" | Tamper-evident write-through 到 external storage |
| Prescribed workflow | "Step-by-step plan from human designer" | 限制 AAR；相较 free decomposition 往往降低性能 |
| Free decomposition | "Agent decides how to break the task" | 能力更强，更难 audit |
| AI R&D threshold | "RSP/FSF capability level" | 以有竞争力的成本完全自动化 R&D pipeline |
| Compressed timeline | "Alignment vs capability race" | 如果 capability 复合增长快于 alignment，misalignment 风险就会增长 |

## 延伸阅读

- [Anthropic — Automated Weak-to-Strong Researcher](https://alignment.anthropic.com/2026/automated-w2s-researcher/) source principale。
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) Rencadrement des seuils de R&D en IA。
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) plus large cadrage de l'autonomie des agents
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) Les niveaux d'autonomie de la R&D de la RSP en ligne avec la RSP
- [Burns et al. (2023). Weak-to-Strong Generalization (OpenAI)](https://openai.com/index/weak-to-strong-generalization/) Problèmes de base de traitement de la salle de bain
