# पाठ प्रसंस्करण  टोकनकरण, स्टemming, लेमिटाइजेशन

> 语言是连续的.模型是离散的.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## समस्या

模型不能读读" बिल्लियों दौड़ रहे थे. "──它读取是整数──

प्रत्येक एनएलपी प्रणाली तीनों समान प्रश्नों से शुरू होती है। शब्द से शब्द की जड़ क्या है? हम कैसे "चलने" को एक ही चीज के रूप में, "चलने" को एक ही चीज के रूप में, और फिर उन्हें एक ही चीज के रूप में अलग चीजों के रूप में, "चलने" को एक ही चीज के रूप में, "चलने" को एक ही चीज के रूप में, "चलने" को एक ही चीज के रूप में, "चलने" को एक ही चीज के रूप में, "चलने" को एक ही चीज के रूप में, "चलने" को एक ही चीज के रूप में, "चलने" को एक ही चीज के रूप में, "चलने" को एक ही चीज के रूप में, "चलने" के रूप में, "चलने" के रूप में एक ही चीज के रूप में, "चलने" के रूप में, "चलने" के रूप में एक ही चीज के रूप में।

टोकनाइज़ेशन गलत है, मॉडल कचरे से सीख जाएगा.`don't`जब एक टोकन बनाया, तो उसे फेंक दिया`do n't`जब दो टोकन, प्रशिक्षण वितरण हो गया है तो टूट गया है.`organization`和 `organ`压成同一个干,主题建模就完成了──如果你的 lemmatizer 需要部分的演讲上下文但你没有传入,动词就会被当作名词处理──

इस कक्षा में इन तीन पूर्व-संसाधित चरणों को शून्य से निर्माण से शुरू किया जाएगा, फिर यह दिखाया जाएगा कि NLTK और spaCy  कैसे एक ही काम करते हैं, जिससे आप उनमें से एक को स्पष्ट कर सकें।

## अवधारणा

तीनों कामों में से प्रत्येक में अपनी-अपनी जिम्मेदारी और असफलता होती है।

**Tokenization**इस शब्द का अर्थ है, क्योंकि सही मात्रा कार्य पर निर्भर करती है। क्लासिक एनएलपी शब्द-स्तर का उपयोग करता है।

**Stemming**उपयोग नियम कटौती के बाद🏼快激进粗🏼`running -> run``organization -> organ` दूसरा है विफलता मोड

**Lemmatization**प्रयोग语法知识把词还原为词典形式──更慢、更准确, खोज तालिका या स्वरूपात्मक विश्लेषक की आवश्यकता──`ran -> run`(आवश्यकता यह जानना है कि "रन" का अतीत है)`better -> good`(आवश्यकता है कि तुलनात्मक रूप से जानें)

经验法则──速度重要且可忍受噪音时使用源源的搜索索引,粗略分类)──语义重要时使用化问题答,语义搜索,任何用户会阅读的内容)──


```figure
edit-distance
```

## इसे बनाओ

### चरण 1: एक regex शब्द टोकन

सबसे सरल उपयोगी टोकन बनाने वाला, गैर-अक्षर संख्यात्मक वर्णों के अनुसार होगा, साथ ही अपने टोकन के लिए अंक को बनाए रखेगा।

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

तीन पैटर्न 按优先排列──带可选内部撇号的词`don't``it's`)。 शुद्ध संख्याएँ。 कोई भी एकल गैर-खाली सफेद、 गैर-अक्षर संख्यात्मक वर्ण स्वतंत्र टोकन के रूप में

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

需要注意的失败模式──`3pm`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `['3', 'pm']`, क्योंकि हम अक्षर और संख्यात्मक खंड के बीच आदान-प्रदान करते हैं। अधिकांश कार्यों के लिए पर्याप्त अच्छा है। यूआरएल, ईमेल, हैशटैग समस्याएं पैदा करते हैं।

### चरण 2: एक पोर्टर वोटर्स(केवल चरण 1a)

पूर्ण पोर्टर एल्गोरिथम में पांच नियम चरण हैं  केवल चरण 1a में सबसे आम अंग्रेजी के बाद  को कवर किया गया है, यह इस मॉडल को स्पष्ट कर सकता है 

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

按从上到下读取规则──`ies -> i`नियम यही है`ponies -> poni`नहीं `pony`कारणों ः वास्तविक पोर्टर के पास चरण 1 बी है, इसे सुधार देगा। नियम प्रतिस्पर्धा करेंगे। पहले के नियम जीतेंगे। किसी भी नियम से क्रम अधिक महत्वपूर्ण है।

### चरण 3: एक खोज आधारित lemmatizer

वास्तविक लेमाकरण  आवश्यक रूप विज्ञान ∙ एक शिक्षण योग्य संस्करण लघु लेमा तालिका व fallback ∙

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

अंतिम उदाहरण महत्वपूर्ण शिक्षण बिंदु है।`watched`हमारे मेज पर नहीं है, और पतन केवल संभाल `ing`                                                                                                                                                                                                                                                              `ed`、不规则动词、比较级形容词、带音变的复数(`children -> child`)― यही कारण है कि उत्पादन प्रणाली वर्डनेट, स्पेस साइ के मॉर्फोलॉजिज़र या पूर्ण मॉर्फोलॉजिकल एनालिज़र का उपयोग करती है―

### चरण 4: उन्हें एक साथ रखें

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

缺失一块是POS Tagger──Phase 5 · 07 (POS Tagging) 会构建一个──现在,默认全部为 `NOUN`, इस सीमा को स्वीकार नहीं किया.

## इसका प्रयोग करें

एनएलटीके और स्पेससी 提供生产版本──各自只需要几行──

### एनएलटीके

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

`word_tokenize`संकुचनों को संभालेंगे, यूनिकोड, और आपके रेजेक्स को खोने की सीमाओं की स्थिति।`PorterStemmer`मैं पूरे पांच चरणों में काम करूंगा।`WordNetLemmatizer`需要把 POS टैग from NLTK की Penn Treebank scheme 翻译到 WordNet का संक्षिप्त संग्रह ऊपर。

### स्पाइसी

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

अंतरिक्ष को पूरी पाइपलाइन में छिपा कर रखें`nlp(text)`后面── टोकनाइजेशन、POS टैगिंग 和 lemmatization 都会运行── बड़े पैमाने पर समय NLTK से अधिक तेजी──开箱即用更准确──取舍是你不容易替换单个组件──

### 什么时候选择哪个

| Situation | Pick |
|-----------|------|
| 教学、研究、替换组件 | NLTK |
| 生产、多语言、速度重要 | spaCy |
| Transformer pipeline（反正你会用模型自己的 Tokenizer） | 使用 `tokenizers` / `transformers`，跳过经典 preprocessing |

### 没人提醒你的两个失败模式

अधिकांश शिक्षण केवल एल्गोरिदम के बारे में बात करते हैं, फिर बस रुक जाते हैं। वास्तविक प्रीप्रोसेसिंग पाइपलाइन दो चीजों से ग्रस्त होगी, और वे लगभग कभी नहीं कवर की जाती हैं।

**Reproducibility drift。**NLTK और spaCy में संस्करणों के बीच परिवर्तन होगा टोकनकरण और lemmatizer  व्यवहार ⋅ में spaCy 2.x में उत्पन्न `['do', "n't"]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `["don't"]`आपका मॉडल एक वितरण पर प्रशिक्षित है  इन्फेरेंस अब दूसरे वितरण पर चल रही है  सटीकता दर घट रही है, जबकि कोई कारण नहीं जानता `requirements.txt`中固定图书馆 版本──写一个预处理回归测试,结 20 个例句子的预期代码化──每次升级都运行它──

**Training / inference mismatch。** प्रशिक्षण समय उपयोग कर प्रवर्धन पूर्वप्रसंस्करण (उत्पादन)  लोअरफ़ेस  स्टॉपवर्ड हटाने  ध्वनि), तैनाती समय  मूल उपयोगकर्ता प्रविष्टि, फिर प्रदर्शन टूट जाते हैं। यह सबसे आम उत्पादन NLP विफलता है।

## इसे भेजें

एक दोहराया जा सकता है त्वरित, मदद इंजीनियर में चयन पूर्व प्रसंस्करण रणनीति

保存为 `outputs/prompt-preprocessing-advisor.md`:

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

## व्यायाम

1. **Easy.**扩展 `tokenize`, 让URLs 保持为单个代码──测试:`tokenize("Visit https://example.com today.")`एक URL टोकन उत्पन्न करना चाहिए。
2. **Medium.**实现 Porter चरण 1b. यदि एक शब्द में वेंटिलेटर शामिल हो`ed`या `ing`结尾,移除它──处理双辅音规则(`hopping -> hop`, नहीं `hopp`)。
3. **Hard.**निर्माण एक उपयोग WordNet  के रूप में खोज तालिका के lemmatizer, लेकिन जब WordNet  के बिना条目时 fallback आपके Porter stemmer──在标签 corpus上衡量它相对简单 WordNet 和简单 Porter 的准确率──

## प्रमुख शर्तें

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Token | 一个词 | 模型消耗的任何单位。可以是 word、subword、character 或 byte。 |
| Stem | 词根 | 基于规则的后缀剥离结果。不一定是真实单词。 |
| Lemma | 词典形式 | 你会去查词典的形式。需要语法上下文才能正确计算。 |
| POS tag | Part of speech | 像 NOUN、VERB、ADJ 这样的类别。准确 lemmatization 需要它。 |
| Morphology | 词形规则 | 词如何基于 tense、number、case 改变形式。Lemmatization 依赖它。 |

## आगे पढ़ना

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) 原始文,五页,至今仍是最清晰的解释──
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features) सच्ची पाइपलाइन 如何接线──
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) आप भी नहीं सोचा था टोकनकरण 边界情况──
