# BERT  Modelado de lenguaje enmascarado

> GPT 预测下一个词――BERT 预测缺失的词――只差一句话,却带来了半十年的各种嵌入式形――

**类型:**Construcción
**语言:**Python
**先修:**Fase 7 · 05 (Transformador completo), Fase 5 · 02 (文本表示)
**时间:**- 45 minutos

##  problemas

En 2018, cada tarea de PNL  análisis emocional  NER、QA、entailment todos se basará en sus propios datos de etiquetado para entrenar su propio modelo. En ese momento todavía no se puede ajustar a la perfección  comprensión  checkpoint. ELMo (2018) demostró que se puede usar embebedimientos contextuales bidireccionales LSTM pre-train; tiene ayuda, pero la capacidad de generalización no es suficiente.

BERT (Devlin et al. 2018) planteó un problema: si tomamos un codificador Transformer, entrenándolo en cada frase de Internet, y forzándolo en función de los dos lados, ¿qué pasaría? Entonces sólo necesitas ajustar a la tarea de Down游 una cabeza.

El resultado es: en 18 个月内, BERT 及其变体 (RoBERTa, ALBERT, ELECTRA) 统治了当时所有NLP leaderboard──到2020年, en la Tierra cada motor de búsqueda、content audit pipeline 和 semántico-search 系统都有一个BERT──

Hasta 2026, el modelo de codificación-sólo sigue siendo una herramienta de clasificación, recuperación y extracción estructurada. Cada uno de ellos tiene una velocidad de funcionamiento de 5×10× más rápida que el decodificador, mientras que sus embebedidos son la estructura de cada moderna pila de recuperación. ModernBERT (Dec 2024) utilizará Flash Attention + RoPE + GeGLU para avanzar la estructura en un contexto de 8K.

## 核心概念 核心概念 核心概念 核心概念

![Masked language modeling: pick tokens, mask them, predict originals](../assets/bert-mlm.svg)

###  訓練信号

¿Qué es eso ?`the quick brown fox jumps over the lazy dog`¿Qué es eso?

随机 máscara 15% 的 Token:

```
input:  the [MASK] brown fox jumps [MASK] the lazy dog
target: the  quick brown fox jumps  over  the lazy dog
```

训练模型在被面具的位置预测原始代币──因为 el codificador es bidireccional, por lo que en posición 1 预测 `[MASK]`时, puede utilizar la posición 2+ `brown fox jumps` Éste es el asunto que no ha hecho el GPT

### Máscara BERT 规则

En el 15% de los Tokens que se usan para la evaluación:

- El 80% se sustituye por`[MASK]`¿Qué es eso?
- El 10% se sustituye por Token de la modalidad.
- El 10% se mantiene en el mismo estado.

¿Por qué no siempre es útil?`[MASK]`¿Por qué ?`[MASK]`En el tiempo de la meditación nunca aparecerá. Si el modelo de entrenamiento está en el 100% de la posición enmascarada esperamos.`[MASK]`, se producirá una distribución de desviación entre el preentrenamiento y el ajuste fino.

### Predección de oración (NSP) y por qué fue eliminada

El primer BERT también entrenó a NSP: dado dos frases A y B, predicción B si sigue en A 后面──RoBERTa (2019) hizo un experimento de descomposición para ello, demostrando que NSP tiene ningún daño── modernos codificadores se saltarán sobre ella──

### 2026 años de cambio:ModernBERT

El artículo ModernBERT de 2024 reedifica el bloque con componentes básicos de 2026:

| Component | Original BERT (2018) | ModernBERT (2024) |
|-----------|----------------------|-------------------|
| Positional | Learned absolute | RoPE |
| Activation | GELU | GeGLU |
| Normalization | LayerNorm | Pre-norm RMSNorm |
| Attention | Full dense | Alternating local (128) + global |
| Context length | 512 | 8192 |
| Tokenizer | WordPiece | BPE |

Además, a diferencia de la pila de 2018, originalmente soporta Flash-Attention. En la longitud de la secuencia de 8K, la velocidad de cálculo es mejor que DeBERTa-v3 快 23×, mientras que GLUE tiene un mejor número de puntos.

### 2026 años todavía seleccionar el codificador de usos

| Task | 为什么 encoder 胜过 decoder |
|------|------------------------------|
| Retrieval / semantic search embeddings | Bidirectional context = 每个 Token 更好的 Embedding 质量 |
| Classification (sentiment, intent, toxicity) | 一次 forward pass；没有生成开销 |
| NER / token labeling | 逐位置输出，天然 bidirectional |
| Zero-shot entailment (NLI) | encoder 顶部的 classifier head |
| Reranker for RAG | Cross-encoder scoring，比 LLM rerankers 快 10x |


```figure
transformer-residual
```

## Construirlo

### Paso 1: Enmascarar la lógica

¿ Qué ?`code/main.py`△ Función `create_mlm_batch`接收一个代币ID 列表、语音大小 和面具概率──返回输入IDs(已应用面具) 和标签(只在面具位置有值,其他位置为 -100这是PyTorch's ignore index 约定) ⋅

```python
def create_mlm_batch(tokens, vocab_size, mask_prob=0.15, rng=None):
    input_ids = list(tokens)
    labels = [-100] * len(tokens)
    for i, t in enumerate(tokens):
        if rng.random() < mask_prob:
            labels[i] = t
            r = rng.random()
            if r < 0.8:
                input_ids[i] = MASK_ID
            elif r < 0.9:
                input_ids[i] = rng.randrange(vocab_size)
            # else: keep original
    return input_ids, labels
```

### Paso 2: En un micro corpus arriba ejecutar predicción de MLM

En el vocabulario de 20 palabras, 200 frases, entrenamos un codificador de 2 capas + cabeza MLM.

### Paso 3: Comparación de máscaras 类型

展示三路规则 cómo hacer que el modelo esté en falta `[MASK]`En el caso de todavía disponibles. En la frase de la máscara no se puede distinguir entre las palabras de la máscara y las de la máscara.

### Paso 4: Tenga en cuenta la cabeza

En un conjunto de datos de sentimiento de juguete, utiliza el encabezado de clasificación  sustituir el encabezado de MLM                                                                                                                                                                                                                                                 

## Usalo

```python
from transformers import AutoModel, AutoTokenizer

tok = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")

text = "Attention is all you need."
inputs = tok(text, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, N, 768)
```

**Embedding models 是 fine-tuned BERT。** `sentence-transformers`En el centro`all-MiniLM-L6-v2`Este modelo, es con la pérdida contrastable  entrenamiento de BERT ∙encoder es el mismo ∙ ∙ cambios es la pérdida ∙

**Cross-encoder rerankers 也是 fine-tuned BERT。**En el`[CLS] query [SEP] doc [SEP]`上做 pares-clasificación──cuestión 和 doc 之间的 atención bidireccional,正是 cruz encoder 相比 bi-encoder 具有质量优势的原因──

**2026 年什么时候不该选 BERT。**任何生成式任务──编码器 没有合理方式 autoregressively 生成 Token──另外: cualquiera de los parámetros 1B 以下、其中, un pequeño decodor 能以更高灵活性达到相同质量的任务 (Phi-3-Mini, Qwen2-1.5B)──

##  entregarlo

¿ Qué ?`outputs/skill-bert-finetuner.md`◊ esta habilidad se utilizará para una nueva clasificación o extracción  tarea definición de BERT fine-tune  la espalda 选择、head 规格、数据、eval、停止条件) 

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`, e imprimió 10.000 Token  上面的面具 分布── confirmar aproximadamente el 15% fue seleccionado, de los cuales aproximadamente el 80% se convirtió `[MASK]`¿Qué es eso?
2. **Medium.**实现 enmascaramiento de palabras enteras: si un palabra es cortada por Tokenizer subwords, entonces con máscaras todas las subwords, o todo no enmascarar── medir si esto puede mejorar la precisión de MLM en un corpus de 500 frases.
3. **Hard.**En 10.000 palabras de un conjunto de datos públicos entrenar un pequeño (2-layer, d=64) BERT― para el sentimiento de la SST-2`[CLS]`Token. ¿Quién gana?

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| MLM | "Masked language modeling" | 训练信号：随机将 15% 的 Token 替换为 `[MASK]`，预测原始 Token。 |
| Bidirectional | "双向看" | Encoder Attention 没有 causal mask——每个位置都能看到其他所有位置。 |
| `[CLS]` | "The pooler token" | 一个添加到每个 sequence 开头的特殊 Token；它的最终 Embedding 用作句子级表示。 |
| `[SEP]` | "Segment separator" | 分隔成对的 sequence（例如 query/doc、sentence A/B）。 |
| NSP | "Next sentence prediction" | BERT 的第二个 pretraining 任务；在 RoBERTa 中被证明无用，2019 年后被移除。 |
| Fine-tuning | "适配一个任务" | 基本保持 encoder 冻结；在其上训练一个小 head 来完成下游任务。 |
| Cross-encoder | "一个 reranker" | 一个同时接收 query 和 doc 作为输入，并输出相关性分数的 BERT。 |
| ModernBERT | "2024 refresh" | 用 RoPE、RMSNorm、GeGLU、交替 local/global attention、8K context 重建的 encoder。 |

## 延伸阅读

- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) 原始论文──
- [Liu et al. (2019). RoBERTa: A Robustly Optimized BERT Pretraining Approach](https://arxiv.org/abs/1907.11692) 如何正确训练 BERT;移除NSP──
- [Clark et al. (2020). ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators](https://arxiv.org/abs/2003.10555)En la misma computación, la detección de tokens sustituidos superó MLM.
- [Warner et al. (2024). Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder](https://arxiv.org/abs/2412.13663) ModernBERT 论文──
- [HuggingFace `modeling_bert.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/bert/modeling_bert.py) 标准 encoder 参考。
