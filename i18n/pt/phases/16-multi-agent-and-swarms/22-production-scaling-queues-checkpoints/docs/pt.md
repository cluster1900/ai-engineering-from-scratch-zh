# Produção de produtos e serviços

> Para ampliar os sistemas multi-agentes para milhares de operações, é necessário**durable execution**◊ O tempo de execução do LangGraph 会在每个超级步骤 后写入一个由 `thread_id`标识的检查点(默认使用 Postgres);trabalhador 崩会释租, outro trabalhador 会接手恢复──Agentes podem descansar indefinidamente, aguardar entrada artificial──**MegaAgent**(arXiv:2408.09955) 运行一个按代理 划分的生产者消费者队列,包含三种状态 (Idle / Processing / Response) 和两层协调 (组内聊天 + 组间管理聊天)**Fiber/async**优于线程-per-jobs:threads 99% of the time都在空等待令牌, enquanto fibras 会在 I/O 上协作式让出――反方观点:Ashpreet Bedi's "Scaling Agentic Software" 主张在载证明需要之前使用**FastAPI + Postgres + nothing else**, simples estrutura de avanço mais longo do que o esperado. Esta aula irá construir um log de checkpoint durável, uma fila de trabalho por agente com status de transformação, uma demonstração de sincronia contra fio, e implementar o processo real.

**Type:** Learn + Build
**Languages:** Python (stdlib, `asyncio`, `sqlite3`)
**前置要求：**Fase 16 · 09 (Redes de Enxames Paralelas), Fase 16 · 13 (Memória Compartilhada)
**Time:** ~75 minutes

## 问题

Um protótipo de sistema multi-agente em um laptop, usando três agentes e um loop de eventos em memória, pode funcionar normalmente.

- Agentes têm que fazer uma série de trabalhos.
- Processos de trabalho 会崩──重启会失失状态──
- O valor máximo da carga é 10 vezes maior que a média; você precisa de um nível de expansão.
- Utilizador por agente 付费; você precisa usar a semântica de cálculo exatamente uma vez.

O ciclo de eventos em memória  não pode lidar com estes problemas. Você precisa adicionar uma camada de execução durável no nível inferior.

1. 带 checkpoints 的工作流引擎(Temporal、LangGraph runtime) ⋅
2. 带 state store 的消息队(Postgres + SQS/RabbitMQ) 』
3. Estruturas de modelo de actores (produtor-consumidor)
4. Hand写 FastAPI + Postgres(Bedi 的观点)。

Esta aula irá construir uma versão micro de cada tipo de programação.

## 概念

### Execução duradoura, este modelo

Motor de execução durável 会在每个"步骤" (super-fase) 后持久化完整程序状态──崩时:

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

Para que funcione, é preciso satisfazer:

- **Serializable state。**Todos os estados de agente devem ser mantidos em vigor.
- **Deterministic resume。**Dado o mesmo estado e as mesmas entradas, o agente irá produzir as mesmas ações ou vai fazer chamadas de LLM 委托给外部决定主义 Oracle) 
- **Idempotent side effects。**As chamadas externas (chamadas de ferramentas, pagamentos) devem ser idempotentes ou utilizar a chave de deduplicação.

LangGraph em cada super-passo 后写检查点;Temporal在每个活动 后写;Restate 使用事件源日志──三者实现是同一个模式──

### Tempo de execução de LangGraph

Cada agente tem um .`thread_id`;estado é digitado dit; cada super-passo está em direção a uma tabela de pontos de controlo 写入一行。恢复时,runtime 从最后一个检查点 继续,而不是从头开始──Agentes podem `interrupt()`Para esperar a entrada artificial; tempo de execução 会持久化并释放工人── Quando a entrada chegar, qualquer trabalhador pode recuperar──

É um projecto de produção de referência para abril de 2026.

### Lista de agentes de MegaAgent

arXiv:2408.09955  Descreve um experimento em escala: um cluster em meio a milhares de agentes de desenvolvimento.

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

O coordenador de dois níveis permite que a conversação entre os grupos ocorra em alta densidade, enquanto o grupo mantém-se raro.

### Assincronização vs. fio por trabalho

As chamadas de LLM são I/O-bound. Esperar para o próximo fio de token. 99% do tempo são em vão. Cada fio consome cerca de 1 MB de RAM.

Fibras ((Python `asyncio`、Vai para as rotinas 、Rust `tokio`O processo de integração é um processo de integração e de integração de um sistema de gestão de dados.

Exemplo: pós-processamento ligado ao CPU (implementação, tokenizer, técnicas) ainda precisa de fios ou processos.

### Bedi's oposição

"Scaling Agentic Software" (Ashpreet Bedi, 2026) considera que a maioria dos equipes está em excesso de engenharia antes de carregar a carga de medida.

- Rapido-API + Pós-graduação:
- Cada agente é executado é um estado usando uma concurência otimista.
-  através `pg_notify`Ou simples trabalhador de celeria  executar trabalhos de fundo 
- Em código de aplicação implementar política de retesting.

Para menos de 100 operações de agente, a carga controlada de missões é normalmente suficiente.

 Regra é: quando você se depara com problemas específicos que uma estrutura simples não pode resolver, reaproveite estruturas de execução duradouras.

### Semântica de uma vez

 Para executar um agente de pagamento, você precisa de "exatamente uma vez eficaz" (pelo menos uma vez de entrega + consumidor idempotente)

- **每个 run 一个 dedup key。**Em cada chamada de efeitos colaterais, contém-na.
- **Outbox pattern。**Os efeitos secundários, primeiro, são descritos numa tabela, depois, por um processo independente, executado.
- **Compensating transactions。**Quando efeito colateral Success, mas rastreamento escrever 失败时, arranjar reparação operação.

Estes são padrões de engenharia de base de dados, não são específicos do LLM.

### Desdobramento do arco-íris

Sistema de pesquisa multi-agente da Anthropic utiliza "implementações do arco-íris": vários agentes runtime  версия并发运行, assim que os agentes que funcionam durante muito tempo não precisam ser mortos em cada vez que o código é implementado.

Esta é a prática padrão de sistemas de estado de longa duração; o ponto de adaptação de 2026 é que os agentes possam sobreviver por horas, portanto, os ciclos de implantação devem ser compativeis com este ponto.

### 典型生产 checklist

- Estado duradouro ((checkpoints、snapshots, ou outbox + log re-playable) ⋅
- Efeitos secundários impotentes:
- Utilizando as chamadas de LLM de camada de I/O sincronizada.
- 带 dedup 的至少一次交付──
- 面向 stateful workloads of rainbow/canary deployment──
- Observabilidade: rastreamento por agente, auditoria super-passo, contador de retiro.


```figure
sw-checkpoint-replay
```

## Construí-lo

`code/main.py`实现:

- `CheckpointStore` Log de checkpoint com suporte SQLite, use thread-id keys── cada super-passo 追加一行──
- `run_with_checkpoint(agent, thread_id)` 模拟 mid-run 崩; segundo trabalhador do último ponto de controlo 恢复。
- `AgentQueue` por agente máquina de estado de inatividade / processamento / resposta, com uma pequena fila de trabalho。
- `demo_async_vs_threads()` 通過無同和线程 运行 500 个并发模拟 "LLM chamadas";报告 壁表 和峰值存储(近似) 』

运行:

```
python3 code/main.py
```

预期输出:模拟崩后检查点恢复 成功;async version 在 < 1s 内处理 500 个并发电话;thread version 需要几秒,并且每个并发单元使用的内存 高出数量级;;

## Use-o

`outputs/skill-scaling-advisor.md`会根据负载、状态-retention 需求和部署 频率,建议持续执行 选择:FastAPI + Postgres、LangGraph runtime、Temporal或 custom──

##  Publicá-lo

典型生产加固:

- **从简单开始（Bedi 的规则）。**Use FastAPI + Postgres, até que você perceba que ele falha.
- **在优化之前 instrument everything。**Histograma de latência por execução, tempo por passo, contagem de retrospectiva, categorização de falhas.
- **为 side effects 使用 outbox pattern。**▌especialmente pagamentos e chamadas externas de API ▌
- **Rainbow deploys。**Durante o desdobramento, não mates a agente de voo.
- **当你遇到具体问题时采用 durable-execution engines（Temporal / LangGraph / Restate）：**As medidas de reestruturação e de reestruturação são de grande importância para a região.
- **I/O layer 使用 async。**Os fios só são utilizados para pós-processamento ligado à CPU.

## 练习

1. 运行 `code/main.py` Confirmar o resumo do ponto de controlo 生效;测量 async vs thread concurrency 差异──
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              **outbox**Tabela: Cada chamada de ferramenta, primeiro, escreve-se na caixa de saída, depois, executa-se a tarefa/rotina individual.
3. 模拟一个 **rainbow deploy**: duas versões de execução foram desenvolvidas; vai ser meio novo thread_ids 路由到各自版本; confirmar os fios de voo na versão anterior não serão interrompidos。
4. 阅读下面链接中的 LangGraph runtime doc──识别 runtime 中哪些功能在手写FastAPI + Postgres 版本中最耗耗时间──那是理由采用它,还是可以延迟吗?
5. 阅读MegaAgent (arXiv:2408.09955) Seção 3──两层协调(intra-grupo + intergroup admin chat) é evidente── desenhar como você vai mapeá-lo para levar duas classes de filas de família de filas de mensagens──

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| Durable execution | "Persist the program state" | Engine 在每个 super-step 后写入 state；crash recovery 是 deterministic 的。 |
| Super-step | "Transactional boundary" | Checkpoints 之间的 work unit。LangGraph 术语。 |
| thread_id | "Agent run identifier" | 绑定 checkpoints 和 resume logic 的 key。 |
| Idempotency | "Safe to retry" | 重复一个 side effect 产生的结果与一次尝试相同。 |
| Outbox pattern | "Decouple side effects" | 将 intent 写入 table；独立 executor 执行并标记完成。 |
| At-least-once delivery | "Possible duplicates" | Message queue semantics；dedup key 让 consumer 达到 effective-once。 |
| Rainbow deploy | "Overlapping versions" | 长时间运行 workloads 期间多个 runtime versions 并发存在。 |
| Async fiber | "Cooperative yielding" | User-mode concurrency；对于 I/O-bound loads，相比 threads 成本很低。 |
| Checkpoint | "State snapshot" | super-step 边界处的 serialized state；是 resume 的 key。 |

## 延伸阅读

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) Design de tempo de execução de LangGraph
- [MegaAgent](https://arxiv.org/abs/2408.09955) Coordenação de produtores-consumidores por agente; milhares de agentes de desenvolvimento
- [Matrix](https://arxiv.org/abs/2511.21686) Utilize queues de mensagens como um substrato de coordenação de uma estrutura descentralizada
- [Temporal docs](https://docs.temporal.io/) execução durável  motor de fluxo de trabalho de referência
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Incluindo a experiência de produção em implantação do arco-íris
