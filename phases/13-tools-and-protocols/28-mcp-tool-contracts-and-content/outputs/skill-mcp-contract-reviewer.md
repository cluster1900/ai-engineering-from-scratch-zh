---
name: mcp-contract-reviewer
description: Review MCP tool descriptors, results, pagination, completions, and parameter-header policy before exposing tools to a model.
version: 1.0.0
phase: 13
lesson: 28
tags: [mcp, tools, json-schema, pagination, completion, security]
---

依据协议版本 `2026-07-28`，审查提供的 MCP 工具接口。

若缺少以下输入，请要求补充：

1. 完整的 `tools/list` 描述符分页，包括每个 `nextCursor` 字段。
2. 每个工具至少一个成功结果和一个失败结果。
3. Streamable HTTP 参数到请求头的映射（如果使用）。
4. 补全引用、调用方类别和建议示例。
5. 可能改变可见工具集合的授权上下文。

生成简洁报告，包含以下章节。

<a id="descriptor-admission"></a>

## 描述符准入

对每个工具：

- 验证名称非空且稳定；
- 要求对象类型的 `inputSchema`；
- 识别 JSON Schema 方言，省略时默认为 2020-12；
- 存在 `outputSchema` 时进行验证；
- 将注解列为不可信提示，而非策略；
- 返回 `ADMIT`、`REJECT` 或 `CONDITIONAL`，附一条准确原因。

拒绝格式错误的描述符时，不应连带拒绝无关的有效工具。

<a id="result-contract"></a>

## 结果契约

对每个完整结果，包括 `isError: true` 的结果：

- 要求 `resultType: complete`；
- 按类型验证每个内容块；
- 将 `structuredContent` 视为任意 JSON 值，而非仅限对象；
- 存在 `outputSchema` 时，要求提供 `structuredContent` 且符合该模式；
- 要求结构化结果提供兼容性文本块；
- 区分资源链接与嵌入资源；
- 说明大小和媒体类型限制。

将格式错误的请求归类为 JSON-RPC 错误。将可采取后续行动的执行失败
归类为带有 `isError: true` 的完整结果，且不能绕过已发布的输出契约。

<a id="parameter-headers"></a>

## 参数请求头

对每个 `x-mcp-header`：

- 要求有效且非空的 HTTP 字段名 token；
- 要求名称不区分大小写且唯一；
- 要求类型为字符串、整数或布尔值；
- 遍历整个输入模式，包括嵌套属性、组合器、数组项和 `$ref` 使用的定义；
- 仅允许在 `inputSchema.properties` 的直接成员上使用该注解，
  拒绝出现在其他位置或 `outputSchema` 中的任何此类注解；
- 拒绝 `number` 类型，以及超出 `-9007199254740991` 到
  `9007199254740991` 范围的整数；
- 依据部署策略拒绝凭据、令牌、秘密、密码、授权和个人身份信息字段；
- 仅当值是非空可见 ASCII 且不以 `=?base64?` 开头时，才直接传输；
- 否则严格输出 `=?base64?{Base64UTF8}?=`，不裁剪或规范化原值；
- 对 Unicode、空串、空白、控制字符、CR 或 LF、带前后填充空白及类似哨兵标记的字符串编码，
  布尔值则渲染为小写文本；
- 在 HTTP 边界解码已识别的 `Mcp-Param-*` 值，不区分大小写比较请求头名称，
  将解码值与 JSON 正文严格比较；缺失、重复、多余、格式错误或不匹配时，
  返回 HTTP `400` 加 JSON-RPC `-32020`；
- 只记录最终请求头名称和拒绝类别，不记录参数值或编码载荷。

<a id="pagination"></a>

## 分页

追踪每次列表请求。只要 `nextCursor` 存在且非 null，就继续获取，即使它是空字符串。绝不解码、修改、递增、排序游标，或推导其含义。报告重复工具、缺失页面和不稳定排序。

<a id="completion"></a>

## 补全

对每个提示词或资源引用：

- 验证引用和参数；
- 根据调用方授权过滤建议；
- 将结果限制为最多 100 个值；
- 定义客户端防抖和服务器限流；
- 测试不会泄露隐藏的租户、资源和环境名称。

<a id="verification-matrix"></a>

## 验证矩阵

至少返回以下检查：

| 检查 | 样例 | 预期结果 |
|------|---------|-----------------|
| 非对象结构化输出 | 有效的数组、标量或 null 模式 | 符合模式时接受 |
| 输出不匹配 | JSON 类型错误或缺少属性 | 在交给模型使用前拒绝 |
| 错误输出不匹配 | `isError: true` 且结构化内容缺失或无效 | 在交给模型使用前拒绝 |
| 空游标 | `nextCursor: ""` | 后续请求原样发送游标 |
| 不安全请求头 | 令牌或无效字段名 | 拒绝描述符 |
| 嵌套请求头注解 | `oneOf`、`items`、嵌套对象或 `$ref` 定义 | 在全树准入检查时拒绝描述符 |
| 编码请求头值 | Unicode、换行、前后填充空白或类似哨兵标记的文本 | 准确的 base64 UTF-8 哨兵格式可无损还原原值 |
| 整数请求头值 | 两个安全边界值及分别超出边界的一个值 | 安全边界通过；不安全值被拒绝 |
| 请求头与正文一致性 | 大小写变体、副本缺失、解码后不匹配 | 大小写变体通过；缺失或不匹配返回 HTTP 400 和 JSON-RPC -32020 |
| 混合内容 | 文本、媒体、链接、嵌入资源 | 每个块独立验证 |
| 补全隔离 | 低权限调用方 | 不返回特权建议 |
| 错误分层 | 未知工具和业务失败 | JSON-RPC 错误与 `isError: true` 保持区分 |

如果证据仅包含一次成功的工具调用，拒绝批准。必须提供发现分页、准入决策和已验证的结果样例。
