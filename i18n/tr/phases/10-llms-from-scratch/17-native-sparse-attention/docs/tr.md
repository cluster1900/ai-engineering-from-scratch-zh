# Doğal Sparse Dikkat (DepSeek NSA)

> 64k Token'de, dikkat 70 ila 80%'i çözecek 延迟。 her açık model 实验室'da özelleştirme projeleri vardır。DeepSeek'in NSA(ACL 2025 best paper) gerçekten sabit bir projeler: üç paralel dikkat bölümü, yani sıkıştırılmış sertleşme tokeni、 seçkinlik korumalı inceleşme tokeni, yanı sıra yerel bağlamda kullanılacak kaydırma penceresi, öğrenilen kapı 组合ı üzerinden birlikte birlikte kullanılır。 bu, donanımlı olarak uyumlu ♡ çekirdek dostu ♡ doğuştan eğitimlenebilir ♡ aynı zamanda ön eğitim için kullanılabilir, sonuçlama zamanında değil) ve 64k kod üzerinde, FlashAttention daha hızlı, dikkatle dolu kaliteye ulaşmak veya aşmak için daha hızlıdır。 本, bu üç bölümü oluşturmak için terminal bağlantılı olacaktır.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 12 (KV cache, flash-attention), Phase 7 · 15 (attention variants), Phase 10 · 16 (differential attention)
**Time:** ~60 minutes

## Öğrenme hedefi

- NSA'nın üç dikkat bölümü ve her bölümü neyi yakaladığını anlatın.
- NSA'nın neden doğuştan eğitimlenebildiği açıklanmaktadır.
- 64k bağlamında aşağı, basınç blok boyutu ve seçim üst-k, hesaplama NSA göre tam dikkat 計算节省量
- Bir kısa sentezi dizisinde, stdlib Python ile 三分支组合,并验证 gating weights 行为──

## 问题

序列长度为 N 时,Full attention 的时间成本是 `O(N^2)`, her kat KV depolama `O(N)`▽ 64k Token 下, hesaplama ve hafıza bant genişliği 数字都非常灾难──NSA 论文中的理论估计测量值显示:在 64k 下,Atention 占总解码 延迟的 70-80%──后续所有指标,包括 TTFT、tokens/sec、每百万 Token 成本,都被注意 成本主导──

Sıkıntılı dikkat, açıkça görülebilir bir cevaptır. Bu iki kategoriye ayrılır. Sıkıntılı düzenli düzenli düzenli düzenliliği, bilgiyi bırakır ve uzun mesafeli hatırlama görevinde başarısız olur.

Native Sparse Attention(Yuan et al., DeepSeek + PKU + UW, ACL 2025 best paper, arXiv:2502.11089) duare兼具:模型在预训期间学习的稀缺性模式,以及一个内核对齐的算法实现,使它在推断时真正交付计算节省──两年后,NSA 或其直接后方案将成为每个边界长文本模型的默认注意──

## 概念

### Üç tane yol ayrılığı

Her soruya karşı NSA, KV cache'i üç farklı video kullanıyor.

1. **Compressed branch.**Token 被分组为大小为 `l`Bu bloklar genellikle 32 veya 64'e sahiptir. Her blok küçük bir öğrenilmiş MLP ile tek bir özet tokeni haline sıkıştırılır.

2. **Selected branch.**Kullanın sıkıştırılmış dalın Dikkat puanları, tanımlamak için mevcut sorguyla ilgili en üst-k blokları, okuyun bu blokların içindeki küçük parçaları, sonra sorgu tüm bu işaretlere katılacak.

3. **Sliding-window branch.**Sorguya katılmak için son `W`个 Token (öntenlikle 512 olarak) yerel bağlamda kullanılır. Bu bölge diğer iki bölgeyi ele alır.

Üç bölümden bir çıkış öğrenilen pozisyon kapısı 组合:

```
out = g_cmp * out_cmp + g_sel * out_sel + g_win * out_win
```

`g_cmp, g_sel, g_win`Bu, küçük MLP'lerin ırmak ağırlıklarının oluştuğu bir kapı ağırlığıdır.

### Neden bu native eğitimlidir

Seçim adımları (top-k blokları) 离散的──离散操作会破坏渐流──此前的稀疏注意工作要么跳过选择的 Backpropagation (seçimi) 限制训练),要么使用连续放松,而这些方法在推论中无法提供真正稀疏性──

NSA bu noktayı çeviriyor: sıkıştırılmış dal Dikkat, tüm dizinin küçük kaba miktarına etkilidir Dikkat, üst-k işlem sadece sıkıştırılmış dalın en yüksek dikkate değerlerini tekrar kullanır Dikkat, hangi küçük parça bloklarını yüklemesi gerektiğini seçer.`top_k`Operasyon ön yönlü hesaplama grafikinde üstü no-op, sadece hangi bloklar kontrol edilir.

Bu nedenle NSA'nın önceden eğitim için sonuna kadar kullanılabilmesinin nedeni budur.

### Hardware-ağırlaştırılmış çekirdek

NSA'nın çekirdeği, modern GPU bellek hiyerarşisi için tasarlanmıştır. GQA grubu göre çekirdeği, her grup için nadir KV bloklarına karşı gelmeyi başlatır.

Rapor raporunu,Triton çekirdekleri 64k dekode eder 快 9x, ve hızlandırma oranı 会随序列长度增长────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

### 计算预算

Yapmak`N`Çeviri uzunluğu,`l`Sıkıştırma blok boyutu için,`k`Top-k seçimi sayımı için,`w`Çekilen pencereden,`b`Seçilen blok boyutu için genellikle `l`)。

- Sıkıştırılmış dal: her sorgu var `O(N/l)`个 anahtar, therefore总计 `O(N * N / l)`- Evet.
- Seçili dal: her sorgu var `O(k * b)`个 anahtar, therefore总计 `O(N * k * b)`- Evet.
- Her sorunun var .`O(w)`个 anahtar, therefore总计 `O(N * w)`- Evet.

总计:`O(N * (N/l + k*b + w))`- Evet.

- Evet .`N = 64k, l = 64, k = 16, b = 64, w = 512`: Her sorunun maliyeti`1000 + 1024 + 512 = 2536 keys`❖ Tam dikkat`64000 keys`◊ 25 katı azaltılmış.

- Evet .`N = 128k, l = 64, k = 16, b = 64, w = 512`: Her sorunun maliyeti`2000 + 1024 + 512 = 3536 keys`❖ Tam dikkat`128000 keys`❖ 36x ❖ kazançlar sırada uzunluk artışıyla birlikte, bu da temel anlamıdır.

### Nasıl karşılaştırılır?

| Method | Differentiable | Real inference speedup | Long-range recall |
|--------|---------------|----------------------|-------------------|
| Sliding window only | yes | yes | fails |
| Strided / block-sparse | yes | yes | partial |
| KV pruning (H2O, StreamingLLM) | N/A (inference-time) | yes | partial |
| MoBA (Moonshot) | partial | yes | good |
| NSA | yes (natively) | yes (9x at 64k) | matches full attention |

MoBA(Moonshot, arXiv:2502.13189) aynı dönemde yayınlanan, aynı zamanda benzer bir 三个胜过一个的思路, MoE 原则将应用到注意区块──NSA 和 MoBA 是理解 2026 uzun bağlamlı ön eğitim 必须掌握的两个架构──


```figure
sliding-window-attention
```

## Yapın onu.

`code/main.py`Bir kısa yapım dizisinde üç bölgeyi gerçekleştirmek ve göstermek:

- sıkıştırma MLP((Kesinlik öğretmek için, basit bir ortalama bir temel çizgi kullanın; gerçek NSA kullanın öğrenilmiş MLP)。
- Sıkıştırılmış dal puanları tarafından 驱动的顶级k块选择──
- Son zamanlarda`w`个Token 上的滑窗 dikkat.
- Kapalı kombinasyon.
- Hesaplama baskılarına tam dikkat edin.

### 步骤 1: Tokenleri bloklara basın

```python
def compress(K, l):
    n = len(K)
    n_blocks = (n + l - 1) // l
    out = []
    for b in range(n_blocks):
        start, end = b * l, min((b + 1) * l, n)
        block = K[start:end]
        summary = [sum(row[d] for row in block) / len(block) for d in range(len(K[0]))]
        out.append(summary)
    return out
```

### 步骤 2: sıkıştırılmış dal Dikkat

运行 sorgu 针对压缩键的软max Attention──压缩分分 同时作为顶级k 选择的信号──

### 步骤 3: üst-k blok seçimi

En yüksek puanı seç .`k`个压缩块的索引──加载这些块 中的原始未压缩代币,并在其上运行 注意──

### 步骤 4: kaydırıcı pencereler Dikkat

Sonunda`w`个Token,并针对它们运行标准注意──

### 步骤 5: kapı + kombinasyon

sorgu 上的小型 MLP 产生三个门权量──最终输出是三个分支输出的权重总量──

### 步骤 6: hesap sayımı

印每分支、每查询出席的键 数量以及总数──与 `N`(tam dikkat) karşılaştırma yapın.`l = 32, k = 4, w = 128`- NSA'nın her sorusu.`32 + 128 + 128 = 288`Anahtarlar, tam dikkat 1024'e, 3,5 katı düşmüş.

## Kullan

NSA, DeepSeek'de bulunuyor. Kendi uzun bağlamlı eğitim öncesi boru hattı içinde kullanımı.

- **DeepSeek internal**: native, has been issued权重使用 NSA veya 后继 DSA (Deepseek Sparse Attention)
- **vLLM**DeepSeek-V3.x ağırlıkları için deneysel NSA desteği geliştirmek üzere.
- **SGLang**: NSA referansları yayınlandı; üretim yolu ve vLLM
- **llama.cpp / CPU**: Not supported; in CPU throughput, nörel parçalanmasının açık satış değeri yok.

NSA ' yı kullanmak için ne zaman ?

- 面向64k+ bağlamı ve sert hesaplama bütçesi vardır ön eğitim veya devam eden eğitim çalışması
- DeepSeek'in kendi uzun bağlamlı kontrol noktalarına karşı sonuç çıkarmak için.

Ne zaman kullanma:

- 现有密集注意预训模型──没有继续培训,无法后备 NSA──
- Kontext 低于16k──三分支开销会超过省收益──
- Batch-1 interaktif sohbet, gecikme hassaslığı dekode, ancak sadece uzun bağlamlarda.

## - Söyle.

本课会产 出 `outputs/skill-nsa-integrator.md` Uzun bağlamlı bir eğitim öncesi çalışmanın özelliklerini belirlerken, NSA entegrasyon planı oluşturur: sıkıştırma blok boyutu, üst-k, kaydırma penceresi, kapı MLP genişliği, çekirdeği seçimi ve yapıların daha mantıklı hale geldiğini kanıtlamak için özel uzun bağlamlı değerlendirmeler.

## 练习

1. 1024-Token  sintet序列上运行 `code/main.py`Üç ayarlı bir süpürge.`(l, k, w)`Ve yazdır hesap sayıları. Arama İğne-hay-stack testinde bulunup, %95 geri çağırma sırasında, her sorgu anahtar sayısının en düşük ön ayarını tutmak.

2. Ortalama havuz kompresörü değiştirmek için küçük bir öğrenilmiş MLP ((2-katay, gizli 32) ⋅ en az bir sinyalde blok 平均值の合成任务上訓練します.

3. 实现 gate MLP── it is used in query 作为输入,输出三个 skalar──展示 gate 的行为 is reasonable: 在随机查询上接近均权重; 当查询命中远前的块时,对选分支给出较高权重──

4. 計算 NSA-enabled 70B 模型在 128k bağlamında 下的 KV cache memory budget──KV heads 为 8,head dim 为 128,BF16──与全注意以及 MLA(Phase 10 · 14 显示了 MLA 的数字) 进行比较──查找 NSA 的细粒子分支 KV cache 等等到全注意序列长度──

5. 阅读 NSA 论文(arXiv:2502.11089) 第 4 节,并用三句话解释为什么压缩分的注意分会被重复用于顶级选项,而不是计算一个单独的路由分点――将答案关联到渐进流――

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Compressed branch | “粗粒度视图” | 在 block-averaged keys 上做 Attention，以每个 query `O(N/l)` 个 keys 提供 global context |
| Selected branch | “Top-k blocks” | 在 compressed-branch scores 最高的 `k` 个 blocks 上做细粒度 Attention |
| Sliding window | “Local context” | 在最后 `W` 个 Token 上做 Attention，以捕获短程模式 |
| Native trainability | “打开 sparsity 进行 pre-train” | sparsity pattern 在 pre-training 期间学习，而不是在 inference 时外挂 |
| Compression block size l | “粗粒度视图的 group size” | 多少个 Token 被合并成一个 summary；通常为 32-64 |
| Top-k | “要保留的 blocks” | 读取其未压缩 Token 的 compressed blocks 数量；通常为 16 |
| Sliding window W | “Local attention radius” | 通常为 512；更短会损害 local coherence，更长会浪费计算 |
| Branch gate | “如何混合三个分支” | per-position MLP 输出，对三个分支的贡献加权 |
| Hardware alignment | “Kernel-friendly sparsity” | 选择 sparse pattern，使实际 GPU kernel 能达到理论 speedup |
| DSA | “NSA 的后继者” | Deepseek Sparse Attention，DeepSeek 系谱中继 NSA 之后的架构 |

## 延伸阅读

- [Yuan et al. — Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention (arXiv:2502.11089, ACL 2025 Best Paper)](https://arxiv.org/abs/2502.11089) 论文
- [DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437)NSA'nın 面向的架构家族
- [Moonshot AI — MoBA: Mixture of Block Attention for Long-Context LLMs (arXiv:2502.13189)](https://arxiv.org/abs/2502.13189) 同期工作, bloklara yönelik MoE tarzı Dikkat
- [Beltagy et al. — Longformer: The Long-Document Transformer (arXiv:2004.05150)](https://arxiv.org/abs/2004.05150) kaydırma penceresi 起源
- [Xiao et al. — StreamingLLM: Efficient Streaming Language Models with Attention Sinks (arXiv:2309.17453)](https://arxiv.org/abs/2309.17453) NSA 改进的推理-時間短缺基线
- [Dao et al. — FlashAttention-2 (arXiv:2307.08691)](https://arxiv.org/abs/2307.08691)NSA çekirdekleri 64k'te alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü alt üstü üstü alt üstü üstü üstü alt üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üstü üst
