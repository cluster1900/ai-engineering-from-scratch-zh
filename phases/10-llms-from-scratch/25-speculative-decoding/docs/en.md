# Speculative Decoding 和 EAGLE

> frontier LLM 生成一个 Token 需要对数十亿参数进行一次完整 forward pass。这个 forward pass 的配置远超实际需要：大多数时候，一个小得多的 model 就能正确猜出接下来的 3-5 个 Token，而大 model 只需要 *verify* 这个猜测。猜对时，你就以一次的成本得到了 5 个 Token。Speculative decoding（Leviathan et al. 2023）让这一过程变得精确，而 EAGLE-3（2025）将 acceptance rate 提升到每次 verify 约 4.5 个 Token，在输出 distribution 匹配的情况下实现 4-5x speedup。

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

## 问题

70B 级别 model 在 H100 上的 decode throughput 通常是 40-80 tokens/second。每个 Token 都需要一次完整 forward pass，从 HBM 读取所有 model weights。你不能在不改变输出的情况下缩小 model。你也不能在内存之外继续增加 batch size。你卡住了，除非能让 model 每次 forward pass 输出不止一个 Token。

Autoregressive generation 看起来天然是串行的：`x_{t+1} = sample(p(· | x_{1:t}))`。但这里存在并发机会。如果你有一个廉价 predictor 说“接下来的 4 个 Token 很可能是 [a, b, c, d]”，你就可以在**大 model 的单次 forward pass** 中 verify 全部 5 个位置，并接受最长匹配前缀。

Leviathan、Kalai、Matias（2023，“Fast Inference from Transformers via Speculative Decoding”）通过一个巧妙的 accept/reject 规则精确实现了这一点，该规则保留 target model 的 sampling distribution。相同的输出 distribution，速度提升 2-4x。

## 概念

### 双 Model 设置

- **Target model** `M_p`：你真正想从中采样的大型、缓慢、高质量 model。Distribution：`p(x)`。
- **Draft model** `M_q`：小型、快速、质量较低的 model。Distribution：`q(x)`。小 5-30x。

每一步：

1. Draft model autoregressively 提议 `K` 个 Token：`x_1, x_2, ..., x_K ~ q`。
2. Target model 对全部 `K+1` 个位置并行运行一次 forward pass，为每个提议 Token 生成 `p(x_k)`。
3. 按下面修改后的 rejection-sampling 规则从左到右 accept/reject 每个 Token。接受最长匹配前缀。
4. 如果任意 Token 被 reject，则从修正后的 distribution 中采样替换 Token 并停止。否则从 `p(· | x_1...x_K)` 采样一个 bonus Token。

如果 draft 与 target 完全匹配，你每次 target-forward 可得到 K+1 个 Token。如果 draft 在位置 1 就错了，你只能得到 1 个 Token。

### 精确性规则

Speculative decoding **在 distribution 上可证明等价于从 p 采样**。Rejection 规则：

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

其中 `(p - q)+` 表示逐点差值的正部。当 draft 和 target 一致（`p ≈ q`）时，acceptance 接近 1。当它们不一致时，residual distribution 会被构造出来，使整体 sample 仍然精确服从 `p`。

**Greedy 情况。** 对 temperature=0 sampling，只需检查 `argmax(p) == x_t`。如果是，则 accept；如果不是，则输出 `argmax(p)` 并停止。

### 期望 Speedup

如果 draft model 的 Token 级 acceptance rate 是 `α`，则每次 target-forward pass 生成的期望 Token 数为：

```
E[tokens] = (1 - α^{K+1}) / (1 - α)        # K = draft length, α in [0, 1]
```

当 `α = 0.8, K = 4`：`(1 - 0.8^5)/(1 - 0.8) = 3.36` 个 Token 每次 forward。一次 target forward 的成本大约是 `cost_q * K + cost_p`（K 个 draft step 加一次 target verify）。如果 `cost_p >> cost_q * K`，throughput 的 speedup ratio 就是 `3.36× / 1 = 3.36×`。

唯一真正的参数是 `α`，它完全取决于 draft-target alignment。好的 draft 就是一切。

### 训练 Draft：Distillation

随机的小 model 会成为很差的 draft。标准做法是从 target distill：

1. 选择一个小 architecture（70B target 对应约 1B，7B target 对应约 500M）。
2. 在大规模文本语料上运行 target model；存储它的 next-token distributions。
3. 使用 KL divergence 训练 draft，使其匹配 target 的 distribution（而不是匹配 ground-truth tokens）。

结果是：`α` 在 coding 上通常为 0.6-0.8，在自然语言 chat 上为 0.7-0.85。生产中的 speedups 为 2-3x。

### EAGLE：Tree Drafting + Feature Reuse

Li、Wei、Zhang、Zhang（2024，“EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty”）观察到标准 speculative decoding 中的两个低效点：

1. Draft 执行 K 个串行 step，每个都是 full-stack。但 draft 可以复用最近一次 verify 中 target 的 features（hidden states），因为 target 已经计算了丰富的 representations，而 draft 正在从头重新推导它们。
2. Draft 输出一条线性链。如果 draft 能输出一个候选 *tree*（每个节点有多个猜测），target 的单次 forward pass 就可以通过 tree attention mask 并行 verify 多条 candidate path，并选择最长 accepted branch。

EAGLE-1 的变化：
- Draft input = target 在位置 t 的最终 hidden state，而不是 raw tokens。
- Draft architecture = 1 个 transformer decoder layer（不是独立的小 model）。
- Output = 每个 depth 有 K = 4-8 个 candidate、depth 为 4-6 的 tree。

EAGLE-2（2024）加入动态 tree topology：在 draft 不确定的位置，tree 变宽；在 draft 自信的位置，tree 保持较窄。在不增加 verify cost 的情况下提高 `α_effective`。

EAGLE-3（Li et al. 2025，“EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test”）移除了固定 top-layer feature dependency，并用新的 “test-time simulation” loss 训练 draft，也就是让 draft 在匹配 target test-time distribution 的输出上训练，而不是在 teacher-forced training distribution 上训练。Acceptance rate 从 0.75（EAGLE-2）提升到 0.82（EAGLE-3），mean tokens/verify 从 3.0 提升到 4.5。

### Tree Attention Verification

当 draft 输出 tree 时，target model 使用 **tree attention mask** 在单次 forward pass 中 verify 它。tree attention mask 是一种 causal mask，它编码 tree topology，而不是纯线性结构。每个 Token 只 attend 到它在 tree 中的 ancestors。Verify pass 仍然是一次 forward、一次 matmul；topological mask 只需要少量额外 KV entries。

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

如果 `a, b` 是竞争的 first-token candidates，`c, d, e, f` 是 second-token candidates，那么全部六个位置都能在一次 forward pass 中被 verify。输出是任意 accepted path 上的最长前缀。

### 什么时候有效，什么时候无效

**有效：**
- Chat / completion，且文本可预测（code、常见 English、structured output）。`α` 高。
- Decode 阶段有未使用 GPU compute 的设置（memory-bound phase）。Tree drafting 使用可用 FLOPs。

**无效 / 没有收益：**
- 高随机性输出（高 temperature 的 creative writing）。`α` 会向 `1/|vocab|` 下降。
- 非常高 concurrency 的 batch serving，batching 已经填满 FLOPs，tree verification 的空间很小。
- 非常小的 target models，此时 draft 并没有小很多。

生产团队通常报告 chat 上有 2-3x wall-clock speedup，code generation 上有 3-5x，而 creative writing 上接近零。


```figure
speculative-decoding
```

## 构建它

`code/main.py`：

- 一个参考实现 `speculative_decode(target, draft, prompt, K, temperature)`，它实现精确 rejection 规则，并验证它保留 target 的 distribution（empirical KL < 0.01 vs plain target sampling）。
- 一个 EAGLE-style tree drafter，使用 top-p branching 构建 depth-K tree。
- 一个 tree attention mask builder，为 verifier 生成正确的 causal pattern。
- 一个 acceptance-rate harness，在 tiny LM 上运行两者（从 GPT-2-medium target distill 一个 GPT-2-small）。

```python
def speculative_step(p_target, q_draft, K, temperature=1.0):
    """One round of speculative decoding. Returns list of accepted tokens."""
    # 1. Draft K tokens
    draft_tokens = []
    q_probs = []
    state = draft_state_init()
    for _ in range(K):
        probs = softmax(q_draft(state) / temperature)
        t = np.random.choice(len(probs), p=probs)
        draft_tokens.append(t)
        q_probs.append(probs[t])
        state = draft_step(state, t)

    # 2. Target computes p at every drafted position + 1 extra
    p_probs_all = target_forward_batched(p_target, draft_tokens, temperature)

    # 3. Accept/reject left-to-right
    accepted = []
    for k, tok in enumerate(draft_tokens):
        r = np.random.uniform()
        if r < p_probs_all[k][tok] / q_probs[k]:
            accepted.append(tok)
        else:
            residual = np.maximum(p_probs_all[k] - q_probs[k], 0)
            residual /= residual.sum()
            accepted.append(np.random.choice(len(residual), p=residual))
            return accepted
    # 4. All K accepted → sample bonus token from target
    accepted.append(np.random.choice(len(p_probs_all[-1]), p=p_probs_all[-1]))
    return accepted
```

## 使用它

- **vLLM** 和 **SGLang** 提供一等 speculative decoding 支持。Flags：`--speculative_model`、`--num_speculative_tokens`。EAGLE-2/3 通过 `--spec_decoding_algorithm eagle` flag 支持。
- **NVIDIA TensorRT-LLM** 原生支持 Medusa 和 EAGLE trees。
- **Reference draft models**：`Qwen/Qwen3-0.6B-spec`（用于 Qwen3-32B 的 drafts）、`meta-llama/Llama-3.2-1B-Instruct-spec`（用于 70B 的 drafts）。
- **Medusa heads**（Cai et al. 2024，“Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads”）：不使用 draft model，而是在 target 自身上添加 K 个并行 prediction heads。部署更简单，acceptance 略低于 EAGLE。

## 交付它

本课会产出 `outputs/skill-speculative-tuning.md`，这是一个 skill，用于分析 target model 的 workload，并选择：draft model、K（draft length）、tree width、temperature，以及何时 fallback 到 plain decode。

## 练习

1. 实现精确 rejection 规则并进行实证验证。通过 `speculative_decode` 和 plain target sampling 分别运行 10K samples；计算两个输出 distributions 之间的 TV distance。应小于 0.01。

2. 计算 speedup 公式。给定固定 `α` 和 `K`，绘制每次 target-forward 的期望 Token 数。找出 α ∈ {0.5, 0.7, 0.9} 时的最优 K。

3. 训练一个 tiny draft。取一个 124M GPT-2 target，并在 100M tokens 上用 KL loss distill 一个 30M GPT-2 draft。测量 held-out text 上的 `α`。预期：0.6-0.7。

4. 实现 EAGLE-style tree drafting。不要使用 chain，而是让 draft 在每个 depth 输出 top-3 branches。构建 tree attention mask。验证 target 接受最长正确 branch。

5. 测量 failure modes。在 temperature=1.5（高随机性）下运行 speculative decode。展示 α 崩塌，并且由于 draft overhead，该 algorithm 比 plain decode 更慢。

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|------------------------|
| Target model | “大 model” | 你想从中采样的缓慢、高质量 model（p distribution） |
| Draft model | “speculator” | 小型、快速 predictor（q distribution）；小 5-30x |
| K / draft length | “Look-ahead” | 每次 verify pass 推测的 Token 数 |
| α / acceptance rate | “Hit rate” | draft 提议被接受的每 Token 概率 |
| Exact rejection rule | “accept test” | 保留 target distribution 的 r < p/q 比较 |
| Residual distribution | “修正后的 p-q” | (p - q)+ / ||(p - q)+||_1，rejection 时要从中采样的 distribution |
| Tree drafting | “Branching speculation” | Draft 输出候选 tree，并用 tree-structured attention mask 在一次 pass 中 verify |
| Tree attention mask | “Topological mask” | 编码 tree topology 的 causal mask，使每个 node 只 attend 到它的 ancestors |
| Medusa heads | “Parallel heads” | target 自身上的 K 个额外 prediction heads；没有独立 draft model |
| EAGLE feature reuse | “Hidden-state draft” | Draft input 是 target 的最后 hidden state，而不是 raw tokens，从而缩小 draft |
| Test-time simulation loss | “EAGLE-3 training” | 在匹配 target test-time distribution 的输出上训练 draft，而不是 teacher forcing |

## 延伸阅读

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192) — 精确 rejection 规则和理论 speedup 分析
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318) — DeepMind 的 concurrent speculative-sampling 论文
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774) — draft model 的 parallel-heads 替代方案
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077) — feature reuse 和 tree drafting
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) — 动态 tree topology
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840) — train-time test-time matching
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) — Jacobi/lookahead decoding，一种不需要 speculator 的替代方案
