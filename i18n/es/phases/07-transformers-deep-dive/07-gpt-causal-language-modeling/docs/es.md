# GPT  Modelado del lenguaje causal

> BERT 能看到两侧──GPT 只有能看到过去──triángulo máscara es la más profunda influencia en la IA moderna en una línea de código──

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 02 (autoatención), Fase 7 · 05 (transformador completo), Fase 7 · 06 (BERT)
**Time:** ~75 分钟

##  problemas

Modelo de lenguaje 回答一个问题:给定前 `t-1`个 token, token `t`Con este entrenamiento de señal, es decir, la predicción de los siguientes tokens, obtendrás un modelo que puede generar un token una vez, generar cualquier texto.

Para realizar un entrenamiento de extremo a extremo en toda la secuencia, es necesario que la predicción de cada posición dependa solo de la posición anterior.

La máscara causal es lo que se hace.`-inf`√ Matriz de los tres primeros esquemas de la matriz, en su forma de "softmax" antes de "add to attention scores" (a partir de "softmax"), después de "softmax" estas posiciones se convierten en 0 (a partir de "softmax"), cada posición sólo puede asistir a su propia posición y a su posición anterior (a partir de "sólo") √.

GPT-1 (2018), GPT-2 (2019), GPT-3 (2020), GPT-4 (2023), GPT-5 (2024), Claude, Llama, Qwen, Mistral, DeepSeek, Kimi   son transformadores causales solo para decodificadores, el ciclo central es el mismo.

## 概念

![Causal mask creates a triangular attention matrix](../assets/causal-attention.svg)

### máscara

给定长度为 `N`de secuencia, construir una `N × N`matriz:

```
M[i, j] = 0       if j <= i
M[i, j] = -inf    if j > i
```

En la máxima, antes de que se haga.`M`Además de los puntajes de atención originales.`exp(-inf) = 0`, por lo que el peso de la contribución de la posición de la máscara es de cero. Cada línea de la matriz de atención es sólo una distribución de probabilidades de la posición anterior.

实现成本: una vez `torch.tril()`调用──计算时间:纳秒级── sobre el impacto de todo el ámbito:一切──

### No se ha entrenado, no se ha hecho ninguna recomendación.

Entrenamiento: para todo`(N, d_model)`Secuencia hacer una vez a paso adelante, calcular N 个 pérdidas de entropía cruzada( cada posición una),求和,backprop。 a lo largo de la secuencia并行──这是GPT 训练能够扩展的原因:你可以在一次GPU pase中处理批中的1M代币──

推理: Tú por token 生成──输入 `[t1, t2, t3]`, lo conseguí`t4` Entrar`[t1, t2, t3, t4]`, lo conseguí`t5` Entrar`[t1, t2, t3, t4, t5]`, lo conseguí`t6` Cache de KV (Lección 12) 保存`t1…tn`Los estados ocultos, así que no es necesario volver a calcularlos en cada paso. Pero la profundidad de la cadena de cálculo es la longitud de la producción.

### pérdida  cambio por uno

给定 tokens `[t1, t2, t3, t4]`¿Qué es esto ?

- Entrada: `[t1, t2, t3]`
- Objetivos: `[t2, t3, t4]`

Para cada posición`i`, calcular `-log P(target_i | inputs[:i+1])`△求和── ése es la entropía cruzada de toda la secuencia─

Todos los transformadores LM que han oído hablar de ellos han usado esta pérdida  entrenamiento  Pre-entrenamiento fine-tuning  SFT  pérdida                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

### Estrategias de decodificación

Después de entrenar, la selección de muestras es más importante que lo que la gente imagina.

| Method | What it does | When to use |
|--------|--------------|-------------|
| Greedy | 每一步取 Argmax | 确定性任务、code completion |
| Temperature | 将 logits 除以 T，然后 sample | 创造性任务，T 越高多样性越强 |
| Top-k | 只从 top-k tokens 中 sample | 消除低概率长尾 |
| Top-p (nucleus) | 从累计概率 ≥ p 的最小集合中 sample | 2020+ 默认选择；会适应分布形状 |
| Min-p | 保留 `p > min_p * max_p` 的 tokens | 2024+；比 top-p 更擅长拒绝长尾 |
| Speculative decoding | draft model 提出 N 个 tokens，big model 验证 | 在质量相同的情况下减少 2–3× 延迟 |

En 2026 años, para modelos de peso abierto, min-p + temperatura 0,7 es un valor de la definición razonable. La descodificación especulativa es la configuración básica de cualquier producción de la pila de inferencias.

### 让 GPT receta  起作用的因素

1. **Decoder-only.**没有 codificador 开销──每层一次注意 + FFN pase──
2. **Scaling.**124M → 1.5B → 175B → billones。 Leyes de escalación de Chinchilla(Lección 13) dice cómo distribuir la computación。
3. **In-context learning.**Aproximadamente en 6B13B 时涌现――模型无需细调就能跟随几个拍摄的例子――
4. **RLHF.**基于人类偏好后培训 把原始预训文模型转化为聊天助手──
5. **Pre-norm + RoPE + SwiGLU.**支大规模稳定训练──

Desde el GPT-2, la estructura central no ha cambiado mucho. Los cambios realmente interesantes se producen en la escala y el nivel de datos.


```figure
causal-mask
```


```figure
mask-derivation
```

## Construirlo

### Paso 1: Máscara causal

¿ Qué ?`code/main.py`一行代码:

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

En softmax antes de ponerlo en las puntuaciones de atención arriba...

### Paso 2: Un modelo de GPT de 2 capas

堆叠两个 bloque de decodificación(mascarada autoatención + FFN, sin atención cruzada)。 Añadir embedding token、positional encoding 和 unembedding(con matriz embedding token 绑定, esto es desde GPT-2 以来来的标准技巧)。

### Paso 3: la predicción de la próxima señal, de un lado a otro

En una palabra de juguete de 20 tokens, en cada posición se producen logitos.

### 步骤 4: muestreo

实现 avaricia, temperatura, top-k, top-p, min-p, en el momento fijo, 上运行每种并比较输出, una función de muestreo sólo necesita 10 行,

## Usalo

PyTorch, 2026 Idioma:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")
tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")

prompt = "Attention is all you need because"
inputs = tok(prompt, return_tensors="pt")
out = model.generate(
    **inputs,
    max_new_tokens=64,
    temperature=0.7,
    top_p=0.9,
    do_sample=True,
)
print(tok.decode(out[0]))
```

En el fondo,`generate()`运行前传,取出最后位置 logits,sample 下一个代币,追加它,然后重复──每个生产级LLM inference stack(vLLM, TensorRT-LLM, llama.cpp, Ollama, MLX)都用重度优化实现同一个循环 批批前填连续批发、KV缓存页面、猜测解码──

**GPT vs BERT，各用一句话：**GPT 预测 `P(x_t | x_{<t})`│BERT 预测 │`P(x_masked | x_unmasked)`◊ pérdida decide si el modelo puede generarse

##  entregarlo

¿ Qué ?`outputs/skill-sampling-tuner.md`◊ Esta habilidad se utilizará para la nueva generación de tareas  seleccionar parámetros de muestreo y requerir decodificación determinista  marcados 

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`,verification softmax 后的因果注意矩阵是下三角的──抽查:第3 行应该只在第03 列有权重──
2. **Medium.**¿Cómo lograr la amplitud de búsqueda de 4 rayos? En 10 preguntas cortas, comparar la búsqueda de 4 rayos con la perplejidad de la codicia. ¿Será que la búsqueda de 4 rayos es siempre una victoria?
3. **Hard.**实现 descifrado especulativo: utilizar un modelo de 2 capas de tipo pequeño como proyecto, con un modelo de 6 capas como verificador。 medir 100 个长度为 64 的完成 上的墙-clock speedup──确认输出与验证器的贪输出匹配──

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Causal mask | “三角形” | 加到 attention scores 上的上三角 `-inf` matrix，使位置 `i` 只能看到位置 `≤ i`。 |
| Next-token prediction | “loss” | 模型在每个位置上的分布与真实下一个 token 之间的 cross-entropy。 |
| Autoregressive | “一次生成一个” | 将输出反馈为输入；并行性只存在于训练阶段，不存在于生成阶段。 |
| Logits | “pre-softmax scores” | softmax 之前 LM head 的原始输出；sampling 就发生在这些值上。 |
| Temperature | “创造力旋钮” | 将 logits 除以 T；T→0 = greedy，T→∞ = uniform。 |
| Top-p | “Nucleus sampling” | 将分布截断为累计和 ≥p 的最小集合；从剩余部分 sample。 |
| Min-p | “比 top-p 更好” | 保留满足 `p ≥ min_p × max_p` 的 tokens；会根据分布尖锐程度调整 cutoff。 |
| Speculative decoding | “draft + verify” | 便宜模型提出 N 个 tokens；大模型并行验证。 |
| Teacher forcing | “训练技巧” | 训练时输入真实的前一个 token，而不是模型的预测。每个 seq2seq LM 的标准做法。 |

## 延伸阅读

- [Radford et al. (2018). Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) GPT-1。
- [Radford et al. (2019). Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) GPT-2。
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) GPT-3 和 aprendizaje en contexto
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) especificación de decodificación 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) 标准 causal-LM 参考代码──
