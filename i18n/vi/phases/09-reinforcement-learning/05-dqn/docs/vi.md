# Deep Q-Networks (DQN)

> 2013: Mnih trong các pixel nguyên thủy lên đào tạo một mạng học Q, trong bảy Atari  game đánh bại tất cả các đại lý RL cổ điển. 2015: mở rộng đến 49 game, được xuất bản trên Nature, đốt cháy sâu-RL 时代.

**类型：**Xây dựng
**语言：**Python
**前置要求：**Giai đoạn 3 · 03 (Tăng tiến), Giai đoạn 9 · 04 (Q-learning, SARSA)
**时间：**~ 75 phút

## 问题

Tablar Q-learning 需要为每一个 (状态, hành động) đối với单独保存一个 Q-值──一个棋牌 大约有1043 个状态──一 Atari 画面是210×160×3 = 100,800 个功能──Tablar RL 在几千个州 时就会失效,更不用说数十亿个状态──

Điều sau đó, cách sửa chữa rất rõ ràng: sử dụng mạng thần kinh.`Q(s, a; θ)`替换 Q-table──但这种事后显然花了几十年才走到这里──朴素的函数近似与 Q-learning会在致命三三 下发散:函数近似 + bootstrapping + learning off-policy──Mnih et al. (2013, 2015) 找出三个能稳定学习过程的工程技巧:

1. **Experience replay**让 chuyển đổi 去相关。
2. **Target network**结 mục tiêu bootstrap
3. **Reward clipping**归一化 Gradient 幅度。

DQN trên Atari là lần đầu tiên sử dụng đơn cấu trúc và đơn siêu tham số tập hợp, từ các pixel nguyên thủy  giải quyết vài chục vấn đề kiểm soát.

## 概念

![DQN training loop: env, replay buffer, online net, target net, Bellman TD loss](../assets/dqn.svg)

**目标。**DQN trong Neural Q-function 上 tối thiểu hóa mất TD một bước:

`L(θ) = E_{(s,a,r,s')~D} [ (r + γ max_{a'} Q(s', a'; θ^-) - Q(s, a; θ))² ]`

`θ`= mạng trực tuyến, từng bước thông qua Gradient Descent 更新──`θ^-`= mạng mục tiêu, từ `θ`复制(约每10,000步一次)`D`= Buffer lặp lại của quá khứ chuyển đổi.

**三个技巧，按重要性排序：**

**Experience replay。**Một chứa`~10⁶`Buffer vòng chuyển đổi. Mỗi bước tập đều sẽ bình thường theo từng bước, theo từng bộ. Điều này sẽ phá vỡ thời gian liên quan.

**Target network。**Trong Bellman 方程 cả hai bên đều sử dụng cùng một mạng lưới `Q(·; θ)`, sẽ để mục tiêu trong mỗi lần cập nhật di chuyển, đó là theo đuổi chạy尾巴 của mình.`Q(·; θ^-)`, trọng lượng của nó 结──每隔 `C`步,复制 `θ → θ^-`❖ Điều này sẽ giúp mục tiêu hồi phục trong hàng ngàn bước tiến trong giữ ổn định──Tạm dịch mềm `θ^- ← τ θ + (1-τ) θ^-`(được sử dụng cho DDPG, SAC) là biến thể dễ dàng hơn.

**Reward clipping。**Tỷ lệ phần thưởng của Atari từ 1 đến 1000+ 不等.`{-1, 0, +1}`Có thể ngăn chặn một trò chơi duy nhất, chỉ có một số điểm.

**Double DQN。**Hasselt (2016) 修复了最大化偏见: sử dụng mạng trực tuyến 来*选择* hành động, sử dụng mạng mục tiêu 来* đánh giá* nó。

`target = r + γ Q(s', argmax_{a'} Q(s', a'; θ); θ^-)`

Đây là một thay thế, hiệu quả ổn định tốt hơn.

**其他改进（Rainbow, 2017）：**Đánh giá các lỗi (TD)`V(s)`Và lợi thế đầu) ̳thông mạng tiếng ồn ̳đọc khám phá) ̳n-phases return ̳distribution Q (C51/QR-DQN) ̳multi-step bootstrapping── mỗi phần sẽ mang lại vài trăm điểm nâng cao;收益大致可叠加──


```figure
f3-dqn-stability
```

##  xây dựng nó

Cód ở đây là chỉ có stdlib và không có numpy: chúng tôi đang ở trong một GridWorld liên tục rất nhỏ trên sử dụng một MLP lớp ẩn viết tay, do đó mỗi bước đào tạo đều có thể trong microseconds trong vận hành.

### 步骤 1: Buffer play lại

```python
class ReplayBuffer:
    def __init__(self, capacity):
        self.buf = []
        self.capacity = capacity
    def push(self, s, a, r, s_next, done):
        if len(self.buf) == self.capacity:
            self.buf.pop(0)
        self.buf.append((s, a, r, s_next, done))
    def sample(self, batch, rng):
        return rng.sample(self.buf, batch)
```

Atari sử dụng khoảng 50.000 dung lượng; đồ chơi của chúng tôi sử dụng 5.000 là đủ.

### 步骤 2: một mạng Q rất nhỏ (MLP)

```python
class QNet:
    def __init__(self, n_in, n_hidden, n_actions, rng):
        self.W1 = [[rng.gauss(0, 0.3) for _ in range(n_in)] for _ in range(n_hidden)]
        self.b1 = [0.0] * n_hidden
        self.W2 = [[rng.gauss(0, 0.3) for _ in range(n_hidden)] for _ in range(n_actions)]
        self.b2 = [0.0] * n_actions
    def forward(self, x):
        h = [max(0.0, sum(w * xi for w, xi in zip(row, x)) + b) for row, b in zip(self.W1, self.b1)]
        q = [sum(w * hi for w, hi in zip(row, h)) + b for row, b in zip(self.W2, self.b2)]
        return q, h
```

Forward pass: linear → ReLU → linear──这就是整个网──

### 步骤 3: DQN cập nhật

```python
def train_step(online, target, batch, gamma, lr):
    grads = zeros_like(online)
    for s, a, r, s_next, done in batch:
        q, h = online.forward(s)
        if done:
            y = r
        else:
            q_next, _ = target.forward(s_next)
            y = r + gamma * max(q_next)
        td_error = q[a] - y
        accumulate_grads(grads, online, s, h, a, td_error)
    apply_sgd(online, grads, lr / len(batch))
```

hình dạng của nó là bài học 04 trong bài học Q-learning, chỉ có hai điểm khác nhau:`Q(·; θ)`Làm Backpropagation, thay vì bảng chỉ dẫn;`Q(·; θ^-)`

### 步骤 4: vòng ngoài tầng

Đối với mỗi tập, dựa trên`Q(·; θ)`执行 ε-greedy,把 transitions 放 vào buffer,采样 minibatch,执行一次 Gradient step,并周期性同步 `θ^- ← θ`❖ Mô hình như sau:

```python
for episode in range(N):
    s = env.reset()
    while not done:
        a = epsilon_greedy(online, s, epsilon)
        s_next, r, done = env.step(s, a)
        buffer.push(s, a, r, s_next, done)
        if len(buffer) >= batch:
            train_step(online, target, buffer.sample(batch), gamma, lr)
        if steps % sync_every == 0:
            target = copy(online)
        s = s_next
```

Trong chương trình này, chúng tôi sử dụng 16 chiều một-sự nóng của một trạng thái GridWorld, đại lý sẽ trong khoảng 500 tập trong học gần chính sách tối ưu nhất.

## 常见陷

- **Deadly triad。**Phân tích chức năng + ngoại chính sách + bootstrapping 可能发散──DQN Sử dụng target net + replay 缓解这个问题;不要移除任何一个──
- **Exploration。**ε  phải giảm, thường trong giai đoạn 10% trước khi tập luyện từ 1.0  giảm xuống 0.01 ⋅ Nếu khám phá sớm không đủ, Q-net sẽ nhận được đến bể lậu địa phương.
- **Overestimation。**Đối với tiếng ồn `max`会产生上偏差──生产中始终使用双DQN──
- **Reward scale。**剪剪或归归化奖励; Gradient 幅度与奖励大小 成正比──
- **Replay buffer coldstart。**Trong buffer  có vài ngàn chuyển đổi  trước khi không tập luyện  dựa trên khoảng 20 mẫu của các Gradient sớm sẽ được phù hợp 
- **Target sync frequency。**太频繁 ≈ 没有目标网;太不频繁 ≈目标 过时――Atari DQN 使用 10,000 个 env bước――经验规则: 每约1/100 个训练视界 同步一次――
- **Observation preprocessing。**Atari DQN 堆叠 4 ,使状态 满足 Markov──任何包含速度信息的环境都需要框架-stacking或复发状态──

## Sử dụng nó

Đến năm 2026, DQN đã rất ít là hiện đại, nhưng vẫn là thuật toán tham chiếu ngoài chính sách:

| Task | 首选 Method | 为什么不是 DQN？ |
|------|-------------|------------------|
| Discrete-action Atari-like | Rainbow DQN or Muesli | 同一框架，更多技巧。 |
| Continuous control | SAC / TD3 (Phase 9 · 07) | DQN 没有 policy network。 |
| On-policy / high-throughput | PPO (Phase 9 · 08) | 没有 replay buffer；更容易扩展。 |
| Offline RL | CQL / IQL / Decision Transformer | Conservative Q targets，没有 bootstrapping blowups。 |
| Large discrete action spaces (recommender) | DQN with action embedding, or IMPALA | 可以；细节装饰很重要。 |
| LLM RL | PPO / GRPO | Sequence-level，而不是 step-level；Loss 不同。 |

Những kinh nghiệm này vẫn còn phổ biến. Các mạng lưới mục tiêu và bản sao của SAC, TD3, DDPG, SAC-X, AlphaZero hiện đang xuất hiện, cũng như trong mỗi phương pháp RL ngoại tuyến.

## 交付 nó

保存为 `outputs/skill-dqn-trainer.md`- Có thể là:

```markdown
---
name: dqn-trainer
description: 为 discrete-action RL task 生成 DQN training config（buffer、target sync、ε schedule、reward clipping）。
version: 1.0.0
phase: 9
lesson: 5
tags: [rl, dqn, deep-rl]
---

给定一个 discrete-action environment（observation shape、action count、horizon、reward scale），输出：

1. Network。Architecture（MLP / CNN / Transformer）、feature dim、depth。
2. Replay buffer。Capacity、minibatch size、warmup size。
3. Target network。Sync strategy（hard every C steps 或 soft τ）。
4. Exploration。ε start / end / schedule length。
5. Loss。Huber vs MSE、gradient clip value、reward clipping rule。
6. Double DQN。默认启用，除非有明确理由禁用。

拒绝交付没有 target network、没有 replay buffer，或 ε 固定为 1 的 DQN。拒绝 continuous-action tasks（路由到 SAC / TD3）。标记任何 reward range > 10× per-step mean 的情况，说明需要 clipping 或 scale normalization。
```

## 练习

1. **Easy。**运行 `code/main.py`◊ vẽ đường cong trả lại mỗi tập.
2. **Medium。**禁用目标网络(在贝尔曼目标 两侧都使用网) 测量训练不稳定性:回报 会震荡还是发散?
3. **Hard。**添加 Double DQN: sử dụng mạng trực tuyến 选择 `argmax a'`, sử dụng target net  đánh giá ⋅ So sánh GridWorld 上训练 1,000 个集 后, sử dụng và không sử dụng Double DQN 时`Q(s_0, best_a)`相对真相 `V*(s_0)`của sự thiên vị.

## 关键术语
| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| DQN | “Deep Q-learning” | 带有 Neural Q-function、replay buffer 和 target network 的 Q-learning。 |
| Experience replay | “Shuffled transitions” | 每个 Gradient step 都均匀采样的 ring buffer；让数据去相关。 |
| Target network | “Frozen bootstrap” | 用于 Bellman target 的 Q 的周期性副本；稳定训练。 |
| Deadly triad | “为什么 RL 会发散” | Function approximation + bootstrapping + off-policy = 没有收敛保证。 |
| Double DQN | “修复 maximization bias” | Online net 选择 action，target net 评估它。 |
| Dueling DQN | “V and A heads” | 分解 Q = V + A - mean(A)；输出相同，Gradient flow 更好。 |
| Rainbow | “所有技巧” | DDQN + PER + dueling + n-step + noisy + distributional 合在一起。 |
| PER | “Prioritized Replay” | 按 TD-error magnitude 成比例采样 transitions。 |

## 延伸阅读

- [Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602)  mở bài viết hội thảo NeurIPS năm 2013 của RL sâu 
- [Mnih et al. (2015). Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236) Nature 论文,49 game DQN。
- [Hasselt, Guez, Silver (2016). Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) DDQN。
- [Wang et al. (2016). Dueling Network Architectures](https://arxiv.org/abs/1511.06581) Đấu đấu DQN。
- [Hessel et al. (2018). Rainbow: Combining Improvements in Deep RL](https://arxiv.org/abs/1710.02298) 叠加技巧的论文──
- [OpenAI Spinning Up — DQN](https://spinningup.openai.com/en/latest/algorithms/dqn.html) 清晰的现代讲解──
- [Sutton & Barto (2018). Ch. 9 — On-policy Prediction with Approximation](http://incompleteideas.net/book/RLbook2020.pdf) 教科书中对 致命三三 (函数近似+ bootstrapping+off-policy) 的处理;DQN's target network 和重播缓冲 正是为服服它而设计的──
- [CleanRL DQN implementation](https://docs.cleanrl.dev/rl-algorithms/dqn/) Sử dụng để tham khảo các nghiên cứu về phân hủy DQN đơn tập tin; phù hợp với phiên bản đầu tiên của bài học này
