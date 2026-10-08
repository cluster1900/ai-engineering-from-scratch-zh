# 面向 Ajanların Anlaşması ve Bizans Suç Tahammülü

> Klasik dağıtılmış sistemler BFT                                                                                                                                                                                                                                                           **CP-WBFT**(arXiv:2511.10400)                                                                                                                                                                                                                                                           **DecentLLMs**(arXiv:2507.14928) 采用无领导方式,并行工人提案与几何-中介聚合;**WBFT**(arXiv:2505.05103) ağırlıklı oylama ile Hiyerarşik Yapı Clustering 结结,把节点分分为核心和边缘── 来自 AI Ajanları Anlaşabilir mi? (arXiv:2603.01213) 诚实实实证结果是:即使是标量协议,今天也很脆弱,一个欺骗的代理就能破坏混合-of-Agent──BFT不必要但不充分──本课构建一个最小的BFT协议,注入三种代理特定攻击(拜占庭谎,精神病的合致,相关错误的单独种),并衡每种共识 如何应对──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**前置要求：**16 · 07 aşaması (Akıl ve Tartışma Topluluğu), 16 · 13 aşaması (Ortaq hafıza)
**Time:** 约 75 分钟

## 问题

Sizde N 个 LLM ajanı var, her biriniz bir cevap ortaya çıkıyor. Onların görüşleri birbiriyle aynı değil. Çoğu oy kullanıyor.

Şimdi bir aldatıcı ajanı kabul et, ya da bir sinfon ajanı kabul et.`f < n/3`, ve davranış isteklidir.2026 yılının gerçekliği şu: LLM düğümleri bile bile dürüstçe rastlantısal, ıntılı, ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırkın ırk

Klasik BFT(PBFT, 1999) hiç bir hata yok, ama tamamlanmamıştır── bu herhangi bir bit-flipping ile ilgilenir── bu üç dürüst ajanı işlemiyor.

## 概念
### Klasik BFT                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

Pratik Bizans Suç Tahammülü (Castro & Liskov, OSDI 1999)`f < n/3`Bu protokol üç aşamada oluşur.`n >= 3f + 1`个诚意或恶意节点之间对单个价值达成的协议――

Bu garantiler çok güçlü, ama aşağıdaki varsayımlar var:

1. **Independent faults。**Bizanslılar İktidarı
2. **Honest nodes 确实诚实。**Dürüst sonuçların doğruluğu bir sorun değil. Protokol sadece anlaşmazlığa karşı.
3. **问题存在 ground-truth answer。**Hatalar konusunda bir fikir birliği elde edilmiştir.

LLM ajanları  üç noktayı çiğnedi. Aynı temel modelin iki işleyişinin ajanları ortak hatalar yapacaktır.

### Üç çeşit LLM özel saldırı

**Byzantine lie。**Bir ajan yanlış bir cevap verir.`f < n/3`, klasik BFT 能处理它──

**Sycophantic conformity。**Bir ajan oylama öncesi diğerlerinin cevaplarını okuyor ve son konuşan kişiyle uyumlu davranıyor. Bu kötü niyet değil, ama en yüksek sesle ilişkili olacaktır.

**Correlated-error monoculture。**Üç ajan ortak bir temel model paylaştılar. Onlar aynı yanlış cevaptan halüsinasyonlar yaptılar. Çoğu kişi yanlış cevaplar verdi.

### 2025-2026 yılları

**CP-WBFT**(arXiv:2511.10400)  Güven-Dayanık Ağırlaştırılmış BFT。 Her seçmen  kendi cevaplarına bir güven sorguya ekleyin(Öz rapor olasılık, veya ayrı kalibrasyon modeli tahminleri)。Vote ağırlıkları  güven ile  küçülmüş。 rapor称 trên komplet grafikler BFT iyileşmesi 为 +85.71%。Mitigation 目标:sycophantic conformity(conforming agents 往往对其主动给定的位置信心 较低)。

**DecentLLMs**(arXiv:2507.14928)  无领袖── İşçi ajanları 并行提出提案, değerlendirici ajanları 打分,最终答案是得点的位置的几何中介──当`f < n/2`时具备强性──Mitigation 目标:Byzantine lie 和 correlated errors(geometric median vs. outliers robust,并拉向密集集群,而不是模型偏差平均)。

**WBFT**(arXiv:2505.05103)  Yerarşik Yapılama Gruplama ile ağırlanan BFT  Vot ağırlıkları  Cevap kalitesi  加上从历史学习到的信任分分配──将代理 聚类为核心和边缘;Core agents 必须先达成共识,Edge agents 跟随着──Mitigation 目标:scalability(Core consensus 小而快) 以及部分应对单文化(Core 可按多样性 选择)

### 实证:AI ajanları kabul edebilir mi? (arXiv:2603.01213)

Bu makale  Ölçmek çok sınır modelleri                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

- Hatta rakipleri olmasa bile, LLM ajanları, birçok referans değerinde, ölçekli sorularda anlaşmazlık oranları da %30'dan fazla.
- 单个采用欺骗人的代理 可将 混合-of-agents 统一 拉离诚实基线 40+百分点──
- Anlaşmazlık oranları ile model çeşitliliği 相关; homogyen ensemblelerden farklı ensemble 分歧更多 (tanışmazlık oranları), ama akış da daha yavaş (坏处: zaman-to-agreement 更长) ◊

Sonuç:BFT  size hazırlık çıkışları sağlayan mekanizma, ama bunun size hazırlık çıkışını doğru olup olmadığını söylemiyor.

### Çekilme Çekirdek Protokolü

LLM ajanlarının en küçük BFT turuna:

```
1. task arrives; each agent i produces answer a_i
2. each agent attaches confidence probe c_i in [0, 1]
3. aggregator collects (a_i, c_i) from all n agents
4. aggregator groups by semantic cluster (equivalent answers)
5. aggregator computes weight for each cluster C:
     w(C) = sum_{i in C} c_i
6. winner = cluster with max weight, if max > threshold * sum(c_i)
   else: retry or escalate
7. minority clusters logged with provenance for post-hoc audit
```

semantik gruplama 步骤是LLM-spesifik önemli değişikliklerdir.

### Sınır ayarlama

`threshold`Parametre karar verir 何時接受、何時重試──過低:You will accept weak majority──過高:You will never accept anything── deneyim kapsamı:对 `n=5-7`- 0.5-0.67; daha küçük.`n`需要更高值──低于值时,escalate 给人类或另一个代理组──

### Anlaşma 无法提供帮助的地方

- **Ambiguous questions。**Eğer sorun temel bir gerçek yoksa, konsensüs bir fikirdir.
- **Compound questions。**Kodu yaz ve açıkla  是两个答案──分别对每个答案投票──
- **Adversarial multi-round。**Eğer ajanlar önceki turları gözlemleyip 2023 tartışmasını taklit ederlerse, birbirlerine kabul etmeye başlarlar, gerçeği düşünmeden.


```figure
swarm-consensus-wave
```

## Yapın onu.
`code/main.py`实现:

- `AgentVoter` 带有 ( cevabı, güven) yazılı politikası
- `MajorityVote` 经典 çokluğu。
- `CPWBFT` 带 semantik gruplama 
- `DecentLLMs` On skorlu öneriler 上 yapın geometrik-medyen birleştirme
- `Scenario` 在三种攻击模式 下运行每个聚合器──

已实现的攻击模式:

1. `byzantine`Bir ajanı yüksek güvenle yalan söylüyorum.
2. `sycophancy`Bir ajan, gördüğü ilk cevabı kopyalayıp, güvenle karşılıklı bir şekilde kullanır.
3. `monoculture`Üç ajan ortak bir yanıt yanlış bir yanıt, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven, güven

运行:

```
python3 code/main.py
```

预期输出:一张 (saldırı, birleştiricisi) -> son cevap 表,并高亮正确答案──多元化在单培养中失败──CPWBFT'in güven ağırlığı 缓解 sycophancy──Düzgün LLM'lerin geometrik ortalaması monoculture 少于总体一半时会拉向诚实集群──

## Kullan
`outputs/skill-consensus-designer.md`Çoklu ajanlar topluluğu  tasarım konsensü protokolü: gruplama yöntemi  ağırlıklandırma  eşiği ve alt eşiği döngüleri 

## - Söyle.
Hangi konsensüs mekanizması yayınlanmadan önce:

- **至少用上面三种 patterns 做 attack-test。**Senin protokolün başarısız olması gerektiğini tahmin etmelisin.
- **记录每个 minority cluster** ve kökenleri;; azınlık grupları korellemelerinin erken uyarı sistemini keşfettiler;;
- **强制 bounded rounds。**Anlaşmaya varana kadar tartışmaya devam etmeyin, bu da bir ikiliğe yararı olur.
- **将 agreement 与 correctness 分离。**Konsens çıkışı verifiye verifiye; verifier  bağımsız bir grup olarak
- **监控 agreement rate。**Aksi bir yükselme uyum kaydını ifade eder; aksi bir düşüş model sürüşünü ifade eder.

## 练习
1. 运行  İşlem`code/main.py`❖ Bir tek kültür saldırısında çoğulluğun doğrulanması, başarısız olduğu, ancak tek kültür güveninin 0.7'den düşük olduğu zaman CPWBFT 能部分缓解──
2. 添加第四种攻击模式:**silent abstention**,一个代理 拒绝回答(I don't know)。每个集体 应如何处理弃权?实现你的选择──
3. Sıfır kanonikasyonundan semantik gruplama 换成嵌入-semblarity (bütün açık kaynaklı gömleyici modeli kullanmak)  psikofans saldırısı 会发生什么变化?
4. 阅读 CP-WBFT (arXiv:2511.10400)  güven-sonde kalibrasyonunu gerçekleştirmek 步骤((tek bir kalibrasyon modeli 检查每个代理自报的信心) Monokultur senaryolarının yukarıdaki doğruluk kazanımını ölçmek 
5. 阅读 AI ajanları kabul edebilir mi? (arXiv:2603.01213)。复现一个简化的规模协议实验:三个代理、一个规模问题、欺骗性-个人的提示──CPWBFT 或 DecentLLMs 能抓住它吗?

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| BFT | “Byzantine fault tolerance” | Castro-Liskov 1999 protocol，用于在 `f < n/3` arbitrary faults 下达成 consensus。 |
| Byzantine | “任何坏行为” | 一个可以撒谎、丢弃 messages、静默失败的节点，除了安全 crash 外什么都可能做。 |
| Confidence probe | “你有多确定？” | 附加到 vote 上的自报或 calibrator-predicted probability。 |
| Semantic clustering | “同一答案，不同表述” | 在 counting votes 之前对等价 answers 分组。 |
| Geometric median | “Robust center” | 最小化到 sample points 距离之和的点。与 mean 不同，它对 outliers robust。 |
| Monoculture | “相同 model，相同 failures” | agents 共享 training data 或 base model 时产生的 correlated errors。 |
| Sycophantic conformity | “同意最大声的声音” | agent 的 vote 偏向最先/最大声发言的人。 |
| Core/Edge | “Hierarchical BFT” | WBFT 拆分：小规模 Core 先 consensus，Edge nodes 跟随。限制 latency。 |

## 延伸阅读
- [Castro & Liskov — Practical Byzantine Fault Tolerance (OSDI 1999)](https://pmg.csail.mit.edu/papers/osdi99.pdf) 基础
- [CP-WBFT — Confidence-Probe Weighted BFT](https://arxiv.org/abs/2511.10400) 按信任 投票 ağırlığı yapılması
- [DecentLLMs — leaderless multi-agent consensus](https://arxiv.org/abs/2507.14928) Geometri-medyen birleştirme
- [WBFT — Weighted BFT with Hierarchical Structure Clustering](https://arxiv.org/abs/2505.05103) Sınırlı gecikme için Core/Edge bölümü
- [Can AI Agents Agree?](https://arxiv.org/abs/2603.01213) Skala anlaşması kırılganlığı
