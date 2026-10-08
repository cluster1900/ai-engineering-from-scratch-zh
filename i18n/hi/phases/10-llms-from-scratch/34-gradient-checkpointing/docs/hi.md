# ग्रेडिएंट चेकपॉइंटिंग तथा सक्रियण पुनः गणना

> बैकप्रॉपेगमेंट प्रत्येक मध्य सक्रियण मूल्य को बनाए रखेगा। 70B पैरामीटर और 128K संदर्भ में, प्रत्येक रैंक का सक्रियण मूल्य 3TB तक पहुंच सकता है।

**Type:** Build
**语言:**पायथन (numpy, वैकल्पिक मशाल के साथ)
**前置要求:**चरण 10 पाठ 04 (प्रारंभिक प्रशिक्षण मिनी-जीपीटी), चरण 10 पाठ 05 (पैमाना और वितरण)
**Time:** ~70 分钟

## 问题

 प्रशिक्षण ट्रांसफार्मर 会为每一层保存后退中需要求导的每一个操作的输入:注意输入、Q/K/V प्रोजेक्शन、softmax 输出、FFN 输入、norm 输出,以及残存流──对于隐藏的尺寸为`d`、 अनुक्रम लंबाई 为 `L`、 बैच `B`की एक परत, यह लगभग है प्रत्येक परत `12 * B * L * d`个浮点数──

 के लिए `d=8192, L=8192, B=1`, जो BF16 नीचे है 800 MB / परतों में एक 64-परत मॉडल के सक्रियण मूल्य 51 GB है, जो भी माइक्रोबैच आकार में गुणा नहीं किया गया है, न ही ध्यान-softmax मध्यवर्ती जोड़ा गया है`L^2`),更没有计入 tensor-parallel आंशिक प्रतियां──

यह एक द्विपक्षीय खाता हैःBF16 भारों के साथ अनुकूलक राज्य में 80GB में रख सकते हैं, लेकिन सक्रियण मूल्य आपको सीमा से बाहर जाने देगा। ग्रेडिएंट चेकपॉइंटिंग (जिसे सक्रियण पुनः गणना भी कहा जाता है) मानक संशोधन योजना है।

朴實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實實

## 概念

### पीछे की ओर  वास्तविक आवश्यकता क्या है

`output = layer(input)`                                                                                                                                                                                                                                                              `grad_input`和 `grad_params` इनका गणना करने के लिए, इसकी आवश्यकता हैः

- `input`(रेखागत स्तरीय मध्य गणना के लिए)`grad_params = input.T @ grad_output`)
- कुछ सक्रियण निर्देशांक मध्य मात्रा ((ReLU/GELU/softmax के निर्देशांक सक्रियण मूल्य पर निर्भर)

आगे बढ़ें 会在 ऑटोग्राड ग्राफ 中自动保存这些内容──每一个`tensor.retain_grad()`तथा प्रत्येक को अपनी प्रविष्टि की आवश्यकता होती है।

### 朴素 पूर्ण चेकपोइंटिंग

नेटवर्क को तोड़ना`N`个段――前进 期间, केवल प्रत्येक खंड के * इनपुट*── जब पीछे 需要中间量时, पुनः运行该段的前进通过 来物化它们,然后再求导──

उदाहरण:32-परत ट्रांसफार्मर  32 个段, प्रत्येक खंड 1 层  में विभाजित

- स्मृति:32 个 परत इनपुट(小) के लिए 32 *( प्रति परत सक्रियण मात्रा)
- 额外计算: प्रत्येक खंड 额外 1 बार आगे, यानि कुल आगे FLOPs 约 33% बढ़े हैं, क्योंकि पीछे की ओर अग्रिम की 2x है, पूर्ण चरण से 1 + 2 = 3 个单位变为 1 + 1 + 2 = 4 个单位) 

यह मूल रूप से Chen et al. 2016 का कार्यक्रम हैः प्रति `sqrt(L)`层放一个检查点,以平衡记忆和计算――对于L=64,就是8个检查点――

### चुनिंदा चेकपॉइंटिंग (कोर्तिकान्ती 2022)

सभी सक्रियण मूल्य की लागत समान नहीं है। ध्यान softmax 输出是 `B*L*L*heads`,并随序列 लंबाई *二次* 增长──FFN छिपे सक्रियण 是 `B*L*4d`,线性增长──长序列,softmax 占主导──

चयनात्मक चेकपॉइंटिंग, भंडारण लागत कम के सक्रिय मूल्य को बनाए रखने के लिए, केवल महंगे भाग को पुनः गणना करने के लिए, ध्यान दें।

मेगाट्रॉन कोर इसे सेलेक्टिव सक्रियण पुनः गणना के लिए लागू करेगा। अधिकांश 2024+ सीमा प्रशिक्षण रन इसका उपयोग कर रहे हैं।

### अपलोड

重新计算的替代方案:在前进和后退之间 把激活值传输到CPU RAM──它需要PCIe带宽;当空带宽的收益高于重现实化 成本时很有用──混合策略很常见: कुछ परतें चेक पॉइंट, अन्य अपलोड──

FSDP2 को अनलोड किया जाएगा 作为一等选项提供──当GPU受记忆限制,但CPU-GPU转移还有余量时, अनलोड प्रदर्शन很好──

### लागत मॉडल को पुनः गणना करें

प्रत्येक`k`层检查点 一次 总共 `L`层时,朴素 चेकपोइंटिंग के प्रति चरण FLOPs:

```
flops_fwd_normal = L * f_layer
flops_bwd_normal = 2 * L * f_layer
flops_total_normal = 3 * L * f_layer

flops_fwd_ckpt = L * f_layer
flops_recompute = L * f_layer  # one extra forward per layer in the segment
flops_bwd_ckpt = 2 * L * f_layer
flops_total_ckpt = 4 * L * f_layer
overhead = 4 / 3 - 1 = 0.33 = 33%
```

चयनात्मक चेकपॉइंटिंग का उपयोग करते हुए, आप केवल ध्यान कर्नेल को पुनः गणना करते हैं, पूरे स्तर के बजायः

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### स्मृति बचत मॉडल

प्रत्येक स्तर सक्रियण मात्राः`A` `L`层,总 सक्रियण स्मृति:`L * A`

पूर्ण चेकपॉइंट (सेगमेंट साइज 1)): 只保存 `L * input_volume`(स्टैंडर्ड ट्रांसफार्मर के लिए 约为 `L * 1/10 A`)―节省约 `9 * L * A * 1/10`

प्रत्येक`k`层检查点 一次:保存 `L/k * A`, पुनः सक्रिय खंड में जोड़ें`k-1`層的量──

`k = sqrt(L)`时, स्मृति और पुनर्गणना लागत के अनुसार `sqrt(L)`缩放, यह समान लागत परतों का सबसे अच्छा वजन है

### 什么时候不该 चेकपॉइंट

- पाइपलाइन चरण में उड़ान में पहले से ही सबसे आंतरिक परतों में से एक है।
- यदि पहले और अंतिम परतों ने इस चरण की गणना की है, तो ट्रांसफार्मर में बहुत कम देखने को मिलता है, तो चेकपॉइंट 它们──
- 已使用 FlashAttention के ध्यान कर्नेल: फ्लैश 已会快速重新计算 softmax, इसलिए अतिरिक्त परत-स्तरीय चेकपॉइंटिंग 叠加收益很小──

### कार्यान्वयन के पैटर्न

1. **Function wrapper：**उपयोग `torch.utils.checkpoint.checkpoint(fn, input)`包裹一个段子──PyTorch `input`,                                                                                                                                                                                                                                                               

2. **Decorator-based：**लेयर को चेकपॉइंट के रूप में चिह्नित करना; प्रशिक्षक कॉन्फ़िग समय में तय करता है कि कौन से सेगमेंट पैक किए जाते हैं।

3. **Manual explicit recompute：**स्व编写后转通,调用自定义的 `recompute_forward`, using save के इनपुट  कॉपी फॉरवर्ड 

三者给给出的 कार्यात्मक परिणाम 相同── wrappers is standard habit usage法──

### टीपी / पीपी / एफपी8 के साथ बातचीत

- **Tensor parallel：**चेकपॉइंट इनपुट को पुनः गणना के दौरान इकट्ठा या पुनः प्राप्त करना होगा; संचार लागत को संसाधित करने की आवश्यकता है。
- **Pipeline parallel：**典型模式是检查点, प्रत्येक पाइपलाइन चरण के आगे, ताकि रिवर्स-ऑर्डर माइक्रोबैच सक्रियण स्मृति का पुनः उपयोग कर सकते हैं.
- **FP8 recompute：**पुनः गणना 期间更新的 amax इतिहास 必须与原始前进匹配,否则FP8 पैमाने 会漂移── अधिकांश ढांचे 会 स्नैपशॉट पैमाने──


```figure
activation-recompute
```

##  इसे निर्माण

### 步骤 1:带 Segments का खिलौना मॉडल

```python
import numpy as np


def linear_forward(x, w, b):
    return x @ w + b


def relu(x):
    return np.maximum(x, 0)


def layer_forward(x, w1, b1, w2, b2):
    h = relu(linear_forward(x, w1, b1))
    return linear_forward(h, w2, b2)


def model_forward(x, params):
    activations = [x]
    h = x
    for w1, b1, w2, b2 in params:
        h = layer_forward(h, w1, b1, w2, b2)
        activations.append(h)
    return h, activations
```

### 步骤 2: आवश्यक सभी सक्रियण की सरल पीछे की ओर

```python
def model_backward(grad_output, activations, params):
    grads = [None] * len(params)
    g = grad_output
    for i in range(len(params) - 1, -1, -1):
        w1, b1, w2, b2 = params[i]
        x_in = activations[i]
        h_pre = linear_forward(x_in, w1, b1)
        h = relu(h_pre)
        gh = g @ w2.T
        gw2 = h.T @ g
        gb2 = g.sum(axis=0)
        g_pre = gh * (h_pre > 0)
        gx = g_pre @ w1.T
        gw1 = x_in.T @ g_pre
        gb1 = g_pre.sum(axis=0)
        grads[i] = (gw1, gb1, gw2, gb2)
        g = gx
    return g, grads
```

### 步骤 3: चेकपॉइंट-हर-के मेमोरी

```python
def model_forward_checkpointed(x, params, k=4):
    saved_inputs = [x]
    h = x
    for i, (w1, b1, w2, b2) in enumerate(params):
        h = layer_forward(h, w1, b1, w2, b2)
        if (i + 1) % k == 0:
            saved_inputs.append(h)
    return h, saved_inputs


def model_backward_checkpointed(grad_output, saved_inputs, params, k=4):
    grads = [None] * len(params)
    g = grad_output
    segments = [(j * k, min((j + 1) * k, len(params))) for j in range(len(saved_inputs))]
    for seg_idx in range(len(saved_inputs) - 1, -1, -1):
        start, end = segments[seg_idx]
        if start >= end:
            continue
        x_in = saved_inputs[seg_idx]
        _, seg_acts = model_forward(x_in, params[start:end])
        g, seg_grads = model_backward(g, seg_acts, params[start:end])
        for j, gr in enumerate(seg_grads):
            grads[start + j] = gr
    return g, grads
```

### 步骤 4: लागत मॉडल

```python
def checkpoint_cost(n_layers, segment_size, flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }


def selective_checkpoint_cost(n_layers, attention_fraction=0.15,
                              flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * attention_fraction * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }
```

### 步骤 5:मेमोरी स्केलेटर

```python
def activation_memory_mb(n_layers, hidden=8192, seq=8192,
                        batch=1, bytes_per_value=2):
    per_layer = 12 * batch * seq * hidden * bytes_per_value
    return n_layers * per_layer / 1e6


def memory_after_checkpoint(n_layers, segment_size, hidden=8192,
                           seq=8192, batch=1, bytes_per_value=2):
    n_seg = max(1, n_layers // segment_size)
    saved = (n_seg + segment_size) * 1 * batch * seq * hidden * bytes_per_value
    return saved / 1e6
```

### 步骤 6: इष्टतम खंड आकार

```python
def optimal_segment(n_layers):
    return int(round(np.sqrt(n_layers)))
```

### 步骤 7:छोटे चेकपॉइंट निर्णय

```python
def should_recompute(layer_type, activation_bytes, recompute_flops_ratio):
    if layer_type == "attention" and activation_bytes > 100 * 1e6:
        return True
    if layer_type == "ffn" and activation_bytes > 500 * 1e6:
        return recompute_flops_ratio < 0.1
    return False
```

## इसका उपयोग करें

- **torch.utils.checkpoint**:`from torch.utils.checkpoint import checkpoint`,PyTorch 中的规范包装──它包裹一个函数;只保存输入,然后倒后重新计算──
- **Megatron-Core activation recomputation**: समर्थन `selective``full`和 `block`मोड्स── यह 2024+ सीमावर्ती प्रशिक्षण की मानक प्रथा है।
- **FSDP2 offload**:FSDP2 中中 `module.to_empty(device="cpu")`配合 `offload_policy`, सक्रियण को पुनः गणना के बजाय सीपीयू में टुकड़े कर देगा
- **DeepSpeed ZeRO-Offload**: अनुकूलक राज्यों और सक्रियण के सीपीयू उतारने के लिए, के साथ चेकपॉइंटिंग 互补──

## 交付 यह

本课会产出 `outputs/prompt-activation-recompute-policy.md`, यह एक संकेत हैः यह आपके मॉडल कॉन्फ़िगरेशन को प्राप्त करता है (परतों, छिपे हुए, अनुक्रम, बैच) और उपलब्ध जीपीयू मेमोरी,并输出逐层 पुनर्कंप्यूटर नीति (कोई / चयनात्मक / पूर्ण / अपलोड नहीं)

## अभ्यास

1. 验证正确性――运行 `model_forward`+ `model_backward`(पूर्ण सक्रियण)`model_forward_checkpointed`+ `model_backward_checkpointed`(सेगमेंट) ◊ पैरामीटर ग्रेडिएंट ◊ मशीन सटीकता में होना चाहिए

2. 扫描 खंड आकार `k`, 1 से `L`️FLOP ओवरहेड और मेमोरी ️ ढूंढें ️

3. 实现选择性检查点: ध्यान-मॉड्यूल इनपुट को सहेजें, लेकिन उनमें से间量── को सहेजें, लेकिन seq=8192 के 32-परत मॉडल के लिए, पूर्ण-परत जांच बिंदु के FLOP ओवरहेड के लिए मापें──

4. 添加脱载──把段输入 保存到一个模拟的 CPU缓冲(一个单独的列表)──将 PCIe带宽 作为字节/时间测量,并找出脱载与重计算 之间的破解点──

5. बेंचमार्क एक वास्तविक PyTorch ट्रांसफार्मर,分別使用和不使用 `torch.utils.checkpoint`                                                                                                                                                                                                                                                              `torch.cuda.max_memory_allocated`) और चरण समय

## 关键术语
| Term | 人们通常怎么说 | 它实际意味着什么 |
|------|----------------|----------------------|
| Gradient checkpointing | “通过重做 forward 节省 memory” | 只存储 segment inputs；在 backward 期间重新计算中间量，以获得支持 Gradient 的 tensors |
| Activation recomputation | “和 checkpointing 一样” | 同一技术在 HPC 语境下的名称 |
| Segment size (k) | “每个 checkpoint 包含多少层” | 其中间量被丢弃并一起 rematerialized 的层数 |
| Selective checkpointing | “Korthikanti 的技巧” | 只重新计算存储成本高的激活值（attention softmax）；保留低成本的部分 |
| Full checkpointing | “朴素版本” | 在每个 segment 中重新计算每层的中间量 |
| Block checkpointing | “Coarse-grained” | Checkpoint 整个 transformer blocks；粒度最大 |
| FLOP overhead | “compute 税” | 每 step 额外 FLOPs = (recompute FLOPs) / (fwd + bwd FLOPs)；朴素方案 33%，selective 方案 5% |
| Activation offload | “传到 CPU” | 在 forward->backward 之间把 activations 移到 CPU RAM；是 recompute 的替代方案 |
| sqrt-L rule | “经典最优解” | 对于 uniform-cost layers，最优 checkpoint spacing 是 sqrt(L) 层 |
| Attention-softmax volume | “O(L^2) 问题” | L^2 * heads * batch 个浮点数；在长 context 下主导 activation memory |

## 延伸阅读
- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174)-- मूल रूप से औपचारिक ग्रेडिएंट चेकपोइंटिंग का निबंध
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198)-- चुनिंदा सक्रियण पुनः गणना तथा औपचारिक लागत विश्लेषण
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645)--   रिवर्स मोड रीमैटेरियलाइज़ेशन                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840)-- पैमाने नीचे सक्रियण उतार
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html)-- 标准 एपीआई
- [Megatron-Core activation recomputation documentation](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/memory_optimizations.html)-- चयनात्मक 、पूर्ण व ब्लॉक मोड
