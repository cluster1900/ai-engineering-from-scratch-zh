# 来源

> 本手册的来源，按权威程度排序。

当两个来源不一致时，在这个列表中位置更高的那个胜出，相关页面会注明这一点。

## 1. 我们的运行 {#s-ref-sources-1-our-runs}

每个标为测量所得的数字，都来自我们在一台带 GB10 GPU 的 NVIDIA DGX Spark 上于 2026-10-17 至 2026-10-22 记录的运行。[实验笔记](#s-ref-lab-notes)列出了这些运行、镜像和计时规则。

## 2. 我们运行的 Miles 代码 {#s-ref-sources-2-the-miles-code-we-ran}

页面提到的每个参数和默认值，都来自我们运行的镜像中的 Miles 代码：2026-10-15 的 Miles main。我们对照 2026-10-20 的 Miles main 检查了页面所依赖的部分。

## 3. Miles 文档和发布说明 {#s-ref-sources-3-miles-documentation-and-release-notes}

文档中描述的行为来自 Miles 文档，以及 v0.1.0、v0.1.1 和 v0.1.2 的发布说明。当文档和代码不一致时，我们以代码为准。一个例子：自定义奖励参数的帮助文本展示的是普通函数，而代码需要一个异步函数。

## 4. Miles issue 跟踪器 {#s-ref-sources-4-the-miles-issue-tracker}

我们没有复现的排查条目来自 Miles issue 跟踪器中的报告。每一条都标注为报告，而不是我们的结果。

## 5. 论文和文章 {#s-ref-sources-5-papers-and-posts}

- Miles v0.1 技术报告，arXiv 2609.08368，2026 年 9 月。
- Rollout Routing Replay，arXiv 2510.11370。
- Score Centering Stabilizes Off-policy Reinforcement Learning，arXiv 2609.20807。
- 第一篇公开的 Miles 文章（2025 年 11 月）和 Miles v0.1 文章（2026 年 8 月），均来自 RadixArk 团队。
- slime 仓库及其 README，用于了解项目历史。
- Defeating the Training-Inference Mismatch via FP16，arXiv 2510.26788，2025 年 10 月。
- Deterministic Inference across Tensor Parallel Sizes That Eliminates Training-Inference Mismatch，arXiv 2511.17826，2025 年 11 月。
- Jet-RL，同策略 FP8 强化学习，arXiv 2601.14243，2026 年 1 月。
- Scaling Laws for Collapse in Asynchronous GRPO，arXiv 2607.01083，2026 年 7 月。
- Unified FP8 for MoE RL，Miles 团队及其合作伙伴发布的一篇 LMSYS 文章，2025 年 11 月。
- vime 发布公告，vLLM 团队的一篇文章，2026 年 6 月。
- SGLang pull request 42408，在 GB300 上用 Miles 运行 DeepSeek-V4.1，2026 年 10 月。
- SGLang 投机解码文档。
- SkyRL 量化 rollout 文档，2026。
- TRL issue 6789，截断采样的重要性采样偏差，2026 年 8 月。

其他团队测得的结果出现在相应页面上，并注明团队名称和他们使用的硬件。

Sources: manual.json.
