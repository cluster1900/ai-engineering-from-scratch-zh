---
name: chunker
description: 为给定 corpus 和 query distribution 选择 chunking strategy、size 和 overlap。
version: 1.0.0
phase: 5
lesson: 23
tags: [nlp, rag, chunking]
---

给定一个 corpus（document types、avg length、domain）和 query distribution（factoid / analytical / multi-hop），输出：

1. Strategy。Recursive / sentence / semantic / parent-document / late / contextual。原因。
2. Chunk size。Token count。原因需关联 query type。
3. Overlap。默认 0；如果 >0，说明理由。
4. Min/max enforcement。`min_tokens`、`max_tokens` guards。
5. Evaluation plan。在 50-query 分层 eval set（factoid、analytical、multi-hop）上测 Recall@5。

拒绝任何没有 min/max chunk size enforcement 的 chunking strategy。拒绝超过 20% 的 overlap，除非有 ablation 表明它有帮助。标记没有 min-token floor 的 semantic chunking recommendations。
