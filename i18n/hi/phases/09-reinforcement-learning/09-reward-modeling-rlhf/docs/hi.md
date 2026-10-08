# रिवार्ड मॉडलिंग और आरएलएचएफ

> लोग अच्छे सहायक प्रतिक्रिया के लिए नहीं कर सकते हैं, लेकिन वे दो प्रतिक्रियाओं की तुलना कर सकते हैं, और बेहतर एक चुन सकते हैं।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 分钟

## 问题

आप अगले टोकन-पूर्वानुमान उद्देश्य के साथ एक भाषा मॉडल को प्रशिक्षित कर चुके हैं। यह सही अंग्रेजी में भाषा का एक मॉडल लिख सकता है। यह भी झूठ बोल सकता है, और इसे अस्वीकार कर सकता है।

आप एक*मानक राशि इनाम* चाहते हैं, संकेत देते हैं निर्देश X के लिए, प्रतिक्रिया A से प्रतिक्रिया B से बेहतर है🏼 हाथ से लिखें यह इनाम फ़ंक्शन है असंभव── मददगारता नहीं टोकन ऊपर बंद-रूप अभिव्यक्ति──लेकिन मनुष्य दो आउटपुटों की तुलना कर सकता है और प्राथमिकता को चिह्नित कर सकता है──यह कम लागत पर बड़े पैमाने पर संग्रह कर सकता है──

RLHF(Christiano et al. 2017; Ouyang et al. 2022)  प्राथमिकता  को इनाम मॉडल में परिवर्तित करें, फिर इस इनाम के लिए PPO  का उपयोग करें  LM                                                                                                                                                                                                                                      

2026 तक, पीपीओ 步骤大多被 DPO (Phase 10 · 08) द्वारा प्रतिस्थापित किया जाएगा, क्योंकि यह अधिक सस्ता है, और संरेखण ट्यूनिंग के लिए लगभग उतना ही अच्छा है। लेकिन *उपहार मॉडल* का हिस्सा अभी भी प्रत्येक सर्वश्रेष्ठ-ऑफ-एन नमूनाकरण पर आधारित है।

## 概念

![Three-stage RLHF: SFT, RM training on pairwise prefs, PPO with KL penalty](../assets/rlhf.svg)

**Stage 1：Supervised Fine-Tuning（SFT）。**开始──在目标行为的人类编写示范 上细节调️ निर्देश-अनुशरण प्रतिक्रियाएँ、उपयोगी उत्तर इत्यादि)`π_SFT`मॉडल, यह अच्छे व्यवहार की ओर मुड़ता है, लेकिन अभी भी कार्रवाई के लिए असीमित स्थान है।

**Stage 2：Reward Model training。**

- 收集对提示 `x``(y_+, y_-)`, द्वारा मानव द्वारा चिह्नित y_+ 优于 y_-──
-  प्रशिक्षण पुरस्कार मॉडल `R_φ(x, y)`, इसे दे दो ।`y_+`分配更高分数──
- हानि:**Bradley-Terry pairwise logistic**:

  `L(φ) = -E[ log σ(R_φ(x, y_+) - R_φ(x, y_-)) ]`

  σ 是 सिग्मोइड── रिवार्ड्स का अंतर 隐含偏好 的 लॉग-ऑड्स──BT 1952 से ब्राडली-टेरी) से हमेशा मानक विधि रही है, यह भी आधुनिक आरएलएचएफ में मुख्य प्रवाह चयन──

- `R_φ`आमतौर पर एसएफटी मॉडल से आरंभिक, और शीर्ष पर एक स्केलर सिर जोड़ना।

**Stage 3：带 KL penalty、针对 RM 的 PPO。**

- से `π_SFT`प्रारंभिक प्रशिक्षण नीति`π_θ`                                                                                                                                                                                                                                                              `π_ref = π_SFT`
- प्रतिक्रिया `y`结束时的奖励:

  `r_total(x, y) = R_φ(x, y) - β · KL(π_θ(·|x) || π_ref(·|x))`

  KL दंड 防止 `π_θ`任意漂离 `π_SFT` यह एक *नियमितकर्ता*, नहीं है कठोरता ट्रस्ट क्षेत्र──`β`आम तौर पर `0.01`-`0.05`
- इस पुरस्कार का उपयोग करें 运行 PPO(पाठ 08)  फायदे ऊपर गणना में टोकन स्तर की प्रक्षेपवक्र में, लेकिन RM केवल पूर्ण प्रतिक्रिया 打分 देता है

**为什么需要 KL？**没有它,PPO会很乐意找到奖励黑客策略  RM                                                                                                                                                                                                                                                     `π_θ`保持在RM 训练过的多样性 附近──它是RLHF में सबसे महत्वपूर्ण एकल旋──

**2026 状态：**

- **DPO**(राफेलोव 2023): बंद-रूप बीजगणित डालें चरण 2+3 फॉल्ड करें एक प्राथमिकता डेटा में ऊपर की निगरानी हानि                                                                                                                                                                                                                                              
- **GRPO**(DeepSeek 20242025):पीपीओ के परिवर्तन, समूह-संबंधी आधार रेखा के साथ आलोचना के बजाय, *verifier* से पुरस्कार प्राप्त करें, कोड रन / गणित उत्तर मैचों से), बल्कि मानव प्रशिक्षण के आरएम में।
- **Process reward models（PRMs）：**给部分解决方案 (GROP) 变体 (GROP) 变体)
- **Constitutional AI / RLAIF：**मानव संसाधनों के बजाय संरेखित LLM उत्पादन वरीयताओं का उपयोग करें।


```figure
reward-model
```

##  इसे निर्माण

इस वर्ग में प्रयोग किया गया है लघु संश्लेषित प्रॉम्प्ट्स和उत्तर, का मतलब है 字符串──RM एक बैग-ऑफ-टोकन पर आधारित है `code/main.py`

### चरण 1: सिंथेटिक प्राथमिकता डेटा

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

वास्तविक RLHF में, यह मानव लेबलरों द्वारा 代替──形状   `(prompt, preferred_response, rejected_response)` 完全相同──

### चरण 2: ब्रैडली-टेरी इनाम मॉडल

रैखिक स्कोरः`R(x, y) = w · bag(y)` प्रशिक्षण  न्यूनतम बीटी जोड़ी-जोड़ी लॉग-लॉस

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

कुछ सौ बार अपडेट के बाद,`w`अच्छा शब्द टोकन को सही वज़न का वितरण, बुरा शब्द टोकन को नकारात्मक वज़न का वितरण।

### चरण 3: आरएम 之 पर पीपीओ जैसी नीति

हमारी खिलौना नीति शब्दकोश से एक टोकन उत्पन्न करेगा। हम RM का उपयोग कर इस टोकन को 打分,计算 `log π_θ(token | prompt)`, जोड़ें KL-to-reference दंड,并应用 कटौती पीपीओ सरोगेट

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

### चरण 4: मॉनिटर KL

हर अद्यतन ट्रैकिंग मतलब`KL(π_θ || π_ref)` अगर यह चढ़ गया `~5-10`, नीति 已漂离 `π_SFT`很远 低 `β`यह वास्तविक RLHF में सबसे महत्वपूर्ण निदान है।

### चरण 5: TRL का उपयोग करें उत्पादन नुस्खा

समझना खिलौना पाइपलाइन 后,下面是同一循环作为真实图书馆用户的写法──Hugging Face 的 [TRL](https://huggingface.co/docs/trl) चरण 2 उपयोग`RewardTrainer`, चरण 3 उपयोग`PPOTrainer`(内置 KL-to-reference)

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

पुस्तकालय तुम्हें तीन काम करने के लिए होगाः`adap_kl_ctrl=True`实现 अनुकूलन-β अनुसूची: यदि KL 超过 `target_kl`,β 翻倍; यदि आधा से कम हो,β 减半── संदर्भ मॉडल 按约定是结的  你不能意外地和 `policy`共享参数── मूल्य सिर और नीति 位于同一个脊柱上(`AutoModelForCausalLMWithValueHead`् एक स्केलर एमएलपी सिर जोड़ें), यही कारण है कि टीआरएल बैठक अलग रिपोर्ट ् `policy/kl`和 `value/loss`

## 陷

- **Over-optimization / reward hacking。**आरएम अपूर्ण नहीं है;`π_θ`                                                                                                                                                                                                                                                              `β`、 विस्तार RM प्रशिक्षण डेटा
- **Length hacking。**长度――Politics 学会填充答案──补救:लंबाई-मानककृत पुरस्कार,或使用-लंबाई-जागरूक RM के RLAIF──
- **RM 太小。**कम से कम आरएम की जरूरत है और नीति एक ही है।
- **KL tuning。** 太低 → drift 和 reward hacking──β 太高 → नीति 几乎不变──标准技巧是使用一个以固定的每步 KL 为目标的 *适应的* β──
- **Preference-data noise。**लगभग 30% मानव लेबल शोर या भ्रम है।
- **Off-policy problems。**पीपीओ डेटा प्रथम युग में 后会略略脱政策──像课08那样监控 क्लिप अंश──

## इसका उपयोग करें

2026 के आरएलएचएफ में निम्न स्तर के लोग शामिल होंगे:

| Layer | Target | Method |
|-------|--------|--------|
| Instruction following, helpfulness, harmlessness | Alignment | DPO（Phase 10 · 08）优于 RLHF-PPO。 |
| Reasoning correctness（math, code） | Capability | 使用 verifier reward 的 GRPO（Phase 9 · 12）。 |
| Long-horizon multi-step tasks | Agentic | 在 steps 上使用 process reward models 的 PPO / GRPO。 |
| Safety / refusal behavior | Safety | RLHF-PPO with separate safety RM，或 Constitutional AI。 |
| Best-of-N at inference | Fast alignment | 在 decode time 使用 RM；不需要 policy training。 |
| Reward distillation | Inference compute | 在 frozen LM 顶部训练一个小的 “reward head”。 |

आरएलएचएफ 2022-2024 वर्ष की** उस* विधि है। 2026 वर्ष तक डीपीओ-पहले के आधार पर संरेखण पाइपलाइनों का उत्पादन किया जाएगा।

## 交付 यह

保存为 `outputs/skill-rlhf-architect.md`:

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

## अभ्यास

1. **简单。**`code/main.py`中500  सिंथेटिक प्राथमिकता जोड़े  प्रशिक्षण ब्रैडली-टेरी इनाम मॉडल──在 hold-out के 100  जोड़े 上测量 जोड़ी सटीकता── 90% से अधिक होना चाहिए──
2. **中等。**उपयोग `β ∈ {0.0, 0.1, 1.0}`运行 खिलौना PPO-RLHF लूप──对每个值,绘制 RM स्कोर बनाम KL-to-reference over updates── कौन से रन 发生奖励-hack?
3. **困难。**RLHF-PPO पाइपलाइन के साथ उपयोग की गणना में और अंतिम RM स्कोर तक पहुंचने में वृद्धि

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
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) RLHF का संक्षेप में उपयोग किया जाना 
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) डीपीओ;2026 साल के बाद आरएलएचएफ का默认方法──
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) RLAIF 和 आत्म-आलोचना लूप
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862) HH 论文──
- [Hugging Face TRL library](https://huggingface.co/docs/trl) 生产级 `RewardTrainer`和 `PPOTrainer`❖ पढ़िए प्रशिक्षक स्रोत, समझें अनुकूलन-केएल 和 मूल्य-मुख 细节──
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf)लाम्बर्ट, कास्ट्रिकाटो, वॉन वेरा, हैवरिला द्वारा  带图解的三阶段管道 经典 walkthrough──
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl) पुस्तकालय;`examples/`Llama、Mistral 和 Qwen की अंत से अंत तक RLHF स्क्रिप्टों की ओर
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf) पुरस्कार-अनुमान 视角;思考 पुरस्कार हैकिंग के आवश्यक पूर्व निर्धारित ज्ञान──
