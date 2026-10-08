# 独立编码代理 版图(2026)

> 现在,SWE-bench Verified 在不到三年内从4%升级到80.9%的比分.同一个Cloade Sonnet 4.5 在SWE-agent v1上得分43.2%,在Cline自主上得分59.8%的比分.如今,围绕模型的架架和模型本身一样重要.OpenHands (前身为OpenDevin) 是最活跃的MIT许可平台,它的CodeAct循环会直接在沙盒中执行Python的操作,而不是JSON的调用.

**类型：**学习 课程
**语言：**果版的数据,
**先修要求：**阶段14 · 07(工具使用),阶段15 · 01(长视线剂)
**时间：**约45分钟

## 问题

哪个编码代理最好是错误的问题. 正确的问题是:在与我的工作匹配的任务分布上,使用我会在生产中运行的架子,我能获得如何的端到端可靠性?

在2022年到2026年间,这个领域认识到架架 检索层、规划者、沙盒、编辑-验证循环、反格式  是承担重结构──Claude Sonnet 4.5 在SWE-agent v1上 SWE-bench 验证得分为43.2%;同一个模型放在Cline的自主架架 中分为59.8%──相同的重量,绝对差距16.6 分──基础模型是一个组件;循环才是产品──

随之而来的问题是基准和会掩盖退步──SWE-bench 验证已接近和,而轻松任务尾(500个任务中有161个只需要 ≤2 行) 会拉高顶部分数量──真实世界质量更适合在SWE-bench Pro(10+ 行修改) 这样的分布量度,在那里同样的领先系统仍然只有2359%──

## 概念

### 用一段话理解SWE-台

通过SWE-bench验证(OpenAI,2024) 是一个经过人工选的500个任务子集,移除含糊和损坏的任务──SWE-bench Pro 是更难的后续版本  任务要求10+ 行修改,目前的边境代理分为2359%──

### 2022 → 2026 曲线真正说明了什么

- **2022**研究模型在原始的SWE-上约4%──
- **2024**:GPT-4 + 德文式架子约14%;SWE代理约12%──
- **2025**们在们的们中,
- **2026**据SWE的证据显示,SWE的竞争对手已经达到7080%以上.

这条斜率来自三个叠加来源:更好的基础模型,更好的架构,更好的基准标准,更好的标,更好的标,更好的标.

### 工具调用

开手 (OpenHands(All-Hands-AI,arXiv:2407.16741,前身为OpenDevin) 打了一个特定的架构押注:不是让模型发出由主机解码并执行的JSON工具调用,而是让模型发出Python代码,并由Jupyter式内核在沙盒中运行.

权衡如下:

- **JSON tool calls**由于每次通话都经过了明显的验证器,因此:
- **CodeAct**需要硬化沙盒 (OpenHands 使用Docker隔离);失败模式包括沙盒运行时间允许任何行为――

两种架构都已被用于生产.CodeAct 在开放平台中占主导地位.

### 2026 版图中的架架

| Scaffold | License | Execution model | Notable property |
|---|---|---|---|
| OpenHands (OpenDevin) | MIT | Docker 中的 CodeAct | 最活跃的 open platform；event-stream 可 replay |
| SWE-agent | MIT | Agent-Computer Interface (ACI) | 第一个端到端 SWE-bench scaffold |
| Aider | Apache-2 | local repo 中 edit-via-diff | Minimal scaffold，regression stability 强 |
| Cline | Apache-2 | 带 tool policy 的 VS Code agent | Sonnet 4.5 上得分最高的 open scaffold |
| Devin (Cognition) | Proprietary | Managed VM + planner | 第一个“AI software engineer”产品类别 |
| Claude Code | Proprietary | Permission modes + routines | Lesson 10 会详细讲解 agent loop |

### 为什么架占主导地位

一次编码运行是长视线轨迹 (课 1) 可靠性会跨步骤复合――架在三个地方带来分数:

1. **Retrieval**发现需要读取的正确文件是沉默的瓶──SWE代理的ACI、OpenHands的文件索引,以及Aider的 repo-map都在解决这个问题──
2. **Verifier loop**运行测试,读取堆痕迹,再试一次,在SWE-bench上能带来10+分差.
3. **Failure containment**由于它是个不良的产品,它可以防止损失积累.

### 基准 和与真实分布

开手作者和时代AI都指出SWE-bench Verified 存在轻松尾巴:500个任务中有161个只需要12 行修改。高分部分由这个尾巴 驱动。SWE-bench Pro 限为10+ 行修改,即使在边界系统,分数也只有2359%──你的生产分布几乎肯定更接近Pro,而不是 Verified。

选择代理的含义是:在你的 bug 后备上运行一个类似 Pro 的子集.


```figure
a5-scaffold-delta
```

## 使用它

`code/main.py`在一个固定的迷你任务分布上比较两个玩具代理架:

1. 一个**JSON tool-call**架,每一个轮到,都采取行动.
2. 一个**CodeAct**脚架,每一个动作都可以发出一小段Python摘录.

两者都使用模 (模型) 确定性规则),因此将把架子与模型质量隔离――输出见面显示 CodeAct架子 用更少的转折 解决更多任务,代价是每个行动的爆炸半径更大――

## 交付它

`outputs/skill-scaffold-audit.md`帮助您采用拟议的编码代理架子 之前进行审计:检索质量,验证器存在,沙盒隔离以及基准配送适应性.

## 练习

1. 运行`code/main.py`在同一任务组上,每个架架需要多少转?每个架架的每动作爆炸射线是什么?

2. 阅读OpenHands论文 ((arXiv:2407.16741) ⋅该论文认为CodeAct在复杂任务上优于JSON工具调用――找出纸 承认一个失败模式,并写一句话说明该模式 什么时候会在生产中占主导――

3. 从你的错误后备中选择一个需要跨两个文件修改10+ 行的任务――估计边界模型 在 (a) JSON工具调用和 (b) CodeAct 下的端到端成功概率――说明差距的原因――

4. 设置一个排列的分数. 如何重新排列?

5. 阅读 引入SWE-bench Verified(OpenAI) ――解释用于移除模糊任务的具体方法,并说出一种策略 会漏掉的类别──

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|---|---|---|
| SWE-bench | “Coding benchmark” | 带有 ground-truth patches 和 test suites 的真实 GitHub issues |
| SWE-bench Verified | “Cleaned subset” | 500 个经过人工筛选的任务，存在 easier-tail |
| SWE-bench Pro | “Harder subset” | 10+ 行修改；frontier 得分为 23–59% |
| CodeAct | “Code-as-action” | Agent 发出 Python；Jupyter-style kernel 在 sandbox 中执行 |
| JSON tool call | “Function calling” | 每个 action 都是执行前经过验证的 structured JSON payload |
| Scaffold | “Agent framework” | 围绕基础模型的 retrieval + planner + executor + verifier loop |
| ACI (Agent-Computer Interface) | “SWE-agent's format” | 为 LLM ergonomics 设计的 command set，而不是 human shells |
| Verifier loop | “Test-and-retry” | 运行 tests、读取 output、修订 patch；最大的非模型可靠性收益 |

## 延伸阅读

- [Jimenez et al. — SWE-bench](https://www.swebench.com/) 原始基准和方法
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/)策划的子集是如何构建的.
- [Wang et al. — OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) CodeAct 架构和事件流设计
- [Epoch AI — SWE-bench leaderboard](https://epoch.ai/benchmarks) 实时追踪的成绩――
- [Anthropic — Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy)长视角编码剂可靠性框架――
