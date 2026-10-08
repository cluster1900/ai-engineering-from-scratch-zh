# Etiquetado de POS y Parsado sintáctico

> La gramática una vez no era muy popular. Después cada LLM necesitaba un proceso de prueba estructurado.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 01 (文本处理), Fase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

##  problemas

Lección 01  Prometido, lemmatización  Necesita etiqueta de parte del discurso―si no sabe `running`Es verbo, limitador, no puedo recuperarlo.`run`Si no lo sabes`better`Es un adjetivo, no puede recuperarse.`good`¿Qué es eso?

Esta promesa está detrás de un subdominio completo. La etiquetación de la parte del habla se distribuye en categorías gramaticales. El parseado sintáctico restablece la estructura de la frase.

Pero la comunidad aplicada 没有──每条结构-extraction pipeline 底层仍在使用 POS 和依赖树──LLM 生成的 JSON 会根据语法限制进行验证──问题答系统 会用依赖解析 分解查询──机器翻译质量评审员 会检查解析树的对齐──

 Es importante saber.  Introducción de los tagetes, líneas básicas y cuándo dejar de implementar y utilizar el espacio.

## 概念

**POS tagging**会为每个代号标注语法类别──**Penn Treebank (PTB)**Tagset es un código de preferencia en inglés. Tiene 36 etiquetas, que se distinguen de las siguientes:`NN`nombre singular,`NNS`nombre plural,`NNP`nombre propio singular,`VBD`Verbo pasado tiempo ,`VBZ`Verbo 3rd person singular presente, etc.**Universal Dependencies (UD)**Más grosso grado de trabajo (~17 个标签), y está relacionado con el lenguaje; se ha convertido en una opción de trabajo translingual.

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing**La gente tiene dos estilos principales:

- **Constituency parsing.**Frases de nombres, frases de verbos, frases de preposiciones 会相互嵌套──输出是一棵非终端类别(NP、VP、PP)组成的树,words 作为叶──
- **Dependency parsing.**Cada palabra ciudad tiene una palabra de cabeza que depende,并带有语法关系标签──输出是一棵树,其中每条边都是一个 (head, dependent, relation) triple──

La dependencia de análisis en los años 2010 胜出, porque puede muy bien translanguage泛化, especialmente para idiomas de orden de palabras libre.

```
running is ROOT
cats is nsubj of running
were is aux of running
at is prep of running
3pm is pobj of at
```


```figure
pos-tagger
```


```figure
dependency-arcs
```

## Construirlo

### 步骤 1: línea de base de etiquetas más frecuentes

El más eficaz pero efectivo de los POS. Para cada palabra, predice que es el más común en el entrenamiento.

```python
from collections import Counter, defaultdict


def train_mft(train_examples):
    word_tag_counts = defaultdict(Counter)
    all_tags = Counter()
    for tokens, tags in train_examples:
        for token, tag in zip(tokens, tags):
            word_tag_counts[token.lower()][tag] += 1
            all_tags[tag] += 1
    word_best = {w: c.most_common(1)[0][0] for w, c in word_tag_counts.items()}
    default_tag = all_tags.most_common(1)[0][0]
    return word_best, default_tag


def predict_mft(tokens, word_best, default_tag):
    return [word_best.get(t.lower(), default_tag) for t in tokens]
```

En el corpus marrón, esta línea de base puede alcanzar una precisión del 85%.

### 步骤 2: etiqueta de HMM de gran tamaño

Para la probabilidad conjunta de la secuencia 建模:

```
P(tags, words) = prod P(tag_i | tag_{i-1}) * P(word_i | tag_i)
```

两张表:probabilidades de transición(给定前标的标签) y probabilidades de emisión(给定标签的词) ――用带拉普拉斯平滑的计算 来估计二者──用Viterbi 解码(在标签网上做动态编程)。

```python
import math


def train_hmm(train_examples, alpha=0.01):
    transitions = defaultdict(Counter)
    emissions = defaultdict(Counter)
    tags = set()
    vocab = set()

    for tokens, ts in train_examples:
        prev = "<BOS>"
        for token, tag in zip(tokens, ts):
            transitions[prev][tag] += 1
            emissions[tag][token.lower()] += 1
            tags.add(tag)
            vocab.add(token.lower())
            prev = tag
        transitions[prev]["<EOS>"] += 1

    return transitions, emissions, tags, vocab


def log_prob(table, given, key, smooth_denom, alpha):
    return math.log((table[given].get(key, 0) + alpha) / smooth_denom)


def viterbi(tokens, transitions, emissions, tags, vocab, alpha=0.01):
    tags_list = list(tags)
    n = len(tokens)
    V = [[0.0] * len(tags_list) for _ in range(n)]
    back = [[0] * len(tags_list) for _ in range(n)]

    for j, tag in enumerate(tags_list):
        em_denom = sum(emissions[tag].values()) + alpha * (len(vocab) + 1)
        tr_denom = sum(transitions["<BOS>"].values()) + alpha * (len(tags_list) + 1)
        tr = log_prob(transitions, "<BOS>", tag, tr_denom, alpha)
        em = log_prob(emissions, tag, tokens[0].lower(), em_denom, alpha)
        V[0][j] = tr + em
        back[0][j] = 0

    for i in range(1, n):
        for j, tag in enumerate(tags_list):
            em_denom = sum(emissions[tag].values()) + alpha * (len(vocab) + 1)
            em = log_prob(emissions, tag, tokens[i].lower(), em_denom, alpha)
            best_prev = 0
            best_score = -1e30
            for k, prev_tag in enumerate(tags_list):
                tr_denom = sum(transitions[prev_tag].values()) + alpha * (len(tags_list) + 1)
                tr = log_prob(transitions, prev_tag, tag, tr_denom, alpha)
                score = V[i - 1][k] + tr + em
                if score > best_score:
                    best_score = score
                    best_prev = k
            V[i][j] = best_score
            back[i][j] = best_prev

    last_best = max(range(len(tags_list)), key=lambda j: V[n - 1][j])
    path = [last_best]
    for i in range(n - 1, 0, -1):
        path.append(back[i][path[-1]])
    return [tags_list[j] for j in reversed(path)]
```

El Bigram HMM en Brown arriba puede alcanzar una precisión del 93% aproximadamente.`DET NOUN`Es muy habitual, y`NOUN DET`很少见――, y luego me lo dije.

### Paso 3: ¿Por qué los etiquetadores modernos pueden vencerlo?

Las probabilidades de transición + emisiones son locales.`saw`En el caso de "compré una sierra" el CRF de "compré una sierra" es un nombre, mientras que en el caso de "vi la película". el CRF de "compré una sierra" es un verbo.

La limitación de la tarea es determinada por el desacuerdo entre los anotadores. Los anotadores humanos en Penn Treebank coinciden en aproximadamente el 97% de los tiempos.

### 步骤 4: esquema de análisis de dependencias

Desde el principio de la perfección de la realización de dependencias de parsing 超出本课范围;标准教材讲解见 Jurafsky y Martin── necesita conocer dos familias clásicas:

- **Transition-based**Parseres (arc-eager、arc-standard) Como parser de reducción de cambios 一样工作:它们读取代币,将其转到堆上,并应用减少行动 来创建弧──贪码 快快──经典实现是 MaltParser──现代神经版本:Chen and Manning 的转型基于解析器──
- **Graph-based**Los parseres (algorithm de Eisner, Dozat-Manning) se preparan para cada línea de la cabeza dependiente de la línea de parseres.

Para la mayoría de los trabajos aplicados, se utiliza el espacio:

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running at 3pm.")
for token in doc:
    print(f"{token.text:10s} tag={token.tag_:5s} pos={token.pos_:6s} dep={token.dep_:10s} head={token.head.text}")
```

```
The        tag=DT    pos=DET    dep=det        head=cats
cats       tag=NNS   pos=NOUN   dep=nsubj      head=running
were       tag=VBD   pos=AUX    dep=aux        head=running
running    tag=VBG   pos=VERB   dep=ROOT       head=running
at         tag=IN    pos=ADP    dep=prep       head=running
3pm        tag=NN    pos=NOUN   dep=pobj       head=at
.          tag=.     pos=PUNCT  dep=punct      head=running
```

Desde abajo hasta arriba`dep`La estructura gramatical de la frase aparece.

## Usalo

Cada biblioteca de producción de PNL tiene un punto de venta y un par de dependencias como parte de la línea de producción estándar.

- **spaCy**(El artículo`en_core_web_sm`- ¿ Qué ?`md`- ¿ Qué ?`lg`- ¿ Qué ?`trf`)──快速、准确,并与代币化 + NER + lemmatization 集成──`token.tag_`¿Qué es eso?`token.pos_`(UD)`token.dep_`(relación de dependencia)
- **Stanford NLP (stanza)**❖ Stanford a los sucesores de CoreNLP ◦ en más de 60 idiomas ◦ alcanzar el estado de la técnica ◦
- **trankit**❖ Basado en el Transformer, la precisión de la U.D. ❖ muy buena
- **NLTK**¿Qué es eso?`pos_tag`△可用、较慢、较旧──适合教学──

### Esto sigue siendo importante en 2026

- **Lemmatization.**Lección 01  necesita POS 才能正确 lemmatize── siempre así──
- **Structured extraction from LLM outputs.**验证生成的句子 是否遵守语法限制 (por ejemplo, acuerdo entre el sujeto y el verbo, modificaciones necesarias)
- **Aspect-based sentiment.**Los pares de dependencia te dirán qué adjetivo modificar qué sustantivo.
- **Query understanding.**"filmes dirigidos por Wes Anderson con Bill Murray"
- **Cross-lingual transfer.**Las etiquetas UD y las relaciones de dependencia con la lengua no están relacionadas, apoyo a nuevos lenguajes para realizar un análisis estructurado de cero disparos.
- **Low-compute pipelines.**Si no puedes entregar el transformador, el POS + el parse de dependencia + el boletín te puede llevar a cabo una carrera inesperada.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-grammar-pipeline.md`¿Qué es esto ?

```markdown
---
name: grammar-pipeline
description: 为下游 NLP task 设计一个 classical POS + dependency pipeline。
version: 1.0.0
phase: 5
lesson: 07
tags: [nlp, pos, parsing]
---

给定一个下游 task（information extraction、rewrite validation、query decomposition、lemmatization），你输出：

1. 要使用的 tagset。English-only legacy pipelines 使用 Penn Treebank，multilingual 或 cross-lingual 使用 Universal Dependencies。
2. Library。大多数 production 使用 spaCy，academic-grade multilingual 使用 stanza，最高 UD accuracy 使用 trankit。写出具体的 model ID。
3. Integration pattern。展示调用 library 并消费所需 attributes（`.pos_`、`.dep_`、`.head`）的 3-5 行代码。
4. 需要测试的 failure mode。Noun-verb ambiguity（`saw`、`book`、`can`）和 PP-attachment ambiguity 是 classical traps。抽样 20 个 outputs 并人工查看。

拒绝建议自己写 parser。Building parsers from scratch 是 research project，不是 application task。标记任何消费 POS tags 却不处理 lowercase/uppercase variants 的 pipeline 为 fragile。
```

##  ejercicios

1. **Easy.**En un corpus de etiquetas pequeñas (por ejemplo, el subconjunto de NLTK de Brown) utilizando la línea de base de etiquetas más frecuentes, se mide la precisión de las oraciones realizadas.
2. **Medium.**訓練上的bigram HMM,并报告每标签精度/回忆──HMM 最容易混哪些标签?
3. **Hard.**Utiliza la dependencia de espaCy, extraer de la muestra de 1000 frases, tres veces el sujeto-verbo-objeto.

## 关键术语: "El hombre es un hombre"

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| POS tag | Word 的类型 | Grammatical category。PTB 有 36 个；UD 有 17 个。 |
| Penn Treebank | Standard tagset | 针对英语。细粒度区分 verb tenses 和 noun number。 |
| Universal Dependencies | Multilingual tagset | 比 PTB 更粗粒度；language-neutral；cross-lingual work 的默认选择。 |
| Dependency parse | Sentence tree | 每个 word 有一个 head，每条 edge 有一个 grammatical relation。 |
| Viterbi | Dynamic programming | 在给定 emissions 和 transitions 的情况下，找到 probability 最高的 tag sequence。 |

## 延伸阅读

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) POS 和 parsing 的标准教材讲解──
- [Universal Dependencies project](https://universaldependencies.org/) Cada parser multilingüe utilizará un conjunto de etiquetas interlinguísticas y una colección de árboles。
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features)¿ Qué es esto ?`Token`Referencia práctica de cada atributo de la lista de arriba abierta.
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf) Introducir los pares neurales  Introducir los artículos principales 
