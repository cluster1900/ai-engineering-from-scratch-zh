# CAIS、CAISI ve sosyal ölçek riskleri

> CAIS, San Francisco, Hendrycks ve Zhang tarafından 2022 yılında kurulan) dört risk çerçevesini yayınladı: kötü niyet kullanımı, AI ırkları, organizasyon riskleri, Rogue AI'ler, ve 2023 Mayıs'ta yüzlerce profesör ve şirket liderinin imzaladığı yok olma riskleri hakkında açıklama. 2026 yılında yayınlanan bu açıklama: sınır modelinde kullanılacak AI Dashboard  değerlendirmesi  Uzak İşlem Endeksi  Skala AI ile işbirliği)  Süper zeka stratejisi Kağıdı  Skala AI ile işbirliği  Frontiers haber makalesi  Başka bir varlık: NIST Standartlar ve Yenilikler için AI Merkezi  CIAISI    ABD hükümetinin gönüllü anlaşması ile gizli olmayan yetenek değerlendirmesi, dikkat çekim  Biyo-Silah Riskleri  CIAIS Riskleri örgütü, ABD'nin dört sınıfının en üst katkılarından biri olarak sıralanır: Kültür                                                                                                                                                                                                                                                                                                     

**类型：**Öğrenme
**语言：**Python(stdlib,四类风险清单与缓解措施匹配器)
**先修要求：**15 · 19(RSP),15 · 20
**时间：**45 dakika kadar .

## 问题

Bölüm 19 ve 20  dersler laboratuvar içindeki ölçeklendirme politikalarını tanıttı. Bölüm 21 bağımsız yetenek değerlendirmesini tanıttı. Bu ders üçüncü bakış açısını tanıttı: Kötülükler yaratma AI  Riskler Halk tartışması ve denetleme temelinde sivil toplum ve hükümet örgütleri 

İki farklı varlık önemlidir. CAIS, AI risk'in düşünülmesi için yayınlanan bir karge ve kamu açıklamasını koordine eden bir kar amacı gütmeyen araştırma örgütüdür. CAISI, NIST'in içindeki ABD hükümetinin merkezi, laboratuvarın gönüllü çalışma anlaşması ve gizli olmayan yetenek değerlendirmesi ile sorumludur. Bu iki isim benzer, ancak görevleri üst üste değildir.

 Praktiğin içeriği şunlardır: CAIS'in dört sınıf risk çerçevesinde, yayınlarda en geniş toplumsal ölçek risk sınıflandırma kanunları yer alır. Güvenlik kültürü ve örgüt riskleri bu dört sınıflardan biridir ve uygulayıcıların en doğrudan kontrol edebileceği bir sınıftır. SB-53 ((Kaliforniya) Eğer imzalanırsa, ABD'nin ilk eyalet düzeyinde felaket risk gözetim yasası haline gelir.

## 概念

### CAIS  AI Güvenliği Merkezi

- 创立时间:2022年, San Francisco, Dan Hendrycks 及同事 tarafından kurulmuştur.
- 状态:501 ((c) ((3) olmayan kuruluşlar
- 2023 yılındaki önemli sonuçlar: Yüzlerce araştırmacı ve CEO tarafından ortak olarak imzalanan, yok olma riskine ilişkin açıklama:  AI'nin yok olma riskini azaltmak, salgın hastalıklar ve nükleer savaşlar gibi diğer toplumsal risklerle birlikte küresel önceliklere dönüşmelidir.
- 2026 yılının sonuçları: Sınır modeli için kullanılır  değerlendirme AI Dashboard  Uzaktan İş İndeksi  birlikte yayınlanan Skala AI ile birlikte yayınlanan) Super zeka Stratejisi Kağıdı  AI Sınırları haber bültenı 

### Çekillik çerçevesinde

CAIS'in çerçevesinde felaketli AI 风险 dört üst katmanlı kategoriye ayrılmıştır:

1. **恶意使用**Kötü niyetli eylemciler, yapay zeka kullanılarak zararlar verirler.
2. **AI races**Laboratuvarlar, şirketler ve ülkeler arasındaki rekabet basıncı, güvenlik sınırlarını aşan bir kuruluşun sağlanmasını sağlıyor.
3. **组织风险**:实验室内部动态(安全文化失效、审计不足、安全资源不足) kötü bir dağıtımlara yol açmıştır。
4. **Rogue AIs**: yeteri kadar güçlü bir AI  İnsan refahı ile çatışma amaçlarını takip etmek

Bu tek sınıflandırma yasası değil; ancak en çok alıntılananıdır.

### 组织风险存在于哪里

Dört sınıfın içinde, örgüt riskleri uygulayıcıların en kullanılabilir bir sınıfıdır. Bir laboratuvarın güvenlik kültürü, denetim derecesi, savunma katmanları ve bilgi güvenliği, modelinin çevrimiçi hale gelmesinde, 1018 dersindeki kontrol önlemlerini gerçekten uyguladığını veya bu kontrol önlemleri sadece kimsenin onaylamadığı kontrol listesinin bir kısmı olup olmadığını belirler.

具体的组织风险杆包括:

- **安全文化**CAIS'in araştırması, diğer 杆lerin güçlü tahmin faktörlerini buldu.
- **严格审计**Dış ve iç denetimler gereklidir. Sadece iç denetimler üzerinde olumlu raporlar üretilir.
- **多层防御**Bu, 15. aşamada geçen bir konu.
- **信息安全**:Model ağırlıkları  泄露、eval data 泄露、モニター-bypass 技术泄露──第 19 课中的 RAND SL-4 is a specific standard──

### CAISI  AI Standartları ve Yenilikler Merkezi

- NIST'in içi işlevi:
- Sınır Laboratuvarları ile gönüllü anlaşma yapıldı.
- サイバー、バイオ・化学 silahlara yönelik 风险ın gizli olmayan yetenek değerlendirmesi
- CAIS'e farklı; kısaltma; URL'yi kontrol edin.

CAISI'nin rolü METR'nin özel laboratuvar işbirliği (§ 21 课) ile kamu  hükümet karşıtı tepkileridir.

### Kaliforniya SB-53

California Senato tasarısı ((20252026 会期) sınır modelleri ile ilgili 带来的灾难性风险――草案中的关键条款包括:

- 触发州级义务的特定能力值──
- AI laboratuvarı çalışanlarının haberdarı korumak.
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

Eğer imzalanırsa, ABD'nin ilk eyalet düzeyde felaket riskı düzenlemesi yasası olacaktır. İmzalama durumundan bağımsız olarak, yasaın açıklaması diğer eyaletler parlamentolarının bu sorunu nasıl ele aldığını etkileyecektir. Kaliforniya'daki uygulayıcılar yasaın durumunu takip etmelidir; diğer bölgelerde uygulayıcılar da ABD eyalet düzeyinde düzenlemenin nasıl olacağını anlamak için okumalıdır.

### Sosyal ölçek risk tek bir sorun değil.

15 Eylül'ün geçiş konusu  savunma derinliği  Aynı şekilde toplumsal seviyeye uygulanır. Hiçbir tek organizasyon, düzenleme veya çerçeve felaket riskini kapatabilir.

- 实验室 yayınladı ölçeklendirme politikaları
- Dışişleri değerlendirici (External evaluator)
- 民间社会 follow up与公开传播 (İİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİİ
- Hükümet gönüllü proje ve temel kurum gözetimi yürütmektedir.
- 实践者构建多层控制 (Büyük düzey kontrol)

Bu, bu aşamanın son birincil özetidir: Bundan önceki her ders bir aşamada bir aşamada, tüm aşamanın bütünlüğü herhangi bir aşamanın gücünden daha önemlidir.


```figure
a5-four-risks
```

## Kullan

`code/main.py`Küçük bir risk liste aracı gerçekleştirmek için bir önerilen bir deploymayı belirlemek için, dört risk sınıfı ile belirlenen bir deploymaya göre geri döner ve bir çözüm önlemleri kontrol listesine geri döner.

## - Söyle.

`outputs/skill-societal-risk-review.md`Toplumsal riskli davranış açısından bir dağıtım denetimi: dört risk sınıfından hangisini ele alıyor, hangi hafifleme önlemleri alıyor, hangi riskli teşkilatın ortaya çıkması neyi içerir?

## 练习

1. 运行  İşlem`code/main.py` Üç farklı boyutlu bir yapım devreyi girmek; dört risk işaretinin beklentilerine uygun olduğunu belirlemek; bir araç için yetersiz veya aşırı işaretli bir durum tespit etmek

2. 完整阅读 CAIS 四类风险论文──选择一个风险类别,写两段说明你认为该类中最重要的是什么――

3. California SB-53'nin mevcut tasarıma göre bir karye göre bir karye göre bir katastrof riskli durumunu artıracak bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye göre bir karye

4. 选择一个你懂的生产AI 部署(你自己的或公开发布的)                                                                                                                                                                                                                                                     

5. Bir yıllık ek kapasite gelişimini ve bir yıllık dış çalışma deneyimini yansıtan bir 勾勒一 図.

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|---|---|---|
| CAIS | “Center for AI Safety” | 非营利组织；四类风险框架；2023 年灭绝声明 |
| CAISI | “US government AI safety” | NIST Center；自愿协议；非涉密 evals |
| Four-risk framework | “CAIS 的分类法” | 恶意使用、AI races、组织风险、Rogue AIs |
| Malicious use | “恶意行为者使用 AI” | Bioweapons、disinformation、cyberattacks |
| AI races | “竞争压力” | 实验室/公司/国家推动部署越过安全边界 |
| Organizational risk | “实验室内部失败” | 安全文化、审计、防御、infosec |
| Rogue AI | “Misaligned agent” | 有能力的 AI 追求与人类福祉冲突的目标 |
| California SB-53 | “州级监管” | 2025–2026 年法案；如果签署，将成为 US 第一个州级灾难性风险监管法规 |

## 延伸阅读

- [Center for AI Safety](https://safe.ai/) 四类风险框架的机构主页──
- [CAIS — AI Risks that Could Lead to Catastrophe](https://safe.ai/ai-risk) 四类风险论文──
- [CAIS — May 2023 statement on extinction risk](https://safe.ai/statement-on-ai-risk) 简短的联合声明──
- [NIST CAISI](https://www.nist.gov/caisi) 面向政府的AI standartları ve yenilik merkezi
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) Laboratuvar seviyesindeki taahhütleri sosyal ölçek çerçevesine bağlamak.
