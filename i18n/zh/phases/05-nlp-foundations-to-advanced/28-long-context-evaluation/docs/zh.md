# 长文本评估 NIAH,RULER,LongBench,MRCR

> 双子座3 Pro 宣称拥有1000万代币的背景――在1000万代币下,8针MRCR 降至26.3%――宣称 ≠可用――长文本评估会告诉你正在上线的模型实际容量――

**类型：**学习 课程
**语言：**字符串
**先修要求：**阶段5 · 13 问题答案
**时间：**约60分钟

## 问题

你有一个200页的合同. 模型声称有1M代币背景. 你把合同贴进并问: 终止条款是什么? 模型回答,但它是根据封面页面回答的,因为终止条款位于120k代币深处,超过了模型实际会关注的位置.

这就是2026年的背景能力差距. 规格表写在1M或10M. 现实情况是60%至70%可用,而且可用取决于任务.

- **Retrieval（haystack 中的 single needle）：**在边界模型上,直到宣称的最大值都接近完美.
- **Multi-hop / aggregation：**大多数车型在128万左右的时间内急剧下降.
- **对分散 facts 的 reasoning：**最先失败的任务.

本课程将说明这些基准,它们实际衡量什么,以及如何为您的领域构建自定义针测试.

## 概念

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack（NIAH，2023）。**将一个事实将语是松) 放在长文本中可控深度位置.让模型找回它.扫描深度 × 长度.

**RULER（Nvidia，2024）。**覆盖4个类别的13种任务类型:检索 (单键/多键/多值) ‧多跳跟踪 (多跳跟踪) ‧聚合 (多变跟踪) ‧通用词频率) ‧QA‧语境长度可配置 (可配置) ‧4k至128k+) ‧ 它会揭示NIAH上和但在多跳上失败的模型. 在2024年发布的版本中,17个声称32k+语境模型中,只有一半能保持质量在32k中──

**LongBench v2（2024）。**503 道多选择问题,8k-2M字文本,六个任务类别:单文档QA、多文档QA、长文本学习、长对话、代码备用、长文本结构数据──它是用于真实世界长文本行为生产级的基准──

**MRCR（Multi-Round Coreference Resolution）。**大规模多转核心参考――包含8针、24针、100针变体――暴露模型 在注意 退化前能同时处理多少事实――

**NoLiMa。**非语义针──针与查询 没有字面重叠;检索 需要一步语义推理──比NIAH 更难──

**HELMET。**拼接许多文件,并从任意一个中提问――测试选择性关注――

**BABILong。**试图在一堆草中推理,而不仅仅是检索.

### 实际应该报告什么

- **Advertised context window。**规格表上的数字――
- **Effective retrieval length。**通过某个值下面的值 (例如90%)
- **Effective reasoning length。**多跳或集成 在该值下通过
- **Degradation curve。**精度与文本长度,按任务类型分别绘制.

你的规格表需要两个数字:检索有效和推理有效.


```figure
gx-niah-decay
```

## 构建它

### 步骤1:为您的领域构建自定义NIAH

见`code/main.py`骨架如下:

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

扫描`depth_ratio`∈ {0, 0.25, 0.5, 0.75, 1.0} × `total_tokens`∈ {1k, 4k, 16k, 64k}──绘制热地图──这就是目标模型的NIAH卡──

### 变体 变体 变体

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

像这些三个魔术词是什么?这样的问题需要找回全部三个.

### 步骤3:多跳式变量追踪 (RULER式)

```python
haystack = """X1 = 42. ... (filler) ... X2 = X1 + 10. ... (filler) ... X3 = X2 * 2."""
question = "What is X3?"
```

答案需要串联三次赋值――边界模型在128k时,它的准确性经常降至50-70%.

### 步骤4: 在你的堆上运行长 v2

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

按类别报告准确性――总分数会隐藏很大的任务级差异――

## 陷

- **仅 NIAH evaluation。**在1M代币下通过NIAH,并不能说明多跳表现──始终运行RULER或自定义多跳测试──
- **Uniform depth sampling。**很多实现只测试深度=0.5──测试深度=0、0.25、0.5、0.75、1.0,在中间失去了效应是真实存在的──
- **与 filler 的 lexical overlap。**如果针和填料共享关键字,检索会变得很简单――使用无式非重叠针――
- **忽略 latency。**需要30-120秒的准确度,同时测量时间到第一个代币.
- **Vendor-self-reported numbers。**开放AI,谷歌,人类城市发布自己的分数.

## 使用它

2026 年的堆:

| 场景 | Benchmark |
|-----------|-----------|
| 快速 sanity check | 3 个 depths × 3 个 lengths 的自定义 NIAH |
| 生产级 model selection | 目标 length 下的 RULER（13 tasks） |
| 真实世界 QA quality | LongBench v2 single-doc-QA subset |
| Multi-hop reasoning | BABILong 或自定义 variable-tracing |
| Conversational / dialogue | 目标 length 下的 MRCR 8-needle |
| Model upgrade regression | 固定的内部 NIAH + RULER harness，在每个新 model 上运行 |

生产环境经验法则:在目标长度上完成NIAH + 1 个推理任务之前,永远不要信任的文本窗口──

## 交付它

保存为`outputs/skill-long-context-eval.md`其他:

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

## 练习

1. **Easy。**构建一个3个深度的NIAH (NIAH) √0.25、0.5、0.75) × 3个长度的NIAH (NIAH) √1k、4k、16k──在任意模型上运行──将通过率绘制成3×3热地图──
2. **Medium。**添加一个3针变体――测量每长度 下是否能找到回全部3个――与相同长度的单针传递率对比――
3. **Hard。**构建一个变量追踪任务(X1 → X2 → X3,3跳),嵌入64k填充器 中──测量3个边界模型的精度──报告每个模型的有效推理长度──

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

- [Kamradt (2023). Needle in a Haystack analysis](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) 原始 NIAH 复制
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654)多任务基准――
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204) 真实世界长文本评价
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666) 更难的针──
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149)            
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172)深度偏见论文
