# 长时间运行的后台 Ajanlar:持久化执行

> Üretim Sınıfı Uzun Çeviri Ajanlar İşlemde Olmaz`while True`Ortalama ve her zaman LLM 调用都将成为带有检查点、retry 和重播的活动──Temporal的OpenAI Agents SDK 集成已于2026年 3 月 GA。Claude Code Routines (Anthropic) 调用,持续的本地进程──Session 会在等待人工输入时暂停,能在部署后继续存在,并从以`thread_id`Yeni kolaylık arkasında, eski bir modeldir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

**Type:** Learn
**Languages:** Python (stdlib, minimal durable-execution state machine)
**先修要求：**15 · 10 aşaması (İzinleme modları), 15 · 01 aşaması (Uzun Uçraklı Ajanlar)
**Time:** ~60 minutes

## 问题

设设一个运行四小时的代理――它调用了三个工具,两次提示用户,并进行了四十次LLM 调用――运行到半时,承载它的主机重启了――会发生什么?

- Sıradan bir şekilde.`while True`Çeviri: her şey kaybedilecek. Baştan başta. Üç araç çağrısı.
- Uygulamanın devamlı gerçekleştirilmesi: En yakın kontrol noktasından çalıştırılsın. Tamamlanmış etkinlikler yeniden yürütülmeyecektir. Sonuçları devamlı gerçekleştirilme logundan tekrar oynanır. Kullanıcıların onaylanmış olanları yeniden onaylaması gerekmez.

Bu, çalışma akış motorlarının on yıldır teslim ettiği aynı modeldir. Yeni değişim LLM'dir. Artık de belirsiz, pahalı ve yan etkileri olan bir aktivite haline gelmiştir.

Bu dersin ana yönü: Uzun döngü güvenilirlik düşüşü (METR)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

## 概念

### Aktiviteler  Çalışma akışları ve tekrarlama

- **Workflow**Bu, etkinlik logundan tekrar oynamak için, yanlış farklar ortaya çıkmamak için kesin olmalıdır.
- **Activity**Bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir sürece, bir sürece, bir sürece, bir sürecece, bir sürececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece
- **Event log**:持久化バックアップストア── her etkinlik başlatılması, tamamlanması, başarısızlığı, geri çekilmesi ve her iş akışı kararı kaydedilmektedir──────────────────
- **Replay**: Restore, Workflow 代码 baştan tekrar çalıştırılır; her tamamlanmış Aktivite, kaydedilen sonuçlara geri dönecek, ancak yeniden çalıştırılmayacak.

Bu, React ile  virtual DOM yeniden oluşturma veya Git ile aynı çalışma ağacının yeniden oluşturma biçimini gerçekleştirir.

### Neden LLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

LLM 调用 aşağıdaki özelliklere sahiptir:
- Değişiklik ve hareket model versiyonları nedeniyle de gerçekleşir.
- 昂贵(成本和延迟)
- Belki de başarısız olabilirsiniz.
- 带有副作用 (如果它们调用工具)

Bu, etkinliğin tipik bir görüntüsüdür. Her LLM'de bir kapak kullanmak, bir artış göstergesi ile tekrar tekrar başlatma kontrol noktasını ve tekrarlanabilir bir düzenleme izini elde etmek için etkinlik olarak kullanmak.

### E`thread_id`Anahtar Kontrol Noktalar

LangGraph、Microsoft Agent Framework、Cloudflare Durun Nesneler 和 Claude Code Routines hepsi aynı API biçimi aldı: bir`thread_id`(or similar price) tanımlama oturum; her devlet geçimi geçici olarak devam eder.

后端选择 çok önemli:

- **PostgreSQL**• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
- **SQLite**: Sadece yerel dev için; host üzerinden 会失数据。
- **Redis**: hızlı, ama eğer AOF/snapshot yapılandırılmamışsa 则临时性。
- **Cloudflare Durable Objects**:透明分布式;由唯一鍵 限定范围;可存活数小时到数周──

### Birinci sınıf olarak 工输入

Önerilen-sonra-devletlenme (Lection 15) İnsan durumunda sürekli bir bekleme gerektirir. İş akışı, durgunluk, dış kuyruk, beklenmekte olan talep, onay, kesin bir konumdan geri kazanılacak.

### 35 dakikalık çöküş

METR  gözlemlediği gibi, tüm ölçülmüş ajan sınıfı sürekli çalışmada yaklaşık 35 dakika sonra güvenilirlik düşüşü ortaya çıkıyor. Görev süresi iki katına çıkar, başarısızlık oranı yaklaşık olarak dört katına çıkar. Sürdürülme uygulanması bunu düzeltmez. Bu sadece dayanıklılığı ve yeniden giriş sırasında yeni HITL kontrol noktalarını birleştirmek için güvenlik modudur.

### Ne zaman devamlı bir şekilde yürütülür ?

- Çanak süresi birkaç dakikada ve yapay bir giriş yok.
- 严格只读的信息检索──
- Doğruluk gereksinimleri bir bağlam penceresinde içeriden tamamlanana kadar görevlerin belirli bir şekilde gerçekleştirilmesi için; bazı bir kez oluşturulan görevlerin gerçekleşmesi için.


```figure
memory-consolidation
```

## Kullan

`code/main.py`Python'un en az sürekli bir çalıştırma motorunu gerçekleştirmek için kullanılır.

- `@activity`dekorator,将 girişleri 和 çıkışları 记录到 JSON olay günlüğü。
- Bir sıralama için kullanılan Aktiviteler  sırasındaki İş Akışı fonksiyonu。
- Bir tane .`run_or_replay(workflow, event_log)`Bu işlev, tamamlanmış etkinlikleri tekrar oynayabilir, onları yeniden gerçekleştiremez.

Sürücü 会模拟一个三 Activity 的 Workflow,在中途崩,并展示 (a) 朴素再试会重新执行所有内容,而 (b) 重播只运行缺失的活动──

## - Söyle.

`outputs/skill-durable-execution-review.md`Bir planlanmış uzun süreli çalışma süreci için Agent Deployment'ın doğru bir sürekliliği olup olmadığını incelemek:

## 练习

1. 运行  İşlem`code/main.py`◊ observar simpel retry ⇒ between replay  Activity 执行次数的差异── modifiye crash point,并显示重复 count 会相应变化──

2. Oyuncak motorunu açık kullanım için değiştirmek`thread_id`❖ İki ortak aynı motorun ∼发发 session'ini simgeleyerek, ∼ onların etkinlik günlüğünü onaylamak ∼

3. Oyuncak motorunda bir etkinlik seçin. Bir belirsizlik belirlemeyi başlatmak.`Workflow.now()`API'ler:

4. LangChain'ın Runtime behind production deep agents 文章──列出 runtime 持久化的 her türlü durumu,并说明每一种覆盖了哪种失败模式──

5. 6 saatlik bir özerk kodlama görevi için kontrol noktası politikasını tasarlayın.

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|---|---|---|
| Workflow | “Agent 的脚本” | 确定性编排代码；可从 event log replay |
| Activity | “一个步骤” | 非确定性单元（LLM call、tool call）；执行前后都会被记录 |
| Event log | “backing store” | 每一次 state transition 的持久化记录 |
| Replay | “恢复” | 重新运行 Workflow；已完成 Activities 返回已记录结果，不重新执行 |
| Checkpoint | “保存点” | 以 thread_id 为 key 的持久化 state；resume 时最新状态胜出 |
| thread_id | “Session key” | 用来限定 durable state 范围的 identifier |
| 35-minute degradation | “可靠性衰减” | METR：成功率随周期大约呈二次下降 |
| Non-determinism | “replay 漂移” | Wall clock、random、LLM output；必须注册为 side effect |

## 延伸阅读

- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) bütçe  dönüşler 语义──
- [Microsoft — Agent Framework: human-in-the-loop and checkpointing](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) RequestInfoEvent 形态。
- [LangChain — The Runtime Behind Production Deep Agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) 具体运行时间要求──
- [OpenAI Agents SDK + Temporal integration (Trigger.dev announcement)](https://trigger.dev) LLM 调用 Aktivite 形态。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)35 dakikalık çöküş 参考。
