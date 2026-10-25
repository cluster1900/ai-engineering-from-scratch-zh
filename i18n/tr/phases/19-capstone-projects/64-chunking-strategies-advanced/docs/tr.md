# Bölüm Kuralları

> Bölüm kontrol cihazının ne göreceğini belirler. Sınır bir kez hatalı olduğunda, model yerleştirilmez.

**Type:** Build
**Languages:** Python
**Prerequisites:** 第 11 阶段课程 04（嵌入）、06（RAG）、07（高级 RAG）；第 19 阶段 B 轨基础（第 20-29 课）
**Time:** ~90 分钟

## Öğrenme hedefi
- Baştan başta beş farklı blok stratejisi uygulanmaya başladı: sabit pencereler, cümleler, dönüşümlü bölünmeler, dil anlamı birleştirme ve yapısal işaretleme başlığı.
- Bu nedenle, bir stratejiyi, bir diğerini, bir başka stratejiyi, bir başka bir stratejiyi, bir başka bir stratejiyi, bir başka bir stratejiyi, bir başka bir stratejiyi, bir başka bir stratejiyi, bir başka bir stratejiyi, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir strateji olarak, bir başka bir diğer strateji olarak, bir başka bir diğer strateji olarak, bir başka bir diğer bir strateji olarak, bir başka bir diğer bir şekilde, bir başka bir başka bir şekilde, bir başka bir başka bir şekilde, bir başka bir şekilde, bir başka bir şekilde, bir başka bir şekilde, bir şekilde, bir şekilde, bir başka bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir şekilde, bir
- 读取块长度分布并识别每个策略注入的故障模式:孤立句子、中间符号剪切、仅标题块、语义漂移──
- Yeni dil kütüphanesi için üç özellik kontrol ederek öntanımlı değer seçilirken, temel testi yapılması gerekmez: dosya türü, ortalama bölüm uzunluğu ve biçimin açık bir yapısı olup olmadığını.

## 问题

Her RAG borusu önce kaynak dosyasını parça parça olarak ayırır: parça küçük olması için modelle yerleştirilebilir, ayrıca bağımsız bir fikir taşıyacak kadar büyük olması için yeterli olacaktır.

 Sadece bir kısım değerini durdurduğunda, sorgular  Bütçe durdurduğunda  Değer nedir  Sorgular  Nasıl  Sorgular  Başarılı olacaktır.  Eğer sabit pencerede kesiciler  Değerini çevresinden aşağıdaki içeriklerden çıkarırsa, yerleşim başka bir kısım , BM25  bölücükleri düşer, yeniden düzenleme cihazı gürültü görür, LLM  Oluşturma yanıtları da yanılır.  2024 makalesi  LongRAG: Long-context LLM  Testleri ile Yüklendirilmiş Geri Alım Genresini Geliştirmek, sadece kısımlama seçimi % 35'lik bir geri çağırma getirir  mutlak değişim  2025 yılın bağlamlı bölüm başlıkları hakkında devamlı çalışmaları bu farkı azaltır, ancak ortadan kaldırmaz.

Bu ders, beş strateji oluşturur, onları altın etiketli cevap aralığı ile birlikte sabit bir dil kütlesine sürükler ve size kendinizi okuyarak hatırlama sayılarını sağlar.

## 概念

```mermaid
flowchart LR
  Doc[Source Document] --> S1[Fixed Window]
  Doc --> S2[Sentence]
  Doc --> S3[Recursive Split]
  Doc --> S4[Semantic Cluster]
  Doc --> S5[Structural Markdown]
  S1 --> Chunks1[Chunks]
  S2 --> Chunks2[Chunks]
  S3 --> Chunks3[Chunks]
  S4 --> Chunks4[Chunks]
  S5 --> Chunks5[Chunks]
  Chunks1 --> Index[Embedding Index]
  Chunks2 --> Index
  Chunks3 --> Index
  Chunks4 --> Index
  Chunks5 --> Index
  Index --> Eval[Recall@k vs Gold Spans]
```

### Fixed window

蛮力基线── her N 个字符被剪切一次──可选地重叠,以便在位置 N 处剪切的句子完整地出现从位置 N 开始的块内 - 重叠──快速──确定性、边界糟糕──将其作为控制件而不是默认值──

### Sıcaklık

Bir veya daha fazla cümleyi bir blokta paketlemek, hedef karakter bütçesine ulaşana kadar, kelimelerin ortasında kesim yapmayı durdurmak.

### 递归分割

2023 yılının kütüphane baskısındaki aşama yapı stratejisi. İlk önce en güçlü bölümü ayırmaya çalışmak, sonra bir sonraki bölüme geri dönmek, sonra cümleye bölmek, sonra bir karaktere bölmek.

### 语义聚类

嵌入每句──将共享主题质心的连续句集类──每当与质心的运行相似度下降到值以下时就进行切割──边界反映的是含义,而不是字符──构建速度较慢,而依赖于嵌入模型,但对于段内切换主题的文档具有弹性──

### struktur化 Markdown 标题

                                                                                                                                                                                                                                                              

### hatırlat@k 如何衡量边界选择

黄金令牌 sorusu, kaynak dosyaları içindeki cevap aralığındaki kesin karakter çevriliş miktarını taşır. Bölümlerden sonra, sorarsınız: Araştırmacı'nın geri döndüğü ön k 个块 altın aralığıyla yüklü müdür? Eğer öyleyse, sorgu sorgularının recall@k 为1♦ Eğer öyle değilse, tüm sorgu kitlesinin ortalama değeri 0.♦ her bir strateji için aynı değerlendirme yapılırsa, dağıtım size sahip olduğunuz dil kütlesinde hangi sınır stratejisi hayatta kalmış olduğunu gösterecektir.


```figure
ci-chunk-boundaries
```

## Yapın onu.

`code/main.py`实现:

- `fixed_window(text, size, overlap)`- Kızılayı.
- `sentence_chunks(text, target)`- 简单句子打包器──
- `recursive_split(text, separators, target)`- Çekilme.
- `semantic_chunks(text, similarity_threshold)`- Kalsiyeleri temel alan bir sınıflandırma, belirsizlik simülasyonu üzerine yerleştirilmiştir.
- `structural_markdown(text)`- 标头感知分离器──
- `mock_embed(text, dim)`- Hash'in yerleştirmesine dayanır, bu yüzden çevrimiçi olarak çalışılabilir.
- `DenseIndex`- 19. aşama B'nin karıştırılmış kontrol dersinde kullanılan biçim ile aynı.
- `eval_recall(strategy, corpus, queries, k)`- Çember ile karşılaştır.
- `main()`, 语料库上运行每个策略并印回忆@k 表。

- Yapma .

```bash
python3 code/main.py
```

输出是一个小表,每个策略一行,每个 k 一列──句子策略在结构化 fixture上失败──结构化Markdown 在 Markdown fixture上胜──递归策略在混合 fixture上有一席,因为递归会自适应──语义聚类在没有有用结构线索的散文 fixture上胜──

## Özetle:

**孤立句子。**句打包会产生错过主题句的块──然后嵌入指向错误的──

**中间符号剪切。**Kod veya YAML'de sabit pencereler, iki yarıya ayrılır.

**仅包含标题的 chunk。** Struktural Markdown  Sadece içerir`## Title`Bu kısımların bir kısmını, ya da bir kısmını ekle.

**语义漂移。**Konuyu bir araya getirirken, ifade topluluğu zayıflar. 5000 karakterden oluşan bir blok, birçok spesifik cevapları dağılıp yerleştirilmiş bir içine bağlar.

**过时的嵌入。**语义聚类使用嵌入模型──如果改模型,你也会改块──将块模型与检索模型分开固定,或一起重建索引──

## 选择默认值而不运行基准测试 (BİZİN)

Üç özellik yeni dil kütüphanesi'nin öntanımlı bölme makinelerini belirler.

|属性 |值|默认|
|----------|-------|---------|
|文件类型|没有结构的散文 |递归分割，目标 800 |
|文件类型| Markdown / RFC / API 文档 |结构化 Markdown |
|文件类型|代码| AST 感知（超出范围；请参阅第 19 阶段第 02 课）|
|段落长度|长而单一的主题 |句子，目标500 |
|段落长度|简短、混合的主题 |语义，阈值 0.6 |

Eğer bir soru varsa, lütfen geri dönüşü seçin.

## Kullan

生产模式:

- Yeni bir boru yayınlamadan önce çalışma değerlendirmesi; kütüphanenin onayladığı stratejiye güvenmeyin.
- Her zaman bir yerleşim modeli veya dil kütle birimi oluşturduğunuzda, yeniden çalıştırma değerlendirmesi yapın; kazanan dil kütlesine bağlıdır.
- Bu strateji adı her blokun birinde saklanarak daha sonra geri dönüşe dönüşebilirsiniz.

## Gönderi

Bölüm 69  Dersindeki Track F 端到端 RAG 系统 bu bölümde seçilen bölgecicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicicici`eval_recall`返回的相同形中读取recall@k。 seçin kendi dil kütlesinde kazanma stratejisi ve ileriye doğru ilerlemeyi。

## 练习

1. 添加第六种策略: kullanmak`tiktoken`Bu, simge sayımının simge penceresi değil.
2. %30'u bir kod bloğunun içine sokulması, bu tabloyu yeniden çalıştırması ve yeniden çalıştırılması.
3. Bu, bir proje gerçek tedarikçisi tarafından belirlenmiş belirlenme yerleştirme yerine değiştirilmektedir.
4. Her bir parça için bir ekle`summary`字段: 一句质心描述── 再运行 eval,并将摘要附加到块主体──测量召回提升──

## 关键术语

|术语 |人们怎么说|它实际上意味着什么 |
|------|-----------------|------------------------|
|recall@k | “我们拿到正确 chunk 了吗？” |任何前 k 个 chunk 与 gold answer span 重叠的查询比例 |
|块重叠| “滑动窗口”|将前一个块的最后 N 个字符重新包含在下一个块中 |
|结构分割器| “标题感知块” |在 H1/H2/H3 边界处切分；标题文本也是 chunk 的一部分 |
|语义分块器 | “主题感知块” |嵌入句子、按质心相似度聚类、漂移剪切 |
|质心漂移| 「话题转移」|运行平均值与下一个句子之间的余弦相似度下降超过阈值 |

## 进一步阅读

- [LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs (arXiv 2406.15319)](https://arxiv.org/abs/2406.15319)
- [人择、上下文检索](https://www.anthropic.com/news/contextual-retrieval)
- [LlamaIndex，生产组块策略 RAG](https://docs.llamaindex.ai/en/stable/optimizing/production_rag/)
- 第 11 阶段 第 06 课 - RAG 基础知识
- 第11 阶段 第 07 课 - Yüksek sınıf RAG
- 19 . aşama 65 . Ders - Bu bölgede üretilen bloklar için sınıflandırma karışık incelemesi
- 19. aşama 68 . Sınıf - Üretimdeki strateji seçiminin değerlendirilmesi için değerlendirme aracı
