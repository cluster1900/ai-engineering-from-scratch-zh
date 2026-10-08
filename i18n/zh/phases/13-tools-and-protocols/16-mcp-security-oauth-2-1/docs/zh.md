# 证券交易权与授权:CIMD、发行人 绑定、PKCE 与权限提升(Step-Up)

> 远程MCP请求是无状态的,但其授权绝对非匿名――必须将每一个证书与创建者发行者强绑定,并将每一个代币与收件者强绑定.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 15 (security)
**Time:** ~90 minutes

## 学习目标

- 通过受保护资源元数据 (通过受保护资源元数据) 发现授权服务器 (通过授权服务器) 授权服务器 (通过授权服务器)
- 优先采用客户端ID 元数据文档 ((CIMD),而不是废弃的动态客户端注册 ((DCR) 。
- 在无法避免的DCR兼容路径时,正确声明`application_type`,我知道.
- 校验授权响应中`iss`参数,并根据发射者物理隔离凭证.
- 熟练运用 PKCE、资源指示符,资源指标,受众验证,观众验证以及增量范围.
- 在不依赖协议会议的前提下发送符合2026-07-28规范的受权MCP请求.

## 问题

远程MCP服务器可能会读取私有记录,向外部系统写入数据,或触发昂贵的运算.身份认证.

- 哪个授权服务器发出了证书?
- 标志专门发出哪个MCP资源?
- 是哪个客户端以及哪个重定向URI完成了授权流程?
- 资源所有者 (用户) 具体批准了哪些操作?
- 现在的确切要求是否仍然符合当时的批准范围?

2026-07-28 版本的授权规范加固了客户端注册与发发件人处理机制――它优先采用客户端 ID 元数据文档(客户端 ID 转载文件,简称CIMD),废弃了动态客户端注册(动态客户端注册,简称DCR),强制要求在DCR中指定正确的`application_type`申请人应对,并严禁跨签发人复用凭证.

这些安全规则与无状态核心协议相辅相成.`Mcp-Session-Id`,我知道.

## 概念

### 明确三大核心角色

- **MCP Client（客户端）：**代表资源所有者发起请求.
- **MCP Resource Server（资源服务器）：**验证 访问代币并提供MCP端点服务──
- **Authorization Server（授权服务器）：**认证资源所有者、收集用户同意并发送代币──

资源服务器和授权服务器可以由同一团队运营,但必须保持两者的标识和验证职责完全独立.

### 授权应用于HTTP传输层

基于HTTP的传输层面的MCP授权规范. 本地基于studio的服务器在同一进程和操作系统的信任边界内运行,不要仅仅为了表面的对称性而给studio的空套上伪造的浏览器.

对于远程流媒体的HTTP传输,必须在每个请求中`Authorization`头部中携带持有符号.**绝不能**把代币放在查询参数中.

### 从受保护资源元数据开始

资源服务器负责发布符合RFC 9728规范的元数据:

```json
{
  "resource": "https://notes.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["notes:delete", "notes:read", "notes:write"]
}
```

客户端从MCP资源URL发出,获取该元数据文档,选择其中声明授权服务器,然后再获取该授权服务器的OAuth或OpenID Connect元数据.

在构建RFC 9728的知名URL时,必须保留原始资源路径.`https://notes.example.com/mcp`课程使用标准路径为`https://notes.example.com/.well-known/oauth-protected-resource/mcp`若丢弃`/mcp`后,可能会错误地选择该域名下其他受保护资源的元数据.

不要根据主机名凭空猜测授权服务器――也不要轻信未经验证的错误响应体中给出的发发件人信息――客户端应维护自己愿意信任的发件人许可策略――

### 验证授权服务器元数据

授权服务器的数据应暴露在各端点及支持的安全控制特性上:

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

强制要求PKCE 采用S256算法──完整记录签发者(发行人) 字符串──这个精确的字符串将成为客户端后续注册信息和代币存储的核心索引键(关键)──

### 遵循注册优先级规则

如果客户端与选定的发行者之间已经存在明显的预配置关系,直接使用预注册的客户端凭证――否则,当授权服务器声明支持时,首选客户端 ID 元数据文档 ((CIMD) ――只有在必要时才会作为退款兼容的退款方案废弃的DCR;如果两者均不可用,再向用户提示手动输入客户端凭证――

### 优先采用客户端ID 元数据文档(CIMD)

客户端ID 元数据文档(CIMD) 为授权服务器提供了一个HTTPSURL,该URL既是客户端唯一的标识符(`client_id`),同时还提供其元数据文档的获取地址:

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

授权服务器获取并校验该文档──`client_id`必须包含路径的HTTPSURL,并且文档内部声明的值必须完全与该URL一致.`client_id`,我知道.`client_name`与`redirect_uris`△本例中包含的`application_type`虽然不是CIMD的强制要求,但作为强制字段,它已经出现在DCR路径中.

必须将取取该文档的操作视为防范SSRF(服务端请求伪造) 的高敏操作:解析并验证目标IP,拒绝环回地址、私有网络、链路本地地址及受限网段,防范重定向与DNS重新绑定(DNS重绑定),限制重定向次数、响应大小和超时时间,强制要求`application/json`并且严格按照有效的HTTP缓存控制头进行缓存.`client_name`现在,我不敢相信.

虽然CIMD消除了初次连接时发送新标识符的繁步骤,但不会免除重定向URI校验的要求,

### 仅作为向后兼容路径

动态客户端注册 (DCR) 仍可使用旧授权服务器,但对于新的MCP实现已正式废弃.

在使用DCR时,必须声明`application_type`其他:

```json
{
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

- 桌面端"",移动端"",命令行工具及采用回环地址的客户端使用`native`,我知道.
- 远程托管的网页浏览器应用使用`web`,并配置远程HTTPS 重定向地址──

如果省略此段,OpenID Connect注册实现可能会默认视为`web`法律回归转向直接失败.

避免在CIMD验证发生意外失败时默默返回DCR,这可能会使安全检查失败变成采用更弱的登记路径.

### 将凭据与发出者强有力绑定

发送发送者注册证书必须存储在确切发送者键名下:

```text
issuer_credentials[issuer] = pre_registered_or_dcr_client
tokens[(issuer, resource)] = access_token
```

保护资源的发现结果`https://auth-one.example`变得了`https://auth-two.example`必须重新评估信任链――绝不能属于第一发发件的客户机密――DCR客户机 ID――注册访问令牌、刷新令牌或访问令牌――发送给第二发发件――预注册或DCR客户端必须使用专门发送给新发发件的证据――

由于它是一个自主管理的HTTPSURL,而不是授权服务器发送的内部凭证,因此相同的CIMDURL具有可移植性,新的信任发发件人可以直接拉取并验证该文件,而无需进行DCR重新注册.

### 带 PKCE 的授权码模式

交互式授权流程包括以下步骤:

1. 生成高的随机数`code_verifier`,我知道.
2. 使用SHA-256 派生出 `code_challenge`(S256 方式) 〔
3. 发送授权请求,携带精确的 `client_id`,我知道.`redirect_uri`,我知道.`scope`,我知道.`code_challenge`及`resource`,我知道.
4. 接收授权应答,该应答包含授权码`code`支持时携带`iss`,我知道.
5. 在使用响应中的任何字段前,严格比对`iss`与预先记录发出者是否完全一致.
6. 使用 `code_verifier`完全相同的重定向URI和相同的`resource`换个代币.
7. 获取的代币将存储在`(issuer, resource)`复合键下――

根据RFC 8707的`resource`参数同时出现授权请求和代币请求中,它精确识别权威的MCP服务器URI──

### 严格校验`iss`参数

规范9207可防止来自一个发发件的授权响应与来自另一个发发件的响应发生混 (合攻击)

当响应中出现`iss`参数时,将其与记录发行商进行比较,禁止大小写折叠,最后斜删除,默认端口移除或URL百分号编码规范化.

若授权服务器包含`iss`总是在元数据中声明`authorization_response_iss_parameter_supported: true`现代客户端即使在未见该声明的情况下,`iss`校园的校园,

### 在MCP服务器端校验受众 (观众)

资源服务器只接受专门发发送的代币:

```text
token.issuer == configured_authorization_server
token.audience == canonical_mcp_resource
```

任何无效、过期、发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发

### 仅申请当前最小要求范围

按照最小权限原则,仅申请当前操作所需的范围. 如果后续某种工具需要更高权限,服务器会返回HTTP 403以及权限的范围质询:

```text
WWW-Authenticate: Bearer error="insufficient_scope",
  scope="notes:delete",
  resource_metadata="https://notes.example.com/.well-known/oauth-protected-resource/mcp"
```

客户端向用户解释新权限的必要性,获取用户同意,发起新的授权流程,并使用新的JSON-RPCID 重试刚才的MCP请求.

勿假设质询中要求的范围必须包含在最初的`scopes_supported`质询头才是当前最权威的权限要求.

### 授权与无状态MCP 底层报文

经过授权的工具 调用仍然携带完整的现代请求信封:

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

代币用于授权主体权限;请求元数据用于协商协议行为――二者各司其职责,不可互换――

底层报文校验遵循固定时间序列:JSON-RPC 及元数据类型有效性,标题与体格一致性,然后是协议版本支持校验.`-32020`△若标题与体格 一致但版本不支持,返回HTTP 400与错误码`-32022`且`data`精确为`{"supported":["2026-07-28"],"requested":"<actual>"}`△请求未知的方法返回HTTP 404与错误码`-32601`,我知道.

所有请求级错误(包括401代币无效和403 范围不足)均与原始请求使用`id`对应的JSON-RPC 错误信封包装――结构化恢复信息存在可选的错误`data`字段中;`WWW-Authenticate`则作为标准 HTTP 响应头返回.`id`由于没有返回JSON-RPC 响应体──被接受的HTTP通知返回HTTP 202 且响应体为空──

服务器实现了`server/discover`声明支持工具,因此必须实现强制性`tools/list`方法──其工具描述器 具有稳定的名称、描述以及以对象为根节点的`inputSchema`△该列表输出是确定性的,并返回`resultType`、服务器身份元数据、有限的 `ttlMs`与`cacheScope`服务发现和用户无关的通用工具 列表可在授权前访问;如果列表内容因主体身份而异,则必须采用正常授权策略并采用私有缓存 (私有缓存) .

### 禁止令牌直通转发(没有令牌通过)

绝对不能将客户端发送的MCP访问代币直接传输给下游API.必须单独申请下游服务的代币,或者采用明确的代币交易方案.

### 更新代码 处理

刷新代币是可选的. 一旦下发,必须严格保密存储,并根据发行人和资源进行双重索引.

```figure
t3-scope-stepup
```

## 动手构建

`code/main.py`是一个进程内协议与授权模拟器. 它完整实现了受保护资源发现,授权服务器元数据,CIMD注册,带有版本控制的DCR回退,应用类型验证,PKCE,发发行者验证,资源绑定代币,范围权限升级,`server/discover`,我知道.`tools/list`没有状态工具 请求.

该模型接收已解析的请求体和路由头. 它本身不是完整的HTTP适配器,不负责解析.`Content-Type`或`Accept`◎您可以将其连接到第09课程的流媒体HTTP适配器,后者严格要求`Content-Type: application/json`且`Accept`需要同时支持`application/json`和 `text/event-stream`,我知道.

运行它:

```bash
cd phases/13-tools-and-protocols/16-mcp-security-oauth-2-1
python3 code/main.py
python3 -m unittest discover code/tests -v
```

控制台输出按顺序展示服务发现,CIMD注册,常规阅读,两次独立的范围权限提升流程以及根据发行者隔离的证据存储机制.

## 使用它

将模拟器中的类映射到生产组件中:

- `ResourceServer.protected_resource_metadata`映射为RFC 9728 元数据端点──
- `AuthorizationServer.metadata`映射为RFC 8414或OpenID连接 发现端点──
- `Client.enroll`映射为CIMD解析及显式的DCR兼容回退分支──
- 签发者发发的客户端凭证及`tokens_by_issuer_resource`映射为加密存储记录.CIMD URL 保持可移植,而授权产品则始终绑定到特定发件者.
- `ResourceServer.handle`映射为校验现代MCP头、代码和工具范围的网关中间件,并分发前将所有请求错误封装进匹配的JSON-RPC 信封中──

## 交付它

本课交付 `outputs/skill-oauth-scope-planner.md`△它设计了一套覆盖注册优先级,发行者隔离证书存储,应用类型,PKCE,资源指示符,范围质询以及当前无状态要求边界的实战规划技能.

## 课后深度练习

1. 为模拟器增加 Refresh Token 轮换机制,并测试拒绝重复使用上一次已轮换的旧 Refresh Token──
2. 增加发发件人白名单机制──当检查发发件人变更时,只复用可移植的CIMDURL,坚决拒绝此前发发件人发送的所有证据和代币──
3. 为了授权代码增加过期机制,并确认超时授权代码的变更请求必然失败.
4. 构建一个具有远程HTTPS重定向地址的Web客户端变体,与其与本地客户端在DCR元数据上的差异相比.
5. 在同一发行者下注册第二个资源,验证该新资源申请的访问令牌绝不能在第一个资源端被越权使用.

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
