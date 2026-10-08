# दीर्घ संदर्भ मूल्यांकन  NIAH, RULER, LongBench, MRCR

> मिथुन 3 प्रो 宣称拥有10M टोकन的背景──在1M टोकन下,8-针 MRCR 降至26.3%──宣称 ≠可用──长文文评会告诉你正在上线的模型的实际容量──

**类型：**学习
**语言：**पायथन
**先修要求：**चरण 5 · 13(प्रश्न का उत्तर)
**时间：**≈ 60 मिनट

## 问题

आप एक 200 पृष्ठों का अनुबंध है। मॉडल का दावा है कि 1M टोकन संदर्भ है। आप अनुबंध को इसमें डालते हैं और पूछते हैंः  समाप्ति अनुबंध क्या है?  मॉडल ने उत्तर दिया, लेकिन यह पृष्ठ के उत्तर के आधार पर है, क्योंकि समाप्ति अनुबंध 120k टोकन की गहराई में स्थित है, मॉडल से अधिक है  वास्तविक बैठक में ध्यान दिया गया स्थान।

यह 2026 के संदर्भ-क्षमता अंतर है। 1M या 10M में यह लिखा गया है। वास्तविक स्थिति 60-70% उपलब्ध है, और यह कार्य पर निर्भर करता है।

- **Retrieval（haystack 中的 single needle）：**सीमाओं के मॉडल पर, जब तक घोषणा का अधिकतम मूल्य पूर्णता के करीब है।
- **Multi-hop / aggregation：**अधिकांश मॉडल लगभग 128 हजार से अधिक में तेजी से गिरावट आए।
- **对分散 facts 的 reasoning：**अंतिम असफल मिशन

दीर्घ संदर्भ मूल्यांकन  इन आयामों को मापें  इस कक्षा में इन बेंचमार्क ों का वर्णन किया गया है  वे वास्तव में क्या मापते हैं, और आपके क्षेत्र के लिए स्व-परिभाषित सुई परीक्षण कैसे बनाया जाता है 

## 概念

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack（NIAH，2023）。**एक तथ्य को परिभाषित करना (जादू शब्द अनानास है) दीर्घ संदर्भ में रखा गया है 中可控深度的位置──让模型 找回它──扫描深度 × लंबाई── यह मूल दीर्घ संदर्भ बेंचमार्क── सीमा मॉडल 现在已经在这个任务上和; यह आवश्यक है, लेकिन पर्याप्त आधार रेखा नहीं──

**RULER（Nvidia，2024）。**覆盖 4 个类别的 13 种类型任务:retrieval(single / multi-key / multi-value) ]]multi-hop tracing(variable tracking) ]] Aggregation(common word frequency) ]]QA──context length 可配置(4k से 128k+) ]];; यह उन मॉडलों का खुलासा करेगा जो NIAH में ऊपर और पर असफल हैं लेकिन मल्टी-हॉप पर हैं ]];; 2024 में जारी संस्करण में, 17 个 声称 32k+ संदर्भ के मॉडल में, केवल एक आधा ही 32k में गुणवत्ता बनाए रख सकता है ]];;

**LongBench v2（2024）。**503 मार्ग बहुविकल्पीय प्रश्न,8k-2M शब्द संदर्भ,六个任务类别:एकल-doc QA、बहु-doc QA、लंबे संदर्भ में सीखने、लंबे संवाद、कोड रेपो、लंबे संरचित डेटा──यह वास्तविक दुनिया में दीर्घ-संदर्भ व्यवहार के उत्पादन स्तर के लिए एक बेंचमार्क है──

**MRCR（Multi-Round Coreference Resolution）。**बड़े पैमाने पर बहु-टर्न कोरफेरेंस── इसमें 8-नेल、24-नेल、100-नेल 变体── प्रकटीकरण मॉडल 在 Attention 退化前能同时处理多少事实──

**NoLiMa。**नॉन-लेक्सिकल सुई── सुई 与 query 没有字面重叠;प्राप्ती 需要一步语义推理──比 NIAH 更难──

**HELMET。**拼接许多文件,并从任意一个中提问──测试 चुनिंदा ध्यान──

**BABILong。**️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ 

###  वास्तविक रिपोर्ट चाहिए क्या

- **Advertised context window。**规格表上的数字──
- **Effective retrieval length。**NIAH में किसी मूल्य के नीचे पारित करना (उदाहरण के लिए 90%)
- **Effective reasoning length。**बहु-हॉप या संश्लेषण                                                                                                                                                                                                                                                           
- **Degradation curve。**परिप्रेक्ष्य लंबाई के साथ सटीकता, प्रकार के अनुसार

आपके नियम में दो संख्याओं की आवश्यकता होती हैः पुनः प्राप्ति-प्रभावी और तर्क-प्रभावी।


```figure
gx-niah-decay
```

##  इसे निर्माण

### चरण 1: अपने क्षेत्र के लिए स्वयं परिभाषित NIAH का निर्माण करें

见 `code/main.py`骨架如下:

```python
def build_haystack(filler_text, needle, depth_ratio, total_tokens):
    if not (0.0 <= depth_ratio <= 1.0):
        raise ValueError(f"depth_ratio must be in [0, 1], got {depth_ratio}")
    if total_tokens <= 0:
        raise ValueError(f"total_tokens must be positive, got {total_tokens}")

    filler_tokens = tokenize(filler_text)
    needle_tokens = tokenize(needle)
    if not filler_tokens:
        raise ValueError("filler_text produced no tokens")

    # Repeat filler until long enough to fill the haystack body.
    body_len = max(total_tokens - len(needle_tokens), 0)
    while len(filler_tokens) < body_len:
        filler_tokens = filler_tokens + filler_tokens
    filler_tokens = filler_tokens[:body_len]

    insert_at = min(int(body_len * depth_ratio), body_len)
    haystack = filler_tokens[:insert_at] + needle_tokens + filler_tokens[insert_at:]
    return " ".join(haystack)


def score_niah(model, haystack, question, expected):
    answer = model.complete(f"Context: {haystack}\nQ: {question}\nA:", max_tokens=50)
    return 1 if expected.lower() in answer.lower() else 0
```

扫描 `depth_ratio`∈ {0, 0.25, 0.5, 0.75, 1.0} × `total_tokens`∈ {1k, 4k, 16k, 64k}──चित्रण हीटमैप── यही लक्ष्य मॉडल का NIAH कार्ड──

### चरण 2: बहु-नाल 变体

```python
def build_multi_needle(filler, needles, total_tokens):
    depths = [0.1, 0.4, 0.7]
    chunks = [filler[:int(total_tokens * 0.1)]]
    for depth, needle in zip(depths, needles):
        chunks.append(needle)
        next_chunk = filler[int(total_tokens * depth): int(total_tokens * (depth + 0.3))]
        chunks.append(next_chunk)
    return " ".join(chunks)
```

 ये तीन जादू शब्द क्या हैं? इस तरह के प्रश्नों को वापस खोजने की आवश्यकता हैसभी तीनों── एकल सुई सफलता并不能预测 बहु सुई सफलता──

### चरण 3: मल्टी-हॉप चर ट्रैकिंग(RULER शैली)

```python
haystack = """X1 = 42. ... (filler) ... X2 = X1 + 10. ... (filler) ... X3 = X2 * 2."""
question = "What is X3?"
```

答案需要串联三次赋值――सीमा मॉडल में 128k 时, इसमें सटीकता 经常会降至50-70%──

### चरण 4: अपने स्टैक में ऊपर चल रहा है LongBench v2

```python
from datasets import load_dataset
longbench = load_dataset("THUDM/LongBench-v2")

def eval_model_on_longbench(model, subset="single-doc-qa"):
    tasks = [x for x in longbench["test"] if x["task"] == subset]
    correct = 0
    for x in tasks:
        answer = model.complete(x["context"] + "\n\nQ: " + x["question"], max_tokens=20)
        if normalize(answer) == normalize(x["answer"]):
            correct += 1
    return correct / len(tasks)
```

按类别报告精度──总分会隐藏很大的任务级差异──

## 陷

- **仅 NIAH evaluation。**में 1M टोकन नीचे NIAH के माध्यम से,并不能说明 मल्टी-हॉप प्रदर्शन──始终运行 RULER 或自定义 मल्टी-हॉप परीक्षण──
- **Uniform depth sampling。**很多实现只测试深度=0.5──测试深度=0、0.25、0.5、0.75、1.0,中途失落效应是真实存在的──
- **与 filler 的 lexical overlap。**यदि सुई और फिलर के साथ साझा कीवर्ड, पुनः प्राप्ति बहुत सरल हो जाएगा।
- **忽略 latency。**1M-token प्रम्प्ट्स का प्रीफिल 需要 30-120 सेकंड──在精度 之外同时测量时间到第一代令──
- **Vendor-self-reported numbers。**OpenAI、Google、Anthropic शहर अपनी खुद की分数──始终在您的使用案例上独立重跑──

## इसका उपयोग करें

2026 वर्ष का स्टैकः

| 场景 | Benchmark |
|-----------|-----------|
| 快速 sanity check | 3 个 depths × 3 个 lengths 的自定义 NIAH |
| 生产级 model selection | 目标 length 下的 RULER（13 tasks） |
| 真实世界 QA quality | LongBench v2 single-doc-QA subset |
| Multi-hop reasoning | BABILong 或自定义 variable-tracing |
| Conversational / dialogue | 目标 length 下的 MRCR 8-needle |
| Model upgrade regression | 固定的内部 NIAH + RULER harness，在每个新 model 上运行 |

生产环境 अनुभव नियम: ⇒ लक्ष्य लम्बाई पर NIAH + 1 个推理任务 之前,永远不要信任背景窗口──

## 交付 यह

保存为 `outputs/skill-long-context-eval.md`:

```markdown
---
name: long-context-eval
description: Design a long-context evaluation battery for a given model and use case.
version: 1.0.0
phase: 5
lesson: 28
tags: [nlp, long-context, evaluation]
---

Given a target model, target context length, and use case, output:

1. Tests. NIAH depth × length grid; RULER multi-hop; custom domain task.
2. Sampling. Depths 0, 0.25, 0.5, 0.75, 1.0 at each length.
3. Metrics. Retrieval pass rate; reasoning pass rate; time-to-first-token; cost-per-query.
4. Cutoff. Effective retrieval length (90% pass) and effective reasoning length (70% pass). Report both.
5. Regression. Fixed harness, rerun on every model upgrade, surface deltas.

Refuse to trust a context window from the model card alone. Refuse NIAH-only evaluation for any multi-hop workload. Refuse vendor self-reported long-context scores as independent evidence.
```

## अभ्यास

1. **Easy。**构建一个3 个深度(0.25、0.5、0.75) × 3 个长度(1k、4k、16k) का NIAH──在任意模型上运行──将通过率 绘制成3×3热图──
2. **Medium。**∙ एक 3 सुई 变体── माप प्रत्येक लंबाई 下是否能找到回全部 3 个── 与同一长度的单针通过率对比──
3. **Hard。**构建一个变量追踪任务(X1 → X2 → X3,3 hops), 64k फिलर सम्मिलित करना 中──测量 3 个边界模型的精度──报告每模型的有效推理长度──

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|-----------------|-----------------------|
| NIAH | Needle in haystack | 在 filler 中植入一个 fact，让 model 找回它。 |
| RULER | 加强版 NIAH | 覆盖 retrieval / multi-hop / aggregation / QA 的 13 种任务类型。 |
| Effective context | 真实容量 | accuracy 仍高于阈值的长度。 |
| Lost in the middle | Depth bias | Models 对长输入中间部分的内容关注不足。 |
| Multi-needle | 一次多个 facts | 多个植入项；测试 Attention 的同时处理能力，而不只是 retrieval。 |
| MRCR | Multi-round coref | 8、24 或 100-needle coreference；暴露 Attention 饱和。 |
| NoLiMa | Non-lexical needle | Needle 和 query 没有字面 tokens 重叠；需要 reasoning。 |

## 延伸阅读

- [Kamradt (2023). Needle in a Haystack analysis](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) 原始 NIAH repo──
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654) बहु-कार्य बेंचमार्क──
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204) सच्चे विश्व दीर्घ संदर्भ मूल्यांकन──
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666) 更難的針──
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149) तर्क-नार-नार में 
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) गहराई पूर्वाग्रह 论文。
