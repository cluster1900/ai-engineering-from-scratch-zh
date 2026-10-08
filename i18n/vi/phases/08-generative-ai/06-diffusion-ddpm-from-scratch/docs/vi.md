# Các mô hình phân tán  DDPM từ đầu

> Ho、Jain、Abbeel(2020) đã cung cấp cho lĩnh vực này một phương pháp không thể bỏ qua. Sử dụng tiếng ồn  thông qua một ngàn bước nhỏ để phá hủy dữ liệu.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 8 · 02 (VAE)
**Time:** ~75 分钟

## Vấn đề

Anh muốn một cái để sử dụng.`p_data(x)`Các mẫu gàn sẽ chơi một trò chơi tối thiểu thường xuyên phát tán. Các VAE sẽ được phát hiện từ máy giải mã Gaussian.`log p(x)`Các mô hình có khả năng tương thích của SOTA.

Sohl-Dickstein et al. (pp. 2015) đã đưa ra câu trả lời lý thuyết: định nghĩa một chuỗi Markov dần dần gia nhập tiếng ồn Gaussian `q(x_t | x_{t-1})`,并训练 một chuỗi ngược `p_θ(x_{t-1} | x_t)`Để chỉ trích: Ho, Jain, Abel, 2020) đã chứng minh Loss có thể đơn giản hóa thành một dòng   dự đoán tiếng   并 sắp xếp toán học. Năm 2020 nó vẫn là một sự tò mò. Năm 2021 nó đã tạo ra các mẫu hiện đại. Năm 2022 nó đã trở thành Stable Diffusion. Năm 2026 nó là chất lượng cơ bản.

## Khái niệm

![DDPM: forward noise, reverse denoise](../assets/ddpm.svg)

**Forward process `q`.**Trong `T`个小步骤中加入 Gaussian noise──Tập form  数学可处理的原因  是累积步骤 仍然是Gaussian:

```
q(x_t | x_0) = N( sqrt(α̅_t) · x_0,  (1 - α̅_t) · I )
```

Trong số đó `α̅_t = ∏_{s=1..t} (1 - β_s)`, đối phó với một `β_t`Thời gian:`β_t`Trong T=1000 bước trong từ 1e-4 đến 0.02 线性变化,`x_T`会近似为`N(0, I)`

**Reverse process `p_θ`.**Học một mạng lưới thần kinh `ε_θ(x_t, t)`,预测被加入的噪音──给定 `x_t`,按下式 biểu thị:

```
x_{t-1} = (1 / sqrt(α_t)) · ( x_t - (β_t / sqrt(1 - α̅_t)) · ε_θ(x_t, t) )  +  σ_t · z
```

Trong số đó `σ_t`Đúng vậy.`sqrt(β_t)`, hoặc là sự khác biệt học... biểu hiện này rất xấu, nhưng nó chỉ là một số  trong một số lại`q(x_{t-1} | x_t, x_0)`Trong trường hợp tìm giải pháp`x_{t-1}`,并 sử dụng ước tính dự đoán tiếng 替换 `x_0`

**Training loss.**

```
L_simple = E_{x_0, t, ε} [ || ε - ε_θ( sqrt(α̅_t) · x_0 + sqrt(1 - α̅_t) · ε,  t ) ||² ]
```

Từ dữ liệu trong mẫu`x_0`, chọn một `t`, mẫu `ε ~ N(0, I)`, qua hình thức đóng một lần tính toán `x_t`,并对噪音做回归──一个 Loss,没有 minimax,没有 KL,没有重设技巧──

**Sampling.**Từ `x_T ~ N(0, I)`开始──从 `t = T`Đến`1`代 bước ngược.

## Tại sao nó hoạt động

3 trực giác:

1. **Denoising is easy; generating is hard.**Trong `t=T`, dữ liệu là tiếng ồn  mạng phải giải quyết là một vấn đề tầm thường.`t=0`,net chỉ cần xóa vài pixel trong giữa.`t`, vấn đề rất khó khăn, nhưng từ mỗi mức tiếng ồn sẽ có được nhiều gradient trong cùng một nhóm trọng lượng.

2. **Score matching in disguise.**Vincent(2011) chứng minh, dự đoán tiếng ồn等价格估计 `∇_x log q(x_t | x_0)`,也就是 *score*──逆 SDE Sử dụng điểm này 沿着密度梯度 上行  一次被引导的随机走,走向高概率地区──

3. **The ELBO reduces to simple MSE.**完整变化下界在每步都有一个 KL thuật ngữ──使用 DDPM的参数化,这些 KL thuật ngữ sẽ được đơn giản hóa为带特定系数的噪音预测 MSE;Ho bỏ qua các系数(称其为 简单损失),质量反而 *提高* 了──


```figure
diffusion-denoise
```

## Hãy xây dựng nó

`code/main.py`实现 một DDPM 1-D──Data là hỗn hợp hai chế độ──net là một MLP kiểu nhỏ,接收`(x_t, t)`并输出 dự đoán tiếng ồn.                                                                                                                                                                                                                                                           

### Bước 1: lịch trình tiến hành (mẫu đóng)

```python
betas = [1e-4 + (0.02 - 1e-4) * t / (T - 1) for t in range(T)]
alphas = [1 - b for b in betas]
alpha_bars = []
cum = 1.0
for a in alphas:
    cum *= a
    alpha_bars.append(cum)
```

### Bước 2: mẫu`x_t`trong một cú bắn

```python
def forward_sample(x0, t, alpha_bars, rng):
    a_bar = alpha_bars[t]
    eps = rng.gauss(0, 1)
    x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps
    return x_t, eps
```

### Bước 3: một bước đào tạo

```python
def train_step(x0, model, alpha_bars, rng):
    t = rng.randrange(T)
    x_t, eps = forward_sample(x0, t, alpha_bars, rng)
    eps_hat = model_forward(model, x_t, t)
    loss = (eps - eps_hat) ** 2
    return loss, gradient_step(model, ...)
```

### Bước 4: lấy mẫu ngược

```python
def sample(model, alpha_bars, T, rng):
    x = rng.gauss(0, 1)
    for t in range(T - 1, -1, -1):
        eps_hat = model_forward(model, x, t)
        beta_t = 1 - alphas[t]
        x = (x - beta_t / math.sqrt(1 - alpha_bars[t]) * eps_hat) / math.sqrt(alphas[t])
        if t > 0:
            x += math.sqrt(beta_t) * rng.gauss(0, 1)
    return x
```

Đối với một vấn đề 1-D của 40 bước thời gian và 24 đơn vị MLP, nó khoảng 200 thời gian về việc có thể học được hỗn hợp hai chế độ.

## Điều kiện thời gian

net 需要知道它 đang chỉ định 哪个时间步骤──两个标准选项:

- **Sinusoidal embedding.**类似 Transformer định vị mã hóa。`embed(t) = [sin(t/ω_0), cos(t/ω_0), sin(t/ω_1), ...]`❖ Chuyển vào MLP, phát sóng lên mạng
- **Film / group-norm conditioning.**Trong mỗi khối Trung把 Embedding dự án 为 mỗi kênh quy mô/bias ((FiLM) ⋅

Chúng tôi có mã đồ chơi sử dụng hình âm → conat.

## Những bẫy

- **Schedule matters a lot.**Đường thẳng`β`Đó là mặc định của DDPM, nhưng lịch trình cosine ((Nichol & Dhariwal, 2021) trong cùng một tính toán 下给出更好的FID── nếu chất lượng cao,就切换时间表──
- **Timestep embedding is fragile.**Đặt ra nguyên chất`t`作为浮游 传入对玩具 1-D 可行,但对图像会失败;始终使用适当嵌入──
- **V-prediction vs ε-prediction.**đối với chế độ rất nhỏ hoặc rất lớn),`ε`很差──V- dự đoán`v = α·ε - σ·x`) ổn định hơn;SDXL、SD3 和 Flux đều sử dụng nó.
- **Classifier-free guidance.**Inference 时, đồng thời tính điều kiện 和 vô điều kiện `ε`, rồi rồi`ε_cfg = (1 + w) · ε_cond - w · ε_uncond`, trong số đó `w ≈ 3-7`Bài học 08 会覆盖。
- **1000 steps is a lot.**Sản xuất sử dụng DDIM ((20-50 bước)、DPM-Solver ((10-20 bước) hoặc chưng cất ((1-4 bước)。见课12。

## Sử dụng nó

| Role | Typical stack in 2026 |
|------|-----------------------|
| Image pixel-space diffusion (small, toy) | DDPM + U-Net |
| Image latent diffusion | VAE encoder + U-Net or DiT (Lesson 07) |
| Video latent diffusion | Spatiotemporal DiT (Sora, Veo, WAN) |
| Audio latent diffusion | Encodec + diffusion transformer |
| Science (molecules, proteins, physics) | Equivariant diffusion (EDM, RFdiffusion, AlphaFold3) |

Sự phân tán là xương sống tạo ra phổ biến. Sự phù hợp dòng chảy (Lớp 13) là đối thủ cạnh tranh trong năm 2024-2026, trong chất lượng tương tự.

## Chuyển nó

保存 `outputs/skill-diffusion-trainer.md`Khả năng nhận dữ liệu + ngân sách tính toán,并输出:chương trình (xơ)  tuyến tính/cosine/sigmoid)  mục tiêu dự đoán (ε/v/x)  số bước  quy mô hướng dẫn  gia đình mẫu và giao thức đánh giá

## Các bài tập

1. **Easy.**Trong `code/main.py`Trung把 T từ 40 改 thành 10 ⋅ chất lượng mẫu (visual histogram của các sản phẩm) làm thế nào để giảm?
2. **Medium.**Từ ε- dự đoán 切换到 v- dự đoán  tái推导 bước ngược  Compare cuối cùng chất lượng mẫu 
3. **Hard.**添加 hướng dẫn không có phân loại.`c ∈ {0, 1}`Để điều kiện, trong thời gian đào tạo 10% thời gian giảm nó, và sử dụng trong việc lấy mẫu.`ε = (1+w)·ε_cond - w·ε_uncond`   `w = 0, 1, 3, 7`时的条件模式打击率──

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Forward process | “Adding noise” | 固定 Markov chain `q(x_t \| x_{t-1})`，用于摧毁 data。 |
| Reverse process | “Denoising” | Learned chain `p_θ(x_{t-1} \| x_t)`，用于重构 data。 |
| β schedule | “The noise ladder” | Per-step variance；linear、cosine 或 sigmoid。 |
| α̅ | “Alpha bar” | Cumulative product `∏(1 - β)`；给出从 `x_0` 得到 `x_t` 的 closed-form。 |
| Simple loss | “MSE on noise” | `\|\|ε - ε_θ(x_t, t)\|\|²`；所有 variational derivations 都 collapse 到这里。 |
| ε-prediction | “Predict noise” | 输出是被加入的 noise；standard DDPM。 |
| V-prediction | “Predict velocity” | 输出是 `α·ε - σ·x`；在整个 t 上有更好的 conditioning。 |
| DDPM | “The paper” | Ho et al. 2020；linear β、1000 steps、U-Net。 |
| DDIM | “Deterministic sampler” | Non-Markov sampler，20-50 steps，同一个 training objective。 |
| Classifier-free guidance | “CFG” | 混合 conditional 和 unconditional noise predictions 来放大 conditioning。 |

## Lưu ý sản xuất: suy luận phân tán là một vấn đề đếm từng bước

Bảng giấy DDPM 运行 T=1000 bước ngược. Không ai dùng nó để sản xuất.

1. **Faster sampler, same model.**DDIM(20-50 bước)、DPM-Solver++(10-20)、UniPC(8-16)。Phục thế chuốc vòng ngược; đã được đào tạo `ε_θ`trọng lượng 不变──将延迟 降低 20-50×──
2. **Distillation.**训练 sinh viên 以更少步骤 匹配 giáo viên:Tăng tiến Distillation(2 → 1)、Cong hoà mô hình(tự nguyện → 1-4)、LCM、SDXL-Turbo、SD3-Turbo── tiếp tục giảm độ trễ 5-10×, cần đào tạo lại。
3. **Caching and compilation.** `torch.compile(unet, mode="reduce-overhead")`、TensorRT-LLM's diffusion backends、`xformers`/SDPA chú ý, bf16 trọng lượng, sẽ giảm khoảng 2×, có thể với (1) và (2) 叠加.

Đối với máy chủ truyền tải sản xuất, cuộc trò chuyện ngân sách và văn học sản xuất đối với LLM mô tả tương tự:`num_steps × step_cost + VAE_decode`,throughput là `batch_size × (num_steps × step_cost)^-1`TTFT 很小(một bước); TPOT tương đương là thời gian phản ứng hoàn chỉnh, vì từ user's perspective, hình ảnh tạo là all-at-one。

## Đọc thêm

- [Sohl-Dickstein et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics](https://arxiv.org/abs/1503.03585) giấy pha trộn,超前于时代。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM。
- [Song, Meng, Ermon (2021). Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502) DDIM, hơn ít bước.
- [Nichol & Dhariwal (2021). Improved DDPM](https://arxiv.org/abs/2102.09672) lịch trình cosine, sự biến đổi học được.
- [Dhariwal & Nichol (2021). Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233) hướng dẫn phân loại:
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG。
- [Karras et al. (2022). Elucidating the Design Space of Diffusion-Based Generative Models (EDM)](https://arxiv.org/abs/2206.00364) ghi chú thống nhất, công thức rõ ràng nhất.
