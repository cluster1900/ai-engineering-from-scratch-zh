# ¿Por qué los transformadores  RNNs son problemas

> RNNs una vez procesan un Token──Transformers una vez procesan todos los Tokens──Esta única estructura de selección, cambió cada una de las curvas de expansión del Deep Learning después de 2017.

**类型：**El aprendizaje
**语言：**Python
**先修要求：**Fase 3 (Centro de Aprendizaje Profundo), Fase 5 · 09 (Secuencia a Secuencia), Fase 5 · 10 (Mecanismo de Atención)
**时间：**- 45 minutos

##  problemas

Antes de 2017, cada uno de los modelos de secuencia más avanzados de la Tierra eran redes neuronales recurrentes. Los LSTM y GRU, en comparación con ImageNet, dominaron durante medio decenio.

Tienen tres puntos débiles.`t+1`需要来自Token `t`El estado oculto de una serie de 1,024 tokens significa que en cada ciclo puede ejecutarse 1.024 pasos en cadena en una GPU de 1,000,000 veces de operación de flowspoints. En hardware diseñado para paralelos, el tiempo de entrenamiento de un reloj de pared crece con la longitud de la serie.

Los gradientes desaparecientes significan 50 Tokens  El información anterior ya ha sido comprimida a través de 50 niveles de no-linealidad. Las unidades recurrentes de puerta (LSTM, GRU) aliviaron esta compresión, pero nunca la eliminaron.

固定宽度的隐藏状态意味着编码器会在解码器 看到任何内容之前,把整个源序列 挤压到单个向量──源是5个代币 还是500个都无关紧要;瓶始终是相同的形状──

El artículo de 2017 Attención es todo lo que necesitas  propuso una idea impulsiva: abandonar completamente la recurrencia― hacer que cada posición y la marcha de la tierra asistan a cada otra posición― con una sola gran matriz multiplicación entrenamiento, en lugar de 1,024 veces ordenar la cálculo―.

Hasta 2026 años, este resultado ya ha dominado todas las modalidades.

## 概念

![RNN sequential compute vs Transformer parallel attention](../assets/rnn-vs-transformer.svg)

**Recurrence 是瓶颈。**RNN 计算 `h_t = f(h_{t-1}, x_t)`Cada paso depende del paso anterior.`h_4`之前计算 `h_5`❖ En tener más de 10,000 GPUs modernos y en el núcleo, esto desperdicia el 99% de su superficie en una larga serie.

**Attention 是广播。**La auto-atención se hace por cada uno .`(i, j)`Con el tiempo calculado`output_i = sum_j(a_ij * v_j)`◊ Toda la matriz de atención N×N 会在一次批批中满满──没有任何步骤依赖另一个步骤──GPU 喜欢这一点──

**加速不是常数。**Es un buen trabajo .`O(N)`profundidad en serie 和 `O(1)`En la práctica, en N=512 y en el mismo hardware, los transformadores de cada época tienen una velocidad de entrenamiento de 510×; con el aumento de la longitud de la serie, la diferencia continuará aumentando hasta alcanzar la atención.`O(N²)`Pared de memoria ((Flash Attention                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

**transformers 的代价。**Memoria de atención 按 `O(N²)`扩展──2K contexto 没问题──128K contexto 则需要滑窗、RoPE extrapolación、Flash Attention tileing,或线性注意变量──Recurrencia 在时间和内存上都是`O(N)`Los transformadores usan el tiempo para cambiar de memoria, y luego, a través de la corrección, ganan el tiempo.

**Inductive bias 的转变。**RNNs 假设地方 和近期──Transformers 不做假设 每对位置都是注意的候选人──这就是为什么变压器需要更多数据才能训练得好,但一旦拥有足够的数据就能扩展得更远──Chinchilla(2022) formalizó este punto:


```figure
rnn-vs-parallel
```

## Construirlo

Aquí no hay red neuronal, usamos el método numérico para simular el núcleo, para que sientas la diferencia en tu propio cuaderno.

### Paso 1: Métese la profundidad en serie

¿ Qué ?`code/main.py`△ Nosotros construimos dos funciones― una把序列编码为加法链(串行,类似RNN)― otro把它编码为并行规约(广播,类似注意)― la misma matemática, diferentes dependencias gráfico―

```python
def rnn_style(xs):
    h = 0.0
    for x in xs:
        h = 0.9 * h + x   # can't parallelize: h depends on previous h
    return h

def attention_style(xs):
    return sum(xs) / len(xs)  # every x is independent
```

La versión RNN es O(N), y utiliza un solo tubo de CPU. Incluso en Python puro, la reducción de estilo de atención en la longitud ≥ 1,000  también se vencerá, ya que Python `sum()`Es un proceso de realización y no se produce en cada paso.

### Paso 2: 计算理论操作

两个算法都做N 次加法──区别在于 *dependency depth*:在下一步能够开始之前,有多少操作必须顺序发生──RNN depth = N──Attention depth = log(N), si se utiliza reducción de árbol; o en un escáner paralelo, en el que se determina la profundidad del tiempo de la GPU, y no el número de veces de operación──

### Paso 3: Expandir la experiencia en la larga serie

Impresamos una tabla de tiempo, para que O(N) diferencia se vea. En el libro de Mac  de 2026   , la secuencia de menos de 1,000 elementos es demasiado rápida, difícil de medir.

## Usalo

2026 年什么时候仍然选择 RNN:

| 情况 | 选择 |
|-----------|------|
| Streaming inference，一次一个 Token，常量内存 | RNN or state-space model (Mamba, RWKV) |
| 超长序列（>1M tokens），Attention memory 爆炸 | Linear attention, Mamba 2, Hyena |
| 没有 matmul accelerator 的 edge device | Depthwise-separable RNN 在 FLOPs/watt 上仍然胜出 |
| 其他任何情况（训练、batched inference、最高 128K 的 context） | Transformer |

Los modelos de espacio estatal (SSM) como Mamba, en esencia, tienen RNN estructurados y parametrizados, lo que los hace tener dos ventajas:`O(N)`La memoria de escaneo, así como el entrenamiento de seguimiento de la escaneo selectivo ⋅ se logran en una mejor escalación de contexto largo ⋅ se recuperan el 90% de la calidad del transformador ⋅ hasta 2026 años, la mayoría de los laboratorios fronterizos están entrenando modelos híbridos de transformadores SSM + ⋅ ejemplos Jamba, Samba) ⋅recurrencia no ha muerto, es un componente ⋅

##  entregarlo

¿ Qué ?`outputs/skill-architecture-picker.md` Esta habilidad se basará en la duración, rendimiento y presupuesto de formación, para una nueva secuencia de problemas de selección de arquitectura.

##  ejercicios

1. **简单。**Desde`code/main.py`En el centro`rnn_style`,把标量隐藏状态 换成长度为64的隐藏状态 矢量──重新测量──系列上空会随着隐藏状态维度 增长多少?
2. **中等。**Utiliza Python para realizar el prefijo paralelo-suma (Hillis-Steele scan) ▽验证 se produce en longitud 1024 时与序列扫描相等数值输出──计算深度──
3. **困难。**Colocar la reducción de estilo de atención 移植 a PyTorch de la GPU superior― con la longitud de la secuencia de 64 扫 a 65.536, para los dos 计时―绘图并解释曲线形――

## 关键术语: "El hombre es un hombre"

| 术语 | 人们常说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Recurrence | “RNNs 是顺序的” | step `t` 依赖 step `t-1` 的计算方式，迫使执行沿时间轴串行进行。 |
| Serial depth | “图有多深” | 依赖操作的最长链；即使在无限硬件上也会限制 wall-clock。 |
| Attention | “让 Tokens 彼此查看” | Weighted sum `sum_j a_ij v_j`，其中 `a_ij` 来自位置 i 和 j 之间的相似度分数。 |
| Context window | “模型能看到多少” | 一个 Attention layer 可作为输入的位置数量；quadratic memory cost 在这里扩展。 |
| Inductive bias | “架构内置的假设” | 关于数据形态的先验；CNNs 假设 translation invariance，RNNs 假设 recency。 |
| State-space model | “背后有代数的 RNN” | 为通过结构化 state-space matrices 实现并行训练而参数化的 recurrence。 |
| Quadratic bottleneck | “为什么 context 这么昂贵” | Attention memory = 序列长度上的 `O(N²)`；Flash Attention 隐藏的是常数，而不是扩展规律。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) Este artículo pone fin a la recurrencia en la PNL principal.
- [Bahdanau, Cho, Bengio (2014). Neural MT by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) La atención de nacimiento, cuando fue conectado en RNN arriba.
- [Hochreiter, Schmidhuber (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) 原始 LSTM 论文, como registro。
- [Gu, Dao (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752) Controles modernos recurrentes 
