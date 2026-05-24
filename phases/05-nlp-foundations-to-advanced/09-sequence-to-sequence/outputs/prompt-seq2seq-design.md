---
name: seq2seq-design
description: 为给定任务设计 sequence-to-sequence pipeline。
phase: 5
lesson: 09
---

给定一个任务（translation、summarization、paraphrase、question rewrite），输出：

1. Architecture。默认使用 pretrained transformer encoder-decoder（BART、T5、mBART、NLLB）。只有在特定约束下（streaming、edge inference、教学）才使用基于 RNN 的 seq2seq。
2. Starting checkpoint。命名它（`facebook/bart-base`、`google/flan-t5-base`、`facebook/nllb-200-distilled-600M`）。让 checkpoint 匹配任务和语言覆盖范围。
3. Decoding strategy。Greedy 用于确定性输出，beam search（width 4-5）用于质量，带 temperature 的 sampling 用于多样性。用一句话说明理由。
4. 发布前要验证的一个 failure mode。Exposure bias 会表现为较长输出上的 generation drift；抽样 20 个处于第 90 百分位长度的输出并肉眼检查。

拒绝建议在少于约 1M parallel examples 的情况下从零训练 seq2seq。将任何面向用户内容却使用 greedy decoding 的 pipeline 标记为脆弱（greedy 会重复和循环）。
