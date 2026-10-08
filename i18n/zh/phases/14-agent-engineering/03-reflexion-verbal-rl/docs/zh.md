# 思考:口头增强学习

> 基于Gradent的RL需要数千次试验和一个GPU集群才能修复一种失败模式. 思考Shinn et al.,NeurIPS 2023) 用自然语言完成这一事物:每次失败试验后,代理写下一段反思,将其存储在情节内存中,并让下一次试验基于这一段内存. 这就是Letta的睡眠时间计算,Claude Code的CLAUDE.md学习,以及 pro-workflow的学习规则背后的模式.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 02 (ReWOO)
**Time:** ~60 minutes

## 学习目标
- 描述反思的三个组件 (演员,评价者,自我反思者) 以及情节记忆的作用.
- 实现一个stdlib反思循环,包含二进制评估器、反思缓冲 和全新的重试――
- 针对给定任务,在规模化,理和自我评估反来源之间做选择.
- 解释为什么语言强化可以捕捉到基于基数的RL需要数千次试验才能修复错误――

## 问题
一个代理任务失败了. 在标准RL中,你会再运行数千次试验,计算梯度,更新重量.成本高,速度慢,而且大多数生产代理都没有针对每次失败进行训练预算.

思考Shinn等, arXiv:2303.11366) 提出了另一个问题:如果代理人只是想自己为什么失败,并把这个想法放进快速里再试一次,会怎样?没有重量更新.

结果是:在ALFWorld上,它超过了ReAct和其他非精细调化的基线.在HotpotQA上,它对ReAct有所提升.在HumanEval/MBPP代码生成中,它达到当时的最先进状态.整个过程没有一次渐进步骤.

## 概念
### 三个组成部分

```
Actor         : generates a trajectory (ReAct-style loop)
Evaluator     : scores the trajectory — binary, heuristic, or self-eval
Self-Reflector: writes a natural-language reflection on the failure
```

再加上一个数据结构:

```
Episodic memory: list of prior reflections, prepended to the next trial's prompt
```

一次试验会运行演员――评价者对它打分――如果得分较低,自我反射者会产生一段反思――我选择错误的工具,因为我把问题误读成问题X,而它实际上在问题Y)――这个反思将进入剧情记忆――下一次试验从头开始,但会看到这一段反思――

### 三种评估者类型

1. **Scalar** 外部二进制信号――ALF世界成功或失败――人类Eval测试 通过或失败――最简单,信号 最强――
2. **Heuristic** 预定义的失败签名── 如果代理连续两次产生相同的行动,就标记为了── 如果轨迹超过50步,就标记为不有效──
3. **Self-evaluated** LLM对自己的轨迹 打分──当没有基础真理 时需要它──信号较弱;适合工具基础验证 搭配使用(05课  批判性) ──

2026年默认做法是混合使用:可用时用尺度,不可用时用自行,学作为安全轨道.

### 为什么这将普遍化

反思与其说是一种新算法,不如说是一种命名模式.

- 雷塔的睡眠时间计算 (课时08):一个独立的代理 反思过去的对话并写入记忆区块.
- 克劳德代码的`CLAUDE.md`模式:将反思 捕获为学习,并预备到未来的会议.
- 工作流程的支持`/learn-rule`命令:将修正 捕获为显式规则――
- 兰格拉夫的反射节点:一个节点对输出打分,并在需要时路由到精炼.

它们都来自同一个见解:自然语言是一种足够丰富的媒介,可以在运行中携带我从失败中学到的东西.

### 什么时候有效,什么时候无效

适用于:

- 有明确的失败信号.
- 任务类 可复现(同类问题会再次出现)。
- 思考 有空间改善轨迹(有足够的行动预算)

反思不适用于:

- 经理第一次尝试已经成功了.
- 失败来自外部因素 网络下降 工具破裂 反思 网络下降 对未来运行 没有帮助
- 反映 变成迷信 为了一次偶尔发起的散运行 存储一段叙事.

2026 年的陷:记忆回路──反思会累积;其中一些已经过时或错误;随着剧情缓冲器变大,再运行会变慢──缓解方法:定期紧缩(06课)、对反思设置TTL,或使用单独的睡眠时间清洁剂(Letta)。


```figure
react-trace
```

## 构建它
`code/main.py`在一个玩具题上实现反思:生成一个3个元素列表,使其总和等于目标值.

组件:

- `Actor` 一个脚本的政策,在看着反思时会改进.
- `Evaluator.binary()` 基于目标数量的通过/失败.
- `SelfReflector` 生成一行失败诊断
- `EpisodicMemory` 一个带TTL语义的有限列表――

运行:

```
python3 code/main.py
```

追踪 展示三次试验――试验1 失败,存储一段反思;试验2 看到反思 后有所改进但仍失败;试验3 成功――与基线运行(没有反思) 对比

## 使用它
作为节点模式,LangGraph将反映提供――Claude Code的`/memory`命令和工作流程的支持`/learn-rule`将剧情缓冲器外部化为一个标记文件――Letta的睡眠时间计算 在停机时间 运行自反射器,使主要代理 继续受延迟 约束――OpenAI代理SDK 不直接提供反思;你可以使用一个按分数 拒绝轨迹的自定义护卫轨,以及一个可以跨运行保留的内存`Session`让我们来建造它.

## 交付它
`outputs/skill-reflexion-buffer.md`创建并维护一个节目缓冲,包含反射捕捉、TTL 和减倍.给定一个任务类和一次失败,它会产生一个真正帮助下一次试验反思.

## 练习
1. 从二进制评估器转换到返回距离测量器 (离目标有多远) 的规模评估器.
2. 对于反思 添加10次试验的TTL.
3. 实现论评估者:如果同一个行动重复出现,就将试验标记为着.
4. 用会忽略反思的对抗性演员 运行反思――为了迫使演员注意到它们,最小的反思快速工程是什么?
5. 阅读关于AlfWorld的反思论文中 第4节 从概念上复现的130%成功率改善:相对于尼拉 ReAct,关键的德尔塔是什么?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Reflexion | “Self-correction” | Shinn et al. 2023 — Actor、Evaluator、Self-Reflector 加 episodic memory |
| Verbal reinforcement | “Learning without gradients” | prepend 到下一次 trial prompt 的自然语言 reflection |
| Episodic memory | “Per-task reflections” | 针对一个 task class 的 prior reflections bounded buffer |
| Scalar evaluator | “Binary success signal” | 来自 ground truth 的 pass/fail 或 numeric score |
| Heuristic evaluator | “Pattern-based detector” | 预定义 failure signatures（例如 stuck-loop、too-many-steps） |
| Self-evaluator | “LLM-as-judge on own trace” | 没有 ground truth 时使用的 lower-signal fallback — 与 tool-grounded verification 搭配 |
| Memory rot | “Stale reflections” | Episodic buffer 被过时 entries 填满；用 compaction/TTL 修复 |
| Sleep-time reflection | “Async self-reflection” | 在 hot path 之外运行 Self-Reflector，使 primary agent 保持快速 |

## 延伸阅读
- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366) 经典纸
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute)生产 中的异步反射
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 将事件缓冲作为文本的一部分来管理
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)反射节点模式
