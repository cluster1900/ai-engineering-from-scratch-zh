---
name: mcp-contract-reviewer
description: 在向 Model 暴露 Tool 前，审查 MCP Tool 描述符、结果、分页、补全和参数 Header 策略。
version: 1.0.0
phase: 13
lesson: 28
tags: [mcp, tools, json-schema, pagination, completion, security]
---

依据协议版本 `2026-07-28` 审查所提供的 MCP Tool 接口。

如果缺少以下输入，请要求提供：

1. 完整的 `tools/list` 描述符分页，包括每个 `nextCursor` 字段。
2. 每个 Tool 至少一个成功结果和一个失败结果。
3. Streamable HTTP 参数 Header 映射（如果使用）。
4. 补全引用、调用方类别和建议示例。
5. 可能改变可见 Tool 集合的授权 Context。

生成一份包含以下章节的精简报告。

## 描述符准入

对于每个 Tool：

- 验证名称非空且稳定；
- 要求 `inputSchema` 为 object；
- 识别 JSON Schema 方言，省略时默认为 2020-12；
- 验证存在的 `outputSchema`；
- 将 annotations 列为不可信提示，而不是策略；
- 返回 `ADMIT`、`REJECT` 或 `CONDITIONAL`，并给出一个明确原因。

拒绝一个格式错误的描述符时，不得拒绝无关的有效 Tool。

## 结果契约

对于每个完整结果，包括 `isError: true` 的结果：

- 要求 `resultType: complete`；
- 按类型验证每个 content block；
- 将 `structuredContent` 视为任意 JSON value，而非仅限 object；
- 存在 `outputSchema` 时，要求提供 `structuredContent` 并符合该 schema；
- 对结构化结果要求提供兼容性 text block；
- 区分 resource link 和 embedded resource；
- 说明大小和 media type 限制。

将格式错误的请求归类为 JSON-RPC errors。将可处理的执行失败归类为带有 `isError: true` 的完整结果，同时不得绕过已发布的输出契约。

## 参数 Header

对于每个 `x-mcp-header`：

- 要求使用有效且非空的 HTTP field-name token；
- 要求名称不区分大小写且唯一；
- 要求类型为 string、integer 或 boolean；
- 遍历整个输入 schema，包括嵌套 properties、combinators、array items，以及由 `$ref` 使用的 definitions；
- 仅允许 annotation 出现在 `inputSchema.properties` 的直接成员上，拒绝在其他位置或 `outputSchema` 中发现的所有此类 annotation；
- 拒绝 `number`，以及超出 `-9007199254740991` 至 `9007199254740991` 范围的 integer value；
- 根据部署策略，拒绝 credential、token、secret、password、authorization 和 PII 字段；
- 仅当值是非空、可见的 ASCII 且不以 `=?base64?` 开头时，才直接传输该值；
- 否则，必须准确输出 `=?base64?{Base64UTF8}?=`，不得裁剪或规范化原始值；
- 对 Unicode、空字符串、空白字符、控制字符、CR 或 LF、带 padding 的字符串以及外观类似 sentinel 的字符串进行编码，并将 boolean 渲染为小写文本；
- 在 HTTP 边界，解码可识别的 `Mcp-Param-*` 值，以不区分大小写的方式比较 Header 名称，并将解码后的值与 JSON body 进行精确比较；若副本缺失、重复、意外出现、格式错误或不匹配，则以 HTTP `400` 加 JSON-RPC `-32020` 拒绝；
- 记录最终 Header 名称和拒绝类别，绝不记录参数值或编码后的 payload。

## 分页

追踪每个 list 请求。只要 `nextCursor` 存在且非 null，就继续请求，包括其为空字符串时。绝不解码、修改、递增、排序 cursor，也不从中推导含义。报告重复 Tool、缺失分页和不稳定排序。

## 补全

对于每个 Prompt 或 resource 引用：

- 验证引用和参数；
- 根据调用方授权过滤建议；
- 将结果限制为最多 100 个值；
- 定义客户端 debounce 和服务端速率限制；
- 测试隐藏的 tenant、resource 和 environment 名称不会泄露。

## 验证 Matrix

至少返回以下检查：

| 检查 | Fixture | 预期结果 |
|------|---------|-----------------|
| 非 object 结构化输出 | 有效的 array、scalar 或 null schema | 符合 schema 时接受 |
| 输出不匹配 | JSON type 错误或缺少 property | 在交给 Model 使用前拒绝 |
| 错误输出不匹配 | `isError: true` 且结构化内容缺失或无效 | 在交给 Model 使用前拒绝 |
| 空 cursor | `nextCursor: ""` | 后续请求发送完全相同的 cursor |
| 不安全的 Header | Token 或无效 field name | 拒绝描述符 |
| 嵌套 Header annotation | `oneOf`、`items`、嵌套 object 或 `$ref` definition | 在全树准入期间拒绝描述符 |
| 编码后的 Header 值 | Unicode、换行符、padding 或外观类似 sentinel 的文本 | 精确的 base64 UTF-8 sentinel 可往返还原原始值 |
| Integer Header 值 | 两个安全边界值及各自超出边界的一个值 | 安全边界值通过；不安全值被拒绝 |
| Header 与 body 一致性 | 大小写变体、缺失副本和解码后不匹配 | 大小写变体通过；缺失或不匹配返回 HTTP 400 和 JSON-RPC -32020 |
| 混合内容 | Text、media、link、embedded resource | 独立验证每个 block |
| 补全隔离 | 低权限调用方 | 不返回任何特权建议 |
| 错误分层 | 未知 Tool 和业务失败 | JSON-RPC error 与 `isError: true` 保持区分 |

当证据仅包含一次成功的 Tool 调用时，拒绝批准。要求提供发现分页、准入决策和经过验证的结果 Fixture。
