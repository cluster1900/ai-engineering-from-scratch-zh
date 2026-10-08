# 法学士评价 RAGAS,DeepEval,G-Eval

> 技术评审无法扩大. 作为评审者,LLM是生产环境的答案.

**类型：**构建
**语言：**字符串
**前置要求：**五期·13期 (回答问题),五期·14期 (获取信息)
**时间：**七十五分钟

## 问题

您的RAG系统回答:"2007年6月29日".
黄金参考是:"2007年6月29日".
精确的比赛得分为0――F1得分约75%――人工会给100%――

现在乘以10,000个测试用例――再乘以每次变化的回收器,缩,快速或模型――你需要一个评估者:它理解意义,能低成本规模运行,不会在回归上撒谎,并能暴露正确的失败模式――

2026年有三个框架 主导这一问题.

- **RAGAS.**检索-增强代 ASsessment──四个RAG指标──忠诚度、答案相关性、文本精确性、文本回忆),带有NLI+LLM法官后台──研究支,轻量──
- **DeepEval.**面向LLM的Pytest──G-Eval──任务完成──幻觉──偏见指标──CI/CD原生──
- **G-Eval.**一种方法(也是DeepEval指标):带链思维"",自定义标准"",0-1分的LLM作为法官――

根据法师作为法官的要求,本课程将建立你对该方法以及它周围的信任层的直觉.

## 概念

![四个 evaluation dimensions，LLM-as-judge 架构](../assets/llm-evaluation.svg)

**LLM-as-judge.**根据规则 给输出打分,替代静态测量.`(query, context, answer)`快速一个法官 LLM:"忠诚度0-1分. " 返回分数.

为什么有效:LLM 能以极低成本近似人工判断.$0.003 的成本，让 1000-sample regression eval run 成本低于 $五,五

为什么它会沉默失败:

1. **Judge bias.**评委 偏好更长的答案 来自自己模型家庭的答案以及匹配快速风格的答案
2. **JSON parsing failures.**错误 JSON → NaN分数 → 被静默排除在总体之外──RAGAS 用户很熟悉这种痛点──用试用/除了+ 显式失败模式做门──
3. **Drift over model versions.**升级法官将改变每个指标.

**RAG 四件套。**

| Metric | 问题 | Backend |
|--------|----------|---------|
| Faithfulness | 答案中的每个 claim 是否来自 retrieved context？ | 基于 NLI 的 entailment |
| Answer relevance | 答案是否回应了问题？ | 从答案生成 hypothetical questions；与真实问题比较 |
| Context precision | 在 retrieved chunks 中，有多少比例相关？ | LLM-judge |
| Context recall | retrieval 是否返回了所需的一切？ | LLM-judge 对照 gold answer |

**G-Eval.**定义一个自定义标准:"答案是否引用了正确的来源?"框架会自动扩展为链接思考评估步骤,然后给出0-1分点――适合RAGAS未覆盖的域特定质量尺寸――

**Calibration.**在没有与人类标签相关性验证前,永远不要信任原始评审分点――运行100个手工标签示例――绘制评审与人类――计算Spearman rho――如果 rho <0.7,你的评审分点需要改进――


```figure
n5-judge-gauge
```

## 构建它

### 步骤1:使用NLI做忠诚 (RAGAS风格)

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

将答案分解为原子索赔――使用NLI 检查每个索赔 是否被回收文本支持――忠实性 = 被支持比例――

### 步骤2:答案相关性

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

如果答案与实际问题不同,相关性就会下降.

### 步骤3: G-Eval自定义指标

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

评估步骤就是标题. 显式步骤比隐式的"0-1分数"提示更稳定.

### 步骤4:CI门

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

作为一个文件发布. 每个 PR 都运行.出现回归.

### 步骤5:从零开始的玩具评估

见`code/main.py`△仅使用stdlib的忠诚性 (回答要求与背景重叠) 和相关性 (回答代币与问题代币重叠) 近似实现 (非生产方案) 展示形状 (非生产方案).

## 陷

- **No calibration.**与人类标签相关性只有0.3 的评判者就是噪声.
- **Self-evaluation.**使用同一个LLM 生成和判断,会把分数 抬高 10-20%──评判使用不同模型家庭──
- **Positional bias in pairwise judging.**评委们偏好了第一展示的选项──始终随机化顺序并两种顺序都跑──
- **Raw aggregate hides failures.**平均分数0.85 往往会隐藏 5% 的灾难性失败──始终检查底部量量──
- **Golden dataset rot.**如果随着时间的推移,会破坏对比.
- **LLM cost.**在规模化场景下,法官称 主导成本――使用能满足校准门的最便宜模型――GPT-4o-mini、Claude Haiku、Mistral-small――

## 使用它

根据第1个单元的规定,

| Use case | Framework |
|---------|-----------|
| RAG quality monitoring | RAGAS（4 metrics） |
| CI/CD regression gates | DeepEval + pytest |
| Custom domain criteria | DeepEval 内的 G-Eval |
| Online live-traffic monitoring | reference-free mode 的 RAGAS |
| Human-in-the-loop spot checks | LangSmith 或 Phoenix，带 annotation UI |
| Red-teaming / safety eval | Promptfoo + DeepEval |

典型堆:RAGAS做监测,深度做CI,G-Eval做新维度──三者都跑;它们的分歧很有用──

## 发布它

保存为`outputs/skill-eval-architect.md`其他:

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

1. **Easy.**在10个带已知幻觉的RAG示例上使用RAGAS──验证忠诚度测量量 能抓到每一个──
2. **Medium.**手工将将 50 个QA答案按正确性标记为 0-1──用G-Eval 打分──测量评判与人类之间的Spearman rho──
3. **Hard.**用DeepEval 构建最好的CI门――故意让检索器回归――验证门 会失败――通过对最低10%做门检查 添加底部量子预警――

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

- [Es et al. (2023). RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217)RAGAS 论文──
- [Liu et al. (2023). G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment](https://arxiv.org/abs/2303.16634) G-Eval 论文。
- [DeepEval docs](https://deepeval.com/docs/metrics-introduction) 开放生产堆──
- [Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685)偏见,校准,限制.
- [MLflow GenAI Scorer](https://mlflow.org/blog/third-party-scorers)集成RAGAS、DeepEval、尼克斯的统一框架──
