# GAN có điều kiện với Pix2Pix

> Sự đột phá lớn đầu tiên của năm 2014-2017 là kiểm soát GAN 生成什么──附加一个标签、一张图像,或一个句子──Pix2Pix thực hiện phiên bản hình ảnh, và trong nhiệm vụ 图像-to-image 狭窄, nó cho đến nay vẫn còn vượt qua mọi mô hình văn bản-to-图像 phổ biến──

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 06 (U-Net), Phase 3 · 07 (CNNs)
**Time:** ~75 分钟

## 问题
无条件 GAN 会采样任意人脸。做演示 有用,进生产 没用──你想要的是:*把草图 映射成照片*、*把地图 映射成空图*、*把白天场景 映射成夜间*、*给灰色图像 上色*──在所有这些任务中,你会得到一个输入图像`x`, và phải xuất với một số tương ứng ngữ nghĩa của `y` Mỗi người `x`Tất cả đều có thể đối phó với nhiều điều hợp lý.`y`✿ Phản ứng không có gì, vì nó trông thật  là cực kỳ...

GAN có điều kiện (Mirza & Osindero, 2014) Đặt điều kiện `c`作为输入加入 `G`和 `D`❖Pix2Pix (Isola et al., 2017) đã làm việc đặc biệt đối với điều này: điều kiện là hình ảnh nhập hoàn chỉnh, trình tạo là U-Net, phân biệt là phân loại dựa trên các bản vá (PatchGAN), Loss là đối thủ + L1── ngay cả trong năm 2026, bộ này vẫn còn vượt qua mô hình văn bản-hình ảnh được đào tạo từ không, bởi vì nó được đào tạo trong dữ liệu đôi* trên  Bạn có đúng là tín hiệu cần thiết──

## 概念
![Pix2Pix: U-Net generator, PatchGAN discriminator](../assets/pix2pix.svg)

**Conditional G.** `G(x, z) → y` Trong Pix2Pix,`z` Không có tiếng ồn nhập  Isola 发现显式 noise 会被忽略)

**Conditional D.** `D(x, y) → [0, 1]`▽输入是 *pair*(condition, output)―这是关键差异:D 必须判断 `y``x`Một致, không chỉ phán xét `y`Có vẻ như thật không?

**U-Net generator.**带有跨瓶跳连接的编码-decoder──对于输入和输出共享低级结构的任务至关重要──没有这些跳转,高频细节会消失──

**PatchGAN discriminator.**D không xuất ra một điểm thật/sự giả, mà xuất ra một điểm `N×N`lưới, mỗi tế bào 判断 khoảng 70×70 pixel của trường thụ nhận.

**Loss.**

```
loss_G = -log D(x, G(x)) + λ · ||y - G(x)||_1
loss_D = -log D(x, y) - log (1 - D(x, G(x)))
```

L1 项稳定训练,并推动 G 接近已知目标──L1 hơn L2 产生更利的边缘(medians,而不是 means)──`λ = 100`Đó là giá trị được định nghĩa của Pix2Pix.

## CycleGAN  khi bạn không có cặp

Pix2Pix  cần kết hợp `(x, y)`Data。CycleGAN (Zhu et al., 2017) 通过额外的 Loss 放弃这个要求:*những hệ thống nhất quán của chu kỳ* mất── hai máy phát điện:`G: X → Y`和 `F: Y → X`❖ Trình luyện chúng, làm `F(G(x)) ≈ x`且 `G(F(y)) ≈ y` Để bạn có thể trong trường hợp không có các ví dụ cặp, chuyển ngựa thành zebra  mùa hè  chuyển thành mùa đông

Trong năm 2026, không có hình ảnh-đối với hình ảnh lớn thông qua sự phổ biến (ControlNet、IP-Adapter) hoàn thành, thay vì CycleGAN, nhưng sự nhất quán của chu kỳ vẫn tồn tại trong hầu hết các bài viết về việc thích ứng miền không có cặp trong bài luận.


```figure
gx-patchgan
```

##  xây dựng nó
`code/main.py`Trong dữ liệu 1-D 上 thực hiện một GAN có điều kiện nhỏ.`c`: : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : :

### Bước 1: sẽ thêm điều kiện vào G và D của nhập

```python
def G(z, c, params):
    return mlp(concat([z, one_hot(c)]), params)

def D(x, c, params):
    return mlp(concat([x, one_hot(c)]), params)
```

Mã hóa một-sốc là cách đơn giản nhất. Các mô hình lớn hơn sẽ sử dụng các bản nhúng học tập.

### 步骤 2: tàu điều kiện

```python
for step in range(steps):
    x, c = sample_real_conditional()
    noise = sample_noise()
    update_D(x_real=x, x_fake=G(noise, c), c=c)
    update_G(noise, c)
```

Bộ phát điện phải phù hợp với * cho định điều kiện 下 * của phân bố thực, chứ không phải là biên.

### Bước 3: Kiểm tra mỗi lớp của xuất

```python
for c in [0, 1]:
    samples = [G(noise, c) for noise in batch]
    mean_c = mean(samples)
    assert_near(mean_c, real_mean_for_class_c)
```

## 陷
- **Condition 被忽略。**G 学会边缘 hóa,D 从不惩罚,因为 tình trạng tín hiệu 太弱──修复:更强地 tình trạng D( lớp sớm,而不只是迟), sử dụng phân biệt so sánh (Miyato & Koyama 2018)。
- **L1 weight 过低。**G 漂移到任意看起来真实输出, thay vì trung thực.
- **L1 weight 过高。**G  tạo ra các kết quả không rõ ràng, vì L1  vẫn là chuẩn L_p 
- **D 中 ground-truth leakage。**sẽ`(x, y)`concat  như D input,而不只是 `y`否则 D 无法检查一致性
- **每个 class 的 mode collapse。**Mỗi lớp đều có thể sụp đổ độc lập.

## Sử dụng nó
2026 年 hình ảnh-to-image  nhiệm vụ trạng thái:

| Task | Best approach |
|------|---------------|
| Sketch → photo, same domain, paired data | Pix2Pix / Pix2PixHD（仍然快，仍然锐利） |
| Sketch → photo, unpaired | 带 Scribble conditioning model 的 ControlNet |
| Semantic seg → photo | SPADE / GauGAN2 或 SD + ControlNet-Seg |
| Style transfer | 带 IP-Adapter 或 LoRA 的 Diffusion；GAN methods 属于 legacy |
| Depth → photo | Stable Diffusion 上的 ControlNet-Depth |
| Super-resolution | Real-ESRGAN (GAN), ESRGAN-Plus, 或 SD-Upscale (diffusion) |
| Colorization | ColTran、diffusion-based colorizers，或 Pix2Pix-color |
| Daytime → nighttime, seasons, weather | CycleGAN 或 ControlNet-based |

Khi (a) bạn có hàng ngàn ví dụ cặp, (b) nhiệm vụ nhỏ và có thể lặp lại, và (c) cần kết luận nhanh chóng, Pix2Pix vẫn là một công cụ chính xác.

## 交付 nó
保存 `outputs/skill-img2img-chooser.md`Skill 接收 task description、data availability ((cặp với không cặp n Sample) và latency/quality budget, rồi输出:approach(Pix2Pix、CycleGAN、ControlNet variant、SDXL + IP-Adapter)、trenning data requirements、inference cost 和 evalu protocol(LPIPS、FID、task-specific)。

## 练习
1. **Easy.**修改 `code/main.py`, gia nhập lớp thứ ba. Bác nhận rằng G vẫn đang đưa tiếng ồn của mỗi lớp lên đúng chế độ.
2. **Medium.**Trong thiết lập 1-D 中用 nhận thức kiểu mất 替换 L1(ví dụ như một D nhỏ đóng băng 作为特征提取器) ―― nó sẽ thay đổi độ sắc nét của phân phối điều kiện 吗?
3. **Hard.**Trong cài đặt 1-D 中草拟一个CycleGAN: hai phân phối, hai máy phát điện, mất chu kỳ.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Conditional GAN | “带 labels 的 GAN” | G(z, c), D(x, c)。两个 networks 都看到 condition。 |
| Pix2Pix | “Image-to-image GAN” | 带 U-Net G 和 PatchGAN D + L1 loss 的 paired cGAN。 |
| U-Net | “带 skips 的 encoder-decoder” | 对称 conv network；skips 保留 high-freq。 |
| PatchGAN | “Local-realism classifier” | D 输出 per-patch score，而不是 global score。 |
| CycleGAN | “Unpaired image translation” | 两个 G + cycle-consistency loss；没有 paired data。 |
| SPADE | “GauGAN” | 用 semantic map normalize intermediate activations；segmentation-to-image。 |
| FiLM | “Feature-wise linear modulation” | 来自 condition 的 per-feature affine transform；便宜的 conditioning。 |

## 生产说明: Pix2Pix 作为受延迟约束的基线

Khi bạn có dữ liệu kết hợp và nhiệm vụ nhỏ gọn(sketch → render、semantic map → photo、day ‧night) thời gian, kết luận một lần của Pix2Pix trong độ trễ trên so với phân phối 快一个数量级──Phân so sánh sản xuất thường là:

| Path | Steps | Typical latency at 512² on a single L4 |
|------|-------|----------------------------------------|
| Pix2Pix (U-Net forward) | 1 | ~30 ms |
| SD-Inpaint or SD-Img2Img | 20 | ~1.2 s |
| SDXL-Turbo Img2Img | 1-4 | ~0.15-0.35 s |
| ControlNet + SDXL base | 20-30 | ~3-5 s |

Pix2Pix trong sản lượng của các lô tĩnh 上胜出(mỗi yêu cầu đều là FLOPs giống nhau)。Diffusion trong chất lượng 和 tổng quát 上胜出。

## 延伸阅读
- [Mirza & Osindero (2014). Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784) cGAN 论文。
- [Isola et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks](https://arxiv.org/abs/1611.07004) Pix2Pix。
- [Zhu et al. (2017). Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks](https://arxiv.org/abs/1703.10593) CycleGAN。
- [Wang et al. (2018). High-Resolution Image Synthesis with Conditional GANs](https://arxiv.org/abs/1711.11585) Pix2PixHD
- [Park et al. (2019). Semantic Image Synthesis with Spatially-Adaptive Normalization](https://arxiv.org/abs/1903.07291) SPADE / GauGAN。
- [Miyato & Koyama (2018). cGANs with Projection Discriminator](https://arxiv.org/abs/1802.05637) chiếu D。
