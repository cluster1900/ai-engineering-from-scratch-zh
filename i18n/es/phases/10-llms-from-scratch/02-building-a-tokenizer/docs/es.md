# Construir un Tokenizer desde cero

> Lección 01 te dio un juguete... esta lección te dio un arma...

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 分钟

## Objetivos de aprendizaje

- Construir un tokenizer BPE de producción, capaz de procesar Unicode, normalización del espacio blanco y tokens especiales
- 实现 fallback de nivel de byte, permita que el tokenizer pueda codificar cualquier entrada(incluyendo emoji、CJK 和代码), y no genere tokens desconocidos
- 添加 pre-tokenization regex patrones, en aplicación BPE fusiones 之前按字界限 拆分文本
- En el corpus, entrenar el auto-definir el tokenizer, y en el texto en varios idiomas en comparación con el tiktoken  evaluar su ratio de compresión

##  problemas

El tokenizer BPE que has escrito en la Lección 01 puede procesar el texto en inglés. Ahora puedes lanzar el texto en él. O emoji.

Se romperá.

No es porque BPE  erró, sino porque se realiza incompleto. Producción de nivel de tokenizer debe tratar los bytes crudos de codificación arbitraria, en la separación antes de normalizar Unicode, administrar los tokens especiales que nunca serán fusionados, poner pre-tokenization y subword splitting 串起, y todo esto todo lo suficiente rápido, no puede retrasar procesar 15 billones de tokens de la línea de entrenamiento.

El tokenizer de GPT-2 tiene 50,257 tokens. Llama 3 tiene 128,256 个. GPT-4 aproximadamente tiene 100,000 个. Estos no son números de juguete. Estos vocabularios detrás de las tablas de fusión están entrenados en 100 GB de texto, mientras que el mecanismo externo, es decir, la normalización, pre-tokenización, inyección de tokens especiales, formato de plantilla de chat, es simplemente el tokenizer de "Hello World" y puede procesar todo el tokenizer de Internet.

Lo que vas a construir es este mecanismo.

## 概念

### 完整 Pipeline

El tokenizer de producción no es un algoritmo. Está formado por cinco fases, cada una de las cuales resuelve diferentes problemas.

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

Cada etapa tiene una función específica:

| Stage | What It Does | Why It Matters |
|-------|-------------|----------------|
| Normalize | NFKC Unicode，可选 lowercase，可选 strip accents | “fi” ligature (U+FB01) 会变成 “fi”（两个字符）。没有它，同一个词会得到不同 tokens。 |
| Pre-Tokenize | 在 BPE 之前把文本拆成 chunks | 防止 BPE 跨 word boundaries merge。“the cat”绝不应该产生 token “e c”。 |
| BPE Merge | 对 byte sequences 应用学到的 merge rules | 核心压缩步骤。把 raw bytes 转成 subword tokens。 |
| Special Tokens | 注入 [BOS]、[EOS]、[PAD]、chat template markers | 这些 tokens 有固定 ID。它们从不参与 BPE merges。模型需要它们来表示结构。 |
| ID Mapping | 把 token strings 转换为 integer IDs | 模型看到的是整数，不是字符串。 |

### BPE de nivel byte

Lección 01 de los tokenizadores 作用在 UTF-8 bytes 上──这是正确选择──但我们跳过一个重要问题: ¿qué ocurrirá cuando estos bytes no sean válidos en UTF-8?

BPE de nivel byte 通过把每一个可能的字节值 ((0-255) 都视为有效代币来解决这个问题―― tu vocabulario básico está bien tiene 256 项―― cualquier archivo, ya sea texto、二进制还是损坏内容, puede ser tokenized en caso de no producir un token desconocido―

GPT-2  añade un truco: poner cada byte 映射到一个打印的 Unicode 字符, así el vocabulario 保持人读的──Byte 0x20 空间) se convierte en un字符 G──.

La verdadera capacidad está en:BPE de nivel de byte 能处理地球上的每一种语言──中文字符每个是3 个 UTF-8字节──日文可以是3-4个字节──阿拉伯文、德瓦纳gari、emoji,全都是字节序列──BPE 算法在这些字节序列中寻找模式,方式和它在英语 ASCII字节中寻找模式完全相同──

### Pre-tokenization

Antes de procesar el texto en BPE, primero debes deshacerlo en pedazos. Esto puede evitar que el algoritmo fusione y cree tokens que crucen los límites de palabras.

GPT-2 utiliza un patrón de regex para desmantelar el texto:

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

Este patrón se mantendrá en contracciones, así que el gato se convertirá en el gato, en lugar de ser el gato.

Llama utiliza SentencePiece, que completamente saltó regex. Se coloca en el torrente de byte crudo como una larga secuencia, deja que BPE álgorofigura se encuentre a sí mismo en la frontera. Esto es más simple, pero también le dio a BPE más libertad para crear tokens de palabras cruzadas.

Esta opción es importante. El regex de GPT-2 bloqueará al tokenizer aprender a un término final de the 和下一个词开头的 the 应该合并.

### Tokens especiales

Cada tokenizer de producción de nivel de la ciudad se organizará para marcar la estructura y conservar los ID de los tokens:

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

Los tokens especiales nunca serán separados por BPE. Los tokens se combinarán con el algoritmo y serán identificados con el código fijo.

### Template de chat

Es donde la mayoría de la gente se encuentra en la confusión, y es el lugar más fácil de lograr.

Cuando tú a chat modelo 发送消息时,API 接收一个消息列表:

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

Una vez que se escribe la plantilla, el modelo se produce basura. Se trata de un formato preciso de entrenamiento. Cualquier desviación, por ejemplo, falta de cambios de línea, tokens, cambios, más de un espacio libre, se coloca en la distribución de entrenamiento.

### Velocidad

Python para la tokenización de producción de nivel para decir demasiado lento.

Tiktoken (OpenAI) es un sistema de conexiones de Python. También es un sistema de conexiones de Rust.

作为参考: si la velocidad de 1 millón de tokens por segundo de Python es Llama 3 pre-entrenamiento para tokenizar 15 billones de tokens, se necesitan 174 天──以 100 millones de tokens por segundo de Rust, sólo se necesitan 1.7 天──

Usted utiliza Python para construir, es para entender el algoritmo. En el entorno de producción, usted utiliza la composición para realizar, sólo se pone en contacto con el envoltorio de Python.


```figure
weight-tying
```

## Construirlo

### Paso 1: codificación de nivel de byte

基础──把任意字符串转换为字节序列,把每个字节 映射为用于显示可打印字符,并反向恢复──

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

En muchos idiomas, el número de bytes es:

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

hello es 5 bytes──你好 es 6 bytes── cada uno de los 3 个字符──火焰 emoji es 4 bytes──byte-level tokenizer 不关乎它是什么语言──Bytes 就是 bytes──

### Paso 2: Pre-tokenizer con Regex

Utiliza el patrón de regex GPT-2 Colocar el texto en pedazos. Cada pedazo está separado por BPE.

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

`regex`módulo 支持 Unicode propiedad escapa(`\p{L}`Muestra las letras,`\p{N}`Indicar los números) ・ biblioteca estándar `re`Modulo no soporta, por lo que regresamos a las clases de caracteres ASCII. Para el tokenizer de producción de varios idiomas, por favor instale.`regex`¿Qué es eso?

¿Qué es eso?

```python
print(pre_tokenize("Hello, world! Don't stop."))
# [' Hello', ',', ' world', '!', " Don", "'t", ' stop', '.']
```

Antes de la apertura de la palabra, las contracciones se hacen un pedazo de la misma.

### Paso 3: BPE en secuencias de byte

Lección 01 Enfrentamiento de algoritmos centrales, pero ahora en trozos pre-tokenizados 上独立运行.

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

### Paso 4: Manejo de tokens especiales

Los tokens especiales necesitan una coincidencia precisa y un identificador fijo.

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

### Paso 5: Clasificación completa de tokenizaje

Colocar todas las partes en un conjunto: normalizar, por tokens especiales, desglosar, pre-tokenizar, fusionar BPE, mapear a IDs.

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

### Paso 6: Prueba multilingüe

¡En inglés, chino, emoji y código todo lanzado a ella!

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

En el texto se producen 3 bytes. En el emoji se producen 4 bytes.

## Usalo

### Comparar los Tokenizers reales

Cargar los tokenizadores reales de Llama 3、GPT-4 和 Mistral. Observar cómo los tratan con el mismo.

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

Verás el mismo pasaje en el texto con diferentes números de tokens. El vocabulario de Lama 3 es de 128K, a la vez que el modo de fusionar es más intensivo.

tradeoff 总是一样的: mayor vocabulario significa secuencia más corta, pero también significa más parámetros。

##  entregarlo

Este curso ha dado lugar a un proyecto para construir y modificar los tokenizadores de producción.`outputs/prompt-tokenizer-builder.md`¿Qué es eso?

##  ejercicios

1. **Easy:**Añade uno.`get_token_bytes(id)`método, para mostrar los bytes crudos de cualquier token ID. Usalo para revisar los tokens combinados más comunes.
2. **Medium:**实现 Llama-style pre-tokenizer: según espacios blancos 和 dígitos 拆分, pero conservar espacios principales──在同一个 corpus 上,将其词汇与GPT-2 regex approximation对比──
3. **Hard:**添加一个聊天模板方法,接收 `{"role": ..., "content": ...}`Se trata de un programa de chat de formato Llama 3 que se desarrolla en el formato de un mensaje.

## Términos clave

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

## Leer más

- [OpenAI tiktoken source](https://github.com/openai/tiktoken)-- GPT-3.5/4 Uso de la implementación de Rust BPE
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers)-- 支持 BPE、WordPiece、Unigram de la biblioteca de tokenización de la Rust
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783)-- 128K vocabulario y el entrenamiento de tokenizer
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226)-- Tokenización lingüística-agnóstica
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py)-- original byte-a-Unicode de mapeo
