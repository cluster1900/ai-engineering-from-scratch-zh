---
name: managed-platform-picker
description: 根据 workload、SLA 和 compliance requirements，选择一个托管 LLM 平台（Bedrock, Azure OpenAI, Vertex AI）以及第二个平台用于 redundancy，然后生成 FinOps instrumentation plan。
version: 1.0.0
phase: 17
lesson: 01
tags: [bedrock, azure-openai, vertex-ai, ptu, finops, managed-platforms]
---

给定一个 workload profile（required models、monthly tokens、TTFT SLA at P50/P99、compliance constraints、existing cloud footprint），生成平台推荐。

生成：

1. Primary platform。说明平台名称、它覆盖的具体模型，以及根据 utilization 判断应使用 on-demand 还是 Provisioned Throughput Units (PTUs) / Provisioned Throughput。引用 break-even math（PTU 大约在 40-60% sustained utilization）。
2. Secondary platform。说明 two-provider-minimum fallback。论证这个组合 — redundancy 必须覆盖模型重叠（Claude on Bedrock + GPT on Azure OpenAI 是常见组合）和 region 重叠。
3. FinOps instrumentation。指定 day one 要启用什么：Bedrock Application Inference Profiles、Azure scopes + PTU reservations as cost objects、Vertex project-per-team + BigQuery Billing Export。说明 attribution dimensions — per-user、per-task、per-tenant。
4. SLA check。把目标 TTFT P99 与公开 benchmarks 比较（Azure OpenAI PTU ≈ 50 ms P50；Bedrock on-demand ≈ 75 ms P50）。如果 SLA 比 on-demand 能交付的更严格，要求使用 PTU。
5. Compliance check。按需验证 BAA、SOC 2 Type II、HIPAA、EU data residency。注明三者都满足 baseline，但 retention policies 和 abuse-monitoring opt-out 不同。
6. Migration pathway。说明团队本周可以采取的一个可逆步骤（例如，通过抽象 provider 的 AI gateway 部署；instrument attribution headers）和一个更长期步骤（PTU commitment；cross-region failover）。

Hard rejects:
- 推荐单一平台但没有命名 fallback。拒绝，并坚持 two-provider minimum。
- 在没有 utilization estimate 的情况下选择 PTU。拒绝，并请求 sustained utilization data。
- 当 attribution 被列为 requirement 时忽略 Bedrock Application Inference Profiles — 它们是最干净的原生界面。

Refusal rules:
- 如果 workload 要求 Claude、Gemini 和 GPT 全部作为 P0，说明三平台现实（Bedrock + Vertex + Azure OpenAI behind a gateway），而不是假装一个平台能服务全部三者。
- 如果 SLA 是 TTFT P99 < 100 ms，而预期 budget 无法支持 PTU，拒绝承诺该 SLA — 解释 on-demand variance ceiling。
- 如果客户要求“use the cheapest provider”，拒绝 — 价格是多维的（token rate + dedicated capacity + attribution overhead + lock-in cost）。

Output：一页决策，包含 primary platform、secondary platform、PTU vs on-demand、instrumentation list、SLA/compliance verification，以及两个 migration steps。最后给出一个能捕捉计划漂移的单一 metric（sustained utilization、PTU waste，或 attribution coverage）。
