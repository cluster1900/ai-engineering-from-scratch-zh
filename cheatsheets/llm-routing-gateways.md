---
id: llm-routing-gateways
title: LLM Routing and AI Gateways Compared
code: LR
subtitle: 选择网关，设置别名与回退链，在便宜模型与前沿模型之间路由，并对慢的安全读做对冲。
hue: 28
sources: phases/13-tools-and-protocols/21-llm-routing-layer, phases/17-infrastructure-and-production/16-model-routing, phases/17-infrastructure-and-production/19-ai-gateways, projects/hedged-request-lab
source_hash: a1945e8a5b44ac60
---

## AI 网关并列对比
type: comparison
span: 2
from: phases/17-infrastructure-and-production/19-ai-gateways/docs/en.md, phases/13-tools-and-protocols/21-llm-routing-layer/docs/en.md, phases/17-infrastructure-and-production/19-ai-gateways/outputs/skill-gateway-picker.md

| 因素 | LiteLLM | Portkey | Kong AI Gateway | Cloudflare / Vercel |
|---|---|---|---|---|
| 代码 | MIT 开源，Python | 自 March 2026 起 Apache 2.0 开源 | 基于 Kong Gateway | 托管，零运维 |
| 开销 | 5-15 ms | 20-40 ms | 3-8 ms | 边缘 1-3 ms |
| 规模 | ~2000 RPS、8 GB 时崩溃 | 控制面 | 比 Portkey 快 228% | 边缘优势 |
| 限流 | 令牌桶 | 分级 | 滑动窗口 | 有限 |
| 护栏 | 可选 | 内置护栏，PII 脱敏 | 内置护栏 | 有限 |
| 价格 | 开源 $0 | 生产档 $49/mo | $100/model/month，Plus 最多 5 个 | 仅托管 |
| 最适合 | Python，<500 RPS，开发 | 受监管行业 | 已在用 Kong，>1000 RPS | 边缘 JavaScript 应用 |

## 何时选用
type: concepts
from: phases/13-tools-and-protocols/21-llm-routing-layer/docs/en.md, phases/17-infrastructure-and-production/19-ai-gateways/docs/en.md, phases/17-infrastructure-and-production/19-ai-gateways/outputs/skill-gateway-picker.md, phases/13-tools-and-protocols/21-llm-routing-layer/outputs/skill-routing-config-designer.md

- **LiteLLM**：有 SRE 团队，需要数据主权，且低于 500 RPS。
- **OpenRouter**：托管 SaaS，300+ 家厂商，按额度付费。你不想要任何基础设施。
- **Portkey**：需要开箱即用的护栏与合规。
- **Kong AI Gateway**：已在运行 Kong，且需要超过 1000 RPS。
- **Cloudflare / Vercel**：在边缘提供 JavaScript 服务，需要零运维。
- **自托管**：数据驻留要求如此。医疗和金融默认自托管。
- **不用网关**：单模型原型。直接调用 API 更简单。

## 路由模式
type: comparison
from: phases/17-infrastructure-and-production/16-model-routing/docs/en.md, phases/17-infrastructure-and-production/16-model-routing/code/main.py

| 因素 | 预路由 | 级联 | 集成 |
|---|---|---|---|
| 方式 | 前置分类器 | 先便宜模型，再升级 | 便宜与前沿模型并行 |
| 延迟 | 增加 ~5-10ms，最快 | 中位数 ~1.2x，升级时 ~2x | 并行运行 |
| 质量 | 取决于分类器 | 质量下限最好 | 最高 |
| 成本 | 只有简单请求便宜 | 便宜模型加升级时的前沿模型 | 成本最高 |
| 适用场景 | 分类器准确 | 质量下限重要 | 仅关键 A/B |

## 网关请求路径
type: architecture
from: phases/17-infrastructure-and-production/19-ai-gateways/code/main.ts

```arch
node | client | 1,1 | Client | presented API key | client
node | auth | 2,1 | AuthService | 401 invalid api key | process
node | limit | 3,1 | TokenBucketLimiter | 429 rate limit exceeded | process
node | fb | 3,2 | callWithFallback | chain in order | process
node | retry | 2,2 | callWithRetry | backoff on retryable | process
node | prov | 1,2 | Providers | openai, anthropic, self-hosted | model
edge | client | auth | handle
edge | auth | limit | tenant
edge | limit | fb | allowed
edge | fb | retry | each provider
edge | retry | prov | call
```

## 一次请求：route()
type: flow
from: phases/13-tools-and-protocols/21-llm-routing-layer/code/main.py

1. **redact_pii**：SSN 和 16 位卡号模式替换为 `[REDACTED]`。
2. **route**：`ROUTES.get(alias, [alias])` 给出回退链。
3. **provider_call**：`OUTAGE` 中的模型抛出模拟的 5xx。
4. **route**：遇到 `RuntimeError` 时尝试链中的下一个模型。
5. **成本**：`prompt_tokens` 乘 `in_rate` 加 `completion_tokens` 乘 `out_rate`，再除以 `1_000_000`。
6. **route**：所有模型都失败时，`error` 为 "all providers failed"。

## 代码中的别名路由网关
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/21-llm-routing-layer/code/main.py

```python
ROUTES = {"smart": [...], "fast": [...]}  # alias to fallback chain
PRICES = {"openai/gpt-4o": (5.0, 15.0)}   # per 1M tokens, in and out
inv = route("smart", [{"role": "user", "content": "<prompt>"}])
inv.chosen_model                          # first model that answered
inv.attempts                              # every model tried, in order
inv.input_tokens, inv.output_tokens       # from usage
inv.cost_usd                              # tokens times PRICES
inv.redacted                              # True when PII matched
inv.error                                 # "all providers failed"
OUTAGE.add("openai/gpt-4o")               # simulate a primary outage
```

## 代码中的任务
type: task-table
from: phases/13-tools-and-protocols/21-llm-routing-layer/code/main.py, phases/17-infrastructure-and-production/16-model-routing/code/main.py, phases/17-infrastructure-and-production/16-model-routing/code/main.ts, phases/17-infrastructure-and-production/19-ai-gateways/code/main.py, phases/17-infrastructure-and-production/19-ai-gateways/code/main.ts, projects/hedged-request-lab/solution/main.go

| 任务 | 代码 |
|---|---|
| 路由一个别名 | `route(alias, messages)` |
| 分派前清除 PII | `redact_pii(text)` |
| 比较路由模式 | `simulate("CASCADE", reqs)` |
| 按策略选模型 | `router.pick(c.signals, c.policy)` |
| 网关回退模拟器 | `simulate_fallback(gateway, n=1000, seed=7)` |
| 重试一个厂商 | `callWithRetry(provider, prompt, cfg)` |
| 按顺序尝试厂商 | `callWithFallback(chain, prompt, cfg)` |
| 对冲一次安全读 | `Hedged(ctx, client, endpoints, delay)` |

## 运行实验
type: command-table
span: 2
from: phases/13-tools-and-protocols/21-llm-routing-layer/code/main.py, projects/hedged-request-lab/README.md, projects/hedged-request-lab/solution/main.go

| 命令 | 作用 |
|---|---|
| `python code/main.py` | 路由网关：正常、故障、PII 和全部宕机场景 |
| `python3 scripts/project_test.py hedged-request-lab --init <dir>` | 创建工作目录。实现之前 starter 会失败 |
| `python3 scripts/project_test.py hedged-request-lab --stage 1 --path <dir> --strict` | 为一个阶段评分 |
| `python3 scripts/project_test.py hedged-request-lab --all --solution --strict` | 为参考解答评分 |
| `go run . --samples 3 --delay-ms 10 --out /tmp/hedge-report.json` | 在 `solution` 中：在回环地址上对比基线与对冲 |
| `go run . --primary <url> --secondary <url>` | 对你自己的两个安全读端点做对冲 |
| `python3 scripts/project_test.py hedged-request-lab --all --path <dir> --strict --report <file>` | 写出完成证据 |

## 默认值与限制
type: defaults
from: phases/17-infrastructure-and-production/16-model-routing/code/main.ts, phases/17-infrastructure-and-production/19-ai-gateways/code/main.ts, projects/hedged-request-lab/README.md, projects/hedged-request-lab/solution/main.go

| 设置 | 默认值 | 说明 |
|---|---|---|
| `hardSetThreshold` | 0.88 | 达到或超过时，路由器固定使用前沿模型 |
| `maxAttempts` | 2 | 演示中每个厂商的重试预算 |
| 免费档令牌桶 | `capacity: 2` | `refillPerSec: 0.5`，第三次调用得到 429 |
| `--delay-ms` | 10 | 对冲延迟，允许 0 到 1s |
| `--samples` | 3 | 每个策略的样本数，1 到 100 |
| `--out` | `/tmp/aiefs-hedge-report.json` | 收据文件 |
| GET 尝试次数 | 2 | 响应体 64KiB，two-second 上限，100ms 宽限 |

## 故障排查
type: troubleshooting
from: phases/17-infrastructure-and-production/19-ai-gateways/docs/en.md, phases/17-infrastructure-and-production/19-ai-gateways/outputs/skill-gateway-picker.md, phases/17-infrastructure-and-production/16-model-routing/docs/en.md, phases/13-tools-and-protocols/21-llm-routing-layer/outputs/skill-routing-config-designer.md, projects/hedged-request-lab/README.md, projects/hedged-request-lab/project.json, projects/hedged-request-lab/solution/main.go

| 症状 | 原因 | 修复 |
|---|---|---|
| 接近 2000 RPS 时连锁故障 | LiteLLM 到达上限 | 先迁移到 Kong |
| TTFT P99 超过 100 ms SLA | Portkey 增加 20-40 ms | 使用 Kong 或 Cloudflare |
| 升级率超过 30% | 路由给便宜模型的流量过多 | 减少路由到便宜模型的流量 |
| 质量下降却没有告警 | 便宜模型漂移 | 用在线质量指标为路由把关 |
| 一次故障让别名整体不可用 | 链中只有一个厂商 | 增加第二个故障域 |
| 回退级联推高成本 | 重试没有预算 | 把重试计入预算 |
| 快速失败的错误赢得对冲 | 没有校验获胜者 | 要求 HTTP 200 且 `value` 非空 |
| 取消后没有省下工作量 | 服务端仍在工作 | 读取 `fixtureWork` 计数 |

## 数字与问答
type: qa
from: phases/17-infrastructure-and-production/19-ai-gateways/code/main.py, phases/17-infrastructure-and-production/16-model-routing/docs/en.md, phases/13-tools-and-protocols/21-llm-routing-layer/docs/en.md, phases/17-infrastructure-and-production/19-ai-gateways/outputs/skill-gateway-picker.md, phases/13-tools-and-protocols/21-llm-routing-layer/outputs/skill-routing-config-designer.md

- **回退带来什么？** 一个错误率 3% 的厂商可用性为 97%。两个为 99.94%，三个为 99.997%。
- **路由能省多少？** 案例研究中同等质量下省 20-60%。
- **70/30 分流效果如何？** 产品质量不变，账单下降 ~65%。
- **语义缓存能省多少？** 在重复的 agent 循环上省 30% 到 60%。
- **哪些在线关卡能发现漂移？** 每条路由的点赞、对 5% 样本做 LLM 裁判、升级率与拒答率。
- **最先对哪个指标告警？** 回退使用率，然后是网关延迟 P99。
