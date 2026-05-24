# 从零构建 Tokenizer

> Lesson 01 给了你一个玩具。这一课给你一件武器。

**类型：** 构建
**语言：** Python
**前置要求：** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**时间：** ~90 分钟

## 学习目标

- 构建一个生产级 BPE Tokenizer，能够处理 Unicode、空白规范化和 special tokens
- 实现 byte-level fallback，使 Tokenizer 可以编码任何输入（包括 emoji、CJK 和代码）而不会产生 unknown tokens
- 添加 pre-tokenization regex patterns，在应用 BPE merges 之前按词边界切分文本
- 在语料库上训练自定义 Tokenizer，并在多语言文本上对照 tiktoken 评估其压缩率

## 问题

你在 Lesson 01 中的 BPE Tokenizer 可以处理英文文本。现在把日文丢给它。或者 emoji。或者混合 tabs 和 spaces 的 Python 代码。

它会崩。

不是因为 BPE 错了 -- 而是因为实现不完整。生产级 Tokenizer 会处理任意编码的原始 bytes，在切分前规范化 Unicode，管理永远不会被 merge 的 special tokens，将 pre-tokenization 与 subword splitting 串联起来，并且这一切都要足够快，不能拖慢一个处理 15 万亿 tokens 的训练 pipeline。

GPT-2 的 Tokenizer 有 50,257 个 tokens。Llama 3 有 128,256 个。GPT-4 大约有 100,000 个。这些不是玩具级数字。这些 vocabularies 背后的 merge tables 是在数百 GB 文本上训练出来的，而围绕它们的机制 -- normalization、pre-tokenization、special token injection、chat template formatting -- 正是区分一个只能处理 "hello world" 的 Tokenizer 和一个能处理整个互联网的 Tokenizer 的关键。

你将构建的就是这套机制。

## 概念

### 完整 Pipeline

生产级 Tokenizer 不是一个算法。它是一个包含五个阶段的 pipeline，每个阶段解决不同的问题。

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

每个阶段都有明确职责：

| 阶段 | 它做什么 | 为什么重要 |
|-------|-------------|----------------|
| Normalize | NFKC Unicode，可选 lowercase，可选 strip accents | "fi" 连字（U+FB01）会变成 "fi"（两个字符）。没有这一步，同一个词会得到不同的 tokens。 |
| Pre-Tokenize | 在 BPE 前把文本切分成 chunks | 防止 BPE 跨词边界 merge。"the cat" 不应产生 token "e c"。 |
| BPE Merge | 将学到的 merge rules 应用于 byte sequences | 核心压缩步骤。把原始 bytes 变成 subword tokens。 |
| Special Tokens | 注入 [BOS]、[EOS]、[PAD]、chat template markers | 这些 tokens 有固定 IDs。它们永远不参与 BPE merges。模型需要它们来表达结构。 |
| ID Mapping | 将 token strings 转换为整数 IDs | 模型看到的是整数，不是字符串。 |

### Byte-Level BPE

Lesson 01 的 Tokenizer 在 UTF-8 bytes 上运行。这是正确选择。但我们跳过了一个重要问题：当这些 bytes 不是有效 UTF-8 时会怎样？

Byte-level BPE 通过把每个可能的 byte 值（0-255）都视为有效 token 来解决这个问题。你的 base vocabulary 正好有 256 个条目。任何文件 -- 文本、二进制、损坏文件 -- 都可以被 tokenized，而不会产生 unknown token。

GPT-2 加了一个技巧：把每个 byte 映射到一个可打印的 Unicode 字符，这样 vocabulary 保持对人类可读。Byte 0x20（space）在它们的映射中变成字符 "G"。这纯粹是展示层面的。算法并不在意。

真正的威力在于：byte-level BPE 能处理地球上的每一种语言。中文字符每个是 3 个 UTF-8 bytes。日文可以是 3-4 bytes。Arabic、Devanagari、emoji -- 全都是 byte sequences。BPE algorithm 会在这些 byte sequences 中寻找 patterns，方式与它在英文 ASCII bytes 中寻找 patterns 完全相同。

### Pre-Tokenization

在 BPE 处理文本之前，你需要先把它切分成 chunks。这可以防止 merge algorithm 创建跨越词边界的 tokens。

GPT-2 使用一个 regex pattern 来切分文本：

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

这个 pattern 会按 contractions（"don't" 变成 "don" + "'t"）、带可选前导空格的 words、numbers、punctuation 和 whitespace 进行切分。前导空格会保留并附着在 word 上 -- 因此 "the cat" 会变成 [" the", " cat"]，而不是 ["the", " ", "cat"]。

Llama 使用 SentencePiece，它完全跳过 regex。它把原始 byte stream 当作一个长 sequence，让 BPE algorithm 自己找边界。这更简单，但也给了 BPE 更多自由去创建 cross-word tokens。

这个选择很重要。GPT-2 的 regex 会防止 Tokenizer 学到一个词末尾的 "the" 和下一个词开头的 "the" 应该 merge。SentencePiece 允许这种情况，这有时能产生更高效的压缩，但 tokens 的可解释性更差。

### Special Tokens

每个生产级 Tokenizer 都会为结构性标记保留 token IDs：

| Token | 用途 | 使用者 |
|-------|---------|---------|
| `[BOS]` / `<s>` | sequence 开始 | Llama 3, GPT |
| `[EOS]` / `</s>` | sequence 结束 | 所有模型 |
| `[PAD]` | batch alignment 的 padding | BERT, T5 |
| `[UNK]` | Unknown token（byte-level BPE 会消除它） | BERT, WordPiece |
| `<\|im_start\|>` | Chat message boundary start | ChatGPT, Qwen |
| `<\|im_end\|>` | Chat message boundary end | ChatGPT, Qwen |
| `<\|user\|>` | User turn marker | Llama 3 |
| `<\|assistant\|>` | Assistant turn marker | Llama 3 |

Special tokens 永远不会被 BPE 切分。它们会在 merge algorithm 运行前被精确匹配，替换为它们的固定 ID，而周围文本则正常 tokenized。

### Chat Templates

这是大多数人困惑、也最容易让实现出错的地方。

当你向 chat model 发送 messages 时，API 接收的是一个 messages 列表：

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

模型看到的不是 JSON。它看到的是一个扁平的 token sequence。chat template 会使用 special tokens 把 messages 转换成那个扁平 sequence。每个模型的做法都不同：

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

template 一旦写错，模型就会产生垃圾输出。它是在一种精确格式上训练的。任何偏差 -- 少一个换行、Token 交换、额外空格 -- 都会把输入放到训练分布之外。

### 速度

Python 对生产级 tokenization 来说太慢了。

tiktoken（OpenAI）用 Rust 编写，并提供 Python bindings。HuggingFace tokenizers 也是 Rust。SentencePiece 是 C++。这些实现相比纯 Python 能获得 10-100 倍加速。

作为参考：如果以每秒 100 万 tokens（快速 Python）为 Llama 3 pre-training tokenizing 15 万亿 tokens，需要 174 天。以每秒 1 亿 tokens（Rust）则需要 1.7 天。

你用 Python 构建是为了理解算法。在生产环境中，你会使用 compiled implementation，并且只接触 Python wrapper。

## 动手构建

### 步骤 1: Byte-Level Encoding

基础。把任意字符串转换成 bytes sequence，把每个 byte 映射到可打印字符以便展示，并能反向还原。

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

在多语言文本上测试，观察 byte counts：

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

"hello" 是 5 bytes。"你好" 是 6 bytes（每个字符 3 bytes）。火焰 emoji 是 4 bytes。byte-level Tokenizer 不关心它是什么语言。Bytes 就是 bytes。

### 步骤 2： 使用 Regex 的 Pre-Tokenizer

使用 GPT-2 regex pattern 把文本切成 chunks。每个 chunk 会由 BPE 独立 tokenized。

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

`regex` module 支持 Unicode property escapes（`\p{L}` 表示 letters，`\p{N}` 表示 numbers）。standard library 的 `re` module 不支持，所以我们 fallback 到 ASCII character classes。对于生产级多语言 Tokenizers，请安装 `regex`。

试一下：

```python
print(pre_tokenize("Hello, world! Don't stop."))
# [' Hello', ',', ' world', '!', " Don", "'t", ' stop', '.']
```

前导空格会附着在 word 上。Contractions 会在 apostrophe 处分开。Punctuation 会成为自己的 chunk。BPE 永远不会跨越这些边界 merge tokens。

### 步骤 3： Byte Sequences 上的 BPE

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

### 步骤 4: Special Token 处理

Special tokens 需要精确匹配和固定 IDs。它们完全绕过 BPE。

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

### 步骤 5： 完整 Tokenizer Class

把所有环节串起来：normalize、按 special tokens 切分、pre-tokenize、BPE merge、map to IDs。

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

### 步骤 6： 多语言测试

真正的测试。把英文、中文、emoji 和代码都丢给它。

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

中文字符每个会产生 3 bytes。emoji 会产生 4 bytes。这些都不会让 Tokenizer 崩溃。也不会产生 unknown tokens。这就是 byte-level BPE 的威力。

## 使用它

### 对比真实 Tokenizers

加载 Llama 3、GPT-4 和 Mistral 的实际 Tokenizers。看看它们如何处理同一段多语言文本。

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

你会看到同一段文本有不同的 token counts。Llama 3 拥有 128K vocabulary，对常见 patterns 的 merge 更激进。GPT-4 的 100K 处于中间。Mistral 的 32K 会产生更多 tokens，但 embedding layer 更小。

权衡始终相同：更大的 vocabulary 意味着更短的 sequences，但也意味着更多 parameters。

## 交付

本课会产出一个用于构建和调试生产级 Tokenizers 的 prompt。见 `outputs/prompt-tokenizer-builder.md`。

## 练习

1. **Easy:** 添加一个 `get_token_bytes(id)` method，用来显示任意 token ID 的原始 bytes。用它检查你最常见的 merged tokens 实际表示什么。
2. **Medium:** 实现 Llama-style pre-tokenizer：按 whitespace 和 digits 切分，但保留前导空格。在同一语料库上将它的 vocabulary 与 GPT-2 regex 方法进行比较。
3. **Hard:** 添加一个 chat template method，接收 `{"role": ..., "content": ...}` messages 列表，并为 Llama 3 chat format 生成正确的 token sequence。将它与 HuggingFace 实现进行对照测试。

## 关键术语

| 术语 | 人们通常怎么说 | 它实际意味着什么 |
|------|----------------|----------------------|
| Byte-level BPE | "在 bytes 上工作的 Tokenizer" | base vocabulary 为 256 个 byte values 的 BPE -- 能处理任意输入而没有 unknown tokens |
| Pre-tokenization | "BPE 前的切分" | 基于 regex 或规则的切分，用于防止 BPE 跨词边界 merge |
| NFKC normalization | "Unicode 清理" | 先进行 canonical decomposition，再进行 compatibility composition -- "fi" 连字变成 "fi"，全角 "A" 变成 "A" |
| Chat template | "messages 如何变成 tokens" | 将 role/content messages 列表转换成扁平 token sequence 的精确格式 -- 模型特定，并且必须匹配训练格式 |
| Special tokens | "Control tokens" | 绕过 BPE 的保留 token IDs -- [BOS]、[EOS]、[PAD]、chat markers -- 在 merge 前被精确匹配 |
| Fertility | "每个词对应的 tokens 数" | 输出 tokens 与输入 words 的比率 -- GPT-4 中英文约为 1.3，韩文为 2-3，更高意味着浪费 context |
| tiktoken | "OpenAI Tokenizer" | 带 Python bindings 的 Rust BPE 实现 -- 比纯 Python 快 10-100 倍 |
| Merge table | "The vocabulary" | 训练期间学到的 byte-pair merges 的有序列表 -- 这就是 Tokenizer 学到的知识 |

## 延伸阅读

- [OpenAI tiktoken source](https://github.com/openai/tiktoken) -- GPT-3.5/4 使用的 Rust BPE 实现
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers) -- 支持 BPE、WordPiece、Unigram 的 Rust Tokenizer library
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783) -- 关于 128K vocabulary 和 Tokenizer 训练的细节
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226) -- 与语言无关的 tokenization
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py) -- 最初的 byte-to-Unicode mapping
