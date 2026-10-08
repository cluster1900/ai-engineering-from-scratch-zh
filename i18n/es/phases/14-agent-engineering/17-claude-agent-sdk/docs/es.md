# Claude Agente SDK:Subagents y Sesión de la tienda

> Claude Agent SDK es un código de Claude. El código de Claude es un código de código de Claude.

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 分钟

## El objetivo del aprendizaje
- 解释 Antropic Client SDK(API cruda) y Claude Agent SDK(forma de arnés) entre la diferencia
- 描述 subagents:parallelización y aislamiento de contexto,以及何时使用它们──
- Cuál es la superficie de almacenamiento de sesión de Python SDK`append`¿ Qué ?`load`¿ Qué ?`list_sessions`¿ Qué ?`delete`¿ Qué ?`list_subkeys`) y `--session-mirror`El efecto de la acción.
- 实现 un arnés stdlib, contenida herramientas incorporadas 带隔离的背景的 subagent spawning 生命周期 hooks 和 sesiones de almacenamiento ⋅

##  problemas
La API de LLM Raw sólo te da una vez y vuelta. El agente de producción necesita ejecución de herramientas, servidores MCP, ganchos de ciclo de vida, desove subagente, persistencia de sesión, propagación de rastros.

## 概念
### SDK del cliente vs SDK del agente

- **Client SDK (`anthropic`).**API de mensajes en bruto. Tú mismo eres responsable de la bucle. herramientas y estado.
- **Agent SDK (`claude-agent-sdk`).**Ejecución de herramientas integradas, conexiones MCP, ganchos, desove subagente, tienda de sesiones, también como bucle de código de Claude proporcionado por la biblioteca.

### Herramientas incorporadas

SDK 开箱附附10+ herramientas: archivo leer/escribir,shell,grep,glob,web fetch, etc.

### Sub-cargas

Anthropic ha registrado dos usos:

1. **Parallelization.**并发运行独立工作──Encuentra el archivo de prueba para cada uno de estos 20 módulos 是 20 个 paralelos subagente tareas──
2. **Context isolation.**Los subjugantes utilizan su propia ventana de contexto; sólo los resultados regresan al orquestrador.

Nuevos proyectos recientes de Python SDK:`list_subagents()`¿Qué es esto?`get_subagent_messages()`, para leer las transcripciones de subagento.

### Tienda de sesiones

Paridad de protocolo con TypeScript:

- `append(session_id, message)` 添加一个转
- `load(session_id)`Recuperar la conversación.
- `list_sessions()`¿Qué es eso?
- `delete(session_id)` 带有对 subagent sesiones de cascada
- `list_subkeys(session_id)` 列出 claves subagentes。

`--session-mirror`(Bandera CLI) se refleja en el archivo externo en transcripción en streaming, para facilitar el desbateo.

### Los ganchos

Puedes registrarte en los ganchos de ciclo de vida:

- `PreToolUse`¿ Qué ?`PostToolUse` puerta o llamadas de herramientas de auditoría。
- `SessionStart`¿ Qué ?`SessionEnd` instalar y derribar.
- `UserPromptSubmit` En el modelo see input del usuario 之前采取行动──
- `PreCompact` 在 contexto de compactación 之前运行。
- `Stop` salida del agente 时 limpieza。
- `Notification` Alertas de canales laterales。

Los ganchos son un proceso de trabajo pro-flujo (Fase 14 de referencia del currículo) y un sistema similar para agregar comportamiento transversal.

### Contexto de la traza W3C

调用方上活跃的 OTel spans 会通过W3C trace context header 传播到CLI subprocese──整个 multiproceso trace 会在你的后台中显示为一个跟踪──

### Claude manejaba a los agentes

Hosted 替代方案                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `managed-agents-2026-04-01`)― Trabajo de sincronización de larga duración―acopio rápido integrado―compactación integrada―con control 换取管理基础设施―

### Este patrón es fácil de encontrar

- **Subagent over-spawn.**Por 100 pequeñas tareas se producen 100 sub-gentes.
- **Hook creep.**Cada equipo añade ganchos; tiempo de inicio  expansión                                                                                                                                                                                                                                                        
- **Session bloat.**Sesiones 持续累积; tamaño 增长──使用 `list_sessions`+ Política de vencimiento.


```figure
ae-subagent-isolation
```

## Construirlo
`code/main.py`Utilizando la forma de SDK:

- `Tool`¿ Qué ?`ToolRegistry`, contiene incorporado `read_file`¿ Qué ?`write_file`¿ Qué ?`list_dir`¿Qué es eso?
- `Subagent` contexto privado ‧irribo aislado ‧ retorno de resultados ‧
- `SessionStore` añadir, cargar, listar, borrar, listar y subkeyes
- `Hooks`¿ Qué es esto ?`pre_tool_use`¿ Qué ?`post_tool_use`¿ Qué ?`session_start`¿ Qué ?`session_end`¿Qué es eso?
- Una demostración: el agente principal desata en paralelo 3 subgentes, cada uno aislado, agrega los resultados,并 persiste sesión.

运行:

```
python3 code/main.py
```

Trace 会展示 subagente contexto aislamiento(tamaño de contexto del orquestrador  mantener limitado) 、 ejecución del gancho 和 persistencia de la sesión。

## Usalo
- **Claude Agent SDK**Usado para querer Claude Code de la forma del arnés de Claude-primeros productos.
- **Claude Managed Agents**Usándolo en el trabajo de asíncrono de larga duración.
- **OpenAI Agents SDK**(Lección 16) para las primeras contrapartes de OpenAI:
- **LangGraph + custom tools**Si quieres una máquina de estado en forma de gráfico...

##  entregarlo
`outputs/skill-claude-agent-scaffold.md`Una aplicación de SDK de Claude Agent, que contiene subagentes, ganchos, tienda de sesiones, servidor MCP y W3C de la propagación de rastros.

##  ejercicios
1. Añadir un subagente desoveador, poner 20 tareas lote 成每组 5 subagentes paralelos── medir el tamaño del contexto del orquestrador con la comparación de una por tarea──
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `PreToolUse`¿Qué es eso?`write_file`Las llamadas  llevar a cabo el límite de velocidad  Cada sesión  Cada minuto 5 veces)  Trace este comportamiento 
3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `list_subkeys`¿Qué se ve en el árbol subagente?
4. Para que este juego sea real.`claude-agent-sdk`Paquete Python ―Registro de herramientas ¿Qué ocurre con el cambio?
5. ¿Cuándo pasará de ser auto-host a ser administrado?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent SDK | “Claude Code as a library” | Harness shape：tools、MCP、hooks、subagents、session store |
| Subagent | “Child agent” | Separate context、own budget；results bubble up |
| Session store | “Conversation DB” | Persist、load、list、delete turns，并带 subagent cascade |
| Hook | “Lifecycle callback” | Pre/post tool、session、prompt submit、compact、stop |
| W3C trace context | “Cross-process trace” | Parent span propagates into CLI subprocess |
| Managed Agents | “Hosted harness” | Anthropic-hosted long-running async work |
| `--session-mirror` | “Transcript mirror” | 在 session turns streaming 时将它们写入外部文件 |
| MCP server | “Tool surface” | 附加到 agent 的外部 tool/resource source |

## 延伸阅读
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Código de Claude
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)  生产模式
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) programa de cambio
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) contraparte
