# Memory Blocks 与 Sleep-Time Compute (Letta)

> MemGPT 在 2024 年成为 Letta。2026 年的演进加入了两个想法：模型可以直接编辑的离散功能性 memory blocks，以及在 primary agent 空闲时异步整合记忆的 sleep-time agent。这就是将记忆扩展到单次对话之外的方法。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT)
**Time:** ~75 minutes

## 学习目标
- 说出 Letta 使用的三层记忆（core、recall、archival）以及每一层的作用。
- 解释 memory-block pattern：Human block、Persona block，以及作为一等 typed objects 的 user-defined blocks。
- 描述什么是 sleep-time compute，为什么它位于 critical path 之外，以及为什么它可以运行比 primary agent 更强的模型。
- 实现一个脚本化的双 agent 循环，其中 primary agent 提供响应，sleep-time agent 在轮次之间整合 blocks。

## 问题
MemGPT（Lesson 07）解决了 virtual-memory control flow。随后出现了三个生产问题：

1. **Latency.** 每个 memory operation 都位于 critical path 上。如果 agent 必须在用户等待时进行裁剪、总结或调和，tail latency 会急剧上升。
2. **Memory rot.** 写入会不断累积。被矛盾推翻的事实会留下。检索会被陈旧内容淹没。
3. **Structure loss.** 扁平的 archival store 无法表达“Human block 总是在 prompt 中；Persona block 总是在 prompt 中；Task block 按 session 交换”。

Letta (letta.com) 是 2026 年的重写版本。Memory blocks 让结构显式化；sleep-time compute 将整合移出 critical path。

## 概念
### Three tiers

| Tier | Scope | Where it lives | Written by |
|------|-------|----------------|------------|
| Core | 始终可见 | 在 main prompt 内 | Agent tool call + sleep-time rewrites |
| Recall | 对话历史 | 可检索 | 自动轮次日志 |
| Archival | 任意事实 | Vector + KV + graph | Agent tool call + sleep-time ingest |

Core 是 MemGPT core。Recall 是 conversation buffer 及其被驱逐的尾部。Archival 是 external store。这个拆分清理了 MemGPT 的两层重载。

### Memory blocks

Block 是 core tier 中一个 typed、persistent、editable 的 section。原始 MemGPT paper 定义了两个：

- **Human block** — 关于用户的事实（姓名、角色、偏好、目标）。
- **Persona block** — agent 的 self-concept（身份、语气、约束）。

Letta 将其泛化为任意 user-defined blocks：用于当前目标的 `Task` block，用于 codebase 事实的 `Project` block，用于硬约束的 `Safety` block。每个 block 都有 `id`、`label`、`value`、`limit`（字符上限）、`description`（让模型知道何时编辑它）。

Blocks 可通过 tool surface 编辑：

- `block_append(label, text)`
- `block_replace(label, old, new)`
- `block_read(label)`
- `block_summarize(label)` — 压缩接近 limit 的 block。

### Sleep-time compute

2025 年 Letta 的新增项：在后台运行第二个 agent，位于 critical path 之外。Sleep-time agents 处理 conversation transcripts 和 codebase context，将 `learned_context` 写入 shared blocks，并整合或作废 archival records。

由此得到的属性：

- **No latency cost.** Primary responses 不等待 memory ops。
- **Stronger model allowed.** Sleep-time agent 可以是更昂贵、更慢的模型，因为它不受 latency 约束。
- **Natural consolidation window.** 当用户不在等待时，进行去重、总结、作废矛盾事实。

这种形状符合人类的工作方式：你完成任务，睡一觉，长期记忆在夜间沉淀下来。

### Letta V1 与原生 reasoning

Letta V1 (`letta_v1_agent`, 2026) 弃用 `send_message`/heartbeat 和 inline `Thought:` tokens，转而支持 native reasoning。Responses API (OpenAI) 和带 extended thinking 的 Messages API (Anthropic) 会在单独的 channel 上发出 reasoning，并跨轮次传递（在生产中跨 providers 加密）。Control loop 仍是 ReAct。Thought trace 是结构性的，而不是 prompt-shaped。

### 这个模式容易出错的地方

- **Block bloat.** 无限 `block_append` 会很快触及 limit。在会导致超出 cap 的写入前接入 block summarizer。
- **Silent drift.** Sleep-time agent 重写了 block，而 primary agent 从未注意到。为 blocks 加版本，并在 trace 中展示 diffs。
- **Poisoned consolidation.** Sleep-time agent 将攻击者可触达内容处理进 core。Lesson 27 同样适用于 sleep-time surface。

## 构建它
`code/main.py` 实现了：

- `Block` — id、label、value、limit、description。
- `BlockStore` — CRUD + `near_limit(label)` helper。
- 两个脚本化 agents — `PrimaryAgent` 服务一个轮次，`SleepTimeAgent` 在轮次之间整合。
- 一条 trace，展示包含 block writes 的三轮对话，以及一次 sleep-time pass，它总结一个 block 并作废一条陈旧事实。

运行：

```
python3 code/main.py
```

Transcript 展示了这种拆分：primary turns 很快并产生原始写入；sleep pass 负责压缩和清理。

## 使用它
- **Letta** (letta.com) 作为 reference implementation。可 self-host 或使用 managed cloud。
- **Claude Agent SDK skills** 作为 block-shaped knowledge — skill 是一个具名、带版本、可检索的 instructions block，agent 可按需加载。
- **Custom builds** 适用于希望控制 storage backend 的团队。使用 Letta API contract，以便后续迁移。

## 交付它
`outputs/skill-memory-blocks.md` 会为任意 runtime 生成一个 Letta-shaped block system，带有 sleep-time hooks，包括 safety rules 和 citation wiring。

## 练习
1. 添加一个 `block_summarize` tool：当 `near_limit` 返回 true 时，用模型生成的 summary 替换 block value。哪个触发阈值能同时最小化 summarization calls 和 block overflow？
2. 在 archival 上实现 sleep-time dedup：两个 records 的文本有 >90% token overlap 时折叠为一个。只在 sleep pass 中执行，绝不放在 critical path 上。
3. 为 blocks 加版本。每次写入都记录旧值和 diff。暴露 `block_history(label)`，让 operators 可以调试“为什么 agent 忘了 X”。
4. 将 sleep-time agents 视为 untrusted writers。当它们触碰 Persona 或 Safety block 时，提交前要求第二个 agent review。
5. 将示例移植为使用 Letta API (`letta_v1_agent`)。Block schema 有什么变化，native reasoning 如何改变 trace shape？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Memory block | “可编辑的 prompt section” | Core memory 中 typed、persistent、LLM-editable 的 segment |
| Human block | “用户记忆” | 关于用户的事实，固定在 core 中 |
| Persona block | “Agent 身份” | Self-concept、语气、约束，固定在 core 中 |
| Sleep-time compute | “异步记忆工作” | 第二个 agent 在 critical path 之外执行整合 |
| Core / Recall / Archival | “层级” | 三层记忆拆分：始终可见 / 对话 / external |
| Block limit | “上限” | 每个 block 的字符限制；迫使进行 summarization |
| Native reasoning | “Thinking channel” | Provider-level reasoning output，而不是 prompt-level `Thought:` |
| Learned context | “Sleep output” | Sleep-time agent 写入 shared blocks 的事实 |

## 延伸阅读
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) — block pattern
- [Letta, Sleep-time Compute blog](https://www.letta.com/blog/sleep-time-compute) — 异步整合
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent) — 原生 reasoning 重写
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) — 起源
