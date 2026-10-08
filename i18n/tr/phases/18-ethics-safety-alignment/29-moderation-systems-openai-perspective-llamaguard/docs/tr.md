# 内容审核系统  OpenAI, Perspective, Llama Guard

> 生产级调控系统将课 12-16 中定义的安全政策 操作化──OpenAI调控 API:`omni-moderation-latest`(2024) GPT-4o'ya dayalı, bir kez araya gelebilir metin + görüntüler 分类; 多语言测试集上上一版提升 42%; cevap şema 返回 13 个类 booleans  taciz, taciz/ tehdit, nefret, nefret/ tehdit, yasadışı, yasadışı/ şiddeti, kendini incitme/ niyet, kendini incitme/ talimatlar, cinsel, cinsel/ azınlık, şiddet, şiddet/ grafik; çoğu geliştiricilere karşı ücretsiz olarak görülmüş olan katman geriye dönmüş kalıplar: Giriş moderatörü (önem nesli)  Ürün moderatörü (önem nesli)  Kullanım moderatörü (domen kuralları)  Asynk paralel olarak gizli latency çağrılar;                                                                                                                                                                   

**Type:** Build
**Languages:** Python (stdlib, three-layer moderation harness)
**前置要求：**18 · 16 aşama (Llama Gardiyan / Garak / PyRIT)
**Time:** ~60 minutes

## Öğrenme hedefi
- OpenAI Moderation API'nin kategorisi taksonomisi ve Llama Guard 3'ün MLCommons seti ile ilgili bir açıklama.
- 描述三级调度层模式 ((输入、输出、定制),并指出每层的一个故障模式──
- Perspektif API'nin, LLM öncesi çağın temel çizgisi olarak konumlandığını ve neden hâlâ araştırılmakta olduğunu açıklayın.
- Açıklama Azure'ın geri dönüşü zaman çizelgesi.

## 问题
Ders 12-16  saldırıları ve savunma araçlarını tanımlamak. Ders 29  Deployed moderation systems, which will operate 操作化── သုံး katmanlı model is 2026 ′s default configuration──

## 概念
### OpenAI Moderation API

`omni-moderation-latest`(2024) ・ GPT-4o¬ temelinde bir kez调用即可对文 +图像 分类。对大多数开发者免费。

Kategorilar( yanıt şeması 中的 13 个布鲁尔):
- taciz, taciz/ tehdit
- nefret, nefret/ tehdit
- Kendine zarar vermek, kendine zarar vermek/niyetlenmek, kendine zarar vermek/ talimatlar
- cinsel, cinsel/kiçik yaşta olanlar
- şiddet, şiddet/grafik
- yasadışı, yasadışı/şiddetli

Multimodal destek 适用于 `violence`- Evet.`self-harm`和 `sexual`, ama uygulanmaz `sexual/minors`Sonraki yazı sadece

- Evet .`code/main.py`Bu yüzden, basit bir ders vermek için, biz yapacağız.`/threatening`- Evet.`/intent`- Evet.`/instructions`和 `/graphic`Alt kategoriler                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

On the other hand, the average rate of the average average of the average population is higher than the average of the average population.

### Llama Gardiyan 3/4

已在教学 16 覆盖──14 个 MLCommons risk kategorileri(组织方式不同于OpenAI'nın 13 个响应方案布鲁尔语)──支持 8 dil (v3)──Llama Guard 4 (2025 年 4 月) 原生支持 多模,12B──

OpenAI ve Llama Gardi taksonomileri birbiriyle üst üste, fakat farklılıklar da vardır. OpenAI geniş bir kategori olarak "yasadışı" olacaktır.

### Perspective API (Google Jigsaw)

Ön 2020'den önce olan LLM-as-moderator 浪潮((2020)'ün toksisite puanlama sistemi。Kategories:TOXICITY, SEVERE_TOXICITY, INSULT, PROFANITY, THREAT, IDENTITY_ATTACK。单维度 primar skor (TOXICITY),并带有子维度变异──

Bu, içeriği moderasyon araştırma temelli olarak yaygın olarak kullanılır, çünkü bu API 稳定、有文档, ayrıca çok yıllık kalibrasyon verilerine sahiptir.

### Üç katlı kalıp

1. **Input moderation.**Bu nedenle, kullanıcılar için bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir sonraki çağrıda bulunmak için, bir kez.
2. **Output moderation.**Geliştirme sırasında, model çıkışına önleyici olarak işaretlenir.
3. **Custom moderation.**Alan-özel kurallar (regex, allowlists, business policy)

Bu üç katlı tasarımdır: giriş moderasyonu 必須在世代前完成,輸出 moderasyonu 在世代 后运行。パラレリズム 適用用于層内  在同一文上并发运行多個分類者 (例如 OpenAI Moderation + Llama Guard + Perspective), böylece her sınıflandırıcının gecikmesini gizleyebilir。 seçilebilir optimize olarak, giriş moderasyonu 完成且 token-1 akışı 延后期 показывает placeholder response (("bir an, kontrol...")。Flag davranışı yapılandırılabilir: reddetmek、 temizlemek、 insan incelemesine hızlandırmak。

### Başarısızlık modları

- **Input only.**捕捉不到输出幻觉 (Hali 12-14 kodlama saldırıları giriş sınıflandırıcıları çevirecek)
- **Output only.**允许任何输入到达模型;增加成本;攻击者 暴露内部推理──
- **Custom only.**无法稳健覆盖各类类; 非常脆弱的; 非常脆弱的.

Dönüştürülmüş bir yöntem.

### Azure Değersizliği

Azure İçerik Moderator:2024 yıl 2 月 geçersiz oldu,2027 yıl 2 月 emekli oldu.

### Bu 18 fazaya uygun.

Ders 16  Red-team bağlamında 中覆盖 умеренция araçları。 Ders 29 覆盖部署 edilen moderasyon。 Ders 30 以当前 收尾──


```figure
an-moderation-layers
```

## Kullan
`code/main.py`构建一个三层调节器:输入调节器(keyword + category score) 、输出调节器(对输出使用相同的分类器) 、定制调节器(域规则) 。输入 跑过它,并观察哪一层捕捉到了什么──

## - Söyle.
本课产 出 `outputs/skill-moderation-stack.md` Bir dağıtım belirlemek için, modereasyon yığını yapılandırmasını önerecektir: giriş, hangi sınıflandırıcı kullanın, hangi sınıflandırıcı kullanın, hangi özel kurallar kullanın, ayrıca kenar durumlar, hangi yargı kullanın.

## 练习
1. 运行  İşlem`code/main.py`◊ benign ∞ borderline 和 harmful input ⇒ run ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ 

2. 扩展 harness,加入针对特定类的Perspective-API-style toxicity scoring──比较其门值行为与类分──

3. 阅读 OpenAI Moderation API dosyaları 和 Llama Guard 3 kategorisi listı──将每个 OpenAI kategorisi 映射到最接近的 Llama Guard kategorileri──找出三个无法干净映射的类别──

4. Kod asistanı dağıtımı için (örneğin GitHub Copilot) modereasyon yığınını tasarlamak, en ilgili ve en ilgili olmayan kategorileri tanımlamak ve özel kurallar önermek.

5. Azure İçerik Moderator 2027 yılının 2 ayında emekli olacak.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OpenAI Moderation | "omni-moderation-latest" | 基于 GPT-4o 的 13-category (text) classifier，带部分 Multimodal support |
| Perspective API | "Google Jigsaw toxicity" | Pre-LLM-era toxicity scoring baseline |
| Llama Guard | "MLCommons 14-category" | Meta 的 hazard classifier（v3：8B text，8 langs；v4：12B Multimodal） |
| Input moderation | "pre-generation filter" | model call 前作用于 user prompt 的 classifier |
| Output moderation | "post-generation filter" | delivery 前作用于 model output 的 classifier |
| Custom moderation | "domain rules" | Deployment-specific rules（regex、allowlist、policy） |
| Layered moderation | "all three layers" | 标准生产部署模式 |

## 延伸阅读
- [OpenAI Moderation API docs](https://platform.openai.com/docs/api-reference/moderations) Omni-moderasyon son noktası
- [Meta PurpleLlama + Llama Guard](https://github.com/meta-llama/PurpleLlama) Llama Gardiyan repo
- [Google Jigsaw Perspective API](https://perspectiveapi.com/) Toksisite puanlaması
- [Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/) Azure'ı değiştirmek
