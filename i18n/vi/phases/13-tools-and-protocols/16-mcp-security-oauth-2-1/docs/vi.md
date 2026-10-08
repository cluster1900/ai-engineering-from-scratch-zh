# MCP 鉴权与授权:CIMD、Emitter 绑定、PKCE 与权限提升(Step-Up)

> 远程MCP 请求是无状态的,但其授权绝非匿名――必须将每证书与其创建者发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 15 (security)
**Time:** ~90 minutes

## Học mục tiêu

- 通过受保护资源元数据(Protected-Resource Metadata)发现授权服务器(Authorization Server)。
- 优先 sử dụng ID khách hàng 元数据文档(CIMD), thay vì đã bị loại bỏ
- Trong không thể tránh DCR 兼容路径时, chính xác tuyên bố `application_type`
- 校验授权响应中的 `iss`参数,并根据签发者物理隔离凭证──
- 熟练运用 PKCE、资源指示符 (Ressource Indicators) 、受众验证 (受众验证) ]]]]
- Trong khuôn khổ phiên họp không phụ thuộc vào thỏa thuận, gửi theo quy định của 2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

## 问题

远程MCP server可能会读取私有记录、向外部系统写入数据,或触发代价昂贵的运算──身份认证(Authentication) chỉ说明 là ai đã trình bày bằng chứng──而授权(Authorization) cũng phải trả lời các câu hỏi sau:

- Là máy chủ được ủy quyền nào đã phát hành chứng chỉ này?
- Các mã thông báo này được phát hành đặc biệt cho MCP nào?
- Là khách hàng nào và URI định hướng nào đã hoàn thành quá trình ủy quyền này?
- 资源所有者 (用户) đã xác nhận những hoạt động nào?
- Liệu yêu cầu chính xác này vẫn phù hợp với phạm vi phê duyệt của thời điểm đó?

2026-07-28  phiên bản                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `application_type`,校验RFC 9207 签发人响应,并严禁跨签发人复用凭证──

Những quy tắc an ninh này được hỗ trợ bởi các hiệp định cốt lõi không có trạng thái.`Mcp-Session-Id`

## 概念

### 明确三大核心角色

- **MCP Client（客户端）：**代表资源所有者发起请求──
- **MCP Resource Server（资源服务器）：**验证 Access Token 并提供 MCP 端点服务──
- **Authorization Server（授权服务器）：**认证资源所有者、收集用户同意并发发代币──

资源服务器 và ủy quyền dịch vụ có thể được vận hành bởi cùng một nhóm, nhưng phải giữ được các chức năng nhận dạng và xác nhận của cả hai hoàn toàn độc lập.

### 授权应用于 HTTP 传输层

MCP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

Đối với truyền tải HTTP được phát trực tuyến từ xa, phải được thực hiện trong mỗi yêu cầu.`Authorization`头部中携带 Bearer Token。**绝不能**Đặt token  đặt URL  truy vấn trong parameter.

### Từ nguồn dữ liệu được bảo vệ bắt đầu

资源服务器 chịu trách nhiệm phát hành dữ liệu phù hợp với quy định RFC 9728:

```json
{
  "resource": "https://notes.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["notes:delete", "notes:read", "notes:write"]
}
```

客户端 xuất phát từ MCP 资源 URL, lấy tài liệu dữ liệu này, chọn trong đó tuyên bố của máy chủ ủy quyền, sau đó lấy lại OAuth hoặc OpenID Connect của máy chủ ủy quyền này 元数据──

Trong xây dựng URL nổi tiếng của RFC 9728, phải giữ nguyên nguồn gốc.`https://notes.example.com/mcp`,本课使用的标准路径为`https://notes.example.com/.well-known/oauth-protected-resource/mcp` Nếu bị bỏ rơi `/mcp`后, có thể sẽ nhầm chọn vào dữ liệu của các tài nguyên được bảo vệ khác dưới tên miền này.

Đừng dựa trên tên chủ nhân bằng không đoán được ủy quyền dịch vụ. cũng đừng dễ dàng tin vào sai lầm phản ứng của người phát hành thông tin trong cơ thể. khách hàng nên duy trì một chiến lược cấp phép của người phát hành tự nguyện tin tưởng.

### 验证授权服务器元数据

授权服务器元数据应暴露各端点及支持的安全控制特性:

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "code_challenge_methods_supported": ["S256"],
  "authorization_response_iss_parameter_supported": true,
  "client_id_metadata_document_supported": true
}
```

强制要求 PKCE 采用 S256 算法──完整记录签发者(issuer)字符串──这个精确的字符串将成为客户端后续注册信息与代币存储的核心索引键(Key)──

###  tuân thủ quy tắc đăng ký ưu tiên

Nếu có mối quan hệ dự định rõ ràng giữa khách hàng và người phát hành đã chọn, sử dụng trực tiếp chứng chỉ khách hàng đã đăng ký trước. Nếu không, khi tuyên bố của máy chủ ủy quyền được hỗ trợ, ID khách hàng đầu tiên được chọn sẽ được sử dụng như một chương trình trả về sau hợp nhất; nếu cả hai không được sử dụng, hãy nhắc người dùng nhập vào chứng chỉ khách hàng.

### 优先采用客户端 ID 元数据文档(CIMD)

客户端 ID 元数据文档(CIMD) cung cấp cho máy chủ ủy quyền một URL HTTPS, URL này là mã thông báo duy nhất của khách hàng(`client_id`), đồng thời cũng là địa chỉ thu thập dữ liệu của các tài liệu:

```json
{
  "client_id": "https://client.example.com/oauth/metadata.json",
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

授权服务器获取并校验该文档。`client_id`必须是包含路径的HTTPS URL,且文件内部声明的值必须与该URL完全一致.`client_id``client_name`Với`redirect_uris`△本例中包含的`application_type`Mặc dù không phải là yêu cầu bắt buộc của CIMD, nhưng nó xuất hiện trong các đường DCR như là một đoạn mã buộc.

必须将拉取该文档的操作视为防范 SSRF(服务端请求伪造) 的高敏操作:解析并验证目标 IP,拒绝环回地址、私有网络、链路本地地址及受限网段,防范重定向与 DNS 重新绑定(DNS重绑定),限制重定向次数、响应大小与超时时间,强制要求`application/json`,并严格按照有效的HTTP 缓存控制头进行缓存.`client_name`等展示字段,一律视为不可信文本──

CIMD đã loại bỏ các bước khó khăn trong việc phát hành các thẻ mới khi kết nối đầu tiên, nhưng không loại bỏ yêu cầu chuyển hướng URI 校验、 issuer trust strategy hoặc user authorization consent.

### DCR chỉ là một đường dẫn tương thích

动态客户端注册 (DCR) vẫn có thể sử dụng các máy chủ ủy quyền cũ hơn, nhưng đối với việc thực hiện MCP mới đã được chính thức từ bỏ.

Trong khi sử dụng DCR, phải tuyên bố`application_type`- Có thể là:

```json
{
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

- 桌面端、移动端、命令行工具及采用回环地址的客户端使用 `native`
- 远程托管的 Web 浏览器应用使用 `web`,并配置远程 HTTPS 重定向地址──

Nếu bạn bỏ qua đoạn này, OpenID Connect đăng ký thực hiện có thể sẽ được nhìn nhận như là`web`, dẫn đến sự thất bại trực tiếp của vòng quay pháp lý.

Để đặt mã DCR vào một quyết định giảm rõ ràng sau đó, đừng ngừng quay lại DCR khi chứng minh CIMD thất bại không mong đợi, điều này có thể biến thất bại kiểm tra an ninh thành việc áp dụng các tuyến đường đăng ký kém phòng thủ hơn.

### Đăng ký và cấp phép

Các chứng chỉ đăng ký được gửi bởi người gửi phải được lưu trữ dưới tên chính xác của người gửi:

```text
issuer_credentials[issuer] = pre_registered_or_dcr_client
tokens[(issuer, resource)] = access_token
```

Nếu được tìm thấy các nguồn tài nguyên được bảo vệ`https://auth-one.example` biến thành `https://auth-two.example`, phải đánh giá lại chuỗi tín dụng;. Không thể thuộc về bí mật khách hàng của người phát hành thứ nhất  ID khách hàng DCR  đăng ký mã thông báo truy cập  mã thông báo làm mới hoặc mã thông báo truy cập  gửi cho người phát hành thứ hai  Đăng ký trước hoặc DCR  khách hàng phải sử dụng chứng chỉ được phát hành đặc biệt cho người phát hành mới 

CIMD  Client ID có sự khác biệt: Vì nó là một URL HTTPS tự quản lý, chứ không phải bằng chứng nội bộ được gửi bởi máy chủ ủy quyền, do đó, cùng một URL CIMD có khả năng di chuyển  Người phát hành mới có thể trực tiếp thu hút và xác minh tài liệu, mà không cần phải đi DCR tái đăng ký.

### 带 PKCE 的授权码模式

交互式授权流程 bao gồm các bước sau:

1. 生成高 的随机数 `code_verifier`
2. Sử dụng SHA-256 派生出 `code_challenge`(S256 方式)
3. 发送授权请求,携带精确的 `client_id``redirect_uri``scope``code_challenge`Và `resource`
4.  nhận quyền đáp ứng, đó là trả lời chứa quyền`code`, và hỗ trợ khi mang theo `iss`
5. Trong bất kỳ đoạn nào trong sử dụng `iss`Liệu người phát hành có hoàn toàn phù hợp với bản ghi trước đó không?
6. Sử dụng `code_verifier`、 hoàn toàn giống nhau định hướng URI 及 giống nhau `resource`换代币.
7. sẽ nhận được token được lưu trữ trong`(issuer, resource)`复合键下――

Từ RFC 8707 `resource`Các tham số cũng xuất hiện trong yêu cầu quyền và token yêu cầu, nó xác định xác định quyền lực của máy chủ MCP URI.

### 严格校验 `iss`参数

RFC 9207 có thể ngăn chặn sự nhầm lẫn giữa các phản ứng từ một nhà phát hành và các phản ứng từ một nhà phát hành khác.

Khi phản ứng xuất hiện`iss`Trong các trường hợp, việc so sánh nó với nhà phát hành của hồ sơ  phải được thực hiện, cấm viết lớn gấp 末尾斜增删除, di chuyển cổng mặc định hoặc quy định mã hóa URL 百分号.

Nếu được cấp phép dịch vụ bao gồm`iss`, thường sẽ được tuyên bố trong dữ liệu đô la`authorization_response_iss_parameter_supported: true`现代客户端 ngay cả trong trường hợp không thấy tuyên bố này, một khi phản ứng trong chứa `iss`, cũng sẽ thực hiện nghiêm ngặt các bài kiểm tra này.

### Trong MCP Server 端校验受众(Đính giả)

资源服务器 chỉ chấp nhận các token đặc biệt phát hành:

```text
token.issuer == configured_authorization_server
token.audience == canonical_mcp_resource
```

Bất kỳ mã thông báo nào không hiệu quả, quá hạn, hoặc không phù hợp với người phát hành sẽ nhận được mã thông báo HTTP 401 Không được phép.

### 仅申请当前最小所需范围

遵循最小权限原则, chỉ áp dụng phạm vi cần thiết cho hoạt động hiện tại. Nếu tiếp theo một công cụ 需要更高权限,服务器会返回 HTTP 403以及权限的范围质询:

```text
WWW-Authenticate: Bearer error="insufficient_scope",
  scope="notes:delete",
  resource_metadata="https://notes.example.com/.well-known/oauth-protected-resource/mcp"
```

客户端 giải thích cho người dùng nhu cầu về quyền hạn mới, nhận sự đồng ý của người dùng, phát triển quy trình ủy quyền mới để bao gồm các tập hợp phạm vi cũ mới, và sử dụng ID JSON-RPC mới 重试刚才的 MCP 请求──

Đừng giả định phạm vi yêu cầu của các yêu cầu phải bao gồm trong ban đầu.`scopes_supported`Trong khi đó, chất lượng chỉ là yêu cầu quyền hạn có thẩm quyền nhất hiện tại.

### 授权与无状态 MCP 底层报文

经过授权的工具 调用仍携带完整的现代请求信封:

```text
POST /mcp
Authorization: Bearer <access-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.delete
```

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "tools/call",
  "params": {
    "name": "notes.delete",
    "arguments": {"id": "note-7"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "oauth-lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Các mã thông báo được sử dụng để cấp quyền cho chủ thể; yêu cầu dữ liệu được sử dụng để đàm phán các hành vi thỏa thuận.

底层报文校验遵循固定的时间序:JSON-RPC 及元数据类型有效性、头条与体 一致性,然后是协议版本支持校验──路由或版本头条 不匹配返回 HTTP 400 与错码`-32020` Nếu tiêu đề và cơ thể  nhưng phiên bản không được hỗ trợ, quay lại HTTP 400 với error code `-32022`, và`data`精确为 `{"supported":["2026-07-28"],"requested":"<actual>"}` yêu cầu không biết cách trả về HTTP 404 với mã lỗi `-32601`

所有请求级错误(包括 401 Token 无效和 403 Scope 不足) đều sử dụng với yêu cầu ban đầu `id`Đối phó JSON-RPC 错误信封包装―― cấu trúc phục hồi thông tin nằm trong một lỗi có thể chọn`data`字段中;`WWW-Authenticate`则作为标准 HTTP 响应头返回──通知因为没有 `id`, Vì vậy không trả lại JSON-RPC 响应体── được chấp nhận HTTP 通知 trả lại HTTP 202 且响应体为空──

Server đã được thực hiện`server/discover`Và tuyên bố hỗ trợ các công cụ, do đó cũng phải thực hiện bắt buộc.`tools/list`方法──其工具描述器 具有稳定的名称、描述以及以对象为根节点的 `inputSchema`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                                                                                              `resultType`、 máy chủ danh tính dữ liệu 、 giới hạn `ttlMs`Với`cacheScope` dịch vụ phát hiện và người dùng không liên quan Công cụ chung danh sách có thể truy cập trước khi cấp phép; Nếu nội dung danh sách khác với danh tính chủ sở hữu, thì phải áp dụng chiến lược cấp phép bình thường và sử dụng lưu trữ tư nhân (private caching)

### 禁止 Token 直通转发(Không có Token Pass thông qua)

MCP server 绝不能将客户端发发来的 MCP Access Token 直接传递给下游 API。 phải đơn giản đơn giản nộp đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn đơn

### Refresh Token 处理

Refresh Token là có thể chọn. Một khi ra mắt, phải được lưu trữ kín đáo, và theo người phát hành và nguồn lực phải được dẫn hai lần. Đừng giả định rằng nó chắc chắn tồn tại. Nếu được ủy quyền dịch vụ hỗ trợ chuyển đổi, nên thực hiện chuyển đổi trong thời gian mới, và có thể kiểm tra việc sao chép trái phép của các token đã bị phá hủy.

```figure
t3-scope-stepup
```

## 动手构建

`code/main.py`là một giao thức trong quá trình với phép mô phỏng. Nó hoàn toàn thực hiện được được bảo vệ tài nguyên phát hiện, quyền phục vụ dữ liệu của máy chủ, CIMD đăng ký, mang lại kiểm soát phiên bản DCR quay lại, ứng dụng kiểu kiểm tra, PKCE, người phát hành xác nhận, tài nguyên gắn mã token, phạm vi, quyền nâng cao,`server/discover``tools/list`Và công cụ không trạng thái Xin vui lòng.

Mô hình nhận được các yêu cầu đã được phân tích và các tiêu đề đường. Nó không phải là một ứng dụng HTTP hoàn chỉnh, không chịu trách nhiệm phân tích.`Content-Type`Hoặc`Accept` Bạn có thể kết nối với Ứng dụng HTTP 适配器, sau đó yêu cầu nghiêm ngặt `Content-Type: application/json`且 `Accept`需同时支持 `application/json`和 `text/event-stream`

运行 nó:

```bash
cd phases/13-tools-and-protocols/16-mcp-security-oauth-2-1
python3 code/main.py
python3 -m unittest discover code/tests -v
```

控制台输出按顺序展示服务发现,CIMD注册,常规读取,两次独立 Scope 权限提升流程,以及根据发放者隔离的证据存储机制――

## Sử dụng nó

将模拟器中的类映射到生产组件中:

- `ResourceServer.protected_resource_metadata`映射为 RFC 9728 元数据端点──
- `AuthorizationServer.metadata`映射为 RFC 8414 或 OpenID Connect 发现端点──
- `Client.enroll`映射为 CIMD 解析及显式的 DCR 兼容回退分支──
- 签发者派发的客户端凭证及 `tokens_by_issuer_resource`映射为加密存储记录──CIMD URL 保持可移植,而授权产品则始终绑定到特定发发件者──
- `ResourceServer.handle`映射为校验现代 MCP tiêu đề、代码和工具范围的网关中间件, và分发前将所有请求错误封装进匹配的 JSON-RPC 信封中──

## 交付 nó

本课交付 `outputs/skill-oauth-scope-planner.md`Nó thiết kế một bộ đầy đủ bao gồm các ưu tiên đăng ký, cấp phép phân lập lưu trữ giấy phép, loại ứng dụng, PKCE, chỉ dẫn nguồn lực, phạm vi truy vấn và kỹ năng lập kế hoạch thực tế về biên giới yêu cầu hiện tại không trạng thái.

## 课后深练习

1. Để làm như vậy, bạn có thể sử dụng một số mã thông báo mới.
2. 增加签发者白名单机制──当检测到签发者变更时, chỉ sử dụng CIMD URL có thể di chuyển, quyết tâm từ chối tất cả các chứng chỉ và token của các nhà phát hành cũ này──
3. Để tăng cơ chế quá hạn, và xác nhận quá thời gian yêu cầu thay đổi mã quyền chắc chắn thất bại.
4. Xây dựng một biến thể khách hàng Web có địa chỉ HTTPS định hướng từ xa, so với sự khác biệt trên dữ liệu gốc của khách hàng bản địa trên DCR.
5. Trong cùng một người phát hành đăng ký tài nguyên thứ hai, xác nhận Địa chỉ truy cập của người nộp đơn tài nguyên mới không thể được quyền sử dụng ở đầu tài nguyên thứ nhất.

## 关键术语

| 术语 | 含义 |
|------|------|
| 受保护资源元数据 | RFC 9728 文档，用于声明资源地址、授权服务器列表及支持的 scopes |
| CIMD | 客户端 ID 元数据文档（Client ID Metadata Document），其 HTTPS URL 即为 OAuth client_id |
| DCR | 动态客户端注册（Dynamic Client Registration），已废弃并仅作为向后兼容路径保留 |
| `application_type` | `native` 或 `web`，用于校验重定向 URI 的合法性规则 |
| PKCE | 包含 verifier 与 S256 challenge 的机制，用于防止授权码拦截攻击 |
| `iss` | RFC 9207 授权响应中的签发者标识符，用于防范 Mix-up 混淆攻击 |
| 资源指示符（Resource indicator） | RFC 8707 参数，用于将 Token 申请显式绑定到目标 MCP 资源 |
| 受众（Audience） | Token 允许被使用的合法资源范围 |
| 权限提升（Step-Up） | 针对当前操作需要的新 scope，发起用户再次同意并获取新 token 的机制 |
| 签发者绑定凭据 | 将客户端注册凭据与 Token 严格按授权服务器签发者物理隔离的存储机制 |

## 延伸阅读

- [MCP 2026-07-28 授权规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [RFC 9728: OAuth 2.0 受保护资源元数据（Protected Resource Metadata）](https://www.rfc-editor.org/rfc/rfc9728)
- [RFC 8707: OAuth 2.0 资源指示符（Resource Indicators）](https://www.rfc-editor.org/rfc/rfc8707)
- [RFC 9207: OAuth 2.0 授权服务器签发者识别（Issuer Identification）](https://www.rfc-editor.org/rfc/rfc9207)
- [OAuth 客户端 ID 元数据文档（CIMD）规范草案](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/)
