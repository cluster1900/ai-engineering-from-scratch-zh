# Mô hình định tuyến  như một phương tiện cơ bản để giảm chi phí

> Một nhà môi giới năng động sẽ đánh giá mỗi yêu cầu (từ loại nhiệm vụ, chiều dài mã thông báo, tương tự kết hợp, sự tự tin), và đưa câu hỏi đơn giản, gửi cho mô hình rẻ, đưa câu hỏi phức tạp, nâng cấp đến mô hình biên giới, cũng được gọi là mô hình hỗn hợp. Các nghiên cứu trường hợp sản xuất cho thấy, trong US / UK / EU, chất lượng của các mã thông báo có thể giảm 20% đến 60%; trong SaaS lưu lượng cao, 30% cải thiện hiệu quả định tuyến sẽ chuyển thành 6 tỷ lệ hàng năm.$20/M 降到约 $0.40/M── phần lớn giảm từ các gói dịch vụ tốt hơn(Phase 17 · 04-09), không phải phần cứng──Routing là bạn đang không gây ra sự suy giảm sản phẩm, chuyển đổi giá như vậy thành mức chi phí theo cách margin──Phương thức thất bại là con đường nhỏ gọn: đường đưa 40%  đưa cho mô hình yếu hơn, các nhiệm vụ lý luận chất lượng cao xuống 3-5%, một quý không ai chú ý── sử dụng các métrics chất lượng trực tuyến cho đường 设 gate, thay vì chỉ phụ thuộc vào các thiết lập đánh giá ngoại tuyến──

**Type:** Learn
**Languages:** Python (stdlib, toy cascading router simulator)
**前置要求：**Giai đoạn 17 · 01 (Mảng tảng LLM được quản lý), Giai đoạn 17 · 19 (Gateway AI)
**Time:** ~60 分钟

## Học mục tiêu

- 解释 mô hình lốc: rẻ nhất với kiểm tra sự tin tưởng, sự tin tưởng thấp 时 leo thang.
- 枚举四个路由信号(tác phẩm phân loại nhiệm vụ, thời gian nhanh chóng, sự tương đồng với bộ cứng được biết đến, tự tin của lần đầu tiên)
- Trong mục tiêu định tuyến chia chia và dung nạp mất chất lượng 下计算 dự kiến chi phí hỗn hợp.
- Nói出能捕捉 rẻ-model creep của drift-monitoring metric (trang lượng trực tuyến)

## 问题

Bạn có thể dùng một mô hình lớp Haiku để xử lý hoàn hảo với chi phí 3% trên những...30% cần lý luận của GPT-5: mã hóa, toán học,... kế hoạch đa bước.

Nếu bạn đưa 70% đường đến mô hình rẻ, đưa 30% đường đến mô hình đắt tiền, trong chất lượng sản phẩm tương tự, kế toán của bạn sẽ giảm khoảng 65%. Đó là đường dẫn.

## 概念

### 4 tín hiệu định tuyến

1. **Task classification**: simple/complex/codegen/math/chat──可以是基于规则的分类器、小型 LLM(Haiku-class,$0.25/M),或到标签桶的嵌入式相似之──输出:route = rẻ / cân bằng / biên giới──

2. **Prompt length**:prompts >4K Token thường cần biên giới để giữ liên tục。prompts <500 Token thường không cần。

3. **Embedding similarity to known-hard set**Nếu truy vấn  gần một cái thùng cứng được biết đến ((nhiều > 0,88), trực tiếp leo thang đến biên giới。

4. **Self-confidence from first-pass**: gửi cho rẻ; nếu các bản kiểm tra nhật ký của mô hình  hiển thị sự tin tưởng thấp, hoặc nó từ chối, hoặc xuất ngôn ngữ bảo hiểm, hãy ở biên giới trên thử lại. Sẽ có khoảng 10% lưu lượng truy cập tăng độ trễ P95, nhưng trong 90% khác tăng tiết kiệm 50% +.

### 三种模式

**Pre-route**(前置分类器): tăng khoảng 5-10ms độ trễ;整体最快──

**Cascade**(mặt rẻ nhất, sự tự tin thấp 时 leo thang): trung bình thời gian trễ 约1.2x( chạy rẻ hơn, xác minh), leo thang 时约2x。 chất lượng sàn 最好。

**Ensemble route**(对样本并行运行廉价 和边界,由奖励模型选择): chất lượng cao nhất, chi phí cao nhất; chỉ dùng cho các A/B quan trọng

### 实现

Các cổng thông tin AI (Phase 17 · 19) lộ trình tiếp xúc.`router`config──Portkey có bảo vệ + định tuyến──Kong AI Gateway có định tuyến dựa trên plugin──OpenRouter của mô hình thị trường  Khám phá khuyến nghị API──

Mở nguồn:RouteLLM (LMSYS) 、Không Diamond (thị thương mại) 、Prompt Mule。

### 2026 价格曲线

| Model class | 2022 年末 | 2026 | 变化 |
|-------------|-----------|------|--------|
| GPT-4-level quality | ~$20/M | ~$0.40/M | 便宜 50x |
| Frontier (GPT-5, Claude 4) | — | ~$3-10/M | 新 tier |

Phần lớn cải thiện từ hiệu quả phục vụ, đó là giai đoạn 17 · 04-09 trong khóa học cốt lõi chuyển thành nhà cung cấp 侧 chi phí giảm.

### Drift 才是真正风险

Bạn của đường Đặt 40%  gửi cho mô hình rẻ tiền。 sáu tháng sau, phân phối nhiệm vụ  xảy ra thay đổi( người dùng quen hơn, vấn đề hơn长)。 Router không chú ý, vì phân loại của nó dựa trên dữ liệu Q1  đào tạo。 chất lượng  giảm。 không ai đưa ra đủ mạnh mẽ khiếu nại。 Bạn chỉ phát hiện mình đã thua trong điểm tham khảo của đối thủ cạnh tranh。

Sử dụng các métrics chất lượng trực tuyến cho đường 设 gate:

- Mỗi条 đường của người dùng ngón tay lên / ngón tay xuống.
- Mỗi đường 上对持久样 sample ((5%) làm tự động LLM- thẩm phán
- Tốc độ leo thang: Nếu dòng chảy tăng lên > 30%, biểu hiện mô hình rẻ được chuyển hướng quá mức.
- Tỷ lệ từ chối của mỗi tuyến đường

### Bạn nên nhớ số

- 2026 năm chất lượng đơn vị: tiết kiệm đường dẫn: nghiên cứu trường hợp là 20-60%
- Thị giá LLM giảm từ năm 2022 đến năm 2026: tổng cộng khoảng 10 lần mỗi năm.
- GPT-4 cấp 2022 vs 2026:~$20/M → ~$0,40/M:
- Tác động độ trễ ngập: trung bình khoảng 1,2x, tăng lên khoảng 2x ((khoảng 10% lưu lượng truy cập) 👇


```figure
model-cascade-router
```

## Sử dụng nó

`code/main.py`会在混合工作负载 上模拟前路,卡斯卡和集团――报告 混合成本,质量损失和升级率――

## 交付 nó

本课会产出 `outputs/skill-router-plan.md`❖ Đặt khối lượng công việc và ngân sách chất lượng, chọn mô hình định tuyến và tín hiệu.

## 练习

1. 运行 `code/main.py`Ở tầng độ chính xác nào, mặt nước sẽ thắng trước đường?
2. Cơ sở người dùng của bạn là 30% doanh nghiệp (đáp đơn phức tạp) ✓70% cấp độ miễn phí (đáp đơn) ✓ thiết kế phân chia định tuyến (đáp đơn) ✓ sử dụng các métric trực tuyến như cổng?
3. 某路线 让质量下降2%,但省 40%──是否应运?
4. Sử dụng các thử nghiệm log của OpenAI / APIs nhân bản  thực hiện kiểm tra sự tin tưởng. Bạn sẽ bắt đầu từ ngưỡng nào?
5. Trong vòng 6 tháng, tỷ lệ leo thang từ 8% lên đến 22%.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Model routing | "cost broker" | 每个 request 动态选择 model |
| Model cascade | "cheap-first escalate" | 先运行 cheap，low confidence 时 fall through 到 frontier |
| Pre-route | "classify first" | 前置 classifier；不重新运行 |
| Ensemble route | "parallel pick" | 运行多个，由 reward-model 选最佳 |
| Escalation rate | "uprouted %" | cascade requests 中被 escalated 的比例 |
| RouteLLM | "LMSYS router" | OSS router library |
| Not Diamond | "commercial router" | SaaS model-routing product |
| Drift | "cheap creep" | distribution shift 发生但 router 没注意到 |
| Online quality gate | "live check" | 对 live traffic 采样做 automated LLM-judge |

## 延伸阅读

- [AbhyashSuchi — Model Routing LLM 2026 最佳实践](https://abhyashsuchi.in/model-routing-llm-2026-best-practices/)
- [Lukas Brunner — Rise of Inference Optimization 2026](https://dev.to/lukas_brunner/the-rise-of-inference-optimization-the-real-llm-infra-trend-shaping-2026-4e4o)
- [RouteLLM paper / code](https://github.com/lm-sys/RouteLLM)
- [Not Diamond — model routing](https://www.notdiamond.ai/)
- [OpenRouter](https://openrouter.ai/) 带 định tuyến nguyên thủy của nhiều mô hình cửa ngõ.
