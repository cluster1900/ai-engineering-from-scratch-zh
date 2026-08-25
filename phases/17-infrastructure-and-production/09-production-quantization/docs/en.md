# 生产级 Quantization——AWQ、GPTQ、GGUF K-quants、FP8、MXFP4/NVFP4

> Quantization 格式并不是一种通用选择——它取决于硬件、serving engine 和工作负载。GGUF Q4_K_M 或 Q5_K_M 通过 llama.cpp 和 Ollama 主导 CPU 与 edge 场景。当你需要在同一个 base Model 上使用 multi-LoRA 时，GPTQ 在 vLLM 中最具优势。采用 Marlin-AWQ kernel 的 AWQ 可以在 7B 级 Model 上实现约 741 tok/s，同时拥有 INT4 格式中最佳的 Pass@1——它是 2026 年数据中心生产环境的默认选择。FP8 仍然是 Hopper、Ada 和 Blackwell 上的折中方案——几乎无损且得到广泛支持。NVFP4 和 MXFP4（Blackwell microscaling）较为激进，需要逐 block 验证。团队经常踩中两个陷阱：calibration Dataset 必须与部署域相符；KV cache 与权重 Quantization 相互独立——AWQ 课程中“我的 Model 现在只有 4 GB”这种说法，忽略了生产 Batch size 下 10-30 GB 的 KV cache。

**Type:** Learn
**Languages:** Python（stdlib，玩具版多格式内存与吞吐量对比）
**Prerequisites:** Phase 10 · 13（Quantization 基础），Phase 17 · 04（Serving Engine 内部机制）
**Time:** ~75 分钟

## 学习目标

- 说出六种生产级 Quantization 格式及其在 2026 年最适合的场景。
- 根据硬件（CPU 与 GPU、Hopper 与 Blackwell）、engine（vLLM、TRT-LLM、llama.cpp）和工作负载（常规聊天、推理、multi-LoRA）选择格式。
- 计算所选格式节省的权重内存，以及未受影响的 KV cache 占用。
- 说出导致 Quantization Model 在特定领域流量上性能下降的 calibration Dataset 陷阱。

## 问题

Quantization 可以减少内存占用和 HBM 带宽需求，而这正是 decode 所需要的。一个 FP16 70B Model 的权重大小为 140 GB。使用 INT4（AWQ 或 GPTQ）对权重进行 Quantization 后，Model 大小变为 35 GB——可以装入一张 H100，并为 KV cache 留出空间。这一点很重要，因为在 128 个并发 sequence、2k Context 的情况下，仅 KV cache 就需要 20-30 GB。

但 Quantization 并非没有代价。激进的 Quantization 会降低质量，尤其是在高度依赖推理的任务上。不同格式适用于不同的 engine。不同硬件能够原生支持的精度也不同。2026 年的格式种类确实繁多，你不能照搬别人的选择——必须根据自己的技术栈做出决定。

## 概念

### 六种格式

| 格式 | Bit 数 | 最适合的场景 | Engine |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU、edge、笔记本电脑 | llama.cpp、Ollama |
| GPTQ | 4-8 | vLLM 上的 multi-LoRA | vLLM、TGI |
| AWQ | 4 | 数据中心 GPU 生产环境 | vLLM（Marlin-AWQ）、TGI |
| FP8 | 8 | Hopper/Ada/Blackwell 数据中心 | vLLM、TRT-LLM、SGLang |
| MXFP4 | 4 | Blackwell 多用户场景 | TRT-LLM |
| NVFP4 | 4 | Blackwell 多用户场景 | TRT-LLM |

### GGUF——CPU/edge 默认选择

严格来说，GGUF 是一种文件格式，而不是 Quantization 方案——它将多种 K-quant 变体（Q2_K、Q3_K_M、Q4_K_M、Q5_K_M、Q6_K、Q8_0）打包在一个容器中。Q4_K_M 和 Q5_K_M 是生产环境的默认选择——以 4-5 bit 达到接近 BF16 的质量。它们是 CPU 或 edge serving 的最佳选择，因为 llama.cpp 是目前速度遥遥领先的 CPU Inference engine。

在 vLLM 中的吞吐量劣势：7B Model 上约为 93 tok/s——该格式没有针对 GPU kernel 优化。仅当部署目标是 CPU/edge 时使用 GGUF。其他情况不要使用。

### GPTQ——vLLM 中的 multi-LoRA

GPTQ 是一种需要 calibration pass 的 post-training Quantization 算法。Marlin kernel 使其能够在 GPU 上快速运行（相比不使用 Marlin 的 GPTQ 加速 2.6 倍）。7B Model 上约为 712 tok/s。

它的独特优势是：GPTQ-Int4 在 vLLM 中支持 LoRA adapter。如果你要提供一个 base Model 外加 10-50 个 Fine-tuning 变体（每个变体都是一个 LoRA），GPTQ 就是可行路径。截至 2026 年初，NVFP4 尚不支持 LoRA。

### AWQ——数据中心 GPU 的默认选择

Activation-aware Weight Quantization。在 Quantization 过程中保护约 1% 最显著的权重。Marlin-AWQ kernel 相比朴素实现可加速 10.9 倍。在 7B Model 上约为 741 tok/s，并拥有 INT4 格式中最佳的 Pass@1。

对于新的 GPU serving，默认选择 AWQ，除非你需要 multi-LoRA（选择 GPTQ）或激进的 Blackwell FP4（选择 NVFP4）。

### FP8——可靠的折中方案

8-bit floating point。几乎无损，得到广泛支持。Hopper Tensor Core 能够原生加速 FP8，Blackwell 也继承了这一能力。当质量不可妥协时（推理、医疗、code-gen），FP8 是 2026 年的稳妥默认选择。它节省的内存只有 INT4 的一半，但质量风险要低得多。

### MXFP4 / NVFP4——Blackwell 上的激进方案

Microscaling FP4。每个权重 block 都有自己的 scale factor。它较为激进，但可由 Blackwell Tensor Core 提供硬件加速。与 FP8 相比，每个 Token 的字节数减半——这正是 Phase 17 · 07 中介绍的经济性收益。

注意事项：
- 尚不支持 LoRA（2026 年初）。
- 在高度依赖推理的工作负载中会出现明显的质量下降。
- 针对每个 Model，使用自己的 Evaluation set 进行验证。

### Calibration 陷阱

AWQ 和 GPTQ 需要 calibration Dataset——通常使用 C4 或 WikiText。对于领域 Model（代码、医疗、法律），如果使用通用网页文本进行 calibration，算法会错误判断应该保护哪些权重。HumanEval 的 Pass@1 可能下降数个百分点。

解决方法是使用域内数据进行 calibration。通常几百个领域样本就足够了。在发布前使用 Evaluation set 进行测试。

### KV cache 陷阱

AWQ 将权重压缩到 4 bit。KV cache 与权重相互独立，会继续保持 FP16/FP8。对于使用 AWQ 的 70B Model：

- 权重：约 35 GB（从 140 GB 压缩为 INT4）。
- 128 个并发 × 2k Context 下的 KV cache：约 20 GB。
- Activation：约 5 GB。
- 总计：约 60 GB——可以装入 H100 80GB。

简单地说“我把 Model Quantization 到 4 GB 了”，会忽略其他 30-50 GB。必须从整体上规划 HBM。

此外，KV cache Quantization（FP8 KV 或 INT8 KV）是另一项独立选择，有自己的取舍——它会直接影响 Attention 准确率，并非毫无代价的收益。

### AWQ INT4 对推理任务存在风险

Chain-of-thought、数学、长 Context code-gen——这些任务会明显受到激进 Quantization 的影响。AWQ INT4 在 MATH 上会损失约 3-5 个百分点。对于高度依赖推理的工作负载，应发布 FP8 或 BF16 版本，并接受相应的内存成本。

### 2026 年选择指南

- CPU/edge serving：GGUF Q4_K_M。无需再选。
- GPU serving、常规聊天、不使用 LoRA：AWQ。
- GPU serving、multi-LoRA：使用 Marlin 的 GPTQ。
- 推理工作负载：FP8。
- Blackwell 数据中心、质量已验证：NVFP4 + FP8 KV。
- 无法确定：对每种候选格式运行包含 1,000 个样本的 Evaluation。

```figure
gpu-memory-breakdown
```

## 使用它

`code/main.py` 会针对不同 Model 大小，计算六种格式的内存占用（权重 + KV + activation）与相对吞吐量。它会展示 KV cache 在何处占据主导、权重压缩在何处产生收益，以及 FP8 在何处是稳妥选择。

## 交付它

本课会生成 `outputs/skill-quantization-picker.md`。给定硬件、Model 大小、工作负载类型和质量容忍度，它会选择一种格式，并生成 calibration/验证计划。

## 练习

1. 运行 `code/main.py`。对于一个具有 128 个并发、2k Context 的 70B Model，计算每种格式所需的 HBM 总量。哪种格式可以装入单张 H100 80GB？
2. 你有一个 7B 编程 Model。选择一种格式并说明理由。如果你错误判断了质量容忍度，恢复路径是什么？
3. 计算为一个医疗领域 Model 执行 AWQ calibration 所需的 Dataset 大小。为什么数据并非越多越好？
4. 阅读 Marlin-AWQ kernel 论文或 release note。用三句话解释为什么 AWQ 在 7B Model 上能达到 741 tok/s，而原始 GPTQ 约为 712 tok/s。
5. 在什么情况下，组合使用 AWQ 权重与 FP8 KV cache 比将 KV 保持为 BF16 更合理？

## 关键术语

| 术语 | 人们怎么说 | 它实际表示什么 |
|------|----------------|------------------------|
| GGUF | “llama.cpp format” | 打包 K-quant 变体的文件格式；CPU/edge 默认选择 |
| Q4_K_M | “Q4 K M” | 4-bit K-quant medium；生产环境的默认 GGUF 格式 |
| GPTQ | “gee pee tee q” | 带 calibration 的 post-training INT4；在 vLLM 中支持 LoRA |
| AWQ | “a w q” | Activation-aware INT4；使用 Marlin kernel；拥有 INT4 中最佳的 Pass@1 |
| Marlin kernels | “fast INT4 kernels” | Hopper 上用于 INT4 的自定义 CUDA kernel；加速 10 倍 |
| FP8 | “eight-bit float” | Hopper/Ada/Blackwell 上稳妥的默认精度 |
| MXFP4 / NVFP4 | “microscaling four” | 使用 per-block scale factor 的 Blackwell 4-bit FP |
| Calibration dataset | “cal data” | 用于选择 Quantization 参数的输入文本；必须与领域相符 |
| KV cache quantization | “KV INT8” | 与权重独立的选择；会影响 Attention 准确率 |

## 延伸阅读

- [VRLA Tech——LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/)——对比 benchmark。
- [Jarvis Labs——vLLM Quantization 完整指南](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks)——各格式的吞吐量数据。
- [PremAI——2026 年 GGUF、AWQ、GPTQ 与 bitsandbytes 对比](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/)——逐格式选择指南。
- [vLLM 文档——Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html)——支持的格式和 flag。
- [AWQ 论文（arXiv:2306.00978）](https://arxiv.org/abs/2306.00978)——AWQ 的原始表述。
- [GPTQ 论文（arXiv:2210.17323）](https://arxiv.org/abs/2210.17323)——GPTQ 的原始表述。
