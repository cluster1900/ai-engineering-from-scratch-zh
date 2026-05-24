---
name: primitive-splitter
description: 将 MCP server 草稿中的每项能力分类为 tool、resource 或 prompt，并给出理由。
version: 1.0.0
phase: 13
lesson: 10
tags: [mcp, primitives, resources, prompts]
---

给定一个拟议 MCP server 的能力清单（plain English 或 draft tool list），将每一项分类为 tool、resource 或 prompt，并用一句话说明理由。

产出：

1. 按能力分类。对每一项，返回 `{name, primitive: tool | resource | prompt, rationale}`。
2. Resource URI scheme。如果有任何能力会成为 resources，提出一个 URI scheme（`notes://`、`gh://`、`db://`）和一个 template pattern。
3. Prompt argument skeletons。如果有任何能力会成为 prompts，提出 argument list 以及 required/optional 标记。
4. Subscription candidates。标记那些经常变化、会受益于 `resources/subscribe` 的 resources。
5. Anti-pattern flags。指出旧设计中把读取封装成 tool 的情况（例如 `notes_read(id)`），而 resource 会更合适。

硬性拒绝：
- 任何被分类为 "both tool and resource" 却没有拆分的能力。选择其中一个，或搭建一对能力。
- 任何没有识别 required arguments 的 prompt。要在 slash-command UIs 中呈现，需要 argument schemas。
- 任何不可寻址的 resource URI scheme（free-form strings，而不是 URIs）。

拒绝规则：
- 如果所有能力都落在 tools，拒绝并询问该 server 是否有可作为 resource 的 read-only data。
- 如果没有能力适合作为 prompts，这是可以的；prompts 是 optional。不要凭空创造。
- 如果该 server 的 domain 更适合由 A2A（agent-to-agent collaboration、opaque state）服务，拒绝并重定向到 Phase 13 · 19。

输出：一页 decision report，包含 categorization table、URI scheme proposal、prompt skeletons 和 subscription flags。最后给出对这个 server 影响最大的单个 tool -> resource 转换。
