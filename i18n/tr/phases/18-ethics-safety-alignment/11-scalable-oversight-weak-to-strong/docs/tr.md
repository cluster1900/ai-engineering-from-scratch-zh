# Ölçeklenebilir Denetim ve Zayıfdan Güçlüye Genelleştirme

> Burns et al.(OpenAI Superalignment,Weak-to-Strong Generalization,2023) bir süperalignman sorununun bir temsilcisi görevi önerdi: zayıf model üreten etiketleri kullanmak, güçlü modelleri ince ayarlamak için. Eğer güçlü modeller kusurlu zayıf denetim sırasında doğru şekilde genelleşebilirse, o zaman mevcut insan ölçeği uyum yöntemi supermans sistemlerine de genişletebilir. Skalable denetim ve W2SG Skalable denetim ödül tartışması Recursive modeling task decomposition) denetimciyi etkinleştirir, böylece denetimli modellere uymayabilir. W2SG Sure güçlü modeller denetimci tarafından sağlanan kusursuz denetimciyi herhangi bir şekilde genelleştirilmesini sağlar. DATA Yardır W2SGiv: 213, 251 aylar, 252 ay)

**类型：**Öğrenme
**语言：**Python(stdlib,W2SG boşluk simülatörü)
**先修：**18 · 01( talimatları takip eden) 18 · 10  AI Kontrolü) 09  REL temelleri)
**时间：**60 dakika kadar .

## Öğrenme hedefi

- 定義可扩展式監督 和弱から強への概括化,并解释它们如何互补──
- Burns et al. 2023'te yapılan deney ayarlarını anlatın: GPT-4'i ince ayarlamak için GPT-2'den gelen etiketleri kullanın.
- 解释 performance gap recovered (PGR) indicator ve ölçüm içeriği
- Üç temel ölçeklenebilir denetim mekanizması (debat, geri dönüşlü ödül modeli, görev parçalanması) ve kendi avantajları vardır.

## 问题

Şimdiye kadar, 18 aşamada her bir uyumlama 技术都假设监督者能够评估模型行为──模型达到超人类水平时,监督者就成了弱环节──超级排列的问题是:一个较弱的监督者能否可靠地产生一个更强而一致的模型?

Burns et al. bu sorunu, bir işletilenebilir deney ayarına indirgiledi: zayıf model izleyen güçlü modelle, zayıf izleyen altında saklanabilecek güçlü modellerin ne kadar kapasitesini ölçmek. Bu, aşırı uyumlu bir çözüm değil, ilerlemeyi ölçebilmemiz için bir temsilci görevdir.

## 概念

### W2SG:Burns et al.

- 弱模型:GPT-2 级别──
- 强模型:GPT-4 级别──
- 目標:任务上强 GPT-4'ün tavanı

流程:
1. Bir görevde sıfır çekim 预测。
2. Bu yüzden, bu konuda çok fazla bilgi edinelim.
3.  强模型の精度率を測定する

基线:弱模型自身的准确率、强模型在黄金标签中 监督下天井──

Gap indicator: Performance Gap Recovered (PGR) = (Düzgün ayarlanmış - zayıf) / (Satır - zayıf) ――PGR 为 表示弱监督完全弥合了差距;PGR 为 0 表示弱监督没有帮助──

### Burns et al.

NLP ̇ şahmat-bulmaca ̇ ve ödül modeli ̇ görevlerinde, PGR ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ 

Burns et al. 指出的局限性:
- Burada zayıf-güçlü fark, uyumsuzluk değil, yetenek farkıdır.
- 强模型的泛化可能更多来自任务先验,而不是恢复基础真相意图──
- 引出强模型の潜伏知識 才是真正的问题;PGR 測定は特定操作化形式です。

### Ölçeklenebilir denetim: 三种机制

- **Debate（Irving et al. 2018）。**U'nun iki örneği karşıt duruş tartışmasıdır; zayıf yargıç bir karar verir. Onun varsayımı: ikna edici bir yanlış yanıt bulmaktan daha kolay bir ikna edici bir yanıt bulmaktır. Yakın dönem 2024-2025 yılları işinde (Khan et al.
- **Recursive Reward Modeling（Leike et al. 2018）。**U 助人訓練 U+1'in ödül modeli.
- **Task Decomposition（Christiano, Shlegeris, Amodei 2018）。**Bu zorluk görevini insan tarafından kontrol edilebilen alt görevlere dönüştürmek için,

Her mekanizma, görev yapısının veya orta bileşenlerin uyumluluğuna dair bir tür varsayım yapmıştır.

### Neden ölçeklenebilir denetim ve W2SG birbiriyle tamamlanmaktadır

Ölçeklenebilir denetim  监督者的有效信号质量提高──
W2SG 弥合监督者能够提供任何不完美信号所带来的差距──

Lang et al.  Tartışma Güçlü Genelleşmeye Yardımcı Olur ((arXiv:2501.13124)将二者结合:debat 协议提供更好的弱标签,强模型在这些标签上训练──报告显示 NLP 任务上的 PGR 有所提升──

###  Organizasyon düzeyinde değişiklikler

OpenAI'nin Süper Alinea 团队 on Jan Leike 于 2024 年 5 月离职加入 Anthropic 后解散──该议程(skalable oversight、W2SG、automated alignment research)

### 18'inci aşamada yer alıyor.

Ders 6-10'da, U'nun güvenilmez olduğu varsayımında tehdit ve savunma biçimlerini anlatılmıştır. Ders 11'de, saldırı biçimleri: U'nun uyumunu doğrulamak için denetleyicileri yeterince güçlü etmeleri.


```figure
scalable-oversight
```

## Kullan

`code/main.py`Bir yapay görevde W2SG ince ayarını simgeleyen bir etiketleme yapar. 弱 etiketlemecisinin doğruluk oranı %70'dir,并带有结构化错误; güçlü modellerde altın etiketlerde üst tavan %95'dir.

## - Söyle.

本课会生成 `outputs/skill-w2sg-pgr.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                

## 练习

1. 运行  İşlem`code/main.py`◊ rapor zayıf_düzgünlük = 0.60、0.70、0.80 时 PGR── açıklayın PGR 曲線形──

2.  Güçlü etiketlemeyi değiştirmek, yapısal hatalara sahip hale getirmek.

3. Burns et al. 2023 Bölüm 4.3 (NLP görevleri)  Repeat Confidence Auxiliary Loss  of intuition: When strong model than weak tag

4. Bir yazılım mühendisliği 任务设计一个结合辩论 和任务分解的可扩展式监督 协议――, her bileşen için bir hata modunu belirtir,并解释这种组合如何处理或无法处理这些失败模式――,

5. Açıklayın: Güçlüden zayıflara kadar genelleştirme, aşırı uyumlulu bir yaşam yoluyla gerçekleşir.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------|----------|
| Scalable oversight | “让监督者更强” | 提高监督者评估更强模型能力的机制 |
| W2SG | “弱监督强” | 在弱标签上 fine-tuning 强模型，并衡量恢复的能力 |
| PGR | “performance gap recovered” | (fine-tuned - weak) / (ceiling - weak)；1.0 = 完全弥合，0 = 无帮助 |
| Debate | “两个 U 实例辩论” | 一种 scalable oversight 机制，其中弱 judge 在两个 U defenders 之间做选择 |
| RRM | “recursive reward modeling” | U 帮助训练 U+1 的 reward model；监督者能力跟随 U |
| Task decomposition | “人类检查子任务” | 将困难任务递归拆解为人类可以验证的子任务 |
| Superalignment | “对齐超人类 AI” | 关注对齐人类无法直接评估的模型的研究议程 |

## 延伸阅读

- [Burns et al. — Weak-to-Strong Generalization (OpenAI 2023)](https://openai.com/index/weak-to-strong-generalization/) W2SG 论文
- [Irving, Christiano, Amodei — AI safety via debate (arXiv:1805.00899)](https://arxiv.org/abs/1805.00899) tartışma mekanizması
- [Leike et al. — Scalable agent alignment via reward modeling (arXiv:1811.07871)](https://arxiv.org/abs/1811.07871) Rekürsiv ödül modeli
- [Khan et al. — Debating with More Persuasive LLMs Leads to More Truthful Answers (arXiv:2402.06782)](https://arxiv.org/abs/2402.06782) 2024 yılı daha güçlü tartışmacılar hakkında tartışmalar  deney çalışması
- [Lang et al. — Debate Helps Weak-to-Strong Generalization (arXiv:2501.13124)](https://arxiv.org/abs/2501.13124) 2025 yıl tartışması + W2SG'nın komplo
