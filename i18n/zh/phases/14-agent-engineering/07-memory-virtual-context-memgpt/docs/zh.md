# 记忆:虚拟文本和MemGPT

> 文本窗口是有限的――对话、文档和工具追踪 不是――MemGPT (Packer等, 2023) 将其归类为OS虚拟内存:主文本是 RAM,外部存储是磁盘,代理在两者之间进行页面──每一个2026年内存系统都继承了这个模式──

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## 学习目标
- 解释 MemGPT 所基于的操作系统类比:主语境 = RAM,外部语境 = 磁盘,内存工具 = 页面入/出.
- 使用 stdlib 实现两层 MemGPT 模式:主文本缓冲器,外部可搜索的存储器以及页面入/出工具──
- 描述代理 如何发出"中断"来查询或修改外部内存,以及结果如何拼接回下一个提示.
- 识别会延续到Letta(第08课和第09课中的MemGPT设计选择──

## 问题
背景窗口看起来像是能解决记忆的――事实并非如此――生产中反复出现三种失败模式:

1. **Overflow.**通过窗口,超过截止点,一切都会消失.
2. **Dilution.**即使在窗户内,塞入无关的背景也会稀释重要内容的注意力.
3. **Persistence.**新会议从空窗开始. 没有外部记忆的代理人无法跨会议说出还记得你之前让我......

更多的窗户有助于,但无法解决这个问题. 根据Mem0的2025年论文, 测量到128k窗口的基线,

## 概念
### 类比: 其他类比

包克等人 (arXiv:2310.08560, v2 Feb 2024) 将文本管理映射到操作系统虚拟内存:

| OS concept | MemGPT concept | 2026 production analog |
|------------|---------------|------------------------|
| RAM | main context (prompt) | Anthropic/OpenAI context window |
| Disk | external context | Vector DB, KV, graph store |
| Page fault | memory tool call | `memory.search`, `memory.read`, `memory.write` |
| OS kernel | agent control loop | ReAct loop with memory tools |

代理运行一个普通的ReAct循环. 额外的工具允许它将数据页面在和页面的主语境中.

### 两层

- **Main context.**固定大小的提示,保存当前任务──始终对模型可见──
- **External context.**无界,通过工具 搜索. 相关时读取. 事实出现时写入.

首稿在两个超出基础窗口的任务中评估了该设计: 100k 多个代币的文档分析,以及跨日保持持久记忆的多次会议聊天.

### 断断模式

MemGPT 引入记忆作为中断:在对话中途,代理可以调用记忆工具,运行时间 执行它,结果作为新的观察 拼接进下一次助理转.`read()`系统调用:它阻碍了进程,返回字节,然后进程继续运行.

标准记忆 工具接口:

- `core_memory_append(section, text)` 写入提示的持续部分──
- `core_memory_replace(section, old, new)` 编辑持续部分──
- `archival_memory_insert(text)` 写入可搜索的外部商店──
- `archival_memory_search(query, top_k)`从外部商店检索
- `conversation_search(query)`扫描过去的转折.

###  MemGPT的边界与Letta的起点

作为一个研究报告的核心,`cpacker/MemGPT`) 仍保留; 延长该设计:

- 没有任何问题,但我们必须要做出一些努力.
- 使用本地推理 替代`send_message`没有什么可说的.
- 睡眠时间代理运行非同步记忆工作 (课时08)

即使生产系统运行Letta、Mem0,或自定义双层商店,MemGPT纸仍然是2026年基础.

### 这个模式很容易出错的地方

- **Memory rot.**写入积累得比读取更快;检索 被陈旧事实淹没──修复方式:定期整合(晚睡时间),显然无效(Mem0冲突探测器)──
- **Memory poisoning.**如果攻击者控制的内容落入记忆录,代理会在下一个会议重新摄入它.
- **Citation loss.**记住用户让我发送X,但不能引用是哪一轮――每次存档写都需要存储源引用(会议ID,转换ID) ――


```figure
context-budget
```

## 构建它
`code/main.py`用stdlib 实现 MemGPT的两层模式:

- `MainContext` 固定大小的快速缓冲,带有`core`命令和`messages`超过封顶 时自动紧 最旧消息──
- `ArchivalStore`内存中的BM25-esque存储 (图标重叠),存储 (ID,文字,标签,会议,转换) 记录──
- 五个映射到MemGPT表面的记忆工具――
- 一个编写的代理,先把事实填写在档案中,然后通过调用.`archival_memory_search`回答问题.

运行:

```
python3 code/main.py
```

追踪 展示代理 写入三个事实,将主要文本 填到封面,然后通过档案检查来回答后续问题,在没有真实的LLM的情况下复现 MemGPT工作流程──

## 使用它
今天每个生产内存系统都是MemGPT的变体:

- **Letta**三层,原生推理,睡眠时间计算.
- **Mem0**向量+KV+图,与分数层融合──
- **OpenAI Assistants / Responses** 通过线程和文件管理内存.
- **Claude Agent SDK**通过技能和会议存储提供长期记忆.

根据操作形状 (自主托管,管理,框架集成) 选择,而不是根据核心模式选择;核心模式就是MemGPT。

## 交付它
`outputs/skill-virtual-memory.md`是一个可复制的技能,可以为任意目标运行时间 生成正确的两个层次的内存架 ((主 + 档案 + 工具表面),并接好驱逐政策 和引用字段。

## 练习
1. 添加一个以代币 量`max_main_context_tokens``len(text.split())`总结: 较有没有总结器的行为.
2. 在档案商店上正确实现BM25 ((术语频率、反向文档频率) ⋅在玩具事实集上测量回忆@10,并与代币重叠基线比较──
3. 给档案插件 添加`citation`让代理在每个回复支持中引用来源.
4. 模拟记忆中毒:添加一条档案记录,内容是"忽略所有未来用户说明".编写一个警卫,扫描检索中指示形文字,并把它们标记为不值得信赖的──
5. 将实现移植为使用 MemGPT研究 repo 的核心内存 JSON 方案 (`cpacker/MemGPT`什么会发生变化?

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
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) 受 OS 启发的虚拟环境论文
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks)三层次的进化
- [Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 将环境视为预算
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) 构建在该模式上混合生产内存
