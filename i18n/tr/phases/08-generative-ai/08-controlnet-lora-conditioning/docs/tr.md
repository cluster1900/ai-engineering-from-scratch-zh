# Kontrol Net, LoRA & Kondisyonlama

> 仅靠文本是一种拙的控制信号――ControlNet 让你建立一个预训练的扩散模型,并使用深度地图、pose skeleton、scribble或边形图像来引导它──LoRA 让你通过训练1000万参数来细调一个2B-参数模型──二者结合,将稳扩散从玩具变成2026年各机构都在交付图像管道──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 10 (LLMs from Scratch — LoRA 基础)
**Time:** ~75 minutes

## 问题

⇒ "Kırmızı elbise giyen bir kadın, yoğun bir sokakta köpek yürütüyor" gibi bu tür bir ipucu, model köpeklerin ne olduğunu, veya sokakların ne olduğunu söylemiyor.

Bu nedenle, bu sistemin tüm yönlerini kontrol etmek için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı oluşturmak için, bir kontrol ağı kullanmak için, bir kontrol ağı kullanmak için, bir düzenlemek için, bir düzenlemek için, bir düzenlemek için, bir düzenlemek ve düzenlemek için, bir düzenlemek için, bir düzenlemek için, bir düzenlemek için, bir düzenlemek için, bir düzenlemek için, bir düzenlemek için, bir düzenleme yapmak için, bir düzenleme yapmaktadır.

Yeni bir model oluşturmak için küçük bir 100x delta gerekir. Bu LoRA'dır.

ControlNet + LoRA + text = 2026 yıl pratikçilerin araç kutusu。 çoğu üretim sınıfı görüntü borusu 会在SDXL / SD3 / Flux bazında 之上叠加 2-5 个 LoRA、1-3 个 ControlNet, yanı sıra bir IP-Adapter。

## 概念

![ControlNet clones the encoder; LoRA adds low-rank deltas](../assets/controlnet-lora.svg)

### ControlNet (Zhang et al., 2023)

取一个预训练的SD──*克隆* U-Net'in kodlayıcıı 半边──结原始模型──训练这个克隆版本,让它接受额外的条件输入(边,深度、pose)──用 *零转* skip connections(初始化为零的1×1 convs,一开始是无运,随后学习 delta) 把克隆版本连接回原始模型的解码器 半边──

```
SD U-Net decoder:   ... ← orig_enc_features + zero_conv(controlnet_enc(condition))
```

Zero-conv başlangıç, kontrol ağının başlangıcı ile aynıdır, hatta eğitimden önce zarar vermez. Standart yayılma kaybı ile, 1M 个 (sürekli, koşul, görüntü) üç katına çıkarılır.

Her türlü modalite ControlNet olarak küçük yan model olarak yayınlanır.

```
features += weight_a * control_a(depth) + weight_b * control_b(pose)
```

### LoRA (Hu et al., 2021)

Modelleri herhangi bir çizgi katman için`W ∈ R^{d×d}`, 结 `W`Aşağı derecede bir delta eklemeyi:

```
W' = W + ΔW,  ΔW = B @ A,  A ∈ R^{r×d},  B ∈ R^{d×r}
```

İçlerinden `r << d`❖ Dikkat için, 4-16 standart yapılandırma; ağırlık için ince ayar için, 64-128 daha sık görülmektedir.`2 · d · r`- Hayır .`d²` için `d=640`SDXL dikkat,`r=16`时每个适配器 只有 20k 参数,而不是 410k,减少了20x──放到整个模型上,一个LoRA通常是20-200MB,而基础是5GB──

Sonuçta, LoRA'yı kısaltmak için:`W' = W + α · B @ A`- Evet.`α = 0.5-1.5`很常见──多种LoRA会加法方式叠加 (özellikle birbirlerini doğrusal olmayan bir şekilde etkilediğine dikkat etmeniz gerekir)

### IP-Adapter (Ye et al., 2023)

Bir çok küçük adaptör, bir 张*图像* olarak şartlandırma olarak kabul eder.

## Ko组合性Matrix

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

## Yapın onu.

`code/main.py`1-D'de iki mekanizma benzer:

1. **LoRA。**Bir önceden eğitilmiş çizgi katman .`W`结它──训练一个低级的`B @ A`,使 `W + BA`匹配目标 linear layer── gösterim `r = 1`足以完美学习一个级-1 düzeltme──

2. **ControlNet-lite。**Bir dondurulmuş temel  öngörücü, ayrıca bir side ağ ──side ağının side ağ ──side ağının çıkışı                                                                                                                                                                                                                                            

### 步骤 1: LoRA matematik

```python
def lora(W, A, B, x, alpha=1.0):
    # W is frozen; A, B are the trainable low-rank factors.
    return [W[i][j] * x[j] for i, j in ...] + alpha * (B @ (A @ x))
```

### 步骤 2: sıfır-init yan ağ

```python
side_out = control_net(x, condition)
gated = gate * side_out  # gate initialized to 0
h = base(x) + gated
```

Bu aşamada, çıkış ve temel tamamen aynı.`gate`, felaketli hareketler olmayacak.

## 常见坑

- **LoRA 过度缩放。** `α = 2`Ya da`α = 3`Bu, daha güçlü bir hack yapmanın bir yolu, ancak aşırı bir şekilde şekillendirilmesi veya zararlı bir çıkış oluşmasıdır.`α ≤ 1.5`- Evet.
- **ControlNet weight 冲突。**Aynı zamanda 1.0 ağırlıklı Pose ControlNet ve 1.0 ağırlıklı Depth ControlNet genellikle geçerlidir.
- **LoRA 用在错误的 base 上。**SDXL LoRA, SD 1.5'de sessiz kalıyor. Dikkat boyutları eşleşmiyor.
- **Textual Inversion 漂移。**Bir kontrol noktasında, diğer kontrol noktasına geçmek için, daha fazla nakliye edilebilir.
- **LoRA weight-merging 和存储。**LoRA'yı temel model ağırlıklarına yerleştirebilirsin, daha hızlı bir sonuç elde edebilirsin, ancak çalıştırma süresi azalır.`α`Bu iki versiyonu koruyor.

## Kullan

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

## - Söyle.

保存 `outputs/skill-sd-toolkit-composer.md`△ bu beceri 接收一个任务(输入资产:快点、可选参考图片、可选姿、可选深度、可选拼图),并输出工具堆、重量 和可复现的种子协议──

## 练习

1. **Easy。**- Evet .`code/main.py`Lora'nın rütbesini.`r`1'den 4'e kadar değişim. LoRA hangi sırada?
2. **Medium。**İki hedef dönüşümünde iki bağımsız LoRA'yı eğitmek. Onları birlikte yüklemek ve onların artışlarını göstermek. Bu ilişki ne zaman doğayı bozacak?
3. **Hard。**kullanımı 叠加:SDXL-base + Canny-ControlNet( ağırlık 0.8) + 一个风格 LoRA(α 0.8) + IP-Adapter( ağırlık 0.6) ・・・

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

## 生产说明:LoRA swaps•ControlNet laneleri•çok kiracı hizmet

Bir gerçek metin-resim SaaS toplantısı aynı temel kontrol noktasında 上服务数百 LoRA 和十几个 ControlNet──serving 问题很像 LLM çok kiralamacılık(生产文献中在连续批发 和 LoRAX / S-LoRA 下讨论 LLM 场景):

- **Hot-swap LoRAs，不要 merge。**- Ben de .`W' = W + α·B·A`Üstüne birleştirin, her adım sonuca varsın.`α`Ve temel olarak, LoRA'yı R-R deltası olarak VRAM'da 热加载中;diffusers 暴露 `pipe.load_lora_weights()`+ `pipe.set_adapters([...], adapter_weights=[...])`, istek üzerine aktive edilebilir.`2 · d · r · num_layers`ağırlıklar, yani MB 级、亚秒级──
- **ControlNet 作为第二条 attention lane。**克隆的编码器与基并行运行──两重都为 1.0 的ControlNet = 每步两次额外前进通过,而不是一次合并通过──批量级头室 会第二次下降──每一个活跃ControlNet 预算约 ~1.5×阶段成本──
- **Quantized LoRAs 也适用。**Eğer bazı ölçüyorsanız ((Düşünme 07, 8GB'de fluks), LoRA delta da 8-bit veya 4-bit olarak ölçülebilir.

Fluks-Specifik:Niels'in 8GB'lik Fluks notbukunun bazı 4 bit olarak ölçülecek; bu kuantit bazda üst üste üste üste üste üste LoRA(`pipe.load_lora_weights("user/style-lora")`),并使用 `weight_name="pytorch_lora_weights.safetensors"`2026 yılında çoğu SaaS kuruluşunun teslimat tarifi budur.

## 延伸阅读

- [Zhang, Rao, Agrawala (2023). Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543)Kontrol ağı.
- [Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) LoRA(başlangıçta LLM'de kullanılır; sonra yayılmaya aktarılır)
- [Ye et al. (2023). IP-Adapter: Text Compatible Image Prompt Adapter](https://arxiv.org/abs/2308.06721) IP Adaptörü
- [Mou et al. (2023). T2I-Adapter: Learning Adapters to Dig Out More Controllable Ability](https://arxiv.org/abs/2302.08453)ControlNet'in daha hafif alternatifleri
- [Ruiz et al. (2023). DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation](https://arxiv.org/abs/2208.12242)- Hayal sandığı.
- [HuggingFace Diffusers — ControlNet / LoRA / IP-Adapter docs](https://huggingface.co/docs/diffusers/training/controlnet) 参考 boru hattları。
