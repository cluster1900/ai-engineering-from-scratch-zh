# Ngân sách hành động, giới hạn lặp lại và quản trị chi phí

> Một trung bình đại lý thương mại điện tử của tháng bằng LLM 成本, 在团队启动 "để theo dõi đơn hàng" kỹ năng 后, từ $1,200 跳到了 $4,800── đây không phải là lỗi giá trị── đây là một đại lý  đã phát hiện ra một vòng lặp mới, và tiếp tục trong vòng lặp trong chi tiêu. Microsoft's Agent Governance Toolkit (Mỹ) đã tiêu chuẩn hóa các biện pháp phòng ngừa đối với các vấn đề như:`max_tokens`、 mỗi nhiệm vụ của Token 和美元预算、 hàng ngày/tuần hạn trên hạn, giới hạn lặp lại, phân cấp mô hình định tuyến, lập trình lưu trữ trước, cửa sổ ngữ cảnh, các điểm kiểm tra HITL đắt tiền trong hoạt động, ngân sách vi phạm khi chuyển đổi giết người.

**Type:** Learn
**Languages:** Python (stdlib, layered cost-governor simulator)
**先修要求：**Giai đoạn 15 · 10 (Phương thức cho phép), Giai đoạn 15 · 12 (Việc thực hiện lâu dài)
**Time:** ~60 minutes

## 问题

Mỗi vòng của các đại lý tự trị sẽ tốn tiền thật. Việc có những kết quả xấu của chatbot là một kết quả xấu; vòng lặp xấu của đại lý là một kế toán. Trong các tài liệu ngành, thuật ngữ cho mô hình thất bại này là "Tước từ ví": đại lý tiếp tục suy luận, tiếp tục sử dụng công cụ, không có gì ngăn chặn nó, vì ngay từ đầu không có cơ chế ngăn chặn như vậy được thiết kế.

Phương pháp sửa chữa không phải là một số, mà là một tập hợp các giới hạn về thời gian khác nhau: mỗi yêu cầu, mỗi nhiệm vụ, mỗi giờ, mỗi ngày, mỗi tháng.

Đây là một phần của bài học kỹ thuật: toán học rất đơn giản, đội thất bại ở nơi đó trong kỷ luật.

## 概念

### quản lý chi phí

1. **每次请求的 `max_tokens`。**简单―― ngăn chặn bất kỳ lần nào tạo ra việc hoàn thành không giới hạn――
2. **每个任务的 Token 预算。**Trong suốt quá trình vận hành, phải vượt quá N 个 Token.
3. **每个任务的美元预算。**Như Token  tương tự, nhưng đơn vị là tiền tệ.`max_budget_usd`
4. **每个工具调用上限。**Không quá N lần`WebFetch`调用 N 次`shell_exec`调用,等等.
5. **Iteration cap (`max_turns`)。**Tổng số lần của vòng tròn đại lý; ngăn chặn vòng tròn không giới hạn.
6. **每分钟 / 每小时 / 每天 / 每月上限。**滚动窗口── được sử dụng trong các thời gian khác nhau để bắt được rò rỉ──
7. **财务速度限制。**Ví dụ, nếu 10 phút chi phí trên 50 đô la, thì cắt giảm truy cập.
8. **分层 model routing。**默认使用更小的模型; chỉ khi phân loại 判断任务值得时才升级到更大的模型──
9. **Prompt caching。**Hệ thống nhanh và ổn định bối cảnh 存在 provider cache 中; tái gửi Token 成本接近零──
10. **Context windowing。**通过缩减 / tổng kết 把活文text 保持在值以下;直接降低 Token 成本。
11. **昂贵操作上的 HITL checkpoints。**Trong quá trình vận hành đã được biết đến đắt tiền trước khi có quá trình sử dụng công cụ thời gian dài, tải xuống lớn, nâng cấp mô hình đắt tiền, yêu cầu xác nhận nhân tạo.
12. **预算违约时的 kill switch。**任一上限触发时会议 中止──记录触发的上限; cần một cách độc lập để khởi động lại.

### Tại sao cần, chứ không phải là giới hạn đơn lẻ

单个月度上限 chỉ có thể bắt được một nhân viên bị mất kiểm soát sau khi túi tiền đã trống rỗng. 单个月度上限不能抓住任何问题在会议层面.

- **失控循环**(agent 卡在 5 秒重试中): bởi tốc độ hạn chế bắt giữ
- **缓慢泄漏**(Hội ngũ nhân viên mỗi nhiệm vụ làm khoảng 2x  dự đoán): Từ hàng ngày lên hạn bắt giữ.
- **糟糕发布**(New Version Using 5x Token): Từ mỗi tuần / 每月上限抓住──
- **合法激增**(真实需求,不是 bug):由小时 / 天上限抓住,并产生清晰日志。

### Quản trị ngân sách của Claude Code

Claude Code Agent SDK 暴露了(公开文档):

- `max_turns` giới hạn lặp lại
- `max_budget_usd` 美元上限;违约时会议 中止──
- `allowed_tools`- `disallowed_tools` 工具 allowlist 和 denylist。
- 工具使用前的 hook points, được sử dụng để tự xác định chi phí核算。

Với phép chế độ thang máy (Lớp 10)结合使用──没有`max_budget_usd`của `autoMode`phiên là tự trị không được quản lý.

### EU AI Act OWASP Agentic Top 10

Microsoft's Agent Governance Toolkit covered OWASP Agentic Top 10 và EU AI Act Điều 14 (phòng dõi con người) yêu cầu. Đối với môi trường sản xuất của EU,日志记录和上限执行不是可选项.

###  quan sát$1,200 → $4.800 trường hợp

Ví dụ thực tế trong tài liệu Microsoft: một đại lý thương mại điện tử sau khi thêm công cụ mới, chi phí hàng tháng tăng gấp ba lần. Công cụ này cho phép đại lý trong mỗi phiên truy vấn trạng thái đặt hàng không có kiểm tra vòng lặp. Không có giới hạn trên mỗi công cụ. Không có giới hạn hàng tuần.


```figure
cost-governor-stack
```

## Sử dụng nó

`code/main.py`模拟一个有层次成本管理员堆 和没有该的代理运行.模拟中的代理在几个轮后漂移进轮询循环;层次堆将在速度窗口内抓住它,而单个月度上限只需几天后才触发.

## 交付 nó

`outputs/skill-agent-budget-audit.md`审计 một đại lý đề xuất 部署 của chi phí-chủ tịch hàng,并 đánh dấu thiếu hụt层。

## 练习

1. 运行 `code/main.py` xác nhận trên đường vòng lặp vòng lặp, giới hạn tốc độ trước giới hạn lặp 触发  hiện đang cấm giới hạn tốc độ, đại lý đo lường trong giới hạn lặp  nắm bắt nó trước khi  chi tiêu  đã nhiều 

2. Để làm cho các trình duyệt đại lý (Dân học 11) thiết kế một nhóm mỗi công cụ trên giới hạn.

3. 阅读 Microsoft Agent Governance Toolkit 文档――列出 toolkit 命名的每种上限类型――把每种映射到某个失败模式(失控循环、缓慢泄漏、糟糕发布、激增) 』

4. Vì một nhiệm vụ thực sự của một đêm không giám sát chạy 定价(ví dụ, triage 50 vấn đề trong một repo) `max_budget_usd`设为点估计的2x. 解释为什么是2x.

5. Claude Code của `max_budget_usd`基于会议 聚合成本触发. 设计一个你会在外部执行的互补速度限制. 什么会触发切断,重新启动是什么样子?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Denial of Wallet | "Runaway bill" | agent 循环产生花费，并且没有上限阻止它 |
| max_tokens | "Per-request cap" | 单个 completion 大小的上限 |
| max_turns | "Iteration cap" | 一个 session 中 agent loop 迭代次数的上限 |
| max_budget_usd | "Dollar kill switch" | session 成本上限；违约时中止 |
| Velocity limit | "Rate cap" | 短窗口内花费的限制（例如，$50 / 10 min） |
| Tiered routing | "Small model first" | 默认使用便宜 model；只有 classifier 判断值得时才升级 |
| Prompt caching | "Cached system prompt" | provider 侧 cache 将重发 Token 成本降到接近零 |
| HITL checkpoint | "Human approval gate" | 昂贵操作前需要人工确认 |

## 延伸阅读

- [Anthropic Claude Code Agent SDK — agent loop and budgets](https://code.claude.com/docs/en/agent-sdk/agent-loop) `max_turns``max_budget_usd`、 các công cụ được phép
- [Microsoft Agent Framework — human-in-the-loop 与治理](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) chi phí thống đốc 检查点。
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) nhà cung cấp 侧成本控制──
- [Anthropic — Prompt caching (Claude API docs)](https://platform.claude.com/docs/en/prompt-caching) cơ chế lưu trữ 
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) chi phí hình ảnh của các đại lý tầm xa
