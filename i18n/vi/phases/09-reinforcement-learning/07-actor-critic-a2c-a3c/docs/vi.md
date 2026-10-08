# Đạo diễn-Tác giả  A2C và A3C

> Đăng cường  rất ồn ào.`V̂(s)`Từ khi phê phán, từ khi trả lại trong giảm nó, bạn nhận được một kỳ vọng tương tự nhưng sự khác biệt  lợi thế thấp hơn nhiều. Đây là người diễn viên- phê phán.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 分钟

## 问题

Vanilla REINFORCE 能工作, nhưng sự khác biệt của nó 很糟糕. Monte Carlo trở lại.`G_t`Trong các tập khác nhau có thể có sự dao động gấp 10 lần.`∇ log π`Một lần nữa, sẽ tạo ra một ước tính Gradient, cần hàng ngàn tập để thúc đẩy chính sách với nhiều cập nhật DQN ít hơn để đạt được khoảng cách.

sự khác biệt từ việc sử dụng lợi nhuận thô. Nếu bạn giảm một đường cơ sở.`b(s_t)`: bất kỳ chức năng của trạng thái, bao gồm giá trị học, kỳ vọng 保持不变,而变化 会下降──最好的可处理的基线是`V̂(s_t)`     `∇ log π`Số lượng là:

`A(s, a) = G - V̂(s)`

Nếu một hành động  tạo ra lợi nhuận cao hơn trung bình, nó là tốt; nếu thấp hơn trung bình, là差的;;带学会批评的 REINFORCE就是 *演员批评*;;批评给演员一个低差异的老师;;这是2015年后的每一个深度政策方法;;A2C、A3C、PPO、SAC、IMPALA);;

## 概念

![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**两个 networks，一个 shared loss：**

- **Actor** `π_θ(a | s)`: chính sách. mẫu. Nó để hành động.
- **Critic** `V_φ(s)`: ước tính về lợi nhuận dự kiến từ nhà nước xuất phát.`(V_φ(s) - target)²`训练――

**Advantage。**两种标准形式:

- *Lợi thế MC:* `A_t = G_t - V_φ(s_t)`Không thiên vị, sự khác biệt, cao hơn.
- *Lợi thế TD:* `A_t = r_{t+1} + γ V_φ(s_{t+1}) - V_φ(s_t)`△ phân biệt đối xử`V_φ`),variance 低得多──也叫 *TD residual* `δ_t`

**n-step advantage。**Trong hai giá trị:

`A_t^{(n)} = r_{t+1} + γ r_{t+2} + … + γ^{n-1} r_{t+n} + γ^n V_φ(s_{t+n}) - V_φ(s_t)`

`n = 1`Đó là TD tinh khiết.`n = ∞`Đó là MC. Hầu hết các ứng dụng được sử dụng trên Atari.`n = 5`, trong MuJoCo' s PPO 上 sử dụng `n = 2048`

**Generalized Advantage Estimation (GAE)。**Schulman et al. (2016)  đề xuất đối với tất cả các lợi thế n- bước làm trung bình cân bằng theo tỷ lệ:

`A_t^{GAE} = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}`

Trong số đó `λ ∈ [0, 1]``λ = 0`是 TD(sự biến đổi thấp, thiên vị cao)。`λ = 1`是 MC(sự khác biệt cao, không thiên vị)`λ = 0.95`là 2026 năm mặc định: tiếp tục điều chỉnh, cho đến khi định vị / biến số dial đến vị trí bạn muốn.

**A2C：synchronous advantage actor-critic。**Trong `N`个 môi trường song song 上收集 `T`bước──为每一步 计算优点──在组合批上更新演员 和评论──重复──这是 A3C 更简单、更可扩展的兄弟姐妹──

**A3C：asynchronous advantage actor-critic。**Mnih et al. (2016)。 khởi động `N`个 worker threads, mỗi thread 运行一个 env──每个 worker 在自己的推出上本地计算梯度,然后异步应用到共享参数服务器──不需要重播缓冲:workers 通过运行不同轨迹来去解调──A3C 证明你可以在CPU上规模培训──到2026年,GPU-based A2C(batched parallel envs) chiếm chủ quyền,因为 GPUs 需要大批量──

**Combined loss。**

`L(θ, φ) = -E[ A_t · log π_θ(a_t | s_t) ]  +  c_v · E[(V_φ(s_t) - G_t)²]  -  c_e · E[H(π_θ(·|s_t))]`

三项:người mất chính sách-đường độ, sự lùi giá trị, thưởng entropy.`c_v ~ 0.5``c_e ~ 0.01`Đó là những điểm khởi đầu của các giáo lý.


```figure
actor-critic
```

## Hãy xây dựng nó

### Bước 1: một nhà phê bình

Nhận xét tuyến tính`V_φ(s) = w · features(s)`Sử dụng MSE 更新:

```python
def critic_update(w, x, target, lr):
    v_hat = dot(w, x)
    err = target - v_hat
    for j in range(len(w)):
        w[j] += lr * err * x[j]
    return v_hat
```

Trong bảng xếp hạng, các nhà phê bình 会在几百个节目内收──在 Atari 上,把线性评论 替换为共享 CNN trunk + giá trị đầu──

### Bước 2: lợi thế n- bước

给定长度为 `T`Việc triển khai và khởi động cuối cùng `V(s_T)`- Có thể là:

```python
def compute_advantages(rewards, values, gamma=0.99, lam=0.95, last_value=0.0):
    advantages = [0.0] * len(rewards)
    gae = 0.0
    for t in reversed(range(len(rewards))):
        next_v = values[t + 1] if t + 1 < len(values) else last_value
        delta = rewards[t] + gamma * next_v - values[t]
        gae = delta + gamma * lam * gae
        advantages[t] = gae
    returns = [a + v for a, v in zip(advantages, values)]
    return advantages, returns
```

`returns`Đó là mục tiêu quan trọng.`advantages`là乘以`∇ log π`Nội dung của nó.

### Bước 3: cập nhật kết hợp

```python
for step_i, (x, a, _r, probs) in enumerate(traj):
    adv = advantages[step_i]
    target_v = returns[step_i]

    # critic
    critic_update(w, x, target_v, lr_v)

    # actor
    for i in range(N_ACTIONS):
        grad_logpi = (1.0 if i == a else 0.0) - probs[i]
        for j in range(N_FEAT):
            theta[i][j] += lr_a * adv * grad_logpi * x[j]
```

Chính sách, mỗi lần cập nhật, một sự ra mắt, diễn viên và nhà phê bình sử dụng tỷ lệ học tập chia sẻ.

### Bước 4: Phối tương đồng (A3C vs A2C)

- **A3C：** khởi động `N`个线程── mỗi线程 运行自己的env 和自己的前进通行──周期性地把 Gradient updates 推送到共享主──master 上不加锁:races 没关系,它们只是增加噪声──
- **A2C：**Trong một quá trình trong hoạt động`N`个 env trường hợp,把 quan sát xếp chồng 成 `[N, obs_dim]`batch,执行 batched forward pass、batched backward pass──GPU sử dụng 更高,deterministic,更容易推理──2026 年的默认选择──

Mã đồ chơi của chúng tôi để giữ rõ ràng một sợi; biến thành A2C đúc chỉ cần ba dòng numpy.

## Những bẫy

- **Critic bias before actor gradient。**Nếu chỉ trích là ngẫu nhiên, cơ sở của nó là không có lượng thông tin, và bạn đang trong tiếng ồn thuần túy trên đào tạo. Trước tiên làm ấm chỉ trích.
- **Advantage normalization。**Trong mỗi lô, các lợi thế trong đó bình thường hóa đến mức trung bình không/đơn vị không có chi phí, nhưng có thể tập luyện ổn định đáng kể.
- **Shared trunk。**Đối với các đầu vào hình ảnh, đối với diễn viên và nhà phê bình sử dụng bộ trích dẫn tính năng chia sẻ.
- **On-policy contract。**A2C cho dữ liệu chính xác lặp lại một lần cập nhật.
- **Entropy collapse。**Không có gì`c_e > 0`Khi, chính sách sẽ được cập nhật hàng trăm lần trong trở nên gần như quyết định và ngừng khám phá.
- **Reward scale。**Tăng cường lợi thế phụ thuộc vào quy mô phần thưởng.

## Sử dụng nó

A2C/A3C trong năm 2026 ít khi là lựa chọn cuối cùng, nhưng chúng là cơ sở của tất cả các tinh chỉnh cấu trúc tiếp theo:

| Method | Relation to A2C |
|--------|----------------|
| PPO | A2C + clipped importance ratio for multi-epoch updates |
| IMPALA | A3C + V-trace off-policy correction |
| SAC (Phase 9 · 07) | Off-policy A2C with a soft-value critic (next lesson) |
| GRPO (Phase 9 · 12) | A2C without the critic — group-relative advantage |
| DPO | A2C collapsed into a preference-ranking loss, no sampling |
| AlphaStar / OpenAI Five | A2C with league training + imitation pre-training |

Nếu trong tờ báo năm 2026 thấy lợi thế, hãy nghĩ đến một nhà phê bình diễn viên.

## Chuyển nó

保存为 `outputs/skill-actor-critic-trainer.md`- Có thể là:

```markdown
---
name: actor-critic-trainer
description: 为给定 environment 生成 A2C / A3C / GAE configuration，并指定 advantage estimation 和 loss weights。
version: 1.0.0
phase: 9
lesson: 7
tags: [rl, actor-critic, gae]
---

给定一个 environment 和 compute budget，输出：

1. Parallelism。A2C（GPU batched）vs A3C（CPU async）以及 workers 数量。
2. Rollout length T。每个 env 每次 update 的 steps。
3. Advantage estimator。n-step 或 GAE(λ)；指定 λ。
4. Loss weights。`c_v`（value）、`c_e`（entropy）、gradient clip。
5. Learning rates。Actor 和 critic（如果使用则分开）。

拒绝在 horizon > 1000 的 environments 上使用 single-worker A2C（太 on-policy，太慢）。拒绝在没有 advantage normalization 的情况下交付。把任何 `c_e = 0` 且 observed entropy < 0.1 的 run 标记为 entropy-collapsed。
```

## Các bài tập

1. **Easy。**Trong 4×4 GridWorld 上 sử dụng MC lợi thế(`G_t - V(s_t)`(Train actor-critic──与 Lesson 06 中 REINFORCE-with-running-median-baseline)
2. **Medium。**切换到 TD-hữu ích dư thừa`r + γ V(s') - V(s)`(■) đo lường lợi thế của các lô.
3. **Hard。**实现 GAE(λ)。扫描 `λ ∈ {0, 0.5, 0.9, 0.95, 1.0}`◊ vẽ kết quả hoàn lại so với hiệu quả mẫu.

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Actor | “Policy net” | `π_θ(a\|s)`，由 policy gradient 更新。 |
| Critic | “Value net” | `V_φ(s)`，通过对 returns / TD targets 做 MSE regression 更新。 |
| Advantage | “比平均好多少” | `A(s, a) = Q(s, a) - V(s)` 或它的 estimators。`∇ log π` 的 multiplier。 |
| TD residual | “δ” | `δ_t = r + γ V(s') - V(s)`；one-step advantage estimate。 |
| GAE | “插值旋钮” | n-step advantages 的 exponentially weighted sum，由 `λ` parameterized。 |
| A2C | “Synchronous actor-critic” | 跨 envs batching；每个 rollout 做一次 Gradient step。 |
| A3C | “Async actor-critic” | Worker threads 把 gradients 推送到 shared param server。Original paper；2026 年较少见。 |
| Bootstrap | “在 horizon 使用 V” | 截断 rollout，添加 `γ^n V(s_{t+n})` 来闭合求和。 |

## Đọc thêm

- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783)A3C, bài báo phê bình diễn viên-nhân tích không đồng bộ ban đầu
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) GAE。
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf) nền tảng; khi phê bình là Mạng thần kinh 时,把它和 Ch. 9 của chức năng gần gũi 配套阅读。
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561) có thể mở rộng phân phối các nhà phê bình diễn viên với sự sửa đổi ngoài chính sách theo dấu vết V。
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/) 值得读的生产 A2C/PPO thực hiện¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms)Kết quả hội tụ cơ bản của phân hủy nhà diễn viên-chính trị hai lần.
