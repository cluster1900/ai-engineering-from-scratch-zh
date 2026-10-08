# El hombre en el círculo: proponer y luego comprometerse

> 2026 años sobre HITL el consenso es concreto. No es agent 发问, usuario点击 Approve── é é é é é é proponer-then-commit: acciones propuestas 会连同无权关 持久化到可持久存储; con intención DATA lineage、permisos tocados、blast radius 和 rollback plan 呈现给评审员; sólo en明确确认后才 commit; ejecutar后再验证,确认副作用 确实发生──`interrupt()`Además de PostgreSQL de control de puntos de control, Microsoft Agent Framework de`RequestInfoEvent`, y Cloudflare `waitForApproval()`Todo lo que se ha logrado es un modo de fracaso típico: la aprobación de sello de goma:  Approve?  No ha pasado por revisión 

**Type:** 学习
**Languages:** Python (stdlib，带 idempotency 的 propose-then-commit state machine)
**前置要求：**Fase 15 · 12 (execución duradera), Fase 15 · 14 (Tripwires)
**Time:** ~60 分钟

##  problemas

El usuario debe decidir: ratificar o no ratificar. Si la decisión es instantánea, es muy probable que no sea revisión. Si la decisión es estructurada, será más lenta, pero es posible que sea posible.

El patrón HITL de 2023 年代 是同步提示:Agent quiere enviar un correo electrónico a X con el cuerpo Y  aproba? 用户点击 Approve。 Todo el mundo siente que el sistema es seguro。 En la práctica, esta interfaz es muy fácil de ser etiquetada de goma: el usuario aprobó rápidamente, la aprobación 几乎不能预测什么; cuando el agente salió en el momento equivocado, el rastro de auditoría mostrará una larga serie de usuarios ya se han acordado de la aprobación 历史。

El patrón de 2026 años, es decir, proponer-entonces-comprometer,把 HITL 移至耐久基板上,附加结构化转基因,并要求积极承诺──cada agente administrado SDK 都提供某版本:LangGraph `interrupt()`、Microsoft Agent Framework `RequestInfoEvent`、Cloudflare `waitForApproval()` API 名称不同;形态相同──

## 概念

### máquina de proponer y luego comprometer el estado

1. **Propose.**Agente 生成一个拟议的行动――它被持久化到持久存储(PostgreSQL、Redis、Durable Object) ‒incluye:
   - Intención (agente) ¿Por qué hacer esto?
   - Lineación de datos (¿Qué fuente ha llevado a esta propuesta)
   - permisos tocado(哪些 ámbitos / archivos / puntos finales)
   - Redio de explosión (¿qué es lo peor que ocurre?)
   - plan de retroceso (si se compromete, ¿cómo podemos revocarlo)
   - clave de la independencia (cada propuesta 唯一;重复提交返回同一条记录)
2. **Surface.**Revisor 看到包含全部的 мета数据的提案──Revisor 是人(不是 agente 自己 review 自己)──
3. **Commit.**明确肯定确认──acción 执行──
4. **Verify.**执行后,读取并确认副作用──如果验证步骤 失败,系统处于已知坏状态,并触发警报──

### clave de impotencia

没有idempotency key 时,transit failure 后的重试可能重复执行已批准的行动──具体例:用户批准转移100美元从A到B──网络短暂动──网络工作流重新尝试──用户只批准一次,但转移 执行两次──idempotency key 将批准 绑定到单个单个副作用;第二次执行是无-op──

Esto es similar al patrón de idempotencia de uso de las API de Stripe y AWS.

### Durabilidad: ¿Por qué las aprobaciones pueden durar en el proceso de sobrevivir?

La sala de espera de la aprobación es un segmento no perteneciente al agente de propiedad estatal. El flujo de trabajo se suspende.`interrupt()`Con PostgreSQL control de puntos de control 配对, en lugar de sólo con estado de memoria: dos días después de la aprobación  todavía puede encontrar un flujo de trabajo completo.

### Aprobaciones de sello de caucho y mitigación de los retos y respuestas

HITL Approve / Reject botones) generarán rápida aprobación, pero no hay una revisión real.

- ¿Entiendes que esta operación se refiere a qué recurso?
- ¿Confirmas que el radio de la explosión puede ser aceptado?
- ¿Si fracasas, tienes un plan de retroceso?

Esto no es para el proceso, sino una función forzante.

### ¿Qué es lo que es consecuencia?

No es necesario que cada acción proponga y luego comprometa.

- **Consequential actions**(始终 HITL): inávoltas escritos, transacciones financieras, comunicaciones salientes, cambios en la base de datos de producción, operaciones destructivas del sistema de archivos.
- **Reversible actions**(有时 HITL): las ediciones de archivos locales ‧cambios de fase ‧ con un claro retroceso de escrituras reversibles ‧
- **Reads and inspections**(从不 HITL):读取文件、列出资源、调用只读的API──

### Verificación posterior a la acción

El compromiso se ejecutó  不等于 the side effect happened──Red-partition 和 race conditions 可能让工作流 以为自己成功,而后端 实际并没有持续──verificar paso 会在提交 后重新阅读目标资源 以确认──这与使用`RETURNING`las cláusulas de las transacciones de base de datos, o`PutObject`后执行 AWS `GetObject`Es el mismo patrón.

### Artículo 14 de la Ley de IA de la UE

Artículo 14  Requerir sistemas de IA de la UE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 


```figure
mx-propose-then-commit
```

## Usalo

`code/main.py`Usando stdlib Python 实现 una máquina de estado de propuesta-entonces-compromiso。 Almacenamiento duradero es un archivo JSON。Chible de capacidad de hash ‒ (thread_id, action_signature) ‒driver 模拟三种情况:干净的批准流、过渡失败 后再尝试(必须不能双执行),以及 el estándar de sello de goma y el flujo de desafío y respuesta ‒对比──

##  entregarlo

`outputs/skill-hitl-design.md`Revisar un flujo de trabajo propuesto de HITL ¿tiene o no un formato de propuesta-entonces-compromiso, y se marca la falta de metadatos, la capacidad de verificación o las capas de desafío y respuesta?""

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Reprobar la propuesta aprobada 会 utilizar un registro duradero, y no volver a ejecutar── luego poner la clave de imposibilidad 改成包含时刻, mostrar retry 会 doble ejecutar──

2. Uso `rollback`campo  Expandir el registro de la propuesta―模拟一次验证步骤 失败的执行―展示滚动会自动触发―

3. 阅读 Microsoft Agent Framework de `RequestInfoEvent`Docs.  Find out API 包含但玩具机 缺失一个元数据字段──添加它,并解释它防护风险──

4. Para una acción concreta (por ejemplo, publicar en una cuenta pública de Twitter) diseñar una lista de verificación de desafíos y respuestas.

5. 选择一个同步 批准?快速 足够的场景(不需要持久的店) ――解释原因,并说明你接受的风险类──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|---|---|---|
| Propose-then-commit | “Two-phase approval” | 持久化 proposal + positive commit + verify |
| Idempotency key | “Retry-safe token” | 每个 proposal 唯一；第二次 execution 为 no-op |
| Data lineage | “Where it came from” | 导致 proposal 的具体 source content |
| Blast radius | “Worst case” | action 出错时的影响范围 |
| Rubber-stamp | “Fast approval” | 没有真正 review 就点击 “Approve” |
| Challenge-and-response | “Forcing checklist” | Reviewer 必须明确确认具体问题 |
| RequestInfoEvent | “MS Agent Framework primitive” | 带结构化 metadata 的 durable HITL request |
| `interrupt()` / `waitForApproval()` | “Framework primitives” | 同一形态的 LangGraph / Cloudflare 等价物 |

## 延伸阅读
- [Microsoft Agent Framework — Human in the loop](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop)¿ Qué es esto ?`RequestInfoEvent`,aprobaciones duraderas"".
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/)¿ Qué es esto ?`waitForApproval()`Y objetos duraderos
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) HITL 作为长远风险的缓解──
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/)  高风险系统的监管基线──
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)  Enmarcamiento constitucional de la supervisión 
