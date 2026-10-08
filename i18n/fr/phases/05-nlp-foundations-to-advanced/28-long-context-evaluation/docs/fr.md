# Évaluation à long terme  NIAH, RULER, LongBench, MRCR

> Gemini 3 Pro 宣称拥有10M代币的背景──在1M代币下,8-针 MRCR 降至26.3%──宣称 ≠可用──长文文评估 会告诉你正在上线的模型的实际容量──

**类型：**Apprendre à apprendre
**语言：**Python
**先修要求：**Phase 5 · 13  Réponses à la question  Phase 5  23  Stratégies de déchiquetage)
**时间：**À environ 60 minutes.

##  problématique

Vous avez un contrat de 200 pages. Le modèle affirme avoir un contexte de 1M de jetons. Vous avez mis le contrat dans un contexte de 1M de jetons.

C'est le décalage de la capacité de contexte de 2026: 1M ou 10M. La situation actuelle est que 60 à 70% des capacités sont disponibles, et dépendent de la tâche.

- **Retrieval（haystack 中的 single needle）：**Dans les modèles frontaliers, jusqu'à ce que la plus grande valeur de la déclaration soit proche de la perfection.
- **Multi-hop / aggregation：**La plupart des modèles ont connu une baisse spectaculaire après environ 128 000 exemplaires.
- **对分散 facts 的 reasoning：**La première mission échouée.

L'évaluation à long terme  mesure ces dimensions. Cette leçon expliquera ces critères de référence  ce qu'ils mesurent réellement, ainsi que la façon de construire un test d'aiguille autodéfinie pour votre domaine.

## 概念

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack（NIAH，2023）。**Pour mettre un fait, le mot magique est "ananas" dans un contexte long, en position de profondeur contrôlable.

**RULER（Nvidia，2024）。**覆盖 4 个类别的 13 种任务类型:retrieval(single / multi-key / multi-value)、multi-hop tracing(variable tracking)、aggregation(common word frequency)、QA──context length 可配置(4k到128k+)──Il révélera les modèles qui ont échoué dans le NIAH 上和但在多hop 上── dans la version publiée en 2024,17 个声称 32k+ context models, seulement la moitié pourra maintenir la qualité en 32k──

**LongBench v2（2024）。**503 Codes de choix multiples, 8k-2M de contextes de mots, 6 tasques: un seul document QA, QA multi-doc, long apprentissage en contexte, long dialogue, code repo, long données structurées, il est utilisé pour la production de niveaux de référence de comportements dans le monde réel dans un contexte long.

**MRCR（Multi-Round Coreference Resolution）。**La base de référence à plusieurs tours à grande échelle, comprenant 8 aiguilles, 24 aiguilles, 100 aiguilles, est un modèle de mise en évidence.

**NoLiMa。**Neige non léxicale──neige avec requête 没有字面重叠; récupération 需要一步语义推理──比 NIAH 更难──

**HELMET。**拼接许多文件,并从任意一个中提问――测试 attention sélective──

**BABILong。**Pour les autres, il faut se concentrer sur la recherche de la solution.

###  réellement devrait rapporté

- **Advertised context window。**Numéro de la liste de règles
- **Effective retrieval length。**NIAH dans une certaine valeur de détail (par exemple 90%)
- **Effective reasoning length。**Les taux de conversion sont les suivants:
- **Degradation curve。**Accuracité par rapport à la longueur du contexte, selon les tâches de type séparément dessinée.

Vous avez besoin de deux chiffres: récupération-efficacité et raisonnement-efficacité.


```figure
gx-niah-decay
```

## - Je le construis.

### Étape 1: Construire un NIAH auto-défini pour votre domaine

Je vous en prie .`code/main.py`骨架如下:

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

扫描 `depth_ratio`∈ {0, 0, 25, 0, 5, 0, 75, 1,0} × `total_tokens`∈ {1k, 4k, 16k, 64k}──dessin d'une carte thermique──this est la carte NIAH du modèle objectif──

### Étape 2: multi-aiguille 变体

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

Comme ces trois mots magiques, c'est quoi ? Ce genre de questions doit retrouver les trois.

### Étape 3: traçabilité des variables multi-hop (à la manière de RULER)

```python
haystack = """X1 = 42. ... (filler) ... X2 = X1 + 10. ... (filler) ... X3 = X2 * 2."""
question = "What is X3?"
```

La précision des modèles frontaliers est souvent réduite de 50 à 70% en 128K.

### Étape 4: Dans votre pile de fonctionnement LongBench v2

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

按类别报告精度──Précédents globaux de résultats

## La trappe

- **仅 NIAH evaluation。**Dans les jetons 1M, la NIAH n'est pas disponible pour les tests multi-hop.
- **Uniform depth sampling。**很多实现只测试深度=0.5──测试深度=0、0.25、0.5、0.75、1.0, Lost in the middle效应是真实存在的──
- **与 filler 的 lexical overlap。**Si l'aiguille et le remplissage partagent des mots clés, la récupération deviendra très simple.
- **忽略 latency。**Les prélèvements de jetons 1M nécessitent 30 à 120 secondes de précision en même temps que la mesure du temps à la première jeton.
- **Vendor-self-reported numbers。**OpenAI, Google, Anthropic publient leur propre code.

## Utilisez-le

Stack de l'année 2026:

| 场景 | Benchmark |
|-----------|-----------|
| 快速 sanity check | 3 个 depths × 3 个 lengths 的自定义 NIAH |
| 生产级 model selection | 目标 length 下的 RULER（13 tasks） |
| 真实世界 QA quality | LongBench v2 single-doc-QA subset |
| Multi-hop reasoning | BABILong 或自定义 variable-tracing |
| Conversational / dialogue | 目标 length 下的 MRCR 8-needle |
| Model upgrade regression | 固定的内部 NIAH + RULER harness，在每个新 model 上运行 |

Le principe de l'expérience en milieu de production: dans la longueur de l'objectif, compléter la tâche de raisonnement NIAH + 1  before, never never trust in context window。

## Je le livre.

保存为 `outputs/skill-long-context-eval.md`- Le numéro de la liste:

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

1. **Easy。**构建一个3 个深度(0.25、0.5、0.75) × 3 个长度(1k、4k、16k) de NIAH──在任意模型上运行──将通过率 绘制成3×3热图──
2. **Medium。**Ajouter une 3 aiguille 变体── mesure chaque longueur 下是否能找到回全部 3 个──与相同长度的单针通过率对比──
3. **Hard。**构建一个变量追踪任务(X1 → X2 → X3,3 hops),Introduction du remplissage 64k 中──测量 3 个边界模型的精度──报告每个模型的有效推理长度──

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

- [Kamradt (2023). Needle in a Haystack analysis](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) 原始 NIAH repo¬
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654) référence multi-tasks。
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204) Réelle-Monde évaluation dans le long contexte
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666) 更难的针
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149) raisonnement dans le pavé de foin。
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) préjugés de profondeur 论文。
