# Sử dụng công cụ và gọi chức năng

> Toolformer (Schick et al., 2023) 开创了自监督工具注释──Berkeley Function Calling Leaderboard V4 (Patil et al., 2025) 设定2026年标准:40% đại lý、30% đa lượt、10% live、10% không sống、10% ảo giác──单轮 已解决──记忆、动态决策和长视线工具链 还没有解决──

**Type:** Build
**Languages:** Python (stdlib)
**前置要求:**Giai đoạn 14 · 01 (Tình lình đại lý), Giai đoạn 13 · 01 (Công việc gọi sâu)
**Time:** ~60 分钟

## Học mục tiêu
- 解释 Toolformer's tự giám sát tín hiệu đào tạo: Chỉ khi thực hiện có thể giảm Loss Token tiếp theo,才保留工具注释──
- Nói ra 5 loại đánh giá của BFCL V4, cũng như mỗi loại đo lường gì.
- 实现 một registry tool stdlib, chứa xác nhận schema, buộc lập luận và sandboxing thực thi.
- 诊断 2026 năm của ba vấn đề mở: chuỗi công cụ đường dài, quyết định năng động và trí nhớ.

## 问题
早期 tool use 问的是:model 能否预测一个正确的功能调用?Modern tool use 问的是:model 能否跨 40 个步骤链式调用工具,具备记忆,处理部分可观测性,恢复从工具故障中,并且不幻觉不存在的工具?

Toolformer  đã xây dựng基线: mô hình có thể thông qua tự giám sát 学会何时调用工具──BFCL V4  xác định mục tiêu đánh giá năm 2026──

## 概念
### Toolformer (Schick et al., NeurIPS 2023)

思路: Hãy để mô hình sử dụng ứng viên API gọi 标记 riêng của mình tập thể đào tạo. Đối với mỗi ứng viên  thực hiện nó. Chỉ khi chứa kết quả công cụ 能降低一个代币 上的损失,才保留该注释.

覆盖的工具:计算器、QA系统、搜索引擎、翻译、日历──自监信号 纯粹关注工具 是否有助预测文本,不需要人标签──

规模结果:工具使用 会在规模足够时涌现――较小的模型 会因工具注释受损;较大的模型会受益――这就是为什么2026年的边界模型内置强的工具使用能力,而大多数7B模型需要显而易见的工具使用细节调节才可靠――

### Berkeley Function Calling Leaderboard V4 (Patil et al., ICML 2025)

BFCL là đánh giá thực tế năm 2026──V4 构成:

- **Agentic (40%)** 完整代理轨迹:memory、multi-turn、dynamic decisions。
- **Multi-Turn (30%)** 带 ròng công cụ của giao tiếp hình thức trò chuyện。
- **Live (10%)** User submits thực tế yêu cầu 更难的分布)
- **Non-Live (10%)** trường hợp thử nghiệm tổng hợp
- **Hallucination (10%)** 检测何时不应调用 công cụ

V3 giới thiệu đánh giá dựa trên trạng thái: sau đó, kiểm tra trạng thái thực tế của API (ví dụ: file có được tạo?), thay vì các cuộc gọi của AST.

2026 年关键发现: gọi hàm quay đơn 基本已解决。失败集中在记忆(跨轮 携带背景)、动态 ra quyết định(基于先前结果选择工具)、长视线链(20+ bước 后漂移) 和幻觉检测(没有合适工具 时拒调用)。

### Chế hoạch công cụ

Mỗi nhà cung cấp đều có một kế hoạch khác nhau, nhưng chia sẻ cùng một hình dạng:

```
name: string
description: string (what it does, when to use it)
input_schema: JSON Schema (properties, required, types, enums)
```

Nhân văn 直接使用 `input_schema`❖ OpenAI 使用 `function.parameters`◊ Cả hai đều chấp nhận JSON Schema──Thiêu tả 承担关键作用, mô hình 会读取它们来选择正确的工具──糟糕的工具描述是选择错误的工具──失败的第一根原因──

### Định giá lý lẽ

Đừng tin bất kỳ công cụ nào gọi.

1. **Type coercion.**Model 可能在 schema 要求 int 的地方返回字符串 `"5"` Nếu明确无歧义就强迫;否则拒绝
2. **Enum validation.**Nếu schema  viết là `status in {"open", "closed"}`, và mô hình 输出 `"in_progress"`, hãy sử dụng lỗi mô tả từ chối.
3. **Required fields.**缺少 yêu cầu trường -> 立即把错误观察 返回模型, thay vì bị hỏng.
4. **Format validation.**Ngày, email, URL  Sử dụng các trình phân tích cụ thể xác nhận, chứ không phải regex.

Mỗi thất bại xác nhận đều phải quay lại quan sát cấu trúc, để mô hình có thể sử dụng hình dạng chính xác để thử lại.

### Các cuộc gọi công cụ song song

现代 provider 支持在一个助手转 中并行工具调用──Loop:

1. Mô hình phát ra 3 cuộc gọi công cụ, mỗi người có một số khác nhau.`tool_use_id`
2. Thời gian chạy  thực hiện chúng  Nếu lẫn nhau độc lập thì并行)
3. Mỗi kết quả đều là như vậy.`tool_result`block  quay lại,并通过 `tool_use_id`关联:

工程规则:把相关性 ID 当作关键约束──把它们交换,就会导致错误工具到错误结果路由──

### Sandboxing

Việc thực hiện công cụ là ranh giới hộp rác。详情见 Bài học 09。简短版本: Mỗi công cụ 都应指定读写表面、网络访问、timeout、memory cap。通用`run_shell(cmd)`là tín hiệu nguy hiểm; cụ thể `git_status()`Thêm an toàn hơn.


```figure
tool-routing
```

##  xây dựng nó
`code/main.py`实现 một danh sách công cụ hình thức sản xuất:

- JSON Schema subset validator ( chỉ có stdlib)
- Đăng ký công cụ, chứa mô tả, quy trình đầu vào, thời gian và trình thực.
- Sự buộc tội và xác nhận bằng chứng.
- 带 liên quan ID của đồng bộ công cụ gửi đi
- 作为结构化字符串的错误观测──

运行 nó:

```
python3 code/main.py
```

Theo dõi  hiển thị một đại lý nhỏ trong một lượt调用 ba công cụ, trong đó một cuộc gọi cố ý bị sai lệch sẽ bị từ chối, và trả lại mô hình có thể theo hành động này sai sót mô tả.

## Sử dụng nó
Mỗi nhà cung cấp có kế hoạch công cụ riêng:Anthropic、OpenAI、Gemini、Bedrock。 Nếu cần nhiều nhà cung cấp, hãy sử dụng lớp dịch thuật(OpenAI Agents SDK、Vercel AI SDK、LangChain tool adapter)。BFCL là điểm tham khảo; nếu sử dụng công cụ là cốt lõi sản phẩm, hãy phát hành trước xin sử dụng nó để kiểm tra đại lý của bạn。

## 交付 nó
`outputs/skill-tool-registry.md`会为给定任务域 生成工具目录、方案 和注册表──包含描述质量检查(每个工具的描述 是否告诉模型何时使用它?)。

## 练习
1. Thêm một công cụ "không hoạt động", để mô hình có thể từ chối sử dụng bất kỳ công cụ nào khác.
2. Vì int-as-string và float-as-string 实现 lập luận bắt buộc  coercion 从哪里开始会掩盖真实bug?
3. 添加 per tool timeout 和 circuit breaker(连续失败 3 次后,在60s内拒绝该工具) ―― Điều này sẽ thay đổi cách phục hồi mô hình như thế nào?
4. 阅读 BFCL V4 description──选择一个类别(例如"multi-turn"),并让你的代理 跑 10 个例子提示──报告通过率──
5. Sẽ được chuyển vào Pydantic hoặc Zod.

## 关键术语
| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Function calling | "Tool use" | 使用 validated schema 的 structured-output tool invocation |
| Toolformer | "Self-supervised tool annotation" | Schick 2023 — 保留那些结果能降低 next-Token Loss 的 tool calls |
| BFCL | "Berkeley Function Calling Leaderboard" | 2026 benchmark：40% agentic、30% multi-turn、10% live、10% non-live、10% hallucination |
| Tool schema | "给 model 的 function signature" | name、description、arguments 的 JSON Schema |
| tool_use_id | "Correlation ID" | 将 tool call 与其 result 绑定；对 parallel dispatch 至关重要 |
| Hallucination detection | "知道何时不调用" | V4 category：没有合适 tool 时拒绝调用 |
| Argument coercion | "String-to-int repair" | 针对可预测 schema mismatch 的窄修复；如果有歧义则 reject |
| Sandboxing | "Tool execution boundary" | 每个 tool 的 read/write surface、network、timeout、memory cap |

## 延伸阅读
- [Schick et al., Toolformer (arXiv:2302.04761)](https://arxiv.org/abs/2302.04761) Nhận xét công cụ tự giám sát
- [Berkeley Function Calling Leaderboard (V4)](https://gorilla.cs.berkeley.edu/leaderboard.html) Định nghĩa chuẩn đánh giá năm 2026
- [Anthropic, Tool use documentation](https://platform.claude.com/docs/en/agent-sdk/overview) Claude Agent SDK 中的 sản xuất công cụ sơ đồ
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) loại công cụ chức năng 和 Guardrails
