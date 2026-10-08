# 作为自主代理的克劳德代码:权限模式与自动模式

> Claude Code 七种权限模式──"plan" 会在每个动作前询问,"default" Sadece riskli hareket sorgularına göre, "acceptEdits" otomatik onay dosyası yazılır, ancak hala  shell 执行 确认, "bypassPermissions" 会批准一切──Auto Mode(2026年3月24日) iki aşamalı bir güvenlik sınıflandırıcısı ile birlikte hareket onayını değiştirir: her hareket tek belirti 快速检查; işaretli hareket toplantısı, düşünce zinciri derin inceleme `max_turns`和 `max_budget_usd`强制执行──Auto Mode 以研究预览 形式发布Anthropic 已明确表示,classifier 单独使用并不足──

**类型：**Öğrenme
**语言：**Python(stdlib,两阶段 sınıflandırıcı simülatörü)
**先修要求：**15 aşama · 01(Uzun ufuk ajanları),15 aşama · 09(Kodlama ajanları manzarası)
**时间：**45 dakika kadar .

## 问题

Sizin makinerdeki özerk kodlama ajanı bağımsız bir güvenlik sınıfıdır. Bu saldırı, bu ajanın tüm dosya sistemlerine, ağlara, kredi kartlarına, herhangi bir tarayıcı sekmesine, herhangi bir terminal açılmasına erişebilmesi için kullanıldığı açıktır.

Claude Code'un yetki sistemi bir öntemli / özerk openı değil, özerk openı değil, özerk öntemli openı oluşturma yeteneği özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk özerk 

Mühendislik sorusu şu: Bu sistem neyi yakalayabilir, neyi kaybeder ve belirli bir görev için hangi modeli kullanmalı?

## 概念

### 七种权限模式

| 模式 | 行为 | 使用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准整个计划；每个动作在执行前都会被审查 | 不熟悉的任务；接近 prod 的代码；第一次在某个 repo 上使用 agent |
| `default` | Agent 运行动作；对任何“有风险”的动作提示用户（shell exec、destructive operations、network calls） | 大多数交互式 coding sessions |
| `acceptEdits` | 文件写入自动批准；shell exec 和 network calls 仍然提示 | 跨很多文件的 refactoring pass |
| `acceptExec` | shell commands 在经过整理的 allowlist 内自动批准；写入自动批准 | 紧密 inner loops，其中每个 shell command 都是 `npm test` 或类似命令 |
| `autoMode` | 两阶段 safety classifier；被标记的动作提升为审查 | 受限 workspace 中的 long-horizon unattended runs |
| `yolo` | 跳过大多数提示；仍然运行 tool allowlist / denylist | 临时 sandboxes、CI jobs、research scripts |
| `bypassPermissions` | 批准一切 | 文档说明为“只在你愿意丢弃的 ephemeral containers 内使用” |

(Üst adı ile açık Claude Code docs 一致;"yolo" ise izin veren orta yere yönelik resmi olmayan bir kısaltma adı.

### Bir sayfa anlamak Otomatik Mod

Otomatik Mod ((2026 yılının 3 月 24 日 yayın) ilk olarak modelin onayına verilen yetki modudur.

1. **Stage 1 — single-token classifier。**Bu nedenle onaylanmış hareketler sırada kalmayacak.
2. **Stage 2 — secondary policy/safety review。**Sadece işaretli hareket üzerinde çalıştırılmaktadır. Bu hareketin etrafında, mevcut durum ve açıklama görevleri, odaklı politika ve güvenlik değerlendirmesi uygulanmaktadır.

Budget kontrol ve sınıflandırıcı bulunmuyor:

- `max_turns` Bir seans Ortalama toplam 代次数──
- `max_budget_usd` 触发 seansı 中止的美元上限──
- Her aletin hareket sayısı sınırlıdır.`WebFetch`Çağrılar)

### Sistem neyi yakalayabilir?

- Araç girişleri arasında doğrudan enjeksiyon, içinde enjeksiyon talimatları bilinen riskli hareket biçimine yerleştirilmiştir.
- 重复 Araç döngüleri sınıflandırıcı N+1 eylemini N 连续五次几乎相同的行动 N 连续五次与行动 N 连续五次与动作 N 连续五次几乎相同的操作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作 N 连续五次与动作
- Bu sadece dosya düzenlemesi için bir seansta, açıkça sınırların üzerinden gelen komutlar var.

### Sistem neyi kaçırır?

- **微妙的 prompt injection**, bu davranış düzenlenecek, ancak tek bir işaretli hareket meydana gelmeyecek. Indirekt Cevap Enjeksiyonı tamamen düzeltilebilir bir hata değildir.
- **语义层面的不当行为。**Her tek hareket güvenli görünüyor, ancak birleştirilen oluşum yolları zararlıdır.
- **通过合法渠道 exfiltration。**Verileri sahip olduğunuz dosyalara yazacağım.`git push`Halkın kontrolüne, bir dizi hareket izin verilir ama sorun onların birleştirilmesinde.

### Araştırma ön gösterisi 定位

Antropic 将 Auto Mode 作为研究预览发布.文档明确说明,classifier is a layer防护, not a complete solution: user should use Auto Mode with budgets、allowists、isolated workspaces 和 trajectory audits(Düşünmeler 1216) 结合使用──preview 定位也反映了已记录的评估-vs. deployment gap(Düşünmeler 1)  Offline evals'ın sınıflandırıcısı,实用セッション中可能表现真不同,因为用户上下文是模糊的.

### Bu merdiven iş akışında yer alır.

- Tanınmamış görevler:`plan`Bir kere kötü bir şekilde çalışmaktan daha ucuz bir plan.
- 已知 refactor:`acceptEdits`能省下大量确认点击──
- Gözlemsiz arka plan çalıştırma: Sadece patlama radyusunu ölçtüğünüzde çalışma alanı içinde kullanın `autoMode`(İşlev belgesi yok, üretim süresi yok, başlıca seçim çıkışı yok)
- Efimeral konteynerler: sadece konteyner olarak kullanılır ve onların kimlikleri terk edilebilir.`yolo`- Ne ?`bypassPermissions`Sadece kabul edilebilir.


```figure
autonomy-oversight
```

## Kullan

`code/main.py`模拟两阶段分類器──Stage 1 ise, önerilen hareketlerin ucuz anahtar kelime kuralını hedeflemektedir;Stage 2 ise daha yavaş bir çok kural inceleyicisi──drive 输入一段简短的合成轨迹(安全行动、一次快速注射尝试、一次重复循环),并展示分類器 在哪里捕捉到问题、又在哪里漏掉问题──

## - Söyle.

`outputs/skill-permission-mode-picker.md`Görevlerin tanımlanması, doğru yetki sınırları, bütçe sınırları ve ayrımcılık gereksinimlerine uygun olacaktır.

## 练习

1. 运行  İşlem`code/main.py`❖ Hangi sentetik eylem tipi 1 aşamada belirtilmedi ama 2 aşamada yakalanmadı?

2. 扩展 1 aşama kural seti, belli bir bilinen kötü şekli yakalamak için`curl $ATTACKER/exfil`)── benig reaksiyon numune üzerinde yanlış pozitif oranı ölçülüyor──

3. Antropik'in "Agent Loop Nasıl Çalışır" makalesini okuyun.`default`模式下默认触碰的每种外部状态──在无监督运行中`autoMode`Ön, hangi tek kapı gerekir?

4. 24 saat beklenmedik bir bütçe tasarlayın:`max_turns`- Evet.`max_budget_usd`、 her aletin kapıları、 ‒aletçiler── ‖ açıklayın her sayıdaki nedenleri──

5. 描述一个轨迹:其中每个单独动作都被批准的阶段1 和阶段2 ,但组合行为却是错调的──(14 Sınıf 会介绍杀开关和加拿大代币如何处理这个问题──)

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| 权限模式 | “agent 能做多少事” | 控制逐动作批准的七种命名 policy 之一 |
| plan mode | “做任何事前都询问” | Agent 编写计划；用户在执行前批准 |
| acceptEdits | “让它写文件” | 文件写入自动批准；shell exec 仍然提示 |
| autoMode | “自动批准” | 两阶段 safety classifier；被标记的动作会升级 |
| bypassPermissions | “Full YOLO” | 批准一切；预期用于 ephemeral containers |
| Stage 1 classifier | “Fast token check” | 针对拟议动作的 single-token rule；并行运行 |
| Stage 2 classifier | “Deep review” | 对被标记动作进行 chain-of-thought reasoning |
| Research preview | “Not GA” | Anthropic 对 failure mode 仍在被映射的功能所使用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 权限模式、预算、行动形式──
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) yönetilen hizmet 执行模型。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) özellik yüzeyi ve Otomatik Mod duyuruları
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 塑造分類者 判断的理性基層──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于长视界许可设计的内部视角──
