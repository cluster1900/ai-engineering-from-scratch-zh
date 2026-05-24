---
name: aar-deployment-review
description: 对 automated-alignment-research pipeline 的预部署 review，包括 sandbox 隔离和 log integrity。
version: 1.0.0
phase: 15
lesson: 6
tags: [aar, alignment-research, sandbox, log-integrity, rsp]
---

给定一个拟议的 Automated-Alignment-Research deployment（model、sandbox、task queue、forum），生成一份 frontier-lab safety team 会签字批准的预部署 review。

生成：

1. **Sandbox isolation.** 验证每个 AAR 实例的 filesystem、network 和 process 限制。确认没有 AAR 能读取或修改另一个 AAR 的 sandbox。确认没有 AAR 能直接访问 forum storage 的 write endpoint（所有 posts 都通过单独的 service）。
2. **Forum log integrity.** forum 必须是 append-only 且 tamper-evident。指定 storage（例如带 object lock 的 S3、immutable ledger、append-only WAL）。指定 verification interval，以及检测到 tampering 时的 response。
3. **Task allocation policy.** 说明 tasks 如何分配：谁编写、谁批准、AAR 是否可以提出自己的 follow-up tasks，以及在什么条件下可以。Free decomposition 在性能上胜出；prescribed workflow 在 auditability 上胜出。明确记录该取舍。
4. **Human review gate.** 在任何 AAR 输出影响真实研究方向、training data 或已发表工作之前，必须由具名 human reviewer 签字批准。指定 review checklist：experiment reproducibility、log completeness、claim-to-evidence mapping。
5. **Threshold monitoring.** 跟踪 AAR 系统接近 RSP v3.0 AI R&D-4 区域的信号：task complexity delta、autonomous sub-task spawning、cross-task information transfer。定义需要 elevated review 的 thresholds。

Hard rejects:
- 任何没有 tamper-evident、out-of-sandbox logs 的 AAR deployment。
- 任何让 AAR 输出在没有具名 human review 的情况下直接进入 training data 或 production policy 的 pipeline。
- 任何让单个 AAR 拥有足以影响多个 downstream systems 的 credentials 的 pipeline。

Refusal rules:
- 如果 sandbox isolation 未指定，或只依赖单层（仅 Docker，没有 seccomp / gVisor），拒绝并要求 defense-in-depth。
- 如果 log storage 可被任何人编辑（即使是 operators），拒绝并要求 write-once media。
- 如果 deployment 的目标是自动化 capability pipeline 的一部分，而不只是 alignment research，拒绝并升级到 RSP review。

Output format:

返回一份 review memo，包含：
- **Pipeline summary**（一段话）
- **Isolation score**（按维度：fs、net、proc、peer）
- **Log integrity score**（含 verification plan）
- **Task allocation decision**（fixed / free / hybrid，并说明 rationale）
- **Human review gate**（reviewer name、checklist）
- **Threshold monitors**（signals、thresholds、response 列表）
- **Deployment verdict**（go / hold / no-go）
