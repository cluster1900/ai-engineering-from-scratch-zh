# LLM Production 的 Chaos Engineering

> 到 2026 年，面向 LLMs 的 Chaos Engineering 已经成为一门独立实践。在 Production 中运行实验前的前置条件：已定义的 SLI/SLO、trace+metric+log observability、automated rollback、runbooks、on-call。Architecture 有四个 planes：control（experiment scheduler）、target（services、infra、data stores）、safety（guards + abort + traffic filters）、observability（metrics + traces + logs）、feedback（进入 SLO adjustments）。Guardrails 是强制要求：如果 daily error-budget burn > 预期的 2x，burn-rate alerts 会暂停实验；suppression windows + trace-ID correlation 会对 alert noise 去重。Cadence：每周小型 canary + SLO review；每月 game day + postmortem；每季度 cross-team resilience audit + dependency mapping。LLM-specific experiments：memory overload、network failures、provider outages、malformed prompts、KV cache eviction storms。Tooling：Harness Chaos Engineering（LLM-derived recommendations、blast-radius downscaling、MCP tool integration）；LitmusChaos（CNCF）；Chaos Mesh（CNCF Kubernetes-native）。

**类型：** 学习
**语言：** Python（stdlib，toy chaos experiment runner）
**前置条件：** Phase 17 · 23（SRE for AI），Phase 17 · 13（Observability）
**时间：** 约 60 分钟

## 学习目标

- 说出五个 Chaos Engineering 前置条件（SLI/SLO、observability、rollback、runbooks、on-call），并解释为什么跳过任何一个都会破坏这项实践。
- 画出四个 planes（control、target、safety、observability）以及进入 SLO 的 feedback loop。
- 枚举五个 LLM-specific experiments（memory overload、network fail、provider outage、malformed prompt、KV eviction storm）。
- 根据 stack 选择工具 — Harness、LitmusChaos、Chaos Mesh。

## 问题

传统 stack 中的 Chaos testing 已经很成熟。LLM stack 增加了新的 failure modes。一个带有 poison character 的 4K-token prompt 会让 tokenizer 卡住 12 秒。上游 provider 返回 429；你的 gateway 进行 retries；你的 service 因 retry-amplified concurrency 而 OOM。burst load 下的 KV cache eviction storm 会导致 re-prefill cascades，进而耗尽 compute。

这些都不会出现在 unit tests 中。Chaos Engineering 是你在用户遇到它们之前发现它们的方法。

## 概念

### 前置条件

如果没有以下内容，不要在 Production 中运行 chaos：

1. **SLI/SLO** — 已定义的 service-level indicators 和 objectives。
2. **Observability** — traces、metrics、logs，并连接到 dashboards。
3. **Automated rollback** — Phase 17 · 20 policy-flag rollback。
4. **Runbooks** — 结构化，Phase 17 · 23。
5. **On-call** — 有人负责响应。

缺少任何一个，都意味着 chaos 会变成真实 Incident。

### Four planes + feedback

**Control plane** — experiment scheduler（Litmus workflow、Chaos Mesh schedule、Harness UI）。

**Target plane** — services、pods、nodes、load balancers、data stores。

**Safety plane** — kill switch、suppression windows、blast-radius limits、error-budget gates。

**Observability plane** — 常规 metrics + trace-ID correlation，用于区分 chaos-induced failures 和 natural failures。

**Feedback loop** — 发现结果反馈到 SLO adjustment、runbook updates、code fixes。

### Guardrails 是强制要求

- **Burn-rate alert**：如果 daily error-budget burn 超过预期的 2x，则暂停实验。
- **Suppression windows**：实验期间，在 blast radius 内静默非实验 alerts。
- **Trace-ID correlation**：所有 experiment-induced errors 都携带一个 tag，让 on-call 可以去重。

### 五个 LLM-specific experiments

1. **Memory overload** — 通过高并发发送 long-context requests，强制触发 KV cache preemption storm。观察：service 是优雅地 shed load，还是 crash？

2. **Network failure** — 切断 inference gateway 与 provider 之间的连接。观察：fallback 是否在 SLA 内生效？（Phase 17 · 19）

3. **Provider outage simulation** — OpenAI 100% 返回 429。观察：routing 是否 failover 到 Anthropic？（Phase 17 · 16, 19）

4. **Malformed prompt** — 注入会让 tokenizer 卡住的 payload（例如 deeply nested unicode、huge UTF-8 codepoint）。观察：单个 request 是否会锁死一个 worker？

5. **KV eviction storm** — 通过耗尽 vLLM block budget 来强制 eviction。观察：LMCache 是否恢复，还是 service degrade？

### Cadence

- **每周** — 在 staging 中运行小型 canary experiments，也可能在 prod 中 5% 流量上运行。
- **每月** — 针对特定 scenario 安排 game day；跨团队参与；postmortem。
- **每季度** — cross-team resilience audit；dependency map update。

### Tooling

- **Harness Chaos Engineering** — 商业工具；AI-derived experiment recommendations；blast-radius downscaling；MCP tool integration。
- **LitmusChaos** — CNCF graduated；基于 Kubernetes workflow。
- **Chaos Mesh** — CNCF sandbox；Kubernetes-native CRD 风格。
- **Gremlin** — 商业工具；广泛支持。
- **AWS FIS** / **Azure Chaos Studio** — managed cloud offerings。

### 从小处开始

第一个实验：在稳定流量下 pod-kill 一个 decode replica。观察 rerouting 和 recovery。如果它能工作并且看起来安全，就升级到 network chaos。

第一个 LLM-specific experiment：注入一次 provider 429，持续 5 分钟。观察 fallback。大多数团队会发现他们的 fallback 并没有被充分测试。

### 你应该记住的数字

- 四个 planes：control、target、safety、observability。
- Burn-rate pause：预期 daily budget burn 的 2x。
- Cadence：weekly canary、monthly game day、quarterly audit。
- 五个 LLM experiments：memory、network、provider、malformed prompt、KV storm。

```figure
i4-chaos-guard
```

## 使用它

`code/main.py` 使用 safety plane gates 模拟三个 chaos experiments。报告哪些 experiments 会触发 burn-rate abort。

## 交付它

本课会生成 `outputs/skill-chaos-plan.md`。给定 stack 和 maturity，选择前三个 experiments 和 tooling。

## 练习

1. 运行 `code/main.py`。哪个 experiment 触发了 burn-rate gate，为什么？
2. 为一个基于 vLLM 的 RAG service 设计前五个 chaos experiments。包括 success criteria。
3. 你的 burn-rate alert 暂停了一个 experiment。你如何判断 root cause — 是 chaos 还是 natural？
4. 论证 chaos 应该在 Production 中运行，还是只在 staging 中运行。什么时候 Production 才是正确答案？
5. 说出三个 generic network-chaos 无法复现的 LLM-specific failure modes。

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| SLI / SLO | "service targets" | Indicator + objective；必需前置条件 |
| Blast radius | "scope" | 受 experiment 影响的 services / users 集合 |
| Burn-rate alert | "budget gate" | 当 error-budget burn rate > 预期的 2x 时触发 |
| Game day | "monthly drill" | 计划好的 cross-team chaos exercise |
| LitmusChaos | "CNCF workflow" | Graduated CNCF Kubernetes chaos tool |
| Chaos Mesh | "CNCF CRD" | CNCF sandbox Kubernetes-native chaos |
| Harness CE | "commercial AI-assisted" | 带有 AI recommendations 的 Harness chaos |
| Malformed prompt | "tokenizer bomb" | 会让 tokenization 卡住的输入 |
| KV eviction storm | "preemption cascade" | 大规模 eviction 触发 re-prefills |

## 延伸阅读

- [DevSecOps School — Chaos Engineering 2026 指南](https://devsecopsschool.com/blog/chaos-engineering/)
- [Ankush Sharma — Observability for LLMs（书）](https://www.amazon.com/Observability-Large-Language-Models-Engineering-ebook/dp/B0DJSR65TR)
- [LitmusChaos（CNCF）](https://litmuschaos.io/)
- [Chaos Mesh（CNCF）](https://chaos-mesh.org/)
- [Harness Chaos Engineering](https://www.harness.io/products/chaos-engineering)
- [AWS FIS](https://aws.amazon.com/fis/)
