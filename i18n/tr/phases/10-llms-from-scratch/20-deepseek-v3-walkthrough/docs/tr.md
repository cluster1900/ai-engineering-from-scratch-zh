# DeepSeek-V3 架构讲解

> 10 · Ders 14'e her açık modelin düzenleneceği altı yapılandırma rotası adı verildi. DeepSeek-V3 (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3) (DepSeek-V3))) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseek-V3) (Depseed-D) (Depseed) (Depseed) (Depseed) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (

**类型：**Öğrenme
**语言：**Python(stdlib,参数计算器)
**先修要求：**10 · 14(open model讲解) 、10 · 17(NSA) 、10 · 18(MTP) 、10 · 19(DualPipe)
**时间：**75 dakika kadar .

## Öğrenme hedefi

- DeepSeek-V3 yapılandırmasını yukarıdan aşağıya okuyun, her bölümünü açıklamak için altı GPT-2 ve dört DeepSeek özel yenileme programı kullanıldı.
- 推导总参数(671B)、活跃参数(37B), ve kendi bileşenleri──
- 計算 128k bağlamı 下 MLA'nın KV kasesi 占用,并与一个活跃参数相同、 GQA'nın yoğun modelini kullanmak 需要付出的代价进行比较──
- Dört bölümden bahsederken, DeepSeek Özellikle Yeniliklere Sahip Olduğunu belirtti.

## 问题

DeepSeek-V3 ilk yapı üzerinde Llama ailesinin varlığındaki temel farkların ön kenarındaki açık modellerdir. Llama 3 405B, altı dönümlü GPT-2ı düzenlemektedir. DeepSeek-V3 GPT-2'yi tüm altı dönümlüğe ekleyerek dört dönümlüğe katılır.

Bu yapı, birçok 2026 yılının eğitim süresi olarak tamamlanmıştır. Bunu anlamak, önde gelen LLM eğitiminin veya önerilen pozisyonların temel gereksinimleri olarak görülmektedir.

## 核心概念

### Değişen çekirdeği, bir kez daha bak.

DeepSeek-V3  hala autoregressive ‒ bu hala dekoder bloklarını toplayarak yer almaktadır. Her blok ‒ dikkat, MLP, iki RMSNorm içerir. ‒ bu MLP'de hala SwiGLU kullanmaktadır. ‒ Bu hala RoPE kullanmaktadır.

### 转折:用 MLA 取代 GQA

10 · 14 aşamasından itibaren, GQA 通過让多组 Q heads 共享 K 和 V 来缩小 KV cache──Multi-Head Latent Attention(MLA) Daha da ileri:K 和 V 压缩到一个共享的低排的潜伏表示(`kv_lora_rank`), sonra hesaplama sırasında baş 解压──KV kasesi sadece gizli depolanır, genellikle her token her katman 512 个浮点数, 8 x 128 = 1024 个浮点数 değil.

128k bağlamında aşağıda, MLA'nın DeepSeek-V3( her token her katman bir paylaşma gizli kullanın`c^{KV}`K ve V bu gizli 派生'den yukarı projeksiyon yoluyla, bu yukarı projeksiyonlar sonraki matmul'e kadar akşama geçebilir:

```
kv_cache = num_layers * kv_lora_rank * max_seq_len * bytes_per_element
         = 61 * 512 * 131072 * 2
         = 7.6 GB
```

Bir varsayım GQA 基线(Llama 3 70B 形,8 KV başı, başı dim 128)

```
kv_cache = 2 * 61 * 8 * 128 * 131072 * 2
         = 30.5 GB
```

128k bağlamında aşağıda, MLA Llama-3-70B 风格'ın GQA cache 小 4 倍──

权衡是:MLA 在每次注意 计算时增加一步按头的解压;;额外计算量对省的带宽很小;;对长文脈的推理,净收益为正;;

### Yol: Yardımcı Kayıpsız Yük Düzeltmesi

MoE yönlendiricileri her bir token'ı üst düzey uzmanların tarafından 处理──朴素路由器会把多多工作集中到少数专家上,导致其他专家置──标准修复方法是添加一个辅助损失项,用于惩罚负载不均衡──

DeepSeek-V3  yardımcı kayıpsız bir 方案  Router logitleri  ⇒ uzman ⇒ 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项 项   项 项 项  项 项 项    项       项      项 项     项 项    项       项     项     项     项      项       项     项      项                                                                                                               `e`Üzerinde, aşağıda.`bias_e`Eğer yük yetersizse, onu artırın.

MoE  yapı etkileri: daha temiz, hiçbir düzenleme gerektirmez yardımcı kayıp hiperparametre

### MTP: Daha yoğun bir eğitim + 免费草案

10 · 18 aşamasından itibaren, DeepSeek-V3'de D=1'in MTP modülü arttırıldı. Son iki konum belirtileri tahmin edilmesi için kullanıldı.

参数: 671B main 之上上14B ︎ 开销:2.1% ︎

### 訓練:DualPipe

Fazla 10 · 19'dan itibaren DualPipe'nin iki yönlü bir boru hattı olduğunu biliyorsunuz. Bu boru hattı ile birlikte ileri ve geriye doğru bölükler ve tüm bağlantı noktaları ile iletişim yüklenir. DeepSeek-V3'in 2.048-H800'ün büyüklüğünde, 1F1B'nin orijinal boru hattı kabarcıkları nedeniyle kaybedilen 245k GPU saatini yaklaşık olarak geri aldı.

### Yapılandır,逐字段解析

Aşağıda DeepSeek-V3 yapılandırması yer alıyor:

```
hidden_size: 7168
intermediate_size: 18432   (dense MLP hidden size, used on first few layers)
moe_intermediate_size: 2048 (expert MLP hidden size)
num_hidden_layers: 61
first_k_dense_layers: 3    (first 3 layers use dense MLP)
num_attention_heads: 128
num_key_value_heads: 128   (formally equal to num_heads under MLA, but
                           the real compression is in kv_lora_rank)
kv_lora_rank: 512          (MLA latent dimension)
num_experts: 256            (MoE expert count per block)
num_experts_per_tok: 8      (top-8 routing)
shared_experts: 1           (always-on shared expert per block)
max_position_embeddings: 163840
rope_theta: 10000.0
vocab_size: 129280
mtp_module: 1               (1 MTP module at depth 1)
```

解析如下:

- `hidden_size=7168`: 维度──
- `num_hidden_layers=61`- Ne demek istiyorsun?
- `first_k_dense_layers=3`Önceki: 3 blok kullanıyor.
- `num_attention_heads=128`- 128 soru başlığı...
- `kv_lora_rank=512`K ve V bu gizli 维度'ye sıkıştırılır, başı 解压──
- `num_experts=256, num_experts_per_tok=8`Her MoE bloğunda 256 uzman var. Top-8 yönlendirmeyi kullanıyorlar.
- `shared_experts=1`256 yönlendirilmiş uzmanın dışında her token için her zaman çalışan bir uzman da vardır.
- `moe_intermediate_size=2048`Her uzmanın gizli boyutu MLP'dir.

### 参数核算

完整计算在 `code/main.py`Orta:

- Ekleme:`vocab * hidden = 129280 * 7168 = ~0.93B`- Evet.
- Ön 3 个 个 密集块:带 MLA 的注意(每块约144M) + 密集 MLP(每块约260M) + 标准──总计约1.2B──
- 58 个 MoE bloğu:带 MLA 的注意(約144M) + 256 个专家(每约30M) + 1 个共享专家(30M) + norm──按包含所有专家 计算,每块 总计约7.95B──58 个 MoE bloğu 总计 461B──
- MTP modülü:14B

总计:core architecture 约476B + 14B MTP;而已发布的671B 数字还会单独计入额外结构参数(bias tensors、专家特定组件、shared expert scaling等) ⋅

Her seferinde aktif parametreler:

- Dikkat: Her katman 144M * 61 = 8.8B
- MLP aktif:前 3 層 dense(3 * 260M = 780M),58 个 MoE katmanları 中每层激活 8 个路由 + 1 个共享 +路由上海费──每层 Active MLP 约 260M──总计:3 * 260M + 58 * 260M = ~15.9B──
- Ekleme + normlar:1.2B。
- 总活跃:约26B核心 + 14B MTP(训练时使用,但推理时不总是运行)≈ 37B。

### 671B / 37B örneğin

18 倍稀疏比例(活跃参数总参数的5.5%) ――DeepSeek-V3 zaten açık ağırlıkların en稀疏前沿 MoE 模型──Mixtral 8x7B oranı 13/47 ((28%), yoğun 得多──Llama 4 Maverick oranı 17B/400B(4.25%), bunun eşdeğeridir──DeepSeek'in iddiası şu: ön kenar boyutunda, daha fazla uzman, daha düşük aktif oranı artırdı, her FLOP'un kalitesi üzerinde daha iyi sonuçlar getirecektir──

### DeepSeek-V3'in konumları

| 模型 | 总参数 | 活跃参数 | 比例 | Attention | 新想法 |
|-------|------|-------|-------|-----------|-------------|
| Llama 3 70B | 70B | 70B | 100% | GQA 64/8 | — |
| Llama 4 Maverick | 400B | 17B | 4.25% | GQA | — |
| Mixtral 8x22B | 141B | 39B | 27% | GQA | — |
| DeepSeek V3 | 671B | 37B | 5.5% | MLA 512 | MLA + MTP + aux-free + DualPipe |
| Qwen 2.5 72B | 72B | 72B | 100% | GQA 64/8 | YaRN 扩展 |

### 后续:R1、V4

DeepSeek-R1(2025) V3 omurgası 上'da akıl yürütme eğitimi bir kez çalıştırılmıştır. R1 aynı yapı kullanmaktadır.

DeepSeek-V4 (eğer yayınlanırsa) MLA + MoE + MTP'yi koruyacak ve DSA'ya katılacak.


```figure
moe-routing
```

## Kullan

`code/main.py`Bu, DeepSeek-V3 biçimindeki parametre hesaplayıcıya özel olarak uyarlanmıştır.

需要关注:

- 总参数 vs 已发布的671B──
- 活跃参数 vs 已发布的37B──
- 128k bağlamı 下的 KV cache,也就是 MLA vs GQA 的比较──
- 按层的解解,用于观察参数预算实际花在哪里──

## - Söyle.

本课会生成 `outputs/skill-deepseek-v3-reader.md` DeepSeek aile modelini belirler, bir parça bir yapı oluşturur, yapılandırmanın her bir bölümünü isimlendirir, bir parça tarafından yönlendirilir, ve dört DeepSeek özel yenilikten hangisini kullanır.

## 练习

1. 运行  İşlem`code/main.py` Bilgisayarın toplam parametrelerinin tahminlerini yayınlanan 671B ile karşılaştırarak, farklılıkların nereden geldiğini anlamak.

2. Configuration modification, MLA ranking will be changed from 512 改至 256 ⋅计算 128k context 下得到的KV cache 大小──它带来了多少百分比的下降?

3. DeepSeek-V3'ün 256 uzman,top-8) yönlendirme ile bir varsayımın 512 uzman,top-8) değişimleri 总参数增加;活跃参数保持不变──理论上,额外专家容量带来什么收益?推理时代是什么?

4. DeepSeek-V3 teknik raporunu okuyun. ArXiv:2412.19437) Bölüm 2.1 MLA'nın içeriği hakkında.

5. DeepSeek-V3 FP8 eğitimini kullanan çoğu işletim için kullanılmıştır. FP8 vs BF16  depolama 671B ağırlıkları ile hesaplanır.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| MLA | “Multi-Head Latent Attention” | 将 K 和 V 压缩到共享低秩 latent（kv_lora_rank，通常为 512），并按 head on-the-fly 解压；KV cache 只存储 latent |
| kv_lora_rank | “MLA compression dim” | K 和 V 共享 latent 的大小；DeepSeek-V3 使用 512 |
| First k dense layers | “早期 layers 保持 dense” | 前几个 MoE-model layers 跳过 MoE router，并运行 dense MLP 以提高稳定性 |
| num_experts_per_tok | “Top-k routing” | 每个 token 会触发多少个 routed experts；DeepSeek-V3 使用 8 |
| Shared experts | “Always-on experts” | 无论 routing 如何都会处理每个 token 的 experts；DeepSeek-V3 使用 1 |
| Auxiliary-loss-free routing | “Bias-adjusted load balance” | 在训练期间调整按 expert 的 bias 项，以在不添加 Loss 项的情况下保持 expert 负载均衡 |
| MTP module | “额外 prediction head” | 从 h^(1) 和 E(t+1) 预测 t+2 的 Transformer block；更密集训练，免费的 speculative-decoding draft |
| DualPipe | “Bidirectional pipeline” | 将 forward/backward 计算与跨节点 all-to-all 重叠的 training schedule |
| Active parameter ratio | “Sparsity” | active_params / total_params；DeepSeek-V3 达到 5.5% |
| FP8 training | “8-bit training” | 使用 FP8 存储训练数据，并在许多 compute ops 中使用 FP8；相比 BF16 大约内存减半，质量代价很小 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report（arXiv:2412.19437）](https://arxiv.org/abs/2412.19437)  完整的架构、训练与结果文档
- [Hugging Face 上的 DeepSeek-V3 model card](https://huggingface.co/deepseek-ai/DeepSeek-V3) konfig 文件与部署说明
- [DeepSeek-V2 paper（arXiv:2405.04434）](https://arxiv.org/abs/2405.04434) 引入 MLA'nın önde gelen modeli
- [DeepSeek-R1 paper（arXiv:2501.12948）](https://arxiv.org/abs/2501.12948)  V3 架构 基于的推理培训 后继模型
- [Native Sparse Attention（arXiv:2502.11089）](https://arxiv.org/abs/2502.11089) DeepSeek-family Dikkatın gelecekteki yönleri
- [DualPipe repository](https://github.com/deepseek-ai/DualPipe) Eğitim programı referansı
