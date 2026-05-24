# Long-Context 评估 — NIAH, RULER, LongBench, MRCR

> Gemini 3 Pro 宣称支持 10M tokens 的上下文。在 1M tokens 时，8-needle MRCR 下降到 26.3%。宣称 ≠ 可用。Long-context evaluation 会告诉你正在交付的模型的实际容量。

**类型：** 学习
**语言：** Python
**前置要求：** Phase 5 · 13 (Question Answering), Phase 5 · 23 (Chunking Strategies)
**时间：** ~60 分钟

## 问题

你有一份 200 页的合同。模型声称有 1M-token 上下文。你把合同粘进去并提问：“终止条款是什么？”模型给出了答案，但它是根据封面页回答的，因为终止条款位于 120k tokens 深的位置，已经超过了模型实际 Attention 的范围。

这就是 2026 年的上下文容量差距。规格表写着 1M 或 10M。现实是其中 60-70% 才可用，而且“可用”取决于任务。

- **检索（haystack 中的 single needle）：** frontier models 在宣称的最大值内几乎完美。
- **Multi-hop / 聚合：** 大多数模型在超过 ~128k 后会急剧退化。
- **基于分散事实的推理：** 最先失败的任务。

Long-context evaluation 衡量这些维度。本课会说明各个 benchmark、它们实际衡量什么，以及如何为你的领域构建自定义 needle test。

## 概念

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack (NIAH, 2023)。** 将一个事实（“magic word is pineapple”）放在长上下文中受控的深度位置。让模型把它检索出来。扫描深度 × 长度。它是最早的 long-context benchmark。Frontier models 现在已经在这个任务上饱和；它是必要但不充分的 baseline。

**RULER (Nvidia, 2024)。** 13 种任务类型，分布在 4 个类别中：检索（single / multi-key / multi-value）、multi-hop tracing（variable tracking）、聚合（common word frequency）、QA。上下文长度可配置（4k 到 128k+）。它能暴露那些在 NIAH 上饱和、但在 multi-hop 上失败的模型。在 2024 年发布版中，17 个声称支持 32k+ 上下文的模型里，只有一半能在 32k 保持质量。

**LongBench v2 (2024)。** 503 道 multiple-choice questions，8k-2M word contexts，六类任务：single-doc QA、multi-doc QA、long in-context learning、long dialogue、code repo、long structured data。它是衡量真实世界 long-context 行为的生产级 benchmark。

**MRCR (Multi-Round Coreference Resolution)。** 大规模 multi-turn coreference。包含 8-needle、24-needle、100-needle 变体。暴露模型在 Attention 退化前能同时处理多少事实。

**NoLiMa。** “Non-lexical needle。”needle 和 query 没有字面重叠；检索需要一步语义推理。比 NIAH 更难。

**HELMET。** 拼接许多文档，并询问来自任意一个文档的问题。测试 selective attention。

**BABILong。** 将 bAbI 推理链 Embedding 到无关 haystacks 中。测试 reasoning-in-a-haystack，而不只是检索。

### 实际应该报告什么

- **宣称的上下文窗口。** 规格表上的数字。
- **有效检索长度。** NIAH 在某个阈值下通过（例如 90%）。
- **有效推理长度。** Multi-hop 或聚合在该阈值下通过。
- **退化曲线。** Accuracy vs context length，按任务类型绘图。

你的规格表需要两个数字：retrieval-effective 和 reasoning-effective。通常 reasoning-effective 是宣称窗口的 25-50%。

## 构建它

### 步骤 1：为你的领域构建自定义 NIAH

见 `code/main.py`。骨架如下：

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

    # 重复 filler，直到足够长，可以填满 haystack 主体。
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

扫描 `depth_ratio` ∈ {0, 0.25, 0.5, 0.75, 1.0} × `total_tokens` ∈ {1k, 4k, 16k, 64k}。绘制 heatmap。这就是你的目标模型的 NIAH card。

### 步骤 2：multi-needle 变体

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

像“这三个 magic words 是什么？”这样的问题需要检索全部三个。Single-needle 成功并不能预测 multi-needle 成功。

### 步骤 3：multi-hop variable tracing（RULER 风格）

```python
haystack = """X1 = 42. ... (filler) ... X2 = X1 + 10. ... (filler) ... X3 = X2 * 2."""
question = "What is X3?"
```

答案需要串联三个赋值。Frontier models 在 128k 时，这里经常下降到 50-70% accuracy。

### 步骤 4：在你的 stack 上运行 LongBench v2

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

按类别报告 accuracy。聚合分数会隐藏很大的任务级差异。

## 陷阱

- **只做 NIAH evaluation。** 在 1M tokens 通过 NIAH，并不能说明 multi-hop 能力。始终运行 RULER 或自定义 multi-hop test。
- **均匀深度采样不足。** 许多实现只测试 depth=0.5。测试 depth=0, 0.25, 0.5, 0.75, 1.0，“lost in the middle”效应是真实存在的。
- **与 filler 存在词面重叠。** 如果 needle 与 filler 共享关键词，检索会变得很简单。使用 NoLiMa 风格的非重叠 needles。
- **忽略延迟。** 1M-token prompts 的 prefill 需要 30-120 秒。除了 accuracy，也要测量 time-to-first-token。
- **供应商自报数字。** OpenAI、Google、Anthropic 都会发布自己的分数。始终在你的 use case 上独立重跑。

## 使用它

2026 年的 stack：

| 场景 | Benchmark |
|-----------|-----------|
| 快速 sanity check | Custom NIAH at 3 depths × 3 lengths |
| 生产环境模型选择 | RULER (13 tasks) at your target length |
| 真实世界 QA 质量 | LongBench v2 single-doc-QA subset |
| Multi-hop 推理 | BABILong or custom variable-tracing |
| 对话 / dialogue | MRCR 8-needle at your target length |
| 模型升级回归 | Fixed in-house NIAH + RULER harness, run on every new model |

生产环境经验法则：在预期长度上完成 NIAH + 1 个推理任务之前，永远不要相信上下文窗口。

## 交付它

保存为 `outputs/skill-long-context-eval.md`：

```markdown
---
name: long-context-eval
description: 为给定模型和 use case 设计一组 long-context evaluation 测试。
version: 1.0.0
phase: 5
lesson: 28
tags: [nlp, long-context, evaluation]
---

给定目标模型、目标上下文长度和 use case，输出：

1. 测试。NIAH 深度 × 长度网格；RULER multi-hop；自定义领域任务。
2. 采样。每个长度下的深度 0, 0.25, 0.5, 0.75, 1.0。
3. 指标。Retrieval pass rate；reasoning pass rate；time-to-first-token；cost-per-query。
4. 截止点。有效检索长度（90% pass）和有效推理长度（70% pass）。两者都要报告。
5. 回归。固定 harness，在每次模型升级时重跑，并展示 deltas。

拒绝只根据 model card 信任上下文窗口。拒绝对任何 multi-hop workload 只做 NIAH evaluation。拒绝把供应商自报的 long-context 分数当作独立证据。
```

## 练习

1. **简单。** 构建一个 NIAH，包含 3 个深度（0.25, 0.5, 0.75）× 3 个长度（1k, 4k, 16k）。在任意模型上运行。将 pass rate 绘制为 3×3 heatmap。
2. **中等。** 添加一个 3-needle 变体。测量每个长度下全部 3 个 needle 的检索情况。与相同长度下 single-needle pass rate 对比。
3. **困难。** 构造一个 variable-tracing 任务（X1 → X2 → X3，包含 3 hops），Embedding 到 64k 的 filler 中。测量 3 个 frontier models 的 accuracy。报告每个模型的有效推理长度。

## 关键术语

| 术语 | 人们通常怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| NIAH | Needle in haystack | 在 filler 中埋入一个事实，让模型检索它。 |
| RULER | 加强版 NIAH | 覆盖检索 / multi-hop / 聚合 / QA 的 13 种任务类型。 |
| Effective context | 真实容量 | Accuracy 仍高于阈值的长度。 |
| Lost in the middle | 深度偏置 | 模型对长输入中间部分的内容 Attention 不足。 |
| Multi-needle | 一次处理多个事实 | 多个埋点；测试 Attention 调度，而不只是检索。 |
| MRCR | Multi-round coref | 8、24 或 100-needle coreference；暴露 Attention 饱和。 |
| NoLiMa | Non-lexical needle | Needle 和 query 没有字面 tokens 重叠；需要推理。 |

## 延伸阅读

- [Kamradt (2023). Needle in a Haystack analysis](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) — 原始 NIAH repo。
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654) — 多任务 benchmark。
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204) — 真实世界 long-context eval。
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666) — 更难的 needles。
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149) — reasoning-in-haystack。
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) — depth-bias 论文。
