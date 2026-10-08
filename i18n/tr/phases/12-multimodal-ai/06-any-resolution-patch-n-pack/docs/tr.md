# 任意分辨率 Görüş: Patch-n'-Pack 和 NaFlex

> Gerçek görüntü 224x224'ün kare şekli değildir. Satır 9:16, tablo 16:9, tıbbi tarama 4096x4096, telefon kesimi 9:19.5 ⋅ 2024 yılından önceki VLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

**Type:** Build
**Languages:** Python (stdlib, patch packer + block-diagonal mask)
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 12 · 05 (LLaVA)
**Time:** ~120 minutes

## Öğrenme hedefi
- Bir dizi değişken çözünürlüklü görüntüdeki yamaları bir diziye bağlayarak blok-diyagonal dikkat maskası oluşturur.
- 针对给定任务,在 AnyRes tiling (LLaVA-NeXT) 、NaFlex (SigLIP 2) 及 M-RoPE (Qwen2-VL) 之间做选择──
- Ölçüm değişmeyen durumlarda, OCR, tablo ve fotoğraf için belirti bütçelerini hesaplayın.
- Çekirde boyutlandırmanın üç başarısızlık modunu anlatın: Çıkartılmış metin, kesilmiş içerik, üst ücreti belirtiler.

## 问题
Transformers  needs a sequence── a batch is one over length of the same sequences── if your image is 224x224, each time you get 196  patch Token, no need padding, task accomplished── use 224  training, use 224 inference, no need to think again 分辨率──

现实不配合──文档是版(8.5x11 英寸,约 2:3)──图表截图是横版(16:9)──收据又高又窄(1:3)──医学影像通常是2048x2048或更大──移动设备截图是1170x2532(0.46:1)──

2024'e kadar üç seçim ve neden hepsi başarısız olacak:

1. Sıfır düz şekillere doğru ölçmek için: [224x224 veya 336x336) ◊ Sıfırlama: Çelişki:
2. Yemek to fixed aspect ratio──You will lose most of the image content, and choose crop position is itself a vision 问题──
3. Pad'ın en uzun kenarına kadar. Bu durumlar çözülmüştür. Ama %50'den fazla resim için, tüm bu tokenler ikinci kez dikkat çekilmiştir.

2024-2025 yıllarındaki cevap: Transformer'ın 吃下图像原生分辨率的补丁,并弄清楚如何将异构批 打包成一序列,同时避免浪费计算――

## 概念
### NaViT ve patch-n'-pack

NaViT(Dehghani et al., 2023) bu yöntemin büyüklüğüne ulaşılabileceğini kanıtlıyor.

1. Satır içindeki her resim, seçilen yama boyutuna göre (örneğin 14) hesaplayın.
2. Her resimdeki yamaları düzeltmek için kendi değişen boyut dizisi oluşturmak.
3. Tüm resimlerin yamaları bir seri seriyle bağlanacak.
4. Blok-diyagonal dikkat maskası oluşturun, A'nın çubuklarını sadece A'nın içindeki resimlere verin
5. 携带每个补丁的位置信息(2D RoPE veya kırımlı konum yerleşimleri)。

Üç张图像组成的批量:336x336(576 Token)、224x224(256 Token) 和 448x336(768 Token),将成一个1600-Token序列,配一个1600x1600的块-diagonal面具──无填──无浪费计算──变压器可处理任意的面比──

NaViT ayrıca eğitim sırasında bölümsel yama düşüşünü  tüm partide % 50'lik yamalar  bu da düzenlenebilir,                                                                                                                                                                                                                                              

### AnyRes (LLaVA-NeXT)

LLaVA-NeXT'in AnyRes ise gerçek bir alternatif çözümdür.

1. Önceden tanımlanmış bir koleksiyon içinde bir çizgi düzenini seçin (1x1) (1x2) (2x1) (1x3) (3x1) (2x2)                                                                                                                                                                                                                                     
2. Tüm resimleri şebekeye kesip, her küpü 336x336 biçiminde bir yapıya dönüştürürüz.
3. Aynı zamanda bir küçük resim oluşturmak:整张图像大小化到336x336,作为全球文本代币──
4. Buzlu 336 kodlayıcılara gönderilecek.

对于一张 672x672 图像,使用2x2 grid加缩影:4 * 576 + 576 = 2880 个视觉代币――昂贵但有效LLM 同时看局部细节和全局上下文――

Kodlamanız dondurulduğunda ve sadece bir çözünürlük desteklediğinde,AnyRes ilk seçim yoludur. Bu, bir tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane

### M-RoPE (Qwen2-VL)

Qwen2-VL, Multimodal Rotary Position Embedding'i başlattı. NaViT'in kısayol konumlarından veya AnyRes'in plit-ve-thumbnail'inden farklı olarak, her yama bir 3 boyutlu konum taşıyor.

M-RoPE 原生 提供动态分辨率,无需重新训练――Inference 时输入任意 HxW 图像,patch embedder 生成 H/14 x W/14 个代币,每个代币 获得自己的 (t=0, r=row, c=col) 位置,RoPE 用正确频率旋转注意,完成──Qwen2.5-VL 和 Qwen3-VL 延续了这一点──InternVL3 的 V2PE 是相同的思路,只是按方式使用可编码──

Not Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not: Not

### NaFlex (SigLIP 2)

NaFlex, SigLIP 2 kontrol noktasının yerli-flex 模式──单个模型在推理中 支持多种序列长度──256、729、1024 Token)──内部在训练期间使用NaViT tarzında patch-n'-pack,并为每个 patch 使用绝对分数位置──卖点是:一个检查点,按任务在推理中 选择 Token budget──

语义任务(sınıflandırma、çıkış) 256 Token。OCR veya图表理解1024 Token。无需重新训练。

### - Paket maskası .

Blok diyagonal maskesi en çok kolaylıkla başarılan bir yer.`N_total`Çıkışlı bir dizi, kapsamlı bir resim`i=0..B-1`, kendi uzunlukları için`n_i`, şekli `(N_total, N_total)`Maskeyi`M`İki gösterge içinde aynı resim blokları 时为 1,否则为 0.

```
offsets = [0, n_0, n_0+n_1, ..., N_total]
M[i, j] = 1 iff there exists b where offsets[b] <= i < offsets[b+1] and offsets[b] <= j < offsets[b+1]
```

PyTorch'te, bu kullanılabilir.`torch.block_diag`veya görünüşe göre toplamak 一行实现── FlashAttention'ın değişken uzunluklu yolu`cu_seqlens`) tamamen maske üzerinden atlamak, doğrudan kumülatîf uzunluk tenzor kullanarak 序列 内部 attend için tipik parti, 快约10x 密集 maske

### Token bütçeleri

按任务选择策略:

- OCR / belgeler:1024-4096 Token。SigLIP 2 NaFlex 1024, veya AnyRes 3x3 + miniatür。
- Çarşemalar ve UI:384-448 原生分辨率下 729-1024 Token。使用带max pixel cap 的 Qwen2.5VL dinamik çözünürlüğü。
- Doğal fotoğraflar: 256-576 Token 就夠了──下游 LLM 能看到足够信息──把 Token 花在内容密度高的地方──
- Video: Uzay birleşimi 后每 64-128 Token,2-8 FPS──Dene 12.17 会讲这个──

2026 yılının üretim kuralları: seçin bir görev başına maksimum piksel kapısı, orijinal yaşam boyut oranına göre 编码到该帽,打包批量,并跳过填充──Qwen2.5VL 暴露了`min_pixels`和 `max_pixels`Bu dönüm için kullanılıyor.


```figure
mm-patch-n-pack
```

## Kullan
`code/main.py`Bir dizi farklı görüntü için, tam sayısal görüntüler için bir paket oluşturmak için,

- 接收一个 (H, W) 图像尺寸列表──
- Patch boyutuna göre 14  hesaplama per张图像的补丁序列长度──
- Onları bir boyutla birleştirir.`sum(n_i)`- Evet.
- 构建块-diagonal dikkat maskası(为了清晰起见,使用densse)
- Paketlenmiş maliyetle, kare boyutlu ve herhangi bir resme karşılaştırın.
- Bir karşıl parti için: (Kitab, tablo, ekran görüntüsü, fotoğraf)

运行它──输出数字, her 2026 yılının açık VLM'lerinin neden patch-n'-pack kullandığını açıklıyor──

## - Söyle.
本课生成 `outputs/skill-resolution-budget-planner.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                       

## 练习
1. Bir patç boyutu = 600x1500 ((1:2.5);; 14 时, ne kadar yerel çözünürlüklü bir token? 336 后 size kadar?

2. Bu dört resim içeren bir parti için blok-diyagonal maskeler oluşturmak, uzunlukları 256,576,729,1024 olarak ayrılır.`256^2 + 576^2 + 729^2 + 1024^2`个非零条目──

3. Bir张 1792x896 图像,patch 14,比较:(a) kare boyutları 336 后编码,(b) AnyRes 2x1 + miniatür,(c) M-RoPE native──哪种使用最少 Token?哪种保留最多细节?

4. 实现 fractional patch dropping: given determination a packed sequence, uniformly at random 丢弃 50% 的 Token,并相应更新块-diagonal mask──测量 mask 的稀有性 变化──

5. 阅读 Qwen2-VL 论文(arXiv:2409.12191)'ın 3.2 bölümü`min_pixels`和 `max_pixels`Kontrol nedir ve neden iki sınır önemli?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Patch-n'-pack | "NaViT-style packing" | 将来自不同图像的可变长度 patch sequences concatenate 到一个 batch dimension 中 |
| Block-diagonal mask | "Packing mask" | Attention mask，将每张图像的 patches 限制为只 attend 自己，而不是 pack 中的相邻图像 |
| AnyRes | "LLaVA-NeXT tiling" | 将高分辨率图像切成固定大小 tiles 的 grid，并加一个全局 thumbnail；用固定 encoder 编码每个 tile |
| NaFlex | "SigLIP 2 native-flex" | 单个 SigLIP 2 checkpoint，可在 inference 时服务 256/729/1024-Token budgets，无需重新训练 |
| M-RoPE | "Multimodal RoPE" | 3D rotary position encoding（time、row、column），无需 position tables 即可处理任意 H、W、T |
| cu_seqlens | "FlashAttention packing" | FlashAttention varlen path 使用的 cumulative-length tensor，用来替代 dense block-diagonal mask |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的 per-request knobs，用于限制非常小或非常大输入上的 Token count |
| Visual token budget | "How many tokens per image" | 每张图像发出的 patch Token 粗略数量；决定 LLM 的 prompt budget 和 Attention cost |

## 延伸阅读
- [Dehghani et al. — Patch n' Pack: NaViT (arXiv:2307.06304)](https://arxiv.org/abs/2307.06304)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Laurençon et al. — What matters when building vision-language models? (Idefics2, arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
