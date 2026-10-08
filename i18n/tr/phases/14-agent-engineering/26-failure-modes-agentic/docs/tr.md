# Başarısızlık Modu:Agentler Neden Başarısız Olacaklar?

> MASFT (Berkeley, 2025) 14 farklı Ajan Başarısızlığı Modlarını 3 个类别に归纳する. Microsoft'ın Taksonomisi mevcut AI başarısızlıklarını kaydetmiştir.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**先修要求：**14 · 05 aşaması (Özünüze Düzeltme ve Kritik), 14 · 24 aşaması (Körünebilirlik)
**Time:** ~60 minutes

## Öğrenme hedefi
- MASFT'in üç başarısızlık kategorisini belirler ve her sınıfın en az dört özel modelini belirler.
- 解释为什么机器人失败会放大现有AI失败模式 (Bia 偏见,幻觉)
- 5 sektörün tekrar ortaya çıkış modelini ve onu giderme yöntemlerini açıklayın.
- 实现一个stdlib detektörü,故障模式 etiketleri ile 标注代理痕迹──

## 问题
チーム tarafından yayımlanan ajanlar %90'ın üzerinde çalışırlar. Geri kalan %10'u da rastgele gürültü değil, birkaç kez ortaya çıkan sınıflara düşer.

## 概念
### MASFT (Berkeley, arXiv:2503.13657)

Çoklu Ajan Sistem Başarısızlık Taksonomisi──14 种失败模式 聚类为 3 个类──Inter-annotator Cohen's Kappa 为 0.88,说明这些类别可靠地区分──

核心主张: başarısızlıklar, daha fazla Ajan 系统中的根本设计缺陷, daha iyi temel modellerle karşılaştırılmak yerine 修复的LLM 限制──

### Microsoft Taksonomiyi Ajantik AI Sistemlerinde Başarısızlık Modu

- 现有AI故障 (AI başarısızlıkları)                                                                                                                                                                                                                                                         
- Yeni başarısızlıklar özerklik: büyük çapta istenmeyen eylem, araç kötüye kullanımı, görev sürüşü.
- Bu beyaz kağıt, ajan ürünlerinin risk kayıtlarıdır.

### Agentic AI'de Karakterizasyon Hataları (arXiv:2603.06847)

- Orkestrasyon, iç durum evrimi ve çevre etkileşiminden kaynaklanan başarısızlıklar.
- Sadece kötü kod veya kötü model çıkışı.

### LLM Ajan Halüsinasyonları Araştırması (arXiv:2509.18970)

两种主要表现:

1. **Instruction-following Deviation** Ajan 没有遵循系统提示──
2. **Long-range Contextual Misuse** Ajan forgot or misuse context in earlier rounds 

Yöntemli hatalar: İptal(漏掉步骤)  İptal(重复步骤)  Bozukluk(步骤顺序错误) 

### 五种行业反复出现的模式

Arize、Galileo、NimbleBrain 2024-2026 yıllarındaki现场分析收到:

1. **Hallucinated actions.**Ajan var olmayan bir araç kullanmış, ya da argümanlar hazırlamış.
2. **Scope creep.**Ajan görevlerini kullanıcıların isteklerinin ötesine uzatacak.
3. **Cascading errors.**Bir hata. Bir kez hayalet SKU halüsinasyonu.
4. **Context loss.**长周期任务忘记早期轮次的约束──
5. **Tool misuse.**Yanlış argümanlar kullanmak 调用正确工具,或直接调用错误工具──

Cascading en ölümcül bir şey. Ajanlar başarısız olduklarını ayırt edemiyorlar.

### Yumuşak başlılık: Her adımda kapılar ayarlanır

Düşünce zincirinin her aşamasında otomatik doğrulama kapıları ayarlanır, kontrol ortamı durumu  kontrol gerçek temelliği。 özellikle şunları içerir:

- Her adım güvenlik sınıflandırıcısı (Daahi 21)
- Araç-Çalışma argümanı geçerliliği (Deneyim 06):
- Çıkarılan içeriği bilinen gerçeklerle 交叉检查(05 ders,CRITIC) ⋅
- 通過重新探测状态 来检测成功幻觉 (→ Başarılılık halüsinasyonları) 文件真的被创建了吗?)

### Başarısızlık izleme 容易出错的地方

- **Tagging only crashes.**Çoğu ajan başarısızlığı, etkili bir sonuç elde eder.
- **No baseline.**Akıntı algısı son bilinen iyilik gerektirir.
- **Over-alerting.**Her başarısızlık bir sayfa oluşturur.


```figure
failure-cascade
```

## Yapın onu.
`code/main.py`实现 bir stdlib başarısızlık modu etiketleme:

- Bir beş çeşit modeli kapsadığı sentetik iz verileri kümesi
- Her türlü model karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı
- Bir etiket, her izini işaretlemek ve rapor modu dağıtım için kullanılır.

- Yapma .

```
python3 code/main.py
```

输出: Her 条 痕跡のラベル + 累積分布, Phoenix 痕跡のクラスターिंग için mevcut içeriklerin düşük maliyetli bir geri dönüşüdür.

## Kullan
- **Phoenix**Yaratıcılık çevre sürükleme gruplamaları için kullanılır.
- **Langfuse**Kullanılan seans tekrarlaması + notasyon için kullanılır.
- **Custom**Gözetimsellik platformunda kullanılabilir 无法检测的域特定签名──

## - Söyle.
`outputs/skill-failure-detector.md`Ürününüzde bulunan hata modunun algılayıcıları, ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓

## 练习
1. 添加一个 成功幻觉探测器:Agent 返回成功,但目标状态 没有变化──
2. Yaptığınız bir ürünün 100 条 gerçek izlerini işaretleyin. Hangi model yönetiyor? Onarma maliyeti nedir?
3.  Cascade Radius metrikini gerçekleştirmek: N'inci adımın başarısızlığını belirlemek, aşağıdaki adımları ne kadar etkiledi?
4. MASFT'in 14 farklı başarısızlık modusu seçimi.
5. Bir detektörü İS işine bağlamak: Eğer %5'in izleri bir model için işaretlenirse,  failure yaptırın.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MASFT | “Multi-agent failure taxonomy” | Berkeley 14-mode categorization |
| Cascading error | “Ripple failure” | 一个早期错误会通过 N 个步骤传播 |
| Context loss | “Forgot the constraint” | 长周期轮次丢失早期轮次事实 |
| Tool misuse | “Wrong tool / wrong args” | 调用有效，但调用方式错误 |
| Success hallucination | “Faked completion” | Agent 在 400 上声称成功；state 未变化 |
| Scope creep | “Overreach” | Agent 做了超出要求的事 |
| Instruction-following deviation | “Disobedience” | 忽略 system prompt 或用户 constraint |
| Sub-intention errors | “Plan bugs” | plan execution 中的 omission、redundancy、disorder |

## 延伸阅读
- [Cemri et al., MASFT (arXiv:2503.13657)](https://arxiv.org/abs/2503.13657) 14 种故障方式,3 个类别
- [Microsoft, Taxonomy of Failure Mode in Agentic AI Systems](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/final/en-us/microsoft-brand/documents/Taxonomy-of-Failure-Mode-in-Agentic-AI-Systems-Whitepaper.pdf) Risk kayıtları
- [Arize Phoenix](https://docs.arize.com/phoenix) 实践中的 drift clustering
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) Daha basit desenler, bu modellerden tamamen kaçınabilir.
