# Flamingo ve kullanılacak birkaç VLM'nin Kapalı Çaplak Dikkat

> DeepMind'in Flamingo'sı, diğerlerinden daha erken iki şeyi tamamladı. Tek bir modelin görüntü, video ve metin herhangi bir şekilde işleyebileceğini kanıtladı. VLM'lerin bağlamda yapılabileceğini de kanıtladı.

**Type:** Learn
**Languages:** Python (stdlib, gated cross-attention + Perceiver resampler demo)
**Prerequisites:** Phase 12 · 03 (BLIP-2 Q-Former)
**Time:** ~120 minutes

## Öğrenme hedefi
- 解释 gated cross-attention 如何通过 tanh(gate) = 0 在初始化时保留结 LLM 的文本能力──
- 逐步讲解 Anlamlayıcı resampler:N 个 görüntü yamaları → K 个固定latentqueries,经 横断关注 完成。
- Flamingo'yu tanımlayın  nasıl resim konumunun nedençi maskesini saymakla  işlem yapmak 交错的图像文序列──
- 复现 birkaç çekim Multimodal prompt 结构(3 个 image-caption Example, sonra bir sorgu görüntüsü) 』

## 问题
BLIP-2 32 görsel token ekleyecek LLM giriş katmanı 结 ︎ Her bir istek bir resim zaman çalışabilir. Ancak eğer içeri girmek istiyorsanız, örneğin  burada A resimi, bunun için yazılı oluşturmak; burada B resimi, bunun için yazılı oluşturmak; şimdi burada C resimi, bunun için yazılı oluşturmak                                                                                                                                                                                                                        

Flamingo'nun cevabı: LLM'nin giriş akışını tamamen değiştirme. mevcut LLM blokları arasında ekstra çapraz dikkat katmanları yerleştirilmelidir.

Flamingo 回答的第二个问题是:如何处理每个提示中可变数量的图像(0、1 或多张)?Perceiver resampler  一个小型跨注意模块,任意数量的补丁接收,并生成固定数量的视觉潜伏令牌──无论提示中有多少张图像,LLM跨注意层 看到的形状都相同──

## 概念
### Dondurulmuş LLM

Flamingo 结的Chinchilla 70B LLM 开始──全部 70B weights 保持不变──现有文本 自注意 和 FFN 正常运行──

### Algılayıcı resampler

对于 prompt 中的每张图像,ViT 会生成 N 个补丁符号──Perceiver resampler has K 个固定的可学习的潜伏(Flamingo 使用 K=64)──每个 resampler block has two two steps:

1. Çelişkili dikkat: K 个 latentler N 个 patch tokens'e kadar katılır.
2. Latents 内部的自我注意+FFN──

经过6 个复制模块 后,输出是 K=64 个 dim 1024 的视觉代币,无论 ViT 生成多少补丁──224x224 图像(196补丁) 和 480x480 图像(900补丁) 都会输出为64 个复制模块──

Video için, örnekleme Zamanına göre uygulaması: Her bir patch 64 个 latensi oluşur, ve zamanlı pozisyon kodlaması 让模型区分 t=0 和 t=N。

### Çaplaklı dikkat

M=4 ile birlikte yeni kapalı çapraz dikkat bloğunu içine soktu.

```
x_after_llm_block = llm_block(x_before)
cross = cross_attn(x_after, resampler_output)
gated = tanh(alpha) * cross + x_after
x_before_next_block = gated
```

- `alpha`Bu bir başlangıç olarak sıfır öğrenilebilir bir ölçekleme.
- `tanh(0) = 0`, bu yüzden başlangıçta kapalı dal 贡献为零──
- - Evet .`alpha`远离零,cross-attention 贡献会平滑增长──
- Kalıntılı bağlantı, kapı tamamen açık olsa bile, LLM'nin metnini kapsayacak anlamına gelmez; sadece görüntü bilgileri eklenir.

Bu Flamingo'nun en önemli tasarım seçeneği: görsel koşullandırma, katı  kapalı, ve başlangıçta ise 0 olarak kullanılır.

### Bağlı girişlerin maskeli çapraz dikkatini kullanıyor .

"<image A> caption A <image B> caption B <image C> ?" gibi bir istekte, her metin simgesi sadece önceki görüntülerin sırasındaki görüntüleri görmelidir.`t`Tekst işaretini sadece resim göstergesine katın `i < i_t`Fotoğraf resampler tokenleri, bunlardan `i_t`Yerinde`t`之前最近的图像──只看最近的前置图像或看到所有的前置图像都是有效选择; Flamingo 选择了前者──

### Konekst içi az çekimli öğrenme

Flamingo'nun acilliği şöyle görünüyor:

```
<image1> A photo of a cat. <image2> A photo of a dog. <image3> A photo of a
```

Model see补全模式并输出 "bird" (bird) (or image3) 显示的任何内容) ──没有 Gradient steps──结 LLM'nin bağlam içi öğrenme 能力通过门塞横断注意保留下来

### Eğitim verileri

Flamingo Üç tane eğitim kullanıyor:

1. MultiModal MassiveWeb (M3W) 43 milyon sayfa içerir.
2. Resim-Messim Çiftleri (ALIGN + LTIP):44 milyar对──
3. Video-Text Çiftleri (VTP): 27 milyon kısa video klipi

OBELICS(2023) is交错网页语料的开放复现,Idefics、Idefics2 和大多数开放的Flamingo-like模型都在其中训练──

### OpenFlamingo ve Otter

OpenFlamingo(2023) is open复现──Architecture 相同(Perceiver resampler + 结 LLaMA veya MPT 上的门横断注意)──Checkpoints 为 3B、4B、9B──由于基础LLM 更小且数据更少,质量落后于 Flamingo──

Otter(2023) OpenFlamingo'ya dayalı ve MIMIC-IT'de bir dizi multimodal talimat üzerinde talimat ayarlama yaparak kapalı çapraz dikkatini de gösterir.

### Soyları

- Idefics / Idefics2 / Idefics3: Hugging Face'ın kapalı çapraz dikkat soyluğu,逐步简化(Idefics2 放弃 resampler,改为使用带适应性聚合的直接补丁代币) ⋅
- Flamingo-Chameleon geçimi: 2024 yılına kadar, birçok ekip erken birleşmeye yöneldi.
- Gemini'nin birbirine karışmış girişleri: kavramda Flamingo'nun birbirine karışmış biçiminde 灵活性'yi miras aldılar, ancak bu mekanizma mülkiyet sahibi olarak kullanılmıştır.

### BLIP-2 ile karşılaştırma

| | BLIP-2 | Flamingo |
|---|---|---|
| Visual bridge | 输入处一次性使用 Q-Former | 每 M 层使用 gated cross-attention |
| Visual tokens | 每张图像 32 个 | 每张图像每个 cross-attn layer 64 个 |
| Frozen LLM | Yes | Yes |
| Few-shot in-context | 弱 | 强 — 论文的核心 |
| Interleaved inputs | 无原生支持 | Yes，设计目标 |
| Training data | 130M pairs | 1.3B pairs + 43M interleaved pages |
| Parameter count | 188M trained | ~10B trained (cross-attn layers) |
| Compute | 8 个 A100 上数天 | 数千个 TPUv4 上数周 |

预算有限的单图 VQA 选择 BLIP-2――需要交错输入、少数投或多图推理时选择 Flamingo/Idefics2――


```figure
cross-attention-fusion
```

## Kullan
`code/main.py`演示:

1. 36 sahte patch tokenleri kullanın. 8 öğrenilebilir latenti kullanın.
2. Bir kapalı çapraz dikkat adım, bunlardan biri.`alpha = 0`→ 输出等于输入(LLM 不变), sonra `alpha = 2.0`→ 混入视觉贡献──
3. Bir yapışkan maske yapımcısı,为 "(image 1) (text 1) (image 2) (text 2)" 序列生成 2D attention mask。

## - Söyle.
本课产 出 `outputs/skill-gated-bridge-diagnostic.md`△ VLM'nin açık bir yapılandırmasını belirlemiş olur. △ Resampler Y/N、cross-attn frekans、gate şema), Flamingo soy unsurlarını tanımlar ve dondurma stratejisini açıklar.

## 练习
1. 计算 Flamingo-9B'nin görsel parametreler sayısı:9B LLM + 1.4B kapalı çapraz dikkat katmanları + 64M resampler── eğitim parametreleri toplam parametrelerin oranını ne kadar kapsar?

2. PyTorch'te kapalı kalıntılar gerçekleştirilmektedir`y = tanh(alpha) * cross + x`❖ deney gösterimi ile`alpha=0`时,初始化处 `y==x`- Evet.

3. 阅读OpenFlamingo Bölüm 3.2(arXiv:2308.01390), her istek görüntü sayısı farklı olduğunda, nasıl bir parti içinde çok sayıda görüntü ile işlenmeleri gerektiğini öğrenmek için, doldurma stratejisini anlatmak için

4. Neden Flamingo'nun çapraz dikkat maskası, tüm önde konulan resimlerden ziyade en son* önde konulan görüntüye katılımını sağlıyor?

5. Konekst içi birkaç çekim: Yeni bir Flamingo varianti için 4 个image içeren bir yapılandırma → Ana nesnenin renk  örneklerin süresi── tanımlama  0 ila 8  değişken örnek sayısında, beklenen doğruluk örneği  nasıl değişir──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Perceiver resampler | "Fixed-latent cross-attention" | 从可变数量的 input patches 中生成 K 个固定 tokens 的 module |
| Gated cross-attention | "Tanh-gated bridge" | residual layer `y = tanh(alpha)*cross + x`，learnable alpha，初始化为 0 |
| Interleaved input | "Mixed sequence" | 图像和文本按阅读顺序自由混合的 prompt format |
| Frozen LLM | "No LLM gradients" | 文本 LLM 的 weights 不更新；只训练 resampler + cross-attn layers |
| Few-shot | "In-context examples" | 在 prompt 中给出少量（image, answer）对；模型无需 finetuning 即可泛化 |
| OBELICS | "Interleaved web corpus" | 包含 141M 个网页的开放数据集，图像和文本按阅读顺序排列 |
| Chinchilla | "70B frozen base" | Flamingo 的冻结文本 LLM，来自 DeepMind 的 Chinchilla paper |
| Gate schedule | "How alpha moves" | 训练期间 cross-attention gate 打开的速率 |
| Cross-attn frequency | "Every M layers" | 插入 gated cross-attention block 的频率；Flamingo 使用 M=4 |
| OpenFlamingo | "Open reproduction" | MosaicML/LAION 的 3-9B 开放 checkpoint；architecture 与 Flamingo 相同 |

## 延伸阅读
- [Alayrac et al. — Flamingo (arXiv:2204.14198)](https://arxiv.org/abs/2204.14198) 原始论文──
- [Awadalla et al. — OpenFlamingo (arXiv:2308.01390)](https://arxiv.org/abs/2308.01390) 开放复现──
- [Laurençon et al. — OBELICS (arXiv:2306.16527)](https://arxiv.org/abs/2306.16527) 交错网页语料──
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) 通用 Perceiver mimarisi。
- [Li et al. — Otter (arXiv:2305.03726)](https://arxiv.org/abs/2305.03726) 经过指示调调的 Flamingo 后续模型──
- [Laurençon et al. — Idefics2 (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)Flamingo yaklaşımının modern basitleştirilmesi
