# 面向游戏的RL  AlphaZero、MuZero với LLM Lý luận 时代

> 1992:TD-Gammon dùng TD tinh khiết trong backgammon 中击败人类冠军──2016:AlphaGo 击败 Lee Sedol──2017:AlphaZero từ零开始统治棋牌、shogi 和 Go──2024:DeepSeek-R1 证明了同一套配方在推理上也有效,只是使用GRPO 替代PPO──游戏是推动本阶段的每次突破的基准──

**类型：**Xây dựng
**语言：**Python
**先修要求：**Giai đoạn 9 · 05 (DQN) Giai đoạn 9 · 08 (PPO) Giai đoạn 9 · 09 (RLHF) Giai đoạn 9 · 10 (MARL)
**时间：**约120分钟

## 问题

游戏具备 RL 想要的一切──清晰的回报(胜/负)──无限集★自动玩可以重置)──完美模拟版★游戏本身就是模拟器 (★离散或小规模连续行动空间──迫使对抗鲁棒性的多代理结构──

Và trò chơi chính là mỗi lần lớn RL 突破的测试场──TD-Gammon(backgammon,1992)──Atari-DQN(2013)──AlphaGo(2016)──AlphaZero(2017)──OpenAI Five(Dota 2,2019)──AlphaStar(StarCraft II,2019)──MuZero(được học hỏi (2019)──AlphaTensor(matrix multiplication,2022)──AlphaDev(sorting algorithms,2023)──DeepSeek-R1(math reasoning,2025)

Ngôi sao này sẽ đi qua một quan điểm thống nhất.**self-play + search + policy improvement**Mỗi loại là một sự phổ biến của một loại trước đó; đặc biệt là GRPO, nó áp dụng sự kết hợp của AlphaZero vào lý luận LLM, trong đó token là hành động, chứng minh toán học là tín hiệu chiến thắng.

## 概念

![AlphaZero ↔ MuZero ↔ GRPO：相同循环，不同环境](../assets/rl-games.svg)

**统一循环。**

```
while True:
    trajectory = self_play(current_policy, search)     # 和自己对局
    policy_target = search.improved_policy(trajectory) # search 改进原始 policy
    policy_net.update(policy_target, value_target)     # 在 search 输出上做 supervised 训练
```

**AlphaZero (2017)。**Silver et al. 给定一个规则已知的游戏(chess、shogi、Go):

- Mạng lưới giá trị chính sách:一个塔 `f_θ(s) → (p, v)``p`Là một chuyển động hợp pháp trên trên.`v`                                                                                                                                                                                                                                                              
- Monte Carlo Tree Search (MCTS): trong mỗi bước,展开可能后续状态的树──使用 `(p, v)`作为前 + bootstrap──用 UCB (PUCT) 选择节点:`a* = argmax Q(s, a) + c · p(a|s) · √N(s) / (1 + N(s, a))`
- Đánh thủ: Hãy để nhân viên chống lại nhân viên đối mặt với trận đấu.`t`步, MCTS phân phối chuyến thăm `π_t`成为政策 训练目标──
- Lối mất:`L = (v - z)² - π · log p + c · ||θ||²``z`là kết quả trò chơi ((+1 / 0 / -1)。

零人类知识――零手工 heuristic―― một bộ phận đơn lẻ, sau khi tự chơi hàng triệu trò chơi của riêng mình  nắm bắt cờ vua、shogi 和 Go。

**MuZero (2019)。**Schrittwieser et al. 移除了规则已知的要求──

- Không sử dụng môi trường cố định, mà học một mô hình động lực tiềm ẩn`(h, g, f)`- Có thể là:
  - `h(s)`:将 quan sát 编码为 tiềm ẩn.
  - `g(s_latent, a)`:预测下一个潜伏状态 + phần thưởng。
  - `f(s_latent)`:预测 chính sách trước + giá trị。
- MCTS trong *đường học tiềm ẩn* 中运行── cùng tìm kiếm, cùng vòng tập luyện──
- 适用于 Go、chess、shogi *以及* Atari  一个算法,不需要规则知识──

**Stochastic MuZero (2022)。**加入 stochastic dynamics 和 chance nodes; mở rộng đến backgammon 这类游戏──

**Muesli、Gumbel MuZero (2022-2024)。**Trong hiệu quả mẫu và tìm kiếm xác định

**GRPO (2024-2025)。**DeepSeek-R1 配方── cùng AlphaZero 形状循环, áp dụng cho lý luận mô hình ngôn ngữ:

- 游戏: trả lời vấn đề toán học / lập trình / lý luận.
- Chính sách:LLM。Cách hành:Token。State:prompt + response-so far。
- Không có lời chỉ trích.`G`个 hoàn thành. 计算每个完成的奖励. 使用.**group-relative advantage** `A_i = (r_i - mean_r) / std_r`作为 REINFORCE 风格更新的信号──
- Đối với chính sách tham chiếu cộng với hình phạt KL 以防漂移(类似 RLHF)
- 完整 Loss:

  `L_GRPO(θ) = -E_{q, {o_i}} [ (1/G) Σ_i A_i · log π_θ(o_i | q) ] + β · KL(π_θ || π_ref)`

Không mô hình phần thưởng, không chỉ trích, không có MCTS── cơ sở tương quan nhóm 替代了三者── trên điểm chuẩn luận, sử dụng ít hơn tính toán  đạt hoặc vượt quá PPO-RLHF 质量──

**完整的 R1 配方。**DeepSeek-R1 ((DeepSeek 2025) là một trong hai mô hình trong bài luận:

- **R1-Zero。**Từ DeepSeek-V3 mô hình cơ bản 开始──没有 SFT──直接应用 GRPO, sử dụng hai thành phần phần thưởng:*truyền chính xác*( dựa trên quy tắc  最终答案是否能解析成正确数字 / 代码是否通过单元测试) 和 *format reward*(完成 是否把链思 包在`<think>…</think>`标签内) ・经过数千步后, chiều dài phản ứng trung bình từ khoảng 100  tăng lên khoảng 10.000 token, điểm chuẩn toán học 分数上升到接近 o1 xem trước 水平。 mô hình từ零开始学会推理──缺点: chuỗi suy nghĩ của nó 往往难以阅读、混用语言,并且缺少风格打磨──
- **R1。**Sử dụng ống dẫn bốn giai đoạn  sửa chữa R1-Zero của vấn đề khả năng đọc:
  1. **Cold-start SFT。**收集数千条格式清晰的长Cot示范――对基模型做监督-finetune――这提供了一个可读的起点――
  2. **Reasoning-oriented GRPO。**Sử dụng giá trị chính xác + định dạng,并加入 *language-consistency* reward để ngăn chặn chuyển đổi mã。
  3. **Rejection sampling + SFT 第 2 轮。**Từ RL checkpoint 采样约600K 条 suy luận quỹ đạo, chỉ giữ lại câu trả lời cuối cùng đúng và có thể đọc được,并与约200K 条非 suy luận SFT ví dụ:
  4. **Full-spectrum GRPO。**Một lần nữa thực hiện một vòng RL, phủ phủ lý luận (đánh giá dựa trên quy tắc) và sự sắp xếp chung (đánh giá dựa trên ưu tiên hữu ích/không hại)

Kết quả ở trọng lượng mở 下于 AIME 和 MATH-500 上匹配 o1,并且足够小,可以蒸──同一篇论文还发布了六种蒸密集模型(从Qwen-1.5B到Llama-70B), cách thức là theo dõi lý luận của R1 上对学生做SFT  学生端没有RL──强 RL giáo viên của蒸 在学生规模持续优于从零开始的RL──

**为什么 reasoning 用 GRPO 而不是 PPO。**DeepSeekMath 论文(2024 年 2 月) đưa ra ba lý do: 1) không cần phải đào tạo mạng giá trị,内存 giảm một nửa; 2) cơ sở nhóm của việc lý luận 天然适配  tạo ra phần thưởng cuối quỹ đạo hiếm; 3) bình thường hóa mỗi lần 让不同难度问题之间的优势可比, trong khi chỉ một nhà phê bình của PPO làm không đến điểm này.

**Search-free vs search-based。**游戏领域已经分叉:

- *长视野的完美信息游戏*(Go、棋): vẫn là dựa trên tìm kiếm──AlphaZero / MuZero 占主导──
- *Làm lý luận LLM*:生产中还没有 MCTS;对完整 rollout做GRPO,推理计算 使用最好的N――Process reward models (PRMs) 暗示阶段级搜索 正被重新加入──


```figure
f3-selfplay-ladder
```

## 构建

`code/main.py`Trung 代码 đã được thực hiện **微型 GRPO**Một nhóm nhóm các tên cướp có thuật toán giống như LLM trên; chỉ có chính sách và môi trường hơn đơn giản. Nó nói rõ *kết quả* và *lợi thế tương đối với nhóm*, đó là điểm sáng tạo năm 2025:

### 步骤 1: Một môi trường kiểm chứng nhỏ

```python
QUESTIONS = [
    {"prompt": "q1", "correct": 3},
    {"prompt": "q2", "correct": 1},
]

def verify(prompt_idx, answer_token):
    return 1.0 if answer_token == QUESTIONS[prompt_idx]["correct"] else 0.0
```

Trong thực tế GRPO, kiểm tra viên sẽ chạy các thử nghiệm đơn vị hoặc kiểm tra toán học.

### 步骤 2: chính sách: mỗi yêu cầu 上对 K 个 trả lời Địa chỉ làm mềmmax

```python
def policy_probs(theta, p_idx):
    return softmax(theta[p_idx])
```

Tương tự như một kết quả lớp cuối cùng của LLM

### Bước 3: lấy mẫu nhóm và lợi thế tương đối với nhóm

```python
def grpo_step(theta, p_idx, G=8, beta=0.01, lr=0.1, rng=None):
    probs = policy_probs(theta, p_idx)
    samples = [sample(probs, rng) for _ in range(G)]
    rewards = [verify(p_idx, s) for s in samples]
    mean_r = sum(rewards) / G
    std_r = stddev(rewards) + 1e-8
    advs = [(r - mean_r) / std_r for r in rewards]

    for a, A in zip(samples, advs):
        grad = onehot(a) - probs
        for i in range(len(probs)):
            theta[p_idx][i] += lr * A * grad[i]
    # KL penalty：把 theta 拉向 reference
    for i in range(len(probs)):
        theta[p_idx][i] -= beta * (theta[p_idx][i] - reference[p_idx][i])
```

Lợi thế tương quan nhóm là kỹ năng tìm kiếm sâu năm 2024 ⋅ không cần phê bình ⋅  cơ sở ⋅ là trung bình nhóm, bình thường hóa ⋅ sử dụng nhóm std⋅

### Bước 4: So với đường cơ sở REINFORCE

Gần như như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy, như vậy.

### 步骤 5: quan sát entropy 和 KL

Với RLHF tương tự chẩn đoán: đến trung bình KL ∞ entropy chính sách ∞ reward-over-time ∞ một khi những điều này ổn định, đào tạo đã hoàn thành ∞

## 常见陷

- **通过操纵 verifier 进行 reward hacking。**GRPO 继承风险 của RLHF: Nếu xác minh viên 错误或可被利用,LLM sẽ tìm thấy khai thác.
- **Group size 太小。**Nhóm cơ sở của nhóm`1/√G`缩放――低于 `G = 4`时, tín hiệu lợi thế 会 rất ồn ào; tiêu chuẩn lựa chọn là `G = 8`Đến`64`
- **Length bias。**Không giống như độ dài của LLM hoàn thành có khả năng đăng ký khác nhau.
- **纯 self-play 循环。**AlphaZero 风格训练可能在一般数量游戏中卡进统治循环──可通过多样化对手池
- **Search-policy mismatch。**AlphaZero trenng chính sách 去模仿搜索结果──如果政策网太小,无法表示搜索的分布,训练会停滞──
- **Compute floor。**MuZero / AlphaZero 需要海量计算──一次抽取──往往就是数百 GPU-hours──用于学习的微型演示是存在的(例如连接四上的 AlphaZero)──
- **Verifier coverage。**Để giải quyết lỗi cũng có thể thông qua các thử nghiệm đơn vị sẽ củng cố các lỗi này.

## 使用

2026  game-RL 版图,按域分:

| Domain | 主导方法 |
|--------|-----------------|
| Two-player zero-sum board games（Go、chess、shogi） | AlphaZero / MuZero / KataGo |
| Imperfect info card games（poker） | CFR + deep learning（DeepStack、Libratus、Pluribus） |
| Atari / pixel games | Muesli / MuZero / IMPALA-PPO |
| Large multiplayer strategy（Dota、StarCraft） | PPO + self-play + league（OpenAI Five、AlphaStar） |
| LLM math/code reasoning | GRPO（DeepSeek-R1、Qwen-RL、open replications） |
| LLM alignment | DPO / RLHF-PPO（不是 GRPO；verifier 是 preference，不是 verifiable） |
| Robotics | PPO + DR（不是 game-RL，但使用相同的 policy-gradient tools） |
| Combinatorial problems | AlphaZero variants（AlphaTensor、AlphaDev） |

Đây là một trong những trường hợp dễ dàng nhất, nhiều trường hợp khác cũng sẽ xuất hiện.

## 交付

保存为 `outputs/skill-game-rl-designer.md`- Có thể là:

```markdown
---
name: game-rl-designer
description: 为给定 domain 设计 game-RL 或 reasoning-RL training pipeline（AlphaZero / MuZero / GRPO）。
version: 1.0.0
phase: 9
lesson: 12
tags: [rl, alphazero, muzero, grpo, self-play]
---

给定一个目标（perfect-info game / imperfect-info / Atari / LLM reasoning / combinatorial），输出：

1. Environment fit。规则是否已知？Markov？Stochastic？Multi-agent？用于判断 AlphaZero vs MuZero vs GRPO。
2. Search strategy。MCTS（带 learned prior 的 PUCT）、Gumbel-sampled、best-of-N，或 none。
3. Self-play plan。Symmetric self-play / league / offline data / verifier-generated。
4. Target signal。Game outcome / verifier reward / preference / learned model。包含 robustness plan。
5. Diagnostics。相对 baseline 的 win rate、ELO curve、verifier pass rate、到 reference 的 KL。

对 imperfect-info games 拒绝使用 AlphaZero（转向 CFR）。没有可信 verifier 时拒绝 GRPO。没有固定 baseline opponent set 时拒绝任何 game-RL pipeline（否则 self-play ELO 未校准）。
```

## 练习

1. **Easy。**Trong `code/main.py`中实现 GRPO bandit──在 2 个提示 × 每个 4 个答案 标签 上训练──使用 `G=8`Trong < 1000 lần cập nhật trong收──
2. **Medium。**接入 PPO(clip) và vanilla REINFORCE──在同一个强盗上比较样本效率和奖励差与GRPO的差──
3. **Hard。**扩展到长度为 2 的推理链:agent 发发两个代币,verifier 对代币对发两个代币 给奖励──测量 GRPO 如何处理两步序列 上的信用分配──(提示:按 *full sequence* 计算组优势,并传播到两个代币位置──)

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| MCTS | “带 learned net 的 tree search” | Monte Carlo Tree Search；使用 learned `(p, v)` prior 的 UCB1/PUCT selection。 |
| AlphaZero | “Self-play + MCTS” | Policy-value net 被训练来匹配 MCTS visits 和 game outcome。 |
| MuZero | “Learned-model AlphaZero” | 相同循环，但通过 learned dynamics 在 latent space 中进行。 |
| GRPO | “Critic-free PPO” | Group Relative Policy Optimization；带 group-mean baseline + KL 的 REINFORCE。 |
| PUCT | “AlphaZero 的 UCB” | `Q + c · p · √N / (1 + N_a)` —— 平衡 value estimate 与 prior。 |
| Self-play | “Agent vs past self” | Zero-sum 的标准做法；提供对称训练信号。 |
| League play | “Population-based self-play” | 将 past + current + exploiters 采样为 opponents。 |
| Verifier reward | “Verifiable RL” | Reward 来自 deterministic checker（tests pass、answer matches）。 |
| Process reward | “PRM” | 为每个 reasoning step 打分，而不只是最终答案。 |

## 延伸阅读

- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270)
- [Silver et al. (2018). A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play (AlphaZero)](https://www.science.org/doi/10.1126/science.aar6404)
- [Schrittwieser et al. (2020). Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)](https://www.nature.com/articles/s41586-020-03051-4)
- [Vinyals et al. (2019). Grandmaster level in StarCraft II (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z)
- [DeepSeek-AI (2024). DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (GRPO)](https://arxiv.org/abs/2402.03300) 引入 GRPO 和 nhóm liên quan cơ sở của bài luận.
- [DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) 完整的四阶段 R1 配方以及 R1-Zero ablation──
- [Brown et al. (2019). Superhuman AI for multiplayer poker (Pluribus)](https://www.science.org/doi/10.1126/science.aay2400) CFR quy mô lớn + học sâu
- [Tesauro (1995). Temporal Difference Learning and TD-Gammon](https://dl.acm.org/doi/10.1145/203330.203343)  开创这一切的论文──
- [Hugging Face TRL — GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer) Sử dụng các chức năng thưởng tùy chỉnh 应用 GRPO 的生产参考。
- [Qwen Team (2024). Qwen2.5-Math — GRPO replication](https://github.com/QwenLM/Qwen2.5-Math) Nhiều thang lên đối với R1 配方 mở sao chép
- [Sutton & Barto (2018). Ch. 17 — Frontiers of Reinforcement Learning](http://incompleteideas.net/book/RLbook2020.pdf) Khung tâm về việc học tập và nghiên cứu và R1 trên quy mô LLM trên thực tế hóa được thiết kế để thưởng
