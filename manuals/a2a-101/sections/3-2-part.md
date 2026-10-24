# Part

> A2A 中的每一块内容都是一个 `Part`，它恰好包含 `text`、`raw`、`url` 或 `data` 之一，它的 `mediaType` 说明如何读取它。

你的 planner 请 `code-reviewer` 审查一个 diff。请求带有一条指令和作为文件的 diff，回答带有 planner 自己的代码要解析的发现。A2A 用同一种容器形状，即 part，承载这三者，并给每一个标上媒体类型。

读完本节后，你能构建全部四种 part，并预测 agent 是否会接受它们。

## 一种容器，四种内容 {#s-part-one-container-four-contents}

**Part：** 消息或 artifact 中最小的内容单元 {{spec §2.2}}。在 proto 中，`Part` 把它的内容声明为一个有四个成员的 `oneof` {{proto Part}}：

- `text` 存放一个字符串。
- `raw` 存放一个文件的字节。在 JSON 中，这些字节是一个 base64 字符串 {{proto Part}}。
- `url` 存放一个指向文件内容的 URL {{proto Part}}。
- `data` 以 JSON 形式存放任意结构化的值：对象、数组、字符串、数字、布尔值或 null {{proto Part}}。

内容旁边有三个可选字段：`mediaType`、`filename` 和 `metadata`，`mediaType` 适用于每种 part {{proto Part}}。kit 的审查请求在一条消息中发送了两种 part：

```listing
title: one message, two kinds of part
source: capture/out/06-input-required.http
lang: json
note: The parts array of the planner's first message to code-reviewer. The base64 value of raw is cut after 36 of its 236 characters.
---
      "parts": [
        {
          "text": "Review this diff of payments-api."
        },
        {
          "raw": "LS0tIGEvcGF5bWVudHMvcmVmdW5kcy5weQor…",
          "filename": "refunds.diff",
          "mediaType": "text/x-diff"
        }
      ]
```

base64 会增加体积：`payments/refunds.py` 的 175 字节 diff 在 JSON body 中变成 236 个字符。`url` part 让消息保持小巧，并把下载及其风险留给接收方。

## 没有 kind，没有嵌套 {#s-part-no-kind-no-nesting}

在 0.3 版中，part 用一个 `kind` 字段说明它的类型，并把文件包在一个嵌套的 `file` 对象里。1.0 版把两者都移除了。`kind` 字段不再属于协议，发送方不应写入它 {{spec §A.2.1}}。

文件 part 是扁平的：`raw` 或 `url` 与 `filename` 和 `mediaType` 并列。规范自己的文件 part 示例是这种形状，但不是有效的 JSON {{spec §6.7}}（[冲突 D24](#s-ref-sources)）。从 proto 复制 part 的形状，绝不从示例复制。

通过检查存在哪个内容成员来读取 part，绝不发送其中两个。参考 SDK 在任何 agent 代码运行之前，就以无效参数 `-32602` 拒绝带两个成员的 part {{sdk src/a2a/server/routes/jsonrpc_dispatcher.py}}。它会忽略多余的 `kind`，正如规范所要求的：实现应忽略它不认识的字段 {{spec §5.7}}。

```figure
id: fig-four-parts
kind: structure
title: four kinds of part from the kit
claim: The kit's captures use all four kinds of part, and only the `image/png` part fails, because `code-reviewer` does not accept that media type.
caption: The top row is the shape of every part. Each row below is one captured part, in the order the captures sent them. Its content member is on the left, its media type in green, and its sender underneath. The review.json artifact holds a text part for a person and a data part for code. From capture/out/06-input-required.http and capture/out/11-errors.http.
```

## 谁声明媒体类型 {#s-part-who-declares-media-types}

媒体类型在四个地方声明，skill 的 mode 会覆盖 card 的默认值 {{proto AgentSkill}}：

| 字段 | 位于 | 设置方 | kit 中的 `code-reviewer` |
|---|---|---|---|
| `defaultInputModes` | agent card | agent | `text/plain`、`text/x-diff` |
| `defaultOutputModes` | agent card | agent | `text/plain`、`application/json` |
| `inputModes`、`outputModes` | card 上的每个 skill | agent | `review-diff` 接受 `text/x-diff` 和 `text/plain` |
| `acceptedOutputModes` | 一次发送的 `configuration` | 客户端 | kit 中任何地方都没有发送 |
| `mediaType` | 每个 part | 发送该 part 的一方 | `refunds.diff` 上的 `text/x-diff` |

客户端唯一的字段是 `acceptedOutputModes`，对 agent 的规则是 SHOULD。agent 应使用这个字段来调整它的输出 {{proto SendMessageConfiguration}}。SDK 的请求处理器从不读取这个字段 {{sdk src/a2a/server/request_handlers/default_request_handler_v2.py}}，所以要检查你收到的每个 part 的 `mediaType`。

## 媒体类型不匹配时 {#s-part-when-the-media-type-does-not-fit}

**ContentTypeNotSupportedError：** agent 或被调用的 skill 不支持消息 part 给出的或 artifact 隐含的某个媒体类型 {{spec §3.3.2}}。它的 JSON-RPC 代码是 `-32005` {{spec §5.4}}，[错误](#s-errors)一节给出它的其他形式。

在 kit 中，planner 把一张截图作为标为 `image/png` 的 `url` part 发给 `code-reviewer`，agent 在创建任务之前就拒绝了：

```listing
title: a media type the agent does not accept
source: capture/out/11-errors.http
lang: json
note: Exchange 5, cut to the part that was sent and the error that came back inside an HTTP 200 response.
---
      "parts": [
        {
          "url": "https://example.com/screenshot.png",
          "mediaType": "image/png"
        }
      ]
…
  "error": {
    "code": -32005,
    "message": "Content type not supported",
    "data": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "CONTENT_TYPE_NOT_SUPPORTED",
        "domain": "a2a-protocol.org",
        "metadata": {
          "mediaType": "image/png"
        }
```

各服务器的检查方式不同，因为规范没有给未标注的 part 指定默认类型。SDK 只在服务器开启检查时才检查，而且会跳过每个没有 `mediaType` 的 part {{sdk src/a2a/utils/input_mode_validator.py}}。kit 给这样的 part 一个默认类型，并对照 card 的 `defaultInputModes` 检查它，[kit 的 README](manuals/a2a-101/capture/README.md) 列出了这一点。同一个未标注的 part 可能在一个服务器上通过，在另一个上失败。

安全规则要求 agent 拒绝它们没有预料到的媒体类型 {{spec §13.4}}。`url` part 必须经过服务端请求伪造的检查 {{spec §14.1.1}}，[安全要求](#s-security-requirements)一节解释了这一点。

```takeaways
- 根据 part 包含的内容成员读取它，绝不发送两个成员或 `kind` 字段。
- 在每个 part 上设置 `mediaType`，只使用 card 或 skill 列出的媒体类型。
- 把代码要解析的内容放进 `data` part。
- 把 `-32005` 视为关于内容的结论：修改 part，或者换一个 agent。
```

Sources: spec §2.2, §3.3.2, §5.4, §5.7, §6.7, §13.4, §14.1.1, §A.2.1 (research/sources/specification.md); proto Part, AgentCard, AgentSkill, SendMessageConfiguration (research/sources/a2a.proto); sdk src/a2a/server/routes/jsonrpc_dispatcher.py, src/a2a/server/request_handlers/default_request_handler_v2.py, src/a2a/utils/input_mode_validator.py at a2a-python 1.2.2; capture/out/01-agent-cards.http, 06-input-required.http, 11-errors.http; capture/a2a_ref.py, capture/README.md
