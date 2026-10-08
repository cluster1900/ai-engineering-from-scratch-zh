# 文档与图表理解

> 文档不是照片──PDF、科学论文、发票或手写表单单包含布局、表格、图表、脚注、页眉和语义结构,这些是普通图像理解无法捕获的──VLM 之前的堆是一个管道:Tesseract OCR + LayoutLMv3 + 表格抽取演学──VLM 浪潮使用 OCR-free models 取代它──Donut (2022) 诺格 (2023) DocLLM (2023) 模型 能直接输出结构化标记──到2026年,前沿已经只是将页面图像以2576课本土的输入 Claude Opus 4.7,结构化标记输输出这些得到自然本本的.──── 文档

**Type:** Build
**Languages:** Python (stdlib, layout-aware document parser skeleton)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 5 (NLP)
**Time:** ~180 minutes

## Öğrenme hedefi

- 解释文档 AI 的三个时代:OCR管道、OCR-free、VLM-native──
- LayoutLMv3'ün üç sınıfı:文本、layout(bbox)、image patches,以及统一 masking──
- BİRLİK: Donut(OCR-free,image → markup)、Nougat(科学论文 → LaTeX)、DocLLM(layout-aware generative)、PaliGemma 2(VLM-native)。
- Yeni görev seçme belgesi modeli (en: 发票,科学论文,手写表单,中文票据)

## 问题

 Bu PDF'yi anlamak  has fraudulent地困难──信息位于:

- 文本内容(90% 的信号)
- Yapılandırma (s)
- 表格(行、列、合并单元格)
- 図と図―
- - Ne? - Evet.
- 字体与排版(标题 vs 正文) 』

OCR'nin ilk sayısı, metinden yayımlanmaya eğilimlidir, ancak kalan bilgiyi kaybeder.

## 概念

### Era 1  OCR boru hattı(2021年前)

Klasik bir yığın:

1. PDF → Her sayfa görüntü
2. Tesseract (Tesseract) veya Ticaret OCR (Tesseract)
3. Layout analizi 识别块(header、table、paragraf)
4. Masa yapısı tanıtıcısı 解析表格。
5. Alan kuralları + regex 抽取字段。

干净的印刷文本に适用──遇到手写、倾斜扫描、复杂表格、非英语文字会崩── her türlü başarısızlık modunun kendisini tanımlamak için istisna yolu gerekir──

### TrOCR (2021)

TROCR(Li et al., arXiv:2109.10282) , Teseract  klasik CNN-CTC'yi değiştirdi.

### 2. Çağ  OCR-den uzak(2022-2023)

İlk grup OCR-siz modellerin düşüncesi: tamamen algılama atlamak, doğrudan görüntü piksellerini 映射为结构化输出──

Donut ((Kim et al., arXiv:2111.15664):
- Kodlayıcı-dekoder transformatörü, kodlayıcı Swin-B.
- 输出, tek bir JSON'u ifade etmek için kullanılabilir, bir özetin belirlenmesi veya herhangi bir özel görev şeması için kullanılabilir.
- 无OCR、无布局、无检测──

Nougat ((Blecher et al., arXiv:2308.13418):
- 专门在科学论文上训练──
- 输出是 LaTeX / markdown。
- 处理方程式、多 layout、figures──
- Her arxiv-parser'ın kullandığı model var.

Bunlar genelciler değil, uzmanlar.

### LayoutLMv3 (2022)

另一条路线──LayoutLMv3(Huang et al., arXiv:2204.08387) OCR'yi koruyor, ancak düzen anlayışına katılıyor:

- Üç sınıf giriş akışı:OCR metin işaretleri, her bir işaretin 2 boyutlu sınırlama kutusu, görüntü yamaları,
- 跨三种 modaliteler 跨三种 modaliteler 跨三种 modaliteler 跨三种 modaliteler 跨三种 modaliteler 跨三种 modaliteler 跨三种 modaliteler 跨三种 modaliteler 跨三种 modaliteler 跨三种 modaliteler 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种 modalités 跨三种
- Aşağı游任务: sınıflandırma, birim çıkarma, tablo

LayoutLMv3 OCR'e dayalı bir dosya anlayışı 峰── bu, bir teklifte ve bir gönderimde çok güçlü bir şekilde görülmektedir.

### Doküman (2023)

DocLLM(Wang et al., arXiv:2401.00908) LayoutLM'in üretilen kardeşidir.

### 3. dönem  VLM-devli(2024+)

2024 yılının VLM'leri  yeterince iyi, tüp hattını tamamen değiştirebilir── yüksek çözünürlüklü VLM'e tam sayfa görüntüsünü ekle, soru sor, cevap al──

- LLaVA-NeXT 336-tile AnyRes  küçük dosyalara uygundur.
- Qwen2.5VL dinamik çözünürlük 原生処理 2048+ piksel
- Claude Opus 4.7 支持 2576px 文档。
- PaliGemma 2(2025 yıl 4 月) özel olarak文档 + 手写訓練。

VLM-devli ile OCR-pipeline arasındaki fark hızla azalıyor. 2026 yılına kadar, VLM-devli aşağıdaki yönlerden üstün çıkıyor:

- Sahne metni ((hand写 + 印刷,混合文字体系) ・・・
- 包含合并单元格的复杂表格──
- Metinlerin birleştirilmesi,
- 带文本批注的数字──

OCR boru hattı 仍在以下方面胜出:

- 純掃描大規模工作負荷, bunların her sayfasının gecikmesi çok önemlidir.
- Pipeline 可靠性 (BİL halüsinasyonları karşılaştırıldığında)
- 需要可审计 OCR 輸出监管环境──

### Claude 4.7 / GPT-5 Ön kenar

2576 piksel yerel giriş altında, ön kenar VLM'ler  İnsanın doğruluğuna yakın bir şekilde dosya anlayışı gerçekleştirirler.

- DocVQA:Claude 4.7 ~95.1,PaliGemma 2 ~88.4,Nougat ~77.3,Pipelin LayoutLMv3 ~83。
- ÇartQA:Claude 4.7 ~92.2,GPT-4V ~78
- VisualMRC:Claude 4.7 ~ 94

闭源模型 差主要来自分辨率和基础LLM 规模──7B 开源模型 落后几个点,但正在追赶──

### Matematik denklemler 和 LaTeX 输出

科学论文需要精确的拉特克斯方程输出──Nougat就是为此训练的──带 LaTeX hedefleri 训练的VLMs(Qwen2.5 -VL-Math、Nougat türevleri) kullanılabilir LaTeX oluşturur.

2026 yılının bilim makalelerinin boru hattı: önce PDF 上跑 Nougat, yeniden VLM kullan 处理棘手页面──

### Çizgi

Bu hala en zor alt görevdir. Karşıt baskı + el yazısı (Hikst Printing + Handwriting) (OCR) boru hattı, maliyetleri karşılığında hala VLM'lerin yerini yenmektedir.

### 2026 tarifi

Yeni belge-İI projeleri için:

- Büyük çaplı çaplı yayın:LayoutLMv3 + kural, yüksek maliyetli
- 混合文档(科学 + 手写 + 表单):VLM-mülki(PaliGemma 2 veya Qwen2.5-VL)
- 完整 arXiv ingestion:Nougat 处理数学,VLM 处理 fig­ures──
- 监管场景:OCR boru hattı + VLM onaylayıcı


```figure
mm-doc-layout
```

## Kullan

`code/main.py`- ...

- Bir oyunçuluğun versiyonu düzen farkındalıklı belirteci:给定 (text, bbox) çiftleri, genere LayoutLMv3 风格输入。
- Bir Donut 风格 görev şema jeneratörü: JSON şablonunun kullanılması için kullanılır.
- OCR-pipeline, Donut, Nougat ve VLM-native, her sayfa token bütçelerini karşılaştırın.

## - Söyle.

本课产 出 `outputs/skill-document-ai-stack-picker.md` bir belge-AI projesi belirlemek, alan, ölçek, kalite, düzenleme), OCR borusunda, OCR-siz uzman ve VLM-devli arasında seçim yapmak.

## 练习

1. Projenin günde 10 milyon 张发票... hangi stok, kayıp doğruluğu oranında sayfaya düşen maliyeti en aza indirebilir?

2. Neden LayoutLMv3 form QA'da saf CLIP-VLM'lerden daha iyi, ama sahne metinde performans daha kötü?

3. Nougat 生成 LaTeX── bir VLM-mülki 输出在 LaTeX fidelity 上胜过 Nougat 的测试用例,以及一个 Nougat 胜出的用例──

4. 阅读 PaliGemma 2 makalesi(Google, 2024) ―― karşılaştırıldığında PaliGemma 1,提升文档准确率的关键训练数据新增项是什么?

5. önemli ve güvenli bir hibrit tasarlayın: OCR boru hattı  primary, VLM  as secondary cross-check.

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|-----------------|------------------------|
| OCR pipeline | "Tesseract-style" | 分阶段 stack：detect -> OCR -> layout -> rules；确定性、脆弱 |
| OCR-free | "Donut-style" | 跳过显式 OCR 的 image-to-output transformer；单一 model |
| Layout-aware | "LayoutLM" | 输入包含逐 token bbox coordinates；跨 modalities 的统一 masking |
| VLM-native | "Frontier VLM" | 直接把 page image 以高分辨率输入 Claude/GPT/Qwen VLM；无 pipeline |
| DocVQA | "Doc benchmark" | Document VQA 标准；最常被引用的分数 |
| Markup output | "LaTeX / MD" | 结构化输出格式，而不是 free-form text；支持下游自动化 |

## 延伸阅读

- [Li et al. — TrOCR (arXiv:2109.10282)](https://arxiv.org/abs/2109.10282)
- [Blecher et al. — Nougat (arXiv:2308.13418)](https://arxiv.org/abs/2308.13418)
- [Huang et al. — LayoutLMv3 (arXiv:2204.08387)](https://arxiv.org/abs/2204.08387)
- [Kim et al. — Donut (arXiv:2111.15664)](https://arxiv.org/abs/2111.15664)
- [Wang et al. — DocLLM (arXiv:2401.00908)](https://arxiv.org/abs/2401.00908)
