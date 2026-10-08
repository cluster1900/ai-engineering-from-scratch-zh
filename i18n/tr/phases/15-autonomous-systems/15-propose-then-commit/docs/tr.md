# İnsan-da-da-da: Öneriler-sonra Bağlılık

> 2026 yıl HITL hakkında bir fikir birliği bulunmaktadır. Bu agent 发问, user点击 Approve──它是提案-then-commit:拟议行动会连同无权关 持久化到可久存储; 意图、数据系、许可触及、爆射和滚back plan 呈现给评论员; 只有在明确肯定确认后才 commit; 执行后再验证,确认副作用 确实发生── LangGraph 的`interrupt()`PostgreSQL kontrol noktası  Microsoft Agent Framework `RequestInfoEvent`, ve Cloudflare ' ın `waitForApproval()`                                                                                                                                                                                                                                                              

**Type:** 学习
**Languages:** Python (stdlib，带 idempotency 的 propose-then-commit state machine)
**前置要求：**15 · 12 aşaması (Gönüllü yürütme), 15 · 14 aşaması (Tripwires)
**Time:** ~60 分钟

## 问题

Agent bir eylem gerçekleştirir. Kullanıcı karar vermeli: onay veya onaylamamak. Eğer karar anlıksa, muhtemelen bir inceleme olmayacaktır.

2023 年代 HITL örneği 同步提示:Agent, Y  body onayıyla X'ye e-posta göndermek istiyor mu? User click click Approve。 Herkes sistemin güvenli olduğunu düşünüyor。 Praktiki olarak, bu arayüz çok kolay bir şekilde kağıt damgasına maruz kalır: kullanıcı onaylıyor 快速批准 几乎无法预测什么;当代理出错时,审计轨迹会显示一长串用户已经记不起来的批准 历史。

2026 yılın tarzı, yani öner-sonra-tümleşme, HITL'i üstüne taşı, yapay metadata ekleme,  pozitif teminat gerektirir.`interrupt()`Microsoft Agent Framework`RequestInfoEvent`Cloudflare`waitForApproval()`❖API 名称不同;形态相同──

## 概念

### Önerilen-sonra görev yapan devlet makinesi

1. **Propose.**Agent 生成 bir önerici eylem. Bu işlem, durabilir bir depoya dönüştürülmüştür. PostgreSQL、Redis、Durable Object)
   - Niyet ((Agent neden bunu yapmalı)
   - Verilerden kaynak hangi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
   - İzinler touched(哪些 scopes / dosyalar / son noktaları)
   - Patlama radyosu ((En kötü durum nedir))
   - Geri dönüş planı ((( eğer commit 了, biz nasıl geri çekmek)
   - İdepotenciya anahtarı( her önerme 唯一;重复提交返回同一条记录)
2. **Surface.**Eleştirmen 看到包含全部的元数据的提案── Eleştirmen 是人(不是代理 自己 review 自己) 』
3. **Commit.**明确肯定确认──action 执行──
4. **Verify.**执行后,读取并确认副作用──如果验证步骤 失败,系统处于已知坏状态,并触发警报──

### İdepotans anahtarı

没有无效率关键 时,过渡失败 后后的试机可能重复执行已批准的行动――具体例:用户批准转移100美元从A到B──网络短暂动── 网络短暂动── 工作流重新尝试──用户只批准一次,但转移 执行两次──无效率关键将批准 绑定到单个单个副作用;第二次执行是无效──

Bu Stripe ve AWS API'lerinin kullanımında idempotency modeline benzer. Microsoft Agent Framework dosyaları, bunu temsilci onaylarına geri koymayı gerektirir.

### Süreklilik: Neden onaylar süreci hayatta kalır?

Onaylama bekleme odası ise bir bölüm değil ajanın mülkiyetinin durumu. İş akışı durduruldu.`interrupt()`PostgreSQL kontrol noktası ile 配对, sadece hafıza durumuna değil:

### Kağız damgası onayları ve meydan okuma ve yanıt azaltma

HITL'in default UI(Approve / Reject düğmeleri) hızlı bir şekilde onaylanacak, ancak gerçek bir inceleme yok。文档化 mitigation:challenge-and-response checklist,要求在 Approve düğmesi 启用之前,对具体问题给出明确肯定答──具体形态:

- Bu işlemin hangi kaynakla ilgili olduğunu anlıyor musun?
- Patlama radyusunu onaylıyor musun?
- Başarısız olursak, geri dönüş planınız var mı?

Bu, bir süreç ve bir süreç için değil, zorlayıcı bir fonksiyon olarak görülüyor. Bu çerçeveleri eleştiren, açıklama istemek, yükseltmek, reddetmek veya reddetmek için değil.

### Ne demek oluyor ?

Bu konuda her bir eylem için önerilen ve sonra da yapılan bir karar gerekir.

- **Consequential actions**(始终 HITL):不可逆写入、金融 işlemleri、 dışa giden iletişim、 üretim veritabanı değişiklikleri、 yıkıcı dosya sistemleri operasyonları¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- **Reversible actions**(有时 HITL): yerel dosyaların düzenlemeleri, aşamalama-env değişiklikleri, net bir geri dönüşle dönüştürülebilir yazılar
- **Reads and inspections**(從不 HITL):读取文件、列出资源、调用只读的API──

### Eylem sonrası doğrulama

Commit ran 不等于 the side effect happened──网络-分割和竞赛条件可能让工作流以为自己成功而后端实际并没有持续──verification step 会在 commit 后重新阅读目标资源以确认──这与使用`RETURNING`Sözleşmeler, veya`PutObject`后执行 AWS `GetObject`Aynı bir örnektir.

### AB AI Yasası 14 Maddesi

Madde 14                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           


```figure
mx-propose-then-commit
```

## Kullan

`code/main.py`Python kullanılarak, bir önerme ve sonra görev yapma devleti makinesi gerçekleştirilmektedir. Dayanıklı depolama JSON dosyasıdır. İdempotency anahtarı (thread_id, action_signature) 哈şıdır.

## - Söyle.

`outputs/skill-hitl-design.md`会 review bir önerilen HITL iş akışı olup olmadığını önerir-den sonra görev 形态,并标记缺失的元数据、idempotency、verification或挑战-and-response层──

## 练习

1. 运行  İşlem`code/main.py` onaylanmış önerinin tekrar denemesi; • kalıcı kayıt kullanmak; • tekrar yürütmamak; • sonra boşluk anahtarını değiştirmek; • zaman damgasını içermek; • tekrar denemek; • çift yürütmek; • tekrar denemek; • tekrar yürütmek; • tekrar yürütmek; • tekrar yürütmek; • tekrar yürütmek; • tekrar yürütmek; • tekrar yürütmek; • tekrar tekrar yürütmek; • tekrar tekrar denemek; • tekrar tekrar çalışmak; • tekrar tekrar çalışmak; • tekrar tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar çalışmak; • tekrar tekrar çalışmak; • tekrar; • tekrar tekrar; • tekrar tekrar tekrar; • tekrar; • tekrar; • tekrar; • tekrar; • tekrar;

2. Kullanım`rollback`alanı  genişletme önerisi kaydı──模拟一次验证步骤 失败的执行──展示 rollback 会自动触发──

3. Microsoft Ajan Çerçeve'nin`RequestInfoEvent`DOCKS, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FELD, DATA FALD, DATA FALD, DATA FALD, DATA FALD, DATA FALD, DATA FALD, DATA FALD, DATA FALD, DATA FALD, DATA FALD, DATA FALD, DATA FALD, DATA FALD, DATA FALD,                                                                                                                                                                    

4. Özel bir eylem için (örneğin Twitter hesabına bir yazı) meydan okuma ve yanıt kontrol listesini tasarlamak.

5. 选择一个同步 批准?快速 足够的场景(不需要持久的店) ――解释原因,并说明你接受的风险类──

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Propose-then-commit | “Two-phase approval” | 持久化 proposal + positive commit + verify |
| Idempotency key | “Retry-safe token” | 每个 proposal 唯一；第二次 execution 为 no-op |
| Data lineage | “Where it came from” | 导致 proposal 的具体 source content |
| Blast radius | “Worst case” | action 出错时的影响范围 |
| Rubber-stamp | “Fast approval” | 没有真正 review 就点击 “Approve” |
| Challenge-and-response | “Forcing checklist” | Reviewer 必须明确确认具体问题 |
| RequestInfoEvent | “MS Agent Framework primitive” | 带结构化 metadata 的 durable HITL request |
| `interrupt()` / `waitForApproval()` | “Framework primitives” | 同一形态的 LangGraph / Cloudflare 等价物 |

## 延伸阅读
- [Microsoft Agent Framework — Human in the loop](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) `RequestInfoEvent`,kalıcı onaylar..
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) `waitForApproval()`和 Dayanıklı Nesneler
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)HITL  uzun vadede riskin azaltılması olarak
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 高风险系统的监管基线──
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)  Gözlem çevresindeki anayasa çerçevesini oluşturmak
