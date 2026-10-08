# 面向 LLM de Optimización de la multitud de personas (PSO, ACO)

> La optimización de la vida está en el campo de la LLM.**LMPSO**(arXiv:2504.09247) utiliza PSO, la velocidad de cada partícula es un prompt, LLM 生成下一个候选人; se produce en un proceso estructurado de producción ([[expresión matemática]], proceso) **Model Swarms**(arXiv:2410.11163) Colocar a cada experto LLM en un modelo de peso de un varioplo de partículas de PSO, y reportar en 9 conjuntos de datos comparados con 12 líneas de base.**13.3% average gain**, y por cada ronda sólo se necesitan 200 instancias.**SwarmPrompt**(ICAART 2025) se utilizará la optimización rápida en PSO + Grey Wolf 混合**AMRO-S**(arXiv:2603.12933) son especialistas en feromonas iniciados por ACO, para el enrutamiento de LLM multiagente  **4.7x speedup**、 explicable de la evidencia de enrutamiento, así como las inferencias y la actualización sincrónica de la calidad de la solución de aprendizaje ── 本课会在快速参数空间实现PSO,在代理路由上实现ACO,衡量这些经典算法为什么适合LLM时代,以及什么时候不适应──

**类型：**Aprender + Construir
**语言：**Python (stdlib)
**先修：**Fase 16 · 09 (Redes de movimiento paralelo), Fase 16 · 14 (Consenso y BFT)
**时间：**~ 75 minutos

##  problemas

Tienes un prompt, en la evaluación de tareas, un score de 62%── Tú quieres mejorarlo──Practica simple es una modificación manual sin grados, pero este método de expansión es muy pobre──Reforzo Aprendizaje Necesita señales de recompensa y suficientes implementaciones para entrenar──A través de los prompts hacer la retropropagación 并不现实 prompt es un separado de la cadena, no es un pequeño parámetro──

                                                                                                                                                                                                                                                              

El mismo modelo también se aplica a los sistemas multi-agentes en el medio de los agentes *routing*。ACO 风格的热门轨迹 会记录哪个代理在哪类任务上表现最好,让路由器利用这个轨迹,并让热门衰减,以便路线可以重新发现──

## 概念

### Reforma de la OPS (Kennedy & Eberhart 1995)

Optimización de la cantidad de partículas: continuos búsquedas de partículas en el espacio 种群── cada partícula tiene una posición `x_i`y velocidad `v_i`❖ Por la iteración:

```
v_i <- w * v_i + c1 * r1 * (p_best_i - x_i) + c2 * r2 * (g_best - x_i)
x_i <- x_i + v_i
evaluate fitness(x_i)
update p_best_i if improved
update g_best if global best
```

Entre ellos `p_best`Es la partícula su mejor resultado,`g_best`Es el mejor resultado del enjambre,`w, c1, c2`Es inercia + cognitivo + pesos sociales,`r1, r2`Es un factor.

### LLM 输出上 PSO  LMPSO

ArXiv:2504.09247 将 PSO 适配到LLM 生成的结构化输出(mathematical expression 程序) ⋅ cada partícula es una salida candidata──Velocity is a *prompt*, describe how to put the current output towards personal/global best 修改──LLM ⋅Velocity prompt 生成 new output──Velocity inertia is similar ⋅Make small incremental changes ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅  ⋅                                                                                                                                                                    

Esto es muy bueno en los siguientes casos:
- 输出是结构化的 (可解析,可评估)
- La aptitud es automática (测试运行,算术评估)
- La población 较小(~10-30 partículas), por lo que el LLM general llama 保持可控。

Cuando la aptitud requiere revisión artificial, no funciona bien. El costo de cada iteración se vuelve demasiado alto.

### Un grupo de ejemplos

ArXiv:2410.11163 Se pondrá en funcionamiento el PSO desde la capa de salida hasta la capa de modelo. Cada una de las partículas es un experto LLM.

关键洞察是 LLM expertos modelos 已经在共享参数多元中彼此接近(adapter weights、LoRA deltas) ⋅ en este espacio de bajo dimensiones hacer PSO 成本低且有效──

### Reforma de la ACO (Dorigo 1992)

Optimización de la colonia de hormigas: se encuentra en el gráfico; cada trayecto tiene un rastro de feromonas.

### AMRO-S  Usado para el enrutamiento de agente de ACO

ArXiv:2603.12933 Utiliza ACO hacer enrutamiento multi-agente。 Cada tipo de tarea es una destination; cada agente es una 条可能路──产出好结果的路径 会强化热子──关键贡献:

- **可解释的 routing evidence。**La fuerza feromónica es una señal que el hombre puede leer.
- **Quality-gated asynchronous update。**Las feromonas sólo se actualizan en los controles de calidad, y la inferencia y el aprendizaje se resuelven.
- En multi-agente de enrutamiento de referencia **4.7x speedup**¿Qué es eso?

Puerta de calidad  importante: sin ella, los agentes rápidos pero errados... acumularán feromonas, el sistema se bloqueará en rotas malas.

### ¿Cuándo para LLM Usar PSO / ACO

**使用 PSO 当：**
- El espacio de búsqueda es continuado, o puede ser mapeado hasta continuado (enlace) (impregnados rápidos, pesos de LoRA, números de generar valores).
- Fitness 便宜且自动──
- La población puede ser muy pequeña.

**使用 ACO 当：**
- ¿Tienes enrutamiento o selección de camino?
- Las decisiones se intensificarán con el tiempo (¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡
- Necesitas pruebas explicativas para tomar decisiones de enrutamiento.

**不要使用二者当：**
- Fitness  necesita revisión artificial                                                                                                                                                                                                                                                            
- El espacio de búsqueda es separado y compuesto, mientras que el PSO no puede cubrirse con algoritmos genéticos modificados.
- Las decisiones en tiempo real  necesitan una latencia severa PSO/ACO 相比 single-pass heurísticas 收较慢)

### ¿Por qué bio-inspirado  todavía triunfar

基于 Gradient的方法需要可微信号──LLM de salida y decisiones de ruta 并不自然可微──Pseudo-gradient 方法(reinforcement-learned routers、DPO-style prompt tuners)可行, pero necesita costoso entrenamiento──

PSO y ACO sólo necesitan una función *evaluador*― Si puedes optimizar en este espacio para la salida o la decisión de enrutamiento de un candidato―, esto te permite utilizar un mayor número de opciones.

### 实用限制

- **Population budget。**N partículas × T iteraciones × costo por eval.$0.02 / call 的情况，一个 20-particle PSO 跑 50 iterations 大约花费 ~$20― de acuerdo con el plan
- **Exploration vs exploitation。**Rate de descomposición de feromonas  entre inercia y PSO                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- **Catastrophic drift。**Si el panorama de fitness 发生变化 (una nueva distribución de datos), dos tipos de algoritmos pueden converger primero y luego divergir.


```figure
swarm-stigmergy
```

## Construcción

`code/main.py` realización:

- `LMPSO` En los parámetros de número de valores de inmediato (temperatura, peso de la superficie)                                                                                                                                                                                                                                                   
- `AMRO_S` ACO 风格 routing──3 个 agents、4 种类型的任务、pheromone matrix、100 个 routed tasks──打印一段时间内(task_type → agents choices) de la distribución, mostrar la formación de la ruta──
- En comparación: en el mismo flujo de tareas, comparación de routing aleatorio con routing ACO, medir la calidad y la latencia.

运行:

```
python3 code/main.py
```

预期输出:
- LMPSO:g_best fitness en 30 iteraciones dentro de la asimismo valor de aumento a casi máximo.
- AMRO-S:tabla de feromonas  estabilizadas a cada tipo de tarea                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

## Uso

`outputs/skill-swarm-optimizer.md` ayudar en los algoritmos genéticos de PSO ̊ACO ̊ y los optimizadores basados en gradientes ¦ entre seleccion, para los problemas de optimización de LLM/agentes―

## 交付

- **从小开始。**10-20 partículas,20-50 iteraciones― sólo cuando la curva de convergencia 显示明确收益时才扩展―
- **记录每轮 pheromones 或 g_best。**没有 trail   很难 debug──
- **Quality-gate updates。** Especialmente en el enrutamiento ACO: rápidos pero errores  absolutamente imposible acumulación de feromonas
- **在 distribution shift 时 reset decay。**Cuando la distribución de la evaluación cambia, los feromonas de envejecimiento han pasado el tiempo; se restablece o se duplica temporalmente la tasa de descomposición.
- **限制每轮成本。**输出成本-per-iteration metric― un gasto por ronda de $500― sólo trae un 0,5% 提升 PSO no puede enviar―

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` observar la convergencia de LMPSO― modificar el tamaño de la población 为 5、10、20、50―.
2. 实现 una catastrófica deriva 实验:在回复30 后改变健身功能──PSO 适应得多快?Reset `p_best`¿Hay ayuda?
3. 给AMRO-S 添加质量门: 只有 eval score > 0.7 of runs 才存储热.
4. 阅读 LMPSO(arXiv:2504.09247) ――把论文中的 速度作为一个提示 映射回你的数值速度──模拟中丢失了什么,又保留了什么?
5. 阅读 AMRO-S(arXiv:2603.12933)。实现带异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的异步的

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| PSO | "Particle Swarm Optimization" | Kennedy-Eberhart 1995。基于种群的无 Gradient Optimizer。 |
| ACO | "Ant Colony Optimization" | Dorigo 1992。通过 pheromone trails 进行 path/route optimization。 |
| LMPSO | "PSO with LLM generation" | arXiv:2504.09247。Velocity 是 prompt；LLM 生成 candidates。 |
| Model Swarms | "PSO on expert weights" | arXiv:2410.11163。在 model parameter subspace 上进行无 Gradient update。 |
| AMRO-S | "ACO for agent routing" | arXiv:2603.12933。覆盖 task-type × agent 的 pheromone matrix。 |
| p_best / g_best | "Personal / global best" | 每个 particle 和整个 swarm 目前找到的最佳 solutions。 |
| Pheromone | "Routing memory" | Edge 上的强度；随时间衰减；根据 quality deposit。 |
| Quality-gated update | "Only learn from good runs" | 以 quality check 为条件进行 pheromone deposit。 |
| Catastrophic drift | "Distribution shift" | Fitness landscape 改变；旧的 p_best 和 pheromones 变得过时。 |

## 延伸阅读

- [Kennedy & Eberhart — Particle Swarm Optimization](https://ieeexplore.ieee.org/document/488968) 1995 años PSO 论文
- [Dorigo — Ant Colony Optimization](https://www.aco-metaheuristic.org/about.html) 1992 años ACO 基础
- [LMPSO — Language Model Particle Swarm Optimization](https://arxiv.org/abs/2504.09247) 面向结构化 de los resultados del LLM de las OPS
- [Model Swarms — gradient-free LLM expert optimization](https://arxiv.org/abs/2410.11163) En el subespacio de peso del modelo de la PSO superior
- [AMRO-S — ant-colony multi-agent routing](https://arxiv.org/abs/2603.12933) 带 puerta de calidad de enrutamiento impulsado por feromonas
