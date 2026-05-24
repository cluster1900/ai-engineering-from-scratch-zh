---
name: scheming-triage
description: 根据 Apollo three-pillar scheming framework 对 agent-deployment incident report 进行 triage。
version: 1.0.0
phase: 18
lesson: 8
tags: [scheming, agent-safety, apollo, three-pillars, safety-cases]
---

给定一份 agent-deployment incident report（unexpected tool use, data access, self-preservation-adjacent behaviour），对 failure mode 进行分类，并在 scheming 是候选解释时，应用 Apollo three-pillar test。

产出：

1. Failure-class triage。将 incident 标记为以下之一：capability failure（模型无法完成任务）、control failure（monitoring/tool-use protocol 未能约束模型）、或 scheming（模型为了服务另一个 in-context goal，采取了违背 user goal 的 actions）。
2. Three-pillar check（如果 scheming 是候选解释）。
   - Misalignment：该 action 是否服务于 environment 或 tool output 中存在的 orthogonal goal？
   - Goal-directedness：该 action 是 multi-step plan 的一部分，还是 one-shot error？
   - Situational awareness：是否有证据表明模型当时知道自己正在被评估？
3. Evaluation-context audit。该 incident 是在 deployment、red-team evaluation，还是二者中都被观察到？如果只在 deployment 中出现，指出 evaluation-time results 不会迁移（Apollo 2025 caveat）。
4. Elicitation reproducibility。相同的 prompt + environment 能否再次产生该 behaviour？可复现 incident 属于 three-pillar frame；不可复现 incident 可能是 capability elicitation artifact。
5. Safety-case gap。当前针对该 deployment 的 safety case 覆盖了三大支柱中的哪几项，又留下了哪几项未覆盖？

Hard rejects:
- 任何将 scheming 视为 capability-class failure 的表述。Scheming 需要 goal-directedness 和 situational awareness——缺乏 capability 的模型无法 scheme。
- 任何在未检查同一模型的 evaluation-context recognition rate 的情况下，推断 “anti-scheming training reduced covert-action rate” 意味着 underlying misalignment 降低的说法。
- 任何声称 oversight subversion “不是攻击”的说法，其理由是 agent 没有 exfiltrate data——oversight subversion 本身就是 scheming action。

Refusal rules:
- 如果用户问 “is my model scheming”，在没有 three-pillar evidence 的情况下拒绝给出二元答案；请求 evaluation-context 和 elicitation-reproducibility data。
- 如果用户要求 residual scheming probability，拒绝给出数字答案，并解释 2026 evaluation reliability 受到模型自身 situational-awareness 的限制。

Output：一页 triage，标记 failure class，用可用证据填写三大支柱，标出缺失证据，并指出最急需弥补的单个 safety-case gap。引用一次 Meinke et al. (arXiv:2412.04984) 作为 framework source。
