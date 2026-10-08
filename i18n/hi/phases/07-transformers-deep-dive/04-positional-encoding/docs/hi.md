# स्थिति एन्कोडिंग  सिनोसाइडल, रोपी, एलीबी

> ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**Time:** ~45 分钟

## समस्या

क्रम से संवेदनशील नहीं है ध्यान मैट्रिक्स के लिए स्केल बिंदु उत्पाद ध्यान`softmax(Q K^T / √d) V`द्वारा जोड़ी समानताओं 计算得到──打乱 `X`                                                                                                                                                                                                                                                              

यह शब्द के बैग मॉडल में बग नहीं है. लेकिन भाषा, कोड, ऑडियो, वीडियो, और किसी भी आदेश के लिए अर्थ ले जाने वाली चीजों के लिए, यह घातक है.

修复方法 किसी न किसी तरह स्थिति को एम्बेडमेंट्स में डालना है।

1. **Absolute sinusoidal**(वसवानी 2017) 将 `sin/cos`अतिरिक्त करने के लिए एम्बेडिंग 上──简单、不需要学习参数, लेकिन प्रशिक्षण लंबाई के बाहर एक्सट्रापोलेशन 很差──
2. **RoPE — Rotary Position Embeddings**(Su 2021) ・按与位置 成比例的角度旋转 Q 和 K भेक्टर──直接在点产品中编码 *相对* स्थिति──2026年的主流选择──
3. **ALiBi — Attention with Linear Biases**(प्रेस 2022) ❖ पूरी तरह से कूदने के लिए एम्बेड; दूरी के आधार पर 给予注意分加上 प्रति सिर रैखिक दंड──长度抽象 极佳──

截至2026年, लगभग सभी सीमाओं के खुले मॉडल RoPE:Llama 2/3/4、Qwen 2/3、Mistral、Mixtral、DeepSeek-V3、Kimi── का उपयोग करते हैं।

## अवधारणा

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### पूर्ण सिनोसोइडल

预先计算一个形 为 `(max_len, d_model)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `PE`:

```
PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
```

फिर ध्यान में  पहले निष्पादन `X' = X + PE[:N]`◊ प्रत्येक आयाम अलग-अलग आवृत्ति का सिनोसाइड है ◊ मॉडल चरण पैटर्न से सीखता है`max_len`后会失败:当模型只见过位置02047 时,没有什么告诉它位置2048会发生什么──

### रोपी

旋转 Q 和 K वेक्टर (नहीं एम्बेड किए गए) ∼对对对 आयाम `(2i, 2i+1)`:

```
[q'_2i    ]   [ cos(pos·θ_i)  -sin(pos·θ_i) ] [q_2i   ]
[q'_2i+1  ] = [ sin(pos·θ_i)   cos(pos·θ_i) ] [q_2i+1 ]

θ_i = base^(-2i / d_head),  base = 10000 by default
```

स्थिति के लिए`pos_k`应用相同旋转──dot उत्पाद `q'_m · k'_n`मैं निर्भर हो जाएगा`(m - n)`का फ़ंक्शन──也就是说:**attention score 只依赖 relative distance**, हालांकि घूर्णन पूर्ण स्थिति से प्रेरित है।

扩展 RoPE:可以缩放 `base`(NTK-aware、YaRN、LongRoPE), ताकि अनपढ़ प्रशिक्षण के मामले में अधिकतर संदर्भ तक एक्सट्रापोलेट किया जा सके。Llama 3 यहीं इस तरह से 8K से 128K संदर्भ तक विस्तारित किया जा सकता है。

### अलैबी

跳过嵌入 技巧──直接给注意点加偏见:

```
attn_score[i, j] = (q_i · k_j) / √d  -  m_h · |i - j|
```

उनमें से `m_h`है सिर विशिष्ट ढलान (उदाहरण के लिए)`1 / 2^(8·h/H)`)。 निकट टोकन  बढ़ते हैं; दूर टोकन  दंडित होते हैं。 कोई प्रशिक्षण समय लागत नहीं──论文显示, लंबाई एक्सट्रैपोलेशन 优于 sinusidal,并在原始训练长度上与 RoPE 持平──

### 2026 साल में क्या चुनना है

| Variant | Extrapolation | Training cost | Used by |
|---------|---------------|---------------|---------|
| Absolute sinusoidal | 差 | 免费 | original transformer, early BERT |
| Learned absolute | 无 | 很小 | GPT-2, GPT-3 |
| RoPE | 配合 scaling 时很好 | 免费 | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | 极佳 | fine-tune stage | Qwen2-1M, Llama 3.1 128K |
| ALiBi | 极佳 | 免费 | BLOOM, MPT, Baichuan |

RoPE 胜出, यह सीधे ध्यान में डाल सकता है और वास्तुकला को नहीं बदलता है, सापेक्ष स्थिति को कोड कर सकता है, और इसका `base`हाइपरपरमीटर दीर्घ संदर्भ सूक्ष्म-ट्यूनिंग के लिए स्पष्ट旋🏼 प्रदान किया गया है।


```figure
rope-explorer
```

## इसे बनाओ

### चरण 1: सिनोसॉइडल एन्कोडिंग

见 `code/main.py`∼4 行计算:

```python
def sinusoidal(N, d):
    pe = [[0.0] * d for _ in range(N)]
    for pos in range(N):
        for i in range(d // 2):
            theta = pos / (10000 ** (2 * i / d))
            pe[pos][2 * i]     = math.sin(theta)
            pe[pos][2 * i + 1] = math.cos(theta)
    return pe
```

पहले ध्यान की पहली परत में, इसे एम्बेडिंग मैट्रिक्स ऊपर में जोड़ा जाएगा

### चरण 2: Q 、K के RoPE के लिए 应用于

RoPE 会在 Q 和 K 上原地操作──对对对对:

```python
def apply_rope(x, pos, base=10000):
    d = len(x)
    out = list(x)
    for i in range(d // 2):
        theta = pos / (base ** (2 * i / d))
        c, s = math.cos(theta), math.sin(theta)
        a, b = x[2 * i], x[2 * i + 1]
        out[2 * i]     = a * c - b * s
        out[2 * i + 1] = a * s + b * c
    return out
```

关键: स्थिति के लिए `m`का Q 和 स्थिति `n`के के  अनुप्रयोग एक ही फ़ंक्शन ∙ उनके डॉट उत्पाद ∙ प्रत्येक निर्देशांक जोड़ी में एक प्राप्त करने के लिए `cos((m-n)·θ_i)`因子──Atention 免费学到相对位置──

### चरण 3: ALiBi ढलान और पूर्वाग्रह

```python
def alibi_bias(n_heads, seq_len):
    # slope_h = 2 ** (-8 * h / n_heads) for h = 1..n_heads
    slopes = [2 ** (-8 * (h + 1) / n_heads) for h in range(n_heads)]
    bias = []
    for m in slopes:
        row = [[-m * abs(i - j) for j in range(seq_len)] for i in range(seq_len)]
        bias.append(row)
    return bias  # add to attention scores before softmax
```

`bias[h]`सिर तक`h``(seq_len, seq_len)`ध्यान स्कोर मैट्रिक्स 上, फिर softmax──

### चरण 4: 验证 RoPE की सापेक्ष दूरी गुण

选两个随机向量 `a, b`先按 `(pos_a, pos_b)`旋转──再按 `(pos_a + k, pos_b + k)`旋转── दो बिंदु उत्पाद 必须在浮点错误内相等── इस प्रकृति में RoPE का पूरा अर्थ है यह पूर्ण स्थगित के प्रति है 

## इसका प्रयोग करें

PyTorch 2.5+ `torch.nn.functional`中提供 RoPE उपयोगिताएं──大多数生产代码使用 `flash_attn`या `xformers`, RoPE ध्यान कर्नेल के अंदर आवेदन करेगा

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**2026 年的 Long-context 技巧：**

- **NTK-aware interpolation。**4K से 16K+ तक विस्तार,将 `base`重新缩放为 `base * (scale_factor)^(d/(d-2))`
- **YaRN。**अधिक स्मार्ट इंटरपोलेशन, लंबी संदर्भों में ऊपर ध्यान एंट्रोपी को बनाए रखने के लिए उपयोग किया जा सकता है।
- **LongRoPE。**माइक्रोसॉफ्ट 2024 साल विधि, प्रयोग विकासवादी खोज के लिए प्रत्येक आयाम  चयन पैमाने कारक―Phi-3-Long प्रयोग यह―
- **Position interpolation + fine-tuning。**केवल विस्तार कारक के अनुसार  लघु पदों,并 ठीक-ट्यून 15B टोकन

## इसे भेजें

见 `outputs/skill-positional-encoding-picker.md`◊ इस कौशल को लक्ष्य संदर्भ की लंबाई, एक्सट्रापोलेशन की जरूरतों तथा प्रशिक्षण बजट के आधार पर, नए मॉडल के लिए चुनें

## व्यायाम

1. **Easy。**`max_len=512, d=128`के सिनोसाइडल `PE`मैट्रिक्स चित्रण  ताप मानचित्र हेतु  पुष्टिकरण  आयाम सूचकांक  बढ़ो, पट्टी 变宽的 पैटर्न 
2. **Medium。**实现 NTK- जागरूक RoPE स्केलिंग── लंबाई 256 के अनुक्रमों में 上 प्रशिक्षित छोटे LM, फिर लंबाई 1024 上分别测试有规模和无规模的情况──测量困惑──
3. **Hard。**उसी ध्यान मॉड्यूल में ALiBi और RoPE को प्राप्त करें। 512 के अनुक्रमों में ऊपर कॉपी कार्य का उपयोग करें। 4-परत ट्रांसफार्मर को प्रशिक्षित करें।

## प्रमुख शर्तें

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Positional encoding | “告诉 attention 顺序” | 添加到 embeddings 或 attention 中、用于编码 position 的任意 signal。 |
| Sinusoidal | “最初那个” | 以 geometric frequencies 加到 embeddings 上的 `sin/cos`；不能 extrapolate。 |
| RoPE | “Rotary embeddings” | 按 position-dependent angle 旋转 Q、K；dot product 编码 relative distance。 |
| ALiBi | “Linear bias trick” | 将 `-m·\|i-j\|` 加到 attention scores；不需要 embedding，extrapolation 很强。 |
| base | “RoPE 的旋钮” | RoPE 中的 frequency scaler；增大它可在 inference 时扩展 context。 |
| NTK-aware | “一种 RoPE scaling trick” | 重新缩放 `base`，让 context 扩展时 high-frequency dims 不会被挤压。 |
| YaRN | “高级那个” | 保留 attention entropy 的 per-dimension interpolation+extrapolation。 |
| Extrapolation | “能在训练长度之外工作” | position scheme 能否在训练时见过的 `max_len` 之外给出正确输出？ |

## आगे पढ़ना

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) 原始 sinusidal──
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) RoPE कागज
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409) ALiBi。
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071) अत्याधुनिक रोपी स्केलिंग
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) मेटा का लामा 2 दीर्घ संदर्भ पत्र──
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753) Microsoft 方法,被 Phi-3-Long 使用,并使用它 部分引用──
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) विभिन्न प्रकार के RoPE स्केलिंग योजनाओं के उत्पादन-स्तर कार्यान्वयन ((डिफ़ॉल्ट、रेखीय、गतिशील、YaRN、LongRoPE、Llama-3)
