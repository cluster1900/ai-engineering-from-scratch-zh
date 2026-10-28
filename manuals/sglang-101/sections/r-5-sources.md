# 源

> 手册按权威给源排序，本页列出各节引用的每一个外部源，以及用到它的那些节。

排序与[这本手册是怎么做成的](#s-ref-how-this-manual-was-made)一致。两类源冲突时，更高的赢，节里也会说明。各节用到的 SGLang 源文件记在手册源里并由审计检查。这里不列。下面每一页都在 2026-10-16 读过。研究更新加进来的那些研究与报告在 2026-10-22 读过。

## 排序后的源 {#s-ref-sources-the-ranked-sources}

| 等级 | 源 | 手册从中取用 | 源键 |
|---|---|---|---|
| 1 | 钉住标签上的 SGLang 源码，`baa9befa` | 每一个默认值和每一种机制 | 各节源文件，在手册源里 |
| 2 | [Mac 上](manuals/sglang-101/capture/out)和 [GPU 上](manuals/sglang-101/capture/gpu)的捕获运行 | 每一段 listing 和每一个标成测得的数字 | 捕获文件名 |
| 3 | SGLang 的 issue 与 pull request | 事故，以及每个特性的设计史 | `issue` 及其编号 |
| 4 | 论文 | RadixAttention 的原始设计，以及 SGLang 实现的方法 | `paper` 与标题 |
| 5 | 钉住标签上的 SGLang 文档 | 文档行为，对照代码核实 | `docs` 与标题 |
| 6 | 独立现场报告 | 本手册跑不了的 GPU 与规模 | `field`、作者与月份 |
| 7 | SGLang 团队与厂商报告 | 主张，一律标成作者的主张 | `team` 或厂商，以及月份 |

## 第 1 档与第 2 档：代码与捕获 {#s-ref-sources-rank-1-and-rank-2-the-code-and-the-captures}

| 源 | 用于 |
|---|---|
| SGLang 0.5.22, tag `v0.5.22`, commit `baa9befa381511cd4d56f83980951e5a45fffc6d`, [github.com/sgl-project/sglang](https://github.com/sgl-project/sglang) | 每一节 |
| Miles 0.1.2, tag `v0.1.2`, commit `a22fd824`, [github.com/radixark/miles](https://github.com/radixark/miles) | [7.2](#s-sglang-as-an-rl-rollout-engine) |
| 捕获套件及其 [Mac 运行](manuals/sglang-101/capture/out)，记于 2026-10-16 | 带 listing 的每一节 |
| GPU 套件及其[运行](manuals/sglang-101/capture/gpu)，于 2026-10-16 至 2026-10-21 记在一台 NVIDIA L4 节点和一台 DGX Spark (GB10) 上 | 带 GPU 测量的每一节 |
| Miles 镜像 `radixark/miles:latest`，Miles 提交 `08752a12`，带 SGLang 0.5.22.dev46+g7b6993a | [7.2](#s-sglang-as-an-rl-rollout-engine) |

## 第 3 档：pull request {#s-ref-sources-rank-3-pull-requests}

那些 issue 在[事故索引](#s-ref-incident-index)里。下面这些 pull request 解释一次设计变更。

| Pull request | 它改了什么 | 用于 |
|---|---|---|
| [#9241](https://github.com/sgl-project/sglang/pull/9241) | 预热后冻结垃圾回收器 | [1.2](#s-check-that-the-server-is-healthy) |
| [#11210](https://github.com/sgl-project/sglang/pull/11210) | 同一线程里用两条 CUDA stream 做 overlap | [2.4](#s-the-overlap-scheduler) |
| [#14312](https://github.com/sgl-project/sglang/pull/14312) | 把 `sgl-router` 改名为 `sgl-model-gateway` | [6.4](#s-sgl-model-gateway) |
| [#23906](https://github.com/sgl-project/sglang/pull/23906) | 把 prefill graph 字段挪进按阶段配置 | [4.1](#s-forwardmode-and-cuda-graphs) |
| [#29458](https://github.com/sgl-project/sglang/pull/29458) | CUDA 上可打断的 prefill graph | [4.1](#s-forwardmode-and-cuda-graphs) |
| [#32114](https://github.com/sgl-project/sglang/pull/32114) | 删除 Cutlass MLA、Dual Chunk FlashAttention 以及普通 GPTQ CUDA 内核 | [4.2](#s-attention-backend), [4.3](#s-quantization) |
| [#37898](https://github.com/sgl-project/sglang/pull/37898) | 在 20 到 35 GB GPU 上把 decode graph 上限从 24 提到 48 | [4.1](#s-forwardmode-and-cuda-graphs) |
| [#35455](https://github.com/sgl-project/sglang/pull/35455) | 加载 compressed-tensors 检查点的 KV scale，于 2026-08-20 合并 | [4.3](#s-quantization) |
| [#40795](https://github.com/sgl-project/sglang/pull/40795) | 删除旧基准别名 | [5.1](#s-sglang-benchmark-serving) |
| [#41818](https://github.com/sgl-project/sglang/pull/41818) | 加入 `--attn-dp-size`，并给 `--dp-size` 一个含义 | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| [#42285](https://github.com/sgl-project/sglang/pull/42285), [#42286](https://github.com/sgl-project/sglang/pull/42286), [#42287](https://github.com/sgl-project/sglang/pull/42287) | 去掉 prefill graph 的 torch.compile 路径 | [4.1](#s-forwardmode-and-cuda-graphs) |

## 第 4 档：论文 {#s-ref-sources-rank-4-papers}

| 论文 | 用于 |
|---|---|
| Zheng and others, SGLang: Efficient Execution of Structured Language Model Programs, [arXiv 2312.07104](https://arxiv.org/abs/2312.07104) | [2.2](#s-the-scheduler-loop-and-schedule-policy), [3.1](#s-kv-bytes-per-token-and-the-kv-pool), [3.3](#s-radixcache), [4.5](#s-structured-outputs-with-xgrammar) |
| The tail-optimized LRU policy that the code names, [arXiv 2510.15152](https://arxiv.org/abs/2510.15152) | [3.5](#s-eviction-policies-and-hicache) |
| Lee and others, From Tokens to Layers: Redefining Stall-Free Scheduling for MoE Serving with Layered Prefill, [arXiv 2510.08055](https://arxiv.org/abs/2510.08055) | [2.2](#s-the-scheduler-loop-and-schedule-policy) |
| Liu, Yu, and Yang, When Fancy Eviction Fails: Rethinking Cache Replacement For LLM Prefix Reuse, [arXiv 2609.28870](https://arxiv.org/abs/2609.28870) | [3.5](#s-eviction-policies-and-hicache) |
| Abramovich and others, SPEED-Bench: A Unified and Diverse Benchmark for Speculative Decoding, [arXiv 2604.09557](https://arxiv.org/abs/2604.09557) | [4.4](#s-speculative-decoding), [6.2](#s-moe-serving-deepep-and-eplb) |
| Kumar, Sanghavi, and Das, Test-Time Speculation, [arXiv 2605.09329](https://arxiv.org/abs/2605.09329) | [4.4](#s-speculative-decoding) |
| Agrawal and others, On Evaluating Performance of LLM Inference Serving Systems, [arXiv 2507.09019](https://arxiv.org/abs/2507.09019) | [4.4](#s-speculative-decoding) |
| Zhao and others, CoRun: Padding is Simple and Efficient for Deterministic LLM Inference, [arXiv 2608.14376](https://arxiv.org/abs/2608.14376) | [4.6](#s-deterministic-inference-and-logprobs) |
| Qin and others, Vosti: Specifying, Implementing, and Verifying Deterministic LLM Inference, [arXiv 2609.38981](https://arxiv.org/abs/2609.38981) | [4.6](#s-deterministic-inference-and-logprobs) |
| Patodiya, Same Request, Different Answer: Quantization Amplifies Cache-Induced Divergence in LLM Serving, [arXiv 2609.04748](https://arxiv.org/abs/2609.04748) | [4.6](#s-deterministic-inference-and-logprobs) |
| Chandrasekar and Kramberger, Identifying and Mitigating Systemic Measurement Bias in Production LLM Inference Benchmarks, [arXiv 2605.24217](https://arxiv.org/abs/2605.24217) | [5.1](#s-sglang-benchmark-serving) |
| Li and others, Revisiting Disaggregated Large Language Model Serving for Performance and Energy Implications, [arXiv 2601.08833](https://arxiv.org/abs/2601.08833) | [6.3](#s-prefill-decode-disaggregation) |

## 第 5 档：钉住标签上的 SGLang 文档 {#s-ref-sources-rank-5-sglang-documentation-at-the-tag}

| 页面 | 用于 |
|---|---|
| `docs/docs/hardware-platforms/apple_metal.mdx` | 封面，[2.1](#s-sglang-serve-and-the-three-processes)，[2.4](#s-the-overlap-scheduler) |
| `docs/docs/advanced_features/hyperparameter_tuning.mdx` | [2.3](#s-admission-and-retraction) |
| `docs/docs/advanced_features/hicache_design.mdx` and `radix_eviction_policy.mdx` | [3.5](#s-eviction-policies-and-hicache) |
| `docs/docs/advanced_features/attention_backend.mdx` | [4.2](#s-attention-backend) |
| `docs/docs/advanced_features/quantization.mdx` | [4.3](#s-quantization) |
| `docs/docs/advanced_features/speculative_decoding.mdx` | [4.4](#s-speculative-decoding) |
| `docs/docs/advanced_features/expert_parallelism.mdx` | [6.2](#s-moe-serving-deepep-and-eplb) |
| `docs/docs/advanced_features/pd_disaggregation.mdx` | [6.3](#s-prefill-decode-disaggregation) |
| `docs/docs/get-started/install.mdx` | [7.1](#s-operating-sglang) |
| `docs/docs/advanced_features/sglang_for_rl.mdx` | [7.2](#s-sglang-as-an-rl-rollout-engine) |

## 第 6 档：独立现场报告 {#s-ref-sources-rank-6-independent-field-reports}

| 作者 | 报告 | 月份 | 用于 |
|---|---|---|---|
| AIMultiple | [Inference engines benchmark](https://aimultiple.com/inference-engines) | 2026-01, answer 2026-10 | [1.3](#s-what-the-server-does-with-your-request), [5.3](#s-reading-other-peoples-benchmarks) |
| Alibaba Cloud, RBG and Mooncake teams | [A production inference platform with SGLang RBG and Mooncake](https://www.alibabacloud.com/blog/building-a-production-grade-cloud-native-large-model-inference-platform-with-sglang-rbg-%2B-mooncake_602933) | 2026-03 | [3.5](#s-eviction-policies-and-hicache) |
| Ant Group | [DeepSeek-R1 on H20 with SGLang, on the LMSYS blog](https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/) | 2025-09 | [4.4](#s-speculative-decoding), [6.1](#s-tp-size-dp-size-and-attn-dp-size), [6.2](#s-moe-serving-deepep-and-eplb), [7.1](#s-operating-sglang) |
| basbunarhasan on the NVIDIA developer forum | [SGLang with NVFP4 and DSpark on a DGX Spark](https://forums.developer.nvidia.com/t/qwen3-8-27b-at-34-38-tok-s-on-dgx-spark-open-source-one-command-setup-sglang-nvfp4-dspark/380257) | 2026-08 | [3.2](#s-mem-fraction-static-and-startup-sizing) |
| CERIT-SC | [Running LLMs at CERIT-SC](https://blog.cerit.io/blog/run-llm2/) and [a later post](https://blog-dev.cerit.io/blog/llm3/) | 2025-10, 2026-04 | [7.1](#s-operating-sglang) |
| Cloudflare | [Smaller, faster, safer models](https://blog.cloudflare.com/smaller-faster-safer-models/) | 2026-08 | [3.1](#s-kv-bytes-per-token-and-the-kv-pool), [4.3](#s-quantization) |
| Crusoe | [MLPerf Inference v6.1 results on AMD MI355X](https://www.crusoe.ai/resources/blog/serving-5-75-million-tokens-per-second-crusoes-mlperf-inference-v6-1-results-on-amd-mi355x) | 2026-09 | [5.3](#s-reading-other-peoples-benchmarks), [6.2](#s-moe-serving-deepep-and-eplb) |
| David Noel Ng | [GH200 benchmarking, part 4](https://dnhkng.github.io/posts/gh200-benchmarking-part-4-dsv4-released/) | 2026-08 | [4.4](#s-speculative-decoding) |
| DeepInfra | [vLLM vs SGLang](https://deepinfra.com/blog/vllm-vs-sglang) | 2026-08 | [5.3](#s-reading-other-peoples-benchmarks) |
| Doubleword | [Fast SGLang starts](https://fergusfinn.com/blog/fast-sglang-starts/) | 2026-04 | [7.1](#s-operating-sglang) |
| dstack | [Benchmarking prefill-decode ratios](https://dstack.ai/blog/benchmarking-pd-ratios/) | 2025-09 | [6.3](#s-prefill-decode-disaggregation) |
| Hazy Research | [Tensor-parallel Llama megakernel](https://hazyresearch.stanford.edu/blog/2025-09-28-tp-llama-main) | 2025-09 | [4.1](#s-forwardmode-and-cuda-graphs) |
| InferenceX by SemiAnalysis | [GLM-5 FP8 on MI355X](https://inferencex.semianalysis.com/blog/mi355x-glm5-fp8-sglang-40-cheaper-than-b200), [DeepSeek-V4-Pro on MI355X in 26 days](https://inferencex.semianalysis.com/blog/mi355x-deepseek-v4-pro-sglang-110x-in-26-days), and [GLM-5 NVFP4 on B200](https://inferencex.semianalysis.com/blog/b200-glm5-nvfp4-vs-h200-fp8-3-6x-perf-per-dollar) | 2026-05 | [4.1](#s-forwardmode-and-cuda-graphs), [5.3](#s-reading-other-peoples-benchmarks) |
| Jarvislabs | [SGLang vs vLLM on H100](https://jarvislabs.ai/blog/vllm-sglang-trtllm-comparison) | 2026-05 | [4.1](#s-forwardmode-and-cuda-graphs), [5.3](#s-reading-other-peoples-benchmarks) |
| Jarvislabs | [Managed endpoints](https://jarvislabs.ai/blog/managed-endpoints) | 2026-08 | [3.4](#s-prefix-friendly-prompts), [6.4](#s-sgl-model-gateway) |
| joshua8.ai | [LLM inference benchmark](https://joshua8.ai/llm-inference-benchmark/) | 2026-01 | [4.1](#s-forwardmode-and-cuda-graphs), [4.3](#s-quantization), [5.3](#s-reading-other-peoples-benchmarks) |
| LinkedIn Engineering | [Scaling LLM-based ranking systems with SGLang at LinkedIn](https://www.linkedin.com/blog/engineering/ai/scaling-llm-based-ranking-systems-with-sglang-at-linkedin) | 2026-02 | [1.2](#s-check-that-the-server-is-healthy), [2.1](#s-sglang-serve-and-the-three-processes), [7.1](#s-operating-sglang) |
| Luca Lowndes | [SGLang optimisations](https://luca.lowndes.net/blog/sglang-optimisations) | 2025-11 | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| Modal | [LLM almanac](https://modal.com/llm-almanac/summary) | 2025-06 | [5.3](#s-reading-other-peoples-benchmarks) |
| Novita AI | [SGLang with GLM MoE models, on Hugging Face](https://huggingface.co/blog/novita/sglang-glm4-moe) | 2026-01 | [6.3](#s-prefill-decode-disaggregation) |
| Pivot News | [A summary of a mixed Blackwell benchmark](https://pivotnews.ai/build/benchmarking-vllm-vs-sglang-vs-llama-cpp-on-a-mixed-blackwel) | 2026-05 | [4.3](#s-quantization), [5.3](#s-reading-other-peoples-benchmarks) |
| RunPod | [When to choose SGLang over vLLM](https://runpod.ghost.io/when-to-choose-sglang-over-vllm-multi-turn-conversations-and-kv-cache-reuse/) | 2025-06 | [3.3](#s-radixcache), [5.3](#s-reading-other-peoples-benchmarks) |
| SemiAnalysis | [InferenceMAX](https://newsletter.semianalysis.com/p/inferencemax-open-source-inference) | 2025-10 | [5.3](#s-reading-other-peoples-benchmarks) |
| Spheron | [vLLM vs TensorRT-LLM vs SGLang](https://www.spheron.network/blog/vllm-vs-tensorrt-llm-vs-sglang-benchmarks/) | 2026 | [5.3](#s-reading-other-peoples-benchmarks) |
| Steve Rawlinson | [vLLM vs SGLang on dual H100](https://rawlinson.ca/articles/vllm-vs-sglang-performance-benchmark-h100) | 2025-12 | [3.2](#s-mem-fraction-static-and-startup-sizing), [5.3](#s-reading-other-peoples-benchmarks) |
| Thinking Machines | [Defeating nondeterminism in LLM inference](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/) | 2025-09 | [4.6](#s-deterministic-inference-and-logprobs) |
| Varad More | [Inference engine benchmark system](https://github.com/varad-more/inference-engine-benchmark-system) | 2026-04 | [3.3](#s-radixcache), [4.2](#s-attention-backend), [4.5](#s-structured-outputs-with-xgrammar), [5.3](#s-reading-other-peoples-benchmarks) |
| vLLM community | [Discussion #17221](https://github.com/vllm-project/vllm/discussions/17221) | 2025-04 | [5.3](#s-reading-other-peoples-benchmarks) |

## 第 7 档：SGLang 团队与厂商报告 {#s-ref-sources-rank-7-sglang-team-and-vendor-reports}

| 作者 | 报告 | 月份 | 用于 |
|---|---|---|---|
| The vLLM team | [The state of FP8 KV cache and attention quantization in vLLM](https://vllm.ai/blog/2026-04-22-fp8-kvcache) | 2026-04 | [4.3](#s-quantization) |
| LMSYS | [SGLang with Llama 3](https://www.lmsys.org/blog/2024-07-25-sglang-llama3/) | 2024-07 | [5.3](#s-reading-other-peoples-benchmarks) |
| LMSYS | [SGLang v0.4: zero-overhead batch scheduler](https://lmsys.org/blog/2024-12-04-sglang-v0-4/) | 2024-12 | [2.4](#s-the-overlap-scheduler), [6.1](#s-tp-size-dp-size-and-attn-dp-size), [6.4](#s-sgl-model-gateway) |
| LMSYS | [DeepSeek with PD disaggregation and large-scale EP on 96 H100 GPUs](https://lmsys.org/blog/2025-05-05-large-scale-ep/) | 2025-05 | [6.2](#s-moe-serving-deepep-and-eplb), [6.3](#s-prefill-decode-disaggregation) |
| The Mooncake team on the LMSYS blog | [Kimi K2 with large-scale EP](https://www.lmsys.org/blog/2025-07-20-k2-large-scale-ep/) | 2025-07 | [6.3](#s-prefill-decode-disaggregation) |
| LMSYS | [SGLang HiCache](https://lmsys.org/blog/2025-09-10-sglang-hicache/) | 2025-09 | [3.5](#s-eviction-policies-and-hicache) |
| SGLang | [v0.5.21 release notes](https://github.com/sgl-project/sglang/releases/tag/v0.5.21) | 2026-10 | [3.5](#s-eviction-policies-and-hicache) |
| Google Cloud | [EAGLE-3 on Vertex AI](https://docs.cloud.google.com/gemini-enterprise-agent-platform/blog/posts/from-research-to-production-accelerate-oss-llm-with-eagle-3-on-vertex) | 2025-11 | [4.4](#s-speculative-decoding) |
| Modal with Decagon | [Decagon case study](https://frontend.modal.com/blog/decagon-case-study) | 2025-11 | [4.4](#s-speculative-decoding) |
| LMSYS and RadixArk | [Miles](https://www.lmsys.org/blog/2025-11-19-miles/) | 2025-11 | [7.2](#s-sglang-as-an-rl-rollout-engine) |
| RadixArk | [Miles v0.1](https://www.lmsys.org/blog/2026-08-18-miles-v0-1/) | 2026-08 | [7.2](#s-sglang-as-an-rl-rollout-engine) |
| The Miles team | `docs/advanced/p2p-weight-transfer.md`，Miles v0.1.2 | 2026-10 | [7.2](#s-sglang-as-an-rl-rollout-engine) |

Sources: front.md; the Sources line and the citations of every file under sections/.
