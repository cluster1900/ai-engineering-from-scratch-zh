# Agno e Mastra: produção Runtime

> Agno (Python) 和 Mastra (TypeScript) é uma produção de 2026 anos Runtime 组合。Agno 目标是微秒级 Agent 实例化和无状态 FastAPI backend。Mastra 基于 Vercel AI SDK 底层, provide Agents、tools、workflows、统一模型路由和复合存储。

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 13 (LangGraph)
**Time:** ~45 minutes

## Objectivo de aprendizagem
- Identificar os objetivos de desempenho de Agno, bem como esses objetivos em que cenário são importantes.
- Explicar as três primitivas do Mastra  Agentes, Ferramentas, Fluxos de Trabalho  e adaptadores de servidor suportados
- Explicação de porquê não está em estado, o backend da FastAPI da sessão é o caminho de produção de Agno.
- 根据给定堆 选择 Agno 或 Mastra(Python-first vs TypeScript-first) ⋅

## 问题
LangGraph、AutoGen、CrewAI são muito pesados em estrutura. Quer só que o agente loop, deve ser rápido, e em meu Runtime 里运行 的团队, vai escolher Agno (Python) ou Mastra (TypeScript) ⋅ ambos usam parte dos primitivos de propriedade do framework em troca de velocidade original, bem como um melhor acordo com a pilha de rodada.

## 概念
### Agno

- Python Runtime, é o Phi-data.
- Não há gráficos, cadeias ou modelos complexos.
- Objectivos de desempenho em seus documentos: cerca de 2μs Agente 实例化、 cada Agente 约3.75 KiB de memória、 cerca de 23 fornecedores de modelos。
- 生产路径:无状态、session-scoped 的 FastAPI backend── cada pedido todos iniciam um novo Agente; estado de sessão 存在 DB 中──
- Orig生 Multimodal (texto, imagem, áudio, vídeo, arquivo) e RAG agente

Quando você tem milhares de ciclos de vida curtos por segundo Agente, esses objetivos de velocidade são importantes. Quando um Agente funciona 10 minutos, eles não são tão importantes.

### Mastra

- TypeScript, construído em Vercel AI SDK 之之上.
- Três primitivas:**Agents**- Não.**Tools**(Zod-tipo)**Workflows**- Não.
- Modelo Unificado Router  跨 94 个供应商 的 3,300+ modelos(2026 年 3 月) ⋅
- Armazenamento composto: memória, fluxos de trabalho, observabilidade, capacidade de conectar diferentes backends, observabilidade em escala 推 ClickHouse。
- Apache 2.0, código-fonte `ee/`O presente documento é publicado em 31 de janeiro de 2015.
- 支持 Express、Hono、Fastify、Koa's server adapters;对Next.js 和 Astro 提供一级集成──
- 提供 Mastra Studio(host local:4111) para depurar
- 1.0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

### Posicionamento

两者都不是要成为LangGraph──它们竞争的是:

- **Language fit.**Agno 面向 Python-first 团队;Mastra 面向 TypeScript-first。
- **Runtime ergonomics.**Agno = quase zero despesas; Mastra = 与 Vercel ecossistema 集成──
- **Observability.**两者都集成 Langfuse/Phoenix/Opik(Lessão 24), mas o Mastra Studio é o primeiro partido。

### Quando escolher cada um

- **Agno** Backend Python  Um grande número de agentes de ciclo de vida curto  Requisitos de desempenho fortes  FastAPI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- **Mastra** TypeScript backend、Next.js / Vercel deploy、统一 multi-provider model routing、Zod-typed tools。
- **LangGraph**(Lessão 13)  Quando o estado durável e o raciocínio gráfico explicativo são mais importantes do que a velocidade original.
- **OpenAI / Claude Agent SDK** Quando você quer fornecedor 产品化后的形态时(Lessões 1617)。

### Este padrão é fácil de encontrar

- **Perf-for-perf's-sake.**Porque 2μs parece não ser o caso de Agno, mas a carga de trabalho é cada pedido de um agente chamado muito lento.
- **Ecosystem lock-in.**A integração com sabor Vercel de Mastra em Vercel é adicionada em outros lugares, em outros lugares é possível diminuir.
- **Enterprise license confusion.**Mastra de `ee/`O código-fonte está disponível, não é Apache 2.0. Se você planeja forcagem, leia as licenças.


```figure
wb-runtime-spawn
```

## Construí-lo
Este curso é principalmente sobre o comparativo de um único artefato de código que não pode ser apresentado de forma justa em dois quadros.`code/main.py`Joguinho lado a lado: uma minúscula operação de saída de fluxo de Agente, sessão persistente, processo de execução de duas vezes, uma em forma de Agno, outra em forma de Mastra)

- Não .

```
python3 code/main.py
```

Veremos dois traços de estruturas diferentes, mas de funções iguais.

## Use-o
- **Agno** 需要速度和 FastAPI 形态的Python backend──
- **Mastra** 拥有多个供应商和工作流原始的TypeScript backend──
- 两者都提供第一方可观察性──两者都集成 Langfuse──

## Entrega-o
`outputs/skill-runtime-picker.md`De acordo com o orçamento de estacação e a forma operacional, será feita uma seleção no Agno, Mastra, LangGraph ou SDK do fornecedor.

## 练习
1. 阅读 Agno's docs──把 stdlib ReAct loop(Lessão 01) transplantado para Agno── o que desapareceu? o que se reserva?
2. 阅读Mastra's docs──把同一个循环 移植到Mastra── ferramenta de digitação Que mudança aconteceu entre os dois?
3. Benchmark: Measure your stack                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
4. Se estiveres a operar no Python, vai mudar para Agno.
5. 阅读 Mastra 的 `ee/`Termos de licença... que restrições afetarão o fork de código aberto?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agno | “Fast Python agents” | 无状态、session-scoped 的 Agent Runtime |
| Mastra | “TypeScript agents on Vercel AI SDK” | Agents + Tools + Workflows + Model Router |
| Unified Model Router | “Multi-provider access” | 跨 94 个 providers、面向 3,300+ models 的单一 client |
| Composite storage | “Multiple backends” | Memory/workflows/observability 分别接入不同 store |
| Mastra Studio | “Local debugger” | 用于 introspecting Agents 的 localhost:4111 UI |
| Source-available | “Not OSS” | License 允许阅读 source，但限制 commercial use |

## 延伸阅读
- [Agno Agent Framework docs](https://www.agno.com/agent-framework) 性能目標、FastAPI integração
- [Mastra docs](https://mastra.ai/docs) primitivos  adaptadores de servidores  Modelo Router
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) estado-plural 替代方案
- [Comet Opik](https://www.comet.com/site/products/opik/) Integrações de Mastra 引用的 observabilidade comparações
