# Farklı Dikkat (V2)

> Softmax Dikkat Toplama, her eşleşmeyen Token üzerinde dağıtılan az miktar muhtemellik. 100k 个 Token üzerinde, bu sesler toplanır ve sular sinyaller. Farklı Transformer(Ye et al., ICLR 2025) tarafından Dikkat  hesaplama iki softmax 差来 olarak bu sorunu çözmek, böylece paylaşılan gürültü sınırını azaltmak için.

**类型:**Yapım
**语言:**Python (stdlib)
**前置要求:**7 · 02 aşaması (kendine dikkat), 7 · 15 aşaması ( dikkat çeşitleri), 10 · 14 aşaması (architektür yürüyüşü)
**时间:**~ 60 dakika

## Öğrenme hedefi

- 准确说明为什么softmax dikkat 噪音下限,以及为什么随着背景长度 增长而言
- 推导 公式,并解释为什么相减会抵消共享噪音成分,同时保留信号──
- V1 ile V2 arasındaki farkı açıklayın: hangi bölümler daha hızlı, daha basit, daha istikrarlı ve neden üretim seviyesindeki önceden eğitimdeki her değişiklik gereklidir.
- Temiz Python kullanarak sıfırdan farklı dikkat elde etmek ve bir yapay sinyal-arsı sorusu üzerinde bir kanıt kanıtlama ses çıkış özelliği

## 问题

标准 softmax Dikkat bir matematiksel özellik vardır, büyük ölçüde değişir ve mühendislik sorunları haline gelir.`q`Dikkatli olun.`softmax(qK^T / sqrt(d))` Softmax 永远无法产生精确的零值每个不匹配的代币都会得到一些正质的质量──这个残余质量就是噪音,并且会随着背景长度扩大──在128k 个代币下,即使每个不匹配的代币也只获得0.001%的概率,127.999 代币 合并也会贡献约12%的总量──模型必须学会绕开一个随着背景 增长的噪音下限──

Bu durum, dikkat başı 干扰:long-context RAG'de 幻觉引用、100k-Token 检索任务中失败中失败,以及针内haystack benchmark 在32k 后出现的细微精度下降.

DIFF V1'de üç sorun var, ön kenar ön eğitim borusuna girmesini engellemiştir. Her dekodlama aşamasında iki kez yüklenmesi gerekir. Özel CUDA çekirdekleri gerektirir. FlashAttention 兼容性'i bozar. Ayrıca, 70B'den fazla uzun süreli eğitim sırasında başına RMSNorm'u dengesizliğe yol açar.

## 核心概念

### Softmax'ın ses sınırları

Sorgu için .`q`和 anahtarları `K = [k_1, ..., k_N]`Dikkat 权重是:

```
w_i = exp(q . k_i / sqrt(d)) / sum_j exp(q . k_j / sqrt(d))
```

Hiçbir şey yok .`w_i`- Evet, evet.`k_i`ile`q`Tamamen yok, puan.`q . k_i`0'dan değil, 0'dan çevresinde.`||q||^2 / d`△ Softmax normallendirilmesinden sonra, her bir token ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒    ⇒ ⇒    ⇒ ⇒     ⇒  ⇒     ⇒      ⇒       ⇒       ⇒                                                                                                                                                                                                                                          `O(1/N)`△无关 Token'ın toplam katkıları `O((N-1)/N) = O(1)`Bu küçük bir şey değil.

Model istedigi daha çok görünüşü sert üst-k: 匹配 Token 上给高权重,在其他位置接近零──软max 过于平滑,不能直接做到这一点──

### Farklı fikir

Bu iki haritayı hesaplayın:

```
A_1 = softmax(Q_1 K_1^T / sqrt(d))
A_2 = softmax(Q_2 K_2^T / sqrt(d))
```

输出:

```
DiffAttn = (A_1 - lambda * A_2) V
```

Eğer iki harita 127k'lik bir tokenin üzerinde yakın bir eşit ağırlık varsa (gerçekten de böyle olur), bu kısımlar birbirine karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı

`lambda`Her başta bir öğrenilme ölçüsü, parametre olarak`lambda = exp(lambda_q1 dot lambda_k1) - exp(lambda_q2 dot lambda_k2) + lambda_init`- Bu bir sorun.`lambda_init`默认是类似 0.8 的小正数──

### Neden bu başlı bir ses çıkartmak gibi

Aynı sesle kayıtlı iki gürültülü mikrofon olarak düşünebiliriz. İkisi de konuşmacıyı ve ilgili arka plan gürültüsünü kaydeder. Bir sinyalden diğerini çıkarırsak, paylaşılan gürültü düşer.`lambda`Öğrenmek için tam olarak bu tarafa.

### V1 vs V2: fark

V1  baseline Transformer ile aynı parametreyi koruyor. Ve böylece her başın iki sorusu var, baş boyutunu  yarım düşürüyor. Bu da başın ifade yeteneğini kurban ediyor. Daha acı da olsa, her başın değerini  yarım düşürüyor.

V2 sorgu başlarını sayı artıracak,并保持 KV başlarını 不变(up-projection 借用参数) ・・・Head dimension 保持与基线相同──相减后,额外维度将被投影回去,以匹配基线变压器的O_W投影──三件事同时发生:

1. Deşifreleme hızı baseline 持平(KV kasesi sadece bir kez yüklenir)
2. FlashAttention 可原样运行(Kustom çekirdek gerekmiyor)。
3. HBM'den her seferinde byte yüklenmesi 时对应更多计算)

V2 ayrıca V1'i, başına RMSNorm'un sabitleştirme ve işlem azaltma sistemini değiştirdi. 70B seviyesinde eğitim öncesi ıska altında, bu RMSNorm, sonraki dönem eğitiminin sabitsiz olmasını sağlayacak.

### Nasıl kullanılır ?

| Workload | Benefit |
|----------|---------|
| Long-context RAG (64k+) | 更干净的 Attention maps，更少幻觉引用 |
| Needle-in-haystack benchmarks | 32k 之后 accuracy 显著提升 |
| Multi-document QA | 更少跨文档干扰 |
| Code completion at 8k | 收益有限，不值得改变 architecture |
| Short chat (< 4k) | 基本与 baseline 不可区分 |

收益会随着背景长度 增长而增加──在4k Token 下,噪音下限足够小,标准注意 已可用──在128k 下,明显伤害效果开始──

### Diğer 2026 düğmelerle nasıl bir şekilde eşleşebilir?

| Feature | Compatible with DIFF V2? |
|---------|------------------------|
| GQA | 是（V2 增加 Q heads，而不是 KV heads） |
| MLA (DeepSeek) | 原则上是，但尚无公开论文将二者结合 |
| MoE | 是（Attention 独立于 MLP block） |
| RoPE | 是（不变） |
| YaRN / long-context scaling | 是（正是 DIFF 最有帮助的场景） |
| FlashAttention | 是，V2 支持（V1 不支持） |
| Speculative decoding | 是（Attention 改动对 spec-decode loop 不可见） |


```figure
differential-attention
```

## Yapın onu.

`code/main.py`Temiz Python ile edifferential attention ı gerçekleştirdi. Bilinen sinyal artı gürültü  yapısal oyuncak sorusu, doğrudan ses çıkış oranını ölçmenize olanak sağlar.

### 步骤 1: standart softmax dikkat

Stdlib Matrix ops: listeler listesi,                                                                                                                                                                                                                                                         

```python
def softmax(row):
    m = max(row)
    exps = [math.exp(x - m) for x in row]
    s = sum(exps)
    return [e / s for e in exps]
```

### Adım 2: İki bölüme ayırmak

V1 风格:将头寸 减半──V2 风格:保持头寸,并将头数量加倍──toy uygulaması 为了教学清晰使用 V1数学完全相同,只有会计不同──

### 步骤 3: 两个软max rütbesi + 相减

```python
A1 = [softmax([dot(q1, k) / scale for k in K1]) for q1 in Q1]
A2 = [softmax([dot(q2, k) / scale for k in K2]) for q2 in Q2]
diff_weights = [[a1 - lam * a2 for a1, a2 in zip(r1, r2)] for r1, r2 in zip(A1, A2)]
out = [[sum(w * v[j] for w, v in zip(row, V)) for j in range(d_v)] for row in diff_weights]
```

Not: Output weight can be for negative. Bu hiç bir sorun değil. value cache                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

### 步骤 4: 噪声抵消测量

构建一个长度为 1024的合成序列──将信号标志 放置已知位置,其余位置填充噪声──计算 (a) 标准软max 注意 在信号位置上的权重,以及 (b) 权重的分别注意 权重――测量两者的信号-噪音比──根据两支训练到多大程度产生差异,DIFF注意通常能稳定产生高出3x-10x的信号-噪音比──

### 步骤 5: V1 vs V2 参数核算

给定一个配置 ((hidden=4096, heads=32, d_head=128),打印:

- Baseline Transformer: Q、K、V V`hidden * hidden`,MLP 4 * gizli
- DIFF V1: Q、K Çeşitli büyüklükte`hidden * hidden`,V büyük küçük `hidden * hidden`(不变), başı dim 在内部减半──增加 per head `lambda`Başlar başlar başlar başlar
- DIFF V2: Q`2 * hidden * hidden`,K büyüklük için`hidden * hidden`,V büyük küçük `hidden * hidden`额外维度会在 O_W 前投投回去──增加相同 `lambda`参数。

Oyuncak 会测量 V2 额外参数成本(大约每个注意区 额外 `hidden * hidden`- ... (Müzik)

## Kullan

截至2026年4月,DIFF V2  henüz her üretim sonuç sunucusunda yayınlanmamıştır, ancak vLLM 和 SGLang, bir araya gelmeye devam ediyor.

- Microsoft 内部 uzun bağlamlı 生产模型。
- Çok yönlü 256k+ bağlamı açık model eğitim çalışmaları çalışmaları.
- DIFF dikkatini, kaydırıcı pencere dikkatini, üst katmanlı hibrit mimarlıkların toplanması için kullanmak.

2026 yılında sen seçersin.

- Zero eğitimden 64k+ etkili bağlamı hedeflenmiş yeni modeller.
- Düzgün ayarlama 模型,且失败主导你的 eval──在 Q projeksiyonlarında 上做 LoRA DIFF 结构──

Sen seçemezsin.

- Uzun bağlamlı  performans sabit önceden eğitilmiş yoğun bir model servisinde bulunmaktadır.
- Çevresinde 16k'dan aşağıda olan sesler göz ardı edilebilir.

## - Söyle.

本课会生成 `outputs/skill-diff-attention-integrator.md` Bir model mimarisini belirlemek, hedef bağlam uzunluğu, halüsinasyon profili ve eğitim bütçesi, farklı ilgiyi  yeni önceden eğitim koşulu veya LoRA ince ayarlarını eklemek için bir entegrasyon planı oluşturur.

## 练习

1. 运行  İşlem`code/main.py`▽验证在合成查询 上,differential attention 报告的信号-噪音比 高于标准软max Attention。改变噪音幅度,并显示标准 Attention 变得不可用交叉点──

2. 7B sınıfı bir model için, baseline'den DIFF V1'e ve baseline'den DIFF V2'nin parametre değişimlerine göre, hangi bileşenlerin parametreleri artırdığını ve hangilarının değişmediğini göstermek için,

3. DIFF V1 论文 ((arXiv:2410.05258) Bölüm 3, ve DIFF V2 Hugging Face blogunun Bölüm 2'ünü okuyun.

4. 实现一个 ablation:分别用 `lambda = 0`(Pürest softmax)`lambda = 1`(完整相减) hesaplama farklılık dikkatı──在合成查询 上,测量信号-to-noise 如何随随扫 变化──找出能最大化信号-to-noise 的 `lambda`- Evet.

5. Oyuncak  GQA + DIFF V2  seçmek 8 个 KV başları 和 32 个 Q başları── göster KV önbelleği büyüklüğü ile aynı (8, 32) 配置的基线 GQA模型 匹配──

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Differential attention | “两个 softmax 相减” | 将 Q、K 拆成两半，计算两个 softmax maps，从第一个中减去第二个（由 lambda 缩放），然后乘以 V |
| Noise floor | “softmax 的非零尾部” | Softmax 放在每个无关 Token 上的 O(1/N) 权重，在 long contexts 中会累加到 O(1) |
| lambda | “相减的缩放系数” | 每个 head 的可学习标量，参数化为 `exp(lq1.lk1) - exp(lq2.lk2) + lambda_init`；可以为负 |
| DIFF V1 | “ICLR 2025 版本” | 原始 Differential Transformer；将 head dim 减半以保持参数量，需要 custom kernel，decode 更慢 |
| DIFF V2 | “2026 年 1 月修复版” | 在保持 KV heads 的同时将 Q heads 加倍；decode speed 与 baseline 持平，并兼容 FlashAttention |
| Per-head RMSNorm | “V1 稳定器” | V1 在差分之后应用的额外 norm；V2 移除了它，以避免后期训练不稳定 |
| Signal-to-noise ratio | “有多少 Attention 被浪费了” | 真实 signal 位置上的权重与无关位置平均权重之间的比率 |
| Lost in the middle | “Long-context failure mode” | 一个实证现象：长 context 中间位置文档的检索 accuracy 会下降——DIFF attention 可以缓解这一点 |
| Arithmetic intensity | “每加载一个 byte 对应多少 FLOPs” | V2 在 decode 时通过每次 KV 加载对应双倍 queries 来提高的比率；对 memory-bound decode 很重要 |

## 延伸阅读

- [Ye et al. — Differential Transformer (arXiv:2410.05258, ICLR 2025)](https://arxiv.org/abs/2410.05258) 原始论文,包含噪声抵消理论和长文脈ablations
- [Microsoft unilm — Differential Transformer V2 (Hugging Face blog, January 2026)](https://huggingface.co/blog/microsoft/diff-attn-v2) 面向生产的重写版本,匹配基线解码,并兼容 FlashAttention
- [Understanding Differential Transformer Unchains Pretrained Self-Attentions (arXiv:2505.16333)](https://arxiv.org/abs/2505.16333) 关于为什么相减能恢复预训练的注意 结构的理论分析
- [Shared DIFF Transformer (arXiv:2501.17900)](https://arxiv.org/html/2501.17900) 参数共享变体
- [Vaswani et al. — Attention Is All You Need (arXiv:1706.03762)](https://arxiv.org/abs/1706.03762) DIFF                                                                                                                                                                                                                                                             
- [Liu et al. — Lost in the Middle (arXiv:2307.03172)](https://arxiv.org/abs/2307.03172) DIFF dikkat 面向的长文本基准
