# LLM'lerin FinOps  单位经济性与 Multi-Tenant 归因

> 传统 FinOps 在 LLM 支出上会失效──成本是 Token 交易,而不是资源在线时长──标签无法映射,一个API通话是一笔交易,不是一个资产──工程决策(快速设计,文本窗口,输出长度)就是财务决策──2026 玩book 要求从第一天起就埋点三个归因维度:per-user:`user_id`) Oturum fiyatlandırması ve genişleme için, görev başına`task_id`+ `route`) Ürünlerin yüzey maliyetleri ve öncelikleri için, kiracıya göre`tenant_id`) için birim ekonomik ve süren. 四个代币层:快速、工具、记忆、响应,一个桶 会隐藏支出──多租户 产品的执行梯梯:按租户 设置率限:预期峰值的2-3x,清晰的429 + retry-after;日用支付 cap(合同上限的1.5-3x;触发率 收紧 + alert);当 spend z-score > 4 时启动杀开关 (自动暂停 + 调用页面)──归因模式:tag-and-aggregate;telemetry-joiner-trace-ID 发票;准确性最高) 样本-and-extrapolation;模型-based streaming time allocation;事件-real-source ‧报警; 标签: 标签, 漏洞; 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签, 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签 标签

**类型：**Öğrenin
**语言：**Python(stdlib,带 kill switch of oyuncak maliyet atribut simülatörü)
**先修：**17 · 13 · Gözlemlilik, 17 · 14 · Kaynaklama
**时间：**60 dakika kadar .

## Öğrenme hedefi

- 解释为什么传统FinOps (Tags + tiers) LLM 支出上会失效,并说出三个新归因维度──
- 枚举四个代币层 ((hızlı、工具、memory、response),并说明为什么单桶支付会隐藏成本──
- Çekilme merdiveni için çoklu kiracı için 产品设计执法梯 (rate → spend cap → kill switch)
- 选择单位指标( çözülmüş sorgu / eser başına maliyet), $/M Token değil。

## 问题

Hesaplarınız 40.000 dolar gösteriyor.
- Hangi kiracı bu parayı harcadı?
- Hangi ürün özellikleri bu harcamaları hızlandırmıştır?
- Bu kullanıcıların birbiri var mı?
- Günahın sebebi, hızlı şişme, alet çağrıları ya da hafıza genişletilmesi.

Provider taraflı etiket ve bulut kaynakları için birleştirme (tag-and-aggregate) EC2、S3) geçerlidir, çünkü etiketler satır öğelerine yayılacak. LLM API çağrıları otomatik olarak etiketlenmeyecek, arama sitesinde 打上用户/task/tenant,并一路传递──事后归因总会漏掉边案──

## 概念

### Üç tane tane.

**Per-user**(`user_id`): kim çok fazla maliyet üretti.

**Per-task**(`task_id`+ `route`): hangi ürün yüzeyi  ne kadar maliyet yarattı ‒ özelliklerin önceliklendirilmesini ve pahalı özelliklerin öldürülmeyeceğini belirlemeyi yönlendiriyor ‒

**Per-tenant**(`tenant_id`): hangi müşteri kârlıdır  Ekonomik birimleri, yenilenme fiyatlandırmaları, seviyeler 

İlk günden beri arama sitesinde burası üç boyutlu bir durum.

### Dört Token Layer

| Layer | Example | Typical % of total |
|-------|---------|---------------------|
| Prompt | system + user input | 40-60% |
| Tool | tool-call results fed back | 20-40%（agent workloads） |
| Memory | prior conversation / retrieved docs | 10-30% |
| Response | model output | 10-30% |

Dört katı bir kova içine koyup, optimize kaybını sağlar. Onları atribut skeminden ayırmak gerekir.

### Yükleme merdiveni

1. **Rate limit**按租客 设置──预期峰值的2-3x──返回带 `Retry-After`Kiracıların bir süreliğine karşı bir engel vardır.

2. **Daily spend cap**按租户 设置──合同上限的1.5-3x──触发:收紧率 limit + alert customer-success──

3. **Kill switch**基于相对租户基线的支出 z-score > 4──自动暂停租户;页面在调用;升级给 ops + CS──

### 归因模式

- **Tag-and-aggregate**Metadata başlıklarını:打 metadata başlıklarını;稍后聚合──简单;粗略──
- **Telemetry joiner**: Trace ID'ler üzerinden Trace'leri Billeme ile Bağlantı Yapın.
- **Sampling + extrapolation**%5-10 örnek, %5-10% tekrar tekrar tekrar kullanmak için kullanılır.
- **Model-based allocation**: regresyon kullanılarak 推断 cost driver── tags olmayan eski verilere uygundur──
- **Event-sourced**:把成本 作为流 (Kafka / Kinesis) içindeki olaylar―Real-time―
- **Real-time streaming**Çubuğu: 亚秒级更新。

### X'e düşen maliyet, birim göstergesidir.

$/M Token is vendor 语言──产品标标是:

- Her bir çalışma maliyeti çözülmüştür.
- Her yazı oluşturma maliyeti.
- Her başarılı ajan görevinin maliyeti:
- Her kullanıcı konuşur.

Ürün sonuçlarına bağlı kalmak için, ödemeler hiçbir değeri yoktur.

### 成本归因 结构 izleri

```
trace_id: abc123
  user_id: u_42
  tenant_id: t_7
  task_id: task_classify_doc
  route: model_haiku
  layers:
    prompt_tokens: 1800
    tool_tokens: 600
    memory_tokens: 400
    response_tokens: 150
  cost_usd: 0.0135
  cached_input: true
  batch: false
```

Her çağrıda tüm veri gölü yayılıyor.

### 复合节省 复合节省

Satır: kas + seri + rota + geçit.
- Kayıt L2(Fase 17 · 14): giriş 约便宜 10x。
- Satır: 17 · 15 aşama: %50 indirim
- Yol: Bedenin fiyatı: %60 oranında düşmüştür.
- Geçit verimliliği(17 · 19 aşaması): redundansi + tekrar deneme¬leri。

En iyi yığılmış durum: Naif başlangıçın yaklaşık % 5-10'u için. Çoğu ekip 2-3 kaldırağı etkinleştirdi. Çok azı dört taneyi yığdı.

### Hatırlamalı olduğun bir sayı var.

- 归因维度: kullanıcı başına ‧ görev başına ‧ kiracı başına ‧
- Çekil 層: hemen, araç, hafıza, cevap.
- Öldürme düğmesi: z puanı > 4
- 单位指标: $/M Token değil, çözülen sorgu başına maliyet
- Yüklü optimizasyonlar: Temel seviyeye ulaşmak mümkün.


```figure
i4-spend-ladder
```

## Kullan

`code/main.py`模拟一个多租户LLM服务,带三层执法梯子―― 插入一个虐待的租户,并演示杀开关―― 触发――

## - Söyle.

本课会生成 `outputs/skill-finops-plan.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △

## 练习

1. 运行  İşlem`code/main.py`❖ Öldürme anahtarı 触发?
2. Bir kiracılık ödemesi tablosu tasarlayın.
3. • En büyük kiracı, birim ekonomisi-negatif.
4. Desteği destekleme ürünü  çözülmüş bilet başına maliyet hesaplama:3M Token/ticket, günde yaklaşık 800 bilet, GPT-5 önbelleğe alınan oranı
5. 论证 Geriye dönük etiketleme yapılması mümkün müdür?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Per-user attribution | “user-level cost” | 每次 call 都打上 `user_id` |
| Per-task attribution | “feature cost” | `task_id` + `route` 识别 product surface |
| Per-tenant attribution | “customer cost” | `tenant_id`；驱动单位经济性 |
| Four token layers | “cost layers” | prompt + tool + memory + response |
| Rate limit | “429 guard” | 在 gateway 强制执行的 per-tenant ceiling |
| Daily spend cap | “daily ceiling” | Tenant-scoped budget，带 alert |
| Kill switch | “auto-pause” | Spend z-score > 4 触发 auto-suspension |
| Cost per resolved | “product unit metric” | 成本绑定到产品结果，而不是 Token |
| Telemetry joiner | “trace-to-billing” | 准确性最高的归因模式 |
| Stacked optimization | “cache+batch+route+gateway” | 复合节省到约 5-10% baseline |

## 延伸阅读

- [FinOps Foundation — AI FinOps Overview](https://www.finops.org/wg/finops-for-ai-overview/)
- [FinOps School — Cost per Unit 2026 Guide](https://finopsschool.com/blog/cost-per-unit/)
- [Digital Applied — LLM Agent Cost Attribution 2026](https://www.digitalapplied.com/blog/llm-agent-cost-attribution-guide-production-2026)
- [PointFive — Azure OpenAI 中的 Managed LLMs](https://www.pointfive.co/blog/finops-for-ai-economics-of-managed-llms-in-azure-open-ai)
