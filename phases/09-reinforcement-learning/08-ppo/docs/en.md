# Proximal Policy Optimization (PPO)

> A2C 在一次 update 后就丢弃每个 rollout。PPO 用 clipped importance ratio 包裹 policy gradient，这样你就可以在同一批数据上做 10+ 个 epoch，而不会让 policy 爆炸。Schulman et al. (2017)。到 2026 年仍是默认的 policy-gradient 算法。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 minutes

## 问题

A2C（Lesson 07）是 on-policy：gradient `E_{π_θ}[A · ∇ log π_θ]` 需要从*当前* `π_θ` 采样的数据。做一次 update 后，`π_θ` 就改变了；你刚用过的数据现在变成了 off-policy。重复使用它，你的 gradient 就会有偏。

Rollout 很昂贵。在 Atari 上，8 个 env × 128 steps 的一次 rollout = 1024 个 transition，以及十几秒的环境时间。一次 gradient step 后就把它丢掉很浪费。

Trust Region Policy Optimization（TRPO，Schulman 2015）是第一个修复方案：约束每次 update，使 old policy 和 new policy 之间的 KL divergence 保持在 `δ` 以下。理论上很干净，但每次 update 都需要一次 conjugate-gradient 求解。2026 年已经没人运行 TRPO。

PPO（Schulman et al. 2017）用简单的 clipped objective 替代硬 trust-region constraint。多一行代码。每个 rollout 做十个 epoch。没有 conjugate gradients。理论保证足够好。九年后，它仍然是从 MuJoCo 到 RLHF 各类任务的默认 policy-gradient 算法。

## 概念

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**Importance ratio。**

`r_t(θ) = π_θ(a_t | s_t) / π_{θ_old}(a_t | s_t)`

这是 new policy 与收集数据的 policy 之间的 likelihood ratio。`r_t = 1` 表示没有变化。`r_t = 2` 表示 new policy 选择 `a_t` 的可能性是 old policy 的两倍。

**Clipped surrogate。**

`L^{CLIP}(θ) = E_t [ min( r_t(θ) A_t, clip(r_t(θ), 1-ε, 1+ε) A_t ) ]`

两个项：

- 如果 advantage `A_t > 0`，并且 ratio 试图增长超过 `1 + ε`，clip 会把 gradient 变平：不要把一个好 action 推到比 old probability 高出 `+ε` 之外。
- 如果 advantage `A_t < 0`，并且 ratio 试图增长超过 `1 - ε`（意味着相比它的 clipped reduction，我们会让一个坏 action 更可能发生），clip 会限制 gradient：不要把一个坏 action 推到低于 `-ε`。

`min` 处理另一个方向：如果 ratio 已经朝着*有利*方向移动，你仍然会得到 gradient（不会在会伤害你的那一侧 clipping）。

典型值 `ε = 0.2`。把 objective 作为 `r_t` 的函数画出来：一个 piecewise-linear 函数，在“好的一侧”有平坦屋顶，在“坏的一侧”有平坦地板。

**完整 PPO loss。**

`L(θ, φ) = L^{CLIP}(θ) - c_v · (V_φ(s_t) - V_t^{target})² + c_e · H(π_θ(·|s_t))`

与 A2C 相同的 actor-critic 结构。三个系数，通常是 `c_v = 0.5`、`c_e = 0.01`、`ε = 0.2`。

**训练循环。**

1. 在 `N` 个 parallel env 中，每个 env 收集 `T` steps，共 `N × T` 个 transition。
2. 计算 advantages（GAE），并将它们冻结为常量。
3. 将 `π_{θ_old}` 冻结为当前 `π_θ` 的 snapshot。
4. 对 `K` 个 epoch，对每个 `(s, a, A, V_target, log π_old(a|s))` 的 minibatch：
   - 计算 `r_t(θ) = exp(log π_θ(a|s) - log π_old(a|s))`。
   - 应用 `L^{CLIP}` + value loss + entropy。
   - Gradient step。
5. 丢弃 rollout。回到 step 1。

`K = 10` 和大小为 64 的 minibatch 是一组标准 hyperparameter。PPO 很 robust：精确数字在 ±50% 以内通常影响不大。

**KL-penalty variant。** 原论文提出了一个替代方案，使用 adaptive KL penalty：`L = L^{PG} - β · KL(π_θ || π_old)`，并根据 observed KL 调整 `β`。Clipping 版本成为主流；KL variant 在 RLHF 中保留下来（在那里，对 reference policy 的 KL 是一个你本来就总是需要的独立约束）。

## 构建它

### 步骤 1：在 rollout 时捕获 `log π_old(a | s)`

```python
for step in range(T):
    probs = softmax(logits(theta, state_features(s)))
    a = sample(probs, rng)
    s_next, r, done = env.step(s, a)
    buffer.append({
        "s": s, "a": a, "r": r, "done": done,
        "v_old": value(w, state_features(s)),
        "log_pi_old": log(probs[a] + 1e-12),
    })
    s = s_next
```

Snapshot 在 rollout 时只获取一次。它在 update epoch 期间不会改变。

### 步骤 2：计算 GAE advantages（Lesson 07）

与 A2C 相同。跨 batch normalize。

### 步骤 3：clipped surrogate update

```python
for _ in range(K_EPOCHS):
    for mb in minibatches(buffer, size=64):
        for rec in mb:
            x = state_features(rec["s"])
            probs = softmax(logits(theta, x))
            logp = log(probs[rec["a"]] + 1e-12)
            ratio = exp(logp - rec["log_pi_old"])
            adv = rec["advantage"]
            surrogate = min(
                ratio * adv,
                clamp(ratio, 1 - EPS, 1 + EPS) * adv,
            )
            # backprop -surrogate, add value loss, subtract entropy
            grad_logpi = onehot(rec["a"]) - probs
            if (adv > 0 and ratio >= 1 + EPS) or (adv < 0 and ratio <= 1 - EPS):
                pg_grad = 0.0  # clipped
            else:
                pg_grad = ratio * adv
            for i in range(N_ACTIONS):
                for j in range(N_FEAT):
                    theta[i][j] += LR * pg_grad * grad_logpi[i] * x[j]
```

“clipped → zero gradient” 模式是 PPO 的核心。如果 new policy 已经在有利方向上漂移得太远，update 就会停止。

### 步骤 4：value 和 entropy

向 critic target 添加标准 MSE，并向 actor 添加 entropy bonus，与 A2C 相同。

### 步骤 5：diagnostics

每次 update 关注三件事：

- **Mean KL** `E[log π_old - log π_θ]`。应保持在 `[0, 0.02]`。如果超过 `0.1`，降低 `K_EPOCHS` 或 `LR`。
- **Clip fraction**：ratio 落在 `[1-ε, 1+ε]` 之外的 sample 比例。应为 `~0.1-0.3`。如果是 `~0`，说明 clip 从未触发 → 提高 `LR` 或 `K_EPOCHS`。如果是 `~0.5+`，说明你在 over-fitting rollout → 降低它们。
- **Explained variance** `1 - Var(V_target - V_pred) / Var(V_target)`。Critic 质量指标。随着 critic 学习，应逐渐接近 1。

## 陷阱

- **Clip coefficient 调错。** `ε = 0.2` 是事实标准。改到 `0.1` 会让 update 过于胆小；`0.3+` 会招致不稳定。
- **Epoch 太多。** `K > 20` 经常会 destabilize，因为 policy 会远离 `π_old`。限制 epoch，尤其是对大型 network。
- **没有 reward normalization。** 大 reward scale 会侵蚀 clip range。在计算 advantages 前 normalize rewards（running std）。
- **忘记 advantage normalization。** Per-batch zero-mean/unit-std normalization 是标准做法。跳过它会让 PPO 在多数 benchmark 上崩掉。
- **Learning rate 未 decay。** PPO 受益于线性 LR decay 到零。Constant LR 通常更差。
- **Importance ratio 数学错误。** 为了数值稳定，始终使用 `exp(log_new - log_old)`，而不是 `new / old`。
- **Gradient 符号错误。** Maximize surrogate = *minimize* `-L^{CLIP}`。符号翻转是最常见的 PPO bug。

## 使用它

PPO 是 2026 年默认 RL 算法，覆盖的领域多得令人意外：

| Use case | PPO variant |
|----------|-------------|
| MuJoCo / robotics control | PPO with Gaussian policy, GAE(0.95) |
| Atari / discrete games | PPO with categorical policy, rolling 128-step rollouts |
| RLHF for LLMs | PPO with KL penalty to reference model, reward from RM at end of response |
| Large-scale game agents | IMPALA + PPO (AlphaStar, OpenAI Five) |
| Reasoning LLMs | GRPO (Lesson 12) — PPO variant without critic |
| Preference-only data | DPO — closed-form collapsing of PPO+KL, no online sampling |

PPO 的 *loss shape*：clipped surrogate + value + entropy，是 DPO、GRPO 以及几乎所有 RLHF pipeline 的脚手架。

## 交付它

保存为 `outputs/skill-ppo-trainer.md`：

```markdown
---
name: ppo-trainer
description: Produce a PPO training config and a diagnostic plan for a given environment.
version: 1.0.0
phase: 9
lesson: 8
tags: [rl, ppo, policy-gradient]
---

Given an environment and training budget, output:

1. Rollout size. `N` envs × `T` steps.
2. Update schedule. `K` epochs, minibatch size, LR schedule.
3. Surrogate params. `ε` (clip), `c_v`, `c_e`, advantage normalization on.
4. Advantage. GAE(`λ`) with explicit `γ` and `λ`.
5. Diagnostics plan. KL, clip fraction, explained variance thresholds with alerts.

Refuse `K > 30` or `ε > 0.3` (unsafe trust region). Refuse any PPO run without advantage normalization or KL/clip monitoring. Flag clip fraction sustained above 0.4 as drift.
```

## 练习

1. **Easy.** 在 4×4 GridWorld 上运行 PPO，使用 `ε=0.2, K=4`。在匹配 env steps 的情况下，与 A2C（每个 rollout 一个 epoch）的 sample efficiency 做比较。
2. **Medium.** 扫描 `K ∈ {1, 4, 10, 30}`。绘制 return vs env steps，并跟踪每次 update 的 mean KL。在这个任务上，KL 从哪个 `K` 开始爆炸？
3. **Hard.** 用 adaptive KL penalty 替换 clipped surrogate（如果 `KL > 2·target`，则 `β` 翻倍；如果 `KL < target/2`，则减半）。比较 final return、stability 和 clip-free-ness。

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| Importance ratio | "r_t(θ)" | `π_θ(a|s) / π_old(a|s)`；相对于收集数据的 policy 的偏离程度。 |
| Clipped surrogate | "PPO's main trick" | `min(r·A, clip(r, 1-ε, 1+ε)·A)`；在有利一侧超过 clip 后 gradient 变平。 |
| Trust region | "TRPO / PPO intent" | 限制每次 update 的 KL，以保证 monotone improvement。 |
| KL penalty | "Soft trust region" | 替代版 PPO：`L - β · KL(π_θ || π_old)`。Adaptive `β`。 |
| Clip fraction | "How often clipping triggers" | Diagnostic：应为 0.1-0.3；超出说明调参不当。 |
| Multi-epoch training | "Data reuse" | 在每个 rollout 上做 K 个 epoch；用 variance cost 换取 sample efficiency。 |
| On-policy-ish | "Mostly on-policy" | PPO 名义上是 on-policy，但 K>1 个 epoch 会安全地使用 slightly-off-policy 数据。 |
| PPO-KL | "The other PPO" | KL-penalty variant；用于 RLHF，因为 KL-to-reference 本来就是一个约束。 |

## 延伸阅读

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) — 论文。
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477) — TRPO，PPO 的前身。
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990) — 消融了每个 PPO hyperparameter。
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) — InstructGPT；PPO-in-RLHF 配方。
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) — 使用 PyTorch 的清晰现代阐述。
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) — 许多论文使用的 single-file PPO 参考实现。
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer) — language models 上 PPO 的生产级配方；与 Lesson 09（RLHF）一起阅读。
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) — “37 个 code-level optimizations” 论文；哪些 PPO trick 是承重结构，哪些只是 folklore。
