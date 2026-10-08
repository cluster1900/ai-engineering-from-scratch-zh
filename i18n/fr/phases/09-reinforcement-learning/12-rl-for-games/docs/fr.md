# 面向游戏的RL  AlphaZero、MuZero et LLM Réflexion 时代

> 1992:TD-Gammon utilise purement TD dans le backgammon dans le jeu de hasard pour vaincre le champion de l'humanité.2016:AlphaGo vaincre Lee Sedol.2017:AlphaZero de zéro à zéro pour dominer les échecs, les shogi et les go.2024:DeepSeek-R1 prouve la même méthode de raisonnement.

**类型：**Construire
**语言：**Python
**先修要求：**La phase 9 · 05 (DQN) La phase 9 · 08 (PPO) La phase 9 · 09 (RLHF) La phase 9 · 10 (MARL)
**时间：**À environ 120 minutes

##  problématique

Le jeu possède tout ce que vous voulez. Une récompense claire. Un épisode illimité.

Et le jeu est vraiment chaque fois majeur RL 突破的测试场──TD-Gammon(backgammon, 1992)──Atari-DQN(2013)──AlphaGo(2016)──AlphaZero(2017)──OpenAI Five(Dota 2,2019)──AlphaStar(StarCraft II,2019)──MuZero(le modèle appris,2019)──AlphaTensor(matrice multiplication,2022)──AlphaDev(sorting algorithmes,2023)──DeepSeek-R1(math reasoning,2025)

Cette pierre angulaire traversera un ensemble de trois architectures: AlphaZero, MuZero et GRPO:**self-play + search + policy improvement** Chaque type est une généralisation de l'ancien type; en particulier, le GRPO, il applique la combinaison d'AlphaZero au raisonnement LLM, dont le Token est l'action, l'essai mathématique est le signal de victoire.

## 概念

![AlphaZero ↔ MuZero ↔ GRPO：相同循环，不同环境](../assets/rl-games.svg)

**统一循环。**

```
while True:
    trajectory = self_play(current_policy, search)     # 和自己对局
    policy_target = search.improved_policy(trajectory) # search 改进原始 policy
    policy_net.update(policy_target, value_target)     # 在 search 输出上做 supervised 训练
```

**AlphaZero (2017)。**Silver et al. 给定一个规则已知的游戏(échecs,shogi、Go):

- Réseau de valeurs politiques:`f_θ(s) → (p, v)`Il y a une autre.`p`C'est une décision légitime.`v`C'est le résultat du jeu que l'on attend.
- Monte Carlo Tree Search (MCTS): à chaque étape, le développement de l'état de l'arbre.`(p, v)`作为前 + bootstrap──用 UCB (PUCT) 选择节点:`a* = argmax Q(s, a) + c · p(a|s) · √N(s) / (1 + N(s, a))`Il y a une autre.
- Je joue moi-même: faire agent-contre-agent pour la partie.`t`步,distribution des visites du MCTS `π_t`成为政策 训练目标──
- Perte:`L = (v - z)² - π · log p + c · ||θ||²`Il y a une autre.`z`C'est le résultat du jeu.

零人类知识――零手工演学―― un seul ensemble, après avoir joué des milliards de fois à lui-même , maîtrisant les échecs、shogi 和 Go―.

**MuZero (2019)。**Schrittwieser et coll. 移除了规则已知的要求──

- Il n'utilise pas un environnement fixe, mais il apprend un modèle de dynamique latente.`(h, g, f)`- Le numéro de la liste:
  - `h(s)`:将观察 编码为潜伏状态──
  - `g(s_latent, a)`:预测下一个潜伏状态 + récompense。
  - `f(s_latent)`: pré测 politique prior + valeur。
- MCTS dans le même espace latent appris.
- 适用于 Go、chess、shogi *以及* Atari  一个算法,不需要规则知识──

**Stochastic MuZero (2022)。**加入 stochastic dynamics 和 chance nodes; étendre à backgammon 这类游戏。

**Muesli、Gumbel MuZero (2022-2024)。**Dans l'efficacité de l'échantillon et la recherche déterministe, les améliorations sont apportées.

**GRPO (2024-2025)。**DeepSeek-R1 配方── identique à AlphaZero 形状循环, appliqué au raisonnement du modèle de langage:

- 游戏: répondre à un problème de mathématiques / de codage / de raisonnement。胜利= vérificateur(cas de test 通过、数值答案匹配) retour 1。
- Politique:LLM。Actions:Token。State:prompt + response-so far。
-  aucun critique                                                                                                                                                                                                                                                             `G`个完成──计算每个完成的奖励──使用 **group-relative advantage** `A_i = (r_i - mean_r) / std_r`作为 REINFORCE 风格更新的信号──
- Pour les politiques de référence, plus de pénalité KL, éviter les déménagements, comme la RLHF.
- La perte totale:

  `L_GRPO(θ) = -E_{q, {o_i}} [ (1/G) Σ_i A_i · log π_θ(o_i | q) ] + β · KL(π_θ || π_ref)`

 aucun modèle de récompense, aucun critique, aucun MCTS──le baseline de référence par rapport au groupe  a remplacé les trois  dans le benchmark de raisonnement , avec moins de calcul  atteindre ou dépasser la qualité PPO-RLHF──

**完整的 R1 配方。**DeepSeek-R1 ((DeepSeek 2025) est un ouvrage de deux modèles:

- **R1-Zero。**De DeepSeek-V3 modèle de base 开始──没有 SFT──直接应用 GRPO, using two reward component:*precision reward*(rule-based  最终答案是否能解析成正确数字 / 代码是否通过单元测试) 和 *format reward*(complément 是否把链-of-thought 包在`<think>…</think>`标签内) ・经过数千步后, la durée moyenne de la réponse est passée de 100 à 10 000 Tokens, le nombre de référence mathématique est passé à près de l'o1 prévisualisation 水平。模型 从零开始学会推理──缺点: sa chaîne de pensée est souvent difficile à lire、混用语言,并且缺少风格打磨──
- **R1。**Utilisation du pipeline de quatre étapes 修复 R1-Zero's
  1. **Cold-start SFT。**收集数千条格式清晰的长度CoT示范――对基模型做监督-finetune――这提供了一个可读的起点――
  2. **Reasoning-oriented GRPO。**Utiliser une récompense pour la précision+format,并加入 *langue-consistence* récompense pour éviter le changement de code。
  3. **Rejection sampling + SFT 第 2 轮。**De RL checkpoint 采样约600K 条推理轨迹, seulement conserver la réponse finale correct且CoT可读的样本,并与约200K 条非推理 SFT exemple(écriture、QA、自我认知)组合──再次精细调基础──
  4. **Full-spectrum GRPO。**Réétablissement d'une série de RL, couverture de raisonnement (récompense fondée sur les règles) et alignement général (récompense fondée sur les préférences d'utilité/inutilité)

结果在开放权重下于 AIME 和 MATH-500 上匹配 o1,并且足够小,可以蒸──同一篇论文还发布了六种蒸的密集模型(从Qwen-1.5B到Llama-70B),方式是R1的推理痕迹 上对学生做SFT  学生端没有RL──强RL的师的蒸 在学生规模持续优于从零开始的RL──

**为什么 reasoning 用 GRPO 而不是 PPO。**DeepSeekMath 论文(2024 年 2 月) donne trois raisons: 1) Ne nécessite pas d'entraîner le réseau de valeur, la réduction de la moitié du stockage; 2) la base de groupe 天然适配 raisonnement tâche  résulte rare fin de la trajectoire récompense; 3) la normalisation par impulsion 让不同难度问题之间的 avantage 可比, alors que PPO un seul critique ne fait pas jusqu'à ce point.

**Search-free vs search-based。**Le domaine du jeu est déjà divisé:

- *长horizon's perfect-information games*(Go、chess): encore est basé sur la recherche。AlphaZero / MuZero 占主导。
- *LLM raisonnement*: production中还没有 MCTS;对完整部署做GRPO,推理计算使用最好的N──Process reward models (PRMs) 暗示阶级搜索 正被重新加入──


```figure
f3-selfplay-ladder
```

## Construction

`code/main.py`Le code intermédiaire est réalisé**微型 GRPO** Un groupe de bandits avec un groupe de bandits  L'algorithme est le même que celui du LLM; seulement la politique et l'environnement, plus simple.

### 步骤 1: un environnement de vérificateur de type micro

```python
QUESTIONS = [
    {"prompt": "q1", "correct": 3},
    {"prompt": "q2", "correct": 1},
]

def verify(prompt_idx, answer_token):
    return 1.0 if answer_token == QUESTIONS[prompt_idx]["correct"] else 0.0
```

Dans le GRPO réel, le vérificateur effectuera des tests d'unité ou des tests d'équivalence mathématique.

### 步骤 2: politique: chaque prompt 上对 K 个答案 Token faire le softmax

```python
def policy_probs(theta, p_idx):
    return softmax(theta[p_idx])
```

L'émission de la dernière couche de LLM est immédiate.

### 步骤 3: échantillonnage par groupe et avantage par rapport au groupe

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

L'avantage relatif au groupe est la technique de recherche en profondeur de 2024 不需要批评──基线是群中,正常化 使用群 std──

### étape 4: Comparer avec la ligne de base de REINFORCE

La même configuration, le même calcul, la même force de réaction.

### 步骤 5: Observer l'entropie et le KL

Avec RLHF similaires diagnostics: jusqu'à la moyenne de référence KL、entropie politique、 récompense-au-delà du temps―une fois ces stables, l'entraînement est terminé―

## 常见陷

- **通过操纵 verifier 进行 reward hacking。**GRPO                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- **Group size 太小。**Différence de base du groupe`1/√G`Il est en train de se déchaîner.`G = 4`时, signal d'avantage 会很噪音; 标准选择是 `G = 8`À la`64`Il y a une autre.
- **Length bias。**Il est possible de réaliser un programme de formation en logement de plusieurs niveaux, en utilisant des logs de niveau séquentiel ou en utilisant des logs de longueur maximale.
- **纯 self-play 循环。**AlphaZero 风格训练可能在一般数量游戏中卡进统治循环──可通过多样化对手池联赛比赛,课十缓解──
- **Search-policy mismatch。**AlphaZero trainage politique 去模仿搜索结果──如果政策网太小,不能表示搜索的分布,训练会停滞──
- **Compute floor。**MuZero / AlphaZero 需要海量计算──一次的ablation 往往就是数百 GPU-hours──用于学习的微型演示是存在的(例如连接四上的 AlphaZero)──
- **Verifier coverage。**Pour une solution de bug, les tests d'unité peuvent également être passés, ce qui renforcera le vérificateur de bug.

## Utilisation

2026 année de jeu-RL 版图, selon le domaine 划分:

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

Cette méthode est le plus simple, il y en aura encore plus.

## 交付

保存为 `outputs/skill-game-rl-designer.md`- Le numéro de la liste:

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

1. **Easy。**Dans le`code/main.py`中实现 GRPO bandit──在 2 个提示 × 每个 4 个答案代币 上训练──使用 `G=8`Dans les 1000 dernières mises à jour.
2. **Medium。**接入 PPO(clips) et vanille REINFORCE──在同一个强盗上比较样本效率和奖励差异与GRPO的差异──
3. **Hard。**扩展到长度为 2 的推理链:agent 发发两个代币,verifier对代币对代币 给奖励──测量GRPO 如何处理两步序列 上的信用分配──(提示:按 *full sequence* 计算组优势,并传播到两个代币位置──)

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

- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270)Il y a une autre.
- [Silver et al. (2018). A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play (AlphaZero)](https://www.science.org/doi/10.1126/science.aar6404)Il y a une autre.
- [Schrittwieser et al. (2020). Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)](https://www.nature.com/articles/s41586-020-03051-4)Il y a une autre.
- [Vinyals et al. (2019). Grandmaster level in StarCraft II (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z)Il y a une autre.
- [DeepSeek-AI (2024). DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (GRPO)](https://arxiv.org/abs/2402.03300)  Introduction du GRPO et du groupe relatif de base 
- [DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) 完整的四阶段 R1 配方以及 R1-Zero ablation。
- [Brown et al. (2019). Superhuman AI for multiplayer poker (Pluribus)](https://www.science.org/doi/10.1126/science.aay2400) CFR à grande échelle + apprentissage en profondeur。
- [Tesauro (1995). Temporal Difference Learning and TD-Gammon](https://dl.acm.org/doi/10.1145/203330.203343)  开创这一切的论文──
- [Hugging Face TRL — GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer) Utiliser des fonctions de récompense personnalisées  appliquer la production de GRPO 
- [Qwen Team (2024). Qwen2.5-Math — GRPO replication](https://github.com/QwenLM/Qwen2.5-Math) Multiple échelle de réplication ouverte de la R1
- [Sutton & Barto (2018). Ch. 17 — Frontiers of Reinforcement Learning](http://incompleteideas.net/book/RLbook2020.pdf) R1  Régimes de formation de la récompense conçue pour le jeu personnel  recherche et R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1  R1   R1   R1                                 
