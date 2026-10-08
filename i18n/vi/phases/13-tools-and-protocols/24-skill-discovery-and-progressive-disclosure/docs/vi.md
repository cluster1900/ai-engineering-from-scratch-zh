# Khả năng phát hiện và phát hiện

> Một kỹ năng đã được sử dụng trước khi nó được tải lên chính thức. Tên và mô tả của nó giành được một vị trí trong danh mục; trong khi các tài liệu cấp độ sâu hơn chỉ có thể được tham gia vào các nhiệm vụ khi thực sự chạm vào chúng.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22 (Agent Skills: Portable Contract and Runtime Boundary)
**Time:** ~105 minutes

## Học mục tiêu

- 构建一个将作用域 (scope) 校验 (校验) 冲突策略和目录发布明确解的文件系统发现流水线 (Discovery Pipeline) 
- 解释三种渐进式披露级别( ba mức tiết lộ):目录元数据(kátalóg metadata)、激活指令( hướng dẫn hoạt động)和特定任务资源(任务特定资源)。
- 设计引用 (chuyển văn bản), giúp đại lý có thể trực tiếp nhận được thông tin chi tiết cần thiết, mà không cần tải toàn bộ gói.
- 将目录空间预算 (Catalog budget) với hoạt động của kỹ năng hoạt động
- Trong kỹ năng 读取自身资源时,拒绝路径遍历 (rút qua đường) 和符号链接逃逸 (rút qua đường)

## 问题

Trưởng của anh đã cài đặt 200 kỹ năng... nếu bắt đầu cuộc họp thì hãy tải mỗi kỹ năng lên.`SKILL.md`、 tài liệu tham chiếu (reference file) 、脚本和模板, nhiệm vụ hiện tại sẽ bị chìm trong chi tiết quy trình không liên quan.

常见的折中方案是目录: trình bày các kỹ năng và cách thức mô tả của mỗi kỹ năng đã đủ điều kiện, chỉ sau khi được chọn tải đầy đủ văn bản chính xác.

Đầu tiên, phát hiện (đám phá) không chỉ là tìm kiếm tài liệu chuyển tiếp. Kỹ năng có thể tồn tại trong khu vực làm việc của dự án. Người dùng. Người quản lý. Người quản lý.

Thứ hai, tiết lộ tiến bộ) có thể sẽ biến thành hỗn loạn tiến bộ.`SKILL.md`写着阅读相关指南, trong khi gói chứa 12 hướng dẫn, mô hình chỉ có thể dựa vào một đoán. Nếu mỗi hướng dẫn lại hướng đến 3 tài liệu khác, quá trình tải sẽ trở thành một quá trình vẽ vô hạn.

Một thời gian chạy tốt nhất có thể làm cho quá trình phát hiện có tính xác định, và làm cho thông tin được tiết lộ sâu sắc.

## 概念

### 发现是一个编译器流水线

将文件系统视为源码输入. Đừng trực tiếp đưa đường gốc ra mô hình.

```figure
skill-discovery-pipeline
```

Mỗi giai đoạn đều nên tạo ra dữ liệu cấu trúc và sai lầm cấu trúc.

- - Tìm kiếm những danh mục gốc nào?
- 找到了哪些候选包?
- nhận được những ứng cử viên nào, lý do là sao?
- Trong cuộc xung đột tên là cái gì thắng?
- Do hạn chế ngân sách, những mục nào được rút ngắn hoặc bỏ qua?

Nếu không có những bằng chứng quan sát này, thì việc chẩn đoán tại sao mô hình không sử dụng kỹ năng của tôi gần như là không thể.

### 作用域是运行时策略

Quy tắc di chuyển xác định cấu trúc của skill 包, nhưng không xác định một con đường cài đặt hoặc thứ tự ưu tiên chung.

Một hoạt động chung có thể sử dụng các phạm vi tác dụng sau:

| 作用域 (Scope) | 示例根目录 | 预期所有者 |
|---|---|---|
| Workspace (工作区) | `<repo>/.agents/skills/` | 项目维护者 |
| User (用户) | `<user-data>/skills/` | 单个开发者 |
| Administrator (管理员) | `<system>/skills/` | 机器或组织策略 |
| Plugin (插件) | 已签名的插件包 | 插件发布者与安装者 |
| Built-in (内置) | 运行时自带包 | 运行时提供商 |

截至 2026 年 8 月,Codex 文档规定项目级发现会从 `$CWD/.agents/skills`开始上升遍历祖先目录直至代码仓库根目录,外加、用户管理员和内置位置──它 hỗ trợ kỹ năng liên kết mã 目录──同名技能可能同时出现,而不是被合并──这些是Codex的具体行为,并非`SKILL.md`规范的强制要求; trong việc viết bộ dụng cụ, xin vui lòng xem [Codex skill 文档](https://learn.chatgpt.com/docs/build-skills)

绝不要凭空从目录名称推断优先级――应声明为明确策略并进行测试――本课实验为每课`Scope`Sử dụng các số nguyên tố rõ ràng ưu tiên (nhiệm vị số nguyên), đảm bảo các tập hợp ứng cử viên giống nhau luôn luôn phân tích kết quả giống nhau.

### 冲突 cần vượt quá `name`                                                                                                                                                                                                                                                              

两个都叫 两个都叫`release-readiness`Một có thể là lớp dự án phủ sóng (override workspace), một khác là người dùng mặc định định định cấu hình.

```json
{
  "name": "release-readiness",
  "description": "Inspect a release candidate for this repository.",
  "scope": "workspace",
  "source": "/repo/.agents/skills/release-readiness",
  "selected": true
}
```

常见冲突策略 bao gồm:

| 策略 | 优势 | 风险 |
|---|---|---|
| 保留所有候选包 | 不会隐藏任何内容 | 模型会看到歧义的名称 |
| 最高优先级作用域胜出 | 调用简单直接 | 本地包可能会遮蔽（shadow）受信任的包 |
| 拒绝重复项 | 无隐式遮蔽 | 合法的覆盖机制将失效 |
| 按来源限定名称（命名空间化） | 身份明确 | 面向用户的名称变长 |

Để tổ chức  chọn một chiến lược. Ngay cả khi một số gói ứng cử không xuất hiện trong danh sách mô hình, thông tin về gói ứng cử bị từ chối hoặc bị che giấu cũng nên được lưu giữ trong nhật ký chẩn đoán.

### 3 cấp độ

Kỹ năng đại lý quy định mô tả phân giai đoạn tải (loading) ⋅đầu trọng nằm ở mỗi cấp có mục đích khác nhau.

```figure
skill-disclosure-levels
```

#### Tiếp độ 1: 目录元数据 (Catalog Metadata)

Mô hình cần đủ thông tin để phân biệt kỹ năng này với kỹ năng lân cận. Quy định ước tính mỗi mục danh mục chiếm khoảng 100 token, nhưng thực tế là sự sắp xếp và token hóa.

Một mô tả hữu ích bao gồm hai câu:

```yaml
description: Validate a release candidate and produce a readiness report. Use when the user asks whether a version, tag, or package is ready to publish.
```

第一个子句说明能力 (capacity) ・ 第二个子句说明触发边界 (trigger boundary) ・ 第 25 课将使用正向试用例和近邻误触发试用例 (near-miss prompt) để đánh giá this boundary。

#### Tiếp độ 2: 激活指令 (Các hướng dẫn hoạt động)

                                                                                                                                                                                                                                                              `SKILL.md`保持在500 行内. Đây là một tín hiệu hướng dẫn thiết kế, chứ không phải là mục tiêu phải được hoàn thành.

正文应包含:

- 任务边界;
- 默认工作流;
- 分支条件;
- Chỉ dẫn trực tiếp các tài liệu cấp độ sâu hơn;
- 工具和脚本契约( hợp đồng);
- Hành vi cố障与停止;
- 预期输出及其验证方法──

Đừng chỉ để làm cho các tài liệu nhập trở nên ngắn gọn, hãy chuyển dòng công việc cốt lõi sang trung tâm tham chiếu.

#### Tiêu chuẩn 3: 支资源 (Tổ trợ tài nguyên)

Các tài sản là vật liệu có thể sao chép, lấp đầy hoặc chuyển thành vật liệu giao hàng cuối cùng, chứ không phải là chỉ thị chính nó.

| 目录 | 模型是否读取？ | 模型是否执行？ | 典型内容 |
|---|:---:|:---:|---|
| `references/` | 是，在需要时 | 否 | schemas、策略、领域指南 |
| `scripts/` | 可以视情况检视 | 通过被允许的工具 | 验证器、转换器、数据收集器 |
| `assets/` | 仅在有用时 | 否 | 模板、fixtures、图像、起始文件 |

Những danh mục này chỉ là một định nghĩa, không có khả năng phép thuật cố định.

### 面向分支的具体参考优于粗暴的专题倾倒

Để ghi vào các tài liệu nhập cảnh như hình ảnh quyết định:

```markdown
## Choose the path

- For a Python package, read `references/python-release.md`.
- For a container image, read `references/container-release.md`.
- For a documentation-only release, read `references/docs-release.md`.
- If the release combines artifact types, read only the guides for those artifacts.
```

Điều này cho mỗi tham chiếu một điều kiện tải có thể quan sát được.`references/`获取更多信息则没有这样的明确性──

保持引用图(chữ liệu tham chiếu) 平浅显──官方指南建议从 `SKILL.md`直接链接,避免深层调用链──单跳(one hop) làm cho khả năng đạt được dễ dàng để kiểm tra,并降低 yêu cầu 约束条件从未进入上下文的风险──

```figure
skill-reference-map
```

### Ngân sách hiện tại và hoạt động trên là hai loại ngân sách độc lập

设 $c_i$Vì kỹ năng$i$序列化后目录开销,$B_c$Đối với ngân sách,$b_j$Để kích hoạt hoạt hoạt động,$r_k$Để thực sự tải về tài nguyên

```text
catalog_cost = sum(c_i for every published skill)
active_cost = sum(b_j for every activated skill) + sum(r_k for every disclosed resource)
```

削减 một ngân sách không tự động giảm một ngân sách khác. 简短的描述可以节省目录空间,但活跃的900 行正文仍然可能会压任务上下文. 削减一个预算不会自动减少另一个预算.

Códex hiện tại trong trường hợp có quy mô lớn trên cửa sổ văn bản dưới được biết, sẽ kiểm soát ngân sách của danh sách kỹ năng ban đầu trong cửa sổ văn bản dưới 2% ⋅ 8.000 ký tự giới hạn chỉ trong cửa sổ văn bản dưới được biết; nó không phải là một cơ chế trở lại với 2% ⋅ quy tắc chồng lên.

### 资源路径 là tín ngưỡng

Một kỹ năng  chỉ nên có thể đọc các tài liệu trong gói bản thân 字面字符串前检查是远远不够:

```text
references/../../../../.ssh/config
references/external-link -> /private/company-secrets
```

Sử dụng hệ thống tài liệu ngữ nghĩa phân tích danh mục gốc và đường dẫn ứng cử viên, từ chối hoàn toàn các đường dẫn nhập, và kiểm tra xem các đường dẫn ứng cử viên sau khi phân tích có vẫn nằm dưới danh mục gốc sau khi phân tích không.

```figure
skill-resource-containment
```

路径限制并不能建立内容信任──一个有效的包内引用──仍然可能包含恶意指令──第 26 课将专门处理这一威胁──

### Chuyển quá trình phải có thể quan sát được

记录披露事件, đồng thời tránh ghi lại thông tin mật:

```json
{
  "event": "skill.resource.loaded",
  "skill": "release-readiness",
  "resource": "references/python-release.md",
  "reason": "candidate contains pyproject.toml",
  "bytes": 2840
}
```

`reason`字段 sẽ được chuyển đổi thành chứng cứ kiểm tra có sẵn. Nó cũng giúp xác định những chỉ thị xấu dẫn đến việc người đại diện  bảo vệ mọi người và tải tất cả các tài liệu.

##  xây dựng nó

`code/main.py` xây dựng một công cụ phát hiện và công bố xác định

发现模块的接口包括:

- `Scope`: dùng cho nguồn và các dữ liệu ưu tiên;
- `SkillCandidate`:表示未校验的文件系统候选包;
- `discover_scope(scope)`: 枚举直接下层的技能 目录;
- `resolve_collisions(candidates, precedence)`: ứng dụng tuyên bố chiến lược xung đột;
- `CatalogEntry`Với`build_catalog(...)`: phát hành có giới hạn dữ liệu;
- `CatalogBudget`: tính toán hạt nhân quy trình mục đích chiếm không gian, tránh giả định số chữ số bằng với mã thông thường số.

披露模块的接口包括:

- `load_skill_body(entry, ...)`: dùng cho Lớp 2 của hoạt động tải;
- `validate_reference(skill_dir, reference)`: dùng để kiểm tra giới hạn đường;
- `load_reference(...)`: dùng cho có giới hạn cấp 3 读取。

运行实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Các lệnh cần bản địa git clone 环境, và có thể phân tích các danh mục làm việc tùy ý trong clone  trong nhà kho root.

Chương trình sẽ tạo ra các lĩnh vực dự án tạm thời và phạm vi người dùng, đưa ra xung đột, xây dựng danh mục trong ngân sách rất nhỏ được thiết lập cố ý, kích hoạt một kỹ năng, và phân biệt cố gắng tham khảo pháp lý  đọc và danh mục xuyên suốt trốn thoát.

### Tại sao tìm thấy là tầng thấp

`discover_scope`仅检查直接子目录下 `SKILL.md`Nó sẽ không trở lại với mỗi bộ `SKILL.md`视为独立包──这保护包边界, tránh bất ngờ phát hành kỹ năng đã được cài đặt 内部的示例或测试装置──

### Tại sao các thí nghiệm không giải quyết YAML tùy ý

实验仅支持其目录所需标量前材料――生产运行时应使用安全的YAML 解析器,配备显式 schema、大小限制,并禁用自定义对象构建――仅使用标准库(Stdlib-only) là một tập lệnh, chứ không phải là một lời giải thích của ngôn ngữ YAML không hoàn chỉnh――

## Sử dụng nó

Để kiểm tra danh sách này được ứng dụng cho bất kỳ thiết bị thích ứng nào:

1. 列出 mỗi phân loại danh sách gốc và người có quyền viết vào 
2. 明确说明是否允许符号链接包──
3. 校验包名、目录名、必需元数据和入口正文大小。
4. Trong nội bộ danh tính nhận dạng trong lưu giữ nguồn gốc (source)
5. 声明并测试同名重复行为。
6. 精确测量发送给模型的序列化目录大小──
7. 记录加载某正文或资源的原因──
8. sẽ được đọc tài nguyên được giới hạn nghiêm ngặt trong danh sách rễ sau phân tích.
9. Khi có tài liệu bị mất tích, báo cáo đã thất bại.
10. Khi tình trạng cài đặt hoặc chiến lược xảy ra thay đổi thì xây dựng lại danh mục.

## 交付 nó

本课产出发 `skill-catalog-builder`组件包── nó theo thứ tự được xác định rõ ràng quét danh mục gốc, từ chối các tài liệu nhập nhập và tên-thư liệu không phù hợp của các liên kết ký hiệu, giải quyết xung đột trong các lĩnh vực đóng vai trò, từ chối các bài lặp lại cùng ưu tiên, và đưa vào số lượng, mô tả và trình tự của các mục trong tuyên bố.

Bản báo cáo JSON của nó chứa các mục được chọn, gói ứng cử bị che phủ, mục bị bỏ qua, lỗi kiểm tra, ưu tiên và sử dụng ngân sách.

## 练习

1. Thêm một plugin 作用域, đặt ưu tiên của nó giữa người dùng và tích hợp ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                                                                                         
2. Để biến chiến lược xung đột từ  ưu tiên cao nhất    改 thành  giới hạn名称 (                                                                                                                                                                                                                                                 
3. Vì vậy`load_reference`添加字节大小限制──测试一个恰好等于限制文件和一个超出一字节的文件──
4.  biên tập hai nghe giống như mô tả gần như giống nhau  tái viết chúng, làm cho các biên giới cảm ứng của chúng không chồng lên nhau 
5. Thêm một chứa mỗi tham chiếu và kịch bản 哈希值的表.
6. Để thể hiện điểm tích hợp, phân biệt báo cáo Lớp 1、Lớp 2 và Lớp 3

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| Skill 发现 (Skill discovery) | “找到所有 SKILL.md” | 搜索配置的作用域，校验包，附加来源溯源信息，并应用策略 |
| Skill 目录 (Skill catalog) | “已安装 skills 列表” | 面向合格包的、模型可见的紧凑路由元数据 |
| 冲突策略 (Collision policy) | “哪个重复项胜出” | 针对来自不同来源的同名候选包所声明的处理规则 |
| 渐进式披露 (Progressive disclosure) | “懒加载” | 从目录到正文再到特定分支资源的分阶段上下文引入 |
| 引用图 (Reference graph) | “skill 链接的文件” | 可达的资源结构及其加载条件 |
| 路径限制 (Path containment) | “留在文件夹内” | 验证解析后的资源目标路径始终位于解析后的包根目录下 |

## 延伸阅读

- [Agent Skills 规范](https://agentskills.io/specification): hiểu cấu trúc bao gồm và trình bày cấp độ tiến bộ
- [优化 skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions): hiểu cách viết danh mục từ các dữ liệu.
- [Agent Skills 最佳实践](https://agentskills.io/skill-creation/best-practices): hiểu trực tiếp trích dẫn và nhập khẩu文件大小控制。
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills): hiểu được phạm vi và giới hạn danh mục phát hiện hiện ra của Codex hiện tại
