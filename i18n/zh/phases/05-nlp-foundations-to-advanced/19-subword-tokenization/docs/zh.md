# 字母标记 BPE,WordPiece,单字体,句子Piece

> 字符标记器 会在未见的词上卡住―― 字符标记器 会让序列长度暴── 字符标记器 在两者之间取得平衡―― 每个现代的LLM都附着一种――

**类型：**学习 课程
**语言：**字符串
**先修：**五阶段 · 01(文本处理),五阶段 · 04(全球 /快文 /字幕)
**时间：**约60分钟

## 问题

你的词汇有5万个词,用户输入"不可代码"你的代码器返回`[UNK]`模型现在对这个词没有任何信号.更糟糕的是:你的90百分比文档中有40个罕见的词,这意味着每个文档都会丢掉40个信息.

标签化 解决了这个问题――常见词保持为单个标签――罕见词会分解成有意义的片段:`untokenizable`其他`un`现在`token`现在`izable`△训练数据可以覆盖一切,因为任何字符串最终都是一个字节序列.

2026年每一个边境LLM都使用三种算法之一 (BPE、单字符串、WordPiece),并由三种库之一封装 (tiktoken、SentencePiece、HF Tokenizers) 设置.

## 概念

![BPE vs Unigram vs WordPiece, character-by-character](../assets/subword-tokenization.svg)

**BPE (Byte-Pair Encoding)。**从字符级词汇 开始――统计每个相邻对――把最频繁的对合并成一个新标志――重复直到达到目标词汇尺寸――主要算法:GPT-2/3/4、Llama、Gemma、Qwen2、Mistral──

**Byte-level BPE。**同样的算法,但基于原始字节,而不是 Unicode 字符.`[UNK]`标记,即任何字节 序列都可编码――GPT-2 使用 50,257 个标记(256字节 + 50,000 个合并 + 1个特殊)

**Unigram。**从一个巨大的词汇库开始.为每个代码分分别单格式概率. 代码剪除后最小增加的代码日志概率. 推理时是概率性的:可以对代码化采样进行调整.

**WordPiece。**合并那些最大化训练体概率的对,而不是基于原始频率.

**SentencePiece vs tiktoken。**文文Piece 是直接在原始的 Unicode 文本上训练词汇库的,并把空白编码为`▁`△tiktoken 是OpenAI预构建词汇的快速编码器;它不训练──

经验法则:

- **训练新的 vocabulary：**语句Piece ((多语言,无需预先标记) 或HF标记者──
- **面向 GPT vocabulary 的快速推理：**果公司的公司
- **两者都要：**们,我们要做什么?


```figure
bpe-merge
```

## 构建它

### 步骤1:从零实现BPE

见`code/main.py`△循环如下:

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

这算法编码了三个事实.`</w>`标记词尾,因此"低" (后) 和"低" (前) 将保持区分──频率加权会让高频对更早胜出──合并列表是有序的,推理会按训练顺序应用合并──

### 步骤2: 用学到的合并 进行编码

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

简单实现是O                                                                                                                                                                                                                                                            

### 步骤3: 实践中的句子

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

注意:不需要预先代码化,空格编码为 `▁`没有任何`character_coverage`控制罕见字符被保留或映射到`<unk>`激进程度.

### 步骤4:使用OpenAI兼容的语音符号

```python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
print(enc.encode("untokenizable"))        # [127340, 101028]
print(len(enc.encode("Hello, world!")))   # 4
```

仅编码――速度快(结后端) ――在字节计数、成本估计、文本窗口预算方面,与GPT-4/5标记化 精确匹配──

## 2026年仍将发布上线坑

- **Tokenizer drift。**在语音A上训练,却使用语音B部署――代码身份证不同;模型输出遇到变成垃圾――在CI中检查`tokenizer.json`鱼
- **Whitespace ambiguity。**在BPE中"你好"和"你好"会产生不同的标志.`add_special_tokens`和 `add_prefix_space`,我知道.
- **Multilingual undertraining。**其他语言的语言是中文,但在中文和中文中,这些语言是中文.
- **Emoji splits。**单个情感符号可能占有5个代币. 在做文本中,预算时检查检查点的情感符号处理.

## 使用它

2026 年技术:

| 情况 | 选择 |
|-----------|------|
| 从零训练 monolingual model | HF Tokenizers (BPE) |
| 训练 multilingual model | SentencePiece (Unigram, `character_coverage=0.9995`) |
| Serving 一个 OpenAI-compatible API | tiktoken (`o200k_base` for GPT-4+) |
| Domain-specific vocab（code、math、protein） | 在 domain corpus 上训练 custom BPE，并与 base vocab 合并 |
| Edge inference，小模型 | Unigram（较小的 vocabulary 效果更好） |

词汇大小是一个扩展的决策,不是常数.

## 发布它

保存为`outputs/skill-bpe-vs-wordpiece.md`其他:

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

1. **简单。**在`code/main.py`编码三个长达的字符. 有多少正确产生 1 个代币,还有多少产生 > 1 个代币?
2. **中等。**在100个英语维基百科句子上比较`cl100k_base`,我知道.`o200k_base`和一个你用语音=32k 训练的句子BPE的符号数量.
3. **困难。**用BPE、Unigram 和 WordPiece 在同一体内上训练――把它们分别用于一个小型情感分类器,并测量下游精度――这个选择会让F1 变化超过1点吗?

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
- [Kudo (2018). Subword Regularization with Unigram Language Model](https://arxiv.org/abs/1804.10959) 论文
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226) 这个库.
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary)简明参考.
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken)厨房书 +编码列表――
