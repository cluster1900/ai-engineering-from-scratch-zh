# Função Chamando 深入解析  OpenAI, Antropic, Gemini

> Os três provedores de fronteira em 2024 receberam o mesmo ciclo de chamada de ferramentas, e depois em todos os outros lugares distribuirão o uso de OpenAI.`tools`和 `tool_calls`❖ Antropico `tool_use`和 `tool_result`Blocos──Gemini `functionDeclarations`O código entregue em um provedor não vai se quebrar quando transferido para outro provedor.

**Type:** Build
**Languages:** Python (stdlib, schema translators)
**Prerequisites:** Phase 13 · 01（the tool interface）
**Time:** ~75 分钟

## Objectivo de aprendizagem
- Exposição de OpenAI、Antropic 和 Gemini função-chamando cargas úteis  μεταξύ三类形差异 (diclaração, chamada, resultado) 
- Para fazer uma declaração de ferramenta 翻译到三个供应商格式,并预测 rigoroso modo de restrições 会在哪里不同──
- Em cada fornecedor`tool_choice`Para forçar, proibir ou selecionar automaticamente as chamadas de ferramentas.
-  Conhecer os limites de cada fornecedor (contação de ferramentas, profundidade do esquema, comprimento do argumento) e as assinaturas de erro emitidas por cada fornecedor (com exceção dos limites) 

## 问题
Forma da solicitação de chamada de função, dado que o fornecedor e o outro, são três exemplos concretos das pilhas de produção de 2026:

**OpenAI Chat Completions / Responses API.**Tu estás a entrar .`tools: [{type: "function", function: {name, description, parameters, strict}}]` A resposta do modelo incluem `choices[0].message.tool_calls: [{id, type: "function", function: {name, arguments}}]`, entre os `arguments`É você deve resolver a cadeia JSON.`strict: true`) através da descodificação restrita 强制方案合规──

**Anthropic Messages API.**Tu estás a entrar .`tools: [{name, description, input_schema}]` Resposta 以 `content: [{type: "text"}, {type: "tool_use", id, name, input}]`- Volte.`input`Já foi resolvido. É um objeto, não uma cadeia.`user`Mensagem, entre elas `{type: "tool_result", tool_use_id, content}`Bloco

**Google Gemini API.**Tu estás a entrar .`tools: [{functionDeclarations: [{name, description, parameters}]}]`(Embutidos em `functionDeclarations`- Não, não.`candidates[0].content.parts: [{functionCall: {name, args, id}}]`Até chegar, entre eles.`id`Em Gemini 3 及以上版本中是独一无二,用于并调相关性──你回复 `{functionResponse: {name, id, response}}`- Não.

Uma equipa de agentes meteorológicos em OpenAI escreveu apenas para plantar, transferir para Anthropic, levar dois dias, retransferir para Gemini, também um dia.

Este curso construirá um tradutor, vai reunir três formatos em uma declaração de ferramenta canônica e, em seguida, fazer roteamento.

## 概念
### A estrutura comum

Cada fornecedor precisa de cinco coisas:

1. **Tool list.**Nome de cada ferramenta, descrição e esquema de entrada.
2. **Tool choice.** Forçar o uso de ferramentas específicas  proibir ferramentas, ou deixar o modelo decidir
3. **Call emission.**命名 tool 和 arguments 的结构化输出──
4. **Call id.**Será a resposta 关联到正确的调用 (paralelo 时很重要)
5. **Result injection.**Uma mensagem ou bloqueio, vai resultar em um chamado.

### Campo individual comparado à forma diferente

| Aspect | OpenAI | Anthropic | Gemini |
|--------|--------|-----------|--------|
| Declaration envelope | `{type: "function", function: {...}}` | `{name, description, input_schema}` | `{functionDeclarations: [{...}]}` |
| Schema field | `parameters` | `input_schema` | `parameters` |
| Response container | assistant message 上的 `tool_calls[]` | type 为 `tool_use` 的 `content[]` | type 为 `functionCall` 的 `parts[]` |
| Arguments type | stringified JSON | parsed object | parsed object |
| Id format | `call_...`（OpenAI 生成） | `toolu_...`（Anthropic） | UUID（Gemini 3+） |
| Result block | role `tool`, `tool_call_id` | 带 `tool_result`, `tool_use_id` 的 `user` | 带匹配 `id` 的 `functionResponse` |
| Force-a-tool | `tool_choice: {type: "function", function: {name}}` | `tool_choice: {type: "tool", name}` | `tool_config: {function_calling_config: {mode: "ANY"}}` |
| Forbid tools | `tool_choice: "none"` | `tool_choice: {type: "none"}` | `mode: "NONE"` |
| Strict schema | `strict: true` | schema-is-schema（始终 enforce） | request level 的 `responseSchema` |

### Você realmente vai encontrar limitações

- **OpenAI.**Cada pedido máximo 128 ferramentas ⋅ Profundeza de esquema 5⋅ String de argumento <= 8192 bytes⋅ Modo rígido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `$ref`Não há sobreposição .`oneOf`- Não .`anyOf`- Não .`allOf`Todas as propriedades estão em ordem .`required`- Não.
- **Anthropic.**Cada pedido, máximo 64 ferramentas. A profundidade do esquema não tem limite, mas o limite prático é de 10.
- **Gemini.**Cada pedido máximo 64 funções. Tipos de esquema são o subconjunto OpenAPI 3.0.

### `tool_choice`comportamento

Três modos todos apoiam, apenas nome diferente.

- **Auto.**Modelo 选择 tool 或 text──默认值──
- **Required / Any.**O modelo  deve utilizar pelo menos uma ferramenta 
- **None.**Modelo não pode ser usado para ferramentas.

Além disso, cada fornecedor tem um modelo único:

- **OpenAI.**按名 强制使用特定工具──
- **Anthropic.**按名 强制使用特定工具;`disable_parallel_tool_use`bandeira 区分 single vs multi。
- **Gemini.** `mode: "VALIDATED"`Vai permitir que cada resposta passe pelo validador de esquema, independentemente da intenção do modelo.

### Chamadas paralelas

OpenAI `parallel_tool_calls: true`(默认) vai enviar várias chamadas em uma mensagem de assistente.`tool_call_id`À frente de uma entrada:`disable_parallel_tool_use: false`(截至Claude 3.5 的默认值) Avaliar multi──Gemini 2 允许通话并行,但没有给出稳定的ID;Gemini 3 增加 UUIDs,因此, respostas fora de ordem podem estar claramente correlacionadas──

### Transmissão

三者都支持 streamed tool calls──formato de fio Diferente:

- **OpenAI.** `tool_calls[i].function.arguments`Os pedaços do delta vão aumentar até chegar.`finish_reason: "tool_calls"`- Não.
- **Anthropic.**Eventos de bloqueio de início / bloqueio de delta / bloqueio de parada。`input_json_delta`Os fragmentos 携带部分参数──
- **Gemini.** `streamFunctionCallArguments`(Gêmeos 3 新增)`functionCallId`de pedaços, portanto, várias chamadas paralelas podem ser trocadas.

Fase 13 · 03 会深入讲 paralelos + reassemblage de streaming。本课聚焦宣言 和单调形──

### Erros e reparação

Erros de argumento inválido também diferem.

- **OpenAI (non-strict).**Modelo  retornar `arguments: "{bad json}"`, seu JSON parse  fracassou, você inserir mensagem de erro e voltar a ligar.
- **OpenAI (strict).**A validação ocorreu durante a decodificação; JSON inválido não pode aparecer, mas pode aparecer `refusal`- Não.
- **Anthropic.** `input`Pode conter campos inesperados; esquema é aconselhável.
- **Gemini.**OpenAPI 3.0 quirk:object fields 上的 `enum`É preciso que se válidem.

### O padrão de tradutor

Sua código-fonte em canônica ferramenta declaração parece ser assim:

```python
Tool(
    name="get_weather",
    description="Use when ...",
    input_schema={"type": "object", "properties": {...}, "required": [...]},
    strict=True,
)
```

三个小函数将它翻译成三种提供形――`code/main.py`O arsenal do centro está fazendo isso, e depois coloca uma chamada de ferramenta falsa através de forma de resposta de cada provedor fazer viagem de ida e volta.

As equipes de produção vão colocar este tradutor`AbstractToolset`(AI Pidantica)`UniversalToolNode`(Langgraph) ou `BaseTool`(LlamaIndex) ――Fase 13 · 17 会交付一个门户,在三者任意一个前面暴露OpenAI-shaped API──


```figure
function-call-args
```

## Use-o
`code/main.py`Definir um canônico`Tool`dataclass, bem como três tradutores, usados para emitir OpenAI、Anthropic 和 Gemini declaração JSON。 então ele irá responder a cada tipo de forma feita à mão do provedor 解析为同一个可нониcal call object,展示语义在表层之下是相同的.

需要观察的点:

- Três blocos de declaração apenas no envelope 和 nomes de campos 上不同──
- Três blocos de resposta Diferença em chamada Localização (top-level)`tool_calls`- Não.`content[]`Bloco`parts[]`Entrada) 
- Um .`canonical_call()`função de todas as três formas de resposta 中提取 `{id, name, args}`- Não.

## Entrega-o
本课产 出 `outputs/skill-provider-portability-audit.md` Dado uma integração de função-chamadas orientada para um determinado provedor, esta habilidade gerará uma auditoria de portabilidade: depende de quais limites do provedor  quais campos  precisam ser renomeados, bem como quais falhas ocorrerão quando transferidos para outro provedor 

## 练习
1. 运行 `code/main.py`, Verification , três declarações de fornecedores JSONs são ordenados em uma mesma camada de fundo .`Tool`Objeto: Modificar ferramenta canônica, adicionar um parâmetro enum,并确认只有双子座翻译

2. Para cada fornecedor adicione um`ListToolsResponse`Parser, do modelo em`list_tools`Ou chamada de descoberta 后返回的内容中提取工具列表──OpenAI 原生没有这个项目;记录这个不对称性──

3.  realização `tool_choice`Conversion:将 canonical `ToolChoice(mode="force", tool_name="x")`映射到三种供应商形――然后映射 `mode="any"`和 `mode="none"`◊ Checkha本课的差表──

4. 选择三个供应商中一个,从头到尾阅读它的函数调用指南――找到它的方案规范中一个其他两个不支持的领域――候选项:OpenAI `strict`、Antropico `disable_parallel_tool_use`Gêmeos`function_calling_config.allowed_function_names`- Não.

5. 写一个测试向量:一个论点 违反声明的方案的工具调用──将它运行过每个供应商的验证器(Lesson 01 中的 stdlib validator 可以作为代理),并记录触发了哪些错误──记录你在生产中会为了严格使用哪个供应商──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Function calling | "Tool use" | 用于 structured tool-call emission 的 provider-level API |
| Tool declaration | "Tool spec" | Name + description + JSON Schema input payload |
| `tool_choice` | "Force / forbid" | Auto / required / none / specific-name modes |
| Strict mode | "Schema enforcement" | OpenAI flag，用于约束 decoding 以匹配 schema |
| `tool_use` block | "Anthropic's call shape" | 带 id、name、input 的 inline content block |
| `functionCall` part | "Gemini's call shape" | 包含 name、args 和 id 的 `parts[]` entry |
| Arguments-as-string | "Stringified JSON" | OpenAI 将 args 作为 JSON string 返回，而不是 object |
| Parallel tool calls | "Fan-out in one turn" | 一个 assistant message 中的多个 tool calls |
| Refusal | "Model declines" | strict-mode-only 的 refusal block，而不是 call |
| OpenAPI 3.0 subset | "Gemini schema quirk" | Gemini 使用一种类似 JSON-Schema 的 dialect，存在细微差异 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) 包含 rigoroso modo 和 paralelas chamadas de referência canônica
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)- Não .`tool_use`和 `tool_result`semântica de blocos
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) chamadas paralelas, ids únicas e subconjunto OpenAPI
- [Vertex AI — Function calling reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling) Superfície de nível empresarial de Gemini
- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) esquema de modo rigoroso 强制执行细节
