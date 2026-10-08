# CrewAI: Baseado em personagens

> A CrewAI é um framework multi-agente baseado em papéis de 2026: quatro componentes básicos: Agente, tarefa, tripulação, processo, duas formas de topo: equipes, autônoma, colaboração baseada em papéis e fluxos.

**类型：**学习 + 构建
**语言：**Python (stdlib)
**先修：**Fase 14 · 12 (Patrões de Fluxo de Trabalho), Fase 14 · 14 (Modelo de ator)
**时间：**Cerca de 75 minutos

## Objectivo de aprendizagem

- Explicar os quatro componentes básicos da CrewAI (Agente, tarefa, tripulação, processo) e cada componente responsável por quê?
- 区分 Sequencial、Hierárquico 和 planejado processo de consenso; para cada classe de trabalho carga escolher um modo。
- 区分 Crews (basado em funções de autônomos) e Flow (Flows) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxos) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Flu) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Fluxes) (Flu) (Fluxes) (Flu
- Utilização `@tool`decorador 和 `BaseTool`Subclasse 接入 tools; compreender as saídas estruturadas e a utilização de texto livre.
- Explique quatro tipos de memória CrewAI, bem como cada um em que momento vale a pena usar.
- 实现一个工作三 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 经纪人团队 报告 报告
- 识别三种 CrewAI fail modes:immediato-bloat, gerente-LLM tax, brilhantes entregas,

## 问题

 O grupo de um quadro multi-agente vai bater na mesma parede   Colaboração autônoma  em demonstração ̶ parece muito bom   Então o cliente apresenta um bug, você precisa de repetição determinista                                                                                                                                                                                                                                   

A forma livre, as equipes do LLM não conseguem responder a estas questões de forma clara.

A divisão da tripulação da AI baseia-se na sua criação. As equipes usam o processo de colaboração, baseado em papéis, trabalho exploratório.

## 概念

### Quatro componentes básicos

A superfície da tripulação é pequena.

- **Agent。** `role + goal + backstory + tools + (optional) llm`⋅ backstory 很关键──它塑造语气、判断,以及 agent 何时停止──Tools is agent 可以调用函数(下面会讲)──
- **Task。** `description + expected_output + agent + (optional) context + (optional) output_pydantic`❖ Unidades de trabalho utilizáveis`expected_output`É um acordo.`context`列出上游任务,其输遇被传入──`output_pydantic`强制使用结构化形态──
- **Crew。**- Container.`agents`Lista de`tasks`Lista de`process`, e opções `memory`+ `verbose`+ `manager_llm`- A configuração.
- **Process。**执行策略──Sequenciais、Hierárquicos、Consenso(plano中)──

Agentes não se verão diretamente entre si. Tasks 引用 agents. Crew                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

> **已针对**CrewAI 0.86(2026-05)验证──更新版本可能会重新命名或合并过程类型;在依赖具体形态之前,请查看 [CrewAI Processes docs](https://docs.crewai.com/concepts/processes)- Não.

### Sequência, Hierarquia e Consenso

- **Sequential。**As tarefas 按声明顺序运行──Task N 的输出可作为 `context`提供给任务 N+1──成本最低──最可预测──当顺序固定时使用──
- **Hierarchical。**Um agente gerente (~) chamada de LLM individual) entre especialistas 〜 rotadas.`manager_llm`Config ou Configuração de Configuração gerente de geração. gerente Cada turno escolhe a próxima tarefa, e pode rejeitar ou redirecionar.
- **Consensus。**计划中, atual API público  ainda não implementado 文档保留该名称用于未来基于投票的进程──今日不要依赖它──

A reunião hierárquica aumenta cada vez mais a chamada de LLM em cada chamada especializada.

### Equipes vs Fluxos

É o quadro de 2026 文档开篇强调的框架.

- **Crew。**Autonomia orientada pelo Mestrado em Direito Jurídico.
- **Flow。**O que tem de acontecer é um gráfico.`@start`- Não, não.`@listen(topic)`标记一步,它将在另一个步骤中发出这个话题 时触发──每一步都是普通 Python──内部可以调用机组)──适应:生产──可观测──可测──确定性──

文档在 2026年生产建议: desde o fluxo 开始──当自治值其成本时,把船员作为流动步骤 内部的 `Crew.kickoff()`Os chamados vão para dentro. Flow dá-lhe o rastro de auditoria, tripulação dá-lhe a exploração.

### Ferramenta 集成

给代理配备工具有三种方法―― escolher a mais simples e adequada.

1. **`@tool` decorator。**純函数成工具──Signature is schema;docstring is LLM 看到的描述──最适合一次性辅助者──

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **`BaseTool` subclass。**基于 class 的工具,带显式 args schema、async support、retries──当 tool 有状态(client、cache) 或需要结构化 args 时使用──

   ```python
   from crewai.tools import BaseTool
   from pydantic import BaseModel

   class SearchArgs(BaseModel):
       query: str
       limit: int = 10

   class SearchTool(BaseTool):
       name = "web_search"
       description = "Search the web and return top results."
       args_schema = SearchArgs

       def _run(self, query: str, limit: int = 10) -> str:
           return self.client.search(query, limit=limit)
   ```

3. **内置 toolkits。**CrewAI  fornecer adaptadores de primeira parte:`SerperDevTool`- Não.`FileReadTool`- Não.`DirectoryReadTool`- Não.`CodeInterpreterTool`- Não.`RagTool`- Não.`WebsiteSearchTool`■ uma importação 即可接入

Output estruturado Use Pydantic──在 Task 上传入 `output_pydantic=MyModel` A equipe irá verificar a resposta do MLL, em função do modelo, e executar coerção ou retentação.`expected_output`string 配合使用──outputes de texto livre 适合草稿;outputes estruturadas 才是下游 Flow 能消费的内容──

### Anéis de memória

A CrewAI 开箱提供四种内存类型──它们可以组合:一个 Crew可以同时启用四种──

> **已针对**CrewAI 0.86(2026-05)验证──近期版本把所有内容都路由到统一的`Memory`O sistema, que envolve estas quatro lojas. O modelo de conceito abaixo ainda está em vigor, mas na versão atualizada, a superfície da classe pública pode ser recebida para um único.`Memory`ponto de entrada; por favor, veja[CrewAI memory docs](https://docs.crewai.com/concepts/memory)了解当前 API。

- **Short-term。**单次运行内对话缓冲──结束时清空──
- **Long-term。**跨运行持久化──存储在向量DB 中(默认 Chroma,可替换)──按与当前任务的相似度检索──
- **Entity。**按实体 记录事实──Client X está no plano empresarial. 按实体键,而不是按相似度──跨运行保留──
- **Contextual。**组装时检索──在 Agente 需要时拉取相关记忆, não pré-carga──

Em tripulação`memory=True`Ou por tipo de configuração  Enable. 支(Defecto OpenAI, pode ser substituído para local)  Memória é um dos lugares onde CrewAI é comparado com frameworks menores ≈Show value.

### 什么时候适合 CrewAI

- Três a seis agentes, roteiros e colaboradores.
- O LLM para o próximo passo de julgamento constitui em si mesmo o roteamento de valor (hierarquico)
- 团队更愿意读 `role + goal + backstory`, em vez de ler definição gráfica de cenário.

### Que é que é que é o que é que é que é ?

- 带严格顺序的确定性 DAGs──使用 LangGraph(Lesson 13)──forma do gráfico é uma abstracção correta;
- 亚秒级延迟预算──hierárquico 会增加 round-trip──即使序列化也会包含背景故事和前输出的提示──
- Loops de agente único.

Lição 17 ((Agente Framework Tradeoffs) usando Matrix  demonstrou este ponto.

### Forma de dependência

独立于 LangChain──Python 3.10 até 3.13──使用 `uv`✿ Contagem de estrelas:[crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)(Até 2026-05 de snapshot) ――AWS Bedrock integração 文档;vendor benchmarks 报告其在QA workloads 上相比 LangGraph 有显著提速,但方法论(dataset、hardware、评估指标) não é divulgado, portanto, os números de framework-vendor podem apenas ser utilizados como referência de orientação―

### Este padrão vai estar em erro.

- **Backstories 导致 prompt-bloat。**Cada agente Uma história de 2000 palavras, mais cinco membros da equipe de agentes, vão na primeira chamada da ferramenta Pre-burn掉 context budget──把 backstories 控制在 200 词以内──跨代理 复用短语;不要把房子风格重复五遍──
- **Manager-LLM token tax。**Processo hierárquico Realizado em cada chamada especialista 前增加一个经理LLM电话――五个任务 工作人员 会从五次LLM电话 变成六次,而且经理电话 携带完整任务列表加上前输出――除非路由依赖输出,否则切换到序列――
- **Brittle handoffs。**A tarefa N `expected_output`É um esboço. A tarefa N+1 é colocá-lo como um.`context`读取,并尝试 parse 三个节目──LLM 生成四个──下游 Agente 即兴处理──修复方式是任务 N 上使用 `output_pydantic`,让Task N+1 读取 typed object, em vez de texto livre。
- **Crew-as-prod。**Freedom Forma Crew em caso de não haver envoltura de fluxo é lançado para produção.


```figure
ae-crew-vs-flow
```

## Construí-lo

`code/main.py`Realizou duas versões de STDlib, bem como uma tripulação de três agentes.

形态:

- `Agent`- Não.`Task`Classe de dados, correspondente à superfície da CrewAI.
- `SequentialCrew.kickoff(inputs)`按声明顺序运行任务,并把输出 作为 `context`传递.
- `HierarchicalCrew.kickoff(topic)` aumentar um gerente Agente, cada turno escolher o próximo especialista, e  fazer  处停止──
- - Não .`@start`和 `@listen(topic)`decoradores de`Flow`, um pequeno ciclo de eventos, bem como um rastro.
- `tool(name)`O decorador, o reflexo da tripulação`@tool`Forma
- - Não .`short_term`- Não.`long_term`- Não.`entity`Lojas de`Memory`- Não é o que é?
- As respostas de LLM falsas são baseadas no papel, adicionando as fichas de entrada de prefixos teclados de strings de código rígido.

具体 demo:researcher、writer、editor crew,产出一份关于 agent engineering 2026 的简介──Researcher 拉取(mocked)sources──Writer 起草──Editor 收紧──同一个 crew 通过 Flow 运行,以展示决定性形──

- Não .

```bash
python3 code/main.py
```

Trace 覆盖: tripulação sequencial 通过 `context`串接 output, hierarquial crew 带 manager picks ((investigador, escritor, editor, então done),flow usando tópicos aparentes(`researched`- Não.`drafted`- Não.`edited`)运行同样三步, ferramentas chamadas 通过 `@tool`路由, bem como memória de longo prazo entre os dois lançamentos 保存──

O rastro de tripulação é fluente; gerente pode ser reorganizado.

## Use-o

- **CrewAI Flow**Para a produção. Mesmo o fluxo só tem um passo a seguir.`Crew.kickoff()`◊ Fluxo providence limite de auditoria ◊
- **CrewAI Crew (Sequential)**Utilizadas em trabalhos de cooperação, especialmente em primeiros projectos e em ciclos de revisão.
- **CrewAI Crew (Hierarchical)**Quando rotear depende da saída, e você tem quatro ou mais especialistas 时使用
- **LangGraph**(Lessão 13) Para máquinas de estado expresso, currículo duradouro, ordem estrita.
- **AutoGen v0.4**(Lessão 14) para utilização de simultaneidade de modelo de ator e isolamento de falhas.
- **OpenAI Agents SDK**(Lessão 16) para produtos de primeira utilização da OpenAI, com remessas e barris de segurança
- **Claude Agent SDK**(Lessão 17) para produtos de primeira classe, com subagentes e loja de sessões

##  Publicá-lo

`outputs/skill-crew-or-flow.md`Será uma tarefa  escolher Crew vs Flow, fazer andamio 最小实现──对 Crew-without-back story、Flow-without-explicit-topics、少于三专家的等级 进行硬拒──

## 常见坑

- **把 backstory 当作调味。**Ele irá moldar as saídas. Cada agente testar três variantes. A variante é real existência.
- **跳过 `expected_output`。**没有每个任务的契约,下游任务 会拿到 LLM 产出的任意内容──Crew 能跑;audit 会失败──
- **Memory always-on。**A longo prazo, cada vez que a operação é escrita, o vector DB aumenta, a recuperação é transformada, mas apenas quando a operação é duradoura, a escrita é limitada a tarefas que a empresa deve responder.
- **Manager prompt drift。**O gerente de gerenciamento hierárquico é um instante de ocultação. Se o roteamento se tornar estranho, em modo verboso, você pode sair.
- **Crews 中 tool side effects。**A tripulação pode utilizar mais vezes do que o esperado ferramenta: POST, DELETE, PAGO: Flow step, absolutamente não pertence à ferramenta da tripulação:

## 练习

1. Colocar a tripulação seqüencial  transformar em Flow。 número de variabilidade  reduzir o ponto de contacto。 registar a legibilidade                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
2. 给船员 添加实体记忆:关于客户的事实在开关之间 持久化――验证检索 拉取了正确实体――
3. 实现一个等级过程:manager 在作者的输出至少有三段之前,拒绝路由到编辑──追踪 这次再尝试──
4. Por um (se engano) pesquisa na web`BaseTool`Subclasse:`@tool`Decorador 版本。
5. 给编辑任务 添加 `output_pydantic=Brief`, entre os `Brief`- Não .`title`- Não.`summary`- Não.`sections` Deixar o escritor tarefa 输出一次错误 JSON;验证 CrewAI 在追踪中的重试行为──
6. 阅读 CrewAI's docs intro──把 toy 移植到真实 `crewai`Qual é a garantia de que a versão estdlib não cumpre?
7. Vai ser o agente de operações ou Langfuse (Lessão 24)

## 关键术语

| Term | 大家常说 | 实际含义 |
|------|----------------|------------------------|
| Agent | “Persona” | Role + goal + backstory + tools |
| Task | “工作单元” | Description + expected output + assignee + optional structured output |
| Crew | “Agent team” | Agents + Tasks + Process 的容器 |
| Process | “执行策略” | Sequential / Hierarchical / Consensus（计划中） |
| Flow | “Deterministic workflow” | 事件驱动、代码拥有、可测试 |
| Backstory | “Persona prompt” | Agent 的语气与判断塑造器 |
| `@tool` | “Function tool” | 把函数变成 Agent 可调用 tool 的 decorator |
| `BaseTool` | “Class tool” | 带 args schema、retries、async support 的 class-based tool |
| Entity memory | “Per-entity facts” | 限定到某个 customer / account / issue 的 memory |
| Long-term memory | “Cross-run memory” | 在 kickoffs 之间保留的 vector-backed memory |
| Contextual memory | “Just-in-time retrieval” | Agent 需要时才拉取的 memory |
| Manager LLM | “Router agent” | Hierarchical process 中选择下一个 task 的额外 LLM |
| `expected_output` | “Task contract” | 告诉 Agent（和 audit）要返回什么形态的 string |

## 延伸阅读

- [CrewAI docs introduction](https://docs.crewai.com/en/introduction): conceito e caminho de produção
- [CrewAI Flows guide](https://docs.crewai.com/en/concepts/flows)O processo de desenvolvimento`@start`- Não.`@listen`
- [CrewAI tools reference](https://docs.crewai.com/en/concepts/tools)- Não .`@tool`- Não.`BaseTool`、Kits de ferramentas
- [CrewAI memory](https://docs.crewai.com/en/concepts/memory)A Comissão propõe que os Estados-Membros adoptem medidas de protecção dos animais.
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)Multidistribuição: quando é que ajuda, quando não ajuda?
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview): alternativa de máquina de estado
