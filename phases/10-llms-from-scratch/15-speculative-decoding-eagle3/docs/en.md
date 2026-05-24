# Speculative Decoding 和 EAGLE-3

> Phase 7 · Lesson 16 证明了数学：Leviathan 拒绝规则会精确保留验证器的分布。本课从训练栈视角审视 2026 年生产级 Speculative Decoding。EAGLE-3 将 draft model 从廉价近似变成了一个专门设计的微型网络，它基于验证器自身的 hidden states 进行训练，并加入了 training-time test 循环，使训练分布与推理分布对齐。结果：端到端速度提升 3× 到 6.5×，聊天场景中每 Token 接受率超过 0.9，并且没有分布层面的取舍。2026 年每个生产推理栈都会默认提供它。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 16（speculative decoding math），Phase 10 · 12（inference optimization）
**Time:** ~75 minutes

## 学习目标
- 用一句话表述 Leviathan theorem，并证明 speculative loop 生成的样本与验证器分布完全一致。
- 梳理从 vanilla spec-decoding (Leviathan 2023) 到 EAGLE、EAGLE-2 和 EAGLE-3 的两年演进，并说出每一步移除的确切限制。
- 根据接受率 `α` 和 draft-to-verifier 成本比 `c` 计算期望加速，并为每种 regime 选择最优 draft 长度 `N`。
- 从零实现完整 speculative loop：draft、verify、从 residual 中 reject-sample、在 rejection 时回滚 KV cache、在完全接受时输出 bonus token。

## 问题
在 70B 模型上做 autoregressive decoding，在 H100 上可能只有每秒 35 个 Token。GPU 远未饱和。Memory bandwidth 才是上限：每个 Token 都要从 HBM 加载 70B 权重，执行一步算术，然后生成一个 float。计算单元大部分时间都处于空闲状态。

Speculative decoding 将它转化为一个真正可解的吞吐问题。廉价 draft 会在 `N` 次小型 forward pass 中提出 `N` 个 Token。验证器在 prefix 加上所有 `N` 个 draft 上运行一次。如果验证器在位置 `i` 的分布与 draft 一致（以一种我们将精确定义的统计意义），就接受；否则拒绝，并从 residual distribution 中采样一个修正。一次大模型 forward 可以生成最多 `N+1` 个被接受的 Token，而不是一个。

关键 theorem 来自 Leviathan, Kalman, Matias (ICML 2023)：输出分布与直接从验证器采样得到的分布完全一致。不是近似一致。是完全一致。这正是 speculative decoding 能在生产中被接受的全部原因：它是纯延迟优化，没有质量取舍。

Phase 7 · Lesson 16 给你的是数学。本课给你的是训练栈。一个好的 draft 带来的加速价值比廉价 draft 高 2×。EAGLE、EAGLE-2 和 EAGLE-3 (Li et al., 2024–2025) 将“draft = 同一模型的小版本”转化为一门精确的工程学科。2026 年的生产推理服务器默认使用 EAGLE-3。

## 概念
### 不变量: Leviathan rejection sampling

令 `p(t)` 表示在某个 prefix 下 draft 对下一个 Token 的分布，`q(t)` 表示验证器的分布。采样一个 draft Token `d ~ p`。以概率 `min(1, q(d) / p(d))` 接受。若拒绝，则从 residual distribution `(q - p)_+ / ||(q - p)_+||_1` 中采样。最终样本服从 `q`。无论 `p` 多差，这都成立；越差就越常拒绝，但输出仍然精确。

把 `N` 次这样的调用首尾相接，用一次验证器 forward 处理 `prefix + d_1 + ... + d_N`。验证器会同时返回 `q_1, q_2, ..., q_{N+1}`。从左到右遍历。在位置 `j` 第一次拒绝时，从 `residual(q_j, p_j)` 采样并停止。若全部接受，则从 `q_{N+1}` 采样一个 bonus token。

### What determines speedup

令 `α` 为每个 drafted Token 的期望接受率。令 `c = cost(draft) / cost(verifier)` 为成本比。每次验证器 forward 的期望接受 Token 数为：

```
E[accepted] = (1 - α^(N+1)) / (1 - α)
```

每个接受 Token 的期望总 wall time 是 `(N * c + 1) / E[accepted]`。相对于 `N` 最小化它，就能得到最佳点。对于 `α = 0.8, c = 0.05`：最优 `N` 大约是 5–7，加速为 3.2×。对于 `α = 0.95, c = 0.02`：最优 `N` 大约是 8–10，加速接近 5×。

最大的杠杆是 `α`。在固定 `N = 5` 时，从 `α = 0.6`（vanilla draft）提升到 `α = 0.9`（EAGLE-3），会让每次验证器 forward 的期望接受 Token 数从 2.2 提升到 4.1。使用同一个验证器，吞吐几乎翻倍。

### The two-year progression

**Vanilla speculative (Leviathan, 2023).** Draft model 是同一家族中独立训练的较小 LLM。容易接入，`α ≈ 0.6`，最好也只有约 2× 加速。

**EAGLE-1 (Li et al., 2024).** Draft 是一个微型 Transformer，通常为一到两层，它以验证器 last-layer hidden state 作为输入并直接预测下一个 Token。因为 draft 看到了验证器的特征表示，它的分布更接近验证器。`α` 上升到 0.7–0.8。

**EAGLE-2 (Li et al., 2024).** 加入 dynamic draft tree：不是提出单条包含 `N` 个 Token 的序列，而是提出一棵小型候选树，用一次验证器 forward（tree attention）为每个候选打分，然后沿最高概率路径前进。Draft 长度会在每一步自适应变化。接受路径 Token 的 `α` 上升到 0.85 以上。

**EAGLE-3 (Li et al., 2025, NeurIPS).** 又做了两项改动。第一，完全去掉 feature-prediction loss：EAGLE-1/2 训练 draft 去匹配验证器的 hidden states，这限制了更多数据能带来的收益。EAGLE-3 直接基于 Token prediction 训练。第二，training-time test (TTT)：在 draft 训练期间，把 draft 自己先前的预测作为输入反馈到后续多个步骤中，与它在推理时的运行方式一致。这会对齐训练与测试分布，并阻止误差累积。实测加速：聊天场景最高 6.5×，在 H100 上的 SGLang batch 64 中吞吐提升 38%。

### KV cache rollback

验证会在一次 pass 中将验证器的 KV cache 扩展 `N` 个条目。如果在位置 `j` 发生 rejection，那么位置 `j-1` 之后的 cache 内容就是错误的。常见实现有两种：写入 scratch buffer 并在接受时提交（vLLM、TensorRT-LLM），或者维护一个物理 KV cache 加逻辑长度，并在 reject 时截断。无论哪种方式，rollback 成本都是每层每个 head 的字节量，与 forward-pass 成本相比可以忽略。

对于 EAGLE-2 tree search，验证器会使用尊重树拓扑的 non-causal mask 运行 Attention。工程上细节繁琐，但计算本质上是一次带 custom mask 的标准 flash-attention 调用。

### Draft architectures in 2026

| Strategy | Draft type | `α` | Speedup | Training cost |
|----------|-----------|-----|---------|---------------|
| Vanilla | 独立小型 LLM | 0.55-0.70 | 1.8-2.3× | 无（复用现有小模型） |
| Medusa | 验证器上的额外 LM heads | 0.65-0.75 | 2-3× | ~1B SFT tokens |
| EAGLE-1 | hidden states 上的 1-layer transformer | 0.70-0.80 | 2.5-3× | ~60B tokens |
| EAGLE-2 | EAGLE-1 + dynamic draft tree | 0.80-0.88 | 3-4× | ~60B tokens |
| EAGLE-3 | Multi-layer feature fusion + TTT | 0.88-0.92 | 3.5-6.5× | ~60-200B tokens |
| Lookahead | 无 draft（Jacobi iteration） | N/A | 1.3-1.6× | 无 |

2026 年生产环境中：vLLM 和 SGLang 在可用时默认使用 EAGLE-3，否则使用 EAGLE-2。TensorRT-LLM 为 Meta 和 NVIDIA 公开模型提供最快的 Medusa 路径。llama.cpp 为 CPU 部署提供 vanilla draft。

## 构建它
见 `code/main.py`。这是完整的 Leviathan speculative loop，包含所有组成部分：draft-of-N、验证器并行 pass、逐位置 rejection、residual sampling、bonus token、KV rollback，以及用于验证输出分布与直接从 `q` 采样一致的经验检验。

### 步骤 1：拒绝规则

```python
def accept(q_prob, p_prob, u):
    if p_prob <= 0:
        return True
    return u < min(1.0, q_prob / p_prob)
```

### 步骤 2： residual distribution

```python
def residual(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    if s == 0:
        return list(q)
    return [r / s for r in raw]
```

### 步骤 3： a full speculative step

`spec_step` 函数从 `p` draft `N` 个 Token，然后在一次并行 `q` evaluation 中验证它们。它会对每个 drafted Token 应用拒绝规则，并在第一次 rejection 时从 residual 中采样修正。如果全部接受，则从 `q_{N+1}` 输出一个 bonus token。

### 步骤 4： KV rollback bookkeeping

模拟器会为每个 worker 跟踪逻辑 `kv_length`。接受 `k` 个 draft 时，`kv_length += k`。在位置 `j` 发生 rejection 时，cache 已经写过了 `j`，但逻辑长度会被设为 `prefix_length + j + 1`，也就是 correction token 之后一个位置。后续读取会截断到逻辑长度。

### 步骤 5： the Leviathan check

运行 50,000 个 speculative steps。统计被接受 Token 的经验分布。与从 `q` 直接采样 50,000 次进行比较。chi-square 统计量应显著低于 critical value。该 theorem 在实践中成立。

### 步骤 6： speedup vs. α

通过用不同幅度扰动 `p` 使其偏离 `q`，扫描 draft quality。测量 `α`，然后绘制不同 `α` 和 `N` 下每次验证器调用的期望 Token 数。代码会打印一张表，展示 EAGLE-3 级别的 draft quality（`α ≈ 0.9`）如何解锁每次验证器调用 4–5 个 Token。

## 使用它
使用 EAGLE-3 的生产级 `vllm serve`：

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --speculative-config '{
    "model": "yuhuili/EAGLE3-LLaMA3.3-Instruct-70B",
    "num_speculative_tokens": 5,
    "method": "eagle3"
  }'
```

在 H100 上 batch 64 使用 EAGLE-3 的 SGLang：根据 EAGLE-3 paper，相比 batch-64 vanilla decoding，吞吐大约提升 1.38×。

适合使用 speculative decoding 的场景：

- 任何 p50 latency 比峰值吞吐更重要的交互式聊天 workload。
- 代码生成和结构化输出（JSON、SQL）。因为目标分布高度可预测，`α` 高于 0.9。
- 长文本生成（数千个 Token）。摊销后的加速会持续收益。

不适合的场景：

- 很小的模型（< 3B）。Draft 并不比验证器便宜太多。
- 极小 batch-1 CPU 部署。Draft model 的内存开销可能不值得。
- 非常高温度的创意采样，此时 `α` 会崩塌。

## 交付它
本课会生成 `outputs/skill-eagle3-tuner.md`。给定一个推理 workload（模型、batch size、target latency、task profile），它会推荐 speculative-decoding 策略和调优参数（draft family、`N`、tree depth、temperature-aware switching）。

## 练习
1. 运行 `code/main.py`。确认 Leviathan 分布检查中的 chi-square 统计量在 50,000 个样本上保持低于 95% critical value。

2. 在 `α` 固定为 0.9 且 `c` 固定为 0.04 时，将 `N` 从 1 扫描到 10。绘制每次验证器调用的期望 Token 数和每个 Token 的实际 wall time。找出使 wall time 最小的 `N`。解释曲线形状。

3. 修改代码以模拟 EAGLE-2 tree search：每一步中，draft 提出形状为 `[2, 2, 2]` 的树（八条候选路径）。验证器运行一次，最高概率的接受路径胜出。计算每个 leaf 的 `α` 以及每次验证器调用的总 Token 数。与等价计算量下的 linear-chain spec-decoding 对比。

4. 为两个并发序列实现 batched KV rollback 模拟器。Sequence A 的所有 draft 都被接受；Sequence B 在位置 2 拒绝。展示每个序列的正确 `kv_length` 都被更新，且没有浪费工作。

5. 阅读 EAGLE-3 paper 的 Section 4（Training-Time Test）。用两句话解释为什么没有 TTT 的 naive draft training 会遭受 exposure bias，以及为什么在训练中把 draft 自己的预测反馈给它能修复这个问题。将其与 seq2seq 中的 scheduled-sampling literature 关联起来。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Leviathan rule | “min(1, q 除以 p)” | 以概率 `min(1, q(d)/p(d))` 进行 Bernoulli accept/reject；当 rejection 时从 residual 中采样，可精确保留验证器分布 |
| Residual distribution | “(q 减 p) 的正部，归一化” | `(q - p)_+` 在零处截断并重新归一化，是 rejection 时应采样的正确分布 |
| Acceptance rate α | “draft 对的频率” | 在拒绝规则下，每个 Token 的期望 Bernoulli 成功概率；支配所有加速数学 |
| EAGLE-1 | “hidden-state draft” | 条件化于验证器 last-layer hidden state 的微型 Transformer draft（Li et al., 2024） |
| EAGLE-2 | “dynamic draft tree” | EAGLE-1 加上一棵候选 continuation 树，并在一次验证器 pass 中用 tree attention 打分 |
| EAGLE-3 | “training-time test” | 去掉 feature-prediction loss，基于直接 Token prediction 训练，并在训练时把 draft 自己的输出反馈给它 |
| Training-time test (TTT) | “exposure bias 修复” | 训练时以 autoregressive 方式运行 draft，使训练和测试输入分布匹配，是 scheduled sampling 的直接类比 |
| KV rollback | “撤销被拒绝的 draft” | rejection 后将验证器 KV cache 重置到已接受 prefix 长度的 bookkeeping |
| Bonus token | “免费的那个” | 当全部 `N` 个 draft 都被接受时，以零额外验证器成本从 `q_{N+1}` 额外采样一个 Token |
| Tree attention | “一次验证许多候选” | 使用尊重 draft tree 拓扑的 non-causal mask 的 Attention；在一次 forward pass 中为树中的每个节点计算 `q_i` |

## 延伸阅读
- [Leviathan, Kalman, Matias — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192, ICML 2023)](https://arxiv.org/abs/2211.17192) — 基础论文与等价性 theorem
- [Chen et al. — Accelerating Large Language Model Decoding with Speculative Sampling (arXiv:2302.01318)](https://arxiv.org/abs/2302.01318) — 同期独立提出的方法，证明清晰
- [Li et al. — EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) — EAGLE-1，基于 hidden-state-conditioned draft
- [Li et al. — EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) — dynamic tree search
- [Li et al. — EAGLE-3: Scaling up Inference Acceleration via Training-Time Test (arXiv:2503.01840, NeurIPS 2025)](https://arxiv.org/abs/2503.01840) — 2026 年生产默认方案
- [Cai et al. — Medusa: Multiple Decoding Heads (arXiv:2401.10774)](https://arxiv.org/abs/2401.10774) — 另一种无 draft 方法
- [vLLM Speculative Decoding documentation](https://docs.vllm.ai/en/latest/features/spec_decode.html) — 覆盖所有策略接入的权威生产参考
