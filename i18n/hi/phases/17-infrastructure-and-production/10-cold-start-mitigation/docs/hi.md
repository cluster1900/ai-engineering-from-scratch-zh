# सर्वरलेस LLM का शीत प्रारंभ

> एक 20 जीबी मॉडल छवि ठंड से सेवा तक 需要 5-10 分钟(7B) से 20+ 分钟(70B) 😇 在真正的无服务器世界里,这不是加热,而是停机──Mitigations 作用在五层:预种种节点图像(AWS 上的瓶块、双体积弧) 模型流播(NVIDIA Run:ai Model Streamer,vLLM 原生支持) GPU स्मृति स्नैपशॉट(Modal checkpoints,restart 最多快 10x) 、热池(`min_workers=1`)、स्तरबद्ध लोडिंग(सर्वरलेसLLM का NVMe→DRAM→HBM पाइपलाइन,लैटेंसी 降低 10-200x), तथा KV कैश के बजाय KB इनपुट टोकन(GB) का लाइव माइग्रेशन。 मॉडेल 发布的 2-4s ठंड स्टार्ट्स 是下限;Baseten 默认 5-10s,配合预加热可达子-秒──本课教你测量、预算并叠加这五层──

**Type:** Learn
**Languages:** Python (stdlib, toy cold-start path simulator)
**前置要求：**चरण 17 · 02 (इन्फरेंस प्लेटफॉर्म इकोनॉमिक्स), चरण 17 · 03 (जीपीयू ऑटोस्केलिंग)
**Time:** ~60 minutes

## 学习目标
- 列举冷启动缓解的五层, और प्रत्येक层出一个工具或模式──
- 将 70B मॉडल का कुल ठंड-शुरू समय 计算为 (नोड प्रावधान) + (वेट डाउनलोड) + (वेट लोड HBM में) + (इंजन init) 之和。
- 解释为什么直播迁移 传输输输入 टोकन(KB) के बजाय KV कैश(GB),以及代价是什么(पुनः गणना)
- कह बाहर गर्म पूल व्यापार-ऑफ (((के लिए निष्क्रिय GPU 付费, या स्वीकार ठंड स्टार्ट पूंछ), तथा `min_workers > 0` आवश्यक SLA सीमा बन जाये

## 问题
आपका सर्वरलेस LLM अंत बिंदु ∞ रात के पैमाने पर शून्य तक ∞ सुबह 8 点流量激增 ∞ पहला अनुरोध ∞ प्रतीक्षा करने की आवश्यकता हैः

1. कार्पेन्टर प्रभार एक GPU नोड:45-60s
2. कंटेनर खींच एक एक के साथ वजन की 30 जीबी छवि:120-300s──
3. इंजन वजन HBM:45-120s तक लोड करेगा, मॉडल आकार और भंडारण गति पर निर्भर करता है।
4. vLLM या TRT-LLM 初始化 CUDA ग्राफ्स、केवी कैश पूल、 टोकनीज़र:10-30s──

总计:220-510s(大约 3-8分钟) 后才会返回一个代币──你的SLA是2s──你发行一个热池(`min_workers=1`), समस्या गायब लगती है, लेकिन अब आप एक निष्क्रिय GPU के लिए 24x7 शुल्क देना चाहते हैं. यदि आपकी सेवा में 5 उत्पाद हैं, प्रत्येक में एक गर्म प्रतिकृति है, तो यह 5 × 24 × 30 = 3,600 GPU-घंटे / महीने, चाहे कोई भी उपयोगकर्ता उपयोग किया गया हो।

शीत प्रारंभ में कमी करना सर्व्हर रहित अर्थव्यवस्था को बनाए रखने के साथ ही हमेशा लटेंसी के करीब रहने का एक तरीका है।

## 概念
### परत 1  预置节点镜像(बॉटलरकेट)

AWS पर, Bottlerocket के दोहरे मात्रा वास्तुकला ओएस डेटा से अलग करेगा।`EC2NodeClass`中引用快照 ID──新节点 启动时重量 已经在本地NVMe上,步骤 2 和步骤 3 का एक हिस्सा गायब हो जाएगा──它与卡珀特原生配合──典型节省:大型模型 每次冷起省 2-4分钟──

GCP 上的等价方案:带有预备烤容器层的自定义VM图像──Azure 上:采用相同模式的管理磁盘快照──

### परत 2  मॉडल स्ट्रीमिंग (Run:ai मॉडल स्ट्रीमर)

न ही पूर्ण फ़ाइल लोड के लिए प्रतीक्षा करें  पूर्ण पुनः उत्तर पहले अनुरोध, बल्कि एक स्तर पर वजन GPU स्मृति में स्ट्रीम करेगा, और पहले ट्रांसफार्मर ब्लॉक में 常驻后立即开始处理──NVIDIA Run:ai Model Streamer 在 vLLM 2026 中原生提供──支持 S3、GCS 和 स्थानीय NVMe──通过将 I/O और कंप्यूटर सेटअप重叠, बड़े मॉडल के वजन लोड समय लगभग आधे में कमी──

### परत 3  GPU स्मृति स्नैपशॉट (मोडल)

मॉडल में पहली बार लोड 后对 GPU राज्य(वेights、CUDA ग्राफ、KV कैश क्षेत्र)做检查点──后续重启 直接消化到HBM,比重新初始化快 10x──这最接近在2秒内启动一个热的 GPU──Trade-off:快照 绑定 per-GPU-topology,所以如果卡珀特将你迁移到不同的 SKU,你需要重新检查点──

### परत 4  गर्म पूल (min_workers=1)

सबसे सरल उपायः एक प्रतिलिपि को बनाए रखें हमेशा तैयार। लागत एक GPU की घंटे की दर 24x7 है। छोटे मॉडल के लिए यह अंकगणित बहुत ही क्रूर है।$0.85-$1.50 30 के ठंडा शुरू से बचने के लिए), बड़े मॉडल के लिए 则更友好(每小时支付$4 为了避免 5分冷开始) ・ गर्म पूल 变得必需的 SLA सीमाः आमतौर पर 70B+ मॉडल ऊपर TTFT P99 < 60s──

### परत 5  स्तरीय लोड (ServerlessLLM)

सर्वरलेसLLM भंडारण 视为一个层次的维度:NVMe(快但大)、DRAM(中等但可分层)、HBM(小但即时) ⋅ वजन 预先 लोड到DRAM;按需负载到HBM。 पेपर 报告,相比天真盘到HBM,冷负载的延迟 降低 10-200x。उत्पादन अपनत्व 仍处于早期阶段,但已存在与vLLM的整合──

### परत 6  लाइव माइग्रेशन (बोनस पैटर्न)

जब किसी नोड अपरिहार्य समय(स्पॉट निष्कासन、नोड ड्रेन), पारंपरिक पैटर्न है ठंड-स्टार्ट 另一个副本并排请求队列──Live माइग्रेशन将输入 टोकन(किलोबाइट) को लोड मॉडल के गंतव्य तक स्थानांतरित करें, और गंतव्य ऊपर पुनः गणना KV कैश──Recomputation 比通过网络传输 GB 级 KV कैश 更便宜──

### गर्म पूल गणित

 P99 TTFT SLA के लिए 2s सेवा के लिए, समस्या  गर्म पूल नहीं है, बल्कि  कितनी गर्म प्रतिकृति चाहिए, साथ ही साथ कौन से मार्ग  उन्हें प्राप्त करने के लिए

- उच्च मूल्य वाले इंटरैक्टिव पथ (लाइव चैट, वॉयस एजेंट):`min_workers=1-2`
- पृष्ठभूमि बैच पथों ((रात में वर्गीकरण): स्केल-टू-शून्य स्वीकार करें,可容忍 5-10 分钟 ठंड प्रारंभ──
- प्रीमियम स्तर: प्रत्येक किरायेदार उपयोग `min_workers`और समर्पित क्षमता

### अनुकूलन से पहले मापें

全新节 上 70B मॉडल का शीत प्रारंभ शरीर रचना (उदाहरण):

| Phase | Time | Mitigation |
|-------|------|-----------|
| Node provision | 50s | Bottlerocket + pre-seeded image, warm pool |
| Image pull | 180s | Pre-seeded data volume (eliminate) |
| Weights to HBM | 75s | Model streamer (halve); GPU snapshot (eliminate) |
| Engine init | 20s | Persistent CUDA graph cache |
| First forward | 3s | Min inherent latency |
| **Total cold** | **328s** | |
| **Total with mitigations** | **~15s** | 22x reduction |

### संख्याओं को याद रखना चाहिए

- मोडल ठंड शुरूः 2-4 सेकंड
- मूल 默认 ठंड प्रारंभ:5-10s; उपयोग पूर्व-तापमान 时 उप-दूसरी
- 70B ठंड शुरू:3-8 मिनट
- रनःएआई मॉडल स्ट्रीमरः~2 गुना वजन-लोड गति
- सर्वरलेसLLM स्तरीय लोडःलैटेंसी 降低 10-200x


```figure
cold-start-pipeline
```

## इसका उपयोग करें
`code/main.py`建模── शीत प्रारंभ समय, गर्म पूल लागत, तथा गर्म पूल के लिए आवश्यक ब्रेक-ईव अनुरोध दर की रिपोर्ट करना

## 交付 यह
本课会产出 `outputs/skill-cold-start-planner.md`                                                                                                                                                                                                                                                              

## अभ्यास
1. 运行 `code/main.py`◊ गणना ब्रेक-इवेंट अनुरोध दरः इस दर से अधिक होने के बाद, गर्म प्रतिकृति 会比因 SLO 下额外请求 ड्रॉप而支付冷开始税 更便宜──
2. आप एक 13B मॉडल,P99 TTFT SLA के लिए 3s को तैनात करना चाहते हैं।
3. बोतल रकेट पूर्व-बीजिंग  छवि खींचने को समाप्त कर दिया, लेकिन वजन  अभी भी स्नैपशॉट लोड से एचबीएम तक की आवश्यकता है।
4. आपके सर्वरलेस प्रदाता  GPU स्नैपशॉट प्रदान करते हैं, लेकिन आपकी टीम ने इनकार कर दिया, कारण यह है कि स्नैपशॉट PII🏼 论证 दोनों पक्षों का दृष्टिकोण:现实风险是什么,缓解是什么?
5. ️ एक स्तरीय वार्म पूल नीति डिजाइन करें: भुगतान उपयोगकर्ता ✓ परीक्षण उपयोगकर्ता ✓ बैच वर्कलोड 分別需要多少热复制?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cold start | “the big pause” | Fresh replica 上从 request 到 first token 的时间 |
| Warm pool | “always-on minimum” | `min_workers >= 1`，保持至少一个 replica ready |
| Pre-seeded image | “baked AMI” | Container weights 已预先常驻的 node image |
| Bottlerocket | “AWS node OS” | 支持 dual-volume snapshot 的 AWS container-optimized OS |
| Model streamer | “streaming load” | 将 weights I/O 与 compute setup 重叠 |
| GPU snapshot | “checkpoint to HBM” | 序列化 post-load GPU state；restart 时 deserialize |
| Tiered loading | “NVMe + DRAM + HBM” | Storage tiers 的 hierarchy；按需 load |
| Live migration | “move tokens” | 传输 input（KB），在 destination 上 recompute KV |
| `min_workers` | “warm replicas” | Serverless minimum keep-alive count |
| Scale-to-zero | “full serverless” | Idle 时无 cost；接受完整 cold-start tax |

## 延伸阅读
- [Modal — Cold start performance](https://modal.com/docs/guide/cold-start) मोडल 发布的基准和检查点架构──
- [AWS Bottlerocket](https://github.com/bottlerocket-os/bottlerocket) पूर्व-बुना डेटा मात्रा स्नैपशॉट पैटर्न。
- [NVIDIA Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer) वजन भार और गणना सेटअप 重叠
- [Baseten — Cold-start mitigation](https://www.baseten.co/blog/cold-start-mitigation/) पूर्व-गर्म करने के खेल पुस्तिका。
- [ServerlessLLM paper (USENIX OSDI'24)](https://www.usenix.org/conference/osdi24/presentation/fu) स्तरीय लोड डिजाइन──
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) विघटित तैनाती का प्रत्यक्ष प्रवास──
