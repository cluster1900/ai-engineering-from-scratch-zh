# Tokenization de sous-parts  BPE, WordPiece, Unigramme, SentencePiece

> Le Tokenizer de mots se trouve dans les mots inconnus. Le Tokenizer de caractères se trouve dans les deux.

**类型：**Apprendre à apprendre
**语言：**Python
**先修：**La phase 5 · 01(Précédation de texte), la phase 5 · 04(GloVe / FastText / Subword)
**时间：**À environ 60 minutes.

##  problématique

Votre vocabulaire a 50 000 mots. Vous avez mis "non-tokenizable" dans votre Tokenizer.`[UNK]`◊ Modèle maintenant aucun signal à ce mot. Pierre encore: dans votre corpus 90% de la liste des documents ont 40 mots rares, ce qui signifie que chaque document perdrait 40 bits de l'information.

Le sous-mot Tokenization  résolu cette question。 habituel word keep for single Token。 rares mots se décomposent en fragments significatifs:`untokenizable`- Je suis là.`un`- Je suis là .`token`- Je suis là .`izable` Les données de formation peuvent tout couvrir, car tout caractère est finalement un ensemble de octets ⋅

Chaque LLM frontalier de 2026 utilise trois algorithmes (BPE, Unigram, WordPiece), et est constitué de trois types de tokens (SentencePiece, HF Tokenizers).

## 概念

![BPE vs Unigram vs WordPiece, character-by-character](../assets/subword-tokenization.svg)

**BPE (Byte-Pair Encoding)。**De la classe de caractères de vocabulaire 开始──统计每个相邻对──把最频繁的对 合并成一个新代币──重复直到达到目标词汇规模──主流算法:GPT-2/3/4、Llama、Gemma、Qwen2、Mistral──

**Byte-level BPE。**Le même algorithme, mais basé sur des octets originaux, et non pas un code Unicode.`[UNK]`Token,即任何字节 序列都可编码──GPT-2 使用 50,257 个 Token(256 octets + 50,000 fusions + 1 spécialité)──

**Unigram。**Pour chaque symbole, la probabilité de décomposition des unigrame est décrite. Pour chaque symbole, la probabilité de décomposition des unigrame est décrite.

**WordPiece。**合并那些最大化训练 corpus probabilité de paire, plutôt que basé sur la fréquence initiale.

**SentencePiece vs tiktoken。**SentencePiece est directement dans le vocabulaire original Unicode 文本上训练词汇 (BPE ou Unigram) de la bibliothèque,并把空白编码为`▁` tiktoken est un encodeur rapide du vocabulaire OpenAI; il ne s'entraîne pas

经验法则:

- **训练新的 vocabulary：**La première partie de la série est la série de films de cinéma de l'époque.
- **面向 GPT vocabulary 的快速推理：**Il est également possible de faire des tests de détection de la quantité de données.
- **两者都要：**HF Tokenizers, une équipe de formation et de service.


```figure
bpe-merge
```

## - Je le construis.

### étape 1: réalisation de la BPE à zéro

Je vous en prie .`code/main.py`: cycle suivant:

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

Cet algorithme est en trois faits.`</w>`标记词尾, donc "basse" (后) et "basse" (前) (前) (前) (前) (前) (前) (前) (前) (前) 标记词尾, 后) (后) (后) (后) (后) (后) (后) (后) (后) (后) (后) (前) (前) (前) (前) (前) 后) (后) (后) (后) (后) 后) (后) (后) (后) (后) (后) 后) (后) (后) (后) 后) (后) (后) 后) (前) (前) (前) (前) 后) (前) 后) 后) 后) 后 (前) 后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后

### 步骤 2: Uzal学到的合并  faire le codage

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

Simple réalisation est O                                                                                                                                                                                                                                                             

### 步骤 3: 实践中的 phrasePiece

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

Attention: pas besoin de pré-tokenization,空格编码为 `▁`- Je suis désolé .`character_coverage`控制罕见字符被保留或映射到 `<unk>`Le degré de progression.

### Étape 4: Utilisez le mot de passe compatible avec OpenAI

```python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
print(enc.encode("untokenizable"))        # [127340, 101028]
print(len(enc.encode("Hello, world!")))   # 4
```

仅编码──速度快(Rust backend)──在字节 计数、成本估算、文本窗口 预算方面,与GPT-4/5 Tokenization 精确匹配──

## 2026 année encore publié sur la ligne de cratère

- **Tokenizer drift。**Dans le vocabulaire A, il est utilisé dans le vocabulaire B.`tokenizer.json`Hachêt
- **Whitespace ambiguity。**Dans le BPE, "hello" et "hello" seront différents Token──始终显式指定 `add_special_tokens`et `add_prefix_space`Il y a une autre.
- **Multilingual undertraining。**Le vocabulaire des corps anglais-pauvres est en train de se développer.
- **Emoji splits。**单个emoji 可能占 5 个代币──在做文text 预算时检查检查点 的emoji 处理──

## Utilisez-le

2026:

| 情况 | 选择 |
|-----------|------|
| 从零训练 monolingual model | HF Tokenizers (BPE) |
| 训练 multilingual model | SentencePiece (Unigram, `character_coverage=0.9995`) |
| Serving 一个 OpenAI-compatible API | tiktoken (`o200k_base` for GPT-4+) |
| Domain-specific vocab（code、math、protein） | 在 domain corpus 上训练 custom BPE，并与 base vocab 合并 |
| Edge inference，小模型 | Unigram（较小的 vocabulary 效果更好） |

La taille du vocabulaire est une taille de décision, pas un nombre habituel.

##  La publier

保存为 `outputs/skill-bpe-vs-wordpiece.md`- Le numéro de la liste:

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

1. **简单。**Dans le`code/main.py`Un petit corps de formation à 500 BPE. Encode trois mots retenus.
2. **中等。**Dans 100 phrases de Wikipédia en anglais`cl100k_base`- Je suis là.`o200k_base`Et un vous utilisez le vocabulaire = 32k  entraînement de la phrasePiece BPE de jetons Numéro. Rapporte le rapport de compression de chaque méthode.
3. **困难。**Utilisez BPE、Unigram 和 WordPiece dans le même corpus en train de les utiliser séparément dans un classifiateur de sentiments de petite taille, et mesurez l'exactitude en aval.

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

- [Sennrich, Haddow, Birch (2015). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) BPE 论文。
- [Kudo (2018). Subword Regularization with Unigram Language Model](https://arxiv.org/abs/1804.10959) Unigram 论文。
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226)Cette boîte.
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary) 简明参考。
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken) livre de cuisine + liste de codage。
