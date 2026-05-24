# Reward Modeling & RLHF

> 人类无法为“优质 assistant response”手写一个 reward function，但他们可以比较两个 responses 并选出更好的那个。把一个 reward model 拟合到这些比较数据上，然后针对它对 language model 做 RL。Christiano 2017。InstructGPT 2022。这就是把 GPT-3 变成 ChatGPT 的配方。到 2026 年，它大多正在被 DPO 取代，但 mental model 仍然保留。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 minutes

## 问题
你已经用 next-token-prediction objective 训练了一个 language model。它能写出语法正确的英文。它也会撒谎、啰嗦，并且该拒绝时不拒绝。你无法通过更多 pretraining 来修复这个问题，因为 web text 本身就是问题，而不是解法。

你想要一个 *scalar reward*，用于表示“对于 instruction X，response A 比 response B 更好”。手写这样的 reward function 是不可能的。“Helpfulness” 不是关于 tokens 的闭式表达式。但人类可以比较两个 outputs 并标注 preference。这种数据可以低成本、大规模收集。

RLHF（Christiano et al. 2017；Ouyang et al. 2022）把 preferences 转换成 reward model，然后通过 PPO 针对该 reward 优化 LM。三个步骤：SFT → RM → PPO。这是 2023–2025 年 ChatGPT、Claude、Gemini 以及其他所有 aligned-LLM 上线所用的配方。

到 2026 年，PPO 这一步大多被 DPO（Phase 10 · 08）取代，因为它更便宜，而且在 alignment tuning 上几乎同样好。但 *reward model* 这一部分仍然支撑着每一个 Best-of-N sampler、每一个 RL-from-verifiable-rewards pipeline，以及每一个使用 process reward model 的 reasoning model。理解 RLHF，你就理解了整个 alignment stack。

## 概念
![三阶段 RLHF：SFT、基于 pairwise prefs 的 RM training、带 KL penalty 的 PPO](../assets/rlhf.svg)

**Stage 1: Supervised Fine-Tuning (SFT).** 从一个 pretrained base model 开始。用目标行为的人类编写 demonstrations 进行 fine-tune（instruction-following responses、helpful replies 等）。结果是一个 `π_SFT` model，它*偏向于良好行为*，但 action space 仍然不受限制。

**Stage 2: Reward Model training.**

- 收集 prompts `x` 的 response pairs `(y_+, y_-)`，由人类标注为“y_+ 优于 y_-”。
- 训练 reward model `R_φ(x, y)`，让它给 `y_+` 分配更高分数。
- Loss：**Bradley-Terry pairwise logistic**：

  `L(φ) = -E[ log σ(R_φ(x, y_+) - R_φ(x, y_-)) ]`

  σ 是 sigmoid。reward 的差值意味着 preference 的 log-odds。BT 自 1952 年（Bradley-Terry）以来就是标准方法，并且是现代 RLHF 中的主流选择。

- `R_φ` 通常从 SFT model 初始化，并在顶部加一个 scalar head。相同的 transformer backbone；单个 linear layer 输出 reward。

**Stage 3：带 KL penalty，针对 RM 进行 PPO。**

- 从 `π_SFT` 初始化可训练 policy `π_θ`。保留一个冻结的 *reference* `π_ref = π_SFT`。
- response `y` 结束时的 reward：

  `r_total(x, y) = R_φ(x, y) - β · KL(π_θ(·|x) || π_ref(·|x))`

  KL penalty 防止 `π_θ` 任意偏离 `π_SFT`，它是一个 *regularizer*，不是严格的 trust region。`β` 通常为 `0.01`-`0.05`。
- 使用这个 reward 运行 PPO（Lesson 08）。advantages 在 token-level trajectory 上计算，但 RM 只为完整 response 打分。

**为什么需要 KL？** 没有它，PPO 会很乐意找到 reward-hacking 策略，因为 RM 只在 in-distribution completions 上训练过。一个 out-of-distribution response 的得分可能高于任何人类编写的 response。KL 让 `π_θ` 保持在 RM 训练所在的 manifold 附近。它是 RLHF 中最重要的单一调节旋钮。

**2026 status:**

- **DPO**（Rafailov 2023）：闭式代数把 Stage 2+3 折叠成一个基于 preference data 的单一 supervised loss。没有 RM，没有 PPO。用很少的 compute 就能在 alignment benchmarks 上达到相同质量。Phase 10 · 08 会讲。
- **GRPO**（DeepSeek 2024–2025）：PPO 的变体，用 group-relative baseline 代替 critic，reward 来自 *verifier*（code runs / math answer matches），而不是 human-trained RM。它是 reasoning models 的主流方法。Phase 9 · 12 会讲。
- **Process reward models (PRMs):** 为 partial solutions（每个 reasoning step）打分，用于 reasoning 中的 RLHF 和 GRPO 变体。
- **Constitutional AI / RLAIF:** 使用 aligned LLM 来生成 preferences，而不是使用人类。它扩展了 preference budget。

## 构建它
本课使用极小的合成“prompts”和“responses”，以字符串表示。RM 是一个基于 bag-of-tokens 表示的 linear scorer。没有真实 LLM，因为重要的是 pipeline 的*形状*，不是规模。参见 `code/main.py`。

### 步骤 1： synthetic preference data

```python
PROMPTS = ["help me", "answer me", "explain this"]
GOOD_WORDS = {"clear", "specific", "kind", "thorough"}
BAD_WORDS = {"vague", "rude", "wrong", "short"}

def make_pair(rng):
    x = rng.choice(PROMPTS)
    y_good = rng.choice(list(GOOD_WORDS)) + " " + rng.choice(list(GOOD_WORDS))
    y_bad = rng.choice(list(BAD_WORDS)) + " " + rng.choice(list(BAD_WORDS))
    return (x, y_good, y_bad)
```

在真实 RLHF 中，这部分会由人类标注员替代。其形状 `(prompt, preferred_response, rejected_response)` 是完全相同的。

### 步骤 2： Bradley-Terry reward model

Linear score：`R(x, y) = w · bag(y)`。训练目标是最小化 BT pairwise log-loss：

```python
def rm_train_step(w, x, y_pos, y_neg, lr):
    r_pos = dot(w, bag(y_pos))
    r_neg = dot(w, bag(y_neg))
    p = sigmoid(r_pos - r_neg)
    for tok, cnt in bag(y_pos).items():
        w[tok] += lr * (1 - p) * cnt
    for tok, cnt in bag(y_neg).items():
        w[tok] -= lr * (1 - p) * cnt
```

经过几百次 updates 后，`w` 会给 good-word tokens 赋予正权重，给 bad tokens 赋予负权重。

### 步骤 3： PPO-like policy on top of RM

我们的 toy policy 从 vocabulary 中生成单个 token。我们用 RM 为该 token 打分，计算 `log π_θ(token | prompt)`，加入 KL-to-reference penalty，并应用 clipped PPO surrogate。

```python
def rlhf_step(theta, ref, w, prompt, rng, eps=0.2, beta=0.1, lr=0.05):
    logits_theta = policy_logits(theta, prompt)
    probs = softmax(logits_theta)
    token = sample(probs, rng)
    logits_ref = policy_logits(ref, prompt)
    probs_ref = softmax(logits_ref)
    reward = dot(w, bag([token])) - beta * kl(probs, probs_ref)
    # ppo-style update on theta, treating reward as the return
    ...
```

### 步骤 4： monitor the KL

每次 update 都跟踪平均 `KL(π_θ || π_ref)`。如果它爬升到 `~5-10` 以上，说明 policy 已经远离 `π_SFT`，也就是 `β` 过低或 reward hacking 开始出现。这是真实 RLHF 中最重要的 diagnostic。

### 步骤 5： the production recipe with TRL

一旦你理解了 toy pipeline，下面就是真实 library 用户所写的同一个循环。Hugging Face 的 [TRL](https://huggingface.co/docs/trl) 是 reference implementation，其中 `RewardTrainer` 用于 Stage 2，`PPOTrainer`（内置 KL-to-reference）用于 Stage 3。

```python
# Stage 2: reward model from pairwise preferences
from trl import RewardTrainer, RewardConfig
from transformers import AutoModelForSequenceClassification, AutoTokenizer

tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")
rm = AutoModelForSequenceClassification.from_pretrained(
    "meta-llama/Llama-3.1-8B-Instruct", num_labels=1
)

# dataset rows: {"prompt", "chosen", "rejected"} — Bradley-Terry format
trainer = RewardTrainer(
    model=rm,
    tokenizer=tok,
    train_dataset=preference_data,
    args=RewardConfig(output_dir="./rm", num_train_epochs=1, learning_rate=1e-5),
)
trainer.train()
```

```python
# Stage 3: PPO against the RM with KL penalty to the SFT reference
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

policy = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")
ref    = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")  # frozen

ppo = PPOTrainer(
    config=PPOConfig(learning_rate=1.41e-5, batch_size=64, init_kl_coef=0.05,
                     target_kl=6.0, adap_kl_ctrl=True),
    model=policy, ref_model=ref, tokenizer=tok,
)

for batch in dataloader:
    responses = ppo.generate(batch["query_ids"], max_new_tokens=128)
    rewards   = rm(torch.cat([batch["query_ids"], responses], dim=-1)).logits[:, 0]
    stats     = ppo.step(batch["query_ids"], responses, rewards)
    # stats includes: mean_kl, clip_frac, value_loss — the three PPO diagnostics
```

library 为你处理了三件事。`adap_kl_ctrl=True` 实现 adaptive-β schedule：如果观测到的 KL 超过 `target_kl`，β 翻倍；如果低于一半，β 减半。reference model 按惯例是冻结的，你绝不能意外让它与 `policy` 共享参数。value head 与 policy 位于同一个 backbone 上（`AutoModelForCausalLMWithValueHead` 会附加一个 scalar MLP head），这也是为什么 TRL 会分别报告 `policy/kl` 和 `value/loss`。

## 陷阱
- **Over-optimization / reward hacking.** RM 并不完美；`π_θ` 会找到得分高但质量差的 adversarial completions。症状：reward 持续上升，而 human eval score 持平或下降。修复：early stop、提高 `β`、扩大 RM training data。
- **Length hacking.** 在 helpful responses 上训练的 RMs 往往会隐式奖励长度。policy 会学会填充 responses。补救：length-normalized reward，或使用 length-aware RM 的 RLAIF。
- **Too-small RM.** RM 至少需要与 policy 一样大。过小的 RM 无法可靠地为 policy outputs 打分。
- **KL tuning.** β 太低 → drift 和 reward hacking。β 太高 → policy 几乎不变。标准技巧是使用 *adaptive* β，使每步目标保持固定 KL。
- **Preference-data noise.** 约 30% 的 human labels 是 noisy 或 ambiguous 的。可以通过在 agreement-filtered data 上训练 RM 来校准，或在 BT 上使用 temperature。
- **Off-policy problems.** 第一轮 epoch 之后，PPO data 会略微 off-policy。像 Lesson 08 一样监控 clip fraction。

## 使用它
2026 年的 RLHF 是分层的：

| Layer | Target | Method |
|-------|--------|--------|
| Instruction following, helpfulness, harmlessness | Alignment | DPO（Phase 10 · 08）优先于 RLHF-PPO。 |
| Reasoning correctness（math, code） | Capability | 使用 verifier reward 的 GRPO（Phase 9 · 12）。 |
| Long-horizon multi-step tasks | Agentic | PPO / GRPO，配合跨 steps 的 process reward models。 |
| Safety / refusal behavior | Safety | RLHF-PPO，使用独立的 safety RM，或 Constitutional AI。 |
| Best-of-N at inference | Fast alignment | 在 decode time 使用 RM；不需要 policy training。 |
| Reward distillation | Inference compute | 在冻结 LM 顶部训练一个小型“reward head”。 |

RLHF 是 2022–2024 年的*核心*方法。到 2026 年，production alignment pipelines 以 DPO-first 为主，只有在 RM-intensive 或 safety-critical steps 中才使用 PPO。

## 交付它
保存为 `outputs/skill-rlhf-architect.md`：

```markdown
---
name: rlhf-architect
description: Design an RLHF / DPO / GRPO alignment pipeline for a language model, including RM, KL, and data strategy.
version: 1.0.0
phase: 9
lesson: 9
tags: [rl, rlhf, alignment, llm]
---

Given a base LM, a target behavior (alignment / reasoning / refusal / agent), and a preference or verifier budget, output:

1. Stage. SFT? RM? DPO? GRPO? With justification.
2. Preference or verifier source. Humans, AI feedback, rule-based, unit-test-pass, or reward distillation.
3. KL strategy. Fixed β, adaptive β, or DPO (implicit KL).
4. Diagnostics. Mean KL, reward stability, over-optimization guard (holdout human eval).
5. Safety gate. Red-team set, refusal rate, safety RM separate from helpfulness RM.

Refuse to ship RLHF-PPO without a KL monitor. Refuse to use an RM smaller than the target policy. Refuse length-only rewards. Flag any pipeline that does not hold back a blind human-eval set as lacking over-optimization protection.
```

## 练习
1. **Easy.** 在 `code/main.py` 中用 500 个 synthetic preference pairs 训练 Bradley-Terry reward model。在 held-out 的 100 个 pairs 上测量 pairwise accuracy。应超过 90%。
2. **Medium.** 使用 `β ∈ {0.0, 0.1, 1.0}` 运行 toy PPO-RLHF loop。对每个设置，绘制 updates 过程中 RM score 与 KL-to-reference 的关系。哪些 runs 出现了 reward-hack？
3. **Hard.** 在相同 preference data 上实现 DPO（closed-form preference-likelihood loss），并与 RLHF-PPO pipeline 在 compute 使用量和最终达成的 RM score 上进行比较。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| RLHF | “Alignment RL” | 三阶段 SFT + RM + PPO pipeline（Christiano 2017，Ouyang 2022）。 |
| Reward Model (RM) | “The scoring net” | 通过 Bradley-Terry 拟合 pairwise preferences 的 learned scalar function。 |
| Bradley-Terry | “Pairwise logistic loss” | `P(y_+ ≻ y_-) = σ(R(y_+) - R(y_-))`；标准 RM objective。 |
| KL penalty | “Stay near the reference” | reward 中的 `β · KL(π_θ || π_ref)`；防止 reward-hacking 的 regularizer。 |
| Reward hacking | “Goodhart's law” | Policy 利用 RM 缺陷；症状：reward 上升，human eval 持平。 |
| RLAIF | “AI-labeled preferences” | labels 来自另一个 LM 而非人类的 RLHF。 |
| PRM | “Process Reward Model” | 为 partial reasoning steps 打分；用于 reasoning pipelines。 |
| Constitutional AI | “Anthropic's method” | 由显式规则引导的 AI-generated preferences。 |

## 延伸阅读
- [Christiano et al. (2017). Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) — 开创 RLHF 的论文。
- [Ouyang et al. (2022). InstructGPT — Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) — ChatGPT 背后的配方。
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) — 更早用于 summarization 的 RLHF。
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) — DPO；2026 年 post-RLHF 的默认方法。
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) — RLAIF 与 self-critique loop。
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862) — HH paper。
- [Hugging Face TRL library](https://huggingface.co/docs/trl) — production `RewardTrainer` 和 `PPOTrainer`。阅读 trainer source 以理解 adaptive-KL 和 value-head 细节。
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf) by Lambert, Castricato, von Werra, Havrilla — 带图讲解三阶段 pipeline 的 canonical walk-through。
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl) — library；`examples/` 中有面向 Llama、Mistral 和 Qwen 的 end-to-end RLHF scripts。
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf) — reward-hypothesis 视角；思考 reward hacking 的必要前置内容。
