# بناء Tokenizer من الصفر

> الدرس الأول أعطاك أداة

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 分钟

## أهداف التعلم

- إنشاء رمز BPE من الدرجة التجارية ، قادر على معالجة Unicode ٬ تطبيع الفضاء الأبيض و الوهام الخاصة
- 实现 byte-level fallback,让tokenizer可以编码任何输入(包括emoji、CJK 和代码),且不产生未知的代码
- 添加 pre-tokenization regex أنماط، في تطبيق BPE الاندماج  قبل الحدود الكلمة 拆分文本
- في corpus 上 تدريب تعريف الذاتي Tokenizer، و في عدة لغات على مقارنة مع التكوكين  تقييم نسبة ضغطها

## 问题

يمكنك تصنيع رمز BPE الذي كتبته في الدروس 01 على النص الإنجليزي.

سوف تتعرض للشلل

ليس لأن BPE  خطأ ، ولكن لأن تنفيذ غير كامل. يجب على tokenizer درجة الإنتاج معالجة البايتات الخام للتشفير المتعددة ، قبل الانفصال لتطبيع يونيكود ، وإدارة الوهم الخاصة التي لن يتم دمجها أبدًا ، وإعادة التوكنات المسبقة وتقسيم الكلمات الفرعية ، وكل هذا يجب أن يكون سريعًا بما فيه الكفاية ، لا يمكن التأخير في معالجة خط أنابيب التدريب 15 تريليون رمز.

تمتد المعذرات GPT-2 على 50،257 رمزًا. تمتد معذرات Llama 3 على 128،256 رمزًا. تمتد معذرات GPT-4 على نحو 100،000 رمزًا. هذه ليست أرقام لعبة. هذه المفردات الخلفية من الجداول المدمجة هي مدربة على مئات الجيبايتات من المستندات، بينما الجهاز الخارجي، أي التطبيع والتعريف المسبق، إدخال المعذرات الخاصة، وتصميم قوالب الدردشة، هو وضع المعذرات فقط قادرة على معالجة "هلا العالم" ويمكن معالجة جميع المعذرات في شبكة الإنترنت.

ما ستقوم ببناءه هو هذا الجهاز

## 概念

### 完整 خط الأنابيب

إنتاج درجة الوهم ليس خوارزمية. هو مصمم من خمسة مراحل، كل مرحلة حل مشاكل مختلفة.

```mermaid
graph LR
    A[Raw Text] --> B[Normalize]
    B --> C[Pre-Tokenize]
    C --> D[BPE Merge]
    D --> E[Special Tokens]
    E --> F[Token IDs]

    style A fill:#1a1a2e,stroke:#e94560,color:#fff
    style B fill:#1a1a2e,stroke:#e94560,color:#fff
    style C fill:#1a1a2e,stroke:#e94560,color:#fff
    style D fill:#1a1a2e,stroke:#e94560,color:#fff
    style E fill:#1a1a2e,stroke:#e94560,color:#fff
    style F fill:#1a1a2e,stroke:#e94560,color:#fff
```

كل مرحلة لها مهام محددة:

| Stage | What It Does | Why It Matters |
|-------|-------------|----------------|
| Normalize | NFKC Unicode，可选 lowercase，可选 strip accents | “fi” ligature (U+FB01) 会变成 “fi”（两个字符）。没有它，同一个词会得到不同 tokens。 |
| Pre-Tokenize | 在 BPE 之前把文本拆成 chunks | 防止 BPE 跨 word boundaries merge。“the cat”绝不应该产生 token “e c”。 |
| BPE Merge | 对 byte sequences 应用学到的 merge rules | 核心压缩步骤。把 raw bytes 转成 subword tokens。 |
| Special Tokens | 注入 [BOS]、[EOS]、[PAD]、chat template markers | 这些 tokens 有固定 ID。它们从不参与 BPE merges。模型需要它们来表示结构。 |
| ID Mapping | 把 token strings 转换为 integer IDs | 模型看到的是整数，不是字符串。 |

### BPE مستوى البايت

الدرس 01 الوهمية 作用 على UTF-8 بايت 上── هذا هو اختيار صحيح── ولكننا قفزنا على سؤال مهم: ماذا سيحدث عندما تكون هذه البايت غير صالحة UTF-8 ‬؟

بايت المستوى BPE 通過把每一个可能的字节值 ((0-255) 都视为有效令牌来解决这个问题──你的基础词汇正好有 256 项──任何文件,无论是文本、二进制还是损坏内容,都可以在不产生未知的令牌的情况下被令牌化──

GPT-2  زيادة تيكنيكا: ضع كل بايت 映射到一个可打印的 یونیكود 字符, بحيث الحفاظ على المفردات 保持 انسانية القراءة.

القدرة الحقيقية تكمن في:BPE على مستوى البايت 能处理每一种语言在地球上──中文字符每个是3 个 UTF-8字节──日文可以是3-4个字节──阿拉伯文、德瓦纳加里、爱莫吉,全都是字节序列──BPE 算法在这些字节序列中寻找模式,方式和它在英语ASCII字节中寻找模式完全相同──

### التوكنيزية السابقة

قبل معالجة النص في BPE ، تحتاج أولاً إلى تفكيكه إلى قطع. وهذا يمكن أن يمنع الاختلاط من إنشاء رموز عبر حدود الكلمات.

GPT-2 استخدام نمط regex لفتح النص:

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

هذا النمط سوف يتوافق مع التقلصات ((don تحول إلى don + 't) 、带可选前导空格的字、数字、点点 和白空格 进行拆分──前导空格会保留并附着在词上,所以 the cat 会变成 ["ال", "قطة"],而不是 ["ال", "", "قطة"]。

لااما باستخدام SentencePiece ، لقد قفز تماما عن regex. فإنه يضع سلسلة البايت الخام عندما تكون سلسلة طويلة ، فيمكن لـ BPE الجهاز نفسه العثور على الحدود.

هذا الاختيار مهم للغاية. سوف يمنع regex من GPT-2 من تعريف الوهم تعلم إلى كلمة نهاية the 和下一个词开头的 the 应该合并.

### رموز خاصة

كل شركة تصنيع رمزية من مستوى الإنتاج ستقوم بتحفظ هويات رمزية لتحديد المكونات:

| Token | Purpose | Used By |
|-------|---------|---------|
| `[BOS]` / `<s>` | sequence 开始 | Llama 3, GPT |
| `[EOS]` / `</s>` | sequence 结束 | All models |
| `[PAD]` | batch alignment 用 padding | BERT, T5 |
| `[UNK]` | Unknown token（byte-level BPE 会消除它） | BERT, WordPiece |
| `<\|im_start\|>` | Chat message boundary start | ChatGPT, Qwen |
| `<\|im_end\|>` | Chat message boundary end | ChatGPT, Qwen |
| `<\|user\|>` | User turn marker | Llama 3 |
| `<\|assistant\|>` | Assistant turn marker | Llama 3 |

الوهم الخاص 永远不会被 BPE 拆分──它们会在合并 算法运行前被精确匹配,替换为固定 ID,周围文本则正常标记化──

### نماذج الدردشة

هذا هو المكان الذي يُحرج فيه معظم الناس، ويكون من السهل أن يُنجز خطأً.

عندما تتوجه إلى نموذج الدردشة رسالة رسالة  API  تلقى قائمة رسائل:

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

模型看到的不是 JSON──它看到的是一个平的代币序列──聊天模板使用特殊代币 把消息 转换成这个平序列──每个模型的做法都不同:

```
Llama 3:
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are helpful.<|eot_id|><|start_header_id|>user<|end_header_id|>

Hello<|eot_id|><|start_header_id|>assistant<|end_header_id|>

Hi there!<|eot_id|>

ChatGPT:
<|im_start|>system
You are helpful.<|im_end|>
<|im_start|>user
Hello<|im_end|>
<|im_start|>assistant
Hi there!<|im_end|>
```

عندما يكتب الخطأ، فإن النموذج سوف يخرج القمامة. إنه في شكل محدد على التدريب. أي خلاف، مثل عدم وجود صيغة، وتوقيت، وتغيير، و أكثر من فجوة، سوف يضع الإدخال خارج التدريب.

### السرعة

بايثون على التكنولوجيا من مستوى الإنتاج لتقول "سريع جدا".

تيكتون (OpenAI) هو باستخدام Rust 写的,并提供 Python bindings──HuggingFace tokenizers 也是 Rust──SentencePiece 是 C++──这些相比纯 Python يمكن أن تصل إلى 10-100x speedups──

كإشارة: إذا كانت سرعة Llama 3 في 1 مليون رمز في الثانية ({\displaystyle \mathbb {\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathbb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{\mathb}{b}{b}{b}{b}{b}{b}{b}{b}}{b}{b}{b}{b}}}{b}{b}}{b}{b}}{b}{b}}{b}}{b}}{b}}{b}}{b}}{b}}{"b}{"b}{"b}{"b}{"b}{"b}{"b}{"}{"b}{"}{"b}

أنت تستخدم Python لتكوينها، وذلك لفهم الخوارزميات.


```figure
weight-tying
```

## بناءها

### الخطوة الأولى: تشفير مستوى البايت

基础──把任意字符串转换为字节序列,把每个字节 映射为用于显示可打印字符,并反向恢复──

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

في多语言文本上测试 حسابات البايت:

```python
texts = [
    ("English", "hello"),
    ("Chinese", "你好"),
    ("Emoji", "🔥"),
    ("Mixed", "hello你好🔥"),
]

for label, text in texts:
    b = bytes_to_tokens(text)
    print(f"{label}: {len(text)} chars -> {len(b)} bytes -> {b}")
```

هيلو هو 5 بايتس‬你好 هو 6 بايتس‬ كل حرف 3 个)‬‬‬‬ 火焰 emoji هو 4 بايتس‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### الخطوة الثانية: التوكنيزر المسبق مع Regex

استخدام نمط GPT-2 regex وضع النص إلى قطع. كل جزء مدينة يتم بثمن BPE  مستقل.

```python
import re

try:
    import regex
    GPT2_PATTERN = regex.compile(
        r"""'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+"""
    )
except ImportError:
    GPT2_PATTERN = re.compile(
        r"""'(?:[sdmt]|ll|ve|re)| ?[a-zA-Z]+| ?[0-9]+| ?[^\s\w]+|\s+(?!\S)|\s+"""
    )

def pre_tokenize(text):
    return [match.group() for match in GPT2_PATTERN.finditer(text)]
```

`regex`الوحدة 支持 ينهار خصائص يونيكود ((`\p{L}`أظهار الحروف`\p{N}`تعبر عن الأرقام)`re`لم يدعم هذا الموديل، لذا عدنا إلى فئات أشكال ASCII.`regex`.

试一下:

```python
print(pre_tokenize("Hello, world! Don't stop."))
# [' Hello', ',', ' world', '!', " Don", "'t", ' stop', '.']
```

السابق: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع: الموقع:

### الخطوة 3: BPE على تسلسلات البايت

الجهاز الأساسي في الدرس 01، ولكن الآن في قطع من قبل الـ Tokenized 上独立运行.

```python
from collections import Counter

def get_byte_pairs(chunks):
    pairs = Counter()
    for chunk in chunks:
        byte_seq = list(chunk.encode("utf-8"))
        for i in range(len(byte_seq) - 1):
            pairs[(byte_seq[i], byte_seq[i + 1])] += 1
    return pairs

def apply_merge(byte_seq, pair, new_id):
    merged = []
    i = 0
    while i < len(byte_seq):
        if i < len(byte_seq) - 1 and byte_seq[i] == pair[0] and byte_seq[i + 1] == pair[1]:
            merged.append(new_id)
            i += 2
        else:
            merged.append(byte_seq[i])
            i += 1
    return merged
```

### الخطوة الرابعة: التعامل مع رموز خاصة

الوهم الخاص  بحاجة إلى مطابقة دقيقة وتصنيف ثابت.

```python
class SpecialTokenHandler:
    def __init__(self):
        self.special_tokens = {}
        self.pattern = None

    def add_token(self, token_str, token_id):
        self.special_tokens[token_str] = token_id
        escaped = [re.escape(t) for t in sorted(self.special_tokens.keys(), key=len, reverse=True)]
        self.pattern = re.compile("|".join(escaped))

    def split_with_specials(self, text):
        if not self.pattern:
            return [(text, False)]
        parts = []
        last_end = 0
        for match in self.pattern.finditer(text):
            if match.start() > last_end:
                parts.append((text[last_end:match.start()], False))
            parts.append((match.group(), True))
            last_end = match.end()
        if last_end < len(text):
            parts.append((text[last_end:], False))
        return parts
```

### الخطوة 5: فئة Tokenizer كاملة

ضع كل جزء متصل: تطبيعها ‬بالتأكيد على رموز خاصة ‬بتمزيقها ‬بمجازة البي بي ‬مخططها إلى الهويات‬

```python
import unicodedata

class ProductionTokenizer:
    def __init__(self):
        self.merges = {}
        self.vocab = {i: bytes([i]) for i in range(256)}
        self.special_handler = SpecialTokenHandler()
        self.next_id = 256

    def normalize(self, text):
        return unicodedata.normalize("NFKC", text)

    def train(self, text, num_merges):
        text = self.normalize(text)
        chunks = pre_tokenize(text)
        chunk_bytes = [list(chunk.encode("utf-8")) for chunk in chunks]

        for i in range(num_merges):
            pairs = Counter()
            for seq in chunk_bytes:
                for j in range(len(seq) - 1):
                    pairs[(seq[j], seq[j + 1])] += 1
            if not pairs:
                break
            best = max(pairs, key=pairs.get)
            new_id = self.next_id
            self.next_id += 1
            self.merges[best] = new_id
            self.vocab[new_id] = self.vocab[best[0]] + self.vocab[best[1]]
            chunk_bytes = [apply_merge(seq, best, new_id) for seq in chunk_bytes]

    def add_special_token(self, token_str):
        token_id = self.next_id
        self.next_id += 1
        self.special_handler.add_token(token_str, token_id)
        self.vocab[token_id] = token_str.encode("utf-8")
        return token_id

    def encode(self, text):
        text = self.normalize(text)
        parts = self.special_handler.split_with_specials(text)
        all_ids = []
        for part_text, is_special in parts:
            if is_special:
                all_ids.append(self.special_handler.special_tokens[part_text])
            else:
                for chunk in pre_tokenize(part_text):
                    byte_seq = list(chunk.encode("utf-8"))
                    for pair, new_id in self.merges.items():
                        byte_seq = apply_merge(byte_seq, pair, new_id)
                    all_ids.extend(byte_seq)
        return all_ids

    def decode(self, ids):
        byte_parts = []
        for token_id in ids:
            if token_id in self.vocab:
                byte_parts.append(self.vocab[token_id])
        return b"".join(byte_parts).decode("utf-8", errors="replace")

    def vocab_size(self):
        return len(self.vocab)
```

### الخطوة 6: اختبار متعددة اللغات

"إنجليزية، صينية، إيموجي، و كودتوتلقيه"

```python
corpus = (
    "The quick brown fox jumps over the lazy dog. "
    "The quick brown fox runs through the forest. "
    "Machine learning models process natural language. "
    "Deep learning transforms how we build software. "
    "def train(model, data): return model.fit(data) "
    "def predict(model, x): return model(x) "
)

tok = ProductionTokenizer()
tok.train(corpus, num_merges=50)

bos = tok.add_special_token("<|begin|>")
eos = tok.add_special_token("<|end|>")

test_texts = [
    "The quick brown fox.",
    "你好世界",
    "Hello 🌍 World",
    "def foo(x): return x + 1",
    f"<|begin|>Hello<|end|>",
]

for text in test_texts:
    ids = tok.encode(text)
    decoded = tok.decode(ids)
    print(f"Input:   {text}")
    print(f"Tokens:  {len(ids)} ids")
    print(f"Decoded: {decoded}")
    print()
```

中文字符 لكل إنتاج 3 بايتس. Emoji 产生 4 بايتس.

## استخدمها

### مقارنة المشاركات الحقيقية

加载 Llama 3、GPT-4 和 Mistral 的真实代码符号化器──观察它们如何处理同一个多语言段落──

```python
import tiktoken

gpt4_enc = tiktoken.get_encoding("cl100k_base")

test_paragraph = "Machine learning is powerful. ML很强大。 L'apprentissage automatique est puissant. 🤖💪"

tokens = gpt4_enc.encode(test_paragraph)
pieces = [gpt4_enc.decode([t]) for t in tokens]
print(f"GPT-4 ({len(tokens)} tokens): {pieces}")
```

```python
from transformers import AutoTokenizer

llama_tok = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B")
mistral_tok = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1")

for name, tok in [("Llama 3", llama_tok), ("Mistral", mistral_tok)]:
    tokens = tok.encode(test_paragraph)
    pieces = tok.convert_ids_to_tokens(tokens)
    print(f"{name} ({len(tokens)} tokens): {pieces[:20]}...")
```

سترى نفس المقالة في المقالة لديها عدد مختلف من الرموز. لغة لامة 3 هي 128K، على الاندماج بشكل عام أكثر تحسينا. 100K من GPT-4 في الوسط.

التداول 总是一样的: مخزون أكبر يعني سلسلة أقصر، ولكن أيضا يعني المزيد من العبارات.

## 交付 it

هذا المقال يُنتج عن إرشادات لتكوين وتجربة الجهازات الجهازية للإنتاج.`outputs/prompt-tokenizer-builder.md`.

## التدريب

1. **Easy:**إضافة واحدة`get_token_bytes(id)`طريقة، لتحديد البايتات الخام من أي رمز ID.
2. **Medium:**实现 Llama-style pre-tokenizer:按 white space 和 digits 拆分, ولكن الحفاظ على المساحات الرائدة──在同一个 corpus 上,将其词汇与GPT-2 regex方法对比──
3. **Hard:**添加一个聊天模板方法,接收 `{"role": ..., "content": ...}`قائمة الرسائل،并为 Llama 3 تشات تنسيق 生成正确的代币序列──将它与 HuggingFace实施对照测试──

## الشروط الرئيسية

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Byte-level BPE | “作用在 bytes 上的 Tokenizer” | 基础 vocabulary 为 256 个 byte values 的 BPE，可以处理任何输入而不产生 unknown tokens |
| Pre-tokenization | “BPE 前的拆分” | 基于 regex 或 rules 的拆分，防止 BPE 跨 word boundaries merge |
| NFKC normalization | “Unicode 清理” | canonical decomposition 后接 compatibility composition，“fi” ligature 变成 “fi”，fullwidth “A” 变成 “A” |
| Chat template | “messages 如何变成 tokens” | 把 role/content messages list 转换成扁平 token sequence 的精确格式，model-specific，必须匹配训练格式 |
| Special tokens | “Control tokens” | 绕过 BPE 的保留 token IDs，[BOS]、[EOS]、[PAD]、chat markers，在 merge 前被精确匹配 |
| Fertility | “每个词对应多少 tokens” | output tokens 与 input words 的比例，GPT-4 英文约 1.3，韩文为 2-3，越高表示 context 浪费越多 |
| tiktoken | “OpenAI tokenizer” | 带 Python bindings 的 Rust BPE implementation，比纯 Python 快 10-100x |
| Merge table | “The vocabulary” | 训练过程中学到的有序 byte-pair merges list，这就是 tokenizer 学到的知识 |

## المزيد من القراءة

- [OpenAI tiktoken source](https://github.com/openai/tiktoken)-- GPT-3.5/4 استخدامات تنفيذ Rust BPE
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers)-- 支持 BPE、WordPiece、Unigram مكتبة رموز Rust
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783)-- 128K المفردات و التدريب على الوسائط
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226)-- التوضيح اللغوي
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py)-- رسم الخرائط من البايت إلى اليونيكود
