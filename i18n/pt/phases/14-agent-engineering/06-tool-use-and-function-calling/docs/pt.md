# Utilização de ferramentas e chamada de função

> Toolformer (Schick et al., 2023) 开创了自我监督工具注释──Berkeley Function Calling Leaderboard V4 (Patil et al., 2025) 设定 2026年标准:40% agentec、30% multi-turn、10% live、10% não-live、10% alucinação──single-turn 已解决──memória、dynamic decision-making 和 long-horizon tool chains 还没有解决──

**Type:** Build
**Languages:** Python (stdlib)
**前置要求:**Fase 14 · 01 (Agente Loop), Fase 13 · 01 (Fúncia chamada Deep Dive)
**Time:** ~60 分钟

## Objectivo de aprendizagem
- 解释 Toolformer's auto-supervisado sinal de treinamento: apenas quando executar pode reduzir a próxima perda de token, apenas retém anotações da ferramenta.
- Explicar as cinco categorias de avaliação do BFCL V4, bem como cada categoria de medidas.
- 实现 um registro de ferramentas stdlib, contendo validação de esquemas, coacção de argumentos e sandboxing de execução.
- 诊断 2026 年三开题: long horizon tool chaining, dinâmica de tomada de decisão e memória

## 问题
早期 tool use 问的是:model 能否预测一个正确的功能调用?Modern tool use 问的是:model 能否跨 40 个步骤链式调用 tools,具备记忆,处理部分可观察性,恢复从工具故障中,并且不幻觉不存在的工具?

O Toolformer  estabeleceu a base: modelos podem ser utilizados através da auto-supervisão.

## 概念
### Instrumentformer (Schick et al., NeurIPS 2023)

Pensa: Deixe o modelo usar a API candidato chamadas para marcar seu próprio corpo de pré-treino. Para cada candidato executá-lo. Só quando contém o resultado da ferramenta pode diminuir uma perda de token, só retém essa anotação.

覆盖的工具:calculator、QA system、search engines、translator、calendar──auto-supervisão de sinais 纯粹关注工具 是否有助于预测文本,不需要人标──

规模结果:tool use 会在规模足够时涌现──较小的模型 会因工具注释受损;较大的模型会受益──这就是为什么2026年边界模型内置强的工具使用能力,而大多数7B models 需要显然的工具使用细调才可靠──

### Berkeley Função chamada Leaderboard V4 (Patil et al., ICML 2025)

BFCL é uma avaliação de facto de 2026 anos.

- **Agentic (40%)** 完整代理轨迹:memória, múltiplos turnos, decisões dinâmicas,
- **Multi-Turn (30%)** 带 tool chains 的交互式对话──
- **Live (10%)** Utilizador de enviar as instruções reais (pior difícil de distribuir)
- **Non-Live (10%)** casos de ensaio sintéticos。
- **Hallucination (10%)** 检测何时不应调用 ferramenta。

V3 introduziu avaliação baseada em estado: em sequência de ferramentas  depois, verificou o estado real da API (por exemplo, se os arquivos já foram criados?), em vez de as chamadas de ferramentas de correspondência AST── V4 aumentou a pesquisa web、 memória 和 categorias de sensibilidade ao formato──

2026 年关键发现:chamadas de função de turno único 基本已经解决──失败集中在记忆(跨轮 携带背景)、dynamic decision making(基于先前结果选择工具)、长视线链(20+ steps 后漂移) 和幻觉检测(没有合适工具 时拒调用)。

### Esquema de ferramenta

Cada fornecedor tem um esquema...

```
name: string
description: string (what it does, when to use it)
input_schema: JSON Schema (properties, required, types, enums)
```

Antropico  пряма употреба `input_schema`❖ OpenAI `function.parameters`◊ ambos aceitam JSON Schema──Descrições  assumir um papel fundamental, modelo 会读取它们来选择正确的工具──糟糕的工具描述是选择错误的工具 失败的第一大根原因──

### Validação de argumentos

Não acredite em qualquer ferramenta chamada.

1. **Type coercion.**Modelo pode estar em schema  requer int   local return `"5"` If明确无歧义就强制;否则拒绝
2. **Enum validation.**Se o esquema é escrito`status in {"open", "closed"}`, e modelo 输出 `"in_progress"`, em erro descritivo rejeitar.
3. **Required fields.**缺少 field required -> 立即把错误观察 返回给模型,而不是崩──
4. **Format validation.**Data, e-mails, URLs  Usar parseres específicos 验证, em vez de regex

Cada falha de validação deve retornar à observação estruturada, permitindo que o modelo possa usar a forma correta de teste novamente.

### Chamadas paralelas de ferramentas

现代 providers 支持在一个助手转 中并行 ferramenta chamadas。Loop:

1. O modelo lançou três chamadas de ferramentas, cada uma com uma diferença.`tool_use_id`- Não.
2. Tempo de execução  executá-los 
3. Cada resultado é um resultado .`tool_result`Bloco  retornar,并通过 `tool_use_id`- Não.

工程规则:把相关性 IDs 当作关键约束──把它们交换,就会导致错误工具到错误结果路由──

### Sandboxing

A execução de ferramentas é o limite da caixa de areia.`run_shell(cmd)`É um sinal de perigo;`git_status()`Mais seguro.


```figure
tool-routing
```

## Construí-lo
`code/main.py`实现 um registo de ferramentas de forma de produção:

- JSON Schema subconjunto validador(solo stdlib)。
- Registro de ferramentas, contém descrição, esquema de entrada, tempo de execução e executor.
- Argumento coerção 和 enum validação。
- 带 correlação IDs de despacho paralelo de ferramentas
- 作为结构化 strings 的错误观察──

- Não .

```
python3 code/main.py
```

Trace  mostra um mini agente em uma vez, usando três ferramentas, uma delas deliberadamente malformada chamada 会被拒绝,并返回模型 可以根据此行动的描述性错误──

## Use-o
Cada fornecedor tem seu próprio esquema de ferramentas:Antropic、OpenAI、Gemini、Bedrock。 Se precisar de multi-provedor, use a camada de tradução(OpenAI Agents SDK、Vercel AI SDK、LangChain tool adapter)。BFCL é referência de referência; se a ferramenta for usada é o produto núcleo, publicar e testar seu agente。

## Entrega-o
`outputs/skill-tool-registry.md`会为给定任务域 生成工具目录、 schema 和 registry──包含描述-quality checks(cada ferramenta de descrição 是否告诉模型何时使用它?)──

## 练习
1. Adicione uma ferramenta "no-op", deixe o modelo 能显然拒绝使用任何其他工具──在类似BFCL的幻觉测试上测量──
2. Por int-as-string e float-as-string 实现 argumento coerção―coerção De onde começará a ocultar bugs verdadeiros?
3. Adicione um tempo de paragem por ferramenta e um interruptor de circuito. Continuar a falhar 3 vezes depois, em 60 anos, rejeitar a ferramenta.
4. 阅读 BFCL V4 description──选择一个类别(例如"multi-turn"),并让你的代理 跑 10 个例提示──报告通过率──
5. Vai ser o validador do STDlib transferido para o Pydantic ou o Zod.

## 关键术语
| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Function calling | "Tool use" | 使用 validated schema 的 structured-output tool invocation |
| Toolformer | "Self-supervised tool annotation" | Schick 2023 — 保留那些结果能降低 next-Token Loss 的 tool calls |
| BFCL | "Berkeley Function Calling Leaderboard" | 2026 benchmark：40% agentic、30% multi-turn、10% live、10% non-live、10% hallucination |
| Tool schema | "给 model 的 function signature" | name、description、arguments 的 JSON Schema |
| tool_use_id | "Correlation ID" | 将 tool call 与其 result 绑定；对 parallel dispatch 至关重要 |
| Hallucination detection | "知道何时不调用" | V4 category：没有合适 tool 时拒绝调用 |
| Argument coercion | "String-to-int repair" | 针对可预测 schema mismatch 的窄修复；如果有歧义则 reject |
| Sandboxing | "Tool execution boundary" | 每个 tool 的 read/write surface、network、timeout、memory cap |

## 延伸阅读
- [Schick et al., Toolformer (arXiv:2302.04761)](https://arxiv.org/abs/2302.04761) Anotado de ferramentas auto-supervisionadas
- [Berkeley Function Calling Leaderboard (V4)](https://gorilla.cs.berkeley.edu/leaderboard.html) Valor de referência de avaliação 2026
- [Anthropic, Tool use documentation](https://platform.claude.com/docs/en/agent-sdk/overview) Claude Agent SDK 中的 produção ferramenta esquema
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) tipo de ferramenta de função 和 Guardrails
