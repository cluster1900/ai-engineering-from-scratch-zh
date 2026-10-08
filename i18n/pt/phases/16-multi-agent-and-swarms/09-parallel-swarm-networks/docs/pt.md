# Arquiteturas paralelas / conjuntas / em rede

> Comparado com o supervisor: não há decider central. Agentes 读取共享事件bus,异步领取工作,并写回结果. LongGraph 明确支持面向去中心化、动态环境的"Swarm Architecture" (arXiv:2511.21686) Matrix (arXiv:2511.21686) 将控制流和数据流 都表示为通过分布式排列传递的串流,以消除乐队员 瓶──权衡很明确:用确定性和可追溯性 换可扩展性.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`, `queue`)
**前置要求：**Fase 16 · 05 (patrão de supervisor), Fase 16 · 04 (modelo primitivo)
**Time:** ~75 minutes

## 问题
O supervisor pode ser expandido para uma pequena quantidade de trabalhadores.

Arquiteturas de enxurrada Reversou este design. Não é por um planejador central, mas por trabalhadores da fila compartilhada para obter o trabalho.

## 概念
### A forma

```
                ┌──── shared queue ────┐
                │                      │
       ┌────────┼────────┐  ◄──────┬───┘
       ▼        ▼        ▼         │
     Worker  Worker  Worker   Worker
      A       B       C        D
       │        │        │         │
       └────────┴────────┴─────────┘
                 │
                 ▼
            results pool
```

没有管家──每个工人 反复执行:拉取一个任务,处理,写入结果(并可选地 enqueue follow-ups)──

### Quando o enxame se encaixa

- **许多独立 tasks。**A raspar, transformar, classificar... tarefas que não dependem umas das outras.
- **可变时长的工作。**Se algumas tarefas exigem 100ms, outras 10s, o grupo irá auto-equilibrar a carga  快速工会拉取后续工作──Supervisor 必须提提前预测时间──
- **Throughput 优先于 determinism。**Tu preocupas-te com o tempo de conclusão, não com ordens rigorosas.

### Quando o enxame falha

- **有序 workflows。**Se o passo 3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
- **Global-plan tasks。**Problemas de investigação complexas 受益于规划者──一研究集会产出独立事实,而不是连贯报告──
- **Debugging。**没有中央日志 且工作 异步时,复现 bug 成本很高──

### Matrix (arXiv:2511.21686)

Matrix é um artigo de 2025, que vai enxugar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

贡献: um modelo de programação, em que a coordenação entre vários agentes é  este agente 订阅哪个消息主题?, em vez de supervisor Next step choose which agent?

### Arquitetura de Swarm de LangGraph

LangGraph 2025 docs 明确将 "Swarm Architecture" 描述为多代理模式 之一:agents are nodes, but edges 形成带周期的导向图,并且任何 node 都可以从池中被激活──Worker 根据条件从可用工作中选择,而不是由监督派指派──

### Modo de falha: fome e manchas quentes

Se todos os trabalhadores tiverem a tarefa mais rápida possível, tarefas de longa duração até que apenas elas restem, então serão tomadas.

Mitigações:
- 带显显老的 随着等待时间 提高优先级)
- Especialização dos trabalhadores: alguns trabalhadores apenas recebem tarefas "longas".
- Pressão de volta: limitação de entrar em fila de tarefas rápidas

### O link de roteamento baseado em conteúdo

Swarm e roteamento baseado em conteúdo (Lessão 22) Natural配对―― não usar fila genérica, mas para cada tipo de mensagem  preparar uma fila― Trabalhadores especializados apenas subscrever seu próprio tipo― é possível expandir para milhares de agentes arquiteturas de bus de mensagem―


```figure
sw-work-stealing
```

## Construí-lo
`code/main.py`Realizar um enxame de quatro fios de trabalhadores, que são compartilhados.`queue.Queue`中拉取任务──Tasks 具有可变的持续时间(有些快,有些慢)──该 демо对比:

- **Sequential baseline:**Um trabalhador faz todas as tarefas.
- **Fixed assignment:**Cada tarefa é previamente atribuída a um trabalhador específico (estilo de supervisor).
- **Swarm:**Trabalhadores da fila compartilhada

Swarm irá auto-equilibrar a carga; atribuição fixa irá estar numa tarefa atribuída 很慢时让快工 置──

- Correr .

```
python3 code/main.py
```

O resultado mostra o número de tarefas de cada trabalhador.

## Use-o
`outputs/skill-swarm-fit.md`评估 a task 应该使用群 还是监督者──Inputs: task independence、duration variance、ordering requirements、debugability needs──

## Entrega-o
Lista de verificação:

- **带 aging 的 Priority queue。**Prevenir a fome de longas tarefas.
- **Worker idempotency。**Se um trabalhador se desmorona, uma tarefa pode ser arrastada muitas vezes.
- **Durable queue。**O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é.`queue.Queue`                                                                                                                                                                                                                                                              
- **每个 task 的 observability。**Cada tarefa tem um ID de rastreamento; cada trabalhador tem um registro de início/final.
- **Back-pressure。**Se a fila crescer rapidamente, os trabalhadores se esgotarem, a velocidade dela diminui.

## 练习
1. 运行 `code/main.py`◊ Em carga de trabalho de duração variável  , massa em relação a sequência                                                                                                                                                                                                                                                     
2. 添加一个优先排列变异(使用 `queue.PriorityQueue`)── por tarefa "importância" campo de prioridade de repartição── observar em carga contínua
3. 实现一个热点检测仪:当任何工人 处理的任务 数量达到最慢工的 3× 时记录日志――这说明任务-duration distribution 存在什么情况?
4. 阅读Matrix paper (arXiv:2511.21686) 摘要 和 Section 3──识别Matrix 接受一个具体交易️scalability gain) 以及它放弃一个交易️scalability、determinism) ‖
5. 将 swarm demo 改为使用由 (task_type, payload) tuples 组成 `queue.Queue`Quando as tarefas são diferentes, quais regras de roteamento são razoáveis?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Swarm architecture | "Decentralized agents" | Workers 从 shared queue 中拉取；没有 central orchestrator。 |
| Event bus | "Agents subscribe to topics" | 按 type 或 content 将 tasks 路由给 workers 的 message broker。 |
| Starvation | "Task never runs" | 因为 higher-priority work 持续到达，low-priority task 永远不会被选中。 |
| Hot-spotting | "One worker drowns" | 一个 worker 获得大多数 tasks 的 load imbalance。 |
| Back-pressure | "Slow down the producer" | 当 queue 填满时，向 upstream 发出停止生产信号的 mechanism。 |
| Idempotent worker | "Safe to re-run" | 一个 task 被处理两次会产生相同 result。因为 workers 可能在 mid-run 崩溃，所以这是必需的。 |
| Durable queue | "Survives crashes" | 由 disk 或 replicated storage 支持的 queue；worker 崩溃时 tasks 不会丢失。 |
| Matrix framework | "Full message-passing swarm" | Data 和 control flow 都是在 distributed queues 上的 serialized messages。 |

## 延伸阅读
- [LangGraph workflows and agents — Swarm Architecture](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 明确支持 swarm
- [Matrix — A Decentralized Framework for Multi-Agent Systems](https://arxiv.org/abs/2511.21686) 完整 mensagem-passando enxame
- [Anthropic engineering — why supervisor not swarm in Research](https://www.anthropic.com/engineering/multi-agent-research-system)Por que um sistema de produção específico?
- [AutoGen v0.4 actor-model docs](https://microsoft.github.io/autogen/stable/) reescrever ator orientado por eventos,比 v0.2 的 GroupChat 更接近群
