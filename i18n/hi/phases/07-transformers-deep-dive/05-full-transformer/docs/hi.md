# पूर्ण ट्रांसफार्मर  एन्कोडर + डिकोडर

> ध्यान मुख्य है। बाकी सब कुछ शेष है। सामान्यीकरण, फ़ीड-फॉरवर्ड, क्रॉस-अटेंशन।

**Type:** Build
**Languages:** Python
**先修要求:**चरण 7 · 02 (स्व-ध्यान), चरण 7 · 03 (बहु-मुख ध्यान), चरण 7 · 04 (स्थिति एन्कोडिंग)
**Time:** ~75 minutes

## 问题
एक ध्यान परत एक विशेषता है, एक मॉडल नहीं एक स्तर एक बार में एक भाषा के लिए पर्याप्त क्षमता नहीं है आपको गहराई की आवश्यकता होती है, और यदि सही पाइपलाइन नहीं है, तो गहराई विफल हो जाएगी

2017 के Vaswani 论文打包了六个设计决策,把一个注意层 变成一个可堆叠的块―― इसके बाद प्रत्येक ट्रांसफार्मर 只编码器 (BERT) 只编码器 (GPT) 只编码器-解码器 (T5) 都继承了同一个骨架―― 2026 तक, ये ब्लॉक 已改进了(RMSNorm、SwiGLU、pre-norm、RoPE), लेकिन骨架完全相同──

इस वर्ग में इस ढांचे का वर्णन किया गया है।

## 概念
![Encoder and decoder block internals, wired](../assets/full-transformer.svg)

### 六个组成部分

1. **Embedding + positional signal.**टोकन → वेक्टरों──स्थिति 通过 RoPE(现代) या सिनोसाइडल(经典)注入──
2. **Self-attention.**प्रत्येक स्थिति  अन्य प्रत्येक स्थिति  में भाग लेता है 
3. **Feed-forward network (FFN).**按位置 作用的两层 MLP:`W_2 · activation(W_1 · x)`◊默认 विस्तार अनुपात 为 4×。
4. **Residual connection.** `x + sublayer(x)` इसके बिना, gradients लगभग 6 परतों के बाद गायब हो जाएगा
5. **Layer normalization.** `LayerNorm`या `RMSNorm`(现代)                                                                                                                                                                                                                                                              
6. **Cross-attention (decoder only).**decoder से क्वेरी, कुंजी और मानों को encoder आउटपुट से

### एन्कोडर ब्लॉक ((BERT、T5 एन्कोडर 使用)

```
x → LN → MHA(self) → + → LN → FFN → + → out
                     ^              ^
                     |              |
                     └── residual ──┘
```

एन्कोडर द्वि-दिशात्मक है। कोई मास्किंग नहीं है। सभी पदों को सभी स्थानों को देखने में सक्षम हैं।

### डिसीडर ब्लॉक(GPT、T5 डिसीडर 使用)

```
x → LN → MHA(masked self) → + → LN → MHA(cross to encoder) → + → LN → FFN → + → out
```

प्रत्येक ब्लॉक में तीन उप-परत हैं। मध्य में वह क्रॉस-अटेंशन है संकेतक से प्रवाह करने वाले डिकोडर के एकमात्र स्थान में । शुद्ध डिकोडर-केवल वास्तुकला में .

### पूर्व-नियमित बनाम बाद के मानक

मूल निबंधः`x + sublayer(LN(x))`vs `LN(x + sublayer(x))`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️`LN`) है 2026 साल की एक मर्मतः चयन: लामा, क्वेन, जीपीटी-3+, मिस्ट्रल सभी इसका उपयोग करते हैं

### 2026 साल का आधुनिकता ब्लॉक

Vaswani 2017 उपयोग किया गया है LayerNorm + ReLU。现代 स्टैक 替换了两者──生产级块 实际看起来是这样:

| Component | 2017 | 2026 |
|-----------|------|------|
| Normalization | LayerNorm | RMSNorm |
| FFN activation | ReLU | SwiGLU |
| FFN expansion | 4× | 2.6×（SwiGLU 使用三个 matrices，总参数量匹配） |
| Position | Sinusoidal absolute | RoPE |
| Attention | Full MHA | GQA（或 MLA） |
| Bias terms | Yes | No |

RMSNorm लेयरनॉर्म के औसत-केंद्रण को हटा दिया है, कम से कम एक बार घटाता है, गणना को बचाता है, और अनुभव से कम से कम समान रूप से स्थिर है।`Swish(W1 x) ⊙ W3 x`) में स्थिरता RELU/GELU FFN,ppl  लगभग 0.5 个点

### पैरामीटर गिनती

 एक के लिए `d_model = d`且 FFN विस्तार 为 `r`का ब्लॉकः

- एमएचए: `4 · d²`(Q, K, V, O प्रक्षेपण)
- FFN (SwiGLU): `3 · d · (r · d)`≈ ≈`3rd²`
- मानदंडः 可忽略

`d = 4096, r = 2.6, layers = 32`(大致对应 लामा 3 8B)`32 · (4·4096² + 3·2.6·4096²) ≈ 32 · (16 + 32) M = ~1.5B parameters per layer × 32 ≈ 7B`(पुनः सम्मिलित करें तथा सिर) 


observe a vector 如何流过单个块: ध्यान में रखें स्थानों के बीच मिश्रित जानकारी, अवशिष्ट, संकेत को आगे ले जाने के लिए, एफएफएन परिवर्तन करते हुए, जबकि मानदंड 让残留流 保持稳定──

```figure
transformer-block
```

##  इसे निर्माण
### 步骤 1: निर्माण ब्लॉक्स

प्रयोग पाठ 03 中中的小型 `Matrix`वर्ग(आजादी के लिए इस फाइल को कॉपी किया गया हैः

- `layer_norm(x, eps=1e-5)` 减去 मतलब,除以 std。
- `rms_norm(x, eps=1e-6)`除以 RMS──不减除 मतलब──
- `gelu(x)`和 `silu(x) * W3 x`(स्विगल) ◊
- `ffn_swiglu(x, W1, W2, W3)`
- `encoder_block(x, params)`和 `decoder_block(x, enc_out, params)`

完整线路 见 `code/main.py`

### चरण 2: तार एक 2-परत एन्कोडर और एक 2-परत डेकोडर

उन्हें ढेर करना. इनकोडिंग आउटपुट को प्रत्येक डिकोडर क्रॉस-अटेंशन में जोड़ना. इनपुट प्रोजेक्शन में पूर्व-अतिरिक्त अंतिम LN।

```python
def encode(tokens, params):
    x = embed(tokens, params.emb) + sinusoidal(len(tokens), params.d)
    for block in params.encoder_blocks:
        x = encoder_block(x, block)
    return x

def decode(target_tokens, encoder_out, params):
    x = embed(target_tokens, params.emb) + sinusoidal(len(target_tokens), params.d)
    for block in params.decoder_blocks:
        x = decoder_block(x, encoder_out, block)
    return x
```

### 步骤 3: में खिलौना उदाहरण 上运行 आगे

输入一个 6- टोकन स्रोत 和一个 5- टोकन लक्ष्य──验证输出形 是 `(5, vocab)`不训练本课 关注建筑,而不是损失

### 步骤 4: 换成 RMSNorm + SwiGLU

RMSNorm 和 SwiGLU 替换 LayerNorm 和 ReLU-FFN── पुष्टि रूप 仍然匹配── यह है 2026 साल के आधुनिकीकरण, केवल एक बार फ़ंक्शन 替换──

## इसका उपयोग करें
PyTorch/TF संदर्भ कार्यान्वयनः`nn.TransformerEncoderLayer``nn.TransformerDecoderLayer`लेकिन 2026 के अधिकांश उत्पादन कोड स्वयं को ब्लॉक करने के लिए होंगे, क्योंकि:

- फ्लैश ध्यान ध्यान के माध्यम से नहीं बल्कि ध्यान के भीतर से है।`nn.MultiheadAttention`
- GQA / MLA 不在 stdlib संदर्भ 中──
- RoPE、RMSNorm、SwiGLU नहीं है PyTorch डिफ़ॉल्ट

HF `transformers`स्पष्ट संदर्भ ब्लॉक, पढ़ना लायक हैः`modeling_llama.py`यह 2026 में केवल कैनोनिक डिकोडर ब्लॉक है। यह लगभग 500 行 है, इसे पढ़ने के लायक है।

**Encoder vs decoder vs encoder-decoder — 什么时候选择：**

| Need | Pick | Example |
|------|------|---------|
| Classification、embeddings、基于文本的 QA | Encoder-only | BERT, DeBERTa, ModernBERT |
| Text generation、chat、code、reasoning | Decoder-only | GPT, Llama, Claude, Qwen |
| Structured input → structured output（translation、summarization） | Encoder-decoder | T5, BART, Whisper |

केवल डेकोडर भाषा के कार्यों में जीतता है, क्योंकि यह सबसे आसान है, और साथ ही समझ और पीढ़ी को संसाधित करता है।

## 交付 यह
见 `outputs/skill-transformer-block-reviewer.md`◊ इस कौशल को 2026 के वर्ष में एक नए ट्रांसफार्मर ब्लॉक कार्यान्वयन के आधार पर स्थापित किया जाएगा, और इसमें पूर्व-नियमित, RoPE, RMSNorm, GQA, FFN विस्तार अनुपात का अभाव है।

## अभ्यास
1. **Easy.**统计你的 एन्कोडर_ब्लॉक 在 `d_model=512, n_heads=8, ffn_expansion=4, swiglu=True`时的参数──通过实现该块并使用 `sum(p.numel() for p in block.parameters())`验证──
2. **Medium.**पोस्ट-नॉर्म से पूर्व-नॉर्म तक स्विच करना, इन दोनों को आरंभ करना, और यादृच्छिक इनपुट ऊपर माप करना 12 परतों के बाद सक्रियण मानक को ढेर करना।
3. **Hard.**में खिलौना कॉपी कार्य(复制反转后的`x`) एक 4-परत एन्कोडर-डेकोडर को प्राप्त करने पर  प्रशिक्षण 100 कदम  रिपोर्ट हानि  परिवर्तन RMSNorm + SwiGLU + RoPEloss क्या यह घट गया है?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Block | “一个 transformer layer” | norm + attention + norm + FFN 的 stack，并包在 residual connections 中。 |
| Residual | “Skip connection” | `x + f(x)` output；让 gradients 能够流过 deep stacks。 |
| Pre-norm | “先 normalize，不是之后” | 现代形式：`x + sublayer(LN(x))`。无需 warmup 技巧也能训练得更深。 |
| RMSNorm | “没有 mean 的 LayerNorm” | 除以 RMS；少一个 op，经验稳定性相同。 |
| SwiGLU | “大家都切换过去的 FFN” | `Swish(W1 x) ⊙ W3 x → W2`。在 LM ppl 上优于 ReLU/GELU。 |
| Cross-attention | “decoder 如何看到 encoder” | Q 来自 decoder、K/V 来自 encoder outputs 的 MHA。 |
| FFN expansion | “中间 MLP 有多宽” | hidden-size 与 d_model 的比率，通常为 4（LayerNorm）或 2.6（SwiGLU）。 |
| Bias-free | “去掉 +b 项” | 现代 stacks 在线性层中省略 biases；ppl 略有提升，model 更小。 |

## 延伸阅读
- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) मूल ब्लॉक विनिर्देश
- [Xiong et al. (2020). On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745) क्यों पूर्व-नियमित में गहरे स्तर पर पोस्ट-नियमित से बेहतर है 
- [Zhang, Sennrich (2019). Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467) RMSNorm。
- [Shazeer (2020). GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) SwiGLU 论文──
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) कैनोनिक 2026 केवल डिकोडर ब्लॉक──
