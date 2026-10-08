# Capstone 06  面向 Kubernetes DevOps Agent de résolution des problèmes

> L'agent DevOps d'AWS  déjà GA,Résolve AI  a publié ses livres de jeu K8s,NeuBird  a présenté la surveillance sémantique,Metoro  va utiliser l'AI SRE  liée à un service divisé SLO ⋅ mode de production déjà déterminé: alerte webhook 触发,agent 读取远程, traversé K8s des objets graphes, à l'ordre des hypothèses de cause de racine,并发布带批准按的 Slack brief──认认读-only──每个补救都由人门──这个顶点就是这个代理,在20 个合成事件上评估,并在三个共享案例上与AWS的 Agent对比──

**Type:** Capstone
**Languages:** Python (agent), TypeScript (Slack integration)
**先修要求：**La phase 11 (ingénierie de la LLM), la phase 13 (outils et MCP), la phase 14 (agents), la phase 15 (autonomie), la phase 17 (infrastructure), la phase 18 (sécurité)
**Phases exercised:**P11 · P13 · P14 · P15 · P17 · P18
**Time:** 30 hours

##  problématique
Les SRE de 2025-2026 sont devenus: AI agents, incidents de diagnostic, humains  approuvés réparations.AWS DevOps Agent, Résous AI, NeuBird, Metoro, PayerDuty AIOps sont déjà en production.

La plupart des difficultés résident dans la portée et la sécurité, et non dans le raisonnement. L'agent a besoin d'un serveur d'outils MCP de surface RBAC par défaut, en lecture seule, ainsi que de chaque commande.

## 概念
Les nœuds sont des objets K8 (Pods, déploiements, services, nœuds, HPAs, PVC) ainsi que des sources de télémétrie (Prometheus series, Lokie streams, traces de temps) Edges 编码 ownership (Pod -> ReplicaSet -> Deployment) 编程 (Pod -> Node) 及 observation (Pod -> Prometheus series)  Graph 通过 kube-state-metrics synchronise 保持新鲜,并每次警报 时重新样采――

Lorsque l'agent de l'objet affecté commence à faire des causes racinaires, il traverse les bords, tire des tranches de télémétrie connexes, et élabore une hypothèse.

Réparation 受ゲート 控制。默认允许的行动是读取而已──破坏性行动(缩放,滚回,删除Pods) 需要Slack approval;ArgoCD rollback hooks 需要一个代理 永远不持有的作者代币──audit log 会记录代理 *considered* 的每条命令,而不只是执行的命令,因此审查过程 能捕获近错误──

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
- Sources d'observabilité: Prometheus, Loki, Tempo, métriques de l'état de l'état
- Graphique de connaissances: objets K8s + bordures de télémétrie 的 Neo4j (géré) ou kuzu (embedded)
- LangGraph, avec liste d'autorisation par outil, en lecture seule.
- Transports d' outils: basés sur le FastMCP de StreamableHTTP; outils destructeurs  placés à la porte d' approbation  derrière le serveur indépendant
- Modèles: Claude Sonnet 4.7 pour le raisonnement de cause, Gemini 2.5 Flash pour la résumé du journal
- Remédiation:Roulement de l'argoCD en ligne de rechange PagerDuty 升级、Slack carte d'approbation
- Audit: seule annexe  log structuralisé consideré exécuté approuvé  résultat)
- Déploiement: déploiement des K8, avec son propre rôle de RBAC restreint; espace de nom indépendant


```figure
ce-rootcause-walk
```

## - Je le construis.
1. **Graph ingestion.**Chaque 30s va être avec des métriques-état 同步到 Neo4j/kuzu。Nodes: Pod, Déploiement, Node, Service, PVC, HPA。Edges: OWNED_BY, SCHEDULED_ON, EXPOSES, MOUNTS, SCALES。Télémetry surlay edges: OBSERVED_BY(Pod by Prometheus série 观测)。

2. **Alert receiver.**Rapidement, les utilisateurs peuvent être amenés à utiliser des logiciels de gestion de données.

3. **Read-only tool surface.**通過 FastMCP 封装 kubectl、Prometheus query、Loki logql、Tempo traceql── chaque outil ont un verbe RBAC restreint("obtenir", "liste", "décrire")──默认 server 中没有"delete"、"exec"、"scale"──

4. **Root-cause agent.**LangGraph, contient trois nœuds:`sample`La télémetrie est en train de se faire.`walk`查询图 中的邻近对象,`hypothesize`起草带                                                                                                                                                                                                                                                             

5. **Evidence scoring.**Chaque hypothèse de score = récente * spécificité * longueur de chemin de graphes inverse * nombre de citations── retour au top-3──

6. **Slack brief.**publier un annexe, contenant une hypothèse ▌visualization du parcours graphique 染的子图像), ainsi que les boutons d'approbation de la plupart des actions de réparation 

7. **Remediation gate.**Les outils destructeurs (descendants, rétrécissants, supprimés) sont placés sur un serveur MCP de seconde dimension, situé à l'arrière du jeton d'approbation.

8. **Audit log.**JSONL: pour chaque commande de candidat, enregistrer si elle a été considérée, si elle a été exécutée, approuvée par qui.

9. **Synthetic incident suite.**构建 20 个场景:OOMKill cascade、DNS flap、HPA thrash、PVC fill、noisy neighbor、faulty sidecar、bad ConfigMap rollout、certificate rotation、image-pull backkoff etc。 selon la précision de la cause et le temps à l'hypothèse 评分。

## Utilisez-le
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

## Je le livre.
`outputs/skill-devops-agent.md`Il est livrable. Il est donné un cluster de K8 et une source d'alerte, l'agent va générer des hypothèses de cause de racine classées et un flux de remise en état à la porte de la faille.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | scenario suite 上的 RCA accuracy | 在 20 个 synthetic incidents 中 root cause 正确率 ≥80% |
| 20 | Safety | audit log 中 destructive-action guard 从不在没有 Slack approval 的情况下触发 |
| 20 | Time-to-hypothesis | 从 alert 到 Slack brief 的 p50 低于 5 分钟 |
| 20 | Explainability | 每个 hypothesis 都有 graph paths 和 telemetry citations |
| 15 | Integration completeness | PagerDuty、Slack、ArgoCD、Prometheus end-to-end working |
| **100** | | |

## 练习
1. Dans la démo de l'agent DevOps d'AWS 过的同三事件 上运行你的代理──发布一边一边──报告代理 在哪里出现差异──

2. Ajouter une " quasi-miss " audit, utilisé pour marquer agent *consideré* de tout ce qui est sans approbation 时本会是破坏的命令──衡量一周内近失率──

3. Pour mesurer la précision du delta et du dollar par incident, on peut utiliser le modèle d'hypothèse de Claude Sonnet 4.7 pour remplacer le Llama 3.3 70B.

4. Construire un filtre de causalité: distingués par des pics de télémétrie et des causes profondes  Utilisez les étiquettes de 20 scénarios  entraînez un petit classifiateur

5. 添加滚动干运行:使用相同的表现对阶段集群 执行 ArgoCD滚动──在 Slack approval button 之前,在现场集群 中验证滚动计划──

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
- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/aws/aws-devops-agent-helps-you-accelerate-incident-response-and-improve-system-reliability-preview/) Références canoniques pour l'année 2026
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) 竞品参考
- [NeuBird semantic monitoring](https://www.neubird.ai) graphique sémantique 方法
- [Metoro AI SRE](https://metoro.io) Cadrage de la production par SLO
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) source de l'état de groupe
- [LangGraph](https://langchain-ai.github.io/langgraph/) agent de référence orchestrateur
- [FastMCP](https://github.com/jlowin/fastmcp) Framework de serveur Python MCP
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/) objectif de réparation fermé
