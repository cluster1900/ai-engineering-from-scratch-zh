# Kırmızı Takım Araçlama  Garak, Llama Gardiyan, PyRIT

> Üç üretim sınıfı aracı 2026 yılının kırmızı takım yığını çerçevesini oluşturur. Llama Guard (Meta)  bir Llama-3.1-8B 分类器, 14 MLCommons 危害类型 üzerine kurulmuş olarak ince ayarlanmıştır.2025 yılının Llama Guard 4 bir 12B orijinal Multimodal 分类器, Llama 4 Scout 裁剪而来. Garac (NVIDIA)  开源 LLM 漏洞扫描器, halüsinasyon için statik、ダイナミック 和 uyarlayıcı araştırma cihazları sunar. DATA sızıntısı、 hapishane enjeksiyon、 toksisite 和breaks (Microsoft)  支持 CrescendoTAP 和自定义链的轮轮回 Meta-team kampanyaları,深度利用这些研究项目.

**类型：**Yapım
**语言：**Python (stdlib, araç mimarisi simülatörü ve Llama Guard tarzında sınıflandırıcı simülasyonu)
**先修要求：**18 · 12-15 aşama (hapishaneler ve IPI)
**时间：**~ 75 dakika

## Öğrenme hedefi

- 描述 Llama Guard 3/4 在安全堆 中的位置:输入分类器、输出分类器,或两者兼具──
- Açıklayın 14 MLCommons 危害类别,并说明一个不明显的类别 (Kod Anlatıcısı İstifadesi)
- Garak'ın sondasını tanımlayın
- 描述 PyRIT'in çok turlu kampanya 结构,以及它如何与Garak sonde 组合──

## 问题

Ders 12-15  saldırı yüzünü gösterdi.

## 概念

### Llama Gardiyanı (Meta)

Llama Guard 3 bir Llama-3.1-8B modeli, MLCommons AILuminate 14 个类别 üzerindeki giriş/çıkanış sınıflandırması için ince ayarlanmıştır:
- 暴力犯罪、非暴力犯罪、性関連、CSAM、誹謗中傷
- 专业建议、隐私、IP、无差别武器、仇恨
- İntihar/İntihar, seks içerik, seçim, kod yorumcularının kötüye kullanımı

支持 8种语言──用法:放在 LLM 之前(input moderation)、LLM 之后(output moderation),或两者都放──两种用法会产生不同的训练分布  Llama Guard 3 以单一模型形式发布,同时处理两者──

Llama Guard 3-1B-INT4 (arXiv:2411.17713, 440MB, 移动 CPU 上约 ~30 token/s) 量化后的边缘 变体──

Llama Guard 4 (Llama 4 (Yeni 4 月) 2025) 12B 、Türk Multimodal, Llama 4 Scout 剪剪而来── bir 摄入文本 + 图像的分类器 ile, önceki 8B 文本和 11B vizyon 版本ı yerine değiştirmiştir──

### Garak (NVIDIA)

开源漏洞扫描器──架构:
- **Probes.**Halüsinasyon, veri sızması, hızlı enjeksiyon, toksisite, hapishaneler saldırı üreticisi, statik, sabit, dinamik, uyarlayıcı, hedef, hedef, çıkış,
- **Detectors.**                                                                                                                                                                                                                                                              
- **Harnesses.**管理 probe-detector对,运行运动,生成报告──

TrustyAI Garak ile Llama-Stack kalkanlarını birleştirir.

### PyRIT (Microsoft)

Python Risk Identification Toolkit──多轮 red-team kampanyaları── etrafında aşağıdaki bölümler oluşturulur:
- **Converters.**转换一个种子提示  parafrase、代码、翻译、角色扮演──
- **Orchestrators.**运行 kampanya:Crescendo(升级) TAP(分支) RedTeaming(自定义循环) 
- **Scoring.**LLM-as-judge veya sınıflandırıcı-as-judge

PyRIT Garak daha ağır yakınlarıdır. Garak binlerce tek turlu sondayı yürütüyor.

### Yüküm

Model iki tarafında Llama Gardiyanı yerleştirilmiştir. Garak her gece çalışmaktadır. Geri dönüş yapmaktadır.

### 评估陷

- **Judge identity.**Üç Ürün: LLM yargıçı kullanılabilir; yargıç kalibrasyonu 会驱动报告的 ASRs (Hazret 12)
- **Probe staleness.**随着模型针对探测器被补丁,Garak探测器 会老化──适应探测器(PAIR şeklinde) statik探测器 老化更慢──
- **Llama Guard 对良性内容的 FPR.**早期 Llama Guard 版本会过标记政治和LGBTQ+ 内容;Llama Guard 3/4'ün kuruluşu geliştirilmiştir, ancak her bir görev için tek bir kuruluşu oluşturmamıştır.

### 18'inci aşamada yer alıyor.

Ders 12-15 saldırı töreni. Ders 16 üretim araçları. Ders 17 (WMDP) çift kullanımlı yeteneklerin değerlendirilmesi. Ders 18 sınır güvenlik çerçeveleri.


```figure
al-guard-stack
```

## Kullan

`code/main.py`构建一个玩具Llama Guard-style classifier (在 14个类别上的关键词 +语义特征) 、一个玩具Garak harness (Garak harness) 探测器循环),以及一个Pyrit-style多轮转换器链──你可以对模拟目标进行这些工具,并观察不同的覆盖特征──

## - Söyle.

本课会生成 `outputs/skill-red-team-stack.md`❖ Bir dağıtım açıklaması vererek, üç araçtan hangisinin uygun olduğunu belirleyecektir.

## 练习

1. 运行  İşlem`code/main.py`❖ Llama-Guard tarzı sınıflandırıcısı tek tur saldırı ve çok tur saldırılarda test oranı karşılaştırmak

2. Yeni bir Garak sondeyi gerçekleştirmek: bir base64 编码的有害请求──测量Llama-Guard tarzında sınıflandırıcı onun denetleme durumuna──

3. Bir "Fransaca çevir, sonra parafrase" çeviricisi kullanın.

4. Llama Guard 3'ün tehlike sınıfları listesini okuyun. Bu sınıflarda, yasal geliştiriciler içerikleri için daha yüksek yanlış pozitif oranlar üretilen iki sınıf bulunmaktadır.

5. Garak ve PyRIT'in tasarım ilkelerini karşılaştırın.

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| Llama Guard | "the classifier" | 带有 14 个危害类别的 fine-tuned Llama-3.1-8B/4-12B 安全分类器 |
| Garak | "the scanner" | NVIDIA 开源漏洞扫描器；probes、detectors、harnesses |
| PyRIT | "the campaign tool" | Microsoft 多轮 red-team orchestrator；converters、orchestrators、scoring |
| Prompt-Guard | "the small classifier" | Meta 的 86M prompt-injection classifier，与 Llama Guard 配套使用 |
| TBSA | "tier-based scoring" | Garak 的 tier-based pass/fail，用于取代二元结果 |
| Converter chain | "paraphrase + encode + ..." | PyRIT 用于构建多步攻击的组合原语 |
| MLCommons hazard categories | "the 14 taxonomies" | Llama Guard 面向的行业标准分类体系 |

## 延伸阅读

- [Meta — Llama Guard 3 (in Llama 3 Herd paper, arXiv:2407.21783)](https://arxiv.org/abs/2407.21783) 8B 分类器
- [Meta — Llama Guard 3-1B-INT4 (arXiv:2411.17713)](https://arxiv.org/abs/2411.17713) 量化移动端分类器
- [NVIDIA Garak — GitHub](https://github.com/NVIDIA/garak) 扫描器 repo 和文档
- [Microsoft PyRIT — GitHub](https://github.com/Azure/PyRIT) kampanya araçları
