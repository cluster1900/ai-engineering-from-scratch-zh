# Bir Tokenizer'i Baştan Yapmak

> Ders 1 Sana bir oyuncak verdi. Bu ders sana bir silah verdi.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 分钟

## Öğrenme Hedefleri

- Bir üretim sınıfı BPE tokenizer oluşturun, Unicode  beyaz alan normallaşımı ve özel tokenleri işleyebilsin
- 实现 byte-level fallback, let tokenizer can编码任何输入(包括emoji、CJK 和代码),且不产生未知代码
- 添加 pre-tokenization regex patterns,在应用 BPE  before according word boundaries 拆分文本
- On Corpus 上 training self defining tokenizer, on multi langua text on vs. tiktoken  değerlendirmek onun sıkıştırma oranı

## 问题

Ders 01'de yazdığınız BPE tokenizeri İngilizce metni işleyebilir. Şimdi de yazıyı ona atın.

Bozulur.

BPE'nin yanlış olması değil, yerine tamamlanmamış olması nedeniyle. Produksyon Sınıfı Tokenizer'in herhangi bir kodlama yapma ham baytlarını işlemeyi, parçalanmadan önce Unicode'u normalleştirmeyi, asla birleştirilmeyecek özel jetonları yönetmeyi, önceden jetonlama ve alt sözcük bölümü 串起, ve bunların hepsi yeterince hızlı, 15 trilyon jetonunu yavaş yavaş işlemeyi engelleyemedi.

GPT-2'nin tokenizatöründe 50,257 token var. Llama 3'ün 128,256 tane var. GPT-4'ün yaklaşık 100.000 tane var. Bunlar oyuncak sayıları değil. Bu kelimeler, 100 GB metinde eğitilmiştir.

Bu mekanizmayı inşa edeceksin.

## 概念

### 完整 Pipeline

生产级代币化器 不是一个算法――, her aşamada farklı sorunları çözen beş aşamalardan oluşan bir boru hattından oluşur.

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

Her aşamada belirli bir sorumluluk vardır:

| Stage | What It Does | Why It Matters |
|-------|-------------|----------------|
| Normalize | NFKC Unicode，可选 lowercase，可选 strip accents | “fi” ligature (U+FB01) 会变成 “fi”（两个字符）。没有它，同一个词会得到不同 tokens。 |
| Pre-Tokenize | 在 BPE 之前把文本拆成 chunks | 防止 BPE 跨 word boundaries merge。“the cat”绝不应该产生 token “e c”。 |
| BPE Merge | 对 byte sequences 应用学到的 merge rules | 核心压缩步骤。把 raw bytes 转成 subword tokens。 |
| Special Tokens | 注入 [BOS]、[EOS]、[PAD]、chat template markers | 这些 tokens 有固定 ID。它们从不参与 BPE merges。模型需要它们来表示结构。 |
| ID Mapping | 把 token strings 转换为 integer IDs | 模型看到的是整数，不是字符串。 |

### BPE byte seviyesinde

Ders 01'ün tokenizer 作用在 UTF-8 bytes 上──这是正确选择──但我们跳过一个重要问题:当这些字节不有效时UTF-8 时会发生什么?

Byte seviyesindeki BPE ızı, her olası byte değeri ızı olarak görülür ızı için bu sorunu çözmek için ızı olarak görülür ızı için ızı için 256 ızı var ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızı için ızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızızız

GPT-2  bir teknik artır: her baytı 映射を印刷可能なユニコード 字符に, böylece sözlük 単語を保持する 人間の読める―Byte 0x20 空間) 映射中文字 G──これは単なる外観処理──算法自身不关心──

Gerçek kapasite şu ki:BPE düzeyinde byte ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                             

### Tokenizasyon öncesi

BPE 处理文本之前, önce onu parçalara ayırmanız gerekir. Bu, 算法ların kelimelerin sınırlarını aşan belirtiler oluşturmasını önleyebilir.

GPT-2 bir regex örneği kullanmak için ayrıştır:

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

Bu desen kısıtlamalara göre olacaktır. don                                                                                                                                                                                                                                                         

Llama kullanmak SentencePiece, tamamen regex atladı. Bir uzun dizideyken çiğ bayt akışı bırakır, BPE algoritmasını kendi kendini sınırı bulmasına izin verir. Bu daha basit, ancak ayrıca BPE'ye çapraz kelime belirtileri oluşturma özgürlüğünü daha fazla verir.

Bu seçim çok önemlidir. GPT-2'nin regex, tokenizeciyi bir sözcük sonunun the 和下一个词开头的 the 应该合并的学习 (tökenizeciyi öğrenmek için engelleyecek) the 和下一个词开头的 the 应该合并──SentencePiece 允许这种情况,有时会产生更高效的压缩,但代币的解释性较弱──

### Özel Tokenler

Her üretim sınıfı tokenizer , yapısal olarak işaretleme için token kimliklerini koruyacaktır:

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

Özel tokenler  asla BPE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

### Çat Şablonları

Bu insanların çoğu kafa karıştığı ve hataları gerçekleştirmek için en kolay yer.

Çat modeline gönderdiğinizde, API bir mesaj listesini aldı:

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

Model görenin JSON olmadığını görüyor. Bu model bir 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平 平   平 平 平   平 平  平  平     平   平   

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

Şablon bir kez yazılırsa, model çöpe çıkaracaktır. Bu, belirli bir formada eğitimden oluşur.

### Hızlılık

Python, üretim seviyesinin tokenizasyonuna çok yavaş geliyor.

tiktoken (OpenAI) Rust 写的,并提供 Python bağlamaları──HuggingFace tokenizers 也是 Rust──SentencePiece C++──这些相比纯Python可以达到10-100x speedups──

Referans olarak: Eğer Llama 3'ün hızı saniyede 1 milyon token olursa, sadece 1.7 milyon token gerekecek.

Python'la yapılandırmak için algoritmayı anlamak için.


```figure
weight-tying
```

## Yapın onu.

### Adım 1: Byte-Level Kodlama

基础──把任意字符串转换为字节序列,把每个字节 映射为用于显示可打印字符,并反向恢复──

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

在多语言文本上测试 byte sayıları:

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

hello is 5 bytes──你好 is 6 bytes──每个字符3个)──火焰 emoji is 4 bytes──byte-level tokenizer 不关心它是什么语言──Bytes就是 bytes──

### Adım 2: Regex ile Pre- Tokenizer

GPT-2 regex modelini kullanın, metni parçalara ayırın. Her parça BPE tarafından bağımsız olarak tokenize edilir.

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

`regex`modül 支持 Unicode özelliği kaçıyor(`\p{L}`Gösterme harfleri,`\p{N}`Gösterme numaraları) ・ standart kütüphanesi `re`Modül desteklemiyor, bu yüzden ASCII karakter sınıflarına geri dönüyoruz.`regex`- Evet.

试一下:

```python
print(pre_tokenize("Hello, world! Don't stop."))
# [' Hello', ',', ' world', '!', " Don", "'t", ' stop', '.']
```

Ön导空格会附在词上──Contractions 会在 apostrophe处分开──Punctuation 会成为自己的部分──BPE 永远不会跨这些边界融合代币──

### Adım 3: Byte Sequences'te BPE

Ders 01 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中

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

### Dördüncü Adım: Özel İşaret İşlemi

Özel tokenler, BPE'yi tamamen atlatmaktadır.

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

### Adım 5: Tam Tokenizer Sınıfı

Bütün bölümleri bağlayın: normalleştirmek, özel tokenlere göre ayırmak, önceden tokenleştirmek, BPE birleştirmek, kimliklere yerleştirmek.

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

### Adım 6: Çok Dilli Sınav

Gerçek test. İngilizce, Çince, Emoji ve kodları da ona at.

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

中文字符每个产生3字节──emoji 产生4字节──它们都不会让代币器 崩──也都不会产生未知代币──这就是字节级 BPE 的力量──

## Kullan

### Gerçek Tokenizers'i karşılaştırmak

Llama 3 ̊GPT-4 ̊ Mistral'ın gerçek simgesellerini yükleyin.

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

Aynı bölümde farklı token sayıları göreceksiniz. Llama 3'ün kelime birikimi 128K'dir, normal modellerin birleşmesi daha da güçlenir. GPT-4'in 100K'sı ortadadır.

总是相同:更大的词汇意味着更短的序列,但也意味着更多参数──

## - Söyle.

Bu ders, üretim sınıfı tokenizörlerinin oluşturulması ve düzenlenmesi için bir ipucu ortaya çıkardı.`outputs/prompt-tokenizer-builder.md`- Evet.

## 练习

1. **Easy:**Bir ekle.`get_token_bytes(id)`Bu yöntem, herhangi bir token ID'nin çiğ baytlarını göstermek için kullanılır.
2. **Medium:**实现 Llama tarzı pre-tokenizer:按白空 和数字 拆分,但保留领先空间──在同一个 corpus上,将其词汇与GPT-2 regex yaklaşımı对比──
3. **Hard:**添加一个聊天模板方法,接收 `{"role": ..., "content": ...}`mesaj listesi,并为 Llama 3 sohbet biçimi 生成正确的令牌序列──将它与 HuggingFace uygulaması对照测试──

## Anahtar Terimler

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

## Daha Fazla Okumak

- [OpenAI tiktoken source](https://github.com/openai/tiktoken)-- GPT-3.5/4 使用的 Rust BPE uygulaması
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers)-- 支持 BPE、WordPiece、Unigram'ın Rust tokenizer kütüphanesi
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783)-- 128K kelime birikimi ve tokenizer eğitimi ayrıntıları
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226)-- dil-agnostik simgelendirme
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py)-- 原始 byte-to-Unicode haritası
