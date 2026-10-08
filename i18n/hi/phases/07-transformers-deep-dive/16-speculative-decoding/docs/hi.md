# अनुमानित डिकोडिंग  ड्राफ्ट  सत्यापित  दोहराएं

> ऑटोरेग्रेसिव डिकोडिंग एक पंक्ति है। प्रत्येक टोकन को पहले एक टोकन का इंतजार करना होगा। अटकलबाजी डिकोडिंग ने इस कड़ी को तोड़ दिया हैः एक सस्ता मॉडल पहले N 个 टोकन का ड्राफ्ट, महंगी मॉडल एक बार आगे के पास में सत्यापित करें। सभी N 个 टोकन। जब ड्राफ्ट सही समय पर, आप एक बार बड़े आगे का उपयोग करते हैं तो N 个生成 पूरा हो गया है।

**Type:** Build
**Languages:** Python
**先修要求:**चरण 7 · 07 (जीपीटी कारण एलएम), चरण 7 · 12 (केवी कैश और फ्लैश ध्यान)
**Time:** ~60 minutes

## 问题

एक 70B LLM में H100 上采采样一个 टोकन 需要约30 ms──一个 3B草案模型 需要约3 ms──如果让3B草案 提前生成5 टोकन,然后让70B *只运行一次*来验证这5 टोकन,总耗时就是`5×3 + 30 = 45 ms`, अधिकतम स्वीकार्य 5 टोकन; और सीधे उत्पन्न करने की आवश्यकता है `5×30 = 150 ms` यही है अनुमानित डिकोडिंग का पूर्ण विक्रय बिंदु: कम मात्रा में अतिरिक्त GPU स्मृति के साथ  ड्राफ्ट मॉडल) 24× कम डिकोडिंग विलंबता के लिए 

关键在必须保留分布──Leviathan et al. (2023) तथा Chen et al. 同期提出的投机样本保证输出序列与大模型单独生成时的分布**完全相同**                                                                                                                                                                                                                                                              

2026 तक, चार प्रकार के ड्राफ्ट-वेरिफायर 组合主导推论:

1. **Vanilla speculative (Leviathan 2023)。**独立 मसौदा मॉडल (उदाहरण के लिए Llama 3 1B) + सत्यापनकर्ता (उदाहरण के लिए Llama 3 70B)
2. **Medusa (Cai 2024)。**में सत्यापित करने वाला ऊपर जोड़ने के लिए कई डिकोडिंग सिर,并行预测位置 `t+1..t+k`不需要独立草案模型──
3. **EAGLE family (Li 2024, 2025)。**复用验证器 छिपे हुए राज्यों का हल्का मात्रा ड्राफ्ट; वैनिला से अधिक निकट;典型为34×。
4. **Lookahead decoding (Fu 2024)。**जैकोबी पुनरावृत्ति; पूर्णतः ड्राफ्ट मॉडल की आवश्यकता नहीं है।

2026 के प्रत्येक उत्पादन स्तर के निष्कर्ष स्टैक में अनुमानित डिकोडिंग उपलब्ध कराई जाएगी।

## 核心概念

### 核心算法

给定一个验证器 `M_q`और एक अधिक सस्ता ड्राफ्ट `M_p`:

1. `x_1..x_k`为已解码的前音:
2. **Draft**: उपयोग `M_p`स्व-निर्धारीत 提议 `d_{k+1}, d_{k+2}, ..., d_{k+N}`, प्रति应 संभावनाओं के मसौदे`p_1..p_N`
3. **并行 verify**: में `x_1..x_k, d_{k+1}, ..., d_{k+N}`ऊपर एक बार चलना `M_q`, स्थान प्राप्त करें`k+1..k+N+1` के सत्यापनकर्ता संभावना `q_1..q_{N+1}`
4. **从左到右 accept/reject 每个 draft token**: प्रत्येक के लिए `i`,             `min(1, q_i(d_i) / p_i(d_i))`接受──
5. स्थान पर `j`प्रथम अस्वीकृति 时:归化后的" अवशिष्ट" वितरण `(q_j - p_j)_+`中采样 `t_j``j`इसके बाद सभी ड्राफ्ट्स को छोड़ दिया गया।
6. यदि सभी `N`个都被接受: से `q_{N+1}`采样一个额外 टोकन `t_{N+1}`(मौजूद बोनस टोकन)

शेष वितरण यह तकनीक है आउटपुट वितरण और `M_q`पूर्णतः संगत गणितीय अंतर्दृष्टि से

### 什么决定加速

`α`= प्रत्येक ड्राफ्ट टोकन की अपेक्षित स्वीकृति दर―令`c`= ड्राफ्ट-टू-वेरिफायर लागत अनुपात── प्रत्येक चरण मेंः

- साफ़ पीढ़ी प्रत्येक टोकन  आवश्यकता 1 बार बड़े मॉडल कॉल 
- `α`很高时, अनुमानित प्रत्येक `(1 - α^{N+1}) / (1 - α) ≈ 1/(1-α)`个 टोकन 需要1 बार बड़े मॉडल कॉल

`α = 0.75`且 `N = 5`时,典型经验法则是: बड़े मॉडल कॉल 减少 3×── ड्राफ्ट लागत 5× सस्ती──总体墙-钟 约下降 2.5×──

**α 取决于：**

- सत्यापनकर्ता के लिए मसौदे की निकटता की डिग्री── परिवार/शिक्षा के साथ आंकड़े
- कूटनीति◆ लोभी मसौदा◆ लोभी सत्यापनकर्ता:α 高── तापमान नमूनाकरण:更难匹配; स्वीकृति 下降──
- कार्य प्रकार──कोड तथा संरचित आउटपुट 接受更多(更可预测);自由形式创意写作接受更少──

### मेदुसा  没有 मसौदा मॉडल का मसौदा

मेडुसा उपयोग सत्यापनकर्ता ऊपर के अतिरिक्त आउटपुट हेड  वैकल्पिक मसौदा मॉडल── स्थित `t`:

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

प्रत्येक सिर आउटपुट अपने logits ∞ इन्फरेन्स ∞, आप प्रत्येक सिर ∞ से नमूना प्राप्त उम्मीदवार क्रम, फिर एक बार आगे पास और पेड़-ध्यान योजना के साथ सभी उम्मीदवारों की निरंतरता को सत्यापित करने के लिए ∞

优点:没有第二个模型──缺点: प्रशिक्षित मापदंडों को बढ़ाएं; एक पर्यवेक्षित ठीक-ठीक 阶段(约1B टोकन);स्वीकृति दर 比使用优秀草案的 vanila अटकलें 略低──

### ईगल                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

EAGLE-1/2/3 (Li et al., 20242025) एक बहुत छोटे से ट्रांसफार्मर के लिए डिज़ाइन किए गए मसौदे मॉडल को परिभाषित करेगा, आमतौर पर 1 परत), जो कि सत्यापनकर्ता के अंतिम परत छिपे राज्यों में प्रवेश करेगा।

ईगल-3 (2025) ने उम्मीदवारों के लिए वृक्ष खोज में शामिल किया गया है।

### KV कैश नृत्य

सत्यापन बैठक `N`个草案 टोकन 在一次前进通中给验证人──这将将验证者的 KV缓存扩展`N`项── यदि कुछ मसौदा अस्वीकार कर दिया गया है, तो आपको कैश को वापस स्वीकार किए गए पूर्वावलोकन की लंबाई तक रोल करना होगा──

生产实现(vLLM के `--speculative-model`、TensorRT-LLM का LookaheadDecoder) के माध्यम से खरोंच KV बफर 处理 इस बात को──先写入,接受时再 commit──概念上不难,但细节很繁──


```figure
draft-verify-tokens
```

##  इसे निर्माण

见 `code/main.py`◊ हम निम्नलिखित घटकों का उपयोग कर मूल अनुमानात्मक नमूनाकरण 算法 को प्राप्त करते हैं (अवरोध चरण + शेष वितरण):

- एक "बड़ा मॉडल", यह हाथ से लिखा वितरण पर निर्धारक-नरम अधिकतम है।
- एक "ड्राफ्ट मॉडल", यह बड़े मॉडल का परेशान संस्करण है।
- एक स्वीकृति/अस्वीकार लूप, प्रत्यक्ष नमूनाकरण के समान सीमांत वितरण के साथ उत्पन्न करना

### 步骤 1: अस्वीकार कदम

```python
def accept_or_reject(q_prob, p_prob, draft_token, u):
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")
    return u < min(1.0, ratio)
```

`u`यह एक समान यादृच्छिक संख्या है।`q_prob`है सत्यापनकर्ता के लिए तैयार टोकन की संभावना`p_prob`                                                                                                                                                                                                                                                              

### 步骤 2: अवशिष्ट वितरण

```python
def residual_dist(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    return [r / s for r in raw]
```

् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ्`q`中减去 `p`, शून्य तक नकारात्मक मूल्य को क्लैंप करेगा, फिर पुनः पुनर्मिलन करेगा.

### 步骤 3: एक अनुमानात्मक कदम

```python
def spec_step(prefix, q_model, p_model, N, rng):
    drafts = []
    p_probs = []
    ctx = list(prefix)
    for _ in range(N):
        p_dist = p_model(ctx)
        d = sample(p_dist, rng)
        drafts.append(d)
        p_probs.append(p_dist[d])
        ctx.append(d)

    q_dists = [q_model(prefix + drafts[:i]) for i in range(N + 1)]

    for i, d in enumerate(drafts):
        u = rng.random()
        q_prob = q_dists[i][d]
        p_prob = p_probs[i]
        if u < min(1.0, q_prob / p_prob if p_prob > 0 else float("inf")):
            prefix = prefix + [d]
        else:
            res = residual_dist(q_dists[i], p_model(prefix))
            prefix = prefix + [sample(res, rng)]
            return prefix
    prefix = prefix + [sample(q_dists[N], rng)]
    return prefix
```

接受五个 → 一个奖金 → 一次验证通过 生成六个代币──

### 步骤 4: स्वीकृति दर का माप

विभिन्न मसौदा-गुणवत्ता में 水平下运行 10,000 个投机步骤── मसौदा स्वीकृति दर और मसौदा 和 सत्यापनकर्ता के बीच केएल विभेदन के संबंध को विभाजित करना──आपको स्पष्ट एकतरफा संबंध देखना चाहिए──

### 步骤 5: सत्यापन वितरण सममूल्य

 अनुभव अनुभव: अनुमानित लूप 生成的 टोकन直方图应直接匹配从验证器 采样得到的直方图――这是实践中的利未坦定理――ची-क्वायर टेस्ट 会确认差异在样本错误范围――

## इसका उपयोग करें

उत्पादनः

```bash
# vLLM with EAGLE
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model /models/llama-3.1-eagle-70b \
    --speculative-draft-tensor-parallel-size 1 \
    --num-speculative-tokens 5

# vLLM with vanilla draft model
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model meta-llama/Llama-3.2-1B-Instruct \
    --num-speculative-tokens 5
```

2026 तक, टेन्सरआरटी-एलएलएम में सबसे तेज़ मेदुसा मार्ग है।`faster-whisper`के लिए चुप्पी-बड़ा 封装了带小草案的推测解码──

**选择 draft：**

| Strategy | 何时选择 | Speedup |
|----------|--------------|---------|
| Vanilla draft (1B/3B Llama family) | 快速 prototype，无需 training | 1.8–2.3× |
| Medusa heads | 你可以 fine-tune verifier | 2–3× |
| EAGLE-2 / 3 | Production，最高速度 | 3–4× |
| Lookahead | 无 draft、无 training、无额外 params | 1.3–1.6× |

**什么时候不要 spec-decode：**

- केवल 15 个 टोकन का एकल-अनुक्रम पीढ़ी उत्पन्न करें──ओवरहेड 占主导──
- 极具创意 / उच्च तापमान नमूनाकरण (α 会下降)
- स्मृति-सीमित तैनाती (DRAM)

## 交付 यह

见 `outputs/skill-spec-decode-picker.md` यह कौशल 会为新推理工作负载 选择一种 अटकलबाजी डिकोडिंग रणनीति (वानीला / मेडुसा / ईगल / लुकहेड) तथा ट्यूनिंग पैरामीटर (N、ड्राफ्ट तापमान) 

## अभ्यास

1. **Easy。**运行 `code/main.py`❖ पुष्टि ❖ 50,000 个 टोकन 上, अनुमानित टोकन वितरण सत्यापितकर्ता के प्रत्यक्ष-सैंपल वितरण ❖ मेल खाती है, और चि-वर्ग p > 0.05 ❖
2. **Medium。**`α = 0.5, 0.7, 0.85`, चित्रण गतिप्रदर्शन( प्रत्येक बड़े मॉडल आगे के टोकन संख्या) के साथ`N`                                                                                                                                                                                                                                                              `N`(संकेतः प्रति बार सत्यापित कॉल का अपेक्षित टोकन संख्या = `(1 - α^{N+1}) / (1 - α)`)
3. **Hard。**实现一个小的梅杜萨:取课14的结石GPT,添加3个额外的LM头,分别预测位置 t+2、t+3、t+4──在小摇篮上用联合多头损失训练──与通过截断同一个模型得到的香草草比较接受率──
4. **Hard。**实现 rollback: एक 10-टोकेन पूर्वावलोकन KV कैश से 开始,进入 5 个草案 टोकन,模拟在位置 3 अस्वीकार――验证下一轮代时你的缓存 读取结果正确匹配 "पूर्वावलोकन + पहले 2 स्वीकृत ड्राफ्ट"――

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| Draft model | “便宜的那个” | 一个更小的模型，用于提出候选 Token；通常比 verifier 便宜 10–50×。 |
| Verifier | “大的那个” | 我们要保留其分布的目标模型；每个 speculative step 运行一次。 |
| Acceptance rate (α) | “draft 有多常对” | verifier 接受 draft 的 per-token probability。典型为 0.7–0.9。 |
| Residual distribution | “rejection fallback” | 归一化后的 `(q - p)_+`；rejection 时从这里采样可保留 verifier 的分布。 |
| Bonus token | “免费的那个” | 当全部 N 个 draft 被接受时，从 verifier 的 next-step distribution 再采样一个。 |
| Medusa | “Draft-less speculative” | verifier 上的多个 LM heads 并行预测位置 t+1..t+k。 |
| EAGLE | “Hidden-state draft” | 以 verifier last-layer hidden states 为条件的 tiny transformer draft。 |
| Lookahead decoding | “Jacobi iteration” | 使用 fixed-point iteration 的 self-speculation；没有 draft model。 |
| Tree attention | “一次 verify 多个候选” | 同时考虑多个 draft continuations 的 branching verification。 |
| KV rollback | “撤销 rejected drafts” | Scratch KV buffer；接受时 commit，reject 时 discard。 |

## 延伸阅读

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) 核心算法与等式定理──
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) 同期提出; स्पष्टता की बर्नुली- अस्वीकृति 证明──
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) मेदुसा 论文;वृक्ष-ध्यान 验证。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) ईगल-1; छिपे हुए राज्य के 条件 के आधार पर ड्राफ्ट
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) एग्ल-2;गिरों की गतिशील गहराई
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840) ईगल-3──
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057) देखो, कोई ड्राफ्ट नहीं 方法。
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html)  सभी चार प्रकार के रणनीतियों के मानक उत्पादन संदर्भ से जुड़ा हुआ है
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE) ईगल-1/2/3 का संदर्भ कोड──
