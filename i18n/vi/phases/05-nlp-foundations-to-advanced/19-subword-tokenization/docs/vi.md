# Đánh dấu từ phụ  BPE, WordPiece, Unigram, SentencePiece

> Word Tokenizer 会在未见的词上卡住── Character Tokenizer 会让序列长度暴──Subword Tokenizer 在两者之间取得平衡──每现代 LLM都附附一种──

**类型：**Học tập
**语言：**Python
**先修：**Giai đoạn 5 · 01(Sử lý văn bản),Giai đoạn 5 · 04(GloVe / FastText / Subword)
**时间：**约60分钟

## 问题

Từ vựng của bạn có 50.000 từ. Người dùng nhập vào "không thể nhận dạng".`[UNK]`◊ Mô hình hiện nay không có bất kỳ tín hiệu nào đối với từ này. Và tệ hơn nữa: tài liệu trong 90 phần trăm của cơ thể của bạn có 40 từ hiếm, có nghĩa là mỗi tài liệu sẽ bị mất đi 40 bit thông tin.

Thuật ngữ Tokenization  đã giải quyết vấn đề này. Từ thường được giữ cho một Token.`untokenizable`→ `un`- `token`- `izable`❖ Training data có thể bao gồm tất cả, vì bất kỳ chữ cái nào cuối cùng là một chuỗi byte ⋅

Mỗi năm 2026 LLM biên giới đều sử dụng ba thuật toán trong số đó: BPE, Unigram, WordPiece, và từ ba bộ sưu tập trong số đó:

## 概念

![BPE vs Unigram vs WordPiece, character-by-character](../assets/subword-tokenization.svg)

**BPE (Byte-Pair Encoding)。**Từ từ vựng cấp ký tự 开始──统计 mỗi cặp cạnh tranh──把最频繁的对 合并成一个新代币──重复直到达到目标词汇尺寸──主流算法:GPT-2/3/4、Llama、Gemma、Qwen2、Mistral──

**Byte-level BPE。**Tương tự như là các thuật toán, nhưng dựa trên các byte nguyên bản, thay vì Unicode 字符.`[UNK]`Địa chỉ,即任何字节 序列都可编码;; GPT-2 使用 50,257 个 Token;; 256字节 + 50,000 hợp nhất + 1 đặc biệt);;

**Unigram。**Từ một từ vựng khổng lồ  bắt đầu. Đối với mỗi token phân chia xác suất đơn sơ. 代 cắt những token ít nhất tăng xác suất đăng ký khoang sau khi di chuyển. 推理时是概率性的: có thể đối phó với Tokenization 采样.

**WordPiece。**合并那些最大化训练 corpus xác suất của cặp, chứ không phải dựa trên tần suất nguyên thủy.

**SentencePiece vs tiktoken。**SentencePiece là trực tiếp trong thư viện của nguyên thủy Unicode 文本上训练词汇 (BPE hoặc Unigram) ,并把空白编码为`▁` tiktoken là một mã hóa nhanh chóng của OpenAI 面向预构建词汇; nó không tập luyện.

经验法则:

- **训练新的 vocabulary：**CâuPiece ((多语言,无需预代码) hoặc HF Tokenizers。
- **面向 GPT vocabulary 的快速推理：**tiktoken(cl100k_base、o200k_base)
- **两者都要：**HF Tokenizers, một库完成训练 + phục vụ.


```figure
bpe-merge
```

##  xây dựng nó

### Bước 1: Từ zero thực hiện BPE

见 `code/main.py`❖ vòng như sau:

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

Khóa toán này có 3 sự thật.`</w>`标记词尾, do đó "low" (nước sau) và "lower" (nước sau) sẽ giữ phân biệt.

### 步骤 2: 用学到的合并 进行编码

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

n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n

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

chú ý: không cần pre-tokenization,空格编码为 `▁`- Tôi không biết.`character_coverage`Control Rare characters được giữ lại hoặc được chiếu`<unk>`Đường độ tăng trưởng:

### Bước 4: Sử dụng mã thông báo từ ngữ tương thích OpenAI

```python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
print(enc.encode("untokenizable"))        # [127340, 101028]
print(len(enc.encode("Hello, world!")))   # 4
```

仅编码.速度快.(Rust backend) ⋅在字节 计数,成本估算, ngữ cảnh cửa sổ 预算方面,与GPT-4/5 Tokenization 精确匹配──

## Năm 2026 vẫn sẽ phát hành trên mạng

- **Tokenizer drift。**Trong từ ngữ A 上训练,却用 từ ngữ B 部署;;Token ID khác nhau; mô hình输遇变成垃圾;;在 CI 中检查`tokenizer.json`Hạ-shì
- **Whitespace ambiguity。**Trong BPE "hello" và "hello" 会产生不同 Token──始终显式指定 `add_special_tokens`和 `add_prefix_space`
- **Multilingual undertraining。**Các từ vựng của các tập đoàn tiếng Anh nặng sinh thành sẽ được cắt giảm từ chữ Latinh 5-10 lần.
- **Emoji splits。**单个emoji可能占 5个代币――在做文text 预算时检查检查点 的emoji 处理――

## Sử dụng nó

2026 năm của công nghệ:

| 情况 | 选择 |
|-----------|------|
| 从零训练 monolingual model | HF Tokenizers (BPE) |
| 训练 multilingual model | SentencePiece (Unigram, `character_coverage=0.9995`) |
| Serving 一个 OpenAI-compatible API | tiktoken (`o200k_base` for GPT-4+) |
| Domain-specific vocab（code、math、protein） | 在 domain corpus 上训练 custom BPE，并与 base vocab 合并 |
| Edge inference，小模型 | Unigram（较小的 vocabulary 效果更好） |

Kích thước từ vựng là một quy mô  quyết định, không phải là số thường xuyên.

##  phát hành nó

保存为 `outputs/skill-bpe-vs-wordpiece.md`- Có thể là:

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

1. **简单。**Trong `code/main.py`Ưu điểm của một tập thể nhỏ trên tập luyện một 500 hợp nhất BPE──Encode ba từ kéo dài── có bao nhiêu đúng để tạo ra 1 Token, còn có bao nhiêu để tạo ra > 1 Token?
2. **中等。**Trong 100 câu Wikipedia tiếng Anh 上比较 `cl100k_base``o200k_base`和一个你用语音=32k 训练的句子Piece BPE 代号数――报告每种方法的压缩比例――
3. **困难。**Sử dụng BPE、Unigram 和 WordPiece trong cùng một tập thể trên tập luyện. Hãy phân biệt chúng cho một phân loại cảm xúc nhỏ, và đo độ chính xác dòng chảy.

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
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226)                 
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary) 简明参考。
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken) sách nấu ăn + danh sách mã hóa。
