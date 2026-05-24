# Theory of Mind 与涌现式协调

> Li et al. (arXiv:2310.10701) 表明，合作型文本游戏中的 LLM agents 会表现出**涌现式高阶 Theory of Mind** (ToM) —— 推理另一个 agent 对第三个 agent 信念的信念 —— 但由于上下文管理和 hallucination，在长程规划上会失败。Riedl (arXiv:2510.05174) 测量了一个群体中的高阶协同，并发现**只有** ToM-prompt 条件会产生与身份关联的分化和目标导向的互补性；低能力 LLMs 只表现出伪涌现。也就是说，协调涌现依赖 prompt 条件和模型，并不是免费得到的。本课实现一个最小 ToM-aware agent，在有无 ToM prompting 的情况下运行一个合作任务，并按 Riedl 2025 protocol 测量协调差异。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：** Phase 16 · 07 (Society of Mind and Debate), Phase 16 · 17 (Generative Agents)
**Time:** ~75 minutes

## 问题

multi-agent 协调经常看起来很神奇：agents 分工、预判彼此、避免重复。通常这种“涌现”是 prompt engineering 的产物 —— 有人告诉 agents 要“coordinate”。移除 prompt，协调也随之消失。

Riedl 2025 的发现更严格：在受控条件下，只有当 agents 被提示去推理**其他 agents 的 minds** (ToM) 时，协调才会涌现。没有 ToM prompt，即使是强模型也会表现出无法通过统计控制的协调模式。这对生产环境很重要：团队发布的“multi-agent coordination”功能往往依赖 prompt 且很脆弱。

本课把 ToM 视为一种具体能力（推理关于信念的信念），构建一个最小 ToM-aware agent，并测量真实协调与 prompt 修饰表象之间的差异。

## 概念

### ToM 是什么

发展心理学：3 岁儿童认为任何人的内在世界都和自己一致。5 岁儿童理解他人有不同信念。7 岁儿童会推理关于信念的信念（“她认为我以为球在杯子下面”）。这些分别是零阶、一阶和二阶 ToM。

对 LLM agents 而言，ToM 阶数对应为：

- **Zeroth-order:** 没有他人模型。agent 只基于自己的观察行动。
- **First-order:** agent 拥有每个其他 agent 的信念模型。“Alice believes X.”
- **Second-order:** agent 建模递归信念。“Alice believes that Bob believes X.”

Li et al. 2023 发现，一阶和二阶 ToM 会在合作游戏中的 LLM agents 里涌现，但会随着长 horizon 和不可靠通信而退化。

### Sally-Anne test 简述

一个 1985 年的 false-belief test：Sally 把一颗弹珠放进篮子 A，然后离开。Anne 把它移到篮子 B。Sally 回来时会去哪里找？具备一阶 ToM 的儿童会回答篮子 A（Sally 的信念与现实不同）。不具备的儿童会回答篮子 B。

GPT-4 时代的 LLMs 在直接提出的 Sally-Anne-style tests 中可以通过。当叙事很长、场景多次变化，或问题以间接方式表达时，它们会失败。这就是 2026 年生产 LLMs 中 ToM 的实际状态。

### Riedl 的协调测量

Riedl (arXiv:2510.05174) 构建了一个群体规模测试：N 个 agents，一个合作目标，可变 prompt 条件。测量：

1. **Identity-linked differentiation.** agents 是否随时间形成稳定的角色区分？
2. **Goal-directed complementarity.** agents 的行动是否互补（不同子任务），而不是重复？
3. **Higher-order synergy.** 一个统计度量，用来判断群体是否实现了任何子集都无法实现的结果。

结果：只有在 ToM prompt 条件下，三个指标才全部产生高于 baseline 的信号。没有 ToM prompting 时，中等能力模型的指标接近随机。大型模型在没有显式 ToM prompting 的情况下也会表现出一些协调，但效果小于显式 prompting。

### 协调幻觉

没有统计控制时，demo 中的“emergent coordination”通常反映的是：

- Prompt engineering 把协调内置进去（system prompts 写着“work together”）。
- 观察者偏差（我们会看到自己期待的模式）。
- 事后挑选成功运行。

如果生产系统在没有可测信号的情况下宣传“emergent coordination”，应将其视为营销。先测量，再宣称。

### 一个最小 ToM-aware agent

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

`other_models` 属性就是 ToM state。一阶 ToM 只保留一层。二阶加入 `other_models[i][other_models_of_j]` —— 我认为 agent i 认为 agent j 相信什么。

### 为什么 long-horizon 会受损

Li et al. 记录了：context limits 会导致 agents 忘记哪个信念属于谁。Hallucination 会把虚假信念加入 other-agent models。两者都会产生“我以为他认为 X”的错误，并随时间复合。

论文和 2024-2026 后续研究中记录的缓解方式：

- **在 prompt 中显式写出 ToM state.** 结构化格式：`{agent_id: belief_list}`。强制 retrieval 保留身份-信念绑定。
- **更短的 reasoning chains.** 每轮更少的 ToM updates 可以减少 hallucination 复合。
- **外部 ToM store.** 在 LLM context 之外维护模型；每轮只注入相关部分。

### ToM 在生产中哪里会失败

- **Adversarial settings.** 具备良好 ToM 的 agents 更容易被操纵（你可以建模它们如何建模你，然后利用它）。
- **Heterogeneous teams.** 当模型不同时，适用于一个 opponent 的 ToM model 不会泛化。
- **Ground-truth-dependent tasks.** ToM 关注信念；如果正确性取决于事实，ToM 可能会分散注意力。

### 你实际能测量的协调

判断团队协调是真实的、而不是 prompt 修饰的三个实用信号：

1. **Complementarity over time.** 在 multi-turn task 中，agents 的行动是否覆盖不重叠的子任务？
2. **Anticipation.** agent A 在 turn T+1 的行动是否依赖于对 B 在 T+2 行动的预测，且预测后来被证明正确？
3. **Correction.** 当 A 在 turn T 误读 B 的信念时，A 是否在 turn T+2 前纠正？

这些都可以在带日志的 multi-agent system 中测量。它们是“coordination”叙事的实质版本。

## 构建它

`code/main.py` 实现：

- `ToMAgent` —— 跟踪自身信念和每个其他 agent 的信念模型。
- 一个合作任务：三个 agents 必须从三个盒子中收集三个 Tokens；每个盒子只能容纳一个 Token。agents 不能通信；它们从彼此的行动中推断意图。
- 两种配置：`zeroth_order`（无 ToM）和 `first_order`（具备一层信念模型的 ToM）。
- 在 200 次随机 trial 上测量：完成率、重复率（两个 agents 目标为同一个盒子）、平均完成轮数。

运行：

```
python3 code/main.py
```

预期输出：zeroth-order agents 会以约 35% 的比例重复努力，并在 10 轮内完成约 60% 的 trials。First-order ToM agents 重复率约 5%，完成率约 95%。这个差值就是可测的协调效果。

## 使用它

`outputs/skill-tom-auditor.md` 是一个 skill，用于审计 multi-agent system 对“emergent coordination”的声明。检查 prompt 修饰、相对于 control 的统计显著性，以及已测量的互补性。

## 发布它

协调声明 checklist：

- **Control condition.** 你的系统去掉协调 prompt 后的版本。两者都要测量。
- **Statistical test.** 在你的指标上，system 与 control 的差异是否在 `p < 0.05` 上显著？
- **Complementarity measure.** 随时间的行动不重叠性，而不只是最终成功。
- **Failure-case log.** 当 agents 协调失败时，ToM state 是什么样？
- **Model-capacity disclosure.** 如果效果在较小模型上消失，就明确说明。

## 练习

1. 运行 `code/main.py`。确认一阶 ToM 将重复率降低约 7 倍。当扩展到 5 个 agents 和 5 个盒子时，这个差距是否仍然存在？
2. 实现二阶 ToM（agent A 建模 B 如何看待 C）。它是否比一阶更好？在哪些任务上？
3. 向 ToM state 注入一次 **hallucination**：每轮随机翻转一个信念。这会使一阶性能下降多少？
4. 阅读 Li et al. (arXiv:2310.10701)。复现“long-horizon degradation”发现：当轮数从 10 增加到 30 时，你的一阶 ToM 性能如何变化？
5. 阅读 Riedl 2025 (arXiv:2510.05174)。在你的模拟日志上实现 higher-order synergy statistic。没有 ToM prompt 条件时，这个效果是否存在？

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Theory of Mind | “理解他人的 minds” | 建模另一个 agent 信念的能力。按阶数分级（0、1、2+）。 |
| Sally-Anne test | “false-belief test” | 1985 年发展心理学；LLMs 能通过简单版本，但会在复杂版本失败。 |
| First-order ToM | “A believes X” | 建模一个他人关于事实的信念。 |
| Second-order ToM | “A believes B believes X” | 更深一层的递归建模。 |
| Identity-linked differentiation | “随时间保持稳定角色” | Riedl 的指标：角色持续存在，而不是随机。 |
| Goal-directed complementarity | “不重叠行动” | agents 目标指向不同子任务，而不是同一个。 |
| Higher-order synergy | “群体超过任何子集” | Riedl 用于真实协调的统计度量。 |
| Coordination illusion | “看起来协调” | 没有可测信号的 prompt 修饰式协调表象。 |

## 延伸阅读

- [Li et al. — Theory of Mind for Multi-Agent Collaboration via Large Language Models](https://arxiv.org/abs/2310.10701) — 合作游戏中的涌现式 ToM；long-horizon failure modes
- [Riedl — Emergent Coordination in Multi-Agent Language Models](https://arxiv.org/abs/2510.05174) — 群体规模测量；ToM prompting 是承重条件
- [Premack & Woodruff — Does the chimpanzee have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-chimpanzee-have-a-theory-of-mind/1E96B02CD9850E69AF20F81FA7EB3595) — ToM 概念在 1978 年的起源
- [Baron-Cohen, Leslie, Frith — Does the autistic child have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-autistic-child-have-a-theory-of-mind/) — Sally-Anne 论文（1985）
