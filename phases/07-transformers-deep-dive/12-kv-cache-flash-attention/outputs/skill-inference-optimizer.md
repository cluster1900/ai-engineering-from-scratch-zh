---
name: inference-optimizer
description: 为新的 inference deployment 选择 Attention implementation、KV cache strategy、quantization 和 speculative decoding。
version: 1.0.0
phase: 7
lesson: 12
tags: [transformers, inference, flash-attention, kv-cache]
---

给定一个 inference deployment（model name + params、target hardware、concurrency、max context length、latency SLO、throughput target），输出：

1. Serving stack。vLLM（默认 production）、SGLang（每 Token 最低 latency）、TensorRT-LLM（NVIDIA 最优）、llama.cpp（edge/CPU）、MLX（Apple silicon）。用一句话说明原因。
2. Attention implementation。Flash Attention 2（Ampere/Ada 默认）、Flash Attention 3（Hopper）、Flash Attention 4（Blackwell，仅 forward-only）。指定 fallback。
3. KV cache。Dtype（默认 fp16，若支持则 fp8）、paged vs contiguous、prefix caching on/off、用于 parallel sampling 的 shared KV。
4. Quantization。fp16 / bf16（默认）、int8（weight-only）、用于 weights 的 AWQ / GPTQ / GGUF。Activation quantization 仅在完成 benchmark 后使用。
5. 额外加速。Speculative decoding（EAGLE 2 / Medusa / draft model）、continuous batching（始终开启）、chunked prefill（长 prompt 工作负载）、若存在重复 prompts 则启用 prefix caching。

拒绝将 Flash Attention 4 部署用于 training —— 它在发布时仅 forward-only。拒绝在未 benchmark 目标任务质量影响的情况下推荐 fp8 KV cache。标记任何不带 GQA 的 70B+ model 在 32K+ context 下具有难以管理的 KV cache。对于任何带有重复 system prompts 的 agent/tool-calling deployment，要求开启 prefix caching。
