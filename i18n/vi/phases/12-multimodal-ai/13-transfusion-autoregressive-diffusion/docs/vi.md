# Phong truyền: trong một Transformer 中结合 Autoregressive Text + Diffusion Image

> Chameleon và Emu3 把全部筹码押在离散代币 上――它们能工作,但量化瓶很明显:图像质量会在低于连续空间扩散 模型的位置进入平台期.Transfusion(Meta,Zhou et al.,2024 年 8 月) 押相反的方向: giữ图像连续, hoàn toàn loại bỏ VQ-VAE,并用两个损失 训练一个变压器──文本代币 使用下一个代币预测──图像补丁 使用流量匹配 /扩散损失──两个目标优化相同权重──稳定扩散 3层架构MMDiT) 读一读一读一读一读一读一读一读一读一读 转变点,构建一个玩具双损失训练师,跟踪一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读二类工作的面具──

**Type:** Build
**Languages:** Python（stdlib，MNIST-scale 玩具双 loss trainer）
**Prerequisites:** Phase 12 · 11（Chameleon），Phase 8（Generative AI）
**Time:** ~180 minutes

## Học mục tiêu
- 连接一个在同一脊椎上运行两个损失的变压器(文本 代币 上的NTP,图像补丁 上的扩散MSE) ⋅
- 解释为什么图像补丁 之间使用双向注意,同时文本代码 使用因果注意,是正确的面具 选择──
- Trong tính toán, chất lượng và phức tạp của mã, so với hình ảnh truyền hình, mất truyền hình) với hình ảnh phân tán kiểu Chameleon (NTP)
- Nói出 MMDiT 的贡献: Mỗi khối sử dụng trọng lượng cụ thể về phương thức, tập trung vào dòng dư thừa trên.

## 问题
离散图像Token与连续图像Token的争论比 LLM 更早──连续表示(raw pixel、VAE latents)保留细节──离散图像Token(VQ chỉ số)适应变压器的原生词表,但会在量化步骤丢失细节──

Chameleon / Emu3 选择离散路线: một mất mát, một cấu trúc, nhưng hình ảnh bảo mật được Tokenizer 质量限制──

Mô hình phân tán chọn đường nối tiếp: chất lượng hình ảnh rất mạnh, nhưng nó là mô hình chia sẻ với LLM, âm thanh điều chỉnh kỹ thuật phức tạp, cũng không có cách tích hợp sạch với văn bản tạo.

Phụ trào truyền máu  đặt ra câu hỏi là: có thể hai bên được kết hợp không? giữ hình ảnh liên tục, vẫn tập luyện một mô hình,并把 hai lỗ 合进一次梯次步──

## 概念
### 双 mất 架构

Một bộ biến đổi chỉ có trình giải mã xử lý chứa các chuỗi nội dung sau:

- 文本 Token(离散, từ từ ngữ BPE)
- 图像补丁(连续,16x16 khối pixel, thông qua nhúng tuyến tính 投影到隐藏暗,与ViT编码的输入相同)
- `<image>`和 `</image>`标签, được sử dụng để đánh dấu liên tục vá ở vị trí.

Tham gia chỉ chạy một lần. Lãng mất sẽ cho mỗi token.

- Đối với văn bản Đèn: trong đầu từ ngữ-logits 上使用标准交叉︎
- Đối với bản vá hình ảnh: Trong bản vá liên tục 上 sử dụng mất độ phân tán, dự đoán thêm vào mỗi bản vá ồn ồn ồn.

Gradient 会流经共享的变压器体――两个损失 同时改进共享权重――

### Mặt nạ chú ý: văn bản nguyên nhân + hình ảnh hai chiều

文本 Token 必须是因果的;不能让文本 Token attend 到未来文本,否则老师强迫会被破坏――但图像补丁表示同一个快照;它们应该在同一个图像块内相互双向出席――

mặt nạ:

```
M[i, j] = 1 if:
  (i is text and j is text and j <= i)   # causal for text
  OR (i is image and j is image and same_image_block(i, j))   # bidirectional within image
  OR (i is text and j is image and j < i_image_end)   # text attends to previous images
  OR (i is image and j is text and j < i_image_start)   # image attends to preceding text
```

Trong tập luyện và suy nghĩ thực hiện để khối hình ba mặt nạ.

### Transformer 内部 của mất phân tán

Thiếu biến phân tán là hình thức tiêu chuẩn: cho hình ảnh đệm 加噪声,让模型预测噪声(或等价地预测 sạch đệm) ――Thiết dịch phiên bản sử dụng phù hợp dòng chảy:预测 từ ồn đến ồn ồn của trường tốc độ sạch。

训练期间:
1. Đối với mỗi tấm hình x0, cũng như một bước thời gian tự nhiên t.
2. 采样噪声 ε,计算 xt = (1-t) * x0 + t * ε(tích hợp dòng chảy của 线性插值)
3. biến đổi 预测 v_theta(xt, t); mất = MSE(v_theta(xt, t), ε - x0)。
4. Với văn bản trong cùng chuỗi mất NTP một khởi động Backprop。

推理时, tạo流程 là:
- 文本 Địa chỉ: tiêu chuẩn lấy mẫu tự rút
- 图像补丁:以此前文本 标签 为条件的扩散样本循环(通常10-30 bước) ⋅

### MMDiT:Stable Diffusion 3 的变体

Stable Diffusion 3(Esser et al.,2024 年 3 月) trong thời gian gần với Transfusion 接近的发布 MMDiT(Multimodal Diffusion Transformer) ⋅

MMDiT's Key Difference:

- Mỗi khối sử dụng trọng lượng cụ thể về chế độ; mỗi khối biến thể đối với văn bản token và hình ảnh váy phân biệt có độc lập Q、K、V và MLP 权重;; chú ý là chung của(cross-modality); phần còn lại là chế độ cụ thể của。
- Trình luyện dòng chảy chỉnh sửa, một cách phù hợp với dòng chảy cụ thể, 变体,采样方式明确,数学上比DDPM 更简单,
- △MMDiT là xương sống của SD3 △2B 和 8B 参数变体) ・Tăng dịch 论文扩展到7B。

两者汇聚到同一个核心思想: một biến thể đối với văn bản chạy NTP, đối với连续图像表示运行传播――

### Tại sao nó thắng kiểu Chameleon

连续扩散与离散NTP 在图像生成上的质量差是可测量的.

- Trong quy mô 7B, FID tương đương với quy mô kiểu Chameleon
- Không cần phải tập luyện Tokenizer: hình ảnh mã hóa hơn đơn giản hơn(định hướng tuyến tính đến ẩn, tương tự như lớp đầu vào của ViT)
- 图像补丁 去噪音可以并行化推理,不像自动降低图像代币──

缺点:Transfusion is double loss 模型, training动态更难―― giảm cân 需要调参――NTP và sự không phù hợp giữa lịch trình phân phối 可能导致某头占主导――

### 下游分支

Janus-Pro (Lớp 12.15) thông qua giải thích để hiểu và tạo ra bộ mã hóa thị giác để cải thiện ý tưởng của Transfusion: một sử dụng SigLIP, một khác sử dụng VQ, đồng thời chia sẻ cơ thể biến đổi.

Năm 2026 có thể sản xuất các hình ảnh của các loại VLM sản xuất, chẳng hạn như Gemini 3 Pro, GPT-5, Claude Opus 4.7 đường dẫn sản xuất hình ảnh, gần như chắc chắn đã sử dụng một số thế hệ sau của gia đình này.


```figure
cfg-guidance-scale
```

## Sử dụng nó
`code/main.py`Trong một vấn đề rất nhỏ giống như MNIST  xây dựng đồ chơi Transfusion:

- 文本 caption là mô tả số số ((0-9) của短整数序列。
- 图像是4x4 字节网格──
- Một đối với chia sẻ quyền trọng lượng của các dự đoán tuyến tính 充当变压器 替代;文本上使用NTP mất, 噪音补丁上使用MSE mất──
- Trẻ em làm việc với nhau, nhưng mặt nạ tập trung là rõ ràng.
- 生成在一次前进传中产生文本标题 和 4x4 图像──

Bộ biến đổi này là một loại đồ chơi.

## 交付 nó
本课产 出 `outputs/skill-two-loss-trainer-designer.md`△ Đặt ra một nhiệm vụ đào tạo đa phương thức mới (文本 + 图像、文本 + 音频、文本 + 视频), nó sẽ thiết kế lịch giảm cân đôi (减重量、面具形、共享对模式特定块),并标记实现风险──

## 练习
1. Một mô hình đào tạo kiểu truyền máu có chứa 70% mã thông báo văn bản và 30% mã thông báo hình ảnh.

2. Để thực hiện chuỗi này, mặt nạ khối-thượng hình:`[T, T, <image>, P, P, P, P, </image>, T]`将每个条目标为0或1──

3. MMDiT có quy mô cụ thể của QKV 权重―― so với Transfusion's hoàn toàn chia sẻ biến đổi, điều này sẽ tăng bao nhiêu tham số chi tiêu?

4. 生成: Đặt một lệnh văn bản, mô hình đầu tiên vận hành NTP 生成 50 token, sau đó gặp gặp `<image>`, tiếp theo trên 256 ốp lên vận hành 20 ốp cho các bước của sự phân tán.

5. 阅读 SD3 论文 Phần 3  mô tả dòng chảy được sửa chữa, và tại sao nó sử dụng ít hơn các bước suy luận hơn DDPM trên đó có thể nhận được

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Two-loss training | "NTP + diffusion" | 一个 transformer 在同一个 gradient step 中，同时优化文本 Token 上的 cross-entropy 和连续图像 patch 上的 MSE |
| Flow matching | "Rectified flow" | 一种 diffusion 变体，预测从噪声到 clean data 的 velocity field；数学上比 DDPM 更简单 |
| MMDiT | "Multimodal DiT" | Stable Diffusion 3 的架构：joint attention、modality-specific MLPs 和 norms |
| Block-triangular mask | "Causal text + bidirectional image" | 一种 attention mask：跨文本是 causal 的，但在图像区域内是 bidirectional 的 |
| Continuous image representation | "No VQ" | 图像 patch 作为实值 Vector，而不是整数 codebook indices |
| Velocity prediction | "v-parameterization" | 网络输出是噪声与数据之间的 velocity field，而不是噪声本身 |

## 延伸阅读
- [Zhou et al. — Transfusion (arXiv:2408.11039)](https://arxiv.org/abs/2408.11039)
- [Esser et al. — Stable Diffusion 3 / MMDiT (arXiv:2403.03206)](https://arxiv.org/abs/2403.03206)
- [Peebles & Xie — DiT (arXiv:2212.09748)](https://arxiv.org/abs/2212.09748)
- [Zhao et al. — MonoFormer (arXiv:2409.16280)](https://arxiv.org/abs/2409.16280)
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
