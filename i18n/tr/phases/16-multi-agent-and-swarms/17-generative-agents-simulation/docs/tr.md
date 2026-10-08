# Genreatif Ajanlar

> Park et al. 2023 (UIST '23, arXiv:2304.03442) 用三部分架构填充了**Smallville**25 ajanı içeren bir kum kutusu:**memory stream**(自然言語日志)**reflection**(Agent kendi akışına dayanarak daha yüksek düzeyde bir bütün oluşturur)**plan**(日级行为,然后是子计划) ―― 标志性结果是情人节 partisinin ortaya çıkması: bir ajanı yerleştirdiler ve bir Valentine's Day partiyi atmak istiyor, daha fazla bir yazı yok, gruplar arasında yayılmaya davet edildi; koordin日期, ve sonunda parti düzenledi.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**16 · 04 aşaması (Öncelik modeli), 16 · 13 aşaması (Ortaq hafıza)
**Time:** ~75 minutes

## 问题

Çoğu çoklu ajan sistemi, sıkı bir şekilde yazılmış bir ekiptir: planlamacı, kodlamacı, kod yazmacı, incelemeci, inceleme. Bu, net görevleri tanımlamak için uygundur.

Smallville Architekturası onun temelidir. Park 2023'e kadar, en iyi ajanı 模拟是浅层脚本跟随者; sonrasında, bu model açık dünyada Generative Agents'in öntanımlı yapı haline geldi. 2026 yılında inşa eden ajanı 模拟 ederseniz, ya Smallville'in üç bileşeni kullanırsanız, ya da neden kullanılmadığını açıklamak gerekir.

## 概念

### Üç parça

**Memory stream。**Bir sadece ek bir gözlem, hareket, düşünce ve planı vardır.**recency**- Evet.**importance**(Agent 自评 1-10)**relevance**(Bugün sorguların öyüstrü benzerliği)

```
[2026-02-14 09:12:03] observation: Isabella Rodriguez asked me if I like jazz
[2026-02-14 09:14:22] reflection:   I enjoy long conversations about music
[2026-02-14 10:05:00] plan:         Attend Isabella's Valentine's Day party tonight
```

Hatıra kurtarma 组合三个分数:`score = w_recency * e^(-decay * age) + w_importance * importance + w_relevance * cos_sim`✿Top-k 条目进入当前提示✿

**Reflection。**周期性地(每 N 条记忆或发生重要事件时),agent 从最近的记忆 生成更高阶综合──反思条目会写回流,并像其他记忆 一样可检查──这就是代理的构建理解的方式,也就是该架构中长期信念的等价──

**Plan。**Öncelikle, kaba bir gün planı vardır. Önce iş yerine git, Klaus'la akşam yemeği yi. Sonra da, küçük bir saat planı vardır. Sonra da, hareketli bir planı vardır.

### Neden üç şey önemli?

Park et al. ayrılığı yaparak gözlem, düşünce ve planın ayrıntılarını ortadan kaldırdı.

- Hiç .**observation**...Agent 会错过上下文,并基于过去的信念行动――
- Hiç .**reflection**, ajan daha yüksek bir sınıf inancını oluşturabilir; ilişki aşama kalır.
- Hiç .**plan**, davranışlar reaksiyonlu gürültüye dönüşür; hedefler ortadan kaybolur.

İnsan değerlendiricileri tarafından verilen güvenilirlik puanı üç bileşenin en yüksek seviyede; herhangi bir şehrin ortadan kaldırılması ölçülebilir bir degradasyon meydana getirir.

### Sevgililer Günü'nün 涌现

Bir ajan, Isabella Rodriguez, 14 Şubat'ta saat 5'te Hobbs Cafe'de Sevgililer Günü partisi vermek istiyor. Diğer 24 ajan da bu tür bir şey almadı.

1. Isabella'nın planı başkalarını davet etmekti.
2. Her davet, komşu hafızası akışının içinde bir gözlem haline gelir.
3. Komşunun düşüncesi: Isabella parti veriyor.
4. Komşunun planı 14 Şubat'ta partiye katılmak.
5. Komşular diğer komşulara anlatırlar.
6. 2 月 14 日下午 5 点, birkaç ajan Hobbs Cafe'ye toplandı.

Bu teknik anlamda bir sistem seviyesinde bir parti (bir parti) yerel bir iletişimden gelir.

### 文档记录的失败模式

Park et al. 明确记录了:

- **空间规范错误。**Ajan 走进已关闭的商店──Ajan 尝试使用同一个人卫生间──Ajan 在不适合用餐的房间里吃饭──模型不能仅从环境推断社会物理规范──
- **Memory overflow。**Bu, bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha daha
- **Reflection hallucination。**Refleksyon 可能编造内存流 中不存在的关系──缓解方式:

Bunlar üretim ile ilgili başarısızlık modelidir: 2026 yılının herhangi bir ajanı onları miras alacak.

### Üç bileşen gerçekleştirme kuralları

1. **Memory 是 append-only。**Unutma ki, bu yeni bir yazıdır.
2. **Importance 分数要便宜。**写入时调用 LLM 评估 1-10 的重要性──缓存该分数──
3. **Retrieval 是排序，不是过滤。**按组合分数取 Top-k; sert 过器 kullanma 会丢失上下文) 』
4. **Reflection 周期性运行。**İşlenmemiş hafıza önemini 总和超过值时触发(例如 150)。
5. **Plans 可以修订。**Yeni gözlem ve plan                                                                                                                                                                                                                                                             

### Smallville dışında Genreatif Ajanlar

2024-2026 yılları için sonraki yayınlar bu yapı genişletiyor:

- **用于政策 / 市场研究的 multi-agent 社会模拟。**Smallville 群体模拟用户对功能的行为响应──A/B testlerinden daha hızlı; doğruluk hâlâ tartışmasızdır──
- **游戏中的 NPC AI。**Smallville ajanı ile birlikte bir oyun oynamak için bir hikaye oyunu oluşturmak yerine bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir oyun oynamak için bir görev.
- **Generative-agent 评估基准。**Görevi, görev doğruluğu oranı değil, uzun süreli çalışmada güvenilirlik ve davranış tutarlılığıdır.

Bu yapı referans standartlarıdır. Bu yapı hafıza vektörlerini depolamak için kullanılır.

### Bu neden çoklu ajan mühendisliği için çok önemli ?

Smallville, kavramı kanıtlıyor: bir çok ajanın ortaya çıkması çok uygun olabilir. Bu yapı artık açık kaynaklı modellerde mevcuttur.**emergent social behavior**Bu biçimi kullanırız.**tight task execution**系统都会使用本阶段 前面介绍的監督 / rolls / primitives 模式──


```figure
a5-memory-reflection
```

## Yapın onu.

`code/main.py`Python ve yazı yazma ajan politikalarını kullanmak için üç bileşeni gerçekleştirmek için:

- `MemoryStream` 带 更新/重要性/relevance geri alımının sadece ekleri 日志。
- `reflect(stream)` Son zamanlarda yüksek önemli hafızaların yazılı düşüncesine
- `plan(agent_state)`   Gün ve saat planı gün ve saat planı üzerinde.
- Scenario 5: 个代理――Agent 1 以抛派对 at 17:00开始──在模拟 tick 中,邀请传播,agent 聚集──

运行:

```
python3 code/main.py
```

预期输出: Tick trace ︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-

## Kullan

`outputs/skill-simulation-designer.md`设计一个生成-agent:agent 数量、memory schema、reflection cadence、plan ufukları 和评估 metrik¬leri

## Yayınla

生产模拟规则:

- **Memory 就是数据库。**Bu, bir önceki modelin en iyi bir şekilde kullanıldığı bir sistemdir.
- **记录 retrieval trace。**Her eylem için, kayıtlar onun en üst düzey anıları için çalışır.
- **为每个 agent 预算 tokens。**Her bir tick 中 Her bir ajanın geri alınması + yansıması + planı O(k) LLM çağrıları;;
- **周期性 compact memory。**Özetle- ve kesim 低重要性 条目。Estelik tasarruf politikası ayrıntı değil, tasarım kararıdır。
- **显式检测空间 / 社会规范违规。**Bu yapı onları öğrenmeyecek.

## 练习

1. 运行  İşlem`code/main.py`❖ 3+ ajanı onaylamak                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
2. 移除反思步骤──行为会是什么样子? 映射到Park 2023 中的放弃发现──
3. Klaus akşam 5'de bir araştırma konuşması yapmak istiyor )─Agent 会分流, ayrıca bir hedef toplantısı da var.
4. 添加空间约束:Hobbs Cafe 最多容纳 4 ajanı...
5. Park et al. (arXiv:2304.03442) Bölüm 6 (Önemli davranış deneyleri) ◊ Find out a your micro type version cannot be replicated behavior──.

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Memory stream | “agent 的日记” | 观察、动作、reflection、plan 的 append-only 日志。 |
| Recency | “这条 memory 有多新” | 按年龄计算的指数衰减分数。 |
| Importance | “agent 有多在意” | 写入时自评 1-10。已缓存。 |
| Relevance | “与当前查询有多相关” | 余弦相似度（Embedding-based）。 |
| Reflection | “更高阶信念” | 从最近 memories 生成的综合，并作为新 memory 重新摄入。 |
| Plan | “日/小时/动作分解” | 自顶向下的 plan tree。当 observation 矛盾时可修订。 |
| Smallville | “Park 2023 的 sandbox” | 产生 Valentine's Day 涌现的 25-agent 模拟。 |
| Believability | “质量指标” | 人类评分者对行为是否像一个可信 agent 的评分。 |

## 延伸阅读

- [Park et al. — Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) 参考架构
- [UIST '23 paper page](https://dl.acm.org/doi/10.1145/3586183.3606763) 发表场所
- [Smallville code release](https://github.com/joonspk-research/generative_agents)Python  参考 Python 实现
- [Hayes-Roth 1985 — A Blackboard Architecture for Control](https://www.sciencedirect.com/science/article/abs/pii/0004370285900639) 结构化記憶代理的前序工作
