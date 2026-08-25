# Self-Hosted 服务选型 — 根据硬件与规模匹配 Engine

> Engine 选型取决于硬件、规模和生态系统，而不是简单查看排行榜。2026 年，有四种 engine 主导 self-hosted Inference：llama.cpp、Ollama、vLLM、SGLang，而 TGI 已退居 maintenance mode。**llama.cpp** 在 CPU 上速度最快，支持的 Model 最广，并能全面控制 Quantization 和 threading。**Ollama** 适用于开发笔记本，可通过一条命令安装；它比 llama.cpp 慢约 15-30%（Go + CGo + HTTP serialization），在类似生产环境的负载下吞吐量相差 3 倍。**TGI 于 2025 年 12 月 11 日进入 maintenance mode**，今后仅修复 bug；其原始吞吐量比 vLLM 慢约 10%，但过去在 observability 和 HF 生态系统集成方面处于领先地位。maintenance mode 状态使其成为风险较高的长期选择；对于新项目，SGLang 或 vLLM 是更稳妥的默认方案。**vLLM** 是通用生产环境的默认选择，v0.15.1（2026 年 2 月）增加了 PyTorch 2.10、RTX Blackwell SM120 和 H200 优化。**SGLang** 专注于 agentic multi-turn 和 prefix 密集型场景，已有超过 400,000 块 GPU 用于生产环境（xAI、LinkedIn、Cursor、Oracle、GCP、Azure、AWS）。硬件限制方面：CPU-first → llama.cpp；AMD / 非 NVIDIA → vLLM 是支持最完善的路径（TRT-LLM 仅限 NVIDIA）。2026 年的 pipeline 模式为：dev = Ollama、staging = llama.cpp、prod = vLLM 或 SGLang。不同 engine 使用不同的权重格式：llama.cpp 系列使用 GGUF，GPU engine 使用 HF safetensors，因此不同阶段之间可能需要进行格式转换。

**Type:** Learn
**Languages:** Python（stdlib，engine 决策树遍历器）
**Prerequisites:** Phase 17 中涉及 engine 的所有课程（04、06、07、09、18）
**Time:** 约 45 分钟

## 学习目标

- 根据硬件（CPU / AMD / NVIDIA Hopper / Blackwell）、规模（1 个用户 / 100 个 / 10,000 个）和工作负载（通用对话 / Agent / long-context）选择 engine。
- 说明 TGI 在 2026 年的 maintenance-mode 状态（始于 2025 年 12 月 11 日），以及为什么这会促使新项目倾向于选择 vLLM 或 SGLang。
- 描述 dev/staging/prod pipeline，包括 GGUF-to-safetensors 格式转换位于不同阶段之间的什么位置。
- 解释为什么“CPU-first”指向 llama.cpp，以及为什么“AMD”会排除 TRT-LLM。

## 问题

你的团队开始了一个新的 self-hosted LLM 项目。一位工程师建议使用 Ollama，另一位建议使用 vLLM，第三位则问：“TGI 不是开箱即用吗？”在不同 Context 下，三个人都说得对。但没有任何一个答案适用于所有情况。

在 2026 年，决策树的顺序很重要：首先考虑硬件，然后考虑规模，最后考虑工作负载。2025 年还发生了一件具体事件：TGI 于 12 月 11 日进入 maintenance mode，这改变了新项目的默认选择。

## 概念

### 五种 engine

| Engine | 最适合 | 说明 |
|--------|----------|-------|
| **llama.cpp** | CPU / edge / 最少依赖 / 最广泛的 Model 支持 | 在 CPU 上速度最快，可全面控制 |
| **Ollama** | 开发笔记本、单用户、一条命令安装 | 比 llama.cpp 慢 15-30%；生产环境吞吐量相差 3 倍 |
| **TGI** | HF 生态系统、受监管行业 | **自 2025 年 12 月 11 日起处于 maintenance mode** |
| **vLLM** | 通用生产环境、100+ 用户 | 广泛适用的生产默认方案；v0.15.1 发布于 2026 年 2 月 |
| **SGLang** | Agentic multi-turn、prefix 密集型工作负载 | 已有超过 400,000 块 GPU 用于生产环境 |

### 硬件优先决策

**CPU-first** → llama.cpp。Ollama 也可以运行，但速度较慢。其他 engine 在 CPU 上都不具备竞争力。

**AMD GPU** → vLLM 是支持最完善的路径（支持 AMD ROCm）。SGLang 也可以运行。TRT-LLM 仅限 NVIDIA，因此不在考虑范围内。

**NVIDIA Hopper（H100 / H200）** → vLLM、SGLang 或 TRT-LLM。三者都处于第一梯队。

**NVIDIA Blackwell（B200 / GB200）** → TRT-LLM 是吞吐量领先者（Phase 17 · 07）。vLLM 和 SGLang 紧随其后。

**Apple Silicon（M-series）** → llama.cpp（Metal）。Ollama 在其外层进行了封装。

### 其次按规模决策

**1 个用户 / 本地开发** → Ollama。一条命令即可启动，数秒内生成第一个 Token。

**10-100 个用户 / 小型团队** → vLLM 单 GPU。

**100-10k 个用户 / 生产环境** → vLLM production-stack（Phase 17 · 18）或 SGLang。

**10k+ 个用户 / 企业环境** → vLLM production-stack + 解耦式服务（Phase 17 · 17）+ LMCache（Phase 17 · 18）。

### 最后按工作负载决策

**通用聊天 / 问答** → vLLM 是最通用的默认选择。

**Agentic multi-turn（Tool、规划、memory）** → SGLang 的 RadixAttention（Phase 17 · 06）占据优势。

**具有大量 prefix 复用的 RAG** → SGLang。

**代码生成** → vLLM 足够胜任；SGLang 在 cache 方面略有优势。

**Long context（128K+）** → vLLM + chunked prefill；SGLang + tiered KV。

### TGI maintenance mode 陷阱

Hugging Face TGI 于 2025 年 12 月 11 日进入 maintenance mode，此后只会修复 bug。过去它拥有一流的 observability、最佳的 HF 生态系统集成（model card、safety Tool），但原始吞吐量略逊于 vLLM。

对于 2026 年的新项目：默认不要选择 TGI。现有 TGI deployment 可以继续运行，但最终应该进行迁移。SGLang 和 vLLM 是更稳妥的默认选择。

### Pipeline 模式

Dev（Ollama）→ staging（llama.cpp）→ prod（vLLM）。不同 engine 使用不同的权重格式：llama.cpp 系列使用 GGUF，GPU engine 使用 HF safetensors，因此不同阶段之间可能需要进行格式转换。工程师可以在笔记本上快速迭代；staging 复现生产环境的 Quantization；prod 是最终服务目标。

### Ollama 注意事项

Ollama 非常适合开发，但不适合共享生产环境：Go HTTP serialization 会增加开销，并发管理比 vLLM 简单，OpenTelemetry 支持也较为落后。应在 Ollama 最擅长的场景中使用它，即一个用户、一条命令；进入共享环境后则切换到 vLLM。

### Self-hosted 与 managed 是两个独立决策

Phase 17 · 01（managed hyperscaler）和 · 02（Inference platform）介绍了 managed 方案。本课程假设你已经决定采用 self-hosted。选择 self-hosted 的理由包括：data residency、自定义 Fine-tune、大规模场景下的 total cost ownership，以及托管服务中没有可用的 domain Model。

### 应该记住的数字

- TGI maintenance mode：2025 年 12 月 11 日。
- vLLM v0.15.1：2026 年 2 月；PyTorch 2.10；支持 Blackwell SM120。
- SGLang 的生产规模：超过 400,000 块 GPU。
- Ollama 与 llama.cpp 的吞吐量差距：慢 15-30%；生产负载下相差 3 倍。

```figure
data-parallel
```

## 使用它

`code/main.py` 是一个决策树遍历器：根据硬件 + 规模 + 工作负载选择 engine，并解释原因。

## 交付它

本课程会生成 `outputs/skill-engine-picker.md`。它会根据约束选择 engine，并编写迁移计划。

## 练习

1. 使用你的硬件、规模和工作负载运行 `code/main.py`。输出结果是否符合你的直觉？
2. 你的基础设施包含 12 块 H100 和 8 块 MI300X AMD。应该选择什么 engine？为什么不能选择 TRT-LLM？
3. 某个团队想在 2026 年继续使用 TGI，因为“这是我们熟悉的方案”。请论证迁移的理由。
4. 从 Ollama dev 转向 vLLM prod：Quantization、配置和 observability 会发生哪些变化？
5. 一个 RAG 产品的 P99 prefix 长度为 8K，且不同 tenant 之间的复用率很高。请选择一个 engine，并将其与 Phase 17 · 11 + 18 组合使用。

## 关键术语

| 术语 | 人们通常怎么说 | 实际含义 |
|------|----------------|------------------------|
| llama.cpp | “CPU 方案” | Model 支持最广，在 CPU 上速度最快 |
| Ollama | “笔记本方案” | 一条命令安装，开发级吞吐量 |
| TGI | “HF 的服务方案” | 自 2025 年 12 月起处于 maintenance mode |
| vLLM | “默认方案” | 2026 年广泛适用的生产基线 |
| SGLang | “agentic 方案” | prefix 密集型，使用 RadixAttention |
| TRT-LLM | “仅限 NVIDIA” | Blackwell 吞吐量领先者，仅支持 NVIDIA |
| GGUF | “llama.cpp 格式” | 打包的 K-quant 变体 |
| Production-stack | “vLLM K8s” | Phase 17 · 18 的参考 deployment |
| Pipeline pattern | “dev→stage→prod” | Ollama → llama.cpp → vLLM；不同 engine 的权重格式不同 |

## 延伸阅读

- [AI Made Tools — 2026 年 vLLM、Ollama、llama.cpp 与 TGI 对比](https://www.aimadetools.com/blog/vllm-vs-ollama-vs-llamacpp-vs-tgi/)
- [Morph — 2026 年 llama.cpp 与 Ollama 对比](https://www.morphllm.com/comparisons/llama-cpp-vs-ollama)
- [n1n.ai — LLM Inference Engine 综合对比](https://explore.n1n.ai/blog/llm-inference-engine-comparison-vllm-tgi-tensorrt-sglang-2026-03-13)
- [PremAI — 2026 年生产环境中 10 个最佳 vLLM 替代方案](https://blog.premai.io/10-best-vllm-alternatives-for-llm-inference-in-production-2026/)
- [TGI maintenance 公告](https://github.com/huggingface/text-generation-inference) — release notes。
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
