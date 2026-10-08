# Capstone 06  面向 Kubernetes của DevOps Trình Trình Trình Trận

> AWS của DevOps Agent đã GA,Resolve AI đã phát hành các cuốn sách chơi game của nó K8s,NeuBird đã trình bày giám sát ngữ nghĩa,Metoro sẽ AI SRE  ràng buộc đến phân chia dịch vụ theo SLO。 hình thức sản xuất đã xác định: báo động webhook 触发,agent 读取远程, trải qua đồ thị của các đối tượng K8s, đối với các giả thuyết gốc nguyên nhân 排序,并发布带 các nút chấp thuận Slack brief。

**Type:** Capstone
**Languages:** Python (agent), TypeScript (Slack integration)
**先修要求：**Giai đoạn 11 (kỹ thuật LLM), Giai đoạn 13 (công cụ và MCP), Giai đoạn 14 (chấp), Giai đoạn 15 (tự trị), Giai đoạn 17 (tế hạ tầng), Giai đoạn 18 (tự an toàn)
**Phases exercised:**P11 · P13 · P14 · P15 · P17 · P18
**Time:** 30 hours

## 问题
2025-2026 SRE  Nhau biến thành: AI đại lý phân loại các sự cố, con người  phê duyệt các biện pháp khắc phục. AWS DevOps Agent、Resolve AI、NeuBird、Metoro、PagerDuty AIOps đã được giao trong sản xuất. 读取 Prometheus metrics、Loki logs、Tempo traces、cube-state-metrics, cũng như đồ thị kiến thức về các vật thể K8s.

Phần lớn khó khăn nằm ở phạm vi và an toàn, chứ không phải lý luận. Trưởng lý cần phải mặc định đọc-chỉ bề mặt RBAC, máy chủ công cụ MCP được tăng cường, cũng như mỗi lệnh được xem xét so với các nhật ký kiểm toán được thực hiện.

## 概念
Trong biểu đồ kiến thức 上运行.Node là các đối tượng K8s (Pod, Dịch vụ, Node, HPA, PVC) cũng như các nguồn viễn thông (Prometheus series, Loki streams, Tempo traces) Edges 编码 sở hữu (Pod -> ReplicaSet -> Deployment) 编程 (Pod -> Node) và quan sát (Pod -> Prometheus series)  biểu đồ (via kube-state-metrics sync) 保持新鲜,并在每次警报 时重新样采――

Khi báo động 触发时,agent từ đối tượng bị ảnh hưởng  bắt đầu làm nguyên nhân gốc rễ. Nó trải qua các cạnh, kéo các mảnh telemetry liên quan.

sửa chữa 受 gate 控制。默认允许的行动是读取而已──破坏性行动(扩展下滑,滚回,删除 Pods) cần Slack approval;ArgoCD rollback hooks 需要一个代理 永远不持有的作者代币──audit log 会记录代理 *考虑* 的每条命令,而不只是执行的命令,因此审查过程 能捕获近错误──

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

## 技术
- Nguồn quan sát: Prometheus, Loki, Tempo, kube-state-metrics
- Hình đồ kiến thức: K8s đối tượng + đường kính biên của Neo4j (được quản lý) hoặc kuzu (đã nhúng)
- LangGraph, có danh sách cho phép dùng công cụ, chỉ đọc được.
- Truyền công cụ: dựa trên StreamableHTTP của FastMCP; các công cụ phá hủy  đặt cổng chấp thuận  hậu của máy chủ độc lập
- Mô hình: Claude Sonnet 4.7 dùng để lý luận nguyên nhân gốc, Gemini 2.5 Flash dùng để tóm tắt nhật ký
- Phong trào:ArgoCD rollback webhook、PagerDuty 升级、Slack thẻ phê duyệt
- Kiểm toán: chỉ phụ lục  cấu trúc log  được xem xét, thực hiện, phê duyệt kết quả)
- Việc triển khai: K8s triển khai,配有自己的狭窄RBAC角色;独立名字空间


```figure
ce-rootcause-walk
```

##  xây dựng nó
1. **Graph ingestion.**Mỗi 30 sẽ có trạng thái-metrics 同步到 Neo4j/kuzu。Nốt: Pod, Deployment, Node, Service, PVC, HPA。Edges: OWNED_BY, SCHEDULED_ON, EXPOSES, MOUNTS, Scales。Telemetry overlay edges: OBSERVED_BY(Pod bởi Prometheus series 观测)。

2. **Alert receiver.**Kết thúc API nhanh, nhận PagerDuty hoặc Alertmanager webhooks──提取受影响的对象 (s) 和 SLO vi phạm──

3. **Read-only tool surface.**通过 FastMCP 封装 kubectl、Prometheus query、Loki logql、Tempo traceql── mỗi công cụ đều có động từ RBAC khắt khe ((("get", "lista", "describe")。默认 server 中没有"delete"、"exec"、"scale"──

4. **Root-cause agent.**LangGraph, bao gồm ba nút:`sample`15 phút qua, tôi đã lấy được một tấm hình điện tử.`walk`查询 đồ thị Trung của các đối tượng gần,`hypothesize`起草带                                                                                                                                                                                                                                                             

5. **Evidence scoring.**Mỗi giả thuyết của điểm số = gần đây * đặc điểm * chiều dài đường biểu đồ ngược * số lượng trích dẫn── trở lại top-3──

6. **Slack brief.**发布 một bản phụ lục, bao gồm giả thuyết, hình ảnh đường viền đồ họa, hình ảnh phụ của máy chủ), cũng như các nút chấp thuận cho một hành động khắc phục.

7. **Remediation gate.**Các công cụ phá hủy (scale down, roll back, delete) đặt trên máy chủ MCP thứ hai, nằm trên biểu tượng chấp thuận phía sau. Chỉ khi thẻ Slack được chấp thuận bởi con người, đại lý có thể sử dụng chúng.

8. **Audit log.**Chỉ cần thêm JSONL: đối với mỗi lệnh ứng cử viên, ghi lại liệu nó đã được xem xét  liệu nó đã được thực hiện  được chấp thuận bởi ai  mỗi ngày được gửi đến S3 

9. **Synthetic incident suite.**构建 20 个场景:OOMKill cascade、DNS flap、HPA thrash、PVC fill、noisy neighbor、faulty sidecar、bad ConfigMap rollout、certificate rotation、image-pull backoff 等──按根原因精度 和时间-to-hypothesis 为代理 评分──

## Sử dụng nó
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

## 交付 nó
`outputs/skill-devops-agent.md`Đưa ra một nhóm K8s và nguồn cảnh báo, đại lý sẽ tạo ra các giả thuyết gốc rễ xếp hạng và một dòng khôi phục bị khóa.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | scenario suite 上的 RCA accuracy | 在 20 个 synthetic incidents 中 root cause 正确率 ≥80% |
| 20 | Safety | audit log 中 destructive-action guard 从不在没有 Slack approval 的情况下触发 |
| 20 | Time-to-hypothesis | 从 alert 到 Slack brief 的 p50 低于 5 分钟 |
| 20 | Explainability | 每个 hypothesis 都有 graph paths 和 telemetry citations |
| 15 | Integration completeness | PagerDuty、Slack、ArgoCD、Prometheus end-to-end working |
| **100** | | |

## 练习
1. Trong AWS DevOps Agent demo 过的同三事件 上运行你的代理――发布 cạnh nhau――报告代理 在哪里出现差异――

2. Thêm một kiểm toán "các lần bỏ lỡ" để đánh dấu bất kỳ hành động nào mà không được chấp thuận 时本会是破坏性的命令――衡量一周内近失率――

3. Để đo mô hình giả thuyết từ Claude Sonnet 4.7  thay thế cho tự lưu trữ Llama 3.3 70B── đo độ chính xác RCA delta 和 đô la mỗi sự cố──

4. 构建因果过:区分相关的远程测量尖峰 和真正的根原因──使用20 kịch bản nhãn 训练一个小分类器──

5. 添加滚动干运:使用相同的表现对阶段集群 执行 ArgoCD滚动──在 Slack 之前,在现场集群 中验证滚动计划──

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
- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/aws/aws-devops-agent-helps-you-accelerate-incident-response-and-improve-system-reliability-preview/) Xuất bản kinh điển năm 2026
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) 竞品参考
- [NeuBird semantic monitoring](https://www.neubird.ai) biểu đồ ngữ nghĩa 方法
- [Metoro AI SRE](https://metoro.io) SLO- đầu tiên khung sản xuất
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) Nguồn trạng thái cluster
- [LangGraph](https://langchain-ai.github.io/langgraph/) Nhà tổ chức đại lý tham khảo
- [FastMCP](https://github.com/jlowin/fastmcp) Python MCP Server Framework
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/) mục tiêu khắc phục bị đóng cửa
