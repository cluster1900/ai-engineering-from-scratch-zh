# स्व-होस्टिंग सेवा 选择  llama.cpp, Ollama, TGI, vLLM, SGLang

> 2026 साल, चार इंजनों द्वारा संचालित स्वयं-निष्पादित निष्कर्षों को हार्डवेयर, आकार और पारिस्थितिकी तंत्र के आधार पर चुना जाएगा।**llama.cpp**                                                                                                                                                                                                                                                              **Ollama**️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️**TGI 于 2025 年 12 月 11 日进入维护模式** केवल बग फिक्स किए जाते हैं, कच्चे उत्पादन vLLM से लगभग 10% धीमा होता है, लेकिन अतीत में अवलोकन और HF पारिस्थितिकी तंत्र के एकीकरण के मामले में आमतौर पर शीर्ष स्तर पर होता है।**vLLM** v0.15.1(2026 साल 2 月) नई वृद्धि PyTorch 2.10、RTX ब्लैकवेल SM120、H200 अनुकूलन──**SGLang**                                                                                                                                                                                                                                                              

**Type:** Learn
**Languages:** Python (stdlib, engine-decision tree walker)
**Prerequisites:** 覆盖 engines 的所有 Phase 17 课程（04、06、07、09、18）
**Time:** ~45 分钟

## 学习目标
- ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎
- बता दें 2026 साल की TGI 维护模式状态(2025 साल 12 月 11 日), तथा यह क्यों नए प्रोजेक्ट को VLLM या SGLang की ओर रुख करेगा?
- 描述全程使用相同 GGUF या HF वजन का विकास/चरण/उत्पादन पाइपलाइन。
-  स्पष्टीकरण क्यों  केवल CPU 会强制使用 llama.cpp, जबकि AMD 会排除 TRT-LLM

## 问题
आपके दल ने एक नई स्व-निर्मित LLM परियोजना शुरू की है। एक इंजीनियर ने कहा कि ओल्मा, दूसरा ने कहा कि वीएलएलएम, तीसरा ने कहा कि क्या टीजीआई एक खुली बक्से में नहीं है?

2026 में, पेड़ चुनना महत्वपूर्ण हैः पहले हार्डवेयर देखें, बाद में आकार देखें, बाद में कार्यभार देखें।

## 概念
### 五个引擎

| Engine | Best for | Notes |
|--------|----------|-------|
| **llama.cpp** | CPU / edge / minimal deps / 最广 model 支持 | CPU 上最快，完全控制 |
| **Ollama** | Dev laptops、单用户、一条命令安装 | 比 llama.cpp 慢 15-30%；生产 throughput 差距 3x |
| **TGI** | HF ecosystem、regulated industries | **2025 年 12 月 11 日维护模式** |
| **vLLM** | 通用生产、100+ 用户 | 广泛的生产默认选择；v0.15.1 2026 年 2 月 |
| **SGLang** | Agentic 多轮、prefix-heavy workloads | 生产中有 400,000+ GPUs |

### 硬件 प्राथमिकता निर्णय

**仅 CPU**→ llama.cpp──Ollama भी उपयोग कर सकता है, लेकिन धीमा── कोई अन्य इंजन CPU पर प्रतिस्पर्धा नहीं कर सकता──

**AMD GPU**→ vLLM(AMD ROCm 支持)。SGLang 也能用──TRT-LLM 被 NVIDIA 锁定,所以排除──

**NVIDIA Hopper (H100 / H200)**→ vLLM अथवा SGLang अथवा TRT-LLM──三者都是顶级──

**NVIDIA Blackwell (B200 / GB200)**→ TRT-LLM                                                                                                                                                                                                                                                            

**Apple Silicon (M-series)**→ llama.cpp(Metal)  Ollama इसके लिए एक封装 करवाया गया

### 规模其次决策

**1 个用户 / local dev**→ Ollama。一条命令,数秒内 प्रथम-टोकन。

**10-100 个用户 / 小团队**→ vLLM एकल-GPU──

**100-10k 个用户 / production**→ vLLM उत्पादन-स्टैक ((चरण 17 · 18) या SGLang。

**10k+ 个用户 / enterprise**→ vLLM उत्पादन-स्टैक + विघटित(चरण 17 · 17)+ LMCache(चरण 17 · 18)。

### कार्यभार तिसरा निर्णय

**General chat / Q&A**→ vLLM 在广泛默认场景中胜出──

**Agentic multi-turn（tools、planning、memory）**→ SGLang का RadixAttention(चरण 17 · 06)

**带有大量 prefix reuse 的 RAG**→ SGLang。

**Code generation**→ vLLM 可以;SGLang 在缓存上略好。

**Long context (128K+)**→ vLLM + टुकड़ा टुकड़ा प्रीफिल;SGLang + स्तरित KV。

### TGI 维护陷

Hugging Face TGI 于 2025 年 12 月 11 日进入维护模式  之后只做bug fixes──过去:顶级观察性、同类最佳 HF 生态系统集成(模型卡、安全工具),原产量 略落后于 vLLM──

2026 के लिए नई परियोजनाओं के लिएः TGI को सुरक्षित रूप से टालना। मौजूदा TGI तैनाती जारी रखी जा सकती है, लेकिन अंततः इसे स्थानांतरित किया जाना चाहिए।

### पाइपलाइन 模式

Dev(Ollama)→ मंचन(llama.cpp)→ prod(vLLM)。全程使用相同的GGUF或HF वजन──工程师在笔记本上快速代; मंचन 镜像生产量化;prod 是服务 目标──

### Ollama ध्यान

ओल्मा  बहुत अनुकूल dev── यह साझा उत्पादन के लिए उपयुक्त नहीं हैःGo HTTP serialization 会增加开销,VLLM से अधिक सरल,OpenTelemetry 支持滞后──把 Ollama उपयोग में अच्छी तरह से यह  एक उपयोगकर्ता、 एक आदेश  फिर साझा करने के लिए परिदृश्य में चेंज vLLM──

### स्वयं प्रबंधन बनाम प्रबंधित एक और निर्णय है

चरण 17 · 01(प्रबंधित हाइपरस्केलर्स) 、· 02(इन्फरेंस प्लेटफॉर्म) 覆盖 managed──本课假设你已经决定自托管──自托管的理由: डेटा निवास、 कस्टम फाइन-ट्यूनिंग、规模化后的总成本所有、托管服务上不可用域名模型──

### आप याद रखना चाहिए कि संख्या

- TGI 维护模式:2025 साल 12 月 11 日。
- vLLM v0.15.1:2026 साल 2 月;PyTorch 2.10;Blackwell SM120 支持──
- SGLang 生产足迹: 400,000+ जीपीयू
- ओल्मा आउटपुट 相对 llama.cpp का अंतर: धीमा 15-30%; उत्पादन लोड डाउन 3x。


```figure
data-parallel
```

## इसका उपयोग करें
`code/main.py`एक निर्णय-वृक्ष पैदल यात्री: given determined hardware + scale + workload, choose a engine并解释原因──

## 交付 यह
本课产 出 `outputs/skill-engine-picker.md`                                                                                                                                                                                                                                                              

## अभ्यास
1. अपने हार्डवेयर / पैमाने / कार्यभार के साथ 运行 `code/main.py` क्या यह आपके इंद्रिये के अनुरूप है?
2. आपका इन्फ्रारेड 12 张 H100 और 8 张 MI300X AMD है। किस इंजन के साथ?
3. एक टीम 2026 में टीजीआई का उपयोग करने की सोच रही है, क्योंकि यह हमारी परिचित बात है।
4. ओल्मा डेव तक vLLM prod: क्वांटिज़ेशन, कॉन्फ़िगरेशन और ऑब्जर्वेबिलिटी
5. RAG उत्पाद के P99 पूर्वावलोकन लंबाई 8K है, तथा किराए पर लेने में पुनः उपयोग दर बहुत उच्च है।

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| llama.cpp | “CPU 那个” | 最广 model 支持，CPU 上最快 |
| Ollama | “笔记本那个” | 一条命令安装，dev-grade throughput |
| TGI | “HF 的 serving” | 自 2025 年 12 月起维护模式 |
| vLLM | “默认选择” | 2026 年广泛生产 baseline |
| SGLang | “agentic 那个” | Prefix-heavy，RadixAttention |
| TRT-LLM | “NVIDIA 锁定” | Blackwell throughput 领先者，仅 NVIDIA |
| GGUF | “llama.cpp 格式” | Bundled K-quant variants |
| Production-stack | “vLLM K8s” | Phase 17 · 18 reference deployment |
| Pipeline pattern | “dev→stage→prod” | 同一 weights 上的 Ollama → llama.cpp → vLLM |

## 延伸阅读
- [AI Made Tools — vLLM vs Ollama vs llama.cpp vs TGI 2026](https://www.aimadetools.com/blog/vllm-vs-ollama-vs-llamacpp-vs-tgi/)
- [Morph — llama.cpp vs Ollama 2026](https://www.morphllm.com/comparisons/llama-cpp-vs-ollama)
- [n1n.ai — Comprehensive LLM Inference Engine Comparison](https://explore.n1n.ai/blog/llm-inference-engine-comparison-vllm-tgi-tensorrt-sglang-2026-03-13)
- [PremAI — 10 Best vLLM Alternatives 2026](https://blog.premai.io/10-best-vllm-alternatives-for-llm-inference-in-production-2026/)
- [TGI maintenance announcement](https://github.com/huggingface/text-generation-inference) रिलीज़ नोट्स。
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
