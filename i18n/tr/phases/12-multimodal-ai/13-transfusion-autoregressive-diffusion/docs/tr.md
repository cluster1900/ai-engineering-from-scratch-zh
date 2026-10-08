# Transfüzyon: в одной Transformer 中结合 Autoregressive Text + Diffusion Image

> Chameleon 和 Emu3 把全部筹码押在离散 Token 上──它们能工作,但量化瓶很明显:图像质量会在低于连续空间扩散 模型的位置进入平台期.Transfusion(Meta,Zhou et al.,2024年 8月) 押了相反的方向:保持图像连续,完全消除VQ-VAE,并用两个损失 训练一个变压器──文本 Token 使用下一个变压器──图像补丁 使用流量匹配 /扩散损失──两个目标优化相同权重──稳定扩散 3层架构MMDiT) 读一读一读一读一读一读一读一读一读一读一读一读一读 转变点,构建一个玩具双损失训练师,跟踪一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读二读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读一读

**Type:** Build
**Languages:** Python（stdlib，MNIST-scale 玩具双 loss trainer）
**Prerequisites:** Phase 12 · 11（Chameleon），Phase 8（Generative AI）
**Time:** ~180 minutes

## Öğrenme hedefi
- 连接一个在同一脊椎上运行两个损失的变压器(文本 Token 上的 NTP,图像补丁 上的扩散 MSE) ⋅
- 解释为什么图像补丁 之间使用双向注意,同时文本标志使用因果注意,是正确的面具 选择──
- Hesaba, kalite ve kod karmaşıklığı ile Transfusion tarzı (sırıntılı görüntü, yayılma kaybı) ve Chameleon tarzı (sırıntılı görüntü, NTP) karşılaştırıldığında.
- MMDiT'nin katkılarını anlatın: Her blok modalite-specifik ağırlıklar kullanın, geri kalan akış üzerinde ortak dikkat uygulayın.

## 问题
离散图像Token与连续图像Token的争论比LLM更早──连续表示(raw pixel、VAE latents)保留细节──离散图像Token(VQ index)适配变压器的原生词表,但会在量化步骤丢失细节──

Chameleon / Emu3 选择了离散路线:一个损失,一个构架,但图像保真度受 Tokenizer 质量限制──

Diffusion modeli bir dizi yol seçti: Resim kalitesi çok güçlü, ancak LLM ile ayrı bir model, gürültü düzenleme mühendisliği karmaşık ve metin üretimiyle temiz bir entegrasyon biçimi yoktur.

Transfüzyon  sorusu: Can can can duels兼得? image连续, halen bir modeli eğitmek, ve iki kaybı 合进一次梯次步

## 概念
### 双损失架构

Bir dekoderle oluşan transformatör 处理包含以下内容的序列:

- 文本 Token ((离散, BPE sözcükten)
- 图像补丁(连续,16x16 piksel blokları, doğrusal yerleştirme yoluyla 投影到隐藏模糊,与ViT encoder的输入相同) ⋅
- `<image>`和 `</image>`标签, 标记连续补丁 所在位置──

Önceki geçit sadece bir kez geçer. Kaybetmek her bir simge için geçer.

- Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri Çeviri Çeviri: Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çev Çeviri Çeviri Çeviri Çeviri Çeviri Çeviri Çev Çev Çev Çev Çev Çev Çev Çev Çev Çev Çev Çev Çev Çev Çev Ç Çev Çev Çev Çev Çev Ç Ç Ç Ç Çev Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç
- Görüntü yamacı: ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒     ⇒ ⇒    ⇒       ⇒                                                                                                                                                                                                                                   

Gradient 会流经共享的变压器体――2 kaybı 同时改进共享权重――

### Dikkat maskası:kötü metin + iki yönlü görüntü

文本 Token 必須是因果的;不能让文本 Token attend 到未来文本,否则老师强迫会被破坏──但图像补丁表示同一个快照;它们应该在同一个图像块内相互双向地出席──

maske:

```
M[i, j] = 1 if:
  (i is text and j is text and j <= i)   # causal for text
  OR (i is image and j is image and same_image_block(i, j))   # bidirectional within image
  OR (i is text and j is image and j < i_image_end)   # text attends to previous images
  OR (i is image and j is text and j < i_image_start)   # image attends to preceding text
```

Bu, blok üçgenli maske olarak gerçekleştirilen bir eğitim ve düşünce.

### Transformer 内部 内部 difüzyon kaybı

Diffusion loss is standard form: Give image patch 加噪声,让模型预测噪声(或等价地预测 clean patch) ――Transfusion'ın versiyonu:

訓練期間:
1. Her resim yama x0 için, t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t t
2. 采样噪声 ε,计算 xt = (1-t) * x0 + t * ε(akış eşleşimi 的线性插值)
3. Transformer 预测 v_theta(xt, t); kaybı = MSE(v_theta(xt, t), ε - x0)。
4. Aynı dizide metin NTP kaybı ile bir Backprop¬¬

推理时,生成流程是:
- 文本 Token: standart autoregressive sampling。
- 图像补丁:以此前文本 Token 为条件的扩散采样循环(通常10-30 adım) ⋅

### MMDiT:Stayed Diffusion 3'in değişimi

Stable Diffusion 3 ((Esser et al.,2024 yıl 3 月) ile Transfusion 接近的时间发布了MMDiT(Multimodal Diffusion Transformer) ⋅ Bu iki yapı ise同宗分支──

MMDiT'in anahtar farkları:

- Her blok modalite-specifik ağırlıkları kullanmaktadır. Her transformatör bloğu metin tokeni ve resim yamaları için ayrı ayrı bağımsız Q、K、V 和 MLP 权重── dikkat ortak                                                                                                                                                                                                                                        
- DDPM'den daha basit bir şekilde, doğrulamalı akış eğitimi, 变体,采样方式明确,数学上比DDPM更简单――
- △MMDiT SD3'ün omurgasıdır(2B 和 8B 参数变体) ・Transfusion 论文扩展到7B。

两者汇聚到同一个核心思想: bir dönüştürücü, metin çalışmasına NTP,连续图像表示运行扩散――

### Neden kameleon tarzında kazanmış?

连续扩散与离散NTP在图像生成上的质量差是可测量的──Transfusion 论文报告:

- 7B'de, FID'in büyüklüğü aynı.
- Tokenizer: resim kodlayıcı daha basit(lineer projeksiyon gizli, ViT'nin giriş katmanı ile aynı)
- 图像补丁 去噪音可以并行化推理,不像自行退缩图像代币──

缺点:Transfusion is double loss 模型, training动态更难――减肥 需要调参――NTP ve difusion 之间的时间不一致可能导致某头占主导――

### Aşağıdaki bölüm

Janus-Pro(Lection 12.15) tarafından çözülür  Anlamak ve üretilen görme kodlayıcıyı geliştirmek için Transfusion'ın fikrini geliştirmek için: biri SigLIP kullanır, diğeri VQ kullanır, aynı zamanda transformatör vücudu paylaşır.

2026 yılında Gemini 3 Pro, GPT-5 gibi üretim sınıfı VLM'lerin görüntü üretimi yolu, Claude Opus 4.7 gibi görüntü üretimi yolu, neredeyse kesinlikle bu ailenin bir sonraki nesli kullanmıştır.


```figure
cfg-guidance-scale
```

## Kullan
`code/main.py`Küçük bir MNIST gibi bir sorunun üzerine oyuncaklar inşa et Transfusion:

- 文本 caption is deskripse numaralar ((0-9) 短整数序列──
- Resim 4×4'dir.
- Birlikte paylaşılan ağırlıklı lineer projeksyonlar 充当变压器 替代;文本上使用NTP kaybı, gürültülü yamalar 上使用MSE kaybı。
- İki kayıpla karşılaştırıldığında, dikkat maskası çok açık.
- Bir kez ileri geçiş içinde oluşan bir metin başlığı ve 4x4  görüntü

Bu transformatör oyuncak sınıfı. İki kayıp tesisatcılık, dikkat maskası, inşaat ve düşünce döngüsü gerçek ürünler.

## - Söyle.
本课产 出 `outputs/skill-two-loss-trainer-designer.md`△ Yeni bir Multimodal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

## 练习
1. Bir Transfüzyon tarzı 模型訓練时含 70% 文本 Token 和 30% 图像补丁──图像拡散損失の数量級は文本 NTP kaybının 10x程度── hangi kaybı ağırlıkları onları dengeleyebilir?

2. Bu süreç blok üçgenli maskeyi gerçekleştirmek için:`[T, T, <image>, P, P, P, P, </image>, T]`❖ Her bir hedef 0 veya 1 olacaktır.

3. MMDiT'nin modalite özel QKV 权重── Transfusion'un tam paylaşımlı transformatörüne kıyasla, bu, 7B 参数 ölçeğinde satışın ne kadar artmasına neden olur?

4. Özet: bir metin istekini belirle, model önce NTP çalıştırır 50 Token oluşturur, sonra karşılaşır `<image>`, 256 patch üzerinde çalışarak 20 denosiyon adımları yayılması için toplam kaç kez ileri geçiş gerekir?

5. 阅读 SD3论文 Bölüm 3── düzeltilmiş akışın tanımlanması ve neden DDPM'den daha az önerme adımları kullanıldığından elde edilebilmektedir.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Two-loss training | "NTP + diffusion" | 一个 transformer 在同一个 gradient step 中，同时优化文本 Token 上的 cross-entropy 和连续图像 patch 上的 MSE |
| Flow matching | "Rectified flow" | 一种 diffusion 变体，预测从噪声到 clean data 的 velocity field；数学上比 DDPM 更简单 |
| MMDiT | "Multimodal DiT" | Stable Diffusion 3 的架构：joint attention、modality-specific MLPs 和 norms |
| Block-triangular mask | "Causal text + bidirectional image" | 一种 attention mask：跨文本是 causal 的，但在图像区域内是 bidirectional 的 |
| Continuous image representation | "No VQ" | 图像 patch 作为实值 Vector，而不是整数 codebook indices |
| Velocity prediction | "v-parameterization" | 网络输出是噪声与数据之间的 velocity field，而不是噪声本身 |

## 延伸阅读
- [Zhou et al. — Transfusion (arXiv:2408.11039)](https://arxiv.org/abs/2408.11039)
- [Esser et al. — Stable Diffusion 3 / MMDiT (arXiv:2403.03206)](https://arxiv.org/abs/2403.03206)
- [Peebles & Xie — DiT (arXiv:2212.09748)](https://arxiv.org/abs/2212.09748)
- [Zhao et al. — MonoFormer (arXiv:2409.16280)](https://arxiv.org/abs/2409.16280)
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
