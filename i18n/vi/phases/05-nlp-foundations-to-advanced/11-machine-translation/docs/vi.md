# Truyền dịch máy

> Dịch là nhiệm vụ của nghiên cứu NLP trong ba thập kỷ, và hiện vẫn tiếp tục được tiếp tục.

**Type:** Build
**Languages:** Python
**先修要求：**Giai đoạn 5 · 10 (Cảnh sát), Giai đoạn 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 minutes

## 问题
Một mô hình 读取一种语言的句子,并生成另一种语言的句子――长度会变化――词序会变化――有些源语言词会映射到多个目标语言词,反之亦然――习语拒绝对一映射――英语里的"I miss you" 在法语里是"tu me manques"  字面意思是"you are missing me"――没有任何词级配线能在这种情况下保留下来――

Truyền thông máy là bắt buộc NLP phát triển các bộ mã hóa-chế lập trình, chú ý, biến đổi, và cuối cùng thúc đẩy toàn bộ nhiệm vụ hình thành mô hình LLM. Mỗi bước tiến của sự xuất hiện, đều là do chất lượng dịch thuật có thể đo lường, và sự khác biệt giữa con người và máy tính vẫn còn tồn tại.

本课跳过历史课,讲解 2026 年的可用管线:pretrained multilingual encoder-decoder(NLLB-200或 mBART) ‧subword tokenization、beam search、BLEU 和 chrF evaluation,以及仍会未经发现就进入生产的少数失败模式──

## 概念
![MT pipeline: tokenize → encode → decode with attention → detokenize](../assets/mt-pipeline.svg)

现代 MT 是在平行文上训练的变体编码解码器──编码器 读取按其语言代码化 处理后的源──编码器 通过横向注意力(课 10) sử dụng đầu ra của bộ encoder, một lần tạo một từ phụ──编码 使用束搜索以避免贪解码陷──输出 会被 detokenized、detrucased,并与参考 评分对比──

Ba lựa chọn hoạt động quyết định chất lượng MT trong thế giới thực.

- **Tokenizer.**SentencePiece BPE 在混合语言 corpus 上训练──跨语言共享词汇 正是NLLB 能实现零射语言对的原因──
- **Model size.**NLLB-200 than 600M có thể trên máy tính xách tay trên trên vận hành.
- **Decoding.**通用内容使用梁宽 4-5──使用长度罚 避免输出 过短──在需要术语一致性时使用限制解码──


```figure
seq2seq-alignment
```

##  xây dựng nó
### 步骤 1: Một cuộc gọi MT được đào tạo trước

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_id = "facebook/nllb-200-distilled-600M"
tok = AutoTokenizer.from_pretrained(model_id, src_lang="eng_Latn")
model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

src = "The cats are running."
inputs = tok(src, return_tensors="pt")

out = model.generate(
    **inputs,
    forced_bos_token_id=tok.convert_tokens_to_ids("fra_Latn"),
    num_beams=5,
    length_penalty=1.0,
    max_new_tokens=64,
)
print(tok.batch_decode(out, skip_special_tokens=True)[0])
```

```text
Les chats courent.
```

Có ba điều rất quan trọng.`src_lang`告诉 tokenizer 应用哪种字体和细分――`forced_bos_token_id`告诉 decoder phải tạo ra các ngôn ngữ nào. Cả hai đều là những thủ thuật cụ thể của NLLB. mBART và M2M-100 sử dụng các quy định riêng của mình, không thể trao đổi.

### 步骤 2: BLEU và chrF

BLEU  đo sản lượng với tham chiếu  giữa n-gram chồng chéo──四种 tham chiếu n-gram kích thước(1-4)、đơn giản của trung bình hình học, cũng như đối với quá ngắn sản lượng  hạn hạn hạn──分数范围是 [0, 100]──常用──解释起来令人丧:30 BLEU là "có thể sử dụng";40 là "tốt";50 là "từ biệt"; thấp hơn 1 BLEU khác biệt thuộc về tiếng ồn──

chrF  đo điểm F ở cấp độ ký tự.  Đối với ngôn ngữ phong phú hình dạng, vì BLEU sẽ đánh giá thấp phù hợp.

```python
import sacrebleu

hypotheses = ["Les chats courent."]
references = [["Les chats courent."]]

bleu = sacrebleu.corpus_bleu(hypotheses, references)
chrf = sacrebleu.corpus_chrf(hypotheses, references)
print(f"BLEU: {bleu.score:.1f}  chrF: {chrf.score:.1f}")
```

始终使用 `sacrebleu` Nó sẽ tiêu chuẩn hóa token hóa, để số lượng phân tích được so sánh trên giấy tờ.

### 3 cấp đánh giá cấp (2026)

现代 MT đánh giá sử dụng 3 loại phụ trợ của các gia đình métric.

- **Heuristic**(BLEU, chrF) ――快速、基于参考、可解释, nhưng đối với ngữ pháp không nhạy cảm──用于 so sánh và phát hiện sự lùi lại──
- **Learned**(COMET, BLEURT, BERTScore)  Trong phán xét của con người 上训练的神经模型; so sánh dịch thuật với nguồn và sự tương đồng ngữ nghĩa của tham chiếu  Từ năm 2023, kết nối của nghiên cứu COMET với MT cao nhất, và trong các vấn đề chất lượng là tình huống sản xuất mặc định năm 2026 
- **LLM-as-judge**(không tham chiếu) 提示 một mô hình lớn dựa trên sự thông thạo, thích hợp, thích hợp về văn hóa cho các bản dịch 打分── khi đề 设计良好时, GPT-4-as-judge với tỷ lệ phù hợp với con người là khoảng 80%── được sử dụng cho nội dung mở không tham chiếu──

实用2026 stack: 用 `sacrebleu`计算 BLEU 和 chrF, dùng `unbabel-comet`計算 COMET,并用促 LLM 作为最终面向人类的信号──在信任任何指标 用生产数据 之前,先用50-100 个标签的人类的例子 进行校准──

Các số liệu không tham chiếu ((COMET-QE, BLEURT-QE, LLM-as-judge) để bạn có thể đánh giá các bản dịch trong trường hợp không có tham chiếu, điều này đối với không có các cặp ngôn ngữ đuôi dài của các bản dịch tham khảo rất quan trọng.

### Bước 3: sản xuất Trung会坏在哪里

Các hoạt động trên trong 80% sẽ được dịch, trong 20% còn lại sẽ thất bại.

- **Hallucination.**Mô hình phát minh nguồn 中不存在的内容──常见于不熟悉的域名词汇──症状:output 很流,但声称源源 没有陈述的事实──Mítigation: đối với các thuật ngữ miền Sử dụng mã hóa bị hạn chế, đối với nội dung được quy định Sử dụng đánh giá của con người,并 giám sát sản xuất 是否比输入 长很多──
- **Off-target generation.**Mô hình 翻译成错误语言──NLLB Trong các cặp ngôn ngữ hiếm gặp 上尤其容易出现这个问题──Mí giải:验证 `forced_bos_token_id`,并始终使用语言-ID mô hình kiểm tra 检查输出──
- **Terminology drift.**"Sign up" trong doc 1 中 biến thành "s'inscribe", trong doc 2 中 biến thành "creer un compte"── đối với văn bản UI và chuỗi đối diện người dùng, sự nhất quán hơn chất lượng thô hơn hơn── quan trọng hơn──Mitigation: glossary-constrained decoding hoặc post-edit dictionary──
- **Formality mismatch.**法语 "tu" vs "vous",日语 lịch sự.
- **Length explosion on short input.**很短的输入句子 经常产生过长的翻译,因为在低于约5代码源代码 时长处罚 会突然失效──Mitigation:使用与源长 成比例的硬最大长 cap──

### Bước 4: Để một miền  thực hiện điều chỉnh tinh tế

Các mô hình được đào tạo trước là các nhà nói chung. Phương pháp y tế hoặc dịch trò chơi đối thoại sẽ được hưởng lợi rõ ràng từ việc điều chỉnh các dữ liệu song song trên miền.

```python
from transformers import Trainer, TrainingArguments
from datasets import Dataset

pairs = [
    {"src": "The defendant pleaded guilty.", "tgt": "L'accusé a plaidé coupable."},
]

ds = Dataset.from_list(pairs)


def preprocess(ex):
    return tok(
        ex["src"],
        text_target=ex["tgt"],
        truncation=True,
        max_length=128,
        padding="max_length",
    )


ds = ds.map(preprocess, remove_columns=["src", "tgt"])

args = TrainingArguments(output_dir="out", per_device_train_batch_size=4, num_train_epochs=3, learning_rate=3e-5)
Trainer(model=model, args=args, train_dataset=ds).train()
```

Một vài ngàn ví dụ song song chất lượng cao hơn một trăm triệu ví dụ web sặc tiếng ⋅ đào tạo chất lượng dữ liệu là sản xuất lớn nhất trong một cái cột ⋅

## Sử dụng nó
Lưu trữ sản xuất MT năm 2026:

| Use case | Recommended starting point |
|---------|---------------------------|
| Any-to-any, 200 languages | `facebook/nllb-200-distilled-600M`（laptop）或 `nllb-200-3.3B`（production） |
| English-centric, high quality, 50 languages | `facebook/mbart-large-50-many-to-many-mmt` |
| Short runs, cheap inference, English-French/German/Spanish | Helsinki-NLP / Marian models |
| Latency-critical browser-side | ONNX-quantized Marian（~50 MB） |
| Maximum quality, willing to pay | GPT-4 / Claude / Gemini with translation prompts |

截至 2026年, LLM trong một số cặp ngôn ngữ 上 đã vượt qua các mô hình MT chuyên ngành, đặc biệt là trong nội dung ngữ pháp và ngữ cảnh dài 上。取舍是每代币成本和延迟──当 ngữ cảnh dài、stylistic consistency 或通过促实现域名适应比 throughput 更重要时,选择 LLM──

## 交付 nó
保存为 `outputs/skill-mt-evaluator.md`- Có thể là:

```markdown
---
name: mt-evaluator
description: Evaluate a machine translation output for shipping.
version: 1.0.0
phase: 5
lesson: 11
tags: [nlp, translation, evaluation]
---

给定 source text 和 candidate translation，输出：

1. Automatic score estimate。你预期的 BLEU 和 chrF ranges。说明是否有 reference。
2. 五点 human-verifiable check list：(a) content preservation（无 hallucinations），(b) correct language，(c) register / formality match，(d) terminology consistency with glossary if provided，(e) 无 truncation 或 length explosion。
3. 一个需要探查的 domain-specific issue。例如 legal：named entities 和 statute citations。medical：drug names 和 dosages。UI：placeholder variables `{name}`。
4. Confidence flag。"Ship" / "Ship with review" / "Do not ship"。将它与 step 2 中发现的问题 severity 绑定。

如果 output 没有 language-ID check，拒绝 ship translation。除非 user 明确选择 reference-free scoring（COMET-QE, BLEURT-QE），否则拒绝在没有 reference 的情况下 evaluate。标记任何超过 1000 tokens 的内容，因为它很可能需要 chunked translation。
```

## 练习
1. **Easy.**Sử dụng `nllb-200-distilled-600M`将一个 5 句英文段落翻译成法语,再翻译回英语──衡回路与原始的接近程度──你应该会看到语义保存,同时伴随着词选择漂移──
2. **Medium.**Sử dụng `fasttext lid.176`Hoặc`langdetect`Để thực hiện kiểm tra ID ngôn ngữ cho các kết quả dịch thuật, hãy tập hợp nó vào cuộc gọi MT, để các thế hệ ngoài mục tiêu được bắt trong quá trình quay trở lại.
3. **Hard.**Trong lựa chọn của bạn 5.000 cặp miền corpus trên tinh chỉnh `nllb-200-distilled-600M` Trong điều chỉnh tinh tế , sử dụng một bộ dài  đo BLEU  báo cáo những loại câu nào  được cải thiện, những gì xuất hiện sự lùi lại

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BLEU | Translation score | 带 brevity penalty 的 N-gram precision。[0, 100]。 |
| chrF | Character F-score | Character-level F-score。对形态丰富的语言更敏感。 |
| NMT | Neural MT | 在 parallel text 上训练的 Transformer encoder-decoder。2017+ default。 |
| NLLB | No Language Left Behind | Meta 的 200-language MT model family。 |
| Constrained decoding | Controlled output | 强制特定 tokens 或 n-grams 在 output 中出现 / 不出现。 |
| Hallucination | Invented content | source 不支持的 model output。 |

## 延伸阅读
- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672) NLLB giấy tờ
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/) Tại sao `sacrebleu`Đó là cách duy nhất chính xác để báo cáo BLEU.
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/) giấy chrF。
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) 实用细调通行──
