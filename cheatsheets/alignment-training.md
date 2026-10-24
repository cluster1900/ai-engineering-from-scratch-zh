---
id: alignment-training
title: Alignment Training: Instructions, DPO Family, RLAIF
code: AI
subtitle: 选择并调优 RLHF、DPO、IPO、KTO、SimPO、ORPO、BPO 和 Constitutional AI。损失、默认值与失败模式。
hue: 290
sources: phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif, phases/10-llms-from-scratch/07-rlhf, phases/10-llms-from-scratch/08-dpo
source_hash: b28964c127b9549a
---

## RLHF vs RLAIF vs DPO
type: comparison
span: 2
from: phases/10-llms-from-scratch/08-dpo/docs/en.md, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/docs/en.md, phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal/docs/en.md, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/docs/en.md

| 因素 | RLHF (PPO) | RLAIF (CAI) | DPO |
|---|---|---|---|
| 偏好信号 | 人类标注员对成对样本排序 | 反馈模型阅读原则 | 人类或 AI 偏好 |
| 奖励模型 | 必需（单独训练） | 在 AI 偏好上训练 | 隐含在模型概率中 |
| RL 算法 | PPO（复杂、不稳定） | 针对 RM 做 PPO | 监督学习（稳定） |
| 需训练的模型 | 3（SFT + 奖励 + 策略） | 与 RLHF 相同 | 1（仅策略） |
| 内存中的模型 | 3-4 | 与 RLHF 相同 | 2（当前 + 参考） |
| 超参数 | lr、KL 系数、裁剪比、RM lr、epochs x3 | 与 RLHF 相同 | lr、beta、epochs |
| 在线循环 | 是，用新评分重训 RM | 是，使用迭代循环 | 否，固定的成对数据集 |
| 主要失败 | 奖励黑客 | Goodhart 依旧，谄媚减少 | 过度优化参考比率 |

## DPO 家族损失
type: comparison
span: 2
from: phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/docs/en.md, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/code/main.py, phases/10-llms-from-scratch/08-dpo/docs/en.md

| 因素 | IPO | KTO | SimPO | ORPO |
|---|---|---|---|---|
| 数据 | 成对 | 非成对的好或坏标签 | 成对 | 成对 |
| 参考策略 | 是 | 是 | 否 | 否 |
| 修复 DPO 的问题 | 奖励差距无界 | 需要成对数据 | 长度偏置 | 单独的 SFT 阶段 |
| 损失形式 | 平方误差，目标 1/(2 beta) | 前景理论，损失厌恶 | 长度归一化的对数概率，间隔 gamma | NLL 加 lambda 乘以优势比 |
| 玩具函数 | `train_dpo(pairs, variant="ipo")` | `train_kto(labels)` | `train_simpo(pairs)` | `train_orpo(pairs)` |
| 玩具默认值 | `beta: float = 0.1` | `beta: float = 0.1` | `beta: float = 1.5`, `gamma: float = 0.5` | `lam: float = 0.1` |

## 何时选用
type: tips
from: phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/docs/en.md, phases/10-llms-from-scratch/08-dpo/docs/en.md, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/docs/en.md

- DPO：你有 5,000-20,000 对数据或算力有限。它大约只需 RLHF 三分之一的算力。
- SimPO：DPO 中长度偏置明显。
- KTO：你只有非成对的二元反馈。
- ORPO：你想要从基座模型出发的单阶段流水线。
- BPO：DPO 日志显示 chosen 的对数概率下降。
- IPO：偏好强度差异很大且 DPO 饱和。
- RLHF："更好" 有许多维度，或你在在线循环中为新样本打分。
- RLAIF：你用一个阅读显式原则的模型替代人类标注员。

## InstructGPT 流水线
type: architecture
from: phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal/docs/en.md, phases/10-llms-from-scratch/07-rlhf/docs/en.md

```arch
node | base | 1,1 | Base model | completes text | model
node | sft | 2,1 | SFT model | cross-entropy on pairs | model
node | prefs | 3,1 | Preference pairs | prompt, winner, loser | store
node | rm | 4,1 | Reward model | scalar head, Bradley-Terry | model
node | ref | 1,2 | Reference model | frozen SFT | model
node | pol | 2,2 | Policy model | being optimized | model
node | ppo | 3,2 | PPO update | reward - beta * KL | process
node | lab | 4,2 | Human annotators | rank K completions | client
edge | base | sft | SFT
edge | sft | prefs | generate
edge | lab | prefs | rank
edge | prefs | rm | train
edge | sft | ref | freeze
edge | sft | pol | init
edge | pol | rm | response
edge | rm | ppo | reward
edge | ref | ppo | KL penalty
edge | ppo | pol | update
```

## Constitutional AI 流水线
type: flow
from: phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/docs/en.md

1. **SFT 模型**：有帮助但尚不无害。它回答一个红队提示。
2. **批评模型**：读取一条抽样的原则并批评该回答。
3. **修订步骤**：修订回答。修订后的回答作为 SFT 目标。
4. **反馈模型**：依据抽样的原则对成对补全排序。
5. **奖励模型**：在 AI 生成的偏好上训练。
6. **PPO**：像 InstructGPT 一样，针对 RM 优化策略。
7. **Constitutional Classifier**：对输出把关。v1 有 23.7% 的算力开销，v2 约 1%。

## 损失公式
type: concepts
from: phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal/docs/en.md, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/docs/en.md, phases/10-llms-from-scratch/07-rlhf/docs/en.md, phases/10-llms-from-scratch/08-dpo/docs/en.md

- **Bradley-Terry RM**：$L_{\text{RM}} = -\log \sigma(r(x, y_w) - r(x, y_l))$
- **RLHF 目标**：$\mathbb{E}[r(x, y)] - \beta \, \mathrm{KL}(\pi \,\|\, \pi_{\text{SFT}})$
- **PPO-ptx**：$J(\pi) + \gamma \, \mathbb{E}_{x \sim D_{\text{pretrain}}}[\log \pi(x)]$
- **隐式奖励**：$\beta \log \frac{\pi(y \mid x)}{\pi_{\text{ref}}(y \mid x)}$
- **DPO**：$-\log \sigma(\beta (\log \frac{\pi(y_w)}{\pi_{\text{ref}}(y_w)} - \log \frac{\pi(y_l)}{\pi_{\text{ref}}(y_l)}))$
- **IPO**：（对数比差距 $- \frac{1}{2\beta}$）的平方。间隔保持有界。
- **SimPO**：$-\log \sigma(\frac{\beta}{|y_w|} \log \pi(y_w) - \frac{\beta}{|y_l|} \log \pi(y_l) - \gamma)$
- **ORPO**：$L_{\text{NLL}}(y_w) + \lambda L_{\text{OR}}$，无参考策略。

## 代码中的两种成对损失
type: annotated-code
lang: python
from: phases/10-llms-from-scratch/07-rlhf/code/main.py, phases/10-llms-from-scratch/08-dpo/code/main.py

```python
def bradley_terry_loss(reward_preferred, reward_rejected):
    diff = reward_preferred - reward_rejected        # RM score gap
    loss = -np.log(sigmoid(diff) + 1e-8)             # stage 2 RM loss

def dpo_loss(policy_logprob_preferred, policy_logprob_rejected,
             ref_logprob_preferred, ref_logprob_rejected, beta=0.1):
    preferred_ratio = policy_logprob_preferred - ref_logprob_preferred
    rejected_ratio = policy_logprob_rejected - ref_logprob_rejected
    logit = beta * (preferred_ratio - rejected_ratio)  # 4 log-probs in
    loss = -np.log(sigmoid(logit) + 1e-8)            # no reward model
    preferred_reward = beta * preferred_ratio        # implicit reward
    rejected_reward = beta * rejected_ratio
    "reward_margin": float(preferred_reward - rejected_reward)  # must grow
```

## 代码中的玩具流水线
type: task-table
from: phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal/code/main.py, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/code/main.py, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/code/main.py, phases/10-llms-from-scratch/07-rlhf/code/main.py, phases/10-llms-from-scratch/08-dpo/code/main.py

| 任务 | 代码 |
|---|---|
| 运行课程演示 | `python3 code/main.py` |
| 标准玩具 RLHF | `stage3_ppo(sft, rm, beta=0.1)` |
| 展示奖励黑客 | `stage3_ppo(sft, rm, beta=0.0)` |
| 注入奖励模型缺陷 | `stage2_reward_model(bias=[0.5, 0.0, 0.0])` |
| 训练 DPO、IPO 或 BPO | `train_dpo(pairs, variant="bpo")` |
| 构建 CAI SFT 语料 | `build_cai_sft_corpus(500)` |
| AI 标注员对一对样本排序 | `ai_feedback_rank(a, b)` |
| 扫描 DPO beta | `betas=[0.01, 0.1, 0.3, 1.0]` |

## 故障排查
type: troubleshooting
from: phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal/docs/en.md, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/docs/en.md, phases/10-llms-from-scratch/07-rlhf/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 奖励攀升，输出退化 | beta 太低，RM 有盲区 | 提高 KL 惩罚 |
| 相比 SFT 没有提升 | beta 太高 | 降低 beta |
| RLHF 后基准下降 | 对齐税 | PPO-ptx：混入预训练梯度 |
| 回答越来越长 | RM 按长度打分 | 对抗性 RM 数据，或 SimPO |
| 模型什么都同意 | 标注员导致的谄媚 | 多个奖励模型，对抗性数据 |
| DPO 中 chosen 对数概率下降 | Degraded Chosen Response | 改用 BPO |
| DPO 奖励差距爆炸 | 隐式差距无界 | 使用 IPO，差距上限为 1/(2 beta) |
| 金标奖励先达峰后崩溃 | DAA 同样会过度优化 | 更好的数据、集成、早停 |

## 默认值
type: defaults
span: 1
from: phases/10-llms-from-scratch/07-rlhf/docs/en.md, phases/10-llms-from-scratch/07-rlhf/code/main.py, phases/10-llms-from-scratch/08-dpo/docs/en.md, phases/10-llms-from-scratch/08-dpo/code/main.py, phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal/code/main.py, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| PPO `kl_coeff` | 0.02 | InstructGPT。Llama 2 Chat 使用 0.01 |
| PPO `lr` | 1.5e-5 | InstructGPT：256K 个 episode，每批 4 个 PPO epoch |
| PPO 裁剪 epsilon | 0.2 | 典型值 |
| DPO `beta` | 0.1 | 最佳区间 0.1 到 0.3 |
| DPO `lr` | 5e-6 | `dpo_train` 中的 `num_epochs=5` |
| RM `lr` | 1e-4 | `train_reward_model` 中的 `num_epochs=10` |
| 玩具 `stage3_ppo` | `steps: int = 300` | `batch: int = 32`, `lr: float = 0.1` |
| KTO 损失厌恶 | 2.0 | 玩具中坏标签的权重。第 08 课说是 1.5x |

## 问题
type: qa
from: phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal/docs/en.md, phases/10-llms-from-scratch/07-rlhf/docs/en.md, phases/10-llms-from-scratch/08-dpo/docs/en.md, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/docs/en.md, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/docs/en.md

- **为什么 1.3B 的 InstructGPT 胜过 175B 的 GPT-3？** 标注员约 70% 的时候更偏好它。对齐是与能力不同的另一个维度。
- **RLHF 能增加事实知识吗？** 不能。基座模型决定了能力下限。
- **为什么用成对标签？** 人类擅长比较两个回答，却不擅长给出绝对分数。
- **多高的 RM 准确率算好？** 在留出的成对数据上约 72%。标注员间一致率约为 73%。
- **RLAIF 只是更便宜的 RLHF 吗？** 不是。它的信号是可读的：你能读到原则、批评和修订。
- **DAA 能逃脱 Goodhart 吗？** 不能。过度优化转移到了参考策略比率上。
