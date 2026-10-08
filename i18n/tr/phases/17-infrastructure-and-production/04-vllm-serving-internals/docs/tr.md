# vLLM Servis İçeri:PagedAtention、Continuous Batching、Cunked Prefill

> vLLM'nin 2026'da egemenliği, tek tek bir teknik yerine üç birbirine aşan öntanımlı ayarlara bağlıdır. PayedAttention 始终开启──Continuous batching 会在解码突变之间将新请求注入活批──Chunked prefill 会切分长提示,让解码令牌永远不会饿──把这三者全部打开后,单张H100 SXM5 上的Llama 3.3 70B FP8 在 128 并发下可达到2,200-2,400 tok/s,比 vLLM 自身默认值高约25%,约为朴素 PyTorch 的 3-4倍──本课会深入入到你能画图说明表和并关注内核层级,以`code/main.py`İçinde bir oyuncak sürekli batcher  sona erdi, vLLM gibi olacak

**Type:** Learn
**Languages:** Python (stdlib, toy continuous batching scheduler)
**前置要求：**17 · 01 aşaması (Model Serving), 11 aşaması (LLM Mühendisliği)
**Time:** ~75 minutes

## Öğrenme hedefi
- KV kasesi tahsiscisi:bloks, blok tabloları ve neden üretim yükünün altında parçacıklık %4'te kalması açıklanıyor.
- Sürekli serileme çizimleri: tamamlanmış diziler nasıl bir seriyi terk eder, yeni diziler nasıl eklenir, boşaltılması gerekmez.
- Bir cümle kullanarak parçalanmış prefill'i tanımlayın,并表示它保护的是哪个延迟度度度 (TTFT) 
- 2026 yılında vLLM v0.18.0'un, tüm optimizasyon takımlarının bir kez etkinleştirilmesine etkisi olacak.

## 问题
朴素 PyTorch servis döngüsü bir kez bir istek çalıştır:tokenize、prefill、decode 〜 EOS、返回── bir kullanıcı zaman bu iş yapabilir。 yüzlerce kullanıcı zaman, bu sabırla bekleyen bir takım kişidir。 açıkça görülen onarım yolu statik partiyalanma, ama penceredeki her istekyi en uzun sürede doldurur, her dekodelemeyi en uzun sürede çıkışa koyur, ve tüm partiyi en yavaş dizisi nedeniyle durdurur.

vLLM 同时解决三个问题──PagedAttention 阻止KV缓存 碎片化像经典连续分配那样吃掉60-80%的GPU belleğini──Continuous batching 允许 requests in every decode iteration 之间加入和离开批,因此批 始终充满真实工作──Chunked prefill 32 将k-token prompt 拆成约512-token 的切片,并与解码交错执行,因此长 prompt 不会结 GPU 上的每个解码代码代码符──

2026 yılında üretim standartı üçtürü açılmıştır. Her bir mekanizmanın rolünü anlamalısınız, çünkü başarısızlık modeli, model üzerinde değil, programda bulunmaktadır.

## 概念
### PagedAttention  olarak virtual内存 sistemi

KV önbelleği her sekvense için`num_layers × 2 × num_heads × head_dim × seq_len × bytes_per_element`❖ 8192 token için Llama 3.3 70B, BF16'da aşağıdaki her dizi için yaklaşık 1.25 GB. Eğer her talep için 预留 8192 槽, ancak ortalama talep sadece 1500 token kullanırsanız, o zaman siz öncelik verilmiş HBM'lerin %82'ini harcayacaksınız.

PagedAttention 借借鉴了 OS sanal belleğinin düşüncesi。KV cache sıraya göre değildir 连续存放的。 sabit büyüklükteki bloklara göre ayrılmıştır(默认16 token)。 her sırada bir blok tablosu vardır, mantıklı token konumlarını 映射到物理块 IDs。 bir sırada 分配过的块 时,会再添加一个块。 sona erince, blokları 会返回池。

碎片化 from 60-80% (Klasik yöntem) aşağıya düşer 4% ( aşağıda yer almaktadır)`--gpu-memory-utilization`(默认 0.9), yükleme ağırlıkları ve aktivasyonları 后, KV blokları 预留多少HBM 〜

### İterasyon 层面的 Sürekli serileme

旧式 dynamic batching 会等一个窗口(例如10 ms) 来填充批,然后运行预填 +解码 +解码 +解码,直到每个序列 完成──快序列 会提前离开并置,而GPU 继续处理缓慢序列──

Sürekli serileme, her dekodlama aşamasında 之间运行──把正在运行的序列 集合称为 `RUNNING`listı──在每次回复中:

1. `RUNNING`EOS veya max_tokens'in herhangi bir dizisini elde edince kaldırılır.
2. programcı 查看等队──如果有空 KV 块,它会接纳新的序列(prefill或重复)──
3. Önceden geçin 在当前 `RUNNING`İçerikler üzerinde çalışmak, her dizi için yeni bir token göndermek.

Satır boyutu  asla sabit bir rakamda doldurulacak değil                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               `V1 scheduler`❖ Key invariant:scheduler ⇒ her dekode tekrarlaması ⇒ her istek yerine ⇒ bir kez ⇒

### Parçalama prefill  protecting TTFT tail

Prefill is computation-bound of──Llama 3.3 70B 上的 32k-token prompt 在单张 H100 上需要约800 ms的纯预填──prefill 运行时,batch 中所有其他序列的解码代码代码代码都在等待──在服务循环中,长长提示的第一代码延迟(TTFT) birkaç diğer kullanıcıların 互代码延迟(ITL) 动──

Çüklü ön doldurma , sabit büyüklükteki parçalara ayrılır , bölük olarak düzenlenir. Çükler arasında, programlayıcı, önüne bir token'a dekode dizilimlerini bırakabilir.

### Üç defalarca ayarlanmış bir etkileşim

Bu üç işlev birbirinin varlığını varsaymaktadır.PagedAttention olarak programcı, ölçüm için küçük bir KV kaynağı sağladı.`RUNNING`Listede yapılan kararlar, bağımsız sistem değil, başka bir programcı politikasıdır.

KV-bloke bütçesi altında 约束下 约束下 约束下 约束下 约束下 约束下 约束下 约束下 约束下 约束下 约束下

### 2026 yıl v0.18.0'un gotcha

VLLM v0.18.0'da, siz olamazsınız.`--enable-chunked-prefill`Önemli bir tasarım modeli ile spekülatif çözme`--speculative-model`) 结合使用──文档说明的例外是V1 调度器中的N-gram GPU 投机式解码──那些不读释笔记就打开所有旗的团队,将在启动时遇到运行时间错误,而不是软性回归──如果你的投机式 收益值启动碎片预填,那就重新审视选择:2026 yılının doğru cevabı genellikle EAGLE-3 且不使用碎片预填,而不是草案模型加上无法编译的碎片预填──

### Hatırlamalı olduğun bir sayı var.

- Llama 3.3 70B FP8,H100 SXM5,128 并发,三者全开:2,200-2,400 tok/s
- Aynı model,默认 vLLM( hiç parçalanmamış ön doldurma): ~ 1,800 tok/s。
- Aynı model, basit PyTorch ileri döngüsü: ~600 tok/s
- 生产负载下 PagedAttention 的 KV 碎片化浪费:<4%──
- 混合负载下 P99 ITL: 时 ~15 ms,不使用时 ~50 ms。

### planlayıcı'nın şablonları

```
while True:
    finished = [s for s in RUNNING if s.is_done()]
    for s in finished: release_blocks(s); RUNNING.remove(s)

    while WAITING and have_free_blocks_for(WAITING[0]):
        s = WAITING.pop(0)
        allocate_initial_blocks(s)
        RUNNING.append(s)

    # schedule prefill chunks + decode in one batch
    batch = []
    for s in RUNNING:
        if s.in_prefill:
            batch.append(next_prefill_chunk(s))   # e.g. 512 tokens
        else:
            batch.append(decode_one_token(s))     # 1 token

    run_forward(batch)                            # one fused GPU call
```

`code/main.py`Bu döngünün stdlib Python  versiyonu, yanlış simge sayıları kullanmak ve yanlış ileri gecikme.


```figure
tensor-parallel
```

## Kullan
`code/main.py`模拟一个vLLM 风格的调度器,并带有可切换功能──运行:

- `NAIVE`Mod: Tek bir istek, toplama yok.
- `STATIC`Mod:Padding 并等待, klasik partilenmek
- `CONTINUOUS`Mod:iteration 级别的录取和释放──
- `CONTINUOUS + CHUNKED`mod:prefill 切片与 dekode 交错。

输出会展示总 throughput (virtual saniye başına tokens) 、TTFT ortalaması 和 P99 ITL。`CONTINUOUS + CHUNKED`Bu yol karışık akım üzerinde avantajlı olmalıdır.

## - Söyle.
本课会生成 `outputs/skill-vllm-scheduler-reader.md` Verilmiş bir servis yapılandırması ((batch size ‒KV hafıza kullanımı ‒ parçalanmış prefill size ‒ spekülatif yapılandırma), bir planlamacı teşhisine yol açar, üç defalama ayarlarından hangisinin şişeye dönüştüğünü ve neyin düzeltilmesi gerektiğini belirtir.

## 练习
1. 运行  İşlem`code/main.py`◊ içinde kısa talepler ve uzun taleplerin karışık iş yükü  上比较 `STATIC`ile`CONTINUOUS`◊output 差 nereden geliyor, prefill verimliliği  decode verimliliği mi yoksa kuyruk gecikmesi mi?
2. Bu oyuncak programını değiştir, ekle.`--max-num-batched-tokens`△ Llama 3.3 70B FP8 için H100,正确取值是多少?
3. VLLM v0.18.0 sürüm notları. Hangi bayraklar birbirinden ayrılır?
4. 针对 1,000 个请求的追踪 计算 KV缓存 碎片化浪费,平均 1,500输出代币,std 600代币,分别在以下条件下:(a) 以8192 max 进行连续每请求分配,(b) 使用16代币的块的 PagedAttention;;
5. Neden parça prefill P99 ITL yardımcı olur, ama tek başına görmezden gelir artırmak için.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| PagedAttention | “KV trick” | 用于 KV cache 的固定大小 block allocator；碎片化 <4% |
| Block table | “page table” | 每个 sequence 从 logical token position 到 physical KV block 的映射 |
| Continuous batching | “dynamic batching, but right” | 每个 decode iteration 都做 admit/release 决策 |
| Chunked prefill | “prefill splitting” | 将长 prefill 拆成 512-token 切片并与 decode 交错 |
| TTFT | “first token time” | Prefill + queue + network；在长 prompts 下由 prefill 主导 |
| ITL | “inter-token latency” | 连续 decode tokens 之间的时间；由 batch size 主导 |
| Goodput | “满足 SLO 的 throughput” | 每个 request 仍命中 TTFT 和 ITL targets 时的 tokens/sec |
| V1 scheduler | “new scheduler” | vLLM 的 2026 scheduler；N-gram spec decode 是与 chunked-prefill 兼容的路径 |
| `--gpu-memory-utilization` | “memory knob” | 在 weights 和 activations 之后为 KV blocks 预留的 HBM 比例 |

## 延伸阅读
- [vLLM documentation — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode/)                                                                                                                                                                                                                                                              
- [vLLM Release Notes (NVIDIA)](https://docs.nvidia.com/deeplearning/frameworks/vllm-release-notes/index.html) 2026 yayın kadansı 和特定版行为──
- [vLLM Blog — PagedAttention](https://blog.vllm.ai/2023/06/20/vllm.html) 仍然定义如何理解分配器 的原始文章。
- [PagedAttention paper (arXiv:2309.06180)](https://arxiv.org/abs/2309.06180) 碎片化分析与时间表设计──
- [Aleksa Gordic — Inside vLLM](https://www.aleksagordic.com/blog/vllm) 带有火焰图的详细 V1 节目表行程──
