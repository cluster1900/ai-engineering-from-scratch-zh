# 构建 MCP Client:服务发现、路由与双时代回归

> 现代 MCP Client 在每一个请求上都完整重复其通信契约――它 là quyết định khả năng tương thích đầy thách thức nhất, dựa trên việc đánh giá Old Server là cấu trúc Legacy thực sự, còn là một bản báo cáo có thể sửa đổi của Server hiện đại――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07（构建 MCP Server）
**Time:** ~85 分钟

## Học mục tiêu

- Đối với mỗi MCP`2026-07-28`Xin hãy từ zero xây dựng mới nhất元数据 Envelope.
- Sử dụng `server/discover`探测 dựa trên máy chủ của studio,并协商 cả hai đều hỗ trợ phiên bản.
- 仅为显然加入白名单的对端(Peer)授权发起有时间限制的遗产 握手探测──
- Chỉ cần chứng minh phiên bản được hỗ trợ có hiệu lực đúng hướng`initialize`Kết quả sau,才接受 Legacy 时代。
- 合并确定性 Công cụ 列表, 杜绝静默覆盖重名冲突──
- Để chuẩn bị cho các công cụ, bạn không cần phải đưa ra bất kỳ thỏa thuận nào.

## 问题背景

Agent Host thường cần phải giao tiếp với nhiều máy chủ MCP cùng lúc. Nó phải tìm thấy từng máy chủ, tìm thấy danh sách các công cụ, giải quyết các xung đột đổi tên, sử dụng phương pháp đường dẫn, và phục hồi bình tĩnh từ sự gián đoạn cấp truyền.

`2026-07-28`Quy tắc làm cho hoạt động ổn định trở nên rất đơn giản, vì mỗi yêu cầu đều tự chứa đầy đủ. Tuy nhiên, khả năng đáp ứng làm cho giai đoạn khởi động nhỏ hơn.

- 支持首选版本的现代 Server;
-  trả lại phiên bản nhận dạng hoặc Header 错误的现代 Server;
- Từ chưa nghe nói `server/discover`của Old Server;
- Cho đến khi nhận được`initialize`握手前都保持沉默的老老服务器──

Nếu tất cả các lỗi phát hiện được xem là Legacy Server, là rất nguy hiểm.  Phản ứng sai lầm trong kiểu mẫu của các yêu cầu hiện đại, được tải lên trên máy chủ, bị kết nối với các quá trình của máy chủ cũ thực sự, đều có thể tạo ra các tín hiệu siêu thời gian hoặc kết nối bị gián đoạn.

## 核心概念

### Đối với các đối tác),而非协议

Đối với mỗi trình duyệt máy chủ hoặc mạng kết nối:

- 传输句柄或发送函数;
- 选定的协议时代与具体版本号;
- Các khả năng máy chủ gần đây nhất phát hiện;
- Gần đây đã có được xác định Tool danh sách;
- đang chờ phản ứng của yêu cầu ID 映射;
- 传输层的物理健康状态――

Đây thuộc về sổ quản lý bên trong của khách hàng, không phải là cái gọi là  giao thức Session  trạng thái ── trong MCP hiện đại, máy chủ vẫn tiếp nhận độc lập các phiên bản và khả năng hiện tại trong mỗi yêu cầu kinh doanh ────

### Từ零构建 mỗi ngày yêu cầu

```python
def modern_request(request_id, method, params, version, capabilities):
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": {
            **params,
            "_meta": {
                "io.modelcontextprotocol/protocolVersion": version,
                "io.modelcontextprotocol/clientCapabilities": capabilities,
                "io.modelcontextprotocol/clientInfo": CLIENT_INFO,
            },
        },
    }
```

Không cần chỉ thêm một lần dữ liệu trên đối tượng kết nối để giả định nó có thể đến trên đường dây mạng.

### 现代服务发现

`server/discover`返回支持的版本、Server 能力、使用说明、缓存提示以及推的 Server 身份──客户端 选择双方均支持的最高现代版本──

Đối với khách hàng hiện đại, dịch vụ tìm thấy là tùy chọn; nhưng trong chế độ studio                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `tools/list`Có thể sẽ có thành công giả mạo.`server/discover`能够建立分明的时代分界线──

### stdio 兼容性探测流程

双时代(double-era)studio Client 在发送任何其他请求之前,优先发送携带其首选现代元数据的 `server/discover`❖ Có thể có 3 loại kết quả:

1. **DiscoverResult（成功发现）**: Server vì cấu trúc hiện đại.  chọn phiên bản hỗ trợ chung, và tiếp tục giao tiếp kinh doanh theo cách mang dữ liệu mỗi lần yêu cầu.
2. **Recognized modern error（已识别的现代协议错误）**: Server vẫn còn vì hiện đại架构──若返回 `-32022`, từ`data.supported`中选择可用版本并使用新请求 ID 重试;若为 Header 或 Capability 错误, sửa đổi yêu cầu nội dung即可──**严禁回退发送 `initialize`。**
3. **Ambiguous signal（歧义信号）**: không nhận ra JSON-RPC 报错、超时、连接关闭或空响应均无法确定协议时代──必须默认按失败关闭(fail closed), trừ khi kết nối được vận chuyển và hiển nhiên được cấu hình Legacy 兼容白名单──

已识别的现代协议错误码 bao gồm:

- `-32020`HeaderMismatch( yêu cầu đầu với yêu cầu không phù hợp)
- `-32021`ThiếuCái năng của khách hàng
- `-32022`Không hỗ trợProtocolVersion(不支持的协议版本)

Ngay cả khi đã được đưa vào danh sách Warisan White List, đã nhận ra những sai lầm hiện đại cũng chứng minh nó là Server hiện đại. Một khi Server đã thể hiện được khả năng hiểu biết của từ ngữ hiện đại, tái gửi.`initialize`就构成降级.

绝不能把 `-32601`(method unfound) như là bằng chứng đầy đủ về việc vào Legacy. Nó chỉ đại diện cho việc đối tác có quyền khởi động một lần có thời gian giới hạn.

### 白名单代表运维意图,而非协议证据

Legacy 兼容性 phải là thuộc tính rõ ràng của định nghĩa đối với cấu hình kết thúc:

```python
client.add_server("archive", archive_transport, allow_legacy=True)
```

必须将此选项绑定到明确配置的命令或端点──严禁使用通配符让任意未知 Server tự động hạ cấp为较弱语义──未配置`allow_legacy=True`Đáng lẽ, những người đã gặp phải những sự khác biệt sau khi phát hiện ra kết quả, sẽ không nhận được.`initialize`

Đơn chỉ cấp quyền khởi động cuộc thăm dò. Nó không quyết định thời gian của thời điểm. Khách hàng gửi đơn trong thời gian hạn trong quá trình chuyển tiếp.`initialize`Xin vui lòng, rồi nghiêm túc yêu cầu đáp ứng tất cả các điều kiện sau:

-  Gửi nhận JSON-RPC phù hợp với ID yêu cầu `2.0`响应;
- Chỉ chứa`result`字段,且无 `error`-
- `protocolVersion`thuộc vào tập hợp phiên bản cũ của Client 允许配置;
- 包含对象类型 `capabilities`字段;
- 包含非空字符串 `name`Với`version`của `serverInfo`Đối tượng:

Bất kỳ phiên bản nào siêu thời gian, cắt, báo lỗi, kết quả hình dạng, ID, sai lầm hoặc không được hỗ trợ đều thất bại trực tiếp. Chỉ có kết quả đúng hướng của cấu trúc hoàn toàn phù hợp mới có thể đánh dấu kết quả như Legacy 时代.`legacy_probe_timeout_ms`传给传输适配器; thực tế studio hoặc HTTP 适配器 phải thực hiện thời gian hạn này, chứ không chỉ ghi lại nó.

Để truyền tải vào thời đại được chọn, đừng tìm lại trước mỗi lần sử dụng.

### Di sản là một phần chia sẻ

Một khi truy vấn hạn chế trở lại chứng chỉ Legacy đúng đắn, Khách hàng sẽ sử dụng Legacy  phiên bản được chọn nghiêm ngặt theo định nghĩa của phiên bản sửa đổi này:

1. 校验响应信封与关联 ID──
2. 校验协商出的修订版 thuộc về bộ sưu tập Legacy đã được phân bổ.
3. ghi lại khả năng qua các bài kiểm tra với Server Identity
4. Chỉ trong tất cả kiểm tra thông qua sau khi gửi `notifications/initialized`
5. Trong vòng đời truyền tải sử dụng Legacy yêu cầu cấu trúc

Chiếc phân đoạn này chỉ tồn tại cho kết nối với kết nối đã biết, nó không phải là thiết kế mặc định của máy chủ mới hoặc yêu cầu mới. Nếu chuyển tiếp khởi động lại hoặc kết nối thay đổi, bỏ lại lưu trữ và đàm phán lại cho thời điểm kết nối.

### 工具 phát hiện và lưu trữ

Đối với mỗi hoạt động đối với kết thúc`tools/list`现代结果包含 `resultType``ttlMs`Với`cacheScope`                                                                                                                                                                                                                                                              

 Đối với Legacy Server 缺失 `resultType`Tình huống, Khách hàng phải xem xét`"complete"`❖ không yêu cầu trước khi đàm phán thời đại của đáp ứng mang theo hiện đại缓存字段──

Server 应返回确定性排序──Client cũng nên ở trong 合并前排序, để tựa trình đăng ký địa phương không phụ thuộc vào quá trình khởi động 时序──

### 命名空间无冲突合并

Hai máy chủ có thể đã bị lộ tên.`search`Các công cụ:

1. **冲突时加前缀（Prefix on collision）**: giữ nguyên tên quy định của các công cụ, sau đó tên lại của các công cụ được tiết lộ cho `<server>/<tool>`
2. **冲突时拒绝（Reject on collision）**:不加载重复工具,并抛出清晰的配置报错.
3. **静默覆盖（Silent overwrite）**- Có thể là:**坚决杜绝**Nó sẽ ẩn mô hình thực sự được sử dụng mục tiêu của máy chủ.

Đồng thời lưu giữ quy định danh với địa danh.`tools/call`使用所属 Server 声明的本地名──

### 调用路由机械

路由是纯粹的映射查找:

```text
canonical tool name
  -> peer name + local tool name
  -> new JSON-RPC request id
  -> modern request metadata or explicit legacy shape
  -> matching response id
```

Khi truyền tải không thể sử dụng, đừng gửi đi.`tools/list` Trong các yêu cầu trong quá trình chuyển tải bị mất, nếu các chiến lược an ninh của hoạt động cho phép, có thể sử dụng ID JSON-RPC mới để thử lại

### 通知与订阅

现代的列表与资源变更只通过客户 开放 `subscriptions/listen`流到达──Client 发送通知过器, chờ `notifications/subscriptions/acknowledged`,并用通知元数据中的听 请求身份证 关联事件──

断开后发起新听 请求并重新拉取相关列表或资源──现代流不使用 `Last-Event-ID`恢复:

### Không có Server 发起的请求

现代 Server 不会为样本化、征集或根向客户端发起独立的 JSON-RPC 请求──它们返回 `input_required`,Client trong đáp ứng trong đó được đặt vào yêu cầu sau khi thử lại yêu cầu ban đầu:.

满足输入期间不要阻塞端的响应读取器──保持关联关系,并为重试生成新的 JSON-RPC ID──

```figure
tp-client-merge
```

## 动手实践

`code/main.py`Thông qua bộ nhớ đối với hàm kết thúc minh bạch cho thấy toàn bộ cây quyết định giao thức. Nó kết nối với hai kết thúc hiện đại và một biểu tượng biểu tượng trắng.

```bash
cd code
python3 main.py
python3 -m unittest discover tests -v
```

单元测试覆盖常规演示容易忽视的边界条件:

- 现代请求逐次重复元数据;
- 遇到 `-32022`时重试现代发现,绝不退化为握手;
- 已识别的现代错误绝不会发生降级 (đặc dù nó nằm trong danh sách trắng);
- 超时、连接关闭、空响应与未识别的错误在无白名单时绝不触发 `initialize`-
- Đơn chỉ đơn chỉ nhận được quy định đúng hướng `initialize`响应后才 được thiết lập cho Di sản;
- Kết quả của Legacy không được hình thành hoặc không được hỗ trợ khiến cho nó không thể sử dụng được;
- Thời đại được chọn được xác định là tồn tại trong chu kỳ đời sống truyền tải.

## 交付物

本课交付 `outputs/skill-mcp-client-harness.md`△ nó có thể được sử dụng cho các yêu cầu hiện đại 盖、studio 时代协商、确定性命名空间合并、路由以及失败即关闭(fail-closed) của Legacy 兼容分支提供规范脚手架。

## 练习与思考

1. 让一个模拟 Server  quay lại `-32022`Không có phiên bản được cả hai bên hỗ trợ, xác nhận Khách hàng  trực tiếp thất bại không gửi `initialize`
2. Để tạo ra một trình duyệt của Legacy Server 加入白名单,让它受限 `initialize`探测超时, chứng minh phải đối đầu giữ `unknown`Và không thể sử dụng được.
3. Vì hai quyền trên văn bản thêm `cacheScope: "private"`Các công cụ danh sách, xác nhận Khách hàng sẽ không bao giờ chia sẻ kết quả lưu trữ của một trên một bên dưới cho một bên khác.
4. Thay đổi chiến lược xung đột thành từ chối, và đưa ra báo cáo thất bại có chứa hai tên đối đầu.
5. 添加一个有限的 `subscriptions/listen`模拟器;流丢失时使用新的请求ID 重新听并重新拉取工具──

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 对端 (Peer) | Client 端维护的单个 Server 传输句柄及其发现信息的记录实体 |
| 协议时代 (Protocol era) | 现代逐请求元数据模式，或旧版初始化握手语义 |
| 服务发现探测 (Discovery probe) | 用于识别 stdio 对端时代的初始 `server/discover` 请求 |
| 已识别现代错误 (Recognized modern error) | 证明对端属于现代架构并禁止 Legacy 回退的特定协议错误 |
| Legacy 白名单 (Legacy allowlist) | 运维显式授权对指定对端进行一次受限兼容探测的配置 |
| 正向 Legacy 证据 (Positive legacy evidence) | 针对受支持旧版协议返回的有效、ID 匹配的 `initialize` 结果 |
| 合并命名空间 (Merged namespace) | 跨所有活跃对端规范化后的工具全局名称集合 |
| 冲突策略 (Collision policy) | 处理重名工具的加前缀或报错拒绝规则 |
| 时代缓存 (Era cache) | 为单个传输对端保存的已选现代或 Legacy 行为 |
| 传输恢复 (Transport recovery) | 重启或重连、重新发现、重新列出，并以新 ID 安全重试 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
