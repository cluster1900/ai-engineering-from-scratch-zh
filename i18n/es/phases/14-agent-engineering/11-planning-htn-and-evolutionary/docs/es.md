# Utilizando HTN y búsqueda evolutiva  realizar planificación

> Planificación simbólica  plan de tratamiento 可证明正确的场景──Evolutionary code search 处理健身功能 可由机器检查的场景──ChatHTN (2025) 和 AlphaEvolve (2025) 展示了二者与LLM 结合后分别能解锁什么能力──

**类型:**Construcción
**语言:**Python (stdlib)
**先修要求:**Fase 14 · 02 (ReWOO y planificación y ejecución)
**时间:**~ 75 minutos

## El objetivo del aprendizaje

- 解释 Hierarquical Task Networks:tasks、methods、operators、preconditions、effects。
- 描述 ChatHTN's hybrid loop  búsqueda simbólica 加 LLM fallback decomposition。
- Explicar el ciclo evolutivo de AlphaEvolve, y por qué solo se aplica al evaluador programático.
- Usar un programa de juego para realizar una búsqueda evolutiva de un juego.

##  problemas

ReWOO (Lección 02) 、Plan-and-Execute 和 ReAct 覆盖了大多数代理规划──它们不太擅长覆盖了两个场景:

1. **可证明正确的 plans。**Programación, ruta de vuelo, flujos de trabajo de cumplimiento  plan  debe estar en la construcción es el sonido                                                                                                                                                                                                                                                
2. **带有机器可检查 fitness function 的优化。**La multiplicación de matriz, la heurística de programación, los pasos del compilador  目标不是一个正确的计划, sino最好的计划──

La planificación HTN y AlphaEvolve  solucionan dos problemas diferentes.

## 概念

### Las redes jerárquicas de tareas

HTN incluye:

- **Tasks** compuesto (decompuesto) y primitivo (可直接执行)
- **Methods** La tarea compuesta se dividirá en subtareas de manera que haya condiciones previas.
- **Operators** 带有前条件和效果的原始行动──
- **State** 一组 facts──

Planificación: dar una tarea de objetivo y estado inicial, encontrar una descomposición, hacer que se conviertan en condiciones previas 按顺序满足的原始运算者──

HTN ya surgió en la LLM y sigue siendo un método de referencia para demostrar que los planes son reales.

### El objetivo de la investigación es mejorar la calidad de la información y la calidad de la información.

ChatHTN (arXiv:2505.11814) se hará simbólico HTN con LLM consultas 交错执行:

1. 尝试使用现有方法 分解当前复合任务──
2. Si no hay un método                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `s`En medio, ¿cómo se descompone?`task`¿Qué es eso ?
3. La respuesta de LLM se transformará en subtareas candidatas.
4. 根据运营商方案做验证; rechazar descomposiciones sin efecto.
5. 递归──

论文的核心主张:生成的每一个计划都可证明声音,因为LLM sugerencias sólo como candidato descomponencias 进入,永远不会直接编辑计划──Simbólico capa 负责正确性;LLM 扩展方法图书馆──

Aprendizaje en línea de métodos  OpenReview `gwYEDY9j2x`,2025 seguimiento) se unió a un alumno, a través de la regresión 泛化 LLM 生成的分解  最多可减少 75%  LLM 查询频率──

### AlphaEvolve (Novikov y otros, 2025)

AlphaEvolve (arXiv:2506.13131, DeepMind, junio 2025) es otra clase de cosas: por el conjunto Gemini 2.0 Flash/Pro 编排的进化代码搜索──

- ¿Qué es eso ?

1. Desde el programa de semillas + evaluador programático 开始(返回 fitness score)。
2. El conjunto de LLM  propuso mutaciones¬
3. ¿Qué es lo que se hace en el sistema de evaluación?
4. Mantener lo mejor; continuar mutando.

 已发表的成果:

- 56 años después de la primera modificación de la matriz compleja 4x4 de Strassen (multiplicación escalar 48 veces)
-  A través de la programación heurística Borg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
- En la carga de trabajo fronteriza se logró un 32% de velocidad de FlashAttention.

硬性约束:función de aptitud 必须可由机器检查── hacer búsqueda evolutiva de respuestas en prosa 不会收──

### ¿Cuándo usar qué?

| 问题类别 | 使用 | 原因 |
|---------------|-----|-----|
| 带硬约束的 Scheduling | HTN + ChatHTN | 可证明的 soundness |
| Compiler optimization | AlphaEvolve | 机器可检查的 fitness |
| Multi-step task execution | ReAct / ReWOO | LLM in the loop，没有 formal guarantees |
| 带 tests 的 Code improvement | AlphaEvolve | Tests 就是 evaluator |
| Policy-bound automation | HTN | Preconditions 编码 policy |

### Este modelo es fácil de salir mal

- **没有 operators 的 HTN。**没有 preconditions/effect schemes,soundness 主张就会崩塌──ChatHTN 的LLM sugiere descomposición要求 schema 能拒绝无效运动──
- **没有真实 evaluator 的 AlphaEvolve。**porgunta LLM 代码 否更好不是 función de aptitud──Evaluador 必须确定性且快──
- **过度工程化。**La mayoría de las tareas de los agentes no requieren estos dos.


```figure
htn-tree-expand
```

## Construirlo

`code/main.py`realizó dos ejemplos de juguetes:

- Un planificador de HTN de problemas, que contiene operadores, métodos, condiciones previas, efectos, así como cuando no hay un método para adaptar la tarea compuesta 时触发 `LLMFallback`LLM es un descomposición de escritura, por lo que el planificador 可离线运行──
- Una búsqueda evolutiva de programas aritméticos dirigidos a un programa de cálculo: incrementar expresiones, hacer que su salida en el conjunto de pruebas 上最小化 `|f(x) - target|`◊Evaluador es determinista ◊

运行:

```
python3 code/main.py
```

Trace 会展示 HTN planner 分解一个复合任务 (中途带一次LLM fallback), así como un ciclo evolutivo 收到一个目标表达──

## Usalo

- **HTN planners**¿ Qué es esto ?`pyhop`¿Qué es esto?`SHOP3`, o para la aplicación de políticas específicas de dominio construir su propio 
- **ChatHTN** código de investigación; este modelo (simbólico + LLM fallback) puede hacerse por completo transferido a cualquier planificador de HTN.
- **AlphaEvolve** Profundos pensamientos papel; este modelo(ensemble + evaluador)可复现──OpenEvolve 和类似开源叉 正在出现──
- **Agent frameworks** Actualmente todavía no hay HTN de primera clase o AlphaEvolve.

##  entregarlo

`outputs/skill-hybrid-planner.md`El papel del LLM se define claramente en el plan de planificación híbrida.

##  ejercicios

1. Usando retroceso  extender el planificador de HTN: en la postcondition de un operador en el tiempo de ejecución  fracaso, volver a rodar y intentar el siguiente método―
2. 给 ChatHTN 添加 LLM-método caché:当 LLM 在状态模式 `P`La tarea de descomposición`T`时,存储结果──下一次调用时先重新检查方法库──
3. Evolver una función de clasificación de 20 casos de prueba; report收 需世代──
4. 阅读AlphaEvolve's evaluador de diseño notas.
5. 组合使用: utilizar HTN para dividir la tarea compuesta en subtareas, y luego en cada subtareas de operador primitivo para usar la búsqueda evolutiva. ¿En qué aparece en el color, en qué pertenece a la sobreingeniería?

## 关键术语: "El hombre es un hombre"

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| HTN | “Hierarchical planner” | 带有 operators、preconditions、effects 的 task decomposition |
| Method | “Decomposition rule” | 将 compound task 拆分为 subtasks 的方式 |
| Operator | “Primitive action” | 带有 precondition 和 effect 的具体步骤 |
| ChatHTN | “LLM + HTN” | 当没有 method 匹配时，symbolic planner 询问 LLM |
| AlphaEvolve | “Evolutionary code search” | Ensemble LLMs mutate code；deterministic evaluator 负责选择 |
| Fitness function | “Evaluator” | 针对 outputs 的 deterministic、机器可检查 score |
| Online method learning | “Cached LLM decomposition” | 存储并泛化 LLM plans，以降低 query cost |

## 延伸阅读

- [Gopalakrishnan et al., ChatHTN (arXiv:2505.11814)](https://arxiv.org/abs/2505.11814) simbólico + LLM 混合 planificador
- [Novikov et al., AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带 LLM mutaciones de búsqueda de código evolutivo
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)¿Cuándo elegir un planeador, ¿Cuándo elegir un bucle simple?
