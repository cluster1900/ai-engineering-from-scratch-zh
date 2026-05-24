---
name: tripwire-design
description: 审查拟议的 agent detector stack（kill switch、circuit breakers、canary tokens），并在首次 autonomous run 前标记缺失的 tripwires。
version: 1.0.0
phase: 15
lesson: 14
tags: [kill-switch, circuit-breaker, canary, honeytoken, detection-and-response]
---

给定一个 agent deployment 的拟议 detector stack，请根据三类 detector reference（kill switch、circuit breaker、canary）进行 audit，并标记缺失、调校不当或暴露给 agent 的部分。

产出：

1. **Kill-switch audit.** switch 位于哪里（feature flag、Redis、signed config）？确认 agent 的 credentials 不能将其关闭。确认每个 consequential action 都会检查 switch，而不只是 startup。确认 re-enable 是明确的人工动作。
2. **Circuit-breaker inventory.** 列出每个 breaker 监控的 pattern（repetition、consecutive failures、rate、out-of-trust read 后的 specific tool）。说明每个的 threshold 和 cool-down。高于 10 的 thresholds 通常过松。
3. **Canary design.** 列出 environment 中的每个 canary token。对于每个 canary，说明：它是什么（fake credential、fake DB record、fake file、fake memory entry）、位于哪里、什么 access 会触发 alarm、谁会被 page。确认没有任何 canary 有被触碰的正当理由。
4. **Statistical + hard layering.** 确认 stack 除了任何 statistical detectors（EWMA、z-score）之外，至少使用一个 hard limit（Lesson 17 constitutional style）。Statistical-only detectors 会接受 slow drift。
5. **Quarantine path.** detector 触发时会发生什么？Full agent stop、path-specific pause、traffic redirect（eBPF / Cilium honeypot）、alert-only。确认该路径至少已 end-to-end 测试过一次。

Hard rejects:
- 任何没有 external kill switch 的 deployment。
- 存储在 agent 拥有 write access 的系统中的 canary tokens。
- 没有 hard limits 的 statistical-only detection。
- cool-down 会在没有 human review 的情况下 auto-re-enable 的 circuit breakers。
- kill switch 只在 startup 检查、而不是每个 action 都检查的 unattended runs。

Refusal rules:
- 如果用户无法说出承载 kill switch、且位于 agent credentials 之外的具体系统，则拒绝。“We use a config file the agent reads” 不是 kill switch，如果 agent 可以写 config files。
- 如果用户把 Auto Mode classifier（Lesson 10）当作 tripwires 的替代品，则拒绝。Classifier 与 detection-and-response 是 orthogonal 的。
- 如果拟议的 canaries 位于 agent 有正当理由读取的系统中，则拒绝并要求 redesign。

Output format:

返回一份 tripwire audit，包含：
- **Kill-switch line**（location、check cadence、re-enable procedure）
- **Circuit-breaker table**（pattern、threshold、cool-down）
- **Canary table**（token、location、alarm、owner）
- **分层说明**（statistical + hard limits present y/n）
- **Quarantine flow**（what fires、what happens、tested y/n）
- **就绪度**（production / staging / research-only）
