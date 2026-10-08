# KV Cache, atención flash y optimización de la recomendación

>                                                                                                                                                                                                                                                               

**Type:** Build
**Languages:** Python
**先修要求：**Fase 7 · 02 (autoatención), Fase 7 · 05 (transformador completo), Fase 7 · 07 (GPT)
**Time:** ~75 minutes

##  problemas

Un simple decodificador de auto-regreso`N`个 tokens 需要做 `O(N²)`工作: cada paso se recalcula la atención en la totalidad de la anterioridad. Para una respuesta de un token 4K, esto significa 16M veces la atención de la operación, la mayoría de las cuales son redundantes.

Además, la atención en sí misma también se moverá una gran cantidad de datos. La atención estándar se materializa en una matriz de puntaje N×N, N×d de salida de softmax, N×d de salida final, en el número de veces que se lee en HBM. Para N≥2K, la atención se convierte primero en una memoria limitada, en lugar de una FLOP.

Dao et al. propusieron dos optimizaciones, que han llevado el proceso de adelanto de la lenta a la rápida:

1. **KV cache。**存储每个前代币的 K 和 V向量──每个新代币的注意 都是一个查询对缓存键的计算──推理从每个代步的 `O(N²)`降到 `O(N)`¿Qué es eso?
2. **Flash Attention。**Para la atención  calcular hacer barandillas, hacer que la matriz N×N completa  nunca entrará en HBM── todos los softmax + matmul están completados en SRAM── en A100 arriba velocidad del reloj de pared es de 24×; en apoyo de FP8 H100 arriba es de 510×──

Para 2026, ambos ya están en uso en general. Cada una de las fases de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de producción de la serie de modelos de la serie de modelos de producción de la serie de modelos de la serie de modelos de producción de la serie de modelos de la serie de la serie de modelos de la serie de la serie de modelos de la serie de la serie de modelos de la serie de la serie de modelos de la serie de la serie de la serie de la serie de modelos de la serie de la serie de la serie de la serie de la serie de modelos de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie de la serie.

## 核心概念 核心概念 核心概念 核心概念

![KV cache growth and Flash Attention tiling](../assets/kv-cache-flash-attn.svg)

### Matemáticas de caché de KV

Cada capa de decodificación, cada token, cada cabeza:

```
bytes_per_token_per_layer = 2 * d_head * dtype_size
                          ^
                          K and V
```

Para un modelo 7B, 32 niveles 32 cabezas d_head=128 fp16:

```
per token per layer = 2 * 128 * 2 = 512 bytes
per token (32 layers) = 16 KB
per 32K context = 512 MB
```

对于Llama 3 70B(80 层、d_head=128、使用 8 个KV heads 的 GQA):

```
per token per layer = 2 * 8 * 128 * 2 = 4096 bytes (4 KB)
per 32K context = 10.4 GB
```

Esto es lo que hace que el 10 GB de Llama 3 70B en el contexto de 128K, sólo el almacenamiento de KV del tamaño del lote 1 ocuparía la mayor parte del almacenamiento de 40 GB de A100.

**GQA 是 KV-cache 的关键收益。**Utiliza 64 cabezas de MHA, se necesitarán 32 GB.

### Atención flash  azulejos 技巧

标准 atención:

```
S = Q @ K^T          (HBM read, N×N, HBM write)
P = softmax(S)       (HBM read, HBM write)
O = P @ V            (HBM read, HBM write)
```

Tres veces HBM 往返── en H100, HBM 带宽 es de 3 TB/s; SRAM es de 30 TB/s── en comparación con guardar todo el contenido en el chip, cada vez HBM 往返都带来约10倍的减速──

Atención instantánea:

```
for each block of Q (tile size ~128 × 128):
    load Q_tile into SRAM
    for each block of K, V:
        load K_tile, V_tile into SRAM
        compute S_tile = Q_tile @ K_tile^T     (SRAM)
        running softmax aggregation             (SRAM)
        accumulate into O_tile                  (SRAM)
    write O_tile to HBM
```

Cada mosaico sólo necesita una vez HBM 往返 总内存占用从 `O(N²)`降到 `O(N)`❖ Pasado hacia atrás 会从前进的 pas 中重新计算部分值, en lugar de mantenerlos todos en su existencia 

**数值技巧。**Correr softmax en los azulejos  entre mantenimiento `(max, sum)`, por lo tanto, la integración final es precisa. Esto no es similar.

**版本演进：**

| Version | Year | Key change | Speedup on reference hardware |
|---------|------|-----------|-------------------------------|
| Flash 1 | 2022 | Tiled SRAM kernel | A100 上 2× |
| Flash 2 | 2023 | 更好的并行性，causal-first ordering | A100 上 3× |
| Flash 3 | 2024 | Hopper asynchrony、FP8 | H100 上 1.5–2×（~740 TFLOPs FP16） |
| Flash 4 | 2026 | Blackwell 5-stage pipeline、software exp2 | Inference-first（最初仅 forward） |

Flash 4 发布时只支持前进通过──训练仍使用 Flash 3──Flash 4 的 GQA 和 varlen 支持仍在等待中(2026年中)──

### Descodación especulativa  另一个延迟优化

廉价模型提出N 个代币――大模型并行验证全部N 个代币―― si la验证 acepta k 个代币, usted就就用1次大模型前传 换来 k 次生成――对于代码和散文,典型 k=35──

2026:
- **EAGLE 2 / Medusa。**集成式草案头,共享验证器的隐藏状态──23×加快,且无质量损失──
- **Speculative decoding with draft model。**En el hardware de consumo hay 24x de velocidad.
- **Lookahead decoding。**Iteración Jacobi; no necesita modelo de proyecto.

### Participación continua

经典批发推论: esperar la secuencia más lenta 结束, luego iniciar un nuevo lote ⋅当短响应提前结束时,会浪费GPU⋅

Batchings continuos ([[{{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url={{url}}}}}}}}}}) }}) }}) }}) }}) }}

### PagedAttention  Colocar el caché KV 当作虚拟内存

VLLM de punto de venta central. KV cache de 16 tokens de bloques de distribución. tabla de página se distribuirá la posición lógica de la distribución de bloques físicos. Puede ser compartido entre los mismos.


拖动维度参数, observar el tamaño del caché 如何变化──把 secuencia longitud o tamaño de lote 推高, verás que es más rápido que la capacidad de un solo GPU──

```figure
kv-cache-sizer
```

```figure
flash-attention-memory
```

## Construirlo

¿ Qué ?`code/main.py`❖ Nosotros realizamos:

1. Un simple.`O(N²)`decodificador incremental.
2. Una de ellas .`O(N)`Descriptor almacenado en caché KV
3. Un simulador del algoritmo de ejecución máxima de atención flash de softmax de azulejos.

### Paso 1: Cache de KV

```python
class KVCache:
    def __init__(self, n_layers, n_heads, d_head):
        self.K = [[[] for _ in range(n_heads)] for _ in range(n_layers)]
        self.V = [[[] for _ in range(n_heads)] for _ in range(n_layers)]

    def append(self, layer, head, k, v):
        self.K[layer][head].append(k)
        self.V[layer][head].append(v)

    def read(self, layer, head):
        return self.K[layer][head], self.V[layer][head]
```

很简单: en cada uno de los niveles  de cada cabeza de la lista, continuamente añadir cada token de K V vectores

### 步骤 2: softmax de las baldosas

```python
def tiled_softmax_dot(q, K, V, tile=4):
    """Flash-attention-style softmax(qK^T)V with running max/sum."""
    m = float("-inf")
    s = 0.0
    out = [0.0] * len(V[0])
    for start in range(0, len(K), tile):
        k_block = K[start:start + tile]
        v_block = V[start:start + tile]
        scores = [sum(qi * ki for qi, ki in zip(q, k)) for k in k_block]
        new_m = max(m, *scores)
        exp_old = math.exp(m - new_m) if m != float("-inf") else 0.0
        exp_new = [math.exp(sc - new_m) for sc in scores]
        s = s * exp_old + sum(exp_new)
        for j in range(len(out)):
            out[j] = out[j] * exp_old + sum(e * v[j] for e, v in zip(exp_new, v_block))
        m = new_m
    return [o / s for o in out]
```

输出与一次性计算 `softmax(qK) V`Un poco idéntico, pero el conjunto de trabajo de cualquier momento son sólo uno.`tile × d_head`Bloqueo, en lugar de completo `N × d_head`¿Qué es eso?

### Paso 3: En la generación de 100 tokens 上比较 naiv vs. decodificación caché

统计注意 操作数──Návio:`O(N²)`= 5050♦ En caché:`O(N)`= 100―代码会打印二者―

## Usalo

```python
# HuggingFace transformers auto-enables KV cache on decoder-only generate().
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.2-3B",
    attn_implementation="flash_attention_2",  # use FA3 if Hopper
    torch_dtype="bfloat16",
)
# generate() uses KV cache automatically
```

VLLM 生产部署:

```bash
pip install vllm
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --tensor-parallel-size 4 \
    --max-model-len 32768 \
    --enable-prefix-caching \
    --kv-cache-dtype fp8
```

跨请求的预写缓存是2026年的重要收益相同系统提示、少数截图示例,或长文本文档 都能在多次调用之间复用 KV──对于反复使用工具提示的代理 工作负载,预写缓存通常能带来5× 吞吐量提升──

##  entregarlo

¿ Qué ?`outputs/skill-inference-optimizer.md`◊ Esta habilidad se utilizará para la nueva propuesta de la Comisión de Ejecución de la estrategia de caché de KV, cuantificación y descodificación especulativa.

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Confirmar que los decodificadores naivos y almacenados en caché producen la misma salida;
2. **Medium.**实现 prefijo caching:给定一个提示P 和多个完成,先对P 运行一次前行通过来填充KV缓存,然后按每个完成 分支――测量对对每个完成重新编码P的速度――
3. **Hard.**实现一个玩具版 PagedAttention:KV cache Utiliza fijos bloques de 16 tokens,并带有免费列表── Cuando una secuencia 完成时,把它的块 归归池中──模拟1000 个长度不同的聊天完成──comparar con la situación de los fragmentos de memoria de distribución连续──

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 它实际上的含义 |
|------|------------|----------------|
| KV cache | “让 decoding 变快的技巧” | 存储每个前缀 token 的 K 和 V；新 queries attend to 它们，而不是重新计算。 |
| HBM | “GPU 主内存” | High Bandwidth Memory；H100 上 80 GB，B200 上 192 GB。带宽约 3 TB/s。 |
| SRAM | “片上内存” | 每个 SM 的高速内存，H100 上每个 SM 约 256 KB。带宽约 30 TB/s。 |
| Flash Attention | “Tiled attention kernel” | 在 HBM 中不物化 N×N 的情况下计算 attention。 |
| Continuous batching | “No-wait batching” | 不清空 batch，直接换出完成的 sequences、换入新的 sequences。 |
| PagedAttention | “vLLM 的核心卖点” | KV cache 以固定 blocks 分配，并通过 page table 管理；消除碎片。 |
| Prefix caching | “复用长 prompts” | 在请求之间缓存共享前缀的 KV；对 agents 来说是重大成本削减。 |
| Speculative decoding | “Draft + verify” | 廉价 draft model 提出 tokens；大模型在一次 pass 中验证 k 个。 |

## 延伸阅读

- [Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) Flash 1。
- [Dao (2023). FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691) Flash 2。
- [Shah et al. (2024). FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608) Flash 3。
- [FlashAttention-4 release notes (Dao-AILab, 2026)](https://github.com/Dao-AILab/flash-attention) Blackwell 5 etapas de tubería 和 software-exp2 技巧; leer repo README, conocer en este curso mencionados de las advertencias de lanzamiento solo para el futuro。
- [Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) vLLM 论文。
- [Leviathan et al. (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) Descripción de especificaciones。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) 本课引用的综合草案方法的EAGLE-1/2 paper──
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) El enfoque de Medusa citado en la primera parte con el águila.
- [vLLM docs — PagedAttention](https://docs.vllm.ai/en/latest/design/kernel/paged_attention.html) 关于16 token block 和 page-table design de la canónica inmersión profunda―
