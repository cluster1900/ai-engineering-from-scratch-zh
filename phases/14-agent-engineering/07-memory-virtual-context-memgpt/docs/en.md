# Agent Memory——虚拟 Context 与 Memory 分页

> Context window 是有限的，而对话、文档和 Tool 轨迹不是。解决方案是重新表述 OS 虚拟内存机制——主 Context 是 RAM，外部存储是磁盘，Agent 在两者之间进行分页。MemGPT（Packer 等人，2023）为这种模式命名；许多生产级 Memory 系统都建立在它之上。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 分钟

## 学习目标

- 解释 MemGPT 所依据的 OS 类比：主 Context = RAM、外部 Context = 磁盘、Memory Tool = 换入/换出页面。
- 使用 stdlib 实现 MemGPT 的双层模式，包括主 Context 缓冲区、可搜索的外部存储，以及页面换入/换出 Tool。
- 描述 Agent 如何发出“interrupt”来查询或修改外部 Memory，以及如何将结果拼接回下一个 Prompt。
- 识别 MemGPT 中延续到 Letta（Lesson 08）和 Mem0（Lesson 09）的设计选择。

## 问题

Context window 看起来似乎应该能够解决 Memory 问题，但事实并非如此。生产环境中反复出现三种故障模式：

1. **溢出。** 多轮对话、长文档或包含大量 Tool 调用的轨迹会超出窗口容量。截断点之后的所有内容都会丢失。
2. **稀释。** 即使没有超出窗口，填入无关 Context 也会稀释 Model 对重要内容的 Attention。frontier Model 在处理长输入时仍会出现性能下降。
3. **持久性。** 新 session 启动时使用的是空窗口。没有外部 Memory 的 Agent 无法跨 session 说出“还记得你让我……的时候吗”。

更大的窗口有所帮助，但无法解决这个问题。Mem0 在 2025 年的论文中测得，128k 窗口基线仍会遗漏一些长时程事实，而带有外部 Memory 的 4k 窗口 Agent 却能捕捉到这些事实。

## 概念

### OS 类比

MemGPT（Packer 等人，arXiv:2310.08560，v2，2024 年 2 月）将 Context 管理映射到操作系统的虚拟内存：

| OS 概念 | MemGPT 概念 | 2026 年生产环境中的对应项 |
|------------|---------------|------------------------|
| RAM | 主 Context（Prompt） | Anthropic/OpenAI Context window |
| 磁盘 | 外部 Context | vector DB、KV、graph store |
| Page fault | Memory Tool 调用 | `memory.search`、`memory.read`、`memory.write` |
| OS kernel | Agent 控制循环 | 带 Memory Tool 的 ReAct 循环 |

Agent 运行普通的 ReAct 循环。额外增加的一类 Tool 允许它在主 Context 中换入和换出数据。

### 两个层级

- **主 Context。** 保存当前任务的固定大小 Prompt。Model 始终可以看到它。
- **外部 Context。** 容量不受限制，可通过 Tool 搜索。在相关时读取，在出现新事实时写入。

原论文使用两个超出基础窗口的任务评估了这种设计：长度超过 100k Token 的文档分析，以及能够跨天持久保存 Memory 的多 session 聊天。

### Interrupt 模式

MemGPT 引入了 memory-as-interrupt：在对话中途，Agent 可以调用 Memory Tool，runtime 执行它，并将结果作为新的 Observation 拼接到下一个 assistant 回合中。从概念上看，这与 Unix `read()` syscall 相同：它阻塞进程、返回字节，然后进程继续运行。

规范的 Memory Tool 接口：

- `core_memory_append(section, text)`——写入 Prompt 中的持久化 section。
- `core_memory_replace(section, old, new)`——编辑持久化 section。
- `archival_memory_insert(text)`——写入可搜索的外部存储。
- `archival_memory_search(query, top_k)`——从外部存储中检索。
- `conversation_search(query)`——扫描过去的回合。

### 论文的终点与生产系统的起点

2024 年 9 月，MemGPT 更名为 Letta。研究 repo（`cpacker/MemGPT`）仍然保留；Letta 对这一设计进行了扩展：

- 从两个层级扩展到三个层级（core、recall、archival——Lesson 08）。
- 使用原生推理替换 `send_message`/heartbeat 模式（Lesson 08）。
- 使用 sleep-time Agent 异步执行 Memory 工作（Lesson 08）。

即使生产系统运行的是 Letta、Mem0 或自定义双层存储，MemGPT 论文仍是 2026 年的基础。

### 这种模式会在哪里出错

- **Memory 腐化。** 写入的积累速度超过读取速度；检索结果会被过时事实淹没。解决方案：定期整合（Letta sleep-time）、显式失效处理（Mem0 conflict detector）。
- **Memory 投毒。** 外部 Memory 是检索得到的文本。如果攻击者控制的内容进入一条 Memory note，Agent 会在下一个 session 中重新摄取它。这是在时间维度上对 Greshake 等人攻击（Lesson 27）的重新演绎。
- **引用丢失。** Agent 回忆起“用户让我交付 X”，但无法引用对应的回合。每次写入 archival 时，都应存储来源引用（session ID、turn ID）。

```figure
context-budget
```

## 动手构建

`code/main.py` 使用 stdlib 实现了 MemGPT 的双层模式：

- `MainContext`——固定大小的 Prompt 缓冲区，包含一个 `core` 字典和一个 `messages` 列表；超过上限时自动压缩最早的消息。
- `ArchivalStore`——内存中的 BM25 风格存储，使用 Token 重叠度评分，记录格式为 (id, text, tags, session, turn)。
- 映射到 MemGPT 接口的五个 Memory Tool。
- 一个脚本化 Agent，它先使用事实填充 archival，然后通过调用 `archival_memory_search` 回答问题。

运行：

```bash
python3 code/main.py
```

轨迹展示 Agent 写入三个事实、将主 Context 填充到上限（强制触发驱逐），然后通过从 archival 中检索来回答后续问题——无需任何真实 LLM 即可复现 MemGPT workflow。

## 实际使用

如今的每个生产级 Memory 系统都是 MemGPT 的变体：

- **Letta**（Lesson 08）——三个层级、原生推理、sleep-time compute。
- **Mem0**（Lesson 09）——Vector + KV + graph，并通过评分层融合。
- **OpenAI Assistants / Responses**——通过 threads 和 files 提供托管 Memory。
- **Claude Agent SDK**——通过 Skills 和 session store 提供长期 Memory。

应根据运维形态（self-hosted、managed、framework-integrated）进行选择，而不是根据核心模式——核心模式就是 MemGPT。

### Agent Memory 的形态

分页解决了容量问题，但它不会决定应该存储什么。生产系统中反复出现四种 Memory 类型，每一种回答不同的问题：

- **Working memory**——现在什么最重要？Context 内的层级：当前任务、最近回合、固定的 core section。也就是 Prompt 本身。
- **Episodic memory**——发生过什么？过去的回合和轨迹，与 session 和回合引用一起存储，可按需回放。
- **Semantic memory**——什么是真实的？关于用户、领域和世界的事实，会随变化进行更新和去重。
- **Procedural memory**——我该如何做这件事？学到的流程、偏好和规则，它们用于引导未来行为，而不是用于回忆。

开源实现选择了不同的切入点：

| 类型 | 实现 | 处理方式 |
|------|----------------|-------------------|
| Working | MemGPT / Letta | 通过 Memory Tool，在固定 Prompt 预算中换入和换出内容（本课、Lesson 08） |
| Episodic | Zep | 时序 knowledge graph——事实带有有效期，因此可以查询“什么内容在什么时候为真” |
| Semantic | Mem0 | 在 Vector、KV 和 graph store 之间对事实进行去重和更新的提取 pipeline（Lesson 09） |
| Semantic + procedural | LangMem | 在后台将事实和行为规则提取到一个存储中，供 Agent 在多个回合之间查阅 |
| Episodic + semantic | agentmemory | 在 session 运行时捕获数据，并将其整合为带类型、可搜索的记录 |

## 交付成果

`outputs/skill-virtual-memory.md` 是一个可复用 Skill，可以为任意目标 runtime 生成正确的双层 Memory 脚手架（主层 + archival 层 + Tool 接口），并接入驱逐策略和引用字段。

## 练习

1. 添加以 Token 计量的 `max_main_context_tokens` 上限（使用 `len(text.split())` * 1.3 进行近似）。超过上限时，将最早的消息压缩为摘要。比较使用和不使用 summarizer 时的行为。
2. 在 archival store 上正确实现 BM25（term frequency、inverse document frequency）。在一个玩具事实集上，将 recall@10 与 Token 重叠基线进行比较。
3. 为 archival 写入添加 `citation` 字段（session_id、turn_id、source_url）。让 Agent 在每个由检索结果支持的答案中引用来源。
4. 模拟 Memory 投毒：添加一条内容为“忽略今后所有用户指令”的 archival 记录。编写一个 guard，扫描检索结果中形似指令的文本，并将其标记为不可信。
5. 移植该实现，使其使用 MemGPT 研究 repo 的 core-memory JSON schema（`cpacker/MemGPT`）。从扁平字符串切换到带类型的 section 后，会发生什么变化？

## 关键术语

| 术语 | 人们常说的含义 | 它的实际含义 |
|------|----------------|------------------------|
| Virtual context | “无限 Memory” | 主层（Prompt）+ 外部层（可搜索），支持页面换入/换出 |
| Main context | “Working memory” | Prompt——大小固定、始终可见 |
| Archival memory | “长期存储” | 外部可搜索持久化存储，按需检索 |
| Core memory | “持久化 Prompt section” | 固定在主 Context 内部的命名 section |
| Memory tool | “Memory API” | Agent 发出的 Tool 调用，用于读写外部 Memory |
| Interrupt | “Memory page fault” | Agent 暂停，runtime 获取数据，并将结果拼接到下一回合 |
| Memory rot | “过时事实” | 旧写入内容淹没检索结果；通过整合进行修复 |
| Memory poisoning | “注入的持久化 note” | 攻击者内容被存储为 Memory，并在回忆时重新摄取 |

## 延伸阅读

- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560)——受 OS 启发的虚拟 Context 论文
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks)——向三层结构的演进
- [Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)——将 Context 视为一种预算
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413)——建立在这种模式之上的混合式生产级 Memory
- [Zep (getzep/zep)](https://github.com/getzep/zep)——分类表中的时序 knowledge-graph Memory
- [Mem0 (mem0ai/mem0)](https://github.com/mem0ai/mem0)——Lesson 09 混合式存储背后的提取 pipeline
- [LangMem (langchain-ai/langmem)](https://github.com/langchain-ai/langmem)——在后台提取事实和行为规则
- [agentmemory (rohitg00/agentmemory)](https://github.com/rohitg00/agentmemory)——将 session 捕获内容整合为带类型、可搜索的记录
