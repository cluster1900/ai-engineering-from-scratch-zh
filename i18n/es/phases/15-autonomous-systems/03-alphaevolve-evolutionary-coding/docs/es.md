# AlphaEvolve  演化式编码 agentes

> Se trata de un modelo de codificación fronteriza con el evaluador de ciclo de evolución y inspección de máquinas 配对. 让循环运行足够久. . . ........................................................................................................................................................................................................................................

**Type:** Learn
**Languages:** Python (stdlib, evolutionary-loop toy)
**Prerequisites:** Phase 15 · 01（长周期 framing），Phase 15 · 02（self-taught reasoning）
**Time:** 约 60 分钟

##  problemas

Los LLM pueden escribir código. Los algoritmos de evolución pueden buscarse en el espacio de código. Durante décadas se han intentado por separado, también se han encontrado con un límite superior. Los límites máximos de LLM son ficticios: los modelos escribirán códigos que parecen razonables, pero no lograron su afirmación de que tienen funciones. Los límites máximos de evolución son los costes de búsqueda.

AlphaEvolve(Novikov et al., DeepMind, arXiv:2506.13131, junio 2025) los agrupa. LLM propone un editor específico para la base de datos de programas; evaluador automático para cada variable; alta diferencia de variables para ser el padre de la siguiente generación. LLM es responsable de los costosos pasos: escribir código que parece razonable; evaluador  captura la ficción.

论文报告的结果包括:48次标量乘法的4x4 复数矩阵乘法(Strassen 1969年的上界是49),Google 生产环境中的Borg调度 heurística,32.5% de FlashAttention kernel 加速, así como Gemini 训练吞吐量提升──

Esta estructura es eficaz, porque el evaluador puede inspeccionar máquinas. En el lugar donde el evaluador no tiene este punto, es inefficiente. Esta incompatibilidad es el núcleo de este curso.

## 概念

###  ciclo

1. Desde un programa de semillas correcto pero excelente.`P_0`¿Qué es esto?
2. 维护一个变体程序数据库, cada变体 es evaluado por el evaluador 打分──
3. Desde la base de datos, como uno o más padres (MAP-elite-style o island-based)
4. LLM rápido (en inglés) (en inglés) (en inglés) (en inglés) (en inglés)
5. 编译、运行, y evaluador realizado 上评估该变体──
6. 根据分数和功能 Vector 将其插入数据库──
7. ¿Qué es eso?

Hay dos detalles importantes. Primero, el programa de LLM no es sólo un programa padre, generalmente incluye varias variantes principales de la base de datos, la firma del evaluador, así como la descripción de tareas cortas. La tarea del modelo es proponer una posible evolución de la cifra de puntos. Segundo, la base de datos es estructurada.

### ¿Por qué el evaluador no debe ser consultado?

Los beneficios de AlphaEvolve provienen de los campos de la rapidez, la certeza y la dificultad para hacer trampa:

- **Matrix multiplication algorithm**: Una prueba de unidad, para ejecutar Matrix 乘法并逐 bit 检查相等性。
- **Borg scheduling heuristic**Un simulador de producción, utilizado para reponer los recursos de cálculo de los grupos de carga y la medición de los desperdicios.
- **FlashAttention kernel**:正确性测试加真实硬件 en el reloj de la pared de referencia
- **Gemini training throughput**:以每步GPU-segundos 衡量──

En cada caso, el evaluador ha capturado la categoría de errores que deberían haber dominado el LLM: declaraciones de autenticidad de la ficción, declaraciones de rendimiento de la desaparición en el hardware, así como el fracaso de los casos de frontera.

### El hackeo de recompensas es la misma declaración de otra cara

演化会优化评估者 测量任何东西――Si el evaluador es imperfecto, el ciclo encontrará este imperfecto――En el ámbito no experimentado, el ciclo optimiza las características de la superficie, no el comportamiento esperado―DeepMind en el artículo señala claramente que: el éxito de AlphaEvolve solo se trasladará al evaluador 严谨性与搜索野心相匹配的领域――

2025-2026 年代码搜索循环 具体例:

- 奖励完成时间的优化目标,会奖励提交空解法──
- 奖励测试内正确性的基准 分数,会奖励记忆测试并过拟──
- Una 代码质量代理 会奖励删除注释和重写变量名, incluso si el significado no cambia.

El método de modificación de AlphaEvolve: utilizar el MLL de un evaluador no visto y evaluar a la hora de generar entradas.

### ¿Por qué LLM + búsqueda 优于单独使用任一方

LLM puede producir modificaciones que pueden ser compiladas, en sentido lingüístico parecen razonables. GA de una mutación de 2000 行 Python 文件 casi siempre produce errores de gramática. LLM también centra la búsqueda en el dominio vecino razonable.

En cambio, el evaluador captará la ficción de LLM. LLMs afirmarán con confianza que una función en la situación extrema es O  n log n) , pero en realidad es O  n^2;

### AlphaEvolve en la pila de fronteras en la posición central

| System | Generator | Evaluator | Domain | Example win |
|---|---|---|---|---|
| AlphaEvolve | Gemini | correctness + benchmark | algorithms, kernels, schedulers | 48-mul 4x4 matmul |
| FunSearch (DeepMind, 2023) | PaLM / Codey | correctness | combinatorial math | cap-set lower bounds |
| AI Scientist v2 (Sakana, L5) | GPT/Claude | LLM critique + experiment | ML research | ICLR workshop paper |
| Darwin Godel Machine (L4) | agent scaffolding | SWE-bench / Polyglot | agent code | 20% → 50% SWE-bench |

Estos cuatro sistemas son variaciones de la misma combinación: generador, evaluador, ciclo adicional.


```figure
alphaevolve-loop
```

## Usalo

`code/main.py`En un juego de regresión simbólica   problema de lograr un ciclo mínimo de AlphaEvolve                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

 observar:

- Lo mejor es cómo se mejoran las cifras.
- La red de élites de MAP  cómo hacer que la solución de la diversidad siga existiendo, para que el ciclo no reciba el valor mínimo local.
- 移除Hold-out test (excepto evaluador de formación) 如何让循环出现惊的过拟合──

##  entregarlo

`outputs/skill-evaluator-rigor-audit.md`¿Es en el nuevo ámbito considerar las condiciones previas del ciclo al estilo de AlphaEvolve: ¿Tu evaluador realmente puede capturar el fracaso de tu interés?

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Recordar el mejor número de trayectorias  Dejar de utilizar el evaluador de la bandera `--no-holdout`)并重新运行──量化过拟合──

2. 阅读 AlphaEvolve 论文中关于MAP-elite grid 的第 3节──为一个新问题 (por ejemplo, pases de optimización de compilador) diseñar un descriptor de características-vectores, para que la búsqueda siga siendo diversa──

3. 48 veces multiplicada 4x4  Resultado de 56 años después mejoró el 49-mul de Strassen  上界.

4.  proponer un campo en el que AlphaEvolve se ha vuelto un fracaso―                                                                                                                                                                                                                                                     

5. 针对你熟悉的一个领域,写出你会使用的评价者签名──包括 (a) 正确性条件, (b) 性能指标, (c) 输入生成规则, (d) 至少一个反奖励黑客检查──

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|---|---|---|
| AlphaEvolve | “DeepMind 的演化式编码 agent” | Gemini + 程序数据库 + 可机器检查的 evaluator |
| MAP-elites | “保留多样性的 archive” | 由 feature Vectors 作为 key 的 grid；每个 cell 保存具有该 descriptor 的最佳变体 |
| Island model | “并行演化子种群” | 会周期性迁移的独立种群；防止过早收敛 |
| Machine-checkable evaluator | “确定性 oracle” | LLM 无法伪造的 unit test、simulator 或 benchmark，是这个循环的前置条件 |
| Reward hacking | “优化测量值，而不是目标” | 循环找到一种最大化分数但不完成预期任务的方法 |
| Seed program | “起点” | 循环从中演化的初始正确但次优程序 |
| Held-out evaluator | “LLM 从未见过的评估数据” | 在评估时生成的输入，用于防止记忆 |

## 延伸阅读

- [Novikov et al. (2025). AlphaEvolve: A coding agent for scientific and algorithmic discovery](https://arxiv.org/abs/2506.13131) 完整论文──
- [DeepMind blog on AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) 供应商撰寫的结果说明──
- [AlphaEvolve results repository](https://github.com/google-deepmind/alphaevolve_results) 被发现的算法, incluyendo 48-mul 4x4 matmul
- [Romera-Paredes et al. (2023). Mathematical discoveries from program search with LLMs (FunSearch)](https://www.nature.com/articles/s41586-023-06924-6)¿Qué es eso?
- [Anthropic — Responsible Scaling Policy v3.0 (Feb 2026)](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) La autonomía del evaluador se define como una dirección de investigación clave.
