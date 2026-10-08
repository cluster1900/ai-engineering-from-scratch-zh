# Agno y Mastra: producción Runtime

> Agno (Python) 和 Mastra (TypeScript) es una producción de 2026 años Runtime 组合。Agno 目标是微秒级 Agent 实例化和无状态 FastAPI backend。Mastra 基于 Vercel AI SDK 底层,提供 Agents、tools、workflows、统一模型路由和复合存储──

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 13 (LangGraph)
**Time:** ~45 minutes

## El objetivo del aprendizaje
- Identificar los objetivos de rendimiento de Agno, así como estos objetivos en qué escenario son importantes.
- Cuentan las tres primitivas de Mastra  Agentes, herramientas, flujos de trabajo  y los adaptadores de servidor compatibles 
- Explicar por qué no hay estado ∙ la versión de Backend de FastAPI es el camino de producción de Agno ∙
- 根据给定堆 选择 Agno 或 Mastra(Python-first vs TypeScript-first) 💚

##  problemas
LangGraph、AutoGen、CrewAI están muy en contra de los frameworks. Quiero que el equipo de los Agentes, que sólo tiene que ser rápido y que en mi Runtime, elija Agno (Python) o Mastra (TypeScript).

## 概念
### Agno

- Python Runtime, uno de ellos es Phi-data.
-  No hay gráficos  cadenas o modelos complejos   Sólo un puro Python。
- Objetivo de rendimiento en sus documentos: aproximadamente 2μs Agente 实例化、 cada Agente 约3.75 KiB de memoria、 aproximadamente 23 proveedores de modelos。
- 生产路径:无状态、session-scoped FastAPI backend── cada solicitud se inicia un nuevo agente; estado de sesión 存在 DB 中──
- Originarios de la serie de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de televisión de

Cuando tienes miles de corto ciclo de vida de un agente por segundo, estos objetivos de velocidad son importantes. Cuando un agente funciona en 10 minutos, no son tan importantes.

### El Mastra

- TypeScript, construido en el SDK de Vercel AI 之之上
- Tres primitivos:**Agents**¿Qué es esto?**Tools**(Tipo de zona)**Workflows**¿Qué es eso?
- Modelo Unificado de Router  跨 94 个供应商 的 3,300+ modelos(2026 年 3 月) ⋅
- Almacenamiento compuesto:memoria, flujos de trabajo, observabilidad, conexión a diferentes fondos de fondo, observabilidad de escala 推 ClickHouse。
- Apache 2.0, fuente de código `ee/`Actualmente se utiliza la licencia de empresa disponible en la fuente.
- 支持 Express、Hono、Fastify、Koa's servidor adaptadores; para Next.js 和 Astro 提供一流的集成──
- 提供 Mastra Studio(host local:4111) para el desbudo
- 1.0 版本时(2026 年 1 月) hay 22k+ GitHub estrellas、300k+ descargas por semana npm。

### Posicionamiento

两者都不是要成为LangGraph──它们 compiten es:

- **Language fit.**Agno 面向Python-first 团队;Mastra 面向TypeScript-first。
- **Runtime ergonomics.**Agno = casi zero gastos generales; Mastra = 与 Vercel ecosistema 集成──
- **Observability.**两者都集成 Langfuse/Phoenix/Opik(Lección 24), pero el estudio Mastra es el primero en participar.

### ¿Cuándo elegir cada uno?

- **Agno** Backend Python  Un gran número de agentes de corto ciclo de vida  requisitos de rendimiento  RapidAPI  equipo 
- **Mastra** TypeScript backend、Next.js / Vercel deploy、统一 multi-provider model routing、Zod-typed tools。
- **LangGraph**(Lección 13) Cuando el estado duradero y el razonamiento gráfico de forma clara es más importante que la velocidad original.
- **OpenAI / Claude Agent SDK** Cuando quieres proveedor 产品化后的形态时(Lesiones 1617)。

### Este patrón es fácil de encontrar

- **Perf-for-perf's-sake.**Porque 2μs parece que no se equivocan en la elección de Agno, pero la carga de trabajo es cada solicitud Una vez muy lenta llamada del agente.
- **Ecosystem lock-in.**La integración con sabor a Vercel de Mastra en Vercel arriba es un agregado, en otras partes es posible un reducido.
- **Enterprise license confusion.**El maestro de la`ee/`El archivo es disponible de fuente, no Apache 2.0... si planeas forjarte, lee las licencias...


```figure
wb-runtime-spawn
```

## Construirlo
Este curso es principalmente sobre el sexo                                                                                                                                                                                                                                                            `code/main.py`Un juego lado a lado: una minúscula operación de la sesión de salida de flujo, una sesión permanente de la sesión de flujo, realizando dos veces, una en forma de Agno, otra en forma de Mastra)

¿Qué es eso ?

```
python3 code/main.py
```

Veremos rastros de dos estructuras diferentes pero de función igual.

## Usalo
- **Agno** 需要速度和 FastAPI 形态 de Python backend──
- **Mastra** 拥有多个供应商和工作流原始的TypeScript后台──
- 两者都提供首方可观测──两者都集成 Langfuse──

##  entregarlo
`outputs/skill-runtime-picker.md`Las acciones de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de la plataforma de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de desarrollo de desarrollo de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de la plataforma de la plataforma de desarrollo de desarrollo de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de desarrollo de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de desarrollo de desarrollo de la plataforma de la plataforma de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de desarrollo de desarrollo de desarrollo de la plataforma de desarrollo de desarrollo de desarrollo de desarrollo de desarrollo de desarrollo de desarrollo de

##  ejercicios
1. 阅读 Agno's docs──把 stdlib ReAct loop(LECCIÓN 01) transferido a Agno──¿Qué ha desaparecido? ¿Qué se ha conservado?
2. ¿Qué ha cambiado en el medio de la mecanografía de la herramienta Mastra? ¿Zod vs nada?
3. Benchmark: Measure your stack  Ejemplo de latencia ⋅ Agno de 2μs para su carga de trabajo  ¿Es importante?
4. Design Migration: Si has estado operando en Python CrewAI, ¿has migrado a Agno 会破坏什么?
5. 阅读 Mastra de `ee/`¿Qué restricciones afectarán a la fuente abierta?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agno | “Fast Python agents” | 无状态、session-scoped 的 Agent Runtime |
| Mastra | “TypeScript agents on Vercel AI SDK” | Agents + Tools + Workflows + Model Router |
| Unified Model Router | “Multi-provider access” | 跨 94 个 providers、面向 3,300+ models 的单一 client |
| Composite storage | “Multiple backends” | Memory/workflows/observability 分别接入不同 store |
| Mastra Studio | “Local debugger” | 用于 introspecting Agents 的 localhost:4111 UI |
| Source-available | “Not OSS” | License 允许阅读 source，但限制 commercial use |

## 延伸阅读
- [Agno Agent Framework docs](https://www.agno.com/agent-framework) 性能目標、FastAPI integración
- [Mastra docs](https://mastra.ai/docs) primitivos  adaptadores de servidores  Modelo de enrutador
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) estado-grafico 替代方案
- [Comet Opik](https://www.comet.com/site/products/opik/) Integras de Mastra 引用的 observabilidad comparaciones
