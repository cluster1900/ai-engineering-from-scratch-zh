# 文本总结

> 抽象的系统告诉你作者想表达什么.任务不同,陷也不同.

**类型：**建立
**语言：**字符串
**先修：**阶段 5 · 02 (BoW + TF-IDF),阶段 5 · 11 (机器翻译)
**时间：**七十五分钟

## 问题

一篇2000字的新闻文章进入你的料――你需要用120字抓住它的核心――你可以从文章中选出三个最重要的句子――抽象的,也可以用自己的话重写内容――抽象的――二者都叫做总结――它们是完全不同的问题――

摘要是一个排序问题.给每个句子打分,返回前.`k`个──输出总是语法正确的,因为它是从原本中逐字提取的──风险在于遗漏分散在全文各处的内容──

抽象总结是一个生成问题.一个变压器在输入条件下生成新文本.输出流且压缩度高,但可能会产生幻觉.

本课会构建两者,并展示各自固有的失败模式.

## 概念

![Extractive TextRank vs abstractive transformer](../assets/summarization.svg)

**Extractive。**将文章视为一个图,其中节点是句子,边缘是相似性.**TextRank**们的生活方式

**Abstractive。**在文件-摘要对上细调 一个变压器编码器-解码器(BART、T5、Pegasus) ⋅在推断时,模型 读取文档,并通过交叉注意 逐个代币 生成摘要──Pegasus 尤其使用空白句子预训目标,使它在不需要太多细调的情况下非常适合摘要──

使用 **ROUGE**评估――ROUGE-1 和 ROUGE-2 衡量单数和大数重叠――ROUGE-L 衡量最长的常见次数――越高越好,但40 ROUGE-L 算好,50 算异常──每篇论文都会报告这三项──使用 `rouge-score`包装


```figure
summarize-collapse
```

## 构建

### 步骤 1: 文字Rank(抽取)

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

有两件事值得点名――类似性函数 使用日志正常化词的重叠,这是原始的 TextRank 变体――TF-IDF向量的代数也可行――减缓因子 0.85 和反复数是 PageRank 的默认值――

### 步骤2: 使用BART做抽象

```python
from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

article = """(long news article text)"""

summary = summarizer(article, max_length=120, min_length=60, do_sample=False)
print(summary[0]["summary_text"])
```

对于其他领域的科学论文,对话,法律),使用应对的佩加斯检查站,或在你的目标数据上进行细节调整.

### 步骤3: ROUGE 评估

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
scores = scorer.score(reference_summary, generated_summary)
print({k: round(v.fmeasure, 3) for k, v in scores.items()})
```

始终使用 stemming──否则,"running" 和 "run" 会被算作不同词,ROUGE 会低估──

### 红色 之外(2026年总结评估)

过去20年,ROUGE一直是主导的总结指标,但在2026年,它单独使用已经不够.

- **BERTScore**现在大多数总结论文会与ROUGE 一起报告.
- **BARTScore**将评估视为代:根据预先训练的BART 在给定来源 时赋予总结的可能性 来打分.
- **MoverScore**(上层地球移动距离的背景嵌入) 在2025年总结基准中达到第一位,因为它比红色更好地捕捉了语义重叠.
- **FactCC**和 **QA-based faithfulness**在2021-2023年很常见,现在经常被被**G-Eval**替代一个GPT-4提示链,通过连锁思维推理对一致性,一致性,流动性,相关性打分) 
- **G-Eval**在设计良好时,与人类判断的80%是相似的.

制作建议:报告 ROUGE-L 用于传统的比较,BERTScore 用于语义重叠,G-Eval 用于一致性和事实性──用50-100条人标签的摘要做校准──

### 步骤4:事实性 问题

抽象摘要容易出现幻觉. 抽象摘要的幻觉风险较低,因为输出是逐字从源文中提取的,尽管如果源句被上传下文化过时,或引用顺序错误,它们仍然可能误导.

需要点名的幻觉类型:

- **Entity swap。**来源是"约翰·史密斯". 摘要是"约翰·布朗".
- **Number drift。**来源是"25万". 总结是"25万".
- **Polarity flip。**写成"拒绝了报价".总结写成"接受了报价.
- **Fact invention。**消息来源没有提到CEO.总结说CEO批准了.

有效的评估方法:

- **FactCC。**一个二进制分类器,训练目标是源句与总结句之间的关系――预测事实/非事实――
- **QA-based factuality。**让QA模型提出答案在源中问题.
- **Entity-level F1。**与总结中命名实体相比.

对于任何面向用户和事实 重要内容(新闻,医学,法律,金融),抽取是更安全的默认选择――抽象需要加入事实检查过程中――

## 使用

根据第1个单元的规定,

| Use case | Recommended |
|---------|-------------|
| News, 3-5 sentence summary, English | `facebook/bart-large-cnn` |
| Scientific papers | `google/pegasus-pubmed` or a tuned T5 |
| Multi-document, long-form | Any LLM with 32k+ context, prompted |
| Dialog summarization | `philschmid/bart-large-cnn-samsum` |
| Extractive, low hallucination risk by construction | TextRank or `sumy`'s LSA / LexRank |

长文本 LLM 在2026年通常胜过专业模型.

## 发布

保存为`outputs/skill-summary-picker.md`其他:

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

1. **Easy。**在 5 篇新闻文章上运行 TextRank──将前3句与参考摘要比较──测量ROUGE-L──你应该能在CNN/DailyMail类型的文章上看 30-45ROUGE-L──
2. **Medium。**实现实体级事实性:从源和总结中抽取命名实体(太空),计算源实体在总结中召回,以及总结实体相对源的精度──高精度──低精度表示安全但简略;低精度表示幻觉实体──
3. **Hard。**在 50篇CNN/DailyMail文章上比较BART-大CNN与一个LLM (Claude或GPT-4) 报告 ROUGE-L、事实性(通过实体F1) 和成本总结的情况──记录各自的胜利场景──

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

- [Mihalcea and Tarau (2004). TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/)提取 经典论文──
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training](https://arxiv.org/abs/1910.13461) BART 论文──
- [Zhang et al. (2019). PEGASUS: Pre-training with Extracted Gap-sentences](https://arxiv.org/abs/1912.08777)   和 语的目标
- [Lin (2004). ROUGE: A Package for Automatic Evaluation of Summaries](https://aclanthology.org/W04-1013/)红色纸
- [Maynez et al. (2020). On Faithfulness and Factuality in Abstractive Summarization](https://arxiv.org/abs/2005.00661)事实性景观论文──
