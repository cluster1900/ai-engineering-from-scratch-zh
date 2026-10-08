# 多语言 NLP

> Một mô hình, 100+ ngôn ngữ, hầu hết các ngôn ngữ không có bất kỳ dữ liệu đào tạo nào.

**Type:** Learn
**Languages:** Python
**先修要求：**Giai đoạn 5 · 04 (GloVe, FastText, Subword), Giai đoạn 5 · 11 (T dịch máy)
**Time:** ~45 分钟

## 问题

Tiếng Anh có hàng tỷ mẫu nhãn trên bảng xếp hạng. Tiếng Urdu có hàng ngàn.

Mô hình đa ngôn ngữ thông qua việc đào tạo một mô hình để giải quyết vấn đề này trên nhiều ngôn ngữ. chia sẻ cho thấy mô hình có thể chuyển từ năng lực học tập từ ngôn ngữ có nguồn lực cao đến ngôn ngữ có nguồn lực thấp. Sử dụng phân tích cảm xúc bằng tiếng Anh để điều chỉnh mô hình, nó có thể mở hộp ngay lập tức sử dụng để đưa ra dự đoán cảm xúc khá không sai đối với tiếng Urdu. Đây là chuyển đổi không-bốc 跨语言, nó đã tái tạo cách NLP hướng tới giao dịch toàn cầu.

Bài này sẽ giải thích các phương pháp cân nhắc, mô hình cổ điển, và một nhóm người thường xuyên bắt đầu làm nhiều ngôn ngữ làm việc đã đưa ra quyết định:

## 概念

![通过共享多语言 Embedding space 实现跨语言迁移](../assets/multilingual.svg)

**共享词表。**Nhiều ngôn ngữ mô hình sử dụng trên tất cả các văn bản ngôn ngữ mục tiêu được đào tạo SentencePiece hoặc WordPiece tokeniser.`anti-`Tôi sẽ nhận được một token.

**共享表示。**Trong nhiều ngôn ngữ, Transformer sẽ học được các câu tương tự trong các ngôn ngữ khác nhau sẽ tạo ra các trạng thái ẩn tương tự. MBERT, XLM-R và NLLB đều thể hiện điều này.

**Zero-shot 迁移。**Trong một ngôn ngữ (thường là tiếng Anh) với các nhãn hiệu dữ liệu được tinh chỉnh trên mô hình.

**Few-shot fine-tuning。**Trong ngôn ngữ mục tiêu, thêm 100-500 mẫu thẻ. tỷ lệ xác thực nhiệm vụ phân loại sẽ tăng lên 95-98% của cơ sở tiếng Anh. Đây là giá trung bình NLP đa ngôn ngữ cao nhất.

## 模型

| Model | Year | Coverage | Notes |
|-------|------|----------|-------|
| mBERT | 2018 | 104 languages | 在 Wikipedia 上训练。第一个实用的多语言 LM。低资源语言表现较弱。 |
| XLM-R | 2019 | 100 languages | 在 CommonCrawl 上训练（比 Wikipedia 大得多）。确立了跨语言 baseline。Base 270M，Large 550M。 |
| XLM-V | 2023 | 100 languages | 具有 1M-token 词表的 XLM-R（相比 250k）。低资源语言表现更好。 |
| mT5 | 2020 | 101 languages | 用于多语言生成的 T5 架构。 |
| NLLB-200 | 2022 | 200 languages | Meta 的翻译模型；包含 55 种低资源语言。 |
| BLOOM | 2022 | 46 languages + 13 programming | 以多语言方式训练的开放 176B LLM。 |
| Aya-23 | 2024 | 23 languages | Cohere 的多语言 LLM。在阿拉伯语、印地语、斯瓦希里语上表现强。 |

按用例选择──分类任务可以把XLM-R-base 作为稳定默认值──生成任务需要根据翻译还是开源生成,在mT5或NLLB 之间选择──LLM 风格工作可以搭配 Aya-23或Claude,并使用明确的多语言提示──

## 源语言决策(2026 研究)

多数团队默认使用英语作为细调源语言──近期研究(2026) cho thấy, đây往往是错的──

语言相似性比原始语料规模更能预测迁移质量── đối với Sla夫语目标语言,德语或俄语往往优于英语── đối với Ấn语族目标语言,印度语往往优于英语──**qWALS**Các chỉ số tương tự được định lượng dựa trên các tính năng của Đại táo Thế giới về cấu trúc ngôn ngữ năm 2026.**LANGRANK**(Lin et al., ACL 2019) là một phương pháp sớm hơn khác, nó kết hợp ngôn ngữ tương tự, quy mô ngôn ngữ và hệ thống gia đình, để sắp xếp cho ngôn ngữ nguồn ứng cử.

Quy tắc thực tế: Nếu ngôn ngữ mục tiêu của bạn có một loại ngôn ngữ có nguồn lực cao gần như, trước tiên hãy thử tinh chỉnh ngôn ngữ đó, sau đó hãy thử tinh chỉnh với tiếng Anh đối với so sánh.


```figure
n5-crosslingual-bridge
```

## 构建

### 步骤 1: không bắn 跨语言分类

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tok = AutoTokenizer.from_pretrained("joeddav/xlm-roberta-large-xnli")
model = AutoModelForSequenceClassification.from_pretrained("joeddav/xlm-roberta-large-xnli")


def classify(text, candidate_labels, hypothesis_template="This text is about {}."):
    scores = {}
    for label in candidate_labels:
        hypothesis = hypothesis_template.format(label)
        inputs = tok(text, hypothesis, return_tensors="pt", truncation=True)
        with torch.no_grad():
            logits = model(**inputs).logits[0]
        entail_score = torch.softmax(logits, dim=-1)[2].item()
        scores[label] = entail_score
    return dict(sorted(scores.items(), key=lambda x: -x[1]))


print(classify("I love this product!", ["positive", "negative", "neutral"]))
print(classify("मुझे यह उत्पाद पसंद है!", ["positive", "negative", "neutral"]))
print(classify("J'adore ce produit !", ["positive", "negative", "neutral"]))
```

Một mô hình, ba ngôn ngữ, cùng một API. XLM-R trong NLI dữ liệu trên đào tạo, thông qua thủ thuật liên kết có thể tốt nhất chuyển sang phân loại nhiệm vụ.

### 步骤 2: 多语言 Cắm dung không gian

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

pairs = [
    ("The cat is sleeping.", "Le chat dort."),
    ("The cat is sleeping.", "El gato está durmiendo."),
    ("The cat is sleeping.", "Die Katze schläft."),
    ("The cat is sleeping.", "The dog is barking."),
]

for eng, other in pairs:
    emb_eng = model.encode([eng], normalize_embeddings=True)[0]
    emb_other = model.encode([other], normalize_embeddings=True)[0]
    sim = float(np.dot(emb_eng, emb_other))
    print(f"  {eng!r} <-> {other!r}: cos={sim:.3f}")
```

译文会落在嵌入空间 中相近位置――另一句不同的英语句子会落得更远―― đây là lý do tại sao việc tìm kiếm, tập hợp và tương tự có thể làm việc――

### 步骤 3: vài cú đánh tinh chỉnh 策略

```python
from transformers import TrainingArguments, Trainer
from datasets import Dataset


def few_shot_finetune(base_model, base_tokenizer, examples):
    ds = Dataset.from_list(examples)

    def tokenize_fn(ex):
        out = base_tokenizer(ex["text"], truncation=True, max_length=128)
        out["labels"] = ex["label"]
        return out

    ds = ds.map(tokenize_fn)
    args = TrainingArguments(
        output_dir="out",
        per_device_train_batch_size=8,
        num_train_epochs=5,
        learning_rate=2e-5,
        save_strategy="no",
    )
    trainer = Trainer(model=base_model, args=args, train_dataset=ds)
    trainer.train()
    return base_model
```

Đối với 100-500 个目标语言样本,`num_train_epochs=5`和 `learning_rate=2e-5`Tỷ lệ học tập cao hơn sẽ dẫn đến sự sụp đổ của nhiều ngôn ngữ, cuối cùng có được một mô hình chỉ gặp tiếng Anh.

## Đánh giá thực sự hiệu quả

- **在 held-out 集上按语言统计准确率。**Đừng tập hợp. Tập hợp sẽ che giấu vấn đề cuối cùng.
- **与单语言 baseline 对比。**Đối với một ngôn ngữ có đủ dữ liệu, mô hình ngôn ngữ đơn được đào tạo có thể tốt hơn nhiều ngôn ngữ.
- **Entity-level 测试。**目标语言中的命名实体──多语言模型对远离拉丁文字的书写系统通常标记化较弱──
- **跨语言一致性。**Khi hai ngôn ngữ biểu hiện cùng ý nghĩa, nên tạo ra cùng dự đoán.

## 使用

2026 技术:

| Task | Recommended |
|-----|-------------|
| Classification, 100 languages | XLM-R-base (~270M) fine-tuned |
| Zero-shot text classification | `joeddav/xlm-roberta-large-xnli` |
| Multilingual sentence embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Translation, 200 languages | `facebook/nllb-200-distilled-600M`（见 lesson 11） |
| Generative multilingual | Claude, GPT-4, Aya-23, mT5-XXL |
| Low-resource language NLP | XLM-V 或在相关高资源语言上做 domain-specific fine-tune |

Nếu hiệu suất quan trọng, chắc chắn phải được điều chỉnh tốt cho mục tiêu ngôn ngữ dự kiến ngân sách.

### Tokenization 成本(低资源语言会出什么问题)

Nhiều ngôn ngữ mô hình chia sẻ một tokenizer giữa tất cả các ngôn ngữ. Từ ngữ này được đào tạo trên các ngôn ngữ chủ đạo bởi tiếng Anh, tiếng Pháp, tiếng Tây Ban Nha, tiếng Trung, tiếng Đức. Đối với bất kỳ ngôn ngữ nào ngoài tập hợp chủ đạo, ba loại chi phí sẽ được chồng lên:

- **Fertility 成本。**低资源语言文本会被代币化成比英语更多的代币――一个印地语句可能需要等价英语句的 3-5x代币――这个 3-5x会吞吞掉你的上下文窗口、训练效率和延迟预算――
- **变体恢复成本。**Mỗi lỗi đánh chữ, biến thể ký hiệu phụ gia, Unicode, quy định không phù hợp hoặc thay đổi viết nhỏ, đều trở thành một chuỗi không liên quan lạnh trong không gian nhúng.
- **容量外溢成本。**Thành phần 1 và 2 sẽ tiêu thụ trên vị trí, độ sâu và độ nhúng ích thước.

Ưu điểm thực tế là: mô hình của bạn được đào tạo trên tiếng Ấn Độ là bình thường, mất đường cong trông đúng, bối rối thời gian trông hợp lý, sản xuất xuất xuất nhưng rất nhỏ gọn và sai lầm.**Tokenizer 坏了，靠扩大数据规模救不回来。**

缓解方式: chọn một đối với mục tiêu ngôn ngữ覆盖良好的tokenizer(XLM-V của 1M-token 词表就是直接修复); training前在持久 目标文本上验证代码化生育; đối với thực长尾的书写系统使用字节级 fallback(SentencePiece `byte_fallback=True`,GPT-2 风格 byte-level BPE), đảm bảo không bao giờ xảy ra OOV.

## 交付

保存为 `outputs/skill-multilingual-picker.md`- Có thể là:

```markdown
---
name: multilingual-picker
description: 为多语言 NLP 任务选择源语言、目标模型和评估计划。
version: 1.0.0
phase: 5
lesson: 18
tags: [nlp, multilingual, cross-lingual]
---

给定需求（目标语言、任务类型、每种语言可用的带标签数据），输出：

1. Fine-tuning 的源语言。默认英语；如果目标语言有类型学上接近的高资源语言，检查 LANGRANK 或 qWALS。
2. Base model。XLM-R（classification）、mT5（generation）、NLLB（translation）、Aya-23（generative LLM）。
3. Few-shot 预算。如果可用，从 100-500 个目标语言样本开始。只有在标注不可行时才使用 zero-shot。
4. 评估计划。按语言统计准确率（不是聚合）、跨语言一致性、非拉丁文字上的 entity-level F1。

拒绝交付没有按语言评估的多语言模型，因为聚合指标会掩盖长尾失败。将 tokenization 覆盖率低的书写系统（阿姆哈拉语、提格里尼亚语、许多非洲语言）标记为需要带 byte-fallback 的模型（带 byte_fallback=True 的 SentencePiece，或像 GPT-2 一样的 byte-level tokenizer）。
```

## 练习

1. **Easy.**Trong tiếng Anh, tiếng Pháp, tiếng Ấn và tiếng Ả Rập, mỗi ngôn ngữ có 10 câu, chạy đường ống phân loại không bắn.
2. **Medium.**Sử dụng `paraphrase-multilingual-MiniLM-L12-v2`Trong một ngôn ngữ hỗn hợp nhỏ, xây dựng trên một cross-lingual checker.
3. **Hard.**Trong các nhiệm vụ phân loại tiếng Ấn Độ so sánh nguồn tiếng Anh và nguồn tiếng Ấn Độ tinh chỉnh. Cả hai chương trình đều sử dụng 500 mẫu ngôn ngữ mục tiêu để thực hiện tinh chỉnh ít lần chụp.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Multilingual model | 一个模型，多种语言 | 跨语言共享词表和参数。 |
| Cross-lingual transfer | 在一种语言上训练，在另一种语言上运行 | 在源语言上 fine-tune，在没有目标语言标签的情况下在目标语言上评估。 |
| Zero-shot | 没有目标语言标签 | 不在目标语言上 fine-tune 的迁移。 |
| Few-shot | 少量目标标签 | 用于 fine-tuning 的 100-500 个目标语言样本。 |
| mBERT | 第一个多语言 LM | 在 Wikipedia 上预训练的 104 语言 BERT。 |
| XLM-R | 标准跨语言 baseline | 在 CommonCrawl 上预训练的 100 语言 RoBERTa。 |
| NLLB | Meta 的 200 语言 MT | No Language Left Behind。包含 55 种低资源语言。 |

## 延伸阅读

- [Conneau et al. (2019). Unsupervised Cross-lingual Representation Learning at Scale](https://arxiv.org/abs/1911.02116) XLM-R 论文。
- [Pires, Schlinger, Garrette (2019). How Multilingual is Multilingual BERT?](https://arxiv.org/abs/1906.01502) 开启跨语言迁移研究线的分析论文──
- [Costa-jussà et al. (2022). No Language Left Behind](https://arxiv.org/abs/2207.04672) NLLB-200 论文。
- [Üstün et al. (2024). Aya Model: An Instruction Finetuned Open-Access Multilingual Language Model](https://arxiv.org/abs/2402.07827) Aya,Cohere's多语言 LLM。
- [Language Similarity Predicts Cross-Lingual Transfer Learning Performance (2026)](https://www.mdpi.com/2504-4990/8/3/65) QWALS / LANGRANK 源语言论文。
