# LangGraph  Máquinas do Estado do Agente

> O ciclo de ReAct é um.`while True` Usar o LangGraph 写的 ReAct loop é um gráfico, você pode olhar para o seu ponto de controle, interromper, ramificar, e realizar viagem no tempo.

**Type:** Build
**Languages:** Python
**前置要求:**Fase 11 · 09 (Calling for Function), Fase 11 · 14 (Model Context Protocol)
**Time:** ~75 minutes

## 问题

Você lançou um agente de chamada de função. Ele saiu normal, então saiu o problema: modelo tenta convocar uma ferramenta de retorno de 500, usuário muda de ideias no meio da missão, ou agente em caso de não ter assinatura humana decide o reembolso da encomenda.`while True:`Loop sem gancho. Não podes suspender, não podes voltar para trás, nem podes dividir. Se o modelo escolher outra ferramenta, vai mudar.

Quando você percebe isso, o próximo passo é muito claro. O agente é uma máquina de estado: sistema de prompt, cronologia de mensagens, ligações pendentes de ferramentas, mais uma ação.

LangGraph é a biblioteca que fornece essa abstração. Não é um quadro de agente no sentido de LangChain.

## 概念

![LangGraph StateGraph: nodes, edges, and the checkpointer](../assets/langgraph-stategraph.svg)

Um .`StateGraph`Há três coisas.

1. **State.**Um ditado tipado ([[TypedDict]] ou modelo Pydantic), vai estar no gráfico 中流动── cada nó recebe estado completo, e retorna a uma atualização parcial, o LongGraph vai usar cada campo para a sua *redutor* para combiná-los : para a lista de acumulações Usar `operator.add`- Não, não.
2. **Nodes.**Funções Python `state -> partial_state` cada nó é um passo separado: call the modelrun toolssummarize。
3. **Edges.**Os nós  entre transições。Ras estáticas 指向固定位置。Ras condicionais 接收一个路由函数 `state -> next_node_name`, deixe o gráfico pode ser baseado em modelo de saída dividindo

Você vai compilar este gráfico. Compile a topologia de ligação, adicione um ponto de verificação.`thread_id`调用它── cada etapa de execução                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `(thread_id, checkpoint_id)`Por um ponto de controlo chave.

### Quatro supercapacidades

**Checkpointing.**Cada transição de nó vai colocar um novo estado de memória, produto, postgres/redis/SQLite.`thread_id`Re-reajustar gráfico 即可再起──graph 会从暂停的位置继续──

**Interrupts.**- Não .`interrupt_before=["human_review"]`标记一个节点,执行 会在该节点 运行前停止――状态 会被持久化――你的API向用户 返回等审批──之后对同一个 `thread_id`- Não .`Command(resume=...)`O pedido é de retomada da execução.

**Streaming.** `graph.stream(state, mode="updates")`O estado dos deltas produz os mesmos.`mode="messages"`会 stream model nodes 内部的LLM tokens──`mode="values"`Vai produzir instantâneos completos. Você pode escolher qual é a sua imagem.

**Time-travel.** `graph.get_state_history(thread_id)`返回完整检查站日志──把任意之前的 `checkpoint_id`Transmitir .`graph.invoke`, você já pode partir daquele ponto de garfo. É muito adequado para depurar o modelo.

### Redutores 才是重点

Cada campo de estado tem um redutor. A maioria dos valores de dados não tem problema.`operator.add`, tais novas mensagens serão adicionadas, em vez de substituir.`messages`E tu esqueceste-te .`Annotated[list, add_messages]`O redutor é a única coisa delicada nesta biblioteca; escreve-a sobre o resto, o resto é natural.

### Quatro nós do gráfico ReAct

Um agente ReAct de produção de quatro nós 和两条边缘 组成:

1. `agent` 用当前消息史 调用 LLM──返回助理消息(其中可能包含工具_calls)──
2. `tools`  Execute última frase assistente de mensagem 中所有 tool_calls,并把 tool results 作为 tool messages append 进去──
3. De`agent`Uma vantagem condicional: se a última mensagem tiver ferramentas, o caminho para`tools`,否则到 `END`- Não.
4. De`tools`Volta para lá`agent`De uma linha estática.

É assim. Você usa cerca de 40 行代码, assim você consegue obter um ciclo completo de ReAct. Pensamento → Ação → Observação → Pensamento → ...), ao mesmo tempo com checkpointing, interrupções e streaming.

### StateGraph vs Enviar (Fanout)

`Send(node_name, state)`允许一个节点发送并行子图――例:agent decide同时 query 三个 retrievers──每个 `Send`A cidade gerou uma execução paralela do nó-alvo; suas saídas serão realizadas através da fusão do redutor de estado.

### Subgrafos

Um gráfico compilado pode ser usado como outro gráfico de nódo em meio. Um gráfico externo pode ser visto como um único nó; um gráfico interno pode ser visto como um único nó; um gráfico interno pode ser visto como um único nó; um gráfico interno pode ser visto como um único nódo; um gráfico interno pode ser visto como um único nódo; um gráfico interno pode ser visto como um único nódo; um gráfico interno pode ser visto como um único nódo; um gráfico interno pode ser visto como um único nódo; um gráfico interno pode ser visto como um único nódo; um gráfico interno pode ser visto como um único nódo.


```figure
l5-state-graph-ledger
```

## Construí-lo

### 步骤 1: estado e nós

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

`add_messages`É fazer a lista de mensagens  acumulação em vez de redução de cobertura. Esqueça que é o bug LangGraph mais comum.

### 步骤 2: correr com um fio

```python
config = {"configurable": {"thread_id": "user-42"}}
for event in app.stream(
    {"messages": [HumanMessage("find the Anthropic headquarters address")]},
    config,
    stream_mode="updates",
):
    print(event)
```

Cada atualização é um ditado .`{node_name: state_delta}` O seu frontend pode colocar esses fluxos para a UI, deixando os usuários ver agente está pensando... está a utilizar o search_web... obtendo resultados... está a responder

### 步骤 3: 添加 humano-em-o-loop interrupção

Marque um nó, deixe a execução parar antes que ele funcione.

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

O estado, o ponto de verificação e o fio estão interceptados. Excepto durante a execução, nada existe na memória.

### Passo 4: Usar para o tempo de viagem de调试

```python
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.values["messages"][-1].content[:80], snapshot.config)

# Fork from a prior checkpoint
target = history[3].config  # three steps back
for event in app.stream(None, target, stream_mode="values"):
    pass  # replay from that point forward
```

- Não .`None`Como entrada 传入, vai de um determinado ponto de verificação replay;传入 um valor, vai em resumo antes de colocá-lo como uma atualização apêndice para esse ponto de verificação estado.

### 步骤 5: Substituição do ponto de controlo para o ambiente de produção

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://...") as checkpointer:
    checkpointer.setup()
    app = graph.compile(checkpointer=checkpointer)
```

O SQLite、Redis 和 Postgres já foi fornecido.`MemorySaver`Para testes, qualquer coisa que precise de restartes, deve ser usada na loja real.

## 技能

> Tu fizeste os agentes para graficos, em vez de`while True`Loops.

Antes de usar LangGraph, primeiro faça um design de 60 segundos:

1. **命名 nodes。**Cada decisão ou ação de efeitos colaterais são um nódo. O agente pensa que a ferramenta funciona. O revisor aprova os fluxos de resposta.
2. **声明 state。**Use Minimum TypedDict,并为每个 list field 配 reducer──不要把一切都塞进 `messages`;把 tarefas específicas campos`plan`Um.`budget`Contador um`retrieved_docs`Lista) elevado ao nível superior.
3. **画出 edges。**Além de que o próximo passo depende da saída do modelo, ou então use estática. Todas as bordas condicionais precisam de uma função de roteador com ramos nomeadas.
4. **一开始就选择 checkpointer。**testes `MemorySaver`Não publicar em condições sem ponto de checagem, sem resumo, sem interrupção, sem viagem no tempo.
5. **在 tools 运行前决定 interrupts，而不是运行后。**As aprovações devem ser colocadas na borda do nó de efeitos colaterais, para que você possa causar antes de cancelar; validação deve ser colocada na borda do modelo após a saída, para que você possa rejeitar chamadas ruins em baixo custo.
6. **默认 stream。**Utilizador`mode="updates"`, nó modelo  interna de nível de token streaming us `mode="messages"`,ev                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `mode="values"`- Não.

拒绝发布没有检查点的 LangGraph代理──拒绝发布在副作用后才中断的 LangGraph代理──拒绝发布 `messages`campo 没有使用 `add_messages`Como agente de LangGraph de redução.

## 练习

1. **Easy.**Utilize ferramenta de calculadora e ferramenta de pesquisa na web  implementar o gráfico ReAct de quatro nós acima.`list(app.get_state_history(config))`Pelo menos, volte aos quatro pontos de controlo.
2. **Medium.**- Adicione um.`agent`之前运行的 `planner`nó,并向状态 写入结构化的 `plan: list[str]`- Não.`agent`"Planejar as etapas "se o fizer".`plan`Em checkpoint resume 后丢失 (redutor) 错误 (error),测试应失败 (sucesso)
3. **Hard.**构建一个监督图,使用 `Send`Em três subgrafos`researcher`- Não.`writer`- Não.`reviewer`) entre as rotas. Cada subgrafo tem seu próprio estado e ponto de controle.`interrupt_before=["writer"]`O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é.

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

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) StateGraph、redutores、checkpoints 和 interrupts of power reference―
- [LangGraph concepts: state, reducers, checkpointers](https://langchain-ai.github.io/langgraph/concepts/low_level/) Este modelo mental usado neste curso, directamente proveniente da fonte oficial.
- [LangGraph Persistence and Checkpoints](https://langchain-ai.github.io/langgraph/concepts/persistence/) 关于 Postgres/SQLite/Redis stores、checkpoint namespaces 和 thread IDs 的细节──
- [LangGraph Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/)- Não .`interrupt_before`- Não.`interrupt_after`- Não.`Command(resume=...)`和 edit-state padrão
- [Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)](https://arxiv.org/abs/2210.03629) Cada agente de LangGraph tem um padrão de realização; lê-lo e compreenda as bases do raciocínio.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) Explicar que deve-se escolher quais formas de gráfico (chains, routers, orquestra-trabalhadores, avaliadores-optimizadores)
- Fase 11 · 09 (Calling Function)  Cada nodo de agente LangGraph 复用工具-call primitivo。
- Fase 11 · 14 (Modelo de Protocolo de Contexto)  Desenvolvimento de ferramentas externas, via adaptador MCP 接入 LangGraph `ToolNode`- Não.
- Fase 11 · 17 (Compromissos com o quadro de agentes)  何时选择 LangGraph, em vez de CrewAI、AutoGen 或 Agno。
