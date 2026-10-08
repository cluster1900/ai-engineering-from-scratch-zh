# Traducción automática

> La traducción es una tarea que ha durado tres décadas y que continúa comprando para el estudio de la PNL.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 10 (atención), Fase 5 · 04 (globo, texto rápido, subpalabra)
**Time:** ~75 minutes

##  problemas
Un modelo 读取一种语言的句子,并生成另一种语言的句子──长度会变化──词序会变化──有些源语言词会映射到多个目标语言词,反之亦然──习语拒绝对一映射──英语里"I miss you" 在法语里是"tu me manques"  字面意思是"you are missing me"──没有任何词级结合能在这种情况下保留下来──

La traducción automática es la que obliga a la PNL a desarrollar codificadores-decodificadores, Atención y Transformadores, y finalmente impulsa la formación de todo el paradigma de la LLM. Cada paso de progreso se produce debido a que la calidad de la traducción se puede medir, mientras que la diferencia entre humanos y máquinas es constante.

En el curso de la investigación, el estudio de la investigación y la evaluación de los resultados de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la investigación de la cucientes sobre sobre sobre sobre la cuadro de la cuadro de la cuadro de la investigación de la cuya cuya cuya cuya cuya cu

## 概念
![MT pipeline: tokenize → encode → decode with attention → detokenize](../assets/mt-pipeline.svg)

现代 MT 是在平行文中上训练的 Transformer encoder-decoder──encoder 读取按其语言代码化 处理后的源──decoder 通过跨度注意 (lección 10) Usar el encoder para generar una subpalabra, una vez decodificar, usar la búsqueda de haz para evitar la trampa de codificación codiciosa──output 会被 detockened、detrucased,并与参考 评分对比──

Tres opciones operativas deciden la calidad de MT en el mundo real.

- **Tokenizer.**SentencePiece BPE en el corpus de lenguajes mixtos 上训练──跨语言 compartido vocabulario 正是NLLB 能实现零射语言对的原因──
- **Model size.**NLLB-200 destilado 600M puede en ordenador portátil 上运行。NLLB-200 3.3B es el estándar de producción ya publicado。54.5B es el límite de investigación。
- **Decoding.**通用内容使用梁宽 4-5──使用长度罚 避免输出 过短──在需要术语一致性 时使用限制解码──


```figure
seq2seq-alignment
```

## Construirlo
### Paso 1: Una llamada de MT preentrenada

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_id = "facebook/nllb-200-distilled-600M"
tok = AutoTokenizer.from_pretrained(model_id, src_lang="eng_Latn")
model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

src = "The cats are running."
inputs = tok(src, return_tensors="pt")

out = model.generate(
    **inputs,
    forced_bos_token_id=tok.convert_tokens_to_ids("fra_Latn"),
    num_beams=5,
    length_penalty=1.0,
    max_new_tokens=64,
)
print(tok.batch_decode(out, skip_special_tokens=True)[0])
```

```text
Les chats courent.
```

Hay tres cosas importantes.`src_lang`告诉 tokenizer 应用哪种脚本和细分.`forced_bos_token_id`告诉 decoder 要生成哪种语言── ambas son trucos específicos de NLLB; mBART 和 M2M-100 使用各自的约定,不能互换──

### Paso 2: BLEU y chrF

BLEU  mide la producción y la superposición de n-gramos entre la referencia ∙ Cuatro tipos de referencia n-gramos de tamaño(1-4)  Medidas geométricas de precisión, así como la brevedad de la producción en contra de la brevedad ∙

La definición de la lengua en el idioma es más sensible a la forma de la lengua en que se habla, ya que el BLEU se comparte con el BLEU en un informe.

```python
import sacrebleu

hypotheses = ["Les chats courent."]
references = [["Les chats courent."]]

bleu = sacrebleu.corpus_bleu(hypotheses, references)
chrf = sacrebleu.corpus_chrf(hypotheses, references)
print(f"BLEU: {bleu.score:.1f}  chrF: {chrf.score:.1f}")
```

始终使用 `sacrebleu` Se normaliza la tokenización, permite que el número de puntos entre los papeles se comparan.

### Tres niveles de evaluación (2026)

现代 MT evaluación Utilize Three classes of互补的 метриca familias.

- **Heuristic**(BLEU, chrF)──快速、referencia-based、可解释, pero no sensible a la paráfrase── para la comparación con el legado y la detección de regresión──
- **Learned**(COMET, BLEURT, BERTScore) ―En el juicio humano, los modelos neurales de formación; comparación de traducción con la similitud semántica de la fuente y referencia― desde 2023 , COMET y MT están vinculados a la investigación más alto, y en los asuntos de calidad es uno de los escenarios de la producción de 2026 años de default―
- **LLM-as-judge**(sin referencia) ―提示 un modelo grande 根据流ency、adequacy、tone、cultural appropriateness 为翻译 打分──当 rubrica 设计良好时,GPT-4-as-judge 与人类一致性的匹配率约为80%──用于没有参考的开放式内容──

实用2026 stack: 用 `sacrebleu`计算 BLEU 和 chrF, `unbabel-comet`計算 COMET,并用促 LLM 作为最终面向人类的信号──在信任任何指标 用生产数据 之前,先用50-100 个标签的人类的例子 进行校准──

Metricas sin referencia (COMET-QE, BLEURT-QE, LLM-as-judge) permite evaluar las traducciones en caso de no tener referencia, esto es muy importante para que no existan pares de idiomas de cola larga de las traducciones de referencia.

### Paso 3: la producción se está volviendo mal

En el 80% de los casos, se traducirá, y en el 20% restante, se fracasará.

- **Hallucination.**Modelo 发明源 中不存在的内容──常见于不熟的域名词汇──症状:output 很流,但声称源 没有陈述的事实──Mitigación:对域名使用限制解码,对受管制内容使用人文审查,并监控输出 是否比输入 长很多──
- **Off-target generation.**Modelo 翻译成错误语言──NLLB En pares de idiomas raros 上尤其容易出现这个问题──Mitigación:验证 `forced_bos_token_id`,并始终使用语言-ID modelo de verificación 检查输出──
- **Terminology drift.**"Sign up" en doc 1 中 se convierte en "s'inscribe", en doc 2 中 se convierte en "creer un compte"── para el texto de la interfaz y las cadenas de uso del usuario, consistencia por encima de la calidad bruta, más importante──Mitigación: decodificación con restricción de glosario o diccionario post-editar──
- **Formality mismatch.**Para el contenido orientado al cliente, esto suele ser un error. Medicación: si el modelo 支持, use formality token 作为快速预音,或在正式的 corpora上细调一小型号──
- **Length explosion on short input.**很短的输入句子 经常产生过长的翻译,因为在低于约5源代币时长处罚 会突然失效──Mitigación:使用与源长 成比例的硬最大长度 cap──

### Paso 4: Para un dominio  realizar ajuste fino

Los modelos pre-entrenados son generalistas. La traducción legal, médica o de juego-diálogo se beneficia claramente de la mejora de los datos paralelos en el dominio.

```python
from transformers import Trainer, TrainingArguments
from datasets import Dataset

pairs = [
    {"src": "The defendant pleaded guilty.", "tgt": "L'accusé a plaidé coupable."},
]

ds = Dataset.from_list(pairs)


def preprocess(ex):
    return tok(
        ex["src"],
        text_target=ex["tgt"],
        truncation=True,
        max_length=128,
        padding="max_length",
    )


ds = ds.map(preprocess, remove_columns=["src", "tgt"])

args = TrainingArguments(output_dir="out", per_device_train_batch_size=4, num_train_epochs=3, learning_rate=3e-5)
Trainer(model=model, args=args, train_dataset=ds).train()
```

几千个高质量平行例 胜过几十万个噪音网页剪辑例──培训数据质量是生产中最大的单一杆──

## Usalo
Estaca de producción de MT para 2026:

| Use case | Recommended starting point |
|---------|---------------------------|
| Any-to-any, 200 languages | `facebook/nllb-200-distilled-600M`（laptop）或 `nllb-200-3.3B`（production） |
| English-centric, high quality, 50 languages | `facebook/mbart-large-50-many-to-many-mmt` |
| Short runs, cheap inference, English-French/German/Spanish | Helsinki-NLP / Marian models |
| Latency-critical browser-side | ONNX-quantized Marian（~50 MB） |
| Maximum quality, willing to pay | GPT-4 / Claude / Gemini with translation prompts |

截至2026年, LLMs en varios pares de idiomas 上 ya superaron los modelos especializados de MT, especialmente en contenido idiomático y contexto largo 上。取舍是每代币成本和延迟──当背景长度、样式一致或通过促实现域调整比吞吐量 更重要时,选择LLM──

##  entregarlo
保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-mt-evaluator.md`¿Qué es esto ?

```markdown
---
name: mt-evaluator
description: Evaluate a machine translation output for shipping.
version: 1.0.0
phase: 5
lesson: 11
tags: [nlp, translation, evaluation]
---

给定 source text 和 candidate translation，输出：

1. Automatic score estimate。你预期的 BLEU 和 chrF ranges。说明是否有 reference。
2. 五点 human-verifiable check list：(a) content preservation（无 hallucinations），(b) correct language，(c) register / formality match，(d) terminology consistency with glossary if provided，(e) 无 truncation 或 length explosion。
3. 一个需要探查的 domain-specific issue。例如 legal：named entities 和 statute citations。medical：drug names 和 dosages。UI：placeholder variables `{name}`。
4. Confidence flag。"Ship" / "Ship with review" / "Do not ship"。将它与 step 2 中发现的问题 severity 绑定。

如果 output 没有 language-ID check，拒绝 ship translation。除非 user 明确选择 reference-free scoring（COMET-QE, BLEURT-QE），否则拒绝在没有 reference 的情况下 evaluate。标记任何超过 1000 tokens 的内容，因为它很可能需要 chunked translation。
```

##  ejercicios
1. **Easy.**Uso `nllb-200-distilled-600M`将一个 5 句英文段落翻译成法语,再翻译回英语──衡量回路与原始的接近程度── Usted debería ver la preservación semántica, al mismo tiempo que se acompaña de la deriva de elección de palabras──
2. **Medium.**Uso `fasttext lid.176`O `langdetect`Para las salidas de traducción  lograr la verificación de identificación de idioma 将将其集集成到MT call 中,让非目标代在返回前被捕
3. **Hard.**En tu elección de 5.000 pares de corpus de dominio en tono fino `nllb-200-distilled-600M` En el ajuste fino, utilizar el conjunto de medidas de BLEU  reportar qué tipos de oraciones  mejoraron, qué aparecieron regresiones 

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BLEU | Translation score | 带 brevity penalty 的 N-gram precision。[0, 100]。 |
| chrF | Character F-score | Character-level F-score。对形态丰富的语言更敏感。 |
| NMT | Neural MT | 在 parallel text 上训练的 Transformer encoder-decoder。2017+ default。 |
| NLLB | No Language Left Behind | Meta 的 200-language MT model family。 |
| Constrained decoding | Controlled output | 强制特定 tokens 或 n-grams 在 output 中出现 / 不出现。 |
| Hallucination | Invented content | source 不支持的 model output。 |

## 延伸阅读
- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672) Papel de la NLLB。
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/)¿ Por qué ?`sacrebleu`Es la única forma correcta de informar sobre BLEU.
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/) papel de crf。
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) 实用细调通行程──
