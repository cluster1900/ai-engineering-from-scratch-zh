# 基准测试：WebArena and OSWorld

> WebArena 在四个自托管 app 上测试 web-agent 能力。OSWorld 在 Ubuntu、Windows、macOS 上测试 desktop-agent 能力。在发布时（2023–2024），两者都显示出一流 agent 与人类之间存在巨大差距。差距正在缩小；failure modes 没有改变。

**类型：** 学习
**语言：** Python (stdlib)
**先修要求：** Phase 14 · 19 (SWE-bench, GAIA)
**时间：** 约 60 分钟

## 学习目标

- 描述 WebArena 的四个自托管 app，以及为什么基于执行的评估很重要。
- 解释为什么 OSWorld 使用真实 OS 截图，而不是 accessibility APIs。
- 说出两个主要的 OSWorld failure modes：GUI grounding 和 operational knowledge。
- 总结 OSWorld-G 和 OSWorld-Human 在基础 benchmark 之上增加了什么。

## 问题

通用型 agent 可以调用工具。它们能否在浏览器里完成 20 次点击，从而完成一次购物 checkout？它们能否只用键盘和鼠标配置一台 Linux 机器？这些就是 WebArena 和 OSWorld 回答的问题。

## 概念

### WebArena (Zhou et al., ICLR 2024)

- 覆盖四个自托管 web apps 的 812 个长程任务：购物网站、论坛、类 GitLab 的开发工具、商业 CMS。
- 另有实用工具：map、calculator、scratchpad。
- 评估通过 gym APIs 基于执行完成：订单是否已下单，issue 是否已关闭，CMS 页面是否已更新？
- 发布时：最佳 GPT-4 agent 达到 14.41% 成功率，而人类为 78.24%。

自托管设定很重要，因为目标 app 被固定且可复现，所以 benchmark 不会因为外部变化而不稳定。

### 扩展

- **VisualWebArena** — 视觉 grounding 任务，成功依赖于解读图像（截图作为一等 observation）。
- **TheAgentCompany** (Dec 2024) — 加入 terminal + coding；更像真实的远程工作环境。

### OSWorld (Xie et al., NeurIPS 2024)

- 覆盖 Ubuntu、Windows、macOS 的 369 个真实计算机任务。
- 对真实应用进行自由形式的键盘和鼠标控制。
- 以 1920×1080 截图作为 observation。
- 发布时：最佳 model 为 12.24%，人类为 72.36%。

### 主要 failure modes

1. **GUI grounding。** Pixel → element 映射。Model 很难在 1920×1080 中可靠定位 UI 元素。
2. **Operational knowledge。** 哪个菜单里有该设置，哪个 keyboard shortcut，哪个 preference pane。这是人类多年积累出来的知识长尾。

### 后续工作

- **OSWorld-G** — 564 个样本的 grounding suite + Jedi training set。将 grounding 与 planning 拆解开来，因此可以分别测量。
- **OSWorld-Human** — 人工整理的 gold action trajectories。显示顶级 agent 使用的步骤比必要步骤多 1.4-2.7x（trajectory-efficiency gap）。

### 为什么这很重要

Claude computer use、OpenAI CUA、Gemini 2.5 Computer Use（Lesson 21）都在由 WebArena 和 OSWorld 塑造的 workload 上训练。Benchmark 是目标；生产 model 是交付出来的答案。

### Benchmarking 容易出错的地方

- **仅截图 evals。** OSWorld 由截图驱动；如果在 OSWorld 上评估使用 DOM 或 accessibility APIs 的 agent，就会错过 grounding 挑战。
- **忽略 trajectory length。** 只按 success-rate 打分，会漏掉 OSWorld-Human 暴露的 1.4-2.7x 步骤低效。
- **陈旧的自托管 apps。** WebArena 的 apps 固定了特定版本；如果未经重新整理就更新版本，会破坏可比性。

```figure
ae-agent-human-gap
```

## 构建它

`code/main.py` 实现了一个 toy web-agent harness：

- 一个最小的“shopping app”状态机：list_items、add_to_cart、checkout。
- 3 个任务的 gold trajectories。
- 一个尝试每个任务的 scripted agent。
- 基于执行的 evaluator（状态检查）和 trajectory-efficiency metric（steps vs gold）。

运行它：

```
python3 code/main.py
```

输出：每个任务的成功率和 trajectory efficiency，对应 OSWorld-Human 的方法论。

## 使用它

- **WebArena Verified** 自托管在内部 cluster 上，用于持续评估。
- **OSWorld** 运行在 VM fleet 中，用于 desktop agents。
- **Computer-use agents**（Lesson 21）— Claude、OpenAI CUA、Gemini — 都在类似这类 workload 上训练。
- **你自己的产品流程** — 为最重要的 20 个任务捕获 gold trajectories；每周用它们测试 agent。

## 交付它

`outputs/skill-web-desktop-harness.md` 构建一个 web/desktop agent harness，包含基于执行的 eval 和 trajectory efficiency metric。

## 练习

1. 用第二个 app（论坛）扩展 toy harness。编写 3 个任务和 gold trajectories。
2. 添加按任务报告的 trajectory-efficiency。在你的 toy 中，agent 是 gold 的 1x、2x 还是 3x？
3. 实现一个“distractor”工具，即 gold trajectory 从不使用的工具。Scripted agent 会被诱导吗？
4. 阅读 OSWorld-G。你会如何在自己的 evals 中区分 grounding failures 与 planning failures？
5. 阅读 WebArena 的 apps README。当你升级某个固定 app 版本时，会破坏什么？

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| WebArena | "Web agent benchmark" | 覆盖 4 个自托管 apps 的 812 个任务；gym-style evaluation |
| VisualWebArena | "Visual WebArena" | 视觉 grounding 的 WebArena；截图是 observations |
| OSWorld | "Desktop agent benchmark" | 在真实 Ubuntu/Windows/macOS 上的 369 个任务 |
| GUI grounding | "Pixel-to-element mapping" | Model 在 1920x1080 中定位 UI 元素 |
| Operational knowledge | "OS know-how" | 哪个菜单、哪个 shortcut、哪个 preference pane |
| OSWorld-G | "Grounding suite" | 564 个仅 grounding 样本 + training set |
| OSWorld-Human | "Gold trajectories" | 用于衡量效率的人工专家动作序列 |
| Trajectory efficiency | "Steps over gold" | Agent 步数除以人类最小步数 |

## 延伸阅读

- [Zhou et al., WebArena (arXiv:2307.13854)](https://arxiv.org/abs/2307.13854) — 四 app web benchmark
- [Xie et al., OSWorld (arXiv:2404.07972)](https://arxiv.org/abs/2404.07972) — 跨 OS desktop benchmark
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) — Claude 由 benchmark 塑造的能力
- [OpenAI, Computer-Using Agent](https://openai.com/index/computer-using-agent/) — OSWorld 和 WebArena 数字
