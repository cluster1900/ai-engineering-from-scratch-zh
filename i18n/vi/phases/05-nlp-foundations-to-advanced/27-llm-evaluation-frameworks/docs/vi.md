# Đánh giá LLM  RAGAS, DeepEval, G-Eval

> Sự phù hợp chính xác và F1 会漏掉语义等价――đánh giá nhân tạo không thể quy mô được―LLM-as-judge là câu trả lời cho môi trường sản xuất  前提是有足够的校准,让你能信任这个数字――

**类型：**构建
**语言：**Python
**前置要求：**Giai đoạn 5 · 13 (Câu hỏi trả lời), Giai đoạn 5 · 14 (Hãy tìm thông tin)
**时间：**~ 75 phút

## 问题

Bạn của RAG 系统 trả lời:"29 tháng 6 năm 2007".
tài liệu tham khảo vàng là:"29 tháng 6 năm 2007."
Đúng là kết quả 0... F1 đạt 75%...

Bây giờ nhân với 10.000 thí nghiệm sử dụng. Một lần nữa nhân với mỗi thay đổi của máy thu thập, chunking, prompt hoặc mô hình. Bạn cần một nhà đánh giá: nó hiểu ý nghĩa, có thể có quy mô chi phí thấp, sẽ không bị lùi lại, và có thể tiết lộ các chế độ thất bại chính xác.

Năm 2026 có ba khung chủ yếu hướng tới vấn đề này:

- **RAGAS.**Khám phá Phân tích-Tăng thế hệ ASsessment。四个RAG metrics(truyền,trách nhiệm,trách nhiệm,chỉ cần thiết,đúng chính xác, nhớ lại),带有 NLI + LLM-đánh án nền──研究支,轻量──
- **DeepEval.**面向 LLMs 的 Pytest──G-Eval──task-completion──hallucination──bias metrics──CI/CD-native──
- **G-Eval.**Một cách thức (từ DeepEval):带 chuỗi suy nghĩ, tự xác định tiêu chí, điểm số 0-1 của LLM-as-judge.

Người ta phụ thuộc vào LLM như một thẩm phán. Bài học này sẽ xây dựng cho bạn trực giác về phương pháp này và xung quanh nó.

## 概念

![四个 evaluation dimensions，LLM-as-judge 架构](../assets/llm-evaluation.svg)

**LLM-as-judge.**Sử dụng một LLM theo quy tắc 给输出打分, thay thế tĩnh trạng métric.`(query, context, answer)`,quan một thẩm phán LLM:"Score 0-1 trên trung thành".

Tại sao nó hiệu quả: LLM có thể với chi phí cực thấp gần như phán quyết nhân tạo. GPT-4o-mini từ mỗi trường hợp được ghi điểm khoảng ~$0.003 的成本，让 1000-sample regression eval run 成本低于 $5 

Tại sao nó sẽ thất bại:

1. **Judge bias.**Các thẩm phán  trả lời ưa thích  trả lời từ gia đình mẫu bản thân  cũng như trả lời theo kiểu phù hợp 
2. **JSON parsing failures.**错误 JSON → NaN score → 被静默排除在 agregate 之外──RAGAS 用户很熟悉这种痛点──用试/except + 显式失败模式做门──
3. **Drift over model versions.**升级法官 会改变每个标准──结法官模型+版本──

**RAG 四件套。**

| Metric | 问题 | Backend |
|--------|----------|---------|
| Faithfulness | 答案中的每个 claim 是否来自 retrieved context？ | 基于 NLI 的 entailment |
| Answer relevance | 答案是否回应了问题？ | 从答案生成 hypothetical questions；与真实问题比较 |
| Context precision | 在 retrieved chunks 中，有多少比例相关？ | LLM-judge |
| Context recall | retrieval 是否返回了所需的一切？ | LLM-judge 对照 gold answer |

**G-Eval.**定义一个自定义标准:"Trả lời đã trích dẫn nguồn chính xác không?" khung 会自动扩展为链思维评估步骤,然后给出0-1 điểm số──适合RAGAS未覆盖的域特定质量尺寸──

**Calibration.**Trong khi đó, các nhà phân tích đã được phân tích trên các trang web của họ.


```figure
n5-judge-gauge
```

##  xây dựng nó

### 步骤 1: Sử dụng NLI làm trung thành (Ragas-style)

```python
from typing import Callable
from transformers import pipeline

nli = pipeline("text-classification",
               model="MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli",
               top_k=None)

# `llm` 是任意 callable：prompt str -> generated str。
# 示例：llm = lambda p: client.messages.create(model="claude-haiku-4-5", ...).content[0].text
LLM = Callable[[str], str]


def atomic_claims(answer: str, llm: LLM) -> list[str]:
    prompt = f"""把这个答案拆成简单的事实 claims（每行一个）：
{answer}
"""
    return llm(prompt).splitlines()


def faithfulness(answer: str, context: str, llm: LLM) -> float:
    claims = atomic_claims(answer, llm)
    if not claims:
        return 0.0
    supported = 0
    for claim in claims:
        result = nli({"text": context, "text_pair": claim})[0]
        entail = next((s for s in result if s["label"] == "entailment"), None)
        if entail and entail["score"] > 0.5:
            supported += 1
    return supported / len(claims)
```

将答案拆解为原子索赔――用 NLI 检查每个索赔 是否被回收文本 支持――忠实性 = 被支持比例――

### 步骤 2: trả lời liên quan

```python
import numpy as np
from sentence_transformers import SentenceTransformer

# encoder：任意实现 .encode(texts, normalize_embeddings=True) -> ndarray 的 model
# 例如：encoder = SentenceTransformer("BAAI/bge-small-en-v1.5")

def answer_relevance(question: str, answer: str, encoder, llm: LLM, n: int = 3) -> float:
    prompt = f"写出 {n} 个这个答案可以回答的问题：\n{answer}"
    generated = [line for line in llm(prompt).splitlines() if line.strip()][:n]
    if not generated:
        return 0.0
    q_emb = np.asarray(encoder.encode([question], normalize_embeddings=True)[0])
    g_embs = np.asarray(encoder.encode(generated, normalize_embeddings=True))
    sims = [float(q_emb @ g_emb) for g_emb in g_embs]
    return sum(sims) / len(sims)
```

Nếu câu trả lời cho thấy vấn đề khác với câu hỏi thực tế, sự liên quan sẽ giảm đi.

### 步骤 3: G-Eval tự xác định métric

```python
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCaseParams, LLMTestCase

metric = GEval(
    name="Correctness",
    criteria="答案应当事实准确，并匹配 expected output。",
    evaluation_steps=[
        "阅读 expected output。",
        "阅读 actual output。",
        "列出 actual output 中的事实 claims。",
        "对每个 claim，标记它是否被 expected output 支持。",
        "返回 score = 被支持的比例。",
    ],
    evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
)

test = LLMTestCase(input="When was the first iPhone released?",
                   actual_output="June 29th, 2007.",
                   expected_output="June 29, 2007.")
metric.measure(test)
print(metric.score, metric.reason)
```

Các bước đánh giá chính là mục.

### 步骤 4: Cổng CI

```python
import deepeval
from deepeval.metrics import FaithfulnessMetric, ContextualRelevancyMetric


def test_rag_system():
    cases = load_regression_cases()
    faith = FaithfulnessMetric(threshold=0.85)
    rel = ContextualRelevancyMetric(threshold=0.7)
    for case in cases:
        faith.measure(case)
        assert faith.score >= 0.85, f"faithfulness regression on {case.id}"
        rel.measure(case)
        assert rel.score >= 0.7, f"relevancy regression on {case.id}"
```

作为 pytest file 发布──每个 PR 都运行──出现回归──时阻止合并──

### Bước 5: đánh giá đồ chơi từ 0

见 `code/main.py` chỉ sử dụng sự trung thành của stdlib (trả lời với các tuyên bố chồng chéo của ngữ cảnh) và sự liên quan (trả lời với các câu hỏi) gần như thực hiện.

## 陷

- **No calibration.**Với nhãn của con người 相关性只有 0.3 的评判 就是噪声──上线前要求校准运行──
- **Self-evaluation.**Sử dụng cùng một LLM 生成和判断,会把分 抬高 10-20%──判断 使用不同模型家族──
- **Positional bias in pairwise judging.**Các thẩm phán                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
- **Raw aggregate hides failures.**Điểm trung bình 0.85 往往会藏藏 5% của thất bại thảm khốc.
- **Golden dataset rot.**Các tập hợp đánh giá không được phiên bản hóa Nếu theo thời gian, sẽ phá hủy các so sánh.
- **LLM cost.**Trong trường hợp quy mô hóa, thẩm phán gọi 主导成本──使用能满足校准门 的最便宜模型──GPT-4o-mini、Claude Haiku、Mistral-small──

## Sử dụng nó

2026:

| Use case | Framework |
|---------|-----------|
| RAG quality monitoring | RAGAS（4 metrics） |
| CI/CD regression gates | DeepEval + pytest |
| Custom domain criteria | DeepEval 内的 G-Eval |
| Online live-traffic monitoring | reference-free mode 的 RAGAS |
| Human-in-the-loop spot checks | LangSmith 或 Phoenix，带 annotation UI |
| Red-teaming / safety eval | Promptfoo + DeepEval |

典型堆:RAGAS làm theo dõi,DeepEval làm CI,G-Eval làm mới chiều kích.

##  phát hành nó

保存为 `outputs/skill-eval-architect.md`- Có thể là:

```markdown
---
name: eval-architect
description: 设计一个带 calibrated judge 和 CI gates 的 LLM evaluation plan。
version: 1.0.0
phase: 5
lesson: 27
tags: [nlp, evaluation, rag]
---

给定一个 use case（RAG / agent / generative task），输出：

1. Metrics。Faithfulness / relevance / context-precision / context-recall + 任何带 criteria 的自定义 G-Eval metrics。
2. Judge model。命名 model + version，并说明 cost vs accuracy 的理由。
3. Calibration。手工标注集大小，目标 Spearman rho vs human > 0.7。
4. Dataset versioning。Tag 策略、change log、stratification。
5. CI gate。每个 metric 的 thresholds、regression-window logic、bottom-quantile alert。

拒绝依赖未在 ≥50 个人工标注示例上测试过的 judge。拒绝 self-evaluation（同一 model 生成 + 判断）。拒绝没有 bottom-10% surfacing 的 aggregate-only reporting。标记任何 judge upgrade 未经过 parallel baseline eval 就落地的 pipeline。
```

## 练习

1. **Easy.**Trong 10 ví dụ RAG của ảo giác đã biết được sử dụng RAGAS.
2. **Medium.**手工将 50 个 QA trả lời 按正确度 标注为 0-1──用 G-Eval 打分──测量评师与人类 间Spearman rho──
3. **Hard.**用 DeepEval 构建 pytest CI gate──故意让retriever regress──验证 gate 会失败──通过对最低10%做门检查 添加底量子级警报──

## 关键术语

| Term | 人们通常说 | 实际含义 |
|------|-----------------|-----------------------|
| LLM-as-judge | 用 LLM 打分 | Prompt 一个 judge model，根据 rubric 给 outputs 打 0-1 分。 |
| RAGAS | RAG metric library | 开源 eval framework，包含 4 个 reference-free RAG metrics。 |
| Faithfulness | 答案是否有依据？ | answer claims 中被 retrieved context entail 的比例。 |
| Context precision | retrieved chunks 是否相关？ | top-K chunks 中真正有用的比例。 |
| Context recall | retrieval 是否找全了？ | gold-answer claims 中被 retrieved chunks 支持的比例。 |
| G-Eval | 自定义 LLM judge | Rubric + chain-of-thought eval steps + 0-1 score。 |
| Calibration | 信任但要验证 | judge score 与 human score 之间的 Spearman correlation。 |

## 延伸阅读

- [Es et al. (2023). RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217) RAGAS 论文。
- [Liu et al. (2023). G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment](https://arxiv.org/abs/2303.16634) G-Eval 论文。
- [DeepEval docs](https://deepeval.com/docs/metrics-introduction) 开放生产堆
- [Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) thiên vị, chuẩn, giới hạn.
- [MLflow GenAI Scorer](https://mlflow.org/blog/third-party-scorers) 集成 RAGAS、DeepEval、Phoenix
