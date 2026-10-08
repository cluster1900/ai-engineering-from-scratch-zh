# MCP Công cụ Hợp đồng và nội dung

> Chỉ khi phát hiện √参数√ kết quả√分页以及传输元数据 đạt được hiệp ước, công cụ mới có thể thực hiện tự động hóa một cách an toàn.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 07, 09, and 10
**Time:** ~120 minutes

## Học mục tiêu

- Sử dụng JSON Schema 2020-12 定义工具的输入和输出──
- 校验结构化结果, không giả định nó phải là đối tượng JSON.
- Trong văn bản (text) 图像 (image) 音频 (audio) 资源链接 (resource) 链接 (link) 资源 (resource) 嵌入资源 (内嵌资源) 资源 (resurce) 之间做出合理选择)).
- Trước khi công cụ được phơi bày cho mô hình, từ chối không an toàn.`x-mcp-header`定义──
- Việc mã hóa chính xác giá trị tiêu chuẩn của các tham số, và xác minh sự phù hợp nghiêm ngặt giữa tiêu đề yêu cầu và vật yêu cầu.
- Trong không phân tích các biểu tượng số cụ thể,
- Đối với`completion/complete`补全建议进行范围界定与权限控制──

## 核心问题

调用普通的Python 函数 rất đơn giản. Nhưng thông qua AI host 调用远程能力,则是一个典型契约问题.

服务端发布描述符 (descriptor) ⋅客户端将该描述符转换为模型的上下文与用户界面──模型生成调用参数──网关可能根据镜像的 HTTP标题进行请求路由──服务端执行该工具──最后,客户端决定返回结果是否足够安全有效,以返回模型──

Nếu có một biên giới có lỗ hổng, nó sẽ phá hủy toàn bộ.

考虑以下五种常见故障:

- 描述符声明 trả về kết quả là một đối tượng, nhưng dịch vụ端 thực sự trả lại một mảng.
- 客户端在 `nextCursor`Vì vậy, chúng tôi đã có một số câu hỏi.
- Các biểu tượng nhạy cảm được chiếu vào tiêu đề HTTP, do đó được phơi bày cho tất cả các trung gian đại lý và hệ thống日志.
- 包含 Unicode's route value được chuyển như là tiêu đề gốc, dẫn đến sự không phù hợp của các mã hóa của các mã hóa.
- tự động bổ sung toàn kết điểm đến một người dùng không có quyền truy cập môi trường sản xuất đã đề xuất tên gọi môi trường sản xuất.

Những lỗi này không có một sự cố nào có thể được giải quyết nhanh hơn.

## 契约流水线

Chúng tôi sẽ từng công cụ được chia thành 5 cổng:

1. **发现（Discover）**:读取确定性、已分页的工具列表──
2. **准入（Admit）**:校验每个工具描述符并执行本地安全策略──
3. **调用（Invoke）**:校验调用参数并构建传输层元数据──
4. **执行（Execute）**:运行工具处理函数并对错误进行正确分类──
5. **消费（Consume）**: trước khi giao cho mô hình sử dụng, các khối nội dung của trường học và cấu trúc xuất.

```figure
mcp-contract-pipeline
```

Nhà cung cấp dịch vụ không thể ép buộc khách hàng mù quáng tin vào việc giải thích, lập trình hoặc kết quả.

## JSON Schema là运行时边界

Trong MCP `2026-07-28`规范中,`inputSchema`Với`outputSchema`均采用 JSON Schema──当省略 `$schema`声明时,默认方言为 2020-12。

输入 Schema 必须是一个 schema object. Ngay cả khi một công cụ không cần bất kỳ tham số nào, cũng nên chính xác tuyên bố định dạng chấp nhận của nó:

```json
{
  "type": "object",
  "additionalProperties": false
}
```

Đó là`{ "type": "object" }`严格多,后者允许传入任意多余属性──

输出 Schema là tùy chọn. Nhưng dịch vụ kết nối khi được phát hành.`outputSchema`, mỗi lần trả lại đầy đủ kết quả của việc hứa hẹn sẽ trả lại phù hợp với thỏa thuận này .`structuredContent`, ngay cả khi kết quả bao gồm`isError: true`Cũng vậy. Đánh dấu sai lầm chỉ là phân loại kết quả thực hiện, nó không thể miễn trừ các giao ước xuất phát đã được phát hành.

###  Structured content có thể là bất kỳ giá trị JSON

Đừng làm vậy`structuredContent`硬编码为字典 (dict/object) ⋅ nó có thể là:

- Một đối tượng;
- Một mảng;
- Một dây;
- Một số;
- Một boolean;
- `null`

Ví dụ dưới đây là công cụ của return array:

```json
{
  "name": "tag_catalog",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "array",
    "items": {"type": "string"}
  }
}
```

Kết quả của việc trả lại thành công là hoàn toàn hợp pháp:

```json
{
  "resultType": "complete",
  "content": [
    {
      "type": "text",
      "text": "[\"contracts\", \"mcp\", \"stateless\"]"
    }
  ],
  "structuredContent": ["contracts", "mcp", "stateless"],
  "isError": false
}
```

Để giữ khả năng tương thích, trả lại kết quả cấu trúc thường cũng nên được xếp hạng trong văn bản  chứa các khối nội dung  kèm theo JSON  văn bản.`structuredContent`才是.

### 简明校验器 vẫn có thể làm rõ bản chất biên giới

Chương trình này đặc biệt được thiết kế để thực hiện một tập hợp JSON Schema 校验子, để giữ hoàn toàn trong phạm vi Python 标准库.

- Các loại vật lý, tệp, chuỗi, số nguyên, số, khối và không;
- thuộc tính cần phải được hoàn thành;
- `additionalProperties: false`-
- các mục array;
- Enum 枚举值;
- 字符串最小长度 minLength。

Đây không phải là một sự hoàn thành hoàn chỉnh thay thế cho máy tính kiểm tra cấp sản xuất.**校验发生的时机与位置**: kiểm tra các mô tả sau khi phát hiện, kiểm tra các tham số điều chỉnh trước khi thực hiện, cũng như kiểm tra kết quả cấu trúc trước khi tiêu thụ.

## 内容块承载不同的成本

`content`数组 có thể tập hợp nhiều loại khối nội dung:

| 类型 | 适用场景 | 核心安全与控制边界 |
|------|------------|---------------|
| `text` | 人类与模型可读的摘要文本 | 将文本视为不可信输出 |
| `image` | 以 Base64 编码的视觉凭证 | 严格校验媒体类型（media type）与文件大小 |
| `audio` | 以 Base64 编码的语音或音频 | 严格校验媒体类型与时长上限 |
| `resource_link` | 客户端后续可按需拉取的 URI | 在后续读取资源时重新执行鉴权 |
| `resource` | 直接内嵌在当前结果中的数据 | 在当前调用立即强制执行载荷与内容上限 |

资源链接(`resource_link`) không đảm bảo rằng nguồn tài nguyên này phải hiện diện.`resources/list`Trong danh sách này. Nó là một trích dẫn của công cụ này để truy cập vào URI. Khi khách hàng cố gắng truy cập vào URI, vẫn cần thực hiện các chiến lược kiểm soát truy cập tài nguyên địa phương của nó.

Nội dung tài nguyên`resource`(v) tránh một lần quay trở lại mạng bổ sung, nhưng sẽ tăng khối lượng của các bài báo đáp ứng hiện tại.

本课例代码中 `evidence_bundle`Kết quả cũng bao gồm 5 loại này.

## `x-mcp-header`là đường dẫn của dữ liệu

Trong `inputSchema`Một thuộc tính bên trong có thể được tuyên bố.`x-mcp-header` Trong giao thức truyền tải HTTP được phát trực tuyến, khách hàng sẽ được xem như là`Mcp-Param-{name}`标头:

```json
{
  "region": {
    "type": "string",
    "x-mcp-header": "Region"
  }
}
```

当参数为`region: "eu-west"`时, truyền tải cấp có thể phát hành như sau:

```http
Mcp-Param-Region: eu-west
```

引入该注解的目的是让负载均衡器、网关或策略引擎在无需解析完整JSON请求体的情况下完成路由──这里**绝对不能**Sử dụng để truyền thông qua giấy phép hoặc dữ liệu nhạy cảm.

Hiệp định đối với việc giải quyết đã áp dụng các quy định nghiêm ngặt:

- 标头名称必须非空,且符合HTTP field-name token 语法规范;
- 标头名称在不区分大小写的前提下必须全局唯一;
- 参数 thuộc tính kiểu chỉ có thể là chuỗi, số nguyên hoặc boolean;
- Không được sử dụng `number`(浮点数);
- Việc giải quyết chỉ có thể trực tiếp xuất hiện.`inputSchema.properties`n 1 n 1 n 1 n 1 n 1 n 1
- 整数取值范围必须限制在`-9007199254740991`Đến`9007199254740991`(JavaScript 安全整数范围)

位置规则是语法级别的,并且必须是安全失败 (故障关闭) 机制. 必须穿越整个树 Schema 树,而不能仅仅检查校验器巧识别顶级属性. 只有注解现身嵌套对象的`properties`Này,`oneOf`分支中,`items`Trong `$ref`Trong định nghĩa của trích dẫn, hoặc bất kỳ Output Schema nào, tất cả phải quyết tâm từ chối.

Bài học này đã thêm một chiến lược an ninh triển khai:`password``secret``token``api_key`Hoặc`authorization`Các quy định chính thức xác định khuyến nghị các nhà văn dịch vụ không cần phải xem xét các tham số nhạy cảm, và khách hàng có thể thực hiện đề nghị này với các quy tắc kiểm soát nhập cảnh nghiêm ngặt.

审计时只记录标题名称,不记录其具体数值.`Mcp-Param-Region`, và sẽ có giá trị cụ thể`eu-west`排除在审计日志之外──

### Trong xây dựng HTTP 标题 trước để mã hóa số lượng

参数 chỉ có thể được truyền trực tiếp dưới dạng văn bản trong tiêu đề:非空字符串, bởi ASCII 可见字符(`!`Đến`~`(c) thành phần, và không bao gồm mã số tiền quân sự trước ;;

```text
=?base64?{Base64UTF8}?=
```

Trong số đó `Base64UTF8`là một quy tắc được thực hiện cho các trình tự chữ UTF-8 hoàn toàn chính xác của các tham số Base64 编码. Không cần phải trước đó thực hiện các chuỗi chữ cái.`=?base64?` giá trị đầu tiên, tất cả phải được mã hóa.  giá trị hình dạng như trạm trước  được mã hóa một lần nữa, chính xác là đầu cuối nhận có thể xác định lại văn bản chữ nguyên thủy, nhưng sẽ không phân tích sai trong các giao dịch lớp ngôn ngữ.

Bộ giá trị thống nhất `true`Hoặc`false` Số nguyên nhất định trong 10 进制字符串, và phải nằm trong phạm vi toàn số JavaScript an toàn.

### 服务端校验镜像副本

Trong các giới hạn HTTP được phát trực tuyến, các thiết bị dịch vụ phải:

1. Trong không phân biệt tiêu đề tên viết, tìm tất cả các nhận dạng `Mcp-Param-*`-
2. Nếu có hình thức Base64 , hãy xác định mã hóa;
3. Để giải mã văn bản sau đó và đối ứng JSON yêu cầu các tham số được thực hiện nghiêm ngặt đối với;
4. Nếu phát hiện ra tiêu đề đã được xác định có sự thiếu hụt, lặp lại, không dự kiến xuất hiện, sai lầm định dạng hoặc không phù hợp với yêu cầu, trực tiếp từ chối trước khi phát hành kinh doanh.

Việc từ chối phải trả về HTTP `400`Và JSON-RPC 错误码 `-32020` Giá trị của đơn vị yêu cầu và hình thức tiêu đề sau khi được mã hóa không thuộc về nội dung của hồ sơ kiểm toán, trong hồ sơ kiểm toán chỉ ghi nhận danh mục tiêu đề xuất và loại nguyên nhân từ chối.

`code/main.py`直接模拟了这个边界逻辑.[第 09 课](../../09-mcp-transports/)进一步讲解包括HTTP Method 和协议版本一致性在内更广泛的 Streamable HTTP 校验顺序──

## Biểu tượng không rõ ràng

MCP's list operation adopting游标分页面(cursor pagination) ――服务端决定每页的大小与游标格式──客户端只需遵循一个唯一的判断:

```python
if result.get("nextCursor") is None:
    break
cursor = result["nextCursor"]
```

**绝对不要**写成如下形式:

```python
if not result.get("nextCursor"):
    break
```

Vì không có gì.`""`Nếu sử dụng trực tiếp giá trị thực của Python để xác định sự thật, sẽ dẫn đến quá sớm.

客户端绝不能尝试游标解码"", tự增运算"",将新游标与旧游标比对以判断顺序,或推断页码――服务端可能会签名游标"",绑定它到特定目录版本",或将其映射到底层私有状态,所有这些都属于服务端内部实现细节――

Ví dụ dịch vụ đã trở lại sau khi trang đầu tiên`""` Khách hàng trong gửi yêu cầu trang thứ hai phải mang theo giá trị này như sau:

```text
<first request with no cursor>
<second request with cursor "">
```

无效的游标输入应产生 JSON-RPC không hợp lệ các tham số 错误(错误码 `-32602`(■)

## tự động bổ sung toàn bộ là quyền tấn công mặt

`completion/complete`方法为快速参数与资源模板参数提供自动补充建议── nó rất hữu ích trong biểu表交互式表, nhưng nếu không thêm bảo vệ, có thể sẽ tiết lộ các tên nhạy cảm được bảo vệ bởi các giao diện danh sách thông thường──

Một tuyên bố bổ sung được yêu cầu về các đối tượng được trích dẫn và các tham số đang được bổ sung:

```json
{
  "method": "completion/complete",
  "params": {
    "ref": {
      "type": "ref/prompt",
      "name": "deployment_review"
    },
    "argument": {
      "name": "environment",
      "value": "st"
    }
  }
}
```

Kết quả trả lại có chứa tối đa 100 giá trị đề xuất, và có thể được kèm theo.`total`Với`hasMore`字段。

 phải được áp dụng trong ứng dụng này với các tài nguyên được trích dẫn hoặc hoàn toàn phù hợp với giới hạn quyền hạn.`development`Với`staging`                                                                                                                                                                                                                                                              `production`                                                                                                                                                                                                                                                              

生产级补充服务 cũng cần có:

- 严格的入学考试;
- 区分调用者身份的过;
- 客户端防(đánh xuống);
- 服务端限流(khuyết lệ hạn chế);
- Có giới hạn số lượng kết quả;
- Trong ngày ghi tránh sự phơi bày nhạy cảm bổ sung khuyến nghị được lấy giá trị.

补全 thuộc vào các phương tiện nhập hỗ trợ, không thể trở thành cửa sau của việc kiểm tra quyền phát hiện.

## 双层错误机制

 phải phân biệt nghiêm ngặt các sai lầm cấp độ giao ước với các sai lầm thực hiện công cụ.

Khi MCP yêu cầu không thể được chính xác phân phát, sử dụng **JSON-RPC error**- Có thể là:

- Tên công cụ không được biết;
- 格式错误的请求报文;
- 缺失必要的请求元数据;
- 无效的分页游标.

Khi sử dụng công cụ đến thành công, và công cụ trên báo cáo là một thất bại có thể điều chỉnh, sử dụng có`isError: true`của **完整工具结果（complete tool result）**- Có thể là:

-  Một nguồn dữ liệu báo cáo tạm thời không thể sử dụng;
- 传入日期 vượt quá phạm vi được hỗ trợ;
- Quy tắc kinh doanh từ chối yêu cầu.

Một mô hình lớn thường có khả năng hiểu và sửa chữa công cụ thực hiện sai lầm, nhưng mô hình lớn không thể tự sửa chữa vi phạm bản thân của mình.

Nếu công cụ tuyên bố Output Scheme, nên được xây dựng trong Scheme  trong các thất bại có thể vận hành trong các ví dụ.`route_report`Khi thất bại, sẽ trở lại`isError: true`Ngoài ra, các vùng yêu cầu của nó`accepted: false`                                                                                                                                                                                                                                                              

## 手写实现

`code/main.py`Sử dụng Python 标准库 hoàn toàn thực hiện logic cốt lõi của hai bên biên giới.

服务端实现:

- Ứng dụng kiểm tra dữ liệu MCP của mỗi yêu cầu;
-  tuyên bố công cụ và hoàn thành  năng lực `server/discover`-
- 确定性的 `tools/list`分页逻辑;
- Có bốn mô tả công cụ (bao gồm một mô tả không an toàn được xây dựng cố ý và phải bị từ chối);
- Số lượng loại cấu trúc xuất khẩu;
- Hiện tại tất cả các công cụ nội dung khối loại hỗ trợ;
- Streamable HTTP 一致性门禁:解码已识别参数标题, và trả về HTTP khi nội dung không phù hợp `400`和 JSON-RPC `-32020`-
- 带权限控制与限流的补充功能──

客户端实现了:

- 工具描述符准入机制;
- Tất cả cây `x-mcp-header` Chiến lược phòng thủ vị trí và các yếu tố nhạy cảm;
- 精确的纯 ASCII 可见字符直接传输或 Base64 UTF-8编码;
- 正确 theo dõi vòng lặp không minh bạch của dấu hiệu không minh bạch;
- 参数与回归结果校验;
- 内容块合法性校验;
- Chỉ chứa tên của tiêu đề mà không chứa các giá trị số nhạy cảm của tiêu đề kiểm toán ghi chép sự kiện.

Vì vậy, mô tả không an toàn có ý nghĩa là một ví dụ giáo dục tuyệt vời. Nó chứng minh rằng một công cụ bị từ chối sẽ không cản trở việc tải và đăng ký bình thường của các công cụ tuân thủ khác.

## 运行验证

Từ code root danh mục xuất phát:

```bash
cd phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/code
python3 main.py
python3 -m unittest discover tests -v
```

Ứng dụng trình bày sẽ theo dõi in các công cụ đã được đưa vào Ứng dụng trình bày bị từ chối Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình bày Ứng dụng trình duyệt Ứng dụng trình trình duyệt Ứng dụng trình trình duyệt Ứng dụng trình trình trình duyệt Ứng dụng trình trình trình duyệt Ứng dụng trình trình duyệt Ứng dụng trình trình duyệt Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứng dụng Ứ

## 交互式实验

打开 `code/main.py`Không tìm thấy`TOOLS`变量:

1. sẽ`tag_catalog.outputSchema.type`Từ `array`改为 `object`
2. 运行演示程序──观察客户端如何坚决拒绝回归的数组结果──
3. Khôi phục lại quy trình ban đầu.
4.  giữ trang đầu tiên `nextCursor`Vì vậy`""`, rồi đưa trang cuối cùng trở lại `nextCursor: None`Thay vì trực tiếp省略该字段.
5. 运行测试并对比游标的追踪链路──
6. Để một chuỗi  tính chất thêm `x-mcp-header: "Authorization"`
7. 确认描述符准入检查在调用前将其成功拒绝.
8. 尝试使用包含 Unicode、换行符、首尾空格以及字面文本 `=?base64?SGVsbG8=?=`của `region`取值──解码发出每标头,验证原始值被完全无损地恢复──
9. Sẽ giải quyết chuyển đến`oneOf``items`Hoặc`$ref`定义的深层分支下──确认即使演示程序从不进入该分支,描述符进入仍将拒绝它──
10. 删除已识别标标头或改其解码后的取值── xác nhận HTTP 边界返回状态码 `400`Và JSON-RPC 错误码 `-32020`

Mục tiêu cốt lõi của thí nghiệm này không phải là ghi lại các đoạn JSON, mà là xem mỗi đoạn kết nối được thực hiện như thế nào.

## 动手实践

Để làm việc kinh nghiệm mở rộng một `search_evidence`工具──

需求规范:

1. 其输入 Schema  chấp nhận `query``limit`Và an toàn.`region`路由字段──
2. Các Output Schema được tạo ra bởi các đối tượng, mỗi đối tượng bao gồm`uri``title`和 `score`
3. Kết quả trong mỗi mục cần chứa văn bản兼容性 cùng một đối ứng nguồn lực liên kết ((resource_link) 👇
4. 参数校验时拒绝未知属性──
5. `limit`受到应用层校验的上限约束.
6. Không quyền truy cập vào người dùng của URI cụ thể, dù thông qua tự động hoàn chỉnh hoặc công cụ xuất, đều không thể nhìn thấy URI này.
7. 编写测试,覆盖不合规的分数 评分、非法的标题注解,以及两页分页列表场景──
8. 标头数值测试需要覆盖可见ASCII、Unicode、控制字符、空白字符、形似哨兵的文本,以及JavaScript 安全整数边界──
9. HTTP 测试具需支持大小写不敏感标题名称查找, nhưng gặp phải thiếu hoặc không phù hợp đã xác định标题, quyết tâm quay lại mã trạng thái `400`Với lỗi `-32020`

## 交付产物

`outputs/skill-mcp-contract-reviewer.md`Đây là một kỹ năng kiểm tra độc lập có thể được sử dụng trực tiếp. Kỹ năng kiểm tra độc lập có thể được sử dụng trực tiếp.

## 验证标准

Khi tất cả các mục tiêu sau được đạt được, mục tiêu của chương trình này là hoàn thành:

- `tools/list`Trong nhiều lần lặp lại, giữ nguyên một thứ tự logic hoàn toàn giống nhau.
- 客户端在 `nextCursor`Vì vậy`""`时能正确发起第二分页请求──
- Các mô tả của các nhãn nhạy cảm không an toàn được loại bỏ, đồng thời các công cụ hợp pháp khác được chuẩn bị.
- Kết quả số có thể qua số của nó xuất ra Schema 校验。
- Kết quả đối tượng trong hệ số quy trình
- 报错结果(Phản ứng lỗi) phải省略 hoặc vi phạm được xuất bản Schema。
- Text、image、audio、resource_link 和 resource 五种内容块均通过校验──
- 标头审计事件仅记录标头名称, không ghi lại số lượng cụ thể của nó.
- 纯 ASCII 可见字符保持直传;Unicode、控制字符、带空格填充、空字符串及形似哨兵的均均值通过 Base64 UTF-8 精确往返编解码──
- 镜像的整数超越 JavaScript 安全整数范围时被拒绝──
- 位于 `oneOf``items`、để đặt đối tượng,`$ref`hoặc xuất Schema 中的注解在准入阶段被拦截了.
- Tên của tiêu đề đã được xác định không nhạy cảm chỉ được thông qua khi giải mã giá trị hoàn toàn phù hợp với yêu cầu; thiếu hoặc không phù hợp tiêu đề tạo ra HTTP`400`和 JSON-RPC `-32020`
- Ứng viên phân tích tự động hoàn toàn không quay lại `production`
- 工具自身业务失败使用 `isError: true`;协议格式变使用 JSON-RPC `error`

## 生产环境故障模式

| 故障现象 | 学习者看到的表象 | 正确处理方案 |
|---------|-----------------------|------------------|
| 客户端假定输出必定是 object | 合法的数组校验失败或被静默包装 | 依据发布的 Schema 进行校验，不假定结果必须为 object |
| 空字符串游标被当成 False 处理 | 最后一页数据意外丢失 | 只要 `nextCursor` 存在且非 null，就继续拉取下一页 |
| 镜像了敏感参数值 | 凭证密钥暴露在代理、WAF 或链路追踪日志中 | 拒绝该描述符，将机密保留在受保护的请求体内部 |
| 原始 Unicode 或空白字符直接镜像 | 网关与源站解析不一致，或值被意外规范化 | 使用 Base64 UTF-8 哨兵编码并在解码后进行比对 |
| 注解隐藏在 Schema 的复杂分支中 | 客户端在准入时漏检了路由元数据 | 遍历整棵 Schema 树，仅允许直接位于一级的属性携带注解 |
| 镜像了大整数 | 中间 JavaScript 代理对路由数值进行了舍入 | 拒绝超出 JavaScript 安全整数范围的数值 |
| 标头与请求体不一致 | 网关路由给服务 A，而源站实际执行服务 B | 在业务分发前以 HTTP `400` 和 JSON-RPC `-32020` 拒绝 |
| 忽略了输出 Schema | 下游程序消费了损坏的脏数据结构 | 在交给模型或应用程序前进行严格校验 |
| 盲目信任返回的资源链接 | 调用方直接读取了未获授权的 URI | 对每一次资源读取重新执行鉴权 |
| 自动补全共享了全局建议列表 | 多租户敏感隔离名称被泄露 | 按调用者身份、引用上下文与权限范围进行过滤 |
| 将工具注解当作安全策略 | 破坏性危险操作跳过了二次确认 | 在注解之外建立独立的授权与审批流 |
| 单个格式错误的工具搞垮整个发现流程 | 整台 MCP 服务端完全不可用 | 拒绝有问题的描述符，独立准入其余合规工具 |

## Capstone 串联

Các dự án Capstone giai đoạn 13 cần một mạng lưới có thể tập hợp từ nhiều thiết bị dịch vụ.

Sử dụng các công cụ giao dịch của khóa học này để đánh giá bốn chứng chỉ cốt lõi của Capstone:

- 确定性和完整的游标分页发现过程;
- Trong sự tiếp xúc với mô hình trước đó của các mô tả cụ thể;
- Các khối nội dung được cấu trúc xuất khẩu và có giới hạn nghiêm ngặt thông qua các kỳ thi;
- 严密守护授权边界的补充与路由元数据──

Đừng chỉ vì một lần thôi`tools/call`调用成功就宣称兼容网关规范──请务必捕获描述符、分页链路追踪、已准备入工具集、被拒绝工具集,以及至少一个完整的校验通过结果──

## 关键术语

| 术语 | 含义 |
|------|---------|
| `inputSchema` | 定义工具所接受参数的 JSON Schema 对象 |
| `outputSchema` | 定义 `structuredContent` 格式的可选 JSON Schema |
| `structuredContent` | 工具执行结果所生成的任意 JSON 结构化数值 |
| 内容块（Content block） | 具备类型化标记的 text、image、audio、resource_link 或 embedded resource |
| `x-mcp-header` | 将基础类型参数镜像为 Streamable HTTP 标头元数据的 Schema 注解 |
| 不透明游标（Opaque cursor） | 服务端发出的分页标记，客户端不得解释其内部含义 |
| 补全引用（Completion reference） | 正在请求参数补全的 Prompt 名称或资源 URI/模板 |
| 准入（Admission） | 客户端根据本地策略决定公开暴露还是拒绝已发现描述符的决策过程 |

## 延伸阅读

- [MCP Tools 规范](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Completion 自动补全规范](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/completion)
- [MCP Pagination 游标分页规范](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/pagination)
- [MCP Streamable HTTP 参数标头规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#custom-headers-from-tool-parameters)
