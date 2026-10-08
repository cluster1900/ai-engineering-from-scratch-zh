# RL đa tác nhân

> Một đại lý RL  giả định môi trường là tĩnh của  Đưa hai đại lý đang học tập  vào cùng một thế giới, giả định này sẽ không hiệu quả: mỗi đại lý đều là một phần của môi trường của một đại lý khác  và cả hai đều đang thay đổi  Nhiều đại lý RL là một nhóm để học trong giả định Markov không tái tạo vẫn có thể nhận được các kỹ thuật 

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (Q-learning), Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~45 minutes

## 问题

Một robot học lái trong phòng, là một đại lý RL 问题── một đội bóng đá không.── AlphaStar đối đầu với StarCraft đối đầu không.── một thị trường được tạo thành từ các đại lý đấu thầu không.── hai xe đàm phán qua đường dừng xe bốn chiều cũng không.── nhiều đối với nhiều vấn đề thực tế đều không.──

Trong mỗi thiết lập đa đại lý, từ góc độ của bất kỳ đại lý nào, các đại lý khác * là * một phần của môi trường.

Điều này sẽ phá hủy các bằng chứng hội tụ bảng xếp hạng (Q-learning's assurance hypothèse environment is stationary of)  Nó cũng sẽ phá hủy những cơ sở RL sâu sắc ngây thơ: các đại lý 会在循环中追逐彼此,永远无法获得稳定政策──你需要多代理专用技术:集中训练 / phân cấp thực hiện、反事实基线、联赛比赛、自动玩──

Các ứng dụng trong năm 2026 bao gồm: robot swarms, giao thông định tuyến, hạm đội xe tự trị, mô phỏng thị trường, hệ thống LLM đa đại lý (Phase 16), cũng như bất kỳ trò chơi nào có nhiều người chơi thông minh.

## 概念

![Four MARL regimes: indep, centralized critic, self-play, league](../assets/marl.svg)

**Formalism: Markov Game.**MDP 的泛化: tiểu bang`S`、 hành động chung `a = (a_1, …, a_n)`、trang chuyển `P(s' | s, a)`, cũng như phần thưởng của mỗi đại lý `R_i(s, a, s')` Mỗi đại lý `i`Trong chính sách của riêng mình `π_i`Nên tối đa hóa lợi nhuận của mình. Nếu phần thưởng là hoàn toàn giống nhau, thì nó là**fully cooperative**Nếu là số không, nó là**adversarial**Nếu trộn, thì là**general-sum**

**核心挑战：**

- **Non-stationarity.**Từ đại lý `i`Trong một góc nhìn,`P(s' | s, a_i)`取决于`π_{-i}`Nhưng nó đang thay đổi.
- **Credit assignment.**Trong phần thưởng chia sẻ, là đại lý nào đã dẫn đến nó?
- **Exploration coordination.**Các đại lý phải tìm kiếm các chiến lược bổ sung lẫn nhau, chứ không phải tìm kiếm lại cùng một quốc gia.
- **Scalability.**Không gian hành động chung 会随 `n`Chỉ số tăng trưởng:
- **Partial observability.**Mỗi nhân viên chỉ có thể nhìn thấy quan sát của mình; tình trạng toàn cầu là ẩn.

**四种主导范式：**

**1. Independent Q-learning / independent PPO (IQL, IPPO).**Mỗi đại lý học hỏi chính sách của mình, đưa các đại lý khác như một phần của môi trường.

**2. Centralized training, decentralized execution (CTDE).**Mọi đại lý đều có chính sách riêng của họ.`π_i`, nó được quan sát tại địa phương .`o_i`Đối với điều kiện triển khai, đó là tiêu chuẩn của việc thực hiện phi tập trung.`Q(s, a_1, …, a_n)`以完整的全球状态和联合行动为条件. Ví dụ:
- **MADDPG**(Lowe et al. 2017): 带有每个代理 一个集中批评的 DDPG──
- **COMA**(Foerster et al. 2017): cơ sở phản thực tế 问 Nếu tôi đã thực hiện hành động `a'`, phần thưởng của tôi sẽ là bao nhiêu?
- **MAPPO**- **IPPO**với nhà phê bình chung (Yu et al. 2022): 带有集中价值函数的 PPO──2026年合作社 MARL 中的主导方法──
- **QMIX**(Rashid et al. 2018): phân hủy giá trị`Q_tot(s, a) = f(Q_1(s, a_1), …, Q_n(s, a_n))`,并 sử dụng trộn đơn giản.

**3. Self-play.**Cùng một đại lý hai bản sao của nhau đối đầu chiến đấu. Chính sách đối đầu. Chính sách trong một bức ảnh. Chính sách AlphaGo / AlphaZero / MuZero.

**4. League play.**tự chơi hướng tới môi trường chung/ngược đối: giữ một nhóm các chính sách quá khứ và hiện tại, từ đối thủ trong giải đấu,并 nhắm vào chúng để đào tạo.

**Communication.**允许 các đại lý  gửi tin nhắn học hỏi cho nhau `m_i`Trong các thiết lập hợp tác, Foerster et al. (2016) cho thấy, giao tiếp giữa các đại lý có thể phân biệt được có thể được đào tạo từ đầu đến cuối.


```figure
f3-marl-orbit
```

##  xây dựng nó

Bài học này sử dụng một 6×6 GridWorld, bao gồm hai đại lý hợp tác. Chúng bắt đầu từ góc độ tương đối, phải đạt đến một mục tiêu chung.`-1`; 两者都到达时 `+10`参见 `code/main.py`

### 步骤 1: đa đại lý

```python
class CoopGridWorld:
    def __init__(self):
        self.size = 6
        self.goal = (5, 5)

    def reset(self):
        return ((0, 0), (5, 0))  # 两个 agents

    def step(self, state, actions):
        a1, a2 = state
        new1 = move(a1, actions[0])
        new2 = move(a2, actions[1])
        done = (new1 == self.goal) and (new2 == self.goal)
        reward = 10.0 if done else -1.0
        return (new1, new2), reward, done
```

* Joint* không gian hành động là `|A|² = 16`❖ Tình trạng toàn cầu là hai vị trí.

### 步骤 2: Học Q độc lập

Mỗi đại lý 运行 riêng của mình bảng Q,以 chung trạng thái 作为关键.

```python
def independent_q(env, episodes, alpha, gamma, epsilon):
    Q1, Q2 = defaultdict(default_q), defaultdict(default_q)
    for _ in range(episodes):
        s = env.reset()
        while not done:
            a1 = epsilon_greedy(Q1, s, epsilon)
            a2 = epsilon_greedy(Q2, s, epsilon)
            s_next, r, done = env.step(s, (a1, a2))
            target1 = r + gamma * max(Q1[s_next].values())
            target2 = r + gamma * max(Q2[s_next].values())
            Q1[s][a1] += alpha * (target1 - Q1[s][a1])
            Q2[s][a2] += alpha * (target2 - Q2[s][a2])
            s = s_next
```

Nó hiệu quả trong nhiệm vụ này, vì phần thưởng 密集 và đối với nhau. Trong các nhiệm vụ gắn liền, một đại lý phải chờ đợi nhiệm vụ của một đại lý khác.

### 步骤 3: tập trung Q với phân hủy-đáng giá cập nhật

Đối với các hành động chung sử dụng một Q:`Q(s, a_1, a_2)` Sử dụng phần thưởng chia sẻ 更新──执行时通过边缘化 来分散化:`π_i(s) = argmax_{a_i} max_{a_{-i}} Q(s, a_1, a_2)`Nó sử dụng không gian hành động chung của chỉ số cấp để thay đổi một quan điểm toàn cầu đúng đắn.

### 步骤 4: 简单 tự chơi

Cùng với một đại lý, hai vai trò. Đại lý huấn luyện A đối với đại lý B.`K`个集,把 A's weights 复制到 B。对称训练,进展一致── AlphaZero recipe 的缩写版──

## 常见陷

- **Non-stationary replay.**Sử dụng các đại lý độc lập 时,Xe nghiệm tái chơi hơn một đại lý hơn, bởi vì những chuyển đổi cũ là bởi những đối thủ đã qua thời gian.
- **Credit assignment ambiguity.**长 episode 后 nhận được phần thưởng chia sẻ; không có cách rõ ràng để chỉ ra tác nhân nào đã đóng góp.
- **Policy drift / chasing.**Phản ứng tốt nhất của mỗi đại lý sẽ thay đổi theo sự cập nhật của đại lý khác.
- **Reward hacking via coordination.**Các đại lý 找到了设计者没有预期到的协调 exploits── đấu giá đại lý 会收到报价零──修复:谨慎的奖励设计、行为限制──
- **Exploration redundancy.**两个代理 探索相同的状态行动对──修复: Mỗi đại diện sử dụng tiền thưởng entropy, hoặc điều kiện vai trò──
- **League cycles.**纯自动玩可能卡在统治周期 中──修复:使用包含多样对手的联赛比赛──
- **Sample explosion.** `n`个 đại lý × không gian trạng thái × hành động chung。用 hàm gần gũi 近似; sử dụng không gian hành động nhân tố(mỗi đại lý một đầu sản xuất chính sách)。

## Sử dụng nó

2026 年 MARL 应用图谱:

| Domain | Method | Notes |
|--------|--------|-------|
| Cooperative navigation / manipulation | MAPPO / QMIX | CTDE；shared critic + decentralized actors。 |
| Two-player games (chess, Go, poker) | Self-play with MCTS (AlphaZero) | Zero-sum；对称训练。 |
| Complex multiplayer (Dota, StarCraft) | League play + imitation pretraining | OpenAI Five, AlphaStar。 |
| Autonomous-vehicle fleets | CTDE MAPPO / PPO with attention | Partial obs；可变 team sizes。 |
| Auction markets | Game-theoretic equilibrium + RL | 当 `n` → ∞ 时使用 mean-field RL。 |
| LLM multi-agent systems (Phase 16) | Natural-language comm + role conditioning | RL loop 位于 agent-planning layer。 |

Trong năm 2026, lĩnh vực tăng trưởng lớn nhất của MARL là dựa trên hệ thống LLM: do các đại lý mô hình ngôn ngữ thành lập nhóm thảo luận, tranh luận, xây dựng phần mềm.

## 交付 nó

保存为 `outputs/skill-marl-architect.md`- Có thể là:

```markdown
---
name: marl-architect
description: 为给定任务选择正确的 multi-agent RL regime（IPPO, CTDE, self-play, league）。
version: 1.0.0
phase: 9
lesson: 10
tags: [rl, multi-agent, marl, self-play]
---

给定一个包含 `n` 个 agents 的任务，输出：

1. Regime classification。Cooperative / adversarial / general-sum。说明理由。
2. Algorithm。IPPO / MAPPO / QMIX / self-play / league。理由要关联 coupling tightness 和 reward structure。
3. Information access。Centralized training（哪些 global info 会进入 critic）？Decentralized execution？
4. Credit assignment。Counterfactual baseline、value decomposition，或 reward shaping。
5. Exploration plan。Per-agent entropy、population-based training，或 league。

在 tightly-coupled cooperative tasks 上拒绝 independent Q-learning。拒绝为存在 cycle risks 的 general-sum 推荐 self-play。标记任何没有 fixed-opponent eval 的 MARL pipeline（cherry-picked self-play numbers 很常见）。
```

## 练习

1. **Easy.**Trong hợp tác cộng tác 2 đại lý GridWorld 上训练 độc lập Q-learning── cần bao nhiêu tập phim 才能让 mean return > 0? vẽ đường cong học tập chung──
2. **Medium.**Thêm một nhiệm vụ phối hợp: Chỉ khi hai đại lý cùng vòng bước vào mục tiêu, mới đạt được mục tiêu.
3. **Hard.**实现 một nhà phê bình tập trung được sử dụng cho đào tạo theo phong cách MAPPO, và phối hợp nhiệm vụ trên so với tốc độ hội tụ PPO độc lập

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Markov game | "Multi-agent MDP" | `(S, A_1, …, A_n, P, R_1, …, R_n)`；每个 agent 都有自己的 reward。 |
| CTDE | "Centralized training, decentralized execution" | Training time 使用 joint critic；每个 agent 的 policy 只使用 local obs。 |
| IPPO | "Independent PPO" | 每个 agent 单独运行 PPO。简单 baseline；经常被低估。 |
| MAPPO | "Multi-agent PPO" | 带有以 global state 为条件的 centralized value function 的 PPO。 |
| QMIX | "Monotonic value decomposition" | `Q_tot = f_monotone(Q_1, …, Q_n)` 允许 decentralized argmax。 |
| COMA | "Counterfactual multi-agent" | Advantage = 我的 Q 减去对我的 action 做 marginalizing 后的 expected Q。 |
| Self-play | "Agent vs past self" | 单个 agent，两个 roles；zero-sum games 的标准方法。 |
| League play | "Population training" | 缓存过去的 policies，从 pool 中采样 opponents；处理 strategy cycles。 |

## 延伸阅读

- [Lowe et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments (MADDPG)](https://arxiv.org/abs/1706.02275) 带 tập trung phê bình của CTDE。
- [Foerster et al. (2017). Counterfactual Multi-Agent Policy Gradients (COMA)](https://arxiv.org/abs/1705.08926) Sử dụng các cơ sở đối thực về việc phân bổ tín dụng.
- [Rashid et al. (2018). QMIX: Monotonic Value Function Factorisation](https://arxiv.org/abs/1803.11485) 带 monotonicity của giá trị phân hủy.
- [Yu et al. (2022). The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games (MAPPO)](https://arxiv.org/abs/2103.01955) PPO đối với MARL xuất hiện của người dự định
- [Vinyals et al. (2019). Grandmaster level in StarCraft II using multi-agent reinforcement learning (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z) Lì bài lớn.
- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270) trò chơi số không trung trong tự chơi hoàn toàn.
- [Sutton & Barto (2018). Ch. 15 — Neuroscience & Ch. 17 — Frontiers](http://incompleteideas.net/book/RLbook2020.pdf) 包含教材 đối với cài đặt đa đại lý và xử lý đơn giản của vấn đề không tĩnh, trong khi CTDE đang được thiết kế để giải quyết vấn đề này.
- [Zhang, Yang & Başar (2021). Multi-Agent Reinforcement Learning: A Selective Overview](https://arxiv.org/abs/1911.10635) 覆盖合作, cạnh tranh và MARL hỗn hợp và kết quả hội tụ tổng quát
