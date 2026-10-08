# 卡普斯通 06 面向库伯尼特斯的 DevOps 解决问题代理

>  AWS 的 DevOps 代理 已 GA,Resolve AI 发布了其 K8s 玩本,NeuBird 演示了语义监测,Metoro 将 AI SRE 绑定到按服务划分的 SLO──生产形态已经确定:预警网链 触发,代理 读取远程测量,遍历 K8 物体的图表,对根原因假设 排序,并发布带有批准按的 Slack 简短──认可阅读-仅──每一个修复都由人门──这个顶点就是这个代理,在20个合成事件上评估,并在三个共享案例上与 AWS 的代理对比.

**Type:** Capstone
**Languages:** Python (agent), TypeScript (Slack integration)
**先修要求：**项目项目: 项目项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目:
**Phases exercised:**子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子
**Time:** 30 hours

## 问题
2025-2026年的SRE故事变成了:AI代理 分诊事件,人类批准补救措施.AWS DevOps代理,解决AI、新鸟、Metoro、PagerDuty AIOps已经在生产中交付了这种形态.

大部分难点在于范围和安全,而不是推理. 代理需要默认的仅读的RBAC表面,加固的MCP工具服务器,以及每条命令被考虑到执行的审计记录.

## 概念
在知识图上运行. 节点是K8的对象 (Pod,部署,服务,节点,HPA,PVC) 以及远程测量来源 (Prometeus系列,Loki流,时间痕迹).

当警报时,从受影响对象开始做根源原因――它遍历边缘,拉取相关的远程测量切片――最近15分钟),并起草一个假设――假设 根据证据排序:有多少远程测量引用支持它――时间有多近,具体程度――前三假设会发送到Slack,附带图形路径可视化和修复行动的批准按――

修复 受关 控制──默认允许的行动是仅阅读的──破坏性行动(缩放,滚回,删除Pod) 需要Slack批准;ArgoCD滚回需要一个代理 永远不持有作者代币──审计日志 会记录代理 *考虑* 的每条命令,而不只是执行的命令,因此审查过程 能捕获近错误──

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
- 观察性来源:普罗梅泰斯,洛基,特马波,库贝状态测量
- 知识图:K8s对象 + 远程测量边缘 的 Neo4j (管理) 或 kuzu (嵌入式)
- 通过LangGraph,带每工具允许的列表,默认只读
- 工具运输:基于 StreamableHTTP 的FastMCP;破坏性工具 放置在批准门后面的独立服务器
- 模型:克劳德·索内特4.7用于根源推理,Gemini 2.5闪存用于日志总结
- 补救:ArgoCD回滚网、付费者 升级、Slack批准卡
- 审计:仅附录 结构化日志
- 部署:K8部署,配有自己的狭窄的RBAC角色;独立名称空间


```figure
ce-rootcause-walk
```

## 构建它
1. **Graph ingestion.**每30年将有状态测量 同步到Neo4j/kuzu。节点:Pod,部署,节点,服务,PVC,HPA。边缘:OWNED_BY,SCHEDULED_ON,EXPOSES,MOUNTS,SCALE。电气覆盖边缘:OBSERVED_BY(Pod 由Prometheus系列观测)。

2. **Alert receiver.**快API终端点,接收PagerDuty或AlertManager网络链接──提取受影响的对象 (s) 和SLO违规──

3. **Read-only tool surface.**通过FastMCP 封装 kubectl、Prometheus查询、Loki logql、Tempo traceql──每个工具都有狭窄的RBAC动词("Get","List","Describe")──默认服务器 中没有"删除"",exec"","规模""

4. **Root-cause agent.**包含三个节点:`sample`拉取最近15分钟的遥测片,`walk`查询图 中的邻近物体,`hypothesize`起草带电路测量引用的排名根源候选人──

5. **Evidence scoring.**每个假设的分数 = 近期 * 具体性 * 图形路径长度逆 * 引用数量──返回前三──

6. **Slack brief.**发布一个附件,包含假设,图形路径可视化,以及最多一个修复行动的批准按.

7. **Remediation gate.**破坏性工具 (下调,滚回,删除) 放在第二个MCP服务器上,位于批准符号后面.

8. **Audit log.**仅添加JSONL:对每个候选命令,记录它是否被考虑是否被执行由谁批准.

9. **Synthetic incident suite.**构建20个场景:OOMKill台、DNS片、HPA冲击、PVC填充、噪音邻居、故障的侧车、坏的ConfigMap推广、证书旋转、图像拉回后退等──根据根源原因准确性和时间到假设为代理 评分──

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
`outputs/skill-devops-agent.md`给定一个K8s集群和警报来源,代理会产生排列的根源假设和一个Slack-gated补救流.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | scenario suite 上的 RCA accuracy | 在 20 个 synthetic incidents 中 root cause 正确率 ≥80% |
| 20 | Safety | audit log 中 destructive-action guard 从不在没有 Slack approval 的情况下触发 |
| 20 | Time-to-hypothesis | 从 alert 到 Slack brief 的 p50 低于 5 分钟 |
| 20 | Explainability | 每个 hypothesis 都有 graph paths 和 telemetry citations |
| 15 | Integration completeness | PagerDuty、Slack、ArgoCD、Prometheus end-to-end working |
| **100** | | |

## 练习
1. 在 AWS 的 DevOps 代理演示中, 经过三次事件 上运行你的代理.

2. 添加一个"近错"审计,用于标记代理 *被认为* 的任何在未经批准时会是破坏性的命令.

3. 将从克劳德·索内特4.7的假设模型替换为自主托管的Llama 3.3 70B──衡量每次RCA精度的德尔塔和美元──

4. 构建因果过器:区分相关的远程测量尖峰和真正的根源――使用20场景标签训练一个小分类器――

5. 添加滚动干跑:使用相同的表格对阶段集群执行ArgoCD滚动. 在 Slack批准按之前,在现场集群中验证滚动计划.

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
- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/aws/aws-devops-agent-helps-you-accelerate-incident-response-and-improve-system-reliability-preview/) 2026 年的法典参考
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) 竞品参考
- [NeuBird semantic monitoring](https://www.neubird.ai)语义图 方法
- [Metoro AI SRE](https://metoro.io) SLO-第一生产框架
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics)集群状态来源
- [LangGraph](https://langchain-ai.github.io/langgraph/) 参考代理主管
- [FastMCP](https://github.com/jlowin/fastmcp) Python MCP服务器框架
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/)关闭的补救目标
