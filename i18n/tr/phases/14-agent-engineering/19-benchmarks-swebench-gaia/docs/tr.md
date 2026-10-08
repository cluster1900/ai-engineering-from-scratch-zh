# Benchmarks:SWE-bench、GAIA、AgentBench

> Üç referans 构成 2026 yıl ajan değerlendirme 点──SWE-bench 测试代码 patching──GAIA 测试 generalist tool usage──AgentBench 测试 multi-environment reasoning──to understand their composition、contamination 叙事,以及 they do not measure anything──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 06 (Tool Use)
**Time:** ~60 minutes

## Öğrenme hedefi

- SWE-bench test harnesini anlatmak, neden birim testleri olarak kullanıldığını açıklamadı.
- SWE-bench Verified (OpenAI, 500 görev) neden varmış ve neden ortadan kaldırılmışmış?
- 描述 GAIA 的设计:对人类简单,对 AI 困难;三个难度等级──
- AgentBench'in sekiz ortamını ve açık kaynaklı LLM'lerin ana engelleyici olduğunu anlatın.
- 总结 SWE-bench+  contamination 发现及其影响──

## 问题

Lider tabloları size hangi modelin bir referans değerinde kazandığını söylerler.

- Referans değerleri: ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐
- Benchmark is否衡量你关心的内容(kod vs. tarama vs. genelci)
- değerlendirici 否强AST eşleşmesi、 devlet kontrolleri、insan incelemesi)

Bir rakamı belirtmeden önce, önce bu üç noktayı ve başarısızlık modlarını öğrenin.

## 概念

### SWE-bench ((Jimenez et al., ICLR 2024 oral)

- 12 热门 Python reposs of 2,294 个真实 GitHub sorunlarından
- Agent 得到:pre-fix commit 的代码库 + doğal dil sorununun açıklaması。
- Ajan 产出: Bir yama.
- Değerlendirici: aplika patch,运行 repo'nın test süiti──patch 必须让 FAIL_TO_PASS tests(以前失败,现在通过)翻转,同时不破坏 PASS_TO_PASS tests──

SWE-agent(Yang et al., 2024) yayınlama sırasında %12.5'e ulaştı, [1] [2] [3] [3] [3] [4] [4] [4] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [5] [6] [6] [6] [6] [7] [7] [7] [8] [8] [8] [8] [8] [8] [8] [8] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [9] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [10] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [11] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12] [12]

### SWE-benç Verified

OpenAI,2024 yıl 8 月──人工 kurate edilmiş 500 görev alt kümesi── belirsiz sorunları, güvenilir olmayan testleri ve belirsiz görevleri kaldırmak──

### Kirlilik

- SWE-benç sorunlarının % 94'ten fazlası çoğu model kesintiye neden olmuştur.
- **SWE-bench+**Başarılı patchlerin %32,67%'i sorun metninde çözümler sızdığını buldu.
- Daha temiz, ama tamamen kirlenmeden değil.

实践影响: SWE-bench'te %50'lik bir model elde edilir, SWE-bench+ 上可能只有 35%── Eğer SWE-bench performansını iddia ederseniz, lütfen始终同时报告两者──

### GAIA(Mialon et al., Kasım 2023)

- 466 soru; bunlardan 300'ü huggingface.co/gaia-benchmark'ın özel sıralama çizelgesine ayrılmıştır.
- 设计理念:对人类在概念上简单(92%), ama AI 困难(带插件的GPT-4:15%) 
- 测试 akıl yürütme ‒Multimodal ‒ web ‒ araç kullanımı ‒
- Üçüncü seviye: 3 seviye: Uzun alet zincirleri.

GAIA genelist yetenekleri ölçmek için kullanılır.

### AgentBench ((Liu et al., ICLR 2024)

- 8 个环境,覆盖 code(Bash、DB、KG)、games(Alfworld、LTP)、web(WebShop、Mind2Web) ve açık nesil。
- Çok dönüşlü, her bölük yaklaşık 4k-13k dönüştürülür.
- Önemli Bulgu: Uzun vadeli akıl yürütme, karar verme ve talimatları takip etmek OSS LLM'lerin  takip edici ticari engelleridir.

### Bunlar neyi ölçmez ?

- Gerçek dünya operasyon maliyeti
- Düşmanlık koşulları, aşağıdaki güvenlik davranışları:
- Kendi değerlendirmelerinle, Ders 30)
- Kuyruk başarısızlığı (benchmarks) ⇒ ortalama (production operators) 关心最差的1%) ⇒

### Benchmarking 常见错误

- **执着于单一数字。**SWE-benç %50   告诉你的信息低于P50/P75/P95 cost + step distribution──
- **Contaminated claims。**報告 SWE-bench 却不提 Verified 或 SWE-bench+ is misleading ⋅
- **Benchmark-as-development-target。**Benchmark 优化会偏离生产有用性──


```figure
ae-swebench-gate
```

## Yapın onu.

`code/main.py`实现一个玩具版 SWE-bench-like harness:

- Sentetik hata düzeltme görevleri(3 görev)。
- Bir senaryolu ajan, parşömenler önerecek.
- Bir test koşucusu, FAIL_TO_PASS'ı kontrol etmek için kullanılıyor.
- Bir GAIA tarzında sorulara dayalı parçalanma derinliği sınıflandırıcısı

- Yapma .

```
python3 code/main.py
```

输遇展示每一个任务+每一个难度的解决率,并让评估员规则变得具体――

## Kullan

- **SWE-bench Verified**Kod ajanları kullanmak için kullanılıyor.
- **GAIA**Genelist ajanlar kullanıyor. Özel liderlik çizelgesi bölünmesini kullanıyor.
- **AgentBench**Çok çevre karşılaştırması kullanılmıştır.
- **Custom evals**(Deneyim 30) Ürününüzün gerçek biçimini kullanmak için.

## - Söyle.

`outputs/skill-benchmark-harness.md`İsterseniz bir kod tabanlı görev çiftini oluşturun. SWE-bench tarzında bir harness oluşturun.

## 练习

1. Bu oyuncak harnesini 移植 into a real repo 上运行(seçin kendi bir tane) ・・・ bilinen hatalar için 编写 3 个 FAIL_TO_PASS test。
2. 3 görevinin üstündeki her çözüme göre kaç ajan adım gerekiyor?
3. SWE-bench+ kağıdı okuyun. Çözüm-sızıntı kontrolü gerçekleştirin.
4. Bir GAIA sorusu var. GPT-4 sınıfı bir ajanı takip etmek için ne yapacağız?
5. 阅读 AgentBench'in çevre açısından ayrıntıları. Hangi çevre ürün yüzeyini gösterir?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| SWE-bench | “Code agent benchmark” | 2,294 个 GitHub issues；patch 必须翻转 FAIL_TO_PASS tests |
| SWE-bench Verified | “Clean SWE-bench” | 500 个由人工 curated 的 tasks，OpenAI |
| FAIL_TO_PASS | “Fix gate” | 之前 failing、patch 后必须 passing 的 tests |
| PASS_TO_PASS | “No-regression gate” | 之前 passing 且必须仍然 passing 的 tests |
| GAIA | “Generalist benchmark” | 466 个 human-easy / AI-hard 的 multi-tool questions |
| AgentBench | “Multi-env benchmark” | 8 个 environments；long-horizon multi-turn |
| Contamination | “Training-set leak” | benchmark tasks 出现在 model training 中 |
| SWE-bench+ | “Contamination audit” | 在 successful SWE-bench patches 中发现 32.67% solution leakage |

## 进一步阅读

- [Jimenez et al., SWE-bench (arXiv:2310.06770)](https://arxiv.org/abs/2310.06770) 原始 referans değer
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选子集
- [Mialon et al., GAIA (arXiv:2311.12983)](https://arxiv.org/abs/2311.12983) Genelist referans değerleri
- [Liu et al., AgentBench (arXiv:2308.03688)](https://arxiv.org/abs/2308.03688) 多环境 suite
