# FIPA-ACL y Acta de Discurso

> Antes de MCP, antes de A2A, había FIPA-ACL. En 2000, la Fundación IEEE para Agentes Físicos Inteligentes aprobó un lenguaje de comunicación de agentes, que contiene veinte lenguajes de contenido de rendimiento, así como un conjunto de protocolos de interacción: contrato net, suscripción/notificación, solicitud-cuando. Por eso salió de la industria, porque la ontología se ha vuelto pesada, pero los sistemas multi-agentes impulsados por el LLM están repitiendo, están re-realizando la idea, simplemente sin semántica formal: contratos JSON  tomar rendimientos, lenguaje natural  reemplazar ontologías.

**Type:** 学习
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 01（Why Multi-Agent）
**Time:** ~60 分钟

##  problemas

El protocolo de agentes para el año 2026 es muy concurrido: para utilizar los MCP de herramientas, para utilizar los A2A de agentes, para la auditoría empresarial ACP, para descentrar la confianza en los ACP, para el NLIP de contenidos en lengua natural, además de CA-MCP y más de veinte propuestas de investigación.

诚实地看, la mayoría de ellos están en la redescubrimiento de un árbol de decisión muy específico, ya habiendo dos décadas de historia. La teoría del habla-acto de Austin ([1]) (1962) y Searle ([2]) (1969) nos dio las declaraciones de acciones ── KQML ([3]) (1993) convertirlo en un protocolo por cable ([4]) FIPA-ACL ([4]) (2000) aprobado) dio una estandarización de referencia: veinte lenguajes de contenido SL0/SL1, así como protocolos de interacción para la red de contrato y los suscriptores-notificaciones JADE y JACK es una plataforma de referencia Java. Este esfuerzo salió a la luz después de 2010, porque la ontología se ha vuelto demasiado pesada, mientras que la web está ganando el dominio dominante.

Cuando ves el MCP de `tools/call`Cuando el ciclo de vida de tareas de A2A, o el contexto compartido de CA-MCP, se almacena, se ve una especie de recapitulación más suave de la decisión de FIPA, nativa de JSON. Conocer esta transmisión le dirá dos cosas: qué nuevas innovaciones se reinventan y qué nuevas especificaciones volverán a descubrir los viejos modos de fracaso.

## 概念

### Usage of speech act Usage of speech act Usage of speech speech speech speech speech speech speech act Usage of speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech speech

Austin nota que algunas frases no están describiendo el mundo, sino cambiando el mundo. Prometo.                                                                                                                                                                                                                                                    

### Dos exámenes de la FIPA (parte lista)

| Performative | Intent |
|---|---|
| `inform` | “我告诉你 P 为真” |
| `request` | “我请求你执行 X” |
| `query-if` | “P 是否为真？” |
| `query-ref` | “X 的值是什么？” |
| `propose` | “我提议我们执行 X” |
| `accept-proposal` | “我接受该 proposal” |
| `reject-proposal` | “我拒绝该 proposal” |
| `agree` | “我同意执行 X” |
| `refuse` | “我拒绝执行 X” |
| `confirm` | “我确认 P 为真” |
| `disconfirm` | “我否认 P” |
| `not-understood` | “你的 message 无法 parse” |
| `cfp` | “针对 X 发出 proposals 征集” |
| `subscribe` | “当 X 变化时通知我” |
| `cancel` | “取消正在进行的 X” |
| `failure` | “我尝试了 X，但失败了” |

完整列表在 `fipa00037.pdf`(FIPA ACL Message Structure) 中──重点不是 recordarlo, sino que cada uno de estos contenidos, todos se adaptan al protocolo LLM, finalmente se vuelve a añadir una primitiva──

### 规范的 FIPA-ACL mensaje

```
(inform
  :sender       agent1@platform
  :receiver     agent2@platform
  :content      "((price IBM 83))"
  :language     SL0
  :ontology     finance
  :protocol     fipa-request
  :conversation-id   conv-42
  :reply-with   msg-17
)
```

七个字段承载 protocolo envase;一个字段(`content`) Cargar carga útil. Otras partes son que cada vez que le das el protocolo JSON, además de retrasos, tramos y ontología, siempre reinventará algo.

###  Dos plataformas heredadas

**JADE**(Java Agent Development framework, 19992020s) ‒ es el uso de la más amplia de tiempo de ejecución conforme a la FIPA―. Agentes 继承一个基类, intercambiar mensajes ACL, en contenedores内运行,并使用 行为 协调──interacción-protocol library 附附合同网、订阅-notificar、请求-when 和建议-accept──

**JACK**(Software orientado a agentes, comercio) enfatizar en los mensajes de FIPA 之上的 BDI (Creencia-Deseo-Intención)

两者都在网堆吞掉多代理使用案例 后走向衰落──MCP 和 A2A es el año 2026 containers──

### ¿Por qué la FIPA se está despejando?

- **Ontology 开销。**FIPA 要求使用共享 ontology 来 parse `content` Sobre ontologías 达成一致 es un proceso de estandarización de varios años  web 只是 usando HTTP + JSON 
- **没人使用的 formal semantics。**SL (Lenguaje semántico) proporciona condiciones de verdad estrictas, pero la mayoría de los sistemas de producción utilizan contenido de forma libre,并忽略形式主義──
- **Tooling lock-in。**JADE sólo apoya Java; Jack es un producto comercial.
- **internet 赢下了 stack。**REST, posteriormente JSON-RPC, posteriormente gRPC, sustituyó el transporte de ACL.

### LLM 复兴是 FIPA-lite

Comparar con una FIPA `request`Con un MCP`tools/call`¿Qué es esto ?

```
(request                                {
  :sender  agent1                         "jsonrpc": "2.0",
  :receiver tool-server                   "method":  "tools/call",
  :content "(lookup stock IBM)"           "params":  {"name":"lookup_stock",
  :ontology finance                                   "arguments":{"symbol":"IBM"}},
  :conversation-id c42                    "id": 42
)                                        }
```

El mismo envase, diferente sintaxis. Dos de ellos tienen: quien, quien, quien, intención, carga de pago, correlación.

En la encuesta de 2025, Liu et al. de la encuesta de 2025 ((A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP, arXiv:2505.02279) explicitamente señala esta transmisión: MCP a la hora de usar herramientas para hablar, A2A a la hora de hablar con agentes, ACP a la hora de hacer auditar y seguir el discurso, ANP a la hora de hacer extensiones de identidad descentralizada.

### Directamente indicando el descenso

**FIPA 给了你、而现代 specs 放弃的东西：**

- Semántica formal: puedes demostrar`inform`Significa que el remitente cree en el contenido.
- Un reglamento de los performativos: No tienes que volver a discutir si deberíamos tener uno.`cancel`¿Qué es eso?
- En la actualidad, el protocolo de interacción de varios decenios: contrato-red, suscripción, notificación, propuesta-aceptación y propiedades de corrección conocidas.

**现代 specs 给了你、而 FIPA 没有的东西：**

- Con todas las cargas útiles nativas de JSON compatibles con todos los instrumentos modernos.
- LLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- Transporte de la pila web: https, SSE, WebSocket)
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `server/discover`Con tarjeta de agente A2A  capacidad de detección 

Más sencilla semántica de intención, más fácil de realizar.

### Deberían ser transferidos los protocolos de interacción

La FIPA  acompaña a unos 15 protocolos de interacción ‒ tres de los cuales valoran la pena introducir sistemas multiagentes de LLM:

1. **Contract Net Protocol (CNP)。**El gerente 发出 `cfp`(llamada a propuestas); licitadores`propose`响应;manager 接受/拒绝──这是规范的任务市场模式(Fase 16 · 16 Negociación)。
2. **Subscribe/Notify。**Abonante 发送 `subscribe`; editor en el tema 变化时发送 `inform` Ése es cada autobús de eventos de 2026
3. **Request-When。**当条件 Y 成立时执行 X──带预条件的延迟行动──2026 年的模拟是耐久工作流引擎中的延迟任务(Phase 16 · 22 Production Scaling)──

Cada uno puede ser claramente mapeado hasta las colas de mensajes modernas, las encuestas HTTP + o la transmisión de SSE.

###  Abandonar la ontología   Después se producen problemas

 no comparten ontología, agentes 会从自然语言内容 推断含义──2026年有文档记录的失败模式 是 **semantic drift**Dos agentes usando el mismo palabra`"customer"`) muestra un concepto ligeramente diferente, el agente del receptor 按误解行动, y ningún validador de esquema 能捕获它──FIPA ontology 要求会在解析时间 拒绝这个消息──

No se puede utilizar el método de reducción de la pérdida de peso.

- `content`Esquema JSON: en el nivel de cable rechazo error de estructura.
- Artículos de tipo A2A: rechazar la modalidad de error.
- Envase 中的显式表演: incluso si el contenido es un lenguaje natural, también puede hacerse claro que el significado es diferente.

### 2026 especificaciones 映射到 discurso-acto patrimonio

| Modern spec | FIPA analog | What it keeps | What it drops |
|---|---|---|---|
| MCP `tools/call` | `request` | explicit intent、correlation id | formal semantics、ontology |
| MCP `resources/read` | `query-ref` | explicit intent、correlation id | formal semantics |
| A2A Task lifecycle | contract-net + request-when | async lifecycle、state transitions | formal completeness guarantees |
| A2A streaming events | subscribe/notify | async push | typed-predicate subscription |
| CA-MCP shared context | blackboard（Hayes-Roth 1985） | multi-writer shared memory | logical consistency model |
| NLIP | natural-language content | LLM-native | schema |

Desde arriba hasta abajo leer esta tabla, el modelo es: mantener la primitiva estructural, abandonar el formalismo, hacer LLM 掩盖歧义──


```figure
sw-contract-net
```

## Construirlo

`code/main.py`实现 un traductor FIPA-ACL de gran alcance. 编码和码规范的ACL envólogo,并展示每种MCP / A2A mensaje de forma 如何归约为同样七个字段.

- 将五条 MCP-style 和 A2A-style mensajes codificados para FIPA-ACL
- La FIPA-ACL se ha convertido en un sistema de comparación de precios.
- Uso `cfp`¿Qué es esto?`propose`¿Qué es esto?`accept-proposal`¿Qué es esto?`reject-proposal`, entre un gerente y tres licitadores , ejecutar una negociación de contrato en red .

运行:

```
python3 code/main.py
```

输出 es un tramo lado a lado, mostrar cada uno de los mensajes modernos de 2026 JSON 形式和 FIPA-ACL 形式, luego mostrar una vez la red de contrato de oferta de viaje de vuelta.

## Usalo

`outputs/skill-fipa-mapper.md`Es una habilidad, que leerá cualquier agente-protocolo especificación y generar FIPA-ACL mapeo. Antes de adoptar el nuevo protocolo, con él responder:`inform`¿Qué es eso ?

##  entregarlo

No traigas la FIPA-ACL... traigas su lista de verificación...

- ¿Qué es la intención de cada mensaje primitivo?
- ¿Existe una correlación entre la respuesta a la solicitud y la cancelación?
- ¿Existe un lenguaje de contenido claro ((JSON-RPC, texto plano, artefacto de tipografía estructurado)?
- ¿Los protocolos de interacción son de primera clase, o estás en la reinstalación de la red de contratos?
- Cuando dos agentes tienen diferencias en el significado del contenido ¿qué pasa?

Antes de entregar cualquier nuevo protocolo a la producción, primero registra estos cinco problemas.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` observar la codificación de ida y vuelta  identificar qué FIPA funciona con la respuesta `tools/call`¿Qué es esto?`resources/read`Y la creación de tareas A2A.
2. Con uno .`cancel` Expandir la demostración de contrato de red, permitir que el gerente pueda retirar la tarea durante el proceso de licitación `cancel`¿Cuál es el tipo de fallo que no puedo resolver?
3. 阅读 FIPA ACL La estructura de mensajes de la FIPAhttp://www.fipa.org/specs/fipa00037/）第4.14.3 节── seleccionar una performance de un curso no cubierto,并 describir su moderno análogo JSON-RPC──
4. 阅读 Liu et al., arXiv:2505.02279──分别针对 MCP、A2A、ACP、ANP,列出它们保留和放弃的FIPA执行家族──
5. Por tu propio sistema.`request`de la ejecución `content`字段设计一个最小JSON-Schema── Comparado con el lenguaje natural puro, ¿qué te dio este esquema, y qué costó?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Speech act | “一种会做事的 utterance” | Austin/Searle：把 utterances 视为 actions。ACL 的理论源头。 |
| FIPA | “那个老 XML 东西” | IEEE Foundation for Intelligent Physical Agents。2000 年标准化了 ACL。 |
| ACL | “Agent Communication Language” | FIPA 的 envelope format：performative + content + metadata。 |
| Performative | “那个动词” | 一条 message 的 intent class：`inform`、`request`、`propose`、`cfp` 等。 |
| KQML | “FIPA 的前身” | Knowledge Query and Manipulation Language（1993）。更简单，范围更窄。 |
| Ontology | “共享词汇表” | 对 content language 所谈论概念的 formal definition。 |
| SL0 / SL1 | “FIPA content languages” | Semantic Language levels 0 and 1，即 formal content language family。 |
| Contract Net | “Task market” | Manager 发出 cfp；bidders propose；manager accepts。规范的 interaction protocol。 |
| Interaction protocol | “Messages 的模式” | 一组具有已知 correctness 的 performatives 序列：request-when、subscribe-notify 等。 |

## 延伸阅读
- [Liu et al. — A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP](https://arxiv.org/html/2505.02279v1) Generalizaciones de especificaciones modernas con el patrimonio de la FIPA  Conexión de las normas de 2025 encuesta
- [FIPA ACL Message Structure Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) 2000 años de aprobación de formato de sobre
- [FIPA Communicative Act Library Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) 完整的 catálogo de actuación
- [MCP specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)¿ Qué es esto ?`request`- ¿ Qué ?`query-ref`de la forma actual sin estado de uso de herramientas
- [A2A specification](https://a2a-protocol.org/latest/specification/) contrato-net 和 suscripción-notificación de agentes-peer 等价形式
