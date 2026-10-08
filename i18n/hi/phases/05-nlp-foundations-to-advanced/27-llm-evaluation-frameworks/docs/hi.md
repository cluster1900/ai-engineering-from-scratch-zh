# LLM मूल्यांकन  RAGAS, DeepEval, G-Eval

> सटीक मैच 和 F1 会漏掉语义等价――人工评审无法规模化――LLM-as-judge is the answer to the production environment  前提是有足够的校准,让你能信任这个数字──

**类型：**构建
**语言：**पायथन
**前置要求：**चरण 5 · 13 (प्रश्न का उत्तर), चरण 5 · 14 (सूचना प्राप्त करना)
**时间：**~ 75 मिनट

## 问题

आपका RAG 系统 उत्तरः "29 जून, 2007"
सोने का संदर्भ है:"29 जून 2007"
सटीक मैच 0... F1... 75%... 100%...

现在乘以10,000 测试用例──再乘以回收器,chunking,prompt,or model 的每一次变化──你需要一个评价者:它理解意义,能低成本规模化运行,不会在回归上撒谎,并能暴露正确的失败模式──

2026 में इस मुद्दे को तीन ढांचे से संबोधित किया जाएगा।

- **RAGAS.**रिट्रीवल-एगमेंटेड जनरेशन एएसएसमेंट──四个RAG मेट्रिक्स(निष्ठा、उत्तर-सान्दर्भिकता、सापेक्ष-सटीक、सापेक्ष-स्मरण),带有 NLI + LLM-जजज बैकेंड──研究支,轻量──
- **DeepEval.**面向 LLMs के Pytest──G-Eval──कार्य-पूराकरण──हल्लूसिनाशन──bias metrics──CI/CD-native──
- **G-Eval.**एक प्रकार का तरीका (DeepEval metric): लेट सोच-श्रृंखला, स्व-परिभाषित मानदंड, 0-0 स्कोर का LLM-as-judge

इस कोर्स में आपको इस विधि के बारे में और इसके आसपास के विश्वास के स्तर के बारे में जानकारी मिलेगी।

## 概念

![四个 evaluation dimensions，LLM-as-judge 架构](../assets/llm-evaluation.svg)

**LLM-as-judge.**एक LLM के आधार पर rubric 给输出打分, प्रतिस्थापन स्थैतिक मीट्रिक 给定 `(query, context, answer)`, शीघ्र एक न्यायाधीश LLM:"निष्ठा पर 0-1 स्कोर. "

क्यों यह प्रभावी हैःLLMs  बेहद कम लागत में कृत्रिम निर्णयों की तरह  GPT-4o-mini से प्रत्येक स्कोर किए गए मामले $0.003 的成本，让 1000-sample regression eval run 成本低于 $5 

क्यों यह चुपचाप विफल होगाः

1. **Judge bias.**न्यायाधीश  पसंद से अधिक उत्तर  अपने स्वयं के मॉडल परिवार से उत्तर  तथा उपयुक्त शीघ्र शैली 
2. **JSON parsing failures.**错误 JSON → NaN score → 被静默排除在集体之外──RAGAS उपयोगकर्ता इस तरह की दर्द बिंदुओं को बहुत परिचित──用 try/except + 显式 विफलता मोड做 gate──
3. **Drift over model versions.**升级法官 会改变每一个指标──结法官模型+版本──

**RAG 四件套。**

| Metric | 问题 | Backend |
|--------|----------|---------|
| Faithfulness | 答案中的每个 claim 是否来自 retrieved context？ | 基于 NLI 的 entailment |
| Answer relevance | 答案是否回应了问题？ | 从答案生成 hypothetical questions；与真实问题比较 |
| Context precision | 在 retrieved chunks 中，有多少比例相关？ | LLM-judge |
| Context recall | retrieval 是否返回了所需的一切？ | LLM-judge 对照 gold answer |

**G-Eval.** define a self-defined criterion:"क्या उत्तर सही स्रोत का उल्लेख करता है?" framework 会自动扩展为链思想评估步骤,然后给出0-1 स्कोर──适合RAGAS未覆盖的域特定质量尺寸──

**Calibration.**⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒     ⇒                                                                                                                      


```figure
n5-judge-gauge
```

##  इसे निर्माण

### 步骤 1: NLI का प्रयोग करें निष्ठा (RAGAS शैली)

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

                                                                                                                                                                                                                                                              

### 步骤 2: उत्तर प्रासंगिकता

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

यदि प्रश्न का उत्तर वास्तविक प्रश्न से भिन्न है, तो प्रासंगिकता कम हो जाती है।

### 步骤 3: G-Eval स्वतः परिभाषित मीट्रिक

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

मूल्यांकन चरणों में यह है कि अनुच्छेदों में स्पष्ट कदमों से गुप्त "स्कोर 0-1" संकेतों में अधिक स्थिर है।

### 步骤 4: आईसी गेट

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

作为 pytest file 发布── प्रत्येक PR 都运行──出现回归──时阻止合并──

### 步骤 5: शून्य से शुरू से खिलौना मूल्यांकन

见 `code/main.py`◊ केवल उपयोग करना ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊  ◊ ◊ ◊     ◊                                                                                                                                                                                                  

## 陷

- **No calibration.**मानव लेबल के साथ 相关性 केवल 0.3 का न्यायाधीश है
- **Self-evaluation.**प्रयोग एक ही LLM 生成和判断,会把分 抬高 10-20%──判断 使用不同模型家族──
- **Positional bias in pairwise judging.**न्यायाधीशों ने पहले प्रदर्शन के विकल्पों को प्राथमिकता दी।
- **Raw aggregate hides failures.**औसत स्कोर 0.85 往往会藏藏 5% की आपदा विफलताएँ──始终检查底量──
- **Golden dataset rot.**अनविसारकृत मूल्यांकन सेट यदि समय के साथ-साथ, विपरीत दिशा में तुलना को नष्ट कर देगा।
- **LLM cost.**बड़े पैमाने पर परिदृश्य में, न्यायाधीश मुख्य लागत को कॉल करता है।

## इसका उपयोग करें

2026 स्टैकः

| Use case | Framework |
|---------|-----------|
| RAG quality monitoring | RAGAS（4 metrics） |
| CI/CD regression gates | DeepEval + pytest |
| Custom domain criteria | DeepEval 内的 G-Eval |
| Online live-traffic monitoring | reference-free mode 的 RAGAS |
| Human-in-the-loop spot checks | LangSmith 或 Phoenix，带 annotation UI |
| Red-teaming / safety eval | Promptfoo + DeepEval |

典型堆:RAGAS करना निगरानी,DeepEval करना CI,G-Eval करना नई आयाम──三者都跑;它们的分歧很有用──

##  इसे जारी करें

保存为 `outputs/skill-eval-architect.md`:

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

## अभ्यास

1. **Easy.**10 个带已知幻觉的RAG उदाहरण 上使用RAGAS──验证忠诚度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度度 के साथ,
2. **Medium.**手工将 50 个 QA उत्तर 按正确性 标注为 0-1──用 G-Eval 打分──测量评判与人类 间Spearman rho──
3. **Hard.**प्रयोग करें DeepEval 构建 pytest CI गेट──故意让检测器退后──验证 गेट 会失败──通过对最低10%做门值检查 添加底量子式警报──

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

- [Es et al. (2023). RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217) RAGAS 论文──
- [Liu et al. (2023). G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment](https://arxiv.org/abs/2303.16634) G-Eval 论文。
- [DeepEval docs](https://deepeval.com/docs/metrics-introduction) 开放生产 stack──
- [Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) पूर्वाग्रह कालिब्रेशन सीमाएँ
- [MLflow GenAI Scorer](https://mlflow.org/blog/third-party-scorers) 集成 RAGAS、DeepEval、फीनिक्स का एकीकरण ढांचा──
