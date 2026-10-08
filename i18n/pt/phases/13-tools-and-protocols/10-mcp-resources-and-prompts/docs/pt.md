# MCP Resource 与 Prompt:无状态 Server 的可寻址上下文

> Ferramenta utilizada para executar operações. Recursos utilizados para exposição de conteúdo. Pronto usado para envelope de mensagens de escolha do usuário. Um excelente servidor MCP manterá esses acordos claramente separados e com previsão.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07 (Building an MCP Server), Phase 13, Lesson 09 (MCP Transports)
**Time:** ~60 minutes

## Objectivo de aprendizagem

- 根据用户意图在工具、资源和快点之间做出正确选择──
- 通过强制要求的  através de requisitos obrigatórios`server/discover`声明 resource 与 prompt capability 接口──
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `resources/list`Com`prompts/list`返回结果──
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `ttlMs`Com`cacheScope`, evitar a divulgação de dados de utilizadores específicos.
- 遇到无效或未知资源 URI 时返回 JSON-RPC 错误 `-32602`- Não.
- - Não .`subscriptions/listen`POST 响应流,并通过订阅 ID 关联每个事件──
- O recurso content e prompt 模板一律视为不可信的服务器 输出──

## Descarga do usuário

滥用MCP, o modo mais fácil é directamente de implementar o código. A consulta de base de dados porque a função de imagem é feita como ferramenta; o fluxo de trabalho pode ser usado porque é armazenado em um arquivo é feito como recurso; o host pode ser injectado e transformado em estratégia oculta.

Por favor, primeiro, escolha quem vai escolher e o que eles esperam que saia.

| Primitive | 主要意图 | 选择主体 | 典型结果 |
|---|---|---|---|
| Tool | 执行某项操作 | Model 或应用程序 | 结构化动作结果 |
| Resource | 读取特定 URI 的内容 | Host、应用程序或用户 | 文本或二进制内容 |
| Prompt | 启动可复用的消息工作流 | 用户（通过 Host UI） | 一条或多条 prompt 消息 |

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `notes://note-1`O anoteiro é um recurso, pois é o conteúdo que pode ser encontrado.`delete_note`É uma ferramenta, porque vai mudar de estado.`review_note`É um rápido, porque é o usuário que seleciona o processo de auditoria pré-configurado.

Não apenas para parecer funcional e expor a mesma operação ao mesmo tempo para os três. Para cada aumento de superfície, é necessário extra descoberta, autorização, armazenamento, errores de tratamento, teste e custo de manutenção de arquivos.

## 2026-07-28 无状态信封

本课针对 MCP 协议版本 `2026-07-28` Nesta configuração, não há aperto de mão de inicialização (initialisation handshake) ou sessão de protocolo (accord meeting)  Cada pedido está reservado `_meta`键中携带其协议版本和客户端功能──

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

Servidor  deve ser implementado `server/discover` Resultados de seu retorno à versão externa de declarações suportadas  recursos e recursos de prompt capacidades  implementação de identificação e cache de sugestões  dicas de cache)  Cliente pode usar diretamente o seu método, mas a descoberta  permite que o cliente  obtenha um rápido e estável acesso 

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "resources": {"listChanged": true, "subscribe": true},
    "prompts": {"listChanged": true}
  },
  "ttlMs": 3600000,
  "cacheScope": "public"
}
```

常规结果会声明 `"resultType": "complete"`◊ Responder `_meta`- Não .`io.modelcontextprotocol/serverInfo`标识服务端的实现信息── essa informação é utilizada para diagnóstico, não é um certificado de identificação── carrega não suportada versão do protocolo de solicitações retornará `-32022`错误, simultâneamente com a versão de pedido e o servidor 支持的版本列表──

无状态契约会重塑你的设计直觉―― lista de consulta não pode depender de um único link sobre o anterior de调用历史―― reconhecimento de direito de certificado como pedido de entrada pode alterar o conjunto visível de volta, mas o link histórico não pode afetar o resultado――

## Recursos é estável URI 契约

O recurso é o conteúdo identificado pela URI.

As características de um URI de boa qualidade:

-  suficientemente estável, pode ser entregue em um formulário ou entre várias solicitações
- 划分在服务器的专有命名空间 (nomen espaço) 下。
- Independente do ID de processo específico ou da ligação.
- Antes de visitar o armazém, antes de experimentar o armazém.
- Cada vez que o estudante se encontra em situação de risco, é preciso que o autor do documento seja autorizado a fazer o mesmo.

`notes://note-1`优于                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `note-1`O servidor de arquivos pode ser usado.`file://`URI, mas após os links de código de resolução e os rotos relativos, é necessário verificar rigorosamente a configuração do seu cadastro.

`resources/list`返回调用方当前可见的资源──必需按照稳定键 (por exemplo, URI)排序──确定性的顺序可以防止缓存震荡击穿 (cache misses) 、快照漂移以及主机UI在刷新时发生跳动──

```json
{
  "resultType": "complete",
  "resources": [
    {
      "uri": "notes://note-1",
      "name": "Architecture decision",
      "description": "Why the service uses a stateless boundary",
      "mimeType": "text/markdown"
    }
  ],
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

`resources/read`返回一个或多内容项──未知URI 不代表读取成功但内容为空──当前资源规范将无效或未知资源URI 归类为 JSON-RPC 无效参数,错误码为`-32602`- Não.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "Unknown or invalid resource URI",
    "data": {
      "uri": "notes://missing"
    }
  }
}
```

Esta distinção permite que o cliente possa claramente identificar que os recursos não existem com documentos vazios válidos, e também evita que o regresso acidental para uma ampla pesquisa.

### Ressource 模板

O modelo de recurso é usado para descrever um URI com parâmetros. Quando todos os itens específicos têm custos excessivos ou quantidade infinita, deve ser usado o modelo.`notes://projects/{project}/decisions/{decision}` informar o cliente  como construir um endereço válido, sem necessidade de uma lista única de todas as decisões 

模板 não significa simplificar a pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 解析变量. 执行识权. 强制长度和字符限制. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em pesquisa. 模板 não significa flexibilidade em executar os dados. 模板 não significa que você precisa usar o tipo de um padrão de tempo para criar um padrão de dados.

### 内容并非可信指令 (conteúdo não é acreditável)

O recurso 文本可能包含即时注入、密钥、误导性命令或恶意格式的标记──Host 应保留来源追踪 (来源追踪) 来源来源来源来源),并将资源 内容一律视为数据──Server 应限制内容大小、返回准确的MIME 类型、脱敏调用方无权访问的字段,并避免返回无关记录──

## Pronto é um padrão de controle do usuário

MCP prompt 专为用户显式选择而设计──Host pode colocá-los em ordem curva (slash commands) 、菜单项或工作流按──协议本身不限制某一特定 UI表现形式──

Para o mesmo direito de identificação,`prompts/list`O resultado deve ser determinado. Cada prompt precisa de um nome e descrição úteis, bem como de um host em uso.`prompts/get`之前收集输入的参数声明──

```json
{
  "resultType": "complete",
  "prompts": [
    {
      "name": "review_note",
      "title": "Review a note",
      "description": "Review one note for a named concern",
      "arguments": [
        {
          "name": "uri",
          "description": "The note resource URI",
          "required": true
        }
      ]
    }
  ],
  "ttlMs": 600000,
  "cacheScope": "public"
}
```

`prompts/get`O host tem o direito de decidir como a mensagem de retorno entra no modelo e mantém sua estratégia de confiança com maior prioridade.

Em servidor 边界处严格校验提示 参数。Prompt 中引用的 URI 必须通过与直接读取资源 相同的识别权检查──切勿让提示 成为绕过资源 访问控制的侧信道──

## 缓存提示是正确性的一部分

`ttlMs`Informar o cliente que o resultado pode ser usado de novo por muito tempo.`cacheScope`Descriu quem pode compartilhar este valor de reserva.

| 范围 | 含义 | 典型用途 |
|---|---|---|
| `public` | 在鉴权许可的前提下可在多用户间复用 | 公共 prompt 目录 |
| `private` | 绑定到请求发起用户或凭证上下文 | 用户名下的私有笔记内容 |

Dependendo da frequência de mudança dos dados e do dano que o passado pode causar, é possível escolher o TTL.

MCP 规范中 `cacheScope`O valor válido é definido.`public`和 `private` Para os resultados que contenham segredos sensíveis ou que mudam muito frequentemente, deve-se devolver `cacheScope: "private"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `ttlMs: 0`, em seguida, aplicou-se a regras mais rigorosas de não-locação no lado do host ⋅`no-store`Não está na MCP 规范中`cacheScope`取值──

缓存提示永远不能代替鉴权――缓存键必须包含所有影响可见性的请求维度,包括租户(tenant)、用户、权限范围(scope)、语言区域(local) 以及分页游标标(pagination cursor)―如果共享缓存无法安全表达这些维度,请使用`private`配合 0 TTL, e implementar no nível host  no-store 策略──

## 订阅 Usar o cliente lançamento de resposta fluxo

O modelo moderno de subscrição substituiu o original.`resources/subscribe`RPC e a versão antiga baseada em HTTP GET.

Cliente em forma de pedido enviado JSON-RPC`subscriptions/listen` Em nível de transmissão HTTP, é um POST Petição, seu HTTP  Response manter estado aberto como SSE(Server-Sent Events) 流──`notifications`Objecto é um branco listação. Servidor 绝不能发送未经请求的通知类型.

```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "subscriptions/listen",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    },
    "notifications": {
      "resourcesListChanged": true,
      "promptsListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

Pergunte ID mesmo para o ID de subscrição. Antes de qualquer evento, o servidor irá enviar.`notifications/subscriptions/acknowledged`Notificação. Entre as condições de uso, apenas contém um servidor.

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "notifications": {
      "resourcesListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

Todos os eventos do processo posterior têm os mesmos dados:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "uri": "notes://note-1"
  }
}
```

通知表明资源 已发生变更──Client 在当前的鉴定权约束下通过 `resources/read`重新读取该资源──Client 不应假设通知事件本身就包含最新文档内容──

Multiplásticos subscritores podem compartilhar a mesma informação através do estúdio.`resultType: "complete"`Responder.

切勿将订阅流当作协议会话 (protóculo sessão) 使用──后续的读取操作仍然是完整的独立请求,能够路由至任何健康的服务器 实例──

```figure
t3-primitive-sort
```

## 交互式实验

Utilize o gráfico para realizar cinco capacidades no sistema de rastreamento de projetos: problema detalhe (details de problema)  criar problemas (crear problemas)  criar problemas (review template)  estratégia de regulamentação do projeto (closure issue)  decidir quais são as listas que podem ser abertas para caixas públicas, quais são as leituras que devem ser mantidas privadas e quais são os recursos que devem ser disponibilizados para novas notificações 

Em cada uma das categorias, define o seu objeto de seleção. Se for executado pelo modelo, use a ferramenta. Se for executado pelo host, use o recurso.

## 动手实验

Em depósito em base de dados:

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

按以下顺序检查交互记录(transcrição):

1. 确认 `server/discover`☐ A Comissão Europeia adota o acordo de cooperação entre os Estados-Membros.
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `resultType: "complete"`- Não.
3. A lista de confirmação e os resultados de leitura foram apresentados com um cache de sugestões correspondente à expectativa.
4. 将读取的 URI 改为 `notes://missing`E observar o retorno.`-32602`错误―― não é verdade.
5. 确认订阅 确认通知先于资源 更新事件发发出──
6. 确认事件与平稳关闭均携带订阅 ID `5`- Não.

O modelo Python não abre a verdadeira ligação HTTP. Ele simula o SDK.

## 交付产物

`outputs/skill-primitive-splitter.md`É um guia de revisão de design de seleção reutilizável para uso primitivo do MCP.

本课还附带 `assets/primitive-split.svg`, forneceu uma análise estática primitiva e de subscrição para o aprendizado offline.

## Verifique-o

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果: principal programa de saída JSON 交互记录, test order report pelo menos 12 passados test use cases。

## Capstone 连接

Quando o seu servidor de capstone, além de ação, também expõe conhecimento de localização, por favor, aplique este acordo. Deve conter um catálogo de determinação, um rápido fotos, um recurso autorizado, um rápido resumo, um rápido resumo, um caso de URI e um registro de intercâmbio.

Seu certificado de teste deve ser capaz de provar que qualquer lista não depende da história de ligação e que os eventos de subscrição nunca irão divulgar o direito de acesso ao recurso de base a terceiros não autorizados.

## 课后练习

1. - Adicione um .`notes://projects/{project}/notes/{id}`recurso 模板,并对两个变量进行验证――
2. Por`resources/list`添加分页支持, ao mesmo tempo em que mantém a determinação do ranking.
3. Para um recurso .`cacheScope: "private"`且 `ttlMs: 0`, aumentar o nível de hospedagem  no-store  estratégia,并解释支 these two control measures threat model──
4. 添加 prompt 列表变更订阅,并证明当过条件省略 `promptsListChanged`Não vai enviar qualquer coisa.
5. Criar duas assinaturas, e provar que cada evento tem o ID de pedido correto.
6. Por exemplo, o sistema de leitura de dados não pode ser usado para fazer a leitura de dados.

## 关键术语

- **Resource：**MCP servidor 暴露的、通过 URI 寻址的内容──
- **Prompt：**MCP servidor 暴露的、由用户控制的消息模板──
- **确定性列表（Deterministic list）：**针对 the same request input, its members and order keep stable discovery △ resultados △
- **`ttlMs`：**缓存新鲜度持续时间 (mm)
- **`cacheScope`：**缓存结果的共享边界(`public`Ou `private`)。
- **`subscriptions/listen`：**Uma solicitação de longo ciclo de vida, a qual é respondida em conformidade com o aviso de entrega de condições.
- **Subscription ID（订阅 ID）：**Original ouça Pedido de identificação, em notificação de dados
- **无效参数（Invalid parameters）：**JSON-RPC  err err err err err `-32602`, para utilização de recursos URI inefetivos ou desconhecidos.
- **不支持的协议版本（Unsupported protocol version）：**JSON-RPC  err err err err err `-32022`, contendo`supported`Com`requested`版本列表──
- **`server/discover`：**强制要求的服务器 方法,返回支持的版本、能力、服务身份识别及可选的缓存提示──

## 延伸阅读

- [MCP 2026-07-28 Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP 2026-07-28 Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP 2026-07-28 Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)
