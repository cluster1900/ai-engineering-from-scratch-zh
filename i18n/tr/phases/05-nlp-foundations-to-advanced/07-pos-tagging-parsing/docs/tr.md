# POS Etiketleme ve Sintektiksel Parsing

> Bir kez çok popüler değildi. Sonra her LLM borulaması, yapılandırılmış bir şekilde test edilmesi gerekti.

**Type:** Build
**Languages:** Python
**先修要求：**5 · 01 aşama (文本处理), 2 · 14 aşama (Naive Bayes)
**Time:** ~45 minutes

## 问题

Ders 01  Sözleşme  Çözümlüleştirme  Konuşmanın bir kısmını etiketlemek gerekir──`running`Evet, sözcük, kısıtlayıcı.`run`Bilmezsen`better`Evet, bu bir isimdir.`good`- Evet.

Bu sözcük arkasında tam bir alt alan vardır. Sözcük etiketlemesinin bir kısmı, dilbilimsel kategorileri dağıtır. Sintihtatik inceleme, cümlelerin ağaç yapısını yeniden canlandırır. Hangi kelimeyi değiştirir, hangi fiil hangi argümanları yönlendirir. Klasik NLP, iki şeyi on yıl boyunca geliştirdi.

Ancak uygulanan topluluk 没有──每条结构化-extraction pipeline 底层仍在使用 POS 和依赖树──LLM 生成的 JSON 会根据语法限制进行验证──问题答系统 会用依赖解析 分解查询──机器翻译质量评价者 会检查解析树的对齐──

◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊   ◊ ◊                                                                                                                                                                                                                                  

## 概念

**POS tagging**会为每个标志标注语法类别──**Penn Treebank (PTB)**Etiket İngilizce'de bir seçeneği seçmektedir. 36 etiketi vardır.`NN`tek isim,`NNS`çoğul isim,`NNP`özel isim tek kelime 、`VBD`Geçmiş zamanlı fiil,`VBZ`3rd person singular present, etc.**Universal Dependencies (UD)**daha粗粒度 (,) ve ⇒语言无关; bu diller arası çalışmaların bir seçeneği haline geldi.

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing**Bir ağaç doğurmak için iki biçim vardır.

- **Constituency parsing.**Adım cümleleri、 fiil cümleleri、 telaffuz cümleleri 会相互嵌套──输出是一棵非终端类别(NP、VP、PP)组成的树,words 作为叶子──
- **Dependency parsing.**Her kelime tune bir bağımlı baş kelimesi vardır, tune bir bahçe ilişkisi vardır 标签──输出 is a tree, of which each条 edge tune is a (head, dependent, relation) triple──

2010'larda bağımlılık analizleri 胜出, çünkü çok iyi bir şekilde跨语言泛化, özellikle serbest kelime sırası dillerine uygun olarak 胜出,因为它能很好地跨语言泛化,特别是适合自由单序语言.

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

## Yapın onu.

### 步骤 1: en sık etiketlenen başlangıç çizgisi

En iyi ama etkili POS etiketçisi. Her kelime için, antrenman sırasında en sık ortaya çıkan etiket olduğunu tahmin et.

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

Brown Corpus'ta, bu temel çizgi %85 doğruluğa ulaşabilir.

### 步骤 2: bigram HMM etiketlemeci

Bir dizi için ortak olasılık 建模:

```
P(tags, words) = prod P(tag_i | tag_{i-1}) * P(word_i | tag_i)
```

两张表: geçiş olasılığı(给定前标的标签的标签) 和排放概率(给定标签的词) ――用带拉普拉斯平滑的数 来估计二者──用Viterbi 解码(在标签网上做动态编程)。

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

Bigram HMM Brown'da yukarıda yaklaşık %93 doğruluğa ulaşabilmektedir. %85'ten %93'e kadar yükselen artış, öncelikle geçiş olasılığından kaynaklanmaktadır.`DET NOUN`Çok sık görüyorum.`NOUN DET`Çok az görüyorum.

### 3 adım: Neden modern etiketçiler bunu kazanabilir ?

Değişim + emisyon olasılığı yerleşiktir.`saw`"Bir testere aldım" içi isimdir, "Filmi gördüm" içi ise fiil.

Bu görevin üst sınırı, yorumcu anlaşmazlığıyla belirlenir. İnsan yorumcuları Penn Treebank'ta %97'lik bir zaman görüşüyle görüşmektedir. %98'den fazla model test setine çok fazla uygun olabilir.

### 步骤 4: bağımlılık analiz çizelgesi

Zücüm tam olarak gerçekleşen bağımlılık analizleri 超出本课范围; standart教材讲解见 Jurafsky ve Martin──

- **Transition-based**parsers(arc-eager、arc-standard) gibi shift-reduce parser 一样工作:它们读取代币,将其转到堆上,并应用减少行动 来创建弧──贪解码 很快──经典实现是 MaltParser──现代神经版本:Chen and Manning 的转型基于的解析器──
- **Graph-based**Parserler(Eisner'ın algoritması、Dozat-Manning biaffine) 打分,并选择最大跨度树──更慢但更准确──

Çoğu uygulanan iş için, spacy'yi kullanın:

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

Aşağıdan yukarıya oku .`dep`列,句子'un gramer yapısı ortaya çıkıyor.

## Kullan

Her üretim NLP kütüphanesi POS ve bağımlılık parçacıkları olarak standart boru hattının bir parçası olarak sağlıyor.

- **spaCy**(`en_core_web_sm`- Ne ?`md`- Ne ?`lg`- Ne ?`trf`)──快速、准确,并与令牌化 + NER + lemmatization 集成──`token.tag_`- Evet.`token.pos_`(UD)`token.dep_`( bağımlılık ilişkisi)
- **Stanford NLP (stanza)**❖ Stanford, CoreNLP'nin halefi için 60+ dilde en son teknolojiye ulaştı.
- **trankit**Transformer'a dayalı, çok iyi.
- **NLTK**- Evet.`pos_tag`❖ kullanılabilir ❖ daha yavaş ❖ daha eski ❖ uygun eğitim ❖

### 2026 yılında hâlâ önemli bir yer.

- **Lemmatization.**Ders 01 需要 POS 才能正确 lemmatize──永远如此──
- **Structured extraction from LLM outputs.**验证生成的句 是否遵守语法限制 (örneğin konu-hizmeti anlaşması, gerekli değişiklikler)
- **Aspect-based sentiment.**İstilik incelemeleri sana hangi adetifi söyleyecek, hangi isim değiştirmek.
- **Query understanding.**"Bill Murray'nin başrolde Wes Anderson yönettiği filmler"
- **Cross-lingual transfer.**UD etiketler ve bağımlılık ilişkileri, yeni dillere sıfır çekim yapılı analiz yapılmasına destek yoktur.
- **Low-compute pipelines.**Eğer transformatörü teslim edemezsen, POS + bağımlılık analizleri + gazetter seni beklenmedik bir şekilde uzaklara çıkarır.

## - Söyle.

保存为 `outputs/skill-grammar-pipeline.md`- ...

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

1. **Easy.**Bir küçük etiketlenmiş corpusta (örneğin NLTK'nin Brown alt kümesi) en sık etiketlenen temel çizgiyi kullanarak, yapılmış cümlelerin ölçülmesi, yukarıdaki doğruluğu test ederken %85'lik sonuçlar elde edilir.
2. **Medium.**訓練上のビッググラム HMM,并報告 標籤 精度/追回──HMM 最容易混 Hangi etiketler?
3. **Hard.**Use spaCy'nin bağımlılık analizi, 1000 cümle örnekinden 中抽取主题-verb-object triples──在 50 个手工标注的三倍上评估──记录抽取 失败的位置──通常是动态、协调和被除的主题)──

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
- [Universal Dependencies project](https://universaldependencies.org/) Her çok dilli analizci şehirçe kullanır.
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features) `Token`Ünlü açık her bir özelliğin pratik referansı
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf)                                                                                                                                                                                                                                                              
