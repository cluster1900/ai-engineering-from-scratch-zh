# Avaliação de longo contexto  NIAH, RULER, LongBench, MRCR

> O Gemini 3 Pro 宣称拥有10M tokens的背景──在1M tokens 下,8-针 MRCR 降至26.3%──宣称 ≠可用──Long-context evaluation 会告诉你正在上线的模型的实际容量──

**类型：**- aprendizagem
**语言：**Python
**先修要求：**Fase 5 · 13(Respostas a perguntas)
**时间：**Cerca de 60 minutos

## 问题

Você tem um contrato de 200 páginas. Modelo afirma ter um contexto de tokens de 1M. Você colocou o contrato em um contexto de tokens e perguntou:

Esta é a diferença de capacidade de contexto de 2026: 1M ou 10M. A realidade é que entre 60 e 70% delas são utilizáveis, e que dependem das tarefas.

- **Retrieval（haystack 中的 single needle）：**Em modelos de fronteira, até que o valor máximo da declaração esteja perto da perfeição.
- **Multi-hop / aggregation：**A maioria dos modelos em mais de 128k                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
- **对分散 facts 的 reasoning：**Última missão fracassada.

Avaliação de longo contexto  mede estas dimensões. Esta aula descreve estes padrões de referência ̇ eles realmente medem o que, bem como como como construir um teste de agulha autodeterminada para o seu campo.

## 概念

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack（NIAH，2023）。**Para colocar um fato ((a palavra mágica é o abacaxi) em longo contexto, em posição de profundidade controlada.

**RULER（Nvidia，2024）。**覆盖 4 个类别的 13 种任务类型:retrieval(single / multi-key / multi-value) ]]multi-hop tracing(variable tracking) ]] Aggregação(comun word frequency) ]]QA──context length 可配置(4k até 128k+) ]];; Ele revela os modelos que estão na NIAH 上和但在多hop 上失败的模型──在2024年发布版,17 个声称32k+ context models, apenas metade pode manter a qualidade em 32k──

**LongBench v2（2024）。**503 Cadastras de perguntas de escolha múltipla,8k-2M contextos de palavras,六个任务类别:QA único-doc、Multi-doc QA、longo aprendizado no contexto、longo diálogo、código repo、longo dados estruturados── é usado para o mundo real para o nível de referência de produção de comportamentos de longo contexto──

**MRCR（Multi-Round Coreference Resolution）。**Grande escala de múltiplos turnos de coreferência── contém 8 agulhas、24 agulhas、100 agulhas 变体── exposição modelo 在 Attention 退化前能同时处理多少事实──

**NoLiMa。**Agulha não-léxica──agulha 与 query 没有字面重叠;retrieval 需要一步语义推理──比 NIAH 更难──

**HELMET。**拼接许多文件,并从任意一个中提问──测试 atenção seletiva──

**BABILong。**Vamos colocar cadeias de raciocínio em um "paço de feno" e não apenas recuperar.

###                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

- **Advertised context window。**Número de ordem de cálculo:
- **Effective retrieval length。**NIAH em algum valor abaixo do passagem (por exemplo, 90%)
- **Effective reasoning length。**Multipop ou agregação em que o valor é inferior.
- **Degradation curve。**Precisão vs comprimento de contexto, por tipo de tarefa

Sua configuração precisa de dois números: recuperação-eficaz e raciocínio-eficaz.


```figure
gx-niah-decay
```

## Construí-lo

### Passo 1: Construir auto-definir NIAH para o seu domínio

- Não .`code/main.py`骨架如下:

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

扫描 `depth_ratio`∈ {0, 0,25, 0,5, 0,75, 1,0} × `total_tokens`∈ {1k, 4k, 16k, 64k}── desenhar o mapa de calor── é o modelo objetivo do cartão NIAH──

### Passo 2: agulha múltipla 变体

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

Como estas três palavras mágicas é o que? Essa questão precisa de encontrar todas as três.

### Passo 3: rastreamento de variáveis multi-hop (estilo RULER)

```python
haystack = """X1 = 42. ... (filler) ... X2 = X1 + 10. ... (filler) ... X3 = X2 * 2."""
question = "What is X3?"
```

答案需要串联三次赋值――frontier models 在128k 时,它的精度 经常会降至50-70%──

### Passo 4: em sua pilha para cima de LongBench v2

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

按类别报告精度──Pontos agregados                                                                                                                                                                                                                                                         

## 陷

- **仅 NIAH evaluation。**Em tokens 1M, não pode ser explicado o multi-hop.
- **Uniform depth sampling。**很多实现只测试 depth=0.5──测试 depth=0、0.25、0.5、0.75、1.0, Lost in the middle 效应是真实存在的──
- **与 filler 的 lexical overlap。**Se a agulha e o preenchimento compartilham palavras-chave, a recuperação vai tornar-se muito simples.
- **忽略 latency。**1M-token prompts de preenchimento  necessita de 30-120 segundos ⋅ em precisão ⋅ além de simultaneamente medir tempo-para-primeiro-token ⋅
- **Vendor-self-reported numbers。**OpenAI, Google, Antropic City publicam seus próprios números.

## Use-o

Estaca de 2026:

| 场景 | Benchmark |
|-----------|-----------|
| 快速 sanity check | 3 个 depths × 3 个 lengths 的自定义 NIAH |
| 生产级 model selection | 目标 length 下的 RULER（13 tasks） |
| 真实世界 QA quality | LongBench v2 single-doc-QA subset |
| Multi-hop reasoning | BABILong 或自定义 variable-tracing |
| Conversational / dialogue | 目标 length 下的 MRCR 8-needle |
| Model upgrade regression | 固定的内部 NIAH + RULER harness，在每个新 model 上运行 |

O método de experiência ambiental de produção: em sua duração-alvo, completar a tarefa de raciocínio NIAH + 1 个之前,永远不要信任背景窗口──

## Entrega-o

保存为 `outputs/skill-long-context-eval.md`- Não .

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
2. **Medium。**Adicione uma agulha de 3 变体── medida por comprimento 下是否能找到回全部 3 个──
3. **Hard。**构建一个变量追踪任务(X1 → X2 → X3,3 hops),In Embedding 64k filler 中──测量 3 个边界模型的精度──报告每个模型的有效推理长度──

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
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654) Referência multi-tarefa。
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204) Verdadeiro mundo de longo contexto avaliação。
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666)- É muito difícil.
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149) Raciocínio em palha de feno
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) profundidade-bias 论文。
