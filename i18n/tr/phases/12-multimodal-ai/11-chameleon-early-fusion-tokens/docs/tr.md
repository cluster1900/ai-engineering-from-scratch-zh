# Chameleon ve Erken Füzyon Token-Only Multimodal Modeller

> Şimdiye kadar gördüğümüz her VLM'de görüntü ve metin ayrı olarak işlenmiştir. Görsel Token'ler görsel kodlayıcıdan, projecöre akıyor, sonra LLM'de metin ile karşılaşmaktadır. Görsel kelime biçimi ve metin kelime biçimi birbirine takılmadan ortaya çıkar.

**类型：**Yapım
**语言：**Python(stdlib, VQ-VAE tokenizer + birbirine karışmış dekodör)
**先修：**12 · 05 aşaması, 8 aşaması (Generatif AI)
**时间：**180 dakika kadar .

## Öğrenme hedefi

- 解释为什么共享词汇+单损 会改变模型能力──
- VQ-VAE nasıl bir görüntüyi Tokenize eder, Transformer ile birlikte bir sonraki belirtilen hedef 兼容的离散序列──
- Çameleon'un eğitim ve sabitlik tekniklerini anlatın:
- Şameleon ile BLIP-2'nin Q-Former  yöntemi karşılaştırın, ve kendi uygunluklarını açıklayın.

## 问题

基于适配器的VLM(LLaVA、BLIP-2、Qwen-VL) 把文本和图像当作两种不同的东西──文本代码 经过`embed(text_token)`Çizgilik`visual_encoder(image) → projector → ... pseudo_tokens`❖ Modelin iki giriş yolu vardır ve orta yolu da birlikte geçmektedir.

Üç sonuç:

1. LLM sadece resim tüketir, resim çıkaramaz.
2. 混合模态文档 (örneğin) 很别扭: 么在模型外部解析 多模态输入, 么串联多次生成──
3. 分布不匹配──视觉 Token 和文本  gizli alanın farklı bölgelerinde bulunan bir simge, küçük bir uyum sorunu yaratacaktır──

Chameleon  reddetmek bu öneri: görüntü sadece ortak sözcüklerin ayrılması Token 序列──用交错文档训练模型,一个损失、一个自动退缩解码器,就能直接获得混合模态生成能力──

## 概念

### VQ-VAE 作为图像Tokenizer

Bu Tokenizer bir vektörlü kuantitasyonlu variasyonel otokoder.

- Kodlayıcı:CNN + ViT, görüntüleri uzay özellikleri haritası olarak görüntüleyecek, örneğin 32x32 个 dim 为 256 个特征――
- K 个 Vector 的词表(Chameleon 使用 8192), aynı şekilde dim 为 256。
- Kvantisa: L2 mesafesinden her bir alan özelliğine en yakın kod defteri girişini bul.
- Çözücü: CNN, kvantlaştırılmış özellikleri 转回像素──

訓練:VAE yeniden yapılandırma kaybı + bağlılık kaybı + kod defteri kaybı。Kod defteri endeksleri 构成图像的离散字母──

Şemâleon için: 張圖像变成32*32 = 1024 个 Token, 来源大小为8192 的词表──与文本 Token( 来源 LLM 的 BPE 词表,例如 32000)拼接──最终词表:40192──Transformer 看到的是一个序列、一个损失──

### 共享词表

Chameleon'un kelime şablonı metin Token、图像 Token 和模态分隔符── her bir token'ın tek bir ID'si vardır──输入 Embedding layer把每个 ID 映射到 D-dim hidden Vector──输出投影把 hidden 映射回语音 logits──Softmax 下选择一个 Token,不管它属于什么模态──

Bölünme çok önemli:`<image>`和 `</image>`标签包住图像 代号序列──生成时,如果模型输出 `<image>`, aşağıdaki 1024'in belirtileri , VQ indekslerini görüntüleme için dekodere gönderilmesi gerektiğini biliyor .

### 混合模态生成

İnference is in共享词表上的下一个代号预测──例提示:"Bir kedi çiz ve tanımla".

```
<image> 4821 1029 2891 ... (1024 image tokens) </image>
The cat is orange, sitting on a windowsill...
```

模型自主选择序:它可能先生成图像再生成文本,先生成文本再生成图像,或交错生成── aynı dekodör, aynı kaybı──

Buna karşılık, adapter VLM'nin üretimi sadece metinle sınırlıydı.

### 训练稳定性:QK-Norm ‧ dropout、LayerNorm sipariş

Erken füzyon eğitimi büyük ölçekte dengesizdir.

- QK-Norma──在 Atenção 内部, query 和 key projection 先应用 LayerNorm,再做点 product──防止深层网络中的逻辑大小爆炸──多个2024年后的大模型都使用它──
- Dropout yerleştirme.                                                                                                                                                                                                                                                            
- LayerNorm düzenleme── Geri kalan dalı 上 Pre-LN kullanmak(standard pratik), yeniden son blok atlamak bağlantısı 上额外加一 LN──稳定最后一层的渐进流──

Bu teknikler olmadan, 34B-param Kameleon birçok kontrol noktasında eğitim aldı. Bu teknikler sayesinde, eğitim alınır.

### Tokenizer'in yeniden inşa edilmesi

VQ-VAE                                                                                                                                                                                                                                                             

Tokenizer = bir şişe. Daha iyi Tokenizer: MAGVIT-v2、IBQ、SBER-MoVQGAN) yüksek bir sınırda olacak.

### Kameleon vs BLIP-2 / LLaVA

Chameleon (( erken birleşme,共享词表):
- Bir kaybı, bir dekodör.
- 生成混合模态输出──
- Tokenizer ise kaliteye sınırlı.
- 成本高:inference path 上每张生成图像都需要VQ-VAE decoder──

BLIP-2 / LLaVA ((son bir birleşim, separ separator towers):
- Görüntü içeriği, sadece metni dışarı çıkarabilir.
- 复用 önceden eğitimli LLM。
- Anlamak için bir tokenize yok.
- 便宜:单次 ileri geçiş

按任务选择── Eğer resim üretimi gerekiyorsa, Chameleon ailesini seçin── eğer sadece anlamak istiyorsan, adapter-VLM daha basit, ve daha fazla önceden eğitilmiş hesaplama kullanın──

### Fuyu ve AnyGPT

Fuyu(Adept,2023) bir ilgili yöntemdir: tamamen tek başına görme kodlayıcısını atlayın, orijinal görüntü yamalarını 像 Token 一样送入 LLM'nin giriş projesi, Tokenizer kullanmayın.

AnyGPT(Zhan et al., 2024) Çameleon'u dört modola yaydı:文本、图像、语音、音乐──每种模态都使用相同的VQ-VAE 技巧,共享 Transformer──Any-to-any generation──Lesson 12.16 中会进一步介绍──


```figure
vq-codebook
```

## Kullan

`code/main.py`Oyuncak sonundan sonuna erken bir birleşim modeli oluşturun:

- Bir çok küçük VQ-VAE biçimindeki kuantitör, 8x8 yamalarını kod defteri indekslerine yerleştirir.
- Bir 个共享词表,由(text ids 0..31) +(image ids 32..47) +(separator 48, 49)组成。
- Bir oyuncak autoregressive decoder (özel grafik tablosu), sintetizasyon altyazısı + resim-töken dizi içinde 上訓練。
- Bir örnekleme döngüsü, 后输出交换的文本 + 图像 Token──

Transformer'ın büyüklüğünü fark etmesi için, sinyal akışını baştan sona takip edebilirsin.

## - Söyle.

本课产 出 `outputs/skill-tokenizer-vs-adapter-picker.md`◊ belirli ürün özellikleri ((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((

## 练习

1. Chameleon K=8192 个代码簿入口,每张 512x512 图像 1024 个代码──估算对24bit RGB 图像的压缩比──它是有损的吗?有多有损的吗?

2. Bir çakışta bir çakışta bir çakışta 4K resim oluşturabilir mi? İlk sorunun doğduğu soru kontext 、Tokenizer 質量, KV cache mı?

3. Tam Python'la QK-Norm'i gerçekleştirmek için, LayerNorm'un ön ve son nokta ürününü göstermek için 64 boyutlu bir sorgu ve anahtar belirleyin.

4. 阅读Chameleon Bölüm 2.3 İçinde Egzersiz Stabsibilitesi İçindekiler.

5. 扩展玩具解码器,使其在给定纯文本提示时输出混合模态响应――训练数据分布为60%文本-first / 40%图像-first,测量模型选择图像-first 与文本-first 的频率――

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Early fusion | "Unified tokens" | 图像从第一步起就被转换为离散 Token，并共享 Transformer 的词表 |
| VQ-VAE | "Image tokenizer" | CNN + ViT + codebook，将图像映射为 Transformer 可预测的整数 indices |
| Shared vocabulary | "One dictionary" | 覆盖文本 + 图像 + 模态分隔符的单一 Token ID 空间 |
| QK-Norm | "Attention stabilizer" | 在 query 和 key 做 dot product 之前对它们应用 LayerNorm，防止 norm blowup |
| Mixed-modality generation | "Text + image output" | 一次 pass 中自主生成交错文本和图像 Token 的 inference |
| Codebook size | "K entries" | VQ-VAE 可 quantize 到的离散 Vector 数量；在压缩率和 fidelity 之间权衡 |
| Tokenizer ceiling | "Reconstruction limit" | 解码 VQ Token 能达到的最佳 PSNR；限制模型的图像质量 |

## 延伸阅读

- [Chameleon Team — Chameleon: Mixed-Modal Early-Fusion Foundation Models (arXiv:2405.09818)](https://arxiv.org/abs/2405.09818)
- [Aghajanyan et al. — CM3 (arXiv:2201.07520)](https://arxiv.org/abs/2201.07520)
- [Yu et al. — CM3Leon (arXiv:2309.02591)](https://arxiv.org/abs/2309.02591)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Adept — Fuyu-8B blog (adept.ai)](https://www.adept.ai/blog/fuyu-8b)
