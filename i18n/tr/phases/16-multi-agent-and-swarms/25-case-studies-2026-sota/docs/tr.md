# 案例研究与 2026 Sanatın Durumu

> Üç değerli üretim derecesi dersleri, her biri çoklu ajan mühendisliği farklı yönlerini göstermiştir.**Anthropic's Research system**(orkestratör-işçi ,15x token                                                                                                                                                                                                                                                         **MetaGPT / ChatDev**(Façavre Software Engineering'in SOP-kodlanmış rol uzmanlığı; ChatDev'in kommunikatif halüsinasyon; MacNet    DAG                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     **OpenClaw / Moltbook**(İlk olarak Peter Steinberger'ın Clawdbot'u, 2025 yılının 11 月; iki kez daha fazla isim; 2026 yılının 3 月 GitHub yıldızları 达 247k;本地 ReAct-loop ajanları;Moltbook 作为只代理社交网络,上线几天内有约2.3M代理账户,2026-03-10 被 Meta收购) nüfus ölçeğini gösterdi 下会发生什么:**Framework landscape April 2026:**LangGraph 和 CrewAI  öncülük üretim;AG2 is社区延续的 AutoGen;Microsoft AutoGen 进入维护模式(并入Microsoft Agent Framework,2026年2月 RC);OpenAI Agents SDK is production Swarm successor;Google ADK(2025年4月) A2A-native entry──现在每个主流框架都提供MCP支持;大多数提供A2A──本课将端到端阅读每个案并提炼共同模式,帮助你下一个生产系统 选择正确参考──

**Type:** 学习（capstone）
**Languages:** —
**Prerequisites:** Phase 16 全部内容（Lessons 01-24）
**Time:** 约 90 分钟

## 问题

Çoklu ajan mühendisliği  hâlâ bir gençlik kursu. Üretim referansları sayısı çok fazla ve her bir örnek bu alanın farklı bölümlerini kapsar. Onları bir koleksiyon olarak okuyun; karşılaştırma yapmak için daha kullanışlı bir şekilde okuyun.

## 概念

### Antropik Araştırma Sistemi

Üretim denetimi işçisi 案例──Claude Opus 4 负责规划与综合;Claude Sonnet 4 subagents 并行研究──已发布工程文章:https://www.anthropic.com/engineering/multi-agent-research-system。

关键实测结果:

- İçsel araştırma değerlendirmeleri Ü, göre tek ajan Opus 4 提升 **+90.2%**- Evet.
- **BrowseComp variance 的 80%**Sadece**token usage**解释,也就是说, çoklu ajanların kazançları büyük ölçüde her alt tarafın yeni bir bağlam penceresi elde etmesinden kaynaklanıyor.
- Tek ajanla karşılaştırıldığında,**每个 query 使用 15x tokens**- Evet.
- Çünkü ajanlar uzun süreli ve devletli, ihtiyaç**Rainbow deployment**- Evet.

已固化的设计经验:

1. **根据 query complexity 缩放 effort。**简单 → 1 个代理,3-10 次 araç çağrıları──中等 → 3 个代理──复杂研究 → 10+ alt 个应对──
2. **先广后深。**Başvurular  geniş aramalar yapılır; lider  kapsamlı; takip edilen başvurular  özel derinlemesine araştırmalar yapılır。
3. **Rainbow deploys。**Eski sürümleri sürdürelim. Çalışan ajanlar tamamlanana kadar.
4. **Verification 不是可选项。**观察表明, if no apparent verifier roles, system will hallucinate──

Bu üretim ölçeği Aşağıda işçi ve işveren topolojisi (Fase 16 · 05) referans örneği.

### MetaGPT / ChatDev

Üretim SOP-rol-decomposition 案例──涵盖 arXiv:2308.00352(MetaGPT)

MetaGPT, yazılım mühendisliği SOP'lerini 编码为角色提示:Product Manager、Architect、Project Manager、Engineer、QA Engineer。论文的表述是:`Code = SOP(Team)`◊ her rolün kısıtlı ◊ özel bir sürpriz vardır; roller arasındaki el uzatma  ◊ yapılı eserler ◊ PRD dokümanları ◊ mimarlık dokümanları ◊ kod) ◊

ChatDev'in katkıları:**communicative dehallucination**◊Agentler, belirli bilgilere cevap verirken, örneğin tasarımcı ajanlar, UI'yi çizerken ◊Soru sorgu programcısı ◊Soru sorgulama yerine hangi dili kullanmayı bekler.

MacNet(arXiv:2406.07155) ChatDev 通過 **DAGs 扩展到 >1000 agents** Her DAG düğümü bir rol uzmanlığıdır; kenarları 编码 handoff kontratları。之所以能够扩展,因为路由是显式且可离线计算的。

设计经验:

1. **Structure 比 size 更重要。**5 rollü SOP ekibi 50 ajanın yapılandırılmamış grubunu yendi.
2. **Handoff contracts 要写下来。**Roller 之间传递的文物 遵循 schema──
3. **Communicative dehallucination**Bu düşük maliyetli bir modeldir.
4. **DAGs 比 chat 更能扩展。**Akışın nasıl olduğunu bilince, onu kodla çıkart.

Bu rol uzmanlaşması (Fase 16 · 08) ve yapılandırılmış topoloji (Fase 16 · 15) için bir örnektir.

### OpenClaw / Moltbook ekosistem

Üretim nüfus ölçeği 案例──时间线:

- **Nov 2025:**Clawdbot (Peter Steinberger'ın yerel ReAct-loop kodlama ajanı) yayınladı.
- **Dec 2025 – Mar 2026:**两次更名(Clawdbot → OpenClaw → 继续以 OpenClaw 运行) 』
- **Feb 2026:**Moltbook  Aynı primitif bir kitle üzerine kurulmuş  Sadece ajanlar içerikli ağ olarak yayınlanmıştır; birkaç gün içinde yaklaşık 2.3M ajan hesapları vardır。
- **Mar 2026 (2026-03-10):**Meta 收购 Moltbook。
- **Mar 2026:**Çin sınırlı hükümet bilgisayar kullanmak OpenClaw。
- **Mar 2026:**OpenClaw 247 bin GitHub yıldızını aşıyor.

Bu, milyonlarca ajanı paylaşılan altyapıya bırakırken, çoklu ajanların nasıl bir şekilde olacağını gösteriyor.

- **Emergent economic activity。**Ajanlar, simge ödemelerini kullanırlar 相互买卖与提供服务──
- **Population scale 下的 prompt-injection 风险。**Bir virüs ajanı profilinin içindeki kötü niyet uyarısı birkaç saat içinde milyonlarca ajan-ajen etkileşime yayılır.
- **State-level regulatory response。**Son birkaç hafta içinde, bu ekosistemin yönetimiyle ilgili bir düzenleme yapıldı.

Bu örneğin tasarım deneyimi teknik, yönetimsel bir parçasıdır:

1. **Population scale 的 multi-agent 是一种新 regime。**Bireysel sistemlerin en iyi uygulamaları (verifikasyon, rol açıklığı) hala uygundur, ama yeterli değil.
2. **Prompt injection 是新的 XSS。**默认将 ajan profilleri 和 交代代理 mesajları 视为不信入──
3. **Regulation 比 design cycles 更快。**提前规划──
4. **Open-source + viral scale 会产生复合效应。**Yaklaşık 4 ay içinde 247 bin yıldız ulaşmak sıradan bir şey değil.

参见 [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)Ayrıca CNBC / Palo Alto Networks'in haberleri 详细节――技术基础方面,Clawdbot / OpenClaw repos 本地 ReAct döngüsünü gösterdi;Moltbook'un açık yayınları  üst kattaki sosyal-graf mimarisini gösterdi。

### Çerçeve manzarası 2026年 4月

| Framework | Status | Best for | Notes |
|---|---|---|---|
| **LangGraph** (LangChain) | Production leader | structured graph + checkpointing + human-in-the-loop | production 推荐默认选择 |
| **CrewAI** | Production leader | role-based crews with Sequential/Hierarchical processes | 擅长 role decomposition |
| **AG2** | Community maintained | GroupChat + speaker selection | AutoGen v0.2 延续版本 |
| **Microsoft AutoGen** | Maintenance mode (Feb 2026) | — | 并入 Microsoft Agent Framework RC |
| **Microsoft Agent Framework** | RC (Feb 2026) | orchestration patterns + enterprise integration | 新 entrant；值得关注 |
| **OpenAI Agents SDK** | Production | Swarm successor | tool-return handoff pattern |
| **Google ADK** | Production (April 2025) | A2A-native | Google Cloud integration |
| **Anthropic Claude Agent SDK** | Production | single-agent + Research extension | 参见 Research system 文章 |

Şimdi her ana çerçeveyi sunuyoruz.**MCP**destek; çoğunlukla **A2A**❖ Protokol uyumluluğu, bir farklılık faktörü değildir.

### Üç örnekten ortak bir model

1. **Orchestrator + workers**(Anthropic'in açıkça denetleyicisi,MetaGPT'nin denetleyicisi olarak PM'i,OpenClaw'ın bireysel ajanları + ağ etkisi)
2. **结构化 handoff contracts**(Antropik alt görev tanımları, MetaGPT PRD/architektür dokümanları, OpenClaw A2A eserleri)
3. **Verification as first-class role**(Anthropic'in doğrulayıcısı, MetaGPT'in QA Mühendisi, OpenClaw'ın ağ içi doğrulayıcıları)
4. **Scaling 是 topology + substrate，而不只是更多 agents**(hemirboğa dağıtımları,MacNet DAGs,popülasyon ölçeği altyapılar)
5. **Cost 是实质性因素并且需要披露**(15x token, MetaGPT'de rol başına bütçe, Moltbook'da etkileşime karşılık fiyatlandırma)
6. **Security posture 是显式的**(Anthropic'in sandboxing  MetaGPT'nin rol kısıtlamaları  OpenClaw  bilinen saldırı yüzeyi olarak hızlı enjeksiyon yapacaktır)

### Bir sonraki projenin için bir referans seçin.

- **Production research / knowledge task → Anthropic Research。**Yeni bağlamlı alt-başlar 胜出。
- **工程 / 工具链工作流 → MetaGPT / ChatDev。**角色 + SOP + 交接契约。
- **Network-effect social product → OpenClaw / Moltbook。**Altyapı + gelişen ekonomi¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- **Classic enterprise automation → CrewAI 或 LangGraph**(İsmin lideri, sabit çalışma süresi)

### 2026 en son teknoloji 总结

截至2026年 4月, bu alan aşağıdaki durumdadır:

- **Frameworks 正在趋同。**MCP + A2A desteği 已是基础门──Handoff semantikası ise tasarım seçeneği olarak kaldı.
- **Evaluation 正在变硬。**SWE-bench Pro、MARBLE、STRATUS hafifleme referansları──Pro is current contamination-resistant ̓现实检查──
- **Production failure rates 已可测量**(Cemri 2025 MAST; gerçek MAS yukarı 41-86.7%) ◊ Bu alanın demo çıktı.
- **Cost 是核心工程约束。**Her görev için belirgin maliyet, her etkileşim için duvar saati, gökkuşağı dağıtım masrafları, çoklu ajanlar, doğru bir şekilde başarısızlık yaparlar, ama bu şekilde başarısızlık yaparlar.
- **Regulation 是近期输入，不是背景关注点。**Yönetim Kurullarının hareketleri tek seferde dağıtım döngüsünden daha hızlıdır.


```figure
a5-orchestrator-scale
```

## Kullan

`outputs/skill-case-study-mapper.md`Bu bir beceri, önerilen bir çok ajan sistem tasarımı içerir ve en yakın vaka çalışmasına yansıtır ve aynı zamanda vaka çalışmasını etiştirilmiş tasarım kararlarını ortaya çıkarır.

## - Söyle.

2026 yılının üretim çoklu ajanın giriş kuralları:

- **从 case study 出发，而不是从零开始。**En yakın bir seçimi yaparak adaptasyon yaparak yapıldı.
- **采用 MCP + A2A。**跨框架的可移植性 很有价值; 协议支持是免费的──
- **用 SWE-bench Pro 或你的内部 Pro-equivalent 进行衡量。**Kontrol edilmiş 已被污染──
- **支付 verification tax。**Bir bağımsız doğrulayıcı, belirti bütçesinin yaklaşık %20-30'unu tüketir ve ölçümün doğruluğunu değiştirir.
- **对 long-running agents 使用 Rainbow deploy。**预期多小时代理运行 会成为常态──
- **阅读 WMAC 2026 和 MAST follow-ups。**Bu bilimsel gelişme hızla başladı.

## 练习

1. 端到端阅读 文章。找出三个设计决策: Eğer daha küçük bir model kullanırsanız, örneğin Haiku 4) Opus 4'i değiştirirseniz, bu kararlar değişir。
2. MetaGPT Bölümleri 3-4 ((arXiv:2308.00352) ・・・把你自己领域中的一个SOP(不是软件)编码为角色提示──这个SOP 暗示了多少角色?
3. 阅读 ChatDev(arXiv:2307.07924)。识别 沟通性幻覚的机制──将其实现到你已经有一个多代理系统 中──
4. OpenClaw ve Moltbook'u okuyun. Popülasyon ölçeğinde bir tane seçin. Aşağıda ortaya çıkıyor, ama 5 ajan sistemi içinde belirli bir başarısızlık moduna sahip olmayacak.
5. 选择您的当前多代理项目──三例研究中哪个是最接近的参考? Bu davetiye çalışmasında henüz uygulandığınız tasarım kararları nelerdir?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Anthropic Research | “supervisor reference” | Claude Opus 4 + Sonnet 4 subagents；15x tokens；相较 single-agent +90.2%。 |
| MetaGPT | “SOP as prompts” | 面向 software engineering 的 role decomposition；`Code = SOP(Team)`。 |
| ChatDev | “Agents as roles” | Designer / programmer / reviewer / tester；communicative dehallucination。 |
| MacNet | “Scale ChatDev via DAG” | arXiv:2406.07155；通过显式 DAG routing 实现 1000+ agents。 |
| OpenClaw | “Local ReAct-loop agents” | Steinberger 的项目；到 2026 年 3 月达 247k stars。 |
| Moltbook | “Agent-only social network” | 2.3M agent accounts；2026 年 3 月被 Meta 收购。 |
| Rainbow deploy | “Multiple versions concurrent” | 为 in-flight long-running agents 保持旧 runtime versions 存活。 |
| Communicative dehallucination | “Ask before answering” | Agents 向 peers 请求具体信息，而不是猜测。 |
| WMAC 2026 | “The AAAI workshop” | 2026 年 4 月 multi-agent coordination 社区焦点。 |

## 延伸阅读

- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Gözetmen-işçi üretim referansı
- [MetaGPT — Meta Programming for Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352) SOP rolü parçalanması
- [ChatDev — Communicative Agents for Software Development](https://arxiv.org/abs/2307.07924) İletişimsel halüsinasyon
- [MacNet — scaling role-based agents to 1000+](https://arxiv.org/abs/2406.07155) DAG ölçeğine dayalı
- [OpenClaw on Wikipedia](https://en.wikipedia.org/wiki/OpenClaw) Ekosistem genel bakış
- [WMAC 2026](https://multiagents.org/2026/) AAAI 2026 Köprü Programı Çoklu Ajan Koordinasyonu Atölyesinde
- [LangGraph docs](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Üretim lideri
- [CrewAI docs](https://docs.crewai.com/en/introduction) Rol Temel Çerçeve
