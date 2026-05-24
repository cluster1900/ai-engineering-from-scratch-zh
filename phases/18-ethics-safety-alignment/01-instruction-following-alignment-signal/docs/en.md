# 将遵循指令作为对齐信号

> 后续所有对 RLHF 的批评，都是在反对这条 pipeline。你在研究 optimization pressure 如何扭曲一个 proxy 之前，必须先看清这个 proxy。InstructGPT (Ouyang et al., 2022) 定义了参考架构：在指令-回答对上进行 supervised fine-tuning，在成对 preference ranking 上训练 reward model，并使用 PPO 针对 reward model 优化，同时加入相对于 SFT policy 的 KL penalty。一个 1.3B InstructGPT 比 175B GPT-3 更受偏好。正是这个单一结果，使得 2026 年每个 frontier lab 仍然交付 RLHF 形态的 post-training pipeline。

**Type:** Learn
**Languages:** Python (stdlib, toy three-stage pipeline)
**Prerequisites:** Phase 10 · 06 (SFT), Phase 10 · 07 (RLHF), Phase 10 · 08 (DPO)
**Time:** ~45 minutes

## 学习目标
- 说出 InstructGPT pipeline 的三个阶段，以及每个阶段使用的 loss。
- 解释为什么一个 1.3B instruction-tuned model 在人类 preference evaluation 中击败了原始 175B GPT-3。
- 说明 stage 3 中 KL penalty 在防止什么，以及为什么移除它会坍缩为 mode-seeking behaviour。
- 描述 alignment tax，以及 Ouyang et al. 用来缓解它的 PPO-ptx 方法。

## 问题
预训练语言模型会补全文本。它们不会回答问题。让 GPT-3 "write a Python function that reverses a list"，你常常会得到另一个 prompt，因为大多数训练分布是 web text，而 web text 会继续接更多 web text。模型在做它的工作，只是这个工作本身错了。

每个严肃实验室用来修复这个问题的 proxy 是 human preference。两个 completion 交给 rater；rater 选出更好的一个；reward model 学习这个 rater。然后一个 RL loop 将 policy 推向 reward model 打高分的输出。这就是三句话版的完整 InstructGPT 论点。论文剩下的部分都是工程。

## 概念
### 阶段 1：supervised fine-tuning (SFT)

收集 prompt-response pairs，其中 response 是一个善意人类会写出的内容。Ouyang et al. 使用了来自 labeler 和 OpenAI API 的 13k 个 prompts。用标准 cross-entropy loss 在这些数据上 fine-tune base model。

SFT 给你的东西：模型现在会回答问题，而不是继续补全问题。它没有给你的东西：当多个答案都合理时，rater 更偏好哪个答案的任何信号。

### 阶段 2：reward model (RM)

对于每个 prompt，从 SFT model 采样 K 个 completions。labeler 对它们排序。训练一个 reward model，为任意 prompt-response pair 打分，使得对于 `y_w` 比 `y_l` 更受偏好的 pair：

```
L_RM = -log sigmoid(r(x, y_w) - r(x, y_l))
```

这是 Bradley-Terry pairwise preference loss。RM 通常从 SFT model 初始化，并将 LM head 替换为 scalar head。

Reward models 很小：对于 175B InstructGPT，6B 就足够了。它们也很脆弱，论文第 5 节主要讨论的是在小规模下出现的 reward-hacking behaviours。

### 阶段 3：带 KL 惩罚的 PPO

定义目标：

```
J(pi) = E_{x~D, y~pi(.|x)} [ r(x, y) ] - beta * KL(pi(.|x) || pi_SFT(.|x))
```

用 PPO 最大化。KL 项让 `pi` 不会偏离 SFT policy 太远。没有它，Optimizer 会找到 adversarial examples，也就是 RM 打高分的字符串，原因是 RM 从未见过它们，而不是因为人类真的偏好它们。

KL coefficient `beta` 是最重要的单个 RLHF hyperparameter。太低：reward hacking。太高：相比 SFT 没有改进。

### The alignment tax

经过 RLHF 后，模型更受人类偏好，但在标准 benchmark（SQuAD, HellaSwag, DROP）上退化。Ouyang et al. 将这称为 alignment tax，并用 PPO-ptx 修复：把预训练 Gradient 混入 RL objective，这样模型就不会忘记如何做那些从未获得 reward 的 downstream tasks。

```
J_ptx(pi) = J(pi) + gamma * E_{x~D_pretrain} [ log pi(x) ]
```

PPO-ptx 成为了标准做法。Anthropic、DeepMind 和 Meta 都使用某种变体。

### The result

一个 1.3B InstructGPT（SFT + RM + PPO-ptx）大约 70% 的时间比 175B base GPT-3 更受 labeler 偏好。这个差距在来自 production traffic 的 hidden-test prompts 上会扩大。从这个数字中读出两点：

1. 对齐和能力是不同的轴。175B model 有更强能力；1.3B model 有更强对齐；labeler 更偏好对齐后的那个。
2. 能力下限由 base model 决定。你不能通过 RLHF 让 base model 知道它从未见过的事实。

### 为什么这是 Phase 18 的参考点

后续课程中的每一种批评，reward hacking（Lesson 2）、DPO（Lesson 3）、sycophancy（Lesson 4）、CAI（Lesson 5）、sleeper agents（Lesson 7）、alignment faking（Lesson 9），都在反对这条 pipeline 的某个部分。Reward hacking 攻击 stage 2。DPO 将 stage 2 和 stage 3 折叠在一起。CAI 替换人类 labeler。Sycophancy 表明 labeler 是一个有偏信号。Alignment faking 表明 policy 可以完全绕开 stage 3。你必须先把这条 pipeline 装进脑子，才能理解这些批评中的任何一个。

## 使用它
`code/main.py` 在 toy preference data 上模拟三个阶段。base "policy" 是在 actions {A, B, C} 上的 biased coin。Stage 1 SFT 在 200 个 prompts 上模仿 labeler actions。Stage 2 从 500 个 pairwise rankings 拟合 Bradley-Terry reward model。Stage 3 运行带有相对于 SFT policy 的 KL penalty 的简化 PPO update。你可以观察 reward 上升、KL divergence 增长，以及 policy drift；也可以关闭 KL 项，看到 reward hacking 在 50 个 update steps 内出现。

需要观察的内容：

- `beta = 0.1` 与 `beta = 0.0` 下的 reward trajectory。
- 训练步骤中的 KL(pi || pi_SFT)。
- 与 labeler preference 相比的最终 action distribution。

## 交付它
本课会产出 `outputs/skill-instructgpt-explainer.md`。给定一个 RLHF pipeline description 或论文 abstract，它会识别三个阶段中的哪一个正在被修改、每个阶段使用什么 loss，以及是否存在 KL penalty 或等价 regularizer。

## 练习
1. 运行 `code/main.py`。设置 `beta = 0.0`，并报告 200 个 PPO steps 后的 action distribution。用一段话解释 mode-seeking behaviour。

2. 修改 reward model，让 action B 带有 +0.5 bias（一个模拟的 reward bug）。使用 `beta = 0.1` 运行 PPO。KL penalty 是否能阻止 policy 利用这个 bias？到什么 `beta` 时 exploitation 会变得可见？

3. 阅读 Ouyang et al. (arXiv:2203.02155) Figure 1。通过运行 1、5、20、100 个 steps 的 PPO，并测量相对于 SFT model 的 preference，复现 labeler-preference curve。

4. 论文 Section 4.3 报告称，一个 1.3B InstructGPT 大约 70% 的时间会击败 175B GPT-3。为什么这个比例在 hidden production prompts 上会高于 labeler 自己的 prompts？

5. 在同一份 preference data 上，用 DPO（Phase 10 · 08）替换 PPO loss。比较最终 policy drift（到 SFT 的 KL）和最终 reward。在 matched reward 下，哪种方法 drift 更远？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| SFT | "instruction tuning" | Stage 1：在 prompt-response pairs 上使用 cross-entropy fine-tune |
| Reward model | "the RM" | 在 (prompt, response) 上的 scalar regressor，使用 Bradley-Terry 在 pairwise labels 上训练 |
| Bradley-Terry | "pairwise preference loss" | -log sigmoid(r_w - r_l)；将 pairwise ranking 归约为 binary classification |
| KL penalty | "the regularizer" | `beta * KL(pi || pi_SFT)`，让 RL policy 保持接近 SFT anchor |
| PPO-ptx | "PPO with pretraining mix" | 向 PPO objective 添加一部分 pre-training log-likelihood，以抵消 alignment tax |
| Alignment tax | "the RLHF regression" | 在 RLHF 之后，标准 benchmark 上出现下降，而这些 benchmark 并不是 RLHF 的目标 |
| Labeler preference | "the ground truth" | 人类 rankings 的样本；RM 是它的统计 proxy，而不是 "human values" 的 proxy |

## 延伸阅读
- [Ouyang et al. — Training language models to follow instructions with human feedback (arXiv:2203.02155)](https://arxiv.org/abs/2203.02155) — InstructGPT 论文，是后续每条 RLHF pipeline 的基础
- [Stiennon et al. — Learning to summarize from human feedback (arXiv:2009.01325)](https://arxiv.org/abs/2009.01325) — 用于 summarization 的 RLHF 前身
- [Christiano et al. — Deep reinforcement learning from human preferences (arXiv:1706.03741)](https://arxiv.org/abs/1706.03741) — 原始的 preference-based RL 形式化
- [Bai et al. — Training a Helpful and Harmless Assistant with RLHF (arXiv:2204.05862)](https://arxiv.org/abs/2204.05862) — Anthropic 对 InstructGPT pipeline 的 HH 扩展
