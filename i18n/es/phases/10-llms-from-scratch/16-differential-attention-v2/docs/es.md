# Atención diferencial (V2)

> Softmax Attention 会在每一个不匹配的代币上分散少量概率. En 100k 个代币上, estos ruidos se acumulan y se inundan en señal. Diferencial Transformer(Ye et al., ICLR 2025) a través de la Attention 计算为两个 softmax差来来解决这个问题,从而减轻共享噪声下限.

**类型:**Construcción
**语言:**Python (stdlib)
**前置要求:**Fase 7 · 02 (autoatención), Fase 7 · 15 (variantes de atención), Fase 10 · 14 (caminada por la arquitectura)
**时间:**- 60 minutos

## El objetivo del aprendizaje

- 准确说明为什么 softmax Atención 存在噪声下限,以及为什么随着背景长度 增长而成
- 推导 diferenciales de atención 公式,并解释为什么相减会抵消共享噪音成分,同时保留信号──
- 讲清 V1 a V2 diferencias: ¿cuáles partes son más rápidas, más simples, más estables, y por qué cada cambio en el nivel de producción pre-entrenamiento son necesarios.
- Utiliza Python puro desde el zero para lograr la atención diferencial y en una consulta sintética de señal-más-ruido 上实证验证噪音抵消特性──

##  problemas

标准 softmax Atención tiene una naturaleza matemática, en la escala cambia en grandes tiempos se convertirá en problemas de ingeniería.`q`,Attención 权重是 `softmax(qK^T / sqrt(d))` Softmax 永远无法产生精确的零值 每个不匹配的代币都会得到一些正质量──这个残余质量就是噪音,并且会随着背景长度扩大── 在128k 个代币下, incluso cada uno de los代币只能获得0.001% de probabilidad,127,999 代币 结合也将贡献约12%的总量──模型必须学会绕开一个随着背景 增长噪音下限──

En la práctica, esto se ha mostrado para la atención cabeza 干扰:long-context RAG 幻觉引用、100k-Token 检索任务中的失败中失败,以及 aguja en haystack benchmark 在超过32k 后出现的细微精度下降──Differential Transformer 论文(arXiv:2410.05258, ICLR 2025) midió esta diferencia:DIFF Transformers Comparado con las líneas de base de la misma talla  lograron una menor perplejidad、 una mayor precisión en el contexto largo, así como menos alucinaciones──

DIFF V1 tiene tres problemas, lo que le impide entrar en la línea de pre-entrenamiento de vanguardia. Su caché de valor en cada paso de decodificación debe cargarse dos veces, necesita kernels CUDA personalizados, daña la compatibilidad de FlashAttention, y su RMSNorm por cabeza en entrenamientos de larga duración a escala superior a 70B causará inestabilidad.

## 核心概念 核心概念 核心概念 核心概念

### Softmax de ruido bajo límite

 para la consulta `q`Y las llaves `K = [k_1, ..., k_N]`,Attención 权重是:

```
w_i = exp(q . k_i / sqrt(d)) / sum_j exp(q . k_j / sqrt(d))
```

No hay nada .`w_i`¡Me voy a ver!`k_i`Con`q`完全无关, puntaje `q . k_i`También no es que se rodea alrededor de 0 , la diferencia es `||q||^2 / d` Tras la normalización de la softmax, cada token sigue aumentando su valor y contribución `O(1/N)`△无关 Token 的总贡献是 `O((N-1)/N) = O(1)`Esto no es una pequeña cantidad.

模型想要的更像是硬顶-k:在匹配代币上给高权重,在其他位置接近零──软max 过于平滑,无法直接做到这一点──

### Diferenciación de pensamiento

Para cada cabeza de Q y K proyecciones 拆成两份:Q = (Q_1, Q_2),K = (K_1, K_2)。计算两个注意地图:

```
A_1 = softmax(Q_1 K_1^T / sqrt(d))
A_2 = softmax(Q_2 K_2^T / sqrt(d))
```

输出:

```
DiffAttn = (A_1 - lambda * A_2) V
```

相减会抵消两个图片 共享的任何噪声分布―― Si dos mapas en 127k 无关标志上有近似均重权 (en el caso de los tokens sin conexión) (en el caso de los tokens sin conexión, ciertamente, en el caso de los tokens sin conexión), estos componentes se oponen unos a otros――信号 少数真正相关的 Token 只有在两个图片中出现相同幅度时才会抵消,而模型训练后不会保持这种状态――

`lambda`Es cada cabeza una cantidad de aprendizaje, para la parámetros`lambda = exp(lambda_q1 dot lambda_k1) - exp(lambda_q2 dot lambda_k2) + lambda_init`Puede ser por el lado negativo.`lambda_init`默认是类似 0.8 的小正数──

### ¿Por qué es así?

Se puede imaginar como dos micrófonos con ruido en el mismo sonido. Ambos se graban al hablante y el ruido de fondo relacionado. De un señal a otro, el ruido compartido disminuye. El sonido se conserva porque hay suficientes diferencias en la posición o amplitud de los dos señales, no se suprimirán por completo.`lambda`Aprender es exactamente este equilibrio.

### V1 vs V2: Diferencia

V1 continuó con los mismos parámetros que el Transformer basal. Para que cada cabeza tenga dos consultas, reduciría la dimensión de la cabeza a la mitad. Esto sacrificó la capacidad de expresión de la cabeza, lo que es más doloroso, también hizo que cada cabeza tenga un caché de valor a la mitad.

V2 va a hacer preguntas de cabeza número multiplicado,并保持 KV heads 不变(de la proyección de arriba 借用参数) ――Dimensión de cabeza 保持与基线相同──相减后, extra dimensiones serán proyectadas de vuelta, en paralelo con la proyección O_W del Transformer de la línea de base── tres cosas ocurren simultáneamente:

1. La velocidad de decodificación es comparable a la línea de base.
2. FlashAttention 可原样运行(No se necesita un núcleo personalizado)。
3. Decodificar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar la intensidad aritmética de la computadora ⋅ incrementar el volumen de la computadora ⋅ incrementar el volumen de la carga ⋅ incrementar el volumen de la carga ⋅ incrementar el volumen de la carga ⋅ incrementar el volumen de la carga ⋅ incrementar el volumen de la carga ⋅ incrementar el volumen de la carga

V2 también se ha movido V1 para estabilizar la fase de reducción de la operación de la norma RMS por cabeza. En la escala de pre-entrenamiento de grado 70B, la norma RMS hará que la formación de la última fase sea inestable.

### ¿Cuándo usarlo

| Workload | Benefit |
|----------|---------|
| Long-context RAG (64k+) | 更干净的 Attention maps，更少幻觉引用 |
| Needle-in-haystack benchmarks | 32k 之后 accuracy 显著提升 |
| Multi-document QA | 更少跨文档干扰 |
| Code completion at 8k | 收益有限，不值得改变 architecture |
| Short chat (< 4k) | 基本与 baseline 不可区分 |

收益会随着背景长度 增长而增加──在 4k Token 下,噪声下限足够小,标准注意力 已可用──在 128k 下, se comenzará a producir efectos perjudiciales evidentes──

### ¿Cómo se combina con otros botones 2026

| Feature | Compatible with DIFF V2? |
|---------|------------------------|
| GQA | 是（V2 增加 Q heads，而不是 KV heads） |
| MLA (DeepSeek) | 原则上是，但尚无公开论文将二者结合 |
| MoE | 是（Attention 独立于 MLP block） |
| RoPE | 是（不变） |
| YaRN / long-context scaling | 是（正是 DIFF 最有帮助的场景） |
| FlashAttention | 是，V2 支持（V1 不支持） |
| Speculative decoding | 是（Attention 改动对 spec-decode loop 不可见） |


```figure
differential-attention
```

## Construirlo

`code/main.py`Usando Python, se logró la atención diferencial. Una consulta de juguete con una estructura de señal más ruido conocida, permite medir directamente la tasa de respuestas al ruido.

### Paso 1: atención estándar de softmax

Opciones de matriz de la base: lista de listas, matmul de escritura, con el máximo valor reducido para garantizar la estabilidad de la cantidad de valores, la suavidad máxima.

```python
def softmax(row):
    m = max(row)
    exps = [math.exp(x - m) for x in row]
    s = sum(exps)
    return [e / s for e in exps]
```

### Paso 2: Desmantelar en dos partes

V1 风格:将头寸 减半──V2 风格: mantener la cabeza dimensión,并将头寸 数量加倍──toy implementación 为了教学清晰使用 V1数学完全相同,只有会计不同──

### Paso 3: 两个 ramas de la masa más suave + 相减

```python
A1 = [softmax([dot(q1, k) / scale for k in K1]) for q1 in Q1]
A2 = [softmax([dot(q2, k) / scale for k in K2]) for q2 in Q2]
diff_weights = [[a1 - lam * a2 for a1, a2 in zip(r1, r2)] for r1, r2 in zip(A1, A2)]
out = [[sum(w * v[j] for w, v in zip(row, V)) for j in range(d_v)] for row in diff_weights]
```

Nota: la salida de peso puede ser negativa. Esto no es un problema.

### Paso 4: 噪声抵消测量

Construir una longitud de 1024 de secuencias de sintesis.  Colocar la señal en una posición conocida, en la que se encuentra el resto del lugar lleno de ruido.  calcular (a)  la máxima tensión estándar  la atención sobre el peso de la señal, así como (b) la atención diferencial  el peso  medir la relación señal-ruido de ambos.  De acuerdo con las dos ramas, la atención de la señal se ha entrenado hasta el mayor grado de producir diferencias, la atención de la diff generalmente puede generar establemente una relación señal-ruido de 3x-10x.

### Paso 5: V1 vs V2  参数核算

给定一个配置 ((hidden=4096, heads=32, d_head=128),打印:

- Transformador de base: Q、K、V de tamaño en tamaño`hidden * hidden`, MLP para 4 * oculto
- DIFF V1: Q、K de tamaño en tamaño`hidden * hidden`, V , por lo grande`hidden * hidden`(不变), cabeza dim 在内部减半──增加 per cabeza `lambda`参数(O(cabeza * d_cabeza))
- DIFF V2: Q`2 * hidden * hidden`, K , por lo que`hidden * hidden`, V , por lo grande`hidden * hidden`◊ Extra dimensiones en O_W                                                                                                                                                                                                                                                           `lambda`参数。

Juguete 会测量 V2 de extraparámetros costos(aproximadamente cada bloque de atención  extra `hidden * hidden`),并打印出来──

## Usalo

截至 2026 年 4 月, DIFF V2 尚未 se lance en cada servidor de inferencia de producción, pero vLLM 和 SGLang está en proceso de integración.

- Microsoft 内部 largo contexto 生产模型。
- Representación de estudios en el curso de muchos aspectos de la formación de modelos abiertos en un contexto de 256k+.
- La atención de DIFF se debe a la atención de las ventanas deslizantes en las capas de intercambio de las arquitecturas híbridas de arriba en la combinación.

Usted elegirá su escenario en 2026:

- Desde el principio, la atención diferencial se incorpora; después, el costo de la reentrenamiento es muy alto.
- La acondicionamiento fino un modelo de largo contexto, y perdido en el medio 失败主导你的 eval──在 Q proyecciones 上做 LoRA puede ser similar a DIFF 结构──

Usted no elegirá su escenario:

- Usted está sirviendo un modelo denso pre-entrenado de largo contexto  rendimiento estable ⋅ para los pesos existentes, por lo general, el costo de reentrenamiento es difícil de recuperar.
- Su contexto siempre es inferior a 16k.

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-diff-attention-integrator.md` Determinar un modelo de arquitectura, longitud del contexto objetivo, perfil de alucinación y presupuesto de formación, generará un plan de integración, para utilizar la atención diferencial  añadir una nueva carrera pre-entrenamiento o LoRA de ajuste fino 

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Experimentación en consulta sintética 上,atención diferencial 报告的信号-噪声比 高于标准软max Attention。 modificar la amplitud del ruido,并展示标准 Attention 变得不可用交叉点──

2. Para un modelo de grado 7B ((oculto=4096, cabezas=32, d_cabeza=128, 32 capas), calcular desde la línea de base hasta DIFF V1 y desde la línea de base hasta DIFF V2 cambios en los parámetros.

3. 阅读DIFF V1 论文(arXiv:2410.05258) Sección 3, así como la sección 2 del blog de DIFF V2 Hugging Face.

4. 实现一个ablation:分别用 `lambda = 0`(puro primer softmax) y `lambda = 1`(完整相减) calcular la atención diferencial.`lambda`¿Qué es eso?

5. Se puede utilizar un sistema de control de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de velocidad de veloc

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Differential attention | “两个 softmax 相减” | 将 Q、K 拆成两半，计算两个 softmax maps，从第一个中减去第二个（由 lambda 缩放），然后乘以 V |
| Noise floor | “softmax 的非零尾部” | Softmax 放在每个无关 Token 上的 O(1/N) 权重，在 long contexts 中会累加到 O(1) |
| lambda | “相减的缩放系数” | 每个 head 的可学习标量，参数化为 `exp(lq1.lk1) - exp(lq2.lk2) + lambda_init`；可以为负 |
| DIFF V1 | “ICLR 2025 版本” | 原始 Differential Transformer；将 head dim 减半以保持参数量，需要 custom kernel，decode 更慢 |
| DIFF V2 | “2026 年 1 月修复版” | 在保持 KV heads 的同时将 Q heads 加倍；decode speed 与 baseline 持平，并兼容 FlashAttention |
| Per-head RMSNorm | “V1 稳定器” | V1 在差分之后应用的额外 norm；V2 移除了它，以避免后期训练不稳定 |
| Signal-to-noise ratio | “有多少 Attention 被浪费了” | 真实 signal 位置上的权重与无关位置平均权重之间的比率 |
| Lost in the middle | “Long-context failure mode” | 一个实证现象：长 context 中间位置文档的检索 accuracy 会下降——DIFF attention 可以缓解这一点 |
| Arithmetic intensity | “每加载一个 byte 对应多少 FLOPs” | V2 在 decode 时通过每次 KV 加载对应双倍 queries 来提高的比率；对 memory-bound decode 很重要 |

## 延伸阅读

- [Ye et al. — Differential Transformer (arXiv:2410.05258, ICLR 2025)](https://arxiv.org/abs/2410.05258) Origins, contenidos en el ruido抵消理论和长文段ablations
- [Microsoft unilm — Differential Transformer V2 (Hugging Face blog, January 2026)](https://huggingface.co/blog/microsoft/diff-attn-v2) 面向生产的重写版本,匹配基线解码,并兼容FlashAttention
- [Understanding Differential Transformer Unchains Pretrained Self-Attentions (arXiv:2505.16333)](https://arxiv.org/abs/2505.16333)  Sobre por qué la reducción de energía recuperación pre-entrenada Atención  estructural análisis teórico
- [Shared DIFF Transformer (arXiv:2501.17900)](https://arxiv.org/html/2501.17900) 参数共享变体
- [Vaswani et al. — Attention Is All You Need (arXiv:1706.03762)](https://arxiv.org/abs/1706.03762) Transformador de línea de base de la DIFF
- [Liu et al. — Lost in the Middle (arXiv:2307.03172)](https://arxiv.org/abs/2307.03172) Atención del FIDD 面向的 contextos largos
