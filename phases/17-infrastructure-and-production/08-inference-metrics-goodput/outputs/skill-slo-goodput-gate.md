---
name: slo-goodput-gate
description: 生成一个可用于 CI/CD 的 benchmark 方案，用 goodput 而不是 throughput 来门控 LLM 部署，并包含 P50/P90/P99 百分位数和已记录的工具选择。
version: 1.0.0
phase: 17
lesson: 08
tags: [inference-metrics, goodput, ttft, tpot, itl, slo, benchmarking]
---

给定一个 workload（model、hardware、目标 concurrency、面向用户的交互类型 — streaming chat / one-shot / voice / agent），生成一个基于 goodput 的 SLO gate，用于 CI/CD。

生成：

1. SLO spec。三个阈值：TTFT P99 上限、TPOT P99 上限、E2E P99 上限。根据交互类型选择可辩护的值（streaming chat：TTFT 500 ms、TPOT 25 ms、E2E 3 s；voice：TTFT 300 ms，更严格；agent：E2E 5 s，更宽松）。
2. Benchmark recipe。工具选择（LLMPerf 或 GenAI-Perf — 说明你选择哪一个以及原因）。Prompt 分布（输入和输出 Token 的 mean + stddev）。Concurrency sweep（目标的 25%、50%、100%、150%）。
3. Goodput 计算。公式：同时满足全部三个约束的请求占比。production 目标 >= 99%，canary 目标 >= 95%。
4. 百分位数报告。对每个 metric，报告 P50、P90、P99（绝不要只报告 mean）。mean 仅标注为 sanity check。
5. 工具陷阱说明。说明该工具在 ITL 中包含还是排除 TTFT。跨团队比较前先固定定义。
6. Gating 逻辑。若在目标 concurrency 下 goodput >= target，则 CI 通过。如果 goodput 在 100% 到 150% concurrency 之间下降超过 5 个百分点，则标记 — 这表明缺少 load-test headroom。

硬性拒绝：
- 只基于 throughput 做 gating。拒绝并要求使用 goodput。
- 报告 mean 但不报告 P99。拒绝。
- 省略工具名称和工具版本。拒绝。
- 只在目标 concurrency 下做 benchmarking；必须始终执行 sweep。

拒绝规则：
- 如果用户没有写下 SLO，拒绝，并先根据交互类型写一个。
- 如果 prompt 分布是“循环中的相同 prompts”，拒绝 — 这是 prompt-uniformity trap。要求使用真实的 synthetic。
- 如果 benchmark 少于 30 次 run，或每次 run 少于 100 个 request，则以统计不足为由拒绝。

输出：一页 SLO gate spec，列出阈值、benchmark recipe、工具选择、百分位数报告模板，以及 CI pass/fail 规则。最后用一个“接下来测量什么”的段落收尾，根据已知弱点，在 goodput vs concurrency curve、prompt-distribution sensitivity 或 chunked-prefill on/off tail comparison 中点名一个。
