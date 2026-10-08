# Modelo de supervisor / orquesta-trabajador

> Un agente principal 负责规划和委派; trabajadores especializados en ejecutar并回报结果在并行背景中. Este es el patrón detrás del sistema de Investigación Antropical (Claude Opus 4 作为领导,Sonnet 4 作为子基), en las evaluaciones internas de investigación                                                                                                                                                                                                                            

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

##  problemas

La investigación es un sistema de agente único que fracasa. ¿Qué ha cambiado entre los sistemas de agentes múltiples? ¿Qué ha cambiado entre los años 2023 y 2026?

El patrón de supervisor rectificó este punto: un agente principal  planificar la búsqueda, enviar cada subpregunta comisionar a un trabajador, y luego realizar la síntesis― cada trabajador tiene un problema estrecho para obtener su propia ventana de 200k-Token―El líder nunca verá los papeles en bruto  sólo ver los resúmenes de los trabajadores―

El sistema de investigación de producción de Antropic 报告称, en evaluaciones de investigación interna 上相比单一Opus 4 提升 +90.2%──同一文章指出,BrowseComp 方差的80% 仅由 *Token usage alone* 解释──每个 subagent 拥有新文脈是主要机制──

## 概念

### Este patrón

```
                 ┌──────────────┐
                 │   Lead       │  plans, decomposes,
                 │  (Opus 4)    │  synthesizes
                 └──┬────┬───┬──┘
                    │    │   │
            ┌───────┘    │   └───────┐
            ▼            ▼           ▼
      ┌─────────┐  ┌─────────┐  ┌─────────┐
      │ Worker1 │  │ Worker2 │  │ Worker3 │
      │(Sonnet) │  │(Sonnet) │  │(Sonnet) │
      └─────────┘  └─────────┘  └─────────┘
         fresh       fresh        fresh
         context     context      context
```

El plomo 永远不读原材料──Los trabajadores en la síntesis de plomo 之前 nunca se verán el trabajo del otro── cada arco es una entrega de artefactos estrechos──

### ¿Por qué funciona?

Tres mecanismos:

1. **每个 subagent 都有 fresh context。**Explorar  El trabajador de la herencia FIPA-ACL  no llevará plomo en el planeo de consumir 40k Tokens― obtiene una ventana de 200k para resolver un problema―
2. **通过 prompt 实现 specialization。**El impulso de liderazgo es descomponer y sintetizar, no es la investigación. El impulso de cada trabajador es muy estrecho: encontrar lo que ha cambiado en X.
3. **Parallelism。**Trabajadores no han hecho nada.`max(worker_times) + plan + synthesis`, en lugar de`sum(worker_times)`¿Qué es eso?

### Lecciones de ingeniería (antrópica 2025)

Anthropic 文章 listó algunas lecciones de producción que aún están relacionadas hasta 2026:

- **Scale effort to query complexity.**简单查询: un agente, 3-10 veces llamadas de herramientas. 复杂查询: 10+ agentes.
- **Broad then narrow.**Antes se desglosan en subcuestiones amplias, luego en la respuesta se necesita profundidad para cada subcuestión para generar más trabajadores.
- **Rainbow deployments.**Los agentes son de larga duración 且州的──传统蓝绿不适用──Antropic 使用彩虹:逐步推出 新版本,同时让旧版本排水──
- **Token usage dominates.**Multi-agente 约是单代理的15倍代币──只有当任务值 足以证明成本合理时才运行它──

### LangGraph 转向

LangGraph originalmente publicó una con una alta nivel .`create_supervisor`ayudante de `langgraph-supervisor`Biblioteca──2025 años, LangChain va a recomendar la práctica de cambiar a través de la llamada de herramientas  direct implementar patrón de supervisor, porque la herramienta llama 能更好地控制 *supervisor ve lo que*(context engineering)── esta biblioteca 仍然可用;doc 现在推 herramienta-calling形式──

### Modo de falla

- **Lead hallucinates the plan.**Si las subcuestiones de la producción no resuelven el problema real, los trabajadores harán una investigación precisa en un objetivo equivocado.
- **Workers over-explore.**Si no hay límites de alcance claros, los trabajadores se apartarán de la subcuestión y se desorganizarán en la fase de síntesis.
- **Synthesis conflicts.**due trabajadores  devuelven hechos contradictorios entre sí  El líder  debe volver a preguntar  aumentar una ronda  o claramente marcar las diferencias  silenciar la elección de uno es el peor fracaso: el usuario nunca sabe que ocurren diferencias 

### ¿Cuándo es que el supervisor es un error de elección ?

- **Sequential tasks.**Si el paso 2 确实需要的步骤 1, paralelo 没有收益──使用管 line () CrewAI Sequential、LangGraph linear graph) 
- **Simple queries.**El único agente  procesarlos más rápido y más conveniente  en la producción de trabajadores  en el uso de la investigación  en escala de la plomo  en la inspección
- **Strict determinism.**Supervisor utiliza delegación seleccionada por el LLM.


```figure
supervisor-hierarchy
```

## Construirlo

`code/main.py`Uso `threading` Realizar un supervisor de tres trabajadores                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

关键结构:

- `Lead.plan(query)`La consulta se dividirá en tres subpreguntas.
- `Worker.run(sub_q)`Return a a fake summary (en producción puede ser cualquier agente que utilice herramientas)
- `Lead.run(query)`En línea en el proceso de arranque de trabajadores, unirse, luego la síntesis.

运行:

```
python3 code/main.py
```

Resultados 会 muestra plan 、带 inicio / final sello de tiempo de seguimiento de los trabajadores, así como la síntesis final. Puedes ver el reloj de pared 收益:三个 0.3 segundos trabajadores en aproximadamente 0.35 segundos completados, en lugar de 0.9 segundos.

## Usalo

`outputs/skill-supervisor-designer.md`接收一个用户查询,并产出监督模式设计:lead system prompt、工人角色、subquestion decomposition rules,以及合成模板──在构建新的研究风格代理系统 前使用它──

##  Publicarlo

部署 supervisor pattern 前 前 的清单:

- **Model pairing.**El modelo de razonamiento de nivel de uso de la clase de opus`o3`clase) ―― Trabajadores Utilizan más rápido 、 más barato modelo (Soneto、`o4-mini`)。
- **Worker timeout.**Cualquier trabajador que superen el tiempo de ejecución medio de 2 veces será asesinado; el líder o con un alcance más estrecho, volver a desovar, o continuar en su ausencia.
- **Token cap per worker.**Limite duro (por ejemplo, 10x de la entrada de síntesis esperada) para evitar que el trabajador huya 爆预算。
- **Observability.**Trace lead's plan, las llamadas de herramientas de cada trabajador, así como la síntesis. Esta es la base de cualquier depuración post-hoc.
- **Rainbow rollout.**Los agentes de larga duración de los estados necesitan una transición de versión gradual, en lugar de un intercambio caliente.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`, y luego modificar el plomo, para que genere 5 trabajadores en lugar de 3 ∙∙ Observe el efecto del reloj de la pared ∙ En esta demostración, el número de trabajadores hasta cuánto tiempo generar gastos generales superará los ahorros paralelos?
2. 实现 trabajadores tiempoout: matar  cualquier operación de más de 0,5 segundos de trabajador,并让 lead synthesis 剩余结果──. ¿Qué observabilidad necesitas para saber si un trabajador ha sido cortado?
3. 给领的综合 添加冲突检测步骤: si dos trabajadores 返回相互矛盾的答案, lead 标注分歧, en lugar de elegir uno de ellos──不调用 LLM 时, ¿cómo puedes detectar contradicciones?
4. 阅读Antropic's Research-system engineering post──列出This toy demo ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                                                                                                                                               
5. Comparación de LangGraph `create_supervisor`¿Por qué Antropic 明确 sólo transmite sub-respuestas 传入合成, y no en el contexto de los trabajadores crudos?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor | “Lead agent” | 一个 orchestrator agent，负责规划、委派和 synthesis。它不亲自执行工作。 |
| Worker | “Subagent” | 由 supervisor 以狭窄 scope 调用的 focused agent，并拥有自己的 context window。 |
| Orchestrator-worker | “Supervisor pattern” | 同一件事，不同名称。2026 文献两种说法都会使用。 |
| Fresh context | “Clean window” | Worker 的 context 从它的 system prompt 和分配的问题开始，而不是 lead 的 history。 |
| Rainbow deployment | “Gradual rollout” | Long-running stateful agents 需要 versioned drain-and-replace，而不是 blue-green。 |
| Token dominance | “Context is the variable” | 根据 Anthropic，research-eval 方差的 80% 来自使用的总 Tokens，而不是 model choice。 |
| Scale effort | “Match agent count to complexity” | Lead 估算 query 难度，并据此生成 1 个或 10+ workers。 |
| Synthesis conflict | “Workers disagree” | 两个 workers 返回互相矛盾的 facts；lead 必须暴露分歧，而不是默默选择一方。 |

## 延伸阅读
- [Anthropic engineering — 我们如何构建 multi-agent 研究系统](https://www.anthropic.com/engineering/multi-agent-research-system) patrón de supervisión de referencia de producción
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Supervisor de llamadas de herramientas 现在是推形式
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) heredero auxiliar, producción de 2026
- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents)  Basado en la entrega de supervisor 变体
