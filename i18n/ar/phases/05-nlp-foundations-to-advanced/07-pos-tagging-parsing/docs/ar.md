# التسمية POS والتحليل المزمن

> اللغة لم تكن منتشرة جدا. بعد ذلك كل خط أنابيب ماجستير في العلوم الطبية تحتاج إلى تأكيد الهيكلية.

**Type:** Build
**Languages:** Python
**先修要求：**المرحلة 5 · 01 (文本处理) ، المرحلة 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## 问题

الدرس 01  التعهد  التحدّث  الحاجة إلى علامة جزء من الخطاب`running`نعم فعل، لا يمكن أن يعيد ذلك`run`إذا لم أعرف `better`هو صفت، فإنه لا يمكن أن تستعيد`good`.

هذا الوعد خلفه يخفي في مجال فرعي كامل. سيتم توزيع علامات النطق على فئات صفرية. سيتم تحليل الحلويات. سيتم استعادة الجملة على النظام الشجري.

ولكن المجتمع التطبيقي 没有──每条结构-extraction pipeline 底层仍在使用 POS 和依赖树──LLM 生成的 JSON 会根据语法限制进行验证──问题答系统 会用依赖解析 分解查询──机器翻译质量评价人员 会检查解析树的对齐──

值得了解──本课介绍标签、基本线,以及什么时候应该停止从零实现、转而调用空间Cy──

## 概念

**POS tagging**会为每个代号标注语法类别。**Penn Treebank (PTB)**التجست هي اختيار مرموم باللغة الإنجليزية.`NN`اسم واحد`NNS`اسم متعدد`NNP`اسم خاص واحد`VBD`فعل الماضي الوقت ،`VBZ`الفعل الشخص الثالث المتفرد الحاضر، و...**Universal Dependencies (UD)**أكثر من 17 علامة) ، و مع لغة لا علاقة لها؛ لقد أصبح من العمل عبر اللغات الاختيار المقرر.

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing**سوف تولد شجرة.

- **Constituency parsing.**عبارات اسمية 、عبارات فعل 、عبارات تعبيرية 会相互嵌套──输出是一棵 فئة غير نهائية 、NP、VP、PP) متشكلة شجرة، كلمات 作为 leaves──
- **Dependency parsing.**كل كلمة مدة لديها كلمة رأس تعتمد عليها،并带有语法ية العلاقة 标签──输出是一棵, منها كل条边都是一个 (رأس, يعتمد, العلاقة) ثلاثى──

تحليل الاعتماد في 2010s 胜出، لأنه يمكن أن يكون جيداً عبر اللغة العامة، وخاصة مع لغات الترتيب الحر الكلمات.

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

## بناءها

### الخطوة 1: نقطة أساسية الأكثر تكرارًا

أحدث و لكن فعالة علامة POS على كل كلمة، توقع أنها تظهر بشكل متكرر في التدريب

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

في الجسم البني، يمكن أن يصل هذا الخط الأساسي إلى نسبة دقة حوالي 85%.

### 步骤 2: علامة HMM الكبيرة

على احتمالية المشتركة من الترتيبات

```
P(tags, words) = prod P(tag_i | tag_{i-1}) * P(word_i | tag_i)
```

两张表:احتمالات الانتقال ((给定前标签的标签) واحتمالات الانبعاثات ((给定标签的词) 』 用带拉普拉斯平滑的计算 来估计二者── 用 Viterbi 解码(在标签网上做动态编程) 』

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

البيجرام HMM في براون 上能达到 93% من الدقة.`DET NOUN`很常见,而 `NOUN DET`很少见──

### الخطوة الثالثة: لماذا يمكن للكاتب الحديث أن يُغلب عليه

احتمالات الانتقال + الانبعاثات هي محلية`saw`في "شريعتُ ورقةً" وسط اسم، وفي "شاهدتُ الفيلم". وسط فعل، مع أي خصائص ((صورة الكلمة، صيغة الكلمة، ولفظها، والذي يُسمى بالمرجع الصناعي) يمكن أن يصل إلى حوالي 97٪.

يحدد الحد الأقصى لهذا المهمة خلاف الملاحظين. يحدد الملاحظين البشريين في بن تريبانك حوالي 97% من الوقت.

### 步骤 4: رسم تحليل الاعتماد

من صفر كامل تحقيق الادعاء الفحوصات 超出本课范围;标准教材讲解见 جورافسكي و مارتن.

- **Transition-based**parsers(arc-eager、arc-standard) مثل parser shift-reduce 一样工作:它们读取代币,将其转到堆上,并应用减少行动 来创建弧──贪解码 很快──经典实现是 MaltParser──现代神经版本:Chen and Manning 的转型基于解析器──
- **Graph-based**أجزاء (ألغوريتم إيزنر、دوزات-مانينغ بيافين) سوف تكون على حافة متعلقة بالرأس من كل شكل ممكن 打分,并选择最大跨度 tree──更慢但更准确──

بالنسبة لمعظم الأعمال المطبقة، استغلال الفضاء:

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

من أسفل إلى أعلى`dep`الهيكل الجهري للقواعد سوف يظهر

## استخدمها

كل مكتبة إنل بي الإنتاج تمتلك نقاط التداول والاعتماد كجزء من خط الأنابيب القياسي.

- **spaCy**(`en_core_web_sm`- لا ، لا`md`- لا ، لا`lg`- لا ، لا`trf`)──快速、准确,并与令牌化 + NER + ليمتيزيشن 集成──`token.tag_`(بين)`token.pos_`(UD)`token.dep_`(علاقة الاعتماد)
- **Stanford NLP (stanza)**ستانفورد على خلفي كورين إين إل بي. في 60+ لغة
- **trankit**على أساس المحول، دقة الدبلوماسية جيدة
- **NLTK**.`pos_tag`❖ قابل الاستخدام ❖ ધીر ❖ قديم ❖ مناسب للتدريس

### هذا ما زال مهمًا في عام 2026

- **Lemmatization.**الدرس 01  بحاجة إلى POS 才能正确 lemmatize──永远如此──
- **Structured extraction from LLM outputs.**验证生成的句子 是否遵守语法ية القيود ((مثل اتفاق الموضوع الفعل
- **Aspect-based sentiment.**أبحاث الإعتماد سوف تخبرك أي صفت 修饰 أي اسم
- **Query understanding.**"الأفلام التي قام بها (ويس أندرسون) بتمثيل (بيل موراي) "
- **Cross-lingual transfer.**علامات UD و علاقات الاعتماد مع لغات لا علاقة لها، دعم لـ لغات جديدة إجراء تحليل مهيكلي صفر إطلاق.
- **Low-compute pipelines.**إذا لم تتمكن من تسليم المحول، فيمكنك أن تتحرك بعيداً عن المتوقع

## 交付 it

保存为 `outputs/skill-grammar-pipeline.md`:

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

## التدريب

1. **Easy.**في مجموعة صغيرة من العلامات المعلقة مثل NLTK (بناء على الفرعية البنية) باستخدام أساس العلامات الأكثر تكرارًا ، قياس دقة الجملة العالية.
2. **Medium.**訓練上的bigram HMM,并报告每标签精度/回忆──HMM 最容易混哪些标签?
3. **Hard.**استخدام استخدام الاختبار الإعتمادية من الفضاء، من عينة 1000 جملة 中抽取主题-verb-object triples.

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| POS tag | Word 的类型 | Grammatical category。PTB 有 36 个；UD 有 17 个。 |
| Penn Treebank | Standard tagset | 针对英语。细粒度区分 verb tenses 和 noun number。 |
| Universal Dependencies | Multilingual tagset | 比 PTB 更粗粒度；language-neutral；cross-lingual work 的默认选择。 |
| Dependency parse | Sentence tree | 每个 word 有一个 head，每条 edge 有一个 grammatical relation。 |
| Viterbi | Dynamic programming | 在给定 emissions 和 transitions 的情况下，找到 probability 最高的 tag sequence。 |

## 延伸阅读

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) POS و parsing ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬
- [Universal Dependencies project](https://universaldependencies.org/) كل محلل متعدد اللغات مدينة تستخدم مجموعة من التغوطات متعددة اللغات و مجموعة من البنوك التجارية
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features) `Token`إشارة عملية لكل سمة من الصفات المفتوحة
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf) إدخال المفصلات العصبية إلى مقالات رئيسية
