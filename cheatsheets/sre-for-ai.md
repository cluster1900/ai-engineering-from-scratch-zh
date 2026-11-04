---
id: sre-for-ai
title: SRE, Incidents and Postmortems for AI
code: IP
subtitle: 用智能体分诊 LLM 事故，门控每次修复，写有证据约束的复盘，并为助手压缩日志。
hue: 352
sources: phases/17-infrastructure-and-production/23-sre-for-ai, phases/17-infrastructure-and-production/24-chaos-engineering-llm, phases/19-capstone-projects/06-devops-troubleshooting-agent, projects/postmortem-writer, projects/log-volume-reduction-lab
source_hash: 3245264d2ae57f3e
---

## 事故症状
type: troubleshooting
from: phases/17-infrastructure-and-production/23-sre-for-ai/code/main.py, phases/17-infrastructure-and-production/23-sre-for-ai/docs/en.md, phases/19-capstone-projects/06-devops-troubleshooting-agent/code/ts/src/agent.ts, phases/19-capstone-projects/06-devops-troubleshooting-agent/docs/en.md, phases/19-capstone-projects/06-devops-troubleshooting-agent/code/main.py, projects/log-volume-reduction-lab/README.md

| 症状 | 原因 | 修复 |
|---|---|---|
| checkout 错误率高 | KV cache 尖峰导致 vLLM OOM | 重启 pod。把 `--gpu-memory-utilization` 降到 0.85 |
| 尖峰前 GPU 内存到 98% | 突发并发下 KV cache OOM | 应用 runbook RB-017 |
| 两个模型对根因意见不一 | 可能幻觉出了根因 | 把两个假设都亮出来再升级 |
| 10m 内 pod OOMKilled 两次 | 内存 request 256Mi 太低 | request 512Mi，limit 1Gi |
| auth-svc 上 CrashLoopBackOff | 探针路径改成了 /ready | 把探针路径改回 /healthz |
| 镜像 `checkout-api:v2.41` 过不了 /healthz | 14m 前一次糟糕的 rollout | 审批后回滚到 v2.40 |
| `blocked: no slack approval` | 破坏性工具没有审批人 | 让 Slack 卡片获得批准 |
| 罕见的 disk-full 行从上下文里丢了 | 预算 8 的均匀采样 | 用 `rarity` 策略 |

## 多智能体分诊
type: flow
from: phases/17-infrastructure-and-production/23-sre-for-ai/docs/en.md, phases/17-infrastructure-and-production/23-sre-for-ai/code/main.py

1. **Supervisor**：把事故拆成子查询。
2. **Log agent**：日志搜索。找到最常见的错误模式。
3. **Metric agent**：PromQL。找到错误之前的 GPU 内存尖峰。
4. **Runbook agent**：文档检索。匹配一份已知 runbook。
5. **Supervisor**：归并根因。两个或更多智能体一致意味着有把握。
6. **Human**：批准或改道假设与证据。
7. **Action**：只做窄的安全动作，例如重启 pod。

## K8s 排障智能体
type: architecture
from: phases/19-capstone-projects/06-devops-troubleshooting-agent/docs/en.md

```arch
node | hook | 1,1 | Alert webhook | PagerDuty or Alertmanager | client
node | recv | 2,1 | FastAPI receiver | affected object, SLO breach | process
node | agent | 3,1 | Root-cause agent | sample, walk, hypothesize | model
node | graph | 2,2 | K8s knowledge graph | ownership, scheduling | store
node | tele | 3,2 | Telemetry slices | Prometheus, Loki, Tempo | store
node | slack | 4,1 | Slack brief | top-3, approval buttons | client
node | argo | 4,2 | ArgoCD rollback hook | after approval | process
node | audit | 4,3 | Audit log | considered vs executed | store
edge | hook | recv | webhook
edge | recv | agent | alert
edge | agent | graph | walk
edge | agent | tele | last 15m
edge | agent | slack | ranked hypotheses
edge | slack | argo | approved
edge | argo | audit | append
```

## 修复范围
type: comparison
from: phases/17-infrastructure-and-production/23-sre-for-ai/docs/en.md, phases/19-capstone-projects/06-devops-troubleshooting-agent/code/main.py, phases/19-capstone-projects/06-devops-troubleshooting-agent/docs/en.md

| 因素 | 安全、窄范围 | 不安全、宽范围 |
|---|---|---|
| Pods 与代码 | 重启 pod | 部署新代码 |
| 部署 | 回退一次具体部署 | 改服务拓扑 |
| 容量 | 在预先批准的范围内扩缩 | 改资源限制 |
| 配置与访问 | 打开预先批准的 feature flag | 改 IAM、改数据库 |
| RBAC 动词 | get、list、describe | delete、exec、scale |
| Capstone 工具 | `kubectl_get`、`promql`、`logql` | `kubectl_delete`、`argocd_rollback` |
| 门控 | 立刻执行 | 需要 Slack 审批 |

## 假设分数
type: annotated-code
lang: python
from: phases/19-capstone-projects/06-devops-troubleshooting-agent/code/main.py

```python
def score(self) -> float:
    recency_w = max(0.0, 1.0 - self.recency_mins / 60.0)  # 0 after 60 min
    path_w = 1.0 / (1 + self.path_len)  # short graph path wins
    return (recency_w * 0.35 +
            self.specificity * 0.35 +  # 0..1
            min(len(self.citations), 5) / 5 * 0.2 +  # caps at 5 citations
            path_w * 0.1)
```

## 运行实验
type: task-table
span: 2
from: phases/17-infrastructure-and-production/23-sre-for-ai/docs/en.md, phases/19-capstone-projects/06-devops-troubleshooting-agent/code/main.py, phases/19-capstone-projects/06-devops-troubleshooting-agent/code/ts/README.md, projects/postmortem-writer/README.md, projects/log-volume-reduction-lab/README.md

| 任务 | 代码 |
|---|---|
| 多智能体分诊模拟器，第 23 课 | `code/main.py` |
| 带审批门控的 K8s 图智能体 | `python main.py` |
| Slack 骨架自检，然后测试 | `npm start` 和 `npm test` |
| Slack 交互服务器 | `npm run serve` |
| 用示例生成复盘包 | `go run . --events ../examples/events.jsonl --review ../examples/review.json --out /tmp/incident-packet` |
| 构建日志上下文工具 | `rustc --edition 2021 main.rs -o /tmp/log-context` |
| 压缩日志，预算 8，rarity | `/tmp/log-context fixtures/burst.log 8 rarity /tmp/context.jsonl` |
| 稀有模板覆盖报告 | `python3 main.py fixtures/burst.log /tmp/context.jsonl --out /tmp/coverage.json` |

## 代码中的限制
type: defaults
from: phases/19-capstone-projects/06-devops-troubleshooting-agent/code/ts/src/slack_verify.ts, projects/log-volume-reduction-lab/solution/main.rs, projects/log-volume-reduction-lab/solution/main.py, projects/postmortem-writer/solution/integration.go

| 设置 | 默认值 | 说明 |
|---|---|---|
| `REPLAY_WINDOW_SECONDS` | 60 * 5 | 更老的 Slack 请求已过期 |
| `SIGNATURE_VERSION` | v0 | 对 v0:ts:body 做 HMAC sha256 |
| `rare_max` | 2 | 稀有模板频率 |
| 日志输入大小 | 1_048_576 | 字节，一 MiB |
| 日志记录数 | 10_000 | 每个输入的行数 |
| 日志行长度 | 4096 | 每行字节数 |
| 事件 JSONL 大小 | 2<<20 | 复盘事件 |
| Claims 与 actions | 100 | 每次审查中各自的上限 |

## 复盘包规则
type: concepts
from: projects/postmortem-writer/solution/stage1.go, projects/postmortem-writer/solution/stage2.go, projects/postmortem-writer/solution/stage3.go, projects/postmortem-writer/solution/integration.go, projects/postmortem-writer/solution/main.go, projects/postmortem-writer/README.md

- **Event**：一行 JSONL，带 `id`、`second`、`kind` 和 `message`。
- **Timeline**：按秒排序。并列按 ID 排。
- **Claim**：非空文本，以及至少一个已知且互异的事件 ID。
- **Quote**：每个证据 ID 需要其 message 的精确子串。
- **Approval**：`approved` 需要匹配的 `sourceSHA256` 和一位审查人。
- **Action**：状态 `open`、`doing` 或 `done`。只有 `open` 可以没有 owner。
- **Output**：index.html、packet.json 和 packet.txt，以 `0600` 写入。

## 错误字符串
type: command-table
from: projects/postmortem-writer/solution/integration.go, projects/postmortem-writer/solution/types.go, projects/log-volume-reduction-lab/solution/main.rs, projects/log-volume-reduction-lab/solution/main.py

| 命令 | 作用 |
|---|---|
| `review source changed` | 审查哈希与事件文件不同 |
| `approval requires matching source and reviewer` | 已批准的 claim 没有哈希或审查人 |
| `quote for <id>` | 引文为空或不在 message 里 |
| `budget exceeded` | 事件、claim 或字节太多 |
| `conflict` | 重复的事件 ID 或证据 ID |
| `expected LEVEL<TAB>message` | 日志行没有 tab |
| `group count mismatch` | 上下文计数与源不同 |
| `invalid locator` | firstLine 或 lastLine 越界 |

## 问题
type: qa
from: phases/17-infrastructure-and-production/23-sre-for-ai/docs/en.md, phases/19-capstone-projects/06-devops-troubleshooting-agent/docs/en.md, projects/postmortem-writer/solution/stage4.go, projects/log-volume-reduction-lab/README.md

- **审计日志记什么？** 每条考虑过、执行过或批准过的命令，以及谁批准的。
- **Capstone 的门槛是什么？** 20 个合成事故上至少 80% 根因正确。
- **一个假设要多快？** 从告警到 Slack 简报的 p50 低于 5 分钟。
- **单靠预测有用吗？** 没用。没有执行的预测只是仪表盘。
- **这个包能证明原因吗？** 不能。溯源被检查。因果需要审查。
- **均匀还是 rarity 采样？** Rarity。预算 8 的均匀采样会漏掉第 138 行。

## 提示
type: tips
from: phases/17-infrastructure-and-production/23-sre-for-ai/docs/en.md, phases/17-infrastructure-and-production/24-chaos-engineering-llm/docs/en.md, projects/log-volume-reduction-lab/README.md

- 按症状、假设、验证和行动几段来写 runbook。
- 把 runbook 和事后分析存进向量数据库以便检索。
- 做混沌之前，先有 SLI/SLO、可观测性、自动回滚、runbook 和值班。
- 每月办一次 game day。用一份复盘结束它。
- 把上下文发给助手之前先预脱敏日志。
