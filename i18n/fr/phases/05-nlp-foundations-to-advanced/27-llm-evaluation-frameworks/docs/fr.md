# Évaluation du LLM  RAGAS, DeepEval, G-Eval

> L'évaluation artificielle est impossible à mesurer. L'évaluation de l'équipe de formation est la réponse de l'environnement de production.

**类型：**Construction
**语言：**Python
**前置要求：**Phase 5 · 13 (Réponses à la question), phase 5 · 14 (Récupération des informations)
**时间：**- 75 minutes

##  problématique

Votre système RAG répond: "Le 29 juin 2007".
référence en or est: "29 juin 2007".
Le match exact est de 0, F1 est de 75%.

Il faut un évaluateur: il comprend le sens, peut fonctionner à faible coût, ne pas mentir en régression, et ne pas exposer les modes d'échec corrects.

En 2026, trois cadres seront mis en place pour diriger ce problème.

- **RAGAS.**Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Résumé: Rés
- **DeepEval.**面向 LLMs  Pytest──G-Eval─complément des tâches―hallucination―bias métriques──CI/CD-native──
- **G-Eval.**Une méthode (deep-evall metric): avec une chaîne de pensée, des critères de définition personnelle, un score de 0 à 1 pour le LLM en tant que juge.

Les trois sont dépendants de la loi comme juge. Cette formation vous permettra de construire une intuition de la méthode et de la couche de confiance qui l'entoure.

## 概念

![四个 evaluation dimensions，LLM-as-judge 架构](../assets/llm-evaluation.svg)

**LLM-as-judge.**Utiliser un LLM selon la rubrique 给输出打分, remplacement métrique statique 给定 `(query, context, answer)`"Un juge de la loi: "Un score de 0 à 1 sur la fidélité".

Pourquoi est-ce efficace: les LLM peuvent être très peu coûteux, comme les jugements artificiels ?$0.003 的成本，让 1000-sample regression eval run 成本低于 $5 ∞

Pourquoi ça va échouer ?

1. **Judge bias.**Les juges  réponse préférentielle  réponse de leur propre famille de modèle  ainsi que réponse de style de correspondance rapide 
2. **JSON parsing failures.**错误 JSON → NaN score → 被静默排除在 agregate 之外──RAGAS Utilisateur très familier avec ce type de point de souffrance──Utilisez essayer/sauf + 显式失败模式做 gate──
3. **Drift over model versions.**Le juge de niveau va changer chaque métrique.

**RAG 四件套。**

| Metric | 问题 | Backend |
|--------|----------|---------|
| Faithfulness | 答案中的每个 claim 是否来自 retrieved context？ | 基于 NLI 的 entailment |
| Answer relevance | 答案是否回应了问题？ | 从答案生成 hypothetical questions；与真实问题比较 |
| Context precision | 在 retrieved chunks 中，有多少比例相关？ | LLM-judge |
| Context recall | retrieval 是否返回了所需的一切？ | LLM-judge 对照 gold answer |

**G-Eval.**Définir un critère auto-défini:"La réponse cite-t-elle la source correcte?" cadre 会自动扩展为链思想评估步骤, puis donner un score 0−1.

**Calibration.**Dans le cas d'un juge, il est nécessaire de modifier la rubrique de votre juge si la rubrique de votre juge est < 0,7.


```figure
n5-judge-gauge
```

## - Je le construis.

### 步骤 1: utiliser NLI faire la fidélité (à la manière de Ragas)

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

Pour les déclarations atomiques, la réponse sera décomposée.

### 步骤 2: réponse de la pertinence

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

Si la réponse suggère une question différente de la question réelle, la pertinence diminue.

### 步骤 3: G-Eval métrique de définition personnelle

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

Les étapes d'évaluation sont les rubriques.

### 步骤 4: Porte de l' IC

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

### Étape 5: Évaluation du jouet à partir de zéro

Je vous en prie .`code/main.py` utiliser uniquement la fidélité de la solution  les revendications de réponse et le contexte de superposition) et la pertinence  les jetons de réponse et les jetons de question de superposition)

## La trappe

- **No calibration.**Avec les étiquettes humaines 相关性 只有 0.3 的评判 就是噪声──上线前要求校准运──
- **Self-evaluation.**Utiliser le même LLM 生成和判断,会把分 抬高 10-20%──判断 使用不同模型家族──
- **Positional bias in pairwise judging.**Les juges préfèrent les premières séries.
- **Raw aggregate hides failures.**Points moyens 0,85 往往会隐藏 5% de défaillances catastrophiques──始终检查底量──
- **Golden dataset rot.**Les ensembles d'évaluation non éditionnés, si le temps dérive, détruira le rapport.
- **LLM cost.**Dans un scénario de dimensionnement, le juge appelle le principal coût.

## Utilisez-le

L'étape 2026:

| Use case | Framework |
|---------|-----------|
| RAG quality monitoring | RAGAS（4 metrics） |
| CI/CD regression gates | DeepEval + pytest |
| Custom domain criteria | DeepEval 内的 G-Eval |
| Online live-traffic monitoring | reference-free mode 的 RAGAS |
| Human-in-the-loop spot checks | LangSmith 或 Phoenix，带 annotation UI |
| Red-teaming / safety eval | Promptfoo + DeepEval |

典型堆:RAGAS faire la surveillance,DeepEval faire CI,G-Eval faire la nouvelle dimension,

##  La publier

保存为 `outputs/skill-eval-architect.md`- Le numéro de la liste:

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

1. **Easy.**Dans 10 exemples RAG d'hallucinations connues, utilisez RAGAS pour vérifier la fidélité de la métrique.
2. **Medium.**手工将 50 个 QA réponses 按正确性 标注为 0-1──用 G-Eval 打分──测量评师与人类 间Spearman rho──
3. **Hard.**Utiliser DeepEval Construire le plus petit portail CI―故意让retriever regresses―验证网 会失败―通过对最低10%做门检查 添加底量子预警―

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
- [Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) préjugés, calibration, limites
- [MLflow GenAI Scorer](https://mlflow.org/blog/third-party-scorers) 集成 RAGAS、DeepEval、Phoenix 
