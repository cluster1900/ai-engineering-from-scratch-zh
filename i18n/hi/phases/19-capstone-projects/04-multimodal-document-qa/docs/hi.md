# कैपस्टोन 04  मल्टीमोडल दस्तावेज़ QA(पहली दृष्टि PDF、表格、图表)

> 2026 के दस्तावेज़-QA 前沿 ने OCR-then-text से दृष्टि-first late interaction की ओर रुख कर दिया है──ColPali、ColQwen2.5 和 ColQwen3-omni प्रत्येक PDF पेज को छवि के रूप में देखा जाएगा, इसके लिए बहु-वेक्टर देर से बातचीत का उपयोग करके एम्बेड करना, और क्वेरी को सीधे पैच तक पहुंचाना।

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (viewer UI)
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P5 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题
企业拥有大量会被OCR管道搞乱的 PDF:带旋转表格的扫描版 10-K、充满公式的科学论文、只有作为图像才有意图片、手写批注―― इन्हें पाठ-पहिली 处理 के अनुसार रखना, मतलब है आधा संकेत खो देना──2026 में उत्तर मूल पृष्ठ छवि पर देर से बातचीत बहु-वेक्टर पुनर्प्राप्ती करना है──ColPali (इललुइन टेक) ने इस पद्धति को पेश किया;ColQwen2.5-v0.2 和ColQwen3- 推推确率──VideRe v3 पर, दृश्य-पहिली पुनर्प्राप्ती का अनुपात उच्च स्तर पर O-then-high-text में सटीक रूप से निर्धारित किया गया है, और साथ ही टेबल पर सामग्री का आकार और चित्रण में अंतर बढ़ाया गया है।

代价是存储和延迟──ColQwen Embedding प्रत्येक पृष्ठ में लगभग 2048 补丁 वेक्टर होते हैं, न कि एक एकल 1024-dim वेक्टर──原始存储会膨胀──DocPruner (2026) 可在无可测准确率损失的情况下带来50%剪裁──你将索引 10k 页面,测量 ViDoRe v3 nDCG@5,在2内提供答案,并与OCR-then-text बेसलाइन 直接比较──

## 概念
देर से बातचीत मतलब प्रत्येक क्वेरी टोकन शहर होगा प्रत्येक पैच टोकन 打分, फिर प्रत्येक क्वेरी टोकन 取最大分并求和── इस प्रकार की कोई भी आवश्यकता नहीं एकल pooled वेक्टर, भी प्राप्त कर सकते हैं细粒度匹配──बहु-वेक्टर सूचकांक(Vespa、Qdrant बहु-वेक्टर या AstraDB) प्रति पैच एम्बेडिंग, और जब पुनर्प्राप्त 运行 MaxSim──

उत्तरदाता एक दृष्टि-भाषा मॉडल है, यह क्वेरी प्राप्त करता है 和 शीर्ष-क 检索页面图像,并输出带证据区域(बॉक्स्स या पृष्ठ संदर्भ) के उत्तरों में।

评估 एक द्विआधारी मैट्रिक्स है। एक轴是内容类型(纯文本段落、密集表格、柱状/折线图、手写笔记、公式)  एक अन्य轴是检索方法(दृष्टि-पहला देर से बातचीत बनाम OCR-फिर-पाठ बनाम हाइब्रिड)  प्रत्येक单元格 प्राप्त nDCG@5 和 उत्तर सटीकता── रिपोर्ट就是交付物物──

## 架构
```
PDFs -> page renderer (PyMuPDF, 180 DPI)
           |
           v
  ColQwen2.5-v0.2 embed (multi-vector per page, ~2048 patches)
           |
           +------> DocPruner 50% compression
           |
           v
   multi-vector index (Vespa or Qdrant multi-vector)
           |
query ----+----> retrieve top-k pages (MaxSim)
           |
           v
  VLM answerer: Qwen3-VL-30B | Gemini 2.5 Pro | InternVL3
    inputs: query + top-k page images + optional OCR text
           |
           v
  answer with cited page numbers + evidence regions
           |
           v
  Streamlit / Next.js viewer: highlighted boxes on source page
```

## 技术
- 页面染: PyMuPDF (fitz),180 DPI,चित्र-सामान्य
- देर से बातचीत मॉडल: ColQwen2.5-v0.2 या ColQwen3-omni(Hugging Face 上的 vidore टीम)
- सूचकांक: 带 बहु-वेक्टर क्षेत्र का वेस्पा, या Qdrant बहु-वेक्टर, या带 MaxSim का AstraDB
- कटाईः DocPruner 2026 नीति ((उच्च-विभिन्नता पैचों को बनाए रखना,50% संपीड़न और सटीकता का नुकसान < 0.5%)
- OCR fallback(公式 / 密集表格):dots.ocr या Nougat
- VLM उत्तरदाताः स्व-होस्ट Qwen3-VL-30B या होस्ट Gemini 2.5 प्रो;InternVL3  के रूप में fallback
- मूल्यांकनः ViDoRe v3 बेंचमार्क,M3DocVQA बहु-पृष्ठ तर्क के लिए उपयोग किया जाता है
- दर्शक UI: Next.js 15, उपयोग कैनवास ओवरले  दिखा सबूत क्षेत्रों


```figure
ce-late-interaction
```

##  इसे निर्माण
1. **Ingest.** एक भाषा भंडार में 10k PDF पृष्ठों का समावेश है, जिसमें 10K वैज्ञानिक लेख और साफ़ेण दस्तावेज शामिल हैं  प्रति पृष्ठ 1536x2048 PNG  बना रहेगा `{doc_id, page_num, image_path}`

2. **Embed.**प्रत्येक पृष्ठ पर चित्रों पर चलाने ColQwen2.5 v0.2──输出形状约为 2048 个 dim 128 的补丁嵌入式──应用 DocPruner 保留信号最强的一半──写入Vespa बहुवेक्टर क्षेत्र अथवा Qdrant बहुवेक्टर──

3. **Query.**प्रत्येक传入 क्वेरी के लिए, क्वेरी टावर का उपयोग करें  एम्बेडिंग करें)  टोकन-स्तर के एम्बेडिंग करें) 对索引 运行 MaxSim:对每个 क्वेरी टोकन,在页面补丁嵌入上取最大点-产品并求和──返回顶-k 页面──

4. **Synthesize.**उपयोग क्वेरी 和 शीर्ष-5 页面图像调用 Qwen3-VL-30B──Prompt: "केवल प्रदान किए गए पृष्ठों का उपयोग करके उत्तर दें। प्रत्येक दावे को (doc_id, पृष्ठ) द्वारा उद्धृत करें और क्षेत्र का नाम (चित्र, तालिका, पैराग्राफ) ।"

5. **Evidence regions.**उत्तर के लिए पोस्ट-प्रक्रिया,提取被引用的地区── यदि VLM 输出界定框 (Qwen3-VL 会这样做), तो दर्शकों के बीच उन्हें 染为叠加──

6. **OCR fallback.**इस प्रकार, एक सूत्र के रूप में ओसीआर पाठ को अतिरिक्त मार्ग के रूप में छवि के साथ सम्मिलित किया जाएगा।

7. **Eval.**运行 ViDoRe v3(पुनर्प्राप्ती nDCG@5) और M3DocVQA(बहु-पृष्ठ QA सटीकता)                                                                                                                                                                                                                                              

8. **UI.**先做 Streamlit प्रोटोटाइप;再做 Next.js 15 उत्पादन दर्शक, समर्थन प्रति पृष्ठ सबूत-क्षेत्र ओवरले

## इसका उपयोग करें
```
$ doc-qa ask "what was the 2024 operating margin change for segment EMEA?"
[retrieve]   top-5 pages in 320ms (ColQwen2.5, MaxSim, Vespa)
[synth]      qwen3-vl-30b, 1.4s, cited (form-10k-2024, p. 88) + (..., p. 92)
answer:
  EMEA operating margin moved from 18.2% to 16.8%, a 140bp decline.
  cited: 10-K-2024.pdf p.88 (Table 4, Segment Operating Margin)
         10-K-2024.pdf p.92 (MD&A, Operating Performance)
[viewer]     open with highlighted bounding boxes overlaid on p.88 Table 4
```

## 交付 यह
`outputs/skill-doc-qa.md`描述交付物: एक दृष्टि-पहली बहुआयामी दस्तावेज़ क्यूए प्रणाली, विशिष्ट भाषा सामग्री भंडार को अनुकूलित करने के लिए, और ViDoRe v3 上与OCR-then-text बेसलाइन 进行评估──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | ViDoRe v3 / M3DocVQA accuracy | Benchmark numbers vs OCR-text baseline and published leaderboard |
| 20 | Evidence-region grounding | 被引用 regions 中实际包含 answer span 的比例 |
| 20 | Storage and latency engineering | DocPruner compression ratio、index p95、answer p95 |
| 20 | Multi-page reasoning | 在手工标注的 100-question multi-page set 上的 accuracy |
| 15 | Source-inspection UX | Viewer clarity、overlay fidelity、side-by-side comparison tools |
| **100** | | |

## अभ्यास
1. ColQwen2.5 v0.2 vs ColQwen3-omni── किस पृष्ठ पर एक उत्तर देता है और दूसरा गायब हो जाता है?

2. 激进地 prune Embeddings(75%、90%) ――找到 संपीड़न चट्टान:ViDoRe nDCG@5 下降到OCR बेसलाइन 以下点──

3. 构建混合:并行运行 OCR-then-text 和 ColQwen, RRF 融合, पुनः क्रॉस-एन्कोडर पुनः रैंक का उपयोग करें──混合 是否优于单独任一方法? यह किस स्थान पर मदद करता है?

4. Qwen3-VL-30B को छोटा VLM के लिए बदलना

5. 添加手写笔记支持──染手写体,ColQwen के साथ 进行嵌入,测量检索──与手写OCR पाइपलाइन对比──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Late interaction | "ColPali-style retrieval" | Query tokens 独立地与页面 patches 打分；MaxSim 聚合 |
| Multi-vector | "Per-patch embedding" | 每个文档有多个 Vector，而不是一个 pooled Vector |
| MaxSim | "Late-interaction scoring" | 对每个 query Token，在 document vectors 上取最大相似度；求和 |
| DocPruner | "Patch compression" | 2026 年的 pruning 方法，保留 50% patches 且 accuracy loss 可忽略 |
| ViDoRe v3 | "Document-retrieval benchmark" | 2026 年衡量 visual-document retrieval 的标准 |
| Evidence region | "Cited bounding box" | source page 上定位 answer span 的 bbox |
| OCR fallback | "Equation channel" | 与 vision 一起用于公式密集或表格密集页面的 text pipeline |

## 延伸阅读
- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) देर से बातचीत 文档检索参考
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) 基础方法论文
- [ColQwen family on Hugging Face](https://huggingface.co/vidore) उत्पादन के लिए तैयार चेकपोस्ट
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952) बहु-पृष्ठ बहु-मॉडल आरएजी बेसलाइन
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html) संदर्भ सेवा स्टैक
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors) वैकल्पिक सूचकांक
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html) वैकल्पिक प्रबंधित सूचकांक
- [Nougat OCR](https://github.com/facebookresearch/nougat) समीकरण के योग्य ओसीआर गिरावट
