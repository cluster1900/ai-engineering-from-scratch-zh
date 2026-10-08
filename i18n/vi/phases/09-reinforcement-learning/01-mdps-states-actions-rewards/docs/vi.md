# MDPs, Các quốc gia, Các hành động và phần thưởng

> Quá trình quyết định Markov được tạo thành từ năm yếu tố: các trạng thái, hành động, chuyển đổi, phần thưởng, giảm giá.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

## 问题

Bạn đang viết một bot cờ vua... hoặc một nhà hoạch định hàng tồn kho... hoặc một đại lý giao dịch... hoặc một vòng lặp PPO của mô hình lý luận đào tạo... trong bốn lĩnh vực khác nhau, nhưng có một thực tế đáng ngạc nhiên: chúng có thể được kết hợp với cùng một đối tượng toán học.

Học tập được giám sát 给你 `(x, y)`Các cặp,并 yêu cầu bạn phù hợp với một hàm. Việc học tập tăng cường không cho bạn nhãn hiệu, chỉ cho bạn một loạt các trạng thái, các hành động bạn thực hiện, cũng như một phần thưởng quy mô.

Trước khi hình thành, bạn không thể học được từ dòng này. Tôi đã thấy những gì tôi đã làm, những gì tôi đã làm sau đó xảy ra. Mỗi thứ đều phải trở thành một đối tượng mà bạn có thể suy nghĩ.

## 概念

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**五个对象。**

- **States** `S`Trong GridWorld, là một người chơi. Trong cờ vua, là một người chơi. Trong LLM, là một cửa sổ bối cảnh, và bất kỳ bộ nhớ nào.
- **Actions** `A`△可选行为──上/下/左/右移动──下一步棋──输出一个代币──
- **Transitions** `P(s' | s, a)` Đưa ra một trạng thái`s`và hành động `a`, next state of distribution── trong cờ vua là xác định, trong hàng tồn kho là stochastic, trong giải mã LLM gần như xác định──
- **Rewards** `R(s, a, s')` 标量信号──赢 = +1,输 = -1──收入减成本──GRPO 中的日志概率比例 项──
- **Discount** `γ ∈ [0, 1)`: : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : :`γ = 0.99`买到约100 bước của chân trời;`γ = 0.9`买到约10:

**Markov property** `P(s_{t+1} | s_t, a_t) = P(s_{t+1} | s_0, a_0, …, s_t, a_t)`: tương lai chỉ phụ thuộc vào trạng thái hiện tại. Nếu không tồn tại, thì đại diện của nhà nước không hoàn hảo.

**Policies 与 returns。**Chính sách `π(a | s)`把 trạng thái 映射到动作分布──Return `G_t = r_t + γ r_{t+1} + γ² r_{t+2} + …`Đó là số tiền giảm giá của phần thưởng trong tương lai.`V^π(s) = E[G_t | s_t = s]`Đó là chính sách.`π`Từ dưới`s`开始的预期回报──Q-值 `Q^π(s, a) = E[G_t | s_t = s, a_t = a]`là trong một hành động cụ thể  bắt đầu được dự kiến lợi nhuận  Mỗi thuật toán RL sẽ ước tính một trong hai, sau đó tương ứng được cải tiến `π`

**Bellman equations。**Trong giai đoạn này tất cả nội dung sẽ được sử dụng cho các phương trình điểm cố định:

`V^π(s) = Σ_a π(a|s) Σ_{s', r} P(s', r | s, a) [r + γ V^π(s')]`
`Q^π(s, a) = Σ_{s', r} P(s', r | s, a) [r + γ Σ_{a'} π(a'|s') Q^π(s', a')]`

Chúng đưa ra lợi nhuận dự kiến 拆成                                                                                                                                                                                                                                                          


```figure
discount-horizon
```

## Hãy xây dựng nó

### Bước 1: Một MDP xác định cực nhỏ

Một 4×4 GridWorld──Agent từ góc trái lên bắt đầu, kết thúc ở góc dưới phải, mỗi bước thưởng 为 -1, hành động 为 `{up, down, left, right}` `code/main.py`

```python
GRID = 4
TERMINAL = (3, 3)
ACTIONS = {"up": (-1, 0), "down": (1, 0), "left": (0, -1), "right": (0, 1)}

def step(state, action):
    if state == TERMINAL:
        return state, 0.0, True
    dr, dc = ACTIONS[action]
    r, c = state
    nr = min(max(r + dr, 0), GRID - 1)
    nc = min(max(c + dc, 0), GRID - 1)
    return (nr, nc), -1.0, (nr, nc) == TERMINAL
```

五行──这就是完整环境── định nghĩa chuyển đổi、恒定步罚、吸收终端状态──

### Bước 2: Đưa ra một chính sách

Chính sách là từ trạng thái đến hàm phân phối hành động.

```python
def uniform_policy(state):
    return {a: 0.25 for a in ACTIONS}

def rollout(policy, max_steps=200):
    s, total, steps = (0, 0), 0.0, 0
    for _ in range(max_steps):
        a = sample(policy(s))
        s, r, done = step(s, a)
        total += r
        steps += 1
        if done:
            break
    return total, steps
```

运行随机政策 1000次──这个4×4板的平均回报 大约是 -60到 -80──最佳回报是 -6(沿直线路径向下再向右)──缩小这个差距,就是9阶段的全部内容──

### Bước 3: Thông qua phương trình Bellman 精确计算 `V^π`

Đối với MDP nhỏ, phương trình Bellman là một hệ thống tuyến tính.

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in all_states()}
    while True:
        delta = 0.0
        for s in all_states():
            if s == TERMINAL:
                continue
            v = 0.0
            for a, pi_a in policy(s).items():
                s_next, r, _ = step(s, a)
                v += pi_a * (r + gamma * V[s_next])
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

Đây là đánh giá chính sách lặp lại. Đây là thuật toán đầu tiên của Sutton & Barto, cũng là cơ sở lý thuyết của mỗi phương pháp RL sau đó.

### Bước 4:`γ`là một siêu tham số có ý nghĩa vật lý

Khía cảnh hiệu quả là khoảng`1 / (1 - γ)``γ = 0.9`→ 10 bước.`γ = 0.99`→ 100 bước.`γ = 0.999`→ 1000 bước.

太低时,agent 会目光短浅──太高时,credit assignment 会变噪, vì nhiều bước đầu tiên thành phố sẽ cùng nhau chịu trách nhiệm về phần thưởng trong tương lai.`γ = 1`,因为 các tập 短且有界──Control tasks 使用 `0.95–0.99`❖ Các trò chơi chiến lược tầm xa 使用 `0.999`

## 陷

- **Non-Markovian state.**Nếu bạn cần gần đây3 lần quan sát 才能决策, thì state 不只是当前 quan sát──修复:stack frames(DQN 在 Atari 上堆叠 4 ) hoặc sử dụng trạng thái lặp lại(在 quan sát 上用 LSTM/GRU)。
- **Sparse rewards.**Chỉ khi thắng, sẽ làm cho học tập trong không gian nhà nước lớn gần như không thể.
- **Reward hacking.**优化代理奖励 经常产生病态行为――OpenAI's boat-racing agent 一直原地转圈收集 powerups, thay vì hoàn thành cuộc thi――始终从目标结果定义奖励,而不是从代理定义――
- **Discount mis-spec.**Trong nhiệm vụ chân trời vô hạn 上使用 `γ = 1`Để mọi giá trị đều trở nên vô hạn.`γ < 1`Để giới hạn.
- **Reward scale.**{+100, -100} với {+1, -1} sẽ cung cấp chính sách tối ưu tương tự, nhưng độ lớn của Gradient 会 rất khác nhau.`[-1, 1]`

## Sử dụng nó

Trước khi tập hợp vào năm 2026, hãy phân tích từng dòng đường ống RL thành một MDP:

| Situation | State | Action | Reward | γ |
|-----------|-------|--------|--------|---|
| Control（locomotion, manipulation） | Joint angles + velocities | Continuous torques | Task-specific shaped | 0.99 |
| Games（chess, Go, poker） | Board + history | Legal move | Win=+1 / loss=-1 | 1.0（finite） |
| Inventory / pricing | Stock + demand | Order qty | Revenue - cost | 0.95 |
| RLHF for LLMs | Context tokens | Next token | Reward-model score at end | 1.0（episode ~200 tokens） |
| GRPO for reasoning | Prompt + partial response | Next token | Verifier 0/1 at end | 1.0 |

Trong khi viết bất kỳ vòng đào tạo nào, trước tiên viết ra bộ 五元组. Phần lớn các báo cáo lỗi RL không hoạt động, cuối cùng đều có thể được truy cập vào các công thức MDP đã bị hỏng trên giấy.

## Chuyển nó

保存为 `outputs/skill-mdp-modeler.md`- Có thể là:

```markdown
---
name: mdp-modeler
description: 给定一个 task description，在训练前产出 Markov Decision Process spec 并标记 formulation risks。
version: 1.0.0
phase: 9
lesson: 1
tags: [rl, mdp, modeling]
---

给定一个 task（control / game / recommendation / LLM fine-tuning），输出：

1. State。精确的 feature vector 或 tensor spec。解释 Markov property。
2. Action。Discrete set 或 continuous range。Dimensionality。
3. Transition。Deterministic、stochastic-with-known-model，或 sample-only。
4. Reward。Function 与 source。Sparse vs shaped。Terminal vs per-step。
5. Discount。Value 与 horizon justification。

拒绝交付任何 state 为 non-Markovian、且未明确提到 frame-stacking 或 recurrent state 的 MDP。拒绝任何不是根据 target outcome 定义的 reward。标记 infinite-horizon task 上的任何 `γ ≥ 1.0`。标记任何 reward range 超过 typical step reward 100x 的情况，因为这很可能是 gradient-explosion source。
```

## 练习

1. **Easy.**Trong `code/main.py`Trung thực hiện 4×4 GridWorld 和 ngẫu nhiên chính sách triển khai──运行 10,000 个集── báo cáo trả về trung bình 和 std──与最佳回报(-6)
2. **Medium.**đối với chính sách ngẫu nhiên đồng nhất, sử dụng`γ ∈ {0.5, 0.9, 0.99}`运行 `policy_evaluation`  `V`打印为4×4 grid──解释为什么终端 附近状态值会随着变大`γ`Hơn nữa, tăng trưởng nhanh hơn.
3. **Hard.**Để biến GridWorld thành stochastic: mỗi hành động theo tỷ lệ`p = 0.1`滑向相邻方向── tái đánh giá chính sách thống nhất──`V[start]`Sẽ tốt hơn hay xấu hơn?

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| MDP | “Reinforcement Learning setup” | 满足 Markov property 的元组 `(S, A, P, R, γ)`。 |
| State | “Agent 看到的东西” | 在所选 policy class 下，future dynamics 的 sufficient statistic。 |
| Policy | “Agent 的行为” | Conditional distribution `π(a \| s)` 或 deterministic map `s → a`。 |
| Return | “Total reward” | 从当前 step 开始的 discounted sum `Σ γ^t r_t`。 |
| Value | “一个 state 有多好” | 在 `π` 下从 `s` 开始的 expected return。 |
| Q-value | “一个 action 有多好” | 在 `π` 下从 `s` 开始并以第一个 action `a` 开始的 expected return。 |
| Bellman equation | “Dynamic programming recursion” | 把 value / Q 分解为 one-step reward 加 discounted successor value 的 fixed-point。 |
| Discount `γ` | “未来 vs 现在” | 远未来 reward 的 geometric weight；effective horizon 为 `~1/(1-γ)`。 |

## 延伸阅读

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf) 教科书。第3 章介绍 MDPs 和 Bellman equations;第1 章 đưa ra giả thuyết phần thưởng, nó支后续每一课──
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming) Nguồn của phương trình Bellman
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) Từ góc độ sâu RL 写的简洁 MDP primer──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) 关于MDPs和精确解决方法的操作研究 参考书──
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://www.cs.rutgers.edu/~mlittman/papers/thesis-main.pdf) Định nghĩa MDP như là đặc điểm của lập trình động lực.
