# Evidence: cheatsheets/value-vs-policy-rl.md

Abbreviations: R = phases/09-reinforcement-learning. L04 = R/04-q-learning-sarsa, L05 = R/05-dqn, L06 = R/06-policy-gradients-reinforce, L07 = R/07-actor-critic-a2c-a3c, L08 = R/08-ppo. d = docs/en.md, c = code/main.py.

## 四种方法并列对比 (comparison, 7 rows)
- Learns: Q table L04/d:71, neural Q(s, a; theta) L05/d:14, policy pi_theta L06/d:14, actor and critic L07/d:28-29
- Picks actions: epsilon-greedy L04/d:38, L05/d:116, sample from pi L06/d:14, L07/d:28
- Data: off-policy vs on-policy L04/d:38, L04/d:46, replay L05/d:36, one update then throw away L06/d:142, A2C one update L07/d:136, PPO K epochs L08/d:3, L08/d:60
- Target: max target L04/d:35, target net theta^- L05/d:29-32, return G_t L06/d:27-30, GAE L07/d:47, L08/d:58
- Bias and variance: TD bias, lower variance L04/d:16, max biased upward L04/d:127, REINFORCE variance L06/d:34, TD advantage far lower variance L07/d:34
- Continuous actions: argmax breaks L06/d:12, route to SAC / TD3 L05/d:151, L05/d:182, Gaussian policy L06/d:61, L06/d:152
- Toy GridWorld: ~2,000 episodes L04/d:116, ~500 episodes L05/d:132, ~500 episodes with baseline L06/d:135, PPO epsilon 0.2, K 4 L08/d:190

## 何时用 X (tips, 8)
- Q-learning small tabular, learns optimal policy directly: L04/d:137
- SARSA / Expected SARSA on-policy safety-critical, conservative: L04/d:138
- DQN high-dimensional state, reference off-policy: L04/d:139, L05/d:146
- REINFORCE rarely run, loss = -advantage * log_prob: L06/d:148, L06/d:159
- GPU-based A2C dominates: L07/d:54, L07/d:127
- PPO default for MuJoCo, Atari, RLHF: L08/d:150-156
- SAC / TD3 continuous control, DQN has no policy network: L05/d:151
- GRPO reasoning LLMs, PPO without critic: L08/d:158

## DQN 训练循环 (architecture, 5 nodes)
- Environment, 4x4 GridWorld: L05/c:5, L05/c:154
- Replay buffer capacity 2000: L05/c:122-123, L05/c:140-142
- Online net, minibatch 32, epsilon-greedy action: L05/c:119, L05/c:124, L05/c:137, L05/c:143-145
- Target net frozen copy, clone every 200 steps: L05/c:120, L05/c:127, L05/c:147-148, L05/d:38
- train_step with squared TD error, y = r + gamma * max(q_next): L05/c:69, L05/c:85-88

## PPO 训练循环 (flow, 8 steps)
1. N x T transitions across N envs: L08/d:57, L08/c:67
2. log_pi_old stored at rollout time: L08/d:92, L08/c:82
3. GAE, frozen, normalized: L08/d:58, L08/d:96, L08/c:128
4. K epochs over shuffled minibatches: L08/d:60, L08/c:123-127
5. ratio = exp(logp - rec["log_pi_old"]): L08/d:107, L08/c:134
6. clipped samples get zero gradient: L08/d:124, L08/c:136, L08/c:143-146
7. value MSE and entropy bonus, gradient step: L08/d:62-63, L08/d:128
8. discard rollout: L08/d:64

## 价值侧：TD 目标 (annotated-code, 8 lines)
- a = epsilon_greedy(Q, s, rng, epsilon): L04/c:62
- s_next, r, done = step(s, a): L04/c:63
- best_next = max(Q[s_next].values()), target: L04/c:68-69
- a_next and SARSA target: L04/c:46-47
- Q[s][a] += alpha * (target - Q[s][a]): L04/c:48, L04/c:70
- terminal update without bootstrap: L04/c:44, L04/c:66

## 策略侧：梯度、GAE、裁剪 (annotated-code, 8 lines)
- G = r + gamma * G in returns_to_go, reversed: L06/c:74-81
- grad = onehot minus probs: L06/c:97
- theta update: L06/c:99
- delta TD residual: L07/c:88
- gae update, lam=0.95: L07/c:82, L07/c:89
- ratio = math.exp(logp - rec["log_pi_old"]): L08/c:134
- clipped condition: L08/c:136
- pg_scale = 0.0 when clipped: L08/c:143-146

## 代码中的任务 (task-table, 8)
- sarsa(episodes, alpha=0.1, gamma=0.99, ...): L04/c:32
- q_learning(episodes, alpha=0.1, gamma=0.99, ...): L04/c:54
- train_step(online, target, mb, gamma, lr): L05/c:145
- target = clone(online): L05/c:148
- reinforce(episodes, use_baseline=True, ...): L06/c:84, L06/c:139
- gae_advantages(traj, gamma=0.99, lam=0.95): L07/c:82
- actor_critic(episodes, lam=0.95, ...): L07/c:104, L07/c:171
- mean_kl, clip_frac = ppo_update(...): L08/c:112, L08/c:216

## 关键公式 (concepts, 8)
- TD error: L04/d:30
- SARSA target with next action: L04/d:43, L04/d:46
- DQN loss: L05/d:29
- Double DQN target: L05/d:45
- Policy gradient: L06/d:27
- Advantage A = G - V(s), expectation unchanged: L07/d:14-17
- GAE sum, lambda 0 TD, lambda 1 MC: L07/d:47, L07/d:50
- PPO clipped surrogate: L08/d:35

## 默认值 (defaults, 8)
- alpha 0.1, epsilon 0.1, pin alpha in [0.05, 0.3]: L04/d:116, L04/d:125
- gamma 0.99 in lesson code: L04/d:70, L04/d:97, L07/d:91
- target sync 10,000: L05/d:32, L05/d:141
- lambda 0.95 2026 default: L07/d:50
- c_v 0.5: L07/d:62, L08/d:53
- c_e 0.01: L07/d:62, L08/d:53
- epsilon 0.2, 0.1 timid, 0.3+ unstable: L08/d:45, L08/d:140
- K = 10, minibatches of 64: L08/d:66

## 排障 (troubleshooting, 8)
- overestimation from max, Double DQN / Double Q-learning: L04/d:127, L05/d:138
- deadly triad, keep target net and replay: L05/d:136
- early gradients on ~20 samples, wait for a few thousand transitions: L05/d:140
- entropy collapse, entropy bonus, c_e > 0: L06/d:140, L07/d:137
- normalize G to ~N(0, 1): L06/d:139
- random critic, warm up critic, slow actor LR: L07/d:133
- mean KL past 0.1, reduce K_EPOCHS or LR: L08/d:134
- clip fraction ~0, raise LR or K_EPOCHS: L08/d:135

## 缩写 (glossary, 8)
- TD: L04/d:16, L04/d:181
- SARSA tuple: L04/d:46
- GLIE: L04/d:185
- DQN: L05/d:194
- GAE: L07/d:44, L07/d:194
- A2C, A3C: L07/d:52-54, L07/d:195-196
- TRPO: L08/d:16
- PPO: L08/d:1, L08/d:18

## 问题 (qa, 6)
- max assumes greedy policy: L04/d:38
- SARSA factors exploration noise: L04/d:48
- argmax over a 10-dimensional torque: L06/d:12
- baseline unbiased, E[b * grad log pi] = 0: L06/d:36
- clip stops the update after drift: L08/d:124
- flipped sign, minimize -L^CLIP: L08/d:146
