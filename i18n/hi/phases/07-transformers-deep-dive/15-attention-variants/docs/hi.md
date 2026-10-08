# ध्यान 变体  स्लाइडिंग विंडो, स्पर, डिफरेंशियल

> पूर्ण ध्यान एक चक्र है। प्रत्येक टोकन प्रत्येक टोकन को देख सकता है, जबकि स्मृति इसके लिए कीमत चुका सकती है। चार प्रकार के चर इस चक्र के आकार को बदलते हैं, और आधे लागत प्राप्त करते हैं।

**Type:** Build
**Languages:** Python
**先修要求:**चरण 7 · 02 (स्वयं-ध्यान), चरण 7 · 03 (बहु-मुख), चरण 7 · 12 (केवी कैश / फ्लैश ध्यान)
**Time:** ~60 minutes

## 问题

पूर्ण ध्यान में क्रम लंबाई पर स्मृति लागत है `O(N²)`, गणना लागत भी `O(N²)`❖ 128K-संदर्भ के लिए लामा 3 70B, जिसका अर्थ है प्रत्येक स्तर में 160 अरब ध्यान 条目, फिर से 80 परतों में गुणा ❖ फ्लैश ध्यान  पाठ 12) छिपा हुआ `O(N²)`सक्रियण में भंडारण, लेकिन गणना लागत को बदलने के लिए नहीं  प्रत्येक टोकन  अभी भी प्रत्येक अन्य टोकन में भाग लेंगे 

तीन प्रकार के परिवर्तन ध्यान मैट्रिक्स को बदलते हैंः

1. **Sliding window attention (SWA).**प्रत्येक टोकन केवल एक निश्चित विंडो के भीतर पड़ोसी टोकन तक पहुंचता है, पूर्ण पूर्वावलोकन के बजाय।`O(N · W)`, उनमें से `W`है खिड़की बड़ा है. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
2. **Sparse / block attention.**只有选定的 `(i, j)`                                                                                                                                                                                                                                                              
3. **Differential attention.**計算两张 Attention map,再相减──消除将把权重泄漏到前几个 टोकन के 注意沉──Microsoft का DIFF ट्रांसफार्मर,2024)──

इनका सह-अस्तित्व हो सकता है। 2026 के लिए एक सीमा मॉडल में इनका प्रयोग किया जा सकता हैः अधिकांश स्तर एसडब्ल्यूए-1024, प्रत्येक पांच स्तरों में एक वैश्विक पूर्ण ध्यान स्तर है।

## 概念

### स्लाइडिंग विंडो ध्यान (SWA)

位置 `i`प्रत्येक प्रश्न के केवल तक भाग लेने के लिए`[i - W, i]`(स्रोत SWA) या `[i - W/2, i + W/2]`(द्विदिश) में स्थान── खिड़की के बाहर टोकन 会在分数矩阵中得到 `-inf`

```
full causal:           sliding window (W=4):
positions 0-7          positions 0-7, W=4
    0 1 2 3 4 5 6 7        0 1 2 3 4 5 6 7
0 | x                0 |  x
1 | x x              1 |  x x
2 | x x x            2 |  x x x
3 | x x x x          3 |  x x x x
4 | x x x x x        4 |    x x x x
5 | x x x x x x      5 |      x x x x
6 | x x x x x x x    6 |        x x x x
7 | x x x x x x x x  7 |          x x x x
```

 के लिए `N = 8192`和 `W = 1024`, मैट्रिक्स स्कोर की उम्मीद पर 1024 × 8192  गैर-零行 घटकर 8×

**KV cache 会随 SWA 缩小。**प्रत्येक स्तर केवल हाल ही में रखने की जरूरत है `W`个 टोकन के K 和 V── के लिए एक समान Gemma-3 के विन्यास(1024 विंडो,128K संदर्भ),KV कैश 会降低 128×──

**质量成本。**纯SWA ट्रांसफार्मर 难以处理长距离检索──修复方法:在SWA 层间交错全重视层──Gemma 3 使用 5:1 SWA:global──Mistral 7B उपयोग कारण-SWA स्टैक, सूचना के माध्यम से ओवरलैप खिड़की向前流动 प्रत्येक स्तर में प्रभावी सेहत क्षेत्र विस्तार होगा`W`, के माध्यम से `L`层后,模型可以向后出席 `L × W`个 टोकन──

### स्पायर / ब्लॉक ध्यान

预先选择一个 `N × N`स्पार्सिटी पैटर्न──三种经典形状:

- **Local + strided (OpenAI sparse transformer).**हाल तक भाग लें`W`个 टोकन, पुनः जोड़ें इस पर पहले प्रत्येक खंड `stride`个 टोकन की स्थिति──以 `O(N · sqrt(N))`计算同时捕捉局部和长距离信息──
- **Longformer / BigBird.**स्थानीय विंडो + कम मात्रा वैश्विक टोकन (उदाहरण के लिए)`[CLS]`), ये टोकन उपस्थित तक सभी टोकन, भी被所有 टोकन उपस्थित + यादृच्छिक-स्पैस लिंक──在匹配质量下经验上获得2× संदर्भ──
- **Native Sparse Attention (DeepSeek, 2025).**सीखना `(Q, K)`ब्लॉक 重要;在内核层面跳过零块──兼容 FlashAttention──

Sparse Attention एक kernel engineering 故事──数学很简单(मास्क स्कोर मैट्रिक्स); लाभ से आता है   零条目加载进 SRAM──FlashAttention-3 和 2026 साल का FlexAttention API 让自定义稀模式 成为PyTorch में एक समान क्षमता──

### अंतर ध्यान (डीआईएफएफ ट्रांसफार्मर, 2024)

常规注意 有一个 注意沉 问题:softmax 强制每一行求和为 1, इसलिए जो लोग किसी भी सामग्री टोकन में विशेष रूप से भाग लेने की उम्मीद नहीं करते हैं वे पहले टोकन में वजन को ढक देंगे (या पहले कुछ टोकन) ऊपर।

अंतर ध्यान 通过计算**两张**ध्यान के नक्शे ने इस समस्या को हल करने के लिए कदम नहीं बढ़ायाः

```
A1 = softmax(Q1 K1^T / √d)
A2 = softmax(Q2 K2^T / √d)
DiffAttn = (A1 - λ · A2) V
```

उनमें से `λ`0.8) ............................................................................................................................................................................................................................................................

報告結果(Microsoft 2024):अराजकता  घटकर 510%, वैध संदर्भ में 延长 1.52×,शेय स्टैक में सुई 检索更敏──

### 变体对比

| Variant | Compute | KV cache | Quality vs full | Production use |
|---------|---------|----------|-----------------|----------------|
| Full attention | O(N²) | O(N) per layer | baseline | 每个模型的默认层 |
| SWA (window 1024) | O(N·W) | O(W) per layer | -0.1 ppl，搭配 global layers 效果好 | Gemma 2/3, Phi-3-Long |
| Local + strided sparse | O(N·√N) | mixed | 类似 SWA | OpenAI sparse transformer, Longformer |
| BigBird (local + global + random) | O(N) approx | mixed | 在 2× context 下匹配 full | early long-context BERT |
| Native Sparse (DeepSeek-V3.2) | O(N · active fraction) | O(N) | within 0.05 ppl | DeepSeek-V3.2, 2025 |
| Differential | O(2·N²) | O(2N) | -5 to -10% ppl | DIFF Transformer, early 2026 models |


```figure
gqa-kv-sharing
```

##  इसे निर्माण

见 `code/main.py` हम एक कारणात्मक मुखौटा तुलनाकर्ता को लागू करते हैं, जो कि खिलौना क्रम में एक साथ प्रदर्शित होता है, जिसमें पूर्ण SWA、स्थानीय+तरंगित 和 अंतर ध्यान

### 步骤 1: पूर्ण कारणात्मक मुखौटा (बेसलाइन)

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

पाठ 07 की मूल रेखा सेः ∞ नीचे तीन कोण;

### 步骤 2: स्लाइडिंग विंडो कारण मास्क

```python
def swa_mask(n, window):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
    return M
```

एक तत्व`window``window >= n`时,会恢复 पूर्ण कारणात्मक ध्यान.`window = 1`时, प्रत्येक टोकन केवल अपने आप को देखने के लिए.

### 步骤 3: स्थानीय + कदमदार स्पायर मास्क

```python
def strided_mask(n, window, stride):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
        for j in range(0, i + 1, stride):
            M[i][j] = 0.0
    return M
```

घन स्थानीय खिड़की से ऊपर क्रम से शुरू शुरू प्रत्येक अनुभाग से शुरू`stride`个 टोकन की स्थिति── अतिरिक्त परतों की संख्या बढ़ने के साथ, 感受野以 लॉग चरण 增长──

### 步骤 4: अंतर ध्यान

```python
def diff_attention(Q1, K1, Q2, K2, V, lam):
    A1 = softmax_causal(Q1 @ K1.T / sqrt_d)
    A2 = softmax_causal(Q2 @ K2.T / sqrt_d)
    return (A1 - lam * A2) @ V
```

两次注意力通过,学习得到的混合系数相减――在代码中,我们比较单一注意力与差别注意力的注意力-沉热地图,并观察沉缩──

### 步骤 5: KV कैश आकार

`N = 131072`नीचे प्रत्येक परिवर्तन के प्रत्येक परत के कैश आकार को छापें──SWA तथा दुर्लभ 变体会 घट 10100×──फरक 会翻倍──आपके内存账单的意识地支付──

## इसका उपयोग करें

2026 के उत्पादन मोडः

```python
from transformers import AutoModelForCausalLM
# Gemma 3 mixes SWA (window=1024) and global layers at 5:1.
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-27b-it")
# print(model.config.sliding_window, model.config.layer_types)
```

PyTorch 2.5+ 中的 FlexAttention  एक मुखौटा फ़ंक्शन स्वीकार करें:

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)
```

यह स्वचालित रूप से परिभाषित ट्रिटन कर्नेल में अनुवादित किया जाएगा। सामान्य पैटर्न के लिए, गति FlashAttention-3 के 10% के भीतर है, और मास्क फ़ंक्शन एक पायथन कॉल करने योग्य है।

**何时选择哪一种：**

- **Pure full attention** प्रत्येक स्तर अधिकतम 16K संदर्भ के लिए उपयुक्त है, या जांच गुणवत्ता महत्वपूर्ण है
- **SWA + global mix** 长 context(>32K), प्रशिक्षण एवं निष्कर्ष 受内存限制──2026 साल 32K 以上的默认选择──
- **Sparse block attention** स्वयं परिभाषित कर्नेल、 स्वयं परिभाषित पैटर्न──保留给专门工作负载(检索、音频)。
- **Differential attention**  किसी भी ध्यान-सिंक प्रदूषण से चोट लग सकती है

## 交付 यह

见 `outputs/skill-attention-variant-picker.md`◊ इस कौशल को लक्ष्य संदर्भ लंबाई, जांच की आवश्यकता और प्रशिक्षण/उपयोग गणना प्रोफ़ाइल के आधार पर, एक नए मॉडल के लिए चुनें ध्यान शीर्षिकी

## अभ्यास

1. **Easy.**运行 `code/main.py`验证 `window=4`SWA 会把每一行中最近4 个 टोकन 之外的所有内容置零――验证 `window=n`会 बिट-सामान्य रूप से 复现 पूर्ण कारणात्मक ध्यान。
2. **Medium.**पाठ 07 के समापन पथ पर`window=1024`                                                                                                                                                                                                                                                              
3. **Hard.**模型 में प्राप्त किया गया Gemma-3-style 5:1 layer mix ((5 लेयर SWA,1 लेयर ग्लोबल) ⋅ में parameters match के मामले में, शुद्ध-SWA और शुद्ध-ग्लोबल बेसलाइन के मुकाबले ⋅ स्मृति एवं पीढ़ी की गुणवत्ता
4. **Hard.** प्रत्येक सिर  के लिए सीखने के लिए कुछ है `λ`का अंतर ध्यान── एक सिंथेटिक रिट्रीवल टास्क में एक सुई, 2,000 个 विचलित करने वाले) पर प्रशिक्षण── पैरामीटर के मिलान के मामले में, एकल-ध्यान बेसलाइन के सापेक्ष मापने की रिट्रीवल सटीकता──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sliding window attention (SWA) | "Local attention" | 每个 query attend 到最近 `W` 个 Token；KV cache 缩小到 `O(W)`。 |
| Effective receptive field | "模型能向后看多远" | 在一个窗口为 `W` 的 `L` 层 SWA stack 中，最多 `L × W` 个 Token。 |
| Longformer / BigBird | "Local + global + random" | Sparse pattern，包含少量始终 attend 的 global tokens；早期 long-context 方法。 |
| Native Sparse Attention | "DeepSeek's kernel trick" | 学习 block-level sparsity；在保持质量的同时，在 kernel 层面跳过零 block。 |
| Differential attention | "Two maps, one subtracts" | DIFF Transformer：从第一张 Attention map 中减去学习得到的 `λ` 倍第二张 Attention map，以抵消 attention sinks。 |
| Attention sink | "权重泄漏到 token 0" | Softmax normalization 强制行求和为 1；信息量不足的 query 会把权重倾倒到位置 0。 |
| FlexAttention | "Mask-as-Python" | PyTorch 2.5+ API，可将任意 mask function 编译成 FlashAttention 形状的 kernel。 |
| Layer type mix | "5:1 SWA-to-global" | 在 stack 中交错 sparse 和 full Attention 层，以更低内存保持质量。 |

## 延伸阅读

- [Beltagy, Peters, Cohan (2020). Longformer: The Long-Document Transformer](https://arxiv.org/abs/2004.05150) 经典的滑窗 + वैश्विक टोकन 论文──
- [Zaheer et al. (2020). Big Bird: Transformers for Longer Sequences](https://arxiv.org/abs/2007.14062) स्थानीय + वैश्विक + यादृच्छिक──
- [Child et al. (2019). Generating Long Sequences with Sparse Transformers](https://arxiv.org/abs/1904.10509) ओपनएआई का स्थानीय+तरंग वाला पैटर्न。
- [Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical Size](https://arxiv.org/abs/2408.00118) 1:1 SWA:वैश्विक मिश्रण
- [Gemma Team (2025). Gemma 3 technical report](https://arxiv.org/abs/2503.19786) विंडो=1024 का 5:1 मिश्रण, आज है
- [Ye et al. (2024). Differential Transformer](https://arxiv.org/abs/2410.05258) डीआईएफएफ ट्रांसफार्मर 论文。
- [Yuan et al. (2025). Native Sparse Attention](https://arxiv.org/abs/2502.11089) डीपसेक-वी3.2 का सीखा-स्पार्सिटी ध्यान
- [PyTorch — FlexAttention blog and docs](https://pytorch.org/blog/flexattention/) इसका उपयोग करें 
