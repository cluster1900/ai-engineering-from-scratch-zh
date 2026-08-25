# 生产服务技术栈 — KV Offloading 与 Cache-Aware Routing

> 生产服务技术栈会将 router、engine 和 observability 连接到同一个 Kubernetes deployment 中，并将 KV cache 视为一种可以移出 GPU 的资源。KV offloading 会从 GPU memory 中提取 KV cache，并在不同查询和 engine 之间复用它（先放入 CPU DRAM，再放入 disk/Ceph）。vLLM 的 production-stack 是参考 deployment；LMCache 是 offloading layer。vLLM 0.11.0 KV Offloading Connector（2026 年 1 月）通过 Connector API（v0.9.0+）使这一过程支持异步和可插拔。offload 路径通常不会出现在请求路径中，但 cache miss 和 promotion 仍可能增加端到端延迟。即使没有共享 prefix，LMCache 也很有价值：当 GPU 耗尽 KV slot 时，可以从 CPU 恢复被 preempt 的请求，而不必重新计算 prefill。在 4 个 a3-highgpu-4g 上使用 16 块 H100（80GB HBM）的已公开 Benchmark 表明：当 KV cache 超过 HBM 容量时，原生 CPU offload 和 LMCache 都能显著提高吞吐量；当 KV 占用较低时，所有配置都与基线相当，仅有少量开销。

**Type:** Learn
**Languages:** Python（stdlib，简化的 KV spill 模拟器）
**Prerequisites:** Phase 17 · 04（服务引擎内部机制），Phase 17 · 06（SGLang/RadixAttention）
**Time:** 约 60 分钟

## 学习目标

- 绘制 vLLM production-stack 的各层：router、engine、KV offload、observability。
- 解释 KV Offloading Connector API（v0.9.0+），以及 0.11.0 的异步路径如何隐藏 offload 延迟。
- 量化 LMCache CPU-DRAM 在何时有帮助（KV > HBM），以及在何时会增加开销（KV 足够小，可以装入 HBM）。
- 根据 deployment 约束，在原生 vLLM CPU offload 与 LMCache connector 之间作出选择。

## 问题

你的 vLLM 服务显示 GPU HBM 使用率达到 100%，且每当并发量上升时都会发生 preemption 事件。请求被逐出、重新排队，而同一个 2K-Token prompt 在一分钟内被重新 prefill 四次。GPU compute 被消耗在重复的 prefill 上；goodput 远低于原始吞吐量。

增加更多 GPU 会导致成本线性增长。无法增加更多 HBM。但 CPU DRAM 很便宜，一个 socket 拥有 512 GB 以上容量；尽管其延迟比 HBM 差几个数量级，但足以存放“暂时 warm”的 KV cache。

LMCache 会将 KV cache 提取到 CPU DRAM，使被 preempt 的请求能够快速恢复，并让不同 engine 之间重复的 prefix 共享 cache，而不需要每个 engine 都重新执行 prefill。

## 概念

### vLLM production-stack

`github.com/vllm-project/production-stack` 是参考 Kubernetes deployment：

- **Router** — cache-aware（Phase 17 · 11）。消费 KV event。
- **Engines** — vLLM worker。每块 GPU 或每个 TP/PP group 对应一个。
- **KV cache offload** — LMCache deployment 或原生 connector。
- **Observability** — Prometheus scrape、Grafana dashboard、OTel trace。
- **Control plane** — service discovery、配置、rolling update。

以 Helm chart + operator 的形式交付。

### KV Offloading Connector API（v0.9.0+）

vLLM 0.9.0 引入了面向可插拔 KV cache backend 的 Connector API。engine 将 block offload 到 connector；connector 负责存储这些 block（RAM、disk、object storage、LMCache）。当请求需要某个 block 时，connector 会将其重新加载。

vLLM 0.11.0（2026 年 1 月）增加了异步 offload 路径：offload 可以在后台进行，因此在常见情况下 engine 不会因此阻塞。端到端延迟和吞吐量仍取决于工作负载形态、KV cache 命中率和系统压力；vLLM 自身的说明指出，在低命中率下，custom-kernel offload 可能降低吞吐量，而且异步 scheduling 与 speculative decoding 之间存在已知的交互问题。

### 原生 CPU offload 与 LMCache

**原生 vLLM CPU offload**：engine-local。将 KV block 存储在 host RAM 中。实现简单，无 network hop。无法跨 engine 使用。

**LMCache connector**：cluster-scale。将 block 存储在共享的 LMCache server（CPU DRAM + Ceph/S3 tier）中。任何 engine 都可以访问这些 block。已有使用 16 块 H100 的公开 Benchmark。

当单个 engine 面临 HBM 压力时，选择原生方案。当多个 engine 共享 prefix 时，选择 LMCache，例如带有通用 system prompt 的 RAG，或使用共享模板的 multi-tenant 场景。

### Benchmark 表现

在 4 个 a3-highgpu-4g 上分布 16 块 H100（80 GB HBM）的测试表明：

- KV 占用较低（短 prompt、低并发）：所有配置都与基线相当，LMCache 会增加约 3-5% 的开销。
- 中等占用：LMCache 开始通过跨 engine 的 prefix 复用带来收益。
- KV 超过 HBM：原生 CPU offload 和 LMCache 都会显著提升吞吐量；由于可以跨 engine 共享，LMCache 的收益更大。

### LMCache 发挥决定性作用的情况

- 在 multi-tenant 服务中，不同 tenant 共享 system prompt。
- 在 RAG 中，document chunk 会在不同查询中重复出现。
- 同一个基础 Model 上的 Fine-tuned 变体（LoRA），通过复用基础 Model 的 KV 减少重复工作。
- preemption 频繁的工作负载：从 CPU 恢复比重新执行 prefill 更便宜。

### 不应启用的情况

- HBM 压力较小：你会付出开销，却得不到收益。
- Context 较短（<1K Token）：传输时间 > 重新执行 prefill 的时间。
- single-tenant、single-prompt 工作负载：没有可利用的复用机会。

### 与解耦式服务集成

Phase 17 · 17 的解耦式服务与 LMCache 可以叠加产生收益：从 prefill pool 传输到 decode pool 的 KV 如果未被使用，就会进入 LMCache；后续查询可以从 LMCache 中获取它。Phase 17 · 11 的 cache-aware router 可以将请求路由到本地 cache 或 LMCache 共享 cache 匹配的 engine。

### 应该记住的数字

- vLLM 0.9.0：发布 Connector API。
- vLLM 0.11.0（2026 年 1 月）：异步 offload 路径；端到端延迟的影响取决于工作负载、KV 命中率和系统压力，并非绝对保证。
- 16 块 H100 Benchmark：当 KV 占用超过 HBM 时，LMCache 会带来帮助。
- HBM 压力较小：产生 3-5% 的开销，却没有收益。

```figure
zero-sharding
```

## 使用它

`code/main.py` 会模拟启用和未启用 LMCache 时 preemption 频繁的工作负载。它会报告避免重新执行 prefill 的次数、吞吐量增益以及 HBM 利用率的盈亏平衡点。

## 交付它

本课程会生成 `outputs/skill-vllm-stack-decider.md`。它会根据工作负载形态和 vLLM deployment，在原生方案、LMCache 或两者都不使用之间作出选择。

## 练习

1. 运行 `code/main.py`。从多高的 HBM 利用率开始，LMCache 能够产生收益？
2. 某个 tenant 每小时有 200 个查询共享一个 6K-Token system prompt。计算每个 tenant 使用 LMCache 后的预期节省量。
3. LMCache server 是单点故障。设计其 HA 策略（replica、回退到原生方案）。
4. LMCache 将数据存储到机械硬盘上的 Ceph。对于 70B FP8 上 4K-Token、大小为 500 MB 的 KV，读取时间与重新执行 prefill 相比如何？
5. 论证 vLLM 0.11.0 的异步路径是否“免费”：开销隐藏在哪里？

## 关键术语

| 术语 | 人们通常怎么说 | 实际含义 |
|------|----------------|------------------------|
| Production-stack | “参考 deployment” | vLLM 的 Kubernetes Helm chart + operator |
| Connector API | “KV backend interface” | vLLM 0.9.0+ 的可插拔 KV store interface |
| Native CPU offload | “engine-local spill” | 将 KV 存储在同一个 engine 的 host RAM 中 |
| LMCache | “cluster KV cache” | 基于 CPU DRAM + disk 的跨 engine KV cache server |
| 0.11.0 async | “非阻塞 offload” | 隐藏在 engine stream 后方的 offload |
| Preemption | “逐出以腾出空间” | HBM 已满时进行的 KV cache 调整 |
| Prefix reuse | “相同的 system prompt” | 多个查询共享开头内容；cache hit |
| Ceph tier | “disk tier” | cache 层次结构中位于 DRAM 下方的持久化存储 |

## 延伸阅读

- [vLLM Blog — KV Offloading Connector（2026 年 1 月）](https://blog.vllm.ai/2026/01/08/kv-offloading-connector.html)
- [vLLM Production Stack GitHub](https://github.com/vllm-project/production-stack) — Helm chart + operator。
- [面向企业级 LLM Inference 的 LMCache（arXiv:2510.09665）](https://arxiv.org/html/2510.09665v2)
- [LMCache GitHub](https://github.com/LMCache/LMCache) — Connector 实现。
- [vLLM 0.11.0 release notes](https://github.com/vllm-project/vllm/releases) — 异步路径详情。
