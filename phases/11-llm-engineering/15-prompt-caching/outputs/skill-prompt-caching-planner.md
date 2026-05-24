---
name: prompt-caching-planner
description: 设计一种缓存友好的 prompt 布局，并选择正确的 provider 缓存模式。
version: 1.0.0
phase: 11
lesson: 15
tags: [llm-engineering, caching, cost]
---

给定一个 prompt（system + tools + few-shot + retrieval + history + user）和一个使用画像（每小时请求数、所需 TTL、provider），输出：

1. 布局。重新排序后的 sections，并标记一个 cache breakpoint；说明哪些 sections 是稳定的，哪些是易变的。
2. Provider 模式。Anthropic cache_control、OpenAI automatic，或 Gemini CachedContent。根据 TTL 和复用模式给出理由。
3. 盈亏平衡。TTL 内每次写入的预期读取次数；用数学计算说明相较无缓存的净成本。
4. 验证计划。CI 断言第二次相同请求的 cache_read_input_tokens > 0；dashboard 按 cached 与 uncached Token 拆分。
5. 失效模式。列出此设置中最可能导致缓存 miss 的三个原因（dynamic timestamp、tool reorder、near-duplicate text），以及你将如何防止每一种。

如果 cache plan 把 dynamic field 放在 breakpoint 上方，则拒绝发布。如果没有足够复用次数让 2x write premium 回本，则拒绝启用 1h TTL。
