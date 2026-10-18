# Capstone 06  面向 Kubernetes DevOps Agente de solução de problemas

> O agente DevOps da AWS  já GA, Resolve AI  publicou seus playbooks K8s, NeuBird  apresentou monitoramento semântico, Metoro                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

**Type:** Capstone
**Languages:** Python (agent), TypeScript (Slack integration)
**先修要求：**Fase 11 (engenharia de MLL), Fase 13 (ferramentas e MCP), Fase 14 (agentes), Fase 15 (autônomo), Fase 17 (infraestrutura), Fase 18 (segurança)
**Phases exercised:**P11 · P13 · P14 · P15 · P17 · P18
**Time:** 30 hours

## 问题
As histórias do SRE de 2025-2026 se transformaram em: AI agentes, incidentes de diagnóstico, humanos  aprovações de remédios. AWS DevOps Agente, Resolve AI, NewBird, Metoro, PayerDuty AIOps já estão em produção. 读取 Prometheus metrics, Lokis logs, Tempo traços, cubos-estado-metrics, bem como gráficos de conhecimento de objetos K8.

A maior parte dos problemas está no escopo e na segurança, e não no raciocínio. O agente precisa de um servidor de ferramentas MCP de superfície RBAC de leitura única, bem como de cada ordem.

## 概念
Em um gráfico de conhecimento, os nós são objetos K8s (Pods, Serviços, Nodos, HPAs, PVCs) e fontes de telemetria (Prometheus series, Loki streams, Tempo traces) Edges 编码 ownership (Pod -> ReplicaSet -> Deployment) 编程 (Pod -> Node) 及观察 (Pod -> Prometheus series)  gráfico 通过 kube-state-metrics sync 保持新鲜,并每次警报 时重新样采――

Quando alertar 触发时,agente do objeto afetado 开始做根原因――它遍历边缘,拉取相关远程图片(最近15分钟),并起草一个假设――假设――假设 根据证据 排序:有多少远程图文 支持它、时间有多近、具体程度──top-3假设 会发送到Slack,附带图形路径可视化和修复行动的批准按──

Remediation 受 gate 控制。默认允许的行动是读取只――破坏性行动(skalação, rolling down, deleting Pods) requer aprovação Slack;ArgoCD rollback hooks 需要一个代理 永远不持有的 auth token。audit log 会记录 agent *considered* 的每条命令,而不只是执行的命令,因此审查过程 能捕获近错误──

## Arquitetura
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
- Fontes de observabilidade: Prometheus, Loki, Tempo, kube-state-metrics
- Grafico de conhecimento: objetos K8s + bordas de telemetria 的 Neo4j (gerido) 或 kuzu (embedded)
- LangGraph, com lista de permissões por ferramenta, apenas leitura em formato em formato preferido.
- Transporte de ferramentas: baseado em StreamableHTTP; FastMCP; ferramentas destrutivas  colocado no portal de aprovação   后面的独立服务器
- Modelos: Claude Sonnet 4.7 para raciocínio de causa, Gemini 2.5 Flash para resumo de registro
- Remedição:ArgoCD rollback webhook、PagerDuty 升级、Slack cartão de aprovação
- Auditoria: só apêndice  estruturação log considerado executado aprovado resultado)
- Deploição: K8s de implantação,配有自己的狭窄 RBAC role; independente namespace


```figure
ce-rootcause-walk
```

## Construí-lo
1. **Graph ingestion.**Cada 30s vai ser kube-state-metrics 同步到 Neo4j/kuzu。Nodos: Pod, Deployment, Node, Service, PVC, HPA。Edges: OWNED_BY, SCHEDULED_ON, EXPOSES, MOUNTS, SCALES。Telemetry overlay edges: OBSERVED_BY(Pod by Prometheus series 观测)。

2. **Alert receiver.**Endpoint da FastAPI, recebimento de PagerDuty ou Alertmanager webhooks──提取受影响的对象 (s) 和 SLO violação──

3. **Read-only tool surface.**通過 FastMCP 封装 kubectl、Prometheus query、Loki logql、Tempo traceql──cada ferramenta 都有狭窄RBAC verb("get", "list", "describe")──默认 server 中没有"delete"、"exec"、"scale"──

4. **Root-cause agent.**LangGraph, contém três nós:`sample`- Não, não.`walk`查询图 中的邻近物体,`hypothesize`起草带 telemetry citations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

5. **Evidence scoring.**Cada hipótese de pontuação = recência * especificidade * comprimento do gráfico-caminho inverso * contagem de citações── retornar ao topo-3──

6. **Slack brief.** publicar um anexo, contendo a hipótese ▌visualização de caminho gráfico 染的子图像), bem como os botões de aprovação de uma ação de remediação 

7. **Remediation gate.**Ferramentas destrutivas ((descansar, voltar, excluir) colocadas em outro servidor MCP, localizado no token de aprovação 后面── apenas quando o Slack card é aprovado por humanos 后, agente 才能调用它们──

8. **Audit log.**Aplicar apenas JSONL: para cada comando candidato, registar se foi considerado, executado, aprovado por quem.

9. **Synthetic incident suite.**构建 20 个场景:OOMKill cascata、DNS flap、HPA thrash、PVC fill、noisy neighbor、faulty sidecar、bad ConfigMap rollout、certificate rotation、image-pull backoff etc──de acordo com a precisão da causa raiz 和 time-to-hypothesis 为 agent 评分。

## Use-o
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

## Entrega-o
`outputs/skill-devops-agent.md`É entregue. Foi determinado um grupo de K8s e uma fonte de alerta, um agente irá gerar hipóteses de causa raiz classificadas e um fluxo de remédio com porta-escura.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | scenario suite 上的 RCA accuracy | 在 20 个 synthetic incidents 中 root cause 正确率 ≥80% |
| 20 | Safety | audit log 中 destructive-action guard 从不在没有 Slack approval 的情况下触发 |
| 20 | Time-to-hypothesis | 从 alert 到 Slack brief 的 p50 低于 5 分钟 |
| 20 | Explainability | 每个 hypothesis 都有 graph paths 和 telemetry citations |
| 15 | Integration completeness | PagerDuty、Slack、ArgoCD、Prometheus end-to-end working |
| **100** | | |

## 练习
1. Em AWS DevOps Agente demonstração 过的同三事件 上运行你的代理――发布横边――报告代理 在哪里出现差异――

2. Adicione uma auditoria "quase-miss", usada para marcar qualquer agente *considerado* que não tenha aprovação 时本会是破坏的命令──衡量一周内近失率──

3. Meter o modelo de hipótese de Claude Sonnet 4.7  substituir por Llama 3.3 70B ⋅ medir a precisão RCA delta 和 dólar por incidente ⋅

4. Construir filtro causal:区分相关的远程学学 spikes 和真正的根原因── usando rótulos de 20 cenários 训练一个小分类器──

5. 添加滚动干运行:使用相同的表现对阶段集群 执行 ArgoCD rollback──在 Slack approval button 之前,在现场集群 中验证滚动计划──

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
- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/aws/aws-devops-agent-helps-you-accelerate-incident-response-and-improve-system-reliability-preview/) Referência canónica de 2026
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) 竞品参考
- [NeuBird semantic monitoring](https://www.neubird.ai) gráfico semântico 方法
- [Metoro AI SRE](https://metoro.io) Estruturação de produção SLO-first
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) Fonte de estado de aglomeração
- [LangGraph](https://langchain-ai.github.io/langgraph/) Agente de referência orquestrante
- [FastMCP](https://github.com/jlowin/fastmcp) Framework de servidores Python MCP
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/) Objetivo de remediação por portas
