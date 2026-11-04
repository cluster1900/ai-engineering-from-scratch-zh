# Evidence: cheatsheets/speculative-decoding.md

Abbreviations: L16 = phases/07-transformers-deep-dive/16-speculative-decoding, L15 = phases/10-llms-from-scratch/15-speculative-decoding-eagle3, L18 = phases/10-llms-from-scratch/18-multi-token-prediction, L25 = phases/10-llms-from-scratch/25-speculative-decoding, P17 = phases/17-infrastructure-and-production/05-eagle3-speculative-decoding, C14 = phases/19-capstone-projects/14-speculative-decoding-server. d = docs/en.md, c = code/main.py.

## 草稿类型并列对比 (comparison, 7 rows)
- Draft: Separate small LLM, Extra LM heads on verifier, Multi-layer feature fusion + TTT: L15/d:64-68. MTP 1 transformer block + projection: L18/d:106
- Trained when: EAGLE-3 post-pre-training, MTP during pre-training: L18/d:104. Medusa needs SFT stage: L16/d:69. Vanilla reuses existing small model: L15/d:64
- Training cost: None, ~1B SFT tokens, ~60-200B tokens: L15/d:64-68. MTP slows training by about 10%: L18/d:92
- α: 0.55-0.70, 0.65-0.75, 0.88-0.92: L15/d:64-68. MTP 0.80+ at depth 1: L18/d:107
- Speedup: 1.8-2.3×, 2-3×, 3.5-6.5×: L15/d:64-68. MTP 1.8×: L18/d:75, L18/d:96
- Second model: Medusa no second model: L16/d:69. MTP part of the model: L18/d:100. EAGLE-3 tiny draft: L16/d:73
- Existing weights: EAGLE-3 yes, MTP no (re-train): L18/d:105. Medusa needs fine-tune: L16/d:178

## 一次投机步骤 (flow, 7 steps)
1. Draft proposes N with p_1..p_N: L16/d:32
2. Verifier runs once, q_1..q_{N+1}: L16/d:33
3. Accept with min(1, q_i(d_i)/p_i(d_i)) left to right: L16/d:34
4. Residual (q_j - p_j)_+ normalized, discard later drafts: L16/d:35
5. Bonus token from q_{N+1}: L16/d:36
6. Roll cache back to accepted prefix: L16/d:79, L15/d:56
7. Identically distributed to verifier: L16/d:14, L15/d:21

## 代码中的循环 (annotated-code, 13 lines)
- Loop body from spec_step: L15/c:81-97
- ratio and min(1.0, ratio): L15/c:85-86
- kv.extend(1) on accept: L15/c:88
- sample(residual(q, p), rng) and kv.truncate_to(prefix_len + len(emitted)): L15/c:90-92
- return emitted, 1: L15/c:93
- bonus = sample(q, rng): L15/c:95-96

## 服务技术栈 (architecture, 8 nodes, 7 edges)
- Request ingress: C14/d:25
- vLLM or SGLang server, one replica per GPU: C14/d:28, C14/d:21
- Draft: EAGLE-3 heads, ngram fallback: C14/d:30
- Target quantized FP8 or INT4: C14/d:31-32
- Verify pass, batch k draft tokens: C14/d:35
- Token stream, accepted prefix, resample rejected suffix: C14/d:37-39
- Prometheus metrics: acceptance rate, queue wait, latency p50/p99: C14/d:42
- HPA on queue-wait metric: C14/d:45, C14/d:21

## 命令 (command-table, 4)
- vllm serve with method eagle and num_speculative_tokens 5: L16/d:163-164
- method draft_model with meta-llama/Llama-3.2-1B-Instruct: L16/d:167-168
- method eagle3: L15/d:121-126
- python main.py --vocab 64 --alpha 0.75 --k 4 --samples 50000: L25/c:22. Three things the file proves: L25/c:1-16

## 课程中的函数 (task-table, 8)
- residual(q, p): L16/c:25, L15/c:33
- spec_step(q, p, N, kv, rng): L15/c:61
- expected_tokens_per_verify(alpha, N): L15/c:148, L16/c:108
- wall_time_per_token(alpha, N, c): L15/c:156
- expected_speedup(p): P17/c:23
- tree_attention_mask(tree): L25/c:145
- chi_square(observed, expected): L16/c:80, L15/c:122
- m.acceptance_rate(k): C14/c:111, C14/c:178

## 加速比公式 (concepts, 8)
- E[accepted] formula: L15/d:36-38
- α = 0.8, K = 4 gives 3.36: L25/d:60
- (N * c + 1) / E[accepted], c = cost(draft) / cost(verifier): L15/d:34, L15/d:40
- α is the single biggest lever: L15/d:42
- S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead): P17/d:64
- alpha_breakeven = verify_overhead / K; rises with concurrency: P17/d:64
- L_MTP = λ/D Σ L_k, lambda 0.3 then 0.1: L18/d:63-67

## 脚本默认值 (defaults, 6)
- --vocab default 32, >= 2: L25/c:188-189
- --alpha default 0.75, in (0, 1]: L25/c:190-191
- --k default 4, >= 1: L25/c:192-193
- --samples default 20000: L25/c:194-195
- --seed default 0: L25/c:196
- simulate_tail n_tokens default 1000: P17/c:42

## 排障 (troubleshooting, 7)
- EAGLE-3 opt-in, speculative_config must be set: P17/d:25
- P99 can get worse, rejected drafts two-pass, watch P99 ITL: P17/d:56
- α < 0.55: disable or train a domain-specific draft: P17/d:37, P17/d:51
- High-temperature sampling where α collapses: L15/d:141, L25/d:111, L25/d:185
- High concurrency, batching fills FLOPs: L25/d:112, P17/d:35. Break-even rises with concurrency: P17/d:64
- Cache past position j-1 wrong, truncate: L15/d:56, L15/d:107
- Very small models (< 3B), draft not much cheaper: L15/d:139

## 何时用各草稿 (tips, 7)
- Vanilla: fast prototype, no training: L16/d:177
- Medusa: you can fine-tune the verifier: L16/d:178
- EAGLE-2/3: production, max speed: L16/d:179
- Lookahead: no draft, no training, no extra params, 1.3–1.6×: L16/d:180
- MTP: control the pre-training pipeline, hidden size at least 4096: L18/d:161-163
- Chat latency, code and JSON, long-form generation: L15/d:133-135
- Under 50 tokens, batch-1 offline: P17/d:68-69

## 缩写 (glossary, 7)
- α acceptance rate: L16/d:205
- K draft length typical 4-8: P17/d:100
- EAGLE hidden-state draft: L16/d:209
- TTT, draft fed its own outputs: L15/d:166
- MTP module predicts k positions ahead: L18/d:190
- P99 ITL, not P50: P17/d:56
- HPA autoscales on queue-wait rather than CPU: C14/d:21

## 问题 (qa, 5)
- No quality tradeoff, identical distribution: L15/d:21, L16/d:14
- Decode memory-bound, compute idle: L15/d:17, P17/d:19
- accepted_tokens_per_request divided by requested draft length: P17/d:50
- EAGLE-3 drops the feature-prediction loss, training-time test: L15/d:52, L15/d:165
- Sequential MTP preserves the causal chain, usable as draft: L18/d:73
