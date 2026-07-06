# Instruction-Following 作为 Alignment Signal

> 之后每个对 RLHF 的 critique 都是在反对这条 pipeline。在你研究 optimization pressure 如何扭曲一个 proxy 之前，必须先看清这个 proxy。InstructGPT（Ouyang et al., 2022）定义了 reference architecture：在 instruction-response pairs 上做 supervised fine-tuning；在 pairwise preference rankings 上训练 reward model；然后用带有 KL penalty 的 PPO 对 reward model 优化，并约束到 SFT policy。一个 1.3B InstructGPT 被偏好胜过 175B GPT-3。这个单一结果，就是 2026 年每个 frontier lab 仍然交付 RLHF-shaped post-training pipeline 的原因。

**Type:** Learn
**Languages:** Python (stdlib, toy three-stage pipeline)
**Prerequisites:** Phase 10 · 06 (SFT), Phase 10 · 07 (RLHF), Phase 10 · 08 (DPO)
**Time:** ~45 分钟

## Learning Objectives

- 说出 InstructGPT pipeline 的三个阶段，以及每个阶段使用的 loss。
- 解释为什么 1.3B instruction-tuned model 在 human preference evaluation 中击败了原始 175B GPT-3。
- 说明 stage 3 中的 KL penalty 在防止什么，以及为什么移除它会塌缩到 mode-seeking behaviour。
- 描述 alignment tax，以及 Ouyang et al. 用来缓解它的 PPO-ptx。

## The Problem

Pre-trained language models 会补全文本。它们不会回答问题。问 GPT-3 “write a Python function that reverses a list”，你经常会得到另一个 prompt，因为大多数训练分布是会继续接更多 web text 的 web text。模型在做它的工作，但这个工作本身错了。

每个严肃 lab 用来修复这个问题的 proxy 是 human preference。两个 completions 交给 rater；rater 选出更好的一个；reward model 学习这个 rater。然后一个 RL loop 把 policy 推向 reward model 给高分的 outputs。这就是完整 InstructGPT thesis 的三句话版本。论文剩下的部分是 engineering。

## The Concept

### Stage 1: supervised fine-tuning (SFT)

收集 prompt-response pairs，其中 response 是一个善意的人会写出的内容。Ouyang et al. 使用了来自 labelers 和 OpenAI API 的 13k prompts。用标准 cross-entropy loss 在这些数据上 fine-tune base model。

SFT 给你的东西：模型现在会回答问题，而不是继续补全问题。它不给你的东西：当多个答案都 plausible 时，rater 更偏好哪个答案的信号。

### Stage 2: reward model (RM)

对每个 prompt，从 SFT model 采样 K 个 completions。Labeler 对它们排序。训练一个 reward model，为任意 prompt-response pair 打分，使得对于 `y_w` 被偏好胜过 `y_l` 的 pairs：

```
L_RM = -log sigmoid(r(x, y_w) - r(x, y_l))
```

这是 Bradley-Terry pairwise preference loss。RM 通常从 SFT model 初始化，把 LM head 替换成 scalar head。

Reward models 很小：6B 足够服务 175B InstructGPT。它们也很脆弱，论文第 5 节主要讨论的是在小规模下出现的 reward-hacking behaviours。

### Stage 3: PPO with a KL penalty

定义 objective：

```
J(pi) = E_{x~D, y~pi(.|x)} [ r(x, y) ] - beta * KL(pi(.|x) || pi_SFT(.|x))
```

用 PPO 最大化。KL term 让 `pi` 不会偏离 SFT policy 太远。没有它，Optimizer 会找到 adversarial examples，也就是在 RM 下得分很高的 strings，原因不是人类真的偏好它们，而是 RM 从没见过它们。

KL coefficient `beta` 是 RLHF 最重要的 hyperparameter。太低：reward hacking。太高：相比 SFT 没有 improvement。

### The alignment tax

RLHF 之后，模型更受人类偏好，但在标准 benchmarks（SQuAD、HellaSwag、DROP）上退步。Ouyang et al. 将其称为 alignment tax，并用 PPO-ptx 修复：把 pre-training gradients 混入 RL objective，这样模型不会忘记如何完成那些从未被 reward 的 downstream tasks。

```
J_ptx(pi) = J(pi) + gamma * E_{x~D_pretrain} [ log pi(x) ]
```

PPO-ptx 成为标准做法。Anthropic、DeepMind 和 Meta 都使用某种 variant。

### The result

一个 1.3B InstructGPT（SFT + RM + PPO-ptx）被 labelers 偏好胜过 175B base GPT-3，比例约 70%。在来自 production traffic 的 hidden-test prompts 上，这个差距会扩大。从这个数字可以读出两件事：

1. Alignment 是与 capability 不同的轴。175B model 有更强 capability；1.3B model 有更多 alignment；labelers 更偏好 aligned 的那个。
2. Capability floor 由 base model 决定。你无法通过 RLHF 让 base model 知道它从未见过的事实。

### 为什么这是 Phase 18 的参照点

后续课程中的每个 critique：reward hacking（Lesson 2）、DPO（Lesson 3）、sycophancy（Lesson 4）、CAI（Lesson 5）、sleeper agents（Lesson 7）、alignment faking（Lesson 9），都在反对这条 pipeline 的某一部分。Reward hacking 攻击 stage 2。DPO 把 stages 2 和 3 合并。CAI 替代 human labeler。Sycophancy 表明 labeler 是一个 biased signal。Alignment faking 表明 policy 可以完全绕过 stage 3。如果你脑中没有这条 pipeline，就无法理解这些 critiques。

## Use It

`code/main.py` 在 toy preference data 上模拟三个阶段。Base “policy” 是一个在 actions {A, B, C} 上的 biased coin。Stage 1 SFT 在 200 个 prompts 上模拟 labeler actions。Stage 2 从 500 个 pairwise rankings 拟合 Bradley-Terry reward model。Stage 3 运行一个简化的 PPO update，并带有到 SFT policy 的 KL penalty。你可以观察 reward 上升、KL divergence 变大、policy drift，也可以关闭 KL term，看到 reward hacking 在 50 个 update steps 内出现。

要观察的内容：

- `beta = 0.1` 与 `beta = 0.0` 下的 reward trajectory。
- 训练 steps 中的 KL(pi || pi_SFT)。
- 与 labeler preference 相比的最终 action distribution。

## Ship It

本课产出 `outputs/skill-instructgpt-explainer.md`。给定一个 RLHF pipeline description 或 paper abstract，它会识别三个阶段中哪一个被修改、每个阶段使用什么 loss，以及是否存在 KL penalty 或 equivalent regularizer。

## Exercises

1. 运行 `code/main.py`。设置 `beta = 0.0`，报告 200 个 PPO steps 后的 action distribution。用一段话解释 mode-seeking behaviour。

2. 修改 reward model，让 action B 有 +0.5 bias（模拟 reward bug）。用 `beta = 0.1` 运行 PPO。KL penalty 是否阻止了 policy 利用这个 bias？在什么 `beta` 下 exploitation 开始可见？

3. 阅读 Ouyang et al.（arXiv:2203.02155）Figure 1。通过运行 PPO 1、5、20、100 steps，并测量相对 SFT model 的 preference，复现 labeler-preference curve。

4. 论文 Section 4.3 报告 1.3B InstructGPT 击败 175B GPT-3 的比例约为 70%。为什么这个比例在 hidden production prompts 上会高于 labeler 自己的 prompts？

5. 在相同 preference data 上，把 PPO loss 替换为 DPO（Phase 10 · 08）。比较最终 policy drift（到 SFT 的 KL）和最终 reward。在 matched reward 下，哪种方法 drift 更远？

## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| SFT | “instruction tuning” | Stage 1：在 prompt-response pairs 上用 cross-entropy fine-tune |
| Reward model | “the RM” | 在 (prompt, response) 上的 scalar regressor，使用 Bradley-Terry 在 pairwise labels 上训练 |
| Bradley-Terry | “pairwise preference loss” | -log sigmoid(r_w - r_l)；把 pairwise ranking 约简为 binary classification |
| KL penalty | “the regularizer” | `beta * KL(pi \|\| pi_SFT)` — 让 RL policy 保持接近 SFT anchor |
| PPO-ptx | “PPO with pretraining mix” | 向 PPO objective 加入一部分 pre-training log-likelihood，用来抵消 alignment tax |
| Alignment tax | “the RLHF regression” | RLHF 之后，在 RLHF 未针对的标准 benchmarks 上下降 |
| Labeler preference | “the ground truth” | human rankings 的样本；RM 是它的 statistical proxy，而不是 “human values” 的 proxy |

## Further Reading

- [Ouyang et al. — Training language models to follow instructions with human feedback (arXiv:2203.02155)](https://arxiv.org/abs/2203.02155) — InstructGPT paper，也是之后每条 RLHF pipeline 的基础
- [Stiennon et al. — Learning to summarize from human feedback (arXiv:2009.01325)](https://arxiv.org/abs/2009.01325) — RLHF-for-summarization 的前身
- [Christiano et al. — Deep reinforcement learning from human preferences (arXiv:1706.03741)](https://arxiv.org/abs/1706.03741) — 原始 preference-based RL formulation
- [Bai et al. — Training a Helpful and Harmless Assistant with RLHF (arXiv:2204.05862)](https://arxiv.org/abs/2204.05862) — Anthropic 对 InstructGPT pipeline 的 HH extension
