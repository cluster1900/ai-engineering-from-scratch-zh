# Tối chảy phù hợp với dòng chảy được sửa chữa

> Các mô hình phân phối 需要 20-50 个采样步骤,因为它们会沿沿从噪音到数据的曲路径走走走.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 06 (DDPM), Phase 1 · Calculus
**Time:** ~45 minutes

## 问题

DDPM của phản向 quá trình là một trong những`N(0, I)`Trở lại 1000 bước của phân phối dữ liệu theo thời gian. DIM sẽ thu nhỏ nó thành 20-50 bước xác định. Bạn muốn ít hơn các bước, lý tưởng là chỉ cần một bước.

Nếu bạn có thể đào tạo mô hình, làm cho đường từ tiếng ồn đến dữ liệu là một đường thẳng, thì từ `t=1`Đến`t=0`của đơn vị bước Euler 就能工作──Tình lình kết hợp dòng chảy 直接构建这一点:定义从 `x_1 ∼ N(0, I)`Đến`x_0 ∼ data`                                                                                                                                                                                                                                                              `v_θ(x, t)`Để phù hợp với số thời gian của nó, và suy luận 时积分.

Phong trào sửa đổi (Liu 2022): sử dụng quy trình tái lưu 代地拉直路径, tạo ra một ODE dần dần gần hơn với đường dây.

## 核心概念

![Flow matching: straight-line interpolation between noise and data](../assets/flow-matching.svg)

### dòng chảy trực tuyến

定义:

```
x_t = t · x_1 + (1 - t) · x_0,   t ∈ [0, 1]
```

Trong số đó `x_0 ~ data`- Tôi không biết.`x_1 ~ N(0, I)`                                                                                                                                                                                                                                                              

```
dx_t / dt = x_1 - x_0
```

定义一个神经向量领域 `v_θ(x_t, t)`,并训练 nó phù hợp với số này:

```
L = E_{x_0, x_1, t} || v_θ(x_t, t) - (x_1 - x_0) ||²
```

Đó là...**conditional flow matching**Loss(Lipman 2023)。 Training không cần mô phỏng:`(x_0, x_1, t)`Không làm sự lùi lại.

### 采样

Trong suy luận, dọc theo thời gian* ngược向*积分学到的矢量场:

```
x_{t-Δt} = x_t - Δt · v_θ(x_t, t)
```

Từ `x_1 ~ N(0, I)` bắt đầu, dùng bước của Euler                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `t=0`

### Phong trào được sửa đổi (Liu 2022)

dòng trực tuyến có thể làm việc, nhưng cách học tập thực sự không trực tiếp, vì rất nhiều`x_0`Có thể chiếu đến cùng một `x_1`❖ Bước tái lưu của dòng chảy được sửa chữa:

1. 用随机配对训练流模型 v_1──
2. 通过将 v_1 từ `x_1`积分到其落点 `x_0`, mẫu N đối với`(x_1, x_0)`
3. Trong các mô hình đối tác này tập luyện v_2── vì các đối tác này hiện đang là ODE-tích hợp, đường thẳng giữa chúng thực sự bằng hơn──
4. Đổi lại

Trong thực tế, 2 lần reflow 代就能接近线性,从而实现 2-4 bước suy luận.

### Tại sao nó đã giành chiến thắng trong lĩnh vực hình ảnh vào năm 2024

Ba lý do:

1. **Simulation-free training**: training period no need ODE 展开,实现极其简单──
2. **更好的 Loss geometry**Đường đường thẳng có một kết hợp tín hiệu-đối với tiếng ồn, trong khi DDPM ε-lỡ trong lịch trình 边缘 SNR  rất khác biệt.
3. **更快的 inference**: trong SDXL-Turbo 质量下需要4-8步;配合一致蒸蒸蒸可达到1步──

## Tích hợp dòng chảy vs DDPM:精确联系

带 Gaussian-conditional path ơm dòng chảy phù hợp chính là sử dụng* cụ thể tiếng ồn lịch trình* của Diffusion。选择 `x_t = α(t) x_0 + σ(t) x_1`Lịch trình, dòng chảy phù hợp để phục hồi sự phân tán được cải cách bởi Stratonovich, trong đó có`v = α'·x_0 - σ'·x_1`Đối với các con đường Gaussian, hai trong số đó trên giá bằng.

Sự phù hợp dòng chảy  tăng là: mục tiêu của* độ rõ ràng性*(tốc độ bình thường)、更干净的 Loss,以及尝试非高斯的插件的自由度──


```figure
normalizing-flow
```

##  xây dựng nó

`code/main.py`Trong hai đỉnh hỗn hợp Gaussian 上 đạt được sự phù hợp dòng chảy 1-D── Vênctor field `v_θ(x, t)`là một MLP nhỏ, sử dụng đào tạo mục tiêu trực tuyến. Trong suy luận, phân biệt với 1、2、4 和 20 bước của Euler.

### 步骤 1: mất tập luyện

```python
def train_step(x0, net, rng, lr):
    x1 = rng.gauss(0, 1)
    t = rng.random()
    x_t = t * x1 + (1 - t) * x0
    target = x1 - x0
    pred = net_forward(x_t, t)
    loss = (pred - target) ** 2
    # backprop + update
```

### 步骤 2: kết luận nhiều bước

```python
def sample(net, num_steps):
    x = rng.gauss(0, 1)
    for i in range(num_steps):
        t = 1.0 - i / num_steps
        dt = 1.0 / num_steps
        x -= dt * net_forward(x, t)
    return x
```

### 步骤 3: So sánh số bước

预期 4 bước mẫu 已能匹配 20 bước chất lượng, điều này đối với độ trễ đến có ý nghĩa lớn.

##  dễ dàng đi trên crater

- **Time parameterization。**Tương thích dòng chảy 使用 `t ∈ [0, 1]`, trong số đó `t=0`là dữ liệu,`t=1`                                                                                                                                                                                                                                                              `t ∈ [0, T]`, trong số đó `t=0`là dữ liệu,`t=T`                                                                                                                                                                                                                                                              
- **Schedule choice。**Đường thẳng của dòng chảy được sửa là lịch trình phù hợp dòng chảy, nhưng bạn cũng có thể sử dụng cosine hoặc logic-normal t-sampling (SD3) để có được một quy mô tốt hơn.
- **Reflow cost。**Để tái lưu lượng tạo bộ dữ liệu tương đương với mỗi mẫu chạy một lần suy luận hoàn chỉnh. Chỉ khi bạn thực sự cần suy luận 1-2 bước thì bạn mới thực hiện tái lưu lượng.
- **Classifier-free guidance 仍然适用。**Chỉ cần trong bộ phận trực tuyến để chuyển ε thành v:`v_cfg = (1+w) v_cond - w v_uncond`

## Sử dụng nó

| Use case | 2026 stack |
|----------|-----------|
| Text-to-image，最佳质量 | Flow matching：SD3、Flux.1-dev |
| Text-to-image，1-4 步 | Distilled flow matching：Flux.1-schnell、SD3-Turbo、SDXL-Turbo |
| 实时 inference | 来自 flow-matched base 的 consistency distillation（LCM、PCM） |
| Audio generation | Flow matching：Stable Audio 2.5、AudioCraft 2 |
| Video generation | Flow matching 与 Diffusion 混合（Sora、Veo、Stable Video） |
| Science / physics（particle trajectories、molecules） | Flow matching + equivariant Vector field |

Chỉ cần một bài viết của năm 2025-2026 nói quá hơn sự pha trộn, nó gần như luôn là phù hợp dòng chảy + chưng cất

## 交付 nó

保存 `outputs/skill-fm-tuner.md`  接收一个 Diffusion-style model spec,并将其转换为流量匹配训练配置:chọn lựa lịch trình  phân phối mẫu thời gian  đồng nhất / logic-normal)  Optimizer、reflow plan、target step count、eval protocol。

## 练习

1. **Easy。**运行 `code/main.py`, so sánh 1 bước với 20 bước MSE 相对真实数据分布的表现──
2. **Medium。**Từ đồng phục`t`lấy mẫu 切换到logit-normal (từ chuẩn) 将采样集中在 t) ⋅ mô hình 质量是否提升?
3. **Hard。**实现一次反流 代:通过积分第一个模型 生成对 (x_0, x_1), 在这些对上训练第二个模型,并比较1步样品质量──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Flow matching | “Straight-line diffusion” | 训练 `v_θ(x, t)`，使其沿 interpolant 匹配 `x_1 - x_0`。 |
| Rectified flow | “Reflow” | 拉直已学习 flows 的迭代过程。 |
| Velocity field | “v_θ” | model 的输出，即移动 `x_t` 的方向。 |
| Straight-line interpolant | “The path” | `x_t = (1-t)·x_0 + t·x_1`；目标导数很简单。 |
| Euler sampler | “1st order ODE solver” | 最简单的 integrator；当路径较直时效果很好。 |
| Logit-normal t | “SD3 sampling” | 将 `t` sampling 集中到 gradients 最强的中间值附近。 |
| Consistency distillation | “1-step sampler” | 训练 student 将任意 `x_t` 直接映射到 `x_0`。 |
| CFG with velocity | “v-CFG” | `v_cfg = (1+w) v_cond - w v_uncond`；同样技巧，新的变量。 |

## Lưu ý sản xuất:Flux.1-schnell là phù hợp nhất hình thức của dòng chảy

Chuyển đổi dòng chảy 胜利案例是Flux.1-schnell: một dòng chảy phù hợp DiT, được蒸到 1-4 个推断步骤,同时保持Flux-dev 级别质量。Niels của Run Flowx trên một máy tính notebook 8GB 是参考部署方案:T5 + CLIP mã hóa, định lượng MMDiT chỉ định(schnell dùng 4 步,而 dev dùng 50 步),VAE decode──核算如下:

| Variant | Steps | Latency at 1024² on L4 | Total FLOPs (relative) |
|---------|-------|------------------------|------------------------|
| Flux.1-dev (raw) | 50 | ~15 s | 1.0× |
| Flux.1-schnell | 4 | ~1.2 s | 0.08× (12× faster) |
| SDXL-base | 30 | ~4 s | 0.25× |
| SDXL-Lightning 2-step | 2 | ~0.3 s | 0.03× |

Quy tắc sản xuất:**flow-matched base + distillation = 2026 年快速 text-to-image 的默认方案。**Mỗi nhà sản xuất chính đều đang phát hành bộ phận này:SD3-Turbo(SD3 + dòng chảy + chưng cất) ✓Flux-schnell(Flux-dev + đường thẳng dòng chảy sửa chữa) ✓CogView-4-Flash── Pure Diffusion base chỉ tồn tại ở các điểm kiểm soát cũ ở Trung ✓

## 延伸阅读
- [Liu, Gong, Liu (2022). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003) dòng chảy được sửa chữa
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) dòng chảy phù hợp.
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, dòng chảy sửa chữa quy mô lớn
- [Albergo, Vanden-Eijnden (2023). Stochastic Interpolants](https://arxiv.org/abs/2303.08797) 覆盖 FM + Diffusion 的通用框架──
- [Song et al. (2023). Consistency Models](https://arxiv.org/abs/2303.01469) Phân phối / lưu lượng của 1 bước chưng cất.
- [Sauer et al. (2023). Adversarial Diffusion Distillation (SDXL-Turbo)](https://arxiv.org/abs/2311.17042) biến thể turbo。
- [Black Forest Labs (2024). Flux.1 models](https://blackforestlabs.ai/announcing-black-forest-labs/) sản xuất trung bình dòng chảy phù hợp
