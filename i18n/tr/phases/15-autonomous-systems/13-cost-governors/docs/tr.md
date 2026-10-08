# Eylem bütçeleri, İterasyon Kapıları ve Maliyet yöneticileri

> 某中型電子商務代理的月度 LLM 成本,在团队启动" sipariş izleme" becerisi 后,从 $1,200 跳到了 $4.800── bu fiyat hata değil── bu bir ajan yeni bir döngü buldu, döngü içinde devam ediyor── Microsoft'un Agent Yönetim Araç Kütlevi(2026 yılının 4 月 2 日) bu tür sorunlara karşı bir güvenlik standardı oluşturdu:`max_tokens`、 her görev için Token 和美元预算、 günlük/aylık sınırlar、 iterasyon limitleri、 bölük kat model yönlendirme、 hemen önbelleğe geçirme、 bağlam pencereleri、 pahalı işletim HITL kontrol noktaları、 bütçe ihlalinde öldürme anahtarları。 Antropik'in Claude Code Agent SDK farklı isimlerle aynı temel kapasiteyi sağlar。 finansal hız sınırları, örneğin 10 dakikada 50 dolardan fazla $'dan fazla kesin giriş, oranlama sınırları daha hızlı bir şekilde tutun döngü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü­ü

**Type:** Learn
**Languages:** Python (stdlib, layered cost-governor simulator)
**先修要求：**15 · 10 aşaması (İzin modları), 15 · 12 aşaması (Gönüllü yürütme)
**Time:** ~60 minutes

## 问题

Otonom ajanların her turunda gerçek para harcanacaktır. Chatbot'un kötü çıkışı bir kötü geri dönüştür.Agent'in kötü döngüsü bir hesap.

Düzeltme yöntemleri bir rakam değil, farklı zaman ölçümleri ve ölçümlerin bir grup sınırlamasıdır: her talep, her görev, her saat, her gün, her ay. İyi tasarlanmış bir çeplik döngüsü birkaç dakika içinde ele geçirmek, birkaç saat içinde yavaş bir sızıntı, bir günde kötü bir yayın yakalamak için çeplik. Aynı set uzun vadede ve özerk bir ajanı da sağlayabilir.

Bu bir bölüm mühendislik dersi: Matematik çok basit, takım başarısız olduğu yerlerde. Aşağıdaki kısıtlama listesi, ya Microsoft Ajan Yönetim Araçları Kütüpçüsü'nden, ya da Anthropic Claude Code Ajan SDK'den 文档中的名称──

## 概念

### maliyet yöneticisi

1. **每次请求的 `max_tokens`。**简单―― herhangi bir bir seferinde sınırsız bir şekilde tamamlanmasını önlemek.
2. **每个任务的 Token 预算。**Tüm işlem sürecinde N 个 Token ∞'den fazla olması gerekir.
3. **每个任务的美元预算。**Tıklamalara benzer, ama birim para.`max_budget_usd`- Evet.
4. **每个工具调用上限。**N'den fazla değil`WebFetch`调用 ∞N 次 ∞`shell_exec`调用,等等...
5. **Iteration cap (`max_turns`)。**Ajan döngüsünün toplam  generasyon sayısı; sınırsız düşünce döngüsünü önlemek
6. **每分钟 / 每小时 / 每天 / 每月上限。**滚动窗口── farklı zaman ölçüsünde 滚动窗口──
7. **财务速度限制。**Örneğin, 10 dakikada 50 dolardan fazla harcanan bir ziyaret kesilmişse, aylıklık sınırın üzerinde olan döngüye dayalı tüketimi ele geçirmek için kullanılır.
8. **分层 model routing。**默认使用更小的模型; yalnızca sınıflandırıcı olarak 判断任务值时才升级到更大的模型──
9. **Prompt caching。**Sistem prompt 和 stabil context 存在 provider cache 中; yeniden gönderilen Token 成本接近零──
10. **Context windowing。**通过紧缩 /总结 把活文本 保持在值以下;直接降低 Token 成本。
11. **昂贵操作上的 HITL checkpoints。**Uzun zamanlı araç kullanımı, büyük yükleme, pahalı model yükseltme, yapay onay gerektirir.
12. **预算违约时的 kill switch。**任一上限触发时会议 中止──记录触发的上限; needs a stand-alone reboot path──

### Neden bir sınır yerine?

单个月度上限, para çanta boşluktan sonra kontrolden çıkmış ajanı yakalamak için geçerlidir. 单个月度上限, seans düzeyinde herhangi bir sorunu yakalayamaz.

- **失控循环**(Agent 5 saniyelik çekim sırasında):
- **缓慢泄漏**(Agent her görev yaklaşık iki kat 预期工作)
- **糟糕发布**(New Version Using 5x Token): 由每周 / 每月上限抓住──
- **合法激增**(真实需求,不是 bug):由小时 / 天上限抓住,并产生清晰日志──

### Claude Code'nın bütçe yüzeyi

Claude Code Ajan SDK 暴露了(公开文档):

- `max_turns` İterasyon kapısı。
- `max_budget_usd` 美元上限;违约时会议 中止──
- `allowed_tools`- Ne ?`disallowed_tools` 工具 allowlist 和 denylist。
- 工具使用前的克点,自定义成本核计算 हेतु,

İzinli mod merdivenleri ile birlikte (Deneyim 10)`max_budget_usd``autoMode`Sessiyon yönetilmez özerkliği. Antropik 明确把 Auto Mode 描述为需要预算控制;classifier与成本正交──

### AB AI Yasası  OWASP Ajansı Top 10

Microsoft'un Ajan Yönetimi Araç Kütüpleri  kapsamlı OWASP Ajan Top 10 ve AB AI Yasası Madde 14  İnsan denetim) gereksinimleri── AB'nin üretim ortamı,日志记录和上限执行 için seçeneğe uygun değildir──

###  gözlemlenmiş $1,200 → $4.800 olay

Microsoft'un dosyasındaki gerçek örnek: Bir e-ticaret ajansı yeni araç ekledikten sonra, aylık maliyet üç katına çıktı. Bu araç ajanı her oturumda bir sıra sipariş durumunu sormaya izin veriyor.


```figure
cost-governor-stack
```

## Kullan

`code/main.py`模拟中的代理在几个轮后漂移到轮询循环; 模拟中的代理在几个轮后漂移到轮询循环; 模拟中的代理在几个轮后漂移到轮询循环; 模拟中的代理在几个轮后漂移到轮询循环; 模拟中的代理在几个轮后漂移到轮询循环; 模拟中的代理在几个轮后漂移到轮询循环; 模拟中的代理在几个轮后漂移到轮询循环; 模拟中的代理在几个轮后漂移到轮询循环; 模拟中的代理在速度窗内抓住它,而单个月度上限在几天后才触发;

## - Söyle.

`outputs/skill-agent-budget-audit.md`审计一个拟议代理 部署的成本-governor stack,并标记缺层──

## 练习

1. 运行  İşlem`code/main.py`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖     ❖      ❖                                                                                                               

2. Browser ajanı için (Desin 11) Design One Set Per Tool Up Limits. Hangi araç en sıkı sınır gerektiriyor? Hangi araç sınırsız olarak risk olmadan çalışabilir?

3. 阅读Microsoft Agent Governance Toolkit 文档――列出工具kit 命名的每种上限类型――把每种映射到某个失败模式(失控循环、缓慢泄漏、糟糕发布、激增) 』

4. Bu yüzden, bir repo'da 50 sayı değerlendirme yaparak,`max_budget_usd`2x'in neden 2x olduğunu açıklayın.

5. Claude Code'ın `max_budget_usd`セッション tabanlı 聚合成本触发── tasarım dışı bir şekilde yerine getirilen bir tamamlama hız sınırı──what will trigger a cut, restart is what?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Denial of Wallet | "Runaway bill" | agent 循环产生花费，并且没有上限阻止它 |
| max_tokens | "Per-request cap" | 单个 completion 大小的上限 |
| max_turns | "Iteration cap" | 一个 session 中 agent loop 迭代次数的上限 |
| max_budget_usd | "Dollar kill switch" | session 成本上限；违约时中止 |
| Velocity limit | "Rate cap" | 短窗口内花费的限制（例如，$50 / 10 min） |
| Tiered routing | "Small model first" | 默认使用便宜 model；只有 classifier 判断值得时才升级 |
| Prompt caching | "Cached system prompt" | provider 侧 cache 将重发 Token 成本降到接近零 |
| HITL checkpoint | "Human approval gate" | 昂贵操作前需要人工确认 |

## 延伸阅读

- [Anthropic Claude Code Agent SDK — agent loop and budgets](https://code.claude.com/docs/en/agent-sdk/agent-loop) `max_turns`- Evet.`max_budget_usd`、 araç izinleri
- [Microsoft Agent Framework — human-in-the-loop 与治理](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) maliyet yöneticisi 检查点。
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) sağlayıcı 侧成本控制──
- [Anthropic — Prompt caching (Claude API docs)](https://platform.claude.com/docs/en/prompt-caching) önbelleğe alma mekanizması。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) uzun vadede çalışan ajanların maliyetleri görüntülenir.
