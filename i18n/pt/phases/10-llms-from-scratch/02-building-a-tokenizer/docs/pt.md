# Construindo um Tokenizer a partir do zero

> Lição 01  dá-te uma brinquedo  Esta lição dá-te uma arma

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 分钟

## Objetivos de aprendizagem

- Construir um tokenizer BPE de classe produção, capaz de processar Unicode  white space normalization 和 special tokens
- 实现 fallback de nível de byte, deixe o tokenizer pode codificar qualquer entrada ((incluindo emoji、CJK 和代码), e não produzir tokens desconhecidos
- 添加 pre-tokenization regex padrões, в приложении BPE merge 之前按字界限 拆分文本
- Em corpus 上 train auto-definir tokenizer, e em vários idiomas texto sobre o compartilhamento de tiktoken  avaliar sua relação de compressão

## 问题

Você pode processar o texto em inglês. Agora, você pode jogar o texto em ele.

Vai-se estragar.

Não é porque o BPE  errou, mas porque implementar não está completo. O tokenizer de nível de produção deve processar bytes brutos de codificação arbitrária, normalizar Unicode antes de se separar, gerir tokens especiais que nunca serão fundidos, colocar a pré-tokenização e a subpalavra dividindo 串起, e tudo isso deve ser suficientemente rápido, não pode atrasar o processamento de 15 trilhões de tokens.

O tokenizer do GPT-2 tem 50,257 tokens. O Llama 3 tem 128,256 tokens. O GPT-4 tem cerca de 100.000 tokens. Estes não são números de brinquedos. Estes são o vocabulário de todas as tabelas de fusão, treinados em 100 GB de texto.

O que vais construir é este mecanismo.

## 概念

### 完整 Pipeline

O tokenizer de classe de produção não é um algoritmo. É composto por cinco fases, cada fase resolvendo diferentes problemas.

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

Cada fase tem responsabilidades específicas:

| Stage | What It Does | Why It Matters |
|-------|-------------|----------------|
| Normalize | NFKC Unicode，可选 lowercase，可选 strip accents | “fi” ligature (U+FB01) 会变成 “fi”（两个字符）。没有它，同一个词会得到不同 tokens。 |
| Pre-Tokenize | 在 BPE 之前把文本拆成 chunks | 防止 BPE 跨 word boundaries merge。“the cat”绝不应该产生 token “e c”。 |
| BPE Merge | 对 byte sequences 应用学到的 merge rules | 核心压缩步骤。把 raw bytes 转成 subword tokens。 |
| Special Tokens | 注入 [BOS]、[EOS]、[PAD]、chat template markers | 这些 tokens 有固定 ID。它们从不参与 BPE merges。模型需要它们来表示结构。 |
| ID Mapping | 把 token strings 转换为 integer IDs | 模型看到的是整数，不是字符串。 |

### BPE de nível byte

Lição 01 do tokenizer 作用在 UTF-8 bytes 上──这是正确选择──但我们跳过一个重要问题:当这些字节不有效 UTF-8 时会发生什么?

BPE de nível de byte 通过把每一个可能的字节值 ((0-255) 都视为有效代币来解决这个问题――你的基础词汇正好有 256 项―― Qualquer documento, seja texto、二进制还是损坏内容, pode ser tokenized em circunstâncias de não produzir um token desconhecido――

GPT-2  adicionar uma técnica: colocar cada byte 映射到一个打印的 Unicode 字符, assim o vocabulário 保持人读的──Byte 0x20 空间) transforma-se em caracteres G──

A capacidade verdadeira está em:BPE de nível de byte 能处理地球上的每一种语言──中文字符每个是3 个 UTF-8字节──日文可以是3-4个字节──阿拉伯文、德瓦纳gari、emoji,全都是字节序列──BPE 算法在这些字节序列中寻找模式,方式和它在英语 ASCII字节中寻找模式完全相同──

### Pre-tokenization

Antes de processar o texto BPE, você precisa primeiro desmontá-lo em pedaços. Isso pode evitar que o algoritmo combine criando tokens de fronteiras de palavras.

GPT-2 Use a um padrão regex para separar o texto:

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

Este padrão vai ser feito de acordo com contrações ((don transformar don + 't) 、带可选前导空格的词、数字、点点 和白空格 进行拆分;; don变成 don + 't) 带可选前导空格的词、数字、点点 和白空格 进行拆分;; 前导空格会保留并附在词上上,所以 the cat 会变成 ["the", "cat"],而不是 ["the", "", "cat"]。

Llama usa SentencePiece, ele completamente saltou regex. Ele coloca o fluxo de byte bruto como uma longa sequência, deixando o BPE álgôfago se encontrar a fronteira.

Esta escolha é importante. O regex do GPT-2 vai impedir o tokenizer de aprender a um termo final do the 和下一个词开头的 the 应该合并.

### Tokens especiais

Cada tokenizer de produção de classe será marcado para a estrutura e manter os IDs de token:

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

Tokens especiais 永远不会被 BPE 拆分──它们会在 merge 算法运行前被精确匹配,替换为固定 ID,周围文本则正常代币化──

### Modelos de chat

É o lugar onde a maioria das pessoas está confusa, e também é mais fácil fazer com que as coisas aconteçam.

Quando você entrar em chat modelo 发送消息时,API 接收一个消息列表:

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

模型看的不是 JSON──它看的是一个平的代币序列──chat 模板 使用特殊代币 把消息 转换为这个平序列──每个模型的做法都不同:

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

Uma vez que o modelo escreve erroneamente, o modelo acaba por emitir lixo. Ele está em um formato preciso de treinamento. Qualquer desvio, por exemplo, falta de troca de tokens, troca de tokens, mais um espaço, pode colocar o input fora da distribuição do treinamento.

### Velocidade

Python é muito lento para a tokenização de nível de produção.

Tiktoken (OpenAI) é usado por Rust 写的,并提供 Python bindings──HuggingFace tokenizers 也是Rust──SentencePiece é C++──这些相比纯Python可以达到10-100x speedups──

Como referência: se a velocidade de 1 milhão de tokens por segundo (fast Python) for Llama 3 pre-treinamento tokenize 15 trilhões de tokens, precisará de 174 天──以 100 milhões de tokens por segundo (Rust) da velocidade, apenas precisará de 1,7 天──

Você usa Python para construir, para entender algoritmos. Em ambiente de produção, você usa compilated implement, apenas contato com o Python wrapper.


```figure
weight-tying
```

## Construí-lo

### Passo 1: Encodificação de nível de byte

Base: 把任意字符串转换为字节序列,把每个字节映射为用于显示可打印字符,并反向恢复.

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

Em vários idiomas, o conteúdo de byte é:

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

hello é 5 bytes──你好 é 6 bytes──cada caracter 3 个)──火焰 emoji é 4 bytes──byte-level tokenizer 不关乎它是什么语言──Bytes 就是 bytes──

### Passo 2: Pre- Tokenizer com Regex

Use GPT-2 regex padrão Colocar o texto em pedaços. Cada pedaço é tokenizado independentemente.

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

`regex`módulo 支持 propriedade Unicode escapa(`\p{L}`Indicar letras,`\p{N}`Indicar números) ・ biblioteca padrão `re`Modulo não suporta, por isso nós voltamos para as classes de caracteres ASCII. Para a produção de tokenizer multilingue, por favor, instale.`regex`- Não.

- Não .

```python
print(pre_tokenize("Hello, world! Don't stop."))
# [' Hello', ',', ' world', '!', " Don", "'t", ' stop', '.']
```

A pontuação se tornará sua própria peça. BPE nunca atravessará essas fronteiras.

### Passo 3: BPE em sequências de byte

Lição 01 中 中的核心算法, mas agora está em trocos pré-tokenizados 上独立运行.

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

### Passo 4: Manuseio de Tokens Especiais

Tokens especiais precisam de uma correspondência precisa e uma identificação fixa.

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

### Passo 5: Classe de Tokenizer Completo

Colocar todas as partes: normalizar, por tokens especiais, separar, pre-tokenizar, mergar, mapear para IDs.

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

### Passo 6: Teste de Multilinguagem

O teste real é o que eu faço.

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

中文字符每个产生3 bytes──emoji 产生4 bytes──它们都不会让代币器 崩──也都不会产生未知代币──这就是字节级BPE的力量──

## Use-o

### Comparar Tokenizers reais

Carregar os tokenizadores reais de Llama 3、GPT-4 和 Mistral. Observe como eles lidam com o mesmo.

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

Você verá o mesmo parágrafo do texto com diferentes números de tokens. O vocabulário da Lama 3 é de 128K, para a fusão do modo comum mais intensificada.

tradeoff 总是一样的: maior vocabulário significa menor sequência, mas também significa mais parâmetros.

## Entrega-o

O presente curso produz um prompt para a construção e a regulação de tokenizadores de classe de produção.`outputs/prompt-tokenizer-builder.md`- Não.

## 练习

1. **Easy:**- Adicione um .`get_token_bytes(id)`método, para mostrar bytes brutos de qualquer token ID. Use-o para verificar os tokens combinados mais comuns.
2. **Medium:**实现 Llama-style pre-tokenizer:按白空 和数字 拆分,但保留领先空间──在同一个 corpus上,将其词汇与GPT-2 regex方法对比──
3. **Hard:**添加一个聊天模板方法,接收 `{"role": ..., "content": ...}`Lista de mensagens,并为 Llama 3 chat format 生成正确的代币序列──将它与 HuggingFace implementação 对照测试──

## Termos-chave

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

## Mais leitura

- [OpenAI tiktoken source](https://github.com/openai/tiktoken)-- GPT-3.5/4 Utilizativo de implementação de Rust BPE
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers)-- 支持 BPE、WordPiece、Unigram's Rust tokenizer library
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783)-- 128K vocabulário e treinamento de tokenizer
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226)-- Tokenization linguística-agnóstica
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py)-- original mapeamento de byte para Unicode
