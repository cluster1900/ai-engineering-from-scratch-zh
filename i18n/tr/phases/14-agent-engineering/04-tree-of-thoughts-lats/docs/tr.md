# Düşünceler Ağacı, LATS:Sözlü Arama

> 单条链-of-thought trajectory 没有回溯空间──ToT(Yao et al., 2023) 推理将变成一棵树,并每个节点上进行自我评估──LATS(Zhou et al., 2024) 在蒙特卡罗树搜索下统一了一了 ToT、ReAct 和 Reflection──24'ün oyunu% 4'ten% 4'e kadar yükseldi;CoT) 提升到74% T;LATS 在 HumanEval 上达到92.7% pass@1。

**类型：**Yapım
**语言：**Python (stdlib)
**先修：**Fase 14 · 01 (Ajans Çapı), Fase 14 · 03 (Refleksyon)
**时间：**~ 75 dakika

## Öğrenme hedefi

- Racizasyon Açıklama: düğüm düşünce, kenar genişleme, değer umutlu bir değerdir.
- 实现一个stdlib ToT tarzı BFS ağaç araması,并用自我评估得分──
- 扩展为一个玩具 LATS MCTS循环,包含选择/扩展/模拟/反扩散──
- 判断什么时候搜索 值得 Token 倍增成本(24 ̊kod jenerasyonu oyunu),什么时候单条轨迹 就足够(简单 Q&A) 』

## 问题

Düşünce zinciri ise bir hata yapılır. Eğer ilk adım yanlış yapılırsa, sonraki her adım yanlış bir öneme dayanır. 24 oyunda dört sayı ile + − × ÷  get 24) ile GPT-4 CoT'nin doğruluk oranı %4'dir.

Dönüşüm  ihtiyacı birçok aday önermek  onları değerlendirmek  seçmek  umudu olan aday, ve çıkış sonu  时回溯的能力── işte bu arama── Düşünceler ağacı 和 LATS iki kanonik formülasyonlardır──

## 概念

### Düşünceler Ağacı (Yao et al., NeurIPS 2023)

Her düğüm bir bağlantılı orta adımdır. Her düğüm K 个儿童思想 için genişletilebilir.

```
                     (root: "find 24 from 4 6 4 1")
                    /               |            \
           ("6 - 4 = 2")    ("4 + 1 = 5")    ("4 * 6 = 24")  <- Score: HIGH
              /   \              |                  |
          ...    ...          ...                finish
```

Öz değerlendirme ise ağır bir bölümdür.`sure / likely / impossible`sınıflandırma`1..10`Seçimler arasında sayısal puan ve adaylar arasındaki oylamalar.

### LATS (Zhou et al., ICML 2024)

LATS MCTS'de aşağıda birleştirilmiştir.

- **Policy**:提出候选下一步行动 (ReAct tarzı)
- **Value function**:为 kısmi yörüngesi 打分(ToT tarzı kendi kendine)
- **Self-reflector**Başlangıçta, "Bir Yaratıcı" olarak adlandırılan bir dil olarak adlandırıldı.

Çevre geri bildirimleri (observasyon) değer fonksiyonuna karışır, bu nedenle arama 会由真实工具結果 提供信息,而不只是模型意见──论文发布时的结果: GPT-4'ün HumanEval pass@1 kullanmak 92.7% (SOTA), GPT-3.5'in WebShop ortalaması kullanmak 75.9 ((gredyent tabanlı ince ayarlama yakın)

### MCTS, en az biçim

Her iterasyonda dört aşama vardır:

1. **Select** 使用 UCT(yüksek güven ağaçlara bağlanır) kökten yapraklara doğru
2. **Expand**Politika ile K 个 çocuğu doğurmak.
3. **Simulate** Kullanım politikası Çocuk dağıtımından yaprak,并用价值函数 (daha fazla değer)
4. **Backpropagate** 沿路上更新 ziyaret sayısı 和 değer tahminı。

UCT formülü:`Q(s, a) + c * sqrt(ln N(s) / N(s, a))`❖ İlk konu sömürüdür; ikinci konu keşif ❖ görevi doğrultusunda 调整 `c`- Evet.

### 成本现实

Arama 会让 代币 爆炸──24  上的 ToT 使用的代币是 CoT 的 1001000 倍──LATS 类似──

- 单条轨迹 被证明不足的任务 (24 复杂代码) 
- Duvar saati doğru değil önemli bir görev.
- Erkin ve güvenilir değer fonksiyonu görevi ((kodun birim testi、hizabın açık hedefi) 👇

Eğer göreviniz tek doğru cevap ve değerlendirici varsa gürültü varsa, arama işleri daha da kötü hale getirecektir çünkü yanlış cevaplar bulacaktır.

### 2026 定位

Büyük çoğunluk üretim ajanı LATS'i kullanmıyor.

-                                                                                                                                                                                                                                                               
- 探索多条 sorgu yolu'nun derin araştırma ajanı──
- LangGraph altgrafi 内部 planlama ağır çalışma akışı。

AlphaEvolve (Disim 11) 2025 yılının en son örneğidir: kod için evrimsel arama yapın, makine kontrol edilebilir fitness, sınır kazancı yapın.


```figure
tree-of-thoughts
```

## Yapın onu.

`code/main.py`实现了:

- Bir stilli pick arithmetic ops görevi  上运行的 küçük ToT BFS
- Birlikte çalışmak için LATS MCTS döngüsünü seçin, UCT seçimini kullanın.
- Bir 组合 sembolik puan ve kendi kendine değer değer fonksiyonu

- Yapma .

```
python3 code/main.py
```

izler 会 gösterir ToT BFS ile Her düğüm genişletmek Üç aday,并与LATS 通过MCTS 收到最佳推广 进行对比──双人的代号数 都会印出来──

## Kullan

LangGraph ToT tarzı keşif 作为子图图案提供;LangChain ekibi 关于 LATS 的博客(2024 年 5 月) 是参考教程──LlamaIndex 提供 `TreeOfThoughts`2026 üretim ajanlarının çoğunluğuna göre bu model`if task_complexity > threshold: use_search()`kapı 后面见05 中的评价者优化器模式──

## - Söyle.

`outputs/skill-search-policy.md`Görev şekli, bütçe ve değerlendirici sadakati üzerine, lineer ReAct, ToT, LATS ve evrimsel arama arasında seçim yapılır.

## 练习

1. UCT c=0.1 ve c=2.0 kullanın.
2. Bu değer fonksiyonu 换成噪音更大的得分器 (Random Jitter) 加入) ――MCTS daha en iyi yaprak bulabilir mi?
3. 实现beam-search ToT(per layer retain top-k)并与BFS对比──在紧张的代币预算下哪一个更好?
4. LATS Bölümü 5.1  Rekonstruksiyon İnsan Eval Yöntemini Saymak: Rapor'un geçişine ulaşmak için ne kadar devreye girme gerekiyor?
5. LATS makalesini okuyun.

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tree of Thoughts | “Branching CoT” | Yao et al. — 带有 self-evaluation 的 thought node 树 |
| LATS | “MCTS for LLMs” | Zhou et al. — 在 MCTS 下统一 ToT + ReAct + Reflexion |
| UCT | “Upper confidence bound” | 在 exploitation (Q) 和 exploration (ln N / n) 之间平衡的 select formula |
| Value function | “这个 state 有多好” | Prompted LLM score 或 environment reward；反馈给 backprop |
| Policy | “Action proposer” | ReAct-style generator；发出候选 next thought/action |
| Rollout | “Simulated trajectory” | 使用 policy 从 node 走到 leaf，并用 value 打分 |
| Backpropagate | “更新 ancestors” | 将 leaf 的 reward 沿路径向上推，更新 visit count 和 Q |
| Search cost | “Token explosion” | Game of 24 上是 CoT 的 100-1000 倍；采用前先做 budget |

## 延伸阅读

- [Yao et al., Tree of Thoughts (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) 经典论文
- [Zhou et al., LATS (arXiv:2310.04406)](https://arxiv.org/abs/2310.04406) 带有反思反的 MCTS
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Arama için altgraf örneği
- [AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带 programatik değerlendirici  带 programatik değerlendirici  带 programatik değerlendirici  带 programatik değerlendirici  带 programatik değerlendirici  带 programatik değerlendirici 带 programatik değerlendirici 带 programatik değerlendirici 带 programatik değerlendirici 带 programatik değerlendirici 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator 带 programmatic evaluator                                                                                                                                                                                                                                                                                             
