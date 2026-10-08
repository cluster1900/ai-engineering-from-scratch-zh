# पीओएस टैगिंग और संश्लेषण पार्सिंग

> व्याकरण एक बार बहुत लोकप्रिय नहीं हुआ। बाद में हर LLM पाइपलाइन को सत्यापित संरचनात्मक निकासी की आवश्यकता थी, यह फिर से वापस आ गया।

**Type:** Build
**Languages:** Python
**先修要求：**चरण 5 · 01 (文本处理), चरण 2 · 14 (नएव बेय)
**Time:** ~45 minutes

## 问题

पाठ 01  प्रतिबद्धता  सीमाकरण  भाषण के भाग टैग की आवश्यकता है `running`यह क्रिया है, समस्याग्रस्त करने वाला इसे वापस करने में असमर्थ है।`run`यदि पता नहीं `better`यह विशेषण है, यह पुनः प्राप्त करने में असमर्थ है`good`

इस प्रतिबद्धता के पीछे एक पूर्ण उप-क्षेत्र है। भाषण टैगिंग का हिस्सा व्याकरणिक श्रेणियों का वितरण करेगा। वाक्यार्थिक पार्सिंग वाक्य के पेड़ संरचना को बहाल करेगाः कौन सा शब्द कौन सा शब्द है, कौन सा क्रिया कौन सा तर्क है।

लेकिन लागू समुदाय 没有──每条结构-extraction pipeline 底层仍在使用 POS 和依赖树──LLM 生成的 JSON 会根据语法限制进行验证──问题答系统 会用依赖性解析 分解查询──机器翻译质量评价者 会检查解析树的对齐──

️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

## 概念

**POS tagging**会为每一个标签 标注语法类别──**Penn Treebank (PTB)**टैगसेट एक अंग्रेजी भाषा का默认选择 है। इसमें 36 टैग हैं, जो सामान्य पाठक के लिए अलग हैं।`NN`एकल संज्ञा`NNS`बहुवचन संज्ञा`NNP`विशेष संज्ञा एकल`VBD`क्रिया अतीत समय ,`VBZ`क्रिया 3rd person singular present, आदि आदि**Universal Dependencies (UD)**टैगसेट 更粗粒度 (१७ 个 टैग),且与语言无关; यह बहुभाषी कार्यों का एक आदर्श विकल्प बन गया है।

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing**एक पेड़ उत्पन्न होगा। मुख्यतः दो प्रकार के पेड़ होंगे।

- **Constituency parsing.**संज्ञा वाक्यांश、 क्रिया वाक्यांश、 पूर्ववचन वाक्यांश 会相互嵌套──输出是一棵非终端类别(NP、VP、PP)组成的树,words 作为叶子──
- **Dependency parsing.**प्रत्येक शब्द में एक मुख्य शब्द होता है जिस पर यह निर्भर करता है,并带有语法关系标签──输出 एक वृक्ष होता है, जिसमें प्रत्येक किनारा एक होता है (मुख, निर्भर, संबंध) तीन-तीन──

निर्भरता विश्लेषण 2010 में 胜出, क्योंकि यह अच्छी तरह से跨语言泛化, विशेष रूप से मुक्त शब्द-क्रम भाषाओं के लिए उपयुक्त है।

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

##  इसे निर्माण

### 步骤 1: सबसे अधिक बार-टैग आधार

नवीनतम लेकिन प्रभावी POS टैगर। प्रत्येक शब्द के लिए, यह प्रशिक्षण में सबसे अधिक बार दिखाई देने वाला टैग है।

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

ब्राउन कॉर्पस ऊपर, यह बेसलाइन  लगभग 85% सटीकता तक पहुंच सकती है अच्छा नहीं लगता, लेकिन यह किसी भी कठोर मॉडल से कम नहीं होना चाहिए

### 步骤 2: बिग्राम एचएमएम टैगर

क्रम की संयुक्त संभावना 建模:

```
P(tags, words) = prod P(tag_i | tag_{i-1}) * P(word_i | tag_i)
```

两张表: संक्रमण संभावनाएं(给定前标签的标签) और उत्सर्जन संभावनाएं(给定标签的词)。用带拉普拉斯滑滑的计算 来估计二者──用Viterbi 解码(在标签网上做动态编程)。

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

बिग्राम एचएमएम ब्राउन में ऊपर तक पहुँचने में लगभग 93% सटीकता प्राप्त करती है। 85% से 93% तक की वृद्धि मुख्य रूप से संक्रमण की संभावनाओं से होती हैः मॉडल सीखना`DET NOUN`很常见, और `NOUN DET`很少见――

### चरण 3: क्यों आधुनिक टैगर्स इसे जीत सकते हैं

संक्रमण + उत्सर्जन संभावनाएं सभी स्थानिक हैं।`saw`"मैंने एक देखा" में संज्ञा है, जबकि "मैंने फिल्म देखी।" में क्रिया है। इसके साथ किसी भी प्रकार की विशेषताएं हैं।

इस कार्य की ऊपरी सीमा टिप्पणीकार असहमति से तय है―― मानव टिप्पणीकारों पेन ट्रीबैंक में% 97% के समय की राय सहमत है―― 98% से अधिक मॉडल बहुत संभावना है कि परीक्षण सेट 过适应──

### 步骤 4: निर्भरता पार्सिंग स्केच

超出本课范围;标准教材讲解见 जुराफस्की और मार्टिन──

- **Transition-based**parsers(arc-eager、arc-standard) जैसे shift-reduce parser 一样工作:它们读取代币,将其转到堆上,并应用减少行动 来创建弧──贪码快速──经典实现是MaltParser──现代神经版本:Chen and Manning 的转型基于解析器──
- **Graph-based**parsers(एस्नर के एल्गोरिथ्म、Dozat-Manning biaffine) 打分,并选择最大跨度树──更慢但更准确──

अधिकांश प्रयुक्त कार्य के लिए, स्थान का प्रयोग करेंः

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

नीचे से ऊपर तक पढ़ लेना`dep`列,句子 की व्याकरण संरचना तब प्रकट होती है

## इसका उपयोग करें

प्रत्येक उत्पादन एनएलपी पुस्तकालय POS तथा निर्भरता पार्सर ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् 

- **spaCy**(`en_core_web_sm`/`md`/`lg`/`trf`)──快速、准确,并与 टोकनाइजेशन + NER + lemmatization 集成──`token.tag_`(पेन)`token.pos_`(UD)`token.dep_`(निर्भरता संबंध)
- **Stanford NLP (stanza)**️ स्टैनफोर्ड को कोरएनएलपी के उत्तराधिकारी ️ 60+ भाषाओं में उन्नत स्तर पर पहुंचना️
- **trankit**पर आधारित ट्रांसफार्मर, यूडी सटीकता बहुत अच्छा
- **NLTK**`pos_tag`可用、较慢、较旧──适合教学──

### यह 2026 में अभी भी महत्वपूर्ण है

- **Lemmatization.**पाठ 01 需要 POS 才能正确 lemmatize──永远如此──
- **Structured extraction from LLM outputs.**验证生成的句子 是否遵守语法限制 (जैसे विषय-क्रियापद समझौते, आवश्यक संशोधन) 
- **Aspect-based sentiment.**निर्भरता पार्स 会告诉你哪个属性 修饰哪个名词──
- **Query understanding.**"वेस एंडरसन द्वारा निर्देशित और बिल मरे के साथ फिल्में"
- **Cross-lingual transfer.**यूडी टैग और निर्भरता संबंध भाषा से जुड़ा नहीं है, समर्थन नई भाषाओं के लिए शून्य-शॉट संरचनात्मक विश्लेषण करने के लिए।
- **Low-compute pipelines.**यदि ट्रांसफार्मर वितरित नहीं कर सकते, तो POS + निर्भरता पार्स + गजटियर 能让你走出意料地远──

## 交付 यह

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

## अभ्यास

1. **Easy.**एक छोटे से टैग किए गए कॉर्पस में (उदाहरण के लिए NLTK के ब्राउन उपसमूह) सबसे अधिक बार-टैग बेसलाइन का उपयोग करके, ऊपर की सटीकता को मापने वाले वाक्यों को मापने के लिए परीक्षण किया गया है।
2. **Medium.**訓練上的bigram HMM,并报告每标签精度/回忆──HMM 最容易混哪些标签?
3. **Hard.**प्रयोग स्पेसाइ का निर्भरता विश्लेषण, 1000 वाक्य के नमूने से 中抽取 विषय-क्रिया-वस्तु त्रिगुटों में।

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| POS tag | Word 的类型 | Grammatical category。PTB 有 36 个；UD 有 17 个。 |
| Penn Treebank | Standard tagset | 针对英语。细粒度区分 verb tenses 和 noun number。 |
| Universal Dependencies | Multilingual tagset | 比 PTB 更粗粒度；language-neutral；cross-lingual work 的默认选择。 |
| Dependency parse | Sentence tree | 每个 word 有一个 head，每条 edge 有一个 grammatical relation。 |
| Viterbi | Dynamic programming | 在给定 emissions 和 transitions 的情况下，找到 probability 最高的 tag sequence。 |

## 延伸阅读

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) POS 和 पार्सिंग के मानक शिक्षण सामग्री व्याख्या──
- [Universal Dependencies project](https://universaldependencies.org/) प्रत्येक बहुभाषी पार्सर शहर का उपयोग कर रहे हैं पार-भाषा टैगसेट और ट्रीबैंक संग्रह
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features) `Token`ऊपर खुला प्रत्येक विशेषता का व्यावहारिक संदर्भ
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf) न्यूरल पार्सर को मुख्यधारा के लेखों में लाने 
