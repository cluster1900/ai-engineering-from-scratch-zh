# Kỹ năng đại lý: có thể chuyển giao giao dịch với vận hành

> Kỹ năng không chỉ là một sự thay đổi tên tập tin tốt hơn. Nó là một gói chương trình có thể tìm thấy của các chỉ dẫn, tài nguyên và các công cụ hỗ trợ có thể thực hiện, theo các hoạt động rõ ràng khi hợp đồng được tải vào đại lý.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 01 (The Tool Interface), Phase 13 · 05 (Tool Schema Design)
**Time:** ~90 minutes

## Học mục tiêu

- 明确定义 Agent Skill,不将其与 prompt、代码库规范文件(repository instructions) 、工具、hook、subbagent 或插件 混──
- 研读可移植的 `SKILL.md`契约,并将其与特定运行时的专专有扩展清晰解──
- 将服务发现 (Phát hiện) 选择 (Phát chọn) 激活 (Tăng động) 资源加载 (Tăng tải) 工具调用 (Tùng dụng cụ) 验证 (Verification) 阐释为独立的生命周期阶段――
- Trong quá trình vận hành sẽ được kỹ năng đưa vào danh sách kỹ năng của đại lý, thực hiện kiểm tra tĩnh nghiêm ngặt đối với gói phần mềm của mình.
- 针对具体工程任务, trong kỹ năng m mcm tool hook subagent hoặc普通代码, thực hiện các loại kỹ thuật hợp lý

## 10 phút rất nhanh

Trước khi đọc sâu hơn, hãy hoàn thành hoạt động này. Bạn sẽ tự tạo ra một kỹ năng nhỏ, sẽ cài đặt bộ kiểm tra viên đầy đủ vào môi trường của người dùng thực sự, điều chỉnh nó, xác minh kết quả, và sẽ gỡ bỏ nó. Điều này sẽ giúp bạn trải qua kết quả quan sát được chứng minh trong suốt vòng đời.

### Thực sự chủ nhà thực nghiệm trước đặt kiểm tra

Các điểm kiểm tra chủ nhà thực sự cần Node.js,`npx`、Python 3、 một môi trường chủ sở hữu hỗ trợ kỹ năng, cũng như quyền đăng nhập cho các dự án hoặc phạm vi vai trò người dùng bạn chọn trong thiết lập.

```bash
node --version
npx --version
python3 --version
```

Trước khi cài đặt, trước tiên xác định chủ sở hữu và phạm vi cài đặt bạn muốn sử dụng. Nếu thiếu bất kỳ sự phụ thuộc nào trên, bạn có thể đọc bài học trên trang web, hoặc trực tiếp thực hiện các bài tập bằng phần mềm bên dưới.

### 1. Từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ

Trong bất kỳ sử dụng để lưu trữ các dự án học tập

```bash
mkdir -p agent-skills-first-run
cd agent-skills-first-run
TARGET_ROOT="$(pwd -P)"
printf 'TARGET_ROOT=%s\n' "$TARGET_ROOT"
ls -A
```

Một lệnh cuối cùng không nên có bất kỳ xuất khẩu nào. Nếu có xuất khẩu, xin thay đổi một danh mục trống, để cuộc kiểm tra này có một ranh giới rõ ràng.

Để có kỹ năng đầu tiên của bạn  tạo danh mục:

```bash
mkdir -p my-first-skill
```

创建 `my-first-skill/SKILL.md`, nội dung như sau:

```markdown
---
name: my-first-skill
description: Turn rough meeting notes into a compact decision record when the user asks to capture a technical decision.
---

# Decision record

Extract the decision, context, alternatives, owner, and next review date.
If the notes do not contain a decision, ask one clarifying question instead
of inventing one.
```

验证文件是否已成功创建目标目录:

```bash
test -f my-first-skill/SKILL.md
```

无任何输出和退出码为 0 表示文件已存在──

### 2. Ứng dụng kiểm tra

 giữ ở `agent-skills-first-run`目录下并运行:

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-contract-reviewer --full-depth
```

选择您当前正在使用的代理 宿主和作用域──安装器会列出 `skill-contract-reviewer` và vị trí mục tiêu của nó.`--full-depth`Các tham số, vì kỹ năng cung cấp trong bài học này là một bao gồm tham chiếu, kịch bản và các tài sản tĩnh.

sẽ`SKILL_ROOT`设置 cho bộ cài đặt  báo cáo 绝对路径.`SKILL.md`Đăng ký, thay vì danh mục nguồn của khóa học, cũng không là hiện tại:

```bash
# 将占位符替换为安装器打印出的绝对路径
SKILL_ROOT="$(cd "/absolute/path/to/skill-contract-reviewer" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\n' "$SKILL_ROOT"
```

Nếu cuộc họp chủ nhân đã mở trước đó, vui lòng bắt đầu cuộc họp mới hoặc sử dụng kỹ năng của chủ nhân này để làm lại lệnh quét lại. Đừng giả định mỗi chủ nhà sẽ tải lại danh sách kỹ năng.

### 3. 显然调用 nó

Trong một đại lý đã được lắp đặt,`agent-skills-first-run`Để làm việc, sử dụng ngôn ngữ hiển thị của chủ nhà:

| 宿主 | 显式调用方式 |
|---|---|
| Codex | 输入 `skill-contract-reviewer`，或从 `/skills` 菜单中选择，然后提交审查请求 |
| Claude Code | 输入 `/skill-contract-reviewer` 紧跟审查请求 |
| 通用可移植回退 | `Use skill-contract-reviewer to review the target package.` |

Trong yêu cầu sử dụng `SKILL_ROOT`和 `TARGET_ROOT`绝对路径── yêu cầu chủ nhà mở và hiển thị lệnh hoàn toàn phân tích sau khi thực hiện, thay vì phụ thuộc vào lệnh mơ hồ của danh mục công việc hiện tại:

```text
Use skill-contract-reviewer to review <TARGET_ROOT>/my-first-skill. The installed bundle root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/check_skill.py <TARGET_ROOT>/my-first-skill. Before running it, show the fully resolved argv. Return the validation report, selected primitives, and one sentence for each selection. Include the resolved script path, resolved target path, cwd, argv, and exit code as execution evidence.
```

解析后的命令应呈现如下结构,不留任何未填充的占位符:

```bash
python3 "/absolute/install/path/skill-contract-reviewer/scripts/check_skill.py" \
  "/absolute/workspace/path/agent-skills-first-run/my-first-skill"
```

Kết quả kiểm tra thành công nên đáp ứng cùng lúc ba đặc điểm sau:

1. 宿主能按名称准确找到 `skill-contract-reviewer`
2. 审查器成功读取程序包契约并运行其附带的验证脚本──
3. Phản ứng trả lời bao gồm một báo cáo xác minh (ví dụ bao gồm không có sai sót cấu trúc) và đưa ra các đề xuất về các thành phần cơ bản có lý do.

Trong chứng chỉ thực hiện cũng phải xác định rõ ràng các đường lối văn bản, đường lối mục tiêu, danh sách công việc hiện tại, và một báo cáo thiếu các đoạn văn này không thể chứng minh rằng văn bản phụ trợ đã thực sự được thực hiện.

Nếu chủ nhà báo cáo kỹ năng này không cần thiết, hãy kiểm tra đường hướng mục tiêu cài đặt, quét lại hoặc khởi động lại một lần nữa chủ nhà, sau đó thử lại yêu cầu rõ ràng. Đừng để che giấu sự thất bại cài đặt và tự động thay đổi mô tả kỹ năng.

### 4. 探查隐式选择(Phác chọn ngầm)

 mở một đại lý mới quay, nhập cùng nhiệm vụ nhưng**不提及**Tên của kỹ năng:

```text
Review <TARGET_ROOT>/my-first-skill as a reusable agent package and tell me whether its package contract is valid.
```

Nếu chủ nhà cho người dùng hiển thị các kỹ năng được chọn, ghi lại xem nó đã được chọn tự động hay không.`skill-contract-reviewer`Nếu chủ nhà không tiết lộ chi tiết của quyết định, thì sẽ được ký tên chọn ẩn cho chưa được chứng minh.

### 5. Cải thiện môi trường

仅移除已安装的审查器程序包:

```bash
npx skills remove skill-contract-reviewer
```

选择与安装相同的主机和作用域── 在重新扫描或新建会话后,显然请求`skill-contract-reviewer` phải trở lại kỹ năng này không cần thiết.`my-first-skill` để sử dụng các khóa học tiếp theo, cũng có thể hoàn thành việc học theo hướng này và xóa hoàn toàn danh sách thí nghiệm.

## 问题

假设 nhóm của bạn có một bộ công việc trên mạng rất đáng tin cậy: tìm ra những thay đổi đã được kết hợp; kiểm tra các thông tin di chuyển cơ sở dữ liệu; cập nhật nhật nhật ký thay đổi; thực hiện lệnh đóng gói; và xuất ra các đơn kiểm tra trên mạng.

Nếu đưa bộ này dòng làm việc trực tiếp vào một thư mục dài, mặc dù dễ dàng sao chép dán, nhưng trong vận hành kỹ thuật phát hiện ra lỗ hổng: thư mục này thiếu xác định danh tính ổn định, không có quy tắc phát hiện dịch vụ, thiếu nguồn lực tải biên giới, không có cấu trúc gói kiểm tra, và không thể trả lời một loạt các câu hỏi về cơ bản kỹ thuật: ai có quyền điều chỉnh nó? mô hình nên được chọn vào lúc nào? nó có thể thực hiện các script nào? các tài liệu nào đáng tin cậy? khi văn bản trên bị nén, các quy tắc cốt lõi nào có thể tồn tại?

Trái ngược với lỗi cực đoan, là đưa tất cả các chỉ dẫn có thể lặp lại vào một bộ não làm thành một kỹ năng.`SKILL.md`, danh mục được tạo ra dường như có cấu trúc chung, thực tế là sâu sắc ràng buộc hành vi không công khai của một chủ sở hữu cụ thể.

Nhiệm vụ hàng đầu của công nghệ phần mềm là**分类**Trước khi quyết định cách đặt một cấu trúc, hãy nghĩ trước để biết cấu trúc này thực sự là gì.

## 概念

### Kỹ năng 封装过程性知识 (Khả năng xử lý)

Cảnh sát Kỹ năng là một trong những người`SKILL.md`Đối với các tài liệu nhập khẩu, các tài liệu nhập khẩu này có chứa các nguyên nhân của YAML, dữ liệu nguyên nhân, và các tài liệu nhập khẩu khác.

```figure
skill-package-anatomy
```

Cái này**目录**Bản thân chứ không phải đơn giản đơn lẻ Markdown 文件 chỉ là đơn vị nhỏ nhất đối với việc triển khai ngoại giao  Nếu chỉ sao chép`SKILL.md`Nhưng bỏ qua tài liệu tài nguyên trích dẫn, ngay cả khi nguyên tắc ngôn ngữ của nó hoàn toàn đúng, đó cũng là một phần mềm bị hư hỏng.

### 临近概念辨析

| 构件类型 | 核心职责 | 何时加载或运行 | 不应被冒充为 |
|---|---|---|---|
| Prompt | 塑造单次模型交互 | 由应用或用户内联引入 | 包含丰富资源的带版本软件包 |
| 代码库规范（Repository instructions） | 阐明某特定代码库的固有通用准则 | 编码运行时进入该作用域时载入 | 可复用的具体任务工作流 |
| Agent Skill | 提供可复用的过程性知识 | 显式或隐式激活时载入 | 强安全隔离边界 |
| MCP Tool | 暴露类型化的远程能力 | 由模型或应用程序主动发起调用时 | 复杂详细的端到端操作步骤 |
| Hook（钩子） | 在特定事件发生时执行确定性逻辑 | 当所声明的事件发生时触发 | 具有概率性的模型自主路由 |
| Subagent（子代理） | 委托具有独立上下文和状态的任务 | 由编排器创建或调用时启动 | 静态的只读指令包 |
| Plugin（插件） | 分发更大规模的运行时功能扩展 | 宿主安装或启用它时生效 | 可移植的 skill 契约本身 |
| 习得的 Skill 库（Learned skill library） | 存储通过实践探索习得的行为沉淀 | 策略检索到先验程序或轨迹时 | 基于规范标准的 `SKILL.md` 软件包 |

发布技能 可以指导代理 如何审查发布;;MCP server 可以暴露发布注册中心;;Hook 可以禁止向主分支直接推代码;;Subagent 可以独立审查候选版本;;

### Skill 一词指向的两种不同的理念

Trong lĩnh vực nghiên cứu khoa học, kỹ năng có khi chỉ định các mã chương trình đã học được, đường mòn giao tiếp thành công, hoặc các đoạn chiến lược nhắm vào môi trường cụ thể.

Kỹ năng đại lý trong loạt các khóa học này là rất khác nhau. Nó là một gói phần mềm được viết hoặc chọn tay, có tuyên bố rõ ràng về các hệ thống tài liệu, tài liệu, tài liệu, dữ liệu, kỹ năng, và các cơ chế điều chỉnh được điều hành bởi các nhà máy.

| 评估维度 | Agent Skill 软件包 | 习得的 Skill 库 |
|---|---|---|
| 基本单元 | 包含 `SKILL.md` 的目录 | 程序代码、策略片段、交互轨迹或记忆记录 |
| 创建方式 | 人工编写、生成或精选策划 | 通常由 agent 在环境交互中自主探索习得 |
| 选用机制 | 依赖目录描述（Description）加运行时策略 | 基于任务状态的向量检索或策略匹配 |
| 执行方式 | 模型遵循 Markdown 指令并调用宿主工具 | 环境直接执行存储的行为逻辑或代码产物 |
| 可移植性 | 程序包契约可在所有兼容的宿主间流通 | 通常与特定环境及特定的动作空间深度绑定 |
| 评测标准 | 路由准确率、制品质量、安全及宿主兼容性 | 强化学习奖励值、任务成功率、泛化能力及库规模 |

Hai ý tưởng này đều có khả năng được tái sử dụng, nhưng không chỉ vì chúng cùng tên là kết hợp với nhau để thực hiện các dự án.

### Quy định cơ bản của

Các kỹ năng của đại lý 规范在前面中强制要求两个必填字段:

```yaml
---
name: release-readiness
description: Inspect a release candidate when the user asks whether a version is ready to publish.
---
```

`name`là một biểu tượng cố định, phải tuân thủ quy định đặt tên, và phải phù hợp hoàn toàn với danh mục phụ trách.`description`Nó là tài liệu cho con người, cũng như mô hình để thực hiện các đường dẫn ngôn ngữ.**能做什么**Và**何时应当选用它**

核心规范允许的可选字段包括:

| 字段 | 用途 | 可移植性说明 |
|---|---|---|
| `license` | 声明该程序包的开源或商用许可条款 | 核心标准规范 |
| `compatibility` | 声明环境要求（如 Python 3.10+、特定 CLI 工具等） | 核心标准规范 |
| `metadata` | 携带字符串键值的自定义扩展数据 | 核心标准规范 |
| `allowed-tools` | 建议预先批准的工具列表 | 实验性特性；不同宿主支持度不一 |

Markdown chính thức mang theo hướng dẫn hoạt động. Nó nên xác định rõ ràng dòng công việc, các quyết định quan trọng, các chiến lược xử lý thất bại bất thường, cũng như hướng đến các đường tương đối của các tài liệu tài nguyên hỗ trợ.

```markdown
# Release readiness

Use this workflow for a release candidate, not for ordinary development builds.

1. Read `references/release-policy.md`.
2. Run `python3 scripts/inspect_release.py --format json`.
3. Stop if the report contains a blocking failure.
4. Produce the checklist from `assets/release-checklist.md`.
5. Ask for approval before any publish or tag action.
```

### 运行时扩展(Runtime Extensions) là tầng thứ hai

部分主机允许在前材料中写额外字段或关联特定配置文件──这些字段在特定平台上非常有用,但它们不属于通用可移植标准──

| 行为特性 | 宿主扩展示例 | 属于通用核心规范？ |
|---|---|:---:|
| 对模型自主路由隐藏，但保留用户手动直接调用 | `disable-model-invocation` | 否 |
| 对用户的命令菜单隐藏，但允许模型自主路由选用 | `user-invocable` | 否 |
| 在斜杠命令菜单中展示参数使用提示 | `argument-hint` | 否 |
| 在被委托的隔离子上下文中运行该 skill | `context`, `agent` | 否 |
| 固定模型型号或思考计算等级（Reasoning Effort） | `model`, `effort` | 否 |
| 注册生命周期自动化钩子 | `hooks` | 否 |
| 在 Codex 中禁用隐式调用 | `agents/openai.yaml` 策略 | 否 |

应将每项专利扩展视为外接适配器―― đảm bảo ngay cả khi loại bỏ các đoạn này, dòng công việc cốt lõi vẫn có thể hợp pháp; viết xuống cấp trở lại tài liệu cho chúng, và thực sự tiêu thụ chúng trên chủ nhà để hoàn thành các thử nghiệm nhắm mục tiêu―― không biết các đoạn quyền có thể được bỏ qua trực tiếp khi được vận hành, báo cáo sai lầm từ chối, hoặc chỉ được giữ nguyên và không thực hiện bất kỳ hành động thực tế nào――

### Phụ liệu trước là dữ liệu có thể thực hiện

Trước khi các dữ liệu được mô hình đọc, đã thay đổi hành vi hoạt động của hệ thống:

- 格式错误的 `name`Sẽ dẫn đến sự thất bại của dịch vụ.
- 含糊不清的 `description`Sẽ dẫn đến sai lầm trong đường lối.
- Chỉ có chỉ huy nhân tạo sẽ loại bỏ kỹ năng này hoàn toàn khỏi danh sách kỹ năng có thể sử dụng của mô hình.
- 工具预授权配置会改变宿主是否弹出用户授权确认框──
- 上下文 ủy ban thiết lập cuộc họp sẽ tiếp tục thực hiện định hướng lại cho các chi nhánh độc lập 会话中。

 phải xem xét các tài liệu cấu hình và mã kinh doanh nghiêm ngặt như xem xét mặt đối tượng.

### Chu kỳ đời của kỹ năng

```figure
skill-runtime-lifecycle
```

Mỗi mũi tên trong bức tranh đại diện cho một khuôn mẫu thất bại độc lập:

1. **服务发现（Discovery）：**Trong các đường dẫn thư mục được sắp xếp trước, có thể tìm thấy các gói trình.
2. **静态校验（Validation）：**Trước khi bị lộ vào danh mục, quyết định chặn các chương trình có hình thức sai hoặc không an toàn.
3. **编目索引（Cataloging）：**Chỉ hướng tới mô hình trên dưới đây`name`Với`description`,绝不提前全量加载──
4. **决策选择（Selection）：**Bằng mô hình hoặc chỉ thị rõ ràng xác định kỹ năng có liên quan đến nhiệm vụ hiện tại hay không.
5. **按需激活（Activation）：**sẽ`SKILL.md`正文全量载入模型可见的上下文中.
6. **渐进披露（Disclosure）：**Chỉ cần đọc các tài sản hoặc tài sản khi thực sự cần thiết.
7. **执行推进（Execution）：**Trong kiểm tra quyền hạn của chủ nhà và quy tắc phân lập hộp, sử dụng các loại công cụ chủ nhà.
8. **结果核验（Verification）：**独立于模型的自述表态,客观核验最终产品质量──

混这些阶段会导致错误的思维模型: được phát hiện kỹ năng không bằng được kích hoạt; được kích hoạt kỹ năng không bằng được tất cả quyền hoạt động mà nó mô tả; đơn giản công cụ được sử dụng được cho phép không bằng kết quả kinh doanh cuối cùng được sản xuất là chính xác.

### Kỹ năng và Công cụ 正交互补

MCP giải quyết là: ứng dụng hiện tại có thể điều chỉnh những khả năng bên ngoài, Schema số của chúng là gì?

```figure
skill-tool-orthogonality
```

Trong văn bản kỹ năng có thể đề cập đến tên của một công cụ, nhưng quyền đăng ký và sử dụng thực tế của công cụ hoàn toàn thuộc về chủ sở hữu khi sử dụng. Nếu không có công cụ trong môi trường sử dụng, kỹ năng nên đưa ra một thông báo giảm rõ ràng hoặc một thông báo rõ ràng trực tiếp, không thể nhầm nghĩ rằng trong văn bản đề cập đến một khả năng nào đó sẽ tạo ra công cụ không có gì.

### Kỹ năng và codebook说明 (khóa học) thuộc các lĩnh vực khác nhau.

代码库说明文件(如 `AGENTS.md`) để mô tả bạn**当前所处**Các kỹ năng được cung cấp là một quy trình điều hành tiêu chuẩn hóa của một loại nhiệm vụ được sử dụng thông thường trên nhiều bộ thư viện mã khác nhau.

Khi cả hai được áp dụng cùng lúc, các lệnh tức thời của người dùng và các quy tắc hiện tại của thư viện mã có ưu tiên cao hơn, và tạo ra một ràng buộc đối với kỹ năng. Ví dụ, một kỹ năng xây dựng lại phổ biến không thể vượt qua các quy tắc của thư viện mã địa phương.

### Kỹ năng 之间不进行代码级 Import

Một kỹ năng có thể được sử dụng trong văn bản chính thức để hướng dẫn một kỹ năng khác, nhưng đây không phải là mã ở cấp độ ngôn ngữ lập trình.`import` Kỹ năng thứ hai được sử dụng vẫn phải được phát hiện trong suốt quá trình hoạt động của dịch vụ, tham gia kiểm tra đủ điều kiện, hoạt động, kiểm tra quyền hạn và quản lý văn bản độc lập.

Trong việc viết qua kỹ năng phụ thuộc, nên được mô tả như các bước của quy trình làm việc có thể quan sát được:

```markdown
After producing the candidate changelog, invoke the `release-risk-review` skill.
Pass the candidate path and require a blocking or non-blocking verdict.
If that skill is unavailable, stop and report the missing dependency.
```

Cách diễn tả này cho phép các mối quan hệ phụ thuộc được kiểm tra rõ ràng, và cho phép chủ nhà thực hiện các chiến lược quy định khi hoạt động.

## 动手构建

`code/main.py`Thực hiện một bộ xác minh tiêu chuẩn và bộ phận lựa chọn kiểu máy nhẹ.

验证器对外暴露:

- `parse_frontmatter(text)`Đánh giá:
- `validate_skill_text(text, directory_name, allowed_runtime_extensions=())`: nghiêm严校验必填字段、命名约束、未声明扩展、正文存在性以及可移植长度限制──
- `ValidationIssue`Với`SkillReport`: trở lại chứng minh kiểm toán hoàn chỉnh về cấu trúc, chứ không phải là một giá trị không minh bạch đơn lẻ.
- `FrontmatterSyntaxError`: đối với các ngôn ngữ bất hợp pháp không thể giải quyết an toàn

选型器对外曝光 `TaskShape`Với`select_primitives(task)` Nó dựa trên đặc điểm thực tế của nhiệm vụ, sẽ được chính xác lập trình cho các công cụ thông thường, tài năng, hook, subagent hoặc MCP.

运行实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/22-skills-and-agent-sdks
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Các lệnh khối cần bản địa git clone  môi trường, và có thể khởi động từ bất kỳ danh mục trong kho đó, để `git rev-parse --show-toplevel`解析代码库根路径──

运输见见 JSON 格式打印一个合规的纯可移植技能"",一个包含主机扩展技能"",一个非法程序包"",以及多任务特征的选项决策结果――仔细观察输出问题代码――一个优秀的软件包验证器应明确指出如何修改产品,而不是替代作者胡乱猜――

### 验证顺序至关重要

Trước khi thực hiện các quy tắc nội dung cấp độ sâu, cần phải kiểm tra trước các đặc điểm cấu trúc thấp hơn:

```figure
skill-validation-order
```

Theo quy trình nghiêm ngặt này, có thể ngăn chặn hiệu quả các lỗi ẩn chứa hệ thống cấp thứ hai đã bị phá hủy ban đầu.

## Sử dụng nó

Trước khi viết một kỹ năng mới, xin hãy thực sự điền vào thẻ quyết định này:

| 决策问题 | 若答案为“是” | 最匹配的基本构件 |
|---|---|---|
| 该任务是否需要在多个步骤中反复运用模型的主观判断？ | 操作流程基本固定，但具体决策千变万化 | Skill |
| 该操作是否必须在特定事件发生时 100% 强制触发？ | 哪怕遗漏一次执行也是完全不可接受的故障 | Hook 或常规业务代码 |
| 模型是否需要调用具有类型化输入的外部能力？ | 该操作本身存在于模型的思维上下文之外 | Tool 或 MCP Server |
| 该工作是否需要完全隔离的上下文、独立状态或责任归属？ | 由独立的执行单元完成工作并仅返回受限结果 | Subagent |
| 该指南是否仅适用于当前这一个特定的代码库？ | 描述的是本地开发命令、目录规范与约束边界 | 代码库说明（如 AGENTS.md） |
| 单次简短的即时交互是否就足以解决问题？ | 无需任何版本化和包生命周期的管理维护 | Prompt |

Nhiều dòng công việc cấp sản xuất phức tạp thường là một bộ phận của nhiều thành phần.

## 交付 nó

本课在 `outputs/`Đăng ký hoàn chỉnh rồi.`skill-contract-reviewer`程序包── nó bao gồm:

- Một phần có thể được chuyển`SKILL.md`, để kiểm tra các kỹ năng được đánh giá;
- 针对可移植标准与基本构件选型的参考核对清单(Tài chiếu);
- Một xác định tự động hóa kiểm chứng kịch bản (Scripts);
- 覆盖 prompt、技能、工具、hook、普通代码与 subagent 的全量任务特征测试具(Assets)

Lắp đặt toàn bộ bộ, không chỉ là các tài liệu nhập khẩu:

```bash
cd "$(git rev-parse --show-toplevel)"
python3 scripts/install_skills.py /tmp/aiefs-skills --phase 13 --type skill
```

 Khóa học cài đặt kịch bản sẽ xuất bản bản mỗi kỹ năng giai đoạn 13,并 tạo ra `/tmp/aiefs-skills/manifest.json`                                                                                                                                                                                                                                                              

Các bài học tiếp theo sẽ dần dần sâu sắc hơn từng giai đoạn của chu kỳ đời sống: 24 bài học Khám phá dịch vụ và tiết lộ tiến bộ; 25 bài học Thấu hiểu về các chiến lược và cách thức ngữ nghĩa; 26 bài học Cung cấp giải quyết quyền kiểm soát và phân lập hộp; 27 bài học sẽ tạo ra toàn bộ quy trình thông qua các sản phẩm phát hành được đánh giá Eval nghiêm ngặt.

## 课后深练习

1. Sử dụng `TaskShape`Để thực hiện các phân loại cấu trúc cho 5 dòng nghiên cứu và phát triển thực tế hàng ngày của nhóm của bạn.
2. 编写边界测试用例: chứng minh刚好 500 个字符的 `compatibility`字段能顺利通过, còn 501 字符的值将被视为超越规范标准的误准拦截.
3. Trong danh sách trắng, một phần mới được phát hành trong một chương trình mở rộng.
4. Một bộ phận dài tới 400 đường được xây dựng lại nhanh chóng`SKILL.md`、 một tài liệu tham khảo chuyên dụng (Reference) 、 một văn bản giao dịch, cũng như một mô hình sản phẩm xuất khẩu.
5. Để một số trích dẫn không thể sử dụng trong môi trường hiện tại của MCP Tool Skill 设计降级报错响应──坚决不允许暗中将其替代为权限更广泛的其它工具──
6. 审查 một kỹ năng hiện có, sẽ đánh dấu từng câu trong đó: ý định đường bộ, quy định hoạt động, chiến lược an toàn, chỉ số thông tin tham khảo hoặc giao thức xuất khẩu.

## 关键术语

| 术语 | 通俗说法 | 精确工程含义 |
|---|---|---|
| Agent Skill | "保存好的 Prompt 模板" | 包含过程性操作指南与可选资源的标准化、可发现文件目录 |
| 可移植核心（Portable Core） | "所有运行时共享的通用字段" | 由 Agent Skills 官方规范所定义的基础契约标准 |
| 运行时扩展（Runtime Extension） | "额外的 Frontmatter 字段" | 平台特定的专有配置，其行为生效需要对应宿主适配器的支持 |
| 激活（Activation） | "Skill 跑起来了" | Skill 的正文指令被完整载入模型可见的上下文，后续执行可能滞后发生 |
| Skill 依赖（Skill Dependency） | "Import 另一个 Skill" | 由运行时负责调度的调用关联步骤，受到环境可用性与权限策略的严密审查 |
| Tool 契约（Tool Contract） | "函数 Schema 声明" | 为某项外部能力所定义的输入、输出、权限、副作用、错误码以及审计证据规范 |

## 延伸阅读

- [Agent Skills 规范官方文档](https://agentskills.io/specification)- 权威的可移植目录与前目 契约标准──
- [Agent Skills 最佳实践指南](https://agentskills.io/skill-creation/best-practices)- 作用域界定、指令撰写及资源编排的最佳范式──
- [OpenAI: 构建 Skills 开发者指南](https://learn.chatgpt.com/docs/build-skills)- hiểu sâu hơn về các hoạt động và hoạt động dịch vụ trong môi trường của Codex.
- [Claude Code Skills 文档](https://code.claude.com/docs/en/skills)- bao gồm cơ chế điều chỉnh nền tảng, các tham số gợi ý, công cụ dự án ủy quyền và các tài liệu tiếp theo để mở rộng các tài liệu tiếp theo.
