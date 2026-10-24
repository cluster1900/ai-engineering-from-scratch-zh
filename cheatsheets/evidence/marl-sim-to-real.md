# Evidence: cheatsheets/marl-sim-to-real.md

Abbreviations: MA = phases/09-reinforcement-learning/10-multi-agent-rl, S2R = phases/09-reinforcement-learning/11-sim-to-real-transfer, MX = phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo, VLA = phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot. d = docs/en.md, c = code/main.py.

## 核心概念与公式 (concepts, 8)
- Markov game tuple, own reward: MA/d:176, MA/d:24
- cooperative, adversarial, general-sum: MA/d:24
- non-stationarity depends on pi_-i: MA/d:28
- CTDE critic Q(s, a_1..a_n), policy on o_i: MA/d:38
- QMIX monotonic, df/dQ_i >= 0: MX/d:47-48
- COMA advantage: MA/d:181
- reality gap: S2R/d:14, S2R/d:140
- 30 Hz loop, 33ms per action: VLA/d:25

## MADDPG、QMIX、MAPPO (comparison, 7 rows)
- Year 2017, 2018, 2022: MX/d:3
- Idea: per-agent critic sees all MX/d:32, monotonic mixing MX/d:154, centralized value function MX/d:59
- Setting: cooperative, competitive, mixed MX/d:3, cooperative only MX/d:45, cooperative MX/d:65
- Testbed: Particle World MX/d:24, SMAC MX/d:25, MAPPO five benchmarks MX/d:61
- Learning: off-policy DDPG and on-policy PPO MX/d:158, value decomposition MX/d:43
- Key trait: ~10 agents MX/d:41, monotonic restrictive MX/d:55, minimal tuning and stable MX/d:62-63
- Status: MADDPG introduced CTDE MX/d:3, QMIX dominant on SMAC MX/d:3, MAPPO default baseline MX/d:65

## CTDE：集中训练，分散执行 (architecture, 6 nodes)
- Agent 1 obs, local only at deploy: MX/d:39, MX/d:82
- Agent 2 obs, local only at deploy: MX/d:82
- Actor 1 mu_i(o_i) maps own observation to action: MX/d:32
- Actor 2 mu_i(o_i) maps own observation to action: MX/d:39
- environment, joint action, shared reward: MA/d:57, MA/d:79
- centralized critic sees all observations and actions in training: MX/d:3, MX/d:32

## 仿真到现实的流程（四足机器人） (flow, 6 steps)
1. parallel sim with randomized gravity, friction, motor gains, payload: S2R/d:43
2. teacher with privileged info: S2R/d:44
3. student from proprioception: S2R/d:45
4. optional autoencoder observation adaptation: S2R/d:46
5. zero-shot on 10+ environments: S2R/d:47
6. minutes of real fine-tuning with safety-constrained PPO: S2R/d:47

## 独立 Q 与联合 Q 对比 (annotated-code, 8 lines)
- a1, a2 epsilon_greedy: MA/c:50-51
- joint step with (a1, a2): MA/c:52
- target1 and Q1 update: MA/c:58, MA/c:60
- reward = 10.0 if done else -1.0: MA/c:26
- joint_actions list, 16 pairs: MA/c:69, MA/d:79
- ja = max(joint_actions, key=...): MA/c:79

## 代码中的域随机化 (annotated-code, 7 lines)
- slip_ep = rng.uniform(slip_low, slip_high): S2R/c:56
- step with slip_ep, perpendicular slip: S2R/c:14-16, S2R/c:60
- Q_fixed = train_fixed(0.0, rng=rng): S2R/c:97
- Q_dr = train_dr(0.0, 0.3, rng=rng): S2R/c:99
- slip sweep and evaluate calls, OOD label above 0.3: S2R/c:103-110

## 四个 VLA 并列对比 (comparison, 5 rows)
- Action format: RT-2 256 bins VLA/d:32, OpenVLA 256 bins VLA/d:45, pi0 flow-matching expert VLA/d:59, GR00T System 1 action head VLA/d:74
- Backbone: PaLM-X VLA/d:34, 7B Llama + DINOv2 + SigLIP VLA/d:45, small action transformer VLA/d:61, large VLM + small action head VLA/d:73-74
- Speed: 3-5 Hz VLA/d:41, 4-5 Hz on an A100 VLA/d:49, ~5 denoising steps, 50 Hz VLA/d:63, 50-100 Hz and ~1 Hz VLA/d:73-74
- Detail: 10 tokens per step VLA/d:32, LoRA fine-tuning VLA/d:47, 50-step sequence VLA/d:61, >30 DOF VLA/d:71
- Data: ~1:1 VLA/d:94, Open X-Embodiment VLA/d:47, VLA/d:88, ~0.5:1 VLA/d:94, similar VLA/d:94, Omniverse sim-to-real VLA/d:78

## 代码中的任务 (task-table, 8)
- independent_q(episodes=1500, ...): MA/c:41, MA/c:131
- joint_q_learning(episodes=1500, ...): MA/c:67, MA/c:132
- train_dr(0.0, 0.3, rng=rng): S2R/c:99
- evaluate(Q_dr, slip): S2R/c:105
- bench(label, runner) with run_mappo_style: MX/c:131, MX/c:148
- python3 code/main.py: MX/d:120
- discretize(action, bins=256): VLA/c:15, VLA/c:86
- fast_compress(trajectory, keep_coeff=4): VLA/c:41, VLA/c:69

## 课程代码中的默认值 (defaults, 8)
- alpha 0.1: MA/c:41, S2R/c:35
- gamma 0.95: MA/c:41, S2R/c:35
- epsilon / eps 0.15: MA/c:41, S2R/c:35
- episodes 1500, 3000 in DR: MA/c:41, S2R/c:35, S2R/c:52
- Uniform[0.0, 0.3]: S2R/c:93, S2R/c:99
- max_steps 50, 500 trials: MX/c:69, MX/c:133
- bins 256, bin width 2/255: VLA/c:15, VLA/c:92
- keep_coeff 4: VLA/c:41, VLA/c:69

## 故障排查 (troubleshooting, 8)
- policy drift / chasing, centralized critic, slow LR, freeze-one-at-a-time: MA/d:120
- non-stationary replay, relabel or weight by recency: MA/d:118
- credit assignment, COMA or per-agent shaping: MA/d:114
- league cycles, league play: MA/d:118
- too much randomization, match expected real distribution: S2R/d:83
- misidentified parameter space, profile the real robot: S2R/d:85
- privileged info leakage, teacher realizable by student: S2R/d:86
- no safety envelope, rate, torque, joint limits in a non-learned controller: S2R/d:88

## 缩写 (glossary, 8)
- CTDE: MA/d:177
- IPPO: MA/d:178
- COMA: MA/d:40, MA/d:181
- DR: S2R/d:141
- SI: S2R/d:142
- ADR: S2R/d:146
- VLA: VLA/d:143
- FAST: VLA/d:53

## 经验法则 (tips, 7)
- start with MAPPO: MX/d:133
- independent Q only for loosely-coupled tasks: MA/d:36, MA/d:158
- self-play for zero-sum, league for cycles: MA/d:44, MA/d:46
- log every agent's stream: MX/d:134
- held-out sim variant test: S2R/d:87
- DR range wider than 3x measured variability: S2R/d:127
- LoRA on 100-1000 demos: VLA/d:88

## 问答 (qa, 5)
- independent Q fails on tightly-coupled tasks: MA/d:101
- monotonic mixer lets each agent argmax: MX/d:51
- slip 0.0 training drops once real slip > 0: S2R/d:79
- robot-only fails on new instructions: VLA/d:96
- slow planning does not block fast control: VLA/d:76
