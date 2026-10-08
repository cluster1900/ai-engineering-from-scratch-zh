# Hogwild ile eşzamanlı ol!

> Spekülatör çözme (Fase 10) 15 tek bir dizi içinde gerçekleşecek. Inference(Rodionov et al., arXiv:2504.06261) başka bir şey de yapıyor:并行运行同一个LLM的 N 个实例,并让它们共享一个关键价值缓存──每个工人都可以立即看到其他工人生成的代币──现代推理模型QwQ、DeepSeek-R1无需任何细节调整,就能通过这个共享缓存自我协调── bu yöntem hala deneysel aşamada, ancak dedans paralelisminin tam yeni bir boyutunu açar, ayrıca, 精准解码和交交叉──本课使用 stdlib Python 实现一个双工人Hogwild! Simülatör,并解释为什么共存缓存合作 会从现有模型的推理能力 中涌现出来──

**类型：**Yapım
**语言：**Python (stdlib)
**先修：**10 · 12 aşama (inferans optimizasyonu), 10 · 15 aşama (spekülatör çözme)
**时间：**~ 60 dakika

## Öğrenme hedefi

- 描述三种常见的平行LLM topologileri(voting、sub-task、Hogwild!),并说明每一个针对的问题──
- Hogwild'in çekirdek ayarını anlatın: çok sayıda işçi, paylaşılmış bir KV cache, kendi kendini teşvik ederek, gelişmiş koordinasyonu gerçekleştirmek.
- İşçi sayısı göre`N`Görev düzeyinde paralellik`p`Koordinasyon genel maliyeti`c`Hogwild'in duvar zaman hızlandırması.
- Oyuncak sorunu, iki işçi Hogwild! simülatörü gerçekleştirmek, gelişen görev bölümü gözlemlemek.

## 问题

Modern LLM'ler                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

Speküel dekodlama (Fase 10) 15′) tek bir sırada içinde işlem yaparak 3-5x hızlanma getirebilir.

Açıkça sorunun şu olması: Bizler aynı sorunun üzerinde çalışarak aynı modelin birkaç kopyasını birlikte çalıştırıp, birbirine göre çalıştırıp dağıtabilir miyiz?

已有工作包括: oylama grupları(运行 N 个模型,选择多数答) 、思维树-分支出推理路并重新组合) 以及多代理框架(每个代理 分配子任务,并使用协调员)  这些都能在特定任务域中提供帮助──但它们也都将引入显式协调机械投票规则、分支和逻辑、代理-to-agent 信息通信协议──

Hogwild! Inference  farklı yöntemler kullanmıştır. N 个工共享一个KV缓存──每个工人都会立即看到其他工人生成的代币,就像这些代币已经在自己的背景中一样──工人在没有任何培训或细节调节的情况下,会自己弄清楚如何分工──现代推理模式 ((QwQ、DeepSeek-R1、Claude-family reasoning mode) 能够读取共享缓存,并说出类似我看到工人2 已经处理了基案,所以我来处理诱导步这样的话──

2026 yılına kadar hız, iş yüküne bağlıdır ve hala deneysel aşamada. Ancak bu fikir anlaşılabilir, çünkü sonuç paralelliğinin yeni bir boyutunu açmıştır.

## 概念

###  ayar

İlk olarak, tüm işçi süreçleri aynı LLM ile yürütülüyor. Çalışan başına KV kaydını kullanmayın, ortak bir kaydını koruyun.`i`生成 simgesi`t_j`Bu token, paylaşılmış cache'nin bir sonraki konumuna yazılacak.`k`执行下一步时,它读取缓存的当前状态 (Bunun içinde şu anda tüm N 个工人 生成的全部内容) ]]

Adım zamanında, işçiler belirtiler yazmak için rekabet edecekler. İşçi başına pozisyon endeksi yok.

### Neden koordinasyon gelişiyor ?

İşçiler 共享一个提示──通常类似于:Bu sorunun üzerinde birlikte çalışan N örneklerden biri olursunuz. Her örnek paylaşılan hafızayı okuyor ve diğer örneklerin ne yazdığını görebilir.

Hogwild! makalesi ((Rodionov et al., 2025) aşağıdaki gözlemleri rapor etti:

- İşçiler planlar hazırlayacak ve diğer işçilere aktarılacak şekilde kaydetmiş olacaklar.
- İşçiler diğer işçilerin akıl yürütme hatasından haberdar olurlar ve bu sorulara dikkat çekerler.
- İşçiler, planda başarısızlıktan sonra durumu karşılamak için alternatif öneriler sunar.
- İşçiler, işten çıkarılmayı denetlemeyi istediklerinde, işçiler, işten çıkarılmayı denetlemeyi ve diğer işlere yönelmeyi gerektiriyorlar.

Bunlar hiç ince ayarlama gerektirmez. Modelden gelen gelişmiş davranışlar, zaten sahip oldukları düşünme yetenekleri ile oluşmaktadır.

### 命名

Bu makale adı, Hogwild! SGD(Recht et al., 2011), bir asinkron güncelleme optimizeridir.

### RoPE  bunu yapabilmeye çalış

Rotary Position Embeddings(RoPE, Su et al. 2021) Q 和 K vektörleri arasında dönüşüm 编码 pozisyon bilgileri── çünkü pozisyonlar rotasyonlardır, sabitlenmiş taksitler değil, bu yüzden jetonların pozisyonu hareket edebilir, KV önbelleği girişini yeniden hesaplamama gerek yok── işçi olarak`i`写入 ortak cache 的位置 `p`Bu pozisyonun diğer çalışanları doğrudan önbelleğe alınan girişleri kullanır.

Öğrenilmiş pozisyon veya mutlak pozisyon modelinde, Hogwild! her eşzamanlı yazıda 时都需要缓存无效化──RoPE 让缓存 保持稳定──

### Duvar zamanı 数学

设 `T_serial`Bu işçi, sorunları tek başına çözmek için gereken zamanı kullanıyor.`p`Yapılacak seviyede paralelleştirilebilir bir kırıklık.`c`Bu, bir adım koordinasyon üst ücreti.

Tek çalışan için zaman:`T_serial`- Evet.
Eğer koordinasyon ücretsizse, N-işçi Hogwild! zaman için:`T_serial * ((1 - p) + p / N)`Bu klasik Amdahl.
加入 koordinasyon genel maliyeti 后:`T_serial * ((1 - p) + p / N) + c * steps_per_worker`- Evet.

İşçiyi üretken yapsın diye,`c`必須 足夠小的每步解码時間 足夠小的. 5k+ token üretimi için mantıksal modeller için, işçiler yüzlerce token koordinasyon üstü maliyetini karşılayabilir ve hala önde gelebilir.

###  Konkreti örnekler

Dönüşüm sorunu:10k tokens ⋅ düşünce zinciri ⋅ varsayım sorunu ⋅`p = 0.7`Bu nedenle, farklı kanıt stratejileri, farklı durum analizleri ve her çalışanın koordinasyon genel maliyeti`c = 200`Tokens。 kullanım `N = 4`İşçiler:

- Seri süresi: 10000 dekode adımları。
- Hogwild! zaman: 10000 * (0.3 + 0.7 / 4) + 200 * 4 = 10000 * 0.475 + 800 = 5550 dekode adımları。
- Hızlılık: 10000 / 5550 = 1.8x

Bu sadece ortalama kazançlar. Ama daha uzun akıl sorunlarında koordinasyon üstü giderek azaltılır. Hızlılık 2.5-3x ilerler. Hogwild!

### Hogwild'i kullanmaya ne zaman?

- 长 理性问题 (Million tokens), bu görevler bağımsız alt hedefler üzerinden geçebilir ve gerçekleşebilir.
- 已被训练为步骤思考的推理模型──非推理模型──不能很好地自我协调──
- Tek düğüm dağıtımları, ve yeterince VRAM  paylaşılmış kaydı toplamak 个 işçi süreçleri 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个

### Ne zaman kullanmıyorsun ?

- 短交互式聊天──协调上海 会占主导──
- 无法并行化任务(单一线性证明、单一编译) ――N=1 是上限──
- Akılsızlık modelleri, koordinasyon ortaya çıkmaz.
- Çoklu düğüm dağıtımları── paylaşılan kaş  çok hızlı çapraz işçi senkronizasyonu gerekir──Intra-nodı olabilir; çapraz düğümleşmek latensi felaket olacaktır──

### 实验 durumu

截至2026年4月,Hogwild! bir araştırma yöntemi,并有开源 PyTorch uygulaması── henüz üretim kabulü ortaya çıkmamıştır──三个阻碍因素:

1. 跨同步流程 管理 shared KV cache 非平凡的工程问题──
2. Çözümsel koordinasyon göreve bağlıdır; değerler hala inşaatdadır.
3. İsteğe bağlı çözme ılgınlığı ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ılgınlık ıl ıl ılgın ılgın ılgın ılggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg

Bilmeye değer. Denemeye değer. Ürünleri üzerinde koymaya değer.


```figure
continuous-batching
```

## Yapın onu.

`code/main.py`Bir oyuncak gerçekleştirmek Hogwild! Simülatör:

- İki işçi süreci, her biri kesin bir LLM, bilinen bir olasılıkla birkaç tip belirti üretir.
- Bir ortak cache, sadece bir token listesi, iki işçi okumayı ve yazmayı başlatıyor.
- Bir basit koordinasyon mantığı: Bir işçi başka bir işçiyi görürse, bir kategoride yeterli iş belirtileri ürettiğinde, farklı kategorileri seçecektir.

Simülatör, belirlenmiş bir adım bütçesinde çalışırken rapor ediyor:

- 总数──
- 总 duvar zamanı(işçi adımları 数量)。
- Tek çalışanın etkin hızlandırılması için.
- Hangi işçi hangi işaret izini yazdı?

### 步骤1: paylaşılan önbelleği

Bir iki işçi şehir ekleme listesi.`threading.Lock`Burada biz karşı karşı kullanıyoruz.

### 步骤 2: İşçi döngüsü

Her işçi, her adım:

- 读取当前 paylaşılan cache。
- İçinde bulunanlara göre hangi tür bir simge yazılması gerektiği belirlenmiştir.
- Bir işaret yazın.

### 步骤 3:Koordinasyon heuristik

Eğer kategori X'de cache içinde zaten K 个 token varsa ve işçi orijinal olarak yazmayı düşünmüşse kategori X ise işçi Y'ye geçecek. Bu bir oyuncak olarak kullanılır.

### 4 adım: Ölçüm hızlandırılması

Bölüm: N=1 işçi ve N=2 işçi 运行模拟器, aynı toplam aşama bütçesi kullanılarak 统计产生的工作标志──由于协调驱动任务分区,N=2 应该产生约1.5-1.8x 的工作标志──

### 5 adım: Koordinasyon

降低协调的敏感性──再运行──观察如果没有良好的协调,N=2 会有余空间产生相同的代币,速度会下降到以下1──这与纸的观察一致:

## Kullan

截至 2026年 4 月,Hogwild! entegrasyonu üretim sırasında hala araştırma derecesi──Yandex/HSE/IST referans uygulaması 基于PyTorch,目标是DeepSeek-R1 和 QwQ modeller 上的单节点多进程设置──

务实的采用路径:

1. Profil, Senin düşünce-iş yükü, ölçüm tokens İçinde araştırmacı, çoklu stratejiler, vaka analizleri, arama) ve doğrusal oranlar.
2. Eğer keşif yaparsanız, Hogwild! deneyini yapın. Duvar zamanını ölçün.
3. Eğer gelişme 1.3x'ten düşükse, koordinasyon baskın rejimde olduğunuzu gösterir. Tek çalışanlara geri dönersiniz.
4. Eğer gelişme 1.5x'den fazla ise, N=4'e kadar ilerleyip tekrar ölçülür.

组合: her Hogwild! işçisi bağımsız olarak spesifik dekode kullanılabilir.

## - Söyle.

本课会生成 `outputs/skill-parallel-inference-router.md` Bir akıl yürütme iş yükü profili belirlenir.  token bütçesi  görev paralelliği profili  model ailesi  dağıtım hedefi  oylama  düşünce ağacı  çoklu ajan  Hogwild! ve spekülatif dekodlama stratejileri  arasında yürütülür.

## 练习

1. 使用默认设置运行 `code/main.py`▽ aynı duvar zamanında onaylayın 内,N=2 Hogwild! yapılandırması N=1 temel çizgi  daha fazla iş iş belirtileri üretmek ▽

2. 降低协调 heuristic 的强度(設定 `coordination_weight=0.1`)。 yeniden çalışmak。 göstermek hızlanmak  çöküş── açıklama nedenleri: İşçiler  koordinasyon yapamıyorsa, onlar tekrar çalışıyorlar。

3. 50k-token akıl yürütme görevini hesaplayın`p=0.8, c=500`且 N=4 işçi 时的预期 Hogwild! hızlandırılması──再对对一个1k-代币聊天任务在 `p=0.3, c=200`Ve N=4'de aynı hesaplama yapın. Neden biri kazanç, diğeri zarar?

4. Hogwild! makalesinin 4. bölümüne bakın. Ön değerlendirme.

5. Oyuncak içinde Hogwild! spekülatif dekodlama 组合: her işçi 内部 2 token speci-decode kullanıyor.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Hogwild! | “Parallel workers, shared cache” | 同一个 LLM 的 N 个 instances 并发运行，并共享一个 KV cache；通过 self-prompting 实现 emergent coordination |
| Shared KV cache | “The coordination medium” | 一个不断增长的 KV buffer，所有 workers 都会读取和写入；让 tokens 能在 workers 之间立即可见 |
| Emergent coordination | “No training needed” | 具备 reasoning 能力的 LLMs 可以读取 shared cache，并在没有任何 fine-tuning 或显式 protocol 的情况下分工 |
| Coordination overhead (c) | “Tokens spent orienting” | 每个 worker 读取扩展后的 cache 并决定下一步做什么的成本；相对于总 decode time 必须保持较小 |
| Parallelizable fraction (p) | “What can run in parallel” | Task-level parallelism：总工作中并非内在 sequential 的比例 |
| RoPE enables Hogwild! | “Rotary positions are shift-invariant” | 因为 positions 是 rotations，写入 shared cache 不需要重新计算之前的 tokens |
| Voting ensemble | “Run N, pick the majority” | 最简单的 parallel inference topology；适用于 classification，对 long-form reasoning 帮助较小 |
| Tree of thought | “Branch and prune” | 探索多个 branches 并进行 pruning 的 reasoning strategy；使用显式 coordination logic |
| Multi-agent framework | “Assign sub-tasks” | 每个 agent 获得一个 role；由 coordinator 编排；protocol overhead 很重 |

## 延伸阅读

- [Rodionov et al. — Hogwild! Inference: Parallel LLM Generation via Concurrent Attention (arXiv:2504.06261)](https://arxiv.org/abs/2504.06261) Hogwild! makalesinde, QwQ ve DeepSeek-R1'in ön değerlendirmesi
- [Recht, Re, Wright, Niu — Hogwild!: A Lock-Free Approach to Parallelizing Stochastic Gradient Descent (arXiv:1106.5730, NeurIPS 2011)](https://arxiv.org/abs/1106.5730) 原始 Hogwild!,名称来源
- [Su et al. — RoFormer: Enhanced Transformer with Rotary Position Embedding (arXiv:2104.09864)](https://arxiv.org/abs/2104.09864)RoPE, paylaşılan kası sonuçlarını uygulanabilir hale getirir
- [Yao et al. — Tree of Thoughts: Deliberate Problem Solving with Large Language Models (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) Düşünce ağacı düşünce stratejisi, Hogwild!
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) spekülatör çözme, Hogwild!
- [Hogwild! reference PyTorch implementation](https://github.com/eqimp/hogwild_llm)Kağıt deneylerinin tek gerçek kaynağı
