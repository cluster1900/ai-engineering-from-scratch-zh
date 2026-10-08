# Alt kelime işaretleme  BPE, WordPiece, Unigram, SentencePiece

> Sözcüğü Tokenizer 会在未见的词上卡住──Character Tokenizer 会让序列长度暴──Subword Tokenizer 在两者之间取得平衡──每个现代 LLM 都附属一种──

**类型：**Öğrenme
**语言：**Python
**先修：**5 aşama · 01(Message Processing),5 aşama · 04(GloVe / FastText / Subword)
**时间：**60 dakika kadar .

## 问题

Senin sözlük kaynağında 50.000 个词――用户输入"untokenizable"――你的代码符号机 返回 `[UNK]`◊ Model şimdi bu kelime için hiçbir sinyal yok. Daha da kötüsü: korpusunuzun 90'ıncı yüzdelik dosyasında 40 nadir kelime vardır, bu da her dosyanın 40 bit bilgi kaybedeceği anlamına gelir.

Tokenization sözcüğü  solved this problem──常见词保持为单个Token──罕见词会分解成有意的片段:`untokenizable`→ `un`- Evet .`token`- Evet .`izable`❖ Eğitim verileri her şeyi kapsayabilir, çünkü herhangi bir karakter son olarak bir baytlı 序列dir.

2026 yılının her sınır LLM ̋ı üç algoritmalardan birini kullanıyor, ̋BPE ̋ Unigram ̋ WordPiece ̋, ̋ ve ̋tiktoken ̋ SentencePiece ̋ HF Tokenizers ̋ ̋ ̋ birinden birini seçmezsen bir dil modeli yayınlayamazsın.

## 概念

![BPE vs Unigram vs WordPiece, character-by-character](../assets/subword-tokenization.svg)

**BPE (Byte-Pair Encoding)。**Karakter düzeyinde kelime birikimi 开始──统计每个相邻对──把最频繁的对 合并成一个新 Token──重复直到达到目标词汇规模──主流算法:GPT-2/3/4、Llama、Gemma、Qwen2、Mistral──

**Byte-level BPE。**Aynı algoritma, ama orijinal baytlara dayanır.`[UNK]`Token,即任何字节 序列都可编码──GPT-2 使用 50,257 个 Token(256字节 + 50,000 birleşim + 1 özel)──

**Unigram。**Büyük bir kelime havuzundan 开始──为每个代币 分配单格式概率──代剪除那些移除后最小增加体日记概率的代币──推理时是概率性的:可以对 Tokenization 采样(通过子词规律化做数据增强时很有用)──T5、mBART、ALBERT、XLNet、Gemma 使用它──

**WordPiece。**合并那些最大化训练 corpus olasılığı çiftleri, orijinal frekanslara göre değil.

**SentencePiece vs tiktoken。**SentencePiece is directly in original Unicode 文本上训练词汇库 (BPE veya Unigram)`▁`△tiktoken △ OpenAI 面向预构建词汇的快速编码器; 它不训练──

经验法则:

- **训练新的 vocabulary：**SatencePiece ((多语言,无需预标签化) 或 HF Tokenizers。
- **面向 GPT vocabulary 的快速推理：**tiktoken(cl100k_base、o200k_base)
- **两者都要：**HF Tokenizers, bir kutu tamamlama eğitim + hizmet.


```figure
bpe-merge
```

## Yapın onu.

### 步骤 1: BPE'yi sıfırdan gerçekleştirmek

Görüyorum .`code/main.py`❖ Aşağıdaki döngüler:

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

Bu algoritma üç gerçeğe kod veriyor.`</w>`标记词尾,因此"low" (doğru) ve "lower" (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru)  (doğru) )  (doğru)  (doğru)  (doğru)  () )  ()  ()  () )  ()  ()

### 步骤 2: 用学到的合并  kodlama

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

Not: pre-tokenization gerekmiyor,空格编码为 `▁`- Evet .`character_coverage`Kontrol nadir karakterler saklanıp görüntülenmeye devam eder.`<unk>`Devamlı bir gelişme derecesi.

### 步骤 4: OpenAI uyumlu kelime kullanımı

```python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
print(enc.encode("untokenizable"))        # [127340, 101028]
print(len(enc.encode("Hello, world!")))   # 4
```

仅编码──速度快(Rust backend)──在字节 计数、成本估算、文本窗口 预算方面,与GPT-4/5 Tokenization 精确匹配──

## 2026 yılında da yayınlanacak.

- **Tokenizer drift。**A'da bir sözcükle çalışmak, B'de bir sözcükle çalışmak.`tokenizer.json`Haş.
- **Whitespace ambiguity。**BPE'de "hello" ve "hello" farklı belirtiler ortaya çıkar.`add_special_tokens`和 `add_prefix_space`- Evet.
- **Multilingual undertraining。**İngilizce ağır corpora 生成の語彙 会把非ラテン文字 切成多 5-10 倍的 Token。 Aynı şekilde GPT-3.5 上上使用日本/アラビア 时成本高 5-10 倍。o200k_base 部分修复了这一点。
- **Emoji splits。**单个emoji 可能占成 5个代币──在做文 context 预算时检查点 的emoji 处理──

## Kullan

2026 yılının teknolojisi:

| 情况 | 选择 |
|-----------|------|
| 从零训练 monolingual model | HF Tokenizers (BPE) |
| 训练 multilingual model | SentencePiece (Unigram, `character_coverage=0.9995`) |
| Serving 一个 OpenAI-compatible API | tiktoken (`o200k_base` for GPT-4+) |
| Domain-specific vocab（code、math、protein） | 在 domain corpus 上训练 custom BPE，并与 base vocab 合并 |
| Edge inference，小模型 | Unigram（较小的 vocabulary 效果更好） |

Sözlük boyutu                                                                                                                                                                                                                                                             

## Yayınla

保存为 `outputs/skill-bpe-vs-wordpiece.md`- ...

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

1. **简单。**- Evet .`code/main.py`500'den fazla BPE'yi eğitmek için üç kelimeyi kodlayın. Bir tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane
2. **中等。**100 İngilizce Wikipedia cümlesi`cl100k_base`- Evet.`o200k_base`Yetişkinlik için kullanılan bir ifade.
3. **困难。**BPE、Unigram 和 WordPiece ile aynı vücut üzerinde eğitim. Onları küçük bir duygu sınıflandırıcısı için ayırın ve aşağı akıntı doğruluğunu ölçün. Bu seçim F1'in değişimini 1 noktadan fazla yapar mı?

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
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226)Bu kitap.
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary) 简明参考。
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken) yemek kitabı + kodlama listesi。
