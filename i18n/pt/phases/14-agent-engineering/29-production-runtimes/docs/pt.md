# Tempo de execução da produção: Cotação, Evento, Cron

> Agente de produção 运行在六种运行时形 上:request-response、streaming、durable execution、queue-based background、event-driven 和 scheduled──先选择形,再选择 framework──Observabilidade 在每种形中都是承载──

**类型：**- aprendizagem
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 13 (Langgrafo), Fase 14 · 22 (Voice)
**时间：**- 60 minutos.

## Objectivo de aprendizagem

- Há seis formas de execução de produção, e cada uma delas se adapta a um padrão de estrutura/produto.
- Explicar por que a execução duradoura (LangGraph) para tarefas de longo prazo é muito importante.
- descrição do tempo de execução baseado em eventos, bem como de Claude Managed Agents 适用场景──
- 解释 multi-step agent 中 observabilidade-as-load-bearing 这一说法。

## 问题

O processo de produção de um agente de produção é o de um notebook de Jupyter. O processo de execução é o de uma pessoa que está em contato com a rede.

## 概念

### Requisito-resposta

- HTTP sincrono. Usuário aguarda conclusão.
- Apenas para tarefas curtas.
- 技术:Agno (Python + FastAPI)、Mastra (TypeScript + Express/Hono/Fastify/Koa)。
- Observabilidade: Standard HTTP log de acesso + OTel span。

### Transmissão

- Utilize SSE ou WebSocket  para realizar a saída progressiva.
- O LiveKit vai expandir para WebRTC, para uso de voz/vídeo (Lessão 22)
- Stack: qualquer framework de streaming + 能处理 SSE/WS frontend
- Observabilidade: cada pedaço de tempo gasto, latencia de primeiro token, latencia de cauda.

### Execução duradoura

- Cada passo depois, todos os pontos de controlo estão em estado de recuperação automática quando falham.
- O modelo de ator AutoGen v0.4 vai falhar separado para um único agente.
- Diferença central do LangGraph (Lessão 13)
- Quando o número de passos é desconhecido e o custo de recuperação é muito alto, é necessário.

### Baseada em fila / fundo

- Trabalho  entrar na fila, trabalhador 拉取执行, resultados através de webhook ou pub/sub 回流.
- Para um agente de longo horizonte é necessário (para cada tarefa há de 10 a 100 passos, veja Antropic's computer use announcement)
- Stack:Celery (Python)、BullMQ (Node)、SQS + Lambda (AWS)、custom。
- Observabilidade: profundidade da fila, distribuição de latência de cada trabalho, tamanho do DLQ.

### Evento-driven

- Agente 订阅 gatilho: novo e-mail, PR aberto, cron fire.
- Claude Gerenciou Agentes 开箱即支持这一点 (Lessão 17)
- Fluxos de CrewAI (Lessão 15) para organizar fluxos de trabalho deterministas orientados por eventos.
- Observabilidade: fonte de desencadeamento, latência de início de eventos, latência de agentes.

### Programação

- Agente em forma de cron de operações periódicas.
- Com execução duradoura 结合使用, assim, não conseguirá correr de noite pode ser recuperado na próxima vez 时时🏻
- 技术:Kubernetes CronJob + framework durável;托管方案(Render cron、Vercel cron)

### Modelo de implantação de 2026

- **CrewAI Flows**Utilizando a produção orientada para eventos.
- **Agno**FastAPI sem estado Utilizando microserviço Python.
- **Mastra**Adaptador de servidor(Express、Hono、Fastify、Koa) para utilização em embedimento。
- **Pipecat Cloud / LiveKit Cloud**Usando a voz gerenciada (Lessão 22)
- **Claude Managed Agents**Us 用于 hosted long-running async.

### Observabilidade é suportável

Se não houver um espaço de OpenTelemetry GenAI (Lessão 23) e um backend Langfuse/Phoenix/Opik (Lessão 24), você não pode fazer uma operação de vários passos que não seja bem sucedida no 40o passo. Isso não é uma opção para a produção.

### Tempo de execução da produção 失败的位置

- **选错 shape。**Por um 5 minutos tarefas escolher solicitação-resposta.
- **没有 DLQ。**Trabalhador de fila 没有死字――失败的工作将消失――
- **不透明的 background work。**Agente de fundo 运行时不导出追踪―― até que o problema do usuário seja relatado, o fracasso é invisível―
- **跳过 durable state。**Qualquer coisa que exceda 30 segundos e não aguente a reinicialização, precisa de execução duradoura.


```figure
wb-runtime-shapes
```

## Construí-lo

`code/main.py`É uma demo multi-forma stdlib:

- Endpoint de Request-Response (página final de resposta-requesta)
- Gerenador de transmissão
- Trabalhador em fila de DLQ:
- Registro de desencadeamento de eventos.
- Agendador em forma de cron.

运行:

```bash
python3 code/main.py
```

输出:五条 痕迹,展示同一个任务 在每种形下的行为──同一套代理逻辑,不同的外层 shell──可持续执行──第六种形) 已有意放在课13 中通过LangGraph checkpointing 讲解──

## Use-o

- **Request-response**Usado para o estilo de chat UX.
- **Streaming**Usando uma resposta progressiva.
- **Durable**Usá-lo para uma tarefa de longo prazo.
- **Queue**Utilize em lote / async / de longa duração.
- **Event**Utilizando a reactividade do agente.
- **Cron**Utilizado para a manutenção de uma casa (consolidação de memória, relatório de custos).

##  Publicá-lo

`outputs/skill-runtime-shape.md`会为一个任务 选择运行时间形,并连接可观测性要求──

## 练习

1. O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é?
2. 给排列式演示 添加 DLQ──模拟 10% de falha de trabalho; exposição de tamanho DLQ──
3. 编写一个 cron-triggered eval agent,每晚针对当天的前20追踪 运行──
4. 实现带压力的流: Se o cliente 很慢,就暂停代理―― Isso como é o orçamento de turno 交互?
5. Quando é que vais mudar um agente de longo prazo para um agente gerenciado?

## 关键术语

| 术语 | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Request-response | “Synchronous” | 用户等待；只适合短任务 |
| Streaming | “SSE / WS” | Progressive output；更好的 UX；每个 chunk 的 latency 可观察 |
| Durable execution | “Resume from failure” | Checkpointed state；从最后一步 restart |
| Queue-based | “Background jobs” | Producer / worker pool / DLQ |
| Event-driven | “Trigger-based” | Agent 对 external event 作出反应 |
| DLQ | “Dead-letter queue” | 失败 job 的停车场 |
| Claude Managed Agents | “Hosted harness” | Anthropic-hosted long-running async，带 caching + compaction |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) execução duradoura 细节
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) Assincronização de longo prazo de
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use)  cada tarefa 几十到几百步
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) Isolamento de falhas de modelo de actor
