# Speculative Decoding — Draft、Verify、Repeat

> Autoregressive decoding 是串行的。每个 Token 都要等待前一个 Token。Speculative Decoding 打破了这条链：一个便宜的模型先 draft N 个 Token，昂贵模型在一次 forward pass 中 verify 全部 N 个 Token。当 draft 正确时，你用一次大的 forward 就完成了 N 次生成。

**Type:** Build
**Languages:** Python
**先修要求:** Phase 7 · 07 (GPT Causal LM), Phase 7 · 12 (KV Cache & Flash Attention)
**Time:** ~60 minutes

## 问题

一个 70B LLM 在 H100 上采样一个 Token 需要约 30 ms。一个 3B draft model 需要约 3 ms。如果让 3B draft 提前生成 5 个 Token，然后让 70B *只运行一次* 来 verify 这 5 个 Token，总耗时就是 `5×3 + 30 = 45 ms`，最多可接受 5 个 Token；而直线生成需要 `5×30 = 150 ms`。这就是 Speculative Decoding 的完整卖点：用少量额外 GPU memory（draft model）换取 2–4× 更低的 decode latency。

关键在于必须保留分布。Leviathan et al. (2023) 以及 Chen et al. 同期提出的 Speculative Sampling 保证输出序列与大模型单独生成时的分布**完全相同**。没有质量折中。只是更快。

到 2026 年，四类 draft-verifier 组合主导 inference：

1. **Vanilla speculative (Leviathan 2023)。** 独立 draft model（例如 Llama 3 1B）+ verifier（例如 Llama 3 70B）。
2. **Medusa (Cai 2024)。** 在 verifier 上添加多个 decoding head，并行预测位置 `t+1..t+k`。不需要独立 draft model。
3. **EAGLE family (Li 2024, 2025)。** 复用 verifier hidden states 的轻量 draft；acceptance rate 比 vanilla 更接近；典型为 3–4×。
4. **Lookahead decoding (Fu 2024)。** Jacobi iteration；完全不需要 draft model。Self-speculation。小众但没有依赖。

2026 年的每个生产级 inference stack 都默认提供 Speculative Decoding。vLLM、TensorRT-LLM、SGLang 和 llama.cpp 至少都支持 vanilla + EAGLE-2。

## 核心概念

### 核心算法

给定一个 verifier `M_q` 和一个更便宜的 draft `M_p`：

1. 令 `x_1..x_k` 为已经 decode 的 prefix。
2. **Draft**：使用 `M_p` autoregressively 提议 `d_{k+1}, d_{k+2}, ..., d_{k+N}`，对应 draft probabilities 为 `p_1..p_N`。
3. **并行 verify**：在 `x_1..x_k, d_{k+1}, ..., d_{k+N}` 上运行一次 `M_q`，得到位置 `k+1..k+N+1` 的 verifier probabilities `q_1..q_{N+1}`。
4. **从左到右 accept/reject 每个 draft token**：对每个 `i`，以概率 `min(1, q_i(d_i) / p_i(d_i))` 接受。
5. 在位置 `j` 第一次 rejection 时：从归一化后的 "residual" distribution `(q_j - p_j)_+` 中采样 `t_j`。`j` 之后的所有 draft 都被丢弃。
6. 如果全部 `N` 个都被接受：从 `q_{N+1}` 采样一个额外 Token `t_{N+1}`（免费的 bonus token）。

residual distribution 这个技巧是让输出分布与 `M_q` 从头采样完全一致的数学洞见。

### 什么决定 speedup

令 `α` = 每个 draft token 的期望 acceptance rate。令 `c` = draft-to-verifier cost ratio。每一步中：

- Naive generation 每个 Token 需要 1 次 big-model call。
- 当 `α` 很高时，Speculative 每 `(1 - α^{N+1}) / (1 - α) ≈ 1/(1-α)` 个 Token 需要 1 次 big-model call。

在 `α = 0.75` 且 `N = 5` 时，典型经验法则是：big-model call 减少 3×。Draft cost 是 5× cheap。总体 wall-clock 约下降 2.5×。

**α 取决于：**

- draft 对 verifier 的近似程度。同 family / 同 training data 会显著提升 α。
- Decoding strategy。Greedy draft 对 greedy verifier：α 高。Temperature sampling：更难匹配；acceptance 下降。
- Task type。Code 和 structured output 接受更多（更可预测）；自由形式创意写作接受更少。

### Medusa — 没有 draft model 的 draft

Medusa 用 verifier 上的额外 output heads 替代 draft model。在位置 `t`：

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

每个 head 输出自己的 logits。Inference 时，你从每个 head 采样得到候选序列，然后用一次 forward pass 和 tree-attention scheme 同时考虑所有候选 continuation 来 verify。

优点：没有第二个模型。缺点：增加 trainable parameters；需要一个 supervised fine-tuning 阶段（约 1B Token）；acceptance rate 比使用优秀 draft 的 vanilla speculative 略低。

### EAGLE — 通过复用 hidden states 获得更好的 draft

EAGLE-1/2/3 (Li et al., 2024–2025) 将 draft model 设计为一个很小的 transformer（通常 1 层），输入 verifier 的 last-layer hidden states。因为 draft 能看到 verifier 的 feature representation，它的预测与 verifier 的输出分布高度相关。Acceptance rate 从约 0.6（vanilla）升到 0.85+。

EAGLE-3 (2025) 加入了对候选 continuation 的 tree search。vLLM 和 SGLang 将 EAGLE-2/3 作为 Llama 3/4 和 Qwen 3 的默认 spec pathway。

### KV cache dance

Verification 会把 `N` 个 draft tokens 在一次 forward pass 中喂给 verifier。这会把 verifier 的 KV cache 扩展 `N` 项。如果某些 draft 被拒绝，你必须把 cache 回滚到已接受 prefix 的长度。

生产实现（vLLM 的 `--speculative-model`、TensorRT-LLM 的 LookaheadDecoder）通过 scratch KV buffers 处理这件事。先写入，接受时再 commit。概念上不难，但细节很繁琐。

## 构建它

见 `code/main.py`。我们用以下组件实现核心 speculative-sampling 算法（rejection step + residual distribution）：

- 一个 "big model"，它是在手写分布上的 deterministic-softmax（这样可以解析验证 acceptance math）。
- 一个 "draft model"，它是 big model 的扰动版本。
- 一个 acceptance / rejection loop，生成与 direct sampling 相同的 marginal distribution。

### 步骤 1：rejection step

```python
def accept_or_reject(q_prob, p_prob, draft_token, u):
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")
    return u < min(1.0, ratio)
```

`u` 是一个 uniform random number。`q_prob` 是 verifier 对 drafted token 的概率。`p_prob` 是 draft model 的概率。Leviathan theorem 指出，这个 Bernoulli decision 加上 rejection 时从 residual 采样，可以严格保留 verifier 的分布。

### 步骤 2：residual distribution

```python
def residual_dist(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    return [r / s for r in raw]
```

逐元素从 `q` 中减去 `p`，将负值 clamp 到零，然后重新归一化。任何 rejection 都从这里采样。

### 步骤 3：一个 speculative step

```python
def spec_step(prefix, q_model, p_model, N, rng):
    drafts = []
    p_probs = []
    ctx = list(prefix)
    for _ in range(N):
        p_dist = p_model(ctx)
        d = sample(p_dist, rng)
        drafts.append(d)
        p_probs.append(p_dist[d])
        ctx.append(d)

    q_dists = [q_model(prefix + drafts[:i]) for i in range(N + 1)]

    for i, d in enumerate(drafts):
        u = rng.random()
        q_prob = q_dists[i][d]
        p_prob = p_probs[i]
        if u < min(1.0, q_prob / p_prob if p_prob > 0 else float("inf")):
            prefix = prefix + [d]
        else:
            res = residual_dist(q_dists[i], p_model(prefix))
            prefix = prefix + [sample(res, rng)]
            return prefix
    prefix = prefix + [sample(q_dists[N], rng)]
    return prefix
```

接受五个 → 一个 bonus → 一次 verifier pass 生成六个 Token。

### 步骤 4：测量 acceptance rate

在不同 draft-quality 水平下运行 10,000 个 speculative steps。绘制 acceptance rate 与 draft 和 verifier 分布之间 KL divergence 的关系。你应该会看到清晰的单调关系。

### 步骤 5：验证分布等价性

经验验证：speculative loop 生成的 Token 直方图应该匹配直接从 verifier 采样得到的直方图。这就是实践中的 Leviathan theorem。Chi-square test 会确认差异在 sampling error 范围内。

## 使用它

Production：

```bash
# vLLM with EAGLE
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model /models/llama-3.1-eagle-70b \
    --speculative-draft-tensor-parallel-size 1 \
    --num-speculative-tokens 5

# vLLM with vanilla draft model
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model meta-llama/Llama-3.2-1B-Instruct \
    --num-speculative-tokens 5
```

截至 2026 年中，TensorRT-LLM 拥有最快的 Medusa path。`faster-whisper` 为 Whisper-large 封装了带小 draft 的 Speculative Decoding。

**选择 draft：**

| Strategy | 何时选择 | Speedup |
|----------|--------------|---------|
| Vanilla draft (1B/3B Llama family) | 快速 prototype，无需 training | 1.8–2.3× |
| Medusa heads | 你可以 fine-tune verifier | 2–3× |
| EAGLE-2 / 3 | Production，最高速度 | 3–4× |
| Lookahead | 无 draft、无 training、无额外 params | 1.3–1.6× |

**什么时候不要 spec-decode：**

- 只生成 1–5 个 Token 的 single-sequence generation。Overhead 占主导。
- 极具创意 / 高 temperature sampling（α 会下降）。
- Memory-constrained deployments（draft model 会增加 VRAM）。

## 交付它

见 `outputs/skill-spec-decode-picker.md`。这个 skill 会为新的 inference workload 选择一种 Speculative Decoding strategy（vanilla / Medusa / EAGLE / lookahead）以及 tuning parameters（N、draft temperature）。

## 练习

1. **Easy。** 运行 `code/main.py`。确认在 50,000 个 Token 上，speculative token distribution 与 verifier 的 direct-sample distribution 匹配，且 chi-square p > 0.05。
2. **Medium。** 对 `α = 0.5, 0.7, 0.85`，绘制 speedup（每次 big-model forward 的 Token 数）随 `N` 的变化。找出每个 α 的最优 `N`。（Hint：每次 verify call 的期望 Token 数 = `(1 - α^{N+1}) / (1 - α)`。）
3. **Hard。** 实现一个 tiny Medusa：取 Lesson 14 的 capstone GPT，添加 3 个额外 LM heads，分别预测位置 t+2、t+3、t+4。在 tinyshakespeare 上用 joint multi-head loss 训练。与通过截断同一个模型得到的 vanilla draft 比较 acceptance rates。
4. **Hard。** 实现 rollback：从一个 10-token prefix KV cache 开始，喂入 5 个 draft tokens，模拟在位置 3 rejection。验证下一轮迭代时你的 cache 读取结果正确匹配 "prefix + first 2 accepted drafts"。

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| Draft model | “便宜的那个” | 一个更小的模型，用于提出候选 Token；通常比 verifier 便宜 10–50×。 |
| Verifier | “大的那个” | 我们要保留其分布的目标模型；每个 speculative step 运行一次。 |
| Acceptance rate (α) | “draft 有多常对” | verifier 接受 draft 的 per-token probability。典型为 0.7–0.9。 |
| Residual distribution | “rejection fallback” | 归一化后的 `(q - p)_+`；rejection 时从这里采样可保留 verifier 的分布。 |
| Bonus token | “免费的那个” | 当全部 N 个 draft 被接受时，从 verifier 的 next-step distribution 再采样一个。 |
| Medusa | “Draft-less speculative” | verifier 上的多个 LM heads 并行预测位置 t+1..t+k。 |
| EAGLE | “Hidden-state draft” | 以 verifier last-layer hidden states 为条件的 tiny transformer draft。 |
| Lookahead decoding | “Jacobi iteration” | 使用 fixed-point iteration 的 self-speculation；没有 draft model。 |
| Tree attention | “一次 verify 多个候选” | 同时考虑多个 draft continuations 的 branching verification。 |
| KV rollback | “撤销 rejected drafts” | Scratch KV buffer；接受时 commit，reject 时 discard。 |

## 延伸阅读

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) — 核心算法与 equivalence theorem。
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) — 同期提出；清晰的 Bernoulli-rejection 证明。
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) — Medusa 论文；tree-attention 验证。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) — EAGLE-1；基于 hidden-state 条件的 draft。
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) — EAGLE-2；dynamic tree depth。
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840) — EAGLE-3。
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057) — lookahead，无 draft 方法。
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html) — 连接了全部四种策略的标准 production reference。
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE) — EAGLE-1/2/3 的参考代码。
