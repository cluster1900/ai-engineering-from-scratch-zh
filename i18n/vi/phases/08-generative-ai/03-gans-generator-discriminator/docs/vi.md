# GANs  Generator vs. Discriminator

> Goodfellow trong năm 2014 kỹ thuật là hoàn toàn nhảy qua mật độ. Hai mạng. Một tạo giả. Một nắm bắt chúng. Chúng đối đầu với nhau, cho đến khi giả không thể phân biệt với mẫu thực. Nó đã không nên hoạt động. Nó cũng thường không hoạt động. Nhưng một khi hoạt động, đối với lĩnh vực hẹp, các mẫu nó tạo ra vẫn là những mẫu có lợi nhất trong văn bản.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 08 (Optimizers), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

## 问题

VAE sẽ tạo ra các mẫu mờ, bởi vì mất mát của các mSE decoder của chúng đối với các hình ảnh là Bayes tốt nhất, và số lượng trung bình của các số hợp lý là một số mờ. Bạn muốn một loại mất mát hợp lý, thay vì một phần thưởng với một mục tiêu nào đó ở cấp độ khôn ngoan về pixel.

Goodfellow's idea: train một classifier `D(x)`Để phân biệt hình ảnh thực và giả.`G(z)`Để lừa dối`D``G`Đ signal mất mát là`D`Khi nghĩ rằng một cái gì đó trông thật dựa trên...`G`改进, tín hiệu này cũng sẽ được cập nhật, theo đuổi một mục tiêu di động. Nếu hai mạng đều được nhận,`G`Chỉ là chưa bao giờ viết`log p(x)`Trong trường hợp học tập phân phối dữ liệu:

Đó là huấn luyện đối thủ.

```
min_G max_D  E_real[log D(x)] + E_fake[log(1 - D(G(z)))]
```

Đến năm 2026, GANs đã không còn là máy phát điện SOTA (diffusion and flow matching) nhưng StyleGAN 2/3 vẫn là mô hình khuôn mặt n lợi nhất đã được phát hành, các phân biệt đối xử GAN được sử dụng để đào tạo phân phối trong số các mất mát nhận thức*, trong khi đào tạo đối thủ 支着快速1步蒸蒸 (SDXL-Turbo, SD3-Turbo, LCM),让你能交付实时扩散――

## 概念

![GAN training: generator and discriminator in minimax](../assets/gan.svg)

**Generator `G(z)`。**     `z ~ N(0, I)`映射到样本 `x̂`△ Một decoder 形状的网络(dense 或转换 conv) △

**Discriminator `D(x)`。**Sẽ mô tả mẫu 映射为 skalar probability (hoặc điểm số) ⋅真实 → 1,fake → 0⋅

**Loss。**两个交替更新:

- **训练 `D`：** `loss_D = -[ log D(x) + log(1 - D(G(z))) ]`对 real=1, fake=0 thực hiện sự phân cực.
- **训练 `G`：** `loss_G = -log D(G(z))` Đó là Goodfellow 使用的 *non-saturating* 形式(原始的 `log(1 - D(G(z)))`会 saturate, và `D`很自信时杀死梯度) ⋅

**Training loop。**Một bước `D`, bước `G`重复

**为什么它能工作。**Nếu `G`完美匹配 `p_data`Vậy thì`D`Làm gì không đến hơn là đoán tốt hơn, và ở trong đầu ra 0.5;`G`Không được gradient nữa.

**为什么它会失效。**Phong trào chế độ`G`找到一个 `D`Không thể phân biệt chế độ, rồi mãi mãi tạo ra nó) 、 biến mất gradient(`D`Học quá nhanh,`log D`saturates) ∞ training instability (tăng độ học tập, kích thước lô hàng, bất cứ thứ gì) ∞

## 让 GANs 可用变体

| Year | Innovation | Fix |
|------|------------|-----|
| 2015 | DCGAN | Conv/deconv、batch norm、LeakyReLU —— 第一个稳定 architecture。 |
| 2017 | WGAN, WGAN-GP | 用 Wasserstein distance + gradient penalty 替换 BCE。修复 vanishing gradient。 |
| 2017 | Spectral normalization | 对 discriminator 做 Lipschitz-bound。2026 年的 discriminators 中仍在使用。 |
| 2018 | Progressive GAN | 先训练低分辨率，再添加 layers。首次达到 megapixel results。 |
| 2019 | StyleGAN / StyleGAN2 | Mapping network + adaptive instance norm。固定领域 photorealism 的 state of the art。 |
| 2021 | StyleGAN3 | Alias-free、translation-equivariant —— 2026 年仍然是 face gold standard。 |
| 2022 | StyleGAN-XL | Conditional、class-aware、更大 scale。 |
| 2024 | R3GAN | 以更强 regularization 重新包装；无需 tricks 即可在 1024² 上工作。 |


```figure
gan-minimax
```

##  xây dựng nó

`code/main.py`Trong dữ liệu 1-D 上训练一个小型GAN:两个Gaussians的混合──发电机和歧视器 都是单层隐藏MLPs──我们手写实现前进、后退 和最小x循环──目标是看两个关键失败模式(模式崩 +渐变消失)

### 步骤 1: mất mát không bão hòa

Vanilla Goodfellow mất mát`log(1 - D(G(z)))`会在 D 以高信度把 G của giả phân loại cho giả 时趋近 0。此时 G của gradient 基本为零,G 无法改进──非和形式 `-log D(G(z))`具有相反的语法: Khi D 很自信时它会爆增, cho G một tín hiệu mạnh mẽ.

```python
def g_loss(d_fake):
    # maximize log D(G(z))  <=>  minimize -log D(G(z))
    return -sum(math.log(max(p, 1e-8)) for p in d_fake) / len(d_fake)
```

### 步骤 2: Mỗi bước phát điện đối phó với một bước phân biệt đối xử

```python
for step in range(steps):
    # train D
    real_batch = sample_real(batch_size)
    fake_batch = [G(z) for z in sample_noise(batch_size)]
    update_D(real_batch, fake_batch)

    # train G
    fake_batch = [G(z) for z in sample_noise(batch_size)]  # fresh fakes
    update_G(fake_batch)
```

给 G sử dụng giả mạo mới, nếu không thì gradient 会过期。

### 步骤 3: 观察 mode sụp đổ

```python
if step % 200 == 0:
    samples = [G(z) for z in sample_noise(500)]
    mode_a = sum(1 for s in samples if s < 0)
    mode_b = 500 - mode_a
    if min(mode_a, mode_b) < 50:
        print("  [!] mode collapse: one mode is starved")
```

经典症状: Trong hai chế độ thực sự, một trong hai chế độ dừng được tạo ra.

## 陷

- **Discriminator 太强。**Để giảm tốc độ học tập của D 2-5x, hoặc thêm tiếng ồn trường hợp/phần. Nếu D đạt được độ chính xác > 95%, G sẽ chết.
- **Generator 记住了一个 mode。**给 D inputs加噪音, sử dụng lớp phân biệt bộ phận minibatch, hoặc chuyển đổi sang WGAN-GP。
- **Batch norm 泄漏 statistics。**Lớp thực + lô giả 流经同一个BN layer 会混合它们的统计――改用实例规范或光谱规范――
- **Inception-score gaming。**FID 和 IS trong số lượng mẫu thấp 下噪音很大──eval 时使用 ≥10k mẫu──
- **对于 conditional tasks，one-shot sampling 是谎言。**Bạn vẫn cần cân CFG, thủ thuật cắt trục và lấy lại mẫu để có được kết quả có thể sử dụng.

## Sử dụng nó

GAN hàng năm 2026:

| Situation | Pick |
|-----------|------|
| Photoreal human faces, fixed pose | StyleGAN3（最锐利、最小） |
| Anime / stylized faces | StyleGAN-XL 或 Stable Diffusion LoRA |
| Image-to-image translation | Pix2Pix / CycleGAN（Phase 8 · 04）或 ControlNet（Phase 8 · 08） |
| Fast 1-step text-to-image | diffusion 的 adversarial distillation（SDXL-Turbo, SD3-Turbo） |
| Perceptual loss inside a diffusion trainer | image crops 上的小型 GAN discriminator |
| Anything multi-modal, open-ended | 不要用 —— 使用 diffusion 或 flow matching |

GANs 利但狭窄──一旦你的域名 打开,例如照片、任意文字提示、视频,就切换到传播──反逆的技巧──作为组件继续存在(perceptual losses、distillation),而不是独立发电──

## 交付 nó

保存 `outputs/skill-gan-debugger.md` Khả năng nhận một lần GAN chạy thất bại (trong thời gian), và xuất ra theo thứ tự của nguyên nhân, sửa chữa và giao thức lặp lại.

## 练习

1. **Easy。**使用默认设置运行 `code/main.py` rồi đặt `D_LR = 5 * G_LR`Và tái hoạt động. G mất nhiều nhanh chóng sụp đổ đến số bình thường?
2. **Medium。**用 WGAN mất  thay thế Goodfellow BCE mất:`loss_D = E[D(fake)] - E[D(real)]`- Tôi không biết.`loss_G = -E[D(fake)]`, sẽ clip trọng lượng của D đến `[-0.01, 0.01]`❖ Trình luyện có ổn định hơn không?
3. **Hard。**Để mở rộng các mô hình 1-D sang dữ liệu 2-D(8 √ Gaussyan hỗn hợp trên vòng)  Tracking generator trong các bước 1k、5k、10k  nắm bắt 8 chế độ trong số đó có bao nhiêu  thực hiện phân biệt đối xử mini batch 并 tái đo¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Generator | "G" | noise-to-sample network，`G: z → x̂`。 |
| Discriminator | "D" | Classifier `D: x → [0, 1]`，real vs fake。 |
| Minimax | "The game" | joint objective 的 `min_G max_D`。 |
| Non-saturating loss | "The fix" | 对 G 使用 `-log D(G(z))`，而不是 `log(1 - D(G(z)))`。 |
| Mode collapse | "G memorized one thing" | 尽管 data 多样，Generator 只产生少量不同 outputs。 |
| WGAN | "Wasserstein" | 用 Earth-Mover distance + gradient penalty 替换 BCE；gradient 更平滑。 |
| Spectral norm | "Lipschitz trick" | 约束 D 的 weight norms 来 bound 它的 slope；稳定 training。 |
| StyleGAN | "The one that works" | Mapping network + AdaIN；faces 领域 best-in-class，2026 年仍然如此。 |

## Lưu ý sản xuất: kết luận một cú là lợi thế lâu dài của GAN

GAN trong chất lượng mẫu của thế hệ miền mở 上不再获胜, nhưng chúng vẫn trong chi phí suy luận 上获胜. Trong văn bản 文献词汇中, một GAN 具有:

- **没有 prefill，没有 decode stages。**Một lần `G(z)`chuyển tiếp tiếp──TTFT ≈ thời gian trễ tổng cộng──
- **没有 KV-cache pressure。**唯一状态是重量──批量大小 受激活内存 限制,而不是缓存──
- **Trivial continuous batching。**Vì mỗi yêu cầu đều tiêu thụ các FLOP cố định tương tự, máy chủ  mục tiêu chiếm đóng tỷ lệ thường là tốt nhất. Không cần lập trình viên trong chuyến bay.

Đó là lý do tại sao GAN chưng cất (SDXL-Turbo, SD3-Turbo, ADD, LCM) là 2026 năm nhanh văn bản-để hình ảnh 的主导技术: nó sẽ đưa đường ống dẫn phân phối 20-50 bước 压缩 thành 1-4 lần GAN kiểu đi trước, đồng thời giữ phân phối cơ sở phân phối──trong lỗ 作为训练时间扣存活下来,用来把慢发电器 转变为快发电器──

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) GAN giấy nguyên thủy
- [Radford et al. (2015). Unsupervised Representation Learning with DCGAN](https://arxiv.org/abs/1511.06434) 第一个稳定建筑──
- [Arjovsky, Chintala, Bottou (2017). Wasserstein GAN](https://arxiv.org/abs/1701.07875) WGAN。
- [Miyato et al. (2018). Spectral Normalization for GANs](https://arxiv.org/abs/1802.05957) SN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2。
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3。
- [Sauer et al. (2023). Adversarial Diffusion Distillation](https://arxiv.org/abs/2311.17042) SDXL-Turbo。
