# Phương pháp Monte Carlo  Học hỏi từ các tập hoàn chỉnh

> Quá trình lập trình động 需要模型──Monte Carlo ngoại trừ các tập 什么都不需要──运行政策,观察回报,取平均──这是 RL đơn giản nhất của ý tưởng, cũng là giải锁后续一切的想法──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming)
**Time:** ~75 minutes

## 问题

Quá trình lập trình năng động  rất tốt, nhưng nó giả định bạn có thể đối với mỗi trạng thái và hành động  truy vấn `P(s' | s, a)`△ trên thế giới thực hầu như không có gì làm việc như vậy ◦ Robot 无法解析地计算施施加合扭矩 后摄像头像素的分布──定价算法 无法对待每种可能客户反应 积分──LLM 无法枚举某个代币 后所有可能延续──

Bạn cần một phương pháp chỉ phụ thuộc vào môi trường trong *chọn mẫu* của phương pháp.`s_0, a_0, r_1, s_1, a_1, r_2, …, s_T` Sử dụng nó để ước tính giá trị.

Sự chuyển đổi từ DP đến MC rất quan trọng trong tư tưởng: chúng ta chuyển từ * mô hình được biết đến + sao lưu chính xác * 转向 * mẫu triển khai + lợi nhuận trung bình *。 Sự biến đổi sẽ tăng lên, nhưng ứng dụng sẽ tăng lên một cách bùng nổ。 Mỗi thuật toán RL sau bài học này, TD、Q-learning、REINFORCE、PPO、GRPO, bản chất là ước tính Monte Carlo, đôi khi sẽ được lắp đặt trên nó bootstrapping。

## 概念

![Monte Carlo: rollout, compute returns, average; first-visit vs every-visit](../assets/monte-carlo.svg)

**核心思想，一行表达：** `V^π(s) = E_π[G_t | s_t = s] ≈ (1/N) Σ_i G^{(i)}(s)`, trong số đó `G^{(i)}(s)`Đó là chính sách.`π`下访问 `s`之后观察到的回报──

**First-visit vs every-visit MC。**Định một trạng thái nhiều lần truy cập`s`Trong một tập, lần đầu tiên MC chỉ thống kê lần đầu tiên thăm sau khi trở lại; mỗi lần truy cập MC 统计所有访问──二者在极限下都是无偏见──第一次访问更容易分析(iid样本)──每次访问 每个集使用更多数据,在实践中通常收更快──

**Incremental mean。**Không lưu trữ tất cả các lợi nhuận, mà là cập nhật trung bình chạy:

`V_n(s) = V_{n-1}(s) + (1/n) [G_n - V_{n-1}(s)]`

重新整理:`V_new = V_old + α · (target - V_old)`, trong số đó `α = 1/n` `1/n`换 thành không đổi kích thước bước `α ∈ (0, 1)`, bạn sẽ có một máy tính ước tính MC không tĩnh, nó sẽ theo dõi`π`Sự thay đổi. Đây là động tác từ MC  nhảy đến TD, nhảy lại đến tất cả các khóa của mỗi thuật toán RL hiện đại.

**Exploration 现在成了问题。**DP 通过枚举触及每个州──MC chỉ xem chính sách 会访问各州──如果`π`là xác định, không gian trạng thái 中整片区域永远不会 được lấy mẫu, ước tính giá trị của chúng sẽ mãi mãi dừng lại ở zero.

1. **Exploring starts。**Từ随机 (s, a) cặp 开始每个集──保证覆盖;实践中不现实(你不能把机器人 重置到任意状态)──
2. **ε-greedy。**Compared to current Q  thực hiện hành động tham lam, nhưng có khả năng `ε`选择随机行动―― tất cả các cặp hành động trạng thái đều được lấy mẫu.
3. **Off-policy MC。**Trong chính sách hành vi `μ`下收集数据, thông qua việc lấy mẫu tầm quan trọng học chính sách mục tiêu `π`❖ Sự biến thể cao, nhưng đây là đường dẫn của các phương pháp buffer-play như DQN ❖

**Monte Carlo Control。**Đánh giá → cải thiện → đánh giá,就像 chính sách lặp lại như vậy, nhưng đánh giá là dựa trên mẫu:

1. 运行 `π`, có một tập.
2. Theo các báo cáo được quan sát`Q(s, a)`
3. 让 `π`So với `Q`变成 ε-cười tham lam.
4. Đổi lại

Trong điều kiện ấm áp, mỗi cặp được truy cập vô hạn,`α`满足 Robbins-Monro), sẽ có tỷ lệ 1 收到 `Q*`和 `π*`

## 动手构建

### Bước 1: triển khai → (s, a, r) 列表

```python
def rollout(env, policy, max_steps=200):
    trajectory = []
    s = env.reset()
    for _ in range(max_steps):
        a = policy(s)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r))
        s = s_next
        if done:
            break
    return trajectory
```

Không có mô hình, chỉ có`env.reset()`和 `env.step(s, a)`                                                                                                                                                                                                                                                              

### Bước 2: 计算 trả lại(反向扫)

```python
def returns_from(trajectory, gamma):
    returns = []
    G = 0.0
    for _, _, r in reversed(trajectory):
        G = r + gamma * G
        returns.append(G)
    return list(reversed(returns))
```

Một lần qua,`O(T)`❖ chống lại tái phát`G_t = r_{t+1} + γ G_{t+1}`避免了重复求和──

### Bước 3: đánh giá MC lần đầu tiên

```python
def mc_policy_evaluation(env, policy, episodes, gamma=0.99):
    V = defaultdict(float)
    counts = defaultdict(int)
    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for t, ((s, _, _), G) in enumerate(zip(trajectory, returns)):
            if s in seen:
                continue
            seen.add(s)
            counts[s] += 1
            V[s] += (G - V[s]) / counts[s]
    return V
```

真正工作的就是三行: lần đầu tiên thăm 时标记状态 为见, tăng số, cập nhật chạy trung bình。

### Bước 4: kiểm soát MC tham lam (on-policy)

```python
def mc_control(env, episodes, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    counts = defaultdict(lambda: {a: 0 for a in ACTIONS})

    def policy(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for (s, a, _), G in zip(trajectory, returns):
            if (s, a) in seen:
                continue
            seen.add((s, a))
            counts[s][a] += 1
            Q[s][a] += (G - Q[s][a]) / counts[s][a]
    return Q, policy
```

### Bước 5: So với tiêu chuẩn vàng DP

当 episodes → ∞ 时,你对 `V^π`Ước tính của MC  nên tương đương với kết quả DP trong Bài học 02                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `~0.1`Trong phạm vi của mình.

## 常见陷

- **Infinite episodes。**MC  yêu cầu các tập  phải * chấm dứt*... Nếu chính sách của bạn có thể luôn lặp, xin hãy đặt `max_steps`Ưu điểm,并把达到 Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ư
- **Variance。**MC sử dụng hoàn toàn trả lại. Trong các tập dài, sự khác biệt rất lớn, cuối cùng một lần để trả lại sẽ được chuyển đổi bằng cùng một lượng.`V(s_0)` Các phương pháp TD (Dạy học 04) thông qua bootstrapping 降低这一点
- **State coverage。**Trong một Q mới 上做贪 MC, nếu có mối quan hệ, chỉ sẽ liên tục cố gắng một hành động.
- **Non-stationary policies。**Nếu `π`发生变化 (如 MC control 中那样), cũ trả về từ các chính sách khác nhau.
- **Off-policy importance sampling。**权重 `π(a|s)/μ(a|s)`会沿轨迹 连乘──Variance 会随地平线 爆炸──用每决权 IS 截断,或切换到 TD──


```figure
epsilon-greedy
```

## Sử dụng nó

Phương pháp Monte Carlo trong 2026 năm:

| Use case | Why MC |
|----------|--------|
| Short-horizon games（blackjack、poker） | Episodes 自然 terminate；returns 清晰。 |
| Logged policy 的 offline evaluation | 对 stored trajectories 的 discounted returns 求平均。 |
| Monte Carlo Tree Search（AlphaZero） | 从 tree leaves 发起的 MC rollouts 指导 selection。 |
| LLM RL evaluation | 为给定 policy 计算 sampled completions 的 average reward。 |
| PPO 中的 baseline estimation | Advantage target `A_t = G_t - V(s_t)` 使用 MC `G_t`。 |
| RL 教学 | 最简单且真正有效的 algorithm；去掉 bootstrapping 就能看到核心。 |

现代 deep-RL algorithms ((PPO、SAC) sẽ thông qua `n`- bước trả lại hoặc GAE, trong MC hoàn toàn trả lại) và TD hoàn toàn trả lại một bước khởi động) giữa插值──两个端点都是同类估计的实例──

## 交付 nó

保存为 `outputs/skill-mc-evaluator.md`- Có thể là:

```markdown
---
name: mc-evaluator
description: 通过 Monte Carlo rollouts 评估 policy，并在可用时生成带有 DP-comparison 的 convergence report。
version: 1.0.0
phase: 9
lesson: 3
tags: [rl, monte-carlo, evaluation]
---

给定一个 environment（episodic，带 reset+step API）和一个 policy，输出：

1. 方法。First-visit vs every-visit MC。理由。
2. Episode budget。目标数量、variance diagnostic、预期 standard error。
3. Exploration plan。ε schedule（如需要）或 exploring starts。
4. Gold-standard comparison。如果是 tabular，则给出 DP-optimal V*；否则给出来自 Q-learning / PPO baseline 的 bound。
5. Termination check。Max-step cap、timeouts、non-terminating trajectories 的处理。

没有 finite horizon cap 时，拒绝在 non-episodic tasks 上运行 MC。对于 tabular tasks，如果每个 state 少于 100 个 episodes，拒绝报告 V^π estimates。将任何具有 zero-variance actions 的 policy 标记为 exploration risk。
```

## 练习

1. **Easy.**实现 4×4 GridWorld 上 đồng bộ ngẫu nhiên chính sách của lần đầu tiên thăm MC đánh giá ➡️运行 10,000 tập ➡️`V(0,0)`随节目数 变化的曲线与 DP 答案对照绘制──
2. **Medium.**用 `ε ∈ {0.01, 0.1, 0.3}`实现 ε-greedy MC control──比较20,000 tập 后的平均回报──曲线看起来是什么样?
3. **Hard.**Sử dụng quan trọng lấy mẫu 实现 *off-policy* MC: trong chính sách đồng bộ-quay `μ`下 thu thập dữ liệu, ước tính chính sách tối ưu xác định`π`của `V^π`◊ So sánh đơn giản IS、per-decision IS 和 cân nặng IS──cuối đa số là tối thiểu?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Monte Carlo | “Random sampling” | 通过对来自分布的 iid samples 求平均来估计 expectations。 |
| Return `G_t` | “Future reward” | 从 step `t` 到 episode 结束的 discounted rewards 总和：`Σ_{k≥0} γ^k r_{t+k+1}`。 |
| First-visit MC | “Count each state once” | 一个 episode 中只有第一次访问会贡献到 value estimate。 |
| Every-visit MC | “Use all visits” | 每次访问都会贡献；略有 biased，但 sample-efficient 更高。 |
| ε-greedy | “Exploration noise” | 以概率 `1-ε` 选择 greedy action；以概率 `ε` 选择 random action。 |
| Importance sampling | “Correcting for sampling from the wrong distribution” | 通过 `π(a\|s)/μ(a\|s)` 乘积对 returns 重新加权，从 `μ` 数据估计 `V^π`。 |
| On-policy | “Learn from my own data” | Target policy = behavior policy。Vanilla MC、PPO、SARSA。 |
| Off-policy | “Learn from someone else's data” | Target policy ≠ behavior policy。Importance-sampled MC、Q-learning、DQN。 |

## 延伸阅读

- [Sutton & Barto (2018). Ch. 5 — Monte Carlo Methods](http://incompleteideas.net/book/RLbook2020.pdf) 经典处理。
- [Singh & Sutton (1996). Reinforcement Learning with Replacing Eligibility Traces](https://link.springer.com/article/10.1007/BF00114726) lần đầu tiên đối với mỗi lần thăm phân tích.
- [Precup, Sutton, Singh (2000). Eligibility Traces for Off-Policy Policy Evaluation](http://incompleteideas.net/papers/PSS-00.pdf) không có chính sách MC 和 kiểm soát biến động
- [Mahmood et al. (2014). Weighted Importance Sampling for Off-Policy Learning](https://arxiv.org/abs/1404.6362) 现代 định giá IS biến thể thấp
- [Tesauro (1995). TD-Gammon, A Self-Teaching Backgammon Program](https://dl.acm.org/doi/10.1145/203330.203343)MC/TD tự chơi 收到超人玩的首个大规模实证展示; cũng là nguyên tắc tiên phong của khái niệm của giai đoạn này.
