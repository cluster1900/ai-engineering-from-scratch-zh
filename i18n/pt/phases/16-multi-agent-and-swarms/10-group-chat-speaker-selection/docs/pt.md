# Grupo de Chat e Seleção de Oradores

> AutoGen GroupChat e AG2 GroupChat são distribuídos entre N 个代理; um selector 函数 (LLM、round-robin ou custom) 选择下一个发言人── é um protótipo emergente de conversação multi-agente: os agentes não sabem de si mesmos no gráfico em estado estático, eles apenas reagem ao grupo de partilha.

**类型：**学习 + 构建
**语言：**Python (stdlib)
**前置条件：**Fase 16 · 04 (Modelo primitivo)
**时间：**- 60 minutos.

## 问题

Quando o fluxo de trabalho  já conhecido, gráficos estáticos  LongGraph) muito útil Conversão real não estática: às vezes o programador vai perguntar ao revisor, às vezes o pesquisador, às vezes o escritor vai perguntar 硬编码 cada tipo de entrega possível vai gerar vantagem Explosion Você quer que os agentes reagam ao compartilhamento de recursos*, e que seja determinado por uma função que decida o próximo que falar

É o que o AutoGen GroupChat faz.

## 概念

### 形状

```
              ┌─── shared pool ────┐
              │   m1  m2  m3  ...  │
              └─────────┬──────────┘
                        │ (everyone reads all)
      ┌───────┬─────────┼─────────┬───────┐
      ▼       ▼         ▼         ▼       ▼
    Agent A  Agent B  Agent C  Agent D  Selector
                                           │
                                           ▼
                                  "next speaker = C"
```

Cada agente pode ver cada mensagem. Cada turno pode convocar um selector para escolher o próximo orador.

### 三种选选器 风格

**Round-robin。**固定循环──确定性──按N 线性扩展,但会忽略上下文: mesmo tópicos são revisão legal, o codificador também obterá rotas次──

**LLM-selected。**调用一个LLM,它读取最近的池内容并返回最合适的下一个发言人──具有上下文感知能力,但速度慢:每一轮都会增加一次LLM 调用──AutoGen的默认方式──

**Custom。**Uma função Python, contendo qualquer lógica que você deseje.

### API de Agente Conversable

```
agent = ConversableAgent(
    name="coder",
    system_message="You write Python.",
    llm_config={...},
)
chat = GroupChat(agents=[coder, reviewer, tester], messages=[])
manager = GroupChatManager(groupchat=chat, llm_config={...})
```

`GroupChatManager`持有选择者──当一个代理──完成一轮后,经理会调用选择者,选择者 返回下一个代理──循环持续到满足终止条件──

### 终止

Três tipos de comportamento:

- **Max rounds。**Para o número total de vezes de configuração de duração.
- **"TERMINATE" token。**Os agentes podem enviar uma mensagem sentinela; o gerente parar quando ela aparecer.
- **Goal-reached check。**Um verificador de quantidade leve, cada rodada executada uma vez, e o chat termina quando termina.

### AutoGen → AG2 分裂, bem como Microsoft Agent Framework 合并

No início de 2025, a Microsoft começou a realizar uma reescritura significativa em torno do modelo de atores orientado a eventos para o AutoGen(v0.4) .

Em 2 de Fevereiro de 2026, a Microsoft anunciou que a AutoGen entrará no modelo de manutenção, modelo de atores orientado por eventos.**Microsoft Agent Framework**(RC 2026 年 2 月,现在已与语义核心合并) ――GroupChat 概念在两条路线中都保留下来;实现细节不同──对于兼容 v0.2 的代码,AG2 是首选上游──

### 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适合 什么时候适适适的

- **Emergent conversations。**Não queres estar ligado a todos os outros falantes.
- **角色混合任务。**Coder 问研究员,研究员 问档案馆员,档案馆员 再问回编码器──流程不是DAG──
- **探索式问题解决。**Imaginem-se a uma reunião de tempestade, e não a uma corrente de água.

### Quando é que vai falhar?

- **严格确定性。**O selector de LLM pode não concordar.
- **Sycophancy cascades。**Agentes vão obedecer a quem tem mais confiança.
- **Context bloat。**Cada agente vai ler cada mensagem; 10 voltas depois, o contexto vai ser muito grande.
- **Hot speakers。**某个代理因为选择者 偏好它的专长而主导对话――将扬声器平衡 作为选择者特征 引入──

### Chat de grupo vs supervisor

Como primitivos, diferente valor de referência:

- Supervisor: um agente 规划, outros agentes 执行── Selector é o questionador 接下来做什么──
- Chat de grupo: todos os agentes são pares; selector é uma função que interfere na função de compartilhamento.

两者都使用课 04 中的四个原始人──grupos de conversa 默认使用 LLM-selected orchestration 和 full-pool shared state──


```figure
swarm-speaker
```

## Construí-lo

`code/main.py`Utilizando o seu trabalho de zero para implementar um GroupChat.`TERMINATE`O símbolo é o fim.

A demonstração imprimirá a transcrição da conversa de dois variantes e o rastro de decisão do selector.

运行:

```
python3 code/main.py
```

## Use-o

`outputs/skill-groupchat-selector.md`会为给定任务配置 GroupChat selector:round-robin vs LLM-selected vs custom, bem como utilizar quais são as entradas do selector (recentes mensagens, especialidades de agentes, contagens de turno)

##  Publicá-lo

Lista de verificação:

- **Max rounds cap。**始终需要──typical task for 10-20──
- **Speaker-balance metric。**Seguir o número de rotas de cada agente; quando o desequilíbrio excede o valor do tempo de aviso.
- **Termination token。** `TERMINATE`Ou agente de verificação especializado.
- **Projection 或 scoped memory。**约10 条消息 后,考虑只给每个代理一个范围视图,以防止背景膨胀──
- **Selector logging。**对于LLM-selected 变体,同时记录选择者的 input 和 choice──否则无法调试──

## 练习

1. 运行 `code/main.py` Comparar a rotina com a seleção de LLM.
2. Em selector, entre outros, um artigo sobre "max-speaks-per-agent" 规则── como isso afeta a transcrição?
3.  Realizar a terminação atingida: quando o revisor  retornar "aprovado" 时停止── é que é a freqüência de touch 发发在圆顶之前是多少?
4. 阅读 AutoGen estável docs 中关于 GroupChat 的内容(https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html）。识别 `GroupChatManager`Utilize of default selector。
5. 阅读 AG2 repo(https://github.com/ag2ai/ag2），并将其V0.2 GroupChat versus v0.4 event-driven  versão em relação à v0.4  aumentou quais características específicas ((trensagem, tolerância a falhas, composibilidade)?

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| GroupChat | "Agents in one chat room" | Shared message pool + selector function。AutoGen / AG2 primitive。 |
| Speaker selection | "Who talks next" | 选择下一个 agent 的函数。Round-robin、LLM-selected 或 custom。 |
| GroupChatManager | "The meeting host" | 拥有 selector 并循环处理轮次的 AutoGen component。 |
| ConversableAgent | "The base agent" | AutoGen base class；一个可以发送和接收 messages 的 agent。 |
| Termination token | "The 'stop' word" | 结束 chat 的 sentinel string（通常是 `TERMINATE`）。 |
| Hot speaker | "One agent dominates" | selector 不断选择同一个 agent 的 failure mode。 |
| Context bloat | "Pool grows unbounded" | 每个 agent 都读取所有先前 message；context 随轮次增长。 |
| Projection | "Scoped view" | 面向角色的共享池视图，用于防止 context bloat。 |

## 延伸阅读

- [AutoGen group chat docs](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html) Implementação de referência
- [AG2 repo](https://github.com/ag2ai/ag2) 社区延续的 AutoGen v0.2
- [Microsoft Agent Framework docs](https://microsoft.github.io/agent-framework/) 合并后的继任者,RC 2026 年 2 月
- [AutoGen v0.4 release notes](https://microsoft.github.io/autogen/stable/) Actor modelo orientado a eventos 重写细节
