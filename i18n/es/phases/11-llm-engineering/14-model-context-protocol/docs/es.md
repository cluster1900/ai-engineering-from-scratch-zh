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
3. **Prompts（提示模板）**Modelos de estructuración de uso repetible, para que el host pueda mostrar a los usuarios.

Host indica AI hosts aplicaciones (por ejemplo, Claude Desktop) ――MCP Client en Host 专职与特定服务器 通信──传输层负责在两者之间搬运 JSON-RPC 报文──

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

无状态绝对不意味着应用无法保持业务状态――它只意味着状态不再隐藏在底层MCP 连接或 连接`Mcp-Session-Id` Si el flujo de trabajo necesita una continuidad de rotación, el servidor produce un control de estado opaco, el cliente en el rotación posterior lo hace como un instrumento normal 参数传入──

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

El cliente también puede recurrir directamente al método de negocio y tratar errores de versión, pero recurrir a descubrir puede hacer que la capacidad de mostrar y consultar la versión sea más transparente.`-32022`, sus datos adicionales contienen servidor  soportado `supported`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `requested`版本──

En el estudio 模式下,双时代(doble era) Cliente uso `server/discover`发起探测── encontrar éxito o recibir como `-32022`等 ya se han identificado errores modernos, que demuestran que el otro es moderno Server; sólo hay errores no modernos o supertiempo que permiten regresar a la versión anterior de 2025-11-25.`initialize`握手──Legacy 行为仅作为兼容补偿,绝不是现代默认──

### 显式的结果结构

2026-07-28  Cada éxito en las normas centrales`resultType`¿Qué es esto ?

- `complete`: indicó que la operación se ha completado completamente.
- `input_required`: indicó que el servidor  necesita pasar por un modo de solicitud de varias ramas  MRTR) Enviar un complemento de la comunicación  `tools/call`¿Qué es esto?`resources/read`O `prompts/get`返回 this type──

El cliente debe estar ausente`resultType`La versión anterior debe ser completada.

列表和读取操作的结果也附带 `ttlMs`(mil segundos de tiempo de vida) y `cacheScope`(缓存范围) ―― de certeza `tools/list`排序加上新鲜度提示, hacer que el cliente 能够安全缓存服务发现结果, significativamente mejorar la estabilidad del modelo de caché rápido.`cacheScope: public`允许跨上下文共享缓存,`private`则严格限制发起请求的私有上下文内──

### 线缆格式与传输层

MCP en estudio o en streaming HTTP 上运行 JSON-RPC 2.0:

- Pío de petición:包含 `jsonrpc`¿Qué es esto?`id`¿Qué es esto?`method`Y `params`¿Qué es eso?
- 响应(Respuesta): contiene相匹配 `id`y también`result`O `error`¿Qué es eso?
- 通知(notificación):无 `id`No necesito ninguna respuesta.

现代 Streamable HTTP 暴露单个仅接受 POST的端点──每一个 JSON-RPC 消息应应应一次独立的 POST──请求 POST 接收单个 JSON对象,或接收以最终响应结尾的请求作用域 SSE 流──被接受的通知 POST 返回无响应体的 HTTP 202──

2026-07-28 规范中**不存在**独立的 MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`O basado en`Last-Event-ID`de la interrupción de la re-posición.`subscriptions/listen`POST Por favor, su respuesta mantener la conexión SSE 流开启──

```figure
mcp-nxm-collapse
```

## 动手实践 动手实践 动手实践 动手实践

### 步骤 1: registrarse en el servidor 表面

En el`code/main.py`En el caso de los servicios de registro y análisis de informes,

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

### 步骤 3: HTTPS 镜像头映射

远程调用通过HTTP POST 发起时, 镜像指定头部:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

Cuando la petición no coincida con la petición, vuelva inmediatamente a HTTP 400 con el código de error `-32020`¿Qué es eso?

运行测试命令:

```bash
cd phases/11-llm-engineering/14-model-context-protocol
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

## 交付物  entrega

本课交付                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-mcp-server-designer.md` Puede transformar un área de negocio específica en un esquema de estructura que cumpla con las normas modernas de MCP sin estado, que incluye la búsqueda de acuerdos, datos por solicitud, listas de caché de determinación, estados de manifiesto, estrategias de transmisión y aprobación.

## Continuar en profundidad en el MCP

Este curso te ha permitido establecer un protocolo de acuerdo. En la Fase 13, los siguientes cuatro pasos básicos abarcarán una frontera de producción más estricta:

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md)En el caso de los Estados Unidos, el número de empresas que se encuentran en el mercado de la información se reduce a un 50% en el año.
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md)El objetivo de la investigación es mejorar la calidad de la información y la calidad de la información.
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md)El proyecto de investigación de la Comisión sobre la protección de la salud y la protección de los animales en el sector de la salud y la salud en el sector de la salud y la salud en el sector de la salud y la salud en el sector de la salud y la salud en el sector de la salud y la salud en el sector de la salud y la salud en el sector de la salud y la salud en el sector de la salud y la salud en el sector de la salud y la salud en el sector de la salud y la salud.
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)El proyecto de ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la ley de la

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| MCP | 用于向 AI Host 暴露服务发现、工具、资源、提示模板与扩展的 JSON-RPC 协议 |
| Host | 拥有大模型与用户交互界面、挂载一个或多个 MCP Client 的 AI 应用程序 |
| Client | 代表 Host 与单个具体 Server 执行 MCP 通信的连接器组件 |
| 无状态 MCP (Stateless MCP) | 每个请求携带版本与能力元数据，不存在与底层物理连接绑定的协议状态 |
| `server/discover` | 强制实现的 Server 方法，用于公布支持版本、能力集与身份标识 |
| `resultType` | 区分成功结果状态的鉴别字段（如 `complete` 或 `input_required`） |
| 显式状态句柄 (State handle) | 由 Server 签发、作为普通业务参数传递的应用层唯一标识符 |
| Streamable HTTP | 单一 POST 端点架构，返回常规 JSON 或请求作用域的 SSE 响应 |
| MRTR (多轮请求模式) | 嵌入在响应结果中的输入请求，完成后由客户端重新发起原始操作重试 |

## 延伸阅读

- [MCP 2026-07-28 核心变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 服务发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 多轮请求模式 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
