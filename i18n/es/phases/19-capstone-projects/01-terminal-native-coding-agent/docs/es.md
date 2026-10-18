# Capstone 01  终端原生 Agente de codificación

> Para 2026, el formato del agente de codificación ya está determinado. Un arnés TUI, un plan en estado, una superficie de herramientas en caja, un ciclo de planificación responsable, acción, observación, recuperación. El código de claude, el curso 3 y el código abierto de lejos varían mucho.

**类型：**Capstone
**语言：**TypeScript / Bun (harness), Python (escritos de la época)
**先修要求：**Fase 11 (ingeniería de la gestión de los sistemas de gestión de datos), Fase 13 (herramientas y protocolos), Fase 14 (agentes), Fase 15 (sistemas autónomos), Fase 17 (infraestructura)
**覆盖阶段：**P0 · P5 · P7 · P10 · P11 · P13 · P14 · P15 · P17 · P18
**时间：**35 小时

##  problemas
Para 2026, los agentes de codificación se han convertido en el dominante AI  aplicación de clases. Código Claude (Antropic) 带 Composer 2 和 Agent Tabs of Cursor 3 (Cursor)  AMP (Sourcegraph)  OpenCode (112k stars)  Factory Droids y Google Jules han publicado diferentes variantes de la misma estructura: un arnés terminal  una superficie de herramientas con permisos  una caja de arena, así como un modelo de observación de planes en torno a la frontera  Una serie de sistemas de control y control de datos  Una serie de sistemas de archivos 

Usted no puede entender estos agentes desde fuera. Usted tiene que construir uno, observar el ciclo en la ronda 47 debido a la ruptura.

## 概念
El arnés tiene cuatro superficies.**Plan**维护一个 TodoWrite 风格的状态对象, por modelo Cada una de las rondas de la reescritura**Act**分发 herramientas llamadas (leer, editar, ejecutar, buscar, git)**Observe**捕获 stdout / stderr / exit codes, realizar el corte,并把摘要反回去──**Recover**Tratar errores de herramienta, al mismo tiempo que evitar que se estalle una ventana de contexto o un ciclo ilimitado.**hooks**¿Qué es eso?`PreToolUse`¿ Qué ?`PostToolUse`¿ Qué ?`SessionStart`¿ Qué ?`SessionEnd`¿ Qué ?`UserPromptSubmit`¿ Qué ?`Notification`¿ Qué ?`Stop`, y `PreCompact`Estos son puntos de expansión configurables, el operador puede insertar en ellos políticas, telemetría y barandillas.

sandbox utiliza E2B o Daytona。 cada tarea está en un nuevo devcontainer, y se ejecuta, y se instala en un git de trabajo de escritura. Arnes  nunca tocará el sistema de archivos host. Worktree, después de su éxito o fracaso, será destruido.

## 架构
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
- Tiempo de ejecución del arnés: Bun 1.2 + Tinta 5 (Reacción en terminal)
- Modelo 访问:OpenRouter 统一 API, soporte Claude Sonnet 4.7、GPT-5.4-Codex、Gemini 3 Pro、Opus 4.5(Para las tareas más difíciles)
- Transporte de herramientas: Modelo de protocolo de contexto StreamableHTTP (revisión MCP 2026)
- Cajas de arena: cajas de arena E2B (JS SDK) o contenedores de desarrollo de Daytona
- Busca de código: subproceso ripgrep, parseres para 17 idiomas (pre-compilados)
- El aislamiento: `git worktree add`por tarea, limpieza sobre el éxito / fracaso
- Arnés Eval: SWE-bench Pro (subconjunto verificado) + Terminal-Bench 2.0 + su propio retener de 30 tareas
- Observabilidad: OpenTelemetry SDK con `gen_ai.*`semconv → Langfuse auto-alojado
- Publicidad de relaciones públicas: GitHub App Utiliza fijo-grano de token, alcance  limita en el objetivo de repo


```figure
ce-agent-loop
```

## Construirlo
1. **TUI and command loop.**搭建一个使用墨的 Bun 项目──接收 `agent run <repo> "<task>"`△打印一个分屏视图:plan pane(顶部) 、 herramienta-call stream(中部) 、Token budget(底部) △添加 Ctrl-C 取消逻辑,在退出前触发 `SessionEnd`¿Qué es eso?

2. **Plan state.**定义一个带类型的 TodoWrite schema(incluye elementos pendientes / en progreso / hechos y notas) ――model Cada ronda a través de la herramienta llamada 重写完整状态不要让它增量修改──将计划 持久化到`.agent/state.json`, así que después del colapso podemos reanudar.

3. **Tool surface.**定义六个工具:`read_file`¿ Qué ?`edit_file`(带 diff preview), `ripgrep`¿ Qué ?`tree_sitter_symbols`¿ Qué ?`run_shell`(带 timeout), `git`(estatus / dif / commit / push) ―― a través de MCP StreamableHTTP 暴露, hacer uso y transporte 解── cada herramienta 都返回截断后的输出(每次调用最多4k Tokens)──

4. **Sandbox wrapping.**Cada tarea se inicia una caja de arena E2B.`git worktree add -b agent/$TASK_ID`Crear una nueva sucursal ∼ Todas las llamadas de herramientas están en sandbox ∼ ejecutar ∼ sistema de archivos host ∼

5. **Hooks.**实现全部八种2026 hook 类型──至少接入四个用户编写的 hooks:(a) `PreToolUse`Guardia de mando destructiva, bloquear el árbol de trabajo.`rm -rf`,(b) `PostToolUse`Contabilidad de tokens,`SessionStart`Inicialización del presupuesto,`Stop`写入 último paquete de rastro。

6. **Eval loop.**Clone un SWE-bench de 30 números Pro Python 子集── para cada problema 运行你的 Harness── con mini-swe-agent(mínimo baseline) Comparar pasar@1、turns-per-task 和 $-per-task──将结果写入 `eval/results.jsonl`¿Qué es eso?

7. **Cost control.**硬性截断: 50 vueltas 200k contexto 五千美元 por tarea`PreCompact`En el momento de la primera vuelta, el grupo de 150K se encuentra en un bloque de estado anterior, y para nuevas observaciones, el plano se encuentra en el espacio.

8. **PR posting.**Después del éxito, el último paso es`git push`, luego recurrir a GitHub API  abre una PR, y en verdad contiene un plan y un resumen diferente.

## Usalo
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

##  entregarlo
habilidad de entrega 位于 `outputs/skill-terminal-coding-agent.md`△ dado un recorrido de repo y descripción de tarea, que se ejecutará en sandbox en el ciclo completo de plan-acto-observación,并返回 PR URL 和 trace bundle──本 capstone:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 vs baseline | 你的 harness 与 mini-swe-agent 在 30 个匹配 Python tasks 上对比 |
| 20 | Architecture clarity | Plan/act/observe 分离、hook surface、tool schema——对照 Live-SWE-agent layout 评审 |
| 20 | Safety | Sandbox escape tests、permission prompts、destructive-command guard 通过 red-team |
| 20 | Observability | Trace completeness（100% 的 tool calls 都有 span）、每轮 Token accounting |
| 15 | Developer UX | Cold-start < 2s，crash recovery resumes plan，Ctrl-C 能干净地取消 mid-tool |
| **100** | | |

##  ejercicios
1. Se puede utilizar el modelo de apoyo de Claude Sonnet 4.7 切换为运行在 vLLM 上的 Qwen3-Coder-30B──比较pass@1 和 $-per-task──报告开放模型表现较差的地方──

2. Añade uno.`reviewer`En el caso de los Estados Unidos, el número de personas que han recibido una evaluación de la evaluación de los resultados de la evaluación de los resultados de la evaluación de los resultados de la evaluación de los resultados de la evaluación de los resultados de la evaluación de los resultados de la evaluación de los resultados de la evaluación de los resultados de la evaluación de los resultados de la evaluación de los resultados de la evaluación de los resultados de la evaluación de la evaluación de los resultados de la evaluación de la evaluación de los resultados de la evaluación de la evaluación de los resultados de la evaluación de la evaluación de los resultados de la evaluación de la evaluación de la evaluación de los resultados de la evaluación de la evaluación de la evaluación de los resultados de la evaluación de la evaluación de la evaluación de los resultados de la evaluación de la evaluación de la evaluación de los resultados de la evaluación de la evaluación de la evaluación de la evaluación de los resultados de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de los resultados de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de los resultados de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación de la evaluación

3. 压测 sandbox:编写一个尝试 `curl`Exterior URL de tareas, así como un intento de escribir en el árbol de trabajo Exterior de tareas.

4. Utilizando un modelo más pequeño (Haiku 4.5)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `PreCompact`Resumen: Mejora en 3x compactación:

5. Para el transporte MCP StreamableHTTP 替换为studio──BENCHMARK cold-start 和 per-call latency──为本地使用选择胜者──

## 关键术语: "El hombre es un hombre"
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
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) De Antropic                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
- [Cursor 3 changelog](https://cursor.com/changelog) Agente Tabs 和 Compositor 2 notas de producto
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) Con el uso de la comparación de arnés de banco SWE de referencia mínima
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent) Uso de Opus 4.5 en SWE-bench Verificado hasta alcanzar el 79.2%
- [OpenCode](https://opencode.ai) Arneso abierto,112k estrellas
- [SWE-bench Pro leaderboard](https://www.swebench.com) 本 面向的 evaluación
- [Model Context Protocol 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) Metadatos de capacidad de transmisión
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) llamadas de herramienta 和 esquema de uso de tokens
