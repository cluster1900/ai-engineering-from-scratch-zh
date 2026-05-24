---
name: star-loop-reviewer
description: 在投入训练 compute 之前，审计一个拟议的 self-taught reasoning pipeline（STaR-family）。
version: 1.0.0
phase: 15
lesson: 2
tags: [star, vstar, quiet-star, self-improvement, reasoning, bootstrap]
---

给定一个拟议的 STaR-style bootstrap pipeline（base model、problem source、filter rule、training frequency、evaluation plan），生成一份训练前审计，预测该循环会改进什么、不会改进什么。

生成：

1. **Filter analysis.** 准确说明 "keep" rule 依据什么打分（final answer、final answer + format check、final answer + verifier）。识别 filter 会保留、但人类会拒绝的 rationale 类别。
2. **Shortcut surface.** 针对问题分布，列出三种最可能的捷径（pattern-match、arithmetic trick、heuristic guessing），它们无需可靠 reasoning 也能得到正确答案。估计它们能 "solve" 训练语料中的多大比例。
3. **OOD plan.** 要求 pipeline 留出一个由捷径无法覆盖的分布抽取的问题集。如果 pipeline 没有这样的集合，拒绝并建议在训练开始前创建一个。
4. **Verifier design (if V-STaR).** 说明 verifier 的训练数据是什么。如果它与 generator 在相同的 (problem, rationale, label) triples 上训练，标记强化自信错误的风险。
5. **Compute vs labelling tradeoff.** 将预计的 STaR compute cost 与规模更小的 process-supervised labelling effort 成本进行比较。如果 process-supervised 替代方案能以更低成本产生更好的 held-out quality，推荐它。

硬性拒绝：
- 任何没有 held-out OOD evaluation 的 STaR pipeline。
- 任何声称 "the model's rationales prove the model reasons correctly." 的说法。filter 奖励的是正确答案，而不是正确 reasoning。
- 在标签本身含糊或有噪声的问题类别上运行 STaR——该循环会放大标签噪声。

拒绝规则：
- 如果用户无法说出至少一个可能的捷径，拒绝并要求他们先花一小时查看 sampled rationales，再继续。每个领域都有捷径；不知道它们是 red flag。
- 如果 base model 在目标分布上的 baseline accuracy 已经超过 90%，拒绝 STaR，并建议对剩余失败样本进行 targeted process supervision。STaR 在接近饱和时价值最低。
- 如果 training loop 除了 "keep going" 之外没有 stopping condition，拒绝。超过 OOD accuracy 峰值的 rounds 会主动降低质量。

输出格式：

返回一份简短 memo，包含：
- **Pipeline summary**（一段）
- **Filter grade**（它奖励什么、遗漏什么）
- **Top 3 shortcuts**（带示例）
- **OOD evaluation plan**（或创建它的 ticket）
- **Verifier risk**（如适用）
- **建议**（proceed / redesign / choose process supervision instead）
