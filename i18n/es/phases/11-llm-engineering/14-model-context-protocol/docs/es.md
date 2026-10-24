# 模型上下文协议(Modelo de Protocolo de Contexto, MCP)

> MCP para AI Host ha proporcionado un protocolo unificado, utilizado para el movimiento de descubrimiento y la utilización de herramientas ( herramientas) 资源 (resursos) 资源 (s) 提示模板 (prompts) ⋅2026-07-28 修订版使该协议彻底无化:能力声明与版本状态下文随着每一个请求独立传递,不再依赖连接绑定的握手──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (函数调用), Phase 11 · 03 (结构化输出)
**Time:** ~75 分钟

## El objetivo del aprendizaje

- 明确区分 MCP Host、Client、Server、传输层(Transporte) con el servidor 原语(Primitivos)。
- 构建携带 MCP 2026-07-28 规范必填元数据的 JSON-RPC 请求──
- Uso `server/discover`检查版本、身份与能力声明──
- Desde herramientas, recursos y instrucciones, regresar con los tipos de identificación y los resultados de la percepción de almacenamiento.
- 解释现代无状态 MCP 如何与握手时代的 Legacy Server 实现双时代互操作──
- Para establecer el estado de seguridad del servidor, las fronteras de la estrategia de transmisión y el camino de aprobación artificial.

## 问题背景

Su aplicación necesita una consulta de base de datos, operaciones de calendario y funciones de lectura de documentos. Si no hay un protocolo de comunicación unificado, cada AI Host debe escribir un código de detección, manipulación, error de procesamiento, transmisión y identificación con la misma capacidad.

MCP se dobla en esta enorme N×M  integrada de la matriz. El servidor expone a la estándar de JSON-RPC  interfaz; cualquier cliente de la conformidad                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

Pero hay un límite clave: el MCP es responsable de la normalización del protocolo de comunicación en sí mismo. No es responsable de decidir qué herramientas debe utilizar el modelo, no es responsable de que el contenido de incrédulo se vuelva seguro automáticamente, ni tampoco será responsable de que las solicitudes de no estado se transformen automáticamente a un estado de aplicación permanente.

## 核心概念 核心概念 核心概念 核心概念

![MCP Host、无状态请求与 Server 原语](../assets/mcp-architecture.svg)

### 三大 Server 原语

1. **Tools（工具）**:可调用动作── cada herramienta contiene nombre、 descripción、 JSON Schema 输入约束及执行函数──
2. **Resources（资源）**: tiene nombre y según el contenido de la URI 寻址, para el Cliente 读取。
3. **Prompts（提示模板）**Modelo estructurado de uso repetible, para el host 展现给用户──

El host indica AI  aplicaciones. Un cliente MCP dentro del host y un servidor 通信.

### 无状态请求取代传统握手 (no hay estado)

MCP 2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `initialize`Y `notifications/initialized`, también se ha eliminado la sesión de nivel de acuerdo.`params._meta`En el medio llevar a resolver lo que necesita completa en la siguiente:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

协议版本与客户 能力为强制必填项,Client 身份为推项──缺失 `_meta`、缺少必填字段或字段类型错误均属于参数形,返回 Params Invalid 错误码(`-32602`◊若版本字符串合法但服务器 无法支持,返回 `UnsupportedProtocolVersionError`(El artículo`-32022`El servidor puede procesar independientemente cualquier solicitud válida sin ningún registro histórico de consulta.

无状态绝对不意味着应用无法保持业务状态――它只意味着状态不再隐藏在底层MCP 连接或 连接`Mcp-Session-Id` Si el flujo de trabajo necesita una continuidad de rotación, el servidor generará un control de estado opaco, el cliente en el rotación posterior lo hará como un instrumento ordinario 参数传入── en cada solicitud debe verificar su autorización──

### 服务发现与版本协商 服务发现与版本协商

Todos los servidores modernos deben implementarse`server/discover`△ Its return results广播支持的协议版本、能力集合与服务器身份:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {}
    },
    "ttlMs": 3600000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "demo-server",
        "version": "1.0.0"
      }
    }
  }
}
```

El cliente también puede recurrir directamente al método de negocio y tratar errores de versión, pero recurrir a descubrir puede hacer que la capacidad de mostrar y consultar la versión sea más transparente.`UnsupportedProtocolVersionError`, error código `-32022` Sus datos incluyen `supported`(Server 支持的修订版数组) y `requested`(被拒绝的修订版) (se rechazó la versión modificada)

En el estudio 模式下,双时代(doble era) Cliente uso `server/discover`发起探测── encontrar éxito o recibir `UnsupportedProtocolVersionError`等 ya se han identificado errores modernos, que demuestran que el otro es moderno Server; sólo hay errores no modernos o supertiempo que permiten regresar a la versión anterior de 2025-11-25.`initialize`握手──Legacy 行为仅作为兼容补偿,绝不是现代默认──

### 显式的结果结构

2026-07-28  Cada éxito en las normas centrales`resultType`¿Qué es esto ?

- `complete`: indicó que la operación se ha completado completamente.
- `input_required`: indicó que el servidor  necesita pasar por un modo de solicitud de varias ramas  MRTR) Enviar un complemento de la comunicación  `tools/call`¿Qué es esto?`resources/read`O `prompts/get`返回 this type──

El cliente debe estar ausente`resultType`La versión anterior debe ser completada.

El servidor debe estar en cada resultado.`_meta`Encuentra`io.modelcontextprotocol/serverInfo` Esta identidad es una declaración automática del servidor, sólo para mostrar ̇日志与调试, no puede ser utilizada como base de decisión de seguridad ̇

列表和读取操作的结果也附带 `ttlMs`(mil segundos de tiempo de vida) y `cacheScope`(缓存范围) ―― de certeza `tools/list`排序加上新鲜度提示, hacer que el Cliente 能够安全缓存服务发现结果,并提升模型 Prompt Cache 的稳定性──`cacheScope: public`允许跨上下文共享缓存,`private`则严格限制发起请求的私有上下文内──

### 线缆格式与传输层

MCP en estudio o en streaming HTTP 上运行 JSON-RPC 2.0:

- Pío de petición:包含 `jsonrpc`¿Qué es esto?`id`¿Qué es esto?`method`Y `params`¿Qué es eso?
- 响应(Respuesta): contiene相匹配 `id`y también`result`O `error`¿Qué es eso?
- 通知(notificación):无 `id`No necesito ninguna respuesta.

现代 Streamable HTTP 暴露单个仅接受 POST的端点──每一个 JSON-RPC 消息应应应一次独立的 POST──请求 POST 接收单个 JSON对象,或接收以最终响应结尾的请求作用域 SSE 流──被接受的通知 POST 返回无响应体的 HTTP 202──本核心修订版未定义任何通过 Streamable HTTP 从客户端发送到服务器的通知──

2026-07-28 规范中**不存在**独立的 MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`O basado en`Last-Event-ID`de la interrupción de la re-posición.`subscriptions/listen`POST Por favor, su respuesta mantener la conexión SSE 流开启──

### 无需 Server 发起请求的客户端 输入

旧修订版允许 el servidor 通过流发送 `sampling/createMessage`¿Qué es esto?`roots/list`O `elicitation/create`之类的请求──当前协议改用多轮往返请求(MRTR)──符合条件的工具 调用、资源读取或快速 获取会回归 `resultType: input_required`,并至少携带 `inputRequests`O `requestState`之一──Client 收集所需输入, use new JSON-RPC ID 和对应的 `inputResponses`重试原始方法;若提供了 `requestState`, entonces, como se transmite.`inputRequests`, Reprobar el tiempo`inputResponses`¿Qué es eso?

Roots、Sampling and Logging  todavía se puede utilizar pero ya ha sido abandonado, nuevos logros no deben adoptarlos― Roots o muestras existentes `inputRequests`En el caso de los servidores, no se trata de un servidor independiente al cliente JSON-RPC.

```figure
mcp-nxm-collapse
```

## 动手构建 动手构建

### 步骤 1: registrarse en el servidor 表面

Aunque el acuerdo de registro ha cambiado, el método de registro sigue siendo simple:

```python
server = MCPServer("demo-server")

@server.tool(
    "add",
    "Add two integers.",
    {
        "type": "object",
        "properties": {
            "a": {"type": "integer"},
            "b": {"type": "integer"}
        },
        "required": ["a", "b"]
    }
)
def add(a: int, b: int) -> dict:
    return {"sum": a + b}
```

`code/main.py`El medio completo de implementación también registra un recurso y un prompt. Se trata de utilizar sólo la biblioteca de estándares, para que puedas ver cada estructura de la encienda, en lugar de entregar los detalles del protocolo a SDK.

### Paso 2: Para cada solicitud de datos adicionales

```python
def request(method, params=None):
    body_params = dict(params or {})
    body_params["_meta"] = {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": {
            "name": "demo-client",
            "version": "1.0.0"
        }
    }
    return {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": body_params
    }
```

No sólo coloque estos datos en el objeto conectado. El servidor lo probará en cada solicitud.

### 步骤 3: ((可选) primero encontrar la nueva lista

调用                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `server/discover`, seleccionar una versión de apoyo, y luego utilizar `tools/list`Si ya sabes la versión no se puede manejar.`-32022`, direct调用 `tools/list`Lo mismo es legal.

演示按名称顺序返回工具列表,并附带                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `ttlMs`¿Qué es esto?`cacheScope`¿Qué es esto?`resultType`Con el servidor como un instrumento, el resultado de la devolución es completo pero no puede ser almacenado, ya que su salida puede depender del estado actual.

### Paso 4: hacer la misma solicitud de mapeo en HTTP

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `tools/call`POST  llevar espejo JSON-RPC petición de la solicitud de la cabeza:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

`MCP-Protocol-Version`La petición debe estar`_meta`La versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la Unión.`Mcp-Method`En cada JSON-RPC las solicitudes son obligatorias y deben estar`method`Un poco.`Mcp-Name`Sólo en`tools/call`¿Qué es esto?`resources/read`Con`prompts/get`时必填,且必须与工具名、资源URI或提示名一致. 时必填请求头或不一致,返回 HTTP 400与 时必填请求头或不一致,返回 HTTP 400与 时必填,且必须与工具名、资源URI或提示名一致.`HeaderMismatch` err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err`-32020`¿Qué es eso?

### Paso 5: Implementar la seguridad fuera del estado del acuerdo

- En cada HTTP Solicitud de acceso a la escuela
- 本地 Server  se vincula a localhost, y en Streamable HTTP `Origin`¿Qué es eso?
- ¿ Qué ?`destructiveHint: true`标记会修改状态的工具,并要求主持人 审批──
- 显式传递目录与文件范围, en lugar de depender de las Raíces abandonadas.
- Los recursos y herramientas de producción se consideran datos incrocibles.
- Estudios de investigación y desarrollo de la información sobre la identificación de los pacientes

## 动手实践 动手实践 动手实践 动手实践

En el catálogo de clases:

```bash
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

Primera línea de exportación debe reportarse en el acuerdo`2026-07-28`Lo encontré .`demo-server`Entonces mira.`MCPClient.request`Se reedifica para cada uso.`_meta` Mover datos de una solicitud, observar el servidor  rechazarlo 

## 交付物  entrega

本课交付                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-mcp-server-designer.md` Puede transformar un ámbito de negocio en un MCP de diseño sin estado.

## Continuar en profundidad en el MCP

Esta clase te ayudará a establecer un modelo de acuerdo. La fase 13 dividirá las cuatro fronteras de producción en sus respectivos programas independientes de construcción y verificación:

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md): cubre el esquema de entrada cerrado, el contenido estructurado, los datos de la red, la falta de transparencia, la completa autorización y la distinción entre el acuerdo y el error de negocio.
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md)El objetivo de la investigación es mejorar la calidad de la información y la calidad de la información.
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md)El registro de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)El programa de investigación de la Comisión de Investigación y Desarrollo de la Información (CDD) incluye:

Cuando el servidor cruce el equipo o la frontera de confianza, por favor, aprendalas en orden. Ellos te acompañan desde el método que puedes usar hasta el acuerdo para mantenerlo seguro y diagnosticable durante todo el proceso de implementación.

##  ejercicios y reflexiones

1. Añade uno.`subtract`工具, confirmación `tools/list`仍按字母序排列──
2. 移除 protocol-version 键,验证返回 Params inválidos(`-32602`)¬ y luego envió en formato correcto pero no soportado versión `2025-11-25`,验证返回 `-32022`, confirmar `requested`Se ha vuelto a la versión revisada, y se ha vuelto a la versión revisada.`supported`La versión de la selección.
3. Para crear operaciones de adjunto de servidor generado de `draftId`,并 requiere una actualización de la operación para que se haga como un parámetro de entrada. Explica por qué es el estado de aplicación y no el protocolo de sesión.
4. 让一个需要用户确认的工具返回 `input_required` Usar un nuevo ID ∞`inputResponses`条目和原样                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `requestState`重试原始调用, en lugar de fabricar una solicitud JSON-RPC del servidor al cliente.
5.  diseñar un estudio de dos tiempos  草图:把结果或已识别的现代错误视为现代对端, sólo en el momento de encontrar errores o sobresalir de tiempo que permite volver a`initialize`¿Qué es eso?

## 核心专业术语

| 术语 | 通俗说法 | 实际含义 |
|------|-----------------|------------------------|
| MCP | “LLM 的工具协议” | 用于服务发现、工具、资源、提示模板与扩展的 JSON-RPC 协议 |
| Host | “AI 应用” | 拥有大模型与用户交互界面、挂载一个或多个 MCP Client 的 AI 应用程序 |
| Client | “连接器” | 代表 Host 与单个具体 Server 执行 MCP 通信的连接器组件 |
| 无状态 MCP (Stateless MCP) | “没有 Session” | 每个请求携带版本与能力元数据，不存在与底层物理连接绑定的协议状态 |
| `server/discover` | “能力探测” | 强制实现的 Server 方法，用于公布支持版本、能力集与身份标识 |
| `resultType` | “结果状态” | 把结果标记为 `complete` 或 `input_required` |
| 显式状态句柄 (State handle) | “工作流 ID” | 由 Server 签发、作为普通业务参数传递的应用层唯一标识符 |
| Streamable HTTP | “远程传输” | 单一 POST 端点架构，返回常规 JSON 或请求作用域的 SSE 响应 |
| MRTR (多轮请求模式) | “请求输入再重试” | 嵌入在响应结果中的输入请求，完成后由客户端重新发起原始操作重试 |

## 延伸阅读

- [MCP 2026-07-28 核心变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 服务发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 多轮请求模式 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 已弃用特性](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
