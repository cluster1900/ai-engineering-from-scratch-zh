# Tích cực chính sách gần (PPO)

> A2C trong một lần cập nhật đã bỏ rơi mỗi rollout.PPO sử dụng tỷ lệ quan trọng cắt giảm 包住政策梯度, để bạn có thể thực hiện 10+ thời đại trên cùng một khối dữ liệu, mà không làm cho chính sách nổ.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 分钟

## 问题

A2C(Dạy học 07) là về chính sách của:Gradient `E_{π_θ}[A · ∇ log π_θ]`需要从*当前* `π_θ`采样数据──做一次更新后,`π_θ`Nó đã thay đổi; dữ liệu bạn vừa sử dụng bây giờ đã bị cấm chính sách.

Việc triển khai rất tốn kém. Trên Atari, trên 8 个 envs × 128 bước, một lần triển khai = 1024 chuyển tiếp, cũng như 10 giây trong thời gian môi trường.

Truyện Chính sách Khu vực Tin cậy Optimization (TRPO, Schulman 2015) là chương trình sửa đổi đầu tiên:约束每次更新,使旧政策和新政策 之间的 KL divergence 保持在`δ`Theo lý thuyết, đây là một giải pháp rất sạch, nhưng mỗi lần cập nhật đều cần một giải pháp kết hợp-đường độ. Năm 2026 đã không ai chạy TRPO.

PPO(Schulman et al. 2017) sử dụng một mục tiêu cắt giảm đơn giản  thay thế khu vực tin tưởng cứng 约束──只多一行代码── mỗi lần triển khai 十个时代──不需要结合梯梯──理论保证足够好──九年后, nó vẫn là từ MuJoCo đến RLHF 默认政策-gradient 算法──

## 概念

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**Importance ratio。**

`r_t(θ) = π_θ(a_t | s_t) / π_{θ_old}(a_t | s_t)`

Đây là tỷ lệ xác suất giữa chính sách mới và chính sách thu thập dữ liệu.`r_t = 1`Không thay đổi.`r_t = 2`表示新政策 选择 `a_t`Có thể là hai lần so với chính sách cũ.

**Clipped surrogate。**

`L^{CLIP}(θ) = E_t [ min( r_t(θ) A_t, clip(r_t(θ), 1-ε, 1+ε) A_t ) ]`

Hai mục:

- Nếu lợi thế `A_t > 0`, và tỷ lệ 试图 tăng lên hơn `1 + ε`, clip sẽ làm cho mức độ áp suất bình thường  Đừng làm cho một hành động tốt  đưa ra cao hơn so với tỷ lệ cũ `+ε`- Đúng rồi.
- Nếu lợi thế `A_t < 0`, và tỷ lệ 试图 tăng lên hơn `1 - ε`(có nghĩa là giảm giảm so với cắt giảm, chúng ta sẽ làm cho một hành động xấu hơn có thể xảy ra), clip sẽ hạn chế Gradient  Đừng đưa một hành động xấu  đẩy xuống dưới `-ε`

`min`xử lý hướng khác: Nếu tỷ lệ đã di chuyển về hướng hữu ích, bạn vẫn nhận được Gradient không ở một bên bất lợi cho bạn cắt)

典型值是 `ε = 0.2`                                                                                                                                                                                                                                                              `r_t`Function: một hàm tuyến tính theo từng mảnh, ở một bên tốt có phần trên bình bằng, ở một bên xấu có phần dưới bình bằng.

**完整的 PPO loss。**

`L(θ, φ) = L^{CLIP}(θ) - c_v · (V_φ(s_t) - V_t^{target})² + c_e · H(π_θ(·|s_t))`

Hình cấu trúc diễn viên-chính trị tương tự với A2C.`c_v = 0.5``c_e = 0.01``ε = 0.2`

**训练循环。**

1. 跨 `N`个平行环境, mỗi运行 `T`bước, thu thập `N × T`个 chuyển tiếp.
2. 计算优势 (GAE),并把它们结为常量──
3. - Đưa đi.`π_{θ_old}`结为当前 `π_θ`Một bức ảnh.
4. Đối với`K`个 epochs, đối với mỗi `(s, a, A, V_target, log π_old(a|s))`của minibatch:
   - 计算 `r_t(θ) = exp(log π_θ(a|s) - log π_old(a|s))`
   -  ứng dụng `L^{CLIP}`+ mất giá trị + entropy。
   - Bước dần.
5. Quên việc triển khai. Trở lại bước 1.

`K = 10`Và 64 của các bộ phận nhỏ là một nhóm các siêu tham số tiêu chuẩn.

**KL-penalty 变体。**Bản nghiên cứu ban đầu đề xuất một giải pháp thay thế, sử dụng hình phạt KL thích nghi:`L = L^{PG} - β · KL(π_θ || π_old)`, trong số đó `β`Theo quan sát KL 调整──Clipping 版本 trở thành chủ yếu; KL 变体保留下来在RLHF中;;


```figure
ppo-clip
```

##  xây dựng nó

### Bước 1: Trong khi triển khai 捕获 `log π_old(a | s)`

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

Hình ảnh chỉ được lấy một lần trong thời gian triển khai. Nó sẽ không thay đổi trong thời gian cập nhật.

### Bước 2: tính toán lợi ích của GAE (Dạy học 07)

与 A2C 相同──跨批 归一化──

### Bước 3: Clip cập nhật thay thế

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

 cắt giảm → độ tần số  mô hình là cốt lõi của PPO. Nếu chính sách mới đã di chuyển quá xa về hướng hữu ích, việc cập nhật sẽ dừng lại.

### Bước 4: giá trị và entropy

给评论家目标 添加标准 MSE,并给演员 添加 entropy bonus,与A2C 相同──

### Bước 5: Chẩn đoán

Mỗi lần cập nhật cần phải quan sát ba điều:

- **Mean KL** `E[log π_old - log π_θ]` nên giữ `[0, 0.02]`Nếu quá`0.1`,降低 `K_EPOCHS`Hoặc`LR`
- **Clip fraction** tỷ lệ 落在 `[1-ε, 1+ε]` ngoài mẫu ví dụ:`~0.1-0.3`Nếu là `~0`, clip 从未触发 → 提高 `LR`Hoặc`K_EPOCHS`Nếu là `~0.5+`, anh đang quá phù hợp với việc triển khai này →  giảm chúng.
- **Explained variance** `1 - Var(V_target - V_pred) / Var(V_target)`❖Critical 质量指标──随着批判学习, nên tăng lên 1 ⋅

## 陷

- **Clip coefficient 调错。** `ε = 0.2`Đó là một tiêu chuẩn thực tế.`0.1`会让更新过于保守;`0.3+`会引入不稳定――
- **Epochs 太多。** `K > 20`经常会让训练不稳定, vì chính sách 漂离 `π_old`太远―― hạn chế thời đại, đặc biệt đối với các mạng lớn.
- **没有 reward normalization。**Ưu điểm của phần thưởng 会侵蚀 clip range──在计算优势 前先正常化奖励(running std)──
- **忘记 advantage normalization。**Tự bình thường hóa trung bình / đơn vị trên mỗi lô là một thực hành tiêu chuẩn.
- **Learning rate 没有衰减。**PPO受益于线性 LR 衰减到零── liên tục LR 往往更差──
- **Importance ratio 数学错误。**为了数量稳定,始终使用 `exp(log_new - log_old)`, thay vì `new / old`
- **Gradient sign 错误。**Maximum hóa thay thế = * tối thiểu hóa* `-L^{CLIP}`▽符号翻转是最常见的PPO bug──

## Sử dụng nó

PPO là một thuật toán RL được xác định trong nhiều lĩnh vực trong năm 2026:

| Use case | PPO variant |
|----------|-------------|
| MuJoCo / robotics control | PPO with Gaussian policy, GAE(0.95) |
| Atari / discrete games | PPO with categorical policy, rolling 128-step rollouts |
| RLHF for LLMs | PPO with KL penalty to reference model, reward from RM at end of response |
| Large-scale game agents | IMPALA + PPO (AlphaStar, OpenAI Five) |
| Reasoning LLMs | GRPO (Lesson 12) — PPO variant without critic |
| Preference-only data | DPO — closed-form collapsing of PPO+KL, no online sampling |

Hình dạng *sự mất mát* của PPO  cắt thay thế + giá trị + entropy  là DPO、GRPO và hầu hết các đường ống RLHF 脚手架。

## 交付 nó

保存为 `outputs/skill-ppo-trainer.md`- Có thể là:

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

1. **简单。**Trong 4×4 GridWorld 上运行 PPO, sử dụng `ε=0.2, K=4`Trong trường hợp các bước phù hợp, hiệu quả của mẫu đối với A2C (một thời đại) mỗi lần triển khai
2. **中等。**Tháo `K ∈ {1, 4, 10, 30}` Chụp các bước trở lại vs env,并 theo dõi mỗi lần cập nhật trung bình KL── trên nhiệm vụ này,`K`KL sẽ nổ vào bao giờ?
3. **困难。**用适应 KL phạt 替换 cắt thay thế(如果 `KL > 2·target`- Tôi không biết.`β`翻倍; nếu `KL < target/2`- Tôi không biết.`β`减半) ・Tương đương với lợi nhuận cuối cùng, ổn định và không clip.

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

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) 论文。
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477) TRPO,PPO's前身──
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990) Làm việc phân trừ đối với mỗi siêu tham số PPO
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) Định hướngGPT;PPO-in-RLHF 配方。
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) 使用 PyTorch 的清晰现代讲解──
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) 很多论文使用的参考单档PPO──
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer) Trong các mô hình ngôn ngữ 上 sử dụng PPO của sản xuất;请和课09(RLHF) cùng đọc。
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) 37 Optimize-level code 论文; những thủ thuật PPO là chịu trọng cấu trúc, những gì chỉ là văn hóa dân gian
