# 面向游戏的RL  AlphaZero、MuZero e LLM Raciocínio 时代

> 1992: TD-Gammon usando pura TD em backgammon 中击败人类冠军──2016: AlphaGo 击败 Lee Sedol──2017: AlphaZero 从零开始统治棋牌、shogi 和 Go──2024:DeepSeek-R1 证明了同一套配方在推理上也有效,只是使用GRPO 替代PPO──游戏是推动本阶段每一次突破的基准──

**类型：**Construir
**语言：**Python
**先修要求：**Fase 9 · 05 (DQN) Fase 9 · 08 (PPO) Fase 9 · 09 (RLHF) Fase 9 · 10 (MARL)
**时间：**Cerca de 120 minutos

## 问题

O jogo possui RL 想要的一切──清晰的回报(胜/负)──无限集(self-play 可以重置)──完美模拟版(游戏本身就是模拟器)──离散或小规模连续行动空间──迫使对抗鲁棒性的多代理结构──

Além disso, o jogo está em cada grande teste de RL 突破的测试场──TD-Gammon(backgammon, 1992)──Atari-DQN(2013)──AlphaGo(2016)──AlphaZero(2017)──OpenAI Five(Dota 2,2019)──AlphaStar(StarCraft II,2019)──MuZero(modelo aprendido,2019)──AlphaTensor(multiplicação de matriz,2022)──AlphaDev(orting algoritmos,2023)──DeepSeek-R1(matemática raciocínio,2025)

Esta pedra angular vai passar por um único ponto de vista.**self-play + search + policy improvement** Cada um deles é uma generalização anterior; especialmente o GRPO, que aplica a combinação do AlphaZero ao raciocínio LLM, em que o Token é ação, o testamento matemático é o sinal de vitória.

## 概念

![AlphaZero ↔ MuZero ↔ GRPO：相同循环，不同环境](../assets/rl-games.svg)

**统一循环。**

```
while True:
    trajectory = self_play(current_policy, search)     # 和自己对局
    policy_target = search.improved_policy(trajectory) # search 改进原始 policy
    policy_net.update(policy_target, value_target)     # 在 search 输出上做 supervised 训练
```

**AlphaZero (2017)。**Silver et al. 给定一个规则已知的游戏(chá,shogi,Go):

- Rede de valores políticos:一个塔 `f_θ(s) → (p, v)`- Não.`p`É um movimento legal.`v`É o resultado esperado do jogo.
- Monte Carlo Tree Search (MCTS): em cada passo,展开可能后续状态的树──使用 `(p, v)`作为前 + bootstrap──用 UCB (PUCT) 选择节点:`a* = argmax Q(s, a) + c · p(a|s) · √N(s) / (1 + N(s, a))`- Não.
- A jogada de si mesmo: fazer agente contra agente para a partida.`t`步,distribuição das visitas do MCTS `π_t`成为政策 训练目标──
- Perda:`L = (v - z)² - π · log p + c · ||θ||²`- Não.`z`É o resultado do jogo ((+1 / 0 / -1)。

零人类知识――零手工演学―― uma única preparação, depois de milhares de milhões de jogos de auto-jogo 掌握棋牌、shogi 和 Go――

**MuZero (2019)。**Schrittwieser et al. 移除了规则已知的要求──

- Não usar ambiente fixo, mas aprender um *modelo de dinâmica latente* `(h, g, f)`- Não .
  - `h(s)`:将 observação 编码为潜伏状态──
  - `g(s_latent, a)`Prefeito de Cidade:
  - `f(s_latent)`: pré测 política prior + valor。
- MCTS em *aprendizado espaço latente* 中运行── identica busca, identica formação ciclo──
- Aplica-se a Go, xadrez, shogi, e também a Atari, um algoritmo, não precisa de regras.

**Stochastic MuZero (2022)。**加入 stochastic dynamics 和 chance nodes; expand expandir para backgammon 这类游戏──

**Muesli、Gumbel MuZero (2022-2024)。**Em eficiência de amostra e pesquisa determinista, melhorias.

**GRPO (2024-2025)。**DeepSeek-R1 配方── identico AlphaZero 形状循环, aplicado ao raciocínio do modelo de linguagem:

- 游戏: responder a um problema de matemática / codificação / raciocínio.
- Política:LLM。Ações:Token。Estado:prompt + resposta-até-o-o-o-o-o-o¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
-  não criticar                                                                                                                                                                                                                                                            `G`个完成──计算每个完成的奖励──使用 **group-relative advantage** `A_i = (r_i - mean_r) / std_r`作为 REINFORCE 风格更新的信号──
- Para a política de referência, adição de penalidades KL, 以防漂移 (RLHF)
- Perda completa:

  `L_GRPO(θ) = -E_{q, {o_i}} [ (1/G) Σ_i A_i · log π_θ(o_i | q) ] + β · KL(π_θ || π_ref)`

Não há modelo de recompensa, não há críticos, não há MCTS──linha de base relativa ao grupo  substituí­la os três── em referência de raciocínio, com menos computação  atingir ou superar PPO-RLHF 质量──

**完整的 R1 配方。**DeepSeek-R1 ((DeepSeek 2025) é um dos dois modelos de estudo:

- **R1-Zero。**Desde o modelo base DeepSeek-V3 开始──没有 SFT──直接应用 GRPO, usando dois componentes de recompensa:* recompensa de precisão*(baseada em regras  最终答案是否能解析成正确数字 / 代码是否通过单元测试) 和 *format reward*(completation 是否把链思路包在`<think>…</think>`标签内) ・经过数千步后, a duração média da resposta de cerca de 100 增长到约10,000 Token, matemática benchmark 分数上升到接近 o1预览 水平。模型 从零开始学会推理──缺点: sua cadeia de pensamento 往往难以阅读、混用语言,并且缺少风格打磨──
- **R1。**Usado em quatro fases do pipeline 修复 R1-Zero 的可读性问题:
  1. **Cold-start SFT。**Reunir milhares de artigos de demonstração de longa duração de CoT em formato claro.
  2. **Reasoning-oriented GRPO。**Utilize precisão+formato recompensa,并加入 *lenguaje-consistência* recompensa para evitar a troca de código。
  3. **Rejection sampling + SFT 第 2 轮。**A partir do ponto de controlo RL 采样约600K 条推理轨迹, apenas reter a resposta final correcta且CoT可读的样本,并与约200K 条非推理 SFT exemplo(escritura、QA、自我认知) 组合──再次精细调基──
  4. **Full-spectrum GRPO。**Re-realizar uma rodada de RL, abranger o raciocínio (recompensação baseada em regras) e o alinhamento geral (recompensação baseada em preferências de utilidade/inharmonia)

Resultados em pesos abertos 下于 AIME 和 MATH-500 上匹配 o1,并且足够小,可以蒸蒸──同一篇论文还发布了六种蒸的密集模型(从Qwen-1.5B到Llama-70B),方式是R1的推理痕迹 上对学生做SFT  学生端没有RL──强RL教师的蒸 在学生规模持续优于从零开始的RL──

**为什么 reasoning 用 GRPO 而不是 PPO。**DeepSeekMath 论文(2024 年 2 月) dá três razões: 1) Não precisa treinar rede de valor, 内存减半; 2) grupo de base 天然适配 raciocínio tarefa 产生的稀疏结尾的回报; 3) por-prompte normalização 让不同难度问题之间的优势可比,而PPO的单一批评做不到这一点.

**Search-free vs search-based。**游戏领域已经分叉:

- *长 horizon 的完美信息游戏*(Go、chess): ainda é baseado em busca。AlphaZero / MuZero 占主导。
- *LLM raciocínio*: produção中还没有 MCTS;对完整部署做GRPO,推理计算使用最好的N――process reward models (PRMs) 暗示阶级搜索 正被重新加入──


```figure
f3-selfplay-ladder
```

## Construção

`code/main.py`O código do meio foi implementado.**微型 GRPO**  一个带多组样本的强盗――算法与LLM上相同;只有政策和环境更简单――它讲清楚 *loss* 和 *group-relative advantage*,也就是2025年创新点――

### 步骤 1: um ambiente de verificação de micro tipo

```python
QUESTIONS = [
    {"prompt": "q1", "correct": 3},
    {"prompt": "q2", "correct": 1},
]

def verify(prompt_idx, answer_token):
    return 1.0 if answer_token == QUESTIONS[prompt_idx]["correct"] else 0.0
```

Em GRPO real, verificador irá executar testes de unidade ou verificar equivalência matemática.

### 步骤 2: política: cada prompt 上对 K 个答案 Token fazer softmax

```python
def policy_probs(theta, p_idx):
    return softmax(theta[p_idx])
```

Para o efeito, o valor da produção de nível final do LLM é de um modo imediato.

### 步骤 3: amostragem de grupo e vantagem relativa ao grupo

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

A vantagem relativa ao grupo é o que é o DeepSeek de 2024 

### 步骤 4: Comparar com o nível de base de REINFORCE

O sistema de controle de dados é o mesmo que o sistema de controle de dados.

### 步骤 5: observar entropia 和 KL

Com RLHF análogos diagnósticos: até a referência de KL mean 、 política entropia 、 recompensa-over-time ⋅ assim que estes estabilizados, o treinamento já está concluído ⋅

## 常见陷

- **通过操纵 verifier 进行 reward hacking。**GRPO                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- **Group size 太小。**Diferença de grupo de referência`1/√G`- Não.`G = 4`时, sinal de vantagem 会 muito barulhento; 标准选择是`G = 8`Até`64`- Não.
- **Length bias。**Diferente de duração de conclusão de LLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
- **纯 self-play 循环。**AlphaZero 风格训练可能在一般数游戏中卡进统治循环──可通过多样化对手池联赛比赛,Lesson 10)缓解──
- **Search-policy mismatch。**AlphaZero trenagem política 去模仿搜索结果──如果政策网太小,不能表示搜索的分布,训练会停滞──
- **Compute floor。**MuZero / AlphaZero 需要海量计算──一次的ablation 往往就是数百 GPU-hours──用于学习的微型演示是存在的(例如连接四上的 AlphaZero)──
- **Verifier coverage。**Para solução de bugs também pode passar testes unitários irá reforçar o bug.

## Utilização

2026 版图, por domínio 划分:

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

Esse * método*  auto-jogo  melhoria aumentada pela pesquisa  destilação de políticas  横跨文本、像素和物理控制。GRPO é o exemplo mais leve; mais exemplos também surgirão。

## 交付

保存为 `outputs/skill-game-rl-designer.md`- Não .

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

1. **Easy。**Em`code/main.py`中实现 GRPO bandit──在 2 个提示 × 每 4 个答案 Token 上训练──使用 `G=8`Em < 1000 vezes atualização
2. **Medium。**接入 PPO(clip) 和香莉 REINFORCE──在同一个强盗上比较样本效率和奖励差与GRPO的差──
3. **Hard。**扩展到长度为 2 的理性链:agent 发发发两个代币,verifier对代币对代币 给奖励──测量GRPO 如何处理两步序列 上的信用分配──(提示:按 *full sequence* 计算组优势,并传播到两个代币位置──)

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

- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270)- Não.
- [Silver et al. (2018). A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play (AlphaZero)](https://www.science.org/doi/10.1126/science.aar6404)- Não.
- [Schrittwieser et al. (2020). Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)](https://www.nature.com/articles/s41586-020-03051-4)- Não.
- [Vinyals et al. (2019). Grandmaster level in StarCraft II (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z)- Não.
- [DeepSeek-AI (2024). DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (GRPO)](https://arxiv.org/abs/2402.03300)  Introdução ao GRPO e ao grupo-relativo de base de estudo.
- [DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) 完整的四阶段 R1 配方以及 R1-Zero ablation──
- [Brown et al. (2019). Superhuman AI for multiplayer poker (Pluribus)](https://www.science.org/doi/10.1126/science.aay2400) CFR de grande dimensão + aprendizagem profunda。
- [Tesauro (1995). Temporal Difference Learning and TD-Gammon](https://dl.acm.org/doi/10.1145/203330.203343)O que é que é que é?
- [Hugging Face TRL — GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer) Utilize custom reward functions  aplicar GRPO  
- [Qwen Team (2024). Qwen2.5-Math — GRPO replication](https://github.com/QwenLM/Qwen2.5-Math) Multi escala  R1 配方 
- [Sutton & Barto (2018). Ch. 17 — Frontiers of Reinforcement Learning](http://incompleteideas.net/book/RLbook2020.pdf) para o auto-joio  pesquisa 和 R1 em escala LLM construído para a remuneração  estrutura de ensino 
