# 选择  llama.cpp, Ollama, TGI, vLLM, SGLang

> 根据硬件,规模和生态系统来选择四个引擎主导自管推断.**llama.cpp**在CPU上最快的模式支持最广,对量化和线程拥有完全控制.**Ollama**是开发笔记本上的一条命令安装方案,比 llama.cpp 慢约15-30% ((Go + CGo + HTTP 序列化),在类生产负载下输出差距为3x。**TGI 于 2025 年 12 月 11 日进入维护模式**只做错误修复,原始产量比VLLM慢约10%,但过去在可观和HF生态系统集成方面通常是顶级水平.**vLLM**是通用生产默认选择  v0.15.1(2026年 2 月) 新增 PyTorch 2.10、RTX Blackwell SM120、H200优化──**SGLang**是机器多轮 / 前सर्ग重 专家  生产中有400,000+ GPUs(xAI、LinkedIn、Cursor、Oracle、GCP、Azure、AWS) ⋅硬件约束:仅能使用 llama.cpp。AMD /非NVIDIA →只能使用 vLLM(TRT-LLM 被 NVIDIA锁定) ・2026管道 模式:dev = Ollama,staging = llama.cpp,prod = vLLM SGLang──程全或使用相同的 GGUF/HF重量──

**Type:** Learn
**Languages:** Python (stdlib, engine-decision tree walker)
**Prerequisites:** 覆盖 engines 的所有 Phase 17 课程（04、06、07、09、18）
**Time:** ~45 分钟

## 学习目标
- 在给定硬件 (CPU/AMD/NVIDIA Hopper/Blackwell) 尺寸 (个用户/100/10,000) 和工作负载 (一般聊天/代理/长文) 当选择一个引擎时――
- 解释2026年TGI 维护模式状态 (?? 长) 以及为什么它会让新项目偏向VLLM或SGLang.
- 描述全程使用相同的GGUF或HF重量的开发/阶段/产品管道。
- 解释为什么只有CPU会强制使用 llama.cpp,而AMD会排除TRT-LLM──

## 问题
你的团队启动了一个新的自主管理LLM项目. 一个工程师说用Ollama,另一个说用VLLM,第三个说TGI不开箱即用吗?

在2026年,选择树很重要:先看硬件,次看规模,第三看工作负载.

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

**仅 CPU**马也能使用,但更慢.

**AMD GPU**现在,我们已经开始了.

**NVIDIA Hopper (H100 / H200)**们都在上.

**NVIDIA Blackwell (B200 / GB200)**转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型: 转型:

**Apple Silicon (M-series)**拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉拉

### 规模其次决策

**1 个用户 / local dev**拉玛 一条命令,数秒内第一代标语

**10-100 个用户 / 小团队** 单GPU

**100-10k 个用户 / production**                                                                                                                                                                                                                                                              

**10k+ 个用户 / enterprise**                                                                                                                                                                                                                                                              

### 工作负载 第三决策

**General chat / Q&A**们在广大默认场景中胜出.

**Agentic multi-turn（tools、planning、memory）**                                                                                                                                                                                                                                                              

**带有大量 prefix reuse 的 RAG**子子

**Code generation**现在,我们在上看了.

**Long context (128K+)**→ vLLM + 碎片预填;SGLang + 层次KV──

### 维护陷

拥抱面孔TGI 于2025年12月11日进入维护模式  之后只做bug fixes──过去:顶级可观测性、同类最佳HF 生态系统集成(模型卡、安全工具),原始吞吐量略落后于vLLM──

对于2026年的新项目:默认避开TGI──现有TGI部署可以继续,但最终应该迁移──SGLang 和 vLLM是更安全的默认选择──

### 管道 模式

工程师在笔记本上快速代; 舞台镜像生产量化;产品是服务目标──

### 奥拉马注意事项

欧拉马 很适合开发. 它不适合共享生产:Go HTTP 序列化 会增加开销,比vLLM 更简单,OpenTelemetry 支持滞后.把奥拉马 用在它擅长的地方.

### 自托管对管理是另一个决策

管理的平台 (包括管理的平台) 本课假设你已经决定自托管的理由:数据居住,定制细节调整,规模化后的总成本所有权,托管服务上不可用域名模型.

### 你应该记住的数字

- 维护模式:2025 年 12 月 11 日.
- 支持: 黑 SM120 支持:
- 产量足迹:400,000+GPU
- 拉马产量相对拉马的差距:慢15-30%;生产负载下3x──


```figure
data-parallel
```

## 使用它
`code/main.py`是一个决策树行人:给定硬件+规模+工作负载,选择一个引擎并解释原因.

## 交付它
本课产出发 `outputs/skill-engine-picker.md`◎ 给定约束,选择一个引擎并编写迁移计划.

## 练习
1. 用你的硬件/规模/工作负载运行`code/main.py`输出是否符合你的直觉?
2. 你的基础是12张H100和8张MI300XAMD.
3. 一个团队想在2026年使用TGI,因为这是我们熟悉的东西.
4. 如何实现量子化,配置和可观的变化?
5. 拉格产品的P99预写长为8K,并且租户间复用率很高――选择一个引擎,并结合了阶段17 · 11 + 18 组成堆――

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
- [TGI maintenance announcement](https://github.com/huggingface/text-generation-inference)发布说明.
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
