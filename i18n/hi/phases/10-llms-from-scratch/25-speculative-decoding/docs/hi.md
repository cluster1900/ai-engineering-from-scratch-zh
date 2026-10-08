# अनुमानित डिकोडिंग और ईगल

> सीमा LLM 生成一个代币 需要对数十亿参数进行一次完整的前进传递. इस前进传递的配置远超实际需要: ज्यादातर समय, एक छोटा सा मॉडल, अगले 3-5 代币 को सही ढंग से अनुमान लगा सकता है, जबकि बड़े मॉडल को केवल * सत्यापित* करने की आवश्यकता होती है।

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

## 问题

70B श्रेणी मॉडल H100 पर डिकोड पारगमन आमतौर पर 40-80 टोकन/सेकंड है। प्रत्येक टोकन को एक पूर्ण आगे की पार करने की आवश्यकता होती है। HBM से सभी मॉडल वजन को पढ़ना है। आप बिना किसी परिवर्तन के आउटपुट के मामले में छोटा मॉडल नहीं कर सकते हैं। आप बैच आकार को बढ़ाने के लिए भी नहीं रह सकते हैं।

स्व-अंतरवर्ती पीढ़ी प्राकृतिक है।`x_{t+1} = sample(p(· | x_{1:t}))` लेकिन यहाँ एक और अवसर है  यदि आपके पास एक सस्ता भविष्यवाणीकर्ता है तो अगले 4 टोकन  बहुत संभव है [a, b, c, d], आप कर सकते हैं**大 model 的单次 forward pass**सभी 5 स्थानों को सत्यापित करें, और सबसे लंबे समय तक अनुकूलित होने का स्वीकार करें।

लेवीयतन、कालई、मैटियास(2023,स्पेक्लूटिव डिकोडिंग के माध्यम से ट्रांसफार्मर से फास्ट इन्फरेंस) एक巧妙的 स्वीकार/ अस्वीकार के माध्यम से 规则精确实现这一点,该规则保留目标模型的样本分布──相同的输出分布,速度提升 2-4x──

## 概念

### 双 मॉडल  सेटिंग

- **Target model** `M_p`: तुम वास्तव में बड़े आकार के, धीमे, उच्च गुणवत्ता वाले मॉडल से देखना चाहते हो।`p(x)`
- **Draft model** `M_q`:小型、快速、质量较低的模型──वितरणः`q(x)`✿小 5-30x✿

हर कदम:

1. मसौदा मॉडल autoregressively 提议 `K`个 टोकन:`x_1, x_2, ..., x_K ~ q`
2. सभी के लिए लक्ष्य मॉडल`K+1`个位置并行运行 एक बार आगे पास,为每提议 टोकन 生成 `p(x_k)`
3. 按下面修改后的拒绝-样本取法 规则从左到右接受/拒绝 每个代币──接受最长匹配前──
4. यदि किसी भी टोकन को अस्वीकार कर दिया जाता है, तो संशोधित के बाद वितरण से टोकन को प्रतिस्थापित करने का तरीका बंद नहीं होता है।`p(· | x_1...x_K)`采样一个奖金代币──

यदि ड्राफ्ट लक्ष्य के साथ पूरी तरह से मेल खाता है, तो आप प्रत्येक लक्ष्य-आगे के लिए K + 1 टोकन प्राप्त कर सकते हैं।

### 精确性规则

अनुमानित डिकोडिंग **在 distribution 上可证明等价于从 p 采样**❖ अस्वीकार 规则:

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

उनमें से `(p - q)+`व्यक्त करना क्रमशः भिन्नता का सही भाग──当草案 和 लक्ष्य 一致(`p ≈ q`) समय, स्वीकृति 接近 1 ⋅ जब वे असंगत होते हैं, तो अवशिष्ट वितरण का निर्माण किया जाता है, जिससे संपूर्ण नमूना  अभी भी सटीक रूप से पालन करता है `p`

**Greedy 情况。**तापमान=0 के लिए नमूना लेने के लिए केवल जांच की आवश्यकता है`argmax(p) == x_t` यदि हां, तो स्वीकार करें; यदि नहीं, तो आउटपुट करें `argmax(p)`और रुकना बंद कर दिया

### 期望 गति

यदि मसौदा मॉडल के टोकन 级 स्वीकृति दर `α`, तो प्रत्येक लक्ष्य-आगे पास 生成的期望 टोकन संख्या为:

```
E[tokens] = (1 - α^{K+1}) / (1 - α)        # K = draft length, α in [0, 1]
```

`α = 0.8, K = 4`:`(1 - 0.8^5)/(1 - 0.8) = 3.36`个 टोकन प्रत्येक बार आगे--- एक बार लक्ष्य आगे की लागत लगभग है `cost_q * K + cost_p`(के 个 मसौदा चरण加一次目标 सत्यापित)`cost_p >> cost_q * K`,प्रभाव का गति अनुपात है`3.36× / 1 = 3.36×`

 एकमात्र वास्तविक घटक  है`α`, यह पूरी तरह से मसौदा-लक्ष्य संरेखण पर निर्भर करता है. अच्छा मसौदा यही सब कुछ है.

### 训练 ड्राफ्ट:डिस्टिलैशन

随机的小模型会成为非常差的草案―― मानक प्रथा लक्ष्य डिस्टिल से हैः

1. 选择一个小建筑(70B लक्ष्य对应约1B,7B लक्ष्य对应约500M)
2. बड़े पैमाने पर ग्रंथ भाषा सामग्री पर परिचालन लक्ष्य मॉडल; भंडारण इसके अगले टोकन वितरणों
3. प्रयोग KL विभेदन  प्रशिक्षण ड्राफ्ट, इसे लक्ष्य के वितरण के साथ मेल खाने के बजाय जमीन-सत्य टोकन के साथ मेल खाने के लिए)

परिणाम यह हैः`α`0.7-0.85--- उत्पादन में गति अप 2-3x---

### ईगलःट्री ड्राफ्टिंग + फीचर रियूज

Li、Wei、Zhang、Zhang(2024,एग्लः अनुमानात्मक नमूनाकरण के लिए पुनर्मूल्यांकन की आवश्यकता है विशेषता अनिश्चितता) मानक अनुमानात्मक डिकोडिंग का निरीक्षण करें 中的两个低效点:

1. मसौदा                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
2. ड्राफ्ट 输出一条线性链── यदि ड्राफ्ट 能输出一个候选人 *tree*( प्रत्येक节点有多个猜测), लक्ष्य का एक बार आगे गुजरना 就可以通过树注意面具并行验证多条候选人路径,并选择最长接受分支──

ईगल-1 का परिवर्तनः
- ड्राफ्ट इनपुट = लक्ष्य, कच्चे टोकन के बजाय, स्थान t की अंतिम छिपी हुई स्थिति में है।
- ड्राफ्ट आर्किटेक्चर = 1 个 ट्रांसफार्मर डिकोडर परत(不是独立的小模型)
- आउटपुट = प्रत्येक गहराई के लिए K = 4-8  उम्मीदवार  गहराई 为 4-6 के पेड़ 

EAGLE-2(2024) 加入动态 वृक्ष शीर्षिकी: ड्राफ्ट में अनिश्चित स्थान, वृक्ष 变宽; ड्राफ्ट में स्वविश्वसनीय स्थान, वृक्ष 保持较窄──在不增加验证成本的情况下提高 `α_effective`

EAGLE-3(लि और अन्य 2025,एगेल-3: प्रशिक्षण-समय परीक्षण के माध्यम से बड़े भाषा मॉडल के इन्फरेंस त्वरण को स्केल करना) स्थिर शीर्ष-स्तरीय सुविधा निर्भरता को हटा दिया, नए टेस्ट-टाइम सिमुलेशन हानि  प्रशिक्षण ड्राफ्ट का उपयोग किया, यानि कि शिक्षक-बदला प्रशिक्षण वितरण में नहीं बल्कि लक्ष्य परीक्षण-समय वितरण के आउटपुट पर प्रशिक्षण, प्रशिक्षण पर प्रशिक्षण को अनुकूलित करने के लिए, 0.75 से एगेल-2) से वृद्धि हुई 0.82 तक, औसत टोकन / सत्यापन 3.0 से वृद्धि हुई 4.5 तक।

### पेड़ ध्यान सत्यापन

जब मसौदा 输出树 时, लक्ष्य मॉडल उपयोग **tree attention mask**एक बार आगे जाने के लिए, यह एक कारण का मुखौटा है, यह पेड़ की शीर्षिकी को कोड करता है, शुद्ध लाइनर संरचना की बजाय। प्रत्येक टोकन केवल पेड़ के भीतर के पूर्वजों तक पहुंचता है।

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

यदि `a, b`यह प्रतियोगिता के प्रथम-टोकन उम्मीदवारों,`c, d, e, f`यदि दूसरा टोकन उम्मीदवार है, तो सभी छह स्थानों को एक बार आगे के पास में सत्यापित किया जा सकता है।

### 什么时候有效,什么时候无效

**有效：**
- चैट/समाप्ति,और文本可预测(कोड、常见 अंग्रेज़ी、संरचित आउटपुट)`α`उच्च
- डिकोड 阶段有未使用GPU गणना का सेटअप(मेमोरी-बंद चरण) ――वृक्ष प्रारूपण 使用可用 FLOPs──

**无效 / 没有收益：**
- उच्च तापमान का रचनात्मक लेखन)`α`                   `1/|vocab|`नीचे गिरो
- 非常高 concurrence 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrency 非常高 concurrentity 非常高 concurrentity 非常高 concurrentity 非常高 concurrentity 非常高 concurrentity 非常高 concurrentity 非常高 concurrent 非常高 concurrent 非常高 concurrent 非常高 concurrent 非常高 concurrent 非常高 concurrent 非常高 非常高 concurrent 非常高的 concurrent 非常高的 非常高的 非常高的 非常高的 非常高的 非常高的 非常高的 非常高的 非常高的 非常高的 非常高的 非常高的 非常高的 非常高的
- बहुत छोटे लक्ष्य मॉडल, इस समय ड्राफ्ट में बहुत कुछ नहीं है।

उत्पादन टीम आमतौर पर चैट रिपोर्ट करते हैं ऊपर 2-3 गुना दीवार घड़ी गति, ऊपर 3-5 गुना कोड पीढ़ी, जबकि रचनात्मक लेखन ऊपर शून्य के करीब है।


```figure
speculative-decoding
```

##  इसे निर्माण

`code/main.py`:

- एक संदर्भ प्राप्ति `speculative_decode(target, draft, prompt, K, temperature)`, यह सटीक अस्वीकृति को प्राप्त करता है 规则,并验证 यह लक्ष्य का वितरण बरकरार रखता है (अनुभवात्मक KL < 0.01 बनाम सादा लक्ष्य नमूनाकरण)
- एक एगेल शैली के पेड़ ड्राफ्टर, शीर्ष-पी शाखाओं का उपयोग करके 构建 गहराई-के पेड़──
- एक पेड़ ध्यान मास्क निर्माता, सत्यापन के लिए सही कारणों के पैटर्न का उत्पादन किया गया है
- एक स्वीकृति दर हर्न, एक छोटे से LM 上运行两者(से GPT-2-मध्यम लक्ष्य डिस्टिल एक GPT-2-छोटे)

```python
def speculative_step(p_target, q_draft, K, temperature=1.0):
    """One round of speculative decoding. Returns list of accepted tokens."""
    # 1. Draft K tokens
    draft_tokens = []
    q_probs = []
    state = draft_state_init()
    for _ in range(K):
        probs = softmax(q_draft(state) / temperature)
        t = np.random.choice(len(probs), p=probs)
        draft_tokens.append(t)
        q_probs.append(probs[t])
        state = draft_step(state, t)

    # 2. Target computes p at every drafted position + 1 extra
    p_probs_all = target_forward_batched(p_target, draft_tokens, temperature)

    # 3. Accept/reject left-to-right
    accepted = []
    for k, tok in enumerate(draft_tokens):
        r = np.random.uniform()
        if r < p_probs_all[k][tok] / q_probs[k]:
            accepted.append(tok)
        else:
            residual = np.maximum(p_probs_all[k] - q_probs[k], 0)
            residual /= residual.sum()
            accepted.append(np.random.choice(len(residual), p=residual))
            return accepted
    # 4. All K accepted → sample bonus token from target
    accepted.append(np.random.choice(len(p_probs_all[-1]), p=p_probs_all[-1]))
    return accepted
```

## इसका उपयोग करें

- **vLLM**和 **SGLang**提供一等 अटकलबाजी का डिकोडिंग 支持── झंडे:`--speculative_model``--num_speculative_tokens`ईगल-2/3 通过 `--spec_decoding_algorithm eagle`ध्वज 支持。
- **NVIDIA TensorRT-LLM**मूल जीवन समर्थन मेडुसा और ईगल के पेड़
- **Reference draft models**:`Qwen/Qwen3-0.6B-spec`(Qwen3-32B के मसौदे के लिए प्रयोग किया जाता है)`meta-llama/Llama-3.2-1B-Instruct-spec`(70B के मसौदे के लिए)
- **Medusa heads**(Cai et al. 2024,Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads): मसौदा मॉडल का उपयोग नहीं करता है, बल्कि लक्ष्य 自身上添加 K 个并行预测头――部署更简单,स्वीकार 略低于EAGLE。

## 交付 यह

本课会产出 `outputs/skill-speculative-tuning.md`, यह एक कौशल है, लक्ष्य मॉडल के कार्यभार का विश्लेषण करने के लिए,并选择:ड्राफ्ट मॉडल、K(ड्राफ्ट लंबाई)、वृक्ष चौड़ाई、तापमान,以及何時落后到平面解码──

## अभ्यास

1. 实现精确拒绝 规则并进行实证验证──通过 `speculative_decode`和 सादा लक्ष्य नमूनाकरण 分別运行 10K नमूने; गणना दो आउटपुट वितरण 之间电视距离──应小于0.01──

2. 计算加速 公式──给定固定 `α`和 `K`, प्रत्येक लक्ष्य-आगे की अपेक्षाओं का चित्रण करें टोकन संख्याएँ  ∈ {0.5, 0.7, 0.9}  时的最优 K                                                                                                                                                                                                                                            

3.  प्रशिक्षण एक छोटे से ड्राफ्ट── एक 124M GPT-2 लक्ष्य ले लो, और 100M टोकन ऊपर KL हानि का उपयोग डिस्टिल एक 30M GPT-2 ड्राफ्ट── मापने बाहर रखा पाठ ऊपर की `α`预期: 0.6-0.7──

4. EIGLE-style tree drawing ️ न करें चेन का प्रयोग, बल्कि ️ drawing ️ करे प्रत्येक गहराई में 输出 शीर्ष 3 शाखाएँ️ पेड़ ध्यान मुखौटा ️ परीक्षण लक्ष्य 接受最长正确 शाखा️

5. 测量 विफलता मोड──在温度=1.5(高随机性) 下运行 अटकलबाजी का डिकोड── प्रदर्शन α 崩塌,并且由于草案 ओवरहेड,该算法比平面的解码更慢──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|------------------------|
| Target model | “大 model” | 你想从中采样的缓慢、高质量 model（p distribution） |
| Draft model | “speculator” | 小型、快速 predictor（q distribution）；小 5-30x |
| K / draft length | “Look-ahead” | 每次 verify pass 推测的 Token 数 |
| α / acceptance rate | “Hit rate” | draft 提议被接受的每 Token 概率 |
| Exact rejection rule | “accept test” | 保留 target distribution 的 r < p/q 比较 |
| Residual distribution | “修正后的 p-q” | (p - q)+ / ||(p - q)+||_1，rejection 时要从中采样的 distribution |
| Tree drafting | “Branching speculation” | Draft 输出候选 tree，并用 tree-structured attention mask 在一次 pass 中 verify |
| Tree attention mask | “Topological mask” | 编码 tree topology 的 causal mask，使每个 node 只 attend 到它的 ancestors |
| Medusa heads | “Parallel heads” | target 自身上的 K 个额外 prediction heads；没有独立 draft model |
| EAGLE feature reuse | “Hidden-state draft” | Draft input 是 target 的最后 hidden state，而不是 raw tokens，从而缩小 draft |
| Test-time simulation loss | “EAGLE-3 training” | 在匹配 target test-time distribution 的输出上训练 draft，而不是 teacher forcing |

## 延伸阅读

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192) 精确拒绝 规则和理论加速 分析
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318) DeepMind का समवर्ती अनुमानात्मक नमूनाकरण 论文
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774) प्रारूप मॉडल के समानांतर-उपचार 替代方案
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077) सुविधा पुनः उपयोग 和 पेड़ के चित्रण
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) 动态 वृक्ष टोपोलॉजी
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840) ट्रेन-समय परीक्षण-समय मिलान
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) जैकोबी/लुकाहेड डिकोडिंग, एक प्रकार का विकल्प
