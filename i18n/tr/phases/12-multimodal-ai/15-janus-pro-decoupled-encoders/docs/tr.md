# Janus-Pro: Birleştirilmiş Multimodal 模型的解 Encoder

> 统一 Multimodal 模型存在一种不可避免的张力──理解需要语义特征,即 SigLIP veya DINOv2 输出矢量,富含概念级信息──生成需要有利的重建代码,即能够重新组合清晰像素的 VQ Tokens── bu iki hedef tek bir kodörde uyumludur. Janus(DeepSeek,2024年10月) ve Janus-Pro(DeepSeek,2025年1月) tarafından yapılan bir düzeltme yönteminin durdurulması zorunlu bir çalışma biçimi olduğunu düşünmektedir.

**类型：**Yapım
**语言：**Python(stdlib,iki kodlayıcı yönlendirme + paylaşılan vücut sinyali)
**先修：**12 · 13 · Transfüzyon, 12 · 14 · Gösterme
**时间：**120 dakika kadar .

## Öğrenme hedefi
- 解释为什么单个共享编码器会在理解质量或生成质量中牺牲一方──
- 描述 Janus-Pro'nun yönlendirme: understand在输入侧使用 SigLIP özellikleri,生成在输入和输出两侧使用 VQ Tokens──
- 追踪让Janus-Pro成功、而Janus未能做到的数据混合扩展──
- तुलना करें çıplak-Janus-Pro) 、 çıplak-daima ‧ Transfusion) ∼ çıplak-diskrete ‧ Show-o) 架构──

## 问题
统一模型在理解和生成之间共享 Transformer body──此前的尝试(Chameleon、Show-o、Transfusion) 都在两个方向上使用同一个视觉Tokenizer──这个Tokenizer是一种折中:

- Çıktırma DATA:VQ-VAE 捕捉细粒度像素 细节, fakat oluşan Tokens 语义一致性较弱──
- Çıktı. SigLIP Embeddings 会把"cat" 图像聚到"cat" Tokens 附近,但不能支持良好重建──

Show-o 和 Transfusion bu nedenle belli bir yönde görünür kalite fiyatını ödüyor. Janus-Pro soruları ortaya koyuyor: Görev gereksinimleri farklı olduğunda, neden bir Tokenizer'i daha isteyin?

## 概念
### 解视觉编码

Janus-Pro'nun yapı iki kodlama sistemi ile ayrılmıştır:

- Anlamak yolları──输入图像 → SigLIP-SO400m → 2 katlı MLP → Transformer vücudu──
- 生成路径──输入图像(如果基于已有图像进行条件化)→ VQ Tokenizer → Token IDs → Transformer vücut。
- 输出生成──Transformer 预测的图像代码 → VQ dekodör → piksel──

Transformer vücudu ortak bir şey. Üst ve alt tarafta olan her şey özel bir görevdir.

输入通过快速格式 消除歧义:`<understand>`Etiket 通過 SigLIP 路由;`<generate>`VQ yoluyla veya yönlendirme yoluyla da görevden karar verilebilir.

### Neden işe yarıyor?

Anlama kaybı SigLIP özelliklerini kazanırken CLIP tarzı öncesi eğitimler, bu göreve daha uygun olduğu için, modelin algılama referansını geliştirmiştir.

生成損失  VQ Tokens elde etmek, Tokenizer ise yeniden inşa edilmeye uygun olarak optimize edilmiştir.

Transformer vücudu iki tür giriş dağıtımını görecektir, ve aynı zamanda bunları işlemeyi öğrenir.

### Data Expansion:Janus vs Janus-Pro

Janus (şimdilik yayınlanan, arXiv 2410.13848) bilgiyi yayımladı, ancak büyüklüğü daha küçük oldu.

- 7B paramları
- 1. aşama (alignment) 90M görüntü-metin çiftleri kullanmak,高于 72M──
- 2. aşama (birleştirilmiş) 72M kullanmak, 26M'den fazla
- 3. aşama 200 bin görüntü-gen talimat örneğini artırmak.

Sonuç şu: Janus-Pro-7B MMMU'da LLaVA'ya göre LLaVA'ya göre LLaVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLAVA'ya göre LLA'ya göre LLAVA'ya göre LLA'ya göre LLAVA'ya göre LLA'L'ya göre LLA'L'ya göre LLA'L'L'ya L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L'L

### JanusFlow: düzeltilmiş akış 变体

JanusFlow(arXiv 2411.07975) düzeltilmiş akış 生成路径(düzenli) ile VQ 生成路径¬ı değiştirdi.

### Ortaklık organının sorumlulukları

Transformer vücudu 处理统一序列, ama iki tür giriş dağılımına karşı görevi:

- Anlamak için:消费 SigLIP özellikleri + metin Tokens → 自回归地输出文本。
- 对生成:消费文字 Tokens +(可选图像 VQ Tokens)→ 自回归地输出图像 VQ Tokens。

Her blokta bir tane de modalite özel ağırlık yok. Bu da Qwen veya Llama'nın içindeki metin tarzında bir Transformer.

Yani, bu Janus-Pro'nun vücudu önceden eğitilmiş LLM başlangıçından yapılabilir.

### InternVL-U ile karşılaştırıldığında

InternVL-U (Deneleme 12.10) 2026 yılının sonraki çalışmalarıdır.

- Doğal Multimodal öncesi eğitim ((InternVL3 omurgası)
- Çıkarılmış kodlayıcı yönlendirme ((SigLIP,VQ + yayılma başlıyor)
- 统一理解 + 生成 + 编辑。

InternVL-U, Janus-Pro'nun yapısal seçeneğini daha büyük bir çerçeveye doğru aktaracaktır.

### Sınır

Çözüm: Encoder yapı karmaşıklığını artıracak. İki Tokenizers eğitilmesi, iki giriş yolunun korunması, iki grup başarısızlık modunun işlenmesi gerekir.

对于不需要理解的产品,Janus-Pro 能力过剩,选择 稳定扩散 3 /流动 模型即可──

Her iki ürün için de Janus-Pro artık açık bir referans yapıdadır.


```figure
l5-janus-decouple
```

## Kullan
`code/main.py`模拟 Janus-Pro yönlendirme:

- 两个伪编码器:SigLIP-like (siglip) 产生256-dim 语义 矢量) 和VQ-like (vq-like) 产生整数码) 
- Bir hızlı yönlendiricisi, görev etiketine göre 選択 Encoder。
- Bir ortak organ ((stand-in), hangi kodlayıcı tarafından oluşturulan Token 序列 ne olursa olsun, hepsi işlenir.
- 1 aşamada (ağırlama) 3 aşamada (öğretim sesi) ağırlıklı örnek programı 切换。

打印 3 个例的路由路径:image QA、T2I、image editing──

## - Söyle.
本课会生成 `outputs/skill-decoupled-encoder-picker.md`❖ sınırlı kaliteli bir zamanda tüm yaşamını bir ürün olarak elde etmeyi isteyen bir kişiye, Janus-Pro、JanusFlow veya InternVL-U'yu seçerek, belirli veri boyut önerileri verir.

## 练习
1. Janus-Pro-7B GenEval'de DALL-E 3'i aşar. Neden bir 7B açık model üretimi sınırında uyumlu olabilir, ancak anlamakta zorlanıyor.

2. 实现一个路由器函数:给定提示文,将其分类为 `understand`Ya da`generate`❖ Nasıl "describe and then sketch" gibi bir şekilde işleyeceksin?

3. JanusFlow düzeltilmiş akışla VQ yollarını değiştirmek için. Transformer vücudu şimdi ne çıkarıyor? Kayıp ne değişir?

4.  Janus-Pro 架构 can through again add a solution Encoder 来处理的第四种任务──例:image segmentation(DINO-style)、深度(MiDaS-style)──

5. Janus-Pro Bölümü 4.2'de veri genişlemesi içeriği hakkında okuyun.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Decoupled encoding | "两个 visual encoders" | 每个方向使用单独的 Tokenizer 或 Encoder：理解使用语义向，生成使用重建向 |
| Shared body | "一个 Transformer" | 单个 Transformer 处理任一 Encoder 的输出；没有 modality-specific weights |
| SigLIP for understanding | "语义 features" | CLIP-family vision tower，提供丰富的概念 features，但重建较差 |
| VQ for generation | "重建 codes" | Vector-quantized Tokens，可以干净地 decode 回 pixels |
| JanusFlow | "Rectified-flow variant" | 使用 continuous flow-matching generation head 替代 VQ 的 Janus-Pro |
| Routing tag | "Task tag" | Prompt marker（`<understand>` / `<generate>`），用于选择输入 Encoder |

## 延伸阅读
- [Wu et al. — Janus (arXiv:2410.13848)](https://arxiv.org/abs/2410.13848)
- [Chen et al. — Janus-Pro (arXiv:2501.17811)](https://arxiv.org/abs/2501.17811)
- [Ma et al. — JanusFlow (arXiv:2411.07975)](https://arxiv.org/abs/2411.07975)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Dong et al. — DreamLLM (arXiv:2309.11499)](https://arxiv.org/abs/2309.11499)
