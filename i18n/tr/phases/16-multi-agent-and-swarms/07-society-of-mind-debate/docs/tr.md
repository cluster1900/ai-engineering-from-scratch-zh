# Zihn Topluluğu ve Çoklu Ajanlar Tartışması

> Minsky, 1986'da, yani zeka uzmanlardan oluşan bir toplumsaldır, her on yılda bir kez yeniden keşfedilecek. 2023 yılında, Du et al. bunu bir algoritma haline getirecek: çok sayıda LLM örneği  cevaplar sunmak, birbirlerinin cevaplarını okumak, eleştirileri, ve güncelleştirmeleri. N 轮 boyunca, altı mantık ve gerçeklik  görevinde sıfır atışlı CoT ve düşünce üzerinde bir fikir birliğine ulaştılar.**multiple agents**和 **multiple rounds** Özgür katkı  Toplum  Tek ajan monologu  Çoklu değişim  Tek atış oylaması 

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 问题
Kendi kendine tutarlılık, yani bir model için en ucuz mantık, bir daha iyileştirmek için en ucuz mantıktır.

Tartışma 打破了这种和──不是从一个模型 取 N个独立样本,而是让 N个代理 阅读彼此的推理并修复──样本之间的相关性下降(它们不再是和),并且临近点 常常在选自信地错时给出正确答案──

## 概念
### 2023 算法

ArXiv:2305.14325 (ICML 2024)'den:

1. N 个代理中的每个都为问题产生一个初始答案――
2. R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R: R:
3. R 轮后, son cevabı çoğunlukla oylamayı.

论文在 MMLU、GSM8K、biografi、MATH 和 gerçeklik referansları 上测试。Debat 持续优于 CoT 和自我反思──

### İki bağımsız dönüm

Aynı bir makalede yer alan ifadeler:

- **Agent count alone**(N 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个
- **Round count alone**(1 个代理 见自己的先前推理) neredeyse hiç yardımcı değil, yani yansımanın bilinen zayıf noktası.
- **Both together** Büyük bir artış getirmiştir.  Bir çok ajan arasındaki çok yönlü değişim  artışa yol açmıştır.

### Neden işe yarıyor?

İki mekanizma:

1. **暴露于分歧。**Bir ajanın diğer ajanın mantık zincirini gördüğünde farklı sonuçlar çıkarırken, bu ya haklı çıkarmak ya da güncelleştirmek zorunda.
2. **相关错误减少。**Kendi kendine tutarlılık içinde, tüm örnekler aynı modelden gelir, bu nedenle hatalar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

### Çeşitli tartışma

A-HMAD 和相关后续工作为不同代理 使用 *不同基模型*──Llama + Claude + GPT tartışması Monoculture çöküşünü azaltır(Lesson 26), çünkü bir model ailesi ile ilgili hatalar diğer model aileleri tarafından paylaşılmayacak.

缺点:弱模型 参与辩论 时可能会把共识 拉向它的错误答案 (((见 Delişmeliyiz mi?, arXiv:2311.17371)

### NLSOM  129-agent 扩展

Zhuge et al. Mindstorms in Natural Language-Based Societies of Mind, arXiv:2305.17066)  will this idea expand to 129 成员社会── sonuç: uzmanlaşmak 和 kendi kendine kuruluş 随规模涌现,并且系统在视觉问题答等任务上优于单代理──

### Başarısızlık modları

- **Sycophancy cascade。**Bütün ajanlar en güvenli ajanı dinler. Tartışma en büyük görüşe dönüşür.
- **Topic drift。**Birçok kez tartışılır.
- **Compute blowup。**N ajan × R turları = N·R ikinci LLM çağrıları, her seferinde çağrıların bağlamı DATABAN WARSING.


```figure
multi-agent-debate
```

## Yapın onu.
`code/main.py`Bir matematik sorusunda 3 ajan × 3 tur tartışma yürütülür, her ajan farklı bir cevaptan başlar.

Demo iki önemli etkeni gösterir:

- Tek sefer değişimi ajanları doğru cevaba daha yakın hale getirir.
- 2. tur sonrası ekstra turlar düşen getiriyi göstermektedir.

运行:

```
python3 code/main.py
```

## Kullan
`outputs/skill-debate-configurator.md`Yeni görev konumu tartışması: ajanlar sayı, döngüler sayı, heterogenlik, aynı model karşılaştırıldığında rol atama, simetrik karşılaştırıldığında bir karşılaştırıldığında rol atama.

## - Söyle.
Eğer online tartışmaya çıkmak istiyorsan:

- **将 rounds 上限设为 3。**Du et al.  gösterir 3 rün büyük bir artış elde etti.
- **将 agents 上限设为 5。**超過 5 后, bağlam şişkinliği 和成本占主导──
- **默认 heterogeneous。**池中 en az iki farklı temel model.
- **Adversarial slot。**Bir ajanı nasıl olursa olsun tavsiye ederiz.
- **记录每一轮。** Hide intermediate rounds  debate systems  cannot debug or audit──

## 练习
1. 运行  İşlem`code/main.py`Sonra da 5 olarak sayılır, düşen getiriyi gözlemler. Hangi sıra ek bir dönüşüm durdurur?
2. 添加一个带有敌意作用的第四个代理:始终与当前多数不同意─── bu, yakınlaşmayı bozmaya mı yoksa iyileştirmeye mi yardım eder?
3. 绘制(打印) her turda anlaşma puanı(Stop majority answer 上的代理 比例) ・・・ ne zaman 1.0'a ulaşır?
4. Bölüm 4 ablations。 kullanın bu kod 复现 Agent-only vs Rounds-only vs both 结果。
5. 阅读 Delili miyiz? (arXiv:2311.17371),并列出 round-robin 之外的两个辩论变化,例如法官领导的辩论链的辩论的反辩

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Society of Mind | “Minsky 的想法” | Intelligence 是互动专家集合；1986 年的 framing 现在通过 LLM debate 被 operationalized。 |
| Multi-agent debate | “Agents 争论” | N 个 agents 提出答案、相互 critique、经过 R 轮 revise，然后 majority-vote。 |
| Consensus | “他们达成一致” | 不是 epistemic truth，只是 fraction-on-majority-answer。可能自信地错误。 |
| Rounds | “Exchange steps” | 一轮 = 每个 agent 读取其他 agents 并 update 一次。 |
| Heterogeneous debate | “混合 model families” | 使用不同 base models 来去相关 errors。 |
| Sycophancy cascade | “每个人都同意那个大声的人” | 一种 debate failure：agents 不管正确性如何，都顺从最自信的 agent。 |
| NLSOM | “129-agent society” | Natural-language society of mind；Zhuge et al. 的 scaled version。 |
| Correlated error | “同一个 model，同一个 bug” | self-consistency 饱和的原因；跨不同 views 的 debate 会去相关。 |

## 延伸阅读
- [Du et al. — 通过 Multiagent Debate 提升 Language Models 的事实性与推理能力](https://arxiv.org/abs/2305.14325) İpucu kağıdı,ICML 2024
- [Zhuge et al. — Mindstorms in Natural Language-Based Societies of Mind](https://arxiv.org/abs/2305.17066) 129-ajan NLSOM
- [Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs](https://arxiv.org/abs/2311.17371) Referans tartışma çeşitleri
- [Debate project page](https://composable-models.github.io/llm_debate/) Du et al.  kod, demos ve ablation detayları
