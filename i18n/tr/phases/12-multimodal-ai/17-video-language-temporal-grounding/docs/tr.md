# Video-Dil Modelleri:Vakt Tokenleri ve Yerleştirme

> Video 不是一叠照片──一 5 秒片 有因果序、动作动词和事件时序,这些是图像模型 无法表示的──Video-LLaMA(Zhang et al., Haziran 2023) ilk açıktı video-LLM yayınladı. VideoChat 和 Video-LLaVA 扩展了这个模式──到2025年,Qwen2.5-VL 的TMROPE 缩小了与边界专有模型的差距──每个系统都以不同的方式解决时间代码:Q-former per clip、concat-pool per frame、TMRoPE per token──本课将这些模式解读,构建统一对动态框架样本,并进行时间代码测量任务上评估──

**Type:** Build
**Languages:** Python (stdlib, frame sampler + temporal-grounding evaluator)
**Prerequisites:** Phase 12 · 08 (LLaVA-OneVision)
**Time:** ~180 minutes

## Öğrenme hedefi
- 解释为什么时间定位编码 会独立于视觉编码器 改变视频VLM性能──
- Birbirine göre ̋dinamik-FPS ve olay yönlendirilmiş çerçeve örneklemesi  ̋token-per-second ile yerleştirme doğruluğu ̶ arasında bir fark vardır.
- 描述 Q-former-per-clip(Video-LLaMA)、pooled-per-frame(Video-LLaVA) y M-RoPE-per-token(Qwen2.5-VL) tasarım。
- VideoMME,TempCompass,EgoSchema,Video-MMMU,

## 问题
Bir dakika 30 FPS video 1800 çerçeve var. Her çerçeveye göre 196 görsel jeton.

 exist三种压缩策略:

1. Alt örnek çerçeveleri (Üzerinde 1-8 FPS kullanıldığı çerçeveler)
2. Her çerçeve patch tokenleri için güçlü güç birleştirme yapın.
3. 通过 Q-former 压缩:输入一个16frame clip,输出 64 token──

Her türlü değişikliği vardır. Örnekleme zamanlı ayrıntıları kaybeder.

Zamanlı konum kodlaması ise başka bir boyut:模型如何知道框架 5 发生在框架 6 之前?选项包括简单的1D temporal RoPE(Video-LLaMA)、学习的 temporal embeddings(Video-LLaVA) 和TMRoPE(Qwen2.5-VL,完整3D)。

## 概念
### Video-LLaMA: Her klip bir Q-former + ses dalı

Video-LLaMA(2023) ilk açık video-LLM──Arkitektür:

- 16 kadro klipler 2 FPS'de ((即 8 秒)
- Video Q-former,对全部16 frame做交叉服务 -> 32 öğrenilmiş sorgu -> LLM。
- 并行音频分支:waveform -> ImageBind audio encoder -> Audio Q-former -> 32 sorgu -> LLM。

优势:audio-visual joint reasoning──弱点: sabit klip uzunluğu, keyfi zaman yerleştirme işlemi yapamıyor──

### VideoChat ve Video-LLaVA

VideoChat Video-LLaMA'nın düşüncelerini korudu, ama sesleri kaldırdı ve basitleştirdi. Video-LLaVA(Lin et al., 2023)

İkincisi, uzun videoları işlemek mümkün değil.

### Qwen2.5-VL ve TMRoPE

Qwen2.5-VL TMRoPE'yi, yani Zaman-Modality Rotary Position Embedding'i başlattı. Her patch token bir (t, h, w) konum taşıyor, bunlardan t gerçek zaman damgasıdır.

Basit zamanlı yerleştirme ile önemli fark:

- 绝对时间, not index. 模型 is seen at 4.2 seconds.  not at frame 15 ──
- Her bir görüntü simgesi kendi zaman damlasına göre hareket eder.
- 兼容 dinamik FPS── Eğer burada 2 FPS 采样、 orada 4 FPS 采样, TMRoPE bu farklılıkları tam olarak çözebilir.

TMRoPE 支持猫在第几秒跳起?                                                                                                                                                                                                                                                        

### Çerçeve örnekleme stratejileri

Teker teker: tüm süre içinde içinde 均采样 N çerçeveler。简单,但会丢失运动峰。

Dinamik FPS: Hareket yoğunluğuna göre 自适应采样──Ortiksel akış veya çerçeve farklılaşımı 会在高动作段で 选择更密集的采样──Qwen2.5-VL 会这样练──

Evrenli: bir hafiflik algılayıcısı çalıştırmak, hareket içinde 发生处采样更多──VideoAgent 使用这种方式──

Anahtar çerçeve + bağlam: Çekim sınırlarında + 若干 bitişik çerçeveler 采样。用于电影内容。

### Çerçeve başına birleştirme

1 FPS ve her çerçeve 576 token 时, bir 5 分钟 klip 172.800 token ⋅ Qwen2.5-VL-72B 128k bağlamı zorla işlenebilir, ancak maliyet yüksek ⋅

3x3 milyarlı havuz her çerçeve 64 tokene düşecek -> 5 dakika 19.200 tokene...

Ajan iş akışları için daha fazla aktivleşebilir birleştirme ((6x6 -> Her çerçeve 16 jeton), çünkü uzay detayları 没那么重要──

### Dört video referans göstergesi

- VideoMME: Genel video anlayışı, kısa + orta + uzun içerir.
- TempCompass:细粒度 zamanlı akıl yürütme, "önce" / "sonra" soruları içerir.
- EgoSchema:长时程第一人称视频──
- Video-MMMU:Multimodal 多学科视频问题──

完整视频-VLM değerlendirmesi 会覆盖全部四个──它们强调不同维度:TempCompass 关注订单,EgoSchema 关注3+分钟推理,VideoMME 覆盖多种持续时间──

### Yerleştirme çıkış biçimleri

Zamanlı yerleştirme 的输出格式:

- Özgür metin:"Kedi 4 saniyelik noktayı atlar". 易于解析但不精确──
- Yapılandırılmış JSON:`{"event": "jump", "start": 4.1, "end": 4.3}`❖ Qwen2.5VL 会訓練この形式──
- Token tabanlı: speciale `<time>4.1</time>`Tokens 与答案交错──Qwen2.5-VL'nin iç biçimi──

Token tabanlı aşağı akıntılı kullanım için 最准确──Qwen2.5-VL'nin JSON çıkış biçimi doğrudan çözülebilir──

### 2026 En iyi uygulamalar

2026 Video VLM'lerin En İyi Uygulamaları:

- Kodlayıcı:带 M-RoPE veya TMRoPE'nin SigLIP 2(Qwen2.5-VL)。
- Çerçeve örneklemesi: dinamik FPS (Hızlı kullanımı 1-4), maksimum çerçeve kapalı
- Çerçevelik birleştirme:3x3 milyarlı
- Çıktı:包含 time + event 字段的结构化 JSON。
- Benchmarks:VideoMME + TempCompass Genel kullanım için; EgoSchema Uzun Uçraklık için


```figure
video-temporal-patches
```

## Kullan
`code/main.py`包含:

- Üniform 和 dinamik-FPS çerçeve örneklemesi
- Bir oyuncak zamansal yerleştirme değerlendiricisi: verilen zaman T 处 "yerçeklik" olayı 和 model çıkışı, toleransi içinde değerlendirme doğruluğu
- Video-LLaMA(16 çerçeve,Q-eski) 、Video-LLaVA(8 çerçeve,MLP) 、Qwen2.5-VL(dinamik FPS + TMRoPE) arasında karşılaştırma

## - Söyle.
本课会产 出 `outputs/skill-video-vlm-frame-planner.md` video görevini belirlerken, görüntüleme, eylem tanıma, zamanlı yerleşim, özetleme yapılır.

## 练习
1. Bir 3 dakikalık yemek demosu için, üniforma seçin ve dinamik FPS kullanın.

2. TMRoPE  spesifik olarak ne ekledi, basit zamanlı yerleştirme masası yapmamak için?

3. 写一个 VLM 可学习输出时间定位 JSON schema──包含错误案──

4. Video-LLaVA Bölüm 3 İçin "Projeksiyondan Önce Uyumlandırma"

5. VideoMME lider listesinde, 2026 yılına kadar, üst açık model ile üst özel model arasındaki fark ne kadar?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Temporal grounding | "Time-localized answers" | VLM 会为事件发生时间输出具体 timestamp range |
| TMRoPE | "Time-Multimodal RoPE" | 带绝对 timestamps 的 3D rotary position，由 Qwen2.5-VL 使用 |
| Dynamic FPS | "Motion-aware sampling" | 在 high-motion segments 采样更多 frames，在 static segments 采样更少 |
| Frame pooling | "Spatial compress per frame" | 在进入 LLM 前用 bilinear interpolation 减少每个 frame 的 patches |
| Video Q-former | "Clip compressor" | 将 N frames 映射到 K learned queries 的 cross-attention bottleneck |
| VideoMME | "Video bench" | 综合 short/medium/long video benchmark，2500+ samples |

## 延伸阅读
- [Zhang et al. — Video-LLaMA (arXiv:2306.02858)](https://arxiv.org/abs/2306.02858)
- [Li et al. — VideoChat (arXiv:2305.06355)](https://arxiv.org/abs/2305.06355)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Qwen Team — Qwen2.5-VL (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Lin et al. — VILA-1.5 (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
