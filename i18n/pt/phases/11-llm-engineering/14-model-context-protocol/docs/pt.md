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
3. **Prompts（提示模板）**Modelo de estruturação de uso replicável, para Host 展现给用户──

Host indica AI  aplicativos。 Um cliente MCP dentro do host e um servidor 通信。 Layer de transmissão é responsável por transportar JSON-RPC 报文。

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

无状态绝对不意味着应用无法保持业务状态――它只意味着状态不再隐藏在底层MCP 连接或 连接或 连接或 连接或 连接`Mcp-Session-Id` Se o fluxo de trabalho precisa de transmissão de dados, o servidor gerou um controle de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de

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

O cliente também pode usar diretamente o método de negócios e processar as versões erradas, mas o uso de descoberta pode tornar a capacidade de exibição e negociação de versões mais transparentes.`UnsupportedProtocolVersionError`, erro código `-32022` Os dados incluem `supported`(Server 支持的修订版数组) com`requested`(被拒绝的修订版) (em inglês)

Em estúdio 模式下,双时代(double-era) Cliente uso `server/discover`发起探测──发现成功或收到 `UnsupportedProtocolVersionError`等 já identificados modernos erros, 均证明对方为现代服务器; 唯有非现代错误或超时才允许回到2025-11-25 的旧版`initialize`握手──Legacy 行为仅作为兼容补偿,绝不是现代默认──

### 显式的结果结构

2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `resultType`- Não .

- `complete`O que significa que a operação já está completa?
- `input_required`O servidor precisa passar por um modelo de pedido de várias rotas (MRTR) para enviar um suplemento de interação.`tools/call`- Não.`resources/read`Ou `prompts/get`返回此类型──

O cliente 必須将缺少 `resultType`A versão anterior deve ser completada.

O servidor deve ser em cada resultado.`_meta`Contém`io.modelcontextprotocol/serverInfo` Esta identidade é declarada por servidor, apenas para demonstração, não pode ser utilizada como base de decisão de segurança.

Lista e resultados da leitura`ttlMs`(mil segundos de vida) e `cacheScope`(缓存范围) ―― determinação `tools/list`排序加上新鲜度提示,使客户端能够安全缓存服务发现结果,并提升模型 Prompt Cache 的稳定性──`cacheScope: public`允许跨上下文共享缓存,`private`则严格限制发起请求的私有上下文内──

### Formato de cabo e camadas de transmissão

MCP em estúdio ou Streamable HTTP 上运行 JSON-RPC 2.0:

- Peço:`jsonrpc`- Não.`id`- Não.`method`和 `params`- Não.
- 响应(Resposta): contém相匹配 `id`E também`result`Ou `error`- Não.
- 通知(notificação):无 `id`Não precisa de qualquer resposta.

现代 Streamable HTTP 暴露单个仅接受 POST的端点──每个 JSON-RPC 消息应应应一次独立的 POST──请求 POST 接收单个 JSON对象,或接收以最终响应结尾的请求作用域 SSE 流──被接受通知 POST 返回无响应体的 HTTP 202──本核心修订版未定义任何通过 Streamable HTTP 客户端发送到服务器的通知──

2026-07-28 规范中**不存在**独立的 MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`Ou baseado em`Last-Event-ID`O período de transição é de um período de transição.`subscriptions/listen`POST Por favor, seu resposta manter a ligação SSE 流開──

### 无需 Server 发起请求的客户端 输入

旧修订版允许 Server 通过流发送 `sampling/createMessage`- Não.`roots/list`Ou `elicitation/create`之类的请求──当前协议改用多轮往返请求(MRTR)──符合条件的工具 调用、资源读取或快速 获取会回归 `resultType: input_required`,并至少携带 `inputRequests`Ou `requestState`之一──Client 收集所需输入, use new JSON-RPC ID 和对应的 `inputResponses`重试原始方法;若提供了 `requestState`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,`inputRequests`, Reprovar o tempo`inputResponses`- Não.

Roots、Sampling and Logging  ainda pode ser usado mas já foi abandonado, nova realização não deve adotar-los── Roots ou Sampling existentes `inputRequests`Na transmissão, absolutamente não como um servidor independente para o cliente JSON-RPC solicitações.

```figure
mcp-nxm-collapse
```

## 动手构建

### 步骤 1: registrar o servidor 表面

Apesar de o pedido de inscrição ter mudado, o modo de inscrição continua simples:

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

`code/main.py`O implementador completo também registrou um recurso e um prompt. Ele planeja apenas usar a biblioteca de padrões, para que você possa ver cada estrutura de encomenda, em vez de entregar os detalhes do protocolo ao SDK.

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

Não coloque apenas esses dados como existindo entre os objetos conectados. O servidor irá testá-lo em cada pedido.

### 步骤 3: ((可选) Primeiro encontrar re列出

调用 `server/discover`, escolher uma versão apoiada, e depois utilizar `tools/list`Se já sabes a versão não pode ser tratada.`-32022`, direct调用 `tools/list`É legal.

演示按名称顺序返回工具列表,并附带 `ttlMs`- Não.`cacheScope`- Não.`resultType`Com o servidor como um instrumento, o resultado é completo, mas não pode ser armazenado, pois a sua saída pode depender do estado atual.

### 步骤 4: fazer o mesmo pedido mapeado para HTTP

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `tools/call`POST  transportar imagem JSON-RPC Peliculação de requisição:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

`MCP-Protocol-Version`As petições devem ser`_meta`Classificação:`Mcp-Method`Em cada JSON-RPC, as solicitações são necessárias e devem ser incluídas.`method`Uma vez.`Mcp-Name` apenas `tools/call`- Não.`resources/read`Com`prompts/get`时必填,且必须与工具名、资源 URI或提示名一致. 时必填请求头或不一致时,返回 HTTP 400与 `HeaderMismatch`错误码 `-32020`- Não.

### 步骤 5: Implementar segurança fora do estado de acordo

- Em cada HTTP Solicitações de Licenciamento e Audiência
- 本地 Server  ligado ao local host, e em Streamable HTTP 上校验 `Origin`- Não.
- - Não .`destructiveHint: true`标记会修改状态的工具,并要求主持人 审批──
- 显式传递目录与文件范围, em vez de depender de raízes abandonadas.
- O recurso e a ferramenta de saída são considerados dados incríveis.
- Estúdio 下 stdout 专用于 JSON-RPC; diagnóstico informações

## 动手实践

Em curso:

```bash
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

Primeiro, o relatório de exportação deve ser concluído no acordo.`2026-07-28`Descobri-o .`demo-server`Então, olha.`MCPClient.request`É para cada mudança reconstrução.`_meta`◊ Mover dados de um pedido, observar o servidor  rejeitá-lo ◊

## 交付物

本课交付 `outputs/skill-mcp-server-designer.md` Pode transformar um domínio de negócios em um MCP de design sem estado.

## Continuar a aprofundar o MCP

Esta aula é para você construir um modelo de acordo. Fase 13 irá dividir as quatro fronteiras de produção em seus respectivos cursos independentes de construção e verificação:

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md)O programa de entrada de dados é o principal programa de entrada de dados, que inclui:
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md)O processo de reestruturação da empresa é um processo de reestruturação e de reestruturação.
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md)O processo de registro de dados e de dados de dados é o seguinte:
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)O documento foi publicado em 31 de janeiro de 2012 e foi publicado em 31 de janeiro de 2012 no jornal "The Guardian".

Quando o servidor atravessar uma equipe ou uma fronteira de confiança, por favor, aprenda-as em ordem.

##                                                                                                                                                                                                                                                               

1. - Adicione um .`subtract`工具,确认 `tools/list`Ainda por ordem de letras
2. 移除 protocol-version 键,验证返回 Params inválido(`-32602`)¬ e depois enviado em formato de versão válida mas não suportada `2025-11-25`,验证返回 `-32022`, confirmam`requested`A revisão foi publicada em 17 de janeiro de 2012.`supported`中选择版本──
3. Para criar operações adicionadas por servidor gerado de `draftId`,并要求更新操作把它作为参数传入.
4. 让一个需要用户确认的工具返回 `input_required` Usar um novo ID ∞`inputResponses`条目和原样  条目 e origem`requestState`重试原始调用, em vez de construir um servidor para o cliente de JSON-RPC solicitação.
5. design a binary time studio Client 草图:把结果或已识别的现代错误视为现代对端, apenas em caso de encontrar erros indescritíveis ou ultraperiódios que permitem retornar `initialize`- Não.

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
