# MCP trong môi trường sinh sản 认证与识别权:绑定签发人注册与代币机制

> 第 16 课构建 OAuth 2.1 状态机. 本课针对 MCP 2026-07-28 规范加固其生产环境边界:首选客户端 ID 元数据文档(CIMD), chỉ将废弃的动态客户端注册作为兼容方案,严格考验授权响应中的发发放者,根据签发者物理隔离客户端凭证,实现 JWKS 定时轮询刷新,并精确每个无状态请求上受众绑定(听者-Pinned Tokens)
>
> **规范说明（2026-07-28）：**动态客户端注册(DCR) đã được chính thức bãi bỏ,首选客户端 ID 元数据文档(CIMD) ・DCR 仅作为后后兼容机制保留――当不得不使用 DCR 时,客户端必须声明正确的`application_type` Khách hàng phải kiểm chứng sự tồn tại của RFC 9207 `iss`参数值,绝不能跨不同授权服务器签发者复用凭证──

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 16 (OAuth 2.1 state machine), Phase 13 · 17 (gateways)
**Time:** ~90 minutes

## Học mục tiêu

- Thông qua RFC 8414 元数据发现授权服务器并严格核验技术契约──
- 通过客户端 ID 元数据文档(CIMD) hoàn thành đăng ký khách hàng,并将废弃的 DCR 隔离为回归方案──
- 校验 RFC 9207 `iss`,将客户端注册凭据按授权服务器签发者(发行人) phân lập chỉ số,并将资源绑定 Token 按签发者与资源双重索引存储──
- Theo định thời điều chỉnh lưu trữ và tẩy rửa JWKS 密钥集, đảm bảo ký kết được thực hiện trong quá trình chuyển đổi khóa (Key Rollover) trong suốt quá trình chuyển giao.
- Sử dụng RFC 8707 资源指示符将 Token 强绑定到单一 MCP 资源,坚决拒绝混代理 (Confused-Deputy) 与跨资源复用――
- 理性权衡 JWT 本地验证与Token Introspection,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效率,界定撤销时效率,界定撤销时效率,界定撤销时效率,界定撤销时效率,界定撤销时效率,界定撤销时效率,界定撤销时效率,以及行业效率降级等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等
- Giải quyết hoàn toàn trách nhiệm của các máy chủ ủy quyền, các máy chủ tài nguyên và các khách hàng, khiến mỗi bên chỉ chịu trách nhiệm kiểm tra an ninh trong biên giới của mình.
- Đối với kiểm soát sản xuất bộ phận phê duyệt thanh toán thanh toán ủy quyền dịch vụ, quyết tâm từ chối không an toàn của đăng ký mô hình hoặc token 跨域复用──

## 问题

Chương 16                                                                                                                                                                                                                                                               

Thứ nhất là**客户端注册与凭据隔离**◊ thực doanh nghiệp có thể hoạt động trên hàng trăm máy chủ MCP và hàng ngàn khách hàng MCP.**客户端 ID 元数据文档（CIMD）**: Khách hàng sử dụng HTTPS URL được kiểm soát bởi chính nó 带有路径 作为其客户端标识符,授权服务器在需要时主动拉取该元数据. RFC 7591 动态客户端注册 (DCR) chỉ được giữ lại như là một đường dẫn tương thích ngược đã bị bỏ hoang. Trong trường hợp không sử dụng DCR, yêu cầu phải tuyên bố rõ ràng đúng.`application_type` Khách hàng sẽ đăng ký bằng chứng theo cấp phép của máy chủ签发者分类存储,并将 Access Token theo `(issuer, resource)`Hai nhóm xây dựng chỉ số. Người phát hành biến đổi có nghĩa là phải đăng ký lại, và truy cập các nguồn khác nhau phải sử dụng Token độc lập của người tiếp nhận.

Thứ hai là:**密钥轮换（Key Rotation）** JWT kiểm tra ký hiệu địa phương phụ thuộc vào bộ khóa web JSON được phát hành bởi máy chủ ủy quyền (JWKS)  Các máy chủ ủy quyền sẽ thường xuyên thay đổi các khóa ký hiệu này (thường là mỗi giờ, trong sự kiện an ninh phản ứng thậm chí nhanh hơn)  Một máy chủ MCP của JWKS chỉ kéo một lần khi khởi động, trước khi thay đổi khóa lần đầu tiên hoạt động bình thường, sau đó tất cả các yêu cầu tiếp theo sẽ bị báo cáo lỗi và lỗi của thử nghiệm, cho đến khi dịch vụ khởi động lại.

Thứ ba là:**受众绑定（Audience Binding）** Chương 16 课 introduction RFC 8707 资源指示符. Trong môi trường sản xuất, chỉ dẫn này trở thành bất khả thi trên mỗi yêu cầu cứng 校验.`token.aud`Không phù hợp với URL của mình, không phù hợp thì ngay lập tức quay lại HTTP 401。 Đây là tuyến phòng thủ duy nhất của MCP server (hoặc có mã thông báo của một máy chủ đối với một máy chủ) trên cùng một mạng lưới nội bộ vào máy chủ khác.

Bài học này sẽ mô tả ba cổng này một một trong các cấu trúc kỹ thuật cụ thể: tài liệu dữ liệu元 đối phó với một HTTP 端点; JWKS 缓存刷新 đối phó với một nhiệm vụ cố định tăng giá trị缓存; JWT 验证 là một quy trình mà các máy chủ tài nguyên đang phân phối bất kỳ công cụ nào trước phải thực hiện.

## 适用范围:第 16 课后的生产落地强制规范

[第 16 课：基于 OAuth 2.1 的 MCP 安全](../../16-mcp-security-oauth-2-1/docs/en.md) bao gồm các mã quyền trạng thái máy tính, PKCE, được bảo vệ tài nguyên phát hiện, chỉ dẫn tài nguyên và phạm vi cơ chế quyết định.  Bài học này sẽ không xác định lại bộ OAuth 流程 thứ hai.

Biên giới sản xuất được tập trung nhiều hơn vào bảo đảm vận tải ở tầng dưới:

- JWT 路径 trên mỗi yêu cầu xác định các nhà phát hành, thuật toán, kiểm tra công钥, người nhận, thời gian tuyên bố và mục tiêu, đồng thời tự nhiên cập nhật JWKS.
- Không minh bạch Token 路径调用签发者经认证的内视点,校验回归的活跃状态,受众或资源,过期时间,主体以及 Scope──
- Chiến lược hủy bỏ xác định nghĩa chứng chỉ phải hoàn toàn không hiệu lực trong thời gian dài, cũng như những tầng dự trữ có thể bị trì hoãn hoặc không hiệu lực.
- Ý nghĩa của việc xác định hành vi của hệ thống trong việc phát hiện dịch vụ, JWKS, Nhìn sâu vào hoặc hủy bỏ cơ sở hạ tầng không thể sử dụng được.
- 审计证据记录驱动决策的发发言人元数据、公钥集或内视 响应、Token Claims、策略版本以及拒绝原因,且绝不保存Token 明文──

Sự phân chia trách nhiệm này giữ cho tính chất tốt của các mô-đun khóa học.

## 概念

### RFC 8414  OAuth 授权服务器元数据

位于 `/.well-known/oauth-authorization-server`Tài liệu mô tả tất cả thông tin khách hàng cần:

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "client_id_metadata_document_supported": true,
  "registration_endpoint": "https://auth.example.com/register",
  "authorization_response_iss_parameter_supported": true,
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "scopes_supported": ["mcp:tools.read", "mcp:tools.invoke"],
  "token_endpoint_auth_methods_supported": ["none", "private_key_jwt"]
}
```

客户端在获取MCP资源URL 后进行链式发现:先通过RFC 9728 的 `oauth-protected-resource`(资源服务器文档)获知所信任的发发发商, sau đó thông qua RFC 8414(本规范文档) lấy từng service endpoint của发发商.

Đối với các mã thông báo tài nguyên bao gồm đường, xin vui lòng nhập các đoạn văn nổi tiếng trong đường này. Ví dụ:`https://mcp.example.com/team/server`Đối với các nguồn tài nguyên được bảo vệ`https://mcp.example.com/.well-known/oauth-protected-resource/team/server`✿切勿将 ✿`/.well-known/...`错误地增加在资源路径后.

Trong tín nhiệm một nhà cung cấp tình trạng (IDP) được sử dụng cho các hợp đồng của MCP trước phải phê duyệt:

- `code_challenge_methods_supported`必须包含 `S256`(tương tự với yêu cầu PKCE của RFC 7636)**缺失**,则表示该授权服务器不支持 PKCE,客户端**必须**拒绝继续执行――
- `grant_types_supported`包含 `authorization_code`, quyết tâm từ chối`password`和 `implicit`
- Ít nhất hỗ trợ một mô hình đăng ký:`client_id_metadata_document_supported: true`(CIMD,首选) 、 Tài liệu khách hàng được định sẵn, hoặc `registration_endpoint`(RFC 7591 兼容模式 đã bị loại bỏ)
- Nếu`authorization_response_iss_parameter_supported`Vì vậy, khách hàng yêu cầu bắt buộc được cấp phép trả lời trong RFC 9207 `iss`,并 nghiêm ngặt đối với người xuất bản của các hồ sơ trước đó đối với.
- Trong OAuth 2.1 规范下,`response_types_supported`必须精确为 `["code"]`

若缺少`S256`支持,MCP server 坚决拒绝接入该 IdPPKCE 没有降级模式――若既未声明任何注册模式,又没有预配置的 `client_id`, cũng không thể hoàn thành kết nối; tại thời điểm này nên sửa bộ phận phân phối đơn vị, thay vì sửa đổi mã.

### RFC 9728 ((回顾)  受保护资源元数据

Chương 16  Bài học giới thiệu RFC 9728 ∙ trong môi trường sản xuất điểm quan trọng là:**当前**MCP server 所信任的授权服务器集合的唯一权威来源――单个MCP server可以同时信任多个IdP――如一个用于内部员工,另一个用于外部合作伙伴――RFC 9728 声明这个集合;RFC 8414 声明每个IdP的不同技术能力――

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com", "https://partners.example.com"],
  "scopes_supported": ["mcp:tools.invoke"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://notes.example.com/docs"
}
```

### 客户端 ID 元数据文档(推默认方案)

CIMD sẽ đăng ký khách hàng từ truyền thống 推(Push) 模式反转为拉(T kéo) 模式──客户端不再向授权服务器请求动态生成一个 `client_id`, thay vào đó trực tiếp sẽ tự kiểm soát một số URL HTTPS**作为**`client_id` URL này chỉ định một JSON 元数据文档; ủy quyền máy chủ trong quá trình OAuth 按需主动拉取该文档──信任关系根基于 DNS 体系:如果服务端运维人员信任`app.example.com`域名, thì nó là sự tin tưởng trong `https://app.example.com/client.json`Hệ thống này đã loại bỏ động đăng ký trở lại giao tiếp, tránh`client_id`命名空间耗尽风险, cũng省去了跨服务器同步状态的复杂性──

客户端所托管的元数据文档结构 như sau:

```json
{
  "client_id": "https://app.example.com/oauth/client.json",
  "client_name": "Example MCP Client",
  "client_uri": "https://app.example.com",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback", "http://localhost:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

文档内部的 `client_id`字段值**必须**Với quản lý URL của tài liệu này  hoàn toàn phù hợp                                                                                                                                                                                                                                                         `client_id_metadata_document_supported: true`声明 ủng hộ tính năng này.

Trong quy định của CIMD hiện tại,`client_id``client_name`Với không空`redirect_uris`Số组为必填项. Các mã thông báo khách hàng phải là một URL HTTPS tuyệt đối có đường dẫn.`application_type`Nhưng nó không phải là một phần bắt buộc của CIMD. Đừng dùng DCR trong các`application_type`                                                                                                                                                                                                                                                              

规范明确指出的两大核心安全事实:

- **防范 SSRF：**授权服务器拉取是攻击者提供的URL,必须严密防范服务端请求伪造(严禁访问内部私有网络及管理端点)
- **防范 localhost 冒充：**Chỉ dựa trên CIMD không thể ngăn chặn kẻ tấn công địa phương sử dụng URL dữ liệu của khách hàng hợp pháp và buộc bất cứ điều gì`localhost`重定向端口. Vì vậy, khi trình duyệt của máy chủ được hiển thị trên trang User Consent Authorization,**必须**清晰展示重定向 URI 的主机名,并**应当**Đối với sự thật`localhost`Đặt hướng phát hành cảnh báo an toàn.

Vì CIMD không cần được đăng ký lâu dài trên các thiết bị, do đó không còn cần thiết như DCR đó là bảo trì các trung tâm đăng ký phức tạp.

Nếu người quản lý máy chủ được ủy quyền đã phân bổ trước các thẻ nhận khách hàng, nên ưu tiên sử dụng chứng chỉ đăng ký trước đó dành cho người phát hành cụ thể, sau đó thử tự động đăng ký. Nếu không, CIMD là lựa chọn đầu tiên. Chỉ có người phát hành không hỗ trợ đăng ký trước hoặc hỗ trợ CIMD khi, mới trở lại với các chương trình DCR đã bị bỏ hoang.

### RFC 7591: đã bị bỏ hoang兼容注册路径

DCR trong 2026-07-28 规范修订中已正式废弃―― chỉ nhằm mục đích không thể sử dụng CIMD 且无法进行人工预注册的旧版授权服务器保留――兼容客户端发送如下注册请求:

```json
POST /register
Content-Type: application/json

{
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "scope": "mcp:tools.invoke",
  "client_name": "Cursor",
  "software_id": "com.cursor.cursor",
  "software_version": "0.42.0"
}
```

服务端响应 `client_id`Và để tiếp tục cập nhật cấu hình sử dụng `registration_access_token`- Có thể là:

```json
{
  "client_id": "c_3e7f1a",
  "client_id_issued_at": 1769472000,
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "registration_access_token": "regt_b2...",
  "registration_client_uri": "https://auth.example.com/register/c_3e7f1a"
}
```

`application_type`具有严格约束力: sử dụng địa chỉ vòng quay của khách hàng phải tuyên bố là `native`; dựa trên dịch vụ quản lý Web  ứng dụng khách hàng phải tuyên bố rằng `web`Không sử dụng HTTPS 重定向 URI── đối với công cộng Native 客户端,`token_endpoint_auth_method: none`Đó là định dạng chính xác, chỉ được phân phối cho khách hàng.`client_id`, chứng minh quyền sở hữu hoàn toàn phụ thuộc vào PKCE 保障。

3 bẫy phòng thủ lớn của sinh sản:

- Đăng ký điểm phải dựa trên IP nguồn để thực hiện một dòng hạn chế nghiêm ngặt. Nếu không, kẻ tấn công có thể viết kịch bản đăng ký hàng triệu khách hàng giả, tiêu hết.`client_id`命名空间── phải trong đăng ký xử lý doanh nghiệp trước khi thực hiện hạn chế流校验──
-  Một số doanh nghiệp cấp IDP 强制要求提供 `software_statement`(Điều kiện đã ký JWT của khách hàng)  Ví dụ: Bảng này sẽ được bỏ qua; nhưng trong sản xuất nên tăng logic học tập, từ chối đăng ký chưa ký ngoài định hướng quay lại địa phương 
- `registration_access_token`Trong lưu trữ, cần phải được mã hóa, không thể được bảo quản rõ ràng. Việc token bị rò rỉ có nghĩa là kẻ tấn công có thể chuyển hướng URI của khách hàng.

### RFC 8707 ((回顾) 资源指示符 ((Resource Indicators)

第 16 课 确立该报文结构――生产铁律为: Mỗi Token yêu cầu đều phải có`resource=<canonical-mcp-url>`, và máy chủ MCP phải được chứng minh trong mỗi lần được gọi`token.aud`Với nguồn tài nguyên của mình URL 精确匹配──规范化 URI là máy chủ 标识符:采用小写协议名和主机名,不带URL 片段(#fragment), thường không带末尾斜──根据规范,路径部分**不应**Được tự động tách ra, nó đã xác định được một máy chủ MCP độc lập.`https://mcp.example.com``https://mcp.example.com/mcp``https://mcp.example.com:8443`Và `https://mcp.example.com/server/mcp`Đó là quy định hợp pháp URI.`aud`Với nó hoàn toàn cố định.`https://notes.example.com`; trong các bộ phận sản xuất của nhiều máy chủ MCP được quản lý cùng tên miền, nên được phân loại theo đường bộ.

### RFC 7636 ((回顾)  PKCE

PKCE đã trở thành quy tắc bắt buộc trong OAuth 2.1 .`code_challenge`和 `code_verifier` dịch vụ端坚决拒绝任何不带验证器或验证器的哈希值与预存挑战 不符的代币请求。

### MCP 2026-07-28 授权 Tương tự 规范

Khi MCP  quy định được thiết lập OAuth 资源服务器安全边界, MCP 传输层 sẽ chuyển sang trạng thái toàn diện không có. Vì vậy, cấp phép phải kiểm tra độc lập cho mỗi yêu cầu:

- Thực hiện RFC 9728 được bảo vệ tài nguyên dữ liệu, truy cập của nó có thể thông qua 401                                                                    `WWW-Authenticate: Bearer resource_metadata="..."`头部提供,**或者**通过知名端点 `/.well-known/oauth-protected-resource`访问(SEP-985 sẽ được đặt để được chọn,并以知名端点作为底) ――元数据中的 `authorization_servers`字段**必须**列出 ít nhất một máy chủ ủy quyền được tin cậy.
- Trong**每一个**Ứng dụng chỉ được thông qua`Authorization: Bearer ...`接收 Token绝不能放在URL 查询参数中,也绝不能仅在会话建立时验证一次
- 逐请求校验 `aud``iss``exp`Và các mục tiêu cần thiết.**必须**验证 Token là đặc biệt cho chính mình issued của mình; thiếu hoặc không phù hợp `aud`必须直接拒绝,绝不能作为通配符放行.
- Trong hồi đáp 401/403, quay lại với `error=...``resource_metadata="<PRM-URL>"`(元数据文档的完整获取URL,*而非*裸资源地址) cũng như mang theo trong 403 权限不足时`scope="..."`của `WWW-Authenticate: Bearer`头──注意:该质问参数名为 `resource_metadata`, thuộc về chỉ số phát hiện,质询头中没有所谓的`resource`参数。
- 授权服务器服务发现同时兼容 RFC 8414 OAuth 元数据与 OpenID Connect Discovery 1.0; khách hàng nên thử sau đây theo ưu tiên
- 客户端(而非服务端) chịu trách nhiệm phòng thủ**混淆攻击（Mix-Up Attacks）**: trong重定向之前记录预期的 `issuer`, và sử dụng mã quyền thay đổi Token  trước, nghiêm ngặt kiểm tra quyền đáp ứng trong trả về của RFC 9207 `iss`Chỉ đơn giản dựa vào PKCE không thể phòng thủ Mix-Up  tấn công, vì khách hàng sẽ mù quáng `code_verifier`提交给被恶意引导的目标 标志端点──
- 客户端注册凭证 thuộc về một người phát hành dịch vụ có thẩm quyền duy nhất. Nếu dịch vụ phát hiện ra đã phân tích các người phát hành khác nhau, khách hàng phải đăng ký lại, không thể thể thể hiện được cũ.`client_id`、 đăng ký token hoặc access token
- CIMD là cơ chế đăng ký khách hàng đầu tiên.`application_type`

OAuth 2.1 草案 là tầng đáy;RFC 8414/7591/8707/9728/9207 + RFC 7636 + CIMD 构构成交互表面;MCP 规范则则是集大成的 Profile──

### Khả năng phân phối sản xuất

Các thông tin được đăng tải bởi các nhà sản xuất sẽ được đăng tải ngay lập tức.

| 核对项目 | 强制要求 |
|---|---|
| 发现的 Issuer | 必须与策略预期的 HTTPS Issuer 字符串精确匹配 |
| PKCE 支持 | 明确声明支持 `S256`；否则坚决终止接入 |
| 注册机制 | 首选 CIMD，接受预注册，仅将 DCR 作为废弃兼容路径 |
| 授权响应 | 出现或声明支持时，必须校验 RFC 9207 `iss` 参数 |
| 资源绑定 | Token 请求携带 `resource`；资源服务器强制校验匹配的 `aud` |
| 凭据存储 | 客户端 ID 与注册凭据以 Issuer 为键；Access Token 以 Issuer + Resource 双重索引 |
| DCR 兼容规范 | 必须声明 `native` 或 `web`；坚决拒绝不符合声明类型的重定向 URI |

Đừng suy đoán về khả năng hỗ trợ kỹ thuật của sản phẩm từ tên hoặc mức giá.

### JWKS 刷新模式(AS 负责 Rotate,资源服务器负责 Refresh)

必须严格区分两个动词, trong sản xuất混它们是极易发生的真实 Bug:

- **轮换（Rotate）：**- Có.**授权服务器（AS）**Hành vi: tạo mã thông minh mới, công bố mã thông minh trong JWKS, và sau đó sẽ hủy bỏ mã thông minh cũ.
- **刷新（Refresh）：**- Có.**资源服务器**Hành vi: Thông qua HTTP GET 重新拉取公开发布的 JWKS 并更新其本地缓存── đây là các hoạt động của JWKS duy nhất cần thực hiện của các dịch vụ tài nguyên.

Mô hình cố tình điển hình nhất trong môi trường sản xuất là**缓存过期失效** Giải pháp là áp dụng**定时刷新任务 + 键值缓存** Resource server run a调度任务 (Cron、定时器或运行时调度机制), theo khoảng thời gian cố định.`<issuer>/.well-known/jwks.json`并覆盖写入 `cache[issuer] = {keys, fetched_at}`❖ kiểm tra máy trực tiếp读取该内存缓存──若某 Token 的 ❖`kid`Trong hiện tại lưu trữ trong chưa định,触发**单次**Đồng thời giải quyết hai trường hợp lớn: thời gian cố định chu kỳ mới, và trước khi chu kỳ tiếp theo mới, sử dụng toàn bộ khóa mới phát hành token 提前抵达的密钥重叠窗口期.

Việc quay lại hoạt động**必须是重新拉取（Re-fetch），绝对不能是轮换（Rotate）**Nếu sẽ có một đường không định sẵn để kết nối sai lầm, sẽ gây ra hai sự thiếu hụt lớn:`kid`* vẫn* không thể phù hợp được Token phát hành,验签仍然失败;`kid`Đơn vị này sẽ buộc hệ thống vô hạn tạo ra các khóa mới gây ra thảm họa tự từ chối dịch vụ.`kid`Cuối cùng chỉ có thể mang lại một lần vô hại vô hiệu lực để mở bán.

缓存结构:

```json
{
  "https://auth.example.com": {
    "keys": [
      {"kid": "k_2026_03", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"},
      {"kid": "k_2026_04", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"}
    ],
    "fetched_at": 1772668800
  }
}
```

Trong trạng thái hoạt động ổn định thường có hai chìa khóa cùng lúc.`k_2026_03`(Bài viết: "Bài viết:`k_2026_04`), để đảm bảo số lượng lưu trữ được phát hành dưới khóa cũ Token trong quá trình quá hạn tự nhiên của nó vẫn còn hiệu quả.`kid` tiến hành xác định đường.

### 统一的 Địa chỉ 验证例程

MCP server trong phân phát thực hiện bất kỳ công cụ nào  trước khi phải thống nhất thực hiện chứng nhận.`code/main.py`Trung bình chuẩn调用范式 như sau:

```python
result = server.validate(bearer_token, required_scope="mcp:tools.invoke")
if not result["valid"]:
    return {"status": result["status"], "WWW-Authenticate": result["www_authenticate"]}
```

`validate`函数负责解码 JWT, từ JWKS 缓存中解析签名公钥(未命中时触发单次回退刷新),校验数字签名,然后依次检查 `iss`Có phải nằm trong danh sách trắng,`aud`Có phải phù hợp với quy định của máy chủ này`exp`Có quá hạn, cũng như có đủ phạm vi cần thiết  Một khi bất kỳ kiểm tra nào thất bại, ngay lập tức quay lại mang theo thông báo sai lầm cụ thể `WWW-Authenticate`质询头―― sẽ tất cả các kiểm tra bao bì trên các dịch vụ tài nguyên, có thể đảm bảo mỗi dòng chảy nhập vào bất kể loại công cụ 调用、 loại tầng truyền nào) đều qua một lệnh cấm an toàn hoàn toàn phù hợp, loại bỏ bất kỳ lỗ hổng nào không qua kiểm tra mà có thể được vượt qua trong logic kinh doanh trực tiếp――

### Không minh bạch Token  sử dụng Nhìn vào, chứ không phải đoán mù

Không phải tất cả các mã thông tin truy cập đều là JWT. Nếu tài liệu của người phát hành cho thấy việc phát hành dưới đây là mã thông tin không minh bạch (Opaque Token), tài nguyên máy chủ sẽ không thể giải mã được các tuyên bố đáng tin cậy.`active: true`、 phù hợp với các nhà phát hành dự kiến trên các văn bản dưới đây、 xác định các MCP phù hợp với người nhận hoặc nguồn lực、 yêu cầu hiệu quả thời gian chưa hết hạn và các công cụ cụ thể hiện tại Các mục tiêu cần thiết。

Đối với kết quả của bản thấu hiểu, thực hiện bộ lưu trữ địa phương, để người phát hành, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin, mã thông tin.**绝不能**Đặt Token gốc 明文 như thẻ日志 hoặc khóa缓存. TTL sẽ có hiệu lực trong mục đích缓存. TTL sẽ có hạn chế hạn chế trong thời gian đến hạn của Token. Ứng dụng缓存 chỉ dẫn của người phát hành và thời gian sớm nhất được xác định trong số các mục tiêu tiêu tiêu tiêu hiệu quả của hệ thống.

Đừng để kẻ tấn công thông qua giả mạo mã thông báo để lôi kéo dịch vụ chuyển đổi phương thức xác nhận.`jwks_uri`;绝不盲目顺从 Token 头部中声明的密钥URL或加密算法──

### 撤销 là một hợp đồng thời hiệu lực

RFC 7009 cho phép các yêu cầu của khách hàng cho phép máy chủ hủy bỏ một Token. Nhưng yêu cầu hủy bỏ này sẽ không tự động xóa bỏ các bản sao đã tồn tại trên các máy chủ tài nguyên phân tán.

Ứng dụng cấu trúc của Token không minh bạch có thể thông qua việc sử dụng rất cao để phát hành từng lần Introspection hoặc配置极短的有效缓存 để đạt được thực tế nghiêm ngặt. Ứng dụng của JWT tự chứa thường được sử dụng như sau: rút ngắn chu kỳ sống hiệu quả của Access Token Ứng dụng bên IdP để thực hiện Refresh Token Ứng dụng Ứng dụng thay đổi khóa công ký khi xảy ra sự cố tình an ninh toàn cầu, và hỗ trợ cho cơ chế mã hóa địa phương của Token ID để đối phó với sự chặn khẩn cấp. Ứng dụng JWT đã ký kết sẽ luôn hiệu quả trong lĩnh vực mật mã, trừ khi các dịch vụ tài nguyên đã có được chứng nhận loại bỏ bên ngoài.

Người dùng đăng ký, tài khoản tắt, hủy bỏ quyền và phản ứng khẩn cấp Mặc dù thuộc về các nguồn khởi động khác nhau, nhưng cuối cùng tất cả phải nhận được một chỉ số cứng có thể định lượng: sau khi hết thời gian cửa sổ hủy bỏ của tuyên bố, tất cả các ví dụ sao trong tập hợp phải quyết tâm từ chối chứng chỉ này.

### Bộ phụ thuộc vào các vấn đề cần phải tuyên bố rõ ràng về chiến lược quyết định

绝不要在异常捕获 (试捕) 代码块中临场发挥制定可用性策略──

| 故障场景 | 生产环境安全应对策略 |
|---|---|
| 定时 JWKS 刷新失败，已知 `kid` 仍在尚未过期的受限缓存中 | 仅在声明的故障容忍窗口内允许降级继续运行，并向外暴露系统健康度降级告警证据 |
| Token 携带未知 `kid` 且仅有的一次重试刷新拉取失败 | 坚决拒绝；绝不接受无法完成密码学验签的 Token |
| Introspection 内部端点不可用 | 针对受保护调用严格执行故障闭合（Fail-closed）；绝不把网络超时转化为 `active: true` |
| 受保护资源或签发者元数据发生非预期突变 | 立即停止接受新注册与新 Token 申请；在受限应急策略下仅维系明确锁定的有效配置 |
| 撤销端点不可用 | 将登出或撤销标记为“未完成”，尽可能在本地将该凭据置为不可用，绝不对外谎称全局撤销成功 |
| 系统时钟源异常或 Claim 时间格式无效 | 坚决拒绝；严禁通过扩大时钟容忍偏差（Clock Skew）来强行放行 Token |

 phải phân biệt rõ ràng bất hợp pháp giữa hệ thống bị hỏng dựa trên cơ sở hạ tầng và chứng chỉ bản thân  phải dựa vào các hệ thống hỏng không thể sử dụng thuộc cấp độ vận hành, cần kết hợp kiểm tra sức khỏe và cơ chế thử nghiệm lại; và quyền xác định không phù hợp với ký kết không hiệu quả  người phát hành không phù hợp  người tiếp nhận không phù hợp  quá hạn hoặc hạn chế không đủ thuộc về xác định  cả hai đều không được chạm vào công cụ kinh doanh cụ thể  logic, và cả hai đều không được phép tiết lộ toàn bộ Token 明文 trong nhật ký kiểm toán.

### 受众重放攻击全流程演练(Access-Token Privilege Restriction)

假设 Server A`notes.example.com`) với Server B`tasks.example.com`(của người dùng) đã bị tấn công, và cố gắng để đặt nó lại cho Server B để sử dụng giao diện nhiệm vụ.

Các quy trình thực hiện của Server B như sau:

1. 解码 JWT, theo `kid`检索 JWKS,验证数字签名──(通过)
2. 核对 `iss`Có phải nằm trong tuyên bố dữ liệu của tài nguyên được bảo vệ của mình `authorization_servers`列表中──(通过 thuộc cùng một IDP)
3. 校验 `aud == "https://tasks.example.com"`❖**失败**Token 中真实的 `aud`Vì vậy`https://notes.example.com`(văn)
4.  quay lại HTTP 401 响应,并携带 `WWW-Authenticate: Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="https://tasks.example.com/.well-known/oauth-protected-resource"`

Ở cấp độ thỏa thuận, tuyên bố của khán giả là rào cản duy nhất để phòng thủ các cuộc tấn công đối với quyền lực Việt Nam.**每一个独立请求**上坚决执行,绝不能仅在会话刚建立时验证一次. Trong các thuật ngữ quy định, cơ chế này được gọi là**访问令牌特权限制（Access-Token Privilege Restriction）**: MCP server **必须**Đương quyết từ chối bất kỳ biểu tượng nào không rõ ràng trong số người xem.

> **命名辨析：**规范将**混淆代理（Confused Deputy）** Khusus để chỉ ra một loại khác liên quan nhưng khác nhau lỗ hổng trường hợp: tức một máy chủ MCP 充当调用第三方 API **代理（Proxy）**, sử dụng ID khách hàng toàn diện tĩnh, chuyển giao mã thông số một cách mù quáng khi không có sự đồng ý của người dùng cấp phép cho một kết thúc cụ thể.**并且**严禁将进入站收到的原始代币 直接透传给上游 API(MCP server **必须**独立申请专门发往上游 API 的全新独立代币)

### Dòng thủ không thể trả tiền)

客户端 trong vòng đời của nó thường cần phải giao dịch với nhiều máy chủ ủy quyền khác nhau. 恶意 AS có thể khiến khách hàng sẽ thực sự hợp pháp AS 发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发

1. 客户端 đang khởi động định hướng lại trước khi được cấp phép, dựa trên chứng minh AS 元数据记录预期`issuer`标识符.
2.  Sau khi nhận được câu trả lời ủy quyền, khách hàng sẽ gửi mã ủy quyền đến bất kỳ điểm kết nối mạng nào trước khi, trước tiên trong số đó `iss`参数与此前记录的发发发人进行纯字符精确比对(禁止大小写折叠或URL规范化) ⋅
3. Một khi không phù hợp hoặc trong AS  tuyên bố hỗ trợ `authorization_response_iss_parameter_supported`Trong trường hợp phản ứng trong thiếu hụt`iss`)→ 立即拒绝, và绝不显示响应中由攻击者构建的 `error`报错信息――

Chỉ đơn thuần dựa vào PKCE không thể phòng thủ được.`code_verifier` tay gửi đến mục tiêu của người bị ám ảnh bởi ý xấu. Đây là quy tắc bắt buộc yêu cầu trong trạng thái yêu cầu sẽ được dự kiến của nhà phát hành và PKCE xác minh 及`state`Một lý do trong lịch sử.

### 常见故障模式(Phương thức thất bại)

- **陈旧过期的 JWKS：**Trong khi thay đổi khóa AS, kiểm tra ký giả sẽ hợp pháp Địa chỉ chặn. Giải pháp là các nhiệm vụ 定时刷新任务 + 未命中回退拉取 模式.
- **回退机制误搞成密钥轮换：**Để cài đặt bộ nhớ không định hướng trở lại sai lầm để tạo ra khóa mới thay vì kéo lại ra ngoài, đó là một lỗi logic rất nghiêm trọng: nó không chỉ không thể được phát ra trong yêu cầu.`kid`, cũng sẽ cho kẻ tấn công sử dụng giả mạo .`kid`实施密钥爆炸式 DoS 攻击──回退操作必须是等的重新拉取──
- **缺失 `aud` Claim：**某些旧版 IdP 默认会省略 `aud`, trừ khi khách hàng trong token yêu cầu hiển nhiên cung cấp `resource` Các nhà kiểm tra phải quyết tâm từ chối sự thiếu hụt`aud`Đồ tín hiệu, tuyệt đối không thể đưa ra như một cách không thể.
- **遗漏 `iss` 校验导致的 Mix-Up 攻击：**客户端若未校验 RFC 9207 授权响应中的 `iss`参数, có thể bị lừa sẽ thực sự AS mã quyền gửi cho người dùng kiểm soát Token 端点. Đây là một lỗi khách hàng điển hình, tài nguyên máy chủ không thể thay thế để khắc phục.
- **Scope 提升并发竞争：**Cùng với một người dùng hai lần phát hành quyền nâng cấp (Step-Up) quy trình có thể trước sau thành công, tạo ra hai Access Token với Scope khác nhau.
- **注册 Token 泄露：**mộn `registration_access_token`Để cho kẻ tấn công có thể thay đổi định hướng URI của khách hàng. Phải được thêm mật mã trong kho lưu trữ; buộc khách hàng phải hiển thị thông tin rõ ràng trong mỗi bản cập nhật; một khi nghi ngờ bị rò rỉ ngay lập tức thay đổi.
- **未固定 `iss` 白名单：**验签器若盲目 chấp nhận bất cứ điều gì `iss`, kẻ tấn công tự xây dựng máy chủ quyền độc hại, nhắm vào mục tiêu đối tượng gửi token độc hại.`authorization_servers`列表就是白名单, phải quyết tâm thực hiện các bài kiểm tra phù hợp.
- **凭据或 Token 缓存键混淆：**客户端 nếu chỉ dựa trên tài nguyên để tạo chỉ số cho chứng chỉ đăng ký, có thể sẽ chỉ ra chứng chỉ được một máy chủ ủy quyền gửi cho một máy chủ khác. 客户端 nếu chỉ dựa trên người phát hành để tạo chỉ số truy cập, thì có thể đặt chỉ số sai lầm vào tài nguyên người xem sai lầm.`(issuer, resource)`复合索引 Access Token, và một khi签发者变更 phải đăng ký lại.

```figure
t3-jwks-rotate
```

## Sử dụng nó

`code/main.py`Sử dụng Python 标准库 đã thực hiện một sản xuất chứng nhận hoàn chỉnh, bao gồm ba vai trò chính:`AuthorizationServer``ResourceServer`Với`Client`❖ Thực hiện các bước như sau:

Trong代码仓库根目录下运行:

```bash
cd phases/13-tools-and-protocols/18-mcp-auth-production
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

lệnh thứ hai sẽ chạy thông qua tất cả 18 đơn vị thử nghiệm. hai lệnh đều sẽ không mở ra ngoài mạng lưới giám sát, cũng không sẽ được ghi vào đĩa ghi nhận lâu dài.

1. 授权服务器在 `/.well-known/oauth-authorization-server`发布 RFC 8414 元数据──
2. MCP 客户端调用该端点,审查其注册模式(`client_id_metadata_document_supported`Đối với CIMD,`registration_endpoint`đối với DCR) và đối với`S256`Tình hình hỗ trợ của PKCE:
3. 客户端优先审核预配置注册,否则使用其托管在HTTPS上客户端ID 元数据文档完成注册──废弃的DCR保留为独立兼容性测试分支──
4. 客户端记录经验的签发者, tạo S256 Challenge, nhận mã quyền đơn lẻ và `iss`,核对返回的发发发人,并携带原始验证器与RFC 8707 `resource`指示符向端点换 标志──
5. MCP 客户端携带 `Authorization: Bearer ...`调用 MCP server 上的工具──
6. MCP server 触发 `validate`Ví dụ, từ JWKS 缓存解析出对应的公钥完成验签.
7. IdP 模拟轮换公钥;定时刷新任务自动拉取最新JWKS 并更新缓存──
8. Lần sau khi调用 trong trường hợp không cần thiết khởi động lại dịch vụ tự động hoàn thành việc kiểm tra ký hiệu của khóa công cộng mới, và lưu trữ token cũ vẫn còn hiệu quả trong thời gian cửa sổ chồng lên.
9. 模拟向另一台MCP 资源发起受众重放攻击,精准触发 HTTP 401 报错,返回 `audience mismatch`Và hướng dẫn tái phát hiện`resource_metadata`Chỉ thị

Trong ví dụ, JWT để có thể hoạt động trong bộ thư viện tiêu chuẩn Python không phụ thuộc vào bên thứ ba, đã sử dụng thuật toán HS256 có chia sẻ chia sẻ.`refresh_jwks`直接读取授权服务器内存密钥列表; trong môi trường trực tuyến nó là một phát `jwks_uri`Các tiêu chuẩn HTTP GET Ứng dụng:

## 交付 nó

本课交付 `outputs/skill-mcp-auth.md` Đưa ra một máy chủ MCP 配置 với IdP 能力清单, kỹ năng này có thể tự động chuyển toàn bộ bộ bộ phận bảo vệ chứng nhận sinh sản  bao gồm cả các tài nguyên được bảo vệ dữ liệu  chọn lựa đăng ký kết nối đường dẫn (CIMD 预注册 hoặc DCR 底)  JWKS 刷新调度策略、Scope 映射关系,以及在 IdP 无法完全满足 RFC Profile 时的防御性拒绝规则

## 课后深练习

1. 运行 `code/main.py`◊仔细追踪执行流――观察 IdP 在步骤 6 中轮换密钥,定时 `refresh_jwks`重新拉取已发布的公钥集合,验证旧代币(重叠窗口期内) với new签发的代币 如何均在未重启服务的情况下顺利验证签通过──
2. Trong tài nguyên được bảo vệ dữ liệu`authorization_servers`列表新增一个合法的IDP──签发一个由该新IDP签名的代币,验证验证签例例程顺利放行──随后签发一个由未列入白名单的外部IDP签名的代币,验证系统决断阻断并返回`WWW-Authenticate: Bearer error="invalid_token", error_description="iss not allowed"`
3. Vì vậy`register_client`增加速率限制检查,在注册器真正处理请求前执行拦截──在内存中使用按来源IP 为键字典实现一个轻量级的代币桶 限流器──
4. 研读 RFC 7591 规范, chỉ ra ví dụ代码中 `/register`处理器 chưa được校验的两个协议字段,并补全校验逻辑──(提示:`software_statement`Với`redirect_uris`协议检查) ⋅
5. 接入第二台授权服务器──验证客户端能够按发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发`client_id`复用到第二台服务器上──
6. 动手复现并修复潜在的DoS漏洞:向验签器发送一个包含随机伪造 `kid`Đồ ký, xác nhận `refresh_jwks`Tối đa chỉ kích hoạt một lần, và số lượng chìa khóa công cộng của máy chủ ủy quyền sẽ không tăng bất thường. Sau đó cố ý sẽ quay lại logic thay đổi thành thay đổi địa phương để tạo ra các khóa mới, xem mã hóa giả làm thế nào để số lượng khóa tăng lên.
7. Đánh thành mục tiêu`native`Với`web`两类客户端测试已废弃的 DCR 路径──验证带有 HTTP重定向 URI 的 Web 客户端,以及未使用精确回环重定向的 Native 客户端会被系统准确拦截拒绝──

## 关键术语

| 术语 | 通俗说法 | 精确工程含义 |
|------|---------|-------------|
| ASM | "OAuth 元数据文档" | RFC 8414 规范的 `/.well-known/oauth-authorization-server` JSON 文档 |
| CIMD | "客户端元数据 URL" | 客户端 ID 元数据文档（Client ID Metadata Document）：将 HTTPS URL 直接作为 `client_id`，由 AS 主动拉取 JSON。MCP 2026-07-28 首选注册方式 |
| DCR | "自助客户端动态注册" | RFC 7591 规定的 `POST /register`；在当前 MCP 规范中已废弃，仅作兼容兜底 |
| JWKS | "用于 JWT 验签的公钥集合" | JSON Web Key Set，从 `jwks_uri` 拉取，内部按 `kid` 进行哈希索引 |
| Rotate vs Refresh | "更新公钥" | **Rotate（轮换）** = 授权服务器签发/作废签名密钥；**Refresh（刷新）** = 资源服务器重新拉取发布的公钥。资源服务器仅能执行 Refresh |
| 资源指示符（Resource indicator） | "受众参数" | RFC 8707 规定的 `resource` 参数，用于将 Token 强绑定到特定 server |
| `aud` Claim | "受众标识" | JWT 中的 Claim 字段，验签器将其与自身的规范化资源 URL 进行严格字符串比对 |
| 受众重放（Audience replay） | "Token 重放攻击" | 将为 Server A 签发的 Token 拿到 Server B 去尝试调用；由受众校验防御（规范术语：访问令牌特权限制） |
| 混淆代理（Confused deputy） | "代理 Token 滥用" | 拥有静态客户端 ID 的 MCP 代理服务在未获取逐客户端同意授权的情况下盲目转发 Token；与受众重放本质不同 |
| Mix-up 混淆攻击 | "Token 端点走错门" | 客户端被恶意诱导将诚实 AS 派发的授权码拿到攻击者控制的端点去兑换；由客户端依照 RFC 9207 `iss` 校验进行防御 |
| `iss` 白名单 | "受信任的授权服务器集合" | 在受保护资源元数据的 `authorization_servers` 字段中显式声明的受信任列表 |
| `resource_metadata` | "去哪里查找 PRM 文档" | 401/403 质询头 `WWW-Authenticate` 中的标准参数，指向 RFC 9728 元数据文档的获取 URL |
| 公共客户端（Public client） | "Native 或浏览器端客户端" | 无法安全保管 `client_secret` 的客户端类型；依赖 PKCE 机制实现所有权证明 |
| `WWW-Authenticate` | "401/403 响应头" | 携带 `Bearer error=...` 等指令指导客户端如何进行凭据补全与错误恢复的标准 HTTP 响应头 |

## 延伸阅读

- [MCP 授权规范（2026-07-28 修订版）](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)- 当前权威的 MCP 授权 Profile
- [MCP 2026-07-28 更新日志](https://modelcontextprotocol.io/specification/2026-07-28/changelog)- bao gồm CIMD, xuất bản các bài kiểm tra, bỏ rơi và thay đổi quan trọng về cách ly bằng chứng
- [OAuth 客户端 ID 元数据文档规范草案（draft-ietf-oauth-client-id-metadata-document-00）](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00) CIMD 核心标准
- [RFC 8414 — OAuth 2.0 授权服务器元数据](https://datatracker.ietf.org/doc/html/rfc8414) 服务发现技术契约
- [RFC 7591 — OAuth 2.0 动态客户端注册协议](https://datatracker.ietf.org/doc/html/rfc7591) DCR 规范(向后兼容路径)
- [RFC 7636 — 代码兑换证明密钥（PKCE）](https://datatracker.ietf.org/doc/html/rfc7636)  chứng minh quyền sở hữu của khách hàng công cộng
- [RFC 8707 — OAuth 2.0 资源指示符](https://datatracker.ietf.org/doc/html/rfc8707) Cơ chế khóa trung tâm
- [RFC 9728 — OAuth 2.0 受保护资源元数据](https://datatracker.ietf.org/doc/html/rfc9728) 资源服务器服务发现
- [RFC 9207 — OAuth 2.0 授权服务器签发者识别](https://datatracker.ietf.org/doc/html/rfc9207) Để phòng thủ  Mix-Up  tấn công `iss`参数规范
- [RFC 7662: OAuth 2.0 Token 内省协议（Token Introspection）](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 7009: OAuth 2.0 Token 撤销协议（Token Revocation）](https://datatracker.ietf.org/doc/html/rfc7009)
