# رمزية الكلمات الفرعية  BPE، WordPiece، Unigram، SentencePiece

> كلمة Tokenizer 会在未见的词上卡住──Character Tokenizer 会让序列长度暴──Subword Tokenizer 在两者之间取得平衡──每现代 LLM 都附附一种──

**类型：**學习
**语言：**بايثون
**先修：**المرحلة 5 · 01(معالجة النص) ،المرحلة 5 · 04(GloVe / FastText / Subword)
**时间：**حوالي 60 دقيقة

## 问题

لديك 50 ألف كلمة. المستخدم يستخدم كلمة "غير قابلة للتكنولوجيا"`[UNK]` لا يوجد أي إشارة إلى هذه الكلمة الآن. أسوأ من ذلك: في المستند في 90٪ من جسمك هناك 40 كلمة نادرة، وهذا يعني أن كل ملف سوف تفقد 40 جزء من المعلومات.

كلمة فرعية Tokenization  حل هذه المشكلة.`untokenizable``un`،`token`،`izable` يمكن تغطية كل شيء لأن أي خط في النهاية هو سلسلة بايت

في عام 2026 كل برنامج LLM على الحدود يستخدم ثلاثة خوارزميات واحدة (BPE、Unigram、WordPiece) ، ويعمل من خلال ثلاثة مجموعات من تغطيات (Tiktoken、SentencePiece、HF Tokenizers) 

## 概念

![BPE vs Unigram vs WordPiece, character-by-character](../assets/subword-tokenization.svg)

**BPE (Byte-Pair Encoding)。**من المفردات على مستوى الشخصيات 开始──统计每个相邻对──把最频繁的对合并成一个新代币──重复直到达到目标词汇库大小──主流算法:GPT-2/3/4、Llama、Gemma、Qwen2、Mistral──

**Byte-level BPE。**نفس الحسابات، ولكن على أساس البايتات الأصلية ((256 个基础 Token) ، وليس يونيكود 字符──保证零 `[UNK]`رمز، أي بايت 序列都可编码──GPT-2 使用 50,257 个 رمز(256 بايت + 50,000 دمج + 1 خاصة)──

**Unigram。**من قاموس كبير 开始──为每个代币 分配单格式概率──代剪除那些移除后最小增加的体积日志概率的代币──推理时是概率性的:可以对 Tokenization 采样(通过子词规范化做数据增强时很有用)──T5、mBART、ALBERT、XLNet、Gemma 使用它──

**WordPiece。**合并那些最大化训练 corpus احتمالات زوج ، وليس على أساس التردد الأصلي.

**SentencePiece vs tiktoken。**جملةPiece هو مباشرة في المخططات المفردة الأصلية Unicode 文本上训练词汇(BPE أو Unigram)`▁`تيكتون هو إعداد سريع لمجموعة الكلمات المُقدمة من قبل OpenAI؛ فإنه لا يتدرب.

经验法则:

- **训练新的 vocabulary：**جملة (Piece) ((多语言,无需预标签) أو HF Tokenizers。
- **面向 GPT vocabulary 的快速推理：**tiktoken(cl100k_base、o200k_base)
- **两者都要：**"إتش إف توكينيزرز" ، "إحدك"


```figure
bpe-merge
```

## بناءها

### الخطوة الأولى: من الصفر لتحقيق BPE

见 `code/main.py` دورة:

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

هذا الخوارزمي يضم ثلاثة حقائق`</w>`标记词尾,因此 "أقل" (后) و "أقل" (前) سوف تبقى区分──频率加权会让高频对 更早胜出──合并列表是有序的,推理会按训练顺序应用合并──

### الخطوة الثانية: استخدام تعلم الاندماج

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

انتباه: لا تحتاج إلى التوكنات المسبقة،空格编码为 `▁`،`character_coverage`يتم حفظ أو رسم الخط`<unk>`درجة التطور

### الخطوة 4: باستخدام رمز التشغيل المتوافق مع OpenAI

```python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
print(enc.encode("untokenizable"))        # [127340, 101028]
print(len(enc.encode("Hello, world!")))   # 4
```

仅编码──速度快(Rust backend)──在字节 计数、成本估算、文本窗口 预算方面,与GPT-4/5 Tokenization 精确匹配──

## 2026 سيشارك في إصدار الموقع

- **Tokenizer drift。**في المفردات A 上 تدريب، ولكن باستخدام المفردات B 部署 ・ توكن هويات مختلفة؛ نموذج输遇变成垃圾──在CI 中检查 `tokenizer.json`. .
- **Whitespace ambiguity。**في BPE "مرحبا" و "مرحبا" 会产生 مختلف Token──始终显式指定 `add_special_tokens`和 `add_prefix_space`.
- **Multilingual undertraining。**الكلمات التي تُستخدم في الكتب الإنجليزية الثقيلة، ستُعد من الكتب غير اللاتينية إلى 5 إلى 10 أضعاف.
- **Emoji splits。**单个emoji可能占 5 个代币──在做文本 预算时检查检查点的emoji 处理──

## استخدمها

2026 سنة التقنية:

| 情况 | 选择 |
|-----------|------|
| 从零训练 monolingual model | HF Tokenizers (BPE) |
| 训练 multilingual model | SentencePiece (Unigram, `character_coverage=0.9995`) |
| Serving 一个 OpenAI-compatible API | tiktoken (`o200k_base` for GPT-4+) |
| Domain-specific vocab（code、math、protein） | 在 domain corpus 上训练 custom BPE，并与 base vocab 合并 |
| Edge inference，小模型 | Unigram（较小的 vocabulary 效果更好） |

حجم الكلمات هو مقياس  قرار، ليس عدد عادي 

## أصدرها

保存为 `outputs/skill-bpe-vs-wordpiece.md`:

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

## التدريب

1. **简单。**في`code/main.py`من الـ 500 بـ"بـ" مـنـزج.
2. **中等。**في 100 جمل في ويكيبيديا الإنجليزية 上比较 `cl100k_base`.`o200k_base`وحدة تحديد المعلومات و التطبيقات
3. **困难。**باستخدام BPE、Unigram 和 WordPiece في نفس الجسم على تدريبها.

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
- [Kudo (2018). Subword Regularization with Unigram Language Model](https://arxiv.org/abs/1804.10959) يونيغرام 论文。
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226)هذا المكتب
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary) 简明参考。
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken) كتاب الطهي + قائمة التشفير
