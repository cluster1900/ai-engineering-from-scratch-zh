# Tự cải thiện giới hạn 设计

> Nghiên cứu đã nhận được bốn nguyên thủy của vòng tự cải thiện tự giới hạn. Các biến thể chính thức phải được thiết lập trong mỗi lần chỉnh sửa. Các neo liên kết không thể được sửa đổi. Các hạn chế đa mục tiêu yêu cầu mỗi chiều kích: an toàn, công bằng, vững chắc. Chúng phải được thiết lập, không chỉ là hiệu suất. Khám phá sự lùi lại sẽ được thực hiện trong các chỉ số lịch sử.

**Type:** Learn
**语言：**Python (stdlib, vòng giới hạn với kiểm tra không biến đổi)
**Prerequisites:** Phase 15 · 07 (RSI), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

Các mô phỏng đua của bài học 7 cho thấy, sự khác biệt tốc độ nhỏ sẽ tạo ra sự khác biệt khổng lồ. Nghiên cứu trường hợp DGM của bài học 4 cho thấy, vòng có thể hoạt động chủ động điều khiển các nhà đánh giá của mình.

ICLR 2026 RSI Workshop summary (openreview.net/pdf?id=OsPQ6zTQXV) đã xác định bốn loại nguyên thủy như vậy. RSP của Anthropic v3.0 (Lớp 19) và FSF của DeepMind v3 (Lớp 20) đều được trích dẫn trong ngưỡng khả năng.

诚实表述是:这些是减缓. Kết quả của luận thông tin hạn chế bất kỳ hệ thống nào có thể chứng minh phạm vi tính chất hệ thống tiếp theo của mình, và hiện tại không có thiết kế nào đóng cửa vấn đề này.

## 概念

### Primitive 1: Invariants chính thức

Invariant là một thuộc tính phải được tạo ra trong mỗi lần tự sửa đổi trước sau. Ví dụ:

- Phân phối sản lượng 以固定的宪章 tiêu đề 为条件 (Dạy 17)
- Không có công cụ gọi hướng đến không được ủy quyền điểm cuối.
- Tưởng thức viết 通过已记录、已签名的路径──
- Các mô-đun của nhà đánh giá hash phù hợp với phiên bản phê duyệt.

Invariants bởi vòng không thể chỉnh sửa của kiểm tra mã bên ngoài. Nếu một số thay đổi được đề xuất vi phạm Invariant, sẽ bị từ chối.

难点在于选择既对安全需要又能在合理时间内计算的变量―― quá xác định sẽ cản trở tiến bộ; xác định thiếu xác định sẽ làm cho vòng lặp trở nên có tính chất quá quan trọng――

### Primitive 2: Anchor đường thẳng

Anchor alignment là biểu hiện không thể thay đổi của loop 核心目标, được cố định trên bề mặt chỉnh sửa của loop 之外── ví dụ:

- Mỗi lần kêu gọi đều từ văn bản hiến pháp chỉ đọc được.
- 位于独立存储库、具有独立访问控制的评价员──
- Được ký bởi con người và trong mỗi chu kỳ 重新验证 của công cụ-hơn phép biểu hiện.

Phương pháp của neo là ngăn chặn sự trôi dạt khách quan. Loop có thể cải thiện cách theo đuổi mục tiêu của mình, nhưng không thể chỉnh sửa mục tiêu chính nó.

微妙的失败模式: ngay cả khi vòng không thể chỉnh sửa neo, đã được đọc qua cách chuyển động của vòng lặp  vẫn có thể giải thích lại nó. AI Hiến pháp (Dạy 17) m thực sự dựa trên lý do, để xử lý tình huống mới; dẫn dắt giải thích tồn tại trong lớp lý luận này.

### Primitive 3: các hạn chế đa mục tiêu

Chỉ tối ưu hóa một vòng lặp điểm số thang sẽ tìm ra các đường tắt.

- Hiệu suất (chỉ số chuẩn cấp nhiệm vụ)
- An toàn (đánh giá nhóm đỏ n biết xấu n mức độ từ chối)
- Sự công bằng ((những nhóm phụ nhạy cảm trên các giới hạn tác động khác nhau)
- Đang tính ((Số thử nghiệm OOD]], xử lý đầu vào bất đồng)

Chỉ khi mỗi hạn chế được thành lập, sửa đổi mới được chấp nhận.

### Primitive 4: Khám phá sự lùi

Điểm số của mỗi chu kỳ sẽ tương đương với phân phối lịch sử so sánh. Hơn mức độ dung nạp phân phối.

Một thực tế thực hiện: lưu trữ gần đây N 个周期 của điểm số mỗi nhiệm vụ. Mỗi chu kỳ mới tính toán mỗi nhiệm vụ delta. Nếu bất kỳ delta nào thấp hơn ngưỡng, thì từ chối chu kỳ này và được đánh giá bởi con người.

### 信息论限制

Sự phức tạp của Kolmogorov và lý thuyết của Lob đối với hệ thống có thể chứng minh phạm vi bản chất của mình đã đặt ra giới hạn trên. Cơ chế Godel chính thức của Schmidthuber (Dân học 4) 准 là giới hạn cao nhất của loại này; hiện tại vẫn chưa có người nào hoàn thành chứng minh phi thường. Kết quả của Lob cho thấy: Nếu một hệ thống có thể chứng minh rằng nếu tôi chứng minh tôi nên làm X, tôi sẽ làm X, nó sẽ làm X trong tình huống không chứng minh mình nên làm X, đây là một thất bại tham chiếu tự trị nổi tiếng.

Điều này có nghĩa với những thứ nguyên thủy của chúng ta là: chúng không thể đóng cửa các vấn đề an toàn. Chúng sẽ làm cho thất bại im lặng trở nên đắt tiền hơn. Một vòng lặp độc hại hoặc bị dẫn dắt. Nếu bản gốc sẽ vượt qua kiểm tra thiếu sót, bây giờ phải tích cực phá vỡ một kiểm tra rõ ràng, và đây là một dấu hiệu dễ dàng hơn để kiểm tra.

### Một ví dụ đã được thực hiện

假设某某代理 提出一次编辑──gating stack:

1. Kiểm tra không biến đổi: module hashes, biểu hiện giấy phép công cụ, tiêu đề hiến pháp.
2. Kiểm tra neo: tuyên bố khách quan với phê duyệt phiên bản phù hợp (byte-wise hoặc ngữ nghĩa)
3. Đánh giá đa mục tiêu:các trục hiệu suất, an toàn, công bằng, độ bền.
4. Khám phá sự lùi: không có trục nào của sự giảm vượt quá dung nạp.

Tất cả đều phải qua, sửa đổi 才能落地. Bất cứ thất bại nào cũng sẽ bị tạm dừng.


```figure
bounded-gates
```

## Sử dụng nó

`code/main.py`Trong Bài học 4 của DGM 风格玩具 上运行一个有限的自我改进循环, nhưng trên đó chồng lên bốn nguyên thủy này. Mỗi nguyên thủy đều có thể độc lập kích hoạt hoặc tắt. Mục tiêu của bài thuyết trình là: mỗi nguyên thủy đều có thể nắm bắt một lớp thất bại cụ thể, trong khi việc di chuyển bất kỳ một trong số đó đều sẽ giúp đối phó với lớp thất bại thông qua.

## 交付 nó

`outputs/skill-bounded-loop-review.md`Hội đồng kiểm tra một vòng lặp giới hạn được đề xuất, và đánh giá nó thực sự thực hiện ra những gì trong bốn nguyên thủy, thay vì chỉ xem nó tuyên bố đã thực hiện ra những gì.

## 练习

1. Trong tất cả các nguyên thủy đều được khởi động trong trường hợp chạy .`code/main.py`❖ Đoán xác nhận vẫn có thể cải thiện trong metric chính, đồng thời không để hack thắng.

2. 禁用回归检测――构建一个输入,使它导致沉默能力损失被接受――

3. 禁用 đa mục tiêu hạn chế── hiển thị vòng trong trục hiệu suất 上收, đồng thời trục an toàn 下降──

4. Để lập trình viên  thiết kế một neo sắp xếp.

5. 阅读 ICLR 2026 RSI Workshop tóm tắt。 chọn bốn nguyên thủy trong số đó,并为当前状态艺术 提出一个具体改进──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|---|---|---|
| Invariant | “始终为真的属性” | 每次 edit 前后由外部代码检查的属性 |
| Alignment anchor | “固定的目标” | 位于 loop edit surface 之外的不可变 core-goal representation |
| Multi-objective constraint | “所有 axes 都必须成立” | Performance、safety、fairness、robustness——全部必需 |
| Regression detection | “下降时暂停” | 当历史 metric deltas 暗示 capability loss 时暂停 loop |
| Kolmogorov bound | “信息论限制” | 限制系统能够证明其自身后继系统性质的范围 |
| Lob's theorem | “self-reference 陷阱” | 系统可以在没有证明自己应该做某事的情况下，依据“我应该”采取行动 |
| Gate stack | “分层检查” | 多个 primitives 的组合；任何 failure 都会拒绝 edit |
| Bounded improvement | “mitigation，而不是 proof” | 提高 silent-failure 成本；不会关闭 safety problem |

## 延伸阅读

- [ICLR 2026 RSI Workshop summary (OpenReview)](https://openreview.net/pdf?id=OsPQ6zTQXV)4 nguyên thủy của người
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) ngưỡng khả năng đa mục tiêu。
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) sẽ theo dõi sự sắp xếp lừa đảo như nguyên thủy không thay đổi.
- [Schmidhuber (2003). Godel Machines](https://people.idsia.ch/~juergen/goedelmachine.html) Những người tiên phong này có bằng chứng chính thức về tổ tiên.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) Lòng dồn hợp dựa trên lý do。
