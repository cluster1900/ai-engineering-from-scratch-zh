# Agents 经济、Token  incitation、 réputation

> 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长周期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长期 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长 长**5-layer stack**Oui:**DePIN**(computation physique) **Identity**(DIDs du W3C + 声誉资本) →**Cognition**(RAG + MCP) →**Settlement**(abstraction du compte) **Governance**(DAO agencés)  incitation aux agents de production 网络包括 **Bittensor**(sous-réseaux de TAO  modèles spécifiques à la tâche de récompense)**Fetch.ai / ASI Alliance**(ASI-1 Mini LLM + FET) et **Gonka**(basé sur la PoW du transformateur, sera calculé à nouveau répartis sur des tâches d'IA à valeur de production)**Shapley-value credit attribution**Pour une récompense équitable aux agents ayant contribué; Google Research Mécanisme de conception pour les grands modèles linguistiques  proposé dans l'agrégation monotone **token auctions** Le programme de formation de base est basé sur la création d'un marché de la plus petite valeur de l'agent, l'attribution de crédit à Shapley est utilisée pour le pipeline multi-agent, et le lancement d'une vente aux enchères de jetons à prix second, la mise en place d'un mécanisme de théorie du jeu.

**Type:** Learn
**Languages:** Python (stdlib)
**前置要求：**Phase 16 · 16(Negociation et négociation),Phase 16 · 09(Réseaux de concours parallèles)
**Time:** ~75 分钟

##  problématique
Lorsque les agents créent ensemble de la valeur, mais doivent être récompensés séparément, les systèmes multi-agents deviennent complexes. Les mécanismes classiques, tels que la distribution moyenne, le dernier contributeur, prennent tout, soit inéquitable, soit facilement manipulé, sont utilisés.

En plus de l'attribution de crédit, ce domaine est devenu un véritable agent économique:Bittensor TAO  récompense l'exploitation minière en calcul, pour ajuster les modèles spécifiques au sous-réseau;Fetch.ai/ASI avec des jetons FET  récompense ASI-1 Mini LLM Utilisation;Gonka transformera la preuve de travail et la redistribuera à des tâches d'IA à valeur de production ⋅ les agents capables de négocier indépendamment existent déjà aujourd'hui; question est de savoir comment s'y adapter.

Cette classe a pour objectif de définir les économies d'agents comme un problème spécifique: attribution de crédit, conception de mécanisme et réputation, et de construire chaque partie avec la mathématique minimale, afin que le concept reste vraiment là.

## 概念
### 5 couches de stack d'agent-économie

1. **DePIN（physical compute）。**Pour les infrastructures centralisées, il est utilisé pour louer des GPU, des stockages, des bandes de largeur, des sous-réseaux de bittenseurs, des Render Network, des Akash, il ne appartient pas aux agents, les agents l'utilisent.
2. **Identity。**Les identifiants décentralisés du W3C (DID) donnent à chaque agent un ID permanent non dépendant de toute plateforme.
3. **Cognition。**L'agent de la boucle de raisonnement:LLM + RAG + MCP.
4. **Settlement。**Abstraction du compte (ERC-4337) permettant aux agents de payer le gaz à partir de leur résidu, sans avoir à détenir de l'ETH.
5. **Governance。**Les DAO agencés: par les humains et les agents, unis à des changements de protocole  vote de la structure gouvernementale, le droit de vote et la réputation liés 

Il n'y a pas de système de production qui utilise tous les 5 niveaux. Le bittenseur utilise les 1er niveaux, utilise les 3er niveaux, utilise les 5e niveaux.

### Bittensor  Fetch.ai  Gonka: quelque chose qui fonctionne réellement

**Bittensor（TAO）。**Les sous-réseaux sont des tâches spéciales (la modélisation du langage, la génération d'images, la prévision)  Les mineurs  soumettent des résultats de modèles  Les évaluateurs pour leur classement  Les scores pondérés par les enjeux  Répartition des récompenses TAO  Chaque sous-réseau a son propre mode d'évaluation  Les cours économiques  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours de formation  Les cours d'élabels  Les cours de formation  Les cours de la formation  Les cours d'élabels  Les cours de la programmation  Les cours de la programmation  Les cours de la programmation   Les cours d'élabels  Les cours d'élabels  Les cours de la programm  Les cours d'élabels  Les cours de la programm  Les cours d'é  Les élabels   Les élabels  Les élabels 

**Fetch.ai / ASI Alliance。**ASI-1 Mini LLM 运行在 Fetch.ai's网络上; utilisateur utilisant des jetons FET 支付推理 费用──这里代理-as-peers

**Gonka。**Les mineurs effectuent des tâches d'inférence avec des résultats précis et précis de formation (en utilisant des données de formation) pour obtenir des bénéfices.

截至 2026 年 4 月, ces trois sont des produits de qualité-grade. 回报分配方式不同. Bittensor 根据子网验证者的相对质量奖励;Fetch 根据付费用户测量的实用性奖励;Gonka 奖励可验证的推断工作──

### Attribution de crédit à valeur Shapley

Trois agents collaborent pour accomplir une tâche.

Shapley: satisfaire à quatre critères: efficacité, symétrie, linéarité, nullité, unique allocation de crédit pour l'agent.`i`- Le numéro de la liste:

```
shapley(i) = (1/N!) * sum over all orderings O of (v(S_i_O ∪ {i}) - v(S_i_O))
```

Parmi eux `S_i_O`est la répartition`O`Le centre de la ville`i`之前的代理 集合──实践中:枚举所有 permutations,记录每个代理 在每个 permutation 中的边际贡献,然后取平均──

Pour N=3 agents, il y a 6 permutations. Pour N=10, il y a 3,6 millions.

### Utilisé pour l'enchère de prix de l'agrégation

Google Research (WEB) propose des enchères de jetons à prix second pour regrouper les produits de LLM. Leur mise en place: N'importe quel agent propose une finition; chaque agent a une valeur privée pour les candidats. L'auctionnaire choisit la proposition de valeur la plus élevée, et paie *2high* de valeur.

Ceci est important pour les systèmes de LLM: vous pouvez externaliser les tâches à plusieurs agents à des prix différents; les enchères: choisir le meilleur système et payer équitablement, les agents: recevoir des incitations sans erreur.

### Capitaux de réputation

绑定 DID's reputation score  从已确认贡献中累积──一个简单更新规则:

```
rep(i, t+1) = alpha * rep(i, t) + (1 - alpha) * contribution_quality(i, t)
```

Parmi eux, le facteur de déclin.`alpha`接近 1―Réputation:

- Pour les décisions de routage, lire le coût faible
- Il y a aussi des problèmes de santé.
- Les contributions peuvent être réduites:

### AAMAS 2025 pour centrer les activités de la MEA

La proposition de la LAMAS (AAMAS 2025) a été combinée avec: identité DID, attribution de crédit à valeur de Shapley et un mécanisme de vente aux enchères simple.

### Le mécanisme économique va s'effondrer

- **Price oracle manipulation。**Si la fonction de crédit peut être manipulée, les agents la manipuleront.
- **Sybil attacks。**Un opérateur lance des faux agents pour augmenter leur contribution. Les DID vont ralentir mais ne peuvent pas empêcher ce comportement.
- **Verification cost。**L'équité de l'attribution de crédit dépend du vérificateur. Si la vérification est facile, elle peut être manipulée; si elle est coûteuse, le système ne peut pas être étendu.
- **Regulatory overhang。**Les économie et la surveillance financière des agents sont en phase avec la loi Grey Earth jusqu'en 2026.

### Les économie d'agents ont un sens

- **具有异构 operators 的开放网络。**Il n'y a pas de groupe unique qui contrôle tous les agents.
- **可验证输出。**Pas de vérification, aucune attribution de crédit.
- **Long-horizon workflows。**Une tâche de nature ne peut être bénéficiée de l'accumulation de la réputation.
- **Tokenized payments 在你的司法辖区合法可行。**

Dans un système d'entreprise fermé, le mécanisme économique permet une distribution plus simple des managers, les mesures sont internes.


```figure
swarm-auction
```

## - Je le construis.
`code/main.py`实现:

- `shapley(value_fn, agents)` 通过枚举为小 N 精确计算 Shapley。
- `second_price_auction(bids)`  真实机制; le gagnant 支付 deuxième plus élevé。
- `Reputation` 绑定 DID、带指数 déclin 和 réputation de coupe 
- Démo 1: trois agents, le vrai Shapley, le crédit.
- Démo 2: cinq agents pour une tâche slot; prix de sortie; prix de deuxième enchère  sélectionner le gagnant + paiement―
- Démo 3:100 Ronde de tâches répartis à des agents ayant des représentants différents; routage pondéré par réponses 优于随机──

运行:

```
python3 code/main.py
```

预期输出: valeurs Shapley de chaque agent; montrer le résultat de l'équilibre de l'offre vraie de l'enchère; montrer le réchauffement 后 rep-weighted routing 相比随机有 10-20% gain de qualité。

## Utilisez-le
`outputs/skill-economy-designer.md`design a minimum agent economy:identity layer 选择、信用attribution mécanisme、支付 mécanisme、 réputation rule。

## Je le livre.
En 2026, l'économie des agents de la circulation:

- **从 reputation 开始，而不是 tokens。**Réputation  réalisation de coûts bas, de valeur unique; les jetons augmenteront la complexité juridique et économique¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- **奖励前先验证。**Ne pas distribuer de crédits sans vérification indépendante.
- **使用 Shapley-sample，而不是 Shapley-exact。**采样 100-1000 个订单; 精确枚举无法扩展──
- **限制 decay factor，并设置 reputation floor。**无界衰退会抹抹合法贡献者;过慢衰退会奖励过时的高代表代理人──
- **以 adversarial 方式审计机制。**Chaque mécanisme a une théorie de jeu; vous devez trouver des failles, plutôt que d'autres attaquants 找到──

## 练习
1. 运行  référencement`code/main.py` Confirmer les valeurs de Shapley 之和等于总值(l'axiome de l'efficacité)  Modifier la fonction de valeur; les allouements de Shapley sont-ils modifiés selon les directions prévues?
2. 实现 Shapley *sampling*(在 K 个命令上蒙特卡罗) ――K 如何影响近似精度?与 N=4 的精确结果比较──
3. En tant qu'unité, les négociations de prix sont-elles plus efficaces que les offres individuelles ?
4. 阅读Google Research's Mechanism-Design 文章;; Trouver une hypothèse qui, une fois violée, va nuire à la véracité;; Dans le cadre de la formation en droit, quel est le mode d'échec ?
5. 阅读AAMAS 2025 去中心化 LaMAS 论文──在一个合成任务上上为10代理 实现其中的Shapley 步骤──精确计算 需要多长时间?用100次绘画 采样能有多接近?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| DePIN | “Decentralized physical infrastructure” | Token-incentivized compute/storage/bandwidth。Bittensor、Akash、Render。 |
| DID | “Decentralized identifier” | 用于 portable IDs 的 W3C spec。Agent reputation 绑定到 DID，而不是平台。 |
| ERC-4337 | “Account abstraction” | 可以 sponsor gas 的 contract accounts，从而支持 agent payments。 |
| Shapley value | “Fair credit attribution” | 满足 efficiency、symmetry、linearity、null 的唯一 allocation。 |
| Second-price auction | “Vickrey auction” | 真实机制：winner 支付 second-highest bid。与 monotone aggregation 兼容。 |
| Reputation capital | “Accumulated quality score” | 来自已确认贡献、绑定 DID 的 score；会随时间 decay。 |
| Agentic DAO | “Agents + humans govern” | 把 agent voters 作为 first-class、投票权绑定 reputation 的 DAO。 |
| TAO / FET / GPU credits | “Token denominations” | Bittensor TAO、Fetch.ai FET、各种 DePIN tokens。 |

## 延伸阅读
- [The Agent Economy](https://arxiv.org/abs/2602.14219) 2026 années sur la pile de 5 couches d'agents-économie
- [Google Research — Mechanism design for large language models](https://research.google/blog/mechanism-design-for-large-language-models/) 带 monotone aggregation des enchères de symboles
- [AAMAS 2025 — decentralized LaMAS](https://www.ifaamas.org/Proceedings/aamas2025/pdfs/p2896.pdf) attribution de crédit à valeur Shapley
- [Bittensor TAO documentation](https://docs.bittensor.com/) structure du sous-réseau et répartition des récompenses
- [Fetch.ai / ASI Alliance](https://fetch.ai/) ASI-1 Mini LLM et FET
- [W3C Decentralized Identifiers (DIDs) spec](https://www.w3.org/TR/did-core/) fondation de l'identité
