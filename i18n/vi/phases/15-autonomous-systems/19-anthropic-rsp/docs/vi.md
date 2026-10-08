# Chính sách quy mô chịu trách nhiệm nhân loại v3.0

> RSP v3.0 được ban hành vào ngày 24 tháng 2 năm 2026, thay thế chính sách năm 2023  Mức độ giảm thiểu hai tầng: Các hành động của Hội đồng nhân tạo đơn phương, cũng như nội dung nào được diễn tả như các khuyến nghị trong phạm vi ngành công nghiệp (bao gồm RAND SL-4 tiêu chuẩn an toàn)  Bản đồ đường bộ an toàn biên giới và Báo cáo rủi ro mới được bổ sung, như một tài liệu thường xuyên, chứ không phải là một lần giao hàng  loại bỏ cam kết tạm dừng năm 2023  giới thiệu AI R&D-4  giá trị: một khi vượt quá mức giá trị này, Anthropic  phải phát hành một luận thuyết minh chứng, xác định đối với rủi ro và giảm thiểu các biện pháp  Claude Opus 4.6 chưa vượt qua mức độ này  Anthropic trong thông báo v3.0 cho biết,  giá trị có thể loại bỏ tình huống này là khó khăn   Antropic v Safer RSP 2023 sẽ không được đánh giá 2.0.3.

**类型：**Học tập
**语言：**Python(stdlib,RSP 值决策引擎)
**先修：**Giai đoạn 15 · 06(AAR),Giai đoạn 15 · 07(RSI)
**时间：**~ 45 phút

## 问题

Các chính sách quy mô được phát hành bởi Frontier 实验室, một phần là tài liệu kỹ thuật, một phần là tài liệu quản lý, một phần là tín hiệu gửi đến các nhà quản lý. RSP v3.0 là tài liệu hiện tại của nhân chủng.

Sự khác biệt giữa v3.0 và v2.0 là một đơn vị phân tích hữu ích. Nó đã được bổ sung gì: Border Safety Roadmaps, Risk Reports, AI R&D-4 value, xóa gì: Thỏa thuận tạm dừng năm 2023 tái diễn tả gì: Thời gian giải phóng được chia thành Anthropic  đơn phương hành động và đề xuất ngành công nghiệp hai cấp độ.

## 概念

### 双层缓解措施时间表

- **Anthropic 单方面行动**Bất kể các phòng thí nghiệm khác làm gì, các thành phố nhân tạo sẽ làm gì.
- **行业范围建议**:Anthropic 认为行业应集体采取什么行动――包括RAND SL-4 安全标准――这些不是人类的承诺;它们是政策倡议――

Trong v2 không có cấu trúc hai tầng này. Điều này có nghĩa là người đọc cần xem mỗi cam kết nằm ở đâu.

### AI R&D-4  giá trị

Đây là một khả năng quan trọng tiếp theo của RSP v3.0  giá trị. cụ thể là: một phần đáng kể của mô hình nghiên cứu AI có thể tự động hóa chi phí cạnh tranh. Một khi Anthropic  nghĩ rằng một mô hình vượt quá giá trị này, họ phải phát hành một bài luận chính xác trước khi tiếp tục mở rộng quy mô, nhận dạng rủi ro không phù hợp và các biện pháp giảm thiểu.

Theo thông báo v3.0, Claude Opus 4.6 chưa vượt qua giá trị này. Tài liệu bổ sung:有把握地排除这种情况正变得困难.

Bài học 6 (Thiết học Tích ứng tự động) và Bài học 7 (Thiết học tự cải thiện lặp lại) trực tiếp liên quan đến giá trị này.

### Bản đồ đường bộ an toàn biên giới và báo cáo rủi ro

v3.0 sẽ tạo ra 2 loại đồ tạo vật:

- **Frontier Safety Roadmap**: Façãun dossiê futur, mô tả các nghiên cứu dự kiến về an ninh, dự đoán và giảm thiểu năng lực trong kế hoạch.
- **Risk Report**: xuất bản sau đó về mô hình cụ thể của các tài liệu về quan sát, mô tả khả năng quan sát và dư风险.

Cả hai đều là công khai. Cả hai đều theo các tuyên bố về tốc độ cập nhật. Mục đích của chúng là: Người đọc có thể theo dõi những gì Anthropic nói trong Roadmap sẽ làm, và liệu nội dung của họ trong báo cáo rủi ro có phù hợp không.

### 删除暂停条款

2023 RSP 包含明确暂停承诺: Nếu mô hình vượt quá giá trị 能力, đào tạo sẽ tạm dừng cho đến khi biện pháp giảm thiểu đạt vị trí.

 Thấu luận chính sách hỗ trợ sự thay đổi này là: điểm chuẩn khả năng định giá năm 2023 đến năm 2026 xuống còn không thể đạt được, vì điểm chuẩn đã được thu nhỏ lại.

### SaferAI 的下调

SaferAI là một tổ chức độc lập, chịu trách nhiệm đánh giá RSP 风格文档──他们的公开评分:2023 Anthropic RSP 得分 2.2(该量表中 4.0 代表当前最佳RSP,1.0 为名分)──v3.0 得分 1.9──这使 Anthropic từ中等降至弱,与OpenAI和DeepMind同步进入弱类──

Các yếu tố giảm cấp được cung cấp bởi SAFEAI:
- 定性值取代定量值──
- 暂停承诺被删除──
- Các biện pháp giảm giá trị của AI R&D-4 được mô tả là 正面论证, chứ không phải là các biện pháp cụ thể
- 评审机制依赖Anthropic's Safety Advisory Group,独立监督有限.

### 本课不是什么

Đây không phải là một phần của quy định. Không phải là quy định của RSP v3.0; không có gì bắt buộc người ta tuân thủ nó.


```figure
a5-rsp-ladder
```

## Sử dụng nó

`code/main.py`Thực hiện một động cơ quyết định nhỏ, lập bản đồ RSP  giá trị đánh giá cấu trúc: cho một mô hình ứng cử viên và một nhóm đo năng lực, trả lại AI R&D-4  giá trị liệu có được vượt qua  các chương trình nghiên cứu trực tiếp cần thiết, cũng như việc triển khai liệu có thể tiếp tục  Nó có ý định giữ đơn giản; trọng tâm là đưa ra các biểu hiện logic trong tài liệu 

## 交付 nó

`outputs/skill-scaling-policy-review.md`根据 v3.0 参考结构审查一个扩展政策(Anthropic、OpenAI、DeepMind或内部政策):双层结构、值、暂停承诺、独立评审──

## 练习

1. 运行 `code/main.py` nhập 3 mô hình tổng hợp ở mức độ khác nhau của năng lực  xác nhận  giá trị đánh giá theo dự kiến làm việc,并 tạo ra đúng mô hình chứng minh chính xác 

2. 完整阅读 RSP v3.0(32页)  nhận ra mỗi mục nằm trong phạm vi ngành  đề xuất  cấp độ của cam kết  Trong số những cam kết trong v2 中会 thuộc về Anthropic 单方面?

3. 阅读SaferAI's RSP 评分方法──将他们的 Rubric 应用于文档,复现 v3.0 的 1.9 分──哪一行对降级影响最大的 rubric?

4. Thỏa thuận tạm dừng năm 2023 đã được xóa bỏ. Thỏa thuận thay thế được đưa ra, đồng thời thừa nhận vấn đề tăng cường hạn chế năm 2026, duy trì sự tin cậy của chính sách.

5. Để so sánh RSP v3.0 với OpenAI Preparedness Framework v2 ((Dạy 20) hãy chọn một khía cạnh v3.0 mạnh hơn.

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| RSP | “Anthropic 的 scaling policy” | Responsible Scaling Policy；v3.0 于 2026 年 2 月 24 日生效 |
| AI R&D-4 | “研究自动化阈值” | 以有竞争力的成本自动化大量 AI 研究的能力 |
| Affirmative case | “安全论证” | 公开论证风险已被识别且缓解措施足够 |
| Frontier Safety Roadmap | “前瞻计划” | 关于计划中的安全工作和预期能力的常设文档 |
| Risk Report | “模型回顾” | 关于发布后观察到的能力和剩余风险的常设文档 |
| Two-tier mitigation | “单方面 vs 行业” | 区分 Anthropic 承诺与行业建议 |
| Pause commitment | “2023 条款” | 明确承诺暂停训练；已在 v3.0 中删除 |
| SaferAI rating | “独立 RSP 评分” | 第三方 rubric；v3.0 得分 1.9（v2 为 2.2） |

## 延伸阅读

- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) 完整的 32 页政策──
- [Anthropic — RSP v3.0 announcement](https://www.anthropic.com/news/responsible-scaling-policy-v3) v2 kể từ sau sự thay đổi.
- [Anthropic — Frontier Safety Roadmap](https://www.anthropic.com/research/frontier-safety) RSP v3.0 链接的常设文档──
- [Anthropic — Risk Report: Claude Opus 4.6](https://www.anthropic.com/research/risk-report-claude-opus-4-6) 关于当前边境模型 的回顾──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) Kết nối AI R&D-4 với tính tự chủ của các nhà nghiên cứu.
