# 视频生成

> 图像是一个2D tensor──视频是一个3D tensor──理论相同;计算难度高出10-100x──OpenAI的 Sora(2024年 2月) chứng minh rằng nó có thể thực hiện.

**Type:** Build
**Languages:** Python
**先修要求:**Giai đoạn 8 · 07 (Tâm nhập trôi qua trôi qua), Giai đoạn 7 · 09 (ViT), Giai đoạn 8 · 06 (DDPM)
**Time:** ~45 minutes

## 问题

Một video 10 giây,1080p、24fps có chứa 240 , mỗi  1920×1080×3 pixel── dữ liệu ban đầu của mỗi clip là khoảng 1,5 GB──Pixel-space diffusion không thể chạy── Bạn cần:

1. **时空压缩。**Một VAE, hãy xem video thay vì chỉ đơn 编码 cho các bản vá không gian-thời gian 序列.
2. **时间一致性。**Nhiều người cần chia sẻ nội dung trong vài giây ∞ ánh sáng và danh tính đối tượng∞ mạng phải được xây dựng trên mô hình.
3. **Compute budget。**Trong cùng kích thước mô hình, video training hơn hình ảnh của bạn 10-100x.
4. **Conditioning。**文本、图像(第一)、音频或另一个视频── hầu hết các mô hình sản xuất đều chấp nhận bốn loại này──

 giải quyết vấn đề này cấu trúc là ứng dụng cho các bản vá không gian và thời gian **Diffusion Transformer (DiT)**, trong một tập dữ liệu lớn (WEB ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

## 概念

![Video diffusion: patchify, DiT, decode](../assets/video-generation.svg)

### Tấn động

Sử dụng 3D VAE(学习到的时空缩写)编码视频──latent hình dạng là `[T_latent, H_latent, W_latent, C_latent]`                                                                                                                                                                                                                                                              `[t_p, h_p, w_p]`Đối với mô hình của Sora,`t_p = 1`( từng đệm) hoặc `t_p = 2`(每两) ⋅ một 10 giây 1080p 视频会压缩 thành khoảng 20.000-100.000 块 ⋅

### Tiếp tục không gian thời gian

Một biến thể  xử lý 平化的 patch 序列── mỗi patch đều có một sự nhúng vị trí 3D( thời gian + y + x)── chú ý thường được phân tích theo yếu tố:

- **Spatial attention**Trong mỗi lần của các váy  bên trong tiến hành.
- **Temporal attention**Trong cùng một vị trí không gian.
- **Full 3D attention**昂贵 16-100x; chỉ sử dụng trong phân giải thấp hoặc nghiên cứu.

### 文本 điều kiện

Sử dụng mã hóa văn bản lớn  thực hiện Cần chú ý qua mặt(Sora sử dụng T5-XXL,CogVideoX-5B sử dụng T5-XXL) 长 prompt  rất quan trọng, tập hợp đào tạo của Sora chứa các bản ghi lại dày đặc của GPT 生成, trung bình mỗi clip là 200 token。

### 训练

Trong các latences không gian-thời gian 上使用标准扩散损失 (ε hoặc v dự đoán)  dữ liệu: video web + 约 100M clip được sắp xếp + tiêu đề văn bản tổng hợp  tính toán: ngay cả trong các nghiên cứu nhỏ cũng cần hơn 10.000 giờ GPU; quy mô lớn là hơn 100.000 

## 2026 年生产格局

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

Open Weights trong lĩnh vực video giảm tốc độ chênh lệch so với lĩnh vực hình ảnh nhanh hơn: đến năm 2026, HunyuanVideo + WAN 2.2 LoRA đã thúc đẩy hầu hết các dòng công việc nguồn mở.


```figure
video-diffusion-denoise
```

##  xây dựng nó

`code/main.py`模拟核心的空间时代 DiT 思路:patchify 一个小型合成视频,加入每补丁位置嵌入,并用变压器式注意 在补丁上对整个序列表示──不用 numpy;纯 Python──我们展示即使在1-D 中,当相邻补丁 共享表示和位置嵌入时,也会出现时间一致──

### Bước 1: Lắp đặt một video 1D tổng hợp

```python
def make_video(T_frames=8, rng=None):
    # a "video" is a sequence of 1-D values following a smooth trajectory
    base = rng.gauss(0, 1)
    return [base + 0.3 * t + rng.gauss(0, 0.1) for t in range(T_frames)]
```

### 步骤 2: mỗi vị trí nhúng

```python
def pos_embed(t, dim):
    return sinusoidal(t, dim)
```

### 步骤 3: denoiser  nhìn thấy toàn bộ序列

Chúng ta không chỉ định riêng mỗi , mà kết hợp tất cả các  giá trị +  vị trí của chúng,并联合预测 tất cả  tiếng ồn.

### 步骤 4: 时间一致性测试

训练后,样本 一个视频――测量 frame-to-frame delta――如果模型学到了时间结构,deltas 会比独立样本 每一更小──

## 陷

- **独立逐帧 sampling = flicker。**Nếu bạn đang sử dụng phân phối hình ảnh cho mỗi bộ, hãy nhớ nhớ lại, vì tiếng ồn của mỗi bộ là độc lập.
- **朴素 3D attention = OOM。**Để làm cho một 10 giây 1080p ẩn tình thực hiện sự chú ý 3D đầy đủ cần hàng tỷ lần hoạt động.
- **数据 captioning 比规模更重要。**Sora 相比以前工作的主要升级,是使用约10x详细的字幕 训练(GPT-4 重新标注片段) ・OpenAI的技术报告对此说得很清楚──
- **First-frame conditioning。**Đại đa số các mô hình sản xuất cũng chấp nhận một hình ảnh như là thứ nhất.
- **Physics drift。**长 clip(>10s) 会积累细微不一致──Sliding-window generation + keyframe anchoring 会有帮助──

## Sử dụng nó

| Use case | 2026 pick |
|----------|-----------|
| 最高质量 text-to-video，hosted | Veo 3 or Sora |
| 可控相机的 cinematic | Runway Gen-3 with motion brushes |
| 跨 clips 的角色一致性 | Pika 2.0 or Kling 2.1 |
| Open weights，快速 fine-tune | WAN 2.2 + LoRA |
| Image-to-video | WAN 2.2-I2V, Kling 2.1 I2V, or Runway |
| Audio-to-video lip sync | Veo 3 (native audio) or a dedicated lip-sync model |
| 视频编辑 | Runway Act-Two, Kling Motion Brush, Flux-Kontext (still-frame) |

Trong tình trạng chất lượng tương đương, chi phí video mỗi giây đã giảm 20 lần trong năm 2024 đến 2026:

## 交付 nó

保存 `outputs/skill-video-brief.md` Khả năng tiếp nhận một đoạn video ngắn ((duration, aspect ratio, style, camera plan, subject consistency, audio),并输出: model + hosting, prompt scaffolding, camera language, subject description, motion descriptors, seed + reproducibility protocol, cũng như danh sách kiểm tra QA cấp khung hình.

## 练习

1. **Easy.**Trong `code/main.py`Trung,比较 (a) lấy mẫu mỗi khung độc lập và (b) lấy mẫu chuỗi chung của frame-to-frame delta──报告 deltas 的 mean 和 variance──
2. **Medium.**添加一个第一框条件:将 frame 0 pin 到给定值并样本 其余部分──测量 如何传播──
3. **Hard.**Sử dụng HuggingFace diffusers trên GPU địa phương 上运行 CogVideoX-2B── đối với 720p、6 giây clip 计时 20 个推断步骤──Profile không gian-thời gian chú ý 以识别瓶──

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

## 生产说明: video latency là bộ nhớ băng thông  vấn đề

Một clip 10 giây 1080p、24 fps  chứa 240 khung hình × 1920 × 1080 × 3 ≈ 1.5 GB nguyên thủy pixel── trải qua 4× video VAE compression(`2 × spatial × 2 × temporal`(Bài gọi là "HBM" (HBM) (HBM) (HBM) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (HMB) (H) (HMB) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H) (H

三个生产knobs,都直接来自生产-sự luận văn học suy luận chương:

- **跨 DiT 的 TP。**Các mô hình văn bản-video thường ≥10B tham số──4 个 H100 上 TP=4 là cấu hình tiêu chuẩn;405B- lớp mô hình sử dụng PP=2 × TP=2── mỗi bước trễ 随 TP 大致线性下降,直到撞击上全减墙──
- **Frame batching = continuous batching。**Trong thời gian phát triển, video concept trên là một loạt bởi Attention 连接的框架──Continuous batching(in-flight scheduling)适用: Nếu mô hình架构允许滑窗生成,可以在框架`t-1`Tôi đang quay lại và bắt đầu làm việc.`t+1`
- **Clip-level prefill cache。**Đối với hình ảnh-đến video để nói, điều kiện khung hình đầu tiên  giống như LLM: tính toán một lần, và trong thời gian decoder đi qua 中复用── đây thực tế là video của KV-cache──

## 延伸阅读
- [Brooks et al. (2024). Video generation models as world simulators](https://openai.com/index/video-generation-models-as-world-simulators/) Sora 技术报告。
- [Yang et al. (2024). CogVideoX: Text-to-Video Diffusion Models with An Expert Transformer](https://arxiv.org/abs/2408.06072) CogVideoX。
- [Kong et al. (2024). HunyuanVideo: A Systematic Framework for Large Video Generative Models](https://arxiv.org/abs/2412.03603) HunyuanVideo。
- [Genmo (2024). Mochi-1 Technical Report](https://www.genmo.ai/blog/mochi) Mochi-1。
- [Alibaba (2025). WAN 2.2](https://wanvideo.io/) 2025 年中开放 SOTA。
- [Ho, Salimans, Gritsenko et al. (2022). Video Diffusion Models](https://arxiv.org/abs/2204.03458) 开创性 video truyền hình 论文。
- [Blattmann et al. (2023). Align your Latents (Video LDM)](https://arxiv.org/abs/2304.08818) Stable Video Diffusion 的前身──
