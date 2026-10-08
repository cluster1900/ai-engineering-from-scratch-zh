# Estrutura de Agentes 取舍  LangGraph vs CrewAI vs AutoGen vs Agno

> Cada framework está vendendo a mesma demo (recerca de um agente de construção), também está em um mesmo bug (estado de esquema e camada de orquestração) e se batendo entre si.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 minutes

## 问题

Você tem uma tarefa, precisa não parar de uma chamada de LLM. Talvez seja um fluxo de trabalho de pesquisa. Talvez seja um fluxo de trabalho de pesquisa. Talvez seja um fluxo de revisão de código. Talvez seja um fluxo de revisão de código. Talvez seja um assistente de várias rotas.

Três dias depois, você descobriu que a abstracção deste framework começou a sair de água. A equipe te deu papéis, mas quando o pesquisador precisa de um plano estruturado para o escritor, ele vai comparar-se com você.

O método de reparação não é escolher o melhor quadro, mas sim adaptar o abstracto central do quadro à sua forma de problema.

## 概念

![Agent framework 矩阵：核心抽象 vs 问题形状](../assets/framework-matrix.svg)

Quatro quadros principais orientam a paisagem de 2026:

| Framework | 核心抽象 | 最适合 | 最不适合 |
|-----------|----------|--------|----------|
| **LangGraph** | `StateGraph` — typed state、nodes、conditional edges、checkpointer。 | 有显式 state 和 human-in-the-loop interrupts 的 workflows；需要 time-travel debugging 的 production agents。 | 拓扑未知、由 role 驱动的松散 brainstorming。 |
| **CrewAI** | `Crew` — roles（goal、backstory）、tasks、process（sequential 或 hierarchical）。 | 有短线性/层级 plan 的 role-playing 或 persona-driven workflows。 | 超出 crew turn history 的任何 stateful 场景；复杂 branching。 |
| **AutoGen** | `ConversableAgent` pair — 两个或更多 agents 轮流说话，直到满足 exit condition。 | Multi-agent *dialogue*（teacher-student、proposer-critic、actor-reviewer），其中思考从 chat 中涌现。 | 有已知 DAG 的 deterministic workflows；任何需要跨重启 durable state 的场景。 |
| **Agno** | `Agent` — 单个 LLM + tools + memory，可组合成 teams。 | 快速构建 single agents 和 lightweight teams；强 Multimodality 和内置 storage drivers。 | 带 custom reducers 的深度、显式分支 graphs。 |

### O que é que isso significa?

Um resumo central de uma estrutura é o que você pinta no quadro branco, quando fala de arquitetura.

- **LangGraph**→ Você desenha um gráfico. Os nós são passos, as bordas são transições, cada ponto do objeto de estado é tipado.
- **CrewAI**→ Você desenha um organograma. Cada papel tem uma descrição de emprego.
- **AutoGen**→ Você desenha um Slack DM── dois agentes 互发消息; se precisar de moderador, terceiro 加入──mental modelo é chat──
- **Agno**→ Você desenha uma caixa individual, ao lado de ferramentas.

### Estado  problem

O Estado é o lugar onde a maioria dos sistemas de produção se desmorona.

- **LangGraph.**Estado tipográfico`TypedDict`O modelo Pydantic) 、 por campo reductores、一等 checkpointers (SQLite/Postgres/Redis)  Resume、interrupto 和 time-travel 都是免费的──*((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((
- **CrewAI.**Estado    `context`campo 以字符串形式在任务之间流动, ou através `output_pydantic`结构化传递──开箱没有持久的每员工店;如果员工必须在重启后生存,你需要自己接上──
- **AutoGen.**Estado é histórico de bate-papo e qualquer usuário definido `context`❖ Transcrições de conversação podem ser mantidas; estado de fluxo de trabalho arbitrário não será mantido, a menos que você escreva adaptadores。
- **Agno.**内置 armazenamento drivers(SQLite、Postgres、Mongo、Redis、DynamoDB), através `storage=`- Não .`Agent`上  sessões de conversação 和 memórias do usuário 会自动持久化──它不是完整图标检查点;而是会议存储──

### Branching 问题

Cada agente extraordinário tem uma ramificação.

- **LangGraph** Por você decidir, através de bordas condicionais。 Routing é o nome de ramos de Python função。 Ramos são um objeto do tipo em meio ao gráfico compilado; checkpointer 会记录 adoptou哪条 branch。
- **CrewAI** modo hierárquico  modo sequencial  modo de decisão  modo de decisão  modo de decisão  modo de decisão  modo de execução  modo de decisão  modo de decisão  modo de execução  modo de decisão  modo de decisão  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução  modo de execução                                                                                                                                                          
- **AutoGen** agentes 通過聊天決定── Branching 从下一个发言者中涌现──`GroupChatManager`选择 next speaker; você pode escrever `speaker_selection_method`Mas, de acordo com o Mestrado em Direito Jurídico,
- **Agno** agente 通過下一步调用哪个工具来决定──Teams have coordinator/router/collaborator mode; além destas ramificações é responsabilidade do desenvolvedor──

### Observabilidade 问题

- **LangGraph**  através de LangSmith ou qualquer exportador de OTel Use OpenTelemetry。 cada transição de nós são traços de tempo; pontos de verificação 同时也是可播放的痕迹。 LangSmith é um programa de primeira parte 选项; Langfuse/Phoenix também tem adaptadores。
- **CrewAI** Desde 2025 anos de fim de anos, apoiar OpenTelemetry; integrar Langfuse、Phoenix、Opik、AgentOps。
- **AutoGen**  através `autogen-core`集成 OpenTelemetry;AgentOps 和 Opik têm conectores。 Tracking 粒度 é por agente-mensagem, não por nó¬do¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- **Agno** 内置 `monitoring=True`Flag 加 OpenTelemetry exportadores;

### Custo e latência

O quadro de trabalho é um conjunto de técnicas de gestão de dados e de dados que podem ser utilizados para a realização de um processo de avaliação de dados e de dados.`GroupChatManager`Também é assim. LangGraph só se escrever.`llm.invoke`O caminho de Agno é muito pequeno.

Quando o custo de cada operação importante                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    `speaker_selection_method`), em vez de um itinerário selecionado pela LLM.

### Interoperabilidade

- **LangGraph**- Não .**LangChain**Ferramentas ∆ retrievers ∆ LLMs¬;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
- **CrewAI** ferramentas 继承自 `BaseTool`As ferramentas de LangChain, as ferramentas de LlamaIndex e as ferramentas de MCP podem ser adaptadas para o processo de desenvolvimento.`allow_delegation=True`Fazer uma delegação de tripulação em tripulação.
- **AutoGen**→ `FunctionTool`包装任何Pythoncallable;有MCPadapter──对代理对代理模式与AG2生态系统 紧密合──
- **Agno**→ `@tool`Decorador ou subclasse BaseTool; adaptador MCP; ferramentas podem ser compartilhadas entre agentes e equipes.

## 技能

> Pode explicar por que um quadro se adapta a um agente.

构建前 checklist:

1. **画出形状。**É um gráfico?Jogo de papel?Especialistas?São trabalhos?Chat?Agentes?São trabalhos até que sejam concluídos?
2. **决定谁来 branching。**A ramificação decidida pelo desenvolvedor → LangGraph──Manager-agent-decidido → CrewAI hierárquico──Chat-emergent → AutoGen──Tool-call-decidido → Agno──
3. **检查 state budget。**Se é, o LangGraph é uma escolha em linha reta; sessões de trabalho  cobrir o estado de escala de conversação。
4. **检查 cost budget。**Roteamento selecionado pela LLM Cada rotina de tokens de extra-florão. Se um agente diariamente opera mil vezes, priorizar o roteamento explícito.
5. **为 framework overhead 做预算。**Cada framework é uma outra dependência. Se a tarefa for apenas duas chamadas de LLM e uma ferramenta, escreva 30 行 Python simples; sem qualquer framework é mais barato do que sem framework.

Antes de desenhar um gráfico, um gráfico, um chat ou uma caixa de agentes, rejeite a estrutura.

##  decisão 矩阵

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

1. **Easy.**取同一个任务  research Antropic's headquarters, escrever um resumo de 200 palavras, citar fontes   分別使用 LangGraph(四个节点:plan、search、write、cite) 和 CrewAI(三角色: researcher、writer、editor) 实现──报告每次运行的代码行数和代码行数──
2. **Medium.**Utilize AutoGen  pesquisador  escritor chat, editor  através `GroupChat`加入) 和 Agno(带 `search_tools`和 `write_tools`de um único agente, reúne sessão loja) construir a mesma tarefa。 em (a) custo de cada vez de operação, (b) resumindo após o acidente  capacidade, (c) em escrever passo 前注入人类批准的能力,对四个实现排序──
3. **Hard.**Construir um script de árvore de decisão `pick_framework.py`, aceitar um breve problema descrição(JSON:`{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`),并返回推和一句话理由──用你自己设计的六个案例 验证它──

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

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) StateGraph, checkpoints, interrupções, viagens no tempo
- [CrewAI documentation](https://docs.crewai.com/) Equipes, Fluxos, Agentes, Tarefas, Processos
- [AutoGen documentation](https://microsoft.github.io/autogen/) ConversableAgent,GroupChat,teams,tools,
- [Agno documentation](https://docs.agno.com/) Agente, equipa, fluxo de trabalho, armazenamento, memória.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) Com framework 无关的图案库(prompte chaining、routing、parallelization、orchestrator-workers、evaluator-optimizer)
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629)Cada estrutura da cidade é um ciclo de montagem.
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155) Papel de design do AutoGen
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442) CrewAI 风格 persona stacks 建立其上角色扮演基础──
- Fase 11 · 16 (LangGraph)  本课用来基准的框架──
- Fase 11 · 19 (Reflexão)  一个能干净映射到 LangGraph、但映射到 CrewAI 会很不同的扭曲模式──
- Fase 11 · 22 (Observabilidade de produção)  如何仪器 你选择的任何框架──
