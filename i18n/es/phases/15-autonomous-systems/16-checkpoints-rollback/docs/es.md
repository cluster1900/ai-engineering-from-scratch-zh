# Puntos de control y retroceso

> Cada vez que el gráfico-estado  transformación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

**Type:** 学习
**Languages:** Python（stdlib，checkpoint 与 rollback state machine）
**Prerequisites:** Phase 15 · 12（Durable execution），Phase 15 · 15（Propose-then-commit）
**Time:** ~60 分钟

##  problemas

Ejecución duradera (LECCIÓN 12) ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️  ️ ️ ️ ️ ️ 

El sistema real se conecta a este mecanismo de diferentes maneras:

- **LangGraph**El trabajo se desprende de la oficina de trabajo y se vuelve a trabajar en la oficina de trabajo.`interrupt()`Está suspendido, pero también se perpetuará.
- **Cloudflare Durable Objects**Se guardan en el mismo estado de la división de la clave.
- **Microsoft Agent Framework**En el flujo de trabajo API expuesta `Checkpoint`Primitivos; replay 加 idempotency 覆盖 reintent──

无论哪种情况,真正有效的组合都是:idempotency key (pretección de la repetición de la ejecución) + preconditions check (controlar la condición) + post-action verification (controlar el efecto secundario) + verificación-fallo (controlar el proceso) 

## 概念

### Cada vez que se cambia , se perdurará .

El estado gráfico 转换 es el flujo de trabajo que se mueve de un estado de nombre a otro estado de nombre. Cualquier paso de un estado de nombre.

### Recuperación de arrendamiento

Cuando el trabajador se desplome, el flujo de trabajo no se pierde; arrendamiento (en inglés) es una declaración de corto plazo, que indica que el trabajador está ejecutando esta ejecución) es sólo un período de tiempo.

### Idempotencia + condiciones previas

只有自由还不够――考虑这种情况: un flujo de trabajo 批准执行当余额 > $1000 时，从 A 向 B 转账 $100──flow de trabajo 已 commit, en ejecutado en desplome, luego se recupera──folo sólo revisar la clave de desempotencia, y ejecutar la recuperación, entonces el transfer cheque se ejecuta una vez (正确)──folo considerar en desplome y recuperación, un saldo de A a través de otro flujo de trabajo 降至$500──flow de desempotencia 仍然通过;precondition 不通过──flow of precondition check,我们就会制造通过支──

Cada movimiento tiene consecuencias.

- **Idempotency key**: prevenir la re-re-execución
- **Precondition check**El estado de confirmación sigue siendo conforme al movimiento aprobado.

### 动作后验证 El proceso de ejecución

 herramienta 返回 200不是验证──真正的验证会重新读取目标状态,并确认副作用 确实发生了──模式包括:

- Actualización de la base de datos:`UPDATE ... RETURNING *`, y luego afirma que la fila de regreso coincide con el estado previsto.
- Enviar correo electrónico: enviar después en el carpeta de envío de la información.
- Escribir archivos: read回文件并计算 hash──
- API llamada: para el recurso objetivo  ejecutar posterior `GET`¿Qué es eso?

Si verifica el fracaso, el flujo de trabajo está en un estado de mal funcionamiento conocido.

### Planificaciones de retroceso

Cada uno de los proyectos de acción de la lección 15 tiene un plan de retroceso.

- **In-band rollback**: direct reversal efecto secundario`INSERT`后 `DELETE`, envío después `Send-correction-email`)。
- **Compensating transaction**Un nuevo movimiento, para borrar el movimiento original.
- **Out-of-band rollback**:Tictar humanos, suspender el flujo de trabajo, mantener el mal estado para investigar.

No rollback (no rollback) (no podemos deshacerlo) (no podemos deshacerlo) (no hay rollback) (no hay rollback) (no hay rollback) (no hay rollback) (no hay rollback) (no hay rollback) (no hay rollback) (no hay rollback) (no hay rollback) (no hay rollback) (no hay rollback) (no hay rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no rollback) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no) (no)) (no) (no) (no) (no) (no))

### Artículo 14 de la Ley de IA de la UE

Artículo 14  Requerir un sistema de alta seguridad para tener un control humano efectivo ∙∙ En el ámbito de la operación, el implementador suele leerse como:

- Puente de control puede ser consultado por el auditor.
- Rollback  ya ha practicado  al menos hasta el final test una vez)
- El rastro de auditoría puede continuar existiendo después de su implementación.
- La verificación de fracaso se hará en la alerta, en lugar de ser registrada en silencio.

Un flujo de trabajo Si se realiza un proceso de recuperación y luego se completa el efecto secundario sin verificar el proceso de retroceso, no se puede aprobar el artículo 14 测试。

### 尖失效模式:重复执行

Los accidentes de producción más comunes en este campo son:

1. 动作已批准, clave de la libertad 为 k---
2. Compromiso de empezar, ejecutar, regresar 200
3. Flujo de trabajo en el estado de la pérdida de tiempo.
4. Flujo de trabajo  Restablecimiento; ver ha sido aprobado pero no se ha comprometido; re-ejecutado
5. Efecto secundario 触发两次──

缓解方式: en ejecutar pre-持久化一个 in-flight意图, utilizar la clave de idempotency 执行, luego sólo en la prueba de éxito después de la operación se marca como committed────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────


```figure
checkpoint-replay
```

## Usalo

`code/main.py`实现 un flujo de trabajo con un punto de control, que incluye idempotency、preconditions、verification 和 rollback──driver 模拟四个场景:干净运行、崩后的重试(idempotency 捕获)、precondition failure(workflow 中止且不触发动作)、verify failure(触发 rollback)。

##  entregarlo

`outputs/skill-rollback-rehearsal.md`Para el flujo de trabajo propuesto diseñar pruebas de ensayo de retroceso,并审计 checkpoint backend

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`❖验证四个场景── Con respecto a la escena de choque durante el compromiso, confirmación de movimiento en varias pruebas en solo un solo momento──

2. Modificar marcar como se hace primero, luego hacerlo 模式, dejar que el estado escriba 在动作后触发──重新运行崩盘 场景──测量触发了多少重复动作──

3. Por ejemplo, el "post" en un canal Slack se clasificará como "in-band"",compensando" o "out-of-band" ("explicar tu motivo de elección").

4. 选一个你熟悉的工作流程――识别每一个状态转换――为每一个转换标记耐久性要求(persistente / no persisten)――统计你当前还没有持久化的数量――

5. Prueba de retroceso repetida: diseñar un test de extremo a extremo, ejecutar un flujo de trabajo real, hacer que se desmorone, y confirmar el camino de retroceso 被触发── ¿Qué debería decir este test?

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 它真正的含义 |
|---|---|---|
| Checkpoint | “保存点” | 每一次 graph-state 转换都会持久化到 durable store |
| Lease | “Worker 声明” | 短期声明，表示某个 worker 正在执行一个 run；崩溃时过期 |
| Precondition | “状态关卡” | 断言状态仍与已批准动作保持一致 |
| Post-action verify | “重新读取检查” | 确认 side effect 确实在目标系统中发生 |
| In-band rollback | “直接撤销” | 用逆向操作反转 side effect |
| Compensating transaction | “SAGA 撤销” | 一个新的动作，用来抵消原动作 |
| Mark-as-done-first | “状态写入顺序” | 在从 commit 返回前持久化 committed 状态 |
| Article 14 | “EU AI Act 人类监督” | 操作性含义：可查询 checkpoint、已演练 rollback、可审计 trail |

## 延伸阅读

- [Microsoft Agent Framework — Checkpointing and HITL](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) Primitivos de los puntos de control y recuperación de arrendamientos
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) Objetos duraderos 作为 estado基底。
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 监管基线──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) marco de fiabilidad del flujo de trabajo a largo plazo.
- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) Claude Code Routines 形态──
