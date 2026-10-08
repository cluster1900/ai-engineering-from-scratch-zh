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

Ngay cả khi đã được đưa vào danh sách Warisan White List, đã nhận ra những sai lầm hiện đại cũng chứng minh nó là Server hiện đại. Một khi Server đã thể hiện được khả năng hiểu biết của từ ngữ hiện đại, gửi `initialize`Nó tạo nên một phiên bản nguy hiểm của các cuộc tấn công hạ cấp.

绝不能把 `-32601`(方法未找到) như là bằng chứng đầy đủ về việc vào Legacy. Nó chỉ đại diện cho việc đối tác có đủ điều kiện để khởi động một lần có thời gian hạn chế về Legacy 探测.

### 白名单代表运维意图,而非协议证据

Legacy 兼容性 phải là thuộc tính rõ ràng của định nghĩa đối với cấu hình kết thúc:

```python
client.add_server("archive", archive_transport, allow_legacy=True)
```

必须将此选项绑定到明确配置的命令或端点──严禁使用通配符让任意未知 Server tự động hạ cấp为较弱语义──未配置`allow_legacy=True`Đáng lẽ, những người đã gặp phải những sự khác biệt sau khi phát hiện ra kết quả, sẽ không nhận được.`initialize`

Đơn chỉ cấp quyền khởi động cuộc điều tra. Khách hàng gửi đơn trong thời gian hạn trong quá trình chuyển tiếp.`initialize`Xin vui lòng, rồi nghiêm túc yêu cầu đáp ứng tất cả các điều kiện sau:

-  Gửi nhận JSON-RPC phù hợp với ID yêu cầu `2.0`响应;
- Chỉ chứa`result`字段,且无 `error`-
- `protocolVersion`thuộc vào tập hợp phiên bản cũ của Client 允许配置;
- 包含对象类型 `capabilities`字段;
- 包含非空字符串 `name`Với`version`của `serverInfo`Đối tượng:

Bất kỳ phiên bản nào siêu thời gian, cắt, báo lỗi, hình thành kết quả, ID 错乱 hoặc không được hỗ trợ đều thất bại trực tiếp. Chỉ có kết quả đúng hướng của cấu trúc hoàn toàn phù hợp mới có thể được đánh dấu là Legacy 时代.

### 命名空间无冲突合并

Hai máy chủ có thể đã bị lộ tên.`search`Các công cụ:

1. **冲突时加前缀（Prefix on collision）**: giữ nguyên tên quy định của các công cụ, sau đó tên lại của các công cụ được tiết lộ cho `<server>/<tool>`
2. **冲突时拒绝（Reject on collision）**:不加载重复工具,并抛出清晰的配置报错.
3. **静默覆盖（Silent overwrite）**- Có thể là:**坚决杜绝**Nó sẽ ẩn mô hình thực sự được sử dụng mục tiêu của máy chủ.

### 调用路由机械

路由是纯粹的映射查找:

```text
规范工具名
  -> 对端名称 + 本地工具名
  -> 生成全新的 JSON-RPC 请求 ID
  -> 现代请求元数据 或 显式 Legacy 结构
  -> 匹配响应 ID 并返回
```

```figure
tp-client-merge
```

## 动手实践

`code/main.py`Thông qua bộ nhớ đối với hàm kết thúc rõ ràng cho thấy toàn bộ cây quyết định giao thức. Nó kết nối với hai kết thúc hiện đại và một biểu thức biểu thị biểu tượng của các công cụ của họ:

```bash
cd code
python3 main.py
python3 -m unittest discover tests -v
```

单元测试覆盖常规演示容易忽视的边界条件:

- 现代请求逐次重复元数据;
- 遇到 `-32022`时重试现代发现,绝不退化为握手;
- 已识别的现代错误绝不发生降级;
- 超时、断开与未知错误在无白名单时绝不触发 `initialize`-
- Đơn chỉ đơn chỉ nhận được quy định đúng hướng `initialize`响应后才 được thiết lập cho Di sản;
- Thời đại được chọn được xác định là tồn tại trong chu kỳ đời sống truyền tải.

## 交付物

本课交付 `outputs/skill-mcp-client-harness.md` Nó có thể được sử dụng cho các yêu cầu hiện đại 盖、studio 时代协商、确定性命名空间合并、安全路由以及安全关闭的 Legacy 兼容分支提供规范脚手架。

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

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
