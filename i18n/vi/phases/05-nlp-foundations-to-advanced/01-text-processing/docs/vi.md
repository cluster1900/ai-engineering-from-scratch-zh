# Việc xử lý văn bản  Đánh dấu, phát âm, Lemmatization

> 语言是连续的. 模型是离散的.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 分钟

## Vấn đề

模型不能读 "Những con mèo đang chạy".

Mỗi hệ thống NLP đều bắt đầu từ cùng ba vấn đề. Từ từ nơi bắt đầu. Từ có nguồn gốc là gì? Chúng ta làm thế nào để trong một thời gian hữu ích, "run""",run""",run" như một thứ giống nhau, và trong một thời gian vô ích, chúng lại như một thứ khác nhau.

Tokenization đã làm sai, mô hình sẽ học từ rác thải. Nếu Tokenizer của bạn đặt nó vào.`don't`Khi làm một token, nhưng nó đã`do n't`Khi 2 token được chia ra, tập luyện phân phối sẽ bị phá vỡ. Nếu bạn có thể chọn, hãy chọn.`organization`和 `organ`压成同一个干,主题建模就完成了. Nếu lemmatizer của bạn 需要部分的演讲上下文但你没有传入,动词就会被当作名词处理.

Bài học này sẽ bắt đầu từ xây dựng từ zero ba bước xử lý trước, sau đó cho thấy NLTK và spaCy làm thế nào để làm việc tương tự, để bạn xem rõ trong số đó.

## Khái niệm

Ba hoạt động. Mỗi người có trách nhiệm và cách thất bại của riêng mình.

**Tokenization**将字符串切分为代币──"Token" 这个词有意保持模糊,因为正确粒度取决于任务──经典 NLP 使用词级──转变器 使用字符──没有空格的语言使用字符──

**Stemming**Sử dụng quy tắc cắt bỏ sau.`running -> run``organization -> organ` 第二就是失败模式

**Lemmatization**Sử dụng ngữ法知识把词还原为词典形式──更慢、更准确, cần bảng tìm kiếm hoặc phân tích hình thái──`ran -> run`( cần biết "run" là quá khứ của "run")`better -> good`(đáng cần biết cách so sánh)

经验法则──速度重要且可忍受噪音时使用源源的搜索索引,粗略分类)──语义重要时使用化.


```figure
edit-distance
```

## Hãy xây dựng nó

### Bước 1: Một token từ regex

Trình hiệu hữu ích đơn giản nhất sẽ được sử dụng theo các chữ số không chữ cái, đồng thời giữ dấu chấm cho riêng mình Trình hiệu. Không hoàn hảo, không phải là điểm cuối cùng, nhưng một dòng được có thể vận hành.

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

三个模式 按优先排列──带可选内部撇号的词`don't``it's`(※) Số nguyên. (※) Bất kỳ đơn vị nào không có chữ cái trắng không chữ số như một biểu tượng độc lập.

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

需要注意的失败模式──`3pm`Sẽ bị cắt đứt`['3', 'pm']`, vì chúng ta thay đổi giữa chữ cái và số phần. Đối với hầu hết các nhiệm vụ là đủ tốt. URL, email, hashtag đều có vấn đề.

### Bước 2: Một người Porter vote (chỉ bước 1a)

完整波特算法有五个规则阶段──只有步骤1a就覆盖了最常见的英语后,并能教解这个模式──

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

按从上到下读取规则──`ies -> i`Quy tắc là`ponies -> poni`Không phải`pony`Lý do: Có một bước 1b, sẽ sửa đổi nó. Quy tắc sẽ cạnh tranh. Quy tắc sớm hơn sẽ thắng.

### Bước 3: Một lemmatizer dựa trên tìm kiếm

Thực sự của lematization  cần hình học。 một phiên bản có thể dạy sử dụng các bảng lemma nhỏ 和 fallback。

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

Ví dụ cuối cùng là điểm học tập quan trọng.`watched`Không ở bàn của chúng ta, và sự thất bại chỉ xử lý `ing`◊ Thực sự làm ngọt  会覆盖 `ed`、不规则动词、比较级形容词、带音变的复数(`children -> child`(..) Đây là lý do hệ thống sản xuất sử dụng WordNet, một nhà phân tích hình thái của spaCy hoặc một nhà phân tích hình thái hoàn chỉnh.

### Bước 4: Đặt chúng lên

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

缺失一块是 POS tagger──Phase 5 · 07 (POS Tagging) 会构建一个──现在,默认全部为 `NOUN`,并承认这一限制.

## Sử dụng nó

NLTK và spaCy 提供生产版本──各自 chỉ cần vài行──

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

`word_tokenize`Tôi sẽ xử lý các sự suy giảm, Unicode, và các trường hợp biên giới của regex của bạn bị mất.`PorterStemmer`Sẽ chạy hết 5 giai đoạn.`WordNetLemmatizer`需要把 POS tag từ Penn Treebank scheme của NLTK 翻译到 WordNet 的缩写集合上面──的转换接线是大多数教程跳过的部分──

### spacy

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

Không gian và cả đường ống  ẩn trong `nlp(text)`后面──Tokenization、POS tagging 和 lemmatization 都会运行──大规模时比NLTK 更快──开箱即用更准确──取舍是你不容易替换单个组件──

### 什么时候选择哪个

| Situation | Pick |
|-----------|------|
| 教学、研究、替换组件 | NLTK |
| 生产、多语言、速度重要 | spaCy |
| Transformer pipeline（反正你会用模型自己的 Tokenizer） | 使用 `tokenizers` / `transformers`，跳过经典 preprocessing |

### Không ai nhắc nhở hai chế độ thất bại của bạn

Hầu hết các bài học chỉ nói về thuật toán, sau đó đã dừng lại.

**Reproducibility drift。**NLTK và spaCy trong phiên bản sẽ thay đổi token hóa và lemmatizer  hành vi.`['do', "n't"]`Nội dung, trong 3.x có thể xuất hiện `["don't"]` mô hình của bạn đang được đào tạo trên một phân bố.  Nhận thức hiện đang hoạt động trên một phân bố khác.`requirements.txt`Trung cố định thư viện 版本── viết một bài kiểm tra hồi quy trước xử lý,结 20 个例句的预期代码化──每次升级都运行它──

**Training / inference mismatch。**训练时使用激进预处理(lowcase、stopword removal、stemming),部署时却原始用户输入,然后看性能崩掉。 Đây là lỗi sản xuất NLP phổ biến nhất。 Nếu trong quá trình đào tạo, định nghĩa 时必须运行完全相同的函数──把预处理 作为函数随模型包发布,而不是作为笔记本电脑 让服务团队重写──

## Chuyển nó

Một lời nhắc lặp lại, giúp kỹ sư trong trường hợp không đọc được các tài liệu học tập chọn phương pháp xử lý trước.

保存为 `outputs/prompt-preprocessing-advisor.md`- Có thể là:

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

## Các bài tập

1. **Easy.**扩展 `tokenize`,让URL 保持为单个Token──测试:`tokenize("Visit https://example.com today.")`应该产生一个URL Token──
2. **Medium.**实现 Porter bước 1b. Nếu một từ chứa元音并以`ed`Hoặc`ing`结尾,移除它──处理双辅音规则(`hopping -> hop`, không `hopp`(■)
3. **Hard.**Xây dựng một sử dụng WordNet  như một lemmatizer của bảng tìm kiếm, nhưng khi WordNet  không có mục tiêu thì rơi lại cho Porter của bạn stemmer── trên thẻ corpus 上衡量 nó so với đơn giản WordNet và đơn giản Porter 准确率──

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Token | 一个词 | 模型消耗的任何单位。可以是 word、subword、character 或 byte。 |
| Stem | 词根 | 基于规则的后缀剥离结果。不一定是真实单词。 |
| Lemma | 词典形式 | 你会去查词典的形式。需要语法上下文才能正确计算。 |
| POS tag | Part of speech | 像 NOUN、VERB、ADJ 这样的类别。准确 lemmatization 需要它。 |
| Morphology | 词形规则 | 词如何基于 tense、number、case 改变形式。Lemmatization 依赖它。 |

## Đọc thêm

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) 原始文,五页,至今仍是最清晰的解释──
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features) Thực tế đường ống 如何接线──
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) Bạn chưa nghĩ đến việc mã hóa  biên giới tình huống.
