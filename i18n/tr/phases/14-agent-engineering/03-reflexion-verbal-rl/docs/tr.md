# Düşünce: Sözlü Güçlendirme Öğrenimi

>  Gradient'e dayalı RL   binlerce deney ve bir GPU kümesi gerektirir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 02 (ReWOO)
**Time:** ~60 minutes

## Öğrenme hedefi
- Düşünce'nin üç bileşeni anlatmak: Aktör, değerlendirici, kendini yansıtıcı ve bölümsel hafıza.
- 实现一个stdlib Reflection loop,包含二进制评估器、反射缓冲 和全新的重复尝试──
- 针对给定任务,在规模化、尔斯学和自评反源之间做选择──
- 解释为什么语言强化 能捕捉到基于 Gradient 的 RL 需要数千次试验才能修复错误──

## 问题
Bir ajan  görev başarısız oldu. Standart RL'de binlerce deney, hesaplama gradiyenti, yenilemeler yeniden çalıştırılır.

Düşünce ((Shinn et al., arXiv:2303.11366) başka bir soru ortaya koydu: Eğer ajan  sadece kendini neden başarısız olduğunu düşünüyorsa, bu fikri derhal 里再试一次,会怎样?

Sonuç şu: ALFWorld'da ReAct ve diğer ince ayarlanmamış temel çizgilerden geçti. HotpotQA'da ReAct'e karşı gelişmeler oldu.

## 概念
### Üç bileşen

```
Actor         : generates a trajectory (ReAct-style loop)
Evaluator     : scores the trajectory — binary, heuristic, or self-eval
Self-Reflector: writes a natural-language reflection on the failure
```

Bir veri yapısı ekle:

```
Episodic memory: list of prior reflections, prepended to the next trial's prompt
```

Bir deneme süreci Actor。Evaluator对它打分──如果分 低,Self-Reflector会产生一段反思──我选择错误的工具,因为我把问题误读成在问题X,而它实际上在问题Y)──这个反思将进入剧情记忆──下一次试验从头开始,但会看到这一段反思──

### Üç değerlendirici türü

1. **Scalar** Dışişleri ikili sinyalleri。ALFD Dünya Başarılı veya Başarısız。HumanEval testleri 通過或失败。最简单,信号 最强。
2. **Heuristic** 预定义的失败签名──如果代理连续两次产生相同行动,就标记为卡了──如果轨迹超过50步,就标记为不效──
3. **Self-evaluated** LLM 打分──当没有基础真理 时需要它──Signal 较弱;适合与工具基底验证 搭配使用(DASON 05  CRITIC) 。

2026 yılının standardı uygulaması: karıştırılmış kullanım: kullanılabilir zaman ölçekli, kullanılamaz zaman kendiliğinden, heuristik  güvenlik rayları olarak

### Neden bu genelleştirildi

Refleksyon, yeni bir algoritma olarak adlandırılır.

- Letta'nın uyku zaman hesaplaması (Düşünme 08): Bir bağımsız ajan geçmişteki konuşmaları düşünerek, anı bloklarına yazıyor.
- Claude Code'ın `CLAUDE.md`/ save memory 模式: 将反思 捕获为学习,并预pendi到未来的会议──
- pro-workflow `/learn-rule`Komut:将 düzeltmeler 捕获为显式 kuralları。
- LangGraph'in yansıma düğümleri: 打分 için bir düğüm ve 打分 için bir düğüm ve 打分 için bir düğüm.

Hepsi aynı anlayıştan geliyor: Doğal dil, yeterince zengin bir araçtır,                                                                                                                                                                                                                                                      

### Ne zaman işe yarıyor, ne zaman işe yaramaz?

Düşünüleme 适用于:

- Çıkışlı bir başarısızlık sinyali.
- Görev sınıfı 可复现( Aynı tip sorular tekrar ortaya çıkacak)。
- Düşünce, rota geliştirme için yer var (doğru bir eylem bütçesi var)

Düşünüleme:

- Ajan, ilk deneme başarıyla yapıldı.
- 失败来自外部因素(ağ çökmüş, araç kırılmış) 反思ağ çökmüştü对未来运行没有帮助
- Bir anlık bir hikaye için bir düşünce dönüştürülmüştür.

2026 yılının tuzağı: hafıza rotasyonu: Refleksyonlar: TTL ayarlama, ya da ayrı bir uyku temizleme aracı kullanma.


```figure
react-trace
```

## Yapın onu.
`code/main.py`Bir oyuncak bulmaca üzerinde gerçekleştirmek Düşünce: 3 elementli bir liste oluşturun, toplamını hedef değere benzer hale getirin. Aktör  aday listeleri ortaya çıkar; değerlendirici  kontrol toplamı; Kendini yansıtıcı  yazın bir satır hangi hatalı teşhis hakkında. Düşünce bölüm hafızasına girer, bir sonraki deneme için kullanılmıştır.

Bileşenler:

- `Actor` Bir senaryo politikası, düşünceler görüyor 时会改进──
- `Evaluator.binary()`   hedef miktarı üzerine kurulmuştur.
- `SelfReflector` 生成一行 başarısızlık teşhisi
- `EpisodicMemory` 一个带 TTL semantikası sınırlı listesi。

运行:

```
python3 code/main.py
```

İzleme  göstermek üç kez deneme.  Deneme 1.  başarısız, depolama bir bölüm düşünce.  Deneme 2.  düşünce gör                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

## Kullan
LangGraph 作为节点模式 提供──Claude Code 的  reflection 作为节点模式 提供──Claude Code 的 `/memory`Komut ve pro-workflow `/learn-rule`Bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu arada, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda, bu konuda,`Session`Onu inşa etmek için.

## - Söyle.
`outputs/skill-reflexion-buffer.md`创建并维护一个剧情缓冲,包含反射捕捉、TTL 和 deduplication──给定一个任务类 和一次失败,它会产出一段真正帮助下一次试验的反思(而不是泛泛的要更谨慎) ──

## 练习
1. İkili değerlendirici 切换到返回距离米ट्रिक्स (BINARY EVALATOR) 切换到返回距离米ट्रिक्स (BINARY EVALATOR) 切换到返回距离米ट्रिक्स (BINARY EVALATOR) 切换到返回距离米ट्रिक्स (BINARY EVALATOR) 切换到返回距离米ट्रिक्स (BINARY EVALATOR) 切换到返回距离米ट्रिक्स (BINARY EVALATOR) 切换到返回距离米ट्रिक्स (BINARY EVALATOR) 切换到返回距离米ट्रिक्स (BINARY EVALATOR) 切换到返回距离目标有多远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远远的远远远
2. Bu noktadan sonra, daha eski düşünceler zararlı mı yararlı mı?
3. 实现 heuristic evaluator: Eğer aynı eylem tekrar ortaya çıkarsa,就将试验 标记为卡住――
4. Actor 运行 Reflection──Actor'ı onları fark etmeye zorlamak için en az bir refleksyon istisna mühendisliği nedir?
5. 阅读反思论文 中关于AlfWorld的第4节──从概念上复现 130% başarısı oranının iyileşmesi: Vanilla ReAct'e göre,关键 德尔塔是什么?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Reflexion | “Self-correction” | Shinn et al. 2023 — Actor、Evaluator、Self-Reflector 加 episodic memory |
| Verbal reinforcement | “Learning without gradients” | prepend 到下一次 trial prompt 的自然语言 reflection |
| Episodic memory | “Per-task reflections” | 针对一个 task class 的 prior reflections bounded buffer |
| Scalar evaluator | “Binary success signal” | 来自 ground truth 的 pass/fail 或 numeric score |
| Heuristic evaluator | “Pattern-based detector” | 预定义 failure signatures（例如 stuck-loop、too-many-steps） |
| Self-evaluator | “LLM-as-judge on own trace” | 没有 ground truth 时使用的 lower-signal fallback — 与 tool-grounded verification 搭配 |
| Memory rot | “Stale reflections” | Episodic buffer 被过时 entries 填满；用 compaction/TTL 修复 |
| Sleep-time reflection | “Async self-reflection” | 在 hot path 之外运行 Self-Reflector，使 primary agent 保持快速 |

## 延伸阅读
- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366) 经典 kağıdı
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute) üretim 中的 async yansıması
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) Bölümlü tamponları  bağlamın bir parçası olarak yönetmek
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Yansıma düğüm örneği
