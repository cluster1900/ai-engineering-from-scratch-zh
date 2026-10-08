# Hibrit bellek: vektör + grafik + KV (Mem0)

> Mem0 (Chhikara et al., 2025) anı üç paralel depo olarak görünecek: vektör, ifade benzerliği için, KV, hızlı gerçek arama için, graf, fiziksel ilişki düşüncesi için.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## Öğrenme hedefi
- 解释为什么单一存储(仅 Vector、仅 Graph、仅 KV) 记忆代理支不足──
- Memorandum'un üç ortak depolama ve her depoyu optimize etme hedefi belirlenmiştir.
- Mem0'un birleşimi değerlendirmesi: ilişki, önem, yakın dönem, ve neden katılımcı ve katılımcı olduğunu açıklamak için bir katılımcı olarak kullanılır.
- Bir oyuncak seviyesinde üç depolama anı gerçekleştirmek için kullanın.`add()`写入全部三个储存,`search()`融合 sonuçları

## 问题
Üç sorunun bir sınıfı için, tek bir depolamalama genel olarak hatalı olarak:

- **语义相似性**                                                                                                                                                                                                                                                              
- **事实查找**   user's telephone number is what? KV 胜出; Vektor 浪费资源,Graph 过于复杂──
- **关系推理**   hangi müşteri ortaklıkları aynı faturalı kuruluşta? Graf 胜出; Vector 和 KV 无法回答──

Üretim ortamındaki ajanlar aynı oturumda tüm üç sorgu sorusunu gönderir.`add`- Ne ?`search`表面後,并用评分函数融合它们──

## 概念
### Üç tane depolama

Mem0 (arXiv:2504.19413, Nisan 2025) Location`add(text, user_id, metadata)`时:

1. Özetle: Özetleme ve eğitim programı
2. Bu, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir deyişle, bir de, bir deyişle, bir de,
3. KV mağazasına, (user_id, fact_type, entity) olarak anahtar olarak yazmayı, O(1) 查找──
4. Her olayı tiplenmiş kenarlar olarak yazmak 写入 Graph store (Mem0g), ilişki sorguları için kullanılır.

- Evet .`search(query, user_id)`时:

1. Vektör depolama 按 Embedding cosine 返回 top-k。
2. KV store 返回基于查询派生的 (user_id, type, entity) anahtarının doğrudan命中──
3. Graf depoları  geri dönüş sorgulamalı varlıktan altgraf'a kadar
4. Bir değerlendirme aşaması birleşmiş üç kişi.

### Füzyon puanlaması

```
score = w_relevance * relevance(q, record)
      + w_importance * importance(record)
      + w_recency * recency(record)
```

- **相关性** Vektör cosine KV 精确匹配 图路重量──
- **重要性** 在写入时打标签或学习得到(某些事事更重要:姓名、ID、政策)
- **近期性**                                                                                                                                                                                                                                                              

权重按产品调优──聊天代理 使用更高的 `w_recency`Konformatif ajanlar`w_importance`;检索代理 使用更高的 `w_relevance`- Evet.

### Memorandum ve zamanlı akıl yürütme

Mem0g                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

Bu Letta'nın geçersizli kılmak örneği ve yaygınlaşmış bir kural sınıfı davranışıdır.

### Benchmark numaraları

Memorandum makalesi 報告了以下結果(2025):

- **LoCoMo**(长篇对话记忆): 91.6
- **LongMemEval**(长时间跨度 bölüm hafızası): 93.4
- **BEAM 1M**(1M-token 记忆 referans değerinde): 64.1

Baseline karşılaştırıldığında, tam bağlamlı 128k LLM, düz vektör mağazası, düz KV) hepsi 10+ %'ye kadar geriye kaldı. Sadece referans değerine dayanarak, doğru seçimi kanıtlayamadı, işletim biçimi sadece önemli, ancak bu rakamlı göstergeler birleşim tasarımında hatalar yok.

### Etkinlik taksonomisi

Mem0 ıpı 划分记忆:

- **用户记忆**Sessiyonlar arasında devamlılık,`user_id`Anahtar.
- **Session 记忆**Bir iplik içinde kalıcılık.
- **Agent 记忆** Her ajan durumunun durumu

Her yazışımda bir alanı seçeceğim. Araştırma her alanın ağırlığını kullanabilirim.

### Bu yol kolayca yanlış bir yerde

- **Embedding drift.**Vector  sonuçları ön yüz sorguda doğru görünüyor, ancak korpus ile  büyüme ve geri dönüşecektir.
- **KV schema creep.** `(user_id, type, entity)`Her takım kendi takımına katılıncaya kadar basit görünüyor.`type`◊ Her dönem denetim tipi 集合。
- **Graph explosion.**Bir gürültü çıkarıcı her mesajı 50 kenar ekle...`add`调用图 写入数;丢弃低置信度 edges──


```figure
ae-memory-fusion
```

## Yapın onu.
`code/main.py`Üç depolama modunu gerçekleştirmek için kullanın:

- `VectorStore`                                                                                                                                                                                                                                                              
- `KVStore` 以 `(user_id, fact_type, entity)`Kısayolun bir diğeri.
- `GraphStore` tiplenmiş kenarlar(subject, relation, object, valid)
- `Mem0` 顶层面,包含 `add()`- Evet.`search()`、Fusion puanlaması 和 kapsam farkındalıklı geri alım
- Bir çok kullanıcı, çok seans konuşmanın tam izini takip etmek için.

运行:

```
python3 code/main.py
```

输出会显示三条独立回忆路,以及融合后的上-k――修改 `main()`顶部的分数重量, 排名 nasıl değiştiğini gözlemle

## Kullan
- **Mem0 (Apache 2.0)** 生产就绪──可用 Postgres + Qdrant + Neo4j 自托管,也可使用管理云──
- **Letta** Üç katlı çekirdek/kızdırma/arşiv;自带 Vector 和 Graph backends。
- **Zep** 商业替代方案,带时代KG 和 事实抽取──
- **Custom builds** Eğer bir ekstraktör veya birleştirme ağırlıklarına ihtiyaç duyarsanız (doğru kontrol yapmanız gerekir)

## - Söyle.
`outputs/skill-hybrid-memory.md`Bir üç depo bellek takvimini oluşturacağım, bunlardan birinde füzyon skorları, kapsam taksonomisi ve zamansal geçersizliği vardır.

## 练习
1. Bu, bir diğer diğer devirde de kullanılabilecek bir yöntemdir.
2. 添加时间查询:`search(query, as_of=timestamp)`◊ Sadece bu süre içinde veya daha önce geçerli olan kayıtlara geri dönmek. Hangi depo en çok değiştirilmelidir?
3. 实现冲突检测器: If传入事实与图边 矛盾,invalidate 旧边,并同时记录两者──在 user lives in Berlin -> user lives in Lisbon 上测试──
4. 扩展 füzyon skorları,加入 `user_feedback`维度(对检索记录点赞) ――你怎么防止游戏(代理只返回它已经喜欢过的记录)?
5. Mem0 dokusu (`docs.mem0.ai`Oyuncakları gerçekleştirmek için taşınmak`mem0`Müşteri aramaları: 20 test sorusu üzerinde

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Hybrid memory | “Vector plus graph plus KV” | 三个并行写入的存储，在检索时融合 |
| Fact extraction | “Memory ingestion” | 将文本拆解为 (entity, relation, fact) tuples 的 LLM 步骤 |
| Fusion scoring | “Relevance ranking” | 相关性、重要性、近期性的加权和 |
| Scope | “Memory namespace” | user / session / agent，决定谁能看到什么 |
| Mem0g | “Memory graph” | 带时间有效性的 typed edges，用于关系查询 |
| Temporal invalidation | “Soft delete” | 将矛盾 edges 标记为 invalid；绝不删除 |
| Embedding drift | “Retrieval rot” | Vector 质量随 corpus 增长而下降；周期性 re-embed |

## 延伸阅读
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) Kâğıt
- [Mem0 docs](https://docs.mem0.ai/platform/overview) 生产 API  SDK 管理 cloud
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) sanal bağlam 前身
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Üç katlı kardeş tasarım
