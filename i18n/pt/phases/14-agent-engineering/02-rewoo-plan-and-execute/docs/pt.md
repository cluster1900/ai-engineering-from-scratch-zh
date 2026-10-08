# ReWOO e Plano-e-Executar:解式规划

> ReAct em um fluxo de pensamento e ação. ReWOO irá separá-los: primeiro elaborar um grande plano completo, depois executar.

**类型：**Construção
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 01 (Loop de Agentes)
**时间：**- 60 minutos.

## Objectivo de aprendizagem
- Explicar por que o Planner / Worker / Solver da ReWOO  Separar  ReAct                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
- 实现 um plano DAG、 um executor de execução dependente de ordem, bem como um solvente de resultados de trabalho conjunto  全部使用 stdlib。
- Utilize 2026 5 workflow patterns 框架 Antropic), o trabalho de avaliação deve ser adotado com um plano-depois-execução, ou seja, um processo de reação.
- Identificar quais são os dados sintéticos do plano de plano para tarefas de longo prazo na web ou móveis?

## 问题
O ciclo de pensamento-ação-observação de ReAct é simples e flexível, mas cada chamada de ferramenta tem que levar um contexto anterior completo, incluindo cada pensamento anterior. O uso de tokens vai crescer duas vezes com a profundidade.

ReWOO(Xu et al., arXiv:2305.18323, maio 2023) notou este ponto, e fez uma取舍:先完整规划, paralelo 获取证据,最后组合答案── uma chamada de LLM Used for规划,N 次工具调用 用于证据(可以并行),一次 LLM调用 用于求解── essa取舍是用更少的灵活性(计划是静态的) trocar melhor token efficiency 和更清晰的失败模式──

## 概念
### Os três papéis

```
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

Planner produz um DAG. Cada nó especificou uma ferramenta, seus argumentos, bem como depende de quais nós anteriores, por exemplo.`#E1`- Não.`#E2`Assim referências) ・ Trabalhadores  segundo ordem topológica  Execução de nós。 Solver vai todos os conteúdos拼接在一起。

### Por que 5x menos tokens

O tempo de reativação irá acompanhar a contagem de passos 线性增长──在第十步,prompt 包含思想 1加行动 1加观察 1加思想 2加行动 2加观察 2,依此类推── cada passo intermediário ainda terá冗余包含原始提示──

ReWOO apenas paga uma vez o planejador de prompt (((较大) 、N 个小工人提示((每个只是工具调,没有链) 和一次解决器提示──论文在 HotpotQA 上测得代币 减少约5x,同时绝对精度 提升 +4──

### Por que é mais robusto

Se o trabalhador 3 não conseguir no ReAct, o loop deve estar no fluxo no meio do caminho do erro, no ReWOO, o trabalhador 3 retornará a uma cadeia de erro; o resolvedor pode vê-la no contexto do plano original,并优雅降级── A localização do erro é por nó, e não por passo──

### Destilação de planeador

O segundo resultado do artigo é: porque o planejador não observa, você pode usar as saídas do planejador do professor 175B para ajustar perfeitamente um modelo 7B.

### Planejamento e execução (LangChain, 2023)

LangChain 团队 em agosto de 2023 文章中将 ReWOO 泛化为一个模式名称:Plan-and-Execute──Up-front planner 输出一个步骤列表,执行人 执行人 每一步,可选的重组规划员 可以在观察结果后进行修改──这比 ReWOO更接近 ReAct(replanner 会把观察带回规划),但保留了代币节省──

### Planos e Acto (Erdogan et al., arXiv:2503.09572, ICML 2025)

Plan-and-Act irá ampliar esse padrão para a web de longo horizonte e agentes móveis. Contribuição fundamental é dados sintéticos de planos: um gerador de trajetória rotulado.

### Quando escolher qual

| Pattern | When |
|---------|------|
| ReAct | 短任务、未知 environment、需要 reactive exception handling |
| ReWOO | 具备已知 tools 的结构化任务、对 token 敏感、evidence 可 parallelize |
| Plan-and-Execute | 类似 ReWOO，但在 partial execution 后支持 replanning |
| Plan-and-Act | Long-horizon（>30 步）、web/mobile/computer-use |
| Tree of Thoughts | Search 值得付出成本（Lesson 04） |

Antropic                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           


```figure
rewoo-plan
```

## Construí-lo
`code/main.py`实现一个玩具版 ReWOO:

- `Planner`Uma política escrita, de acordo com o plano de saída imediato DAG.
- `Worker`  através do registro 分发每个 node 的工具调用──
- `Solver` composição escrita, leitura de evidências e resposta final.
- Resolução de dependência  类似 `#E1`As referências serão substituídas por resultados de trabalhadores mais antigos.

Essa demonstração  resposta Qual é a população da capital da França, arredondada para milhões?, usar o plano de dois passos: 1) procurar capital, 2) procurar população, então procurar resolver。

- Não .

```
python3 code/main.py
```

trace 会先显示完整计划,然后显示工人结果,最后显示解决器组成──将符号数――我们印了粗略的字符数) 交错运行进行比较  在这种结构化任务上 ReWOO 胜出──

## Use-o
LangGraph vai planejar e executar como receita`create_react_agent`Utilizado para ReAct, gráficos personalizados Utilizado para executar o plano) ―― Fluxos de CrewAI  diretamente codificados o padrão: você previamente define tarefas, então Flow DAG  executá-las。

## Entrega-o
`outputs/skill-rewoo-planner.md`Em caso de catálogo de ferramentas, em função do pedido do usuário, o plano DAG.

## 练习
1. Para nós de plano independente  realizar a execução de trabalhadores paralelas  Em um DAG de 6 nós de dois grupos paralelas, que benefícios isso pode trazer?
2. Adicione um nó de replanagem, quando qualquer trabalhador retornar erro 时触发── deixe ReWOO 变成 Plan-and-Execute Minimum Modification é o quê?
3. Usar um modelo pequeno (Classe 7B) para substituir`Planner`,并让 `Solver`Utilize modelo de fronteira. Comparar qualidade de ponta a ponta.
4. 阅读ReWOO 论文中关于计划器蒸化的第4部分──从概念上复现 175B -> 7B 的结果:你需要什么培训数据,以及如何评估计划质量?
5. Para implementar esta ferramenta, transpor-la-á para a forma de trajetória do Plano e do Acto: o plano é sequência, e não DAG.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ReWOO | “Reasoning without observations” | 先 plan，然后 parallel 获取 evidence，最后 solve —— planning prompt 中没有 observations |
| Plan-and-Execute | “LangChain's plan-execute pattern” | ReWOO 加上 execution 后可选的 replanner node |
| Plan-and-Act | “Scaled plan-execute” | 显式 planner/executor 拆分，并用 synthetic plan training data 支持 long-horizon tasks |
| Evidence reference | “#E1, #E2, ...” | plan-node placeholder，在 dispatch 时用先前的 worker output 替换 |
| Planner distillation | “Small planner, big executor” | 用 large teacher 的 planner traces 来 fine-tune small model |
| Token efficiency | “Fewer round trips” | 论文中在 HotpotQA 上相对 ReAct 减少 5x tokens |
| DAG executor | “Topological dispatcher” | 按 dependency order 运行 plan nodes；每一层可 parallel |

## 延伸阅读
- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323) 经典论文
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572) 带 sinteticos planos  带 sinteticos planos  带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带                                                                                                                                                                                                                                                                                                              
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview) Receita de quadro
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 选择能工作的最简单模式  选择能工作的最简单模式 选择能工作的最简单模式 选择能工作的最简单模式 选择能工作的最简单模式
