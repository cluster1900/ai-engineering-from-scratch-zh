# Doğrudan Tercihleri Optimize Family

> Rafailov ve diğerleri (2023) RLHF'nin en iyi çözümünün tercih verileri ile  written into closed form olarak yazılabileceğini kanıtlıyor, bu nedenle açık ödüllendirme modelinden, doğrudan optimizasyon politikasından geçebilirsiniz. Bu açıdan bir aile:IPO,KTO,SimPO,ORPO,BPO, her yöntem DPO'nun bir başarısızlık modunu düzeltti. 2026 yılına kadar, sınır sonrası eğitim                                                                                                                                                                                                                                                                                                                                                                                                                        

**Type:** Learn
**Languages:** Python (stdlib, 六种 preference-loss comparator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking), Phase 10 · 08 (DPO basics)
**Time:** ~75 分钟

## Öğrenme Hedefleri

- KL'nin RLHF'si, DPO'nun kapalı biçiminde bulunmaktadır.
- Açıklama: IPO ̊KTO ̊SimPO ̊ORPO ̊BPO DPO'nun hangi başarısızlık modunu kendiliğinden düzeltti.
- 区分implicit reward gap和preference strength,并解释 IPO'nun kimlik haritalaması neden önemlidir?
- 解释为什么 Rafailov et al. (NeurIPS 2024) 证明 DAAs 即使没有显然 RM 也会过度优化──

## 问题

RLHF amacı:

```text
max_pi E_{x,y~pi} [ r(x, y) ] - beta * KL(pi || pi_ref)
```

En iyi çözüm var:

```text
pi*(y|x) = (1/Z(x)) * pi_ref(y|x) * exp(r(x, y) / beta)
```

Bu nedenle ödül, optimum politika ile referans oranı olarak tanımlanır:

```text
r(x, y) = beta * log(pi*(y|x) / pi_ref(y|x)) + beta * log Z(x)
```

Bradley-Terry tercih olasılığı fonksiyonuna çevir.`Z(x)`Bu sadece bir şeyle bağlı.`x`                                                                                                                                                                                                                                                              

问题在于: 推导假设最优解可达、偏好数据是在分发,并且参考政策是真正的模式

## 概念

### DPO (Rafailov et al., 2023)

```text
L_DPO = -log sigmoid(
  beta * log(pi(y_w | x) / pi_ref(y_w | x))
  - beta * log(pi(y_l | x) / pi_ref(y_l | x))
)
```

Yanlış bir yerde olabilir:

- - Ödül farkı .`beta * (log(pi/pi_ref)_w - log(pi/pi_ref)_l)`Bu, sınırsız bir tercih.
- Bu kayıp, seçilen ve reddedilen log-probleri 往相反方向推──, eğer reddedildiğinde, aşağı daha hızlı düşerse, seçilen mutlak log-probleri 往下推──, bu, Degraded Chosen Response 现象──
- Distribüsiyon dışı tercihler (rare sample vs. rare sample) herhangi bir şekilde içeren ödüller elde eder.

### Açıklama (Azar et al., 2024)

Kimlik Tercihi Optimize edilmesi; tercihleri kullanma olasılığı;                                                                                                                                                                                                                                                     

```text
L_IPO = (log(pi(y_w | x) / pi_ref(y_w | x)) - log(pi(y_l | x) / pi_ref(y_l | x)) - 1/(2 beta))^2
```

Marjin `1/(2 beta)`限定── üstünlük gücü ve içten ödül farkı 成比例──不会爆掉──

### KTO (Ethayarajh et al., 2024)

Kahneman-Tversky Optimizasyon  tamamen çiftli struktur ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅    ⋅                                                                                                                                                                                                                 

```text
v(x, y) = sigma(beta * log(pi(y|x) / pi_ref(y|x)) - z_ref)
```

Not against gains and losses Use different weight weight (Düzgün olan ise, eşleşmemiş verileri kullanabilirsiniz, bu tür veriler çok daha fazla olmalıdır.

### SimPO (Meng et al., 2024)

Basit Seçenek Optimizasyonu 让训练信号与生成过程对齐―― tamamen kaldırma referans politikası,并按长度归归化日志-概率:

```text
L_SimPO = -log sigmoid(
  (beta / |y_w|) * log pi(y_w | x)
  - (beta / |y_l|) * log pi(y_l | x)
  - gamma
)
```

Uygulama Marjı`gamma`DPO uzunluk-bias başarısızlık modunun kullanımı teşviklerini kaldırmak için uzunluk birleştirme eğitimi yapıldı.`y_w`Yapımcılık üzerinde daha büyük bir log-prob boşluğu getirir.

### ORPO (Hong et al., 2024)

Odds-Ratio Preference Optimization standard SFT negatif log-probability 上添加一个偏好术语:

```text
L_ORPO = L_NLL(y_w) + lambda * L_OR
L_OR = -log sigmoid(log(odds(y_w) / odds(y_l)))
```

SFT terimi, düzenleyici, temel modelden uyumlu modelye kadar tek bir aşama eğitim gerektirir.

### BPO (ICLR 2026 başvurusu, OpenReview id=b97EwMUWu7)

识别了 Degraded Chosen Answers 问题:DPO 会保持排序 `y_w > y_l`Ama ...`y_w`Llama-3.1-8B-Instruct'un matematik düşünce görevine göre, DPO doğruluk oranı %10.1 oranında artmıştır.

### Genel Genel sonucu: DAA'lar  hala aşırı optimize

Rafailov et al. Skaling Laws for Reward Model Overoptimization in Direct Alignment Algorithms (NeurIPS 2024) 在多个数据集和不同 KL budgets 下, DPO、IPO、SLiC 训练政策──gold-reward-vs.KL 曲线呈现出与Gao et al. 相同的峰值-崩塌形──暗黙奖励在训练期间查询出发散样品;KL düzenlenmesi 无法稳定这一点──

DAAs Goodhart'tan kaçmadı. Onlar sadece sorunları insan yüzeyinde  ödül modeliden  ödemeden optimize edilmiş  değiştirilmiş  referans politika oranına  optimize edilmiş 🏼 genel geri dönüş yöntemleri, yani daha iyi veri  ansambl  erken durma,  ikisi de uygundur

### 如何选择(2026)

- Eğer çok sayıda çiftli tercih verisi varsa: Conservative beta'nın DPO's'unu kullanın; uzunluk farkı belirginse, SimPO'yu kullanın.
- Eğer eşleşmemiş ikili geri bildirim varsa: KTO。
- Eğer temel modelden çıkmak istiyorsan tek aşama borusunun:
- Eğer DPO kayıtlarında aşağılanmış seçilmiş kayıt kayıtlarını görürsen:
- Eğer tercih güçleri 差 çok büyük ve DPO 正在和:IPO。

Her laboratuvar bir grup değerlendirmede bu beş yöntemi tamamlar ve sonra görevlere göre kazananı seçer.


```figure
dpo-margin
```

## Kullan

`code/main.py`Bir oyuncak tercih verisi üzerinde altı çeşit kayıplara göre göre, gerçek tercih gücü bir çift değişir. Her kayıp aynı 500 çift örnekte bulunur.

## Gönder

本课产 出 `outputs/skill-preference-loss-selector.md` belirlenmiş veri kümesi istatistikleri (parlı vs eşsiz, değişken vs. tutarlı tercih gücü, uzunluk dağılım) ve hedef (tek aşamalı veya SFT-den sonra tercih), bir tercih kaybı önerilir,并报告 it protection failure mode──

## 练习

1. 运行  İşlem`code/main.py` Rapor DPO ve BPO'nun son seçilmiş log-prob düşüşü. BPO'nun seçilen mutlak olasılık daha yüksek olması gerekir, lütfen bunu doğrulayın.

2.  Seçenek verilerini değiştirin, tüm çiftlerin aynı güçlere sahip olması için                                                                                                                                                                                                                                                                                                   

3. 让拒绝答案的平均长度变成所选的2倍――在不改变其他任何内容的情况下, DPO'nun uzunluğu kullanımı ve SimPO'nun düzeltmesi için sayısal değer kullanın.

4. Rafailov et al. (NeurIPS 2024) 声称 DAAs 会过优化──复现一个单点版本:绘制选选减拒的 KL差异,并观察大beta 下 DPO 的过优化──

5. BPO'nun o bir düzeniye eklenmiş.`code/main.py`İçinde gerçekleştirilen doğrulama:

## Anahtar Terimler

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DPO | “没有 reward model 的 RLHF” | 从 RLHF 闭式最优解推导出的 loss；只含 policy parameters |
| Implicit reward | “log-ratio” | `beta * log(pi(y\|x) / pi_ref(y\|x))`，也就是 DPO 隐含的 reward |
| IPO | “bounded DPO” | 用 identity 替换 log-sigmoid；implicit reward gap 被 `1/(2 beta)` 限制 |
| KTO | “unpaired DPO” | 在带有 loss aversion 的单标签上使用 prospect-theory utility |
| SimPO | “reference-free DPO” | 长度归一化 log-likelihood + margin；没有 reference policy |
| ORPO | “one-stage DPO” | NLL + odds-ratio preference term；从 base model 单次训练完成 |
| BPO | “chosen-preserving DPO” | DPO 加上对 chosen response 绝对 log-prob 下降的惩罚 |
| Degraded Chosen | “chosen 下降了” | 只要 rejected 下降得更快，DPO 就会降低 chosen log-prob |
| DAA | “direct alignment algorithm” | 任何跳过显式 RM 的 preference-loss 方法 |

## Daha Fazla Okumak

- [Rafailov et al. — Direct Preference Optimization (NeurIPS 2023, arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
- [Azar et al. — A General Theoretical Paradigm to Understand Learning from Human Preferences (AISTATS 2024, arXiv:2310.12036)](https://arxiv.org/abs/2310.12036) Açıklama
- [Ethayarajh et al. — KTO: Model Alignment as Prospect Theoretic Optimization (arXiv:2402.01306)](https://arxiv.org/abs/2402.01306)
- [Meng, Xia, Chen — SimPO (NeurIPS 2024, arXiv:2405.14734)](https://arxiv.org/abs/2405.14734)
- [Hong, Lee, Thorne — ORPO (EMNLP 2024, arXiv:2403.07691)](https://arxiv.org/abs/2403.07691)
- [BPO — Behavior Preservation Optimization (ICLR 2026 OpenReview b97EwMUWu7)](https://openreview.net/forum?id=b97EwMUWu7)
- [Rafailov et al. — Scaling Laws for RM Overoptimization in DAAs (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)
