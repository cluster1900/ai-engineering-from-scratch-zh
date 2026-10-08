# 协商与议价

> Les résultats de la recherche ont été très positifs, et les résultats ont été très positifs. Les résultats de la recherche ont été très positifs, et les résultats ont été très positifs.**OG-Narrator**(Générateur d'offres déterministes + narrateur de LLM) le taux de conversion passera de 26,67% à 88,88%;Concours de négociation autonome à grande échelle (arXiv:2503.06416)  a été mené environ 180 000 fois consulté, trouvé **chain-of-thought-concealing**Les agents 通过向对手隐藏推理而获胜;Bhattacharya et al. 2025  Basé sur le Harvard Negotiation Project 指标进行排名,Llama-3 最有效,Claude-3 进攻性最强,GPT-4 最公平。本课实现 Contract Net Protocol(FIPA的前身,Lesson 02),连接一个LLM 风格的买家/卖家,运行OG-Narrator 风格的分解,并衡量每种结构选择如何变成交率──

**类型：**apprendre + construire
**语言：**Python (stdlib)
**前置要求：**La phase 16 · 02 (FIPA-ACL Heritage), la phase 16 · 09 (Réseaux parallèles de jonction)
**时间：**À environ 75 minutes.

##  problématique

Les deux agents ont besoin d'un accord sur le prix. Si seulement il s'agit d'un rappel purement linguistique, les taux de réussite des LLM en consultation pour les années 2024-2026 sont stupéfiants: ils sont d'environ 27% dans le prix strictement paramétrique de l'arXiv:2402.15813*.

Le problème fondamental réside dans le fait que les LLM ont combiné deux tâches: décider de proposer et raconter de proposer.

Ceci est un schéma classique multi-agent de découverte: le mécanisme de mise en œuvre et de communication.

## 概念

### Un passage pour comprendre le contrat Net

Le protocole de contrat de Smith 1980: un **manager**广播 **call for proposals (cfp)**Le dépôt de la commission**bidders**Uzal contenant son offre **propose**messages 响应;manager 选择获胜者,并向获胜者发送 **accept-proposal**, à celui qui a perdu**reject-proposal**❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖**refuse**(appel d'offres  refus de présenter une proposition)`fipa-contract-net`protocole d'interaction.

### Pourquoi OG-Narrateur va gagner

" Mesurer les capacités de négociation des modèles de langage " (arXiv:2402.15813)  observer:

- Les LLM  souvent perturber les règles de prix  donner une offre à prix absurde, ignorer les ZOPA de l'autre partie)
- L'ancrage de ces derniers est très faible: accepter une première offre mauvaise; contre-offre: utiliser des montants symboliques, et non des montants stratégiques)
-                                                                                                                                                                                                                                                               

Le narrateur de l' OG

```
           ┌──────────────────┐        ┌──────────────────┐
  state  → │ offer generator  │ price → │  LLM narrator    │ → message
           │  (deterministic) │        │  (writes the     │
           │                  │        │   human-style    │
           └──────────────────┘        │   accompaniment) │
                                       └──────────────────┘
```

Le générateur d'offres est un classique modèle de négociation: modèle de négociation de Rubinstein, stratégie de Zeuthen, ou autour du prix simple tit-for-tat,

Le taux de change est en hausse:
- 价格保持在谈判区内──
- Les ancres sont stratégiques, et non émotionnelles.
- LLM faire ce qu'il y a de bon: écrire.

### NégociationArena 发现

Le rapport de référence de la norme a été publié en décembre 2006 par le groupe de recherche de l'Union européenne.

- Les LLM peuvent être utilisées par des personnes. Je suis désespérément prêt à vendre ce produit d'ici vendredi.
- Les agents équitables/ coopératifs seront utilisés contre les agents antidéfense; la défense nécessite une contre-posture manifeste.
- Dans les scénarios de référence de 40% environ, les résultats ont été injustes.

Ce n'est pas que les LLM soient de mauvais consultants, mais que les LLM soient consultés comme les humains, y compris dans les parties qui peuvent être utilisées.

### Chaîne de pensée 隐藏

Le Grand Concours de négociation autonome (arXiv:2503.06416) a été mené à environ 180 000 fois sur de nombreuses stratégies de LLM.

- Si un agent dans un scratchpad visible dans le public, je vais seulement aller à$75; my reservation price is $70°, je vais le lire à la main.
- 胜者私下计算策略;输出通道只包含优惠和最低限度的必要叙述──

C'est une théorie classique du jeu. Auumann 1976  À propos de la rationalité et de l'information) dans 2026 回应: Exposer votre évaluation privée 会损益──LLMs ne comprendront pas directement cela, et seront heureux de mettre leur réserve 写入对手可见的推理痕迹──

工程结论:将私网 scratchpad context与公网信息 context 分离──这不是可选项──

### Bhattacharya et coll. 2025  modèle 排名

basé sur le projet de négociation de Harvard 指标(principe de négociation BATNA respect  intérêt réciprocité):

- **Llama-3**Dans le domaine de l'échange, le taux de transaction + paiement est le plus efficace.
- **Claude-3**C'est le plus fort des négociateurs de l'offensive.
- **GPT-4**La différence de paiement entre les différents types de paiement est la plus faible.

C'est le modèle qui va gagner en 2026, mais les différents modèles de base avec des négociations en cours. Les ensembles hétérogènes (leçon 15) considéreront ce point comme une source de diversité.

###  Par contrat Net + LLM  effectuer la répartition des tâches

Contract Net en LLM multi-agent

1. L'agent directeur va décomposer les tâches en unités.
2. 使用任务描述向工人代理 广播 `cfp`Il y a une autre.
3. Chaque travailleur reçoit une offre:`(price, eta, confidence)`Le prix peut être des jetons, des unités de calcul ou des dollars.
4. Le gestionnaire 选择获胜者 (单个或多个,取决于任务) et le gestionnaire 选择获胜者 (单个或多个,取决于任务)
5. Les travailleurs rejetés peuvent exercer librement d'autres tâches.

Cela peut très bien s'étendre à plus de 100 travailleurs, car le mode de coordination est de diffusion et de réponse, et non de chat synchrone.

### L'entreprise de gestion des droits de propriété intellectuelle et des parties prenantes

NeurIPS 2024 (https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf)  introduit **secret scores**et **minimum-acceptance thresholds**Les entreprises de la LLM doivent les tirer de leurs messages. Il s'agit d'une généralisation de la formation de la coalition de deux parties. Elle est liée au marché des tâches de production des travailleurs dotés de capacités différentes.

### Résumé du rapport

Parmi les critères de référence de négociation pour les années 2024-2026, les règles de construction cohérentes sont les suivantes:

> 让LLM 负责叙述──不要让LLM 计算提供──

Si l'offre a besoin d'une structure de proposition, elle peut être mise en place, mais elle doit être effectuée en fonction du schéma de validation et de contrôle de contrainte.


```figure
a5-og-narrator
```

## - Je le construis.

`code/main.py`实现:

- `ContractNetManager`- Je suis là .`ContractNetTask`- Je suis là .`Bid` gestionnaire + soumissionnaire, cfp, collecte de propositions, assignation de tâches
- `og_narrator_bargain(state, rng)` Acheteur OG-Narrateur: Concession déterministe de style Zeuthen face au milieu du point.
- `seller_response(state, rng)` politique déterministe de contre-offre du vendeur (en anglais seulement)
- `naive_llm_bargain(state, rng)` 模拟 all-LLM bargainer:以高variance 选择价格,且经常落在 ZOPA 之外──
- Mesurage: dans 1000 essais, le taux de transaction est mesuré, chaque essais renouvelle les prix de réservation.

运行:

```
python3 code/main.py
```

预期输出:naive-LLM deal rate 约65-75%;OG-Narrator deal rate 约85-95%;15-25 个百分点的差别就是将提供-genération与叙述 分解开来的结构优势――此外还会输出一个包含三个投标者和一个任务的合同网任务市场分配示例――

## Utilisez-le

`outputs/skill-bargainer-designer.md`设计一个议价协议:谁生成报价 (déterministique ou LLM) 谁负责叙述,privé scratchpads 如何与公开信息分离,以及如何监控交易率──

##  La publier

Liste de contrôle des prix de la production:

- **分离 scratchpad。**L'État privé ne peut jamais entrer dans le contexte de l'autre.
- **Deterministic offer generation。**Les prix, les quantités, les états de production: calcul, ne pas se précipiter.
- **验证所有 incoming offers**Oui ou non, il est possible de refuser les offres hors de la zone de protection des consommateurs.
- **限制 rounds。**Le maximum de 3 à 5 roues; délai de mise à niveau à la médiation.
- **持续衡量 deal rate 和 payoff variance。**Le taux de détail, le déclin, est un symptôme, généralement une dérive rapide ou une attaque par contrepartie.
- **记录所有 rejected proposals** et sa logique déterministe― Pour les gestionnaires de réseau de contrats, les soumissionnaires défaits 需要理解原因―

## 练习

1. 运行  référencement`code/main.py`Confirmer que le narrateur de l'OG a dépassé le taux de transaction de l'LLM naïf.
2.  réaliser **persona-based payoff improvement**(arXiv:2402.05863)  acheteur  seulement dans la narration  adopter désespéré d'acheter cette semaine  de personnalité, offre générateur 保持不变── taux de transaction ou de paiement
3.  réaliser la chaîne de pensée **concealment**Si vous le divulguez accidentellement, comment le fera-t-il ?
4. Lorsque toutes les offres dépassent la réserve, comment le gestionnaire peut-il décider entre le prix le plus bas et le prix le plus élevé ?
5. 阅读 Bhattacharya et coll. 2025  关于哈佛谈判项目指标的内容──实现两个不同风格的讨价还价者(aggressive vs fair)──衡量对称和不对称对称下的收益差异──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Contract Net | “任务市场” | Smith 1980，FIPA 1996。cfp + propose + accept/reject。规范任务市场。 |
| ZOPA | “Zone of possible agreement” | buyer 最高价与 seller 最低价之间的重叠区间。其外部的 offers 无法成交。 |
| BATNA | “Best alternative to a negotiated agreement” | 如果本次交易失败，你的后备方案。它设定你的 reservation price。 |
| OG-Narrator | “Offer generator + narrator” | 分解：deterministic offer，LLM narration。 |
| Zeuthen strategy | “Risk-minimizing concession” | 根据风险限制让步的经典 offer-generator。 |
| Rubinstein bargaining | “Alternating-offer equilibrium” | 带 discounting 的 infinite-horizon bargaining 的 game-theoretic model。 |
| CoT concealment | “隐藏你的推理” | arXiv:2503.06416 的获胜者保留 private scratchpads；public channel 只显示 offer。 |
| Persona manipulation | “情绪姿态” | arXiv:2402.05863：从 desperation/urgency personas 获得约 20% payoff gain。 |

## 延伸阅读

- [NegotiationArena](https://arxiv.org/abs/2402.05863) référence;manipulation et exploitation de personnes
- [Measuring Bargaining Abilities of Language Models](https://arxiv.org/abs/2402.15813) OG-Narrateur, ainsi que l'acheteur-plus dur que le vendeur 结果
- [Large-Scale Autonomous Negotiation Competition](https://arxiv.org/abs/2503.06416)   180k 次协商; chaîne de pensée de dissimulation 获胜
- [LLM-Stakeholders Interactive Negotiation (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) 带秘密公用事业的多方可评分博
- [Smith 1980 — The Contract Net Protocol](https://ieeexplore.ieee.org/document/1675516) 经典机制,IEEE Les transactions sur ordinateur
