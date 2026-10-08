# उत्पादन मात्रा  AWQ, GPTQ, GGUF K-क्वांट, FP8, MXFP4/NVFP4

> क्वांटिज़ेशन प्रारूप एक सामान्य विकल्प नहीं है, बल्कि हार्डवेयर, सर्विसिंग इंजन और वर्कलोड के फ़ंक्शन हैं। GGUF Q4_K_M या Q5_K_M 通过 llama.cpp 和 Ollama 交付, कब्जा CPU और किनारे 场景。 GPTQ vLLM में 内部胜出, अनुकूल आप एक ही आधार पर ऊपर चलाने के लिए एक बहु-LoRA की स्थिति में, 适合 आप की जरूरत है। 带 Marlin-AWQ खजाने के AWQ 7B श्रेणी मॉडल पर लगभग 741 टोक / से प्राप्त कर सकते हैं, और INT4 में सबसे अच्छा पास है @ 1, 2026 वर्ष डेटा सेंटर उत्पादन डिफ़ॉल्ट चयन है।  FFP8 में Adaper  कैश और ब्लैकवेल के ऊपर मध्यवर्ती, निकटता और व्यापक समर्थन बनाए रखा गया है।  NVFP4 और MXFP4 ब्लैक माइक्रोसॉफ्टिंग)                                                                                                                                                     

**Type:** 学习
**Languages:** Python（stdlib，用于跨格式的 toy memory 和 throughput 比较）
**Prerequisites:** Phase 10 · 13（Quantization 基础），Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 75 分钟

## 学习目标
- 2026 साल के छह प्रकार के उत्पादन मात्राकरण प्रारूप और उनके सर्वोत्तम उपयुक्त परिदृश्य
-                                                                                                                                                                                                                                                               
- 计算所选格式节省的重量内存,以及未受影响的KV缓存──
- कहा मिलें करें क्वांटिज़्ड मॉडल में डोमेन ट्रैफ़िक ऊपर उग्रता के माप-डेटासेट 🏼

## 问题
क्वांटिज़ेशन मेमोरी और एचबीएम बैंडविड्थ को कम करेगा, और यह ठीक है कोडेशन की आवश्यकता है। एक एफपी 16 70 बी मॉडल में 140 जीबी का वजन है। इसे INT4 में भारित करें।

लेकिन क्वांटिज़ेशन नहीं है निःशुल्क। क्वांटिज़ेशन का प्रभाव गुणवत्ता को कम करता है, खासकर तर्क-भारी 任务 पर। अलग-अलग प्रारूपों को अलग-अलग इंजनों के अनुकूलित किया जाता है। अलग-अलग हार्डवेयर का समर्थन करता है।

## 概念
### छह प्रारूप

| Format | Bits | Sweet spot | Engines |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU、edge、laptops | llama.cpp、Ollama |
| GPTQ | 4-8 | vLLM 上的 Multi-LoRA | vLLM、TGI |
| AWQ | 4 | Datacenter GPU production | vLLM（Marlin-AWQ）、TGI |
| FP8 | 8 | Hopper/Ada/Blackwell datacenter | vLLM、TRT-LLM、SGLang |
| MXFP4 | 4 | Blackwell multi-user | TRT-LLM |
| NVFP4 | 4 | Blackwell multi-user | TRT-LLM |

### GGUF  CPU/edge 默认选择

GGUF एक फ़ाइल प्रारूप है, स्वयं में कोई मात्रात्मक समाधान नहीं है, यह K-क्वांट वैरिएंट्स को रखता है। Q2_K、Q3_K_M、Q4_K_M、Q5_K_M、Q6_K、Q8_0) एक कंटेनर में पैक किया जाता है। Q4_K_M 和 Q5_K_M उत्पादन डिफ़ॉल्ट हैं, 4-5 बिट्स में BF16 質量 के करीब हैं।

vLLM में 惩罚:7B 上约 93 tok/s, इस प्रारूप को GPU कर्नेल 优化── पर तैनाती लक्ष्य CPU/edge 时使用 GGUF──其他情况不要用──

### GPTQ  vLLM 中的 बहु-लोरा

जीपीटीक्यू एक पोस्ट-ट्रेनिंग क्वांटिज़ेशन एल्गोरिथ्म है, जिसमें कैलिब्रेशन पास है।

इसका अनूठा लाभःGPTQ-Int4 vLLM में LoRA एडाप्टरों का समर्थन करता है। यदि आपको एक आधार मॉडल और 10-50 ′′ परिष्कृत संस्करणों का उपयोग करना है, तो प्रत्येक एक LoRA के रूप में,GPTQ यही आपका मार्ग है।

### AWQ  डेटा सेंटर GPU 默认选择

सक्रियण-जागरूक वजन मात्राकरण──量化时保护约1% 最显著的权重──मार्लिन-AWQ नाभिक:相比天真 实现有10.9x गति──7B 上约 741 tok/s,是INT4 स्वरूप中 Pass@1 最好的──

इसके अलावा आपको मल्टी-लोरा (GPTQ) या ब्लैकवेल FP4 (NVFP4) के लिए एक नए GPU की आवश्यकता होगी।

### FP8 可靠的中间地带

8-बिट फ्लोटिंग प्वाइंट──近似无损──支持广泛──Hopper Tensor Cores 原生加速FP8──ब्लैकवेल 继承这一点──当质量不可妥协时(推理、医学、代码-gen),FP8是2026年安全的默认选择──स्मृति बचत INT4 का आधा है, लेकिन质量风险较低──

### MXFP4 / NVFP4  ब्लैकवेल 激进选择

माइक्रोस्केलिंग FP4── प्रत्येक वजन ब्लॉक का अपना स्केल फैक्टर है── उत्तेजना, लेकिन ब्लैकवेल Tensor कोरों में हार्डवेयर त्वरण── FP8 के मुकाबले, प्रत्येक टोकन 字节 की संख्या में आधे की कमी होगी, यह चरण 17 · 07 में आर्थिक लाभ है──

ध्यान देंः
- अभी तक लोरा समर्थन नहीं है।
- तर्क-भारी कार्यभार 上质量下降可见──
- आपके मूल्यांकन सेट पर होना चाहिए 

### माप जाल

AWQ और GPTQ  के लिए एक माप डेटासेट की आवश्यकता होती है, आमतौर पर C4 या WikiText── डोमेन मॉडल के लिए, सामान्य वेब पाठ के साथ माप करना, क्या अधिकारों के लिए गलत निर्णय लेना चाहिए।

修复方式: इन-डोमेन डेटा का उपयोग करें कलेबरेशन करें。 सौ डोमेन नमूने आमतौर पर पर्याप्त हैं。上线前在 eval सेट 上测试。

### KV कैश जाल

AWQ 4 बिट्स तक वजन छोटा करें──KV कैश अलग-अलग है, FP16/FP8 को बनाए रखें── AWQ के 70B मॉडल के लिएः

- वजन: लगभग 35 जीबी (~ 140 जीबी INT4)
- 128 并发 × 2k संदर्भ नीचे केवी कैशः लगभग 20 GB
- सक्रियण: लगभग 5 जीबी
- कुलः लगभग 60 जीबी, हम एच 100 में 80 जीबी रख सकते हैं

मैं मॉडल को 4 जीबी तक मापने लगा हूँ, मैं इसे भूल जाऊँगा, इसके अलावा 30-50 जीबी।

 इसके अलावा, केवी कैश क्वांटिज़ेशन (FP8 KV या INT8 KV) एक और विकल्प है, अपने स्वयं के व्यापारियों के साथ, यह सीधे ध्यान सटीकता को प्रभावित करेगा, मुफ्त नहीं है।

### तर्क के लिए AWQ INT4

विचार श्रृंखला, गणित, दीर्घ संदर्भ कोड-जन, ये कार्य स्पष्ट रूप से उत्तेजित मात्रात्मक प्रभाव से प्रभावित होते हैं।

### 2026 चुनने का मार्गदर्शिका

- सीपीयू/एज सर्विस:GGUF Q4_K_M──完成──
- GPU सेवा  नियमित चैट  बिना LoRA:AWQ
- GPU सेवा  मल्टी-लोरा:带 Marlin के GPTQ
- तर्क कार्यभारःFP8。
- ब्लैकवेल डेटा सेंटर 质量已验证:NVFP4 + FP8 KV
- अस्पष्टः प्रत्येक उम्मीदवार के लिए 1,000-सैम्पल मूल्यांकन


```figure
gpu-memory-breakdown
```

## इसका उपयोग करें
`code/main.py`एक श्रृंखला के लिए मॉडल आकार, गणना छह प्रकार के आकार के स्मृति पदचिह्न (पालन + KV + सक्रियण) और सापेक्ष पारगमन।

## 交付 यह
本课会产出 `outputs/skill-quantization-picker.md`                                                                                                                                                                                                                                                              

## अभ्यास
1. 运行 `code/main.py`◊ 128 और 2k संदर्भ के 70B मॉडल के लिए, प्रत्येक प्रारूप के कुल HBM को गणना करें ◊ कौन सा प्रारूप आपको एक H100 80GB में रखने देता है?
2. आप एक 7B कोडिंग मॉडल है। एक प्रारूप चुनें और व्याख्या करें। यदि आप गुणवत्ता सहिष्णुता के बारे में गलत निर्णय लेते हैं, तो पुनर्प्राप्ति का मार्ग क्या है?
3. 计算为医学领域模型 校准 AWQ 校准 AWQ 校准-数据集 आकार 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校校校
4. 阅读मार्लिन-एडब्ल्यूक्यू कर्नेल पेपर या रिलीज नोट्स──用三句话解释为什么AWQ 7B में 741 टोक/सेक तक पहुंचता है, जबकि कच्चा GPTQ 约为 712──
5. 什么时候把 AWQ वजन FP8 KV कैश 组合,比把 KV 保持在 BF16 अधिक उचित?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GGUF | “llama.cpp format” | 打包 K-quant variants 的文件格式；CPU/edge 默认选择 |
| Q4_K_M | “Q4 K M” | 4-bit K-quant medium；production GGUF 默认选择 |
| GPTQ | “gee pee tee q” | 带 calibration 的 post-train INT4；在 vLLM 中支持 LoRA |
| AWQ | “a w q” | Activation-aware INT4；Marlin kernels；INT4 下最佳 Pass@1 |
| Marlin kernels | “fast INT4 kernels” | Hopper 上用于 INT4 的自定义 CUDA kernels；10x speedup |
| FP8 | “eight-bit float” | Hopper/Ada/Blackwell 上的安全 precision 默认选择 |
| MXFP4 / NVFP4 | “microscaling four” | Blackwell 4-bit FP，带 per-block scale factors |
| Calibration dataset | “cal data” | 用于选择 quantization parameters 的输入文本；必须匹配 domain |
| KV cache quantization | “KV INT8” | 与 weights 分开的选择；影响 Attention accuracy |

## 延伸阅读
- [VRLA Tech — LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/) बेंचमार्क के मुकाबले
- [Jarvis Labs — vLLM Quantization Complete Guide](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks) 按格式列出的 आउटपुट 数字──
- [PremAI — GGUF vs AWQ vs GPTQ vs bitsandbytes 2026](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/) 逐格式选择指南──
- [vLLM docs — Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html) 支持的格式和旗子──
- [AWQ paper (arXiv:2306.00978)](https://arxiv.org/abs/2306.00978) मूल AWQ सूत्र──
- [GPTQ paper (arXiv:2210.17323)](https://arxiv.org/abs/2210.17323) 原始 GPTQ सूत्र
