#  生产环境中的 EAGLE-3                                                                                                                                                                                                                                                          

> Việc giải mã dự đoán sẽ đưa ra một mô hình dự thảo nhanh chóng với mô hình mục tiêu 配对. Dự thảo  đề xuất K 个 token; mục tiêu trong một lần tiến hành trong thử nghiệm; được chấp nhận Token là miễn phí. Đến năm 2026, EAGLE-3 là biến thể cấp sản xuất, nó tập trung vào các trạng thái ẩn của mô hình mục tiêu trên đầu dự thảo, thay vì tập trung vào các token ban đầu, do đó trong cuộc trò chuyện chung đưa tỷ lệ chấp nhận alpha  đưa đến khoảng 0.6-0.8 间. Vấn đề chính xác không phải là  dự thảo có nhiều 快, mà là  Alpha của dòng chảy của tôi là bao nhiêu? Nếu thấp hơn khoảng 0.55, trong các dự thảo phát triển, giải mã dự đoán sẽ trở thành lợi nhuận tiêu cực, bởi vì mỗi dự thảo bị từ chối tiêu thụ lần thứ hai sẽ vượt qua các mục tiêu.

**类型：**Học tập
**语言：**Python(stdlib, chơi game mô phỏng tỷ lệ chấp nhận)
**先修要求：**Giai đoạn 17 · 04(vLLM Serving Internals),Giai đoạn 10 · 18(Tín giả đa mã)
**时间：**约60分钟

## Học mục tiêu

- Nói về phát triển của 3 thế hệ giải mã phỏng đoán,并 giải thích EAGLE-3 相比EAGLE-2 和经典草案模型 改变了什么──
- 定义 chấp nhận tỷ lệ alpha, theo alpha 和 K(mức dài bản) tính toán dự kiến tăng tốc,并识别目标并发下 break-even alpha。
- 解释 tại sao việc giải mã giả định trong vLLM 2026 là opt-in không默认), cũng như tại sao không đo alpha 就启动 nó là sản xuất phản mô hình.
- 写出测量计划: sử dụng 哪个基准"",哪种快速分布"",哪个同步点"", sử dụng 哪个指标作为上线门──

## 问题

Thử giải mã là kết nối bộ nhớ. Trong một phiên bản chạy Llama 3.3 70B FP8 của H100 trên, mỗi mã hóa mã hóa sẽ đọc khoảng 140 GB / s của trọng lượng và xuất ra một mã hóa.

Việc giải mã giả định đã sử dụng khoảng cách này. Sử dụng mô hình dự thảo rẻ tiền để tạo ra K 个候选 token, sau đó để mô hình mục tiêu trong một lần đi trước kiểm chứng tất cả các K 个.

经典草案-model 方法使用同一家族的更小模型(Llama 3.2 1B 为 Llama 3.3 70B起草案) ⋅它能工作,但接受率一般,因为更小模型的分布会偏离目标──EAGLE、EAGLE-2,再到EAGLE-3,直接在目标模型的内部状态上训练轻量草案头,因此草案的分布更紧跟目标──这就是为什么Alpha 会从草案模型的0.4升至EAGLE-3的0.6-0.8──

关键限制:EAGLE-3 trong vLLM 2026 中是选择进.`speculative_config`Không có cờ, không có tăng tốc. Nếu không có thực lượng trên phép đo alpha, hãy mở ngay, thường sẽ thấy độ trễ đuôi 变差, thay vì变好.

## 概念

### Việc giải mã dự đoán thực sự mang lại cái gì

没有规范解码时,每个代币的成本是一个目标前进. 时,使用草案长 K 和接受 alpha的规范解码时,每次目标前进的预期代币数是`1 + K * alpha`                                                                                                                                                                                                                                                              `(1 + K * alpha) / (1 + epsilon)`, trong đó epsilon là chi phí trên dự thảo cộng với xác minh:`(1 + 5*0.7) / (1 + 0.1) = 4.5 / 1.1 = 4.1x`Số lượng thế giới thực thường tập trung vào 2-3x, vì alpha trên lưu lượng sản xuất  rất ít quá cao, và epsilon sẽ ở kích thước lô cao 下 tăng.

### Tại sao alpha là chỉ số quan trọng duy nhất

Được từ chối Token sẽ không biến mất, chúng sẽ buộc cho đầu tiên được từ chối Token tiến hành mục tiêu thứ hai tiếp tục. Trong alpha  giảm xuống 0.4 của tải trọng làm việc trên, bạn phải trả dự thảo overhead, xác minh, cũng như tái xoay.

Alpha 会随着工作负载变化. Trong chia sẻGPT 风格的通用聊天天天, sử dụng ShareGPT 训练的EAGLE-3 能达到0.6-0.8──在域特定流量中,使用通用数据训练的草案头会降至0.4-0.6──训练域特定草案头可以恢复 Alpha;相比于目标细节调整,这是一个轻量、快速的训练任务──

### Eagle 代际一览

- **经典 draft model**:同一家族的小模型──Alpha 0.3-0.5──基础设施简单,加载两个模型,草案 每次目标前进 运行 K 次 次 前进──
- **EAGLE-1（2024）**Trong các trạng thái ẩn trong mục tiêu, có một số yếu tố nhỏ trên đầu.
- **EAGLE-2（2025）**:adaptative draft length 和 tree-based drafts(在一次目标通过 中验证多个分支) ・Alpha 约 0.6-0.7──草案安排器 更复杂──
- **EAGLE-3（2025-2026）**:Mặt đầu trong nhiều lớp mục tiêu 上训练(不只是最后一层), sắp xếp 更好──通用聊天天阿尔法 约 0.6-0.8──

### 2026 Kiểu sản xuất

1. Trước tiên theo cách thông thường trên dòng mô hình mục tiêu.
2.  Thông qua VLLM `speculative_config`Tạo ra dự thảo EAGLE-3── tái triển khai tiêu chuẩn──
3. 记录 率 chấp nhận alpha──vLLM V1 将其报告为 `spec_decode_metrics.accepted_tokens_per_request` trừ chiều dài dự thảo yêu cầu 即可得到 alpha
4. Nếu phân phối lưu lượng sản xuất 上 alpha < 0.55, cấm mã hóa đặc điểm, hoặc đào tạo EAGLE-3 dự thảo cụ thể về miền.
5. Trong sản xuất并发下 tái运行.

### 生产陷:P99 đuôi

Mô hình giải mã sẽ giảm trung bình ITL. Nếu không có điều chỉnh, P99 có thể biến đổi. Được từ chối dự thảo sẽ được phát hành trong hai giai đoạn.

### Eagle-3 đã được triển khai ở đâu

Google trong năm 2025 AI Overviews đã triển khai mã hóa giả định (vLLM V1 sẽ có cùng chất lượng, đáp ứng nhanh hơn)`speculative_config`作为文档化接口发布;N-gram GPU trong V1 拼图解码是兼容 零碎预填的变体──SGLang 支持EAGLE-3,并将其作为预写重工作负载的推草案路径──

### Một行 break-even 数学

预期加速:`S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`❖令`S = 1`Có thể giải quyết được Alpha:`alpha_breakeven = verify_overhead / K`❖ Đối với tiêu chuẩn xác minh_overhead 约 0.15 且 K=5:`alpha_breakeven = 0.03`Nhưng đây là số học giải mã ban đầu. Trong khi đó, kiểm tra Overhead sẽ tăng lên, và giải mã hàng đã phân phối bộ nhớ giữa nhiều chuỗi, do đó, trong thực tế, hiệu quả alpha_breakeven sẽ tăng lên khoảng 0.45-0.55。

### 什么时候 đừng sử dụng mã hóa giả định

- Batch-1 离线生成,且延迟不重要――使用普通目标――
- 输出很短(低于50 Token) ――Drafts overhead 和 xác minh chi phí 占主导。
- Không có chuyên ngành chuyên môn của người đứng đầu tuyển dụng.
- vLLM v0.18.0 加 dự thảo mô hình mô hình mô hình mã hóa thêm `--enable-chunked-prefill`◊ Bộ hợp này không thể biên dịch ◊ ngoại lệ của việc lưu trữ là giải mã đặc điểm GPU N-gram trong V1.


```figure
mx-speculative-tree
```

## Sử dụng nó

`code/main.py`会在一系列 alpha 值和草案长 K 上模拟有无猜测解码的解码循环──它会打印破-even alpha、测得的速度和尾巴行为──在多个 (alpha, K) 组合上运行它,准确观察猜测解码 在哪里不再划算──

## 交付 nó

本课产 出 `outputs/skill-eagle3-rollout.md` Được định hình mục tiêu  phân phối lưu lượng truy cập  mô tả và mục tiêu đồng thời, nó sẽ tạo ra kế hoạch triển khai EAGLE-3 trong giai đoạn phân đoạn:chỉ số cơ sở  cho phép cấu hình  biện pháp alpha  alpha >= 0.55 作为门、观察 P99 ITL──

## 练习

1. 运行 `code/main.py`Khi K=5, để tăng tốc 2x, cần tăng tốc alpha 3x.
2. 假设 sản xuất lưu lượng từ 70% 通用聊天、30% mã 组成──通用聊天在使用 ShareGPT 训练的 EAGLE-3 上达到α 0.7; mã 达到α 0.4──混合α alpha 是多少?
3. 阅读 vLLM `speculative_config`文档──说出三种模式(Mô hình bản EAGLE、N-gram),以及哪一种兼容 碎片预填──
4.  Khả năng EAGLE-3 后你看平均ITL下降25%,但P99 ITL上升15%──诊断原因并提出缓解措施──
5. 计算 Llama 3.3 70B của EAGLE-3 dự thảo đầu bộ nhớ giá trị.

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Speculative decoding | “draft plus verify” | 用便宜模型提出 K 个 Token，在一次 target forward 中验证全部 K 个 |
| Acceptance rate alpha | “spec accept rate” | draft Token 被 target 接受的比例；唯一重要的 metric |
| Draft length K | “spec k” | 每次 target forward 中 draft 提出的 Token 数；典型值 4-8 |
| Verify overhead epsilon | “spec overhead” | verify-and-reroll 相比普通 target forward 的额外成本；随 batch 增长 |
| EAGLE-3 | “latest EAGLE” | 2025-2026 变体；在多个 target layers 上训练 draft head；通用聊天上 alpha 0.6-0.8 |
| `speculative_config` | “vLLM spec config” | vLLM V1 中显式 opt-in；没有默认值就没有加速 |
| N-gram spec decode | “N-gram draft” | 使用 prompt 中 N-gram lookups 的 GPU-side draft；兼容 chunked-prefill |
| Break-even alpha | “no-op alpha” | spec decode 提供零加速时的 alpha；在生产并发下关注它 |
| Rejected-draft two-pass | “reroll cost” | drafts 被拒绝时发生两次 target forward；推高 P99 tail |

## 延伸阅读

- [vLLM — Speculative Decoding docs](https://docs.vllm.ai/en/latest/features/spec_decode/) `speculative_config`Và V1 中 拼音 兼容性权威来源
- [vLLM Speculative Config API](https://docs.vllm.ai/en/latest/api/vllm/config/speculative/) 精确字段集合──
- [EAGLE paper (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) 原始 Eagle draft-head 表述──
- [EAGLE-2 paper (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) bản thảo thích nghi và cây
- [UC Berkeley EECS-2025-224](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2025/EECS-2025-224.html) Sử dụng hệ thống giải mã đầu cơ hiệu quả cao LLM
- [BentoML — Speculative Decoding](https://bentoml.com/llm/inference-optimization/speculative-decoding) danh sách kiểm tra triển khai sản phẩm
