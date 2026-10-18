# 综合项目 16  GitHub Emisión a PR Agente autónomo

> AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud 和 Google Jules todos entregaron el mismo formato de producto 2026: dar un problema 打标签, get a PR── en la caja de arena de la nube, agente de verificación 通过,并发布一个带有合理的、可供审查的 PR── dificultad se encuentra en el entorno de construcción de auto-reproduce reposts、 prevenir la filtración de credenciales、 obligar a ejecutar presupuestos por repuestos, así como asegurar que el agente 无法强迫── esta piedra angular se construirá versión auto-hosted, y en 和 和 费用通过率 上与托管替代品对比──

**Type:** Capstone
**Languages:** Python (agent), TypeScript (GitHub App), YAML (Actions)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P17
**Time:** 30 小时

##  problemas
Async Cloud Coding Agent es un agente diferente a los agentes de codificación interactivos (capstone 01) de productos independientes.`@agent fix this`,worker 会在云沙箱中启动、克隆 repo、运行测试、编辑文件、验证,并打开一个在正文中包含代理理性的PR──没有交互循环,也没有终端──AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud、Google Jules和 Factory Droids都朝着这个形态收收──

工程挑战很具体:environment reproduction(agent 必须在没有缓存的 dev image的情况下从零 build repo) flaky tests(必须重新运行或隔离) 信用范围测试(必须拥有最小的细微的权限的 GitHub App) 按 repo 按天执行预算,以及没有强迫政策──这个顶石会衡量通过率、成本和安全,并与托管的替代方案对比──

## 概念
触发器是 GitHub webhook (** etiqueta de problema o comentario de relaciones públicas) ◦ dispatcher trabajará en equipo en ECS Fargate o Lambda♦worker trabajará en repo 拉入 Daytona o E2B sandbox, y utilizará el repositorio 推断出的通用 Dockerfile(language、framework) ◦agent 运行一个面向Claude Opus 4.7 o GPT-5.4-Codex的mini-swe-agent o SWE-agent v2 loop♦

La verificación es un paso de puerta. PR 打开前, el CI completo 必须在沙盒中通过──计算覆盖德拉; si supera值为负, PR 仍将打开,但将被标记为 `needs-review` agente 会把 rationale 作为 PR description 发布,并添加一个评论员可 ping 以进行后续的 `@agent`El hilo

Seguridad a través de dos superficies diferentes de GitHub  realizar limitada: App  proporcionar un token de instalación de corto plazo, disponer `workflows: read`Y más estrechos contenidos de repos/combines de relaciones públicas; protección de la rama(en lugar de permisos de aplicación)`main`和 prohibir el empuje forzoso, y la aplicación 永远不会被加入绕行列表──对 `.github/workflows`El acceso solo para leer en el camino no es primitivo en la aplicación GitHub, por lo que las modificaciones de archivos de los agentes deben ser ejecutadas en el personal.

## 架构
```
GitHub issue 被标记为 `@agent fix` 或 PR comment
            |
            v
    GitHub App webhook -> AWS Lambda dispatcher
            |
            v
    ECS Fargate task（或 GitHub Actions self-hosted runner）
       - pull repo
       - infer Dockerfile（language、package manager）
       - Daytona / E2B sandbox，带 target runtime
       - clone -> git worktree -> agent branch
            |
            v
    mini-swe-agent / SWE-agent v2 loop
       Claude Opus 4.7 或 GPT-5.4-Codex
       tools: ripgrep, tree-sitter, read/edit, run_tests, git
            |
            v
    verify CI passes in-sandbox + coverage delta check
            |
            v（已验证）
    git push + 通过 GitHub App open PR
       PR body = rationale + diff summary + trace URL
       label: needs-review
            |
            v
    operator review；可以 @-mention agent 进行 follow-ups
```

## 技术
- Trigger:  poseer fijo-grano de token de la aplicación GitHub; a través de Lambda o Fly.io de receptor webhook
- Trabajador: tarea de ECS Fargate(o GitHub Actions auto-hosted runner)
- Sandbox: Cada tarea un depósito de Daytona o una caja de arena E2B
- Bucle de agente:  basado en Claude Opus 4.7 / GPT-5.4-Codex de mini-swe-agent base o SWE-agent v2
- Recuperación: mapa de repos del árbol + ripgrep
- Verificación: CI completo en la caja de arena + puerta delta de cobertura
- Observabilidad: Langfuse,带 por archivo de rastro de relaciones públicas,并从 PR body 链接
- Presupuesto: límite diario por repo; cada repo Cada día más PR


```figure
cf-issue-to-pr
```

## Construirlo
1. **GitHub App.**Títulos de instalación de granos finos: problemas de lectura+escritura、pull_requests de escritura、contentos de lectura+escritura、flujos de trabajo de lectura。 protección de ramas(única superficie que puede lograrlo)`main`和禁止强迫;app 不在绕行列中──trabajadores en la lista de bypass`.github/workflows`Control de la lista de permisos de contenido, ya que los permisos de la aplicación GitHub no están a escala de camino.

2. **Webhook receiver.**Función Lambda 接收 tema etiqueta / comentarios de relaciones públicas webhooks。 según etiqueta `@agent fix this`Entrando a la SQS.

3. **Dispatcher.**Desde SQS 弹出 tareas──强制执行 per-repo por presupuesto diario── utilizar URL de repo、 cuerpo de emisión 和一个全新的 Daytona sandbox 启动 ECS Fargate tarea──

4. **Environment inference.**检测 language(Python、Node、Go、Rust) y el gerente de paquetes(uv、pnpm、go mod、cargo)

5. **Agent loop.**Utiliza Claude Opus 4.7 de mini-swe-agent o SWE-agent v2── herramientas: ripgrep、tree-sitter repo-map、read_file、edit_file、run_tests、git──硬限制: $ 20 cost、30 min de pared-reloj、30 agentes giros──

6. **Verification.**En el último ciclo, en el interior de la caja de arena, se ejecuta la suite de pruebas completa.`needs-review`etiqueta de la PR.

7. **PR posting.**Push agente de la rama. A través de GitHub API 打开 PR, contenidos: título, racional, resumen diferente, rastreo de URL, costo, ventas.

8. **Credential hygiene.**Trabajadores utilizan el token de instalación de la aplicación GitHub de corto plazo 运行――Logs 在归档前会 scrub secrets――

9. **Eval.**30 个不同难度的种种内问题――衡量通过率、PR quality(diferente tamaño、estilo、cobertura)、cost、latencia―: en los mismos temas 上与Cursor Background Agents 和 AWS Remote SWE Agents对比──

## Usalo
```
# on github.com
  - user 用 `@agent fix this` 标记 issue #842
  - 14 分钟后出现 PR #1903
  - body:
    > 修复了 widget.dedupe() 中由 null comparator entry 导致的 NPE。
    > 添加了 regression test widget_test.go::TestDedupeNullComparator。
    > Coverage delta: +0.12%
    > Turns: 7  Cost: $1.80  Trace: langfuse:...
    > Label: needs-review
```

##  entregarlo
`outputs/skill-issue-to-pr.md`Es entregable. Un empleado de la nube de GitHub App + async, puede ser marcado por problemas.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 30 个 issues 上的 pass rate | End-to-end success（CI green + coverage OK） |
| 20 | PR quality | Diff size、coverage delta、style conformance |
| 20 | 每个已解决 issue 的 cost 和 latency | 每个 PR 的 $ 和 wall-clock |
| 20 | Safety | Scoped token、per-repo budget、no force-push、credential hygiene |
| 15 | Operator UX | Rationale comments、retry affordance、@-mention follow-up |
| **100** | | |

##  ejercicios
1. 添加一个fix test escamoso 模式:label `@agent stabilize-flake TestX`Se ejecutó la prueba 50 veces y se propuso una modificación mínima que pudiera estabilizarla.

2. En tres temas compartidos, el costo de los agentes de trasfondo de cursores se compara con el costo de los agentes de trasfondo de cursores.

3.  Implementar un tablero de presupuesto: costo por día, por usuario, por reporte, por anomalía, por alerta, por usuario.

4. Construir un modelo de funcionamiento seco: no se ejecuta el CI en el marco del proyecto de relaciones públicas, para que los revisores puedan tener un plan de inspección de bajo coste.

5. 添加保留政策: más de 7 天未合并的公关分公司 会自动删除──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GitHub App | “Scoped bot identity” | 具备 fine-grained permissions + short-lived installation token 的 App |
| Async cloud agent | “Background agent” | 在 cloud sandbox 中运行的 non-interactive worker，而不是 terminal |
| Environment inference | “Dockerfile synthesis” | 检测 language + package manager，若缺失则生成 Dockerfile |
| Verification | “CI-in-sandbox” | 打开 PR 前在 worker 内运行完整 test suite |
| Coverage delta | “Coverage preservation” | 从 base 到 agent branch 的 test coverage % 变化 |
| Per-repo budget | “Daily ceiling” | 在 dispatcher 强制执行的 dollar 和 PR-count cap |
| Rationale | “PR body explanation” | agent 对变更内容及原因的总结；PR body 中必须包含 |

## 延伸阅读
- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) 标准 referencia de agente de nube sincronizada
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) Referencia de las CLI
- [Cursor Background Agents](https://docs.cursor.com/background-agent) Alternativa comercial
- [OpenAI Codex (cloud)](https://openai.com/codex) Competidor acogido
- [Google Jules](https://jules.google) Google de la versión alojada
- [Factory Droids](https://www.factory.ai) Referencia comercial alternativa
- [GitHub App documentation](https://docs.github.com/en/apps) Identidad del bot de alcance
- [Daytona cloud sandboxes](https://daytona.io) caja de arena de referencia
