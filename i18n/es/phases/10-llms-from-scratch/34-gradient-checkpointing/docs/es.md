# Control de graduación y recomputada de activación

> La retropropagación conservará cada uno de los valores activados intermedios. En los parámetros 70B y 128K, el valor activado de cada rango puede alcanzar 3 TB.

**Type:** Build
**语言:**Python (con antorcha opcional)
**前置要求:**Fase 10 Lección 04 (Mini-GPT pre-entrenamiento), Fase 10 Lección 05 (Escalado y distribuido)
**Time:** ~70 分钟

##  problemas

训练变压器 会为每一层保存后退 中需要求导的每op的输入: Atención 输入、Q/K/V proyecciones、softmax 输出、FFN 输入、norm 输出,以及 residual stream──对隐藏的尺寸为`d`、 longitud de la secuencia 为 `L`、partida por `B`De una capa, esto es aproximadamente cada capa.`12 * B * L * d`个浮点数── es el número de puntos

 para `d=8192, L=8192, B=1`, esto en BF16 下是800 MB/层── un modelo de 64 capas tiene un valor de activación de 51 GB, esto no se multiplica en tamaño de microbatch, ni tampoco se añade intermedios de atención-softmax( por cabeza`L^2`), no hay más que una copia parcial paralela a tensores.

Este es un sistema de control de niveles de BF16 con un estado de optimización de 80 GB, pero el valor de activación puede superar los límites.

朴實實實時,checkpointing Cada paso ~約會多花 33% de FLOPs de paso adelante ~~ 實實實時好時,即即即根據Korthikanti et al. 智能選購 做選購檢查點,你可以在5% 开销下省 5x 記憶體 ~~ 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 內 

## 概念

### Retroceder  realmente necesita qué

`output = layer(input)`❖ Retrocediendo 想要 `grad_input`Y `grad_params`❖ Para calcularlas, necesita:

- `input`(para el cálculo en línea`grad_params = input.T @ grad_output`(en inglés)
- Algunos de los valores de activación intermediación (ReLU/GELU/softmax)

Pasar adelante 会在 autograd gráfico 中自动保存这些内容──每个 `tensor.retain_grad()`Y cada uno de los que necesitan su entrada, conservará un citado.

### 朴素 Control completo

Desmantelar la red`N`个 segmentos── adelante 期间, sólo guardar cada segmento de *input*── cuando hacia atrás 需要中间量时, volver a ejecutar el pase hacia adelante de ese segmento para que los materialice, y luego volver a solicitar la dirección──

Ejemplo: Transformer de 32 capas 拆分32 个段, cada segmento 1 层──

- Memoria:32 个 capas de entrada ((小) en comparación con 32 *( cada nivel de volumen de activación)
- 额外计算: cada segmento 额外 1 次 前进,也就是总前进FLOPs 约增加33%(因为后退是前进的2x,完整步骤从1 + 2 = 3个单位变为1 + 1 + 2 = 4个单位) 

Este fue el primer programa de Chen et al. 2016:`sqrt(L)`层放一个检查点,以平衡记忆和计算――对于L=64,就是8检查点――

### Control selectivo (Korthikanti 2022)

No todos los costos de valor activado son iguales.`B*L*L*heads`,并随序列长度 *二次* 增长──FFN activación oculta 是 `B*L*4d`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,

El punto de control selectivo conservará un bajo costo de almacenamiento de la activación de las proyecciones lineales, sólo volverá a calcular el costoso porción de la atención.

Megatron-Core se implementará para la recomputada de activación selectiva. La mayoría de las carreras de entrenamiento fronterizo de 2024+ están en uso.

### Descarga

重新计算的替代方案:在前进和后退之间 把激活值传到CPU RAM──它需要PCIe带宽;当空带宽的收益高于重复化 成本时很有用──混合策略很常见: algunas capas de control, otras de descarga──

FSDP2 se descargará  como una opción de primer tipo. Cuando la GPU recibe memoria  limitada, pero la transferencia de CPU-GPU todavía tiene un volumen de tiempo, el rendimiento de descarga es muy bueno.

### Modelo de costes de recomputo

Cada uno`k`Un punto de control de nivel, una vez, en total.`L`层时,朴素检查点的每步FLOPs:

```
flops_fwd_normal = L * f_layer
flops_bwd_normal = 2 * L * f_layer
flops_total_normal = 3 * L * f_layer

flops_fwd_ckpt = L * f_layer
flops_recompute = L * f_layer  # one extra forward per layer in the segment
flops_bwd_ckpt = 2 * L * f_layer
flops_total_ckpt = 4 * L * f_layer
overhead = 4 / 3 - 1 = 0.33 = 33%
```

Usando el punto de control selectivo, sólo recalcula el núcleo de atención, en lugar de toda la capa:

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### Modelo de ahorro de memoria

Volumen de activación de cada nivel:`A`  `L`层, memoria de activación total:`L * A`¿Qué es eso?

Punto de control completo (segmento tamaño 1): sólo conservar `L * input_volume`(Para el transformador estándar 约为 `L * 1/10 A`◊ 节省约 `9 * L * A * 1/10`¿Qué es eso?

Cada uno`k`层 checkpoint 一次:保存 `L/k * A`, re-agregación del segmento activo`k-1`La cantidad de la capa.

Cuando`k = sqrt(L)`时, memoria y recomputo de costos por`sqrt(L)`缩放, esto es el mejor peso de las capas de costo uniforme.

### ¿Cuándo no hay un punto de control?

- En la fase de la tubería, las capas más internas de la nave están ya en vuelo.
- Si las primeras y últimas capas dominaron el cálculo de esta etapa, entonces no hay puntos de control.
- 已使用 FlashAttention的注意内核:Flash 已会快速重新计算软max, por lo tanto, el control de nivel de capa adicional 叠加收益很小──

### Modelos de aplicación

1. **Function wrapper：**¿ Qué ?`torch.utils.checkpoint.checkpoint(fn, input)`Envuelve un segmento.`input`, en retroceso , volver a calcular todo lo demás contenido .

2. **Decorator-based：**Se marcarán las capas como puntos de control; el entrenador decidirá en el tiempo de configuración qué segmentos serán envasados.

3. **Manual explicit recompute：**Yo mismo编写后退通,调用自定义的 `recompute_forward`, usando la entrada de conservación copiar hacia adelante 

Los envueltos son el estándar habitual de uso.

### Interacción con el TP / PP / FP8

- **Tensor parallel：**Los datos de entrada de los puntos de control en la recomputada deben ser recogidos o rescatados; necesitan procesar los costes de comunicación.
- **Pipeline parallel：**典型模式是检查点 每个管道阶段的前进,使反顺序微洗可以重复使用激活内存──
- **FP8 recompute：**Recomputar  Durante actualizar las historias de amax  deben coincidir con el original , de lo contrario la escala FP8 会漂移── la mayoría de los marcos 会 snapshot scale──


```figure
activation-recompute
```

## Construirlo

### 步骤 1: Model de juguete de los segmentos

```python
import numpy as np


def linear_forward(x, w, b):
    return x @ w + b


def relu(x):
    return np.maximum(x, 0)


def layer_forward(x, w1, b1, w2, b2):
    h = relu(linear_forward(x, w1, b1))
    return linear_forward(h, w2, b2)


def model_forward(x, params):
    activations = [x]
    h = x
    for w1, b1, w2, b2 in params:
        h = layer_forward(h, w1, b1, w2, b2)
        activations.append(h)
    return h, activations
```

### Paso 2: Necesita todas las activaciones de la simple retroceso

```python
def model_backward(grad_output, activations, params):
    grads = [None] * len(params)
    g = grad_output
    for i in range(len(params) - 1, -1, -1):
        w1, b1, w2, b2 = params[i]
        x_in = activations[i]
        h_pre = linear_forward(x_in, w1, b1)
        h = relu(h_pre)
        gh = g @ w2.T
        gw2 = h.T @ g
        gb2 = g.sum(axis=0)
        g_pre = gh * (h_pre > 0)
        gx = g_pre @ w1.T
        gw1 = x_in.T @ g_pre
        gb1 = g_pre.sum(axis=0)
        grads[i] = (gw1, gb1, gw2, gb2)
        g = gx
    return g, grads
```

### Paso 3:Punto de control-Todos los k Memoria

```python
def model_forward_checkpointed(x, params, k=4):
    saved_inputs = [x]
    h = x
    for i, (w1, b1, w2, b2) in enumerate(params):
        h = layer_forward(h, w1, b1, w2, b2)
        if (i + 1) % k == 0:
            saved_inputs.append(h)
    return h, saved_inputs


def model_backward_checkpointed(grad_output, saved_inputs, params, k=4):
    grads = [None] * len(params)
    g = grad_output
    segments = [(j * k, min((j + 1) * k, len(params))) for j in range(len(saved_inputs))]
    for seg_idx in range(len(saved_inputs) - 1, -1, -1):
        start, end = segments[seg_idx]
        if start >= end:
            continue
        x_in = saved_inputs[seg_idx]
        _, seg_acts = model_forward(x_in, params[start:end])
        g, seg_grads = model_backward(g, seg_acts, params[start:end])
        for j, gr in enumerate(seg_grads):
            grads[start + j] = gr
    return g, grads
```

### 步骤 4:Modelo de costo

```python
def checkpoint_cost(n_layers, segment_size, flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }


def selective_checkpoint_cost(n_layers, attention_fraction=0.15,
                              flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * attention_fraction * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }
```

### 步骤 5: Estimador de memoria

```python
def activation_memory_mb(n_layers, hidden=8192, seq=8192,
                        batch=1, bytes_per_value=2):
    per_layer = 12 * batch * seq * hidden * bytes_per_value
    return n_layers * per_layer / 1e6


def memory_after_checkpoint(n_layers, segment_size, hidden=8192,
                           seq=8192, batch=1, bytes_per_value=2):
    n_seg = max(1, n_layers // segment_size)
    saved = (n_seg + segment_size) * 1 * batch * seq * hidden * bytes_per_value
    return saved / 1e6
```

### Paso 6: Tamaño óptimo del segmento

```python
def optimal_segment(n_layers):
    return int(round(np.sqrt(n_layers)))
```

### 步骤 7:Decisión selectiva de los puntos de control

```python
def should_recompute(layer_type, activation_bytes, recompute_flops_ratio):
    if layer_type == "attention" and activation_bytes > 100 * 1e6:
        return True
    if layer_type == "ffn" and activation_bytes > 500 * 1e6:
        return recompute_flops_ratio < 0.1
    return False
```

## Usalo

- **torch.utils.checkpoint**¿Qué es esto ?`from torch.utils.checkpoint import checkpoint`,PyTorch 中的规范包装──它包裹一个函数; sólo guardar la entrada, y volver a calcular 时后.
- **Megatron-Core activation recomputation**: apoyo `selective`¿Qué es esto?`full`Y `block`• modalidades de formación fronteriza de 2024+
- **FSDP2 offload**:FSDP2 中中 `module.to_empty(device="cpu")`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `offload_policy`, pondrá las activaciones en fragmentos a la CPU, en lugar de volver a calcular.
- **DeepSpeed ZeRO-Offload**Para optimizar estados y activaciones de descarga de CPU, con control de puntos de control 互补──

##  entregarlo

本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/prompt-activation-recompute-policy.md`, es un prompt: recibe tu configuración de modelo (lajeres, ocultos, secuencias, lotes) y memoria de GPU disponible,并输出逐层重计算政策 (no / selectiva / completa / descarga) 👇

##  ejercicios

1. 验证正确性──运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `model_forward`¿ Qué es eso ?`model_backward`(Activaciones completas)`model_forward_checkpointed`¿ Qué es eso ?`model_backward_checkpointed`(segmentos)  Los gradientes de parámetros ▌deben estar en la precisión de la máquina 

2. 扫描 tamaño del segmento `k`, de 1 a`L`◊ dibujar FLOP sobrehead 和 memoria── encontrar la curva de la curva──

3. 实现 selectivo control: conservar la entrada de módulo de atención, pero no conservar entre la cantidad── para el modelo de 32 capas de seq=8192, la medida en relación con la sobrecarga de control de la capa completa──

4. 添加脱载──把段输入 保存到一个模拟的 CPU buffer((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((

5. Un verdadero transformador PyTorch,分別使用和不使用 `torch.utils.checkpoint`◊ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ `torch.cuda.max_memory_allocated`) y el tiempo de paso.

## 关键术语: "El hombre es un hombre"
| Term | 人们通常怎么说 | 它实际意味着什么 |
|------|----------------|----------------------|
| Gradient checkpointing | “通过重做 forward 节省 memory” | 只存储 segment inputs；在 backward 期间重新计算中间量，以获得支持 Gradient 的 tensors |
| Activation recomputation | “和 checkpointing 一样” | 同一技术在 HPC 语境下的名称 |
| Segment size (k) | “每个 checkpoint 包含多少层” | 其中间量被丢弃并一起 rematerialized 的层数 |
| Selective checkpointing | “Korthikanti 的技巧” | 只重新计算存储成本高的激活值（attention softmax）；保留低成本的部分 |
| Full checkpointing | “朴素版本” | 在每个 segment 中重新计算每层的中间量 |
| Block checkpointing | “Coarse-grained” | Checkpoint 整个 transformer blocks；粒度最大 |
| FLOP overhead | “compute 税” | 每 step 额外 FLOPs = (recompute FLOPs) / (fwd + bwd FLOPs)；朴素方案 33%，selective 方案 5% |
| Activation offload | “传到 CPU” | 在 forward->backward 之间把 activations 移到 CPU RAM；是 recompute 的替代方案 |
| sqrt-L rule | “经典最优解” | 对于 uniform-cost layers，最优 checkpoint spacing 是 sqrt(L) 层 |
| Attention-softmax volume | “O(L^2) 问题” | L^2 * heads * batch 个浮点数；在长 context 下主导 activation memory |

## 延伸阅读
- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174)-- inicialmente formalizado control de gradientes
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198)-- recomputo selectivo de activación y análisis de costes formalizados
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645)--                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840)-- escala abajo de la activación descarga
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html)-- 标准 API
- [Megatron-Core activation recomputation documentation](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/memory_optimizations.html)-- modos selectivos, completos y de bloqueo
