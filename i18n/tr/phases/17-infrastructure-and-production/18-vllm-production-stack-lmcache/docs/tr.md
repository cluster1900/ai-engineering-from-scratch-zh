# Kullanım LMCache KV Depolama Of vLLM Üretim Stack

> vLLM'nin üretim-buğumu, Kubernetes'in dağıtımına, yönlendiricilerin ve gözlemlenebilirliklerin birbirine bağlanmasına dayanır. LMCache, KV boşaltma aşamasıdır. GPU belleğinden KV boşaltma kaydını çıkarır ve sorular ve motorlar arasında tekrar kullanır. Önce CPU DRAM, sonra disk/Ceph.

**Type:** Learn
**Languages:** Python (stdlib, toy KV-spill simulator)
**前置要求：**17 · 04 aşaması (vLLM Serving Internals), 17 · 06 aşaması (SGLang/RadixAttention)
**Time:** ~60 minutes

## Öğrenme hedefi
- 図出 vLLM üretim-buğlu her kat: yönlendiriciler, motorlar, KV yükleme, gözlemlenme­lik
- KV İndirme Bağlantısı API ((v0.9.0+), ve 0.11.0 asinkron yolu  nasıl açıklama gecikmesini gizleyebilirsiniz。
- 量化 LMCache CPU-DRAM 何時有幫助 (KV > HBM),以及何時只增加上費 (KV)
- Uygulama kısıtlamalarına göre, yerel vLLM CPU yükleme ve LMCache bağlantısı arasında seçim yapılır.

## 问题
Sizin vLLM hizmetindeyken yukarı yükselirken GPU HBM  100%'e ulaşır, önleme olayları ortaya çıkmaz.

增加更多GPU的成本是线性的──增加更多HBM 不可能──但CPU DRAM 很便宜,一个插座就有512GB+ ,延迟比HBM 差几个数级,但对临时保温的KV缓存来说足够──

LMCache KV kasesini CPU DRAM'a çekerek, öntanımlı istekleri 快速恢复,并让引擎ler arasındaki tekrarlanan önlükleri  共享缓存,而不需要每个引擎都重新预填──

## 概念
### vLLM üretim aşaması

`github.com/vllm-project/production-stack`Bu konuda Kubernetes'in Başkanlığı:

- **Router** cache-aware(Fase 17 · 11)。消费 KV olayları。
- **Engines** VLLM çalışanları── her GPU, veya her TP/PP grubu, bir──
- **KV cache offload** LMCache dağıtım veya yerel bağlantı.
- **Observability** Prometheus kazıması,Grafana destiçleri,OTel izleri.
- **Control plane** servis keşfi, yapılandırma, sürüm güncellemeleri

以 Helm chart + operator 形式交付。

### KV İndirme Bağlantısı API (v0.9.0+)

vLLM 0.9.0  Bağlantı API'si, eklenebilir KV önbelleği arka planları için kullanılır. Motoru blokları bağlayıcıya yükleyecek. Bağlantı onları depolayacaktır.

vLLM 0.11.0(2026 yıl 1 月) asinkron atık yolunu arttırdı: in common case, offload can be in the backstage occur, therefore engine will not be blocked;. End-to-end latency 和 throughput  still depends on workload shape、KV cache hit rate 和 system pressure; vLLM   kendi açıklamasında ayrıca, custom-kernel offload in low hit rates 下可能降低吞吐量,并 async scheduling with speculative decoding 存在已知的相互作用问题──

### Doğal CPU yükleme karşı LMCache

**Native vLLM CPU offload**:motor-local──把 KV blokları 存储在主机RAM中──实现快,零网络 hop──不能跨引擎──

**LMCache connector**: cluster-skalalı──把 bloqlar 存储在共享 LMCache sunucu(CPU DRAM + Ceph/S3 tier) 中──任何引擎都可访问区块──已有16x H100 发布──

Bir tek motor var HBM basıncı 时选择 native──当多个引擎 共享预写 时选择 LMCache(带共同系统提示的RAG、带共享模板的多租户)──

### Benchmark davranışları

4 台 A3-highgpu-4g 上的16x H100(80 GB HBM) test:

- Düşük KV ayak izi ((çık çağrılar  düşük eşzamanlılık): tüm yapılandırmalar başlangıç seviyesine  eşittir, LMCache  yaklaşık % 3-5% genel maliyet artışı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- Orta derecede ayak izi:LMCache 开始在引擎 之间 prefix kullanımı 上带来帮助。
- KV  HBM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

### LMCache belirgin olduğunda

- Çoğu kiracı 共享 sistem istekleri  多个租户服务──
- Belge parçaları:
- Aynı temel yukarıdaki ince ayarlanmış çeşitleri (LoRA), bunlardan temel model KV yeniden kullanımı 会减少重复工作──
- Önleme ağır iş yükleri: CPU'yu yeniden yüklemek için daha kolay.

### Ne zaman etkinleştirmemek

- HBM basıncı çok küçük. Üst maliyetini ödeyeceksin ama hiçbir kazanç yok.
- Kısa bağlamlar ((<1K token): transfer zamanı > 重新 prefill。
- Tek kiracı tek seferlik iş yükü: hiçbir geri dönüşü bulunmuyor.

### Ayrıntılı servis ile entegrasyon

17 · 17 ayrıştırılmış servis + LMCache 会叠加增益: Prefill pool'dan decode pool'ın KV transferleri Eğer kullanılmıyorsanız, LMCache'ye düşecek; sonraki sorular LMCache'den 拉取── 17 · 11 cache-açık yönlendiricisi istek yollarını yerel cache'ye veya LMCache- paylaşılmış cache'ye yönlendirebilir 匹配的引擎──

### Hatırlamalısın numaralar

- vLLM 0.9.0:Konector API 发布──
- vLLM 0.11.0(2026年 1月):Asynkron boş yük yolu; sonundan sonuna gecikme etkisi 取決作業負荷、KV çarpma oranı 和システム basıncı(不是绝对保证) ・・・
- 16x H100 referans: KV ayak izi  HBM 时,LMCache 有帮助──
- Küçük HBM basıncı: %3-5% üst ücreti ve hiçbir kazanç yok.


```figure
zero-sharding
```

## Kullan
`code/main.py`HBM'nin kullanımı ve bu şekilde yeniden doldurulmasını önlemek için bir önleme ağır iş yükü oluşturmak gerekir.

## - Söyle.
本课会产 出 `outputs/skill-vllm-stack-decider.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                       

## 练习
1. 运行  İşlem`code/main.py`LMCache ne HBM kullanımı  Planlamaya başlayın?
2. 某租户 每小时 200 个查询 共享一个 6K-token系统提示──计算每个租户 预期的LMCache节省──
3. LMCache sunucusu başarısızlığın tek noktasıdır. HA stratejisini tasarlamak için
4. LMCache, dönüm diski üzerinde var Ceph. 70B FP8 için 4K-token KV ((500 MB), okuma zamanı karşılaştırıldığında yeniden doldurmak nasıl?
5. 论证 vLLM 0.11.0 asinkron yolları 否免费:overhead 藏在哪里?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Production-stack | “参考部署” | vLLM 的 Kubernetes Helm chart + operator |
| Connector API | “KV backend interface” | vLLM 0.9.0+ 的 pluggable KV store interface |
| Native CPU offload | “engine-local spill” | 把 KV 存到同一 engine 的 host RAM 中 |
| LMCache | “cluster KV cache” | CPU DRAM + disk 上的 cross-engine KV cache server |
| 0.11.0 async | “non-blocking offload” | 隐藏在 engine stream 后面的 offload |
| Preemption | “evict to make room” | HBM 满时的 KV cache shuffle |
| Prefix reuse | “same system prompt” | 多个 queries 共享开头；cache hit |
| Ceph tier | “disk tier” | cache hierarchy 中 DRAM 下方的 durable storage |

## 延伸阅读
- [vLLM Blog — KV Offloading Connector (Jan 2026)](https://blog.vllm.ai/2026/01/08/kv-offloading-connector.html)
- [vLLM Production Stack GitHub](https://github.com/vllm-project/production-stack) Helm grafik + operatör
- [LMCache for Enterprise-Scale LLM Inference (arXiv:2510.09665)](https://arxiv.org/html/2510.09665v2)
- [LMCache GitHub](https://github.com/LMCache/LMCache) Bağlantı uygulaması。
- [vLLM 0.11.0 release notes](https://github.com/vllm-project/vllm/releases) Asinkron yol ayrıntıları。
