# كابستون 06  面向 كوبرنيتس DevOps حل المشاكل وكيل

> وكيل ديفوبس AWS 已 GA,Resolve AI 发布了其K8s playbooks,NeuBird 演示了语义监控,Metoro 将 AI SRE 绑定到按服务划分的SLO──生产形态已确定:alert webhook 触发,agent 读取远程,遍历 K8s الأشياء 图表,对根原因假设 排序,并发布带批准按的 Slack brief──认可阅读-仅──每一个补救都由人门──这个顶石就是这个 وكيل,在20个合成事件上评估,并在三个共享案例上与AWS的代理对比──

**Type:** Capstone
**Languages:** Python (agent), TypeScript (Slack integration)
**先修要求：**المرحلة 11 (هندسة الـLLM) ، المرحلة 13 (الأدوات و MCP) ، المرحلة 14 (الوكلاء) ، المرحلة 15 (المتحكمين) ، المرحلة 17 (البنية التحتية) ، المرحلة 18 (السلامة)
**Phases exercised:**P11 · P13 · P14 · P15 · P17 · P18
**Time:** 30 hours

## 问题
في 2025-2026 سنوات SRE  الحكايات تحولت إلى: AI عملاء تقسيم الحوادث، البشر 批准 التعويضات‬AWS DevOps Agent、Resolve AI、NeuBird、Metoro、PagerDuty AIOps قد تم تسليم هذه الصيغة في الإنتاج‬‬ 读取 Prometheus metrics、Loki logs、Tempo traces、cube-state-metrics، وكذلك الرسم البياني للمعلومات عن كائنات K8s‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

الجزء الأكبر من الصعوبة هو النطاق والسلامة ، وليس التفكير. العامل يحتاج إلى سطح RBAC القراءة فقط ، خادم أدوات MCP المثبتة ، فضلا عن كل أمر يتم النظر فيه مقابل سجلات المراجعة المفروضة.

## 概念
في الرسم البياني المعرفة 上运行──الجوارب هي كائنات K8s ((بودز、تطبيقات、خدمات、جوارب、HPAs、PVCs) وكذلك مصادر التليمترية(سلسلة Prometheus、تدفقات Loki、تتعابير الوقت)

عندما تنبيه 触发时,agent من موضوع متأثر بدء القيام بعمل الجذر-سبب.‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

الإصلاح 受 gate 控制。默认允许的行动是读-only──破坏性行动(扩展下滑,滚回,删除 Pods) تحتاج إلى موافقة Slack;ArgoCD رولرback hooks 需要一个代理 永远不持有的 auth token──audit log 会记录 代理 *نظر * 记录的每条命令,而不只是执行的命令,因此 عملية المراجعة 能捕获近错误──

## المكونات
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
- مصادر الملاحظة: Prometheus، Loki، Tempo، kube-state-metrics
- الرسم البياني المعرفة: ك8s الأشياء + حواف التلفازات 的 Neo4j (مدار) أو kuzu (مدمجة)
- (لانغغراف) ، مع قائمة الموافقة لكل أداة، تقرأ فقط
- نقل الأدوات: على أساس FastMCP من StreamableHTTP؛ أدوات مدمرة  وضعت في بوابة الموافقة  خلف خادم مستقل
- النماذج: كلود سونيت 4.7 تستخدم للاستعراض الجذري، جيميني 2.5 فلاش تستخدم لالتالي التجميع
- التعويض:شرب الويب لـ ArgoCD
- مراجعة: إضافة فقط  سجلات التكوين
- النشر: نشر K8s، مع دور RBAC ضيق خاص به؛ مساحة أسماء مستقلة


```figure
ce-rootcause-walk
```

## بناءها
1. **Graph ingestion.**في كل 30s سوف تكون الحالة-المقاييس 同步到 Neo4j/kuzu。عقد: القنبلة، التنفيذ، العقدة، الخدمة، PVC، HPA。الجانب: OWNED_BY، SCHEDULED_ON، EXPOSES، MOUNTS، SCALES。الجانب التلفزيونية: OBSERVED_BY(القنبلة بواسطة Prometheus سلسلة 观测)。

2. **Alert receiver.**نقطة نهاية FastAPI، استلام PagerDuty أو Alertmanager شبكات الويب──提取受影响的对象(s) 和 SLO خرق──

3. **Read-only tool surface.**通過 FastMCP 封装 kubectl、Prometheus query、Loki logql、Tempo traceql── كل أداة 都有狭窄 RBAC فعل("حصل"، "قائمة"، "وصف")──默认服务 中没有"حذف"、"exec"、"规模"──

4. **Root-cause agent.**(لانغغغراف) ، يحتوي على ثلاث عقدات:`sample`15 دقيقة قطعة التلفونية،`walk`الرسم البياني للطلبات`hypothesize`起草带                                                                                                                                                                                                                                                             

5. **Evidence scoring.**كل فرضية 的分数 = حديثة * تحديد * طول الرسم البياني - المسار العكسي * عدد المشاركات ⋅ عودة إلى أعلى 3‬

6. **Slack brief.**发布附件,包含 الفرضية 图路可视化图片 染的服务器侧),以及最多一个修复行动的批准按──

7. **Remediation gate.**أدوات مدمرة ((توسع إلى أسفل ‬تدوير إلى الوراء ‬حذف) وضعت في خادم MCP الثاني ‬على، تقع رمز الموافقة ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬

8. **Audit log.**إضافة فقط JSONL: لكل أمر مرشح، سجل ما إذا كان قد تم النظر فيه أو تم تنفيذه من قبل الموافقة.

9. **Synthetic incident suite.**构建 20 个场景:OOMKill cascade、DNS flap、HPA thrash、PVC fill、noisy neighbor、defective sidecar、bad ConfigMap rollout、certificate rotation、image-pull backoff 等── حسب دقة السبب الجذري 和 time-to-hypothesis 为 agent 评分。

## استخدمها
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

## 交付 it
`outputs/skill-devops-agent.md`يُمكن تسليمها. أعطى مجموعة K8s و مصدر التحذير. العميل سوف يخلق فرضيات سبب الجذر المرتبة و تدفق إصلاحات معقولة.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | scenario suite 上的 RCA accuracy | 在 20 个 synthetic incidents 中 root cause 正确率 ≥80% |
| 20 | Safety | audit log 中 destructive-action guard 从不在没有 Slack approval 的情况下触发 |
| 20 | Time-to-hypothesis | 从 alert 到 Slack brief 的 p50 低于 5 分钟 |
| 20 | Explainability | 每个 hypothesis 都有 graph paths 和 telemetry citations |
| 15 | Integration completeness | PagerDuty、Slack、ArgoCD、Prometheus end-to-end working |
| **100** | | |

## التدريب
1. في AWS DevOps وكيل التجربة 过的同三事件 上运行你的代理──发布一边一边──报告代理 在哪里出现差异──

2. إضافة مراجعة "قريبة من الإغفال" ، لتحديد أي شيء غير مقبول من الوكلاء *المعتبرين*

3. لنقوم بتحديد النموذج من النظرية من كلود سونيت 4.7 بدلاً من Llama 3.3 70B  قياس دقة RCA دلتا و دولار لكل حادثة

4. 构建因果过:区分相关的远程测量尖峰 和真正的根原因──使用20场景标签 训练一个小分类器──

5. 添加滚动干跑:使用相同的表现对阶段集群 执行 ArgoCD滚动──在 Slack 之前,在现场集群中验证滚动计划──

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
- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/aws/aws-devops-agent-helps-you-accelerate-incident-response-and-improve-system-reliability-preview/) إشارة كنيكية لعام 2026
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) 竞品参考
- [NeuBird semantic monitoring](https://www.neubird.ai) الرسم البياني التفسيري 方法
- [Metoro AI SRE](https://metoro.io) إطار الإنتاج الأول من SLO
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) مصدر الدولة المجموعة
- [LangGraph](https://langchain-ai.github.io/langgraph/) وكيل مرجعية الموسيقي
- [FastMCP](https://github.com/jlowin/fastmcp)إطار خادم Python MCP
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/) هدف إصلاح محاصرة
