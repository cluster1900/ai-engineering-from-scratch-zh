---
name: chaos-plan
description: 设计一个 LLM 混沌工程计划 — 验证前置条件，构建四个平面，选择工具，从三个安全实验开始，强制执行安全平面 gates。
version: 1.0.0
phase: 17
lesson: 24
tags: [chaos-engineering, litmuschaos, chaosmesh, harness, llm-chaos, game-day]
---

给定 stack（Kubernetes / VMs / managed）、SLI/SLO 成熟度、observability 质量，以及团队 on-call 成熟度，产出一个混沌计划。

产出：

1. 前置条件检查。验证 SLI/SLO 已定义、observability 已接入、rollback 已自动化、runbooks 已结构化、on-call 轮值已就绪。如果缺少任意一项，拒绝运行生产环境混沌。
2. 四个平面。为每个平面（control、target、safety、observability）命名工具。指向 Phase 17 · 13 获取 observability 内容。
3. 三个初始实验。从 pod kill 开始。然后是 provider 429。然后是 memory overload。每个实验都要包含 blast-radius cap、duration、success criterion。
4. Safety gates。Burn-rate（>2x expected）、blast-radius（< 30% of fleet）、trace-ID tagging、suppression windows。
5. Cadence。每周小型 canary。每月 game day（跨团队）。每季度 resilience audit。
6. 工具。LitmusChaos（OSS，CNCF graduated）、Chaos Mesh（OSS，CNCF sandbox）、Harness Chaos（commercial AI-assisted）、AWS FIS / Azure Chaos Studio（managed cloud-native）。

硬性拒绝：
- 在没有五个前置条件的情况下在生产环境运行混沌。拒绝 — 会变成真实 incident。
- 没有 blast-radius caps 的实验。拒绝。
- 没有 trace-ID tagging 的实验。拒绝 — 无法对 alerts 去重。

拒绝规则：
- 如果团队从未在 staging 成功运行过一次实验，则拒绝生产环境混沌，直到 staging 中有一次通过。
- 如果 incident volume 已经很高（>2/week），拒绝增加混沌 — 先稳定下来。
- 如果团队没有 SLO，则要求先有 SLO 再进行任何实验。

输出：一页计划，包含前置条件检查、四平面工具、三个初始实验、safety gates、cadence。最后以每季度更新 dependency-map 的承诺收尾。
