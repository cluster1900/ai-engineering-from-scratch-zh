# Agente 可观测性: Langfuse, Phoenix, Opik

> Três agentes de código aberto 可观测性平台主导了 2026 年──Langfuse (MIT)  Mês 6M+ instalações, rastreamento + gestão de prompt + evals + replay de sessão──Arize Phoenix (Elastic 2.0)  Deep入的代理 专用 evals、RAG 相关性、OpenInference auto-instrumentation──Comet Opik (Apache 2.0)  Automatização de prompt 优化、guardrails、LLM-judge 幻觉检测──

**类型：**- aprendizagem
**语言：**Python (stdlib)
**前置要求：**Fase 14 · 23 (OTel GenAI)
**时间：**Cerca de 45 minutos

## Objectivo de aprendizagem

- Expõe três principais plataformas de código aberto de Agente e licença.
- 区分每个平台最擅长的方面:Langfuse (seções de mgmt + rápidas) Fenix (RAG + auto-instrumentamento) Opik (optimização + guardrails) 
- Explicação de porquê: até 2026, 89% dos relatórios organizacionais já estão implantados em Agente de Observação.
- 实现一个带有LLM-judge 评估的 stdlib trace-to-dashboard pipeline──

## 问题

OTel GenAI ((Lessão 23) deu-lhe um esquema. Você ainda precisa de uma plataforma para ingerir períodos de tempo, operar avaliações, armazenar versões rápidas e expor regressões.

## 核心概念

### Langfuse (MIT)

- Cada mês 6M+ SDK instala 19k+ estrelas GitHub.
- Função:tracing、带 versioning + prompt management of playground、 avaliação(LLM-as-judge、user反、自定义)、sessions replacements──
- 2025 年 6 月:原先的商业模块(LLM-as-a-judge、 anotações filas、prompto experimentos、Playground) em MIT abaixo código aberto。
- O melhor é:带紧密快速管理循环 的端到端可观测性.

### Arize Phoenix (Licença Elastica 2.0)

- Mais aprofundado Agente 专用评估: trace clustering、anomalia detection、 face to RAG relevância de recuperação
- Origins OpenInference auto-instrumentamento
- A versão de gestão da Arize AX  Co-opted for production―
- 没有快速版本  定位是与更广泛平台配合使用的漂移/行为-regression 工具── 定位是与更广泛平台配合使用的漂移/行为-regression 工具── 定位是与更广泛平台配合的使用的漂移/行为-regression 工具── 定位是与更广泛平台配合的使用的漂移/行为-regression 工具── 定位是与更广泛平台配合的使用的工具── 定位是与更广泛平台配合的使用的漂移/行为-regression 工具──
- Última vez: RAG 相关性、drift comportamental、detecção de anomalias―

### Cometa Opik (Apache 2.0)

-  através de experimentos A/B                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
- Guardrails (Redigir as PII, restrições tópicas)
- Juez de LLM 幻觉检测。
- Comentários de Cometa  auto-medida: Opik logs + evals Us时 23.44s, enquanto Langfuse é 327.15s (cerca de 14x diferença)  vai fornecer benchmarks 视为方向性参考
- O melhor que podemos fazer é: o ciclo de otimização, a experimentação automática, a aplicação de proteção.

### Dados do setor

根据Maksim(2026 Field Analysis):89% das organizações já enviaram Agente 可观测性; problemas de qualidade são os principais obstáculos à produção (32% dos entrevistados mencionam-nos)

### 如何选择

| 需求 | 选择 |
|------|------|
| 带 prompt management 的一体化方案 | Langfuse |
| 深度 RAG 评估 + drift | Phoenix |
| 自动化 optimization + guardrails | Opik |
| 开放 license，不要 ELv2 | Langfuse (MIT) 或 Opik (Apache 2.0) |
| Datadog / New Relic 集成 | 任意 — 它们都导出 OTel |

### Este é um lugar fácil de sair

- **没有 eval strategy。**Não há rastreamento de avaliação, só é uma exploração de madeira cara.
- **没有 grounding 的自建 LLM-judge。**Padrão crítico (LECÇÃO 05) 适用  juízes 需要外部工具进行事实验证──
- **Prompt versions 没有关联到 traces。**Quando o prod aparece a regressão, não consegues dividir até o momento em que a questão é causada.


```figure
wb-trace-ingest
```

## Construí-lo

`code/main.py`实现 um colector de rastos de STDlib + avaliador de juízes de LLM:

- Ingest GenAI 形态的跨度──
- 按会议 分组,标记失败 runs (segundo sessão, marcadores de derrotas)
- Um juiz de LLM com guião, em conformidade com a rubrica Respostas de Agentes 评分──
- 类似仪表板的概述:rate of failure,top fail reasons,equivalent score distribution,

运行:

```
python3 code/main.py
```

输出: pontuações de avaliação de cada sessão e categorização de falhas, com concordância com o conteúdo do Langfuse/Phoenix/Opik 会展示.

## Use-o

- **Langfuse**auto-hosted ou em nuvem; através de OTel ou de SDK 接入.
- **Arize Phoenix**Auto-hosted;auto-instrument OpenInference。
- **Comet Opik**auto-hosted ou em nuvem; ciclo de otimização de automação.
- **Datadog LLM Observability**适合已运行 Datadog's混合 ops+ML 团队。

## Entrega-o

`outputs/skill-obs-platform-wiring.md`选择一个平台,并将追踪 + evals + prompt versions 接入现有代理──

## 练习

1. Vai levar os traços do OTel para a nuvem Langfuse. Que sessões falharam?
2. Para o seu campo escrever uma rubrica de juízes de LLM ((( фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак фак
3. Comparar a versão de Langfuse com o cluster de rastreamento da Phoenix... qual pode dizer-te mais rápido o que está errado?
4. O que é que é que é?
5. Em seu corpo, acima de referência, estas três plataformas.

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tracing | “Spans collector” | Ingest OTel / SDK spans；按 session 建索引 |
| Prompt management | “Prompt CMS” | 关联到 traces 的 versioned prompts |
| LLM-as-judge | “Automated eval” | 单独的 LLM 按 rubric 对 Agent output 评分 |
| Session replay | “Trace playback” | 逐步回放过去的 runs 以便 debugging |
| RAG relevancy | “Retrieval quality” | retrieved context 是否匹配 query |
| Trace clustering | “Behavioral grouping” | 对相似 runs 聚类，用于 drift detection |
| Guardrail enforcement | “Policy at log time” | 对 logged content 做 PII/toxicity/scope checks |

## 延伸阅读

- [Langfuse docs](https://langfuse.com/) rastreamento, avaliação, imediato
- [Arize Phoenix docs](https://docs.arize.com/phoenix) auto-instrumentação  derivação
- [Comet Opik](https://www.comet.com/site/products/opik/) Optimização + barris
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 3 plataformas estão a gastar esquemas
