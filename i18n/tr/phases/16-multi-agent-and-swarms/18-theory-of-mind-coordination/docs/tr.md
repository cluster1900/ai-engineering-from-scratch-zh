# Zihn Teorisi ve Çeviri Koordinasyonları

> Li et al. (arXiv:2310.10701) 表明,合作型文本游戏中的 LLM ajanları 会表现出**涌现式高阶 Theory of Mind**(ToM)                                                                                                                                                                                                                                                             **只有**ToM-prompt  koşulları, kişilik ile ilişkili ayrım ve hedef yönlendirme ile tamamlanır; düşük yetenekli LLM'ler sadece sahte bir ortaya çıkış ortaya çıkar.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**16 · 07 aşaması (Akıl ve Tartışma Topluluğu), 16 · 17 aşaması (Genereatif ajanlar)
**Time:** ~75 minutes

## 问题

Çoklu ajan  koordinasyon sık sık harika görünür: ajanlar 分工、预判彼此、避免重复── genellikle bu 涌现是快速工程的产品 有人告诉代理人要协调──移除快速,协调也随之消失──

Riedl 2025'in bulguları daha sıkı: kontrol altında, sadece ajanlar karar vermeleri için uyarılır**其他 agents 的 minds**(ToM) 时,协调才会涌现―― ToM prompt yok, güçlü modeller bile istatistik kontrolden geçemez bir koordinasyon modeli olarak ortaya çıkar―― bu üretim ortamı için önemlidir: ekip yayınladığı multi-agent koordinasyon fonksiyonu genellikle hızlı ve çok kırılganıya bağlıdır――

Bu ders ToM'yi belirli bir yetenek olarak görüyor, inanç hakkında düşünüyor, en az ToM-a-ağır bir ajan oluşturur ve gerçek koordinasyon ile hızlı bir modifikasyon göstergesi arasındaki farkı ölçüyor.

## 概念

### Ne yapıyorsun ?

发展心理学:3 岁儿童认为任何人的内在世界都与自己一致──5 岁儿童理解他人有不同信仰──7 岁儿童推理关于信仰的信念──她认为我认为球在杯下面)──这些分别是零阶段,一阶段和二阶段 ToM──

LLM ajanları için,

- **Zeroth-order:**Başkalarının modeli yok. Sadece kendi gözlemlerinize dayanarak.
- **First-order:**Ajanın inanç modeline sahip olmak. Alice X'e inanıyor.
- **Second-order:**Agent 建模递归信念──Alice Bob'un X'e inandığına inanıyor.

Li et al. 2023'te, birinci aşama ve ikinci aşama ToM'de işbirliği oyunlarında LLM ajanları 里涌现, ancak uzun ufaklık ve güvenilir olmayan iletişim ile geri dönüşeceğini buldular.

### Sally-Anne testi 简述

Bir 1985 sahte inanç testi: Sally Bir taş taşyı Çerez A'ya koyup sonra terk etti. Anne Onu Çerez B'ye koyup gitti. Sally tekrar geldiğinde nerede bulacak?

GPT-4 çağının LLM'leri doğrudan önerilen Sally-Anne tarzı testlerinde geçebilir. Hikaye uzunsa, olaylar çok değişir veya sorunlar dolaylı olarak ifade edilirse, bunlar başarısız olur.

### Riedl'ın koordination measurement

Riedl (arXiv:2510.05174) 构建一个群体规模测试:N 个代理,一个合作目标,可变快速条件――测量:

1. **Identity-linked differentiation.**Ajanlar zamanla sabit bir rol ayrımı oluşturur mu?
2. **Goal-directed complementarity.**Ajanların hareketleri birbiriyle karşılaştırılmalı mı, tekrarlanmak yerine?
3. **Higher-order synergy.**Bir grupun herhangi bir grupta gerçekleşemeyeceği sonuçları gerçekleştirmediğini belirlemek için kullanılan bir istatistik ölçüsü.

Sonuç: Sadece ToM uyarısı  koşullarında, üç gösterge tamamı başlangıç çizgisinden yüksek sinyaller üretir. ToM uyarısı olmadan, orta yetenek modelinin göstergesi hızla yaklaşır.

### 协调幻觉

statistik kontrol yokken, demonun ortasındaki emergent koordinasyon genellikle şunları yansıtır:

- Hızlı mühendislik, koordinasyon, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, interneş, ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş ş
- 观察者偏差 (bkz: gözlemci öne çıkması)
- Başarılı bir seçim yapın.

Eğer üretim sistemi, belirlenmiş sinyal olmadığı halde emergent koordinasyonu  ilan ederse, bunu satış olarak görmelidir.

### En az bir A.M.A. ajanı var.

结构:

```
agent state:
  own_beliefs:    {facts the agent believes}
  other_models:   {other_agent_id -> {beliefs_the_agent_attributes_to_them}}
  actions_last_N: [history of others' actions]

observation update:
  - update own_beliefs from direct observation
  - update other_models[agent_id] from their action + prior beliefs

action selection:
  - enumerate candidate actions
  - for each, predict what each other agent will do next given their modeled beliefs
  - pick action that maximizes joint outcome under those predictions
```

`other_models`属性就是 ToM devletı。一阶 ToM 只保留一层──二阶加入 `other_models[i][other_models_of_j]`Agentiyi ben düşünüyorum.

### Neden uzun vadede zarar görürsün?

Li et al. 记录:context limits will lead agents  forget which beliefs belong to whom──Hallucination will put false beliefs into other-agent models──两者都会产生我以为他认为X的错误,并随时间复合──

Rapor ve 2024-2026  后续研究中记录的缓解方式:

- **在 prompt 中显式写出 ToM state.**结构化格式:`{agent_id: belief_list}`❖ Zorla geri alınması 保留身份-信念绑定──
- **更短的 reasoning chains.**Her seferinde daha az ToM güncellemesi halüsinasyonları azaltabilir.
- **外部 ToM store.**LLM bağlamında  dışında 维护模型; her tur sadece 注入相关部分──

### Üretim içinde başarısız olacaksınız .

- **Adversarial settings.**İyi bir ToM ajanı daha kolay kullanılır. Onları nasıl kullanacağını da kullanabilirsin.
- **Heterogeneous teams.**Model farklı olduğunda, bir rakip için uygulanacak bir ToM modeli yaygınlaşmaz.
- **Ground-truth-dependent tasks.**İnançlara odaklanmak; eğer doğruluk gerçeklere bağlıysa, dikkat dağılabilir.

### Gerçek enerji ölçüm koordinasyonu

判断团队协调是真实的,而不是快速修改的三个实用信号:

1. **Complementarity over time.**Çok dönümlü görevler içinde, ajanların hareketleri üst üste olmayan alt görevleri kapsar mı?
2. **Anticipation.**A'nın T+1'deki hareketinin B'ye karşı T+2'deki hareketin tahminine bağlı olup, tahminin daha sonra doğru olduğu kanıtlandı mı?
3. **Correction.**Birinci dönüşte T  yanlış okuduğunda B'nin inancı, birinci dönüşte T + 2 önceden düzeltilmiş mi?

Bunlar, bir tarihçinin çoklu ajan sistemiyle ölçülür.


```figure
sw-theory-of-mind
```

## Yapın onu.

`code/main.py`实现:

- `ToMAgent` Kendi inançlarını ve diğer her ajanın inanç modelini takip et.
- Bir işbirliği görevi: üç ajan üç kutudan üç tane Token toplamalıdır; her kutuda sadece bir tane Token yerleştirilebilir.
- 两种配置:`zeroth_order`(Barsı)`first_order`(Yüce inanç modeline sahip)
- 200 kez rastlantı deneyinde ölçüm: tamamlama oranı, tekrarlama oranı, iki ajanın aynı kutuya hedeflenmesi, ortalama tamamlama sıra sayısı.

运行:

```
python3 code/main.py
```

预期输出:zero-order ajanlar yaklaşık %35 oranında tekrar çalışacak ve 10 tur içinde yaklaşık %60 denemeyi tamamlayacaklar.

## Kullan

`outputs/skill-tom-auditor.md`Bu, kontrol sisteminin çoklu ajanlar tarafından yapılan denetimlerin ortaya çıkışlı koordinasyonlar için yapılan açıklamaları kontrol etmek için kullanılan bir beceri.

## Yayınla

协调声明 kontrol listesi:

- **Control condition.**Sisteminiz koordinasyon sürümünü kaldırıyor.
- **Statistical test.**Sistem ve kontrol arasındaki farkın farkı belirteci olarak var mı?`p < 0.05`- Görkemli mi?
- **Complementarity measure.**Zamanla hareketler birbiriyle yüklenmez, sadece sonuçta başarılı olmaz.
- **Failure-case log.**Ajanlar koordinasyon başarısız olduğunda, devletin ne yapacağını biliyor musun?
- **Model-capacity disclosure.**Eğer daha küçük bir modelde sonuçlar kaybolursa, açıkça gösterilmiştir.

## 练习

1. 运行  İşlem`code/main.py`❖ Bir aşamada tekrar oranının yaklaşık 7 kat azalmasını onaylayın. 5 ajan ve 5 kutuya kadar genişlediğinde bu fark hâlâ var mı?
2. 实现二阶 ToM(agent A 建模 B 如何看待 C) ・・・¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
3. Bir kez giriş yapın.**hallucination**Bu bir aşama performansını ne kadar düşürecek?
4. 阅读 Li et al. (arXiv:2310.10701)。复现长视线降低发现:当轮数从10 增加到30 时,你的一阶 ToM 性能如何变化?
5. Riedl 2025 (arXiv:2510.05174) ⇒ On your模拟日志上实现高级协同化统计――没有 ToM prompt 条件时,这个效果是否存在?

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Theory of Mind | “理解他人的 minds” | 建模另一个 agent 信念的能力。按阶数分级（0、1、2+）。 |
| Sally-Anne test | “false-belief test” | 1985 年发展心理学；LLMs 能通过简单版本，但会在复杂版本失败。 |
| First-order ToM | “A believes X” | 建模一个他人关于事实的信念。 |
| Second-order ToM | “A believes B believes X” | 更深一层的递归建模。 |
| Identity-linked differentiation | “随时间保持稳定角色” | Riedl 的指标：角色持续存在，而不是随机。 |
| Goal-directed complementarity | “不重叠行动” | agents 目标指向不同子任务，而不是同一个。 |
| Higher-order synergy | “群体超过任何子集” | Riedl 用于真实协调的统计度量。 |
| Coordination illusion | “看起来协调” | 没有可测信号的 prompt 修饰式协调表象。 |

## 延伸阅读

- [Li et al. — Theory of Mind for Multi-Agent Collaboration via Large Language Models](https://arxiv.org/abs/2310.10701) 合作游戏中的涌现式 ToM; uzun vadede başarısızlık modları
- [Riedl — Emergent Coordination in Multi-Agent Language Models](https://arxiv.org/abs/2510.05174) 群体规模测量;TM isteklenmesi 承重条件
- [Premack & Woodruff — Does the chimpanzee have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-chimpanzee-have-a-theory-of-mind/1E96B02CD9850E69AF20F81FA7EB3595) ToM 概念在 1978 yılında ortaya çıktı
- [Baron-Cohen, Leslie, Frith — Does the autistic child have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-autistic-child-have-a-theory-of-mind/) Sally-Anne 论文(1985)
