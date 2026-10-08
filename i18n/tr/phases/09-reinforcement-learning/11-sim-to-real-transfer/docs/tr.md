# Sim-Real Transfer

> Bir simülatörde eğitim görüyor, ancak donanımlı olarak başarısız olan bir politika, aslında simülatörde hatırlanmıştır.

**Type:** 学习
**Languages:** Python
**Prerequisites:** Phase 9 · 08 (PPO), Phase 2 · 10 (Bias/Variance)
**Time:** ~45 分钟

## 问题

訓練真實機器人 很慢、危險且昂貴──一隻雙腳 需要數百萬的訓練集 才能学会走走;而真實雙腳 哪怕摔倒一次,也可能损坏硬件──模擬 給你無限重置、确定性可复现、平行環境,而且不會造成物理损坏──

Ancak simülatörler yanlışlıktır. Biyazların ırzı MuJoCo modelleri arasında daha büyüktür. Kameralar lens çarpıtması vardır, simülatör ise içermez. Motörler gecikmeler, geri tepkiler ve doymak vardır.**reality gap**Sim dağıtımıyla gerçek dağıtım arasındaki sistematik fark, robotikte dağıtılmış RL'nin temel sorunudır.

You need a against *sim-to-real distribution shift* 具有 robust 性政策──三种历史方法:randomize simulator(domain randomization)、with a small amount of real data 适配 policy(domain adaptation / fine-tuning), or identify real system's parameters并匹配它们 (sistem tanımlaması)──2026 yılına kadar, mainstream配方 will put these three together with large scale parallel simulation(Isaac Sim、Isaac LabMujoco MJX on GPU) 结合、────

## 概念

![Three sim-to-real regimes: domain randomization, adaptation, system identification](../assets/sim-to-real.svg)

**Domain Randomization (DR)。**Tobin et al. 2017,Peng et al. 2018── eğitim sırasında, her bir sim sim simlemenin farklı parametrelerini rastgeleleştir: kütle, sıkışıklık katılıkları, motor PD kazançları, sensör gürültüsü, kamera pozisyonu, ışıklandırma, dokular, temas modelleri── politika Öğrenmek hakkında bir bilgi  Bugün hangi sim 里  ın koşullarının dağılımı ve tüm kapsamda genelleşmesi── eğer gerçek robot 落在训练包内, politika 就能工作──

- **优点：**Gerçek verilere gerek yok. Bir çeşit, birçok robot için uygundur.
- **缺点：**Aşırı rastlantı eğitimi evrensel bir politika oluşturur ama çok dikkatli bir politika oluşturur.

**System Identification (SI)。**Eğitimden önce, gerçek dünya verileri ile ısınan simülatörün parametrelerini kullanarak. Eğer gerçek robotun kol-kol sürtüşmesini ölçebilirseniz, onu simle doldurun. Sonra bu değerlerin öngörülen bir politikayı eğit. Gerçek sisteme giriş gerektirir, ancak gerçeklik boşluğunu doğrudan azaltır.

- **优点：**精确、低噪音的训练目标――
- **缺点：**Geride kalan model hatası politika için görülmez; küçük belirsiz etkileri (örneğin motor ölü bandı) hala dağıtımını bozacaktır.

**Domain Adaptation。**Sim training, yeniden kullanın az miktarda gerçek veri ince ayarlamak.

- **Real2Sim2Real：**Gerçek bir simülatör kullanın.`f(s, a, z) - f_sim(s, a)`, yeniden düzenlenmiş simler içinde antrenman.
- **Observation adaptation：**訓練一個政策, öğrenilen özellik çıkarıcıı (örneğin GAN pikselden piksel) kullanarak gerçek obs → sim gibi obs──controller 仍然停留在sim中──

**Privileged learning / teacher-student。**Miki et al. 2022 ((Yeni dörtlü) ・・・ Simülasyonda eğitim bir görebilir ayrıcalıklı bilgilere erişmek için (→terrain truth friction、terrain height、IMU drift) ⇒ *öğretmen*。再蒸留 一个只看到真正的传感器观测的 *öğrenc*。学生 学会从历史中推断着特权特征,并于物理参数 变化下保持强──

**Massively parallel simulation。**20242026。Isaac Lab、Mujoco MJX、Brax, binlerce paralel robotları tek bir GPU üzerinde çalıştırabilir。PPO 搭配 4,096  paralel humanoid, can can birkaç saat içinde toplamak için çok yıllık deneyim。 eğitim dağıtım 变宽, 现实差 缩小; bu 4,096 环境 her biri farklı rastgele parametreleri 时,DR 几乎是免费的。

**2026 年真实世界配方（quadruped walking 示例）：**

1. Massiv paralel sim kullanmak, yerçekimi                                                                                                                                                                                                                                                          
2. Terrain mapı, vücut hızı, yer hakkı eğitim öğretmen politikası
3. Sadece kendi algılama ile ayak bileşik kodlayıcılarını kullanmak öğretmenlerin öğrenci politikalarını destille etmesini sağlar.
4. Seçim: Gerçek IMU 上'nın otomatik kodlayıcıyla gözlem uyarlaması yapın.
5. 10+ ortamda toplanmak için sıfır çekim. Başarısız olursak, güvenlik kısıtlı PPO kullanın.


```figure
f3-reality-gap
```

## Yapın onu.

Bu ders kodu çok küçük bir domen rastlantılandırma  gösterimi, görselye * gürültülü* geçişlerle birlikte GridWorld。 biz bir politika eğitiriz, sim'de rastgele kayma olasılığını deneyimlemesini sağlar ve real'de hiç görülmemiş kayma seviyesini bir antrenman kullanarak değerlendirir. Bu biçim doğrudan MuJoCo'dan donanım aktarımına yerleştirebilir。

### 步骤 1: parametre sim

```python
def step(state, action, slip):
    if rng.random() < slip:
        action = random_perpendicular(action)
    ...
```

`slip`Gerçek robotlarda, sürtünme, kütle, motor kazanç olabilir, ya da simle gerçek arasında gerçekleşen herhangi bir değişim olabilir.

### 步骤 2: DR 訓練 kullanın

Her bölümde, başlayın.`slip ~ Uniform[0.0, 0.4]`◊ PPO / Q-öğrenme / 任意方法──重复许多集──

### Adım 3: real slaps 上做零射 评估

- Evet .`slip ∈ {0.0, 0.1, 0.2, 0.3, 0.5, 0.7}`上评估──前四个在培训支持内;`0.5`和 `0.7`Dışarıda DR-e eğitimli politika                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

### 4 adım: Sıkı eğitimle karşılaştırıldığında

訓練第二政策, sadece kullan `slip = 0.0`                                                                                                                                                                                                                                                              `slip`Yukarı değerlendirmeyi tarayın. Görmelisin ki, gerçek kayışın > 0, dönüşün ardından felaket düşüyor.

## 陷

- **过多 randomization。**- Evet .`slip ∈ [0, 0.9]`Üzerinde eğitim, politikalar son derece risk-ayrıca olacak, böylece en iyi yolu denemeyeceksiniz.
- **过少 randomization。**Çok az bir kapsamda eğitim, politika  tamamen yaygınlaşamaz.
- **误判 parameter space。**Randelize 错误的东西(真实差是机动延迟,却随机化摄像头色),DR 不会有帮助──先个字真实机器人──
- **Privileged info leakage。**Eğer öğretmen, sadece gözlemler yerine küresel bir durumla eylemler yaparsa, öğrencinin takip edilemez sonuçları ortaya çıkabilir.
- **Sim-to-sim transfer failure。**Eğer daha zor sim varianti için politikalarınız sağlam değilse, gerçek dünya için de sağlam olmayacaktır.
- **没有 real-world safety envelope。**Bir sim içinde geçerli ve gerçekte geçerli olan politika, düşük düzeyde güvenlik kalkanı yoksa, hâlâ hardware bozulur.

## Kullan

2026 yıl sim-real yığın:

| Domain | Stack |
|--------|-------|
| Legged locomotion (ANYmal, Spot, humanoid) | Isaac Lab + DR + privileged teacher / student |
| Manipulation (dexterous hands, pick-and-place) | Isaac Lab + DR + DR-GAN for vision |
| Autonomous driving | CARLA / NVIDIA DRIVE Sim + DR + real fine-tune |
| Drone racing | RotorS / Flightmare + DR + online adaptation |
| Finger/in-hand manipulation | OpenAI Dactyl (DR at unprecedented scale) |
| Industrial arms | MuJoCo-Warp + SI + small real fine-tune |

Tüm kontroller için iş akışı aynıdır. En iyi şekilde uyumlu hale getirin, rastgele yapın, büyük politikalar eğitiniz, çözünürlük gösterin, sonra güvenlik kalkanı kullanın.

## Yayınla

保存为 `outputs/skill-sim2real-planner.md`- ...

```markdown
---
name: sim2real-planner
description: 为给定 robot + task 规划 sim-to-real transfer pipeline，覆盖 DR、SI 和 safety。
version: 1.0.0
phase: 9
lesson: 11
tags: [rl, sim2real, robotics, domain-randomization]
---

给定一个 robot platform、一个 task，以及可访问真实硬件的时间，输出：

1. Reality gap 清单。按预期影响排序的可疑来源（contact、sensing、actuation delay、vision）。
2. DR parameters。精确列表、范围、distribution。针对 real measurements 论证每个范围。
3. SI steps。要测量哪些参数；测量方法。
4. Teacher/student 拆分。teacher 使用哪些 privileged info；student 使用哪些 obs。
5. Safety envelope。Low-level limits、emergency stops、backup controller。

拒绝在没有 (a) zero-shot sim-variant test，(b) safety shield，(c) rollback plan 的情况下 deploy。标记任何超过 measured real variability 3× 的 DR range，因为它很可能 over-randomized。
```

## 练习

1. **Easy。**Bu nedenle, bu programın en önemli yönleri, bu programın en önemli yönleri ve bu programın en önemli yönleri, bu programın en önemli yönleri ve bu programın en önemli yönleri, bu programın en önemli yönleri ve bu programın en önemli yönleri, bu programın en önemli yönleri ve bu programın en önemli yönleri, bu programın en önemli yönleri ve bu programın en önemli yönleri, bu programın en önemli yönleri ve bu programın en önemli yönleri, bu programın en önemli yönleri ve bu programın en önemli yönleri, bu programın en önemli yönleri ve bu programın en önemli yönleri ile yapılmıştır.
2. **Medium。**訓練一個 DR Q-öğrenme ajanı,采样 `slip ~ Uniform[0, 0.3]`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊                                                                                                                                                                                                                                          
3. **Hard。** Bir kurikulum gerçekleştirmek: Slip=0.0'dan başlayarak, politika % 90'a ulaştığında, DR aralığını genişletmek,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak,  % 0.3'e ulaşmak, % 0.3'e ulaşmak, % 0.3'e ulaşmak için % 0.3'e ulaşmak için % 0.3'e ulaşmak için % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Reality gap | “Sim-to-real difference” | training 与 deployment 的 physics/sensing 之间的 distribution shift。 |
| Domain randomization (DR) | “Train across random sims” | 训练期间 randomize sim parameters，让 policy 泛化。 |
| System identification (SI) | “Measure real and fit sim” | 估计真实物理参数；设置 sim 来匹配。 |
| Domain adaptation | “Fine-tune on real data” | sim training 后进行少量 real-world fine-tune；可能适配 obs 或 dynamics。 |
| Privileged info | “Ground truth for teacher” | 只有 sim 拥有的信息；student 必须从 obs history 中推断它。 |
| Teacher/student | “Distill privileged -> observable” | teacher 使用捷径训练；student 学会在没有这些捷径的情况下模仿。 |
| ADR | “Automatic Domain Randomization” | 随着 policy 改进而拓宽 DR ranges 的 curriculum。 |
| Real2Sim | “Close the gap with real data” | 学习一个 residual，让 sim 模仿 real rollouts。 |

## 进一步阅读

- [Tobin et al. (2017). Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/abs/1703.06907) 原始 DR kağıdı ((robot görüşü)
- [Peng et al. (2018). Sim-to-Real Transfer of Robotic Control with Dynamics Randomization](https://arxiv.org/abs/1710.06537) dinamiklerin DR, dörtlü hareket
- [OpenAI et al. (2019). Solving Rubik's Cube with a Robot Hand](https://arxiv.org/abs/1910.07113) Dactyl, büyük boyutlu ADR。
- [Miki et al. (2022). Learning robust perceptive locomotion for quadrupedal robots in the wild](https://www.science.org/doi/10.1126/scirobotics.abk2822) ANYmal'ın öğretmen-öğrencisi¬¬¬
- [Makoviychuk et al. (2021). Isaac Gym: High Performance GPU Based Physics Simulation for Robot Learning](https://arxiv.org/abs/2108.10470) 驱动 20252026 dağıtımlarının büyük ölçüde paralel sim¬leri
- [Akkaya et al. (2019). Automatic Domain Randomization](https://arxiv.org/abs/1910.07113) ADR eğitim programı yöntemi¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [Sutton & Barto (2018). Ch. 8 — Planning and Learning with Tabular Methods](http://incompleteideas.net/book/RLbook2020.pdf) Dyna çerçeveleme(使用模型做规划 + rollouts),支现代 sim-to-real boru hattları。
- [Zhao, Queralta & Westerlund (2020). Sim-to-Real Transfer in Deep Reinforcement Learning for Robotics: a Survey](https://arxiv.org/abs/2009.13303)Sim-to-real yöntemlerin taksonomisi,并含基准 sonuçları。
