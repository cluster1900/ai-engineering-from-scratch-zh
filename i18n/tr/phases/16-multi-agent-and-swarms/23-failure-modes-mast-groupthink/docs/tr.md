# 失效模式  MAST、Groupthink、Monoculture、Cascading Errors

> 2026 yılı için bir referans taksonomisi**MAST**(Cemri et al., NeurIPS 2025, arXiv:2503.13657), 7 个 state-of-the-art açık kaynak MAS'ın 1642 条执行 trace,显示出**41–86.7% 的失败率**❖ üç kök sınıf:**Specification Problems**Karşılıklı olarak, bu durumun bir diğer nedeni de, görevlerin belirlenmesi ve belirlenmesi.**Coordination Failures**(36.94%) 通信中断、状態 desync;**Verification Gaps**(%21.30) 缺少验证 缺少质量检查──**Groupthink**Family(arXiv:2508.05687) tamamladı:monokultura çöküşü(shame base model → 相关失败) ‧conformity bias(agents 相互强化彼此的错误) ‧deficient theory of mind、mixed-motive dynamics、cascading reliability failures──级联示例:retry storms, among which one payment failure 触发 order retries,进而触发库存 retries,最终压库存 service,几秒内 10x load   电路打断器) ◦Hotüm zehirlenmesi: bir ajanın halüsinasyonu 进入共享记忆,下游 agents 将准其当事率下降;确渐渐,使根原因 诊断变得痛苦────**STRATUS**(NeurIPS 2025) rapor, özel tespit / teşhis / doğrulama ajanları yoluyla, hafifleme-başarı 提升 1.5x──本课把失败模式 视为一等工程目标──

**Type:** 学习
**Languages:** Python (stdlib)
**前置要求:**16 · 13 aşaması (Bağlanan hafıza), 16 · 14 aşaması (Konsens ve BFT), 16 · 15 aşaması (Votlama ve Tartışma Topolojisi)
**Time:** ~75 分钟

## 问题

Çoklu ajan sistemleri gerçek görevlerde başarısızlık oranı %41-86.7'dir. Cemri ve diğerleri 2025 yılında 7 açık kaynaklı MAS'da başarısızlık oranını belirtiyor. Bu sadece daha fazla ajan eklemekle ilgili değil. Bu başarısızlıkların yapısal nedenleri vardır.

2026 yılında üretim uygulaması başarısızlık modlarını oluşturur.

## 概念

### MAST kategorileri

**Specification Problems（41.77% 的失败）。**Ajanın görevleri yeterince sıkı değildir.

- Rol belirsizlikleri: İki ajan kendisini bir eleştirmen olarak görüyor.
- Görev belirtilmedi: kullanıcı belirli bir açıdan istedikleri için, sadece bunu özetlemeyi söyledi.
- Başarılılık kriterleri içindir:Agent kendini başarılı olup olmadığını yargılayamıyor.

Yumuşak başlılık:
-                                                                                                                                                                                                                                                               
- Her görev kabul testi ile birlikte.
- Uçuş öncesi özellik kontrolü: bir tek ajan gönderme öncesi inceleme görevleri tanımlanmıştır.

**Coordination Failures（36.94%）。**İletişim veya durum kesintisi

Örnek:
- İki ajan eşleşmeden ortak durumunu yeniledi.
- Ajanlar arasındaki mesaj kaybediliyor.
- Devlet süresi:Agent A 认为任务已完成;agent B 仍在执行──

Yumuşak başlılık:
- 带版本的共享状态, оптимиsteki eşzamanlılık kullanın.
- Kilit mesajlar için açık bir onay yapın.
- 定期 devlet senkronize kontrol noktaları;尽早检测漂移──

**Verification Gaps（21.30%）。**Dışarı çıkış için bağımsız bir kontrol yok.

Örnek:
- Bir ajan başarıyı iddia ediyor.
- Bir dizi ajanın bir önceki çıkışını düşünüyor.
- Yeni gelişen karma davranışlara karşı 缺少测试覆盖――

Yumuşak başlılık:
- 独立验证代理 (独立验证代理) (Desin 13) ・ Yalnızca okuyucu, bağımsız kaynak erişimı。
- 显式交付合同:A 的输出必须通过检查C,B 才能开始──
- Çevrelik analizleri için sonuç kayıtları kaydetmek.

### Grup düşüncesi ailesi (arXiv:2508.05687)

Ajanlar birbirlerini örnek aldığında, beş tür başarısızlık ortaya çıkar:

**Monoculture collapse。**Aynı temel model veya eğitim verileri → 相关错误──当三代理 共享一个LLM 时,它们也共享它的幻觉──

**Conformity bias。**Ajanlar en güçlü veya en güvenli eşlerine karşı, hata olsa bile.

**Deficient ToM。**Ajanlar birbirlerinin inançlarını oluşturamıyorlar.Koordinasyon çöküyor.

**Mixed-motive dynamics。**部分一致的激励的代理人 漂移到折中中态,结果谁都不满足──

**Cascading reliability failures。**Bir bileşenin hata kalıbı 触发依赖组件中的错误 kalıbı―

### Kaskadör örnek  yeniden deneme fırtınası

2026'da klasik bir olay örneği:

```
payment service fails 10% of requests
   ↓
order agent retries payment (exponential backoff but naive)
   ↓
each retry is a new order-inventory check
   ↓
inventory service sees 2x normal load
   ↓
inventory service starts timing out
   ↓
every order retries inventory check
   ↓
inventory service sees 10x normal load
   ↓
cluster goes down
```

修复方式是经典做法:**circuit breakers** Hangisi daha yüksek bir hatalı oranı  Hangisi daha yüksek bir hatalı oranı  Hangisi daha yüksek bir hatalı oranı  Hangisi daha yüksek bir hatalı oranı  Hangisi daha yüksek bir hatalı oranı  Hangisi daha yüksek bir oranı  Hangisi daha yüksek bir oranı  Hangisi daha yüksek bir oranı  Hangisi daha yüksek bir oranı  Hangisi daha yüksek bir oranı  Hangisi daha yüksek bir oranı  Hangisi daha yüksek bir oranı  Hangisi daha yüksek bir oranı  Hangisi daha yüksek bir oranı  Hangisi daha yüksek bir oranı  Hangisi daha yüksek bir oranı  Hangisi daha yüksek bir oranı  Hangisi daha daha yüksek bir oranı 

Çekimci devreye girenler, dağıtılan sistemlerden doğrudan kullanılabilir ve değiştirilmemesi gereken çoklu ajanlardaki başarısızlık azaltma yöntemlerinden biridir.

### Hatıra zehirlenmesi (回顾)

Ders 13: Bir ajanın halüsinasyonu paylaşımlı hafıza gerçeğine dönüşüyor; aşağıdaki ajanlar kirlenmiş gerçeklere dayalı düşünceler yürütülüyor. MAST'in dediği gibi, bu paylaşımlı hafıza katmanının doğrulama boşluğu.

症状は准确率漸降── You won't get crash; You get is very difficult-root-cause's slow drift──

Yumuşak başlılık: Sadece ekleme logı, kaynak, yazılmayan doğrulamacı.

### STRATUS  Eksikliği tespit etmek için özel ajanlar

STRATUS(NeurIPS 2025) raporunu,当你部署以下角色时, mitigation-success 提升 1.5x:

- **Detection agent。**监视症状パターン(高不一致、retry spikes、精度漂移)
- **Diagnosis agent。**给定症状, MAST taksonoması 推断可能根源──
- **Validation agent。**                                                                                                                                                                                                                                                              

Bu, ajan sistemlerinin SRE tarzında olay tepkisi için uygulanmaktadır.

### Başarısızlık modunun denetimi

2026 yılının en iyi uygulaması ise, her yıl (ya da her büyük yayın) bir hata modunda denetim yapmaktır:

1. **Trace sample。**Toplamak yaklaşık 1000 条 gerçek idam izleri。
2. **Categorize。**Her iz başarısızlık için, MAST + Grup düşünce kategorilerine yerleştirilmiştir.
3. **Compute failure-by-category rate。**Sisteminizi hangi kategoriler yönetiyor?
4. **Rank mitigations。**En çok başarısızlığı ortadan kaldıracak çözüm hangisi?
5. **Pick 2-3 mitigations。**实现;下季度重新审计──

纪律比具体选择更重要──无审计,失败会混入噪音,永远不到系统性处理──

### Sistemler sessizce başarısız olduğunda

En tehlikeli başarısızlık kategorisi sessiz doğruluk başarısızlığıdır. Yüksek sesle başarısız olan bir sistem ([[crash]], istisna、alert]]) izlenebilir.

投资于:
- Örnek tabanlı insan incelemesi.
- Altın veri kümesi gerileme testleri。
- Önemli bir ihracat için ajanlar arası kontrol yapılmalıdır.

### Başarısızlık vs yavaş başarısızlık

Bazı başarısızlıklar hemen gerçekleşir; bazı yavaş gerçekleşir.

2026 yılının Engineering动作:instrument slow-failure proxies, so you can in drift 变成可见错之前捕获它──Agreement rate、retry rate、output-length distribution,以及连续代理 versions 之间 edit-distance 都是有用的代理──


```figure
a5-retry-cascade
```

## Yapın onu.

`code/main.py`实现:

- `FailureTaxonomy`                                                                                                                                                                                                                                                              
- `CircuitBreaker` 经典模式;当 error rate 超过门时打开。
- `RetryStormSimulator` kaskadörün başarısızlığını göstermek; devreler kesiciyi aç / kapatmak
- `DetectionAgent` STRATUS tarzı belirti eşleşimi.

运行:

```
python3 code/main.py
```

预期输出:
- 没有断路的重试暴:库存错误 爆炸式增长(模拟) ⋅
- Çekilme: 处封顶; degraded-mode tepkiler sağlar。
- Deteksiyon ajanı 标记该模式并命名 MAST kategori。

## Kullan

`outputs/skill-mast-auditor.md`Çoklu ajanlı sistem için MAST tarzı başarısızlık modunun denetimi.

## Yayınla

生产中的 başarısızlık modunun disiplini:

- **每季度 MAST audit。**Not per year. Kategoriler sistem büyümesiyle değişir.
- **到处部署 circuit breakers。**Her bağlı hizmet için her çıkış çağrısı için:
- **Golden datasets。**Küçük tip, yüksek kaliteli, yapay denetim, haftada bir gerileme testi yapılır.
- **STRATUS trio。**Deteksiyon + Tanıksal + Valideci ajanlar  监控生产──先只从检测剂 开始;当症状噪音时再添加诊断──
- **Failure budget。**Kategoriye göre 统计的失败率 设定显式 SLO──超出预算 会触发停止运输对话──

## 练习

1. 运行  İşlem`code/main.py`❖ Kontrol devresi ❖ sınırı ❖ geri deneme fırtınası ❖ ayarlama başarısızlık eşiği 并观察 tradeoff──
2. 实现一个 **slow-failure proxy**3: 个并行代理的协议率──急剧下降时触发警报──通过逐渐关联代理输出 来模拟单种植漂移──
3. 阅读 Cemri et al.(arXiv:2503.13657)。 seçtikleri 7 MAS sisteminden birini,并映射其前3失敗類──它们与 MAST的预测相比如何?
4. 阅读 Grup düşünce kağıdı(arXiv:2508.05687)。识别五种模式中哪一种在生产中最难检测──提出一个代理测量──
5. Bir çok ajanlı sistem hakkında bilgi edinmek için STRATUS tarzı bir tespit-tanıks-valyatif üçlü tasarlayın.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MAST | “2026 taxonomy” | Cemri 2025；3 个根类别 + 14 个 failure sub-types。 |
| Specification Problem | “Role ambiguity” | 任务或角色定义不足；agents 不知道该做什么。 |
| Coordination Failure | “State drift” | agents 之间的通信或同步中断。 |
| Verification Gap | “No one checked” | 输出在没有独立验证的情况下被接受。 |
| Groupthink family | “Homogeneity failures” | Monoculture、conformity、deficient ToM、mixed-motive、cascading。 |
| Monoculture collapse | “Same model, same hallucinations” | 来自共享 base model 或 training data 的相关错误。 |
| Retry storm | “Cascading error amplification” | 一次 failure 触发 retries，进而放大下游 load。 |
| Circuit breaker | “Fail fast on error rate” | 当 error rate 超过 threshold 时打开；用 default 短路。 |
| STRATUS | “Incident response trio” | Detection + diagnosis + validation agents。1.5x mitigation success。 |
| Memory poisoning | “Hallucinations propagate” | Shared-memory fact 被污染；下游 agents 基于 poison 推理。 |

## 延伸阅读
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST taksonomisi, NeurIPS 2025
- [Groupthink failures in multi-agent LLMs](https://arxiv.org/abs/2508.05687) tek kültür, uyum ve beş aile taksonomisi
- [STRATUS — specialized agents for MAS incident response](https://neurips.cc/) NeurIPS 2025 prosedürüne giriş( tespit + teşhis + doğrulama)
- [Release It! — stability patterns (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) 经典 devreler kesici 参考
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) 生产 başarısızlık modunun notları
