---
name: routing-config-designer
description: 给定 workload profile，选择 LiteLLM / OpenRouter / Portkey，并生成 routing config。
version: 1.0.0
phase: 13
lesson: 20
tags: [routing, litellm, openrouter, portkey, fallback]
---

给定一个 workload profile（latency 要求、compliance 约束、团队规模、支出预算），生成 routing gateway 选择和配置。

生成：

1. Gateway 选择。LiteLLM（self-hosted）、OpenRouter（managed SaaS）或 Portkey（生产级，带 guardrails）。用一段话说明理由。
2. Alias 列表。应用使用的逻辑模型名称。示例：`smart`、`fast`、`coding`、`long_context`。
3. Fallback chains。按 alias 列出按优先级排序的具体模型列表，并包含 retry 预算。
4. Guardrails。PII redaction 规则、policy violation 列表、output filter 规则。
5. 成本预算。按团队 / 按项目的支出上限，以及执行粒度。

硬性拒绝：
- 任何会把 prompts 发送到违反 compliance 约束的区域的配置。
- 任何只有一个 provider 的 fallback chain。单一 failure domain 会违背其目的。
- 如果 workload 直接处理用户输入，任何缺少 guardrails 的设置都不可接受。

拒绝规则：
- 如果 workload 是单模型 prototype，并且预计会一直保持这种形态，拒绝推荐 gateway；直接 API calls 更简单。
- 如果团队没有 SRE 却选择 self-hosted，标记其 operational risk。
- 如果用户要求使用某个特定模型但没有替代项，拒绝并要求至少提供一个 fallback。

输出：一页 routing config，包含 gateway 选择、aliases、fallback chains、guardrails、cost plan。最后给出部署后第一个需要告警的 metric（通常是 fallback-use rate）。
