# A2A  智能体间通信协议(Protocolo de agente a agente)

> Google publicó A2A en abril de 2025; hasta abril de 2026, la normativa oficial se ha desarrollado hasta 1.0.1, y obtiene el apoyo de más de 150 organizaciones, incluyendo AWS, Microsoft, Salesforce, etc. A2A es el protocolo de interconexión horizontal de MCP:MCP 聚焦纵向 (MCP  Tools), mientras que A2A 聚焦横向点对点 (MCP  Agent)  (Agent)  (Agent) ).

**Type:** Learn + Build
**Languages:** Python (stdlib, `http.server`, `json`)
**Prerequisites:** Phase 16 · 04（原语模型）
**Time:** ~75 分钟

## 问题背景

Cuando su agente necesita ser llamado a ser desplegado en otro sistema o en otra organización, ¿cómo debe comunicarse? Usted puede exponer un punto final HTTP exclusivo, definir un esquema JSON personalizado, y esperar que el otro pueda usarlo de acuerdo con sus reglas. Pero en ese caso, cada colaboración entre los agentes se convertirá en una integración personalizada de alto costo.

A2A para este transsistema de configuración proporciona un protocolo de línea de uso general (Wire Protocol) ⋅ define la base de datos estándar de servicio, el abrazamiento de tareas estándar, la transferencia de datos estándar y los productos de salida estándar, como la estructura HTTP+REST para el cuerpo inteligente.

## 核心概念 核心概念 核心概念 核心概念

### Cuatro elementos principales

**Agent Card（智能体名片）。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `/.well-known/agent-card.json`El documento JSON, para describirlo en su totalidad`supportedInterfaces`(端点 URL、协议绑定、协议版本) 、默认输入和输出媒体类型, así como las necesidades de identificación de derechos de emisión`securitySchemes`Con`securityRequirements`•■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

```http
GET /.well-known/agent-card.json HTTP/1.1
Host: agent.example.com
```

```json
{
  "name": "code-review-agent",
  "description": "Reviews Python and TypeScript code.",
  "version": "1.0.0",
  "supportedInterfaces": [
    {
      "url": "https://agent.example.com",
      "protocolBinding": "HTTP+JSON",
      "protocolVersion": "1.0"
    }
  ],
  "capabilities": {"streaming": false, "pushNotifications": false},
  "securitySchemes": {
    "bearer": {"httpAuthSecurityScheme": {"scheme": "Bearer"}}
  },
  "securityRequirements": [{"schemes": {"bearer": {"list": []}}}],
  "defaultInputModes": ["text/plain", "application/json"],
  "defaultOutputModes": ["application/json"],
  "skills": [
    {
      "id": "review-python",
      "name": "Review Python",
      "description": "Reviews Python code.",
      "tags": ["code-review", "python"]
    },
    {
      "id": "review-typescript",
      "name": "Review TypeScript",
      "description": "Reviews TypeScript code.",
      "tags": ["code-review", "typescript"]
    }
  ]
}
```

**Task（任务）。**Unidad de trabajo básico. Un objeto de estado diferente con ciclo de vida:`TASK_STATE_SUBMITTED`¿ Qué es esto ?`TASK_STATE_WORKING`¿ Qué es esto ?`TASK_STATE_COMPLETED`- ¿ Qué ?`TASK_STATE_FAILED`- ¿ Qué ?`TASK_STATE_CANCELED` Cliente  envío de mensajes, servidor  creación de tarea, posteriormente el cliente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

**Artifact（产物）。**La tarea  ejecutar completos resultados estructurados                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `text`¿Qué es esto?`raw`¿Qué es esto?`url`O `data`之一并可指明其 `mediaType`¿Qué es eso?

**不透明生命周期（Opaque Lifecycle）。**A2A 绝不规定远程代理 *内部*如何完成任务──客户 仅观察状态转换与最终产品;被调用方完全自由选择任何底层模型和框架──

### MCP y A2A

- **MCP**:Agent  Herramienta。Agent 借助 JSON-RPC 读写工具 Server,核心完全无状态。
- **A2A**Agente  Agente, en el marco de un acuerdo de colaboración, ambas partes de comunicación tienen un cuerpo intelectual completo con capacidad de pensamiento independiente.

En la producción de sistemas multiinteligentes, los dos se coordinan: A2A para el extremo en su lado de la configuración local de herramientas MCP.

### 发现与调用时序 发现与调用时序

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Agent server
    C->>S: GET /.well-known/agent-card.json
    S-->>C: Agent Card JSON
    C->>S: POST /message:send (returnImmediately)
    S-->>C: task, TASK_STATE_SUBMITTED
    C->>S: GET /tasks/{id}
    S-->>C: TASK_STATE_WORKING
    C->>S: GET /tasks/{id}
    S-->>C: TASK_STATE_COMPLETED, artifacts
```

Los siguientes caminos siguen las normas de HTTP+JSON, y cada solicitud tiene que ser portada.`A2A-Version: 1.0`En el caso de la solicitud.`SendMessage`Se bloqueará hasta que finalice la tarea, por lo que el cliente se configura con un modo de consulta.`configuration.returnImmediately`Para que se lleve a cabo la tarea.

对于流式传输:`POST /message:stream`返回 Servidor-Enviado Eventos( primero输出 `task`, posteriormente陆续推送`statusUpdate`Con`artifactUpdate`事件), y `/tasks/{id}:subscribe`则用于重新附加到运行中的任务――流在任务进入终态时正常关闭,报文中不包含单独的 `final`标志──

### Identificación y seguridad (autor)

A2A origin生支持三种主流安全模式:

- **Bearer Token**:OAuth2 或不透明 Token`httpAuthSecurityScheme`O `oauth2SecurityScheme`)。
- **mTLS**: doble hacia TLS 认证, organización间强证明身份(`mtlsSecurityScheme`)。
- **API Key**: located request head、URL 查询参数 o clave en la cookie`apiKeySecurityScheme`)。

认证规则在 Agent Card 中公布:`securitySchemes`命名方案,`securityRequirements`条例调用方必须满足的要求;; el cliente según lo encontró y siguió;;

### 截至 2026 年 4 月,150+ 家组织

La adopción de empresas impulsó la escala de A2A. Un punto más destacado: A2A se convirtió en un sistema inteligente empresarial de manera transversal. Google Cloud en Vertex AI Agent Builder proporcionó apoyo A2A. Microsoft Agent Framework lo apoyó. La mayoría de los frameworks principales (LangGraph, CrewAI, AutoGen) proporcionan A2A adaptadores.

### El mejor de los escenarios

- **跨组织调用。**A  empresa de inteligencia  B  empresa de inteligencia ∞ no hay A2A, cada uno tiene un contrato individual ∞
- **异构框架。**LangGraph 智能体调用 CrewAI 智能体,再调用自定义 Python 智能体──A2A Colocarlos juntos──
- **带类型的产物。**视频结果、结构化 JSON、音频,都是一等公民──
- **长时间运行的任务。**La vida de la persona se vuelve poco transparente, y las tareas de las horas de duración también se manejan bien.

### Las deficiencias de A2A

- **对延迟敏感的微调用。**El ciclo de vida de A2A es diferente.
- **紧耦合的进程内智能体。**Si dos cuerpos inteligentes funcionan en el mismo proceso Python, A2A HTTP 往返就是大材小用──
- **小团队。**La regulación de la venta es real; sólo el cuerpo inteligente utilizado internamente no puede necesitar este grado formal.

### A2A y ACP,ANP,NLIP

En el período 2024-2026 se han establecido varias normas relacionadas:

- **ACP**(IBM/Linux Foundation):A2A's anterior, alcance más estrecho.
- **ANP**(Protocolo de red de agentes): enfoque en la detección, descentralización y prioridad.
- **NLIP**(Ecma Protocolo de Interacción de Lenguaje Natural,2025 年 12 月标准化): naturaleza语言内容类型──

截至 2026 年 4 月,A2A es el más amplio de los protocolos de interoperabilidad adoptados.

```figure
sw-agent-card-discovery
```

## 动手实践 动手实践 动手实践 动手实践

`code/main.py` Basado en A2A 1.0 HTTP+JSON  Binding Protocol, puramente usando Python  estándar库 `http.server`Con`json`实现ó 极简的 A2A Server y Client.

-  exposición `/.well-known/agent-card.json`El artículo 1
-  acepta `POST /message:send`调用;
- 管理 tarea  estado 机转换;
- En el`GET /tasks/{id}`Sobre el producto de vuelta.

Funciones del cliente incluyen:

- 拉取并解析 Tarjeta de agente;
-  Enviar con `returnImmediately`La misión de creación de noticias;
-  continuous rounding直至任务完成;
- 读取并验证 Finalidad Artefacto

¿Qué es eso ?

```
python3 code/main.py
```

El guión se inicia en el servidor en la línea posterior, y luego el cliente realiza el proceso completo de su implementación, mostrando directamente el proceso completo de descubrimiento, presentación, consulta y obtención de productos.

## 交付物  entrega

本课交付                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-a2a-integrator.md` Para la planificación del diseño completo de A2A  Integrado: Contenido de la tarjeta de agente Tasco  Actuación  Identificación de los derechos de selección y de la estrategia de gestión y de consulta 

##  Publicarlo

清单:

- **固定规范版本。**A2A  sigue en desarrollo; cada uno `supportedInterfaces`条目都 declarar su propio `protocolVersion`, cliente envía`A2A-Version: 1.0`¿Qué es eso?
- **幂等的任务创建。**重复提交 (重试) debe producirse sólo una tarea.`messageId`¿Qué pasa?
- **产物 schema。**声明智能体返回哪些结构;调用方应进行校验──
- **限流与鉴权。**A2A 面向公网; aplicar normas de seguridad web.
- **失败任务的死信队列。**定期检查其中的模式, encontrar los tipos de fracaso que aparecen de forma repetitiva.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Confirmar que el cliente ha encontrado que el servicio ha recibido el producto correcto.
2. Por ejemplo, "resumir") ― actualizar la Tarjeta de Agente― redactar una solicitud de un cliente de habilidades de selección de tipo de tarea―1.0 ‒ no tiene un código de habilidades, por lo que el servicio de base de las partes de la información ‒
3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `POST /message:stream`:用 Servidor-Enviado Eventos 应答(先发一个 `task`, re-enviado`statusUpdate`事件), en el estado de terminación, ¿qué diferentes procesos necesita hacer el cliente?
4. 阅读 A2A 规范(https://a2a-protocol.org/latest/specification/）。找出规范要求、而这个演示没有实现的三件事。
5. Comparación entre A2A y MCP`listTools`¿Qué diferencia hay entre el cuerpo inteligente que se describe a sí mismo y la capacidad de investigación?

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| A2A | 跨系统异构智能体间互相调用的对等开放协议 |
| Agent Card | 暴露于 `/.well-known/agent-card.json` 的元数据卡片，声明技能、端点与鉴权要求 |
| Task | 具备明确生命周期、完成时生成产物的异步工作单元 |
| Artifact | 任务产出的具名、带类型结果（文本、结构化 JSON、音视频媒体等） |
| 不透明生命周期 (Opaque lifecycle) | 内部解决过程对调用方隐藏，仅对外暴露状态流转与产物 |
| 服务发现 (Discovery) | 通过发起 `GET /.well-known/agent-card.json` 获取名片并了解支持能力 |
| MCP 对比 A2A | MCP 属于垂直的 Agent 与工具交互，A2A 属于水平的 Agent 间对等协作 |
| ACP / ANP / NLIP | 相邻的协议规范；2026 年采用最广的是 A2A |

## 延伸阅读

- [A2A 规范主站](https://a2a-protocol.org/latest/specification/) 官方权威规范
- [A2A v1.0.1 源码发布](https://github.com/a2aproject/A2A/tree/v1.0.1) Definición de los códigos y normas que sigue este curso
- [Google Developers Blog — A2A 发布说明](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) Publicación de la publicación de abril de 2025
- [A2A GitHub 仓库](https://github.com/a2aproject/A2A)  参考实现与SDK
- [Liu 等 — A Survey of Agent Interoperability Protocols](https://arxiv.org/html/2505.02279v1) MCP、ACP、A2A、ANP
