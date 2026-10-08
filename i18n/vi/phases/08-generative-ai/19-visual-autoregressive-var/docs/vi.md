# Mô hình hóa tự động theo cấp (VAR): Dự đoán quy mô tiếp theo

> Phân phối mô hình trong thời gian 代采样 (代采样)  VAR trong quy mô 代采样, tức là trước tiên dự đoán một 1x1 Token, tái dự đoán 2x2, sau đó 4x4, cho đến khi phân giải cuối cùng, mỗi quy mô đều theo quy mô trước đó.

**Type:** Build
**Languages:** Python (with PyTorch)
**Prerequisites:** Phase 7 Lesson 03 (Multi-Head Attention), Phase 8 Lesson 06 (DDPM)
**Time:** ~90 minutes

## 问题

Autoregressive 生成之所以主导语言建模,是因为它能预测地扩展:更多计算、更多参数、更低困惑、更好的输出──2024 年之前, hình ảnh生成主要有两类 AR 尝试:PixelRNN/PixelCNN(逐像素) 和DALL-E 1 / Parti / MuseGAN(在VQ-VAE mã上逐代币)

两者都困难在生成顺序问题──像素和代币 排列在2D 网格中, nhưng AR 模型必须使用1D raster order 访问它们──早期角落像素不知道图像最终会变成什么──生成质量的扩展性与文本上的GPT不同,也从未在匹配计算量时达到 Diffusion 模型质量──

VAR  thông qua thay đổi tạo ra đối tượng để giải quyết vấn đề tạo ra thứ tự. VAR không phải là trong không gian từng cá nhân dự đoán hình ảnh biểu tượng, mà là với sự tăng cường độ phân giải dự đoán toàn bộ hình ảnh.

Mỗi thước đều sẽ chú ý đến tất cả các thước trước đó (với quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy trình quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy quy

## 概念

### VQ-VAE Multi-Scale Tokenizer

VAR  cần một **multi-scale discrete Tokenizer**Đối với hình ảnh x, nó sẽ tạo ra một loạt các mã thông báo 网格:

```
x -> encoder -> latent f
f -> tokenize at 1x1: token grid z_1 of shape (1, 1)
f -> tokenize at 2x2: token grid z_2 of shape (2, 2)
...
f -> tokenize at (H/p)x(W/p): token grid z_K of shape (H/p, W/p)
```

Mỗi z_k sử dụng cùng một cuốn sách mã (tương tự là 4096-16384)  Tokenization trên mỗi thước không phải là độc lập với nhau, mà được đào tạo để tạo ra các yêu cầu và khả năng tái tạo các thước dư:

```
f ≈ upsample(embed(z_1), target_size) + ... + upsample(embed(z_K), target_size)
```

Đây là một **residual VQ**变体──尺度 k 捕获尺度 1..k-1 遗漏的内容──Decoder 接收所有尺度 嵌入的和并生成图像──

VQ Tokenizer đa quy mô chỉ được đào tạo một lần (như VQGAN), sau đó kết thúc.

### Dự đoán về quy mô tiếp theo

生成模型 là một Transformer, nó nhìn thấy tất cả các Token trước đó,并 dự đoán một Token sau đây.

Cấu trúc chuỗi đầu vào:
```
[START, z_1 tokens, z_2 tokens, z_3 tokens, ..., z_K tokens]
```

Đơn vị đặt cùng thời gian và vị trí trong không gian. Đơn vị đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt đặt

训练 Loss: trong mỗi thước k, given all trước thước của Token,预测 Token z_k。 đối với các mã VQ phân tán sử dụng Loss cross-entropy。 cấu trúc giống như GPT, chỉ là trong đó sequence đã trở thành một chuỗi cấu trúc quy mô。

### 生成

推理时:
```
generate z_1 = sample from p(z_1)                    # 1 token
generate z_2 = sample from p(z_2 | z_1)              # 4 tokens in parallel
generate z_3 = sample from p(z_3 | z_1, z_2)         # 16 tokens in parallel
...
decode: f = sum of embed-and-upsample scales 1..K
image = VAE_decoder(f)
```

Khi K = 10 个尺度时,生成需要10次 Transformer forward pass. Mỗi lần đi qua đều đều tạo ra toàn bộ kích thước, thay vì tự quay lại trong kích thước. Đối với 256x256 hình ảnh, đó là khoảng 10 lần đi qua, trong khi DiT là 28-50 lần.

### Tại sao Next-Scale  thắng hơn Next-Token

3 lợi thế cấu trúc:
1. **从粗到细符合自然图像统计规律。**Các quy tắc liên quan đến quy mô của cảm giác hình ảnh và bộ dữ liệu hình ảnh đều được trình bày: cấu trúc thường xuyên thấp ổn định và có thể dự đoán; chi tiết thường xuyên cao được điều kiện với nội dung thường xuyên thấp.
2. **尺度内并行生成。**Không giống như GPT 风格的Token AR,VAR một bước tạo ra một số thước của các Token──有效生成长度是对数尺,而不是线性尺度──
3. **没有生成顺序偏置。**Địa chỉ của kích thước k có thể nhìn thấy toàn bộ kích thước k-1; không có vị trí  bên trái hoặc  trên, sẽ không buộc các Địa chỉ sớm trong thời gian muộn để có thể sử dụng trước khi thực hiện cam kết.

### Luật quy mô

Tian et al.  chứng minh VAR trên ImageNet trên FID  tuân theo đường cong quy mô pháp luật quyền lực, giống như sự bối rối của GPT 一样──参数或计算量翻倍,会可靠地让错误减半── đây là mô hình hình thành mô hình hình ảnh rõ ràng như mô hình ngôn ngữ. Kết quả là mô hình quy mô VAR 预测 có thể được tính toán bằng quy mô dự đoán, chứ không phải dựa vào kinh nghiệm đoán của từng cấu trúc──

### Quan hệ với Diffusion

VAR và Diffusion chia sẻ cùng một câu chuyện thu nhỏ dữ liệu: cả hai đều phân chia các vấn đề tạo ra thành một loạt các vấn đề nhỏ dễ dàng hơn.

- Phân phối: dần dần gia nhập tiếng ồn, học cách loại bỏ bước đi.
- VAR: dần dần tăng độ phân giải, học dự đoán next one dimension.

Chúng là các đường nét khác nhau của vấn đề tương tự. Cả hai đều tạo ra phân bố điều kiện có thể xử lý.


```figure
gx-var-next-scale
```

##  xây dựng nó

Trong `code/main.py`Trung, bạn sẽ:
1. Trong tổng hợp hình ảnh dữ liệu ((2D Gaussian rings) trên xây dựng một mô hình nhỏ**multi-scale VQ Tokenizer**
2. 训练一个 **VAR-style Transformer**Đèn dự đoán quy mô tiếp theo.
3. 通过调用变压器 4 次(4 个尺度)并解码来采样──
4. 验证按尺度顺序训练会让生成在尺度内并行──

Đây là một sự triển khai đồ chơi. Điểm nhấn là nhìn vào quy mô cấu trúc.

## 交付 nó

本课会生成 `outputs/skill-var-tokenizer-designer.md`, Đây là một kỹ năng được sử dụng để thiết kế Tokenizer đa quy mô: số lượng kích thước, tỷ lệ kích thước, kích thước sổ sách khoá, chia sẻ dư thừa, kiến trúc decoder.

## 练习

1. **尺度数量消融。**Sử dụng 4、6、8、10 个尺度训练 VAR。 đo lường xây dựng lại chất lượng với Autoregressive pass số lượng quan hệ。更多尺度 = 更细残留 = 更好质量,但通过更多。

2. **Codebook size。**训练 codebook size 为 512、4096、16384 的 Tokenizer── lớn hơn codebook 带来更好的重建,但预测更难──找到拐点──

3. **尺度内并行检查。**Đối với VAR được đào tạo tốt, hình thức đo lường mô hình chú ý.

4. **VAR vs DiT scaling。**Đối với cùng một nhiệm vụ điều kiện lớp ImageNet, trong phù hợp với số liệu ngân sách đào tạo VAR và DiT (ví dụ: 33M,130M、458M)  vẽ FID vs tính toán.

5. **Text conditioning。**扩展 VAR,让它通过 adaLN 接收文本嵌入(CLIP tập hợp) như là thêm điều kiện đầu vào.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| VAR | "Visual AutoRegressive" | 通过在 VQ Token 网格金字塔上进行 next-scale prediction 来生成图像 |
| Next-scale prediction | "Predict coarser, then finer" | 模型以不断增加的分辨率尺度预测 Token，并以所有之前尺度为条件 |
| Multi-scale VQ tokenizer | "Residual VQ" | 生成 K 个分辨率递增 Token 网格的 VQ-VAE，decoder 会对所有尺度求和 |
| Scale k | "Pyramid level k" | K 个分辨率层级之一，从 k=1 的 1x1 到 k=K 的 (H/p)x(W/p) |
| Parallel-within-scale | "One forward per scale" | 尺度 k 的所有 Token 在一次 Transformer pass 中预测，而不是自回归预测 |
| Causal-across-scales | "Scale-ordered attention" | 尺度 k 的 Token 可以 Attention 到尺度 1..k 的全部内容，但不能 Attention 到尺度 k+1..K |
| Residual VQ | "Additive tokenization" | 每个尺度的 Token 编码较低尺度留下的 residual；decoder 对所有尺度 Embedding 求和 |
| VAR scaling law | "Image GPT scaling" | FID 随 compute 遵循可预测的 power law，类似语言模型的 perplexity |
| HART | "Hybrid VAR + text" | Text-conditional VAR 变体，将 MaskGIT-style iterative decoding 与 VAR 的尺度结构结合 |
| Scale position embedding | "(scale, row, col) triple" | Positional encoding 同时携带尺度索引和尺度内空间坐标 |

## 延伸阅读
- [Tian et al., 2024 — "Visual Autoregressive Modeling: Scalable Image Generation via Next-Scale Prediction"](https://arxiv.org/abs/2404.02905) VAR 论文, tiêu chuẩn参考
- [Peebles and Xie, 2022 — "Scalable Diffusion Models with Transformers"](https://arxiv.org/abs/2212.09748) DiT, Diffusion so với đường cơ sở
- [Esser et al., 2021 — "Taming Transformers for High-Resolution Image Synthesis"](https://arxiv.org/abs/2012.09841) VQGAN, VAR của nhiều quy mô Tokenizer 所扩展的 Tokenizer家族
- [van den Oord et al., 2017 — "Neural Discrete Representation Learning"](https://arxiv.org/abs/1711.00937) VQ-VAE, phân tán hình ảnh nền tảng của Tokenization
- [Tang et al., 2024 — "HART: Efficient Visual Generation with Hybrid Autoregressive Transformer"](https://arxiv.org/abs/2410.10812) VAR theo văn bản
