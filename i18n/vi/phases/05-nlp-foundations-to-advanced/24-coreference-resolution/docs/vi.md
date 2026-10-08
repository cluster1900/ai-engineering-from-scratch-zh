# Nghị quyết về sự liên kết

> 她打电话给他──他没有接──医生在吃午饭── 三个参考,指向两个人,而且没有人被点名──Coreference Resolution 会弄清楚谁是谁──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 07 (POS & Parsing)
**Time:** ~60 分钟

## 问题
Từ một bài viết 300 từ trong bài viết rút ra từng đề cập của Apple Inc. 文章写 Apple 时很简单。 viết thành the company、the、Cupertino's technology giant hoặc Jobs's firm 时就很难── Nếu không phân tích những đề cập này 解析 thành một thực thể, đường ống NER của bạn sẽ bỏ lỡ 60-80% đề cập ‖

Coreference Resolution sẽ đưa tất cả các chỉ dẫn về một thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế thực tế và thực tế.

Tại sao nó quan trọng vào năm 2026:

- Tổng kết: CEO công bố... vs Tim Cook công bố...  tổng kết 应该说出 CEO 的名字──
- Câu trả lời:  Cô ấy gọi ai?  需要解析 她──
- Thu thập thông tin: một biểu đồ kiến thức 里同时 có PER1 thành lập Apple 和 Jobs thành lập Apple 作为不同条目,这是错的──
- Multi-document IE:合并多篇关于同一事件文章中的提到,就是跨文档核心参考──

## 概念
![Coreference clustering: mentions → entities](../assets/coref.svg)

**The task.**输入: một tài liệu. 输出:mention(span) của cluster, trong đó mỗi cluster chỉ ra một thực thể.

**Mention types.**

- **Named entity.**Tim Cook
- **Nominal.**CEO công ty 
- **Pronominal.**he, she, they, it
- **Appositive.**Tim Cook, CEO của Apple,

**Architectures.**

1. **Rule-based (Hobbs, 1978).**基于语法树的代词解析度,使用语法规则──很好的基线──在代词上意外地难以超越──
2. **Mention-pair classifier.**Đối với mỗi đối tượng đề cập, dự đoán xem chúng có phải là trọng tâm hơn không.
3. **Mention-ranking.**Đối với mỗi đề cập, 排序候选 tiền nhiệm (include no antecedent) 选择最高分──
4. **Span-based end-to-end (Lee et al., 2017).**Transformer encoder──枚举所有长度上限内的候选 span──预测提到分点──为每 span 预测前例-概率──贪心聚类──现代默认方案──
5. **Generative (2024+).**Prompt 一个 LLM:Dọn danh từ trong văn bản này và tiền thân của nó. 在简单案例上效果不错,但在长文档和少见引用 上会吃力。

**The evaluation metrics.**Có 5 chỉ số tiêu chuẩn (MUC、B3、CEAF、BLANC、LEA), vì không có chỉ số đơn lẻ có thể nắm bắt đầy đủ chất lượng 质量── báo cáo trước ba của trung bình như CoNLL F1──2026 năm CoNLL-2012 trên trạng thái hiện đại: khoảng 83 F1──

**Known hard cases.**

- mô tả xác định 指向数页前引入的实体──
- Đường nối anphorađường xe → 之前提到一辆车)。
- Trung文、日文等语言中的零解法──
- Cataphora ((người xuất hiện trong giới thiệu 之前):When **she**bước vào, Mary mỉm cười.


```figure
coref-links
```

##  xây dựng nó
### 步骤 1: Coreference thần kinh được đào tạo trước (AllenNLP / spaCy-xử nghiệm)

```python
import spacy
nlp = spacy.load("en_coreference_web_trf")   # experimental model
doc = nlp("Apple announced new products. The company said they would ship soon.")
for cluster in doc._.coref_clusters:
    print(cluster, "->", [m.text for m in cluster])
```

Trong tài liệu dài hơn, bạn sẽ nhận được kết quả tương tự:
- Nhóm 1: [Apple, Công ty, họ]
- Nhóm 2: [Sản phẩm mới]

### 步骤 2: giải quyết ngụ ngôn dựa trên quy tắc (đọc)

查看 `code/main.py`Trung chỉ sử dụng stdlib của thực hiện:

1. 抽取 đề cập: tên các thực thể (xơ) 
2. Đối với mỗi ngụ ngôn, xem trước K 个 đề cập,并按以下因素打分:
   - Thỏa thuận giới tính/ số lượng (heuristic)
   - gần đây hơn
   - vai trò tổng hợp (→ chủ đề ưu tiên)
3. 链接最高分 tiền nhiệm

Nó không thể cạnh tranh với các mô hình thần kinh, nhưng nó cho thấy không gian tìm kiếm, cũng như mô hình đầu đến cuối phải đưa ra quyết định.

### Bước 3: Sử dụng LLM

```python
prompt = f"""Text: {text}

List every pronoun and noun phrase that refers to a person or company.
Cluster them by what they refer to. Output JSON:
[{{"entity": "Apple", "mentions": ["Apple", "the company", "it"]}}, ...]
"""
```

需要注意两种失败模式――第一,LLMs 会过度合并(把指向两个不同人的him和her合并)――第二,LLMs 会在长文档中漏掉提到――始终使用跨度抵消检查验证――

### Bước 4: đánh giá

标准 conll-2012 kịch bản 会计算 MUC、B3、CEAF-φ4,并报告平均值── đối với các đánh giá nội bộ,先在带标注的测试集 上做跨度级精度和回忆,再加入提到链接 F1──

## 陷
- **Singleton explosion.**Một số hệ thống sẽ đưa mỗi đề cập đều báo cáo thành cụm riêng của mình.
- **Pronouns in long context.**Ưu điểm của hơn 2.000 token Ưu điểm cao hơn 15 F1 ⋅ Chọn cẩn thận ⋅
- **Gender assumptions.**硬编码性别 quy tắc 会在非二进制参考,组织,动物 上失效;; sử dụng mô hình học hoặc điểm trung lập;;
- **LLM drift on long docs.**单次 API 调用不可靠地对 50+ 段落中的提到 聚类──使用滑窗+ merge──

## Sử dụng nó
2026 năm:

| Situation | Pick |
|-----------|------|
| English, single document | `en_coreference_web_trf` (spaCy-experimental) 或 AllenNLP neural coref |
| Multilingual | 在 OntoNotes 或 Multilingual CoNLL 上训练的 SpanBERT / XLM-R |
| Cross-document event coref | 专门的 end-to-end models（2025–26 SOTA） |
| Quick LLM baseline | 带 structured-output coref prompt 的 GPT-4o / Claude |
| Production dialog systems | Rule-based fallback + neural primary + critical slots 的 manual review |

2026 年能上线的集成模式:先运行 NER,再运行 coref,把 coref cluster 合并进 NER实体――下游任务看到的是每个集群一个实体,而不是每个提到一个实体――

## 交付 nó
保存为 `outputs/skill-coref-picker.md`- Có thể là:

```markdown
---
name: coref-picker
description: Pick a coreference approach, evaluation plan, and integration strategy.
version: 1.0.0
phase: 5
lesson: 24
tags: [nlp, coref, information-extraction]
---

Given a use case (single-doc / multi-doc, domain, language), output:

1. Approach. Rule-based / neural span-based / LLM-prompted / hybrid. One-sentence reason.
2. Model. Named checkpoint if neural.
3. Integration. Order of operations: tokenize → NER → coref → downstream task.
4. Evaluation. CoNLL F1 (MUC + B³ + CEAF-φ4 average) on held-out set + manual cluster review on 20 documents.

Refuse LLM-only coref for documents over 2,000 tokens without sliding-window merge. Refuse any pipeline that runs coref without a mention-level precision-recall report. Flag gender-heuristic systems deployed in demographically diverse text.
```

## 练习
1. **Easy.**Trong `code/main.py`Trung对 5 个手写段落运行 dựa trên quy tắc resolver── dùng thực tại cơ bản  đo độ chính xác của liên kết đề cập──
2. **Medium.**Trong một bài báo trên bài viết sử dụng mô hình lõi thần kinh được đào tạo trước.
3. **Hard.**Xây dựng một đường ống NER được cải thiện: trước NER, thông qua lại các tập hợp cốt lõi 合并──衡量 100 篇文章上

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mention | 一个 reference | 一段指向某个 entity 的文本（name、pronoun、noun phrase）。 |
| Antecedent | “it” 指向什么 | 后续 mention 与之 corefer 的更早 mention。 |
| Cluster | entity 的 mentions | 全部指向同一个真实世界 entity 的 mention 集合。 |
| Anaphora | 后向 reference | 后续 mention 指向更早内容（“he” → “John”）。 |
| Cataphora | 前向 reference | 更早 mention 指向后续内容（“When he arrived, John...”）。 |
| Bridging | 隐式 reference | “I bought a car. The wheels were bad.”（那辆 car 的 wheels。） |
| CoNLL F1 | leaderboard 上的数字 | MUC、B³、CEAF-φ4 F1 scores 的平均值。 |

## 延伸阅读
- [Jurafsky & Martin, SLP3 Ch. 26 — Coreference Resolution and Entity Linking](https://web.stanford.edu/~jurafsky/slp3/26.pdf) 经典教材章节。
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045) 基于 span 的端到端──
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) 改进 coref của đào tạo trước 
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/) điểm chuẩn。
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064) dựa trên quy tắc 经典方法──
