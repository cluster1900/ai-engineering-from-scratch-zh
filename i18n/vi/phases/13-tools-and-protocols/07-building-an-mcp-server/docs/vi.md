# Construct MCP Server: không trạng thái Python và TypeScript

> 现代 MCP Server 绝不记住握手状态――它校验每个请求中的元数据,执行对应的处理器,并返回单个带有类型标识的结果――

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 13 · 06（MCP 基础）
**Time:** ~85 分钟

## Học mục tiêu

- Đối với MCP`2026-07-28`规范实现强制要求 `server/discover`Cách nào?
- Trong mỗi yêu cầu nhận được trên trường hợp hợp thức Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu điểm Ưu
- 以确定性排序暴露 Công cụ, Tài nguyên và Các yêu cầu 列表
- Trong kết quả đúng đắn trở lại `resultType`、Server Identity (tình dạng máy chủ) và缓存提示──
- Trong Python và TypeScript, thông qua việc thay đổi các đoạn chia chia các đoạn văn để thực hiện hoàn toàn giống nhau không trạng thái giao thức.

## 问题背景

Trong khi đó, các công trình này có thể được sử dụng để lưu trữ các dịch vụ của khách hàng sau khi nhận được thông tin đầu tiên.

MCP `2026-07-28`规范通过使**每个请求自描述** Giải quyết hoàn toàn vấn đề cấp độ thỏa thuận này. Ứng dụng của bạn vẫn có thể duy trì ghi chép dài hạn, nhiệm vụ hoặc trạng thái hiển nhiên.

Bài học này sẽ xây dựng một bản ghi nhớ Server:Python và phiên bản TypeScript chỉ sử dụng cơ sở chuẩn gốc của nó để thực hiện lõi giao thức, hai người sẽ phát hiện ra một cách tương tự hoàn toàn, và bắt buộc thực hiện một giao thức giao tiếp hoàn toàn giống nhau.

## 核心概念

### 现代请求分发循环(Dòng chuyển tiếp)

```text
读取一行 JSON-RPC 文本
解析外层 Envelope
若为通知（Notification），则不予响应
针对当前请求校验 params._meta
根据 method 执行路由分发
使用 resultType 与 serverInfo 封装成功结果
写回一行 JSON-RPC 响应文本
立即遗忘当前请求作用域的元数据
```

Trong chế độ studio, có 3 quy tắc quan trọng:

-  chỉ hướng đến stdout 写入 JSON-RPC 消息; tất cả các调试与诊断日志 phải hướng đến xuất khẩu đến stderr
- 报文换行符分隔, và thực hiện flush sau mỗi lần viết phản ứng.
- Khi bạn nhận được EOF, quá trình nên ngay lập tức xuất hiện.

Chu kỳ sống của quá trình chỉ đại diện cho thời gian sống của tầng truyền tải vật lý, không phải là phiên bản theo nghĩa của MCP hiện đại.

### Xin vui lòng tham khảo dữ liệu

Mỗi yêu cầu phải bao gồm:

```json
{
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "notes-client",
        "version": "1.0.0"
      }
    }
  }
}
```

前两个字段为强制项──`clientInfo`Nếu cung cấp dữ liệu danh tính, bạn có thể kiểm tra cấu trúc dữ liệu của nó, nhưng không thể coi nó là chứng chỉ an ninh.

Nếu phiên bản không được hỗ trợ, trả lại lỗi `-32022`Và đi kèm`requested`Với`supported` Nếu yêu cầu không có dữ liệu, thuộc về các tham số bất hợp pháp, trả về errorcode `-32602`Không thể hoàn thành được các dữ liệu giá trị thiếu sót trong lịch sử.

### 强制的服务发现(Mối khám phá bắt buộc)

现代 Server  phải thực hiện `server/discover`◊ Một dịch vụ đầy đủ kết quả phát hiện bao gồm được hỗ trợ phiên bản giao thức hiện đại  Server  năng lực tập hợp                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `_meta`Trung bộ máy chủ Identity ID:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": false},
    "resources": {"listChanged": false, "subscribe": false},
    "prompts": {"listChanged": false}
  },
  "ttlMs": 3600000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

服务发现并非解锁 Server 服务发现并非解锁 Server 服务发现并非解锁服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务服务`tools/list`Vì`tools/list`Bản thân nó đã mang theo hoàn toàn cùng một yêu cầu dữ liệu.

### Công cụ ()

`tools/list`返回具有确定性排序工具 描述符列表──稳定排序能提高响应缓存命中率,并保持模型快速上下文的稳定性──该结果也要求携带`ttlMs`和 `cacheScope`

`tools/call`返回内容块(content blocks) và `isError`状态── Khi giao dịch đóng gói hoặc phương pháp tham số bất hợp pháp, trả về JSON-RPC  lỗi đáp ứng; khi hợp pháp của Công cụ 调用 thành công kích hoạt nhưng trong cấp độ thực hiện kinh doanh thất bại, trả về mang 带有 `isError: true`Kết quả thường lệ:

Công cụ 注解(Annotations) chỉ để cung cấp cho chủ nhà của lời khuyên, không đại diện cho bắt buộc thực hiện:

- `readOnlyHint`
- `destructiveHint`
- `idempotentHint`
- `openWorldHint`

Người chủ nhà nên sử dụng chúng để xác nhận giao tiếp và UI, nhưng máy chủ phải thực hiện thực sự kiểm tra ủy quyền ở cấp độ kinh doanh.

### Tài nguyên (( tài nguyên)

`resources/list`返回稳定的 URI 描述符──`resources/read`返回带类型内容──在 `2026-07-28`规范中, cả hai đều thuộc về kết quả có thể lưu trữ, phải bao gồm `ttlMs`和 `cacheScope`

 Đối với dữ liệu ghi chép riêng của người dùng, nên sử dụng `cacheScope: "private"` chia sẻ缓存绝不能跨授权上下文复用私有响应──

现代数据变更推送 không còn được sử dụng `resources/subscribe`✿ Khách hàng 通过发起 `subscriptions/listen``resourceSubscriptions`Hoặc danh sách sự kiện thay đổi để nhận dài liên kết tiếp xúc

### Lời khuyên (提示模板)

`prompts/list`Cũng có thể lưu trữ và có thứ tự xác định.`prompts/get`根据参数染指定的命名 Prompt──染后的 Prompt 结果属于完整的结果,但不需要如列表或读操作那样附带缓存提示──

### Mỗi kết quả thành công đều là loại hình

Trong thực hiện mã, có thể sử dụng bộ đóng gói thống nhất để xử lý tất cả các phản ứng thành công:

```python
def complete(payload):
    return {
        "resultType": "complete",
        **payload,
        "_meta": {SERVER_INFO_KEY: SERVER_INFO},
    }
```

列表,读取和服务发现的处理员 会额外增加 `ttlMs`Với`cacheScope`❖ xử lý tập trung có thể ngăn chặn cá nhân xử lý 疏漏了现代规范所需的字段──

### 绝不发起 Server 端请求

现代 Server có thể gửi với khách hàng yêu cầu thông báo liên quan trực tiếp, hoặc tại khách hàng  mở `subscriptions/listen`流中推送通知──但服务器 **绝不能**主动发起独立的 JSON-RPC 求求

Khi người xử lý cần lấy mẫu, tạo ra hoặc gốc, nó sẽ quay lại một`input_required`Kết quả: Sau khi nhập yêu cầu của khách hàng, sử dụng ID yêu cầu mới 重新发起原始方法调用.

```figure
t3-dispatch-loop
```

## 动手实践

运行 Python Server's toàn bộ trình bày và thử nghiệm:

```bash
cd code
python3 main.py --demo
python3 -m unittest discover tests -v
```

使用 TypeScript 运行器运行 TypeScript 版本:

```bash
npx tsx main.ts --demo
```

演示流程会发送 `server/discover`、 liệt kê các ngôn ngữ gốc 、 dùng các công cụ, và hiển thị không được hỗ trợ dưới phiên bản báo cáo không thể hiện  quan sát mỗi yêu cầu hiện đại đều mang lại dữ liệu, và mỗi kết quả thành công đều mang lại Server nhận dạng 

## 交付物

本课交付 `outputs/skill-mcp-server-scaffolder.md`Nó có thể tạo ra các bản đồ thiết kế máy chủ phù hợp với quy định hiện đại, bao gồm các dịch vụ tìm thấy thỏa thuận, từng yêu cầu, xác định danh sách lưu trữ và các loại di sản độc lập có thể lựa chọn.

## 练习与思考

1. Từ một yêu cầu chuyển năng lực 字段, chứng minh Server 绝不会复用前请求声明的旧能力──
2. 颠倒 `TOOLS``PROMPTS`及笔记数据的录入顺序, xác nhận tất cả các bảng điều tra kết quả vẫn duy trì ổn định chữ cái序列.
3. Một sự phá hoại mới.`notes_delete`工具, và bên trong trình thực hiện gia nhập kiểm tra quyền kiểm tra, xác nhận`destructiveHint`仅作前端交互提示──
4. 补充 `resources/templates/list`接口, yêu cầu kèm `ttlMs``cacheScope`Và sự xác định của nó.
5. Vì vậy`2025-11-25`编写一个完全隔离的 Legacy 适配器,并通过测试证明现代请求绝不会错进 Legacy 处理路径──

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 无状态 Server (Stateless server) | 仅从每个请求自身的元数据处理调用，无任何协议 Session 内存记忆 |
| `server/discover` | 强制实现的现代方法，用于向调用方公布支持的版本与功能集 |
| 完整结果 (Complete result) | 携带 `resultType: "complete"` 的成功现代结果 |
| 可缓存结果 (Cacheable result) | 附带强制 `ttlMs` 与 `cacheScope` 提示的发现、列表或只读结果 |
| 确定性列表 (Deterministic list) | 逻辑相同的注册表必须输出完全一致、可复现的条目顺序 |
| Server 身份 (Server identity) | 在结果 `_meta` 中携带的 `io.modelcontextprotocol/serverInfo` 标识 |
| Tool 业务错误 (Tool error) | Tool 调用正常被解析执行，但业务逻辑失败，返回包含 `isError: true` 的 content |
| 协议错误 (Protocol error) | 非法的 JSON-RPC 格式或无效的 MCP 请求参数，直接通过顶层 `error` 报错返回 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
