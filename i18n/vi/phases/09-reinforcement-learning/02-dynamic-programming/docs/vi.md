# Dynamic Programming  Policy Iteration & Value Iteration

> Quá trình lập trình động là RL của带作弊──你已经知道过渡和奖励函数;你只需要反复代贝尔曼方程,直到`V`Hoặc`π`Không thay đổi nữa. Nó là phương pháp dựa trên mẫu thử nghiệm.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

## 问题

Bạn có một mô hình đã biết của MDP: bạn có thể đối với bất kỳ cặp hành động nhà nước  truy vấn `P(s' | s, a)`和 `R(s, a, s')` Quản lý kho biết nhu cầu phân phối  Chơi game có những chuyển đổi chắc chắn  GridWorld chỉ cần bốn dòng Python  Bạn có một mô hình 

RL không có mô hình ((Q-learning、PPO、REINFORCE) là một tình huống phát triển vì không có mô hình, đó là bạn chỉ có thể lấy mẫu từ môi trường. Nhưng khi bạn thực sự có mô hình, có cách nhanh hơn, tốt hơn: lập trình động lực. Bellman đã thiết kế những cách này vào năm 1957.

Bạn vẫn cần chúng vào năm 2026 vì có ba điểm. Thứ nhất, nghiên cứu trên RL trong mỗi môi trường bảng tính (GridWorld, FrozenLake, CliffWalking) sẽ sử dụng DP để tìm giải pháp, để tạo ra chính sách tiêu chuẩn vàng. Thứ hai, các giá trị chính xác có thể cho phép bạn *debug* phương pháp lấy mẫu: nếu Q-learning đối với`V*(s_0)`Phân tích của các ước tính với DP 答案相差 30%, học tập Q của bạn có lỗi.

## 概念

![Policy iteration and value iteration, side by side](../assets/dp.svg)

**两个算法，都是 Bellman 上的 fixed-point iteration。**

**Policy iteration。**交替执行两个步骤,直到 chính sách không thay đổi nữa.

1. *Thêm đánh giá:* 给定 chính sách `π`,反复应用 `V(s) ← Σ_a π(a|s) Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`, cho đến khi收, để tính toán `V^π`
2. *Cải thiện:* 给定 `V^π`,让 `π`So với `V^π`变为贪:`π(s) ← argmax_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`

收是有保证的,因为 (a) Mỗi bước cải tiến phải giữ `π`Không thay đổi, phải nghiêm khắc nâng cao một số tiểu bang `V^π`,(b) Không gian của các chính sách xác định là giới hạn. Ngay cả trong không gian nhà nước lớn, thường cũng sẽ trong khoảng 520 lần lặp lại bên ngoài trong收──

**Value iteration。**将 đánh giá và cải thiện 合并成一次扫扫――应用 Bellman * tối ưu hóa* phương trình:

`V(s) ← max_a Σ_{s',r} P(s',r|s,a) [r + γ V(s')]`

重复 đến `max_s |V_{new}(s) - V(s)| < ε`❖ cuối cùng thông qua chọn hành động tham lam 提取 chính sách。 mỗi lần lặp lại 严格更快, vì không có vòng đánh giá bên trong, nhưng thường cần nhiều lần lặp lại 才能收──

**Generalized policy iteration (GPI)。**统一视角──Tác dụng giá trị 和 chính sách được khóa trong một vòng lặp cải tiến hai chiều; bất cứ lúc nào thúc đẩy hai người hướng đến nhau một cách thống nhất.

**为什么 `γ < 1` 很重要。**Bellman đang hoạt động trong một quá trình bình thường.`γ`-sự thu hẹp:`||T V - T V'||_∞ ≤ γ ||V - V'||_∞`◊Contraction có nghĩa là điểm cố định duy nhất 和几何收── bỏ đi `γ < 1`, bạn đã mất đảm bảo, cần đường chân trời hữu hạn hoặc hấp thụ trạng thái cuối cùng.

## 动手构建

### Bước 1: 构建 GridWorld MDP model

Sử dụng Bài học 01 trong cùng 4×4 GridWorld.`0.1`√ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √

```python
SLIP = 0.1

def transitions(state, action):
    if state == TERMINAL:
        return [(state, 0.0, 1.0)]
    outcomes = []
    for direction, prob in action_probs(action):
        outcomes.append((apply_move(state, direction), -1.0, prob))
    return outcomes
```

`transitions(s, a)` quay lại `(s', r, p)`Đây là toàn bộ mô hình.

### Bước 2: Đánh giá chính sách

给定 chính sách `π(s) = {action: prob}`,代 Bellman phương trình, cho đến khi `V`Không biến đổi:

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = sum(pi_a * sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a))
                   for a, pi_a in policy(s).items())
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

### Bước 3: Cải thiện chính sách

用 đối với `V`Chính sách tham lam của 替换 `π` Nếu `π`Không thay đổi, quay lại, vì chúng ta đã đạt được tối ưu.

```python
def policy_improvement(V, gamma=0.99):
    new_policy = {}
    for s in states():
        best_a = max(
            ACTIONS,
            key=lambda a: sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a)),
        )
        new_policy[s] = best_a
    return new_policy
```

### Bước 4: 组合起来

```python
def policy_iteration(gamma=0.99):
    policy = {s: "up" for s in states()}   # arbitrary start
    for _ in range(100):
        V = policy_evaluation(lambda s: {policy[s]: 1.0}, gamma)
        new_policy = policy_improvement(V, gamma)
        if new_policy == policy:
            return V, policy
        policy = new_policy
```

Trong 4×4 上典型会在 46次外变 内收──输出 `V*(0,0) ≈ -6`, và một chính sách sẽ nghiêm ngặt giảm số bước.

### Bước 5: lặp lại giá trị (单 loop 版本)

```python
def value_iteration(gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = max(sum(p * (r + gamma * V[s_prime])
                       for s_prime, r, p in transitions(s, a))
                   for a in ACTIONS)
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            break
    policy = policy_improvement(V, gamma)
    return V, policy
```

Điểm cố định tương tự, ít hơn là số code.

## 常见陷

- **忘记处理 terminals。**Nếu bạn sử dụng Bellman để hấp thụ, nó vẫn sẽ có được một hành động tốt nhất không thay đổi gì.`if s == terminal: V[s] = 0`防护.
- **Sup-norm vs L2 convergence。**Sử dụng `max |V_new - V|`, không sử dụng giá trị trung bình.
- **In-place vs synchronous updates。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `V[s]`(Gauss-Seidel) Than sử dụng đơn độc`V_new`dict(Jacobi)收更快── Mã sản xuất Sử dụng tại chỗ──
- **Policy ties。**Nếu hai hành động có cùng giá trị Q,`argmax`Có thể mỗi lần lặp lại sử dụng cách khác nhau để phá vỡ平局, dẫn đến nhoàng chính sách  kiểm tra振荡── sử dụng ổn định tie-break(phát hành thứ nhất trong chuỗi cố định)。
- **State-space explosion。**DP mỗi lần lau là `O(|S| · |A|)`◊ được sử dụng trong khoảng 107 tiểu bang. ◊ vượt qua quy mô này, bạn cần tính toán gần như các hàm (Phase 9 · 05 tiếp theo) ◊


```figure
value-iteration-gamma
```

## Sử dụng nó

Trong năm 2026, DP là cơ sở chính xác, cũng là vòng lặp bên trong của các nhà hoạch định:

| Use case | Method |
|----------|--------|
| 精确求解小型 tabular MDP | Value iteration（更简单）或 policy iteration（outer steps 更少） |
| 验证 Q-learning / PPO 实现 | 在 toy environment 上与 DP-optimal V* 对比 |
| Model-based RL（Phase 9 · 10） | 在 learned transition model 上做 Bellman backup |
| AlphaZero / MuZero 中的 Planning | Monte Carlo Tree Search = async Bellman backup |
| Offline RL（CQL、IQL） | Conservative Q-iteration，即带有 OOD actions penalty 的 DP |

Mỗi khi ai đó nói the value function 时, họ chỉ ra the DP fixed point──当你在论文中看`V*`Hoặc`Q*`时, hãy tưởng tượng vòng lặp này

## 交付 nó

保存为 `outputs/skill-dp-solver.md`- Có thể là:

```markdown
---
name: dp-solver
description: 通过 policy iteration 或 value iteration 精确求解小型 tabular MDP。报告收敛行为。
version: 1.0.0
phase: 9
lesson: 2
tags: [rl, dynamic-programming, bellman]
---

给定一个已知 model 的 MDP，输出：

1. 选择。Policy iteration vs value iteration。理由需关联 |S|、|A|、γ。
2. 初始化。V_0、starting policy。Convergence sensitivity。
3. 停止条件。Sup-norm tolerance ε。预期 sweeps 数。
4. 验证。精确计算的 V*(s_0)。提取出的 Greedy policy。
5. 使用方式。这个 baseline 将如何用于 debug/evaluate sampling-based methods。

拒绝在 state spaces > 10⁷ 上运行 DP。没有 sup-norm check 时，拒绝声称收敛。将 infinite-horizon task 上任何 γ ≥ 1 标记为 guarantee violation。
```

## 练习

1. **Easy.**Trong 4×4 GridWorld 上使用 `γ ∈ {0.9, 0.99}`运行 giá trị lặp lại.`max |ΔV| < 1e-6`需要多少次扫扫? 将`V*`打印为4×4 lưới
2. **Medium.**Trong GridWorld có khả năng trượt`0.1`(上比较政策反复和值反复――统计:sweeps、壁表时间、最终)`V*(0,0)` Which in iterations 上收快? Which in wall-clock 上更快?
3. **Hard.**构建修改政策 lặp lại: trong giai đoạn đánh giá 中, chỉ运行 `k`Thứ hai là quét, thay vì chạy đến nhận.`k ∈ {1, 2, 5, 10, 50}` vẽ`V*(0,0)`lỗi vs `k` This article curve  nói cho bạn đánh giá / cải thiện giao dịch thông tin gì?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy iteration | “DP algorithm” | 交替进行 evaluation（`V^π`）和 improvement（相对于 `V^π` 的 greedy `π`），直到 policy 不再变化。 |
| Value iteration | “Faster DP” | Bellman optimality backup 在一次 sweep 中应用；几何收敛到 `V*`。 |
| Bellman operator | “The recursion” | `(T V)(s) = max_a Σ P (r + γ V(s'))`；sup-norm 下的 `γ`-contraction。 |
| Contraction | “Why DP converges” | 任何满足 `\|\|T x - T y\|\| ≤ γ \|\|x - y\|\|` 的 operator `T` 都有唯一 fixed point。 |
| GPI | “Everything is DP” | Generalized Policy Iteration：任何推动 `V` 和 `π` 达到相互一致的方法。 |
| Synchronous update | “Jacobi-style” | 在一次 sweep 中始终使用旧的 `V`；便于清晰分析，但更慢。 |
| In-place update | “Gauss-Seidel-style” | 使用正在被更新的 `V`；实践中收敛更快。 |

## 延伸阅读

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf) chính sách lặp đi lặp lại và giá trị lặp đi lặp lại của trình bày cổ điển.
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook.html) đối với việc lập bản đồ thu hẹp 论证的严谨处理──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) sự lặp lại chính sách được sửa đổi  và phân tích hội tụ của nó
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) Original chính sách giấy lặp lại
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html)Từ DP đến khoảng DP / sâu RL của cây cầu, hậu mỗi phần của lớp học đều được sử dụng đến
