# Modèle primitif multi-agent

> Chaque framework multi-agents publié en 2026  AutoGen、LangGraph、CrewAI、OpenAI Agents SDK、Microsoft Agent Framework  都是四维设计空间中的一个点──四个原始,仅此而已:agent、handoff、shared state、orchestrator──本课从零构建它们,运行一个玩具系统在四个人上,然后将每个主流框架映射到同一组坐标轴上,让你能用一段话读懂任何新发布版本──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

##  problématique
Chaque six mois, un nouveau cadre multi-agents sera publié. AutoGen de 2023 et CrewAI de 2024 seront publiés. LangGraph et OpenAI Swarm de 2024 seront publiés. Google ADK de 4 avril 2025 seront publiés.

Si vous essayez de les apprendre individuellement, vous serez fatigué. Les API semblent différentes.

Il n'y a pas de quoi dire que les quatre primitifs sont stables.

## 概念
### Les quatre primitifs

1. **Agent** Un système prompt plus une liste d'outils── aucun état; chaque fois que vous utilisez le système prompt 和当前消息史 开始──
2. **Handoff**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
3. **Shared state** 任何能被多个代理 读取(有时也能写入) de la structure de données.
4. **Orchestrator** décider un rôle de celui qui le fait jouer.  choisir un rôle de celui qui le fait jouer.

C'est le cadre de conception complet. Chaque cadre est à la base de chaque axe.

### Comment chaque cadre 2026 le trace

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | tool returns Agent | caller's problem | the LLM's next handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | speaker-selector on GroupChat | message pool | selector function (LLM or round-robin) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Task outputs chained | manager LLM or static order |
| LangGraph | node function | graph edge + condition | `StateGraph` reducer | the graph, deterministic |
| Microsoft Agent Framework | agent + orchestration patterns | pattern-specific | thread / context | pattern-specific |
| Google ADK | agent + A2A card | A2A task | A2A artifacts | host decides |

La différence de surface est énorme.

### Pourquoi cela importe ?

Une fois que les primitifs sont détectés, la comparaison des cadres devient une simple liste de contrôle:

- L'orchestre est-il en train de suivre le programme ?
- État partagé est-il une histoire complète ?
- Les agents peuvent-ils modifier les instructions de l'autre, ou peuvent-ils simplement se défaire ?

Ces trois questions peuvent répondre à un cadre qui soit adapté à 80% des questions spécifiques.

### Le discernement sans État

En dehors de l'état partagé, chaque primitif est sans état. L'agent est une fonction (prompte, outils).**系统中唯一有状态的东西是 shared state。**Tous les bugs intéressants y vivent: intoxication de mémoire (leçon 15)

Hidden shared state frameworksSwarm) présentera le problème à l'appelantCentre à gérer les frameworks d'état partagéLanggraph checkpointAutoGen pool) permet de le vérifier, mais transférera le coût de coordination à la mise en œuvre de l'état partagé

### Anatomie d'une seule primitive

#### - Ça va ?

```
Agent = (system_prompt, tools, model, optional_name)
```

没有记忆──没有状态── posséder le même système de prompt 和 两个工具的代理是可互换的──任何东西看起来像每代理状态的东西,实际上都在共享状态或交付协议中──

#### Retour

```
Handoff = (from_agent, to_agent, reason, payload)
```

3 types de réalisation:

- **Function return** outil 返回下一个代理──这是OpenAI Swarm pattern──agents dans leurs propres schemes d'outils portent le routage──
- **Graph edge** LangGraph。Edges est déclaration式的。LLM 生成一个值;condition 选择下一个节点。
- **Speaker selection** AutoGen GroupChat──selector fonction(有时它本身也是一次LLM call)读取池并选择下一位发言者──

#### État partagé

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

Au moins un message 列表──通常更多:artéfacts structurés(CrewAI Exits de tâche) ‧type de contexte(Réducteurs de longueur de graphe) ‧mémoire externe(MCP、vecteur DB) ‧

两种类型:**full pool**(Chaque agent a vu chaque message)**projected**(agents voir la vue de la scope de rôle) ――Poules complètes 简单但扩展性差──Poules projetées peuvent être étendues, mais nécessitent un schéma de conception préalable──

#### Orchestreur

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

Quatre styles:

- **Static** graph dans le temps de construction 固定(Deterministique du langgraphe、CrewAI Sequentiel)。
- **LLM-selected** LLM 读取 pool 并选择下一位讲者(AutoGen、CrewAI Hiérarchique)
- **Handoff-driven** 当前 agent 通过调用 handoff tool 来决定(Swarm) 』
- **Queue-driven** travailleurs de la file d'attente partagée 拉取任务; aucun haut-parleur apparent ne s'est installé sur les architectures de la masse  Matrix)

### Quels changements entre cadres

Une fois que les primitifs sont fixés, le résidu de la décision de conception est:

- **Memory strategy** contrôle éphémère contre contrôle durable  contrôle Langgraph)
- **Safety boundary**Qui peut approuver la livraison ?
- **Cost accounting** budgets de jetons par agent
- **Observability** tracer les remises, pour la répétition 持久化状态──

Tout cela peut être réalisé sur les primitives.


```figure
a5-primitive-radar
```

## - Je le construis.
`code/main.py`Avec environ 150 pages stdlib Python 实现四个原始. 没有真正的LLM   Chaque agent                                                                                                                                                                                                                                                 

Le dossier est publié:

- `Agent` 包含 nom, ordre système, outils, fonction de politique de la classe de données
- `Handoff` 返回新代理的功能──
- `SharedState` Pools de messages sécurisés par fil
- `Orchestrator` 三个变体:`StaticOrchestrator`- Je suis là.`HandoffOrchestrator`- Je suis là.`LLMSelectorOrchestrator`(simulé)

démo 通過所有三种管弦器类型 运行同一个三代理管道(recherche → écrit → révision), et enfin imprimer le message pool── vous pouvez voir, la différence de sortie ne dépend que de *qui choisit le prochain*; agents 和 état partagé 在每次运行中完全相同──

Je vais le faire.

```
python3 code/main.py
```

预期输出: 三次乐队员运行,每种模式 一次――每次都会印印最终信息池――如果研究人员 判断已经提前完成,赞助驱动运行 会到达更少的代理人 这就是LLM-routing tradeoff 的缩写版――

## Utilisez-le
`outputs/skill-primitive-mapper.md`Il est une compétence, il peut lire n'importe quelle base de code multi-agent ou document cadre, et retourner à quatre-mapping primitif.

## Je le livre.
Dans le cadre de l'adoption du nouveau cadre, précisez la cartographie primitive. Si vous ne l'avez pas écrite, indiquez que le cadre est incomplet ou que vous êtes en train d'élaborer le 5ème cadre primitif.

Lorsque le nouveau membre de l'équipe 加入时,先把映射 发送给他们,再发送 API docs──当框架 versions 变化时,对比映射,而不是变更──

## 练习
1. Avec différentes politiques d'agents`code/main.py`三次──观察 orchestrateur choix 如何改变哪些代理会运行──
2. 实现第四种管弦乐器类型:排队驱动, dont les agents 轮询共享状态 寻找工作.
3. 取 LangGraph rapidstart (https://docs.langchain.com/oss/python/langgraph/workflows-agents), le transcrivez en quatre primitives. Quelles sont les abstractions de LangGraph qui sont 1:1 映射, quels sont les enveloppes de commodité ?
4. 阅读 OpenAI livre de cuisine de la communauté (https://developers.openai.com/cookbook/examples/orchestrating_agents• Identifier les quatre primitifs qui sont les plus ergonomiques, et qui les poussent à l'appelant.
5. Dans ce tableau, trouver un cadre d'état partagé totalement caché.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | “一个带 tools 的 LLM” | 一个 `(system_prompt, tools, model)` triple。无状态。 |
| Handoff | “控制权转移” | 一个结构化 call，命名下一个 agent 和可选 payload。三种实现：function return、graph edge、speaker selection。 |
| Shared state | “Memory” / “context” | multi-agent system 中唯一有状态的部分。Message pool 或 blackboard。 |
| Orchestrator | “Coordinator” | 决定下一个运行者的人或机制。Static graph、LLM selector、handoff-driven，或 queue-driven。 |
| Primitive | “Abstraction” | 每个 framework 都会参数化的四个轴之一。不是 framework feature。 |
| Message pool | “Shared chat history” | Full-history shared state。容易推理，扩展性差。 |
| Projected state | “Scoped view” | 面向特定 role 的 shared state view。可扩展，需要 schema design。 |
| Speaker selection | “下一个谁说话” | 一种 orchestrator pattern，其中一个 function（通常是 LLM）从 group 中选择下一个 agent。 |

## 延伸阅读
- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) Pour l'orchestration guidée par la main
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) GroupChat + sélection de conférenciers est une référence à l'orchestration sélectionnée par le LLM
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) orchestration du bord du graphique et état partagé basé sur le réducteur
- [CrewAI introduction](https://docs.crewai.com/en/introduction) agents de rôle-objectif-histoire de fond,processes séquentiels/hiérarchiques
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2) Microsoft va transférer la version 0.4 dans l' AutoGen v0.2 qui est toujours en activité après l' entretien
