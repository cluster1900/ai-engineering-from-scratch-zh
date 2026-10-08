# A Interface de Ferramentas  Porquê Agentes  Necessitam de estruturação I/O

> 语言模型会生成代币――程序会执行动作―― entre os dois, a diferença é a interface de ferramenta: um contrato,让模型能够请求某一动作,并让主机执行它―― cada tipo de stack OpenAI、Anthropic 和 Gemini 上的函数 calling; MCPs `tools/call`As partes de tarefa do A2A são diferentes em um mesmo ciclo de quatro etapas.

**Type:** Learn
**Languages:** Python (stdlib, no LLM)
**Prerequisites:** Phase 11 (LLM completion APIs)
**Time:** ~45 minutes

## Objectivo de aprendizagem
- Explicar por que um LLM que só pode gerar texto não pode agir sozinho no mundo real.
- 画出四步工具-call loop (descrever → decidir → executar → observar),并说出每一步由谁负责──
- 将一个工具描述 写成三部分:name、JSON Schema input,以及确定性的执行函数──
- 区分纯工具和副作用工具,并说明为什么这种分分对安全很重要.

## 问题
LLM 输出是下一个代币的概率分布──这是它的全部输出表面── Se você perguntar a um modelo de bate-papo Bengaluru 现在天气是如何, pode escrever uma frase que parece razoável, mas não pode entrar na API do clima── essa frase pode ser apenas acaso verdadeira, também pode já ter passado três dias──

弥合这个差距正是工具界面的目的──主机程序你的代理运行时间──Claude Desktop、ChatGPT、Cursor,或一个自定义脚本会向模型公布一组可调用工具──当模型判断需要某动作时,它会输出一个结构化用荷,指明工具 及其论据──主机解析该用荷,真正运行工具,并把结果反回去──直到这个循环持续,模型判断不再需要更多调用──

A primeira versão deste contrato foi lançada em junho de 2023 em forma de funções e parametros do OpenAI.`tool_use`Blocos: Gémeos:`functionDeclarations` Agora cada fornecedor estão expostos à mesma forma: introduzir uma lista de ferramentas de tipo JSON-Schema 标注类型, emitir uma chamada de ferramenta de pagamento JSON-payload.

O ciclo de quatro etapas é a constante do fundo destes sistemas. O resto da fase 13 é o seu desenvolvimento.

## 概念
### Passo um: descrever

Host Used Three 字段声明 cada ferramenta

- **Name.**Um identificador de estabilidade.`get_weather`, em vez de uma coisa do tempo.
- **Description.**Uma secção de linguagem natural简介── Quando o usuário pergunta sobre a situação climática atual de uma cidade específica, não use o seu dados históricos──
- **Input schema.**一个描述工具参数的 JSON Schema object(project 2020-12)。

模型会接收这个列表――现代供应商会使用供应商特定模板将这些声明序列化进系统提示,因此作为调用方,你只需要处理结构化形式――

### Passo dois: decidir

给定用户消息和可用工具,模型会选择三种行为之一──

1. **直接用文本回答**Não fazer uma chamada de ferramenta.
2. **调用一个或多个 tools。**输出 estructured call objects──在 `parallel_tool_calls: true`O modelo pode ser executado em um turno em meio a várias chamadas.
3. **拒绝。**As saídas estruturadas de modo rigoroso podem gerar um tipo de`refusal`Bloque, em vez de chamar.

Uma ferramenta chamada de carga útil , três estáveis .`id`Ferramenta`name`, bem como JSON `arguments`A existência de um objeto, é importante para que o host possa conectar os resultados posteriores a uma chamada específica; quando chamadas paralelas retornam, isso é muito importante.

### Passo três: Execução

host  recebimento de chamada, de acordo com o esquema declarado verificação de argumentos,并运行执行器。 argumentos ineficazes significa que o modelo alucina 了某段或使用错误类型 é um modelo de falha muito comum em modelos fracos。 hosts em ambiente de produção para argumentos ineficazes geralmente fazem uma das três coisas:

Executor 本身只是普通代码──Python、TypeScript、shell command、database query── produz um resultado, normalmente uma cadeia, mas também pode ser qualquer valor JSON ou bloqueio de conteúdo estruturado ((em MCP pode ser texto、imagem ou referência de recurso)──o resultado deve ser sequenciado──

### Passo quatro: observar

O host vai gerar resultados de ferramentas  adicionar à conversa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                `id`de `tool`Módelo agora tem a saída de ferramenta no contexto, pode gerar resposta final, ou solicitar mais chamadas. Este processo continuará até que o modelo pare de emitir chamadas, ou o host atinja o limite de segurança do número de vezes.

### A confiança se divide.

As ferramentas têm dois tipos muito importantes para a segurança.

- **Pure.**Apenas ler, não ter efeitos secundários.`get_weather`- Não.`search_docs`- Não.`get_current_time` pode realizar com segurança 调用
- **Consequential.**Vai mudar o estado, gastar dinheiro, tocar os dados dos usuários.`send_email`- Não.`delete_file`- Não.`execute_trade`- Tenho de adicionar um portão.

Meta 2026 anos usados para segurança de agentes Rule of Two Indica que, em um turno, o máximo só pode simultaneamente conter dois dos três seguintes elementos: entrada não confiável, dados sensíveis, ação consequente, interface de ferramenta.

### Onde vive o ciclo

| Context | Who describes | Who decides | Who executes |
|---------|---------------|-------------|--------------|
| Single-turn function calling (OpenAI/Anthropic/Gemini) | App developer | LLM | App developer |
| MCP | MCP server | LLM via MCP client | MCP server |
| A2A | Agent Card publisher | Calling agent | Called agent |
| Web browser (function-calling agent) | Browser extension / WebMCP | LLM | Browser runtime |

O que quer que seja, todos os quatro passos são iguais.

### Por que não direto de prompt 模型 para a saída JSON?

 fazer um modelo usar JSON 回复 é uma função que chama para o modelo de saída anterior. Em modelos de fronteira, cerca de 5% a 15% do tempo vai falhar, em modelos menores a taxa de falha é maior.

Função nativa chamada melhor, razão há três pontos. Primeiro, o provedor vai usar uma forma de chamada precisa para o modelo para realizar treinamento de ponta a ponta, portanto, o modo rigoroso abaixo da taxa válida de JSON vai aumentar para 98% a 99%. Segundo, a carga útil da chamada está no próprio slot do protocolo, em vez de no texto livre.`tool_use`Os Gémeos`responseSchema`• Complementaridade obrigatória do esquema:

Fase 13 · 02 会并排讲解三供应商API──Fase 13 · 04 会深入结构化输出──

### Fusões de circuitos

Quando o modelo parar de emitir chamadas, ou o host atingir o máximo número de voltas, o ciclo termina. Os hosts do ambiente de produção geralmente colocam entre 5 a 20 voltas.

Outra opção é fazer loops sem limites.

Fase 14 · 12 会深入讲解错误恢复和自我治愈;Fase 17 会覆盖生产率限制──

### Fase 13 - Próximo - Para onde?

- Lições 02 a 05 会打磨 nível de fornecedor de ferramentas-chamadas de superfície.
- As lições 06 a 14 vão tornar este ciclo em MCP.
- Lições 15 a 18 会防护这个循环,抵御 hostile servers、adversarial users 和未认证远程作者表面──
- Lições 19 a 22 - Este modelo se estenderá para a colaboração agente-agente, observabilidade, encaminhamento e embalagem.
- Lição 23 会交付一个使用每个原始的完整生态系统――

O resto de cada aula é o início deste ciclo de quatro etapas.


```figure
tp-tool-loop
```

## Use-o
`code/main.py`O sistema de execução de um sistema de avaliação de dados é executado em um sistema de avaliação de dados de dados de um sistema de avaliação de dados de dados de um sistema de avaliação de dados de dados de um sistema de avaliação de dados de dados de um sistema de avaliação de dados de dados de um sistema de avaliação de dados de dados de um sistema de avaliação de dados de dados de um sistema de avaliação de dados de dados de um sistema de avaliação de dados de dados de dados de um sistema de avaliação de dados de dados de dados de um sistema de avaliação de dados de dados de dados de um sistema de avaliação de dados de dados de dados de dados de um sistema de avaliação de dados de dados de dados de dados de dados de um sistema de avaliação de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados

需要关注的内容:

- Registro de ferramentas para cada ferramenta 持有三个字段: nome, descrição, esquema e referência ao executor。
- O validador é um subconjunto mínimo de JSON Schema ((tipos, requisitos, enum, min/max), apenas usando stdlib 编写。Fase 13 · 04 会提供更完整的版本。
- O ciclo vai contar iterações. O número de iterações é limitado a cinco vezes.

## Entrega-o
本课会产出 `outputs/skill-tool-interface-reviewer.md` dar uma definição de projeto de ferramenta (nome + descrição + esquema + esboço de executor), esta habilidade 会审计它的循环 fitness:name 是否机器稳定,description 是否是完整的使用简介,schema 是否正确使用 JSON Schema 2020-12,以及纯对后果分类 是否明确──

## 练习
1. Para o`code/main.py`添加第四工具,名为 `get_stock_price(ticker)`将其描述 写成:当用户按 ticker 询问当前股票价格时使用──不要用于历史价格或市场摘要── 运行利用,并确认假决策者 会将提卡商的查询 路由到这个新工具──

2. 破坏 schema validator──传入一个 `arguments`Objeto  falta campo necessário chamada,并确认 host 会在执行前拒绝它──然后传入带有额外未知字段的调用──做出决定:host 应该拒绝还是忽视?

3. Vai utilizar cada ferramenta entre classificados para puro ou consequente.`consequential: true`bandeira,并修改循环,使其在选择后果工具 时打印一行 将与用户确认──这是每个生产主机都需要的确认门 形状──

4. Em papel, desenhe um ciclo de quatro etapas, e use a tabela de coluna do fornecedor acima para preencher o seu cliente preferido (Claude Desktop, Cursor, ChatGPT ou stack de auto-definição) e a variante específica do MCP na Fase 13 · 06

5. De cabeça para baixo ler o guia de chamadas de funções do OpenAI. Encontrar um que esteja no meio da solicitação, mas não está no meio do ciclo de quatro passos apresentado neste texto.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Tool | “模型可以调用的东西” | name + JSON-Schema-typed input + executor function 组成的三元组 |
| Function calling | “Native tool use” | Provider-level API 支持，用于输出结构化 tool calls，而不是 prose |
| Tool call | “模型发出的行动请求” | 模型输出的一个 JSON payload，包含 `id`、`name`、`arguments` |
| Tool result | “tool 返回的内容” | executor 的输出，被包装在带有匹配 id 的 `tool` role message 中 |
| Parallel tool calls | “一次多个 calls” | 一个 model turn 中的多个 call objects，彼此独立，并可通过 id 排序 |
| Strict mode | “Guaranteed JSON” | Constrained decoding，强制模型输出通过已声明 schema 的验证 |
| Pure tool | “Read-only tool” | 无 side effects；可以安全地重新运行 |
| Consequential tool | “Action tool” | 会改变 external state；需要 gate、audit 或用户确认 |
| Four-step loop | “The tool-call cycle” | describe → decide → execute → observe |
| Host | “Agent runtime” | 持有 tool registry、调用模型并运行 executor 的程序 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) Declarações de ferramentas em estilo OpenAI 和 referências canônicas de formas de chamada
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) Claude de `tool_use`- Não .`tool_result`formato de bloco
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) Gemini 中的 `functionDeclarations`和 semântica de chamadas paralelas
- [Model Context Protocol — Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) Presente inexistência  Instrumentos de acesso de fornecedores gerais
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) Cada ferramenta moderna API todos usam dialeto esquema
