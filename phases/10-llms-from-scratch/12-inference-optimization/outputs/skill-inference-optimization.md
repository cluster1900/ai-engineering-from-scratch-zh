---
name: skill-inference-optimization
description: 诊断并优化 LLM inference serving 的 throughput、latency 和 cost
version: 1.0.0
phase: 10
lesson: 12
tags: [inference, kv-cache, batching, speculative-decoding, vllm, optimization]
---

# LLM 推理优化 Pattern

两个阶段：prefill（compute-bound，并行）和 decode（memory-bound，顺序）。
每项 optimization 都针对其中一个或两个阶段。

```
Request -> Prefill (process prompt) -> Decode (generate tokens) -> Response
              |                            |
         Compute-bound               Memory-bound
         Optimize: fusion,           Optimize: batching,
         prefix caching              quantization, speculation
```

## Decision framework

### 步骤 1: 识别你的瓶颈

为你的 workload 测量 ops:byte ratio：

| ops:byte | Bound | What to optimize |
|----------|-------|-----------------|
| < 50 | Memory | Quantize KV cache, increase batch size |
| 50-200 | Transitional | Both matter, start with batching |
| > 200 | Compute | Kernel fusion, tensor parallelism, FP8 |

### 步骤 2： Pick your engine

- **Default**: vLLM（最广泛的模型支持、PagedAttention、OpenAI-compatible API）
- **多轮 / structured output**: SGLang（RadixAttention prefix caching、constrained decoding）
- **Max NVIDIA throughput**: TensorRT-LLM（kernel fusion、H100 上的 FP8）

### 步骤 3： Apply optimizations in order

1. **KV cache** -- 始终开启，没有缺点
2. **Continuous batching** -- 始终开启，没有缺点（vLLM/SGLang 默认这样做）
3. **Prefix caching** -- 如果你有共享的 system prompts，则启用（大多数 chatbots 都有）
4. **Quantization** -- KV cache INT8/FP8 可将 memory 减少 2-4 倍，且 quality loss 很小
5. **Speculative decoding** -- 当 latency 比 throughput 更重要时添加
6. **Tensor parallelism** -- 当模型无法放入单张 GPU 时，拆分到多张 GPUs 上

## KV cache memory formula

```
per_token = 2 * num_layers * num_kv_heads * head_dim * bytes_per_param
total = per_token * sequence_length * num_concurrent_users
```

常见模型速查（BF16）：

| Model | Per token | 100 users @ 4K |
|-------|-----------|----------------|
| Llama 3 8B | 32 KB | 12.5 GB |
| Llama 3 70B | 320 KB | 125 GB |
| Llama 3 405B | 504 KB | 197 GB |

## Speculative decoding 检查清单

- Draft model 应比 target 小 5-10 倍（例如，用 8B drafts 对应 70B）
- Acceptance rate > 70% 才有显著 speedup
- 最适合可预测文本（code、structured output、natural language）
- 最不适合 creative/sampling-heavy tasks（low temperature 有帮助）
- 对大多数 workloads：EAGLE > draft-target > n-gram

## 常见错误
- 以 batch=1 运行 decode（memory-bound，GPU compute 95% idle）
- 分配连续的 KV cache blocks（使用 PagedAttention，可获得接近零的浪费）
- 当 80% requests 共享相同 system prompt 时，忽略 prefix caching
- 为 model weights 过度预留 GPU memory，导致 KV cache 没有空间
- 只测量 throughput 而不测量 latency（10s TTFT 下的高 throughput 没有意义）
- 在 high temperature 下使用 speculative decoding（acceptance rate 会降到 50% 以下）

## Monitoring checklist

- Time to first token (TTFT)：prefill latency，interactive use 的目标 < 500ms
- Inter-token latency (ITL)：decode speed，streaming 的目标 < 50ms
- Throughput (tokens/second)：所有 concurrent users 的总量
- KV cache utilization：已分配 cache 中正在使用的百分比
- Batch utilization：每次 iteration 中 batch slots 被填满的百分比
- Queue depth：等待 batch slot 的 requests
