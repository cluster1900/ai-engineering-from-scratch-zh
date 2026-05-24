---
name: open-model-picker
description: 为给定部署目标选择 open LLM family、量化方式和推理 stack。
version: 1.0.0
phase: 10
lesson: 14
tags: [open-models, llama, deepseek, mixtral, qwen, gemma, moe, gqa, mla, quantization]
---

给定一个部署目标（GPU 类型、每张 GPU 的 VRAM、GPU 数量、目标上下文长度、目标 p50/p99 延迟、峰值并发请求数）和任务画像（chat、code、reasoning、long-context retrieval、tool use），推荐一个 open model 加 serving stack，并明确说明 Lesson 14 中六个架构旋钮各自的理由。

产出：

1. Model shortlist。三个候选项，每个都包含 total params、active params（考虑 MoE）、架构标记（norm / activation / position / Attention / MoE / context），以及它入选 shortlist 的唯一原因。
2. Memory budget check。针对首选候选项：BF16 下的权重内存和所选量化下的权重内存；目标 batch size 在目标上下文下的 KV cache；activation 余量。如果 weights + KV cache + activations 超过可用 VRAM，则停止推荐。
3. Quantization choice。GPTQ-4bit、AWQ-4bit、FP8 或 BF16。根据任务的精度敏感性给出理由（code / math / reasoning 任务比 chat 或 retrieval 更容易受到激进量化的影响）。
4. Inference stack。vLLM、TensorRT-LLM、SGLang 或 llama.cpp。根据以下因素给出理由：continuous batching 需求、speculative decoding 支持、量化格式兼容性，以及 single-node 与 multi-node 拓扑。
5. Throughput sanity check。基于 GPU memory bandwidth（decode）和 TFLOPs（prefill）估算 prefill tokens/sec 与 decode tokens/sec。如果 decode throughput 低于目标并发用户下限，则拒绝该推荐。
6. Fallback。如果首选候选项超过 VRAM 或吞吐预算，给出第二选择。始终命名一个。

硬性拒绝：
- 在单张 24GB 消费级 GPU 上使用超过 30B 的 dense models，且没有 offloading 或激进量化。
- 在不支持 expert-parallel 的 serving stack 上使用 MoE models。
- 在没有 GQA 或 MLA 的架构上使用 long-context（128k+）（KV cache 会爆炸）。
- 任何未命名具体 model revision 的推荐（例如，应写 "Llama 3 8B Instruct v3.1"，而不是 "Llama 3"）。

输出：一页推荐，列出 model、quantization、stack，并为每个决策提供编号证据。最后用一段“值得重新考虑，如果...”收尾，说明具体哪项能力或部署参数会改变这个选择。
