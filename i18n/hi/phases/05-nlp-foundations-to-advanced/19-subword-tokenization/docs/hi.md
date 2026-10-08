# उपशब्द टोकनाइज़ेशन  BPE, WordPiece, Unigram, SentencePiece

> वर्ड टोकनाइज़र 会在未见的词上卡住── चरित्र टोकनाइज़र 会让序列长度暴── उपशब्द टोकनाइज़र में दोनों के बीच संतुलन प्राप्त करना── प्रत्येक आधुनिक LLM में एक साथ एक प्रकार का होना──

**类型：**学习
**语言：**पायथन
**先修：**चरण 5 · 01(पाठ प्रसंस्करण),चरण 5 · 04(ग्लोव / फास्टटेक्स / उपशब्द)
**时间：**≈ 60 मिनट

## 问题

आपके शब्दकोश में 50,000 शब्द हैं। उपयोगकर्ता "असंज्ञनीय" में प्रवेश करता है। आपका टोकनराइज़र वापस आ जाता है।`[UNK]`◊ मॉडल अब इस शब्द के लिए कोई संकेत नहीं है. इससे भी बदतर यह है कि आपके कॉर्पस के 90वें प्रतिशत के दस्तावेज़ में 40 दुर्लभ शब्द हैं, जिसका अर्थ है कि प्रत्येक दस्तावेज़ में 40 बिट्स 信息 ◊ खो जाएगा।

उपशब्द टोकनकरण  हल किया यह समस्या──常见词保持为单个 टोकन──罕见词会分解成有意义的片段:`untokenizable`→ `un`,`token`,`izable` प्रशिक्षण डेटा सब कुछ कवर कर सकते हैं, क्योंकि किसी भी वर्ण अंततः एक बाइट्स 序列 है

2026 के प्रत्येक सीमा LLM में तीन प्रकार के एल्गोरिदम का उपयोग किया जाएगा।

## 概念

![BPE vs Unigram vs WordPiece, character-by-character](../assets/subword-tokenization.svg)

**BPE (Byte-Pair Encoding)。**वर्ण-स्तर की शब्दावली से 开始──统计每个相邻对──把最频繁的对 合并成一个新代币──重复直到达到目标词汇库尺寸──主流算法:GPT-2/3/4、Llama、Gemma、Qwen2、Mistral──

**Byte-level BPE。**उसी तरह के एल्गोरिथ्म, लेकिन मूल बाइट्स पर आधारित है, और यूनिकोड 字符 नहीं है।`[UNK]`टोकन, यानी कोई भी बाइट्स 序列都可编码──GPT-2 使用 50,257 个 टोकन(256 बाइट्स + 50,000 विलय + 1 विशेष)──

**Unigram。**एक विशाल शब्दावली से 开始── प्रत्येक टोकन के लिए 分配 unigram संभावना──代剪除那些移除后最小增加体日志-सम्भावना के टोकन──推理时是概率性的:可以对 टोकनाइजेशन采采采用(通过子词规范化做数据增强时很有用)──T5、mBART、ALBERT、XLNet、Gemma 使用它──

**WordPiece。**合并那些最大化训练 corpus संभावना के जोड़े, बजाय मूल आवृत्ति पर आधारित है.

**SentencePiece vs tiktoken。**SentencePiece is directly in original Unicode 文本上训练词汇(BPE या Unigram) का भंडार,并把空白编码为`▁`✿ टिक टोकन ✿ ओपनएआई ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿

经验法则:

- **训练新的 vocabulary：**वाक्यपीस ((多语言,无需预标标) या एचएफ टोकनाइजर्स。
- **面向 GPT vocabulary 的快速推理：**tiktoken(cl100k_base、o200k_base) 👇
- **两者都要：**एचएफ टोकन, एक库完成训练 + सेवा


```figure
bpe-merge
```

##  इसे निर्माण

### 步骤 1: शून्य से BPE को प्राप्त करना

见 `code/main.py` चक्र निम्नानुसार हैः

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

यह एल्गोरिथ्म तीन तथ्यों को कोड करता है।`</w>`标记词尾, इसलिए "low" ( निम्न) और "lower" ( निम्न) ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न) )  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न) )  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न) )  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न) )  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न) )  ( निम्न)  ( निम्न)  ( निम्न)  ( निम्न) )  ( निम्न)  ( निम्न) )  ( निम्न)  ( निम्न)  ( निम्न) )  ( निम्न)  ( निम्न)  ( निम्न) )  ( निम्न)  ( निम्न) )  ( निम्न)  ()  ()  ()  () )  ()  () ) ()  () ) () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () (

### 步骤 2: उपयोग करने के लिए सीखना  संकेतन

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

सरल实现是O                                                                                                                                                                                                                                                             

### 步骤 3: 实践中的 वाक्य

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

ध्यानः पूर्व-टोकेनाइज़ेशन की आवश्यकता नहीं है,空格编码为 `▁`,`character_coverage`控制罕见字符被保留或映射到 `<unk>`उत्तेजना की डिग्री

### 步骤 4: OpenAI संगत शब्दावली के साथ टिक टोकन का उपयोग करें

```python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
print(enc.encode("untokenizable"))        # [127340, 101028]
print(len(enc.encode("Hello, world!")))   # 4
```

仅编码──速度快(रस्ट बैकेंड)──在字节 计数、成本估算、文本窗口 预算方面,与GPT-4/5 टोकनाइजेशन 精确匹配──

## 2026 में भी जारी होगा

- **Tokenizer drift。**वक्श में ए 上 प्रशिक्षण, पर वक्श में बी 部署;; टोकन आईडी अलग; मॉडल输遇变成垃圾;;`tokenizer.json`हाश
- **Whitespace ambiguity。**BPE में "hello" और "hello" 会产生不同 टोकन──始终显式指定 `add_special_tokens`和 `add_prefix_space`
- **Multilingual undertraining。**अंग्रेजी-भारी कॉर्पोस का शब्दकोश उत्पन्न होगा। यह एक गैर-लैटिन लिपि का 5-10 गुना अधिक टोकन होगा।
- **Emoji splits。**单个emoji可能占占 5 个代币──在做文text 预算时检查检查点 的emoji 处理──

## इसका उपयोग करें

2026 साल की तकनीक:

| 情况 | 选择 |
|-----------|------|
| 从零训练 monolingual model | HF Tokenizers (BPE) |
| 训练 multilingual model | SentencePiece (Unigram, `character_coverage=0.9995`) |
| Serving 一个 OpenAI-compatible API | tiktoken (`o200k_base` for GPT-4+) |
| Domain-specific vocab（code、math、protein） | 在 domain corpus 上训练 custom BPE，并与 base vocab 合并 |
| Edge inference，小模型 | Unigram（较小的 vocabulary 效果更好） |

शब्दावली आकार एक स्केलिंग 决策, नहीं एक सामान्य संख्या है।

##  इसे जारी करें

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

## अभ्यास

1. **简单。**`code/main.py`                                                                                                                                                                                                                                                              
2. **中等。**में 100 个 अंग्रेज़ी विकिपीडिया वाक्य 上比较 `cl100k_base``o200k_base`和一个你用语音=32k 训练的句子Piece BPE 的符号数――报告每种方法的压缩比――
3. **困难。**BPE、Unigram 和 WordPiece को एक ही शरीर में ऊपर प्रशिक्षण में उपयोग करें। इन्हें एक छोटे से भावना वर्गीकरणकर्ता में अलग-अलग उपयोग करें, और डाउनस्ट्रीम सटीकता को मापें।

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
- [Kudo (2018). Subword Regularization with Unigram Language Model](https://arxiv.org/abs/1804.10959) यूनिग्राम 论文──
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226) इस कक्ष 
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary) 简明参考。
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken) कुकबुक + कोडिंग सूची。
