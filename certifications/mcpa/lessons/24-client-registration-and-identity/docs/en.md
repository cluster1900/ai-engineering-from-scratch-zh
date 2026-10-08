# 向授权服务器证明客户端身份

> MCP 客户端与负责保护新服务端的授权服务器在物理上通常从未谋面；因此在执行任何授权批准之前，授权服务器必须首先判定它是否采信当前客户端自称的真实身份。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 23
**Time:** ~45 minutes

## 学习目标

- 深刻阐明为何 MCP 追求的开放互操作性承诺会导致客户端与授权服务器之间天然缺乏预先建立的信任关系，以及这种特征如何塑造了客户端注册机制
- 熟练应用规范定义的四大客户端注册优先级路径：预注册凭据、客户端 ID 元数据文档 (CIMD)、动态客户端注册 (DCR) 以及人工录入
- 掌握授权服务器对客户端 ID 元数据文档 (CIMD) 的严格校验标准：`client_id` 字符级完全匹配、具备路径的 HTTPS 规范 URL 以及必需的元数据字段
- 掌握将本地持久化的客户端凭据与签发它的授权服务器 (Issuer) 进行强绑定的工程范式，深刻理解为何授权服务器变更会强制触发重新注册
- 识别静态客户端 ID 代理所引发的混淆代理人 (Confused Deputy) 安全风险，并在无人值守自动化与企业集中治理场景下准确选型对应的鉴权扩展

## 问题背景

MCP 协议的核心价值主张完全建立在一个宏大的技术愿景之上：今天编写的客户端应当能够无缝访问此前从未见过的全新服务端，而今天发布的服务端也能够被其作者从未听闻的全新客户端顺畅调用。然而，这恰恰是传统经典 OAuth 架构未曾重点考虑的异构协作场景。经典 OAuth 2.1 规范天然假设客户端开发者早已提前在特定授权服务器上完成了线下注册，换取到了固定的 Client ID，并在随后的每一次交互中长期复用。当一家商业公司专门编写自家的移动端 App 对接自家的统一鉴权中心时，这种预先注册显得自然而然；但当全世界任何人构建的任意 MCP 客户端，都需要随时访问世界上其他人托管的任意 MCP 服务端，且这些服务端背后对接的授权服务器五花八门时，要求开发者提前在所有可能的授权中心完成人工预注册显然是不切实际的。

前一课我们梳理了鉴权的三大核心角色：MCP 服务端充当 OAuth 资源服务器，MCP 客户端充当 OAuth 客户端，而独立的授权服务器负责向客户端颁发访问令牌。本课所聚焦的，正是整个鉴权大厦启动之前最关键的前置基础：在双方团队此前从未发生过任何技术协同的前提下，客户端究竟如何获取一个能够被目标授权服务器合法接纳的有效 Client ID。如果在该步骤发生架构差错，后续的整个 OAuth 流程将直接瘫痪；伪造虚假客户端身份的恶意攻击者将轻易达成身份冒充，而错误将一套凭据跨授权服务器复用的客户端则会向未经验证的第三方拱手交出本不属于对方的敏感令牌。

## 核心概念

MCP 规范为客户端确立了严格且唯一的注册优先级顺序；该顺序具有严密的逻辑递进性，只有在前一项不可行时，方可有序回退至下一项：
1. **优先使用预注册凭据 (Pre-registered credentials)：** 若客户端针对当前授权服务器已持有预先下发的合法凭据，强制优先直接采纳。
2. **使用客户端 ID 元数据文档 (Client ID Metadata Document, CIMD)：** 若授权服务器在其元数据中声明支持 CIMD，优先走基于 HTTPS URL 的免握手自动认证。
3. **回退至动态客户端注册 (Dynamic Client Registration, DCR)：** 若授权服务器未支持 CIMD 但对外暴露了标准注册端点，降级采用动态交互注册。
4. **最终人工提示输入 (Asking the user)：** 仅当上述自动化路径全部失效时，才弹出交互界面要求人类用户手动粘贴录入客户端凭据。

**预注册凭据 (Pre-registration)** 是最简单直接的静态模式：客户端开发者针对某一已知授权服务器硬编码了 Client ID，或者系统管理员在后台管理界面完成登记后将 Client ID 显式配置进客户端。当通信双方本来就属于同一技术团队时（例如企业内部统一搭建的私有 MCP 服务集群），该模式极为高效，但它无法适应 MCP 广泛面向的去中心化开放生态。

**客户端 ID 元数据文档 (CIMD, SEP-991)** 是 MCP 针对开放生态零预设信任场景交出的核心答卷。在 CIMD 模式下，客户端不再使用由授权服务器随机分配的不透明字符串作为 ID，而是直接采用一个由客户端自身拥有并托管的 HTTPS URL 作为其全局唯一 Client ID。该 URL（例如 `https://app.example.com/oauth/client-metadata.json`）直连一份由客户端对外公开发布的 JSON 配置文件：

```json
{
  "client_id": "https://app.example.com/oauth/client-metadata.json",
  "client_name": "Example MCP Client",
  "client_uri": "https://app.example.com",
  "redirect_uris": ["http://127.0.0.1:3000/callback", "http://localhost:3000/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

当授权服务器在收到的授权请求中观察到一个形如 URL 的 `client_id` 时，它会主动通过标准 HTTP GET 请求抓取该 URL，并将下载到的 JSON 文档直接视作该客户端的权威注册登记表。该文档必须至少完整包含 `client_id`、`client_name` 与 `redirect_uris` 三项核心属性；授权服务器在采信该文档前，必须强制核验文档内嵌的 `client_id` 属性取值与网络实际请求拉取的目标 URL 保持字符级的完全一致。正是这道严格的双向相等性比对，赋予了该 URL 不可伪造的密码学与域名层权威：世界上唯有对该特定 HTTPS 路径具备物理写权限的合法拥有者，才可能在其末端托管一份内容完全自洽的元数据文档。授权服务器随后对照文档中的白名单严格审查请求携带的回调地址，并遵照标准 HTTP 缓存头对该文档进行缓存，避免在用户登录时高频重复拉取。授权服务器若支持该特性，必须在其自身的元数据中明确通告 `"client_id_metadata_document_supported": true`，这正是客户端在发起 CIMD 登录前必须确认的探测指标。

主动抓取客户端传入的外部 URL 必然伴随网络安全风险。由于授权服务器是在基于完全由不可信外部调用者输入的地址发起出站 HTTP 通信，它必须强制配备服务端请求伪造 (SSRF) 防御机制：在发起请求前严格审查 URL scheme、校验其解析出的底层 IP 地址绝不能命中私有内网段、严格限制响应报文体积上限，并施加短超时保护。此外，CIMD 本身无法阻止本地回环地址端口抢占冒充：攻击者完全可以在本机宣称采信合法的远端元数据 URL 并恶意监听相同的 `localhost` 回调端口；因此规范要求授权服务器在面对纯本地回环回调地址时展示显式安全警示，并在用户授权确认弹窗中醒目展示重定向目标的主机名。尽管存在上述防御考量，CIMD 依然展现出旧版 DCR 望尘莫及的绝对优势：跨域便携性 (Portability)。因为 Client ID 本质上是一个按需动态寻址解析的标准化 URL，同一个 Client ID 无需任何前置修改，即可畅行无阻地在客户端所访问的全球任意支持 CIMD 的授权服务器上顺利通过认证。

**动态客户端注册 (DCR, RFC 7591)** 是 CIMD 规范出台前 MCP 所依赖的历史过渡方案；当前规范已将其正式定级为已废弃 (Deprecated)，留存该机制纯粹为了让客户端能够向后兼容尚未升级支持 CIMD 的陈旧授权服务器。在 DCR 流程中，客户端向授权服务器的 `registration_endpoint` 发送注册元数据包，并换回一个仅对该授权服务器局部有效的全新随机 Client ID。考试中关于 DCR 的关键考点在于 OpenID Connect 框架下的应用形态声明：当授权服务器在 DCR 之上实施 OIDC 治理时，它会依据客户端声明的 `application_type` 执行截然不同的回调地址安全规则。运行在宿主本地的原生应用（桌面软件、移动应用、本地 CLI 命令行工具或监听在 `localhost` 的本地服务端）必须明确声明 `application_type: "native"`；远程基于浏览器的 Web 应用则声明 `"web"`。若在注册报文中遗漏该字段，OIDC 规范将强制默认假定其为 `"web"`，这会导致使用本地回环地址作为重定向回调的 CLI 客户端在注册阶段被授权服务器当场判为非法并粗暴拒绝。

无论客户端凭据最初是通过上述哪一种途径签发生成的，本地持久化保存的凭据在归属上仅严格属于特定的授权服务器 (Issuer)，绝不能与具体的 MCP 服务端或抽象的集群拓扑相混淆。MCP 规范强制要求客户端在本地持久化密钥库中，必须以签发凭据的授权服务器 Issuer 标识符作为唯一索引键，严禁将为 A 授权中心签发的凭据跨域提交给 B 授权中心。客户端必须通过持续监听所访问 MCP 服务端的受保护资源元数据来感知授权中心的变动：若元数据通告该服务端背后已经迁移切换为另一家授权服务器，旧凭据将被立即判定失效，客户端必须强制触发重新注册流程，绝不能心存侥幸地尝试盲目复用旧令牌。在此场景下，CIMD 的优势再次凸显：由于其 ID 是通用且便携的 URL，在授权服务器切换后可以直接平滑沿用；而依赖传统 DCR 的客户端则必须向新授权服务器重新发起一次全量注册。

客户端注册身份还直接关联着规范重点警示的一类高危攻击模型：混淆代理人 (Confused Deputy) 漏洞。某些架构中的 MCP 反向代理网关为了图省事，使用单个预先静态注册的通用 Client ID，统一代理下游众多动态接入的不同客户端向第三方授权服务器发起调用。此时攻击者便能轻而易举地实施会话劫持：诱骗代理将某一合法用户明确授权给下游 A 客户端的敏感授权码，错误转发给下游恶意 B 客户端。针对该漏洞的防御核心是治理机制上的强隔离：代理网关严禁将用户对共享静态 ID 的宏观授权偷换为对其背后所有下游客户端的无条件放行；代理在向远端转发请求前，必须单独向用户弹窗展示下游各动态注册客户端的具体身份，逐一获取用户对该特定下游客户端的独立授权。

前述所有交互路径均建立在有人类用户即时点击“允许”按钮的交互假定之上。针对无人值守的后台自动化系统，MCP 官方提供了两项标准鉴权扩展作为补充支撑；这两项扩展的协商完全遵从标准的 MCP 扩展能力握手协议：客户端在请求报文的 `_meta.clientCapabilities.extensions` 字典中按需声明，服务端在 `server/discover` 响应中同步通告对应支持，双方均非强制依赖。

```json
{
  "io.modelcontextprotocol/clientCapabilities": {
    "extensions": {
      "io.modelcontextprotocol/oauth-client-credentials": {}
    }
  }
}
```

**OAuth 客户端凭据扩展 (OAuth Client Credentials)** 专为后台离线守护进程、定时自动化批处理作业或 CI/CD 构建流水线设计，此时物理上根本不存在人类操作员来实时点击浏览器审批。客户端使用自身持有的系统凭据直接向授权服务器发起身份认证：既可以通过客户端私钥在本地自行签署 JWT Bearer 声明（规范强烈推荐此方式，因为签名私钥永不离身），也可以直接将预配的 Client Secret 发送至令牌端点（虽然配置更简便，但长周期明文密钥一旦泄漏会导致灾难性后果）。**企业集中管控鉴权扩展 (Enterprise-Managed Authorization)** 则针对截然相反的企业级治理痛点：大型企业要求由企业自身的内部身份提供商（而非散落在外部各 MCP 服务端背后的独立授权中心）对员工权限进行绝对权威的收口管控。企业员工仅需使用其日常的企业 SSO 凭据登录本地 MCP 客户端，客户端将该身份向企业内部 IdP 置换为一枚名为 ID-JAG 的短期受信任凭据，并最终凭借该 ID-JAG 直接向 MCP 授权服务器兑换目标 MCP 访问令牌，全程无需将员工浏览器重定向至任何第三方登录界面。这种将鉴权决策集中回收至企业内部 IdP 的模式，使得企业 IT 管理员能够在员工离职或权限调整时，仅凭在内部 IdP 上的一次单击即可瞬间吊销该员工在所有外部 MCP 服务上的访问特权，彻底终结在各个独立服务端上手动清理权限的失控局面。

```figure
mcpa-24-registration-paths
```

## 交互式实验

上方的阶梯决策图自顶向下系统展开了四大注册路径的优先级管道。每一个方框内部均标注了触发该路径所需满足的前置检测条件，标有“若不可用”的下行箭头清晰指示了客户端在探测失败时如何顺次跌落至下一个备选路径。请特别关注位于第三阶梯的动态客户端注册 (DCR)：该方框采用虚线边框绘制，醒目标识出其在 2026-07-28 规范中属于已废弃 (Deprecated) 的降级保护状态：它仍然保持技术可用，但绝非现代客户端的首选方案。在阶梯决策图右侧，附带了一份紧凑的合规自查表，精炼列出了授权服务器审查 CIMD 元数据文档时的法定必检项，并直观揭示了客户端凭据为何必须以 Issuer 为索引强制锁定的底层逻辑。在启动代码演练前，请顺着决策方框在脑海中模拟一遍客户端的决策路径：本地是否已针对该授权服务器持有预留凭据？授权服务器的自身元数据中是否声明了 CIMD 支持？该服务是否暴露出动态注册端点？或者最终只能无奈弹窗求助人类用户？

## 实战演练

查看 `code/main.py` 源码。该模块构建了三台具备不同技术能力的虚拟授权服务器：第一台完整通告了 CIMD 支持；第二台未支持 CIMD 仅提供了陈旧的 DCR `registration_endpoint`；第三台两项自动化能力均不具备。核心规划函数 `choose_registration_path` 严格依循前述优先级进行决策：当针对第一台授权服务器且本地预注册凭据库为空时，算法坚定选择 `cimd`；当再次运行该函数但在预注册库中预先注入了该服务的主机标识符时，即便 CIMD 能力完全可用，决策依然判定预注册胜出，因为其在优先级阶梯上享有最高优先权。面对第二台授权服务器，算法探测到 CIMD 缺失，因而自动降级退化至 `dcr` 并将此决策打上已废弃标记。面对第三台授权服务器，由于两种机制均不可用，算法最终输出 `ask-user` 决断。

在当前课程目录下运行实战演练：

```bash
python3 code/main.py
```

`validate_cimd` 函数模拟了授权服务器在收到形如 URL 的 Client ID 时所执行的严苛合规校验逻辑：审查 URL 是否采用包含合法路径的 HTTPS 规范协议；检查文档是否包含必填的 `client_id`、`client_name` 与 `redirect_uris` 字段；严格比对文档声明的 `client_id` 与实际拉取该文档的 URL 是否字符级完全一致；并逐一核验所有重定向 URI 是否均为 HTTPS 地址或本地回环地址。在控制台输出中观察四份不同元数据文档的校验表现：完全合规的测试文档顺利通过放行；`client_id` 与自身 URL 存在偏差的文档被当场捕获；使用不安全 `http` 协议的文档被直接拦截；遗漏了 `redirect_uris` 的残缺文档被精准拒收。紧接着，`CredentialStore` 严格执行了授权中心绑定守卫：它将持久化凭据强制登记在特定签发者名下；当尝试调用 `.use()` 并在参数中传入另一个无关的 Issuer 时，模块立即抛出详细的 `ValueError` 异常，准确指明该凭据的合法归属。`ProxyConsentLedger` 完整重现了混淆代理人漏洞的防御实现：通过维护一组由静态 Client ID 与下游各独立 Client ID 构成的显式授权账本，在未针对该特定下游 ID 显式调用 `record_consent` 之前，`may_forward` 函数坚决返回 False 拒绝代理转发。最后，`recommend_auth_extension` 展示了如何根据场景特征在两套鉴权扩展之间做出精准推导；日志最后一条记录展示了获得合法授权的 `acme-ops-cli` 客户端利用客户端凭据所置换出的有效令牌，如何通过 Streamable HTTP 协议规范，在请求头中携带 Bearer 凭证完成真正的 `server/discover` 与 `tools/call` 端到端通信。

## 交付产物

`outputs/client-registration-guide.md` 是一份单页生产级客户端注册与身份治理指南：完整收录了四大注册路径的优先级裁定标准；授权服务器校验 CIMD 的法定全量清单；OIDC 框架下的 `application_type` 选型铁律；基于 Issuer 的凭据本地持久化存储范式；针对代理层混淆代理人风险的实操防御方案；以及两大企业级鉴权扩展的技术对比矩阵。在为新开发的 MCP 客户端设计注册接入层时，可将其作为权威架构规范。

## 验证方法

在当前课程目录下执行单元测试：

```bash
python3 -m unittest discover code/tests
```

测试套件系统验证了本课全部核心论断：即便服务端声明了 CIMD 支持，预注册凭据依然拥有最高优先权；在无预注册时优先选择 CIMD 而非已废弃的 DCR；两者皆无时平稳降级至人工录入；合规的 CIMD 元数据文档能够顺利通过全量校验；`client_id` 内部不匹配与使用明文 HTTP 协议的恶意文档均被精准拦截；缺失必填字段的文档被有效拦截；本地回环地址被正确打标为原生应用 (native)，远程地址正确打标为 Web 应用；针对某一 Issuer 登记的凭据严禁跨授权服务器挪用；代理网关在未获得下游专属授权前绝不放行转发；两大鉴权扩展在对应业务场景下被准确推荐；且完成注册的客户端在通信链路上完整携带有合规的 Bearer Token 与必需的 HTTP 请求头。运行协议通信校验器：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/24-client-registration-and-identity
```

## 项目连接

在毕业设计的综合演练中，整个经过授权保护的安全调用之所以能够顺利出示有效令牌，其物理前提正是本课所实现的某一注册机制在底层已经完成闭环：无论是依赖预配凭据、动态拉取并验证 CIMD 文档，还是在兼容模式下执行旧版 DCR 握手。无论毕业项目最终选用了哪一条注册链路，客户端持有的所有凭据在底层都必须以 Issuer 为索引安全落盘（正如本课中 `CredentialStore` 演示的严密结构）。下一课将在此基础之上更进一步：一旦客户端在网络层完全证明了“自己是谁”，系统便将通过权限许可与最小特权原则，严格约束它在业务层“究竟允许做什么”。

## 核心术语

| 术语 (Term) | 核心内涵解释 |
|---|---|
| Client registration (客户端注册) | MCP 客户端在发起令牌申请前，获取能够被目标授权服务器合法识别的 Client ID 的标准流程 |
| Client ID Metadata Document (CIMD) | 由客户端自托管在 client_id 对应 HTTPS URL 上的元数据文档，授权服务器通过抓取该文档按需完成免握手身份核验 |
| Dynamic Client Registration (DCR) | 遵循 RFC 7591 的经典注册端点流；在现代 MCP 规范中已被正式废弃，仅用于向后兼容 |
| Pre-registration (预注册) | 客户端与授权服务器提前离线约定的静态凭据绑定模式，常见于单组织私有部署 |
| Authorization server binding | 客户端凭据强绑定准则：本地存储的凭据严格以签发它的 Issuer 唯一寻址，严禁跨授权中心复用 |
| `application_type` | DCR 注册核心入参（native 或 web）；指示 OIDC 授权中心该客户端所采用的合法回调地址形态 |
| Confused deputy (混淆代理人) | 代理网关使用单一静态 Client ID 代表下游多个独立客户端交互时，因缺乏针对特定客户端的独立授权而引发的安全漏洞 |
| Authorization extension | MCP 官方鉴权扩展能力，如 OAuth Client Credentials 或 Enterprise-Managed Authorization |

## 延伸阅读

- [MCP 规范 2026-07-28：客户端注册机制 (Client Registration)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration)
- [MCP 规范 2026-07-28：鉴权架构安全考量 (Security Considerations)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations)
- [MCP 官方鉴权扩展规范概述](https://modelcontextprotocol.io/extensions/auth/overview)
- [OAuth 客户端凭据扩展 (OAuth Client Credentials)](https://modelcontextprotocol.io/extensions/auth/oauth-client-credentials)
- [企业集中管控鉴权扩展 (Enterprise-Managed Authorization)](https://modelcontextprotocol.io/extensions/auth/enterprise-managed-authorization)
- [SEP-991：基于 OAuth 客户端 ID 元数据文档实现 URL 模式动态注册](https://modelcontextprotocol.io/seps/991-enable-url-based-client-registration-using-oauth-c)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 12 章节
