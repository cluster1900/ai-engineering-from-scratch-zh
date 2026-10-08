# MCP 基础: requisito sem estado com JSON-RPC

> O MCP moderno não tem mãos dadas nem acordo. Cada pedido tem de ser realizado de forma independente, com dados suficientes para poder ser analisado, autorizado, conduzido e reatendido.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 01 至 05（Tool 接口与函数调用）
**Time:** ~55 分钟

## Objectivo de aprendizagem

- 区分 MCP's Server 原语(primitivos) com o cliente 端特性的差异──
- Por MCP `2026-07-28`规范构建合规的 JSON-RPC 2.0 Pelicitações e respostas Envelope
- Em cada pedido de acordo adicional Número de declaração de capacidade do cliente Capacidades e Identidade do cliente
- Utilização `server/discover`Não é tratada`UnsupportedProtocolVersionError`Não é preciso que haja uma mão de obra.
-  completa acompanhamento de um único pedido independente de experiência de dados de origem até o retorno do resultado ciclo de vida 

## 问题背景

No mesmo processo de execução ou no HTTP Worker, o servidor MCP pode receber continuamente duas solicitações de diferentes clientes, com diferentes capacidades. Se o servidor lembrar ou depender da declaração de uma solicitação, encontrará regras de aplicação de permissões erradas, ou retornará a estrutura de reportagem incompatível.

MCP `2026-07-28`规范 eliminou completamente esta diferença:**协议核心完全无状态**O servidor deve decidir como processar a solicitação em curso, dependendo apenas da sua própria solicitação, e não depende absolutamente do histórico da ligação.

Isso mudou completamente o modelo de mente. A ordem dos tempos antigos era: primeiro estabelecer ligação, depois executar a mão, finalmente iniciar a operação de negócios.

1. Cliente 发送一个完全自描述的独立请求──
2. Server 校验该请求携带的协议版本和客户端能力──
3. Servidor 处理对应的方法──
4. Servidor 返回带类型标识的结果(tipped result) ou JSON-RPC 错误──

O próximo pedido vai começar a repetir este processo completo a partir de zero.

## 核心概念

### Servidor 原语(Servidor primitivos)

MCP Server 暴露三个核心原语:

1. **Tools（工具）**Por exemplo, a "Modeli-Driven Operations" é uma forma de "Modeli-Driven Operations" que é uma forma de "Modeli-Driven Operations" (Modeli-Driven Operations).`tools/list`发现并由 `tools/call`- Não.
2. **Resources（资源）**: segundo URI 寻址的数据,通过 `resources/list`发现并由 `resources/read`- Não.
3. **Prompts（提示模板）**: cócopa utilizable模板, através `prompts/list`发现并由 `prompts/get`- Não.

Raízes, amostragem e logging`2026-07-28`模式中为了兼容性予保留,但已被明确标记为废弃 (废弃) ⋅ Em toda a nova implementação, deve utilizar aparentemente Tool ou Resource 输入替代 Roots, usar diretamente modelo fornecedor API 替代 Sampling, usar stderr ou OpenTelemetry 替代 Logging。Elicitação 则通过多轮请求(Multi Round-Trip Requests, MRTR) 保持可用,其中 Server 返回输入请求,Client 完成输入后重新启动原始操作。现代 Server 绝不主动发起独立的 JSON-RPC 请求──

### Envelopes JSON-RPC

MCP 底层 usando JSON-RPC 2.0:

- Peço:`{jsonrpc, id, method, params}`
- 响应(Resposta):`{jsonrpc, id, result}`Ou `{jsonrpc, id, error}`
- 通知(Notificação):`{jsonrpc, method, params}`, não `id`字段

Em petição`id` só para relações individuais, não criará nenhuma sessão de nível de acordo

### necessariamente de requisição de dados

Cada pedido moderno está lá.`params`- Não .`_meta`Objecto:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/list",
  "params": {
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

协议版本号(`protocolVersion`) e capacidade do cliente`clientCapabilities`O cliente é obrigatório.`clientInfo`) para recomendações, pertencem a informação de auto-exposição e de reformulação, não podem ser consideradas como justificativas de segurança.

Servidor  strictly banned de anterior requisites studio  process environment HTTP  connection or transmission layer requisites 头中单独推断这些元数据──

### 完整结果与 Server Personalidade

Cada sucesso moderno tem resultados.`resultType`◊ resultados finais de uso `"complete"`O servidor também deve declarar sua identidade nos resultados dos dados:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "tools": [],
    "ttlMs": 30000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "notes-server",
        "version": "1.0.0"
      }
    }
  }
}
```

`tools/list`- Não.`resources/list`- Não.`prompts/list`- Não.`resources/templates/list`- Não.`resources/read`E também`server/discover`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `ttlMs`(mil segundos de vida) e `cacheScope`(缓存范围) ∼ segurança de默认值是 `ttlMs: 0`和 `cacheScope: "private"` As categorias dos resultados da lista devem adotar uma ordem determinista, para garantir que a resposta de preços iguais possa gerar um caixe de dados e um modelo de acordo.

### 无握手的服务发现(Descoberta sem aperto de mão)

Cada servidor moderno deve ser implementado .`server/discover`O cliente pode utilizar o método de negócio para obter:

- `supportedVersions`:Server 支持的协议版本列表
- `capabilities`:Server  fornecimento de capacidade字典
- Nota de utilização`instructions`)
- Resultados`_meta`Identificação de Servidor Central
- 缓存提示`ttlMs`和 `cacheScope`)

Serviço muito útil, mas não é um pré-requisito de visita.`tools/list`Como primeira solicitação, pois a solicitação já carrega a versão do protocolo e a capacidade do cliente.

Se a versão do pedido não for suportada, o servidor retornará JSON-RPC  erro código `-32022`Não contém dados:

```json
{
  "requested": "2027-01-01",
  "supported": ["2026-07-28"]
}
```

Cliente  escolher a versão moderna do protocolo que os dois países apoiam em conjunto, e usar o novo JSON-RPC Petição ID  realizar um novo teste.

### 单次请求的完整生命周期

Peça rigorosamente em conformidade com a seguinte ordem de acompanhamento:

1. 解析单个 JSON-RPC Envelope──
2. 校验 `jsonrpc`字段为 `"2.0"`, existem`id`- Não .`method`Por isso, não me esqueça.`params`Para o objeto.
3. 校验 `params._meta`Contém versões de caracteres e capacidades; se o código de dados estiver perdido ou está em formato ilegal, retorne o erro código `-32602`- Não.
4. Na fronteira HTTP, comparação entre o nome da versão do protocolo, o método e o nome do correspondente.`-32020`(mesmo que um dos valores de versão não seja suportado)
5. Em Conformidade de Conformidade, se a versão do pedido for suportada mas o servidor não for compatível, retorne.`-32022`- Não.
6. - Inspecção de capacidade necessária, e depois de acordo.`method`路由并校验方法专有参数──
7. Em concreto Gestor 执行前完成认证 (autenticação)
8. 返回带有 Server 身份信息的完整结果(resultado completo)。
9. 立即遗忘当前请求作用域的协议元数据──

Esta ordem rigorosa pode criar discordância entre componentes e diferentes tipos de uso.`Mcp-Name: notes.read`Ao mesmo tempo, por fonte de execução`params.name: notes.delete` Também permite que as informações de entrada, de entrada, de tradução, de negociação, de falta de competência, de autorização e de falha do administrador se tornem provas de diagnóstico mutuamente diferenciadas.

关闭 stdin 关闭 HTTP 响应连接 关闭 HTTP 响应连接 关闭 关闭 HTTP 响应连接 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关闭 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关 关

### 显式 Legacy 兼容

`2025-11-25`及早版本依赖                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `initialize`- Não.`notifications/initialized`、 Conexão de ligações Capacidades, bem como em sessões opcionais em HTTP Streamable inicialmente.

Mas é necessário separar completamente os dois tempos. As solicitações modernas são obrigadas a identificar os dados de cada solicitação; a conexão da versão antiga só pode ser selecionada através de um caminho de regresso especificado no arquivo.**绝不能把 `initialize` 当作连接 `2026-07-28` Server 的默认行为。**

```figure
mcp-tool-call
```

## 动手实践

`code/main.py`Em um contexto de não dependência de qualquer quadro, a construção, a experimentação e o seguimento de normas são baseadas em ordem de execução:

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Em output no重点观察三个关键不变量(Invariantes):

- Cada pedido é completo .`_meta`- Não.
- Cada resultado bem sucedido contém`resultType: "complete"`Não contém identificação de servidor.
- 列表结果具有严格确定性的排序,并附带显式的缓存提示 (TTL 和 Cache Scope)

## 交付物

本课交付 `outputs/skill-mcp-handshake-tracer.md` embora tenha guardado o nome do documento histórico, este artefato é agora um rastreador de solicitações sem estado (http://www.stateless request tracer.com/) .

##                                                                                                                                                                                                                                                               

1. Vai fazer um pedido de acordo com a versão modificada para `2027-01-01`❖ Identificar erros`-32022`, e retornar dados 字段中正确广播了支持版本列表──
2. De um segundo pedido de transferência`io.modelcontextprotocol/clientCapabilities` Confirmar que o servidor não vai utilizar a capacidade de declarar na primeira solicitação.
3. 颠倒内存中的工具注册表顺序── confirmação `tools/list`输出 ainda mantém a mesma ordem de determinação.
4. - Não .`cacheScope`De`public`修改为 `private` Explique em duas situações que permitem que os poderes que lhe são concedidos sejam utilizados de forma diferente.
5. 编写一个省略 `clientInfo`O pedido de confirmação continua válido, pois a identificação do cliente é apenas para recomendações e não para obrigações.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 无状态协议 (Stateless protocol) | 每一个请求都自包含解析它所需的完整元数据 |
| 请求元数据 (Request metadata) | 在 `params._meta` 中携带的协议版本、Client 能力声明及推荐的 Client 身份 |
| `server/discover` | 强制实现的 Server 方法，用于声明支持版本、能力、使用说明及身份 |
| `resultType` | 每个现代成功结果上的类型鉴别字段（如 `"complete"`） |
| 可缓存结果 (Cacheable result) | 必须包含 `ttlMs` 与 `cacheScope` 提示的查询或列表结果 |
| 协议时代 (Protocol era) | 现代基于每次请求元数据的模式，或旧版连接作用域初始化的模式 |
| 传输生命周期 (Transport lifetime) | 进程、连接或响应流的物理生存周期，不等同于协议 Session |
| `-32022` | 不支持的协议版本错误码，返回请求的版本及支持的版本列表 |

## 延伸阅读

- [MCP Architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture)
- [MCP Base Protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
