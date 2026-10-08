# Atención de la escasez nativa (NSA)

> En 64k Token, Atención se absorbe en el 70-80% de la decodificación 延迟. Cada modelo abierto 实验室 tiene su programa de modificación. En DeepSeek's NSA (ACL 2025) el mejor documento es el programa de verdadera estabilidad: tres paralelos Atención, es decir, un token de grueso grado de concentración, un token de retención selectiva, así como una ventana de deslizamiento para el contexto local, a través de una puerta de acceso.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 12 (KV cache, flash-attention), Phase 7 · 15 (attention variants), Phase 10 · 16 (differential attention)
**Time:** ~60 minutes

## El objetivo del aprendizaje

- Cuentan las tres secciones de atención de la NSA, así como cada sección captura información.
- Explicar por qué la NSA es naturalmente entrenable, mientras que el método de atención escasa anterior sólo puede ser utilizado para inferir.
- En el contexto de 64k, según el tamaño del bloque de compresión y la selección de la parte superior de k, calcular la NSA comparado con la atención completa de Atención 计算节省量。
- En una breve secuencia de sintetizado, usando stdlib Python 实现三分支组合,并验证 gating weights的行为──

##  problemas

序列长度为 N 时,Full attention 的时间成本是 `O(N^2)`, por capa KV cache es `O(N)`△ en 64k Token 下, calcular y ancho de banda de memoria 数字都非常灾难──NSA 论文中的理论估计测量值显示:在 64k 下,Attention 占总解码 延迟的 70-80%──后续所有指标,包括TTFT、tokens/sec、每百万 Token 成本,都被注意 成本主导──

La escasez de atención es una respuesta evidente. Se trata de un intento de dividir los patrones fijos en dos tipos. La escasez de patrones fijos (sliding-window、strided、block-local) se deshace de la información y fracasará en la tarea de recuerdo a largo plazo. La escasez de tiempo de la inferencia (KV cache pruning、H2O、StreamingLLM) se utiliza en modelos pre-entrenados con mucha atención, pero sólo puede recuperar una pequeña parte de la potencialidad de aceleración, ya que el modelo nunca se requiere a través de patrones escasos.

Native Sparse Attention(Yuan et al., DeepSeek + PKU + UW, ACL 2025 mejor documento, arXiv:2502.11089) 两者兼具:模型在预训期间学习的稀缺模式, así como un algoritmo alineado con el núcleo para realizarlo, lo que lo hace en la inferencia 时真正交付计算节省.

## 概念

### Tres ramas de la línea

Para cada consulta, la NSA se dirige a la caché KV de tres diferentes vídeos.

1. **Compressed branch.**Token 被分组为大小为 `l`de bloques, normalmente 32 o 64) ⋅ cada bloque ⋅ a través de un pequeño MLP aprendido ⋅ comprimido en un solo token de resumen ⋅ query ⋅ irá a estas fichas comprimidas, para obtener la gruasima magnitud de la serie entera ⋅

2. **Selected branch.**Utiliza las puntuaciones de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de atención de la rama comprimida, identificando los puntos de la rama comprimida, identificando los puntos de la rama comprimida, identificando los puntos de la sección de la sección de la sección de la sección de la sección de la sección de la sección de la sección de la sección de la sección de selección.

3. **Sliding-window branch.**consultas estarán presentes hasta el último `W`个 Token (normalmente 512), utilizado en el contexto local.

Tres分支的输出通过学习的位置门组合:

```
out = g_cmp * out_cmp + g_sel * out_sel + g_win * out_win
```

`g_cmp, g_sel, g_win`Es la pregunta sobre los pesos de puertas producidos por pequeños MLP.

### ¿Por qué es nativo?

Selección 步骤(top-k bloques) es desprenderse de la misma manera. Las operaciones de desprenderse destruyen el flujo gradiente.

NSA ha pasado por alto este punto: la atención de la rama comprimida En realidad, se trata de un factor que afecta a toda la secuencia de la gran cantidad de datos comprimidos Atención. La operación de la parte superior es simplemente repetir los puntos de la rama comprimida.`top_k`操作在前向计算图上是无运, sólo controla los bloques que se cargan en el memoria.

Esta es la razón por la cual la NSA puede utilizarse de extremo a extremo en el pre-entrenamiento.

### Núcleo alineado con el hardware

El núcleo de la NSA es para la jerarquía de memoria de GPU moderna 设计的──nucleo 按 GQA grupo 加载查询(bucle externo), para cada grupo 获取对应的稀少KV bloquees(bucle interno), y en SRAM 上运行注意──由于 cada grupo de consulta 看到相同的选区块(selección es por grupo de consulta, y no por cabeza de consulta),KV 加载会在组内摊销──Aritmética intensidad 维持在较高水平──

论文报告称, los kernels de Triton en 64k decodifican 上比 FlashAttention 快 9x, y la relación de velocidad 会随序列长度增长──Forward和后后 kernels 均已提供──

### 计算预算

¿ Qué ?`N`Por la longitud del proceso,`l`Para el tamaño del bloque de compresión,`k`Por el top-k de la selección de cuenta,`w`Por la ventana deslizante,`b`Por el tamaño de bloque seleccionado (normalmente igual a `l`)。

- Ramo comprimido: cada consulta tiene`O(N/l)`个 llaves, por lo tanto, 总计`O(N * N / l)`¿Qué es eso?
- Se seleccionó rama: cada consulta tiene `O(k * b)`个 llaves, por lo tanto, 总计`O(N * k * b)`¿Qué es eso?
- Ramo deslizante: cada consulta tiene`O(w)`个 llaves, por lo tanto, 总计`O(N * w)`¿Qué es eso?

总计:`O(N * (N/l + k*b + w))`¿Qué es eso?

Cuando`N = 64k, l = 64, k = 16, b = 64, w = 512`: cada consulta de costos`1000 + 1024 + 512 = 2536 keys`❖ Toda la atención`64000 keys` Cuenta reducida 25 veces

Cuando`N = 128k, l = 64, k = 16, b = 64, w = 512`: cada consulta de costos`2000 + 1024 + 512 = 3536 keys`❖ Toda la atención`128000 keys`❖ Reducir 36x♦ Los beneficios aumentan con la longitud de la secuencia, esto es lo que significa.

### ¿Cómo comparar

| Method | Differentiable | Real inference speedup | Long-range recall |
|--------|---------------|----------------------|-------------------|
| Sliding window only | yes | yes | fails |
| Strided / block-sparse | yes | yes | partial |
| KV pruning (H2O, StreamingLLM) | N/A (inference-time) | yes | partial |
| MoBA (Moonshot) | partial | yes | good |
| NSA | yes (natively) | yes (9x at 64k) | matches full attention |

MoBA(Moonshot, arXiv:2502.13189) Co期发布, también adoptó similar三个胜过一个的思路,将MoE 原则应用到注意区块──NSA 和 MoBA 是理解2026长文本预训练 必须掌握的两个架构──


```figure
sliding-window-attention
```

## Construirlo

`code/main.py`En una breve secuencia de síntesis se realizan tres brancas, y se muestra:

- Compresión MLP(Para enseñar claramente, utilizar una base de base simple de la media; verdadera NSA utiliza MLP aprendida)。
- Por las puntuaciones de ramas comprimidas 驱动的顶-k块选择──
- Recientemente`w`个Token 上的 deslizante-ventana Atención。
- combinación cerrada.
- Con toda la atención a la impresión de recuento de cálculo en comparación.

### Paso 1: Comprimir los tokens en bloques

```python
def compress(K, l):
    n = len(K)
    n_blocks = (n + l - 1) // l
    out = []
    for b in range(n_blocks):
        start, end = b * l, min((b + 1) * l, n)
        block = K[start:end]
        summary = [sum(row[d] for row in block) / len(block) for d in range(len(K[0]))]
        out.append(summary)
    return out
```

### 步骤 2: rama comprimida Atención

运行 query 针对压缩键的软max Atención──comprimió-branch scores 同时作为顶级k选择的信号──

### 步骤 3: selección de bloque de la parte superior

 seleccionar el puntaje más alto `k`个压缩块的索引──加载这些块 中的原始未压缩代币,并运行在上面注意──

### 步骤 4: ventana deslizante Atención

¡ ¡ ¡ ¡ ¡ ¡ ¡ ¡ ¡ ¡ ¡ ¡ ¡ ¡ ¡ Qué tan grande !`w`个 Token,并针对它们运行标准 Atención.

### 步骤 5: puerta + combinar

En la siguiente sección, se puede ver la cantidad de piezas que se han colocado en el punto de partida de la serie.

### 步骤 6: Cuenta de computación

Imprimir cada sección de cada consulta de las teclas de asistencia número y número total.`N`(atención total) hacer comparación.`l = 32, k = 4, w = 128`,NSA cada consulta ver`32 + 128 + 128 = 288`Las llaves, y la atención total es 1024, reducido 3,5x.

## Usalo

NSA está en Profundo Buscar su propio proceso de formación previo a largo plazo.

- **DeepSeek internal**:native, ha publicado el derecho de usar NSA o posterior DSA (Deepseek Sparse Attention)
- **vLLM**: está desarrollando soporte experimental de la NSA para los pesos de DeepSeek-V3.x.
- **SGLang**: han publicado los índices de referencia de la NSA;
- **llama.cpp / CPU**: no soportado; en el rendimiento de la CPU, la descomposición del núcleo no vale la pena.

¿Cuándo usar la NSA:

- 面向64k+ contexto, y hay un presupuesto de computación estricto de pre-entrenamiento o de formación continua.
- Para DeepSeek, los propios puntos de control de contexto largo, hacer inferencias. Estos pesos son nativos de la NSA.

¿Qué tiempo no usar:

- Servicio 现有密集注意预训练模型──没有 formación continua, no puede ser retrofit NSA──
- Contexto 低于16k──三分支开销会超过省收益──
- Batch-1 chat interactivo―decodificación sensible a la latencia 会受益, pero sólo en contextos largos 下成立―

##  entregarlo

本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-nsa-integrator.md` Dado una especificación de ejecución previa a la capacitación de largo contexto, generará un plan de integración de la NSA: tamaño de bloque de compresión, altura de la ventana, ancho de la puerta de MLP, elección del núcleo, así como evaluaciones específicas de contexto largo para demostrar que la estructura se vuelve más razonable.

##  ejercicios

1. En 1024-Token  sintetizado en la secuencia de ejecución `code/main.py` en tres presets arriba barrido `(l, k, w)`Y imprimir recuentos de cálculo. Encontrar en la prueba de aguja en haystack.

2. Se puede utilizar un compresor de pozo medio para reemplazarlo por un pequeño MLP aprendido de 2 capas, oculto 32) ⋅ en un bloque de señal ≈ de la media de la misión de composición en el entrenamiento de la misma.

3. 实现 gate MLP── se utiliza como consulta 作为输入,输出三个规模── mostrar la conducta de la puerta es razonable: en consultas aleatorias 上接近均权重; en la consulta 命中远前的块时,给给给选择分支 给给出较高权重──

4. 计算 NSA-enabled 70B 模型在 128k contexto 下的 KV cache memoria presupuesto──KV cabezas 为 8,head dim 为 128,BF16── con plena atención y MLA─Fase 10 · 14 展示了MLA的数字) hacer comparación──查找 NSA's fine-grained branch KV cache 等等到全注意序列长度──

5. 阅读 NSA 论文(arXiv:2502.11089) 第 4 节,并用三句话解释为什么 comprimido rango de las puntuaciones de atención serán repetidas para la selección de top-k, en lugar de calcular un único puntuación de enrutamiento individual──将答案关联到渐进流──

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Compressed branch | “粗粒度视图” | 在 block-averaged keys 上做 Attention，以每个 query `O(N/l)` 个 keys 提供 global context |
| Selected branch | “Top-k blocks” | 在 compressed-branch scores 最高的 `k` 个 blocks 上做细粒度 Attention |
| Sliding window | “Local context” | 在最后 `W` 个 Token 上做 Attention，以捕获短程模式 |
| Native trainability | “打开 sparsity 进行 pre-train” | sparsity pattern 在 pre-training 期间学习，而不是在 inference 时外挂 |
| Compression block size l | “粗粒度视图的 group size” | 多少个 Token 被合并成一个 summary；通常为 32-64 |
| Top-k | “要保留的 blocks” | 读取其未压缩 Token 的 compressed blocks 数量；通常为 16 |
| Sliding window W | “Local attention radius” | 通常为 512；更短会损害 local coherence，更长会浪费计算 |
| Branch gate | “如何混合三个分支” | per-position MLP 输出，对三个分支的贡献加权 |
| Hardware alignment | “Kernel-friendly sparsity” | 选择 sparse pattern，使实际 GPU kernel 能达到理论 speedup |
| DSA | “NSA 的后继者” | Deepseek Sparse Attention，DeepSeek 系谱中继 NSA 之后的架构 |

## 延伸阅读

- [Yuan et al. — Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention (arXiv:2502.11089, ACL 2025 Best Paper)](https://arxiv.org/abs/2502.11089) 论文
- [DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) NSA 面向的架构家族
- [Moonshot AI — MoBA: Mixture of Block Attention for Long-Context LLMs (arXiv:2502.13189)](https://arxiv.org/abs/2502.13189) 同期工作, enfocado a los bloques
- [Beltagy et al. — Longformer: The Long-Document Transformer (arXiv:2004.05150)](https://arxiv.org/abs/2004.05150) ventana deslizante 起源
- [Xiao et al. — StreamingLLM: Efficient Streaming Language Models with Attention Sinks (arXiv:2309.17453)](https://arxiv.org/abs/2309.17453) NSA 改进的 inferencia-tiempo de la base de la esparcia
- [Dao et al. — FlashAttention-2 (arXiv:2307.08691)](https://arxiv.org/abs/2307.08691)Los núcleos de la NSA en 64K Bajo la línea de base de atención completa de la derrota
