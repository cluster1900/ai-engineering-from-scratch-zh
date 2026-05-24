---
name: reflexion-buffer
description: 为 verbal RL 维护一个 reflections 的 episodic-memory buffer，包含 TTL、dedup 和 scoped scope。
version: 1.0.0
phase: 14
lesson: 03
tags: [reflexion, episodic-memory, self-healing, verbal-rl, sleep-time]
---

给定一个 task class（重复出现的 agent run 类型——例如“refactor a function”、“close a support ticket”），维护一个 reflections 的 episodic-memory buffer。每条 reflection 用自然语言记录一种 failure mode 和 corrective insight。该 buffer 会 prepend 到同一 task class 的下一次 trial。

Produce:

1. Reflection capture。一次 trial 结束后，如果 evaluator score 低于 threshold，就产出一行 reflection，格式为“I failed to do X because Y; next time, Z.”。对于 external failures（network、upstream 500s），除非可复现，否则丢弃 reflections。
2. TTL and dedup。Reflections 默认在 N 次 trials 后过期（建议 10）。完全重复项合并。Near-duplicates（在小型 embedding model 上 cosine >0.9，或 shared substring >= 80%）只保留最近的一条。
3. Scope policy。三种 scopes：task-class（按 task name）、user（同一 user 跨 tasks）、agent（跨所有 users）。默认是 task-class。只有当 reflection 指向 user-specific preferences 时，才升级到 user scope；绝不自动升级到 agent scope。
4. Compaction。当 buffer 超过预算时，运行 sleep-time compaction：cluster near-duplicates、summarize、merge。Compaction 在 hot path 之外运行——不要延迟 primary agent 的 response。
5. Prompt integration。产出一个标题为“What I learned from prior trials”的单个 block，包含 bulleted list。Prompt 中最多 6 items；溢出部分进入一个单独的 summary item（“... and 4 older reflections about timeouts”）。

Hard rejects:

- 将 reflections 写成“be more careful next time.”。这不可执行。用一个强制给出具体 next-time instruction 的 prompt 重新运行 reflector。
- 基于 wall-clock time 而不是 trial count 让 reflections 过期。对于可 offline-replay 的 runs，TTL 应该是 trial-scoped，而不是 time-scoped。
- 存储引用 secrets（API keys、tokens、PII）的 reflections。在提交到 buffer 前，用明确的“contains secret”类 error 拒绝。

Refusal rules:

- 如果没有附加 evaluator，拒绝并推荐 Lesson 05（Self-Refine/CRITIC）——reflection 需要 signal，而不是 gut feeling。
- 如果 task class 是 one-shot（永不复现），拒绝；episodic memory 对永不重复的任务没有作用。

Output：一个 structured buffer file（JSON，包含 reflection objects：trial id、task class、scope、text、created_at、ttl_remaining）、一个用于下一次 trial 的 prompt block，以及一个“stale reflections” report，列出即将过期的 entries。

最后附上一条“what to read next” note：如果 buffer 持续达到上限，指向 Lesson 06（context compression）；或指向 Lesson 08（Letta sleep-time compute），将 compaction 移出 hot path。
