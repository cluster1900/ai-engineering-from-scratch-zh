# HTN ve Evrimci Arama kullanmak  planlama

> Simbolik planlama  İşleme planı 可证明正确的场景──Evolusiyonel kod arama 处理健身功能 可由机器检查的场景──ChatHTN (2025) 和 AlphaEvolve (2025) 展示了二者与LLM 结合后分别能解锁什么能力──

**类型:**Yapım
**语言:**Python (stdlib)
**先修要求:**14 · 02 aşaması (ReWOO ve Planlama ve İşe İndirme)
**时间:**~ 75 dakika

## Öğrenme hedefi

- 解释 Hierarşik Görev Ağları: Görevler, yöntemler, operatörler, ön koşullar, etkileri¬¬¬
- 描述 ChatHTN'in hibrid döngüsü  sembolik arama加 LLM fallback parçalanması。
- AlphaEvolve'in evrimsel döngüsünü açıklayın ve neden sadece programatik değerlendirici için uygundur.
- Uygulayacağım bir oyuncak, bir oyuncak ve bir oyuncak evrimsel arama.

## 问题

ReWOO (Deneyim 02) ✓ Plan- ve- İcra et 和 ReAct  çoğu ajan planlamasını kapsarlar── bunlar iki sahneyi kapsarlar.

1. **可证明正确的 plans。**Planlama, Uçuş Yöntemleri, Uyum İş Akışları, Planlama, Yapımında Gerekli Bir Ses Olmalı, Ama Bazen Halüsinasyonlu Bir Adım Yapmak, LLM Planı Kabul Edilemez.
2. **带有机器可检查 fitness function 的优化。**Matrix çarpımı, programlama heuristikleri, kompiler geçişleri  目標不是一个正确的计划,而是最好的计划──

HTN planlama ve AlphaEvolve  çözümü iki farklı sorundur.

## 概念

### Yerarşik Görev Ağı

HTN 包含:

- **Tasks** bileşik (((bkz ayrıştırılmış)
- **Methods** Yapılan karmaşık görevi, ön koşullarla alt görevlere ayırmak.
- **Operators** 带有前条件和效果的原始行动──
- **State**Bir grup gerçek.

Planlama: bir hedef görevi belirle ve başlangıç durumunu bul, bir çözünürlük bul, onu önceden koşullar haline getir 按顺序满足的原始运算者──

HTN çok önce LLM ortaya çıktı ve hala doğru planların kanıtlanabilir bir referans yöntemi olarak kullanılır.

### ChatHTN (Gopalakrishnan et al., 2025)

ChatHTN (arXiv:2505.11814) sembolik HTN ile LLM sorular 交错执行:

1. 尝试现有方法 分解当前复合任务──
2. Eğer bir yöntem yoksa, LLM'yi sor.`s`Nasıl çözeceksin?`task`- Ne ?
3. LLM yanıtlarını aday alt görevlere dönüştürmek.
4. Operatör şeması uyarınca yapılan testler; etkisiz parçalanmayı reddetmek.
5. - Geri dönmek.

论文的核心主张:生成的每一个计划都可证明声音,因为LLM önerileri yalnızca aday parçalanmaları olarak 进入,永远不会直接编辑计划──符号层 负责正确性;LLM 扩展方法图书馆──

Çevrimiçi yöntem öğrenimi(OpenReview `gwYEDY9j2x`,2025 takip) bir öğrenciye katıldı, gerileme yoluyla LLM'nin gelişiminin dağılmasını  en fazla %75'lik LLM sorguların azaltılması  sıklığı

### AlphaEvolve (Novikov et al., 2025)

AlphaEvolve (arXiv:2506.13131, DeepMind, Haziran 2025) başka bir şey türüdür: Gemini 2.0 Flash/Pro ansamblının 编排的进化代码搜索──

Çubuk:

1. Seed programından + program değerlendiricisi 开始(返回健身スコア)。
2. LLM'ler  mutasyonlar önerdi:
3. Mutasyonları değerlendiriciye teslim edeceğiz.
4. En iyisini bırak, mutasyon yapmaya devam et.

已发表的成果:

- 56 yıl önce Strassen'in 4x4 kompleks matris çarpımı ilk gelişme yaptı.
- Borg programlama heuristikleri ile %0.7'nin Google hesaplamalarını geri kazanıyor.
- Yukarıdaki iş yükünde %32'lik FlashAttention hızlandırması başarıldı.

硬性约束:fitness function 必須可由机器检查──

### Ne zaman kullanıyorsun?

| 问题类别 | 使用 | 原因 |
|---------------|-----|-----|
| 带硬约束的 Scheduling | HTN + ChatHTN | 可证明的 soundness |
| Compiler optimization | AlphaEvolve | 机器可检查的 fitness |
| Multi-step task execution | ReAct / ReWOO | LLM in the loop，没有 formal guarantees |
| 带 tests 的 Code improvement | AlphaEvolve | Tests 就是 evaluator |
| Policy-bound automation | HTN | Preconditions 编码 policy |

### Bu model kolayca yanılıyor.

- **没有 operators 的 HTN。**没有预先条件/效果方案,健全性 主张就会崩塌──ChatHTN'in LLM'i 解体 要求方案 能拒绝无效运动──
- **没有真实 evaluator 的 AlphaEvolve。**
- **过度工程化。**Çoğu ajan görevi bu ikisini de gerektirmez.


```figure
htn-tree-expand
```

## Yapın onu.

`code/main.py`İki oyuncak örneği gerçekleştirildi:

- Bir STDlib HTN planlayıcısı, operatörleri, yöntemleri, ön koşulları, etkileri ve bir yöntem olmadığı zaman  eşleşik görev 时触发 `LLMFallback`LLM bir scripted parçalanıcıdır, bu nedenle planlayıcı 可离线运行──
- Bir hedef hesaplama programlarının stdlib evrimsel arama: büyüme ifadeler, make its output in test set 上最小化 `|f(x) - target|`❖ değerlendirici deterministik ❖

运行:

```
python3 code/main.py
```

Trace 会展示 HTN planner 分解一个复合任务 (中途带一次LLM fallback) ve evrimsel döngü 收到一个目标表达──

## Kullan

- **HTN planners** `pyhop`- Evet.`SHOP3`, veya alan-specifik politika uygulanması için kendi oluşturmak.
- **ChatHTN** araştırma kodu; 这个模式 (simbolis + LLM fallback)
- **AlphaEvolve** DeepMind makalesi; bu model(ensemble + evaluator)可复现──OpenEvolve 和类似开源叉 正在出现──
- **Agent frameworks** Şu anda henüz birinci sınıf HTN veya AlphaEvolve yok.

## - Söyle.

`outputs/skill-hybrid-planner.md`生成一个混合规划器架架 (HTN veya evrimsel),并明确限定 LLM rolü──

## 练习

1. Util backtracking  extend HTN planner:当某运营商的后条件 在运行时间 失败时,回滚并尝试下一个方法──
2. 给 ChatHTN 添加 LLM-metod cache:当 LLM 在状态模式 `P`Çözüm Görevini`T`时,存储结果──下一次调用时先重新检查方法库──
3. Evolusiyonel arama değerlendiricisini gerçek test süiti için değiştirmek için; 20 test vakalarının bir parçası olarak biçimleme fonksiyonunu geliştirmek için; rapor almak için gerekli nesiller için;
4. 阅读 AlphaEvolve'ın değerlendirici tasarım notları。为你关心的域名 设计一个评估器(SQL sorgu optimization、test-suite minimize­tion、deployment YAML)。
5. 组合使用: HTN ile karma görevi alt görevlere ayırır, sonra her alt görevde ilk işletimci olarak evrimsel arama kullanır.

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| HTN | “Hierarchical planner” | 带有 operators、preconditions、effects 的 task decomposition |
| Method | “Decomposition rule” | 将 compound task 拆分为 subtasks 的方式 |
| Operator | “Primitive action” | 带有 precondition 和 effect 的具体步骤 |
| ChatHTN | “LLM + HTN” | 当没有 method 匹配时，symbolic planner 询问 LLM |
| AlphaEvolve | “Evolutionary code search” | Ensemble LLMs mutate code；deterministic evaluator 负责选择 |
| Fitness function | “Evaluator” | 针对 outputs 的 deterministic、机器可检查 score |
| Online method learning | “Cached LLM decomposition” | 存储并泛化 LLM plans，以降低 query cost |

## 延伸阅读

- [Gopalakrishnan et al., ChatHTN (arXiv:2505.11814)](https://arxiv.org/abs/2505.11814) sembolik + LLM 混合 planlayıcı
- [Novikov et al., AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带 LLM mutasyonları  带 LLM mutasyonları  带 LLM mutasyonları  带
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 何時選擇 planner,何時選擇 basit döngü
