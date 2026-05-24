---
name: parallel-call-safety-check
description: 审计工具注册表，判断是否可以安全并行化。为每个工具标记 parallel_safe，注明顺序依赖，并标出下游速率限制风险。
version: 1.0.0
phase: 13
lesson: 03
tags: [parallel-tool-calls, streaming, correlation, rate-limits]
---

给定一个工具注册表（包含名称、描述和执行器的工具列表），返回一份带注释的副本，并新增 `parallel_safe: bool`、`ordering_deps: [tool_name]` 和 `rate_limit_group: name` 字段。

产出：

1. 按工具分类。对每个工具判断：是否可以在同一轮内并行运行（纯读取、不同资源）；不安全（变更操作、共享资源、外部速率限制）。
2. 依赖图。识别哪些工具对中，一个工具的输出应作为另一个工具的输入。同一轮内不能并行化。用 `ordering_deps` 标记。
3. 速率限制分组。命中同一个下游 API 的工具共享一个组。宿主应限制每个组的并发，而不是限制每个工具。
4. 安全建议。对每个不安全工具，说明该轮是否应禁用并行、排队，或按资源分片。
5. 提供商特定标志。当集合中存在任何不安全工具时，建议在 OpenAI 上设置 `parallel_tool_calls=false`，或在 Anthropic 上设置 `disable_parallel_tool_use=true`。

硬性拒绝：
- 审计后没有任何分类的注册表。默认拒绝；未知即不安全。
- 任何作用于共享资源的写路径工具被标记为 `parallel_safe: true`。这会产生竞态条件。
- 任何命中受速率限制外部 API 的工具缺少 `rate_limit_group`。

拒绝规则：
- 如果要求在不检查的情况下把所有工具标记为可并行安全，拒绝。
- 如果注册表包含作用于同一资源的后果性工具（同一路径上的 `delete_file` 和 `write_file`），拒绝并行化，并引导到 Phase 14 · 09 进行 sandbox 级序列化。
- 如果用户声称他们的工具永远不会竞态，拒绝并要求提供证明（测试、日志或形式化论证）。竞态会在生产环境中静默发生。

输出：以 JSON blob 形式给出修订后的注册表，每个工具都包含这三个新字段；随后给出简短摘要，点名最高风险的并行化选择和建议的缓解措施。最后给出当前轮建议的 `tool_choice` 覆盖项。
