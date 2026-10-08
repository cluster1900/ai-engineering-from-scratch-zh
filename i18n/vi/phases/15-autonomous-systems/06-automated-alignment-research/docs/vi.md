# Nghiên cứu tự động hóa sắp xếp (Anthropic AAR)

> Anthropic trong sandbox độc lập并行运行多个Claude Opus 4.6 Autonomous Alignment Researchers 团队,并通过一个共享论坛 协调;日志 của论坛 nằm bên ngoài bất kỳ sandbox (vì vậy đại lý 无法删除 bản ghi chép của mình)  Trong vấn đề đào tạo yếu đến mạnh, AAR đã vượt qua các nhà nghiên cứu con người Anthropic 自己的总结指出, quy định workflow 往往会限制 AAR 灵活性并降低性能Automation alignment research là một bước, nó sẽ làm giảm đường thời gian bị nén đến RSP thực sự phải kiểm tra những dòng thời gian chính xác 风险 

**Type:** Learn
**Languages:** Python (stdlib, parallel-research-forum simulator)
**前置要求：**Giai đoạn 15 · 05 (AI Scientist v2), Giai đoạn 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

Nghiên cứu phù hợp  tiêu thụ rất nhiều thời gian của các nhà nghiên cứu nhân loại. Như giám sát có thể mở rộng, đặc điểm phần thưởng hoặc đào tạo yếu đến mạnh, những vấn đề như thế, mỗi vòng thử nghiệm 代都需要数周.

Nghiên cứu khớp nối tự động (AAR) 追问的是: Those capacities are exceeding alignment progress of the same batch of frontier models, are also able to help bridge this gap―Anthropic 2026 Year About a project run by AAR 关于一项 weak-to-strong-training 研究报告(alignment.anthropic.com/2026/automated-w2s-researcher/), là một trong những kết quả sớm nhất của hệ thống được triển khai này.

Kết quả thực sự là tích cực: AAR trong một vấn đề nghiên cứu tốt hơn so với cơ sở con người. Nhưng kết quả này cũng tập trung mọi lo ngại trong giai đoạn này đã được triển khai vào một hệ thống. Nếu nghiên cứu liên kết có thể được tự động hóa, thì một phần của các biện pháp bảo vệ có thể được tự động hóa.

## 概念

### 架构(按公开描述)

- **Parallel agents.**Nhiều Claude Opus 4.6  thí dụ như AAR 运行, mỗi thành phần nằm trong sandbox độc lập 中。 sandbox  hạn chế hệ thống tệp、 mạng và quy trình 暴露面──
- **Shared forum.**Nghiên cứu phát hiện sẽ được đăng lên một diễn đàn chia sẻ, lưu trữ của nó backend nằm bên ngoài mỗi sandbox 
- **Task allocation.**Một hàng nhiệm vụ được thiết kế bởi con người sẽ phân bổ các vấn đề nghiên cứu cho AAR。AAR  đề xuất phân hủy, vận hành thí nghiệm,并 viết phát hiện。
- **Weak-to-strong training focus.**Các nghiên cứu đã được công bố đã xử lý về đào tạo từ yếu đến mạnh, tức là sử dụng mô hình giám sát yếu hơn để đào tạo mô hình học sinh mạnh hơn.

### Tại sao sổ sách ra khỏi hộp cát  rất quan trọng

Log-integrity là sự khác biệt giữa các thí nghiệm được kiểm soát và các thí nghiệm bị tổn hại tiềm tàng. Nếu AAR có thể chỉnh sửa nhật ký của mình, chúng có thể che giấu thất bại hoặc thử nghiệm đáng ngờ.

Trong các thuật ngữ cơ sở hạ tầng, là sử dụng ghi chép thông qua lưu trữ bên ngoài chỉ có bản ghi kèm theo (ví dụ như S3 object-lock ∞ immutable Datadog logs) ∞ Agent không sửa đổi giấy chứng nhận ghi chép trước đây ∞ Đây là mô hình tương tự như nhóm an ninh doanh nghiệp năm 2026 được sử dụng để xây dựng các đường viếng kiểm toán phần mềm chống cướp ∞

### quy định-thời gian làm việc

Báo cáo của Anthropic cho thấy, các dòng công việc được quy định thường sẽ hạn chế tính linh hoạt và giảm hiệu suất của AAR. Nói cách khác: Nếu một nhà thiết kế con người từng bước viết một kế hoạch nghiên cứu, hiệu suất của AAR sẽ khác so với chỉ cho một mục tiêu cao và cho phép sự phân hủy tự do của nó.

Sự linh hoạt của AAR cũng được phép sử dụng không được phép phân hủy, sử dụng công cụ mới và sự linh hoạt của mục tiêu-tham nhũng. Việc này là một quyết định thiết kế không gian: bao nhiêu linh hoạt đủ để thay đổi vượt qua khả năng của con người, đồng thời không cho đại lý để lại mục tiêu của mình phổ biến đến không gian không phân phối?

### 压缩风险

RSP v3.0 (Dạy học 19) giới thiệu một ngưỡng khả năng R&D AI: có chi phí cạnh tranh so với công cụ AI + con người, khả năng tự động hóa hoàn toàn đường ống R&D AI. FSF v3 của DeepMind chứa một mức độ tự trị R&D ML tương tự. Hai khung đều đặt ngưỡng này để xem xét các điều kiện của cấp độ kiểm soát cao hơn.

AAR còn xa ngưỡng này: nó đã tự động hóa một phần của đường ống dẫn (đối với nghiên cứu sắp xếp các nhiệm vụ cụ thể), nhưng vẫn chưa có vòng phát triển khả năng tự động hóa từ đầu đến cuối.

Nếu nghiên cứu liên kết và nghiên cứu khả năng tăng trưởng với tốc độ tương đối gần, thì bề mặt rủi ro không phù hợp ít nhất sẽ tăng trưởng với tốc độ tương tự như khả năng. Nếu khả năng tăng trưởng nhanh hơn (trendy lịch sử như vậy), khoảng cách sẽ mở rộng. Đó là lý do tại sao AAR là một điều kiện tốt: mỗi sự sắp xếp bổ sung kết quả sẽ làm giảm khoảng cách nhỏ, và chỉ khi quá trình nghiên cứu là đáng tin cậy.

### AAR không thể thay thế gì

Nhân loại nghiên cứu viên đặt hàng nhiệm vụ ▌sửa đổi kết quả,并 nắm giữ quyền lực hiến pháp。AAR tăng tốc là đoạn trung của đường ống, chứ không phải là hai bên。Anthropic  đã xuất bản xuất bản đồng thời bao gồm đóng góp của AAR, cũng như các nghiên cứu viên nhân loại về việc phát hành gì, rút lại gì, cải tiến gì.

Đây là mô hình đề xuất-sau-thói-được áp dụng cho nghiên cứu chính nó phù hợp với bài học 15.


```figure
aar-forum
```

## Sử dụng nó

`code/main.py`模拟一个多AAR研究论坛──三个独立的研究代理并行运行, sẽ được phát hiện ra đăng trên một diễn đàn chỉ có phụ lục,并可选择进行操纵尝试──

观察:

- Việc khai thác gỗ ngoài hộp cát 如何捕获木材改尝试──
- Trong vấn đề khó hơn, cho phép phân bổ nhiệm vụ phân hủy tự do 如何优于固定工作流──
- Nếu log không phải là rõ ràng, đơn lẻ bị xâm phạm AAR 如何污染论坛的信号──

## 交付 nó

`outputs/skill-aar-deployment-review.md`là một hệ thống nghiên cứu tự động-sẵn sàng-đánh giá dự kiến Bộ.

## 练习

1. 运行 `code/main.py`❖ So sánh "thường công việc cố định" với "thường công việc tự do phân hủy" 设置.

2. 修改模拟器,让一个代理 尝试 log tampering──确认添加-only log 能检测到它──写一段话,准确描述检测信号在 log 中是什么样子──

3. 阅读 Anthropic's weak to strong AAR 报告―― tìm ra AAR  vượt quá nhiệm vụ cụ thể của nghiên cứu viên nhân loại――是什么让它适合自动化?

4. 设计一个任务队列分配政策,在AAR 灵活性 (更好结果) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 描述你将对对对对对对对对对对对对对对进行 A/B测 (详细)

5. 阅读 RSP v3.0 AI R&D-4 ngưỡng ⋅ dùng một đoạn mô tả, bạn nghĩ rằng những năng lực nào sẽ vượt qua ngưỡng này, trong khi AAR hiện tại chưa đạt được ⋅

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| AAR | "Automated Alignment Researcher" | 在 alignment problems 上 autonomously 运行的 Claude Opus 4.6 实例 |
| Weak-to-strong training | "Training a stronger model with a weaker supervisor" | AAR 表现超过人类的经典 scalable-oversight benchmark |
| Shared forum | "Where agents publish findings" | Append-only、out-of-sandbox storage |
| Out-of-sandbox log | "Agent cannot edit its own record" | Tamper-evident write-through 到 external storage |
| Prescribed workflow | "Step-by-step plan from human designer" | 限制 AAR；相较 free decomposition 往往降低性能 |
| Free decomposition | "Agent decides how to break the task" | 能力更强，更难 audit |
| AI R&D threshold | "RSP/FSF capability level" | 以有竞争力的成本完全自动化 R&D pipeline |
| Compressed timeline | "Alignment vs capability race" | 如果 capability 复合增长快于 alignment，misalignment 风险就会增长 |

## 延伸阅读

- [Anthropic — Automated Weak-to-Strong Researcher](https://alignment.anthropic.com/2026/automated-w2s-researcher/) nguồn chính。
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) Định hướng ngưỡng R&D AI
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) Quá rộng hơn về tự trị của đại lý.
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) Tỷ lệ tự trị R&D của ML trên các RSP 平行.
- [Burns et al. (2023). Weak-to-Strong Generalization (OpenAI)](https://openai.com/index/weak-to-strong-generalization/) AAR nhà xử lý vấn đề tầng dưới.
