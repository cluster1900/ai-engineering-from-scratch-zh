# MCP 一致性工程: phiên bản kiểm soát, chứng minh và vận chuyển

> 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规―― thực sự đồng nhất hiện đang diễn ra trên tuyến nguyên thủy、版本边界间、穿透中间代理时,以及面临回滚的时刻──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 17 (gateways), Phase 13 · 30 (registry admission)
**Time:** ~100 minutes

## Học mục tiêu

- 将规范性的 MCP 协议规则转化为黄金记录(金) 与负面拒绝(负面)交互语料库──
- Sẽ nghiêm ngặt`2026-07-28`行为与受约束的旧版回退 (trái lại theo truyền thống) cơ chế
- 精确区分附加性未知字段与非法的未知 `resultType`
- Để phân biệt các chứng cứ JSON-RPC gốc với các hình ảnh sau khi SDK được quy định.
- Trên ranh giới cấp đại diện thực tế, kiểm tra sự phù hợp và toàn vẹn của HTTP 标签 với yêu cầu.
- Thông qua các hồ sơ giao tiếp sau khi bị mất mẫn, chỉ số sức khỏe và chứng chỉ quay lại để xây dựng và phát hành.

## 核心问题

Khách hàng của bạn thông qua SDK thành công đã được sử dụng `tools/list`Không có được danh sách công cụ.

Nhưng nó đã để lại nhiều vấn đề quan trọng chưa được giải quyết:

- Có thực sự mang theo dữ liệu của thỏa thuận tách biệt theo yêu cầu hiện đại trong báo cáo yêu cầu không?
- `MCP-Protocol-Version``Mcp-Method`和 `Mcp-Name`Có phải hoàn toàn phù hợp với JSON-RPC yêu cầu?
- 响应报文在线路是否合法 `resultType`Hay là do SDK tự quyết định hoàn toàn?
- 客户端能否无损保留未来的前向附加字段?
- Khi nhận được mã lỗi giao thức hiện đại đã được xác định, sẽ có lỗi tác động đến việc hạ cấp các quy trình cầm tay phiên bản cũ?
- Trung间代理 có hoàn toàn thông qua mã trạng thái HTTP của trang nguồn với JSON-RPC  thông tin sai?
-  Có phải các bộ vi xử lý thông báo đơn hướng đã phát hành báo cáo phản ứng không?
- 运维团队 có thể chứng minh tại sao một phiên bản nào đó được cấp hoặc được thực hiện lại trong khuôn khổ không tiết lộ mật khẩu chứng chỉ?

协议一致性 là một tập hợp các không biến thể được quan sát khách quan.

```figure
mcp-conformance-operations
```

## Từ phiên bản纪元(Version Eras) bắt đầu

MCP `2026-07-28`规范采用完全自含的按请求元数据(per request metadata)`params._meta.io.modelcontextprotocol/protocolVersion`和 `params._meta.io.modelcontextprotocol/clientCapabilities`                                                                                                                                                                                                                                                              `protocolVersion`Hoặc`clientCapabilities`裸键均属于格式变化──当 HTTP 边界存在镜像路由标标题时, số lượng của nó phải tuân thủ nghiêm ngặt JSON-RPC 请求体──现代规范下所有成功响应结果都必须携带`resultType`

Và đến`2025-11-25`                                                                                                                                                                                                                                                              `resultType`Kết quả của phiên bản cũ chỉ được giải thích hoàn chỉnh sau khi khách hàng đã thảo luận và chọn phiên bản cũ.

Không cần phải viết một máy kiểm tra rộng rãi có hai kiểu:

| 分支 | 准入凭证 | 缺少 `resultType` 的处理 | 初始化握手 |
|---|---|---|---|
| 现代纪元（Modern） | 成功的 `server/discover` 或已识别的现代响应 | 判定为非法（Invalid） | 不再作为默认建立连接路径 |
| 旧版纪元（Legacy） | 现代探测无果后，目标命中白名单且返回合法的旧版 `initialize` 响应 | 解释为 complete | 该纪元所必需的强制步骤 |

Sự tách biệt nghiêm ngặt này đã loại bỏ các sai lầm kiểu mẫu của các mô hình hiện đại vì sự thử nghiệm rộng rãi và chỉ được vượt qua các nguy cơ của thử nghiệm.

### 严格模式

严格模式(Strict mode) yêu cầu đối với端 phải thể hiện hiện hiện hiện tượng của các hành vi giao ước trực tiếp.`server/discover`即可确立现代分支── nhận được một lỗi đã được nhận ra của JSON-RPC hiện đại 错误(如`-32020``-32021`Hoặc`-32022`) cũng có thể thiết lập bộ phận hiện đại tại nên sửa đổi yêu cầu hoặc chấm dứt quy trình,**绝不能**降级回归旧版协议。

### 回退模式

Trình quay trở lại (Fallback mode) cho phép thực hiện một lần kiểm tra hiện đại có giới hạn. Nếu gặp quá thời gian, không đáp ứng, kết nối bị gián đoạn hoặc không thể nhận ra, tất cả đều thuộc về  không kết luận. Không kết luận, chúng không thể chứng minh trực tiếp rằng kết thúc là các nút phiên bản cũ. Chỉ có những điểm cuối được phép hoặc nằm trong danh sách trắng trong cấu hình, và sau đó có thể nhận được một lần kiểm tra phiên bản cũ được hạn chế; và khách hàng chỉ có thể kiểm tra các nút trong phiên bản cũ.`initialize`Kết quả và phiên bản đàm phán được phê duyệt sau khi được xác nhận,才能正式切换到旧版分支.

Trở lại không phải là như  một khi báo lỗi đã thử bản cũ ── một lỗi hiện đại đã được nhận ra tự nó chứa đựng những lỗi sửa chữa có giá trị cực kỳ cao trên bản sau đây── sau khi nhận được loại lỗi này, chỉ che giấu các lỗi cấu hình thực sự như không phù hợp, tuyên bố thiếu năng lực hoặc phiên bản không phù hợp, chẳng hạn như:

Thiết kế này có thể ngăn chặn kẻ tấn công, lỗi mạng hoặc quá trình đại lý bằng cách cố ý bỏ rơi phản ứng hiện đại để hạ cấp hệ thống bắt buộc.

Trong mỗi bản ghi chép giao tiếp phải có một dấu hiệu rõ ràng của các kỷ luật được chọn. Nếu thoát khỏi các kỷ luật trên, một đoạn nào đó thiếu sót trong một vòng kiểm tra dường như hợp pháp, trong một vòng kiểm tra khác sẽ bị kết án là vi phạm chết người.

## 构建交互记录语料库(Transcript Corpus)

Một phần quy định của giao tiếp ghi chép (Fixture) ghi lại là thực tế thông qua biên giới của thực tế báo cáo văn bản, không chỉ là điều chỉnh của SDK Layer:

```json
{
  "name": "golden-modern-list",
  "era": "modern",
  "headers": {
    "MCP-Protocol-Version": "2026-07-28",
    "Mcp-Method": "tools/list"
  },
  "request": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {
      "_meta": {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  },
  "responseStatus": 200,
  "responseBody": {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "resultType": "complete",
      "tools": []
    }
  }
}
```

测试语料库 nên bảo quản hai loại hồ sơ:

### 黄金记录(Gold Transcripts)

 ghi chép vàng dùng để chứng minh hành vi hợp pháp đã được chấp nhận chính xác:

- mang theo dữ liệu phù hợp với các phát hiện hoặc yêu cầu phương pháp hiện đại của tiêu đề;
- 携带必需字段的完整结果(`complete`);
- Khi phương pháp cần tiếp tục giao tiếp`input_required`Kết quả
- Chỉ sau khi tuyên bố trước về khả năng đối phó mới được phép trả lại kết quả mở rộng;
- Trong một số thời đại mới nhất, tỉnh `resultType`Kết quả của phiên bản cũ;
- Không trả lại bất kỳ JSON-RPC 响应 của Thông báo  xử lý quy trình.

Ước ghi vàng phải chính xác và chặt chẽ.

### 负面记录(Negative Transcripts)

负面记录用于 chứng minh hành vi vi vi phạm đã được quyết tâm từ chối:

- 标头与请求体不一致;
- 缺少 đối với mỗi yêu cầu tuyên bố khả năng;
- 协商版本 không được hỗ trợ;
- 现代请求下缺失 `resultType`-
- Không biết hoặc không được thông báo `resultType`-
- 响应中 `jsonrpc`Không vì`2.0`, hoặc ID trả lại không phù hợp với các loại số hoặc JSON;
- Đồng thời bao gồm`result`和 `error`, hoặc cả hai đều thiếu  biến động;
- 缺少整数 `code`hoặc字符串 `message`của sự sai lầm đối tượng;
- Để biết được giao thức sai lầm được hiển thị thành mã trạng thái HTTP sai lầm;
- Để thông báo 错发送响应;
- 变的 JSON-RPC 信封格式;
- Trung间代理 đối với thỏa thuận sai lầm xảy ra 崩吞没(Collapse)

Đối với mỗi trường hợp sử dụng tiêu cực, phải khẳng định giới hạn chính xác của việc từ chối của nó với mã lỗi ổn định.`-32020`Trong hình ảnh, chúng có thể được gọi là thất bại, nhưng chúng truyền tải thông tin cho người vận chuyển hoàn toàn không thể nói cùng ngày.

标题 không phù hợp 试器 phải buộc các kết luận trên dịch vụ thực sự trả về HTTP 400, và mang theo ID yêu cầu phù hợp với mã lỗi `-32020`❖ Mỗi ngày các máy kiểm tra địa phương quan sát`HeaderMismatch`Khi, phải bắt buộc thực hiện tuyên bố, và không thể coi nó là một dấu hiệu có thể chọn. Nếu vì trả lại HTTP 500 của không yêu cầu và kết thúc, ngay cả khi xác định địa phương từ chối mã chính xác, cũng là thất bại của thử nghiệm. Một bộ thử nghiệm đã kết thúc sau khi yêu cầu của mình, nhưng kết quả chỉ là nó, không hề liên quan đến hoạt động giao tiếp trực tuyến thực sự của dịch vụ.

官方 MCP 一致性测试套件 là một tiêu chuẩn bên ngoài quý giá và phiên bản tham khảo. Nhưng cần thiết phải bảo vệ tập hợp hồ sơ giao tiếp của riêng bạn, vì tập hợp kiểm tra công cộng không thể bao gồm các đại lý cụ thể của bạn, SDK cụ thể, dòng chảy quyền nhận dạng cụ thể và các tuyến phát hành sản xuất.

## Giá trị tiêu đề phải phù hợp với RPC yêu cầu

Trong giao thức HTTP Streamable hiện đại, trung gian đại lý có thể sử dụng để thực hiện các đường dẫn hoặc thực hiện các chiến lược bảo mật của tiêu đề gương. Nhưng các yêu cầu JSON-RPC luôn luôn là nguồn duy nhất của các nguyên tắc của giao thức.

必须按照以下严格顺序执行校验:

1. 解析并校验 JSON-RPC 信封及元数据字段的类型;
2. 比对 `MCP-Protocol-Version`Với`params._meta.io.modelcontextprotocol/protocolVersion`-
3. 比对 `Mcp-Method`Với`method`-
4. Khi phương pháp này có tên đường cụ thể, so với `Mcp-Name`与请求体中的对应字段;
5. Sau khi được xác định hoàn toàn, hãy xác định lại liệu phiên bản hợp đồng và tập hợp năng lực có được hỗ trợ hay không.

Cái thứ tự trước này sẽ được đánh dấu là không phù hợp sai lầm `-32020`与协议版本不支持错误 `-32022`清晰区分开来来──它 cũng có thể ngăn chặn và phê duyệt các công cụ an ninh trong tiêu đề, trong khi các trang nguồn thực sự thực hiện các cuộc tấn công lừa đảo trong các công cụ độc hại trong yêu cầu──

HTTP 字段名不区分大小写, nhưng 字段值严格区分大小写.`Mcp-Name`, phải xác định trước`=?base64?{Base64EncodedValue}?=`UTF-8 哨兵编码,再与请求体比对──未完成哨兵、无效 Base64、非法 UTF-8 或未编码的不安全字符,一律以`-32020`拒绝. 无码的原始首尾空白即便是与请求体字符完全相同的也属于非法, vì quy tắc truyền tải bắt buộc yêu cầu loại này được lấy giá trị trong truyền tải trước phải được thông qua code sĩ quan.

Trung gian đại lý có thể trực tiếp từ chối HTTP  báo cáo thay đổi trước khi yêu cầu đến đến máy chủ dịch vụ MCP, do đó, báo cáo của nó có thể không chứa lỗi HTTP hoàn toàn của JSON-RPC.

## 未知字段不等于未知结果

实现向后兼容 cần phải tuân theo hai nguyên tắc khác nhau:

### 附加未知字段

Kết quả đối tượng ( kết quả đối tượng)`_meta`Trong bảng điều tra có thể bất cứ lúc nào thêm các đoạn mới. Các máy kiểm tra phải tùy thuộc vào vị trí trách nhiệm của mình, chọn không bị xâm nhập giữ hoặc an toàn bỏ qua các đoạn phụ, trừ khi các đoạn này trực tiếp vi phạm thỏa thuận giữ các từ khóa. Trong mã thí dụ, các bộ kiểm tra sẽ giữ lại câu trả lời ban đầu hoàn chỉnh trong chứng chỉ, và chấp nhận được chấp nhận tương tự bên cạnh kết quả đã biết.`futureHint`                                                                                                                                                                                                                                                              

Nếu bạn là một đại lý minh bạch, giữ các đoạn không biết thường là xa hơn là mù quét nó để an toàn hơn; nếu bạn là khách hàng ứng dụng cuối, bỏ qua nó là hợp pháp. Nhưng dù sao, các bộ thử nghiệm khác biệt đều nên xác định rõ ràng tiết lộ rằng SDK có bỏ rơi các đoạn không trong khi phản trình tự, đảm bảo hành vi này là một quyết định kỹ thuật suy nghĩ, chứ không phải là bỏ qua không ngờ.

### Không biết`resultType`

`resultType`thuộc vào các phân biệt đối xử trong vòng đời của các nhà phân biệt đối xử.`complete`Với`input_required` Hiệp định mở rộng chỉ có thể được đưa ra sau khi có sự thành công trong việc tuyên bố trước và đàm phán về khả năng đối phó, và chỉ có thể cho phép giới thiệu các giá trị mới.`task`(■)

Đối với các kết quả của một tuyên bố không biết hoặc không tuyên bố, không thể tự tạo ra một đề xuất sẽ được thực hiện.`complete`Vì khách hàng không thể hiểu được chính xác tình trạng chu kỳ sống của mình mà họ bỏ rơi.

Trong một bài báo phản ứng ban đầu, hoàn toàn có thể chứa các đoạn mở rộng không rõ về pháp luật cùng với các loại kết quả không rõ về bất hợp pháp gây tử vong.

判別器只是校验的第一门, sau đó cũng phải được kiểm tra theo phương pháp cụ thể của nó.`tools/list`Kết quả hoàn chỉnh phải bao gồm`tools`Số组, và mô tả của nó có tên không trống duy nhất, mô tả rõ ràng và các điểm gốc của đối tượng.`inputSchema`-`task`Kết quả chỉ có khả năng thực hiện nhiệm vụ hợp pháp`tools/call`中有效,且强制要求包含 `taskId`、 đã biết trạng thái 、 tạo và cập nhật thời gian 、`ttlMs`Và các cuộc hỏi pháp lý;`completion/complete`Kết quả hoàn chỉnh phải chứa không quá 100 chữ cái`completion`Các đối tượng, cũng như số lượng không âm tính có thể chọn`total`Và giá trị có thể chọn`hasMore`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`resultType`Không thể miễn phí cho các loại nhựa còn lại.

## Số lượng không thay đổi của thông báo

JSON-RPC Thông báo 消息没有 `id`❖ tiếp nhận**绝不能**向外发送 bất kỳ thành công hoặc lỗi JSON-RPC 响应报文.

Đối với việc nhận được thông báo thành công trên HTTP, test kit dự kiến các dịch vụ sẽ quay lại HTTP với một request body không có`202 Accepted` MCP`2026-07-28`规范并未在 Streamable HTTP 上定义核心的客户端到服务端通知――本课例只使用一个带有命名空间的课程扩展通知,专门用于验证传输层序列化器是否满足绝不回复任何JSON-RPC 报文的不变量――请勿误认为它是新的核心协议方法――

测试时必须覆盖最外层的序列化器,而不能仅仅测试处理函数本身──因为 rất có thể xử lý函数内部回归.`None`Nhưng các phần trung gian bên ngoài tự động đóng gói thành bao gồm`{result: null}`Các JSON thành công đáp ứng. phải trực tiếp nắm bắt và kiểm tra cuối cùng dòng chảy ra khỏi biên giới mạng.

## 引入 SDK 差异对比(SDK Differential)

Các SDK thường chuyển đổi gói đối tượng đường dây tầng dưới thành loại dữ liệu dễ dàng được tích hợp trong ngôn ngữ cao cấp. Điều này nâng cao trải nghiệm phát triển, nhưng cũng dẫn đến các đối tượng sau khi quy định không thể trả lại những gì thực sự được gửi trên đường dây mạng.

Đối với mỗi trường hợp thử nghiệm cao风险, phải cùng lúc nắm bắt bốn tầng quan điểm:

1. SDK 解码前的原始 HTTP 状态码、响应标标标与响应体;
2. Các đối tượng hoặc trường hợp bất thường có giá trị trả lại được xuất phát sau khi chuyển đổi quy định SDK;
3. 针对当前选定版本纪元的预期语义映射投影;
4. Được SDK 提升、无中生有合成、强行剥离或改的字段清单──

Example Code cho phép SDK  chỉ剥离已知的线路协议记账字段(如 `resultType``_meta``ttlMs`和 `cacheScope`), đồng thời đối với gánh nặng kinh doanh của tầng trệt.`futureHint`,测试套件会将其作为差异告警明确上报.

Đừng đơn giản giả định rằng mọi sự khác biệt đều là lỗi của SDK. Mục tiêu cốt lõi là để biến đổi ẩn như vậy trở nên hoàn toàn rõ ràng.

Trước khi phát hành, mỗi SDK bạn duy trì và các phiên bản mục tiêu đều cần phải chạy thử nghiệm khác biệt. Nếu hai SDK khác nhau đối với các hồ sơ tương tác hoàn toàn giống nhau tạo ra các sản phẩm quy định khác nhau, chiến lược phát hành phải xác định rõ ràng hành vi nào là quy định hợp pháp, không thể xảy ra sau và hiếm.

##  nắm bắt chứng cứ cấp đại diện

Trong môi trường sản xuất, hầu hết các mCP bị hỏng đều xảy ra trên các biên giới mạng của quá trình hoặc thông qua đại lý.

| 视角 | 最小必要凭据 |
|---|---|
| 入口（Ingress） | 客户端原始请求头、JSON-RPC 请求体、Content-Type、已认证路由、接收时间戳 |
| 源站（Origin） | 代理转发出的标头与请求体哈希、源站 HTTP 状态、源站响应头与响应体 |
| 出口（Egress） | 客户端最终可见的 HTTP 状态、响应头、最终响应体、发送时间戳 |

Mô hình mã đặc biệt nhắm vào hai loại hành vi thay đổi đại lý phổ biến nhất đã xây dựng khả năng kiểm tra:

- 源站原本规范返回的 HTTP 400 hoặc 404 JSON-RPC 协议错误, được trung gian đại lý đơn giản và thô lỗ chuyển thành HTTP 500 phổ biến;
- Cuối cùng gửi đến khách hàng xuất khẩu JSON-RPC yêu cầu trả lại nội dung của các nguồn và nhà máy có sự thay đổi về chất lượng.

根据实际部署架构,还可扩充针对内容类型,`Accept`、 truyền tải được nén 、 đối với một yêu cầu SSE、 thẻ lưu trữ và các tuyên bố trên phân tán các liên kết theo dõi theo dõi trên các đoạn văn dưới đây.

## 证据离开内存前 tiến hành khử

脱敏 thuộc vào các bước cốt lõi trong cấu trúc của hệ thống vận hành phù hợp, chứ không phải là việc sửa chữa sau.

Example code trong executing matching trước sẽ chia tên thống nhất chuyển thành viết nhỏ并除 tất cả các liên kết符, sau đó chuyển về loại bỏ như `Authorization``Cookie``Set-Cookie``X-Api-Key``accessToken``clientSecret``registrationAccessToken``token``password``secret`Và `api_key`Các quy định so với các logic và các danh sách đen phải thống nhất, ngăn chặn các kiểu đặt tên khác nhau như:`query`Như vậy có vẻ như không có hại tên khóa, cũng có thể chứa dữ liệu bảo mật cá nhân hoặc quy định giám sát.

计算哈希时基于已过敏证据捆绑包进行计算. 始发未过敏的抓包数据只有在特定事故调查中,被获批人员在生命周期极短的限制系统中临时调阅. 证据摘要能够确实证明由任何经过过敏证据支本次发布裁决,同时绝不会泄露被删除的敏感明文.

## Việc kiểm tra sức khỏe và quay lại vào và phát hành

协议层一致合规 là điều kiện cần thiết để phát hành, nhưng không hoàn toàn đầy đủ. Một phiên bản ứng cử viên hoàn toàn phù hợp với quy định của thỏa thuận, vẫn có thể xảy ra trên mạng quá thời gian, rò rỉ bộ nhớ hoặc áp lực phụ thuộc vào.

Trong việc chính thức để đi lưu lượng, phải xác định rõ ràng các cửa sổ quan sát sức khỏe:

- Tối thiểu dung lượng mẫu yêu cầu;
- Maximum permis error rate giá trị;
- 延迟分位数 ((P95/P99) 上限;
- 资源和度与算力限制;
- 持续观测的时间跨度;
- Tương đối với chỉ số cơ sở đường thẳng

Tương tự, giấy phép quay lại cũng phải được sẵn sàng trước khi:

- 精确的前序版本标识;
- PreviousPrevious nhập học chứng chỉ
- Đối với các bộ phận SHA-256 và mô tả dấu ấn cố định;
- 当前最新的注册表 官方状态;
- Báo cáo đánh giá kiểm tra sức khỏe mới nhất;
- 经过过练习的路由恢复标准作业程序;
- By可信发布控制器身份针对上述全量字段签署的认证凭证(Attestation) 👇

强制要求该回滚目标在候选版本批准之前就必须处于健康且已验证状态,而不是等候选版本在线爆后才临时忙脚乱地寻找出路――一个没有可靠的后退之路的成功线,在工程上是不合格的――

Nếu phiên bản ứng cử bị hỏng, và mục tiêu quay lại được xác định hiện tại còn thiếu sự hỗ trợ đầy đủ bằng chứng nhập cảnh, hệ thống nên quyết định chọn dừng lại thường xuyên (Hold), không thể dựa vào cảm giác quay lại để trông giống như phiên bản bình thường để gặp vận hành.

绝不要将就绪检查降级为非空字符串判断,`healthy: "yes"`Có thể là một số mã thông báo được sử dụng để xác định các loại mã thông báo và các mã thông báo được sử dụng để xác định các loại mã thông báo và các mã thông báo.

发布门禁还会坚决拒绝空白的互动记录,SDK 差异凭证或代理层证据. Mỗi nguồn chứng cứ đều phải cung cấp một chỉ dẫn tóm tắt hiệu quả.

## 手写实现

运行 dựa trên các tiêu chuẩn thực hiện một sự thống nhất

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
```

Ứng dụng trình bày sẽ chạy trong suốt 15 bộ ghi chép giao tiếp vàng và tiêu cực (bao gồm các ví dụ tự động bổ sung các quy định và biến đổi) ✓ Bước từ sự khác biệt giữa dữ liệu nguyên thủy và hình ảnh SDK ✓ kiểm tra một ✓ thay đổi mã nguồn ✓ đánh giá chỉ số cửa sổ sức khỏe✓ kiểm tra chữ ký số của giấy chứng nhận quay lại, và cuối cùng chọn mục tiêu quay lại an toàn✓

预期输出结构:

```json
{
  "transcriptsPassed": 15,
  "transcriptsTotal": 15,
  "sdkDroppedFields": ["futureHint"],
  "proxyIssues": [
    "proxy collapsed a protocol error into HTTP 500",
    "proxy changed the origin JSON-RPC body"
  ],
  "releaseAction": "rollback",
  "evidenceDigest": "..."
}
```

建议按以下顺序阅读 `code/main.py`                                                                                                                                                                                                                                                              

1. `validate_request()`: Cần thực hiện các quy tắc phù hợp với tiêu đề của yêu cầu của phiên bản cụ thể;
2. `validate_result()`:精确分旧版缺失判别器、现代合法取值、扩展类型及未知类型;
3. `select_era()`: thực hiện các chiến lược quay trở lại theo quy định nghiêm ngặt và bị ràng buộc;
4. `run_transcript()`: đánh giá hồ sơ vàng và từ chối tiêu cực;
5. `compare_sdk_view()`: tiết lộ các pha khác biệt trong quá trình quy định SDK;
6. `inspect_proxy()`: toàn cáp đối với các điểm nhập khẩu, đầu tư và xuất khẩu;
7. `redact()`: hoàn toàn loại bỏ các bí mật nhạy cảm rõ ràng trước khi tạo ra bản tóm tắt bằng chứng;
8. `rollback_evidence_ready()`: 校验回滚指纹的精确字段与可信发布签名;
9. `ReleaseGate.evaluate()`: sự hợp nhất tập hợp, SDK, đại diện, sức khỏe và quay trở lại, tất cả các bằng chứng không trống được đưa ra quyết định cuối cùng.

## 运行与使用

Trong phần mềm phát triển giao dịch bốn điểm quan trọng để vận hành dòng chảy thử nghiệm phù hợp:

1. Mỗi lần mã hóa thay đổi, thông qua quá trình trong test adapter nhanh chóng vận hành;
2. Ứng dụng trên các tầng truyền tải vật lý thực tế đối với các sản phẩm khách hàng và dịch vụ được xây dựng;
3. Trong môi trường dự kiến xuất bản, thông qua thực tế triển khai của phản đối đại lý hoặc mạng lưới vận hành;
4. Trong thời gian phát hành, kết hợp thực tế thời gian chỉ số sức khỏe với vòng quay bằng chứng động hành.

Trong tất cả các cấp độ kiểm tra, giữ toàn bộ quy trình phù hợp.`negative-header-body-mismatch`Trong các bài kiểm tra đơn vị, kết thúc kết thúc, đại diện và báo cáo, các bài kiểm tra phải nghiêm ngặt đại diện cho cùng một không thay đổi. Mặc dù các giới hạn khác nhau sẽ dẫn đến sự thay đổi của bản tóm tắt bằng chứng, nhưng các tiêu chuẩn không thay đổi của tầng dưới nhất sẽ không di chuyển.

Để kiểm tra  thiết bị  quy trình  vào kiểm soát phiên bản                                                                                                                                                                                                                                                      

## 交互式实验

### 实验 A:验证版本纪元边界

 vào `code`目录并启动 Python:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/code
python3 -q
```

运行如下代码:

```python
from main import *
validate_result({"tools": []}, "legacy")
validate_result({"tools": []}, "modern")
```

旧版纪元会将其正确推断为`complete`, và thời đại kỷ nguyên sẽ trực tiếp bị ném ra`ProtocolViolation`异常──接下来测试回退逻辑:

```python
select_era({"kind": "timeout"}, "fallback")
select_era(
    {"kind": "timeout"},
    "fallback",
    legacy_allowed=True,
    legacy_evidence={"kind": "initialize_success", "protocolVersion": LEGACY_VERSION},
)
select_era({"kind": "jsonrpc_error", "code": -32021}, "fallback")
```

Lần đầu tiên siêu thời gian thất bại trong an ninh, vì sự im lặng đối với kết thúc không bao giờ là bằng chứng hợp pháp của hiệp định phiên bản cũ. Lần thứ hai, việc thực hiện thành công đã được chọn phiên bản cũ, bởi vì cấu hình đã mở ra rõ ràng quyền hạn và quan sát được bằng chứng cầm tay phiên bản cũ hợp pháp.

### 实验 B: phụ gia phụ gia đối với máy đánh giá

```python
validate_result({"resultType": "complete", "tools": [], "futureHint": True}, "modern")
validate_result({"resultType": "future_mode", "tools": []}, "modern")
```

Kết quả hoàn toàn được giữ lại.`futureHint`扩展字段;第二条结果则被坚决拦截, vì sự phân định chu kỳ đời của nó hoàn toàn không được biết.

### 实验 C:检查 SDK 转换

```python
compare_sdk_view(
    {"resultType": "complete", "tools": [], "futureHint": {"mode": "new"}},
    {"tools": []},
)
```

结合你的组件定位评估: Có phải hệ thống hiện tại cho phép bỏ rơi `futureHint`, hay phải buộc phải truyền tải ra ngoài? Để đưa quyết định dự án này rõ ràng vào quy tắc phát hành của đội, sự khác biệt không thể nghe được bị xóa đi lặng lẽ.

### 实验 D:修复代理层问题

调整 trình diễn trong giao tiếp báo cáo, để các giao thông xuất khẩu có thể trung thành thông qua các nhà máy truyền nguồn trạng thái và yêu cầu.`python3 main.py` Trình báo đại diện sẽ bị xóa, nhưng vì SDK vẫn đã bỏ rơi các đoạn, việc bỏ đi vẫn bị chặn lại.`futureHint`Ứng dụng này được thực hiện bởi các nhà nghiên cứu.`promote`(放行) 💚

## 动手实践

为测试工具链扩充针对请求级 SSE流的交互测试用例──

需求规范:

- Khám phá HTTP 响应状态码,Content-Type,序列 SSE 事件以及连接终止信号;
-  chứng minh rằng mỗi sự kiện JSON-RPC phát ra thông qua SSE đều có kết quả hoặc sai tin phù hợp với phiên bản của nó;
- 编写 trường hợp thử nghiệm tiêu cực: mô phỏng một đại lý trung gian trong toàn bộ缓冲 tất cả các sự kiện và sau đó một lần chuyển phát hành vi phạm quy định;
- 编写 tiêu cực thử nghiệm sử dụng: bắt một số SSE 事件中的 JSON-RPC id với yêu cầu đầu tiên phát hành id không phù hợp của lỗi;
- Trong việc sẽ kéo dài các sự kiện để chứng minh trước khi thực hiện toàn bộ số lượng của sự nhạy cảm;
- Để đưa các sự kiện vào cửa sổ quan sát đánh giá sức khỏe;
- 确保当事件流发生异常时,发布门禁仅选择证据完备的合法回滚目标──

验收标准: cùng một ví dụ sử dụng có thể trực tiếp chạy và xuyên qua vận hành đại lý, và báo cáo đánh giá được tạo ra có thể xác định chính xác vị trí nào là những bước nhảy trên giới hạn mạng gây ra các hành vi khác nhau.

## 交付产物

本课程交付 `outputs/skill-mcp-conformance-release-gate.md` Sử dụng nó để chuyển đổi bất kỳ phiên bản của bất kỳ thiết bị dịch vụ, khách hàng, cổng kết nối hoặc SDK thành bản phù hợp với quy định của bản kết luận và quyết định phát hành.

## 验证标准

运行演示程序与全套确定性测试套件:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试应严格证明:

- Tất cả 15 tập hợp vàng và tài liệu tiêu cực được chứa đều đạt được kết quả xác định dự kiến;
- 现代请求强制要求使用带精确命名空间的元数据键;
- HTTP 标题名称比对不区分大小写,且编码后的 `Mcp-Name`值被无损精准回原;
- 标头与请求体不一致时准确返回现代错码 `-32020`-
- 响应版本、ID 一致性、结果与错误的互斥性、错误对象结构以及HTTP 映射均通过严格校验;
- 强制执行 đối với `tools/list`、Thực hành 扩展及补充全程专属载荷规范;
- Chỉ cần xuất hiện thôi.`HeaderMismatch`, cần thực tế bắt được HTTP 400 với JSON-RPC `-32020`响应;
- Không được mã hóa`Mcp-Name`首尾空白被拒绝,而使用哨兵编码的空白字符能精准往返原;
- 缺失 `resultType`Chỉ được coi là hợp pháp trong phiên bản cũ được xác định rõ ràng;
- Các loại kết quả của chu kỳ sống không được biết được sẽ được từ chối;
-  Phụ thể kết quả mở rộng phải được phép chỉ với điều kiện trước tiên thông báo về khả năng đối phó;
-  nhận được các lỗi của các giao thức hiện đại đã được nhận ra không hề xúc tác đến việc giảm cấp về các giao thức phiên bản cũ;
- Thông báo 绝对不产生任何形式的 JSON-RPC 响应;
- 清晰辨识 SDK đối với giao dịch ghi sổ tay các đoạn bình thường và các đoạn không ngờ mất của các đoạn kinh doanh;
- 精准检出代理层对错误码的吞没改,且在小驼峰和带连符等多种风格变体下均可归归于脱敏证据;
- 晋级放行必须同时 có hồ sơ giao tiếp không trống, SDK khác biệt, kiểm toán đại diện và chứng chỉ vận hành trong khu vực sức khỏe;
- Dù là đi hay quay lại, đều có yêu cầu bắt buộc phải có một chứng nhận ký kết, dấu vân tay cố định, đang hoạt động và chỉ mục tiêu quay lại khỏe mạnh.

## 生产环境故障模式

| 故障现象 | 浅层粗糙测试的假象报告 | 测试工具链必须证明的实质 |
|---|---|---|
| SDK 擅自补全了缺失的判别器 | “tools/list 运行通过” | 原始线路上缺失现代 `resultType`，属于非法响应 |
| 收到 `-32021` 后客户端自行降级 | “旧版重试成功” | 收到已识别的现代错误绝不允许降级回退 |
| 未知结果类型被当成 complete | “响应成功解析” | 未经能力通告的生命周期判别器必须被坚决拒绝 |
| 代理批准了 A 工具而源站执行了 B 工具 | “请求成功抵达服务端” | 确保每一跳的 `Mcp-Name` 均与请求体中的路由名称严格一致 |
| 测试在读取服务端响应前自行报错终止 | “标头不匹配测试通过” | 必须真实捕获并验证 HTTP 400 及 JSON-RPC `-32020` 响应体 |
| 代理将源站 400 转换为通用的 500 | “上游服务端报错” | 源站与出口两端的 HTTP 状态及错误体必须原样保留 |
| Notification 中间件强行输出 `{result: null}` | “处理函数正常返回了 None” | 最终网络出口的请求体必须为空，且不存在任何 JSON-RPC 报文 |
| SDK 擅自剥离了前向附加字段 | “强类型对象转换一致” | 原始视图与规范化视图清晰指出具体哪一个字段被丢弃 |
| 事故排查工件泄露了 Bearer Token | “已成功上传调试数据包” | 在计算哈希、写入日志或上传网络之前已彻底完成脱敏 |
| 命名风格变体绕过了脱敏拦截 | “黑名单中已包含 api_key” | 小驼峰、中划线等所有变体在脱敏前均统一规范化为规范形式 |
| 金丝雀发布在毫无流量时显示指标全绿 | “零错误率” | 强制校验最小请求样本容量门槛 |
| 故障回滚切到了一个未经测试的未知构建 | “已恢复先前部署” | 回滚目标、准入摘要、固定指纹、状态与健康凭据必须全部完备 |

## 运维守则

Để kiểm tra từng chữ cái thực sự bạn phát hành, kiểm tra từng chữ cái thực sự được chuyển phát từ các trung gian đại lý, kiểm tra các ngữ nghĩa cụ thể của mỗi SDK đối với bên ngoài, cũng như chứng cứ chẩn đoán mà đội vận tải phải dựa vào trong tình trạng áp lực cao khẩn cấp.

## 延伸阅读

- [MCP 2026-07-28 基础协议规范](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP 版本协商机制规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Streamable HTTP 规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [官方 MCP 一致性测试工程仓库](https://github.com/modelcontextprotocol/conformance)
