# Desde零 construcción Transformer  Capstone  proyecto

> 十三节课──一个模型──不走捷径──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 01 到 13。不要跳过。
**Time:** 约 120 分钟

##  problemas

Ya has leído cada artículo. Ya has logrado la atención, la división de múltiples cabezas, el codificación de posiciones, el codificador y los bloques de decodificación, las pérdidas de BERT y GPT, el cache de MOE, KV, ahora haz que colaboren en una tarea real.

Esta piedra angular: en un modelo de lenguaje de nivel de caracteres  tarea de arriba a arriba entrenar un pequeño transformador solo para decodificadores ⋅ lee Shakespeare ⋅ genera un nuevo Shakespeare ⋅ genera Shakespeare ⋅ es bastante pequeño, puede ser completado en 10 minutos en un ordenador portátil ⋅ también es bastante correcto, tan sólo para cambiar a un conjunto de datos más grande y realizar un entrenamiento de más tiempo, podemos obtener un LM real ⋅

Este es el tutorial de nanoGPT de este curso nanoGPT──no es original  Karpathy 2023 tutorial de nanoGPT es que cada estudiante escribirá al menos una vez una aplicación de referencia──nosotros seguimos su forma, y reorganizamos alrededor del contenido que ya ha hablado este curso──

## 概念

![Transformer-from-scratch block diagram](../assets/capstone.svg)

架构标注如下:

```
input tokens (B, N)
   │
   ▼
token embedding + positional embedding  ◀── Lesson 04 (RoPE option)
   │
   ▼
┌──── block × L ────────────────────┐
│  RMSNorm                          │  ◀── Lesson 05
│  MultiHeadAttention (causal)      │  ◀── Lesson 03 + 07 (causal mask)
│  residual                         │
│  RMSNorm                          │
│  SwiGLU FFN                       │  ◀── Lesson 05
│  residual                         │
└────────────────────────────────── ┘
   │
   ▼
final RMSNorm
   │
   ▼
lm_head (tied to token embedding)
   │
   ▼
logits (B, N, V)
   │
   ▼
shift-by-one cross-entropy            ◀── Lesson 07
```

### ¿Qué es lo que hacemos ?

- `GPTConfig` 统一配置 todos los hiperparámetros de los lugares。
- `MultiHeadAttention` Causal ∼ batch,并带有可选的闪电风格的路径  PyTorch 的`scaled_dot_product_attention`)。
- `SwiGLUFFN` 现代 FFN。
- `Block` pre-norma, con residuos 包裹注意 + FFN。
- `GPT` embebidos, bloques apilados, cabezas de LM, generar,
- Utiliza el ciclo de entrenamiento de recorte de AdamW、cosina LR、gradiente
- Shakespeare en la literatura de los símbolos de nivel de carbón.

### Nosotros no entregamos nada

- RoPE  Lección 04 已从概念上实现──这里为了简单使用学到的位置嵌入式──练习会要求你换成RoPE──
- Cada paso de generación se realiza en el prefijo completo.
- Atención Flash  PyTorch 2.0+ 会在输入匹配时自动发送;我们使用 `F.scaled_dot_product_attention`¿Qué es eso?
- MoE  Cada bloque utiliza un solo FFN── ya has visto MoE en la Lección 11──

### 目标指标

En el portátil Mac M2, un GPT de 4 capas, 4 cabezas, d_model=128 en`tinyshakespeare.txt`上训练 2.000 pasos:

- Perdida de entrenamiento en aproximadamente 6 minutos de aproximadamente 4.2 ) al azar de aproximadamente 1.5 
- 采样输出看起来具有莎士比亚的形态:古风词汇、换行,以及像ROMEO: 这样专名称会出现──
- Perdida de valor (con el 10% final del texto retenido) seguido de cerca de la pérdida de formación; en este tamaño/orgencio, no se ha sobrevalorado.


```figure
n5-block-stack
```

## Construirlo

本课使用 PyTorch──安装 `torch`(construcción de la CPU 即可)`code/main.py`❖ 脚本会处理:

- Si falta es abajo`tinyshakespeare.txt`(或读取本地副本)
- Tokenizaje de car de nivel de byte.
- 90/10 del tren/val dividido
- En el hardware de soporte, utilizar el ciclo de entrenamiento de autocast bf16.
-                                                                                                                                                                                                                                                               

### 步骤 1: datos

```python
text = open("tinyshakespeare.txt").read()
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
encode = lambda s: [stoi[c] for c in s]
decode = lambda xs: "".join(itos[x] for x in xs)
```

65 个唯一字符──极小的词汇库──适合4字节词汇_size──没有 BPE,也没有代币器 麻烦──

### 步骤 2: modelo

参见 `code/main.py`◊ este bloque es la lección 05  pre-norma  RMSNorm  SwiGLU  Causal MHA──4/4/128  Conto de parámetros: aproximadamente 800K──

### Paso 3: ciclo de entrenamiento

随机取一批长度为 256的代币窗口──前面──转变-by-one cross-entropy──后面──AdamW step──Log──重复──

```python
for step in range(max_steps):
    x, y = get_batch("train")
    logits = model(x)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    opt.zero_grad()
```

### Paso 4: muestra

给定一个提示,反复前进, desde top-p logits 中样本,append,然后继续──500 tokens 后停止──

### 步骤 5: leer la salida

2.000 pasos después:

```
ROMEO:
Away and mild will not thy friend, that thou shalt wit:
The chief that well shame and hath been his friends,
...
```

No es Shakespeare, pero tiene la forma de Shakespeare, para unos 800K parámetros y un ordenador portátil, es un éxito claro.

## Usalo

Esta piedra angular es una arquitectura de referencia. Para extenderla a algo realmente útil, hay tres direcciones:

1. **更换 tokenizer。**Uso de BPE (por ejemplo)`tiktoken.get_encoding("cl100k_base")`)―El tamaño de la voz se eleva de 65 a unos 50.000―La capacidad del modelo necesita una ampliación para compensar―
2. **在更大的 corpus 上训练。**Uso `OpenWebText`O `fineweb-edu`(HuggingFace) ―― en un solo张 A100 上用10B tokens 训练一个125M-param GPT 大约需要24小时──
3. **添加 RoPE + KV cache + Flash Attention。**Los siguientes ejercicios te guiarán a completar cada uno de ellos.

Finalmente conseguiremos un GPT de parámetro de 125M, que puede generar flujo en inglés. No es un modelo fronterizo. Pero el mismo código de ruta es más grande.

##  entregarlo

参见 `outputs/skill-transformer-review.md` Esta habilidad se enfocará en la veracidad de la cobertura de las 13 secciones anteriores, examinando una implementación transformadora desde cero.

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Validando el modelo que ha entrenado  Perdida de validación en el último paso  Bajo 2.0  `max_steps`¿De 2000 改 a 5,000  val pérdida ¿se sigue mejorando?
2. **Medium.**Usar RoPE  sustituir las incorporaciones posicionales aprendidas.`MultiHeadAttention`内部对 Q 和 K 应用转转――训练并验证 val loss 至少同样低――
3. **Medium.**En el ciclo de muestreo se realiza el caché KV. Se genera 500 tokens en caso de tener caché y sin caché.
4. **Hard.**给模型 添加第二个头,用来预测下一个加一个代币(MTP  Multi-Token Prediction from DeepSeek-V3)―联合训练―¿¿hay ayuda?
5. **Hard.**Utilice el MoE de 4 expertos  sustituir cada bloque de FFN ⋅ Router + top-2 routing ⋅ en condiciones de parámetros activos de compatibilidad, observe la pérdida de val ⋅ cómo cambia ⋅

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| nanoGPT | “Karpathy 的 tutorial repo” | 最小化的 decoder-only transformer training code，约 300 LOC；canonical reference。 |
| tinyshakespeare | “标准 toy corpus” | 约 1.1 MB 文本；自 2015 年以来几乎每个 character-LM tutorial 都使用它。 |
| Tied embeddings | “共享 input/output matrix” | LM head weight = token embedding matrix 的转置；节省 parameters，并提升质量。 |
| bf16 autocast | “Training precision trick” | 用 bf16 运行 forward/back，在 fp32 中保留 optimizer state；自 2021 年以来成为标准做法。 |
| Gradient clipping | “阻止 spikes” | 将 global grad norm 限制在 1.0；防止 training blowups。 |
| Cosine LR schedule | “2020+ 默认选择” | LR 先线性上升（warmup），然后按 cosine 形状衰减到峰值的 10%。 |
| MFU | “Model FLOP Utilization” | 实际达到的 FLOPs / 理论峰值；2026 年 40% dense、30% MoE 已经很强。 |
| Val loss | “Held-out loss” | 在 model 从未见过的数据上计算 Cross-Entropy；overfit detector。 |

## 延伸阅读

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) 经典的 ejecución anotada.
