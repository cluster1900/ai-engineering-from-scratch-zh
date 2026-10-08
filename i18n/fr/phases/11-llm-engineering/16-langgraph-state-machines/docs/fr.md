# LangGraph  Les machines d' état de l' agent

> La boucle de réaction de la main-d' écriture est une .`while True` ReAct loop de LangGraph 写的是一个图, vous pouvez le contrôler, l'interrompre, brancher, et effectuer un voyage dans le temps.

**Type:** Build
**Languages:** Python
**前置要求:**Phase 11 · 09 (appel à la fonction), phase 11 · 14 (prototype de protocole contextuel)
**Time:** ~75 minutes

##  problématique

Vous publiez un agent d'appel à la fonction. Il fonctionne normalement, puis il sort le problème: modèle tente de faire appel à un outil de retour 500, l'utilisateur change d'avis au cours de la mission, ou l'agent décide de rembourser son commande sans l'approbation humaine.`while True:`Vous ne pouvez pas le suspendre, ne pas le retourner, ne pas le forcer à sortir. Si le modèle choisit alors un autre outil, il sera un peu plus facile de le faire.

Une fois que vous avez compris cela, l'étape suivante est évidente. L'agent est un système de machine d'état: système de prompt, histoire de message, appels d'outils en attente, réactions suivantes.

LangGraph est une bibliothèque d'abstraction. Il n'est pas un cadre d'agent à LangChain. Il y a ici un agentExecutor.

## 概念

![LangGraph StateGraph: nodes, edges, and the checkpointer](../assets/langgraph-stategraph.svg)

Une .`StateGraph`Il y a trois choses.

1. **State.**Un dicté typé ([[Dict typé]] ou modèle Pydantic), se trouvera dans le graphique 中流动。 chaque nœud recevra un état complet, et reviendra à une mise à jour partielle, LongGraph utilisera chaque champ pour les *réducteurs* de la correspondance pour les fusionner 它们: pour les listes de compilation utilisées `operator.add`Il y a une autre chose.
2. **Nodes.**Fonctions Python `state -> partial_state` chaque nœud est un pas de séparation: appeler le modèleexécuter des outils résumer
3. **Edges.**Les tranches entre les nœuds. Les bords statiques indiquent la position fixe. Les bords conditionnels reçoivent une fonction de routeur.`state -> next_node_name`, la graphie peut être basée sur la sortie du modèle

Vous allez compiler ce graphique. Vous allez compiler une topologie de liaison, ajouter un point de contrôle.`thread_id`Chaque étape d'exécution sera durable.`(thread_id, checkpoint_id)`Pour le point de contrôle clé.

### Quatre super capacités

**Checkpointing.**Chaque transition de nœud mettra en place un nouvel état de la mémoire, produit avec Postgres/Redis/SQLite.`thread_id`Re-adoutez le graphique 即可再起──graph 会从暂停的位置继续──

**Interrupts.**- Je veux le faire .`interrupt_before=["human_review"]`标记一个节点,执行 会在该节点 运行前停止――状态 会被持久化――你的API向用户 返回等待批准──之后对同一个 `thread_id`- Je suis en train de faire ça .`Command(resume=...)`La demande est de reprendre l'exécution.

**Streaming.** `graph.stream(state, mode="updates")`Les États du delta sont en train de produire des rendements.`mode="messages"`Nœuds de modèle de flux 内部的LLM tokens。`mode="values"`Vous pouvez choisir lequel de ces images apparaîtra dans l'interface utilisateur.

**Time-travel.** `graph.get_state_history(thread_id)`Retourner le jour du checkpoint.`checkpoint_id`Je vous en prie .`graph.invoke`, tu peux depuis ce point de forge. Il est très adapté au débogage.

### Les réducteurs sont à la pointe

Chaque champ d'état a un réducteur. La plupart des comportements sont conformes.`operator.add`, de tels nouveaux messages seront ajoutés, plutôt que de remplacer. Les bords parallèles seront fusionnés par le réducteur.`messages`Tu as oublié .`Annotated[list, add_messages]`Le réducteur est la seule chose subtile de cette bibliothèque; l'écrire sur le reste, le composer naturel.

### Graphique de réaction de quatre nœuds

Un agent de production ReAct composé de quatre nœuds 和两条边缘:

1. `agent` Utiliser l'historique des messages 调用 LLM。 retourner le message d'assistant(dont peut contenir des appels d'outils)。
2. `tools` 执行最后一条助手消息 中所有工具_calls,并把工具结果 作为工具消息添加进去──
3. De `agent`Un bord conditionnel: si le dernier message a des appels à l'outil, alors la route à`tools`, sinon jusqu' à `END`Il y a une autre.
4. De `tools`Retour à`agent`Le bord statique.

C'est ainsi que tu peux obtenir une boucle ReAct complète avec environ 40 pages de code, avec un contrôle, des interruptions et des flux.

### StateGraph contre Envoyer

`Send(node_name, state)`允许一个节点发送平行子图――例:agent decide同时 query 三个 retrievers──每个 `Send`Les résultats de ces opérations sont effectués par fusion de réducteurs d'état. C'est ainsi que LangGraph exprime le modèle des travailleurs-orchestres en l'absence d'utilisation de primitifs de fil.

### Les sous-graphes

Un graphique compilé peut être utilisé comme un autre graphique de nœuds environnants. Un graphique externe est un seul nœud; un graphique interne possède son propre état et ses propres points de contrôle.


```figure
l5-state-graph-ledger
```

## - Je le construis.

### 步骤 1: état et nœuds

```python
from typing import Annotated, TypedDict
from langchain_core.messages import AnyMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

def agent_node(state: State) -> dict:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: State) -> str:
    last = state["messages"][-1]
    return "tools" if getattr(last, "tool_calls", None) else END

tool_node = ToolNode(tools=[search_web, read_file])

graph = StateGraph(State)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

app = graph.compile(checkpointer=MemorySaver())
```

`add_messages`C'est faire une liste de messages  cumuler plutôt que de couvrir un réducteur ⋅ oublier c'est le plus courant LangGraph bug ⋅

### 步骤 2: courir avec un fil

```python
config = {"configurable": {"thread_id": "user-42"}}
for event in app.stream(
    {"messages": [HumanMessage("find the Anthropic headquarters address")]},
    config,
    stream_mode="updates",
):
    print(event)
```

Chaque mise à jour est un dicton .`{node_name: state_delta}` Votre frontend peut envoyer ces flux à l'interface utilisateur, faire voir aux utilisateurs agent est en train de réfléchir... est en train de réutiliser search_web... obtient un résultat... répondent

### 步骤 3: 添加 interruption humaine dans le circuit

Marquez un nœud, laissez l'exécution suspendue avant qu'elle ne fonctionne.

```python
app = graph.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["tools"],  # pause before every tool call
)

state = app.invoke({"messages": [HumanMessage("delete the production database")]}, config)
# state["__interrupt__"] is set. Inspect proposed tool calls.
# If approved:
from langgraph.types import Command
app.invoke(Command(resume=True), config)
# If denied: write a rejection message and resume
app.update_state(config, {"messages": [AIMessage("Blocked by human reviewer.")]})
```

L'état, le point de contrôle et le fil sont interrompues.

### Étape 4: Pour le voyage dans le temps

```python
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.values["messages"][-1].content[:80], snapshot.config)

# Fork from a prior checkpoint
target = history[3].config  # three steps back
for event in app.stream(None, target, stream_mode="values"):
    pass  # replay from that point forward
```

Je ne sais pas .`None`作为输入 传入, se reproduira à partir d'un point de contrôle donné;传入一个值,则会在复习前将它作为更新添加到该点的状态上.

### 步骤 5: Remplacement du poste de contrôle pour la production environnementale

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://...") as checkpointer:
    checkpointer.setup()
    app = graph.compile(checkpointer=checkpointer)
```

SQLite、Redis 和 Postgres sont fournis`MemorySaver`Pour les tests, tout ce qui doit être redémarré doit être utilisé en magasin.

##  compétences

> Vous avez construit des agents pour des graphiques, plutôt que de`while True`Les boucles.

Avant d'utiliser LangGraph, faites d'abord un design de 60 secondes:

1. **命名 nodes。**Chaque décision ou action secondaire est un nœud. L'agent pense que l'outil fonctionne. L'examinateur approuve les flux de réponse. Si vous ne les sortez pas, cette tâche n'a pas de forme.
2. **声明 state。**Utilisez le plus petit typeDict,并为每个列表字段 配减机──不要把一切都塞进`messages`;把 champs spécifiques à la tâche`plan`Une.`budget`Un compteur`retrieved_docs`Liste) élever au plus haut niveau.
3. **画出 edges。**À part la prochaine étape dépendant de la sortie du modèle, sinon utilisez statique.
4. **一开始就选择 checkpointer。**Tests utilisés`MemorySaver`, autres scénarios utilisant Postgres/Redis/SQLite―ne pas publier en cas de non-checkpoint sans checkpoint, sans CV, sans interruption, sans voyage dans le temps―
5. **在 tools 运行前决定 interrupts，而不是运行后。**Les approbations  devraient être placées sur le bord du nœud d'effet secondaire, de sorte que vous puissiez être en mesure de causer l'effet avant de l'annuler; validation  devrait être placée sur le bord du modèle  après la sortie, de sorte que vous puissiez rejeter les mauvaises appels à faible coût.
6. **默认 stream。**Utilisation`mode="updates"`, modèles de nœuds  internes de flux au niveau des jetons `mode="messages"`,pour les photos complète de l'époque`mode="values"`Il y a une autre.

 refuse de publier sans point de contrôle ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent LangGraph ⇒ agent ⇒ agent LangGraph ⇒ agent ⇒ agent ⇒ agent`messages`champ 没有使用 `add_messages`作为减轻剂的LangGraph agent──

## 练习

1. **Easy.**Utiliser l'outil de calcul et l'outil de recherche Web 实现 ci-dessus de quatre nœuds ReAct graphique──验证对一个两转对话,`list(app.get_state_history(config))`Au moins, retournez à quatre points de contrôle.
2. **Medium.**J' ai une autre.`agent`之前运行的 `planner`Nœud,并向 état 写入结构化的 `plan: list[str]`Je vous en prie.`agent`Faites les étapes du plan.`plan`Dans le point de contrôle, le résumé est perdu.
3. **Hard.**构建一个监督图,使用 `Send`Dans trois sous-graphes`researcher`- Je suis là.`writer`- Je suis là.`reviewer`) entre les routes― chaque sous-graphe ont leur propre état 和 point de contrôle― dans le graphique extérieur  上添加 `interrupt_before=["writer"]`La recherche a été approuvée par l'homme. Il a été confirmé qu'il avait effectué un voyage dans le temps depuis un point de contrôle.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| StateGraph | “LangGraph graph” | 你在 compile 前向其中添加 nodes 和 edges 的 builder object。 |
| Reducer | “field 如何 merge” | 当 node 返回某个 field 的 update 时应用的函数 `(old, new) -> merged`；默认是 overwrite，`add_messages` 会 append。 |
| Thread | “一个 conversation ID” | 一个 `thread_id` 字符串，用于限定一个 session 的所有 checkpoints。 |
| Checkpoint | “一个 paused state” | node transition 后完整 graph state 的持久化 snapshot，以 `(thread_id, checkpoint_id)` 为 key。 |
| Interrupt | “暂停等待 human” | `interrupt_before` / `interrupt_after` 会在 node boundary 停止 execution；用 `Command(resume=...)` resume。 |
| Time-travel | “从之前的 step fork” | `graph.invoke(None, config_with_old_checkpoint_id)` 会从该 checkpoint 向前 replay。 |
| Send | “Parallel subgraph dispatch” | node 可以返回的 constructor，用于 spawn N 个 target node 的 parallel executions。 |
| Subgraph | “作为 node 的 compiled graph” | 在另一个 graph 中作为 node 使用的 compiled StateGraph；保留自己的 state scope。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) StateGraph, réducteurs, points de contrôle et interruptions
- [LangGraph concepts: state, reducers, checkpointers](https://langchain-ai.github.io/langgraph/concepts/low_level/) Le modèle mental utilisé dans ce cours, directement provenant de la source officielle.
- [LangGraph Persistence and Checkpoints](https://langchain-ai.github.io/langgraph/concepts/persistence/) 关于 Postgres/SQLite/Redis stores、checkpoint namespaces 和 thread IDs 的细节──
- [LangGraph Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/) `interrupt_before`- Je suis là.`interrupt_after`- Je suis là.`Command(resume=...)`Et le modèle de l'état de modification.
- [Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)](https://arxiv.org/abs/2210.03629) Chaque agent LangGraph a réalisé un modèle; lisez-le pour comprendre les traces de raisonnement.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) expliquer devrait être en quelque temps choisir quelles formes de graphes (chaîne, routeur, orchestrateur, ouvrier, évaluateur, optimisateur)
- Phase 11 · 09 (appel à la fonction)  Chaque nœud d'agent LangGraph 复用工具-call primitif。
- Phase 11 · 14 (Model Context Protocol)  Découverte des outils externes, via l'adaptateur MCP 接入 LangGraph `ToolNode`Il y a une autre.
- Phase 11 · 17 (compromise avec le cadre des agents)  何时选择 LangGraph, plutôt que CrewAI、AutoGen 或 Agno。
