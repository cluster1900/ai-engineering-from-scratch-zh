# Arquitectura jerárquica  y su modo de falla

> Los agentes gerentes se encuentran en la sub-gerentes, los sub-gerentes también en la gente de trabajo.`Process.hierarchical`Es un libro de texto.`manager_llm`动态委派任务并验证输出──LangGraph 中的等价形式是 `create_supervisor(create_supervisor(...))`Cuando la tarea en sí misma es un organograma real, es un patrón natural. También es el patrón más fácil de caer en el bucle de gestión: los agentes gerentes, repartiendo trabajo mal, malinterpretan los sub-salidos, o no pueden llegar a un consenso.

**类型：**学习 + 构建
**语言：**Python (stdlib)
**前置要求：**Fase 16 · 05 (Método de supervisión)
**时间：**- 60 minutos

##  problemas

Una vez que se entiende el patrón de supervisor, el siguiente paso natural es: si los trabajadores son supervisores, los equipos tienen subgrupos; las empresas tienen departamentos.

El problema es que los gerentes de LLM y los gerentes humanos no son iguales. El gerente humano sabe lo que hay en los subordinados. Cada vez que el gerente de LLM reafirma el contenido de su contexto, se desplaza un punto en el contexto, y deja que el árbol se distribuya mal.

## 概念

### 形态 El

```
                 Manager
                 ┌─────┐
                 └──┬──┘
           ┌────────┴────────┐
           ▼                 ▼
       Sub-Mgr A         Sub-Mgr B
       ┌─────┐           ┌─────┐
       └──┬──┘           └──┬──┘
         ┌┴──┬──┐          ┌┴──┐
         ▼   ▼  ▼          ▼   ▼
       W1  W2  W3         W4  W5
```

Cada uno de los elementos internos de la organización planea, delega y sintetiza, sólo los elementos internos ejecutan el trabajo.

### 适用场景

- **清晰的 org mapping。**Si verdadero deber es el departamento, la jerarquía es clara.
- **Local summarization。**Cada sub- gerente se reunirá con el máximo gerente antes de sintetizar los resultados de su propio equipo.

### 失效位置

2026 años post mortem 持续发现三种故障模式:

1. **Task assignment error。**El gerente 读取目标,幻觉出一个分解,并委派给错误的副管理员――由于 su sube-manager 会顺从地处理收到的任务, el error sólo aparecerá en la síntesis superior, la distancia del ser humano se encuentra separada de su posición ya una capa――
2. **Output misinterpretation。**Sub-manager 返回incapaz de verificar la reclamación X──Top manager 总结为claim X not confirmed──含义在每一层都会漂移──
3. **Consensus loops。**due sub-managers 意见不一致;top manager 要求它们和解;它们向下重新委托;工人重新运行;sub-managers 返回略有不同的答案;循环开始──CrewAI的 `Process.hierarchical`Usamos límites de paso para evitar esta situación, pero este límite se ha convertido en un hiperparámetro.

### problemas de decisión

Secuenciales (→ Lineal Pipeline) vs jerárquicos: ¿Tu tarea realmente tiene un subgrupo independiente, también es un proceso lineal en el árbol? Si es el último, utiliza secuenciales. Si es el primero, utiliza jerárquicos, pero debe tener reglas de reconciliación claras.

### Realización de CrewAI

`Process.hierarchical`General Manager LLM 接在专业团队 之上──Manager 会:

- 接收 tarea de alto nivel,
- Distribuir las subtareas a los equipos,
- evaluación de las producciones de la tripulación,
- Decide aceptar, re-delegar, o repetir.

文档:https://docs.crewai.com/en/introduction（在Conceptos básicos 下查找 "Proceso jerárquico")

### Implementación de LangGraph

LangGraph utiliza un conjunto de`create_supervisor`Los supervisores internos tienen su propio gráfico; los supervisores externos lo consideran como un nodo opaco. Para el debugging, esto es más claro que CrewAI.

 referencia:https://reference.langchain.com/python/langgraph-supervisor。


```figure
swarm-hierarchy-token
```

## Construirlo

`code/main.py`运行一个3 niveles de jerarquía:

- El jefe de la oficina:将任务分分为"ingeniería"和"legal"分支,
- Subdirector de ingeniería: separarse en trabajadores "frontend" y "backend",
- Subdirector legal: un trabajador

Demo para el camino feliz**perturbed path**: top manager's decomposition 将"legal" 错标为"finances",然后观察错误级联:sub-manager 顺从地执行财务 工作,top synthesizer 报告财务发现,原始法律问题 没有得到答应──

运行:

```
python3 code/main.py
```

输见展示两条路径,并清晰并排对比qué se le preguntó和qué se le entregó──

## Usalo

`outputs/skill-hierarchy-fitness.md`评估给定任务应使用等级级,顺序,还是平面监督――输入:task description、org structure、调整预算――输出:pattern recommendation,并包含需要防范的具体故障模式――

##  Publicarlo

Si usted publica jerárquico:

- **将 tree depth 限制在 2。**Tres niveles ya están ocultos de la observabilidad la mayoría de los errores.
- **明确 reconciliation budget。**设置顶级经理 必须 commit 前的最大轮子――通常为2――
- **每次 synthesis 都要有 provenance。**Cada punto de resumen debe citar para producir sus resultados de hoja.
- **对 decomposition drift 告警。**记录 cada paso de la descomposición del gerente; con la consulta del usuario hacer diferente.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿Cuántos niveles de gerente necesitan para entregar, la producción superior 才会完全偏离用户问题?
2. 添加第三层(top → sub → sub → worker) ―― con la profundidad 增长, medida perturbado camino 多常会自我修正,以及多常会完全偏离──
3. En cada sub-manager 处实现一个"canary" worker, it始终收到未变的原始用户问题――使用卡纳的答案 检测分解漂移――当卡纳与合成答案不一致时,manager 应如何反应?
4. 阅读 de la tripulación `Process.hierarchical`文档──识别 CrewAI 应用一个具体 guardrail(step limit、manager_llm constraint),并描述它针对的失败模式──
5. Comparar los supervisores de LangGraph de los implantes con los jerárquicos de CrewAI. ¿Cuál puede ser más barato en los bucles de reconciliación de detección?

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Hierarchical | "Org chart pattern" | supervisors 位于 supervisors 之上；只有叶子节点执行工作。 |
| Manager LLM | "The boss" | 在内部节点执行 decomposes、assigns 和 validates 的 LLM。 |
| Decomposition drift | "The boss lost the plot" | Top manager 的拆分不再覆盖原始问题。 |
| Reconciliation loop | "Endless meetings" | Sub-managers 意见不一致；top re-delegates；workers re-run；循环直到 budget 耗尽。 |
| Depth-2 ceiling | "Don't go deeper than 2 levels" | 经验性 guardrail：3+ 层会让 observability 坍塌。 |
| Canary question | "Ground truth at every level" | 一个始终收到未改动原始 query 的 worker，用于检测 drift。 |
| Provenance chain | "Who said what" | 从每次 synthesis 回溯到产生它的 leaf outputs 的 trace。 |

## 延伸阅读

- [CrewAI introduction — Process.hierarchical](https://docs.crewai.com/en/introduction) 带有经理 LLM 的教科书式等级
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `create_supervisor`实现嵌套 supervisor
- [Anthropic engineering — Research system](https://www.anthropic.com/engineering/multi-agent-research-system)¿Por qué Antropic tiene la intención de elegir supervisor plano y no jerárquico
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Taxonomía MAST; sobre fallos de coordinación capítulos registraron la deriva de descomposición
