# 记忆区块和睡眠时间计算 (Letta)

> 2024年成为Letta.2026年的演变加入了两个想法:模型可以直接编辑分离功能性记忆区块,以及在主要代理空时异步整合记忆的睡眠时间代理.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT)
**Time:** ~75 minutes

## 学习目标
- 解释Letta使用的三层记忆 (核心,回忆,档案) 以及每个层的作用.
- 解释内存区块模式:人区块、个人区块以及作为一等类型的类型对象的用户定义区块──
- 描述睡眠时间计算是什么,为什么它位于关键路径之外,以及为什么它可以运行比主要代理更强的模型.
- 实现一个编写的双代理循环,其中的主要代理提供响应,睡眠时间代理在轮次之间整合块.

## 问题
后面出现了三个生产问题:

1. **Latency.**每个存储器操作都处于关键路径上. 如果代理必须在用户等待时进行剪裁,总结或调整,尾声延迟会急剧上升.
2. **Memory rot.**写入会不断积累――被矛盾推翻的事实会留下――检索会被陈旧内容淹没――
3. **Structure loss.**平的档案库 无法表达 人块 总是在提示中;人块 总是在提示中;任务块 按会议交换。

雷塔 (letta.com) 是2026年重写版本──记忆区块让结构显式化;睡眠时间计算将整合移动到关键路径──

## 概念
### 三个层

| Tier | Scope | Where it lives | Written by |
|------|-------|----------------|------------|
| Core | 始终可见 | 在 main prompt 内 | Agent tool call + sleep-time rewrites |
| Recall | 对话历史 | 可检索 | 自动轮次日志 |
| Archival | 任意事实 | Vector + KV + graph | Agent tool call + sleep-time ingest |

核心是MemGPT核心──回忆是对话缓冲器及其被驱逐的尾部──档案是外部存储器──这个分拆清理了MemGPT的两层重载──

### 记忆区块

区块是核心层中一个类型的,持续的,可编辑的部分. 原始的 MemGPT 纸定义了两个:

- **Human block** 关于用户的事实 (姓名,角色,偏好,目标)
- **Persona block**代理的自我概念 (身份,语气,约束)

雷塔将其泛化为任意用户定义的区块:用于当前目标`Task`区块,用于代码基础事实`Project`块,用于硬约束`Safety`每个街区都有`id`,我知道.`label`,我知道.`value`,我知道.`limit`没有任何其他方法.`description`(让模型知道何时编辑它)

块可通过工具表面 编辑:

- `block_append(label, text)`
- `block_replace(label, old, new)`
- `block_read(label)`
- `block_summarize(label)` 压缩接近极限的块――

### 睡眠时间计算

2025年Letta的新增项:在后台运行第二个代理,位于关键路径之外.`learned_context`写入共享区块,并整合或作废弃档案记录.

得到的属性:

- **No latency cost.**预测时间:
- **Stronger model allowed.**睡眠时间代理可能更昂贵,更慢的模型,因为它不受延迟约束.
- **Natural consolidation window.**当用户不等时,进行重复,总结,废弃矛盾事实.

这种形状符合人类的工作方式:你完成任务,睡觉,长期记忆在夜间沉下来.

### 雷塔V1与原生推理

雷塔 V1 (`letta_v1_agent`废弃使用`send_message`心跳和直线`Thought:`转而支持本土推理. 答案API (OpenAI) 和带延长思维的消息API (Anthropic) 会在单独的道上发出推理,并跨轮次传递.

### 这个模式很容易出错的地方

- **Block bloat.**无限`block_append`会很快触及限制.
- **Silent drift.**睡眠时间代理重写区块,而主要代理从未注意到.
- **Poisoned consolidation.**睡眠时间代理将攻击者可触及内容处理到核心中.27课.


```figure
memory-blocks
```

## 构建它
`code/main.py`实现了:

- `Block` id、标签、值、限制、描述──
- `BlockStore`   `near_limit(label)`助手
- 两种编写代理`PrimaryAgent`服务一个轮次,`SleepTimeAgent`在轮次之间整合.
- 一条条标记,展示包含区块写的三轮对话,以及一次睡眠时间通过,它总结了一个区块并作废旧事实.

运行:

```
python3 code/main.py
```

转录 显示了这种分离:初级转变 很快并产生原始写入;睡眠通行 负责压缩和清理.

## 使用它
- **Letta**作为参考实现──可自主托管或使用管理云──
- **Claude Agent SDK skills**作为一个块形知识 技能是一个具名,带版本,可检查的指令块,代理可按需加载.
- **Custom builds**适用于希望控制存储后端的团队――使用Letta API合同,以便后续迁移――

## 交付它
`outputs/skill-memory-blocks.md`随意运行时 生成一个Letta形状的区块系统,带有睡眠时间,包括安全规则和引用线程.

## 练习
1. 添加一个`block_summarize`工具:当`near_limit`返回 true 时,使用模型生成的总结 替换区块值──哪个触发值可以同时最小化总结调用 和区块溢出?
2. 在档案上实现睡眠时间的减算:两个记录的文本有 >90%的代币重叠 时折叠为一个.
3. 为区块加版本. 每次写都记录旧值和差异. 暴露.`block_history(label)`让操作员可以调试为什么代理忘记X.
4. 让睡眠时间代理 视为不值得信赖的作家.
5. 将例移植为使用Letta API (`letta_v1_agent`如何改变痕迹形状?

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
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) 块图案
- [Letta, Sleep-time Compute blog](https://www.letta.com/blog/sleep-time-compute) 异步整合
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent) 原生推理 重写
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) 起源
