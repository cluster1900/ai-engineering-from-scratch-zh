# Gözetmen / Orkestratör-İşçi Örneği

> Bir lider ajanı 负责规划和委派;专门化工人在并行文脈中执行并回报结果──这是人类研究系统的背后模式──Claude Opus 4 作为领导,Sonnet 4 作为子基),内部研究评估上相比单机 Opus 4 升高 +90.2%──Anthropic的工程文章报告称,BrowseComp 上 80% 方差仅由Token usage 解释 多代理 之所以胜,大大是因为每个子基获得全新的文脈窗户──本课从原始人 构建监督模式,并覆盖生产来自部署的2026工程课程──

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## 问题

Araştırma tek ajan sistemlerinin başarısız olabileceği tipik görevdir. Sizce 2023-2026 yılları arasında çok ajan sistemleri nasıl değişti?

Gözetmen örneği bunu düzeltti: Bir lider ajanı arama planı, her alt soruyu bir işçiye gönderir ve sonra sentez yapar.

Antropik'in üretim Araştırma sistemi 報告称, iç araştırma değerlendirmelerinde 上相比单 Opus 4 提升 +90.2%──同一篇文章指出,BrowseComp 方差的80% 仅由 *Token usage alone* 解释──每个 subagent 拥有新文脈是主要机制──

## 概念

### Bu örneği .

```
                 ┌──────────────┐
                 │   Lead       │  plans, decomposes,
                 │  (Opus 4)    │  synthesizes
                 └──┬────┬───┬──┘
                    │    │   │
            ┌───────┘    │   └───────┐
            ▼            ▼           ▼
      ┌─────────┐  ┌─────────┐  ┌─────────┐
      │ Worker1 │  │ Worker2 │  │ Worker3 │
      │(Sonnet) │  │(Sonnet) │  │(Sonnet) │
      └─────────┘  └─────────┘  └─────────┘
         fresh       fresh        fresh
         context     context      context
```

Önderler asla hammaddeleri okumıyor. Önder sentezinden önce işçiler birbirlerinin işlerini asla görmezler.

### Neden işe yarıyor?

Üç mekanizma:

1. **每个 subagent 都有 fresh context。**探索FIPA-ACL mirası  işçi  will carry lead  Planlama üzerinde tüketilen 40k Token ︎ bir sorunu çözmek için 200k penceresi elde etti
2. **通过 prompt 实现 specialization。**Önderin aceleciliği, araştırma değil, parçalanma ve sentezleme. Her çalışanın aceleciliği çok kısadır.
3. **Parallelism。**İşçiler, iş saatini görüyor.`max(worker_times) + plan + synthesis`- Hayır .`sum(worker_times)`- Evet.

### Mühendislik dersleri (Antropik 2025)

Anthropic 文章 listens several articles until 2026 year still relevant production lessons:

- **Scale effort to query complexity.**简单查询:一个代理,3-10次工具调用──复杂查询:10+代理──必须由领导估计这个点,而不是调用者──
- **Broad then narrow.**Önce geniş alt sorulara ayrılır, sonra cevaplar derinlik gerektirir.
- **Rainbow deployments.**Ajanlar 长期 且状态的──传统蓝绿 不适用──Anthropic 使用 rainbow:逐步推出 新版本,同时让旧版本排水──
- **Token usage dominates.**Çoklu ajanlar, tek ajanın 15 katı Tokenleri. Sadece bu görev değeri, maliyetin makul olduğunu kanıtlamak için yeterli.

### LangGraph 转向

LangGraph ilk olarak bir üst düzey yayınladı .`create_supervisor`yardımcı `langgraph-supervisor`⇒2025 yıl, LangChain uygulamasını değiştirmek için tavsiye edecektir araç çağrıları 直接实现 supervisor pattern, çünkü araç çağrıları 能更好地控制 *supervisor sees what*(context engineering) ⋅ bu kitaplık 仍然可用;doc 现在推工具调用形式──

### Başarısızlık modları

- **Lead hallucinates the plan.**Eğer liderlik oluşturan alt sorular gerçek sorunları çözmezse, işçiler yanlış hedef üzerinde kesin bir araştırma yapar.
- **Workers over-explore.**Eğer kapsam sınırları belirlenmezse, işçiler onlara verilen alt soruya ayrılır ve sentez aşamasını kirletir.
- **Synthesis conflicts.**İki işçi  karşılıklı çelişkili gerçeklere geri dönmek  Önder  yeniden sormak  artırmak  belirten  belirten  belirten  ayrılığa  sessiz seçmek  en kötü başarısızlık: kullanıcı asla fark etmez  fark 

### Ne zaman bir yönetici yanlış seçimi yapılır

- **Sequential tasks.**Eğer adım 2 确实需要步骤 1 的输出,parallelism 没有收益──使用管道(CrewAI Sequential、LangGraph linear graph) ⋅
- **Simple queries.**Tek ajan  onları daha hızlı ve daha uygun şekilde işletiyor 
- **Strict determinism.**Gözetmen LLM tarafından seçilen bir delegasyon kullanıyor.


```figure
supervisor-hierarchy
```

## Yapın onu.

`code/main.py`Kullanım`threading` İşçilerin birliğine başvuruda bulunmak, işçilerin her bir alt soruyu ele almak, işçilerin her bir alt soruyu ele almak, işçilerin her birini ele almak, işçilerin gerçek LLM'leri yoktur.

关键结构:

- `Lead.plan(query)`Sorguyu üç alt soruya ayırır.
- `Worker.run(sub_q)`返回一个假摘要(在生产中可以是任何工具使用代理)
- `Lead.run(query)`İşçilerin işlerine katılmak, sonra da sentez yapmak.

运行:

```
python3 code/main.py
```

Çıktı 会 gösterim planı、带 start/end time stamps'ın işçi izleri, ayrıca son sentezi── duvar saati 收益:三个 0.3 saniye işçiler, 0.9 saniye yerine yaklaşık 0.35 saniye içinde tamamlandı.

## Kullan

`outputs/skill-supervisor-designer.md`接收一个用户查询,并产出监管模式设计:lead system prompt、工人角色、subquestion breakdown rules,以及合成模板──在构建新的研究风格的代理系统 前使用它──

## Yayınla

Gözetmenlik Şekili Önceki kontrol listesi:

- **Model pairing.**Önder kullanın akılcı sınıf modeli`o3`Sınıf: ❖ İşçiler Daha hızlı ❖ Daha ucuz model kullanmak ❖ Sonet ❖`o4-mini`)。
- **Worker timeout.**2x ortalama çalışmanın üzerinde çalışanlar öldürülür; lider daha dar bir kapsamda yeniden doğurulur veya yokken devam eder.
- **Token cap per worker.**Sıkı sınır (örneğin 10x beklenen sentez giriş) kaçak işçi 爆预算──
- **Observability.**Trace Lead'ın planı, her işçinin araç çağrıları ve sentezi. Bu, herhangi bir post-hoc debugging'in temelidir.
- **Rainbow rollout.**Devletlerin uzun süreli ajanları  sıcak değişim yerine adım adım sürüm geçiş gerektirir.

## 练习

1. 运行  İşlem`code/main.py`Ve sonra da 5 işçi yerine 3 işçi üretsin diye bir değişiklik yapalım. Duvar saatini izle. Bu demoda işçilerin sayımı paralel tasarruftan daha fazla olacak.
2. 实现 worker timeout:kill 任何运行超过0.5秒的 worker,并让头合成 剩余结果──你需要什么可观察性 才能知道某工被切断?
3. 给领袖的合成 添加冲突检测步骤: Eğer iki işçi 返回相互矛盾的答案, lead 标注分歧,而不是选择其中一个──不调用 LLM 时,你如何检测矛盾?
4. Bu oyuncak demo için üç uygulama kullanılmalıdır.
5. LangGraph'ı karşılaştır`create_supervisor`(Memleket) ve yeni araç çağrısı önerisi. Hangi bir yardımcı yardımcı yardımcılığı? Neden Antropik, sadece alt cevapları, ham işçi bağlamına değil, senteze aktarıyor?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor | “Lead agent” | 一个 orchestrator agent，负责规划、委派和 synthesis。它不亲自执行工作。 |
| Worker | “Subagent” | 由 supervisor 以狭窄 scope 调用的 focused agent，并拥有自己的 context window。 |
| Orchestrator-worker | “Supervisor pattern” | 同一件事，不同名称。2026 文献两种说法都会使用。 |
| Fresh context | “Clean window” | Worker 的 context 从它的 system prompt 和分配的问题开始，而不是 lead 的 history。 |
| Rainbow deployment | “Gradual rollout” | Long-running stateful agents 需要 versioned drain-and-replace，而不是 blue-green。 |
| Token dominance | “Context is the variable” | 根据 Anthropic，research-eval 方差的 80% 来自使用的总 Tokens，而不是 model choice。 |
| Scale effort | “Match agent count to complexity” | Lead 估算 query 难度，并据此生成 1 个或 10+ workers。 |
| Synthesis conflict | “Workers disagree” | 两个 workers 返回互相矛盾的 facts；lead 必须暴露分歧，而不是默默选择一方。 |

## 延伸阅读
- [Anthropic engineering — 我们如何构建 multi-agent 研究系统](https://www.anthropic.com/engineering/multi-agent-research-system) denetim örneği üretim referansı
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) araç çağrıcı gözetmen 现在是推形式
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) miras yardımcı,2026 üretim sırasında hala kullanılıyor
- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents)                                                                                                                                                                                                                                                              
