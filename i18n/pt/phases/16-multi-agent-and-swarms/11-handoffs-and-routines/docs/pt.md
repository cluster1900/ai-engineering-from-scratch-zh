# Transferências e rotinas  无状态编排

> OpenAI's Swarm ([[2024年10月]]) vai ser multi-agente 编排提炼为两个原语:**routines**(como instruções de sistema de prompt + ferramentas)**handoffs**Não há nenhuma ferramenta de estado, não há ramificação DSLLLM 通过调用正确的 handoff tool 来路由──OpenAI Agents SDK(2025年 3月) é seu sucessor de produção.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 问题

Cada framework multi-agente espera que você aprenda os seus nodos e bordas da DSL:LangGraph; CrewAI; equipes e tarefas da AutoGen; GroupChat e gerentes; estes DSLs são um verdadeiro abstracto, mas fazem as coisas parecerem mais pesadas do que necessário.

Swarm 走向相反方向: usar modelos já possuem de ferramenta chamada 能力──Handoffs 变成工具调---Orchestrator é o agente que está atualmente em posse do diálogo──status机隐含在代理的系统提示中──

## 概念

### 两个原语

**Routine。** define o agente 角色和可用工具的系统提示── pode ser considerado como um conjunto de instruções com um domínio de acção:你是分类代理;

**Handoff。**Um agente pode ser configurado com uma ferramenta, ele retorna um novo objeto de agente.

```
def transfer_to_refunds():
    return refund_agent  # Swarm sees Agent return → switch active agent

triage_agent = Agent(
    name="triage",
    instructions="Route the user to the right specialist.",
    functions=[transfer_to_refunds, transfer_to_sales, transfer_to_support],
)
```

O sistema de triagem do agente de solicitação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

### Por que se espalhou tão rápido?

- **API 小。**Só preciso de aprender dois conceitos.
- **使用模型已经会做的事。**As chamadas de ferramentas já atingiram a fase de produção entre os fornecedores.
- **没有状态机负担。**Você não precisa descrever o gráfico; As instruções do agente descreverão que eles vão entregar 给谁──

### 无状态取舍

Swarm entre as corridas ∞ é claro que não há estado.

Em produção ambiente (OpenAI Agents SDK, 2025 3 月), é uma das principais mudanças: o SDK adicionou gestão de sessões de configuração interna, guarda-roupa e rastreamento, mantendo a transferência original.

### Acúmulo/caso de apoio 适合的场景

- **Triage patterns。**Um agente de linha vai passar o usuário para um especialista.
- **基于技能的 handoffs。**Se a tarefa precisar de código, ligue para o codificador; se precisar de pesquisa, ligue para o pesquisador.
- **短而有边界的对话。**Apoio ao cliente, perguntas frequentes, processos simples de trabalho.

### O cenário de massa

- **带共享 memory 的长 sessions。**As transferências vão colocar o estado da conversação em um novo momento de agência, com o histórico.
- **并行执行。**O "Handoff" é uma vez um agente ativo, que se muda.
- **Audit 和 replay。**无状态 runs 很难精确重播; LLM 的转发 选择不是确定性的。

### OpenAI Agents SDK(2025 年 3 月)

O seguinte foi adicionado:

- **Session state。**Trata-se de um fio de transmissão.
- **Guardrails。**输入/输出 ganchos de validação。
- **Tracing。**Cada chamada e entrega de ferramentas serão registradas.
- **Handoff filters。**Controle a transferência de dados.

a produção disponível em torno dele.

### Swarm vs GroupChat

两者都使用LLM-driven routing, mas a diferença é**谁选择下一个**- Não .

- GrupoChat:由外部的选择器 (FUNCTION OR LLM) de externa seleccionar o seu interlocutor.
- Swarm: Agora, o agente está a usar a ferramenta de entrega para escolher o seu reitor.

O grupo é o agente que decide o próximo passo é o que é; o grupoChat é o gerente que decide o próximo passo é o que é.`GroupChatManager`- Não.


```figure
sw-handoff-routing
```

## Construí-lo

`code/main.py`Desde zero realizando Swarm: uma classe de dados de agente, um mecanismo de transferência, um instrumento, um agente de retorno, bem como um ciclo de execução de um agente de controlo.

Demo: um agente de triagem 会路由到退款、销售或支持专家── cada especialista tem suas próprias ferramentas──run loop 会印每次转发──

运行:

```
python3 code/main.py
```

## Use-o

`outputs/skill-handoff-designer.md`Para determinar a topologia de entrega de tarefas: quais agentes podem ser utilizados, quais serão transferidos, quais serão colocados em posição de trabalho.

##  Publicá-lo

Lista de verificação:

- **Handoff logging。**Cada entrega é escrita num evento de rastreamento, contendo um snapshot de agente a agente.
- **上下文转移规则。**Decide Handoff 时移动什么: completa história 昂贵) 、 recente N 条消息, ou resumo。
- **Handoff guardrail。**O especialista com permissões de ferramentas diferentes deve passar por certificação.
- **Loop detection。**Os dois agentes voltaram para a frente e foram derrotados.
- **Fallback agent。**Se o alvo não existir, voltar para o valor de segurança.

## 练习

1. 运行 `code/main.py`, triagem para agente de reembolso... ...confirmar o agente ativo da segunda rodada é reembolso...
2. 添加循环-detection 规则: Se os dois agentes já tiverem continuado a desistir 3 vezes, então forçar a retirada.
3. 阅读OpenAI Agents SDK docs 中关于 handoff filters 的内容──实现一个总结在赠版本:outgoing agent 在 incoming agent 接管之前,将上下文压缩成弹总结──
4. Comparar o selector do GroupChatManager com o que é que vai fazer a injeção rápida mais grave, porquê?
5. 阅读 livro de cozinha de cachorro(https://developers.openai.com/cookbook/examples/orchestrating_agents）。找出Uma decisão de design de Swarm, explicando que o OpenAI Agents SDK foi alterado ou conservado.

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| Routine | “Agent prompt” | System prompt + tool list。定义角色和可用 handoffs。 |
| Handoff | “转交给另一个 Agent” | active agent 可以调用的一个 tool，它返回新的 Agent。runtime 会切换 active agent。 |
| Stateless | “runs 之间没有 memory” | Swarm 不持久化任何东西；memory 是调用方的责任。 |
| Active agent | “现在谁在说话” | 当前掌握对话的 Agent。Handoff 会改变它。 |
| Context transfer | “handoff 时移动什么” | incoming agent 能看到哪些 history 的策略：full、last N 或 summarized。 |
| Handoff loop | “Agents 来回 ping-pong” | 两个 Agents 不断 hand back 给对方的失败模式。 |
| OpenAI Agents SDK | “生产级 Swarm” | 2025 年 3 月的后继者；在 handoff 原语之上添加 sessions、guardrails、tracing。 |
| Handoff filter | “转移时的 gate” | SDK feature，用于在 handoff 边界检查和修改上下文。 |

## 延伸阅读

- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) 参考性阐述
- [OpenAI Swarm repo](https://github.com/openai/swarm) Originário realizado, como conceito de referência
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 带 sessões 和 tracing 的生产级后继者
- [Anthropic handoff-in-Claude notes](https://docs.anthropic.com/en/docs/claude-code) Claude Code subagents  como passar `Task`Use similar pattern of handsharing
