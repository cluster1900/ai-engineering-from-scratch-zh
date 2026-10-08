# Kontrol noktaları ve geri dönüş

> Her bir grafik durumu  dönüşüm sürecek   çöktüğünde kiralama süreci sona erer, başka bir işçi en son kontrol noktasından  geçecek    Bağışlama  Cloudflare Durable Objects  geçici bir süre veya birkaç hafta sürecek  Kaydetme durumu   Önerilen-sonra-devretim  Ders 15) Her hareket için rollback tanımlamak  planı    Hareket sonrası testin kapalı olması bu döngü  AB AI Kanunu Madde 14  Yüksek riskli sistemlerin geçerli insan denetimi olması gerekir, pratikte bu kontrol noktası  sorgulaması gerekir  rollback  denetimi geçirmek  denetimi geçirmek  denetimi geçmek  devam etmesi gerekir                                                                                                                                                                                                                                                                                                                                                     

**Type:** 学习
**Languages:** Python（stdlib，checkpoint 与 rollback state machine）
**Prerequisites:** Phase 15 · 12（Durable execution），Phase 15 · 15（Propose-then-commit）
**Time:** ~60 分钟

## 问题

Sürdürülebilir yürütme(Düşünme 12) çöküşün ajanını geri alabilir.Önce-öğütlenme(Düşünme 15) onaylanmış hareketin kontrol edilebilir olmasını sağlar.

Gerçek sistemler farklı bir şekilde bu mekanizmaya bağlanacak:

- **LangGraph**Bu, bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye göre bir işçiye geri döner.`interrupt()`Bir süreliğine durur, fakat kendiliğinden de devam ettirilir.
- **Cloudflare Durable Objects**Hedefleri ve onaylanmış hareketleri aynı konuma yerleştirmek için.
- **Microsoft Agent Framework**İş akışı API'sinde ortaya çıkıyor`Checkpoint`-Devamlılar. -Devamlılar.

无论哪种情况,真正有效的组合都是:idempotency key (Devamı önlemek) + ön koşul kontrolü (Biriş hali hala onaylanırken) + eylem sonrası doğrulama (Yarı etkisi gerçekten gerçekleşir) + doğrulama-başarısızlık  rollback。

## 概念

### Her dönüşüm kalıcılık olacaktır.

Graf-state  dönüşüm, bir isimlendirme durumundan diğerine taşınmanın herhangi bir adımını ifade eder.

### Kiralama geri kazanımı

İşçi 

### İdempotency + ön koşullar

Bu durumu düşünün: bir iş akışı onaylanmıştır$1000 时，从 A 向 B 转账 $100──workflow 已 commit,在执行中崩,然后恢复──如果只检查无效率关键,并且执行恢复,那么转账会运行一次 (正确) ―但考虑在崩和恢复之间,A's余额通过另一个工作流 降到了$500──无效率检查 仍然通过;前条件 不通过──没有前条件检查,我们就会制造通过支──

Her bir hareketin sonucu iki şey gerektirir:

- **Idempotency key**: prevent重复执行──
- **Precondition check**• onaylanmış hareketlerle uyumlu olarak devam etmektedir.

### 动作后验证

工具 返回 200不是验证──真正的验证会重新读取目标状态,并确认副作用 确实发生了──模式包括:

- Veritabanı güncelleştirme:`UPDATE ... RETURNING *`Sonra da geri dönüş sırası beklenen durumla uyumlu olduğunu belirler.
- E-posta gönder: gönderilen dosya içinde gönderilen mesaj kimliği kontrol edilmiştir.
- Dosya yaz: read回文件并计算 hash──
- API çağrısı: hedef kaynaklara 执行后续 `GET`- Evet.

Eğer doğruluğu başarısız ederseniz, iş akışı bilinmeyen bir kötü durumda demektir.

### Rollback planları

15) Dersinde, her bir sonraki harekete bir geri dönüş planı vardır.

- **In-band rollback**: doğrudan反转 yan etkisi`INSERT`后 `DELETE`, gönderilmesinden sonra `Send-correction-email`)。
- **Compensating transaction**Bir de yeni bir hareket, orijinal hareketleri kaldırmak için.
- **Out-of-band rollback**İnsanları uyar, iş akışını durdur, araştırmak için kötü durumunu koru.

Bu, bir öneride belirlenmelidir. Bu, bir öneride belirlenmelidir.

### AB AI Yasası 14 maddesi

Madde 14                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

- Kontrol noktası, denetçi tarafından sorulabilir.
- Rollback 已演练过 (((至少端到端测试一次))
- Denetim yolu 能在部署 后继续存在(checkpoint backend 不是短暂)
- Başarısızlık doğrulama, kayıtlara kaydedilmek yerine uyarı gönderilir.

Bir iş akışı Eğer bir iş sırasında çöküş 、 geri kazanmak, sonra doğrulama + geri dönüş yolları olmadan yan etkisi tamamlanırsa, Madde 14 测试

### 尖失效模式:重复执行

Bu alanda en yaygın üretim kazaları:

1. 动作已批准,odempotence key 为 k.
2. Başlamak, yürütmek, geri dönmek 200
3. İş akışı içinde devamlı  görevli   durumu önceden çöküş 
4. İş akışı 恢复; see has been approved but not committed; yeniden yürütülmüş¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
5. Yan etkisi 触发两次──

缓解方式: in-flight  niyetini gerçekleştirmeden önce, idempotency anahtarını kullanarak 执行, sonra sadece committed  olarak işaretlenir                                                                                                                                                                                                                                          


```figure
checkpoint-replay
```

## Kullan

`code/main.py`实现带检查点的工作流,包含无限能力、先决条件、验证 和反弹──司机 模拟四个场景:干净运行、崩后的重试(无限能力 捕获) 预条件失败(工作流 中止且不触发动作) 验证失败(触发反弹) 

## - Söyle.

`outputs/skill-rollback-rehearsal.md`Önerilen iş akışı için  rollback-prov test tasarımı,并审计 kontrol noktası arka planı

## 练习

1. 运行  İşlem`code/main.py`❖验证四个场景── ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖

2. 修改 mark first done, then do it 模式, let status write 在动作后触发──重新运行 场景──测量触发了多少重复动作──

3. Bu nedenle, bir Slack kanalına gönderilen bir rollback planı oluşturmak için, bir üretim planı oluşturmak için, bir slack kanalına gönderilen bir rollback planı oluşturmak için, bir slack kanalına gönderilen bir rollback planı oluşturmak için, bir slack kanalına gönderilen bir rollback planı oluşturmak için, bir slack kanalına gönderilen bir rollback planı oluşturmak için, bir slack kanalına gönderilen bir rollback planı oluşturmak için, bir slack kanalı oluşturmak için, bir slack kanalı oluşturmak için, bir slack kanalın oluşturulması için, bir slack kanalın oluşturulması için, bir slack kanalın oluşturulması için, bir slack kanalın oluşturulması için, bir slack kanalın oluşturulması için, bir slack kanalın oluşturulması için, bir slack kanalın oluşturulması için, bir slack kanalın oluşturulması için, bir seçim nedenini açıklamak için, bir slack kanalın dışına çıkması için, bir slack kanalın oluşturulması için, bir seçim yapılması için, bir seçim yapılması için, bir seçim yapılması için, bir düzenleme yapılması için, bir düzenleme yapılması, bir düzenleme yapılması, bir düzenleme yapılması, bir düzenleme yapılması, bir düzenleme yapılması, bir düzenleme yapılması, bir düzenleme yapılması, bir düzenleme yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapılması, yapması gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek gerek

4. 選一你熟悉的工作流──识别每一个状态转换──为每一个转换标记耐久性要求(persist / do not persist)──统计你当前还没有持久化的数量──

5. Tekrar yapılmış geri dönüş testi: bir uçtan sonuna test tasarlayın, gerçek iş akışını yürütün, çökmesini sağlayın, geri dönüş yolunu onaylayın 被触发──这个测试应该断言什么?

## 关键术语

| Term | 人们的说法 | 它真正的含义 |
|---|---|---|
| Checkpoint | “保存点” | 每一次 graph-state 转换都会持久化到 durable store |
| Lease | “Worker 声明” | 短期声明，表示某个 worker 正在执行一个 run；崩溃时过期 |
| Precondition | “状态关卡” | 断言状态仍与已批准动作保持一致 |
| Post-action verify | “重新读取检查” | 确认 side effect 确实在目标系统中发生 |
| In-band rollback | “直接撤销” | 用逆向操作反转 side effect |
| Compensating transaction | “SAGA 撤销” | 一个新的动作，用来抵消原动作 |
| Mark-as-done-first | “状态写入顺序” | 在从 commit 返回前持久化 committed 状态 |
| Article 14 | “EU AI Act 人类监督” | 操作性含义：可查询 checkpoint、已演练 rollback、可审计 trail |

## 延伸阅读

- [Microsoft Agent Framework — Checkpointing and HITL](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop)Kontrol noktaları ve kiralama geri kazanımı
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) Dayanıklı nesneler 作为状态基底──
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 监管基线。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) uzun vadede iş akışının güvenilirlik çerçevesini oluşturmak
- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) Claude Code Routines'ın iş akışı 形态。
