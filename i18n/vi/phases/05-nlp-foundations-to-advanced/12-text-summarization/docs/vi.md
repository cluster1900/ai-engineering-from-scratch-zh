# Kết luận về văn bản

> Extractive 系统告诉你文档说了什么――Abstractive 系统告诉你作者想表达什么―― nhiệm vụ khác,陷也不同――

**类型：**Xây dựng
**语言：**Python
**先修：**Giai đoạn 5 · 02 (BoW + TF-IDF), Giai đoạn 5 · 11 (Tạm dịch máy)
**时间：**~ 75 phút

## 问题

Một bài báo 2.000 từ trong bài viết của bạn vào nguồn cấp dữ liệu của bạn. Bạn cần sử dụng 120 từ nắm bắt cốt lõi của nó. Bạn có thể chọn từ trong bài viết ba câu quan trọng nhất.

Kết luận chiết xuất là một vấn đề sắp xếp.`k`个──输出总是语法正确, vì nó là từ từ gốc.

Kết luận trừu tượng là một vấn đề tạo ra. Một biến thể trong điều kiện nhập tạo ra văn bản mới.

本课会构建两者,并展示各自固有的失败模式──

## 概念

![Extractive TextRank vs abstractive transformer](../assets/summarization.svg)

**Extractive。**将文章视为一个图, trong đó các nút là câu, cạnh là sự tương đồng.**TextRank**(Mihalcea và Tarau, 2004):

**Abstractive。**Trong các cặp tài liệu-summary 上 fine-tune 一个变体编码-decoder(BART、T5、Pegasus)  在推断时,model 读取文档,并通过横断注意 逐代币 生成摘要──Pegasus 尤其使用空隙句预训目标,使它在不需要太多的细节调整的情况下非常适合总结──

Sử dụng **ROUGE**(Remember-Oriented Understudy for Gisting Evaluation) 评估──ROUGE-1 和 ROUGE-2 衡量 unigram 和 bigram chồng chéo──ROUGE-L 衡量最长的常见次序──越高越好,但40 ROUGE-L 算好,50 算例外──每篇论文都会报告这三项──使用 `rouge-score`gói 


```figure
summarize-collapse
```

## 构建

### 步骤 1: TextRank(tài trừu tượng)

```python
import math
import re
from collections import Counter


def sentence_split(text):
    return re.split(r"(?<=[.!?])\s+", text.strip())


def similarity(s1, s2):
    w1 = Counter(s1.lower().split())
    w2 = Counter(s2.lower().split())
    intersection = sum((w1 & w2).values())
    denom = math.log(len(w1) + 1) + math.log(len(w2) + 1)
    if denom == 0:
        return 0.0
    return intersection / denom


def textrank(text, top_k=3, damping=0.85, iterations=50, epsilon=1e-4):
    sentences = sentence_split(text)
    n = len(sentences)
    if n <= top_k:
        return sentences

    sim = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                sim[i][j] = similarity(sentences[i], sentences[j])

    scores = [1.0] * n
    for _ in range(iterations):
        new_scores = [1 - damping] * n
        for i in range(n):
            total_out = sum(sim[i]) or 1e-9
            for j in range(n):
                if sim[i][j] > 0:
                    new_scores[j] += damping * sim[i][j] / total_out * scores[i]
        if max(abs(s - ns) for s, ns in zip(scores, new_scores)) < epsilon:
            scores = new_scores
            break
        scores = new_scores

    ranked = sorted(range(n), key=lambda k: scores[k], reverse=True)[:top_k]
    ranked.sort()
    return [sentences[i] for i in ranked]
```

Có hai điều đáng để ghi tên. Phương thức tương đồng sử dụng log-normalized word overlap, đó là nguyên bản TextRank 变体──TF-IDF vectors có cùng có thể đi.

### 步骤 2: Sử dụng BART làm trừu tượng

```python
from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

article = """(long news article text)"""

summary = summarizer(article, max_length=120, min_length=60, do_sample=False)
print(summary[0]["summary_text"])
```

BART-big-CNN trên CNN/DailyMail corpus 上 tinh chỉnh. Nó mở hộp即可生成新闻类摘要. Đối với các lĩnh vực khác, các bài báo khoa học, đối thoại, pháp lý, sử dụng đối ứng với điểm kiểm soát Pegasus, hoặc trên dữ liệu mục tiêu của bạn.

### 步骤 3: Đánh giá ROUGE

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
scores = scorer.score(reference_summary, generated_summary)
print({k: round(v.fmeasure, 3) for k, v in scores.items()})
```

始终使用 stemming──否则, "running" 和 "run" 会被算作不同词,ROUGE 会低估──

### ROUGE 之外(2026 tổng kết eval)

Trong hai thập kỷ qua, ROUGE luôn là một số liệu tổng hợp chủ đạo, nhưng vào năm 2026 nó đã không đủ. Một phân tích siêu quy mô lớn về các bài báo NLG cho thấy:

- **BERTScore**(như tương đồng nội dung ngữ cảnh) trong năm 2023 trước sau tiếp tục được áp dụng, hiện hầu hết các bài báo tóm tắt 会与 ROUGE 一起报告──
- **BARTScore**Để đánh giá 视为世代: Theo BART được đào tạo trước, có khả năng đưa ra một bản tóm tắt trong một nguồn nhất định.
- **MoverScore**(nhà nội dung ngữ cảnh trên khoảng cách của người di chuyển Trái đất) đạt vị trí thứ nhất trong các tiêu chuẩn tổng hợp năm 2025, vì nó tốt hơn so với ROUGE để nắm bắt sự chồng chéo ngữ học hơn.
- **FactCC**和 **QA-based faithfulness**Trong năm 2021-2023 rất thường thấy, hiện thường bị **G-Eval**替代(1 chuỗi động lực GPT-4, thông qua lý luận chuỗi suy nghĩ đối với sự liên kết, nhất quán, tính chất, liên quan 打分)
- **G-Eval**Và giống như LLM-phán tòa  phương pháp trong lĩnh vực  thiết kế tốt, có khoảng 80% đồng ý với phán quyết của con người.

Lời khuyên sản xuất: báo cáo ROUGE-L dùng để so sánh truyền thống, BERTScore dùng để chồng chéo ngữ học, G-Eval dùng để phù hợp và thực tế.

### 步骤 4: thực tế 问题

Kết luận trừu tượng dễ bị ảo giác. Sự ảo giác của kết luận trừu tượng có nguy cơ thấp hơn nhiều, vì xuất phát là từ từ từ từ trong nguồn, mặc dù nếu các nguồn được đưa lên văn hóa dưới, quá khứ, hoặc trích dẫn theo thứ tự sai lầm, chúng vẫn có thể sai lầm. Đây là nguyên nhân chính của các hệ thống sản xuất vẫn được chọn lựa các phương pháp trừu tượng trong nội dung tuân thủ.

需要点名的幻觉 类型:

- **Entity swap。**Nguồn 写 là "John Smith".
- **Number drift。**Nguồn 写 là "25,000. " Tổng kết 写成 "25 triệu. "
- **Polarity flip。**Nguồn 写 là "đã từ chối lời đề nghị".
- **Fact invention。**Nguồn không đề cập đến CEO.

Phương pháp đánh giá hiệu quả:

- **FactCC。**Một phân loại nhị phân, tập luyện mục tiêu là liên quan giữa câu nguồn và câu tóm tắt 😇😇😇😇😇😇
- **QA-based factuality。**让QA mô hình 提出答案在源中问题──如果总结 支持不同答案,则标记──
- **Entity-level F1。**So sánh nguồn với các thực thể có tên trong bản tóm tắt.

Đối với bất kỳ đối diện nào với người dùng và thực tế  Nội dung quan trọng(news、medical、legal、financial),extractive is more secure of默认选择。Abstractive 需要加入在流程中的事实检查──

## 使用

2026:

| Use case | Recommended |
|---------|-------------|
| News, 3-5 sentence summary, English | `facebook/bart-large-cnn` |
| Scientific papers | `google/pegasus-pubmed` or a tuned T5 |
| Multi-document, long-form | Any LLM with 32k+ context, prompted |
| Dialog summarization | `philschmid/bart-large-cnn-samsum` |
| Extractive, low hallucination risk by construction | TextRank or `sumy`'s LSA / LexRank |

Khi tính toán không phải là hạn chế, LLM trong bối cảnh dài trong năm 2026 thường vượt qua các mô hình chuyên môn.

## 发布

保存为 `outputs/skill-summary-picker.md`- Có thể là:

```markdown
---
name: summary-picker
description: 选择 extractive 或 abstractive、指定 library、factuality check。
version: 1.0.0
phase: 5
lesson: 12
tags: [nlp, summarization]
---

给定一个任务（document type、compliance requirement、length、compute budget），输出：

1. Approach。Extractive 或 abstractive。用一句话解释原因。
2. Starting model / library。写出名称。`sumy.TextRankSummarizer`、`facebook/bart-large-cnn`、`google/pegasus-pubmed`，或一个 LLM prompt。
3. Evaluation plan。ROUGE-1、ROUGE-2、ROUGE-L（使用带 stemming 的 rouge-score）。如果是 abstractive，再加 factuality check。
4. 一个需要探查的 failure mode。Entity swap 是 abstractive news summarization 中最常见的问题；标记 source entities 未出现在 summary 中的 samples。

如果没有 factuality gate，则拒绝对 medical、legal、financial 或 regulated content 使用 abstractive summarization。将超过 model context window 的输入标记为需要 chunked map-reduce summarization（而不是简单 truncation）。
```

## 练习

1. **Easy。**Trong 5 bài báo trên bài viết trên các bài viết trên TextRank.
2. **Medium。**实现实体级事实性:从源和总结 中抽取命名实体(spaCy),计算源实体 在总结中的召回,以及总结实体 相对源的精度──高精度──低召回表示安全但简略;低精度表示幻觉实体──
3. **Hard。**Trong 50 bài báo trên CNN/DailyMail trên BART-chủ-CNN với một LLM (Claude hoặc GPT-4)  báo cáo ROUGE-L、 thực tế ( thông qua thực thể F1) và chi phí cho bản tóm tắt  ghi lại các trường hợp chiến thắng của riêng mình 

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Extractive | 选句子 | 从 source 中逐字返回句子。永不 hallucinate。 |
| Abstractive | 重写 | 在 source 条件下生成新文本。可能 hallucinate。 |
| ROUGE | Summary metric | system output 与 reference 之间的 N-gram / LCS overlap。 |
| TextRank | Graph-based extractive | sentence similarity graph 上的 PageRank。 |
| Factuality | 是否正确 | summary claims 是否由 source 支持。 |
| Hallucination | 编造内容 | summary 中 source 不支持的内容。 |

## 延伸阅读

- [Mihalcea and Tarau (2004). TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/) trích xuất 经典论文。
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training](https://arxiv.org/abs/1910.13461) BART 论文。
- [Zhang et al. (2019). PEGASUS: Pre-training with Extracted Gap-sentences](https://arxiv.org/abs/1912.08777) Pegasus 和 mục tiêu câu không có điểm số.
- [Lin (2004). ROUGE: A Package for Automatic Evaluation of Summaries](https://aclanthology.org/W04-1013/) BÁC HN ĐT
- [Maynez et al. (2020). On Faithfulness and Factuality in Abstractive Summarization](https://arxiv.org/abs/2005.00661) giấy thực tế cảnh quan
