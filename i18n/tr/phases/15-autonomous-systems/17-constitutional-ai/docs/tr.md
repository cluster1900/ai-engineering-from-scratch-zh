# Anayasa Yapay Bilgi ve Kurallar

> Antropic, 2026'da 22 Ocak'ta yayımlanan Claude Anayasası 共 79 sayfa, CC0'dan yetkili olarak yayımlandı. Kurallara dayalı bir uyumlulıktan mantığa dayalı bir uyumlulıktan ayrılıp dört öncelikli seviye oluşturdu: 1) Güvenlik ve insan denetimi destekleme, 2) Etik, 3) Antropik Rehberlik, 4) Faydalılık. Davranışlar sert kodlanmış yasaklara ayrılmıştır: Biyo-Silah Gücü Yükseltme, CSAM) ve yumuşak kodlanmış özürlü: Öncüleri işletim yöntemleri ve kullanıcılar kapsamayabilir, sonrakiler işletim yöntemleri sınırları düzenleyebilir.

**Type:** Learn
**Languages:** Python (stdlib, four-tier priority resolver)
**前置要求：**15 · 06 aşaması (Özelleştirme ayarlama çalışmaları), 15 · 10 aşaması (权限模式)
**Time:** ~60 minutes

## 问题

Bir görevlendirilen ajan, tasarımcıların hiç görmediği girişlerle karşılaşır. Hiçbir kural listesi onları kapsayacak kadar uzun değildir.

基于规则的对齐(RBA): izin verilmeyen tüm şeyleri listelemek. Çabuk kontrol edilebilir, denetlenmesi kolay, güncel tutulamaz ve genellikle öngörülen olmayan ilişkilere karşı aşırı reddedilebilir.

2026 Anayasa  açık bir orta duruma varmıştır. Kötü kodlu yasak, yani onun yanlışlığı aşağıdaki konulara bağlı değildir. Biyo-Silah Gücü Yükseltmesi, CSAM), RBA'ya aittir: ne işletim yöntemine veya kullanıcıya nasıl yönlendirilirse, kesinlikle izin verilmez.

## 概念

### Dört sınıf öncelikli sınıf

1. **安全与支持人类监督。**En iyisi, insan ve insanlık ı gözlemleme ve düzeltme yeteneğini zayıflatmaktan kaçınmak için öncelik verilmektedir. Bu, dikkatli bir tutum değildir.
2. **伦理。**诚实、避免伤害个人、不欺骗、不操纵──当它与人类指南冲突时,伦理优先──
3. **Anthropic 指南。**Antropik  önemli operasyon kuralları: ürün aralığı 交互模式 何時使用哪些工具──
4. **有用性。**En düşük... En yüksek öncelik alanında mümkün olduğunca kullanışlı...

Bu, Unix öncelikleri veya ağ QoS'nin biçimleriyle aynıdır: Bu çerçeve, her tek boyutta en iyi davranışta olmakla kalmaz, tahmin edilebilir çözüme kavuşmak için tasarlanmıştır.

### Sert kodlu yasak ve yumuşak kodlu default

**Hardcoded:**
- 生物武器 / CBRN 能力提升
- CSAM
- Anali altyapıya saldırılar
- Doğrudan sorguya çekilip kullanıcıları aldatmak için model kimliği hakkında bilgi

Bu işlemler, kullanıcıların da kapsamayacağı durumlarda, modelin ağırlıklı derecesinde uygulanır.

**Soft-coded default（操作方可调整）：**
- 响应长度默认值
- Tema: Model can refuse operation (model can refuse operation)
- 风格(正式 vs 随意)
- 工具使用模式

Operasyonlar yeniden adlandırılmadan, sert kodlanmış yasak kaldırılamıyor.

### 2022 CAI 訓練

原始 憲法 AI(Bai et al., 2022)

1. 针对一组提示 生成响应──
2. 要求模型根据一套宪法 (Right Model) 显式原则) 批判每个响应──
3. 根据批判修订响应──
4. Yapılan değişiklikler için RLAIF yapın (AI'den gelen geri bildirimlerden öğrenme güçlendirme)

Sonuç: Model, zararlı istekleri reddetmek yerine zararlı istekleri reddetmek için bir prensip kullanır. 2026 Anayasası bu tür eğitimlerin sonraki sürümlerini kullanır ve açık bir seviye yapı üzerinde ek ek sonrası eğitimler yapmaktadır.

### Neyi yakalayıp neyi kaçırırız?

**能抓住：**
- Asıl izin verilen temel işlemler, öngörülemeyen bir şekilde birleştirilmiştir, ancak ilkeler açıkça uygulanabilir durumlarda bulunmaktadır.
- Yasak işlere çok yakın yeni türde talepler.
- Değil mi? Sosyal mühendislik saldırılarına izin vermiyor.

**会漏掉：**
- Utilise principi歧义的攻击用户要求这样做,所以有用性说可以)
- İki ilke, beklenmedik bir şekilde çatışmaya ve aşama sırasıyla karışık bir durumla karşı karşıya kalmaktadır.
- 訓練周期中原則解释的缓慢漂移 (Hızlı hareket)

### 2023  katılımcı deney

Anthropic, 2023 yılında bir deney gerçekleştirdi. Şirketin yazdığı anayasa ile kamuoyunun girişinden kaynaklanan anayasa ile karşılaştırdı. Yaklaşık 1.000 ABD'li araştırmacı.[1] İki versiyon yaklaşık %50'lik bir prensip üzerinde anlaştı.

### Neden sert kodlanmış yasak gerekli?

                                                                                                                                                                                                                                                              

### Anayasa 位于中的哪里

Anayasa 14 Dersin Killing Switchidir. Bu model seviyesinde yer alır. Model ağırlığı tercih edilen içeriğe eğitilmiştir. Kill switch ve kanary token. Bu model ağırlığı çok gevşekse, çalışmaya yol açar ve tüm hataları gerçekleştirir. Bu çalışma süresi sorunu.


```figure
mx-priority-tiers
```

## Kullan

`code/main.py`实现一个最小四级优先级解决器――解决器 接收一个拟议动作和一组原则评估(güvenlik, etik, yönergeleri, yararlılık),并返回该动作、拒绝或修改后的动作──司机 运行一小组案例:明确允许、明确不允许、硬码禁、跨层级模糊案例──

## - Söyle.

`outputs/skill-constitution-review.md`审计某部署的宪法层:哪些是硬编码的,哪些是软编码的,操作方可在哪里调整,以及四级层级是否确实是解析顺序──

## 练习

1. 运行  İşlem`code/main.py`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖    ❖ ❖ ❖ ❖ ❖

2. Claude Anayasası'nı okuyun, açıkça 79 sayfa, CC0);;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

3. Müşteri desteği ajanı için  soft-coded default bir grup tasarım.

4. 阅读 Bai et al. 2022 CAI 论文。 bir Anayasa AI'nin eleştirisi ve revizi döngüsünü tanımlamak                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

5. Anthropic'in 2023'te yapılan bir deneyde, kamu prensibi ile şirket prensibi arasında yaklaşık %50'lik bir fark olduğunu bulmuştur.

## 关键术语

| Term | 人们常说 | 实际含义 |
|---|---|---|
| Constitutional AI | “Anthropic 的对齐方法” | 针对书面 constitution 的自我批判 + RLAIF |
| Reason-based alignment | “原则，而不是规则” | 模型基于原则进行推理，以处理未见案例 |
| Hardcoded prohibition | “永远不要做 X” | 操作方或用户都不能覆盖的基于规则的禁止项 |
| Soft-coded default | “操作方可调整” | 在声明边界内的行为，由操作方控制 |
| Four-tier hierarchy | “优先级顺序” | safety > ethics > guidelines > helpfulness |
| RLAIF | “AI feedback RL” | reward 来自模型生成批判的 RL |
| Participatory constitution | “公众来源原则” | 2023 Anthropic 实验；与公司原则约 50% 分歧 |
| Principle drift | “解释滑移” | 模型解读固定原则文本的方式缓慢变化 |

## 延伸阅读

- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 79 ページ CC0 文档。
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback) 2022 原始论文──
- [Anthropic — Collective Constitutional AI (2023)](https://www.anthropic.com/research/collective-constitutional-ai-aligning-a-language-model-with-public-input) 参与式实验──
- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) Anayasa  RSP  içinde konumında。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) Anayasa, 长周期部署中的作用──
