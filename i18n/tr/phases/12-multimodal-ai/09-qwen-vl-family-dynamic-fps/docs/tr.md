# Qwen-VL Ailesi ve Dinamik-FPS Video

> Qwen-VL ailesi  Qwen-VL (2023)、Qwen2-VL (2024)、Qwen2.5-VL (2025)、Qwen3-VL (2025)  2026 yılının en etkili açık görme dil modeli 谱系系系系¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

**Type:** Learn
**Languages:** Python (stdlib, M-RoPE encoder + dynamic-FPS sampler)
**Prerequisites:** Phase 12 · 06 (patch-n'-pack)
**Time:** ~120 minutes

## Öğrenme hedefi
- 計算 M-RoPE'nin üç akşi dönümü, zamanın, yüksekliğin ve genişliğinin nedenini açıklıyor.
- Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çvivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivivi
- 順序出 Qwen-VL 四代升级,以及每代启用了什么──
- 连接一个Qwen2.5VL tarzı JSON ajanı 输出格式,并从 VLM 响应中解析结构化工具调用──

## 问题
Qwen-VL, 2023 yılının Ağustos ayında yayınlandı, LLaVA-1.5 ve BLIP-2'ye doğrudan karşılık olarak yayımlandı.

Çözüm:LLaVA-1.5  336x336 ında çalışmaktadır. Fotoğraflar da kullanılabilir, ancak Çin dilinde gönderilen veya yoğun elektronik tablo kesimleri için kullanılmaz.

Video-LLaMA 堆叠逐编码器并把它们给LLM── kısa filmler için geçerlidir, ancak bir saatlik video için geçerli değildir, çünkü bu tür videoların zaman ayırı sadece sinyallerdir──Qwen 团队想要一个理解时间的单一编码──

结构化输出:LLaVA 输出自由格式文本──Agent 需要 JSON──Qwen-VL 使用显式 JSON 输出格式训练,包括把边界框 坐标作为文本──

Her nesil Qwen-VL bu üç ıntıma hattının birinde genişledi.

## 概念
### Qwen-VL (Avgust 2023)

İlk aşama:OpenCLIP ViT-bigG/14 作为编码器(2.5B params)、LLama- uyumlu Q-Former(1 adım 256 sorgu ile)、Qwen-7B bazı。贡献:

- 448x448 分辨率 (VLM'nin SOTA'sı açılmıştı)
- Yerleştirme: usage带显式坐标 Token 输出的 image-text pairs 训练──"Kedi <box>(112, 204), (280, 344)</box>"──
- Birden başta Çin + İngilizce çok dil eğitimleri yapıldı.

O zamanlar 基准:英文上可与 GPT-4V 竞争,中文上占优──Grounding 监督才是真正的亮点──

### Qwen2-VL (Eylül 2024)  M-RoPE 与原生分辨率

Qwen2-VL orijinal yaşam biçim çözünürlük ViT kodlayıcı ile sabit çözünürlük + Q-Former stackı değiştirildi.

- Yeni HxW'yi kabul eder ve bu da HxW'yi kabul eder.
- M-RoPE (Multimodal RoPE) ・・・ Her Token 携带 3D 位置 (t, h, w), 1D değil ・・・对于图像 t=0;对于视频 t = frame_index。RoPE 按每个轴的频率旋转查询/key Vector。没有位置嵌入表。
- MLP projeksiyoncusu──去掉 Q-Former;在合并补丁代币上使用2层 MLP──
- 带动态FPS的视频──默认以1-2 FPS 采样视频,但模型接受任意数──

结果:Qwen2-VL-7B 在多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多多

### Qwen2.5-VL(2025 年 2 月)  dinamik FPS + mutlak zaman

Qwen2.5VL'nin büyük dönüşümü videolardır.

- 绝对时间 Token──不使用位置索引(frame 0, 1, 2...),而使用实际时间──"0:04'te kedi atlar". 模型会看到与框架代币 交错的`<time>0.04</time>`Tokenler
- Dinamik FPS── yavaş hızlı malzemeler 1 FPS ışılagı, hareket sahnesleri 4+ FPS ışılagı── kullanıcı veya eğitimci cihazı tarafından seçiliyor; M-RoPE 会适配──
- ViT 中的窗户注意──空间注意── 窗户内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局部内局内内局内内局内内局内局内内局内内局内内局内内局内内内局内内局内内内局内内内局内内内内内局内内内内内局内内内内内内内内内局内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内内
- 显式 JSON 输出格式──使用工具-call 数据训练:"{\"coll\": \"click\", \"coords\": [380, 220]}"──开箱即代理-ready──
- MRoPE-v2 ölçeklendirme. konum en büyük giriş ile büyük ölçüde küçültülür.

基准:Qwen2.5-VL-72B 在多数视频基准上超过GPT-4o,在文档上追平 Gemini 2.0,并为GUI grounding 设定开放模型 SOTA(ScreenSpot:GPT-4o'nun %38'e karşı %84 doğruluklılıklılıklı:

### Qwen3-VL (Kasım 2025)

Qwen3-VL bir kez büyüme yükseltmesidir, öncelik yeniden geliştirilmektense bütünleşmekdir: daha büyük LLM omurgası(Qwen3-72B) 、 genişletme eğitim verileri、 geliştirme OCR, ve ayrıca Qwen3  düşünme modusu                                                                                                                                                                                                                             

Bu spektrinin sonucu: 2025 yılına kadar, Qwen-VL 架构已经稳定了──后续代际扩展是计算和数据,而不是原始的──

### Matematik olarak M-RoPE

经典 RoPE 使用成对坐标,按位置 `m`旋转维度为 `d`               `q`- ...

```
q_rot[2i]   = q[2i]   * cos(m * theta_i) - q[2i+1] * sin(m * theta_i)
q_rot[2i+1] = q[2i]   * sin(m * theta_i) + q[2i+1] * cos(m * theta_i)
theta_i     = 10000^(-2i/d)
```

M-RoPE gizli bir şekilde parçalanır.`d = 96`△ 32 dims 给 temporal、32 给 height、32 给 width──每个条条带 根据自己的轴位置旋转──位于 (t=5, h=10, w=20) 的补丁 会在其三条带 上分别应用旋转`R_t(5)`- Evet.`R_h(10)`- Evet.`R_w(20)`- Evet.

Metin işaretleri 使用 `t = text_index, h = 0, w = 0`(or a form of integration selection), 保持兼容──视频使用 `t = frame_time, h = row, w = col`△ tek resim kullanımı `t = 0`- Evet.

Avantaj: Bir konum kodlaması, metin, resim ve video işleme için kullanılabilir, farklı bir kod veya farklı konum şefti gerekmez.

### Dinamik-FPS 采样逻辑

给定一个时长为 `T`秒的视频和目标 Token 预算 `B`- ...

1. Yapabileceğiniz en büyük FPS'i hesaplayın:`fps_max = B / (T * tokens_per_frame)`- Evet.
2. - Evet .`{1, 2, 4, 8}`中选择满足 `fps <= fps_max`Hedef FPS:
3. Eğer hareket güçlüse, daha düşük FPS seçin.
4. 按选定FPS 均采样; entre插入 `<time>t</time>`Tokenler

Qwen2.5VL 会隐式训练这种逻辑;推理时用户通过 `fps`参数控制── 60 saniyelik hareket dizisi, 4 FPS ⋅ 81 token 計算, 19440 token ile eşittir, 32k bağlamında 中可管理──

### Yapılandırılmış ajan çıkışı

Qwen2.5 VL'nin ajanı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

```
{
  "tool": "mouse_click",
  "coords": [1024, 512],
  "button": "left",
  "modifier": null
}
```

解析是确定性的:对模型输出执行 JSON.parse。相比之下,自由格式的"click at (1024, 512) " 需要 regex 和歧义处理──这个转变解释了为什么Qwen2.5-VL'in ScreenSpot 分数从Qwen2-VL'in 55% 跳跃至 84%──


```figure
mm-mrope-axes
```

## Kullan
`code/main.py`实现了:

- M-RoPE  konum hesaplamaları için 混合文本、画像パッチ 和ビデオフレーム の 梱包された配列を  M-RoPE 位置計算をします。
- Dinamik-FPS örneklemeci:给定 (durum, bütçe, hareket_ seviyesi), seç FPS 并输出 çerçeve zaman damgaları。
- Bir oyuncağı sürümü Qwen2.5VL JSON çıkış analizörü, kullanılır.

- Yap, sonra bir 5 dakika videoda sabit-FPS değiştirin dinamik-FPS, sensör farkı.

## - Söyle.
本课产 出 `outputs/skill-qwen-vl-pipeline-designer.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                    

## 练习
1. 計算 hidden 48(每条 band 16,base theta 10000)时,位于 (t=3, h=5, w=7) patch of M-RoPE 旋转──展示每条 band 中前三对的旋转角度──

2. Bir dakika 10 güvenlik kamera kayıtları, 1 FPS ile ne kadar üretilecek? 384 çözünürlükte ve 3x havuz altında, toplam token sayısı ne kadar?

3. 30 saniye için bir program yapın. 30 saniye için bir program yapın.

4. Qwen2.5 VL, Q-Former'i tamamen ortadan kaldırdı.

5. Üç Qwen2.5 VL JSON araç çağrısı  Python için çıkış çözümü  Diyetleri  Saçmalıklı JSON 会发生失败?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| M-RoPE | "Multimodal RoPE" | hidden dim 中带 temporal、height 和 width bands 的 3D rotary position embedding |
| Dynamic FPS | "Smart sampling" | 根据运动、时长和 Token 预算为每个视频选择的帧采样率 |
| Absolute time token | "Timestamp token" | 在序列中交错插入的 `<time>t</time>`，让模型看到实际秒数而不是帧索引 |
| Window attention | "Local attention" | 为提速而限制在小窗口内的 spatial self-attention；周期性加入 global attention |
| Structured agent output | "JSON mode" | 通过训练数据监督教 VLM 输出可解析 JSON，其中包含 coords 和 tool names |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的每请求控制项，用来约束总像素数，从而约束 Token 数 |
| Grounding | "Point-at-it" | 将 bounding-box 坐标作为文本 Token 输出；自 Qwen-VL v1 起使用 |

## 延伸阅读
- [Bai et al. — Qwen-VL (arXiv:2308.12966)](https://arxiv.org/abs/2308.12966)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Qwen Team — Qwen3-VL (arXiv:2511.21631)](https://arxiv.org/abs/2511.21631)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
