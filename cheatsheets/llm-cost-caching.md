---
id: llm-cost-caching
title: LLM Cost, Caching and Batch APIs
code: LC
subtitle: 为每次调用定价，缓存前缀与语义，批量处理离线任务并封顶开支。课程中的 Python 与 Rust。
hue: 40
sources: phases/11-llm-engineering/11-caching-cost, phases/11-llm-engineering/15-prompt-caching, phases/17-infrastructure-and-production/14-prompt-semantic-caching, phases/17-infrastructure-and-production/15-batch-apis, phases/17-infrastructure-and-production/27-finops-llms, projects/token-counter-and-cost-meter, projects/agent-budget-planner
source_hash: 379e5b3c4af278f4
---

## 任务
type: task-table
span: 2
from: phases/11-llm-engineering/11-caching-cost/docs/en.md, phases/11-llm-engineering/11-caching-cost/code/caching_cost.py, phases/11-llm-engineering/15-prompt-caching/docs/en.md

| 任务 | 代码 |
|---|---|
| 为一次调用定价 | `calculate_cost(model, input_tokens, output_tokens, cached_input_tokens=0)` |
| 标记可缓存块 | `"cache_control": {"type": "ephemeral"}` |
| 让块保留一小时 | `"cache_control": {"type": "ephemeral", "ttl": "1h"}` |
| 读取 Anthropic 缓存命中 | `response.usage.cache_read_input_tokens` |
| 读取 OpenAI 缓存命中 | `resp.usage.prompt_tokens_details.cached_tokens` |
| 创建 Gemini 缓存 | `client.caches.create(model=<model>, config=...)` |
| 使用 Gemini 缓存 | `config=types.GenerateContentConfig(cached_content=cache.name)` |
| 把查询路由到最便宜的模型 | `route_model(query, tier="pro")` |

## 缓存稳定前缀
type: annotated-code
lang: python
from: phases/11-llm-engineering/15-prompt-caching/docs/en.md, phases/11-llm-engineering/11-caching-cost/docs/en.md

```python
SYSTEM = [{
    "type": "text",
    "text": RUBRIC,  # stable text first
    "cache_control": {"type": "ephemeral"},  # 5 min TTL
}]
response = client.messages.create(
    model="<model>", max_tokens=1024,
    system=SYSTEM,
    messages=[{"role": "user", "content": code}],  # variable text last
)
response.usage.cache_creation_input_tokens  # paid at 1.25x
response.usage.cache_read_input_tokens  # paid at 0.1x
```

## 关键数字
type: concepts
from: phases/11-llm-engineering/15-prompt-caching/docs/en.md, phases/17-infrastructure-and-production/14-prompt-semantic-caching/docs/en.md, phases/17-infrastructure-and-production/15-batch-apis/docs/en.md, phases/17-infrastructure-and-production/27-finops-llms/docs/en.md, phases/11-llm-engineering/11-caching-cost/docs/en.md

- **缓存写入**：5 min TTL 为基础价 1.25x，1 小时 TTL 为基础价 2x。
- **缓存读取**：$0.30/M，而新输入为 $3.00/M。便宜十倍。
- **盈亏平衡**：1 次写入加 1 次读取为 0.675x。1 次写入加 10 次读取为 0.205x。
- **复用规则**：TTL 内读取 3 次及以上的块才缓存。
- **Batch**：输入和输出都打 50% 折扣。保证 24 h，通常 2 到 6 h。
- **Batch 加缓存**：约为同步、无缓存账单的 10%。
- **模型路由**：节省 40 到 70% 的模型成本。
- **所有手段叠加**：约为朴素基线的 5 到 10%。

## 按顺序设置的预算防护
type: flow
from: phases/17-infrastructure-and-production/27-finops-llms/docs/en.md, phases/11-llm-engineering/11-caching-cost/docs/en.md, phases/11-llm-engineering/11-caching-cost/code/caching_cost.py

1. **限流**：按租户设为预期峰值的 2 到 3x。返回带 `Retry-After` 的 429。
2. **每日开支上限**：合同上限的 1.5 到 3x。收紧速率并告警。
3. **紧急开关**：开支相对租户基线的 z-score 超过 4。自动暂停并呼叫值班。
4. **预算的 70%**：`CostTracker` 增加一条警告告警。
5. **预算的 85%**：限流。只路由到更便宜的模型。
6. **预算的 95%**：停止。只返回缓存响应。

## 两层缓存
type: architecture
from: phases/17-infrastructure-and-production/14-prompt-semantic-caching/docs/en.md, phases/11-llm-engineering/11-caching-cost/docs/en.md

```arch
node | query | 1,1 | User query | | client
node | l1 | 2,1 | L1 semantic cache | embed, cosine 0.95+ | store
node | l2 | 3,1 | L2 prefix cache | provider KV reuse | store
node | llm | 4,1 | Model | full price on a miss | model
node | hit | 2,2 | Cached response | no LLM call |
node | track | 4,2 | Cost tracker | tokens, cost, user_id | process
edge | query | l1 | embed
edge | l1 | hit | hit
edge | l1 | l2 | miss
edge | l2 | llm | prefix
edge | llm | track | usage
```

## 各厂商的 prompt 缓存
type: comparison
from: phases/11-llm-engineering/15-prompt-caching/docs/en.md

| 因素 | Anthropic | OpenAI | Gemini |
|---|---|---|---|
| API 形式 | `cache_control` 标记 | 自动前缀 | `CachedContent` API |
| 命中价格 | 输入打 90% 折扣 | 输入打 50% 折扣 | 约为正常价的 25% |
| 写入成本 | 加价 25% | 无 | 按 token·小时计存储费 |
| 默认 TTL | 5 min，可选 1 小时 | 最长 1 小时 | 用户设定，1 小时 |
| 最小前缀 | 1,024 token，Haiku 2,048 | 1,024 token | Flash 4,096，Pro 32,768 |
| 适用场景 | 稳定的 10k+ prompt，多轮对话 | Serverless，无自建基础设施 | 跨多天复用语料 |

## 代码中的默认值
type: defaults
from: phases/11-llm-engineering/11-caching-cost/code/caching_cost.py, phases/17-infrastructure-and-production/27-finops-llms/code/main.py, phases/11-llm-engineering/15-prompt-caching/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `similarity_threshold` | 0.85 | `SemanticCache`。演示用 0.75 |
| `ttl_seconds` | 3600 | 精确缓存与语义缓存 |
| `max_size` | 1000 | `ExactCache`。淘汰最旧的条目 |
| `temperature` | 0.0 | 大于 0 时跳过精确缓存 |
| `monthly_budget` | 1000.0 | `CostTracker` 告警基数 |
| `spend_cap_multiplier` | 2.0 | 上限为合同额乘以此值 |
| `kill_z_score` | 4.0 | 超过时暂停该租户 |
| Anthropic TTL | 5 分钟 | `"ttl": "1h"` 为一小时 |

## 提交一个 batch
type: annotated-code
lang: python
from: phases/11-llm-engineering/11-caching-cost/docs/en.md

```python
requests.append({
    "custom_id": f"request-{i}",  # match results to inputs
    "method": "POST", "url": "/v1/chat/completions",
    "body": {"model": "<model>", "messages": [{"role": "user", "content": query}]},
})
batch_file = client.files.create(file=open("batch_input.jsonl", "rb"), purpose="batch")
batch = client.batches.create(
    input_file_id=batch_file.id,
    endpoint="/v1/chat/completions",
    completion_window="24h",  # 50% off, results in 24 hours
)
```

## 故障排查
type: troubleshooting
from: phases/17-infrastructure-and-production/14-prompt-semantic-caching/docs/en.md, phases/11-llm-engineering/15-prompt-caching/docs/en.md, phases/11-llm-engineering/11-caching-cost/docs/en.md, projects/token-counter-and-cost-meter/solution

| 症状 | 原因 | 修复 |
|---|---|---|
| 命中率接近 7% | 前缀中有时间或请求 ID | 把动态文本放到边界之后 |
| 并行调用产生 N 次写入 | 调用早于首次写入完成 | 先单独发请求 1，再发其余 |
| `cache_read_input_tokens` 一直为 0 | 缓存键漂移 | 在 CI 中检查两个 usage 字段 |
| 块没有被缓存 | 不足 1,024 token（Haiku 2,048） | 把缓存块做大 |
| 部署后 OpenAI 命中消失 | 工具顺序改变或新增 `user` 字段 | 按稳定顺序序列化工具 |
| `cached exceeds input` | 把缓存部分算成额外 token | 缓存部分是输入的子集 |

## 运行代码
type: command-table
span: 2
from: phases/11-llm-engineering/15-prompt-caching/code/main.py, projects/token-counter-and-cost-meter/README.md, projects/agent-budget-planner/README.md, projects/agent-budget-planner/solution/cli.py

| 命令 | 作用 |
|---|---|
| `python main.py` | 在 `code/` 中运行课程模拟器 |
| `python3 scripts/project_test.py <project> --stage 1 --path <workspace>` | 为一个阶段评分 |
| `python3 scripts/project_test.py <project> --all --solution --strict` | 为参考解答评分 |
| `python3 <workspace>/usage.py <usage-file> --out usage-ledger.json` | 把记录的用量重放到账本中 |
| `python3 cli.py samples/input.json --mode execute --output budget.json` | 运行预算规划任务 |

## 项目账本
type: concepts
span: 2
from: projects/token-counter-and-cost-meter/solution, projects/token-counter-and-cost-meter/README.md, projects/agent-budget-planner/solution/main.py, projects/agent-budget-planner/solution/cli.py, projects/agent-budget-planner/README.md

- **费率**：每 token 的整数纳美元。是 fixture 输入，不是厂商价格。
- **estimate**：`text.chars().count()` 除以 `chars_per_token`，向上取整。比值为 0 是错误。
- **cost**：按输入费率计 `usage.input - usage.cached`，加上缓存和输出部分。每项都用 `checked_mul`。
- **reserve**：`spent + sum(holds) + amount > limit` 抛出 `budget exceeded`。
- **settle**：实际值超过预留额时抛出 `actual cost exceeds reservation`。
- **状态**：`completed`、`rejected`、`needs_reconciliation`。
- **示例运行**：190 单位对 100 单位上限。两个任务通过，结算 95 单位。

## 问答
type: qa
from: phases/11-llm-engineering/15-prompt-caching/docs/en.md, phases/11-llm-engineering/11-caching-cost/docs/en.md, phases/17-infrastructure-and-production/14-prompt-semantic-caching/docs/en.md, phases/17-infrastructure-and-production/15-batch-apis/docs/en.md, phases/17-infrastructure-and-production/27-finops-llms/docs/en.md

- **prompt 缓存还是语义缓存？** prompt 缓存：相同的 token。语义缓存：相同的含义。
- **语义阈值取多少？** 0.92 到 0.95。0.85 时会出现错误答案。
- **用哪个单位指标？** 每个已解决查询的成本，而不是 $/M token。

## 提示
type: tips
from: phases/17-infrastructure-and-production/27-finops-llms/docs/en.md, phases/11-llm-engineering/15-prompt-caching/docs/en.md

- 在每次调用上标注 `user_id`、`task_id`、`route` 和 `tenant_id`。
- 拆分 token：prompt、工具、记忆、响应。
- 以读取占比高于 80% 作为部署关卡。
