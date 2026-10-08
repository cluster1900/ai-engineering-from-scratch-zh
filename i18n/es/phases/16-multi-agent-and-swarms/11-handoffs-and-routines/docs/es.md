# Las entregas y las rutinas  无状态编排

> OpenAI's Swarm (OpenAI's Swarm) (en inglés) será un multi-agente 编排提炼为两个原语:**routines**(como instrucciones de sistema de inmediato + herramientas) y **handoffs**(retorno a otra herramienta de agente)。 sin estado de máquina, sin ramificación DSLLLM 通过调用正确的 handoff tool 来路由。OpenAI Agents SDK(2025年 3月) es su sucesor de producción.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

##  problemas

Cada marco multiagente quiere que aprendas sus nodos y bordes de DSL:LangGraph, equipos y tareas de CrewAI, GroupChat y gerentes de AutoGen. Estos DSL son una verdadera abstracción, pero hacen que las cosas sean más importantes que las necesarias.

Swarm 走向相反方向: usar modelos ya poseen de herramienta-llamando 能力──Handoffs 变成 herramienta llamadas──Orchestrator 就是当前掌握对话的那个代理──状态机隐含在代理的系统提示中──

## 概念

### 两个原语

**Routine。**definición de agente 角色和可用工具的系统提示── puede considerarse como un conjunto de instrucciones con un rango de acción:你是分类代理; si el usuario pregunta por reembolsos, déle a un agente de reembolso──

**Handoff。**Agente puede ajustar una herramienta, que devuelve un nuevo objeto de Agente.

```
def transfer_to_refunds():
    return refund_agent  # Swarm sees Agent return → switch active agent

triage_agent = Agent(
    name="triage",
    instructions="Route the user to the right specialist.",
    functions=[transfer_to_refunds, transfer_to_sales, transfer_to_support],
)
```

El sistema de triaje del agente de solicitud de hacer que se basen en la información del usuario para seleccionar correctamente la entrega.

### ¿Por qué se ha propagado tan rápido?

- **API 小。**Sólo necesito aprender dos conceptos.
- **使用模型已经会做的事。**El llamado de herramientas ya ha alcanzado un nivel de producción entre los proveedores.
- **没有状态机负担。**Usted no necesita describir el gráfico; Las instrucciones de los agentes describen que se entregarán a los que se encuentren.

### 无状态取舍 无状态取舍 无状态取舍 无状态取舍

Swarm entre las ejecuciones es claro que es realmente inestable. El marco durante una ejecución conserva el historial del mensaje, pero no perdurará nada.

En producción en el entorno (OpenAI Agents SDK, 2025 年 3 月), esto es uno de los principales cambios:SDK 添加内置会议管理、防护和追踪,同时保留交付 原语──

### En el caso de las empresas de la Unión Europea, el riesgo de que las empresas de la Unión Europea se encuentren en situación de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo de riesgo

- **Triage patterns。**Un agente de línea se dirigirá al usuario a un especialista.
- **基于技能的 handoffs。**Si las tareas necesitan código, llama al codificador; si necesita investigación, llama al investigador。
- **短而有边界的对话。**Apoyo al cliente, preguntas frecuentes, flujos de trabajo simples.

### La escena de la comida

- **带共享 memory 的长 sessions。**Las entregas volverán a colocar el estado de conversación en el momento del nuevo agente, sin la memoria de la administración de la información, no se puede mantener el estado entre los agentes.
- **并行执行。**El cambio es una vez un agente activo, se cambia.
- **Audit 和 replay。**无状态 runs 很难精确重播; LLM 的交付 选择不是确定性的。

### OpenAI Agents SDK (SDK)

El siguiente sucesor de la clase de producción añadió:

- **Session state。**跨 runs 的持久线子──
- **Guardrails。**输入/输出 ganchos de validación。
- **Tracing。**Cada llamada y entrega de herramientas serán registradas.
- **Handoff filters。**Controlando el cambio de manos

de la producción original se conserva; producción disponible en torno a ella se completa.

### Swarm vs. grupo chat

两者都使用LLM-driven routing, pero la diferencia es**谁选择下一个**¿Qué es esto ?

- Grupo de chat: de la función externa o del MLL seleccionador de la opción externa.
- Swarm: Ahora agente 通过调用 handoff tool 选择它的继任者──

El grupo es el agente que decide el siguiente paso es lo que es; el grupo de chat es el gerente que decide el siguiente paso es lo que es. La decisión del grupo es la llamada de la herramienta del agente activo.`GroupChatManager`En el medio.


```figure
sw-handoff-routing
```

## Construirlo

`code/main.py`Desde zero realizar Swarm: una clase de datos de agente, un mecanismo de entrega, un instrumento, un agente de devolución y un agente de detección, un ciclo de ejecución de cambio.

Demo: un agente de triaje 会路由到退款, ventas o especialistas de apoyo. Cada especialista tiene sus propias herramientas.

运行:

```
python3 code/main.py
```

## Usalo

`outputs/skill-handoff-designer.md`Para determinar la topología de entrega de tareas: ¿qué agentes pueden utilizar las entregas? ¿qué pueden transferirse?

##  Publicarlo

Lista de control:

- **Handoff logging。**Cada vez que se entrega se escribe un evento de rastreo, que contiene una instantánea de agente a agente en el contexto.
- **上下文转移规则。**Decide el tiempo de entrega 时移动什么: historia completa 昂贵  最近 N 条消息,或总结
- **Handoff guardrail。**Cuando el especialista con permisos de herramientas diferentes tiene que pasar por el certificado o inyección rápida puede forzar a hacer que no se necesiten las entregas.
- **Loop detection。**Dos agentes que vuelven a entregarse es un fracaso habitual; con un simple control de anillo de última clase.
- **Fallback agent。**Si el objetivo de entrega no existe, regresa al valor de seguridad.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`,trayge to refund agent... confirme que el segundo round de agente activo es refund.
2. 添加循环-detection 规则: si los dos agentes han continuado a abandonar 3 veces, entonces se requiere el retiro.
3. 阅读OpenAI Agents SDK docs 中关于 handoff filters 的内容──实现一个总结在赠版本:agente saliente 在接管之前,将上下文压缩成弹总结──
4. ¿Qué patrón le dará la inyección rápida más grave, por qué?
5. 阅读 Cuinero de la manada(https://developers.openai.com/cookbook/examples/orchestrating_agents）。找出Una decisión de diseño de Swarm, explicó que OpenAI Agents SDK fue cambiado o se mantuvo.

## 关键术语: "El hombre es un hombre"

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
- [OpenAI Swarm repo](https://github.com/openai/swarm) Originario de la realización, como concepto de referencia reservado
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 带 sesiones 和 tracing de la producción de la clase posterior sucesor
- [Anthropic handoff-in-Claude notes](https://docs.anthropic.com/en/docs/claude-code) Claude Code subagents  cómo pasar `Task`Usar el patrón de similar entrega
