# Theory of Mind 与涌现式协调

> Li 等人（arXiv:2310.10701）表明，合作文本游戏中的 LLM Agent 会展现出**涌现式高阶 Theory of Mind**（ToM），即推理一个 Agent 如何看待第三个 Agent 的信念，但由于 Context 管理和幻觉问题，它们无法完成长时程规划。Riedl（arXiv:2510.05174）测量了一个群体中的高阶协同效应，发现**只有** ToM Prompt 条件会产生与身份关联的差异化和目标导向的互补性；能力较低的 LLM 只会表现出虚假的涌现。也就是说，协调的涌现取决于 Prompt 条件和 Model，而不是凭空获得的。本课将实现一个最小化的 ToM-aware Agent，分别在使用和不使用 ToM Prompt 的条件下运行合作任务，并依据 Riedl 2025 协议测量协调差异。

**Type:** 学习 + 构建
**Languages:** Python（stdlib）
**Prerequisites:** Phase 16 · 07（Society of Mind 与 Debate）、Phase 16 · 17（Generative Agents）
**Time:** 约 75 分钟

## 问题

Multi-Agent 协调通常看起来很神奇：Agent 会分工、预判彼此并避免重复劳动。通常，这种“涌现”其实是 Prompt Engineering 的产物，因为有人告诉 Agent 要“相互协调”。移除 Prompt，协调也随之消失。

Riedl 在 2025 年的发现更加严格：在受控条件下，只有当 Agent 被提示去推理**其他 Agent 的心智**（ToM）时，协调才会涌现。没有 ToM Prompt 时，即使是强大的 Model，也只会表现出无法通过统计控制检验的协调模式。这对生产环境很重要：团队交付的“Multi-Agent 协调”功能可能依赖 Prompt，而且十分脆弱。

本课将 ToM 视为一种具体能力，即对有关信念的信念进行推理；我们会构建一个最小化的 ToM-aware Agent，并测量真正的协调与经过 Prompt 修饰的表象分别是什么样子。

## 概念

### ToM 的含义

发展心理学认为：3 岁儿童觉得每个人的内心世界都与自己相同；5 岁儿童理解其他人可能持有不同信念；7 岁儿童能够推理有关信念的信念（“她认为我觉得球在杯子下面”）。这些分别是零阶、一阶和二阶 ToM。

对于 LLM Agent，ToM 阶数对应如下：

- **零阶：** 不建立其他参与者的 Model。Agent 只根据自己的观察采取行动。
- **一阶：** Agent 拥有关于其他每个 Agent 信念的 Model。“Alice 相信 X。”
- **二阶：** Agent 对递归信念进行建模。“Alice 相信 Bob 相信 X。”

Li 等人在 2023 年发现，一阶和二阶 ToM 会在合作游戏的 LLM Agent 中涌现，但随着时程延长和通信可靠性下降，其表现会退化。

### Sally-Anne 测试简介

这是一项 1985 年提出的错误信念测试：Sally 把一颗弹珠放进篮子 A 后离开。Anne 将弹珠移到篮子 B。Sally 回来时会去哪里寻找？具备一阶 ToM 的儿童会回答篮子 A，因为 Sally 的信念与现实不同；不具备一阶 ToM 的儿童则会回答篮子 B。

GPT-4 时代的 LLM 在直接提出的 Sally-Anne 类测试中能够答对。当叙事很长、场景发生多次变化或问题使用间接表达时，它们就会失败。这就是 2026 年生产环境中 LLM ToM 的实际状态。

### Riedl 的协调测量方法

Riedl（arXiv:2510.05174）构建了一项群体规模的测试：由 N 个 Agent、一个合作目标和可变的 Prompt 条件组成。测量以下指标：

1. **与身份关联的差异化。** Agent 是否会随时间形成稳定的角色差异？
2. **目标导向的互补性。** Agent 的行动是否相互补充，即执行不同子任务，而不是重复行动？
3. **高阶协同效应。** 用统计方法衡量群体能否完成任何子集都无法完成的目标。

结果表明：只有在 ToM Prompt 条件下，这三个指标才都会产生高于基线的信号。没有 ToM Prompt 时，中等能力 Model 的指标会徘徊在随机水平附近。大型 Model 在没有显式 ToM Prompt 时也会表现出一定程度的协调，但效果弱于使用显式 Prompt 的情况。

### 协调错觉

如果没有统计控制，演示中的“涌现式协调”通常反映的是：

- 将协调预先写入的 Prompt Engineering，例如要求“共同协作”的 system Prompt。
- 观察者偏差，即我们看到了自己预期的模式。
- 在事后选择成功的运行结果。

生产系统如果宣传“涌现式协调”，却无法提供可测量的信号，就应当将其视为营销。先测量，再提出主张。

### 最小化的 ToM-aware Agent

结构：

```
agent state:
  own_beliefs:    {facts the agent believes}
  other_models:   {other_agent_id -> {beliefs_the_agent_attributes_to_them}}
  actions_last_N: [history of others' actions]

observation update:
  - update own_beliefs from direct observation
  - update other_models[agent_id] from their action + prior beliefs

action selection:
  - enumerate candidate actions
  - for each, predict what each other agent will do next given their modeled beliefs
  - pick action that maximizes joint outcome under those predictions
```

`other_models` 属性就是 ToM 状态。一阶 ToM 只保留一个层级。二阶 ToM 会增加 `other_models[i][other_models_of_j]`，即我认为 Agent i 觉得 Agent j 相信什么。

### 长时程为何会损害表现

Li 等人指出：Context 限制会导致 Agent 忘记某个信念属于谁。幻觉则会把错误信念加入其他 Agent 的 Model。两者都会产生“我以为他认为 X”之类的错误，并随着时间推移不断累积。

论文及 2024 至 2026 年后续研究中记录的缓解措施包括：

- **在 Prompt 中显式表示 ToM 状态。** 使用 `{agent_id: belief_list}` 这类结构化格式，强制检索过程保留身份与信念之间的绑定关系。
- **缩短推理链。** 每一轮执行更少的 ToM 更新，以减少累积的幻觉。
- **外部 ToM 存储。** 在 LLM Context 之外维护 Model，每一轮只注入相关部分。

### ToM 在生产环境中的失效场景

- **对抗性环境。** 具备良好 ToM 的 Agent 更容易受到操纵，因为你可以推测它如何看待你，再利用这一点。
- **异构团队。** 当 Model 不同时，适用于一个对手的 ToM Model 无法泛化到其他对手。
- **依赖真实事实的任务。** ToM 关注的是信念；如果正确性取决于事实，ToM 反而可能造成干扰。

### 你真正能够测量的协调

以下三个实用信号可以表明团队的协调是真实的，而不只是经过 Prompt 修饰：

1. **随时间形成的互补性。** 在多轮任务中，Agent 的行动是否覆盖了彼此不重叠的子任务？
2. **预判。** Agent A 在 T+1 轮的行动是否依赖于对 B 在 T+2 轮行动的预测，而且该预测最终正确？
3. **纠正。** 当 A 在 T 轮误判 B 的信念时，A 是否能在 T+2 轮之前完成纠正？

这些都能在记录了日志的 Multi-Agent 系统中进行测量。它们是“协调”叙事背后的实质性表现。

```figure
sw-theory-of-mind
```

## 动手构建

`code/main.py` 实现了：

- `ToMAgent`：跟踪自身信念以及每个其他 Agent 的信念 Model。
- 一个合作任务：三个 Agent 必须从三个箱子中收集三个 Token，每个箱子可容纳一个 Token。Agent 之间不能通信，只能根据彼此的行动推断意图。
- 两种配置：`zeroth_order`（无 ToM）和 `first_order`（使用单层信念 Model 的 ToM）。
- 对 200 次随机试验进行测量：完成率、重复率（两个 Agent 选择同一个箱子）和完成任务所需的平均轮数。

运行：

```
python3 code/main.py
```

预期输出：零阶 Agent 重复行动的比例约为 35%，并能在 10 轮内完成约 60% 的试验。一阶 ToM Agent 的重复率约为 5%，完成率约为 95%。两者之间的差异就是可测量的协调效果。

## 实际应用

`outputs/skill-tom-auditor.md` 是一个 Skill，用于审计 Multi-Agent 系统关于“涌现式协调”的主张。它会检查 Prompt 修饰、相较于控制条件的统计显著性以及经过测量的互补性。

## 交付成果

协调主张检查清单：

- **控制条件。** 提供一个不含协调 Prompt 的系统版本，并对两个版本都进行测量。
- **统计检验。** 在你的指标上，系统与控制条件之间的差异是否在 `p < 0.05` 时达到显著水平？
- **互补性测量。** 测量随时间变化的行动不重叠程度，而不只是最终是否成功。
- **失败案例日志。** 当 Agent 协调失败时，ToM 状态是什么样子？
- **Model 能力披露。** 如果效果在较小 Model 上消失，应当明确说明。

## 练习

1. 运行 `code/main.py`。确认一阶 ToM 能将重复率降低约 7 倍。扩展到 5 个 Agent 和 5 个箱子时，这一差距是否仍然存在？
2. 实现二阶 ToM，即 Agent A 对 B 如何看待 C 进行建模。它是否比一阶 ToM 有所改进？在哪些任务上有效？
3. 向 ToM 状态注入一次**幻觉**：每轮随机翻转一个信念。这会让一阶 ToM 的表现下降多少？
4. 阅读 Li 等人（arXiv:2310.10701）的论文。复现“长时程退化”发现：当轮数从 10 增加到 30 时，一阶 ToM 的表现如何变化？
5. 阅读 Riedl 2025（arXiv:2510.05174）。在模拟日志上实现高阶协同效应统计量。没有 ToM Prompt 条件时，这种效果是否存在？

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|----------------|------------------------|
| Theory of Mind | “理解其他参与者的心智” | 对另一个 Agent 的信念进行建模的能力，按阶数分级（0、1、2+）。 |
| Sally-Anne 测试 | “错误信念测试” | 1985 年的发展心理学测试；LLM 能通过简单版本，但无法通过复杂版本。 |
| 一阶 ToM | “A 相信 X” | 对另一个参与者关于事实的信念进行建模。 |
| 二阶 ToM | “A 相信 B 相信 X” | 向更深一层进行递归建模。 |
| 与身份关联的差异化 | “随时间保持稳定的角色” | Riedl 的指标：角色持续存在，而非随机产生。 |
| 目标导向的互补性 | “互不重叠的行动” | Agent 分别处理不同子任务，而不是选择相同的任务。 |
| 高阶协同效应 | “群体胜过任何子集” | Riedl 用于衡量真实协调的统计指标。 |
| 协调错觉 | “看起来协调一致” | 缺乏可测量信号、仅由 Prompt 修饰而成的协调表象。 |

## 延伸阅读

- [Li et al. — Theory of Mind for Multi-Agent Collaboration via Large Language Models](https://arxiv.org/abs/2310.10701) — 合作游戏中的涌现式 ToM；长时程失效模式
- [Riedl — Emergent Coordination in Multi-Agent Language Models](https://arxiv.org/abs/2510.05174) — 群体规模测量；ToM Prompt 是发挥关键作用的条件
- [Premack & Woodruff — Does the chimpanzee have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-chimpanzee-have-a-theory-of-mind/1E96B02CD9850E69AF20F81FA7EB3595) — 1978 年 ToM 概念的起源
- [Baron-Cohen, Leslie, Frith — Does the autistic child have a theory of mind?](https://doi.org/10.1016/0010-0277(85)90022-8) — Sally-Anne 论文（1985）
