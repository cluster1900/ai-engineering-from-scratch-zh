# Tự động mã hóa & Tự động mã hóa biến thể (VAE)

> Nó sẽ ghi nhớ, nó sẽ không tạo ra, nó sẽ không tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ tạo ra, nó sẽ làm ra ra ra, nó sẽ làm ra ra ra ra ra ra ra ra.`z = μ + σ·ε`Do đó, tại sao mỗi mô hình truyền tải tiềm ẩn và tương ứng dòng chảy mà bạn sử dụng vào năm 2026 đều có một VAE ở đầu đầu vào.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 分钟

## Vấn đề

Đặt một con số MNIST 784 pixel đánh nét thành mã 16 chữ số, sau đó xây dựng lại. Một mã tự động thông thường sẽ hoạt động tốt trong việc tái thiết MSE, nhưng không gian mã là một nhóm 凸不平的混乱── bất cứ khi nào trong không gian mã chọn một điểm, giải mã nó, bạn nhận được tiếng ồn── nó không có mẫu.

Bạn thực sự muốn: a) không gian mã là một phân bố sạch, thanh toán, có thể lấy trong mẫu, ví dụ như Gaussian đồng tr tròn`N(0, I)`,((b) giải mã bất kỳ mẫu nào đều có thể tạo ra một con số hợp lý,(c) mã hóa và decoder vẫn có thể được nén tốt.

Kingma của 2013 VAE  thông qua để mã hóa 输出一个 * phân phối * `q(z|x) = N(μ(x), σ(x)²)`Để giải quyết vấn đề này, hãy dùng hình phạt KL để phân phối nó.`N(0, I)`, rồi trong decode trước từ `q(z|x)`mẫu `z` Trong suy luận 时, bỏ đi mã hóa, mẫu `z ~ N(0, I)`, decode.KL hình phạt 正是迫使代码空间 结构化的机制.

Trong năm 2026, VAE 很少单独交付  在原始图像质量上它们已经被扩散 超越  但它们是每个隐藏扩散模型的首选编码器 (SD 1/2/XL/3、Flux、AudioCraft)

## Khái niệm

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** `z = encoder(x)`- `x̂ = decoder(z)`, mất mát = `||x - x̂||²`Không gian mã 无结构。

**VAE encoder.**输出 hai vector:`μ(x)`和 `log σ²(x)` Chúng đã định nghĩa `q(z|x) = N(μ, diag(σ²))`

**Reparameterization trick.**Từ `q(z|x)`mẫu không thể nhỏ hơn.`z = μ + σ·ε`, trong số đó `ε ~ N(0, I)`  `z` `(μ, σ)`+ không tham số tiếng ồn của hàm xác định  gradient có thể chảy qua `μ`和 `σ`

**Loss.**Bằng chứng Bind thấp hơn (ELBO), hai mục:

```
loss = reconstruction + β · KL[q(z|x) || N(0, I)]
     = ||x - x̂||²  + β · Σ_i ( σ_i² + μ_i² - log σ_i² - 1 ) / 2
```

Tái thiết`x̂`推向 `x`✿KL ✿`q(z|x)`推向前──它们相互权衡──小 β (<1) = 更利的样本,代码空间 不那么 Gaussian──大 β (>1) = 更干净的代码空间,更模糊的样本──β-VAE(Higgins 2017) để vòng này nổi tiếng,并开启 giải tỏa nghiên cứu──

**Sampling.**Inference 时:抽取 `z ~ N(0, I)`,trên qua decoder. Một lần đi trước.


```figure
vae-latent-grid
```

## Hãy xây dựng nó

`code/main.py`实现一个不使用 numpy或火的微型VAE──输入是从8D中的2组件高斯混合抽取的8维合成数据──编码和解码都是单层隐藏的MLP──我们实现 tanh激活、前传、损失,以及手写后传──不是生产 是教学──

### Bước 1: mã hóa về phía trước

```python
def encode(x, enc):
    h = tanh(add(matmul(enc["W1"], x), enc["b1"]))
    mu = add(matmul(enc["W_mu"], h), enc["b_mu"])
    log_sigma2 = add(matmul(enc["W_sig"], h), enc["b_sig"])
    return mu, log_sigma2
```

Sử dụng `log σ²`Không phải`σ`, như vậy kết quả mạng không bị ràng buộc (( đối với σ làm mềm cộng là bẫy  trong σ ≈ 0 时 gradients sẽ biến mất) 

### Bước 2: tái định đo và giải mã

```python
def reparameterize(mu, log_sigma2, rng):
    eps = [rng.gauss(0, 1) for _ in mu]
    sigma = [math.exp(0.5 * lv) for lv in log_sigma2]
    return [m + s * e for m, s, e in zip(mu, sigma, eps)]

def decode(z, dec):
    h = tanh(add(matmul(dec["W1"], z), dec["b1"]))
    return add(matmul(dec["W_out"], h), dec["b_out"])
```

### Bước 3: ELBO

```python
def elbo(x, x_hat, mu, log_sigma2, beta=1.0):
    recon = sum((a - b) ** 2 for a, b in zip(x, x_hat))
    kl = 0.5 * sum(math.exp(lv) + m * m - lv - 1 for m, lv in zip(mu, log_sigma2))
    return recon + beta * kl, recon, kl
```

精确的闭式KL,因为两个分布都是高西亚的──不要数值积分──2026年仍有人交付带蒙特卡洛KL估算的代码 无理由地慢3x──

### Bước 4: tạo

```python
def sample(dec, z_dim, rng):
    z = [rng.gauss(0, 1) for _ in range(z_dim)]
    return decode(z, dec)
```

Đó là mô hình tạo ra.

## Những bẫy

- **Posterior collapse.**KL thuật ngữ 过于激进地驱动 `q(z|x) → N(0, I)`, dẫn đến`z`Không mang về `x`Từ β=0  bắt đầu, dần dần tăng lên đến 1) ̳bít tự do, hoặc nhảy lên KL ở các chiều không hoạt động。
- **Blurry samples.**Thiết lập khả năng Gaussian có nghĩa là tái tạo MSE, nó đối với L2 là Bayes-optimal (trên nghĩa)  một nhóm chữ số hợp lý của nghĩa là một số模糊.
- **β too large, too early.**见后台崩──从 β≈0.01 开始并逐步坡──
- **Latent dim too small.**16-D  áp dụng cho MNIST,256-D  áp dụng cho ImageNet 2562,2048-D  áp dụng cho ImageNet 10242。 VAE của Stable Diffusion sẽ 512×512×3  áp suất thành 64×64×4;; diện tích không gian trên 32x downsample factor, kênh trên 32x)。

## Sử dụng nó

2026 VAE:

| Situation | Pick |
|-----------|------|
| Image-latent encoder for diffusion | Stable Diffusion VAE (`sd-vae-ft-ema`) or Flux VAE |
| Audio-latent encoder | Encodec (Meta), SoundStream, or DAC (Descript) |
| Video latents | Sora's spatiotemporal patches, Latte VAE, WAN VAE |
| Disentangled representation learning | β-VAE, FactorVAE, TCVAE |
| Discrete latents (for transformer modelling) | VQ-VAE, RVQ (ResidualVQ) |
| Continuous latents for generation | Plain VAE, then condition a flow/diffusion model in that latent space |

Mô hình phân tán tiềm ẩn là một mô hình phân tán, nằm giữa một mô hình phân tán, nằm giữa một mã hóa và một decoder.

## Chuyển nó

保存 `outputs/skill-vae-trainer.md`

Kỹ năng 接收: hồ sơ bộ dữ liệu + mục tiêu trâm trâm trâm trâm + sử dụng tiếp theo(sự tái thiết, lấy mẫu hoặc đầu vào trâm trâm trâm),并输出: lựa chọn kiến trúc(vô hình/β/VQ/RVQ)`q(z|x)`和 `N(0, I)`间 Fréchet khoảng cách)

## Các bài tập

1. **Easy.**- Đưa đi.`code/main.py`Trung `β`改为 `0.01``0.1``1.0``5.0` ghi lại tái tạo cuối cùng MSE 和 KL── Đối với dữ liệu tổng hợp của bạn, là nào là Pareto tốt nhất?
2. **Medium.**Sử dụng xác suất Bernoulli (cross-entropy loss) thay thế xác suất máy giải mã Gaussian (Gaussian decoder) trong phiên bản nhị phân của cùng một dữ liệu tổng hợp
3. **Hard.**sẽ`code/main.py`扩展成一个 mini VQ-VAE:用 K=32 entry 的代码簿 中的近邻搜索 替换连续 `z`❖ So sánh tái thiết MSE,并 báo cáo có bao nhiêu mục codebook được sử dụng

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Autoencoder | Encode-decode network | `x → z → x̂`，学习 MSE。不是 generative。 |
| VAE | 带 sampler 的 AE | Encoder 输出一个 distribution，KL penalty 塑造 code space。 |
| ELBO | Evidence lower bound | `log p(x) ≥ recon - KL[q(z\|x) \|\| p(z)]`；当 `q = p(z\|x)` 时 tight。 |
| Reparameterization | `z = μ + σ·ε` | 将 stochastic node 重写为 deterministic + pure noise。使 sampling 可参与 backprop。 |
| Prior | `p(z)` | latent 的目标 distribution，通常是 `N(0, I)`。 |
| Posterior collapse | “KL term wins” | Encoder 忽略 `x`，输出 prior；decoder 必须 hallucinate。 |
| β-VAE | 可调 KL weight | `loss = recon + β·KL`。更高 β = 更 disentangled 但更模糊。 |
| VQ-VAE | Discrete latent | 用 nearest codebook vector 替换 continuous `z`；支持 transformer modelling。 |

## 生产提示:VAE là máy chủ phân tán 中热 ترین路径

Trong đường ống dẫn Stable Diffusion / Flux / SD3,VAE Mỗi yêu cầu sẽ được调用 hai lần  Một lần được sử dụng để mã hóa (((Nếu làm img2img / inpainting), một lần được sử dụng để mã hóa;; Trong 10242 时, decoder pass 往往是整条 đường ống dẫn 中单个最大的激活-memory peak,因为它把`128×128×16`latences upsample 回 `1024×1024×3`❖ Hai hậu quả thực tế:

- **对 decode 做 slicing 或 tiling。** `diffusers`暴露 `pipe.vae.enable_slicing()`和 `pipe.vae.enable_tiling()`❖ Tiling 用少量 换取 `O(tile²)`trí nhớ, thay vì `O(H·W)`◊ Đối với GPU tiêu dùng trên 10242+ 至关重要――
- **bf16 decoder，最终 resize 使用 fp32 numerics。**SD 1.x VAE 以 fp32 发布, và trong 10242+ được cast đến fp16 时会 *静默产生NaNs*──SDXL 提供 `madebyollin/sdxl-vae-fp16-fix` 总是优先 sử dụng biến thể cố định fp16, hoặc sử dụng bf16。

## Đọc thêm

- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) VAE giấy
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl) chia tách β-VAE。
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) VQ-VAE。
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898) hình ảnh hiện đại nhất VAE。
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) Sự pha trộn ổn định;VAE như một bộ mã hóa。
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) Encodec, âm thanh VAE tiêu chuẩn
