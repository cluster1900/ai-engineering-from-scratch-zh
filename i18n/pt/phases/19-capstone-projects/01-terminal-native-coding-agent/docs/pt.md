# Capstone 01  终端原生 Agente de codificação

> Até 2026, a forma do agente de codificação já está definida. Um arsenal TUI, um plano em estado, uma superfície de ferramentas em caixa, um ciclo de planejamento responsável, ação, observação e recuperação.

**类型：**Capstone
**语言：**TypeScript / Bun (harness), Python (scriptos de idade)
**先修要求：**Fase 11 (engenharia de MLL), Fase 13 (ferramentas e protocolos), Fase 14 (agentes), Fase 15 (sistemas autônomos), Fase 17 (infraestrutura)
**覆盖阶段：**P0 · P5 · P7 · P10 · P11 · P13 · P14 · P15 · P17 · P18
**时间：**35 小时

## 问题
Até 2026, os agentes de codificação  tornaram-se dominantes AI  aplicação classe  Clode Code (Antropic)  Compositor 2  Compositor 2  Agente Tabs  Cursor 3  AMP (Sourcegraph)  OpenCode (112k estrelas)  Factory Droids e Google Jules  Publicaram diferentes variantes da mesma estrutura: um terminal harness  Uma área de ferramentas com permissão  uma caixa de areia  Um modelo de planejamento e observação de fronteira  A linha de frente  Live-SWE-agent  Utilize Opus 4.5 em SWE-bench Verified  Chegou a 79,2%  Mas o processo é amplo  A maioria dos modelos de engenharia falha  Não é errada  São ferramentas-loop instabilidade  Controle de envenenamento  Controle de dados  Equipamento de arquivos 

Você não consegue entender estes agentes de fora. Você tem que construir um, observar o ciclo na rodada 47 de ripgrep, voltar para 8MB e desmoronar, e depois reconstruir a camada de corte.

## 概念
O arame tem quatro superfícies.**Plan**维护一个 TodoWrite 风格的状态对象, 由模型 每一轮重写──**Act**分发 ferramentas chamadas (leia, editar, executar, procurar, git)**Observe**捕获 stdout / stderr / exit codes, realizar corte,并把摘要反回去──**Recover**Processar erros de ferramenta, evitando simultaneamente a explosão de uma janela de contexto ou um ciclo ilimitado.**hooks**- Não.`PreToolUse`- Não .`PostToolUse`- Não .`SessionStart`- Não .`SessionEnd`- Não .`UserPromptSubmit`- Não .`Notification`- Não .`Stop`, e `PreCompact`Estes são pontos de expansão configuráveis, o operador pode inserir-se em eles política, telemetria e guardrails.

sandbox utiliza E2B ou Daytona。 cada tarefa está em um novo devcontainer, e funciona em um git worktree.

## Arquitetura
```
  user CLI  ->  harness (Bun + Ink TUI)
                  |
                  v
           plan / act / observe loop  <--->  Claude Sonnet 4.7 / GPT-5.4-Codex / Gemini 3 Pro
                  |                          (via OpenRouter, model-agnostic)
                  v
           tool dispatcher (MCP StreamableHTTP client)
                  |
     +------------+------------+----------+
     v            v            v          v
  read/edit    ripgrep     tree-sitter   git/run
     |            |            |          |
     +------------+------------+----------+
                  |
                  v
           E2B / Daytona sandbox  (worktree isolated)
                  |
                  v
           hooks: Pre/Post, Session, Prompt, Compact
                  |
                  v
           OpenTelemetry -> Langfuse (spans, tokens, $)
                  |
                  v
           PR via GitHub app
```

## 技术
- Tempo de execução do arame: Bun 1.2 + Ink 5 (Reacção no terminal)
- Modelo 访问:OpenRouter 统一 API, suportar Claude Sonnet 4.7、GPT-5.4-Codex、Gemini 3 Pro、Opus 4.5(用于最难任务)
- Transporte de ferramentas: Modelo de protocolo contextual StreamableHTTP (revisao do MCP 2026)
- Caixas de areia: caixas de areia E2B (JS SDK) ou recipientes de desenvolvimento Daytona
- Pesquisa de código: subprocesso ripgrep, parseres de guarda-árvore para 17 idiomas (pre-compilado)
- Isolamento: `git worktree add`por tarefa, limpeza sobre sucesso / fracasso
- Arneses Eval: SWE-bench Pro (subconjunto verificado) + Terminal-Bench 2.0 + seu próprio retalho de 30 tarefas
- Observabilidade: OpenTelemetry SDK com `gen_ai.*`semconv → auto-hosted Langfuse
- Publicado em: GitHub App Use fine-grained token,scope limitation in target repo


```figure
ce-agent-loop
```

## Construí-lo
1. **TUI and command loop.**搭建一个使用墨的 Bun 项目──接收 `agent run <repo> "<task>"`△打印一个分屏视图:plan pane(顶部) 、tool-call stream(中部) 、Token budget(底部) △添加 Ctrl-C 取消逻辑,在退出前触发 `SessionEnd`- Não.

2. **Plan state.**定义一个带类型的 TodoWrite schema(incluindo pendentes / in_progress / items done 和 notes) ――model Cada rodada através da chamada de ferramenta 重写完整状态不要让它增量修改──将计划 持久化到`.agent/state.json`Depois do colapso, podemos retomar.

3. **Tool surface.**Definir seis ferramentas:`read_file`- Não .`edit_file`(带 diff preview), `ripgrep`- Não .`tree_sitter_symbols`- Não .`run_shell`(带 timeout), `git`(status / diff / commit / push) ―― através de MCP StreamableHTTP 暴露, make harness and transport 解── cada ferramenta 都返回截断后的输出(每次调用最多 4k Tokens)──

4. **Sandbox wrapping.**Cada missão inicia uma caixa de areia E2B.`git worktree add -b agent/$TASK_ID`创建一个新分公司── Todas as chamadas de ferramentas estão em sandbox内执行──host file system不可访问──

5. **Hooks.**实现全部八种 2026 hook 类型── pelo menos conectados quatro user编写的 hooks:(a) `PreToolUse`Guarda de comando destrutivo, bloquei a árvore de trabalho.`rm -rf`,(b) `PostToolUse`Contabilidade de tokens, ((c) `SessionStart`Inicialização orçamental,`Stop`写入 final trace bundle──

6. **Eval loop.**Clone um SWE-bench Pro Python 子集── para cada problema 运行你的 Harness──与迷你-swe-agent(mínimo base line)`eval/results.jsonl`- Não.

7. **Cost control.**- Capacidade de interceptação: 50 voltas, 200 mil contextos, 5 dólares por tarefa.`PreCompact`Hook em 150k 处将较早的转转 摘要为前状态块,为新观测 出空间,同时不丢失计划──

8. **PR posting.**Depois do sucesso, o último passo é:`git push`, então, convoque a API do GitHub, abra uma PR e, em inglês, conter um plano e um resumo diferente.

## Use-o
```
$ agent run ./my-repo "Fix the race condition in worker.rs"
[plan]  1 locate worker.rs and enumerate mutex uses
        2 identify shared state under contention
        3 propose fix, verify tests
[tool]  ripgrep mutex.*lock -t rust           (44 matches, truncated)
[tool]  read_file src/worker.rs 120..180
[tool]  edit_file src/worker.rs (+8 -3)
[tool]  run_shell cargo test worker::          (passed)
[plan]  1 done · 2 done · 3 done
[done]  PR opened: #482   turns=9   tokens=38k   cost=$0.41
```

## Entrega-o
competências de entrega 位于 `outputs/skill-terminal-coding-agent.md`△ deu-lhe um caminho de repo e descrição de tarefa, ele vai funcionar em sandbox, em completo plano-ato-observação de ciclo,并返回 PR URL 和 trace bundle──本 capstone:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 vs baseline | 你的 harness 与 mini-swe-agent 在 30 个匹配 Python tasks 上对比 |
| 20 | Architecture clarity | Plan/act/observe 分离、hook surface、tool schema——对照 Live-SWE-agent layout 评审 |
| 20 | Safety | Sandbox escape tests、permission prompts、destructive-command guard 通过 red-team |
| 20 | Observability | Trace completeness（100% 的 tool calls 都有 span）、每轮 Token accounting |
| 15 | Developer UX | Cold-start < 2s，crash recovery resumes plan，Ctrl-C 能干净地取消 mid-tool |
| **100** | | |

## 练习
1. O modelo de suporte será de Claude Sonnet 4.7 切换为运行在 vLLM 上的 Qwen3-Coder-30B──比较 pass@1 和 $-per-task──报告开放模型表现较差的地方──

2. - Adicione um .`reviewer`Sub-agente, em publicação de PR 前读取 diff,并可以请求一个修订循环──衡量虚假积极评论 是否会让SWE-bench pass rate 低于单代理基线(提示:通常会)。

3. 压测 sandbox:编写一个尝试 `curl`Exterior URL Tasks, bem como uma tentativa de escrever em árvore de trabalho Exterior Tasks, confirmar

4. Utilizando um modelo menor (Haiku 4.5)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   `PreCompact`Resumo: Messa em compactação 3x:

5. Para MCP StreamableHTTP transport 替换为studio──Benchmark cold-start 和 per-call latency──为本地使用选择胜者──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Harness | “agent loop” | 围绕 model 的代码，负责分发 tools、维护 plan state，并强制执行 budgets |
| Hook | “Agent event listener” | 由 harness 在八种 lifecycle events 之一上运行的用户编写脚本 |
| Worktree | “Git sandbox” | 位于独立路径的 linked git checkout；可以丢弃而不触碰 main clone |
| TodoWrite | “Plan state” | model 每轮都会重写的 typed list，包含 pending/in-progress/done items |
| StreamableHTTP | “MCP transport” | 2026 MCP revision：具备双向 streaming 的 long-lived HTTP connection；取代 SSE |
| Token ceiling | “Context budget” | 对 input+output Tokens 设置的每轮或每 session 上限；触发 compaction 或 termination |
| pass@1 | “Single-attempt pass rate” | SWE-bench tasks 在第一次运行中解决的比例，不包含 retry 或 test-set peeking |

## 延伸阅读
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) do arame de referência Anthropic
- [Cursor 3 changelog](https://cursor.com/changelog) Agente Tabs 和 Composer 2 notas de produto
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) Com base na comparação de arneses de banco SWE
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent) Utilização Opus 4.5 em SWE-banco Verificado alcançando 79,2%
- [OpenCode](https://opencode.ai)Arnes aberto, 112 mil estrelas
- [SWE-bench Pro leaderboard](https://www.swebench.com) 本 面向的评价
- [Model Context Protocol 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) StreamableHTTP,metadados de capacidade
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) ferramenta chamadas 和 Token uso de esquema de tempo
