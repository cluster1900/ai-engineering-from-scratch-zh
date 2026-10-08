# Tokenization de subpalavras  BPE, WordPiece, Unigram, SentencePiece

> O Tokenizer de Palavras irá manter a sua sequência de palavras que não foram vistas.

**类型：**- aprendizagem
**语言：**Python
**先修：**Fase 5 · 01(Processamento de texto),Fase 5 · 04(GloVe / FastText / Subword)
**时间：**Cerca de 60 minutos

## 问题

Seu vocabulário tem 50.000 palavras. Usuário inserir "intokenizable"`[UNK]`O modelo agora não tem qualquer sinal para esta palavra. O pior é que o seu corpo tem 40 palavras raras, o que significa que cada documento perderá 40 bits de informação.

Subpalavra Tokenization  resolveu este problema。 habitualmente, palavras permanecem em tokens individuais。 raramente, palavras se dividem em fragmentos significativos:`untokenizable`→ `un`- Não .`token`- Não .`izable` O treinamento de dados pode cobrir tudo, porque qualquer string é um byte 序列.

Em 2026 todos os LLM de fronteira usam três tipos de algoritmos (BPE, Unigram, WordPiece), e em três tipos de tokens (SentencePiece, HF Tokenizers).

## 概念

![BPE vs Unigram vs WordPiece, character-by-character](../assets/subword-tokenization.svg)

**BPE (Byte-Pair Encoding)。**Desde o vocabulário de nível de caracteres 开始──统计每个相邻对──把最频繁的对 合并成一个新 Token──重复直到达到目标词汇规模──主要算法:GPT-2/3/4、Llama、Gemma、Qwen2、Mistral──

**Byte-level BPE。**Sim, mas baseado em bytes originais (256 个基础 Token), em vez de Unicode 字符──保证零 `[UNK]`Token,即任何字节 序列都可编码──GPT-2 使用 50,257 个 Token(256 bytes + 50,000 merges + 1 special)──

**Unigram。**De um enorme vocabulário 开始──为每个代币 分配单格式概率──代剪除那些移除后最小增加体日记概率的代币──推理时是概率性的:可以对代币化采采样(通过子词规律化做数据增强时很有用)──T5、mBART、ALBERT、XLNet、Gemma 使用它──

**WordPiece。**合并那些最大化训练 corpus probabilidade par, em vez de baseada na freqüência original.

**SentencePiece vs tiktoken。**SentencePiece é diretamente na biblioteca original de vocabulário de treinamento de Unicode (BPE ou Unigram)`▁` tiktoken é um codificador rápido do vocabulário de pré-construção da OpenAI; não é treinado.

经验法则:

- **训练新的 vocabulary：**SentencePiece ((多语言,无需预标标) 或 HF Tokenizers。
- **面向 GPT vocabulary 的快速推理：**Tiktoken(cl100k_base、o200k_base)
- **两者都要：**HF Tokenizers, uma库完成训练 + serve。


```figure
bpe-merge
```

## Construí-lo

### 步骤 1: Realização de BPE a partir de zero

- Não .`code/main.py`❖ Ciclo:

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

Este algoritmo codifica três fatos.`</w>`标记词尾, portanto "low" (em baixo) e "lower" (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em baixo) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em) (em)

### 步骤 2: Us learn to merge  fazer codificação

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

O que é o "merger" é um "merger" (ou "merger") que é um "merger" (ou "merger") que é um "merger" (ou "merger") que é um "merger" (ou "merger") ou "merger" (ou "merger").

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

Nota: Não precisa de pré-tokenization,空格编码为 `▁`- Não .`character_coverage`Control rarie caracteres são conservados ou mapeados até`<unk>`De um grau de progressão.

### 步骤 4: Utilize o tiktoken de vocabulário compatível com o OpenAI

```python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
print(enc.encode("untokenizable"))        # [127340, 101028]
print(len(enc.encode("Hello, world!")))   # 4
```

仅编码──速度快(Rust backend)──在字节 计数、成本估算、文本窗口 预算方面,与GPT-4/5 Tokenization 精确匹配──

## 2026 ano ainda será lançado em linha de cratera

- **Tokenizer drift。**Em vocabulário A 上訓練,却用词语 B 部署;;Token IDs 不同;模型输遇变成垃圾;;在CI 中检查`tokenizer.json`- Não.
- **Whitespace ambiguity。**BPE "Hello" e "Hello" 会产生不同 Token──始终显式指定 `add_special_tokens`和 `add_prefix_space`- Não.
- **Multilingual undertraining。**O vocabulário de corpora-pesadas em inglês é dividido em cinco a dez vezes por sinal.
- **Emoji splits。**单个emoji 可能占 5 个代币――在做文text 预算时检查检查点 的emoji 处理── em seu contexto 预算时检查检查点 的emoji 处理── em seu contexto 预算时检查检查点 的emoji 处理── em seu contexto 预算时检查点 的emoji 处理── em seu contexto 预算时检查点 的emoji 处理── em seu contexto 处理

## Use-o

Tecnologia de 2026:

| 情况 | 选择 |
|-----------|------|
| 从零训练 monolingual model | HF Tokenizers (BPE) |
| 训练 multilingual model | SentencePiece (Unigram, `character_coverage=0.9995`) |
| Serving 一个 OpenAI-compatible API | tiktoken (`o200k_base` for GPT-4+) |
| Domain-specific vocab（code、math、protein） | 在 domain corpus 上训练 custom BPE，并与 base vocab 合并 |
| Edge inference，小模型 | Unigram（较小的 vocabulary 效果更好） |

Tamanho do vocabulário é uma escalada  decisão, não é uma constante.

##  Publicá-lo

保存为 `outputs/skill-bpe-vs-wordpiece.md`- Não .

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

## 练习

1. **简单。**Em`code/main.py`De pequeno corpo 上训练一个500-merge BPE──Encode 三个长达的字符──有多少正确产生 1 代币,还有多少产生 >1 代币?
2. **中等。**Em 100 frases da Wikipédia em inglês 上比较 `cl100k_base`- Não.`o200k_base`和一个你用语音=32k 训练的句子Piece BPE Token 数――报告每种方法的压缩比――
3. **困难。**Use BPE、Unigram 和 WordPiece em um mesmo corpo para treinar. Use-os separadamente para um pequeno classificador de sentimentos, e mede a precisão do fluxo de baixo.

## 关键术语

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

- [Sennrich, Haddow, Birch (2015). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) BPE 论文──
- [Kudo (2018). Subword Regularization with Unigram Language Model](https://arxiv.org/abs/1804.10959) Unigram 论文──
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226)- Esta é a minha casa.
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary) 简明参考。
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken) livro de cozinha + lista de codificação。
