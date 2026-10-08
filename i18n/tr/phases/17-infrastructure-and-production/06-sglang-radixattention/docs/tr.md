# 面向 Prefix-Heavy Workloads 的 SGLang 与 RadixAttention

> SGLang'ın önbelleği bilgili programcısı ise daha uzun paylaşımlı önleme ile öncelikli işlem yapacaktır. Aslında, derinlikten ilk kök geçiş, sıcak dalları HBM'de kalmaya devam etmektedir. Llama 3.1 8B'de GPT benzeri 1K istekleri ile birlikte GPU paylaşılan bir sahada, SGLang yaklaşık 16.200 tok/s'ye ulaştı, ve vLLM yaklaşık 12.500'e ulaştı. Bu avantaj, %29'a ulaştı. Bu avantaj, ağır prefix RAG iş yüklerinde, 6.4x'e ulaştı.

**Type:** Learn
**Languages:** Python (stdlib, toy radix-tree cache + cache-aware scheduler)
**前置要求：**17 · 04 aşaması (vLLM Serving Internals), 14 aşaması (Agentic RAG)
**Time:** ~75 minutes

## Öğrenme hedefi
- 画出 RadixAtention:prefixes 如何存储在radix树中,以及 KV blokları 如何在根根于同一分支的序列中共享──
- Cache-Aware programlamasını açıklayın, ve neden FCFS, ağır trafikli prefixlere uygun değil.
- 给定 prefix-cache hit rate 和 prompt length distribution,计算某个工作负荷的预期速度――
- Bu rakamın gerçek olduğunu göstermek için 6.4x'in ortaya çıkmasını sağlamak için değil, kazanç eksikliği için hızlı bir şekilde sipariş etmek için.

## 问题
经典服务 会将每个请求的提示 当作模糊──即使 5,000 个RAG 请求都用同一个2000-Token系统提示加同一个检索序言 开头,vLLM 也会对这个2000-Token prefix 预填5000次──GPU 一次又一次地做同一个工作──

观察结论是:agentic 和 RAG workloads 中的提示 几乎总是共享长久的预写――System prompt、工具 schemas、 few-shot examples、检索头条、对话史,全都会在请求之间重复── Eğer bu özenin KV önbelleğini 存存一次并复用它,就不需要再填充──

RadixAttention aynen böyle yapılıyor. Tokenler radix ağacına indeksi edilmektedir. Her düğüm kökten bu düğüm yoluna kadar olan Token dizisine göre KV bloklarına sahiptir. Yeni talep bu ağaç boyunca geçer: herhangi bir Token 匹配 node bu düğümün KV bloklarını tekrar kullanır.

挑战在安排中. Eğer iki istek 2000-Token prefix paylaşırsa, üçüncü istek ise aynı prefix içindeki 200 Token'i paylaşırsa, iki uzun paylaşım istekini birlikte hizmette bırakmak isteyeceksin.

## 概念
### 作为 KV indeksi 的 radix tree

radix ağaç(kompakt üçleme) depolama Token dizileri。 her düğüm 拥有一个 Token range,以及为该范围 计算出的 KV 块──儿童 会把序列 扩展一个或多个 Token──

```
root
 |- "You are a helpful assistant..."  (2,000 tokens, 124 KV blocks)
      |- "Context: <doc A>..."        (500 tokens, 31 blocks)
           |- "Question: Alice..."    (80 tokens, 5 blocks)
           |- "Question: Bob..."      (95 tokens, 6 blocks)
      |- "Context: <doc B>..."        (520 tokens, 33 blocks)
```

Bir yeni istek ile sistem sorgulaması + "Kontext: <doc A>" + "Question: Carol" 进来──调度器遍历:system prefix 匹配(复用124 bloklar),doc-A şubesi 匹配(复用31 blok), sonra sadece "Question: Carol" için yeni bloklar dağıtıldı(4 bloklar)──Önümü doldurma maliyeti:4 bloklar Yeni Token──没有这个树:160 bloklar──prefill 省省约 ~40x──

### Kaynaklı programlama

Eğer cache sürekli çürürse, radix ağacına dayalı tekrar kullanımı anlamsızdır.

1. **Depth-first dispatch**◊ Seyreden seçin bir sonraki talebi, öncelikli seçim mevcut çalıştırma seti ile aynı dalın talebinde kökleşir.
2. **Branch level 的 LRU，而不是 block level 的 LRU**◊ tüm dalları (→ en kısa yapraklardan 开始) çıkarmak, ayrı bloklar yerine, bu şekilde saklama şekli 才与基体形匹配──

FCFS, bu iki noktayı ihlal etti. 2000 Token'in isteğini paylaştı. 50 Token'in isteğini paylaştı. Sonra 2000 Token dalı, 50 Token'in isteğini kabul etmek için kovuldu.

### Hatırlamalı olduğunuz bir referans rakamı.

- Llama 3.1 8B、H100、ShareGPT 1K istekleri:SGLang ~16,200 tok/s, vLLM ~12,500(約 29% 优势)
- Önbellek ağır RAG( Aynı sistem + Aynı belge, değişim sorusu):SGLang 上最高可达 6.4x。
- Ses klonlama iş yükleri: %86.4 önbellek-cache vurma oranı
- SGLang müşterilerinin üretim oranları: 50 ila 99%'a bağlıdır.
- 2026 yılında 400.000+ GPU'da dağıtıldı.

### sipariş 陷

6.4x Bu rakam, uyumlu bir istek şablon siparişine bağlıdır. Eğer müşteriniz belirli bir istek içinde istekleri oluşturursa`[system, tools, context, history, question]`, diğer istekler arasında oluşturulmuştur .`[system, context, tools, history, question]`, ağaçlarda paylaşımlı bir öncü bulunmuyor. İnsanlarda paylaşımlı bir öncü gibi görünen bir şey var.

工程师的杆:你的提示模板就是缓存键──固定顺序──把所有不可变的内容(系统、工具、方案) 面面──然后放回复文──最后放用户问题──不要把动态内容 交错插入前──

Araştırma Aracında Gerçek Örnek: Dinamik içeriği cacheable prefix'ten taşı, bir kez deployment cache hit oranı  bir kez değiştirme ile % 7 提升到 74% 

### RadixAttention 赢在哪里,输在哪里

Kazanç:
- RAG( aynı alıntı önbellek, değişim sorusu)
- Ajanlar (semalar aynı araçlar, değişim sorgu)
- 带长系统提示的聊天──
- 具有重复 preambles  Ses / görme iş yükleri

VLLM seviyesindeki geçiş kaybı:)
- Uygulamaz çağrılar kullanın.
- Her istek, benzersiz içeriği 交错插入 prefix'in dinamik isteklerini oluşturur.

### Neden bu sadece çekirdeğin değil, programlayıcıın sorunu?

KV'yi yeniden kullanmak için bir çekirdek hilesi yapabilirsiniz. SGLang'ın fikri budur ki, sadece düzenleyici sıcak dalı tuturken, yeniden kullanmak için bir fayda vardır.

### VLLM ile etkileşim

Bu iki sistem de ciddi bir rekabet ilişkisi değil.`--enable-prefix-caching`) ve cache-açık yönlendiricisi) ;; Rust 实现的 vLLM Router) ;;差距缩小了,但没有完全消失,SGLang'ın tüm yığını radix-first;vLLM 是后接上去的──对于由前音重复使用 主导的工作负荷,SGLang 仍然是默认选择──对于没有强前音模式的一般用途服务,vLLM 仍然相当或更好──


```figure
roofline
```

## Kullan
`code/main.py` bir oyuncak radix-tree KV cache, ve bir de iki stratejiye sahip bir programcı gerçekleştirmek:FCFS ve cache-aware.

## - Söyle.
本课会生成 `outputs/skill-radix-scheduler-advisor.md` Verilmiş bir iş yükü açıklaması ((SGlang'ın gitme/hiç gitme 判断inin kullanılması ve kullanılması)

## 练习
1. 运行  İşlem`code/main.py`◊ Aynı iş yükünde ◊ FCFS ile karşılaştırın.
2. 修改 workload,让提示 随机排列 `[system, tools, context]`- Ne olacak? - Neden?
3. 計算在 Llama 3.1 8B 上,作为一条 radix branche 保持一个2000-Token 系统提示居民的HBM成本──与无序文重用的16序列批成本做比较──
4. SGLang Radix dikkat kağıdı。用三句话解释为什么在前सर्ग ağır yük 下,树形 LRU 优于块形 LRU。
5. 某客户报告缓存撞击率 只有8%──说出三个可能原因,以及你会为每一个原因运行的诊断──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| RadixAttention | "SGLang 那个东西" | KV cache 以 radix tree 索引，使 shared prefixes 能复用 blocks |
| Radix tree | "compact trie" | 每个 node 拥有一个 Token range 及其 KV blocks 的 tree |
| Cache-aware scheduler | "hot-branch-first" | 优先处理共享 resident branch 的请求的调度器 |
| Prefix-cache hit rate | "你的 prompt 有多少是免费的" | 从复用 KV blocks 服务的 prompt Tokens 比例 |
| FCFS | "first-come first-served" | 会破坏 prefix locality 的默认 scheduling |
| Branch-level LRU | "驱逐 leaf" | 与 radix shape 匹配的 eviction policy |
| Prompt template ordering | "cache key" | prompt 的 component order 决定 tree 能共享什么 |
| System prompt pinning | "resident prefix" | 保持 immutable system portion pinned，以避免 eviction thrash |

## 延伸阅读
- [SGLang GitHub](https://github.com/sgl-project/sglang) kaynak 和 doks。
- [SGLang documentation](https://sgl-project.github.io/) RadixAttention 和 scheduling 细节──
- [SGLang paper — 高效编程 Large Language Models (arXiv:2312.07104)](https://arxiv.org/abs/2312.07104) デザイン参照──
- [LMSYS blog — SGLang with RadixAttention](https://www.lmsys.org/blog/2024-01-17-sglang/) referans sayı ve planlayıcı mantığı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [vLLM — Prefix Caching](https://docs.vllm.ai/en/latest/features/prefix_caching.html) vLLM  kendi kök benzeri 实现,用于比较。
