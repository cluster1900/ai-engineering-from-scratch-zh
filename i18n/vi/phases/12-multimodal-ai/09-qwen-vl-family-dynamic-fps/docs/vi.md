# Qwen-VL Family với Dynamic-FPS Video

> Gia đình Qwen-VL  Qwen-VL (2023)、Qwen2-VL (2024)、Qwen2.5-VL (2025)、Qwen3-VL (2025)  là mô hình mô hình thị giác mở có ảnh hưởng nhất năm 2026 谱系. Mỗi thế hệ đã đặt cược vào một cấu trúc quyết định, và trong 12 tháng đã sao chép các dự án khác trong môi trường mở: thông qua M-RoPE 实现原生态分辨率、带绝对完整的动态-FPS sampling、ViT trong cửa sổ chú ý, cũng như đại lý xuất khẩu định dạng.

**Type:** Learn
**Languages:** Python (stdlib, M-RoPE encoder + dynamic-FPS sampler)
**Prerequisites:** Phase 12 · 06 (patch-n'-pack)
**Time:** ~120 minutes

## Học mục tiêu
- 計算 M-RoPE 的三轴旋转(时刻、高度、宽),并解释为什么三者都需要──
- Vì video chọn động lực-FPS lấy mẫu 策略,并推理 token-per-second với sự chính xác phát hiện sự kiện 取舍──
- Theo thứ tự, phát hành Qwen-VL bốn thế hệ nâng cấp, cũng như mỗi thế hệ đã bắt đầu điều gì.
- 连接一个Qwen2.5VL-style JSON agent 输出格式,并从VLM 响应中解析结构化工具调用──

## 问题
Qwen-VL được phát hành vào tháng 8 năm 2023, là phản ứng trực tiếp đối với LLaVA-1.5 và BLIP-2.

Độ phân giải:LLaVA-1.5 运行在 336x336──对照片也可以,但对中文发票或密集电子表截图没有用──Qwen-VL đầu tiên sáng tạo là 448x448 和地面边界框输出,让模型能够指向对象──

Video-LLaMA 堆叠逐渐编码并把它们给LLM. Nó có hiệu quả đối với phim ngắn, nhưng không phù hợp với nhiều video, vì vòng thời gian của loại video này là tín hiệu.

结构化输出:LLaVA 输出自由格式文本──Agent 需要 JSON──Qwen-VL 使用显式 JSON 输出格式训练,包括把边界框 坐标作为文本──

Mỗi thế hệ Qwen-VL đều mở rộng một trong những dòng dây chuyền này.

## 概念
### Qwen-VL (tháng 8 năm 2023)

第一代:OpenCLIP ViT-bigG/14 作为编码器(2.5B Params) ✓LLama-compatible Q-Former(1 bước với 256 truy vấn) ✓Qwen-7B base──贡献:

- 448x448 分辨率 (~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
- Địa điểm:使用带显式坐标 Địa chỉ 输出的 hình ảnh-lần văn bản cặp 训练。"Căn nuôi ở <box>(112, 204), (280, 344)</box>"。
- Từ đầu tiên bắt đầu thực hiện Trung + Anh nhiều ngôn ngữ đào tạo.

Background: English 上可与 GPT-4V 竞争,中文上占优──Grounding 监督才是真正的亮点──

### Qwen2-VL (Ngày 9 năm 2024)  M-RoPE 与原生分辨率

Qwen2-VL sử dụng mã hóa ViT phân giải động cơ gốc  thay thế phân giải cố định + Q-Former stack──

- Đơn vị HxW có thể được kích thước nào cũng được nhận được. Đơn vị 14 với 2x không gian hợp nhất.
- M-RoPE (Multimodal RoPE) ―― Mỗi token 携带 3D 位置 (t, h, w), thay vì 1D── đối với hình ảnh t=0; đối với video t = frame_index──RoPE 按每个轴的频率旋转查询/key Vector──没有位置嵌入表──
- MLP Projector──去掉 Q-Former; trong các mã hóa bản vá kết hợp 上使用 2 lớp MLP──
- 带动态 FPS 的视频──默认以1-2 FPS 采样视频,但模型接受任意数──

Kết quả:Qwen2-VL-7B trong nhiều đa mô hình 基准上追平 GPT-4o, và DocVQA 上超过它(94.5 vs 88.4);; thay đổi cấu trúc là bước quyết định;;

### Qwen2.5-VL(2025 年 2 月)  FPS động + thời gian tuyệt đối

Sự thay đổi lớn của Qwen2.5VL là video.

- 绝对时间 Token──不使用位置索引(frame 0, 1, 2...),而使用实际时间──"À 0:04, mèo nhảy. " 模型会看到与框架代币 交错的`<time>0.04</time>`Đồ chỉ số
- FPS động, vật liệu chậm tốc độ theo kiểu 1 FPS, động tác theo kiểu 4+ FPS.
- ViT 中的窗户注意──空间注意──采用窗户内局部) 提升吞吐;每隔几层加入全球注意──
- 显式 JSON 输出格式──使用工具-call 数据训练:"{\"工具\": \"click\", \"coords\": [380, 220]}"──开箱即代理-ready──
- MRoPE-v2 quy mô. vị trí sẽ có lượng lớn nhất, vì vậy 10 phút video sẽ không tiêu tốn hết tần số.

基准:Qwen2.5-VL-72B 在多数视频基准上超过GPT-4o,在文档上追平Gemini 2.0,并为GUI grounding 设定开放模型SOTA(ScreenSpot: 84% chính xác so với GPT-4o 的 38%)。

### Qwen3-VL (Tháng 11 năm 2025)

Qwen3-VL là một lần tăng cường nâng cấp, tập trung là tích hợp thay vì tái phát triển: xương sống LLM lớn hơn ((Qwen3-72B) 、 mở rộng đào tạo dữ liệu、 cải tiến OCR, cũng như thông qua chế độ suy nghĩ Qwen3  获得更强的推理──ViT 和 M-RoPE 保持不变──论文关注的是数据和训练改进,而不是架构──

Kết luận của hệ thống này: Đến năm 2025, cấu trúc Qwen-VL đã ổn định.

### M-RoPE về mặt toán học

经典 RoPE 使用成对坐标,按位置 `m`Chuyển độ`d`của câu hỏi `q`- Có thể là:

```
q_rot[2i]   = q[2i]   * cos(m * theta_i) - q[2i+1] * sin(m * theta_i)
q_rot[2i+1] = q[2i]   * sin(m * theta_i) + q[2i+1] * cos(m * theta_i)
theta_i     = 10000^(-2i/d)
```

M-RoPE sẽ ẩn 切分为三条带――假设`d = 96` phân phối 32 độ nét 给 temporal、32 给 height、32 给 width── mỗi băng 按自己的轴位置旋转──位于 (t=5, h=10, w=20) 的补丁 会在其三条带上分别应用旋转`R_t(5)``R_h(10)``R_w(20)`

Mã thông báo văn bản 使用 `t = text_index, h = 0, w = 0`(或一种归一化选择), để giữ兼容.`t = frame_time, h = row, w = col`△ đơn hình ảnh sử dụng `t = 0`

Ưu điểm: Một mã vị trí có thể xử lý văn bản, hình ảnh và video, không cần phải phân chia mã hoặc biểu tượng vị trí khác.

### Dynamic-FPS 采样逻辑

给定一个时长为 `T`秒的视频和目标 Địa chỉ  ngân sách `B`- Có thể là:

1. 计算你能承担最大FPS:`fps_max = B / (T * tokens_per_frame)`
2. Từ `{1, 2, 4, 8}`中选择满足 `fps <= fps_max`Mục tiêu FPS:
3. Nếu运动强(optical-flow heuristic 或明确用户请求), chọn更高 FPS──如果运动弱, chọn更低 FPS──
4. 按选定FPS 均采样;`<time>t</time>`Đồ chỉ số

Qwen2.5VL 会隐式训练这种逻辑;推理时用户通过 `fps`Một chuỗi động tác 60 giây, với 4 FPS, mỗi 81 token tính toán, tương đương với 19440 token, trong bối cảnh 32k 中可管理。

### Tạo ra các chất cơ cấu

Quân vận hành của Qwen2.5VL 训练显式面向结构化工具调用:

```
{
  "tool": "mouse_click",
  "coords": [1024, 512],
  "button": "left",
  "modifier": null
}
```

解析是确定性的: đối với mô hình xuất hiện thực hiện JSON.parse。相比之下, tự do hình thức của "click at (1024, 512)" 需要 regex 和歧义处理。


```figure
mm-mrope-axes
```

## Sử dụng nó
`code/main.py`实现:

- Đối với các bản kết hợp văn bản, bản vá hình ảnh và khung video  thực hiện M-RoPE  vị trí tính toán
- Mô hình FPS động:给定 (thời gian, ngân sách, motion_level), chọn FPS 并输出 khung thời gian ấn tượng.
- Một phiên bản đồ chơi Qwen2.5VL JSON-output parser, được sử dụng để xử lý các ứng dụng gọi của các phần mềm.

运行 nó, rồi trong một 5 phút video lên đưa cố định FPS  đổi thành động FPS, cảm nhận khác biệt.

## 交付 nó
本课产 出 `outputs/skill-qwen-vl-pipeline-designer.md` Đặt một nhiệm vụ video (video)  giám sát, thông tin, nhận dạng hành động, khả năng truy cập), nó sẽ phát ra Qwen2.5 VL  cấu hình (quadro budget, FPS strategy, cửa sổ-trông dõi cờ, chế độ phát hành của đại lý) và dự đoán chậm.

## 练习
1. 计算 ẩn 48(每条带 16,base theta 10000)时,位于 (t=3, h=5, w=7) 旋转的 M-RoPE 旋转──展示每条带 中前三对的旋转角度──

2. Một đoạn 10 phút của video camera an ninh, với 1 FPS sẽ tạo ra bao nhiêu? ở độ phân giải 384 và 3x pool dưới, tổng số token là bao nhiêu?

3. Để 30 giây                                                                                                                                                                                                                                                              

4. Qwen2.5VL hoàn toàn loại bỏ Q-Former──为什么简单 MLP trong năm 2025 có thể chạy, nhưng không thể chạy trong năm 2023?

5. Sẽ có 3 Qwen2.5VL JSON tool-call 输出解析为Python dict──Mặc định JSON 会发生什么失败?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| M-RoPE | "Multimodal RoPE" | hidden dim 中带 temporal、height 和 width bands 的 3D rotary position embedding |
| Dynamic FPS | "Smart sampling" | 根据运动、时长和 Token 预算为每个视频选择的帧采样率 |
| Absolute time token | "Timestamp token" | 在序列中交错插入的 `<time>t</time>`，让模型看到实际秒数而不是帧索引 |
| Window attention | "Local attention" | 为提速而限制在小窗口内的 spatial self-attention；周期性加入 global attention |
| Structured agent output | "JSON mode" | 通过训练数据监督教 VLM 输出可解析 JSON，其中包含 coords 和 tool names |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的每请求控制项，用来约束总像素数，从而约束 Token 数 |
| Grounding | "Point-at-it" | 将 bounding-box 坐标作为文本 Token 输出；自 Qwen-VL v1 起使用 |

## 延伸阅读
- [Bai et al. — Qwen-VL (arXiv:2308.12966)](https://arxiv.org/abs/2308.12966)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Qwen Team — Qwen3-VL (arXiv:2511.21631)](https://arxiv.org/abs/2511.21631)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
