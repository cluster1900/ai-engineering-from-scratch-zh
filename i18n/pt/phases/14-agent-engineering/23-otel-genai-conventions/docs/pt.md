# OpenTelemetry GenAI 语义约定

> O SIG da OpenTelemetry (GenaSIG) (iniciado em 4 de abril de 2024) definiu o esquema padrão da telemetria do Agente.

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 分钟

## Objectivo de aprendizagem
- Explicar categorias de abrangência da GenAI:modelo/cliente, agente, ferramenta
- 区分 `invoke_agent`CLIENT e SPANES INTERNAIS, bem como as respectivas situações de utilização.
- 列出顶层 Atributos de GenAI: nome do fornecedor, modelo de solicitação, ID da fonte de dados.
- 解释 content-capture contract:opt-in`OTEL_SEMCONV_STABILITY_OPT_IN`、recomendação de referência externa¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## 问题
Cada fornecedor desenvolveu seus próprios nomes de espaço. As equipes de operações devem, finalmente, construir painéis de controle separadamente.

## 概念
### Categoria de espaços

1. **Model / client spans.**覆盖原始 LLM calls──由供应商SDKs(Antropic、OpenAI、Bedrock)
2. **Agent spans.** `create_agent`(agente de construção 时)`invoke_agent`(运行代理 时)
3. **Tool spans.**Cada vez que invoca uma ferramenta, através da relação pai-filho,

### Nomeamento do agente span

- Nome espanhol: se já foi nomeado,则为 `invoke_agent {gen_ai.agent.name}`- O retorno .`invoke_agent`- Não.
- Tipo de espinha:
  - **CLIENT** Usado para serviços de agentes remotos ((OpenAI Assistants API、Bedrock Agents) 
  - **INTERNAL** Utilizado em estruturas de agentes em processo ((LangChain、CrewAI、Local ReAct) 

### Atributos-chave

- `gen_ai.provider.name`- Não .`anthropic`- Não.`openai`- Não.`aws.bedrock`- Não.`google.vertex`- Não.
- `gen_ai.request.model`Identificação do modelo.
- `gen_ai.response.model` 解析后的模型(可能因路由而不同于请求)。
- `gen_ai.agent.name`Identificador do agente.
- `gen_ai.operation.name`- Não .`chat`- Não.`completion`- Não.`invoke_agent`- Não.`tool_call`- Não.
- `gen_ai.data_source.id`Para o RAG: "Questionar qual corpo ou loja".

Antropic、Azure AI Inference、AWS Bedrock、OpenAI têm convenções específicas de tecnologia。

### Captura de conteúdo

默认规则:instrumentations 默认 DEVEM NÃO 捕获输入/输出──捕获 通过以下方式选择:

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

推的生产模式:将内容存储在外部(S3、你的日志店),在跨度上记录引用(pointer IDs, não prósa) .

### Estabilidade

截至2026年 3月, a maioria das convenções 仍是实验性──使用以下方式选择到稳定预览:

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

Datadog v1.37+ 会将 GenAI atributos 原生映射到其 LLM Observability schema。其他后台(Grafana、Honeycomb、Jaeger) suportar atributos brutos。

### Este é um lugar fácil de sair

- **在 spans 中捕获完整 prompts。**PII, segredos, dados de clientes entrarão em operações, podem ser leídos, devem ser armazenados no exterior.
- **没有 `gen_ai.provider.name`。**atribuição 缺失时,multi-provider dashboards 会失效──
- **没有 parent links 的 spans。**会产生 isoladas extensões de ferramentas.
- **没有设置 stability opt-in。**Depois de subir, os teus atributos podem ser rebatizados.


```figure
ae-genai-span-tree
```

## Construí-lo
`code/main.py`实现 um emissor de tempo de transmissão compatível com as convenções da GenAI:

- 带 GenAI esquema de atributos `Span`- Não.
- - Não .`start_span`Contexto de contextos`Tracer`- Não.
- Um agente com roteiro, vai sair:`create_agent`- Não.`invoke_agent`(INTERNAL) ≈ per-tool spans ≈ para chamadas de LLM ≈`chat`Espassos
- Um modo de captura de conteúdo, vai colocar as instruções armazenadas no exterior, e vai registrar IDs.

- Não .

```
python3 code/main.py
```

输出:一棵包含所有必需 GenAI atributos de árvore de espaço, bem como uma "localização externa" de referências de conteúdo opt-in.

## Use-o
- **Datadog LLM Observability**(v1.37+) atributos de original-gravidade-método.
- **Langfuse / Phoenix / Opik**(Lessão 24)  auto-instrumental 生态。
- **Jaeger / Honeycomb / Grafana Tempo** rastro de OTel bruto; de atributos da GenAI construir painéis de controle。
- **Self-hosted** Utilize processador GenAI 运行 OTel Collector。

## Entrega-o
`outputs/skill-otel-genai.md`O OTel GenAI vai ser usado para capturar conteúdo e armazenar referências externas.

## 练习
1. Utilização `invoke_agent`(INTERNAL) + por ferramenta spans instrumento Sua lição 01 ReAct loop── enviar para uma instância Jaeger──
2. Em modo "referências apenas" 中添加内容捕获:prompts 写入 SQLite,span attributes 只携带行 IDs──
3. 阅读 `gen_ai.data_source.id`A lição 09 vai ser a tua lição 09
4.  configuração `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`Não vou ser coletada pelo coletor.
5. Construir um painel de controle: apenas a partir de atributos da GenAI, veja "qual é o erro na ferramenta e quais são os modelos  relacionados"

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GenAI SIG | "OpenTelemetry GenAI group" | 定义 schema 的 OTel working group |
| invoke_agent | "Agent span" | 表示一次 agent run 的 span name |
| CLIENT span | "Remote call" | 调用 remote agent service 的 span |
| INTERNAL span | "In-process" | in-process agent run 的 span |
| gen_ai.provider.name | "Provider" | anthropic / openai / aws.bedrock / google.vertex |
| gen_ai.data_source.id | "RAG source" | retrieval 命中了哪个 corpus/store |
| Content capture | "Prompt logging" | 对 messages 的 opt-in capture；prod 中存储在外部 |
| Stability opt-in | "Preview mode" | 用于固定 experimental conventions 的 env var |

## 延伸阅读
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 规范
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 默认提供 GenAI extensões
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) Inserção de OTel
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) contexto de rastreamento do W3C 传播
