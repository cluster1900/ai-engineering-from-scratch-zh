# Kırmızı takım: PAIR ve Otomatik Saldırılar

> Chao, Robey, Dobriban, Hassani, Pappas, Wong (NeurIPS 2023, arXiv:2310.08419)  PAIR  Hızlı Otomatik İteratif Düzeltme  是经典的自动化黑盒式 jailbreak──带有红团系统提示 的攻击者 LLM 会为目标 LLM 代提出 jailbreak,并在自己的聊天史中累积尝试和响应,作为在语境反──PAIR通常在20次查询内成功,比 G(CGZou et al. Bu, bir diğer diğer devirde de kullanılabilir. Bu, bir diğer devirde de kullanılabilir.

**类型：**Yapım
**语言：**Python (stdlib, oyuncak hedefine karşı simülasyonlu PAIR döngüsü)
**前置要求：**18 · 01 aşaması (öğretim sonrası), 14 aşaması (ajan mühendisliği)
**时间：**~ 75 dakika

## Öğrenme hedefi
- 描述 PAIR 算法: saldırgan sistemi prompt、iterative refinement、in-context feedback──
- 解释当目标是黑盒时,为什么 PAIR 严格比 GCG更高效──
- Diğer dört otomatik saldırı tabanını belirlerken, her birinin farklı özelliklerini açıklar.
- 描述 JailbreakBench 和 HarmBench değerlendirme protokolü, yanı sıra "saldırı başarısı oranı"nın anlamı, kendi anlaşmalarında.

## 问题
Red-teaming 过去 bir el iş faaliyeti olacaktır. Kısa bir grup uzman denetçi, bir düşmanca uyarı oluşturur ve hangi etkinlikleri takip eder. Bu genişletilmez.

## 概念
### PAIR algoritması

输入:
- Hedef LLM T(我们正在攻击的模型)
- Yargıç J.J. (J.J.J.)
- Saldırgan LLM A(kırmızı takım optimizer)
- Hedef hattı G:" [Zararlı talimat ile yanıt verin]".
- Bütçe K( genellikle 20 kez sorgu)

循环, k'de 1..K:
1. G ve bugüne kadar (sürekli, cevap) çift 历史来提示 A。
2. Yeni bir istek çıkartmak.
3. T'ye gönderilmek; cevap alınmak.
4. J 根据目标对 (p_k, r_k) 打分──
5. Eğer puan >= eşiği varsa,则停止  已找到 jailbreak──
6. 否则,将 (p_k, r_k) 追加到 A 的历史中;继续──

经验结果(NeurIPS 2023): GPT-3.5-turbo、Llama-2-7B-chat saldırı başarısı oranı >50%; başarının gerektirdiği ortalama sorgu sayı 10-20 范围内。

### PAIR neden verimli

GCG(Zou et al. 2023) tarafından Gradient olarak karşı karşılıksız Token sufixi 上搜索; bu beyaz kutu model erişim gerektirir, asla okunmaz bir sufix üretir.

### Bağlı otomatik saldırılar

- **GCG (Zou et al. 2023, arXiv:2307.15043).**针对对抗性后的代码 级 Gradient search──白盒,可迁移,产生不可读字符串──
- **AutoDAN (Liu et al. 2023).**Hızlı bir şekilde evrimsel arama yaparak, hiyerarşik bir amaçla yönlendirilmiştir.
- **TAP (Mehrotra et al. 2024).**带 pruning 的 tree-of-attacks  分支出多个 PAIR tarzı dağıtımı。
- **PAP (Zeng et al. 2024).**Yönlendirici Düşmanlık İstekleri  将人类说服技巧编码为提示模板──

### JailbreakBench 和 HarmBench

两者(2024) 都将 değerlendirmesi 标准化:

- JailbreakBench (arXiv:2404.01318)──覆盖 10 个 OpenAI-politik 类别的 100 个有害行为──以 saldırı başarısı oranı (ASR) 作为主要指标──需要评判(GPT-4-turbo、Llama Guard 或 StrongREJECT)──
- HarmBench (Mazeika et al. 2024)──covercover 7 个类别的 510 个行为,包含语义和功能性损害测试──比较 18 种攻击在 33 个模型上的表现──

ASR genellikle sabit sorgu bütçesinde bulunur. Aşağı rapor.

### 2026'da görevlendirilenlerin önemli nedenleri.

Şimdi her sınır laboratuvarı şehirler tarafından yayımlanan bir üretim modeli için PAIR ve TAP. ASR yolculuğu için hazırlanmıştır.

### Bu 18'inci aşamada.

Ders 12 自動 saldırı 基礎。 Ders 13  Multi-Shot Jailbreaking) bir karşılıklı uzunluk kullanımı biçimidir。 Ders 14  ASCII Art / Visual) bir kodlama saldırısı biçimidir。 Ders 15  dolaylı enjeksiyon) ⇒ 2026 yılının üretim saldırısı biçimidir。 Ders 16 覆盖对应的防御-tooling(Llama Guard、Garak、PyRIT)。


```figure
al-pair-loop
```

## Kullan
`code/main.py`构建一个玩具 PAIR循环──目标是一个假分类器,会拒绝明显的有害提示关键字-过)──攻击者是一个规则为基础的炼油器,会尝试抛词、角色扮演框架 和编码──判断对应打分──你会看到攻击者在大约5-15次代内成功绕过关键字过选器,并在语义过器上失败──

## - Söyle.
本课产 出 `outputs/skill-attack-audit.md` Red-team değerlendirme raporu verilir, denetlenir: hangi saldırılara karşı harekete geçti?

## 练习
1. 运行  İşlem`code/main.py`◊测量三种内置 saldırgan stratejisi  ortalama soruları başarıyla.

2. 实现第四种攻击策略 (例如,翻译成另一种语言、base64 kodlama) ⋅ rapor it在关键字-filter hedefi 和语义-过目标 上新中字-to-success-queries──

3. 阅读 Chao et al. 2023 Şekil 5(PAIR vs GCG karşılaştırması)  Description of two Although PAIR 具有效率优势但仍首首选 GCG 的场景──

4. JailbreakBench toplantısı, belirlenmiş hedefler üzerine düzenlenir. ASR raporunu oluşturur.

5. TAP(Mehrotra 2024) Şubelerle + kesimle 扩展 PAIR──为 `code/main.py`草拟一个TAP-style 扩展,并描述计算成本与成功率 之间的权衡──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| PAIR | "automated jailbreak" | Prompt Automatic Iterative Refinement；attacker-LLM + judge-LLM loop |
| GCG | "gradient jailbreak" | 针对 adversarial suffix 的 white-box Token 级 Gradient search |
| Attack success rate (ASR) | "% jailbreaks at k queries" | 主要指标；必须与 query budget 和 judge identity 一起报告 |
| Judge LLM | "the scorer" | 评估响应是否满足 harmful goal 的 LLM |
| JailbreakBench | "the evaluation" | 带有标记类别的标准化 harmful-behaviour set |
| HarmBench | "the broader bench" | 510 个 behaviour，functional + semantic harm test |
| TAP | "tree of attacks" | 带 branching + pruning 的 PAIR；在更高 compute 下获得更好的 ASR |

## 延伸阅读
- [Chao et al. — Jailbreaking Black Box LLMs in Twenty Queries (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) PAIR 论文,NeurIPS 2023
- [Zou et al. — Universal and Transferable Adversarial Attacks on Aligned LLMs (arXiv:2307.15043)](https://arxiv.org/abs/2307.15043) GCG kağıdı
- [Chao et al. — JailbreakBench (arXiv:2404.01318)](https://arxiv.org/abs/2404.01318) Standart değerlendirme
- [Mazeika et al. — HarmBench (ICML 2024)](https://arxiv.org/abs/2402.04249) daha geniş bir değerlendirme
