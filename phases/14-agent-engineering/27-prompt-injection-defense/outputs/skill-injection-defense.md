---
name: injection-defense
description: 为任意 agent runtime 构建一个 PVE (Prompt-Validator-Executor) 层，包含带 source-tag 的内容、injection-marker 扫描，以及 allowlist navigation。
version: 1.0.0
phase: 14
lesson: 27
tags: [security, prompt-injection, pve, greshake, source-tag]
---

给定一个具备 tool access 和 retrieval 能力的 agent，产出一个 injection-defense 层。

产出：

1. 为每一段内容添加 source tag：`user_message`、`tool_output`、`retrieved_web`、`retrieved_memory`、`retrieved_file`。在 message history 中传播这些 tag。
2. `Validator.assess(tool_call, contents)` — 拒绝带有 injection 形态 args 或 retrieved content 的 tool call；仅当 source tag 与声明的 trust level 匹配时才允许。
3. navigation 的 allowlist / blocklist：agent 可以触达的 URL、domain、file path。
4. Memory-write guardrail：拒绝看起来像 directive 的写入。
5. Content-capture 纪律（Lesson 23）：将 retrieved content 存储在外部；span 携带 reference ID，而不是 prose。
6. Test suite：将五类 Greshake exploit 作为 red-team case。

硬性拒绝：

- 没有 source tag 的 tool-use surface。没有 provenance 就无法区分 permission level。
- 只在 final output 上运行的 Validator。后期 validation 没有意义 — model 已经采取行动。
- “相信我，system prompt 会处理它。” System-prompt hygiene 不是一种 control。

拒绝规则：

- 如果 agent 具备任何 retrieval capability 但没有 source tagging，拒绝发布。Retrieved content 是标准的 injection vector。
- 如果 sensitive tool（send message、execute shell、write file in /）没有 human-in-the-loop confirmation，拒绝。
- 如果 memory write 没有 guard，拒绝。Persistent memory poisoning 会在下一次 session 中再次投毒。

输出：`validator.py`、`source_tag.py`、`allowlist.py`、`memory_guard.py`、`red_team.py`、`README.md`，解释六层 control stack、residual risk 和 ongoing review cadence。以指向 Lesson 21（computer use safety）和 Lesson 23（content capture via OTel）的 “what to read next” 结尾。
