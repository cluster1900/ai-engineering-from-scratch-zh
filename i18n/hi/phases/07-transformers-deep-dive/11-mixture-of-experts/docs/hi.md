# विशेषज्ञों का मिश्रण (एमओई)

> एक घने 70B ट्रांसफार्मर प्रत्येक टोकन के लिए होगा  सक्रिय सभी तत्वों──एक 671B MoE प्रत्येक टोकन केवल 37B तत्वों को सक्रिय करेगा, लेकिन सभी बेंचमार्क पर इसे जीतने में सक्षम होगा── दुर्लभता इस दशक की सबसे महत्वपूर्ण स्केलिंग है 思想──

**Type:** Build
**Languages:** Python
**先修要求:**चरण 7 · 05 (पूर्ण ट्रांसफार्मर), चरण 7 · 07 (जीपीटी)
**Time:** ~45 minutes

## 问题

घने ट्रांसफार्मर में अनुमान लगाने के समय FLOPs 等等于其参数(前进通过 乘以 2)  विस्तार एक घने मॉडल                                                                                                                                                                                                                                              

विशेषज्ञों का मिश्रण 打破了这种关联──把每一个FFN 替换成`E`个独立专家 + 一个为每个 टोकन 选择 `k`个专家的路由器──总参数 = `E × FFN_size` प्रत्येक टोकन का सक्रिय तत्व संख्या = `k × FFN_size`◊2026 के लिए विशिष्ट संरचनाः`E=256`,`k=8` भंडारण`E`扩展,计算随 `k`विस्तार

2026 साल की सीमा  लगभग पूरा है MoE:DeepSeek-V3(671B कुल / 37B सक्रिय) ✓ मिश्रित 8×22B、Qwen2.5-MoE、Llama 4、Kimi K2、gpt-oss──

## 概念

![MoE layer: router selects k of E experts per token](../assets/moe.svg)

### FFN 替换

घने ट्रांसफार्मर ब्लॉकः

```
h = x + attn(norm(x))
h = h + FFN(norm(h))
```

मोई ब्लॉकः

```
h = x + attn(norm(x))
scores = router(norm(h))              # (N_tokens, E)
top_k = argmax_k(scores)              # pick k of E per token
h = h + sum_{e in top_k}(
        gate(scores[e]) * Expert_e(norm(h))
    )
```

प्रत्येक विशेषज्ञ एक स्वतंत्र FFN है (आमतौर पर SwiGLU) ￼। राउटर एक एकल लाइनर स्तर है।`k`个专家,并获得它们输出门口混合物──

### भार संतुलन 问题

यदि रूटर  90% टोकन  विशेषज्ञ 3 से गुजरता है, अन्य विशेषज्ञ  भूख से मर जाते हैं।

1. **Auxiliary load-balancing loss**(स्विच ट्रांसफार्मर、मिश्रण) ◊ एक विशेषज्ञ उपयोग दर के साथ एक अतिरिक्त उपयोग अनुपात में एक अतिरिक्त उपयोग कर सकते हैं, लेकिन एक हाइपरमैटर और एक दूसरे ग्रेडिएंट 信号 को जोड़ने के लिए प्रभावी है ◊
2. **Expert capacity + token dropping**(早期 Switch)  प्रत्येक विशेषज्ञ  最多处理 `C × N/E`个 टोकन;溢出的 टोकन 跳过该层──会损害质量──
3. **Auxiliary-loss-free balancing**(DeepSeek-V3)── एक सीखने योग्य प्रति विशेषज्ञ पूर्वाग्रह जोड़े, जिससे रूटर के शीर्ष-क चयन को स्थानांतरित किया जा सके── पूर्वाग्रह प्रशिक्षण हानि में बाहरी अपडेट──

डीप सीक-वी३ का अभ्यासः प्रत्येक प्रशिक्षण चरण के बाद, प्रत्येक विशेषज्ञ के लिए इसकी उपयोग दर उच्च या निम्न है।`±γ`微调偏见──选择时使用 `scores + bias` उपयोग में गेटिंग के विशेषज्ञ संभावनाओं  अभी भी उपयोग में अपरिवर्तित मूल `scores` यह रूटिंग के साथ अभिव्यक्ति 解──

### साझा विशेषज्ञ

डीप-सर्च-वी2/वी3 भी विशेषज्ञों को विभाजित करें *साझा* और *रूट*♦ प्रत्येक टोकन शहर में सभी साझा विशेषज्ञों के माध्यम से चलाया गया है―रूट विशेषज्ञों के माध्यम से शीर्ष-के  चयन♦ साझा विशेषज्ञों को सामान्य ज्ञान प्राप्त करने के लिए; रुट विशेषज्ञों को जिम्मेदार विशेषज्ञों को समर्पित करना♦ V3 运行 1 साझा विशेषज्ञ, जो 256 रूट विशेषज्ञों के बीच शीर्ष-8 में शामिल हैं♦

### बारीक अनाज विशेषज्ञ

经典 MoE(GShard、Switch): प्रत्येक विशेषज्ञ 和完整FFN 一样宽──`E`较小(8-64),`k`较小(1-2)。

现代 बारीक-धान्यित मोई (DeepSeek-V3、Qwen-MoE): प्रत्येक विशेषज्ञ 更狭(1/8 एफएफएन आकार)`E`很大(256+),`k`                                                                                                                                                                                                                                                              `C(256, 8) = 400 trillion`种可能的每代币 专家──质量提升,延迟 保持不变──

### 成本画像

प्रत्येक टोकन ∙ प्रत्येक स्तर:

| Config | Active params / token | Total params |
|--------|-----------------------|--------------|
| Mixtral 8×22B | ~39B | 141B |
| Llama 3 70B (dense) | 70B | 70B |
| DeepSeek-V3 | 37B | 671B |
| Kimi K2 (MoE) | ~32B | 1T |

डीपसेक-वी3 लगभग सभी बेंचमार्क ऊपर सभी जीत लिया Llama 3 70B ((घनत्व), साथ ही**每个 Token 使用更少的活跃 FLOPs**△ अधिक参数 = 更多知识──更多活跃 FLOPs = प्रत्येक टोकन 更多计算──MOE将它们解──

### 代价:स्मृति

 चाहे जो भी विशेषज्ञों को प्रेरित किया जाए, सभी विशेषज्ञों को GPU पर रहना होगा  एक 671B  मॉडल को fp16 वजन को संग्रहीत करने के लिए लगभग 1.3 TB VRAM की आवश्यकता है  सीमा पार मोई तैनाती  विशेषज्ञ समानांतर की आवश्यकता हैः विशेषज्ञों को कई GPUs पर विभाजित करें, नेटवर्क मार्ग टोकन के माध्यम से  लटेंसी मुख्य रूप से सभी-से-सब के संचार से 主导, न कि matmul


```figure
expert-routing
```

##  इसे निर्माण

参见 `code/main.py` एक शुद्ध स्ट्डिब के सख्त एमओई परत, जिसमें शामिल हैंः

- `n_experts=8`个近似 SwiGLU के विशेषज्ञों(के लिए आसान है, प्रत्येक केवल एक रैखिक है)
- शीर्ष-k=2 रूटिंग
- नरम अधिकतम-सामान्य गेटिंग वजन
- ️ विशेषज्ञ प्रति पूर्वाग्रह ️ सहायक-हानि-मुक्त संतुलन को प्राप्त करना

### 步骤 1: राउटर

```python
def route(hidden, W_router, top_k, bias):
    scores = [sum(h * w for h, w in zip(hidden, W_router[e])) for e in range(len(W_router))]
    biased = [s + b for s, b in zip(scores, bias)]
    top_idx = sorted(range(len(biased)), key=lambda i: -biased[i])[:top_k]
    # softmax over ORIGINAL scores of the chosen experts
    chosen = [scores[i] for i in top_idx]
    m = max(chosen)
    exps = [math.exp(c - m) for c in chosen]
    s = sum(exps)
    gates = [e / s for e in exps]
    return top_idx, gates
```

पूर्वाग्रह  प्रभावित चयन, गेट वजन को प्रभावित नहीं करते हैं,, यह है DeepSeek-V3 की तकनीकः पूर्वाग्रह में त्रुटि मॉडल पूर्वानुमान के मामले में भार असंतुलन को सुधारने,,

### 步骤 2: 让 100 个 टोकन 通过路由器

अनुगमन करें कि कौन से विशेषज्ञों को प्रभावित किया गया है तथा किस प्रकार के विशेषज्ञों को प्रभावित किया गया है।`-γ`, उपयोग के अभाव में उपयोग`+γ`) के बाद, उपयोग दर कुछ पीढ़ियों में प्राप्ति से औसत वितरण होगा।

### 步骤 3: तत्वों के अनुपात

印印一个MoE config 的 密度相当──DeepSeek-V3 形状:256 रूटेड + 1 शेयर,8 सक्रिय,d_model=7168──总参数非常惊人──活跃参数只有密度Llama 3 70B 的七分之一──

## इसका उपयोग करें

गले लगाना चेहरा

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("mistralai/Mixtral-8x22B-v0.1")
```

2026 साल का उत्पादन निष्कर्षः vLLM 原生支持 MoE रूटिंग──SGLang 拥有最快的专家-समान पथ──两者都会自动处理顶级选项和专家对行──

**何时选择 MoE：**
- आप चाहते हैं कि प्रति टोकन कम लागत से अनुमानित गुणवत्ता प्राप्त करें।
- आपके पास वीआरएएम/विशेषज्ञ समानांतर बुनियादी ढांचा है।
- आपका कार्यभार टोकन-भारी है, बजाय संदर्भ-भारी है, लंबे डॉक्स)

**何时不要选择 MoE：**
- एज तैनाती: आप किसी भी सक्रिय FLOP के लिए पूरी भंडारण लागत का भुगतान करेंगे
- लटेंसी-क्रिटिकल सिंगल यूजर सर्विसः एक्सपर्ट राउटिंग 会增加 ओवरहेड──
- 小模型(<7B):MOE का गुणवत्ता लाभ केवल एक निश्चित गणना सीमा से अधिक होने पर ही प्रकट होता है (लगभग 6B सक्रिय पैरामीटर)

## 交付 यह

参见 `outputs/skill-moe-configurator.md`◊ इस कौशल को पैरामीटर बजट, प्रशिक्षण टोकन और तैनाती लक्ष्य के आधार पर, नए एमओई के लिए 选择 E、k 和 साझा-विशेषज्ञ लेआउट हेतु ◊

## अभ्यास

1. **Easy.**运行 `code/main.py`◊ देखिये सहायक-हानि-मुक्त पूर्वाग्रह अद्यतन 如何在50 次中拉平 विशेषज्ञ उपयोग
2. **Medium.**हैश आधारित राउटर का उपयोग करें (definitivity,no need to learn) सीखते हुए राउटर का प्रतिस्थापन करें।
3. **Hard.**实现 GRPO-style rollout-matched routing(DeepSeek-V3.2 技巧): रिकॉर्ड इन्फेरेंस 期间哪些专家被触发,在 Gradient 计算期间强制使用相同的路由──在一个玩具政策-gradient सेटअप上测量效果──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Expert | “众多 FFN 中的一个” | 一个独立 feed-forward network；参数专用于 FFN 计算中的一个稀疏切片。 |
| Router | “gate” | 一个很小的 linear layer，用来为每个 Token 对每个 expert 打分；执行 top-k selection。 |
| Top-k routing | “每个 Token 有 k 个 active experts” | 每个 Token 的 FFN 计算恰好经过 k 个 experts，并由 gate 加权。 |
| Auxiliary loss | “Load-balance penalty” | 一个额外 Loss term，用来惩罚偏斜的 expert usage。 |
| Auxiliary-loss-free | “DeepSeek-V3 的技巧” | 只在 router 的 selection 上通过 per-expert bias 实现 balance；没有额外 Gradient。 |
| Shared expert | “Always on” | 每个 Token 都会经过的额外 expert；捕获通用知识。 |
| Expert parallelism | “按 expert 分片” | 将不同 experts 分配到不同 GPUs；通过网络 route tokens。 |
| Sparsity | “active params < total params” | 比率 `k × expert_size / (E × expert_size)`；DeepSeek-V3 为 37/671 ≈ 5.5%。 |

## 延伸阅读

- [Shazeer et al. (2017). Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538) इस विचार का स्रोत
- [Fedus, Zoph, Shazeer (2022). Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961) स्विच, क्लासिक मोई
- [Jiang et al. (2024). Mixtral of Experts](https://arxiv.org/abs/2401.04088) मिश्रित 8×7B。
- [DeepSeek-AI (2024). DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) एमएलए + सहायक हानि मुक्त एमओई + एमटीपी。
- [Wang et al. (2024). Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts](https://arxiv.org/abs/2408.15664)   पूर्वाग्रह के आधार पर संतुलन 论文──
- [Dai et al. (2024). DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066) 本课路由器 使用的细粒+共享专家分分──
- [Kim et al. (2022). DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training](https://arxiv.org/abs/2201.05596) 最早的 साझा-विशेषज्ञ 论文──
