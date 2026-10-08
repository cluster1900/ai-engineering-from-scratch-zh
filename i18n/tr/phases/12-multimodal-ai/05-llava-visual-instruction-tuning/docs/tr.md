# LLaVA ve Görsel Eğitim Düzenlemesi

> LLaVA(2023 yıl 4 月) dünyanın en çok kopyalanmış çok yönlü yapılandırmasıdır. BLIP-2'nin Q-Former'ini 2 katlı MLP ile değiştirdi, basit bir Token bağlaması ile Flamingo'nun kapalı çapraz dikkatini değiştirdi ve 158k 条 görsel talimatlı eğitim dönüşü yaptı. Bu veriler GPT-4 tarafından saf metin başlıklarından üretildi. VLM'yi 2023 ile 2026 yılları arasında inşa eden herhangi bir uygulayıcı, herhangi bir LLaVA 变体ü oluşturdu. LLaVA-1.5  herhangi bir çözünürlükte katıldı. LLaVA-NeXT  çözünürlüğünü yükseltti. LVA-One Vision bir tarifle 统一化了图片多图片.

**类型：**Yapım
**语言：**Python(stdlib、projector + talimat şablon yapıcı)
**先修：**12 aşama · 02(CLIP),11 aşama
**时间：**~ 180 dakika

## Öğrenme hedefi

- 2 katmanlı bir MLP projeksiyonu inşa edin, ViT patch Embedding (Dim 1024)映射到 LLM'nın Embedding dim (Dim 4096) 』
- 走通 LLaVA iki aşamalı tarif:(1) 558k başlık çiftlerinde üstü projector düzeni yap,(2) 158k GPT-4 üretilen dönüşlerde üstü görsel talimat ayarlama yap.
- LLaVA biçimindeki bir prompt oluşturun, görüntü içerir Token placeholder、system prompt 和 user/assistant turns。
- 解释为什么社区从Q-Former 转向MLP,尽管Q-Former 在代币预算上有优势──

## 问题

BLIP-2'nin Q-Former(Desin 12.03) Bir 张图像を 32  tokenに圧縮させます──干净、高效、ベンチマーク 表现好──しかし, iki sorunu vardır──

İlk olarak, Q-Former'ın eğitimli olması, ama kaybı son görev değil.

İkinci, Q-Former 188M paramlara sahip, LLaVA'nın 2023 yılındaki ölçeğinde ise, onu hedef LLM ile birleştirmek zorundasın. Birleştirmek zorundasın.

LLaVA'nın yanıtları basitten utanç vericiye kadar: Get ViT'in 576 Patch Token, let each Token 通过一个2层 MLP(`1024 → 4096 → 4096`), sonra tüm 576 个都塞入 LLM'nin giriş sırasına yerleştirir.

LLaVA'nın ikinci açısı gör: GPT-4 kullanmakla sadece metin) talimat verileri oluşturmak.

Sonuç: Bir 8 张 A100 上运行一天、 MMMU 上击败 Flamingo、并发布社区扩展的开放检查点的 VLM── 2023 yılının sonuna kadar, 50+ çatal üretmiştir──

## 概念

### Yapılandırma

13B'de LLaVA-1.5:
- Görüş kodlayıcı:CLIP ViT-L/14 @ 336(sınıf 1 结,sınıf 2 可选解)
- Projector:带 GELU aktivasyonu'nun 2 katlı MLP,`1024 → 4096 → 4096`- Evet.
- LLM:Vicuna-13B (Lamma-3.1-8B)

图像 + 文本 prompt 的 ileri geçiş:

```
img -> ViT -> 576 patches of dim 1024
patches -> MLP -> 576 tokens of dim 4096
prompt: system + "<image>" placeholder + user question
replace <image> token with the 576 projected tokens
feed the full sequence to the LLM
decode response
```

图像占用LLM context 中的 576 个 Token──在 2048 context 下,文本还剩1472 个 Token──在 32k context 下,这只是一个舍进误差──

### 1. aşama: Projector ayarlama

结 ViT──结 LLM──只训练 2-layer MLP──Dataset:558k resim-başlık çiftleri(LAION-CC-SBU)──Loss:在投影图像代号条件下,对字幕做语言建模──

Ebatch 128 trenning single epoch,几小时就能完成──projector 学会把ViT-space 映射到LLM-space──没有任务特定监督──

### 2. aşama: Görsel talimatların ayarlanması

解 projektor(仍然可训练) ――解 LLM(通常全量,有时使用LoRA) ・・・在158k görsel-öğretim dönüşlerinde 上训──

talimat verileri ise önemli teknikler, Liu et al.
1. Çekilmiş bir resim.
2. 提取文本描述(5 条 İnsan başlıkları + sınırlama kutusu listesi)。
3. Üç tane şablon kullanın. GPT-4'e gönderin.
   - Konuşma: 生成一段用户和助手 周围图片来回交流的对话──
   - 详细描述:Şekil hakkında zengin ve ayrıntılı bir açıklama yapın.
   - 复杂推理:  bir soru sormak için bir görüntüye göre bir soru sormak gerekir, sonra cevaplamak için 
4. GPT-4'ün output解析为:

Tüm süreç doğrudan görüntü ile temas etmiyor. Sadece metinle temas etmiyor. GPT-4'ün halüsinasyonları var.

### Neden topluluk bu programı kopyaladı ?

- 没有调调调的阶段-1-specific losses──全程使用 LM kaybı──
- Projector 訓練 日计ではなく 小時计で, gün计で
- Sadece yeniden eğitilen projektorla LLM'yi değiştirebiliriz.
- Görsel talimat verileri boru hattı GPT-4 kullanır ve yeni alanlarda yeniden üretilme maliyeti çok düşüktür.

### LLaVA-1.5 ile LLaVA- NEXT

LLaVA-1.5(2023 年 10 月)加入:
- Akademik görev verilerini (VQA、OKVQA、RefCOCO)
- Daha iyi bir sistem süresi.
- 2048 → 32k bağlamı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

LLaVA-NeXT(2024 yıl 1 月)加入:
- AnyRes: Get yüksek çözünürlüklü görüntü 2x2 veya 1x3 网格 336x336 ürünlere, yeniden küresel düşük çözünürlüklü küçük bir resim ekle. Her ürün 576 Token haline gelir.
- Daha iyi talimat verileri karışımı kullanın.
- Daha güçlü bir temel LLM'dir.

### LLaVA-OneVision

Ders 12.08 会深入讲 OneVision──简短版: Aynı bir projektorla, ama bir kurikulumla 训练,在一个模型中覆盖单图片、多图片 和视频,并共享视觉标志预算──

### Q-Former ile karşılaştır

| | Q-Former（BLIP-2） | MLP（LLaVA） |
|---|---|---|
| 每张图像的 visual Token | 32 | 576（base）或 2880（AnyRes） |
| 可训练参数 | 188M + LM | 40M + LM |
| Stage 1 loss | ITC+ITM+ITG | 仅 LM |
| LLM drop-in | 需要重新训练 | 最小重新训练即可替换 |
| Multi-image | 别扭 | 自然（concat） |
| Video | 别扭 | 自然（per-frame concat） |
| Token budget | 小 | 大 |

MLP 赢在简单性和 Token 灵活性──Q-Eski 赢在 Token bütçesinde──2023 yılının sonuna kadar, Token bütçesi 已不再是约束瓶(LLM bağlamları 增长到32k-128k+),简单性占上风──

### Hızlı biçim

```
A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions. USER: <image> Describe this image in detail. ASSISTANT: The image shows ...
```

`<image>`Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. Token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token. token.

### 参数经济性

LLaVA-1.5-7B 分解:
- CLIP ViT-L/14 @ 336:303M(sınıf 1 结,sınıf 2 通常解)
- Projector ((2x doğrusal): ~ 22M 可训练──
- Llama-7B:7B
- 总计:7.3B parametreleri。sasta 2 期间可训练:完整 7B + 22M projektor。

Etap 2'nin eğitim maliyeti: 8xA100'e kadar 20 saat. Bu önemli bir rakamdır.


```figure
mm-llava-projector
```

## Kullan

`code/main.py`实现:

1. 純 Python 中的 2 kat MLP projekörü(toy scale 下 dim 16 → 32 → 32)。
2. Hızlı inşaat boru hattı: sistem hızlı + 用 N 个 projelendirilmiş Token 替换 `<image>`+ kullanıcı dönüşü + yardımcı jenerasyon yer tutucuları。
3. Bir vizüalizatör, LLM bağlamında 576 token görsel bloğu göstermek için kullanılır.

## - Söyle.

本课产 出 `outputs/skill-llava-vibes-eval.md` LLaVA-aile kontrol noktası belirlenir, 10 hızlı vibes-evallü bir süit çalışır.  3 altyazma  3 VQA  2 akıl yürütme  2 reddetme), ve bir insan okuyabilir puan kartı rapor eder.

## 练习

1. 计算 `1024 → 4096 → 4096`2 katlı MLP projeksiyonunun eğitimli parametrelerinin sayımı                                                                                                                                                                                                                                                        

2. Bir Refusal  Case Bu istekleri neden sıfır atmalı Bu istekleri reddetmeli? Bu istekleri neden reddetmeli?

3. LLaVA-NeXT blogunun AnyRes  kısmını okuyun.

4. LLaVA aşama-1 projektor kullanın başlıkları 上的 LM kaybı 训练──如果跳过阶段1,直接进入阶段2(视觉指示调整),会发生什么?引用Prismatic VLMs ablation(arXiv:2402.07865)作答──

5. LLaVA-Instruct-150k GPT-4 ve COCO başlıkları kullanılarak 生成 talimatları── yeni bir alan için(tıp X-ışını、satelit görüntüleri), etki alanı talimatlarının dört adımlı veri borusunu oluşturmayı tanımlamak── her adımla ne tür bir sorun ortaya çıkabilir?

## 关键术语

| 术语 | 人们的说法 | 它实际上的含义 |
|------|----------------|------------------------|
| Projector | “MLP bridge” | 带 GELU 的 2-layer MLP，将 ViT dim 映射到 LLM dim |
| Image Token | “<image> placeholder” | Prompt marker，在 inference 前被 N 个 projected visual Token 替换 |
| Visual instruction tuning | “LLaVA stage 2” | 在 GPT-4-generated（image, instruction, response）triplets 上训练 |
| Stage 1 alignment | “Projector pretraining” | 冻结 ViT 和 LLM，用 captions 上的 LM loss 训练 projector |
| AnyRes | “Multi-crop tiling” | 将高分辨率图像切分为 tile grid，并拼接每个 tile 的 visual Token |
| LLaVA-Instruct | “GPT-4-generated” | 从 COCO captions + GPT-4 合成的 158k instruction-response pairs |
| Vision encoder freeze | “Backbone locked” | CLIP weights 在 stage 1 不更新，有时在 stage 2 也不更新 |
| ShareGPT4V | “Better captions” | 由 GPT-4V 生成的 1M dense captions，用于更高质量 alignment |
| VQA | “Visual question answering” | 回答关于图像的自由形式问题的任务 |
| Prismatic VLMs | “Design-space paper” | Karamcheti 2024 ablation，系统测试 projector 和 data choices |

## 延伸阅读

- [Liu et al. — Visual Instruction Tuning (arXiv:2304.08485)](https://arxiv.org/abs/2304.08485) LLaVA 论文。
- [Liu et al. — Improved Baselines with Visual Instruction Tuning (arXiv:2310.03744)](https://arxiv.org/abs/2310.03744) LLaVA-1.5。
- [Chen et al. — ShareGPT4V (arXiv:2311.12793)](https://arxiv.org/abs/2311.12793) yoğun başlıklar 数据集。
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865) tasarım alanı ablations。
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326) 统一的单图、多图、视频──
