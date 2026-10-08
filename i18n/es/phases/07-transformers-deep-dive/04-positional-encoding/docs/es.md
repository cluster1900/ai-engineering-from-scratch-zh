# Encriptación de posición  Sinusoidal, RoPE, ALiBi

> Atención a la clasificación no sensible. 时, El gato se sentó en la alfombra y  el gato en la alfombra producirá el mismo output.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**Time:** ~45 分钟

## El problema

Escalado punto-producto atención a la secuencia no sensible.`softmax(Q K^T / √d) V`Por parejas de similitudes 计算得到──打乱 `X`De la misma manera se perturban las líneas de salida y salida.

Este modelo de bolsas de palabras no es un error... pero para el lenguaje, código, audio, video, así como cualquier orden que lleve un significado, es mortal.

El método de modificación es de alguna manera introducir la posición en los embebidos.

1. **Absolute sinusoidal**(Vaswani 2017)。将 posición de `sin/cos`Adición a la incorporación 上──简单、 no necesita aprender parámetros, pero para la extrapolación fuera de la duración del entrenamiento 很差──
2. **RoPE — Rotary Position Embeddings**(Su 2021) ・ según la posición 成比例的角度旋转 Q 和 K向量──直接在点产品中编码 *relativo* posición──2026年的主流选择──
3. **ALiBi — Attention with Linear Biases**(Presiones 2022)。 completamente saltó incrustaciones; según la distancia 给注意分加上 per-head linear penalty。长度抽插 极佳。

截至2026年, casi todos los modelos fronterizos abiertos usan RoPE:Llama 2/3/4、Qwen 2/3、Mistral、Mixtral、DeepSeek-V3、Kimi。 pocos modelos de largo contexto usan ALiBi o sus modernos varia­os。

## El concepto

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### Sinusoidal absoluto

预先计算一个形 为 `(max_len, d_model)`Matrix fija `PE`¿Qué es esto ?

```
PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
```

Entonces en atención  antes de ejecutar `X' = X + PE[:N]`◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ◊ cada dimensión ∞`max_len`后会失败: Cuando el modelo sólo vio posiciones 02047 时, nada le dice qué pasará en posición 2048 

### RoPE

旋转 Q 和 K vectores(no son embeddings)`(2i, 2i+1)`¿Qué es esto ?

```
[q'_2i    ]   [ cos(pos·θ_i)  -sin(pos·θ_i) ] [q_2i   ]
[q'_2i+1  ] = [ sin(pos·θ_i)   cos(pos·θ_i) ] [q_2i+1 ]

θ_i = base^(-2i / d_head),  base = 10000 by default
```

Para la posición`pos_k`Las claves  aplicación del mismo rotación―producto punto `q'_m · k'_n`Me convertiría en dependiente.`(m - n)`La función es:**attention score 只依赖 relative distance**, aunque el giro es por posiciones absolutas   漂亮的技巧

扩展 RoPE: se puede acortar `base`(NTK-consciente、YaRN、LongRoPE), para extrapolar en un contexto de no reentrenamiento hasta un contexto más largo―Llama 3 es el método utilizado para extenderse desde el contexto de 8K hasta 128K―

### El mismo

跳过嵌入 技巧──直接给注意分加偏见:

```
attn_score[i, j] = (q_i · k_j) / √d  -  m_h · |i - j|
```

Entre ellos `m_h`Es una pendiente específica de la cabeza, por ejemplo.`1 / 2^(8·h/H)`Los tokens de proximidad se incrementan; los tokens de proximidad se ven penalizados.

### 2026 año que elegir qué

| Variant | Extrapolation | Training cost | Used by |
|---------|---------------|---------------|---------|
| Absolute sinusoidal | 差 | 免费 | original transformer, early BERT |
| Learned absolute | 无 | 很小 | GPT-2, GPT-3 |
| RoPE | 配合 scaling 时很好 | 免费 | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | 极佳 | fine-tune stage | Qwen2-1M, Llama 3.1 128K |
| ALiBi | 极佳 | 免费 | BLOOM, MPT, Baichuan |

RoPE 胜出, es porque puede insertar directamente la atención y no cambia la arquitectura, puede codificar la posición relativa, y de su `base`El hiperparámetro para el ajuste del contexto largo proporciona una claridad de la rotura.


```figure
rope-explorer
```

## Construye el mismo

### Paso 1: codificación sinusoidal

¿ Qué ?`code/main.py`△4 行计算:

```python
def sinusoidal(N, d):
    pe = [[0.0] * d for _ in range(N)]
    for pos in range(N):
        for i in range(d // 2):
            theta = pos / (10000 ** (2 * i / d))
            pe[pos][2 * i]     = math.sin(theta)
            pe[pos][2 * i + 1] = math.cos(theta)
    return pe
```

En la primera capa de atención, antes de que se añade a la matriz de incorporación.

### Paso 2: 应用于 RoPE de Q、K

RoPE 会在 Q 和 K 上原地操作──对对对对对:

```python
def apply_rope(x, pos, base=10000):
    d = len(x)
    out = list(x)
    for i in range(d // 2):
        theta = pos / (base ** (2 * i / d))
        c, s = math.cos(theta), math.sin(theta)
        a, b = x[2 * i], x[2 * i + 1]
        out[2 * i]     = a * c - b * s
        out[2 * i + 1] = a * s + b * c
    return out
```

关键: en posición `m`de Q y posición `n`Los K  aplican la misma función ∙ su producto de puntos ∙                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `cos((m-n)·θ_i)`Porque子──Attención 免费学到 relativa posición──

### Paso 3: Pistas de ALiBi y sesgo

```python
def alibi_bias(n_heads, seq_len):
    # slope_h = 2 ** (-8 * h / n_heads) for h = 1..n_heads
    slopes = [2 ** (-8 * (h + 1) / n_heads) for h in range(n_heads)]
    bias = []
    for m in slopes:
        row = [[-m * abs(i - j) for j in range(seq_len)] for i in range(seq_len)]
        bias.append(row)
    return bias  # add to attention scores before softmax
```

¿ Qué ?`bias[h]`¡ ¡ A la cabeza !`h`de la `(seq_len, seq_len)`Matriz de puntaje de atención 上, luego softmax──

### Paso 4: 验证 Propiedad relativa de distancia de RoPE

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `a, b`✿ primero por `(pos_a, pos_b)`旋转──再按 `(pos_a + k, pos_b + k)`旋转──两个点产品 必须在浮点错误内相等──这个性质就是RoPE的全部意义它对绝对的抵消不变,只关乎相对差距──

## Usalo

PyTorch 2.5+ en`torch.nn.functional`中提供 RoPE utilidades。 la mayoría de la producción utiliza código `flash_attn`O `xformers`,RoPE 会在注意内核内应用.

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**2026 年的 Long-context 技巧：**

- **NTK-aware interpolation。**Desde 4K  expandirse a 16K + 时,将 `base`重新缩放为 `base * (scale_factor)^(d/(d-2))`¿Qué es eso?
- **YaRN。**Más inteligente de la interpolación, puede en contextos largos arriba retener la entropía de la atención.
- **LongRoPE。**Microsoft 2024 年方法, utilizar búsqueda evolutiva para cada dimensión  seleccionar factores de escala―Phi-3-Long 使用它──
- **Position interpolation + fine-tuning。**Sólo hay que ajustarse a la extensión de la posición de reducción, y ajustar los tokens de 15B.

## Envío

¿ Qué ?`outputs/skill-positional-encoding-picker.md`◊ esta habilidad se basará en el contexto objetivo de longitud, necesidades de extrapolación y presupuesto de formación, para un nuevo modelo seleccionar la estrategia de codificación―

## Los ejercicios

1. **Easy。**¿ Qué ?`max_len=512, d=128`de la sinusoidal `PE`Matriz 绘制为热图──确认随着尺寸指数 增大,条纹 变宽的图案──
2. **Medium。**实现 NTK-consciente RoPE escalado── en secuencias de longitud 256 上训练微小LM,然后在长度 1024 上分别测试有规模和无规模的情况──测量困难──
3. **Hard。**En el mismo módulo de atención se realiza ALiBi y RoPE. En las secuencias de longitud 512 se realiza la tarea de copia.

## Términos clave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Positional encoding | “告诉 attention 顺序” | 添加到 embeddings 或 attention 中、用于编码 position 的任意 signal。 |
| Sinusoidal | “最初那个” | 以 geometric frequencies 加到 embeddings 上的 `sin/cos`；不能 extrapolate。 |
| RoPE | “Rotary embeddings” | 按 position-dependent angle 旋转 Q、K；dot product 编码 relative distance。 |
| ALiBi | “Linear bias trick” | 将 `-m·\|i-j\|` 加到 attention scores；不需要 embedding，extrapolation 很强。 |
| base | “RoPE 的旋钮” | RoPE 中的 frequency scaler；增大它可在 inference 时扩展 context。 |
| NTK-aware | “一种 RoPE scaling trick” | 重新缩放 `base`，让 context 扩展时 high-frequency dims 不会被挤压。 |
| YaRN | “高级那个” | 保留 attention entropy 的 per-dimension interpolation+extrapolation。 |
| Extrapolation | “能在训练长度之外工作” | position scheme 能否在训练时见过的 `max_len` 之外给出正确输出？ |

## Leer más

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) 原始 sinusoidal──
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) Papel de RoPE。
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409) ALiBi¬¬
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071) estado de la técnica RoPE escalado。
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) Meta de Llama 2 papel de largo contexto。
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753) Microsoft 方法,被 Phi-3-Long 使用,并使用它部分引用──
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) Implementaciones de producción de los diferentes esquemas de escalado de RoPE (default, lineal, dinámico, YaRN, LongRoPE, Llama-3)
