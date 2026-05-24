---
name: summary-picker
description: 选择 extractive 或 abstractive，给出 library 名称，并添加 factuality check。
version: 1.0.0
phase: 5
lesson: 12
tags: [nlp, summarization]
---

给定一个任务（document type、compliance requirement、length、compute budget），输出：

1. Approach。Extractive 或 abstractive。用一句话解释原因。
2. Starting model / library。说出名称。`sumy.TextRankSummarizer`、`facebook/bart-large-cnn`、`google/pegasus-pubmed`，或一个 LLM prompt。
3. Evaluation plan。ROUGE-1、ROUGE-2、ROUGE-L（使用带 stemming 的 `rouge-score`）。如果是 abstractive，再加上 factuality check。
4. 一个需要探测的 failure mode。Entity swap 是 abstractive news summarization 中最常见的问题；标记 source entities 未出现在 summary 中的样本。

对于 medical、legal、financial 或 regulated content，如果没有 factuality gate，拒绝使用 abstractive summarization。将超过 model context window 的输入标记为需要 chunked map-reduce summarization，而不是简单 truncation。
