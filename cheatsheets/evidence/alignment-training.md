# Evidence: cheatsheets/alignment-training.md

Abbreviations: A = phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal, B = phases/18-ethics-safety-alignment/03-direct-preference-optimization-family, C = phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif, D = phases/10-llms-from-scratch/07-rlhf, E = phases/10-llms-from-scratch/08-dpo. d = docs/en.md, c = code/main.py.

## RLHF vs RLAIF vs DPO (comparison, 8 rows)
- Preference signal: human labelers A/d:21, D/d:36. Feedback model reads principles C/d:30. Human or AI prefs C/d:66
- Reward model: required (separate training) and implicit E/d:123. RM on AI-generated preferences C/d:30
- RL algorithm: PPO (complex, unstable) and supervised learning (stable) E/d:124. PPO against the RM C/d:30
- Models to train: 3 (SFT + reward + policy) and 1 (policy only) E/d:120. RLAIF same as RLHF: "Everything else is InstructGPT's pipeline" C/d:30, 32
- Models in memory: 3-4 and 2 (current + reference) E/d:125
- Hyperparameters: E/d:122
- Online loop: RLHF retrains the RM on new ratings, DPO uses a fixed dataset, CAI uses the iterative property E/d:144
- Main failure: reward hacking A/d:53. Goodhart persists, sycophancy drops C/d:38. Reference policy ratio over-optimized B/d:113

## DPO 家族损失 (comparison, 6 rows)
- Data: KTO unpaired E/d:150, 160, B/d:76. Pairs for IPO, SimPO, ORPO B/d:63, 83-87, 99, E/d:161-162
- Reference policy: IPO formula uses pi_ref B/d:63. KTO Yes, ORPO No, SimPO No E/d:160-162, B/d:80, 103
- Fixes: unbounded gap B/d:54, 66. Unpaired data B/d:76. Length bias B/d:90. Single stage, no separate SFT checkpoint B/d:103
- Loss shape: IPO squared error, 1/(2 beta) B/d:60-66. KTO prospect theory, loss aversion B/d:70-76. SimPO length-normalized with margin gamma B/d:80-90. ORPO NLL plus lambda odds ratio B/d:94-101
- Toy functions: B/c:206, 212, 215, 218
- Toy defaults: train_dpo beta 0.1 B/c:77 (IPO uses train_dpo). train_kto beta 0.1 B/c:130. train_simpo beta 1.5, gamma 0.5 B/c:112-113. train_orpo lam 0.1 B/c:151

## 何时选用 (tips, 8 bullets)
- DPO with 5,000-20,000 pairs: E/d:132. About one third of the compute: E/d:134
- SimPO when length bias is evident: B/d:117
- KTO for unpaired binary feedback: B/d:118
- ORPO for a single-stage pipeline from a base model: B/d:119
- BPO for degraded chosen log-probs in DPO logs: B/d:120
- IPO when preference strengths vary widely and DPO saturates: B/d:121
- RLHF for many dimensions of "better" or an online loop: E/d:142, 144
- RLAIF replaces the labeler with a model that reads explicit principles: C/d:17

## InstructGPT 流水线 (architecture, 8 nodes, 10 edges)
- Base model completes text: A/d:19. Base to SFT: D/d:34, 43
- SFT with cross-entropy on prompt-response pairs: A/d:27
- Preference pairs (prompt, winner, loser) generated from SFT: D/d:48
- Human annotators rank K completions: A/d:33, D/d:49
- Reward model, scalar head, Bradley-Terry: A/d:39, D/d:50, 72, 78
- Policy initialized from SFT and reference frozen SFT: D/d:54-55
- Response to RM, reward to PPO, KL penalty from reference, PPO updates policy: D/d:56-60
- PPO objective reward - beta * KL: D/d:119

## Constitutional AI 流水线 (flow, 7 steps)
1. Helpful but not yet harmless SFT model answers a red-team prompt: C/d:24
2. A second model reads a sampled principle and critiques: C/d:24
3. Revision; the revised response is the SFT target: C/d:24
4. Feedback model scores pairs against sampled principles: C/d:30
5. Reward model on AI-generated preferences: C/d:30
6. PPO against it, rest is InstructGPT pipeline: C/d:30
7. Constitutional Classifiers gate outputs, v1 23.7%, v2 ~1%: C/d:58

## 损失公式 (concepts, 8 bullets)
- Bradley-Terry RM loss: A/d:36, D/d:81
- RLHF objective with KL to pi_SFT: A/d:48
- PPO-ptx: A/d:60
- Implicit reward: B/d:155, E/d:47
- DPO loss: B/d:46-50, E/d:66
- IPO squared error, bounded margin: B/d:63, 66
- SimPO: B/d:83-87
- ORPO, no reference policy: B/d:98, 103

## 代码中的两种成对损失 (annotated-code, 12 lines)
- bradley_terry_loss, diff, loss: D/c:92-95
- dpo_loss signature with beta=0.1: E/c:94-100
- preferred_ratio, rejected_ratio: E/c:101-102
- logit, loss: E/c:104, 106
- preferred_reward, rejected_reward: E/c:108-109
- reward_margin entry: E/c:117. Margin should increase over training: E/d:309
- 4 log-probs per pair: E/d:270. No reward model: E/d:274

## 代码中的玩具流水线 (task-table, 8 rows)
- python3 code/main.py: A/c:7, B/c:10, C/c:9
- stage3_ppo(sft, rm, beta=0.1): A/c:186
- stage3_ppo(sft, rm, beta=0.0): A/c:190
- stage2_reward_model(bias=[0.5, 0.0, 0.0]): A/c:195
- train_dpo(pairs, variant="bpo"): B/c:209
- build_cai_sft_corpus(500): C/c:144
- ai_feedback_rank(a, b): C/c:113
- betas=[0.01, 0.1, 0.3, 1.0]: E/c:457

## 故障排查 (troubleshooting, 8 rows)
- beta too low, reward hacking: A/d:53. RM blind spots exploited: D/d:102. Stronger KL penalty: D/d:166
- beta too high, no improvement over SFT: A/d:53
- Alignment tax and PPO-ptx: A/d:57
- Verbosity: D/d:161. Adversarial RM data: D/d:166. SimPO removes length-bias incentive: B/d:90
- Sycophancy from annotators: D/d:162. Multiple reward models and adversarial examples: D/d:166
- Degraded Chosen Response and BPO: B/d:55, 107, 120
- Unbounded gap and IPO cap 1/(2 beta): B/d:54, 66, 156
- Peak-and-collapse curves, better data, ensembles, early stopping: B/d:111, 113

## 默认值 (defaults, 8 rows)
- kl_coeff 0.02: D/c:227, D/d:110, 172. Llama 2 Chat 0.01: D/d:173
- PPO lr 1.5e-5, 256K episodes, 4 PPO epochs per batch: D/c:226, D/d:110
- Clip epsilon typically 0.2: D/d:133
- DPO beta 0.1: E/c:99, 147. Sweet spot 0.1 to 0.3: E/d:504
- DPO lr 5e-6, num_epochs=5 in dpo_train: E/c:141, 145-146
- RM lr 1e-4, num_epochs=10 in train_reward_model: D/c:98
- stage3_ppo steps 300, batch 32, lr 0.1: A/c:118-120
- KTO toy loss aversion weight 2.0: B/c:144. Lesson 08 typically 1.5x: E/d:623

## 问题 (qa, 6 bullets)
- 1.3B preferred over 175B about 70%, different axis: A/d:67, 69
- Capability floor set by the base model: A/d:70
- Humans bad at absolute scores, good at comparisons: D/d:86
- RM about 72% on held-out, inter-annotator about 73%: D/d:347
- RLAIF signal legible, principle, critique, revision: C/d:37, C/c:170-172
- DAAs do not escape Goodhart, reference policy ratio: B/d:113
