---
id: agent-reasoning-patterns
title: ReAct, ReWOO, Reflexion and Tree of Thoughts
code: RR
subtitle: 选择、构建并终止 agent 推理循环。ReAct、ReWOO、Reflexion、ToT、LATS、Self-Refine、CRITIC 与 CoT。
hue: 280
sources: phases/14-agent-engineering/01-the-agent-loop, phases/14-agent-engineering/02-rewoo-plan-and-execute, phases/14-agent-engineering/03-reflexion-verbal-rl, phases/14-agent-engineering/04-tree-of-thoughts-lats, phases/14-agent-engineering/05-self-refine-and-critic, phases/11-llm-engineering/02-few-shot-cot
source_hash: f39d998186f057e3
---

## 四种模式对比
type: comparison
span: 2
from: phases/14-agent-engineering/01-the-agent-loop/docs/en.md, phases/14-agent-engineering/02-rewoo-plan-and-execute/docs/en.md, phases/14-agent-engineering/03-reflexion-verbal-rl/docs/en.md, phases/14-agent-engineering/04-tree-of-thoughts-lats/docs/en.md, phases/11-llm-engineering/02-few-shot-cot/docs/en.md

| 维度 | ReAct | ReWOO | Reflexion | ToT / LATS |
|---|---|---|---|---|
| 角色 | Thought、Action、Observation | Planner、Workers、Solver | Actor、Evaluator、Self-Reflector | 策略、价值函数、搜索 |
| LLM 调用 | 每一步一次 | 一次规划，一次求解 | 每次试验跑一轮 | 每个节点一次 |
| Observation | 每一步都有 | planner 中没有 | 作为反思进入下一次试验 | 混入价值函数 |
| Token 成本 | 随深度增长 | 在 HotpotQA 上约少 5x | 随缓冲区增长 | CoT 的 100-1000x |
| 论文结果 | ALFWorld +34 分 | HotpotQA 准确率 +4 | 在 ALFWorld 上胜过 ReAct | Game of 24：4% 到 74% |
| 主要故障 | 循环长度爆炸 | 计划是静态的 | 记忆腐化 | 评估器有噪声 |

## 各模式的适用时机
type: concepts
from: phases/14-agent-engineering/02-rewoo-plan-and-execute/docs/en.md, phases/14-agent-engineering/03-reflexion-verbal-rl/docs/en.md, phases/14-agent-engineering/04-tree-of-thoughts-lats/docs/en.md, phases/14-agent-engineering/05-self-refine-and-critic/docs/en.md

- **ReAct**：短任务、未知环境、需被动处理异常。
- **ReWOO**：工具已知、证据可并行的结构化任务。
- **Plan-and-Execute**：类似 ReWOO，部分执行后可重新规划。
- **Plan-and-Act**：长程（>30 步）、Web、移动端或电脑操作。
- **Reflexion**：失败信号清晰，且同类任务反复出现。
- **ToT / LATS**：价值函数便宜又可靠。正确性比墙钟时间更重要。
- **Self-Refine**：没有外部验证器。同一个模型生成并批评。
- **CRITIC**：有外部验证器：搜索、代码、计算器、测试。

## ReAct 循环：AgentLoop.run
type: flow
from: phases/14-agent-engineering/01-the-agent-loop/code/main.py, phases/14-agent-engineering/01-the-agent-loop/docs/en.md

1. **User**：消息作为 `user` 轮进入历史。
2. **LLM**：`respond(history)` 返回一个 thought 和一个 action，或 `finish`。
3. **ToolRegistry**：`dispatch(call)` 按名称运行工具。
4. **Formatter**：工具或参数错误时返回 `error:` 字符串，而不是崩溃。
5. **Loop**：action 轮及其 observation 进入历史。回到第 2 步。
6. **Stop**：`finish`、没有工具调用、达到最大轮数、最大 token 数或触发 guardrail。
7. **Budget**：`max_turns` 之后循环返回 "budget exhausted"。

## ReWOO：规划、取证、求解
type: architecture
from: phases/14-agent-engineering/02-rewoo-plan-and-execute/code/main.py, phases/14-agent-engineering/02-rewoo-plan-and-execute/docs/en.md

```arch
node | q | 1,2 | Question | user_question | client
node | plan | 2,2 | Planner | plan DAG, no observations | model
node | e1 | 3,1 | Worker E1 | search capital | process
node | e2 | 3,2 | Worker E2 | population of #E1 | process
node | e3 | 3,3 | Worker E3 | round_million #E2 | process
node | solve | 4,2 | Solver | question, plan, evidence | model
edge | q | plan |
edge | plan | e1 | topological
edge | e1 | e2 | #E1
edge | e2 | e3 | #E2
edge | e3 | solve | evidence
```

## Reflexion 试验
type: flow
from: phases/14-agent-engineering/03-reflexion-verbal-rl/code/main.py, phases/14-agent-engineering/03-reflexion-verbal-rl/docs/en.md

1. **Actor**：`actor.act(memory)` 返回一条候选轨迹。
2. **Evaluator**：`binary_evaluator(attempt, TARGET)` 返回 success 和 delta。
3. **Self-Reflector**：写一行反思，例如 "pick larger values"。
4. **EpisodicMemory**：`memory.add` 保存它。超过 `max_len` 时丢弃最旧的。
5. **下一次试验**：重新开始，但能看到反思。一次成功就结束运行。

## LATS：一次 MCTS 迭代
type: flow
from: phases/14-agent-engineering/04-tree-of-thoughts-lats/docs/en.md, phases/14-agent-engineering/04-tree-of-thoughts-lats/code/main.py

1. **Select**：按 `Q(s, a) + c * sqrt(ln N(s) / N(s, a))` 从根走到叶子。
2. **Expand**：用策略生成 K 个子节点。
3. **Simulate**：从一个子节点 rollout。用价值函数给叶子打分。
4. **Backpropagate**：在路径上给 `visits` 加 1，给 `value_sum` 加上奖励。

## 代码中的任务
type: task-table
from: phases/14-agent-engineering/01-the-agent-loop/code/main.py, phases/14-agent-engineering/02-rewoo-plan-and-execute/code/main.py, phases/14-agent-engineering/03-reflexion-verbal-rl/code/main.py, phases/14-agent-engineering/04-tree-of-thoughts-lats/code/main.py, phases/14-agent-engineering/05-self-refine-and-critic/code/main.py

| 任务 | 代码 |
|---|---|
| 注册工具 | `tools.register("calculator", calculator)` |
| 对计划 DAG 排序 | `topological(plan)` |
| 填充 #E 引用 | `resolve_references(value, evidence)` |
| 带记忆的 Reflexion | `run_reflexion(max_trials=4, use_memory=True)` |
| ToT 广度优先 | `tot_bfs(root_tot)` |
| LATS 搜索 | `mcts(root_lats, iterations=80, rng=rng)` |
| CRITIC 循环 | `run_loop("world facts", use_critic=True)` |

## CoT 升级流水线
type: annotated-code
lang: python
from: phases/11-llm-engineering/02-few-shot-cot/code/advanced_prompting.py, phases/11-llm-engineering/02-few-shot-cot/docs/en.md

```python
single_answer, _ = few_shot_cot_solve(question, examples, client, model)  # temperature 0.0
sc_answer, confidence, reasonings, votes = self_consistency_solve(
    question, examples, client, model, n_samples=5
)                                                   # temperature 0.7, majority vote
if confidence >= 0.8 and single_answer == sc_answer:
    return sc_answer                                # 4 of 5 samples agree
tot_answer, tot_reasoning = tree_of_thought_solve(
    question, client, model, breadth=3, depth=2
)                                                   # escalate hard problems
```

## Prompt 推理阶梯（GPT-5，GSM8K）
type: comparison
from: phases/11-llm-engineering/02-few-shot-cot/docs/en.md

| 维度 | Zero-Shot CoT | Few-Shot CoT | Self-Consistency (N=5) | Tree-of-Thought |
|---|---|---|---|---|
| API 调用 | 1 | 1 | 5 | 10-40+ |
| Token 开销 | 50-200 token | 300-600 token | 5x token 成本 | 10-40x token 成本 |
| 准确率 | 97% | 98% | 98.5% | Game of 24 上 74% |
| 最适合 | 快速提升推理 | 单次调用的最高准确率 | 高风险推理 | 搜索/规划问题 |

## 课程代码中的默认值
type: defaults
from: phases/14-agent-engineering/01-the-agent-loop/code/main.py, phases/14-agent-engineering/03-reflexion-verbal-rl/code/main.py, phases/14-agent-engineering/04-tree-of-thoughts-lats/code/main.py, phases/14-agent-engineering/05-self-refine-and-critic/code/main.py, phases/11-llm-engineering/02-few-shot-cot/code/advanced_prompting.py, phases/11-llm-engineering/02-few-shot-cot/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_turns` | 12 | AgentLoop 轮数预算。demo 设为 10 |
| `max_len` | 6 | EpisodicMemory 大小 |
| `max_iters` | 4 | `run_loop` 中 refine 循环上限 |
| `uct` 中的 `c` | 1.4 | 探索权重 |
| `max_expansions_per_level` | 8 | ToT BFS 前沿宽度 |
| `max_depth` | 3 | ToT BFS 深度 |
| `n_samples` | 5 | Self-consistency 投票数 |
| `temperature` | 0.7 | 采样路径。为 0.0 时所有样本相同 |

## 故障排查
type: troubleshooting
from: phases/14-agent-engineering/01-the-agent-loop/docs/en.md, phases/14-agent-engineering/02-rewoo-plan-and-execute/code/main.py, phases/14-agent-engineering/03-reflexion-verbal-rl/docs/en.md, phases/14-agent-engineering/04-tree-of-thoughts-lats/docs/en.md, phases/14-agent-engineering/05-self-refine-and-critic/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| Agent 在 400 错误上幻觉成功 | 错误没有回传 | 把每个错误转成 observation 字符串 |
| 网页向 agent 下达命令 | 信任边界崩塌 | 只有用户的直接指令才算授权 |
| "cyclic plan or unresolved reference" | 某一步引用了不存在的节点 | 修正计划中的 #E 引用 |
| 重跑越来越慢，建议过时 | 记忆腐化 | 对反思做压缩或设置 TTL |
| 反思没有帮助 | 外部故障，网络中断 | 不要保存一次性的偶发失败 |
| 批评总说看起来不错 | 走过场的循环 | 使用结构上不同的 prompt |
| 搜索找到高分的错误答案 | 评估器有噪声 | 只在价值函数可靠时用搜索 |

## 问答
type: qa
from: phases/14-agent-engineering/02-rewoo-plan-and-execute/docs/en.md, phases/14-agent-engineering/04-tree-of-thoughts-lats/docs/en.md, phases/14-agent-engineering/05-self-refine-and-critic/docs/en.md, phases/11-llm-engineering/02-few-shot-cot/docs/en.md

- **为什么 ReWOO 用的 token 更少？** ReAct 的 prompt 携带之前的每一步。ReWOO 的 worker 只拿到工具调用。
- **为什么 7B 模型也能规划？** planner 看不到 observation。它从 175B 教师模型的计划中学习。
- **LATS 比 ToT 多了什么？** MCTS。LLM 同时充当策略、价值函数和自我反思者。
- **为什么 Self-Refine 保留历史？** Refine 能看到之前的输出和批评。没有历史，质量会急剧下降。
- **为什么选 CRITIC 而不是 Self-Refine？** 幻觉在生成它的模型看来往往很有说服力。
- **给推理模型加 CoT？** 不需要。o 系列和 DeepSeek-R1 在内部运行 CoT。

## 提示
type: tips
from: phases/14-agent-engineering/02-rewoo-plan-and-execute/docs/en.md, phases/14-agent-engineering/04-tree-of-thoughts-lats/outputs/skill-search-policy.md, phases/14-agent-engineering/05-self-refine-and-critic/docs/en.md

- 从最简单的模式开始。一次工具调用加一个总结不需要 ReWOO。
- 验证器通过时就停止 refine 循环。同时用 `max_iterations` 设上限。
- 分支因子 K 保持在 3-5。K=10 会让成本爆炸。
