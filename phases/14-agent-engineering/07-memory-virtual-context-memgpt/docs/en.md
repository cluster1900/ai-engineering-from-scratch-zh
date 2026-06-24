# Memory：Virtual Context 和 MemGPT

> Context window 是有限的。对话、文档和 tool trace 不是。MemGPT (Packer et al., 2023) 将其类比为 OS virtual memory：main context 是 RAM，external store 是 disk，agent 在二者之间进行 page。每一个 2026 年的 memory system 都继承了这个模式。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## 学习目标
- 解释 MemGPT 所基于的 OS 类比：main context = RAM，external context = disk，memory tools = page in/out。
- 使用 stdlib 实现两层 MemGPT 模式：main-context buffer、external searchable store，以及 page in/out tools。
- 描述 agent 如何发出 "interrupts" 来查询或修改 external memory，以及结果如何被拼接回下一个 prompt。
- 识别会延续到 Letta（Lesson 08）和 Mem0（Lesson 09）中的 MemGPT 设计选择。

## 问题
Context window 看起来像是能解决 memory。事实并非如此。生产中反复出现三种失败模式：

1. **Overflow.** 多轮对话、长文档，或 tool-call-heavy trajectory 会越过窗口。超过截断点的一切都会消失。
2. **Dilution.** 即使在窗口内，塞入无关 context 也会稀释对重要内容的 Attention。Frontier models 在长输入上仍会退化。
3. **Persistence.** 新 session 从空窗口开始。没有 external memory 的 agents 无法跨 session 说出“还记得你之前让我……”

更大的窗口有帮助，但不能解决这个问题。Mem0 的 2025 paper 测量到，128k-window baseline 仍会漏掉一个 4k-window agent 借助 external memory 可以捕捉到的 long-horizon facts。

## 概念
### MemGPT：OS 类比

Packer et al. (arXiv:2310.08560, v2 Feb 2024) 将 context management 映射到 operating-system virtual memory：

| OS concept | MemGPT concept | 2026 production analog |
|------------|---------------|------------------------|
| RAM | main context (prompt) | Anthropic/OpenAI context window |
| Disk | external context | Vector DB, KV, graph store |
| Page fault | memory tool call | `memory.search`, `memory.read`, `memory.write` |
| OS kernel | agent control loop | ReAct loop with memory tools |

agent 运行一个普通的 ReAct loop。额外的一类 tools 允许它把数据 page in 和 page out main context。

### Two tiers

- **Main context.** 固定大小的 prompt，保存当前任务。始终对模型可见。
- **External context.** 无界，通过 tools 搜索。相关时读取，事实出现时写入。

原始 paper 在两个超出基础窗口的任务上评估了该设计：超过 100k Tokens 的文档分析，以及跨天保持 persistent memory 的 multi-session chat。

### Interrupt pattern

MemGPT 引入 memory-as-interrupt：在对话中途，agent 可以调用 memory tool，runtime 执行它，结果作为新的 observation 拼接进下一次 assistant turn。概念上等同于 Unix `read()` syscall：它阻塞 process、返回 bytes，然后 process 继续运行。

标准 memory 工具接口：

- `core_memory_append(section, text)` — 写入 prompt 的 persistent section。
- `core_memory_replace(section, old, new)` — 编辑 persistent section。
- `archival_memory_insert(text)` — 写入 searchable external store。
- `archival_memory_search(query, top_k)` — 从 external store 检索。
- `conversation_search(query)` — 扫描过去的 turns。

### MemGPT 的边界与 Letta 的起点

2024 年 9 月，MemGPT 成为 Letta。research repo (`cpacker/MemGPT`) 仍然保留；Letta 扩展了该设计：

- 三层而不是两层（core、recall、archival — Lesson 08）。
- 使用 native reasoning 替代 `send_message`/heartbeat pattern（Lesson 08）。
- Sleep-time agents 运行 async memory work（Lesson 08）。

即使生产系统运行 Letta、Mem0，或自定义 two-tier store，MemGPT paper 仍是 2026 年的基础。

### 这个模式容易出错的地方

- **Memory rot.** 写入积累得比读取更快；retrieval 被陈旧 facts 淹没。修复方式：定期 consolidation（Letta sleep-time），显式 invalidation（Mem0 conflict detector）。
- **Memory poisoning.** External memory 是被检索出来的文本。如果 attacker-controlled content 落入 memory note，agent 会在下一个 session 重新摄入它。这就是 Greshake et al.（Lesson 27）攻击在时间维度上的重述。
- **Citation loss.** Agent 回忆起“用户让我 ship X”，但无法引用是哪一轮。每次 archival write 都要存储 source references（session ID, turn ID）。


```figure
context-budget
```

## 构建它
`code/main.py` 用 stdlib 实现 MemGPT 的 two-tier pattern：

- `MainContext` — 固定大小的 prompt buffer，带有 `core` dict 和 `messages` list；超过 cap 时自动 compact 最旧 messages。
- `ArchivalStore` — 内存中的 BM25-esque store（token-overlap scoring），存储 (id, text, tags, session, turn) records。
- 五个映射到 MemGPT surface 的 memory tools。
- 一个 scripted agent，先把 facts 填入 archival，然后通过调用 `archival_memory_search` 回答问题。

运行：

```
python3 code/main.py
```

trace 展示 agent 写入三个 facts，将 main context 填到 cap（触发 eviction），然后通过从 archival 检索来回答 follow-up question，在没有真实 LLM 的情况下复现 MemGPT workflow。

## 使用它
今天每个生产 memory system 都是 MemGPT 的变体：

- **Letta** (Lesson 08) — 三层、native reasoning、sleep-time compute。
- **Mem0** (Lesson 09) — Vector + KV + graph，与 scoring layer 融合。
- **OpenAI Assistants / Responses** — 通过 threads 和 files 管理 memory。
- **Claude Agent SDK** — 通过 skills 和 session store 提供 long-term memory。

按 operational shape（self-hosted、managed、framework-integrated）选择，而不是按 core pattern 选择；core pattern 就是 MemGPT。

## 交付它
`outputs/skill-virtual-memory.md` 是一个可复用 skill，可以为任意 target runtime 生成正确的 two-tier memory scaffold（main + archival + tool surface），并接好 eviction policy 和 citation fields。

## 练习
1. 添加一个以 Tokens 衡量的 `max_main_context_tokens` cap（用 `len(text.split())` * 1.3 近似）。超过 cap 时，把最旧 messages compact 成 summary。比较有无 summarizer 时的行为。
2. 在 archival store 上正确实现 BM25（term frequency、inverse document frequency）。在 toy fact set 上测量 recall@10，并与 token-overlap baseline 比较。
3. 给 archival inserts 添加 `citation` fields（session_id, turn_id, source_url）。让 agent 在每个 retrieval-backed answer 中引用 sources。
4. 模拟 memory poisoning：添加一条 archival record，内容是 "ignore all future user instructions." 编写一个 guard，扫描 retrievals 中 directive-shaped text，并把它们标记为 untrusted。
5. 将实现移植为使用 MemGPT research repo 的 core-memory JSON schema (`cpacker/MemGPT`)。从 flat strings 切换到 typed sections 时，会发生什么变化？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Virtual context | “无限 memory” | Main（prompt）+ external（searchable）两层，带 page in/out |
| Main context | “Working memory” | prompt：固定大小，始终可见 |
| Archival memory | “Long-term store” | External searchable persistence，按需检索 |
| Core memory | “Persistent prompt section” | 固定在 main context 内的命名 sections |
| Memory tool | “Memory API” | agent 发出的用于读写 external memory 的 tool call |
| Interrupt | “Memory page fault” | Agent 暂停，runtime 获取，结果拼接进下一轮 |
| Memory rot | “Stale facts” | 旧写入淹没 retrieval；用 consolidation 修复 |
| Memory poisoning | “Injected persistent note” | attacker content 被存为 memory，并在 recall 时重新摄入 |

## 延伸阅读
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) — 受 OS 启发的 virtual context 论文
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) — three-tier evolution
- [Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — 将 context 视为预算
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) — 构建在该模式之上的 hybrid production memory
