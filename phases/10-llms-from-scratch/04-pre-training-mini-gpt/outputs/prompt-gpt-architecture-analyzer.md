---
name: prompt-gpt-architecture-analyzer
description: 分析任何 GPT-style transformer 模型中的 architecture choices
version: 1.0.0
phase: 10
lesson: 4
tags: [gpt, transformer, architecture, attention, kv-cache, scaling, pre-training]
---

# GPT Architecture Analyzer

当从 technical report、model card 或 training log 评估 GPT-style 模型时，使用这个框架来拆解 architecture，并识别 design tradeoffs。

## Analysis Protocol

### 1. Parameter Allocation 明细

计算每个 component 的精确 parameter count：

- **Token embeddings**: vocab_size x embed_dim
- **Position embeddings**: max_seq_len x embed_dim
- **Per-block attention**: 4 x embed_dim x embed_dim（Q、K、V、output projections）
- **Per-block FFN**: 2 x embed_dim x ff_dim + embed_dim + ff_dim（两个 linear layers + biases）
- **Per-block LayerNorm**: 4 x embed_dim（两个 norms，每个都有 scale + bias）
- **Final LayerNorm**: 2 x embed_dim
- **Output head**: vocab_size x embed_dim（如果与 token embeddings weight-tied，则为 0）

如果任何单个 component 超过 total parameters 的 40%，请标记出来。在小模型中，embedding matrix 占主导。在大模型中，Attention 和 FFN 占主导。

### 2. Attention Design Analysis

评估 attention configuration：

- **Head dimension**: embed_dim / num_heads。标准值是 64（GPT-2）或 128（Llama 3）。低于 32 会限制 per-head expressiveness。高于 128 会浪费 compute，收益很小。
- **Heads per layer**: 更多 heads = 更多样的 attention patterns，但也会为 KV cache 消耗更多内存。
- **Grouped Query Attention (GQA)**: 模型是否在多个 Q heads 之间共享 K/V heads？Llama 3 使用 GQA，为 32 个 Q heads 配置 8 个 KV heads。这会将 KV cache 减少 4x。
- **Context length**: Max position embeddings。RoPE 允许超出 training length 进行 extrapolation。Absolute position embeddings 不支持。

### 3. Memory Budget

针对模型的 maximum context length 进行 inference 时：

- **Weights (FP16)**: total_params x 2 bytes
- **KV Cache (FP16)**: 2 x num_layers x num_kv_heads x head_dim x max_seq_len x 2 bytes
- **Activations**: batch_size x seq_len x embed_dim x 2 bytes x num_layers（近似值）

如果 KV cache 超过 weight memory，请标记出来。这会发生在 long-context models（128K+）中，并说明模型在 decode 期间是 memory-bound。

### 4. Compute Profile

- **Prefill FLOPS per token**: 约为 2 x total_params（每个 parameter 一次 matmul，forward pass）
- **Decode FLOPS per token**: 与 prefill 相同，但只针对单个 Token
- **Prefill bottleneck**: compute-bound（GPU TFLOPS）
- **Decode bottleneck**: memory-bound（GPU memory bandwidth）
- **Arithmetic intensity**: 每访问一个 byte 内存对应的 FLOPS。低于 100 = memory-bound。

### 5. Scaling Decisions

根据已知 scaling laws 进行评估：

- **Chinchilla optimal**: 对于给定 compute budget C，optimal model size N 和 token count D 满足 N ~ D（大致等比例 scaling）。一个 7B 模型需要约 140B tokens。
- **Llama 3 overtrained**: Meta 在 15T tokens 上训练了 Llama 3 8B（是 Chinchilla optimal 的 100x）。在更多数据上 overtraining 小模型，可以获得更好的 per-token inference cost。
- **Width vs depth**: 在相同 parameter count 下，更深的模型（更多 layers）通常比更宽的模型（更大的 embed_dim）sample-efficient。

## 红旗信号
- **FFN ratio not 4x**: 标准是 ff_dim = 4 x embed_dim。Llama 使用 8/3 x embed_dim 搭配 SwiGLU。偏离标准需要有理由。
- **No weight tying**: 除非 vocab_size 相对 embed_dim 非常大，否则 output head 应该与 token embeddings 共享 weights。
- **No GQA above 13B**: 超过 13B 且没有 grouped-query attention 的模型会有过大的 KV caches。
- **No RoPE for long context**: Absolute position embeddings 无法 extrapolate 到 training length 之外。目标为 32K+ context 的模型应该使用 rotary embeddings。
- **Learning rate too high for model size**: 更大的模型需要更低的 peak learning rates。GPT-2 Small 使用 6e-4。Llama 3 405B 使用 8e-5。

## 输出格式
1. **Parameter Table**: 按 component 列出的 parameter counts 及 percentages
2. **Memory Budget**: 在 max context length 下的 weights、KV cache 和 activation memory
3. **Compute Profile**: A100/H100 的 prefill 和 decode throughput estimates
4. **Design Assessment**: 模型做对了什么，以及哪些地方是 non-standard
5. **Scaling Verdict**: 模型规模是否适合它的 training data
