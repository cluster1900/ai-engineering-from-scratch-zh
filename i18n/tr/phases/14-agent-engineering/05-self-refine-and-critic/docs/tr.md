# Kendini Temizle ve TANKIR: 代式输出改进

> Kendini Temizle(Madaan et al., 2023) bir LLM'nin döngü içinde üç rol oynamasına izin verin: üretmek, geri bildirim, temizlemek. Ortalama kazanç: 7 个任务上绝对提升 +20;;CRITIC(Gou et al., 2023) 通过将验证路由到外部工具来强化反击步骤──2026年, bu model 评估者-optimizer

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~60 分钟

## Öğrenme hedefi

- Self-Refine'in üç ipucuyu anlatmak, kendi kendine geri bildirim üretmek, neden geçmişin iyileştirilmesine neden olduğunu açıklamak çok önemli.
- 解释 CRITIC 的关键洞见: hiçbir dış yerleştirme yok,LLM'ler kendiliğinden doğrulanmaya上不可靠──
- 实现一个带历史 和可选外部验证器的 stdlib Self-Refine loop──
- Bu modeli Anthropic'in evaluator-optimizer iş akışına ve OpenAI Agents SDK'ın çıkış korumalarına yerleştirmek.

## 问题

Bir ajan neredeyse doğru bir cevap ortaya çıkardı. Belki bir kod var, bir sözcük hatası var. Belki bir özet. Belki bir uç durumu kaçırmış olabilir.

Kendini Temizle: Tek bir modelle, eğitim verilerine gerek yok, RL'ye de ihtiyaç yok, bunu yapabilirsiniz. Ama bir sorun var: LLM'ler sert gerçeklere iyi davranmazlar, kendi kendini doğrulayıcılar.

Bu iki makale 2026 yılında 代式改进的默认模式:generate、verify(能外部验证就外部验证) 、refine,在验证器 通过时停止──

## 概念

### Kendini Temizle ((Madaan et al., NeurIPS 2023)

Bir LLM, üç rol:

```
generate(task)            -> output_0
feedback(task, output_0)  -> critique_0
refine(task, output_0, critique_0, history) -> output_1
feedback(task, output_1)  -> critique_1
refine(task, output_1, critique_1, history) -> output_2
...
stop when feedback says "no issues" or budget exhausted.
```

关键细节:`refine`Bu yüzden bir daha yanlış yapmamaya çalışıyorum. Kağıtlar bu konuda bir açıklama yaptı: Tarihi yok etmek, kalite hızla düşecek.

核心结果: 7 个任务 (math、code、acronym、dialog) üzerinde ortalama olarak +20'lik kesin bir yükseltme getirir, GPT-4'i de dahil eder.

### CRITIC(Gou et al., arXiv:2305.11738, v4 Şubat 2024)

Kendini Temizlemenin Zayıf Noktası:Feedback 步骤是LLM 给自己打分── Gerçeklik iddiaları için, bu güvenilir değildir(halüsinasyon 往往在生成它的模型看来很有说服力)──Critic 用`verify(task, output, tools)`替换 `feedback(task, output)`, içinden `tools`İçeriyor:

- Gerçek iddiaları için arama motoru kullanmak.
- Kodu doğrulamasını kullanan bir kod yorumcu.
- Aritmetik hesap makinesi kullanıyor.
- 领域特定verifiers (Bölüm testleri, tip kontrol cihazları, şemsiyeler)

verifier, araç sonuçlarına dayalı yapılandırılmış eleştirileri oluşturacaktır.

KRAFİK:KRAFİK, gerçekçi görevlerde Kendini Düzeltmekten iyidir, çünkü eleştirin temelini vardır.

### Durumları

两种常见形态:

1. **Verifier 通过。**Dış departman testi  Geri dönüş başarısı。 var kullanılabilir koşullar 首选(birim testi、tip kontrolcü、 koruma tarzı iddiası)。
2. **没有发出 feedback。**Model diyor çıkış iyi. 成本より低だが不可靠; 最大 iiterasyon kaplaması ile birlikte olmalıdır.

2026 默认做法:组合二者── Eğer doğrulayıcı 通過,或模型说 fine 且 iteraciones >= 2,或 iteraciones >= max_iterations,则停止──

### Evaluator-Optimizer (Antropic, 2024)

Anthropic, 2024 yılının 12 月ındaki bir makalede, beş iş akışı örneği olarak adlandırıldı.

- Değerlendirici: Give output打分并生成批判──
- Optimizer: Bas critique 修订输出。

循环直到 evaluator 通过──这就是Anthropic 表述中的自精/CRITIC──Anthropic 补充的关键工程细节是:evaluator 和优化器提示 应该有明显不同的结构,这样的模型才不会只是膠盖章──

### OpenAI Ajanlar SDK çıkış koruyucuları

OpenAI Ajanlar SDK bu modeli output gardiyanları 提供──guardrail is on agent 最终输出上运行的验证者──如果 gardiyanı 触发 触发                                                                                                                                                                                                                                      `OutputGuardrailTripwireTriggered`),输遇被拒绝,agent can can can try again. Guardrails can can调用 tools.

### 2026 yılın kazısı

- **Rubber-stamp loops。**Aynı modelle aynı hızlı stille yapım ve eleştirim,  görünecek kadar  iyi görünüyor bana── yapı üzerinde farklı uyarılar kullanmak, veya daha küçük  daha ucuz modelle yapım eleştirisi──
- **过度 refine。**Her seferinde iyileştirilen geçiş, geçiş sürelerini artırır.
- **在 trivial tasks 上使用 CRITIC。**Eğer dış doğrulayıcı yoksa, CRITIC Auto-Refine için geri dönüştürülür; stub doğrulayıcı için 支付 latency


```figure
self-refine
```

## Yapın onu.

`code/main.py`Bir oyuncak görevi 上实现 Self-Refine 和 CRITIC: given topic, generate a brief bullet list──verifier 检查格式──3 个子弹,每个少于 60个字符──CRITIC 增加一个外部 事实验证,用于惩罚已知幻觉──

组件:

- `generate`Scenari yapımcısı.
- `feedback` LLM tarzı kendi eleştirisi。
- `verify_external` CRITIC tarzı temel verifikatör。
- `refine`Tarihe göre 改写输出。
- Durma durumu  doğrulayıcı 通過或最多 4 次 반복──

运行:

```
python3 code/main.py
```

BİRÇEKLER: ÖZÜ-TÜRİK ve TÜRİKLER: ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜ-TÜRİK, ÖZÜRİK, ÖZÜ-TÜRİK, ÖZÜRİK, ÖZÜRİK, ÖZÜRİK, ÖZÜRİK, ÖZÜRİK, ÖZÜRİK, ÖZÜRİK, ÖZÜRİK, ÖZÜRİK, ÖZÜRİ, ÖZÜRİ, ÖZÜRİ, ÖZÜRİ, ÖZÜRİ, ÖZÜRİ, ÖZÜRİ, ÖZÜRİ, ÖZİ, ÖZİ, ÖZÜRİ, ÖZİ, ÖZİ, ÖZİ, ÖZİ

## Kullan

Anthropic'in değerlendirici-optimizecisi, Claude dostu dilde ifade edilen bu modelle kullanılmıştır. OpenAI Ajanları SDK'nin çıkış koruyucuları 呈 CRITIC 形态(koruyucuları调用工具)  LangGraph 提供一个阅读起来像自炼反射节点──Google'ın Gemini 2.5 Bilgisayarı Kullanımı 增增一步安全评估器,这是CRITIC'in一个变体:每个动在 commit都会被验证──

## - Söyle.

`outputs/skill-refine-loop.md`Görev şekli, verifier kullanılabilirliği ve iterasyon bütçesi, değerlendirici-optimizeci döngüsünü yapılandırma, çıkış jeneratörü, değerlendirici/verifier ve optimizörün isteklerini ve durdurma politikasını belirler.

## 练习

1. Bu oyuncak kullanmak hâlâ yardımcı mı?
2. Dış verifiyeyi  gürültülü verifiye değiştirmek % 30 yanlış pozitif ile birlikte)  loop 会怎样? 2026 yılının çoğu koruma rakamının gerçekliği budur
3. 实现一个 generator-critic on different models 变体:big model 生成,small model critic── it can overcome the same model ?
4. 阅读Critic Section 3 ((arXiv:2305.11738 v4) ❖说出三类验证工具类,并为每类给出一个例子──
5. OpenAI Ajanları SDK'sını`output_guardrails`映射到Critic'in doğrulayıcı rolü. SDK ne yaptı, ne yaptı?

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Self-Refine | “会修复自己的 LLM” | 在一个 model 中执行 Generate -> feedback -> refine loop，并带 history |
| CRITIC | “Tool-grounded verification” | 用外部 verifier（search、code、calc、tests）替换 feedback |
| Evaluator-Optimizer | “Anthropic workflow pattern” | 两个角色：evaluator 打分，optimizer 修订，并循环到收敛 |
| Output guardrail | “Post-hoc check” | OpenAI Agents SDK validator，在 agent 生成输出后运行 |
| Verify step | “Critique phase” | 承重决策点：grounded 还是 self-rated |
| Refine history | “Model 已经尝试过的内容” | 先前 outputs + critiques 被前置到 refine prompt；去掉后质量会崩塌 |
| Rubber-stamp loop | “Self-agreement failure” | 相同 prompt 的 critique 返回 “looks good”；用结构上不同的 prompts 修复 |
| Stop condition | “Convergence test” | Verifier 通过，或没有 feedback 且达到 iteration cap；绝不能只有单一条件 |

## 延伸阅读

- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) 经典 kağıdı
- [Gou et al., CRITIC (arXiv:2305.11738)](https://arxiv.org/abs/2305.11738) Araçlı doğrulama
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) değerlendirici-optimizeci iş akışı modeli
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 作为Critic-shape verifiers 的输出 guardrails
