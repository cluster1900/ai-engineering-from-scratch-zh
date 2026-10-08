# 从零开始构建一个标记器

> 第1课给你一个玩具.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 分钟

## 学习目标

- 构建一个生产级BPE代币,能够处理Unicode、白色空间规范和特殊代币
- 实现字节级落后,让代币器可以编码任何输入(包括emoji、CJK 和代码),并且不会产生未知的代码
- 添加预先代币化regex模式,在应用BPE合并之前按字符边界拆分文本
- 在 corpus 上训练自定义代币,并在多语言文本上对比于TikToken 评估其压缩比

## 问题

你在01课中写的BPE标记器可以处理英文文本.现在把日文扔给它.或者是爱默生.或者是混有页和空间的Python代码.

它会坏掉.

不是因为BPE错了,而是因为实现不完整.生产级代币器需要处理任意编码的原始字节,在拆分之前将 Unicode正常化,管理永远不会被合并的特殊代币,把预代币和子词分类链起来,并且所有这些都足够快,不能拖延处理15万亿代币的培训管道.

格普特-2的代币器有50,257个代币. 格普特-3有128,256个. 格普特-4大约有10万个. 这些不是玩具数字. 这些词汇后面的结合表是从100GB文本中训练出来的,而外围机制,也就是正常化,预代币化,特殊代币注射,聊天模板格式化,正是只能处理你好世界的代币器和能够处理整个互联网的代币器.

你要构建的就是这个机制.

## 概念

### 完整的管道

生产级代币化器不是一个算法. 它由五个阶段组成的管道,每个阶段解决不同的问题.

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

每个阶段都有具体的职责:

| Stage | What It Does | Why It Matters |
|-------|-------------|----------------|
| Normalize | NFKC Unicode，可选 lowercase，可选 strip accents | “fi” ligature (U+FB01) 会变成 “fi”（两个字符）。没有它，同一个词会得到不同 tokens。 |
| Pre-Tokenize | 在 BPE 之前把文本拆成 chunks | 防止 BPE 跨 word boundaries merge。“the cat”绝不应该产生 token “e c”。 |
| BPE Merge | 对 byte sequences 应用学到的 merge rules | 核心压缩步骤。把 raw bytes 转成 subword tokens。 |
| Special Tokens | 注入 [BOS]、[EOS]、[PAD]、chat template markers | 这些 tokens 有固定 ID。它们从不参与 BPE merges。模型需要它们来表示结构。 |
| ID Mapping | 把 token strings 转换为 integer IDs | 模型看到的是整数，不是字符串。 |

### 字节级BPE

课01的代币器作用在 UTF-8 字节上.这是一个正确的选择.

通过把每一个可能的字节值的BPE 通过0-255) 都视为有效代币来解决这个问题.

GPT-2 增加了一个技巧:把每个字节映射到一个可打印的 Unicode 字符,这样的词汇保持人读性.

真正的能力在于:字节级BPE 能处理地球上的每一种语言.中文字符每个字符是3个 UTF-8字节.日文可以是3-4个字节.阿拉伯文.德瓦纳加里.

### 预托克化

在处理BPE文本之前,你需要先把它拆分成碎片.

通过一个regex模式来分开文本:

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

这个模式会按收缩而成,所以猫会变成 ["猫"",猫"",猫"]而不是 ["猫"",猫"]。

拉马使用SentencePiece,它完全跳过regex――它把原始字节流作为一个长序列,让BPE算法自己找到边界――这更简单,但也给了BPE更多的自由创建交叉字符符号――

这个选择很重要――GPT-2的regex会阻止代币器学习一个词末尾的the 和下一个词开头的the 应该合并――SentencePiece允许这种情况,有时会产生更高效的压缩,但代币的解释性更弱――

### 特殊的代币

每个生产级代币商都会为结构标记保留代币ID:

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

特殊代币永远不会被BPE拆分.它们会在算法运行前被精确匹配,替换为固定ID,周围文本则正常代币化.

### 聊天模板

这也是大多数人最容易实现错误的地方.

当你向聊天模式发送消息时,API接收一个消息列表:

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

模型看到的不是JSON――它看到的是一个平的代币序列――聊天模板使用特殊代币 把消息转换为这个平序列――每个模型的做法都不同:

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

模板一旦写错误,模型就会输出垃圾――它是在一个精确的形式上训练的――任何偏差,例如缺少换行、代码调换、多一个空格,都会把输入放到训练分布之外――

### 速度

对于生产级代币化来说太慢了.

面标记也就是面标记也就是面标记,SentencePiece是C++──这些相比纯 Python可以达到10-100倍的速度──

作为参考:如果以每秒100万代币的速度为Llama 3预训练代币,需要174天――以每秒100万代币的速度,只需要1.7天――

在生产环境中,你会使用编译实现,只接触到Python包装.


```figure
weight-tying
```

## 构建它

### 步骤1:字节级编码

基础──把任意字符串转换为字节序列,把每个字节映射为用于显示可打印字符,并反向恢复──

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

在多语言文本上测试字节数量:

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

你好是5字节──你好是6字节──每字符3个)──火焰的爱默契是4字节──字节级代币器 不关心它是什么语言──字节就是字节──

### 步骤2:使用 Regex 的预托克尼化器

使用GPT-2regex模式 把文本拆成碎片──每一块都会被BPE独立代币化──

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

`regex`支持 Unicode 属性逃离了(`\p{L}`表示字母,`\p{N}`表示数字) ・标准图书馆 的 `re`对于生产级多语言代币器,请安装`regex`,我知道.

试一下:

```python
print(pre_tokenize("Hello, world! Don't stop."))
# [' Hello', ',', ' world', '!', " Don", "'t", ' stop', '.']
```

前导空格会附在词上. 合约会在使徒处分开. 点会成为自己的部分.

### 步骤3: 字节序列上的 BPE

现在,它是预先代币化的块上独立运行.

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

### 步骤4:特殊的标志处理

需要精确匹配和固定身份证.

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

### 步骤5: 完整的标记器类

把所有部分串起来:正常化,按特殊代币分开,预代币化,BPE合并,映射到ID.

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

### 六步:多语言测试

现在,我在试看了它.

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

中文字符 每个字符产生3字节. 情感符号产生4字节.

## 使用它

### 实际的代币交易者

加载Llama 3、GPT-4 和Mistral的真实代币化器.

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

你会看到同一段文本有不同的代币数量――Llama 3的词汇为 128K,对常见模式的融合更激进――GPT-4的 100K 处于中间――Mistral的 32K 将产生更多代币,但嵌入层更小――

总是相同的:更大的词汇意味着更短的序列,但也意味着更多参数.

## 交付它

本课会产出一个用于构建和调试生产级代币的提示.`outputs/prompt-tokenizer-builder.md`,我知道.

## 练习

1. **Easy:**添加一个`get_token_bytes(id)`为了显示任意代币ID的原始字节,使用它检查您最常见的合并代币.
2. **Medium:**实现Llama式预标记器:按白空间 和数字 拆分,但保留领先空间. 在同一个体内上,将其词汇与GPT-2regex方法对比.
3. **Hard:**添加一个聊天模板方法,接收 `{"role": ..., "content": ...}`列表的信息列表,并为Llama 3聊天格式 生成正确的代币序列.

## 关键词

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

## 进一步阅读

- [OpenAI tiktoken source](https://github.com/openai/tiktoken)-- GPT-3.5/4 使用的性BPE实现
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers)-- 支持BPE、WordPiece、Unigram 的纹标记库
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783)-- 128K词汇和代码器训练的细节
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226)--语言认知标记
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py)-- 原始字节到Unicode映射
