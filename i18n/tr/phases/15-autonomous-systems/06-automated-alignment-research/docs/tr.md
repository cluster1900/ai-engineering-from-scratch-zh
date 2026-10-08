# Otomatik Düzeltme Araştırması (Antropik AAR)

> Antropic in Independent Sandbox in并行运行 多个Claude Opus 4.6 Autonomous Alignment Researchers 团队,并通过一个共享论坛 协调;该论坛的日志位于任何沙盒之外的任何沙盒外的;因此代理无法删除自己的记录)  zayıf-güçlü eğitim 问题上,AAR'ın performansı insan araştırmacılarını aşmıştır. Antropic 自身总结指出,规定的工作流 往往会限制AAR'ın灵活性并降低性能.

**Type:** Learn
**Languages:** Python (stdlib, parallel-research-forum simulator)
**前置要求：**15 · 05 aşaması (AI Scientist v2), 15 · 04 aşaması (DGM)
**Time:** ~60 minutes

## 问题

Düzeltme araştırmaları  çok fazla insan araştırmacı zamanını tüketir── örneğin ölçeklenebilir gözetim, ödül spesifikasyonu veya zayıf-güçlü eğitim gibi sorunlar, her bir deney döngüsüde birkaç hafta gerekir── sınır kapasiteleri  ilerleme, düzeltme  çalışma miktarının büyümesi hızından daha hızlı ilerlemektedir.

Otomatik Alignment Araştırması (AAR) 追问是: those capacities are exceeding alignment progress's same batch of frontier models, are also able to help to bridge this gap──Antropic 2026 year  运行的 weak-to-strong training研究报告(alignment.anthropic.com/2026/automated-w2s-researcher/), is this kind of deployed system's earliest public results──

Sonuçlar gerçekten olumlu: Bir araştırma sorusunda AAR'ın performansı insan tabanından iyidir. Ancak bu sonuçlar, bu aşamada gerçekleşen her kaygıları bir sistemle odaklar. Eğer uyumlu araştırma otomatik hale getirilebilirse, güvenlik önlemlerinin bir kısmı da otomatik hale gelebilir.

## 概念

### 架构(按公开描述)

- **Parallel agents.**Çoğu Claude Opus 4.6  örnekler AAR 运行, her biri bağımsız kum kutu içinde yer almaktadır.
- **Shared forum.**Araştırma Bulguları paylaşım forumuna yayınlanır, depolama arka planı  her kum kutuunun dışında ∼Agent alabilir okuyabilir forum;agent öz kum kutuundan ∼deleted or edit forum 记录。
- **Task allocation.**İnsan tarafından tasarlanmış bir görev kuyrusu, araştırma sorunlarını AAR'a dağıtmaya, çalışma deneyleri yapmaya ve bulguları yazmaya yönlendirecek.
- **Weak-to-strong training focus.**Yayınlanan araştırmaların işlemi zayıf-güçlü eğitimi, yani daha zayıf yönetici modelini kullanarak daha güçlü öğrenci modelini eğitmektir.

### Neden kum kutusundan çıkmış bir günlük  çok önemli

Log-integrity  özellikleri kontrol edilen deneylerle potansiyel hasarlı deneyler arasındaki farkı oluşturur. Eğer AAR kendi günlüğünü düzenleyebilirse, başarısız veya şüpheli deneyleri örtbas edebilirler. Antropik doğrudan şunu belirtti: Bu özellikler inanç araştırmalarının çıkışının gerekli şartlarıdır ve doğrulanmak kolay bir şey değildir.

Infrastruktura terminolojisinde, yazma-önce dış depolama için sadece ek kayıtları kullanmak için kullanılır. Örneğin S3 nesne kilitleme ∞ değişmez Datadog kayıtları ∞ Agent ∞ geçmiş kayıtların onaylarını değiştirmedi ∞ Bu, 2026 yılındaki kurumsal güvenlik ekibi tarafından anti-sürüm yazılım denetim izlerini inşa etmek için kullanılan modelle aynıdır ∞

### İş akışı için belirlenmiş bir düzenleme

Anthropic'in raporunda belirtildiği gibi, belirtilen iş akışları 往往会限制AAR'ın灵活性并降低性能. Başka bir ifadeyle: Eğer bir insan tasarımcısı bir araştırma planını aşamalı yazırsa, AAR'ın performansı yalnızca yüksek seviyede bir hedef vererek ve serbest parçalanmasına izin vererek farklı olacaktır. Bu, ajan araştırmalarındaki sonuçlarla uyumludur.

Güvenli anlamı çok ince. AAR'ın seks enerjisinin esnekliğini yükseltmek, aynı zamanda yetkisiz parçalanma, yeni tür araç kullanım ve hedef-drift esnekliğini de kabul eder. Bu bir tasarım alanı kararıdır: Ne kadar esneklik insan kapasitesini aşmak için yeterli, aynı zamanda da ajanı ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırk ırkın ırk ırk ırk ırkın ırk ırkın ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk ırk

### 压缩风险

RSP v3.0 (Desin 19) bir AI R&D yeteneği eşiği tanıttı: İnsan + AI araçları karşısında rekabetçi maliyet, tamamen otomatikleştirme AI R&D boru hattı yeteneği.

AAR bu eşiğin bir adımını daha uzattı: boru hattının bir kısmını otomatikleştirdi, ancak henüz bir uçtan sonuna kadar otomatikleştirilmiş bir kapasite geliştirme döngüsü yok.

圧縮時間線 is complex失效担忧所在── Eğer uyumlu araştırma ve yetenek araştırmaları, karmaşık büyüme hızına göre yakın bir şekilde ilerlerse, yanlış uyumlulaşma riski yüzeyi en azından yeteneklerle aynı hızda büyüyecektir── eğer yetenek  karmaşık büyüme daha hızlı olursa, fark giderek büyüyecektir── bu nedenle AAR şartlı bir iyiliktir: her ek bir uyumlu çalışma sonucu küçük bir fark içerir, ancak araştırma süreci güvenilirdir──

### AAR Çıkaramaz

İnsan araştırmacıları görev kuyrukunu belirler, sonuçları incelemektedir ve anayasal yetkiye sahiptir. AAR hızlandırılması, iki taraf yerine boru hattının orta kesimidir.

Bu, Ders 15 ile aynı zamanda, önerilen ve sonra görevli bir çalışma biçiminde uygulanmaktadır.


```figure
aar-forum
```

## Kullan

`code/main.py`模拟一个多AAR研究论坛──三个独立的研究代理并行运行,将发现发布到一个仅附录论坛,并可选择进行操纵尝试──

观察:

- Kum kutusundan çıkmış kayıplama 如何捕获木材
- Daha zor sorularda, serbest parçalanma iş dağılımı nasıl sabit iş akışlarından daha iyi olmasına izin verin.
- Eğer kayıtlar yanlışlıkla açık değilse, tek bir AAR 如何污染论坛的信号──

## - Söyle.

`outputs/skill-aar-deployment-review.md`Bu, otomatik bir uyum- Araştırma boru hattı'nın önde gelen departmanının incelemesi.

## 练习

1. 运行  İşlem`code/main.py`❖ "Sıkı iş akışı" ile "savaşsız parçalanma" 设置──sıkı parçalanma 否总是获胜,还在某些问题类别中固定工作流也有竞争力?

2. 修改模拟器,让一个代理 尝试 log tampering──确认添加-only log 能检测到它──写一段话,准确描述检测信号在 log 中是什么样子──

3. Antropik'in zayıf-güçlü AAR raporunu okuyun. AAR'ın insan araştırmacılarının belirli alt görevlerini aşması.

4. 设计一个任务队分配政策,在AAR 灵活性 (更好结果) 约束 (约束) 更易审计 (更易审计) 约束 (约束) 更易审计) 约束 (更易审计) 约束 (约束) 更多易审计) 约束 (更易审计) 约束 (约束) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (约束) 约束) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束) 约束 (更易审计) 约束 (更易审计) 约束) 约束 (更易审计) 约束) 约束 (更易审核) 测) 描述你将对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对

5. RSP v3.0'un AI R&D-4 eşiği için bir kısım okuyun.

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| AAR | "Automated Alignment Researcher" | 在 alignment problems 上 autonomously 运行的 Claude Opus 4.6 实例 |
| Weak-to-strong training | "Training a stronger model with a weaker supervisor" | AAR 表现超过人类的经典 scalable-oversight benchmark |
| Shared forum | "Where agents publish findings" | Append-only、out-of-sandbox storage |
| Out-of-sandbox log | "Agent cannot edit its own record" | Tamper-evident write-through 到 external storage |
| Prescribed workflow | "Step-by-step plan from human designer" | 限制 AAR；相较 free decomposition 往往降低性能 |
| Free decomposition | "Agent decides how to break the task" | 能力更强，更难 audit |
| AI R&D threshold | "RSP/FSF capability level" | 以有竞争力的成本完全自动化 R&D pipeline |
| Compressed timeline | "Alignment vs capability race" | 如果 capability 复合增长快于 alignment，misalignment 风险就会增长 |

## 延伸阅读

- [Anthropic — Automated Weak-to-Strong Researcher](https://alignment.anthropic.com/2026/automated-w2s-researcher/) ilk kaynaklı kaynak
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) AI Araştırma ve Gelişim Eğlence Çelişkisi Çerçevelaması
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) Daha geniş bir ajan-özerk çerçevesini oluşturmak
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) RSP 平行indeki ML Araştırma ve Gelişim özerkliği seviyeleri­ ile birlikte
- [Burns et al. (2023). Weak-to-Strong Generalization (OpenAI)](https://openai.com/index/weak-to-strong-generalization/) AAR To treat'in alt katı sorunları¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
