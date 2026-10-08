# Agent 经济、Token  teşvik、suç

> 长周期 özerk ajanlar (METR'in 1 小时到 8 小时工作曲线)**5-layer stack**Evet:**DePIN**(fiziksel hesaplama) →**Identity**(W3C DID + 声誉资本)→ **Cognition**(RAG + MCP)→**Settlement**(Hesaba çekimi) **Governance**(Agentik DAO) ―― üretim sınıfı ajan teşvikleri 网络包括 **Bittensor**(TAO alt ağları  ödüllendirme görev-sözlü modeller)**Fetch.ai / ASI Alliance**(ASI-1 Mini LLM + FET token)**Gonka**(Transformer tabanlı PoW, yeniden üretim değerli AI  görevlerine dağıtılacak)**Shapley-value credit attribution**Google Research'ın büyük dil modelleri için bir mekanizma tasarımı  monoton bir toplama içinde ikinci fiyat ödemeyi kullanarak önerilen **token auctions**△本课会构建一个最小代理市场,将Shapley-value credit attribution 应用于多代理管道,并运行第二价代币拍卖,让游戏理论 机制具体落地──

**Type:** Learn
**Languages:** Python (stdlib)
**前置要求：**16 · 16(Tarih ve Tartışma),16 · 09
**Time:** ~75 分钟

## 问题
Agentler  birlikte değer yaratırken ‒ ama ayrıca ayrı ayrı ödüllendirilmek zorunda kalırken, çoklu ajan sistemleri karmaşıklaşır. Ortalama dağılım gibi klasik mekanizmalar, en son katılımcıların tümünü, ya da adil olmayan, ya da kolayca manipüle edilebilen bir şekilde ele geçirmek için ‒ Shapley değerleri ile ‒ birliğe dayalı ödüllendirme yapılırken, yapısal olarak adil, ancak hesaplama maliyeti yüksek. ‒ 2025-2026 yıllarındaki yayınlar pratik yaklaşımları teşvik etti: Shapley örnekleme ‒ monoton birleştirme açıklamaları, ve onaylanmış katılımlardan birikmiş zincir üzerindeki itibarı ‒

Kredi tahsisinden başka, bu alan gerçek ekonomik ajanlara dönüştü:Bittensor TAO  ödül madencilik hesaplama, ince ayarlı alt ağ-sözlü modeller;Fetch.ai/ASI FET tokenleri ile ödül ASI-1 Mini LLM kullanımı;Gonka iş kanıtı yeniden üretim değerli bir AI  görevlerine dağıtılacak.

Bu ders, ajan ekonomilerini 视为一个具体问题族:kredit atributı、机制 tasarım和声誉,并使用最小数学构建每一部分,让概念真正留下来――

## 概念
### 5 katmanlı ajan-ekonomik yığın

1. **DePIN（physical compute）。**Git merkezi altyapı, GPU'yu kiralamak için kullanılır ]], depolama ]], genişlik ]], Bitensor alt ağları ]], Render Network 、 Akash ̳; bu, ajanlara ait değildir; ajanlar kullanmaktadır ̋.
2. **Identity。**W3C Merkezi tanımlayıcıları (DID) her ajanı birleştirir.
3. **Cognition。**Agent'in akıl döngüsü:LLM + RAG + MCP。 bu diğer aşamaların 构建的内容。
4. **Settlement。**Hesap soyutlama ((ERC-4337) Ajanların kendi eksiklerinden gaz ödeyebilmelerine izin vermesi için ETH'leri tutmak zorunda kalmazlar. Ajanlar hizmet için, birbirlerine veya hesaplama için 支付费を支払うことができる.
5. **Governance。**Ajantik DAO: İnsan ve ajanlar tarafından bir araya getirilen protokol değişiklikleri 投票的治理结构,投票权与声誉绑定──

Bu, bir istatistik olarak kullanılır. Bu, bir istatistik olarak kullanılır.

### Bittensor、Fetch.ai、Gonka: Gerçekte çalışan şeyler

**Bittensor（TAO）。**Alt ağlar özel görevlerdir ([[dilli modellerleme]], görüntü üretimi]], tahmin) ――Minerler  model çıkışlarını gönderir。Onların sıralanması için değerlendirici; pay ağırlanan puanlama; TAO ödüllerini paylaşmak。 her alt ağın kendi değerlendirme yöntemleri vardır。

**Fetch.ai / ASI Alliance。**ASI-1 Mini LLM 运行在 Fetch.ai'nın ağında; kullanıcılar FET tokenleri kullanarak 支付推理费用──这里代理人如同伴的叙述更强:Fetch 上的一个代理可以调调用另一个代理 完成任务,并使用 FET 付款──

**Gonka。**Transformer proof-of-work:work is transformator's forward passes──miners 通过运行具有已知正确输出(来自训练数据) 的推断任务 来获利──它是资源生产的PoW,而不是基于哈希的PoW──

2026 yılının 4 ayına kadar, bu üçü de üretim derecesi olarak görülüyor.

### Shapley değeri kredi atributı

Üç ajan bir görev tamamlamak için işbirliği yaptı. 0.8 puan çıkardı.

Şapley değeri: satis dört yöntemi: verimlilik, simetri, doğrusallık, sıfır) için tek kredi tahsis edilmesi`i`- ...

```
shapley(i) = (1/N!) * sum over all orderings O of (v(S_i_O ∪ {i}) - v(S_i_O))
```

İçlerinden `S_i_O`Evet , evet .`O`İçinde yer alan`i`之前的代理 集合──实践中:枚举所有 permutations,记录每个代理 在每个 permutation 中的边际贡献,然后取平均──

N=3 ajan için 6 permutasyon vardır. N=10 için 3,6M vardır.

### Toplantı ikinci fiyat müzayede için kullanılır

Google Araştırmaları (Google Research) büyük dil modelleri için bir mekanizma tasarımı) ikinci fiyatlı token müzayedeleri kullanarak LLM ürünlerini birleştirmek için önermiştir.

Bu LLM sistemleri için çok önemlidir: görevleri tamamlamak için birçok farklı fiyatlı ajanlara dışa bağlayabilirsiniz; müzayede en iyi çözümleri seçin ve adil ödeme yapın, ajanlar yanlış bildirilmeyen teşvikler sağlarlar.

### İsimlik sermayesi

DID'in itibar puanını belirle:

```
rep(i, t+1) = alpha * rep(i, t) + (1 - alpha) * contribution_quality(i, t)
```

Bu da bir çöküş faktörü .`alpha`接近 1―İtiraf:

- Yollama kararları için düşük maliyetli eğitim için yüksek temsilcilere zorlu görevler göndermek.
- 偽造成本高 (zamanla birlikte toplanıp, bağlanıp kurtuldu)
- Kesilmek için:未经验证的贡献会扣分──

### AAMAS 2025 Decentralize LaMAS

LaMAS 提案(AAMAS 2025) birleştirdi:DID kimliği,Şapley değeri kredi atributı, ve basit bir açıklama mekanizması.

### Ekonomik mekanizma nerede çöker?

- **Price oracle manipulation。**Eğer kredi fonksiyonu kontrol edilebilirse, ajanlar kontrol edecektir. Her bir mekanizmanın bir karşılaşma testi gerekecektir.
- **Sybil attacks。**Bir operatör  N 个假代理 个资助者 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个代理 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 
- **Verification cost。**Kredi tahsisinin adilliği, doğrulayıcıya bağlıdır. Eğer doğrulama 便宜(小 LLM), o da manipüle edilebilir. Eğer pahalı ise sistem genişleyemez.
- **Regulatory overhang。**Agent ekonomileri ve finansal gözetimleri arasında. 2026 yılına kadar, bazı yargı bölgelerinde Bittensor、Fetch 和 Gonka, kanun boz topraklarında yer alıyor.

### Ne zaman ajan ekonomileri anlamlı

- **具有异构 operators 的开放网络。**Tüm ajanları tek bir ekip kontrol etmiyor.
- **可验证输出。**Verifikasyon yok, kredi veriliyor. Sadece tahmin ediliyor.
- **Long-horizon workflows。**Bir dönem görev, ün birikimiyle yararlanamaz.
- **Tokenized payments 在你的司法辖区合法可行。**

Kapalı işletme sisteminde, ekonomik mekanizmalar daha basit bir dağıtım yöntemini ortaya çıkarır.


```figure
swarm-auction
```

## Yapın onu.
`code/main.py`实现:

- `shapley(value_fn, agents)` 通過枚举为小 N 精确计算 Shapley。
- `second_price_auction(bids)`Gerçek bir mekanizma; kazanan ikinci en yüksek ödemeyi yapar.
- `Reputation` 绑定 DID、带指数式衰退 和 削削的声誉──
- Demo 1: Üç ajan 协作, tam Shapley 归因信用──
- Demo 2: Beş ajan bir görev yuvası için Çıkış fiyatı; ikinci fiyat açık artırması  Seçim kazanan + ödeme
- Demo 3:100 ırk görevleri farklı yapılandırmalarla temsilcilere dağıtılır; rep ağırlıklı yönlendirme 优于随机──

运行:

```
python3 code/main.py
```

预期输出: her ajanın Shapley değerleri; gerçek teklif dengesi açık artırma sonuçlarını göstermek; ısınma sonrası rep- ağırlıklı yönlendirme göstermek 随机相比有 10-20% kalite kazancı──

## Kullan
`outputs/skill-economy-designer.md`设计一个最小代理经济:identity layer 选择、信用配属机制、支付机制、声誉规则──

## - Söyle.
2026 yılında, bir ajan ekonomisi:

- **从 reputation 开始，而不是 tokens。**Ünlülik  düşük maliyet, tek başına değer elde etmek; belirtiler yasal ve ekonomik karmaşıklığı artıracaktır.
- **奖励前先验证。**Özgür bir doğrulama olmadan kredi dağıtmayın.
- **使用 Shapley-sample，而不是 Shapley-exact。**采样 100-1000 个订单;精确枚举无法扩展──
- **限制 decay factor，并设置 reputation floor。**无界衰退 会抹抹合法贡献者;过慢衰退 会奖励过时的高代表代理──
- **以 adversarial 方式审计机制。**Bu oyunların her birinde oyun teorisi vardır. Bu saldırganın yerine bir hata bulmak gerekir.

## 练习
1. 运行  İşlem`code/main.py`△ Shapley değerlerini 之和等于总值 (tüm değer) △ verimlilik aksiomu) △ değer fonksiyonunu değiştirmek;Shapley tahsisleri 之和等于总值 (→shapley) 之和等于总值 (→shapley) 之和等于总值 (→shapley) 之和等于总值 (→shapley) 之和等于总值 (→shapley) 之和等于总值 (→shapley) 之和等于总值 (→shapley) 之和等于总值 (→shapley) 之和等于总值 (→shapley) 之和等于预期方向变化?
2. 实现 Shapley *sampling*(在 K 个命令上蒙特卡罗) ――K 如何影响近似精度?与 N=4 的精确结果比较──
3. Bir teklifte birleşmek için bir takım oluşturmak için birleştirilen ajanlar için birleştirilmek için yapılan bir müzayede.
4. 阅读Google Research'ın mekanizma tasarımını 文章;; bir kez ihlal edildiğinde doğruluğu bozacak bir varsayım bul. LLM'de bu başarısızlık modunun nasıl bir biçimi vardır?
5. 阅读AAMAS 2025 去中心化 LaMAS 论文──在一个合成任务上上为10个代理 实现其中的Shapley 步骤──精确计算 需要多长时间?用100次绘画 采样能有多接近?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| DePIN | “Decentralized physical infrastructure” | Token-incentivized compute/storage/bandwidth。Bittensor、Akash、Render。 |
| DID | “Decentralized identifier” | 用于 portable IDs 的 W3C spec。Agent reputation 绑定到 DID，而不是平台。 |
| ERC-4337 | “Account abstraction” | 可以 sponsor gas 的 contract accounts，从而支持 agent payments。 |
| Shapley value | “Fair credit attribution” | 满足 efficiency、symmetry、linearity、null 的唯一 allocation。 |
| Second-price auction | “Vickrey auction” | 真实机制：winner 支付 second-highest bid。与 monotone aggregation 兼容。 |
| Reputation capital | “Accumulated quality score” | 来自已确认贡献、绑定 DID 的 score；会随时间 decay。 |
| Agentic DAO | “Agents + humans govern” | 把 agent voters 作为 first-class、投票权绑定 reputation 的 DAO。 |
| TAO / FET / GPU credits | “Token denominations” | Bittensor TAO、Fetch.ai FET、各种 DePIN tokens。 |

## 延伸阅读
- [The Agent Economy](https://arxiv.org/abs/2602.14219)2026 yılında 5 katmanlı ajan-ekonomik yığınla ilgili genel bilgi
- [Google Research — Mechanism design for large language models](https://research.google/blog/mechanism-design-for-large-language-models/) 带 monoton birleştirme simgesel açık artırmalar
- [AAMAS 2025 — decentralized LaMAS](https://www.ifaamas.org/Proceedings/aamas2025/pdfs/p2896.pdf) Shapley değeri kredi atributı
- [Bittensor TAO documentation](https://docs.bittensor.com/) Alt ağ yapısı
- [Fetch.ai / ASI Alliance](https://fetch.ai/) ASI-1 Mini LLM ve FET token
- [W3C Decentralized Identifiers (DIDs) spec](https://www.w3.org/TR/did-core/) Kimlik Temel
