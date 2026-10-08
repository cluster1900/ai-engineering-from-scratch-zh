# LangGraph:Graphs estáveis com execução duradoura

> LangGraph é o padrão de referência para a orquestração estadual de baixo nível de 2026: o agente é um estado; os nós são funções; os bordos são estados transferidos; o estado é imutável e, em cada passo, um ponto de verificação. Qualquer fracasso pode ser feito através de um resumo preciso.

**类型：**学习 + 构建
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 01 (Loop de Agentes), Fase 14 · 12 (Patrões de Fluxo de Trabalho)
**时间：**- 75 minutos.

## Objectivo de aprendizagem

- Descrição do modelo central de LangGraph:带有不变状态、功能节点、条件边和后步检查点的状态机――
- O que é um dos principais aspectos da vida de um homem é a sua capacidade de ser humano.
- 解释 LangGraph 支持的三种管弦乐类型:supervisor、peer-to-peer (swarm)、hierárquico (subgraphs nested)。
- 实现 um gráfico de estado stdlib, contendo estados imutáveis, bordas condicionais, bem como o ciclo de checkpoint/resume.

## 问题

Agentes e fluxos de trabalho têm um problema comum: quando um funcionamento de 40 passos falha no passo 38, você deseja retomar no passo 38, em vez de começar.

A resposta ao design do LangGraph é: estado é um objeto tipado de igual, mutações são evidentes, e os pontos de controle vão permanecer em cada nó.`load_state(session_id)`- Não.

## 概念

### gráfico

Um gráfico definido por:

- **State type.**Um modelo tipado (ou modelo Pydantic), cada nó cidade irá ler e modificar-o.
- **Nodes.**纯函数 `(state) -> state_update`❖ Atualizações 会在返回后合并进状态──
- **Edges.**Transições condicionais ou diretas entre nós.
- **Entry and exit.** `START`和 `END`Os nós sentinela 标记边界。

exemplo: um contendo`classify`- Não.`refund`- Não.`bug`- Não.`sales`- Não.`done`Agente de nós, é um fluxo de trabalho de roteamento em forma de gráfico.

### Execução duradoura

Cada nó  retornar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `resume(session_id)`,并带带精确状态 从第 N+1 步继续──

LangGraph 文档 claramente enfatizou a importância desta questão para os usuários de produção:Klarna、Uber、J.P. Morgan──

### Transmissão

Cada nó pode produzir uma saída parcial. Grafico irá para o fluxo de chamadas por eventos no delta do nó, deixando a interface em funcionamento.

### Homem no circuito

Em nós, verifica e modifica o estado. Como se pode fazer: em nós críticos, pre-emporta, mostra o estado ao ser humano, aceita a modificação e retoma.

### Memória

Curto prazo (一次运行内,即状态中的对话史) e longo prazo (跨运行,即通过检查点加上独立长期存储 持久化)

### Três topologias

1. **Supervisor.**O roteador central LLM, distribuído para sub-relatores especializados.`langgraph-supervisor`Em meio`create_supervisor()`(Embora a LangChain 团队 em 2026 recomenda diretamente através de chamadas de ferramentas para fazer, para obter um melhor controle de contexto)
2. **Swarm / peer-to-peer.**Agentes através da superfície de ferramentas compartilhadas, de mãos dadas, sem roteador central.
3. **Hierarchical.**Supervisores 管理 sub-supervisores,以 subgrafos aninhados ⋅ realizado

### Este é um lugar fácil de se errar.

- **Checkpoints too small.**Apenas a conversa do checkpoint gira 会让 tool state 和 memória escreve 无法恢复──Full state 必须可序列化──
- **Non-deterministic nodes.**Resume 假设 node inputs 会产生 the same state update── sementes aleatórias、mural-clock、external APIs 都 must be captured──
- **Over-use of conditional edges.**Cada arredondada é um gráfico condicional, um estado de estado inconcebível.


```figure
langgraph-state
```

## Construí-lo

`code/main.py`实现 um gráfico de estados stdlib:

- `State`: um ditado tipado, contendo `messages`- Não.`step`- Não.`route`- Não.`output`- Não.`human_approval`- Não.
- `Node`: Receber estado 并返回 update dict 的调用式──
- `StateGraph`:nodos + bordas + bordas condicionais + execução + resumado。
- `SQLiteCheckpointer`(in-memory fake): em cada nó 后序列化 estado;`load(session_id)`- Recuperação.
- Uma demonstração gráfica:classificar -> filial(reembolso / bug / vendas) -> portal humano -> enviar。

- Não .

```
python3 code/main.py
```

Trace 会 mostrou o primeiro funcionamento em portal humano 失败、完成持久化, então retomar e produzir o resultado final―

## Use-o

- **LangGraph**: referência realização, produção-pronta, utilização`create_react_agent`- Não.`create_supervisor`, ou construir o seu próprio gráfico.
- **AutoGen v0.4**(Lessão 14): Adaptado a cenários de alta concorrência.
- **Claude Agent SDK**(Lessão 17): Arneses gerenciados de loja de sessões integrada.
- **Custom**Quando você precisa de um estado de forma ou de um ponto de verificação de fundo  para realizar um controle preciso

## Entrega-o

`outputs/skill-state-graph.md`会在任意目标 runtime 中生成一个LangGraph-shaped state graph,并接好检查点与恢复──

## 练习

1. Quando a confiança na classificação é baixa em relação ao valor,`classify`添加一条 margem condicional até `end`: Em humanos`route`后 resume 运行──
2. Para substituir o falso de SQLite para o verdadeiro ponto de verificação SQLite.
3. 实现 bordas paralelas: dois nós 并发运行,并通过 custom reducer 合并──Immutable state 在这里带来了什么?
4. 阅读 `langgraph-supervisor`Referência:`create_supervisor`❖ Comparar formas de vestígios―
5. 添加流: cada nó em execução produz estado parcial.

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| State graph | “Agent 即状态机” | Typed state + nodes + edges + reducers |
| Checkpointer | “Persistence backend” | 在每个 node 后序列化 state；支持 resume |
| Reducer | “State merger” | 将当前 state 与 node update 组合起来的函数 |
| Conditional edge | “Branch” | 由 state 函数选择的 edge |
| Subgraph | “Nested graph” | 作为另一个 graph 中 node 使用的 graph |
| Durable execution | “从失败处 resume” | 使用精确 state 从最后一个成功 node 重启 |
| Supervisor | “Router LLM” | 面向 specialist subagents 的 central dispatcher |
| Swarm | “P2P agents” | Agents 通过 shared tools hand off；没有 central router |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) documentos de referência
- [langgraph-supervisor reference](https://reference.langchain.com/python/langgraph/supervisor/) API de padrão de supervisão
- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) actor-modelo 替代方案
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) loja de sessões e subagentes
