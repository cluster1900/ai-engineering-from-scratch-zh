# CrewAI: Rol Based Crews 和 Flow

> CrewAI, 2026 yılında rol tabanlı çoklu ajan çerçevesidir.

**类型：**Öğrenim + yapı
**语言：**Python (stdlib)
**先修：**Fase 14 · 12 (Yapışım Düzenleri), Fase 14 · 14 (Aktör Model)
**时间：**75 dakika kadar .

## Öğrenme hedefi

- CrewAI'nin dört temel bileşenini açıklayın.
- 区分 序列性、階層 和計画中的 合意プロセス;
- 区分 Crews (özel yöneticinin rolüne dayalı) ve Flow (event driven of determination) ile),并解释文档中的生产建议──
- Kullanım`@tool`dekorator 和 `BaseTool`Alt sınıf 接入 araçlar; yapılandırılmış çıkışları ve serbest metinlerin alınmasını anlamak
- Dört çeşit CrewAI hafıza türünü ve her biri ne zaman kullanılması gerektiğini anlatın.
- Bir çalışma gerçekleştirmek için üç ajan ekibi, araştırmacı, yazar, editör, bir kısa yayın yapmak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlamak için bir çalışma hazırlanmaktadır.
- 识别三种 CrewAI başarısızlık modları: hızlı-bölümseme, yöneticiler-LLM vergisi, kırılgan elveriler

## 问题

Özel işbirliği  Demo 里 çok güzel görünüyor  Sonra müşteri gönderir bir hata, sen belirgin bir tekrarlama gerekir  veya finans  bir soru LLM 路由 からのスタッフ tarafından her seferinde ne kadar para harcanacaktır  veya çağrıda                                                                                                                                                                                                                                

Özgürlük biçimi LLM 路由 スタッフ                                                                                                                                                                                                                                                        

CrewAI'nin ayrımı bu değişimle karşı karşıya kalıyor. Ekipleri işbirliği biçiminde, roller üzerine, keşifsel çalışmalarda kullanılıyor.

## 概念

### Dört temel bileşen

Bu çok küçük bir yer.

- **Agent。** `role + goal + backstory + tools + (optional) llm`▽ backstory 很关键──它塑造语气、判断,以及 agent 何时停止──工具是 agent 可以调用函数(下面会讲)。
- **Task。** `description + expected_output + agent + (optional) context + (optional) output_pydantic`❖ kullanılabilir çalışma birimi`expected_output`Evet, evet.`context`列出上游任务,其输遇被传入──`output_pydantic`强制使用结构化形态──
- **Crew。**容器──拥有 `agents`Liste,`tasks`Liste,`process`, ve seçilebilir `memory`+ `verbose`+ `manager_llm`设置──
- **Process。**执行策略──序列性、階層性、共识(计划中)──选择运行的形态──

Ajanlar birbirlerini doğrudan görmezler. Görevler Ajanları alıntı yapar. Ekip görevleri düzenler.

> **已针对**CrewAI 0.86(2026-05)验证──更新版本可能会重新命名或合并过程类型;在依赖具体形态之前,请查看 [CrewAI Processes docs](https://docs.crewai.com/concepts/processes)- Evet.

### İleri sıralar, Hiyerarşik ve Anlaşma

- **Sequential。**Görevler 按声明顺序运行──Task N 的输出可作为 `context`提供给任务 N+1──成本最低──最可预测──当顺序固定时使用──
- **Hierarchical。**Bir yöneticisi ajanı, tek başına bir LLM çağrısı yapan uzmanlar arasında yolculuk yapıyorlar.`manager_llm`Config veya default configuration generating manager──manager Her sıra bir sonraki görevi seçiyor ve reddedebilir veya yeniden yönlendirebilir── eğer dört veya daha fazla uzmanınız varsa, ve sıralama gerçekten ön sıralama çıkışına bağlıdır.
- **Consensus。**计划中, mevcut kamu API 尚未实现──文档保留该名称用于未来基于投票的进程──今日不要依赖它──

Her uzman çağrısında her seferinde bir kez daha yüksek lisans çağrısı yapılması için bir sıralar yapılır.

### Ekipleri Akışlara Karşı

Bu 2026 yılının çerçevesidir.

- **Crew。**LLM- yönlendirilmiş özerklik. Çerçeve: çalışmalarda seçim biçimi.
- **Flow。**Sahip olduğunuz olaylar, grafikte hareket ediyor.`@start`标记入口──`@listen(topic)`标记一个步骤,它会在另一个步骤 发发这个话题 时触发──每一步都是普通 Python(内部调用 Crew)──适合:生产──可观测──可测──确定性──

文档在 2026年生产建议: From Flow 开始──当自治 值得其成本时,把船员 作为 Flow 内部的步骤`Crew.kickoff()`Söyleyin, akış size denetim izini, mürettebat size araştırmayı, kombinasyon kullanımı, yapmayın.

### Araç 集成

给代理配备工具有三种方式――选择最简单而适合的一种――

1. **`@tool` decorator。**純函数 into tools──Signature is schema;docstring is LLM 看到的描述──最适合一次性辅助者──

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **`BaseTool` subclass。**基于类的工具,带显式 args schema、async support、retries──当工具 有状态(client、cache) 或需要结构化 args 时使用──

   ```python
   from crewai.tools import BaseTool
   from pydantic import BaseModel

   class SearchArgs(BaseModel):
       query: str
       limit: int = 10

   class SearchTool(BaseTool):
       name = "web_search"
       description = "Search the web and return top results."
       args_schema = SearchArgs

       def _run(self, query: str, limit: int = 10) -> str:
           return self.client.search(query, limit=limit)
   ```

3. **内置 toolkits。**CrewAI first-party adapterler sağlıyor:`SerperDevTool`- Evet.`FileReadTool`- Evet.`DirectoryReadTool`- Evet.`CodeInterpreterTool`- Evet.`RagTool`- Evet.`WebsiteSearchTool`■ bir kez içeriye girebilir

Yapılandırılmış çıkışlar 使用 Pydantic──在 任务上传入 `output_pydantic=MyModel`❖KrewAI, LLM tepkisini modeline göre test eder, zorla veya tekrar dener.`expected_output`string 配合使用──Free-text output 适合草稿; yapılandırılmış output 才是下游 Akışlar 能消费的内容──

### Hatıra hakları

CrewAI 开箱提供四种内存类型──它们可以组合:一个 Crew可以同时启用四种──

> **已针对**CrewAI 0.86(2026-05)验证──近期版本把所有内容都路由到统一的`Memory`Sistem, bu sistem bu dört tür mağazayı paketliyor. Aşağıdaki konsept modeli hala geçerli, ancak yeni sürümde, kamu sınıfı yüzeyi tek bir olarak kabul edilebilir.`Memory`Giriş noktası; lütfen bakın [CrewAI memory docs](https://docs.crewai.com/concepts/memory)了解当前 API。

- **Short-term。**单次运行内 sohbet tamponu──结束时清空──
- **Long-term。**跨运行持久化──存储在向量DB 中(默认 Chroma,可替换)──按与当前任务的相似度检索──
- **Entity。**按实体 记录事实──X müşteri işletme planında. 按实体键,而不是按相似度──跨运行保留──
- **Contextual。**组装时检索──在 需要时拉取相关记忆,而不是预载──

Ekibin üstü kullanılır.`memory=True`Ya da yapılandırma biçimlerine göre  enable── by your configured embeddings provider 支(默认 OpenAI, can be replaced for local)──Memory is CrewAI 相比较薄框架 体现价值的地方之一;纯LangGraph 需要你自己连接每一种──

### 什么时候适合 CrewAI

- Üç ila altı ajan, roller ve işbirliği iş akışı.
- LLM, bir sonraki aşama kararını değer yönlendirmeyi oluşturur.
- 团队更愿意读 `role + goal + backstory`, değil, grafik tanımını okuyun.

### 什么时候不适合 CrewAI

- 带严格顺序的确定性 DAGs──使用 LangGraph(Lesson 13)──graph shape is correct abstraction;CrewAI'nın rol çerçevesinde 会带来摩擦──
- 亚秒级延迟预算──hierarşik 会增加回路──即使序列化也会序列化包含背景故事和前输出的提示──
- Tek ajan döngüleri── geç çerçeve; bir ajan döngüsü(Deneyim 1) ek araç kayıtları 更短──

Ders 17 ((Agent Framework Tradeoffs) Matrix ile bunu göstermiştir.

### Bağımlılık şekli

独立于LangChain──Python 3.10〜3.13──使用 `uv`✿ Yıldız sayımı: See [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)(Bunlara kadar 2026-05'te çekilen anlık fotoğraf) AWS Bedrock entegrasyonu var dosya;satıcı referansları  rapor onun QA iş yükleri  LangGraph'a göre önemli bir hız var, ancak metodoloji DATASET  hardware  değerlendirme metrikleri) açık değildir, bu nedenle çerçeve-satıcı sayıları sadece yönlendirme referansı olarak kullanılabilir 

### Bu tip bir hata olur.

- **Backstories 导致 prompt-bloat。**Her ajan bir 2000 词的背景故事,再加五个代理的团队,会在第一次工具电话 前烧掉文脈预算――把背景故事 控制在200 词内――跨代理 复用短语;不要把房风重复五遍――
- **Manager-LLM token tax。**Yerarşik süreçler her uzmanın aramasında olacaktır Önceden bir yöneticinin aramasında olacaktır LLM aramasında olacaktır. Beş görevden ekibin aramasında ise beş görevden altı kez gerçekleşecek.
- **Brittle handoffs。**Görev N' `expected_output`Bu bir çizgi. N+1 Görevini bir çizgi olarak koy.`context`读取,并尝试 parse 三个节目──LLM 生成四个──下游 Agent 即兴处理──修复方式在任务 N 上使用 `output_pydantic`,让Task N+1 读取 typed object, not free text──
- **Crew-as-prod。**Özgürlük Şekil Ekibi Flow paketleri olmadan üretim için yayınlanır. Çıkış değişkenliği Yüksek; tekrarlayamaz; çağrıda  olamaz bir kötü运行 ve bir iyi运行. Flow ile 包起来。


```figure
ae-crew-vs-flow
```

## Yapın onu.

`code/main.py`İki çeşit stdlib sürümleri ve üç ajan ekibi gerçekleştirildi.

形态:

- `Agent`- Evet.`Task`Veri sınıfları, CrewAI'nin yüzeyini uyarlar.
- `SequentialCrew.kickoff(inputs)`按声明顺序运行任务,并把输出 作为 `context`传递。
- `HierarchicalCrew.kickoff(topic)`Bir yöneticisi artırmak, bir uzmanı seçmek ve bir görev durdurmak.
- 带 `@start`和 `@listen(topic)`Dekorasyoncıların `Flow`, küçük bir olay döngüsü ve izleri.
- `tool(name)`Dekorasyoncı, Mirror CrewAI'nın `@tool`şekli
- 带 `short_term`- Evet.`long_term`- Evet.`entity`dükkanları `Memory`- Şaka yapıyorum.
- Sahte LLM cevapları rolden ve giriş önbellekleri anahtarlanmış sert kodlanmış dizilere göre yapılır.

具体 demo:researcher、writer、editor crew,产出一份关于 agent engineering 2026 的简报──Researcher 拉取(mocked) 来源──Author 起草──Editor 收紧──同一个 crew 通过 Flow 运行,以展示决定性形──

- Yapma .

```bash
python3 code/main.py
```

İzleme: sıradan mürettebat`context`串接输出,hierarşik ekip 带 manager seçimi( araştırmacı, yazar, editör, sonra done), akış kullanın açık konuları(`researched`- Evet.`drafted`- Evet.`edited`)运行同样三步, araç çağrıları 通过 `@tool`路由,以及长期记忆 在两次开球之间保留──

Ekip izleri ise hareketli; yöneticiler, ilk olarak yeniden düzenlenebilir.

## Kullan

- **CrewAI Flow**Üretim için kullanılır. Akış bile bir adımla ayarlanır.`Crew.kickoff()`❖ Akış  提供审计界
- **CrewAI Crew (Sequential)**Bu çalışmaların, özellikle ilk taslaklar ve inceleme döngüleri için kullanılır.
- **CrewAI Crew (Hierarchical)**Yollama çıkışa bağlıdır ve 4 veya daha fazla uzman kullanır.
- **LangGraph**(Disim 13) Açıklama devlet makineleri için kullanılır, kalıcı bir özetleme, sıkı bir düzenleme.
- **AutoGen v0.4**(Disim 14) Aktör-Model Eşzamanlılık ve hata izolesi için kullanılır.
- **OpenAI Agents SDK**(Deneyim 16) OpenAI-den önce ürünler, el elbise ve korumalar kullanılır.
- **Claude Agent SDK**(Deneyim 17) Claude-first ürünleri,带 subagents 和 sesyon mağazası için kullanılır

## Yayınla

`outputs/skill-crew-or-flow.md`Bu yüzden, bir görev için                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

## 常见坑

- **把 backstory 当作调味。**Bu, çıkışları şekillendirir. Her ajan üç variansı test eder.
- **跳过 `expected_output`。**没有每个任务的契约,下游任务 会拿到LLM 产出的任意内容──机组 能跑;审计会失败──
- **Memory always-on。**Uzun vadede Her seferinde çalışmak için yazılır. Vector DB  büyüme. Çıkarım  değişim                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
- **Manager prompt drift。**Yerarşik yöneticisi istekleri gizlidir. Eğer yönlendirme garip hale gelirse, sözcük modunda atılır.
- **Crews 中 tool side effects。**Crew 可能比预期更多次调用工具──POST、DELETE、payment 流in aşamasına aittir, kesinlikle Crew aracından değildir──

## 练习

1. Sequential crew 转换为 Flow──数一数变化──降低的接触点──记录可读性─降低的位置──
2. 给 crew 添加实体记忆: 关于客户的事实在 kick-off 之间持久化──验证检索 拉取了正确实体──
3. Bir hiyerarşik süreç gerçekleştirmek: yöneticinin yazarın çıkışında en az üç bölüm olması, editörüne giden yolu reddetmek ve bu tekrar denemeyi izlemek.
4. Bir tane * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *`BaseTool`Alt sınıfı:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `@tool`Dekorasyoncı
5. Editör görevini yap`output_pydantic=Brief`, içinden `Brief`- Evet .`title`- Evet.`summary`- Evet.`sections`❖ Yazıcı görevi 输出一次错形 JSON;验证 CrewAI 在 追踪中的重复尝试行为──
6. 阅读 CrewAI'nin doküman girişleri.`crewai`API: STDlib  Versiyon hangi garantiyi atladı?
7. Bu arada, "AgentOps" veya "Langfuse" (Deneyim 24) ile ilgili bir gerçek çalışma yapın.

## 关键术语

| Term | 大家常说 | 实际含义 |
|------|----------------|------------------------|
| Agent | “Persona” | Role + goal + backstory + tools |
| Task | “工作单元” | Description + expected output + assignee + optional structured output |
| Crew | “Agent team” | Agents + Tasks + Process 的容器 |
| Process | “执行策略” | Sequential / Hierarchical / Consensus（计划中） |
| Flow | “Deterministic workflow” | 事件驱动、代码拥有、可测试 |
| Backstory | “Persona prompt” | Agent 的语气与判断塑造器 |
| `@tool` | “Function tool” | 把函数变成 Agent 可调用 tool 的 decorator |
| `BaseTool` | “Class tool” | 带 args schema、retries、async support 的 class-based tool |
| Entity memory | “Per-entity facts” | 限定到某个 customer / account / issue 的 memory |
| Long-term memory | “Cross-run memory” | 在 kickoffs 之间保留的 vector-backed memory |
| Contextual memory | “Just-in-time retrieval” | Agent 需要时才拉取的 memory |
| Manager LLM | “Router agent” | Hierarchical process 中选择下一个 task 的额外 LLM |
| `expected_output` | “Task contract” | 告诉 Agent（和 audit）要返回什么形态的 string |

## 延伸阅读

- [CrewAI docs introduction](https://docs.crewai.com/en/introduction)Konsep ve öneriler:
- [CrewAI Flows guide](https://docs.crewai.com/en/concepts/flows)Evren: olay yönetiş biçimi`@start`- Evet.`@listen`
- [CrewAI tools reference](https://docs.crewai.com/en/concepts/tools)- ...`@tool`- Evet.`BaseTool`、内置 araç kümeleri
- [CrewAI memory](https://docs.crewai.com/en/concepts/memory)Kısa süreli, uzun süreli, birim, bağlam
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)Çoklu ajan ne zaman yardımcı olur ne zaman olmaz.
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview):Devlet makinesi alternatif
