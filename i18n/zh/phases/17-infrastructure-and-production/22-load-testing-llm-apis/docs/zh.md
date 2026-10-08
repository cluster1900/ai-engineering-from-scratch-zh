# 负载测试法师大师API 为什么 k6 和虫会说谎

> 传统的加载测试器不是用于流媒体响应,可变输出长度,Token 级测量或 GPU 和而设计的.大多数团队都会被两个陷咬住.GIL 陷:Locust 的代币级测量在 Python GIL 下运行代币化,在高并发时会与请求生成竞争;代币化后载 随后会提高报告的代币间延迟  瓶在你的客户端,而不是服务器.`--mean-input-tokens`其他`--stddev-input-tokens`修复这一点──2026年工具映射:LLM 专用工具(GenAI-Perf、LLMPerf、LLM-Locust、guidellm)用于代币级准确性;**k6 v2026.1.0**其他**k6 Operator 1.0 GA（2025 年 9 月）**流量知晓、Kubernetes-原生,通过TestRun/PrivateLoadZone CRD做分布式测试,最适合CI/CD门;Vegeta 用于Go常率和;Locust 2.43.3 只有配合LLM-Locust扩展才适用于流量──负载模式:稳定状态、ramp、spike(自动扩展测试)、soak(记忆泄漏)──

**Type:** Build
**Languages:** Python (stdlib, toy realistic-prompt generator + latency collector)
**前置要求：**时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: 时间: : 时间: : : 时间: : : 时间: : 时间: : : : 
**Time:** ~75 minutes

## 学习目标
- 解释让通用载荷测试器在LLMAPI上说谎的两个反模式
- 针对给定目的选择工具:LLMPerf(基准运行) 、k6+流媒体扩展) ‧CI门) ‧指导器 (大规模合成) ‧GenAI-Perf (NVIDIA参考) ‧
- 设计四种负载模式 (稳定,坡,尖,浸泡),并说出每种模式捕捉失败模式.
- 使用输入代币的平均值+stddev 构建真实的快速分布,而不是固定长度──

## 问题
您使用了 k6 测试了LLM终端点,设置了500个同步用户. 它已经停留了.

发生了两件事.第一,k6 发送了500个相同的提示. 您的请求-集结和预写缓存使它看起来像处理了500个同步解码,但实际上只是处理一个.第二,k6 不会以人体验的方式跟踪流媒体响应的间接代码延迟;它看到的是HTTP连接,而不是500个不同的间隔到达代码.

士学位的负载测试是独立学问.

## 概念
### ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,

据悉,在此次测试中,用户将会使用Python,并在客户端端进行代码化.

修复:LLM-Locust扩展将标记化移至独立进程,或者使用编译语言的接.

### 快速一致性陷

所有已知载荷测试器都允许你配置一个提示――在10,000次代循环测试中,每次都会发送完全相同的提示――服务器每次看到相同的前缓存击中 接近100%,输出看起来很好――

修复:从快速分发 中采样。LLMPerf 使用 `--mean-input-tokens 500 --stddev-input-tokens 150`长度多样,内容多样.

### 四种负载模式

1. **Steady-state** 以恒定RPS 运行 30-60 分钟――捕捉:基线性能回归――
2. **Ramp**在15分钟内将RPS从0 线性提高到目标值.
3. **Spike**突然升级到3-10倍的RPS,持续2分钟后恢复.
4. **Soak**稳定状态 运行 4-8 小时――捕捉:记忆泄漏、连接池漂移、可观度溢出――

### 2026 工具映射

**LLMPerf** Python,但代码化 由 Rust 支持──Mean/stddev提示──Streaming-aware──性能运行的最佳默认选择──

**NVIDIA GenAI-Perf** NVIDIA 的参考──使用Triton 客户端;metric 覆盖全面──注意它的ITL 不包含TTFT;LLMPerf 的包含──同一服务器 上两个工具会产生不同的TPOT──

**LLM-Locust**修复GIL陷的虫扩展――熟悉的虫DSL+流媒体测量――

**guidellm** 大规模合成基准――

**k6 v2026.1.0**其他**k6 Operator 1.0 GA（2025 年 9 月）**其他:
- 没有GIL,新增了流媒体意识的指标.
- k6 运营商使用TestRun/PrivateLoadZone CRD 进行Kubernetes本土分布式测试──
- 最适合IC/CD门和SLA测试.

**Vegeta** 走比 k6 更简单――恒定率HTTP和――不具备LLM意识能力,但适合网关/速度限制测试――

**Locust 2.43.3 stock**对LLM有GIL陷──只能配合LLM-Locust延长使用──

### CI 中的SLA门

在 PR 上运行 k6,并使用:

- 在基线RPS下各30-50次的代.
- 门:P50/P95 TTFT、5xx < 5%、TPOT 低于值──
- 违规时让建设失败.

### 真实的快速发行

从真流量样本构建 (如果有),或者从公开分布 构建 (例如用于聊天的ShareGPT提示、用于代码的HumanEval) 将意味着+stddev 输入LLMPerf──无论如何都必须避免循环-with-one-prompt──

### 你应该记住的数字

- 运营商 1.0 GA:2025 年 9 月。
- ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
- 典型的LLMPerf运行:在同时 X 下 100-1000请求.
- 典型的CI门:每次PR30-50次代.
- ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.


```figure
load-pattern-waves
```

## 使用它
`code/main.py`模拟带有真实快速分布的负载测试,测量有效的TPOT,并演示均快速陷

## 交付它
本课生成 `outputs/skill-load-test-plan.md`△给定工作负载和SLA 后,选择工具并设计四种负载模式──

## 练习
1. 运行`code/main.py`比较均和现实分布 差距在哪里?
2. 为CI门编写k6脚本:在100同时下 TTFT P95 <800 ms,运行时间5分钟.
3. 你的浸泡测试显示每小时内存增长50MB.
4. 杆测试从10 RPS到100 RPS──如果卡宾特+VLLM生产堆已就位了(17期 ·03+18期),预期恢复时间是多少?
5. 基因-Perf 在同一服务器上报告 TPOT=6ms;LLMPerf 报告 TPOT=11ms──解释原因──

## 关键术语
| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| LLMPerf | "LLM harness" | Anyscale benchmark tool，streaming-aware |
| GenAI-Perf | "NVIDIA tool" | NVIDIA reference harness |
| LLM-Locust | "Locust for LLMs" | 修复 GIL 陷阱的 Locust extension |
| guidellm | "synthetic benchmark" | Large-scale synthetic tool |
| k6 Operator | "K8s k6" | 基于 CRD 的 distributed k6 |
| GIL trap | "Python client overhead" | Tokenization backlog 抬高报告的 latency |
| Prompt-uniformity trap | "single-prompt lie" | 使用相同 prompt 循环命中 cache，抬高 throughput |
| Steady-state | "constant load" | 持续 N 分钟的平坦 RPS |
| Ramp | "linear up" | 在 duration 内从 0 到目标值 |
| Spike | "burst test" | 突然倍增，然后恢复 |
| Soak | "long test" | 用数小时检测 leak |

## 延伸阅读
- [TianPan — Load Testing LLM Applications](https://tianpan.co/blog/2026-03-19-load-testing-llm-applications)
- [PremAI — Load Testing LLMs 2026](https://blog.premai.io/load-testing-llms-tools-metrics-realistic-traffic-simulation-2026/)
- [NVIDIA NIM — Introduction to LLM Inference Benchmarking](https://docs.nvidia.com/nim/large-language-models/1.0.0/benchmarking.html)
- [TrueFoundry — LLM-Locust](https://www.truefoundry.com/blog/llm-locust-a-tool-for-benchmarking-llm-performance)
- [LLMPerf](https://github.com/ray-project/llmperf)
- [k6 Operator](https://github.com/grafana/k6-operator)
