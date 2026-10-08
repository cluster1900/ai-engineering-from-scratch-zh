# 面向 LLM'lerin Swarm Optimization (PSO, ACO)

> 生物启发式优化 正在LLM 领域回归──**LMPSO**(arXiv:2504.09247) kullanan PSO, bunların her bir parçacık hız bir istek, LLM 生成下一个候选;**Model Swarms**(arXiv:2410.11163) Her LLM uzmanını bir PSO parçacığı üzerinde bir model ağırlığı manifold olarak görerek, 9 veri kümesi üzerinde 12 temel çizgi ile karşılaştırarak rapor eder.**13.3% average gain**, ve her turda sadece 200 örnek gerekir.**SwarmPrompt**(ICAART 2025) PSO + Grey Wolf 混合 olarak hızlı optimizasyon için kullanılacak.**AMRO-S**(arXiv:2603.12933) çoklu ajan LLM yönlendirme için ACO tarafından başlatılan feromon uzmanlarıdır.**4.7x speedup**、 açıklanabilir yönlendirme kanıtları, ayrıca sonuçlar ve öğrenme 解'nin kalite kapalı asinkron güncelleştirilmesi.

**类型：**Öğren + İnşa et
**语言：**Python (stdlib)
**先修：**16 · 09 aşaması (Parallel Swarm Networks), 16 · 14 aşaması (Konsens ve BFT)
**时间：**~ 75 dakika

## 问题

Bir istek var, görev değerlendirmesinde %62 puan elde edersiniz. Bunu geliştirmek istiyorsunuz.

经典生物启发式优化                                                                                                                                                                                                                                                           

Aynı model, çoklu ajan sistemleri içindeki ajan *routing*。ACO 风格的热mone 轨迹 会记录哪个代理在哪类任务上表现最好,让路由器利用这个轨迹,并让热mone 衰减,以便路由可以重新发现──

## 概念

### PSO'nun yenilenmesi (Kennedy & Eberhart 1995)

Partikel Swarm Optimization:连续搜索空间中的粒子 种群── her parçacıkın bir pozisyonu vardır `x_i`和 hız `v_i`❖ Her seferinde:

```
v_i <- w * v_i + c1 * r1 * (p_best_i - x_i) + c2 * r2 * (g_best - x_i)
x_i <- x_i + v_i
evaluate fitness(x_i)
update p_best_i if improved
update g_best if global best
```

İçlerinden `p_best`Bu parçacık kendi en iyi sonucu.`g_best`En iyi sonuç,`w, c1, c2`İnerti + bilişsel + sosyal ağırlıklar,`r1, r2`Bu bir olay.

### LLM 输出上 PSO  LMPSO

arXiv:2504.09247 将 PSO 适应到 LLM 生成的结构化输出(mathematical expression 式、程序) ・・・ her parçacık bir aday çıktı。Velocity is a *prompt*, describe how to put current output towards personal/global best 修改──LLM 根据 velocity prompt 生成新 output──Velocity inertia is similar make small incremental changes 的 prompt──

Bu durumlarda iyi sonuçlar elde eder:
- 输出是结构化 (output is structured)
- Fitness is automatic (İşlevsel)
- Popülasyon 较小(~10-30 parçacık), bu nedenle总 LLM 保持可控──

Fitness  yapay inceleme  gerektiğinde, kötü bir etki  Her iterasyon maliyeti çok yüksek olacaktır 

### Model Swarms

ArXiv:2410.11163 PSO'yu çıkış katmanından *model* katmanına taşıyacak. Her particle is an expert LLM (parametre) Swarm 通过无 Gradient update 将参数向集体最佳 移动──报告结果:在 9 个数据集、12 个基线上平均提升 13.3%,且每轮只需要 200 个实例──

关键洞察是 LLM uzman modelleri 已在共享参数多群中彼此接近(adapter weights、LoRA deltas) ⋅在这个低维子空间上做PSO 成本低且有效──

### ACO yenileme ((Dorigo 1992)

Karınca Kolonisi Optimizasyon:ants 遍历图;每条路 都有色素痕迹──️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

### AMRO-S  ACO ajan yönlendirme için kullanılır

ArXiv:2603.12933 ACO kullanılarak çoklu ajan yönlendirme yapar. Her tür görev tipi bir destination; her ajan bir 条可能 route; iyi sonuçlar elde eden yollar feromonları güçlendirir.

- **可解释的 routing evidence。**Feromon gücü insan tarafından okunur.
- **Quality-gated asynchronous update。**Feromonlar sadece kalite kontrollerinde                                                                                                                                                                                                                                                           
- Çoklu ajan yönlendirme referansını gerçekleştirmek**4.7x speedup**- Evet.

Kalite kapısı  çok önemli: yok, hızlı ama yanlış ajanlar feromon toplar, sistem kötü yollarda kilitlenir.

### 什么时候为 LLM 使用 PSO / ACO

**使用 PSO 当：**
- Arama alanı ise 连续的,或可映射到连续参数(快速嵌入、LoRA ağırlıklar、数值生成参数) 
- Fitness 便宜且自动──
- Nüfusu çok küçük olabilir.

**使用 ACO 当：**
- Yol seçimi sorunu var mı?
- Kararlar zamanla güçlenir (Hepsi görev türleri tekrar ortaya çıkar).
- Yol kararları için açıklayıcı kanıtlar lazım.

**不要使用二者当：**
- Fitness  needs artificial review ((( her seferinde tekrarlama 成本過高)
- Arama alanı ayrılmış ve bir araya gelmiştir, PSO ise genetik algoritmaları değiştirmek için kullanılamıyor.
- Gerçek zamanlı kararlar  şiddetli gecikme gerektirir PSO/ACO 相比单通 heuristics 收较慢)

### Neden biyo-ilhamlı  hala kazanmak

基于 Gradient的方法需要可微信号──LLM çıktıları和路由决策 并不天然可微──Pseudo-gradient 方法(güçlendirme öğrenilmiş yönlendirmeler、DPO tarzı hızlı ayarlamalar) 可行,但需要昂贵的训练──

PSO ve ACO sadece bir * değerlendirici* fonksiyonu gerektirir. Eğer aday çıkışı veya yönlendirme kararı için 打分, bu alan üzerinde optimize edebilirsiniz.

### 实用限制

- **Population budget。**N parçacık × T iterasyonları × her dönem maliyeti──$0.02 / call 的情况，一个 20-particle PSO 跑 50 iterations 大约花费 ~$20.. bu planın gereği..
- **Exploration vs exploitation。**Feromon bozulma oranı ve PSO inersiyası arasında değişim vardır; bozulma 太快 → 忘却解决;太慢 → 卡在早期地方最適──
- **Catastrophic drift。**Eğer fitness manzarası                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         


```figure
swarm-stigmergy
```

## Yapım

`code/main.py`实现:

- `LMPSO`                                                                                                                                                                                                                                                              
- `AMRO_S` ACO 风格 routing──3 个代理、4 种任务类、pheromone matrix、100 个路由任务──打印一段时间内(task_type → agent choices) 分布,展示轨迹形成──
- karşılaştırma: Aynı görev akışında                                                                                                                                                                                                                                                           

运行:

```
python3 code/main.py
```

预期输出:
- LMPSO: g_best fitness 30 iterasyon içinde 随机值提升到接近最优──
- AMRO-S:feromon tablosu  her tür görev tipi için doğru ajan karşı karşıya kalmaya kararlı; ACO yönlendirme kalitesi                                                                                                                                                                                                                                               

## kullanımı

`outputs/skill-swarm-optimizer.md` PSO、ACO、genetik algoritmalar ve gradient tabanlı optimizörler 之间选择, LLM / ajan optimizasyon sorunları için kullanılır。

## 交付

- **从小开始。**10-20 parçacık,20-50 iterasyonlar── sadece konvergense eğri gösterir 明确收益时才扩展──
- **记录每轮 pheromones 或 g_best。**没有 trail 的群 optimizers 很难 debug──
- **Quality-gate updates。**Özellikle de ACO yönlendirme: hızlı ama yanlış ajanlar asla feromon toplayamazlar.
- **在 distribution shift 时 reset decay。**Değerlendirme dağılımında değişiklikler, yaşlanma feromonları  geçmiştir; yeniden ayarlanmış veya geçici olarak bozulma oranı artmıştır.
- **限制每轮成本。**Çıkarım maliyetleri için bir seferlik 500 dolarlık bir maliyet çıkarımı sadece %0.5 artarak PSO'nun gemiye ulaşamadığı bir artış getirir.

## 练习

1. 运行  İşlem`code/main.py` LMPSO'nun dönüşümünü gözlemlemek  nüfus büyüklüğünü değiştirmek  5、10、20、50──
2. 实现一个 灾难性漂移 实验:在回复30 后改变健身功能──PSO 适应得多快?Reset `p_best`Yardımcı mı?
3. 给AMRO-S 添加质量门:只有 eval score > 0.7 of runs 才 deposit pheromone──与未添加门的版本相比,这如何改变融合?
4. LMPSO'yu okuyun. Arxiv:2504.09247) ◊ speed in paper as a prompt 映射回你的数值速度──模拟中丢失了什么,又保留了什么?
5. 阅读 AMRO-S(arXiv:2603.12933)。实现带异步热激素更新的解 因ference快速路──这将如何改变持续负载下系统延迟?

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| PSO | "Particle Swarm Optimization" | Kennedy-Eberhart 1995。基于种群的无 Gradient Optimizer。 |
| ACO | "Ant Colony Optimization" | Dorigo 1992。通过 pheromone trails 进行 path/route optimization。 |
| LMPSO | "PSO with LLM generation" | arXiv:2504.09247。Velocity 是 prompt；LLM 生成 candidates。 |
| Model Swarms | "PSO on expert weights" | arXiv:2410.11163。在 model parameter subspace 上进行无 Gradient update。 |
| AMRO-S | "ACO for agent routing" | arXiv:2603.12933。覆盖 task-type × agent 的 pheromone matrix。 |
| p_best / g_best | "Personal / global best" | 每个 particle 和整个 swarm 目前找到的最佳 solutions。 |
| Pheromone | "Routing memory" | Edge 上的强度；随时间衰减；根据 quality deposit。 |
| Quality-gated update | "Only learn from good runs" | 以 quality check 为条件进行 pheromone deposit。 |
| Catastrophic drift | "Distribution shift" | Fitness landscape 改变；旧的 p_best 和 pheromones 变得过时。 |

## 延伸阅读

- [Kennedy & Eberhart — Particle Swarm Optimization](https://ieeexplore.ieee.org/document/488968) 1995 yıl PSO 论文
- [Dorigo — Ant Colony Optimization](https://www.aco-metaheuristic.org/about.html)1992 yıl ACO 基础
- [LMPSO — Language Model Particle Swarm Optimization](https://arxiv.org/abs/2504.09247) 面向结构化 LLM sonuçları
- [Model Swarms — gradient-free LLM expert optimization](https://arxiv.org/abs/2410.11163) Üst PSO'nun model ağırlığı alt alanında
- [AMRO-S — ant-colony multi-agent routing](https://arxiv.org/abs/2603.12933) 带 kalite kapısı  带 kaliteli kapı  带 kaliteli kapı  带 kaliteli kapı  带 kaliteli kapı  带 带 带 带 带                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
