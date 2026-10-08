# Modelo primitivo multi-agente

> Cada framework multi-agente lançado em 2026  AutoGen、LangGraph、CrewAI、OpenAI Agents SDK、Microsoft Agent Framework  都是四维设计空间中的一个点──四个原始人,仅此而已:agent、handoff、shared state、orchestrator──本课从零构建它们,运行一个玩具系统在四人上,然后将每个主流框架 映射到同一组坐标轴上,让你能用一段话读懂任何新发布版本──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## 问题
Cada seis meses, haverá um novo framework multi-agente 发布──2023 年 AutoGen──2024 年 CrewAI──2024 年 LangGraph 和 OpenAI Swarm──2025 年4月 Google ADK──2026 年2月 Microsoft Agent Framework RC── cada comunicado de imprensa afirmam ser uma abstracção verdadeira──

Se você tentar aprender individualmente, você vai ficar cansado. Apis parecem diferentes.

Não é assim. Em termos de marketing, quatro primitivas são estabilizadas.

## 概念
### Os quatro primitivos

1. **Agent** Um sistema de prompt + uma lista de ferramentas── sem estado; cada vez que você executa tudo do seu sistema de prompt 和当前消息史──开始──
2. **Handoff**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
3. **Shared state** 任何能被多个代理 读取(有时也能写入) de estrutura de dados.
4. **Orchestrator** decidir下一个由谁发言的角色──选项包括:显式图表 (显式图表) 确定性 (确定性) 、LLM orador-selector (soft) 、上一位 orador's hand-off call (OpenAI Swarm), ou queue (上) ⋅ cronista (swarm architecture) ⋅

É o espaço de design completo. Cada quadro tem um valor de seleção em formato de texto.

### Como cada quadro 2026 mapeia para ele

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | tool returns Agent | caller's problem | the LLM's next handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | speaker-selector on GroupChat | message pool | selector function (LLM or round-robin) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Task outputs chained | manager LLM or static order |
| LangGraph | node function | graph edge + condition | `StateGraph` reducer | the graph, deterministic |
| Microsoft Agent Framework | agent + orchestration patterns | pattern-specific | thread / context | pattern-specific |
| Google ADK | agent + A2A card | A2A task | A2A artifacts | host decides |

A diferença de superfície parece grande.

### Por que isto importa

Uma vez que olhamos para os primitivos, a comparação de estruturas torna-se uma lista de verificação simples:

- O orquestrador é o que quer dizer que o roteiro está fixado no código?
- Estado compartilhado é história completa (GroupChat), ou projetado (Redutor de Estatograma)?
- Os agentes podem mudar as instruções uns dos outros, ou só podem dar as mãos?

Estas três questões podem responder a um quadro se se adapta a 80% de um problema específico.

### A visão sem Estado

Além do estado compartilhado, cada primitivo está sem estado. O agente é uma função (prompto, ferramentas).**系统中唯一有状态的东西是 shared state。**Todos os bugs interessantes vivem lá: envenenamento da memória (Lessão 15)

 Hidden frameworks of shared state (quadro de estado compartilhado)  Swarm)  vai colocar o problema no usuário  concentração de gestão de frameworks de estado compartilhado  LongGraph checkpoint  AutoGen pool)  deixá-lo inspeccionável, mas  vai transferir o custo de coordenação  para a implementação de estado compartilhado 

### Anatomia de um único primitivo

#### Agente .

```
Agent = (system_prompt, tools, model, optional_name)
```

没有记忆――没有状态――拥有相同的系统提示和工具的两个代理是可互换的――任何东西看起来像每代理状态的东西,实际上都在共享状态或handoff协议中――

#### Transmissão

```
Handoff = (from_agent, to_agent, reason, payload)
```

Três tipos de realização:

- **Function return** ferramenta 返回下一个代理── é um padrão de OpenAI Swarm── agentes transportam roteamento em seus próprios esquemas de ferramentas──
- **Graph edge** LangGraph──Edges is declar式的──LLM 生成一个值;condition 选择下一个节点──
- **Speaker selection** AutoGen GroupChat──selector função(有时它本身也是一次LLM call)读取池并选择下一位发言者──

#### Estado comum

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

Minimálmente é uma mensagem 列表──通常更多:artefactos estruturados(CrewAI Outputs Tasks)、tipo de contexto(Langgraph reducers)、memória externa(MCP、vector DB)。

两种类型:**full pool**(cada agente vai ver cada mensagem)**projected**(agentes ver por visão de papel escopo) ――Pools completos 简单但扩展性差──Pools projetados podem ser expandidos, mas precisam de pré-conceito esquema──

#### Orquestra

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

Quatro tipos:

- **Static** gráfico em construção tempo 固定(LangGraph determinista、CrewAI Sequencial)。
- **LLM-selected** LLM 读取 pool 并选择下一位讲者(AutoGen、CrewAI Hierarquial)
- **Handoff-driven** 当前代理 通过调用手渡工具 来决定(Swarm) 』
- **Queue-driven** trabalhadores da fila compartilhada 拉取任务; não há aparente próximo-falantes

### Que alterações ocorrem entre os quadros

Uma vez que os primitivos são fixos, o que resta é a decisão de design:

- **Memory strategy** ponto de controlo efêmero versus duradouro (ponte de controlo Langgraph)
- **Safety boundary**Quem pode aprovar a transferência?
- **Cost accounting** orçamentos de tokens por agente。
- **Observability**- Traçar as transferências, para repetição.

Tudo isso pode ser realizado em primícias. Não são primícias novas.


```figure
a5-primitive-radar
```

## Construí-lo
`code/main.py`Usando cerca de 150 páginas de Python  implementar quatro primitivas  Não há um LLM real  Cada agente são uma política scripted, portanto, o foco é manter a estrutura de coordenação 

O documento é enviado:

- `Agent` 包含 name、system prompt、tools、policy function 的数据类──
- `Handoff` 返回新代理的功能──
- `SharedState` Poço de mensagens sem fio
- `Orchestrator` 三个变体:`StaticOrchestrator`- Não.`HandoffOrchestrator`- Não.`LLMSelectorOrchestrator`(simulado)

demo 通過所有三种管弦演唱器类型 运行同一个三代理管道(recerca → escrever → revisão), e finalmente imprimir a piscina de mensagens── você pode ver, a diferença de saída depende apenas de *quem escolhe o próximo*; agentes 和 estado compartilhado 在每次运行中完全相同──

- Não .

```
python3 code/main.py
```

预期输出: 三次 orkestrator runs,每种模式 一次──每次都会印印最终 message pool──如果研究员 判断已经提前完成,赞助驱动运行 会到达更少的代理 这就是LLM-routing tradeoff 的缩写版──

## Use-o
`outputs/skill-primitive-mapper.md`É uma habilidade, ele lida qualquer código base multi-agente ou documento-quadro, e retorna a mapeamento primitivo quatro.

## Entrega-o
Em termos de definição, a definição de um sistema de dados é uma forma de análise de dados.

Colocar o mapeamento fixado em seu arquitetura doc 中──当新团队成员 加入时,先把 mapping 发送给他们,再发送 API docs──当框架版本 变化时,对比对 mapping,而不是变更洛格──

## 练习
1. Com diferentes políticas de agentes`code/main.py`O que é que o "Conselho" vai fazer?
2. 实现第四种管弦乐器类型:排队驱动,其中的代理人 轮询共享状态 寻找工作.
3. 取 LangGraph quickstart (https://docs.langchain.com/oss/python/langgraph/workflows-agents), transformá-lo em quatro primitivas. Quais são as abstrações do LangGraph que são 1:1 映射, quais são as envolturas de conveniência?
4. 阅读 OpenAI livro de cozinhahttps://developers.openai.com/cookbook/examples/orchestrating_agentsO que é que é o mais ergonômico, e o que é que é o mais impulsionador?
5. Neste quadro, encontrar um quadro de estado compartilhado completamente oculto.

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
- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) Para a orquestração dirigida por mão
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) GrupoChat + seleção de oradores é a orquestração selecionada pelo LLM para realizar
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Orquestração de bordas de gráfico e estado compartilhado baseado em redutor
- [CrewAI introduction](https://docs.crewai.com/en/introduction) agentes de papel-objetivo-conhecimento,processos sequenciais/hierárquicos
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2) Microsoft vai transferir v0.4 para manutenção  ainda está ativo de AutoGen v0.2 
