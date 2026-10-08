# El transformador completo  Encoder + Decodificador

> La atención es la principal. Todo lo demás. Los residuos, la normalización, la alimentación, la atención cruzada, te permiten ponerla en una gran cantidad de piezas.

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 02 (autoatención), Fase 7 · 03 (atención multi-cabeza), Fase 7 · 04 (codificación de posición)
**Time:** ~75 minutes

##  problemas
单个注意层是特征提取器,不是一个模型――每层一次对语言的容量不够――你需要深度,而如果没有正确管线,深度会失效――

En 2017, Vaswani 论文打包了六个设计决策,把一个注意层变成可堆叠的块――后来的每个变体只编码器 (BERT) 只编码器 (GPT) 只编码器-decoder (T5) 都继承了同一个骨架――到2026年,这些块已经改进了(RMSNorm、SwiGLU、pre-norm、RoPE),但骨架完全相同――

Este curso habla de esta estructura.

## 概念
![Encoder and decoder block internals, wired](../assets/full-transformer.svg)

### 六个组成部分

1. **Embedding + positional signal.**Tokens → Vectores。Posición 通过 RoPE(现代) o sinusoidal(经典)注入。
2. **Self-attention.**Cada posición está envuelta en cada otra posición. En los decodificadores, se enmascara.
3. **Feed-forward network (FFN).**按 posición 作用的两层 MLP:`W_2 · activation(W_1 · x)`◊ la proporción de expansión de la memoria es de 4×♦
4. **Residual connection.** `x + sublayer(x)`Si no lo hace, los gradientes desaparecerán después de unos seis niveles.
5. **Layer normalization.** `LayerNorm`O `RMSNorm`(现代) ・ Estabilizar el flujo residual―
6. **Cross-attention (decoder only).**Las consultas de un decodificador, claves y valores de la salida del codificador.

### Bloqueo de codificación(BERT、T5 codificador 使用)

```
x → LN → MHA(self) → + → LN → FFN → + → out
                     ^              ^
                     |              |
                     └── residual ──┘
```

El codificador es bidireccional. No hay máscaras. Todas las posiciones pueden verse.

### Bloqueo de decodificador ((GPT、T5 decodificador 使用)

```
x → LN → MHA(masked self) → + → LN → MHA(cross to encoder) → + → LN → FFN → + → out
```

El decodificador Cada bloque tiene tres subcapas. En el medio de ese cross-attention es la única ubicación de la información del encodificador 流向 decodificador. En la arquitectura pura de sólo decodificador (GPT), la atención cruzada será omitida, sólo se conservará la autoatención enmascarada + FFN。

### Pre-norma vs post-norma

El tema original:`x + sublayer(LN(x))`- ¿ Qué ?`LN(x + sublayer(x))` Post-norma en 2019 aproximadamente  Si no hay un calentamiento detallado, es muy difícil entrenar en profundidad──Pre-norma  en subcapa * antes* `LN`) es el 2026 años de la opción: Llama, Qwen, GPT-3+, Mistral 都使用它.

### Bloque de modernización de 2026

Vaswani 2017 utiliza es LayerNorm + ReLU。现代 stack 替换了两者──生产级块 实际看起来是这样:

| Component | 2017 | 2026 |
|-----------|------|------|
| Normalization | LayerNorm | RMSNorm |
| FFN activation | ReLU | SwiGLU |
| FFN expansion | 4× | 2.6×（SwiGLU 使用三个 matrices，总参数量匹配） |
| Position | Sinusoidal absolute | RoPE |
| Attention | Full MHA | GQA（或 MLA） |
| Bias terms | Yes | No |

RMSNorm se ha ido perdiendo la media-centradación de LayerNorm (<1 subtracción una vez), ahorro de computación, y desde la experiencia se ve al menos igual de estable.`Swish(W1 x) ⊙ W3 x`) en el ensayo Llama、PaLM 和 Qwen 文中稳定优于 ReLU/GELU FFN,ppl 约提升 0.5 个点──

### Conto de parámetros

 Para una `d_model = d`且 FFN expansión 为 `r`El bloque:

- MHA: `4 · d²`(Proyecciones Q, K, V, O)
- FFN (SwiGLU): `3 · d · (r · d)`¿ Qué es esto ?`3rd²`
- Normas: 可忽略

Cuando`d = 4096, r = 2.6, layers = 32`(大致对应 Llama 3 8B)`32 · (4·4096² + 3·2.6·4096²) ≈ 32 · (16 + 32) M = ~1.5B parameters per layer × 32 ≈ 7B`(Reagreción de los embebidos y cabeza)


 observar un vector  cómo fluye a través de un solo bloque: Atención en la mezcla de información entre la posición, residual, Colocar la señal hacia adelante, FFN hacer cambios, mientras que la norma  dejar el flujo residual  mantener estabilizado.

```figure
transformer-block
```

## Construirlo
### 步骤 1: bloques de construcción

Uso de la lección 03 中的小型 `Matrix`clase(Para la independencia ha copiado hasta este archivo):

- `layer_norm(x, eps=1e-5)` 减去 significa, excepto en el
- `rms_norm(x, eps=1e-6)` Excepto en RMS──不减去 mean──
- `gelu(x)`Y `silu(x) * W3 x`(SwiGLU)
- `ffn_swiglu(x, W1, W2, W3)`¿Qué es eso?
- `encoder_block(x, params)`Y `decoder_block(x, enc_out, params)`¿Qué es eso?

完整电线 见 `code/main.py`¿Qué es eso?

### Paso 2: cable un codificador de 2 capas y un decodificador de 2 capas

Los coloca en una posición de montaje. Los encodadores de salida se transmiten a cada decodificador.

```python
def encode(tokens, params):
    x = embed(tokens, params.emb) + sinusoidal(len(tokens), params.d)
    for block in params.encoder_blocks:
        x = encoder_block(x, block)
    return x

def decode(target_tokens, encoder_out, params):
    x = embed(target_tokens, params.emb) + sinusoidal(len(target_tokens), params.d)
    for block in params.decoder_blocks:
        x = decoder_block(x, encoder_out, block)
    return x
```

### Paso 3: En el ejemplo de juguete 上运行 adelante

输入一个6 token source 和一个5 token target──验证输出形 是 `(5, vocab)`❖ No entrenar本课关注建筑,而不是 pérdida。

### 步骤 4: 换成 RMSNorm + SwiGLU

Utiliza RMSNorm 和 SwiGLU  sustituir LayerNorm 和 ReLU-FFN── confirma las formas  todavía se ajustan── esto es la modernización de 2026 años, sólo necesita una función  sustituir──

## Usalo
Implementaciones de referencia PyTorch/TF:`nn.TransformerEncoderLayer`¿Qué es esto?`nn.TransformerDecoderLayer`Pero la mayoría de los 2026 años de producción se bloquearán por sí mismos, ya que:

- La atención flash es en la atención interna, en lugar de a través de`nn.MultiheadAttention`¿Qué es eso?
- GQA / MLA 不在 stdlib referencia 中──
- RoPE、RMSNorm、SwiGLU no es el PyTorch por defecto.

HF `transformers`Hay claros bloques de referencia, vale la pena leer:`modeling_llama.py`Es un bloque de decodificación canónica de 2026... es de 500 páginas, vale la pena leerlo todo una vez...

**Encoder vs decoder vs encoder-decoder — 什么时候选择：**

| Need | Pick | Example |
|------|------|---------|
| Classification、embeddings、基于文本的 QA | Encoder-only | BERT, DeBERTa, ModernBERT |
| Text generation、chat、code、reasoning | Decoder-only | GPT, Llama, Claude, Qwen |
| Structured input → structured output（translation、summarization） | Encoder-decoder | T5, BART, Whisper |

El decodificador-sólo se logra en las tareas de lenguaje, ya que es más fácil de hacer a escala, y al mismo tiempo procesar la comprensión y generación.

##  entregarlo
¿ Qué ?`outputs/skill-transformer-block-reviewer.md` Esta habilidad se basará en la revisión de la configuración de 2026 de la versión de un nuevo bloque de transformador, y se marcará la falta de parte de la aplicación de la misma.

##  ejercicios
1. **Easy.**统计你的encoder_block 在 `d_model=512, n_heads=8, ffn_expansion=4, swiglu=True`时的参数── 通过实现该块并使用 `sum(p.numel() for p in block.parameters())`验证。
2. **Medium.**Desde la post-norma 切换到 pre-norma──初始化两者, y en entrada aleatoria 量堆叠 12 niveles de la norma de activación 后的激活应会爆炸; pre-norma激活应保持有界──
3. **Hard.**En la tarea de copiar juguete`x`¿Es que el proceso de desarrollo de un código de código de cuatro capas es un proceso de desarrollo de un código de código de cuatro capas?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Block | “一个 transformer layer” | norm + attention + norm + FFN 的 stack，并包在 residual connections 中。 |
| Residual | “Skip connection” | `x + f(x)` output；让 gradients 能够流过 deep stacks。 |
| Pre-norm | “先 normalize，不是之后” | 现代形式：`x + sublayer(LN(x))`。无需 warmup 技巧也能训练得更深。 |
| RMSNorm | “没有 mean 的 LayerNorm” | 除以 RMS；少一个 op，经验稳定性相同。 |
| SwiGLU | “大家都切换过去的 FFN” | `Swish(W1 x) ⊙ W3 x → W2`。在 LM ppl 上优于 ReLU/GELU。 |
| Cross-attention | “decoder 如何看到 encoder” | Q 来自 decoder、K/V 来自 encoder outputs 的 MHA。 |
| FFN expansion | “中间 MLP 有多宽” | hidden-size 与 d_model 的比率，通常为 4（LayerNorm）或 2.6（SwiGLU）。 |
| Bias-free | “去掉 +b 项” | 现代 stacks 在线性层中省略 biases；ppl 略有提升，model 更小。 |

## 延伸阅读
- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) Específico del bloque original
- [Xiong et al. (2020). On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745)¿Por qué la pre-norma en el fondo es superior a la post-norma?
- [Zhang, Sennrich (2019). Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467) Norma RMS
- [Shazeer (2020). GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) SwiGLU 论文──
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) bloque canónico 2026 solo para decodificadores。
