# Yakınlık Politikası Optimize (PPO)

> A2C bir güncelleştirme sonrasında her dağıtımdan vazgeçer.PPO'nun, politikayı 10+ dönemden fazla bir süre boyunca aynı veri grupunda yapabilmek için, önemlilik oranının azaltılmasını kullanır.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 分钟

## 问题

A2C(Lection 07) on-policy 的:Gradient `E_{π_θ}[A · ∇ log π_θ]`需要从*当前* `π_θ`Bu da bir güncellemeden sonra.`π_θ`Değişti, şimdi kullandığın veriler artık politika dışı.

Atari'de 8 env × 128 adım bir kez dağıtılması = 1024 geçiş ve bir kaç saniyelik ortam süresi.

Trust Region Policy Optimization (TRPO, Schulman 2015) ilk modification programı:约束每次更新, make old policy 和 new policy  KL arasındaki farklılık 保持在 `δ`Aşağıda, teorik olarak çok temiz, ama her güncelleme için bir konjugat-gradyen çözümü gerekmektedir.

PPO(Schulman et al. 2017) basit bir kesilmiş hedef ile 硬性的 güven bölgesini 约束──只多一行代码── her seferinde 十个时代──不需要结合梯度──理论保证足够好──九年后,它仍然是从MuJoCo到RLHF 的默认政策-gradient 算法──

## 概念

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**Importance ratio。**

`r_t(θ) = π_θ(a_t | s_t) / π_{θ_old}(a_t | s_t)`

Bu yeni politika ile veri toplama politikası arasındaki olasılık oranıdır.`r_t = 1`Değişiklik göstermedi.`r_t = 2`Yeni politika göster 选择 `a_t`Oldukça politikadan iki kat daha fazla olasılıktır.

**Clipped surrogate。**

`L^{CLIP}(θ) = E_t [ min( r_t(θ) A_t, clip(r_t(θ), 1-ε, 1+ε) A_t ) ]`

İki konu:

- Eğer avantajlı `A_t > 0`, ve oran 试图增长到超过 `1 + ε`, clip will make it Gradient 压平                                                                                                                                                                                                                                                          `+ε`Daha fazla.
- Eğer avantajlı `A_t < 0`, ve oran 试图增长到超过 `1 - ε`(Klip oranında azalanma anlamına gelir, biz kötü bir eylem daha da gerçekleşebilir), klip bir kötü eylem sınırlama `-ε`- Evet.

`min`处理另一个方向: If ratio 已朝*有益*方向移动, you still get Gradient (Böylece, oranın 已朝*有益*方向移动se, yine de gradyen elde ediyorsun)

Tipik değer `ε = 0.2`❖ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯  ◯ ◯ ◯  ◯ ◯ ◯   ◯ ◯    ◯ ◯    ◯ ◯              ◯       ◯                                                                                                                                                                                                           `r_t`Bu işlevi: Bir parça-düzsel işlevi, iyi bir tarafta düz bir üst, kötü bir tarafta düz bir alt vardır.

**完整的 PPO loss。**

`L(θ, φ) = L^{CLIP}(θ) - c_v · (V_φ(s_t) - V_t^{target})² + c_e · H(π_θ(·|s_t))`

A2C ile karşılaştırıldığında oyuncu-kritik  yapı── üç系数, genellikle `c_v = 0.5`- Evet.`c_e = 0.01`- Evet.`ε = 0.2`- Evet.

**训练循环。**

1. 跨 `N`个 paralel ortam, her运行 `T`Adımlar, toplama `N × T`个 geçişleri。
2. 計算優勢 (GAE),并把它们结为常量──
3. - Ne ?`π_{θ_old}`结为当前 `π_θ`Bu fotoğrafın...
4. - Evet .`K`个 epochs,对每个 `(s, a, A, V_target, log π_old(a|s))`- Minibatch:
   - 计算 `r_t(θ) = exp(log π_θ(a|s) - log π_old(a|s))`- Evet.
   -  uygulama `L^{CLIP}`+ değer kaybı + entropi。
   - İlerleyici adım.
5. Çıkarmayı bırakın.

`K = 10`和 64'in minibatchleri bir grup standart hiperparametrelidir.

**KL-penalty 变体。**Originiş论文, adapte KL cezasını kullanarak bir alternatif önerdi:`L = L^{PG} - β · KL(π_θ || π_old)`, içinden `β`KL 调整──Clipping 版本 became mainstream; KL 变体 in RLHF in retained below below.


```figure
ppo-clip
```

## Yapın onu.

### Adım 1: Çıkarma sırasında yakalama`log π_old(a | s)`

```python
for step in range(T):
    probs = softmax(logits(theta, state_features(s)))
    a = sample(probs, rng)
    s_next, r, done = env.step(s, a)
    buffer.append({
        "s": s, "a": a, "r": r, "done": done,
        "v_old": value(w, state_features(s)),
        "log_pi_old": log(probs[a] + 1e-12),
    })
    s = s_next
```

Çıkarma süresi sadece bir kez kullanılır.

### Adım 2: GAE avantajlarını hesaplayın (Düşünme 07)

A2C ile aynı.

### Adım 3: Çıkarılmış yedek güncelleme

```python
for _ in range(K_EPOCHS):
    for mb in minibatches(buffer, size=64):
        for rec in mb:
            x = state_features(rec["s"])
            probs = softmax(logits(theta, x))
            logp = log(probs[rec["a"]] + 1e-12)
            ratio = exp(logp - rec["log_pi_old"])
            adv = rec["advantage"]
            surrogate = min(
                ratio * adv,
                clamp(ratio, 1 - EPS, 1 + EPS) * adv,
            )
            # backprop -surrogate, 添加 value loss, 减去 entropy
            grad_logpi = onehot(rec["a"]) - probs
            if (adv > 0 and ratio >= 1 + EPS) or (adv < 0 and ratio <= 1 - EPS):
                pg_grad = 0.0  # clipped
            else:
                pg_grad = ratio * adv
            for i in range(N_ACTIONS):
                for j in range(N_FEAT):
                    theta[i][j] += LR * pg_grad * grad_logpi[i] * x[j]
```

cliped → zero gradient 模式 PPO'nun merkezi. Yeni politika veveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveveve

### Adım 4: Değer ve entropi

给评论家目标 添加标准 MSE,并给演员 添加 entropi bonusu,与A2C相同──

### Adım 5: Diagnostik

Her gün üç şeyi gözlemlemek gerekir:

- **Mean KL** `E[log π_old - log π_θ]`❖ Olmalı.`[0, 0.02]` Eğer aşarsa `0.1`,降低 `K_EPOCHS`Ya da`LR`- Evet.
- **Clip fraction** oran 落在 `[1-ε, 1+ε]` dışı örnekler örneğin.`~0.1-0.3`Eğer öyleyse.`~0`,clip 从未触发 → 提高 `LR`Ya da`K_EPOCHS`Eğer öyleyse.`~0.5+`Bu yayını çok fazla ayarlıyorsun.
- **Explained variance** `1 - Var(V_target - V_pred) / Var(V_target)`❖ Kritik 質量指标── kritik öğrenmekle birlikte, 1 yukarı yükselmelidir。

## 陷

- **Clip coefficient 调错。** `ε = 0.2`Evet, gerçek standartlar.`0.1`Güncellemeyi çok korumacı hale getirir.`0.3+`Bu da bir kararsızlık.
- **Epochs 太多。** `K > 20`经常会让训练不稳定,因为政策 漂离 `π_old`太遠── sınırlama çağları, özellikle büyük ağlar için──
- **没有 reward normalization。**Büyük ödül ölçekleri 会侵蚀 clip aralığı──在计算优点 前先正常化奖励(running std)──
- **忘记 advantage normalization。**Satır başına sıfır ortalama/birlik-std normallaştırma standart bir uygulama.
- **Learning rate 没有衰减。**PPO 線性 LR 衰减到零──常態 LR 往往更差──
- **Importance ratio 数学错误。**始终使用 `exp(log_new - log_old)`- Hayır .`new / old`- Evet.
- **Gradient sign 错误。**Maksimalist alternatif = * minimalist* `-L^{CLIP}`◊ 符号翻转是最常见的PPO bug──

## Kullan

PPO 2026 yılında oldukça çeşitli alanlarda default RL algoritmasıdır:

| Use case | PPO variant |
|----------|-------------|
| MuJoCo / robotics control | PPO with Gaussian policy, GAE(0.95) |
| Atari / discrete games | PPO with categorical policy, rolling 128-step rollouts |
| RLHF for LLMs | PPO with KL penalty to reference model, reward from RM at end of response |
| Large-scale game agents | IMPALA + PPO (AlphaStar, OpenAI Five) |
| Reasoning LLMs | GRPO (Lesson 12) — PPO variant without critic |
| Preference-only data | DPO — closed-form collapsing of PPO+KL, no online sampling |

PPO'nun *kayıp şekli*  kesilmiş alternatif + değer + entropi  DPO、GRPO ve neredeyse tüm RLHF boru hattının脚手架。

## - Söyle.

保存为 `outputs/skill-ppo-trainer.md`- ...

```markdown
---
name: ppo-trainer
description: 为给定环境生成 PPO training config 和 diagnostic plan。
version: 1.0.0
phase: 9
lesson: 8
tags: [rl, ppo, policy-gradient]
---

给定一个 environment 和 training budget，输出：

1. Rollout size。`N` envs × `T` steps。
2. Update schedule。`K` epochs、minibatch size、LR schedule。
3. Surrogate params。`ε`（clip）、`c_v`、`c_e`，开启 advantage normalization。
4. Advantage。GAE(`λ`)，显式给出 `γ` 和 `λ`。
5. Diagnostics plan。KL、clip fraction、explained variance thresholds 与 alerts。

拒绝 `K > 30` 或 `ε > 0.3`（unsafe trust region）。拒绝任何没有 advantage normalization 或 KL/clip monitoring 的 PPO run。把 clip fraction 持续高于 0.4 标记为 drift。
```

## 练习

1. **简单。**4×4 GridWorld 上运行 PPO, kullan `ε=0.2, K=4`◊ uyumlu çevre adımları durumunda, A2C ◊ her atış bir dönem) örnek verimliliği karşılaştırma
2. **中等。**Tarama`K ∈ {1, 4, 10, 30}` Geri dönüş vs. env adımları çizmek, ve her güncelleme ortalamasını takip etmek`K`KL ne kadar patlayacak?
3. **困难。**Kullanıcı KL cezası  değiştirilmiş yer değiştirmek  Eğer`KL > 2·target`- Evet .`β`翻倍; eğer `KL < target/2`- Evet .`β`减半) ・比较最终回报、稳定和 clip-freeness──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Importance ratio | "r_t(θ)" | `π_θ(a\|s) / π_old(a\|s)`；相对于采集数据的 policy 的偏离程度。 |
| Clipped surrogate | "PPO's main trick" | `min(r·A, clip(r, 1-ε, 1+ε)·A)`；在有益侧超过 clip 后 Gradient 变平。 |
| Trust region | "TRPO / PPO intent" | 限制每次更新的 KL，以保证 monotone improvement。 |
| KL penalty | "Soft trust region" | 替代 PPO：`L - β · KL(π_θ \|\| π_old)`。Adaptive `β`。 |
| Clip fraction | "How often clipping triggers" | Diagnostic —— 应该是 0.1-0.3；超出范围表示调参错误。 |
| Multi-epoch training | "Data reuse" | 每次 rollout 上跑 K 个 epochs；用 variance cost 换 sample efficiency。 |
| On-policy-ish | "Mostly on-policy" | PPO 名义上是 on-policy，但 K>1 个 epochs 会安全地使用 slightly-off-policy data。 |
| PPO-KL | "The other PPO" | KL-penalty 变体；用于 RLHF，因为 KL-to-reference 已经是一个约束。 |

## 延伸阅读

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) 论文。
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477)TRPO,PPO'nun önümüzdeki adı
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990) Her PPO hiperparametre için ablasyon yapın.
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) Yönetim GPT; RLHF'de PPO 配方。
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) 使用 PyTorch 的清晰现代讲解──
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) 很多论文使用的参考单档PPO──
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer)  在语言模型上使用PPO的生产配方;请和课 09(RLHF)一起阅读──
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) 37 kod seviyesinde optimizasyonlar 论文; hangi PPO hileleri yükselir yapı, hangiları sadece folklorudur。
