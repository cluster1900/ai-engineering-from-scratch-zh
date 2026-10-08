# 模型上下文协议(Modelo Protocolo de Contexto, MCP)

> MCP  forneceu um protocolo unificado para usar ferramentas de descoberta e de manipulação de recursos  recursos  recursos  e modelo de sugestões  Prompts  2026-07-28  Modificação    Editação para tornar o protocolo totalmente inexistente: capabilidade declaração                                                                                                                                                                                                                                                                                                                                                                                                                                                      

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (函数调用), Phase 11 · 03 (结构化输出)
**Time:** ~75 分钟

## Objectivo de aprendizagem

- 明确区分 MCP Host、Client、Server、传输层(Transporte) com Server 原语(Primitivos)。
- 构建携带 MCP 2026-07-28 规范必填元数据的 JSON-RPC 要求──
- Utilização `server/discover`检查版本、身份与能力声明──
- Os resultados de um processo de análise de dados e de dados são:
- 解释现代无状态 MCP 如何与握手时代的 Legacy Server 实现双时代互操作──
- Para o servidor estabelecer um estado de segurança, as fronteiras, estratégias de transmissão e os canais de aprovação artificial.

## 问题背景

Se não houver um protocolo de comunicação unificado, cada AI Host deve ser composto com a mesma capacidade de escrever um código de descoberta, manipulação, errores de processamento, transmissão e identificação.

MCP dobrou esta enorme N×M  integrada rectangular. O servidor expôs uma interface JSON-RPC padrão; qualquer cliente de conformidade pode encontrar essa interface, apresentá-la ao modelo ou usuário, executando o recurso e resolvendo o resultado, sem necessidade de um servidor específico adaptador.

Mas há uma fronteira fundamental: o MCP é responsável pelo protocolo de comunicação padronizada em si mesma. Não é responsável por decidir quais ferramentas o modelo deve utilizar, não é responsável por tornar automaticamente o conteúdo incrível seguro, nem será o requisito de um estado sem estado transformado automaticamente em um estado de aplicação permanente.

## 核心概念

![MCP Host、无状态请求与 Server 原语](../assets/mcp-architecture.svg)

### 三大 Server 原语

1. **Tools（工具）**:可调用动作──每个工具包含名称、描述、JSON Schema 输入约束及执行函数──
2. **Resources（资源）**:具名且按 URI 寻址的内容,供客户 读取──
3. **Prompts（提示模板）**Modelo de estruturação de uso replicável, para o usuário

Host indica AI hosteador aplicativos (por exemplo, Claude Desktop) ◦ MCP Client 专职与特定服务器 通信──传输层负责在两者之间搬运 JSON-RPC 报文──

### 无状态请求取代传统握手 (em inglês)

MCP 2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `initialize`和 `notifications/initialized`, também removeu a sessão de nível de acordo.`params._meta`Na sequência, o texto completo é:

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

协议版本与客户 能力为强制必填项,Client 身份为推项──缺失 `_meta`、缺少必填字段或字段类型错误均属于参数形, retornar Params invalidos 错误码(`-32602`(■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■`UnsupportedProtocolVersionError`(`-32022`O servidor pode tratar independentemente qualquer solicitação válida, sem registros históricos de negociação.

无状态绝对不意味着应用无法保持业务状态――它只意味着状态不再隐藏在底层MCP 连接或 连接或 连接或 连接或 连接`Mcp-Session-Id` Se o fluxo de trabalho precisa de transmissão de dados, o servidor gerará um controle de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de

### 服务发现与版本协商

Todos os servidores modernos devem ser implementados.`server/discover`△其返回结果广播支持的协议版本、能力集合与服务器身分:

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

O cliente também pode usar diretamente o método de negócios e processar erros de versão, mas o uso de descoberta pode tornar a capacidade de exibição e negociação de versões mais transparentes.`-32022`, seus dados adicionais contêm servidor  suportado `supported`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `requested`版本──

Em estúdio 模式下,双时代(double-era) Cliente uso `server/discover`发起探测── encontrar sucesso ou receber como `-32022`等 já identificados modernos erros, 均证明对方为现代服务器; 唯有非现代错误或超时才允许回到2025-11-25 的旧版`initialize`握手──Legacy 行为仅作为兼容补偿,绝不是现代默认──

### 显式的结果结构

2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `resultType`- Não .

- `complete`O que significa que a operação já está completa?
- `input_required`O servidor precisa passar por um modelo de pedido de várias rotas (MRTR) para enviar um suplemento de interação.`tools/call`- Não.`resources/read`Ou `prompts/get`返回此类型──

O cliente 必須将缺少 `resultType`A versão anterior deve ser completada.

Lista e resultados da leitura`ttlMs`(mil segundos de vida) e `cacheScope`(缓存范围) ―― determinação `tools/list`排序加上新鲜度提示,使客户端能够安全缓存服务发现结果,大幅提升模型 Prompt Cache 的稳定性──`cacheScope: public`允许跨上下文共享缓存,`private`则严格限制发起请求的私有上下文内──

### Formato de cabo e camadas de transmissão

MCP em estúdio ou Streamable HTTP 上运行 JSON-RPC 2.0:

- Peço:`jsonrpc`- Não.`id`- Não.`method`和 `params`- Não.
- 响应(Resposta): contém相匹配 `id`E também`result`Ou `error`- Não.
- 通知(notificação):无 `id`Não precisa de qualquer resposta.

现代 Streamable HTTP 暴露单个仅接受 POST的端点──每个 JSON-RPC 消息对应一次独立的 POST──请求 POST 接收单个 JSON对象,或接收以最终响应结尾的请求作用域 SSE 流──被接受的通知 POST 返回无响应体的 HTTP 202──

2026-07-28 规范中**不存在**独立的 MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`Ou baseado em`Last-Event-ID`O período de transição é de um período de transição.`subscriptions/listen`POST Por favor, seu resposta manter a ligação SSE 流開──

```figure
mcp-nxm-collapse
```

## 动手实践

### 步骤 1: registrar o servidor 表面

Em`code/main.py`Por exemplo, baseado em Python 标准库实现服务注册与报文解析:

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

### 步骤 2: Para cada pedido de dados adicionais

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

### 步骤 3:HTTP 镜像头映射

远程调用通过HTTP POST 发起时,需镜像指定头部:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

Quando o requisito não for aceito, volte imediatamente para HTTP 400 com o código de erro.`-32020`- Não.

运行测试命令:

```bash
cd phases/11-llm-engineering/14-model-context-protocol
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

## 交付物

本课交付 `outputs/skill-mcp-server-designer.md` Pode transformar um determinado domínio de negócios em um esquema de estrutura em conformidade com as normas modernas de MCP sem estado, abrangendo a descoberta de acordos, dados por pedido, lista de cache de determinação, expressos estados de controle, estratégias de transferência e aprovação.

## Continuar a aprofundar o MCP

Esta aula é para você estabelecer um acordo unificado. Na Fase 13, os quatro seguintes estágios básicos de progressão abrangerão as fronteiras de produção mais rigorosas:

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md)O programa de gestão de dados é um conjunto de informações e informações que podem ser utilizadas para a gestão de dados.
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md)O processo de reestruturação da empresa é um processo de reestruturação e de reestruturação.
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md)O que é o "programa de identificação" é um documento de identificação de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um produto ou de um outro?
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)O documento de identificação da empresa é publicado em 31 de janeiro de 2015.

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
