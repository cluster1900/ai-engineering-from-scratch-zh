# ¡Asíncrono con Hogwild!

> La descifrado especulativo (Fase 10 · 15) se desarrollará en una sola secuencia de tokens de distribución. Inferencia(Rodionov et al., arXiv:2504.06261) hace otra cosa:并行运行同一个LLM的 N 个实例,并让它们共享一个关键值缓存──每个工人都能立即看到其他工人生成的代币──现代推理模型QwQ、DeepSeek-R1无需任何细节调整,就能通过这个共享缓存自我协调── este método todavía está en fase de experimento, pero abre una nueva dimensión del paralelismo de inferencias, y también se abre con el especificación de decodificación 正交──本课使用 stdlib Python 实现一个两个工人Hogwild! El simulador,并解释为什么共存存合作 会从现有模型的推理能力 中涌现出来──

**类型：**Construir
**语言：**Python (stdlib)
**先修：**Fase 10 · 12(optimización de la inferencia),Fase 10 · 15(descodificación especulativa)
**时间：**- 60 minutos

## El objetivo del aprendizaje

- 描述三种常见的平行LLM topologies ((voting、subtask、Hogwild!),并说明每一个针对问题──
- Cuenta con la configuración central de Hogwild: muchos trabajadores, un caché compartido de KV, mediante autoincentivación, lograr una coordinación emergente.
- Según el número de trabajadores.`N`、paralelamente a nivel de tarea `p`Y gastos generales de coordinación `c`計算 Hogwild! de velocidad de tiempo de la pared.
- En el problema del juguete, implementar un simulador Hogwild! de dos trabajadores,并观察 emergente división de tareas.

##  problemas

现代 LLMs 通过生成长时间的推理链来解决困难问题5000 tokens的步骤逻辑 很常见, en problemas matemáticos profundos aparecen miles de tokens 也不少见. En el modelo 70B, arriba con 35 tokens/sec decode, 50k tokens 需要24分钟──

La descifrado especulativo (Fase 10 · 15) a través de una sola secuencia interna, puede traer 3-5x de velocidad.

¿Podemos transcender secuencias y ejecutar varias copias del mismo modelo en el mismo problema, hacerlas colaborar, hacerlas trabajar?

已有工作包括: grupos de votación(运行 N 个模型,选择多数答) 、 Tree-of-thought (arbol de pensamiento) 、分支出推理路径并重新组合) 以及多代理框架 (((para cada agente 分配子任务,并使用协调员) ⋅ Estos pueden proporcionar ayuda en determinados dominios de tareas.

Hogwild! Inferencia  adoptaron diferentes métodos。N 个工共享一个KV cache── cada trabajador ciudad会立即看到其他工人生成的代币,就像这些代币 已经在自己的背景中一样── trabajadores en caso de no tener ningún entrenamiento o ajuste fino, se van a descubrir por sí mismos cómo分工──Modernos modelos de razonamiento moderno (((QwQ、DeepSeek-R1、Claude-family reasoning mode) 能够取取共享缓存,并说出类似我看到工人2 已经处理了基案,所以我来处理诱导步这样的话──

Hasta el 4 de abril de 2026, la velocidad depende de la carga de trabajo, y todavía está en fase de experimentación. Pero esta idea vale la pena entenderse, ya que abre una nueva dimensión del paralelismo de inferencia.

## 概念

###  configuración

Ini始化 N 个工人流程,全部运行同一个LLM── no usar caches KV por trabajador, sino mantener un caché compartido──当员工`i`Se muestra`t_j`时, este token 会被写入共享缓存的下一个位置──当员工 `k`执行下一步时,它读取缓存的当前状态 (), que contiene hasta el momento todo el contenido de todos los N 个工 生成) ⋅

En el tiempo de paso, los trabajadores se compiten para escribir tokens. No hay índice de posición por trabajador. El caché es una secuencia de un solo crecimiento.

### ¿Por qué la coordinación se desarrolla

Los trabajadores 共享一个缓存. Usualmente se parece a:Usted es una de las N instancias que trabajan juntas en este problema. Cada instancia lee la memoria compartida y puede ver qué otras instancias han escrito. Evite el trabajo redundante. Este prompt y el caché compartido está bastante.

Hogwild! paper ((Rodionov et al., 2025) informó lo siguiente observado:

- Los trabajadores elaborarán planes, y a través del caché los transmitirán a otros trabajadores.
- Los trabajadores observarán errores de razonamiento de otros trabajadores, y señalarán estas cuestiones.
- Los trabajadores se reunirán en el plan 失败时适应情况,并提出替代方案──
- Cuando se solicita un control de despido, los trabajadores inspeccionarán que se transfiere a otros trabajos.

Estos no necesitan ajuste fino. El comportamiento emergente del modelo ya posee capacidades de razonamiento.

### 命名

Este artículo se ha tomado el nombre de Hogwild! SGD(Recht et al., 2011), un optimizador de actualización asíncrona.

### RoPE  haz que esto sea posible

Embebedos de posición rotaria(RoPE, Su et al. 2021) a través de la rotación de Q y K vectores 编码 posición información──因为 posiciones son rotaciones, en lugar de compensaciones de fijación, por lo que la posición del token puede moverse, sin necesidad de volver a calcular KV entrada caché──当 worker`i`写入 compartido caché de posición `p`时,读取该职位的其他员工可以直接使用缓存输入不需要重转

En el modelo de posición aprendida o absoluta, Hogwild! ¡Me gustaría escribir en cada vez simultánea 时都需要缓存无效化──RoPE 让缓存 保持稳定──

### El tiempo de la pared

设 `T_serial`Es un trabajador que solo resuelve el problema.`p`Es una fracción paralelable de nivel de tarea.`c`Es el costo de coordinación por paso, pero después de que se haya hecho una expansión, se decidió escribir lo que se debía hacer.

Tiempo de trabajo solo:`T_serial`¿Qué es eso?
Si la coordinación es gratis, Hogwild!`T_serial * ((1 - p) + p / N)`Es el clásico de Amdahl.
加入 coordinación de gastos generales 后:`T_serial * ((1 - p) + p / N) + c * steps_per_worker`¿Qué es eso?

Para que el trabajador tenga un producto,`c`必須相對每步解码時間 足夠小──對生成5k+代币的推理模型, los trabajadores pueden soportar cientos de tokens de coordinación por encima, y siguen liderando──對短聊天任务,協調會占主导,Hogwild!會比串差更──

###  ejemplos concretos

Problema de razonamiento: 10k tokens de cadena de pensamiento.`p = 0.7`Los resultados de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de los resultados de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la cuciaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaronaron que se han han han han hecho que se han hecho que se han hecho hecho hecho que se han hecho hecho hecho que se hayan hecho`c = 200`Los símbolos`N = 4`Trabajadores:

- Tiempo de serie: 10000 pasos de decodificación
- Hogwild! tiempo: 10000 * (0.3 + 0.7 / 4) + 200 * 4 = 10000 * 0.475 + 800 = 5550 pasos de decodificación。
- Aceleración: 10000 / 5550 = 1,8x.

Esto es sólo un beneficio medio. Pero en problemas de razonamiento más largos, la coordinación se adelgaza, la velocidad se mueve hacia 2,5-3x.

### ¿Cuándo usar Hogwild!

- 长 razonamiento problemas ((1000 tokens), entre las cuales la tarea puede atravesar sub-objetivos independientes并行化。
- 已被训练为步骤思考的推理模型──non-reasonable models──不能很好地自我协调──
- Despliegues de nodo único, y hay suficiente VRAM 容纳 compartido caché加 N 个 trabajadores procesos──cache es compartido, pero cada trabajador tiene su propia memoria de activación──

### ¿Cuándo no usar

- 短互动聊天──Coordinación de gastos generales 会占主导──
- 无法并行化任务(单一线性证明、单一编译) ――N=1 是上限──
- Modelos no razonables― no surgirán de coordinación―.
- Despliegues de múltiples nodos;. caché compartido 需要非常快的跨工作者同步化──Intra-node 可以;cross-node 会成为延迟灾难──

###  Estado de la experiencia

截至2026年4月,Hogwild! es un método de investigación,并有开源 PyTorch implementación── no ha surgido la adopción de producción── tres obstáculos:

1. 跨同步流程 管理共享KV cache 是非平凡的工程问题──
2. La coordinación emergen­cial depende de la tarea; los puntos de referencia están todavía en construcción.
3. En comparación con los beneficios que ya ha traído la descodificación especulativa, las velocidades son más moderadas; las dos pueden combinarse, pero la complejidad de la construcción posterior a la combinación es de una sola capa.

Vale la pena saber. Vale la pena experimentar.


```figure
continuous-batching
```

## Construirlo

`code/main.py`¡Realizar un simulador de juguete Hogwild!

-  dos procesos de trabajo, cada uno de ellos de determinación LLM, generarán con una probabilidad conocida varios tipos de tokens 
- Una caché compartida, sólo una lista de tokens, dos trabajadores han estado escribiendo y escribiendo.
- Una lógica de coordinación simple: cuando un trabajador ve a otro trabajador ya ha generado suficientes tokens de trabajo en una categoría, elige una categoría diferente.

El simulador se encuentra en el presupuesto de la etapa fija.

- 总数── 总数── 总数── 总数── 总数── 总数── 总数──
- 总 tiempo de pared(pasos de los trabajadores 数量)。
- En comparación con el trabajo solo, la velocidad efectiva.
- ¿Qué trabajador ha escrito el rastro de qué símbolo?

### Paso 1: caché compartido

Una dos trabajadoras de la ciudad añadir la lista.`threading.Lock`); Aquí estamos usando el contador 模拟。

### Paso 2: Bucle de trabajadores

Cada trabajador en cada paso:

- 读取当前 compartido caché。
- De acuerdo con el contenido ya decidido a escribir en qué tipo de tokens.
- Escriba un token.

### 步骤 3: heurística de coordinación

Si la categoría X ya tiene K 个 token en la caché, y el trabajador originalmente quería escribir la categoría X, entonces el trabajador cambiará a la categoría Y. Este es un juguete en sustitución, para expresar el comportamiento del modelo de razonamiento:

### Paso 4: Mejora de la velocidad

Se utilizan los mismos tokens de trabajo de la estadística, utilizando el mismo presupuesto de los pasos generales.

### Paso 5: La coordinación

Reducir la sensibilidad de la heurística de coordinación― otra vez ejecutarse― observar Si no hay una buena coordinación, N=2 tendrá espacio para producir los mismos tokens, la velocidad caerá a 1 以下― esto coincide con el observado del papel: esta técnica sólo es válida en los trabajadores  que tienen capacidad de razonamiento de auto-coordinación 时才―

## Usalo

截至 2026 年 4 月, la integración de Hogwild! en producción sigue siendo de grado de investigación. La implementación de referencia de Yandex/HSE/IST se basa en PyTorch, el objetivo es DeepSeek-R1 y QwQ modelos de configuración de procesos múltiples de un solo nodo.

务实的采用路径:

1. Profil Su trabajo de tarea de razonamiento-tarea de trabajo──tokens de medición En exploratoriomúltiples estrategias─análisis de casos─busca) y proporción de lineal
2. Si exploración 占主导,运行 Hogwild! experimento de dos trabajadores.
3. Si la mejora es inferior a 1,3x, indica que estás en un régimen dominado por la coordinación.
4. Si la mejora   supera 1,5x, avanzar hasta N=4 y volver a medir ∞ Retorno decreciente normalmente aparecerá en N=4-8 ∞ ∞ ∞ ∞ ∞ ∞

组合: Cada Hogwild! trabajador pueden utilizar independientemente el descodage de especificaciones.

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-parallel-inference-router.md` Determinar un perfil de carga de trabajo de razonamiento  perfil de parallelidad de los tokens  de tareas  de la familia de modelos  objetivo de implementación, se realizará en el proceso de votación  árbol de pensamiento  multi-agente  Hogwild! y estrategias de descifrado especulativo 

##  ejercicios

1. Utilización de configuración de operación `code/main.py` Confirmar en el mismo tiempo de pared 内,N=2 Hogwild! configuración que N=1 línea de base  generar más tokens de trabajo 

2. Reducir la intensidad de la heurística de coordinación `coordination_weight=0.1`◊ Re-cargar. ■ mostrar acelerar  colaps. ■ explicar las causas: cuando los trabajadores  incapacidad de coordinación, se repiten el trabajo.

3. 计算一个50k-token razonamiento tarea 在 `p=0.8, c=500`¡Y N=4 trabajadores 时的预期 Hogwild! velocidad―reconfronta una tarea de chat de 1k-token en `p=0.3, c=200`¿Por qué uno es ganancia y otro es pérdida?

4. 阅读Hogwild! paper's Section 4 (evaluación preliminar)  encontrar autores  dos modos de fracaso del informe  describir un mejor punto de coordinación posible y cómo aliviar cada problema 

5. En el juego, Hogwild! con el decodificación especulativa 组合: cada trabajador 内部 utiliza 2-token especificación-decodificación― informe multiplicativo velocidad― Cuando dos trabajadores están pensando en ampliar con un prefijo de caché compartido 时, ¿qué problema de contabilidad surgirá?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Hogwild! | “Parallel workers, shared cache” | 同一个 LLM 的 N 个 instances 并发运行，并共享一个 KV cache；通过 self-prompting 实现 emergent coordination |
| Shared KV cache | “The coordination medium” | 一个不断增长的 KV buffer，所有 workers 都会读取和写入；让 tokens 能在 workers 之间立即可见 |
| Emergent coordination | “No training needed” | 具备 reasoning 能力的 LLMs 可以读取 shared cache，并在没有任何 fine-tuning 或显式 protocol 的情况下分工 |
| Coordination overhead (c) | “Tokens spent orienting” | 每个 worker 读取扩展后的 cache 并决定下一步做什么的成本；相对于总 decode time 必须保持较小 |
| Parallelizable fraction (p) | “What can run in parallel” | Task-level parallelism：总工作中并非内在 sequential 的比例 |
| RoPE enables Hogwild! | “Rotary positions are shift-invariant” | 因为 positions 是 rotations，写入 shared cache 不需要重新计算之前的 tokens |
| Voting ensemble | “Run N, pick the majority” | 最简单的 parallel inference topology；适用于 classification，对 long-form reasoning 帮助较小 |
| Tree of thought | “Branch and prune” | 探索多个 branches 并进行 pruning 的 reasoning strategy；使用显式 coordination logic |
| Multi-agent framework | “Assign sub-tasks” | 每个 agent 获得一个 role；由 coordinator 编排；protocol overhead 很重 |

## 延伸阅读

- [Rodionov et al. — Hogwild! Inference: Parallel LLM Generation via Concurrent Attention (arXiv:2504.06261)](https://arxiv.org/abs/2504.06261) Hogwild! papel, en la evaluación preliminar de QwQ y DeepSeek-R1
- [Recht, Re, Wright, Niu — Hogwild!: A Lock-Free Approach to Parallelizing Stochastic Gradient Descent (arXiv:1106.5730, NeurIPS 2011)](https://arxiv.org/abs/1106.5730) 原始 Hogwild!,名称来源
- [Su et al. — RoFormer: Enhanced Transformer with Rotary Position Embedding (arXiv:2104.09864)](https://arxiv.org/abs/2104.09864) RoPE, hace que la inferencia compartida de caché sea de naturaleza práctica
- [Yao et al. — Tree of Thoughts: Deliberate Problem Solving with Large Language Models (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601)¿Qué es eso? ¿Qué es eso?
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192)¿Qué es lo que se puede hacer con el descifrado especulativo?
- [Hogwild! reference PyTorch implementation](https://github.com/eqimp/hogwild_llm) Experimentos en papel de la única fuente de verdad
