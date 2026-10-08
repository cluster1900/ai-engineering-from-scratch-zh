# LLaVA-OneVision: Một hình ảnh đơn trong một mô hình, nhiều hình ảnh và video

> Trước khi mở LLaVA-OneVision (Li et al., tháng 8 năm 2024) VLM World có một chuỗi phân biệt giữa hai người: được sử dụng cho các mô hình đơn LLaVA-1.5, mô hình nhiều hình ảnh như Mantis và VILA, cũng như mô hình video như Video-LLaVA và Video-LLaMA. Mỗi mô hình đều giành được điểm chuẩn của riêng mình, nhưng thất bại trong các trường hợp khác.

**Type:** Build
**Languages:** Python (stdlib, token budget solver + curriculum planner)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 12 · 06 (any-resolution)
**Time:** ~180 minutes

## Học mục tiêu
-  thiết kế một trong một hình ảnh, nhiều hình ảnh và video nhập lưu giữ một hình ảnh cố định Địa chỉ  ngân sách
- 排列一个训练课程,使技能从单图像迁移到视频,同时避免灾难性忘记――
- 解释 tại sao trong cùng một quy mô tham số, nếu chương trình giảng dạy được thực hiện đúng, một mô hình sẽ thắng các mô hình chuyên gia.
- Nói ra LLaVA-OneVision  báo cáo của ba khả năng mới nổi: lý luận nhiều máy ảnh, gợi ý thiết lập dấu hiệu, đại lý chụp màn hình iPhone.

## 问题
图像,多图像和视频会以不同的方式施压模型.

单图像需要高分辨率 Token ((AnyRes,约2880 视觉代币) để nắm bắt OCR 和细节──每个样本的预算:1张图像,2880 代币──

Nhiều hình ảnh cần nhiều hình ảnh phân giải trung bình (khoảng 576 Token) để đưa vào ngữ cảnh.

视频需要许多低分辨率(pooling 后每约196 代币) để nắm bắt thời gian động thái──每个样本的预算:8-32 ,每 196 代币,总计1600-6200 代币──

Nếu bạn đào tạo nhiều mô hình độc lập, bạn sẽ chọn một ngân sách cho mỗi mô hình. Nếu bạn đào tạo một mô hình, bạn cần để ngân sách có thể giảm hợp lý giữa các tình huống khác nhau, đồng thời không thể thổi ra bối cảnh.

Trong OneVision  trước, câu trả lời là  đào tạo một cảnh, bỏ qua các cảnh khác ──Video-LLaVA 通过额外训练阶段把视频能力改装成图像模型上──LLaVA-Next 通过 通过 增加多图像支持──没有一个能干净地处理三者──

## 概念
### OneVision Token 预算

LLaVA-OneVision  chọn một đồng nhất thị giác token  ngân sách, mỗi mẫu khoảng 3000-4000 token, và phân phối theo tình huống khác nhau:

- 单图像:AnyRes-9(3x3 tile + thumbnail), mỗi tile 为 384,包含 729 个补丁,使用激进的 2x2 bilinear pooling → Mỗi tile 182 个代币──总计:9 * 182 + 182 = 1820 个代币──或 AnyRes-4, mỗi tile 729 个代币 = 2916 + 729──
- 多图像: 每张图像使用中等分辨率(384,不),729 个代币,不聚焦──预算为 6 张图像 → 4374 个代币──
- 视频:32 ,384 分辨率, sử dụng激进的 3x3 bilinear pool → 每 81 个代币──总计:32 * 81 = 2592 个代币──

Việc phân phối này làm cho tổng số token giữ vững. LLM sẽ không bao giờ thấy các lô của bối cảnh phát nổ.

### Chương trình giảng dạy 三阶段

LLaVA-OneVision 分三个阶段训练:

1. 单图像 SFT(stade SI) ∼ Tất cả dữ liệu đều là hình ảnh-thêm văn bản-một mình ∼ sử dụng độ phân giải cao AnyRes 输入训练。
2. OneVision SFT(phase OV)。混合单图像 + 多图像 + 视频(均采样)。在统一代币 预算上训练。这会教会模型处理异构批形──不重置权重,而是从阶段 SI 继续──
3. Chuyển giao nhiệm vụ (Phase TT)  tiếp tục sử dụng bộ phận nhiệm vụ mục tiêu, thường dựa trên sản phẩm cần có nhiều hình ảnh hoặc video  có thể chọn để triển khai

关键点:các chương trình học 序列 rất quan trọng. Ngay cả khi sử dụng cùng một dữ liệu, trước khi đào tạo video hoặc trước khi đào tạo nhiều hình ảnh, cũng sẽ có hiệu suất hình ảnh kém hơn so với trước khi đào tạo một hình ảnh.

### Tại sao chương trình giảng dạy hiệu quả

单图像训练建立感知基础──Patch Token 携带细粒度视觉特征;LLM 学会把它们与文本整合──多图像和视频引入结构性挑战(哪张图像是哪张,什么先发生), nếu không có cơ sở cảm giác mạnh mẽ, những thách thức này rất khó học──

Nếu bạn bắt đầu tập hợp tất cả các cảnh quan từ không, mô hình sẽ thiếu cảm giác phù hợp (năm tập trung dữ liệu hình ảnh đơn lẻ), và quá phù hợp cấu trúc (năm tập hợp dữ liệu hình ảnh/video) ◊ Kết quả là một mô hình có thể theo dõi các mô hình hình ảnh, nhưng hình ảnh hiểu được mô hình浅.

Chương trình giảng dạy  xếp hạng làm cho bạn từ giai đoạn SI  đạt được cảm nhận mạnh mẽ, từ giai đoạn OV  đạt được sự kết hợp / thời gian suy nghĩ khả năng, đồng thời không mất bất kỳ một bên nào.

### 跨场景 các kỹ năng mới nổi

LLaVA-OneVision 论文 báo cáo ba khả năng mới nổi:

1. Nhận xét nhiều máy ảnh. Trong khi được đào tạo, bạn được yêu cầu hiểu một cảnh lái xe nhiều máy ảnh. Mặc dù chưa bao giờ thấy hình thức chính xác này trong đào tạo, mô hình vẫn có thể hợp nhất chính xác nhiều góc nhìn.
2. Set-of-mark prompting──user use 编号标记注释图像中的对象;模型推理mark 3 相对于标记 7 在做什么──既没有在标记上训练,也没有在注释上训练;它是从空间地定 +多图像参考的组合中学到的──
3. Người dùng cung cấp một张 iPhone 屏幕截图,并要求规划下一次点击.

Những điều này không phải là nhiệm vụ đào tạo; chúng xuất hiện từ cấu trúc kết hợp của chương trình giảng dạy.

### 视觉 Tỷ lục tập hợp

Token 预算 cần hợp tác. OneVision trong 2D patch grid 上 sử dụng phân cực hàng tuyến:24x24 = 576 个 patch  biến thành 12x12 = 144(2x factor) hoặc 8x8 = 64(3x factor) ―― Pooling trong patch-grid 空间完成, thay vì hoàn thành trong Token 空间, để giữ được vị trí của nó.

Mỗi trường hợp của sự hợp nhất yếu tố  chọn bản thân là một siêu tham số ⋅ ít hợp nhất hơn = 更多Token = 更丰富的表示──更多 hợp nhất hơn = 更少Token = 能放入更多/图像──

### LLaVA-OneVision-1.5

LLaVA-OneVision-1.5, arXiv 2509.23661) trong tập luyện dữ liệu, trọng lượng và mã hóa mô hình đều mở rộng. Nó đã giảm khoảng cách với mô hình độc quyền trong một số điểm tham khảo, và làm cho phương pháp này được dân chủ hóa hơn.

### So với Qwen2.5-VL

Qwen2.5-VL(Dân học 12.09) đã thực hiện một lựa chọn khác nhau. Nó sử dụng M-RoPE và FPS động, thay vì hợp nhất cố định.


```figure
l5-onevision-budget
```

## Sử dụng nó
`code/main.py`là một ứng dụng cho chương trình giảng dạy và kế hoạch ngân sách VLM kiểu OneVision.

- Đối với mỗi trường hợp phân phối độ phân giải, yếu tố tập hợp và khung hình.
- Kiểm tra xem mọi trường hợp đều nằm trong ngân sách chung hay không.
- 报告预期 Token số lượng LLM FLOPs, cũng như những trường hợp bị đánh dấu thấp.
- 打印逐阶段训练计划──

Sử dụng nó để lên kế hoạch cho việc chỉnh sửa OneVision, hoặc kiểm tra sức khoẻ cho mỗi yêu cầu của VLM.

## 交付 nó
本课会产出 `outputs/skill-onevision-budget-planner.md` Với phân bố nhiệm vụ và mỗi ngân sách mẫu, nó sẽ sản xuất bất kỳ yếu tố Res nào  tích hợp mỗi khung hình  video  số và cân trình giảng dạy  Mỗi khi bạn tập luyện hoặc chỉnh sửa một kịch bản thống nhất VLM 时,都 sử dụng nó 

## 练习
1. Các sản phẩm của bạn hỗ trợ 80% 单图像、10% 多图像(2-4 张图像)、10% 视频(8-16 ) ・・・ thiết kế Đồ chỉ 预算。 Vì không làm trọng lượng nhiều hình ảnh và dự phòng ngân sách bổ sung, bạn sẽ đặt ở đâu?

2. LLaVA-OneVision Phần 4.3 (các khả năng mới nổi)  đề xuất một chương trình giảng dạy có thể giải quyết, nhưng bài luận không báo cáo về một kỹ năng mới nổi thứ tư 

3. Chuyển đổi chương trình học 顺序:先训练多图像,再训练单图像,最后训练视频──预测哪些基准会下降,以及原因──

4. 论文报告的视频基准每样只用8训练――这能泛化为推理时的30秒视频吗?

5. Để thực hiện việc chia sẻ hàng tỷ x24 sẽ được thực hiện đến 12x12, trong mỗi chiều kích sẽ có sự giảm 4x.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OneVision scenario | “单图像、多图像，或视频” | 统一 VLM 处理的三种输入 shape 之一；预算在三者之间保持恒定 |
| Token budget | “每个样本多少 Token” | LLM 在每个训练/推理样本中看到的视觉 Token 总数，通常为 3000-4000 |
| Curriculum | “训练顺序” | 为了 emergent transfer 而选择的阶段排序（单图像 → 多图像 → 视频） |
| Bilinear pooling | “Token 缩减” | 对 patch grid（2D）应用 bilinear interpolation，以在保留局部性的同时减少 Token 数量 |
| Emergent skill | “没训练过，但仍然能用” | 由于 curriculum composition，在没有匹配训练数据的情况下于推理时出现的能力 |
| AnyRes-k | “k-tile setup” | k 个固定分辨率子 tile 加一个 thumbnail，典型 k ∈ {4, 9} |
| Task transfer | “跨场景泛化” | 在单图像上学到的技能，通过共享 backbone 应用于视频（反之亦然） |

## 延伸阅读
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326)
- [LLaVA-OneVision-1.5: Fully Open Framework (arXiv:2509.23661)](https://arxiv.org/abs/2509.23661)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Lin et al. — VILA (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
