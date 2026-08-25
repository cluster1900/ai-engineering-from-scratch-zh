# Memory Block 与 Sleep-Time Compute

> Model 可以直接编辑的离散功能性 Memory Block，以及在主 Agent 空闲时异步整合记忆的 sleep-time Agent。这两个理念让记忆能够突破单次对话的限制，扩展到更大规模。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT)
**Time:** ~75 分钟

## 学习目标

- 说出 Letta 使用的三个记忆层级（core、recall、archival）及各自的作用。
- 解释 Memory Block 模式：将 Human block、Persona block 和用户自定义 block 作为一等 typed object。
- 描述 sleep-time compute 是什么、为什么它位于关键路径之外，以及为什么它可以使用比主 Agent 更强的 Model。
- 实现一个脚本化的双 Agent 循环，其中主 Agent 负责响应，sleep-time Agent 在各轮之间整合 block。

## 问题

MemGPT（Lesson 07）解决了虚拟记忆的控制流问题。随后出现了三个生产环境问题：

1. **延迟。** 每个记忆操作都位于关键路径上。如果 Agent 必须在用户等待期间执行修剪、摘要或协调，尾延迟就会急剧增加。
2. **记忆腐化。** 写入不断累积，相互矛盾的事实仍然存在，检索结果被过时内容淹没。
3. **结构丢失。** 扁平的 archival 存储无法表达“Human block 始终位于 Prompt 中；Persona block 始终位于 Prompt 中；Task block 随 session 切换”。

Letta（letta.com）是原 MemGPT 项目在 2024 年采用的平台名称——论文中的模式仍沿用 MemGPT 这一名称——而 2026 年的 Letta V1 重写则是之后独立发生的一步。Memory Block 让结构变得明确；sleep-time compute 将整合工作移出关键路径。

## 概念

### 三个层级

| 层级 | 范围 | 所在位置 | 写入者 |
|------|-------|----------------|------------|
| Core | 始终可见 | 主 Prompt 内部 | Agent Tool 调用 + sleep-time 重写 |
| Recall | 对话历史 | 可检索 | 自动记录每轮对话 |
| Archival | 任意事实 | Vector + KV + graph | Agent Tool 调用 + sleep-time ingest |

Core 是 MemGPT 的核心。Recall 是对话缓冲区及其被逐出的尾部内容。Archival 是外部存储。这种拆分消除了 MemGPT 双层设计中的职责重叠。

### Memory Block

block 是 core 层中 typed、持久且可编辑的部分。原始 MemGPT 论文定义了两种：

- **Human block**——关于用户的事实（姓名、角色、偏好、目标）。
- **Persona block**——Agent 的自我概念（身份、语气、约束）。

Letta 将其推广到任意用户自定义 block：用于当前目标的 `Task` block、用于代码库事实的 `Project` block、用于硬性约束的 `Safety` block。每个 block 都有 `id`、`label`、`value`、`limit`（字符上限）和 `description`（让 Model 知道何时应编辑它）。

可以通过 Tool 接口编辑 block：

- `block_append(label, text)`
- `block_replace(label, old, new)`
- `block_read(label)`
- `block_summarize(label)`——压缩接近上限的 block。

### Sleep-time compute

Letta 在 2025 年新增的能力：在后台、关键路径之外运行第二个 Agent。Sleep-time Agent 处理对话 transcript 和代码库 Context，将 `learned_context` 写入共享 block，并整合 archival 记录或将其标记为无效。

由此得到以下特性：

- **没有延迟成本。** 主 Agent 的响应无需等待记忆操作完成。
- **允许使用更强的 Model。** Sleep-time Agent 可以使用成本更高、速度更慢的 Model，因为它不受延迟约束。
- **天然的整合窗口。** 在用户无需等待时执行去重、摘要，并将矛盾事实标记为无效。

这种形式与人类的工作方式相似：先完成任务，睡一觉，长期记忆在夜间逐渐稳定。

### Native reasoning

Letta V1（`letta_v1_agent`，2026）弃用了 `send_message`/heartbeat 和内联 `Thought:` Token，转而使用 native reasoning。Responses API（OpenAI）以及支持 extended thinking 的 Messages API（Anthropic）会在单独的 channel 中输出 reasoning，并在各轮之间传递（生产环境中跨 provider 时会加密）。控制循环仍然是 ReAct。thought trace 是结构性的，而不是由 Prompt 塑造的。

### 此模式容易出错的地方

- **Block 膨胀。** 无限执行 `block_append` 会迅速触及上限。在导致超出容量的写入之前接入 block summarizer。
- **静默漂移。** Sleep-time Agent 重写了 block，而主 Agent 从未察觉。为 block 添加版本，并在 trace 中显示 diff。
- **受污染的整合。** Sleep-time Agent 将攻击者可触达的内容处理后写入 core。Lesson 27 同样适用于 sleep-time 接口。

```figure
memory-blocks
```

## 动手构建

`code/main.py` 实现了：

- `Block`——id、label、value、limit、description。
- `BlockStore`——CRUD + `near_limit(label)` helper。
- 两个脚本化 Agent——`PrimaryAgent` 处理一轮请求，`SleepTimeAgent` 在各轮之间执行整合。
- 一段展示三轮对话及 block 写入的 trace，以及一次对 block 进行摘要并将过时事实标记为无效的 sleep-time pass。

运行：

```
python3 code/main.py
```

transcript 展示了职责拆分：主 Agent 的每轮处理速度快并产生原始写入；sleep pass 则进行压缩和清理。

## 实际使用

- **Letta**（letta.com）作为参考实现。可以自行托管或使用 managed cloud。
- **Claude Agent SDK skills** 作为 block 形态的知识——Skill 是一组具名、有版本、可检索的指令 block，Agent 会按需加载。
- **自定义实现** 适用于希望控制存储后端的团队。使用 Letta API contract，以便之后迁移。

## 交付成果

`outputs/skill-memory-blocks.md` 可为任意 runtime 生成 Letta 风格的 block 系统，并接入 sleep-time hook、安全规则和 citation wiring。

## 练习

1. 添加一个 `block_summarize` Tool：当 `near_limit` 返回 true 时，使用 Model 生成的摘要替换 block value。哪一个触发阈值能够同时尽量减少摘要调用和 block 溢出？
2. 为 archival 实现 sleep-time 去重：文本 Token 重叠超过 90% 的两条记录合并为一条。只在 sleep pass 中执行，绝不能放在关键路径上。
3. 为 block 添加版本。每次写入时记录旧 value 和 diff。开放 `block_history(label)`，使操作人员能够调试“Agent 为什么忘记了 X”。
4. 将 Sleep-time Agent 视为不可信写入者。当它们修改 Persona 或 Safety block 时，必须经过第二个 Agent 审查才能提交。
5. 将示例移植为使用 Letta API（`letta_v1_agent`）。block schema 会发生哪些变化？native reasoning 会如何改变 trace 的形态？

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|----------------|------------------------|
| Memory block | “可编辑的 Prompt 区段” | core memory 中 typed、持久且可由 LLM 编辑的区段 |
| Human block | “用户记忆” | 关于用户的事实，固定在 core 中 |
| Persona block | “Agent 身份” | 自我概念、语气和约束，固定在 core 中 |
| Sleep-time compute | “异步记忆工作” | 第二个 Agent 在关键路径之外执行整合 |
| Core / Recall / Archival | “层级” | 三层记忆拆分：始终可见 / 对话 / 外部 |
| Block limit | “上限” | 每个 block 的字符限制；强制执行摘要 |
| Native reasoning | “Thinking channel” | provider 层级的 reasoning 输出，而非 Prompt 层级的 `Thought:` |
| Learned context | “Sleep 输出” | Sleep-time Agent 写入共享 block 的事实 |

## 延伸阅读

- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks)——block 模式
- [Letta, Sleep-time Compute blog](https://www.letta.com/blog/sleep-time-compute)——异步整合
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent)——native reasoning 重写
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560)——起源
