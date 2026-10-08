# 编排模式:Superviseur, groupe, hiérarchique

> Dans le cadre de l'année 2026, quatre types de modèles d'orchestration sont régulièrement apparus: superviseur-travailleur, groupe de travail / groupe de travail, hiérarchie et débat.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Phase 14 · 12 (Patrons de flux de travail), phase 14 · 25 (débat multi-agents)
**Time:** ~60 分钟

## Objectif de l'apprentissage
- Il y a quatre types de réactions de l'orchestration, ainsi que des scénarios adaptés.
- 描述 2026 年 LangChain 的建议: Basé sur la supervision des appels à l'outil, et non sur les bibliothèques de supervision。
- Expliquer la structure du système et comment il est lié à la topologie
- Utiliser le stdlib, basé sur un scripté LLM  réaliser les quatre modes 

##  problématique
Les équipes sont toujours pressées de faire usage de plusieurs agents avant de les avoir vraiment besoin.

## 概念
### Travailleur-surveillant

- Un centre de suivi de la loi a envoyé des missions aux agents spécialisés.
- Les décisions comprennent: retourner à son propre cycle, se transférer vers un spécialiste, terminer.
- Les spécialistes ne communiquent pas entre eux, tous les itinéraires sont supervisés.

框架:LangGraph `create_supervisor`、Ouvriers-orchestre anthropiques 、CrewAI Processus hiérarchique―

**2026 LangChain 建议：** par des appels d'outils directs faire la surveillance, plutôt que d'utiliser `create_supervisor`                                                                                                                                                                                                                                                              

### Les groupes de personnes

- Les agents partagent la surface de l'outil directement.
- Il n'y a pas de routeur central.
- Il est plus que possible de faire des efforts pour la sécurité.
- Il est plus difficile de le faire.

框架:LangGraph swarm topologie、OpenAI Agents SDK remises (((当所有代理都可以交给所有其他代理 时)

### La hiérarchie

- Superviseurs administration de sous-superviseurs, sous-superviseurs
- Dans LangGraph, il est réalisé pour les sous-graphes en nid; dans CrewAI, il est réalisé pour les équipages en nid.
- Il peut s'étendre à des groupes d'agents de grande taille, mais le coût est plus élevé.

Quel est le contexte de la mise en œuvre du budget de l'unité de supervision ?

### Débat

- Il y a aussi des propositions de critiques croisées.
-  strictement pas orchestration, mais comme vérification, mais dans le cadre souvent comme une topologie  sélection apparaître.

### CrewAI Crew vs Flow

L'Equipage a formalisé deux modes de déploiement:

- **Flow**Il s'agit d'une automatisation événementielle de la détermination.
- **Crew**Utilisation de la collaboration basée sur le rôle de l'autodéfense.

Il s'agit de quatre modèles qui correspondent à ceux ci-dessus, mais qui se reflètent dans la topologie: le flux est généralement supervisé ou hiérarchique; l'équipe est généralement supervisée par le routeur LLM.

### Les conseils de l'anthropique

Le succès de la LM ne consiste pas à construire le système le plus complexe, mais à construire le système correct pour vos besoins.

决策顺序:

1. 单个代理 + workflow patterns (lesson 12) 从这里开始──
2. - Le superviseur-travailleur  quand vous avez 2 à 4 spécialistes 时──
3. La masse est plus importante que la clarté.
4. La hiérarchie  只有当监管背景预算 不足时。
5. Le débat est plus important lorsque le taux de précision est supérieur au coût.

### Cette façon est facile à trouver

- **Topology-first thinking.**Avant de savoir ce qu'il faut faire pour trouver un agent, on dit:
- **Bouncing handoffs in swarm.**A -> B -> A -> B。 Utilisation de comptoirs de sauterelles。
- **Fake hierarchy.**Parce que l'entreprise est à trois niveaux; en réalité, il n'y a que deux équipes.


```figure
orchestration-pattern
```

## - Je le construis.
`code/main.py`Utilisation de la loi de droit en ligne, basée sur des écrits, pour réaliser les quatre modes suivants:

- `Supervisor`Le routeur central.
- `Swarm` 带直接 handoffs de pairs à pairs
- `Hierarchical` superviseurs de superviseurs
- `Debate` et de faire des propositions + des critiques

Chaque mode de traitement est identique.

运行:

```
python3 code/main.py
```

输出: chaque type de modèle de suivi + compte de contrôle.

## Utilisez-le
- **LangGraph**Utilisé pour les superviseurs et les sous-graphes hiérarchiques
- **OpenAI Agents SDK**Utilisé comme outil de remise en main, en forme de superviseur.
- **CrewAI Flow**Il est utilisé pour l'environnement de production déterminé.
- **Custom**Pour le débat, ou quand tu veux le contrôle exact.

## Je le livre.
`outputs/skill-orchestration-picker.md`Choisir une topologie et la réaliser.

## 练习
1. En détachant le routeur, en transférant un superviseur-travailleur en un essaim...
2. Il peut prendre le saut en double ?
3. Pour un domaine spécialisé de 12 catégories, construire un système hiérarchique à deux niveaux.
4. En ce qui concerne la charge de travail de la production, le profil des quatre modes.
5. 阅读Anthropic's Building Effective Agents 文章──把你的每一个生产流程 映射到四种模式之一──有没有不能干净映射的吗?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor-worker | “Router + specialists” | 中心 LLM 分派给 specialists；它们彼此不通信 |
| Swarm | “Peer-to-peer” | 通过共享 tools 直接 handoffs；没有中心 router |
| Hierarchical | “Supervisors of supervisors” | 面向大规模群体的 nested subgraphs |
| Debate | “Proposer + critique” | 并行 proposers，cross-critique（Lesson 25） |
| Tool-call-based supervision | “Supervisor without a library” | 将 supervisor 实现为直接 tool calls，以控制 context |
| Crew | “Autonomous team” | CrewAI 的 role-based collaboration 模式 |
| Flow | “Deterministic workflow” | CrewAI 的 event-driven production 模式 |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 五种模式 + agent vs flux de travail
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) superviseur  groupe  hiérarchique
- [CrewAI docs](https://docs.crewai.com/en/introduction) équipage contre flux
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) Modèle de débat
