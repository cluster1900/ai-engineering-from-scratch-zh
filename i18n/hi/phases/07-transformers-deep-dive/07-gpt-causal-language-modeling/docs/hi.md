# जीपीटी  कारण भाषा मॉडलिंग

> BERT 能看到两侧──GPT 只有能看到过去──三角面膜是现代AI中影响最深远的一行代码──

**Type:** Build
**Languages:** Python
**先修要求:**चरण 7 · 02 (स्व-ध्यान), चरण 7 · 05 (पूर्ण ट्रांसफार्मर), चरण 7 · 06 (BERT)
**Time:** ~75 分钟

## 问题

भाषा मॉडल 回答一个问题:给定前 `t-1`个 टोकन, टोकन `t`इस संकेत प्रशिक्षण, यानी अगले टोकन भविष्यवाणी के साथ, आप एक बार एक टोकन उत्पन्न कर सकते हैं एक मॉडल प्राप्त होगा

पूरे अनुक्रम में ऊपर की ओर से आगे की ओर प्रशिक्षण करने के लिए, आपको प्रत्येक स्थान का पूर्वानुमान केवल पहले स्थान पर निर्भर करने की आवश्यकता है। अन्यथा मॉडल उत्तर को आसानी से धोखा देगा।

कारणों का मुखौटा  करना यही है यह एक बात है `-inf`值组成的上三角矩阵,在软max 之前加到注意积分上――软max 之后,这些位置将变成0――每位置只能到达自身和更早的位置――因为你把它一次性应用到整个序列上,所以一次性前进传就能得到N 个并行的下一个标记预测――

GPT-1 (2018), GPT-2 (2019), GPT-3 (2020), GPT-4 (2023), GPT-5 (2024), क्लाउड, लामा, क्यूवेन, मिस्ट्रल, डीपसिक, किमी   ये केवल डिकोडर-केवल कारणात्मक ट्रांसफार्मर हैं, कोर चक्र एक ही है।

## 概念

![Causal mask creates a triangular attention matrix](../assets/causal-attention.svg)

### मुखौटा

给定长度为 `N`का अनुक्रम, एक का निर्माण `N × N`मैट्रिक्सः

```
M[i, j] = 0       if j <= i
M[i, j] = -inf    if j > i
```

之前,把`M`अतिरिक्त करने के लिए मूल ध्यान स्कोर ऊपर`exp(-inf) = 0`, इसलिए मुखौटा की स्थिति में योगदान का भार शून्य है। ध्यान मैट्रिक्स की प्रत्येक पंक्ति केवल पूर्ववर्ती स्थिति की संभावना वितरण पर है।

实现成本: एक बार `torch.tril()`调用――计算时间:纳秒级―― संपूर्ण क्षेत्र पर प्रभाव:一切――

### अभ्यास, अभ्यास, अभ्यास

प्रशिक्षण: पूरे के लिए`(N, d_model)`क्रम एक बार आगे-पास करें, गणना N 个 क्रॉस-एंट्रोपी हानि( प्रत्येक स्थान एक),求和,backprop。 क्रम के साथ并行── यही कारण है कि जीपीटी 训练能够扩展的: आप एक GPU पास में बैच में 1M टोकन को संसाधित कर सकते हैंः

推理: तुम व्यक्तिगत टोकन 生成──输入 `[t1, t2, t3]`, प्राप्त `t4`输入 `[t1, t2, t3, t4]`, प्राप्त `t5`输入 `[t1, t2, t3, t4, t5]`, प्राप्त `t6`KV कैश  पाठ 12)保存 `t1…tn`इनकी छिपी हुई अवस्थाओं को हर कदम पर पुनः गणना करने की आवश्यकता नहीं है। लेकिन विचार के समय स्ट्रिंग लाइन गहराई = आउटपुट लंबाई।

### हानि  एक-एक करके शिफ्ट

给定 टोकन `[t1, t2, t3, t4]`:

- इनपुटः `[t1, t2, t3]`
- लक्ष्य: `[t2, t3, t4]`

प्रत्येक स्थान पर`i`, गणना `-log P(target_i | inputs[:i+1])`求和── यह संपूर्ण अनुक्रम की क्रॉस-एंट्रोपी है

आप सुना है कि प्रत्येक ट्रांसफार्मर LM इस हानि का उपयोग किया है  प्रशिक्षण  प्रशिक्षण  प्रशिक्षण  बारीक-ट्यूनिंग  एसएफटी  हानि  समान, डेटा अलग 

### डिकोडिंग रणनीतियाँ

 प्रशिक्षण के बाद,  लोगों की कल्पना से  नमूना चुनना  अधिक महत्वपूर्ण है

| Method | What it does | When to use |
|--------|--------------|-------------|
| Greedy | 每一步取 Argmax | 确定性任务、code completion |
| Temperature | 将 logits 除以 T，然后 sample | 创造性任务，T 越高多样性越强 |
| Top-k | 只从 top-k tokens 中 sample | 消除低概率长尾 |
| Top-p (nucleus) | 从累计概率 ≥ p 的最小集合中 sample | 2020+ 默认选择；会适应分布形状 |
| Min-p | 保留 `p > min_p * max_p` 的 tokens | 2024+；比 top-p 更擅长拒绝长尾 |
| Speculative decoding | draft model 提出 N 个 tokens，big model 验证 | 在质量相同的情况下减少 2–3× 延迟 |

2026 में, खुले-वजन मॉडल के लिए, min-p + तापमान 0.7 एक उचित मानक मूल्य है।

### 让 GPT नुस्खा 起作用的因素

1. **Decoder-only.**没有编码 开销――每层一次注意+FFN पास――
2. **Scaling.**124M → 1.5B → 175B → ट्रिलियनों。 चिंचिला स्केलिंग के नियम️13 पाठ बताओ कि गणना कैसे वितरित की जाए
3. **In-context learning.**लगभग 6B13B 时涌现――模型无需细调就能跟随少数几次的例子――
4. **RLHF.**基于人类偏好后培训 把原始预训练文本模型转化为聊天助理──
5. **Pre-norm + RoPE + SwiGLU.**支大规模稳定训练──

जीपीटी-2 के बाद से, कोर संरचना में बहुत अधिक बदलाव नहीं हुआ है।


```figure
causal-mask
```


```figure
mask-derivation
```

##  इसे निर्माण

### 步骤 1: कारण मास्क

见 `code/main.py`一行代码:

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

 सॉफ्टमैक्स  से पहले इसे ध्यान स्कोर ऊपर  तक बढ़ाएँ।

### 步骤 2: एक 2-परत जीपीटी-शिक मॉडल

堆叠两个解码块(掩饰自注意 + FFN,无横注意)。添加代币嵌入、位置编码 和无嵌入(与代币嵌入矩阵 绑定,这是自 GPT-2 以来来的标准技巧)。

### 步骤 3: अगले टोकन भविष्यवाणी,端到端

एक 20-टोकेन खिलौना शब्दावली में, प्रत्येक स्थान पर लॉजिट्स उत्पन्न होते हैं।

### 步骤 4: नमूनाकरण

实现 लोभी、तापमान、top-k、top-p、min-p──在固定 prompt上运行每种并比较输出── एक नमूना फ़ंक्शन केवल 10 行──

## इसका उपयोग करें

PyTorch,2026 भाषाः

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")
tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")

prompt = "Attention is all you need because"
inputs = tok(prompt, return_tensors="pt")
out = model.generate(
    **inputs,
    max_new_tokens=64,
    temperature=0.7,
    top_p=0.9,
    do_sample=True,
)
print(tok.decode(out[0]))
```

नीचे में,`generate()`运行 फॉरवर्ड पास,取出 अंतिम-स्थिति लॉजिट्स,sample 下一个 टोकन, इसे जोड़ें, फिर重复── प्रत्येक उत्पादन स्तर LLM निष्कर्ष स्टैक(vLLM, TensorRT-LLM, llama.cpp, Ollama, MLX) सभी एक ही चक्र को प्राप्त करने के लिए वजन अनुकूलन के साथ उपयोग करते हैं  बैच प्रीफिल, निरंतर बैचिंग, केवी कैश पेगिंग, अटकलों का डिकोडिंग──

**GPT vs BERT，各用一句话：**जीपीटी 预测 `P(x_t | x_{<t})`BERT 预测 `P(x_masked | x_unmasked)`                                                                                                                                                                                                                                                              

## 交付 यह

见 `outputs/skill-sampling-tuner.md` यह कौशल नई पीढ़ी के कार्य के लिए होगा  नमूना लेने के मापदंडों का चयन करें, और निर्धारात्मक डिकोडिंग की आवश्यकता होगी 

## अभ्यास

1. **Easy.**运行 `code/main.py`, सत्यापित softmax  के बाद का कारण ध्यान मैट्रिक्स ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ 
2. **Medium.**实现宽度为4的束搜索──在10个短提示上比较束4与贪的困惑──beam 总是会赢吗?
3. **Hard.** अनुमानात्मक डिकोडिंग को प्राप्त करेंः एक सूक्ष्म 2-परत मॉडल का उपयोग करें 作为草案, एक 6-परत मॉडल का उपयोग करें 作为验证者──测量 100 个长度为 64 的完成 上的壁表速度──确认输出与验证者的贪输出匹配──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Causal mask | “三角形” | 加到 attention scores 上的上三角 `-inf` matrix，使位置 `i` 只能看到位置 `≤ i`。 |
| Next-token prediction | “loss” | 模型在每个位置上的分布与真实下一个 token 之间的 cross-entropy。 |
| Autoregressive | “一次生成一个” | 将输出反馈为输入；并行性只存在于训练阶段，不存在于生成阶段。 |
| Logits | “pre-softmax scores” | softmax 之前 LM head 的原始输出；sampling 就发生在这些值上。 |
| Temperature | “创造力旋钮” | 将 logits 除以 T；T→0 = greedy，T→∞ = uniform。 |
| Top-p | “Nucleus sampling” | 将分布截断为累计和 ≥p 的最小集合；从剩余部分 sample。 |
| Min-p | “比 top-p 更好” | 保留满足 `p ≥ min_p × max_p` 的 tokens；会根据分布尖锐程度调整 cutoff。 |
| Speculative decoding | “draft + verify” | 便宜模型提出 N 个 tokens；大模型并行验证。 |
| Teacher forcing | “训练技巧” | 训练时输入真实的前一个 token，而不是模型的预测。每个 seq2seq LM 的标准做法。 |

## 延伸阅读

- [Radford et al. (2018). Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) GPT-1。
- [Radford et al. (2019). Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) GPT-2。
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) GPT-3 和 इन-कॉन्टेक्स्ट लर्निंग
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) विशिष्टता डिकोडिंग 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) 标准 कारण-LM 参考代码──
