---
name: devops-agent
description: 构建一个 Kubernetes 故障排查 Agent，它会遍历集群知识图谱、对根因进行排序，并通过 Slack 对每一次修复操作进行审批闸控。
version: 1.0.0
phase: 19
lesson: 06
tags: [capstone, devops, sre, kubernetes, langgraph, fastmcp, aiops]
---

给定一个 K8s 集群和一个告警源（PagerDuty 或 Alertmanager），构建一个 Agent，在五分钟内产出排序后的根因假设，并通过 Slack 审批卡对每一次修复操作进行闸控。

构建计划：

1. 每 30s 将 kube-state-metrics 摄入 Neo4j 或 kuzu。构建一个由 Pods、Deployments、Services、Nodes、PVCs、HPAs 组成的图，并添加指向 Prometheus、Loki 和 Tempo 数据源的 telemetry-overlay 边。
2. 搭建一个用于 PagerDuty 和 Alertmanager 的 FastAPI webhook 接收器。
3. 通过 FastMCP 使用 StreamableHTTP transport 暴露只读工具：kubectl get/describe、promql、logql、traceql。
4. 构建一个包含三个节点的 LangGraph 根因 Agent：`sample`（拉取 15m telemetry）、`walk`（遍历图邻居）、`hypothesize`（按新近度 × 具体性 × 引用数量对候选项排序）。
5. 将排名前 3 的假设及 graph-path 可视化发布到 Slack，并附带审批按钮。
6. 将破坏性工具（scale、rollback、delete）放在一个单独的 FastMCP server 上，并置于审批 Token 之后；该 Token 只有在 Slack 签署同意后 Agent 才能获得。
7. 维护一个 append-only 审计日志：每一条被*考虑过*的命令、是否获批、是否执行、由谁审批。
8. 构建 20 个合成事故场景（OOMKill、DNS flap、HPA thrash、PVC fill、noisy neighbor、faulty sidecar、ConfigMap bad rollout、cert rotation、image-pull backoff、probe failure，以及另外 10 个）。按 RCA 准确率和 time-to-hypothesis 对 Agent 评分。

评估 Rubric：

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | 场景套件上的 RCA 准确率 | 在 20 个合成事故中至少 80% 的根因正确 |
| 20 | 安全性 | 在审计日志中没有 Slack approval 时，破坏性动作防护绝不触发 |
| 20 | Time-to-hypothesis | 从告警到 Slack brief 的 p50 低于 5 分钟 |
| 20 | 可解释性 | 每个假设都有 graph paths 和 telemetry citations |
| 15 | 集成完整性 | PagerDuty、Slack、ArgoCD、Prometheus 端到端可工作 |

硬性拒收：

- 使用单个 MCP server 同时混合只读工具和破坏性工具的 Agents。
- 任何没有 telemetry citations 的 RCA。无引用的假设必须被拒绝。
- 只记录执行的审计日志。它们必须记录每一条被考虑过的命令。
- 未使用 seeds 在 20 场景套件上运行 Agent，却声称准确率。

拒绝规则：

- 没有人类 on-caller 的 Slack approval 时，拒绝执行修复。即使假设显而易见。
- 拒绝通过只读 MCP 暴露 `kubectl exec`、`kubectl port-forward` 或任何交互式工具。它们在效果上是破坏性的。
- 拒绝在没有逐 deployment 审批卡的情况下，对多个 deployments 批量应用修复。

输出：一个 repo，包含 FastAPI 接收器、LangGraph Agent、只读和破坏性 MCP servers、Slack 集成、20 场景测试套件、与 AWS DevOps Agent 在三个共享事故上的并排对比，以及一份关于 one-week 观察窗口内 near-miss commands（Agent *考虑过*但未执行的命令）的 write-up。
