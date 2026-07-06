---
name: ai-scientist-sandbox-review
description: research-loop agent 输出在任何内容离开 sandbox 前的 two-gate review checklist。
version: 1.0.0
phase: 15
lesson: 5
tags: [ai-scientist, research-agent, sandbox, peer-review, disclosure]
---

给定由 AI-Scientist-v2 风格循环生成的自主研究输出（假设、代码、实验、图表、论文草稿），产出一个 two-gate review：sandbox audit（是否有任何内容离开？）加 research audit（工作是否可靠？）。

两个 gate 直接映射到下面的 audit：**Sandbox gate = item 1**；**Research gate = items 2 (Experiment audit) + 3 (Polish audit)**。Items 4–5 管理两个 gate 都通过之后会发生什么。

产出：

1. **Sandbox gate.** 在任何 artifact 离开 sandbox 之前：
   - 列出该循环进行的每一次 network call 及其目标。标记任何未经预先批准的调用。
   - 清点该循环在 working directory 之外写入的每个文件。
   - 确认 Docker / seccomp / gVisor containment 在完整运行期间保持有效。
   - 确认没有 subprocesses 逃离 sandbox 的监督。
   如果任何检查失败，阻止 export；上报给人类。
2. **Experiment audit.** 阅读实验代码，而不是论文：
   - 验证每个声称的实验确实运行过，并且其报告数字可复现。
   - 检查失败实验是否被报告为失败，而不是事后重新包装为 negative results。
   - 检查该想法的“novelty”标签是否经得起人类领域专家的 literature search。
3. **Polish audit.** 阅读图表：
   - 确保每个图表的数据来自已记录的实验运行，而不是 polish-stage rewriting。
   - 确认 axes、scales 和 annotations 与底层数据匹配。
   - 标记任何 caption claim 超出数据支持范围的图表。
4. **Disclosure plan.** 如果 artifact 计划对外分发：
   - 披露该 artifact 由 agent 编写。
   - 披露所用工具（model family、loop version）。
   - 披露检查它的人类 reviewer，以及他们检查了什么。
5. **Negative-release decision.** 如果 artifact 未通过任何 audit step，默认不发布。覆盖该默认规则需要一位具名 human owner。

硬性拒绝：
- 任何跳过任一 gate 的 submission。
- 任何缺失或不完整 loop execution logs 的 artifact。
- 任何无法追溯到具体实验运行的图表。
- 任何未经领域专家验证的 novelty claim。

拒绝规则：
- 如果运行缺少 Docker 或等效隔离，拒绝，并要求在隔离 sandbox 中重新运行。
- 如果用户无法提供实验阶段的 execution logs，拒绝 —— 该论文不可 review。
- 如果拟分发渠道是 peer-reviewed venue，而用户提议不披露 agent authorship，拒绝并要求披露。

Output format:

返回一份 two-gate report：
- **Sandbox gate 结论** (PASS / BLOCK，并说明理由)
- **Research gate 结论**（覆盖 Experiment audit (2) 和 Polish audit (3)）（PASS / BLOCK / REQUIRES_EXPERT，并附每项检查说明）
- **Disclosure plan** (venue、text、human reviewer name)
- **Release decision** (release / hold / reject)
- **Next action**（谁在什么时候做什么）
