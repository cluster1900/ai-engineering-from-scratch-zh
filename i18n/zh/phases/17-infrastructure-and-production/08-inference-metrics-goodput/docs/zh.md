# 输入指标  TTFT、TPOT、ITL、Goodput、P99

> 四个指标决定一次推断部署 是否正常工作.TTFT 是预填加排加网络──TPOT(等于ITL) 是每个代币的内存绑定解码 成本──端到端延迟是TTFT加上TPOT 乘以输出长度──通过输出是整个机队 聚合后每秒代币数量──但对产品真正重要的是产量:同时满足每个SLO请求比例──在低优点下高输出意味着您无法处理用户的代币──2026年TRT-LLM 上 Llama-3.1-8B-Instruct 数字参考:平均TTFT 162 ms,平均TPOT 7.33 ms,平均E2E 1,093 ms,平均E150PP90p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9p9

**Type:** 学习
**Languages:** Python（stdlib，玩具版 percentile calculator 和 goodput reporter）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 60 分钟

## 学习目标
- 精确义 TTFT、TPOT、ITL、E2E、吞吐量和好输出,并指出每个指标测量组件──
- 解释为什么对LLM服务来说是错误的统计,以及如何读P50/P90/P99──
- 构建一个SLO多限制的系统 (例如TTFT<500 ms和TPOT<15 ms和E2E<2 s),并根据此计算好运行.
- 指出两种在同一运行中对TPOT的判断不一致的基准工具,并解释原因.

## 问题
我们的吞吐量是每秒15000个代币. 如果40%的请求端到端超过2秒,用户已经放弃了会议.

推理有多个延迟轴,每个轴的失败方式都不同.预先是计算的,并随即时长度扩展. 解码是内存的,并随批量大小扩展. 排队延迟是运行问题. 网络是物理距离的问题. 你需要每一个使用不同的指标,你需要百分比,并且你需要单一的复合,来说明用户是否得到预期结果,这是个好选择.

## 概念
### 时间到第一个代币

`TTFT = queue_time + network_request + prefill_time`

当提示 很长时间,预填占主导地位──在 H100 上运行的 Llama-3.3-70B FP8 中,一个32k提示需要约800 ms的纯预填.

### 互通代币间延迟

同一个量有很多名称.`TPOT`(输出代币的时间)`ITL`它们的使用速度`decode latency per token`之后,连续流媒体的代币之间的时间.

`TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced`

在同一个带碎片预填的Llama-3.3-70B H100堆上,TPOT平均为7 ms──没有碎片预填的时,当相邻序列 正在执行长的预填,TPOT可能会升到50 ms──关注P99,而不是意思──

### 电源延迟

`E2E = TTFT + TPOT * output_tokens + network_response`

对于长输出(>500代币),E2E由TPOT 主导──对于带长提示的短输出,E2E由TTFT 主导──报告按输出长度分组的E2E──

### 吞吐量

`throughput = total_output_tokens / elapsed_time`

聚合指标――告诉你舰队的效率――不能告诉你单个请求的健康状况――

###  你真正关心的标志

`goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)`

只有每个限制都满足,一个要求才是好──好就是这个比例──在60%的好下高下是失败──目标是低下达到99%的好──

到2026年,Goodput已经成为MLPerf推理 v6.0提交以及AI平台提供商内部SLA跟踪中使用的指标.

### 为什么是错误的统计量

在一个解码批量中,如果有一个长预填相邻请求,可能有500个代币的TPOT约为7ms,而有20个代币的TPOT约为60ms.

始终报告三元组(P50、P90、P99) 对于用户体验,P99 才是你需要优化的指标──

### 参考号码  TRT-LLM 上的lama-3.1-8B-Instruct,2026

- 平均TTFT: 162 ms
- 平均TPOT:7.33 ms
- 平均E2E: 1,093 ms
- P99 TPOT: 取决于碎片预填配置,通常在10-25ms之间变化.

这些是NVIDIA发布的参考点.它们会随机型的尺寸而变.

### 测量陷

2026年最常用的两个基准工具将在同一运行中对TPOT产生不同的结果:

- **NVIDIA GenAI-Perf**在ITL 计算中排除TTFT──ITL 从代币 2 开始──
- **LLMPerf**包含TTFT──ITL 从标志 1 开始──

对于一个TTFT为500ms,100个输出代币,总解码为700ms的请求,GenAI-Perf 报告`ITL = 700/99 = 7.07 ms`报告`ITL = 1200/100 = 12.00 ms`选工具会改变数字选工具

始终说明使用哪个工具──始终发布定义──

### 构建SLO

2026 年面向消费者的70B聊天模式的合理SLO:

- 光电 (TTFT P99 <= 800 ms;;
- 光电 (TPOT P99) <= 25 ms。
- 对于<300-Token 输出,E2E P99 <= 3 秒
- 产量目标 >=99%──

企业SLO将收紧TTFT(200-400ms)并放宽E2E──关键是把它们写下来,测量三者,并把好put 作为单个复合物 进行跟踪──

### 测量方法

- 运行真流量或真实合成`--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`
- 基准运行的目标是2倍的峰值同步性.
- 运行30-50次回复,对合并样本取百分比.
- 发布时包含工具名称、工具版本、模型、硬件、竞争力、快速分布──


```figure
throughput-latency
```

## 使用它
`code/main.py`是一个玩具版的好输出计算器. 产生合成延迟分布,应用SLO,并计算好输出.

## 交付它
本课会生成`outputs/skill-slo-goodput-gate.md`△给定一个工作负载和SLO,它会产生可用的CI/CD基准配方,使用好输出而不是吞吐量来实现门部署──

## 练习
1. 运行`code/main.py`产生带有1%尾尖的分布. 当你把P99TPOT从30ms 紧缩到15ms 时,好输出如何变化?
2. 某供应商引用 Llama 3.3 70B H100 上 15,000 个/s ──在相信它之前,应提出哪三个问题?
3. 为什么碎片预填可以保护P99TPOT,但不能保护TPOT的意思?
4. 为语音助理 构建一个消费者SLO(第一个代币是被听到,而不是被读到) ⋅哪个标志对用户最可见?
5. 阅读LLMPerf README和GenAI-Perf文档.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| TTFT | “time to first token” | Queue + network + prefill；在长 prompts 下由 prefill 主导 |
| TPOT | “time per output token” | 首个 Token 之后每个 Token 的 memory-bound decode 成本 |
| ITL | “inter-token latency” | 在大多数工具中与 TPOT 相同（不是全部，见 GenAI-Perf） |
| E2E | “end to end” | TTFT + TPOT * output_len；再加上 response-side network |
| Throughput | “tok/s” | Fleet efficiency；没有 latency percentiles 时没有意义 |
| Goodput | “SLO-met rate” | 同时满足每个 SLO constraint 的请求比例 |
| P99 | “tail” | 百分之一最差情形 latency；用户体验指标 |
| SLO multi-constraint | “the joint” | 三个 latency bounds 的 AND；只要违反任意一个，请求就失败 |
| GenAI-Perf vs LLMPerf | “the tool trap” | 工具对 ITL 是否包含 TTFT 的定义不一致 |

## 延伸阅读
- [NVIDIA NIM — LLM Benchmarking Metrics](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html) TTFT、ITL、TPOT 的权威定义──
- [Anyscale — LLM Serving Benchmarking Metrics](https://docs.anyscale.com/llm/serving/benchmarking/metrics) 替代定义与测量配方──
- [BentoML — LLM Inference Metrics](https://bentoml.com/llm/inference-optimization/llm-inference-metrics) 真实部署 上的应用测量──
- [LLMPerf](https://github.com/ray-project/llmperf)基于Ray的开源基准.
- [GenAI-Perf](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/client/src/c++/perf_analyzer/genai-perf/README.html)NVIDIA的基准工具──
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/)行业接受的,基于良好的产品基准.
