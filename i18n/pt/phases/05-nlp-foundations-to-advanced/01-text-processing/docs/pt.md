# Processamento de textos  Tokenization, Stemming, Lemmatization

> 语言是连续的. 模型是离散的. 语言是连续的.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## O problema

模型不能读读 "Os gatos estavam correndo".

Cada sistema de PNL começa com os mesmos três problemas. O termo começa com o que é o termo. Como podemos, quando há ajuda, classificar "correr", "correr", "ir" como sendo a mesma coisa, e, quando não há ajuda, classificar-as como coisas diferentes?

A tokenização está errada, o modelo vai aprender do lixo.`don't`Quando fiz um token, fiz isso.`do n't`Quando dois Tokens, a formação distribuída é desfeita.`organization`和 `organ`Se o seu lematizer precisar de parte do discurso, mas você não vai entrar, o seu termo será tratado como um nome de palavra.

Este curso irá começar a partir de zero construção de estas três etapas de pré-processamento, e depois mostrar como fazer o mesmo trabalho com NLTK e espaCy, deixando-o ver o que é que é feito.

## O conceito

Três operações. Cada um tem suas próprias responsabilidades e modo de falha.

**Tokenization**O termo "token" é usado para manter a sua forma de expressão, pois a sua graça depende da tarefa.

**Stemming**Usar regras cortar depois 🏼 🏼 🏻 🏻 🏻 🏻 ♀️`running -> run`- Não.`organization -> organ`O segundo é o modo de falha.

**Lemmatization**Utilize语法知识把词还原为词典形式──更慢、更准确, necessita de uma tabela de busca ou um analista morfológico──`ran -> run`(Necessito saber que "run" é o passado de "run")`better -> good`(necessário saber a forma de comparação)

经验法则──速度重要且可忍受噪音时使用源源的搜索索索引,粗略分类)──语义重要时使用化问题答,语义重要时使用语义重要时使用语义重要时使用语义重要时使用语义重要时使用语义重要时使用语义重要时使用语义重要时使用语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,语义的搜索,任何用户会阅读的内容)


```figure
edit-distance
```

## Construí-lo

### Passo 1: um tokenizer de palavras regex

O Tokenizer mais simples e útil será executado em letras não-alfabetas, enquanto o marcador retém o seu Token.

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

Três padrões de palavras em ordem de prioridade`don't`- Não.`it's`)。 puro número。 qualquer único não-cabeça、 não-letra numérica caracteres como Token independente(标点)。

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

需要注意的失败模式──`3pm`- Vai ser cortado .`['3', 'pm']`, porque nós trocamos entre letras e números. Para a maioria das tarefas, os URLs, e-mails, hashtags são problemáticos.

### Passo 2: Um porta-voz votará.

O algoritmo completo de Porter tem cinco etapas de regras. Apenas o passo 1a cobre o mais comum do inglês, e não pode ensinar esse modelo.

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

按从上到下读取规则──`ies -> i`A regra é:`ponies -> poni`Não é?`pony`Por isso, o que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é.

### Passo 3: Um lemmatizer baseado em busca

A verdadeira lematização  necessita de morfologia──a versão educativa usando tabelas de lemas pequenas 和 fallback──

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

O último exemplo é o ponto de ensino fundamental.`watched`Não está na nossa mesa, e a queda só se trata.`ing`◊ Verdadeira lematização 会覆盖 `ed`、不规则动词、比较级形容词、带音变的复数(`children -> child`)― é a razão pela qual o sistema de produção usa o morfologizador de WordNet、spaCy ou um analisador morfológico completo―

### Passo 4: Colocá-los juntos

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

缺失一块是POS tagger──Phase 5 · 07 (POS Tagging) 会构建一个──现在,默认全部为 `NOUN`Não reconheço esta limitação.

## Usá-lo

NLTK e espaCy fornecem versões de produção.

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

`word_tokenize`Tratar contrações, Unicode, e o seu regex 漏掉的边界情况.`PorterStemmer`Vai funcionar em cinco fases.`WordNetLemmatizer`需要把 POS tag from Penn Treebank scheme of NLTK 翻译到 WordNet的缩写集合上面──的转换接线是大多数教程跳过的部分──

### Espaço

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

Espaci, coloca o gasoduto todo escondido.`nlp(text)`后面──Tokenization、POS tagging 和 lemmatization 都会运行──大规模时比NLTK 更快──开箱即用更准确──取舍是你不容易替换单个组件──

### Que é que é que é?

| Situation | Pick |
|-----------|------|
| 教学、研究、替换组件 | NLTK |
| 生产、多语言、速度重要 | spaCy |
| Transformer pipeline（反正你会用模型自己的 Tokenizer） | 使用 `tokenizers` / `transformers`，跳过经典 preprocessing |

### Não há ninguém que te lembre dos dois modos de falha.

A maioria dos cursos fala apenas de algoritmos, e então já está parado.

**Reproducibility drift。**NLTK e spaCy em versões entre vão alterar a tokenização e lemmatizer  comportamento.`['do', "n't"]`O conteúdo, em 3.x, pode ser produzido.`["don't"]`O seu modelo está treinado em uma distribuição. A inferência está agora em operação em outra distribuição.`requirements.txt`中固定 library 版本──写一个预处理回归测试,结 20 个例句的预期代码化──每次升级都运行它──

**Training / inference mismatch。**訓練時使用激進前処理 (→                                                                                                                                                                                                                                                          

## Envia-o

Um rápido e repetível recurso, ajuda o engenheiro a escolher estratégias de pré-processamento em caso de não ler.

保存为 `outputs/prompt-preprocessing-advisor.md`- Não .

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

## Exercícios

1. **Easy.**扩展 `tokenize`, Deixe URLs  manter para um único Token──测试:`tokenize("Visit https://example.com today.")` deveria gerar um URL Token。
2. **Medium.**实现 Porter passo 1b.`ed`Ou `ing`结尾,移除它──处理双辅音规则(`hopping -> hop`Não é .`hopp`)。
3. **Hard.**Construir um usando WordNet como lemmatizer de tabela de pesquisa, mas quando WordNet  não tem条目时 fallback até seus votadores Porter── em corpus de tags 上衡量它对平面 WordNet 和平面 Porter 的准确率──

## Termos-chave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Token | 一个词 | 模型消耗的任何单位。可以是 word、subword、character 或 byte。 |
| Stem | 词根 | 基于规则的后缀剥离结果。不一定是真实单词。 |
| Lemma | 词典形式 | 你会去查词典的形式。需要语法上下文才能正确计算。 |
| POS tag | Part of speech | 像 NOUN、VERB、ADJ 这样的类别。准确 lemmatization 需要它。 |
| Morphology | 词形规则 | 词如何基于 tense、number、case 改变形式。Lemmatization 依赖它。 |

## Mais leitura

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) Origins, 5 páginas, até hoje ainda é a explicação mais clara.
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features) Verdadeiro oleoduto 如何接线──
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) Você ainda não pensou em tokenization 边界情况──
