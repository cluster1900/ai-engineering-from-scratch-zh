# Atención de varias cabezas

> Una cabeza de atención Una cabeza de aprendizaje Una relación... Ocho cabezas...

**类型：**Construcción
**语言：**Python
**前置知识：**Fase 7 · 02 ((Atención personal desde cero)
**时间：**~ 75 minutos

##  problemas

单个自我注意头 会计算一个注意矩阵―― esta matriz 捕捉一种关系, normalmente es la que puede minimizar la pérdida en el actual entrenamiento de señales―― si en tus datos hay un acuerdo entre sujeto y verbo, co-referencia, discurso a largo plazo y chunking sintáctico, todos ellos se encuentran juntos, un solo cabeza los coloca en una distribución de máxima suave, perdiendo la mitad de la señal―

El documento Vaswani de 2017 dio un modo de revisión:并行运行多个注意功能, cada uno tiene sus propias proyecciones Q、K、V, luego se saca con un puntapié en el suelo.`d_model / n_heads`La capacidad de expresión aumenta.

La atención multi-cabeza es la configuración de todos los transformadores en 2026 y el único debate está en el uso de cuántas cabezas, así como las claves y valores de si se comparten las proyecciones.

## 概念

![Multi-head attention splits, attends, concatenates](../assets/multi-head-attention.svg)

**Split。**取形为 `(N, d_model)`de la `X`△分别 proyección hasta forma`(N, d_model)`De la forma de la que se hace.`(N, n_heads, d_head)`, entre ellos `d_head = d_model / n_heads`❖ Transponer por`(n_heads, N, d_head)`¿Qué es eso?

**并行 Attend。**En cada cabeza en la escala de la atención de producto punto.`(N, d_head)` Estos cabezas funcionan en diferentes espacios de la incorporación, y no se comunican entre sí durante el tiempo de la computación de la atención

**Concatenate 并 project。**¿ Qué hay de nuevo ?`(N, d_model)`, y luego multiplicado en forma`(d_model, d_model)`de matriz de salida aprendida `W_o`¿Qué es eso?`W_o`Es la cabeza de la cabeza.

**为什么有效。**Cada cabeza puede especializarse, sin necesidad de otros cabezas 争抢表征预算── Estudios de investigación de 20192024 años  muestran diferentes roles de cabezas: cabezas de posición  atende a la cabeza de la ficha anterior  cabezas de copia  cabezas de entidad denominada  cabezas de inducción  constituyen un mecanismo de aprendizaje en contexto .

**2026 年的变体谱系：**

| Variant | Q heads | K/V heads | Used by |
|---------|---------|-----------|---------|
| Multi-head (MHA) | N | N | GPT-2, BERT, T5 |
| Multi-query (MQA) | N | 1 | PaLM, Falcon |
| Grouped-query (GQA) | N | G (e.g. N/8) | Llama 2 70B, Llama 3+, Qwen 2+, Mistral |
| Multi-head latent (MLA) | N | compressed to low-rank | DeepSeek-V2, V3 |

GQA es un programa moderno, ya que puede cumplir.`N/G`La cantidad de veces que se reduce la memoria de caché KV, al mismo tiempo que se mantiene casi completa. MLA más adelante, se reduce K/V en el espacio latente, y luego en el proyecto de cálculo, se consume FLOPs, pero se ahorra más memoria.


```figure
multihead-split
```

## Construirlo

### Paso 1: de nuestra atención de cabeza única ya existente entre cabezas divididas

取 Lección 02 里的 `SelfAttention`, con un par de divididos / concates 包起来.`code/main.py`En el caso de la aplicación de la ley, el contenido de la ley es el siguiente:

```python
def split_heads(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)  # (heads, n, d_head)

def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

Una vez se remodela y una vez se transponen.`nn.MultiheadAttention`Lo que hacer.

### 步骤 2: por cabeza 运行 escalado punto-producto atención

Cada cabeza tiene su propia rebanada de Q、K、V──Attención  se convierte en matmul en lote:

```python
def mha_forward(X, W_q, W_k, W_v, W_o, n_heads):
    Q = X @ W_q
    K = X @ W_k
    V = X @ W_v
    Qh = split_heads(Q, n_heads)         # (heads, n, d_head)
    Kh = split_heads(K, n_heads)
    Vh = split_heads(V, n_heads)
    scores = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(Qh.shape[-1])
    weights = softmax(scores, axis=-1)
    out = weights @ Vh                    # (heads, n, d_head)
    concat = combine_heads(out)
    return concat @ W_o, weights
```

En el hardware real,`Qh @ Kh.transpose(...)`Sí , uno .`bmm`◊GPU 看到的是形状为 `(heads, N, d_head) × (heads, d_head, N) -> (heads, N, N)`De un solo parche de matmul·· aumentando las cabezas 很便宜

### 步骤 3:Atención de la pregunta agrupada 变体

只有关键和价值预测 会改变──Q 获得 `n_heads`个 grupos; K 和 V 获得 `n_kv_heads < n_heads`个 grupos,并被重复以匹配:

```python
def gqa_project(X, W, n_kv_heads, n_heads):
    kv = split_heads(X @ W, n_kv_heads)       # (kv_heads, n, d_head)
    repeat = n_heads // n_kv_heads
    return np.repeat(kv, repeat, axis=0)      # (n_heads, n, d_head)
```

En la inferencia, esto ahorrará memoria, porque el caché KV sólo se guarda.`n_kv_heads`份副本, en lugar de `n_heads`份──Llama 3 70B Utiliza 64 cabezas de consulta y 8 cabezas de KV, es decir, 8× de caché 缩减──

### Paso 4: Prueba cada cabeza Aprende lo que

En una frase corta, con 4 cabezas, se ejecuta MHA.`(N, N)`Matriz de atención. Verás diferentes cabezas incluso en inicialización aleatoria.

## Usalo

En PyTorch en, una versión:

```python
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=512, num_heads=8, batch_first=True)
```

GQA de PyTorch 2.5+

```python
from torch.nn.functional import scaled_dot_product_attention

# scaled_dot_product_attention auto-dispatches Flash Attention on CUDA.
# For GQA, pass Q of shape (B, n_heads, N, d_head) and K,V of shape
# (B, n_kv_heads, N, d_head). PyTorch handles the repeat.
out = scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)
```

**多少个 heads？**Reglas de experiencia de los modelos de producción de 2026:

| Model size | d_model | n_heads | d_head |
|------------|---------|---------|--------|
| Small (~125M) | 768 | 12 | 64 |
| Base (~350M) | 1024 | 16 | 64 |
| Large (~1B) | 2048 | 16 | 128 |
| Frontier (~70B) | 8192 | 64 | 128 |

`d_head`几乎总是落在64或128. 它是一个头能看到多少内容的单位──低于32.头就会开始和扩展因素`sqrt(d_head)`Más de 256, perderás los beneficios de muchos pequeños especialistas.

##  entregarlo

¿ Qué ?`outputs/skill-mha-configurator.md`◊ esta habilidad se basará en el presupuesto de parámetros ◊ longitud de secuencia y objetivo de despliegue, para un nuevo Transformer  recomendación de cabeza ◊ cuento de cabeza kV y estrategia de proyección ◊

##  ejercicios

1. **简单。**取 `code/main.py`En el centro de MHA, en el fijo `d_model=64`En el caso de`n_heads`Desde 1 hasta 16... en la tarea de copia sintética... para dibujar un pequeño modelo de una capa... ¿Hay más cabezas que ayuden o que son perjudiciales?
2. **中等。**实现 MQA(Todos los cabezas de consulta 共享一个 KV cabeza)。 medir el número de parámetros 相比全 MHA下降了多少──计算推论 时 N=2048 下 KV-cache size 缩小了多少──
3. **困难。**实现 una pequeña 版本 de Multi-head Latent Attention:把 K,V 压缩到级-`r`latente, la cache de KV latente, en el tiempo de atención`r`¿Cuánto tiempo, la memoria de caché se reducirá a 1/8 de la MHA completa, mientras que la calidad sigue en el 1 bit de validación de la gente desde?

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Head | “一个单独的 attention circuit” | 一个维度为 `d_head = d_model / n_heads` 的 Q/K/V projection，拥有自己的 attention matrix。 |
| d_head | “Head dimension” | Per-head hidden width；在 production 中几乎总是 64 或 128。 |
| Split / combine | “Reshape tricks” | Attention 前后的 `(N, d_model) ↔ (n_heads, N, d_head)` reshape+transpose。 |
| W_o | “Output projection” | Concatenating heads 之后应用的 `(d_model, d_model)` matrix；heads 在这里混合。 |
| MQA | “One KV head” | Multi-Query Attention：单个共享 K/V projection。KV cache 最小，但有一些质量损失。 |
| GQA | “The default since Llama 2” | `n_kv_heads < n_heads` 的 Grouped-Query Attention；通过重复来匹配 Q。 |
| MLA | “DeepSeek 的技巧” | Multi-head Latent Attention：K,V 被压缩到 low-rank latent，并在 attend time 解压。 |
| Induction head | “in-context learning 背后的 circuit” | 一对 heads，检测之前的出现位置，并复制其后跟随的内容。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need §3.2.2](https://arxiv.org/abs/1706.03762) Origins de la cabeza múltiple 规范。
- [Shazeer (2019). Fast Transformer Decoding: One Write-Head is All You Need](https://arxiv.org/abs/1911.02150) MQA 论文。
- [Ainslie et al. (2023). GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245) 如何在训练后把 MHA 转换为 GQA──
- [DeepSeek-AI (2024). DeepSeek-V2 Technical Report](https://arxiv.org/abs/2405.04434) MLA, así como por qué está en memoria caché  优于MHA/GQA──
- [Olsson et al. (2022). In-context Learning and Induction Heads](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html) Desde un punto de vista mecánico, observar las cabezas 实际做了什么──
