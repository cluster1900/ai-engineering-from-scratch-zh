# ReWOO ve Plan- ve- İcra:解式规划

> ReAct bir akışta bir düşünce ve eylemde bulunur. ReWOO onları ayırır: önce tam bir büyük plan oluşturur, sonra uyguluyor.

**类型：**Yapım
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 01 (Ajans Çelişki)
**时间：**~ 60 dakika

## Öğrenme hedefi
- ReAct'in bağlantı döngüsünü neden değiştirdiğini açıklayın.
- 实现一个计划 DAG、一个按依序执行的执行器,以及一个组合工人输出的解决器  全部使用 stdlib──
- 2026 yıl 5 iş akışı kalıpları  framework Anthropic), karar görevleri plan-sonra-imdat kullanılması gerekir ayrıca交错式 ReAct。
- 识别什么时候 Plan-and-Act'in uzun vadede web veya mobil görevler için sentetik plan verileri 识别什么时候 Plan-and-Act'in sentetik plan verileri 识别什么时候 Plan-and-Act'in sentetik plan verileri 识别什么时候 Plan-and-Act'in sentetik plan verileri 识别什么时候 Plan-and-Act'in sentetik plan verileri 识别什么时候 Plan-and-Act's synthetic plan data 识别的数据

## 问题
ReAct'in değişik düşünce- eylem- gözlem döngüsü  basit ve esnek, ancak her araç çağrısı tam önceki bağlamı taşımalıdır  Önceki her düşünceyi de dahil eder. Token kullanımı derinliklerle iki kez büyüyecektir.

ReWOO(Xu et al., arXiv:2305.18323, Mayıs 2023) bunu fark etti, bir değişim yaptı: önce tam bir planlama, paralel bir kanıt elde etmek, son bir araya gelme yanıtı── bir kez LLM çağrısı, planlama için kullanıldı,N ikinci araç çağrısı, kanıt için kullanıldı(parallel bir şekilde kullanıldı), bir kez LLM çağrısı, çözüm için kullanıldı── bu değişim daha az esneklik ile yapıldı(planı statiktir) daha iyi bir token verimliliği değiştirmek, daha net bir başarısızlık modları vardır──

## 概念
### Üç rolü

```
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

Planör bir DAG oluşturur. Her düğüm bir aracı belirler, argümanlarını belirler ve daha önceki düğümlere bağlıdır.`#E1`- Evet.`#E2`Bu tür referanslar: (Solver tüm içeriği bir arada birleştirir)

### Neden 5 kat daha az token ?

ReAct'in hızlı uzunluğu Hız sayısına göre adım sayımı 线性增长──在第十步,快包含思想 1加行动 1加观察 1加思想 2加行动 2加观察 2,依此类推── her bir orta adım da冗余包含原始提示──

ReWOO sadece bir kez ödeme yapma planı süresi((büyük) 、N 个小工人提示((Her bir sadece araç çağrı, zincir yok) ve bir kez çözücü süresi。论文在 HotpotQA 上测得代币 减少约5x,同时绝对精度 提升 +4──

### Neden daha sağlam

Eğer işçi 3 ReAct'te başarısız olursa, loop ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒ ⇒    ⇒       ⇒ ⇒                                                                                                                                                   

### Planer destilasyonu

论文的第二个结果:因为规划师 看不到观测,你可以用175B öğretmeninin规划师输出来调一个7B模型──小模型负责规划;大模型在推断时不再需要──现在已经很常见 许多2026 üretim ajanları使用小规划师 和大执行员,或反过来使用──

### Planlama ve yürütme (LangChain, 2023)

LangChain 团队中中 2023 年 8 月的文章中将 ReWOO 泛化为一个模式名称:Plan-and-Execute──Up-front planner 输出一个步骤列表,执行者 执行者 执行者 每一步,可选的重组规划者 可以在观察结果后进行修改──这比 ReWOO 更接近 ReAct(重组规划者 会将观察带回规划),但保留了令牌节约──

### Plan ve Yasa (Erdogan et al., arXiv:2503.09572, ICML 2025)

Plan-and-Act bu örneği genişletecek uzun vadede web ve mobil ajanlar için önemli katkı sentetik plan verileri: bir etiketlenen yoldaki jeneratör. Planın eğitim verilerini açıkça içerir. WebArena gibi görevlerde 30-50 adımdan fazla devam edebilmesi için ince ayarlama planlayıcı modelleri kullanılır.

### Hangisini seçmek için ne zaman

| Pattern | When |
|---------|------|
| ReAct | 短任务、未知 environment、需要 reactive exception handling |
| ReWOO | 具备已知 tools 的结构化任务、对 token 敏感、evidence 可 parallelize |
| Plan-and-Execute | 类似 ReWOO，但在 partial execution 后支持 replanning |
| Plan-and-Act | Long-horizon（>30 步）、web/mobile/computer-use |
| Tree of Thoughts | Search 值得付出成本（Lesson 04） |

Anthropic'in 2024 yılının 12 aylık yönlendirmesi: En basit yolla başlayın. Eğer görev sadece bir araç çağrısı ise, bir özet de varsa, ReWOO'yu oluşturmayın.


```figure
rewoo-plan
```

## Yapın onu.
`code/main.py`实现一个玩具版 ReWOO:

- `Planner` Bir senaryo politikası, hızlı 输出 planı DAG 
- `Worker`  Kayıt üzerinden 分发每个节点的工具调用──
- `Solver` yazılı kompozisyon, deliller okuyun ve son cevap üretin.
- Bağımlılık çözümü  类似 `#E1`Referanslar daha erken işçi çıkışları için değiştirilmiştir.

这个 demo 回答 Fransa başkenti nüfusunun sayısı, milyonlara yuvarlanmıştır?,使用两步计划:(1) 查找首都,(2) 查找人口,然后求解。

- Yapma .

```
python3 code/main.py
```

Trace 会先完整的计划显示,然后显示工人结果,最后显示解决器组成──将符号计数(我们印打粗略的字符计数) 与 ReAct tarzı 交错运行进行比较  在这种结构化任务上 ReWOO 胜出──

## Kullan
LangGraph Plan-and-Execute olacak 作为食谱提供(`create_react_agent`ReAct için kullanılır, plan-öğretim için kullanılır) ――CrewAI'nin Akışları  doğrudan bu örneği kodladı: önce görevleri tanımlarsın, sonra Flow DAG  onları gerçekleştirir。Plan- ve-Act'in sentetik verileri  metodları şu anda hâlâ çalışmalara, çalıştırma zamanına bağlıdır.

## - Söyle.
`outputs/skill-rewoo-planner.md`Söz konusu araç katalogunda, kullanıcı isteklerine göre 生成 ReWOO plan DAG──, bu işlem, uygulayıcıya teslim edilir 之前验证 planı(acyclic、 her referans çözülmüştür、 her araç var)。

## 练习
1. Özgür plan düğümlerine paralel işçi yürütülmesi için, iki paralel grup içeren bir 6 düğümlü DAG'de, bu ne fayda sağlayabilir?
2. Bir yeniden planlama düğümünü ekleyin, herhangi bir işçi 返回エラー 时触发──让 ReWOO 变成 Plan-and-Execute'ın en az değişimi nedir?
3. Küçük bir modelle yedinci sınıfı değiştir.`Planner`,并让 `Solver`Sınır modelini kullanın. Son-son kaliteyi karşılaştırın.
4. ReWOO'nun planlama destillasyonu hakkında yazısında 4. bölümü okuyun.
5. Bu oyuncak uygulamasını Plan ve Eylem'in yörüngesi şekline taşıyacağız: Plan DAG değil, sırayla değişecek.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ReWOO | “Reasoning without observations” | 先 plan，然后 parallel 获取 evidence，最后 solve —— planning prompt 中没有 observations |
| Plan-and-Execute | “LangChain's plan-execute pattern” | ReWOO 加上 execution 后可选的 replanner node |
| Plan-and-Act | “Scaled plan-execute” | 显式 planner/executor 拆分，并用 synthetic plan training data 支持 long-horizon tasks |
| Evidence reference | “#E1, #E2, ...” | plan-node placeholder，在 dispatch 时用先前的 worker output 替换 |
| Planner distillation | “Small planner, big executor” | 用 large teacher 的 planner traces 来 fine-tune small model |
| Token efficiency | “Fewer round trips” | 论文中在 HotpotQA 上相对 ReAct 减少 5x tokens |
| DAG executor | “Topological dispatcher” | 按 dependency order 运行 plan nodes；每一层可 parallel |

## 延伸阅读
- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323) 经典论文
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572) 带 sentetik planlar  带 sentetik planlar  带
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview) Çerçeve tarifi
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 选择能工作'nın en basit örneği
