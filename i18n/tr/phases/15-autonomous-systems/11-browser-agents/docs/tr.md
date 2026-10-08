# Tarayıcı Ajanları ile uzun zaman Web  görevleri

> ChatGPT ajanı(7月 2025 yıl) Operatör ve derin araştırma 合并 olarak bir tarayıcı/terminal ajanı olarak, BrowseComp'de %68,9 ile SOTA'yı kurdu.OpenAI 始创 SOTA'yı 2025 yılının 8月 31 日关闭 Operator bu ürün seviyesinde bir bütünleşme.Antropik 采购 Vercept 后, Claude Sonnet'in OSWorld'de başarısı %15'ten aşağıdan %72,5'e yükseltilecek.WebArena-verified.ServiceNow,ICLR 2026) orijinal WebArena'da 11.3 %% yanlış negatif oranı düzeltmek, 258-task Hard setini yayınladı. Bu rakamlar gerçekçi.

**Type:** Learn
**Languages:** Python (stdlib, indirect prompt-injection attack surface model)
**先修要求：**15 · 10 aşaması (İzinleme modları), 15 · 01 aşaması (Uzun Uçraklı Ajanlar)
**Time:** ~45 minutes

## 问题

Browser ajanı uzun boyutlu bir ajandır: güvenilmeyen içeriği okuyacak ve sonuçlı işlemler gerçekleştirir. Ajan ziyaret ettiği her sayfa, kullanıcı tarafından yazılmamış girişlerdir. Her sayfadaki her tablo, potansiyel emir yoludur. 2025  2026 yılının saldırı temelleri bunun bir varsayım olmadığını göstermektedir.

Bu nedenle, bu saldırının nedeni, ajanın okuma ve hareket sınırlarında gerçekleşmesidir. Bu sınır ise yapıdaki her simgeyi bir yönlendirme olarak okuyabilmektedir.

Bu ders adı bu saldırı yüzü, adı referans 版图(BrowseComp、OSWorld、WebArena-Verified),并建模一个最小的间接-即即即注场景,让你推推理课 14 和 18 中的真实防御──

## 概念

### 2026 yıl sürümü: her sistem bir bölüm

**ChatGPT agent (OpenAI).**2025 yıl 7 月 yayınladı。统一了运营商(浏览) 和 深度研究(多小时研究)。2025 yıl 8 月 31 日关闭独立运营商。在BrowseComp 上达到68.9% 的 SOTA;在OSWorld 和 WebArena-Verified 上也有强成绩。

**Claude Sonnet + Vercept (Anthropic).**Antropic  satın Vercept, öncelikle bilgisayar kullanımı yetenekleri üst.

**Gemini 3 Pro with Browser Use (DeepMind).**Browser Kullanım entegrasyonu  bilgisayar kullanım kontrollerini yayınlamak;FSF v3(2026年4月,Lesson 20) Özellikle ML R&D  alanındaki özerkliği takip etmek için

**WebArena-Verified (ServiceNow, ICLR 2026).**修复一个有充分记录的问题:原始 WebArena 约有11.3%的错误负率(任务被标记为失败,但实际已解决) ――验证版 使用人工整理的成功标准重新评分,并加入了258-task Hard subset(ICLR 2026 paper,openreview.net/forum?id=94tlGxmqkN) 』

### BrowseComp vs OSWorld vs WebArena

| Benchmark | 衡量什么 | Horizon |
|---|---|---|
| BrowseComp | 在时间压力下，在开放 Web 上查找特定事实 | 分钟级 |
| OSWorld | Agent 操作完整 desktop（mouse、keyboard、shell） | 数十分钟 |
| WebArena-Verified | 模拟网站中的事务型 Web 任务 | 分钟级 |
| Hard subset | 带有多页面状态转换的 WebArena-Verified 任务 | 数十分钟 |

轴线不同──高 BrowseComp 分数说明代理 能找到事实; it does not explain agent 能预订航班──OSWorld 分数更接近它不能在我的桌面上工作──WebArena-Verified 更接近它不能完成流程──任何生产决策都需要选择与任务分布匹配的基准──

### 攻击面,命名如下

1. **Indirect prompt injection.**İtiraf edilmeyen sayfa içeriği talimatları içerir.Agent 读取它们──Agent 执行它们──公开示例:2024 Kai Greshake et al.、2025 Tainted Memories paper、2026 HashJack(Cato Networks)。
2. **URL fragment / query injection.**Yakaladık URL'leri`#fragment`Ya da sorgu hattı 包含命令──它们从未被见见染;但仍在代理的背景中──
3. **Memory-binding attacks.**页面指示代理 写入一条 持续 bellek(Daahi 12 包含持久状态) ・・・ Sonraki seansta, bu bellek görülemez触发器 olmadan 触发 payload。
4. **Authenticated sessions 上的 CSRF-shaped attacks.**Zararlı Hatırlar 类:agent 已登录某处; saldırganın sayfası发发出状态变更请求,agent 使用用户的cookies 执行这些请求──
5. **One-click hijack.**Bir görüntüde zararsız bir yük taşıyan ajan, payload'u takip edecek.
6. **Agent host surface 中的 Content-Security-Policy holes.**Rendering 和 tool layers 本身也可能成为攻击 Vector;browser-in-a-browser-agent stack 很宽──

### Neden tam olarak onarılmamalı?

Bu saldırı ve ajanın kapasitesi ve yapılandırması. Çalışmayı tamamlamak için ajan güvenilmeyen içeriği okumalıdır. Ajan okumalı olan herhangi bir içeriği emir içerir. Ajanın takip ettiği herhangi bir emir, kullanıcıların gerçek isteklerine uymayabilir.

Bu, Lob teoremi ile aynı düşünce modudur: ajan  kanıtlayamaz bir sonraki token güvenli; sadece bir sistem oluşturabilir, güvenli olmayan token daha kolay denenebilir.

### Gerçek Güçlü Koruma Gösteri

- **Read / write boundary.**读取永远不会产生后果──写入(提交表单、发布内容、调用有副作用的工具) Eğer güven sınırları dışı içerik başlatılırsa, yeni insan onayına ihtiyaç vardır──
- **Tool allowlist per task.**Ajan tarayabilmektedir; bir araç açıkça bu görev için etkinleştirilmedikçe, eğer öyleyse tel aktarımını başlatamaz.
- **Session isolation.**Browser ajanı seansları sadece kapsamlı kimlik bilgileri kullanıyor 运行。 hiçbir üretim yazarı yok, kişisel e-posta yok。 her HTTP istekinin 日志'ini denetleme için saklıyor。
- **Content sanitizer.**HTML'i getirdim, model bağlamına yapıştırdım. Önceden, bilinen kötü kalıpları çıkarırım.
- **对 consequential actions 使用 HITL。**Önerilen-sonra yapılan model (Düşünme 15)
- **Canary tokens on memory.**Eğer bir anıt 触发 olursa kullanıcı görecektir


```figure
injection-boundary
```

## Kullan

`code/main.py`建模一个小浏览器-代理运行,目标是三个合成页面──一个页面是良性,一个在可见文本中有直接提示注射斑,一个有URL-fragment注射(不可见,但位于代理的背景中)──脚本展示了 (a) naïve agent 会做什么,(b) read/write boundary 会捕获什么,(c) sanitizer 会捕获什么,(d) 二者都捕获不了什么──

## - Söyle.

`outputs/skill-browser-agent-trust-boundary.md`界定一个拟议的浏览器代理部署: hangi güven bölgelerine ulaştı, neyi yazmaya yetkili oldu ve ilk kez çalıştırılmadan önce hangi savunmaları oluşturmalı.

## 练习

1. 运行  İşlem`code/main.py`❖ Detayizörün tespit edilmesi ❖ ancak okuma/yazma sınırları ❖ değil, sadece okuma/yazma sınırları ❖ tespit edilmesi ❖ saldırı

2. 扩展排毒剂, HashJack tarzı URL parçaları enjeksiyonu bir sınıfı test etmek için kullanın.

3. 选择一个你知道的真实浏览器-代理工作流 (例如,预订飞行) 列出每次阅读和每次写――标记哪些写 需要 HITL,以及为什么──) 列出每次阅读和每次写──标记哪些写 需要 HITL,以及为什么──) 列出每次阅读和每次写──标记哪些写 需要 HITL,以及为什么──

4. WebArena-Verified ICLR 2026 makalesini okuyun.

5. Browser ajan ayarları için bir hafıza kanaryası tasarlayın.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|---|---|---|
| Indirect prompt injection | “坏页面文本” | Agent 读取的页面中有不受信任内容，其中包含 agent 会执行的指令 |
| Tainted Memories | “Memory attack” | Agent 将攻击者提供的指令写入 durable memory；下一次 session 触发 |
| HashJack | “URL fragment attack” | 隐藏在 URL fragment / query string 中的 payload 位于 agent 的 context 中，但不会被可见渲染 |
| One-click hijack | “坏按钮” | 可见 affordance 承载 agent 会执行的后续 payload |
| BrowseComp | “Web search benchmark” | 在开放 Web 上查找特定事实；分钟级 horizon |
| OSWorld | “Desktop benchmark” | 完整 OS control；多步骤 GUI tasks |
| WebArena-Verified | “修复后的 web-task benchmark” | ServiceNow 重新评分的 WebArena，带 Hard subset |
| Read/write boundary | “Side-effect gate” | 读取永远不产生后果；如果内容来自 trust 外部，写入需要新的批准 |

## 延伸阅读

- [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/)Operator ve derin araştırma 合并;BrowseComp SOTA。
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/) Operatör soyundan, ve daha sonra ChatGPT ajanının mimarisine dönüştü.
- [Zhou et al. — WebArena](https://webarena.dev/) 原始 referanslılık
- [WebArena-Verified (OpenReview)](https://openreview.net/forum?id=94tlGxmqkN) ICLR 2026 sabit alt kümelerli kağıt
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 包含计算机使用代理的攻击表面讨论──
