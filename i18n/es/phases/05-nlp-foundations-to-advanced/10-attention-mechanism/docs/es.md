# Mecanismo de atención  突破

> El decodificador no vuelve a usar un resumen de resumen para identificar, sino que comienza a ver toda la fuente.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 09(Modelos de secuencia a secuencia)
**Time:** ~45 分钟

##  problemas

Lección 09: Con una única escala de fracaso final. Un codificador GRU entrenado en la copia de un juego, la precisión de 5 horas es de 89%, la precisión de 80 horas de duración se acerca a la oportunidad. La razón es estructural, no el entrenamiento de error.

Bahdanau、Cho 和 Bengio en 2014 publicó un 三行修复── no sólo poner el estado final del codificador 给 decoder, sino mantener cada estado de codificador── en cada paso del decodificador, calcular el aumento de los estados de codificador en promedio, de los cuales el peso significa que el decodificador ahora necesita ver el codificador 位置`i`¿Cuánto? Este aumento de potencia es el contexto, y cambia en cada paso del decodificador.

Éste es el concepto completo. Los transformadores lo han ampliado. La autoatención lo aplican a una sola secuencia. La atención multi-cabeza y lo ejecuta. Pero la versión 2014 ya ha roto el botellón.

## 概念

![Bahdanau attention: decoder queries all encoder states](../assets/attention.svg)

En cada paso del decodificador `t`¿Qué es esto ?

1. Usar un decodificador estado oculto`s_{t-1}` como **query**¿Qué es eso?
2. Lo pondrá en estado oculto con cada codificador.`h_1, ..., h_T`打分── cada codificador 位置一个 skalar──
3. Para las puntuaciones hacer suave max, obtener peso de atención`α_{t,1}, ..., α_{t,T}`, y en total son de 1.
4. Vector de contexto `c_t = Σ α_{t,i} * h_i`◊ los estados de codificación ◊
5. Descriptor 接收 `c_t`Además de un token de salida anterior, generar un token siguiente.

Cuando el decodificador necesita poner "Je" 翻译成 "I" 时, it will make "Je" 权重大,其他位置权重小──当 it needs "not" 时, it will make "pass" 权重大──文本向量 在每一步都会重塑──

## Las formas (((más fácilmente morder de los lugares)

Es la primera vez que cada atención se pone en práctica.

| Thing | Shape | Notes |
|-------|-------|-------|
| Encoder hidden states `H` | `(T_enc, d_h)` | 如果是 BiLSTM，`d_h = 2 * d_hidden` |
| Decoder hidden state `s_{t-1}` | `(d_s,)` | 一个 vector |
| Attention score `e_{t,i}` | scalar | 每个 encoder 位置一个 |
| Attention weight `α_{t,i}` | scalar | 对所有 `i` 做 softmax 之后 |
| Context vector `c_t` | `(d_h,)` | 与一个 encoder state 的 shape 相同 |

**Bahdanau（additive）score。** `e_{t,i} = v_α^T * tanh(W_a * s_{t-1} + U_a * h_i)`¿Qué es eso?

- `s_{t-1}`La forma es`(d_s,)`¿ Qué ?`h_i`La forma es`(d_h,)`¿Qué es eso?
- `W_a`La forma es`(d_attn, d_s)`¿Qué es eso?`U_a`La forma es`(d_attn, d_h)`¿Qué es eso?
-                                                                                                                                                                                                                                                               `(d_attn,)`¿Qué es eso?
- `v_α`La forma es`(d_attn,)` con`v_α`Hacer un producto interno se acumulará en una escala.**这就是 `v_α` 的作用。**No es magia. Es la proyección del vector de la atención-dimensión.

**Luong（multiplicative）score。**Tres cambios:

- `dot`¿ Qué es esto ?`e_{t,i} = s_t^T * h_i` Requerimiento`d_s == d_h`Si tu codificador es bidireccional, salta.
- `general`¿ Qué es esto ?`e_{t,i} = s_t^T * W * h_i`, entre ellos `W`La forma es`(d_s, d_h)`❖ Descargar el límite de dimensiones y demás
- `concat`En la actualidad, el uso de Bahdanau es muy poco frecuente, ya que los dos anteriores son más baratos.

**一个值得点名的 Bahdanau / Luong gotcha。**Bahdanau                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `s_{t-1}`(生成当前 word *之前* 的解码状态) ――Long 使用 `s_t`(Géneración* después* del estado) ―― Los mezclar generará muy difícil debug de los gradientes de errores pequeños―, seleccionar un papel, y luego mantener su regimen―.


```figure
attention-heatmap
```

## Construirlo

### 步骤 1: adictivo

```python
import numpy as np


def additive_attention(decoder_state, encoder_states, W_a, U_a, v_a):
    projected_dec = W_a @ decoder_state
    projected_enc = encoder_states @ U_a.T
    combined = np.tanh(projected_enc + projected_dec)
    scores = combined @ v_a
    weights = softmax(scores)
    context = weights @ encoder_states
    return context, weights


def softmax(x):
    x = x - np.max(x)
    e = np.exp(x)
    return e / e.sum()
```

Según el cuadro de arriba, revisar tus formas.`encoder_states`La forma es`(T_enc, d_h)`¿Qué es eso?`projected_enc`La forma es`(T_enc, d_attn)`¿Qué es eso?`projected_dec`La forma es`(d_attn,)`, no se emitirá.`combined`La forma es`(T_enc, d_attn)`¿Qué es eso?`scores`La forma es`(T_enc,)`¿Qué es eso?`weights`La forma es`(T_enc,)`¿Qué es eso?`context`La forma es`(d_h,)`♪ puedo publicar♪

### Paso 2: Luong punto y general

```python
def dot_attention(decoder_state, encoder_states):
    scores = encoder_states @ decoder_state
    weights = softmax(scores)
    return weights @ encoder_states, weights


def general_attention(decoder_state, encoder_states, W):
    projected = W.T @ decoder_state
    scores = encoder_states @ projected
    weights = softmax(scores)
    return weights @ encoder_states, weights
```

Cada uno es de tres líneas. Esta es la razón por la cual el papel de Luong puede existir. La precisión en la mayoría de las tareas es igual, el código es mucho menor.

### Paso 3: Un ejemplo de valores numéricos completos

给定三个 codificador estados ((大致对应 "cat"、"sat"、"mat") así como uno más cercano al primer estado del decodificador, distribución de la atención se concentrará en la posición 0。 Si el estado del decodificador se mueve hasta más cerca del último estado del codificador, la atención se moverá a la posición 2。

```python
H = np.array([
    [1.0, 0.0, 0.2],
    [0.5, 0.5, 0.1],
    [0.1, 0.9, 0.3],
])

s_close_to_cat = np.array([0.9, 0.1, 0.2])
ctx, w = dot_attention(s_close_to_cat, H)
print("weights:", w.round(3))
```

```
weights: [0.464 0.305 0.231]
```

Primer línea gana victoria. Luego, el estado del decodificador se mueve hacia un estado más cercano al tercer estado del codificador. Observa cómo se mueven los pesos.

### Paso 4: ¿Por qué es el puente de los transformadores?

Añade arriba de la lengua en español

- **Query**= estado del decodificador `s_{t-1}`
- **Key**= estados de codificación((we get come to break por objeto)
- **Value**= estados de codificación (en inglés)

En la atención clásica, las claves y los valores son la misma cosa. La autoatención los separará: puedes hacer una consulta de secuencia, y se hace a K y V utilizando diferentes proyecciones aprendidas.

Matemática es la misma. Las formas son las mismas. Desde la atención Bahdanau hasta la atención escalada de los puntos-productos, la enseñanza se mueve principalmente en la notación.

## Usalo

PyTorch y TensorFlow  directamente prestar atención

```python
import torch
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=128, num_heads=8, batch_first=True)
query = torch.randn(2, 5, 128)
key = torch.randn(2, 10, 128)
value = torch.randn(2, 10, 128)

output, weights = mha(query, key, value)
print(output.shape, weights.shape)
```

```
torch.Size([2, 5, 128]) torch.Size([2, 5, 10])
```

Éste es un transformer de la capa de atención. El lote de preguntas tiene 5 posiciones, el lote de clave/valor tiene 10 posiciones, cada uno de ellos son 128-dimensiones, 8 cabezas.`output`Es una nueva consulta con mayor contexto.`weights`Es posible visualizar una matriz de alineación 5x10

### La atención clásica sigue siendo importante

- Teaching: Un solo cabeza, una sola capa, una versión basada en RNN.
- Transformadores 放不下 en el dispositivo secuencia 任务。
- Cualquier documento de 2014-2017 años. No sé qué se ha escrito en Bahdanau, lo leerás.
- El análisis de alineación de la pequeña partícula en MT. Los pesos de atención en bruto incluso en los modelos de transformadores también son una herramienta de interpretabilidad, mientras que leerlos necesita saber qué son.

### atención-peso-como explicación 陷

Los pesos de atención se ven explicables. Son pesos de entre posiciones y para uno; puedes dibujar; el alto valor representa

它们 no se ven así explicable. Jane y Wallace[1][1][1][1][1][1][1][2]) indican que, entre algunas tareas, las distribuciones de atención pueden ser sustituidas, y se pueden sustituir por alternativas arbitrarias, sin cambiar las predicciones del modelo.

##  Publicarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/prompt-attention-shapes.md`¿Qué es esto ?

```markdown
---
name: attention-shapes
description: Debug shape bugs in attention implementations.
phase: 5
lesson: 10
---

给定一个损坏的 attention implementation，你需要识别 shape mismatch。输出：

1. 哪个 matrix 的 shape 错了。命名这个 tensor。
2. 它的 shape 应该是什么，从 (d_s, d_h, d_attn, T_enc, T_dec, batch_size) 推导。
3. 一行修复。Transpose、reshape 或 project。
4. 一个捕获 regressions 的测试。通常是：assert `output.shape == (batch, T_dec, d_h)` and `weights.shape == (batch, T_dec, T_enc)` and `weights.sum(dim=-1) close to 1`。

拒绝建议会静默 broadcast 的修复。被 broadcast 隐藏的 bugs 之后会表现为静默 accuracy degradation，这是最糟糕的一类 attention bug。

对于 Bahdanau 混淆，坚持 decoder input 是 `s_{t-1}`（pre-step state）。对于 Luong，是 `s_t`（post-step state）。对于 dot-product，把 query 和 key 之间的 dimension mismatch 标记为新手最常见错误。
```

##  ejercicios

1. **Easy.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `softmax`masking, make encoder 中的填充令子 获得零注意重量──在包含可变长度序列的批上测试──
2. **Medium.**给luong `general`Forma-添加 atención multi-cabeza`d_h` Desmantelar `n_heads`组, cada cabeza 运行注意,然后连锁──验证单头 情况与你之前的实现一致──
3. **Hard.**En la lección 09 de la lección de juguete copia  tarea en entrenamiento de un codificador-decodificador GRU con Bahdanau atención  dibujar precisión vs longitud de secuencia  con la línea de base de no atención  comparación  Usted debería ver la longitud aumentando cuando la diferencia se expande, esto confirma la atención  eleva la botella 

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Attention | 看东西 | 对 value sequence 做加权平均，weights 由 query-key similarity 计算。 |
| Query, Key, Value | QKV | 三个 projections：Q 发问，K 是要匹配的内容，V 是要返回的内容。 |
| Additive attention | Bahdanau | Feed-forward score: `v^T tanh(W q + U k)`。 |
| Multiplicative attention | Luong dot / general | Score 是 `q^T k` 或 `q^T W k`。更便宜，在大多数任务上 accuracy 相同。 |
| Alignment matrix | 好看的图 | Attention weights 作为 `(T_dec, T_enc)` 网格。读取它可以看到 model attend 到了什么。 |

## 延伸阅读
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) Este artículo 
- [Luong, Pham, Manning (2015). Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025) 三种分分变体 及其比较──
- [Jain and Wallace (2019). Attention is not Explanation](https://arxiv.org/abs/1902.10186)  可解释性注意事项──
- [Dive into Deep Learning — Bahdanau Attention](https://d2l.ai/chapter_attention-mechanisms-and-transformers/bahdanau-attention.html) Uso PyTorch de la utilizabilidad de la marcha a través de la
