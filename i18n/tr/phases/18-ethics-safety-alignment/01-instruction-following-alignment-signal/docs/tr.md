# talimatları takip etmek ırkınlandırma sinyali olarak

> RLHF'ye karşı yapılan eleştirilerin hepsi bu boru hattına karşıdır. Önceden bu boru hattını incelemek için optimizasyon basıncını nasıl çarpıtırız? Öncelikle bu boru hattını önce görmeliyiz. InstructGPT(Ouyang et al., 2022) referans mimarisini tanımladı: talimat- yanıt çiftlerinde üst düzey denetimli ince ayarlamalar yapın; çiftlik tercih sıralamalarında üst düzey ödüllendirme modeli yapın; sonra KL cezasıyla ödül modeline PPO kullanın  Optimize,并约束 SFT politikasına.

**Type:** Learn
**Languages:** Python (stdlib, toy three-stage pipeline)
**Prerequisites:** Phase 10 · 06 (SFT), Phase 10 · 07 (RLHF), Phase 10 · 08 (DPO)
**Time:** ~45 分钟

## Öğrenme Hedefleri

- İnstruktGPT boru hattının üç aşamasını ve her aşamasının kullanım kaybını açıklayın.
- 1.3B talimat ayarlı modeli insan tercih değerlendirmesinde orijinal 175B GPT-3'i yendi.
- 3. aşamada KL cezası, neden ve neyi önlemek için mod arayan davranışlara dönüşecek.
- ⇒ Uyang et al. ile uyum vergisi, PPO-ptx'i azaltmak için kullanılır.

## Sorun

Önceden eğitilmiş dil modelleri 会补全文本──它们不会回答问题──问 GPT-3 写一个Python函数,它逆转一列列,你经常会得到另一个提示,因为大多数训练分布是将继续接接更多的网文的网文──模型在做它工作,但这个工作本身错了──

Her ciddi laboratuvar bu sorunun proxy'si insan tercihidir. İki tamamlama                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

## Anlaşım

### 1. aşama: denetim altında ince ayarlama (SFT)

收集 prompt-response pairs, dont response is a good intention的人会写出的内容──Ouyang et al.

SFT size bir şey verir: model şimdi soruya cevap verir, tamamlanmaya devam etmek yerine.

### İkinci aşama: Ödül modeli (RM)

SFT modelinden 采样 K 个完成――Labeler对它们排序――训练一个奖励模型,为任意快速响应对 打分,使对对 打分,使对 `y_w`Yaptığım şey çok güzel .`y_l`Çiftler:

```
L_RM = -log sigmoid(r(x, y_w) - r(x, y_l))
```

Bu Bradley-Terry çiftlik tercih kaybı. RM genellikle SFT modelinden başlangıçta, LM başını ıpta başına değiştirmek için kullanılır.

Ödül modelleri 很小:6B 足够服务 175B InstructGPT──它们也很脆弱,论文第 5 节主要讨论在小规模出现的奖励黑客行为──

### 3. aşama: KL cezası ile PPO

defini hedef:

```
J(pi) = E_{x~D, y~pi(.|x)} [ r(x, y) ] - beta * KL(pi(.|x) || pi_SFT(.|x))
```

PPO Maksimum化──KL terimi 让 `pi`SFT politikasından çok uzakta. O olmadan, Optimizer karşıt örnekler bulur, yani RM'de çok yüksek puanlar elde eder.

KL katılamı `beta`RLHF en önemli hiperparametre ise çok düşüktür. Ödül hackeri.

### Düzeltme vergisi

RLHF  sonrasında, model daha fazla insan tercihine sahip, ancak standart referanslarda ((SQuAD、HellaSwag、DROP) 上退步。Ouyang et al. bunu bir uyum vergisi olarak adlandırır, PPO-ptx 修复: Pre-training gradients 混入 RL objective, böylece model asla ödüllendirilmemiş aşağı akıntılı görevleri nasıl tamamlayacağını unutmaz。

```
J_ptx(pi) = J(pi) + gamma * E_{x~D_pretrain} [ log pi(x) ]
```

PPO-ptx  become standard practice──Antropic、DeepMind 和 Meta 都使用某种变化──

### Sonuç

Bir 1.3B InstructGPT(SFT + RM + PPO-ptx) etiketçiler tarafından 偏好胜胜于 175B base GPT-3,比例约70%──在来自生产流量的隐藏测试提示上,这个差会扩大──从这个数字中可以读出两件事:

1. Düzeltme, yeteneklerle farklı bir akselde. 175B modeli daha güçlü bir yetenek, 1.3B modeli daha fazla bir uyum, etiketleri daha iyi bir uyum içinde olan birim.
2. Üretim seviyesini temel model belirler. RLHF'yi geçemezsin.

### Neden bu 18 Eylül'ün referans noktası?

后续课程中的每个批评:reward hacking(Dos 2)、DPO(Dos 3)、psykophancy(Dos 4)、CAI(Dos 5)、sleeper agents(Dos 7)、alignment faking(Dos 9),都在反对这条管道的某部分──Reward hacking 攻击阶段 2──DPO 把阶段 2 和 3 合并──CAI 替代人类标签剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂剂


```figure
al-instruct-pipeline
```

## Kullan

`code/main.py`Oyuncak tercih verileri 上模拟三个阶段。Base policy is one in actions {A, B, C} 上的偏见硬币。Stage 1 SFT 在 200 个提示上模拟标签器行动。Stage 2 500 个对等排行 拟合布拉德利-特里 ödül modeli。Stage 3 运行一个简化PPO güncellemesi,并带有到SFT politikası ödül KL ceza──你可以观察上升KL 变大、政策漂移,也可以关闭 KL 术语,看黑客在50 个奖励更新步骤内出现──

Gözlem için içeriği:

- `beta = 0.1`ile`beta = 0.0`Aşağıdaki ödül yolculuğu...
- Eğitim adımları 中的 KL pi pi SFT)
- Etiketleme tercihlerine göre son eylem dağılımı

## Gönder

本课产 出 `outputs/skill-instructgpt-explainer.md` RLHF boru hattının açıklaması veya kağıt özetini belirlerken, üç aşamada hangi aşamada değişiklik yapıldığını, her aşamada hangi kayıpları kullandığını ve KL cezası veya eşdeğer düzenleyici olup olmadığını belirler.

## Egzersizler

1. 运行  İşlem`code/main.py`❖ Yapılandırma`beta = 0.0`, 200 PPO adımlarını rapor et 后的行动分布──用一段话解释模式-seeking behavior──

2. 修改奖励模型,让行动B有+0.5偏见(模拟奖励 bug) ・・・用 `beta = 0.1`运行 PPO──KL cezası politikayı engelledi mi?`beta`Aşağı sömürü 开始可见?

3. 阅读 Ouyang et al.(arXiv:2203.02155) Resim 1── geçiş PPO 1、5、20、100 adım,并测量相对 SFT modeli tercih,复现标签者-偏好曲线──

4. 论文 Bölüm 4.3  rapor 1.3B InstructGPT  Yıkmak 175B GPT-3 oranı yaklaşık %70'dir. Neden bu oran gizli üretim isteklerinde                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

5. Aynı tercih verileri üzerinde, PPO kaybını DPO olarak değiştirmek için kullanın.

## Anahtar Terimler

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| SFT | “instruction tuning” | Stage 1：在 prompt-response pairs 上用 cross-entropy fine-tune |
| Reward model | “the RM” | 在 (prompt, response) 上的 scalar regressor，使用 Bradley-Terry 在 pairwise labels 上训练 |
| Bradley-Terry | “pairwise preference loss” | -log sigmoid(r_w - r_l)；把 pairwise ranking 约简为 binary classification |
| KL penalty | “the regularizer” | `beta * KL(pi \|\| pi_SFT)` — 让 RL policy 保持接近 SFT anchor |
| PPO-ptx | “PPO with pretraining mix” | 向 PPO objective 加入一部分 pre-training log-likelihood，用来抵消 alignment tax |
| Alignment tax | “the RLHF regression” | RLHF 之后，在 RLHF 未针对的标准 benchmarks 上下降 |
| Labeler preference | “the ground truth” | human rankings 的样本；RM 是它的 statistical proxy，而不是 “human values” 的 proxy |

## Daha Fazla Okumak

- [Ouyang et al. — Training language models to follow instructions with human feedback (arXiv:2203.02155)](https://arxiv.org/abs/2203.02155) GPT kağıdı, ayrıca sonra her RLHF boru hattı temelini
- [Stiennon et al. — Learning to summarize from human feedback (arXiv:2009.01325)](https://arxiv.org/abs/2009.01325) RLHF-for-summary of the
- [Christiano et al. — Deep reinforcement learning from human preferences (arXiv:1706.03741)](https://arxiv.org/abs/1706.03741) 原始 tercih tabanlı RL formülasyonu
- [Bai et al. — Training a Helpful and Harmless Assistant with RLHF (arXiv:2204.05862)](https://arxiv.org/abs/2204.05862) Antropik ve InstructGPT boru hattının HH uzantısı
