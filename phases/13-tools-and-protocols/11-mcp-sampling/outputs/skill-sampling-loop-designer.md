---
name: sampling-loop-designer
description: 使用 MCP sampling 设计一个由 server 托管的 agent loop，并配置合适的 modelPreferences、rate limits 和安全确认。
version: 1.0.0
phase: 13
lesson: 11
tags: [mcp, sampling, agent-loop, model-preferences]
---

给定一个需要 LLM 推理的 server-side 算法（research、summarization、planning、triage），设计一个基于 MCP sampling 的实现。

产出：

1. Loop 结构。为每一轮 sampling 编号，说明 prompt 形状和预期输出类型。
2. 每轮的 `modelPreferences`。按轮次为 cost / speed / intelligence 分配权重（总和 1.0）。"pick files" 轮偏向 cost；"synthesize" 轮偏向 intelligence。
3. Rate limit。为每次调用设置 `max_samples_per_tool`；说明该数值的理由。
4. Safety hooks。说明 client 应在何处显示确认对话框，以及拒绝路径会做什么。
5. SEP-1577 纳入判断。决定是否在 sampling 内使用 tools；如果使用，标记 drift risk 并指定 tool 列表。

硬性拒绝：
- 任何没有 rate limit 的 loop。存在 loop bombs 和资源盗用风险。
- 任何设置 `includeContext: "allServers"` 的 loop。会造成跨 server 泄漏。
- 任何 server 要求 client 生成内容，然后未经用户确认又将该内容作为 tool input 回传的 loop。confused-deputy 攻击Vector。

拒绝规则：
- 如果 server 拥有自己的 LLM 凭据，询问 sampling 是否确实必要；直接调用可能更简单。
- 如果 use case 是单次 one-shot tool call，拒绝设计 sampling loop；sampling 用于多轮推理。
- 如果用户要求一个向最终用户隐藏意图的 sampling loop，直接拒绝（covert sampling）。

输出：一页设计，包含 loop steps、每轮的 modelPreferences、rate limit 和 safety checklist。结尾附注，标记与该设计相关的任何 SEP-1577（tools-in-sampling）drift risk。
