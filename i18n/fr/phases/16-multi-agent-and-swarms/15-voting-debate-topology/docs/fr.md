# Le vote, l'auto-cohérence et la topologie du débat

> L'agrégation la plus rentable: la prise de contrôle par N 个独立代理, puis la majorité vote──Wang et al. 2022 ⋅ l'auto-cohérence de Wang et al.**heterogeneous**Les agents  élargir, pour échapper à la monoculture, différents modèles, différentes indications, différentes températures, différents contextes  en plus du vote majoritaire, la topologie du débat est également très importante:MultiAgentBench ((arXiv:2503.01935, ACL 2025) a évalué la coordination étoile / chaîne / arbre / graphique, découvert**graph 最适合 research**, et plus de 4 agents ▌ont ensuite émergé  Taxe de coordination──AgentVerse  ICLR 2024) ont enregistré deux types de modèles émergents, comportements volontaires et comportements de conformité, tandis que la conformité ▌est une caractéristique  trouver un consensus), est également un risque  groupe de pensée,Létion 24)──本课会绘画拓拓空间, construire chaque variante,并测量协调税──

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Phase 16 · 07 (Société de l'esprit et du débat), phase 16 · 14 (Consensus et BFT)
**Time:** ~75 minutes

##  problématique
Le débat peut augmenter la précision du débat, et dépend de quatre choix structurels:

1. 谁和谁对话 (topologie)
2. De 2023: ronds et agents sont chacun indépendamment important)
3. Les agents sont-ils hétérogènes ?
4. Oui, il y a une voix opposée.

En général, les défaites ne sont pas des cas: elles suivent la topologie et l'hétérogénéité.

## 概念
### Autosatisfaction, modèle de base unique

Wang et coll. 2022(L'auto-cohérence améliore la chaîne de raisonnement de la pensée) à température > 0 时对同一个模型采样 N 次,并对理性-path答案做做多数投票;;GSM8K 上的结果是:N=40 échantillons 相比单个贪解码 有显著提升;;L'auto-cohérence 是多代理投票的单代理 前身──

限制:auto-cohérence Utilisez un modèle de base. Les erreurs dans la structure sont correlatives.

### Le vote par plusieurs agents,l'extension hétérogène

Utilisation de différents agents 替代 N 个样本──不同基模型──Claude、GPT、Llama)、不同提示──不同工具访问──收益:不相关错误──成本:不同 agents 的成本不同;协调它们会增加的总费──

Débat hétérogène en 2026**A-HMAD**Le débat hétérogène multi-agents adverse, ce nom n'est pas encore largement adopté, mais les travaux l'utilisent pour débattre de différents modèles, ce qui réduit les erreurs corrélatives de l'effondrement de la monoculture.

### 4 types de topologies

```
star                chain               tree                graph

    ┌─A─┐           A─B─C─D         ┌──A──┐              A───B
    │   │                           │     │              │ × │
    B   C                           B     C              D───C
    │   │                          / \   / \
    D   E                         D   E F   G           (fully connected)
```

Star: un centre, tous les autres agents, et le centre pour les discussions.
Chaîne: structure de la chaîne, chaque agent  voir précédent un agent   ∞
Arbre: structure de niveau, par des systèmes d'agents hiérarchiques
Graphique:tout à tout.

### Taxe de coordination (MultiAgentBench)

MultiAgentBench ((MARBLE, ACL 2025, arXiv:2503.01935) dans une suite de tâches contenant la recherche, le codage et la planification, en référence à la star, la chaîne, l'arbre, le graphique, les résultats mesurés:

- **Graph**La topologie dans les tâches de recherche 上获胜──信息任何流动; les agents peuvent se critiquer mutuellement──
- **Star**Dans les tâches factuelles de réponse rapide, il faut gagner.
- **Chain**Dans les pipelines étape par étape,
- **Coordination tax**Dans la topologie du graphique, plus de 4 agents apparaissent.

Le plafond de 4 agents est empirique, pas fondamental. Il reflète la capacité de contexte de LLM de 2026: le contexte de chaque agent est rempli par les résultats de ses pairs; une fois que tout le monde peut voir tout le monde, la valeur marginale de l'agent N+1 est ajoutée et va baisser.

### Les stratégies de débat multi-agents... Devons-nous devenir fous ?

ArXiv:2311.17371 est une enquête sur les stratégies MAD de 2023 ⋅ Révélation de la clé: avec l'autodiscipline  Structure similaire à des variantes MAD ⋅ échantillonnage indépendant + aggregation), dans le même budget ⋅ généralement pas comme l'autodiscipline ⋅ seulement lorsque les agents sont vraiment hétérogènes, et le débat ⋅ ont une structure adversaire ⋅ un agent ⋅ Révélation ⋅

### Les modèles émergents

L'agent versé dans l'ICLR 2024,https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf）记录了Deux comportements apparaissent même sans conception manifeste:

- **Volunteer。**Il est utile de savoir que le travail est attribué à un agent qui est le mieux adapté à une sous-tâche.
- **Conformity。**L'agent régule sa position pour s'adapter au critique, même si le critique est faux.

Conformité explique pourquoi le débat jusqu'à l'accord Récompenser les harceleurs.

### L'hétérogénéité: une véritable impulsion de la précision

Un modèle dans la littérature pratique 2024-2026: remplacer un des N 个 agents par un modèle de base différent, améliorer la précision généralement plus grand que remplacer N 增加 1―直觉是单文化, chaque nouvelle source d'erreur indépendante fournit plus d'échantillons corrélés que d'autres.

Dans les cas extrêmes, l'hétérogénéité surpasse la multiplicité. Dans la plupart des cas, trois modèles différents surpassent cinq copies d'un modèle.

### Méthodes du jury

Le cadre Sibyl (en littérature Minsky-LLM citée) forme un jury, un groupe d'agents spécialisés, à chaque étape, en votant pour affiner les réponses.

### Lorsque le vote avec débat domine

- 问题有基础真相 (facts,math,code behavior) ⋅ La convergence des votes est significative ⋅
- Les agents peuvent accéder à différentes sources ou outils (hétérogénéité disponible)
- Les tours ont une limite maximale (généralement 2-3), et il y a un juge ou un vérificateur indépendant.
- Le budget permet de travailler avec 3 à 5 agents.

### Quand le vote avec le débat fait mal

- 问题呈意见形――Agent会收到看起来最自信的答案,而不是最正确的答案――
- Tous les agents partagent un modèle de base.
- Les tours sont sans limite. Conformité, chaque fois.
- 任务很简单―― utiliser un seul agent de l'auto-consistance N=5 更便宜, précision 也差不多――


```figure
sw-debate-topology
```

## - Je le construis.
`code/main.py`实现:

- `run_star(agents, hub, question)` centre 轮询 chaque travailleur et agrégat
- `run_chain(agents, question)` raffinement séquentiel。
- `run_tree(root, children, question)` structure hiérarchique de l'agrégation profondeur-2
- `run_graph(agents, question, rounds)` débat général, ronde limitée 
- Un dial d'hétérogénéité de scénario: chaque agent a un`error_bias`, indique son erreur systématique.
- Une corde de mesure, dans N=3、5、7 下运行每种拓类,并报告(精度、total_tokens、wallclock_simulated)

运行:

```
python3 code/main.py
```

预期输出:一张 topologie × N →( précision、tokens、latence) 表──Graphe 在 N=3-5 型研究任务 上获胜;star 在快事实任务 上获胜;N=7 的图表 显示协调税(latence 膨胀速度快于精度) ⋅

## Utilisez-le
`outputs/skill-topology-picker.md`Il est une compétence, il est une description de tâche, il propose une topologie, une étoile / chaîne / arbre / graphique, un profil d'hétérogénéité, une ligne de bord ronde.

## Je le livre.
Pour tout ensemble:

- De l'utilisation d'un modèle de base fort **self-consistency at N=5**C'est une base de départ.
- Si la précision est importante, la mise à niveau est nécessaire.**heterogeneous voting at N=3**◊ Mesure du delta
-  seulement lorsque les tâches ont une structure  recherche  plusieurs étapes  et des tours limités **debate topology**Il y a une autre.
- Quand la minorité est en train de continuer, vous avez un signal de diversité.
- Dans le même temps, la précision est une décision commerciale.

## 练习
1. 运行  référencement`code/main.py` La courbe de coordination-taxe de la topologie du graphe: précision vs N ̊tokens vs N ̊曲线在什么 N 处曲线?
2. 实现 A-HMAD: trois agents de biais différents.  Dans l'attaque de la monoculture de la leçon 14, la base de tous les biais est la même par rapport à A-HMAD.
3. 给图表topology 添加一个判断作用, elle ne vote pas, elle ne vote que sur le consensus final 打分―― cela va changer le comportement de conformité émergent 吗?
4. 阅读 AgentVerse paper(ICLR 2024) ――识别你的实现最强烈展现的是哪种新兴行为──你能通过快速变化 引出相反的行为 吗?
5. 阅读 MultiAgentBench(arXiv:2503.01935) Section 4(expériences de topologie)。Uz your harness 在论文中的一个任务上复现图表-wins-research结果──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Self-consistency | “Sample N times, vote” | Wang 2022。Single model，N 个 temperature>0 samples，对 reasoning paths 做 majority vote。 |
| Heterogeneity | “Different models” | 由不同 base models 或 prompt families 组成的 ensemble。打破 monoculture。 |
| MAD | “Multi-agent debate” | agents 在多个 rounds 中交换 critiques 的通用术语。见 Du 2023。 |
| A-HMAD | “Adversarial Heterogeneous MAD” | 强调不同 models + adversarial structure 的 MAD variant。 |
| Topology | “Who talks to whom” | Star、chain、tree、graph。决定 information flow。 |
| Coordination tax | “Diminishing returns” | 在 graph 上超过约 4 个 agents 后，cost 增长快于 quality。 |
| Volunteer behavior | “Unprompted help” | AgentVerse emergent pattern：agent 主动提出承担一个 step。 |
| Conformity behavior | “Agreement under pressure” | AgentVerse emergent pattern：agent 与 critic 对齐。 |
| Jury | “Small specialized panel” | 带 roles（examiner、context、scorer）的 Sibyl-style ensemble。 |

## 延伸阅读
- [Wang et al. — Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171) L'indice de base pour un modèle unique
- [Du et al. — Improving Factuality and Reasoning via Multiagent Debate](https://arxiv.org/abs/2305.14325) agents et tours sont indépendants
- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) référence de topologie, afficher le graphique, la chaîne  adapté aux pipelines
- [Should we be going MAD?](https://arxiv.org/abs/2311.17371) Enquête de stratégie de MAD; constatation de budget égal
- [AgentVerse (ICLR 2024)](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) Volontaires et modèles de conformité émergents
- [MARBLE repo](https://github.com/ulab-uiuc/MARBLE) mise en œuvre des indices de référence
