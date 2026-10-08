# Eval 驱动的代理 开发

> La guía de la antropología: desde un simple paso , comienza con una evaluación integral para optimizarlos, y sólo cuando sea necesario añade más pasos  sistemas                                                                                                                                                                                                                                            

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 全部内容。
**Time:** ~60 分钟

## El objetivo del aprendizaje
- Explicar tres niveles de evaluación  referencias estáticas  producción en línea  y su uso
- 解释 evaluador-optimizador 紧密循环──
- Describir las mejores prácticas para 2026:evals y código colocados juntos, en el CI, y como puerta de comunicación.
- Cada clase de la Fase 14 se conectará al caso de evaluación que genera.

##  problemas
Los agentes pueden pasar por la demostración. Ellos fracasan en la producción de manera inásperable. Los puntos de referencia responden a que este modelo tiene una capacidad amplia. ¿Está entregando el parche correcto para mi producto?

## 概念
### Tres niveles de evaluación

1. **Static benchmarks** Utilizando el código de SWE-bench Verified(Leyón 19) 、 para navegar / 桌面的 WebArena/OSWorld(Leyón 20) 、 para el generalista GAIA(Leyón 19) 、 para el uso de herramientas de BFCL V4(Leyón 06)  Para el uso de modelos de comparación y retrogrado por puertas。 contaminación es real:SWE-bench+ 发现 32.67% de la solución fuga。始终报告 Verified / +-audited 分数。

2. **Custom offline evals** Tu producto:
   - LLM como juez ((Langfuse、Fénix、Opik  Lección 24)。
   - Aplicación basada en la ejecución de un parche de ejecución, un parche de control de pruebas.
   - Se basan en la trayectoria de las secuencias de acción en relación con el oro; OSWorld-Human  muestra los agentes de primer nivel de oro 1.4-2.7x) ⋅

3. **Online evals** 生产:
   - Repeticiones de la sesión
   - Guardrail 触发的告警(Leyón 16、21)
   - 单步成本 / 延迟跟踪 (Leyón 23 se extiende en OTel)

### Evaluador-optimizador (Antropico)

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

1. Proponente 生成输出──
2. El evaluador  realizar el juicio¬¬
3. Refinar hasta que el evaluador pase.

Es el auto-refinado de la generalización posterior. Lección 05. Todo el flujo de agentes que usted considera importante puede ser incluido en el evaluador-optimizador, para mejorar la fiabilidad.

### 2026 mejores prácticas

- Evals y código juntos.
- En cada PR por CI 运行.
-  Según las puntuaciones de evaluación, la puerta se fusiona, por ejemplo,  relativa a la principal no permite la regresión > 5%)
- Cada baranda está en un caso de evaluación.
- Cada artículo de la regla de aprendizaje (Reflexión, regla de aprendizaje pro flujo de trabajo) se refleja en un caso de fracaso.

### La fase 14 se levantará.

Cada clase en la fase 14 generará casos de evaluación:

| Lesson | 它生成的 Eval case |
|--------|------------------------|
| 01 Agent Loop | Budget-exhausted、infinite-loop guard |
| 02 ReWOO | 当 tool 失败时，Planner 能正确 replans |
| 03 Reflexion | 学到的 reflections 会在 retry 时应用 |
| 05 Self-Refine/CRITIC | Judge 通过 refined output |
| 06 Tool Use | Argument coercion 生效；unknown tools 被拒绝 |
| 07-10 Memory | Retrieval citations 与 sources 匹配；stale facts 失效 |
| 12 Workflow Patterns | 每种 pattern 都产生正确输出 |
| 13 LangGraph | Resume 精确复现 state |
| 14 AutoGen Actors | DLQ 捕获 crashed handlers |
| 16 OpenAI Agents SDK | Guardrail 在正确输入上触发 |
| 17 Claude Agent SDK | Subagent results 返回 orchestrator |
| 19-20 Benchmarks | SWE-bench Verified score、WebArena success rate、OSWorld efficiency |
| 21 Computer Use | Per-step safety 捕获 injected DOM |
| 23 OTel | Spans 发出 required attributes |
| 26 Failure Modes | Detectors 标记 known failures |
| 27 Prompt Injection | PVE 拒绝 poisoned retrievals |
| 28 Orchestration | Supervisor 路由到正确 specialist |
| 29 Runtime Shapes | DLQ 处理 N% failure |

Si tu suite de evaluaciones cubre cada uno de los elementos, ya cubres la Fase 14.

### Eval  Dörörörendeveloppe会 ¿Dónde fracasó

- **没有 baseline。**没有最后知名好的 evals 无法解读──baseline de almacenamiento──
- **LLM-judge 没有 grounding。**Los jueces también alucinarán.
- **过拟合 evals。**Para evaluar la optimización de la producción en materia de uso práctico, los casos de cambio se han ido realizando en el futuro.
- **Flaky evals。**Los casos de incertidumbre causarán falsas alarmas.


```figure
ae-eval-three-layers
```

## Construirlo
`code/main.py`Es un arnés de evaluación de la información:

- 带 categorías de referencia, personalizado, en línea) de registro de casos.
- Un agente con guión bajo prueba.
- El ciclo de evaluador-optimizador: proponer, juzgar, refinar hasta que pase o alcance el máximo de rondas.
- Puerta CI: tasa de pasa de汇总 + con regresión de la línea de base.

¿Qué es eso ?

```
python3 code/main.py
```

输出: cada caso de pase/fallo 退役旗 CI gate verdict 

## Usalo
- En el mismo repo que el código del agente, redactan casos de evaluación.
-  a través de CI en cada PR 
- En la regresión, deja construir, fracasa.
- Con el paso de tiempo, el ritmo de pasaje cambia.
- Cada fallo de producción está vinculado a un nuevo caso.

##  entregarlo
`outputs/skill-eval-suite.md`Para un producto agente construir una suite de evaluaciones de tres niveles, que incluye puertas de CI y seguimiento de regresión―

##  ejercicios
1. ¿Toma un caso de fallas de tu producción? ¿Escribe un caso de evaluación que pueda ser revisado?
2. Para tu dominio, construye una rúbrica de jueces de LLM que contenga tres dimensiones (factual, tone, scope) y te dé 50 sesiones.
3. La evaluación de la suite se encuentra en la fase de regresión de >=5%
4. ¿Cuántos pasos ha dado en comparación con la trayectoria de oro?
5. ¿Hay alguna falta? ¿Es eso lo que se necesita para compensar la brecha?

## 关键术语: "El hombre es un hombre"
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Static benchmark | “Off-the-shelf eval” | SWE-bench、GAIA、AgentBench、WebArena、OSWorld |
| Custom offline eval | “Domain eval” | 面向你的产品形态的 LLM-as-judge / exec / trajectory |
| Online eval | “Production eval” | Session replay、guardrail alerts、cost/latency tracking |
| Evaluator-optimizer | “Propose-judge-refine” | 迭代直到 judge 通过 |
| CI gate | “Merge blocker” | 在 eval regression 时让 build 失败 |
| Baseline | “Last-known-good” | 用于检测 regression 的 reference score |
| Trajectory efficiency | “Steps over gold” | Agent step count 除以 human expert minimum |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)  desde el simple comienzo, con evaluaciones  优化
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选 índice de referencia
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) Indicador de referencia de uso de herramientas
- [Langfuse docs](https://langfuse.com/) 实践中的 evals + repetición de la sesión
