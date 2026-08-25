# Multi-Region LLM Serving 与 KV Cache Locality

> 对缓存式 LLM inference 来说，round-robin load balancing 是有害的。一个请求如果没有落到持有其 prefix 的节点上，就要支付完整 prefill 成本：长 prompt 上 P50 约 800 ms，而 cache hit 时约 80 ms。到 2026 年，生产模式是 cache-aware router（Rust 写的 vLLM Router、llm-d router），它消费 KV-cache 事件，并基于 prefix-hash 匹配进行路由。近期研究（GORGO）把跨区域网络延迟作为 routing objective 中的显式项。商业化的 "cross-region inference" 产品（Bedrock cross-region inference、GKE multi-cluster gateways）把 inference 当作黑盒处理：它们处理可用性，不处理 TTFT。JPMorgan 和 Mayo Clinic 在 2024 年 11 月进行了 us-east-1 failover，约 22 分钟完成。DR 现实是：32% 的 LLM DR 失败，是因为团队备份了 weights，却忘了 Tokenizer 文件或 quantization configs。

**Type:** Learn
**Languages:** Python (stdlib, toy prefix-cache-aware router simulator)
**Prerequisites:** Phase 17 · 04 (vLLM Serving), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## 学习目标
- 解释为什么 round-robin load balancing 会破坏缓存式 inference，并量化 TTFT 惩罚。
- 画出 cache-aware router：输入（KV-cache events）、算法（prefix-hash match）、tie-breaker（GPU utilization）。
- 说出 LLM 的 32% DR 失败驱动因素（缺失 Tokenizer 文件 / quantization configs），并陈述三文件 DR checklist。
- 区分商业 cross-region 产品（Bedrock CRI、GKE Multi-Cluster Gateway）与 KV-aware routing。

## 问题
你的服务运行在 us-east-1、us-west-2 和 eu-west-1。你在前面放了一个 ALB，并使用 round-robin。生产中的 prefix cache hit rate 降到 8%。TTFT P50 增加到三倍。你的 vLLM logs 显示每个请求都在支付完整 prefill 成本。

Round-robin 对无状态服务是最优的。LLM inference 按设计就是有状态的：KV cache 编码了 model 已经看到的一切。盲目路由就是把请求路由到错误的 cache。

另外，你的团队有一个 DR plan。你把 model weights 备份到 S3 cross-region。区域故障发生；你尝试 failover；replica 拒绝启动。你忘了 tokenizer.json、quantization config 和 RoPE scaling config 在另一个没有同步的 bucket 里。

Multi-region LLM serving 是 cache 问题、routing 问题和 DR hygiene 问题，不是 load-balancer 问题。

## 概念
### Cache-aware routing

请求带着 prompt 到达。Router 对 prefix 做 hash（比如前 512 tokens）；它询问每个 replica：“你有这个 prefix 的 cache 吗？”。Replica 在分配和驱逐 blocks 时，通过 pub/sub channel 发布 KV-cache events。Router 选择匹配的 replica；如果没有匹配，就回落到基于 GPU-util 的 tie-breaker。

**vLLM Router**（Rust，2026 production-stack）：订阅 `kv.cache.block_added` events，维护 prefix-hash → replica index，用 O(1) lookup 路由。没有匹配时回落到 least-queue-depth。

**llm-d router**：同样的模式，Kubernetes-native。通过 ControlPlane API 发布 events。

**SGLang RadixAttention**（Phase 17 · 06）是 intra-replica 等价物。Cross-replica routing 严格发生在上游。

### Numbers

2K-token prompt 上的 TTFT P50，Llama 3.3 70B FP8，H100：
- Cache hit（同一 replica，prefix resident）：~80 ms。
- Cache miss（cold prefill）：~800 ms。

10x 差距。如果你的 router 在 replicas 之间达到 60-80% 的 prefix cache 命中，你就在 N-replica 容量下接近 single-replica 性能。如果它只有 10%，你接近 naive scaling。

### Cross-region 有一个新约束：network latency

Inter-region RTT：
- us-east-1 ↔ us-west-2: ~65 ms。
- us-east-1 ↔ eu-west-1: ~75 ms。
- us-east-1 ↔ ap-southeast-1: ~220 ms。

如果 routing 把请求从 us-east-1 送到 ap-southeast-1 的 hot prefix，节省的 prefill（800 → 80 ms）会被 440 ms round-trip 抵消。GORGO（2026 research）把这一点显式化：联合最小化 `prefill_time + network_latency`，而不是只最小化 prefill。答案通常是保持 regional routing，除非是 prefill 占主导的巨大 multi-MB prefixes。

### 商业 "cross-region inference" 在这里帮不上忙

AWS Bedrock cross-region inference 会在容量压力期间自动把请求路由到其他 regions。它优化可用性，不优化 TTFT，并且把 inference 当作黑盒。GKE Multi-Cluster Gateway 也是一样：service-level failover，不感知 KV cache。

即使用这些产品，你仍然需要 app-layer cache-aware router。它们处理“us-east-1 着火了”的情况。Cache-aware routing 处理 TTFT 情况。

### DR hygiene：32% missing-files 问题

广泛引用的 2026 统计：32% 的 LLM DR 失败，是因为团队备份了 weights，却忘了：

- `tokenizer.json` 或 `tokenizer.model`
- Quantization configs（`quantize_config.json`、AWQ scales、GPTQ zero-points）
- Model-specific configs（RoPE scaling、attention masks、chat templates）
- Engine config（`vllm_config.yaml`、sampling defaults、LoRA adapter manifests）

修复方式是三文件最小 DR manifest：

1. HF model repo 下的所有文件（weights + configs + Tokenizer）。
2. 引擎特定的 serving config。
3. Deployment manifest（K8s YAML、Dockerfile、dependency lock）。

另外：每季度运行一次 DR drill。JPMorgan us-east-1 drill 在 2024 年 11 月达到 22 分钟恢复，只是因为 playbook 已经演练过。

### Data residency 是正交问题

EU customer PHI 不能离开 EU。如果你的 cache-aware router 为了 prefix match，把巴黎发起的请求发送到 us-east-1，那么无论 TTFT 收益如何，你都已经违反 GDPR。先按 residency boundary 对 routers 分区，再优化 cache。

### 你应该记住的数字

- Cache hit vs miss TTFT 差距：~10x（2K prompt 上 80 ms vs 800 ms）。
- Inter-region RTT US-EU：~75 ms。
- DR failure：32% 缺失 Tokenizer/quant configs。
- JPMorgan us-east-1 failover 2024 年 11 月：22 分钟（30-min SLA）。

```figure
cache-aware-router
```

## 使用它
`code/main.py` 在 multi-region workload 上模拟三种 routing strategies（round-robin、cache-aware regional、cache-aware global）。报告 cache hit rate、TTFT P50/P99 和 cross-region bill。

## 交付它
本课产出 `outputs/skill-multi-region-router.md`。给定 regions、residency constraints 和 SLA，设计 routing plan。

## 练习
1. 运行 `code/main.py`。在 75 ms RTT 下，prompt length 到多少时 cross-region routing 会胜过 local-only routing？
2. 你的 cache hit rate 从 70% 降到 12%。诊断三个可能原因，以及能确认每个原因的 observables。
3. 为一个在 vLLM 中 serving、带 5 个 LoRA adapters 的 70B AWQ-quantized model 设计 DR manifest。列出每个 file 和 config。
4. 论证 Bedrock cross-region inference 对有严格 TTFT SLO 的 fintech 是否“足够”。引用具体行为。
5. 一个巴黎发起的请求匹配了 us-east-1 中的 prefix。你会路由它吗？写出 policy。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cache-aware routing | "smart LB" | 基于 prefix-hash match，把请求路由到持有 KV-cache 的 replica |
| KV-cache events | "cache pub-sub" | Replicas 发布 block add/evict；router 建索引 |
| Prefix hash | "cache key" | 前 N tokens 的 hash，用作 router lookup |
| GORGO | "cross-region routing research" | arXiv 2602.11688；把 network latency 作为显式项 |
| Cross-region inference | "Bedrock CRI" | AWS 产品；availability failover，不感知 TTFT |
| DR manifest | "the backup list" | 恢复所需的每个文件，不只是 weights |
| Data residency | "GDPR boundary" | 关于哪个 region 可以看到 user data 的法律约束 |
| RTT | "round-trip time" | Network latency；75 ms US-EU，220 ms US-APAC |
| LLM-aware LB | "cache-hit LB" | 作为产品类别的 cache-aware router |

## 延伸阅读
- [BentoML — Multi-cloud and cross-region inference](https://bentoml.com/llm/infrastructure-and-operations/multi-cloud-and-cross-region-inference)
- [arXiv — GORGO (2602.11688)](https://arxiv.org/html/2602.11688v1) — 带 network latency 项的 cross-region KV-cache reuse。
- [TianPan — Multi-Region LLM Serving Cache Locality](https://tianpan.co/blog/2026-04-17-multi-region-llm-serving-data-residency-routing)
- [AWS Bedrock Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html) — availability failover documentation。
- [vLLM Production Stack Router](https://github.com/vllm-project/production-stack) — cache-aware router source。
