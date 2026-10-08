# 编排模式: Supervisor, Cuerpo, Jerárquico

> En el marco del año 2026 aparecen cuatro patrones de orquestación: supervisor-trabajador, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajadores, grupo de trabajo, grupo de trabajadores, grupo de trabajadores, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de trabajo, grupo de grupo de trabajo, grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo de grupo

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Fase 14 · 12 (Patrones de flujo de trabajo), Fase 14 · 25 (Debate multi-agente)
**Time:** ~60 分钟

## El objetivo del aprendizaje
- Explique cuatro patrones de orquestación que aparecen de forma repetitiva, así como cada escenario adecuado.
- 描述 2026 年 LangChain 的建议: Based on tool-call supervisión, y no bibliotecas supervisoras。
- 解释 Antropic 的构建正确系统规则, así como cómo se une a la topología 选择──
- Utilizando el STDlib, basado en un manuscrito LLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

##  problemas
团队 siempre está ansioso por utilizar multi-agent── cuatro modelos aparecen repetidamente en diferentes marcos; una vez que puedes decirlos, puedes elegir una correcta o saltar por completo la topología──

## 概念
### Trabajadores supervisores

- Un centro de enrutamiento de LLM, repartiendo tareas a agentes especializados.
-  la decisión incluye: volver a su propio ciclo  transferir a un especialista  terminar 
- Los especialistas no se comunican entre sí; todos los rutas han pasado por un supervisor.

框架:LangGraph `create_supervisor`、La gente que trabaja en el orquestaje antropológico 、El proceso jerárquico de la tripulación 、

**2026 LangChain 建议：**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `create_supervisor`◊ así se puede obtener una mayor detalle de la ingeniería de contexto  control, se puede determinar con precisión cada especialista                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

### En el caso de los productos de la industria de la industria de la producción, el precio de la producción se calcula en el caso de los productos de la industria de la industria de la industria de la producción.

- Agentes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- 没有 un router central.
- 延迟低于监督 (en inglés)
- Más difícil de pensar (no hay un solo punto de control)

框架:LangGraph swarm topología、OpenAI Agents SDK entregas(当所有代理都可以交给所有其他代理时)

### Los niveles de orden

- Supervisores 管理 sub-supervisores, sub-supervisores y re-administrar trabajadores―
- En LangGraph se implementan subgrafos anidados; en CrewAI se implementan tripulaciones anidadas.
- 能扩展到大规模代理群体, pero el costo es más alto de la complejidad de operación.

¿qué tiempo necesita: cuando un supervisor de presupuesto contexto  no puede contener la descripción de todos los especialistas 

### Debate sobre el tema

- Y también las propuestas + 代 cruzada crítica (lección 25)
-  Estrictamente hablando no es orquestación, más como verificación, pero en el marco de frecuentemente como una topología  elección aparecen

### CrewAI Crew vs Flow

La tripulación ha formulado dos modelos de implementación:

- **Flow**Utilizando la automatización impulsada por eventos de determinación (en inglés)
- **Crew**Utilizando la colaboración basada en el papel de un autor.

Esto se relaciona con los cuatro modelos anteriores, pero se refleja en la topología: Flujo es normalmente supervisor o jerárquico; El equipo es normalmente supervisor de un router LLM.

### La guía de Anthropic

El éxito en el campo de la LLM no se basa en construir los sistemas más complejos, sino en construir los sistemas correctos para tus necesidades.

决策顺序:

1. 单个代理 + workflow patterns (patrón de flujo de trabajo) 课第12 从这里开始──
2. Supervisor-trabajador  Cuando tienes 2-4  especialistas 时。
3. La cantidad de tiempo que tarda es más importante que la claridad de la información.
4.                                                                                                                                                                                                                                                               
5. El debate  Cuando la tasa de precisión es más importante que el costo

### Este modo es fácil de salir mal donde

- **Topology-first thinking.**En el reconocimiento de multi-agente  resolver qué problema antes, decir que necesitamos multi-agente ──
- **Bouncing handoffs in swarm.**A -> B -> A -> B。 Uso de contadores de salto。
- **Fake hierarchy.**Porque la empresa tiene tres niveles; en realidad sólo hay dos equipos.


```figure
orchestration-pattern
```

## Construirlo
`code/main.py`Utilizando el SDLB, el LLM basado en escrituras realiza cuatro modelos:

- `Supervisor` Router central。
- `Swarm` 带直接交付的同行至同行──
- `Hierarchical` supervisores de supervisores。
- `Debate` Yendo proponentes + crítica。

Cada modo de procesamiento de las mismas tareas de tres intenciones (reembolso / error / ventas)

运行:

```
python3 code/main.py
```

输出: cada tipo de modalidad de rastreo + op cuenta──Supervisor 最清晰;swarm 最短;hierárquico 最深;debate 最贵──

## Usalo
- **LangGraph**Usándole a supervisor y a los subgrafos jerárquicos en el nido)
- **OpenAI Agents SDK**Usándolo como herramientas en forma de supervisor.
- **CrewAI Flow**En el medio de producción de la determinación.
- **Custom**Para el debate, o cuando quieras tener un control preciso.

##  entregarlo
`outputs/skill-orchestration-picker.md`选择一个拓学并实现它──

##  ejercicios
1. 通过移动路由器,把一个监督工转换为群群. ¿Qué se va a romper? ¿Qué se va a mejorar?
2. ¿Puede captar A->B->A de la réplica saltar?
3. ¿Cómo se puede construir un sistema jerárquico de dos clases? ¿Cuál es el presupuesto de contexto?
4. En la aproximación de la carga de trabajo de la forma de producción en el perfil cuatro modalidades. ¿Cuál es el indicador de latencia, coste, precisión, desembajabilidad?
5. 阅读Antropic的 Building Effective Agents 文章──把你的每一个生产流动 映射到四种模式之一──有没有不能干净映射的吗?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor-worker | “Router + specialists” | 中心 LLM 分派给 specialists；它们彼此不通信 |
| Swarm | “Peer-to-peer” | 通过共享 tools 直接 handoffs；没有中心 router |
| Hierarchical | “Supervisors of supervisors” | 面向大规模群体的 nested subgraphs |
| Debate | “Proposer + critique” | 并行 proposers，cross-critique（Lesson 25） |
| Tool-call-based supervision | “Supervisor without a library” | 将 supervisor 实现为直接 tool calls，以控制 context |
| Crew | “Autonomous team” | CrewAI 的 role-based collaboration 模式 |
| Flow | “Deterministic workflow” | CrewAI 的 event-driven production 模式 |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 五种模式 + agente vs flujo de trabajo
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) supervisor  grupo  jerarquico
- [CrewAI docs](https://docs.crewai.com/en/introduction) Equipamiento vs flujo
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) Modelo de debate
