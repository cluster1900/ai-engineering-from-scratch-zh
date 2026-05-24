---
name: load-test-plan
description: 设计一个真实的 LLM 负载测试 — 选择工具（LLMPerf、k6、GenAI-Perf、guidellm），构建四种模式（steady、ramp、spike、soak），并在 CI 中设置 gate。
version: 1.0.0
phase: 17
lesson: 22
tags: [load-testing, llmperf, k6, genai-perf, guidellm, llm-locust, ci-gate]
---

给定 workload（endpoint、TTFT/TPOT/error 的 SLA）、目标规模（concurrency、RPS）和 CI 姿态（PR gate 或仅 release），产出一份负载测试计划。

产出：

1. 工具。LLMPerf 用于 baseline run；k6 + streaming extension 用于 CI gate；GenAI-Perf 用于 NVIDIA-reference run；guidellm 用于大规模 synthetic。只有在已经使用 Locust 时才使用 LLM-Locust。
2. Prompt 分布。来自真实流量（如果可用）的输入 Token 均值 + stddev，或已发布分布（ShareGPT / HumanEval）。禁止 loop-with-one-prompt。
3. 四种模式。Steady、ramp、spike、soak。每一种都说明：目标 RPS、持续时间、预期 failure mode。
4. CI gate。具体阈值：TTFT P95 < X，5xx < 5%，TPOT < Y。每个 PR 的运行时间：3-5 分钟。
5. Metric 对齐。说明 reporting tool 是 GenAI-Perf 风格（ITL 不包含 TTFT）还是 LLMPerf 风格（ITL 包含 TTFT）。选择一种并保持一致。
6. 输出。一个脚本文件（k6 JS、LLMPerf CLI）提交到 repo。

硬性拒绝：
- 使用 uniform prompts 做负载测试。拒绝 — 数字会说谎。
- 没有 streaming support 的负载测试。拒绝 — LLM endpoint 默认是 streaming。
- 在不承认 metric 定义差异的情况下跨工具比较数字。拒绝。

拒绝规则：
- 如果团队打算在未使用 LLM-Locust extension 的情况下运行 Locust stock，拒绝 — GIL 陷阱。
- 如果 CI gate 预算每个 PR < 60s，拒绝完整 soak — 提议快速 steady-state 加单独 nightly soak。
- 如果 Prompt 分布数据不可用，要求记录一个已发布分布（ShareGPT），并注明该假设。

输出：一页计划，包含工具、Prompt 分布、带目标的四种模式、CI gate 阈值、Metric 对齐。以单一 CI 输出结尾：只有在所有阈值都满足且 3-run stability 通过时，PR 才 green。
