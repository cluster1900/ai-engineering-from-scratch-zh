# Jamba  Hibrit SSM-Transformer

> Devlet uzay modeli (SSM) 和 Transformer 想要的东西不同──Transformer 通过 Attention 换取质量,但代价是二次复杂性──SSM 通过递递推换取线性时间推理和常量内存,但质量落后──AI21'in Jamba(2024 yılının 3 ayı) ve Jamba 1.5 2024 yılının 8 ayı) onları aynı modele yerleştirdi: her 7 Mamba katmanı 1 变体 katmanı, her blokta MoE kullanıyor, ve 256k penceresi ile birlikte 80GB GPU üzerinde çalışır.──Mamba-3 ICLR 2026) sayısal kontajı ve MIMO projeksiyonları SSM tarafından güçlendirilmiştir.

**Type:** Learn
**Languages:** Python (stdlib, layer-mix calculator)
**前置要求:**10 · 14 aşaması (açık model mimarileri), 10 · 17 aşaması (özel ilgi)
**Time:** ~60 minutes

## Öğrenme hedefi
- 解释 Jamba blokları 中的三个原始性:Transformer tabakaları、Mamba tabakaları、MoE,以及 1:7:even 的交错配方──
- Yüksek seviyede SSM'nin öne süren biçimlerini ve neden sürekli miktarda bellek düşüncesini gerçekleştirebildiğini açıklıyor.
- 计算 Jamba 模型下的 KV cache 占用,并与纯变压器 模型所需内存进行比较──
- Mamba-3'ün üç yeniliği anlatmak için:

## 问题
Serisi uzunluğuna dikkat etmek ikinci karmaşıklıktır. Devlet uzay modeli ise doğaldır. Bu fark sürekli olarak artmaktadır.

Pure-SSM 模型(Mamba、Mamba-2) küçük ölçekte aşağıda uyum sağlayabilir Transformer karmaşıklığı, ancak devlet izleme  görevinde geride kaldı, ve bazı bağlam içi geri alım 类别上失败──直觉是:SSM tarihini sabit duruma sıkıştırır; tarih uzun zaman, bilgi sızdırılır──A dikkat 精确记住所有内容, but to pay out secondary complexity cost──

显而易见的修复方法:两者都用──在需要精确召回的地方放变压器层──其他地方使用SSM层──调节比例──Jamba, bu tür hibrid 配方 üretimi seviyesinin ölçeklendirilmiş şekilde teslim edilen ilk modeli olmuştur.

Bu dersi bu üç makaleyi okuyacak ve doğru oranı seçmek için bir düşünce modeli oluşturacak.

## 概念
### Bir sayfada bir SSM

Devlet uzay modeli  通过固定大小的状态 `h`处理序列  Yapım`x_1, ..., x_N`- ...

```
h_t = A h_{t-1} + B x_t
y_t = C h_t
```

Her adım, durum, doğal hareketlilik ile geçiyor.`A`演化,接收输入 `B x_t`,并输出 `C h_t`- Evet.`A, B, C`Öğrenmek için kullanılabilir.`y_t`Sadece ihtiyacım var.`h_{t-1}`和 `x_t`Daha önce bir şey gerekmiyor.`x`△内存 is常量―推理是每个符号 O(1)。

建模质量的关键在于 `A`Bu nedenle, bu programın en önemli yönü, eğitim sırasında uzun bir konvulsiyon olarak kullanılmasıdır.`A, B, C`替换为依赖数据的形式 (也就是 选择性) 部分 (Mamba-2)  2024 daha da basitleştirilmiştir 结构 (结构)  Mamba-3 (数据)  2026), 则在特定位置重新加入复杂性──

关键性质是: Dekoder için LLM,SSM katmanı sürekli büyüyen KV kasesi yerine sabit büyüklükteki bir katman durumunu kullanarak dikkat katmanı'nın doğrudan bir alternatif olarak kullanılabilir.

### Jamba blok

Jamba blokları iki rakamlı bir aşama göre:

- `l`: Dikkat-Mamba oranı。Jamba 使用 `l = 8`, gösterir her 7 个 Mamba 层配 1 个 Transformer 层(7 Mamba + 1 Dikkat = 每组 8 层) ⋅
- `e`: MoE frekansı。Jamba 使用 `e = 2`, gösterir her bir aşama uygulama MoE

blok 內层序列:

```
M  M  M  M  M  M  M  A    (7 Mamba + 1 Attention)
|  M  |  M  |  M  |  M    (where | marks MoE applied)
```

Her Jamba blok 8 katlılıkta. 4 katlılıkta.

### Neden 1:7 oranı

AI21 Ablations yaptı: What kind of attention-to-Mamba example can in their long-context evaluations 上 get best per-parameter per-context and in-context recall?

- Dikkat 太多(1:1):质量提升,但内存和速度变差──
- Dikkat çok az.
- En iyi noktası 1: 7 veya 1: 8..

直觉是:Transformer katmanları 处理精确召回和状态跟踪──Mamba katmanları 负责低成本的大部分处理──

### Konum kodlaması

Mamba katmanları 本身具有位置感知能力(通過递推) ・原始 Mamba tabanlı melezler arasında dikkat katmanları  RoPE kullanılmaz, çünkü SSM katmanları 位置信息を提供している。 Jamba 1.5 为 Attention layers  RoPE eklemek, daha uzun bağlam genelleşmesini güçlendirmek için; bu deneyim uzun bağlam değerlendirmesine dayalı gelişmeler。

### Hatırlama bütçesi

对于 Jamba-1 形状(32 层:28 Mamba + 4 Dikkat, gizli 4096,32 dikkat başları):

- KV cache( sadece Dikkat katmanları): в 256k BF16 下为 `2 * 4 * 32 * 128 * 256k * 2 = 8.4 GB` Sadece 4  dikkat katmanı  KV cache katkıda bulunmak 
- SSM durumu: her token öncü 为 `28 * hidden * state_size`, ama bu bir kat kat sabit büyüklük, dizi uzunluğu genişleme değil.`28 * 4096 * 16 * 2 = 3.7 MB`- Evet.

Aynı gizli 32 kat 32 başlı MHA'nın saf Transformer ile karşılaştırıldığında: 256k BF16`2 * 32 * 32 * 128 * 256k * 2 = 128 GB`KV cache  8x azaltılmıştı── hatta çoğu 2024 model kullanımı GQA 8) temel seviyeye göre`2 * 32 * 8 * 128 * 256k * 2 = 32 GB`),Jamba'nın 1:7 hibridinde 16 GB'nin altında hala küçük 2x¬

İşte AI21'in söylediği gibi 单张 80GB GPU 上的 256k konteks ──full-MHA pure Transformer'ın KV cache 放不下; hatta GQA temel hattı da neredeyse ağırlık ve aktivasyon 留空间 vermiyor; Jamba 可以──

### Mamba-3: 2026 yılının saf-SSM başlangıç çizgisi

Mamba-3(ICLR 2026, arXiv:2603.15569) saf SSM tarafından üç yenilik başlattı:

1. **Exponential-trapezoidal discretization.**Mamba-2'nin Euler-metod diskretleştirmesi için daha fazla ifade gücü kullanılır.`x_t`Yukarı dış kıvrımlılık.

2. **Complex-valued state update.**之前的Mamba 将状态矩阵从复杂(S4) 降低为真实对角形(Mamba),再降低为规模化身份(Mamba-2) ・・・Mamba-3 重新加入复杂值,相当于对状态进行数据依赖的旋转嵌入──这恢复了之前的真实值 简化所牺牲的状态跟踪能力──

3. **Multi-input multi-output (MIMO) projections.**Özellikleri 标量 projeksiyonları kullanmak yerine, matris değerli projeksiyonları kullanmak.

1.5B 参数 ölçeğinde,Mamba-3 göre Gated DeltaNet ortalama aşağı akışta doğruluk  0.6 个点 yükseltecek;MIMO varyantı 额外增加 1.2 个点,总共提升 1.8 个点──

Mamba-3 henüz büyük ölçekli üretim hibridinde teslim edilmemiştir, ancak açıkça sonraki neslin Jamba sınıfı 模型 SSM 側的候選方案です。

### 何時使用 melez

Hibrit 适合以下情况:

- Kontext 足足长, until pure Transformer KV cache 变得痛苦(64k+) 』
- 任务混合了短距结构 (SSM'ye uygun) 长距回忆 (Transformer'a ihtiyaç duyulur) 
- Tek GPU'da depolama bütçesine yerleştirilmesini istiyorsun, Transformer KV'de ise.

Hibrit, aşağıdaki durumlara uygun değildir:

- Kontext 很短(低于16k) ・SSM 过head 被浪费;pure Transformer 足够好。
- 任务需要 সর্বত্র-to-everywhere dikkat(深度推理、多文档交叉引用) ⋅Yabancı İç dikkat katmanlarının nadirlik ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙  ∙ ∙ ∙  ∙ ∙ ∙    ∙ ∙   ∙ ∙                                                                                                                                                                                           
- Şu anda kapasite yarışmasında başarısızlık yapanlar için, yeni bir model oluşturmak için çok daha fazla araç kullanmak gerekiyor.

### Rekabetçi manzarası

| Model | Family | Scale | Unique claim |
|-------|--------|------|-------------|
| Mamba-2 | pure SSM | 3B | linear time, constant memory |
| Jamba | hybrid | 52B/12B | 256k on 80GB |
| Jamba 1.5 Large | hybrid | 398B/94B | enterprise-grade long-context |
| Mamba-3 | pure SSM | 1.5B (paper) | state-tracking restored |
| DeepSeek-V3 | pure Transformer + MoE | 671B/37B | frontier capability |

2026 yılının şema: saf-Transformer MoE 主导界,但混合 占占据 256k以上背景的细分领域──Mamba-3 在国家跟踪上的胜利,可能会推动下一代混合 采用更低比例(更多SSM、更少注意)──


```figure
swiglu-ffn
```

## Kullan
`code/main.py`HİBRID mimarlıkların内存 hesaplayıcıları için kullanılan bir sistemdir. SSM-Transformer oranı ve gizli boyut / katman sayım yapılandırması verildiğinde hesaplanır:

- 目標 context 下的 KV cache──
- SSM devlet hafızası.
- Bir dizi model şekli bağlamında N 下 の总内存。

Bilgisayar destek:

- Temiz-Transformer başlangıç çizgisi ((KV cache 随 N 增长)
- Jamba tarzı 1:7 hibrid.
- Saf-SSM( tamamen KV kaydesi yok)。

İlanlanmış şekil için, sayı doğrudan Jamba-1 ve Jamba-1.5 论文inden gelir; 假设变体 için ise dışa çıkarılmıştır.

Gerçekte de bu projeyi gerçekleştirmek için:

- Büyük çoğunlukla Jamba ve Mamba'yı destekliyor.
- 256k bağlamında Jamba'nın内存优势会体现在同步请求吞吐量上――; aynı VRAM'da, Jamba'nın daha fazla diziyi Transformer sekanslarına göre tutabilirsin――;
- Mamba-3 bağımsız model olarak henüz üretimde bulunmadı, sadece 1.5B'nin araştırma ön görünümü.

## - Söyle.
本课会产 出 `outputs/skill-hybrid-picker.md` belirlenmiş iş yükü özellikleri ([[text length profile]], görev karışımı]], hafıza bütçesi), saf Transformer、Jamba tarzı hibrid ve saf SSM arasında tavsiye ve tavsiye verir,

## 练习
1. 运行  İşlem`code/main.py`, hesap 32 kat saf Transformer ((hidden 4096,32 baş) ve aynı şekil Jamba-1 hibrid 256k bağlamında 下的 KV cache──验证 AI21 论文声称的约8x内存降低──

2. 修改计算器,建模 1:3 hybrid(4 Mamba: 1 Dikkat) ve 1:15 hybrid(14 Mamba: 1 Dikkat) ・・・ KV cache vs oranı çizmek.

3. 阅读 Jamba 论文(arXiv:2403.19887) 的第 3 节──解释为什么AI21使用Mamba-1而不是Mamba-2,尽管Mamba-2 更快──提示:混合ablation section 记录了这一点──

4. 計算 Jamba 1.5 Büyük 中 MoE-her-diğer katmanların parametreleri genel maliyetleri(总计 398B,激活 94B) ・・・将活比与DeepSeek-V3(37B/671B)

5. 阅读 Mamba-3 论文(arXiv:2603.15569) 的第 3 节──用三句话解释为什么复杂-valued state update 等价于数据依赖的旋转嵌入──把答案关联到阶段 7 · Lesson 04 的 RoPE 推导──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| State space model (SSM) | “带固定状态的递推” | 具有学习到的递推 `h_t = A h_{t-1} + B x_t` 的层；每个 token 使用常量内存 |
| Selective SSM | “Mamba 的技巧” | 依赖数据的 A、B、C 参数，使模型在线性时间下获得类似 gating 的选择性 |
| Attention-to-Mamba ratio | “多少个 Attention layers” | 在 Jamba 中，`l = 8` 表示每 7 个 Mamba layers 配 1 个 Attention layer |
| Jamba block | “8 层一组” | 一个 Attention + 七个 Mamba + 在交替位置使用 MoE |
| SSM state | “隐藏缓冲区” | 固定大小的逐层状态，用于替代 Mamba layers 的 KV cache |
| 256k context | “Jamba 的旗舰数字” | Jamba-1 可在单张 80GB GPU 上容纳的序列长度；pure Transformer 在该大小下无法做到 |
| Mamba-3 | “2026 pure SSM” | 当前最佳 pure-SSM architecture，具有 complex state + MIMO；是 hybrid 重新构建时围绕的 baseline |
| MIMO | “Multi-input multi-output” | Mamba-3 的创新，使用 matrix-valued projections 而不是逐 feature 标量 |
| Exponential-trapezoidal discretization | “Mamba-3 的递推” | 更有表达力的递推，包含 Mamba-2 的 Euler-method discretization |
| Hybrid architecture | “混合 Attention 和 SSM” | 任何交错 Transformer 和 SSM layers 的模型；Jamba 是生产级原型 |

## 延伸阅读
- [Lieber et al. — Jamba: A Hybrid Transformer-Mamba Language Model (arXiv:2403.19887)](https://arxiv.org/abs/2403.19887) 原始 Jamba 论文, oran ablations,256k bağlam 声明
- [AI21 — Jamba 1.5: Hybrid Transformer-Mamba at Scale (arXiv:2408.12570)](https://arxiv.org/abs/2408.12570)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Gu, Dao — Mamba: Linear-Time Sequence Modeling with Selective State Spaces (arXiv:2312.00752)](https://arxiv.org/abs/2312.00752) Jamba 构建所基于的选择性SSM 论文
- [Dao, Gu — Mamba-2 (arXiv:2405.21060)](https://arxiv.org/abs/2405.21060)  simplified structured state-space 后继者
- [Lahoti et al. — Mamba-3 (arXiv:2603.15569, ICLR 2026)](https://arxiv.org/abs/2603.15569) karmaşık değerli devlet  MIMO  2026 saf SSM sınır
- [Gu et al. — Efficiently Modeling Long Sequences with Structured State Spaces (arXiv:2111.00396)](https://arxiv.org/abs/2111.00396) S4 论文,面向LLM'lerin SSM 谱系起点
