# 面向游戏的RL  AlphaZero、MuZero 与LLM推理时代

> 1992:TD-Gammon 用纯TD 在后游中击败人类冠军──2016:AlphaGo 击败Lee Sedol──2017:AlphaZero 从零开始统治棋牌、shogi 和 Go──2024:DeepSeek-R1 证明了相同的配套在推理上上也有效,只是使用GRPO 替代PPO──游戏是推动本阶段每次突破的基准──

**类型：**建立
**语言：**字符串
**先修要求：**九期·05期 (DQN) 九期·08期 (PPO) 九期·09期 (RLHF) 九期·10期 (MARL)
**时间：**约120分钟

## 问题

游戏具备RL 想要的一切──清晰的回报(胜/负)──无限集片(自动游戏可以重置)──完美模拟作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作作

而且游戏正是每一次重大RL突破的测试场──TD-Gammon(backgammon,1992)──Atari-DQN(2013)──AlphaGo(2016)──AlphaZero(2017)──OpenAI Five──Dota 2,2019)──AlphaStar(StarCraft II,2019)──MuZero──学习模型,2019)──AlphaTensor──矩阵乘法,2022──AlphaDev──排序算法,2023)──DeepSeek-R1──数学推理,2025)

这座顶点将通过一个统一视角考察三种里程碑架构:AlphaZero、MuZero 和 GRPO:**self-play + search + policy improvement**,每一种都是前一种泛化;特别是GRPO,它将AlphaZero的配方应用到LLM推理中,其中的标志是行动,数学验证是胜利信号.

## 概念

![AlphaZero ↔ MuZero ↔ GRPO：相同循环，不同环境](../assets/rl-games.svg)

**统一循环。**

```
while True:
    trajectory = self_play(current_policy, search)     # 和自己对局
    policy_target = search.improved_policy(trajectory) # search 改进原始 policy
    policy_net.update(policy_target, value_target)     # 在 search 输出上做 supervised 训练
```

**AlphaZero (2017)。**给定一个规则已知的游戏:

- 政策价值网络:一个塔 `f_θ(s) → (p, v)`,我知道.`p`是合法的上升前.`v`是期望的游戏结果.
- 蒙特卡洛树搜索 (MCTS):在每一步,展开可能后续状态的树.`(p, v)`作为先前+启动节点:`a* = argmax Q(s, a) + c · p(a|s) · √N(s) / (1 + N(s, a))`,我知道.
- 让代理对代理对局.`t`步,MCTS访问分布`π_t`成为政策的目标
- 损失:`L = (v - z)² - π · log p + c · ||θ||²`,我知道.`z`是游戏结果 ((+1 / 0 / -1) ⋅

零人类知识――零手工学―― 一个单一的配方,在各自的数千万局自动玩之后掌握了棋牌、shogi 和 Go――

**MuZero (2019)。**移除了已知规则的要求.

- 不使用固定环境,而是学习一个*潜伏动态模型*`(h, g, f)`其他:
  - `h(s)`作为一个潜伏状态的观察.
  - `g(s_latent, a)`预测下一个隐藏状态 + 奖励――
  - `f(s_latent)`:预测政策前 +值──
-  MCTS 在*学习的隐形空间中运行――相同的搜索,相同的训练循环――
- 适用于Go、棋牌、shogi *以及*阿塔利  一个算法,不需要规则知识

**Stochastic MuZero (2022)。**加入 stochastic动态和机会节点;扩展到后游 这类游戏.

**Muesli、Gumbel MuZero (2022-2024)。**在样本效率和确定性搜索上的改进.

**GRPO (2024-2025)。**类似的 AlphaZero 形状循环,适用于语言模型推理:

- 游戏:回答数学/编码/推理问题──胜利=验证器(测试案例 通过、数值答案匹配) 回复 1──
- 政策:LLM──行动:标签──状态:快速+反应-迄今为止──
- 没有批评,相反,对每一个提示,从政策采样`G`个完成――计算每个完成的奖励――使用 **group-relative advantage** `A_i = (r_i - mean_r) / std_r`作为强大力量的新信号.
- 对于参考政策加 KL罚款 以防漂移(类似于RLHF)
- 完整的损失:

  `L_GRPO(θ) = -E_{q, {o_i}} [ (1/G) Σ_i A_i · log π_θ(o_i | q) ] + β · KL(π_θ || π_ref)`

没有奖励模型,没有批评者,没有MCTS──组相关基线 替换了三者──在推理基准上,使用少得多的计算 达到或超过PPO-RLHF质量──

**完整的 R1 配方。**探探 (DeepSeek 2025) 是一个论文中的两个模型:

- **R1-Zero。**从DeepSeek-V3基模型开始──没有SFT──直接应用GRPO,使用两个奖励组件:*准确奖励*(基于规则的 最终答案是否能解析成正确数字/代码是否通过单元测试) 和 *格式奖励*(完成 是否把链接的思想包在`<think>…</think>`标签内) ・经过数千步后,平均响应长度从约100 增长到约1万代币,数学基准 分数上升到接近 o1预览 水平――模型 从零开始学会推理――缺点:它的思想链往往难以阅读、混用语言,并且缺少风格打磨――
- **R1。**用四阶段管道修复R1-Zero的可读性问题:
  1. **Cold-start SFT。**收集数千条形式清晰的长度CoT示范――对基础模型做监督-细节――这提供了一个可读的起点――
  2. **Reasoning-oriented GRPO。**使用精度+格式奖励,并加入 *语言一致性*奖励以防止代码交换──
  3. **Rejection sampling + SFT 第 2 轮。**从RL检查点采用约600K条理性轨迹,只保留最终答案正确且可读的样本,并与约200K条非理性SFT例进行调整.
  4. **Full-spectrum GRPO。**再进行一轮RL,覆盖推理 (基于规则的奖励) 和一般的配合 (基于帮助/无害的偏好的奖励)

结果在开放权重下面是IME 和 MATH-500 上匹配 o1,并且足够小,可以蒸──同篇论文还发布了六种蒸密集型模型──从Qwen-1.5B到Llama-70B),方法是R1的推理痕迹 上对学生做SFT  学生端没有RL──强 RL的师范蒸 在学生规模持续优于从零开始的RL──

**为什么 reasoning 用 GRPO 而不是 PPO。**论文: () 给出三个原因: 1) 不需要训练价值网络,内存减半; 2) 组基线 天然适配推理任务 产生稀疏的轨迹结束奖励; 3) 每次正常化 让不同难度问题之间的优势可比,而PPO的单一批评者做不到这一点.

**Search-free vs search-based。**游戏领域已经分叉:

- 博游戏: 博游戏: 博游戏: 博游戏: 博游戏: 博游戏:
- 对于完整的推广做GRPO,推理计算使用最好的N――过程奖励模型 (PRM) 暗示阶段级搜索 正被重新加入――


```figure
f3-selfplay-ladder
```

## 构建

`code/main.py`中的代码实现了**微型 GRPO** 一个带多组样本的强盗――算法与LLM上相同;只有政策和环境更简单――它讲清楚 *损失* 和 *群体相对优势*,也就是2025年的创新点――

### 步骤1:一个微型验证器环境

```python
QUESTIONS = [
    {"prompt": "q1", "correct": 3},
    {"prompt": "q2", "correct": 1},
]

def verify(prompt_idx, answer_token):
    return 1.0 if answer_token == QUESTIONS[prompt_idx]["correct"] else 0.0
```

在真实GRPO中,验证器会运行单位测试或检查数学等价性.

### 步骤2:政策:每个提示 上对 K 个答案代币做软max

```python
def policy_probs(theta, p_idx):
    return softmax(theta[p_idx])
```

价格以即时为条件的LLM最终层出口.

### 步骤3:组样本和组相对优势

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

群体相对优势是2024年深度搜索的技巧──不需要批评──基线是群体平均水平,正常化 使用群体std──

### 步骤4:与 REINFORCE的基线 (无价值) 比较

同样的设置,同样的计算,普通强化.

### 步骤 5:观察和KL

随着RLHF相似的诊断:到参考的平均KL、政策透、奖励-加时间――一旦这些稳定,训练就完成了――

## 常见陷

- **通过操纵 verifier 进行 reward hacking。**由于这些问题,如果验证器错误或可被利用,LLM会找到利用者.
- **Group size 太小。**根据组基线的差异`1/√G`缩放.`G = 4`时,优势信号会很;标准选择是`G = 8`到了`64`,我知道.
- **Length bias。**不同长度的LLM完成 具有不同的日志概率.
- **纯 self-play 循环。**球运动的风格在一般数量游戏中卡进主导循环.
- **Search-policy mismatch。**训练政策 去模仿搜索结果. 如果政策网太小,无法显示搜索的分布,训练会停滞.
- **Compute floor。**需要海量计算.一次的减速往往就是数百个GPU-小时.
- **Verifier coverage。**对于 bug 解决方案也能通过单元测试将加强该 bug 设计能捕捉边缘案例的验证器

## 使用

游戏-RL 版图,按域名分:

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

这个 *配方* 自动玩 搜索增强改进政策蒸 横跨文本、像素和物理控制GRPO是最轻的例子;更多的例子也会出现

## 交付

保存为`outputs/skill-game-rl-designer.md`其他:

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

1. **Easy。**在`code/main.py`中实现GRPO强盗──在 2 个提示 × 每个 4 个答案代币 上训练──使用 `G=8`在"1000次更新内收──
2. **Medium。**接入PPO(剪辑) 和尼拉 REINFORCE──在同一强盗上比较样本效率和奖励差异与GRPO的差异──
3. **Hard。**扩展到长度为 2 的推理链:代理发发出两个代币,验证者对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代币对代代币对代币对代币对代代代币对代代代币对代币对代代代代代代代代代代币对代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代

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

- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270),我知道.
- [Silver et al. (2018). A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play (AlphaZero)](https://www.science.org/doi/10.1126/science.aar6404),我知道.
- [Schrittwieser et al. (2020). Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)](https://www.nature.com/articles/s41586-020-03051-4),我知道.
- [Vinyals et al. (2019). Grandmaster level in StarCraft II (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z),我知道.
- [DeepSeek-AI (2024). DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (GRPO)](https://arxiv.org/abs/2402.03300) 引入GRPO和组相关基线的论文.
- [DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) 完整的四阶段R1配方以及R1零除──
- [Brown et al. (2019). Superhuman AI for multiplayer poker (Pluribus)](https://www.science.org/doi/10.1126/science.aay2400) 大规模的CFR+深度学习――
- [Tesauro (1995). Temporal Difference Learning and TD-Gammon](https://dl.acm.org/doi/10.1145/203330.203343)开创这一切的论文.
- [Hugging Face TRL — GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer) 使用定制奖励功能 应用GRPO的生产参考.
- [Qwen Team (2024). Qwen2.5-Math — GRPO replication](https://github.com/QwenLM/Qwen2.5-Math)多个尺度上对R1配方的开放复制──
- [Sutton & Barto (2018). Ch. 17 — Frontiers of Reinforcement Learning](http://incompleteideas.net/book/RLbook2020.pdf)对自主游戏,研究和R1在LLM规模上实例化设计奖励的教材级框架
