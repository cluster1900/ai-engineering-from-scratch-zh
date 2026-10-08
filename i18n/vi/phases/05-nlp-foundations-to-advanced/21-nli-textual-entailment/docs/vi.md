# Naturelanguage推理  文本含

> "t entails h" có nghĩa là, người đọc t 后会得出 h 为真实的结论――NLI là dự đoán liên quan / mâu thuẫn / trung lập nhiệm vụ―― bề mặt khô, nhưng trong sản xuất chịu trách nhiệm quan trọng――

**类型：**Học tập
**语言：**Python
**先修：**Giai đoạn 5 · 05 (Phân tích cảm xúc), Giai đoạn 5 · 13 (Phân tích câu hỏi)
**时间：**~ 60 phút

## 问题

Bạn xây dựng một bản tóm tắt. Nó tạo ra một bản tóm tắt. Bạn biết thế nào mà bản tóm tắt này không chứa ảo giác?

Bạn đã xây dựng một chatbot. Nó trả lời "có". Bạn biết câu trả lời này như thế nào?

Bạn cần theo chủ đề phân loại 10.000 bài báo tin tức. Bạn không có nhãn huấn luyện. Bạn có thể sử dụng một mô hình?

Những vấn đề này có thể được kết hợp với NLP.`t`Và một giả thuyết `h`- Tôi không biết.`h``t`liên quan, có phản đối, hay trung lập?

- **Hallucination check:** `t`= tài liệu nguồn,`h`= tuyên bố tổng kết. Không liên quan = ảo giác.
- **Grounded QA:** `t`= đoạn đường được lấy lại,`h`= trả lời được tạo ra. Không liên quan = tạo ra.
- **Zero-shot classification:** `t`= tài liệu,`h`= nhãn bằng lời nói ("Đây là về thể thao")。Sự bao gồm = nhãn dự đoán。

Một nhiệm vụ, ba loại sản xuất mục đích. Đó là lý do tại sao mỗi khung đánh giá RAG đều được trang bị một mô hình NLI ở tầng dưới.

## 概念

![NLI: three-way classification, premise vs hypothesis](../assets/nli.svg)

**三个 labels。**

- **Entailment.** `t`→ `h`"Căn đang trên thảm" có nghĩa là "Có một con mèo".
- **Contradiction.** `t`→`h`"Căn trên thảm" mâu thuẫn với "Không có mèo".
- **Neutral.**"Căn chó đang trên thảm" đối với "Căn chó đói".

**不是逻辑 entailment。**NLI là suy luận ngôn ngữ * tự nhiên *,也就是典型人类读者会推断的内容,而不是严格逻辑──"John đi bộ với con chó của mình" trong NLI có nghĩa là "John có con chó", nhưng một giai đoạn nghiêm ngặt của logic chỉ có thể thừa nhận điều này sau khi bạn nắm giữ liên quan đến công nhận.

**Datasets。**

- **SNLI**(2015)。570k 人工标注 cặp,以图像标题 作为前提──领域较窄──
- **MultiNLI**(2017)──跨 10 个类的 433k cặp──2026 年的标准培训 corpus──
- **ANLI**(2019) ――NLI đối lập──人类专门编写 để đánh bại các mô hình hiện có──更难──
- **DocNLI, ConTRoL**(202021) ・Document-length premises──测试 đa hop 和 long-range inference──

**架构。**Một bộ mã hóa biến thể ((BERT, RoBERTa, DeBERTa) 读取 `[CLS] premise [SEP] hypothesis [SEP]``[CLS]`đại diện 输入到 3-way softmax──在 MNLI 上训练,在持久的基准上评估,在在分发对上获得90%+精度──

**通过 NLI 做 zero-shot。**给定一个文件 和候选标签,把每个标签 转成一个假设("Đây là một bài viết về thể thao")`zero-shot-classification`Hệ thống sau đường ống


```figure
nli-router
```

##  xây dựng nó

### 步骤 1: 运行 một mô hình NLI được đào tạo trước

```python
from transformers import pipeline

nli = pipeline("text-classification",
               model="facebook/bart-large-mnli",
               top_k=None)  # return all labels; replaces deprecated return_all_scores=True

premise = "The cat is sleeping on the couch."
hypothesis = "There is a cat in the room."

result = nli({"text": premise, "text_pair": hypothesis})[0]
print(result)
# [{'label': 'entailment', 'score': 0.97},
#  {'label': 'neutral', 'score': 0.02},
#  {'label': 'contradiction', 'score': 0.01}]
```

Đối với các NLI cấp sản xuất,`facebook/bart-large-mnli`和 `microsoft/deberta-v3-large-mnli`Đó là một trong những điều đáng chú ý nhất trong cuộc đời của chúng ta.

### 步骤 2:Tân loại không bắn

```python
zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

text = "The stock market rallied after the central bank cut interest rates."
labels = ["finance", "sports", "politics", "technology"]

result = zs(text, candidate_labels=labels)
print(result)
# {'labels': ['finance', 'politics', 'technology', 'sports'],
#  'scores': [0.92, 0.05, 0.02, 0.01]}
```

默认 template 是 "Tại ví dụ này là về {label}."―可用 `hypothesis_template`Bản thân định nghĩa: Không cần dữ liệu đào tạo: Không cần điều chỉnh:

### 步骤 3: Kiểm tra độ trung thành của RAG

```python
def is_faithful(answer, context, threshold=0.5):
    result = nli({"text": context, "text_pair": answer})[0]
    entail = next(s for s in result if s["label"] == "entailment")
    return entail["score"] > threshold
```

Đây là cốt lõi của sự trung thành của RAGAS. Câu trả lời được tạo ra sẽ được chia thành các yêu cầu nguyên tử.

### 步骤 4: 手写 NLI classifier (tài liệu phân loại NLI)

查看 `code/main.py`Trung chỉ sử dụng toy stdlib của:premise 和 giả thuyết  thông qua sự chồng chéo từ ngữ + phát hiện phủ nhận 进行比较──它无法与变压器模型 竞争,但显示任务的形状:输入两段文本,输出三向标签,损失 = `{entail, contradict, neutral}`- Tăng độ thâm nhập.

## 陷

- **Hypothesis-only shortcuts.**Các mô hình chỉ xem giả thuyết về việc có thể ghi nhận tỷ lệ xác thực trên SNLI với khoảng 60% của nhãn dự đoán, bởi vì "không", "không ai", "không bao giờ" có liên quan đến mâu thuẫn.
- **Lexical overlap heuristic.**() có thể thông qua SNLI, nhưng sẽ ở HANS/ANLI 上失败──使用对立基准──
- **Document-length degradation.**Mô hình NLI đơn câu trong các cơ sở dài tài liệu 上会下降 20+ F1──长上下文应使用 DocNLI-trained models──
- **Zero-shot template sensitivity.**" ví dụ này là về {label}"、"{label}"、" "Món đề là {label}" 之间可能导致精度 波动 10+ điểm。需要调优模板。
- **Domain mismatch.**MNLI trong tập luyện trên tiếng Anh phổ biến. Luật, y tế và khoa học cần mô hình NLI chuyên dụng trong lĩnh vực này.

## Sử dụng nó

2026:

| Use case | Model |
|---------|-------|
| 通用 NLI | `microsoft/deberta-v3-large-mnli` |
| 快速 / edge | `cross-encoder/nli-deberta-v3-base` |
| Zero-shot classification（轻量） | `facebook/bart-large-mnli` |
| Document-level NLI | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Multilingual | `MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli` |
| RAG 中的 hallucination detection | RAGAS / DeepEval 内部的 NLI layer |

Phương pháp meta năm 2026: NLI là văn bản hiểu biết của万能──只要你需要判断 A是否支持 B?或 A是否矛盾 B?在发起另一个LLM call 之前,先考虑 NLI──

## 交付 nó

保存为 `outputs/skill-nli-picker.md`- Có thể là:

```markdown
---
name: nli-picker
description: Pick an NLI model, label template, and evaluation setup for a classification / faithfulness / zero-shot task.
version: 1.0.0
phase: 5
lesson: 21
tags: [nlp, nli, zero-shot]
---

Given a use case (faithfulness check, zero-shot classification, document-level inference), output:

1. Model. Named NLI checkpoint. Reason tied to domain, length, language.
2. Template (if zero-shot). Verbalization pattern. Example.
3. Threshold. Entailment cutoff for the decision rule. Reason based on calibration.
4. Evaluation. Accuracy on held-out labeled set, hypothesis-only baseline, adversarial subset.

Refuse to ship zero-shot classification without a 100-example labeled sanity check. Refuse to use a sentence-level NLI model on document-length premises. Flag any claim that NLI solves hallucination — it reduces it; it does not eliminate it.
```

## 练习

1. **Easy.**Trong 20 个手写的(những tiền đề, giả thuyết, nhãn)`facebook/bart-large-mnli`,覆盖所有三类──测量精度──加入对立的"次序观念"陷("Tôi không ăn bánh" vs "Tôi ăn bánh"),看看它是否会失效──
2. **Medium.**Trong 100 条 AG News tiêu đề 上比较零射模板 `"This text is about {label}"``"The topic is {label}"`和 `"{label}"`❖ báo cáo độ chính xác swing。
3. **Hard.**构建一个RAG trung thực kiểm tra:atomic-claim decomposition + mỗi yêu cầu làm NLI。 trong 50 个带黄金背景的RAG-generated answers 上评估──测量对人工标签的错正和错负率──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| NLI | Natural Language Inference | premise-hypothesis 关系的 3-way classification。 |
| RTE | Recognizing Textual Entailment | NLI 的旧名称；同一任务。 |
| Entailment | "t implies h" | 给定 t，典型读者会得出 h 为真的结论。 |
| Contradiction | "t rules out h" | 给定 t，典型读者会得出 h 为假的结论。 |
| Neutral | "undecided" | 从 t 到 h 双向都无法推断。 |
| Zero-shot classification | NLI as classifier | 把 labels verbalize 成 hypotheses，选择最大 entailment。 |
| Faithfulness | 答案是否有支持？ | 在（retrieved context, generated answer）上做 NLI。 |

## 延伸阅读
- [Bowman et al. (2015). A large annotated corpus for learning natural language inference](https://arxiv.org/abs/1508.05326) SNLI。
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) MultiNLI。
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) Định nghĩa chuẩn ANLI。
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) NLI-as-classifier。
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654) NLI 主力──2026 năm
