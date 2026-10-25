# Capstone 06  面向 Kubernetes DevOps Agente de solución de problemas

> AWS DevOps Agent  Ya GA, Resolve AI  Publicó sus K8s playbooks, NeuBird  Presentó monitoreo semántico, Metoro                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

**Type:** Capstone
**Languages:** Python (agent), TypeScript (Slack integration)
**先修要求：**Fase 11 (ingeniería de la LLM), Fase 13 (herramientas y MCP), Fase 14 (agentes), Fase 15 (autónomo), Fase 17 (infraestructura), Fase 18 (seguridad)
**Phases exercised:**P11 · P13 · P14 · P15 · P17 · P18
**Time:** 30 hours

##  problemas
Las historias de SRE de 2025-2026 se han convertido en: AI agentes de diagnóstico de incidentes, humanos 批准 remedios。AWS DevOps Agent、Resolve AI、NeuBird、Metoro、PagerDuty AIOps ya han entregado esta forma de producción。 读取 Prometheus metrics、Loki logs、Tempo traces、cube-state-metrics, así como el gráfico de conocimiento de los objetos K8s。 en cinco minutos genera con las citas de telemetría una hipótesis de raíz de causa clasificada。 sin la aprobación humana clara de Slack, no ejecuta comandos destructivos―

La mayor parte de la dificultad se basa en el alcance y la seguridad, no en el razonamiento. El agente necesita un servidor de herramientas MCP de superficie RBAC de lectura única, así como cada orden que se considere en comparación con los registros de auditoría ejecutados.

## 概念
En el gráfico de conocimiento, los nodos son objetos de K8 (Pods, Servicios, Nodos, HPAs, PVC) y fuentes de telemetría (Prometheus series, Loki streams, Tempo traces) Edges 编码 ownership (Pod -> ReplicaSet -> Deployment) 编程 (Pod -> Node) y observación (Pod -> Prometheus series)  gráfico 通过 kube-state-metrics sync 保持新鲜,并每次警报 时重新样采――

Cuando alerta 触发时, agente de objeto afectado 开始做根原因──它遍历边缘,拉取相关远程图片(最近15分钟),并起草一个假设──假设 根据证据 排序:有多少远程图文 支持它、时间有多近、具体程度──前三假设 会发送到Slack,附带图形路径可视化和修复行动的批准按──

• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

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
- Fuentes de observabilidad: Prometheus, Loki, Tempo, cube-estado-metricas
- Gráfico de conocimiento: objetos K8s + bordes de telemetría 的 Neo4j (administrado) o kuzu (embedded)
- LangGraph, con lista de permisos por herramienta, sólo para lectura.
- Transporte de herramientas:  basado en el FastMCP de StreamableHTTP; herramientas destructivas  colocado en la puerta de aprobación  posterior del servidor independiente
- Modelos: Claude Sonnet 4.7 para razonamiento de raíz, Gemini 2.5 Flash para resumen de registro
- Remediación:ArgoCD rollback webhook PayerDuty 升级 Slack tarjeta de aprobación
- Auditoría: sólo adjunta  estructural log considerado  ejecutado  aprobado  resultado)
- Despliegue: Despliegue de K8, cuyo propio papel de RBAC es estrecho; espacio de nombres independiente


```figure
ce-rootcause-walk
```

## Construirlo
1. **Graph ingestion.**Cada 30 años será kube-state-metrics 同步到 Neo4j/kuzu。Nodos: Pod, Despliegue, Nodo, Servicio, PVC, HPA。Edges: OWNED_BY, SCHEDULED_ON, EXPOSES, MOUNTS, SCALES。Edges de superposición de telemetría: OBSERVED_BY(Pod por serie Prometheus 观测)。

2. **Alert receiver.**El objetivo de la aplicación es que el usuario pueda acceder a un sistema de control de datos de Internet de Internet de Internet de forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma rápida, en forma de forma rápida, en forma rápida, en forma de forma rápida, en forma de forma rápida, en forma de forma rápida, en forma de forma rápida, en forma de forma efectiva, en forma de forma que se pueda hacer algo que pueda ser posible.

3. **Read-only tool surface.**通過 FastMCP 封装 kubectl、Prometheus query、Loki logql、Tempo traceql──cada herramienta tiene un pequeño verbo RBAC("obten", "lista", "describir")──默认 server 中没有"delete"、"exec"、"scale"──

4. **Root-cause agent.**LangGraph, contiene tres nodos:`sample`拉取最近15分钟sección de telemetría,`walk`查询 gráfico de objetos vecinos de la región,`hypothesize`起草带 telemetry citations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

5. **Evidence scoring.**Cada hipótesis de la puntuación = reciencia * especificidad * longitud del trazado del gráfico inverso * número de citas― regresar a la cima−3.

6. **Slack brief.**Publicar un anexo, que incluye la hipótesis, la visualización de la ruta gráfica, la imagen subgrafica del servidor, así como los botones de aprobación de la acción de reparación.

7. **Remediation gate.**Herramientas destructivas (descalan, vuelven a escalar, eliminan) colocadas en un segundo servidor MCP, ubicadas en el token de aprobación 后面── sólo cuando Slack card es aprobado por el hombre 后, el agente 才能调用它们──

8. **Audit log.**JSONL sólo para añadir: para cada comando candidato, registrar si fue considerado, si fue ejecutado, aprobado por quien.

9. **Synthetic incident suite.**构建 20 个场景:OOMKill cascada、DNS flap、HPA thrash、PVC fill、noisy neighbor、faulty sidecar、bad ConfigMap rollout、certificate rotation、image-pull backoff等── según la exactitud de la causa raíz 和 time-to-hypothesis 为 agent 评分。

## Usalo
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

##  entregarlo
`outputs/skill-devops-agent.md`Es posible entregar. Se determina un grupo de K8 y una fuente de alerta.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | scenario suite 上的 RCA accuracy | 在 20 个 synthetic incidents 中 root cause 正确率 ≥80% |
| 20 | Safety | audit log 中 destructive-action guard 从不在没有 Slack approval 的情况下触发 |
| 20 | Time-to-hypothesis | 从 alert 到 Slack brief 的 p50 低于 5 分钟 |
| 20 | Explainability | 每个 hypothesis 都有 graph paths 和 telemetry citations |
| 15 | Integration completeness | PagerDuty、Slack、ArgoCD、Prometheus end-to-end working |
| **100** | | |

##  ejercicios
1. En AWS DevOps Agent demo 过的同三事件 上运行你的代理――发布一边一边――报告代理 在哪里出现差异――

2. Añadir una auditoría "cerca de la falta", para marcar cualquier agente *considerado* de cualquier tipo sin aprobación 时本会是破坏的命令──衡量一周内近失率──

3. La teoría de la hipótesis de Claude Sonnet 4.7 se sustituye por Llama 3.3 70B.

4. Construir filtro causal:区分相关的远程学分和真正的根原因――con etiquetas de 20 escenarios 训练一个小分类器――

5. 添加滚动干运:使用相同的表现对阶段集群 执行 ArgoCD滚动──在 Slack 之前,在现场集群中验证滚动计划──

## 关键术语: "El hombre es un hombre"
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
- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/mt/announcing-general-availability-of-aws-devops-agent/):2026 año de referencia canónica
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) 竞品参考
- [NeuBird semantic monitoring](https://www.neubird.ai) gráfico semántico 方法
- [Metoro AI SRE](https://metoro.io) Enmarcado de producción SLO-first
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) Fuente del estado de grupo
- [LangGraph](https://langchain-ai.github.io/langgraph/) Orquestación de agentes de referencia
- [FastMCP](https://github.com/jlowin/fastmcp) Framework de servidores Python MCP
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/) objetivo de reparación cerrado
