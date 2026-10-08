# Sự khác biệt thời gian  Q-Learning & SARSA

> Monte Carlo 会一直等到集 结束──TD 通过bootstrap 下一个价值估计,在每一步后更新──Q-learning là ngoại chính sách 且偏乐观;SARSA là trên chính sách 且偏谨慎──两者都只是一行代码──两者也支着本阶段中的每种深度RL 方法──

**Type:** Build
**Languages:** Python
**前置要求:**Giai đoạn 9 · 01 (MDPs), Giai đoạn 9 · 02 (Việc lập trình năng động), Giai đoạn 9 · 03 (Monte Carlo)
**Time:** ~75 minutes

## 问题

Monte Carlo có thể, nhưng nó có hai yêu cầu rất cao. Nó cần phải kết thúc các tập, và chỉ có thể được cập nhật sau khi hoàn thành. Nếu tập của bạn có 1.000 bước, MC cần phải chờ 1.000 bước để cập nhật bất cứ thứ gì.

Quá trình lập trình động 则相反: 零方差的 bootstrapped backups, nhưng yêu cầu mô hình đã biết.

Sự khác biệt thời gian (TD) học tập 折中了两者──根据单个过渡 `(s, a, r, s')`, xây dựng một mục tiêu một bước `r + γ V(s')`,并把 `V(s)`朝它推近──不需要模型──不需要完整的剧集──由于在RHS上使用近似的`V`Sẽ đưa ra sự phân biệt, nhưng sự phân biệt thấp hơn MC, và từ bước đầu tiên bắt đầu có thể được cập nhật trực tuyến.

Đây là tất cả các RL hiện đại ((DQN、A2C、PPO、SAC) phụ thuộc vào các điểm支点。Phase 9 剩下的内容,都是在你将在本课中写的单步TD更新 之上叠加函数近似和技巧──

## 概念

![Q-learning vs SARSA: off-policy max vs on-policy Q(s', a')](../assets/td.svg)

**用于 V 的 TD(0) update：**

`V(s) ← V(s) + α [r + γ V(s') - V(s)]`

方括号中量是 TD lỗi `δ = r + γ V(s') - V(s)` Đó là MC `G_t - V(s_t)`                                                                                                                                                                                                                                                              `α`满足 Robbins-Monro`Σ α = ∞`- Tôi không biết.`Σ α² < ∞`), và tất cả các quốc gia được truy cập vô hạn.

**Q-learning。**Một cách TD không chính sách được sử dụng để kiểm soát:

`Q(s, a) ← Q(s, a) + α [r + γ max_{a'} Q(s', a') - Q(s, a)]`

`max`假设 từ `s'`开始会遵循 *贪* chính sách,不管代理 实际采取什么行动――这种解让Q-learning 在代理 通过 ε-贪 探索时仍然学习`Q*`❖Mnih et al. (2015) sẽ chuyển đổi nó thành Atari 上的深度Q-学习 (Dạy học 05) ❖

**SARSA。**Một cách TD trên chính sách:

`Q(s, a) ← Q(s, a) + α [r + γ Q(s', a') - Q(s, a)]`

Tên này đến từ Tuple.`(s, a, r, s', a')` SARSA Sử dụng đại lý `a'`, thay vì tham lam `argmax` Nó sẽ nhận được cho hiện tại vận hành bất cứ ε- tham lam `π`đối phó`Q^π`; ở cực giới`ε → 0`Tôi sẽ biến thành`Q*`

**cliff-walking 的差异。**Trong nhiệm vụ đi bộ đá vách cổ điển, việc học Q-learning học được cách tốt nhất dọc theo bờ vách đá, nhưng đôi khi sẽ bị trừng phạt trong quá trình khám phá. SARSA sẽ học được cách đây một bước xa hơn khỏi vách đá, vì nó đã đưa âm thanh khám phá vào giá trị Q của mình.`ε → 0`Trong thực tế, điều này rất quan trọng: khi triển khai thực sự đang diễn ra, hành vi của SARSA sẽ được bảo trì tốt hơn.

**Expected SARSA。**用 `π` 下的期望值替换 `Q(s', a')`- Có thể là:

`Q(s, a) ← Q(s, a) + α [r + γ Σ_{a'} π(a'|s') Q(s', a') - Q(s, a)]`

方差低于 SARSA(不对 `a'`采样), mục tiêu cũng như chính sách.

**n-step TD 和 TD(λ)。**通过等待 `n`步再 bootstrap, trong TD(0) và MC 之间插值──`n=1`là TD,`n=∞`- Đúng vậy.`(1-λ)λ^{n-1}`Đối với tất cả mọi người`n`求平均──大多数 deep-RL sử dụng từ 3 đến 20 `n`


```figure
qlearning-gridworld
```

##  xây dựng nó

### Bước 1: SARSA dựa trên chính sách tham lam

```python
def sarsa(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})

    def choose(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        s = env.reset()
        a = choose(s)
        while True:
            s_next, r, done = env.step(s, a)
            a_next = choose(s_next) if not done else None
            target = r + (gamma * Q[s_next][a_next] if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s, a = s_next, a_next
    return Q
```

Sự khác biệt duy nhất giữa việc học Q và học Q là mục tiêu đó.

### 步骤 2: Học Q

```python
def q_learning(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    for _ in range(episodes):
        s = env.reset()
        while True:
            a = choose(s, Q, epsilon)
            s_next, r, done = env.step(s, a)
            target = r + (gamma * max(Q[s_next].values()) if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s = s_next
    return Q
```

`max`Để giải quyết mục tiêu và hành vi.

### 步骤 3: đường cong học tập

Theo dõi mỗi 100 tập của trung bình trở lại. Q-làm học trong đơn giản xác định GridWorld 上收快; SARSA 在悬崖-walking 上更保守.`code/main.py`của 4×4 GridWorld 中,两者在 `α=0.1, ε=0.1`Này, khoảng 2.000 tập đã gần như là tốt nhất.

### 步骤 4: So sánh với DP giá trị thực

运行 giá trị lặp lại(Dạy 02) nhận được `Q*`❖ kiểm tra`max_{s,a} |Q_learned(s,a) - Q*(s,a)|`Một đại lý TD bảng tính khỏe mạnh trong 4x4 GridWorld lên đào tạo 10.000 tập  sau đó, nên rơi vào `~0.5`Trong

## 陷

- **初始 Q values 很重要。**乐观初始化 负奖励 任务中 `Q = 0`(Báo cáo) sẽ khuyến khích tìm hiểu.
- **α schedule。**常数 `α`Đối với vấn đề không ổn định là có thể.`α_n = 1/n`Trong lý thuyết có thể nhận được, nhưng thực tế quá chậm;`α` cố định `[0.05, 0.3]`,并 giám sát đường cong học tập.
- **ε schedule。**Từ高值开始`ε=1.0`), giảm xuống`ε=0.05`"GLIE" tham lam trong giới hạn với khám phá vô hạn) 是收条件──
- **Q-learning 中的 max bias。**Khi đó`Q`Có tiếng ồn,`max`Operator 存在上偏差──会导致高估;Hasselt's Double Q-learning(Lớp 05 中 DDQN 使用的做法) sử dụng hai bảng Q 修复这个问题──
- **非终止 episodes。**TD có thể học trong trường hợp không có đầu cuối, nhưng bạn cần giới hạn số bước, hoặc xử lý bootstrap đúng ở các giới hạn trên.
- **State hashing。**Nếu các trạng thái là tuples/tensors, sử dụng có thể hash của khóa(tuple, không phải danh sách;四舍五入后的浮游 tuple, không phải là浮游原料)

## Sử dụng nó

Tâm lý TD năm 2026:

| Task | Method | Reason |
|------|--------|--------|
| 小型 tabular environments | Q-learning | 直接学习 optimal policy。 |
| On-policy safety-critical | SARSA / Expected SARSA | 探索期间更保守。 |
| High-dimensional state | DQN (Phase 9 · 05) | 带 replay 和 target net 的 Neural Network Q-function。 |
| Continuous actions | SAC / TD3 (Phase 9 · 07) | 在 Q-network 上做 TD update；policy net 发出 actions。 |
| LLM RL (reward-model-based) | PPO / GRPO (Phase 9 · 08, 12) | 使用通过 GAE 得到的 TD-style advantage 的 actor-critic。 |
| Offline RL | CQL / IQL (Phase 9 · 08) | 带 conservative regularization 的 Q-learning。 |

Bạn sẽ đọc được 9 phần "RL" trong bài viết năm 2026 , đều là một loại mở rộng của Q-làm học hoặc SARSA.

## 交付 nó

保存为 `outputs/skill-td-agent.md`- Có thể là:

```markdown
---
name: td-agent
description: Pick between Q-learning, SARSA, Expected SARSA for a tabular or small-feature RL task.
version: 1.0.0
phase: 9
lesson: 4
tags: [rl, td-learning, q-learning, sarsa]
---

Given a tabular or small-feature environment, output:

1. Algorithm. Q-learning / SARSA / Expected SARSA / n-step variant. One-sentence reason tied to on-policy vs off-policy and variance.
2. Hyperparameters. α, γ, ε, decay schedule.
3. Initialization. Q_0 value (optimistic vs zero) and justification.
4. Convergence diagnostic. Target learning curve, `|Q - Q*|` check if DP is possible.
5. Deployment caveat. How will exploration behave at inference? Is SARSA's conservatism needed?

Refuse to apply tabular TD to state spaces > 10⁶. Refuse to ship a Q-learning agent without a max-bias caveat. Flag any agent trained with ε held at 1.0 throughout (no exploitation phase).
```

## 练习

1. **Easy。**Trong 4×4 GridWorld 上实现 Q-learning 和 SARSA── vẽ đường cong học tập 2.000 tập phim( mỗi 100 tập phim trung bình trở lại)──谁收更快?
2. **Medium。**构建一个悬崖走行环境(4×12,最后一行是悬崖,奖励 -100 并重置到起点) ⋅ So sánh Q-learning 和 SARSA's最终政策──截图显示它们各自走过的路径──哪个更接近悬崖?
3. **Hard。**实现 Double Q-learning──在噪音-reward GridWorld 上(给每步奖励 添加高斯音 σ=5),展示 Q-learning 会明显高估 `V*(0,0)`, và học Double Q không sẽ.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| TD error | "The update signal" | `δ = r + γ V(s') - V(s)`，bootstrapped residual。 |
| TD(0) | "One-step TD" | 每次 transition 后只使用 next state's estimate 进行更新。 |
| Q-learning | "Off-policy RL 101" | 对 next-state actions 使用 `max` 的 TD update；无论 behavior policy 如何，都会学习 `Q*`。 |
| SARSA | "On-policy Q-learning" | 使用实际 next action 的 TD update；为当前 ε-greedy π 学习 `Q^π`。 |
| Expected SARSA | "The low-variance SARSA" | 用 π 下的期望替换采样得到的 `a'`。 |
| GLIE | "Correct exploration schedule" | Greedy in the Limit with Infinite Exploration；Q-learning 收敛所需。 |
| Bootstrapping | "Using current estimate in the target" | 区分 TD 和 MC 的关键。是偏差来源，但能大幅降低方差。 |
| Maximization bias | "Q-learning overestimates" | 对有噪声 estimates 取 `max` 会产生向上偏差；由 Double Q-learning 修复。 |

## 延伸阅读
- [Watkins & Dayan (1992). Q-learning](https://link.springer.com/article/10.1007/BF00992698) 原始论文和收证明。
- [Sutton & Barto (2018). Ch. 6 — Temporal-Difference Learning](http://incompleteideas.net/book/RLbook2020.pdf) TD(0) 、SARSA、Q-làm học、Tất vọng SARSA。
- [Hasselt (2010). Double Q-learning](https://papers.nips.cc/paper_files/paper/2010/hash/091d584fced301b442654dd8c23b3fc9-Abstract.html) phương pháp sửa chữa của sự thiên vị tối đa hóa.
- [Seijen, Hasselt, Whiteson, Wiering (2009). A Theoretical and Empirical Analysis of Expected SARSA](https://ieeexplore.ieee.org/document/4927542) dự kiến động cơ của SARSA:
- [Rummery & Niranjan (1994). On-line Q-learning using connectionist systems](https://www.researchgate.net/publication/2500611_On-Line_Q-Learning_Using_Connectionist_Systems) 创造 SARSA 这个术语的论文(当时 được gọi là "sự học tập Q-sự kết nối sửa đổi")
- [Sutton & Barto (2018). Ch. 7 — n-step Bootstrapping](http://incompleteideas.net/book/RLbook2020.pdf) 将 TD(0) 泛化到 TD(n), đây là từ việc học Q hướng tới dấu vết đủ điều kiện, cũng như sau đó là đường GAE trong PPO.
