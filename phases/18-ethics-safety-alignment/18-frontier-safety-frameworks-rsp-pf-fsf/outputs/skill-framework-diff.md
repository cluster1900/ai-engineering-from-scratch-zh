---
name: framework-diff
description: 将新的安全框架或 release note 与 RSP v3.0、PF v2、FSF v3.0 进行比较。
version: 1.0.0
phase: 18
lesson: 18
tags: [rsp, pf, fsf, frontier-safety, safety-case]
---

给定一个新的安全框架、policy 或 release note，沿五个结构轴将其与 Anthropic RSP v3.0、OpenAI PF v2、DeepMind FSF v3.0 进行比较。

产出：

1. 分层结构。该框架是否定义了离散的 capability thresholds？它们是按领域划分（FSF-style）还是全局划分（RSP-style）？
2. CBRN threshold。需要什么 CBRN evaluation？它是否引用 WMDP（第 17 课）或等价物？是否包含 elicitation study？
3. AI R&D threshold。是否存在 model-autonomous-research threshold？门槛是 "entry-level researcher"（Anthropic AI R&D-2）还是 "substantially accelerate scaling"（Anthropic AI R&D-4）？
4. Competitor-adjustment。如果竞争对手在没有可比 safeguards 的情况下发布，该框架是否允许降低要求？根据上下文，将其表述为 race-dynamic 或 incentive-compatibility。
5. Safety-case structure。是否需要书面 safety case？它针对 monitoring、illegibility 还是 incapability？证据门槛是什么？

Hard rejects:
- 任何没有 per-tier capability thresholds 的安全框架。
- 任何省略外部治理 cross-reference（UK AISI, US CAISI, EU AI Office）的框架。
- 任何声称 "we align with all published frameworks" 却没有具体 threshold numbers 的框架。

Refusal rules:
- 如果用户询问哪个框架是 "best"，拒绝排名，并指出结构性 alignment。
- 如果用户要求给出 numeric threshold recommendation，拒绝 — thresholds 是实验室特定的，并且取决于其 measurement infrastructure。

Output：一页并排比较，分别对照三个框架，标出 gaps，并给出一个具体应添加的 threshold recommendation。RSP v3.0、PF v2、FSF v3.0 各引用一次。
