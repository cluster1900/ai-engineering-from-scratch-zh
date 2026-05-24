# LLMs 的 FinOps — 单位经济性与 Multi-Tenant 归因

> 传统 FinOps 在 LLM 支出上会失效。成本是 Token 交易，而不是资源在线时长。标签无法映射，一个 API call 是一笔交易，不是一项资产。工程决策（prompt 设计、context window、输出长度）就是财务决策。2026 playbook 要求从第一天起就埋点三个归因维度：per-user（`user_id`）用于 seat pricing 和 expansion，per-task（`task_id` + `route`）用于产品表面成本和优先级，per-tenant（`tenant_id`）用于单位经济性和续约。四个 Token 层：prompt、tool、memory、response，一个 bucket 会隐藏支出。Multi-tenant 产品的 enforcement ladder：按 tenant 设置 rate limit（预期峰值的 2-3x，清晰的 429 + retry-after）；daily spend cap（合同上限的 1.5-3x；触发 rate 收紧 + alert）；当 spend z-score > 4 时启用 kill switch（auto-pause + page on-call）。归因模式：tag-and-aggregate、telemetry-joiner（trace-ID → billing；准确性最高）、sampling-and-extrapolation、model-based allocation、event-sourced、real-time streaming。单位指标：cost per resolved query、cost per generated artifact，而不是 $/M Token。事后 tagging 总会漏；要在 request creation 时埋点。

**类型：** Learn
**语言：** Python（stdlib，带 kill switch 的玩具 cost-attribution simulator）
**先修：** Phase 17 · 13（Observability），Phase 17 · 14（Caching）
**时间：** 约 60 分钟

## 学习目标

- 解释为什么传统 FinOps（tags + tiers）在 LLM 支出上会失效，并说出三个新的归因维度。
- 枚举四个 Token 层（prompt、tool、memory、response），并说明为什么 single-bucket billing 会隐藏成本。
- 为 multi-tenant 产品设计 enforcement ladder（rate → spend cap → kill switch）。
- 选择单位指标（cost per resolved query / artifact），而不是 $/M Token。

## 问题

你的账单显示 $40,000。你不知道：
- 哪个 tenant 花掉了这笔钱。
- 哪个产品 feature 推动了这笔支出。
- 是否有某个 individual user 在滥用。
- 罪魁祸首是 prompt bloat、tool calls，还是 memory amplification。

Provider-side 的 tag-and-aggregate 对 cloud resources（EC2、S3）有效，因为 tags 会传播到 line items。LLM API calls 不会自动带 tag，你必须在 call site 打上 user/task/tenant，并一路传递。事后归因总会漏掉 edge cases。

## 概念

### 三个归因维度

**Per-user**（`user_id`）：谁产生了多少成本。驱动 seat pricing、expansion conversations，并识别 power users。

**Per-task**（`task_id` + `route`）：哪个 product surface 产生了多少成本。驱动 feature prioritization，以及是否 kill 昂贵 features 的决策。

**Per-tenant**（`tenant_id`）：哪个 customer 是 profitable。驱动单位经济性、renewal pricing、tier thresholds。

从第一天起就在 call site 埋点这三个维度。事后补总是更差。

### 四个 Token 层

| Layer | Example | Typical % of total |
|-------|---------|---------------------|
| Prompt | system + user input | 40-60% |
| Tool | tool-call results fed back | 20-40%（agent workloads） |
| Memory | prior conversation / retrieved docs | 10-30% |
| Response | model output | 10-30% |

把四层全部放进一个 bucket 会让优化失明。要在你的 attribution schema 中拆开它们。

### Enforcement ladder

1. **Rate limit** 按 tenant 设置。预期峰值的 2-3x。返回带 `Retry-After` 的 429。Tenant 会感受到阻力；不会出现意外账单。

2. **Daily spend cap** 按 tenant 设置。合同上限的 1.5-3x。触发：收紧 rate limit + alert customer-success。

3. **Kill switch** 基于相对于 tenant baseline 的 spend z-score > 4。Auto-pause tenant；page on-call；升级给 ops + CS。

### 归因模式

- **Tag-and-aggregate**：打 metadata headers；稍后聚合。简单；粗略。
- **Telemetry joiner**：通过 trace IDs 把 traces 连接到 billing。准确性最高。成熟团队会这样做。
- **Sampling + extrapolation**：sample 5-10%，再乘回去。用于粗略支出的成本有效；会漏掉 tail。
- **Model-based allocation**：用 regression 推断 cost driver。适用于没有 tags 的 legacy data。
- **Event-sourced**：把 cost 作为 stream（Kafka / Kinesis）中的 events。Real-time。
- **Real-time streaming**：dashboard 亚秒级更新。

### Cost per X 是单位指标

$/M Token 是 vendor 语言。产品指标是：

- 每个已解决支持工单的成本。
- 每篇生成文章的成本。
- 每个成功 agent task 的成本。
- 每用户会话分钟成本。

把成本绑定到产品结果。否则优化没有锚点。

### 成本归因 trace 结构

```
trace_id: abc123
  user_id: u_42
  tenant_id: t_7
  task_id: task_classify_doc
  route: model_haiku
  layers:
    prompt_tokens: 1800
    tool_tokens: 600
    memory_tokens: 400
    response_tokens: 150
  cost_usd: 0.0135
  cached_input: true
  batch: false
```

每次 call 都 emit。存进 data lake。按维度聚合。Phase 17 · 13 的 observability stack 就是它的落点。

### 复合节省栈

Stack：cache + batch + route + gateway。四个都用上时：
- Cache L2（Phase 17 · 14）：input 约便宜 10x。
- Batch（Phase 17 · 15）：50% off。
- Route 到便宜 model（Phase 17 · 16）：成本降低 60%。
- Gateway efficiency（Phase 17 · 19）：redundancy + retries。

最佳 stacked 情况：约为 naive baseline 的 5-10%。大多数团队启用了 2-3 个 lever；很少把四个全部 stack 起来。

### 你应该记住的数字

- 归因维度：per-user、per-task、per-tenant。
- 四个 Token 层：prompt、tool、memory、response。
- Kill switch：spend z-score > 4。
- 单位指标：cost per resolved query，而不是 $/M Token。
- Stacked optimizations：有可能达到 baseline 的约 5-10%。

## 使用它

`code/main.py` 模拟一个 multi-tenant LLM service，带三层 enforcement ladder。注入一个 abusive tenant，并演示 kill switch 触发。

## 交付它

本课会生成 `outputs/skill-finops-plan.md`。给定 product 和 scale，设计 attribution schema 和 enforcement ladder。

## 练习

1. 运行 `code/main.py`。Kill switch 在什么 z-score 触发？你如何选择阈值？
2. 设计一个 per-tenant、per-task cost dashboard。你会先构建哪 5 个视图？
3. 你最大的 tenant 是 unit-economics-negative。按 customer impact 顺序提出三个干预措施。
4. 为 support product 计算 cost per resolved ticket：3M Token/ticket，约 800 tickets/day，GPT-5 cached rate。
5. 论证 retroactive tagging 是否可能有效。什么时候可以接受？

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Per-user attribution | “user-level cost” | 每次 call 都打上 `user_id` |
| Per-task attribution | “feature cost” | `task_id` + `route` 识别 product surface |
| Per-tenant attribution | “customer cost” | `tenant_id`；驱动单位经济性 |
| Four token layers | “cost layers” | prompt + tool + memory + response |
| Rate limit | “429 guard” | 在 gateway 强制执行的 per-tenant ceiling |
| Daily spend cap | “daily ceiling” | Tenant-scoped budget，带 alert |
| Kill switch | “auto-pause” | Spend z-score > 4 触发 auto-suspension |
| Cost per resolved | “product unit metric” | 成本绑定到产品结果，而不是 Token |
| Telemetry joiner | “trace-to-billing” | 准确性最高的归因模式 |
| Stacked optimization | “cache+batch+route+gateway” | 复合节省到约 5-10% baseline |

## 延伸阅读

- [FinOps Foundation — AI FinOps Overview](https://www.finops.org/wg/finops-for-ai-overview/)
- [FinOps School — Cost per Unit 2026 Guide](https://finopsschool.com/blog/cost-per-unit/)
- [Digital Applied — LLM Agent Cost Attribution 2026](https://www.digitalapplied.com/blog/llm-agent-cost-attribution-guide-production-2026)
- [PointFive — Azure OpenAI 中的 Managed LLMs](https://www.pointfive.co/blog/finops-for-ai-economics-of-managed-llms-in-azure-open-ai)
