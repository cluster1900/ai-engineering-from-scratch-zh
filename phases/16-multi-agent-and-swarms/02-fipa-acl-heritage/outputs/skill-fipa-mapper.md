---
name: fipa-mapper
description: 将任何 2026 agent-protocol spec（MCP, A2A, ACP, ANP, CA-MCP, NLIP，或新的 spec）映射到 FIPA-ACL performatives 和 interaction protocols，以判断哪些是真正的新意，哪些是重新发明。
version: 1.0.0
phase: 16
lesson: 02
tags: [multi-agent, protocols, FIPA, speech-acts, interoperability]
---

给定一个新的 agent-protocol spec，生成 FIPA-ACL 映射，让读者能判断哪些部分是重新发明，哪些是真正的新结构。

生成：

1. **Envelope mapping.** 对 spec 定义的每一种 message type，命名最接近的 FIPA performative（`inform`, `request`, `query-if`, `query-ref`, `propose`, `accept-proposal`, `reject-proposal`, `cfp`, `subscribe`, `cancel`, `failure`, `not-understood`，或其他约 20 个之一）。如果没有合适的 performative，请精确描述差距。
2. **Correlation model.** spec 如何将 requests 关联到 replies，将 cancellation 关联到原始 request，并将 streamed events 关联到 subscribe？与 FIPA 的 `:conversation-id` 和 `:reply-with` 字段比较。
3. **Content-language stance.** spec 是否强制要求 content schema（typed artifacts, JSON-Schema），接受自然语言，还是保持开放？与 FIPA 的 SL0/SL1 和 ontology 字段比较。
4. **Interaction-protocol library.** 哪些 FIPA interaction protocols 可以在该 spec 之上实现：contract-net, subscribe-notify, request-when, propose-accept？命名将实现每一个协议的 messages。
5. **Discovery model.** agent 如何找到 counterparties 和 capabilities（MCP `listTools`, A2A Agent Card, ANP DID + meta-protocol）？与 FIPA 的 directory facilitator 和 yellow-pages service 比较。
6. **Reinvention vs novelty.** 生成一个三列表格：[FIPA concept, modern spec equivalent, what changed]。将每一行标记为 [reinvention] 或 [novel-structure]。只有当 spec 引入 FIPA 没有的 primitive 时，该行才是 "novel-structure"——decentralized identity、typed multimodal artifacts 和 LLM-interpretable content 是常见候选。

硬性拒绝：

- 任何声称某个 spec 是 "revolutionary" 却没有展示 FIPA 不具备的 primitive 的映射。speech-act theory + ontology overhead 才是失败模式，不是 primitives。
- 忽略 discovery layer 的 framework comparisons。没有 discovery 的 spec 是不完整的，不是新颖的。
- 类似 "Protocol X replaces FIPA" 的陈述，但没有处理两个 agents 对 content meaning 产生分歧时会发生什么（semantic drift）。

拒绝规则：

- 如果 spec 处于 pre-standardization 阶段（draft < 6 个月、没有公开 implementations），说明该映射是 provisional，并标出最可能发生变化的三个点。
- 如果 spec 是 closed-source 或 enterprise-only（某些 ACP flavors），映射已有文档记录的部分，并命名缺口。
- 如果用户只提供 blog post（没有 spec document），在映射前要求提供 spec。

输出：一页 brief。用单句 summary 开头（"Protocol X is FIPA `request`/`subscribe` with JSON syntax and a DID-based discovery layer."），然后是上面的六个 sections，最后用一段 closing paragraph 回答："Which old FIPA failure mode will this spec rediscover?"
