# LLM Üretim Kaos Mühendisliği

> 2026 yılına kadar, LLM'lerin Kaos Mühendisliği yönünde bir bağımsız uygulama haline gelmiştir. Üretim içinde çalışma çalışmalarının ön koşulları: Defined SLI/SLO izleme+metrik+log gözlemliliği、 otomatik devreye dönme、ezdirme defterleri、 çağrıda bulunma Arkitektür dört düzeyde vardır: kontrol eksperim programcısı; hedef servisler infra veri depoları güven koruyucuları avort + trafik filtreleri observability metrikler  izleme  logları feedback  SLOye girme Guardrails strong requirement: ChaChaChaburn günlük hatası- bütçe  2x  burn-alert interim deneyi ; suppression  trace-alert   koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu  koruyucu 

**类型：**Öğrenme
**语言：**Python, oyuncak kaosu deneyi koşucu)
**前置条件：**17 · 23(SRE için AI),17 · 13
**时间：**60 dakika kadar .

## Öğrenme hedefi

- Beş Kaos Mühendisliği Ön Ön Ön Önlem Şartları (SLI/SLO、observability、rollback、runbooks、on-call), ve neden herhangi bir atlamanın bu uygulamayı bozacağını açıkladı.
- Dört düzlem çizim: Kontrol, hedef, güvenlik ve gözlemlenebilirlik ve SLO'nun geri bildirim döngüsüne girmek.
- 枚举五个LLM-specifik deneyler(hüye hafıza aşırı yük, ağ başarısızlığı, tedarikçi kesintisi, yanlış işlenmiş bir sürpriz,KV tahrip fırtınası)
- 根据堆 选择工具  Harness、LitmusChaos、Chaos Mesh──

## 问题

传统堆中的混沌测试 已经很成熟──LLM堆增加了新的失败模式──一个带有毒字符的4K-token提示 会让代币器卡住 12秒──上游提供商 返回 429;你的门户网 进行重复试验;你的服务 因重复加大同步而而OOM──爆载下的KV缓存驱逐风暴将导致重复填充,进而耗尽计算──

Bunlar birim testlerinde ortaya çıkmaz. Chaos Mühendisliği, kullanıcılarla karşılaşmadan önce onları bulma yöntemidir.

## 概念

### Ön koşul

Eğer aşağıdaki bir şey yoksa, üretimdeki kaosdan kaçın:

1. **SLI/SLO** 已定义的服务水平指标和目标──
2. **Observability** izler, metrikler, kayıtlar,并连接到仪表板──
3. **Automated rollback** 17 · 20 aşama politika bayrağı geri dönüşü
4. **Runbooks** strukturizasyon, 17 · 23..
5. **On-call** Kimsenin sorumluluğu vardır.

Hiçbir şey eksik kalmaz, kaos gerçek bir olay olur.

### Dört uçak + geri bildirim

**Control plane** deney programcısı(Litmus iş akışı、Chaos Mesh programı、Harness UI)。

**Target plane** hizmetler,podlar, düğmeler, yük dengeleyici, veri depoları

**Safety plane** öldürme anahtarı, baskı pencereleri, patlama radyüsü sınırları, hata bütçe kapıları,

**Observability plane** 常规 metrikler + iz-ID korelasyonu, bölgeye kaos ve doğal hatalar neden olan başarısızlıkları kullanılır。

**Feedback loop** 发现结果反到 SLO ayarlama, 跑本更新, kod düzeltmeleri

### Koruma rayları zorunlu bir talep .

- **Burn-rate alert**Günlük hata bütçesi beklenenin 2 katını aşarsa, deney durdurulur.
- **Suppression windows**: deney sırasında, patlama radyosunda iç sessizlik olmayan deney uyarıları
- **Trace-ID correlation**Tüm deney hatası bir etiket taşımaktadır.

### 五个 LLM özel deneyler

1. **Memory overload**                                                                                                                                                                                                                                                              

2. **Network failure** 切断推断 gateway与供应商之间的连接──观察:fallback 是否在SLA内生效?

3. **Provider outage simulation** OpenAI 100% 返回 429──观察:routing 是否 failover到Anthropic?

4. **Malformed prompt** 注入会让代码符号机卡住的 payload (örneğin derinleşmiş bir kod, büyük bir UTF-8 kod noktası) 观察:单个请求 是否会锁死一个工人?

5. **KV eviction storm**Blok bütçesi ile tüm evlerin boşaltılması zorunlu olacak.

### Cadence

- **每周**                                                                                                                                                                                                                                                              
- **每月** 针对特定场景 安排游戏日;跨团队参与;死后――
- **每季度** ekipler arası dayanıklılık denetimi; bağımlılık haritasının güncelleştirilmesi。

### Araçlama

- **Harness Chaos Engineering** 商业工具;AI'den kaynaklanan deney önerileri; patlama radyüsünün azaltılması;MCP aletlerinin entegrasyonu。
- **LitmusChaos** CNCF mezun; Kubernetes çalışma akışına dayanmaktadır。
- **Chaos Mesh** CNCF kum kutusu;Kubernetes-devli CRD 风格。
- **Gremlin** 商业工具; geniş destek
- **AWS FIS**- Ne ?**Azure Chaos Studio** yönetilen bulut sunuşları。

### Küçük bir başlangıçtan

İlk deney: stabil flux altında bir pod-kill bir dekod replikası── gözlem yeniden yönlendirme ve kurtarma── eğer çalışır ve güvenli görünüyorsa, ağ kaosuna yükseltmek için.

İlk LLM özel deneyi: bir kez 429 sunucuye enjekte edilmek, 5 dakika sürer.

### Hatırlamalı olduğun bir sayı var.

- Dört düzlem: kontrol, hedef, güvenlik, gözlemlenme.
- Yakma oranı duraklama: Önceki günlük bütçe yakma ̆ 2x ̆
- Cadence: haftalık kanarya, aylık oyun günü, çeyreklik denetim.
- 5 LLM deneyi: hafıza, ağ, sağlayıcı, yanlış düzenlenmiş bir sürpriz, KV fırtınası.


```figure
i4-chaos-guard
```

## Kullan

`code/main.py`Güvenlik uçak kapıları kullanın 模拟三个混乱实验──報告哪些实验 会触发燃烧率中断──

## - Söyle.

本课会生成 `outputs/skill-chaos-plan.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                    

## 练习

1. 运行  İşlem`code/main.py`Hangi deney yanma oranı kapısını açtı, neden?
2. VLLM tabanlı bir RAG hizmeti için, ilk beş kaos deneyimi tasarlandı.
3. Bir deneyi durdurduğunuzu nasıl anlayacaksınız?
4. 论证 kaos  Production içinde çalışmalı mı, yoksa sadece stage içinde çalışmalı mı?
5. Üç genel ağ kaosu  LLM-sözlü başarısızlık modunun tekrarlanamayacağı

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| SLI / SLO | "service targets" | Indicator + objective；必需前置条件 |
| Blast radius | "scope" | 受 experiment 影响的 services / users 集合 |
| Burn-rate alert | "budget gate" | 当 error-budget burn rate > 预期的 2x 时触发 |
| Game day | "monthly drill" | 计划好的 cross-team chaos exercise |
| LitmusChaos | "CNCF workflow" | Graduated CNCF Kubernetes chaos tool |
| Chaos Mesh | "CNCF CRD" | CNCF sandbox Kubernetes-native chaos |
| Harness CE | "commercial AI-assisted" | 带有 AI recommendations 的 Harness chaos |
| Malformed prompt | "tokenizer bomb" | 会让 tokenization 卡住的输入 |
| KV eviction storm | "preemption cascade" | 大规模 eviction 触发 re-prefills |

## 延伸阅读

- [DevSecOps School — Chaos Engineering 2026 指南](https://devsecopsschool.com/blog/chaos-engineering/)
- [Ankush Sharma — Observability for LLMs（书）](https://www.amazon.com/Observability-Large-Language-Models-Engineering-ebook/dp/B0DJSR65TR)
- [LitmusChaos（CNCF）](https://litmuschaos.io/)
- [Chaos Mesh（CNCF）](https://chaos-mesh.org/)
- [Harness Chaos Engineering](https://www.harness.io/products/chaos-engineering)
- [AWS FIS](https://aws.amazon.com/fis/)
