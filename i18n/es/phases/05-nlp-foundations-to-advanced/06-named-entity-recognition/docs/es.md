# Reconocimiento de la entidad denominada

> ¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

##  problemas

"Apple demandó a Google por su acuerdo de búsqueda de iPhone en los EE.UU". 五个实体:Apple (ORG) 、Google (ORG) 、iPhone (PRODUCT) 、search deal(也许算) 、US (GPE) ⋅ un buen NER 系统会提取全部实体,并给出正确类型──一个差的系统会漏掉iPhone,把水果 Apple和公司 Apple 混,也将"US"标签成 PERSON──

NER es cada artículo estructurado extraer el pipeline  basement principal power。简历解析、合规日志扫描、病历匿名化、搜索查询理解、chatbot 回复的 grounding、法律合同抽取── usted casi no lo ve; pero usted siempre depende de ello──

Este curso se desarrollará a lo largo de los métodos clásicos (Regular-based、HMM、CRF) y se desarrollará a lo largo de los métodos modernos (BiLSTM-CRF, Transformers) y cada paso se resolverá con una limitación concreta del siguiente paso.

## 概念

**BIO tagging**(o BILOU)把实体抽取转化为序列标注问题――为每个标注`B-TYPE`(实体开始)`I-TYPE`(en el cuerpo interno) o `O`(qualquier cuerpo fuera)

```
Apple    B-ORG
sued     O
Google   B-ORG
over     O
its      O
iPhone   B-PRODUCT
search   O
deal     O
in       O
the      O
US       B-GPE
.        O
```

Muchos símbolos de la sociedad se han conectado:`New B-GPE`¿Qué es esto?`York I-GPE`¿Qué es esto?`City I-GPE`❖ Comprender el modelo de la BIO puede extraerse de cualquier espacio de tiempo.

架构演进:

- **Rule-based.**Regex + gazetteer 查找──对已知实体精度 高,对新实体覆盖 为零──
- **HMM.**Modelo de Markov oculto― probabilidad de emisión de tokens de etiquetas determinadas, así como probabilidad de transición de etiquetas a etiquetas― con decodificación Viterbi― en entrenamiento en datos de etiquetas―
- **CRF.**Campo aleatorio condicional― similar a HMM, pero pertenece a un modelo discriminativo, por lo que puede mezclar cualquier característica de la forma de la palabra―, la gran cantidad de escritura―, la gran cantidad de palabras que se encuentran en el campo aleatorio―.
- **BiLSTM-CRF.**Usado Neural Features sustituir manuales Features. LSTM 双向读取句子,顶部CRF 层强制标签 序列一致.
- **Transformer-based.**Usando el encabezado de clasificación de tokens 微调 BERT──准确率最高──计算量最大──


```figure
ner-bio-tagging
```

## Construirlo

### 步骤 1: BIO etiquetado de ayudantes

```python
def spans_to_bio(tokens, spans):
    labels = ["O"] * len(tokens)
    for start, end, label in spans:
        labels[start] = f"B-{label}"
        for i in range(start + 1, end):
            labels[i] = f"I-{label}"
    return labels


def bio_to_spans(tokens, labels):
    spans = []
    current = None
    for i, label in enumerate(labels):
        if label.startswith("B-"):
            if current:
                spans.append(current)
            current = (i, i + 1, label[2:])
        elif label.startswith("I-") and current and current[2] == label[2:]:
            current = (current[0], i + 1, current[2])
        else:
            if current:
                spans.append(current)
                current = None
    if current:
        spans.append(current)
    return spans
```

```python
>>> tokens = ["Apple", "sued", "Google", "over", "iPhone", "sales", "."]
>>> labels = ["B-ORG", "O", "B-ORG", "O", "B-PRODUCT", "O", "O"]
>>> bio_to_spans(tokens, labels)
[(0, 1, 'ORG'), (2, 3, 'ORG'), (4, 5, 'PRODUCT')]
```

### 步骤 2: características hechas a mano

Para el clásico, la característica es el núcleo.

```python
def token_features(token, prev_token, next_token):
    return {
        "lower": token.lower(),
        "is_upper": token.isupper(),
        "is_title": token.istitle(),
        "has_digit": any(c.isdigit() for c in token),
        "suffix_3": token[-3:].lower(),
        "shape": word_shape(token),
        "prev_lower": prev_token.lower() if prev_token else "<BOS>",
        "next_lower": next_token.lower() if next_token else "<EOS>",
    }


def word_shape(word):
    out = []
    for c in word:
        if c.isupper():
            out.append("X")
        elif c.islower():
            out.append("x")
        elif c.isdigit():
            out.append("d")
        else:
            out.append(c)
    return "".join(out)
```

`word_shape("iPhone")` regresar `xXxxxx`¿Qué es eso?`word_shape("USA-2024")` regresar `XXX-dddd`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊      ◊                                                                                                                                                                                                                                         

### Paso 3: Una línea de base de diccionario basada en reglas simples

```python
ORG_GAZETTEER = {"Apple", "Google", "Microsoft", "OpenAI", "Meta", "Amazon", "Netflix"}
GPE_GAZETTEER = {"US", "USA", "UK", "India", "Germany", "France"}
PRODUCT_GAZETTEER = {"iPhone", "Android", "Windows", "ChatGPT", "Claude"}


def rule_based_ner(tokens):
    labels = []
    for token in tokens:
        if token in ORG_GAZETTEER:
            labels.append("B-ORG")
        elif token in GPE_GAZETTEER:
            labels.append("B-GPE")
        elif token in PRODUCT_GAZETTEER:
            labels.append("B-PRODUCT")
        else:
            labels.append("O")
    return labels
```

Hay varios millones de artículos de Wikipedia y DBpedia 抓取的条目──Cobreza 很好──Disambiguation(Company Apple vs 水果 Apple) muy malo── ése es el motivo por el que el modelo estadístico ganó──

### 步骤 4: CRF 步骤(草图, no es una realización completa)

Si no hay base en la teoría de la probabilidad, desde cero con 50 líneas de escribir un CRF completo no puede traer mucho empezando.`sklearn-crfsuite`¿Qué es esto ?

```python
import sklearn_crfsuite

def to_features(tokens):
    out = []
    for i, tok in enumerate(tokens):
        prev = tokens[i - 1] if i > 0 else ""
        nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
        out.append({
            "word.lower()": tok.lower(),
            "word.isupper()": tok.isupper(),
            "word.istitle()": tok.istitle(),
            "word.isdigit()": tok.isdigit(),
            "word.suffix3": tok[-3:].lower(),
            "word.shape": word_shape(tok),
            "prev.word.lower()": prev.lower(),
            "next.word.lower()": nxt.lower(),
            "BOS": i == 0,
            "EOS": i == len(tokens) - 1,
        })
    return out


crf = sklearn_crfsuite.CRF(algorithm="lbfgs", c1=0.1, c2=0.1, max_iterations=100, all_possible_transitions=True)
X_train = [to_features(s) for s in sentences_tokenized]
crf.fit(X_train, bio_labels_train)
```

`c1`Y `c2`Es la regularización de L1 y L2.`all_possible_transitions=True`让模型学习非法序列 (por ejemplo)`O`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `I-ORG`) la probabilidad es baja, esto es CRF en forma obligatoria de BIO unálogo en caso de no necesitar tu mano de escritura.

### Paso 5: BiLSTM-CRF  aumentó qué

Los estados ocultos de los signos de inserción de los signos de aprendizaje se incorporan a los signos de inserción de los signos de aprendizaje.

```python
import torch
import torch.nn as nn


class BiLSTM_CRF_Head(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_labels):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(hidden_dim * 2, n_labels)

    def forward(self, token_ids):
        e = self.embed(token_ids)
        h, _ = self.lstm(e)
        emissions = self.fc(h)
        return emissions
```

CRF 层使用 `torchcrf.CRF`(Pip instalar pytorch-crf) ―― En comparación con CRF artesanal, la elevación es medible, pero a menos que tengas miles de líneas de marcado, la elevación de amplitud suele ser menor que lo esperado―

## Usalo

El espacio 开箱即带生产级 NER.

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple sued Google over its iPhone search deal in the US.")
for ent in doc.ents:
    print(f"{ent.text:20s} {ent.label_}")
```

```
Apple                ORG
Google               ORG
iPhone               ORG
US                   GPE
```

Atención .`iPhone`Fue seleccionado`ORG`En vez de`PRODUCT`,spaCy pequeño modelo para la cobertura de la entidad de producto 较弱──raro modelo(`en_core_web_lg`)表现更好──modelo de transformador(`en_core_web_trf`¡También será mejor!

NER basado en BERT de Hugging Face:

```python
from transformers import pipeline

ner = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
print(ner("Apple sued Google over its iPhone in the US."))
```

```
[{'entity_group': 'ORG', 'word': 'Apple', ...},
 {'entity_group': 'ORG', 'word': 'Google', ...},
 {'entity_group': 'MISC', 'word': 'iPhone', ...},
 {'entity_group': 'LOC', 'word': 'US', ...}]
```

`aggregation_strategy="simple"`Se puede combinar el token B-X ∞ X ∞ X ∞ en un espacio ∞ ∞ Sin él, se obtendrá etiquetas de nivel de token, y se debe combinar.

### NER basado en LLM (en inglés)

El NER de LLM de tiro cero y de pocos disparos ya está en condiciones de competir con modelos de tono fino en muchos campos; en la escasez de datos de etiquetado, el rendimiento es claramente mejor.

- **Zero-shot prompting.**给LLM 一组实体类型和一个示例方案――要求输出 JSON――开箱可用; 在新领域准确率中等――
- **ZeroTuneBio-style prompting.**Se puede desglosar la tarea en extracción de candidatos → significado explicación → juicio → re-check.
- **Dynamic prompting with RAG.**Para cada llamada de inferencia, se buscan los ejemplos de etiquetado más similares en un conjunto de semillas de etiquetado pequeño; se construye un prompt de pocos disparos en el marco de referencia de 2026, lo que permitirá que el GPT-4 biomedical NER F1 se eleve en un 11-12% en comparación con el prompt estático.
- **Per-entity-type decomposition.**Para el archivo largo, una vez se extrae a la vez todos los tipos de entidades a medida que aumenta la longitud y disminuye la recuerdo.

截至2026年的生产建议: Before gathering training data, first make an LLM zero-shot baseline──很多时候F1 已经足够好,你根本不需要细调──

### 经典 NER 仍然胜出的地方

Incluso si ya hay LLM, el clásico NER sigue siendo el resultado de las siguientes situaciones:

- Presupuesto de latencia  inferior a 50 ms¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- Tienes miles de ejemplos de etiquetas, y necesitas un 98% de F1+.
-  tener una ontología estable, formación previa en CRF o BiLSTM   迁移效果良好──
- 监管约束要求 on-premis、非生成式模型──

### Se va a fallar en algunos lugares

- **Domain shift.**En CoNLL, el NER de entrenamiento utilizado en contratos legales, se desempeña mejor que el periodista.
- **Nested entities.**"Bank of America Tower" 同时是 ORG 和 FACILITY──标准BIO 无法表示重叠 span──你需要嵌套NER(multi-pass或基于跨度模型)──
- **Long entities.**"Corporación Federal de Seguros de Depósitos de los Estados Unidos".`aggregation_strategy`O después de procesar.
- **Sparse types.**医疗 NER 标签包括 DRUG_BRAND、ADVERSE_EVENT、DOSE。

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-ner-picker.md`¿Qué es esto ?

```markdown
---
name: ner-picker
description: 为给定抽取任务选择合适的 NER 方法。
version: 1.0.0
phase: 5
lesson: 06
tags: [nlp, ner, extraction]
---

给定一个任务描述（领域、标签集、语言、延迟、数据量），输出：

1. 方法。Rule-based + gazetteer、CRF、BiLSTM-CRF，或 transformer fine-tune。
2. 起始模型。命名它（spaCy model ID、Hugging Face checkpoint ID，或 "custom, trained from scratch"）。
3. 标注策略。BIO、BILOU，或 span-based。用一句话说明理由。
4. 评估。使用 `seqeval`。始终报告 entity-level F1（不是 token-level）。

除非用户已经有 pretrained domain model，否则拒绝建议在少于 500 个标注样例上 fine-tuning transformer。如果存在 nested entities，标记为需要 span-based 或 multi-pass models。如果用户提到 "production scale"，且标签与 CoNLL-2003 相同，则要求进行 gazetteer audit。
```

##  ejercicios

1. **Easy.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `bio_to_spans`(El artículo`spans_to_bio`de contrario), y en 10 个句子上验证回路一致性──
2. **Medium.**En CoNLL-2003 Inglés NER conjunto de datos 上训练 上的 sklearn-crfsuite CRF──使用 `seqeval`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
3. **Hard.**En un ámbito específico del conjunto de datos de NER (medico, legal o financiero)`distilbert-base-cased`▽ con espaCy modelo pequeño en comparación, ▽ con registros de verificación de fugas de datos,并写下让你意外的发现──

## 关键术语: "El hombre es un hombre"

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| NER | 提取名称 | 给 token spans 标注类型（PERSON、ORG、GPE、DATE，...）。 |
| BIO | Tagging scheme | `B-X` 表示开始，`I-X` 表示继续，`O` 表示外部。 |
| BILOU | 更好的 BIO | 增加 `L-X`（last）、`U-X`（unit），让边界更清晰。 |
| CRF | 结构化 classifier | 对 labels 之间的 transitions 建模，而不只是 emissions。强制有效序列。 |
| Nested NER | 重叠实体 | 一个 span 是与其子 span 不同的实体。BIO 无法表达这一点。 |
| Entity-level F1 | 正确的 NER metric | 预测 span 必须与真实 span 完全匹配。Token-level F1 会高估准确率。 |

## 延伸阅读

- [Lample et al. (2016). Neural Architectures for Named Entity Recognition](https://arxiv.org/abs/1603.01360) BiLSTM-CRF 论文──经典──
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805)  Introducido más tarde se convirtió en el estándar de la clasificación de tokens 
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities)¿ Qué es esto ?`Doc.ents`Y `Span`Referencia práctica de cada uno de los atributos.
- [seqeval](https://github.com/chakki-works/seqeval)                                                                                                                                                                                                                                                              
