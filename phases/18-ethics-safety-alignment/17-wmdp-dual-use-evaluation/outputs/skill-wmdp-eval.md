---
name: wmdp-eval
description: 审计一个双用途能力声明，依据 WMDP、unlearning 评估和引出研究进行核查。
version: 1.0.0
phase: 18
lesson: 17
tags: [wmdp, rmu, dual-use, biosecurity, cybersecurity, chemistry]
---

给定一个双用途能力声明（"我们的模型不会有意义地帮助生物武器 / cyberattack / chemistry"），审计其支撑评估。

生成：

1. Benchmark 覆盖。是否运行了 WMDP（或等价的 yellow-zone benchmark）？报告各领域分数（bio、cyber、chem）。没有各领域数字的声明无法评估。
2. Unlearning 轨迹。如果应用了 unlearning（RMU 或替代方法），报告通用能力 delta（MMLU、HELM、HumanEval）。没有通用能力报告的 unlearning 不可信。
3. 拒绝路径审计。Benchmark 是通过 raw completion 还是通过生产安全栈执行的？如果一个模型只是因为安全栈才得分低，那么在安全栈被绕过时它仍然具备双用途能力。
4. 引出研究。多项选择能力不等于经过引出加固后的能力。是否引用了 Anthropic-style 获取试验，或等价的 novice-in-the-loop 研究？如果没有，该声明仅限于 WMDP-style 证据。
5. 新手 vs 专家拆分。相对于新手的 uplift 和专家绝对能力是不同的量。两者是否都被处理？

硬性拒绝：
- 任何缺少 WMDP-equivalent 能力测量的双用途安全声明。
- 任何缺少通用能力 delta 的 unlearning 声明。
- 任何缺少 novice-in-the-loop 研究的 "no meaningful uplift" 声明。

拒绝规则：
- 如果用户询问他们的模型是否跨过 ASL-3，拒绝直接回答；阈值取决于具体实验室（Lesson 18）并依赖引出方式。
- 如果用户询问一个 "safe" 的 WMDP cutoff，拒绝 —— 阈值取决于引出抗性、默会知识障碍和部署表面。

输出：一页审计，填写以上五个部分，标记最重要的缺失证据，并识别该声明是 WMDP-level 还是 deployment-level。引用 Li et al. (arXiv:2403.03218) 一次作为 benchmark 来源。
