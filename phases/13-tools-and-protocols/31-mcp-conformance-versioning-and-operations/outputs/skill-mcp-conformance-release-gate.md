---
name: mcp-conformance-release-gate
description: 构建 MCP 一致性 Matrix，并基于证据作出推进、暂停或回滚决策。
version: 1.0.0
phase: 13
lesson: 31
tags: [mcp, conformance, versioning, transcripts, proxy, operations]
---

给定一项 MCP client、server、gateway、SDK 或 transport 变更，生成 wire-level 一致性套件，并基于脱敏证据作出发布决策。

## 必需输入

- 支持的现代和旧版协议版本，以及每个部署目标对应的策略。
- SDK 解码前的原始请求和响应捕获点。
- 镜像的 HTTP header、JSON-RPC body、status、content type 和中间层拓扑。
- 声明的 client、server 和扩展 capability。
- SDK 名称、版本、规范化后的值和异常。
- 健康度阈值、canary 窗口、最小样本数和基线测量结果。
- 精确的回滚版本、准入证据摘要、SHA-256 artifact 和 descriptor pin、Registry 状态、当前健康度、可信发布签名者，以及覆盖完整回滚 payload 的 attestation。
- 脱敏、保留和证据访问策略。

## 流程

1. 明确定义协议时代。在现代分支中要求使用完全匹配的 `io.modelcontextprotocol/protocolVersion` 和 `io.modelcontextprotocol/clientCapabilities` key。将截至 `2025-11-25` 的初始化时代行为放入单独的旧版 adapter。
2. 为每个目标选择严格或有界 fallback 策略。成功的 `server/discover` 或可识别的现代错误能够证明现代分支。超时或空响应不能证明任何事情。仅允许对已配置或列入 allowlist 的 endpoint 执行旧版探测，并且只有在验证与固定旧版 revision 对应的 `initialize` 结果为正向结果后，才能选择旧版。出现 `-32020`、`-32021` 或 `-32022` 后绝不降级。
3. 为已接受的请求、有效的 method-specific 结果、已声明的扩展结果、选定的旧版行为，以及 notification 不返回响应这一不变量创建 golden transcript。
4. 为以下情况创建 negative transcript：格式错误的 envelope、响应版本或 ID 不匹配、result 与 error 未保持互斥、格式错误的 error、不正确的 HTTP 映射、缺少 metadata、header 与 body 不匹配、缺少 server error 响应、不支持的版本、缺少现代 `resultType`、格式错误的 method payload、未知或未声明的 result type，以及禁止出现的 notification 响应。只要本地验证观察到 `HeaderMismatch`，就必须自动要求并从结构上验证实际的 HTTP 400 JSON-RPC `-32020` 响应。仅有本地异常绝不能让该 case 通过。
5. 首先验证 JSON-RPC metadata 类型。以不区分大小写的方式匹配 HTTP header 名称，拒绝相互冲突的重复项，对不安全的 `Mcp-Name` 值执行精确的 Base64 sentinel 解码，然后在检查匹配值是否受支持之前，将 `MCP-Protocol-Version`、`Mcp-Method` 以及适用的 `Mcp-Name` 值与 body 进行比较。将前导或尾随空白视为不安全内容；如果以原始形式发送，即使它与 body 值相同，也应拒绝。
6. 接受已知的现代 `complete` 和 `input_required` 结果。仅当其 capability 已声明时，才接受扩展 discriminator。拒绝所有未知或未声明的 `resultType`。随后验证 method payload，包括 `tools/list` 的完整 Tool descriptor、task 结果所需的 lifecycle 字段，以及 `completion/complete` 的有界字符串值 completion object。
7. 在证据中保留原始的附加 result 和 `_meta` 字段。明确决定每个组件是可以忽略这些字段，还是必须转发这些字段。
8. 通过每个已发布的 SDK 运行所有高风险 transcript。将原始 wire 语义与规范化后的返回值进行比较，并报告每个被合并提升、移除、合成或更改的字段。
9. 直接运行套件，并通过每个生产中间层运行套件。捕获已脱敏的 ingress、origin 和 egress 证据。检测 status 折叠、JSON-RPC body 重写、routing header 不匹配、缓冲和 content negotiation 变更。
10. 在序列化、哈希、日志记录或上传之前应用脱敏。对字段名和 header 名称执行 case-fold 并移除分隔符，使 camelCase、连字符、下划线和点号变体共用同一 denylist；随后移除 `Authorization`、`Set-Cookie`、`X-Api-Key`、`accessToken`、`clientSecret` 和 `registrationAccessToken` 等凭证，以及 method-specific 敏感参数。对脱敏后的证据包进行哈希。
11. 使用非空的确定性 transcript、SDK 差异和 proxy 证据，以及预先声明且最小样本数为正数的健康度窗口评估候选版本。要求每个来源都提供有效的证据摘要。缺失的边界表示 gate 失败，而不是一个可通过的空列表。
12. 推进之前，验证一个精确、已准入、已固定、处于 active 状态且健康的回滚目标。验证精确的字段类型和 SHA-256 摘要，然后使用可信的 release-controller 身份以密码学方式验证其 attestation。只有当一致性、SDK、proxy、健康度和回滚就绪证据全部通过时，才能推进。候选版本失败时，只能回滚到该已验证目标。否则暂停发布。

## 必需 Matrix

对于每个 case，报告：

- 稳定的 case 名称和规范性不变量
- 协议时代和选择证据
- client、server、SDK、proxy 和 build 版本
- 预期 status、响应结构、result type 或 error code
- 观察到的 ingress、origin 和 egress 证据摘要
- SDK 规范化差异
- 每个边界的通过或失败状态
- 脱敏策略版本
- 最终 reason code

至少包含以下 case：

- golden 现代 discovery 或 method call
- 带附加字段的 golden 已知 complete 结果
- 在选定旧版时代中缺少 `resultType` 的 golden 旧版结果
- golden 已声明扩展结果
- golden 有效 `completion/complete` 结果
- 不返回 JSON-RPC 响应的 golden notification
- negative header 与 body 不匹配
- negative 缺少 capability
- negative 不支持匹配到的版本
- negative 缺少现代 `resultType`
- negative 未知或未声明的 `resultType`
- negative proxy status 或 body 转换
- negative SDK 语义字段丢失
- negative 格式错误的 `completion/complete` 结果

## 硬性拒绝条件

- 在没有原始 wire 证据的情况下，根据 SDK 返回值声称符合一致性要求。
- 使用一个 parser 静默接受现代和旧版两种结构。
- 出现可识别的现代错误后 fallback 到旧版。
- 仅根据超时、静默、连接关闭或无法识别的响应 fallback 到旧版。
- 在未捕获并验证 server error 响应的情况下，让 negative request case 通过。
- 本地检测到 `HeaderMismatch` 后，将 HTTP 400 JSON-RPC `-32020` 证据设为可选。
- 在选择旧版时代之前，对缺少 `resultType` 的结果推断为 complete。
- 将未知 discriminator 视为 complete。
- 在没有 reserved-field 理由的情况下拒绝所有未知附加字段。
- 向 notification 发送任何 JSON-RPC 响应。
- 在未验证 method-specific payload 的情况下接受已知 `resultType`。
- 在未检查镜像 header 与 body 是否相等的情况下授权它们。
- 将 HTTP 字段名称视为区分大小写，或未进行精确 sentinel 解码就比较编码后的 `Mcp-Name`。
- 接受带有前导或尾随空白的原始 `Mcp-Name`，而不是要求使用 sentinel 编码。
- 接受不含有效有界字符串值 completion object 的 completion 结果。
- 将 proxy 生成的 500 视为等同于 origin protocol error。
- 将 bearer token、cookie、secret 或敏感参数写入证据。
- 使用会让 camelCase 或分隔符变体绕过规范 credential denylist 的脱敏规范化方式。
- 将零样本 canary 声明为健康。
- 将空的 transcript、SDK 或 proxy 证据视为通过边界。
- 将 truthy string 或未经身份验证的回滚 dictionary 视为已验证证据。
- 回滚到缺少精确准入、pin、状态和健康度证据的版本。
- 在证明存在健康的回滚目标之前推进生产候选版本。

## 输出

返回以下章节：

1. 时代策略：现代行为证明、严格目标、有界 fallback 触发条件和禁止降级的信号。
2. Transcript Matrix：包含预期 wire 结果的 golden 和 negative case。
3. 结果兼容性：核心 discriminator、已声明扩展、附加字段策略和旧版推断边界。
4. SDK 差异：原始摘要和规范化摘要，以及被合并提升、移除、合成和更改的字段。
5. Proxy 证据：ingress、origin 和 egress 结果，以及发生失败的精确 hop。
6. 脱敏报告：策略版本、已移除的字段类别和脱敏后的证据摘要。
7. 健康度窗口：样本数、错误率、延迟、饱和度、持续时间、阈值和基线比较。
8. 回滚证明：精确目标、准入摘要、pin、Registry 状态、健康度、签名者身份、已验证 attestation 和路由恢复计划。
9. 决策：`promote`、`hold` 或 `rollback`，并附带稳定的 reason code 和完整证据摘要。

以第一个失败的边界结尾。如果所有边界均通过，则说明授权全面推进的 canary 完成条件。
