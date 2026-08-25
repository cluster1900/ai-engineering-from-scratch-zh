# AI Scientist v2 — Workshop 级自主研究

> Sakana 的 AI Scientist v2 (Yamada et al., arXiv:2504.08066) 运行完整的研究循环：假设、代码、实验、图表、写作、投稿。它是第一个让生成论文通过 ICLR 2025 workshop peer review 的系统。独立评估 (Beel et al.) 发现，42% 的实验因编码错误失败，literature review 也经常把既有概念错误标记为 novel。Sakana 自己的 docs 警告说，该 codebase 会执行 LLM 编写的代码，并建议使用 Docker 隔离。这两半图景共同构成了重点。

**Type:** Learn
**Languages:** Python (stdlib, research-loop state-machine toy)
**Prerequisites:** Phase 15 · 03 (AlphaEvolve), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

研究是一项开放式任务。不同于 AlphaEvolve 的算法搜索或 DGM 受 benchmark 约束的自我修改，研究结果没有机器可检查的正确性标准。论文由 reviewer 判断，而不是由 unit tests 判断。这让循环更难闭合；一旦闭合也更有价值，因为研究正是复利式进展发生的地方。

AI Scientist v1 (Sakana, 2024) 通过从人类编写的 template 开始来闭合循环。LLM 在固定脚手架内填入实验。AI Scientist v2 (Yamada et al., 2025) 使用带有 vision-language model 批评循环的 agentic tree search，移除了 template 要求。系统会生成想法、实现实验、生成图表、撰写论文，并根据 reviewer feedback 迭代。

Peer review 结论：一篇由 v2 生成的论文被 ICLR 2025 workshop 接收（带 disclosure）。独立评估结论：该系统远不可靠。两者都是真的。

## 概念

### 架构

1. **想法生成。** LLM 根据主题和已有文献提出研究想法。v1 使用 templates；v2 在假设空间上使用 agentic search。
2. **新颖性检查。** literature retrieval 步骤检查该想法是否已经发表。Beel et al. 的评估正是在这一步发现了错误标记：既有方法经常被分类为 novel。
3. **实验计划。** agent 起草实验 protocol 并编写代码。
4. **执行。** 代码在 sandbox 中运行。失败会反馈到 retry loop。按照 Beel et al. 的测量，在这一阶段 42% 的实验因编码错误失败。
5. **图表生成。** vision-language model 读取生成的图表，并重写它们以提高可读性。这是 v2 的关键技术新增点。
6. **写作。** LLM 起草论文，并与内部 reviewer 迭代。
7. **可选：投稿。** 论文被提交到某个 venue。

### workshop 接收结果意味着什么

一篇由 v2 生成的论文通过了 ICLR 2025 workshop 的 peer review。作者向 program committee 披露了论文来源。这个接收是一个数据点；它不是宣称该系统“会做研究”的许可。

重要背景：workshop 论文的门槛低于 main-conference 论文。Peer review 噪声很大；在任意一天，都会有一小部分投稿被接收。一次成功是 proof of concept，而不是可靠性声明。Nature 2026 论文记录了端到端循环，且它本身由人类研究者共同署名；它不是“系统写了一篇 Nature 论文”。

### 独立评估发现了什么

Beel et al. (arXiv:2502.14297) 进行了外部评估。主要发现：

- **实验失败。** 42% 的实验因编码错误失败（错误 imports、shape mismatches、undefined variables）。retry loop 捕获了一部分，但不是全部。
- **新颖性错误标记。** literature-retrieval 步骤经常把既有概念标记为 novel。这相当于研究领域中的 hallucination。
- **呈现质量差距。** vision-language 图表批评生成了出版级视觉效果，掩盖了底层实验弱点。

最后一项发现对本 phase 最重要。一个生成可信输出却没有做出可信研究的系统，比明显失败的系统更危险，而不是更安全。评估必须触达底层 claim，不能停在图表上。

### sandbox escape 风险

Sakana 自己的 repository README 警告：

> 由于该软件会执行 LLM 生成的代码，我们无法保证安全。存在危险 packages、不受控 web access，以及生成非预期进程的风险。请自行承担使用风险，并考虑 Docker 隔离。

这就是未验证领域中自主性的 operational 形态。LLM 编写代码；代码运行；代码可以做任何该进程被允许做的事。如果没有对 filesystem、network 和 process actions 做硬限制的 sandbox，任何自导向 research agent 都可能外传数据、耗尽 compute，或重写自身。

AlphaEvolve 的 sandbox 故事更容易，因为它的 evaluator 很紧。AI Scientist v2 的循环运行开放式代码，并带有开放式目标。因此它需要更强隔离（Docker 是最低要求；seccomp / gVisor 更好），并且每次投稿离开系统前都需要人工 review。

### v2 在 frontier stack 中的位置

| System | Target | Output kind | Evaluator | Known failure |
|---|---|---|---|---|
| AlphaEvolve | algorithms | code | unit + benchmark | 受 evaluator 严谨程度限制 |
| DGM | agent scaffolding | code | SWE-bench | reward hacking |
| AI Scientist v2 | research papers | text + code + figures | peer review（弱） | 实验失败、错误标记、润色掩盖弱点 |

在这三者中，v2 的自动 evaluator 最弱，输出面最宽，通向公开 artifact 的路径最短。operational controls（sandbox、review、disclosure）承担了大部分安全工作。

```figure
mx-research-loop
```

## 使用它

`code/main.py` 将 v2 循环模拟为一个 state machine：想法 → 新颖性检查 → 实验 → 图表 → 写作 → review → 接收或迭代。每个 state 都有一个可配置的失败概率，该概率来自 Beel et al. 的发现。运行模拟器 N 个循环并统计：

- 有多少想法到达投稿阶段。
- 有多少投稿存在被润色论文隐藏的关键实验缺陷。
- retry budgets 如何在质量与产出之间权衡。

## 交付它

`outputs/skill-ai-scientist-sandbox-review.md` 是一个 two-gate review checklist，用于研究循环 agent 产出的任何内容离开 sandbox 之前的检查。

## 练习

1. 使用默认参数运行 `code/main.py`。有多少比例的循环运行会产出一篇“干净”的论文？有多少比例会产出一篇带有实验失败缺陷、但被图表批评润色掩盖的论文？

2. 默认值已经使用 Beel et al. 的 42% / 25%。分别用 `--experiment-failure 0.20 --novelty-mislabel 0.10` 和 `--experiment-failure 0.60 --novelty-mislabel 0.40` 重新运行。两次运行之间，polished-but-flawed 的占比如何变化？

3. 阅读 Sakana 的 AI Scientist v2 repo README 中关于 sandbox 要求的内容。说出两个你会为多日自主运行额外施加的限制（Docker 之外）。

4. 阅读 Beel et al. Section 4 中关于 presentation-quality gap 的内容。设计一个额外 evaluator，用来捕获看起来精美但实验上有缺陷的论文。

5. 为 research-agent 输出提出一个 human-review protocol，使其扩展性优于“每篇论文都由 PhD 阅读”。指出瓶颈，并围绕它设计。

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| AI Scientist v1 | “Sakana 的 templated research agent” | 将实验填入固定 scaffold |
| AI Scientist v2 | “无 template 的 research agent” | 带有 VLM 图表批评的 agentic tree search |
| Agentic tree search | “分支式 research agent” | 并行扩展多个实验计划；由内部 critic 剪枝 |
| Vision-language critique | “对图表进行 VLM 润色” | Multimodal model 读取图表并重写以提高清晰度 |
| Literature retrieval | “新颖性检查” | 搜索 prior work 以确认想法新颖性，并已被记录会发生错误标记 |
| Polish masking | “漂亮论文，破损研究” | 呈现质量超过实验质量；隐藏弱点 |
| Sandbox escape | “LLM 代码逃逸” | agent 执行的代码做了 loop designer 未预期的事情 |

## 延伸阅读

- [Yamada et al. (2025). The AI Scientist-v2](https://arxiv.org/abs/2504.08066) — 论文。
- [Sakana blog on the Nature 2026 publication](https://sakana.ai/ai-scientist-nature/) — 带有 peer-review 背景的 vendor summary。
- [Beel et al. (2025). Independent evaluation of The AI Scientist](https://arxiv.org/abs/2502.14297) — 外部评估数字。
- [Sakana AI Scientist v1 paper](https://arxiv.org/abs/2408.06292) — 模板化前身。
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) — 关于开放式 research agents 的更广泛框架。
