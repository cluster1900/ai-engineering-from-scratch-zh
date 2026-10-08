# 视频生成

> 图像是一个2D tensor──视频是一个3D tensor──理论相同;compute 难度高出 10-100x──OpenAI的 Sora(2024年 2 月) bunu mümkün olduğunu kanıtladı──2026年,Veo 2、Kling 1.5、Runway Gen-3、Pika 2.0 和 WAN 2.2 已已能从文本生成 1080p 的生产级视频,而开权重堆(CogVideoX、HunyuanVideo、Mochi-1、WAN 2.2)落后约12个月──

**Type:** Build
**Languages:** Python
**先修要求:**8 · 07 aşaması (Latent Diffusion), 7 · 09 aşaması (ViT), 8 · 06 aşaması (DDPM)
**Time:** ~45 minutes

## 问题

Bir 10 saniyeli 1080p 24fps video 240 , her  1920×1080×3 piksel içerir.

1. **时空压缩。**Bir VAE, videoyu sadece zaman ve uzay çişimleri için kodlamayı değil 序列 olarak kullanır.
2. **时间一致性。**Çoğu kişi bir kaç saniye içinde içeriği paylaşmak zorunda ‒ ışığı ve nesne kimliği ‒ İnternet hareketin yapılandırılması ‒
3. **Compute budget。**Aynı model boyutunda, video eğitimi 10-100x daha fazla.
4. **Conditioning。**文本、图像(第一)、音频或另一个视频── çoğu üretim modeli bu dört türü kabul eder.

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             **Diffusion Transformer (DiT)**,在巨大的(快速、字幕、视频) DATA集上训练──diffusion loss 与 Lesson 06 相同──

## 概念

![Video diffusion: patchify, DiT, decode](../assets/video-generation.svg)

### Çekil

3D VAE kullanmak için kullanın`[T_latent, H_latent, W_latent, C_latent]`                                                                                                                                                                                                                                                              `[t_p, h_p, w_p]`Soranın yapısı için.`t_p = 1`(Biri-biriyle)`t_p = 2`(每两) ⋅10秒 1080p 视频会压缩到约20,000-100,000 个补丁──

### Uzay-zamanlı DiT

Bir Transformer 处理平化的 patch 序列── her patch için 3D pozisyyonel yerleşim vardır(zaman + y + x)── dikkat genellikle faktorlaşır:

- **Spatial attention**İçinde yapılan her bir patçın içinde yapılan bir işlem.
- **Temporal attention**Aynı alanın içinde yürütülür.
- **Full 3D attention**昂贵16-100x; yalnızca düşük çözünürlükte veya çalışmalarda kullanılır.

### 文本 koşullandırma

Büyük metin kodlayıcısı kullan  yapın Çarşı dikkat(Sora T5-XXL kullan,CogVideoX-5B T5-XXL kullan) 长提示 很重要,Sora'nın eğitim kümesi GPT 生成的密集重写,平均每片 200 token──

### 訓練

Uzay-zamanlı latente olarak kullanılan standart difüzyon kaybı (ε veya v tahmin)  Data: web video + ≈ 100M kurate klip + sentetik metin başlıkları  Hesaplama: Küçük araştırma çalışmaları da 10.000+ GPU saat gerektirir; Sora ölçeğinde ise 100.000+ 

## 2026 yıl üretim yapısı

| Model | Date | Max duration | Max res | Open weights? | Notable |
|-------|------|--------------|---------|---------------|---------|
| Sora (OpenAI) | 2024-02 | 60s | 1080p | No | 第一个在 scale 下展示 world simulator 属性的模型 |
| Sora Turbo | 2024-12 | 20s | 1080p | No | 推理快 5x 的生产版 Sora |
| Veo 2 (Google) | 2024-12 | 8s | 4K | No | 2025 年最高质量 + physics |
| Veo 3 | 2025 Q3 | 15s | 4K | No | 原生音频和更强的相机控制 |
| Kling 1.5 / 2.1 (Kuaishou) | 2024-2025 | 10s | 1080p | No | 2025 Q1 最好的人体运动 |
| Runway Gen-3 Alpha | 2024-06 | 10s | 768p | No | 在其之上的专业视频工具 |
| Pika 2.0 | 2024-10 | 5s | 1080p | No | 最强角色一致性 |
| CogVideoX (THUDM) | 2024 | 10s | 720p | Yes (2B, 5B) | 第一个开放的 5B-scale 视频模型 |
| HunyuanVideo (Tencent) | 2024-12 | 5s | 720p | Yes (13B) | 2024 年末开放 SOTA |
| Mochi-1 (Genmo) | 2024-10 | 5.4s | 480p | Yes (10B) | 许可证最宽松 |
| WAN 2.2 (Alibaba) | 2025-07 | 5s | 720p | Yes | 2025 年中最强开放模型 |

Açık ağırlıklar, video alanında görüntü alanından daha hızlı bir şekilde artan fark hızını azaltır: 2026 yılına kadar, HunyuanVideo + WAN 2.2 LoRA'lar  zaten çoğu açık kaynak iş akışını yönlendirdi.


```figure
video-diffusion-denoise
```

## Yapın onu.

`code/main.py`模拟核心的空间时代 DiT 思路:patchify 一个小型合成视频,加入 per-patch position embedding,并用变压器式注意 在 patches上对整个序列的指明──不用指明──纯 Python──我们展示了即使在1-D 中,当相邻 patches 共享指明和位置嵌入时,也会出现时间一致──

### Adım 1: Bir yapay 1D "video" yapıştır

```python
def make_video(T_frames=8, rng=None):
    # a "video" is a sequence of 1-D values following a smooth trajectory
    base = rng.gauss(0, 1)
    return [base + 0.3 * t + rng.gauss(0, 0.1) for t in range(T_frames)]
```

### 步骤 2: Her pozisyon yerleştirme

```python
def pos_embed(t, dim):
    return sinusoidal(t, dim)
```

### 步骤 3: denoiser 看到整个序列

Bizim mikrotip ağımız bağımsız olarak her bir şeyi tanımlamıyor, tüm  değerlerini + konumlarını yerleştirerek tüm gürültüleri tahmin ediyor.

### 步骤 4: 时间一致性测试

訓練後,サンプル 一个视频──測量框架对框架 delta──如果模型学到了时间结构,deltas 会比独立样本 每一更小──

## 陷

- **独立逐帧 sampling = flicker。**Eğer her bir bölümde görüntü yayımı çalışıyorsanız, bu noktayı düzeltmek için, her bir sesin gürültüsü bağımsızdır.
- **朴素 3D attention = OOM。**10 saniye 1080p gizli bir 3D dikkat için milyarlarca işlem gerektirir.
- **数据 captioning 比规模更重要。**Sora 相比以前工作的主要升级, yaklaşık 10x daha ayrıntılı başlıklarla 训练(GPT-4 重新标注片) ――OpenAI's技术报告对此说得很明确──
- **First-frame conditioning。**Çoğu üretim modeli de bir resim olarak kabul eder. Bu "resim-video" 模式; eğitim bu değişimi içerir.
- **Physics drift。**长 clips(>10s) 会积累细微不一致──滑窗生成 + anahtar çerçeve demirleme 会有帮助──

## Kullan

| Use case | 2026 pick |
|----------|-----------|
| 最高质量 text-to-video，hosted | Veo 3 or Sora |
| 可控相机的 cinematic | Runway Gen-3 with motion brushes |
| 跨 clips 的角色一致性 | Pika 2.0 or Kling 2.1 |
| Open weights，快速 fine-tune | WAN 2.2 + LoRA |
| Image-to-video | WAN 2.2-I2V, Kling 2.1 I2V, or Runway |
| Audio-to-video lip sync | Veo 3 (native audio) or a dedicated lip-sync model |
| 视频编辑 | Runway Act-Two, Kling Motion Brush, Flux-Kontext (still-frame) |

Kalite durumunda ise video saniyesine 20 kat daha az video maliyeti 2024-2026 yılları arasında düşmüştür.

## - Söyle.

保存 `outputs/skill-video-brief.md` Yetenek 接收一个视频简介(duration、aspect ratio、style、camera plan、subject consistency、audio),并输出:model + hosting、prompt scaffolding(camera dili、subject description、motion descriptors) 、seed + reproducibility protocol,以及 frame-level QA checklist──

## 练习

1. **Easy.**- Evet .`code/main.py`中,比较 (a) bağımsız çerçeve örneği ve (b) ortak dizi örneği örneği çerçeve- çerçeve delta──rapport deltası △ ortalama 和 varyansa──
2. **Medium.**添加一个第一框条件:将框架 0 pin 到给定值并样本 其余部分──测量固定值 如何传播──
3. **Hard.**HuggingFace difüserlerini kullanın CogVideoX-2B için kullanın. 720p için 6 saniyelik klip 计时 20 个推断步骤──Profile space-time attention 以识别瓶──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Video VAE | "3-D VAE" | 将 `(T, H, W, C)` 压缩为 spatiotemporal latent 的 Encoder。 |
| Patches | "The tokens" | latent 的固定大小 3-D blocks；作为 DiT 的输入。 |
| Factorized attention | "Spatial + temporal" | 先在空间上运行 Attention，再在时间上运行；跳过 full 3-D attention。 |
| Image-to-video (I2V) | "Animate this photo" | 模型接收一张图像 + 文本，并输出从它开始的视频。 |
| Keyframe conditioning | "Anchor frames" | Pin 特定帧来控制视频的 arc。 |
| Motion brush | "Directional hint" | 用户在图像上绘制 motion vectors 的 UI 输入。 |
| Re-captioning | "Dense captions" | 使用 LLM 用详细 prompts 重新标注训练 clips。 |
| Flicker | "Temporal artifact" | Frame-to-frame 不一致；通过 coupled denoising 修复。 |

## 生产说明:video latents  problem

Bir 10 saniye 1080p、24 fps klip  240 çerçeve × 1920 × 1080 × 3 ≈ 1.5 GB orijinal piksel ≈ 4× video VAE sıkıştırma geçiyor`2 × spatial × 2 × temporal`) 后,latent Her kere istek yaklaşık 100 MB olacaktır. Bunu uzay-zaman diT  跑 30 adım 批 1,you 您每步都需要通过HBM 移动约3 GB,瓶是内存带宽,而不是FLOPs──

Üç üretim düğmesi, hepsi doğrudan üretim-söylem literatürü sonucu bölümünden geliyor:

- **跨 DiT 的 TP。**Metin-video modelleri genellikle ≥10B parametreleri──4 个 H100 上 TP=4 standart konfigürasyon;405B sınıfı modeller 使用 PP=2 × TP=2── her adım için gecikme 随 TP 大致线性下降,直到撞上全降壁──
- **Frame batching = continuous batching。**Üretim zamanında, video kavramı üzerinde bir grup tarafından dikkat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               `t-1`Geri dönerken                                                                                                                                                                                                                                                             `t+1`- Evet.
- **Clip-level prefill cache。**Resim-video için, ilk çerçeve koşullaması  LLM'nin hızlı önceden doldurma gibi: hesap bir kez, ve zamanlı dekodör geçiyor 中复用──これは実際はビデオのKV-キャッシュ──

## 延伸阅读
- [Brooks et al. (2024). Video generation models as world simulators](https://openai.com/index/video-generation-models-as-world-simulators/) Sora 技术報告。
- [Yang et al. (2024). CogVideoX: Text-to-Video Diffusion Models with An Expert Transformer](https://arxiv.org/abs/2408.06072) CogVideoX。
- [Kong et al. (2024). HunyuanVideo: A Systematic Framework for Large Video Generative Models](https://arxiv.org/abs/2412.03603) HunyuanVideo。
- [Genmo (2024). Mochi-1 Technical Report](https://www.genmo.ai/blog/mochi)Mochi-1:
- [Alibaba (2025). WAN 2.2](https://wanvideo.io/)2025 yılında SOTA'nın açılışı
- [Ho, Salimans, Gritsenko et al. (2022). Video Diffusion Models](https://arxiv.org/abs/2204.03458) 开创性 video yayımı 论文。
- [Blattmann et al. (2023). Align your Latents (Video LDM)](https://arxiv.org/abs/2304.08818) Stable Video Diffusion'ın önümüze geçiyor.
