---
name: virtual-memory
description: 为任意 target runtime 搭建 MemGPT-shaped two-tier memory system（main context + archival store + memory tools），具备正确的 eviction、citation 和 untrusted-input handling。
version: 1.0.0
phase: 14
lesson: 07
tags: [memory, memgpt, virtual-context, archival, citations]
---

给定一个 target runtime（Python, Node, Rust）、一个 model provider（Anthropic, OpenAI, local）和一个 storage backend（in-memory, SQLite, Vector DB, KV, graph），生成一个正确的 MemGPT-shaped memory system。

生成：

1. 一个 `MainContext` type，带有 `core` dict（命名的 persistent sections）和 `messages` list（FIFO）。在 size cap 上自动 evict；被 evict 的 turns 仍可由 `conversation_search` 检索。
2. 一个带 insert 和 search 的 `ArchivalStore`。Records 必须携带 `id`, `text`, `tags`, `session_id`, `turn_id`, `created_at`。每次 write 都返回 stored id 以用于 citation。
3. 五个匹配 MemGPT surface 的 memory tools：`core_memory_append`, `core_memory_replace`, `archival_memory_insert`, `archival_memory_search`, `conversation_search`。用 `description` text 将它们呈现给模型，说明模型何时使用每一个。
4. 一个 citation contract：每次 archival retrieval 都必须在 text 旁返回 record ids，并且 agent 必须在 final answers 中 cite 它们。没有 citations 的 answers 属于 soft failure。
5. 一个 consolidation hook（v1 中可以是 no-op），这样 Lesson 08 sleep-time agents 可以接入而无需重新布线。暴露 `list_records_since(timestamp)` 和 `delete(id)`。

Hard rejects：

- 使用 full-prompt LLM scoring 搜索 archival。使用合适的 retrieval backend（BM25, Vector similarity）。允许在 top-k shortlist 上进行 LLM re-ranking，而不是在 full corpus 上。
- Main context 没有 eviction policy。无界 main context 会悄悄增长到超过窗口。
- 像存储用户指令一样存储 retrieved content。所有 archival content 都是 untrusted text（Lesson 27）。把它作为 observation 传给模型，而不是作为 system prompt。
- 编写一个清空所有 sections 的 `core_memory_clear` tool。Core 是 load-bearing；clear 是 foot-gun。支持 `replace`，不要支持 `clear`。

Refusal rules：

- 如果用户要求 “no citations, just answers”，在任何 source attribution 重要的领域（medical, legal, policy, financial）都要拒绝。提供折中方案：把 citations 渲染为 footnotes，而不是 inline。
- 如果用户要求 “write all retrieved content back to archival without filtering”，拒绝并指向 Lesson 27。Retrieved content 是 attacker-reachable；blanket write-back 就是 memory poisoning。
- 如果 runtime 没有 persistence layer，拒绝交付一个被描述为具有 “long-term memory” 的 agent。降级 product description，而不是 implementation。

Output：每个 component 一个文件（`main_context.*`, `archival_store.*`, `memory_tools.*`, `agent.*`），再加一个 `README.md`，解释 eviction policy、citation contract，以及在哪里接入 Lesson 08（sleep-time consolidation）和 Lesson 09（Mem0 fusion）。最后用 "what to read next" 结尾：如果 agent 需要 three tiers 或 async consolidation，指向 Lesson 08；如果 agent 需要 Vector+KV+graph fusion，指向 Lesson 09。
