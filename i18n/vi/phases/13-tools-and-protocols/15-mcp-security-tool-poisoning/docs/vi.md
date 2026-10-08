# MCP 安全:元数据投毒、路由与MRTR 状态

> Không trạng thái không có nghĩa là không tin tưởng. Nó có nghĩa là mỗi yêu cầu phải được phơi bày ra máy chủ và cửa ngõ để tiến hành kiểm tra độc lập.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~60 minutes

## Học mục tiêu

- Mô tả công cụ, ghi chú, thông tin khách hàng và thông tin máy chủ đều được coi là dữ liệu không thể tin cậy.
- 检测元数据投毒(mất độc siêu dữ liệu) 描述器 恶意改(rug pull)以及跨服务器的名字冲突与遮蔽(遮蔽) 
- 验证 2026-07-28 版本的请求元数据与流通 HTTP 路由头部──
-  bảo vệ MRTR `requestState`免受改,并将人工确认与精确调用论据 强绑定──
- Sẽ được cấp quyền và giới hạn tốc độ (rào giới hạn) được áp dụng cho chủ sở hữu chứng nhận (chủ), chứ không phải là đã được di chuyển của phiên thỏa thuận.

## 问题

模型 phụ thuộc vào đọc công cụ mô tả để quyết định điều gì. 路由器 phụ thuộc vào đọc công cụ tên để quyết định sẽ yêu cầu gửi đến đâu. 用户 phụ thuộc vào đọc giao diện thẻ để quyết định phê duyệt hoạt động.

Chỉ dẫn an ninh chính thức của MCP rất trực tiếp: trừ khi mô tả và ghi chú đến từ máy chủ hoàn toàn tin cậy, nếu không thì một luật nên coi là dữ liệu không tin cậy. Ngay cả khi điều đó xảy ra, tình trạng tin cậy trong quá trình vận hành cũng sẽ thay đổi. Một lần máy chủ 更新、 một gói phụ thuộc bị nhiễm độc, một lần đăng ký 配置错误, hoặc một lần gateway 合并, có thể thay đổi nội dung của mô hình xem.

Trong hiệp định cốt lõi năm 2026-07-28, không có giai đoạn nắm tay, không có phiên cấp truyền tải nào.`Mcp-Session-Id`Để buộc giấy phép phê duyệt, giới hạn tốc độ hoặc thiết kế an ninh lịch sử kiểm toán, đã không còn phù hợp với các tiêu chuẩn của thỏa thuận hiện tại.

## 概念

### 7 mặt tấn công đáng kiểm tra

Thay vì cố gắng để làm cho bạn nhớ, hãy theo một danh sách phòng thủ rõ ràng:

1. **元数据投毒（Metadata poisoning）：**mô tả được nhúng trong công cụ với tuyên bố  hành vi hoàn toàn không liên quan đến chỉ thị(如提示注入、越狱) 
2. **Descriptor 恶意篡改（Descriptor rug pull）：**之前已被用户或系统批准的名称,描述,方案或注释 发生静默变更──
3. **跨 server 名字遮蔽（Cross-server shadowing）：**Hai đầu sau đã tiết lộ tên công cụ không được giới hạn, và nhà điều khiển đã chọn một trong số đó theo thứ tự đăng ký.
4. **Header 与 Body 混淆（Header and body confusion）：**HTTP 头部 của`Mcp-Method`Hoặc`Mcp-Name`Không phù hợp với JSON-RPC Ứng dụng trong nội dung không phù hợp.
5. **Capability 权限提权（Capability escalation）：**Trong yêu cầu, một thiết bị đã tuyên bố một phần mở rộng hoặc tính năng khách hàng, và máy chủ đã sai lầm sẽ coi tuyên bố này là chứng chỉ được cấp phép.
6. **MRTR 状态篡改（MRTR state tampering）：**客户端改了 `requestState`、 trả lời một câu hỏi xác nhận hoàn toàn khác nhau, hoặc sẽ sử dụng bằng chứng xác nhận cũ để sử dụng các lập luận sau khi thay đổi trên.
7. **供应链身份混淆（Supply-chain identity confusion）：**Để một cái nhìn quen thuộc hiển thị tên hiển thị tên) như nhà phát hành hoặc máy chủ thực sự chứng minh danh tính.

Những cuộc tấn công này thường liên kết với nhau. Haci Lock (Hash Pinning) giúp phát hiện các biến đổi sau mô tả, nhưng không thể chứng minh mô tả ban đầu là an toàn.

### Khi trước yêu cầu tín hiệu là bằng chứng, chứ không phải danh tính

Mỗi phiên bản 2026-07-28 của yêu cầu đều bao gồm:

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "elicitation": {"form": {}}
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "security-lab",
      "version": "1.0.0"
    }
  }
}
```

Trong mỗi yêu cầu phải xác minh phiên bản giao thức và tính hiệu quả cấu trúc của khả năng.**绝不能**- Đưa đi.`clientInfo`Khi được chứng nhận, nó chỉ đơn giản là dữ liệu của báo cáo tự động của khách hàng.

Tương tự như vậy cũng áp dụng cho kết quả trong dữ liệu.`io.modelcontextprotocol/serverInfo`Nó rất hữu ích cho hồ sơ ghi chép và kiểm tra, nhưng nó không phải là chứng chỉ số, cũng không phải là chứng chỉ đăng ký, không thể được sử dụng như một cơ sở cho quyết định ủy quyền.

### Chuyến đi, tái thực hiện chiến lược

 Đối với `tools/call`,Streamable HTTP 传输层 chứa các phần sau:

```text
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.export
```

Phương pháp trong đầu  phải phù hợp với phương pháp trong cơ thể  hoàn toàn phù hợp.`params.name`完全一致. 在选择后端、应用 RBAC (RBAC) 基于角色的访问控制) 或消耗限流代币 之前,一旦发现不一致,必须立即返回 `-32020`错误进行拒绝――

Phương pháp kiểm tra này đã loại bỏ những lỗ hổng khác biệt thường thấy: ngăn chặn sự xuất hiện của một bộ phận dựa trên cơ quan  ủy quyền, trong khi một bộ phận khác dựa trên tình huống đường dẫn tiêu đề .

底层报文验证 tuân theo một quy trình nghiêm ngặt: trước tiên kiểm tra JSON-RPC và các loại dữ liệu, so với giá trị của tiêu đề và cơ thể, sau đó kiểm tra xem phiên bản phù hợp có được hỗ trợ hay không.`-32020`Nếu tiêu đề và phần mềm không được hỗ trợ, hãy quay lại HTTP 400 với mã lỗi.`-32022`, và`data`必须精确为 `{"supported":["2026-07-28"],"requested":"<actual>"}`◊ Nếu yêu cầu một cách không rõ, thì trả về HTTP 404 với mã lỗi `-32601`

Khi các giao ước cần phải cấu trúc hóa thông tin phục hồi, mỗi lỗi đối tượng có thể chứa các tùy chọn.`data`字段──由于通知(notification) không có `id`, vì vậy nó sẽ không bao giờ nhận được JSON-RPC thành công hoặc phản ứng sai lầm.

### Đối với toàn bộ Descriptor  thực hiện hash khóa (Pinning)

仅对描述 计算哈希会遗漏 schema 和注释的改──必须对用户批准的所有描述符 字段进行规范化(canonicalize)并计算哈希:

```python
normalized = json.dumps(tool, sort_keys=True, separators=(",", ":"))
digest = hashlib.sha256(normalized.encode()).hexdigest()
```

Sẽ được tiêu hóa  lưu trữ trong hoàn toàn giới hạn chìa khóa như`notes.export`) 下, và ghi lại trong môi trường sản xuất chứng chỉ và thời gian phê duyệt của người phát hành.

Trong mỗi lần tẩy rửa hoặc phát hiện:

- 未知键: cách ly (quarantaine) cho đến khi kiểm tra nhân tạo hoàn thành.
- Như một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một phần của một của một phần của một của một phần của một phần của một phần của một phần của một của một phần của một phần của một phần của một phần của một của một phần của một phần của một của một phần của một phần của một của một phần của một phần của một của một của một phần của một phần của một
- 重复的未限定名称: yêu cầu bắt buộc xác định性的命名空间划分──
- 静态扫描命中: chặn截并全面审查 toàn bộ mô tả.

哈希一致 chỉ có thể chứng minh nội dung không thay đổi, không thể chứng minh tính chất an toàn của nó.

### 静态扫描 là một cảnh báo

Các mô hình phù hợp đơn giản có thể đánh dấu các thẻ đóng vai trò, lệnh phủ kín, hành vi ẩn, truy cập bí mật và các mục đích ngoài mạng đáng ngờ.

Nhưng việc quét tĩnh không thể được coi là chứng minh ngữ pháp. Một mô tả an toàn có thể chứa các câu nói được đánh dấu trong cảnh báo an toàn hợp pháp; trong khi một mô tả ác ý được xây dựng kỹ lưỡng hoàn toàn có thể tránh khỏi tất cả các từ khóa.

### 合并之前进行命名空间隔离

Ước gì hai máy chủ đã lộ tên `search`Công cụ, không thể được xác định bởi sự đăng ký của các phát hiện thứ tự trước đó.

```text
notes.search
issues.search
```

完全限定名就是对外曝光的门户 公共名称.`Mcp-Name`路由全部指向同一实体对象──

### Khả năng là một tuyên bố khả năng

Trong mỗi yêu cầu`clientCapabilities`Chỉ cần thông báo máy chủ khách hàng có thể xử lý các tính năng giao thức nào.**绝不代表** cấp quyền truy cập công cụ của khách hàng DATA hoặc quyền hoạt động 

授权仍然完全来自已认证的主体 (主体) 主要) 与资源策略──严格的执行步骤为:

1. 认证传输层凭证──
2. 验证协议版本、headers以及请求结构──
3. Khả năng kiểm tra 兼容性。
4. Đối với chủ đề, công cụ, tài nguyên và các lập luận  thực hiện quyền nhận xét.
5. 执行操作或向用户请求输入──

### 保护无状态 MRTR  xác nhận

具有重大影响的工具 (后续工具) có thể cần xác nhận của người dùng.

Động thái đầu tiên:

```json
{
  "resultType": "input_required",
  "inputRequests": {
    "confirm": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Export notes to archive?",
        "requestedSchema": {
          "type": "object",
          "properties": {
            "confirm": {"type": "boolean"}
          },
          "required": ["confirm"]
        }
      }
    }
  },
  "requestState": "opaque-integrity-protected-value"
}
```

客户端 thu nhập user sau khi nhập, sử dụng mã JSON-RPC mới 重试原始方法:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes.export",
    "arguments": {"query": "private", "destination": "archive"},
    "requestState": "opaque-integrity-protected-value",
    "inputResponses": {
      "confirm": {
        "action": "accept",
        "content": {"confirm": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

Mỗi người`inputRequests`                                                                                                                                                                                                                                                              `method`和 `params`                                                                                                                                                                                                                                                              `inputResponses`Trung 应条目一致──表单诱导(form elicitation) sử dụng như một đối tượng vì gốc节点 của `requestedSchema`, và khách hàng phải có khả năng yêu cầu biểu mẫu trên máy chủ 发起请求前已声明.

Hiện tại có hai loại hợp pháp cho phép biểu hiện một khả năng:`{"elicitation":{}}`隐式支持表单; và`{"elicitation":{"form":{}}}`为显式声明――若仅声明 URL 支持`{"elicitation":{"url":{}}}`),则不支持表单请求──此时服务器会返回 HTTP 400 与错误码 `-32021`, và`data.requiredCapabilities`Vì vậy`{"elicitation":{"form":{}}}`

必须将 `requestState`视为不可信输入── đối với chữ ký hoặc mật mã, kiểm chứng nghiêm ngặt,并将其与方法,工具,精确论点,操作目的,过期时间,认证主体以及一次性随机数(nonce,用于防重放)强力绑定──本课代码演示了利用HMAC和精确参数比对构建清晰的安全边界──

Không có tài liệu nào được bảo tồn chỉ trong một cổng vào trong kho lưu trữ. Mô hình có thể vận hành được đưa vào một kho lưu trữ có giới hạn, có TTL  thanh toán, có thể được sử dụng bởi nhiều cổng vào.`cancel`Không thực hiện bất kỳ hoạt động nào, và giữ được trạng thái thử nghiệm trước hết hạn.

切勿将确认上下文藏在某协议会议中──集群中的任何一个服务器 实例都必须能够独立验证重试请求──

### 高风险调用的两人法则(Đạo luật hai)

Từ ba chiều để một lần điều chỉnh để phân loại:

- 否消费不可信输入──
- Có thể truy cập dữ liệu nhạy cảm không?
- Có phải sẽ có tác động lớn bên ngoài không thể đảo ngược được không?

Bất kỳ bước tự động hóa đơn lẻ nào cũng không thể có cùng ba đặc điểm này. Một khi tập hợp, chúng phải phân chia, giảm quyền, hoặc thông qua MRTR, đưa ra xác nhận nhân tạo rõ ràng. Đây là một nguyên tắc thiết kế, chứ không phải là khả năng cứng của giao thức.

### Trong thực hiện trước quyền hạn rút ngắn (Reduce Authority)

Không trạng thái tự nó không đồng nghĩa với an ninh. Mặc dù nó đã loại bỏ rủi ro bị ẩn trong cuộc họp lịch sử, nhưng một yêu cầu tự chứa vẫn có thể sử dụng quyền của người xử lý quá lớn để tiết lộ dữ liệu hoặc gây ra sự phá hủy không thể đảo ngược. An ninh thực sự đến từ quyền thu hẹp ở mỗi cấp độ biên giới:

1. **类型化动词（Typed verb）：**暴露单一受限操作`archive_note`), thay vì biến đổi`run`Hoặc`request`Đây là loại công cụ có thể dẫn đến khả năng không mong đợi.
2. **校验参数（Validated arguments）：**尽可能采用封闭的方案,拒绝未知字段,进行标识符单次规范化,限制用负载大小,并评估策略前验证目标地址、租户归属与资源所有权──
3. **即时鉴权（Current authorization）：**Để xác định chủ đề đã được xác nhận với các động từ, nguồn lực, môi trường và quy định được xác định.
4. **绑定动作的审批（Action-bound approval）：** Đối với việc áp dụng hiệu quả cao, việc phân tích các yếu tố phê duyệt nhân tạo và kiểu hóa và quy định  buộc, và thêm chủ đề  quá hạn thời gian và chiến lược đơn giản hiệu quả bất kỳ biến động của các yếu tố nào đều phải được khởi hành lại phê duyệt
5. **一等拒绝（First-class refusal）：**Sẽ từ chối, phê duyệt hết hạn, người dùng từ chối và không an toàn mục tiêu xem như kết quả dự kiến thường xuyên, không thực hiện bất kỳ tác dụng phụ nào, sẽ không thể từ chối giảm hạng trở lại công cụ dự phòng quyền hạn yếu hơn.
6. **脱敏审计证据（Redacted audit evidence）：**记录请求者、采用入口描述器与策略版本、授权规范化目标、允许或拒绝的原因,以及是否已开始执行──

Mỗi phần được gắn liền với một bộ phận có thể thực hiện. Các quy trình xử lý cuối cùng được nhận được nên là lệnh lĩnh vực đã được chứng minh, chứ không phải bằng chứng rộng rãi của mô hình gốc. Trong khi MRTR tái thử, cập nhật nhiệm vụ hoặc chuyển phát mạng, phải hoàn toàn chuyển sang các liên kết.

### 当前与遗留交互路径

Trong quy định 2026-07-28, Roots、Sampling và Logging  đối với các ứng dụng mới đã bị chính thức bỏ rơi.

Đừng xoay quanh việc lấy mẫu theo số lượng phiên  giới hạn  giới hạn  xây dựng cơ chế phòng thủ mới  giới hạn số lượng  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới hạn  giới  giới  giới hạn  giới  giới  giới hạn  giới  giới  giới hạn  giới  giới  giới  giới  giới  giới  giới  giới    giới  giới                          

### 无状态 Giao thông 检查项

- Trong một POST 端点接收现代 MCP 报文。
- Đối với các điểm này của hiện đại GET và DELETE Ứng dụng quay lại 405 Phương pháp không được phép.
- Không tạo ra và không phụ thuộc`Mcp-Session-Id`
- 忽略旧版会议 和重放头部, phải coi nó như quyền nhập.
- Để cho POST yêu cầu trả lại JSON hoặc yêu cầu lớp作用域 của SSE.
- Chỉ trong trường hợp được xác định rõ ràng của hai bên, sử dụng`subscriptions/listen`接收长生命周期的变更通知.

```figure
tp-tool-poisoning
```

## 动手构建

`code/main.py`实现 một quy trình nhẹ trong mô hình bảo mật mạng. Nó được thực hiện với mô tả công cụ hoàn chỉnh  quy định và khóa hash, báo cáo dữ liệu nhập với tên 遮蔽, xác minh                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `requestState`Với kho lưu trữ có thể nhập vào được chia sẻ chống tái lưu trữ hoàn thành hai vòng xác nhận quá trình xuất khẩu.

Mô hình này được khởi động sau khi các HTTP 适配器 phân tích JSON yêu cầu và đường dẫn đầu. Nó tự không xác minh.`Content-Type`Hoặc`Accept` Bạn có thể kết nối với một bộ phát phát và một bộ chuyển tải HTTP 适配器 hoàn chỉnh trong lớp 9, sau đó yêu cầu bắt buộc `Content-Type: application/json`且 `Accept`Đồng thời bao gồm`application/json`Với`text/event-stream`

运行 nó:

```bash
cd phases/13-tools-and-protocols/15-mcp-security-tool-poisoning
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Ví dụ mã cố tình sửa đổi một mô tả.`input_required`响应与无状态重试的完整流程──

## Sử dụng nó

将代码中的`SAFE_TOOLS`替换为您自己的批准的服务器 规范化快照. 快照中不要包含敏感凭证和密钥. 在更新任何代码前,必须全面人工审查新增或变化的描述器.

Trong khi phát hiện, trong khi thực hiện bộ kiểm tra này, và được phát hành chính thức trước khi được phát hành một lần nữa.

## 交付 nó

本课交付 `outputs/skill-mcp-threat-model.md`Nó cung cấp một bộ kỹ năng xây dựng mối đe dọa đối với các thỏa thuận hiện tại, bao gồm toàn diện dữ liệu, đường dẫn, khả năng, ủy quyền, MRTR, lưu trữ, đăng ký và biên giới khả năng tương thích.

## 课后深练习

1. Việc kiểm tra được xác nhận với các quyết định ủy quyền hiện tại được gắn vào trạng thái MRTR kín, và từ chối yêu cầu thử lại được phát hành với tư cách của một đối tượng khác.
2. 将内存防重放储存替换为基于数据库的持久化条件写入 (条插入), chứng minh hai quá trình phát triển không thể phát triển cùng một lúc với một nonce.
3. Trong khi đó, các quy tắc về việc kiểm tra có thể đảm bảo sự phục hồi an toàn của các vụ việc hoặc các quy tắc khác.
4. Chỉ sửa đổi một công cụ của `inputSchema`Trong khi đó, giữ cho mô tả của nó không thay đổi, xác nhận mô tả toàn bộ khối lượng  khóa cơ chế có thể hoặc không chính xác bắt được  biến đổi.
5. 增加一项安全策略: Khi các chủ đề khác nhau xem những gì `tools/list`存在差异时,禁止进行公共缓存(公共缓存)
6. Trong mạng, kết nối với một phiên bản cũ của máy chủ, sẽ tất cả các tay và phiên bản logic hoàn toàn tách biệt trong rõ ràng`2025-11-25`兼容分支中──

## 关键术语

| 术语 | 含义 |
|------|------|
| 元数据投毒（Metadata poisoning） | 在 tool descriptor 中嵌入恶意提示词指令或欺骗性声明 |
| 恶意篡改（Rug pull） | 针对先前已获审批的 descriptor 进行未授权的静默修改 |
| 名字遮蔽（Tool shadowing） | 由未加限定的重复 tool name 导致的路由歧义与覆盖 |
| 头部不匹配（Header mismatch） | 路由 header 与 JSON-RPC body 内容冲突，触发错误 `-32020` |
| 哈希锁定（Hash pin） | 对经审核批准的完整规范化 descriptor 计算所得的 SHA-256 digest |
| MRTR | 多往返请求模式（Multi Round-Trip Requests），用于 server 主动请求输入并由 client 无状态重试 |
| `requestState` | 往返传递的不透明状态值，必须作为不可信输入进行完整性保护与校验 |
| Capability 声明 | 仅表示协议特性的兼容性声明，绝不代表授权与访问许可 |
| 隐式表单支持 | 空的 `elicitation` capability 对象 `{}`，等同于显式声明支持表单 |
| 完全限定名（Qualified tool name） | 网关层稳定的命名，如 `notes.search`，防止命名冲突 |

## 延伸阅读

- [MCP 安全与信任指南（Security and Trust Guidance）](https://modelcontextprotocol.io/specification/2026-07-28#security-and-trust--safety)
- [多往返请求（Multi Round-Trip Requests）规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [Streamable HTTP 传输协议](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [已废弃特性（Deprecated Features）清单](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
