# AlphaEvolve  演化式编码代理

> Bir sınır kodlama modeli oluşturmak ve evrim döngüsü ve makine kontrolü değerlendiricisi ile birlikte 配对──让循环运行足够久── bu da bir 4x4 复数矩阵乘法 sürecini bulur, sadece 48 kez ölçüm oranı kullanır, bu 56 yıldır ilk kez Strassen'i aşırır. Ayrıca bir Google 范围内的 Borg 调度 heuristikini bulur, üretim ortamında yaklaşık %0,7'lik bir grup hesaplama kaynağını geri kazanır. Bu yapı tasarlanmıştır sade tutmak için.

**Type:** Learn
**Languages:** Python (stdlib, evolutionary-loop toy)
**Prerequisites:** Phase 15 · 01（长周期 framing），Phase 15 · 02（self-taught reasoning）
**Time:** 约 60 分钟

## 问题

LLM'ler kod yazabilir. Devrimsel algoritmalar kod alanında arama yapabilirler. İki on yıl boyunca ayrı ayrı denelenmiş ve üst sınırlara ulaşmışlardır. LLM'lerin üst sınırları, sahte: modeller mantıklı gibi yazılır, ancak iddia ettiği işlevlerin kodlarını gerçekleştiremez. Devrimsellerin üst sınırları, arama maliyetleri.

AlphaEvolve(Novikov et al., DeepMind, arXiv:2506.13131, Haziran 2025) onları bir araya getirmek.

论文报告的结果包括:48次标量乘法的4x4 复数矩阵乘法(Strassen 1969 的上界是49),Google 生产环境中的 Borg调度 heuristic,32.5%'lik FlashAttention çekirdeği hızlandırılması, yanı sıra Gemini 训练吞吐量提升──

Bu yapı, değerlendirme makinesinin kontrolü nedeniyle geçerlidir. Bu değerlendirme makinesinin bu noktaya sahip olmadığı yerlerde, bu değerlendirme niteliği bu dersin merkezinde bulunmaktadır.

## 概念

### Çeviri

1. Doğru ama iyi bir tohum programından.`P_0`Başlayın.
2. 维护一个变体程序数据库,每个变体都由评估员打分──
3. Veritabanın içinde bir veya daha fazla ebeveynden alınan örnekler:
4. Hızlı LLM(Gemini Flash 生成大量候选,Gemini Pro 处理困难候选)产出父母的修改变体──
5. 编译、运行, ve held-out değerlendiricisi 上评估该变体──
6. 分数 ve özellikleri vectörü olarak veritabanına yerleştirilir.
7. Tekrarlıyorum.

İki ayrıntı önemlidir. Birincisi, LLM'nin sadece ana programı değildir, genellikle veri tabanındaki birçok üst varyantı, değerlendirici imzası ve kısa görev açıklaması da içerir.

### Neden değerlendirmeci tartışılmamalı

AlphaEvolve'un kazancı, değerlendirici ızlı, kesin ve zorlukla dolandırıcılık alanlarından geliyor:

- **Matrix multiplication algorithm**: Matrix 乘法并逐位 检查相等性 için kullanılan bir birim testi
- **Borg scheduling heuristic**Bir üretim sınıfı simülatörü, tarih kümesi yükleme ve ölçüm harcamalarının hesaplama kaynaklarını yeniden yüklemek için kullanılır.
- **FlashAttention kernel**Gerçek Hardware'daki duvar saati referansı:
- **Gemini training throughput**:以每步GPU-seconds 衡量──

Her bir durumda değerlendirici, öncelikle hakim olabilecek LLM  hata sınıfını yakaladı: uydurma doğru bir açıklama, donanım üzerinde kaybolan performans açıklaması, ve sınırda olan hatalar.

### Ödül hackeri aynı şeylerin diğer tarafı .

演化会优化评估者 测量的任何东西―― eğer değerlendiriciler kusursuzsa, döngü bu kusurluluğu bulur. 演化会优化表层特征,预期行为ではなく未经验领域,循环会优化表层特征――DeepMind论文中明确指出这一点:AlphaEvolve'in başarısı yalnızca değerlendiricilere 严谨性与搜索野心相匹配的领域に移転する――

2025-2026 年代码搜索循环中的 reward hacking 具体例:

- Ödüller 完成时间  的优化目标,会奖励提交空解法──
- 奖励测试内正确性的基准 分数,会奖励记忆测试并过拟合──
- Bir 代码质量代理 会奖励删除注释和重写变量名,即使语义没有变化──

AlphaEvolve'da yapılan bir düzeltme yöntemidir: LLM'yi hiç görmemiş bir değerlendirmeci ile kullanmak ve değerlendirme sırasında giriş üretmek.

### Neden LLM + arama 优于单独使用任一方

LLM, bir 2000 行 Python dosyasına otomatik olarak mutasyon yaparak neredeyse her zaman bir dil biçimi hatası oluşturabilir. LLM, bir işlevi otomatik olarak bytes yerine değiştirmek yerine, daha mantıklı bir komşu alanına odaklanır. Bu da değerlendirmeci 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调

Dolayısıyla, değerlendirici LLM'nin hayali biçimini ele alır. LLM'ler, bir işlevi öte sınırlı durumda O  n log n  olarak iddia eder, ancak aslında O  n ^ 2 olarak görülebilir.

### AlphaEvolve sınır yığınının ortasındaki konum

| System | Generator | Evaluator | Domain | Example win |
|---|---|---|---|---|
| AlphaEvolve | Gemini | correctness + benchmark | algorithms, kernels, schedulers | 48-mul 4x4 matmul |
| FunSearch (DeepMind, 2023) | PaLM / Codey | correctness | combinatorial math | cap-set lower bounds |
| AI Scientist v2 (Sakana, L5) | GPT/Claude | LLM critique + experiment | ML research | ICLR workshop paper |
| Darwin Godel Machine (L4) | agent scaffolding | SWE-bench / Polyglot | agent code | 20% → 50% SWE-bench |

Bu dört sistem aynı yöntemi oluşturur: jeneratör, değerlendirici, tekrar döngü.


```figure
alphaevolve-loop
```

## Kullan

`code/main.py`Bir oyuncak simbolik-gerileme sorunu üzerinde en küçük AlphaEvolve benzer döngü gerçekleştirmek için. Burada LLM bir stdlib proxy, hesaplama hedef işlevi programına küçük bir dil tercüme mutasyonu önerecektir. Burada evaluator

观察:

- En iyi sayı nasıl gelişiyor?
- MAP-elite şebekesi  nasıl bir döngü olarak yerleşik en az değere ulaşmaya devam edeceğini gösterir.
- 移除 held-out test (tek eğitimli değerlendirici) nasıl bu döngülerin ortaya çıkmasına şaşırtıcı bir şekilde yardımcı olabilir?

## - Söyle.

`outputs/skill-evaluator-rigor-audit.md`Yeni alanlarda AlphaEvolve tarzında döngünün ön koşullarını düşünün: değerlendirici gerçekten kaygı duyduğunuz başarısızlığı yakalayabilir mi?

## 练习

1. 运行  İşlem`code/main.py` record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record  record                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `--no-holdout`)并重新运行──量化过拟合──

2. 阅读 AlphaEvolve 论文中关于MAP-elite grid的第3节──为一个新问题(例如编译优化通过)

3. 48 kere çarpma 4x4  sonucu 56 yıl sonra Strassen'in 49-mul 上界を改良した.

4.  AlphaEvolve 会失败的领域を提出します──准确指出评价者 在哪里失效以及原因──

5. 针对你熟悉的一个领域,写出你会使用的评价者签名──包括 (a) 正确性条件, (b) 性能指标, (c) 输入生成规则, (d) 至少一个反奖励黑客检查──

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| AlphaEvolve | “DeepMind 的演化式编码 agent” | Gemini + 程序数据库 + 可机器检查的 evaluator |
| MAP-elites | “保留多样性的 archive” | 由 feature Vectors 作为 key 的 grid；每个 cell 保存具有该 descriptor 的最佳变体 |
| Island model | “并行演化子种群” | 会周期性迁移的独立种群；防止过早收敛 |
| Machine-checkable evaluator | “确定性 oracle” | LLM 无法伪造的 unit test、simulator 或 benchmark，是这个循环的前置条件 |
| Reward hacking | “优化测量值，而不是目标” | 循环找到一种最大化分数但不完成预期任务的方法 |
| Seed program | “起点” | 循环从中演化的初始正确但次优程序 |
| Held-out evaluator | “LLM 从未见过的评估数据” | 在评估时生成的输入，用于防止记忆 |

## 延伸阅读

- [Novikov et al. (2025). AlphaEvolve: A coding agent for scientific and algorithmic discovery](https://arxiv.org/abs/2506.13131) 完整论文。
- [DeepMind blog on AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) 供应商撰寫的结果说明──
- [AlphaEvolve results repository](https://github.com/google-deepmind/alphaevolve_results) 被发现的算法, 48-mul 4x4 matmulı içerir.
- [Romera-Paredes et al. (2023). Mathematical discoveries from program search with LLMs (FunSearch)](https://www.nature.com/articles/s41586-023-06924-6)Önceki sistem.
- [Anthropic — Responsible Scaling Policy v3.0 (Feb 2026)](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) Özgürlük değerlendirici tarafından tanımlanır.
