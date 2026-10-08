# Claude Agente SDK:Subagents 和 Sessão Store

> Claude Agent SDK é um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código de Claude. É um código é um código de Claude. É um código é um código é um código.

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 分钟

## Objectivo de aprendizagem
- 解释 Antropic Client SDK(API bruto) e Claude Agent SDK(forma de arnes) entre diferença
- 描述 subagents:parallelization 和 context isolation,以及何时使用它们──
- Explicar a superfície de loja de sessão do Python SDK`append`- Não .`load`- Não .`list_sessions`- Não .`delete`- Não .`list_subkeys`) e `--session-mirror`O que é que isso significa?
- 实现 um arneses stdlib, incluindo ferramentas embutidas 带孤立 contextos  subagent spawning  lifecycle hooks 和 session store

## 问题
A API Raw LLM apenas lhe dá uma vez de ida e volta. O agente de produção precisa de execução de ferramentas, servidores MCP, ganchos de ciclo de vida, reprodução subagente, persistência de sessão, propagação de rastro. O SDK de agente Claude irá fornecer esse formato como uma biblioteca, ou seja, o código Claude utiliza o mesmo arnes, expondo-se a agentes personalizados utiliza-¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## 概念
### SDK do cliente vs SDK do agente

- **Client SDK (`anthropic`).**API de Mensagens Raw. Você é responsável pelo ciclo, ferramentas e estado.
- **Agent SDK (`claude-agent-sdk`).**Execução de ferramentas embutidas, conexões MCP, ganchos, reprodução subagente, loja de sessões, também é o ciclo de código Claude fornecido pela biblioteca.

### Ferramentas incorporadas

SDK 开箱附附10+ tools:file read/write、shell、grep、glob、web fetch etc.

### Sub-gêneros

O Anthropic regista dois usos:

1. **Parallelization.**Não é necessário que o sistema seja utilizado para executar as tarefas de sub-agente paralelo.
2. **Context isolation.**Os subagentes usam sua própria janela de contexto; apenas os resultados retornam ao orquestrador.

Recentemente, o Python SDK:`list_subagents()`- Não.`get_subagent_messages()`, para a leitura de transcrições subagentes.

### Loja de sessões

Com paridade de protocolo do TypeScript:

- `append(session_id, message)`- A minha mãe está a brincar.
- `load(session_id)`- Resumindo a conversa.
- `list_sessions()`- Não, não.
- `delete(session_id)` 带有对 subagent sessões de cascata
- `list_subkeys(session_id)`- Escolher chaves subagentes.

`--session-mirror`(Bandera CLI) vai ser espelhado para o arquivo externo, facilitando o depósito de erros.

### Anéis

Você pode registrar ganchos de ciclo de vida:

- `PreToolUse`- Não .`PostToolUse` porta ou chamadas de ferramentas de auditoria。
- `SessionStart`- Não .`SessionEnd`- Configurar e derrubar.
- `UserPromptSubmit`                                                                                                                                                                                                                                                              
- `PreCompact` 在 context compactação 之前运行。
- `Stop`- A saída do agente.
- `Notification` Alertas de canais laterais。

Os ganchos são pro-fluxo de trabalho (Fase 14 de referência curricular) e similar sistemas adicionar comportamento transversal de modo.

### Contexto de rastreamento W3C

调用方上活跃的OTel spans 会通过W3C trace context header 传播到CLI subprocess──整个多进程 trace 会在你的后端中显示为一个追踪──

### Claude gerenciava agentes

Hosted 替代方案 `managed-agents-2026-04-01`■■ Trabalho de sincronização de longa duração ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■

### Este padrão é fácil de encontrar

- **Subagent over-spawn.**Por 100 pequenas tarefas geram 100 sub-gentes.
- **Hook creep.**Cada equipa adiciona ganchos; tempo de arranque  inflação                                                                                                                                                                                                                                                        
- **Session bloat.**Sessões 持续累积;size 增长──使用 `list_sessions`+ Política de expiração.


```figure
ae-subagent-isolation
```

## Construí-lo
`code/main.py`Use stdlib  implementar a forma do SDK:

- `Tool`- Não .`ToolRegistry`, contém incorporado `read_file`- Não .`write_file`- Não .`list_dir`- Não.
- `Subagent` contexto privado ‧excurso isolado ‧ resultados de retorno 
- `SessionStore` apenda, carga, lista, exclusão, lista de sub-chaves.
- `Hooks`- Não .`pre_tool_use`- Não .`post_tool_use`- Não .`session_start`- Não .`session_end`- Não.
- Uma demonstração: agente principal produz 3 sub-gêneros paralelos, todos isolados, resultados agregados, não persistir sessão.

运行:

```
python3 code/main.py
```

Trace 会展示 subagente context isolação(orquestrador tamanho de contexto  manter limitado) 、 execução de gancho 和 sessão persistência。

## Use-o
- **Claude Agent SDK**Usando para querer Claude Code de forma de arame de produtos Claude-primeiro.
- **Claude Managed Agents**Us 用于 hosted long-running async work──
- **OpenAI Agents SDK**(Lessão 16) para os primeiros homólogos da OpenAI:
- **LangGraph + custom tools**Se quiser uma máquina de estado em forma de gráfico...

## Entrega-o
`outputs/skill-claude-agent-scaffold.md`É um aplicativo de SDK Claude Agent, contendo subagentes, ganchos, loja de sessões, servidor MCP e W3C de traços de propagação.

## 练习
1. Adicionar um subagente, colocar 20 tarefas batches 成每组 5 subagentes paralelos, medir o tamanho do contexto do orquestrador com a comparação de uma por tarefa.
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `PreToolUse`- Não, não.`write_file`Chamadas  realizar taxa-limite  Cada sessão  Cada minuto 5 vezes)  Trace o comportamento 
3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `list_subkeys`A árvore subagente... o ninho profundo...
4. Vai fazer esta peça de brinquedo real.`claude-agent-sdk`Pacote Python. Registro de ferramentas.
5. 阅读Claude Administrado Agentes docs...

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent SDK | “Claude Code as a library” | Harness shape：tools、MCP、hooks、subagents、session store |
| Subagent | “Child agent” | Separate context、own budget；results bubble up |
| Session store | “Conversation DB” | Persist、load、list、delete turns，并带 subagent cascade |
| Hook | “Lifecycle callback” | Pre/post tool、session、prompt submit、compact、stop |
| W3C trace context | “Cross-process trace” | Parent span propagates into CLI subprocess |
| Managed Agents | “Hosted harness” | Anthropic-hosted long-running async work |
| `--session-mirror` | “Transcript mirror” | 在 session turns streaming 时将它们写入外部文件 |
| MCP server | “Tool surface” | 附加到 agent 的外部 tool/resource source |

## 延伸阅读
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Claude Code 的库形态
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) 生产模式
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) hospedado 替代方案
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) contraparte
