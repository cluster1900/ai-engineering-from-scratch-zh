# LLM 可观测性 Stack 选择

> O mercado de observação de 2026 é dividido em duas categorias. Plataforma de desenvolvimento: LangSmith, Langfuse, Comet Opik) coloca a monitorização e os avaliações, o controle de execução, a repetição de sessões, em conjunto. Gateway/tools de instrumentalização: Helicone, SigNoz, OpenLLMetry, Phoenix) concentra-se em distância. Langfuse é um núcleo licenciado pelo MIT e obteve um bom equilíbrio no domínio da OSS.

**Type:** Learn
**Languages:** Python (stdlib, toy trace-sampling simulator)
**前置要求：**Fase 17 · 08 (Métricas de inferência), Fase 14 (Engenharia de agentes)
**Time:** ~60 分钟

## Objectivo de aprendizagem
- 区分开发平台(打包:evals + prompts + sessions)
- A partir de agora, a empresa vai poder utilizar o seu próprio sistema de controle de dados para obter informações sobre o seu sistema de controle de dados.
- Explicar OpenTelemetry  Módulo de adesão, que permite que você coloque gateway  ferramentas com plataforma de avaliação independente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
- Explicar a diferença de custos de 2026 anos (Arize AX's zero-copy method vs monolithic ingest), e explicar aproximadamente 100x do multiplicador.

## 问题
Você está no caminho de um LLM  função──it pode trabalhar──mas você não vê falhas rápidas, loops de ferramentas, regressões de atraso, picos de custo, ou taxa de acidente de caché rápido. Você Google LLM observabilidade, verá oito ferramentas que afirmam resolver o mesmo problema, e o preço também está dividido em três arquivos──

它们解决的不是同一个问题──LangSmith 回答为什么这次 LangGraph run 失败了?Phoenix 回答我的RAG管道是否漂浮?

选择涉及四个轴:stack(LangChain?Raw SDK?multi-vendor?) 许可证宽容(apresentável apenas MIT?Elastico?$100/mo？$1000/mo?) e auto-hosting (necessário)

## 概念
### 两类

**开发平台**Colocar observação e avaliações, imediato, gerenciamento, versão de conjunto de dados, repetição de sessões, juntamente.

**Gateway/telemetry 工具**Para as chamadas de inferência fazer ferramentação de captação  rapidez, resposta, token, latência, modelo, custo, helicónio, signoz, openLLmetry, phoenix, mais leve, pode ser através de OpenTelemetry e um conjunto de ferramentas de avaliação independente.

### Langfuse  OSS 平衡

- Core Apache / MIT licenciado; através do Docker auto-hosting.
- Nível gratuito em nuvem: 50K eventos/mês.
- Evals, gestão de instantes, rastreamentos, conjuntos de dados, para quatro funções de desenvolvimento de plataforma, têm uma cobertura razoável.
- O que é que você quer é um serviço de LangSmith, mas você precisa ser auto-anfitrião ou manter a licença OSS.

### Phoenix (Arize)  Telemetria-primeira, OpenTelemetry-nativa

- Licença Elastica 2.0; auto-anfitrião 很简单──
- 非常擅长 RAG 和漂移可视化──Embedding-space scatter plots 是一等功能──
- Não é concebido para a duração da produção posterior.
- Ponto de sucesso:O pipeline RAG  desenvolvimento  debugging de deriva,并与独立 gateway 搭配用于生产。

### Arize AX  escala de jogo

- Comércio. através do Iceberg/Parquet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
- 声称在尺度下比单石可观性(Datadog-class)便宜约100x──计算方式:你把痕迹存在自己 S3 上的Parquet 中;Arize 直接读取──
- "Ponto de espera:> 10 milhões de traços/dia"", já há um lago de dados"",querem painéis específicos para o LLM, mas não querem pagar dados"

### LangSmith  LangChain/LangGraph  prioritário

- Comércio, US$ 39/usuário/mês.
- Para as pilhas LangChain e LangGraph são as melhores da sua classe. Se não usarem estas duas, a atração vai ficar muito fraca.
- O grupo já está envolvido na LangChain, e está disposto a pagar.

### Helicone   baseado em proxy de mínimo viável

- - Não.`OPENAI_API_BASE`Substituição por proxy Helicone,15-30 分钟完成设置──
- Licenciado pelo MIT; 100 mil reais por mês 免费, pago 20 dólares por mês
- 包含 failover、caching、rate limits  也可充当 gateway──
- A profundidade das traças de agente / múltiplas etapas é menor.
- Sweet spot: 快速开始、app de pilha única、 necessita de gateway + observabilidade 合一。

### Opik (Comet)  Plataforma de desenvolvimento OSS

- Apache 2.0, totalmente OSS.
- Função集与Langfuse 类似,带有彗星传承──
- Sweet spot: já usando o ML 团队 do Comet, esperando obter LLM 可观测性在同一面板中.

### SigNoz  OpenTelemetry-first 完整APM

- Apache 2.0: através da OpenTelemetry
- O ponto doce:跨服务和 LLM chamadas de

### 粘合层:OpenTelemetry + Convenções semânticas da GenAI

A OpenTelemetry em 2025 lançou convenções semânticas da GenAI`gen_ai.system`- Não.`gen_ai.request.model`- Não.`gen_ai.usage.input_tokens`O consumo de produtos de origem e de produção é um dos principais factores de desenvolvimento do sector.

1. De cada chamada de LLM  emitido em conformidade com as convenções da GenAI OTel 
2. 路由到 gateway (Helicone / Portkey) para uso diário.
3. 双写到 eval platform (Phoenix / Langfuse) para regressões
4. 归档到数据湖(Iceberg), para ser usado através de Arize AX ou DuckDB fazer análises de longo prazo.

### 陷: em erro nível fazer ferramenta

Em um framework de agentes 内部做工具化 (por exemplo, adicionar traços de LangSmith) vai te colocar 合到该框架── em um 层 HTTP/OpenAI-SDK 做工具化 (via OpenLLMetry ou seu gateway) 更多可移植──

### Amostração. Não podes guardar tudo.

Quando o volume de solicitações > 1M solicitações/dia 时, o custo de retenção completa ultrapassa as chamadas de LLM.

### Você deve lembrar-se de números

- Nuvem livre de Langfuse: 50K eventos/mês.
- LangSmith: 39 dólares por usuário/mês.
- Helicone livre: 100 mil reais por mês.
- Arize AX afirma: em escala, inferior ao monolitico 便宜约100x──
- Convenções da OpenTelemetry GenAI: 2025  Publicadas: 2026  amplamente adotadas:


```figure
i4-otel-glue
```

## Use-o
`code/main.py`模拟在不同保留策略(100% ingestão, amostragem, amostragem + erros) 下一天 1M traces── relatório custo de armazenamento e cada estratégia下丢失的内容──

## Entrega-o
本课会产出 `outputs/skill-observability-stack.md` De acordo com a pilha, escala, orçamento, posição da licença  seleccionar ferramentas 

## 练习
1. Seu grupo usa LangChain,并希望 OSS auto-hosted observabilidade──选择 Langfuse 或 Opik 并说明理由──
2. Em 5M traços / dia 且 Datadog 报价$ 150K / mês 时,计算Arize AX's break-even──
3. 设计一组你的组织指导方针 应要求每LLM call都必须包含的OpenTelemetry GenAI atributos。
4. Só Phoenix é o suficiente para ser produzido.
5. O helicóptero tem 20ms de carga por proxy. Quando o P99 TTFT é de 300 ms, isso é aceitável?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OpenLLMetry | “OTel for LLMs” | 面向 LLMs 的开源 OpenTelemetry instrumentation |
| GenAI conventions | “OTel attributes” | LLM calls 的标准 OTel attribute names |
| LangSmith | “LangChain observability” | 与 LangChain ecosystem 打包的 commercial platform |
| Langfuse | “OSS LangSmith” | 具备类似功能集的 MIT OSS |
| Phoenix | “Arize dev tool” | OpenTelemetry-native dev/eval platform |
| Arize AX | “scale observability” | Commercial zero-copy Iceberg/Parquet observability |
| Helicone | “proxy observability” | 收集 LLM telemetry + gateway features 的 HTTP proxy |
| Opik | “Comet LLM” | 来自 Comet 的 Apache 2.0 OSS dev platform |
| Session replay | “trace rerun” | 带 tool calls 的完整 agent session replay |
| Eval | “offline test” | 在 labeled dataset 上运行 candidate model/prompt |

## 延伸阅读
- [SigNoz — 2026 顶级 LLM 可观测性工具](https://signoz.io/comparisons/llm-observability-tools/)
- [Langfuse — Arize AX Alternative analysis](https://langfuse.com/faq/all/best-phoenix-arize-alternatives)
- [PremAI — 设置 Langfuse、LangSmith、Helicone、Phoenix](https://blog.premai.io/llm-observability-setting-up-langfuse-langsmith-helicone-phoenix/)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Arize Phoenix docs](https://docs.arize.com/phoenix)
- [Helicone docs](https://docs.helicone.ai/)
