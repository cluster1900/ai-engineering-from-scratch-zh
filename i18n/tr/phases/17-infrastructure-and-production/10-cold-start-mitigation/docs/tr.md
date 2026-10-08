# Serversiz LLM'lerin Soğuk Başlangıç Yenginleme

> Bir 20 GB model görüntüsü soğuktan servise kadar 需要 5-10 分钟(7B) 〜 20+ 分钟(70B) 〜在真正的无服务器世界里,这不是加热,而是停电──Mitigations 作用在五层:预种种节点图像(AWS 上的瓶块、双体弧) 、模型流播(NVIDIA Run:ai Model Streamer,vLLM 原生支持)、GPU hafıza anişeleri(Modal kontrol noktaları,resetart 最多快 10x)、热池(`min_workers=1`)、Layered loading(ServerlessLLM'nin NVMe→DRAM→HBM borusu, gecikme  düşüşü 10-200x), ayrıca KV cache yerine KB giriş Token ⋅GB'nin canlı göçü。Modal 发布的 2-4s cold starts is down limit;Baseten 默认 5-10s,配合预加热可达子秒──本课教你测量、预算并叠加这五层──

**Type:** Learn
**Languages:** Python (stdlib, toy cold-start path simulator)
**前置要求：**17 · 02 aşaması (Inference Platform Economics), 17 · 03 aşaması (GPU Otoscaling)
**Time:** ~60 minutes

## Öğrenme hedefi
- 列举冷起缓解的五层,并说出一个工具或模式──
- 将 70B modeli 計算为 (nod tedarik) + (koşul yükleme ağırlıkları) + (koşul yükleme ağırlıkları) + (motor başlangıcı) 之和。
- 解释为什么现场迁移 传输输输入 Token(KB) KV缓存(GB) yerine,以及代价是什么(recomputation)
- Sıcak havuz ticaretini yapın, GPU'yu kullanmayın, soğuk başlangıç kuyruğunu kabul edin.`min_workers > 0`turunması gereken SLA eşiği olarak

## 问题
Senin sunucusuz LLM son noktası, gece ölçeğinde sıfıra kadar.

1. Karpenter'ın tedarikleri bir GPU düğmesi:45-60s
2. Kontaner çekim bir 带 ağırlıkların 30 GB görüntü:120-300s ⋅
3. Motor ağırlıkları HBM:45-120'ye kadar yüklenecek, model boyutuna ve depolama hızına bağlı olarak.
4. VLLM veya TRT-LLM başlangıç CUDA grafikleri、KV önbelleği havuzu、Tokenizer:10-30s。

总计:220-510s(大约 3-8 分钟) 后才会返回一个代币――你的SLA是2s――你发行一个热池――`min_workers=1`), sorun kaybolmuş gibi görünüyor, ama şimdi 24x7  ücretsiz bir GPU için ödeme yapmalısınız. Eğer hizmetiniz varsa 5 ürün var, her birinde sıcak bir kopya var, 5 × 24 × 30 = 3.600 GPU saat / ay, kullanıcıların birinde olması gerekmezse.

Soğuk başlangıç hafiflemesi, her zaman açık gecikme yaklaşımında, aynı zamanda sunucusuz ekonomileri korumak için bir yöntemdir.

## 概念
### Katman 1  预置节点镜像(Bottlerocket)

AWS'de, Bottlerocket'ın iki ciltli mimarisi, OS'u verilerle ayırır.`EC2NodeClass`Yeni düğümün başlatma zamanı ağırlıklar  zaten yerel NVMe üzerinde, adım 2 ve adım 3 bir parçası kaybolur.

GCP 上的等价方案:带有预烤容器层的自定义VM图像──Azure 上:采用相同的模式的管理磁盘快照──

### Katman 2  model akışı (Run:ai Model Streamer)

Not waiting complete file load 完再回答第1 request,而是逐层将重量流到GPU belleğine,并将重量流到第1变压器块 常驻后立即开始处理──NVIDIA Run:ai Model Streamer 在 vLLM 2026 中原生提供──支持 S3、GCS 和 local NVMe──通过将 I/O 和计算设置重叠,大型模型的重量载时间大约减半──

### Katman 3  GPU hafıza anlık görüntüleri (Modal)

Modal en ilk yüklenmeden sonra GPU durumuna göre kontrol noktası yapılır. Bu durum HBM'ye doğru doğrudan deserialize edilmek için 10x daha hızlı yeniden başlatılır. Bu en yakın durumdur.

### Katman 4  sıcak havuzlar (min_workers=1)

En basit hafifleme: bir kopya tutmak için daima hazır.$0.85-$1.50 30'lu yılların soğuk başlangıcından kaçınmak için), büyük modellere karşı daha iyi olur.

### Katman 5  Katmanlı yükleme (ServerlessLLM)

ServersizLLM depolama 视为一个层级:NVMe(快但大)、DRAM(中等但可分层)、HBM(小但即时) ・・・重量 预先加载到DRAM;按需加载到HBM。Kartı 报告, naif disk-to-HBM, soğuk yüklerin gecikmesi 降低 10-200x。Prodüksiyon kabulü 尚在早期,但已经存在与vLLM 整合──

### Katman 6  canlı göç (bonus modeli)

Bir düğümün kullanılması gerekmez zaman, geleneksel örnekteki soğuk başlatma  başka bir kopya ve boşaltma talebi kuyrukları. Canlı göç, Token'i ekleyecek.

### Sıcak havuz matematikleri

P99 TTFT SLA 2s hizmet için, sorun                                                                                                                                                                                                                                                         

- Yüksek değerli etkileşimli yollar ((canlı sohbet、 sesli ajan):`min_workers=1-2`- Evet.
- Arka planlı parti yolları(gece sınıflandırması): ölçek-sıfır kabul, 5-10 dakika soğuk başlangıçta tolere edilebilir
- Premium seviye: her kiracı `min_workers`Ve özel kapasite.

### Optimize edilmeden önce ölçme

Yeni düğüm Ü 70B modeli soğuk başlangıç anatomisi (Örneğin):

| Phase | Time | Mitigation |
|-------|------|-----------|
| Node provision | 50s | Bottlerocket + pre-seeded image, warm pool |
| Image pull | 180s | Pre-seeded data volume (eliminate) |
| Weights to HBM | 75s | Model streamer (halve); GPU snapshot (eliminate) |
| Engine init | 20s | Persistent CUDA graph cache |
| First forward | 3s | Min inherent latency |
| **Total cold** | **328s** | |
| **Total with mitigations** | **~15s** | 22x reduction |

### Hatırlamalısın numaralar

- Modal soğuk başlangıç:2-4 saniye
- Baseten 默认 soğuk başlangıç:5-10s; kullan ön 时 sub-second
- 70B soğuk başlangıç:3-8 dakika.
- Run:ai Model Streamer: ~ 2x ağırlık yük hızlandırması
- ServersizLLM katmanlı yükleme: gecikme 降低 10-200x


```figure
cold-start-pipeline
```

## Kullan
`code/main.py`建模── rapor toplam soğuk başlangıç zamanı、sıcak havuz maliyeti, yanı sıra sıcak havuz 回本 ihtiyaç Break-Even talebi oranı──

## - Söyle.
本课会产 出 `outputs/skill-cold-start-planner.md` SLA 、model boyutu ve trafik şekli belirlenir, hangi hafiflemeleri üstlenmek gerekir seçilir.

## 练习
1. 运行  İşlem`code/main.py` hesaplama break-even talep oranı: bu oranı aşan, sıcak replik SLO oranı aşağı ek talep düşüyor, soğuk başlangıç vergisi daha ucuz olarak ödeniyor.
2. Siz 13B modelini, P99 TTFT SLA için 3s için deployuyor. Seçim en az hafifleme yığınını elde edebilirsiniz.
3. Boteller çekiminden önce  görüntü çekimini ortadan kaldırdı, ancak ağırlıklar  hala HBM'ye kadar bir anlık çekim yüklenmesi gerekiyor.
4. Serversiz sunucu  GPU çıplak fotoğrafları sunuyor, ancak ekip reddediyor, sebebi snapshots 会泄露 PII──论证
5. ️Düzeltme sıcak havuz politikası: ödeme kullanıcıları, deneme kullanıcıları ve seri iş yükleri 分別需要多少热复制?展示计算过程──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cold start | “the big pause” | Fresh replica 上从 request 到 first token 的时间 |
| Warm pool | “always-on minimum” | `min_workers >= 1`，保持至少一个 replica ready |
| Pre-seeded image | “baked AMI” | Container weights 已预先常驻的 node image |
| Bottlerocket | “AWS node OS” | 支持 dual-volume snapshot 的 AWS container-optimized OS |
| Model streamer | “streaming load” | 将 weights I/O 与 compute setup 重叠 |
| GPU snapshot | “checkpoint to HBM” | 序列化 post-load GPU state；restart 时 deserialize |
| Tiered loading | “NVMe + DRAM + HBM” | Storage tiers 的 hierarchy；按需 load |
| Live migration | “move tokens” | 传输 input（KB），在 destination 上 recompute KV |
| `min_workers` | “warm replicas” | Serverless minimum keep-alive count |
| Scale-to-zero | “full serverless” | Idle 时无 cost；接受完整 cold-start tax |

## 延伸阅读
- [Modal — Cold start performance](https://modal.com/docs/guide/cold-start) Modal 发布的基准和检查点架构──
- [AWS Bottlerocket](https://github.com/bottlerocket-os/bottlerocket) önceden ekilen veri hacmi anında görüntüleme modeli。
- [NVIDIA Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer)                                                                                                                                                                                                                                                              
- [Baseten — Cold-start mitigation](https://www.baseten.co/blog/cold-start-mitigation/)                                                                                                                                                                                                                                                              
- [ServerlessLLM paper (USENIX OSDI'24)](https://www.usenix.org/conference/osdi24/presentation/fu) Dönemli yükleme tasarımı。
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) ayrıntılı yerleşimlerin canlı göçü¬ü¬
