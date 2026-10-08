# Memoria compartida y tablero negro 模式

> El sistema multiagente de 2026 tiene dos métodos:**message pool**(todos pueden ver las noticias de todos, como AutoGen GroupChat o MetaGPT) y**带 subscription 的 blackboard**(Agent 订阅相关事件, como Context-Aware MCP o Matrix framework) ⋅ ambos son la única parte en estado en el sistema de multi-agentes  Esto significa que un error interesante también está aquí ⋅ referencia fallo modelo es ⋅**memory poisoning**Un agente se imagina que hay un hecho, otro agente lo pone como un contenido verificado, la precisión disminuye gradualmente, y esta disminución es más difícil de deshacer que un colapso inmediato. Este curso utiliza un método de construcción de estas dos estructuras, inyecta un ataque de envenenamiento, y muestra tres medidas de alivio realmente eficaces en la producción.

**类型：**Aprender + Construir
**语言：**Python, y otros.`threading`(en inglés)
**先修：**Fase 16 · 04(Modelo primitivo),Fase 16 · 09(Redes de enjambres paralelas)
**时间：**75 minutos

##  problemas

Multi-Agent  sistema necesita un lugar para que el agente compartiera hechos  Una opción literal es  poner todo el contenido a través de mensajería   Pero esto equivale a utilizar una copia extra para reinventar el estado compartido  Otra opción es  dar a los propietarios un diario   pero el diario                                                                                                                                                                                                                         

Cuando uno de los agentes produce una fantasía y escribe una fantasía en un estado compartido, después de que cada uno de los agentes de ese estado lo tome, el agente lo considera como un hecho.

Esto es envenenamiento de la memoria. Es una taxonomía MAST de [[Cemri et al., arXiv:2503.13657) ]] y es estructural: cualquier origen sin ningún verificador de memoria compartida ]]

## 概念

### 两种主要拓

**Full message pool。**Cada Agente 读取每条消息──AutoGen GroupChat 和 MetaGPT utiliza este método──简单,透明,可检查, pero no puede extenderse a más de 10 Agentes, ya que el contenido de cada Agente se encuentra lleno de trabajo de otros Agentes──

```
agent-A ──write──▶ ┌────────────────┐ ◀──read── agent-D
                   │ message pool   │
agent-B ──write──▶ │                │ ◀──read── agent-E
                   │ (global log)   │
agent-C ──write──▶ └────────────────┘ ◀──read── agent-F
```

**带 subscription 的 Blackboard。**Agente  declara su propio interés en temas; substrato de nivel inferior sólo vía de noticias relacionadas. CA-MCP(arXiv:2601.11595) y marco descentralizado de Matrix(arXiv:2511.21686) utiliza este método.

```
                   ┌─ topic: prices ──┐
agent-A ──pub────▶ │                  │ ──▶ agent-D (subscribed)
                   ├─ topic: orders ──┤
agent-B ──pub────▶ │                  │ ──▶ agent-E (subscribed)
                   ├─ topic: alerts ──┤
agent-C ──pub────▶ │                  │ ──▶ agent-F (subscribed)
                   └──────────────────┘
```

### En el caso de las zonas de la zona

- **Full pool**适合代理 数量少 ((< 10) 、角色异构、对话是短周期的情况──当所有人能看到所有内容时,推理谁说什么非常直接──
- **Blackboard**适合代理 数量多、角色同质但实例众多(swarms) 、对话长期运行情况──Rutning 能节省 Token 成本并减少上下文污染──

Sistema de producción usualmente mezclado uso: la parte superior utiliza una pequeña piscina completa (la capa de planificación), la parte inferior utiliza tablas negras (la capa de trabajadores)

### Un envenenamiento de la memoria

Tres agentes  ejecutar una tarea de investigación. A. es un agente de recuperación. B. es un resumidor.

1. A obtención de una página,并向共享状态写入消息:El estudio informa de una mejora de precisión del 42%.
2. La página obtenida en realidad escribió que se mejoró un 4,2%.
3. B 读取共享状态后写入:Gran aumento de precisión del 42% reportado (fuente: A).
4. C 读取共享状态后写入:Recomenda la adopción  42% de elevación es transformadora.
5. El último informe cita un 42% de números que nunca existieron.

没有 Agent 崩──没有测试失败──系统工作正常──这个幻觉通过共享状态,从一个代理的上下文进入了每个下游代理的推理中──

### ¿Por qué es un problema estructural?

 Cuando no se comparte el estado, la ilusión de A permanece en la siguiente de A. 

 El problema no es el estado compartido en sí mismo  sino que está en el estado compartido**没有 provenance，也没有独立 verifier** Tres medidas de alivio se pueden tomar para resolver este problema:

1. **每次写入都标注 provenance。**Cada entrada en el estado compartido tiene un registro de quién ha escrito, cuándo ha escrito, cuál es el momento de escribir, y también de qué se ha escrito.
2. **对写入做 versioning；把它们视为 append-only。**修正 es una nueva entrada, que se utiliza para reemplazar la entrada anterior, en lugar de original.
3. **至少保留一个无法写入共享状态的 Agent。**Agente de verificación de sólo lectura 抽样输入、重新获取来源,并标记不一致──因为它不能写入池,所以它不会被池毒──

### Tabla negra 先例 (Hayes-Roth, 1985)

Blackboard 模式比LLM agentes ya hace cuatro décadas. Hayes-Roth (Hays-Roth, 1985,A Blackboard Architecture for Control) describe a expertos: "Las fuentes de conocimiento observan una placa negra integral, contribuyen a soluciones parciales,并触发其他 fuentes".

### Proyección frente a vista completa

純黒板 会給每名購買者 相同的投影 (~ 限定) 〜 Más activos de diseño es 〜**per-agent projection**Cada agente obtiene una visión determinada por su papel. Los reducidores de estado de la LongGraph son una norma para el año 2026 para lograr la función de reducción.

Proyección por agente  amplificidad más fuerte, pero necesita esquema                                                                                                                                                                                                                                                       

### Contenido escrito 模式

Muchos agentes, en el mismo tiempo, escriben en una concurrencia  problema, no sólo LLM  problema.

- **Sequential writer（single producer）。**Todos los escritos son escritos por un agente coordinador.
- **带 versioning 的 optimistic concurrency。**Cada entrada tiene una versión; el autor en la versión no coincide 时失败并重试;;
- **Topic partitioning。**Diferente agente  poseer diferentes temas  no hay contención entre temas  necesita de diseñar buenos límites de partición

La mayoría de los escritores utilizan secuencias de texto, ya que el LLM 调用足够慢, hace que la contención 很少见,而瓶影响不大──

### Verificador de escritura

La última clave de la medida de alivio es el verificador de sólo lectura.

- Verificador y equipo de estado compartido (读取 blackboard)
- Verificador  no comparte el estado de escritura  Sólo puede escribir en un canal de verificación independiente。
- Verificador 独立获取 escribe 中引用的来源──标记分歧──
- Verificador  su propio contacto                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

 sin esta separación, el verificador de entrada se encuentra en la piscina, lo que significa que el pool de envenenados se verá en el verificador de envenenamiento, mientras que el verificador también se verá envenenado en sus propias verificaciones


```figure
swarm-blackboard
```

## Construirlo

`code/main.py`Usando Python, se logró dos tipos de ataques, así como un ataque de intoxicación de juguete y tres medidas de alivio.

- `MessagePool` 线程安全的附加日志,支持完整读出──
- `Blackboard` 按主题按键的pub/sub,支持每代理订阅──
- `ProvenanceEntry` Cada vez que escribe todo el registro de la escritora, sello de tiempo, contínua información, fuente de información.
- `PoisoningScenario` 运行一个三 经纪人研究任务, entre los cuales el agente A 幻觉出小数点――印印最终报告――
- `Verifier` Un agente de sólo lectura, volverá a obtener fuentes y marcar desajustes.

运行:

```
python3 code/main.py
```

预期输出:
- Ejecutar 1( sin verificador): el 42% de las imágenes se propagará hasta el informe final―
- Ejecutar 2(hay verificador):verificador 标记不一致,pool 被标记为 旗,最终报告包含撤销──

## Usalo

`outputs/skill-memory-auditor.md`Es una habilidad, utilizada para auditar cualquier sistema de memoria compartida multi-agente  diseño, verificación de procedencia  versión y separación de verificador  en la nueva arquitectura multi-agente  entrar en producción  antes de ejecutarlo

##  Publicarlo

对于任何共享记忆 设计:

- Cada vez que escribe todo el registro de procedencia:`(writer, timestamp, prompt_hash, tool_calls_cited, source_uri)`¿Qué es eso?
- 让日志保持 apéndice-only──Correcciones es citación de nuevas entradas de la entrada sustituida──
- 部署 al menos un agente verificador de sólo lectura con acceso a fuentes independientes.
- La salida del verificador será vía a un canal independiente, en lugar de volver al grupo compartido.
- 记录超级在写中比例  比如上升是幻觉模式的早期证据──

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`❖ Confirmar que la primera carrera se propaga, y la segunda la captura.
2. Añadir un segundo concepto: agente B: crear un conjunto de datos de tamaño.
3. 将 total de la piscina 切换为带 particiones de temas(`prices`¿Qué es esto?`summaries`¿Qué es esto?`analyses`¿Qué escenarios de intoxicación más difíciles de implementar y qué no ayudarán?
4. Hayes-Roth (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaes-Roth) (Heaves-Roth) (Heaves-Roth) (Heaves-Roth) (Heaves-Roth) (Heaves-Roth) (Heaves-Roth) (Heaves-Roth) (Heaves-Roth) (Heaves-Roth) (Heaves-Roth) (Heaves-Ruth) (Heaves-Ruth) (Heaves-Ruth) (Heaves-Ruth) (Heaves-Ruth) (Heaves-Ruth) (Heaves-Heaves-Heaves-Heaves-Heaves) (Heaves) (Heaves) (Heaves) (Heaves) (Heaves)
5. 阅读 CA-MCP(arXiv:2601.11595)。将其 Compartido Context Store 映射到 `code/main.py`¿Qué primitivas se han añadido en su mediación en la clase de mensajería o de tablero negro?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Message pool | “Shared chat history” | 每个 Agent 都会读取的 append-only log。完全透明，但扩展性差。 |
| Blackboard | “Shared workspace” | 按 topic keyed 的 pub/sub。Agent 订阅相关 topics。扩展更远。 |
| Provenance | “谁写了什么” | 每次写入的 metadata：writer、timestamp、prompt、sources。 |
| Memory poisoning | “幻觉在扩散” | 一个 Agent 的错误进入共享状态，下游 Agent 将其当作事实。 |
| Append-only | “没有原地更新” | Corrections 是用来 supersede 的新 entries。保留 audit trail。 |
| Unwritable verifier | “Independent auditor” | read-only Agent，会重新获取 sources 并标记不一致。 |
| Projection | “Scoped view” | 从 global state 计算出的 per-agent view。LangGraph reducers 是规范案例。 |
| Knowledge Source | “Specialist agent” | Hayes-Roth 在 1985 年对 blackboard participant 的称呼。 |

## 延伸阅读

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Taxonomía MAST;intoxicación por memoria es una falla de coordinación
- [CA-MCP — Context-Aware Multi-Server MCP](https://arxiv.org/abs/2601.11595) Usado para coordinar servidores MCP de la Compartida de Contexto de la tienda
- [Matrix — decentralized multi-agent framework](https://arxiv.org/abs/2511.21686)  basado en la cola de mensajes de la pizarra, sin orquesta central
- [LangGraph state and reducers](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Proyección por agente en el producto 模式
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Noticias de procedencia y verificación del Departamento de Producción
