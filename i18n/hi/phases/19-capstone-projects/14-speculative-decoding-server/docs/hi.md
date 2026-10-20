# 综合项目 14  अनुमानात्मक-डिकोडिंग 推理服务器

> vLLM 0.7 में EAGLE-3 ने वास्तविक प्रवाह पर 2.5-3x 吞吐量 लाया। P-EAGLE (AWS 2026) ने समानांतर अटकलें आगे बढ़ाई। SGLang के SpecForge ने बड़े पैमाने पर ड्राफ्ट हेड को प्रशिक्षित किया। Red Hat के स्पेक्लर्स हब ने एक संरेखित ड्राफ्ट जारी किया।

**Type:** Capstone
**Languages:** Python (serving), C++ / CUDA (kernel inspection), YAML (configs)
**Prerequisites:** Phase 3 (Deep Learning), Phase 7 (Transformers), Phase 10 (LLMs from scratch), Phase 17 (infrastructure)
**Phases exercised:**P3 · P7 · P10 · P17
**Time:** 30 小时

## 问题
अनुमानित डिकोडिंग 2026 में वस्तु बन गई है। EAGLE-3 ड्राफ्ट हेड  लक्ष्य मॉडल के आधार पर छिपे हुए राज्य  प्रशिक्षण,并预测未来 N 个 टोकन; लक्ष्य मॉडल में एक ही बार पास में सत्यापन किया जाता है। 60-80% की स्वीकृति दर 2-3x के अंत से अंत तक吞吐量 में परिवर्तित हो जाती है। vLLM 0.7 मूलतः इस क्षमता में एकीकृत हो जाती है। SGLang + SpecForge  प्रशिक्षण पाइपलाइन प्रदान करती है।

关键技术不是模型,而是在服务运营中. 接受率会随流量分布漂移(ShareGPT vs code vs domain data) 发生拒绝 时的尾延迟比不使用推测更差,因此你必须报告多个批量大小下的 p99,而不能只报告稳定状态代币/秒──对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对抗对

## 概念
अनुमानित डिकोडिंग दो स्तरों है**draft**मॉडल ((एजीएल-3 हेड, ग्रॅम, या इससे भी छोटा लक्ष्य-अनुसूचित मॉडल)**target**मॉडल में एक बार पास 中验证全部 k 个 टोकन; किसी भी स्वीकृत के पूर्वावलोकन शहर बदल जाएगा लोभी पथ── स्वीकृति दर ड्राफ्ट-लक्ष्य संरेखण एवं输入 वितरण पर निर्भर करती है──

ईगल-3 अधिकांश प्रवाह पर एनजीआरएम ड्राफ्ट से बेहतर है। पी-ईगल अधिक गहराई से ड्राफ्ट ट्री के लिए  चलाना समानांतर अटकलें 取舍是: अस्वीकार के समय पी 99 विलंबता अधिक उच्च, क्योंकि सत्यापित पास अधिक बड़ा ◊ सेवा विन्यास 必须报告按批量大小桶 划分的延迟, ताकि यह पता लगाया जा सके।

तैनाती उपयोग Kubernetes──vLLM 0.7 प्रत्येक GPU या टेंसर-समान शेड 运行一个复制──HPA 基于队等而不是CPU自动扩缩容量──FP8 (Marlin) 和 INT4 (AWQ) 量 会让 GPU 内存 保持在H100 / H200 के दायरे में──端到端报告包括吞吐量、接受率、批量 1/8/32 下的 p50/p99,以及 $/1M टोकन──

## 架构
```
request ingress
    |
    v
vLLM server (0.7) or SGLang (0.4)
    |
    +-- draft: EAGLE-3 heads | P-EAGLE parallel | ngram fallback
    +-- target: Llama 3.3 70B | Qwen3-Coder-30B | GPT-OSS-120B
    |     quantized FP8-Marlin or INT4-AWQ
    |
    v
verify pass: batch k draft tokens through target
    |
    v (accept prefix; resample for rejected suffix)
    v
token stream back to client
    |
    v
Prometheus metrics: throughput, acceptance rate, queue wait, latency p50/p99
    |
    v
HPA on queue-wait metric
```

## 技术
- सेवाः vLLM 0.7 या SGLang 0.4
- अनुमानित पद्धतिः ईगल-3 ड्राफ्ट हेड
- प्रशिक्षण के मसौदेः स्पेकफोरज (एसजीएलएंग) या रेड हैट स्पेक्युलेटर
- लक्ष्य मॉडलः Llama 3.3 70B、Qwen3-Coder-30B MoE、GPT-OSS-120B
- मात्राः एफपी8 (मार्लिन) ∞INT4 AWQ
- तैनातीः Kubernetes + NVIDIA डिवाइस प्लगइन; लाइन-उत्तरांकन के आधार पर HPA
- Eval: ShareGPT、MT-Bench-v2、GSM8K、HumanEval, जो कि विभिन्न डोमेन के बीच वितरण की स्वीकार्यता दर को मापने के लिए प्रयोग किया जाता है
- संदर्भः TensorRT-LLM अनुमानात्मक डिकोडिंग, विक्रेता आधार के रूप में


```figure
cf-spec-decode
```

##  इसे निर्माण
1. **Target model prep.**选择 Llama 3.3 70B──मार्लिन के माध्यम से FP8──在 1xH100(या 2x टेन्सर-समान) पर vLLM 0.7 部署──

2. **Draft source.**Red Hat Speculators से 拉取 aligned EAGLE-3 ड्राफ्ट हेड(或通过 SpecForge 训练一个) ⋅ लोड करने के लिए vLLM के अटकल-डिकोडिंग विन्यास 中──

3. **Baseline numbers.**之前:batch 1/8/32 下的代币/s、p50/p99 विलंबता、GPU उपयोग──发布结果──

4. **Enable EAGLE-3.**切换配置; पुनः运行同一基准―― रिपोर्ट गति अप、接受率、p99 पूंछ-लैटेंसी डेल्टा──

5. **P-EAGLE.** समानांतर अटकलें लगाने में सक्षम होना; सीरियल ईगल-3 के साथ अंतर को गहराई से मापना; रिपोर्ट पी-ईगल से मददगार को हानिकारक मोड़ में परिवर्तित करना।

6. **Domain traffic.**साझा करनाGPT、HumanEval 和 डोमेन-विशिष्ट ट्रैफ़िक 通过同一服务器 运行──按分布测量接受率──识别草案 发生漂移的条件──

7. **Second target model.**Qwen3-Coder-30B MoE 上运行同一管道──草案更棘手(MoE रूटिंग शोर)── रिपोर्ट परिणाम──

8. **K8s HPA.**K8s में नीचे विभाग, HPA के साथ पालन करने के लिए नहीं`queue_wait_ms` दिखाओ भार परिवर्तन के तीन गुना समय के पैमाने पर 

9. **Cost comparison.**उसी मूल्यांकन में $/1M टोकन,并与人类 क्लाउड सोनट 4.7 和 OpenAI GPT-5.4 तुलना

## इसका उपयोग करें
```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7, Llama 3.3 70B FP8, EAGLE-3 active
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms (620 tokens)
[cost]      $0.34 per 1M output tokens at sustained throughput
```

## 交付 यह
`outputs/skill-inference-server.md` विवरण वितरणयोग्य── एक परीक्षण मात्रा  के साथ अनुमानित डिकोडिंग का सेवा स्टैक, एक पूर्ण बेंचमार्क रिपोर्ट, तथा एक K8s तैनाती──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 相对 baseline 的实测 speedup | 在两个 model 上以匹配质量达到 2.5x+ throughput |
| 20 | 真实流量上的接受率 | 按分布划分的 acceptance-rate report |
| 20 | P99 tail-latency 纪律 | 使用和不使用 speculation 时，batch 1/8/32 下的 p99 |
| 20 | Ops | K8s deploy、基于 queue-wait 的 HPA、rollout smooth |
| 15 | Write-up 和 methodology | 清晰说明改变了什么以及为什么 |
| **100** | | |

## अभ्यास
1. जब मसौदा लक्ष्य से 落后一个版本时 (उदाहरण के लिए Llama 3.3 -> 3.4 बहाव), स्वीकार्यता दर गिरावट को मापें।

2. नग्राम-फॉल-बैक को प्राप्त करना: यदि ईएजीएलई-3 स्वीकार दर किसी सीमा से कम है, तो इसे एनग्राम ड्राफ्ट में स्विच करना चाहिए।

3. 运行一个受控MoE प्रयोग:同一个Qwen3-Coder-30B,在注入路由噪音与不注入路由噪音 两种情况对比──测量草案接受敏感性──

4.  विस्तार H200 (141 GB) ⋅ प्रति प्रतिलिपि ⋅ प्राप्त मॉडल आकार के हेडरूम, तथा क्या यह एक अघोषित Llama 3.3 70B ⋅ सेवा कर सकता है

5. उसी एच 100 हार्डवेयर में ऊपर बेंचमार्क TensorRT-LLM अनुमानात्मक डिकोडिंग── रिपोर्ट इसे vLLM 胜出场景──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Draft model | "Speculator" | 为 target 提出 N 个 Token 以供验证的小 model |
| EAGLE-3 | "2026 draft architecture" | 基于 target hidden state 训练的 draft head；约 75% 接受率 |
| P-EAGLE | "Parallel speculation" | 在一个 target pass 中验证的 draft branch tree |
| Acceptance rate | "Hit rate" | 无需 resampling 即被接受的 drafted Token 比例 |
| Quantization | "FP8 / INT4" | 更低精度的 weights，用于在 GPU memory 中容纳更多 model |
| Queue wait | "HPA metric" | request 在 inference 开始前于 pending queue 中等待的时间 |
| Speculators hub | "Aligned drafts" | Red Hat Neural Magic 为常见 open model 提供的 EAGLE draft hub |

## 延伸阅读
- [vLLM EAGLE and P-EAGLE documentation](https://docs.vllm.ai) संदर्भ सेवा स्टैक
- [P-EAGLE (AWS 2026)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/) समानांतर अनुमानात्मक डिकोडिंग पेपर + एकीकरण
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) ड्राफ्ट हेड प्रशिक्षण पाइपलाइन
- [Red Hat Speculators](https://github.com/neuralmagic/speculators) संरेखित ड्राफ्ट हब
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/) विक्रेता विकल्प
- [Fireworks.ai serving architecture](https://fireworks.ai/blog) वाणिज्यिक संदर्भ
- [EAGLE-3 paper (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) विधि पत्र
- [vLLM repository](https://github.com/vllm-project/vllm) कोड और बेंचमार्क
