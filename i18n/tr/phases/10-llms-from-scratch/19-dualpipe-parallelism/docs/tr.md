# Çift Pipe Paralellizmi

> DeepSeek-V3 2.048 张 H800 GPU'ları kullanıyor 训练,MoE uzmanları çok noktada dağıtılıyor 跨节点专家 跨节点专家 跨节点专家 跨节点专家 跨节点专家 跨节点专家 跨节点专家 跨节点专家 跨节点专家 跨节点专家 跨节点专家 跨节点专家专家 跨节专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专家专业专家专家专家专业专家专家专家专家专家专业专业专家专家专家专家专家专家专家专业专业专业专业专业专业专业专业专家专业专业专业专业专业专家专业专业专家专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业专业

**Type:** Learn
**Languages:** Python (stdlib, schedule simulator)
**Prerequisites:** Phase 10 · 05（distributed training、FSDP、DeepSpeed），Phase 10 · 14（open-model architectures 和 MoE）
**Time:** ~60 minutes

## Öğrenme hedefi
- DualPipe'nin ileri-geri parçalarının dört bileşenini ve neden her bölümün kendi üst üstelik penceresi olduğunu anlatın.
- 解释大规模下管道泡问题,以及 泡free 在实践中和在营销语境中的区别──
- Hand工跟踪 8 个 PP sıraları 和 16 个微批的双管时间表,并确认前流和反流 会填充彼此的空槽位──
- Açıklama DualPipeV(Sea AI Lab,2025) 取舍:在 Expert Parallelism 不活时,以略大泡为价,掉掉2x 参数复制──

## 问题
2k H800 GPU'larda 671B MoE modeli ile karşılaştık.

1. **内存压力。**Her GPU'nun bir parçası var. 8k dizisi, 61 katman 128 başlık.
2. **Pipeline bubbles。**传统管道平行性(GPipe、1F1B) GPU'ları aşamasının girişini beklerken veya Gradient 时处于空──8 aşamalarda 时, 1F1B programlamasını kullanırken bile, GPU'ların yaklaşık %12'si 泡 bile olabilir.
3. **跨节点 all-to-all。**Uzman paralelliği kullanılarak MoE, uzmanları bir çok noktaya dağıtacak. Her ileri geçiş, bir kez tümüne, tokenleri kendi uzmanlarına göndermek için, ardından da bir kez tümüne başlatır.

Bu sorunların her biri ayrı bir çözümüne sahiptir: hafıza gradient kontrol noktası, boru kabarcıkları, sıfır kabarcıklar, Deniz AI Laboratuvarı,2023), her şeye uzman paralel iletişim çekirdekleri ile birlikte çalıştırmak için DualPipe yapılır. Bu program, bir tek ileri-geri parçacıkta kalır.

Rapor sonuçları: DeepSeek-V3'in 14.8T-token  eğitiminde, boru kabarcıkları neredeyse ortadan kalktı, GPU kullanım oranı %95'ten fazlaydı.

## 概念
### Kök hattı paralelliği 复习

Bir N katman modeli ayırıp P cihazına ayırmak.`i` katmanları `i * N/P .. (i+1) * N/P - 1` Bir mikro-batch, cihaz 0'dan P-1'e doğru ileride, sonra P-1'den 0'ya doğru geriye doğru yürütülür.

GPipe(Huang et al., 2019) bir kez bir mikro-batch düzenleme, bu GPU  zamanının büyük kısmını harcayacaktır.

DualPipe bir sonraki adımdır. Bu temel üzerinde iki fikir daha ortaya çıkmıştır:

### Fikir 1: parçacık parçalanma

Her ileri parça dört parçaya ayrılır:

- **Attention。**Q/K/V projeleri, Dikkat projeleri, çıkış projeleri,
- **All-to-all dispatch。**Tokenleri kendi uzmanlarına göndereceğiz.
- **MLP。**MoE uzmanı 計算。
- **All-to-all combine。**Uzman çıkışlarını getirmek için.

Bir geriye doğru parça, bu bölümlere katılır Gradient  versiyonu。DualPipe, tümüyle gönderilmesini sağlar.

### Fikir 2: İki yönlü programlama

Büyük çoğunlukla boru hattı programları, 0 aşamasından mikrobatchlara girilir,并流向 P-1 aşamasına doğru.

Bunu başarmak için, cihaz `i`Aynı zamanda erken boru katmanı da olmalıdır.`i`Ve son boru katmanı `P - 1 - i`Bu, DualPipe'de dual'un parçasıdır: Her cihaz iki model katmanı tutar. Her yön için kullanılır. DeepSeek-V3'ün büyüklüğünde, bu 2x'lik bir parametreler kopyalama maliyeti.

关键在于, bir yönde ileri akım ve diğer yönde geri akım 会恰好在单向时间表 产生泡的位置重叠──泡消失──

### Elden izlenen bir program

考虑 P = 4 sıra、8 mikro-batch,分为 4 个前进 / 4 个逆──时间从左到右移动;行是设备级──

```
           Time →
rank 0:  F1 F2 F3 F4  F5R F6R F7R F8R  B1 B2 B3 B4  ...
rank 1:     F1 F2 F3  F4/F5R F6R F7R   B1 B2 ...
rank 2:        F1 F2  F3/F5R F4/F6R    B1 ...
rank 3:           F1  F2/F5R F3/F6R    ...
```

读取 F4/F5R 这种记法:ranking 1 在同一时间槽中,同时运行微批4的前方(在管道中从左到右) 和微批5的前方(从右到左) 这是双向 在操作层面的含义──

Rango 2'de,交叉流更早重叠; Rango 0'de ve P-1'de, bunlar en geç重叠──; Rango 0'de, P-1'de, bunlar en geç重叠──; Rango'nun sabit orta aşamasında, her rango X yönünden ileriye, Rango'ya doğru ilerliyor, Rango'ya doğru ilerliyor.

### Bubble muhasebe

标准 1F1B boru havuzu( her sıra 浪费的时间):

```
bubble_1F1B = (P - 1) * forward_chunk_time
```

Zero Bubble  iyileştirme onu düşürür, ama sıfıra düşemez. DualPipe 稳定阶段, eğer mikro-batch sayısı 2 katı boru hattı derinliği 整除,就有零泡──在稳定阶段以外 (加熱和冷却) ), yine de bazı balonlar olacaktır, ancak mikro-batch sayısı büyüme ile birlikte olmayacaktır, bu makaleyi vurgulayan önemli niteliklerdir.

营销语境中: 泡无──技术语境中:泡 不会随着微批数量增长──Sea AI Lab 的后续分析(DualPipeV / Cut-in-half) gösterir ki, yalnızca Expert Parallelism 不是瓶时才完全零泡;

### DualPipeV  rafine

Sea AI Lab(2025) Noted, when EP comm overlap 不是重点时,2x 参数复制是浪费的。 Onların DualPipeV programı iki yönlü enjeksiyon V şeklinde   bir program içine çarpıştırılacak, V biçimindeki bir P- biçiminde 

取舍如下:

| Feature | DualPipe | DualPipeV | 1F1B | Zero Bubble |
|---------|---------|-----------|------|------------|
| 每个设备的参数副本 | 2 | 1 | 1 | 1 |
| Bubble vs micro-batches | constant | small growth | grows | grows |
| Compute-comm overlap | full | partial | minimal | partial |
| Use when | EP-heavy MoE | dense or EP-light | baseline | any pipeline |

### 14.8T-token için 运行 ne anlama geliyor ?

DeepSeek-V3'ün ön eğitiminde 2,048 张 H800 GPU'lar üzerinde 14.8T token tüketildi, yaklaşık 2.8M GPU saatleri. Eğer basit 1F1B kullanırsanız, bu boru havuzları yüzünden %12-15'i kaybedeceklerdir. Yani 340-420K GPU saatleri, tam bir 70B modeli yetiştirmek için yeterli. DualPipe geri dönüşü yaptı. Bunların büyük bir kısmını elde etti. İçeri kayıt yok, doğrudan katkılarını ölçmek zordur, ancak makalede yapılan açıklama, eğitim ortalama GPU kullanım oranı %95'den fazladır.

 Küçük ölçekli çalışmalar için(1k GPU'lardan düşük),DualPipe bazı aşırı: boru havuzları karşılaştırıldığında toplam maliyet daha küçük, ve yoğun model eğitim  çok az değinir 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼 🏼

### Bu yığının ortasında yer almaktadır .

- ile**FSDP**(Fase 10 · 05)互补──FSDP model parametrelerini sıraya bölmek; DualPipe 调度 sırası 上的计算──二者可以结合──
- ile**ZeRO-3**Gradyent sharding 兼容── 配合── 需要与 ZeRO 配合── 配合──
- 需要针对具体集群拓学 调优的 **custom all-to-all kernels**DeepSeek'in açık kaynak çekirdekleri ise bu uygulamayı gerçekleştirmek için kullanılmıştır.


```figure
expert-capacity
```

## Kullan
`code/main.py`Bu bir boru hattı programı simülatörü.`(P, n_micro_batches, schedule)`,并印 1F1B、Zero Bubble、DualPipe 和 DualPipeV'nin her türlü sabit aşama kullanımı── bu bir öğretim aracıdır: sayı ile makalede belirlenmiş bir önerme aynıdır, ancak üretim gerçekliğini hızlandırma hakkında bir açıklama değildir──

Bu simülatörün değeri şöyle: farklı P ve mikro-batch sayılar kullanın, 1F1B'nin kabarcık bölümü nasıl büyüdüğünü izleyin, ve DualPipe'nin nasıl büyüdüğünü görün.

Gerçek eğitim çalışmalarının bir araya gelmesini düşünün:

- Seçim bir can tarafından senin mikro seri sayımı 整除的管道-parallel depth──
- 确保你的专家-parallel mesh 支持双向的所有至所有──DeepSeek 的核心是参考──
- İlk gerçekleşen zaman, planda beklenir Bu vücudunda bir hafta geçirmek için bir deneme süresi.
-  Her sıra GPU kullanım oranını izlemek, sadece genel kullanım oranını değil.

## - Söyle.
本课会生成 `outputs/skill-dualpipe-planner.md` Eğitim klüsterinin bir spesifikasyonu belirlenir, GPU sayı, topoloji, bağlantı biçimi, model biçimi), bu, boru hattı paralellik stratejisi, kullanılması gereken programlama algoritması ve hedef boyutunun altındaki beklenen kabarcık bölümü önerir.

## 练习
1. - Evet .`(P=8, micro_batches=16, schedule=dualpipe)`和 `(P=8, micro_batches=16, schedule=1f1b)`Üncelik`code/main.py`△ GPU kullanım 差异,并将其表示为每百万训练代币回收的 GPU-hours──

2. Çizim yapımı`(P=4, micro_batches=8, schedule=dualpipe)`Program tablosu: ️ Mikro-batch ID ve yönü ile her zamanlık yuvasını işaretle.

3. DeepSeek-V3 teknik raporunu okuyun. ArXiv:2412.19437)'ın 5. resmi.

4. DualPipe'nin P=8 boru hattı aşamalarının 70B yoğunluğu modelini ve P=16 boru hattı aşamalarının 671B MoE modelinin 2x  параметрli satış oranını hesaplayın.

5. Bu nedenle, bu iki tür programın birinde, iki yönlü programlama yapılması için iki yönlü programlama yapılması gerekir.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Pipeline bubble | “每个 rank 的空闲时间” | pipeline stage 等待其输入或 Gradient 时浪费的 GPU cycles |
| 1F1B | “默认 pipeline schedule” | one forward / one backward 交错调度；DualPipe 击败的 baseline |
| Zero Bubble | “Sea AI Lab 2023” | 将 backward 拆成 B（input Gradient）和 W（weight Gradient）；几乎完全收紧 pipeline |
| DualPipe | “DeepSeek-V3 schedule” | bidirectional pipeline + compute-comm overlap；bubbles 不随 micro-batch count 增长 |
| DualPipeV | “Cut-in-half” | V-shape 改进版，以略大的 bubbles 为代价去掉 2x 参数复制 |
| Chunk | “pipeline work 的单位” | 一个 micro-batch 通过一个 pipeline stage 的 forward 或 backward pass |
| All-to-all dispatch | “把 tokens 发送给 experts” | 将 tokens 路由到其分配的 MoE experts 的跨节点通信 |
| All-to-all combine | “把 expert outputs 带回来” | MLP 之后收集 expert outputs 的跨节点通信 |
| Expert Parallelism (EP) | “Experts across GPUs” | 将 MoE experts 分片到 ranks 上，使不同 GPUs 持有不同 experts |
| Pipeline Parallelism (PP) | “Layers across GPUs” | 将 model layers 分片到 ranks 上；DualPipe 调度的维度 |
| Bubble fraction | “浪费的 GPU 时间” | (bubble_time / total_time)；DualPipe 推向零的比例 |

## 延伸阅读
- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437), Section 3.3.2 and Figure 5](https://arxiv.org/abs/2412.19437) 主要 DualPipe 参考资料
- [DeepSeek — DualPipe GitHub repository](https://github.com/deepseek-ai/DualPipe) açık kaynak referans uygulaması, DualPipeV
- [Qi et al. — Zero Bubble Pipeline Parallelism (arXiv:2401.10241, Sea AI Lab 2023)](https://arxiv.org/abs/2401.10241) ZERO BABLE 前身
- [Sea AI Lab — DualPipe could be better without the Dual](https://sail.sea.com/blog/articles/63)  DeepSeek EP-off modunu etkileme  DualPipeV  analiz
- [Narayanan et al. — PipeDream / 1F1B (arXiv:1806.03377, 2018-2021)](https://arxiv.org/abs/1806.03377) DualPipe karşılaştırma 1F1B programı
- [Huang et al. — GPipe (arXiv:1811.06965, 2018)](https://arxiv.org/abs/1811.06965) 原始管道平行性 论文和泡泡 问题
