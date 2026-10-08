# OpenTelemetry GenAI  端到端 Tracking Tool Chamadas

> Um agente 调用了五个工具、三个 MCP server 和两个子代理──你需要一个贯穿所有环节的痕迹──OpenTelemetry GenAI semântica convenções(v1.37 及以上版本中的稳定属性) é um padrão de 2026 que é criado por Datadog、Langfuse、Arize Phoenix、OpenLLMetry 和 AgentOps 原生支持──本课会列必需属性,解讲跨度层次︎agent → LLM → tool),并提供一个stdlib emitter,你可以将它连接到任何OTel exporter──

**Type:** Build
**Languages:** Python (stdlib, OTel span emitter)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## Objectivo de aprendizagem
- Explicar o alcance do LLM e o alcance da execução das ferramentas necessários para os atributos OTel GenAI.
- 构建覆盖 агент loop、LLM call、tool call 和 MCP client dispatch trace hierarchy──
- Decidir capturar quais conteúdos (opt-in) e, em termos de definição, editar quais conteúdos (redigir).
- Em caso de não reescrever código de ferramenta, será enviado para o colecionador local.

## 问题
Um caso de erro de erro de 2026 anos de 2 meses: o usuário relatar meu agente Há momentos que precisam de 30 segundos para responder; outras vezes apenas 3 segundos. Não há vestígios.

Não há rastreamento de ponta a ponta, não consegues localizar o problema.

Estas convenções foram definidas por OpenTelemetry em 2025-2026 como um grupo de convenções semânticas 定型── definidas por eles como nomes de atributos estáveis, portanto, Datadog、Langfuse、Phoenix、OpenLLMetry 和 AgentOps podem resolver os mesmos intervalos── apenas necessitam de instrumentação uma vez; é possível enviar para qualquer backend──

## 概念
### Hierarquia de espa

```
agent.invoke_agent  (top, INTERNAL span)
 ├── llm.chat       (CLIENT span)
 ├── tool.execute   (INTERNAL)
 │    └── mcp.call  (CLIENT span)
 ├── llm.chat       (CLIENT span)
 └── subagent.invoke (INTERNAL)
```

Todo o processo está em um mesmo rastro de identificação.

### Atributos necessários

De acordo com o semconv 2025-2026,

- `gen_ai.operation.name`- Não .`"chat"`- Não.`"text_completion"`- Não.`"embeddings"`- Não.`"execute_tool"`- Não.`"invoke_agent"`- Não.
- `gen_ai.provider.name`- Não .`"openai"`- Não.`"anthropic"`- Não.`"google"`- Não.`"azure_openai"`- Não.
- `gen_ai.request.model` Pelicula de cadeia de modelos `"gpt-4o-2024-08-06"`)。
- `gen_ai.response.model` 实际提供服务的模型──
- `gen_ai.usage.input_tokens`- Não .`gen_ai.usage.output_tokens`- Não.
- `gen_ai.response.id` Usado para o provedor de resposta de关联 id。

 Para as extensões das ferramentas:

- `gen_ai.tool.name`Identificador de ferramenta
- `gen_ai.tool.call.id` 具体电话 id──
- `gen_ai.tool.description` Descrição da ferramenta(可选)。

对于代理跨度:

- `gen_ai.agent.name`- Não .`gen_ai.agent.id`- Não .`gen_ai.agent.description`- Não.

### Tipos de espinha

- `SpanKind.CLIENT`Utilizando o transversal dos limites de processo (LLC provider, MCP server)
- `SpanKind.INTERNAL`Utilize o agente  própria etapa do ciclo e execução da ferramenta.

### Captura de conteúdo de opção

默认情况下,spans 携带 metrics 和 timing, não de instruções ou conclusões.`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`E também um ambiente específico de captura de conteúdo que contenha conteúdo.

### Eventos em espaços

Eventos de nível de tokens podem ser considerados eventos de tempo 添加:

- `gen_ai.content.prompt` mensagens de entrada。
- `gen_ai.content.completion` mensagens de saída。
- `gen_ai.content.tool_call` 记录下来的工具调---

Eventos em um período de tempo, em ordem de tempo, facilitados por detalhes.

### Exportadores

Os intervalos de OTel podem ser:

- **Jaeger / Tempo.**OSS, em local.
- **Langfuse.**面向 LLM observabilidade; uso de tokens可视化──
- **Arize Phoenix.**Evalos + rastreamento 结合──
- **Datadog.**商业产品; 原生解析 `gen_ai.*`atributos.
- **Honeycomb.**- O que é o "conhecimento"

Todos usam o formato OTLP, ou seja, o formato de fio.

### Propagação através de MCP

Quando o cliente MCP 调用 server 时,把 W3C traceparent header 注入请求──Streamable HTTP 支持标准头──Stdio 不原生携带 HTTP头;该规则的2026 roadmap 讨论在 JSON-RPC calls 上添加 `_meta.traceparent`- Não.

Antes de ser publicado: manual em cada pedido de `_meta`中包含 traceparent──Server 记录 trace id──

### Metricas

Além das extensões, a GenAI semconv também definiu métricas:

- `gen_ai.client.token.usage`Histograma.
- `gen_ai.client.operation.duration`Histograma.
- `gen_ai.tool.execution.duration`Histograma.

Estes serão usados sem necessidade de detalhes por chamada.

### Equipamento de transporte

AgentOps (fundada em 2024) é especializada na observabilidade da GenAI. Embaixou frameworks populares.


```figure
t3-span-waterfall
```

## Use-o
`code/main.py`O programa é uma série de programas de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programação de programa

需要关注的点:

- Todas as extensões 共享同一个痕迹ID──
- Links entre pais e filhos           `parentSpanId`- Não.
- necessária.`gen_ai.*`atributos 已填充──
- Captura de conteúdo 默认关闭; um dos cenários irá passar por env 打开它──

## Entrega-o
本课会产出 `outputs/skill-otel-genai-instrumentation.md` Dedicar uma base de código de agente, que irá gerar um plano de instrumentação:

## 练习
1. 运行 `code/main.py` Espasso de estatística: números,并识别哪些是客户端,哪些是内部.

2. 打开 capturar conteúdo env var), confirmação `gen_ai.content.prompt`和 `gen_ai.content.completion`Eventos: Atenção ao impacto das PII:

3. 添加 métricas de execução de ferramentas `gen_ai.tool.execution.duration`,并按每次调用将其作为 histogram sample 发送──

4.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `_meta.traceparent`O servidor MCP vai ver o mesmo rastreamento.

5. 阅读 OTel GenAI semconv spec. 找出一个semconv 中列出但本课代码没有发送的属性──添加它──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OTel | "OpenTelemetry" | 用于 traces、metrics、logs 的开放标准 |
| GenAI semconv | "GenAI semantic conventions" | LLM / tool / agent spans 的稳定 attribute names |
| `gen_ai.*` | "The attribute namespace" | 所有 GenAI attributes 都共享此前缀 |
| Span | "Timed operation" | 一个具有 start、end 和 attributes 的 work unit |
| Trace | "Cross-span ancestry" | 共享同一个 trace id 的 spans 树 |
| SpanKind | "CLIENT / SERVER / INTERNAL" | 关于 span direction 的提示 |
| OTLP | "OpenTelemetry Line Protocol" | exporters 使用的 wire format |
| Opt-in content | "Prompt / completion capture" | 默认关闭；通过 env var 启用 |
| traceparent | "W3C header" | 跨 services 传播 trace context |
| Exporter | "Backend-specific shipper" | 将 spans 发送到 Jaeger / Datadog / 等的组件 |

## 延伸阅读
- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Convenções de autoridade de genAI, abrangências, métricas e eventos
- [OpenTelemetry — GenAI spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) Mestrado em Direito e de execução de ferramentas
- [OpenTelemetry — GenAI agent spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) Nível de agente `invoke_agent`Espécie
- [open-telemetry/semantic-conventions — GenAI spans](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/gen-ai-spans.md) GitHub 托管的权威来源
- [Datadog — LLM OTel semantic convention](https://www.datadoghq.com/blog/llm-otel-semantic-convention/) Integração da produção 讲解
