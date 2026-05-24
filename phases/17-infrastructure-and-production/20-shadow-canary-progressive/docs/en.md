# LLMs 的 Shadow Traffic、Canary Rollout 和 Progressive Deployment

> LLM rollouts 结合了 software deployment 中最困难的部分：没有 unit tests、failure modes 分散、signals 滞后。顺序是：（1）shadow mode — 将 prod requests 复制给 candidate model，记录日志并比较，对用户零影响；它能捕捉明显的分布问题，但不是质量保证；（2）canary rollout — 逐步转移流量 10% → 25% → 50% → 75% → 100%，每一步都有 gates；跟踪 latency percentiles、cost/request、error/refusal rate、output length distribution、user-feedback rate；（3）在稳定性确认后，对明确不同的替代方案做 A/B testing。Non-determinism 不可消除 — 即使输入完全相同，由于 GPU FP non-associativity 加上 batch-size variance，多次运行的 accuracy variation 最高可达 15%。Cost 是变量，不是常量 — 一个好 20% 的 model 每次调用可能贵 3 倍。Rollback 速度是决定性因素：如果 rollback 需要 redeploy，你就太慢了。Policy 放在 config/flags 中；model 放在 registry 中并固定 digests；rollback = flip policy + revert threshold + 在数秒内 pin old model。

**Type:** 学习
**语言：** Python（stdlib，toy canary-progression simulator）
**Prerequisites:** Phase 17 · 13（Observability），Phase 17 · 21（A/B Testing）
**Time:** ~60 分钟

## 学习目标

- 区分 shadow mode（零影响比较）、canary（live traffic progressive）和 A/B（稳定性确认后的比较）。
- 列举五个 LLM-specific canary metrics（latency、cost/request、error/refusal、output-length distribution、user feedback）。
- 解释为什么 LLM non-determinism（最高 15%）会改变 rollout 中 “stable” 的含义。
- 设计一个耗时数秒（policy flip）而不是数小时（redeploy）的 rollback 路径。

## 问题

你发布了一个新 model。Offline evals 显示 accuracy 提升 3%。你在 production 中启用它。24 小时内，cost 上升 40%，用户 thumbs-down 上升 8%，三个客户工单反馈“回答很怪”。你 rollback。Redeploy 需要 3 小时。你的周末被毁了。

这一切本来都可以避免。Shadow mode 会在任何用户看到之前捕捉到 40% 的 cost spike。Canary 会在 thumbs-down 变化时停在 10%。Policy-flag rollback 本应只需 30 秒。这套纪律填补的是 “offline evals 看起来不错” 和 “真实用户满意” 之间的空白。

## 概念

### Shadow mode

Candidate 接收与 production 相同的 requests；outputs 会被记录，但不会返回给用户。对用户零影响。记录：

- Output content（与 production 做 diff）。
- Token counts（cost delta）。
- Latency。
- Refusal 和 error。

能捕捉：cost blow-ups、length regressions、明显的 refusal changes、hard errors。不能捕捉：用户会感知到的 quality delta。Shadow 是 smoke test，不是 quality test。

### Canary rollout

带 gates 的 progressive traffic shift。典型进度：1% → 10% → 25% → 50% → 75% → 100%。每一步基于 5 个 metrics 设置 gate：

1. **Latency percentiles** — P50、P95、P99。违规：canary 的 P99 > baseline 的 1.5x。
2. **Cost per request** — 混合 $。违规：高于 baseline >20%。
3. **Error / refusal rate** — 5xx 加显式 refusals。违规：baseline 的 2x。
4. **Output length distribution** — mean + P99。违规：distributional shift。
5. **User-feedback rate** — thumbs-down / ticket filings。违规：baseline 的 1.5x。

### Non-determinism 是新的 variance

相同输入会产生不完全相同的输出。原因：

- GPU FP non-associativity（floating-point reduction order 会随 batch 变化）。
- Batch-size variance（同一 prompt 在 batch of 128 与 batch of 16 中不同）。
- Sampling（temperature > 0）。

实测：在相同 eval sets 上，run-to-run accuracy variation 最高可达 15%。“Stable” 在 rollout 中意味着 metrics 处于预期 variance 内，而不是与 baseline 完全相同。把 gates 设置在 noise floor 之上。

### Cost 是变量

一个好 20% 的 model 每次调用可能贵 3 倍。Cost/request 是五个 gates 之一。发布一个会破坏 unit economics 的“更好” model，是 rollback case。

### Rollback 是武器

- Policy flag（feature flag system）：在 config 中切换百分比；耗时数秒。
- Model pinning（registry digest）：pinned model 不会 auto-upgrade。
- Rollback = revert flag + set pinned digest to previous。数秒，而不是数小时。

如果你的 stack 需要 redeploy 才能 rollback，在 rollout 之前先修好这一点。

### Tooling

**Argo Rollouts** / **Flagger** — Kubernetes progressive delivery controllers。与 Istio/Linkerd weighted routing 集成。

**Istio weighted routing** — service-mesh 级流量拆分。

**KServe / Seldon Core** — 内置 canary 的 model serving。

**Feature flags** — LaunchDarkly、Flagsmith、Unleash。Policy-level flip，无需 redeploy。

### Metrics cadence

Canary gates 每 5-15 分钟检查一次，具体取决于 traffic volume。1% traffic 且 10 req/min 时，每个 window 有 50-150 个 data points — 对 latency 足够，但对 user feedback 来说噪声较大。10% 会带来约 10x 更多数据。Progressions 应该在每一步暂停足够久，以累积足够的 samples。

### A/B 步骤是可选的

如果新 model 明显不同（不同 behavior、不同 cost curve、不同 tone），在 canary 通过后以 50% 做 A/B test。如果它只是一个改进版本，当 canary gates 通过后直接到 100%。

### 你应该记住的数字

- Canary progression：1% → 10% → 25% → 50% → 75% → 100%。
- Non-determinism ceiling：相同输入上的 run-to-run variance 最高可达 15%。
- 五个 canary metrics：latency、cost、error/refusal、output length、user feedback。
- Cost gate：高于 baseline >20% 即为 breach。
- Rollback：数秒，而不是数小时。

## 使用它

`code/main.py` 模拟带有注入 regressions 的 canary rollout。报告 rollout 在哪个 stage 停止，以及哪个 gate 被触发。

## 交付它

本课生成 `outputs/skill-rollout-runbook.md`。给定 candidate model、baseline 和 risk tolerance，设计 shadow→canary→100% plan。

## 练习

1. 运行 `code/main.py`。注入 25% cost regression。canary 会在哪个 stage 停止？
2. 你的新 model 在 offline 中有 3% accuracy gain，但 cost/request 是 +18%。是否发布？取决于 policy — 写出两条路径。
3. 设计一个端到端耗时低于 60 秒的 rollback。列出所需 infrastructure。
4. Non-determinism 在你的 eval 上显示 ±7%。设置 canary gates，避免 false-alarm。你使用哪些 multipliers？
5. Shadow mode 在 canary 之前捕捉到 40% cost spike。写出触发 shadow 的 alert rule。

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Shadow mode | “duplicate to new” | 用于 logging 的零影响 send-to-candidate |
| Canary | “progressive traffic” | 带 gates、暴露给用户的渐进式 rollout |
| Gates | “rollout checks” | 阻止 progression 的 metric thresholds |
| Non-determinism | “LLM variance” | 不可消除的 run-to-run differences |
| Policy flag | “flag flip rollback” | Config-level rollback，数秒而不是数小时 |
| Model pin | “registry digest” | 指向 model version 的不可变 reference |
| Argo Rollouts | “K8s progressive” | Kubernetes-native canary/rollback controller |
| KServe | “inference K8s” | 带 canary primitives 的 model serving |
| Istio weighted | “mesh split” | Service-mesh traffic splitter |

## 延伸阅读

- [TianPan — Releasing AI Features Without Breaking Production](https://tianpan.co/blog/2026-04-09-llm-gradual-rollout-shadow-canary-ab-testing)
- [MarkTechPost — Safely Deploying ML Models](https://www.marktechpost.com/2026/03/21/safely-deploying-ml-models-to-production-four-controlled-strategies-a-b-canary-interleaved-shadow-testing/)
- [APXML — Advanced LLM Deployment Patterns](https://apxml.com/courses/mlops-for-large-models-llmops/chapter-4-llm-deployment-serving-optimization/advanced-llm-deployment-patterns)
- [Argo Rollouts docs](https://argo-rollouts.readthedocs.io/)
- [Flagger docs](https://docs.flagger.app/)
