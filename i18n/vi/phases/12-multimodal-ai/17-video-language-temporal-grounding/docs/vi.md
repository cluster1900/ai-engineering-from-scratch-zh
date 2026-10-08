# Mô hình ngôn ngữ video: Các token thời gian và việc đặt đất

> Video không là một bức ảnh trên một đoạn phim 5 giây có kết quả liên tục, động tác động từ và sự kiện thời gian, những mô hình hình ảnh không thể thể hiện được. Video-LLaMA, Zhang và các đồng nghiệp, tháng 6 năm 2023) đã phát hành video mở đầu tiên có nền tảng trực quan-nghính thức. VideoChat và Video-LLaVA đã mở rộng mô hình này. Đến năm 2025, TMRoPE của Qwen2.5-VL đã giảm đi sự khác biệt với các mô hình độc quyền biên giới. Mỗi hệ thống đều giải quyết các biểu tượng thời gian theo cách khác nhau:Q-former mỗi clip,concat-pool mỗi khung,TMRoPE mỗi khung.

**Type:** Build
**Languages:** Python (stdlib, frame sampler + temporal-grounding evaluator)
**Prerequisites:** Phase 12 · 08 (LLaVA-OneVision)
**Time:** ~180 minutes

## Học mục tiêu
- 解释 tại sao mã hóa vị trí thời gian 会独立于视觉编码器 改变视频VLM hiệu suất。
- So sánh đồng nhất, động lực-FPS và các sự kiện-động cơ khung mẫu trong token-per-second với độ chính xác đất 取舍──
- 描述 Q-ex-per-clip(Video-LLaMA)、pooled-per-frame(Video-LLaVA) và M-RoPE-per-token(Qwen2.5-VL) thiết kế。
- Nói ra bốn tiêu chuẩn video: VideoMME, TempCompass, EgoSchema, Video-MMMU,

## 问题
Một đoạn 1 分钟、30 FPS của video có 1800 khung hình.

Có 3 phương pháp nén:

1. Các khung mẫu phụ (được sử dụng theo nội dung 1-8 FPS)
2. Đối với mỗi khung của các mã thông báo vá  thực hiện mạnh lực pooling(3x3 hoặc 4x4 pool hàng tỷ)
3. 通过Q-former 压缩:输入一个16 khung clip,输出64 token。

Mỗi loại lấy khác nhau. Các mẫu phụ sẽ mất chi tiết thời gian.

Mã hóa vị trí thời gian là một chiều khác:模型如何知道框架 5 发生在框架 6 之前?选项包括简单的1D temporal RoPE(Video-LLaMA) 、学习的 temporal embeddings(Video-LLaVA) 和TMRoPE(Qwen2.5-VL,完整3D) 👇

## 概念
### Video-LLaMA: mỗi clip một Q-former + chi nhánh âm thanh

Video-LLaMA(2023) là thứ nhất mở video-LLM──Architecture:

- 16 khung hình clip với 2 FPS ((即 8 秒) ⋅
- Các tính năng ViT mỗi khung -> Video Q-former, đối với tất cả 16 khung làm việc chéo -> 32 câu hỏi được học -> LLM。
- 并行 âm thanh chi nhánh: waveform -> ImageBind âm thanh mã hóa -> Audio Q-former -> 32 truy vấn -> LLM。

优势: suy luận chung âm thanh-quan hình―弱点: cố định độ dài clip, không thể xử lý việc đặt đất thời gian tùy ý―

### VideoChat và Video-LLaVA

VideoChat đã giữ lại ý tưởng của Video-LLaMA, nhưng bỏ âm thanh và đơn giản hóa. Video-LLaVA(Lin et al., 2023) trên hình ảnh và khung video 上训练单个视觉编码器("sự sắp xếp trước khi chiếu"), nhận được một nhận thức.

Hai trong số đó không thể xử lý video dài.

### Qwen2.5-VL và TMRoPE

Qwen2.5-VL  đã đưa ra TMRoPE, tức Temporal-Modality Rotary Position Embedding. Mỗi mã đệm 携带一个 (t, h, w) 位置, trong đó t là dấu thời gian thực tế.

Sự khác biệt quan trọng giữa việc nhúng vào thời gian đơn giản:

- 绝对时间,而不是索引. Mô hình nhìn thấy là trong 4.2 giây, không phải trong khung 15 giây.
- Mỗi token quay, chứ không phải mỗi clip. Mỗi token hình ảnh đều theo dấu thời gian của riêng mình.
- 兼容 động lực FPS── nếu ở đây với 2 FPS 采样、 ở đó với 4 FPS 采样, TMRoPE có thể xử lý nguyên sinh không đồng đều间隔──

TMRoPE 支持猫在第几秒跳起? 这类查询──模型可以输出在 4.2秒──视频-LLaMA chỉ có thể nói早在剪辑──

### Các chiến lược lấy mẫu khung

Thường hợp: trong suốt thời gian trong trong các khung hình N, đơn giản, nhưng sẽ mất các đỉnh chuyển động.

FPS động lực: tùy theo cường độ chuyển động 自适应采样―― Optical flow hoặc khung khác biệt 会在高动作段 选择更密集的采样――Qwen2.5-VL 会这样训练――

Sự kiện-động lực:运行一个轻量探测器,在行动发生处采样更多──VideoAgent 使用这种方式──

Keyframe + context: trong giới hạn chụp + 若干 khung lân cận 采样──用于电影内容──

### Tỷ lệ hợp nhất mỗi khung

Trong 1 FPS 且每框架 576 token 时, một clip 5 分钟 là 172.800 token──Qwen2.5-VL-72B's 128k context có thể xử lý rất khó, nhưng chi phí cao──

3x3 pool hàng tỉ sẽ giảm mỗi khung xuống còn 64 token -> 5 phút là 19.200 token... đối với hầu hết các nhiệm vụ là điểm ngọt ngào...

Đối với các dòng công việc của đại lý có thể tăng cường hơn việc tập hợp (x6 -> 16 token mỗi khung), vì chi tiết không gian không quan trọng.

### Bốn tiêu chuẩn video

- VideoMME: hiểu biết video tổng thể, bao gồm ngắn + trung bình + dài。
- TempCompass:细粒度 lý luận thời gian, chứa các câu hỏi "trước" / "sau"
- EgoSchema:长时程第一人称视频──
- Video-MMMU:Multimodal 多学科视频问题──

完整视频-VLM đánh giá 会覆盖全部四个──它们强调不同维度:TempCompass 关注订单,EgoSchema 关注 3+ phút lý luận,VideoMME 覆盖多种持续时间──

### Các định dạng đầu ra trục trặc

Temporal grounding 的输出格式:

- Free text:"Căn mèo nhảy quanh dấu hiệu 4 giây. " 易于解析但不精确。
- JSON được cấu trúc:`{"event": "jump", "start": 4.1, "end": 4.3}`❖ Quần2.5VL 会训练这种形式──
- - Đơn vị: đặc biệt`<time>4.1</time>`Các mã thông báo với câu trả lời交错──Qwen2.5-VL của nội bộ hình dạng──

Các định dạng đầu ra JSON của Qwen2.5VL có thể được giải quyết trực tiếp.

### 2026 thực hành tốt nhất

Video 2026 năm VLMs thực hành tốt nhất:

- Mã mã:带 M-RoPE hoặc TMRoPE của SigLIP 2(Qwen2.5-VL)。
- Phân mẫu khung:FPS động lực (FPS) theo chuyển động sử dụng 1-4),带 max-frame cap。
- Phép hợp mỗi khung:3x3 hàng tỉ chiều.
- Output:包含 time + event 字段的结构化 JSON。
- Định hướng: VideoMME + TempCompass dùng chung;EgoSchema dùng chung:


```figure
video-temporal-patches
```

## Sử dụng nó
`code/main.py`包含:

- Đồng nhất và động lực-FPS khung mẫu.
- Một game thời gian-grounding đánh giá: given given time T 处的"các thực" sự kiện 和 mô hình đầu ra, trong dung nạp trong đánh giá chính xác.
- Video-LLaMA(16 khung hình,Q-ex)、Video-LLaVA(8 khung hình,MLP)、Qwen2.5-VL(dynamic FPS + TMRoPE)

## 交付 nó
本课会产出 `outputs/skill-video-vlm-frame-planner.md` Đặt một nhiệm vụ video ((monitoring、action recognition、temporal grounding、summary), nó sẽ chọn mẫu khung hình、pooling factor、output format 和 dự kiến độ chính xác ⋅

## 练习
1. Đối với một 3 phút nấu ăn demo, chọn đồng phục cũng là năng động FPS.

2. TMRoPE  cụ thể tăng thêm gì, là đơn giản thời gian nhúng bảng làm không được?

3. 写一个VLM 可学习输出 时代接地 JSON schema──包含错误案例──

4. 阅读 Video-LLaVA Phần 3 中的"Sự sắp xếp trước khi chiếu"──为什么比训练独立的图像和视频编码器更好?

5. được cho ra bảng xếp hạng VideoMME, cho đến năm 2026, sự khác biệt giữa mô hình mở hàng đầu và mô hình độc quyền hàng đầu là bao nhiêu? Trong số đó có bao nhiêu sự khác biệt có thể được quy định với mã hóa thời gian, bao nhiêu có thể được quy định với quy mô LLM cơ bản?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Temporal grounding | "Time-localized answers" | VLM 会为事件发生时间输出具体 timestamp range |
| TMRoPE | "Time-Multimodal RoPE" | 带绝对 timestamps 的 3D rotary position，由 Qwen2.5-VL 使用 |
| Dynamic FPS | "Motion-aware sampling" | 在 high-motion segments 采样更多 frames，在 static segments 采样更少 |
| Frame pooling | "Spatial compress per frame" | 在进入 LLM 前用 bilinear interpolation 减少每个 frame 的 patches |
| Video Q-former | "Clip compressor" | 将 N frames 映射到 K learned queries 的 cross-attention bottleneck |
| VideoMME | "Video bench" | 综合 short/medium/long video benchmark，2500+ samples |

## 延伸阅读
- [Zhang et al. — Video-LLaMA (arXiv:2306.02858)](https://arxiv.org/abs/2306.02858)
- [Li et al. — VideoChat (arXiv:2305.06355)](https://arxiv.org/abs/2305.06355)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Qwen Team — Qwen2.5-VL (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Lin et al. — VILA-1.5 (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
