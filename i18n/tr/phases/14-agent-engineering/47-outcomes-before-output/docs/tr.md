# Seçim çıkıştan önce önce sonuç tanımlanır

> 飞速的代码实现能力反而增加了选错问题所付出的代价──唯有先厘清所追求的实质成效──结果),高速前进才能指向正确方向──

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** None
**Time:** ~60 分钟

## Öğrenme hedefi

- Bu konuda, belirli çözümlerin öngörülmesinde, sonuç çerçevesini yazmak.
- Açık hedef kullanıcılar, durumlar, mevcut durumlar ve gelişme beklenenler.
- 显式声明硬性约束 (Kısıtlamalar)
- 识别解决方案泄漏(Solution Leakage), geliştirme kapsamına erken bir şekilde çökmesini önlemek için

## 交付产品不等于实质成效

 Bir felç acil yardımcısı inşa etmek  sadece bir ürün output  belirtilir.  Bu, kimlerin buna ihtiyacı olduğunu, hangi belirtilerin iyileştirilmesi gerektiğini ve hangi anahtar güvenlik korunması gerektiğini tam olarak açıklamıyor.

Buna göre, sonuç çerçevesinde (Result Frame) şöyle ifade edilir:

> Üretim ortamı rapor edildiğinde, işçi mühendisi iki dakika içinde bir hata hizmeti belirleyebilir ve sonraki güvenlik işlemini doğrulayabilir.

Bu cümle tarafından tanımlanan sonuçlar, bir yazılım kümesi ile gerçekleştirilebilir, bir çalışma kitabı (runbook) ̳ı iyileştirerek veya daha hafif bir interfese dönüşümü yaparak elde edilebilir.

## Çevreye yönelik 6 büyük unsur

| 构成要素 | 核心问题 |
|---|---|
| 用户（User） | 谁在直接面对并承受该问题？ |
| 情境（Situation） | 该问题何时、何地发生？ |
| 当前现状（Current behavior） | 现状如何运作，包括现有的各种临时变通手段（Workarounds）？ |
| 期望成效（Desired outcome） | 哪些可观测的状态应当得到实质改善？ |
| 约束条件（Constraints） | 哪些安全、策略、成本或兼容性底线是固定的？ |
| 非目标（Non-goals） | 哪些极具诱惑但相关的邻近工作被明确排除在外？ |

```mermaid
flowchart LR
  U[用户与情境] --> C[当前现状]
  C --> O[期望成效]
  O --> K[约束条件]
  K --> N[非目标]
  N --> E[证据探究问题]
```

## 识别解决方案泄漏

Sonuçlar açıklamalarında, yetmez kanıtların tam olarak kanıtlanmış ürün biçimi, arayüz biçimi, model seçimi, teknik çerçeve veya alt yapı ile sonuçlandığında, çözüm sızması meydana geldi:

-  kullanıcı haftada bir AI özetini aldı:  sızdırıldı  özet  bu biçim ve  haftada  bu sıklıkta 
-  kullanıcılar onaylanmadan önce hesap değişimini doğru anlamaya devam edebilmektedir:
- 部署向量数据库: 漏漏了基础设施选型──
-  Auditing period能够便捷获取相关合规政策依据:表述是真正的能力提升──

Eğer mevcut sistem ve uyum gerçekten bir teknolojiyi kilitlediğinde, bu teknolojiyi bir sınırlama şartlarından birinde adlandırılabilir, ancak kilitlenmesinin objektif nedenlerini açıkça kaydetmelidir.

## 约束条件守护成效底线 约束条件守护成效底线 约束条件守护成效底线 约束条件守护成效底线 约束条件守护成效底线 约束条件守护成效底线

束条件绝对不是单纯实现细节,它们是真世界目标不可分割的组成部分:

- İhtiyaçlı bir işlev için gerekli düzenlemeler yapılması için;
- 应用时间必须控制在事故处置时间预算内;
- ), mevcut denetim olayları kayıtları tek yetkililiği sürdürmek zorundadır;
- Yeni bir operasyon süresi açılmasına izin verilmiyor;
- 无障碍访问(Amanışlılık) destek iyi şekilde sürdürülmelidir.

Eğer bir sistem, görünüşte beklenen hedefe ulaşmış olsa da, herhangi bir zorlukla karşı karşıya kalırsa, o zaman sistem tamamen başarısız olur.

## Hedefsiz sınırları belirlemek

İyi hedefler, küçük ve pratik bir işlev parçası geniş bir platform haline gelmesini etkili bir şekilde önleyebilir. İyi hedefler, yeterince spesifik, yeterince sağlam ve net bir şekilde, ihtiyaçları reddetmek için yeterli olmalıdır:

- Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not:
- Yeni bir haber haber sistemi yapmazlar.
-                                                                                                                                                                                                                                                               
- Bu bölüm, tarihsel veri analizi fonksiyonuna bağlı değildir.

## Yapın onu.

Bu ders deney programı bir ders deneyi.`OutcomeFrame`Yapılacak sonuç yazılacak.`outputs/outcome-frame.json`- Evet.

运行命令:

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

尝试将期望成效修改为使用故障应急助手──校验器应敏地指出: önerilen ürünlerin gerçekleşmiş bir şekilde sızdırıldığını belirtmek gerekir──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

## 练习

1. Bu projenin bir fonksiyon gereksinimini standartın başarısı çerçevesine yeniden yazmak için bekleme listesi (Baclog)
2. 添加一条                                                                                                                                                                                                                                                             
3. 添加两条能够确保首发片保持精简的非目标──
4.                                                                                                                                                                                                                                                               
5. 构想三种完全不同,但都能满足相同的成效定义的产品形式──

## 延伸阅读

- [Nuseibeh and Easterbrook, Requirements Engineering: A Roadmap](https://www.cs.toronto.edu/~sme/papers/2000/ICSE2000.pdf): Gerçek dünya hedeflerini yazılım mühendisliği'nin temel düşüncesi olarak araştırmak.
- [Dardenne, van Lamsweerde, and Fickas, Goal-Directed Requirements Acquisition](https://doi.org/10.1016/0167-6423(93)90021-G): Yüksek sınıf hedeflerinin nasıl aşamalı olarak operasyonel bir bağ ve belirli bir kurallara ayrıntılı olarak ayrıntılı hale getirileceğini açıklamak.

## 交付物与沉

Lütfen iyice koruyun .`outputs/outcome-frame.json`❖ Next Section Dersler insanların gerçek iş süreçlerini kontrol ederek kontrol eder.
