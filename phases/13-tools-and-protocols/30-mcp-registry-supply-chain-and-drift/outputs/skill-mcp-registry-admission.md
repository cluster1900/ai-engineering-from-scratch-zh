---
name: mcp-registry-admission
description: 使用供应链证据准入、固定、监控、隔离和回滚 MCP Registry 发布版本。
version: 1.0.0
phase: 13
lesson: 30
tags: [mcp, registry, provenance, admission, drift, rollback]
---

给定 MCP Registry 响应、已验证的发布者身份、产物证据、实时 server 观测结果和本地策略，生成准入决策和证据包。

## 必需输入

- Registry 来源、server 记录、由 Registry 管理的元数据和检索时间。
- 已验证的 namespace，以及建立该 namespace 的身份验证方法。
- package registry、标识符、精确版本、所有权结果和计算得出的产物 digest。
- 实时 `server/discover` 结果、协议版本、capabilities、诊断性 server 信息和完整的 Tool 描述符。
- 必需的 capabilities、禁止的 Tool 属性、审查者、证据保留策略和回滚策略。
- 先前已准入的 pins、当前路由、隔离状态和近期健康状况观测结果。

## 流程

1. 验证 Registry 记录结构。要求 name、version 和 description 非空，并至少包含一个 package 或 remote。将 Registry schema 版本与实时 MCP 协议版本视为相互独立的值。
2. 从响应级别的 `_meta["io.modelcontextprotocol.registry/official"].status` 读取由 Registry 管理的状态，而不是从直接的 `_meta.status` 或发布记录读取。除非状态为 `active`，否则拒绝自动准入。
3. 将 name namespace 与通过可信身份验证建立的 namespace 进行精确比较。拒绝前缀仿冒和空 slug。
4. 将一个声明的执行来源与已验证证据关联起来。对于 package，匹配 registry 类型、标识符、精确版本和 transport。对于仅含 remote 的记录，将 URL 和 transport 与独立验证的 endpoint 证据进行匹配。无论使用哪种来源，都要求提供可信的 SHA-256 证据 digest。
5. 对规范化的 Registry 记录执行 hash。对 provenance 对象执行 hash，该对象关联 Registry 来源、server name、Registry version、记录 digest、所选来源以及来源证据 digest。
6. 观测实时 endpoint。要求其提供可接受的协议版本、必需的 capabilities 和完整的 Tool 描述符。仅为显示、日志和调试保留结果中的 `_meta["io.modelcontextprotocol/serverInfo"]`。绝不将自行报告的 `serverInfo`（包括仅直接提供的别名）用作准入或安全权威。
7. 仅规范化语义上无序的集合。对完整的规范化描述符表面执行 hash，使 name、description、schema、annotation 或 Tool 集合的变化都会产生 drift。
8. 应用本地授权、数据、网络和审查策略。Registry 发布是证据，而不是本地批准。
9. 批准后，存储一个不可变 pin，其中包含记录、执行来源、provenance 和 Toolset digest。将批准状态与活动路由状态分开保存。
10. 将决策、理由、证据引用、上一条 ledger hash 和当前条目 hash 追加到准入 ledger。存储证据之前，先编辑掉凭据和敏感参数。
11. 按计划以及激活之前，对 Registry 状态和实时描述符执行核对。当状态变为 deprecated 或 deleted、来源证据发生变化或实时行为出现差异时，隔离并停用相应 pin。被隔离的 pin 绝不能作为回滚目标。
12. 只回滚到先前已准入、当前仍符合条件、健康且未被隔离的 pin。将路由恢复记录为新事件。绝不重写旧的发布记录或准入决策。

## 强制拒绝条件

- 信任仅来自熟悉的显示名称或存在于 Registry 中。
- 使用 `startswith` 检查 namespace，或仅信任提交记录自行声明的 namespace。
- 使用 `latest`、版本范围，或缺少产物 digest 的 package coordinates。
- 模仿由 Registry 管理的状态或验证信息的发布者字段。
- 缺失或格式错误的协议、capability 或描述符证据。
- 将自行报告的 `serverInfo` 视为 namespace、provenance、endpoint 或准入权威。
- drift 后静默更新描述符 pin。
- 激活 deprecated、deleted、unknown 或 quarantined 版本。
- 回滚到缺少完整准入证据的目标。
- ledger 证据中包含 bearer token、cookie、package 凭据或不必要的 Tool 参数。

## 输出

返回以下章节：

1. 决策：`approve`、`reject` 或 `quarantine`，并附带稳定的原因代码。
2. Namespace 证明：已验证的 namespace、身份验证来源和 name 精确比较结果。
3. 发布 Pin：Registry 来源、server name、精确版本、状态、schema 版本和记录 digest。
4. 来源 Pin：package coordinate 与 transport，或 remote URL 与 transport、所有权结果引用和来源证据 digest。
5. Runtime Pin：接受的协议版本、必需的 capabilities、Toolset digest，以及可选的诊断性 `serverInfo`。
6. Provenance 关联：规范字段和最终得到的 provenance digest。
7. 策略结果：每一项通过、失败和不适用的控制措施。
8. Ledger 事件：序号、时间、事件、结果、原因代码、证据引用、上一条 hash 和条目 hash。
9. 核对计划：下一次状态、产物、discovery、描述符和健康检查。
10. 回滚计划：符合条件的先前 pin、验证步骤、路由变更、健康观测窗口和需要保留的证据。

最后说明最可能改变决策的那一项缺失事实。如果没有缺失任何必需事实，则说明下一次计划执行的 drift 检查。
