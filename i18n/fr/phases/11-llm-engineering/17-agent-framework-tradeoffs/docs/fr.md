# Cadre d'action 取舍  LangGraph vs CrewAI vs AutoGen vs Agno

> Chaque cadre est en vente avec un même démo, un même agent de recherche, un même bug, un même schéma d'état et une couche d'orchestration, un même schéma de lutte entre eux.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 minutes

##  problématique

Vous avez une tâche, vous devez passer une seule appel à la maîtrise en droit. Peut-être que c'est un flux de travail de recherche.

Trois jours plus tard, vous découvrez que l'abstraction de ce cadre commence à se déverser. L'équipe vous donne des rôles, mais quand le chercheur a besoin de mettre un plan structuré à la disposition de l'écrivain, il va vous aider à partager les conversations entre les agents, mais sans un état, donc votre point de contrôle est juste un morceau de journal de conversation. La longgraphe vous donne un graphique d'état, mais vous oblige à ne pas savoir ce que l'agent va faire avant de nommer chaque transition.

La méthode de réparation n'est pas de choisir le meilleur cadre, mais de faire correspondre l'abstraction centrale du cadre à la forme de votre problème.

## 概念

![Agent framework 矩阵：核心抽象 vs 问题形状](../assets/framework-matrix.svg)

Les quatre cadres principaux régissent le paysage de 2026: leurs abstractions centrales ne sont pas les mêmes.

| Framework | 核心抽象 | 最适合 | 最不适合 |
|-----------|----------|--------|----------|
| **LangGraph** | `StateGraph` — typed state、nodes、conditional edges、checkpointer。 | 有显式 state 和 human-in-the-loop interrupts 的 workflows；需要 time-travel debugging 的 production agents。 | 拓扑未知、由 role 驱动的松散 brainstorming。 |
| **CrewAI** | `Crew` — roles（goal、backstory）、tasks、process（sequential 或 hierarchical）。 | 有短线性/层级 plan 的 role-playing 或 persona-driven workflows。 | 超出 crew turn history 的任何 stateful 场景；复杂 branching。 |
| **AutoGen** | `ConversableAgent` pair — 两个或更多 agents 轮流说话，直到满足 exit condition。 | Multi-agent *dialogue*（teacher-student、proposer-critic、actor-reviewer），其中思考从 chat 中涌现。 | 有已知 DAG 的 deterministic workflows；任何需要跨重启 durable state 的场景。 |
| **Agno** | `Agent` — 单个 LLM + tools + memory，可组合成 teams。 | 快速构建 single agents 和 lightweight teams；强 Multimodality 和内置 storage drivers。 | 带 custom reducers 的深度、显式分支 graphs。 |

### Qu'est-ce que cela signifie ?

Le résumé central d'un cadre est ce que vous dessinez sur le tableau blanc en discutant de l'architecture.

- **LangGraph**→ Tu dessines un graphique. Les nœuds sont des étapes, les bornes sont des transitions.
- **CrewAI**→ Vous dessinez un tableau d'org. Chaque rôle a une description de poste, le gestionnaire des tâches.
- **AutoGen**→ Tu dessines un Slack DM── deux agents 相互发消息; si vous avez besoin de modérateur, un troisième加入──mental model est le chat──
- **Agno**→ Tu dessines une boîte unique, en plus des outils.

### État  problématique

L'État est le cadre de la plupart des choix où la production s'effondre.

- **LangGraph.**État de type`TypedDict`Ou modèle Pydantic) 、par-campe réducteurs、一等 checkpointers(SQLite/Postgres/Redis)  Résumé、interruption 和 temps-voyage 都是免费的──*((voir phase 11 · 16──) *
- **CrewAI.**Le gouvernement`context`champ 以字符串形式在任务之间流动, ou par`output_pydantic`结构化传递──开箱没有每员工的持久店; si l'équipage 必须在重启后生存, vous avez besoin de vous connecter.
- **AutoGen.**État est l'historique du chat et tout ce qui est défini par l'utilisateur `context`Les transcriptions de conversation peuvent être conservées; l'état du flux de travail est indéterminé, à moins que vous ne rédigez des adaptateurs.
- **Agno.**Les pilotes de stockage sont installés dans le système de gestion de données (SQLite, Postgres, Mongo, Redis, DynamoDB).`storage=`Je suis en train de le faire .`Agent`上  sessions de conversation 和 utilisateur mémoires 会自动持久化────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

### Branchage  problém

Chaque agent extraordinaire doit être branché.

- **LangGraph** By你决定, via conditionnels edges。Routing is带命名 branches de Python fonction。Ranses sont un objet de même nature dans le graphique compilé;checkpointer 会记录采取哪条分部。
- **CrewAI** mode hiérarchique  mode séquentiel  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision  mode de décision                                                                                                                                                              
- **AutoGen** agents 通过聊天决定──branchage 从下一个发言者中涌现──`GroupChatManager`选择 next speaker; vous pouvez écrire à la main `speaker_selection_method`Mais il est bien décidé par le LLM.
- **Agno** agent 通过下一步调用哪个工具来决定──équipes ont un mode coordinateur/router/collaborateur; au-delà de ces branches, c'est la responsabilité du développeur──

### Observabilité 问题

- **LangGraph**  via LangSmith ou tout exportateur OTel utiliser OpenTelemetry。 chaque transition de nœud sont des traces de span; points de contrôle 同时也是可重播的痕迹。 LangSmith est un programme de première partie 选项; Langfuse/Phoenix possède également des adaptateurs。
- **CrewAI** Depuis la fin de l'année 2025, le groupe a soutenu OpenTelemetry; intégré Langfuse、Phoenix、Opik、AgentOps。
- **AutoGen**- Je suis là.`autogen-core`集成 OpenTelemetry;AgentOps 和 Opik avec connecteurs──Tracing 粒度 is per-agent-message, pas par-node──
- **Agno** Inposée `monitoring=True`Les exportateurs de télémetry ouverts sont également utilisés pour les traces de sessions.

### Coût et latence

Les quatre cadres ont augmenté les frais généraux par appel (la logique du cadre, la validation, la sérialisation) ⋅ selon les frais généraux ≈ LangGraph < CrewAI ≈ AutoGen ⋅ différence principalement par le cadre fait combien extra LLM routing décide ⋅ Le gestionnaire hiérarchique du CrewAI décide qui décide de l'exécution suivante; AutoGen ⋅`GroupChatManager`C'est aussi ça. Longgraph, c'est tout ce que tu écris.`llm.invoke`Le chemin d'Agno est très faible.

Lorsque le coût de chaque opération est important, la priorité est de choisir un routage explicite`speaker_selection_method`), au lieu de l'itinéraire sélectionné par le LLM.

### Interopérabilité

- **LangGraph** **LangChain**outils, récupérateurs, LLMs, adaptateurs MCP, outils 作为 MCP servers 导入)
- **CrewAI** outils 继承自 `BaseTool`Les outils LongChain, LlamaIndex et MCP sont adaptés à la mise en œuvre.`allow_delegation=True`Faire une délégation d'équipage à équipage.
- **AutoGen**- Je suis là.`FunctionTool`包装任何Pythoncallable; il y a un adaptateur MCP。 pour les modèles agent-à-agent avec l'écosystème AG2 紧密合──
- **Agno**- Je suis là.`@tool`Décorateur ou sous-classe BaseTool; adaptateur MCP; outils peuvent être partagés entre les agents et les équipes.

##  compétences

> Vous pouvez expliquer en un mot pourquoi un cadre s'adapte à un agent.

构建前 Liste de contrôle:

1. **画出形状。**C'est un graphique (type d'état, nom de transition) ? Jouer un rôle (specialistes) ?
2. **决定谁来 branching。**Branchage décidée par le développeur → LangGraph。Manager-agent-decidée → CrewAI hiérarchique。Chat-émergent → AutoGen。Tool-call-decidée → Agno。
3. **检查 state budget。**Vous avez besoin de reprendre à partir du point de contrôle? Voyage dans le temps? L'homme interrompt au milieu de la course? Si oui, LongGraph est un choix par défaut; Agno sessions  couvrir l'état de la conversation.
4. **检查 cost budget。**Chaque tour de l'agent effectue des milliers de transactions par jour, en choisissant un routage explicite.
5. **为 framework overhead 做预算。**Chaque cadre est une autre dépendance. Si la tâche est de faire deux appels LLM et un outil, écrivez 30 pages Python simple; sans aucun cadre, plus facile que aucun cadre.

Dans le cadre de la réforme, vous pouvez dessiner un graphique, un graphique, un chat ou une boîte d'agents, avant de refuser de vous étendre à un cadre.

##  décision

| 问题形状 | 首选 framework | 原因 |
|----------|----------------|------|
| 带 typed state、human approvals、long-running 的 Workflow DAG | LangGraph | 一等 state、checkpointer、interrupts、time-travel。 |
| 有明确 roles 的 research / writing pipeline | CrewAI (sequential) 或 LangGraph subgraphs | 在 CrewAI 中表达 role-per-task 很便宜；当 branching 变复杂时用 LangGraph 扩展。 |
| Proposer-critic 或 teacher-student dialogue | AutoGen | Two-agent chat 是它的原生形状。 |
| 带 tools、sessions、memory 的 single agent | Agno | 设置最薄，内置 storage 和 memory。 |
| 带 reducers 的数千个 parallel fanouts | LangGraph + `Send` | 唯一拥有一等 parallel-dispatch API 的选择。 |
| 快速 prototype，不承诺 framework | Plain Python + provider SDK | 没有 framework 是最快的 framework。 |


```figure
l5-framework-fit
```

## 练习

1. **Easy.**取同一个任务  research Le siège social de l'Anthropic, écrivez un bref de 200 mots, citant des sources   分别使用 LangGraph(四个节点:plan、搜索、写、引用) 和 CrewAI(三个角色: researcher、writer、editor) 实现──报告每次运行代码行数和代码行数──
2. **Medium.**Utilisez AutoGen  chercheur  écrivain chat, éditeur `GroupChat`加入) 和 Agno(带 `search_tools`et `write_tools`La capacité de réinitialisation de l'écriture de l'étape pré-dépôt de l'approbation humaine, pour les quatre processus de réalisation
3. **Hard.** Construire un script d' arbre de décision `pick_framework.py`, accepter une simple description de problème`{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`),并返回推和一句话理由──用你自己设计的六个案例──验证它──

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| Orchestration | “agents 如何协调” | 决定下一个运行哪个 node/role/agent 的 layer。 |
| Durable state | “重启后 resume” | 附着到 checkpoint 或 session store 上、能在 process death 后存活的 state。 |
| LLM-selected routing | “让 model 决定” | planner LLM 每轮选择下一步；灵活，但每次决策都要花 tokens。 |
| Explicit routing | “Developer 决定” | Python function 或 static edge 选择下一步；便宜且可审计。 |
| Crew | “一个 CrewAI team” | roles + tasks + process（sequential 或 hierarchical）绑定成一个 runnable。 |
| GroupChat | “AutoGen 的 multi-agent chat” | N 个 agents 之间由 speaker selector 管理的 conversation。 |
| Team (Agno) | “Multi-agent Agno” | 对一组 agents 使用 route / coordinate / collaborate mode。 |
| StateGraph | “LangGraph 的 graph” | typed-state、node、conditional-edge、checkpointer abstraction。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) StateGraph, points de contrôle, interruptions, voyage dans le temps,
- [CrewAI documentation](https://docs.crewai.com/) Équipes, flux, agents, tâches, processus
- [AutoGen documentation](https://microsoft.github.io/autogen/) Agents conversables, chat de groupe, équipes outils.
- [Agno documentation](https://docs.agno.com/) Agent, équipe, flux de travail, stockage, mémoire
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) avec le cadre 无关的图案库(réponse de chaîne, routage, parallélisation, orchestrateur-travailleurs, évaluateur-optimisateur)
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629)Chaque cadre est enveloppé dans un boucle.
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155) Le papier de conception de AutoGen
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442) CrewAI 风格 personna stacks 建立其上的角色扮演基础──
- Phase 11 · 16 (Langgraph)  Le cadre de référence utilisé dans ce cours
- Phase 11 · 19 (Réflexion)    一个能干净映射到 LangGraph、但映射到 CrewAI 会很不同的扭曲模式──
- Phase 11 · 22 (observabilité de la production)  如何仪器 你选择的任何框架──
