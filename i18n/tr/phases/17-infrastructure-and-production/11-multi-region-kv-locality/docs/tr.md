# Çok Bölgelik LLM Hizmetleri KV Cache Yerleşimi

> Kaydetme ile ilgili LLM sonuçlarına göre, döngü-robin yük dengeleme zararlıdır. Bir istek eğer öntanımlı bir nokta üzerinde düşmezse, tam önceden ödemek gerekir.

**Type:** Learn
**Languages:** Python (stdlib, toy prefix-cache-aware router simulator)
**Prerequisites:** Phase 17 · 04 (vLLM Serving), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## Öğrenme hedefi
- 解释为什么圆轮负载平衡会破坏缓存式推断,并量化 TTFT 惩罚──
- 画出 cache-aware router:输入(KV-cache olayları) 算法(prefix-hash match)  Ties-breaker(GPU kullanımı)
- LLM'nin %32 DR 失败驱动因素 (Gahluk Tokenizer 文件 / quantization config),并陈述三文件 DR kontrol listesinden oluşmaktadır.
- 区分商业 产品(Bedrock CRI、GKE Multi-Cluster Gateway) ve KV-Açık Routing

## 问题
Suzlu Hızlı Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suzlu Geliştirme: Suz: Suzlu: Suzlu: Suzlu: Suzlu: Suz: Suzlu: Suz: Suz: Suz: Suz: Suz: Suz: Suz: Suz: Suz: Suz: Suz: Suz: Suz: Suz: Suz: Suz:::::::::::::::::

Durumsuz hizmet için döngü-robin en iyisidir. LLM sonucu, tasarım doğrultusunda durumdadır.

Ayrıca, takımınız bir DR planı var. S3 çapraz bölgeye kaydetmiş model ağırlıklarını oluşturmuşsunuz. Bölge arızaları meydana geldi.

Çoklu bölge LLM hizmetleri 缓存 问题、路由 问题和 DR hijyen 问题, değil yük dengeleyici 问题。

## 概念
### Önbelleğe bağlı yönlendirme

Lütfen hızlı bir şekilde ulaşın. Router'a bir önbellek için hash yapın. Her bir replikadan soruyor: 

**vLLM Router**(Rust,2026 üretim aşaması): 订阅 `kv.cache.block_added`Events,维护 prefix-hash → replika indeksi, O(1) ile arama 路由──没有匹配时回落至最小队列深度──

**llm-d router**Aynı model, Kubernetes-native── ControlPlane API üzerinden etkinlikler yayınlamak──

**SGLang RadixAttention**(Fase 17 · 06) ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒  ⇒ ⇒ ⇒   ⇒ ⇒   ⇒  ⇒      ⇒  ⇒     ⇒                                                                                                                                                                                                                                                         

### Sayılar

2K-token prompt 上的 TTFT P50,Llama 3.3 70B FP8,H100:
- Önbelleği vurma: ~80 ms。
- Kaş eksikliği: ~ 800 ms。

10x 差距── Eğer yönlendiriciniz replikler arasında prefix cache'nin 60-80%'ine ulaşırsa hayatınızda, N-replik 容量 altında tek replik  performansına yaklaşırsınız── eğer sadece 10% ise, safsal ölçeklemeye yaklaşırsınız──

### Bölge çapında yeni bir sistem var: Ağ gecikmesi

Bölgelerarası RTT:
- US-East-1  US-West-2: ~65 ms。
- US-East-1  eu-West-1: ~75 ms。
- US-East-1  ap-southeast-1: ~ 220 ms。

Eğer yönlendirme, US-East-1 送到 ap-southeast-1 的热序列,节省的预填(800 → 80 ms) tarafından 440 ms dönüş yolculuğu tarafından 抵消──GORGO(2026 araştırma) 把这一点显式化:联合最小化`prefill_time + network_latency`, sadece en az doldurulmasını değil. Cevap genellikle bölgesel yönlendirmeyi sürdürmek, büyük çok MB önlemeyi ele alan prefill dışında.

### 商业 "kısası bölge sonucu" burada yardımcı olmaktan fazla meşgul

AWS Bedrock bölgesel kesinti Hızlılık basıncı sırasında otomatik olarak diğer bölgelere yollanan talepleri gönderir.

Bu ürünleri kullanmak için hala bir uygulama katmanı cache-açık yönlendiricisine ihtiyacınız var.

### DR hijyen: %32 eksik dosyalar  problem

广泛引用的2026 统计:32% LLM DR 失败, çünkü takım ağırlıkları yedekledi, ama unuttu:

- `tokenizer.json`Ya da`tokenizer.model`
- Kvantisalat yapılandırmaları`quantize_config.json`、AWQ ölçekleri、GPTQ sıfır noktaları)
- Model-specifik yapılandırmalar ((RoPE ölçeklendirme, dikkat maskeleri, sohbet şablonları)
- Motor yapılandırması`vllm_config.yaml`、Özelleme öntanımlıları、LoRA adaptör manifestoları)

修复方式是三文件最小 DR manifest:

1. HF model repo 下所有文件(boz + yapılandırmalar + Tokenizer)
2. Motor spesifik servis yapılandırması
3. Uygulama manifestı ((K8s YAML、Dockerfile、 bağımlılık kilitli)

Ayrıca: her sezon bir DR hareketi yapılıyor. JPMorgan US-East-1 hareketi 2024 yılının 11 ayında 22 dakika geri kazanmaya ulaştı.

### Veri oturumluğu is正交問題

AB müşteri PHI, AB'den ayrılamaz. Eğer öntanımlı yönlendirmenin size eşleşmesi için, TTFT'nin nasıl yararlandığını düşününce, RGPD'yi çiğnediğinizde, Router'lara ayrılmış bölgeye göre, yeniden cacheyi optimize etmeniz gerekmektedir.

### Hatırlamalı olduğun bir sayı var.

- Kaş vurma vs. Miss TTFT 差距: ~ 10x(2K prompt 上 80 ms vs 800 ms) ]]
- Bölgelerarası RTT ABD-AB: ~75 ms。
- DR başarısızlığı: %32 缺失 Tokenizer/quant config──
- JPMorgan us-east-1 başarısızlık 2024 yıl 11 月:22 分钟(30 dakika SLA) ⋅


```figure
cache-aware-router
```

## Kullan
`code/main.py`Çoklu bölge iş yükü 上模拟三种路由策略(round-robin、cache-aware regional、cache-aware global)

## - Söyle.
本课产 出 `outputs/skill-multi-region-router.md`❖ belirlenmiş bölgeler, oturum kısıtlamaları, SLA, yönlendirme planı

## 练习
1. 运行  İşlem`code/main.py`75 ms RTT'de, kısa süreli olarak bölge arası yönlendirme sadece yerel yönlendirmeyi yener.
2. %70'den %12'e düştü.
3. VLLM'de hizmet veren bir için 5 LoRA adaptörü ile birlikte 70B AWQ-quantized model tasarımı DR manifestoları için.
4. 论证 Bedrock bölgesel sonuca varmak için sert TTFT SLO'nun fintech var mı yeterli değil mi?
5. Bir Paris'ten gelen talep, US-East-1'in öncü ile uyumludur.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cache-aware routing | "smart LB" | 基于 prefix-hash match，把请求路由到持有 KV-cache 的 replica |
| KV-cache events | "cache pub-sub" | Replicas 发布 block add/evict；router 建索引 |
| Prefix hash | "cache key" | 前 N tokens 的 hash，用作 router lookup |
| GORGO | "cross-region routing research" | arXiv 2602.11688；把 network latency 作为显式项 |
| Cross-region inference | "Bedrock CRI" | AWS 产品；availability failover，不感知 TTFT |
| DR manifest | "the backup list" | 恢复所需的每个文件，不只是 weights |
| Data residency | "GDPR boundary" | 关于哪个 region 可以看到 user data 的法律约束 |
| RTT | "round-trip time" | Network latency；75 ms US-EU，220 ms US-APAC |
| LLM-aware LB | "cache-hit LB" | 作为产品类别的 cache-aware router |

## 延伸阅读
- [BentoML — Multi-cloud and cross-region inference](https://bentoml.com/llm/infrastructure-and-operations/multi-cloud-and-cross-region-inference)
- [arXiv — GORGO (2602.11688)](https://arxiv.org/html/2602.11688v1) 带 ağ gecikmesi 项 cross-region KV-cache yeniden kullanımı
- [TianPan — Multi-Region LLM Serving Cache Locality](https://tianpan.co/blog/2026-04-17-multi-region-llm-serving-data-residency-routing)
- [AWS Bedrock Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html) kullanılabilirlik arızası belgesi。
- [vLLM Production Stack Router](https://github.com/vllm-project/production-stack) cache-ağır yönlendirici kaynağı。
