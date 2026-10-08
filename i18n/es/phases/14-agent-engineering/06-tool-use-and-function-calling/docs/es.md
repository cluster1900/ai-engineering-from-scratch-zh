# Uso de herramientas y llamadas de funciones

> Toolformer (Schick et al., 2023) 开创了自监督工具注释──Berkeley Function Calling Leaderboard V4 (Patil et al., 2025) 设定了2026年标准:40% agente ‧30% multi-turn、10% live、10% no-live、10% alucinación──Single-turn 已解决──memoria、dynamic decision making 和 long-horizon tool chains 还没有解决──

**Type:** Build
**Languages:** Python (stdlib)
**前置要求:**Fase 14 · 01 (localización de agentes), Fase 13 · 01 (función llamada inmersión profunda)
**Time:** ~60 分钟

## El objetivo del aprendizaje
- 解释 Toolformer's auto-supervisado de entrenamiento señal: sólo cuando ejecutar puede reducir la próxima pérdida de token, sólo conservar las anotaciones de la herramienta.
- Explicar las cinco categorías de evaluación de BFCL V4, así como cada clase de medidas que.
- 实现 un registro de herramientas stdlib, contenida validación de esquemas, coacción de argumentos y ejecución sandboxing。
- 诊断 2026年的三个开放问题:longe horizonte de la cadena de herramientas, la toma de decisiones dinámicas y la memoria

##  problemas
早期 tool use 问的是:model 能否预测一个正确的功能调用?Modern tool use 问的是:model 能否跨 40 个步骤链式调用 tools,具备记忆,处理部分可观测性,恢复从工具故障中,并且不幻觉不存在的工具?

Toolformer  ha establecido un modelo de base: los modelos pueden ser utilizados mediante autocontrol.

## 概念
### El equipo de herramientas (Schick et al., NeurIPS 2023)

Pensamiento: Deja que el modelo utilice la API del candidato llamando a marcar su propio cuerpo de preentrenamiento. Para cada candidato, ejecutarlo. Sólo cuando contiene el resultado de la herramienta puede disminuir una token de pérdida, sólo puede conservar la anotación.

覆盖的工具:calculator、QA system、search engines、translator、calendar──autocontrol señal 纯粹关注工具 是否有助于预测文本,不需要人标签──

规模结果:工具使用 会在规模足够时涌现──较小的模型 会因工具注释受损;较大的模型会受益──这就是为什么2026年边界模型内置强的工具使用能力,而大多数7B模型需要显然工具使用精细调才可靠──

### El nivel de clasificación de las funciones de Berkeley V4 (Patil et al., ICML 2025)

El BFCL es una evaluación de hecho de 2026 años.

- **Agentic (40%)** 完整 agent trajectories:memoria, múltiples giros, decisiones dinámicas,
- **Multi-Turn (30%)** 带 herramientas cadenas de conversaciones de intercambio 
- **Live (10%)** Uso de las instrucciones de usuario (más difícil de distribuir)
- **Non-Live (10%)** casos de ensayo sintéticos。
- **Hallucination (10%)** 检测何时不应调用 herramienta──

V3 introdujo la evaluación basada en el estado: después de la secuencia de herramientas, se revisó el estado real de la API (por ejemplo, ¿ha sido creado un archivo?), en lugar de las llamadas de herramientas de AST. V4 aumentó la búsqueda web, la memoria y las categorías de sensibilidad al formato.

2026 年关键发现:llamando función de giro único 基本已经解决──失败集中在记忆(跨轮 携带背景)、tutor de decisión dinámica(basado en herramientas de selección de resultados previos)、cadenas de largo horizonte(20+ pasos 后漂移) y detección de alucinaciones(没有合适工具 时拒调用)。

### Esquema de herramienta

Cada proveedor tiene un esquema... pero comparte la misma forma:

```
name: string
description: string (what it does, when to use it)
input_schema: JSON Schema (properties, required, types, enums)
```

Antropic 直接使用 `input_schema`❖ OpenAI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `function.parameters`◊ ambos aceptan JSON Schema──Descripciones  asumir un papel clave, el modelo 会读取它们来选择正确的工具──糟糕的工具描述是选错工具 失败的第一大根原因──

### Validación de los argumentos

No hay ninguna llamada de herramientas.

1. **Type coercion.**Modelo puede en schema  requerir int de local return字符串 `"5"`■ Si el claro no existe discriminación, se trata de coerción; si no, se rechaza■
2. **Enum validation.**Si el esquema es  escribe `status in {"open", "closed"}`, y el modelo 输出 `"in_progress"`, en el error descriptivo rechazo.
3. **Required fields.**缺少 campo requerido -> 立即把 error observation 返回给模型,而不是 crash。
4. **Format validation.**Datos, correos electrónicos, URLs  Usar parseres específicos 验证, en lugar de regex¬

Cada falla de validación debe regresar a la observación estructural, haciendo que el modelo pueda volver a probar con la forma correcta.

### Llamadas paralelas de herramientas

现代 proveedores 支持在一个助手转中并行 herramienta llamadas。Loop:

1. El modelo emite 3 llamadas de herramientas, cada una con diferentes.`tool_use_id`¿Qué es eso?
2. Tiempo de ejecución  ejecutarlas 
3. Cada resultado es como`tool_result`bloque  regresar,并通过 `tool_use_id`¿Qué pasa?

工程规则:把相关性ID 当作关键约束──把它们交换,就会导致错误工具到错误结果路由──

### El sandboxing

La ejecución de herramientas es el límite de la caja de arena. Lección 09:`run_shell(cmd)`Es un peligro.`git_status()`Más seguro.


```figure
tool-routing
```

## Construirlo
`code/main.py`实现 un registro de herramientas de forma de producción:

- Validador de subconjunto JSON Schema (JSON Schema)
- Registro de herramientas, contenida descripción, esquema de entrada, tiempo de ejecución y ejecutor.
- El argumento coacción 和 enum validación¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- 带 correlación de identificación de la despacho paralelo de herramientas
- 作为结构化 strings 的错误观察──

¿Qué es eso ?

```
python3 code/main.py
```

Trace  muestra un mini agente en un turno en el que se utilizan tres herramientas, una de las cuales es una llamada deliberadamente malformada 会被拒绝,并返回模型 可以根据此行动的描述性错误──

## Usalo
Cada proveedor tiene su propio esquema de herramientas:Antropic、OpenAI、Gemini、Bedrock。 si necesita multi-proveedor, use la capa de traducción(OpenAI Agents SDK、Vercel AI SDK、LangChain herramienta adaptador)。BFCL es un referente de referencia; si el uso de herramienta es el núcleo del producto, publicar previamente, por favor, use it test your agent。

##  entregarlo
`outputs/skill-tool-registry.md`Se trata de un dominio de tareas específicas. Se trata de un catálogo de herramientas, esquema y registro.

##  ejercicios
1. Añadir una herramienta "no-op", hacer que el modelo pueda rechazar claramente el uso de cualquier otra herramienta.
2. ¿Por qué no se puede decir que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema es que el problema.
3. 添加 per-tool timeout 和 circuit breaker(连续失败 3 次后, en los 60s 内拒绝该工具) ―― ¿Cómo cambiará esto el modo de recuperación del modelo?
4. 阅读 BFCL V4 description──选择一个类别(例如"multi-turn"),并让你的代理 跑 10 个例子提示──报告通过率──
5. ¿Pidentic/Zod ha capturado un juguete? ¿No ha capturado lo que?

## 关键术语: "El hombre es un hombre"
| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Function calling | "Tool use" | 使用 validated schema 的 structured-output tool invocation |
| Toolformer | "Self-supervised tool annotation" | Schick 2023 — 保留那些结果能降低 next-Token Loss 的 tool calls |
| BFCL | "Berkeley Function Calling Leaderboard" | 2026 benchmark：40% agentic、30% multi-turn、10% live、10% non-live、10% hallucination |
| Tool schema | "给 model 的 function signature" | name、description、arguments 的 JSON Schema |
| tool_use_id | "Correlation ID" | 将 tool call 与其 result 绑定；对 parallel dispatch 至关重要 |
| Hallucination detection | "知道何时不调用" | V4 category：没有合适 tool 时拒绝调用 |
| Argument coercion | "String-to-int repair" | 针对可预测 schema mismatch 的窄修复；如果有歧义则 reject |
| Sandboxing | "Tool execution boundary" | 每个 tool 的 read/write surface、network、timeout、memory cap |

## 延伸阅读
- [Schick et al., Toolformer (arXiv:2302.04761)](https://arxiv.org/abs/2302.04761) Anotado de herramientas auto supervisadas
- [Berkeley Function Calling Leaderboard (V4)](https://gorilla.cs.berkeley.edu/leaderboard.html) Valoración de referencia de 2026
- [Anthropic, Tool use documentation](https://platform.claude.com/docs/en/agent-sdk/overview) Claude Agent SDK 中的 herramienta de producción esquema
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) tipo de herramienta de función 和 Guardrails
