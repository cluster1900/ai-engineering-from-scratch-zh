# Capstone 06  面向 Kubernetes'in DevOps Sorun Çözme Ajanı

> AWS'in DevOps Ajanı  GA'nın, Resolve AI'nin K8s oyun kitabı yayınladı, NeuBird semantik izlemeyi gösterdi, Metoro AI SRE'yi SLO'ya göre servis bölmesine bağlayacak. üretim biçimi belirlendi: alarm webhauk 触发, ajan 读取远程, K8'lerin nesnelerinin grafiklerini, kök neden hipotezlerini 排列,并发行带批准按  Slack brief──认知阅读-only── her bir iyileştirme insan kapısı tarafından yapılmaktadır. Bu ana taş budur bu ajan, 20 sentetik olayda üst düzey değerlendirilmiştir ve üç ortaklık vaka üzerinde AWS'ın Ajanı ile karşılaştırılmıştır.

**Type:** Capstone
**Languages:** Python (agent), TypeScript (Slack integration)
**先修要求：**11 (LLM mühendisliği), 13 (üçümler ve MCP), 14 (ajanlar), 15 (özerk), 17 (infrastür), 18 (güvenlik) aşama
**Phases exercised:**P11 · P13 · P14 · P15 · P17 · P18
**Time:** 30 hours

## 问题
2025-2026 yılları SRE hikayesi dönüştü: AI ajanları, teşhis olayları, insanlar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

Büyük kısmı zorluk, gerekçenin değil, kapsam ve güvenlikte. Ajanın sadece okunur RBAC yüzeyini, sabit MCP araç sunucusu ve her emirden etkilenenler ile uygulanmış denetim kayıtları arasında bir farkı vardır.

## 概念
Ürünler K8 nesneleridir (Podlar, Deployments, Servisler, Nodlar, HPA'lar, PVC'ler) ve telemetrik kaynaklar (Prometheus serisi, Lokı akışları, Tempo izleri) Edges 编码所有者 (Pod -> ReplicaSet -> Deployment) 编程 (Seduling) Pod -> Node) 及び観測 (Pod -> Prometheus serisi) 図 (K8 nesneler)  Pod -> Prometheus serisi (Pod -> Prometheus serisi)  Graf 通过 kube-state-metrics sync 保持新鲜,并在每次警报 时重新样采――

Alarm 触发时,agent from affected object 开始做根原因──它遍历边,拉取相关远程图片──最近15分钟),并起草一个假设──假设──根据证据──排序:有多少远程图文支持它──时间有多近──具体程度──top-3假设 会发送到Slack,附带图形路径可视化和修复行动的批准按──

Koruma 受 gate 控制。默认允许的行动是读取只──破坏性行动(skalatlamak、滚回、删除 Pods) Slack onayına ihtiyaç duyulur;ArgoCD rollback hooks 需要一个代理 永远不持有的作者代币──audit log 会记录 记录 代理 *considered* 的每条命令,而不只是执行的命令,因此审查过程 能捕获近错的错误──

## Yapılandırma
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
- Gözlemsellik kaynakları: Prometheus, Loki, Tempo, kube-devlet-metrikler
- Bilgi grafiği: K8s nesneleri + telemetri kenarları 的 Neo4j (yönetilen) veya kuzu (gelirmiş)
- LangGraph, her alet için izin listesi, sadece okunabilir.
- Araç taşımacılığı: 基于 StreamableHTTP' ın FastMCP;destructive tools 放置在批准门后面的独立服务器
- Modeller: Claude Sonnet 4.7 kök neden mantık için, Gemini 2.5 Flash log toplama için kullanılır
- Yararlandırma:ArgoCD rollback webhook、PagerDuty 升级、Slack onay kartı
- Denetim: sadece ekleme  yapılandırma logı
- Uygulama: K8'lerin uygulama, kendi kısıtlı RBAC rolü; bağımsız isim alanı


```figure
ce-rootcause-walk
```

## Yapın onu.
1. **Graph ingestion.**Her 30s olacak kube-state-metrics 同步到 Neo4j/kuzu。Kodular: Pod, Deployment, Node, Service, PVC, HPA。Konu: OWNED_BY, SCHEDULED_ON, EXPOSES, MOUNTS, SKALES。Telemetri üst kat kenarları: OBSERVED_BY(Pod by Prometheus serisi 观测)。

2. **Alert receiver.**FastAPI son noktası, PagerDuty veya Alertmanager webhooksı──提取受影响的对象 (s) 和 SLO ihlal──

3. **Read-only tool surface.**通過 FastMCP 封装 kubectl、Prometheus sorgu、Loki logql、Tempo traceql── her araçta 狭窄 RBAC fiili vardır("get", "list", "describe")──默认 server 中没有"delete"、"exec"、"scale"──

4. **Root-cause agent.**LangGraph, üç düğmeye sahiptir:`sample`15 dakika sonra bir telemetri parçası,`walk`查询图 中的邻近对象,`hypothesize`起草带 遠隔測量引用 的 根因候選人

5. **Evidence scoring.**Her bir hipotezin puanı = yakınlık * spesifiklik * grafik-yol uzunluğu ters * alıntı sayısı── top-3ye geri dönmek──

6. **Slack brief.** bir ekleme yayınlamak, hipotezi graf-yol görselleştirme server tarafı 染 graf görüntüsü) ve en fazla bir düzeltme eyleminin onay düğmeleri içerir.

7. **Remediation gate.**Yıkıcı araçlar (skala down,roll back,delete) ikinci MCP sunucusunda yerleştirilmiştir.

8. **Audit log.**Sadece ekle JSONL: her aday komut için, bunun değerlendirilmiş olup olmadığını, uygulanan olup olmadığını, kimin onayladığından, günlük S3'ye gönderilmiştir.

9. **Synthetic incident suite.**构建 20 个场景:OOMKill cascade、DNS flap、HPA thrash、PVC doldurma、 gürültülü komşu、 hatacı yan araba、 kötü ConfigMap dağıtım、 sertifika dönüm、resim çekme geri çekme ect¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## Kullan
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

## - Söyle.
`outputs/skill-devops-agent.md`Bu, K8'lerin bir kümesinin ve uyarı kaynağının oluşmasını sağlar.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | scenario suite 上的 RCA accuracy | 在 20 个 synthetic incidents 中 root cause 正确率 ≥80% |
| 20 | Safety | audit log 中 destructive-action guard 从不在没有 Slack approval 的情况下触发 |
| 20 | Time-to-hypothesis | 从 alert 到 Slack brief 的 p50 低于 5 分钟 |
| 20 | Explainability | 每个 hypothesis 都有 graph paths 和 telemetry citations |
| 15 | Integration completeness | PagerDuty、Slack、ArgoCD、Prometheus end-to-end working |
| **100** | | |

## 练习
1. AWS'in DevOps Ajanı gösterisinin üç olayı üzerinden. Ajanınızı çalıştırmak için yan yana yayınlamak için.

2. Bir hafta içinde neredeyse kayıp oranını ölçmek için, onaysız herhangi bir ajanı işaretlemek için bir "yaklaşık kayıp" denetimi ekleyin.

3. Hipotetik model, Claude Sonnet 4.7'den kendi kendine konutlanmış Llama 3.3 70B olarak değiştirilmiştir.

4. 构建因果过器:区分相关的远程测量尖峰和真正的根源──20 senaryo etiketleri kullanarak 训练一个小分类器──

5. 添加滚动干运行:使用相同 manifest对阶段集群 执行 ArgoCD rollback──在 Slack 之前,在现场集群 中验证滚动计划──

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
- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/mt/announcing-general-availability-of-aws-devops-agent/):2026 yılının kanonik referansı
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) 竞品参考
- [NeuBird semantic monitoring](https://www.neubird.ai) semantik-graf 方法
- [Metoro AI SRE](https://metoro.io) SLO-first üretim çerçevesini oluşturmak
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) Kluster devleti kaynağı
- [LangGraph](https://langchain-ai.github.io/langgraph/) Referans ajan orkestrasyoncu
- [FastMCP](https://github.com/jlowin/fastmcp)Python MCP sunucu çerçevesini
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/) Kapalı iyileştirme hedefi
