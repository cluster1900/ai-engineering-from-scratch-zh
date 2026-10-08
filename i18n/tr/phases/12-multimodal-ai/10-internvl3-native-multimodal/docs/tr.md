# InternVL3:Doğal Multimodal Eğitim

> InternVL3  öncesindeki her açık kaynak VLM aynı üç adımlı bir biçim izledi: Bir kaç milyar metin tokeni üzerinde eğitilmiş bir metin LLM alın, bir vizyon kodlayıcısı alın, sonra ince ayarlama yapılsın. Bu iş, ancak uyumluluk borcunu yaratacaktır: metin LLM  tamamen hazırlık bütçesini harcadı.

**Type:** Learn
**Languages:** Python (stdlib, training-corpus mixer)
**Prerequisites:** Phase 12 · 05, Phase 12 · 07 (recipes)
**Time:** ~120 minutes

## Öğrenme hedefi
- 解释为什么后期VLM eğitim 会累积对齐债,并引用三个可测量症状(katastrofi unutma, cevap akışı, görsel-metin tutarlılığı)
- 描述 InternVL3'ün yerel antrenman öncesi mixleri, yanı sıra metin: interleaved: caption 的比例为什么重要──
- तुलना V2PE ( değişken görsel pozisyon kodlaması) ve Qwen2-VL'nin M-RoPE
- Açıklama: Görsel çözünürlük yönlendiricisi (ViR) ve çözünür görsel dil (DvD)

## 问题
Post-hoc VLM eğitimidir. LVA、BLIP-2, Qwen-VL、Idefics bir önceden eğitilmiş LLM (Llama、Vicuna、Qwen、Mistral) ve vizyonla birlikte olmak üzere eğitim aşamasında genellikle aşağıdakiler vardır:

1. Dondurulmuş LLM + dondurulmuş görme kodlayıcı + eğitimli projektor,
2. Dondurma LLM, instruksiyon verileri
3. Seçilebilir görev-özel ince ayarlamalar

Dönüşüm borcu 会表现出三个症状:

- Katastrofal unutma. Post-hoc VLM 会遗忘-текst-only 技能──GSM8K 分数下降 5-10 分──Hellaswag 分数下降──纯文本代理 退化──
- Cevap sürükleme: Aynı görsel sorunun değişimleri farklı cevaplar elde eder. LLM'nin kendi simgelerinin arasındaki bağlama daha zayıf.
- Görsel-metin tutarlılığı ve çelişki. VLM bir görüntüyi doğru bir şekilde tanımlayabilir, sonra kendi tanımına karşı çıkan bir soruya cevap verebilir.

Bu belirtiler yeterince kaydedilmiştir. MM1.5 Bölüm 4'te onlara karşı ölçüm yapılmıştır.

## 概念
### Doğal Multimodal Eğitim Önü

InternVL3 başlangıçtan bir orijinal multimodal'ın korpusuna başlıyor.

- %40 tek metin veri ((FineWeb、Proof-Pile-2 etg.)
- %35 birbirine karışmış görüntü-metin verileri ((OBELICS、MMC4-style)
- % 20 çiftleştirilmiş görüntü başlıklı veriler
- %5 video metin verileri

Görme simgeler, metin simgeler ve çapraz modal etkileşimler, 1. gradient aşamasından başlayarak aynı kayıpta yer almaya başlıyor.

Bas modelinin eğitimi tek aşamada gerçekleşir.

### V2PE (değişken görsel pozisyon kodlaması)

Qwen2-VL M-RoPE kullanmak, sabit bir eksel tahsisini benimsemek.

- Metin tokens  1D pozisyon elde etmek
- Resim yamaları 获得 2D pozisyonu(sır, sütun)。
- Video çerçeveleri 获得 3D pozisyon ((zaman, satır, kol)

Üç者共享同一个RoPE frekans tabanı, ancak her bantın gizli-dim tahsis edilmesi sabit bir bölünme değil, bir öğrenme parametresi olarak görülür. Bu, eğitim öncesi döneminde zamansal ve uzaysal frekans çözünürlüğünü özgürce ölçebilmesine olanak sağlar.

V2PE'nin ablasyon iddiası: Aynı hesaplamalarda, video referansları M-RoPE'den yüksek 1-2 分── devrimci bir değişim değil, daha temiz──

### Görsel çözünürlük yönlendiricisi (ViR)

Uygulama optimizasyonu──并非所有图像都需要全分辨率编码──一张只有一个低细节物体的照片,如果按1280px本土编码,会浪费代币──ViR是一个小分类器,会在编码之前预测回答问题所需的最低分辨率──

Routing 有三档:low-res(256 tokens) 、medium(576) 、high(2048+) 

### İlişkilendirilen Görme-Dil (DvD) dağıtım

Bir büyük VLM 时, görüntü kodlayıcı, her görüntü bir kez çalıştırılır, ancak LLM her çıkış jetonu için çalışır.

对于一个8B + 400M编码器模型,DvD 相比共位置 大约能让每节点吞吐量 翻倍──

### Tek aşamalı vs. çok aşamalı kalite

InternVL3  Ana referans iddiası: 78B paramlarda 下匹配 Gemini 2.5 Pro'nun MMMU-Pro──在 38B 下匹配 GPT-4o──在 8B 下领先 open-8B leaderboard──全部基于单阶段预训+指示调调配方──

Düzeltme- borç hipotezi ise: Görüş-benchmark kazancı ile karşılaştırıldığında, InternVL3-8B, metin benchmarksinde %5 kaybı ile karşılaştırıldığında, Qwen2.5-VL-7B daha azı.

### InternVL3.5 ve InternVL-U

InternVL3.5 ((August 2025) bu tarifi genişletti. Aynı yerli-öğrenme yaklaşımı, daha fazla veri, daha fazla param.

InternVL-U(2026) birleşik nesile katılın,也就是在同一个脊椎上部通过MMDiT heads 输出图像──在这里的"U" 代表"Understanding + generation", Transfusion tarzı birleşik modellerini takip etmek.

### Doğan öncesi eğitim

Doğal öncesi eğitim ücretsiz değil:

- Hesaplama── baştan eğitim yeni bir VLM'in maliyeti ve eğitim bir metin LLM'nin maliyetinin büyük kısmını tasarruf etmek için  Post-hoc adaptasyonu
- Veri¬¬ Büyük ölçekli birbirine karışmış görüntü-metin korpusları 很稀缺──OBELICS 141M belgeler vardır;MMC4 571M──纯文本可以达到15T tokens──多模式预训数据稀缺是硬约束──
- Bas-LLM yeniden kullanımı. Native pretraining 放弃了之后换进入新 LLM 的选项.

InternVL3'ün 注是: yeniden kullanımı kayıplarından daha fazla uyum borcu daha kötü. Bendmark 支持这个主张──生产成本也阻止未来实验室 低成本复制──后期VLMs will continue to exist,因为大多数项目来说它们仍然更便宜──


```figure
l5-native-pretrain
```

## Kullan
`code/main.py`Bu bir eğitim-korpus karışımı ve ViR yönlendirme simülatörü.

- 接收一个目标 corpus mix(%text、%interleaved、%caption、%video),并计算每种方式的预期步骤──
- Bir grup sorguda, "VIR" yönlendirmeyi yaparak, dağıtım: %50 düşük detaylı, %30 ortalama, %20 yüksek detaylı), ve ortalama token sayısını rapor ediyor.
- Base encoder vs LLM FLOPs  rapor DvD throughput tahminleri。
- Not: Post-hoc vs. native pretraining, parametre, hesaplama, veri ve beklenen uyum-borç belirtileri

## - Söyle.
本课会产 出 `outputs/skill-native-vs-posthoc-auditor.md` Özgür bir VLM eğitim planı belirle, bu bir audit olmalıdır yerel veya post-hoc, çizgi bir uyum-borç riski,并推 corpus mix.

## 练习
1. 估算 InternVL3-8B (doğuş öncesi tren) ve LLaVA-OneVision-7B (post-hoc) arasındaki hesaplama deltaları。GPU saatleri oranı yaklaşık olarak ne kadar?

2. InternVL3  rapor oranı %40 metin / %35 birbirine karışık / %20 başlık / %5 video. Eğer hedefiniz video ağırlıklı ise, yeni bir oran önerin,并论证为什么基础模型仍然需要大量的文字和字幕数据──

3. MM1.5 Bölüm 4'te unutma içeriği hakkında. Post-hoc eğitiminde en büyük gerileme göstergesi olduğunu söylüyor. Bu gerileme ne kadar kaybetti?

4. ViR trafiğin %60'ını düşük çözünürlüklü kodlama yoluyla yönetecek.

5. DVD'nin vizyonu ve LLM'nin farklı GPU'lara bölünmesi.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Native multimodal pretraining | "From scratch together" | Text + image + video tokens 从第 1 步开始参与 Loss，而不是之后再接上 |
| Alignment debt | "Post-hoc penalty" | 由把 vision 接到 frozen LLM 上导致的 text skills 和 answer consistency 可测量退化 |
| V2PE | "Variable visual pos encoding" | 每个 modality 的可学习 position encoding allocation；InternVL3 的 M-RoPE 后继方案 |
| ViR | "Resolution router" | 小 classifier，在 encoding 前按 query 选择所需最低 resolution，从而节省 inference tokens |
| DvD | "Decoupled deployment" | Vision encoder 在一个 GPU 上，LLM 在另一个 GPU 上，并通过 stream handoff；可让大型 VLMs 的 throughput 翻倍 |
| InternVL-U | "Unified understanding + generation" | 2026 年后续版本，为 native-pretrain backbone 加入 image-generation heads |
| Interleaved corpus | "OBELICS / MMC4" | 文本和图像按自然阅读顺序排列的 documents；native pretraining 的原材料 |

## 延伸阅读
- [Chen et al. — InternVL 1 (arXiv:2312.14238)](https://arxiv.org/abs/2312.14238)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
- [InternVL3.5 (arXiv:2508.18265)](https://arxiv.org/abs/2508.18265)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Zhang et al. — MM1.5 (arXiv:2409.20566)](https://arxiv.org/abs/2409.20566)
