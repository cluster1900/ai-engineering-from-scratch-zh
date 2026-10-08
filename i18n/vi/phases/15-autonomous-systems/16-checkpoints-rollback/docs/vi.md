# Các điểm kiểm soát và Rollback

> Mỗi lần biểu đồ-thế độ chuyển đổi thành phố sẽ kéo dài. Khi người lao động n, khi hợp đồng thuê của nó hết hạn, một người lao động khác sẽ được truy cập từ điểm kiểm soát mới nhất 接接. Cloudflare Durable Objects sẽ được lưu trữ trong vài giờ hoặc vài tuần. Thiếu-sau-thành lập (Lớp 15) cho mỗi động tác xác định việc kiểm soát lại  kế hoạch.

**Type:** 学习
**Languages:** Python（stdlib，checkpoint 与 rollback state machine）
**Prerequisites:** Phase 15 · 12（Durable execution），Phase 15 · 15（Propose-then-commit）
**Time:** ~60 分钟

## 问题

Hoạt động lâu dài: Khi một động tác đã được phê duyệt chỉ thực hiện một phần, xảy ra sự sụp đổ và phục hồi, sẽ xảy ra gì?

Hệ thống thực sự sẽ kết nối với cơ chế này theo cách khác nhau:

- **LangGraph**Sẽ chuyển giao từng trạng thái biểu đồ  chuyển giao điểm kiểm soát đến PostgreSQL ∙ nhân viên n khi sụp đổ, thuê sẽ được giải phóng, một nhân viên khác sẽ từ điểm kiểm soát mới nhất 恢复 ∙ dòng công việc sẽ được`interrupt()`Nó sẽ bị tạm dừng, nhưng nó cũng sẽ được duy trì.
- **Cloudflare Durable Objects**会跨数小时或数周保存按钥匙 划分的状态――把计算与已批准动作的存储放在同一位置――
- **Microsoft Agent Framework**Trong API workflow được lộ`Checkpoint`Primitive; play thêm idempotency 覆盖 tái thử.

无论哪种情况,真正有效的组合都是:idempotency key (tránh quyền hạn) 防止重复执行 (để ngăn chặn tái thực hiện) + kiểm tra điều kiện tiên quyết (để kiểm tra tình trạng vẫn được phê duyệt) + kiểm tra hậu quả (để kiểm tra hậu quả) 确实发生) + kiểm tra-lỗi (để kiểm tra) lút lại (để kiểm tra).

## 概念

### Mỗi lần chuyển đổi đều sẽ kéo dài

Graph-state 转换 là bất kỳ bước nào trong quá trình chuyển từ một trạng thái đặt tên đến trạng thái đặt tên khác.

### Thuộc thu nhập thuê

Khi công nhân sụp đổ, dòng công việc sẽ không bị mất; thuê một tuyên bố ngắn hạn, cho biết công nhân đang thực hiện cuộc chạy này) chỉ là quá hạn. Một công nhân khác sẽ tiếp cận điểm kiểm soát mới nhất và khôi phục.

### Thức năng không thể làm việc

Chỉ có sự miễn phí còn không đủ.$1000 时，从 A 向 B 转账 $100──workflow 已 commit,在执行中崩,然后恢复──如果只检查无效率关键,并且执行恢复,那么转账会运行一次 (正确) ―但考虑在崩和恢复之间,A 的余额通过另一个工作流 降到了500美元──无效率检查 仍然通过;前不通过──没有前检查,我们就会制造通过支──

Mỗi động tác có hậu quả đều cần hai điều:

- **Idempotency key**: ngăn chặn tái thực hiện
- **Precondition check**: xác nhận tình trạng vẫn phù hợp với động tác đã được phê duyệt

### 动作后验证

工具 返回 200不是验证──真正的验证会重新读取目标状态,并确认副作用 确实发生──模式包括:

- Cập nhật cơ sở dữ liệu:`UPDATE ... RETURNING *`, sau đó xác định hàng trở lại phù hợp với trạng thái dự kiến.
- Email gửi: gửi sau trong thư mục gửi 中检查消息 ID。
- File write:读回文件并计算 hash──
- API call: đối với nguồn lực mục tiêu 执行后续 `GET`

Nếu xác minh  thất bại, workflow sẽ ở trong tình trạng xấu đã biết.

### Kế hoạch quay trở lại

Các loại kế hoạch dự án sau đó liên quan đến các hoạt động tiếp theo bao gồm:

- **In-band rollback**: direct反转 tác dụng phụ`INSERT`后 `DELETE`, gửi sau`Send-correction-email`(■)
- **Compensating transaction**Một động tác mới, để tiêu diệt động tác nguyên bản
- **Out-of-band rollback**Đưa ra những người, tạm dừng quá trình làm việc, giữ lại tình trạng xấu để điều tra.

Không có rollback (không có rollback) (không có rollback) (không có rollback) (không có rollback) (không có rollback) (không có rollback) (không có rollback) (không có rollback) (không có rollback) (không có rollback) (không có rollback) (không có rollback) (không có rollback) (không có rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không rollback) (không có rollback) (không có) (không có) (không có) (không có) (không) (không có) (không) (không) (không có) (không) (không) (không) (không) (không có) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) (không) ()))))))) ()) ()))))) ()) ()))))) ()) ()))))))))) ())))))))

### Điều 14 của Đạo luật AI EU

Điều 14  yêu cầu hệ thống quản lý nhân lực có hiệu quả.

- Điểm kiểm soát có thể được kiểm toán viên hỏi.
- Rollback đã được luyện tập rồi (至少端到端测试一次)
- Các đường kiểm toán có thể được triển khai 后继续存在
- Việc xác minh thất bại sẽ kích hoạt cảnh báo, thay vì được ghi âm lặng lẽ vào hồ sơ.

Một dòng công việc Nếu trong quá trình thực hiện trung gian sụp đổ  恢复, sau đó hoàn thành tác dụng phụ mà không kiểm tra + rollback 路径, bạn không thể thông qua Điều 14 测试。

### 尖失效模式:重复执行

Các tai nạn sản xuất phổ biến nhất trong lĩnh vực này là:

1. 动作已批准, chìa khóa giải phóng vì k.
2. Cứ bắt đầu, thực hiện, trả lại 200
3. Workflow trong quá trình cố định  cam kết  trạng thái trước khi sụp đổ ──
4. Phòng làm việc 恢复; xem  đã được phê duyệt nhưng chưa thực hiện ; tái thực hiện 
5. Tác dụng phụ 触发两次──

缓解方式: 在执行前持久化一个 in-flight意图,使用无机关键 执行,然后只有在动作后验证成功时才标记为 承诺──如果动作触发但状态写入失败,你就知道需要验证,并且在必要时重新触发──如果状态写入成功但动作失败,你会验证,并通过恢复路径 精确触发一次──


```figure
checkpoint-replay
```

## Sử dụng nó

`code/main.py`实现一个带检查点的工作流,包含无限能力、先决条件、验证 和反弹――驱动器 模拟四个场景:干净运行、崩后的重试(无限能力 捕获) 预定条件失败(工作流中止且不触发动作) 验证失败(触发反弹) ⋅

## 交付 nó

`outputs/skill-rollback-rehearsal.md`Để đề xuất dòng công việc  thiết kế thử nghiệm thử nghiệm quay trở lại,并审计 điểm kiểm tra hậu quả

## 练习

1. 运行 `code/main.py`❖验证四个场景── đối với trường hợp xảy ra tai nạn trong khi tham gia, xác nhận động tác trong nhiều lần thử lại Trung chỉ触发一次──

2. 修改 mark như đã làm trước, sau đó làm nó 模式, để trạng thái viết 在动作后触发──重新运行崩盘 场景──测量触发了多少重复动作──

3. Để một kế hoạch tái tạo cụ thể (ví dụ: post to a Slack channel) , nó sẽ được phân loại như là trong băng, bù đắp hoặc ngoài băng.

4. 选择一个你熟悉的工作流程――识别每个状态转换――为每个转换标记耐久性要求(persist / do not persist)――统计你当前还没有持久化的数量――

5. Thử nghiệm quay trở lại lặp lại: thiết kế một kết thúc đến kết thúc thử nghiệm, vận hành dòng công việc thực sự, để nó sụp đổ, và xác nhận con đường quay trở lại bị触发.

## 关键术语

| Term | 人们的说法 | 它真正的含义 |
|---|---|---|
| Checkpoint | “保存点” | 每一次 graph-state 转换都会持久化到 durable store |
| Lease | “Worker 声明” | 短期声明，表示某个 worker 正在执行一个 run；崩溃时过期 |
| Precondition | “状态关卡” | 断言状态仍与已批准动作保持一致 |
| Post-action verify | “重新读取检查” | 确认 side effect 确实在目标系统中发生 |
| In-band rollback | “直接撤销” | 用逆向操作反转 side effect |
| Compensating transaction | “SAGA 撤销” | 一个新的动作，用来抵消原动作 |
| Mark-as-done-first | “状态写入顺序” | 在从 commit 返回前持久化 committed 状态 |
| Article 14 | “EU AI Act 人类监督” | 操作性含义：可查询 checkpoint、已演练 rollback、可审计 trail |

## 延伸阅读

- [Microsoft Agent Framework — Checkpointing and HITL](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) Định hướng kiểm soát nguyên thủy và thu hồi thuê
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) Các đối tượng bền 作为状态基底。
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 监管基线。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) khung hợp lý của dòng công việc dài hạn.
- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) Claude Code Routines' workflow 形态。
