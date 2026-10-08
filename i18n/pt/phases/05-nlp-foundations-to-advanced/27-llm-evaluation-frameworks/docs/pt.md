# Avaliação do Mestrado em Direito Jurídico  RAGAS, DeepEval, G-Eval

> O teste de avaliação artificial não pode ser dimensionado. O LLM como juiz é a resposta para o ambiente de produção.

**类型：**Construção
**语言：**Python
**前置要求：**Fase 5 · 13 (Resposta à pergunta), Fase 5 · 14 (Recebida de informações)
**时间：**- 75 minutos.

## 问题

Seu RAG 系统 respondeu: "29 de junho de 2007".
Referência em ouro é: "29 de Junho de 2007".
A correspondência exacta ganha 0, F1 ganha cerca de 75%, Artificial ganha 100%.

Agora, multiplicem-se 10 mil testes de uso. Agora, multiplicem-se cada vez que o retriever, o chunking, o prompt ou o modelo mudam.

Em 2026 haverá três estruturas que orientarão este problema.

- **RAGAS.**Avaliação de ASsment de Geração Aumentada de Recuperação.
- **DeepEval.**面向 LLMs 的 Pytest──G-Eval──task-completion──hallucinação──bias metrics──CI/CD-native──
- **G-Eval.**一种方法(也是DeepEval metric):带链思维、自定义标准、0-1 score of LLM-as-judge──

Três pessoas dependem do LLM como juiz. Esta aula irá construir a sua percepção sobre o método e sobre a sua camada de confiança.

## 概念

![四个 evaluation dimensions，LLM-as-judge 架构](../assets/llm-evaluation.svg)

**LLM-as-judge.**Usar um LLM em função da rubrica 给输出打分, substituir métricas de estado estático 给定 `(query, context, answer)`"Ponto, um juiz LLM:"Colo 0-1 na fidelidade".

Por que é eficaz: LLMs podem ser de baixo custo, como um julgamento artificial.$0.003 的成本，让 1000-sample regression eval run 成本低于 $5 

Por que vai falhar silenciosamente:

1. **Judge bias.**Os juízes  respostas preferentes  respostas de sua própria família modelo  bem como respostas de estilo de correspondência rápida 
2. **JSON parsing failures.**错误 JSON → NaN score → 被静默排除在 agregado 之外──RAGAS User户很熟悉这种痛点──用试/except + 显式失败模式做门──
3. **Drift over model versions.**Juez de graduação vai mudar cada métrica.

**RAG 四件套。**

| Metric | 问题 | Backend |
|--------|----------|---------|
| Faithfulness | 答案中的每个 claim 是否来自 retrieved context？ | 基于 NLI 的 entailment |
| Answer relevance | 答案是否回应了问题？ | 从答案生成 hypothetical questions；与真实问题比较 |
| Context precision | 在 retrieved chunks 中，有多少比例相关？ | LLM-judge |
| Context recall | retrieval 是否返回了所需的一切？ | LLM-judge 对照 gold answer |

**G-Eval.**Definir um critério auto-definido:"A resposta cita a fonte correta?" framework 会自动扩展为链思维评估步骤,然后给出0-1 score──适合RAGAS未覆盖的域特定质量尺寸──

**Calibration.**Em não há nenhuma relação com os rótulos humanos. Em primeiro lugar, nunca fique confiante no resultado original do juiz.


```figure
n5-judge-gauge
```

## Construí-lo

### 步骤 1: Use NLI fazer fidelidade (estilo RAGAS)

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

将答案拆解为原子索赔――用 NLI 检查每个索赔 是否被回收文本 支持――Fidelidade = 被支持比例――

### 步骤 2: relevância da resposta

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

Se a resposta sugerir que a questão é diferente da pergunta real, a relevância vai diminuir.

### 步骤 3: G-Eval auto-definir métrica

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

A avaliação das medidas é a rubrica.

### 步骤 4: Porta CI

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

Como um arquivo de dados, cada um dos relatórios é executado, e as regressões ocorrem, para impedir a fusão.

### 步骤 5: Avaliação de brinquedos desde o zero

- Não .`code/main.py` apenas utilizar a fidelidade de um sistema de resposta (realidade) e relevância (realidade)  os tokens de resposta e os tokens de pergunta (realidade)  não são um sistema de produção  forma de demonstração 

## 陷

- **No calibration.**Com os rótulos humanos 相关性 只有 0.3 的评判 就是噪声──上线前要求校准运──
- **Self-evaluation.**Utilize o mesmo LLM 生成和判断,会把分 抬高 10-20%──juiz Utilize different model family──
- **Positional bias in pairwise judging.**Os juízes preferem a primeira apresentação.
- **Raw aggregate hides failures.**Ponto médio 0,85 往往会隐藏 5% de falhas catastróficas──始终检查底量──
- **Golden dataset rot.**Se o tempo se deslocar, destruirá a comparação.
- **LLM cost.**Em escalação, o juiz chama o custo principal. Utilize ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener ener é.

## Use-o

Estaca 2026:

| Use case | Framework |
|---------|-----------|
| RAG quality monitoring | RAGAS（4 metrics） |
| CI/CD regression gates | DeepEval + pytest |
| Custom domain criteria | DeepEval 内的 G-Eval |
| Online live-traffic monitoring | reference-free mode 的 RAGAS |
| Human-in-the-loop spot checks | LangSmith 或 Phoenix，带 annotation UI |
| Red-teaming / safety eval | Promptfoo + DeepEval |

典型堆:RAGAS fazer monitoramento,DeepEval fazer CI,G-Eval fazer nova dimensão,三者都跑;

##  Publicá-lo

保存为 `outputs/skill-eval-architect.md`- Não .

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

1. **Easy.**Em 10 exemplos RAG de alucinações já conhecidas, use RAGAS.
2. **Medium.**手工将 50 个 QA respostas 按正确性 标注为 0-1──用 G-Eval 打分──测量评师与人类 间Spearman rho──
3. **Hard.**Usar DeepEval Construir o melhor portão CI―故意让retriever regress―验证 gate 会失败―通过对最低10%做门检查 添加底量子预警―

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
- [Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) preconceitos  calibração  limites 
- [MLflow GenAI Scorer](https://mlflow.org/blog/third-party-scorers) 集成 RAGAS、DeepEval、Phoenix 
