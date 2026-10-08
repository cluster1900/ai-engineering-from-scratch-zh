# Procesamiento de textos  Tokenization, Stemming, Lemmatization

> 语言是连续的. El modelo es desprendiente.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## El problema

模型不能阅读 "Los gatos corrían".

Cada sistema de PNL comienza con los mismos tres problemas. El principio de la PNL es lo que significa.

La tokenización ha hecho un error, el modelo se aprenderá de la basura. Si tu tokenizer lo pone en el mapa,`don't`Cuando se hace un token, se hace un`do n't`Cuando se hacen dos tokens, la distribución se deshace.`organization`Y `organ`压成同一个干,topic modeling就完成了. Si tu lemmatizer 需要部分的演讲上下文但你没有传入,动词就会被当作名词处理.

Este curso se desarrollará desde cero construyendo estos tres pasos de preprocesamiento, y luego mostrará cómo hacer el mismo trabajo en NLTK y espaCy, dejándote ver cómo se ha tomado de ellos.

## El concepto

Tres operaciones. Cada uno tiene su propio deber y su propio modo de fracaso.

**Tokenization**La palabra "token" tiene la intención de mantenerse confusa, ya que la granor verdadera depende de la tarea.

**Stemming**Usando las reglas cortar después ──快──激进──粗──`running -> run`¿Qué es eso?`organization -> organ`◊ Segundo es el modo de fracaso.

**Lemmatization**Uso de lenguaje de la lengua en inglés.`ran -> run`( necesito saber que "run" es el pasado de "run")`better -> good`(Necesita saber la forma de comparación)

经验法则──速度重要且可容忍噪音时使用源源的搜索索索引,粗略分类)──语义重要时使用化 (化) ⋅ pregunta respondiendo, búsqueda semántica, cualquier usuario leerá el contenido)──


```figure
edit-distance
```

## Construye el mismo

### Paso 1: Un tokenizer de palabras regex

El Tokenizer más simple y útil se ejecutará en función de los caracteres digitales no letal, mientras que el Token se mantiene como un Token.

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

Tres patrones de palabras en la categoría de prioridad`don't`¿Qué es esto?`it's`)。Pura cifra。 cualquier unidad de caracteres numéricos no-habitual como Token independiente(标点)。

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

需要注意的失败模式──`3pm`¡ Me han cortado !`['3', 'pm']`, porque nos intercambiamos entre letras y números. Para la mayoría de las tareas, los URLs, correos electrónicos, hashtags son un problema. En el entorno de producción, antes de añadir patrones especiales.

### Paso 2: Un portavoz votará

El algoritmo completo de Porter tiene cinco etapas de reglas. Sólo el paso 1a cubre el inglés más común.

```python
def stem_step_1a(word):
    if word.endswith("sses"):
        return word[:-2]
    if word.endswith("ies"):
        return word[:-2]
    if word.endswith("ss"):
        return word
    if word.endswith("s") and len(word) > 1:
        return word[:-1]
    return word
```

```python
>>> [stem_step_1a(w) for w in ["caresses", "ponies", "caress", "cats"]]
['caress', 'poni', 'caress', 'cat']
```

按从上到下读取规则──`ies -> i`La regla es que...`ponies -> poni`En vez de`pony`Por lo tanto, el verdadero Porter tiene un paso 1b, lo modificará.

### Paso 3: Un lemmatizer basado en la búsqueda

La verdadera lematización  necesita morfología― una versión educativa usando tabla de pequeños lemmas 和 fallback―

```python
LEMMA_TABLE = {
    ("running", "VERB"): "run",
    ("ran", "VERB"): "run",
    ("runs", "VERB"): "run",
    ("better", "ADJ"): "good",
    ("best", "ADJ"): "good",
    ("cats", "NOUN"): "cat",
    ("cat", "NOUN"): "cat",
    ("were", "VERB"): "be",
    ("was", "VERB"): "be",
    ("is", "VERB"): "be",
}

def lemmatize(word, pos):
    key = (word.lower(), pos)
    if key in LEMMA_TABLE:
        return LEMMA_TABLE[key]
    if pos == "VERB" and word.endswith("ing"):
        return word[:-3]
    if pos == "NOUN" and word.endswith("s"):
        return word[:-1]
    return word.lower()
```

```python
>>> lemmatize("running", "VERB")
'run'
>>> lemmatize("cats", "NOUN")
'cat'
>>> lemmatize("better", "ADJ")
'good'
>>> lemmatize("watched", "VERB")
'watched'
```

El último ejemplo es el punto de enseñanza clave.`watched`No está en nuestra mesa, y el retroceso sólo se trata.`ing`◊ Verdaderas lemmatizations 会覆盖 `ed`、不规则动词、比较级形容词、带音变的复数(`children -> child`)― es la razón por la cual el sistema de producción utiliza el morfologizador de WordNet、spaCy o el analizador morfológico completo―

### Paso 4: Ponlos juntos

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

缺失一块是POS tagger──Phase 5 · 07 (POS Tagging) 会构建一个──现在,默认全部为 `NOUN`, no reconoce esta limitación.

## Usalo

NLTK y espaCy ofrecen versiones de producción.

### NLTK

```python
import nltk
nltk.download("punkt_tab")
nltk.download("wordnet")
nltk.download("averaged_perceptron_tagger_eng")

from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk import pos_tag

text = "The cats were running."
tokens = word_tokenize(text)
stems = [PorterStemmer().stem(t) for t in tokens]
lemmatizer = WordNetLemmatizer()
tagged = pos_tag(tokens)


def nltk_pos_to_wordnet(tag):
    if tag.startswith("V"):
        return "v"
    if tag.startswith("J"):
        return "a"
    if tag.startswith("R"):
        return "r"
    return "n"


lemmas = [lemmatizer.lemmatize(t, nltk_pos_to_wordnet(tag)) for t, tag in tagged]
```

`word_tokenize`Tratará las contracciones, el Unicode y las limitaciones de tu regex.`PorterStemmer`La operación se llevará a cabo en cinco fases.`WordNetLemmatizer`需要把 POS tag de Penn Treebank de NLTK 翻译到 WordNet的缩写集合上面──的转换接线是大多数教程跳过的部分──

### el espacio

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running.")

for token in doc:
    print(token.text, token.lemma_, token.pos_)
```

```text
The      the     DET
cats     cat     NOUN
were     be      AUX
running  run     VERB
.        .       PUNCT
```

Especializando el gasoducto`nlp(text)`后面──Tokización、POS etiquetado 和 lemmatization 都会运行──大规模时比NLTK 更快──开箱即用更准确──取舍是你不容易替换单个组件──

### ¿Cuándo elegir qué?

| Situation | Pick |
|-----------|------|
| 教学、研究、替换组件 | NLTK |
| 生产、多语言、速度重要 | spaCy |
| Transformer pipeline（反正你会用模型自己的 Tokenizer） | 使用 `tokenizers` / `transformers`，跳过经典 preprocessing |

### No hay nadie que te recuerde de tus dos modos de fracaso

La mayoría de los cursos sólo hablan de algoritmos, y luego se detienen.

**Reproducibility drift。**NLTK y spaCy en las versiones entre cambios en la tokenización y lemmatizer  comportamiento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `['do', "n't"]`El contenido, en 3.x puede producirse `["don't"]` Tu modelo está entrenado en una distribución  Inferencia ahora se ejecuta en otra distribución  Precisión  Baja, pero nadie sabe la causa   `requirements.txt`中固定 library 版本──写一个预处理回归测试,结 20 个例句子的预期代码化──每次升级都运行它──

**Training / inference mismatch。**訓練時使用激進預加工 (en inglés: 激進預加工) 

## Envío

Una rápida y repetible ayuda al ingeniero a elegir estrategias de preprocesamiento en caso de no leer los materiales.

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/prompt-preprocessing-advisor.md`¿Qué es esto ?

```markdown
---
name: preprocessing-advisor
description: Recommends a tokenization, stemming, and lemmatization setup for an NLP task.
phase: 5
lesson: 01
---

You advise on classical NLP preprocessing. Given a task description, you output:

1. Tokenization choice (regex, NLTK word_tokenize, spaCy, or transformer tokenizer). Explain why.
2. Whether to stem, lemmatize, both, or neither. Explain why.
3. Specific library calls. Name the functions. Quote the POS-tag translation if NLTK is involved.
4. One failure mode the user should test for.

Refuse to recommend stemming for user-visible text. Refuse to recommend lemmatization without POS tags. Flag non-English input as needing a different pipeline.
```

## Los ejercicios

1. **Easy.**扩展 `tokenize`, hacer URLs 保持为单个代币──测试:`tokenize("Visit https://example.com today.")` debería generar un URL Token。
2. **Medium.**实现 Porter paso 1b.  If a word contains a word并以`ed`O `ing`结尾,移除它──处理双辅音规则(`hopping -> hop`¿ Qué es ?`hopp`)。
3. **Hard.**Construir un lemmatizer usando WordNet como tabla de búsqueda, pero cuando WordNet  no tiene条目时 fallback hasta su Porter votadores── en el corpus etiquetado 上衡量它相对简单 WordNet 和简单 Porter 的准确率──

## Términos clave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Token | 一个词 | 模型消耗的任何单位。可以是 word、subword、character 或 byte。 |
| Stem | 词根 | 基于规则的后缀剥离结果。不一定是真实单词。 |
| Lemma | 词典形式 | 你会去查词典的形式。需要语法上下文才能正确计算。 |
| POS tag | Part of speech | 像 NOUN、VERB、ADJ 这样的类别。准确 lemmatization 需要它。 |
| Morphology | 词形规则 | 词如何基于 tense、number、case 改变形式。Lemmatization 依赖它。 |

## Leer más

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) Original论文,五页, hasta ahora sigue siendo la explicación más clara.
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features) Verdaderos oleoductos 如何接线──
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) Tú no has pensado en la tokenización 边界情况──
