---
name: safety-harness
description: 围绕目标 LLM app 接入 layered safety pipeline，运行一个六家族 red-team range，并执行 constitutional self-critique，以获得可衡量的 harmlessness delta。
version: 1.0.0
phase: 19
lesson: 15
tags: [capstone, safety, red-team, llama-guard, x-guard, garak, pyrit, constitutional-ai]
---

给定一个目标 LLM application（8B instruction-tuned model 或 RAG chatbot），使用 layered safety pipeline 对其加固，并在六个攻击家族上运行 autonomous red-team range。产出 before/after harmlessness report。

构建计划：

1. 五层 pipeline：input sanitize（zero-width strip、encoding decode、Unicode normalize）-> NeMo Guardrails v0.12 rails -> classifier gate（Llama Guard 4 / X-Guard / ShieldGemma-2 / Nemotron 3）-> target LLM -> output filter（Llama Guard 4 + Presidio PII + citation check）。被标记的输出进入 Slack HITL queue。
2. 每层发出一个 Langfuse span，使 attribution 端到端可观测。
3. Red-team scheduler 在 cron 上运行 garak、PyRIT、PAIR、TAP、GCG、multi-turn persona 和 multilingual code-switch attacks。
4. 每个成功的 jailbreak：CVSS 4.0 score、repro、mitigation plan、disclosure timeline。
5. XSTest benign-prompt probe 持续运行，用于捕获 over-refusal regressions。
6. Constitutional self-critique run：1k harmful-attempt prompts -> target drafts -> critic 根据书面 constitution 评分 -> rewritten pairs -> SFT。在 held-out harmlessness eval 上测量 before/after。
7. Alerts：benign-regression 时发送 Slack warning；出现新的 jailbreak family 时触发 PagerDuty critical。

评估 rubric：

| 权重 | 标准 | 测量方式 |
|:-:|---|---|
| 25 | Attack-surface coverage | 覆盖 6+ 攻击家族、2+ 种语言 |
| 20 | True-positive / false-positive trade-off | Attack block rate vs XSTest benign pass rate |
| 20 | Self-critique delta | held-out eval 上的 before/after harmlessness |
| 20 | Documentation and disclosure | 带 timeline 的 CVSS-scored findings |
| 15 | Automation and repeatability | Cron-driven，alerts 端到端演练 |

硬性拒收：

- Single-layer safety stacks。这个 capstone 的核心论点是 defense in depth。
- Red-team runs 只报告 success rate，却没有 XSTest over-refusal numbers。
- Constitutional self-critique 没有 held-out eval（报告的是 training-set accuracy，而不是 generalization）。
- Jailbreak findings 缺少 CVSS scoring。

拒绝规则：

- 没有 benign-probe counterpoint 时，拒绝报告 safety number。缺少任一侧都会产生误导。
- 没有对 critique pairs 进行人工筛选时，拒绝基于 red-team successes 自动 retrain。
- 没有在至少两种非英语语言上运行 X-Guard 时，拒绝声称具备 Multilingual coverage。

输出：一个 repo，包含五层 pipeline、red-team scheduler、PAIR/TAP/GCG runners、constitutional-self-critique training harness、XSTest over-refusal dashboard、CVSS findings tracker，以及一份 write-up，指出 pre-hardening 阶段 success rate 最高的三个攻击家族，以及缓解每个攻击家族的具体 pipeline layer。
