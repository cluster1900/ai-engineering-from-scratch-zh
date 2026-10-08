# Kes Kes Kes Kes Çubuğu Kes ve Kanarya Tokeni

> Kill switch, bir kalıcı ajanı düzenlemenin dışında bir Boolean  Redis anahtarı、 özellik bayrağı、 imzalanmış yapılandırma  Tamamen kapatma ajanı kullanılır。 Çember kesicisi 粒度 daha det: belirli bir şekilde tetiklenecektir.

**Type:** Learn
**Languages:** Python (stdlib, three-detector simulator: kill switch, circuit breaker, canary)
**先修要求：**15 · 13 aşaması (Kost yöneticileri), 15 · 10 aşaması (İzin modları)
**Time:** ~60 minutes

## 问题

Ücret yöneticileri(Desin 13) Ajanın ne kadar harcayacağını sınırlamıyorlar. Onlar büdceden ne yapabileceğini sınırlamıyorlar. 50 dolarlık hız sınırına sahip bir ajan hala bir sırrı sızdırıp, yanlış bir yazı yayınlayabilir veya bir kaynak silmeyebilir.

Bu ders, maliyet tabakası ın yanında bulunan üç sınıf detektörü kapsar:

1. **Kill switch**Bulemci düğmeye ulaşmak için bir ajanın varlığını korumak.
2. **Circuit breaker**: belirli bir yolun eylem-önemleri dedektörü durduruldu
3. **Canary token**Dokunmak için haklı bir neden yok.

Bu üçü de ön-LLM mühendisliği. Klasik aldatmacalar, oran sınırları kırıcıları ve özellik-flag öldürme, özerk ajanlardan daha önce olmuştur. Yeni bölüm saldırı yüzeyi: ajanlar inanılmaz içeriği okuyacaklar. Ders 11.

## 概念

### Öldürme anahtarları

Killer anahtarı bir ajanı, okuyabilir ama yazılmayacak bir boolean.

- **托管服务中的 feature flag。**ÇıkışKaranlık,Satış,Kafet,Kafet,Yenileştirme,Bir kaç saniye içinde yayılacak.
- **agent 轮询的 Redis key。**简单;要求代理过程 在每一轮都检查──
- **object storage 中的 signed config。**Ajanın imzalaması; imzalamayan devletleri reddetmek.
- **OS-level signal 或 container-lifecycle kill。**Docker `kill`、Kubernetes `kubectl delete pod`Sistemli bir durak.

Doğrudan öldürücü anahtarın aşağıdaki özellikleri vardır:

- Ajan ayarlayamadı.`off`◊(Agent tanıklıklarında mevcut 没有写权限的系统中──)
- Bu, her sonuçta bir kontrol olacak, sadece bir başlangıç sırasında değil.
- Kapalı olduğunda, ajan dıştan gözlemlenebilir herhangi bir şey yapmaz, örneğin ajanın ziyaret edebileceği sistem kayıtları.
- Yeniden başlatmak otomatik bir zamanlama değil, açık bir insan hareketi.

### Çeviri kesicileri

Çevre kesicisi 暂停的是特定模式,而不是整个代理──经典形态(2007年的 Nygard 书籍,至今仍适用):

- **Closed**Eylem izinlidir.
- **Open**Hareket durduruldu.
- **Half-open**:cool-down  sonra, izin 13 kez araştırma denemeleri ((默认 1 次); başarısızlık kapalı kesim, kalan herhangi bir başarısızlık yeniden açılır.

Ajan ile ilgili tetikleyici:

- 连续五次相同的工具调用 (→)
- Aynı araç farklı girişlerde 上连续五次失败 (sistemik başarısızlık)
- Araç çağrılarının hızı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
- İnandığımdan dışı içerik okuyun. Ders 11. sonra belirli bir araç kullanın.`file.delete`)。

### Kanarya tokenleri

Kanarlı tokenler (Honey Tokens)                                                                                                                                                                                                                                                          

Ajan örnek:

- Çevreye karşı sahte`AWS_SECRET_ACCESS_KEY`, hiçbir gerçek ayrıcalık yok.
- Bilinen bir nöbetçi değeri olan, sahte veritabanı kayıtları...
- İş alanında sahte dosyalar var.
- Sessiyon başlaması 时注入的虚假内存输入──如果它出现后续输出中,说明内存 已被泄露──

Canary  tasarımı belirli iş akışına yöneliktir. Bir ajan kanary'e dokunmak için haklı nedenler vardır. Sadece gürültü yaparlar.

### Neden istatistik ve sert sınırları kullanmak için?

İstatistik detektörler (EWMA, CUSUM, araç çağrı oranları, yukarıdaki z puan) hareket tabanına göre uyarlar. Bu, meşru sürüşe karşı bir özelliktir.

Sert anayasa sınırları (Düşünce 17) asla 曲──`secrets@` Daha basit 、audit edilebilir, ve yavaş sürüklenemez 钻空子──分层模式是:statistik dedektörler 捕捉大部分噪声,hard limits 捕捉到探测器身边走过去的攻击──

### EpfP veri yolunun yönlendirmesi ile karantinaya geçiyoruz

Cilium'un eBPF tabanlı ağ politikası, çekirdeğin katmanında karantinalı pod'un çıkışını yazılabilir. Cilium'un açık referansları, TCP_RR'deki P99 veri yolu gecikmesi 1 millimetrden daha düşük olduğunu bildirir.

### Hiçbir dedektör yok .

- **由 allowed primitives 组合而成的 semantic attacks。**Her tek eylem her detektörden geçti; sorun kompozisyonda yer almaktadır. Bu, Ders 10'un Otomatik Mod'un kompozisyon başarısızlığıdır.
- **把 detector 本身纳入 payload 的 attacks。**Eğer bir ajan, hareketinden önce, kanaryayı devre dışı bırakmış ve bu yeteneğe sahipse, o zaman detektör bozulmuş olur.


```figure
circuit-breaker
```

## Kullan

`code/main.py`模拟一个短代理轨迹 通过三类探测器──外部 dict 中保存的杀伤开关;一个会在五次相同的工具中调用触发的电路打断器;一个读取后会触发警报的加纳文件──它输入一个合成轨迹:合法行动、重复循环、加纳探,以及一个由杀伤开关触发的场景,其中的代理的行动被停止──

## - Söyle.

`outputs/skill-tripwire-design.md`会审查 agent deployment of拟议探测器 stack,并标记漏洞(缺失杀开关、缺失可里、电路断断门过松)。

## 练习

1. 运行  İşlem`code/main.py`▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ 

2. 添加一个统计探测器:工具调用率 上的 EWMA z-score。输入一条缓慢漂移的轨迹,并显示探测器 从不触发──然后添加一个硬极(10分内不超过50次工具调用),并显示硬极 在同一条轨迹 上触发──

3. Bir tarayıcı ajanı için (Desin 11) Design a group of canary tokens──列出至少三个卡纳里,以及每个卡纳里 会检测什么──

4. Cilium ağ politika belgelerini okuyun. Özellikle bir çıkış-önerleştirici karantin akışını açıklayın: hangi politika seçicisi, hangi kapak, hangi çıkış yeniden yazısı, hangi uyarı. Karantinaya karar vermenin sonucunda hangi kararlar alınmıştır?

5. Öldürülmüş ajan yeniden etkinleştirilen prosedürü tanımlıyor. Kim yeniden etkinleştirmeli? Neyi kaydetmeli?

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Kill switch | “Off button” | 位于 agent 编辑面之外的 boolean；在每个 consequential action 上检查 |
| Circuit breaker | “Pattern pause” | 针对重复、failure rate 或 rate-limit 的 action-specific trip |
| Canary token | “Honeytoken” | agent 没有正当理由触碰的诱饵；访问会触发 alert |
| Honeypot | “Forensic sandbox” | 被 redirect 的 traffic / workspace，用于观察被 quarantine 的 agent |
| EWMA | “Moving average” | Exponentially weighted；会适应 drift（feature + bug） |
| CUSUM | “Cumulative sum” | 检测相对 baseline 的 sustained shift |
| Hard limit | “Constitutional rule” | 不会适应；无论历史如何都保持常量 |
| Constitutional limit | “Always-true rule” | 绑定到 Lesson 17 的 constitution；不能被 agent 编辑 |

## 延伸阅读
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) özerk ajanların öldürme anahtarı ve devreler kesici çerçevesini oluşturmak
- [Microsoft Agent Framework — HITL 与监督](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) üretim 治理模式。
- [OWASP LLM / Agentic Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) 检测与响应要求──
- [Cilium — Network policy and eBPF](https://docs.cilium.io/en/stable/security/network/) Kapak seviyesindeki çıkış yönlendirme ve adli tıbbi balıkçılık kalıpları
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)   Anayasa sınırları   sert kodlanmış yasaklar olarak
