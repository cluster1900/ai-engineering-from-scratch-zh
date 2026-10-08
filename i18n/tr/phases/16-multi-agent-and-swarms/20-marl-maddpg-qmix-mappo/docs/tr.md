# MARL  MADDPG, QMIX, MAPPO

> çoklu ajan  koordine                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        **MADDPG**(Lowe et al., NeurIPS 2017, arXiv:1706.02275)  Merkezi Eğitim, Merkezi İcra (CTDE) girişi: Eğitim sırasında, her eleştirmen tüm ajanların durumunu ve hareketini görebilir; test zaman sadece yerel aktörleri çalışır.**QMIX**(Rashid et al., ICML 2018, arXiv:1803.11485) 带有单调混合网络的价值-分解;每个代理的 Q 会组合成联合 Q,因此 `argmax`Her bir ajanın üst düzey konumunu StarCraft Multi-Agent Challenge (SMAC) 'de ele alabilmesi için düzenli olarak dağıtılabilir.**MAPPO**(Yu et al., NeurIPS 2022, arXiv:2103.01955) PPO'nun merkezi değer fonksiyonu ile;**2026 年 cooperative-MARL 的默认 baseline**❖ Bu ders küçük bir şerit dünyası oyuncağından  her yöntemi inşa ederek, LLM-ağent eğitiminden önce, önce bu üç fikri                                                                                                                                                                                                                                             

**类型：**Öğrenme
**语言：**Python (stdlib,小型无 NumPy 实现)
**先修：**9. aşama (Yüksetme Öğrenimi), 16. aşama · 09 (Parallel Swarm Networks)
**时间：**~ 90 dakika

## 问题

LLM-agent  sistem越来越地训练间代理协调的政策:何时推迟何时行动调用哪个同行――告诉你如何训练这种政策的文献就是多代理强化学习 (MARL), LLM 浪潮 之前,并且已经有一小组主流算法──

Eğer bir kalıp sözcükleri yoksa, MARL 论文会很痛苦──Centralized training with decentralized execution (CTDE) ‧value decomposition 和 centralized critics 不是流行词  它们是具体问题的具体答案:

- Bağımsız RL( her ajan 单独学习) Her ajanın bakış açısından bakmak istasyonel değil.
- Merkezi RL (((1 ajan 控制全部) genişletilmez ve yürütme kısıtlamalarına aykırıdır.
- CTDE 兼得两者优点: Küresel bilgi ile eğitim, yerel politikalarla deplo­ment。

## 概念

### 论文使用的三类环境

- **Particle World (multi-agent particle env)。**简单 2D fizik, kooperatif/rekabetçi görevleri içerir──MADDPG'nin orijinal test yatağı──
- **StarCraft Multi-Agent Challenge (SMAC)。**İşbirliği mikro yönetim, kısmi gözlem, QMIX'in test yatağı, ayrıntılı eylemler, devamlı durumlar,
- **Google Research Football, Hanabi, MPE。**MAPPO başlangıç çizgisi:

farklı bir eylem/ gözlem var 类型──algoritm 会据此选择──

### MADDPG (2017)  CTDE model

Her ajan .`i`Şehirde bir aktör var .`mu_i(o_i)`Her ajanın da bir eleştirmeni var .`Q_i(x, a_1, ..., a_n)`Bu, eğitim sırasında tüm gözlemleri ve tüm eylemleri görüyor.

```
actor update:    grad_theta_i J = E[grad_theta mu_i(o_i) * grad_a_i Q_i(x, a_1..n) at a_i=mu_i(o_i)]
critic update:   TD on Q_i(x, a_1..n) given next-state joint estimate
```

Neden CTDE kullanıyoruz: Eğitim sırasında, biz herkesin eylemini biliyoruz; bu bilgileri kullanarak her eleştirmenin farkını azaltıyoruz.`o_i`,并调用 `mu_i(o_i)`- Evet.

失败模式:critics 会随 N 个代理 增长 输入包含所有 action) ⋅ Yaklaşım yoksa, ~10 个以上 个代理 ⋅ kadar genişlemek zordur.

### QMIX (2018)  değer parçalanması

僅適用於協同組合──Global reward is 之和:

```
Q_tot(tau, a) = f(Q_1(tau_1, a_1), ..., Q_n(tau_n, a_n)),   df/dQ_i >= 0
```

Tek kelimelik 保证 `argmax_a Q_tot`Her bir ajanın üzerinden bağımsız seçim yapabilirim.`argmax_{a_i} Q_i`Bu senin ihtiyacın olan şey.**decentralized execution property**❖ Eğitim sırasında, her ajanın karışımı ağından`Q_tot`- Evet.

Neden QMIX SMAC'da başarı kazanıyor:StarCraft mikro yönetimi  eşcinsel ajanlara  yerel obs  küresel ödül  ve değer parçalanması 完美契合。

失败模式:monotonicity constraint 限制较强; bazı görevlerin ödül yapısı monoton bozulmaz, örneğin bir ajan için takım kurbanı)  genişleme yöntemi (QTRAN、QPLEX)  bu noktayı bozacaktır.

### MAPPO (2022)  被低估的默认选择

Çoklu Ajan PPO: merkezi değer fonksiyonu olan PPO── her ajanın kendi politikası vardır; tüm ajan 共享(or poss poss poss poss poss per-agent)

- MAPPO in particulate-world、SMAC、Google Research Football、Hanabi、MPE 上匹配或超越非政策 MARL 方法──
- Gerekli hiperparametre ayarlama 极少。
- 訓練稳定;跨种 可复现──

Bu makalede, topluluk, MARL'i 2026 yılına kadar, MAPPO kooperatif MARL'in standart temelini düşürdü; herhangi bir yeni yöntem onu yenmek zorunda.

### Neden LLM-Agent Mühendislik  endişelenmeli

Üç doğrudan kullanım:

1. **Router training。**Meta-agent  seçin hangi alt-agent  işleme görevi。 bu bir içerir N 个分散型 alt-agent 和一个集中型路由器 的 MARL 问题。MAPPO 适合──
2. **Role emergence。**Generatif-Agent simülasyonunda, eğitim ajanı  zamanla birbirini tamamlayan rolü benimsemektedir, aslında MARL  sorunu  farklı bir biçiminde gizlenmektedir.
3. **Multi-agent tool use。**Agentler ortak bir araç ve bütçe için mücadele ederken, CTDE eğitimi sayesinde yerel politikaları uygulayabilir ve kaynak kısıtlamalarına uymayabilirler.

实践提醒: 2026 yılına kadar, çoğu üretim LLM-agent 系统是快速 它们的政策,而不是训练它们──MARL 适用于您具有以下条件时:

### CTDE RL  dışında tasarım kalıbı olarak

Hatta eğitimsiz, CTDE de yararlı bir mimari örneği:

- * tasarım* aşamasında, tam bir takım görünürlüğüne sahip olmayı varsayın.
- * Uçuş zamanı* 阶段, zorunlu merkezi olmayan yürütme: Her ajan sadece görüyor`o_i`- Evet.

Bu model sizi belirgin bir şekilde koruma konusunda zorlar.

### istasyonsuzluk 问题

Bir çok ajan aynı zamanda öğrenirken, her ajanın ortamı (başka ajanların politikası içerir) sabit olmayanıdır.

- MADDPG: Küresel eleştirmen tüm eylemleri görüyor, bu yüzden değer tahminleri sabit.
- QMIX: Değer parçalanması öğrenmeyi ıhtı-Q alanına taşıyacak, orada optimize belirgin bir anlam vardır.
- MAPPO:merkezleştirilmiş değer fonksiyonu, diğer ajanlar tarafından politika değişikliğinin değişimini engelleyecektir.

LLM-agent  sisteminde, istasyonarlık dışı  benim ajanım  上个月还正常,现在上游另一个代理 改了,我的就异常了──带 CTDE'nin MARL eğitimi prensipsel bir düzeltme biçimidir; hızlı düzeyde düzeltme daha hızlı, ama daha dayanıklı daha farklı──

### 本课不涵盖什么

訓練真实网络是Fase 09 的主题──本课构建脚本-policy 版本,在没有梯度更新的情况下演示CTDE、值分解和集中价值模式──目标是你使用完整的MARL库──(PyMARL、MARLlib、RLlib多代理) 之前,先内化这些模式──


```figure
sw-ctde
```

## Yapın onu.

`code/main.py`Çok küçük bir iki ajanlı kooperatif şebekesi dünyasında üç örnek gösterisi gerçekleştirildi:

- Çevre: 2 个代理在4x4 格里上,一个奖励颗粒――奖励 = Eğer任一代理到达颗粒则为 1;任务结束――
- `IndependentAgents` Her ajan diğer ajanı oluşturur.
- `MADDPGStyle` merkezi eleştirmen 计算共同价值;aktör politika 从中更新;;Skripted policy improvement。
- `QMIXStyle` 使用 monoton mixer'ın değer parçalanması。
- `MAPPOStyle` merkezi değer fonksiyonu;politik 共有基線 更新。

Dört kişi aynı bölümde çalışmaktadır,并 rapor ortalama adım-amaca. CTDE variansı 会收到比独立基线更短的路径──

运行:

```
python3 code/main.py
```

预期输出: bağımsız ajanlar 平均需要 ~6 步;CTDE varianti 会收到 ~3.5 步(4x4 grid'ın optimumu ise 3) ・・・ hatta senaryo politikaları kullanırken bile 差异也会显现──

## Kullan

`outputs/skill-marl-picker.md`Bu, çoklu ajanlı bir görevi belirlemek için kullanılan bir beceri. MARL algoritmasını seçin: işbirliği ile rekabetçi, homogeni ve heterogeni, eylem alanı tipi, ölçek, ödül sinyalleri.

## - Söyle.

Üretim sırasında MARL 很少见──当你确实使用它时:

- **从 MAPPO 开始。**2022'de baseline olarak belirlenecek; öncesinde daha fazla kullanışlı yöntemin süresi için öncesinde belirlenebilir.
- **记录每个 agent 的 observation 和 action stream。**Bir ajan için iz yok, MARL'i debug etmek neredeyse imkânsız.
- **分离 training code 和 execution code。**CTDE bir disiplin biçimidir.`o_i`- Evet.
- **Reward shaping 警告。**MARL ödül tasarımı için çok hassasdır.
- **对于 LLM agents**, hızlı düzeyde politikalara öncelik verin. Sadece etkileşim verileri + ödül sinyalleri + altyapı mevcutken, MARL eğitimine başvurmak gerekir.

## 练习

1. 运行  İşlem`code/main.py`◊ ölçüm bağımsız ve MAPPO tarzı ajanları arasındaki adım-amaca farkı ◊ 6x6 grede yukarıda, bu fark büyük veya küçük olacak mı?
2.  Rekabetçi bir variant gerçekleştirmek: iki ajan, bir pellet, sadece ilk ulaşan ajan  ödül elde etmek  Hangi model  干净地处理竞争?
3. 阅读 MADDPG (arXiv:1706.02275) Bölüm 3──用你自己的话,以伪代码形式象征性实现确切的批判更新规则──
4. 阅读MAPPO (arXiv:2103.01955) ――为什么作者认为集中价值+PPO在他们的基准上胜过非政策 MARL?列出三个强主张──
5. CTDE'yi tasarım örneği olarak kullanmak, bir yanlış düşünülen LLM-ağenti sistemine uygulanır.

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| MARL | "Multi-Agent RL" | 面向 multi-agent 系统的 Reinforcement Learning。 |
| CTDE | "Centralized Training, Decentralized Execution" | 用 global info 训练；用 local policies 部署。 |
| MADDPG | "Multi-Agent DDPG" | CTDE，每个 agent 的 critic 能看到所有 observations + actions。 |
| QMIX | "Value decomposition" | 每个 agent 的 Q 的 monotonic mixing。Cooperative。 |
| MAPPO | "Multi-Agent PPO" | 带 centralized value function 的 PPO。2026 年默认 baseline。 |
| Value decomposition | "Sum of individual Qs" | Joint Q 表示为每个 agent 的 Q 的 monotone function。 |
| Non-stationarity | "Moving targets" | 当其他 agent 学习时，每个 agent 的 env 都在变化。MARL 的核心问题。 |
| On-policy / off-policy | "Learn from current / replay" | PPO 是 on-policy (MAPPO)；DDPG 和 Q-learning 是 off-policy。 |
| SMAC | "StarCraft Multi-Agent Challenge" | cooperative micromanagement benchmark；QMIX 的本土主场。 |

## 延伸阅读

- [Lowe et al. — Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments](https://arxiv.org/abs/1706.02275) MADDPG;NeurIPS 2017
- [Rashid et al. — QMIX: Monotonic Value Function Factorisation for Deep Multi-Agent Reinforcement Learning](https://arxiv.org/abs/1803.11485) QMIX;ICML 2018
- [Yu et al. — The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games](https://arxiv.org/abs/2103.01955) MAPPO;NeurIPS 2022
- [BAIR blog post on MAPPO](https://bair.berkeley.edu/blog/2021/07/14/mappo/) Mappo sonuçlarının kolayca okunması için çerçeveleme
- [SMAC repository](https://github.com/oxwhirl/smac) StarCraft Çoklu Ajan Çabası
