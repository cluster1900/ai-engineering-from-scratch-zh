---
name: ipi-audit
description: 审计 agentic deployment 的 indirect prompt injection 暴露面和 information-flow-control 覆盖情况。
version: 1.0.0
phase: 18
lesson: 15
tags: [ipi, indirect-prompt-injection, ifc, agent-security, owasp-llm01]
---

给定一个 agentic deployment description，审计该部署的 indirect prompt injection 暴露面。

产出：

1. Untrusted-content inventory。列出 agent 可能读取的每个 content source：RAG documents、inbox、calendar、tool outputs、tickets、product reviews、third-party APIs。每一个都是潜在的 IPI Vector。
2. Trust labelling。该部署是否将 trusted（user prompt）与 untrusted（retrieved content）分离？如果 content 被拼接进同一个 prompt 且没有 label，则 IFC 未生效。
3. Action gating。哪些 tools 可以被调用？对每个 tool，调用是否只由 trusted prompt 控制，还是 untrusted content 也能影响调用？
4. Adaptive-attack evaluation。该部署是否按 Nasr et al. 2025 使用 adaptive attacks（gradient、RL、human red-team）测试过？仅 static-attack 的评估是不充分的。
5. Scope-violation boundaries。识别每个 cross-trust boundary（例如 inbox -> send、documents -> external API）。对每一个，验证该 action 要么在 untrusted influence 下被禁止，要么由 trusted prompt 显式批准。

硬性拒绝：
- 任何没有对 retrieved content 做显式 trust labelling 的 agent deployment。
- 任何只基于 static attacks 的 defense claim。
- 任何没有说明 IFC mechanism 就声称 "our agent is prompt-injection safe" 的说法。

拒绝规则：
- 如果用户问 filtering 是否足够，拒绝并解释 Nasr 2025 结果：adaptive attacks 会攻破 >90% 的 filter-based defenses。
- 如果用户要求 silver-bullet defense，拒绝 — IPI defense 需要 IFC，加上 layered response moderation，并对 high-stakes actions 进行 human audit。

输出：一页 audit，填写上述五个部分，标记最危险的 untrusted-to-trusted boundary，并指出最急需添加的单一 control。分别引用一次 MDPI Information 17(1):54 (2026) 和 Nasr et al. (October 2025)。
