# Vision Transformers và Patch-Token 原语

> Trong bất kỳ chế biến đa phương thức nào, hình ảnh đều phải trở thành Transformer có thể xử lý Token 序列. Năm 2020 ViT 论文 sử dụng 16x16 像素补丁,线性投影和位置嵌入  trả lời câu hỏi này. Năm sau, mỗi mô hình biên giới năm 2026 được tạo ra bởi Claude Opus 4.7 原生 2576px, Gemini 3.1 Pro, Quwen3.5-Omni) vẫn bắt đầu từ đây  mã hóa từ ViT trở thành DINOv2 tái SigLIP 2, gia nhập các mã đăng ký, vị trí trở thành 2D-RoPE, nhưng ngôn ngữ nguyên bản này đã được giữ lại dưới đây.

**Type:** Learn
**Languages:** Python (stdlib, patch tokenizer + geometry calculator)
**Prerequisites:** Phase 7 (Transformers), Phase 4 (Computer Vision)
**Time:** ~120 分钟

## Học mục tiêu
- Để chuyển đổi HxWx3 图像 thành có đúng vị trí mã hóa của bản vá Token 序列──
- Để xác định ViT (( kích thước đệm, độ phân giải, độ mờ ẩn, độ sâu) tính toán chiều dài chuỗi, số parameter và FLOPs。
- Nói rằng ViT từ năm 2020 nghiên cứu kết quả tiến triển đến năm 2026 hệ thống sản xuất ba nâng cấp: tự giám sát trước đào tạo (DINO / MAE) ✓ mã đăng ký, cũng như đóng gói giải pháp bản địa.
- 为下游任务在 CLS pooling, nghĩa là pooling và đăng ký token 之间做选择.

## 问题
Transformer  xử lý là Vector 序列。文本本本就是序列(bytes或tokens)。图像是带有三个颜色通道的2D 像素网格,不是序列。 Nếu bạn展平 mỗi像素,一张 224x224 RGB 图像将变成150,528 符号,而这个长度上的自我注意是完全不可行的(相对于序列长度是二次复杂性)。

Phương pháp trước năm 2020 sẽ được kết nối với một bộ trích dẫn tính năng CNN: ResNet tạo ra một bản đồ tính năng 7x7 gồm 2048-dim Vector, tái tạo 49 Token này 输入 Transformer──This能工作, nhưng sẽ thừa hưởng sự phân định của CNN (trang dịch tương đương, các lĩnh vực nhận thức địa phương),并削弱 Transformer đối với khả năng thích ứng mở rộng quy mô──

Dosovitskiy et al. (2020) đã đưa ra một câu hỏi trực tiếp: nếu nhảy qua CNN 会怎么?把图像分成固定大小的补丁(例如16x16像素), sẽ đưa mỗi补丁线性投影成一个矢量,加入位置嵌入,然后把序列输入一个香变压器──当时这属于异端做法 不用卷积做视觉──只要数据足够多(JFT-300M,之后是LAION),它就在 ImageNet上超过ResNet,并持续改进──

Đến năm 2026, ViT nguyên ngữ đã là nền tảng không tranh cãi. Mỗi tháp tầm nhìn VLM có trọng lượng mở đều là một loại thế hệ sau đó.

## 概念
### Các bản vá như các token

Định hình một hình dạng`(H, W, 3)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `x`和 kích thước đệm `P`, anh sẽ cắt một bức ảnh thành một .`(H/P) x (W/P)`网格. Mỗi đệm đều là một đệm.`P x P x 3`của hình dáng hình.`3 P^2`Vector. ứng dụng một hình dạng để`(3 P^2, D)`                                                                                                                                                                                                                                                              `W_E`, đưa mỗi đệm 映射 vào kích thước ẩn của mô hình `D`

Đối với ViT-B/16 cấu hình này là:
- Nghị quyết 224, kích thước bản vá 16 → lưới 14x14 → 196 个 bản vá token。
- Mỗi đệm là`16 x 16 x 3 = 768`个像素值,投影到 `D = 768`
- 加入一个可学习的 `[CLS]`token → chiều dài chuỗi 197。

Patch projection trong toán học bằng với kích thước hạt nhân`P`      `P`、 xuất khẩu đường dẫn số`D`của 2D convolution.`nn.Conv2d(3, D, kernel_size=P, stride=P)` tuyến tính chiếu的说法是概念表述;核心表述更高效

### Các tích hợp vị trí

Patch 没有内在顺序  Transformer 看到的是一个集合──早期 ViT 加入可学习的 1D 位置 嵌入(每个位置一个768-dim Vector,总共 197 个) ──这可以工作,但将模型绑定到训练分辨率:如果推理时改变网格,就必须插值位置表──

现代视觉背骨 使用 2D-RoPE(Qwen2-VL của M-RoPE、SigLIP 2 默认方案) hoặc các vị trí 2D phân yếu tố。2D-RoPE 会根据补丁的( පේ, cột) chỉ dẫn quay truy vấn 和键 矢量, do đó mô hình có thể đưa ra quyết định từ góc quay đối với vị trí 2D。 không cần vị trí ⋅ mô hình trong suy luận có thể xử lý bất kỳ kích thước lưới nào。

### CLS Token、đối hợp đầu ra và mã đăng ký

图像级表示是什么? 三种选择并存:

1. `[CLS]`token──把一个可学习向量 前置到补丁序列──经过所有变压器块 后,CLS token 隐藏状态就是图像表示──继承自BERT──原始 ViT、CLIP 使用这种方式──
2. Mức trung bình:  Xuất khẩu các mã thông báo vá 取平均:  SigLIP:  DINOv2 和大多数现代VLM 使用这种方式: 
3. Các mã đăng ký: Darcet et al. (2023)  Observe, no apparently sink token 训练的 ViT 会产生高范数的artifact patches,并劫持自我注意──加入 416 个可学习的注册代币 可以吸收这个部分负载,并提升密集预测质量(细分,深度)──DINOv2 和 SigLIP 2 都随模型提供注册──

Đây là một lựa chọn sẽ ảnh hưởng đến các nhiệm vụ. CLS  phù hợp với phân loại. Đối với các mã thông báo váy 输入 LLM của VLM, bạn sẽ hoàn toàn nhảy qua việc tập hợp.

### 预训练:监督式、对比式、masked、自蒸

ViT sử dụng JFT-300M 上 上的监督分类 进行预训――很快被以下方法取代:

- CLIP (2021): trong 400M đối với dữ liệu hình ảnh làm tương phản hình ảnh văn bản. Bài học 12.02
- MAE (2021, He et al.): che đậy 75% các vết bẩn, tái tạo hình ảnh.
- DINO (2021) / DINOv2 (2023): sử dụng sinh viên- giáo viên làm tự chưng cất, không có nhãn, không có phụ đề.
- SigLIP / SigLIP 2 (2023, 2025):带 sigmoid loss 和 NaFlex 原生宽高比支持的 CLIP──2026年开放VLMs(Qwen、Idefics2、LLaVA-OneVision) 中的主流视觉塔──

Bạn chọn của trước đào tạo quyết định xương sống 擅长什么:CLIP/SigLIP 擅长与文本做语义匹配,DINOv2 擅长密集视觉特征,MAE 适合作为下游细节调的起点──

### Luật quy mô

ViT quy mô ((Zhai et al. 2022) cho thấy, chất lượng của ViT trong mô hình kích thước, kích thước dữ liệu và tính toán 上 tuân theo quy tắc có thể dự đoán.
- Mô hình lớn hơn + DATA nhiều hơn → chất lượng tốt hơn.
- Kích thước đệm là chiều dài chuỗi và độ trung thành 调节杆──Đệm 14(DINOv2/SigLIP SO400m 典型配置) So với đệm 16 会为每张图像产生更多代码;更适合 OCR 和密集任务,但速度更慢──
- Phân tích là một nền tảng lớn khác. Từ 224 đến 384 và 512 gần như luôn luôn hữu ích, nhưng FLOP được phát triển theo tăng trưởng thứ hai.

ViT-g/14(1B params、patch 14、resolution 224 → 256 token) và SigLIP SO400m/14(400M params、patch 14) là hai mã hóa chính của VLM mở năm 2026。

### Số parameter cho một ViT

完整计算位于 `code/main.py`❖ Đối với 224 下的 ViT-B/16:

```
patch_embed = 3 * 16 * 16 * 768 + 768  =  591k
cls + pos    = 768 + 197 * 768          =  152k
block        = 4 * 768^2 (QKVO) + 2 * 4 * 768^2 (MLP) + 2 * 2*768 (LN)
             = 12 * 768^2 + 3k          =  7.1M
12 blocks    = 85M
final LN    = 1.5k
total       ≈ 86M
```

Trước khi tải kiểm soát điểm, trước tiên sử dụng cách này để ước tính khoảng mỗi ViT.

### 2026 cấu hình sản xuất

2026 năm hầu hết các VLM mở 随模型 cung cấp mã hóa là bản chất phân giải (NaFlex) dưới SigLIP 2 SO400m/14── nó có:
- Các tham số 400M.
- Patch size 14,默认解析度 384 → 每张图像 729 个补丁代币──
- 图像级任务使用平均池;VQA trong tất cả 729 补丁都流入 LLM。
- 4 thẻ đăng ký, trong giao dịch LLM trước bỏ rơi.
- Sử dụng 2D-RoPE,并带有面向本地 aspect ratio của ảnh cấp độ quy mô.

Mỗi quyết định trong việc này có thể được bắt nguồn từ một bài báo mà bạn có thể đọc.


```figure
image-patch-tokens
```

## Sử dụng nó
`code/main.py`Đây là một mã hóa đệm và máy tính hình học. Nó nhận được hình ảnh H、W、 đệm P、 ẩn D、 độ sâu L)并 báo cáo:

- Patching 后的格格形 和序列长度──
- Một tổng hợp 8x8 像素 đồ chơi hình ảnh của Token 序列(逐步走过平坦 + dự án 路径) ⋅
- 按补丁嵌入、位置嵌入、变压器块 和头 拆分的参数数数──
- 目标解析 下单次前进通过的 FLOPs──
- ViT-B/16 @ 224、ViT-L/14 @ 336、DINOv2 ViT-g/14 @ 224、SigLIP SO400m/14 @ 384 的对比表──

运行它──把参数数和已发布数字对齐──调整补丁尺寸和解析度,感受代币 数量成本──

## 交付 nó
本课会生成 `outputs/skill-patch-geometry-reader.md` Đưa ra một cấu hình ViT (( kích thước bản vá, độ phân giải, độ sâu ẩn), nó sẽ tạo ra có lý do để giải thích về số lượng token, số parameter và ước tính VRAM.

## 练习
1. 计算 Qwen2.5VL 在原生 1280x720 输入、补丁尺寸 14 下的补丁符号序列长度──它与只使用 CLS表示相比如何?

2. Một khung hình 1080p ((1920x1080) trong bản vá 14 下会产生多少代币?30 FPS、5 分钟视频会有多少代币视觉?哪种成本削减最有效:pooling、frame sampling,还是代币合并?

3. Sử dụng Python 实现 patch tokens 上的平均聚合――验证对 DINOv2 输出196 代币做平均聚合,与请求集结嵌入 时模型 `forward`Kết quả trả lại phù hợp.

4. 阅读 "Vision Transformers Need Registers" (ArXiv:2309.16588) Phần 3──用两句话描述注册 吸收的艺术品是什么,以及它为什么影响下游密集预测──

5. 修改 `code/main.py`以支持 patch-n'-pack:给定一组不同分辨率的图像,生成一个包装序列 和块-diagonal注意面膜──到课 12.06 时再进行验证──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Patch | “16x16 像素方块” | 输入图像中固定大小、非重叠的区域；会变成一个 Token |
| Patch embedding | “Linear projection” | 一个共享的学习 Matrix（或 stride=P 的 Conv2d），将展平后的 patch 像素映射到 D-dim Vector |
| CLS token | “Class token” | 前置的可学习 Vector，其最终 hidden state 表示整张图像；在 2026 年是可选项 |
| Register token | “Sink token” | 额外的可学习 Token，用于吸收 ViT 在 pretraining 期间产生的高范数 Attention artifacts |
| Position embedding | “Positional info” | 每个位置的 Vector 或旋转，使序列具备顺序感知；2D-RoPE 是现代默认方案 |
| Grid | “Patch grid” | 对于给定 resolution 和 patch size，patch 形成的 (H/P) x (W/P) 2D 数组 |
| NaFlex | “Native flexible resolution” | SigLIP 2 特性：单个模型无需重新训练即可服务多种 aspect ratios 和 resolutions |
| Backbone | “Vision tower” | 预训练 image encoder，其 patch-token 输出会在 VLM 中输入 LLM |
| Pooling | “Image-level summary” | 将 patch tokens 转换为一个 Vector 的策略：CLS、mean、attention pool 或 register-based |
| Patch 14 vs 16 | “Finer vs coarser grid” | Patch 14 每张图像产生更多 Token，对 OCR 有更好 fidelity，但更慢；patch 16 是经典默认值 |

## 延伸阅读
- [Dosovitskiy et al. — An Image is Worth 16x16 Words (arXiv:2010.11929)](https://arxiv.org/abs/2010.11929) 原始 ViT。
- [He et al. — Masked Autoencoders Are Scalable Vision Learners (arXiv:2111.06377)](https://arxiv.org/abs/2111.06377) MAE, tự giám sát trước khi đào tạo.
- [Oquab et al. — DINOv2 (arXiv:2304.07193)](https://arxiv.org/abs/2304.07193) Tự chưng cất quy mô lớn, không có nhãn.
- [Darcet et al. — Vision Transformers Need Registers (arXiv:2309.16588)](https://arxiv.org/abs/2309.16588) đăng ký token 和 đồ tạo vật 分析。
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) 2026 年默认 tầm nhìn tháp.
- [Zhai et al. — Scaling Vision Transformers (arXiv:2106.04560)](https://arxiv.org/abs/2106.04560) 经验性 quy mô luật
