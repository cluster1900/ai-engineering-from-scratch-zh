# Ferramentas paralelas Chamadas e Ferramentas de streaming

> Se seria executado, seria três vezes de volta e volta. Depois de executado, o total de tempo de uso será reduzido para o menor tempo de uso individual. Agora, cada fornecedor de fronteira pode emitir várias ferramentas em um único turno.

**类型：**Construir
**语言：**Python(stdlib, piscina de fios + arame de streaming)
**前置要求：**Fase 13 · 02 (função que chama a mergulho profundo)
**时间：**Cerca de 75 minutos

## Objectivo de aprendizagem

- Explicar por que existe .`parallel_tool_calls: true`E quando é que devemos desativar-nos?
- Durante o fan-out paralelo, será streamed argumentos blocos 关联到正确的工具-call id──
- Antes de resolver, a parte.`arguments`string 重组为完整 JSON。
- 运行一个三城市天气基准, mostrar latência sequencial vs paralela.

## 问题

没有平行电话 时,一个代理 回答 qua é o tempo em Bengaluru, Tóquio e Zurique 会这样做:

```
user -> LLM
LLM -> call get_weather(Bengaluru)
host -> run executor, reply with result
LLM -> call get_weather(Tokyo)
host -> run executor, reply with result
LLM -> call get_weather(Zurich)
host -> run executor, reply with result
LLM -> final text answer
```

Três vezes LLM 往返, cada vez mais para pagar executor latencia──大約是理想壁時計時間的4倍──

Utilize chamadas paralelas:

```
user -> LLM
LLM -> call get_weather(Bengaluru); call get_weather(Tokyo); call get_weather(Zurich)
host -> run all three executors concurrently, reply with three results
LLM -> final text answer
```

Uma vez LLM 往返──Executor 时间是三者的最大值,而不是总和──在OpenAI、Anthropic 和 Gemini 上的生产基准显示, para as cargas de trabalho de ventilador, o relógio de parede pode ser reduzido de 60% a 70%──

代价是相关性复杂性── quando três调用乱序完成, seus resultados devem levar com eles `tool_call_id`, deixe o modelo  pode colocá-los em conjunto. Quando o resultado é devolvido em formato de fluxo, você deve primeiro colocar fragmentos de argumento 组装成完整 JSON,再执行.

## 概念

### 启用 paralelo

- **OpenAI。** `parallel_tool_calls: true`默认开启──设置为 `false`- Não. - Não.
- **Anthropic。** através `disable_parallel_tool_use: false`实现 paralelos Claude 3.5 及以上默认开启)`true`É uma série.
- **Gemini。**始终具备平行能力 (competência paralela);`tool_config.function_calling_config.mode = "AUTO"`让模型决定――

Quando as ferramentas têm ordem dependente`create_file`Então ...`write_file`) 、 um tipo de entrada de uso afeta outro tipo de entrada de uso, ou um limite de taxa ∞ não pode suportar o fan-out ∞, desativar paralelo ∞

### Correlação Id

Modelo emitido cada um de nós tem um .`id`◊ host 返回的每个结果都必须包含一个ID. ◊ Sem esse id, os resultados serão incluídos.

- **OpenAI。**Cada artigo de ferramenta-rolo de mensagem`tool_call_id`- Não.
- **Anthropic。**Cada um .`tool_result`Bloco de cima`tool_use_id`- Não.
- **Gemini。**Cada um .`functionResponse`A primeira`id`(Gêmeos 3 及以上; Gêmeos 2 按名匹配,这会在同名的平行调用时出错)

### Não é necessário fazer chamadas

O anfitrião vai trabalhar em sua própria função, corretina ou remoto, para executar cada chamada.`asyncio.gather`Ou a concurência estruturada, ou a concordança estruturada, ou a concordança estruturada.

Um bug comum: segundo a lista de chamadas 顺序回复结果, não conforme a conclusão 顺序回复;;`tool_call_id`, mas se algum resultado for perdido ou repetido, a submissão de ordem desordenada tornará o teste mais difícil.

### Chamadas de ferramentas de streaming

Quando o modelo é em forma de fluxo de saída,`arguments`O programa está disponível para todos os usuários.

按供应商的结构:

- **OpenAI。**Cada pedaço é`choices[0].delta.tool_calls[i].function.arguments`(cordas parciais)`index`(lista de chamadas em posição central)`id`A primeira vez que apareceu, ele o leu e ele o viu.`finish_reason = "tool_calls"`时解析 JSON。
- **Anthropic。**Eventos de streaming é `message_start`E depois , em cada bloco , uma .`content_block_start`, tipo `tool_use`(conhece id、nome、空 entrada)`content_block_delta`eventos 携带 `input_json_delta`pedaços.`content_block_stop`Fechamos todos os quarteirões.
- **Gemini。** `streamFunctionCallArguments`(Gêmeos 3 及以上)`functionCallId`Por isso, chamadas podem ser feitas em forma completa.

### JSON parcial e parse-early 陷

Em`arguments`完整之前不能解析──像 `{"city": "Beng`Esse tipo de JSON parcial não é válido JSON, vai deixar errado.`finish_reason = "tool_calls"`、Antropico `content_block_stop`, ou o evento final do Gêmeo. Só tentou até lá.`json.loads` O método mais forte é o uso de um parcer JSON incremental, que produz eventos na estrutura; o guia de streaming do OpenAI recomenda essa prática, para mostrar o uso do indicador de pensamento em tempo real.

### Conclusão fora de ordem

```
call_A: fast API, returns first
call_B: slow API, returns second
call_C: median API, returns third
```

resposta do anfitrião  ainda devem citar ids:

```
[{role: "tool", tool_call_id: "call_A", content: ...},
 {role: "tool", tool_call_id: "call_B", content: ...},
 {role: "tool", tool_call_id: "call_C", content: ...}]
```

Em OpenAI ou Anthropic 上, responder no meio de ordem não afeta a correção.

### Indicador de referência: sequência vs paralelo

`code/main.py`模拟三个执行器,延迟分别为400、600 和 800 ms──Sequencial 运行总共需要1800 ms──Parallel 运行需要max(400,600,800) = 800 ms──差异是常量,而不是比例,所以节省会随工具数 增长──

Notações do mundo real: chamadas paralelas 会给下游 API 增加压力──对率有限服务做10路风扇out 会失败──Phase 13 · 17 会覆盖 gateway-level backpressure;retry semantics 计划放在未来阶段──

### Streaming fan-out do relógio de parede

Se o modelo for produzido em forma de stream, você pode executar os argumentos de uma chamada, completando-os imediatamente após a conclusão, em vez de todas as chamadas serem finalizadas. Esta é uma opção registrada pela OpenAI, mas não todos os SDK são expostos.


```figure
tp-parallel-fanout
```

## Use-o

`code/main.py`Há duas partes.`concurrent.futures.ThreadPoolExecutor`, sequência e paralelos de três chamadas para o tempo, e impressão de tempo de relógio de parede.`arguments`pedaços,并用 `StreamAccumulator`Não há LLM, não há rede, só há lógica de重组.

关注点:

- O cronómetro sequencial  atingir 1,8 segundos― o cronómetro paralelo em mesmas latências falsas  atingir 0,8 segundos―
- acumulador  através de buffering de id, e apenas em cada chamada de JSON 完整时解析, processar os fragmentos de ordem até chegar.
- Executor em algum id de argumentos finalizar 后立即启动, em vez de等 todos os fluxos 结束──

## Entrega-o

本课会产出 `outputs/skill-parallel-call-safety-check.md` Determinar um registro de ferramentas, essa habilidade 会 audit quais ferramentas podem ser paralelas seguramente, quais dependências de pedidos, quais limites de taxas de pressão,并返回一个带有每工具 `parallel_safe`Registro de modificações das bandeiras:

## 练习

1. 运行 `code/main.py`Não alterar latencias em forma de simulação, confirmar a relação paralela a sequencial,`max/sum`(trüger运行会因线程定制、序列化 和 带上支而而略偏离理想值)

2. 扩展蓄積器,处理 call foi cancelado em meados de corrente 情况:`cancelled`event── que fornecedor 明确 registrou esta situação?`content_block_stop`语义和 OpenAI 的 `finish_reason: "length"`- Não.

3. - Não .`asyncio.gather`替换线程池──对两者做基准──你应该能看到异步 有小幅收益,因为 context-switch cost 更低,但前提是执行者做真实I/O──

4. 选择两个不应对对齐的工具 (por exemplo)`create_file`Então ...`write_file`)。 Para o registo 添加一个 `ordering_dependency`gráfico,并基于该图对平行风扇做门――这是依赖意识规划的最小机制,未来的代理工程阶段 会将其形式化――

5. 阅读 OpenAI's paralelo-função-chamando seção 和 Antropic 的 `disable_parallel_tool_use`Docs. 找出 Antropic 建议禁用平行主义的一个真实世界工具类型──(提示:对同一资源的后果变化──)

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Parallel tool calls | “一个 turn 里的 fan-out” | Model 在单个 assistant message 中发出多个 tool calls |
| `parallel_tool_calls` | “OpenAI 的 flag” | 启用或禁用 multi-call emission |
| `disable_parallel_tool_use` | “Anthropic 的反向开关” | Opt-out flag；默认启用 parallel |
| Tool call id | “Correlation handle” | 每次调用的标识符，result message 必须原样回显 |
| Accumulator | “Stream buffer” | 用于 partial `arguments` chunks 的 per-id string buffer |
| Out-of-order completion | “最快的先返回” | Parallel calls 以不可预测的顺序完成；ids 是粘合剂 |
| Dependency graph | “Ordering constraints” | 某些 tools 的输出会进入其他 tools 的输入；不能 parallelize |
| Parse-early trap | “JSON.parse 炸了” | 尝试解析不完整的 `arguments` string |
| `streamFunctionCallArguments` | “Gemini 3 feature” | 带有每次调用 unique id 的 streamed argument chunks |
| Completion-order reply | “不要等全部完成” | 结果一到就回复，并按 id 标记 |

## 延伸阅读

- [OpenAI — Parallel function calling](https://platform.openai.com/docs/guides/function-calling#parallel-function-calling) 默认行为和opt-out flag
- [Anthropic — Tool use: implementing tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implementing-tool-use)- Não .`disable_parallel_tool_use`E resultado de batchagem
- [Google — Gemini function calling parallel section](https://ai.google.dev/gemini-api/docs/function-calling) Chamadas paralelas relacionadas com identidade de Gemini 3
- [OpenAI — Streaming responses with tools](https://platform.openai.com/docs/api-reference/responses-streaming) Redescontração de argumentos em pedaços de fluxos OpenAI
- [Anthropic — Streaming messages](https://docs.anthropic.com/en/api/messages-streaming)- Não .`input_json_delta`de `content_block_delta`
