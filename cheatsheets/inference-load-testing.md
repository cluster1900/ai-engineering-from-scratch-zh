---
id: inference-load-testing
title: Inference Metrics and Load Testing
code: IM
subtitle: 找出压测为何失真。TTFT、TPOT、goodput、P99、真实 prompt、重试风暴与对冲读。
hue: 352
sources: phases/17-infrastructure-and-production/08-inference-metrics-goodput, phases/17-infrastructure-and-production/22-load-testing-llm-apis, projects/retry-storm-lab, projects/hedged-request-lab
source_hash: 26e858df4a14ef8f
---

## 症状、原因与修复
type: troubleshooting
from: phases/17-infrastructure-and-production/08-inference-metrics-goodput, phases/17-infrastructure-and-production/22-load-testing-llm-apis, projects/retry-storm-lab, projects/hedged-request-lab

| 症状 | 原因 | 修复 |
|---|---|---|
| 测试扛住 500 用户，生产在 200 时崩溃 | 相同的 prompt 命中前缀缓存 | `--mean-input-tokens` 加 `--stddev-input-tokens` |
| Locust ITL 很高，服务端正常 | GIL 陷阱：客户端分词积压 | LLM-Locust 或编译型压测工具 |
| GenAI-Perf TPOT 6 ms，LLMPerf 11 ms | GenAI-Perf 的 ITL 不含 TTFT | 写明工具与定义 |
| 吞吐高，用户流失 | goodput 低，尾延迟突破 SLO | 用 goodput 把关部署 |
| 平均 TPOT 9 ms，用户抱怨 | 右偏长尾，P99 TPOT 65 ms | 报告 P50、P90、P99 |
| TPOT 突增到 50 ms | 相邻序列的长 prefill | 分块 prefill |
| 所有客户端同时重试 | 同步的指数等待 | `--jitter=true` 和共享的 `--budget` |
| 对冲看似没有代价 | 取消不会停止服务端工作 | 在延迟旁统计 fixture 的工作量 |

## 指标公式
type: annotated-code
lang: text
span: 2
from: phases/17-infrastructure-and-production/08-inference-metrics-goodput/docs/en.md

```text
TTFT = queue_time + network_request + prefill_time  # before anything streams
TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced  # same as ITL
E2E = TTFT + TPOT * output_tokens + network_response  # TPOT-dominated above 500 tokens
throughput = total_output_tokens / elapsed_time  # fleet efficiency only
goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)
```

## main.py 中的 SLO 档位
type: comparison
from: phases/17-infrastructure-and-production/08-inference-metrics-goodput

| 因素 | loose | target | tight |
|---|---|---|---|
| TTFT ms | 800 | 500 | 300 |
| TPOT ms | 25 | 15 | 10 |
| E2E ms | 3000 | 2000 | 1500 |
| 结论 | 99% 时为 SHIPPABLE | 95% 时为 DEGRADED | 更低为 FAILING |

## 四种负载模式
type: comparison
span: 2
from: phases/17-infrastructure-and-production/22-load-testing-llm-apis/docs/en.md

| 因素 | 稳态 | 爬坡 | 尖峰 | 浸泡 |
|---|---|---|---|---|
| 形状 | 恒定 RPS | 从 0 到目标 RPS | 突然 3-10x RPS 后回落 | 稳态 |
| 时长 | 30-60 min | 15 min | 2 min | 4-8 小时 |
| 能发现 | 基线回归 | 容量拐点、预热异常 | 自动扩缩延迟、队列饱和、冷启动 | 内存泄漏、连接池漂移 |

## 各工具的适用场景
type: concepts
from: phases/17-infrastructure-and-production/22-load-testing-llm-apis/docs/en.md

- **LLMPerf**：基准测试运行。Rust 实现的分词，按均值/标准差生成 prompt。
- **GenAI-Perf**：需要 NVIDIA 参考结果时。ITL 不含 TTFT。
- **LLM-Locust**：团队在用 Locust。它修复了 GIL 陷阱。
- **guidellm**：大规模合成基准测试。
- **k6 v2026.1.0**：CI/CD 关卡与 SLA 测试。支持流式，无 GIL。
- **k6 Operator**：通过 TestRun / PrivateLoadZone CRD 做分布式测试。
- **Vegeta**：以恒定速率压满网关或限流。
- **原生 Locust 2.43.3**：测 LLM 时绝不单独使用。它有 GIL 陷阱。

## 运行实验
type: annotated-code
lang: bash
span: 2
from: projects/retry-storm-lab/README.md, projects/hedged-request-lab/README.md

```bash
python3 scripts/project_test.py retry-storm-lab --init /tmp/retry-storm-lab-work
python3 scripts/project_test.py retry-storm-lab --all --solution --strict
cd projects/retry-storm-lab/solution
go run . --clients 20 --budget 60 --jitter=false --out /tmp/synchronized.json  # synchronized waits
go run . --clients 20 --budget 60 --jitter=true --seed 7 --out /tmp/jittered.json  # seeded spread
go run . --local-http --clients 20 --budget 12 --out /tmp/retry-wire.json  # real loopback HTTP
node --experimental-strip-types cli.ts /tmp/retry-wire.json  # verify counters
cd projects/hedged-request-lab/solution
go run . --samples 3 --delay-ms 10 --out /tmp/hedge-report.json  # 80ms primary, 5ms secondary
```

## 实验参数默认值
type: defaults
from: projects/retry-storm-lab/solution/main.go, projects/retry-storm-lab/README.md, projects/hedged-request-lab/solution/main.go, projects/hedged-request-lab/README.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `--clients` | 20 | 并发客户端 |
| `--budget` | 12 | 共享的重试次数 |
| `--base-ms` | 10 | 初始退避 |
| `--max-ms` | 80 | 最大重试等待 |
| `--attempts` | 4 | 每个客户端最多尝试次数 |
| `--capacity` | 5 | 每个精确毫秒的模拟容量 |
| `--delay-ms` | 10 | 对冲延迟 |
| `--samples` | 3 | 每个策略的样本数 |

## 实验错误字符串
type: command-table
from: projects/retry-storm-lab/solution/main.go, projects/hedged-request-lab/solution/main.go

| 命令 | 作用 |
|---|---|
| `invalid bounded policy` | base 小于 1、cap 小于 base，或 attempts 超过 10 |
| `non-retryable HTTP status` | 状态码不是 429、502、503 或 504 |
| `server delay exceeds policy cap` | Retry-After 超过策略上限 |
| `retry attempts or shared budget exhausted` | 没有剩余尝试次数或预算 |
| `winner requires HTTP 200` | 快速失败的错误不能赢得对冲 |
| `body exceeds 64 KiB` | 响应体超过读取上限 |
| `no valid response` | 两次对冲尝试都失败 |
| `samples must be 1..100` | 样本数超出范围 |

## 一次对冲读
type: flow
from: projects/hedged-request-lab/stages, projects/hedged-request-lab/README.md

1. **Client**：发起主 GET 并启动延迟计时器。
2. **Client**：计时器到期前主请求有效，则不发起对冲。
3. **Client**：否则最多发起一个次请求。延迟为 0 到 1 秒。
4. **Validator**：只有带非空 JSON 值的 HTTP 200 才能获胜。
5. **Client**：取消落败者，并最多观察它 100ms。
6. **Receipt**：记录迟到和未观察到的尝试，以及获胜者延迟。
7. **Fixture**：统计取消后仍继续的服务端工作。

## 算例
type: qa
from: phases/17-infrastructure-and-production/08-inference-metrics-goodput, projects/retry-storm-lab/stages, projects/hedged-request-lab/stages

- **TTFT 500 ms，100 个 token 在 700 ms 内解码？** GenAI-Perf `ITL = 700/99 = 7.07 ms`。LLMPerf `ITL = 1200/100 = 12.00 ms`。
- **20 个客户端，每个 4 次尝试，预算 12？** 总共最多 32 次调用。
- **base 10，cap 25，无抖动？** 等待 10,20,25,25。
- **3 个基线样本和 3 个对冲样本？** 3 次调用对 6 次。fixture 记录 9 次。
- **样本 [2,4,10,20,80]？** P50=10，P95=80，最大值=80。
- **主请求在 1ms 返回 HTTP 500，次请求在 15ms 有效？** 次请求获胜。快速失败的错误不能获胜。

## 参考数字与关卡
type: tips
from: phases/17-infrastructure-and-production/08-inference-metrics-goodput/docs/en.md, phases/17-infrastructure-and-production/22-load-testing-llm-apis/docs/en.md

- Llama-3.1-8B-Instruct 在 TRT-LLM 上：平均 TTFT 162 ms，平均 TPOT 7.33 ms。
- 面向消费者的 70B SLO：TTFT P99 <= 800 ms，TPOT P99 <= 25 ms，goodput >= 99%。
- 以 2x 峰值并发运行。取 30-50 次迭代。
- 使用 `--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`。
- CI 关卡：P50/P95 TTFT，5xx < 5%，TPOT 低于阈值。超标即构建失败。
- 公布工具名、工具版本、模型、硬件、并发与 prompt 分布。
