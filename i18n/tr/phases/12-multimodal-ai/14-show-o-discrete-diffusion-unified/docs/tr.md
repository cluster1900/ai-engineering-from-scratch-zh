# Gösterme ve Diskret-Difusion 统一模型

> Transfusion 混合连续和离散表示──Show-o(Xie et al., 2024 年 8 月)走的是另一条路:text tokens 使用因果性下代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代

**Type:** Learn
**Languages:** Python (stdlib, masked-discrete-diffusion sampler)
**Prerequisites:** Phase 12 · 13 (Transfusion)
**Time:** ~120 minutes

## Öğrenme hedefi
- 解释 masked discrete diffusion:一种先均 mask Tokens、再让 Transformer 恢复它们的时间表──
-                                                                                                                                                                                                                                                               
- Gösterme-o bir kontrol noktasında işleme üç sınıfı görev: T2I, VQA, resim boyaması
- 选择一种掩盖时间表 ((kosine、线性、 troncated),并推理它对样品质的影响──

## 问题
Transfüzyon iki kaybı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

Gösterme-o'nun cevabı: iki tür modaliteyi tutmak, bir camelon gibi ayrılmış durumda, ancak maskeli ayrı yayılım yoluyla görüntüler üretir ve sırayla üretmek yerine eğitim hedefi tek bir maskeli belirti-bunuş haline gelir, doğal olarak bir sonraki belirti-bunuşuna dönüşür.

## 概念
### Maskeli diskre difüzyona (MaskGIT)

Origini Chang et al. (2022) 技巧 MaskGIT çok güzel.`<MASK>`id) ―― en az iki adım içinde, tüm maskeli simgelerden birbiriyle tahmin yaparak, sonra en üstteki K 个置信度最高的预测'i saklayarak, diğer kısmını yeniden maskedecektir.

訓練很簡單: [0, 1] arası ortalama 采采样一个掩盖比例,将其应用到图像的VQ代币上,训练变压器 恢复被掩盖的部分──这是BERT对文字做的事情,只是扩展到图像生成──

### Bir Transformer, hibrit maske.

MaskGIT 放进因果语言模型变压器──注意面具 如下:

- Metin işaretleri:causal (standard LLM)
- Resim simgeler: 在 görüntü blok 内 tamamen iki yönlü((Bu şekilde maskeli simgeler 在预测时可以看到所有其他图像 Tokens) 』
- Metin-ya-resim: metin önceki görüntülere katılır, görüntü önceki metine katılır.

訓練在以下任務之间交换:
1. metin 序列deki standart NTP。
2. T2I 样本:text → image, use masked image tokens 和 masked-token-prediction Loss。
3. VQA 样本:image → text, maskeli metin işaretlerini kullanmak

统一 Kayıp `<MASK>`Token 上的交叉透,它同时覆盖文本NTP(只有最后一个 Token被masked) 和图像被masked-diffusion (随机子集被masked) ──

### Dönüşteki örnekleme

Show-o yaklaşık 16 步骤生成一张图像,而不是大约 1000 步 (Her Token autoregressive) 或大约 20 步 (Diffusion) ⋅ 在每一步中,并行预测所有蒙蔽 Tokens;提交 top-K 高置信度 Tokens;重复──

Karşılaştırma:
- Chameleon / Emu3(对 Tokens autoregressive):N_tokens 次 前行,通常每张图 1024-4096 次。
- Transfüzyon: 20 adım, her adım bir kez tam Transformer geçiyor.
- Gösterme-o(maskeli ayrı yayılma): yaklaşık 16 步, her adım bir kez tam Transformer geçiş。

Yakın ölçekli modellerde, Show-o daha hızlıdır; büyük ölçüde Transfusion'un adım sayısına uyum sağlarken, her adım maliyeti daha düşüktür.

### Tek kontrol noktasındaki görevler

Show-o 推理时支持四类任务,由快速格式 选择:

- Metin oluşturma: standart autoregressive metin çıkışı
- VQA:resim içeri, mesaj dışarı
- T2I:Mask edilmiş ayrı yayılma yoluyla metin içeri girer 输出 image。
- Boyanma:输入带有部分 Masked Tokens 的图像,并填充──

Renkleme 能力来自 masked-prediction 训练,几乎是免费的──mask VQ-token grid 的一个区域,输入其余部分加一个文本提示,预测 masked Tokens──

### Maskeleme programı

Her adım maskeyi açın 多少 Tokens 的时间表 会塑造质量──Show-o 推 cosine:

```
mask_ratio(t) = cos(pi * t / (2 * T))   # t = 0..T
```

第 0 步, tüm Tokens maskeli yerleştirilmiştir(1.0 oranı) ・第 T 步, hiç Tokens maskeli yerleştirilmiştir。Cosine, en fazla bilgi miktarını öngördüğü orta bölge oranlarında ağırlık yoğunlaştıracak。Hızlı grafikler de kullanılabilir, ancak daha hızlı platoya girer。

### Gösterme

Show-o2(2025 takip, arXiv 2506.15564) genişletildi Show-o: daha büyük LLM tabanı, daha iyi Tokenizer, yenileme maske programı, yapı modeli aynı,

### Show-o oturduğu yerde

2026 taksonomisi İçinde:

- Diskret tokenler + NTP:Chameleon、Emu3──简单但推理慢──
- Diskret tokenler + maskeli yayılma:Show-o、MaskGIT、LlamaGen、Muse。并行采样,但仍受 Tokenizer lossy 限制──
- Sürekli + Diffusion:Transfusion、MMDiT、DiT──质量最高,训练更复杂──
- Sürekli + akış bir VLM:JanusFlow、InternVL-U──最新路线──

按任务选择:当你想在一个开放模型中同时获得T2I + inpainting + VQA,并且速度合理时,选择 Show-o;当质量最重要且你能承担两损管道


```figure
masked-diffusion-unmask
```

## Kullan
`code/main.py`模拟 Gösterme örneği:

- 16 VQ tokeni içeren bir oyuncak çubuğu.
- Bir sahte Transformer, bu prompt üzerinde dayanıyor 和当前 预测 logits
- Cüzdan programı kullanmak 8 adım yaparak maskeli örnekleme yapmak
- 打印中间状态 (mask pattern evolution)

- Nasıl yapılır? - Evet.

## - Söyle.
本课产 出 `outputs/skill-unified-gen-model-picker.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                            

## 练习
1. Maskeli ayrı yayılma 16 adım içinde tamamlanmaktadır. Neden 1 adım değil? Eğer 0 adımda maskeli tüm içeriği açarsanız, ne sorun çıkacaktır?

2. Maskeli yayımlama kullanımı, boyanma 几乎是免费的──提出一个产品用例(真实或假设),其中 Show-o'nun boyanması 胜过专业模型──

3. Cosine şablonu vs çizgi şablonu: takip T=8 时 her adım açığa çıkmış Tokens'ın sayısı── hangi daha dengeli?

4. Bir张 512x512'in Gösterme görüntüsi 1024 Token. K=16384 时,模型输出 1024 * log2(16384) = 14,336 bit (約1.75 KiB) DATA──Stable Diffusion 输出 512*512*24 bit = 6,291,456 bit (約768 KiB) 料像素──圧縮比是多少?

5. LlamaGen'in sınıf koşullu autoregressive görüntü modeli ile Show-o'nun maskeli yaklaşımından ne farkı var?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Masked discrete diffusion | “MaskGIT-style” | 训练模型预测 masked Tokens；推理时，迭代式 unmask 置信度最高的预测 |
| Cosine schedule | “Unmask schedule” | mask ratio 随推理步数衰减；将置信度增长集中在中间区间 |
| Parallel decoding | “All tokens at once” | 每一步用一次 forward pass 预测完整的 masked Token 序列，然后提交 top-K |
| Hybrid attention | “Causal + bidirectional” | 一种 mask：对 text tokens 是 causal，在 image blocks 内是 bidirectional |
| Inpainting | “Fill-in generation” | 以部分 Tokens 被 masked 的 image 为条件，预测缺失部分；从训练目标中免费获得 |
| Commitment rate | “Top-K per step” | 每次迭代中有多少 Tokens 被声明为“完成”；控制推理与质量的 trade-off |

## 延伸阅读
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
- [Show-o2 (arXiv:2506.15564)](https://arxiv.org/abs/2506.15564)
- [Chang et al. — MaskGIT (arXiv:2202.04200)](https://arxiv.org/abs/2202.04200)
- [Sun et al. — LlamaGen (arXiv:2406.06525)](https://arxiv.org/abs/2406.06525)
- [Chang et al. — Muse (arXiv:2301.00704)](https://arxiv.org/abs/2301.00704)
