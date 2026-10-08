# 综合项目 14  推理服务器

> 在vLLM 0.7中,EAGLE-3在真流量上带来2.5-3x吞吐量──P-EAGLE (AWS 2026) 进一步推进了平行推测──SGLang的SpecForge大规模训练了草案负责人──Red Hat的推测中心为常见开放模型发布了一致的草案──TensorRT-LLM 让推测解码在NVIDIA上成为一流的能力──2026年生产服务堆是vLLM或SGLang,配合EAGLE家族的草案、FP8或INT4定量化,并基于排队做 HPA──这个顶尖的目标是使用完整的尾随机报告,为两个开放模型提供完整的尾随机报告, 达到基线量2.5+吞吐服务量──

**Type:** Capstone
**Languages:** Python (serving), C++ / CUDA (kernel inspection), YAML (configs)
**Prerequisites:** Phase 3 (Deep Learning), Phase 7 (Transformers), Phase 10 (LLMs from scratch), Phase 17 (infrastructure)
**Phases exercised:**子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子
**Time:** 30 小时

## 问题
投机解码在2026年变成了商品――EAGLE-3草案头 基于目标模型的隐藏状态 训练,并预测未来的N个代币;目标模型在单次通过中进行验证――60-80%的接受率将转化为2-3x的端到端吞吐量――vLLM 0.7 原生集成了这一能力――SGLang + SpecForge 提供训练管道――红帽投机者为Llama 3.3 70B、Q3-Coder-30B MoE、GPT-OSS-120B 发布了一致的草案――

关键技术不在模型中,而在服务运营中. 接受率会随流量分布漂移. 随流量分布漂移. 随流量分布漂移. 随流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量流量

## 概念
猜测解码有两层.**draft**模型 (3头,克,或更小的目标一致模型) 在每一步提出一个个候选标志.**target**任何被接受的前都会替代贪的路径――接受率取决于草案目标配合和输入分布――

由于验证通过更大,服务配置必须根据批量大小桶分类的延迟报告,以揭示这一点.

部署使用 Kubernetes──vLLM 0.7 每个GPU或子平行片段 运行一个复制片──HPA 基于排队等待而不是CPU自动扩展容量──FP8 (Marlin) 和 INT4 (AWQ) 量会让GPU内存保持在H100/H200的范围内──端到端报告包括吞吐量、接受率、批量1/8/32 下的p50/p99,以及$/1M代币──

## 架构
```
request ingress
    |
    v
vLLM server (0.7) or SGLang (0.4)
    |
    +-- draft: EAGLE-3 heads | P-EAGLE parallel | ngram fallback
    +-- target: Llama 3.3 70B | Qwen3-Coder-30B | GPT-OSS-120B
    |     quantized FP8-Marlin or INT4-AWQ
    |
    v
verify pass: batch k draft tokens through target
    |
    v (accept prefix; resample for rejected suffix)
    v
token stream back to client
    |
    v
Prometheus metrics: throughput, acceptance rate, queue wait, latency p50/p99
    |
    v
HPA on queue-wait metric
```

## 技术
- 服务:vLLM 0.7 或SGLang 0.4
- 投机方法:Eagle-3预案头,P-Eagle平行投机,克倒退
- 项目培训:SpecForge (SGLang) 或红帽投机者
- 目标模型:Llama 3.3 70B、Qwen3-Coder-30B MoE、GPT-OSS-120B
- 量化:FP8 (马林) 、INT4 AWQ
- 部署:Kubernetes + NVIDIA设备插件;基于排队等待的测量
- 标准: 分享GPT、MT-Bench-v2、GSM8K、HumanEval,用于测量跨域分布的接受率
- 参考:作为供应商的基线,TensorRT-LLM投机解码


```figure
cf-spec-decode
```

## 构建它
1. **Target model prep.**选择Llama 3.3 70B──通过马林定量到FP8──在1xH100或2x子平行上使用VLLM 0.7部署──

2. **Draft source.**从Red Hat Speculators 拉取一致的EAGLE-3草案头或通过SpecForge 训练一个) 载到vLLM的投机解码配置 中──

3. **Baseline numbers.**在投机之前:批量1/8/32 下的代币/s、p50/p99延迟、GPU利用量──发布结果──

4. **Enable EAGLE-3.**切换配置;重新运行同一个基准――报告速度率率率p99尾延迟三角率――

5. **P-EAGLE.**启用并行推测;测量更深的草稿树与系列EAGLE-3的差异.

6. **Domain traffic.**通过同一服务器运行,按分布测量接受率,识别草案发生漂移的条件.

7. **Second target model.**在Qwen3-Coder-30B MoE 上运行同一个管道――草案更棘手――MOE路由噪音)――报告结果――

8. **K8s HPA.**在K8下部署,并让HPA跟踪`queue_wait_ms`展示负载变为三倍时的规模化

9. **Cost comparison.**在同一个评估上计算 $/1M 代币,并与人类克劳德·索尼特4.7 和 OpenAI GPT-5.4 比较.

## 使用它
```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7, Llama 3.3 70B FP8, EAGLE-3 active
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms (620 tokens)
[cost]      $0.34 per 1M output tokens at sustained throughput
```

## 交付它
`outputs/skill-inference-server.md`描述可交付的情况. 一个经过测量的数据,带有投机式解码的服务堆,一个完整的基准报告以及一个K8的部署.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 相对 baseline 的实测 speedup | 在两个 model 上以匹配质量达到 2.5x+ throughput |
| 20 | 真实流量上的接受率 | 按分布划分的 acceptance-rate report |
| 20 | P99 tail-latency 纪律 | 使用和不使用 speculation 时，batch 1/8/32 下的 p99 |
| 20 | Ops | K8s deploy、基于 queue-wait 的 HPA、rollout smooth |
| 15 | Write-up 和 methodology | 清晰说明改变了什么以及为什么 |
| **100** | | |

## 练习
1. 当草案比目标 落后一个版本时 (例如,Llama 3.3 -> 3.4漂移),测量接受率降低――构建监测警报――

2. 实现格拉回落:如果EAGLE-3 接受率低于某个门,则转换为格拉草案――报告可靠性提高――

3. 运行受控的MoE实验:同一个Qwen3-Coder-30B,在注入路由噪音与不注入路由噪音 两种情况对比――测量草案接受敏感性――

4. 扩展到H200 (141GB) 报告每副本 获得的模型尺寸头,以及是否可以提供未定量化的Llama 3.3 70B──

5. 在同一H100硬件上标杆 TensorRT-LLM 投机解码――报告它对vLLM 胜出场景――

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Draft model | "Speculator" | 为 target 提出 N 个 Token 以供验证的小 model |
| EAGLE-3 | "2026 draft architecture" | 基于 target hidden state 训练的 draft head；约 75% 接受率 |
| P-EAGLE | "Parallel speculation" | 在一个 target pass 中验证的 draft branch tree |
| Acceptance rate | "Hit rate" | 无需 resampling 即被接受的 drafted Token 比例 |
| Quantization | "FP8 / INT4" | 更低精度的 weights，用于在 GPU memory 中容纳更多 model |
| Queue wait | "HPA metric" | request 在 inference 开始前于 pending queue 中等待的时间 |
| Speculators hub | "Aligned drafts" | Red Hat Neural Magic 为常见 open model 提供的 EAGLE draft hub |

## 延伸阅读
- [vLLM EAGLE and P-EAGLE documentation](https://docs.vllm.ai)参考服务堆
- [P-EAGLE (AWS 2026)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/)平行投机解码纸 + 整合
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) 项目头训练管道
- [Red Hat Speculators](https://github.com/neuralmagic/speculators) 配线的草稿中心
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/)供应商替代品
- [Fireworks.ai serving architecture](https://fireworks.ai/blog)商业参考
- [EAGLE-3 paper (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840)方法论文
- [vLLM repository](https://github.com/vllm-project/vllm)代码和基准
