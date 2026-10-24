# Capstone 10  Equipo de ingeniería de software multi-agente

> La estructura de fábrica de SWE-AF, la estructura de metaGPT, la función de los actores, la función de los autores, el gráfico de los actores de tipo de AutoGen 0.4, la Devin de la Cognición, así como los droides de la fábrica, todos en 2026 recibieron el mismo formato: arquitecto responsable de la planificación, los programadores en los árboles de trabajo, el revisor responsable de la puerta, el probador responsable de la verificación, los árboles de trabajo, poner el reloj de pared en el proceso de producción, el estado compartido y los protocolos de entrega, se convierte en una superficie de fracaso. El objetivo de este hito es construir este equipo, evaluar y informar sobre las entregas que se producen en el SWE-bench, así como la tasa de fracaso.

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 小时

##  problemas
Agenta única de codificación de aranceles en tareas grandes se encontrarán en el límite. La razón no es que cualquier agente  es débil, sino que el contexto de 200k-Token  no puede aceptar simultáneamente el plan de arquitectura  cuatro slices de código de base  comentarios de revisores y resultados de pruebas Fabricas multi-agentes  Se dividen problemas: arquitecto  responsable del plan, codificadores  responsables de la ejecución en los árboles de trabajo  revisor  responsable de la puerta, tester  responsable de la verificación Arquitectura de "fábrica"  MetaGPT  funciones de AutoGen, estos tres tipos de marco describen un mismo estado de ánimo.

La superficie de fracaso es el codo. Arquitecto planeó los codificadores  imposible de lograr. Contenido. Los codificadores  producen conflictos entre sí. Revisor  aprobó una solución alucinada.

## 概念
Los roles son agentes tipografizados.**Architect**(Claude Opus 4.7) 读取 issue,编写计划,并将其分分为带有显式界面的子任务──**Coders**(Claude Sonnet 4.7, N 个并行实例, cada caso en un `git worktree`+ Daytona sandbox 中) 独立实现 subtasks。**Reviewer**(GPT-5.4) 读取合并后的差,并批准或请求具体修改──**Tester**(Gemini 2.5 Pro) En el ambiente aislado, no se usan artefactos  报告 pass/fail──

通信通過共享タスクボード (CCB) 文件支持或 Redis) 完成──每一角色 消费它被允许处理的任务──Handoffs es A2A-protocol-type messages──协调问题包括:merge-conflict resolution (combinación de conflictos) 协调员角色或自动三向融合) 共有状态同步 (共享状态同步) 编码器 开始后计划 被结;计划是独立事件),以及审查员的门户管理 (reviewers 不能批准它自己做出的更改或它提出的更改) ⋅

La amplificación de tokens es un costo oculto. Cada límite de rol aumenta las instrucciones de resumen y el contexto de entrega. Una carrera de 40 vueltas de un solo agente se convertirá en 160 vueltas totales de cuatro roles.

## 架构
```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   reads issue, produces plan with subtasks + interfaces
      |
      v
Task board (file / Redis)
      |
   +-- subtask 1 ---+-- subtask 2 ---+-- subtask 3 ---+-- subtask 4 ---+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          (4 parallel)
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           merge coordinator  (three-way merge + conflict resolution)
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> passes? -> open PR
                                     -> fails?  -> route back to coder
```

## 技术
- Orquestación: LangGraph con estado compartido + subgrafos por agente
- Comunicación: Protocolo A2A (Google 2025) para mensajes entre agentes digitalizados
- Modelos: Opus 4.7 (arquitecto), Sonnet 4.7 (codrador), GPT-5.4 (revisor), Gemini 2.5 Pro (tester)
- aislamiento de árboles de trabajo: `git worktree add`por codificador + caja de arena Daytona
- Coordinador de fusión: fusión en tres vías personalizada + resolución de conflictos mediada por el MLL
- Eval: SWE-bench Pro (50 números), escenarios SWE-AF, HumanEval++ para pruebas unitarias
- Observabilidad: Langfuse con extensiones de etiquetas de rol, contabilidad de tokens por agente
- Despliegue: K8s, cada rol Una implementación independiente,并 basada en el backlog  configurar HPA


```figure
ce-team-handoff
```

## Construirlo
1. **Task board.**JSONL respaldado por archivos, contiene mensajes mecanografados:`plan_request`¿Qué es esto?`subtask`¿Qué es esto?`diff_ready`¿Qué es esto?`review_needed`¿Qué es esto?`test_needed`¿Qué es esto?`approved`¿Qué es esto?`rejected`¿Qué es esto?`replan_needed` Agentes 订阅 tags♦

2. **Architect.**读取 GitHub issue, using带有计划模板的 Opus 4.7, requiring apparent subtask interfaces(触及文件、公共功能、测试影响)`plan_request`¿Qué es eso?

3. **Coders.**N 个并行 trabajadores, cada trabajador de la junta Central reclaman una subtarefa. Cada trabajador inicia una nueva.`git worktree add`Ramo y una caja de arena Daytona, lograr subtareas, lanzar con parche y deltas de prueba.`diff_ready`¿Qué es eso?

4. **Merge coordinator.**Cuando todos los codificadores 完成后,将 N 个分支 通过三向合并 合并到阶段分支──只有存在文件级重叠时,才使用LLM-mediated conflict resolution──

5. **Reviewer.**GPT-5.4 读取合并后的差异──不能批准它自己编写的差异──发出 `approved`(no-op) o con solicitudes concretas de cambio `review_feedback`,并路由回相关编码器──

6. **Tester.**Gemini 2.5 Pro en el interior de la caja de arena.`test_passed`O `test_failed`◊ los test de fracaso vuelven a tener un código de subtarefa fracaso.

7. **Handoff accounting.**Cada uno de los mensajes de los límites de rol que se cruzan en Langfuse se obtiene un espacio de tiempo, se registra el tamaño de la carga útil y el modelo de uso.

8. **Eval.**En 50 SWE-bench Pro issues 上运行──将 pass@1 和 $-per-solved-issue con una base de agente única(un Sonnet 4.7, en un solo árbol de trabajo) Compare──

9. **Post-mortem.**Para cada problema de fracaso, identifica las entregas de fracaso (plan demasiado vaga, conflicto de fusión, falsa aprobación del revisor, flaque del probador)

## Usalo
```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] plan: 4 subtasks (parser, cache, api, migration)
[board]     dispatched to 4 coders in parallel worktrees
[coder-A]   subtask parser  -> 42 lines, tests pass locally
[coder-B]   subtask cache   -> 88 lines, tests pass locally
[coder-C]   subtask api     -> 31 lines, tests pass locally
[coder-D]   subtask migration -> 19 lines, tests pass locally
[merge]     3-way merge: 0 conflicts
[reviewer]  comments on cache (thread pool sizing); routed to coder-B
[coder-B]   revision: 92 lines; submits
[reviewer]  approved
[tester]    all 412 tests pass
[pr]        opened #3382   4 coders, 1 revision, $4.90, 18m
```

##  entregarlo
`outputs/skill-multi-agent-team.md`Es entregable. Se determina un problema de URL y nivel de paralelismo, este equipo generará una PR lista para la fusión, y proporcionará una contabilidad de tokens por rol.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 匹配的 50-issue subset，pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | injected-bug probe 上的 false-approval rate |
| 20 | Token efficiency | 每个 solved issue 的 total tokens vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution、handoff-failure histogram |
| **100** | | |

##  ejercicios
1. En el camino de la operación hacia la diferencia se introduce un error evidente`return None`)。 tasa de mala aprobación del revisor de la medida―调优 de la revisión de la solicitud, hasta que la mala aprobación 低于5%―

2. 减少到两个编码器 (arquitecto + 两个编码器 + revisor + tester, cada uno de ellos 顺序运行两个子任务) △比较墙钟 和通过率──

3. Utiliza restricción de escritora única  sustituir el coordinador de fusión  subtareas 触及不相交的 ficheros)  carga de planificación del arquitecto de la medición 

4. El revisor de GPT-5.4 se cambió a Claude Opus 4.7 ⋅ medir la tasa de falsa aprobación y el delta de costo de los tokens ⋅

5. 添加第五个角色:documenter (Haiku 4.5) ・review 之后, generará una entrada de registro de cambios― medir la calidad de la documentación ¿vale o no el gasto adicional de tokens―

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Parallel worktree | "隔离分支" | `git worktree add` 为每个 coder 生成一个新的 working tree |
| Task board | "共享 message bus" | 存储 typed messages 的 File 或 Redis store，agents 会订阅它 |
| Handoff | "Role boundary" | 从一个 role 的 context 跨到另一个 role 的任何 message |
| Token amplification | "Multi-agent overhead" | 同一任务下跨 roles 的 total tokens / single-agent tokens |
| A2A protocol | "Agent-to-agent" | Google 2025 年用于 typed inter-agent messages 的 spec |
| Merge coordinator | "Integrator" | 运行 three-way merge 并调解 conflicts 的组件 |
| False approval | "Reviewer hallucination" | Reviewer 批准带有已知 bugs 的 diff |

## 延伸阅读
- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) Realización de la fábrica de múltiples agentes en 2026
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT)  marco multiagente basado en el papel
- [AutoGen v0.4](https://github.com/microsoft/autogen) Microsoft de actores de tipo marco
- [Cognition AI (Devin)](https://cognition.ai) 参考产品
- [Factory Droids](https://www.factory.ai)  otro tipo de productos de referencia
- [Google A2A protocol](https://developers.google.com/agent-to-agent) especificación de mensajería entre agentes
- [git worktree documentation](https://git-scm.com/docs/git-worktree) sustrato de aislamiento
- [SWE-bench Pro](https://www.swebench.com) Objetivo de evaluación
