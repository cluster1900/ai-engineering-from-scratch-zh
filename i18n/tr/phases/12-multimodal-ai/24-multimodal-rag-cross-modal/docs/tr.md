# Multimodal RAG ve Cross-Modal Retrieval

> Görüş-devli belge RAG 只是其中一片. Production level Multimodal RAG'ın kapsamı daha geniş: metin, görüntüler, ses, videolar arasında geri çekim, seyahat planlaması için kullanılır.

**Type:** Build
**语言:**Python (stdlib,带 fusion + yerleştirilmiş jeneratör)
**先修要求：**12 · 23 aşaması (ColPali), 11 aşaması (RAG temelleri)
**Time:** ~180 分钟

## Öğrenme hedefi
- 设计 cross-modal retrieval:text → image、image → text、audio → video等。
- Üç çeşit füzyon stratejisi: not füzyonu, dikkat tabanlı füzyon, MoE füzyonu
-  açıklama nesil yerleştirme:  kaynak olarak  farklı modaliteler  karışıklık zaman  kaynaklarınızı                                                                                                                                                                                                                                                 
- 2025 yılının Kanonik Multimodal RAG anketini, ayrıca onların çocuk problem taksonomını anlatın.

## 问题
Tek modal RAG, gelişmiş bir modeldir: gömülü sorgu, gömülü parçalar, geri alınma, LLM'ye girmek,

1. Çok sayıda çekim başı, her tür modaliteye uyumlu bir alan içinde yerleştirilmelidir.
2. 跨 modality 融合 geri alım sonuçları。
3. Genreasyon yerleşimi, modalite üzerinden kaynaklara değinmek gerekir.
4. 覆盖跨模式信号的评估指标──

2025 yılındaki bu araştırmalar sonunda aynı taksonomiyi ortaya koydu.

## 概念
### Modal çaplı çekim

给定 modality A 的查询,retrieve modality B 的文件──三种模式:

1. Paylaşılan yerleştirme alanı──CLIP 和 CLAP 在共享空间中生成文字 + image / text + audio Embedding──跨 modality 的 cosine benzerliği 可以直接使用──受限于CLIP 训过的配对──

2. Per-modality kodlayıcı + çevirme。Teks kodlayıcı + görüntü kodlayıcı + bir küçük çevirmen modülü, farklı alanlar arasında haritalama için kullanılır。Gupta et al.

3. VLM'nin gizli durumlarını bir çekim temsilci olarak kullanmak. VLM'nin desteklediği herhangi bir yöntem kullanılabilir.

选择:text+image 用 CLIP / SigLIP 2;text+audio 用 CLAP;frontier 质量 cross-modal 用 VLM-hidden-states。

### Füzyon stratejileri

Siz 10 个结果:5 张图片、3 段文字段、2 个音频片──如何合并?

Not birleşimi (最便宜) ∼ Her modalite kendi retriever, her retriever 返回分──先在 modality内正常化分,再求和──简单,通常有效──

Dikkat tabanlı birleşim, tüm alınan öğeleri, küçük bir dikkat ağı oluşturmak, onlara güç vermek, eğitime ihtiyaç duymak.

MoE füzyonu──Gating ağı 路由到modality-specific experts──不同查询 类型走不同路由,例如视觉问题 会给图像更高权重──

Örtülü seçenek: puan birleşimi, sorunun yönünü biraz daha yönlendirmek. Eğer A/B'nin alanınızda belirgin bir kazanç göstermesi durumunda, tekrar MoE'ye yükseltilmesi durumunda bulunur.

### Nesil yerleştirme

LLM 应该引用是哪个收获项目 支了每个索赔──多模式:

- Metin kaynağı: standard citation `[1]`- Evet.
- Resim kaynağı:`[img 3]`, bir kısa başlıklı.
- Ses:`[audio 2 at 0:34]`- Evet.

Ürün bilincili veriler kullan 訓練 jeneratörü: eğitim hedefi 中の各主張 都标注源索引──Inference 时,model 会自然输出引用──

### 2025 anketleri

Abootorabi et al. ((arXiv:2502.08826,Ask in Any Modality):Multimodal RAG'ların taksonomisi──覆盖回収、融合、生成──覆盖面最广──

Mei et al. ((arXiv:2504.08748,A Multimodal RAG ):重点关注 alt görev referans markeri 和 başarısızlık modları。

Zhao et al. ((arXiv:2503.18016):偏视野的调查──对ColPali aile işinin 理很强──

Bu yazın sonuna kadar, 2025 yılının ilkbaharında en son gelişmeleri ele alabileceksiniz. Çoğu sorun hâlâ açık.

### MuRAG  temel kağıt

MuRAG(Chen et al., 2022) is the first article Multimodal RAG── Multimodal KB'den görüntü + metin,并生成答案──在 VLM 浪潮之前证明了可行性──现代系统(REACT、VisRAG、M3DocRAG)都建立在之之上──

### Bir üretim sınıfı seyahat planlaması örneği

Sorum: Help me find a quiet  Have natural light  Vegan brunch 

Kök hattı:

1. 分解 sorgu。quiet → ses/önzet anahtar kelime;vegan brunch → menü öğesi;natural light → image özelliği。
2. 按 modality retrieve:
   - Yorumlara cevap ver: Vegan brunch, sessiz ortam.
   - Restoran fotoğraflarına resim çekim: Doğal ışık, hava.
   - Çevre ses klipleri için ses çıkarma:  Düşük decibel, müzik yok.
3. 融合 skorları── her restoranın bileşik skorları vardır──
4. Top-k restoranlar → VLM jeneratörü, taşıt tüm kanıtlar → 带引用 输出答案──

Bu, teksten çok daha ileriye doğru ilerliyor. Her modalite tek tek metni ekliyor.

### Ajantik multimodal RAG

Multi-hop: Eğer ilk kez alınmazsa, LLM yeniden biçimlendirilir ve tekrar alınır.

- İlk ilk top-10'u geri alın → LLM 询问太噪, <40 dB → yeniden alın。
- Resimleri alın → LLM 发现其中一张有菜单 → menü metnini alın → cevap。

Bu karmaşıklığı artıracak, ama tek çekimle geri alınmayı çözemediğimiz soruyu çözebilir.

### Değerlendirme

Modal çaplı değerlendirme 仍不成熟──常见代理:

- Her türlü modaliteye...
- Top-k doğruluğu fused。
- İnsanlık değerlendirmesinin sonu sonu sonu tamamıyla.
- Görev-özel(完成 bookings、完成 purchases)

没有覆盖所有modality 的标准基准―― çoğu makale alan-spesifik görevlerde bulunmaktadır.


```figure
contrastive-matrix
```

## Kullan
`code/main.py`- ...

- Üç tane sahte retriever, bir restoranın korpusunda çalışıyor.
- Not birleşimi, kullanılabilir yapılandırma ağırlıkları 组合 modality skorları。
- Bir jeneratör tüpü, bir çıkış, bir alıntı son cevabı.
- Bir basit ajanlik döngüsü, güven daha düşük olduğunda soruyu yeniden formüle etmek.

## - Söyle.
本课产 出 `outputs/skill-multimodal-rag-designer.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                                    

## 练习
1.  bir tıbbi-içimli Multimodal RAG: sorgu = yaralanma fotoğrafı + metin semptomları― hangi modalite hangi KB'den alınır?

2. Skor füzyonu basit bir ağırlıklı toplamdır.

3. 阅读 Abootorabi et al.'s taksonomisi(Bölüm 3)。 Üç kanonik alt sorunun nedir?

4. Trip-planner Multimodal RAG  tasarım bir değerlendirme spesifikasyonı. Hangi ölçütler  kapsamı görüntü hatırlama, ses hatırlama ve kompozite doğruluk?

5. Agentlik Multi-Hop RAG Her bir tur dönüş yolculuğu için şehirlerde gecikme vergisi vardır. Sorgular 難到何程度時,精度獲得 才能正当化延延?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Cross-modal retrieval | “Query 一个 modality，retrieve 另一个” | Text query retrieve images；image query retrieve text；需要 shared space 或 translator |
| Score fusion | “组合 scores” | 对每种 modality 的 retrieval scores 做 weighted sum；最简单的 fusion |
| MoE fusion | “Modality-routed experts” | Gating network 按 query 选择信任哪种 modality 的 scores |
| Grounded generation | “Cite your sources” | 答案中的每个 claim 都标注 source index |
| MuRAG | “第一个 Multimodal RAG” | 2022 年 paper，建立了 Multimodal RAG 模式 |
| Agentic multi-hop | “Reformulate and retry” | 当 first-pass confidence 较低时，LLM 重新 query retrievers |

## 延伸阅读
- [Abootorabi et al. — Ask in Any Modality (arXiv:2502.08826)](https://arxiv.org/abs/2502.08826)
- [Mei et al. — A Survey of Multimodal RAG (arXiv:2504.08748)](https://arxiv.org/abs/2504.08748)
- [Zhao et al. — Vision RAG Survey (arXiv:2503.18016)](https://arxiv.org/abs/2503.18016)
- [Chen et al. — MuRAG (arXiv:2210.02928)](https://arxiv.org/abs/2210.02928)
- [Liu et al. — REACT (arXiv:2301.10382)](https://arxiv.org/abs/2301.10382)
