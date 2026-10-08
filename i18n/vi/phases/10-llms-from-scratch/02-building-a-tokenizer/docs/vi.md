# Xây dựng một Tokenizer từ đầu

> Bài học 01  đã cho bạn một đồ chơi  Bài học này sẽ cho bạn một vũ khí

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 分钟

## Mục tiêu học tập

- Construct a production class BPE tokenizer, có thể xử lý Unicode, thông thường hóa không gian trắng và các token đặc biệt
- 实现 byte-level fallback, để tokenizer có thể编码 bất kỳ输入 nào(bao gồm emoji、CJK 和代码), và không tạo ra các token không rõ
- 添加 pre-tokenization regex patterns, trong ứng dụng BPE hợp nhất 之前按字界限 拆分文本
- Trong tập thể trên tập tự xác định tokenizer, và trên nhiều ngôn ngữ văn bản trên đối với tiktoken  đánh giá tỷ lệ nén của nó

## 问题

Bạn có thể xử lý các mã thông báo BPE trong bài học 01 ⋅ giờ đây hãy ném các mã thông báo vào nó ⋅ hoặc emoji ⋅ hoặc kết hợp tab và không gian của Python 码 ⋅

Nó sẽ bị hỏng.

Không phải vì BPE 错了, mà vì实现不完整――生产级代币器 phải xử lý các oct nguyên liệu của mã hóa tùy ý, trước khi phân chia, bình thường hóa Unicode, quản lý các token đặc biệt sẽ không bao giờ được hợp nhất, đưa pre-tokenization và phân chia phụ từ lên, và tất cả những điều này đều đủ nhanh, không thể trì hoãn xử lý 15 nghìn tỷ token của đường ống đào tạo――

GPT-2 có 50,257 token. Llama 3 có 128,256 token. GPT-4 có khoảng 100.000 token. Đây không phải là một số trò chơi. Những bảng từ vựng này được đào tạo trên 100 GB, trong khi cơ chế bên ngoài, đó là bình thường hóa, chuẩn hóa trước, tiêm token đặc biệt, định dạng mẫu trò chuyện, chỉ có thể xử lý các token Hello World và có thể xử lý toàn bộ các token trên Internet.

Cái mà cậu sẽ xây dựng là cơ chế này.

## 概念

### 完整 đường ống

生产级代币器 不是一个算法―― nó được tạo thành từ 5 giai đoạn, mỗi giai đoạn giải quyết các vấn đề khác nhau――

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

Mỗi giai đoạn có trách nhiệm cụ thể:

| Stage | What It Does | Why It Matters |
|-------|-------------|----------------|
| Normalize | NFKC Unicode，可选 lowercase，可选 strip accents | “fi” ligature (U+FB01) 会变成 “fi”（两个字符）。没有它，同一个词会得到不同 tokens。 |
| Pre-Tokenize | 在 BPE 之前把文本拆成 chunks | 防止 BPE 跨 word boundaries merge。“the cat”绝不应该产生 token “e c”。 |
| BPE Merge | 对 byte sequences 应用学到的 merge rules | 核心压缩步骤。把 raw bytes 转成 subword tokens。 |
| Special Tokens | 注入 [BOS]、[EOS]、[PAD]、chat template markers | 这些 tokens 有固定 ID。它们从不参与 BPE merges。模型需要它们来表示结构。 |
| ID Mapping | 把 token strings 转换为 integer IDs | 模型看到的是整数，不是字符串。 |

### BPE cấp bằng byte

Bài học 01 của tokenizer 作用在 UTF-8 byte 上──这是正确选择──但我们跳过一个重要问题:

BPE cấp bayt 通过把每一个可能的字节值 ((0-255) 都视为有效代币来解决这个问题――你的基础词汇正好有 256 项――任何文件,无论是文本、二进制还是损坏内容,都可以在不产生未知的代币的情况下被代币化――

GPT-2  thêm một kỹ thuật:把每个字节 映射到一个可打印的 Unicode字符,这样词汇 保持人读的──Byte 0x20(空间) trong việc映射它们变成字符 G──这只是外观处理──算法本身不关心──

Capacity thực sự nằm trong:BPE cấpbyte 能 xử lý mọi ngôn ngữ trên trái đất.

### Pre-Tokenization

Trước khi xử lý văn bản BPE, bạn cần phải tách nó thành từng mảnh. Điều này có thể ngăn chặn việc hợp nhất các thuật toán tạo ra các token vượt qua ranh giới từ.

GPT-2 sử dụng một mô hình regex để phân chia văn bản:

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

Đây là một mẫu sẽ theo thu hẹp. Vì vậy, the cat 会变成 ["the", "cat"], thay vì ["the", "", "cat"]。

Llama sử dụng SentencePiece, nó hoàn toàn nhảy qua regex. Nó đưa dòng byte thô như một chuỗi dài, để BPE tự tìm được giới hạn.

Đây là một lựa chọn rất quan trọng. GPT-2 sẽ ngăn chặn token học được một từ cuối cùng của the 和下一个词开头 của the 应该合并.

### Các token đặc biệt

Mỗi sản xuất cấp tokeniser sẽ được xây dựng để ghi nhận giữ thẻ ID:

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

Các mã thông báo đặc biệt sẽ không bao giờ bị BPE phân chia. Chúng sẽ được kết hợp với các mã thông báo khác nhau.

### Các mẫu trò chuyện

Đó là nơi mà hầu hết mọi người bị bối rối, và dễ dàng nhất để thực hiện sai lầm.

Khi bạn vào chat mô hình 发送消息时,API 接收一个消息列表:

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

模型看的不是 JSON──它看的是一个平的代币序列──聊天模板 使用特殊代币 把消息转换为这个平序列──每个模型的做法都不同:

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

Khi viết sai, mô hình sẽ xuất xả rác. Nó được thực hiện theo một định dạng chính xác. Bất kỳ sự khác biệt nào, chẳng hạn như thiếu thay đổi, mã thông báo, thay đổi, nhiều không gian, đều sẽ đưa vào và phân phối ngoài tập luyện.

### Tốc độ

Python đối với việc sản xuất các token quá chậm.

tiktoken (OpenAI) là dùng Rust 写的,并提供 Python liên kết.

作为参考: Nếu tốc độ của Llama 3 là 15 nghìn tỷ token, cần 174 天――以每秒 100 triệu token (Rust) tốc độ, chỉ cần 1.7 天――

Bạn sử dụng Python để xây dựng, để hiểu thuật toán. Trong môi trường sản xuất, bạn sẽ sử dụng biên dịch để thực hiện, chỉ tiếp xúc với gói Python.


```figure
weight-tying
```

##  xây dựng nó

### Bước 1: Mã hóa cấp độ byte

基础──把任意字符串转换为字节序列,把每个字节 映射为用于显示可打印字符,并反向恢复──

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

Trong nhiều ngôn ngữ văn bản trên测试 số lượng byte:

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

hello 是 5 bytes──你好 是 6 bytes──每字符3个)──火焰 emoji 是 4 bytes──byte-level tokenizer 不关心它是什么语言──Bytes 就是 bytes──

### Bước 2: Pre- Tokenizer với Regex

Sử dụng mô hình GPT-2 regex 把文本拆分块──每块都会被BPE 独立代币化──

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

`regex`module 支持 thuộc tính Unicode thoát khỏi(`\p{L}`biểu hiện các chữ cái,`\p{N}`biểu hiện số) ・ thư viện tiêu chuẩn của `re`module không hỗ trợ, vì vậy chúng tôi rơi lại vào lớp ký tự ASCII. Đối với sản xuất cấp đa ngôn ngữ tokeniser, xin cài đặt`regex`

试一下:

```python
print(pre_tokenize("Hello, world! Don't stop."))
# [' Hello', ',', ' world', '!', " Don", "'t", ' stop', '.']
```

前导空格会附在词上──Contractions 会在使徒字处分开──Punctuation 会成为自己的部分──BPE 永远不会跨这些边界合并代币──

### Bước 3: BPE trên các chuỗi byte

Bài học 01 中的核心算法, nhưng bây giờ là các khối tiền token 上独立运行.

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

### Bước 4: xử lý mã thông báo đặc biệt

Các mã thông báo đặc biệt cần phải xác định sự phù hợp và xác định ID.

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

### Bước 5: Kiểu Tokenizer đầy đủ

Hãy kết nối tất cả các phần: bình thường hóa, theo các mã thông báo đặc biệt, phân chia, pre-tokenize, BPE merge,映射到IDs.

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

### Bước 6: Kiểm tra đa ngôn ngữ

Thực sự test. Đưa emojis và mã lên nó.

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

中文字符 mỗi tạo ra 3 byte. Emoji tạo ra 4 byte. Chúng cũng không làm cho tokeniser bị phá vỡ.

## Sử dụng nó

### So sánh các token thực sự

加载 Llama 3、GPT-4 和 Mistral's True Tokenizers──观察它们如何处理同一个多语言段落──

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

Bạn sẽ thấy cùng một đoạn văn có số lượng token khác nhau. Từ vựng của Llama 3 là 128K, đối với các mô hình thường thấy kết hợp hơn hơn. 100K của GPT-4 đang ở giữa.

tradeoff 总是一样的: greater vocabulary nghĩa là chuỗi ngắn hơn, nhưng cũng có nghĩa là nhiều hơn các参数。

## 交付 nó

本课会产出一个用于构建和调试生产级代币器的提示.`outputs/prompt-tokenizer-builder.md`

## 练习

1. **Easy:**添加一个 `get_token_bytes(id)`Phương pháp, để hiển thị các byte thô của ID mã thông báo bất kỳ. Sử dụng nó để kiểm tra các mã thông báo hợp nhất bạn thường thấy.
2. **Medium:**实现 Llama-style pre-tokenizer:按白空 和数字 拆分, nhưng giữ nguyên các không gian dẫn.
3. **Hard:**添加一个聊天模板方法,接收 `{"role": ..., "content": ...}`danh sách tin nhắn,并为 Llama 3 chat định dạng 生成正确的代币序列──将它与 HuggingFace实现对照测试──

## Các điều khoản chính

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

## Đọc thêm

- [OpenAI tiktoken source](https://github.com/openai/tiktoken)-- GPT-3.5/4 使用的 Rust BPE thực hiện
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers)-- 支持 BPE、WordPiece、Unigram của thư viện token hóa Rust
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783)-- 128K từ vựng và tokenizer đào tạo
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226)-- token hóa ngôn ngữ-người hiểu biết
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py)-- 原始 byte-to-Unicode mapping
