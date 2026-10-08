# Tagging POS e Parsing sintático

> Gramática uma vez não foi muito popular. Depois, cada linha de LLM precisava de um teste estruturado.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 01 (文本处理), Fase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## 问题

Lição 01  Promessa, lematização  precisa de parte de tag de discurso―`running`É um verbo, um limitador, não pode voltar a ser.`run`Se não soubesse`better`É adjetivo, é incapaz de recuperar.`good`- Não.

Esta promessa está por trás de um sub-área completo. Parte da etiquetação de fala irá distribuir categorias gramaticais. Parsificação sintática irá recuperar a estrutura de árvore das sentenças.

Mas a comunidade aplicada 没有──每条结构-extraction pipeline 底层仍在使用 POS 和依赖树──LLM 生成的 JSON 会根据语法限制进行验证──问题答系统 会用依赖解析 分解查询──机器翻译质量评审员 会检查解析树的对齐──

 Valor de saber: ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■

## 概念

**POS tagging**会为每个标签 标注 语法类别──**Penn Treebank (PTB)**Tagset é um tag em inglês. Ele tem 36 tags, que o leitor comum vai perceber escolhendo:`NN`singular substantivo,`NNS`substantivo plural,`NNP`Propietário singular`VBD`Verbo passado tempo ,`VBZ`Verbo 3a pessoa singular presente, etc.**Universal Dependencies (UD)**Tagset 更粗粒度 (?? 个标签),且与语言无关; já se tornou uma escolha preferida de trabalho translanguagem.

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing**"A gente tem um arvore".

- **Constituency parsing.**Frases de substantivo, verbos, proposições, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, palavras, como folhas, como folhas, como as categorias, não são sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem sem
- **Dependency parsing.**Cada palavra cidade tem uma palavra-chave que depende dela,并带有语法关系标签──输出是一棵树,其中每条边都是一个 (head, dependent, relation) triplio──

A análise de dependência ganhou grande sucesso nos anos 2010, pois pode muito bem transcender a generalização linguística, especialmente para as línguas de ordem de palavras livre.

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

## Construí-lo

### 步骤 1: linha de base de tag mais frequente

O mais eficaz, mas eficaz, tagger de POS. Para cada palavra, prevê-lo como o tag mais comum no treino.

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

No corpo marrom, esta linha de base pode alcançar uma precisão de cerca de 85%. Não é bom, mas é um modelo rigoroso.

### 步骤 2: Bigram HMM tagger

Para a probabilidade conjunta da sequência 建模:

```
P(tags, words) = prod P(tag_i | tag_{i-1}) * P(word_i | tag_i)
```

两张表:probabilidades de transição ((给定前标的标签) 和排放概率 ((给定标签的词) 』 用带拉普拉斯平滑的数 来估计二者── 用 Viterbi 解码(在标签网上做动态编程) 』

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

Bigram HMM em Brown é capaz de atingir cerca de 93% de precisão.`DET NOUN`É muito comum.`NOUN DET`- Não.

### Passo 3: Por que os taggers modernos conseguem superá-lo

As probabilidades de transição + de emissão são locais.`saw`Em "Eu comprei uma serra" é um substantivo, e em "Eu vi o filme". é um verbo.

A limitação de essa tarefa é determinada pela discordância dos anotadores.

### 步骤 4: dependência parsing esboço

Desde zero completo realçar a dependência de parsing 超出本课范围; standar教材讲解见 Jurafsky e Martin── necessita de conhecer duas famílias clássicas:

- **Transition-based**parsers(arc-eager、arc-standard) Como parser de redução de mudanças 一样工作:它们读取代币,将其转到堆上,并应用减少行动 来创建弧──贪码 快快──经典实现是 MaltParser──现代神经版本:Chen and Manning 的转变基于解析器──
- **Graph-based**Parsers(Algorithm de Eisner、Dozat-Manning biaffine) 打分,并选择最大跨度树──更慢但更准确──

Para a maioria dos trabalhos aplicados, é necessário utilizar:

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

De baixo para cima .`dep`A estrutura gramatical das palavras aparece.

## Use-o

Cada biblioteca de produção de PNL fornece POS e parseres de dependência como parte do pipeline padrão.

- **spaCy**(`en_core_web_sm`- Não .`md`- Não .`lg`- Não .`trf`)──快速、准确,并与代币化 + NER + lemmatization 集成──`token.tag_`- Não.`token.pos_`(UD)`token.dep_`(relação de dependência)
- **Stanford NLP (stanza)**❖ Stanford para os reitores do CoreNLP ❖ em mais de 60 idiomas ❖ alcançar o estado da arte ❖
- **trankit**Baseado no Transformer, precisão de U.D. é muito boa.
- **NLTK**- Não.`pos_tag`△可用、较慢、较旧──适合教学──

### Isto ainda é importante em 2026.

- **Lemmatization.**Lição 01 需要 POS 才能正确 lemmatize──永远如此──
- **Structured extraction from LLM outputs.**验证生成的句子 是否遵守语法限制 (por exemplo, acordo entre sujeito e verbo, modificações necessárias)
- **Aspect-based sentiment.**Os parses de dependência vão dizer-te qual adjetivo modificar qual substantivo.
- **Query understanding.**"filmes dirigidos por Wes Anderson com Bill Murray"
- **Cross-lingual transfer.**Tags UD 和 dependência relações com linguagem
- **Low-compute pipelines.**Se não conseguir entregar transformador, POS + dependência parse + gazetteer 能让你走出意料地远.

## Entrega-o

保存为 `outputs/skill-grammar-pipeline.md`- Não .

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

## 练习

1. **Easy.**Em um corpus de pequenos tags (por exemplo, o subconjunto Brown do NLTK) usando a linha de base de tag mais frequente, a medição de frases mantidas de cima da precisão.
2. **Medium.**訓練上のビッググラム HMM,并報告每タグ精度/追回──HMM 最容易混哪些タグ?
3. **Hard.**Utilize spaCy's dependence parse, extrair de 1000 frases sample 中抽取主题-verb-object triples──在 50 个手工标注的三倍上评估──记录提取 失败的位置──通常是动态、协调和被除的主题)──

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| POS tag | Word 的类型 | Grammatical category。PTB 有 36 个；UD 有 17 个。 |
| Penn Treebank | Standard tagset | 针对英语。细粒度区分 verb tenses 和 noun number。 |
| Universal Dependencies | Multilingual tagset | 比 PTB 更粗粒度；language-neutral；cross-lingual work 的默认选择。 |
| Dependency parse | Sentence tree | 每个 word 有一个 head，每条 edge 有一个 grammatical relation。 |
| Viterbi | Dynamic programming | 在给定 emissions 和 transitions 的情况下，找到 probability 最高的 tag sequence。 |

## 延伸阅读

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) POS 和 parsing 的标准教材讲解──
- [Universal Dependencies project](https://universaldependencies.org/) Cada parcer multilingue utilizou um tagset interlingual e uma coleção de treebank.
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features)- Não .`Token`Referência prática de cada atributo de cima aberto.
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf) Trazer os parceros neurais  para o trabalho principal.
