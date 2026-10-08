# Ödül Modelleme & RLHF

> İnsanların iyi bir yardımcı cevabı için imkanı yok  el yazma ödül fonksiyonu, ama onlar iki cevabı karşılaştırır, daha iyi olanı seçer.                                                                                                                                                                                                                                            

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 分钟

## 问题

Yeni bir belirti öngörme hedefi ile bir dil modeli eğitilmiştir. Doğru İngilizce'yi yazıyor.

Siz bir* işaretleme ödül* istiyorsunuz, gösterir, talimat X için A'nın cevabı B'nin cevabından daha iyi. Bu ödül fonksiyonu imkansızdır.

RLHF(Christiano et al. 2017; Ouyang et al. 2022) tercihleri 转换成奖励模型, sonra PPO ile 针对该奖励 优化 LM。分三步:SFT → RM → PPO。这是 20232025年交付 ChatGPT、Claude、Gemini以及其他所有的配配方――LLM.

2026 yılına kadar,PPO 步骤大多被DPO (DPO) tarafından değiştirilmiştir, çünkü daha ucuz ve uyum ayarlamaları için neredeyse aynı şekilde iyi olacaktır. Ancak * ödül modeli* 部分仍然支着每个Best-of-N sampleler、每个 RL-from-verifiable-rewards pipeline,以及每个使用过程奖励模型的推理模型──理解RLHF,你就理解整个排列堆──

## 概念

![Three-stage RLHF: SFT, RM training on pairwise prefs, PPO with KL penalty](../assets/rlhf.svg)

**Stage 1：Supervised Fine-Tuning（SFT）。**Önceden eğitilmiş temel modelden 开始──在目标行为的人类编写示范 上细调( talimatları takip eden yanıtlar、有用的答案等)  sonuç bir `π_SFT`model, iyi davranış yönünde, ama hala sınırsız bir eylem alanı vardır.

**Stage 2：Reward Model training。**

- 收集对提示 `x`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `(y_+, y_-)`,由人類标注为y_+ 优于 y_-。
- 训练 ödül modeli `R_φ(x, y)`- Ver .`y_+`分配更高分数──
- Kayıp:**Bradley-Terry pairwise logistic**- ...

  `L(φ) = -E[ log σ(R_φ(x, y_+) - R_φ(x, y_-)) ]`

  σ 是 sigmoid──reward 的差值隐含偏好 的 log-odds──BT 1952 yılından beri Bradley-Terry) beri her zaman standart yöntemdir, aynı zamanda çağdaş RLHF'de baskın seçimlerdir──

- `R_φ`Genellikle SFT modeli başlangıç, ve üst kısmında bir skalar başı eklenir. Aynı transformatör omurgası; tek bir doğrusal katman 输出 reward。

**Stage 3：带 KL penalty、针对 RM 的 PPO。**

- - Evet .`π_SFT`İlk başta eğitim politikaları`π_θ`                                                                                                                                                                                                                                                              `π_ref = π_SFT`- Evet.
- Cevap`y`Ödül:

  `r_total(x, y) = R_φ(x, y) - β · KL(π_θ(·|x) || π_ref(·|x))`

  KL cezası 防止 `π_θ`任意漂离 `π_SFT` Bu bir * düzenleyici*, sert bir güven bölgesi değil.`β`Genellikle `0.01`- Ne oldu ?`0.05`- Evet.
- Bu ödülü kullanın PPO'yu yürütün. Ders 08):

**为什么需要 KL？**Bu yüzden, bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir bir de bir de bir de bir bir de bir de bir de bir de bir de bir de bir bir de bir de bir de bir de bir de bir de bir de bir bir de bir de bir de bir de bir de bir de bir bir de bir de bir de bir de bir de bir de bir bir de bir de bir de bir de bir de bir de bir bir de bir de bir de bir de bir de bir de bir de bir de bir bir de bir de bir de bir de bir bir de bir de bir de bir de bir de bir de bir bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de bir de`π_θ`RM'de eğitim görmüş bir sürüden yakınında kalmak RLHF'de en önemli tek bir dönüm noktasıdır.

**2026 状态：**

- **DPO**(Rafailov 2023): kapalı biçim cebir 2+3 aşamasını bir tercih verisine çarpıştır                                                                                                                                                                                                                                                   
- **GRPO**(DeepSeek 20242025):PPO'nun değişimi, grup-sürefik temel değer ile eleştirmen yerine, *verifier*den gelen ödüllerle, kod çalıştırma / matematik cevapları ile eşleşir), insan eğitimi RM değil.
- **Process reward models（PRMs）：**给部分解决方案 (GROP) 变体 (GROP) 变体)
- **Constitutional AI / RLAIF：**İnsanlardan değil, uyumlu LLM 生成 tercihlerini kullanın.


```figure
reward-model
```

## Yapın onu.

Bu ders, mikro tipli sintetik prompts和responses,表示为字符串──RM, bagaj-of-tokens gösterisi tabanlı bir çizgi puanlayıcıdır──没有真实LLM  重要的是管道的*形状*,不是规模──见 `code/main.py`- Evet.

### Adım 1:Sintez tercih verileri

```python
PROMPTS = ["help me", "answer me", "explain this"]
GOOD_WORDS = {"clear", "specific", "kind", "thorough"}
BAD_WORDS = {"vague", "rude", "wrong", "short"}

def make_pair(rng):
    x = rng.choice(PROMPTS)
    y_good = rng.choice(list(GOOD_WORDS)) + " " + rng.choice(list(GOOD_WORDS))
    y_bad = rng.choice(list(BAD_WORDS)) + " " + rng.choice(list(BAD_WORDS))
    return (x, y_good, y_bad)
```

Gerçek RLHF'de, bu insan etiketleri tarafından değiştirilmiştir.`(prompt, preferred_response, rejected_response)`Tamamen aynı.

### Adım 2: Bradley-Terry ödül modeli

Düzsel puan:`R(x, y) = w · bag(y)`BT çiftlik kayıplarını en aza indirmek için:

```python
def rm_train_step(w, x, y_pos, y_neg, lr):
    r_pos = dot(w, bag(y_pos))
    r_neg = dot(w, bag(y_neg))
    p = sigmoid(r_pos - r_neg)
    for tok, cnt in bag(y_pos).items():
        w[tok] += lr * (1 - p) * cnt
    for tok, cnt in bag(y_neg).items():
        w[tok] -= lr * (1 - p) * cnt
```

Yüzlerce güncelleme sonrasında,`w`İyi kelime simgelerini paylaşıyoruz, kötü kelime simgelerini paylaşıyoruz.

### Adım 3: RM 之deki PPO benzeri politika

Bizim oyuncak politikamız sözlükten bir işaret oluşturacak.`log π_θ(token | prompt)`, KL referans cezası ekle,并应用 Cliped PPO surrogate──

```python
def rlhf_step(theta, ref, w, prompt, rng, eps=0.2, beta=0.1, lr=0.05):
    logits_theta = policy_logits(theta, prompt)
    probs = softmax(logits_theta)
    token = sample(probs, rng)
    logits_ref = policy_logits(ref, prompt)
    probs_ref = softmax(logits_ref)
    reward = dot(w, bag([token])) - beta * kl(probs, probs_ref)
    # 在 theta 上做 ppo-style update，把 reward 当作 return
    ...
```

### Adım 4: KL izleyici

Her güncellemenin bir anlamı var .`KL(π_θ || π_ref)`Eğer tırmanırsa.`~5-10`, politika 已漂离 `π_SFT`很远 低`β`Bu gerçek RLHF'de en önemli teşhis yöntemidir.

### Adım 5: TRL'yi kullanın

Oyuncak borusunu anlamak 后,下面是同一循环作为真实图书馆用户的写法──Hugging Face 的 [TRL](https://huggingface.co/docs/trl) Referans uygulanması  2. aşama `RewardTrainer`3. aşama.`PPOTrainer`(内置 KL-referans)

```python
# Stage 2：来自 pairwise preferences 的 reward model
from trl import RewardTrainer, RewardConfig
from transformers import AutoModelForSequenceClassification, AutoTokenizer

tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")
rm = AutoModelForSequenceClassification.from_pretrained(
    "meta-llama/Llama-3.1-8B-Instruct", num_labels=1
)

# dataset rows: {"prompt", "chosen", "rejected"} — Bradley-Terry format
trainer = RewardTrainer(
    model=rm,
    tokenizer=tok,
    train_dataset=preference_data,
    args=RewardConfig(output_dir="./rm", num_train_epochs=1, learning_rate=1e-5),
)
trainer.train()
```

```python
# Stage 3：针对 RM 的 PPO，并对 SFT reference 加 KL penalty
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

policy = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")
ref    = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")  # frozen

ppo = PPOTrainer(
    config=PPOConfig(learning_rate=1.41e-5, batch_size=64, init_kl_coef=0.05,
                     target_kl=6.0, adap_kl_ctrl=True),
    model=policy, ref_model=ref, tokenizer=tok,
)

for batch in dataloader:
    responses = ppo.generate(batch["query_ids"], max_new_tokens=128)
    rewards   = rm(torch.cat([batch["query_ids"], responses], dim=-1)).logits[:, 0]
    stats     = ppo.step(batch["query_ids"], responses, rewards)
    # stats 包含：mean_kl、clip_frac、value_loss — 三个 PPO diagnostics
```

Kitaplık senin için üç şey yapacak.`adap_kl_ctrl=True`实现 adaptive-β schedule: if observed KL  exceeds `target_kl`,β 倍; eğer yarıdan azsa,β 减半.`policy`共享 parametreleri──Değer başı ve politika 位于同一个脊椎上(`AutoModelForCausalLMWithValueHead`Bu yüzden TRL'de bir grup rapor veriliyor .`policy/kl`和 `value/loss`- Evet.

## 陷

- **Over-optimization / reward hacking。**RM mükemmel değil.`π_θ`Bu nedenle, bu durumun bir sonucu olarak, bir kişinin değerlendirme puanının yükselmesinin ve değerlendirme puanının yükselmesinin bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, bir sonucu olarak, belirlenmektedir.`β`、 geniş RM eğitim verileri
- **Length hacking。**Bu nedenle, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak, bu yöntemin kullanımı ile ilgili olarak,
- **RM 太小。**RM en az ihtiyaç ve politikalar bir yandan büyüktür.
- **KL tuning。**太低 → drift 和 reward hacking──β 太高 → politika 几乎不变──标准技巧是使用一个以固定为每步 KL 为目标的 *适应性* β──
- **Preference-data noise。**İnsan etiketlerinin yaklaşık %30'u gürültü veya bulanıklık içindedir.
- **Off-policy problems。**İlk dönemlerde PPO verileri, politikadan biraz uzakta.

## Kullan

2026 yılının RLHF'si:

| Layer | Target | Method |
|-------|--------|--------|
| Instruction following, helpfulness, harmlessness | Alignment | DPO（Phase 10 · 08）优于 RLHF-PPO。 |
| Reasoning correctness（math, code） | Capability | 使用 verifier reward 的 GRPO（Phase 9 · 12）。 |
| Long-horizon multi-step tasks | Agentic | 在 steps 上使用 process reward models 的 PPO / GRPO。 |
| Safety / refusal behavior | Safety | RLHF-PPO with separate safety RM，或 Constitutional AI。 |
| Best-of-N at inference | Fast alignment | 在 decode time 使用 RM；不需要 policy training。 |
| Reward distillation | Inference compute | 在 frozen LM 顶部训练一个小的 “reward head”。 |

RLHF, 2022'de 2024'te yapılan bir** yöntemdir. 2026 yılına kadar, DPO-first olarak uyumlu boru hattları üretmek, PPO sadece RM yoğun veya güvenlik kritik adımlar için kullanılacak.

## - Söyle.

保存为 `outputs/skill-rlhf-architect.md`- ...

```markdown
---
name: rlhf-architect
description: 为 language model 设计 RLHF / DPO / GRPO alignment pipeline，包括 RM、KL 和 data strategy。
version: 1.0.0
phase: 9
lesson: 9
tags: [rl, rlhf, alignment, llm]
---

给定一个 base LM、一个目标行为（alignment / reasoning / refusal / agent），以及 preference 或 verifier budget，输出：

1. Stage。SFT？RM？DPO？GRPO？并给出理由。
2. Preference or verifier source。Humans、AI feedback、rule-based、unit-test-pass 或 reward distillation。
3. KL strategy。Fixed β、adaptive β 或 DPO（implicit KL）。
4. Diagnostics。Mean KL、reward stability、over-optimization guard（holdout human eval）。
5. Safety gate。Red-team set、refusal rate、与 helpfulness RM 分开的 safety RM。

拒绝在没有 KL monitor 的情况下交付 RLHF-PPO。拒绝使用小于 target policy 的 RM。拒绝 length-only rewards。把任何没有留出 blind human-eval set 的 pipeline 标记为缺少 over-optimization protection。
```

## 练习

1. **简单。**- Evet .`code/main.py`Ortalama 500 ¢¢ sintetik tercih çiftleri ¢ antrenman Bradley-Terry ödül modeli ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ ¢ 
2. **中等。**Kullanım`β ∈ {0.0, 0.1, 1.0}`Oyuncak PPO-RLHF döngüsü. Her değer için, RM puanı vs. KL-referans üzerinde güncellemeler çizmek. Hangi atışlar  ödül-hack gerçekleşir?
3. **困难。**Aynı tercih verileri içinde DPO'yu gerçekleştirmek için, RLHF-PPO borusuna göre, kullanımı hesaplama ve son RM puanına ulaşmak için,

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| RLHF | "Alignment RL" | 三阶段 SFT + RM + PPO pipeline（Christiano 2017, Ouyang 2022）。 |
| Reward Model (RM) | "The scoring net" | 通过 Bradley-Terry 拟合 pairwise preferences 学到的 scalar function。 |
| Bradley-Terry | "Pairwise logistic loss" | `P(y_+ ≻ y_-) = σ(R(y_+) - R(y_-))`；标准 RM objective。 |
| KL penalty | "Stay near the reference" | reward 中的 `β · KL(π_θ \|\| π_ref)`；anti-reward-hacking regularizer。 |
| Reward hacking | "Goodhart's law" | Policy 利用 RM 缺陷；症状：reward 上升，human eval 持平。 |
| RLAIF | "AI-labeled preferences" | 标签来自另一个 LM 而非人类的 RLHF。 |
| PRM | "Process Reward Model" | 给 partial reasoning steps 打分；用于 reasoning pipelines。 |
| Constitutional AI | "Anthropic's method" | 由显式规则引导的 AI-generated preferences。 |

## 延伸阅读

- [Christiano et al. (2017). Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) 开创RLHF 的论文──
- [Ouyang et al. (2022). InstructGPT — Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) ChatGPT 背后配方──
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) Daha erken kullanılır özetleme RLHF。
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) DPO;2026 yıl sonrası RLHF'nin默认方法──
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) RLAIF 和 kendi kendini eleştirme döngüsü
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862) HH 论文。
- [Hugging Face TRL library](https://huggingface.co/docs/trl) 生产级 `RewardTrainer`和 `PPOTrainer`❖ Okuyucu kaynağı, anlayışlı-KL 和 değer başı 细节──
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf)Lambert, Castricato, von Werra, Havrilla tarafından  带图解的三阶段管道 经典 walkthrough──
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl)Kütüphane;`examples/`Llama、Mistral 和 Qwen'in sonundan sonuna kadar RLHF senaryoları vardır.
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf) ödül-hipotez 视角; düşünce ödül hackeri ⇒
