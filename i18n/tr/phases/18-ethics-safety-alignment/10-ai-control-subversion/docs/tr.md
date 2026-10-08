# AI Kontrol                                                                                                                                                                                                                                                              

> Greenblatt, Shlegeris, Sachan, Roger (Redwood Research, arXiv:2312.06942, ICML 2024) ――Control 重新定義安全問題:给定一个不可信强模型 U, it might be optimized in a way to counter you, which protocols can allow you to extract useful work simultaneously in a limited unacceptable outcome probability?

**Type:** 学习
**Languages:** Python (stdlib，code-backdoor 任务上的 safety-vs-usefulness frontier)
**前置要求：**18 · 07 aşaması (uyku ajanları), 18 · 08 aşaması (yapma), 18 · 09 aşaması (ağırlaştırma sahteliği)
**Time:** ~75 分钟

## Öğrenme hedefi

- 定義 AI Control 威胁模型:不可信强模型 U、可信弱模型 T、可信人类预算 H。
- 描述 Trusted Editing 协议,以及为什么它在ICML 2024 kod arka kapı 任务上Pareto-dominates Untrusted Monitoring──
- 解释  U 值得信任) ve kontrol  U 值得信任但我们仍然安全) arasındaki farkı
- Kontrolün üç sınırını açıklayın: İnsanın genişlemesi mümkün değil, inanılmaz zayıf model sonunda düşecek, kontrol güvenmeye değer güçlü model üretmeyecek.

## 问题

Bölüm 7-9  Ders açıklaması, sınır modeli belki de yanıltıcı bir şekilde uyumlu, planlama veya sahte uyumlu olabilir. Güvenlik sorunu yeniden ifade edilir: Biz güvensiz bir modelden yararlı iş çıkarıp aynı zamanda kabul edilemez sonuçlar sağlama fırsatı veremez miyiz? Bu kontrol sorunu, yapılarına benzer klasik güvenlik: en kötü durumu, tasarım anlaşması varsayım, ve kırmızı takım baskısı altında karşısının başarısını ölçmek.

## 概念

### 威胁模型

Kontrol 假设:
- U 不可信强模型──有能力──可能是对抗性 (bu, karşıtlık olarak değerlendirilecek)
- T  可信弱模型──能力较弱,但已知不是对抗性──
- H  可信人类劳动──预算 çok küçük; genişletilmez──

系统 must use U                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

Kontrol                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

### ICML 2024 arka kapı  görev

İndirimler yarış sınıfı programlama sorunudır. U doğur bir aday çözümü. Bir gizli Oracle, çözümü içermeyeceğini işaretleyecektir.

### Dört farklı anlaşma

- **Baseline:**直接发布 U 的输出──Usefulness 最高──安全 最低──
- **Upfront auditing:**Tüm çıkış ve çıkış için H. Güvenlik en yüksek.
- **Untrusted Monitoring:**U'nun ikinci örneği ilk örneğin çıkışına bir değeri verir; H 审计被标记的输出――风险:两个 U's 实例可能串通――
- **Trusted Editing:**T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ T ⇒ ⇒ T ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒                                                                                                                                                                                                                                  

Greenblatt et al. 发现可信编辑Pareto-dominates Untrusted Monitoring:在每个安全水平上有更高的有用性──

### Neden Güvenli Düzenleme  胜

Güvensiz İzleme  U'nun ikinci örneği ilk örneğe uyum sağlayamaz. 串通可能通过steganographic cues或共享训练前例 发生──协议必须投入预算到勾结-resistance (tüzleşme-resistence) paraphrasing、obfuscation) 中,而这会降低监视的信号── Güvenli Düzenleme 完全是避免串通,因为T可信的:假设,T 提出的任何编辑都不是对抗性的──代价是T 能力较弱,因此它可能过度拒绝,或错过微的后门──

### 4 anlaşma

1. U 扮演什么角色: Sadece yapımcı, izleyici, ya da ikisi de...
2. T 扮演什么角色: editör, izleyici, ya da resampler
3. H 如何分配:uniform audit、random audit,或旗 yönlendirilmiş audit──
4. 协议在勾结-resistance 上花费多少计算──

### Düzeltme vs. kontrol

- Alignment: U 是否安全到可以信任? 第2、4、5、6、7、8、9 课都与此相关──
- Kontrol: 我们能否在不信任的情况下安全使用 U?第 10 课──

Alignment, modelin özelliğidir. Kontrol, bir uygulama protokolünün özelliğidir. Kontrol, birleştirilmiş modeller üretmez. Bu, mümkün olmayan modellerin güvenli kullanımına yöneliktir.

### Üç temel sınırlama

- İnsanların genişlemesi mümkün değil.Budjet, isteklilik denetimi zorlukları ile sınırlı.
- 可信弱模型最终会落后──T'nin düzenleme sinyali T'den çok daha zayıf olduğunda, T'in düzenleme sinyali gürültüye dönüşecek──
- Kontrol, bir uyum değildir. ASL-3'de yapılabilir.

### 2025 Yıllık Gelişmeler

UK AISI 和 Redwood 合作研究 Control Safety Cases(metr.org / redwoodresearch.org 2025): kontrol güvenlik vakası 论证, U'nun en kötü durum ihtimalinde, bu anlaşmanın sınırlaması kabul edilemez sonuçların olasılığı.

### 18'inci aşamada yer alıyor.

Bölüm 6-9  Ders tehditleri tanımlamak (Delire is possible) ◊ 10  Dersler tehditlerin gerçek olduğunu varsayarak savunma biçimlerini tanımlamak (Delire is possible) ◊ 11  Dersler birbirine karşı saldırma biçimlerini tanımlamak (Delire is possible) ◊ Skalable oversight ◊ make you  become trustworthy) ◊


```figure
al-control-protocol
```

## Kullan

`code/main.py`Bir oyuncak arka kapı 任务上模拟四种协议──U 生成输出; bunların bir kısmı带有后门──红队政策──T 批准或编辑──H 在预算内调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 在预算内被调用──H 调用.

## - Söyle.

本课生成 `outputs/skill-control-protocol-audit.md`◊ bir deployment protokolü tanımlamasını belirler, U / T / H rollerini tanımlar, anlaşma vektörlerini isimlendirir, ◊ bu protokolün kullanılabilirlik-güvenlik sınırının konumunda olduğunu tahmin eder.

## 练习

1. 运行  İşlem`code/main.py`◊ Reactions Trusted Editing vs Untrusted Monitoring'in yararlılık-güvenlik sınırı──  Identification Untrusted Monitoring'in anlaşmazlığı 假设变得关键的预算区间──

2. Yeni bir protokol ekle: T düşük sıcaklıklı bir yeniden örnekle, sonra U 編集 T の輸出── Ölçmek sınır üstündeki konum.

3. 2024 论文假设 U 可以看到协议――设计一个对 U 隐藏的输出正在审核的协议――该协议对部署基础设施有什么要求?

4. 阅读Greenblatt et al. 2024 Bölüm 7(koşulma)。 bir koşulma direncesi önerilir,并解释它的预期的有用性 成本──

5. U = GPT-4 sınıfı T = GPT-3.5 sınıfı H = 审计 1% 输出部署,清晰表述一个控制安全案──识别该案依赖于最强单一假设──

## 关键术语

| Term | 人们通常怎么说 | 它实际上的含义 |
|------|-----------------|------------------------|
| AI Control | “safety under subversion” | 在最坏情况 U 下限制不可接受结果的协议设计 |
| Untrusted model (U) | “强模型” | 我们想从中提取工作、但并不信任的有能力模型 |
| Trusted model (T) | “弱模型” | 一个较弱、已知不是对抗性的模型，用作 editor/monitor |
| Trusted human (H) | “审计预算” | 有界的专家劳动；昂贵；ground-truth 信号 |
| Trusted Editing | “T edits U” | T 作为 U 输出 gate 的协议；H 被用于模糊输出 |
| Untrusted Monitoring | “U monitors U” | 第二个 U 实例给输出打分的协议；只有额外投入后才具备 collusion-resistance |
| Control safety case | “正式论证” | 书面论证：一个协议在最坏情况 U 下限制对手成功率 |

## 延伸阅读

- [Greenblatt, Shlegeris, Sachan, Roger — AI Control (arXiv:2312.06942)](https://arxiv.org/abs/2312.06942) 经典 ICML 2024 论文
- [Redwood Research — Recent AI Control papers index](https://redwoodresearch.substack.com/) 2024-2025 后续研究
- [UK AISI + METR — Control safety cases](https://metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies/) 面向 frontier laboratuvarlarının operasyonelleştirilmesi
- [Hubinger et al. — Sleeper Agents (Lesson 7, arXiv:2401.05566)](https://arxiv.org/abs/2401.05566) kontrol ve tahminlerin tehdit modeli
