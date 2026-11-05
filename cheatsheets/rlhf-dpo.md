---
id: rlhf-dpo
title: RLHF, DPO and Preference Tuning
code: RD
subtitle: 奖励模型加 PPO，对照 DPO 及其家族。损失、beta 与 KL 设置、失败模式与修复。
hue: 20
sources: phases/09-reinforcement-learning/09-reward-modeling-rlhf, phases/10-llms-from-scratch/07-rlhf, phases/10-llms-from-scratch/08-dpo, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family, phases/19-capstone-projects/40-dpo-from-scratch
source_hash: 72f1a1b5224c3ea9
---

## RLHF 对照 DPO
type: comparison
from: phases/10-llms-from-scratch/08-dpo/docs/en.md

| 因素 | RLHF (PPO) | DPO |
|---|---|---|
| 要训练的模型 | 3：SFT、奖励、策略 | 1：仅策略 |
| 训练循环 | 3：SFT、RM、PPO | 2：SFT、DPO |
| 超参数 | lr、KL 系数、裁剪比、RM lr、epochs | lr、beta、epochs |
| 奖励模型 | 单独训练 | 隐含在模型概率中 |
| 算法 | PPO，复杂且不稳定 | 监督学习，稳定 |
| 内存中的模型 | PPO 期间 3-4 | 2：当前与参考 |
| 算力 | 三个循环 | 大约是 RLHF 的三分之一 |
| 数据 | 带新评分的在线循环 | 固定的偏好数据集 |

## 何时用 X
type: tips
from: phases/10-llms-from-scratch/08-dpo/docs/en.md, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/docs/en.md, phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md

- DPO：5,000-20,000 对、算力有限，或要做多次数据集实验。
- RLHF：大规模、多目标奖励，或迭代在线评分循环。
- SimPO：长度偏置明显。它也丢掉参考模型。
- KTO：你只有非成对的好或坏标签。
- ORPO：你想要从基座模型出发的单阶段，没有 SFT 检查点。
- BPO：DPO 日志显示 chosen 对数概率下降。
- IPO：偏好强度差异很大且 DPO 饱和。

## RLHF 流水线
type: architecture
from: phases/10-llms-from-scratch/07-rlhf/docs/en.md, phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md

```arch
node | sft | 1,1 | SFT model | stage 1 | model
node | pairs | 1,2 | Preference pairs | prompt, chosen, rejected | store
node | policy | 2,1 | Policy | init from SFT | model
node | rm | 2,2 | Reward model | scalar head, Bradley-Terry | model
node | ref | 3,1 | Reference | frozen SFT copy | model
node | ppo | 3,2 | PPO update | reward minus beta KL | process
edge | sft | policy | initialize
edge | sft | ref | freeze
edge | pairs | rm | train
edge | policy | rm | response
edge | rm | ppo | reward
edge | ref | ppo | KL penalty
edge | ppo | policy | update
```

## 一次 DPO epoch（毕业项目）
type: flow
from: phases/19-capstone-projects/40-dpo-from-scratch/code/main.py, phases/19-capstone-projects/40-dpo-from-scratch/docs/en.md

1. **Reference**：在 `torch.no_grad()` 下，把 chosen 与 rejected 的对数概率存一次。
2. **Policy**：`sequence_log_prob` 对补全对数概率求和。Prompt token 不计入。
3. **Margin**：`diff_w - diff_l`，chosen 对数比减去 rejected 对数比。
4. **Loss**：每个三元组 `-F.logsigmoid(beta * margin)`。
5. **Step**：在 Adam 上 `opt.zero_grad()`、`loss.backward()`、`opt.step()`。
6. **Check**：margin 没有上升或 loss 没有下降时，`run_demo` 返回 1。

## DPO 损失与冻结参考
type: annotated-code
lang: python
from: phases/19-capstone-projects/40-dpo-from-scratch/code/main.py

```python
diff_w = logp_w_pol - logp_w_ref            # chosen log-ratio
diff_l = logp_l_pol - logp_l_ref            # rejected log-ratio
margin = diff_w - diff_l                    # implicit reward gap over beta
z = beta * margin
loss = -F.logsigmoid(z)                     # stable -log sigmoid
policy.load_state_dict(reference.state_dict())  # start from equal weights
for p in reference.parameters():
    p.requires_grad = False                 # reference never moves
target = 1.0 / (2.0 * beta) if beta > 0 else 0.0
loss = (margin - target) ** 2               # IPO variant
```

## 奖励模型与 KL 奖励（玩具）
type: annotated-code
lang: python
from: phases/09-reinforcement-learning/09-reward-modeling-rlhf/code/main.py

```python
p = sigmoid(r_pos - r_neg)                  # Bradley-Terry P(chosen wins)
grad_scale = 1 - p
w[t] += lr * grad_scale * c                 # chosen tokens up, rejected down
kl_term = kl(probs_new, probs_ref)
reward = rm_score - beta * kl_term          # KL-penalized reward
advs = [(r - mean_r) / sd_r for r in rewards]  # normalized advantages
ratio = math.exp(logp - log_pi_old)
clipped = (adv > 0 and ratio > 1 + eps) or (adv < 0 and ratio < 1 - eps)
```

## 代码中的任务
type: task-table
from: phases/09-reinforcement-learning/09-reward-modeling-rlhf/code/main.py, phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md, phases/10-llms-from-scratch/08-dpo/code/main.py, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/code/main.py, phases/19-capstone-projects/40-dpo-from-scratch/code/main.py

| 任务 | 代码 |
|---|---|
| 训练 Bradley-Terry RM | `train_rm(n_pairs=500, lr=0.1)` |
| 玩具 PPO-RLHF 循环 | `rlhf_loop(w, updates=300, beta=0.1)` |
| 带自适应 KL 的 TRL PPO | `PPOConfig(init_kl_coef=0.05, target_kl=6.0)` |
| 训练 DPO，第 10.08 课 | `dpo_train(..., lr=5e-6, beta=0.1)` |
| 扫描 beta | `betas=[0.01, 0.1, 0.3, 1.0]` |
| 回答对数概率 | `sequence_log_prob(policy, prompt, chosen)` |
| 比较六种损失 | `python3 code/main.py` |
| 毕业项目端到端 | `sys.exit(run_demo())` |

## 损失公式
type: concepts
from: phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md, phases/10-llms-from-scratch/08-dpo/docs/en.md, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/docs/en.md, phases/19-capstone-projects/40-dpo-from-scratch/docs/en.md

- **RM 损失**：$-\log \sigma(R_\phi(x, y_+) - R_\phi(x, y_-))$，Bradley-Terry 成对逻辑斯蒂。
- **隐式奖励**：$r = \beta \log \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} + \beta \log Z(x)$。$Z(x)$ 抵消。
- **DPO**：$-\log \sigma(\beta (\log \frac{\pi(y_w)}{\pi_{\text{ref}}(y_w)} - \log \frac{\pi(y_l)}{\pi_{\text{ref}}(y_l)}))$
- **IPO**：对数比差距对 $\frac{1}{2\beta}$ 的平方误差。差距保持有界。
- **SimPO**：长度归一化的 $\frac{\beta}{|y|} \log \pi(y \mid x)$，带间隔 $\gamma$。无参考。
- **梯度符号**：$\partial L / \partial \log \pi_\theta(y_w) = -\beta (1 - \sigma(z))$。Chosen 上升。

## 默认值
type: defaults
from: phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md, phases/10-llms-from-scratch/07-rlhf/docs/en.md, phases/10-llms-from-scratch/08-dpo/docs/en.md, phases/19-capstone-projects/40-dpo-from-scratch/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| RLHF KL β | 0.01-0.05 | 典型范围 |
| InstructGPT KL β | 0.02 | lr=1.5e-5，4 个 PPO epoch |
| PPO 裁剪 ε | 0.2 | 比率裁到 1 ± ε |
| TRL `init_kl_coef` | 0.05 | 配合 `target_kl=6.0` |
| DPO β，第 10.08 课 | 0.1 | 最佳区间 0.1 到 0.3 |
| DPO lr，第 10.08 课 | 5e-6 | 5 个 epoch |
| 毕业项目 `DPOConfig` beta | 0.2 | lr 1e-3，30 个 epoch |
| 毕业项目 `warmup_epochs` | 8 | 先预训练参考 |

## 排障
type: troubleshooting
from: phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md, phases/10-llms-from-scratch/07-rlhf/docs/en.md, phases/10-llms-from-scratch/08-dpo/docs/en.md, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 奖励攀升，人工评估持平 | 奖励黑客 | 早停，提高 β，拓宽 RM 数据 |
| 回答变长 | 长度黑客 | 长度归一化奖励，或 SimPO |
| 平均 KL 超过约 5-10 | 策略相对 SFT 漂移 | 以固定 KL 为目标的自适应 β |
| 策略几乎不变 | β 太高 | 降低 β |
| DPO 中 chosen 对数概率下降 | Degraded Chosen Response | 对 chosen 回答加 BPO 惩罚 |
| DPO 差距爆炸 | 隐式奖励差距无界 | IPO，差距上限为 1/(2 beta) |
| RM 分数不可靠 | RM 比策略小 | RM 至少与策略一样大 |
| 约 30% 噪声标签 | 模糊偏好 | 一致率过滤的数据，BT 温度 |

## 问题
type: qa
from: phases/10-llms-from-scratch/07-rlhf/docs/en.md, phases/09-reinforcement-learning/09-reward-modeling-rlhf/docs/en.md, phases/10-llms-from-scratch/08-dpo/docs/en.md, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/docs/en.md

- **为什么用成对，而不是绝对分数？** 人很擅长给两个回答排序，却不擅长给单个回答打分。
- **为什么有 KL 项？** 它让策略停留在 RM 训练数据的附近。
- **为什么 RM 读最后一个 token？** 因果掩码让它看见整段序列。
- **每对 DPO 要几次前向？** 四次：两个模型乘以两个回答。
- **DAA 能逃脱过度优化吗？** 不能。它们转而过度优化参考比率。
