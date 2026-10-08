# Emu3: Görüntü ve video üretimi için kullanılır Sonraki Token Tahmin

> BAAI'nın Emu3(Wang et al.,2024 yılının 9 月) is 2024 yılın sonucu olarak yayınla sonlandırmalı 之争的结果──一个单一的Llama-style decoder-only Transformer,只在下一个代币预测目标上训练,覆盖文 + VQ图像代币 + 3D VQ video代币的统一词汇,在图像生成上击败SDXL,在感知上击败LLaVA-1.6──没有CLIP损失──无类型免费指导在推理时用于提高质量,但核心训练目标是带教师强迫下代币预测──发表在本文中.

**Type:** Learn
**语言：**Python(stdlib,3D video tokenizer matematik + autoregressive sampleler iskelet)
**Prerequisites:** Phase 12 · 11（Chameleon）
**Time:** ~120 分钟

## Öğrenme hedefi
- 解释为什么Emu3'in single-loss next-token 目标能够奏效,尽管长期以来人们一直假设图像质量需要 Diffusion――
- 描述 3D video tokenizer:spaceotemporal VQ codebook 是什么样子,为什么补丁 会跨越时间──
- Emu3 ile Stable Diffusion XL'yi kıyasla, eğitim hesaplamalarında, maliyet ve kalite sınırlarındaki farkı tahmin etmektedir.
- Konuşmak için aynı Emu3 modelini oynamak için üç rol oynamak:Emu3-Gen:

## 问题
截至 2024 年代的传统观点是:图像生成需要 Diffusion──其论点是: discrete image tokens 会丢失太多信息,无法重建细节,而 autoregressive sampling 会在数千 token上累积差──稳定 Diffusion、DALL-E 3、Imagen、Midjourney 都使用某种形式的 Diffusion──Chameleon(Desin 12.11) küçük ölçekte kısmen bu noktayı karşıladı, ancak kalitede SDXLyi takip etmedi.

Emu3 正面挑战了这个论点──它的主张是:更好的视觉Tokenizer + 足够的规模 + 下一个代码损失 = 在同一个也能做感知模型中,实现击败 Diffusion的图像生成──

Yayınlanınca çok tartışmalı oldu. İki yıl sonra, açık kaynaklı birleşik nesil ailesi (Emu3, Show-o, Janus-Pro, Transfusion) çalışma standart bir yol haline geldi.

## 概念
### Emu3 Tokenizer

关键成分是视觉Tokenizer──Emu3 训练一个定制IBQ-类Tokenizer(Inverse Bottleneck Quantizer,SBER-MoVQGAN ailesi),每个代币做8×8分辨率-减小──一张512x512 图像会变成64x64 = 4096代币,代码簿大小为32768──

Bu, Kameleon'da K=8192 时时的512x512'in 1024 tokeni daha büyük, ancak her Token daha ucuz(Çocu kod defteri aramaları, daha basit kodek)  Anahtar gösterge: PSNR'yi yeniden inşa etmek için 30.5 dB, Stable Diffusion ile 32 dB sürekli gizli alanı 竞争──

对于视频:3D VQ Tokenizer bir uzay-zaman yama olacak(4x4x4 piksel) kodlama için bir bütün sayı için.

Tokenizer 質量就是上限──Emu3'ün katkısı bir kısmı çok iyi bir Tokenizer eğitimi aldığımızda.

### Tek Kayıp Eğitim

Emu3 kullanın bir hedef: metin jetonları, 2D görüntü jetonları ve 3D video jetonları ortak sözlükleri 上做下台令预测──訓練期間中会根据 Modality-specific factors 乘以权重来平衡贡献,但损失函数是相同──

訓練データ混合 aşağıdakileri içerir:
- Resim gen:`<text caption> <image> image_tokens </image>`
- Resim algısı:`<image> image_tokens </image> <question> text_tokens`
- Video Gen:`<text caption> <video> video_tokens </video>`
- Video algısı: similar。
- Tekrar metin: standart NTP。

Model, verilerin dağılımından öğrenir, nasıl görüntü belirtilerini çıkarır, nasıl metin belirtilerini çıkarır.`<image>`标签后预测 Resim simgelerı。

### Sınıflandırıcısız rehberlik 和 sıcaklık

Autoregressive 图像生成在推理时使用分类器免 guide(CFG) 会好很多──Emu3 使用它:生成两次,一次使用完整标题,一次使用空标题,然后使用指导权重 混合 logits(典型值 3.0-7.0)──这是 Diffusion 使用的同一个CFG 技巧,借用到了autoregressive 设置中──

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

### Üç rol, bir model.

Emu3 üç farklı API'yi yayınlıyor, ama alt kat ağırlıklar bir kitle:

- Emu3-Gen──图像生成──输入文本,输出图像代码──
- Emu3-Chat──VQA 和 captioning──输入图像(tokens),输出文字──
- Emu3-Stage2──videosu oluşturmak ve video VQA──输入文字或视频,输出文字或视频──

Task-specific heads yok. Sadece farklı prompt şablonları.

### Önyargılar

Emu3 kağıdından ((2024年 9月):

- 图像生成:在 MJHQ-30K FID(5.4 vs 5.6)、GenEval genel olarak(0.54 vs 0.55,统计上打平)
- 图像感知: 在 VQAv2(75.1 vs 72.4) 上超过LLaVA-1.6, 在 MMMU 上大致持平──
- 视频生成:4-second-clip 质量在 FVD 上与 Sora-era Public benchmarked models 具备竞争力──

Bu rakamlar her zaman kazanmak değil, burada çok fazla bir dakika, orada az bir dakika, ama bir sonraki belirti tahmin etmek için ihtiyacınız olan tek şey bu.

### Hesaplama maliyeti

Emu3 7B-parametr modeli kullanır, yaklaşık 300 milyar Multimodal token 上 тренинг。GPU saatleri 大致相当 Llama-2-7B öncesi eğitim(A100 sınıfı silikon 上 2k-4k GPU-years)。Stable Diffusion 3 Bu şekilde Diffusion modeller 訓練予算 benzer, ama bağımsız metin kodlayıcıları ve daha karmaşık borular gerekir。

推理时,Emu3 张图像比 SDXL 慢:4096 image tokens,以 30 tok/s 计算,大约每张 512x512 图像 2 分钟,而 SDXL 为 2-5 秒──Spekülatör çözme 和 KV-cache optimization 会缩小差距,但无法消除差距──Autoregressive image gen 计算量很大;这是目前的固定取舍──

### Neden önemli?

Emu3'ün derin katkıları kavramsaldır. Eğer bir sonraki belirti tahmininin, görüntü üretimi üzerinde uyumlu bir Değişiklik haline gelmesi mümkünse, o zaman tekerlekli model yolları (bir Kayıp, bir omurgan, herhangi bir modalitede) kullanılabilir.

Show-o、Janus-Pro 和 InternVL-U bu teorinin üzerinde kurulmuştur veya bu konuda meydan okudu. 2025 yılına kadar, Çin Laboratuarı (BAAI、DeepSeek) bu yönde yayın yapmakta ABD Laboratuarı'ndan daha aktif olacaktır.


```figure
l5-emu3-next-token
```

## Kullan
`code/main.py`İki oyuncak parça inşa et:

- Bir 2D vs 3D VQ Tokenizer 数量計算器:给定: 解析度, 补丁, 剪辑_长度, FPS), hesaplama
- Bir birimsiz sınıflandırıcı ve sıcaklıklı bir autoregressive image-token sampleler

CFG 实现与Emu3 配方一致,即指导重量 混合条件和无条件逻辑──

## - Söyle.
本课产 出 `outputs/skill-token-gen-cost-analyzer.md`△ bir üretim ürün düzenini belirler, △ bir görüntü veya video △ bir hedef çözünürlük △ bir kalite seviyesi △ bir gecikme bütçesi △ bir token sayısını hesaplar ve Emu3 ailesinin ve Diffusion △ arasındaki seçim yaparlar.

## 练习
1. Emu3 in 8x8 Reduction 下, her张 512x512 图像产生 4096 tokens──计算 1024x1024 和 2048x2048 的等价数──推理延迟会发生什么?

2. Emu3 Bölümü 3.3 İçinde Video Tokenizer'in içeriği hakkında. 3D VQ yama şeklini ve neden 8x8x1 değil 4x4x4 olduğunu açıklıyor.

3. Sınıflandırıcısız rehberlik ağırlığı 5.0 vs 3.0: Görsel etki ne değişikliği var? Takip `code/main.py`Orta matematik süreci:

4. 計算 Emu3-7B 在 300B jetonları 下的训练 FLOPs,并与稳定扩散3比较──哪个训练成本更高?

5. Emu3 FID'de SDXL'den üstündür, ancak VQAv2'de uzmanlaşmış VLM'lerde değil.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Next-token prediction | "NTP" | 标准 autoregressive loss：给定 token[0..i] 预测 token[i+1]；tokenized 后适用于每种 modality |
| IBQ tokenizer | "Inverse bottleneck quantizer" | 一类 VQ-VAE，codebooks 更大（32768+），重建效果优于 Chameleon 的 Tokenizer |
| 3D VQ | "Spatiotemporal quantizer" | 由（time、row、col）索引的 codebook；一个 Token 覆盖一个 4x4x4 pixel cube |
| Classifier-free guidance | "CFG" | 用 weight gamma 混合 conditional 和 unconditional logits；在推理时提升图像质量 |
| Unified vocabulary | "Shared tokens" | Text + image + video 都来自同一个 integer space；模型预测接下来出现的任何 modality |
| MJHQ-30K | "Image gen benchmark" | 含 30k prompts 的 Midjourney-quality benchmark；Emu3 在这里报告 FID |

## 延伸阅读
- [Wang et al. — Emu3: Next-Token Prediction is All You Need (arXiv:2409.18869)](https://arxiv.org/abs/2409.18869)
- [Sun et al. — Emu: Generative Pretraining in Multimodality (arXiv:2307.05222)](https://arxiv.org/abs/2307.05222)
- [Liu et al. — LWM (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Yu et al. — MAGVIT-v2 (arXiv:2310.05737)](https://arxiv.org/abs/2310.05737)
- [Tian et al. — VAR (arXiv:2404.02905)](https://arxiv.org/abs/2404.02905)
