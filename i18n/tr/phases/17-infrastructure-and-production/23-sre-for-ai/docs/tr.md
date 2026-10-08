# AI SRE  Çoklu Ajan 事件响应、Runbooks、预测性检测

> AI SRE RAG üzerinden altyapıya dayalı verilere dayanarak yapılan LLM'ler, hareketli araştırma, belge kayıtları ve koordinasyon aşamasından geliyor. 2026 yılının yapısal modeli çoklu ajan orkestrasyonudur.  Özel ajanlar.  日志, gösterge, çalışma kitapları. Yöneticisi tarafından koordine edilmektedir. AI, varsayım ve sorgular sunmaktadır. İnsan onayına ihtiyaç duyulan kararlar vermektedir.

**Type:** Learn
**Languages:** Python (stdlib, toy multi-agent incident triage simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 24 (Chaos Engineering)
**Time:** ~60 minutes

## Öğrenme hedefi
- 画出多代理 AI SRE 架构图:general + uzman ajanlar (日志、指标、runbooks) + insan onay kapısı。
- 解释为什么自动补救的范围很狭(重启 pod、重启部署),而不是很宽(重建服务) 
- 模式 (NewBird Hawkeye): 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信 (Türkiye) = 置信) = 置信 (Türkiye) = 置信 (Türkiye) = 置信)
- MIT'in %89 erken tespit sonucu ve operasyonsal kısıtlama: hiç harekete geçirme yok.

## 问题
Bir çağrı mühendisi, sabah 3'te haber aldı: checkout'ta hata oranı 很高──他们检查数据库、Loki、三个跑本、部署日志──30分后,他们意识到根源是KV缓存峰 导致VLLM OOM──他们重启 pod;错误消失──

2026 yılına kadar, bu tür araştırmalar ön 20 dakika otomatikleştirilebilir. Servisleri birleştirir.

完全自主修复是另一个问题──Restart pod:安全──Scale GPU pool:如果政策 允许则安全──Re-architect the service:绝对不行──关键原则是划清这条狭窄边界──

## 概念
### Çoklu ajan mimarisi

```
          Incident
             │
             ▼
        Supervisor
        /    |    \
       ▼     ▼     ▼
  Log agent  Metric agent  Runbook agent
       │     │     │
       └─────┴─────┘
             │
             ▼
        Hypothesis + evidence
             │
             ▼
        Human approval
             │
             ▼
        Action (narrow set)
```

Gözetmen olayı bölüp alt sorular halinde görecektir. Uzman ajanlar araçlara erişime sahip olacaklar.

### Otomatik düzeltme kapsamı

**Safe (narrow)**: restart pod ̳revert specific deployment ̳in pre-approved boundary within scale pool ̳in pre-approved feature flag'i etkinleştirmek ̳

**Not safe (broad)**:更改服务拓学、修改资源限制、新代码部署、更改 IAM、修改数据库──

Herhangi bir satıcı bunu unutur ve herkes aşırı söz veriyor. AI SRE'nin gelişmesiyle birlikte, güvenlik topluluğu genişleşiyor.

### "NeuBird Hawkeye"

两个模型独立分析同一个事件――如果它们与根本原因一致,信度较高――如果它们不一致,则带有两个可见假设升级――给人类――简单的模式,却是过幻觉的根本原因的有效机制――

### İşlem belleği

团队人员流动是传统SRE的隐形杀手 部落知识 会流失──AI SRE 运行簿 + post-mortems 存入向量DB;agents 会在每一个新事件中检索──当新工程师加入时,AI 拥有完整历史──

### Olay öncesi tahmin

MIT 2025 Araştırmaları: Test setinde, tarih tarihi 、GPU 温度、API 错误模式训练的LLM, 停电 发生前 10-15分预测到了其中89%──

现实检查:没有动作的预测只是仪表板――操作问题是:当我们预测到时,要做什么?预防性排水?

### 2026 yılında ürünler

- **Datadog Bits AI** Datadog 内部的托管 SRE copilotu──
- **Azure SRE Agent** Azure doğası。
- **NeuBird Hawkeye** karşıt değerlendirme + işletim hafızası。
- **PagerDuty AIOps** triaj + deduplasyon。
- **Incident.io Autopilot** olay komutanı + koordinasyon。

### Kod olarak çalıştırma defterleri

Runbooks from Confluence ページ ページ 演进为带有结构化章节 (semptom、hypothesis、verify、act) 版本化 标签down── yapılandırılmış runbooks 能提供更好的 RAG retrieval──启动任何 AI-SRE rollout 时,都应先把非结构化 runbooks 转换成结构化格式──

### Hatırlamalısın numaralar

- MIT erken algılama:% 89'ın kesintileri,10-15 dakika öncesi zaman
- Çoklu ajan sınıflandırması: denetçi +(日志、指标、runbooks) + insan。
- Güvenli otomatik düzeltme seti: pod yeniden başlatıp yeniden dağıtmak, sınır içindeki ölçekte yeniden dağıtmak.
- Rakip değerlendirme: iki model bağımsız; anlaşma = güven.


```figure
i4-incident-agents
```

## Kullan
`code/main.py`模拟多代理 triage:log agent 找到错误,metric agent 找到 CPU spike,runbook agent 匹配到已知问题──Supervisor for hypotheses 排序──

## - Söyle.
本课会生成 `outputs/skill-ai-sre-plan.md`❖ Önceki çağrı ▸ olay hacmi ▸ takım olgunluğu üzerine kurulmuş bir AI SRE dağıtım tasarımı ▸

## 练习
1. 运行  İşlem`code/main.py`Log ve metrik ajanlar uyumsuzsa nasıl çözülebilir?
2. Bu nedenle, bu durumun daha da kötüye gitmesi için, bir süre önce, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir sürecececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece
3. 编写一个结构化 runbook template:sections、required fields、verification commands。
4. Önceden tespit 提前 12 分钟触发. Politikan ne?
5. 论证 Bir 3 kişi ekibi 2026 yılında AI SRE'yi kullanmalı, ya da beklemeli.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| AI SRE | “agent for on-call” | LLM-backed incident investigation + coordination |
| Supervisor agent | “the orchestrator” | 将 incidents 拆分为 sub-queries 的顶层 agent |
| Specialized agent | “domain agent” | 拥有 tool access（日志、指标、runbooks）的 sub-agent |
| Auto-remediation | “AI fixes it” | 狭窄的预先批准 action；不是宽泛的 re-architecture |
| Operational memory | “vector runbooks” | vector DB 中用于 RAG 的 post-mortems + runbooks |
| Adversarial eval | “two-model check” | 独立分析；agreement = confidence |
| NeuBird Hawkeye | “the adversarial one” | 具备 adversarial-eval + memory pattern 的产品 |
| Bits AI | “Datadog's SRE agent” | Datadog 托管的 AI SRE |
| Pre-incident prediction | “early detection” | outage prediction 的 10-15 分钟 lead time |

## 延伸阅读
- [incident.io — AI SRE Complete Guide 2026](https://incident.io/blog/what-is-ai-sre-complete-guide-2026)
- [InfoQ — Human-Centred AI for SRE](https://www.infoq.com/news/2026/01/opsworker-ai-sre/)
- [DZone — AI in SRE 2026](https://dzone.com/articles/ai-in-sre-whats-actually-coming-in-2026)
- [Datadog Bits AI](https://www.datadoghq.com/product/bits-ai/)
- [NeuBird Hawkeye](https://www.neubird.ai/)
- [awesome-ai-sre](https://github.com/agamm/awesome-ai-sre)
