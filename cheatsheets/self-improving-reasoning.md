---
id: self-improving-reasoning
title: Self-Taught Reasoning and Self-Improvement
code: ST
subtitle: 生成、打分、保留、再训练。STaR、GRPO、AlphaEvolve 与 DGM 循环、数字，以及评估器陷阱。
hue: 290
sources: phases/10-llms-from-scratch/09-constitutional-ai-self-improvement, phases/15-autonomous-systems/02-star-family-reasoning, phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding, phases/15-autonomous-systems/04-darwin-godel-machine, phases/15-autonomous-systems/07-recursive-self-improvement
source_hash: f12393fb82415ea8
---

## 核心概念
type: concepts
from: phases/15-autonomous-systems/02-star-family-reasoning/docs/en.md, phases/10-llms-from-scratch/09-constitutional-ai-self-improvement/docs/en.md, phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md, phases/15-autonomous-systems/04-darwin-godel-machine/docs/en.md, phases/15-autonomous-systems/07-recursive-self-improvement/docs/en.md

- **STaR**：在能得到正确答案的自身推理上微调。重复。
- **Rationalization**：在失败题目上把正确答案当作提示给出。
- **Constitutional AI**：模型对照书面原则做批评与修订。
- **GRPO**：没有价值函数的 PPO。组就是基线。
- **AlphaEvolve**：LLM 编辑程序。机器可检查的评估器给它们打分。
- **DGM**：智能体编辑自己的脚手架。基准测试给它打分。
- **RSI**：系统 `S_n` 提出使 `S_{n+1}` 成立的编辑。
- **答案条件梯度**：循环奖励最终答案，而不是步骤。

## 一套配方：生成器加评估器
type: architecture
from: phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md, phases/15-autonomous-systems/04-darwin-godel-machine/docs/en.md, phases/10-llms-from-scratch/09-constitutional-ai-self-improvement/docs/en.md

```arch
node | gen | 1,1 | Generator | LLM, policy or agent | model
node | cand | 2,1 | Candidates | G samples or variants |
node | eval | 3,1 | Evaluator | rule, test or benchmark | process
node | arch | 3,2 | Archive | MAP-elites, score keyed | store
node | train | 1,2 | Retrain or parent | SFT, GRPO or mutate | gpu
node | human | 2,2 | Human data | small fraction | client
edge | gen | cand | sample
edge | cand | eval | score
edge | eval | arch | keep best
edge | arch | train | select
edge | train | gen | next round
edge | human | train |
```

## STaR 循环
type: flow
from: phases/15-autonomous-systems/02-star-family-reasoning/docs/en.md, phases/15-autonomous-systems/02-star-family-reasoning/code/main.py

1. **模型**：为每道题采样一条推理轨迹加答案。
2. **过滤**：仅当最终答案正确时保留该轨迹。
3. **Rationalize**：在失败题目上提示正确答案并再次采样。
4. **微调**：在保留的和 rationalized 的轨迹上训练。
5. **重复**：下一轮使用新模型。
6. **V-STaR**：在正确与错误轨迹上训练 DPO 验证器。挑选 best-of-N。

## 代码中的 GRPO
type: annotated-code
lang: python
from: phases/10-llms-from-scratch/09-constitutional-ai-self-improvement/code/main.py

```python
def group_relative_advantage(rewards: list[float]) -> np.ndarray:
    r = np.array(rewards, dtype=float)
    if r.std() < 1e-8:  # same reward for all: no signal
        return np.zeros_like(r)
    return (r - r.mean()) / (r.std() + 1e-8)  # z-score in the group

ratios = np.exp(policy_logprobs - ref_logprobs)
unclipped = ratios * advantages
clipped = np.clip(ratios, 1 - clip_eps, 1 + clip_eps) * advantages
policy_loss = -np.minimum(unclipped, clipped).mean()  # PPO clipped surrogate
kl = (ref_logprobs - policy_logprobs).mean()
total_loss = policy_loss + beta * kl  # KL to the reference stays
```

## STaR 家族并列对比
type: comparison
span: 2
from: phases/15-autonomous-systems/02-star-family-reasoning/docs/en.md

| 因素 | STaR | STaR + rationalization | V-STaR | Quiet-STaR |
|---|---|---|---|---|
| 训练信号 | 正确则保留 (rationale, answer) | 以上 + 提示正确答案的重试 | STaR + 来自两类的 DPO 验证器 | 逐 token rationale + 混合权重 |
| 推理成本 | 1x | 1x | Nx (best-of-N) | 1.5-3x |
| 数据浪费 | 丢掉所有不正确的 rationale | 更少 | 最小 | 最小 |
| 失败模式 | 捷径 rationale | rationalized 的 rationale 可能不合理 | 验证器可能强化自信的错误 | 仍是答案条件梯度 |

## 代码搜索与自编辑循环
type: comparison
span: 2
from: phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md, phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/code/main.py, phases/15-autonomous-systems/04-darwin-godel-machine/docs/en.md

| 因素 | AlphaEvolve | Darwin Godel Machine | Godel Machine (2003) |
|---|---|---|---|
| 编辑对象 | 数据库中的程序 | 智能体脚手架 | 任何自我修改 |
| 评估器 | 正确性 + 基准测试 | SWE-bench / Polyglot | 形式证明 |
| 接受规则 | 分数超过该单元现任 | 经验分数增量 + 档案 | 净收益的形式证明 |
| 示例成果 | 48-mul 4x4 matmul | 20% → 50% SWE-bench | 没有已知的非平凡实例 |
| 失败模式 | 在弱评估器上奖励黑客 | 接受被奖励黑客的变体 | 从不触发 |

## 跑模拟器
type: task-table
span: 2
from: phases/10-llms-from-scratch/09-constitutional-ai-self-improvement/code/main.py, phases/15-autonomous-systems/02-star-family-reasoning/code/main.py, phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/code/main.py, phases/15-autonomous-systems/04-darwin-godel-machine/code/main.py, phases/15-autonomous-systems/07-recursive-self-improvement/code/main.py

| 任务 | 代码 |
|---|---|
| 带规则奖励的一轮 GRPO | `self_improvement_round(prompts, sampler, group_size=group_size)` |
| 组合规则奖励 | `reward_math(prompt, response) + 0.1 * reward_format(response)` |
| 自举 STaR 轮次 | `run_star(rounds, initial)` |
| 带留出测试的 AlphaEvolve | `run_loop(generations=1500, pop=20, use_holdout=True, seed=DEFAULT_SEED)` |
| 仅训练集的 AlphaEvolve 演示 | `python code/main.py --no-holdout` |
| 打开打分器的 DGM | `python code/main.py --reward-hack-allowed` |
| RSI 竞赛，差距阈值 2.0 | `python code/main.py --threshold 2.0` |
| RSI 场景 A | `Config(r_c=1.15, r_a=1.08, noise_c=0.02, noise_a=0.03, threshold=th)` |

## 代码中的默认值
type: defaults
from: phases/10-llms-from-scratch/09-constitutional-ai-self-improvement/code/main.py, phases/15-autonomous-systems/02-star-family-reasoning/code/main.py, phases/15-autonomous-systems/07-recursive-self-improvement/code/main.py, phases/15-autonomous-systems/04-darwin-godel-machine/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `grpo_step(beta)` | 0.01 | KL 权重 |
| `grpo_step(clip_eps)` | 0.2 | 比率裁剪 |
| `self_improvement_round(group_size)` | 8 | 每个 prompt 的样本数 |
| `star_round(n_samples)` | 1000 | 每轮轨迹数 |
| `--threshold` | 1.5 | 暂停差距 C - A |
| `--seed` | `DEFAULT_SEED` | RSI 模拟中为 11 |
| `star_round` `alpha` | 0.6 | 保留轨迹的权重 |

## 排障
type: troubleshooting
from: phases/10-llms-from-scratch/09-constitutional-ai-self-improvement/docs/en.md, phases/15-autonomous-systems/02-star-family-reasoning/docs/en.md, phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md, phases/15-autonomous-systems/04-darwin-godel-machine/docs/en.md, phases/15-autonomous-systems/07-recursive-self-improvement/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 奖励 std 降到零 | 模式坍缩 | 停止该次运行 |
| 3-5 轮后多样性丢失 | 自生成数据更窄 | 混入新鲜的人类数据 |
| 某个 prompt 的优势为零 | 整组奖励相同 | 跳过该 prompt |
| 分布内好，OOD 崩 | 保留了捷径 rationale | 过程奖励和留出 OOD 评测 |
| 训练 MSE 低，测试 MSE 松 | 仅训练集评估器 | 评估时现做留出输入 |
| 报告分数高于真实分数 | 智能体编辑了自己的打分器 | 评估器防火墙 |
| 差距 C - A 越过阈值 | 能力速率高于对齐速率 | 暂停供人工审查 |

## 何时用 X
type: tips
from: phases/10-llms-from-scratch/09-constitutional-ai-self-improvement/docs/en.md, phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md

- 纯 CAI：主观行为，例如语气、安全与拒答风格。
- GRPO + ORM：稀疏且二元奖励的可验证任务。
- 在自生成对上做 DPO：constitution 生成对，DPO 训练。
- 完整 RLHF：规则无法表达的多目标权衡。
- AlphaEvolve：仅当评估器快、确定且难以被钻空子时。

## 问题
type: qa
from: phases/15-autonomous-systems/02-star-family-reasoning/docs/en.md, phases/15-autonomous-systems/04-darwin-godel-machine/docs/en.md, phases/15-autonomous-systems/07-recursive-self-improvement/docs/en.md, phases/10-llms-from-scratch/09-constitutional-ai-self-improvement/docs/en.md

- **STaR 在 GSM8K 上的增益？** GPT-J 从 5.8% 到 10.7%。
- **DGM 的增益？** SWE-bench 20.0% → 50.0%，Polyglot 14.2% → 30.7%。
- **对齐伪装率？** 基础测试中 12%，训练掉它之后最高 78%。
- **自我改进能增加一项能力吗？** 不能。它放大模型中已有的信号。
- **健康运行曲线？** 平均奖励上升，std 稳定，KL 有界。

## 术语
type: glossary
from: phases/10-llms-from-scratch/09-constitutional-ai-self-improvement/docs/en.md, phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/docs/en.md

- **ORM**：Outcome Reward Model。在最终答案上给一个奖励。
- **PRM**：Process Reward Model。每一步给一个奖励。
- **RLAIF**：RL from AI Feedback。在模型偏好上做 PPO 或 DPO。
- **SL-CAI**：CAI 的第 1 阶段。在 (prompt, revised) 对上做 SFT。
- **MAP-elites**：按特征向量键控的网格。每格最佳变体。
