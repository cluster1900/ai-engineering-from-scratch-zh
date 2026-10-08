# Paralelamente de doble tubo

> DeepSeek-V3 utiliza 2.048 张 H800 GPUs  entrenamiento,MoE expertos distribuidos en varios nodos.  Experto de comunicación universal cada 1 hora de GPUs  Calculación de comunicación universal cada 1 hora de GPUs  GPUs tienen la mitad del tiempo en el espacio.  DualPipe  DeepSeek,2024 12 de enero) es una tubería bidireccional, que se superponerá hacia adelante y hacia atrás  Calculación con todo el  comunicación que los desencadena  Bubbles  Reducción, aumento de la tracción, y conserva dos copias de parámetros de modelo   Dual Fuente  En el experto paralelo  El experto ya ha distribuido a los expertos en cada rango de la clase en condiciones de costo muy bajo                                                                                                                                                               

**Type:** Learn
**Languages:** Python (stdlib, schedule simulator)
**Prerequisites:** Phase 10 · 05（distributed training、FSDP、DeepSpeed），Phase 10 · 14（open-model architectures 和 MoE）
**Time:** ~60 minutes

## El objetivo del aprendizaje
- Cuál es el problema de la construcción de las dos piezas de DualPipe, y por qué cada una de ellas tiene su propia ventana de superposición?
- 解释大规模下管道泡 问题,以及 泡免 在实践中和在营销语境中的区别──
- Handwerk seguir 8 rango de PP y 16 micro-partidos de programación de DualPipe, y confirmar el flujo hacia adelante y el flujo inverso 会填充彼此的空槽位──
- Explicar DualPipeV(Sea AI Lab,2025): en Experto Paraleloismo inactivas, en una pequeña burbuja a cambio, eliminar 2x 参数复制──

##  problemas
En 2k H800 GPUs, entrenamiento 671B Modelo MoE se encontrará con tres botellas superpuestas entre sí:

1. **内存压力。**Cada GPU tiene un modelo de secuencia de 8K, 61 capas, 128 cabezas, la memoria de activación es muy grande.
2. **Pipeline bubbles。**传统管道平行性(GPipe、1F1B) permitirá que las GPUs en espera de su etapa de entrada o Gradient 时处于空──8 个阶段 时, incluso utilizando la programación 1F1B, aproximadamente el 12% del tiempo de la GPU 也可能是泡──
3. **跨节点 all-to-all。**Utilizando el paralelismo experto, el MoE hará que los expertos se distribuyan en varios nodos. Cada paso adelante, se inicia una vez todo a todos, para enviar tokens a los expertos respectivos, y luego también se inicia otra vez todo a todos.

Estos problemas tienen soluciones individuales: memoria con control de gradientes, burbujas de tubería con Zero Bubble, Sea AI Lab, 2023, todo-a-todo con núcleos de comunicación expertos paralelas. DualPipe hace que colaboren. Este calendario se encuentra en un solo pedazo hacia adelante y hacia atrás en la composición y la comunicación, al mismo tiempo que se infunde en micro-parches desde el tubo, y el calendario que se genera se ocultará entre todos en la ventana de cálculo.

报告结果: en el entrenamiento de DeepSeek-V3 de 14.8T-token 运行中, las burbujas de tubería casi desaparecieron, la tasa de utilización de GPU supera el 95%。

## 概念
### Paralelo de la tubería 复习

Desmantelar un modelo de N-layer en P 个设备上――设备 `i` tienen capas `i * N/P .. (i+1) * N/P - 1` Un micro-batch desde el dispositivo 0 hasta P-1  ejecutar hacia adelante, luego desde P-1 hasta 0  ejecutar hacia atrás  Cada dispositivo sólo puede comenzar su fase de avance después de que el dispositivo anterior envíe su salida; también sólo puede comenzar su fase de avance después de que el dispositivo inferior envíe su salida Gradiente  después, para comenzar hacia atrás 

GPipe(Huang et al., 2019) una vez se modifica un micro-batch, esto va a perder la mayor parte del tiempo de la GPU.

DualPipe es el siguiente paso. Sobre esta base, se añaden dos ideas:

### Pensa 1: la descomposición de los trozos

Cada pieza delantera se divide en cuatro partes:

- **Attention。**Proyecciones de Q/K/V  Atención  Proyección de salida
- **All-to-all dispatch。**Enviar los tokens a los expertos de cada uno de ellos.
- **MLP。**Experto en el Ministerio de Economía 计算。
- **All-to-all combine。**Se trata de un proyecto de investigación que se desarrolla en el ámbito de la salud y de la salud.

Una pieza retrógrada se sumará a estas partes Gradient  versión。DualPipe realizará su ajuste, haciendo que todo se despachara con la siguiente pieza Atención  calcular y se haga, y hace que todo se combine con la siguiente pieza de MLP  calcular y se haga。

### 思路 2: programación bidireccional

La mayoría de los horarios de la tubería desde la etapa 0 se inyectan en micro-parches,并流向阶段 P-1──DualPipe desde los dos extremos simultáneamente se inyectan en micro-parches──La etapa 0 verá micro-parches avanzadas que se inician desde allí; la etapa P-1 también verá micro-parches avanzados que se inician desde allí── dos corrientes en el medio de la reunión──

Para lograrlo, equipo `i` debe tener al mismo tiempo una capa de tubería temprana `i`Y la capa de tubería tardía `P - 1 - i` Ésta es la parte dual de DualPipe: cada dispositivo conserva dos capas de modelo que necesita de servicio una para cada dirección En la escala de DeepSeek-V3, es 2x el costo de reproducción de parámetros es asequible, ya que el Parallelismo Experto  ha diseminado a los expertos de MoE muy raramente, copiar dos capas no expertas no cuesta mucho

关键在于, en una dirección, la corriente hacia delante y en otra dirección, la corriente hacia atrás 会恰好在单向时间表 产生泡的位置重叠──泡消失──

### Un calendario rastreado a mano

考虑 P = 4 filas、8 micro-parches,分为 4 个前进 / 4 个反转──时间从左到右移动;行是设备级──

```
           Time →
rank 0:  F1 F2 F3 F4  F5R F6R F7R F8R  B1 B2 B3 B4  ...
rank 1:     F1 F2 F3  F4/F5R F6R F7R   B1 B2 ...
rank 2:        F1 F2  F3/F5R F4/F6R    B1 ...
rank 3:           F1  F2/F5R F3/F6R    ...
```

读取 F4/F5R 这种记法:rank 1 在同一个时间槽中,同时运行微批4的前进(在管道中从左到右) 和微批5的前进(从右到左) 这是操作层面的含义双向

En la clasificación 2 , los flujos de la intersección 更早重叠; en la clasificación 0 和 P-1 , ellos más tarde重叠. En la clasificación 0 和 P-1 , ellos más tarde重叠. En la clasificación estabilizada de la clasificación, cada clasificación está en marcha hacia adelante, y en la clasificación X 方向向前,并与 Y 方向向后重叠.

### Contabilidad de burbujas

标准 1F1B burbuja de tubería( cada rango 浪费的时间):

```
bubble_1F1B = (P - 1) * forward_chunk_time
```

La burbuja cero  mejorará la reducción, pero no puede bajar a zero. DualPipe en la fase de estabilidad, si la cantidad de micro-batches puede ser duplicada por la profundidad del oleoducto 整除, habrá una burbuja cero.

营销语境中: 泡免──技术语境中:泡 不会随着微批数量增长──Sea AI Lab 的后续分析(DualPipeV / Cut-in-half) muestra que sólo en el Experto Parallelismo no es que hay una burbuja completa; en el EP 驱动的全到所有 下, siempre habrá algunas agendas 妥协──

### DualPipeV  el refinamiento

Sea AI Lab(2025) observado, cuando la EP comm se superpone no es un punto de partida,2x 参数复制是浪费的。 su programa de DualPipeV va a doblar la inyección bidireccional V-forma en un programa de V-forma, en un solo parámetro 副本上运行──Bubble比 DualPipe 略大,但内存节省非常可观──DeepSeek en su implementación de DualPipe de código abierto adopta DualPipeV como modo EP-off──

取舍如下:

| Feature | DualPipe | DualPipeV | 1F1B | Zero Bubble |
|---------|---------|-----------|------|------------|
| 每个设备的参数副本 | 2 | 1 | 1 | 1 |
| Bubble vs micro-batches | constant | small growth | grows | grows |
| Compute-comm overlap | full | partial | minimal | partial |
| Use when | EP-heavy MoE | dense or EP-light | baseline | any pipeline |

### ¿Qué significa el 14 de 8T?

El entrenamiento previo de DeepSeek-V3 en 2.048 张 H800 GPUs consumió 14.8T tokens, aproximadamente 2.8M horas de GPUs. Si utilizan 1F1B simples, perderán 12-15% de las burbujas de tubería, es decir, 340-420K horas de GPU, lo suficiente como para entrenar un modelo completo de 70B. DualPipe recuperó la mayor parte de ellos.

对于较小规模运行(低于1k GPUs),DualPipe有些过度:管道泡相对总成本较小,而且密集型式训练 很少触及所有到所有 瓶──对于数千 GPU 规模的边界MoE训练,它实际上是必需的──

### Está en la posición central de la pila

- Con**FSDP**(Fase 10 · 05)互补──FSDP va a dividir los parámetros del modelo a las filas 上;DualPipe 调度 ranks 上的计算──二者可以结合──
- Con**ZeRO-3**Descarga de gradientes 兼容──两份副本复制的会计管理 需要与 ZeRO 配合──
- 需要针对具体集群拓学 调优的 **custom all-to-all kernels**Los núcleos de código abierto de DeepSeek son un referente para su realización.


```figure
expert-capacity
```

## Usalo
`code/main.py`Es un simulador de horarios de tuberías.`(P, n_micro_batches, schedule)`,并印 1F1B、Zero Bubble、DualPipe 和 DualPipeV de uso de fase estable de cada uno de ellos. Es una herramienta de enseñanza: el número y la determinación de la propuesta en el artículo coinciden, pero no es una declaración sobre la producción de la aceleración de la prueba.

El valor del simulador es: con diferentes números de P y micro-partidos, ejecutarlo, observar cómo crece la fracción de burbuja de 1F1B, mientras que DualPipe no se hará.

En el caso de la formación de la formación, el grupo de formación debe tener en cuenta:

- 选择一个能被你的微批数 整除的管道- paralelo profundidad。
- ¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢
- Cuando se realiza la primera vez, el esperado estará en el horario.
- Monitorear la tasa de utilización de la GPU de cada rango, no sólo la tasa de utilización total.

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-dualpipe-planner.md` Determinar una especificación del grupo de entrenamiento (GPU), que propondrá una estrategia de paralelismo de tuberías, un algoritmo de programación que se utilizará, así como una fracción de burbuja de previsión bajo la escala de la meta.

##  ejercicios
1. En el`(P=8, micro_batches=16, schedule=dualpipe)`Y `(P=8, micro_batches=16, schedule=1f1b)`上运行 `code/main.py`△ calcular la utilización de GPU 差异,并将其表示为每百万训练代币回收的 GPU-hours──

2. Manual de dibujo`(P=4, micro_batches=8, schedule=dualpipe)`La tabla de horarios. Utiliza la identificación de micro-parcela y la dirección para marcar cada espacio de tiempo.

3. 阅读DeepSeek-V3 technical report(arXiv:2412.19437) 图 5──找出 DualPipe forward piece 中全到全发送的重叠窗口──解释计算时间表 如何隐藏它──

4. 計算 DualPipe a un modelo 70B denso de P=8 fases de tubería, así como a un modelo 671B MoE de P=16 fases de tubería, de 2x 参数开销――explica por qué la proporción de开销在 MoE 情况下较小(la mayoría de los参数 son expertos, y se dividen en grandes grupos EP 上) ⋅

5. Se puede utilizar el método de comparación de las características de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de cámara de la cámara de la cámara de la cámara de cámara de cámara de cámara de la cámara de cámara de cámara de la cámara de la cámara de cámara de cámara de cámara de cámara de cámara de cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la cámara de la

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Pipeline bubble | “每个 rank 的空闲时间” | pipeline stage 等待其输入或 Gradient 时浪费的 GPU cycles |
| 1F1B | “默认 pipeline schedule” | one forward / one backward 交错调度；DualPipe 击败的 baseline |
| Zero Bubble | “Sea AI Lab 2023” | 将 backward 拆成 B（input Gradient）和 W（weight Gradient）；几乎完全收紧 pipeline |
| DualPipe | “DeepSeek-V3 schedule” | bidirectional pipeline + compute-comm overlap；bubbles 不随 micro-batch count 增长 |
| DualPipeV | “Cut-in-half” | V-shape 改进版，以略大的 bubbles 为代价去掉 2x 参数复制 |
| Chunk | “pipeline work 的单位” | 一个 micro-batch 通过一个 pipeline stage 的 forward 或 backward pass |
| All-to-all dispatch | “把 tokens 发送给 experts” | 将 tokens 路由到其分配的 MoE experts 的跨节点通信 |
| All-to-all combine | “把 expert outputs 带回来” | MLP 之后收集 expert outputs 的跨节点通信 |
| Expert Parallelism (EP) | “Experts across GPUs” | 将 MoE experts 分片到 ranks 上，使不同 GPUs 持有不同 experts |
| Pipeline Parallelism (PP) | “Layers across GPUs” | 将 model layers 分片到 ranks 上；DualPipe 调度的维度 |
| Bubble fraction | “浪费的 GPU 时间” | (bubble_time / total_time)；DualPipe 推向零的比例 |

## 延伸阅读
- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437), Section 3.3.2 and Figure 5](https://arxiv.org/abs/2412.19437) Principales datos de DualPipe  Referencia
- [DeepSeek — DualPipe GitHub repository](https://github.com/deepseek-ai/DualPipe) implementación de referencia de código abierto, incluido DualPipeV
- [Qi et al. — Zero Bubble Pipeline Parallelism (arXiv:2401.10241, Sea AI Lab 2023)](https://arxiv.org/abs/2401.10241) Burbuja cero
- [Sea AI Lab — DualPipe could be better without the Dual](https://sail.sea.com/blog/articles/63)  influir en el modo de apagado de DeepSeek EP de DualPipeV  análisis
- [Narayanan et al. — PipeDream / 1F1B (arXiv:1806.03377, 2018-2021)](https://arxiv.org/abs/1806.03377) Programa de 1F1B de DualPipe
- [Huang et al. — GPipe (arXiv:1811.06965, 2018)](https://arxiv.org/abs/1811.06965) Paralelo de la tubería original 论文和泡 问题
