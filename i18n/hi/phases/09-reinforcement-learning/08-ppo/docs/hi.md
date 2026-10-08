# निकट नीति अनुकूलन (पीपीओ)

> A2C एक बार अपडेट होने के बाद हर रोलआउट को छोड़ देता है। पीपीओ का उपयोग करके महत्वपूर्णता अनुपात को कम करके नीति ग्रेडिएंट को शामिल करें, ताकि आप एक ही बैच डेटा पर 10+ युगों को कर सकें, और नीति को विस्फोट न दें।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 分钟

## 问题

A2C(पढ़ें 07) है नीति पर`E_{π_θ}[A · ∇ log π_θ]`需要从*当前* `π_θ`采样数据──做一次更新后,`π_θ`यह बदल गया है; आप अभी इस्तेमाल किया है डेटा अब बंद कर दिया गया है नीति.

Rollout  बहुत महंगा है Atari पर,  8  envs × 128 कदम के एक बार Rollout = 1024  संक्रमण, तथा  कुछ सेकंड का पर्यावरण समय है एक बार Gradient कदम  के बाद इसे खो दिया बहुत बर्बाद है

ट्रस्ट रीजन पॉलिसी ऑप्टिमाइज़ेशन (TRPO, Schulman 2015) पहला संशोधन है।`δ`निम्नलिखित── सैद्धांतिक रूप से बहुत साफ है, लेकिन प्रत्येक अद्यतन को एक संयुग्मित-ग्रेडिएंट समाधान की आवश्यकता होती है──2026 वर्ष में TRPO को लागू करने वाला कोई नहीं है──

पीपीओ(शूलमैन और सहयोगियों 2017) ने एक सरल क्लिप उद्देश्य के साथ कठोरता के विश्वास क्षेत्र को बदल दिया 约束──只多一行代码── प्रत्येक बार 10 युगों का रोलआउट किया गया।

## 概念

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**Importance ratio。**

`r_t(θ) = π_θ(a_t | s_t) / π_{θ_old}(a_t | s_t)`

यह नई नीति और डेटा संग्रह नीति के बीच संभावना अनुपात है।`r_t = 1`कोई परिवर्तन नहीं दिखाया गया है।`r_t = 2`प्रदर्शित करें नई नीति 选择 `a_t`संभावना पुरानी नीति की दो गुना है।

**Clipped surrogate。**

`L^{CLIP}(θ) = E_t [ min( r_t(θ) A_t, clip(r_t(θ), 1-ε, 1+ε) A_t ) ]`

दो विषय:

- यदि लाभ `A_t > 0`, और अनुपात 试图 बढ़कर अधिक `1 + ε`, क्लिप एक बार में एक अच्छा कदम नहीं है , एक अच्छा कदम नहीं है , एक उच्च संभावना के लिए आगे बढ़ना`+ε`और अधिक
- यदि लाभ `A_t < 0`, और अनुपात 试图 बढ़कर अधिक `1 - ε`(कमी कमी के मुकाबले मतलब, हम एक बुरा कार्य अधिक हो सकता है करने के लिए अनुमति देगा), क्लिप होगा सीमा ग्रेडिएंट  एक बुरा कार्य मत डाल  नीचे के लिए धक्का `-ε`

`min`处理另一个方向: यदि अनुपात 已朝*有益* दिशा में स्थानांतरित हो गया है, तो आप अभी भी ग्रेडिएंट प्राप्त करते हैं

典型值是 `ε = 0.2`                                                                                                                                                                                                                                                              `r_t`का कार्यः एक टुकड़ा-तरह वाला फ़ंक्शन, एक अच्छे पक्ष में समतल के शीर्ष पर, एक खराब पक्ष में समतल के नीचे पर।

**完整的 PPO loss。**

`L(θ, φ) = L^{CLIP}(θ) - c_v · (V_φ(s_t) - V_t^{target})² + c_e · H(π_θ(·|s_t))`

A2C के समान अभिनेता-आलोचक संरचना ∙ तीन系数, आमतौर पर `c_v = 0.5``c_e = 0.01``ε = 0.2`

**训练循环。**

1. 跨 `N`个 समानांतर वातावरण, प्रत्येक运行 `T`कदम, संग्रह `N × T`个 संक्रमणों。
2. 计算优势 (GAE),并把它们结为常量──
3. `π_{θ_old}`结为当前 `π_θ`की स्नैपशॉट
4. `K`个 युग,对每个 `(s, a, A, V_target, log π_old(a|s))`की मिनी बैचः
   - 计算 `r_t(θ) = exp(log π_θ(a|s) - log π_old(a|s))`
   -  अनुप्रयोग `L^{CLIP}`+ मूल्य हानि + एंट्रॉपी。
   - चरणबद्ध कदम
5.  रिलॉउट छोड़ दिया  कदम 1 पर वापस जाएँ

`K = 10`和 64 के मिनी बैच एक समूह मानक हाइपरमैटर हैं।

**KL-penalty 变体。**मूल निबंध एक वैकल्पिक प्रस्तावित किया, अनुकूलनशील KL दंड का उपयोग करते हुएः`L = L^{PG} - β · KL(π_θ || π_old)`, उनमें से `β`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️


```figure
ppo-clip
```

##  इसे निर्माण

### चरण 1: रोलआउट में पकड़े जाने के लिए`log π_old(a | s)`

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

स्नैपशॉट केवल एक बार रोलआउट के दौरान प्राप्त किया जाता है। यह अपडेट युग के दौरान नहीं बदलेगा।

### चरण 2: गणना जीएई लाभ (Lection 07)

A2C से समान                                                                                                                                                                                                                                                             

### चरण 3: स्रोता अद्यतन काटा गया

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

कटप → शून्य ग्रेडिएंट  模式 PPO का मूल है यदि नई नीति  लाभकारी दिशा में बहुत दूर चली गई है, तो अद्यतन रुक जाएगा

### चरण 4: मूल्य और एंट्रॉपी

给评论家目标 添加标准 MSE,并给演员 添加 Entropy बोनस,与A2C相同──

### चरण 5: निदान

हर बार अपडेट तीन चीजों को देखना हैः

- **Mean KL** `E[log π_old - log π_θ]`                                                                                                                                                                                                                                                              `[0, 0.02]`यदि अधिक `0.1`,降低 `K_EPOCHS`या `LR`
- **Clip fraction** अनुपात 落在 `[1-ε, 1+ε]` बाहर के नमूने उदाहरण  होना चाहिए `~0.1-0.3` यदि `~0`, क्लिप 从未触发 → 提高 `LR`या `K_EPOCHS` यदि `~0.5+`, आप इस रोलआउट को ओवर-फिट कर रहे हैं → उन्हें कम कर रहे हैं.
- **Explained variance** `1 - Var(V_target - V_pred) / Var(V_target)` आलोचनात्मक गुणवत्ता सूचक आलोचनात्मक सीखने के साथ, 1 से ऊपर जाना चाहिए

## 陷

- **Clip coefficient 调错。** `ε = 0.2`                                                                                                                                                                                                                                                              `0.1`अद्यतन अतिसंरक्षित हो जाएगा;`0.3+`                                                                                                                                                                                                                                                              
- **Epochs 太多。** `K > 20`经常会让训练不稳定,因为政策 漂离 `π_old` बहुत दूर सीमाएँ, विशेषकर बड़े नेटवर्क पर
- **没有 reward normalization。**                                                                                                                                                                                                                                                              
- **忘记 advantage normalization。**प्रति बैच शून्य-औसत/इकाई-एसटीडी सामान्यीकरण मानक अभ्यास है।
- **Learning rate 没有衰减。**पीपीओ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒     ⇒     ⇒ ⇒                                    ⇒                                                                         
- **Importance ratio 数学错误。**始终使用 `exp(log_new - log_old)`, बजाय `new / old`
- **Gradient sign 错误。**अधिकतमकरण सरोकार = * न्यूनतमकरण* `-L^{CLIP}`◊ 符号翻转是最常见的PPO बग──

## इसका उपयोग करें

पीपीओ 2026 वर्ष में काफी क्षेत्रों में एक मानक आरएल 算法 हैः

| Use case | PPO variant |
|----------|-------------|
| MuJoCo / robotics control | PPO with Gaussian policy, GAE(0.95) |
| Atari / discrete games | PPO with categorical policy, rolling 128-step rollouts |
| RLHF for LLMs | PPO with KL penalty to reference model, reward from RM at end of response |
| Large-scale game agents | IMPALA + PPO (AlphaStar, OpenAI Five) |
| Reasoning LLMs | GRPO (Lesson 12) — PPO variant without critic |
| Preference-only data | DPO — closed-form collapsing of PPO+KL, no online sampling |

पीपीओ का *लॉस आकार*  क्लिप सार्वाट + वैल्यू + एंट्रॉपी  है डीपीओ、GRPO तथा लगभग सभी आरएलएचएफ पाइपलाइन के脚手架──

## 交付 यह

保存为 `outputs/skill-ppo-trainer.md`:

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

## अभ्यास

1. **简单。**में 4×4 ग्रिडवर्ल्ड 上运行 PPO, उपयोग `ε=0.2, K=4`                                                                                                                                                                                                                                                              
2. **中等。**पोंछें`K ∈ {1, 4, 10, 30}`◊ रिटर्न बनाम एनवी चरणों को चित्रित करें, और प्रत्येक अपडेट के औसत KL को ट्रैक करें`K`कब तक KL विस्फोट होगा?
3. **困难。**उपयोग अनुकूलन KL दंड  के लिए प्रतिस्थापन कटौती सरोगेट अगर`KL > 2·target`,`β`翻倍; अगर `KL < target/2`,`β`减半) ・比较终极回报、稳定和 clip-freeness──

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

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) 论文──
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477) TRPO,PPO का पूर्ववर्ती
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990) प्रत्येक पीपीओ हाइपरपरमैटर के लिए अपवर्तन करें
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) निर्देशजीपीटी;पीपीओ-इन-आरएलएचएफ 配方。
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) 使用 PyTorch 的清晰现代讲解──
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) 很多论文使用的参考 एकल फ़ाइल पीपीओ──
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer)                                                                                                                                                                                                                                                              
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) 37 कोड-स्तर अनुकूलन 论文; कौन सी पीपीओ ट्रिक्स है भारी संरचना, कौन सी सिर्फ लोक कथा है
