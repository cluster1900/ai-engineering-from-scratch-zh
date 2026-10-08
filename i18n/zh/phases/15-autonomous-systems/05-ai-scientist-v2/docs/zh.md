# 工坊 级自主研究

> 萨卡纳的AI科学家 v2 (Yamada等人, arXiv:2504.08066) 运行完整的研究循环:假设,代码,实验,图表,写作,投稿――它是第一个让生成论文通过ICLR 2025 研讨会同行评审的系统――独立评估 (Beel等人) 发现,42%的实验因编码错误失败,文学评审也经常把既有概念错误标记为小说――萨卡纳自己的文档警告说,该代码库会执行LLM编写的代码,并建议使用Docker 隔离――这两个图景共同构成重点――

**Type:** Learn
**Languages:** Python (stdlib, research-loop state-machine toy)
**Prerequisites:** Phase 15 · 03 (AlphaEvolve), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

研究是一个开放式任务.与AlphaEvolve的算法搜索或DGM受基准约束的自我修改不同,研究结果没有机器可检查的正确性标准.论文由评论者判断,而不是单元测试判断. 这使循环更难关闭;一旦关闭,它也更有价值,因为研究正是复杂的进展发生的地方.

通过从人类编写的模板开始闭合循环. 在固定脚手架内填入实验. AI Scientist v2 (Yamada等, 2025) 使用有视觉语言模型 批评循环的代理树搜索,移除模板 要求.系统会产生想法,实现实验,生成图表,写论文,并根据评论员反代.

专业研究人员的评价 结论:一篇由v2 生成的论文被ICLR 2025 研讨会接收(带披露) ・独立评估结论:该系统远不可靠――两者都是真的――

## 概念

### 架构

1. **想法生成。**根据主题和已有文献提出研究想法.
2. **新颖性检查。**贝尔等的评估正是在这个步骤发现错误标记:既有方法经常被归类为小说.
3. **实验计划。**代理 起草实验协议 并编写代码――
4. **执行。**代码在沙盒中运行――失败会反到复试循环――根据Beel等的测量,在这一阶段, 42% 的实验因编码错误失败――
5. **图表生成。**视觉语言模型 读取生成图表,并重写它们以提高可读性.
6. **写作。**起草论文,并与内部评审员
7. **可选：投稿。**论文被提交到某个地方.

### 接收结果意味着什么

一篇由v2生成的论文通过了ICLR 2025研讨会的同行评价.作者向计划委员会披露了论文来源.

重要背景:研讨会论文门低于主会议论文. 评论 噪音很大;在任何一天,都会有一小部分帖子被接收. 一次成功是概念的证明,而不是可靠性声明.

### 独立评估发现了什么

贝尔等人 (arXiv:2502.14297) 进行了外部评估.

- **实验失败。**42% 的实验因编码错误失败,错误进口,形状不匹配,未定义变量,
- **新颖性错误标记。**文献复苏步骤经常把既有概念标记为小说.
- **呈现质量差距。**图表批评产生了出版级视觉效果,掩盖了底层实验的弱点.

最后一个发现对本阶段最重要的一点是:一个可信的输出没有做出可信的研究系统,比明显失败的系统更危险,而不是更安全.

### 风险 风险 风险

萨卡纳 自己的库 README 警告:

> 由于该软件会执行LLM生成的代码,我们无法保证安全.

这就是未经验证领域的自主性运行形态.LLM编写代码;代码运行;代码可以做任何被允许的进程.如果没有对文件系统,网络和过程的行动做出硬限制的沙盒,任何自主导的研究代理都可能外传数据,耗尽计算,或重写自己.

故事更容易,因为它的评价者很紧.AI科学家 v2 的循环运行开放式代码,并带有开放式目标.因此它需要更强的隔离.

### 在边境堆中位置

| System | Target | Output kind | Evaluator | Known failure |
|---|---|---|---|---|
| AlphaEvolve | algorithms | code | unit + benchmark | 受 evaluator 严谨程度限制 |
| DGM | agent scaffolding | code | SWE-bench | reward hacking |
| AI Scientist v2 | research papers | text + code + figures | peer review（弱） | 实验失败、错误标记、润色掩盖弱点 |

在这三者中,v2的自动评估器最弱,输出面最宽,通向公开文物的路径最短――操作控制 (盒,审查,披露) 承担了大部分安全工作――


```figure
mx-research-loop
```

## 使用它

`code/main.py`将 v2 循环模拟为一个状态机:想法 → 新性检查 → 实验 →图表 → 写作 → 评论 → 接收或代――每个状态都有一个可配置的失败概率,这个概率来自Beel等人的发现――运行模拟器 N 个循环并统计:

- 很多想法到达的投稿阶段.
- 许多文章存在着被色论文隐藏的关键实验缺陷.
- 如何衡量质量和产量之间的权衡

## 交付它

`outputs/skill-ai-scientist-sandbox-review.md`是一个双门检查清单,用于研究循环代理 产生的任何内容离开沙盒 之前的检查.

## 练习

1. 使用默认参数运行 `code/main.py`△有多少个循环运行会产生一个论文? 有多少个比例会产生一个论文,有实验失败缺陷,但被图表批评覆?

2. 默认值已使用Beel等的 42% / 25%──分别使用`--experiment-failure 0.20 --novelty-mislabel 0.10`和 `--experiment-failure 0.60 --novelty-mislabel 0.40`重新运行──两次运行之间,抛光但缺陷的比例如何变化?

3. 阅读Sakana的AI科学家 v2 repo README 中关于沙箱要求的内容.

4. 阅读Beel等. 第4节关于表达质量差距的内容.

5. 为研究代理 输出提出了一个人体审查协议,使其扩展性优于 每篇论文都由博士研究生阅读──指出瓶,并围绕它设计──

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

- [Yamada et al. (2025). The AI Scientist-v2](https://arxiv.org/abs/2504.08066)论文:
- [Sakana blog on the Nature 2026 publication](https://sakana.ai/ai-scientist-nature/)带有同行评价 背景供应商总结
- [Beel et al. (2025). Independent evaluation of The AI Scientist](https://arxiv.org/abs/2502.14297) 外部评估数字――
- [Sakana AI Scientist v1 paper](https://arxiv.org/abs/2408.06292) 模板化前身
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) 关于开放研究机构的更广泛框架
