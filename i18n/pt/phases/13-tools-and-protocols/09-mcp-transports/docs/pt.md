# MCP 传输层:studio com estado sem streaming HTTP

> O nível de transmissão é responsável por carregar o MCP, mas não fornece um estado de acordo ausente.`2026-07-28`规范中,本地工作室与远程流媒体 HTTP 均承载完全自描述的独立请求──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 与 08（构建 MCP Server 与 Client）
**Time:** ~65 分钟

## Objectivo de aprendizagem

- Por causa do processo selecionar estúdio, por causa do serviço de rede selecionar HTTP Streamable.
- 实现现代单端点、纯 POST(POST-only) do Streamable HTTP 传输协议。
- 镜像并校验 MCP 版本号、方法名与 Name 要求头与 JSON-RPC 消息体的一致性──
- O período de transição entre o período de transição e o período de transição é de um período de transição.`subscriptions/listen`- Não, não.
- 迁移基于 Session 和早期 HTTP+SSE 的部署,杜绝将 Legacy 行为错当现代规范呈现──

## 问题背景

早期的流通 HTTP 修订版将协议协商与底层的连接和会议 绑定混为一谈――Server 可以发发`Mcp-Session-Id`、 exposição independente de GET 推送流、 aceitar DELETE `Last-Event-ID`恢复 SSE 断点──

MCP `2026-07-28`A partir da linha de rede, estes mecanismos foram completamente removidos. Qualquer solicitação pode ser distribuída para qualquer trabalhador saudável, pois a versão do protocolo e a capacidade do cliente estão totalmente encobertas no corpo de solicitação.

O sistema construído deste modo possui uma capacidade de expansão horizontal mais forte e um melhor conhecimento de controle. Isto também significa que, se continuarmos a tornar a camada de transmissão de 2025 o padrão atual, haverá um modelo de erro e segurança para a introdução.

## 核心概念

### estúdio 模式

stdio 绑定专用于 启动客户端本地子进程:

- Cliente Cada passo para o stdin 写入一条 UTF-8 编码的 JSON-RPC 消息──
- Servidor Cada passo para o stdout 写入一条 UTF-8 编码的 JSON-RPC 消息──
- O servidor irá enviar todas as informações de diagnóstico para o seu site.
- Quando o servidor recebe o EOF, ele deve sair rapidamente.
- Cada pedido moderno está em`params._meta`Por exemplo, a versão de "Capacidade" é uma versão de "Capacidade".

 Processos de vida ciclo pertence ao ciclo de vida de transmissão física, absolutamente não é moderno Protocolo Sessão.

### 2026-07-28 HTTP Streamable em meio

现代 Server 暴露一个单一的 MCP 端点(如 `/mcp`), e apenas aceitar POST Pêxito

Cada pedido ou notificação JSON-RPC, tudo é um novo HTTP POST.

Para o pedido recebido, o servidor retorna a um dos seguintes:

- `Content-Type: application/json`: retornar a resposta JSON-RPC;
- `Content-Type: text/event-stream`Retorno: Evento de notificação relacionado com a solicitação, finalmente seguido da resposta final JSON-RPC ⋅

Para receber notificações, o servidor retorna sem resposta.`202 Accepted`- Não.

O cliente em seu pedido declara simultaneamente estes dois tipos de resposta:

```http
Accept: application/json, text/event-stream
```

### 纯 POST(POST-only)

现代 Streamable HTTP não existe GET 推送端点, também não existe DELETE Session 端点:

- `GET /mcp` direct return `405 Method Not Allowed`- Não.
- `DELETE /mcp` direct return `405 Method Not Allowed`- Não.
- `Mcp-Session-Id`直接被忽视,绝不生成,绝不回显.
- `Last-Event-ID`直接被忽视,因为现代流不支持断点重放续传.

Se o SSE do domínio de roteiro da solicitação estiver em contato com a resposta final, o Cliente poderá usar o novo ID JSON-RPC para fazer uma nova solicitação independente.

### 源站校验(Validação de origem)

Servidor em recepção de transmissão de ligação`Origin`Peliculação de teste de DNS (DNS)`403 Forbidden`── Não-browsador Cliente pode ser guardado `Origin`, as normas oficiais de transporte são permitidas.

本地开发 Server 应绑定到 `127.0.0.1`Não é?`0.0.0.0` Serviços de rede devem ser executados em cada pedido; o certificado de origem não pode substituir o certificado de identidade.

### necessária HTTP 元データ要求头

Cada moderno POST As petições incluem:

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

规则要求:

- `MCP-Protocol-Version` obrigatoriamente`params._meta.io.modelcontextprotocol/protocolVersion`完全一致──
- `Mcp-Method`必須與 JSON-RPC 的 `method`完全一致──
- `Mcp-Name`Em`tools/call`- Não.`resources/read`和 `prompts/get`时强制必填── Não é obrigatório.
- `Mcp-Name`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `params.name`(ou `resources/read`时的 `params.uri`)。
- Pequenação de valor de divisão

对于包含非ASCII或特殊字符的 `Mcp-Name`, usando padrão base64 formatos:

```text
=?base64?{Base64EncodedValue}?=
```

Qualquer falta de forma ou não coincidência com o pedido, retorne imediatamente ao HTTP.`400`Com o erro de código`-32020`◊ Se a versão do corpo concordar, mas o servidor não suporta essa versão, retorne HTTP `400`Com o erro de código`-32022`- Não.

### Solicitação de um espaço de acção de um período curto

O servidor pode utilizar SSE para um pedido único de tempo mais longo:

```text
POST tools/call id=41
  <- notifications/progress (针对 id=41)
  <- notifications/progress (针对 id=41)
  <- JSON-RPC response (id=41)
流关闭
```

O servidor 绝不能在这个流中主动向客户端发发起独立的 JSON-RPC 请求――关闭响应流即代表取消这个请求――

### 长周期变更推送:`subscriptions/listen`

变更通知必须通过客户主动发起的专业 POST Petição de abertura:

```json
{
  "jsonrpc": "2.0",
  "id": "listen-1",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true,
      "resourceSubscriptions": ["notes://note-1"]
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    }
  }
}
```

POST 响应是一个长连接 SSE 流──其首条协议消息为 `notifications/subscriptions/acknowledged` A notificação de confirmação  cada alteração posterior e o resultado final,`_meta`- Não .`io.modelcontextprotocol/subscriptionId`, e valor igual ao ID da solicitação de audição.`subscriptions/listen`Não pode recuperar dados que já mudaram.

### 显式应用层状态

移除协议 Session 绝对不意味着禁止有状态的工作流──Server pode gerar um imperfeito estado de comando (State Handle) e retornar a ele 结果中正常的工具──Client在后调中将该句柄作为显式参数传入──

O uso de um objeto de identificação é um processo de identificação e de identificação, que é um processo de identificação e de identificação.

```figure
tp-transport-handshake
```

## 动手实践

`code/main.py`仅使用Python 标准库实现一个小巧、合规的现代 Streamable HTTP Server:

```bash
cd code
python3 main.py --probe
python3 -m unittest discover tests -v
```

探针会依次检验:

- Illegal Origin 会被拒绝;
- Serviço desenvolvido sem ID de sessão
- 传入的  transmissão`Mcp-Session-Id`Com`Last-Event-ID`É um "paixão" ignorado.
- 头部与请求体不一致时返回                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   `-32020`O artigo 2.o
- 版本不支持时返回 `-32022` e sua lista de versões apoiadas;
- Receber de sem ID  Notificação Retorno HTTP `202`Air response;
- GET 和 DELETE Pelicitação de retorno directo para HTTP `405`O artigo 2.o
- `subscriptions/listen`建立长连接并携带对应的订阅 ID在通知中.

## 交付物

本课交付 `outputs/skill-mcp-transport-migrator.md` fornece orientações regulamentares para a remoção de protocolos passados`subscriptions/listen`替代裸 GET 流,并使 Legacy 适配层保持清晰独立──

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| stdio | 基于 Client 发起的子进程 stdin/stdout、以换行符分隔的 JSON-RPC 传输 |
| Streamable HTTP | 单一端点架构，其中每条现代消息均为一次全新的 HTTP POST 调用 |
| 请求作用域 SSE (Request-scoped SSE) | 针对单个请求的 POST 响应流，输出相关通知及最终响应后自动关闭 |
| `subscriptions/listen` | 客户端主动开启的长周期 POST 请求，用于接收选择订阅的变更通知 |
| 请求头不匹配 (Header mismatch) | 当镜像请求头与请求体内容不一致时，返回 HTTP 400 与 -32020 报错 |
| 源站校验 (Origin validation) | 针对传入网络连接的 DNS 重绑定防御机制，不能替代身份认证 |
| 显式状态句柄 (Explicit state handle) | 作为普通业务参数传递的应用层 Token，代替底层隐藏的传输连接状态 |
| Legacy 桥接层 (Legacy bridge) | 专门隔离保留的旧版本行为，仅用于向后兼容历史客户端 |

## 延伸阅读

- [MCP Transport Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
