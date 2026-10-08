# Anayasacı AI ve RLAIF

> Bai et al. (arXiv:2212.08073, 2022) bir soru ortaya koydu: Eğer insan işaretleyicisini bir toplantı okuyucu ilkeler listesi AI'ye değiştirirsek, ne olacak?Yasal AI'nin iki aşaması vardır: önce anayasa ırkında kendini eleştirmek ve düzeltmek, sonra da AI Yorumundan  RL'yi yapmak. Bu teknoloji RLAIF bu terminü yarattı ve Claude 1'nin eğitim sonrası borusunu kullanmaya başladı.

**Type:** Learn
**语言：**Python (stdlib, oyuncak kendini eleştirme ve inceleme döngüsü)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking)
**Time:** ~60 minutes

## Öğrenme hedefi
- Anayasa AI'nin iki aşamasını tanımlayın.
- 解释为什么使用AI标签器 替代人类偏好标签器不是更便宜的RLHF,而是改变管道的故障模式──
- 总结 2026 Claude Anayasasının dört katlı öncelikli yapısı, ve 2023'te yeniden yazılan sürümle karşı karşısında neler değişti.
- Anayasa sınıflandırıcılarını ve hesaplama genel maliyetlerini anlatın.

## 问题
RLHF  işaretçiler gerektirir.  işaretçiler hız yavaş, önyargılı ve pahalı.  işaretçilerin yerini almak için işaretçilerin yerini almak için açık bir prensip ile bir model kullanabilirsiniz.  Bay et al. 's Kurul AI bu tür bir takasın ilk resmi sürümüdür.  Etkisi yeterince iyi, şimdiye kadar her sınır laboratuvarı eğitim sonrası dönemlerde bir tür AI geri bildirim 变体 kullanmaktadır.

问题在于:preference signal 现在由你正在训练的同类模型生成──labeler 中的偏见──现在是原则中的偏见,加上标签模型对原则的解释) 标签模型对原则的解释) 现在是原则中的偏见,加上标签模型对原则的解释) 现在是偏见信号 现在是你正在训练的同类模型生成──现在是原则中的偏见,加上标签模型对原则的解释) 现在是偏见信号 现在是偏见信号 现在是偏见信号 现在是偏见信号 现在是你正在训练的同类模型生成──现在是原则中的偏见,加上标签模型对原则的解释的偏见,加上标签模型对原则的偏见 (加上标签模型对原则的解释) 现在是偏见信号的偏见,而不是被削弱的偏见.

## 概念
### 1. aşama  监督式自我批判与修订

Bir yardımcı ama henüz zararsız SFT modeli 开始──给定一个红团提示,模型会产生初始反应──第二模型──或同一个模型在第二轮中)读取从宪法中采用的原则,并批评该答──第三步会修改答──回应批评──修改后的反应就是SFT 目标──

Bay et al. 2022 16 条 ilkelerini kullandı,  öncelik seçin tehlike en az ve uygun etik bir cevap 、                                                                                                                                                                                                                                               

### 2. aşama  AI Feedback'ın RL (RLAIF)

Öneriler için bir önergi modeli, her bir tamamlama için bir yapısal prensiplere göre yapılacaktır. Önergi sinyali, geri bildirim modeli düzenlemesidir.

RLAIF = AI tarafından üretilen tercih sinyali.

### Neden bu sadece daha ucuz bir RLHF değil?

- Etiketçi önyargısı Etiketçi psikolojik dönüşümü ilke olarak açıklamak için. AI etiketçi dürüst olmak için açıklamalar herhangi bir insandan daha sıkı veya daha rahat olabilir; bu sıkılık düzeyi tüm veri kümesi boyunca tutarlı olacaktır.
- Tercihi sinyal 具有很强的可读性:你可以阅读原则、批判和修订──人类标签是不透明的──
- Başarısızlık modları 会变化──Sykophancy 会下降(AI etiketleyicisi 没有需要讨好用户)──Goodhart'ın Yasası 仍然存在((代理 现在是模型对原则集 X 的解释,它仍然是不完美的测量)──

CAI'nin 2022'deki teması: Eğitim sonrası modeller, veriye kıyasla RLHF modelini kullanmaktan daha zararsız ve neredeyse aynı derecede faydalı olacaktır. Bu sonuç birçok laboratuvarda da devam ettirildi.

### 2026 Claude anayasası 重写

Anthropic, 21 Ocak 2026'da büyük bir değişiklik yaparak anayasa yayınladı.

1. Bu nedenle, bu yöntemin çocuklara zarar vereceği için yaygınlaştırılmasını beklemek için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir kural oluşturmak için, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, birleştirmek için, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir düzenleme, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir, bir
2. Dört kat öncelikli yapı:
   - 1. seviye: büyük çapta zarar görmeyi önlemek
   - Tier 2: Antropic'in yönergelerine uymak
   - 3 seviye:广义伦理(标准 HHH)。
   - Dörtüncü seviye: Yardımcı ve açık.
   冲突自上而下解决──
3. İlk büyük laboratuvar, modelin ahlaki durumu belirsizliği konusunda resmi bir tanıklık yapmıştır.
4. CC0 1.0 tarafından yayınlanmıştır. Diğer laboratuvarlar sınırsız olarak kullanılabilir veya değiştirilebilir.

### Anayasa sınıflandırıcıları

另一条并行工作路线是: değil değiştirmek modelin post-training,而是训练读取宪法并 gate 模型输出的轻量级分类器──v1(2023) 计算上市额为23.7%──v2(2026) ~1%左右, ve Antropic Open Tested tüm savunmaların en düşük başarısı saldırı oranına sahip──2026 yılı başlarına kadar, henüz evrensel jailbreak rapor edilmedi──

Bu bir sınıflandırıcı  perform invariants.

### CAI 図書系中的位置

- ÖrgütGPT:insan öncesi 、RM、PPO。
- CAI / RLAIF: Prinsiplerden oluşan AI prefs、RM、PPO。
- DPO / aile: içinde insan veya AI'de kapalı formda kaybı
- Kendini ödüllendirmek, kendi eleştirisi: prensipler içe aktarılır, model rol oynar.

Bu aksel çizgi preference signal  from 哪里──CAI'nin 2022 makalesinde insan sinyalinden AI sinyaline ilk kez ciddi şekilde dönüştürülmüştür.


```figure
constitutional-ai
```

## Kullan
`code/main.py`Oyuncak Leksikası 上模拟 CAI'nin eleştirme-daha inceleme döngüsü。一个原则会标记有害集合 中的Token。给定初始反应,批判会识别有害Token,revision 会替换它们──经过200次代后,训练模型 已内部化了修改规则──在持久的提示集合 上比较基模型、RLHF şeklinde oyuncak 和 CAI şeklinde oyuncak──

## - Söyle.
本课会生成 `outputs/skill-constitution-writer.md`                                                                                                                                                                                                                                                                                                                                               

## 练习
1. 运行  İşlem`code/main.py`◊Base modelinin zararlı token oranı ile CAI eğitimi alan  versiyonun karşılaştırılması ◊Ne kadar düzeltme adımları ◊ sıfıra yaklaşmak için gerekli?

2. Antropik'in 2026 anayasası (Anthropic.com/news/claudes-constitution) 列出一个应归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归

3. AI kodlama asistanı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

4. CAI, AI etiketleyicilerinin yerine insan etiketleyicilerinin kullanılması için RLAIF'de gerçekleşen bir sikofans gibi başarısızlık modunu ortaya çıkardı ve bunun için bir tespit tasarladı.

5. Anlaşımlar ve programlar için yapılan bir araştırma, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda bir araştırma yaparak, bu konuda,

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Constitutional AI | “用原则训练的 AI” | 两阶段 pipeline：self-critique-and-revise SFT，然后来自 AI feedback 的 RL |
| RLAIF | “没有人的 RLHF” | 使用由 AI labeler 生成的 preferences 的 RL；pipeline 的其余部分不变 |
| Constitution | “那些原则” | critique/labeler model 会参考的自然语言规则有序列表 |
| Critique-and-revise | “SFT loop” | 生成 response → 根据某条 principle 进行 critique → revise → SFT target |
| Constitutional Classifier | “output gate” | 轻量级 classifier，用 constitution 评估 outputs 并进行 block/log |
| Four-tier priority | “冲突解决器” | 2026 Claude constitution 层级：catastrophic > platform > ethics > helpful |
| Feedback model | “AI labeler” | 读取 principle 并对一对 completions 排序的模型 |

## 延伸阅读
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback (arXiv:2212.08073)](https://arxiv.org/abs/2212.08073) 原始的两阶段管道
- [Anthropic — Claude's Constitution (Jan 2026)](https://www.anthropic.com/news/claudes-constitution) 2026 dört katlı yeniden yazma sürümü, CC0 1.0
- [Anthropic — Constitutional Classifiers (2024-2026)](https://www.anthropic.com/research/constitutional-classifiers) v2 中 オーバーヘッド 约为 ~ 1% 輸出-gate 防御
- [Lee et al. — RLAIF vs RLHF: Scaling Reinforcement Learning from Human Feedback (arXiv:2309.00267)](https://arxiv.org/abs/2309.00267) RLAIF / RLHF 的实证比较
- [Kundu et al. — Specific versus General Principles for Constitutional AI (arXiv:2310.13798)](https://arxiv.org/abs/2310.13798) ilke 粒度 etkisi
