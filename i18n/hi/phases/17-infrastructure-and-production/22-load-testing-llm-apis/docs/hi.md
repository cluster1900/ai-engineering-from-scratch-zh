# लोड टेस्टिंग LLM APIs  क्यों k6 और लोमड़ी 会 झूठ

> 传统 लोडटेस्टर स्ट्रीमिंग प्रतिक्रियाओं के लिए नहीं हैं 可变输出长度、Token 级 मेट्रिक्स या GPU 和而设计的── अधिकांश टीमों को दो फंदे में काट दिया जाएगा  GIL 陷:Locust के टोकन 级 माप Python GIL में नीचे चलना टोकनकरण, 竞争; टोकनकरण बैकलॉग 竞争; 竞争; टोकनकरण बैकलॉग 高并发时会与请求生成 竞争; 竞争; टोकनकरण बैकलॉग 随后会升高报告的间 टोकन विलंबता  瓶在您的客户端,而不是服务器──快速- एकरूपता 陷:循环中的相同提示只测试 टोकन वितरण上一个点; वास्तविक प्रवाह में भिन्नता है लंबाई और कई प्रकार के मैचों के साथ LLMPerf`--mean-input-tokens`+ `--stddev-input-tokens`修复这一点──2026年工具映射:LLM 专用工具(GenAI-Perf、LLMPerf、LLM-Locust、guidellm) को टोकन 级准确性 के लिए उपयोग किया जाता है;**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）** स्ट्रीमिंग-जागरूक、Kubernetes-नेटिव, टेस्ट रन/प्राईवेटलोडज़ोन सीआरडी के माध्यम से किया गया वितरण 测试, सबसे उपयुक्त CI/CD गेट;Vegeta उपयोग के लिए Go निरंतर दर संतृप्ति;Locust 2.43.3  केवल संगत LLM-Locust विस्तार 才适用于 स्ट्रीमिंग──负载模式:steady-state、ramp、spike(autoscaling test)、soak(memory leaks)。

**Type:** Build
**Languages:** Python (stdlib, toy realistic-prompt generator + latency collector)
**前置要求：**चरण 17 · 08 (उपयोग मेट्रिक्स), चरण 17 · 03 (जीपीयू ऑटोस्केलिंग)
**Time:** ~75 minutes

## 学习目标
- 解释让通用负载测试器在LLM API上说谎的两个反模式(GIL 陷、即时-均性陷) 
- 针对给定目的选择工具:LLMPerf(बेंचमार्क रन) 、k6 + स्ट्रीमिंग एक्सटेंशन(CI गेट) 、गइडेलम(महान पैमाने पर सिंथेटिक) 、GenAI-Perf(NVIDIA संदर्भ) ‖
- 设计四种负载模式(स्थिर、रंप、स्पिक、डुबकी),并说出每种模式捕捉的失败模式──
- उपयोग इनपुट टोकन का औसत + stddev 构建真实的 शीघ्र वितरण, बजाय निश्चित लंबाई में

## 问题
आपने k6 测试 LLM endpoint, सेट 500  concurrent users को सेट किया  यह बस गया  आप ऑनलाइन हैं  उत्पादन वातावरण में केवल 200 实际用户 थे  सेवा तो टूट गई  P99 TTFT  विस्फोट, GPUs  भरा हुआ 

 दो चीजें हुईं── प्रथम, k6  500  समान संकेत भेजे  आपका अनुरोध-कॉलेज़िंग और पूर्वावलोकन कैशिंग  यह दिखने दें कि यह 500  समवर्ती डिकोड को संसाधित कर रहा है, लेकिन वास्तव में केवल एक को संसाधित कर रहा है── द्वितीय, k6  स्ट्रीमिंग प्रतिक्रियाओं को मानव अनुभव के तरीके से ट्रैक नहीं करेगा; यह एक HTTP कनेक्शन है, न कि 500  अलग-अलग अंतराल तक पहुंचने वाले टोकन 

LLM के लोड टेस्ट एक स्वतंत्र शैक्षिक प्रश्न है।

## 概念
### GIL 陷(लोकोस्ट)

Locust Python का उपयोग करता है, और क्लाइंट-साइड 于 GIL 下运行 टोकनाइजेशन──高并发时,Tokenizer 会排在请求生成 后面── रिपोर्ट के अंतर-टोकेन विलंबता 包含 क्लाइंट-साइड टोकनाइजेशन बैकलॉग──你以为服务器 慢;其实是测试慢──

修复:LLM-Locust विस्तार टोकनाइज़ेशन को 独立进程 में स्थानांतरित करेगा, या कॉम्पिलिड-भाषा हर्नस का उपयोग करेगा

### शीघ्र-समरूपता 陷

सभी ज्ञात लोड टेस्टर्स आपको एक प्रॉम्प्ट कॉन्फ़िगर करने की अनुमति देते हैं। 10,000 बार के चक्र परीक्षण में, प्रत्येक बार एक ही प्रॉम्प्ट भेजा जाता है। सर्वर हर बार एक ही पूर्वावलोकन देखता है।

修复: शीघ्र वितरण से 中采样──LLMPerf 使用 `--mean-input-tokens 500 --stddev-input-tokens 150` 长度多样,内容多样,

### चार प्रकार के भार

1. **Steady-state** 以 स्थिर आरपीएस 运行 30-60 分钟──捕捉: बेसलाइन प्रदर्शन प्रतिगमन──
2. **Ramp** 15 मिनट के भीतर आरपीएस को 0 से 线性 तक बढ़ाकर लक्ष्य मूल्य तक बढ़ाया जाएगा।
3. **Spike** अचानक बढ़कर 3-10x RPS, 2 मिनट बाद पुनः प्राप्ति।
4. **Soak** स्थिर स्थिति 运行 4-8 小时――捕捉:मेमोरी लीक

### 2026 工具映射

**LLMPerf**(Anyscale)  पायथन, लेकिन टोकनकरण द्वारा रुस्ट 支持──Mean/stddev प्रॉम्प्ट्स──Streaming-aware──性能运行的最佳默认选择──

**NVIDIA GenAI-Perf** NVIDIA का संदर्भ── उपयोग Triton क्लाइंट;मेट्रिक 覆盖全面── ध्यान दें इसका ITL TTFT नहीं शामिल;LLMPerf का समावेश── एक ही सर्वर 上两工具会产生不同的 TPOT──

**LLM-Locust**(TrueFoundry) 修复 GIL 陷的 टिड्डी विस्तार──熟悉的 टिड्डी डीएसएल + स्ट्रीमिंग मेट्रिक्स──

**guidellm** बड़े पैमाने पर सिंथेटिक बेंचमार्क

**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）**:
- k6 本身(Go, संकलित, बिना GIL) नव增了 प्रवाह-जागरूक मापों──
- k6 ऑपरेटर प्रयोग TestRun / PrivateLoadZone CRDs  Kubernetes-निवासी वितरित परीक्षण करने के लिए
- सबसे उपयुक्त CI/CD गेट तथा SLA परीक्षण

**Vegeta** जाओ,比 k6 更简单── निरंतर दर HTTP संतृप्ति── नहीं LLM-जागरूक 能力, लेकिन गेटवे / दर-सीमा परीक्षण के लिए उपयुक्त──

**Locust 2.43.3 stock** LLM के लिए GIL की फंसी 🏻  केवल LLM-Locust विस्तार के साथ ही उपयोग किया जा सकता है

### CI के मध्य SLA गेट

में PR 上运行 k6,并使用:

- मूल RPS में नीचे प्रत्येक 30-50 बार पुनरावृत्ति
- गेटःP50/P95 TTFT、5xx < 5%、TPOT 低于值。
- 违规时让建设 失败──

### वास्तविक शीघ्र वितरण

वास्तविक प्रवाह नमूना निर्माण (यदि हो), या सार्वजनिक वितरण से निर्माण (जैसे चैट के लिए उपयोग किए जाने वाले ShareGPT प्रम्प्ट्स, कोड के लिए HumanEval)  का अर्थ होगा + stddev 输入 LLMPerf── जो भी हो लूप-विथ-वन-प्रंप्ट से बचें──

### आप याद रखना चाहिए कि संख्या

- k6 ऑपरेटर 1.0 GA:2025 年 9 月。
- k6 v2026.1.0:स्ट्रीमिंग-जागरूक मीट्रिक
- 典型 LLMPerf run:在同步 X 下 100-1000 अनुरोधों में
- 典型 CI गेट: प्रत्येक PR 30-50 पुनरावृत्ति
- चार प्रकारः स्थिर, रैंप, स्पाइक, डूबना


```figure
load-pattern-waves
```

## इसका उपयोग करें
`code/main.py`模拟带有真实快速分布的负载测试, प्रभावी TPOT को मापने,并演示均快速陷──

## 交付 यह
本课生成 `outputs/skill-load-test-plan.md`给定工作负荷和SLA 后,选择工具并设计四种负载模式──

## अभ्यास
1. 运行 `code/main.py` तुलनात्मक रूप से समान तथा यथार्थवादी वितरण  अंतर कहाँ है?
2. 编写 k6 स्क्रिप्ट:在100 समवर्ती 下 TTFT P95 <800 ms, रनटाइम 5 分钟──
3. आपके विसर्जन परीक्षण में प्रति घंटे मेमोरी में 50 एमबी का वृद्धि दिखाई देती है।
4. स्पाइक टेस्ट 10 आरपीएस से लेकर 100 आरपीएस तक। यदि कारपेन्टर + वीएलएलएम उत्पादन-स्टैक 已就位 (Phase 17 · 03 + 18) है, तो प्रत्याशित पुनर्प्राप्ति समय क्या है?
5. GenAI-Perf 在同一服务 上报告 TPOT=6ms;LLMPerf 报告 TPOT=11ms──解释原因──

## 关键术语
| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| LLMPerf | "LLM harness" | Anyscale benchmark tool，streaming-aware |
| GenAI-Perf | "NVIDIA tool" | NVIDIA reference harness |
| LLM-Locust | "Locust for LLMs" | 修复 GIL 陷阱的 Locust extension |
| guidellm | "synthetic benchmark" | Large-scale synthetic tool |
| k6 Operator | "K8s k6" | 基于 CRD 的 distributed k6 |
| GIL trap | "Python client overhead" | Tokenization backlog 抬高报告的 latency |
| Prompt-uniformity trap | "single-prompt lie" | 使用相同 prompt 循环命中 cache，抬高 throughput |
| Steady-state | "constant load" | 持续 N 分钟的平坦 RPS |
| Ramp | "linear up" | 在 duration 内从 0 到目标值 |
| Spike | "burst test" | 突然倍增，然后恢复 |
| Soak | "long test" | 用数小时检测 leak |

## 延伸阅读
- [TianPan — Load Testing LLM Applications](https://tianpan.co/blog/2026-03-19-load-testing-llm-applications)
- [PremAI — Load Testing LLMs 2026](https://blog.premai.io/load-testing-llms-tools-metrics-realistic-traffic-simulation-2026/)
- [NVIDIA NIM — Introduction to LLM Inference Benchmarking](https://docs.nvidia.com/nim/large-language-models/1.0.0/benchmarking.html)
- [TrueFoundry — LLM-Locust](https://www.truefoundry.com/blog/llm-locust-a-tool-for-benchmarking-llm-performance)
- [LLMPerf](https://github.com/ray-project/llmperf)
- [k6 Operator](https://github.com/grafana/k6-operator)
