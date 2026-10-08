# MCP Registry  supply chain:准入、漂移与回滚

> Các mục đăng ký chỉ có thể chỉ ra những gì nhà phát hành tuyên bố.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 17 (gateways and registries), Phase 13 · 18 (production authentication)
**Time:** ~90 minutes

## Học mục tiêu

- 明确切分 Registry 发布、软件包出处 (来源) 运行时发现与本地审批等不同边界──
- Trong khuôn khổ tuyên bố của mình, độc lập xác nhận không gian đặt tên của mình.
- Đối với các bản ghi không thể thay đổi, nguồn thực hiện, phần mềm và các công cụ thực tế
- Trong khi đó, thực tế kiểm tra Registry  trạng thái thay đổi với hành vi trong quá trình vận hành漂移.
- Trong khuôn khổ không viết lại lịch sử, sẽ được chuyển hướng trở lại phiên bản đã sẵn sàng trước đây.
- 维护一个防改的准入账本 (đăng ký sổ cái), cho mỗi quyết định cung cấp giải thích kiểm toán.

## 核心问题

Anh tìm thấy nó trong sổ đăng ký.`com.example/inventory`◊ mô tả của nó trông hoàn toàn phù hợp với nhu cầu.`server/discover`

Đây không phải là một sự kiện đơn lẻ, mà là một câu chuyện thực tế được viết bởi các cơ quan có quyền lực khác nhau:

1. Một người đã thông qua chứng chỉ danh tính không gian này đã gửi một hồ sơ.
2. Một trung tâm đăng ký gói đã phát hành một công cụ có đặc điểm đặc biệt với bản tóm tắt của Hash.
3. Một điểm cuối thực hành đã báo cáo phiên bản giao thức, khả năng hỗ trợ, công cụ có sẵn và thông tin từ các dịch vụ chẩn đoán.
4. Tổ chức của bạn xác định rằng bộ hợp nhất này được phép vận hành theo chiến lược.

Nếu chúng ta làm nhầm lẫn các cấp độ này, đơn giản là nghĩ rằng vì nó nằm trong Registry, bạn có thể trực tiếp tin tưởng, sẽ để lại một vùng mù quáng lớn trên an toàn chuỗi cung ứng. Một phiên bản phát hành hợp pháp bất cứ lúc nào có thể bị bỏ rơi. Nếu bạn không có bản tóm tắt công cụ cố định, thẻ gói phần mềm có thể được thay thế trong tương lai với một thứ hai không mong đợi.

 Giải pháp là thiết lập một bộ điều khiển nhập học (Admission Controller), trong mỗi biên giới đều bắt buộc phải thu thập và kiểm tra bằng chứng.

## Đăng ký là chỉ mục, chứ không phải hệ thống phê duyệt của bạn.

官方 MCP Registry dùng để lưu trữ dữ liệu của các dịch vụ.`server.json`记录声明 một phiên bản dịch vụ, và liệt kê một hoặc nhiều gói phần mềm hoặc điểm cuối xa. Quy tắc phát hành bao gồm xác nhận không gian đặt tên, kiểm tra quyền sở hữu gói phần mềm, quy tắc đăng ký hạn chế và vị trí lưu trữ dữ liệu của nhà phát hành bị hạn chế nghiêm ngặt.

Những biện pháp kiểm soát này được trả lời là:**发布层面**Nhưng chiến lược an toàn môi trường sản xuất của bạn vẫn phải được trả lời.**部署层面** vấn đề:

| 边界 | 核心问题 | 证据所有者 |
|---|---|---|
| 命名空间 | 该发布者是否有权使用此名称？ | Registry 认证凭证 + 本地验证过的命名空间输入 |
| 发布记录 | 发布者针对该版本具体声明了什么？ | 不可变的 `server.json` 内容摘要 |
| 执行源 | 最终执行的是哪个软件包或远程端点？ | 已声明的源字段、已验证的所有权结果、传输协议以及可信内容摘要 |
| 运行时 | 该端点当前实际暴露了什么能力？ | 实时 `server/discover` 结果与工具描述符 |
| 准入决策 | 本地安全策略是否批准了这套确切的组合？ | 本地固定的指纹（Pin）与账本记录项 |
| 运维治理 | 当前服务是否依然安全？故障时何者可替代？ | 漂移检测、状态同步、健康检查与备用回滚路由 |

Registry Schema 版本与 MCP 协议版本是彼此独立的──一条记录可能采用已发布的`2025-12-11`服务端规范, trong khi thực tế hoạt động của các dịch vụ端 hỗ trợ MCP `2026-07-28`Không thể từ một phiên bản này đi đến phiên bản khác.

```figure
mcp-registry-admission
```

## 单次准入决策中的七重控制

### 1. 命名空间验证

官方 Registry's naming adoption travers travers identity identity identity的命名空间── một tên miền của một chứng chỉ có thể được chiếu như một hình thức ngược chiều của tên miền.`example.com`Quyền kiểm soát có thể được thiết lập.`com.example/*`Sự hợp pháp của nó.

绝对不能使用简单的字符串前检查:

```python
server_name.startswith("com.example")
```

Vì phán xét này cũng sẽ sai lầm để cho phép những người xấu xa giả vờ.`com.exampleevil/tool`! phải làm`/`切分名称, yêu cầu chứa các đoạn sưu tập không trống,并精确比对命名空间这一段.

基于 GitHub 组织命名空间与基于域名命名空间具有不同的认证路径. 进入控制器应将这两条路径统一规范化为同一个输入参数:完全匹配且已验证的命名空间字符串.

### 2. 出处关联(Việc tham gia)

Đối với các loại tài liệu về gói phần mềm, dữ liệu của tuyên bố phải được liên kết chặt chẽ với các công cụ thực tế được thu được trong các đoạn rõ ràng sau:

- 软件包注册中心类型(如 PyPI、npm)
- 软件包标识符
- 软件包版本号
- 已验证 quyền sở hữu kiểm tra kết quả
- 实际下载工件的内容 哈希摘要

Đồng thời cũng cần phải có một giao thức truyền tải của tuyên bố truyền tải. Nếu một mục tài liệu chỉ tuyên bố về điểm cuối từ xa (remote endpoint), nó cũng hoàn toàn phù hợp, không thể từ chối lỗi của nó vì thiếu phần mềm. Đối với nguồn từ xa, cần phải có một URL và loại truyền tải của tuyên bố liên quan đến quyền sở hữu điểm cuối đã được xác minh độc lập, cũng như kết nối đáng tin cậy hoặc kết nối hoặc phân bố chứng cứ.

Các mã ví dụ trong bài này đồng thời hỗ trợ hai loại nguồn này, và sẽ được chọn nguồn với Registry 源、服务端名称、Registry 版本、记录摘要以及凭证摘要共同计算出一个哈希──生成的出处摘要( provenance digest) là chỉ số chặt chẽ cho chuỗi chứng cứ hoàn chỉnh, nhưng nó không thể thay thế cho sự tồn tại lâu dài của chứng cứ nguyên thủy hoàn chỉnh.

Không thể trực tiếp chấp nhận bản tóm tắt được cung cấp bởi các công cụ kiểm tra riêng của mình.

### 3.  quyết định cố định, chứ không phải chỉ phiên bản cố định

Registry  phiên bản là mã thông báo phát hành duy nhất. Các dữ liệu đã được phát hành là không thể thay đổi. Bất kỳ sửa đổi nào của bản ghi cũng phải được phát hành cho một phiên bản mới. Mặc dù chính thức khuyến cáo sử dụng phiên bản ngữ nghĩa hóa (SemVer), nhưng Registry không có yêu cầu bắt buộc, cũng không chấp nhận các mã thông báo trong phạm vi phiên bản tương tự.

Điều này có nghĩa là như vậy.`^1.4`lastest更不是──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

```json
{
  "server": "com.example/inventory",
  "version": "1.0.0",
  "recordDigest": "...",
  "source": {"kind": "package", "registryType": "pypi"},
  "sourceDigest": "...",
  "toolsetDigest": "...",
  "provenanceDigest": "...",
  "registryStatus": "active"
}
```

Để thực hiện các dấu vết cố định cùng một lúc trên nhiều cấp độ khác nhau, có thể giúp bạn nhanh chóng định vị những biên giới xảy ra đột biến trong những trường hợp bất thường: trong cùng một Registry  phiên bản dưới ghi chép bản tóm tắt thay đổi, thuộc Registry dữ liệu tính toàn diện bị hỏng; trong cùng một phần mềm gói xếp hạng hoặc từ xa triển khai nguồn tóm tắt thay đổi, thuộc về nguồn thực thi thay đổi; trong khi toolset summary (tương cụ tiêu hóa) thay đổi, thì thuộc về hành vi di chuyển.

### 4. 实时运行时漂移检测

准入流程必须主动观测实际接收业务流量的服务端实例.`server/discover`, liệt kê hoặc lấy các mô tả công cụ bị phơi bày, và xác nhận:

- `supportedVersions`Trong chứa`2026-07-28`-
- Tất cả các yêu cầu về chiến lược địa phương đều đã sẵn sàng;
- Mỗi công cụ mô tả đều có quy định danh tính và bề mặt định nghĩa Schema;
-                                                                                                                                                                                                                                                               

Kết quả trong lựa chọn`_meta["io.modelcontextprotocol/serverInfo"]`Chỉ thuộc về bản chất tự kể, 日志与排错上下文.**绝不能**Như vậy là dựa trên các quyết định về không gian đặt tên, quyền sở hữu phần mềm, điểm đầu tư, quyền truy cập hoặc bất kỳ quyết định an ninh nào.`_meta`Bên ngoài trực tiếp`serverInfo`别名更不属于官方契约字段,绝不可将其升级为合法的诊断证.

Chỉ cần sắp xếp quy định các đoạn trong tựa đó không có nghĩa ngữ pháp. Ví dụ trong bài này được sắp xếp theo danh sách các công cụ được thiết lập trước khi tính toán, do đó thay đổi thứ tự hoàn toàn sẽ không bị báo cáo sai như là漂移. Nhưng nó sẽ không bao giờ bỏ qua bất kỳ đoạn nào trong mô tả.

Các mã thí dụ sẽ xem bất kỳ biến động nào của mô tả sai định dạng hoặc mô tả trích dẫn đều như hành vi di chuyển, lập tức tách rời dấu vân tay đó, cách ly, gỡ bỏ đường hoạt động của nó, và phong tỏa nó như một mục tiêu quay lại. Trong môi trường sản xuất, ngay cả khi là                                                                                                                                                                                                                            

### 5. Registry  trạng thái is thực时动态 trạng thái

Registry API sẽ được thêm vào một lớp đáp ứng bên cạnh mỗi kết nối dịch vụ.`_meta`đối tượng: được lưu trữ bởi đăng ký`_meta["io.modelcontextprotocol.registry/official"]`路径下──准入控制器需解析该响应并读取 `_meta["io.modelcontextprotocol.registry/official"].status` trực tiếp nằm ở các điểm gốc `_meta.status`Không phù hợp với định dạng truyền tải trên đường chính thức. Không kết hợp dữ liệu phát hành bên ngoài với dữ liệu trả lời bên trong hồ sơ.

- `active`:默认返回, có đủ điều kiện để tham gia ứng cử viên;
- `deprecated`: đã bị bỏ rơi, mặc dù vẫn có thể được kiểm tra nhưng sẽ được đưa đến cảnh sát, không còn phù hợp với việc hợp tác cho các lựa chọn tự động;
- `deleted`: đã bị xóa, ẩn trong danh sách mặc định, nhưng có thể được sử dụng để truy cập các giao diện đã bị xóa hoặc tăng quan điểm xem hồ sơ lịch sử của nó

准入完成后必须持续同步状态―― một khi phiên bản hoạt động ban đầu được đánh dấu là bị bỏ hoang hoặc xóa, nên ngay lập tức tách rời các dấu vân tay của nó và ngừng chuyển hướng lưu lượng mới cho nó―― đồng thời phải giữ lại tất cả các chứng chỉ lịch sử được xóa khỏi danh sách cố định trên, không có nghĩa là bạn có thể xóa bản ghi truy cập kiểm toán tại địa phương――

DATA tự xác định được cung cấp bởi nhà phát hành chỉ được lưu trữ trong hồ sơ phát hành`_meta.io.modelcontextprotocol.registry/publisher-provided` Đáp ứng của quản lý đăng ký dữ liệu là hoàn toàn độc lập. Không thể cho phép nhà phát hành tự  sửa đổi trạng thái chính thức của nó.

### 6. Chuyển lại nghĩa là đường từ hồi phục

Không thay đổi bản ghi trong quá trình quay lại sẽ không bao giờ được sửa đổi.

Một mục tiêu quay trở lại an toàn phải được đáp ứng:

1. 拥有完整且合法的准入记录;
2. Trong chiến lược hiện tại của địa phương, trạng thái Registry vẫn hoạt động;
3. Không được đánh dấu trong trạng thái cách ly trong bất kỳ cảnh báo hoặc chứng chỉ an toàn nào;
4. 仍然能精确解析到已固定的软件包和线上描述符集合;
5. 通过当前最新的健康检查──

Trong các thiết bị kiểm soát sản xuất thực tế, trong các thiết bị kiểm soát đầu tư chính thức, cũng phải thực hiện các gói phần mềm tái kiểm tra và tái tìm kiếm trên đầu cuối.

### 7. 追加准入账本

准入数据库 chỉ có thể giải thích những gì đang hoạt động hiện tại, trong khi准入账本 (Admission ledger) ghi lại lý do tại sao nó hoạt động.

Mỗi mục trong sổ sách bài học này đều chứa các mục đầu tiên, thời gian, loại sự kiện, nhận dạng của các dịch vụ, phiên bản, kết quả quyết định, lý do, chứng cứ, kết quả của bất kỳ một mục nào trong lịch sử, sẽ dẫn đến sự thất bại hoàn toàn của các bài kiểm tra của các chuỗi tiếp theo.

Đây là cơ chế có khả năng kiểm tra thay đổi (đặc biệt là rõ ràng), nhưng không phải là không thể phá hủy.

## 手写实现

可直接运行的控制器代码 nằm ở `code/main.py`Trung, tất cả dựa trên Python 标准库实现.

首先运行有限状态演示:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
```

Bài trình bày này thực hiện 5 hoạt động cốt lõi:

1. 准入 `1.0.0`,核验匹配的命名空间、包出处、协议版本、能力及工具集;
2. 准入 `1.1.0`Và sẽ chuyển đổi thành đường hoạt động;
3. Trong vận hành quan sát thấy một công cụ xóa không mong đợi;
4. 观测到 `1.1.0`Trong Registry trong trạng thái chính thức biến đổi`deprecated`-
5. sẽ làm cho đường trơn trở lại đúng quy định trước đây.`1.0.0`                                                                                                                                                                                                                                                              

预期输出结构:

```json
{
  "admitted": [true, true],
  "driftAllowed": false,
  "rollbackAllowed": true,
  "activeVersion": "1.0.0",
  "ledgerValid": true
}
```

建议按以下顺序研读实现代码:

1. `namespace_for_domain()`Với`namespace_matches()`: thiết lập một ranh giới xác định quyền đặt tên;
2. `digest()`Với`normalized_tools()`: tạo ra kết quả xác định;
3. `RegistryAdmissionController.admit()`: tập hợp phát hành hồ sơ, xuất phát bằng chứng, hoạt động quan sát và chiến lược địa phương;
4. `check_live()`: đối với dữ liệu quan sát mới nhất với dấu vân tay đã được xác định;
5. `observe_registry_status()`: đối với Registry  trạng thái xảy ra sự thay đổi phiên bản thực hiện tách biệt;
6. `rollback()`: chỉ hoạt động trước đã được chấp thuận và đáp ứng mục tiêu quay lại hợp pháp;
7. `AdmissionLedger.verify()`:精准检测 đối với bất kỳ thay đổi nào trong lịch sử.

## 运行与使用

sẽ được đặt giữa các thiết bị điều khiển và các đường dẫn:

```text
Registry sync -> artifact verifier -> live discovery -> admission controller -> route table
                                                |                 |
                                                v                 v
                                           evidence store    admission ledger
```

Để phân bổ các nhiệm vụ trên với nhau, nhiệm vụ Registry cũng như các nhiệm vụ liên tục chỉ cần quyền đọc dữ liệu; nhiệm vụ kiểm tra công trình cần quyền truy cập gói phần mềm; đường dẫn điều chỉnh và điều khiển cần kích hoạt quyền nhận dấu vân tay. Không một bộ phận nào cần nắm bắt toàn bộ bằng chứng.

明确划分版本的状态模型:已批准已批准) có nghĩa là bằng chứng đã qua kiểm tra chiến lược;Active(活跃) đại diện cho các tuyến đường đang sử dụng nó; Quarantine(已隔离) cho thấy cấm nhận yêu cầu kinh doanh mới;Superseded(已更换)说明 một phiên bản đã sẵn sàng khác thực sự đang trong trạng thái hoạt động;. Không thể sử dụng một giá trị đơn để pha trộn bốn trạng thái khác nhau hoàn toàn.

 phải trong hướng `tools/list`trở ngoài một thiết bị dịch vụ nào đó, nếu không, khách hàng có thể trong khoảng thời gian phát hành và đánh giá chiến lược an ninh, không ngờ phát hiện ra và sử dụng các công cụ không được tin cậy.

## 交互式实验

Bạn sẽ tự sát nhìn vào mọi biên giới từng trận thất bại.

### 实验 A:命名空间冲突

进入代码目录并打开 Python 交互环境:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/code
python3 -q
```

执行如下命令:

```python
from main import namespace_matches
namespace_matches("com.example/inventory", "com.example")
namespace_matches("com.exampleevil/inventory", "com.example")
```

Kết quả đầu tiên là:`True`; kết quả thứ hai là `False`                                                                                                                                                                                                                                                              `startswith`, quan sát tại sao một cái tên xấu thứ hai sẽ phá vỡ ranh giới.

### 实验 B: mô tả符漂移

```python
from main import *
times = iter(f"2026-08-21T12:00:{n:02d}+00:00" for n in range(10))
c = RegistryAdmissionController(clock=lambda: next(times))
meta = {OFFICIAL_META_KEY: {"status": "active"}}
c.admit(sample_record("1.0.0"), meta, "com.example", evidence_for("1.0.0"), sample_live("1.0.0"))
c.check_live("com.example/inventory", "1.0.0", sample_live("1.0.0", True))
```

Checkback và đường dẫn của trạng thái. Software package và Registry  ghi chép không thay đổi gì, nhưng do bề mặt của công cụ thay đổi trong quá trình vận hành, thiết bị điều khiển ngay lập tức bị tách ra và ngừng sử dụng dấu vân tay cố định.

### 实验 C: trạng thái và quay lại

准入 `1.1.0`, đánh dấu nó là bị bỏ hoang, và cố gắng phân biệt quay lại với hai mục tiêu:

```python
c.admit(sample_record("1.1.0"), meta, "com.example", evidence_for("1.1.0"), sample_live("1.1.0"))
c.observe_registry_status("com.example/inventory", "1.1.0", "deprecated")
c.rollback("com.example/inventory", "1.1.0", "unsafe retry")
c.rollback("com.example/inventory", "1.0.0", "restore known release")
c.ledger.verify()
```

Mục tiêu được tách biệt sẽ được rõ ràng từ chối, và trước đó`1.0.0`Quý vị đã được kích hoạt, tài khoản đã được giữ luôn luôn hiệu quả.

## 动手实践

为控制器扩展双人审批门禁 (cổng chấp thuận hai người)

需求规范:

- Ưu điểm thông tin cần được lưu trữ như một tài liệu chứng minh bằng chữ ký số đã được ký kết, phải được lưu giữ trong dấu vân tay như một chữ cái biến đổi;
- Khi công cụ tập trung chứa tuyên bố`destructiveHint: true`Trong trường hợp cao nguy, phải yêu cầu hai chữ ký làm kiểm tra viên khác nhau;
- 拒绝包含重复身份的审批;
- Khi phê duyệt chưa hoàn tất, vẫn có ghi chép đầy đủ trong sổ sách của nỗ lực nhập cảnh lần này;
- 编写测试,分别覆盖 0 người、1 người、重复身份以及 2 tình huống phê duyệt với các tình trạng hợp pháp khác nhau;
- Ngày nay không thể in chữ ký số, khóa chứng chỉ hoặc số công cụ tư nhân hoàn chỉnh.

验收标准: miễn là thiếu hai giám sát viên độc lập đối với bản ghi kết hợp hoàn toàn                                                                                                                                                                                                                                                    

## 交付产物

本课程交付 `outputs/skill-mcp-registry-admission.md` Trong việc kiểm tra Registry mới  phiên bản hoặc 排查运行时漂移, có thể coi nó như một cuốn sách vận hành có thể được tái sử dụng trực tiếp. Nó độc lập xác định các tham số nhập, từ chối quy tắc, chứng minh, điều chỉnh trạng thái và quy trình và yêu cầu chứng chỉ quay lại, không phụ thuộc vào bất kỳ tên trong mã thí dụ cụ thể nào.

## 验证标准

运行演示程序与全套确定性单元测试:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件 phải chứng minh nghiêm ngặt:

- 精确的命名空间边界能成功拦截形似前的恶意名称;
- Chỉ có đăng ký  trạng thái của đăng ký tên miền được kèm theo để quyết định phiên bản có đủ điều kiện để ứng cử hay không;
- Các gói phần mềm không được thử nghiệm hoặc không phù hợp với nội dung sẽ bị từ chối dứt khoát;
- 发布者自述元数据绝不能冒充登记处 官方托管元数据;
- Việc sắp xếp danh sách công cụ được quy định, đồng thời không che giấu sự thay đổi thực chất của mô tả;
- 结构  biến đổi của phần mềm và công cụ định nghĩa sẽ gây ra thất bại an toàn;
- `serverInfo`Chỉ giữ trong chứng chỉ chẩn đoán, không bao giờ trao quyền vào;
- Khi mô tả xảy ra di chuyển, hệ thống sẽ ngay lập tức thực hiện cách ly, gỡ bỏ đường, và khóa vào vòng quay của dấu vân tay;
- Hình trạng trên biến động động động đến sự tách biệt của dấu vân tay hoạt động;
- 回滚绝不能选定被隔离或未知版本;
- Bất kỳ thay đổi nào trong sổ sách lịch sử đều có thể được kiểm tra ngay lập tức.

## 生产环境故障模式

| 故障现象 | 发生原因 | 必须采取的应对措施 |
|---|---|---|
| 名称看似合法但命名空间从未经验证 | 准入策略轻信了记录内部的自述文本 | 严格拒绝，直到可信命名空间验证方提供精确前缀 |
| 相同软件包坐标拉取到了全新的二进制内容 | 上游版本被覆盖或分发源遭受投毒篡改 | 立即终止激活，保留两份摘要，调查拉取网络边界 |
| “latest”版本在未经人工审查的情况下发生漂移 | 浮动版本选择绕过了固定指纹机制 | 始终只解析和激活完全精确的已准入版本与摘要 |
| 安全审查通过后线上悄然出现新工具 | 发生了运行时行为漂移，或部署了不同镜像 | 隔离该路由，重新采集最新的实时描述符快照 |
| 已废弃的版本依然在线上持续运行 | 状态同步机制缺失或同步存在严重延迟 | 建立定时状态调和机制，并在每次路由激活前复核 |
| 已删除记录在默认同步中彻底消失 | 客户端只向 Registry 增量请求活跃记录 | 采用增量式或感知删除事件的调和机制，并在本地归档历史 |
| 回滚的目标版本根本从未通过准入审查 | 路由切换与准入审批状态彼此脱节 | 坚决拒绝回滚，强制对该目标走全新的准入流程 |
| 攻击者重写全部账本后本地依然校验通过 | 哈希链缺乏外部信任根的约束锚定 | 定期将带签名的账本头发布到独立的外部信任域 |
| 留存的凭据中泄露了 Bearer Token 或参数 | 日志和证据记录盲目复制了完整请求 | 在采集入口处执行脱敏，仅持久化留存最小必要凭据 |

## 运维守则

发布流程回答的是该身份是否有权发布这个名称?而准入流程回答的是我们是否确信要执行这个具体的工件,并向大模型暴露这个具体的行为?务必将这两项裁决严格分开,对每个关点进行指纹固定,让回滚成为基于可验证证证证据的工程动作,而不是依赖于人脑记忆的幸运尝试.

## 延伸阅读

- [官方 Registry server.json 规范要求](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [官方 Registry OpenAPI 接口定义](https://registry.modelcontextprotocol.io/openapi.yaml)
- [MCP 2026-07-28 服务端发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
