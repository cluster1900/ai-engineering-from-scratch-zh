# STAR, V-STAR, Silenç STAR  Kendi Kendine Öğretilmiş Dönüşüm

> En küçük kendi kendini geliştirme döngüsü mantıklılık içindedir.  Model bir düşünce zinciri oluşturur, doğru cevap veren sonuçları korur ve bu sonuçlara ince ayarlar.  İşte STaR──V-STaR  Verifier'a katılır, sonucu-zaman seçimini yaptırır.

**Type:** 学习
**Languages:** Python (stdlib, bootstrap-loop 模拟器)
**Prerequisites:** Phase 13 · 01-03 (Reasoning and CoT), Phase 15 · 01 (long-horizon 框架)
**Time:** ~60 分钟

## 问题

Öneriler: İnsan yazmış mantık izlerini toplamak, mantık yapmanın doğrudan yolu. Bu hem pahalı hem de yavaş, ve insanın yazma isteğine sınırlı olarak yüksek kaliteli bir düşünce zinciri vardır.

STaR (Self-Teught Reasoner, Zelikman et al., 2022) bir soruyu ortaya koydu: Eğer model kendi mantıklarını yazırsa, bilinen cevaplara göre onlara bir parça verirse, nasıl olur? döngüsü şunlardır:

1. 采样一个推理痕 和答案──
2. Eğer sonuç doğruysa, bu izleri sakla.
3. Bu izleri korumak için...
4. Tekrarlıyorum.

Bu, GSM8K ve CommonsenseQA'nın yeni yapay işareti olmadan yükseltmesi anlamına gelir. Ancak bu döngüde bir içsel bir önyargı vardır: Doğru cevapların herhangi bir sonucu ortaya çıkmasının mantıklılığı, kendiliğinden güvenilir olup olmadığından bağımsız olarak saklanır.

## 概念

### STaR: Geçerli sonuçta başlatma

Her bir eğitim sorusunda, bir mantık ve cevap örneği ile uyumluysa, bu (problemi, mantık, cevap) üçlü olarak korunmaktadır.

Bir değişim çok önemli. Eğer model bir soruya cevap veremezse, bu döngü ondan öğrenemez.**rationalization**Model başarısızlığı sorusu için, doğru cevabı bir ipucu olarak ekle, ve yeniden uyarın.

原论文结果 (Zelikman et al., 2022): Bir GPT-J temel modeli 多轮带 合理化 多轮带 合理化 的 STaR, GSM8K'de 5.8% 提升至 10.7%,绝对提升约 5个百分点── CommonsenseQA'da, STaR 训练的 GPT-J 6B 达到 72.5%,接近精细调的 GPT-3 175B (~73%),而后者在人工标签理上训练、规模大约30倍的模型──

### V-STaR: DPO 訓練 doğrulayıcısı ile

STaR 会丢弃错误理性――Hosseini et al. (2024) 观察到这些也是数据:每一对 (rational, "bu doğru mu") 都可以训练验证者──他们正确和错误解法上使用直接偏好优化来构建排名──在推断时间,采样N 个理性,并选择验证器 排名最高的一个──

Rapor farkı: GSM8K ve MATH'de, önceki kendi geliştirme temel çizgilerinden +4'e +17'e kadar yükseldi, bunların çoğu verifiyeci tarafından elde edilen kazançlar, ekstra jeneratörün ince ayarlaması yerine, sonucu-zaman seçimi için kullanılır.

### Sessiz-STAR: Her Token'in İçsel Düşüncelerine Dayalı

Zelikman et al. (2024)  öneriler: Eğer model öğrenmek her bir Token  konumunda kısa bir iç mantık üretir, sadece soru ve cevap arasında yerleşmek yerine, nasıl olacak?

Sonuç:Mistral 7B, GSM8K'de sıfır çekim durumunda görev-specifik ince ayarlamalar olmaksızın %5.9'dan %10.9'a yükseldi.

### Neden üçü de ortak güvenlik endişeleri var ?

Üç yöntem son cevabı bir dereceli sinyal olarak kullanır. Bir kusurlu mantık yoluyla doğru cevabı elde ederken, ister yol yolu kullanır, ister tahmin eder, ister de genelleşmeyen bir modü kullanırsa, hepsi doğru yönde güçlendirilir.

V-STaR'in doğrulayıcısı ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒                                                                                                                                                                                                                 

### Karşılaştırma

| Method | Training signal | Inference cost | Data waste | Known failure mode |
|---|---|---|---|---|
| STaR | 如果正确，则保留 (rationale, answer) | 1x | 丢弃所有错误 rationales | shortcut rationales |
| STaR + rationalization | 上述方法 + 带正确答案提示的重试 | 1x | 更少 | rationalized rationales 可能不可信 |
| V-STaR | STaR + 来自两个类别的 DPO verifier | Nx (best-of-N) | 最小 | verifier 可能强化自信的错误 |
| Quiet-STaR | per-Token rationale + mixing weight | 1.5-3x | 最小 | 仍然是 answer-conditioned Gradient |

### 2026'da bir yerleşim kurar.

STaR 已不新了──但这个模式在 2025-2026年到处重现──可验证数学问题上的 RL (DeepSeek-R1, Kimi-k1.5, o1) STaR'ın cevap koşullı Gradient 信号的放大版──STAR'ın süreç ödül modelleri (Lightman et al., 2023; OpenAI'nin "Hatır adım doğrulayalım") STARın STARı  olarak denetim altında tutulmuştur. AlphaEvolve (Desin 3) STARın kodunu STAR olarak kullanılıyor, sadece program değerlendiricisi STARi  olarak kullanılıyor.

STAR'ı anlamak her şeyi netleştirir.


```figure
reflection-loop
```

## Kullan

`code/main.py`Bir oyuncak aritmetik görevi içinde.

- Düzgünlük 如何随随起带轮上升──
- 捷径如何混入:模拟器包含一个"惰"逻辑类,它有40%的时间得到正确答案,但泛化很差──观察 STaR是否会保留它们──
- Bir verifier (V-STaR 风格) nasıl sonuçta yardımcı olabilir, ancak eğitim sırasında tamamen kesmek mümkün değildir.

## - Söyle.

`outputs/skill-star-loop-reviewer.md`Öğrenmeden önce bir önerilen kendi kendine öğretilen mantık borusunu denetlemene yardımcı olmak.

## 练习

1. 运行模拟器──将快捷通频 设为零,然后设为0.4──尽管两次运行都在训练分布上达到>90%,最终精度会相差多少?

2. 给模拟器添加一个持久的OOD test──不同分布中抽取问题,并在分布和OOD sets 上评估 bootstrapped model──量化差──

3. 阅读 Quiet-STaR 论文 (arXiv:2403.09629) Bölüm 3──分别用三句话解释 "büyük düşünce" Token 和 karışık ağırlıklı başlık──

4. STaR'in doğru olması gerekirse filtreyi, süreç denetimindeki bir alternatif ile karşılaştırarak, sonrakiler her mantıklı adımı ödüllendirecektir.

5. 设计一个评估,用于捕获部署的模型中的快捷理性──它不必完美,但必须能够打破STaR 循环会强化的最简单捷径──

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| STaR | "Self-Taught Reasoner" | 在得到正确答案的模型生成 rationales 上 fine-tune；重复 |
| Rationalization | "Hinted retry" | 注入正确答案，并在 base model 失败的问题上重新 prompt 生成 rationale |
| V-STaR | "Verifier STaR" | 在正确和错误 rationales 上 DPO-train 一个 verifier，并将其用于 inference-time selection |
| Quiet-STaR | "Per-token rationales" | 在每个 Token 位置生成隐藏 thoughts；与 baseline prediction 混合 |
| Answer-conditioned gradient | "Outcome-based signal" | 训练循环奖励最终答案，而不是 reasoning steps |
| Process reward model | "Step-level verifier" | 在 per-step correctness 上训练的 reward model，而不是 outcome；与 STaR 形成对比 |
| Shortcut rationale | "Right answer, wrong reasoning" | 一个通过无法泛化的模式得到标签的 rationale；STaR 会保留这些 |

## 延伸阅读

- [Zelikman et al. (2022). STaR: Bootstrapping Reasoning With Reasoning](https://arxiv.org/abs/2203.14465) 原始论文──
- [Hosseini et al. (2024). V-STaR: Training Verifiers for Self-Taught Reasoners](https://arxiv.org/abs/2402.06457) 加入用于推理时间选择的DPO doğrulayıcısı。
- [Zelikman et al. (2024). Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking](https://arxiv.org/abs/2403.09629) per token 内部 rationales。
- [Lightman et al. (2023). Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) süreç ödül modelleri,即替代 Gradient 信号。
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) RL'de verilebilir görev, STaR'de sınır eğitimiyle genişletilmiş olacaktır.
