# Eval 驱动的代理 开发

> Antropik'in rehberliği:  basit bir sürprizden başlayarak, onları tam olarak değerlendirerek optimize etmelisiniz ve sadece gerekli olduğunda daha fazla adım ekleyin  ajantik  sistem  değerlendirme son adım değil.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 全部内容。
**Time:** ~60 分钟

## Öğrenme hedefi
- Üç değerlendirme seviyesini anlatın: statik referanslar, offline üretim ve kullanımları.
- 解释评价者-optimator 紧密循环──
- 2026 En İyi Uygulamaları Açıklayın: Evals ve kod bir arada, CI'de çalışarak,并作为PR gate──
- Bu aşamada, 14'ün her dersinin, ortaya çıkan değerlendirme durumuna bağlanması gerekir.

## 问题
Ajanlar 能通过示范──它们会在生产中以示范 无法预测的方式失败──Bendmarks 回答的是 model geniş kapasiteye sahip mi?而不是 bu ajan benim ürünüm için doğru bir yama teslim ediyor mu? 答案是:在三个层内持续运行评估,并将每个 guardrail 和学到的规则都映射到一个 eval案──

## 概念
### Üç değerlendirme seviyesine

1. **Static benchmarks** Kode kullanımı için SWE-bench Verified(Desin 19) 、 için Browsing / 桌面的 WebArena/OSWorld(Desin 20) 、 için generalist GAIA(Desin 19) 、 için tool use of BFCL V4(Desin 06)  için kullanılır

2. **Custom offline evals**                                                                                                                                                                                                                                                              
   - Yargıç olarak LLM ((Langfuse、Phoenix、Opik  Ders 24)。
   - Çalışma tabanlı ((运行 patch,检查测试) ⋅
   - Trajektör tabanlı hareket dizileri altın karşı karşılaştırma; OSWorld-Human  gösterin en üst sınıf ajanlar altın 1.4-2.7x) ⋅

3. **Online evals** 生产:
   - Oturum tekrar oynanıyor.
   - Garda Rail 触发的告警(Düşünme 16、21)
   - 单步成本 / 延迟跟踪 (Düşünme 23 OTel kapsamı)

### Değerlendirici-optimizeci ((Antropik)

紧密循环:

1. Önericisi 生成输出──
2. Değerlendirici  karar vermek için 
3. Değerlendirici geçene kadar,

Bu, genelleştirilmesinden sonra Self-Refine'dir. Önemli olduğun her şey, güvenilirliği artırmak için değerlendirici-optimizeci'ye paketlenebilir.

### 2026 En iyi uygulamalar

- Evaller ile kodları bir arada koyun.
- Her PR'de CI'den geçiyor.
-                                                                                                                                                                                                                                                               
- Her koruma bir değerlendirme olayına yerleştirilmiştir.
- Her öğrenilen kuralın bir başarısızlık durumuna dönüşmesi için düşünce, çalışma akışı öğrenme kuralları kullanılır.

### 14 . Faseyi başlatırız .

Fase 14'te her ders değerlendirme vakaları üretir:

| Lesson | 它生成的 Eval case |
|--------|------------------------|
| 01 Agent Loop | Budget-exhausted、infinite-loop guard |
| 02 ReWOO | 当 tool 失败时，Planner 能正确 replans |
| 03 Reflexion | 学到的 reflections 会在 retry 时应用 |
| 05 Self-Refine/CRITIC | Judge 通过 refined output |
| 06 Tool Use | Argument coercion 生效；unknown tools 被拒绝 |
| 07-10 Memory | Retrieval citations 与 sources 匹配；stale facts 失效 |
| 12 Workflow Patterns | 每种 pattern 都产生正确输出 |
| 13 LangGraph | Resume 精确复现 state |
| 14 AutoGen Actors | DLQ 捕获 crashed handlers |
| 16 OpenAI Agents SDK | Guardrail 在正确输入上触发 |
| 17 Claude Agent SDK | Subagent results 返回 orchestrator |
| 19-20 Benchmarks | SWE-bench Verified score、WebArena success rate、OSWorld efficiency |
| 21 Computer Use | Per-step safety 捕获 injected DOM |
| 23 OTel | Spans 发出 required attributes |
| 26 Failure Modes | Detectors 标记 known failures |
| 27 Prompt Injection | PVE 拒绝 poisoned retrievals |
| 28 Orchestration | Supervisor 路由到正确 specialist |
| 29 Runtime Shapes | DLQ 处理 N% failure |

Eğer değerlendirme süiti her bir bölümü kapsarsa, 14. aşamayı kapsarsın.

### Eval 驱动开发会在哪里失败

- **没有 baseline。**没有最后的知名的评价 无法解读──存储基线──
- **LLM-judge 没有 grounding。**Yargıçlar da halüsinasyon yapar. KRITİK ŞEKİLER.
- **过拟合 evals。**Bu nedenle, üretimden daha iyi bir şekilde yararlanmak için, değişim durumları
- **Flaky evals。**Kesin olmayan durumlar yanlış alarmlar yaratacak.


```figure
ae-eval-three-layers
```

## Yapın onu.
`code/main.py`Evet , bir stdlib eval harness:

- 带 kategorilar(benchmark、custom、online) için dava kayıtları。
- Bir senaryolu ajan test altında.
- Değerlendirici-optimizeci döngüsü:Önceleme, yargı, geçme veya maksimum turlara ulaşıncaya kadar temizleme.
- CI kapısı:汇总 geçiş oranı + baseline'nin geri dönüşü­ne göre

- Yapma .

```
python3 code/main.py
```

输出: her vaka'nın geçiş/başarısızlık 逆戻り旗 CI gate hüküm 

## Kullan
- Agent koduna benzer repo'larda eval vakaları yazmak
- Her PR'de CI'den geçerek onları yürütmek için kullanılıyor.
- Geri dönüş sırasında yapım yapmayı başarısız et.
- Zamanla değişen geçiş oranı.
- Her üretim başarısızlığı yeni bir vaka bağlanır.

## - Söyle.
`outputs/skill-eval-suite.md`Bir ajan ürünü için, CI kapıları ve geri dönüş izlemeyi içeren üç kat değerleme süiti oluşturmak.

## 练习
1. Bir üretim başarısızlığının birini çekmek için bir değerlendirme vakası yazmak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlık için bir bir tane hazırlamak için bir tane hazırlık için bir tane hazırlamak için bir tane hazırlamak için bir tane hazırlanın
2. Alanınız için üç boyutlu bir bölüm oluşturun.
3. Bu değerlendirme süiti İçe girer % 5'lik gerileme sırasında  yapım 失败
4. 添加轨迹-efficiency metric:agent 相比黄金轨迹 走过多少步?
5. Fase 14'teki her dersinizi bir değerlendirme vakası olarak sizin süitinize yerleştirmek.

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Static benchmark | “Off-the-shelf eval” | SWE-bench、GAIA、AgentBench、WebArena、OSWorld |
| Custom offline eval | “Domain eval” | 面向你的产品形态的 LLM-as-judge / exec / trajectory |
| Online eval | “Production eval” | Session replay、guardrail alerts、cost/latency tracking |
| Evaluator-optimizer | “Propose-judge-refine” | 迭代直到 judge 通过 |
| CI gate | “Merge blocker” | 在 eval regression 时让 build 失败 |
| Baseline | “Last-known-good” | 用于检测 regression 的 reference score |
| Trajectory efficiency | “Steps over gold” | Agent step count 除以 human expert minimum |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)                                                                                                                                                                                                                                                              
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选 referans değerleri
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) Araç kullanım referansı
- [Langfuse docs](https://langfuse.com/) 实践中的 evals + sesyon tekrarlaması
