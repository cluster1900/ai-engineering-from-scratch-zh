# Hiyerarşik Arsitektur  ve Başarısızlık Modu

> Yerarşik bir yönetim kurulu yöneticidir. Yönetimciler alt yöneticilerin üstündedirler. Alt yöneticiler de çalışanların üstündedirler.`Process.hierarchical`Yaptı.`manager_llm`动态委派任务并验证输出──LangGraph 中的等价形式是 `create_supervisor(create_supervisor(...))`◊ When tasks themselves are real org chart ⋅ When tasks themselves are real org chart ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real org charts ⋅ When tasks themselves are real ⋅ When tasks themselves are real ⋅ When tasks themselves are real ⋅ When tasks themselves are real ⋅ When tasks are real ⋅ When tasks are real ⋅ When tasks are real ⋅ When tasks are real ⋅ When tasks are real ⋅ When tasks are real ⋅ When tasks are not possible to reach consensus ⋅ When tasks are not possible to reach consensus ⋅ Sequential ⋅ Sequential ⋅ Sequential ⋅ Sequential ⋅ Sequential 往往往往往往 ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                                                                                                  

**类型：**Öğrenim + yapı
**语言：**Python (stdlib)
**前置要求：**16 · 05 aşaması (Negörler örneği)
**时间：**~ 60 dakika

## 问题

Birinde, denetçi örneğini anladıktan sonra, doğal bir sonraki adım:  Eğer işçiler kendiliğinden de denetçilerse,  takımın bir sub-teamı vardır; şirketin bir bölüm altındaki bir bölüm vardır.

问题在:LLM yöneticileri 和人类管理者不同──人类管理者对下属知道有稳定的先验──LLM yöneticileri her bir kez bağlamına göre içeriklerini yeniden düşünüyorlar.

## 概念

### 形态

```
                 Manager
                 ┌─────┐
                 └──┬──┘
           ┌────────┴────────┐
           ▼                 ▼
       Sub-Mgr A         Sub-Mgr B
       ┌─────┐           ┌─────┐
       └──┬──┘           └──┬──┘
         ┌┴──┬──┐          ┌┴──┐
         ▼   ▼  ▼          ▼   ▼
       W1  W2  W3         W4  W5
```

Her iç noktayı planlaştırır, delegeler ve sentezler.

### 适用场景

- **清晰的 org mapping。**Eğer gerçek görev ise departman式的(legal review the doc, finance review the doc, engineering review the doc, then summarize for exec),hierarchy is明确的──
- **Local summarization。**Her alt yöneticinin baş yöneticisi içinde oturması, kendi ekiplerinin çıkışlarını daha önce sentezlemesini görmesi gerekir.

### 失效位置

2026 yıl sonrası testler 持续发现三种故障模式:

1. **Task assignment error。**Yöneticisi 读取目标,幻觉出一个分解,并委派给错误的副管理者──由于副管理者会顺从地处理收到的任务,错误只会在顶层合成时浮现,距离人类本可发现的位置已经隔离了一层──
2. **Output misinterpretation。**Alt yöneticisi 返回不能验证索赔 X──Top yöneticisi 总结为索赔 X未确认──含义在每一层都会漂移──
3. **Consensus loops。**两个副管理员 意见不一致;顶级管理员 要求它们和解;它们向下重新委托;工人重新运行;副管理员 返回略有不同的答案;循环开始──CrewAI 的 `Process.hierarchical`Bu durumu önlemek için adım sınırlar kullanmak gerekir. Ama bu sınırlar artık hiperparametre haline geldi.

###  karar verme sorunu

Sequential (sequential) vs hierarchical: Your task really has independent sub-teams, is also a fake tree's lineary flow? Eğer sonrakilerse, sequential kullanın.

### CrewAI'nin gerçekleştirilmesi

`Process.hierarchical`Genel Müdür LLM 接在专业团队 之上──MANAGER 会:

- 接收 üst düzey görev,
- Alt görevleri ekiplere dağıtacağız.
- Bölümleme ekibinin çıkışlarını değerlendirmek,
- Kabul etmeyi, yeniden görevlendirmeyi ya da tekrarlamayı kararlaştırıyorum.

文档:https://docs.crewai.com/en/introduction（在Temel Kavrayışlar 下查找 "Hiyerarşik süreç")

### LangGraph'in gerçekleştirilmesi

LangGraph kullanın `create_supervisor`İçki denetmen kendi grafikine sahiptir; dış denetmen iç grafikini bir açık olmayan düğüm olarak görecektir.

Referans:https://reference.langchain.com/python/langgraph-supervisor。


```figure
swarm-hierarchy-token
```

## Yapın onu.

`code/main.py`3 seviye hiyerarşi:

- Baş yöneticisi:将任务分分为"engineering"和"legal"分支,
- Mühendislik alt yöneticisi: "frontend" ve "backend" işçiler olarak ayrıldı,
- Yasal yöneticisi:

Demo vs Happy Path (Büyük Yol)**perturbed path**Top Manager'ın parçalanması "yasal" 错标为 "finans",然后观察错误级联:sub-manager 顺从地执行财务 工作,top synthesizer 报告财务发现,原始法律问题 没有得到答――

运行:

```
python3 code/main.py
```

输出会展示两条路径,并清晰并排对比ne sordu和ne teslim edildi──

## Kullan

`outputs/skill-hierarchy-fitness.md`评估给定任务应使用等级,序列,还是平面监督者――输入:任务描述、org structure、调和预算――输出:模式建议,并包含需要防范的具体故障模式――

## Yayınla

Eğer hiyerarşik yayınlarsanız:

- **将 tree depth 限制在 2。**Üç katı zaten gözlemlenebilirlik içinde gizlenmiş çoğu hata.
- **明确 reconciliation budget。**设置顶级经理 必须 commit 前的最大轮――通常为2――
- **每次 synthesis 都要有 provenance。**Her noktanın özetini, yaprak çıkışlarını oluşturmak için alıntı yapmalıyız.
- **对 decomposition drift 告警。**记录每步管理者的分解;与用户查询做不同──如果分解 不再覆盖查询,触发警报──

## 练习

1. 运行  İşlem`code/main.py`Ne kadar seviye yöneticinin elinden gelmesi gerekiyor, üst düzey çıkış 才会完全偏离用户的问题?
2. 添加第三层(上 → sub → sub → worker) ・・・ derinlik 增长,测量 perturbed path 多常会自我修正,以及多常会完全偏离──
3. Bu nedenle, bu konuyla ilgili olarak, bir yöneticinin bir "kanar" işçi oluşturması için bir "kanar" işçisi oluşturması gerekir.
4. 阅读 CrewAI's `Process.hierarchical`文档──识别 CrewAI 应用的一个具体 guardrail(step limit、manager_llm constraint),并描述它针对的失败模式──
5. Bu sistemde LangGraph yöneticileri ve CrewAI hiyerarşikleri karşılaştırıldığında hangisi daha düşük maliyetli bir şekilde uzlaşma döngüsünü test edebilir?

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Hierarchical | "Org chart pattern" | supervisors 位于 supervisors 之上；只有叶子节点执行工作。 |
| Manager LLM | "The boss" | 在内部节点执行 decomposes、assigns 和 validates 的 LLM。 |
| Decomposition drift | "The boss lost the plot" | Top manager 的拆分不再覆盖原始问题。 |
| Reconciliation loop | "Endless meetings" | Sub-managers 意见不一致；top re-delegates；workers re-run；循环直到 budget 耗尽。 |
| Depth-2 ceiling | "Don't go deeper than 2 levels" | 经验性 guardrail：3+ 层会让 observability 坍塌。 |
| Canary question | "Ground truth at every level" | 一个始终收到未改动原始 query 的 worker，用于检测 drift。 |
| Provenance chain | "Who said what" | 从每次 synthesis 回溯到产生它的 leaf outputs 的 trace。 |

## 延伸阅读

- [CrewAI introduction — Process.hierarchical](https://docs.crewai.com/en/introduction) 带有经理 LLM'nin öğretim kurulu
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) 通過 `create_supervisor`实现嵌套 yöneticisi
- [Anthropic engineering — Research system](https://www.anthropic.com/engineering/multi-agent-research-system) Neden Antropik istekli bir yöneticisi seçmek için hiyerarşik değil
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST taksonomisi; koordinasyon hataları hakkında bölümler yozlaşma sürüşünü kaydetti
