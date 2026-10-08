# ब्लैकवेल में FP8 और NVFP4 का उपयोग करें

> TensorRT-LLM केवल NVIDIA तक सीमित है, लेकिन यह ब्लैकवेल पर है                                                                                                                                                                                                                                                    $0.012，而 H100 + vLLM 为 $0.09/M, 7x का आर्थिक अंतर बनाता है। यह स्टैक तीन प्रकार के फव पॉइंट सटीकता प्रणाली के ओवरले हैःFP8 के लिए KV कैश और ध्यान कर्नेल  अभी भी महत्वपूर्ण है, क्योंकि इसमें उनकी आवश्यकता की गतिशील सीमा है।NVFP4  4-बिट माइक्रोस्केलिंग) प्रसंस्करण भार और सक्रियण मूल्य; मल्टी-टोकन भविष्यवाणी (MTP) और विघटित प्रीफिल / डिकोड  इस पर 2-3x  दिन 0                                                                                                                                                                                                                                                                                                                                                                                                         

**Type:** 学习
**Languages:** Python (stdlib，玩具级 FP8/NVFP4 内存与成本计算器)
**前置要求：**चरण 17 · 04 (vLLM सर्विंग इंटर्न), चरण 10 · 13 (क्वांटिकेशन)
**Time:** ~75 分钟

## 学习目标

- 解释为什么即便权重使用 NVFP4,FP8 के लिए KV कैश 和 Attention 仍然关键──
- 计算 सीमा मॉडल BF16、FP8 तथा NVFP4 के नीचे HBM पदचिह्न में,并推理节省来自哪里──
- TRT-LLM का उपयोग करने वाले ब्लैकवेल की विशेष विशेषताएं बताएं ((दिन-0 FP4、MTP、विखंडित सेवाएँ、सबसे-सबसे आदिम)
- 判断什么时候 TRT-LLM का NVIDIA-लॉक 值得使用 换对 Hopper 上 vLLM का 7x 成本差距──

## 问题

2026 साल का अनुमान आर्थिक अग्रिम प्रश्न है प्रति डॉलर कितना उत्पन्न कर सकता है टोकन── उत्तर निर्भर करता है चार स्तरीय विकल्पः硬件代际(Hopper H100/H200 बनाम ब्लैकवेल B200/GB200) 精度(BF16 → FP8 → NVFP4) ]] सेवा इंजन(vLLM बनाम SGLang बनाम TRT-LLM) और编排方式(सादा बनाम विखंडित बनाम डायनामो) ]]

हॉपर + वीएलएलएम ऊपर में, 120B MoE का परिचालन लागत प्रति मिलियन टोकन ~$0.09。在 Blackwell + TRT-LLM + Dynamo 上，同一个模型的运行成本约为 ~$0.012,便宜 7x── इनमें से एक हिस्सा हार्डवेयर से आया है(ब्लैकवेल का एकल GPU LLM 吞吐相对Hopper 高 11-15x)── दूसरा हिस्सा स्टैक से आया हैःFP4 权重、MTP ड्राफ्ट、विघटित प्रीफिल/डेकोड, तथा एमओई विशेषज्ञ संचार के लिए उपयोग किए जाने वाले NVLink 5 सर्व-सर्व-

आप NVIDIA स्टैक के बाहर इस बात को नहीं देख सकते हैं। यह इस तरह की एक चीज है।

## 概念

### क्यों FP8 अभी भी KV कैश के नीचे लाइन है

2026 के एक आम गलती यह है कि NVFP4 को सभी स्थानों पर लागू किया जा सकता है। तथ्य यह नहीं है कि KV कैश को FP8 के लिए आवश्यक है।

NVFP4 ((2025-2026) भार और सक्रिय मूल्य के लिए उपयुक्त है। माइक्रोस्केलिंगः प्रत्येक भार ब्लॉक का अपना पैमाने कारक होता है, इसलिए छोटा ब्लॉक विभिन्न गतिशीलता दायरे को कवर कर सकता है, और प्रति-टेंसर पैमाने का नुकसान नहीं होगा।

典型 ब्लैकवेल 配置:

- 权重:NVFP4(4-बिट माइक्रोस्केलिंग)
- 激活值:NVFP4──
- केवी कैशःFP8。
- ध्यान संचयक:FP32(softmax 稳定性)

### TRT-LLM का उपयोग ब्लैकवेल विशेष रूप से आदिम

- **Day-0 FP4 weights**: मॉडल प्रदान करने के लिए सीधे FP4 权重;TRT-LLM 无需后培训转换即可加载──FP4 不需要 AWQ / GPTQ 步骤──
- **Multi-token prediction (MTP)**: EAGLE के साथ (Phase 17 · 05) विचार समान है, लेकिन TRT-LLM निर्माण में एकीकृत है
- **Disaggregated serving**:prefill 和 decode 位于独立GPU pools,KV cache 通过 NVLink या InfiniBand 传输──与Dynamo(Phase 17 · 20)
- **All-to-all communication primitives**:NVLink 5 ने MoE विशेषज्ञ संचार विलंबता को Hopper की तुलना में 3x ¥ कम किया।
- **NVFP4 + MXFP8 microscaling**: ब्लैकवेल Tensor कोर ऊपर के हार्डवेयर त्वरण पैमाने-कारक 处理

### आप याद रखना चाहिए कि संख्या

- HGX B200 TRT-LLM के माध्यम से GPT-OSS-120B पर $0.02/M टोकन तक पहुंच गया
- GB200 NVL72 通过 डायनामो (Dynamo) 编排 TRT-LLM) $0.012/M टोकन को प्राप्त करता है
- H100 + vLLM 在可比工作负载上约为0.09 $ /M टोकन──
- TRT-LLM 更新三月带来 2.8x 吞吐增益(2026) 👇
- ब्लैकवेल तुलना में हॉपर के एकल GPU LLM 吞吐为11-15x
- MLPerf इन्फरेंस v6.0(2026 साल 4 月):ब्लैकवेल 主导每个提交任务──

### FP4 में गुणवत्ता पर वास्तविक कीमत

NVFP4  बहुत सक्रिय है। तर्क-भारी कार्यभार में,FP4 权重会明显退化 (विचार-श्रृंखला, गणित,长上下文 कोड-gen) पर,FP4 权重会明显退化―― प्रति ब्लॉक मापन को कम किया जा सकता है, लेकिन समाप्त नहीं किया जा सकता है। तर्क मॉडल जारी करने के लिए टीम आमतौर पर FP8 权重 + FP4  सक्रिय मूल्य का उपयोग करते हैं।

नियमः NVFP4 权重前,始终在您的评估 सेट上验证任务质量.

### यह एक NVIDIA-लॉक क्यों है  निर्णय

TRT-LLM C++ + CUDA + बंद-स्रोत के कर्नेल हैं। मॉडल को विशिष्ट GPU SKU 编译──不支持 AMD,不支持 Intel,不支持 ARM── यदि आपकी अंतर्नीति बहु-विक्रेता है, तो TRT-LLM TRT-LLM-सेवा स्तर के लिए असंभव है; आप अभी भी मिश्रित हार्डवेयर पर vLLM सेवा पर उपयोग कर सकते हैं── यदि यह केवल NVIDIA है, तो 7x 差距足以认为锁 付费──

### 2026 साल का प्रयोग

⇒ प्रति वर्ष $100M+ के लिए, Hopper + vLLM 会留下 7-10x के अनुकूलन अंतरिक्ष──把成本主导型工作负载 迁移到布莱克威尔 + TRT-LLM + डायनामो──把实验层保留在H100 + vLLM上,以获得模型代速度──每一个NVFP4 परिवर्तित मॉडल上生产前都必须验证质量──

### विघटन बोनस

TRT-LLM की विघटित सेवा (分离的预填和解码池) चरण 17 में होगी · 20 में गहराई में चर्चा.


```figure
pipeline-parallel
```

## इसका उपयोग करें

`code/main.py`会为三种堆 计算模型的HBM足迹、解码吞吐量(स्मृति-सी bound regime) और $/M-token:H100 + BF16 + vLLM、H100 + FP8 + vLLM、B200 + NVFP4/FP8 + TRT-LLM──运行它,观察复合效应,以及每个变化贡献了差距中的哪一部分──

## 交付 यह

本课会生成 `outputs/skill-trtllm-blackwell-advisor.md` दिया गया कार्यभार √ मॉडल आकार और वार्षिक टोकन मात्रा, यह Blackwell + TRT-LLM स्टैक का न्याय करेगा कि क्या NVIDIA-लॉक के लायक है √

## अभ्यास

1. 运行 `code/main.py`◊ एक सक्रिय पैरामीटर के लिए 30% के 120B MoE, गणना H100 BF16、H100 FP8 और B200 NVFP4/FP8 ऊपर मेमोरी-बैंडविड्थ-सीमित डिकोड throughput── अधिकतम उछाल कहां से आया है?
2. 某客户每年在H100 + vLLM上花费2M$──考虑7x 经济差距, उन्हें 12 个月内摊销迁移到TRT-LLM的成本 में कितना ब्लैकवेल GPUs खरीदने की आवश्यकता है?
3. NVFP4 权重转换后,你在 MATH上看到准确率下降 3个点──说出两条恢复路径:一条质量第一(保留 FP8 权重),一条成本第一(使用域内数据做校准)
4. 阅读MLPerf v6.0 निष्कर्ष परिणामों── Blackwell-over-Hopper के किस मिशन 差距 न्यूनतम, क्यों?
5. 计算 405B 模型在 NVFP4 权重 + FP8 KV कैश、128k संदर्भ 下所需的HBM──它能装进单个GB200 NVL72 节点吗?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| FP8 | "eight-bit float" | 8-bit floating point；由于动态范围，用于 KV cache 和 Attention |
| NVFP4 | "four-bit micro" | NVIDIA 的 4-bit microscaling FP format；用于 Blackwell 上的权重和激活值 |
| MXFP8 | "MX eight" | Microscaling FP8 variant；在 Blackwell Tensor Cores 上硬件加速 |
| Day-0 FP4 | "ship FP4 weights" | 模型提供方发布已经是 FP4 的权重；无需 post-train conversion 步骤 |
| MTP | "multi-token prediction" | TRT-LLM 集成的 speculative-decoding draft（Phase 17 · 05） |
| Disaggregated serving | "split prefill/decode" | Prefill 和 decode 位于独立 GPU pools；KV 通过 NVLink/IB 传输 |
| All-to-all | "MoE expert comm" | 将 Token 路由到 expert GPUs 的通信模式；NVLink 5 降低 3x |
| InferenceX | "SemiAnalysis inference bench" | 2026 年行业接受的 cost-per-token benchmark |

## 延伸阅读

- [NVIDIA — Blackwell Ultra MLPerf Inference v6.0](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/) 2026 साल 4 月 MLPerf 结果──
- [NVIDIA — Blackwell 上的 MoE Inference](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/) एनवीलिंक 5 सर्व-सर्व के साथ एमओई कर्नल्स
- [TensorRT-LLM Overview](https://nvidia.github.io/TensorRT-LLM/overview.html) 官方 engine 文档──
- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/) TRT-LLM 之上的 विघटित संग्राहलय──
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/)  ब्लैकवेल अंक के बेंचमार्क सूट जारी करें
