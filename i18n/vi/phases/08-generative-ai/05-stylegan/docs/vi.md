# StyleGAN

> Hầu hết các máy phát hành sẽ`z`Cùng nhau vào từng tầng.`z`映射到中间表示 `w`, sau đó qua AdaIN trong mỗi phân giải cấp độ * inject * `w` Một sự thay đổi này đã mở ra không gian ẩn, và khiến những khuôn mặt thực sự của người trong suốt 7 năm trở thành một vấn đề đã được giải quyết.

**类型：**构建
**语言：**Python
**前置要求：**Giai đoạn 8 · 03 (GAN), Giai đoạn 4 · 08 (Tình thường hóa), Giai đoạn 3 · 07 (CNN)
**时间：**~ 45 phút

## 问题

DCGAN  thông qua một lắp chuyển biến sẽ`z`映射成一张图像── vấn đề là:`z`控制一切,包括姿态,光照,身份,背景, và chúng đều được gắn liền với nhau.`z`Trong một vòng trục, tất cả mọi người sẽ thay đổi. Bạn không thể yêu cầu mô hình của cùng một người, một tư thế khác nhau, bởi vì biểu hiện này không thể phân hủy như vậy.

Karras et al. (2019, NVIDIA) 提出:停止把 `z`Đưa trực tiếp vào các lớp chứa.`4×4×512`tensor 作为网络输入──学习一个8层 MLP,把 `z ∈ Z → w ∈ W`❖ Thông qua * Adaptive instance normalization* (AdaIN) trong mỗi phân giải `w`: Trước tiên bình thường hóa mỗi con tính năng bản đồ, sau đó sử dụng `w`Các dự đoán có liên quan làm quy mô và thay đổi.

Kết quả là:`W`Đối với phong cách 高层(姿态、身份) với 细粒度 style(光照、颜色) có một xoắn ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối ối `w`作为低分辨率层级的风格,并使用图像B 的 `w`Như một phong cách ở cấp độ phân giải cao, do đó, chuyển đổi giữa hai hình ảnh giữa hai phong cách.

## 概念

![StyleGAN: mapping network + AdaIN + per-layer noise](../assets/stylegan.svg)

**Mapping network。** `f: Z → W`, một 8 tầng MLP`Z = N(0, I)^512``W`Không bị buộc phải làm Gaussian, mà học cách thích nghi với hình dạng dữ liệu.

**Synthesis network。**Từ một học đến một số lượng thường xuyên`4×4×512`开始── mỗi khối phân giải:`upsample → conv → AdaIN(w_i) → noise → conv → AdaIN(w_i) → noise`△分辨率翻倍:4, 8, 16, 32, 64, 128, 256, 512, 1024―

**AdaIN。**

```
AdaIN(x, y) = y_scale · (x - mean(x)) / std(x) + y_bias
```

Trong số đó `y_scale`和 `y_bias`Từ`w`Các dự đoán có liên quan đến bản đồ, theo bản đồ tính năng bình thường hóa, sau đó tái xây dựng phong cách.

**逐层 noise。**Đối với mỗi bản đồ tính năng  thêm một đường dẫn tiếng ồn Gaussian,并由学到的 từng đường dẫn yếu tố được thu nhỏ hơn. Nó kiểm soát các chi tiết theo thời gian, không ảnh hưởng đến toàn bộ cấu trúc.

**Truncation trick。**suy luận 时,采样 `z`,计算 `w = mapping(z)`, rồi rồi`w' = ŵ + ψ·(w - ŵ)`, trong số đó `ŵ`là trung bình trên nhiều mẫu`w``ψ < 1`用多样性换质量──几乎每个 StyleGAN demo đều sử dụng `ψ ≈ 0.7`

## StyleGAN 1 → 2 → 3

| 版本 | 年份 | 创新 |
|---------|------|------------|
| StyleGAN | 2019 | Mapping network + AdaIN + noise + progressive growing。 |
| StyleGAN2 | 2020 | Weight demodulation 替代 AdaIN（修复 droplet artifacts）；skip/residual architecture；path-length regularization。 |
| StyleGAN3 | 2021 | Alias-free convolution + equivariant kernels；消除 texture 粘在 pixel grid 上的问题。 |
| StyleGAN-XL | 2022 | Class-conditional, 1024², ImageNet。 |
| R3GAN | 2024 | 以更强的 reg 重新包装；在 FFHQ-1024 上用少 20 倍的 params 缩小与 diffusion 的差距。 |

Đến năm 2026, StyleGAN3 vẫn là lựa chọn mặc định của các trường hợp sau đây: a) Phương pháp thực hiện các ảnh trong lĩnh vực nhỏ của FPS cao, b) điều chỉnh các miền ít ảnh, tập trung bản đồ với 100张图像 trên tập dữ liệu mới, c) Lập kế hoạch dựa trên đảo ngược, tìm lại các ảnh thực tế.`w`, tái biên tập cái này `w`(■■) Đối với lĩnh vực mở văn bản-để hình ảnh, nó không phải là công cụ thích hợp, phát tán 才是■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


```figure
gx-stylegan-mapping
```

##  xây dựng nó

`code/main.py`实现一个1-D的玩具版 style-GAN lite: một bản đồ MLP, một chức năng tổng hợp, nó nhận học đến của 矢量常量,并用从 `w`派生的尺度/bias 进行调制, còn có tiếng ồn từng tầng. Nó được hiển thị thông qua sự điều chỉnh-phân phối.`w`, có thể đạt được hoặc vượt quá `z`拼接进生成器输入方式──

### 步骤 1: mạng bản đồ

```python
def mapping(z, M):
    h = z
    for i in range(num_layers):
        h = leaky_relu(add(matmul(M[f"W{i}"], h), M[f"b{i}"]))
    return h
```

### 步骤 2: Normalization phiên bản thích ứng

```python
def adain(x, w_scale, w_bias):
    mu = mean(x)
    sd = std(x)
    x_norm = [(xi - mu) / (sd + 1e-8) for xi in x]
    return [w_scale * xi + w_bias for xi in x_norm]
```

Mỗi bản đồ tính năng của quy mô và thiên vị đều thông qua chiếu tuyến tính từ `w`Tôi nhận được.

### 步骤 3: tiếng ồn mỗi lớp

```python
def add_noise(x, sigma, rng):
    return [xi + sigma * rng.gauss(0, 1) for xi in x]
```

Mỗi đường dẫn của Sigma là có thể học được.

## 陷

- **Droplet artifacts。**StyleGAN 1 会在功能地图中产生块状滴,因为 AdaIN 把 mean 归零了──StyleGAN 2 通过缩减卷积重来修复它──
- **Texture sticking。**Các kết cấu của StyleGAN 1 và 2 theo các phối hợp pixel, chứ không phải các phối hợp đối tượng(( trong sự phân cực 时可见) ・StyleGAN 3 có các biến dạng không có tên gọi sử dụng bộ lọc sink cửa sổ sửa chữa điểm này。
- **Mode coverage。**Truncation `ψ < 0.7`Có vẻ sạch, nhưng nó chỉ có một hình dạng vùng rất hẹp; nếu cần đa dạng, sử dụng `ψ = 1.0`
- **Inversion 有损。**Trở lại ảnh thực tế`W`Thông thường thông qua tối ưu hóa hoặc mã hóa (e4e, ReStyle, HyperStyle) hoàn thành.

## Sử dụng nó

| 使用场景 | 方法 |
|----------|----------|
| 照片级真实人脸（anime、product、窄领域） | StyleGAN3 FFHQ / custom fine-tune |
| 从照片进行人脸编辑 | e4e inversion + StyleSpace / InterFaceGAN directions |
| Face swap / reenactment | StyleGAN + encoder + blending |
| Avatar pipelines | StyleGAN3 w/ ADA for low-data fine-tune |
| 从少量图像做 domain adaptation | 冻结 mapping network，fine-tune synthesis |
| Multimodal 或 text-conditioned generation | 不要用它，使用 diffusion |

Đối với câu trả lời là  một người khuôn mặt ảnh  của sản phẩm cấp demo,StyleGAN trong suy luận chi phí( một lần đi trước, ở 4090 trên <10ms) và cùng chất lượng  dưới sắc nét trên thắng phân tán。

## 交付 nó

保存 `outputs/skill-stylegan-inversion.md`◊Skill 接收一张真实照片并输出: phương pháp đảo ngược (e4e / ReStyle / HyperStyle) 、预期 tiềm ẩn mất mát 、 chỉnh sửa ngân sách  在出现文物 之前你能在`W`Trung移动多远), cũng như danh sách các hướng sửa đổi đã được biết đến hiệu quả ([[年龄]],表情、姿态]]).

## 练习

1. **简单。**分別用 `adain_on=True`和 `adain_on=False`运行 `code/main.py`❖ So sánh các hoạt động cố định và các hoạt động bị trục trặc
2. **中等。**实现 trộn thường xuyên: đối với một lô đào tạo,计算 `w_a``w_b`, và trong giai đoạn đầu của tổng hợp ứng dụng`w_a`, phần cuối ứng dụng`w_b`❖ decoder 是否学到了 những phong cách không liên quan?
3. **困难。**取一个预训练的 StyleGAN3 FFHQ模型(ffhq-1024.pkl) ⋅通过在带标签样本上训练 SVM,找到控制 smile 的 `w`hướng; báo cáo trong tình trạng漂移前 có thể thúc đẩy hơn nữa.

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Mapping network | “那个 MLP” | `f: Z → W`，8 层，把 latent geometry 与数据统计解耦。 |
| W space | “Style space” | Mapping network 的输出；大致 disentangled。 |
| AdaIN | “Adaptive instance norm” | Normalize feature map，然后由 `w`-projection 做 scale + shift。 |
| Truncation trick | “Psi” | `w = mean + ψ·(w - mean)`，ψ<1 用多样性换质量。 |
| Path-length regularization | “PL reg” | 惩罚 `w` 中单位变化导致的图像大幅变化；让 `W` 更平滑。 |
| Weight demodulation | “StyleGAN2 的修复” | Normalize conv weights 而不是 activations；消除 droplet artifacts。 |
| Alias-free | “StyleGAN3 的技巧” | Windowed sinc filters；消除 texture 粘在 pixel grid 上的问题。 |
| Inversion | “为真实图像找到 w” | Optimize 或 encode `x → w`，使 `G(w) ≈ x`。 |

## Biểu sử sản xuất: Tại sao StyleGAN vẫn có mặt trên mạng vào năm 2026

4090 StyleGAN3 能在10 ms内生成一张 10242 FFHQ 人脸:`num_steps = 1`, không có mã hóa VAE, không có thông qua sự chú ý chéo.**300× 差距**, đối với các sản phẩm trong lĩnh vực nhỏ (ví dụ: dịch vụ avatar, đường ống tài liệu ID, sản xuất mặt hàng), nó nằm trong TCO 上胜出.

2 vận tải:

- **没有 scheduler，没有 batcher。**Với mục tiêu chiếm đóng thực hiện lô tĩnh là tốt nhất.
- **Truncation `ψ` 是安全旋钮。** `ψ < 0.7`Từ mạng lưới bản đồ 范围内的 một khu vực 狭形采样── đây là lớp phục vụ đối với sự biến động mẫu 拥有的唯一杆──峰值负载时降低`ψ`, cho người dùng cao cấp  nâng cao nó.

## 延伸阅读

- [Karras et al. (2019). A Style-Based Generator Architecture for GANs](https://arxiv.org/abs/1812.04948) StyleGAN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2。
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3。
- [Tov et al. (2021). Designing an Encoder for StyleGAN Image Manipulation](https://arxiv.org/abs/2102.02766) đảo ngược e4e。
- [Sauer et al. (2022). StyleGAN-XL: Scaling StyleGAN to Large Diverse Datasets](https://arxiv.org/abs/2202.00273) StyleGAN-XL。
- [Huang et al. (2024). R3GAN: The GAN is dead; long live the GAN!](https://arxiv.org/abs/2501.05441) 现代最小化 GAN công thức。
