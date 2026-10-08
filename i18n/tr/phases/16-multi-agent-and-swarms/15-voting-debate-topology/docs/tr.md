# Oylama ‒Özbirliği ve Tartışma Topolojisi

> En uygun bir toplama: N 个 bağımsız ajanı, sonra çoğunluk-sayın── Wang et al. 2022'in kendi kendine tutarlılığı**heterogeneous**Ajanlar  genişletmek, monokültürden kaçmak için farklı modeller, farklı istekler, farklı sıcaklıklar, farklı bağlamlar.**graph 最适合 research**, ve yaklaşık 4 ajanın üzerinde 后会出现协调税──AgentVerse (ICLR 2024) iki tür ortaya çıkan örneği kaydetti, gönüllü davranışlar ve uyum davranışları, uyumluluk ise hem bir özellik hem de bir risk (grup düşüncesi, Ders 24) ⇒ 本课会绘画拓拓学空间,构建每种变体,并测量协调税──

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**16 · 07 aşaması (Akıl ve Tartışma Topluluğu), 16 · 14 aşaması (Konsensüs ve BFT)
**Time:** ~75 minutes

## 问题
Tartışma doğruluğunu artırabilir. Tartışma, dört yapısal seçeneğe bağlıdır:

1. 谁和谁对话 (topoloji)
2. Çok az tur. 2023'ten sonra da ajanlar birbirlerine göre önemli.
3. Etkililer ︎ heterogen ︎ farklı temel modeller 打破 monoculture)
4. Evet, bir düşman ses var mı?

5 ajanı çalıştırmak ve görevdeki takımlara ağırlık vererek oy kullanmak, her zaman tek bir ajanın daha farklı olduğunu gösterir. Başarısızlık da kasıtlı değildir. Topoloji ve heterogenlik ile birlikte çalışırlar.

## 概念
### Kendi kendine uyumluluk, tek model temel çizgi

Wang et al. 2022(Öz Dengeliği Düşünce Dönüşüm zincirini geliştirir) sıcaklık > 0 时对同一个模型采样 N 次,并对推理-path回答做多数投票;;GSM8K 上的结果是:N=40 örnek 相比单个贪解码 有显著提升;;Öz Dengeliği Çok Ajanlı Oylamaların Tek Ajanlı Ön身──

限制:self-consistency Use a base model── errors in structure are correlated 的── eğer model sistematik bir önyargı gösterirse, tüm N 个样本都会共享它──

### Çoklu temsilci oylama,heterogen genişleme

N 个*不同* ajanları kullanmak N 个 örnekleri değiştirmek için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanmak için kullanılır.

2026 yılında heterogen tartışmaların kanonik adı 名称是**A-HMAD**, yani Zıtlıklı Heterogene Çoklu Ajan Tartışması. Bu isim henüz yaygın olarak kabul edilmemiştir, ancak monokultur çöküşünden kaynaklanan ilişkili hataları azaltan farklı modeller tartışmasını ifade eder.

### 4 Topoloji

```
star                chain               tree                graph

    ┌─A─┐           A─B─C─D         ┌──A──┐              A───B
    │   │                           │     │              │ × │
    B   C                           B     C              D───C
    │   │                          / \   / \
    D   E                         D   E F   G           (fully connected)
```

Yıldız: Bir merkez, tüm diğer ajanlar sadece bir merkezle konuşuyorlar.
Zincir: 线性结构, her ajan 看到前一个代理的输出──类似管道──
Ağac: Layer级结构, hiyerarşik ajan sistemleri tarafından kullanılır
Graf:herhangi bir kişiye herhangi bir kişiye, tam bağlantılı klişi ve herhangi bir DAG'yi içerir.

### Koordinasyon vergisi (MultiAgentBench)

MultiAgentBench ((MARBLE, ACL 2025, arXiv:2503.01935) bir araştırma ̊ kodlama ve planlama içeren görev kümesi içinde ̋benchmark ̋ ̋ star ̊ chain ̊ tree ̊ graph‬ ̋ anahtar ölçülen sonuçlar:

- **Graph**Topoloji Araştırma Görevlerinde 上获胜──信息 herhangi bir 流动; ajanlar birbirlerini eleştirebilir──
- **Star**Hızlı cevaplı gerçek görevlerde 上获胜──Hub 负责 filter 和 konsolidate──
- **Chain**Bu da bir çok farklı yöntemdir.
- **Coordination tax**Grafik topolojisinde yaklaşık 4 ajan ortaya çıktı.

4 ajan tavanı, temel değil, tecrübeli bir şeydir. 2026 LLM bağlamını yansıtır. Her ajanın bağlamı, eşlerinin çıkışları tarafından doldurulur.

### Çoklu ajanlar tartışması stratejileri.

ArXiv:2311.17371 2023 yılındaki MAD stratejileri araştırmasıdır. Diğer araştırmalar tarafından yapılan önemli bulgular:

### AgentVerse ortaya çıkan kalıplar

AgentVerse(ICLR 2024, https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf）记录了Çoklu ajan tartışması içinde açık bir tasarım olmamasına rağmen iki davranış ortaya çıkacaktır:

- **Volunteer。**Ajan 主动提供帮助(I can take the next step)。有用之处:它把工作分配给最适合某个子任务的代理──
- **Conformity。**Bir eleştirmenin hataları bile olsa eleştirmenin hatalarıdır.

Uygunluk  açıkladı neden tartışmaya-bir anlaşmaya kadar 会 ödüllendirme zorbaları。 sınırlı turlar 加上独立裁判 可以缓解──

### Heterogenite: Gerçekte doğruluk için bir güç

2024-2026 yılları için pratik literatürde bir model: N 个代理中一个换成不同基模型,带来的精度提升通常大于把 N 增加 1──直觉是单文化,每一个新的独立错误源都比额外的相关样品更有价值──

En az koşullarda, heterogenlik sayısızlığı yener. Çoğu durumda, üç farklı model bir modelin beş kopyasını yener.

### Jüri yöntemleri

Sibyl çerçeve (Minski-LLM edebiyatında alıntılandı) formalisasyon bir jury,即一小组 uzman ajanlar, her aşamada 通过投票来精细答──不同于普通多数投票,陪审团有角色:一个代理交考,一个提供背景,一个给可信性 打分──陪审团方法 介于平凡投票(便宜、容易单元文化) 和全 MAD(昂贵、容易合规) 之间──

### Oylama ve tartışma baskısı olduğunda

- 问题有基础真理 (fakta, matemati, kod davranış) ――Vote konvergensi 有意的──
- Ajanlar farklı kaynaklara veya araçlara erişebilir.
- Rondlar vardır (genellikle 2-3), ayrıca bağımsız yargıç veya doğrulayıcı vardır.
- Bütçe 允许 3-5 代理──在图形拓科上上超过 5-7 代理──后,协调税 会占主导──

### Eğer tartışmalar ile oy kullanmak acı verirse

- 问题呈意见形――Agentler, en doğru cevabı değil, en güvenli görünen cevapları alacaklar―
- Bütün ajanlar ortak bir temel model paylaştılar.
- Rondlar 无上限── 符合 每次都会赢──
- 任务很简单――使用N=5自一致的单代理 更便宜,精度 也差不多――


```figure
sw-debate-topology
```

## Yapın onu.
`code/main.py`实现:

- `run_star(agents, hub, question)` merkezi 轮询 her işçi ve toplamı
- `run_chain(agents, question)` sıradan gelişme¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- `run_tree(root, children, question)` derinlik-2 toplama  hierarşik yapı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- `run_graph(agents, question, rounds)` herşeye açık tartışma, sınırlı turlar
- Bir yazı biçimindeki heterogenlik diyalog: her ajanın bir tane var.`error_bias`, sistematik yanlışlığını gösterir.
- Bir ölçüm harnesinin, N=3、5、7 下运行每种拓科,并报告(精度、总_tokens、wallclock_simulated)

运行:

```
python3 code/main.py
```

预期输出:一张 topology × N →(tökünlük、token、latency) 表──Graph 在 N=3-5'in araştırma tarzındaki görevler 上获胜;star 在快速事实任务 上获胜;N=7'in grafi 显示协调税(latency 膨胀速度快于精度) ・・・

## Kullan
`outputs/skill-topology-picker.md`Bu bir beceri, bu da görev tanımını alır, topolojisi önerir.

## - Söyle.
对于任何组合:

- Güçlü bir temel model kullanmaktan**self-consistency at N=5**Başlamak için uygun bir başlangıç.
- Eğer doğruluk  çok önemli ise, yükseltme **heterogeneous voting at N=3**️ Ölçü delta
- Sadece zaman görevi yapılandırılmış, araştırma çok adımlı ve sınırlı yuvarlaklar var.**debate topology**- Evet.
- 始终记录少数群──当少数群──持续正确时,你就有多样性信号──
- Bu, bir iş kararıdır.

## 练习
1. 运行  İşlem`code/main.py` Grafik topolojisinin koordinasyon-taksi eğri: doğruluk vs N  belirtiler vs N  eğri nedir N 处 eğri?
2. 实现 A-HMAD:三个带有意意不同的偏见的代理者──在14 ders monokultura saldırısı 上,A-HMAD ile karşılaştırıldığında, hepsi aynı tarafsızlık başlangıcı nasıl?
3. Grafik topolojisine bir hakim rolü ekle, oy vermez, sadece son konsensüse 打分── bu yeni uyum davranışını değiştirecek mi?
4. 阅读 AgentVerse paper(ICLR 2024) ――识别你的实现最强烈展现的是哪种新兴行为──你能通过快速变化 引出相反的行为?
5. 阅读 MultiAgentBench(arXiv:2503.01935) Bölüm 4(topoloji deneyleri)。Uz Your Harness 在论文中的一个任务上复现graph-wins-research结果──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Self-consistency | “Sample N times, vote” | Wang 2022。Single model，N 个 temperature>0 samples，对 reasoning paths 做 majority vote。 |
| Heterogeneity | “Different models” | 由不同 base models 或 prompt families 组成的 ensemble。打破 monoculture。 |
| MAD | “Multi-agent debate” | agents 在多个 rounds 中交换 critiques 的通用术语。见 Du 2023。 |
| A-HMAD | “Adversarial Heterogeneous MAD” | 强调不同 models + adversarial structure 的 MAD variant。 |
| Topology | “Who talks to whom” | Star、chain、tree、graph。决定 information flow。 |
| Coordination tax | “Diminishing returns” | 在 graph 上超过约 4 个 agents 后，cost 增长快于 quality。 |
| Volunteer behavior | “Unprompted help” | AgentVerse emergent pattern：agent 主动提出承担一个 step。 |
| Conformity behavior | “Agreement under pressure” | AgentVerse emergent pattern：agent 与 critic 对齐。 |
| Jury | “Small specialized panel” | 带 roles（examiner、context、scorer）的 Sibyl-style ensemble。 |

## 延伸阅读
- [Wang et al. — Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171) Tek model için başlangıç
- [Du et al. — Improving Factuality and Reasoning via Multiagent Debate](https://arxiv.org/abs/2305.14325) ajanlar ve turlar her biri kendi kendine önemli
- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) Topoloji referans, göster grafik, en uygun araştırma, zincir   uygun boru hattı
- [Should we be going MAD?](https://arxiv.org/abs/2311.17371) MAD strateji araştırması; eşdeğer bütçe bulma
- [AgentVerse (ICLR 2024)](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) gönüllü ve uyumlulık gelişen kalıpları
- [MARBLE repo](https://github.com/ulab-uiuc/MARBLE) Referans referans değerinin uygulanması
