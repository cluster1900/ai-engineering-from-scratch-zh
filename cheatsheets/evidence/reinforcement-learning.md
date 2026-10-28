# Evidence: cheatsheets/reinforcement-learning.md

P09 = phases/09-reinforcement-learning. L01 = P09/01-mdps-states-actions-rewards, L02 = P09/02-dynamic-programming, L03 = P09/03-monte-carlo-methods, L04 = P09/04-q-learning-sarsa, L05 = P09/05-dqn, L06 = P09/06-policy-gradients-reinforce, L07 = P09/07-actor-critic-a2c-a3c, L08 = P09/08-ppo, L09 = P09/09-reward-modeling-rlhf, L12 = P09/12-rl-for-games. All doc paths are docs/en.md.

## Architecture: PPO 训练循环 (7 nodes)
- envs "N parallel envs, T steps each": L08/docs/en.md:57; L08/code/main.py:67 (n_envs, horizon)
- actor "Actor, softmax policy": L08/code/main.py:34-42, 73; L07/docs/en.md:28
- buf "Rollout buffer, s, a, r, log_pi_old": L08/docs/en.md:60, 77-90; L08/code/main.py:76-83
- critic "Critic, v_old per state": L08/code/main.py:81; L07/docs/en.md:29
- gae "GAE, advantages, returns": L08/docs/en.md:58, 94-96; L08/code/main.py:90-100
- clip "Clipped surrogate, K epochs, minibatches": L08/docs/en.md:60-63, 66; L08/code/main.py:123-127
- diag "Diagnostics, mean KL, clip fraction": L08/docs/en.md:132-135; L08/code/main.py:157-158
- edges action, transition, value, advantage, update: L08/docs/en.md:57-64

## Flow: RLHF 的三个阶段 (flow, 7 steps)
1. SFT on human demonstrations: L09/docs/en.md:24
2. prompt, chosen, rejected rows: L09/docs/en.md:28, 133
3. scalar head on SFT model, Bradley-Terry loss: L09/docs/en.md:30-36
4. policy from SFT, frozen reference: L09/docs/en.md:40
5. RM score minus beta KL: L09/docs/en.md:43
6. PPO on token level policy: L09/docs/en.md:46
7. mean KL past about 5 to 10: L09/docs/en.md:117

## Concepts: 价值公式 (concepts, 8)
- MDP tuple: L01/docs/en.md:182
- Return: L01/docs/en.md:32
- Bellman V: L01/docs/en.md:38
- Value iteration: L02/docs/en.md:34
- TD(0): L04/docs/en.md:27
- Q-learning: L04/docs/en.md:35
- SARSA: L04/docs/en.md:43
- DQN loss over replay D: L05/docs/en.md:29, 32

## Concepts: 策略公式 (concepts, 8)
- Policy gradient: L06/docs/en.md:27 (trajectory subscript dropped)
- TD advantage delta_t: L07/docs/en.md:34
- GAE: L07/docs/en.md:47
- PPO ratio: L08/docs/en.md:27 (written inline as a quotient)
- PPO clip: L08/docs/en.md:35 (theta argument dropped)
- Bradley-Terry: L09/docs/en.md:32
- RLHF reward: L09/docs/en.md:43
- GRPO advantage over G samples: L12/docs/en.md:57

## Command table: 选择方法
- tabular known model, VI or PI: L02/docs/en.md:154
- tabular samples only, Q-learning: L04/docs/en.md:137
- on-policy safety critical, SARSA or Expected SARSA: L04/docs/en.md:138
- high dimensional, DQN, Double DQN in production: L04/docs/en.md:139; L05/docs/en.md:138
- continuous control, PPO Gaussian or SAC and TD3: L08/docs/en.md:154; L04/docs/en.md:140
- LLM alignment, DPO first, RLHF-PPO with KL: L09/docs/en.md:180, 187; L08/docs/en.md:156
- LLM reasoning, GRPO with verifier: L09/docs/en.md:181
- board games, AlphaZero or MuZero: L12/docs/en.md:161

## Task table: 更新行
- G = r + gamma * G: L03/docs/en.md:80
- epsilon greedy: L03/docs/en.md:116-117 (two lines joined)
- Q-learning target: L04/docs/en.md:104
- SARSA target: L04/docs/en.md:84
- TD step: L04/docs/en.md:85, 105
- DQN target sync: L05/docs/en.md:127-128 (two lines joined)
- RLHF reward with KL: L09/docs/en.md:110
- GRPO advantage: L12/docs/en.md:124

## Annotated code: PPO 裁剪更新 (14 lines)
- condensed from L08/code/main.py:130-155. Keeps 130-134, 136, 148-155. Lines 143-146 (if not clipped ... else 0.0) joined into one conditional expression. clip_hits and kl lines 137-141 dropped.
- comment "advantages normalized per minibatch": L08/code/main.py:128
- comment "clipped means zero gradient": L08/docs/en.md:124
- comment "new over old probability": L08/docs/en.md:30

## 默认值与数字 (defaults, 8)
- gamma 0.99, horizon 1/(1 - gamma), 100 steps: L01/docs/en.md:28, 121
- tabular alpha and epsilon 0.1, 4x4 GridWorld: L04/docs/en.md:116
- PPO clip 0.2, 0.1 timid, 0.3 unstable: L08/docs/en.md:45, 140
- c_v 0.5: L08/docs/en.md:53; L07/docs/en.md:62
- c_e 0.01: L08/docs/en.md:53; L07/docs/en.md:62
- GAE lambda 0.95, 0 is TD, 1 is MC: L07/docs/en.md:50
- RLHF beta 0.01-0.05, keeps policy near SFT: L09/docs/en.md:45
- GRPO G 8, 8 to 64 standard, below 4 noisy: L12/docs/en.md:118, 148

## 排障 (troubleshooting, 8)
- mean KL past 0.1, reduce K_EPOCHS or LR: L08/docs/en.md:134, 141
- clip fraction near 0, raise LR or K_EPOCHS: L08/docs/en.md:135
- clip fraction 0.5 and more, lower them: L08/docs/en.md:135
- reward climbs, human eval drops: L09/docs/en.md:167
- length hacking: L09/docs/en.md:168
- max bias, Double DQN: L04/docs/en.md:127; L05/docs/en.md:138
- deadly triad, keep target net and replay: L05/docs/en.md:136
- entropy collapse, entropy bonus: L06/docs/en.md:140; L07/docs/en.md:137

## 缩写 (glossary, 8)
- MDP: L01/docs/en.md:1, 182
- TD: L04/docs/en.md:1, 16
- DQN replay, target net, reward clipping: L05/docs/en.md:1, 14-18
- A2C synchronous, batched parallel envs: L07/docs/en.md:52, 127
- GAE weighted sum of TD residuals: L07/docs/en.md:44-47
- PPO clipped ratio, many epochs: L08/docs/en.md:1, 3
- RLHF SFT, RM, PPO: L09/docs/en.md:16
- GRPO Group Relative Policy Optimization, no critic: L12/docs/en.md:57, 210

## 问题 (qa, 5)
- on-policy vs off-policy: L03/docs/en.md:202-203
- Q-learning max vs SARSA next action, cautious: L04/docs/en.md:32, 38, 46, 48
- baseline unbiased, lower variance: L06/docs/en.md:34-36
- KL keeps policy near RM data: L09/docs/en.md:48
- GRPO halves memory, per prompt normalization, sparse reward: L12/docs/en.md:76

## 提示 (tips, 6)
- five MDP tuples first: L01/docs/en.md:145
- check against DP V*: L02/docs/en.md:16; L04/docs/en.md:120
- epsilon 1.0 to 0.01 over first 10%: L05/docs/en.md:137
- normalize advantages per batch: L07/docs/en.md:134; L08/docs/en.md:143
- exp(log_new - log_old) for numerical stability: L08/docs/en.md:145
- K = 10 epochs, minibatches of 64: L08/docs/en.md:66
