# Building a Tokenizer from Scratch

> Lesson 01 给了你一个玩具。这一课给你一件武器。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 分钟

## Learning Objectives

- 构建一个生产级 BPE tokenizer，能够处理 Unicode、whitespace normalization 和 special tokens
- 实现 byte-level fallback，让 tokenizer 可以编码任何输入（包括 emoji、CJK 和代码），且不产生 unknown tokens
- 添加 pre-tokenization regex patterns，在应用 BPE merges 之前按 word boundaries 拆分文本
- 在 corpus 上训练自定义 tokenizer，并在多语言文本上对比 tiktoken 评估其 compression ratio

## 问题

你在 Lesson 01 中写的 BPE tokenizer 可以处理英文文本。现在把日文扔给它。或者 emoji。或者混有 tab 和 space 的 Python 代码。

它会坏掉。

不是因为 BPE 错了，而是因为实现不完整。生产级 tokenizer 要处理任意 encoding 的 raw bytes，在拆分前 normalize Unicode，管理永远不会被 merge 的 special tokens，把 pre-tokenization 和 subword splitting 串起来，并且所有这些都要足够快，不能拖慢处理 15 trillion tokens 的 training pipeline。

GPT-2 的 tokenizer 有 50,257 个 tokens。Llama 3 有 128,256 个。GPT-4 大约有 100,000 个。这些不是玩具数字。这些 vocabulary 背后的 merge tables 是在数百 GB 文本上训练出来的，而外围机制，也就是 normalization、pre-tokenization、special token injection、chat template formatting，正是把只能处理“hello world”的 tokenizer 和能处理整个互联网的 tokenizer 区分开的东西。

你将要构建的就是这套机制。

## 概念

### 完整 Pipeline

生产级 tokenizer 不是一个算法。它是由五个阶段组成的 pipeline，每个阶段解决不同的问题。

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

每个阶段都有具体职责：

| Stage | What It Does | Why It Matters |
|-------|-------------|----------------|
| Normalize | NFKC Unicode，可选 lowercase，可选 strip accents | “fi” ligature (U+FB01) 会变成 “fi”（两个字符）。没有它，同一个词会得到不同 tokens。 |
| Pre-Tokenize | 在 BPE 之前把文本拆成 chunks | 防止 BPE 跨 word boundaries merge。“the cat”绝不应该产生 token “e c”。 |
| BPE Merge | 对 byte sequences 应用学到的 merge rules | 核心压缩步骤。把 raw bytes 转成 subword tokens。 |
| Special Tokens | 注入 [BOS]、[EOS]、[PAD]、chat template markers | 这些 tokens 有固定 ID。它们从不参与 BPE merges。模型需要它们来表示结构。 |
| ID Mapping | 把 token strings 转换为 integer IDs | 模型看到的是整数，不是字符串。 |

### Byte-Level BPE

Lesson 01 的 tokenizer 作用在 UTF-8 bytes 上。这是正确选择。但我们跳过了一个重要问题：当这些 bytes 不是有效 UTF-8 时会发生什么？

Byte-level BPE 通过把每一个可能的 byte value（0-255）都视为有效 token 来解决这个问题。你的基础 vocabulary 正好有 256 项。任何文件，无论是文本、二进制还是损坏内容，都可以在不产生 unknown token 的情况下被 tokenized。

GPT-2 增加了一个技巧：把每个 byte 映射到一个可打印的 Unicode 字符，这样 vocabulary 保持 human-readable。Byte 0x20（space）在它们的映射中变成字符 “G”。这只是外观处理。算法本身不关心。

真正的能力在于：byte-level BPE 能处理地球上的每一种语言。中文字符每个是 3 个 UTF-8 bytes。日文可以是 3-4 个 bytes。阿拉伯文、Devanagari、emoji，全都是 byte sequences。BPE 算法在这些 byte sequences 中寻找模式，方式和它在 English ASCII bytes 中寻找模式完全相同。

### Pre-Tokenization

在 BPE 处理文本之前，你需要先把它拆成 chunks。这可以防止 merge 算法创建跨越 word boundaries 的 tokens。

GPT-2 使用一个 regex pattern 来拆分文本：

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

这个 pattern 会按 contractions（“don't”变成 “don” + “'t”）、带可选前导空格的 words、numbers、punctuation 和 whitespace 进行拆分。前导空格会保留并附着在 word 上，所以 “the cat” 会变成 [" the", " cat"]，而不是 ["the", " ", "cat"]。

Llama 使用 SentencePiece，它完全跳过 regex。它把 raw byte stream 当作一个长序列，让 BPE 算法自己找边界。这更简单，但也给了 BPE 更多自由去创建 cross-word tokens。

这个选择很重要。GPT-2 的 regex 会阻止 tokenizer 学到一个词末尾的 “the” 和下一个词开头的 “the” 应该 merge。SentencePiece 允许这种情况，有时会产生更高效的 compression，但 tokens 的可解释性更弱。

### Special Tokens

每个生产级 tokenizer 都会为结构标记保留 token IDs：

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

Special tokens 永远不会被 BPE 拆分。它们会在 merge 算法运行前被精确匹配，替换为固定 ID，周围文本则正常 tokenized。

### Chat Templates

这是大多数人困惑、也最容易让实现出错的地方。

当你向 chat model 发送消息时，API 接收一个 message list：

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

模型看到的不是 JSON。它看到的是一个扁平的 token sequence。chat template 使用 special tokens 把 messages 转换成这个扁平序列。每个模型的做法都不同：

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

template 一旦写错，模型就会输出垃圾。它是在一个精确格式上训练的。任何偏差，比如缺少换行、token 调换、多一个空格，都会把输入放到训练分布之外。

### Speed

Python 对生产级 tokenization 来说太慢。

tiktoken (OpenAI) 是用 Rust 写的，并提供 Python bindings。HuggingFace tokenizers 也是 Rust。SentencePiece 是 C++。这些相比纯 Python 可以达到 10-100x speedups。

作为参考：如果以每秒 1 million tokens（fast Python）的速度为 Llama 3 pre-training tokenize 15 trillion tokens，需要 174 天。以每秒 100 million tokens（Rust）的速度，只需要 1.7 天。

你用 Python 构建，是为了理解算法。在生产环境中，你会使用编译实现，只接触 Python wrapper。

## 构建它

### Step 1: Byte-Level Encoding

基础。把任意字符串转换成 byte sequence，把每个 byte 映射为用于显示的可打印字符，并反向恢复。

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

在多语言文本上测试 byte counts：

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

“hello” 是 5 bytes。“你好” 是 6 bytes（每个字符 3 个）。火焰 emoji 是 4 bytes。byte-level tokenizer 不关心它是什么语言。Bytes 就是 bytes。

### Step 2: Pre-Tokenizer with Regex

使用 GPT-2 regex pattern 把文本拆成 chunks。每个 chunk 都会被 BPE 独立 tokenized。

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

`regex` module 支持 Unicode property escapes（`\p{L}` 表示 letters，`\p{N}` 表示 numbers）。standard library 的 `re` module 不支持，所以我们 fallback 到 ASCII character classes。对于生产级多语言 tokenizer，请安装 `regex`。

试一下：

```python
print(pre_tokenize("Hello, world! Don't stop."))
# [' Hello', ',', ' world', '!', " Don", "'t", ' stop', '.']
```

前导空格会附着在 word 上。Contractions 会在 apostrophe 处分开。Punctuation 会成为自己的 chunk。BPE 永远不会跨这些边界 merge tokens。

### Step 3: BPE on Byte Sequences

Lesson 01 中的核心算法，但现在是在 pre-tokenized chunks 上独立运行。

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

### Step 4: Special Token Handling

Special tokens 需要精确匹配和固定 ID。它们完全绕过 BPE。

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

### Step 5: Full Tokenizer Class

把所有部分串起来：normalize、按 special tokens 拆分、pre-tokenize、BPE merge、映射到 IDs。

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

### Step 6: Multilingual Test

真正的测试。把英文、中文、emoji 和代码都扔给它。

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

中文字符每个产生 3 bytes。emoji 产生 4 bytes。它们都不会让 tokenizer 崩溃。也都不会产生 unknown tokens。这就是 byte-level BPE 的力量。

## 使用它

### Comparing Real Tokenizers

加载 Llama 3、GPT-4 和 Mistral 的真实 tokenizers。观察它们如何处理同一个多语言段落。

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

你会看到同一段文本有不同 token counts。Llama 3 的 vocabulary 为 128K，对常见模式的 merge 更激进。GPT-4 的 100K 处于中间。Mistral 的 32K 会产生更多 tokens，但 Embedding layer 更小。

tradeoff 总是一样的：更大的 vocabulary 意味着更短的 sequence，但也意味着更多参数。

## 交付它

本课会产出一个用于构建和调试生产级 tokenizers 的 prompt。见 `outputs/prompt-tokenizer-builder.md`。

## 练习

1. **Easy:** 添加一个 `get_token_bytes(id)` method，用来显示任意 token ID 的 raw bytes。用它检查你最常见的 merged tokens 实际代表什么。
2. **Medium:** 实现 Llama-style pre-tokenizer：按 whitespace 和 digits 拆分，但保留 leading spaces。在同一个 corpus 上，将它的 vocabulary 与 GPT-2 regex approach 对比。
3. **Hard:** 添加一个 chat template method，接收 `{"role": ..., "content": ...}` messages list，并为 Llama 3 chat format 生成正确的 token sequence。将它与 HuggingFace implementation 对照测试。

## Key Terms

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

## Further Reading

- [OpenAI tiktoken source](https://github.com/openai/tiktoken) -- GPT-3.5/4 使用的 Rust BPE implementation
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers) -- 支持 BPE、WordPiece、Unigram 的 Rust tokenizer library
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783) -- 128K vocabulary 和 tokenizer training 的细节
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226) -- language-agnostic tokenization
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py) -- 原始 byte-to-Unicode mapping
