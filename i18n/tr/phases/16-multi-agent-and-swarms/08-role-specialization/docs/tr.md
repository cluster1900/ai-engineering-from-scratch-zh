# 角色专业化  Planlayıcı, Eleştirmen, İcracı, Dayanıcı

> 2026 yılının en yaygın çok ajan parçalanması: bir ajan 负责规划,一个执行,一个批评或验证──MetaGPT (arXiv:2308.00352) bunu kodlama olarak biçimlendirecek rol istekleri arasında SOP  Product Manager、Architect、Project Manager、Engineer、QA Engineer    遵循`Code = SOP(Team)` ChatDev (arXiv:2307.07924) 通過"chat chain" 串联 designer、programmer、reviewer、tester,并使用"communicative dehallucination"(agents 明确请求缺失细节)  Verifier 是承重角色:Cemri et al. (MAST, arXiv:2503.13657) 表明, her çoklu ajan 失败 失败 失败 失败 失败 失败 失败 失败 失败 失败 失败 失败 失败 ⋅ PwC 报告, 后, 后, 准确率提升10% 7×( → 70%) 

**类型：**Öğren + İnşa et
**语言：**Python (stdlib)
**先修：**16 · 04 aşaması (İlk model), 16 · 05 aşaması (Negör)
**时间：**~ 60 dakika

## 问题

Genel olarak çoklu ajanlı sistemler Genel olarak üretilen bir çıkış olacaktır. Grup sohbetindeki üç kodlayıcı üç farklı eşit kod yazacaktır. Daha fazla ajan ekleyebilirsin, daha fazla atış ekleyebilirsin, ama hala kalite kapısını geçemezsin.

修复方法不是更多的代理,而是*不同的*代理──分配不同角色──给Critic 配备Planner 没有工具──给Verifier一个客观的测试套──这样的系统就拥有带有基底纠正的内部不一致,而不仅仅是并行猜测──

## 概念

### 4 Kanonik rol

**Planner.**阅读目标,产出步列或规则──工具:知识检索、docments──Output:结构化计划──

**Executor.**Bir kez okuyun bir plan adım, üretmek için bir eser.

**Critic.**根据Planner的意图审阅执行者的输出──工具:对文物的仅读访问、静态分析──输出:接受/拒绝,并给出原因──

**Verifier.**读取 artefact 并运行确定性检查──工具:test runner、type checker、schema validator──output:pass/fail,并附证──

Eleştirmenler, genellikle LLM'ye dayanan, önyargılı ve görüşlüdür.

### MetaGPT' nin SOP örneği

MetaGPT (arXiv:2308.00352) yazılım mühendisliği SOP'lerini 编码为角色提示:

- **Product Manager**编写 PRD──
- **Architect**产出 sistem tasarımı。
- **Project Manager**Görevleri ayırmak.
- **Engineer**实现──
- **QA Engineer**运行 testleri

Her rolün sert bir giriş/çıktı şeması vardır. Rol hızlı açıklaması bu rol * ne* ve ne* üretilmesi* gerekir.`Code = SOP(Team)`Bu ifade şöyle ifade ediyor: kesin SOP'ler bir dizi LLM'yi bir öngörülebilir boru hattına dönüştürecek.

### ChatDev'in iletişimsel halüsinasyon

ChatDev                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

实现方式:role prompt 包含当你需要未被提供具体信息时,在产出输出 之前按名称询问相关角色──

### Neden Verifier en önemli

Cemri et al. (MAST) 1642 çoklu ajan uygulama başarısızlığını takip etti. Bunların 21.3%'i doğrulama boşluklarıdır. Sistem, kimse kontrol etmediği bir cevabı teslim etti.

PwC  rapor称(CrewAI dağıtımları, 2025),                                                                                                                                                                                                                                                        

### Eleştirmen vs. doğrulayıcı

- Eleştirmen, eserlerin kaliteli LLM'ini incelemektir.
- Verifier, eser üzerinde yapılan bir belirleme prosedürü kullanmaktadır.

两者都用──Critic 能捕捉 Verifier 无法表达的品味问题──Verifier 能捕捉 Critic 看不到的 bug,因为这些 bug 只有在运行时间才出现──

### Çözüm

Sistemdeki her rol LLM'dir ve her rolün çıkışı "Bana iyi görünüyor". Bu klasik MAST başarısızlık modudur. En az bir Verifier ekle, bunun geçmesi/ başarısızlığı LLM tarafından değil, kod tarafından belirlenir.

### Çerçeve haritalamaları

- **CrewAI** `Agent(role, goal, backstory)`Tipik bir uzmanlık yüzeyi.
- **LangGraph** düğümler özel uyarılar olabilir; kenarları 强制执行管道。
- **AutoGen** 在 GroupChat 中使用带单词名称的角色特定的可谈谈的代理──
- **OpenAI Agents SDK** 在 rol uzmanı ajanlar 之间使用交付工具──


```figure
swarm-roles
```

## Yapım

`code/main.py` basit Python fonksiyonunu oluşturmak için kullanılacak 4 rollü bir boru hattını gerçekleştirmek:

- **Planner**产出 spec¬
- **Executor**Çizgi kod hattı.
- **Critic**(LLM simülasyonu) 标记明显问题──
- **Verifier**Sandbox içinde`exec`) içinde test vakaları için 运行生成的代码──

Demo 运行两次:一次执行者 产出正确代码(Critic + Verifier 都通过),一次执行者 产出偏离规格的代码(Critic 漏掉 bug,因为它看起来合理;Verifier 捕捉到 bug,因为测试 失败)

运行:

```
python3 code/main.py
```

## kullanımı

`outputs/skill-role-designer.md`接收一个任务,并产出角色名单 (roll list) 3-5 个角色) 每个角色的输入/输出方案,以及验证器检查──在把代理 接入框架 之前使用它──

## 交付

Kontrol listesini:

- **至少一个确定性 Verifier。**- Tamamen değil.
- **每个 role 都有明确 I/O schema。**Planlayıcı 返回仕様, değil proza; İcracı 读取该 schema。
- **Communicative dehallucination。**Bilgi eksik olduğunda, İcracı'nın Planlayıcı'yı sorması gerekir.
- **Critic/verifier 顺序。**Önceki yazı: "Critic,便宜,捕捉设计问题"),再运行 Verifier,较慢,捕捉 bugs)
- **Loop budget。**之前,最多 2 轮 Eleştirmen-Eğitimci inceleme

## 练习

1. 运行  İşlem`code/main.py`, observer Verifier  nasıl eleştirmen 漏掉 bug ı yakalar ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙  ∙ ∙ ∙   ∙ ∙      ∙                                                                                                                                                                                                                                                                                                                            `return`Bu, çalıştırma süresi testine kadar kaçınılmaz bir sorun tespit edebilir.
2. 添加第 5 个角色:"Eğitim analitiği",把用户愿望转换为Planner-ready spec―― Hangi iletişimsel halüsinasyon istekleri 应向上流?
3. MetaGPT Bölümü 3 ("Agentler") 列出 MetaGPT 5 个角色中每个角色的输入/output schema──
4. ChatDev'in sohbet zinciri şablonu (ArXiv:2307.07924 Şekil 3) ❖ İletişimsel halüsinasyonı tanımlamak
5. PwC'nin 7× doğruluk oranı doğrulama döngüslerinden yükseldi.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Role specialization | "Different agents, different jobs" | 针对 Planner/Executor/Critic/Verifier roles 调优的不同 system prompts。 |
| SOP pattern | "Encoded standard operating procedure" | MetaGPT 的 framing：每个 role 的严格 I/O schemas 将 team 转换为 pipeline。 |
| Communicative dehallucination | "Ask before inventing" | ChatDev pattern：当细节缺失时，Executor 会询问 Planner，而不是自行编造。 |
| Critic | "LLM reviewer" | 主观、有观点的 reviewer。捕捉品味问题。可能被看似合理的 prose 欺骗。 |
| Verifier | "Deterministic check" | 基于 code 的 pass/fail。Test runner、type checker、schema validator。不会被欺骗。 |
| Verification gap | "No one checked" | MAST failures 的 21.3%。答案在没有能捕捉 bug 的 check 的情况下被交付。 |
| Revision loop | "Critic sends it back" | Critic rejection 会触发 Executor 带 feedback 重新运行。需要 budget。 |
| All-LLM anti-pattern | "Looks good to me" | 每个 role 都是 LLM，没有确定性 check。经典 MAST failure。 |

## 延伸阅读
- [Hong et al. — MetaGPT: Meta Programming for Multi-Agent Collaboration](https://arxiv.org/abs/2308.00352) SOP-as-role-prompt 参考论文
- [Qian et al. — Communicative Agents for Software Development (ChatDev)](https://arxiv.org/abs/2307.07924) Çat zinciri + iletişimsel halüsinasyon
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST taksonomisi;verifikasyon boşlukları  başarısızlıkların % 21.3'ünü oluşturuyor
- [CrewAI docs — Agent roles](https://docs.crewai.com/en/introduction) üretim rolü özellik yüzeyi
