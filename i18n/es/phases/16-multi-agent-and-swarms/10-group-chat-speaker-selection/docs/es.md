# Cambio de grupos y selección de altavoces

> AutoGen GroupChat y AG2 GroupChat compartieron una conversación entre N 个代理; un selector 函数(LLM、round-robin o custom) seleccionar el siguiente orador。 es el prototipo emergente de conversación multi-agente: los agentes no saben que ellos mismos en el gráfico de estado en estado de estado, simplemente reaccionan a la piscina de compartir。 GroupChat de AutoGen v0.2 se conserva en el AG2 fork; AutoGen v0.4 lo volverá a escribir como un modelo de actor impulsado por eventos. Microsoft  en el 2 de mayo de 2026  AutoGen  en el modelo de mantenimiento,  en el Kernel Semántico  se fusionará con Microsoft Agent Framework  en el 2 de mayo de 2026                                                                                                                                                                        

**类型：**学习 + 构建
**语言：**Python (stdlib)
**前置条件：**Fase 16 · 04 (modelo primitivo)
**时间：**- 60 minutos

##  problemas

Cuando el flujo de trabajo 已知时,静态图表 (LangGraph) es muy útil. La conversación real no es静态.

Eso es lo que hace AutoGen GroupChat.

## 概念

### 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形状 形 形   形     形                                                                                                                                                                                                                                                                                                                                                                      

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

Cada agente puede ver cada mensaje. Cada turno de la sesión, convoca un selector para seleccionar al siguiente orador.

### Tres tipos de selectores

**Round-robin。**固定循环──确定性──按N 线性扩展, pero se ignorará la siguiente: incluso el tema es la revisión legal, el codificador también obtendrá una ronda de veces──

**LLM-selected。**调用一个LLM,它读取最近池内容并返回最合适的下一个发言人──具有上下文感知能力,但速度慢:每轮都会增加一次LLM 调用──AutoGen的默认方式──

**Custom。**Una función Python, que contiene cualquier lógica que desee.

### API de Agente de conversación

```
agent = ConversableAgent(
    name="coder",
    system_message="You write Python.",
    llm_config={...},
)
chat = GroupChat(agents=[coder, reviewer, tester], messages=[])
manager = GroupChatManager(groupchat=chat, llm_config={...})
```

`GroupChatManager`持有选民──当一个代理──完成一轮后,经理会调用选民,选民 返回下一个代理──循环持续到满足终止条件──

### 终止

Tres tipos de modalidad:

- **Max rounds。**Para el total de turnos de la configuración de la cantidad de veces
- **"TERMINATE" token。**Los agentes pueden enviar un mensaje sentinela; el gerente se detiene cuando aparece.
- **Goal-reached check。**Un verificador de la cantidad de luz cada vez que se ejecuta una vez, y en el chat 完成时停止──

### AutoGen → AG2 分裂, así como Microsoft Agent Framework 合并

A principios de 2025, Microsoft comenzó a realizar una reescritura importante en torno al modelo de actores impulsado por eventos para AutoGen(v0.4) .

En febrero de 2026, Microsoft anunció que AutoGen entrará en el modelo de mantenimiento, modelo de actores impulsado por eventos.**Microsoft Agent Framework**(RC 2026 年 2 月,现在已与语义核心合并) ――GroupChat 概念在两条路线中都保留下来;实现细节不同──对于兼容 v0.2 的代码,AG2 是首选上流──

### ¿Cuándo se adapta a GroupChat?

- **Emergent conversations。**No quieres conectar con el próximo orador posible.
- **角色混合任务。**Coder 问 researcher, researcher 问档案员,档案员 再问回编码员──流程不是DAG──
- **探索式问题解决。**Imagina la tempestad del cerebro, no la corriente de agua.

### ¿Cuándo fracasará?

- **严格确定性。**El selector de LLM puede no coincidir.
- **Sycophancy cascades。**Los agentes se someterán a las personas más confiadas en su palabra.
- **Context bloat。**Cada agente ciudad会读取每条消息;10 轮后文本会很大──使用预测(LECCIÓN 15)来限定视图范围──
- **Hot speakers。**某个代理因为选择者 偏好其专长而主导对话――将扬声器平衡 作为选择者特征 引入――

### El chat de grupo vs supervisor

Igual que las primitivas, diferente valor de la memoria:

- Supervisor: un agente 规划, otros agentes 执行── Selector es el planificador 接下来做什么──
- Chat de grupo: todos los agentes son pares; el selector es una función que actúa en el grupo compartido.

两者都使用课 04 中的四个原始语――gruposchat 默认使用LLM-select orchestration 和 full-pool shared state――


```figure
swarm-speaker
```

## Construirlo

`code/main.py`Utilizando el programa de trabajo desde el punto de vista de la realización de un grupo de chat.`TERMINATE`El símbolo de la terminación.

La demo imprimirá la transcripción de conversación de dos variables y el rastro de decisión del selector.

运行:

```
python3 code/main.py
```

## Usalo

`outputs/skill-groupchat-selector.md`Se trata de un programa de trabajo de trabajo de la empresa de gestión de la información y de la información.

##  Publicarlo

Lista de control:

- **Max rounds cap。**始终需要──typical task for 10-20──
- **Speaker-balance metric。**Seguir el número de vueltas de cada agente; cuando el desequilibrio excede el valor del tiempo de la notificación.
- **Termination token。** `TERMINATE`O agente de verificación especial.
- **Projection 或 scoped memory。**Después de 10 mensajes, sólo debe dar a cada agente una visión de alcance, para evitar la inflamación del contexto.
- **Selector logging。**对于LLM-selected 变体,同时记录选择员的输入和选择――否则无法调试――

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Compare la ronda de trabajo con la conversación siguiente seleccionada por el LLM.
2. En el selector, incluye una sección de "max-speaks-per-agent" 规则──¿Cómo afecta la transcripción?
3.  Lograr la terminación alcanzada: ¿Cuál es la frecuencia de la respuesta al "aprobado"  Cuando se detiene  ¿Cuál es la frecuencia de la terminación antes de la captura de la ronda?
4. 阅读 AutoGen estable doc 中关于 GroupChat 的内容(https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html）。识别 `GroupChatManager`Utilización del selector por defecto
5. 阅读 AG2 repo(https://github.com/ag2ai/ag2），并将其¿Qué características específicas ha aumentado el grupo de chat con el v0.4 en comparación con la versión basada en eventos?

## 关键术语: "El hombre es un hombre"

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

- [AutoGen group chat docs](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html) Implementación de referencia
- [AG2 repo](https://github.com/ag2ai/ag2) 社区延续的 AutoGen v0.2
- [Microsoft Agent Framework docs](https://microsoft.github.io/agent-framework/) 合并后的继任者,RC 2026 年 2 月
- [AutoGen v0.4 release notes](https://microsoft.github.io/autogen/stable/) Actrito modelo impulsado por eventos 重写细节
