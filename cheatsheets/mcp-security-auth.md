---
id: mcp-security-auth
title: MCP Security and Authorization
code: SA
subtitle: 定位并修复 token 拒绝、被投毒的工具元数据和注入内容。CIMD、PKCE、iss、audience 与 PVE 检查。
hue: 350
sources: phases/13-tools-and-protocols/15-mcp-security-tool-poisoning, phases/13-tools-and-protocols/16-mcp-security-oauth-2-1, phases/13-tools-and-protocols/18-mcp-auth-production, phases/14-agent-engineering/27-prompt-injection-defense
source_hash: 697206fef977f478
---

## Token 拒绝
type: troubleshooting
from: phases/13-tools-and-protocols/18-mcp-auth-production/code/main.py, phases/13-tools-and-protocols/18-mcp-auth-production/docs/en.md, phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 401 `malformed` | Token 无法解码 | 在 `Authorization` 中发送有效 JWT |
| 401 `iss not allowed` | 签发方不在 `allowed_issuers` 中 | 只信任 `authorization_servers` 中的签发方 |
| 401 `unknown kid` | 重新获取一次后仍缺少密钥 | 修复 JWKS 刷新任务 |
| 401 `bad signature` | 签名校验失败 | 拒绝。没有兜底 |
| 401 `audience mismatch` | Token 属于另一个资源 | 用本资源的 `resource` 重新申请 |
| 401 `expired` | `exp` 已过去 | 获取新 token |
| 403 `insufficient_scope` | 工具需要更大的 scope | 用合并后的 scope 升级，新 id |
| 换密钥后有效 token 失败 | JWKS 缓存过期 | 定时刷新，未命中时再获取一次 |

## 网关与内容发现
type: troubleshooting
from: phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/code/main.py, phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/docs/en.md, phases/14-agent-engineering/27-prompt-injection-defense/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `metadata_poisoning` 发现 | 描述中命中扫描规则 | 拦截并审查完整描述符 |
| `rug_pull` 发现 | 已批准的描述符发生变化 | 隔离直到重新批准 |
| `unapproved` 发现 | 该键没有已批准的摘要 | 隔离直到审查 |
| `shadowing` 发现 | 两个服务器暴露同一名称 | 加命名空间，例如 `notes.search` |
| `-32020` | `Mcp-Method` 或 `Mcp-Name` 与 body 不一致 | 在路由、RBAC 和限流之前拒绝 |
| 表单请求返回 `-32021` | 客户端只声明了 URL 型 elicitation | 声明 `elicitation` 表单支持 |
| 确认后重试被拒 | `requestState` 绑定了其他参数 | 重新请求确认 |
| agent 听从网页指令 | 检索内容没有来源标签 | 给内容打标签并校验每次工具调用 |

## 资源服务器上的校验顺序
type: flow
from: phases/13-tools-and-protocols/18-mcp-auth-production/code/main.py

1. **解码**：`jwt_decode` 失败。返回 401 malformed。
2. **签发方**：`iss` 不在 `allowed_issuers` 中。在任何 JWKS 获取之前返回 401。
3. **密钥**：在 `jwks_cache` 中查找 `kid`。未命中时调用一次 `refresh_jwks`。
4. **签名**：`jwt_verify` 失败。返回 401 bad signature。
5. **受众**：`aud` 不是本资源。返回 401 audience mismatch。
6. **过期**：`exp` 已过去。返回 401 expired。
7. **Scope**：缺少所需 scope。返回 403 `insufficient_scope` 并附上该 scope。

## 带 PKCE 的授权码流程
type: flow
from: phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/docs/en.md, phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/code/main.py

1. **客户端**：获取受保护资源元数据。选择一个公布的签发方。
2. **客户端**：用 `pkce_pair` 生成 `code_verifier` 及其 S256 `code_challenge`。
3. **客户端**：发送 `client_id`、`redirect_uri`、`scope`、`code_challenge` 和 `resource`。
4. **授权服务器**：返回 `code` 和 `iss`。
5. **客户端**：把 `iss` 与记录的签发方精确比较。不一致则丢弃响应。
6. **客户端**：用 `code_verifier`、相同的重定向 URI 和 `resource` 兑换授权码。
7. **客户端**：把 token 存在 `tokens_by_issuer_resource` 中的 `(issuer, resource)` 下。

## 代码中的任务
type: task-table
from: phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/code/main.py, phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/code/main.py, phases/13-tools-and-protocols/18-mcp-auth-production/code/main.py, phases/13-tools-and-protocols/18-mcp-auth-production/docs/en.md

| 任务 | 代码 |
|---|---|
| 固定整个描述符 | `descriptor_digest(tool)` |
| 对照固定版本扫描目录 | `scan_catalog(catalog, approved)` |
| 扫描一条描述 | `scan_description(description)` |
| 生成 PKCE 对 | `verifier, challenge = pkce_pair()` |
| 收到 403 时升级 scope | `client.call_with_step_up(tool, server, auth)` |
| 校验 bearer token | `server.validate(bearer_token, required_scope=<s>)` |
| 重新获取密钥集 | `server.refresh_jwks()` |
| 运行课程测试 | `python3 -m unittest discover code/tests -v` |

## PVE：先校验再执行
type: annotated-code
lang: python
from: phases/14-agent-engineering/27-prompt-injection-defense/code/main.py

```python
validator = Validator(
    allowed_tools=("search", "send_message", "read_memory"),
    sensitive_tools=("send_message",))
call = ToolCall("search", {"query": "<query>"}, intent="research")
contents = [Content("<text>", "user_message")]  # user text is not scanned
ok, reason = validator.assess(call, contents)   # allowlist, args, retrieved text
if ok:
    executor.run(call)                          # runs only after approval
looks_like_directive("<text>")                  # first marker hit or None
memory_write_guard(MemoryWrite("<text>"))       # refuses directive-shaped writes
```

## 客户端注册方式
type: comparison
from: phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/docs/en.md, phases/13-tools-and-protocols/18-mcp-auth-production/docs/en.md

| 因素 | 预注册 | CIMD | DCR |
|---|---|---|---|
| 状态 | 若有则优先使用 | 推荐 | 已弃用的兜底方案 |
| Client id | 由运营方提供 | 带路径的 HTTPS URL | 由 `POST /register` 签发 |
| AS 信号 | 已知关系 | `client_id_metadata_document_supported` | `registration_endpoint` |
| `application_type` | 不需要 | 可选 | 必需：`native` 或 `web` |
| 新签发方 | 新凭据 | URL 可移植 | 重新注册 |
| 主要风险 | 在新签发方处复用 | 获取时的 SSRF | 注册垃圾、token 窃取 |

## 七类攻击面
type: concepts
from: phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/docs/en.md

- **元数据投毒**：描述中包含与工具无关的指令。
- **描述符偷换（rug pull）**：已批准的名称、描述、schema 或注解发生变化。
- **跨服务器遮蔽**：两个后端暴露同一个未限定名称。
- **header 与 body 混淆**：`Mcp-Method` 或 `Mcp-Name` 与 body 不一致。
- **能力提升**：把声明的功能当作授权。
- **MRTR 状态篡改**：被修改的 `requestState` 或被复用的确认。
- **身份混淆**：把熟悉的显示名称当作发布者证明。

## 规则
type: tips
from: phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/docs/en.md, phases/13-tools-and-protocols/18-mcp-auth-production/docs/en.md, phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/docs/en.md

- 每次请求都在 `Authorization` header 中发送 bearer token。绝不放在 URL 中。
- 不要给本地 stdio 服务器加 OAuth 流程。
- 绝不把 MCP token 转发给下游 API。另取一个 token。
- 精确比较 `iss`。不做大小写折叠，不改斜杠或端口。
- 资源服务器刷新 JWKS。只有授权服务器轮换密钥。
- introspection 不可用时失败即关闭。网络故障绝不等于 `active: true`。
- 二选规则：一个步骤绝不同时包含不可信输入、敏感数据和外部操作。

## 问答
type: qa
from: phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/docs/en.md, phases/13-tools-and-protocols/18-mcp-auth-production/docs/en.md, phases/14-agent-engineering/27-prompt-injection-defense/docs/en.md

- **`clientInfo` 是身份吗？** 不是。它是自报的。
- **哈希固定能证明工具安全吗？** 不能。它只证明稳定。
- **PKCE 能阻止混淆攻击吗？** 不能。客户端必须校验 `iss`。
- **客户端 capabilities 授予访问权吗？** 不。它们只声明兼容性。
- **在 prompt 里写“忽略不可信指令”就够了吗？** 不够。那不是强制措施。

## 缩写
type: glossary
from: phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/docs/en.md, phases/13-tools-and-protocols/18-mcp-auth-production/docs/en.md, phases/14-agent-engineering/27-prompt-injection-defense/docs/en.md

- **CIMD**：Client ID Metadata Document。它的 HTTPS URL 就是 client id。
- **DCR**：Dynamic Client Registration。RFC 7591，已弃用。
- **PKCE**：保护授权码的 verifier 和 S256 challenge。
- **JWKS**：JSON Web Key Set，从 `jwks_uri` 获取，按 `kid` 索引。
- **RFC 9728**：受保护资源元数据。指明授权服务器。
- **RFC 8707**：资源指示符。把 token 绑定到一个 MCP 资源。
- **RFC 9207**：授权响应中的 `iss`。阻止混淆攻击。
- **PVE**：Prompt-Validator-Executor。在主模型之前用廉价的校验器。
