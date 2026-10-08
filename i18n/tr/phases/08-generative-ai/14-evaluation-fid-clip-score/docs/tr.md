# 评估  FID、CLIP Score、 insan tercihleri

> Her üretilen model sıralaması FID ‒ CLIP puanlarını ve insan tercihleri yarış alanından gelen kazanım oranlarını alıntılar. Her sayı, araştırmacıların kullanması gereken bir başarısızlık modeli vardır. Bu başarısızlık modelleri anlamıyorsanız, gerçek gelişmeleri ve başarısızlıkları ayırt edemezsiniz.

**类型:**Yapım
**语言:**Python
**先修:**8 · 01 aşaması (Taksonomya), 2 · 04 aşaması (Önemlendirme Metrikleri)
**时间:**- 45 dakika.

## 问题

Doğuş modelleri genellikle * örnek kalitesi* ve * şartlı takip* ile değerlendirilir. Bu iki model de kapalı ölçü yoktur. Modeliniz 10.000 张 resimden oluşmalıdır; onlara bir şey ayırmalı; ayrıca bu rakamların model ailesinin 跨分辨率、跨架构成立ı üzerinde olduğuna inanmalısınız.

- **FID (Fréchet Inception Distance)。**Başlangıç ağının özellikleri alanında, gerçek dağılım ve üretim dağılımları arasındaki mesafe.
- **CLIP score。**生成图像的 CLIP-image Embedding与快速的 CLIP-text Embedding 之间的共性相似性──越高越好──衡量快速 遵循度──
- **人类偏好。**Bu iki modelin doğru bir kararla karşı karşıya gelmesini sağlayan, insanları yaratmak için daha iyi bir model seçmek için bir araya gelmesini sağlayan bir süredir.

Siz de göreceksiniz: IS(başlangıç puanı, temel olarak geri çekilmiştir) 、KID、CMMD、ImageReward、PickScore、HPSv2、MJHQ-30k── her biri bir önceki göstergeyi bir kusur noktasını düzeltmiştir──

## 概念

![FID, CLIP, and preference: three axes, different failure modes](../assets/evaluation.svg)

### FID  样本质量

Heusel et al. (2017)。步骤:

1. N 张真像和 N 张生成图像提取 Başlangıç-v3 özellikleri (2048-D) ⋅
2. Gaussian: hesaplama ortalaması`μ_r, μ_g`Ve eş değişkenlik`Σ_r, Σ_g`- Evet.
3. FID = `||μ_r - μ_g||² + Tr(Σ_r + Σ_g - 2 · (Σ_r · Σ_g)^0.5)`- Evet.

Açıklama: Özellik uzayda iki çok değişken Gaussian  arasındaki Fréchet mesafe。越低 = 分布越相似。

失效模式:
- **小 N 时有偏。**FID ise özellik dağılımına karşı ortalama kare 計算,小 N 会低估共差, give give false of low FID──始终使用 N ≥ 10,000──
- **依赖 Inception。**Başlangıç-v3 訓練于 ImageNet──遠離 ImageNet'in alanı(人脸、艺术、文字图像) anlamsız bir FID── kullanmak için belirli alan özellikleri ekstraktör oluşturur──
- **刷分。**过拟 启动前可在没有视觉质量提升的情况下得到低FID──CMMD见下文) 对抗它──

### CLIP puanı  prompt 遵循度

Radford et al. (2021) ・・・ için 張生成图像 + prompt:

```
clip_score = cos_sim( CLIP_image(x_gen), CLIP_text(prompt) )
```

30k 张生成图像取平均 → 得到一个可以在模型中比较的标量──

失效模式:
- **CLIP 自身的盲点。**CLIP 组合推理较弱("mavi bir kürede kırmızı bir küp" 经常失败) ・・・模型可以在 CLIP skor上排名很好,但并没有真正遵循复杂提示──
- **短 prompt 偏差。**短 prompt 在野外有更多 CLIP-image 匹配──长 prompt 的 CLIP skor 会机械性降低──
- **prompt 刷分。**"Yüksek Kalite, 4K, Şöhret" İçin Ekle, Yüksek CLIP Notu Geçecek, Ama Resimleri Değiştirmeyecek.

CMMD (Jayasumana et al., 2024) 修复了其中一些问题:Clip özelliklerini kullanmak yerine Başlangıç, maksimum ortalama ayrılığı kullanmak yerine Fréchet değil.

### İnsanların tercihleri

选择一组 prompt──用模型 A 和模型 B 生成──把成对结果展示给人类 (或强 LLM) ──将胜负聚合成 Elo 或 Bradley-Terry skor──Benchmark:

- **PartiPrompts (Google)**:1,600 个多样化 prompt,12 个类别──
- **HPSv2**:107k 个人类标注, geniş çapta otomatik temsilci olarak kullanılır.
- **ImageReward**- MİT lisanslı.
- **PickScore**: Pick-a-Pic 2.6M tercihlerine dayalı 訓練。
- **Chatbot-Arena-style image arenas**- ...https://imagearena.ai/Ve diğer platformlar.

失效模式:
- **judge 方差。**Bilimsel ve uzman olmayanların tercihleri farklıdır.
- **prompt 分布。**精挑细选的快速会偏向某一家──始终记录清楚──
- **LLM-judge reward hacking。**GPT-4 yargıçı, "Yalancı, ama yanlış bir şekilde"

## 组合使用

生产级 değerlendirme raporu 应包含:

1. 10-30 bin 个样本上,针对 held-out 实际分布计算 FID (样本质量) ⋅
2. Bu örnekler aynı grupta ve hemen yukarı hesaplama CLIP puanı / CMMD
3. Öte yandan, bu modelin ötesinde de görülen bir sonuç olarak, bu oranı hesaplamak için bir önde gelen olarak kullanılır.
4. 失效模式分析:随机抽取 50 输出,标记已知问题 (): 失效模式分析:随机抽取 50 输出,标记已知问题 (): 失效模式分析:随机抽取 50 输出,标记已知问题)

任何单一指标都是谎言──三个相互印证的指标 + 定性评论 才是主张──


```figure
gx-fid-distributions
```

## 动手构建

`code/main.py`Yapılandırılmış "söz vektörleri" üzerinde FID 类 CLIP-score 和 Elo 聚合 (,) biz 4D vektörü kullanıyoruz başlangıç özelliklerinin bir alternatifi olarak)

- Küçük N 和大 N 上'nın FID 計算,也就是偏差──
- 池 arasındaki kozine benzerliği "CLIP skor" olarak belirlenecektir.
- Sintef preference akışının Elo güncelleme kuralından.

### 步骤 1: FID'yi gerçekleştirmek

```python
def fid(real_features, gen_features):
    mu_r, cov_r = mean_and_cov(real_features)
    mu_g, cov_g = mean_and_cov(gen_features)
    mean_diff = sum((a - b) ** 2 for a, b in zip(mu_r, mu_g))
    trace_term = trace(cov_r) + trace(cov_g) - 2 * sqrt_cov_product(cov_r, cov_g)
    return mean_diff + trace_term
```

### 步骤 2: CLIP 风格'ın kozine benzerliği

```python
def clip_like(image_feat, text_feat):
    dot = sum(a * b for a, b in zip(image_feat, text_feat))
    norm = math.sqrt(dot_self(image_feat) * dot_self(text_feat))
    return dot / max(norm, 1e-8)
```

### 步骤 3: Elo 聚合

```python
def elo_update(r_a, r_b, winner, k=32):
    expected_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
    actual_a = 1.0 if winner == "a" else 0.0
    r_a_new = r_a + k * (actual_a - expected_a)
    r_b_new = r_b - k * (actual_a - expected_a)
    return r_a_new, r_b_new
```

## 常见陷

- **N=1000 时的 FID。**Aşağıda, bu başlangıç güvenilir değildir.
- **跨分辨率比较 FID。**Başlangıç'ın 299×299 boyutları değişecek Özellik dağılımı.
- **只报告一个 seed。**En azından 3 tane tohum çalıştır.
- **通过 negative prompts 抬高 CLIP score。**Bazı boru hattı, CLIP'i yükseltmek için uyarlanmış bir uyarı ile geçecek.
- **prompt 重叠导致 Elo 偏差。**Eğer iki model eğitim sırasında bir referans süreti görmüşse, bu hiç anlamsız olur.
- **人类 eval 的付费众包偏斜。**Prolific、MTurk 标注者偏年轻 / 技术友好──与招募的艺术/设计专家混合使用──

## Kullan

2026 yılı üretim değerlendirme protokolü:

| 支柱 | 最低要求 | 推荐 |
|--------|---------|-------------|
| 样本质量 | 10k 上相对 held-out real 计算 FID | + 5k 上 CMMD + 按类别子集计算 FID |
| prompt 遵循度 | 30k 上计算 CLIP score | + HPSv2 + ImageReward + VQA-style question answering |
| 偏好 | 200 个相对 baseline 的盲测成对样本 | + 2000 paired human + LLM-judge + Chatbot Arena |
| 失效分析 | 50 个手动标记 | 500 个手动标记 + automated safety classifier |

Dört sütun = 主张──任何单独一个 = 营销──

## 交付

保存 `outputs/skill-eval-report.md`◊Deneyimli olmak yeni model kontrol noktasını + temel çizgiyi almak, ve tam bir değerlendirme planı: sample quantity, indicator, fail-effect model, test-core standardı üretmek.

## 练习

1. **Easy.**运行  İşlem`code/main.py`◊ Aynı yapım dağılımında N=100 ile N=1000 时 FID ◊ rapor etkisel farkı boyutu
2. **Medium.**合成 CLIP tarz özelliklerine dayanan  CMMD 公式见 Jayasumana et al., 2024) △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                                        
3. **Hard.**复现 HPSv2 设置: From Pick-a-Pic's一个子集中取 1000 个图像-prompt 双,基于偏好细调 一个小型 CLIP-based scorer,并测量它与持久的集合的一致性──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| FID | "Fréchet Inception Distance" | 对真实与生成 Inception features 拟合 Gaussian 后的 Fréchet distance。 |
| CLIP score | "Text-image similarity" | CLIP image 与 text Embeddings 之间的 cosine similarity。 |
| CMMD | "FID's replacement" | CLIP-feature MMD；偏差更小，无 Gaussian assumption。 |
| IS | "Inception score" | Exp KL(p(y|x) || p(y))；在现代模型上相关性差，已退役。 |
| HPSv2 / ImageReward / PickScore | "Learned preference proxies" | 在人类偏好上训练的小模型；用作自动 judge。 |
| Elo | "Chess rating" | 成对胜负的 Bradley-Terry 聚合。 |
| PartiPrompts | "The benchmark prompt set" | Google 策划的 1,600 个 prompt，覆盖 12 个类别。 |
| FD-DINO | "Self-sup replacement" | 使用 DINOv2 features 的 FD；更适合 ImageNet 之外的领域。 |

## 生产注记: değerlendirme de sonucu çıkarma iş yükü

10k örnek üzerinde çalıştırılan FID, 10k 张图像的生成意味着──单张 L4 上 10242 için 50 adım SDXL tabanı için, bu yaklaşık 11 saatlik tek talep sonucu olarak görülür──评估预算 is real exist, and this framework is offline-inference 场景(maksimum üretimi, TTFT'yi göz ardı eder):

- **尽力 batch，忘掉 latency。**Offline eval = 80GB H100 上用 `num_images_per_prompt=8`调用 `pipe(...).images`Duvar saati tek bir talepte daha hızlı 4-6×
- **缓存真实 features。**Gerçek referans集执行的 Inception (FID) veya CLIP (CLIP-score, CMMD) özelliği çıkarımı için sadece运行*一次*,并存储为`.npz`❖ Her değerlendirmeyi yeniden hesaplama.

对于CI / regression gates:每个PR 在 500-样子 子集上运行 FID + CLIP skor(~30 dakika); 每晚运行完整 10k FID + HPSv2 + Elo。

## 延伸阅读

- [Heusel et al. (2017). GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (FID)](https://arxiv.org/abs/1706.08500) FID 论文。
- [Jayasumana et al. (2024). Rethinking FID: Towards a Better Evaluation Metric for Image Generation (CMMD)](https://arxiv.org/abs/2401.09603) CMMD。
- [Radford et al. (2021). Learning Transferable Visual Models from Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020)- Klip.
- [Wu et al. (2023). HPSv2: A Comprehensive Human Preference Score](https://arxiv.org/abs/2306.09341) HPSv2。
- [Xu et al. (2023). ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation](https://arxiv.org/abs/2304.05977) ImageReward。
- [Yu et al. (2023). Scaling Autoregressive Models for Content-Rich Text-to-Image Generation (Parti + PartiPrompts)](https://arxiv.org/abs/2206.10789)PartiPrompts。
- [Stein et al. (2023). Exposing flaws of generative model evaluation metrics](https://arxiv.org/abs/2306.04675) Başarısız mod anketleri
