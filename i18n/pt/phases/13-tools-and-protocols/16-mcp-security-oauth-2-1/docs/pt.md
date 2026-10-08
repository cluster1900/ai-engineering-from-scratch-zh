# MCP 鉴权与授权:CIMD、Emitente 绑定、PKCE 与权限提升(Step-Up)

> 远程MCP Solicitação é inestatal, mas seu poder é absolutamente anônimo.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 15 (security)
**Time:** ~90 minutes

## Objectivo de aprendizagem

- 通過受保护资源元数据 (Protected-Resource Metadata) 发现授权服务器 (Authorization Server) ⋅
-  prioritariamente a utilização do ID do cliente (CIMD), em vez de o registro do cliente (DCR)
- Em inévitable DCR 兼容路径时, declaração correta `application_type`- Não.
- 校验授权响应中的 `iss`参数,并根据签发者物理隔离凭证──
- 熟练运用 PKCE、资源指示符 (Indicatores de recursos) 受众验证 (Validation do público) 及增量 Scope (Câmpa de aumento)
- Em conformidade com as normas de 2026-07-28, em conformidade com o Regulamento (CE) n.o 2026-07-28, o MCP solicita:

## 问题

远程MCP server 可能会读取私有记录、向外部系统写入数据,或触发代价昂贵的运算──身份认证(Authentication)

- Qual servidor autorizado emitiu este diploma?
- O token é especificamente para qual MCP recursos é emitido?
- Qual cliente e qual URI redirecionado completaram este processo de autorização?
- 资源所有者 (资源所有者) 用户) especificamente aprovou quais operações?
- O pedido de precisão actual continua a cumprir o âmbito de aprovação do momento?

2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `application_type`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,

Estas regras de segurança são complementares ao protocolo central sem estado.`Mcp-Session-Id`- Não.

## 概念

### 明确三大核心角色

- **MCP Client（客户端）：**代表資源所有者发起请求──
- **MCP Resource Server（资源服务器）：**验证 Token Access 并提供 MCP 端点服务──
- **Authorization Server（授权服务器）：**认证资源所有者、收集用户同意并签发代币──

O servidor de recursos e o servidor de autorização podem ser operados pela mesma equipe, mas devem manter as funções de identificação e verificação dos dois totalmente independentes.

### 授权应用于 HTTP 传输层

MCP  Oficinação de regulamentação especificamente dirigida a base de HTTP de transmissão de camadas.

Para o transmissão HTTP de distância, é necessário em cada pedido `Authorization`头部中携带 Bearer Token──**绝不能**Colocar o token em um URL.

### Desde os recursos protegidos

资源服务器负责发布符合RFC 9728 规范的元数据:

```json
{
  "resource": "https://notes.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["notes:delete", "notes:read", "notes:write"]
}
```

客户端 de MCP 资源 URL sair, obter o documento de dados, escolher um servidor autorizado declarado, em seguida, recuperar o OAuth ou OpenID Connect do servidor autorizado 元データ──

Na construção de URLs bem conhecidas de RFC 9728, é necessário manter o caminho de recursos originais.`https://notes.example.com/mcp`,本课使用的标准路径为 `https://notes.example.com/.well-known/oauth-protected-resource/mcp`Se eu me desisti`/mcp`后,可能会错误地选到该域名下其他受保护资源的元数据──

Não acredite em erros de resposta do usuário fornecidos no servidor. O cliente deve manter uma estratégia de autorização do usuário de sua própria vontade.

### 验证授权服务器元数据

Os dados dos servidores de autorização devem ser expostos a todos os pontos e às características de controlo de segurança apoiadas:

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "code_challenge_methods_supported": ["S256"],
  "authorization_response_iss_parameter_supported": true,
  "client_id_metadata_document_supported": true
}
```

强制要求 PKCE 采用 S256 算法──完整记录签发者(issuer)字符串──这个精确的字符串将成为客户端后续注册信息和代币存储的核心索引键(Key)──

###  seguir as regras de registo prioritário

Se já existem relações de pré-configuração evidentes entre o cliente e o emissor selecionado, utilizando diretamente os credenciais de cliente pré-registrados.

### 优先采用客户端 ID 元数据文档(CIMD)

客户端 ID 元数据文档(CIMD) forneceu um URL HTTPS para o servidor autorizado, que é o único identificador do cliente.`client_id`), ao mesmo tempo que o seu antigo arquivo de dados:

```json
{
  "client_id": "https://client.example.com/oauth/metadata.json",
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

授权服务器获取并校验该文档──`client_id`▌Deve ser um URL HTTPS que contenha o caminho, e o valor da declaração interna do documento deve ser totalmente em conformidade com esse URL ▌.`client_id`- Não.`client_name`Com`redirect_uris`△Benin caso `application_type`Embora não seja um requisito obrigatório da CIMD, como um elemento obrigatório, ele apareceu no caminho do DCR.

 deve ser tirado de operação do arquivo (View: DNS 重新绑定(DNS rebinding), limitar o número de vezes de reorientação                                                                                                                                                                                                                                           `application/json`,并严格按照有效的HTTP 缓存控制头进行缓存──`client_name`É um livro de ficção.

O CIMD eliminou os passos difíceis de uma primeira ligação, mas não eliminou a necessidade de reorientação para a URI 校验、 issuers trust strategy or user authorization consent.

### DCR  apenas como caminho de integração para trás

动态客户端注册 (DCR) ainda é disponível para utilização de servidores autorizados antigos, mas para a realização de novos MCPs 已正式废弃──

Em uso de DCR, deve ser declarado.`application_type`- Não .

```json
{
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

- 桌面端、移动端、命令行工具及采用回环地址的客户端使用 `native`- Não.
- 远程托管的 Web 浏览器应用使用 `web`,并配置远程 HTTPS 重定向地址──

Se você quiser usar este padrão, OpenID Connect pode ser registrado como um`web`O processo de reestruturação da lei é, portanto, um fracasso direto.

Não se deve reverter silenciosamente para o DCR quando a verificação do CIMD falha inesperadamente, o que pode transformar a falha da verificação de segurança em uma abordagem de registro mais fraca da defesa.

### O documento de identificação e o autor do documento são vinculados

Os credenciais de inscrição enviados pelo emitente devem ser armazenados no nome do emitente:

```text
issuer_credentials[issuer] = pre_registered_or_dcr_client
tokens[(issuer, resource)] = access_token
```

Se encontrados recursos protegidos`https://auth-one.example`- Não .`https://auth-two.example`, deve reevaluar a cadeia de confiança;. Não pode ser um segredo do cliente do primeiro emissor;. ID do cliente do DCR;. Registrar token de acesso;. token de refresco ou token de acesso; enviar para o segundo emissor;.

O CIMD  ID do cliente é diferente: como é um URL HTTPS autogestionado, e não um credencial interno enviado pelo servidor autorizado, o mesmo URL CIMD  possui transferência  o novo emissor de confiança pode tirar e verificar o documento diretamente, sem necessidade de ir para o DCR reinscrição.

### 带 PKCE 的授权码模式

O processo de autorização de intercâmbio inclui os seguintes passos:

1. Número de vezes`code_verifier`- Não.
2. Utilize SHA-256 派生出 `code_challenge`(S256 方式)
3. 发送授权请求,携带精确的 `client_id`- Não.`redirect_uri`- Não.`scope`- Não.`code_challenge`E também`resource`- Não.
4. Receber o poder de resposta, que o poder de resposta inclui o poder de resposta `code`, e apoiar-te-á`iss`- Não.
5. Em qualquer um dos seus passos,`iss`É totalmente em consonância com o autor do registro anterior?
6. Utilização `code_verifier`、 totalmente igual a URI de reorientação 及 igual `resource`- Troca de símbolo.
7. O token que será obtido será armazenado no`(issuer, resource)`- Não.

De RFC 8707 `resource`参数 simultaneamente aparece em pedido de autorização e token pedido, ele identificou especificamente o MCP servidor URI de autoridade

### 严格校验 `iss`参数

RFC 9207 Pode impedir que a resposta autorizada de um emitente se confondesse com a resposta de outro emitente.

Quando apareceu`iss`参数时,将其与记录的发行者进行比较, prohibiting大小写折叠、末尾斜增删除、默认端口移除或URL 百分号编码规范化──一旦不匹配,不得不使用该授权码,甚至不得不显示该响应中攻击者控制的错误详细──

Se o servidor autorizado contém`iss`, normalmente declaradas em dados de moeda`authorization_response_iss_parameter_supported: true`                                                                                                                                                                                                                                                              `iss`O programa de ensino é um dos principais programas de ensino de língua inglesa.

### Em MCP Server 端校验受众(Audiência)

资源服务器 apenas aceita tokens especificamente para sua emissão:

```text
token.issuer == configured_authorization_server
token.audience == canonical_mcp_resource
```

Qualquer token sem efeito, expirado ou não correspondente do emissor será recebido pelo servidor HTTP 401 Não autorizado.

### 仅申请当前最小所需范围 仅申请当前最小所需范围

 seguir o princípio da limitação mínima, apenas aplicar o escopo necessário para a operação atual

```text
WWW-Authenticate: Bearer error="insufficient_scope",
  scope="notes:delete",
  resource_metadata="https://notes.example.com/.well-known/oauth-protected-resource/mcp"
```

客户端 explicou ao usuário a necessidade dessa nova autorização, obteve o consentimento do usuário, lançou um novo processo de autorização para incluir um conjunto de novos escopo antigos, e usou o novo ID JSON-RPC 重试刚才的 MCP 请

Não se suponha que o escopo das exigências de inquérito seja necessariamente incluído no original.`scopes_supported`No meio, a questão é a mais poderosa exigência de poder de operação atual.

### 授权与无状态 MCP 底层报文

经过授权的工具 调用仍携带完整的现代请求信封:

```text
POST /mcp
Authorization: Bearer <access-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.delete
```

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "tools/call",
  "params": {
    "name": "notes.delete",
    "arguments": {"id": "note-7"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "oauth-lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Token usado para conceder o poder do sujeito; requisitos de dados para negociação de acordo de comportamento.

底层报文校验遵循固定时序:JSON-RPC 及元数据类型有效性、header 与 body 一致性,然后是协议版本支持校验──路由或版本 header 不匹配回归 HTTP 400 与错误码`-32020` Se cabeçalho e corpo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `-32022`, e`data`精确为 `{"supported":["2026-07-28"],"requested":"<actual>"}` Requerir método desconhecido para retornar HTTP 404 com erro código `-32601`- Não.

Qualquer pedido de erro (incluindo 401 Token 无效和 403 Scope 不足)`id`Para responder a JSON-RPC  err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err`data`字段中;`WWW-Authenticate`则作为标准 HTTP 响应头返回──通知因为没有 `id`, portanto não retorna JSON-RPC 响应体──被接受的HTTP 通知回归HTTP 202 且响应体为空──

O servidor está pronto .`server/discover`E declarou apoiar as ferramentas, por isso também deve ser implementado obrigatório.`tools/list`方法── seu descriptor de ferramenta 具有稳定的名称、描述以及以对象为根节点的 `inputSchema`△ Esta lista de saída é definitiva,并返回 `resultType`、 servidor ID ID`ttlMs`Com`cacheScope` Serviços de descoberta e ferramentas gerais de acesso livre de usuários  Lista de acesso à informação; se o conteúdo da lista for diferente da identidade do titular, deve-se aplicar estratégias normais de autorização e adotar caché privado (private caching) 

### 禁止 Token 直通转发(Não há Token Pass através)

O servidor MCP 绝不能将客户端发发来的 MCP Access Token 直接传递给下游 API。 deve solicitar o token do serviço do serviço do cliente, ou adoptar um programa de troca de tokens ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼

### Refresher Token 处理

Refresh Token é opcional. Uma vez que o token for lançado, deve ser armazenado em segredo, e deve ser duplicado de acordo com o emissor e o recurso. Não presume que ele seja necessário.

```figure
t3-scope-stepup
```

## 动手构建

`code/main.py`É um protocolo interno de processo com o simulador de autorização. Implementa completamente o recurso protegido de descoberta, o servidor de dados de autorização, o registro CIMD, o controle de versão com DCR, o regresso, o tipo de teste de aplicação, o PKCE, o processamento de autorização, o recurso de fiança de tokens, o escopo, o aumento de direitos,`server/discover`- Não.`tools/list`E também ferramenta de estado.

O modelo recebe cabeçalhos de requisições e rotas resolvidas. Não é um adaptador HTTP completo, não é responsável por resolver.`Content-Type`Ou `Accept` Você pode conectá-lo ao                                                                                                                                                                                                                                                           `Content-Type: application/json`且 `Accept`需同時支持 `application/json`和 `text/event-stream`- Não.

- Não .

```bash
cd phases/13-tools-and-protocols/16-mcp-security-oauth-2-1
python3 code/main.py
python3 -m unittest discover code/tests -v
```

控制台输出按顺序展示服务发现、CIMD注册、常规读取、两次独立 Scope 权限提升流程,以及根据发发放者隔离的证据存储机制──

## Use-o

A partir de agora, o sistema de produção será executado em um modo que permite a produção de uma máquina de simulação.

- `ResourceServer.protected_resource_metadata`映射为 RFC 9728 元数据端点──
- `AuthorizationServer.metadata`映射为 RFC 8414 或 OpenID Connect 发现端点──
- `Client.enroll`映射为 CIMD 解析及显式的 DCR 兼容回退分支──
- 签发者派发的客户端凭证及 `tokens_by_issuer_resource`映射为加密存储记录──CIMD URL 保持可移植, enquanto o produto autorizado é sempre vinculado a um determinado emissor──
- `ResourceServer.handle`映射为校验现代 MCP cabeçalhos、token 和 tool scope 的网关中间件,并分发前将所有请求错误封装进匹配的 JSON-RPC 信封中──

## Entrega-o

本课交付 `outputs/skill-oauth-scope-planner.md` Projetou um conjunto completo de registos de prioridades, de dados de armazenamento de credenciais de separado de emissores, de tipos de aplicação, de PKCE, de indicadores de recursos, de questões de alcance e de habilidades de planejamento prático de fronteiras de pedidos de estado atuais.

## 课后深练习

1. Para aumentar o mecanismo de troca de tokens de refresco,并测试拒绝重复使用上一次已轮换的旧 Refresh Token──
2. 增加签发者白名单机制── Quando verificado que o emitente muda, apenas replicar URL CIMD portátil, decididamente rejeitar todos os títulos e tokens enviados pelo antigo emitente──
3. Para aumentar o mecanismo de prazo, e confirmar que o pedido de alteração do código de autorização de tempo ultrapassado deve falhar.
4. Construir um Web 客户端变体 de endereço de HTTPS de distância com orientação pesada, em relação à sua diferença com o native 客户端 em dados de base de DCR.
5. O Token de Acesso para o novo recurso solicitado, registado no mesmo emitente, não pode ser utilizado em qualquer outro recurso.

## 关键术语

| 术语 | 含义 |
|------|------|
| 受保护资源元数据 | RFC 9728 文档，用于声明资源地址、授权服务器列表及支持的 scopes |
| CIMD | 客户端 ID 元数据文档（Client ID Metadata Document），其 HTTPS URL 即为 OAuth client_id |
| DCR | 动态客户端注册（Dynamic Client Registration），已废弃并仅作为向后兼容路径保留 |
| `application_type` | `native` 或 `web`，用于校验重定向 URI 的合法性规则 |
| PKCE | 包含 verifier 与 S256 challenge 的机制，用于防止授权码拦截攻击 |
| `iss` | RFC 9207 授权响应中的签发者标识符，用于防范 Mix-up 混淆攻击 |
| 资源指示符（Resource indicator） | RFC 8707 参数，用于将 Token 申请显式绑定到目标 MCP 资源 |
| 受众（Audience） | Token 允许被使用的合法资源范围 |
| 权限提升（Step-Up） | 针对当前操作需要的新 scope，发起用户再次同意并获取新 token 的机制 |
| 签发者绑定凭据 | 将客户端注册凭据与 Token 严格按授权服务器签发者物理隔离的存储机制 |

## 延伸阅读

- [MCP 2026-07-28 授权规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [RFC 9728: OAuth 2.0 受保护资源元数据（Protected Resource Metadata）](https://www.rfc-editor.org/rfc/rfc9728)
- [RFC 8707: OAuth 2.0 资源指示符（Resource Indicators）](https://www.rfc-editor.org/rfc/rfc8707)
- [RFC 9207: OAuth 2.0 授权服务器签发者识别（Issuer Identification）](https://www.rfc-editor.org/rfc/rfc9207)
- [OAuth 客户端 ID 元数据文档（CIMD）规范草案](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/)
