# Metin İşlemesi  Tokenizasyon, Stemming, Lemmatizasyon

> 语言是连续的. 模型是离散的.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## Sorun

Model cannot read "Kediler koşuyordu".

Her bir NLP sistemi aynı üç sorundan başlar. Sözlerin kökü nedir? Nasıl yardım ederken "hareket" ‒ "hareket" ‒ "hareket" ‒ "hareket" ‒ aynı şey olarak, yardımsızken farklı şeyler olarak kullanırız?

Tokenizasyon hatalıdır, model çöpten öğrenir. Tokenizer'in varsa onu kullan.`don't`Bir işaret olarak, bir işaret olarak.`do n't`İki tane token kullanırken, bir tane dağıtıldı.`organization`和 `organ`压成同一个干,topic modeling就完成了──如果你的 lemmatizer 需要部分的演讲上下文但你没有传入,动词就会被当作名词处理──

Bu ders, bu üç önceden işleme adımını sıfırdan inşa ederek, sonra NLTK ve spaCy'nin aynı işi nasıl yapacağını gösterir ve bunların nasıl yapıldığını görmenizi sağlar.

## Anlaşım

Üç işlem. Herkesin kendi sorumlulukları ve başarısızlık modusu var.

**Tokenization**Bu kelime anlamı belirsiz kalmaya devam ediyor çünkü doğru ölçüm görevden alındığı için. Klasik NLP Söz seviyesini kullanıyor.

**Stemming**Kullanılan kuralları kesip atmak için.`running -> run`- Evet.`organization -> organ`İkinci, başarısızlık modudur.

**Lemmatization**Daha yavaş, daha doğru, arama tablosu veya morfolojik analizer gerektirir.`ran -> run`(Run'un "Run"ın geçmişini bilmem gerek)`better -> good`(Bilmek gerekir)

经验法则──速度重要且可忍受噪音时使用源源的搜索索索引、粗略分类)──语义重要时使用化──问题回答、语义搜索、任何用户会阅读的内容)──


```figure
edit-distance
```

## Yapın

### Adım 1: Bir regex kelime işaretleyicisi

En basit kullanışlı Tokenizer, simgesel olmayan sayısal karakterler olarak kesilmiştir.

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

Üç örneği 按优先排列──带可选内部撇号的词`don't`- Evet.`it's`)。 saf sayı¬¬¬ herhangi bir tek ≠ boş ≠ olmayan sayısal karakter bağımsız bir simge olarak 

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

需要注意的失败模式──`3pm`Kesilmiş olacak.`['3', 'pm']`, çünkü biz harf ve sayısal bölümler arasında değişim yapıyoruz. Çoğu görev için yeterince iyi. URL'ler, e-postalar, hashtagler sorun çıkartıyor.

### Adım 2: Bir Porter stemmer(Sadece Adım 1a)

Porter algoritması tam olarak beş kural aşamasına sahiptir. Sadece adım 1a, en yaygın İngilizceyi kapsamaktadır.

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

按从上到下读取规则──`ies -> i`Kural budur.`ponies -> poni`Hayır.`pony`Bu yüzden, gerçek Porter'ın 1b adımını göreceğiz. Kurallar yarışacak. Daha erken kurallar kazanılacak.

### Adım 3: Bir arama tabanlı lemmatizer

Gerçek lematizasyon  morfoloji gerektirir。

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

Son örnek, önemli öğretim noktasıdır.`watched`Masamızda değil, geri dönüşü sadece hallederiz.`ing`Gerçek lemmatizasyon 会覆盖 `ed`、不规则动词、比较级形容词、带音变的复数(`children -> child`)― Bu, WordNet ̇spaCy'nin morfologizer veya tam morfolojik analizatörünü kullanan üretim sisteminin nedenidir―

### Dördüncü adım: Onları bir araya getir

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

缺失一块是 POS tagger──Phase 5 · 07 (POS Tagging) 会构建一个──现在,默认全部为 `NOUN`Bu sınırlamaları kabul etmedim.

## Kullan

NLTK ve spaCy 提供生产版本──各自只需要几行──

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

`word_tokenize`Çekimleri, Unicode'u ve regex'in kırılmış sınırları ile ilgileneceğim.`PorterStemmer`Bütün beş aşama sürecek.`WordNetLemmatizer`NLTK'nin Penn Treebank scheme's 翻译到 WordNet'in缩写集合上下.

### spaCy

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

Tüm boru hattını gizleyip dur.`nlp(text)`后面──Tokenization、POS tagging 和 lemmatization 都会运行──大规模时比NLTK 更快──开箱即用更准确──取舍是你不容易替换单个组件──

### Ne zaman seçilir ?

| Situation | Pick |
|-----------|------|
| 教学、研究、替换组件 | NLTK |
| 生产、多语言、速度重要 | spaCy |
| Transformer pipeline（反正你会用模型自己的 Tokenizer） | 使用 `tokenizers` / `transformers`，跳过经典 preprocessing |

### İki başarısızlık modunu hatırlatmıyor.

Çoğu ders sadece algoritma hakkında konuşur, sonra da durur. Gerçek preprocessing borusu iki şey tarafından ısırılır ve neredeyse asla kaplanmaz.

**Reproducibility drift。**NLTK ve spaCy, 2.x'de ortaya çıkıyor.`['do', "n't"]`İçerik, 3.x içinde oluşabilir `["don't"]`◊ modeliniz bir dağılım üzerinde eğitimlidir. ◊ Söyleme ◊ şimdi başka bir dağılım üzerinde çalışmaktadır. ◊ Kesinlik oranı ◊ düşüyor, ama kimse nedenini bilmiyor. ◊ ◊`requirements.txt`中固定 library 版本──写一个预处理回归测试,结 20 个例句的预期代码化──每次升级都运行它──

**Training / inference mismatch。**訓練時使用激進前処理 (→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→

## Gönder

Bir tekrarlanabilir sürpriz, mühendislerin eğitim malzemelerini okumadıkları durumlarda önceden işleme stratejisini seçmelerine yardımcı olur.

保存为 `outputs/prompt-preprocessing-advisor.md`- ...

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

## Egzersizler

1. **Easy.**扩展 `tokenize`, 让 URL 保持为单个代码──测试:`tokenize("Visit https://example.com today.")`Bir URL Token oluşturmalı.
2. **Medium.**实现 Porter step 1b.  If a word contains a word并以`ed`Ya da`ing`结尾,移除它──处理双辅音规则(`hopping -> hop`- Hayır .`hopp`)。
3. **Hard.**WordNet'i arama masası olarak kullanmak için bir lemmatizer oluşturmak, ancak WordNet'in 条目 yoksa Porter'ın oylarına geri dönmek için ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒ ⇒  ⇒ ⇒     ⇒ ⇒    ⇒ ⇒                                                                                                                              

## Anahtar Terimler

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Token | 一个词 | 模型消耗的任何单位。可以是 word、subword、character 或 byte。 |
| Stem | 词根 | 基于规则的后缀剥离结果。不一定是真实单词。 |
| Lemma | 词典形式 | 你会去查词典的形式。需要语法上下文才能正确计算。 |
| POS tag | Part of speech | 像 NOUN、VERB、ADJ 这样的类别。准确 lemmatization 需要它。 |
| Morphology | 词形规则 | 词如何基于 tense、number、case 改变形式。Lemmatization 依赖它。 |

## Daha Fazla Okumak

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) 原始文,五页,至今仍是最清晰的解释──
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features)Gerçek boru hattı nasıl bağlanacak?
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html)                                                                                                                                                                                                                                                              
