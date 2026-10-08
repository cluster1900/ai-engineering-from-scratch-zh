# Construire un Tokenizer à partir de zéro

> Leçon 1: Je t'ai donné un jouet.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 分钟

## Objectifs d'apprentissage

- Construire un jeton BPE de production, capable de traiter Unicode, normalisation de l'espace blanc et des jetons spéciaux
- 实现 byte-level fallback, permet au tokeniseur de coder n'importe quel type d'entrée (incluant les emoji, CJK et code), sans générer de jetons inconnus
- 添加 pre-tokenization régex modèles, dans l'application BPE fusions 之前按字界限 拆分文本
- Dans le corpus, vous pouvez vous entraîner à définir le tokenizer et à évaluer son rapport de compression par rapport au tiktoken.

##  problématique

Vous pouvez traiter le texte en anglais avec un tokenizer BPE écrit dans la leçon 01 .

Ça va se casser.

Non parce que BPE 错了, mais parce que réaliser non complet. Le tokenizer de production doit traiter les octets bruts de l'encodage, normaliser Unicode avant la décomposition, gérer les jetons spéciaux qui ne seront jamais fusionnés, mettre en place la pré-tokenization et la division de sous-parts, et tout cela doit être assez rapide, ne peut pas retarder le traitement de 15 milliards de jetons de pipeline de formation.

Le tokenizer de GPT-2 a 50 257 tokens. Llama 3 a 128 256 个. GPT-4 a environ 100 000 个. Ce ne sont pas des numéros de jouets. Ces tables de fusion sont formées sur des centaines de Go de texte, et le mécanisme extérieur, c'est-à-dire la normalisation, la pré-tokenisation, l'injection de tokens spéciaux, le formatage de modèles de chat, est de ne pouvoir traiter que les tokenizer de Hello World et de pouvoir traiter l'ensemble des tokenizer de l'Internet.

Ce que tu vas construire, c'est ce mécanisme.

## 概念

### 完整 Pipeline

Le tokenizer de classe de production n'est pas un algorithme. Il est constitué de cinq étapes, chacune de ces étapes résolvant différents problèmes.

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

Chaque étape a des responsabilités spécifiques:

| Stage | What It Does | Why It Matters |
|-------|-------------|----------------|
| Normalize | NFKC Unicode，可选 lowercase，可选 strip accents | “fi” ligature (U+FB01) 会变成 “fi”（两个字符）。没有它，同一个词会得到不同 tokens。 |
| Pre-Tokenize | 在 BPE 之前把文本拆成 chunks | 防止 BPE 跨 word boundaries merge。“the cat”绝不应该产生 token “e c”。 |
| BPE Merge | 对 byte sequences 应用学到的 merge rules | 核心压缩步骤。把 raw bytes 转成 subword tokens。 |
| Special Tokens | 注入 [BOS]、[EOS]、[PAD]、chat template markers | 这些 tokens 有固定 ID。它们从不参与 BPE merges。模型需要它们来表示结构。 |
| ID Mapping | 把 token strings 转换为 integer IDs | 模型看到的是整数，不是字符串。 |

### BPE de niveau octal

Leçon 01 Le tokenizer 作用在 UTF-8 octets 上──这是正确选择──但我们跳过一个重要问题:当这些 octets不有效 UTF-8 时会发生什么?

Le BPE de niveau octet 通过把每一个可能的字节值 ((0-255) 都视为有效代币来解决这个问题――你的基础词汇库正好有 256 项――任何文件,无论是文本、二进制还是损坏内容,都可以在不产生未知代币的情况下被代币化――

GPT-2  ajoute une technique: mettre chaque octet 映射到一个打印的Unicode 字符, de sorte que le vocabulaire 保持人读性──Byte 0x20 空间) dans leur映射变成字符 G──这只是外观处理──算法本身不关乎──

La capacité réelle de BPE est de traiter chaque langage de la planète. Chaque langage est de 3 octets UTF-8.

### Pré-tokenization

Avant de traiter le texte BPE, vous devez d'abord le décomposer en morceaux. Cela peut empêcher l'algorithme de fusion de créer des jetons de mots transverses.

GPT-2 Utilisez un modèle de régex pour décomposer le texte:

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

Ce modèle se comporte en contractions. Il ne se transforme pas en don + t) 带可选前导空格的字、数字、点点 和白空格 进行拆分──前导空格会保留并附着在词上,所以 the cat 会变成 ["the", "cat"],而不是 ["the", "", "cat"]。

Llama utilise SentencePiece, il a complètement sauté sur Regex. Il a laissé le flux de octets brut comme une longue séquence, permettant au BPE de trouver lui-même la frontière.

Cette sélection est importante. Le regex de GPT-2 empêche le tokenizer d'apprendre à un mot de bout de the 和下一个词开头的 the 应该合并.

### Les jetons spéciaux

Chaque tokenizer de production de classe sera structuré pour marquer et conserver les identifiants de jetons:

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

Les jetons spéciaux ne seront jamais séparés par BPE. Ils seront unifiés.

### Templates de chat

C'est là que la plupart des gens sont en difficulté, et aussi le plus facile de faire des erreurs.

Lorsque vous êtes à la mode de chat 发送消息时,API 接收一个消息列表:

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

模型看到的不是 JSON──它看到的是一个平的代币序列──聊天模板使用特殊代币 把消息转换为这个平序列──每个模型的做法都不同:

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

Une fois que le modèle est écrit, le modèle sort de la décharge. Il est dans un format précis de formation. Tout décalage, par exemple, la défaillance de la mise en ligne, les jetons, les jetons, le plus d'un espace, est mis en place à l'extérieur de la distribution de la formation.

### Vite

Python est trop lent pour la tokenization de la production.

Tiktoken (OpenAI) est utilisé par Rust 写的,并提供 Python liaisons。HuggingFace tokenizers 也是Rust。SentencePiece est C++。

作为参考: si la vitesse de 1 million de jetons par seconde est de Llama 3 pré-entraînement, il faut 174 天──以每秒 100 millions de jetons.

Vous utilisez Python pour construire, afin de comprendre l'algorithme. Dans un environnement de production, vous utilisez la compilation pour réaliser, en contactant uniquement le Python enveloppement.


```figure
weight-tying
```

## - Je le construis.

### Étape 1: Enchâssage au niveau octet

基础──把任意字符串转换为字节序列,把每个字节 映射为用于显示的可打印字符,并反向恢复──

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

Dans plusieurs langues, le nombre de octets est:

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

hello 是 5 bytes──你好 是 6 bytes(cada字符3个)──火焰 emoji 是 4 bytes──byte-level tokenizer 不关乎它是什么语言──Bytes 就是 bytes──

### Étape 2: Pré-tokenizer avec Regex

Utilisez le modèle GPT-2 Regex Placez le texte en morceaux. Chaque morceau est symbolisé par BPE.

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

`regex`module 支持 propriété Unicode échappe(`\p{L}`Indiquer les lettres,`\p{N}`Indiquer les numéros de bibliothèque standard`re`module n'est pas pris en charge, donc nous sommes retournés aux classes de caractères ASCII. Pour le tokenizer multilingue de production, s'il vous plaît installer`regex`Il y a une autre.

Je suis là.

```python
print(pre_tokenize("Hello, world! Don't stop."))
# [' Hello', ',', ' world', '!', " Don", "'t", ' stop', '.']
```

La ponctuation deviendra sa propre pièce. Le BPE ne traversera jamais ces frontières.

### Étape 3: BPE sur les séquences en octets

Leçon 01 Encore des algorithmes, mais maintenant ils sont des blocs pré-tokénisés.

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

### Étape 4: Traitement des jetons spéciaux

Les jetons spéciaux ont besoin d'une correspondance précise et d'une identification fixe.

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

### Étape 5: Classe de jetons complète

Rassembler toutes les parties: normaliser, par des jetons spéciaux, décomposer, pré-tokéniser, fusionner, cartographier, identifier.

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

### Étape 6: Test multilingue

J'ai essayé de le faire.

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

Les émojis génèrent 4 octets. Ils ne permettent pas à la jetonnerie de s'effondrer.

## Utilisez-le

### Comparer les vrais jetons

L'équipe de recherche de Mistral a été créée pour la première fois en 2008.

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

Vous verrez dans le même passage du texte des nombres de jetons différents. Le vocabulaire de Llama 3 est de 128K, pour la fusion de la forme habituelle, plus de dynamisme.

Le plus grand vocabulaire signifie plus courte séquence, mais aussi plus de paramètres.

## Je le livre.

Le cours a été créé pour la construction et la mise en place de la production de tokenizers.`outputs/prompt-tokenizer-builder.md`Il y a une autre.

## 练习

1. **Easy:**- Je suis là.`get_token_bytes(id)`méthode, pour afficher les octets bruts de l'ID de chaque jeton.
2. **Medium:**实现 Llama-style pré-tokenizer: selon l'espace blanc 和 chiffres 拆分, mais conserver les espaces de pointe──在同一个 corpus上,将其词汇与GPT-2 regex approche对比──
3. **Hard:**添加一个聊天模板方法,接收 `{"role": ..., "content": ...}`Liste de messages,并为 Llama 3 chat format 生成正确的代币序列──将它与 HuggingFace实施对照测试──

## Les termes clés

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

## Pour en savoir plus

- [OpenAI tiktoken source](https://github.com/openai/tiktoken)-- GPT-3.5/4 Utility of Rust BPE mise en œuvre
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers)-- 支持 BPE、WordPiece、Unigram de la bibliothèque de jetons de rouille
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783)-- 128K vocabulaire et formation de la marque
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226)-- Tokenization linguistique
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py)-- Origini byte à Unicode mapping
