# Đánh giá trong bối cảnh dài  NIAH, RULER, LongBench, MRCR

> Gemini 3 Pro 宣称拥有10M token的背景──在1M token 下,8针 MRCR 降至26.3%──宣称 ≠可用──长文评会告诉你正在上线的模型的实际容量──

**类型：**Học tập
**语言：**Python
**先修要求：**Giai đoạn 5 · 13(Câu hỏi trả lời)
**时间：**约60分钟

## 问题

Bạn có một hợp đồng 200 trang. Mô hình tuyên bố có một mỹ thuật ngữ. Bạn đặt hợp đồng vào và hỏi: 终止条款是什么?

Đó là khoảng cách trong bối cảnh và năng lực năm 2026  quy mô biểu diễn được viết là 1M hoặc 10M  thực tế là 60-70% trong số đó có thể sử dụng, và  có thể sử dụng phụ thuộc vào nhiệm vụ

- **Retrieval（haystack 中的 single needle）：**Trong các mô hình biên giới trên, cho đến khi giá trị tối đa của tuyên bố đều gần hoàn hảo.
- **Multi-hop / aggregation：**Hầu hết các mô hình đã giảm mạnh hơn 128k sau đó.
- **对分散 facts 的 reasoning：**Nhiệm vụ thất bại đầu tiên.

Đánh giá ngữ cảnh dài  đo những chiều kích này. Bài học này sẽ giải thích những tiêu chuẩn này.

## 概念

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack（NIAH，2023）。**Để một thực tế ( thuật ngữ là dứa) đặt trong ngữ cảnh dài 中可控深度的位置──让模型找回它──扫描深度 ×长度──它是最初的长文本基准──边界模型现在已经在这个任务上和;它是必要的但不充分的基线──

**RULER（Nvidia，2024）。**覆盖 4 个类别的 13 种任务类型:trunning(single / multi-key / multi-value) ]]multi-hop tracing(variable tracking) ]] Aggregation(common word frequency) ]]QA──context length 可配置(4k đến 128k+) ]];; nó sẽ tiết lộ những mô hình trong NIAH 上和但在多hop 上失败的模型──在2024年发布版,17 个声称 32k+context的模型中,只有一半能保持质量在32k中──

**LongBench v2（2024）。**503 Đường câu hỏi nhiều lựa chọn,8k-2M ngữ cảnh từ,六个任务类别:QA đơn tài liệu、QA đa tài liệu、long in-context learning、long dialogue、code repo、long structured data── nó là một tiêu chuẩn cấp sản xuất hành vi trong bối cảnh dài trong thế giới thực──

**MRCR（Multi-Round Coreference Resolution）。**Hình mẫu mở rộng đa vòng ∞ bao gồm 8 con nhọn ∞ 24 con nhọn ∞ 100 con nhọn ∞

**NoLiMa。**Tháp không học thuật──tháp 与 query 没有字面重叠;khám phá 需要一步语义推理──比 NIAH 更难──

**HELMET。**拼接许多文件,并从任意一个中提问――测试 chọn lọc chú ý――

**BABILong。**Để phân tích các chuỗi lý luận, hãy cố gắng tìm hiểu.

###  thực sự nên báo cáo gì

- **Advertised context window。**Số trên bảng quy tắc.
- **Effective retrieval length。**NIAH trong một số giá trị thấp thông qua (ví dụ: 90%)
- **Effective reasoning length。**Multi-hop hoặc tổng hợp 在该值下通过
- **Degradation curve。**Độ chính xác so với chiều dài ngữ cảnh, theo nhiệm vụ loại phân biệt vẽ.

Bạn của quy tắc biểu diễn cần hai số: thu hồi hiệu quả và lý luận hiệu quả.


```figure
gx-niah-decay
```

##  xây dựng nó

### Bước 1: xây dựng tự xác định NIAH cho lĩnh vực của bạn

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

扫描 `depth_ratio`∈ {0, 0.25, 0.5, 0.75, 1.0} × `total_tokens`∈ {1k, 4k, 16k, 64k}── vẽ heatmap──这就是目标模型的NIAH卡──

### Bước 2: nhiều kim 变体

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

Như những từ phép thuật này là gì? Những câu hỏi như vậy cần tìm lại tất cả ba.

### Bước 3: Chịu biến đa hop (RULER-style)

```python
haystack = """X1 = 42. ... (filler) ... X2 = X1 + 10. ... (filler) ... X3 = X2 * 2."""
question = "What is X3?"
```

答案需要串联三次赋值――边界模型 在 128k 时,精度经常会降至50-70%.

### Bước 4: Trong đống của bạn trên chạy LongBench v2

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

按类别报告精度── tổng số điểm sẽ ẩn rất nhiều sự khác biệt về cấp độ nhiệm vụ──

## 陷

- **仅 NIAH evaluation。**Trong 1M token 下通过NIAH,并不能说明 đa hop biểu hiện──始终运行 RULER 或自定义 đa hop test──
- **Uniform depth sampling。**很多实现只测试深度=0.5──测试深度=0、0.25、0.5、0.75、1.0,失在中间效应是真实存在的──
- **与 filler 的 lexical overlap。**Nếu kim và chất lấp chia sẻ các từ khóa, việc lấy lại sẽ trở nên rất đơn giản.
- **忽略 latency。**1M-token prompt của prefill 需要 30-120秒──在精度之外同时测量时间到第一代币──
- **Vendor-self-reported numbers。**OpenAI, Google, Anthropic sẽ phát hành phần tử của mình.

## Sử dụng nó

2026 năm:

| 场景 | Benchmark |
|-----------|-----------|
| 快速 sanity check | 3 个 depths × 3 个 lengths 的自定义 NIAH |
| 生产级 model selection | 目标 length 下的 RULER（13 tasks） |
| 真实世界 QA quality | LongBench v2 single-doc-QA subset |
| Multi-hop reasoning | BABILong 或自定义 variable-tracing |
| Conversational / dialogue | 目标 length 下的 MRCR 8-needle |
| Model upgrade regression | 固定的内部 NIAH + RULER harness，在每个新 model 上运行 |

生产环境经验法则: 在目标长度上完成 NIAH + 1 个推理任务 之前,永远不要信任背景窗口──

## 交付 nó

保存为 `outputs/skill-long-context-eval.md`- Có thể là:

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

1. **Easy。**构建一个3 个深度(0.25、0.5、0.75) × 3 个长度(1k、4k、16k) của NIAH。在任意模型上运行──将通过率 绘制成3×3热图──
2. **Medium。**Thêm một 3 con kim 变体── đo mỗi chiều dài 下是否能找到回全部 3 个──与相同长的单针通过率对比──
3. **Hard。**构建一个变量追踪任务(X1 → X2 → X3,3 hops),Embedding 64k filler 中──测量 3 个边界模型的精度──报告每个模型的有效推理长──

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

- [Kamradt (2023). Needle in a Haystack analysis](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) 原始 NIAH repo。
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654) điểm chuẩn đa nhiệm。
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204) 真实世界 long-context eval──
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666) 更难的针
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149) lý luận trong đống cỏ 
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) sự thiên vị sâu 论文。
