# Atención 变体  Ventana deslizante, Sparse, Diferencial

> La atención total es un círculo. Cada token puede ver cada token, mientras que la memoria paga por ello.

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 02 (Autopatia), Fase 7 · 03 (Multi-Head), Fase 7 · 12 (KV Cache / Atención Flash)
**Time:** ~60 minutes

##  problemas

Atención total en el costo de memoria en la longitud del proceso es `O(N²)`, calcular el coste también`O(N²)`❖ Para una Llama de 128K de contexto 3 70B, esto significa que cada capa tiene 160 mil millones de artículos de atención, vuelva a multiplicarse por 80 niveles.`O(N²)`La activación en la memoria, pero no cambiará el cálculo de los costos de cada token.

Tres tipos de cambios en la Matriz de Atención

1. **Sliding window attention (SWA).**Cada token sólo atende a los tokens vecinos dentro de la ventana fija, en lugar de prefijo completo.`O(N · W)`, entre ellos `W`Es una ventana grande. Gemma 2/3 de la ventana.
2. **Sparse / block attention.**只有选定的 `(i, j)`Se ha creado un sistema de conversión de la tecnología de la información en la que se puede utilizar el sistema de conversión de datos.
3. **Differential attention.**Utiliza una proyección independiente de Q/K 计算两张 Atención mapa,再相减―― eliminar将把权重泄漏到前几个代币的 注意沉──Microsoft's DIFF Transformer(2024)──

Estos pueden coexistir. Un modelo fronterizo de 2026 往往会混合使用它们: la mayoría de las capas son SWA-1024, cada cinco capas tiene una capa global completa Atención, hay una pequeña cantidad de cabezas diferenciales usadas para resolver los recetos.

## 概念

### Atención a las ventanas deslizantes (SWA)

 posición `i`Cada consulta sólo atender hasta `[i - W, i]`(SWA causal) o `[i - W/2, i + W/2]`(bidireccional) 间位置──窗口外的代币 会在分数矩阵中得到 `-inf`¿Qué es eso?

```
full causal:           sliding window (W=4):
positions 0-7          positions 0-7, W=4
    0 1 2 3 4 5 6 7        0 1 2 3 4 5 6 7
0 | x                0 |  x
1 | x x              1 |  x x
2 | x x x            2 |  x x x
3 | x x x x          3 |  x x x x
4 | x x x x x        4 |    x x x x
5 | x x x x x x      5 |      x x x x
6 | x x x x x x x    6 |        x x x x
7 | x x x x x x x x  7 |          x x x x
```

 para `N = 8192`Y `W = 1024`, la puntuación de Matrix  Expectations en 1024 × 8192                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

**KV cache 会随 SWA 缩小。**Cada nivel sólo necesita mantenerse reciente.`W`个 Token de K 和 V── para una configuración similar a Gemma-3(1024 ventana,128K contexto),KV caché 会降低 128×──

**质量成本。**纯SWA Transformer 难以处理长距离检索――修复方法: 在SWA 层间交错 满意度层――Gemma 3 使用 5:1 SWA:global――Mistral 7B 使用因果性SWA堆,信息通过重叠窗向前流每层都将有效感受野扩展`W`, pasando por`L`层后,模型 puede asistir hacia atrás `L × W`个 Token。

### Atención de escasez / bloqueo

预先选择一个 `N × N`Patrón de esparsidad.

- **Local + strided (OpenAI sparse transformer).**Asistir hasta el último .`W`个 Token, volver a añadir esto`stride`个 Token de la posición.`O(N · sqrt(N))`计算同时捕捉局部和长距离信息──
- **Longformer / BigBird.**Ventana local + menor cantidad de tokens globales`[CLS]`), estos Token asisten hasta todos los Token, también son todos los Token asisten + enlaces aleatorios-espaciosos。 en匹配质量下经验上获得2× context。
- **Native Sparse Attention (DeepSeek, 2025).**¿Qué aprender?`(Q, K)`bloque importante; en el núcleo 层面跳过零 bloque──兼容 FlashAttention──

Sparse Attention es una ingeniería de núcleo 故事──数学很简单(mask score Matrix); beneficios de la descarga de 没有把零条目加载进 SRAM──FlashAttention-3 和 2026 年的 FlexAttention API 让自定义稀少模式 成为PyTorch中的等能力──

### El objetivo de la evaluación es garantizar la eficacia de la evaluación de los resultados de la evaluación.

常规注意 有一个注意 问题:softmax 强制每一行求和为1, por lo que aquellos que no desean asistir especialmente a cualquier contenido de Token se verá inclinado hacia el primer Token (或前几个 Token)   问题:softmax 强制每一行求和为1,因此那些不想特别出席到任何内容的 Token会把权重倾倾倒到第一 Token (或前几个 Token) 上.

Atención diferencial 通过计算**两张**El mapa de atención no se reduce para resolver este problema:

```
A1 = softmax(Q1 K1^T / √d)
A2 = softmax(Q2 K2^T / √d)
DiffAttn = (A1 - λ · A2) V
```

Entre ellos `λ`Es una escala que se obtiene de aprendizaje (normalmente 0,50.8) A1 捕捉真实内容权重; A2 捕捉 sink。相减会抵消 sink,把权重重新分配给相关代币。

报告结果(Microsoft 2024):perplejidad 降低 510%,在相同训练长度下有效背景 延长 1.52×,agullas en haystack 检索更敏。

### 变体对比

| Variant | Compute | KV cache | Quality vs full | Production use |
|---------|---------|----------|-----------------|----------------|
| Full attention | O(N²) | O(N) per layer | baseline | 每个模型的默认层 |
| SWA (window 1024) | O(N·W) | O(W) per layer | -0.1 ppl，搭配 global layers 效果好 | Gemma 2/3, Phi-3-Long |
| Local + strided sparse | O(N·√N) | mixed | 类似 SWA | OpenAI sparse transformer, Longformer |
| BigBird (local + global + random) | O(N) approx | mixed | 在 2× context 下匹配 full | early long-context BERT |
| Native Sparse (DeepSeek-V3.2) | O(N · active fraction) | O(N) | within 0.05 ppl | DeepSeek-V3.2, 2025 |
| Differential | O(2·N²) | O(2N) | -5 to -10% ppl | DIFF Transformer, early 2026 models |


```figure
gqa-kv-sharing
```

## Construirlo

¿ Qué ?`code/main.py` Hemos implementado un comparador de máscaras causales, en el juego de secuencias, que muestra la atención completa, SWA, local+strided 和 Differential Attention.

### 步骤 1: máscara causal completa (baseline)

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

Desde la línea de base de la Lección 07;;;

### 步骤 2: Máscara causal de la ventana deslizante

```python
def swa_mask(n, window):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
    return M
```

Un parámetro`window`¿Qué es esto?`window >= n`时,会恢复 plena Causal Atención.`window = 1`时, cada Token sólo asistir hasta sí mismo.

### 步骤 3: local + graduada máscara escasa

```python
def strided_mask(n, window, stride):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
        for j in range(0, i + 1, stride):
            M[i][j] = 0.0
    return M
```

La ventana local más densa desde el inicio de la serie hasta el inicio de cada segmento`stride`个 Token's position── Con el aumento del número de extraes de la tabla, el sensitivito se incrementa en el log step.

### Paso 4: Atención diferenciada

```python
def diff_attention(Q1, K1, Q2, K2, V, lam):
    A1 = softmax_causal(Q1 @ K1.T / sqrt_d)
    A2 = softmax_causal(Q2 @ K2.T / sqrt_d)
    return (A1 - lam * A2) @ V
```

两次 Atención pasa, usando el coeficiente de mezcla obtenido de aprendizaje 相减──在代码中, comparamos una sola Atención con la mapa de calor de la atención-sinca de Atención Diferencial,并观察 sink 缩──

### Paso 5: Tamaños de caché KV

En el`N = 131072`Imprimir cada variable de cada nivel de tamaño de caché. SWA y poco 变体会降低 10100×.

## Usalo

Modelo de producción de 2026:

```python
from transformers import AutoModelForCausalLM
# Gemma 3 mixes SWA (window=1024) and global layers at 5:1.
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-27b-it")
# print(model.config.sliding_window, model.config.layer_types)
```

PyTorch 2.5+ 中的 FlexAttention  acepta una función de máscara:

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)
```

Esto se traducirá en un kernel de Triton automático. Para el patrón habitual, la velocidad está en el 10% de FlashAttention-3, y la función de máscara es una llamada Python.

**何时选择哪一种：**

- **Pure full attention** Cada nivel es adecuado para un contexto máximo de aproximadamente 16K, o la calidad de la búsqueda es crucial cuando¬
- **SWA + global mix** 长 context(>32K), entrenamiento y inferencia 受内存限制──2026年 32K 以上的默认选择──
- **Sparse block attention** Self define kernel、self define pattern── reservado a un trabajo especial (en inglés)
- **Differential attention**  cualquier contaminación por sumidero de atención causará daños 

##  entregarlo

¿ Qué ?`outputs/skill-attention-variant-picker.md` Esta habilidad se basará en la longitud del contexto objetivo, la demanda de búsqueda y el perfil de computación de entrenamiento/inferencia, para seleccionar un nuevo modelo de topología de atención.

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Prueba`window=4`El SWA se encuentra en la línea de los últimos 4 tokens fuera de todo el contenido de la SWA.`window=n`会 bit-identicamente 复现 plena atención causal。
2. **Medium.**En la lección 07 la piedra angular 之上实现 `window=1024`¿Cuánto tiempo de tiempo de trabajo de la persona? ¿Cuánto tiempo de tiempo de trabajo de la persona?
3. **Hard.**En la piedra angular  modelo se realiza Gemma-3 estilo 5:1 mezcla de capas  5 niveles SWA,1 nivel global)  En el caso de la compatibilidad de los parametros, en comparación con la pérdida de memoria y la calidad de generación de base de SWA y de base global pura 
4. **Hard.** Realizar cada cabeza tiene algo que aprender `λ`En el caso de la coincidencia de los parámetros, se mide la precisión de la recuperación en relación con la línea de base de atención única.

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sliding window attention (SWA) | "Local attention" | 每个 query attend 到最近 `W` 个 Token；KV cache 缩小到 `O(W)`。 |
| Effective receptive field | "模型能向后看多远" | 在一个窗口为 `W` 的 `L` 层 SWA stack 中，最多 `L × W` 个 Token。 |
| Longformer / BigBird | "Local + global + random" | Sparse pattern，包含少量始终 attend 的 global tokens；早期 long-context 方法。 |
| Native Sparse Attention | "DeepSeek's kernel trick" | 学习 block-level sparsity；在保持质量的同时，在 kernel 层面跳过零 block。 |
| Differential attention | "Two maps, one subtracts" | DIFF Transformer：从第一张 Attention map 中减去学习得到的 `λ` 倍第二张 Attention map，以抵消 attention sinks。 |
| Attention sink | "权重泄漏到 token 0" | Softmax normalization 强制行求和为 1；信息量不足的 query 会把权重倾倒到位置 0。 |
| FlexAttention | "Mask-as-Python" | PyTorch 2.5+ API，可将任意 mask function 编译成 FlashAttention 形状的 kernel。 |
| Layer type mix | "5:1 SWA-to-global" | 在 stack 中交错 sparse 和 full Attention 层，以更低内存保持质量。 |

## 延伸阅读

- [Beltagy, Peters, Cohan (2020). Longformer: The Long-Document Transformer](https://arxiv.org/abs/2004.05150) 经典的滑窗+global-token 论文──
- [Zaheer et al. (2020). Big Bird: Transformers for Longer Sequences](https://arxiv.org/abs/2007.14062) local + global + aleatorio。
- [Child et al. (2019). Generating Long Sequences with Sparse Transformers](https://arxiv.org/abs/1904.10509) Patrón local+caminado de OpenAI
- [Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical Size](https://arxiv.org/abs/2408.00118) 1:1 SWA: mezcla global
- [Gemma Team (2025). Gemma 3 technical report](https://arxiv.org/abs/2503.19786) ventana=1024 de 5:1 mezcla, hoy es el tutorial
- [Ye et al. (2024). Differential Transformer](https://arxiv.org/abs/2410.05258) Transformador DIFF 论文。
- [Yuan et al. (2025). Native Sparse Attention](https://arxiv.org/abs/2502.11089) DeepSeek-V3.2 de la imparcialidad aprendida Atención。
- [PyTorch — FlexAttention blog and docs](https://pytorch.org/blog/flexattention/) Use It 中 enmascarada como patrón de llamadas de referencia API。
