# Antropik'in İş Akışları:简单优于复杂

> Schluntz 和 Zhang(Anthropic,2024 年 12 月) iş akışlarını ayırt etti(预定义路径) ve ajanlar(动态工具使用) ・・・5 çeşit iş akışı kalıpları 覆盖大多数情况──从直接 API calls 开始──只有当步无法预测时,才添加代理──

**类型：**Öğrenim + yapı
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 01 (Ajans Çelişki)
**时间：**60 dakika kadar .

## Öğrenme hedefi

- Antropik'in beş iş akışı örneği: hızlı zincirleme, yönlendirme, paralelleştirme, orkestrasyon-işçiler, değerlendirmeci-optimallaştırıcı.
- ☐ İş akışına karşı ajan arasındaki farkı ve kendi inşaat maliyetlerini açıklamak
- 识别何时选择工作流而不是代理(反之亦然)
- Scenario ile ilgili LLM'yi kullanmak için tüm beş biçimi gerçekleştirmek için kullanın.

## 问题

チーム常常為本で1つの関数调用解決の問題を1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数调用で1つの関数値を1つの関数に1つける1つの関数に1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1つ1

## 概念

### İş akışları vs. ajanlar

- **Workflow。**通過预定义代码路径编排的 LLM 和工具──工程师 拥有图──
- **Agent。**LLM'ler 动态指挥自己的工具并采取自己的步骤──Model 拥有图──

İkisi de uygulanabilir bir durumdur.  İş akışları daha ucuz, daha hızlı, daha kolay hatalamalar. Agentler  açık sorunları çözebilir, ancak başarısızlık modlarını daha zor hale getirecektir.

### Gelişmiş LLM

五种模式的基础:一个LLM 接入三种能力  arama(kaydım) 、工具(hareketi) 、memory(perseverance) 。 herhangi bir API çağrısı bu yetenekleri kullanabilir。

### 五种模式

1. **Prompt chaining。**1. çağrı çıkışı 2. çağrı giriş olarak kullanılabilir. Açık bir hattlı parçalanma olan görevlerin durumunda uygulanabilir.

2. **Routing。**sınıflandırıcı LLM  seçmek için kullanılacak aşağıdaki LLM veya araç── açıkça farklı girişlerin farklı işleme yöntemlerine ihtiyaç duyulan sınıflandırma durumlarına uygundur(1 seviye destek vs. geri ödeme vs. hata vs. satış)──

3. **Parallelization。**Ve aynı zamanda, N 个 LLM çağrıları,聚合结果──两种形态:sectioning(不同 chunks) 和 voting(同一提示,运行 N 次,多数/合成)

4. **Orchestrator-workers。**Orkestör LLM 动态决定运行哪些工人(同样是LLM),并综合它们的输出──类似的代理循环,但乐队员 不会无限循环──

5. **Evaluator-optimizer。**Bir LLM  önerilen cevap, bir başka LLM  değerlendirme 代〜 değerlendirici 通過──これはSelf-Refine  Lesson 05) 

### İş akışı 胜过代理的地方

- **可预测任务。**Eğer bu adımları atabilirseniz, onu atabilirsiniz.
- **受成本约束的任务。**İş akışları sınırlı adımlar vardır; ajanlar kontrolsüz büyüme olabilir.
- **受合规约束的任务。**Denetçiler, grafikleri, yörüngelerden değil, onu düşünmeyi umuyorlar.

### Ajanlar 胜过工作流的地方

- **开放式研究。**Sonraki adım, önceki adımdan geri dönmekle bağlıdır.
- **可变长度任务。**Bir kaç dakika, bir kaç saat, bir kaç adım, bir kaç bilinmeyen iş.
- **新领域。**Eğer doğru iş akışı hakkında bilmediyseniz, önce araştırın, sonra yeniden kodlayın.

### Konekst mühendisliği 配套内容

"İS ajanları için etkili bağlam mühendisliği" (Anthropic 2025) şekillendirdi komşu学科:200k penceresi bütçe, bir konteyner değil.


```figure
workflow-chain
```

## Yapın onu.

`code/main.py` target `ScriptedLLM`5 iş akışı modelini gerçekleştirdim:

- `prompt_chain(input, steps)` 顺序执行。
- `route(input, classifier, handlers)` sınıflandırma + gönderme。
- `parallel_vote(prompt, n, aggregator)` 运行 N 次并聚聚¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- `orchestrator_workers(task, workers)` orkeströr  seç işçiler
- `evaluator_optimizer(task, proposer, evaluator, max_iter)`Çeviri geçene kadar.

运行:

```
python3 code/main.py
```

Her desen kendi izlerini basar. Her desenin toplam kod satırı sayısı yaklaşık 10-15 satırdır. Çerçeve maliyeti genellikle bin satır olarak ölçülür.

## Kullan

- Çoğu görev doğrudan API çağrıları kullanır.
- 只有当模式 真正需要持久状态(LangGraph) 、演员-model eşzamanlılığı(AutoGen v0.4)  Rol şablonlaması(CrewAI) 时才使用框架──
- Eğer Claude Code'u kullanmak istiyorsan, ama yeniden inşa etmek istemediğinde, Claude Agent SDK'yi seç.

## - Söyle.

`outputs/skill-workflow-picker.md`Söz konusu görev için doğru bir örneği seçmeyi, kararların mantıklılığını ve iş akışlarının yeteri kadar zaman kaybettikleri için bir ajan olarak yapılandırılmasını tanımlamak.

## 练习

1. Güven eşiği kullanmak  Routing gerçekleştirmek                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
2. - Ver .`parallel_vote`Bir çağrıda hangide yaşamak için ne yaparsın?
3. - Ne ?`evaluator_optimizer`改成 bandit:跨代代保全前2output, böylece geceden ortaya çıkan iyi sonuçlar geceden ortaya çıkan kötü sonuçların kapsamına geçmeyecek.
4. 结结:router 选择三条链 中一条──衡量 Token 成本,并与单个大提示替代方案比较──
5. 选择你的一个生产功能――绘画出工作流图――统计步骤数――这里代理 真的会更好吗?

## 关键术语

| 术语 | 人们常说什么 | 它实际意味着什么 |
|------|----------------|------------------------|
| Workflow | "预定义 flow" | Engineer 拥有的 LLM 和 tool calls graph |
| Agent | "Autonomous AI" | Model 拥有的 graph；动态 tool direction |
| Augmented LLM | "带 tools 的 LLM" | LLM + search + tools + memory；原子单元 |
| Prompt chaining | "顺序 calls" | call N 的输出是 call N+1 的输入 |
| Routing | "Classifier dispatch" | 选择由哪条 chain/model 处理输入 |
| Parallelization | "Fan out" | N 个并发 calls；通过 sectioning 或 voting 聚合 |
| Orchestrator-workers | "Dispatcher agent" | Orchestrator LLM 动态选择 specialist LLMs |
| Evaluator-optimizer | "Proposer + judge" | 迭代直到 evaluator 通过；Self-Refine 的泛化 |

## 延伸阅读

- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 五种 iş akışı modelleri
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 配套方法
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) devlet grafikleri 何時值其成本
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 产品化的 orkestrator-workers model
