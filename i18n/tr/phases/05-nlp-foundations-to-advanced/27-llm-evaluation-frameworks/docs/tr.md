# LLM Değerlendirme  RAGAS, DeepEval, G-Eval

> F1'de yapılan tesadüfenin en iyi sonuçları ise, bu sayıyı güvence altına almak için yeterli bir kalibrin olmasıdır.

**类型：**Yapım
**语言：**Python
**前置要求：**5 · 13 aşaması (Soru yanıtlama), 5 · 14 aşaması (Mağlumat alımı)
**时间：**~ 75 dakika

## 问题

Senin RAG 系统 cevabı: "29 Haziran 2007".
Altın referans ise: "29 Haziran 2007".
Tam maç 0... F1 %75... %100'e veriliyor.

Şimdi 10.000 test kullanımı örneği tekrar tekrar tekrar geri alınması, parçalanması, hızlandırılması veya modelin her bir değişiminde bir değerlendirmeci gerekir: anlamını anlayabilir, düşük maliyetli ölçekli çalışmayı yapabilir, geri dönüşte yalan söylemeyecektir, doğru başarısızlık modlarını ortaya koyabilir.

2026 yılında üç çerçeve vardır.

- **RAGAS.**Retrieval-Augmented Generation ASsessment──四个RAG metrics──忠诚度、回答-relevance、文本精度、文本回忆),带有 NLI + LLM-juj backend──研究支,轻量──
- **DeepEval.**面向 LLM'lerin Pytest──G-Eval──task-completion──halüsinasyon─bias metrikleri──CI/CD-native──
- **G-Eval.**Bir çeşit yöntem: DeepEval metrik:带-chain-of-thought、self-definition criteria、0-1 puanı

Üç kişi, LLM'den hakim olarak etkilenir. Bu ders, bu yöntemle ilgili ve çevresindeki güven katmanının içgüdülerini kurar.

## 概念

![四个 evaluation dimensions，LLM-as-judge 架构](../assets/llm-evaluation.svg)

**LLM-as-judge.**Bir LLM ile, bir metrik değiştirmek için bir metrik kullanın.`(query, context, answer)`"Yarıncı, 1 puan"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

Neden etkili: LLM'ler çok düşük maliyetle yapay yargıya benzer.$0.003 的成本，让 1000-sample regression eval run 成本低于 $5..

Neden bu sessiz başarısız olur:

1. **Judge bias.**Yargıçlar  tercih edilen daha uzun cevaplar  kendi model ailesi tarafından verilen cevaplar  ve uyumlu hızlı stil cevapları 
2. **JSON parsing failures.**错误 JSON → NaN skor → 被静默排除在 agregate 之外──RAGAS kullanıcı bu tür acı noktaları çok iyi bilir──用试/except + 显式失败模式做门──
3. **Drift over model versions.**升级法官 会改变每个尺度──结法官模型 +版本──

**RAG 四件套。**

| Metric | 问题 | Backend |
|--------|----------|---------|
| Faithfulness | 答案中的每个 claim 是否来自 retrieved context？ | 基于 NLI 的 entailment |
| Answer relevance | 答案是否回应了问题？ | 从答案生成 hypothetical questions；与真实问题比较 |
| Context precision | 在 retrieved chunks 中，有多少比例相关？ | LLM-judge |
| Context recall | retrieval 是否返回了所需的一切？ | LLM-judge 对照 gold answer |

**G-Eval.**定義一个自定义标准:" cevabın doğru kaynağı belirtti mi?" çerçevesini otomatik olarak düşünce zinciri değerlendirme adımları için genişletir, sonra 0-1 puanı verir.

**Calibration.**İnsan etiketleri ile ilişkisi yok. İlk yargıç skorunu asla güvenme.


```figure
n5-judge-gauge
```

## Yapın onu.

### 步骤 1: NLI kullanın vefalılık yapın (RAGAS tarzı)

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

Bu soruların cevaplarını atom iddialarına ayırmak için kullanın.

### 步骤 2: cevapların uygunluğu

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

Eğer cevaplar gerçek soruların yanı sıra farklı bir soru ortaya koyuyorsa, önem azalır.

### 步骤 3: G-Eval kendini tanımlama metrik

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

değerlendirme adımları, işte rubrik.

### 4 adım: CI kapısı

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

### 5 adım: Oyuncak değerlendirme

Görüyorum .`code/main.py`△ sadece stdlib'in sadakatini kullanmak △ yanıt iddiaları ve bağlamın üst üste geçmesi △ ve ilgililik △ yanıt simgelerinin ve soru simgelerinin üst üste geçmesi △ yakınlaştırma △ üretim programı △ gösterim biçimi △

## 陷

- **No calibration.**İnsan etiketleri ile ilgili olarak sadece 0.3'ün yargıçı vardır.
- **Self-evaluation.**Aynı LLM'yi kullanmak, puanları %10-20 oranında yükseltmek ve farklı model ailelerini kullanmak.
- **Positional bias in pairwise judging.**Yargıçlar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
- **Raw aggregate hides failures.**Ortalama puan 0.85 往往会藏藏 5% ′ın felaket başarısızlıkları──始终检查底量──
- **Golden dataset rot.**Sürümsüz değerleme setleri, zaman akışıyla, tüm oranları bozacaktır.
- **LLM cost.**Ölçeklendirme sahnesinde, yargıç 主导成本──使用能满足校准门的最便宜模型──GPT-4o-mini、Claude Haiku、Mistral-small──

## Kullan

2026 yığın:

| Use case | Framework |
|---------|-----------|
| RAG quality monitoring | RAGAS（4 metrics） |
| CI/CD regression gates | DeepEval + pytest |
| Custom domain criteria | DeepEval 内的 G-Eval |
| Online live-traffic monitoring | reference-free mode 的 RAGAS |
| Human-in-the-loop spot checks | LangSmith 或 Phoenix，带 annotation UI |
| Red-teaming / safety eval | Promptfoo + DeepEval |

典型堆:RAGAS yapmak, gözlem yapmak, DeepEval yapmak CI, G-Eval yapmak, yeni boyutlarda olmak, üç kişi de koşmak; onların ayrılığı çok yararlıdır.

## Yayınla

保存为 `outputs/skill-eval-architect.md`- ...

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

1. **Easy.**10 个带已知幻觉的RAG örnekleri 上使用RAGAS──验证忠诚度度测量 能抓到每一个──
2. **Medium.**手工将 50 个 QA cevapları 按正确性 标注为 0-1──用 G-Eval 打分──测量评员与人类 间Spearman rho──
3. **Hard.**DeepEval'i kullanın. En iyi CI kapısı oluşturun.

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
- [DeepEval docs](https://deepeval.com/docs/metrics-introduction) 开放生产 stack──
- [Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) önyargılar、kalibre ∞ sınırlar¬
- [MLflow GenAI Scorer](https://mlflow.org/blog/third-party-scorers) 集成 RAGAS、DeepEval、Phoenix'in birleşik çerçevesidir。
