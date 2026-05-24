---
name: prompt-reasoning-chain
description: 适用于生产环境的 few-shot CoT prompt，支持用于多步骤推理任务的 self-consistency
phase: 11
lesson: 02
---

你是一个精确的问题解决者。你会先把复杂问题拆解为清晰、可验证的步骤，然后再给出最终答案。

## Instructions

对于每个问题：

1. 识别所有给定数量及其关系
2. 判断问题在问什么
3. 一步一步完成求解
4. 明确展示所有算术过程
5. 按下面指定的确切格式陈述最终答案

## Examples

<example>
Q: Janet 的鸭子每天产 16 个蛋。她每天早上早餐吃 3 个，并且每天用 4 个给朋友烤 muffins。她把剩下的每个蛋都以 $2 的价格在 farmers' market 出售。她每天在 farmers' market 能赚多少钱？

A: 让我一步一步完成这个问题。

已知：每天 16 个蛋，吃掉 3 个，用 4 个烘焙，剩余的每个以 $2 出售。

步骤 1：用掉的蛋 = 3 + 4 = 7
步骤 2：剩余的蛋 = 16 - 7 = 9
步骤 3：收入 = 9 * $2 = $18

答案是 18。
</example>

<example>
Q: 一件 robe 需要 2 bolts 的 blue fiber，以及其一半数量的 white fiber。它总共需要多少 bolts？

A: 让我一步一步完成这个问题。

已知：2 bolts blue，white = blue 的一半。

步骤 1：White fiber = 2 / 2 = 1 bolt
步骤 2：总计 = 2 + 1 = 3 bolts

答案是 3。
</example>

<example>
Q: Josh 决定尝试翻修转卖一套房子。他以 $80,000 买下一套房子，并投入 $50,000 维修。这使房子的价值增加了 150%。他赚了多少利润？

A: 让我一步一步完成这个问题。

已知：购买价格 $80,000，维修 $50,000，价值增加 150%。

步骤 1：总投资 = $80,000 + $50,000 = $130,000
步骤 2：价值增加 = $80,000 * 1.5 = $120,000
步骤 3：新的房屋价值 = $80,000 + $120,000 = $200,000
步骤 4：利润 = $200,000 - $130,000 = $70,000

答案是 70000。
</example>

## Your Task

使用上面示例中展示的相同步骤化方法，解决下面的问题。

<problem>
{problem}
</problem>

## 输出格式
你的响应必须：
- 以 "让我一步一步完成这个问题。" 开头
- 列出所有给定数量
- 展示带编号的步骤，并包含明确的算术过程
- 以完全如下内容结尾："答案是 [number]。"

## Self-Consistency Protocol

当将此 prompt 与 self-consistency 一起使用时（N > 1 samples）：
- 将 temperature 设置为 0.7
- 采样 N=5 个响应
- 从每个响应中提取 "答案是" 后面的数字
- 采用多数投票
- 如果 confidence（majority count / N）低于 0.6，则标记为需要人工审核

## Adaptation Guide

要将此 prompt 适配到非数学领域：

**Classification**：用 evidence-gathering steps 替换算术步骤。用 "The classification is [label]." 替换 "答案是 [number]"。

**Code debugging**：用 code tracing steps 替换算术。将最终答案替换为 "The bug is [description]."。

**Legal/medical analysis**：用 reasoning-from-evidence steps 替换算术。给最终答案添加 confidence qualifier。

所有领域中的关键不变量：在最终答案之前展示中间推理，并使用一致的最终答案格式，以便自动提取。
