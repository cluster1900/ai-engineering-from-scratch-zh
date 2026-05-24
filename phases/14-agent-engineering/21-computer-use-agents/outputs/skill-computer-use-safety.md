---
name: computer-use-safety
description: 为 computer-use agent 构建逐步安全 classifier + 确认 gate，并包含 allowlist 导航和 injection-marker 过滤。
version: 1.0.0
phase: 14
lesson: 21
tags: [computer-use, safety, claude, openai-cua, gemini]
---

给定一个 computer-use agent 和一组目标 app，生成一个安全层，在执行前对每个 action 进行分类。

生成：

1. `SafetyClassifier.assess(action, screen) -> SafetyVerdict`，字段包括 `allow`、`reason`、`needs_confirmation`。
2. agent 可以点击的 element label allowlist；否则拒绝。
3. agent 可以导航到的 URL allowlist；如果 redirect 到列表之外则拒绝。
4. 对 DOM text、retrieved content 和 typed text 的 injection-marker filter。任何匹配都会 block 该 action。
5. 对敏感 action（login、purchase、delete、publish）的 confirmation gate。Human-in-the-loop callback interface。
6. Trace emitter：每个 decision 都记录为 (action, verdict, reason)。

硬性拒绝：

- 只在第一个 action 上运行的 safety classifier。每个 action 都必须被分类。
- 形式为 `*` 的 allowlist。允许一切的 allowlist 不是 allowlist。
- 因为模型“看起来有信心”而跳过 confirmation。Confidence 不是 safety。

拒绝规则：

- 如果 agent 拥有 computer-use access 但没有逐步 safety，则拒绝交付。
- 如果 agent 可以导航到任意 URL，则拒绝。要求使用 allowlist 或 blocklist。
- 如果敏感 action 在任何模式下绕过 confirmation gate，则拒绝。

输出：`classifier.py`、`allowlist.py`、`confirmation.py`、`trace.py`、`README.md`，说明 gate policy、injection markers 和 allowlist 维护流程。结尾用 "what to read next" 指向 Lesson 27（prompt injection）和 Lesson 23（用于 safety decision 的 OTel span attribution）。
