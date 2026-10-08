# बहु-उपदेश्य ध्यान

> एक ध्यान सिर एक सीख एक संबंध. आठ सिर. आठ प्रकार.

**类型：**构建
**语言：**पायथन
**前置知识：**चरण 7 · 02(स्व-ध्यान खरोंच से)
**时间：**~ 75 मिनट

## 问题

单个自我注意力头会计算一个注意力矩阵―― यह矩阵 捕捉一种关系, आमतौर पर उस प्रकार का है जो वर्तमान प्रशिक्षण संकेत पर हानि को न्यूनतम कर सकता है―― यदि आपके डेटा में विषय-क्रियापद समझौते、 सह-उद्धरण、 दीर्घकालीन भाषण तथा वाक्यरचनात्मक टुकड़े टुकड़े करना सभी एक साथ सम्मिलित हो, तो एक एकल सिर उन्हें एक एकल नरम-अधिक वितरण में मसाज करेगा, आधा संकेत खो देगा――

2017 Vaswani paper  दिया गया संशोधन तरीका है:并行运行多个注意力功能, प्रत्येक के पास अपने स्वयं के Q、K、V प्रोजेक्शन हैं, फिर इसे बाहर निकालें拼接起来── प्रत्येक सिर में आयाम के लिए `d_model / n_heads`                                                                                                                                                                                                                                                              

बहु-उद्देश्य सभी ट्रांसफार्मर की 2026 साल की डिफ़ॉल्ट विन्यास है। एकमात्र बहस यह है कि कितने* प्रमुखों का उपयोग करना है, साथ ही कुंजी और मान हैं या नहीं साझा अनुमानों का उपयोग करना है।

## 概念

![Multi-head attention splits, attends, concatenates](../assets/multi-head-attention.svg)

**Split。**取形为 `(N, d_model)``X`分别 प्रोजेक्शन 到形为 `(N, d_model)`का Q  K  V  रूप`(N, n_heads, d_head)`, उनमें से `d_head = d_model / n_heads`❖ ट्रांसपोज़ `(n_heads, N, d_head)`

**并行 Attend。**में प्रत्येक सिर में आंतरिक परिचालन स्केल बिंदु उत्पाद ध्यान . प्रत्येक सिर  उत्पन्न `(N, d_head)` ये हेड एम्बेडिंग के विभिन्न बच्चों के अंतरिक्ष पर चलते हैं, और ध्यान गणना के दौरान स्वयं के दौरान एक दूसरे से संवाद नहीं करते हैं

**Concatenate 并 project。**सिर ढेर होगा`(N, d_model)`, फिर आकार में गुणा किया गया है`(d_model, d_model)` के सीखे आउटपुट मैट्रिक्स `W_o``W_o`हैड  मिश्रित स्थानों को करने के लिए

**为什么有效。**प्रत्येक सिर विशेष हो सकता है, और अन्य सिरों की आवश्यकता नहीं है 争抢表征预算──20192024 वर्ष के जांच अध्ययनों में विभिन्न प्रमुख भूमिकाएं दिखाई गई हैंःस्थिति प्रमुखों, पिछले टोकन के प्रमुखों की प्रतियां, नामित इकाई प्रमुखों, प्रेरण प्रमुखों, जो संदर्भ में सीखने के बुनियादी तंत्र का गठन करते हैं)

**2026 年的变体谱系：**

| Variant | Q heads | K/V heads | Used by |
|---------|---------|-----------|---------|
| Multi-head (MHA) | N | N | GPT-2, BERT, T5 |
| Multi-query (MQA) | N | 1 | PaLM, Falcon |
| Grouped-query (GQA) | N | G (e.g. N/8) | Llama 2 70B, Llama 3+, Qwen 2+, Mistral |
| Multi-head latent (MLA) | N | compressed to low-rank | DeepSeek-V2, V3 |

जीक्यूए आधुनिक मानक है, क्योंकि यह अनुपालन कर सकता है।`N/G`केवी-कैश मेमोरी को कम करने का गुणांक, लगभग पूर्ण गुणवत्ता बनाए रखने के साथ-साथ MLA को और अधिक, K/V को लटेंट स्पेस में संकुचित करने के लिए, फिर गणना समय परियोजना में वापस आने पर यह FLOPs का उपभोग करेगा, लेकिन अधिक मेमोरी को बचाएगा।


```figure
multihead-split
```

##  इसे निर्माण

### 步骤 1: हमारे पहले से ही एकल सिर ध्यान से विभाजित सिर

取 पाठ 02 里的 `SelfAttention`, एक के साथ विभाजित / संकुचित 包起来.`code/main.py`中有 numpy 实现;逻辑如下:

```python
def split_heads(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)  # (heads, n, d_head)

def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

एक बार फिर से आकार और एक बार ट्रांसपोज़र. कोई लूप नहीं.`nn.MultiheadAttention`नीचे क्या करना है

### 步骤 2: प्रति सिर 运行 स्केल-डॉट-उत्पाद ध्यान

प्रत्येक सिर को Q 、K 、V का अपना टुकड़ा मिलता है। ध्यान  

```python
def mha_forward(X, W_q, W_k, W_v, W_o, n_heads):
    Q = X @ W_q
    K = X @ W_k
    V = X @ W_v
    Qh = split_heads(Q, n_heads)         # (heads, n, d_head)
    Kh = split_heads(K, n_heads)
    Vh = split_heads(V, n_heads)
    scores = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(Qh.shape[-1])
    weights = softmax(scores, axis=-1)
    out = weights @ Vh                    # (heads, n, d_head)
    concat = combine_heads(out)
    return concat @ W_o, weights
```

असली हार्डवेयर पर,`Qh @ Kh.transpose(...)`एक है`bmm`GPU 看到的是形状为 `(heads, N, d_head) × (heads, d_head, N) -> (heads, N, N)`                                                                                                                                                                                                                                                              

### 步骤 3:समूह-प्रश्न ध्यान 变体

只有关键和值预测 会改变──Q 获得 `n_heads`个群;K 和 V 获得 `n_kv_heads < n_heads`个群,并被重复以匹配:

```python
def gqa_project(X, W, n_kv_heads, n_heads):
    kv = split_heads(X @ W, n_kv_heads)       # (kv_heads, n, d_head)
    repeat = n_heads // n_kv_heads
    return np.repeat(kv, repeat, axis=0)      # (n_heads, n, d_head)
```

निष्कर्ष में, यह स्मृति को बचाने के लिए, क्योंकि KV कैश में केवल सहेजा जाता है।`n_kv_heads`份副本, बजाय `n_heads`份──Llama 3 70B उपयोग 64 个查询头和 8 个 KV头,也就是 8× का कैश 缩减──

### चरण 4: प्रत्येक सिर को पता लगाने के लिए क्या

एक संक्षिप्त वाक्य में 4 सिरों के साथ MHA चलाएँ।`(N, N)`ध्यान मैट्रिक्स──आप विभिन्न सिरों को देखेंगे यहां तक कि यादृच्छिक आरंभिकरण में भी नीचे विभिन्न संरचनाओं का चयन करेंगे यह हिस्सा संकेत है, भाग है अंतरिक्ष में घूर्णन समता है──

## इसका उपयोग करें

में PyTorch 中,一行版本:

```python
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=512, num_heads=8, batch_first=True)
```

PyTorch 2.5+ 中的 GQA:

```python
from torch.nn.functional import scaled_dot_product_attention

# scaled_dot_product_attention auto-dispatches Flash Attention on CUDA.
# For GQA, pass Q of shape (B, n_heads, N, d_head) and K,V of shape
# (B, n_kv_heads, N, d_head). PyTorch handles the repeat.
out = scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)
```

**多少个 heads？**2026 के उत्पादन मॉडल के अनुभव नियमः

| Model size | d_model | n_heads | d_head |
|------------|---------|---------|--------|
| Small (~125M) | 768 | 12 | 64 |
| Base (~350M) | 1024 | 16 | 64 |
| Large (~1B) | 2048 | 16 | 128 |
| Frontier (~70B) | 8192 | 64 | 128 |

`d_head` लगभग हमेशा 64 या 128 में गिर जाता है. यह एक सिर है  देख सकते हैं  कितना सामग्री की इकाई  से कम 32, सिरों पर शुरू होगा और स्केलिंग कारक `sqrt(d_head)` से अधिक; 256, आप  कई छोटे विशेषज्ञों के लाभ खो देंगे

## 交付 यह

见 `outputs/skill-mha-configurator.md` यह कौशल पैरामीटर बजट, अनुक्रम लंबाई और तैनाती लक्ष्य के आधार पर, नए ट्रांसफार्मर के लिए  सिर गिनती,kv-head गिनती और प्रक्षेपण रणनीति का सुझाव देगा

## अभ्यास

1. **简单。**取 `code/main.py`मध्य में MHA, स्थिरांक `d_model=64``n_heads`1 से 16 तक परिवर्तन करें। सिंथेटिक कॉपी कार्य में एक छोटे से एक परत वाले मॉडल का चित्रण करने का नुकसान। अधिक सिर क्या उपयोगी हैं?
2. **中等。**实现 MQA( सभी क्वेरी हेड 共享一个 KV हेड) ―― माप पैरामीटर संख्या 相比全 MHA 下降了多少──计算推断 时 N=2048 下 KV-cache आकार 缩小了多少──
3. **困难。**实现 एक छोटे  संस्करण के मल्टी-हेड लातेंट ध्यानः把 K,V 压缩到级别-`r`लटेंट, लाटेंट को KV कैश में रखकर ध्यान समय में 解压──`r` कितना समय ले लिया, कैश मेमोरी पूर्ण MHA के 1/8 नीचे तक गिर जाएगा, जबकि गुणवत्ता अभी भी सत्यापन पीएलपी के 1 बिट के भीतर बनाए रखा गया है?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Head | “一个单独的 attention circuit” | 一个维度为 `d_head = d_model / n_heads` 的 Q/K/V projection，拥有自己的 attention matrix。 |
| d_head | “Head dimension” | Per-head hidden width；在 production 中几乎总是 64 或 128。 |
| Split / combine | “Reshape tricks” | Attention 前后的 `(N, d_model) ↔ (n_heads, N, d_head)` reshape+transpose。 |
| W_o | “Output projection” | Concatenating heads 之后应用的 `(d_model, d_model)` matrix；heads 在这里混合。 |
| MQA | “One KV head” | Multi-Query Attention：单个共享 K/V projection。KV cache 最小，但有一些质量损失。 |
| GQA | “The default since Llama 2” | `n_kv_heads < n_heads` 的 Grouped-Query Attention；通过重复来匹配 Q。 |
| MLA | “DeepSeek 的技巧” | Multi-head Latent Attention：K,V 被压缩到 low-rank latent，并在 attend time 解压。 |
| Induction head | “in-context learning 背后的 circuit” | 一对 heads，检测之前的出现位置，并复制其后跟随的内容。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need §3.2.2](https://arxiv.org/abs/1706.03762) 原始的多头规范──
- [Shazeer (2019). Fast Transformer Decoding: One Write-Head is All You Need](https://arxiv.org/abs/1911.02150) एमक्यूए 论文。
- [Ainslie et al. (2023). GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245) 如何在训练后把 MHA 转换为 GQA──
- [DeepSeek-AI (2024). DeepSeek-V2 Technical Report](https://arxiv.org/abs/2405.04434) MLA, तथा यह क्यों है कैश मेमोरी में ऊपर MHA / GQA से बेहतर है
- [Olsson et al. (2022). In-context Learning and Induction Heads](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html) यंत्रिकी के दृष्टिकोण से  ध्यान से देखें 实际做了什么──
