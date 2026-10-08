# Tokenización de palabras subsiguientes  BPE, WordPiece, Unigram, SentencePiece

> El Tokenizer de Palabras se encuentra en un estado de equilibrio entre las dos. Cada M.L.M. moderno tiene un tipo de equilibrio.

**类型：**El aprendizaje
**语言：**Python
**先修：**Fase 5 · 01(Procesamiento de texto),Fase 5 · 04(GloVe / FastText / Subword)
**时间：** 60 minutos

##  problemas

Tu vocabulario tiene 50.000 palabras.`[UNK]` Modelo ahora no hay ningún señal para esta palabra. O peor aún: el archivo de tu corpus en el 90 por ciento tiene 40 palabras raras, lo que significa que cada archivo perderá 40 bits de información.

La palabra Tokenization  resolver este problema. La palabra común se divide en un solo token.`untokenizable`¿ Qué es esto ?`un`¿ Qué ?`token`¿ Qué ?`izable` Entrenamiento de datos puede cubrir todo, ya que cualquier caracteres son finalmente un conjunto de bytes 

Cada LLM fronterizo de 2026 años utiliza tres tipos de algoritmos (BPE, Unigram, WordPiece), y se compone de tres tipos de ejemplos (tiktoken, sentencia, HF Tokenizers).

## 概念

![BPE vs Unigram vs WordPiece, character-by-character](../assets/subword-tokenization.svg)

**BPE (Byte-Pair Encoding)。**Desde el vocabulario de nivel de caracteres 开始──统计每个相邻对──把最频繁的对 合并成一个新代币──重复直到达到目标词汇库尺寸──主流算法:GPT-2/3/4、Llama、Gemma、Qwen2、Mistral──

**Byte-level BPE。**Al igual algoritmo, pero basado en bytes originales, en lugar de Unicode 字符──保证零`[UNK]`Token, es decir cualquier byte 序列都可编码──GPT-2 使用 50,257 个 Token(256 bytes + 50,000 merges + 1 special)──

**Unigram。**Desde un enorme vocabulario 开始──为每一个代币 分配单格式概率──代剪除那些移除后最小增加体日记概率的代币──推理时是概率性的:可以对代币化采采样(通过子词规律化做数据增强时很有用)──T5、mBART、ALBERT、XLNet、Gemma 使用它──

**WordPiece。**合并那些最大化训练 corpus probabilidad par, en lugar de basarse en la frecuencia original.

**SentencePiece vs tiktoken。**SentencePiece es directamente en el original Unicode 文本上训练词汇 (BPE o Unigram) de la biblioteca,并把空白编码为`▁`tiktoken es un codificador rápido de vocabulario de OpenAI; no se entrena.

经验法则:

- **训练新的 vocabulary：**SentenciaPiece ((多语言,无需预代币化) o HF Tokenizers。
- **面向 GPT vocabulary 的快速推理：**Tiktoken: [cl100k_base ≈o200k_base]
- **两者都要：**HF Tokenizers, una库完成训练 + servicio


```figure
bpe-merge
```

## Construirlo

### Paso 1: Desde cero la realización de BPE

¿ Qué ?`code/main.py`❖ En el siguiente ciclo:

```python
def train_bpe(corpus, num_merges):
    vocab = {tuple(word) + ("</w>",): count for word, count in corpus.items()}
    merges = []
    for _ in range(num_merges):
        pairs = Counter()
        for symbols, freq in vocab.items():
            for a, b in zip(symbols, symbols[1:]):
                pairs[(a, b)] += freq
        if not pairs:
            break
        best = pairs.most_common(1)[0][0]
        merges.append(best)
        vocab = apply_merge(vocab, best)
    return merges
```

Este algoritmo codifica tres hechos.`</w>`标记词尾, por lo tanto "bajo" (后) y "bajo" (前) permanecerán en la lista de fusiones.

### Paso 2: Utilizando las fusiones para codificar

```python
def encode_bpe(word, merges):
    symbols = list(word) + ["</w>"]
    for a, b in merges:
        i = 0
        while i < len(symbols) - 1:
            if symbols[i] == a and symbols[i + 1] == b:
                symbols = symbols[:i] + [a + b] + symbols[i + 2:]
            else:
                i += 1
    return symbols
```

Simple realiza es O                                                                                                                                                                                                                                                             

### 步骤 3: 实践中的 SentencePiece

```python
import sentencepiece as spm

spm.SentencePieceTrainer.train(
    input="corpus.txt",
    model_prefix="my_tokenizer",
    vocab_size=8000,
    model_type="bpe",          # or "unigram"
    character_coverage=0.9995, # lower for CJK (e.g. 0.9995 for English, 0.995 for Japanese)
    normalization_rule_name="nmt_nfkc",
)

sp = spm.SentencePieceProcessor(model_file="my_tokenizer.model")
print(sp.encode("untokenizable", out_type=str))
# ['▁un', 'token', 'izable']
```

Nota: no necesita pre-tokenization,空格编码为 `▁`¿ Qué ?`character_coverage`Control raro caracteres se conservan o se proyectan hasta`<unk>`De la intensidad de la actividad.

### Paso 4: Utiliza el símbolo de la palabra compatible con OpenAI

```python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
print(enc.encode("untokenizable"))        # [127340, 101028]
print(len(enc.encode("Hello, world!")))   # 4
```

仅编码──速度快(Rust backend)──在字节 计数、成本估算、文本窗口 预算方面,与GPT-4/5 Tokenization 精确匹配──

## 2026 año todavía se publicará en línea de crater

- **Tokenizer drift。**En la vocabulario A, pero con la vocabulario B 部署;; ID de tokens diferentes; modelo de entrada y encuentro en basura;; en el CI`tokenizer.json`Hayas
- **Whitespace ambiguity。**En BPE "hola" y "hola" 会产生不同 Token──始终显式指定 `add_special_tokens`Y `add_prefix_space`¿Qué es eso?
- **Multilingual undertraining。**El vocabulario de corpora inglesas pesadas se produce en una letra no latina. Se corta entre 5 y 10 veces el nombre de Token.
- **Emoji splits。**单个emoji 可能占 5 个代币──在做文text 预算时检查检查点 的emoji 处理──

## Usalo

Tecnología de 2026:

| 情况 | 选择 |
|-----------|------|
| 从零训练 monolingual model | HF Tokenizers (BPE) |
| 训练 multilingual model | SentencePiece (Unigram, `character_coverage=0.9995`) |
| Serving 一个 OpenAI-compatible API | tiktoken (`o200k_base` for GPT-4+) |
| Domain-specific vocab（code、math、protein） | 在 domain corpus 上训练 custom BPE，并与 base vocab 合并 |
| Edge inference，小模型 | Unigram（较小的 vocabulary 效果更好） |

El tamaño del vocabulario es una escalada  decisión, no es un número habitual 粗略启发式:<1B parámetros Us 32k,1-10B Us 50-100k,多语言/frontier Us 200k+。

##  Publicarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-bpe-vs-wordpiece.md`¿Qué es esto ?

```markdown
---
name: tokenizer-picker
description: Pick tokenizer algorithm, vocab size, library for a given corpus and deployment target.
version: 1.0.0
phase: 5
lesson: 19
tags: [nlp, tokenization]
---

Given a corpus (size, languages, domain) and deployment target (training from scratch / fine-tuning / API-compatible inference), output:

1. Algorithm. BPE, Unigram, or WordPiece. One-sentence reason.
2. Library. SentencePiece, HF Tokenizers, or tiktoken. Reason.
3. Vocab size. Rounded to nearest 1k. Reason tied to model size and language coverage.
4. Coverage settings. `character_coverage`, `byte_fallback`, special-token list.
5. Validation plan. Average tokens-per-word on held-out set, OOV rate, compression ratio, round-trip decode equality.

Refuse to train a character-coverage <0.995 tokenizer on corpora with rare-script content. Refuse to ship a vocab without a frozen `tokenizer.json` hash check in CI. Flag any monolingual tokenizer under 16k vocab as likely under-spec.
```

##  ejercicios

1. **简单。**En el`code/main.py`¿Cuánto está bien producir 1 Token, y cuánto produce > 1 Token?
2. **中等。**En 100 frases de Wikipedia en inglés 上比较 `cl100k_base`¿Qué es esto?`o200k_base`Y uno que usted utiliza vocab=32k  entrenamiento de SentencePiece BPE Token Number ⋅ reportar la relación de compresión de cada método ⋅
3. **困难。**Usar BPE、Unigram 和 WordPiece en el mismo cuerpo en el entrenamiento. ¿Los usa separadamente para un clasificador de sentimientos pequeño, y mide la precisión en el aguas abajo? ¿Esta opción hará que F1  cambie más de 1 punto?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| BPE | Byte-Pair Encoding | 贪心合并最频繁的 character pairs，直到达到目标 vocab size。 |
| Byte-level BPE | 永远没有 unknown tokens | 基于原始 256 bytes 的 BPE；GPT-2 / Llama 使用它。 |
| Unigram | 概率式 Tokenizer | 使用 log-likelihood 从大型候选集中剪枝；T5、Gemma 使用它。 |
| SentencePiece | 处理 whitespace 的那个 | 在原始文本上训练 BPE/Unigram 的库；空格编码为 `▁`。 |
| tiktoken | 速度快的那个 | OpenAI 的 Rust-backed BPE encoder，用于预构建 vocab。不训练。 |
| Merge list | 那些魔法数字 | 有序的 `(a, b) → ab` merges 列表；推理时按顺序应用。 |
| Character coverage | 多罕见才算太罕见？ | Tokenizer 必须覆盖的训练 corpus 中字符比例；典型值约为 0.9995。 |

## 延伸阅读

- [Sennrich, Haddow, Birch (2015). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) BPE 论文。
- [Kudo (2018). Subword Regularization with Unigram Language Model](https://arxiv.org/abs/1804.10959) Unigram 论文。
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226)¿Qué es esto?
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary) 简明参考。
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken) libro de cocina + lista de codificación。
