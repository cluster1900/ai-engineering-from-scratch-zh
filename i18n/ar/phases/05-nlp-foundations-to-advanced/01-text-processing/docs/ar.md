# معالجة النص  التكنولوجيا، التأثير، التنظيم

> 语言是连续的.模型是离散的.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## المشكلة

模型不能阅读 " القطط كانت تهرب. "

كل نظام من النظم النووية يبدأ من نفس المشكلة ثلاثة. الكلمات التي تبدأ من أين. الكلمات التي تصل إلى الجذور هي ما. كيف نضع "الركض" والركض" والركض" عندما يكونون مساعدة، كما أن الشيء نفسه، مرة أخرى عندما يكونون غير مساعدة.

التوكنات قد أخطأت، النموذج سوف يتعلم من القمامة.`don't`عندما تصنع رمزاً، تُعدّ`do n't`عندما تكونين على رموز، التدريبات تمت إزالةها`organization`和 `organ`压成同一个干,主题建模就完成了. إذا كان المميزر الخاص بك يحتاج إلى جزء من الخطاب 上下文 ولكنك لا تمتلك إدخال،

سوف يبدأ هذا الدروس من الصفحة التحتية من التكوين هذه الخطوات التالية، ثم يظهر لك كيفية عمل NLTK و spaCy على نفس العمل، ويحصل على معرفة ما هو المشكلة.

## المفهوم

ثلاث عمليات. كل واحد له مسؤولياته الخاصة و وضع الفشل.

**Tokenization**将字符串切分为代币──"Token" 这个词有意保持模糊,因为正确粒度取决于任务──经典 NLP 使用词级──转变器 使用字母──没有空格的语言使用字符──

**Stemming**استخدام قواعد قطع بعد 🏼 快、激进、粗🏼`running -> run`.`organization -> organ`◊ الثاني هو وضع الفشل

**Lemmatization**استخدام语法知识把词还原为词典形式──更慢、更准确, بحاجة إلى جدول البحث أو محلل مورفولوجي──`ran -> run`( أحتاج أن أعرف "الدرجة" هي "الدرجة" من الماضي)`better -> good`(يجب أن تعرف النسخة)

 تجربة قانونها. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .


```figure
edit-distance
```

## بناءها

### الخطوة الأولى: إشارة كلمة regex

أسهل استخدام للتوكينزير سيكون على أساس غير حرفية الأرقام الحرفية، في حين أن وضع العلامات الحفظة لتوكينها الخاصة.

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

ثلاثة نمطات 按优先级排列──带可选内部撇号的词`don't`.`it's`)。 رقمٌ نقيٍّ。 أيّ واحدٍ غير فارغٍ 、 غير حرفيّةٍ رقمٍ كرمزٍ مستقلٍ(مؤشر)。

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

يجب الانتباه إلى أساليب الفشل`3pm`سأُقطع`['3', 'pm']`، لأننا نتبادل بين الحروف والحروف الرقمية.

### الخطوة الثانية:

الخوارزمية الكاملة لبورتر لديها خمس مراحل قواعد. فقط الخطوة 1 أ على تغطية أكثر اللغة الإنجليزية شيوعاً، لم يتمكن من معرفة هذا النمط.

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

按从上到下读取规则──`ies -> i`قاعدة هي`ponies -> poni`بدلاً من ذلك`pony`السبب:: (بورتر) الحقيقي لديه خطوة 1ب، سوف يصلحها: (القواعد سوف تتنافس: (بورتر) القواعد السابقة: (بورتر)

### الخطوة الثالثة: إعداد لعبة البحث

الحكم الحقيقي للفم: بحاجة إلى المورفولوجيا.

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

آخر مثال هو نقطة تعليمية رئيسية.`watched`ليس على طاولتنا، والعودة فقط معالجتها`ing`◊ حقيقة التأثيرات`ed`、不规则动词、比较级形容词、带音变的复数(`children -> child`)― هذا هو سبب استخدام نظام الإنتاج WordNet ̇spaCy المورفولوجيزر أو المحلل المورفولوجي الكامل‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### الخطوة الرابعة: ضعها في حلقة

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

缺失一块是 POS Tagger──Phase 5 · 07 (POS Tagging) 会构建一个──现在,默认全部为 `NOUN`, لم اعترف بهذا الحد

## استخدمها

NLTK و spaCy 提供生产版本── كل منهم يحتاج فقط إلى عدد قليل من الصيغ──

### الـ " نيلتيك "

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

`word_tokenize`سأقوم بمعالجة الإختناقات و اليونيكود و الحدود التي تفقدها إعادة التأثير`PorterStemmer`سأقوم بأكملها بخمس مراحل`WordNetLemmatizer`تحتاج إلى وضع علامة POS من نلتك Penn Treebank الخطة 翻译到 WordNet 的缩写集合上面──的转换接线是大多数教程跳过的部分──

### السباق

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

ووضع خط الأنابيب كله مخفيًا`nlp(text)`后面──Tokenization、POS tagging 和 lemmatization 都会运行──大规模时比NLTK 更快──开箱即用更准确──取舍是你不容易替换单个组件──

### ماذا ستفعل ؟

| Situation | Pick |
|-----------|------|
| 教学、研究、替换组件 | NLTK |
| 生产、多语言、速度重要 | spaCy |
| Transformer pipeline（反正你会用模型自己的 Tokenizer） | 使用 `tokenizers` / `transformers`，跳过经典 preprocessing |

### لا أحد يذكرك بطرق الفشل

معظم الدروس تتكلم عن الخوارزميات فقط ثم تتوقف. سيتم تناول اثنين من الأشياء، ولا يتم تغطيتها تقريبا.

**Reproducibility drift。**NLTK و spaCy في الإصدارات بينها سيتغير التكنولوجيا و lemmatizer  سلوكها.`['do', "n't"]`محتويات، في 3.x يمكن أن تنتج `["don't"]`نموذجك يتدرب على توزيع واحد. الإستنتاج الآن يعمل على توزيع آخر.`requirements.txt`中固定 library 版本──写一个预处理回归测试,结 20 个示例句子的预期代码化──每次升级都运行它──

**Training / inference mismatch。**訓練時使用激進預加工 (((case  stopword removal、stemming) ،部署時却原始用户输入,然后看性能崩掉──这是最常见的生产NLP失败──如果 تدريب时做預加工, 推理时必须运行完全相同的函数──把預处理 作为函数随模型包发布,而不是作为笔记本电脑细胞 让服务团队重写──

## أرسله

إشارة مستمرة، لمساعدة المهندس في اختيار الاستراتيجية المسبقة المعالجة في حالة عدم قراءة المواد التعليمية.

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

## التمارين

1. **Easy.**扩展 `tokenize`, دع عناوين URL 保持为单个代币──测试:`tokenize("Visit https://example.com today.")`يجب أن يكون هناك رمز URL
2. **Medium.**实现 Porter step 1b `ed`أو`ing`结尾,移除它──处理双辅音规则(`hopping -> hop`، ليس`hopp`(‬)
3. **Hard.**إنشاء استخدام WordNet  كمحفز لجدول البحث، ولكن عندما WordNet  بدون条目时 fallback إلى صوتك Porter── في المختطم على الاختبار على مقياسها مقارنة بـ WordNet وبرنامج Porter ‬

## الشروط الرئيسية

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Token | 一个词 | 模型消耗的任何单位。可以是 word、subword、character 或 byte。 |
| Stem | 词根 | 基于规则的后缀剥离结果。不一定是真实单词。 |
| Lemma | 词典形式 | 你会去查词典的形式。需要语法上下文才能正确计算。 |
| POS tag | Part of speech | 像 NOUN、VERB、ADJ 这样的类别。准确 lemmatization 需要它。 |
| Morphology | 词形规则 | 词如何基于 tense、number、case 改变形式。Lemmatization 依赖它。 |

## المزيد من القراءة

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) original论文,五页, حتى الآن ما زالوا أوضح تفسيرها
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features) حقيقة خط الأنابيب 如何接线──
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) أنت لا تفكر في الـ Tokenization  الحدود الحالة
