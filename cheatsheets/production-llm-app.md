---
id: production-llm-app
title: Shipping a Production LLM App
code: SP
subtitle: 请求流水线、重试、回退链、SSE 流、续传、演示限额与回退网关。
hue: 15
sources: phases/11-llm-engineering/13-production-app, phases/17-infrastructure-and-production/29-model-demo-interfaces, projects/streaming-answer-recovery, projects/llm-gateway-with-fallbacks
source_hash: 55ab30194be15d70
---

## 课文任务
type: task-table
span: 2
from: phases/11-llm-engineering/13-production-app/docs/en.md, phases/11-llm-engineering/13-production-app/code/production_app.py, phases/17-infrastructure-and-production/29-model-demo-interfaces/docs/en.md, phases/17-infrastructure-and-production/29-model-demo-interfaces/code/main.py

| 任务 | 代码 |
|---|---|
| 安装服务器栈 | `pip install fastapi uvicorn` |
| 用 4 个 worker 跑应用 | `uvicorn production_app:app --host 0.0.0.0 --port 8000 --workers 4` |
| 选定主模型 | `LLM_MODEL=gpt-4o` |
| 启动演示服务器 | `python3 code/main.py --serve` |
| 要求访问令牌 | `export DEMO_ACCESS_TOKEN=<token>` |
| 发送一次预测 | `curl -s -X POST http://127.0.0.1:8000/api/predict -H 'Content-Type: application/json' -d '{"text": "ok"}'` |
| 观察事件流 | `curl -N -X POST http://127.0.0.1:8000/api/stream -H 'Content-Type: application/json' -d '{"text": "<text>"}'` |
| 跑演示测试 | `python3 -m unittest discover -s code/tests -v` |

## 请求流水线
type: architecture
from: phases/11-llm-engineering/13-production-app/docs/en.md, phases/11-llm-engineering/13-production-app/code/production_app.py

```arch
node | client | 1,1 | Client | web, mobile, API | client
node | gw | 2,1 | API Gateway | auth, rate limit | process
node | gin | 3,1 | Input guardrails | injection, PII redact | process
node | router | 4,1 | Prompt Router | template, A/B version | process
node | cache | 4,2 | Semantic Cache | threshold 0.92 | store
node | llm | 3,2 | LLM call | retry, fallback chain | model
node | gout | 2,2 | Output guardrails | flagged text replaced | process
node | resp | 1,2 | Response | eval log, cost, SSE | client
edge | client | gw |
edge | gw | gin |
edge | gin | router | pass
edge | router | cache |
edge | cache | llm | miss
edge | llm | gout |
edge | gout | resp |
```

## 带退避的重试
type: annotated-code
lang: python
from: phases/11-llm-engineering/13-production-app/code/production_app.py

```python
async def call_llm_with_retry(prompt, model, max_retries=3):
    for attempt in range(max_retries + 1):
        try:
            ...  # one provider call
        except (ConnectionError, TimeoutError):
            if attempt < max_retries:
                backoff = min(2 ** attempt + random.uniform(0, 1), 10)  # cap 10 s
                await asyncio.sleep(backoff)
            else:
                raise
    raise ConnectionError(f"All {max_retries} retries exhausted for {model.value}")
# call_with_fallback walks FALLBACK_CHAIN, preferred model first.
```

## 失败处理
type: troubleshooting
from: phases/11-llm-engineering/13-production-app/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| API 429 | 限流 | 带退避重试。将请求入队 |
| API 500 | 服务器错误 | 重试 3 次。切换到回退模型 |
| API 超时超过 30s | 提供方慢 | 重试一次。更短 prompt，更小模型 |
| 畸形输出 | 模型失败 | 把错误放进 prompt 再重试 |
| 护栏拦截 | 不安全输入 | 不重试。解释拦截原因 |
| 向量库宕机 | 应用失败 | 跳过 RAG 上下文 |
| 缓存宕机 | 应用失败 | 直接调用 LLM |
| 所有模型都失败 | 链路耗尽 | 先用缓存响应，再给固定道歉 |

## 代码中的默认值
type: defaults
from: phases/11-llm-engineering/13-production-app/code/production_app.py, phases/17-infrastructure-and-production/29-model-demo-interfaces/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `similarity_threshold` | 0.92 | 语义缓存命中分数 |
| `ttl_seconds` | 3600 | 缓存条目寿命 |
| `max_entries` | 10000 | 缓存大小 |
| `max_retries` | 3 | 链路中每个模型 |
| `MAX_CHARS` | 500 | 演示文本上限 |
| `MAX_BODY_BYTES` | 4096 | 更大的请求体返回 413 |
| `BUCKET_CAPACITY` | 5 | 每秒补充 0.5 个令牌 |
| `DAILY_CALL_CAP` | 2000 | 超过上限返回 503 |

## 演示错误码
type: command-table
from: phases/17-infrastructure-and-production/29-model-demo-interfaces/docs/en.md, phases/17-infrastructure-and-production/29-model-demo-interfaces/code/main.py

| 命令 | 作用 |
|---|---|
| `413 body_too_large` | 请求体超过 4,096 字节 |
| `408 request_timeout` | 请求体在 `Content-Length` 之前停止 |
| `415 unsupported_media_type` | 内容类型不是 JSON |
| `400 bad_json` | 请求体不是 JSON 对象 |
| `422 text_too_long` | 文本超过 500 个字符 |
| `422 control_characters` | 文本含控制字符 |
| `429 rate_limited` | 令牌桶空了。读取 `Retry-After` |
| `503 usage_cap_reached` | 达到每日上限。读取 `Retry-After` |

## SSE 线上格式
type: annotated-code
lang: bash
from: phases/17-infrastructure-and-production/29-model-demo-interfaces/docs/en.md

```bash
event: token  # Content-Type text/event-stream
data: {"index":0,"text":"Label:"}
  # a blank line ends each event
event: token
data: {"index":1,"text":" positive."}

event: done
data: {"label":"positive","score":1.0,"tokens":11}
```

## 恢复一条流式回答
type: flow
from: projects/streaming-answer-recovery/README.md, projects/streaming-answer-recovery/solution/main.ts, projects/streaming-answer-recovery/solution/cli.ts

1. **SSEDecoder**：把拆开的 UTF-8 字节拼成完整事件。
2. **apply**：需要连续的正 id。出现缺口会抛出 `noncontiguous answer event ID`。
3. **apply**：重复的 id 且数据相同是空操作。数据不同则抛错。
4. **apply**：payload 类型是 `text`、`citation` 或 `complete`。引用需要 http 或 https。
5. **connect**：在 `complete` 之前断开会把状态设为 `interrupted`。
6. **connect**：下一次调用发送 `Last-Event-ID`，只拿到之后的事件。
7. **trace**：写入带已接受事件的 `schemaVersion: 1`。`replay` 重建状态。

## 网关回退策略
type: comparison
from: projects/llm-gateway-with-fallbacks/README.md, projects/llm-gateway-with-fallbacks/solution/stage2.go, projects/llm-gateway-with-fallbacks/solution/stage4.go, projects/llm-gateway-with-fallbacks/solution/config.go

| 因素 | 2xx | 429 或 5xx | 其他状态 | 取消 |
|---|---|---|---|---|
| `ClassifyStatus` | `success` | `retry` | `terminal` | 无 |
| 下一个 provider | 否 | 是 | 否 | 否 |
| 路由状态 | `completed` | 结束时 `exhausted` | `terminal-error` | `cancelled` |
| 代理回复 | 上游响应体 | 结束时 502 | 502 | 504 |

## 网关 providers 文件
type: annotated-code
lang: bash
from: projects/llm-gateway-with-fallbacks/solution/fixtures/providers.example.json, projects/llm-gateway-with-fallbacks/README.md

```bash
{"providers": [
  {"name": "primary", "url": "http://127.0.0.1:11434/v1/chat/completions"},
  {"name": "backup", "url": "http://127.0.0.1:11435/v1/chat/completions",
   "key_env": "ORCHARD_BACKUP_KEY"}],  # env var name, not the key
 "max_attempts": 2,  # 1 to 16, one visit per provider
 "max_response_bytes": 65536,  # 1 byte to 16 MiB
 "timeout_ms": 4000}  # 1 to 5000, whole route
```

## 项目任务
type: task-table
span: 2
from: projects/streaming-answer-recovery/README.md, projects/llm-gateway-with-fallbacks/README.md

| 任务 | 代码 |
|---|---|
| 建一个工作目录 | `python3 scripts/project_test.py <project> --init /tmp/<project>-work` |
| 给一个阶段评分 | `python3 scripts/project_test.py <project> --stage 1 --path /tmp/<project>-work --strict` |
| 流式演示，断开再续传 | `cd projects/streaming-answer-recovery/solution && python3 demo.py` |
| 读取你自己的 SSE 端点 | `node --experimental-strip-types cli.ts <url> /tmp/trace.json` |
| 网关演示，先 503 再 backup | `cd projects/llm-gateway-with-fallbacks/solution && go run .` |
| 运行网关代理 | `go run . --config /tmp/providers.json --listen 127.0.0.1:8088` |
| 调用代理 | `curl --fail-with-body http://127.0.0.1:8088/v1/chat/completions --data-binary @fixtures/request.json` |

## 目标与检查清单
type: tips
from: phases/11-llm-engineering/13-production-app/docs/en.md

- P50 延迟低于 2s。P99 延迟低于 10s。
- 缓存命中率超过 30%。护栏拦截率低于 5%。
- 每次请求成本低于 $0.01。
- 把每个用户限到每分钟 10 到 50 次请求。
- 上线前用 100 个并发用户做负载测试。

## 问题
type: qa
from: phases/17-infrastructure-and-production/29-model-demo-interfaces/docs/en.md

- **为什么用 POST 而不是 `EventSource`？** `EventSource` 只发 GET。GET 会把输入放进会被记录的 URL。
- **状态 200 之后模型失败了？** 状态已经发出。在流里发一个 `error` 事件。
- **错误体里有什么？** `code`、`message`、`hint` 和 `request_id`。
