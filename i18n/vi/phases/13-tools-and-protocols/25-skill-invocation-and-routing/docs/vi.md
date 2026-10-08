# Kỹ năng 调用与路由

> 调用(Invocation) là một quá trình của các quyết định liên quan trước quyền hạn sau khi quyết định.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 24 (Skill Discovery and Progressive Disclosure)
**Time:** ~105 minutes

## Học mục tiêu

- 区分显式用户调用 (tự động gọi người dùng) 隐式模型调用 (tự động gọi mô hình) 应用程序调用 (tự động gọi ứng dụng)
- Để tạo ra một phương pháp độc lập, bạn cần phải có thể xem xét kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật kỹ thuật
- 编写包含正向触发条件和近邻误触发边界 (các biên giới gần)
- Trong các bài kiểm tra, bạn có thể chọn một số loại hình:
- 适应特定运行时调用字段, đồng thời tránh việc sử dụng chúng như một vật liệu có thể được chuyển giao 规范字段

## 问题

Anh đã cài một cái.`database-migration`Skill── người dùng có thể sử dụng nó thông qua tên gọi, nhưng mô hình cũng sẽ thấy mô tả của nó, và một người hỏi các câu hỏi cơ sở dữ liệu thông thường khi chọn nó── sau đó, kỹ năng này  đề xuất các đề xuất về các quy trình thay đổi 

Anh đã thêm vào`user-invocable: false`, hy vọng ngăn chặn người dùng tự động chạy nó. Nhưng trong một lần khác, đoạn này đã được bỏ qua trực tiếp. Bạn đã thêm `disable-model-invocation: true`, mong đợi kỹ năng này  hoàn toàn biến mất. Nhưng trong khi hiểu được các phần này hoạt động, người dùng vẫn có thể rõ ràng điều chỉnh nó.

字段名称本身没有错. 错在概念模型──用户可以看到它、模型可以选择它、应用程序可以预装它以及其内部工具可以执行是完全独立的事实──一个名字.`invocable`Một giá trị đơn giản không thể thể hiện được những kích thước phức tạp này.

路由 còn có mô hình thất bại thứ hai. Nếu mô tả quá mờ, nhiều kỹ năng sẽ xuất hiện giống như là có và không. Nếu mô tả tích lũy rất nhiều từ khóa, các nhiệm vụ không liên quan cũng sẽ kích hoạt chúng.

## 概念

### 5 cách để bắt đầu chu kỳ sống

| 主体 (Actor) | 调用形式 | 典型用途 | 主要风险 |
|---|---|---|---|
| 人类用户 (Human user) | 在 UI 或 prompt 中指明 skill 名称 | 刻意选择特定工作流 | 用户期望获得宿主并未授予的可用性或权限 |
| 模型或自主 Agent (Model or autonomous agent) | 根据任务上下文从目录条目中自主选择 | 自动触发专家流程 | 假阳性误路由（False-positive routing） |
| 应用程序 (Application) | 通过运行时代码激活或预加载 skill | 固定的产品工作流 | 对特定 host 产生隐式耦合 |
| 另一个 Skill 或 Subagent | 请求将特定 skill 作为工作流依赖 | 组合（Composition） | 循环调用、依赖缺失或上下文泄露 |
| 评测运行套件 (Evaluation harness) | 在固定测试场景下激活指定 skill | 可重复度量 | 在测试该 skill 的同时意外绕过了正在研究的生产策略 |

Có thể di chuyển được Kỹ năng của đại lý  quy định được định nghĩa là bộ phận bao gồm. Nó không có tiêu chuẩn hóa thông thường sử dụng đường lối UI 隐式路由标志, ứng dụng API hoặc subagent 生命周期.

### 调用五个阶段

```figure
skill-invocation-stages
```

精准使用这些词汇:

- **Eligible（合格）**:策略允许当前主体 (đấu kịch) yêu cầu kỹ năng này
- **Selected（已选中）**: user direct nomination, hoặc router định định liên quan
- **Activated（已激活）**Đơn chỉ định đã vào làm việc trên:
- **Executing（执行中）**:agent trong những chỉ dẫn này hướng dẫn bắt đầu mô hình lập luận hoặc vận hành công cụ.
- **Completed（已完成）**: Output đã qua một cuộc thử nghiệm thành công độc lập.

Chỉ ghi lại`skill_used=true`Hóa ra, những dấu vết sẽ che giấu sự cố xảy ra thực sự.

### 人工与模型调用 cấu trúc 2x2 矩阵

| 人类可调用 | 模型可调用 | 模式 | 适用示例 |
|:---:|:---:|---|---|
| 是 | 是 | 共享 (Shared) | 代码解释、测试规划、文档审查 |
| 是 | 否 | 仅人类 (Human-only) | 发布准备、计费数据导出、破坏性清理方案 |
| 否 | 是 | 仅模型 (Model-only) | 内部风格指南、领域参考、自动化支持流程 |
| 否 | 否 | 禁用或仅应用 (Disabled or application-only) | 分阶段发布、已废弃包、程序化预加载 |

Các mô hình này là một mô hình chiến lược, chứ không phải là YAML tiêu chuẩn.

某当前宿主使用 `disable-model-invocation: true`表示仅人类行,使用 `user-invocable: false`Chỉ mô hình đi. 默认两者都是.`agents/openai.yaml`Trung `allow_implicit_invocation: false`Để giữ cho các ứng dụng được sử dụng trong khi sử dụng các ứng dụng được sử dụng.

容易混的细节非常关键:`user-invocable: false`Không có nghĩa là mô hình không thể sử dụng kỹ năng này. Trong định nghĩa của chủ nhà, nó chỉ đơn giản là di chuyển các mục nhập trực tiếp của người dùng.`disable-model-invocation: true`Nó cũng không có nghĩa là kỹ năng này đã bị cấm. Nó chỉ đơn giản là loại bỏ sự tự chọn của mô hình phát triển, trong khi vẫn giữ lại quyền truy cập rõ ràng của người dùng.

### 显然调用 là ưu tiên

显式调用直接提供身份标识:

```text
/release-readiness v2.4.0
```

Hoặc:

```text
release-readiness check v2.4.0 without publishing
```

Các tài liệu giao diện của Codex đã được sử dụng để chọn`/skills`Và trong yêu cầu trực tiếp sử dụng danh hiệu kỹ năng để thực hiện việc điều chỉnh rõ ràng.`/skill-name`Và các cơ chế phát triển các tham số cụ thể của chủ nhà. Các ngôn ngữ cụ thể, trình đơn có thể nhìn thấy, quy tắc tham chiếu và các biến thể được phân loại vào các thực hiện của chủ nhà.

显式请求 vẫn cần thông qua các chiến lược.

### 隐式调用是描述优先

Đối với các đường lối ẩn, mô hình ban đầu nhìn thấy là danh mục dữ liệu chứ không phải là văn bản chính xác hoàn chỉnh.

薄弱的描述( yếu):

```yaml
description: Helps with releases.
```

宽泛无度的描述:

```yaml
description: Use for release, version, package, build, deploy, publish, tag, changelog, GitHub, CI, or software tasks.
```

界界清晰的描述(Binded):

```yaml
description: Inspect an already prepared release candidate and produce a readiness report. Use when the user asks whether a version, tag, package, or image is ready to publish; do not use for ordinary build failures or feature development.
```

界界清晰的版本包含:

1. **能力（Capability）：**检查已准备好的候选版本──
2. **输出（Output）：**Đồ báo cáo
3. **正向边界（Positive boundary）：**询问发布产品是否准备就绪──
4. **负向边界（Negative boundary）：**常规构建和功能开发 không nằm trong quy trình này.

Khi hai kỹ năng của người hàng xóm chia sẻ từ ngữ,负向边界尤为有用―― nhưng chúng không thể thay thế gần hàng xóm

### 路由是带有权力选项的分类任务

对于技巧 $s$和 yêu cầu $x$, có thể tưởng tượng một router có điểm:

```text
score(s, x) = capability_match + trigger_match + context_match - exclusion_match - ambiguity_penalty
```

具体打分可能由LLM 判定而非算术――工程原则 vẫn còn tồn tại: sự lựa chọn phải vượt qua giá trị và áp lực hơn kỹ năng cạnh tranh――

```figure
skill-routing-abstention
```

Đối với các kỹ năng có ảnh hưởng cao, ngay cả khi mô tả được viết lại tốt, đường ngầm cũng có thể không phù hợp. Khi chi phí gây ra sai lầm giả tạo vượt quá sự tiện lợi của sự lựa chọn tự động, nên sử dụng chiến lược chỉ dành cho con người.

### 合格性 phải được xếp hạng trước

Đừng cho mỗi kỹ năng được phát hiện ra, hãy chọn kỹ năng phù hợp nhất và kiểm tra lại chiến lược kỹ năng đó. Nếu điểm phù hợp cao nhất bị ngăn chặn bởi chiến lược, bạn sẽ sai lầm ngăn cản việc xem xét các ứng cử viên đã đủ điều kiện nhưng điểm thấp hơn một chút.

隐式路由应采用以下顺序:

1.                                                                                                                                                                                                                                                               
2. Chỉ dành cho ứng cử viên đủ điều kiện.
3. Nếu điểm đạt được cao nhất đáp ứng các quy tắc giá trị và khác biệt, thì chọn nó.
4. Khi không có ứng cử viên nào đủ điều kiện hoặc điểm số đủ điều kiện không đủ cao, bỏ phiếu.

假设 `incident-triage`Nhận được`0.80`, nhưng chủ nhà của nó mở rộng cấm sử dụng mô hình调用.`incident-review`Nhận được`0.55`且允许模型调用──路由器应将 `incident-review`作为最佳合格候选人进行评估──它绝不应被选中 `incident-triage`, từ chối nó, rồi ngay lập tức dừng lại.

Phương pháp thực hiện này cũng có thể ngăn chặn các chiến lược thay đổi và thay đổi ý nghĩa của điểm liên quan chính nó.

### 路由评测 cần gần hàng xóm

正向例证明召回率 (có thể gọi lại):

```json
{"prompt":"Is version 2.4.0 ready to publish?","expected":"release-readiness"}
```

明确负向用例证明基本精确率(sự chính xác):

```json
{"prompt":"Explain rotary position embeddings.","expected":null}
```

近隣误触发例 (近邻误触发例) 揭示边界质量:

```json
{"prompt":"Why did today's package build fail?","expected":"build-diagnostics"}
```

Các trường hợp gần đây và kỹ năng phát hành đã được chia sẻ `package`和 `build`等词汇, nhưng thuộc về một nhiệm vụ hoàn toàn khác nhau.

### 参数具有三种表示形式

调用参数 trong quá trình chuyển đổi vượt qua nhiều biên giới:

```figure
skill-argument-boundaries
```

Ở mỗi biên giới, hãy chú ý đến các biểu tượng trong khi không nên thực hiện văn bản trực tiếp như mã:

- 宿主解析器决定命令语法和引号转义。
- Kỹ năng theo quy tắc của chủ nhà nhận được kết nối văn bản hoặc biến số.
- Chỉ thị kiểm tra cần thiết tham số và giá trị mặc định.
- 工具调用将值转换为类型化方案 并重新校验──

Đừng sẽ các parameter nguyên thủy trực tiếp được đính kèm vào shell 命令中。 ưu tiên调用接收参数组 (đối向 đối số) của kịch bản hoặc loại hóa MCP 工具。

###  ứng dụng调用 là biểu thức sắp xếp

产品 có thể trực tiếp kích hoạt một kỹ năng, vì dòng công việc kinh doanh của nó đã dự đoán trước các loại nhiệm vụ. Ví dụ, kéo yêu cầu  kiểm tra dịch vụ có thể được sử dụng trên người dùng click Review 按 后预载 `pull-request-risk-review`

Điều này đã loại bỏ sự không chắc chắn của đường dẫn, nhưng API đã phát sinh sự phụ thuộc vào thời gian vận hành. Xin lưu giữ các bộ điều chỉnh này bên ngoài văn bản có thể di chuyển:

```figure
skill-host-adapter
```

Như vậy khi mở kỹ năng này trong các kết nối khách hàng khác, nó vẫn giữ độ rõ ràng dễ hiểu.

### Kỹ năng 间调用 là một phần của một công cụ

假设 khi sự thay đổi dựa trên tài liệu xảy ra,`release-readiness`需要请求 `security-change-review`

调用方应提供:

- 目标技能的身份识别;
- Các nhiệm vụ và đường công trình có giới hạn;
- 预期的响应契约;
- 调用原因;
- Chương trình hoàn trả không cần thiết;
- Quy tắc kiểm tra độ sâu tối đa hoặc vòng lặp

```json
{
  "target_skill": "security-change-review",
  "task": "Review dependency changes in the candidate diff",
  "inputs": ["artifacts/release.diff"],
  "expected": "risk-report.json",
  "max_depth": 2
}
```

Kỹ năng thứ hai không phải là một cách trực tiếp bị kết nối với thứ nhất. Người chủ quyết định cách kích hoạt nó, cũng như nó được chia sẻ trên các văn bản dưới đây, hoạt động trong quá trình tách biệt, hoặc trả lại kết quả thông qua công cụ.

### n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n

 sau khi kích hoạt, kỹ năng chính văn có thể được giữ lại trong cuộc trò chuyện  trong quá trình nén văn dưới được tổng quát tổng kết, hoặc trong quá trình vận hành dưới văn bản trên ủy viên.

Đừng viết dựa trên kỹ năng giả định chu kỳ đời ẩn. Sẽ được kéo dài trong trạng thái lưu trữ tài liệu hoặc loại hóa, đảm bảo tái nhập an toàn, và rõ ràng phải tải lại nội dung nào sau khi gián đoạn.

```markdown
On resume, read `artifacts/release-readiness.json` if it exists.
Revalidate the candidate commit before continuing.
Do not repeat an external write whose idempotency key is already recorded.
```

##  xây dựng nó

`code/main.py`Để thực hiện các chiến lược và đường dẫn cho các bộ điều chỉnh độc lập.

Các mô hình dữ liệu bao gồm:

- `Actor`: dùng cho con người, mô hình, đại lý tự do, ứng dụng, kỹ năng và các thiết bị đánh giá;
- `SkillMetadata`: được sử dụng để nhận dạng đường bộ;
- `InvocationPolicy`: dùng cho người/模型矩阵;
- `InvocationRequest`Với`InvocationDecision`: để sử dụng các thông tin nhập và kết quả quyết định có thể theo dõi;
- `CorePolicyAdapter`: dùng cho hành vi di chuyển không chủ mở rộng;
- `ExtensionPolicyAdapter`: dùng để nhận dạng vận hành trong một đoạn cụ thể;
- `build_invocation_matrix(policy)`: để tạo 2x2 视图;
- `route_request(skills, request, adapter)`: được sử dụng để tiến hành qua trình qua trình độ trước khi được chọn và từ chối.

运行实验:

```bash
cd phases/13-tools-and-protocols/25-skill-invocation-and-routing
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Cuộc trình bày sẽ in ra một mô hình, cũng như các kết quả của các quyết định về các bộ xử lý và đánh giá đối với các ứng dụng, ứng dụng, kỹ năng kết hợp và các bộ đánh giá. Kết quả của bộ điều chỉnh mở rộng của nó cho thấy cách loại bỏ các kết hợp tối đa của các từ được ngăn chặn bởi chiến lược trước khi sắp xếp các lựa chọn dự phòng. Nó cũng chứa một danh sách trắng chính xác.

### Tại sao chiến lược cốt lõi và các bộ điều chỉnh mở rộng phải tách biệt

Nếu một bộ giải thích mù quáng cho mỗi phần trước được quan sát 字段赋予 đặc biệt ý nghĩa,就会隐式将运行时约定推崇为虚假的通用标准――分离的适配器迫使调用方明确指明当前正在生效的哪个主主的语义――

`CorePolicyAdapter`Chỉ sử dụng các ứng dụng rõ ràng cung cấp các chiến lược.`ExtensionPolicyAdapter`则识别明确一组主持人字段,并记录下究竟是哪个字段改变了决策──

## Sử dụng nó

Trong việc phát hành kỹ năng 之前编写调用契约(sự thầu):

```yaml
actors:
  human: allow
  model: deny
  application: allow
  skill: deny
explicit_name: release-readiness
arguments:
  candidate: required
  publish: fixed_false
ambiguity: ask_user
missing_dependency: stop
context:
  durable_state: artifacts/release-readiness.json
  max_composition_depth: 2
```

Hiệp ước này là tài liệu thiết kế cho các thiết bị thích ứng và sử dụng thử nghiệm trừ khi tiêu chuẩn được chấp nhận rõ ràng, nếu không nó không thể được chuyển.`SKILL.md`Phụ nữ:

## 交付 nó

本课产出发 `skill-invocation-router`组件包── nó chứa một tham khảo mô hình điều chỉnh, một ví dụ về chiến lược chủ nhà, cũng như một công cụ CLI không thể thực hiện── công cụ này có thể đánh giá một lần yêu cầu bộ phận điều tra của con người, mô hình, đại lý độc lập, ứng dụng, kỹ năng, và trả lại các quyết định JSON chứa các đường dẫn, bộ điều chỉnh, điểm và nguyên nhân──

CLI đơn yêu cầu là một công cụ tìm kiếm chiến lược, chứ không phải là bộ đánh giá cảm xúc hoàn chỉnh.

## 练习

1. Tạo tất cả bốn dòng của mô hình mô hình và viết một cảnh sử dụng thực tế hợp pháp cho mỗi dòng.
2. Vì vậy`CorePolicyAdapter`添加仅限应用程序激活的功能──编写测试证明人类和模型调用方式仍被拒绝──
3. Để một kỹ năng triển khai  viết 10 trường hợp sử dụng sai lầm gần gũi. Mỗi lời nhắc phải chia sẻ phần từ ngữ với kỹ năng đó, nhưng thuộc về một dòng làm việc khác nhau.
4. Trong điểm số cao nhất hai đường dẫn giữa các điểm số cao nhất, thêm sự khác biệt về đường biên giới (các điểm khác nhau)`ask`
5. Để yêu cầu thêm tối đa tập hợp độ sâu giới hạn,并能检测出由两个技能构成的死亡循环.
6. Sử dụng bộ điều chỉnh lõi và bộ điều chỉnh mở rộng hoạt động cùng một tập hợp kiểm tra nhãn.

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| 显式调用 (Explicit invocation) | “斜杠命令” | 调用方直接提供 skill 身份标识，受策略约束 |
| 隐式调用 (Implicit invocation) | “模型自主选择” | 路由器根据任务上下文从合格的目录元数据中自主选择 |
| 用户可调用 (User-invocable) | “人类可以使用” | 特定于宿主的菜单或直接调用属性，而非核心标准字段 |
| 模型可调用 (Model-invocable) | “agent 可以使用” | 在宿主策略下具备隐式模型选择资格 |
| 调用适配器 (Invocation adapter) | “frontmatter 解析器” | 将宿主字段和 API 映射到已声明策略模型的代码 |
| 近邻误触发用例 (Near miss) | “困难负例” | 与 skill 预期输入高度相似但不应触发该 skill 的请求 |
| 弃权 (Abstention) | “未选中任何 skill” | 在缺乏足够证据或存在歧义时刻意做出的路由结果 |

## 延伸阅读

- [优化 skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions): hiểu sâu hơn về chính hướng cảm xúc từ、 cụ thể性与评测──
- [评测 skills](https://agentskills.io/skill-creation/evaluating-skills): hiểu về thiết kế của các đánh giá và phát hành đánh giá.
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills): hiểu rõ ràng và ẩn sử dụng kiểm soát hiện tại của Codex
- [Claude Code skills](https://code.claude.com/docs/en/skills): hiểu biết cụ thể của chủ nhà `user-invocable``disable-model-invocation`、 Các thông số truyền tải và cơ chế truyền tải trên ủy ban.
