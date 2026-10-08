# 接近政策优化 (PPO)

> 通过PPO使用减轻重要性比率 包容政策梯度,这样你可以在同一批数据上做10+个时代,而不会让政策爆炸.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 分钟

## 问题

课程07是关于政策的: 课程`E_{π_θ}[A · ∇ log π_θ]`需要从*当前* `π_θ`采样数据.`π_θ`现在你刚刚使用的数据已经被禁止使用.

在Atari上,跨8个 envs × 128 步骤的一次推出 = 1024 个转移,以及十几秒的环境时间.

根据"信任地区政策优化"的第一项修复方案,使旧政策和新政策之间的 KL 差异保持在`δ`理论上很干净,但每次更新都需要一次结合式渐进式解决.

根据PPO的理论,它仍然是从MuJoCo到RLHF的默认政策梯度算法――

## 概念

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**Importance ratio。**

`r_t(θ) = π_θ(a_t | s_t) / π_{θ_old}(a_t | s_t)`

这是新政策与采集数据政策之间的概率比率.`r_t = 1`表示没有变化.`r_t = 2`表示新政策 选择 `a_t`两倍的可能性是旧政策的.

**Clipped surrogate。**

`L^{CLIP}(θ) = E_t [ min( r_t(θ) A_t, clip(r_t(θ), 1-ε, 1+ε) A_t ) ]`

两个项:

- 如果优势`A_t > 0`并且比率 试图增长到超过`1 + ε`没有一个好行动,推出比旧的概率高.`+ε`现在,我们要去.
- 如果优势`A_t < 0`并且比率 试图增长到超过`1 - ε`(这意味着相比减少,我们会让一个坏行动更可能发生),Clip会限制渐进 不要把一个坏行动推到低`-ε`,我知道.

`min`处理另一个方向:如果比率已经朝着有益的方向移动,你仍然得到了渐进的方向 (不会在不利的侧面)

典型值是`ε = 0.2`把目标 画成`r_t`的函数: 一个零件式线性函数,在一个好侧有平坦的顶部,在一个坏侧有平坦的底部.

**完整的 PPO loss。**

`L(θ, φ) = L^{CLIP}(θ) - c_v · (V_φ(s_t) - V_t^{target})² + c_e · H(π_θ(·|s_t))`

与A2C相似的演员-批评结构.`c_v = 0.5`,我知道.`c_e = 0.01`,我知道.`ε = 0.2`,我知道.

**训练循环。**

1. 跨`N`个平行环境,每个运行`T`步骤,收集`N × T`个过渡.
2. 计算优势 (GAE),并把它们结结为常量.
3. 让我`π_{θ_old}`结为当前`π_θ`现在,我们要做什么?
4. 对于`K`个时代,对每个时代`(s, a, A, V_target, log π_old(a|s))`它们的小组:
   - 计算`r_t(θ) = exp(log π_θ(a|s) - log π_old(a|s))`,我知道.
   - 应用`L^{CLIP}`值损失+化――
   - 渐进阶段.
5. 放弃推广. 回到第一步.

`K = 10`和 64 的小批量是一组标准超参数.PPO 很强大:精确数值在 ±50% 范围内通常都不太重要.

**KL-penalty 变体。**原始论文提出了一个替代方案,使用适应性KL处罚:`L = L^{PG} - β · KL(π_θ || π_old)`在其中`β`根据观察到的 KL 调整──剪辑版本成为主流; KL 变体在 RLHF 中保留下来.


```figure
ppo-clip
```

## 构建它

### 步骤1:在发射时捕获`log π_old(a | s)`

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

截图只能在推出时获取一次.

### 步骤2:计算GAE的优势 (课07),

与A2C相同──跨批量归结──

### 步骤3:切除替代更新

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
            # backprop -surrogate, 添加 value loss, 减去 entropy
            grad_logpi = onehot(rec["a"]) - probs
            if (adv > 0 and ratio >= 1 + EPS) or (adv < 0 and ratio <= 1 - EPS):
                pg_grad = 0.0  # clipped
            else:
                pg_grad = ratio * adv
            for i in range(N_ACTIONS):
                for j in range(N_FEAT):
                    theta[i][j] += LR * pg_grad * grad_logpi[i] * x[j]
```

削 →零梯度模式是PPO的核心. 如果新政策已经走得太远,更新就会停止.

### 步骤4:值和进化

给评论家目标 添加标准MSE,并给演员 添加体奖金,与A2C相同.

### 步骤5:诊断

每次更新都需要注意三个事情:

- **Mean KL** `E[log π_old - log π_θ]`应该保持在`[0, 0.02]`如果超过`0.1`降低`K_EPOCHS`或`LR`,我知道.
- **Clip fraction**比例 落在`[1-ε, 1+ε]`其他样本,例如:应该是`~0.1-0.3`如果是`~0`,从未触发 → 提高 `LR`或`K_EPOCHS`如果是`~0.5+`你正在过度调整这个部署 → 降低它们.
- **Explained variance** `1 - Var(V_target - V_pred) / Var(V_target)`❖批判性质量指标――随着批判学习,应该向1上升――

## 陷

- **Clip coefficient 调错。** `ε = 0.2`是事实标准.`0.1`会让更新过于保守;`0.3+`引入不稳定.
- **Epochs 太多。** `K > 20`经常会让训练不稳定,因为政策漂离`π_old`太远――限制时代,特别是对大型网络.
- **没有 reward normalization。**大的奖励规模 会侵蚀剪辑范围――在计算优势前先正常化奖励(运行std) 』
- **忘记 advantage normalization。**跳过它会让PPO在大多数基准上崩.
- **Learning rate 没有衰减。**波动性 LR 衰减到零.
- **Importance ratio 数学错误。**为了数字稳定,始终使用`exp(log_new - log_old)`没有什么.`new / old`,我知道.
- **Gradient sign 错误。**最大化替代 = * 最小化* `-L^{CLIP}`符号翻转是最常见的PPO错误.

## 使用它

预测是2026年在相当多领域的默认RL算法:

| Use case | PPO variant |
|----------|-------------|
| MuJoCo / robotics control | PPO with Gaussian policy, GAE(0.95) |
| Atari / discrete games | PPO with categorical policy, rolling 128-step rollouts |
| RLHF for LLMs | PPO with KL penalty to reference model, reward from RM at end of response |
| Large-scale game agents | IMPALA + PPO (AlphaStar, OpenAI Five) |
| Reasoning LLMs | GRPO (Lesson 12) — PPO variant without critic |
| Preference-only data | DPO — closed-form collapsing of PPO+KL, no online sampling |

切割的替代品+值+体是DPO、GRPO以及几乎所有RLHF管道的脚手架──

## 交付它

保存为`outputs/skill-ppo-trainer.md`其他:

```markdown
---
name: ppo-trainer
description: 为给定环境生成 PPO training config 和 diagnostic plan。
version: 1.0.0
phase: 9
lesson: 8
tags: [rl, ppo, policy-gradient]
---

给定一个 environment 和 training budget，输出：

1. Rollout size。`N` envs × `T` steps。
2. Update schedule。`K` epochs、minibatch size、LR schedule。
3. Surrogate params。`ε`（clip）、`c_v`、`c_e`，开启 advantage normalization。
4. Advantage。GAE(`λ`)，显式给出 `γ` 和 `λ`。
5. Diagnostics plan。KL、clip fraction、explained variance thresholds 与 alerts。

拒绝 `K > 30` 或 `ε > 0.3`（unsafe trust region）。拒绝任何没有 advantage normalization 或 KL/clip monitoring 的 PPO run。把 clip fraction 持续高于 0.4 标记为 drift。
```

## 练习

1. **简单。**在4×4格里德世界上运行PPO,使用 `ε=0.2, K=4`△在匹配环境步骤的情况下,与A2C (每次推出一个时代) 的样本效率相比.
2. **中等。**扫描`K ∈ {1, 4, 10, 30}`◎绘制回归与回归的步骤,并跟踪每次更新的平均 KL──在这个任务上,`K`到什么时候KL会爆炸?
3. **困难。**用适应性KL罚款 替换剪切替代品`KL > 2·target`没有任何`β`翻倍;如果`KL < target/2`没有任何`β`减半) 比较最终回报,稳定和无.

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Importance ratio | "r_t(θ)" | `π_θ(a\|s) / π_old(a\|s)`；相对于采集数据的 policy 的偏离程度。 |
| Clipped surrogate | "PPO's main trick" | `min(r·A, clip(r, 1-ε, 1+ε)·A)`；在有益侧超过 clip 后 Gradient 变平。 |
| Trust region | "TRPO / PPO intent" | 限制每次更新的 KL，以保证 monotone improvement。 |
| KL penalty | "Soft trust region" | 替代 PPO：`L - β · KL(π_θ \|\| π_old)`。Adaptive `β`。 |
| Clip fraction | "How often clipping triggers" | Diagnostic —— 应该是 0.1-0.3；超出范围表示调参错误。 |
| Multi-epoch training | "Data reuse" | 每次 rollout 上跑 K 个 epochs；用 variance cost 换 sample efficiency。 |
| On-policy-ish | "Mostly on-policy" | PPO 名义上是 on-policy，但 K>1 个 epochs 会安全地使用 slightly-off-policy data。 |
| PPO-KL | "The other PPO" | KL-penalty 变体；用于 RLHF，因为 KL-to-reference 已经是一个约束。 |

## 延伸阅读

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347)论文:
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477) TRPO,PPO 的前身──
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990)对每个PPO超参数进行除.
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) 指示GPT;PPO-in-RLHF 配方──
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) 使用Pytorch的清晰现代讲解──
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) 很多论文使用的参考单档PPO──
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer) 在语言模型上使用PPO的生产配方;请和课程09(RLHF)一起阅读.
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) 37代码级优化 论文;哪些PPO技巧是承重结构,哪些只是民间故事.
