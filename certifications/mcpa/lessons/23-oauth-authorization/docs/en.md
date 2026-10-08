# MCP 服务端的 OAuth 鉴权与访问控制

> Bearer Token 仅能证明客户端曾针对该特定服务端获发过合法凭证，绝不代表服务端应当无条件信任该凭证持有者发起的每一项请求；因此协议强制要求客户端在每次交互中均必须对令牌合法性、服务受众 (Audience) 以及签发主体 (Issuer) 进行逐一严密核验。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 22
**Time:** ~45 minutes

## 学习目标

- 阐明为何 MCP 服务端扮演 OAuth 2.1 资源服务器 (Resource Server)、MCP 客户端扮演 OAuth 客户端 (Client)，而独立的授权服务器负责签发令牌；理解为何 stdio 本地服务端应全面跳过此流程
- 掌握受保护资源元数据 (Protected Resource Metadata) 的发现机制：从 401 响应的 `WWW-Authenticate` 响应头解析，直至请求头缺失时遵循的 `/.well-known` 回退顺序
- 熟练追踪带路径签发者与根路径签发者的授权服务器元数据发现链路，深刻理解为何返回的 `issuer` 值必须与构造请求时使用的标识符保持字符级完全一致
- 使用标准库独立生成 PKCE S256 代码质询 (Code Challenge)，深刻理解为何当授权服务器未通告 `code_challenge_methods_supported` 时客户端必须坚决终止流程
- 熟练应用 RFC 8707 的 `resource` 参数将令牌请求严格绑定至服务端的规范 URI，并基于该 URI 严格核验入站令牌的 Audience
- 掌握 RFC 9207 针对 `iss` 校验的四行标准判定表以有效防御混淆攻击 (Mix-up Attacks)，准确区分 MCP 服务端在鉴权响应中返回 401、403 与 400 的边界条件

## 问题背景

在本课程体系截至目前的前序内容中，我们基本假定只要一个请求格式合规，它就具备天然的合法性：包含正确的 `_meta`、调用已知工具、传入合法入参即可放行。然而，一旦 MCP 服务端背后挂载了高价值的受保护资产（例如存储核心客户档案的生产数据库、密钥轮换工具或账单扣费系统），这一美好假设便会瞬间破灭。暴露此类高危原语的服务端，绝对不能对每一个语法合规的 `tools/call` 请求来者不拒。在执行任何调用方无法撤销的关键操作之前，服务端必须严密审查究竟是谁在发起请求、其背后的授权委托人是谁，以及具体获得了针对何种操作的权限范围。

在协议标准层面，MCP 的鉴权机制是可选组件：本地 stdio 服务端天然无需实现鉴权，因为宿主操作系统的进程沙箱边界以及用户自身的本地会话环境已经确立了最高信任基础；规范明确建议此类实现绝不应运行 OAuth 网页授权流，而是直接从本地环境变量中读取凭据。然而，一旦服务端部署形态转变为跨越网络的远程 HTTP 服务，这一物理安全边界就复不存在了。MCP 规范明确指出，基于 HTTP 的生产实现应当严格遵循本课阐述的标准化授权流程。该架构的核心攻坚点并非底层传输加密（TLS 已经在传输层妥善解决），而是在完全不依赖 Session 的纯无状态环境中，如何在每一次独立请求到达时，严密证明所持令牌确实是专门针对本服务端签发的、确实源自客户端所信任的合规授权服务器，且确实经过了合法用户的知情同意。

## 核心概念

整个鉴权流程由三个泾渭分明的角色共同驱动，规范对各角色的术语定义有着严谨的技术界定：MCP 服务端充当 **OAuth 2.1 资源服务器 (Resource Server)**，负责托管受保护的原语资产并校验或拒收 Bearer Token；MCP 客户端充当 **OAuth 2.1 客户端 (Client)**，代表人类用户驱动基于浏览器的授权流程并将获取的令牌附加至请求中；**授权服务器 (Authorization Server)** 是完全独立的第三个角色，通常作为独立的云端身份提供商 (IdP) 运行，专门负责用户认证与令牌签发。在这三者之中，完全没有大语言模型的身影：鉴权发生在底层传输通道，完全隔离在模型上下文能够感知的层级之下。结合前一课划分的信任域，该授权服务器完全位于宿主环境的物理边界之外：客户端直接与其打交道，而 MCP 服务端自始至终绝不可能触碰到用户的原始密码凭证，其所能见到的仅仅是最终生成的受限令牌。

整个授权握手通常始于一次被拒绝的初始尝试：客户端在未携带任何令牌的前提下发起常规的 `tools/call` 请求，服务端直接以纯 HTTP `401 Unauthorized` 予以拒绝，且不返回任何 JSON-RPC 报文体：此时请求在被反序列化为协议报文之前便已被网关拦截，因此不存在 `result` 也不会有 `error`，仅暴露出 HTTP 传输层的自身状态码与响应头。服务端在返回 401 时应当携带 `WWW-Authenticate` 响应头，指明获取详细元数据的具体地址：

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource/mcp"
```

该响应头指向一份**受保护资源元数据文档 (Protected Resource Metadata, RFC 9728)**，这是每个合规 MCP 服务端必须实现的接口。若客户端在该头部中发现了 `resource_metadata` 参数，则直接请求该 URL。若因反向代理策略导致该响应头缺失或未声明该参数，客户端必须按照既定顺序主动尝试构造标准 `.well-known` URI：首先尝试路径特化地址（即 `/.well-known/oauth-protected-resource` 后追加 MCP 端点自身的挂载路径），随后回退至根路径地址（即不带任何业务路径的 `/.well-known/oauth-protected-resource`）。针对挂载在 `https://mcp.example.com/mcp` 的端点，在无响应头可用的兜底场景下正好按顺序尝试两个 URL。抓取到的元数据文档明确通告了该资源背后对接的授权服务器清单及其支持的权限范围：

```json
{
  "resource": "https://mcp.example.com/mcp",
  "authorization_servers": ["https://auth.example.com/tenant-a"],
  "scopes_supported": ["vault:rotate"]
}
```

一旦确认了合规的授权服务器地址，客户端便开始发现其端点配置。MCP 直接复用 RFC 8414 标准的 `oauth-authorization-server` 发现后缀。由于实际生产中的 Issuer 既可能带有路径子串也可能为纯域名，客户端必须按特定顺序尝试探测。对于携带路径的 Issuer（例如 `https://auth.example.com/tenant-a`），探测顺序为：首先在 `.well-known` 后插入路径构建 OAuth 元数据地址；其次按相同规则构建 OpenID Connect 发现地址；最后在路径末尾追加 `.well-known` 构建 OpenID Connect 发现地址。对于无路径的纯根 Issuer，则直接跳至前两种标准格式。无论最终是哪一个 URL 响应，该文档内部返回的 `issuer` 字段取值必须与构造请求时所依据的 Issuer 标识符保持字符级完全一致。若从 `https://attacker.example/.well-known/oauth-authorization-server` 抓取到的文档声称其 `"issuer": "https://honest.example"`，客户端必须断然拒绝：采信该响应将导致仅控制某一域名的恶意攻击者能够非法假冒完全无关的合法授权服务器。

在将用户的浏览器重定向至授权页面之前，客户端必须在本地生成 PKCE 密钥对。MCP 规范强制要求必须启用 PKCE，并且只要客户端技术上具备支持条件，必须强制使用 `S256` 算法。鉴于 OAuth 2.1 与 PKCE 规范本身并未定义向授权服务器动态询问是否支持 PKCE 的独立接口，MCP 客户端必须直接审查元数据文档中的 `code_challenge_methods_supported` 字段：若该字段缺失，客户端必须坚决终止授权流程，因为此时根本无法确保授权服务器在后端会严格执行 PKCE 校验。Code Verifier 是一段由客户端保密的随机加密字符串，而基于其哈希派生出的 Code Challenge 则随重定向网络流明文传输：

```python
import base64
import hashlib
import secrets

verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode("ascii")
digest = hashlib.sha256(verifier.encode("ascii")).digest()
challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
```

在随后的授权请求以及令牌置换请求中，还必须伴随传输另外两个关键参数：`resource` 参数（RFC 8707）指明了客户端期望将该令牌用于哪个规范化的 MCP 服务端 URI（协议与域名强制小写、无 URI Fragment、除非具备语义否则不得带尾部斜杠）；该参数的发送是强制性的，即使某些宽容的授权服务器选择忽略它，严谨的授权服务器正是借此参数为特定资源精确定制最小化令牌，防止签发可畅行无阻的越权大通票。而针对每次请求随机生成的 `state` 参数，则用于在重定向归来时由客户端对比闭环，彻底阻断攻击者注入属于另一会话的虚假授权响应。

用户在浏览器中完成授权审批后，授权服务器携带着授权码 (Authorization Code) 将浏览器重定向回客户端的回调地址。在客户端采信该重定向中的任何数据之前，必须强制执行 RFC 9207 规范定义的 `iss` 校验：防止同时信任多个 IdP 的客户端被恶意攻击者通过混淆攻击 (Mix-up Attack) 诱骗，将本应送往 A 机构的授权码错误提交给 B 机构。客户端必须对照重定向前本地登记的 Issuer 与响应中携带的 `iss`，严格执行四行判定逻辑：

| 服务端是否声明 `authorization_response_iss_parameter_supported` | 响应中是否包含 `iss` | 客户端强制处理动作 |
|---|---|---|
| true | 存在 | 与本地登记的 Issuer 严格完全匹配 |
| true | 缺失 | 断然拒绝该响应 |
| false 或未声明 | 存在 | 与本地登记的 Issuer 严格完全匹配 |
| false 或未声明 | 缺失 | 允许继续放行 |

只有完全匹配才能获准继续，在比对前严禁进行大小写转换、端口省略或斜杠规范化。若比对失败，不仅不能继续置换令牌，客户端甚至不得在 UI 中展示随附的 `error`、`error_description` 或 `error_uri`，因为这些信息源自一个未经用户核准的非法端点。在校验通过后，客户端向 Token 端点发起置换，提交相同的 `resource` 参数以及原始的 PKCE `code_verifier`；授权服务器核验该明文与最初暂存的 `code_challenge` 匹配无误后，正式下发 Bearer Token。

令牌的使用重申了本课程一贯秉持的工程纪律：凭证如同协议版本与能力集一样，必须在每一次离散 HTTP 请求的请求头中显式单发，与无状态核心深度共鸣。具体契约规定：每个发往服务端的请求均须携带 `Authorization: Bearer <token>` 请求头；访问令牌绝对禁止出现在 URL Query 参数中，以杜绝凭据泄漏至网关日志、中间代理与浏览器浏览记录中。然而，服务端拿到令牌绝不代表可以高枕无忧：作为资源服务器的 MCP 服务端在放行前，必须深度解析该令牌，确认其声明的受众 (Audience) 必须精准匹配自身的规范 URI；若受众不匹配（即便该令牌是另一家合法 MCP 服务端签发的有效凭据），必须坚决拒收。若该服务端后续需要代表用户调用更深层的上游微服务 API，它必须在后台以独立的 OAuth 客户端身份向对应系统换取专用令牌；直接转发当前收到的客户端令牌（即令牌透传，Token Passthrough）在 MCP 体系中被严令禁止，因为透传会导致上游系统误将当前中间服务的调用权限视作原始用户的全部权限，彻底打碎最小特权原则。

HTTP 层的三组状态码精准映射了鉴权结果，考试中常针对其边界设伏：`401 Unauthorized` 严格对应无令牌或令牌无效（缺失、过期、格式损坏或 Audience 绑定错误）；`403 Forbidden` 对应身份认证完全合法通过，但该令牌所申请的 Scope 权限不足以执行当前操作；而 `400 Bad Request` 则指代授权交互协议请求本身格式畸形，此时甚至尚未进入令牌校验阶段。

```figure
mcpa-23-oauth-flow
```

## 交互式实验

上方的全流程泳道图追踪了一次高危的凭据轮换操作在三个阶段中的完整交互。在顶部泳道中，客户端发起的首次尝试完全未携带令牌，服务端直接以 HTTP 401 与 `WWW-Authenticate` 响应头予以截断，响应中绝无任何 JSON-RPC 报文体，因为请求在协议解析层之前已被物理阻断。在中间泳道中，客户端将该头部解析为受保护资源元数据发现流程，随后使用路径特化探测顺序定位授权服务器，并在本地生成 PKCE 密钥对；从授权服务器重定向拿回授权码后，严格执行 `iss` 一致性比对，确认无误后换得正式令牌。在底部泳道中，客户端重新发起相同的 `tools/call` 请求，这次显式附带了 `Authorization: Bearer` 请求头；服务端的资源服务器层核验该令牌的 Audience 确实绑定为自身的规范 URI 后予以放行，请求最终顺利抵达自基础课以来构建的常规工具业务处理逻辑。

## 实战演练

查看 `code/main.py` 源码。`simulate_authorization_flow` 函数以纯 Python 原生数据结构完整实现了受保护资源元数据发现、授权服务器元数据解析、PKCE 质询派生、资源指示符绑定以及签发者一致性核验；这一部分完全不依赖任何 JSON-RPC 协议包：直接使用字典抽象元数据文档，使用 `AuthorizationRequest` 与 `TokenRequest` 数据类抽象标准 OAuth 交互。而 `McpServer` 与 `McpClient` 则专职模拟 MCP 通信侧：内含一个受 `ResourceServer` 严格保护的 `rotate_credential` 核心工具；服务内置了两枚有效签发的测试令牌，一枚的 Audience 准确匹配本服务端的规范 URI，另一枚则是为完全无关的外部服务端签发。

在课程根目录下执行实战演练：

```bash
python3 code/main.py
```

首先研读控制台打印的发现链路顺序：两个受保护资源元数据探测 URL（路径特化优先，随后根路径），以及三个针对带路径 Issuer 的授权服务器探测 URL。随后观察两组核心报文日志：第一组是未附带凭据的原始 `tools/call`，被外层准确包裹为纯 HTTP 401 状态与标准鉴权响应头，完全没有 `result` 或 `error` 实体；第二组是携带了合法 Bearer Token 重试的相同请求：此时报文成功注入 `Authorization: Bearer tok_valid_abc` 并在 HTTP 层获得 200 放行，紧随其后的是包含新请求 id 的常规 `resultType: "complete"` 业务响应。尝试在代码中将客户端所使用的令牌篡改为 `foreign_token` 并重新运行：观察一枚虽然签名完好但 Audience 指向 `https://other-server.example.com/mcp` 的外部令牌，如何在服务端 Audience 校验关卡被当场抓包并直接打回 401 拒绝。

## 交付产物

`outputs/authorization-flow-checklist.md` 是一份单页生产级鉴权落地清单：系统收录了受保护资源元数据与授权服务器元数据的权威探测顺序标准；PKCE 缺失强阻断法则；规范化 `resource` 参数的构造约束；RFC 9207 规范的 `iss` 四行决策核验表；以及 401、403 与 400 三大核心状态码的技术判别红线。在为远程托管的 MCP 服务端首次搭建授权体系时，请务必将其作为前置检查标准。

## 验证方法

在当前课程目录下执行单元测试：

```bash
python3 -m unittest discover code/tests
```

测试集系统性核验了本课全部核心论断：受保护资源元数据发现优先采信 `WWW-Authenticate` 头部声明的 `resource_metadata`，缺失时自动回退为路径特化优先的 `.well-known` 顺序；针对带路径 Issuer 正确生成三条有序探测地址，根 Issuer 正确生成两条；元数据文档中的 `issuer` 若与请求目标不符则被果断拒绝；标准库生成的 PKCE `S256` 质询与公式 `base64url(sha256(verifier))` 完全契合；面对未声明支持 PKCE 的授权服务器在重定向前果断中止流程；`resource` 参数在授权与置换阶段均保持规范化格式；RFC 9207 四行 `iss` 判定逻辑被严格双向执行；针对其他服务端签发的令牌即便未过期也必须以 401 拒收；且所有令牌绝对禁止泄漏至 URL 之中。运行协议通信校验器：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/23-oauth-authorization
```

## 项目连接

在毕业设计的端到端终极交互场景中，系统内置了一个严格校验 Audience 并拒收外来异构令牌的资源服务器，其安全逻辑与本课实现完全同源。综合项目中所要求掌握的所有鉴权常识：Bearer Token 的可信度受限于其签发的具体受众、传输层 401 拒绝不生成 JSON-RPC 报文体、规范化资源 URI 是令牌作用域的唯一法定锚点，均直接植根于本课的扎实演练。

## 核心术语

| 术语 (Term) | 核心内涵解释 |
|---|---|
| Resource server (资源服务器) | MCP 服务端在 OAuth 2.1 架构中所扮演的角色：负责校验并接纳或拒绝 Bearer Token |
| Authorization server (授权服务器) | 负责用户身份认证并向合法客户端签发访问令牌的独立第三方身份系统 |
| Protected Resource Metadata | 符合 RFC 9728 规范的元数据文档，向客户端通告资源服务器背后绑定的授权服务器信息 |
| PKCE | 代码交换验证密钥机制：由 Verifier 与 Challenge 构成的密钥对，防止授权码在网络传输中被盗用截胡 |
| S256 | MCP 规范强制要求的 PKCE 散列计算标准：`challenge = base64url(sha256(verifier))` |
| Resource indicator (资源指示符) | 遵循 RFC 8707 的 `resource` 参数，将令牌申请与签发严格限制在单个规范服务端 URI 上 |
| `iss` validation (签发者核验) | 遵循 RFC 9207 规范，严格比对授权响应中的 `iss` 与最初选定的 Issuer 是否完全一致 |
| Audience validation (受众核验) | 资源服务器在接受令牌前，核验令牌的 Audience 声明必须精准包含自身规范 URI 的安全规则 |
| Token passthrough (令牌透传) | 将客户端发来的原始令牌直接转发给下游依赖 API 的危险违规做法；MCP 架构严令禁止 |
| 401 vs 403 vs 400 | 分别严格指代：无令牌或令牌无效、有效令牌但权限不足 (Scope 缺失)，以及授权请求本身语法畸形 |

## 延伸阅读

- [MCP 规范 2026-07-28：授权框架 (Authorization)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [MCP 规范 2026-07-28：授权服务器发现机制 (Discovery)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery)
- [MCP 规范 2026-07-28：鉴权安全考量 (Security Considerations)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations)
- [MCP 官方教程：深度理解 MCP 鉴权架构](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/authorization)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 12 章节
- `phases/13-tools-and-protocols/16-mcp-security-oauth-2-1` 与 `phases/13-tools-and-protocols/18-mcp-auth-production`，深入研习生产级 OAuth 协议流构建与工程加固
