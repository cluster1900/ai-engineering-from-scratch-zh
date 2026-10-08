# L' étiquetage POS et le partage syntaxique

> La grammaire n'est pas très populaire.

**Type:** Build
**Languages:** Python
**先修要求：**Phase 5 · 01 (文本处理), phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

##  problématique

Leçon 01  promises, lématisation  besoin de part de la marque de discours `running`C'est un verbe, un limitateur, on ne peut pas le récupérer.`run`Si je ne sais pas`better`C'est un adjectif, il ne peut pas être récupéré.`good`Il y a une autre.

Cette promesse est fondée sur un sous-domaine complet. Le partage de la parole répartit les catégories grammaticales. Le parsing syntaxique rétablit la structure du mot.

Mais la communauté appliquée 没有──每条结构-extraction pipeline 底层仍然在使用POS 和依赖树──LLM 生成的JSON 会根据语法限制进行验证──问题答系统 会用依赖性解析 分解查询──机器翻译质量评价人员 会检查解析树的对齐──

Il est important de comprendre qu'il est nécessaire de mettre en place des modèles de base et de mettre en œuvre des modèles de base.

## 概念

**POS tagging**会为每个标志标注 grammatical category。**Penn Treebank (PTB)**Le tagset est un choix par défaut en anglais. Il a 36 tags, séparés par un petit nombre de mots:`NN`nom singulier`NNS`nom pluriel`NNP`nom propre singulier`VBD`verbe passé temps ,`VBZ`verbe 3ème personne singular présent, etc.**Universal Dependencies (UD)**Il est devenu un ouvrage multilingue.

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing**Il y aura deux types de styles:

- **Constituency parsing.**Les phrases de notions, les phrases verbales, les phrases prépositionnelles 会相互嵌套──输出是一棵非终端类别(NP、VP、PP)组成的树,words 作为叶子──
- **Dependency parsing.**Chaque mot, ville, a un mot-clé qui en dépend,并带有语法关系标签──输出是一棵树,其中每条边都是一个 (head, dependent, relation) triple──

Le partage de la dépendance a gagné en 2010 parce qu'il peut très bien se transformer en langage général, en particulier en termes de langages à ordre de mots libre.

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

## - Je le construis.

### 步骤 1: ligne de base de la balise la plus fréquente

Le plus efficace, mais le plus efficace, est le plus fréquent dans l'entraînement.

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

Dans le corpus brun, cette ligne de base peut atteindre environ 85% de précision.

### 步骤 2: étiquetteur HMM à gros

Pour la probabilité commune de la séquence 建模:

```
P(tags, words) = prod P(tag_i | tag_{i-1}) * P(word_i | tag_i)
```

两张表:probabilités de transition ((给定前标的标签) 和排放概率 ((给定标签的词) 』

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

Le Bigram HMM en brown est capable d'atteindre une précision d'environ 93%.`DET NOUN`Je suis toujours là.`NOUN DET`Je ne vois pas.

### 3ème étape: Pourquoi les taggers modernes peuvent-ils le surmonter ?

Les probabilités de transition + d'émission sont locales.`saw`Le CRF (environ 97%), le BiLSTM-CRF ou le transformateur (environ 98%+) est un facteur de référence.

Les annotateurs humains en Penn Treebank en moyenne 97% du temps sont d'accord. Plus de 98% des modèles sont très susceptibles de s'adapter au jeu de tests.

### 步骤 4: schéma de partage de la dépendance

De la dépistage de la dépendance à l'échelle de la formation à partir de zéro complet, il faut connaître deux familles classiques:

- **Transition-based**Les parseurs (arc-eager、arc-standard) sont des parseurs qui réduisent les changements. Ils prennent des jetons, les déplacent vers la pile, et les réduisent.
- **Graph-based**Les parseurs (algorithme d'Eisner, Dozat-Manning) vont choisir le plus grand arbre d'étendue possible.

Pour la plupart des travaux appliqués, il faut utiliser l'espace:

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

De bas à haut`dep`La structure grammaticale des phrases apparaît.

## Utilisez-le

Chaque bibliothèque de PNL de production fournit des POS et des partageurs de dépendance comme une partie du pipeline standard.

- **spaCy**(le secteur de l'énergie)`en_core_web_sm`- Je suis là .`md`- Je suis là .`lg`- Je suis là .`trf`)──快速、准确,并与令牌化 + NER + lemmatization 集成──`token.tag_`Je suis désolé.`token.pos_`(UD)`token.dep_`(relation de dépendance)
- **Stanford NLP (stanza)**❖ Stanford pour les rédacteurs de CoreNLP ❖ dans plus de 60 langues ❖ atteindre l'état de l'art ❖
- **trankit**Basé sur le Transformer, la précision du U.D. est très bonne.
- **NLTK**Il y a une autre.`pos_tag`◊可用、较慢、较旧── adapté à l'enseignement。

### C'est toujours important en 2026.

- **Lemmatization.**Leçon 1: il faut être prêt à faire des choses.
- **Structured extraction from LLM outputs.**验证生成的句子 是否遵守语法限制 (exemple accord sujet-verbe 需要修改)
- **Aspect-based sentiment.**Les parses de dépendance vous diront quel adjectif modifier quel nom.
- **Query understanding.**"films réalisés par Wes Anderson avec Bill Murray"
- **Cross-lingual transfer.**Les tags UD et les relations de dépendance avec les langues sont inchangés, soutenir la réalisation d'une analyse structurée à zéro impact sur les nouvelles langues.
- **Low-compute pipelines.**Si vous ne pouvez pas livrer le transformateur, le POS + le partage de dépendance + le gazeteur 能让您走出意料地远.

## Je le livre.

保存为 `outputs/skill-grammar-pipeline.md`- Le numéro de la liste:

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

1. **Easy.**Dans un petit corpus de balises (par exemple, le sous-ensemble Brown de NLTK) en utilisant la ligne de base de balises la plus fréquente, mesurer la précision des phrases retenues.
2. **Medium.**訓練上的bigram HMM,并报告每标签精度/回忆──HMM 最容易混哪些标签?
3. **Hard.**Utilisez la dépendance de l'espace, en extraisant des trois fois le sujet-verbe-objet à partir d'un échantillon de 1000 phrases.

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| POS tag | Word 的类型 | Grammatical category。PTB 有 36 个；UD 有 17 个。 |
| Penn Treebank | Standard tagset | 针对英语。细粒度区分 verb tenses 和 noun number。 |
| Universal Dependencies | Multilingual tagset | 比 PTB 更粗粒度；language-neutral；cross-lingual work 的默认选择。 |
| Dependency parse | Sentence tree | 每个 word 有一个 head，每条 edge 有一个 grammatical relation。 |
| Viterbi | Dynamic programming | 在给定 emissions 和 transitions 的情况下，找到 probability 最高的 tag sequence。 |

## 延伸阅读

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) POS 和 parsing 
- [Universal Dependencies project](https://universaldependencies.org/) Chaque parseur multilingue utilise un ensemble de balises multilingue et une collection de la banque d'arbres.
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features) `Token`Références pratiques de chaque attribut de la mise en évidence
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf) Le partageur neural 带入主流论文
