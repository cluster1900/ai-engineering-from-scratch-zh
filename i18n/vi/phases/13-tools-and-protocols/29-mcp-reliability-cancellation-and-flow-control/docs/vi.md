# MCP 可靠性、取消与流控

> Ứng dụng chỉ có thể liên kết thông tin. Nó không thể làm cho tác dụng phụ trở nên an toàn, không thể làm cho quá trình làm việc của nền tảng sau đó dừng lại, cũng không thể bảo vệ dữ liệu khỏi bị người tiêu dùng chậm 🏻.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 09 and 13
**Time:** ~120 minutes

## Học mục tiêu

- Vì vậy, các video và HTTP được phát trực tuyến phân biệt để thực hiện đúng yêu cầu từ chối tín hiệu.
- 解决完成 (完成) và取消 (取消) giữa các đối tác, tránh trong取消后发送多余消息.
- 严格区分时请求取消与持久化 `tasks/cancel`                                                                                                                                                                                                                                                              
- 根据副作用属性与显式等键 (tích khóa độc lập) lập lại chiến lược thử nghiệm.
- Trong khi đặt giới hạn dung lượng của hàng tiến độ, đảm bảo đáp ứng cuối cùng không bị bỏ rơi.
- 通过重新连接、权权重拉(refetch) và tái tạo cơ chế thoát khỏi động tác.

## 核心问题

Các hệ thống phân tán đắt tiền nhất thường bị mắc kẹt ngoài đường thực hiện bình thường.

客户端调用一个工具――服务端开始执行――进度通知源源不断发出――反向代理在中间缓冲了事件流――客户端触发超时并断开连接――服务端恰好在 1毫秒后完成业务处理――客户端使用新的 JSON-RPC id 发起重试――于是,操作写作 (转变) 已重复执行两次――

Mỗi bộ phận trên mạng không có lỗi nào từ vị trí của nó, nhưng toàn bộ hệ thống đã bị sụp đổ từ toàn bộ vị trí.

Các quy tắc MCP xác định định định dạng tin nhắn và hành vi truyền tải, nhưng ứng dụng của bạn vẫn phải chịu trách nhiệm cá nhân:

- 时间预算(Budget thời gian);
- 业务等性(khai thác kinh doanh);
- Có giới đội hình (Landed queues);
- 重试分类(Tân loại hưu trí);
- 持久化任务状态 (nước nhiệm vụ bền vững);
- 重连与重新拉取策略 (Công nối lại và tái tạo chính sách)

Chương trình này sẽ xây dựng những quyết định này trong một mô phỏng xác định. Ở đây không giới thiệu giấc ngủ, socket mạng thực tế hoặc bất cứ tình huống nào. Bạn sẽ trực tiếp kiểm soát thứ tự trước và sau của việc xóa bỏ sự kiện. Một thử nghiệm đường dây đồng bộ cũng sẽ buộc hai khách hàng tài khoản để cạnh tranh với nhau.

## Ứng dụng xóa vì truyền tải khác nhau

Bất kể sử dụng giao thức truyền tải nào, ý định của khách hàng đều giống nhau: không còn cần kết quả đang được thực hiện hiện tại.

### studio

stdio 采用单条共享的双向通道──客户端发送一个通知:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/cancelled",
  "params": {
    "requestId": 41,
    "reason": "User closed the operation"
  }
}
```

Thông báo này thuộc về 即发即弃(fire-and-forget) .

服务端应停止工作、释放资源,并不再发送响应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应应

形式错误、指向未知请求或针对已完成请求的取消通知都会被服务端默忽视──如果将这些并发竞态转换为新错报文,只会引发更多竞态问题──

### HTTP được phát trực tuyến

现代 Streamable HTTP 为每个请求分分独立的 HTTP 响应或 SSE 响应流──客户端通过**直接关闭该请求的响应流**Để phát ra tín hiệu tiêu thụ.

Đừng vì HTTP bình thường  Xin POST  gửi `notifications/cancelled`                                                                                                                                                                                                                                                              

Một khi kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết nối kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết kết

### 服务端发起的取消范围极其有限

服务端绝不能使用 `notifications/cancelled`Để tự nhiên loại bỏ các cuộc gọi thông thường của khách hàng. Trong studio  truyền tải, việc loại bỏ các dịch vụ bắt đầu chỉ giới hạn ở kết thúc.`subscriptions/listen`监听请求―― phải phân biệt chặt chẽ với các yêu cầu thường xuyên của khách hàng.

## 取消 là một cuộc đấu tranh

Lệnh xảy ra hai sự kiện là hoàn toàn hợp pháp.

### 取消获胜

```text
request starts（请求启动）
client sends cancellation signal（客户端发送取消信号）
server marks request cancelled（服务端将请求标记为已取消）
worker reaches completion（工作线程执行完成）
server suppresses the response（服务端抑制并不发送响应）
```

### 完成获胜

```text
request starts（请求启动）
worker commits the result（工作线程提交业务结果）
server sends the response（服务端发送响应）
cancellation arrives late（取消信号迟到）
server ignores the late notification（服务端忽略迟到的通知）
```

客户端 cũng phải chủ động bỏ qua phản ứng chậm trễ đối với yêu cầu đã bị từ bỏ.

```figure
mcp-reliability-race
```

本课的 `RequestCoordinator`会记录单一的终态记录. Một khi bị xóa,`complete()`Sẽ không trả lại bất kỳ phản ứng nào; và thông báo hủy bỏ quá muộn cũng không thể thay đổi được ghi chép đã hoàn thành.

## 超时机需要两个小时

单一的无活动 (无活动)计时器是远远不够的──

必须同时引进两套时间上限:

1. **空闲超时（Idle timeout）**: yêu cầu trong thời gian dài không có bất kỳ hoạt động hữu ích nào được xem là quá thời gian.
2. **最大超时（Maximum timeout）**Từ yêu cầu ban đầu khởi động thời gian tính toán bắt đầu của tuyệt đối vật lý thời gian ngân sách

持续产生的进度事件(Progress) có thể đặt lại空时钟, nhưng**绝不能**推迟或消除最大截止时间──

```text
start: 0 ms
progress: 400 ms
progress: 800 ms
progress: 1200 ms
idle timeout: 500 ms
maximum timeout: 2000 ms
```

Trong 1500 ms, yêu cầu vẫn còn hoạt động, vì khoảng cách từ sự kiện tiến bộ trước đó chỉ vượt quá 300 ms. Nhưng trong 2000 ms, thời gian hạn chế tối đa sẽ buộc phải hủy yêu cầu, ngay cả khi một sự kiện tiến bộ mới chỉ xuất hiện trong 1999 ms.

进度通知是可选的. 服务端完全可以接受一个进度令牌 ( progress token) nhưng không gửi bất kỳ cập nhật nào trong thời gian thực hiện.

Giá trị tiến bộ của MCP phải tăng lên một cách đơn giản. Sau khi hoàn thành hoặc hủy bỏ, tất cả các thông báo phải ngay lập tức dừng lại.

## Xin lỗi, xin lỗi.`tasks/cancel`

Hai cơ chế này giải quyết được các vấn đề về các cấp độ chu kỳ sống hoàn toàn khác nhau.

| 机制 | 作用目标 | 线路信号 | 成功意味着什么 |
|-----------|--------|--------|--------------------|
| stdio 上的请求取消 | 单次在途 RPC | `notifications/cancelled` | 客户端放弃了该请求；若可行服务端应当停止执行 |
| HTTP 上的请求取消 | 单个在途响应流 | 关闭该流 | 客户端放弃了该请求；若可行服务端应当停止执行 |
| `tasks/cancel` | 单个持久化 Task | 普通 MCP 请求 | 服务端已确认收到取消意图 |

`tasks/cancel`Việc điều chỉnh thành công không chứng minh người lao động đã ngừng hoạt động.`working` trạng thái, cho đến khi người lao động tại một điểm kiểm tra nào đó nhận thức được việc xóa nhãn hiệu;

Khi HTTP  kết nối bị chia cắt,**绝不要**清除持久化任务的状态――创建任务的初衷正是让其生命周期能够超越单次请求与单条连接的限制――

## ID JSON-RPC mới 绝不等于等性

JSON-RPC id chỉ được sử dụng để liên kết các yêu cầu và phản ứng đơn lẻ, chúng không đại diện cho hoạt động kinh doanh tự mình.

假设客户端提交一个账单扣款 (được gửi bởi khách hàng)`41`), trong khi mất phản ứng của thiết bị dịch vụ, sau đó khách hàng sử dụng ID `42`发起重试――端子看到的是两条截然不同的消息――如果没有应用层的唯一标识,端子根本无法知道它们代表同一结账请求――

等键 (等键)                                                                                                                                                                                                                                                           

```json
{
  "name": "charge_account",
  "arguments": {
    "account": "acct-7",
    "cents": 1200,
    "idempotencyKey": "checkout-7"
  }
}
```

服务端会持久化记录:

- 等键;
- 操作参数的哈希指纹(phát vân tay của lập luận);
- 已提交的执行结果──

Các khóa tương tự với các tham số tương tự sẽ trực tiếp trở lại kết quả lưu trữ trước đó. Nếu cùng một khóa mang các tham số khác nhau, thì sẽ được quyết định từ chối. Điều này có thể ngăn chặn việc sử dụng sai lầm các khóa và thay đổi các hoạt động kinh doanh khác nhau.

### 账本边界 phải có tính nguyên tử và bền vững

Các quy trình thực hiện sau đây là cực kỳ nguy hiểm và không an toàn:

```text
check key（检查键是否存在）
run mutation（执行写操作）
store result（存储执行结果）
```

Hai người làm việc có thể phát hiện ra rằng khóa không tồn tại, trong khi thực hiện tác dụng tác dụng này.

Bài học này sử dụng dựa trên tài liệu SQLite 账本.`BEGIN IMMEDIATE`Việc kiểm tra khóa, các tác dụng phụ của doanh nghiệp giả định, bộ tính toán thực thi và lưu trữ kết quả đều được sắp xếp trong cùng một giao dịch. Ngay cả khi hai giao dịch kế toán độc lập kết nối sử dụng cùng một khóa, cũng sẽ chỉ tạo ra một lần thực sự thực hiện và ghi lại kết quả đã gửi.

Tất cả giá trị trả lại đều thông qua lưu trữ JSON 重新反序列化生成. Người dùng sẽ không bao giờ trực tiếp nhận được các trích dẫn đối tượng biến đổi trong sổ cái, do đó loại bỏ những nguy cơ của người dùng sửa đổi thư mục trả lại và ô nhiễm hậu quả trả lại.

Các tác dụng phụ của doanh nghiệp trong mô phỏng là chứa các thu nhập và tính toán trong cùng một SQLite. Trong môi trường sản xuất, thực tế thanh toán, triển khai container hoặc API bên ngoài, không bao giờ dựa vào bảng dữ liệu địa phương để viết một ghi chép về việc tự động nhận được nguyên tử.

### 重试决策矩阵

Trước khi thực hiện các thử nghiệm lại, phải thực hiện các thử nghiệm lại một cách rõ ràng.

| 类别 | 示例 | 重试规则 |
|------|---------|------------|
| 安全（Safe） | 无副作用的确定性读操作 | 在明确故障边界后，可使用新的 JSON-RPC id 直接重试 |
| 有条件（Conditional） | 具备持久化幂等键的写操作（Mutation） | 必须使用完全相同的幂等键和完全相同的参数发起重试 |
| 不安全（Unsafe） | 未提供业务去重机制的写操作 | 严禁自动重试；必须先进入人工或系统对账调和流程 |

工具描述符中附带的 `readOnlyHint`和 `idempotentHint`Chỉ là những gợi ý bên ngoài không thể tin được. Sự an toàn thực sự của thử nghiệm lại hoàn toàn phụ thuộc vào việc thực hiện các thỏa thuận cấp dưới của thiết bị dịch vụ.

## 背压 là một phần của sự chính xác

Tốc độ sản xuất sự kiện tiến bộ của SSE có thể vượt xa hơn rất nhiều khả năng tiêu thụ của khách hàng, đại lý hoặc mạng lưới liên kết.

必须采用有界队列 (có hàng rào giới hạn),并明确义在过载时可以牺牲什么──

进度通知是可替代的. Đối với cùng một 进度令牌, 进度数值后到的自然取代前者的旧值. Tuy nhiên, 响应 JSON-RPC cuối cùng là hoàn toàn không thể thay thế.

Bài viết này thực hiện các chiến lược quản lý lưu lượng như sau:

1. 合并(Coalesce) cùng một令牌相邻的进度更新;
2. Khi hàng xếp đạt giới hạn dung lượng, bỏ đi dữ liệu tiến bộ cũ nhất;
3. 将事件流标记为需要权威数据重拉(需要权威重复) ;
4. 始终完整保留最终响应;
5. Nếu giữ lại phản ứng cuối cùng cần phải bỏ lại một phản ứng cuối cùng khác để trả giá, thì từ chối trạng thái này.

Đây là một phương pháp phục hồi rõ ràng.

### 代理缓冲问题

服务端可能在完美流式输出中,而中间的反向代理却在私积事件缓冲中.

Đối với SSE, phải có các tiêu đề đáp ứng sau:

```http
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no
```

2026 năm Streamable HTTP 规范强烈建议配置 `X-Accel-Buffering: no`, để兼容 của các dịch vụ đại diện như Nginx có thể ngay lập tức gửi các sự kiện đến khách hàng.

对于长期处于静静状态长连接,需定期发送 SSE 注释行(保活心跳):

```text
:
```

客户端会自动忽略注释行──中间代理设备则能看到网络活动,从而避免断断看似空的连接──

传输保活不等于业务进步――绝不能因为收到传输层的保活注释就顺带重置业务操作的语义空超时计时器――

## 重连 nghĩa là tái kéo

现代 Streamable HTTP 协议**不支持** Thông qua `Last-Event-ID` tiến hành phân đoạn tiếp tục truyền.

Khi đó`subscriptions/listen`事件流意外中断后:

1. Sử dụng toàn bộ ID JSON-RPC mới 发起新的监听请求;
2. 重新注册 cần thiết đơn đăng ký;
3. 调用权威接口全量拉取可能受影响的工具,资源,提示或任务;
4. Theo ổn định toàn bộ chỉ định duy nhất cho trạng thái ứng dụng cấp độ được thực hiện;
5. Không bao giờ chỉ vì đã bị mất phản ứng trước đó, bạn phải nhìn lại một cách mù quáng các hoạt động viết không được bảo vệ.

Trong trường hợp này, các chương trình phục hồi sẽ rõ ràng.`sendLastEventId`设置为错,并列出需要全量重拉的资源清单.

### 防止重连风暴 (Herd Effect)

Nếu 10.000 khách hàng kết nối lại trong vòng 1 giây sau khi bị gián đoạn, các dịch vụ đã được phục hồi sẽ bị tấn công lại ngay lập tức.

必须采用带有随机动 (Jitter) với cơ chế tránh chỉ số bảo vệ trên.

```text
attempt 0: up to 250 ms
attempt 1: up to 500 ms
attempt 2: up to 1000 ms
...
cap: 8000 ms
```

Môi trường sản xuất có thể được sử dụng mật mã an ninh số tự động hoặc số tự động trong quá trình vận hành.

## 手写实现

`code/main.py` xây dựng 5 bộ phận trung tâm đáng tin cậy:

### `RequestCoordinator`

- 启动 trong thời gian yêu cầu và bảo vệ không gian với thời gian cắt giảm trọng lượng tối đa;
- 发送单调递增的进度通知;
- Để làm việc với HTTP phân biệt tạo các quy tắc của việc xóa tín hiệu;
- 忽略非法的取消通知;
-  Sự kết thúc giữa việc quyết định và hoàn thành;
- 确保服务端发起的取消仅用于studio 订阅。

### `MutationLedger`

- 演示 trong trường hợp thiếu khóa kinh doanh, hai lần sử dụng các ID JSON-RPC khác nhau sẽ dẫn đến hai lần lặp lại;
- Sử dụng SQLite dựa trên tài liệu thực hiện các kiểm tra khóa liên kết, mô phỏng hiệu quả kinh doanh, trình tính toán thực hiện và kết quả;
- 支持跨多个独立账本连接, đối với cùng một 等键 và các tham số hoàn toàn phù hợp thực hiện toàn bộ cân nhắc;
- 拒绝 sử dụng cùng một phím nhưng thay đổi các tham số yêu cầu;
- 返回防御性深抄, trong việc mở lại tài liệu tài khoản vẫn còn hoàn chỉnh lưu giữ dữ liệu đã gửi.

### `DurableTaskService`

- Đối với取消请求进行确认回执 (tức:
-  giữ nhiệm vụ 处于 `working` trạng thái, cho đến khi các đường làm việc kiểm tra chủ động đến đánh dấu;
- trực quan cho thấy tại sao xác nhận nhận được không bằng với nhiệm vụ đã kết thúc.

### `BoundedSseBuffer`

- Trong áp suất cao trở áp áp suất dưới hợp đồng hoặc loại bỏ tiến bộ cũ;
- 明确记录当前流已需要进行权威数据全量重拉;
- 绝不丢弃最终响应──

### 恢复辅助工具

- 输出 phù hợp với môi trường đại diện của SSE 标题 và bảo vệ sinh hoạt;
- 生成 toàn bộ kết nối với toàn bộ quy mô thực hiện;
- 采用确定性带动指数退避算法打散重试压力──

## 运行验证

Từ code root danh mục xuất phát:

```bash
cd phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/code
python3 main.py
python3 -m unittest discover tests -v
```

Các chương trình trình trình diễn sẽ tiếp theo trình bày hai hướng của các hoạt động của trung tâm, trong tài liệu tạm thời SQLite  sổ sách hoàn thành các hoạt động viết dựa trên các giao dịch để tải trọng, áp lực quá tải đối với khu vực缓冲 có tiến bộ, cũng như thể hiện việc duy trì nhiệm vụ làm thế nào từ việc xác nhận từ bỏ một bước chuyển sang người lao động quan sát và xác nhận từ bỏ.

## 交互式实验

Trong không thêm bất kỳ thời gian ngủ 延时, vận hành bốn loại sự kiện cụ thể trước sau:

1. 启动请求 `A`,将其取消, sau đó调用`complete()`
2. 启动请求 `B`, sẽ hoàn thành, sau đó gửi đến muộn đến của hủy tín hiệu.
3. 启动请求 `C`, trong mỗi lần  siêu thời gian trước đều gửi tiến độ sự kiện, nhưng cuối cùng phá vỡ tối đa tuyệt đối  siêu thời gian giá trị.
4. Trong HTTP được phát trên yêu cầu khởi động `D`,并直接关闭其响应流──

Đối với mỗi trường hợp, ghi lại:

- Ứng dụng cuối cùng của bạn
- Có hay không tạo ra phản ứng cuối cùng;
- Trong hình thức cụ thể của các tín hiệu tiêu diệt phát ra trên đường truyền thông;
- Khách hàng nên chủ động bỏ qua các sự kiện.

Rồi sẽ có một cảnh`D`改为studio 传输―― hoạt động kinh doanh hoàn toàn phù hợp, nhưng các tín hiệu tiêu thụ phát sinh trên đường truyền thông phải thay đổi――

## 动手实践

Vì vậy`MutationLedger`扩展一个 `reserve_inventory`(库存预留) viết操作。

需求规范:

1. 等键 cần phải buộc SKU, số lượng, thuê nhà và tên hoạt động.
2. Sử dụng cùng một khóa và cùng một số nguyên tố hoàn toàn giống nhau khi thử lại, phải trực tiếp trả lại kết quả dự định lần đầu tiên được tạo.
3. Sử dụng cùng một phím nhưng sửa đổi số lượng dự phòng khi khởi động thử lại, phải báo lỗi từ chối, và không phải tạo ra dự phòng hai lần.
4. Khi các hoạt động viết đã được gửi trên thiết bị dịch vụ nhưng phản ứng bị mất trong quá trình chuyển giao, hỗ trợ bằng chứng vay và các khóa khác bắt đầu kiểm tra tài khoản.
5. Kết quả là không thể ghi lại giấy phép mật hoặc thanh toán thông tin nhạy cảm.
6. Nếu khách hàng không cung cấp các khóa như vậy trong thời gian sử dụng, thì trực tiếp tắt cơ chế tự động thử lại.
7. 模拟订阅流意外断开情景,在决定后续动作前,先对库存记录执行权威全量重拉──
8. 启动两个位于同步屏障 (Barrier) 前的账本连接,并发提交同一个等键──断言全局只有一次预留成功提交──
9. 改 lần đầu tiên quay lại đối tượng dự trữ. 重新传入该键进行重放, chứng minh kết quả thực sự của lưu trữ tầng dưới không bị ô nhiễm.
10. 关闭并重新开账文件, thông qua khóa kiểm tra dữ liệu dự trữ hoàn toàn hoàn toàn không bị mất.

Xin giữ an ninh kỹ thuật: Nếu dữ liệu lưu trữ thực sự tồn tại trong một dịch vụ nhỏ độc lập khác, xin nêu rõ liệu dịch vụ nhỏ này có hỗ trợ cùng một khóa như vậy hay không, hoặc liệu phải đưa vào hộp gửi giao dịch (transactional outbox) để nối kết các thông tin gửi địa phương với các tác dụng phụ của đường xa.

## 交付产物

`outputs/skill-mcp-reliability-reviewer.md`là một kỹ năng kiểm tra độ tin cậy có thể lặp lại cao. Nó cung cấp các hoạt động của MCP, các phương pháp truyền tải được sử dụng, các chiến lược siêu thời gian, các quy tắc thử lại, các chiến lược hàng ngũ và cơ chế phục hồi, nó có thể tạo ra một bảng phân tích cạnh tranh hoàn chỉnh, bảng phân loại thử lại, các định nghĩa ranh giới, bảng kiểm tra kiểm soát lưu lượng và các trường hợp thử nghiệm cố định đối phó.

## 验证标准

Khi tất cả các mục tiêu sau được đạt được, mục tiêu của chương trình này là hoàn thành:

- stdio 取消操作发送 `notifications/cancelled`且不接收任何响应──
- Streamable HTTP 取消操作直接关闭响应流,绝不发送多余的取消 POST 请求。
- 先取消后完成能正确抑制并抹除最终响应──
- 先完成手取消能保留合法响应并静默忽略迟到的取消信号。
- Thông báo tiến bộ có thể đặt lại khoảng thời gian quá cao, nhưng không thể trì hoãn quá cao.
- Chỉ cần thay đổi ID JSON-RPC mới sẽ dẫn đến việc viết không được bảo vệ được thực hiện lần thứ hai.
- Trong hai kết nối và phát triển trong trạng thái cạnh tranh, cùng một khóa cùng với các tham số phù hợp đảm bảo chỉ thực hiện một lần.
- 已提交记录在关闭并重新开后完好保存,且重放返的是防御性副本──
- Chế độ chuyển đổi không thể phá hủy dữ liệu lưu trữ lâu dài tầng dưới.
- Có giới hạn kiểm soát được kiểm soát chặt chẽ trong giới hạn dung lượng dưới áp lực, và không bao giờ mất phản ứng cuối cùng.
- Cơ chế liên kết phát hành yêu cầu mới, không mang theo`Last-Event-ID`,并全量重受影响状态──
- `tasks/cancel`检查点发现前保持非终态──

## 生产环境故障模式

| 故障现象 | 观察到的表象 | 正确处理方案 |
|---------|--------------------|------------------|
| HTTP 客户端 POST 发送取消通知 | 服务端与客户端对请求的生命周期产生分歧 | 直接关闭该请求专有的 SSE 响应流 |
| 服务端在接受取消后依然回传响应 | 客户端收到一份已无法使用的陈旧无用结果 | 当取消获胜时停止业务计算并抑制所有后续消息 |
| 进度通知无限重置所有超时时钟 | 挂起卡死的任务永久占用资源无法退出 | 维持一个独立的全局绝对最大超时硬上限 |
| 将新的 RPC id 当成请求去重依据 | 扣款、发布或删除操作被多次重复执行 | 在应用层引入并强制校验持久化幂等键 |
| 键检查与业务副作用彼此分离 | 并发执行的多个 worker 同时判定键不存在 | 将键占位、副作用记录与结果提交放入单次原子事务 |
| 在多副本集群中使用内存级账本 | 节点重启或换到另一台机器后遗忘了先前的提交 | 使用持久化共享存储或依赖上游系统的幂等支持 |
| 直接返回底层存储的可变对象引用 | 调用方的内存修改意外污染了后续重放结果 | 将提交结果序列化存储，返回时构造深拷贝副本 |
| 相同的键被复用于篡改后的参数 | 单个幂等键混淆了两种不同的业务意图 | 持久化记录并校验调用参数的哈希指纹 |
| 进度通知队列无界增长 | 遇到慢消费者时服务内存持续飙升直至 OOM | 在容量限制内对可替代的进度通知进行合并与淘汰 |
| 在高压下误丢弃了最终响应 | 客户端永远无法获知该请求的最终成败 | 预留专用容量或只淘汰进度通知，绝不丢弃最终响应 |
| 反向代理缓冲了 SSE 事件 | 进度事件呈突发性到达，或在全部执行完后才下发 | 禁用代理缓冲（`X-Accel-Buffering: no`）并调整代理超时 |
| 盲目假定支持 `Last-Event-ID` | 客户端尝试从服务端根本不支持的位点续传 | 使用新请求重连并向权威数据源全量拉取 |
| 所有客户端在断开后同一瞬间重连 | 系统恢复的瞬间引发严重的次生雪崩风暴 | 采用带上限保护、结合随机抖动的指数退避重连机制 |
| 将 Task 的确认回执当成已完成取消 | 前端界面显示已停止，而后台 worker 仍在计费运行 | 持续轮询 Task 状态直到其真正进入终态 |

## Capstone 串联

工具生态 Capstone 项目 nên xem tính đáng tin cậy của hệ thống như là chứng chỉ mã có thể thực hiện, chứ không phải là hai dòng chữ trong cấu trúc hệ thống.

Capstone phải cung cấp chứng chỉ giao dịch sau:

- Ứng dụng của các công ty giao dịch truyền thông
- Đối với tất cả các mô hình tái thử nghiệm quyết định của các hoạt động được tiết lộ;
-  như ghi chép giữ vững các khóa và kiểm tra chặn khi các tham số không phù hợp;
- 并发同键争夺记录"", tái khởi động" và thử nghiệm phân lập đối tượng có thể biến đổi;
- Có giới缓冲区过载状态下流控处理日志;
- Quản lý tiêu đề của SSE đối lập với các hướng dẫn chiến lược bảo vệ không gian;
- Định nghĩa các chương trình khôi phục lại toàn bộ và khắt khe kết nối của các kết nối thu thập dữ liệu quyền lực;
- Trong khi giới thiệu nhiệm vụ  mở rộng, hoàn chỉnh của nhiệm vụ kéo dài  xóa các liên kết theo dõi.

Việc sử dụng thành công trong một quá trình địa phương duy nhất chỉ chứng minh rằng nó đã chạy qua các chức năng cơ bản. Chỉ khi mất đáp ứng, chậm đến hủy bỏ, người tiêu dùng chậm và những cơn bão trở lại có thể tạo ra kết quả xử lý chắc chắn và mong đợi, Capstone của bạn mới thực sự có mức độ sản xuất sẵn sàng.

## 关键术语

| 术语 | 含义 |
|------|---------|
| 请求取消（Request cancellation） | 放弃单次处于在途状态的 MCP RPC 请求 |
| 取消竞态（Cancellation race） | 终态执行完成与取消信号抵达之间的时序争夺 |
| 空闲超时（Idle timeout） | 距离上一次产生有效请求活动的最大允许时间 |
| 最大超时（Maximum timeout） | 从请求开始时刻算起、不受进度通知影响的全局绝对时间上限 |
| 幂等键（Idempotency key） | 唯一标识单次特定业务意图的应用层去重标识符 |
| 原子账本（Atomic ledger） | 将键校验、副作用记录与结果提交绑定为不可分割单元的持久化存储 |
| 背压（Backpressure） | 在生产者生成速度超过消费者处理能力时施加的流量控制机制 |
| 进度合并（Progress coalescing） | 用更新的权威进度数值替换掉旧的进度更新 |
| 权威重拉（Refetch） | 在数据流中断或出现断层后，向权威接口重新读取当前全量状态 |
| 抖动（Jitter） | 在重试退避间隔中引入的随机偏移，用于在时间轴上打散瞬时并发高峰 |

## 延伸阅读

- [MCP 请求取消机制规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation)
- [MCP 进度通知规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/progress)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Tasks 扩展规范提案](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
