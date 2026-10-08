# KV कैश, फ्लैश ध्यान और सुझाव अनुकूलन

>  प्रशिक्षण                                                                                                                                                                                                                                                              

**Type:** Build
**Languages:** Python
**先修要求：**चरण 7 · 02 (स्व-ध्यान), चरण 7 · 05 (पूर्ण ट्रांसफार्मर), चरण 7 · 07 (जीपीटी)
**Time:** ~75 minutes

## 问题

एक साधारण स्व-वापसी डिकोडर उत्पादन `N`个 टोकन 需要做 `O(N²)`工作: प्रत्येक चरण में पूर्ण पूर्व पर ध्यान पुनः गणना की जाएगी। 4K-टोकन के प्रति प्रतिक्रिया के लिए, इसका मतलब है कि 16M बार ध्यान 运算, जिनमें से अधिकांश अपर्याप्त हैं।

इसके अलावा, ध्यान स्वयं भी बड़ी मात्रा में डेटा को स्थानांतरित करेगा। मानक ध्यान एक N×N स्कोर मैट्रिक्स को भौतिक रूप से प्रस्तुत करेगा। N×d सॉफ्टमैक्स आउटपुट, HBM के लिए अंतिम आउटपुट।

दावो और अन्य ने दो अनुकूलन प्रस्तावित किए, जो कि अग्रिम दिशा में विचार को धीमी गति से तेजी तक बढ़ा रहे हैंः

1. **KV cache。**存储 प्रत्येक पूर्व टोकन के K और V वेक्टरों── प्रत्येक नए टोकन का ध्यान  एक क्वेरी के लिए  भंडारण कुंजी के गणना  प्रत्येक पीढ़ी के चरण से `O(N²)`降到 `O(N)`
2. **Flash Attention。**ध्यान  गणना कर टाइलिंग, पूर्ण N×N मैट्रिक्स  कभी भी HBM में प्रवेश नहीं करेगा  सभी softmax + matmul सभी SRAM में पूरा हो गया  A100 पर दीवार घड़ी गति 24×; FP8 के H100 पर समर्थन 510×

2026 तक, दोनों ही सामान्य विन्यास हो चुके हैं। प्रत्येक उत्पादन स्तर पर विचार किया गया है।

## 核心概念

![KV cache growth and Flash Attention tiling](../assets/kv-cache-flash-attn.svg)

### KV कैश गणित

प्रत्येक डिकोडर परत, प्रत्येक टोकन, प्रत्येक सिरः

```
bytes_per_token_per_layer = 2 * d_head * dtype_size
                          ^
                          K and V
```

 एक 7B 模型 के लिए, 32 層、32  heads、d_head=128、fp16:

```
per token per layer = 2 * 128 * 2 = 512 bytes
per token (32 layers) = 16 KB
per 32K context = 512 MB
```

对于Llama 3 70B(80 层、d_head=128、使用 8 个KV heads 的 GQA):

```
per token per layer = 2 * 8 * 128 * 2 = 4096 bytes (4 KB)
per 32K context = 10.4 GB
```

यह 10 जीबी है कि क्यों Llama 3 70B 128K संदर्भ में नीचे, केवल बैच आकार 1 के केवी कैश एक 40 जीबी A100 का अधिकांश हिस्सा पर कब्जा कर लेगा।

**GQA 是 KV-cache 的关键收益。**64 सिरों का उपयोग करने के लिए 32 जीबी की आवश्यकता होगी।

### फ्लैश ध्यान  टाइलिंग 技巧

标准 ध्यान:

```
S = Q @ K^T          (HBM read, N×N, HBM write)
P = softmax(S)       (HBM read, HBM write)
O = P @ V            (HBM read, HBM write)
```

तीन बार एचबीएम 往返── H100 पर, एचबीएम 带宽 3 टीबी/s है; SRAM 30 टीबी/s है── तुलना में सभी सामग्री को चिप पर रखा जाता है, प्रत्येक बार एचबीएम 往返都会带来约10倍的减速──

फ्लैश ध्यानः

```
for each block of Q (tile size ~128 × 128):
    load Q_tile into SRAM
    for each block of K, V:
        load K_tile, V_tile into SRAM
        compute S_tile = Q_tile @ K_tile^T     (SRAM)
        running softmax aggregation             (SRAM)
        accumulate into O_tile                  (SRAM)
    write O_tile to HBM
```

प्रत्येक टाइल को केवल एक बार HBM 往返 总内存占用 `O(N²)`降到 `O(N)`पश्चिम से पीछे से आगे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे से पीछे की ओर

**数值技巧。**सॉफ्टमैक्स  टाइल  के बीच रखरखाव `(max, sum)`, इसलिए अंतिम समाकलन सटीक है. यह अनुमानित नहीं है. फ्लैश ध्यान.

**版本演进：**

| Version | Year | Key change | Speedup on reference hardware |
|---------|------|-----------|-------------------------------|
| Flash 1 | 2022 | Tiled SRAM kernel | A100 上 2× |
| Flash 2 | 2023 | 更好的并行性，causal-first ordering | A100 上 3× |
| Flash 3 | 2024 | Hopper asynchrony、FP8 | H100 上 1.5–2×（~740 TFLOPs FP16） |
| Flash 4 | 2026 | Blackwell 5-stage pipeline、software exp2 | Inference-first（最初仅 forward） |

फ्लैश 4 发布时只支持前进通过──训练仍使用Flash 3──Flash 4 के GQA 和 varlen 支持仍在等待中(2026年中)──

### अनुमानित डिकोडिंग  另一个延迟优化

廉价模型提出 N 个代币――大模型并行验证全部 N 个代币―― यदि验证 स्वीकार k 个代币, तो आप 1 बार बड़े मॉडल फॉरवर्ड पास 换来 k 次生成――对于代码和散文,典型 k=35──

2026 वर्ष की मान्यता प्राप्त प्रथाः
- **EAGLE 2 / Medusa。**集成式 मसौदा प्रमुख, साझा सत्यापनकर्ता के छिपे हुए राज्य──23× गति, तथा बिना质量损失──
- **Speculative decoding with draft model。**खपत के स्तर पर हार्डवेयर पर 24x गति है
- **Lookahead decoding。**जैकोबी पुनरावृत्ति; कोई ड्राफ्ट मॉडल की आवश्यकता नहीं है।

### निरंतर बैचिंग

经典批发推断: सबसे धीमी क्रम का इंतजार करें 结束, फिर एक नया बैच शुरू करें 当短响应提前结束时,会浪费GPU

निरंतर बैचिंग (अंग्रेजीः Continuous batching) (अंग्रेजीः Continuous batching) (अंग्रेजीः Continuous batching) (अंग्रेजीः Continuous batching) (अंग्रेजीः Continuous batching) (अंग्रेजीः Continuous batching) (अंग्रेजीः Continuous batching) (अंग्रेजीः Continuous batching) (अंग्रेजीः Continuous batching) (अंग्रेजीः Continuous batching) (अंग्रेजीः Continuous batching) (अंग्रेजीः Continuous batching)) (अंग्रेजीः Continuous batching) (आंग्रेजीः Continuous batching) (आंग्रेजीः Continuous batching)) (आंग्रेजीः Continuous batching)) (आंग्रेजीः Continuous batching)) (आंग्रेजीः Continuous batching)) (आंग्रेजीः Continuous batching)) (आंग्रेजीः Continuous batching)) (आंग्रेजीः Continuous batching)) (आंग्रेजीः) (आंग्रेजीः) (आंग्रेजीः: % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %

### PagedAttention  KV कैश को यथा虚拟内存 में डालें

vLLM का मूल विक्रय बिंदु── केवी कैश 16-टोकन ब्लॉक से विभाजित;पृष्ठ तालिका ने तार्किक स्थान को भौतिक ब्लॉक में मैप किया── यह केवी के बीच साझा किया जा सकता है।


拖动维度参数,观察缓存 आकार 如何变化──把序列 लंबाई या बैच आकार 推高, आप इसे देखेंगे 多快就超过单张GPU容量──

```figure
kv-cache-sizer
```

```figure
flash-attention-memory
```

##  इसे निर्माण

见 `code/main.py` हम इसे पूरा करते हैंः

1. एक साधारण `O(N²)`वृद्धिशील डिकोडर
2. एक `O(N)`केवी-कैश किए गए डिकोडर
3. एक मिमल फ्लैश ध्यान चल-माल एल्गोरिथ्म के टाइल्स सॉफ्टमैक्स

### 步骤 1: KV कैश

```python
class KVCache:
    def __init__(self, n_layers, n_heads, d_head):
        self.K = [[[] for _ in range(n_heads)] for _ in range(n_layers)]
        self.V = [[[] for _ in range(n_heads)] for _ in range(n_layers)]

    def append(self, layer, head, k, v):
        self.K[layer][head].append(k)
        self.V[layer][head].append(v)

    def read(self, layer, head):
        return self.K[layer][head], self.V[layer][head]
```

非常简单: प्रत्येक स्तर में, प्रत्येक सिर की सूची में, लगातार प्रत्येक टोकन के K  V वेक्टर जोड़ें

### 步骤 2: टाइलें softmax

```python
def tiled_softmax_dot(q, K, V, tile=4):
    """Flash-attention-style softmax(qK^T)V with running max/sum."""
    m = float("-inf")
    s = 0.0
    out = [0.0] * len(V[0])
    for start in range(0, len(K), tile):
        k_block = K[start:start + tile]
        v_block = V[start:start + tile]
        scores = [sum(qi * ki for qi, ki in zip(q, k)) for k in k_block]
        new_m = max(m, *scores)
        exp_old = math.exp(m - new_m) if m != float("-inf") else 0.0
        exp_new = [math.exp(sc - new_m) for sc in scores]
        s = s * exp_old + sum(exp_new)
        for j in range(len(out)):
            out[j] = out[j] * exp_old + sum(e * v[j] for e, v in zip(exp_new, v_block))
        m = new_m
    return [o / s for o in out]
```

输出与一次性计算 `softmax(qK) V`थोड़ा-सा समान, लेकिन किसी भी समय काम करने के सेट होते हैं सिर्फ एक `tile × d_head`ब्लॉक, पूर्ण के बजाय `N × d_head`

### 步骤 3: 100 टोकन पीढ़ी में ऊपर तुलना साफ़ बनाम कैश डिकोडिंग

统计注意 操作数――नईव:`O(N²)`= 5050──बंदः`O(N)`= 100 ⋅代码会打印二者⋅

## इसका उपयोग करें

```python
# HuggingFace transformers auto-enables KV cache on decoder-only generate().
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.2-3B",
    attn_implementation="flash_attention_2",  # use FA3 if Hopper
    torch_dtype="bfloat16",
)
# generate() uses KV cache automatically
```

वीएलएलएम 生产部署:

```bash
pip install vllm
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --tensor-parallel-size 4 \
    --max-model-len 32768 \
    --enable-prefix-caching \
    --kv-cache-dtype fp8
```

跨请求的前सर्ग缓存是2026 के लिए महत्वपूर्ण लाभ समान प्रणाली शीघ्र、 कुछ-शॉट उदाहरण, या दीर्घ संदर्भ दस्तावेज़ 都能在多次调用之间复用 KV──对于反复使用工具提示的代理 工作负载,前सर्ग缓存通常能带来5× 吞吐量提升──

## 交付 यह

见 `outputs/skill-inference-optimizer.md` यह कौशल नए सुझावों के लिए होगा  केवी कैश रणनीति  क्वांटिज़ेशन तथा अनुमानात्मक डिकोडिंग 

## अभ्यास

1. **Easy.**运行 `code/main.py`                                                                                                                                                                                                                                                              
2. **Medium.**实现 पूर्वावलोकन कैशिंग:给定一个提示 P 和多个完成,先对P 运行一次前行通过来填充KV缓存,然后按每个完成 分支――测量对对每个完成 重新编码 P 的速度――
3. **Hard.**实现一个玩具版 PagedAttention:KV कैश 使用固定的16 टोकन ब्लॉक,并带有自由列──当一个序列 完成时,把它的块归还到池中──模拟1000 个长度不同的聊天完成──相比较它与连续分配的内存碎片情况──

## 关键术语

| Term | 人们的说法 | 它实际上的含义 |
|------|------------|----------------|
| KV cache | “让 decoding 变快的技巧” | 存储每个前缀 token 的 K 和 V；新 queries attend to 它们，而不是重新计算。 |
| HBM | “GPU 主内存” | High Bandwidth Memory；H100 上 80 GB，B200 上 192 GB。带宽约 3 TB/s。 |
| SRAM | “片上内存” | 每个 SM 的高速内存，H100 上每个 SM 约 256 KB。带宽约 30 TB/s。 |
| Flash Attention | “Tiled attention kernel” | 在 HBM 中不物化 N×N 的情况下计算 attention。 |
| Continuous batching | “No-wait batching” | 不清空 batch，直接换出完成的 sequences、换入新的 sequences。 |
| PagedAttention | “vLLM 的核心卖点” | KV cache 以固定 blocks 分配，并通过 page table 管理；消除碎片。 |
| Prefix caching | “复用长 prompts” | 在请求之间缓存共享前缀的 KV；对 agents 来说是重大成本削减。 |
| Speculative decoding | “Draft + verify” | 廉价 draft model 提出 tokens；大模型在一次 pass 中验证 k 个。 |

## 延伸阅读

- [Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) फ्लैश 1。
- [Dao (2023). FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691) फ्लैश 2。
- [Shah et al. (2024). FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608) फ्लैश 3。
- [FlashAttention-4 release notes (Dao-AILab, 2026)](https://github.com/Dao-AILab/flash-attention) ब्लैकवेल 5-चरण पाइपलाइन 和 सॉफ्टवेयर-exp2 技巧; रीडमे रीडमे को पढ़ें, जानें इस वर्ग में उल्लेखित केवल आगे के लॉन्च चेतावनीों को।
- [Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) vLLM 论文──
- [Leviathan et al. (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) स्पेसिफिकेशन डिकोडिंग。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) 本课引用的集成草案方法的EAGLE-1/2 पेपर
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) ईगल के साथ मेडुसा के एक उद्धृत दृष्टिकोण
- [vLLM docs — PagedAttention](https://docs.vllm.ai/en/latest/design/kernel/paged_attention.html) 关于16 टोकन ब्लॉक 和 पेज-टेबल डिजाइन के कैनोनिक गहरे गोता-गिरना
