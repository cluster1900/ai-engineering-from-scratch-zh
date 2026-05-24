# 在 Blackwell 上使用 FP8 和 NVFP4 运行 TensorRT-LLM

> TensorRT-LLM 仅限 NVIDIA，但它在 Blackwell 上胜出。在配合 Dynamo 编排的 GB200 NVL72 上，SemiAnalysis InferenceX 在 2026 年 Q1-Q2 测得 120B 模型成本为每百万 Token $0.012，而 H100 + vLLM 为 $0.09/M，形成 7x 的经济差距。这个 stack 是三种浮点精度体系的叠加：FP8 对 KV cache 和 attention kernels 仍然关键，因为它具备它们所需的动态范围；NVFP4（4-bit microscaling）处理权重和激活值；multi-token prediction (MTP) 与 disaggregated prefill/decode 又在此之上再增加 2-3x。Day-0 模型支持可直接加载 FP4 权重，无需 post-training conversion。对 2026 年工程团队来说，问题在于：TRT-LLM 是封闭的 NVIDIA stack，因此采用它就是用可移植性换吞吐。在承诺采用前，先基于你的模型与硬件组合算清楚。

**Type:** 学习
**Languages:** Python (stdlib，玩具级 FP8/NVFP4 内存与成本计算器)
**前置要求：** Phase 17 · 04 (vLLM Serving Internals), Phase 10 · 13 (Quantization)
**Time:** ~75 分钟

## 学习目标

- 解释为什么即便权重使用 NVFP4，FP8 对 KV cache 和 Attention 仍然关键。
- 计算 frontier model 在 BF16、FP8 和 NVFP4 下的 HBM footprint，并推理节省来自哪里。
- 说出 TRT-LLM 利用的 Blackwell 特有特性（day-0 FP4、MTP、disaggregated serving、all-to-all primitives）。
- 判断什么时候 TRT-LLM 的 NVIDIA-lock 值得用来换取相对 Hopper 上 vLLM 的 7x 成本差距。

## 问题

2026 年推理经济性的前沿问题是“每美元能产生多少 Token”。答案取决于四层叠加选择：硬件代际（Hopper H100/H200 vs Blackwell B200/GB200）、精度（BF16 → FP8 → NVFP4）、serving engine（vLLM vs SGLang vs TRT-LLM）和编排方式（plain vs disaggregated vs Dynamo）。

在 Hopper + vLLM 上，120B MoE 的运行成本约为每百万 Token ~$0.09。在 Blackwell + TRT-LLM + Dynamo 上，同一个模型的运行成本约为 ~$0.012，便宜 7x。其中一部分差距来自硬件（Blackwell 的单 GPU LLM 吞吐相对 Hopper 高 11-15x）。另一部分来自 stack：FP4 权重、MTP draft、disaggregated prefill/decode，以及用于 MoE expert communication 的 NVLink 5 all-to-all。

你无法在 NVIDIA stack 之外复现这一点。这就是取舍：用可移植性换经济性。理解哪些 stack 选择贡献了差距中的哪一部分，正是本课的重点。

## 概念

### 为什么 FP8 仍然是 KV cache 的底线

2026 年一个常见错误是：假设 NVFP4 可以应用在所有地方。事实并非如此。KV cache 需要 FP8（8-bit floating point），因为它存储的 Attention keys 和 values 跨越很宽的动态范围。把 KV 量化到 FP4 会造成灾难性精度损失：分布尾部会掉落，Attention scores 会崩塌。FP8 的 exponent bits 为 KV cache 提供了所需范围。

NVFP4（2025-2026）适用于权重和激活值。Microscaling：每个权重 block 都有自己的 scale factor，因此小 block 可以覆盖不同动态范围，而不会遭受 per-tensor scale loss。对激活值来说，FP4 能撑住，是因为激活值在单层内范围较小。

典型 Blackwell 配置：

- 权重：NVFP4（4-bit microscaling）。
- 激活值：NVFP4。
- KV cache：FP8。
- Attention accumulator：FP32（softmax 稳定性）。

### TRT-LLM 使用的 Blackwell 特有 primitives

- **Day-0 FP4 weights**：模型提供方直接发布 FP4 权重；TRT-LLM 无需 post-training conversion 即可加载。FP4 不需要 AWQ / GPTQ 步骤。
- **Multi-token prediction (MTP)**：与 EAGLE（Phase 17 · 05）思路相同，但集成到 TRT-LLM build 中。
- **Disaggregated serving**：prefill 和 decode 位于独立 GPU pools，KV cache 通过 NVLink 或 InfiniBand 传输。与 Dynamo（Phase 17 · 20）思路相同。
- **All-to-all communication primitives**：NVLink 5 将 MoE expert communication latency 相比 Hopper 降低 3x。TRT-LLM 的 MoE kernels 针对此进行了调优。
- **NVFP4 + MXFP8 microscaling**：Blackwell Tensor Cores 上的硬件加速 scale-factor 处理。

### 你应该记住的数字

- HGX B200 通过 TRT-LLM 在 GPT-OSS-120B 上达到 $0.02/M Token。
- GB200 NVL72 通过 Dynamo（编排 TRT-LLM）达到 $0.012/M Token。
- H100 + vLLM 在可比 workload 上约为 $0.09/M Token。
- TRT-LLM 更新三个月带来 2.8x 吞吐增益（2026）。
- Blackwell 相对 Hopper 的单 GPU LLM 吞吐为 11-15x。
- MLPerf Inference v6.0（2026 年 4 月）：Blackwell 主导每个提交任务。

### FP4 在质量上的真实代价

NVFP4 很激进。在 reasoning-heavy workload（chain-of-thought、数学、长上下文 code-gen）上，FP4 权重会明显退化。Per-block calibration 可以缓解，但不能消除。发布 reasoning models 的团队通常使用 FP8 权重 + FP4 激活值作为折中，或坚持在 H200 上全程使用 FP8。

规则：在承诺使用 NVFP4 权重前，始终在你的 eval set 上验证任务质量。

### 为什么这是一个 NVIDIA-lock 决策

TRT-LLM 是 C++ + CUDA + closed-source kernels。模型需要为特定 GPU SKU 编译。不支持 AMD，不支持 Intel，不支持 ARM。如果你的 infra strategy 是 multi-vendor，那么 TRT-LLM 对 TRT-LLM-served tier 来说不可行；你仍然可以在混合硬件上用 vLLM serving。如果你是 NVIDIA-only，那么 7x 差距足以为 lock 付费。

### 2026 年实用配方

对于每年 $100M+ 的推理账单，运行 Hopper + vLLM 会留下 7-10x 的优化空间。把成本主导型 workload 迁移到 Blackwell + TRT-LLM + Dynamo。把实验 tier 保留在 H100 + vLLM 上，以获得模型迭代速度。每个 NVFP4-converted model 上生产前都要验证质量。

### Disaggregation bonus

TRT-LLM 的 disaggregated serving（分离的 prefill 和 decode pools）会在 Phase 17 · 20 中深入讲解。在 Blackwell 上，乘数会叠加：FP4 权重 × MTP speedup × disaggregated placement × cache-aware routing。7x 数字假设使用的是这套完整 stack。

## 使用它

`code/main.py` 会为三种 stack 计算模型的 HBM footprint、decode throughput（memory-bound regime）和 $/M-token：H100 + BF16 + vLLM、H100 + FP8 + vLLM、B200 + NVFP4/FP8 + TRT-LLM。运行它，观察复合效应，以及每个变化贡献了差距中的哪一部分。

## 交付它

本课会生成 `outputs/skill-trtllm-blackwell-advisor.md`。给定 workload、模型大小和年度 Token volume，它会判断 Blackwell + TRT-LLM stack 是否值得 NVIDIA-lock。

## 练习

1. 运行 `code/main.py`。对一个 active parameters 为 30% 的 120B MoE，计算 H100 BF16、H100 FP8 和 B200 NVFP4/FP8 上 memory-bandwidth-limited decode throughput。最大的跃升来自哪里？
2. 某客户每年在 H100 + vLLM 上花费 $2M。考虑 7x 经济差距，他们需要购买多少 Blackwell GPUs 才能在 12 个月内摊销迁移到 TRT-LLM 的成本？
3. NVFP4 权重转换后，你在 MATH 上看到准确率下降 3 个点。说出两条恢复路径：一条 quality-first（保留 FP8 权重），一条 cost-first（用 in-domain data 做 calibration）。
4. 阅读 MLPerf v6.0 inference results。哪个任务的 Blackwell-over-Hopper 差距最小，为什么？
5. 计算 405B 模型在 NVFP4 权重 + FP8 KV cache、128k context 下所需的 HBM。它能装进单个 GB200 NVL72 节点吗？

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| FP8 | "eight-bit float" | 8-bit floating point；由于动态范围，用于 KV cache 和 Attention |
| NVFP4 | "four-bit micro" | NVIDIA 的 4-bit microscaling FP format；用于 Blackwell 上的权重和激活值 |
| MXFP8 | "MX eight" | Microscaling FP8 variant；在 Blackwell Tensor Cores 上硬件加速 |
| Day-0 FP4 | "ship FP4 weights" | 模型提供方发布已经是 FP4 的权重；无需 post-train conversion 步骤 |
| MTP | "multi-token prediction" | TRT-LLM 集成的 speculative-decoding draft（Phase 17 · 05） |
| Disaggregated serving | "split prefill/decode" | Prefill 和 decode 位于独立 GPU pools；KV 通过 NVLink/IB 传输 |
| All-to-all | "MoE expert comm" | 将 Token 路由到 expert GPUs 的通信模式；NVLink 5 降低 3x |
| InferenceX | "SemiAnalysis inference bench" | 2026 年行业接受的 cost-per-token benchmark |

## 延伸阅读

- [NVIDIA — Blackwell Ultra MLPerf Inference v6.0](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/) — 2026 年 4 月 MLPerf 结果。
- [NVIDIA — Blackwell 上的 MoE Inference](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/) — NVLink 5 all-to-all 与 MoE kernels。
- [TensorRT-LLM Overview](https://nvidia.github.io/TensorRT-LLM/overview.html) — 官方 engine 文档。
- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/) — TRT-LLM 之上的 disaggregated orchestration。
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) — 发布 Blackwell 数字的 benchmark suite。
