# Production Quantization — AWQ, GPTQ, GGUF K-quants, FP8, MXFP4/NVFP4

> Quantization 格式不是一个通用选择，而是 hardware、serving engine 和 workload 的函数。GGUF Q4_K_M 或 Q5_K_M 通过 llama.cpp 和 Ollama 交付，占据 CPU 和 edge 场景。GPTQ 在 vLLM 内部胜出，适合你需要在同一个 base 上运行 multi-LoRA 的情况。带 Marlin-AWQ kernels 的 AWQ 在 7B 级模型上可达到约 741 tok/s，并在 INT4 下有最佳 Pass@1，是 2026 年 datacenter production 的默认选择。FP8 在 Hopper、Ada 和 Blackwell 上保持中间地带，近似无损且支持广泛。NVFP4 和 MXFP4（Blackwell microscaling）更激进，需要逐 block 验证。有两个陷阱会咬到团队：calibration dataset 必须匹配 deployment domain；KV cache 与 weight quantization 是分开的，AWQ 课里“我的模型现在是 4 GB 了”会忘记 production batch size 下 10-30 GB 的 KV cache。

**Type:** 学习
**Languages:** Python（stdlib，用于跨格式的 toy memory 和 throughput 比较）
**Prerequisites:** Phase 10 · 13（Quantization 基础），Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 75 分钟

## 学习目标
- 说出 2026 年六种 production quantization formats 及其最佳适用场景。
- 在给定 hardware（CPU vs GPU、Hopper vs Blackwell）、engine（vLLM、TRT-LLM、llama.cpp）和 workload（routine chat、reasoning、multi-LoRA）时选择格式。
- 计算所选格式节省的 weight memory，以及未受影响的 KV cache。
- 说出会让 quantized models 在 domain traffic 上退化的 calibration-dataset 陷阱。

## 问题
Quantization 会降低 memory 和 HBM bandwidth，而这正是 decode 需要的。一个 FP16 70B 模型有 140 GB 权重。把权重量化到 INT4（AWQ 或 GPTQ），模型就是 35 GB，可以放进一张 H100，并给 KV cache 留出空间。这很重要，因为在 128 个并发序列、2k context 时，仅 KV cache 就有 20-30 GB。

但 quantization 不是免费的。激进量化会降低质量，尤其是在 reasoning-heavy 任务上。不同格式适配不同 engine。不同 hardware 原生支持不同 precision。2026 年的格式动物园是真实存在的，你不能复制别人的选择，而必须基于自己的 stack 来选。

## 概念
### The six formats

| Format | Bits | Sweet spot | Engines |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU、edge、laptops | llama.cpp、Ollama |
| GPTQ | 4-8 | vLLM 上的 Multi-LoRA | vLLM、TGI |
| AWQ | 4 | Datacenter GPU production | vLLM（Marlin-AWQ）、TGI |
| FP8 | 8 | Hopper/Ada/Blackwell datacenter | vLLM、TRT-LLM、SGLang |
| MXFP4 | 4 | Blackwell multi-user | TRT-LLM |
| NVFP4 | 4 | Blackwell multi-user | TRT-LLM |

### GGUF — CPU/edge 默认选择

GGUF 是一种文件格式，本身并不是量化方案，它把 K-quant variants（Q2_K、Q3_K_M、Q4_K_M、Q5_K_M、Q6_K、Q8_0）打包在一个 container 中。Q4_K_M 和 Q5_K_M 是 production defaults，在 4-5 bits 下接近 BF16 质量。对于 CPU 或 edge serving，这是最佳选择，因为 llama.cpp 到目前为止是最快的 CPU inference engine。

在 vLLM 中的 throughput 惩罚：7B 上约 93 tok/s，这种格式并未针对 GPU kernels 优化。当 deployment target 是 CPU/edge 时使用 GGUF。其他情况不要用。

### GPTQ — vLLM 中的 multi-LoRA

GPTQ 是一种 post-training quantization algorithm，带有 calibration pass。Marlin kernels 让它在 GPU 上变快（相比非 Marlin GPTQ 有 2.6x speedup）。7B 上约 712 tok/s。

它的独特优势：GPTQ-Int4 在 vLLM 中支持 LoRA adapters。如果你要服务一个 base model 加 10-50 个 fine-tuned variants（每个作为一个 LoRA），GPTQ 就是你的路径。截至 2026 年初，NVFP4 还不支持 LoRA。

### AWQ — datacenter GPU 默认选择

Activation-aware Weight Quantization。量化时保护约 1% 最显著的权重。Marlin-AWQ kernels：相比 naive 实现有 10.9x speedup。7B 上约 741 tok/s，是 INT4 formats 中 Pass@1 最好的。

除非你需要 multi-LoRA（GPTQ）或激进的 Blackwell FP4（NVFP4），否则新的 GPU serving 选择 AWQ。

### FP8 — 可靠的中间地带

8-bit floating point。近似无损。支持广泛。Hopper Tensor Cores 原生加速 FP8。Blackwell 继承这一点。当质量不可妥协时（reasoning、medical、code-gen），FP8 是 2026 年安全的默认选择。Memory savings 是 INT4 的一半，但质量风险低得多。

### MXFP4 / NVFP4 — Blackwell 激进选择

Microscaling FP4。每个 weight block 都有自己的 scale factor。激进，但在 Blackwell Tensor Cores 上有硬件加速。相较 FP8，将每 Token 字节数减半，这是 Phase 17 · 07 中的经济收益。

注意事项：
- 还没有 LoRA support（2026 年初）。
- reasoning-heavy workloads 上质量下降可见。
- 必须在你的 eval set 上逐模型验证。

### The calibration trap

AWQ 和 GPTQ 需要 calibration dataset，通常是 C4 或 WikiText。对于 domain models（code、medical、legal），用通用 web text 做 calibration，会让算法对哪些权重应该保护作出错误判断。HumanEval 上的 Pass@1 可能下降几个点。

修复方式：使用 in-domain data 做 calibration。数百个 domain samples 通常足够。上线前在 eval set 上测试。

### The KV cache trap

AWQ 把权重缩到 4 bits。KV cache 是分开的，并保持 FP16/FP8。对于带 AWQ 的 70B 模型：

- Weights：约 35 GB（从 140 GB INT4 而来）。
- 128 并发 × 2k context 下的 KV cache：约 20 GB。
- Activations：约 5 GB。
- Total：约 60 GB，可以放进 H100 80GB。

天真地说“我把模型量化到 4 GB 了”会忘记另外 30-50 GB。要整体预算 HBM。

另外，KV cache quantization（FP8 KV 或 INT8 KV）是另一个选择，有自己的 tradeoffs，它会直接影响 Attention accuracy，不是免费的收益。

### AWQ INT4 对 reasoning 有风险

Chain-of-thought、math、长 context code-gen，这些任务都会明显受激进量化影响。AWQ INT4 在 MATH 上会损失约 3-5 点。对于 reasoning-heavy workloads，发布 FP8 或 BF16；接受 memory cost。

### 2026 picking guide

- CPU/edge serve：GGUF Q4_K_M。完成。
- GPU serve、routine chat、无 LoRA：AWQ。
- GPU serve、multi-LoRA：带 Marlin 的 GPTQ。
- Reasoning workload：FP8。
- Blackwell datacenter、质量已验证：NVFP4 + FP8 KV。
- 不明确：对每个候选格式跑 1,000-sample eval。

## 使用它
`code/main.py` 会针对一系列模型大小，计算六种格式的 memory footprint（weights + KV + activations）和相对 throughput。展示 KV cache 何时占主导、weight compression 何时划算，以及 FP8 何时是安全选择。

## 交付它
本课会产出 `outputs/skill-quantization-picker.md`。给定 hardware、model size、workload type 和 quality tolerance，它会选择一种格式，并生成 calibration/validation plan。

## 练习
1. 运行 `code/main.py`。对于 128 并发、2k context 的 70B 模型，计算每种格式的总 HBM。哪种格式能让你放进一张 H100 80GB？
2. 你有一个 7B coding model。选择一种格式并说明理由。如果你对 quality tolerance 判断错了，恢复路径是什么？
3. 计算为 medical domain model 校准 AWQ 所需的 calibration-dataset size。为什么更多数据并不总是更好？
4. 阅读 Marlin-AWQ kernel paper 或 release notes。用三句话解释为什么 AWQ 在 7B 上达到 741 tok/s，而 raw GPTQ 约为 712。
5. 什么时候把 AWQ weights 与 FP8 KV cache 组合，比把 KV 保持在 BF16 更合理？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GGUF | “llama.cpp format” | 打包 K-quant variants 的文件格式；CPU/edge 默认选择 |
| Q4_K_M | “Q4 K M” | 4-bit K-quant medium；production GGUF 默认选择 |
| GPTQ | “gee pee tee q” | 带 calibration 的 post-train INT4；在 vLLM 中支持 LoRA |
| AWQ | “a w q” | Activation-aware INT4；Marlin kernels；INT4 下最佳 Pass@1 |
| Marlin kernels | “fast INT4 kernels” | Hopper 上用于 INT4 的自定义 CUDA kernels；10x speedup |
| FP8 | “eight-bit float” | Hopper/Ada/Blackwell 上的安全 precision 默认选择 |
| MXFP4 / NVFP4 | “microscaling four” | Blackwell 4-bit FP，带 per-block scale factors |
| Calibration dataset | “cal data” | 用于选择 quantization parameters 的输入文本；必须匹配 domain |
| KV cache quantization | “KV INT8” | 与 weights 分开的选择；影响 Attention accuracy |

## 延伸阅读
- [VRLA Tech — LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/) — 对比 benchmark。
- [Jarvis Labs — vLLM Quantization Complete Guide](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks) — 按格式列出的 throughput 数字。
- [PremAI — GGUF vs AWQ vs GPTQ vs bitsandbytes 2026](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/) — 逐格式选择指南。
- [vLLM docs — Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html) — 支持的格式和 flags。
- [AWQ paper (arXiv:2306.00978)](https://arxiv.org/abs/2306.00978) — 原始 AWQ formulation。
- [GPTQ paper (arXiv:2210.17323)](https://arxiv.org/abs/2210.17323) — 原始 GPTQ formulation。
