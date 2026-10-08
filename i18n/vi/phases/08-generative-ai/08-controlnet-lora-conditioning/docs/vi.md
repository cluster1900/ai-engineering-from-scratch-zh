# ControlNet, LoRA & Conditioning

> 仅靠文本是一种拙的控制信号――ControlNet 让你建立一个预训练的扩散模型,并使用深度地图,姿势骨架,脚本或边缘图像来引导它――LoRA 让你通过训练1000万参数来调整一个2B参数模型――二者结合,将稳定扩散从玩具变成2026年各机构都在交付的图像管道――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 10 (LLMs from Scratch — LoRA 基础)
**Time:** ~75 minutes

## 问题

像"một người phụ nữ mặc váy đỏ đi bộ một con chó trên một con đường bận rộn" như vậy, không nói模型狗在*哪里*、女人是什么*姿势*, hoặc đường phố của*透视关系*──文本大约只能固定你指定一张图像所需信息的10%──其余部分是视觉信息,无法用文字高效描述──

Đối với mỗi loại tín hiệu (~pose, depth, canny, segmentation) từ zero training một mô hình điều kiện mới, chi phí quá cao. Bạn muốn giữ cho xương sống SDXL 2.6B-param, tiếp nối một mạng phụ nhỏ của điều kiện đọc, để nó dễ dàng điều chỉnh các đặc điểm trung tâm của xương sống.

Bạn cũng muốn trong trường hợp không tái tập luyện mô hình hoàn chỉnh,教会模型新概念 ((脸你的"", sản phẩm của bạn"",风格 của bạn) ・・・ bạn cần một small 100x delta── đây là LoRA, tức là cài đặt các bộ điều chỉnh hạng thấp của trọng lượng chú ý hiện có──

ControlNet + LoRA + text = Toolbox của người thực hành năm 2026。 Phần lớn các ống dẫn hình ảnh cấp sản xuất 会在SDXL / SD3 / Flux base 之上叠加 2-5 个 LoRA、1-3 个 ControlNet,以及一个 IP-Adapter。

## 概念

![ControlNet clones the encoder; LoRA adds low-rank deltas](../assets/controlnet-lora.svg)

### ControlNet (Zhang et al., 2023)

取一个预训 SD──*克隆* U-Net's encoder 半边──结原始模型──训练这个克隆版本,让它接受额外的条件输入(边缘,深度,pose)──使用 *零转折* skip connections(初始化为零的1×1 convs,一开始是无运,随后学习 delta) 把克隆版本连接回原始模型的解码器 半边──

```
SD U-Net decoder:   ... ← orig_enc_features + zero_conv(controlnet_enc(condition))
```

Zero-conv khởi nghiệp nghĩa là ControlNet bắt đầu giống như bản sắc, ngay cả khi đào tạo trước cũng sẽ không gây thiệt hại.

Mỗi loại hình của ControlNet sẽ được phát hành như một mô hình phụ nhỏ 发布:

```
features += weight_a * control_a(depth) + weight_b * control_b(pose)
```

### LoRA (Hu et al., 2021)

Đối với mô hình trong bất kỳ lớp tuyến tính `W ∈ R^{d×d}`,结 `W`Không thêm một delta hạng thấp:

```
W' = W + ΔW,  ΔW = B @ A,  A ∈ R^{r×d},  B ∈ R^{d×r}
```

Trong số đó `r << d` đối với sự chú ý, nói rằng, xếp hạng 4-16 là quy định tiêu chuẩn; đối với trọng lượng tinh chỉnh, nói rằng, xếp hạng 64-128 là thường xuyên hơn.`2 · d · r`, thay vì `d²` `d=640`Sự chú ý của SDXL,`r=16`Khi mỗi bộ điều chỉnh chỉ có 20k 参数, thay vì 410k, giảm 20x── để trên toàn bộ mô hình, một LoRA thường là 20-200MB, và cơ sở là 5GB──

Trong suy luận, bạn có thể rút ngắn LORA:`W' = W + α · B @ A``α = 0.5-1.5`很常见──多个LoRA会以加法方式叠加 (thường cần lưu ý rằng chúng sẽ ảnh hưởng lẫn nhau theo cách không liên lạc)──

### Đáp ứng IP (Ye et al., 2023)

Một bộ điều chỉnh rất nhỏ, chấp nhận một张*图像* như là điều kiện(vec文本一起) ⋅ nó sử dụng mã hóa hình ảnh CLIP để tạo ra các mã thông báo hình ảnh,并将它们与文字代币一起注入交叉注意── mỗi mô hình cơ sở 约 ~20MB── nó cho phép bạn không cần LoRA, cũng có thể thực hiện生成一张具有这张参考图风格的图像──

## 可组合性Matrix

| Tool | 它控制什么 | Size | 何时使用 |
|------|------------|------|----------|
| ControlNet | 空间结构（pose、depth、edges） | 70-360MB | 精确 layout、composition |
| LoRA | 风格、主体、概念 | 20-200MB | 个性化、风格 |
| IP-Adapter | 来自 reference image 的风格或主体 | 20MB | 文本无法描述外观 |
| Textual Inversion | 将单个概念作为新 token | 10KB | 旧方案，大多已被 LoRA 替代 |
| DreamBooth | 对主体做 full fine-tune | 2-5GB | 强身份一致性、高计算成本 |
| T2I-Adapter | 更轻量的 ControlNet 替代方案 | 70MB | Edge devices、inference budget |

ControlNet ≈ 空间──LoRA ≈ 语义──两者一起使用──


```figure
v4-controlnet-zero
```

##  xây dựng nó

`code/main.py`Trong 1D trên mô phỏng hai cơ chế:

1. **LoRA。**Một lớp tuyến tính được huấn luyện trước.`W`结它──训练一个低级`B @ A`,使 `W + BA`匹配目标 đường thẳng lớp.`r = 1`足以完美学习一个级-1 sửa chữa.

2. **ControlNet-lite。**Một  đóng băng cơ sở tiên đoán, cũng như một 读取额外信号的 side network──side network 的输出由一个初始化为零的可学习标量门控制 (我们的零-conv 版本) ──训练并观察门 逐步升高──

### 步骤 1: LoRA toán học

```python
def lora(W, A, B, x, alpha=1.0):
    # W is frozen; A, B are the trainable low-rank factors.
    return [W[i][j] * x[j] for i, j in ...] + alpha * (B @ (A @ x))
```

### 步骤 2: mạng bên không-init

```python
side_out = control_net(x, condition)
gated = gate * side_out  # gate initialized to 0
h = base(x) + gated
```

Trong bước 0, đầu ra và cơ sở hoàn toàn giống nhau.`gate`, sẽ không xảy ra thảm họa.

## 常见坑

- **LoRA 过度缩放。** `α = 2`Hoặc`α = 3`Đó là một cách thông thường để làm cho nó mạnh hơn, nhưng sẽ tạo ra quá kiểu hóa hoặc bị hỏng xuất.`α ≤ 1.5`
- **ControlNet weight 冲突。**Đồng thời sử dụng trọng lượng 1.0 của Pose ControlNet và trọng lượng 1.0 của Depth ControlNet thường sẽ được chuyển hướng.
- **LoRA 用在错误的 base 上。**SDXL LoRA trong SD 1.5 上会静默无操作, vì kích thước chú ý không phù hợp.
- **Textual Inversion 漂移。**Trong một điểm kiểm tra, các mã thông báo được tập luyện, chuyển sang điểm kiểm tra khác sẽ di chuyển nghiêm trọng.
- **LoRA weight-merging 和存储。**Bạn có thể đặt LoRA lên trọng lượng mô hình cơ bản, để có được kết luận nhanh hơn (không có thời gian chạy thêm), nhưng sẽ mất trong thời gian chạy  giảm `α`                                                                                                                                                                                                                                                              

## Sử dụng nó

| Goal | 2026 pipeline |
|------|---------------|
| 复现某个品牌的艺术风格 | 在约 ~30 张精选图像上训练的 rank 32 LoRA |
| 把我的脸放进生成图像 | DreamBooth 或 LoRA + IP-Adapter-FaceID |
| 指定 pose + prompt | ControlNet-Openpose + SDXL + text |
| Depth-aware composition | ControlNet-Depth + SD3 |
| Reference + prompt | IP-Adapter + text |
| 精确 layout | ControlNet-Scribble 或 ControlNet-Canny |
| 替换背景 | ControlNet-Seg + Inpainting（Lesson 09） |
| 快速 1-step 风格 | SDXL-Turbo 上的 LCM-LoRA |

## 交付 nó

保存 `outputs/skill-sd-toolkit-composer.md`△该技能 接收一个任务(Input assets:prompt、可选参考图像、可选姿势、可选深度、可选拼写),并输出工具堆、重量 和可复现的种子协议──

## 练习

1. **Easy。**Trong `code/main.py`Trung, sẽ xếp hạng LoRA `r`Từ 1 thay đổi đến 4... LoRA ở cấp độ nào?
2. **Medium。**Trong hai biến đổi mục tiêu trên đào tạo hai LoRA độc lập. Đưa chúng cùng nhau, và hiển thị sự tăng cường của chúng.
3. **Hard。**使用 diffusers 叠加:SDXL-base + Canny-ControlNet( trọng lượng 0,8) + 一个风格 LoRA(α 0,8) + IP-Adapter( trọng lượng 0,6)。随着堆积重量 变化,测量 FID-vs-prompt-adhesion trade-off。

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| ControlNet | "Spatial control" | 克隆 encoder + zero-conv skips；读取一张 conditioning image。 |
| Zero convolution | "Starts as identity" | 初始化为零的 1×1 conv；ControlNet 一开始是 no-op。 |
| LoRA | "Low-rank adapter" | `W + B @ A`，`r << d`；比 full fine-tune 少 100x 参数。 |
| rank r | "The knob" | LoRA 压缩；典型值为 4-16，重度个性化使用 64+。 |
| α | "LoRA strength" | LoRA delta 的 runtime scaling。 |
| IP-Adapter | "Reference image" | 通过 CLIP-image tokens 实现的小型 image-conditioning adapter。 |
| DreamBooth | "Full subject fine-tune" | 在约 ~30 张主体图像上训练完整模型。 |
| Textual Inversion | "New token" | 只学习一个新的 word embedding；旧方案，大多已被替代。 |

## 生产说明:LoRA swaps,ControlNet lanes, nhiều người thuê

Một văn bản thực tế-được hình ảnh SaaS 会在同一基点上服务数百 LoRA 和十几个 ControlNet──服务 问题很像 LLM đa thuê

- **Hot-swap LoRAs，不要 merge。**sẽ`W' = W + α·B·A`Thỏa thuận kết hợp vào cơ sở, có thể để mỗi bước suy luận 快约 ~ 3-5%, nhưng kết luận `α`Và cơ sở: đưa LoRA như các vùng r nóng tải trong VRAM; các chất pha trộn  lộ `pipe.load_lora_weights()`+ `pipe.set_adapters([...], adapter_weights=[...])`, có thể sử dụng theo yêu cầu kích hoạt.`2 · d · r · num_layers`trọng lượng, tức MB 级、亚秒级。
- **ControlNet 作为第二条 attention lane。**克隆的编码器与基并行运行──两个重量都为 1.0 的ControlNet = 每步两次额外前进通过,而不是一次合并通过──批量头室 会第二次下降──为每一个活跃的ControlNet 预算约 ~1.5×阶段成本──
- **Quantized LoRAs 也适用。**Nếu bạn đã định lượng cơ sở ((xem Bài học 07,Flux trên 8GB), LoRA delta cũng có thể làm sạch số lượng đến 8-bit hoặc 4-bit;;LoRA kiểu tải  để bạn có thể ở 4-bit Flux cơ sở trên chồng lên 5-10 个 LoRA, mà không sẽ 爆内存;;

Flux-specific: Niels's Flux-on-8GB notebook sẽ định lượng thành 4 bit; trong cơ sở định lượng trên kiểu LoRA`pipe.load_lora_weights("user/style-lora")`),并使用 `weight_name="pytorch_lora_weights.safetensors"`, vẫn có thể làm việc. Đây là công thức mà hầu hết các tổ chức SaaS sẽ giao hàng vào năm 2026.

## 延伸阅读

- [Zhang, Rao, Agrawala (2023). Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543)ControlNet
- [Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) LoRA( ban đầu được sử dụng cho LLM; sau đó được chuyển đến phân tán)
- [Ye et al. (2023). IP-Adapter: Text Compatible Image Prompt Adapter](https://arxiv.org/abs/2308.06721) Đổi IP-Adapter。
- [Mou et al. (2023). T2I-Adapter: Learning Adapters to Dig Out More Controllable Ability](https://arxiv.org/abs/2302.08453) ControlNet's Lightweight Alternative
- [Ruiz et al. (2023). DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation](https://arxiv.org/abs/2208.12242) DreamBooth。
- [HuggingFace Diffusers — ControlNet / LoRA / IP-Adapter docs](https://huggingface.co/docs/diffusers/training/controlnet) 参考 đường ống ống
