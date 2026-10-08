# पूर्व-पूर्ति/डिकोड  NVIDIA Dynamo 和 llm-d

> Prefill is computation-bound;decode is memory-bound॥ एक ही GPU पर एक ही ब्लॉक पर चलते समय दोनों संसाधनों में से एक को बर्बाद करेगा। डिसागरेशन उन्हें अलग अलग संसाधनों में विभाजित करेगा, और NIXL के माध्यम से उन्हें विभाजित करेगा। RDMA/InfiniBand या TCP fallback) उनके बीच KV कैश को प्रसारित करेगा। NVIDIA Dynamo, GTC 2025 发布,1.0 GA) vLLM/SGLang/TRT-LLM पर स्थित है। इसके प्लानर चेंज + SLA प्लानर स्वचालित रूप से गतिशीलता के अनुसार संसाधनों में से एक को बर्बाद करेगा। Prefill:Discaggregation उन्हें अलग अलग संसाधनों में विभाजित करेगा, और NIXL के माध्यम से NVIDIA द्वारा जारी किए गए टोटो को पूरा करेगा। NVIDIA.com ने इस सीमा में विस्तारित कियाः nvidia.com2025-06) ने AWS सेवाएं के लिए GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL72 + GBL1 + GBL1 + GBL1 + GBL1 + GBL1 + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GBL + GB1 + GB + GBL + GBL + GBL + GB + GB1 + GBL + GB + GB + GBL + GB + GB + GBL + GB + GB + GBL + GB + GB + GB + GB + GB + GB + GB + GB + GBL + GB + GB + GB + GB +$2M 级别推理支出上节省 30–40%（即 $600-800K/वर्ष); यह विशिष्ट है$2M→$600-800K संख्याएँ आंतरिक समग्र हैं, एक एकल प्रकाशित केस स्टडी नहीं, इसे संख्यात्मक श्रेणी के रूप में 点 के रूप में समझना चाहिए, बल्कि संदर्भ संदर्भ 点 के रूप में 

**Type:** 学习
**Languages:** Python（stdlib，玩具级 disaggregated-vs-colocated simulator）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals），Phase 17 · 08（Inference Metrics）
**Time:** ~75 分钟

## 学习目标

- 解释为什么前填和解码有不同的优质GPU 分配,并量化配合 下的浪费──
-  draw out disaggregated architecture: पूल पूल  डिकोड पूल  NIXL के केवी ट्रांसफर  राउटर 
- कह बाहर विखंडन 不划算的条件(短提示、短输出)
- 区分 NVIDIA Dynamo(स्टैक-ऊपर) और llm-d(Kubernetes-नेटिव),并把它们匹配对应的运维场景──

## 问题

आप 8 块 H100 上运行 Llama 3.3 70B──在混合工作负载中长提示 + 短输出) 下,GPU 在解码期间空,因为大部分计算 已经花在预填上──在另一类工作负载中短提示 + 长输出) 下,情况相反──

 बजट प्रभाव:20-40% का GPU  समय की बर्बादी गलत संसाधनों पर है  आप H100 कंप्यूटर खरीद रहे हैं  मेमोरी-बाउंड डिकोड चला रहे हैं, या H100 HBM बैंडविड्थ खरीद रहे हैं  कम्प्यूटर-बाउंड प्रीफिल चला रहे हैं  ये दोनों महंगे बर्बादी हैं

विखंडन 会把 प्रीफिल 和 डिकोड 拆分到独立资源池,并按各自瓶进行尺寸化──KV कैश 通过高带宽互连从预填池 传输到解码池──

## 概念

### क्यों बोतल अलग है

**Prefill** पूर्ण इनपुट प्रॉम्प्ट  एक बार ट्रांसफार्मर आगे  निष्पादित करें  मैट्रिक्स गुणन  प्रमुख; कम्प्यूटेबल-बाउंड  H100 FP8  लगभग 2000 TFLOPS का प्रभावी吞吐 प्रदान किया जा सकता है  बैच दक्षता  बहुत अच्छा, एक बार आगे  कई टोकन को संसाधित किया जा सकता है 

**Decode** एक बार उत्पन्न एक टोकन, प्रत्येक बार 代都读取完整重量──メモリ-帯域幅-bound──HBM3 提供约3TB/s──Batch efficiency 只有在高同步下才好,因为重量读会在批量上分摊──

इन्हें रखेंः आप दोनों के लिए एक ही समय में खरीदते हैं अनुकूलित GPU──H100  दोनों अच्छे हैं, लेकिन चाहे किसी भी उपयोग की लागत हो, आप आकार में पूल को पूल करना चाहते हैं H100 / कम्प्यूटर-हेवी का उपयोग करें; डिकोड पूल H200 / मेमोरी-हेवी का उपयोग करें, या आक्रामक क्वांटिज़ेशन के साथ संयोजन करें──

### 架构

```
            ┌──────────────┐
  Request → │    Router    │ ───────────────────────┐
            └──────┬───────┘                        │
                   │                                │
                   ▼ (prompt only)                  │
            ┌──────────────┐    KV cache    ┌───────▼──────┐
            │ Prefill pool │ ─── NIXL ────► │ Decode pool  │
            │  (compute)   │                │  (memory)    │
            └──────────────┘                └──────┬───────┘
                                                   │ tokens
                                                   ▼
                                                 Client
```

NIXL NVIDIA का इंटर-नोड परिवहन है। यह आरडीएमए/इन्फिनीबैंड का उपयोग करके उपलब्ध है।

### डायनामो बनाम इलम-डी

**NVIDIA Dynamo**(जीटीसी 2025 发布,1.0 GA):
- 作为乐团员 位于 vLLM、SGLang、TRT-LLM 之上──
- प्लानर प्रोफाइलर 测量工作负载,SLA प्लानर स्वतः कॉन्फ़िगरेशन prefill:decode 比例。
- जंग कोर, पायथन विस्तारकता
- 吞吐提升:NVIDIA 报告称, GB200 NVL72 + Dynamo 上,DeepSeek-R1 MoE 在中等延迟区间达到6x(developer.nvidia.com,2025-06);社区关于全布莱克威尔 + 迪纳莫 + 딥Seek-R1 स्टैक 多达30x 的报告缺少单一主要来源,应视为方向性信息──
- GB300 NVL72 + Dynamo: According Dynamo 产品页(developer.nvidia.com,未注明期),相比霍珀,एमओई 吞吐最高可可达50x──

**llm-d**(रेड हैट + एडब्ल्यूएस, कुबेरनेट्स-नेटिव):
- पूर्व-पूर्ति / डिकोड / राउटर 作为独立 Kubernetes Services──
- प्रति भूमिका एचपीए उपयोग कतार गहराई (prefill) / KV उपयोग (decode) signal。
- `topologyConstraint packDomain: rack`उच्च बैंडविड्थ केवी स्थानांतरण को प्राप्त करने के लिए एक ही रैक पर प्रीफिल + डिकोड क्लिक  को रखा जाएगा।
- llm-d 0.5(2026):पदानुक्रमिक KV उतारने, कैश-जाहिर LoRA रूटिंग, UCCL नेटवर्किंग, पैमाने से शून्य तक

यदि आप चाहते हैं प्रबंधित स्टैक-ऊपर ऑर्केस्ट्रेटर, Dynamo का उपयोग करें. यदि आप चाहते हैं कुबेरनेट्स-देशी आदिम, और पहले से ही सीएनसीएफ में डाल दिया गया है 生态, llm-d का उपयोग करें.

### 经济性

内部 composite (केवल एक मात्र प्रकाशित केस स्टडी नहीं, केवल एक मात्रात्मक श्रेणी के रूप में)

- प्रति वर्ष 2 मिलियन डॉलर का अनुमानित व्यय किया गया।
- 切换到使用 डायनामो का विघटित सेवा──
- समान अनुरोध मात्रा, समान P99 लटेंसी SLA
- 报告节省:$600K–$800K/वर्ष (~ 30~40%)
- 无新增硬件──

हम कई ग्राहक विवरणों में समग्र रूप से यह आंकड़ा प्राप्त करते हैं, न कि एक एकल संदर्भ योग्य केस स्टडी से; सबसे निकटतम प्रकाशित डेटा बिंदु बेस्टेन के डायनामो केवी रूटिंग है जो 2 गुना तेज़ टीटीएफटी / 61% अधिक आउटपुट लाता है।

### 什么时候 मत विघटित

- संकेत < 512 टोकन 且输出 < 200 टोकन:传输税主导收益。
- 小型集群(< 4 GPUs): पर्याप्त पूल विविधता नहीं है。
- 团队无法运维两个GPU पूल并进行每角色规模化: डायनामो会有帮助,但并非无复杂性──
- 没有 RDMA fabric:TCP हस्तांतरण कर 更重──

### राउटर और चरण 17 · 11 集成

विखंडित राउटर KV-cache-aware हैं (Phase 17 · 11)  अनुरोध होगा कि उसके पूर्वनिर्धारित का डिकोड पूल हो जाए ऊपर; यदि कोई मेल नहीं खाता है, तो पहले से भरें → डिकोड करें。 हिट रेट और विखंडन 会叠加收益, कैश-aware राउटर तय करता है कि क्या उसे नए पूर्वनिर्धारित की आवश्यकता है──

### ब्लैकवेल के शीर्ष पर एमओई केवल एक वास्तविक डिजिटल जगह है

GB300 NVL72 + Dynamo  ने दिखाया है की तुलना में हॉपर बेसलाइनों 50x के MoE 吞吐──MoE विशेषज्ञ रूटिंग में पूर्वपूर्ति ऊपर कंप्यूटिंग-भारी, लेकिन में डिकोड ऊपर स्मृति-भारी(विशेषज्ञ कैश), इसलिए विभाजन है द्वि重收益──2026 साल सीमा मॉडल सेवा करते हैं 以 MoE 为主----DeepSeek-V3、未来 GPT-5 संस्करण)──

### आप याद रखना चाहिए कि संख्या

बेंचमार्क संख्यात्मक परिवर्तन, NVIDIA तथा निष्कर्ष स्टैक प्रत्येक तिमाही में अपडेट परिणाम प्रकाशित किये जायेंगे।

- GB200 NVL72 + Dynamo 上的DeepSeek-R1:中等延迟区间相相比基线 约 ~6x 吞吐(developer.nvidia.com,2025-06);社区关于全布莱克威尔 + डायनामो स्टैक 多达30x的说法是方向性聚合,没有单一主要来源──
- GB300 NVL72 + Dynamo:相比 होपर,एमओई 吞吐最高可达50x(developer.nvidia.com,未注明期)
- 节省点(内部 कम्पोजिट, नहीं एक एकल केस स्टडी):$2M 年度支出中节省 $600-800K/वर्ष
- विखंडन सीमाःप्रॉम्प्ट्स > 512 टोकन + आउटपुट > 200 टोकन。
- NIXL के माध्यम से KV स्थानांतरणः70B FP8 ऊपर 4K-प्रोम्प्ट KV  20-80 ms की आवश्यकता है


```figure
prefill-decode-split
```

## इसका उपयोग करें

`code/main.py`模拟 colocated vs disaggregated serving── प्रति अनुरोध व्यय, तथा शीघ्र-लंबाई क्रॉसओवर की रिपोर्ट करना──

## 交付 यह

本课会产出 `outputs/skill-disaggregation-decider.md`                                                                                                                                                                                                                                                              

## अभ्यास

1. 运行 `code/main.py`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️
2. एक P99 पूर्वावलोकन लंबाई 8K  आउटपुट 300 के RAG सेवा  डिजाइन पूर्वावलोकन पूल 和 डिकोड पूल 
3. डायनामो बनाम llm-d:为一家纯 कुबेरनेट्स दुकान 选择一个方案,且没有python运行时间 偏好──
4. 计算 KV हस्तांतरण लागत:70B FP8 上 4K प्रीफिल = ~500 MB KV──在 RDMA 100 GB/s 下, हस्तांतरण = 5 ms──在 TCP 10 GB/s 下 = 50 ms── कौन सा आपके SLA को प्रभावित करेगा?
5. एमओई विशेषज्ञ रूटिंग 会改变KV पहुंच पैटर्न── प्रत्येक टोकन के लिए 激活不同专家的MOE, विघटन 会如何表现?

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Disaggregated serving | “split prefill/decode” | 为每个阶段使用独立 GPU pools |
| NIXL | “NVIDIA transport” | Dynamo 的 inter-node KV transfer（RDMA/TCP） |
| NVIDIA Dynamo | “the orchestrator” | vLLM/SGLang/TRT-LLM 的 stack-above coordinator |
| llm-d | “Kubernetes native” | Red Hat + AWS K8s disaggregated stack |
| Planner Profiler | “Dynamo auto-config” | 测量工作负载，配置 pool ratios |
| SLA Planner | “Dynamo policy” | 自动按速率匹配 prefill:decode 以满足 SLOs |
| `packDomain: rack` | “llm-d topology” | 将 prefill+decode 放在同一 rack 上以实现快速 KV |
| UCCL | “unified collective” | llm-d 0.5 用于 scale-to-zero 的 networking layer |
| MoE expert routing | “expert per token” | DeepSeek-V3 pattern；disaggregation 有帮助 |

## 延伸阅读

- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/)
- [TensorRT-LLM Disaggregated Serving blog](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog5_Disaggregated_Serving_in_TensorRT-LLM.html)
- [llm-d GitHub](https://github.com/llm-d/llm-d)
- [llm-d 0.5 release notes](https://github.com/llm-d/llm-d/releases)
