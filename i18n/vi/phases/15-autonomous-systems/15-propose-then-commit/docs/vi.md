# Người trong vòng lặp: đề xuất sau đó cam kết

> 2026 năm về HITL sự đồng ý là cụ thể. Nó không phải là agent 发问, người dùng nhấn  phê duyệt ── nó là đề xuất-sau-thành động: đề xuất-sau-thành động sẽ kết nối với khóa vô hiệu hóa 持久化到耐用存储; với ý định, dòng dữ liệu, giấy phép được chạm vào, bán kính blast và kế hoạch lật ngược 呈现给评论家; chỉ trong xác định xác nhận sau khi tham gia; thực hiện sau khi xác minh lại, xác nhận tác dụng phụ 确实发生──`interrupt()`加 PostgreSQL kiểm tra điểm ✓ Microsoft Agent Framework của `RequestInfoEvent`, và Cloudflare `waitForApproval()`                                                                                                                                                                                                                                                              

**Type:** 学习
**Languages:** Python (stdlib，带 idempotency 的 propose-then-commit state machine)
**前置要求：**Giai đoạn 15 · 12 (Việc thực hiện lâu dài), Giai đoạn 15 · 14 (Tripwire)
**Time:** ~60 分钟

## 问题

Người dùng phải quyết định: phê duyệt hay không phê duyệt. Nếu quyết định là ngay lập tức, nó rất có thể không phải là xem xét. Nếu quyết định là cấu trúc, nó sẽ chậm hơn, nhưng có thể tin tưởng.

HITL mô hình 2023 年代是同步提示:Agent muốn gửi email đến X với cơ thể Y  phê duyệt? 用户点击 phê duyệt. Mọi người cảm thấy hệ thống là an toàn.

Mô hình năm 2026 là đề xuất-sau-thành động, đưa HITL  chuyển đến nền bền lên, thêm cấu trúc hóa metadata,并 yêu cầu cam kết tích cực. Mỗi SDK quản lý đại lý đều cung cấp một số phiên bản: LongGraph`interrupt()`、Microsoft Agent Framework `RequestInfoEvent`、Cloudflare `waitForApproval()`❖ API 名称不同;形态相同──

## 概念

### Máy cơ nhà nước đề xuất sau đó cam kết

1. **Propose.**Agent 生成一个拟议的行动――它被持久化到持久的存储(PostgreSQL、Redis、Durable Object) ‒包括:
   - ý định của bạn.
   - Data lineage ((quên nguồn dẫn đến đề xuất này)
   - quyền được chạm vào(哪些 phạm vi / tập tin / điểm cuối)
   - Vòng phát nổ ((最坏情况是什么)
   - kế hoạch quay lại nếu cam kết, chúng tôi sẽ hủy bỏ)
   - khóa miễn phí (để trả lời mỗi đề xuất)
2. **Surface.**Người xem xem xem xem đề xuất chứa tất cả các siêu dữ liệu. Người xem là người không phải là đại lý.
3. **Commit.**明确肯定确认── hành động 执行──
4. **Verify.**执行后,读取并确认副作用──如果验证步骤 失败,系统处于已知坏状态,并触发警报──

### Key idempotency

Không có khóa miễn trừ 时,transient failure 后的重试可能重复执行已批准的行动――具体例: người dùng phê duyệt 转移 $100 từ A sang B──网络短暂动──网络短暂动── 工作流重新尝试── người dùng chỉ phê duyệt một lần, nhưng chuyển giao 执行两次── miễn trừ 关键 将批准 绑定到单个单个副作用;第二次执行是无-op──

Đây là một mẫu tính năng khác biệt sử dụng trong Stripe và AWS API tương tự.

### Độ bền: Tại sao sự chấp thuận có thể tồn tại trong quá trình

Phòng chờ phê duyệt là một đoạn không thuộc về nhà nước của đại lý.`interrupt()`Với PostgreSQL checkpointing 配对, thay vì chỉ sử dụng trạng thái trong bộ nhớ:

### Việc phê duyệt dấu cao su và giảm thiểu thách thức và phản ứng

HITL của mặc định UI(Từ chối  / Từ chối  nút) sẽ tạo ra nhanh chóng chấp thuận, nhưng không có thực sự xem xét .

-  Bạn hiểu điều này sẽ chạm vào tài nguyên nào?
- 你确认爆炸射线可以接受吗?
- Nếu thất bại, bạn có kế hoạch quay lại không?

Đây không phải là một hệ thống để kiểm soát, mà là một chức năng buộc người xem không thể kiểm soát được các khung này, yêu cầu giải thích, tăng cường, từ chối hoặc không chấp nhận.

### Điều gì là hậu quả

Không phải là mỗi hành động đều cần đề xuất-sau-thành động.

- **Consequential actions**(始终 HITL): không thể đảo ngược, giao dịch tài chính, giao tiếp ra ngoài, thay đổi cơ sở dữ liệu sản xuất, hoạt động hệ thống tệp hủy hoại.
- **Reversible actions**(有时 HITL): viết ngược về các thay đổi n trình diễn các tập tin địa phương 带清晰 rollback
- **Reads and inspections**(从不 HITL):读取文件、列出资源、调用 chỉ đọc API。

### Kiểm tra sau hành động

The commit ran 不等于 the side effect happened──网络分区和竞赛条件可能让工作流以为自己成功,而后端实际并没有持续──验证步骤 会在 commit 后重新读取目标资源以确认──这与使用`RETURNING`Các khoản của các giao dịch cơ sở dữ liệu, hoặc`PutObject`后执行 AWS `GetObject`Đó là một mô hình tương tự.

### Đạo luật AI của EU Điều 14

Điều 14  yêu cầu các hệ thống AI của Liên minh châu Âu  có sự giám sát của con người hiệu quả                                                                                                                                                                                                                                                   


```figure
mx-propose-then-commit
```

## Sử dụng nó

`code/main.py`Sử dụng stdlib Python 实现 một máy tính lập trình đề xuất sau đó thực hiện.  Cửa hàng bền vững là tập tin JSON.  Chìa độ mất khả năng là hash của (thread_id, action_signature).

## 交付 nó

`outputs/skill-hitl-design.md`会 review Một dòng công việc HITL đề xuất có có hoặc không có hình thức đề xuất sau đó cam kết,并 đánh dấu sự thiếu hụt của metadata, khả năng kiểm tra hoặc các lớp thách thức và phản ứng;;

## 练习

1. 运行 `code/main.py` xác nhận đề xuất được phê duyệt  dùng hồ sơ bền vững, và sẽ không thực hiện lại  sau đó đưa khóa miễn trừ  biến thành bao gồm dấu thời gian, hiển thị  tái thử  thực hiện hai lần 

2. Sử dụng `rollback`trường  mở rộng hồ sơ đề xuất 模拟一次验证步骤 失败的执行──展示滚回 会自动触发──

3. 阅读 Microsoft Agent Framework của `RequestInfoEvent`Docs. Tìm ra API 包含但玩具机 缺失一个元数据字段.

4. Để thực hiện một hành động cụ thể (ví dụ: đăng một bài đăng vào tài khoản Twitter công cộng) thiết kế danh sách kiểm tra thách thức và phản ứng.

5. 选择一个同步 批准?快速 足够的场景(不需要持久的店) ――解释原因,并说明你接受的风险类――

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Propose-then-commit | “Two-phase approval” | 持久化 proposal + positive commit + verify |
| Idempotency key | “Retry-safe token” | 每个 proposal 唯一；第二次 execution 为 no-op |
| Data lineage | “Where it came from” | 导致 proposal 的具体 source content |
| Blast radius | “Worst case” | action 出错时的影响范围 |
| Rubber-stamp | “Fast approval” | 没有真正 review 就点击 “Approve” |
| Challenge-and-response | “Forcing checklist” | Reviewer 必须明确确认具体问题 |
| RequestInfoEvent | “MS Agent Framework primitive” | 带结构化 metadata 的 durable HITL request |
| `interrupt()` / `waitForApproval()` | “Framework primitives” | 同一形态的 LangGraph / Cloudflare 等价物 |

## 延伸阅读
- [Microsoft Agent Framework — Human in the loop](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) `RequestInfoEvent`,nghĩa thuận lâu dài
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) `waitForApproval()`和 Các vật thể bền vững
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) HITL 作为长远风险的缓解──
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 高风险系统的监管基线──
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)  Khung quanh việc giám sát khung hiến pháp
