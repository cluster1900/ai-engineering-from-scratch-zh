# T5, BART  Modelos de codificación y decodificación

> El codificador es responsable de entender. El decodificador es responsable de generar.

**Type:** Learn
**Languages:** Python
**先修要求:**Fase 7 · 05 (transformador completo), Fase 7 · 06 (BERT), Fase 7 · 07 (GPT)
**Time:** ~45 minutes

##  problemas

GPT-solo decodificador y BERT-solo codificador han hecho un trabajo de aclaración para diferentes objetivos en la arquitectura de 2017 .

- Traducción: Inglés → Francés.
- Resumen: 5.000-Token 文章 → 200-Token 摘要──
- Reconocimiento del habla: 音频 Token → 文本 Token。
- 结构化抽取: 散文 → JSON。

Para estas tareas, el codificador-decodificador es la forma más apropiada de los codificadores. El codificador produce un contenido de producción y de producción.

两篇论文 definió la práctica moderna:

1. **T5**(Raffel et al. 2019). "Transformador de Transferencia de Texto a Texto". va a volver a expresar cada tarea de la PNL como texto-en, texto-fuera.
2. **BART**(Lewis et al. 2019). "Transformador bidireccional y auto-regresista". 去噪 autoencoder:以多种方式破坏输入(shuffle、mask、delete、rotate),让解码重建原始内容──

Hasta 2026, el formato de codificador-decodificador sigue existiendo en la estructura de entrada donde es muy importante:

- Susurro (habla → texto).
- Google's traducción de la tecnología
- Algunos tienen un contexto claro y editar 结构的代码-completation / repair 模型──
- Usado para el razonamiento estructurado  misión de Flan-T5  y sus variaciones.

Sólo el decodificador ha ganado la luz de la luz, pero el decodificador del encodificador no ha desaparecido.

## 概念

![Encoder-decoder with cross-attention](../assets/encoder-decoder.svg)

### El ciclo anterior

```
source tokens ─▶ encoder ─▶ (N_src, d_model)  ──┐
                                                 │
target tokens ─▶ decoder block                   │
                 ├─▶ masked self-attention       │
                 ├─▶ cross-attention ◀───────────┘
                 └─▶ FFN
                ↓
              next-token logits
```

El clave es que el codificador para cada entrada sólo se ejecuta una vez. El decodificador se ejecuta de manera autoregresista, pero cada paso se cruza hasta el mismo codificador.

### T5 预训练  Corrupción de la duración

随机选择输入中的 span(平均长度 3 个 Token,总计 15%) ―― con el único sentinel 替换每一个跨度:`<extra_id_0>`¿Qué es esto?`<extra_id_1>`El decodificador sólo saque el tiempo de destrucción, y lleva el sentinela de respuesta.

```
source: The quick <extra_id_0> fox jumps <extra_id_1> dog
target: <extra_id_0> brown <extra_id_1> over the lazy
```

En comparación con el pronóstico de toda la serie, es una señal más económica. En la ablación de los artículos T5, tiene competencia con el MLM (BERT) y el prefijo-LM (UniLM).

### BART 预训练  Denociación de múltiples ruidos

BART 尝试了五种噪音功能:

1. Enmascaramiento de tokens.
2. Eliminación de tokens.
3. En el texto se envía una máscara, un decodificador, un contenido de gran longitud.
4. Permutación de oraciones.
5. - La rotación de documentos.

El conjunto de texto de infling + permutación de oraciones produjo el mejor resultado. El decodificador siempre reconstruye el contenido original.

### 推理

La búsqueda de muestras de la parte superior de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de la muestra de

### 2026 años ¿qué tiempo seleccionar los diferentes

| Task | Encoder-decoder? | Why |
|------|------------------|-----|
| Translation | 是，通常如此 | 明确的源序列；固定的输出分布；beam search 有效 |
| Speech-to-text | 是 (Whisper) | 输入 modality 与输出不同；encoder 塑造音频特征 |
| Chat / reasoning | 否，decoder-only | 没有持久的“input”——对话本身就是序列 |
| Code completion | 通常否 | decoder-only 搭配长上下文更强；像 Qwen 2.5 Coder 这样的代码模型是 decoder-only |
| Summarization | 两者皆可 | BART、PEGASUS 超过了早期 decoder-only baseline；现代 decoder-only LLMs 已经能与它们匹配 |
| Structured extraction | 两者皆可 | T5 很干净，因为“text → text”可以吸收任何输出格式 |

Desde alrededor de 2022 la tendencia es: sólo el decodificador se ha tomado el pasado por el decodificador-decodificador 主导的任务, porque (a) las LLM sólo el decodificador-instrucciones sintonizado puede a través de la invitación 泛化到任何任务, (b) una sola estructura es más fácil de expandir en comparación con dos estructuras, (c) RLHF 假设使用 decoder──encoder-decoder 仍然保留在输入模式、 不同的(speechimages) o la búsqueda de haces 质量很景很场──


```figure
encoder-decoder
```

## Construirlo

¿ Qué ?`code/main.py` Nosotros hemos hecho un corpus de juguetes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

### Paso 1: Corrupción de la extensión

```python
def corrupt_spans(tokens, mask_rate=0.15, mean_span=3.0, rng=None):
    """Pick spans summing to ~mask_rate of tokens. Return (corrupted_input, target)."""
    n = len(tokens)
    n_mask = max(1, int(n * mask_rate))
    n_spans = max(1, int(round(n_mask / mean_span)))
    ...
```

objetivo 格式遵循 T5 约定:`<sent0> span0 <sent1> span1 ...` entrada corrupta 会把未改变的代币与跨度位置的哨兵代币 交错排列──

### 步骤 2: verifique el viaje de ida y vuelta

给定腐败输入 和目标,重建原始句子──如果你的腐败是可逆的,那么前进通过就是良定义的──这是一个智力检查真实训练从不这样做,但这个测试成本很低,并且能捕捉到跨度会计管理中的偏差──

### 步骤 3: ruido de BART

五个函数:`token_mask`¿Qué es esto?`token_delete`¿Qué es esto?`text_infill`¿Qué es esto?`sentence_permute`¿Qué es esto?`document_rotate`◊ 组合 de los dos y mostrar resultados

## Usalo

AbrazosFace 参考:

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer
tok = T5Tokenizer.from_pretrained("google/flan-t5-base")
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")

inputs = tok("translate English to French: Attention is all you need.", return_tensors="pt")
out = model.generate(**inputs, max_new_tokens=32)
print(tok.decode(out[0], skip_special_tokens=True))
```

T5 技巧:任务名称进入输入文本──同一个模型可以处理数十种任务,因为每个任务都是文本输入,文本输出──到2026年,这个模式已经被命令调节的单单解码器模型泛化了,但T5 最先将其规范化──

##  entregarlo

¿ Qué ?`outputs/skill-seq2seq-picker.md` Esta habilidad se basará en la estructura 、延迟和质量目标, para hacer una nueva tarea en entre encoder-decoder y decoder-only 

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`, para una corrupción de 30 tokens 句子应用跨度,验证将非哨源代币与解码目标跨度 拼接后可以复现原始句子──
2. **Medium.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `text_infill`ruido: con un solo `<mask>`Token  sustitución de tiempo, decodificador  debe deducir el tiempo correcto  longitud y contenido ∞ mostrar un ejemplo ∞
3. **Hard.**En un muy pequeño inglés porco-latino corpus(200 对) en tono fino `flan-t5-small`△ en el conjunto de 50 pares sostenidos  en la misma data y en la misma computación  en la misma medida`Llama-3.2-1B`Los resultados se compararon.

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder-decoder | “Seq2seq transformer” | 两个 stack：用于输入的 bidirectional encoder，以及带 cross-attention、用于输出的 causal decoder。 |
| Cross-attention | “源内容与目标内容对话的地方” | decoder 的 Q × encoder 的 K/V。这是 encoder 信息进入 decoder 的唯一位置。 |
| Span corruption | “T5 的预训练技巧” | 用 sentinel Token 替换随机 span；decoder 输出这些 span。 |
| Denoising objective | “BART 的游戏” | 对输入应用 noise function，训练 decoder 重建 clean sequence。 |
| Sentinel token | “`<extra_id_N>` 占位符” | 特殊 Token，用于在 source 中标记被破坏的 span，并在 target 中重新标记它们。 |
| Flan | “Instruction-tuned T5” | 在超过 1,800 个任务上 fine-tuned 的 T5；让 encoder-decoder 在 instruction-following 上具备竞争力。 |
| Beam search | “Decoding strategy” | 在每一步保留 top-k 个 partial sequence；是翻译/摘要的标准做法。 |
| Teacher forcing | “Training-time input” | 训练期间，把真实的前一个输出 Token 喂给 decoder，而不是采样出来的 Token。 |

## 延伸阅读

- [Raffel et al. (2019). Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683) T5──
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension](https://arxiv.org/abs/1910.13461)¿Qué es eso?
- [Chung et al. (2022). Scaling Instruction-Finetuned Language Models](https://arxiv.org/abs/2210.11416) Flan-T5──
- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) Susurro,2026 años de codificación y decodificación canónica。
- [HuggingFace `modeling_t5.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/t5/modeling_t5.py) 参考实现。
