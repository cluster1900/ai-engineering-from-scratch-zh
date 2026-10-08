# Çoklu Ajan Tartışma ve işbirliği

> Du et al. ((ICML 2024,Society of Minds) N 个模型实例运行,这些实例先独立提出答案,然后在R 轮中相互代批评,以实现收──它能提升事实性、规则遵循和推理──Sparse topology 在 Token 成本上优于全网──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12（Workflow Patterns），Phase 14 · 05（Self-Refine and CRITIC）
**Time:** ~60 分钟

## Öğrenme hedefi
- 解释辩论协议:N 个提案者、R 轮,并收到一个共享答案──
- 描述为什么辩论 能提升事实性、规则遵循和推理──
-  açıklamak nadir topoloji: Not every debater need to see all other debaters──
- Scenarioda LLM 上实现一个 stdlib tartışması,包含全网和稀有变体;衡量Token 成本与精度──

## 问题
Kendini Temizle (Self-Refine) (第 05 课) bir eleştirel modeldir. Kendi kendine, grup düşüncesi vardır. 风险――CRITIC (风险――CRITIC) (第 05 课) eleştirel eleştirileri dış araçlara yerleştirir. Ancak bu araçlar her zaman kullanılabilir değildir.

## 概念
### Society of Minds (İkıllar Topluluğu)

- N 个模型例针对同一个问题独立提出答案──
- R 轮 içinde, her model diğer modellerin önerilerini okuyor ve onları eleştirir.
- Model Based Critics  Yenile kendi cevaplarını 👍👍
- R 轮后,返回收后的答案──

İlk deney, maliyetin değerlendirmesiyle N=3、R=2── problemlerde problemlerde, daha fazla ajan ve daha fazla sıralama doğruluğu artırmak için yapılan deneylerin temelinde ortaya çıktı.

Çarşı model 组合优于单模型辩论:ChatGPT + Bard 组合 > 任一单独模型。

### Sparse topolojisi

Sparse İletişim Topolojisi ile Çoklu Ajan Tartışmasını Geliştirmek (arXiv:2406.11776,2024-2025) gösterir, tam bir ağ tartışma 并不总是最优优──Sparse topologies(star、ring、hub-and-spoke) daha düşük bir Token 成本 kullanarak相近精度に ulaşılabilir── her tartışmacı sadece eşcinsinin bir parçası olarak görmektedir──

 Etkisi:

- Tam ağ N=5,R=3 = 5 × 3 = 15 个提案,每个都读取 4 个同行 = 60 kez eleştirel çalışma¬lar
- Yıldız N=5,R=3 ((bir merkez + 4 konuşma) = 15 önerme, konuşma

### Tartışma yardımı sağladığında

- **Factuality。**N 个独立的建议,cross-check 降低幻觉──
- **Rule-following。**Satranç hareketinin geçerliliği Bir model kurallarını kaybeder, diğer modeller onu kavrar.
- **Open-ended reasoning。**Çok çeşitli çerçeveler doğru cevaplara kadar yavaş yavaş daralır.

### Tartışma acı verdiğinde

- **Latency-sensitive UX。**N × R 个串行轮次会产生你可能无法承受的延迟──
- **Cost-sensitive scale。**Her sorunun bir N × R simgesi olması gerekiyor.
- **Simple factual lookups。**Bir kez daha aramak daha ucuz.

### 2026 pratik örnekler

- **Anthropic orchestrator-workers**(第 12 课)  带合成 aşamasının bir tartışma 变体──
- **LangGraph supervisor**(第 13 课)  Merkez yönlendirici + uzman ajanlar tartışmayı bir düğüm olarak gerçekleştirmek mümkün.
- **OpenAI Agents SDK**(第 16 课)  ajanlar 通过交付来回进行反复批评──
- **Multi-agent evals** Debat + değerlendirici-optimalisör 配对, değerlendirme sinyali için kullanılır。

### Bu yol kolayca yanlış bir yerde

- **Convergence collapse。**Tüm ajanlar ilk hata cevaplarını aldılar.
- **Hub failure。**Yıldız topolojisinde, kötü bir merkezi tüm insanları kirletiyor.
- **Prompt homogenization。**Tüm ajanlar aynı istekleri kullanır; aynı cevaplar üretirler.


```figure
debate-converge
```

## Yapın onu.
`code/main.py`实现了 stdlib tartışması:

- `Debater`sınıfı(带有每个辩论者意见漂移的脚本的LLM)
- `FullMeshDebate`和 `SparseDebate`Koşucular.
- Üç soru: bir gerçek, bir kural tabanlı, bir mantık.
- Metrikler:eğilimli cevap,eğilimli yuvarlaklar, toplam eleştirel çalışmalar.

运行:

```
python3 code/main.py
```

输出: her protokolün doğruluğu ve maliyeti;sparse on 2/3 问题以更低成本匹配全网──

## Kullan
- **Anthropic orchestrator-workers**2-3 işçi tartışması için kullanılıyor.
- **LangGraph**Kontrol noktaları ile ilgili çok yönlü tartışmalar.
- **Custom**Araştırma veya özel doğruluk garantileri için kullanılmıştır.

## - Söyle.
`outputs/skill-debate.md` bir çok ajan tartışması oluşturmak, yapılandırılabilir topoloji N、R 和 dönüşüm kuralına sahip olmak.

## 练习
1. Yengenişsel anlaşmazlığı gerçekleştirmek  kural: 1. turda, her tartışmanın farklı bir önerisi ortaya çıkması gerekir.
2. 添加信心重量集:debaters 返回 ( cevabı, güven); 聚合器 按信心 加权──¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
3. Bir agent  değişmek farklı görüşlere sahip başka bir yazılı LLM.
4. 3 sorunun üzerinde ölçüm tam ağ ve nadir Token 成本── çizim maliyeti vs. doğruluk──
5. Zihnlerin Topluluğu makalesini okuyun. Oyuncaklarınızı N=5 R=3'e taşıyın.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Debate | “Multi-agent critique” | N 个 proposers，R 轮 cross-critique，并收敛 |
| Full mesh | “Everyone reads everyone” | 每个 debater 每轮读取每个 peer |
| Sparse topology | “Limited peer view” | Debaters 只读取 peers 的一个子集 |
| Hub-and-spoke | “Star topology” | 一个 central debater，N-1 个 spokes 只读取 hub |
| Convergence | “Agreement” | Debaters 收敛到一个共享答案 |
| Society of Minds | “Du et al. debate paper” | ICML 2024 multi-agent debate method |

## 延伸阅读
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) 经典 çoklu ajan tartışması
- [Sparse Communication Topology (arXiv:2406.11776)](https://arxiv.org/abs/2406.11776) nadir topoloji 结果
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) orkestrasyon-işçiler örneğin bir tartışma 变体
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) Tek model kendi kendine eleştirisi
