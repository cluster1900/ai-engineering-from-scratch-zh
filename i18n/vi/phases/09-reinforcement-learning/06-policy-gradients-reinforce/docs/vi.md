# Chính sách Gradient  Từ zero thực hiện REINFORCE

> 停止估值值──直接参数化政策,计算预期回报的渐进,然后沿上坡方向更新──Williams (1992) sử dụng một lý thuyết 写清了它──这也是PPO、GRPO以及每个LLM RL循环 存在的原因──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 分钟

## 问题

Q-learning 和 DQN parameterize 的是 * value* function──你通过 `argmax Q`选择行动――这对离散行动 和离散状态 没有问题――但当行动是持续时就会失效(对10维扭矩 怎么做`argmax`?), hoặc khi bạn muốn chính sách stochastic 时也会失效`argmax`按构造就是决定性)

Các gradient chính sách 改为 tham số hóa * chính sách*。`π_θ(a | s)`là một mạng Neural, xuất hành động trên phân phối. Từ mẫu để thực hiện hành động.`θ`Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm`argmax`Không có sự tái phát của Bellman. Chỉ có đối với.`J(θ) = E_{π_θ}[G]`Làm việc tăng độ...

Định lý REINFORCE (Williams 1992)  nói cho bạn Gradient này là tính toán:`∇J(θ) = E_π[ G · ∇_θ log π_θ(a | s) ]`◊运行一个节目――计算回来――把每一步的`∇ log π_θ(a | s)`乘以回归──取平均──做 Gradient-ascent──完成──

Mỗi thuật toán LLM-RL năm 2026:PPO、DPO、GRPO, là sự tinh chỉnh của REINFORCE, là điều kiện tiên quyết cho giai đoạn 10 · 07 (phục triển RLHF) và giai đoạn 10 · 08 (DPO).

## 概念

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**Policy gradient theorem。**Đối với bất cứ ai`θ`Chính sách của các tham số`π_θ`- Có thể là:

`∇J(θ) = E_{τ ~ π_θ}[ Σ_{t=0}^{T} G_t · ∇_θ log π_θ(a_t | s_t) ]`

Trong số đó `G_t = Σ_{k=t}^{T} γ^{k-t} r_{k+1}`Ừm từ bước `t`开始的折扣回报──期望是从`π_θ`mẫu của hoàn chỉnh quỹ đạo `τ`Những gì đã đạt được.

**证明很短。**Trong kỳ vọng 下对 `J(θ) = Σ_τ P(τ; θ) G(τ)`求导──使用 `∇P(τ; θ) = P(τ; θ) ∇ log P(τ; θ)`(truc dẫn xuất log) ‖ phân giải ‖`log P(τ; θ) = Σ log π_θ(a_t | s_t) + environment terms that do not depend on θ`△ các thuật ngữ môi trường 消失──两行代数就得到定理──

**Variance reduction 技巧。**Sự khác biệt của Vanilla REINFORCE rất cao:`∇ log π`là tiếng ồn, số lượng của chúng rất tiếng ồn.

1. **Baseline subtraction。**Không phụ thuộc vào bất cứ điều gì`a_t``b(s_t)`,把 `G_t`替换成 `G_t - b(s_t)`Nó là một sự độc lập, vì`E[b(s_t) · ∇ log π(a_t | s_t)] = 0`❖ điển hình: bởi nhà phê bình 学到的`b(s_t) = V̂(s_t)`→ diễn viên-chính trị viên (đọc 07):
2. **Reward-to-go。**- Đưa đi.`Σ_t G_t · ∇ log π_θ(a_t | s_t)`替换成 `Σ_t G_t^{from t} · ∇ log π_θ(a_t | s_t)`❖ Đối với một hành động nhất định, chỉ có lợi nhuận trong tương lai 相关, phần thưởng trong quá khứ chỉ sẽ đóng góp tiếng ồn không trung bình ❖

组合起来 lấy:

`∇J ≈ (1/N) Σ_{i=1}^{N} Σ_{t=0}^{T_i} [ G_t^{(i)} - V̂(s_t^{(i)}) ] · ∇_θ log π_θ(a_t^{(i)} | s_t^{(i)})`

Đó là nguồn gốc của sự tăng cường, cũng là tổ tiên trực tiếp của A2C (Dạy học 07) và PPO (Dạy học 08).

**Softmax policy parameterization。**Đối với các hành động riêng biệt, tiêu chuẩn lựa chọn là:

`π_θ(a | s) = exp(f_θ(s, a)) / Σ_{a'} exp(f_θ(s, a'))`

Trong số đó `f_θ`Có một hình thức sạch của một Gradient:

`∇_θ log π_θ(a | s) = ∇_θ f_θ(s, a) - Σ_{a'} π_θ(a' | s) ∇_θ f_θ(s, a')`

也就是已采取行动的分数 减去其在政策下预期值.

**用于 continuous actions 的 Gaussian policy。** `π_θ(a | s) = N(μ_θ(s), σ_θ(s))``∇ log N(a; μ, σ)`Có hình thức đóng cửa. Đó là tất cả những gì SAC cần trong giai đoạn 9 · 07.


```figure
policy-gradient-landscape
```

## Hãy xây dựng nó

### Bước 1: mạng chính sách softmax

```python
def policy_logits(theta, state_features):
    return [dot(theta[a], state_features) for a in range(N_ACTIONS)]

def softmax(logits):
    m = max(logits)
    exps = [exp(l - m) for l in logits]
    Z = sum(exps)
    return [e / Z for e in exps]
```

Đối với các bảng tính env Sử dụng chính sách tuyến tính( mỗi hành động một trọng lượng vector)。 đối với Atari, đổi thành CNN,并保留softmax head。

### Bước 2: lấy mẫu và khả năng ghi chép

```python
def sample_action(probs, rng):
    x = rng.random()
    cum = 0
    for a, p in enumerate(probs):
        cum += p
        if x <= cum:
            return a
    return len(probs) - 1

def log_prob(probs, a):
    return log(probs[a] + 1e-12)
```

### Bước 3: triển khai với các log-probs được chụp

```python
def rollout(theta, env, rng, gamma):
    trajectory = []
    s = env.reset()
    while not done:
        logits = policy_logits(theta, s)
        probs = softmax(logits)
        a = sample_action(probs, rng)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r, probs))
        s = s_next
    return trajectory
```

### Bước 4: Cập nhật REINFORCE

```python
def reinforce_step(theta, trajectory, gamma, lr, baseline=0.0):
    returns = compute_returns(trajectory, gamma)
    for (s, a, _, probs), G in zip(trajectory, returns):
        advantage = G - baseline
        grad_log_pi_a = [-p for p in probs]
        grad_log_pi_a[a] += 1.0
        for i in range(N_ACTIONS):
            for j in range(len(s)):
                theta[i][j] += lr * advantage * grad_log_pi_a[i] * s[j]
```

Tốc độ`∇ log π(a|s) = e_a - π(·|s)`(`a`(đối với các phương pháp phân tích, các phương pháp phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, và phân tích, và phân tích, phân tích, và phân tích, và phân tích, và phân tích, và phân tích.

### Bước 5: đường cơ sở

Đối với các tập gần đây `G`取 running mean, đã đủ để 4×4 GridWorld  chạy lên; khoảng cần 500 tập 收──把 cơ bản 升级为学 `V̂(s)`, được nhận được các nhà phê bình diễn viên.

## Những bẫy

- **Exploding gradients。**Lợi nhuận có thể rất lớn.`∇ log π`之前,始终在批内把 `G`bình thường hóa đến `~N(0, 1)`
- **Entropy collapse。**Chính sách 过早收到近似决定性的行动,停止探索,然后卡住──修复方式:向目标 添加 entropy bonus `β · H(π(·|s))`
- **High variance。**Vanilla REINFORCE 需要成千上万集──kritical baseline──Lớp 07)
- **Sample inefficiency。**Trên chính sách có nghĩa là mỗi điều chuyển đổi trong một lần cập nhật đã được bỏ rơi.
- **Non-stationary gradients。**100 tập  trước cùng một Gradient sử dụng là cũ `π`Đó là lý do tại sao các phương pháp chính sách mỗi lần triển khai được cập nhật.
- **Credit assignment。**Không có phần thưởng để đi 时,过去奖励 会贡献噪声──始终使用奖励去──

## Sử dụng nó

Năm 2026, REINFORCE  rất ít được vận hành trực tiếp, nhưng Gradient của nó 公式 không còn ở đâu:

| Use case | Derived method |
|----------|---------------|
| Continuous control | PPO / SAC with Gaussian policy |
| LLM RLHF | PPO with KL penalty, running on token-level policy |
| LLM reasoning (DeepSeek) | GRPO — REINFORCE with group-relative baseline, no critic |
| Multi-agent | Centralized-critic REINFORCE (MADDPG, COMA) |
| Discrete action robotics | A2C, A3C, PPO |
| Preference-only settings | DPO — REINFORCE rewritten as a preference-likelihood loss, no sampling |

Khi bạn thấy trong kịch bản huấn luyện năm 2026`loss = -advantage * log_prob`, đó là带 cơ sở của REINFORCE──整篇论文(DPO、GRPO、RLOO) là dựa trên trên này dòng giảm biến động 技巧──

## Chuyển nó

保存为 `outputs/skill-policy-gradient-trainer.md`- Có thể là:

```markdown
---
name: policy-gradient-trainer
description: 为给定 task 生成 REINFORCE / actor-critic / PPO training config，并诊断 variance 问题。
version: 1.0.0
phase: 9
lesson: 6
tags: [rl, policy-gradient, reinforce]
---

给定一个 environment（discrete / continuous actions、horizon、reward stats），输出：

1. Policy head。Softmax（discrete）或 Gaussian（continuous），并包含 parameter counts。
2. Baseline。None（vanilla）、running mean、learned `V̂(s)`，或 A2C critic。
3. Variance controls。默认启用 reward-to-go、return normalization、gradient clip value。
4. Entropy bonus。Coefficient β 和 decay schedule。
5. Batch size。每次 update 的 episodes 数；on-policy data freshness contract。

拒绝在 horizons > 500 steps 上使用 REINFORCE-no-baseline。拒绝为 continuous-action control 使用 softmax head。把任何 `β = 0` 且 observed policy entropy < 0.1 的 run 标记为 entropy-collapsed。
```

## Các bài tập

1. **Easy。**Trong 4×4 GridWorld 上 sử dụng chính sách mềmmax tuyến tính 实现 REINFORCE──不使用基线,训练1000 个节目──绘制学习曲线;测量变异(回报的 std)──
2. **Medium。**添加运行平均基线――再次训练――把样品效率 和差与 vanila run đối với基线 让收所需步骤 降低了多少?
3. **Hard。**添加 tiền thưởng entropy `β · H(π)`❖扫描`β ∈ {0, 0.01, 0.1, 1.0}`❖ vẽ lại kết quả và entropy chính sách ❖ nhiệm vụ này ở đâu?

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy gradient | “直接训练 policy” | `∇J(θ) = E[G · ∇ log π_θ(a\|s)]`；由 log-derivative trick 推导而来。 |
| REINFORCE | “最初的 PG algorithm” | Williams (1992)；Monte Carlo returns 乘以 log-policy Gradient。 |
| Log-derivative trick | “Score function estimator” | `∇P(τ;θ) = P(τ;θ) · ∇ log P(τ;θ)`；让 expectations 的 gradients 变得 tractable。 |
| Baseline | “Variance reduction” | 从 `G` 中减去的任意 `b(s)`；是 unbiased 的，因为 `E[b · ∇ log π] = 0`。 |
| Reward-to-go | “只计算未来 returns” | 使用 `G_t^{from t}` 而不是完整的 `G_0`；正确且 variance 更低。 |
| Entropy bonus | “鼓励探索” | `+β · H(π(·\|s))` 项防止 policy collapse。 |
| On-policy | “用你刚看到的数据训练” | Gradient expectation 是相对于当前 policy 的，不能直接复用旧数据。 |
| Advantage | “比平均好多少” | `A(s, a) = G(s, a) - V(s)`；带 baseline 的 REINFORCE 所乘的带符号 quantity。 |

## Đọc thêm

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696) Báo REINFORCE ban đầu
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) 带 hàm gần gũi của thuyết chính sách-đồng độ hiện đại.
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf) trình bày sách giáo khoa
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) 清晰的教学式讲解,包含 PyTorch code──
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf) giảm biến động, cũng như đưa REINFORCE  kết nối với gia đình vùng tin cậy (TRPO, PPO)
