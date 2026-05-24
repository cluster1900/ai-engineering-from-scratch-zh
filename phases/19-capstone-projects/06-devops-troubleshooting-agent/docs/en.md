# Capstone 06 — 面向 Kubernetes 的 DevOps Troubleshooting Agent

> AWS 的 DevOps Agent 已 GA，Resolve AI 发布了它的 K8s playbooks，NeuBird 演示了 semantic monitoring，Metoro 将 AI SRE 绑定到按服务划分的 SLO。生产形态已经确定：alert webhook 触发，agent 读取 telemetry，遍历 K8s objects 的 graph，对 root-cause hypotheses 排序，并发布带 approval buttons 的 Slack brief。默认 read-only。每个 remediation 都由 human gate。这个 capstone 就是这个 agent，在 20 个 synthetic incidents 上评估，并在三个共享案例上与 AWS 的 Agent 对比。

**Type:** Capstone
**Languages:** Python (agent), TypeScript (Slack integration)
**先修要求：** Phase 11 (LLM engineering), Phase 13 (tools and MCP), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P11 · P13 · P14 · P15 · P17 · P18
**Time:** 30 hours

## 问题
2025-2026 年的 SRE 叙事变成了：“AI agents 分诊 incidents，humans 批准 remediations。”AWS DevOps Agent、Resolve AI、NeuBird、Metoro、PagerDuty AIOps 都已经在生产中交付了这种形态。agent 读取 Prometheus metrics、Loki logs、Tempo traces、kube-state-metrics，以及 K8s objects 的 knowledge graph。它在五分钟内生成带 telemetry citations 的 ranked root-cause hypothesis。没有通过 Slack 的明确 human approval，它绝不执行 destructive commands。

大部分难点在于 scope 和 safety，而不是 reasoning。agent 需要默认 read-only 的 RBAC surface、加固过的 MCP tool server，以及每条命令“被考虑过 vs 被执行过”的 audit logs。它需要知道什么时候超出能力范围并升级。而且它必须足够便宜地运行，避免 OOM-kill cascades 生成 $5k 的 agent 账单。

## 概念
agent 在 knowledge graph 上运行。Nodes 是 K8s objects（Pods、Deployments、Services、Nodes、HPAs、PVCs）以及 telemetry sources（Prometheus series、Loki streams、Tempo traces）。Edges 编码 ownership（Pod -> ReplicaSet -> Deployment）、scheduling（Pod -> Node）和 observation（Pod -> Prometheus series）。graph 通过 kube-state-metrics sync 保持新鲜，并在每次 alert 时重新采样。

当 alert 触发时，agent 从受影响 object 开始做 root-cause。它遍历 edges，拉取相关 telemetry slices（最近 15 分钟），并起草一个 hypothesis。hypothesis 按 evidence 排序：有多少 telemetry citations 支持它、时间有多近、具体程度如何。top-3 hypotheses 会发送到 Slack，附带 graph-path visualizations 和 remediation actions 的 approval buttons。

remediation 受 gate 控制。默认允许的 actions 是 read-only。destructive actions（scaling down、rolling back、deleting Pods）需要 Slack approval；ArgoCD rollback hooks 需要一个 agent 永远不持有的 auth token。audit log 会记录 agent *considered* 的每条命令，而不只是 executed 的命令，因此 review process 能捕获 near-misses。

## 架构
```
PagerDuty / Alertmanager webhook
           |
           v
     FastAPI receiver
           |
           v
   LangGraph root-cause agent
           |
           +---- read-only MCP tools ----+
           |                             |
           v                             v
   K8s knowledge graph              telemetry slices
     (Neo4j / kuzu)              Prometheus, Loki, Tempo
   ownership + scheduling          last 15m, scoped
           |
           v
   hypothesis ranking (evidence weight)
           |
           v
   Slack brief + approval buttons
           |
           v (approved)
   ArgoCD rollback hook / PagerDuty escalate
           |
           v
   audit log: considered vs executed, every command
```

## 技术栈
- Observability sources: Prometheus, Loki, Tempo, kube-state-metrics
- Knowledge graph: K8s objects + telemetry edges 的 Neo4j (managed) 或 kuzu (embedded)
- Agent: LangGraph，带 per-tool allow-list，默认 read-only
- Tool transport: 基于 StreamableHTTP 的 FastMCP；destructive tools 放在 approval gate 后面的独立 server
- Models: Claude Sonnet 4.7 用于 root-cause reasoning，Gemini 2.5 Flash 用于 log summarization
- Remediation：ArgoCD rollback webhook、PagerDuty 升级、Slack approval card
- Audit: append-only 结构化 log（considered、executed、approved、outcome）
- Deployment: K8s deployment，配有自己的窄 RBAC role；独立 namespace

## 构建它
1. **Graph ingestion.** 每 30s 将 kube-state-metrics 同步到 Neo4j/kuzu。Nodes: Pod, Deployment, Node, Service, PVC, HPA。Edges: OWNED_BY, SCHEDULED_ON, EXPOSES, MOUNTS, SCALES。Telemetry overlay edges: OBSERVED_BY（Pod 由 Prometheus series 观测）。

2. **Alert receiver.** FastAPI endpoint，接收 PagerDuty 或 Alertmanager webhooks。提取受影响的 object(s) 和 SLO breach。

3. **Read-only tool surface.** 通过 FastMCP 封装 kubectl、Prometheus query、Loki logql、Tempo traceql。每个 tool 都有窄 RBAC verb（"get", "list", "describe"）。默认 server 中没有 "delete"、"exec"、"scale"。

4. **Root-cause agent.** LangGraph，包含三个 nodes：`sample` 拉取最近 15 分钟 telemetry slice，`walk` 查询 graph 中的邻近 objects，`hypothesize` 起草带 telemetry citations 的 ranked root-cause candidates。

5. **Evidence scoring.** 每个 hypothesis 的 score = recency * specificity * graph-path length inverse * citation count。返回 top-3。

6. **Slack brief.** 发布一个 attachment，包含 hypothesis、graph-path visualization（server-side 渲染的 subgraph image），以及最多一个 remediation action 的 approval buttons。

7. **Remediation gate.** Destructive tools（scale down、roll back、delete）放在第二个 MCP server 上，位于 approval token 后面。只有当 Slack card 由 human approve 后，agent 才能调用它们。

8. **Audit log.** Append-only JSONL：对每个 candidate command，记录它是否被 considered、是否被 executed、由谁 approved。每天发送到 S3。

9. **Synthetic incident suite.** 构建 20 个 scenarios：OOMKill cascade、DNS flap、HPA thrash、PVC fill、noisy neighbor、faulty sidecar、bad ConfigMap rollout、certificate rotation、image-pull backoff 等。按 root-cause accuracy 和 time-to-hypothesis 为 agent 评分。

## 使用它
```
webhook: alert.pagerduty.com -> checkout-api SLO breach, error rate 14%
[graph]   affected: Deployment checkout-api (3 Pods, Node ip-10-2-3-4)
[walk]    neighbors: ReplicaSet checkout-api-abc, Service checkout-api,
           recent rollout 14m ago
[sample]  prometheus error_rate 14%, up-trend; loki 500s on /api/v2/pay
[hypo]    #1 bad rollout: latest image checkout-api:v2.41 fails /healthz
          citations: deploy.yaml (rev 42), prometheus errorRate, loki 500 stack
[slack]   [ROLL BACK to v2.40]  [ESCALATE]  [IGNORE]
          (approval required; agent does not roll back unilaterally)
```

## 交付它
`outputs/skill-devops-agent.md` 是 deliverable。给定一个 K8s cluster 和 alert source，agent 会生成 ranked root-cause hypotheses 和一个 Slack-gated remediation flow。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | scenario suite 上的 RCA accuracy | 在 20 个 synthetic incidents 中 root cause 正确率 ≥80% |
| 20 | Safety | audit log 中 destructive-action guard 从不在没有 Slack approval 的情况下触发 |
| 20 | Time-to-hypothesis | 从 alert 到 Slack brief 的 p50 低于 5 分钟 |
| 20 | Explainability | 每个 hypothesis 都有 graph paths 和 telemetry citations |
| 15 | Integration completeness | PagerDuty、Slack、ArgoCD、Prometheus end-to-end working |
| **100** | | |

## 练习
1. 在 AWS 的 DevOps Agent demo 过的同三个 incidents 上运行你的 agent。发布 side-by-side。报告 agent 在哪里出现差异。

2. 添加一个 "near-miss" audit，用来标记 agent *considered* 的任何在没有 approval 时本会是 destructive 的命令。衡量一周内的 near-miss rate。

3. 将 hypothesis model 从 Claude Sonnet 4.7 替换为 self-hosted Llama 3.3 70B。衡量 RCA accuracy delta 和 dollar per incident。

4. 构建 causal filter：区分相关的 telemetry spikes 和真正的 root cause。用 20-scenario labels 训练一个 small classifier。

5. 添加 rollback dry-run：使用相同 manifest 对 staging cluster 执行 ArgoCD rollback。在 Slack approval button 之前，在 live cluster 中验证 rollback plan。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| K8s knowledge graph | "Cluster graph" | Nodes = K8s objects + telemetry series；edges = ownership、scheduling、observation |
| Read-only-by-default | "Scoped RBAC" | Agent 的 service account 只有 get/list/describe verbs；destructive verbs 位于 approval 后面的独立 server 中 |
| Audit log | "Considered vs executed" | 每个 candidate command 的 append-only record，包括它是否运行、由谁 approved |
| Hypothesis ranking | "Evidence score" | Recency × specificity × graph-path length inverse × citation count |
| Slack approval card | "HITL gate" | 带 remediation buttons 的交互式 Slack message；human 点击之前 agent 不能继续 |
| Telemetry citation | "Evidence pointer" | 支持某个 claim 的 Prometheus query、Loki selector 或 Tempo trace URL |
| MTTR | "Time to resolution" | 从 alert 触发到 SLO recovery 的 wall-clock |

## 延伸阅读
- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/aws/aws-devops-agent-helps-you-accelerate-incident-response-and-improve-system-reliability-preview/) — 2026 年的 canonical reference
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) — 竞品参考
- [NeuBird semantic monitoring](https://www.neubird.ai) — semantic-graph 方法
- [Metoro AI SRE](https://metoro.io) — SLO-first production framing
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) — cluster-state source
- [LangGraph](https://langchain-ai.github.io/langgraph/) — reference agent orchestrator
- [FastMCP](https://github.com/jlowin/fastmcp) — Python MCP server framework
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/) — gated remediation target
