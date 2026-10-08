# Antropic's Workflow Patterns:简单优于复杂

> Schluntz 和 Zhang(Antropic,2024 年 12 月) distinguiu fluxos de trabalho(predefinido caminho) e agentes(motivo ferramenta uso)。 cinco tipos de padrões de fluxo de trabalho 覆盖大多数情况──从直接API calls 开始──只有当步骤无法预测时,才添加代理──

**类型：**学习 + 构建
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 01 (Loop de Agentes)
**时间：**Cerca de 60 minutos

## Objectivo de aprendizagem

- Explicar cinco padrões de fluxo de trabalho: cadeia de velocidade, roteamento, paralelação, orquestração, trabalho, avaliador e otimização.
- Explicar a diferença entre o agente e o fluxo de trabalho, bem como os respectivos custos de construção.
- Identificar o fluxo de trabalho, não o agente.
- Utilize stdlib  para LLM scripted  realçar todos os cinco padrões 

## 问题

                                                                                                                                                                                                                                                              

## 概念

### Fluxos de trabalho versus agentes

- **Workflow。**通過预定义代码路径编排的 LLM 和工具──Engineers 拥有图──
- **Agent。**LLM 动态指挥自己的工具并采取自己的步骤──Model 拥有图──

 ambos têm cenários de aplicação workflows mais convenientes, mais rápidos, mais fáceis de defectualizar Agentes  podem resolver problemas abertos, mas farão com que os modos de falha sejam mais difíceis de considerar

### Mestrado em Direito e Direito

五种模式的基础:一个LLM 接入三种能力  busca(recuperar) 、 ferramentas(ações) 、memória(persistência) 。 qualquer chamada de API pode usar essas capacidades。

### 五种模式

1. **Prompt chaining。**A saída de chamada 1 é usada como entrada de chamada 2. Aplica-se a uma tarefa com uma decomposição linear clara.

2. **Routing。**Classificador LLM  escolher para utilizar o LLM ou ferramenta para baixo corrente.

3. **Parallelization。**Não é possível fazer o mesmo, mas é possível fazer o mesmo.

4. **Orchestrator-workers。**O orquestrador LLM 动态决定运行哪些工人(同样是 LLM),并综合它们的输出──类似的代理循环,但 orquestrador 不会无限循环──

5. **Evaluator-optimizer。**Um LLM  propõe resposta, outro LLM  avaliá-lo.

### Fluxos de trabalho 胜过代理的地方

- **可预测任务。**Se consegues fazer um passo, devias fazer-o.
- **受成本约束的任务。**Os fluxos de trabalho têm um número definido de etapas; os agentes podem ficar sem controle.
- **受合规约束的任务。**Os auditores esperam ler o gráfico, em vez de deduzir-o a partir de trajetórias.

### Agentes 胜过工作流的地方

- **开放式研究。**Quando o próximo passo depende do que o passo anterior retorna,
- **可变长度任务。**需要数分钟到数小时、步骤数未知工作──
- **新领域。**Quando ainda não sabes o fluxo de trabalho correcto, primeiro explora, depois codifica.

### Engenharia de contexto 配套内容

"Effective context engineering for AI agents" (Antropic 2025) formalizou a disciplina de ensino adjacente: a janela de 200k é orçamento, não um recipiente.


```figure
workflow-chain
```

## Construí-lo

`code/main.py` para`ScriptedLLM` Realizaram todos os cinco padrões de fluxo de trabalho:

- `prompt_chain(input, steps)` 顺序执行──
- `route(input, classifier, handlers)` classificação + expedição。
- `parallel_vote(prompt, n, aggregator)` 运行 N 次并聚聚¬¬¬¬¬¬¬¬¬¬¬
- `orchestrator_workers(task, workers)` orquestrador 选择 trabalhadores。
- `evaluator_optimizer(task, proposer, evaluator, max_iter)`O ciclo até o passar.

运行:

```
python3 code/main.py
```

Cada padrão imprime sua própria marca. O número total de linhas de código de cada padrão é de cerca de 10 a 15 linhas; o custo da estrutura é normalmente medido em mil linhas.

## Use-o

- A maioria das tarefas usa chamadas diretas da API.
- 只有当模式 真正需要持久状态(LangGraph) 、actor-model concurrency(AutoGen v0.4) 或角色模板(CrewAI) 当才使用框架──
- Quando quiser usar o código Claude, escolha o SDK do Agente Claude.

## Entrega-o

`outputs/skill-workflow-picker.md`O processo de seleção de padrões corretos, incluindo a lógica da decisão, e os processos de trabalho não têm tempo suficiente para se reorganizar.

## 练习

1. Utilize um limiar de confiança  realçar roteamento  inferior ao limiar -> 升级给人 Para o suporte de nível 1, por exemplo, este limiar 应该落在哪里?
2. - Não .`parallel_vote`O que acontece quando uma chamada é chamada? Como é que se reúne em caso de falta de votos?
3. - Não .`evaluator_optimizer`改成 bandit: através de iterações, mantenha as principais saídas, assim que os bons resultados que surgem tarde não serão cobertos pelos maus resultados que surgem tarde.
4. 将 prompt chaining 与 routing 结合:router 选择三条链 中一条──衡量 Token 成本,并与单个大提示替代方案比较──
5. 选择你的一个生产功能――绘出工作流图――统计步骤数――这里代理 真的会更好吗?

## 关键术语

| 术语 | 人们常说什么 | 它实际意味着什么 |
|------|----------------|------------------------|
| Workflow | "预定义 flow" | Engineer 拥有的 LLM 和 tool calls graph |
| Agent | "Autonomous AI" | Model 拥有的 graph；动态 tool direction |
| Augmented LLM | "带 tools 的 LLM" | LLM + search + tools + memory；原子单元 |
| Prompt chaining | "顺序 calls" | call N 的输出是 call N+1 的输入 |
| Routing | "Classifier dispatch" | 选择由哪条 chain/model 处理输入 |
| Parallelization | "Fan out" | N 个并发 calls；通过 sectioning 或 voting 聚合 |
| Orchestrator-workers | "Dispatcher agent" | Orchestrator LLM 动态选择 specialist LLMs |
| Evaluator-optimizer | "Proposer + judge" | 迭代直到 evaluator 通过；Self-Refine 的泛化 |

## 延伸阅读

- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 五种工作流模式
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 配套方法
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) gráficos de estado 何時值其成本
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 产品化的 orquestra-trabalhadores padrão
