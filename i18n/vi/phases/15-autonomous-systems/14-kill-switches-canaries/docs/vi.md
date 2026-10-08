# Đánh bật tắt, phá mạch và Canary Token

> Kill switch là một đại lý duy trì  sửa đổi mặt ngoài boolean  Redis key ✓ pha tính năng ✓ ký kết cấu hình  sử dụng cho hoàn toàn tắt đại lý  Circuit breaker 粒度更细: nó sẽ kích hoạt theo một chế độ cụ thể (ví dụ: liên tục năm lần gọi cùng một công cụ), tạm dừng có vấn đề, và nâng cấp lên nhân tạo  Canary token 继承经典 lừa dối kỹ thuật: một giấy chứng nhận giả hoặc bản ghi honeypot, đại lý không có lý do hợp lý nào để chạm vào nó; một lần truy cập sẽ phát hành cảnh báo  Dữ liệu eBPF của các node (ví dụ: Cilium) có thể được phát hành trong các node bị cách ly trong lõi  Dữ liệu pháp lý công cộng của các node;  Phòng lưu của Cilium  Báo cáo giới hạn, không được gọi là các giới hạn, trong việc tải dữ liệu của P99 độ trễ thấp 1 giây dựa trên chính sách truyền thông của bạn                                                                                                                                              

**Type:** Learn
**Languages:** Python (stdlib, three-detector simulator: kill switch, circuit breaker, canary)
**先修要求：**Giai đoạn 15 · 13 (chế độ chi phí), Giai đoạn 15 · 10 (Phương thức cho phép)
**Time:** ~60 minutes

## 问题

Các nhà quản lý chi phí (đọc 13) giới hạn là đại lý có thể chi tiêu bao nhiêu. Chúng không giới hạn đại lý có thể làm gì trong ngân sách. Một đại lý có giới hạn tốc độ 50 đô la vẫn có thể tháo một bí mật, xuất bản bài đăng sai lầm, hoặc xóa một nguồn lực.

Bài học này bao gồm ba loại máy dò nằm bên cạnh lớp chi phí:

1. **Kill switch**: Bảo tồn đại lý 触达范围之外的布尔式 tắt nút.
2. **Circuit breaker**: tạm dừng dò mẫu hành động của một đường dẫn cụ thể
3. **Canary token**Không có lý do hợp lý để chạm vào nhân viên của nó sẽ bị xúc động và phơi bày bản thân.

Đây là những kỹ thuật trước LLM. Kỷ lệ lừa đảo, phá vỡ giới hạn tốc độ và tính năng tiêu diệt đều sớm hơn các đại lý tự trị. Một phần mới là bề mặt tấn công: đại lý sẽ đọc nội dung không thể tin được. Bài học 11.

## 概念

### Động cơ tắt

Kill switch là một đại lý có thể đọc nhưng không thể viết của boolean.

- **托管服务中的 feature flag。**Thả lên: Đen Đen, Đứng, Thả ra, Tải lên trong vài giây.
- **agent 轮询的 Redis key。**简单; yêu cầu hành động của đại lý 在每一轮都检查──
- **object storage 中的 signed config。**Đặc vụ trong quá trình bắt đầu ký kết; từ chối các quốc gia chưa ký kết.
- **OS-level signal 或 container-lifecycle kill。**Docker `kill`、Kubernetes `kubectl delete pod`、Systemd dừng lại.

Động cơ giết người chính xác có các thuộc tính sau:

- Đại lý không thể đặt nó.`off`◊( nó tồn tại trong chứng chỉ của đại lý 没有写权限的系统中──)
- Nó sẽ được kiểm tra trên mỗi hành động hậu quả, không chỉ là khởi động kiểm tra.
- Khi nó đóng cửa, đại lý không làm bất cứ điều gì có thể quan sát được từ bên ngoài, bao gồm cả đăng ký hệ thống của đại lý.
- Cần khởi động lại là một động tác nhân tạo rõ ràng, chứ không phải là thời gian tự động.

### Máy cắt mạch

Bộ cắt mạch 暂停 là mô hình cụ thể, chứ không phải là toàn bộ đại lý.

- **Closed**: hành động được phép.
- **Open**Động thái bị chặn đứng.
- **Half-open**Sau khi làm lạnh, cho phép 13 lần thử nghiệm; thành công sẽ đóng cửa, bất kỳ thất bại còn lại nào sẽ mở lại.

Các tác động liên quan đến đại lý:

- 连续五次相同的工具调用 (连续五次相同的工具调用)
- Cùng một công cụ trong các đầu vào khác nhau 上连续五次失败 (không thành công hệ thống)
- Tốc độ gọi công cụ  vượt quá ngưỡng ((Dạy học 13 tốc độ)。
- Trong bài đọc nội dung không tin cậy (đọc bài học 11) sau đó调用 cụ thể (ví dụ:`file.delete`(■)

### Các token Canary

Các mã thông báo Canary (từ còn gọi là honeyokens) là đại lý 永远不应触碰的输入――访问就是警报――

Ví dụ:

- môi trường trung tâm giả `AWS_SECRET_ACCESS_KEY`, không có bất kỳ đặc quyền thực tế nào.
- 带有已知哨兵值 标记的假数据库记录──任何读取或更新都会触发警报──
- Trong không gian làm việc có file giả.
- session start 时注入的假记忆输入──如果它出现后续输出中,说明记忆已被泄露──

Canary  thiết kế phải nhắm vào dòng công việc cụ thể. Một đại lý có lý do hợp lý để chạm vào Canary. Chỉ tạo ra tiếng ồn.

### Tại sao nên phân cấp sử dụng thống kê và giới hạn cứng

Các máy dò thống kê (EWMA, CUSUM, Tool-Call rates, trên điểm z) sẽ thích ứng với dòng động cơ cơ sở.

Các giới hạn hiến pháp cứng rắn (Dân học 17) sẽ không 曲──作为宪法规则的`secrets@` 更简单、可审计,并且不能被缓慢漂移 钻空子──分层模式是:

### Thông qua chuyển hướng dữ liệu eBPF , thực hiện kiểm dịch

Chính sách mạng dựa trên eBPF của Cilium có thể được ghi lại trong các phân khúc của pod được cách ly ở cấp lõi 重写 đến các điểm chuẩn công khai của Cilium. 报告称, độ trễ của đường dữ liệu P99 trên TCP_RR trên 1 毫秒 thấp hơn; trong cluster của bạn,* kích hoạt* ngân sách đồng hồ tường của cách ly chính sách chính xác bởi cách cập nhật chính sách 如何从控制平面 传播到节点决定;; trên Kubernetes của người vận hành tải trước, vài trăm 毫秒 là thực tế; độ trễ tùy thuộc vào kích thước cluster và phù hợp với sự phù hợp)  Điều này cho bạn hai điều: không đại lý sẽ phântrét bất kỳ nội dung thực tế nào, và hành vi trong cluster sẽ được quan sát hoàn toàn.

### Không có máy dò nào có thể bắt được gì

- **由 allowed primitives 组合而成的 semantic attacks。**Mỗi hành động riêng lẻ đều đi qua mỗi máy dò; vấn đề nằm ở thành phần. Đây là sự thất bại của chế độ Auto trong bài học 10.
- **把 detector 本身纳入 payload 的 attacks。**Nếu đại lý 读取一个页面, trên đó viết  trước khi bạn hành động, vô hiệu hóa các canary, và đại lý cũng có khả năng này, thì phát hiện sẽ bị thỏa hiệp 已.


```figure
circuit-breaker
```

## Sử dụng nó

`code/main.py`模拟一个短代理轨迹 通过三类探测器――外部 dict 中保存的杀伤开关;一个会在五次相同的工具中调用 时触发的电路断裂器;一个读取后会触发警报的卡文件――它输入一个合成轨迹:

## 交付 nó

`outputs/skill-tripwire-design.md`会审查 đại lý triển khai của dự kiến phát hiện viên đống,并标记 lỗ hổng(缺失杀开关、缺失卡尼尔、断路门 过松) 

## 练习

1. 运行 `code/main.py`▽ xác nhận máy cắt mạch ở lượt 5 ((第五次相同调用)触发,并且 kanary 在 lượt 9 ((fake-key read)触发。

2. 添加一个统计探测器:工具调用率 上的 EWMA z-score。输入一条缓慢漂移的轨迹,并显示探测器 从不触发。然后添加一个硬极(10分内不超过50次工具调用),并显示硬极 在同一条轨迹上触发。

3. Để làm cho các trình duyệt của bạn, hãy thiết kế một nhóm mã thông báo canary.

4. 阅读 Cilium network-policy docs──具体描述一个出口转向隔离流:哪个政策选择器、哪个 pod、哪个出口重写、哪个警报──是什么决定从决定隔离到首个转向包的墙钟延迟?

5. Để làm việc với một nhân viên bị chuyển đổi, người đó phải ghi lại những gì?

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Kill switch | “Off button” | 位于 agent 编辑面之外的 boolean；在每个 consequential action 上检查 |
| Circuit breaker | “Pattern pause” | 针对重复、failure rate 或 rate-limit 的 action-specific trip |
| Canary token | “Honeytoken” | agent 没有正当理由触碰的诱饵；访问会触发 alert |
| Honeypot | “Forensic sandbox” | 被 redirect 的 traffic / workspace，用于观察被 quarantine 的 agent |
| EWMA | “Moving average” | Exponentially weighted；会适应 drift（feature + bug） |
| CUSUM | “Cumulative sum” | 检测相对 baseline 的 sustained shift |
| Hard limit | “Constitutional rule” | 不会适应；无论历史如何都保持常量 |
| Constitutional limit | “Always-true rule” | 绑定到 Lesson 17 的 constitution；不能被 agent 编辑 |

## 延伸阅读
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) tự động các đại lý của chuyển đổi giết và khung cắt mạch
- [Microsoft Agent Framework — HITL 与监督](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) sản xuất 治理模式。
- [OWASP LLM / Agentic Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) 检测与响应要求──
- [Cilium — Network policy and eBPF](https://docs.cilium.io/en/stable/security/network/) chuyển hướng thoát cấp pod và các mô hình honeypot pháp y
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)  như các hạn chế hiến pháp  của cấm mã cứng 
