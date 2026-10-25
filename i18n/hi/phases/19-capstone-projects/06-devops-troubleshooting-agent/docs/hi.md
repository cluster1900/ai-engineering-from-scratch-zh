# Capstone 06  面向 Kubernetes के DevOps समस्या निवारण एजेंट

> AWS के DevOps एजेंट 已 GA,Resolve AI  ने अपनी K8s प्लेबुक जारी की,NeuBird  ने अर्थिक निगरानी का प्रदर्शन किया,Metoro 将 AI SRE 绑定到按服务划分的SLO──生产形态已确定: अलर्ट वेबहुक 触发,एजेंट 读取远程,遍历 K8s ऑब्जेक्ट्स के ग्राफ,对根原因假设 排序,并发布带批准按的 Slack brief──认可阅读-मात्र──每项补救都由人门──这个顶点就是这个代理,在20个合成事件上评估,并在三个共享案例上与 AWS 的代理对比──

**Type:** Capstone
**Languages:** Python (agent), TypeScript (Slack integration)
**先修要求：**चरण 11 (एलएलएम इंजीनियरिंग), चरण 13 (उपकरण और एमसीपी), चरण 14 (एजेंट), चरण 15 (स्वायत्त), चरण 17 (संरचना), चरण 18 (सुरक्षा)
**Phases exercised:**P11 · P13 · P14 · P15 · P17 · P18
**Time:** 30 hours

## 问题
2025-2026 के एसआरई की कहानी में बदल गया हैः एआई एजेंटों का विभाजन, मानव  मान्यता सुधारों।एडब्ल्यूएस डेवओप्स एजेंट, रिज़ॉल्व एआई, न्यूबर्ड, मेटोर, पेजर ड्यूटी एआईओप्स पहले से ही उत्पादन में इस तरह के रूप में वितरित किए गए हैं।

बड़ी भाग कठिनाई दायरा और सुरक्षा पर आधारित है, तर्क की बजाय। एजेंट को केवल पढ़ने के लिए आरबीएसी सतह के एक डीफ़ॉल्ट की आवश्यकता होती है, एक मजबूत एमसीपी टूल सर्वर, साथ ही प्रत्येक आदेश को निष्पादित किए गए लेखा परीक्षा लॉग के खिलाफ माना जाता है।

## 概念
एजेंट ज्ञान ग्राफ 上运行──नोड्स K8s वस्तुएं हैं(पॉड, डिप्लोइमेंट्स, सर्विस, नोड्स, एचपीए, पीवीसी) तथा दूरसंचार स्रोतों(प्रोमेथियस श्रृंखला, लोकी स्ट्रीम, टाइम ट्रैक)  edges 编码 स्वामित्व(पॉड -> प्रतिकृतिसेट -> तैनाती) √ शेड्यूलिंग(पॉड -> नोड) और अवलोकन(पॉड ->प्रोमेथियस श्रृंखला) ◦ग्राफ 通过 kube-state-metrics सिंक 保持新鲜,并在每次警报 时重新样采──

जब अलर्ट 触发时,एजेंट से प्रभावित वस्तु 开始做根原因──它遍历边缘,拉取相关远程学分片(最近 15 分钟),并起草一个假设──假设──假设 根据证据 排序:有多少远程学引用 支持它、时间有多近、具体程度──前三假设会发送到Slack,附带图形路径可视化和修复行动的批准按──

सुधार 受 गेट 控制──默认允许的行动是读取而已──破坏性行动(缩放,滚回,删除 Pods) needs Slack approval;ArgoCD रोलबैक हुक 需要一个代理 永远不持有的作者代币──审计日志 会记录代理 *考虑* 的每条命令,而不只是执行的命令,因此审核过程 能捕获近错误──

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
- अवलोकनशीलता के स्रोतः प्रोमेथियस, लोकी, टेम्पो, कुबे-स्टेट-मेट्रिक्स
- ज्ञान ग्राफः K8s वस्तुओं + दूरदर्शन किनारों 的 Neo4j (प्रबंधित) या kuzu (समावेशित)
- LangGraph, प्रति उपकरण अनुमति सूची, केवल पढ़ने के लिए
- उपकरण परिवहनः 基于 StreamableHTTP का FastMCP; विनाशकारी उपकरण  मंजूरी गेट पर रखा 后面的独立服务器
- मॉडलः क्लाउड सोनेट 4.7 जड़ कारण तर्क के लिए, जेमिनी 2.5 फ्लैश लॉग सारांश के लिए उपयोग किया जाता है
- समाधानःArgoCD रोलबैक वेबहुक、पेजरड्यूटी 升级、स्लैक अनुमोदन कार्ड
- लेखा परीक्षाः केवल अनुलग्नक  संरचनात्मक लॉग
- तैनातीः K8 तैनाती, अपने स्वयं के संकीर्ण RBAC भूमिका के साथ; स्वतंत्र नामस्थान


```figure
ce-rootcause-walk
```

##  इसे निर्माण
1. **Graph ingestion.**प्रत्येक 30s को होगा kube-state-metrics 同步到 Neo4j/kuzu。 नोड्स: पॉड, डिप्लोयमेंट, नोड, सर्विस, पीवीसी, एचपीए。एजः OWNED_BY, SCHEDULED_ON, EXPOSES, MOUNTS, SCALES。टेलीमेट्री ओवरले किनारेः OBSERVED_BY(पोड द्वारा Prometheus श्रृंखला 观测)。

2. **Alert receiver.**फास्टएपीआई एंडपॉइंट, पगड्यूटी या अलर्ट मैनेजर वेबहुक्स,                                                                                                                                                                                                                                                   

3. **Read-only tool surface.**通过 FastMCP 封装 kubectl、Prometheus query、Loki logql、Tempo traceql── प्रत्येक उपकरण में संकीर्ण RBAC क्रियाएँ हैं("प्राप्त", "सूची", "वर्णन")──默认 सर्वर 中没有"删除"、"exec"、"स्केल"──

4. **Root-cause agent.**LangGraph, तीन नोड्स शामिल हैंः`sample`拉取最近15分钟 दूरदर्शन का टुकड़ा,`walk`查询 ग्राफ 中的邻近物体,`hypothesize`起草带 दूरदर्शन उद्धरणों के रैंक मूल कारण उम्मीदवारों

5. **Evidence scoring.**प्रत्येक परिकल्पना का स्कोर = हाल ही में * विशिष्टता * ग्राफ-पथ लंबाई विपरीत * उद्धरण संख्या── लौटें शीर्ष-3──

6. **Slack brief.** एक संलग्नक जारी करें, जिसमें परिकल्पना ग्राफ-पथ विज़ुअलाइज़ेशन (सर्वर-साइड 染的 सबग्राफ छवि) शामिल है), तथा सबसे अधिक एक सुधार कार्रवाई के अनुमोदन बटन

7. **Remediation gate.**विनाशकारी उपकरण (स्केल डाउन, रोल बैक, डिलीट) दूसरे MCP सर्वर पर रखा जाता है, अनुमोदन टोकन पर स्थित है 后面── केवल जब स्लैक कार्ड मानव द्वारा अनुमोदित होता है 后, एजेंट 才能调用它们──

8. **Audit log.**केवल JSONL जोड़ेंः प्रत्येक उम्मीदवार कमांड के लिए, रिकॉर्ड करें कि क्या इसे माना गया है, या निष्पादित किया गया है, या जो द्वारा अनुमोदित किया गया है।

9. **Synthetic incident suite.**构建 20 个场景:OOMKill cascade、DNS flap、HPA thrash、PVC fill、noisy neighbor、defective sidecar、bad ConfigMap rollout、certificate rotation、image-pull backoff等──मूल कारण सटीकता एवं समय-से-अनुमान के अनुसार 评分──

## इसका उपयोग करें
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

## 交付 यह
`outputs/skill-devops-agent.md`यह उपलब्ध कराया जा सकता है। एक K8s क्लस्टर और चेतावनी स्रोत, एजेंट रैंक किया जाएगा कारण-जड़ परिकल्पना और एक स्लैक-गेट उपचार प्रवाह उत्पन्न करता है।

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | scenario suite 上的 RCA accuracy | 在 20 个 synthetic incidents 中 root cause 正确率 ≥80% |
| 20 | Safety | audit log 中 destructive-action guard 从不在没有 Slack approval 的情况下触发 |
| 20 | Time-to-hypothesis | 从 alert 到 Slack brief 的 p50 低于 5 分钟 |
| 20 | Explainability | 每个 hypothesis 都有 graph paths 和 telemetry citations |
| 15 | Integration completeness | PagerDuty、Slack、ArgoCD、Prometheus end-to-end working |
| **100** | | |

## अभ्यास
1. AWS के DevOps एजेंट डेमो में तीन घटनाओं के साथ अप अप अपरेक्ट अपने एजेंट को. . .

2.  एक "नज़दीक चूक" लेखा परीक्षा जो किसी भी एजेंट के बिना अनुमोदन के लिए उपयोग की जाती है ️

3. क्लाउड सोनेट 4.7 से स्व-होस्ट किए गए Llama 3.3 70B हेतु परिकल्पना मॉडल को बदलना

4. संरचना कारण फ़िल्टर:区分相关的远程测量尖峰 和真正的根原因──20 परिदृश्य लेबल का उपयोग करके 训练一个小分类器──

5. 添加滚动干运行:使用相同的表现对阶段集群 执行 ArgoCD滚动──在 Slack स्वीकृति बटन 之前,在现场集群 中验证滚动计划──

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
- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/mt/announcing-general-availability-of-aws-devops-agent/):2026 वर्ष का कैनोनिक संदर्भ
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) 竞品参考
- [NeuBird semantic monitoring](https://www.neubird.ai) अर्थ-ग्राफ 方法
- [Metoro AI SRE](https://metoro.io) SLO-first उत्पादन फ्रेमिंग
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) क्लस्टर-स्टेट स्रोत
- [LangGraph](https://langchain-ai.github.io/langgraph/) संदर्भ एजेंट ऑर्केस्ट्रेटर
- [FastMCP](https://github.com/jlowin/fastmcp) पायथन एमसीपी सर्वर फ्रेमवर्क
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/) बंद उपचार लक्ष्य
