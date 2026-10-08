# AutoGen v0.4: Modelo de ator e Framework de agente

> AutoGen v0.4 (Microsoft Research, 2025 ano 1 mês) em torno do modelo de ator 重新设计了代理配套──Asinc exchange of messages、evenement-driven agents、fault isolation、自然并发──O framework está agora em modo de manutenção, enquanto o Microsoft Agent Framework (preview público de outubro de 2025) está se tornando seu sucessor──

**类型：**学习 + 构建
**语言：**Python (stdlib)
**先修：**Fase 14 · 01 (Loop de Agentes), Fase 14 · 12 (Patrões de Fluxo de Trabalho)
**时间：**Cerca de 75 minutos

## Objectivo de aprendizagem

- 描述 actor model:agent 作为演员,消息是唯一的IPC,每个演员 独立隔离故障──
- Explicar três níveis de API do AutoGen v0.4: Core, AgentChat, Extensões e seus respectivos usos.
- Explicação de por que a entrega de mensagens e o tratamento de soluções trazem isolamento de falhas e a natureza de desenvolvimento.
- Em Python, para realizar um stdlib actor runtime,并将将一个双代理代码审查流 移植到其上.

## 问题

A maioria dos agentes estrutura são: um agente  produz conteúdo, um agente  consome conteúdo, opera em uma pilha de chamadas.

A resposta de AutoGen v0.4 é: modelo de ator. Cada agente é um ator com caixa de entrada privada. A mensagem é o único meio de comunicação.

## 概念

### Atores

Um ator 拥有:

- Private有状态 (exterior) = "Exterior nunca pode entrar em contato direto" = "Exterior nunca pode entrar em contato direto" = "Exterior nunca pode entrar em contato direto" = "Exterior nunca pode entrar em contato direto" = "Exterior nunca pode entrar em contato direto" = "Exterior nunca pode entrar em contato direto" = "Exterior nunca pode entrar em contato direto" = "Exterior nunca pode entrar em contato direto" = "Exterior nunca pode entrar em contato direto" = "Exterior nunca pode entrar em contato direto" = "Exterior nunca pode entrar em contato direto" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior" = "Exterior "Exterior" = "Exterior" = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "Ext) = "
- Uma caixa de entrada (Messagem)
- Um agente:`receive(message) -> effects`, entre os efeitos podem ser enviados para outros atores, criar novos atores, atualizar o estado, parar a si mesmo.

Dois atores não podem partilhar memória.

### AutoGen v0.4 中的三个API层

1. **Core.**Estrutura de atores de nível inferior.`AgentRuntime`- Não.`Agent`- Não.`Message`- Não.`Topic`❖ Troca de mensagens sincronizada, orientada por eventos―
2. **AgentChat.**面向任务的高层 API (API de alto nível) `AssistantAgent`- Não.`UserProxyAgent`- Não.`RoundRobinGroupChat`- Não.`SelectorGroupChat`- Não.
3. **Extensions.**集成:OpenAI、Antropic、Azure、tools、memória。

### Por que é importante?

Em v0.2 模型中,同步调用 `agent_a.chat(agent_b)`O agente vai parar até o agente voltar.`send(agent_b, msg)`Vou colocar a mensagem na caixa de entrada do agente, e depois voltar imediatamente.

- **Fault isolation.**Agente B 崩 não vai causar Agente A 崩, tempo de execução 会捕获B's handler 中中的失败,并决定如何处理(log、retirement、dead-letter) ⋅
- **自然并发。**Muitas mensagens podem ser enviadas ao mesmo tempo; o ator não é enviado para tratar sua caixa de entrada.
- **面向分布式。**Se o ator está em processo ou em outro anfitrião, a caixa de entrada + transporte são todos os mesmos.

### - Não .

- **RoundRobinGroupChat.**Agente E.F.R.R.
- **SelectorGroupChat.**Agente selector 根据对话背景 选择下一位──
- **Magentic-One.**Utilizado para navegação na web, execução de código, tratamento de arquivos, equipe de referência multi-agente.

### - Não, não.

Input Support OpenTelemetry── cada mensagem cidade vai emitir um span; ferramenta chamada  baseado em 2026 OTel GenAI convenções semânticas Lessão 23) 携带`gen_ai.*`atributos.

### status:modo de manutenção

2026 ano início:AutoGen v0.7.x para pesquisa e prototyping 来说是稳定的──Microsoft 已将积极开发 转向Microsoft Agent Framework(2025年10月1日公开预览;1.0 GA 目标为2026年Q1 末)──AutoGen padrão 可以干净地向前移植,actor model 是持久的思想──


```figure
actor-mailbox
```

## Construí-lo

`code/main.py`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

- `Message`- Não .`sender`- Não.`recipient`- Não.`topic`- Não.`body`de tipo de carga útil.
- `Actor`- Não .`receive(message, runtime)`- Não.
- `Runtime`O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é?
- Uma demonstração de dois atores:`ReviewerAgent`Código de revisão,`ChecklistAgent`运行 checklist; eles trocam mensagens até chegarem a um consenso.

运行:

```
python3 code/main.py
```

Trace irá mostrar a entrega de mensagens, um ator entre os quais não vai deixar outro ator falhar, assim como o processo de recebimento do veredicto comum.

## Use-o

- **AutoGen v0.4/v0.7**(manutenção): adapt adaptado à investigação, à prototipação, a padrões multi-agentes,
- **Microsoft Agent Framework**(previsão pública): futuro caminho; igual ator-modelo 思想,刷新后的API。
- **LangGraph swarm topology**(Lessão 13): através da transferência de ferramentas compartilhadas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- **Custom actor runtime**Quando precisares de um transporte específico (NATS, RabbitMQ, GRPC)

## Entrega-o

`outputs/skill-actor-runtime.md`A tarefa de um determinado multi-agente é gerar um mínimo de tempo de execução de atores e um modelo de equipe.

## 练习

1. Adicione a fila de letras mortas: quando o operador lança uma mensagem de falha, deixa de colocar para uma verificação artificial.
2.  realização `SelectorGroupChat`: um ator selector 根据对话状态 选择谁处理下一条条消息──
3. 添加分布式运输:把 in-process queue 替换为 JSON-over-HTTP server,让演员可以运行在独立进程中──
4. Para cada mensagem, entrem num espaço de tempo de tempo de trabalho ou não-operação.`gen_ai.agent.name`- Não.`gen_ai.operation.name`- Não.
5. 阅读AutoGen v0.4's architecture post──把你的玩具移植到真正的`autogen_core`Qual é o que você passou por cima da produção?

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Actor | "Agent" | 私有 state + inbox + handler；没有共享 memory |
| Message | "Event" | 类型化 payload；actor 交互的唯一方式 |
| Inbox | "Mailbox" | 每个 actor 的 pending message queue |
| Runtime | "Agent host" | 路由 message 并隔离失败的 event loop |
| Topic | "Channel" | actor 之间命名的 publish-subscribe route |
| Fault isolation | "Let it crash" | 一个 actor 失败不会让其他 actor 崩溃 |
| RoundRobinGroupChat | "固定轮转 team" | Agent 按顺序轮流行动 |
| SelectorGroupChat | "按 context 路由的 team" | Selector 选择下一位 |
| Magentic-One | "参考 team" | 用于 web + code + files 的 multi-agent squad |

## 延伸阅读

- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) redesenho 文章
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Alternativa em forma de gráfico
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) AutoGen 默认发射 span
