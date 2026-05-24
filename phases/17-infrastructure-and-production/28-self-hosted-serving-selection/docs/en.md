# Self-Hosted Serving 选择 — llama.cpp, Ollama, TGI, vLLM, SGLang

> 2026 年，四个引擎主导自托管 inference。根据硬件、规模和生态系统来选择。**llama.cpp** 在 CPU 上最快 — model 支持最广，对 quantization 和 threading 拥有完全控制。**Ollama** 是开发笔记本上的一条命令安装方案，比 llama.cpp 慢约 15-30%（Go + CGo + HTTP serialization），在类生产负载下 throughput 差距为 3x。**TGI 于 2025 年 12 月 11 日进入维护模式** — 只做 bug fixes，raw throughput 比 vLLM 慢约 10%，但过去在 observability 和 HF 生态系统集成方面通常是顶尖水平。这个维护状态让它成为有风险的长期选择 — 对新项目来说，SGLang 或 vLLM 是更安全的默认选项。**vLLM** 是通用生产默认选择 — v0.15.1（2026 年 2 月）新增 PyTorch 2.10、RTX Blackwell SM120、H200 optimization。**SGLang** 是 agentic 多轮 / prefix-heavy 专家 — 生产中有 400,000+ GPUs（xAI、LinkedIn、Cursor、Oracle、GCP、Azure、AWS）。硬件约束：仅 CPU → 只能用 llama.cpp。AMD / 非 NVIDIA → 只能用 vLLM（TRT-LLM 被 NVIDIA 锁定）。2026 pipeline 模式：dev = Ollama，staging = llama.cpp，prod = vLLM 或 SGLang。全程使用相同的 GGUF/HF weights。

**Type:** Learn
**Languages:** Python (stdlib, engine-decision tree walker)
**Prerequisites:** 覆盖 engines 的所有 Phase 17 课程（04、06、07、09、18）
**Time:** ~45 分钟

## 学习目标
- 在给定硬件（CPU / AMD / NVIDIA Hopper / Blackwell）、规模（1 个用户 / 100 / 10,000）和 workload（general chat / agent / long-context）时选择一个引擎。
- 说出 2026 年 TGI 维护模式状态（2025 年 12 月 11 日），以及为什么它会让新项目偏向 vLLM 或 SGLang。
- 描述全程使用相同 GGUF 或 HF weights 的 dev/staging/prod pipeline。
- 解释为什么“仅 CPU”会强制使用 llama.cpp，而“AMD”会排除 TRT-LLM。

## 问题
你的团队启动了一个新的自托管 LLM 项目。一个工程师说用 Ollama，另一个说用 vLLM，第三个说“难道 TGI 不是开箱即用吗？”三个人在不同上下文里都对。但没有一个适用于所有情况。

在 2026 年，选择树很重要：先看硬件，其次看规模，第三看 workload。还有一个具体的 2025 年事件 — TGI 在 12 月 11 日进入维护模式 — 改变了新项目的默认选择。

## 概念
### 五个引擎

| Engine | Best for | Notes |
|--------|----------|-------|
| **llama.cpp** | CPU / edge / minimal deps / 最广 model 支持 | CPU 上最快，完全控制 |
| **Ollama** | Dev laptops、单用户、一条命令安装 | 比 llama.cpp 慢 15-30%；生产 throughput 差距 3x |
| **TGI** | HF ecosystem、regulated industries | **2025 年 12 月 11 日维护模式** |
| **vLLM** | 通用生产、100+ 用户 | 广泛的生产默认选择；v0.15.1 2026 年 2 月 |
| **SGLang** | Agentic 多轮、prefix-heavy workloads | 生产中有 400,000+ GPUs |

### 硬件优先决策

**仅 CPU** → llama.cpp。Ollama 也能用，但更慢。没有其他引擎在 CPU 上有竞争力。

**AMD GPU** → vLLM（AMD ROCm 支持）。SGLang 也能用。TRT-LLM 被 NVIDIA 锁定，所以排除。

**NVIDIA Hopper (H100 / H200)** → vLLM 或 SGLang 或 TRT-LLM。三者都是顶级。

**NVIDIA Blackwell (B200 / GB200)** → TRT-LLM 是 throughput 领先者（Phase 17 · 07）。vLLM 和 SGLang 紧随其后。

**Apple Silicon (M-series)** → llama.cpp（Metal）。Ollama 对它进行了封装。

### 规模其次决策

**1 个用户 / local dev** → Ollama。一条命令，数秒内 first-token。

**10-100 个用户 / 小团队** → vLLM single-GPU。

**100-10k 个用户 / production** → vLLM production-stack（Phase 17 · 18）或 SGLang。

**10k+ 个用户 / enterprise** → vLLM production-stack + disaggregated（Phase 17 · 17）+ LMCache（Phase 17 · 18）。

### Workload 第三决策

**General chat / Q&A** → vLLM 在广泛默认场景中胜出。

**Agentic multi-turn（tools、planning、memory）** → SGLang 的 RadixAttention（Phase 17 · 06）占优。

**带有大量 prefix reuse 的 RAG** → SGLang。

**Code generation** → vLLM 可以；SGLang 在 cache 上略好。

**Long context (128K+)** → vLLM + chunked prefill；SGLang + tiered KV。

### TGI 维护陷阱

Hugging Face TGI 于 2025 年 12 月 11 日进入维护模式 — 之后只做 bug fixes。过去：顶级 observability、同类最佳 HF 生态系统集成（model cards、safety tools），raw throughput 略落后于 vLLM。

对 2026 年的新项目：默认避开 TGI。现有 TGI 部署可以继续，但最终应该迁移。SGLang 和 vLLM 是更安全的默认选择。

### Pipeline 模式

Dev（Ollama）→ staging（llama.cpp）→ prod（vLLM）。全程使用相同的 GGUF 或 HF weights。工程师在笔记本上快速迭代；staging 镜像生产 quantization；prod 是 serving 目标。

### Ollama 注意事项

Ollama 很适合 dev。它不适合共享 production：Go HTTP serialization 会增加开销，concurrency management 比 vLLM 更简单，OpenTelemetry 支持滞后。把 Ollama 用在它擅长的地方 — 一个用户、一条命令 — 然后在共享场景切换到 vLLM。

### 自托管 vs managed 是另一个决策

Phase 17 · 01（managed hyperscalers）、· 02（inference platforms）覆盖 managed。本课假设你已经决定自托管。自托管的理由：data residency、custom fine-tune、规模化后的 total cost ownership、托管服务上不可用的 domain model。

### 你应该记住的数字

- TGI 维护模式：2025 年 12 月 11 日。
- vLLM v0.15.1：2026 年 2 月；PyTorch 2.10；Blackwell SM120 支持。
- SGLang 生产足迹：400,000+ GPUs。
- Ollama throughput 相对 llama.cpp 的差距：慢 15-30%；生产负载下 3x。

## 使用它
`code/main.py` 是一个 decision-tree walker：给定 hardware + scale + workload，选择一个引擎并解释原因。

## 交付它
本课产出 `outputs/skill-engine-picker.md`。给定约束，选择一个引擎并编写迁移计划。

## 练习
1. 用你的 hardware / scale / workload 运行 `code/main.py`。输出是否符合你的直觉？
2. 你的 infra 是 12 张 H100 和 8 张 MI300X AMD。用什么引擎？为什么 TRT-LLM 不可选？
3. 一个团队想在 2026 年使用 TGI，因为“这是我们熟悉的东西”。论证迁移理由。
4. Ollama dev 到 vLLM prod：quantization、configuration 和 observability 会发生什么变化？
5. RAG 产品的 P99 prefix length 为 8K，并且租户间复用率很高。选择一个引擎，并结合 Phase 17 · 11 + 18 组成 stack。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| llama.cpp | “CPU 那个” | 最广 model 支持，CPU 上最快 |
| Ollama | “笔记本那个” | 一条命令安装，dev-grade throughput |
| TGI | “HF 的 serving” | 自 2025 年 12 月起维护模式 |
| vLLM | “默认选择” | 2026 年广泛生产 baseline |
| SGLang | “agentic 那个” | Prefix-heavy，RadixAttention |
| TRT-LLM | “NVIDIA 锁定” | Blackwell throughput 领先者，仅 NVIDIA |
| GGUF | “llama.cpp 格式” | Bundled K-quant variants |
| Production-stack | “vLLM K8s” | Phase 17 · 18 reference deployment |
| Pipeline pattern | “dev→stage→prod” | 同一 weights 上的 Ollama → llama.cpp → vLLM |

## 延伸阅读
- [AI Made Tools — vLLM vs Ollama vs llama.cpp vs TGI 2026](https://www.aimadetools.com/blog/vllm-vs-ollama-vs-llamacpp-vs-tgi/)
- [Morph — llama.cpp vs Ollama 2026](https://www.morphllm.com/comparisons/llama-cpp-vs-ollama)
- [n1n.ai — Comprehensive LLM Inference Engine Comparison](https://explore.n1n.ai/blog/llm-inference-engine-comparison-vllm-tgi-tensorrt-sglang-2026-03-13)
- [PremAI — 10 Best vLLM Alternatives 2026](https://blog.premai.io/10-best-vllm-alternatives-for-llm-inference-in-production-2026/)
- [TGI maintenance announcement](https://github.com/huggingface/text-generation-inference) — release notes。
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
