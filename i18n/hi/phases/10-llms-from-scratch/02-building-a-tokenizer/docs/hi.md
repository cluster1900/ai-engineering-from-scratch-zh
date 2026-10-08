# स्क्रैच से टोकन बनाने का काम

> पाठ 1  तुम्हें एक खिलौना दिया  यह पाठ तुम्हें एक हथियार दिया 

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 分钟

## सीखने के लक्ष्य

-  निर्माण एक उत्पादन स्तर BPE टोकन, सक्षम करने के लिए Unicode, सफेद स्थान सामान्यीकरण और विशेष टोकन संसाधित
- 实现 बाइट-स्तर fallback,让 टोकनराइज़र को कोड करने के लिए किसी भी प्रविष्टि को सक्षम करें, जिसमें इमोजी, CJK और कोड शामिल हैं), और अज्ञात टोकन उत्पन्न न करें
- 添加 pre-tokenization regex पैटर्न, in अनुप्रयोग BPE विलय  पहले शब्द सीमाओं के अनुसार 拆分文本
- में corpus 上 प्रशिक्षण स्व परिभाषित टोकन, और कई भाषाओं में पाठ पर तुलना में टिक टोकन  मूल्यांकन इसकी संपीड़न अनुपात

## 问题

आप पाठ 01 में लिखे गए BPE टोकनराइज़र को अंग्रेजी पाठों को संसाधित कर सकते हैं।

यह टूट जाएगा.

यह इसलिए नहीं है क्योंकि बीपीई  गलती हुई है, बल्कि इसलिए है कि यह पूरा नहीं है। उत्पादन स्तर टोकनराइज़र को किसी भी एन्कोडिंग के कच्चे बाइट्स को संसाधित करना है, डिलीवरी से पहले यूनिकोड को सामान्य बनाना है, विशेष टोकन को प्रबंधित करना है जो कभी विलय नहीं होंगे, प्री-टोकेनाइज़ेशन और उपशब्द विभाजन को जोड़ना है, और यह सब पर्याप्त तेजी से, 15 ट्रिलियन टोकन के प्रशिक्षण पाइपलाइन को संसाधित करने में देरी नहीं कर सकता है।

जीपीटी-2 के टोकनराइज़र में 50,257 टोकन हैं। लमा 3 में 128,256 टोकन हैं। जीपीटी-4 में लगभग 100,000 टोकन हैं। ये खिलौना संख्याएं नहीं हैं। इन शब्दावली के पीछे के मेज टेबल में 100 जीबी ग्रंथों में प्रशिक्षित हैं, जबकि बाहरी तंत्र, यानी सामान्यीकरण, पूर्व टोकनकरण, विशेष टोकन इंजेक्शन, चैट टेम्पलेट प्रारूपण, केवल हैलो वर्ल्ड के टोकनराइज़र को संसाधित करने और पूरे इंटरनेट नेटवर्क के टोकनराइज़र को संसाधित करने में सक्षम है।

आप इस तंत्र को बनाने के लिए है।

## 概念

### 完整 पाइपलाइन

उत्पादन स्तर टोकनराइज़र एक एल्गोरिथ्म नहीं है। यह पांच चरणों से बना पाइपलाइन है, प्रत्येक चरण में विभिन्न समस्याओं का समाधान किया जाता है।

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

प्रत्येक चरण में विशिष्ट कार्य हैं:

| Stage | What It Does | Why It Matters |
|-------|-------------|----------------|
| Normalize | NFKC Unicode，可选 lowercase，可选 strip accents | “fi” ligature (U+FB01) 会变成 “fi”（两个字符）。没有它，同一个词会得到不同 tokens。 |
| Pre-Tokenize | 在 BPE 之前把文本拆成 chunks | 防止 BPE 跨 word boundaries merge。“the cat”绝不应该产生 token “e c”。 |
| BPE Merge | 对 byte sequences 应用学到的 merge rules | 核心压缩步骤。把 raw bytes 转成 subword tokens。 |
| Special Tokens | 注入 [BOS]、[EOS]、[PAD]、chat template markers | 这些 tokens 有固定 ID。它们从不参与 BPE merges。模型需要它们来表示结构。 |
| ID Mapping | 把 token strings 转换为 integer IDs | 模型看到的是整数，不是字符串。 |

### बाइट लेवल बीपीई

पाठ 01 का टोकन बनाने वाला UTF-8 बाइट्स पर 作用 上── यह सही विकल्प है── लेकिन हम एक महत्वपूर्ण प्रश्न छोड़ दियाः जब ये बाइट्स UTF-8 有效 नहीं होते हैं तो क्या होगा?

बाइट-स्तर बीपीई ️ प्रत्येक संभावित बाइट मूल्य ️0-255) ️ सभी को वैध टोकन के रूप में देखा जाता है इस समस्या को हल करने के लिए ️ आपका बुनियादी शब्दावली ️ ठीक है 256 ️ ️ कोई भी फ़ाइल, चाहे वह पाठ हो ️ दोहन या क्षतिग्रस्त सामग्री, सभी अज्ञात टोकन उत्पन्न नहीं होने के मामले में टोकन हो ️

GPT-2  जोड़ना एक तकनीकः प्रत्येक बाइट 映射到一个打印的Unicode 字符, इस प्रकार शब्दावली 保持人读性──0x20 字节 (Byte) G── यह केवल बाहरी प्रसंस्करण है।

सच्ची क्षमता यह है कि बाइट-स्तर BPE पृथ्वी पर हर भाषा को संसाधित कर सकता है। प्रत्येक में 3 UTF-8 बाइट्स होते हैं।

### पूर्व टोकनकरण

BPE प्रोसेसिंग टेक्स्ट से पहले, आपको इसे पहले टुकड़ों में तोड़ने की आवश्यकता है।

GPT-2 एक रेगएक्स पैटर्न का उपयोग करने के लिए अलग करने के लिएः

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

यह पैटर्न संकुचन के अनुसार होगा(don बन जाये don + 't) 、带可选前导空格的字、数字、点点 和白空格 进行拆分──前导空格会保留并附着在词上上,所以 the cat 会变成 ["the", "cat"],而不是 ["the", "", "cat"]。

Llama उपयोग वाक्य टुकड़ा, यह पूरी तरह से regex से कूद गया है। यह कच्चे बाइट स्ट्रीम को एक लंबी क्रम के रूप में रखता है, जिससे BPE 算法 खुद को सीमा खोजने में मदद करता है। यह अधिक सरल है, लेकिन यह भी BPE  अधिक स्वतंत्रता देता है क्रॉस-वर्ड टोकन बनाने के लिए।

यह विकल्प महत्वपूर्ण है―― जीपीटी-2 का रेगेक्स टोकन बनाने वाले को एक शब्द के अंत तक पहुंचने से रोकता है the 和下一个词开头的 the 应该合并──SentencePiece 允许这种情况, कभी-कभी अधिक कुशल संपीड़न उत्पन्न होता है, लेकिन टोकन की व्याख्याशीलता कम होती है──

### विशेष टोकन

प्रत्येक उत्पादन स्तर टोकन बनाने वाले शहर संरचना के लिए टोकन आईडी को चिह्नित करने के लिए बनाए रखे जाएंगेः

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

विशेष टोकन 永远不会被 BPE 拆分──它们会在合并 算法运行前被精确匹配,替换为固定ID,周围文本则正常代币化──

### चैट टेम्पलेट्स

यह ज्यादातर लोगों के लिए सबसे आसान है कि वे गलत काम कर सकें।

जब आप चैट मॉडल 发送消息时,API 接收一个消息列表:

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

模型看到的不是 JSON──它看到的是一平的代币序列──聊天模板使用特殊代币 把消息转换成这个平序列──每个模型的做法都不同:

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

टेम्पलेट एक बार लिखने के बाद, मॉडल कचरा आउटपुट करेगा। यह एक सटीक प्रारूप पर प्रशिक्षण के लिए है। किसी भी विकृति, जैसे कि कमी परिवर्तन, टोकन परिवर्तन, और एक खाली स्थान, सभी इनपुट को प्रशिक्षण वितरण के बाहर डाल देंगे।

### गति

उत्पादन स्तर टोकनकरण के लिए पायथन बहुत धीमा है।

टिक टोकन (OpenAI) Rust 写的,并提供 Python बंधन──HuggingFace टोकनाइज़र 也是 Rust──SentencePiece C++── ये साफ़ Python की तुलना में 10-100x स्पीडअप तक पहुंच सकते हैं──

作为参考: यदि Llama 3 प्री-ट्रेनिंग टोकन 15 ट्रिलियन टोकन के लिए प्रति सेकंड 1 मिलियन टोकन की गति से है, तो 174 天──以 प्रति सेकंड 100 मिलियन टोकन ((रस्ट) की गति से, केवल 1.7 天── की आवश्यकता होगी।

आप पायथन का उपयोग करते हैं 构建, 为了理解算法──在生产环境中, आप编译实现 का उपयोग करेंगे, केवल पायथन रैपर से संपर्क करें──


```figure
weight-tying
```

##  इसे निर्माण

### चरण 1: बाइट-स्तर एन्कोडिंग

基础──把任意字符串转换为字节序列,把每个字节 映射为用于显示可打印字符,并反向恢复──

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

在多语言文本上测试 बाइट्स गिनतीः

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

hello है 5 बाइट्स。你好 है 6 बाइट्स( प्रत्येक字符 3 个)。火焰 इमोजी है 4 बाइट्स。 बाइट स्तर टोकनराइज़र 不关心它是什么语言── बाइट्स 就是 बाइट्स。

### चरण 2: रेजेक्स के साथ प्री-टोकनाइज़र

GPT-2 रेजेक्स पैटर्न का उपयोग करें इसे टुकड़ों में तोड़ें। प्रत्येक टुकड़ा को BPE द्वारा स्वतंत्र रूप से टोकन किया जाता है।

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

`regex`module 支持 यूनिकोड गुण भाग जाता है(`\p{L}`अक्षरों का प्रदर्शन करना,`\p{N}`☐ मानक पुस्तकालय`re`मॉड्यूल समर्थन नहीं है, इसलिए हम ASCII वर्ण वर्गों में वापस आते हैं.`regex`

试一下:

```python
print(pre_tokenize("Hello, world! Don't stop."))
# [' Hello', ',', ' world', '!', " Don", "'t", ' stop', '.']
```

पूर्व导空格会附在词上──Contractions会在使徒文献处分开──Punctuation会成为自己的部分──BPE 永远不会跨这些边界融合代币──

### चरण 3: बाइट अनुक्रम पर बीपीई

पाठ 01 中 中的核心算法, लेकिन अब पूर्व-टोकेनाइज़्ड टुकड़े ऊपर स्वतंत्र रूप से चल रहे हैं

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

### चरण 4: विशेष टोकन हैंडलिंग

विशेष टोकन  सटीक मिलान और निश्चित आईडी की आवश्यकता होती है  वे पूरी तरह से बीपीई को पार करते हैं

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

### चरण 5: पूर्ण टोकनइज़र वर्ग

सभी भागों को जोड़ें: सामान्यीकरण, विशेष टोकन के अनुसार, डिलीट करें, पूर्व टोकन, बीपीई विलय, आईडी में मैगज़ीन करें।

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

### चरण 6: बहुभाषी परीक्षा

⇒ अंग्रेज़ी, चीनी, इमोजी, कोड सब फेंक दो

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

中文字符 प्रत्येक 3 बाइट्स उत्पन्न करते हैं. इमोजी 4 बाइट्स उत्पन्न करते हैं. ये भी टोकन बनाने में सक्षम नहीं होते हैं.

## इसका उपयोग करें

### वास्तविक टोकन बनाने वालों की तुलना

√ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √     √                                                                                

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

आप एक ही लेख में अलग-अलग टोकन गिनती देखेंगे। लामा 3 का शब्दावली 128K है, सामान्य मॉडल के विलय के लिए अधिक सक्रियण। GPT-4 का 100K मध्य में है।

tradeoff 总是一样的: बड़ा शब्दावली का अर्थ होता है छोटा क्रम, लेकिन इसका अर्थ भी होता है अधिक पैरामीटर──

## 交付 यह

इस वर्ग में एक त्वरित रूप से उत्पादन स्तर टोकन बनाने और बनाने के लिए एक त्वरित रूप से प्रस्तुत किया गया है।`outputs/prompt-tokenizer-builder.md`

## अभ्यास

1. **Easy:**添加一个 `get_token_bytes(id)`विधि, किसी भी टोकन आईडी के कच्चे बाइट्स को प्रदर्शित करने के लिए उपयोग करें।
2. **Medium:**实现 लामा शैली पूर्व-टोकनाइज़र:按白空 和数字 拆分, लेकिन अग्रणी रिक्त स्थानों को बनाए रखना──在同一个体内上,将其词汇与GPT-2regex दृष्टिकोण对比──
3. **Hard:**添加一个聊天模板方法,接收 `{"role": ..., "content": ...}`संदेश सूची,并为 Llama 3 चैट प्रारूप 生成正确的代币序列──将它与 HuggingFace कार्यान्वयन对照测试──

## प्रमुख शर्तें

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

## आगे पढ़ना

- [OpenAI tiktoken source](https://github.com/openai/tiktoken)-- GPT-3.5/4 उपयोग का रुस्ट बीपीई कार्यान्वयन
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers)-- 支持 BPE、WordPiece、Unigram के रुस्ट टोकनराइज़र पुस्तकालय
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783)-- 128K शब्दावली और टोकन प्रशिक्षण के विवरण
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226)-- भाषा-अज्ञानी टोकनकरण
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py)-- मूल बाइट-टू-यूनीकोड मानचित्रण
