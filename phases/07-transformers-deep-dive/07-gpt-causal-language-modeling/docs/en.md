# GPT — Causal Language Modeling

> BERT 能看到两侧。GPT 只能看到过去。三角形 mask 是现代 AI 中影响最深远的一行代码。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 05 (完整 Transformer), Phase 7 · 06 (BERT)
**Time:** ~75 分钟

## 问题

Language Model 回答一个问题：给定前 `t-1` 个 Token，第 `t` 个 Token 的 Probability Distribution 是什么？使用这个信号，也就是 next-token prediction 进行 Training，你将得到一个能够逐个 Token 生成任意文本的 Model。

若要在整个序列上并行进行端到端 Training，就需要让每个位置的预测仅依赖于更早的位置。否则，Model 只需查看答案便能轻易作弊。

causal mask 正是为此而存在。它是一个由 `-inf` 值构成的上三角 Matrix，在 softmax 之前加到 Attention 分数上。经过 softmax 后，这些位置会变成 0。每个位置只能关注自身和更早的位置。由于只需将它应用于整个序列一次，因此一次 forward pass 就能并行得到 N 个 next-token prediction。

GPT-1 (2018)、GPT-2 (2019)、GPT-3 (2020)、GPT-4 (2023)、GPT-5 (2025)、Claude、Llama、Qwen、Mistral、DeepSeek、Kimi，全都是采用相同核心循环的 decoder-only causal Transformer。它们之间的区别在于数据质量、规模、架构改进，以及 post-training（SFT、RLHF、DPO 及其后继方法）。

## 概念

![causal mask 创建三角形 Attention Matrix](../assets/causal-attention.svg)

### mask

给定长度为 `N` 的序列，构建一个 `N × N` Matrix：

```
M[i, j] = 0       if j <= i
M[i, j] = -inf    if j > i
```

在 softmax 之前，将 `M` 加到原始 Attention 分数上。`exp(-inf) = 0`，因此被 mask 的位置贡献的权重为零。Attention Matrix 的每一行都仅表示先前位置上的 Probability Distribution。

实现成本：一次 `torch.tril()` 调用。计算时间：纳秒级。对该领域的影响：一切。

### 三角形从何而来

mask 通常被描述为附加到 Attention 上的补丁。反过来进行推导后，它就不再神秘：Attention 是前缀平均值的第三次改进，而三角形就是该平均值循环边界的 Matrix 表示。

**Stage 1 — 前缀平均值。** 对序列进行因果汇总的最简单方式：位置 `i` 变为位置 `0…i` 的平均值。用循环表示，就是 `out[i] = X[:i+1].mean(0)`。同样的计算也可以通过一次 Matrix 乘法完成。取一个由 1 构成的下三角 Matrix，将每一行除以该行元素数量，然后相乘：

```python
import numpy as np

A = np.tril(np.ones((n, n)))
A = A / A.sum(axis=1, keepdims=True)
out = A @ X
```

`A` 的第 `i` 行是 `[1/(i+1), …, 1/(i+1), 0, …, 0]`。对角线上方的零体现了因果性。这里并不是将未来的信息 mask 掉，而是求和时从未包含未来的信息。

**Stage 2 — 学习得到的权重。** 均匀平均会将过去的每个 Token 视为同等相关。将 1 替换为学习得到的分数 Matrix `S`。此时无法再从构造上保证每行之和为 1，因此要用 softmax 归一化每一行，而不是除以元素数量。softmax 永远不会输出严格的零，这会破坏因果性，除非将未来位置的分数设为 `-inf`，因为 `exp(-inf) = 0`：

```python
def softmax(x, axis):
    e = np.exp(x - np.max(x, axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

S = S + np.triu(np.full((n, n), -np.inf), k=1)
A = softmax(S, axis=1)
out = A @ X
```

同一个三角形、同一个行随机 Matrix、同一次 Matrix 乘法。`-inf` mask 并不是新增的机制。它只是将 Stage 1 中的零元素转换到了 softmax 的输入域。

**Stage 3 — 依赖内容的权重。** 在 Stage 2 中，`S` 在 Training 后是固定的：无论 Token 表达什么内容，位置 7 对位置 3 的权重始终相同。让分数依赖 Token 本身：`S = Q @ K.T / sqrt(d_k)`。其他部分都不变。mask、softmax、Matrix 乘法完全相同。

三个 Stage，一个不变量：一个下三角行随机 Matrix 乘以序列。均匀平均、学习得到的静态权重、依赖内容的权重。mask 从未被添加到 Attention 中。它是从平均值中延续下来的。

```figure
mask-derivation
```

### 并行 Training，串行 Inference

Training：对整个 `(N, d_model)` 序列执行一次 forward pass，计算 N 个 cross-entropy Loss（每个位置一个），求和，然后执行 Backpropagation。沿序列并行处理。这正是 GPT Training 能够扩展的原因：可以在一次 GPU pass 中处理一个 Batch 内的 100 万个 Token。

Inference：逐个 Token 生成。输入 `[t1, t2, t3]`，得到 `t4`。输入 `[t1, t2, t3, t4]`，得到 `t5`。输入 `[t1, t2, t3, t4, t5]`，得到 `t6`。KV cache（Lesson 12）会保存 `t1…tn` 的 hidden state，因此不必在每一步重新计算它们。但 Inference 时的串行深度 = 输出长度。这就是 autoregressive 的代价，也是 decoding 成为每个 LLM 延迟瓶颈的原因。

### Loss — shift-by-one

给定 Token `[t1, t2, t3, t4]`：

- 输入：`[t1, t2, t3]`
- 目标：`[t2, t3, t4]`

对于每个位置 `i`，计算 `-log P(target_i | inputs[:i+1])`，然后求和。这就是整个序列的 cross-entropy。

你听说过的每个 Transformer LM 都使用这种 Loss 进行 Training。Pre-training、Fine-tuning、SFT，Loss 相同，数据不同。

### Decoding 策略

Training 完成后，采样方式的影响比大多数人想象的更大。

| 方法 | 作用 | 使用场景 |
|--------|--------------|-------------|
| Greedy | 每一步都取 argmax | 确定性任务、代码补全 |
| Temperature | 将 logits 除以 T 后采样 | 创意任务；T 越高，多样性越强 |
| Top-k | 仅从概率最高的 k 个 Token 中采样 | 去除低概率长尾 |
| Top-p (nucleus) | 从累积概率 ≥ p 的最小集合中采样 | 2020 年后的默认方式；可适应分布形状 |
| Min-p | 保留满足 `p > min_p * max_p` 的 Token | 2024 年后使用；比 top-p 更善于拒绝长尾 |
| Speculative decoding | 小型 draft Model 提出 N 个 Token，大型 Model 进行验证 | 在质量相同的情况下将延迟降低 2–3 倍 |

在 2026 年，对于开放权重 Model，min-p + temperature 0.7 是合理的默认配置。对于任何生产级 Inference 技术栈而言，speculative decoding 都已是基本要求。

### “GPT 配方”为何有效

1. **Decoder-only。** 没有 encoder 开销。每层只需执行一次 Attention + FFN。
2. **Scaling。** 124M → 1.5B → 175B → 数万亿。Chinchilla scaling laws（Lesson 13）会告诉你如何分配计算资源。
3. **In-context learning。** 在约 6B–13B 参数规模时涌现。Model 无需 Fine-tuning 即可遵循 few-shot 示例。
4. **RLHF。** 基于人类偏好进行 post-training，将原始预训练文本 Model 转变为聊天助手。
5. **Pre-norm + RoPE + SwiGLU。** 在大规模 Training 中保持稳定。

自 GPT-2 以来，核心架构并没有太大变化。真正有趣的进展都发生在数据、规模和 post-training 上。

```figure
causal-mask
```

## 动手构建

### Step 1：causal mask

请参阅 `code/main.py`。只需一行：

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

在 softmax 之前，将它加到 Attention 分数上。这就是完整的机制。

### Step 2：一个 2 层 GPT 风格 Model

堆叠两个 decoder block（masked Self-Attention + FFN，不使用 cross-attention）。添加 Token Embedding、positional encoding 和 unembedding（与 Token Embedding Matrix 共享权重，这是自 GPT-2 以来的标准技巧）。

### Step 3：端到端 next-token prediction

在一个包含 20 个 Token 的玩具词表上，为每个位置生成 logits。根据 shift-by-one 目标计算 cross-entropy Loss。不计算 Gradient，这只是一次 forward pass 的健全性检查。

### Step 4：采样

实现 greedy、temperature、top-k、top-p、min-p。在固定 Prompt 上运行每种方法并比较输出。一个采样函数只需 10 行代码。

## 使用现成工具

PyTorch 的 2026 年惯用写法：

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")
tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")

prompt = "Attention is all you need because"
inputs = tok(prompt, return_tensors="pt")
out = model.generate(
    **inputs,
    max_new_tokens=64,
    temperature=0.7,
    top_p=0.9,
    do_sample=True,
)
print(tok.decode(out[0]))
```

在内部，`generate()` 会运行 forward pass，提取最后一个位置的 logits，采样下一个 Token，将其追加到序列，然后重复。每个生产级 LLM Inference 技术栈（vLLM、TensorRT-LLM、llama.cpp、Ollama、MLX）都通过大量优化实现相同的循环，包括批量 prefill、continuous batching、KV cache paging 和 speculative decoding。

**用一句话分别概括 GPT 与 BERT：** GPT 预测 `P(x_t | x_{<t})`。BERT 预测 `P(x_masked | x_unmasked)`。Loss 决定了 Model 能否生成内容。

## 交付成果

请参阅 `outputs/skill-sampling-tuner.md`。该 Skill 会为新的生成任务选择采样参数，并标记必须使用确定性 decoding 的情况。

## 练习

1. **简单。** 运行 `code/main.py`，验证经过 softmax 后的 causal Attention Matrix 是下三角 Matrix。抽查：第 3 行应仅在第 0–3 列具有权重。
2. **中等。** 实现宽度为 4 的 beam search。在 10 个短 Prompt 上比较 beam-4 与 greedy 的 perplexity。beam 是否总能胜出？（提示：通常适用于翻译，但不适用于开放式聊天。）
3. **困难。** 实现 speculative decoding：使用一个微型 2 层 Model 作为 draft Model，一个 6 层 Model 作为 verifier。在 100 次长度为 64 的补全上测量实际运行时间的加速比。确认输出与 verifier 的 greedy 输出一致。

## 关键术语

| 术语 | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| Causal mask | “那个三角形” | 添加到 Attention 分数上的上三角 `-inf` Matrix，使位置 `i` 只能看到位置 `≤ i`。 |
| Next-token prediction | “那个 Loss” | 在每个位置上，计算 Model 的 Probability Distribution 与真实下一个 Token 之间的 cross-entropy。 |
| Autoregressive | “一次生成一个” | 将输出反馈为输入；只有 Training 期间可以并行，生成期间不能并行。 |
| Logits | “softmax 之前的分数” | softmax 之前 LM head 的原始输出；采样基于这些值进行。 |
| Temperature | “创意旋钮” | 将 logits 除以 T；T→0 = greedy，T→∞ = 均匀分布。 |
| Top-p | “Nucleus sampling” | 将分布截断为总和达到 ≥p 的最小集合，再从剩余部分中采样。 |
| Min-p | “比 top-p 更好” | 保留满足 `p ≥ min_p × max_p` 的 Token；根据分布的尖锐程度调整截断阈值。 |
| Speculative decoding | “Draft + verify” | 低成本 Model 提出 N 个 Token；大型 Model 并行验证。 |
| Teacher forcing | “Training 技巧” | Training 时输入真实的前一个 Token，而不是 Model 的预测。每个 seq2seq LM 都会采用这种标准方法。 |

## 延伸阅读

- [Radford et al. (2018). Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) — GPT-1。
- [Radford et al. (2019). Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) — GPT-2。
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) — GPT-3 与 in-context learning。
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) — speculative decoding 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) — 规范的 causal LM 参考代码。
