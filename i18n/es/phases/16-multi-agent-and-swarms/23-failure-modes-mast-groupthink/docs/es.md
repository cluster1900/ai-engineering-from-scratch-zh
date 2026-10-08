# 失效模式  MAST、Pensamiento de grupo、Monocultura、Erros de cascada

> Taxonomía de referencia para el año 2026 es**MAST**(Cemri et al., NeurIPS 2025, arXiv:2503.13657), se deriva de 7 个 state-of-the-art de código abierto MAS 的 1642 条执行 trace,显示出 **41–86.7% 的失败率** Tres raíces:**Specification Problems**(41.77%) 角色歧义、任务定义不清;**Coordination Failures**(36,94%) 通信中断、 desync state;**Verification Gaps**(21.30%) 缺少验证、缺少质量检查──**Groupthink**Famili(arXiv:2508.05687) complementó:clapso de la monocultura(seme modelo base → 相关失败)  sesgo de conformidad(agentes 相互强化彼此的错误)  deficiencia de teoría de la mente、 dinámica de motivos mixtos、 fallos en cascada de fiabilidad。 ejemplos de clase: tormentas de retiro, entre ellas una falla de pago 触发 order retries,进而触发 inventory retries,最终压 inventory service,几秒内 10x load  需要电路断断机)  Envenenamiento de memoria: alucinación de un agente 进入共享记忆,下游 agents 将准其当事率下降;确实逐渐,使根原因 诊断变得痛苦──**STRATUS**(NeurIPS 2025) informe que, a través de agentes de detección / diagnóstico / validación especializados, el éxito de la mitigación se ha incrementado 1,5 veces.

**Type:** 学习
**Languages:** Python (stdlib)
**前置要求:**Fase 16 · 13 (memoria compartida), Fase 16 · 14 (consenso y BFT), Fase 16 · 15 (topología de votación y debate)
**Time:** ~75 分钟

##  problemas

Los sistemas multiagentes en tareas reales tienen una tasa de fracaso de 41-86,7% (Cemri et al. 2025 en 7 MAS de código abierto) ⋅ esto no es sólo por añadir más agentes en el proceso de control ⋅ estos fracasos tienen causas estructurales― MAST taxonomía ⋅ ha dado clases― 本课把每类类映射到一个具体的检测、诊断和缓解模式,让这些数字不再显得任意―).

La práctica de producción de 2026 es la de eliminar los modos de fracaso cuando se diseña. Su arquitectura sólo puede dirigirse a cada categoría de MAST y decir que la mitigación ya implementada es suficiente.

## 概念

### Categorías de MAST

**Specification Problems（41.77% 的失败）。**Las tareas del agente no son suficientemente estrictas. Ejemplo:

- Ambigüedad de rol: dos agentes se consideran críticos.
- La tarea se ha subespecificado: el usuario quiere un ángulo específico, pero sólo dijo  resumir esto──
- Criterio de éxito implícito: el agente no puede juzgar si ha tenido éxito o no.

Mitigación:
-  redactar contratos de rol definidos ⋅ cada agente se pregunta qué hacer, y qué no hacer.
- Cada tarea se lleva a cabo con pruebas de aceptación.
- Verificación de especificaciones de pre vuelo: un agente único en el despacho

**Coordination Failures（36.94%）。**通信或状态中断──

Muestras:
- Dos agentes, sin sin sincronización, actualizan el estado compartido.
- Mensaje entre agentes 丢失(fallo de cola タイムアウト)
- Drift de Estado: el agente A considera que la tarea ha sido completada; el agente B sigue ejecutando la misma.

Mitigación:
- 带版本的共享状态, utilizar una concurrencia optimista
- Para los mensajes clave hacer un reconocimiento evidente (retry until acked)
- 定期 checkpoints de sincronización de estado;尽早检测漂移──

**Verification Gaps（21.30%）。**No hay inspección independiente de las exportaciones.

Muestras:
- Un agente 声称成功;无人验证──
- Una serie de agentes han hecho una salida.
- En el caso de comportamientos compuestos emergentes, la cobertura de pruebas es insuficiente.

Mitigación:
- 独立验证代理 (en inglés) LECCIÓN 13)──Sólo se puede leer, acceso independiente a la fuente──
- A de la salida debe pasar por el control C,B 才能开始──
- Por análisis post hoc  registar el registro de resultados 

### La familia de pensamiento de grupo (arXiv:2508.05687)

Cuando los agentes se componen o se imitan entre sí, surgen cinco tipos de fracasos relacionados:

**Monoculture collapse。**Como el modelo base o los datos de formación → 相关错误──当三代理 共享一个LLM 时,它们也共享它的幻觉──

**Conformity bias。**Los agentes se dirigen a los compañeros más brillantes o más seguros, incluso si es un error.

**Deficient ToM。**Los agentes no pueden imitar las creencias de los demás; coordinación 崩(LECCIÓN 18)。

**Mixed-motive dynamics。**具有部分一致激励的代理人 漂移到折中中态,结果谁都不满足──

**Cascading reliability failures。**Patrón de error de un componente 触发依赖组件中的错误模式──

### Ejemplo en cascada  la tormenta de retiro

Un clásico patrón de incidentes de 2026:

```
payment service fails 10% of requests
   ↓
order agent retries payment (exponential backoff but naive)
   ↓
each retry is a new order-inventory check
   ↓
inventory service sees 2x normal load
   ↓
inventory service starts timing out
   ↓
every order retries inventory check
   ↓
inventory service sees 10x normal load
   ↓
cluster goes down
```

修复方式 es la práctica clásica:**circuit breakers** la tasa de error 时超过 el umbral 时, con resultados almacenados en caché o por defecto 短路──再加上每一个请求的限额重试预算──

Los interruptores de circuito son una de las pocas mitigadoras de fallas multiagentes que se pueden utilizar y modificar directamente desde sistemas distribuidos.

### Envenenamiento de la memoria

Desde la Lección 13: La alucinación de un agente se convierte en un hecho de memoria compartida; los agentes se basan en hechos contaminados para evaluar. Según MAST, es una brecha de verificación en la capa de memoria compartida.

Los síntomas son la tasa de precisión que disminuye gradualmente. No se estrellará.

Mitigación: solo se puede aplicar el registro de origen, verificador no escriturable, Lección 13 已覆盖──

### STRATUS  agentes especializados para la detección de fallos

STRATUS(NeurIPS 2025) reportó, cuando tú desplegas los siguientes papeles, el éxito de la mitigación 提升 1.5x:

- **Detection agent。**监视 síntomas de los patrones de la enfermedad ([[Alto desacuerdo]], picos de retiro]], deriva de precisión)
- **Diagnosis agent。**给定症状, de la taxonomía MAST 推断可能根原因──
- **Validation agent。**En la aplicación de la mitigación, los síntomas del examen se eliminan.

Es una respuesta a incidentes de estilo SRE de los sistemas de agentes.

### La auditoría en modo de falla

Las mejores prácticas para el año 2026 son realizar una auditoría de modo fallido cada año (o cada vez mayor)

1. **Trace sample。**收集约1000 条 verdadera huella de ejecución。
2. **Categorize。**Para cada rastro de fracasos, se proyecta en las categorías MAST + Groupthink.
3. **Compute failure-by-category rate。**¿Qué categorías te dirigen?
4. **Rank mitigations。**¿Cuál solución puede eliminar la mayoría de los fallos?
5. **Pick 2-3 mitigations。**实现;下季度重新审计──

纪律比具体选择更重要──没有 auditorías, fallos, se meterá en el ruido, siempre tiene que ser procesado sistemáticamente──

### Cuando los sistemas fallan silenciosamente

La categoría de fallo más peligrosa es el fallo de corrección silenciosa. Un sistema que fracasa en voz alta puede ser controlado. Un sistema que produce resultados plausibles pero incorrectos no puede pasar por registros de excepciones.

投资于:
- Revisas humanas basadas en muestras.
- Pruebas de regresión de conjunto de datos dorados。
- Para realizar controles cruzados entre agentes de importantes exportaciones.

### El fracaso vs el fracaso lento

Algunos fracaso es inmediato; algunos son lento. Algunos son lento.

2026 年の工程動作:instrument slow-failure proxies, so you can in drift 变成可见错误之前捕获它──Contrato de tasa, tasa de retiro, distribución de longitud de salida, así como la distancia de edición entre las versiones de los agentes 连续都是有用的代理──


```figure
a5-retry-cascade
```

## Construirlo

`code/main.py` realización:

- `FailureTaxonomy` 将模拟事件 分类为 MAST + grupos de pensamiento
- `CircuitBreaker` 经典模式;当 error rate 超越门时打开。
- `RetryStormSimulator` montrar fallas en cascada; cambiar el interruptor de circuito en / fuera。
- `DetectionAgent` matching de síntomas de estilo STRATUS con guión 

运行:

```
python3 code/main.py
```

预期输出:
- 没有 interrumpidor de circuito 没有 interrumpidor de circuito 没有 interrumpidor de circuito 没有 interrumpidor de circuito 没有 interrumpidor de circuito 没有 interrumpidor de circuito 没有 interrumpidor de circuito 没有 interrumpidor de circuito 没有 interrumpidor de circuito  没有 interrumpidor de circuito  没有 interrumpidor de circuito 没有 interrumpidor de circuito  没有 interrumpido de circuito   没有 interrumpido de circuito                                                                                                                                                                                                                                                                                                                                                                                                         
- Hay interruptor de circuito: en el umbral 处封顶; proporciona respuestas de modo degradado。
- agente de detección 标记该模式并命名 MAST categoría。

## Usalo

`outputs/skill-mast-auditor.md`Para el sistema multiagente 运行 MAST-style failure-mode audit──Traces → categorization → mitigation ranking──

##  Publicarlo

Disciplina en modo de fracaso en el 生产中:

- **每季度 MAST audit。**No es anual. Las categorías se cambian con el crecimiento del sistema.
- **到处部署 circuit breakers。**Para cada llamada saliente de cualquier servicio dependiente, el umbral abierto por defecto es de 5 a 10% de la tasa de error.
- **Golden datasets。**La investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de los resultados de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de los resultados de la investigación de la investigación de la investigación de la investigación de la investigación de los resultados de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de los resultados de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de los resultados de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de los Estados de los Estados de los Estados Unidos de la ciencia de los Estados Unidos de la ciencia de la ciencia de la ciencia de los Estados Unidos de la ciencia de la ciencia de los Estados Unidos de América.
- **STRATUS trio。**Detección + Diagnóstico + Agentes de validación  monitoreo producción―previamente desde el agente de detección  Inicio; cuando los síntomas son ruidosos 时再添加诊断―
- **Failure budget。**Por categoría 统计的失败率 设定显式SLO──超出预算 会触发停止运输对话──

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`❖ Confirmar el interruptor ◦ restringir la tormenta de retiro― ajustar el umbral de falla 并 observar el descenso―
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              **slow-failure proxy**La tasa de acuerdo de los agentes de la combinación de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la producción de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo de la cubo
3. 阅读 Cemri et al. ((arXiv:2503.13657) ―― seleccionar uno de sus 7 sistemas MAS,并映射其前3失败类别──它们与 MAST的预测相比如何?
4. 阅读 Groupthink paper(arXiv:2508.05687)。识别五种模式中哪一种在生产中最难检测── proponer una métrica proxy──
5. ¿Cómo se puede identificar el diagnóstico de los síntomas y la eficacia de los síntomas? ¿Cómo se puede identificar el diagnóstico y la medicación?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MAST | “2026 taxonomy” | Cemri 2025；3 个根类别 + 14 个 failure sub-types。 |
| Specification Problem | “Role ambiguity” | 任务或角色定义不足；agents 不知道该做什么。 |
| Coordination Failure | “State drift” | agents 之间的通信或同步中断。 |
| Verification Gap | “No one checked” | 输出在没有独立验证的情况下被接受。 |
| Groupthink family | “Homogeneity failures” | Monoculture、conformity、deficient ToM、mixed-motive、cascading。 |
| Monoculture collapse | “Same model, same hallucinations” | 来自共享 base model 或 training data 的相关错误。 |
| Retry storm | “Cascading error amplification” | 一次 failure 触发 retries，进而放大下游 load。 |
| Circuit breaker | “Fail fast on error rate” | 当 error rate 超过 threshold 时打开；用 default 短路。 |
| STRATUS | “Incident response trio” | Detection + diagnosis + validation agents。1.5x mitigation success。 |
| Memory poisoning | “Hallucinations propagate” | Shared-memory fact 被污染；下游 agents 基于 poison 推理。 |

## 延伸阅读
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Taxonomía MAST, NeurIPS 2025
- [Groupthink failures in multi-agent LLMs](https://arxiv.org/abs/2508.05687) monocultura, conformidad y taxonomía de cinco familias
- [STRATUS — specialized agents for MAS incident response](https://neurips.cc/) Entrada en el procedimiento NeurIPS 2025 (detección + diagnóstico + validación)
- [Release It! — stability patterns (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) 经典 interruptor de circuito 参考
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Notas de fallas de modo 生产
