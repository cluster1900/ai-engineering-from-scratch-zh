# 零构建 ट्रांसफार्मर  कैपस्टोन 项目

> 十三节课──一个模型──不走捷径──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 01 到 13。不要跳过。
**Time:** 约 120 分钟

## 问题

आपने प्रत्येक लेख पढ़ा है। आप ध्यान प्राप्त कर चुके हैं। मल्टी-हेड को अलग करना। स्थिति एन्कोडिंग, एन्कोडर और डिकोडर ब्लॉक, BERT और GPT नुकसान, MOE, KV कैश। अब उन्हें एक वास्तविक कार्य में सहयोग करने दें।

यह कूलस्टोनः एक चरित्र-स्तर भाषा मॉडलिंग में 任务上端到端训练一个小型解码器-केवल ट्रांसफार्मर――它读取莎士比亚――它生成新的莎士比亚――它足够小,它可以在10分钟内在笔记本电脑上训练完成――它也足够正确,只要换成更大的数据集并进行更长时间的训练,就能得到一个真正的LM――

यह इस पाठ्यक्रम का nanoGPT── यह मूल नहीं है  कार्पाथी 2023 के नैनोजीपीटी ट्यूटोरियल यह है कि प्रत्येक छात्र कम से कम एक बार संदर्भ कार्यान्वयन लिखेंगे── हम इसके आकार का उपयोग करते हैं, और इस पाठ्यक्रम के आसपास पहले से ही बताई गई सामग्री को फिर से व्यवस्थित करते हैं──

## 概念

![Transformer-from-scratch block diagram](../assets/capstone.svg)

架构标注如下:

```
input tokens (B, N)
   │
   ▼
token embedding + positional embedding  ◀── Lesson 04 (RoPE option)
   │
   ▼
┌──── block × L ────────────────────┐
│  RMSNorm                          │  ◀── Lesson 05
│  MultiHeadAttention (causal)      │  ◀── Lesson 03 + 07 (causal mask)
│  residual                         │
│  RMSNorm                          │
│  SwiGLU FFN                       │  ◀── Lesson 05
│  residual                         │
└────────────────────────────────── ┘
   │
   ▼
final RMSNorm
   │
   ▼
lm_head (tied to token embedding)
   │
   ▼
logits (B, N, V)
   │
   ▼
shift-by-one cross-entropy            ◀── Lesson 07
```

### हम क्या वितरित करते हैं

- `GPTConfig` 统一配置 सभी हाइपरपरपरमीटर के स्थानों में
- `MultiHeadAttention` कारण  बैच,并带有可选的闪光风格的路径`scaled_dot_product_attention`)。
- `SwiGLUFFN` 现代 FFN。
- `Block` पूर्व-नियमित, शेष 包裹注意 + FFN。
- `GPT` एम्बेडिंग स्टैक किए गए ब्लॉक LM हेड जनरेट करना
- प्रयोग एडमडब्ल्यू, कोसिन एलआर, ग्रेडिएंट क्लिपिंग का प्रशिक्षण लूप
- शेक्सपियर 文本上् कार्-स्तरीय टोकनराइज़र

### हम क्या नहीं वितरित करते

- RoPE  पाठ 04 已从概念上实现──这里为了简单使用学到的位置嵌入──练习会要求你换成 RoPE──
- 生成期间 केवी कैश  प्रत्येक पीढ़ी चरण में पूर्ण पूर्वावलोकन में शहर ऊपर पुनः गणना ध्यान── धीमी लेकिन अधिक सरल── अभ्यास सत्र आपको KV कैश जोड़ने की आवश्यकता──
- फ्लैश ध्यान  PyTorch 2.0+ 会在输入匹配时自动发送;我们使用 `F.scaled_dot_product_attention`
- MoE  प्रत्येक ब्लॉक का उपयोग एक एकल FFN──आप पहले से ही पाठ 11 में MoE को देखा है──

### 目标指标

मैक एम 2 लैपटॉप पर, एक 4 परत, 4 सिर, डी_मॉडल=128 के GPT में `tinyshakespeare.txt`上训练 2,000 कदमः

- प्रशिक्षण हानि में लगभग 6 मिनट में लगभग 4.2 से लेकर लगभग 1.5 तक।
- 采样输出看起来具有莎士比亚的形态:古风词汇、换行,以及像 ROMEO: 这样专名称会出现──
- Val loss (अंतिम 10% पाठ) को ध्यान में रखते हुए प्रशिक्षण के नुकसान के साथ; इस आकार/बजट में नीचे कोई अतिसूचित नहीं है।


```figure
n5-block-stack
```

##  इसे निर्माण

本课使用 PyTorch──安装 `torch`(सीपीयू बिल्ड 即可) 👇参见 `code/main.py`❖ लेखन प्रक्रियाः

- यदि अनुपलब्ध हो तो डाउनलोड `tinyshakespeare.txt`(या पढ़取本地副本)
- बाइट-स्तर के चार टोकनराइज़र
- 90/10 की ट्रेन/वॉल स्प्लिट
- bf16 ऑटोकास्ट का प्रशिक्षण लूप का उपयोग समर्थन हार्डवेयर पर करें
- प्रशिक्षण पूरा होने के बाद नमूनाकरण

### 步骤 1: डेटा

```python
text = open("tinyshakespeare.txt").read()
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
encode = lambda s: [stoi[c] for c in s]
decode = lambda xs: "".join(itos[x] for x in xs)
```

65 个唯一字符──极小的词汇──适合4字节词汇_尺寸──没有BPE,也没有代币器 麻烦──

### 步骤 2: मॉडल

参见 `code/main.py`◊ यह ब्लॉक है पाठ 05 के मानक लेखन विधि  पूर्व-नियमित  RMSNorm SwiGLU  कारण MHA──4/4/128 के पैरामीटर की संख्याः लगभग 800K──

### 步骤 3: प्रशिक्षण लूप

随机取一批长度为 256 的符号窗口──前面──转变-by-one क्रॉस-एंट्रोपी──后面──亚当W कदम──लॉग──重复──

```python
for step in range(max_steps):
    x, y = get_batch("train")
    logits = model(x)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    opt.zero_grad()
```

### 步骤 4: नमूना

给定一个提示,反复前进,从顶部logits中样本,添加,然后继续──500 टोकन 后停止──

### 步骤 5: आउटपुट पढ़ें

2,000 कदम 后:

```
ROMEO:
Away and mild will not thy friend, that thou shalt wit:
The chief that well shame and hath been his friends,
...
```

यह शेक्सपियर नहीं है, लेकिन यह शेक्सपियर की तरह है। 800K के पैरामीटर और लैपटॉप के लिए यह एक स्पष्ट सफलता है।

## इसका उपयोग करें

यह एक संदर्भ वास्तुकला है। इसे वास्तविक उपयोग में विस्तारित करने के लिए, तीन दिशाएं हैंः

1. **更换 tokenizer。**प्रयोग BPE(उदाहरण के लिए `tiktoken.get_encoding("cl100k_base")`)― वोकैब आकार 65 से लगभग 50,000 तक कूद जाएगा― मॉडल क्षमता  के लिए विस्तार की आवश्यकता है
2. **在更大的 corpus 上训练。**उपयोग `OpenWebText`या `fineweb-edu`(HuggingFace) ⋅ में एक单张 A100 上用10B टोकन 训练一个125M-पैरम GPT 大约需要24小时──
3. **添加 RoPE + KV cache + Flash Attention。**निम्नलिखित अभ्यास आपको प्रत्येक कार्य को पूरा करने में सहायता करेगा।

अंततः मुझे एक 125M-पैरामीटर जीपीटी मिल जाएगा, जो कि एक सीमा मॉडल नहीं है। लेकिन यह एक ही कोड पथ है जो कार्पैथी, इलेक्ट्रोएआई और एलन इंस्टीट्यूट द्वारा 2026 में जांच जांच बिंदुओं को प्रशिक्षित करने के तरीके से उपयोग किया जाएगा।

## 交付 यह

参见 `outputs/skill-transformer-review.md` इस कौशल को पहले 13 节 के लिए सही किया जाएगा, एक परिवर्तनकारी-से-नकली कार्यान्वयन की समीक्षा करेगा

## अभ्यास

1. **Easy.**运行 `code/main.py`❖ सत्यापन आप प्रशिक्षित किया गया मॉडल अंतिम चरण सत्यापन हानि ✓ 2.0 से कम ✓ ✓`max_steps`2,000 से 5,000 तक के नुकसान में सुधार जारी रहेगा या नहीं?
2. **Medium.**उपयोग करें RoPE  बदला सीखा स्थिति सम्मिलितों──`MultiHeadAttention`内部对 Q 和 K 应用转移──训练并验证 值 हानि कम से कम समान रूप से कम──
3. **Medium.**नमूना लूप में KV कैश को लागू करना। अलग-अलग कैश और बिना कैश के स्थिति में 500 टोकन उत्पन्न करना। लैपटॉप के ऊपर की दीवार घड़ी को 520×  बढ़ाया जाना चाहिए।
4. **Hard.**给模型 添加第二个头,用来预测下一个加一个代币(MTP  DeepSeek-V3) 联合训练──它有助吗?
5. **Hard.**4-विशेषज्ञ MoE का उपयोग करके प्रत्येक ब्लॉक के भीतर के एकल FFN── राउटर + शीर्ष-2 राउटिंग── सक्रिय मापदंडों के अनुकूल स्थिति में, वैल हानि  कैसे बदलती है, देखें।

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| nanoGPT | “Karpathy 的 tutorial repo” | 最小化的 decoder-only transformer training code，约 300 LOC；canonical reference。 |
| tinyshakespeare | “标准 toy corpus” | 约 1.1 MB 文本；自 2015 年以来几乎每个 character-LM tutorial 都使用它。 |
| Tied embeddings | “共享 input/output matrix” | LM head weight = token embedding matrix 的转置；节省 parameters，并提升质量。 |
| bf16 autocast | “Training precision trick” | 用 bf16 运行 forward/back，在 fp32 中保留 optimizer state；自 2021 年以来成为标准做法。 |
| Gradient clipping | “阻止 spikes” | 将 global grad norm 限制在 1.0；防止 training blowups。 |
| Cosine LR schedule | “2020+ 默认选择” | LR 先线性上升（warmup），然后按 cosine 形状衰减到峰值的 10%。 |
| MFU | “Model FLOP Utilization” | 实际达到的 FLOPs / 理论峰值；2026 年 40% dense、30% MoE 已经很强。 |
| Val loss | “Held-out loss” | 在 model 从未见过的数据上计算 Cross-Entropy；overfit detector。 |

## 延伸阅读

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) 经典的注释实施
