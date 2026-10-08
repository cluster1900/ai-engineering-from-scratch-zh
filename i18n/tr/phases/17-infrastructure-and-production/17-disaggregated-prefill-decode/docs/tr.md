# Ayrıntılı Prefill/Decode  NVIDIA Dynamo 和 llm-d

> Prefill ise hesaplama bağlıdır; decode ise bellek bağlıdır. Aynı GPU'da aynı anda çalışarak iki yönünün de bir kaynağı boşa gider. Ayrıntılar onları bağımsız kaynak kümesine ayırır ve NIXL üzerinden NVIDIA.com tarafından yayımlanan yayımlamaları arasında KV kasesi ile aktarılır. NVIDIA Dynamo.com tarafından yayınlanan 1.0 GA'da bulunan vLLM/SGLang/TRT-LLM'de, Planlayıcıları ise kendiliğinden bir kaynak kaybeder. Planlayıcılar ise aynı GPU'da çalışarak hızlandırma hızına göre bir kaynak kaybeder. Prefill:Discode örneği olarak SLO'yu karşılamak için NVIDIA tarafından yayımlanan yayımlamaları:nvidia.com tarafından yayımlanan yayımlamalar.$2M 级别推理支出上节省 30–40%（即 $600-800K/ yıl); bu spesifik $2M→$600-800K sayı iç iç bir bileşiktir, tek bir yayınlanmış durum çalışması değil, onu sayısal sınıfı  nokta olarak değerlendirmek gerekir, değil, kısa istekler 

**Type:** 学习
**Languages:** Python（stdlib，玩具级 disaggregated-vs-colocated simulator）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals），Phase 17 · 08（Inference Metrics）
**Time:** ~75 分钟

## Öğrenme hedefi

- Neden önceden doldurmak ve çözmek için farklı en iyi GPU paylaşıma, ve boyutlandırma kolleksiyon aşağıdaki harcamaları vardır
- 図出 図解アーキテクチャ:prefill pool、decode pool、NIXL'in KV transfer、router、
- Açıklama ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓  ✓ ✓ ✓ ✓ ✓ ✓    ✓ ✓    ✓ ✓ ✓            ✓ ✓     ✓                                                                                                                               
- 区分 NVIDIA Dynamo (üstündeki) ve Illm (Kubernet) yerli),并把它们匹配对应的运维场景──

## 问题

Llama 3.3 70B. On-line çalışmalar: Llama 3.3 70B. On-line çalışmalar: Llama 3.3 H100'de çalışmalar: Llama 3.3 H100'de çalışmalar: Llama 3.3 H100'de çalışmalar: Llama 3.3 H100'de çalışmalar: Llama 3.3 H100'de çalışmalar: Llama 3.3 H100'de çalışmalar: Llama 3.3 H100'de çalışmalar: Llama 3.3 H100'de çalışmalar: Llama 3.3 H100 H100'de çalışmalar: Llama 3.3 H100 H100'de çalışmalar: Llama 3.3 H100 H100'de çalışmalar: Llama 3.3 H100 H100 H100 H100'de çalışmalar: Llama 3.3 H H H H H100 H100 H100 H100 H100 H100 H100 H100 H100 H100 H100 H100 H H100 H H100 H H H100 H H H H H H H H 100 H H H H H 100 H H H H H H H 100 H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H H

Budget etkisi:20-40% GPU  zaman harcamaları yanlış kaynaklarda. H100 hesap satmak, hafıza bağlı dekode çalıştırmak veya H100 HBM bant genişliği satmak, hesap bağlı önceden doldurmak için maliyetli harcamalar.

Bölümleşme 会把预填 和解码 拆分到独立资源池,并按各自瓶进行尺寸化──KV缓存 通过高带宽互连从预填池 传输到解码池──

## 概念

### Neden farklı?

**Prefill** Tam bir giriş istekleri için  bir kez dönüştürücü ileriye gerçekleştirmek──Matrix çarpmaları  dominant; hesaplama bağlı──H100 FP8 yaklaşık 2000 TFLOPS'in geçerli 吞吐可提供──Batch efficiency 很好,一次前来可处理许多代币──

**Decode** 一次生成一个代币,每次代都读取完整重量──内存-带宽-bound──HBM3 提供约3TB/s──批量效率 只有在高同步下才好,因为重量读会在批量上分摊──

Onları yerleştir: H100  ikisi de iyi, ama hangi kullanım maliyetine bakılmaksızın aynıdır. Ölçümlendirme sırasında, H100 / hesaplama ağır kullanmak istediğiniz bir havuzu; H200 / bellek ağır kullanmak veya saldırgan kuantitasyonla birlikte çözme havuzu kullanmak isteyeceksiniz.

### Yapılandırma

```
            ┌──────────────┐
  Request → │    Router    │ ───────────────────────┐
            └──────┬───────┘                        │
                   │                                │
                   ▼ (prompt only)                  │
            ┌──────────────┐    KV cache    ┌───────▼──────┐
            │ Prefill pool │ ─── NIXL ────► │ Decode pool  │
            │  (compute)   │                │  (memory)    │
            └──────────────┘                └──────┬───────┘
                                                   │ tokens
                                                   ▼
                                                 Client
```

NIXL NVIDIA'nın nodlararası taşımacılığıdır. RDMA/InfiniBand kullanılabilir, yoksa TCP geri dönüşü kullanılabilir.

### Dynamo vs. llm-d

**NVIDIA Dynamo**(GTC 2025 发布,1.0 GA):
- 作为乐团员 位于 vLLM、SGLang、TRT-LLM 之上──
- Planlayıcı Profiler 测量工作负载,SLA Planlayıcı Otomatik yapılandırma önceden doldur:decode 比例。
- Kırmızı çekirdek, Python genişletilmesi.
- 吞吐提升:NVIDIA 报告称, GB200 NVL72 + Dynamo 上,DeepSeek-R1 MoE 在中等延迟区间达到6x(developer.nvidia.com,2025-06);社区关于全布莱克韦尔 + 迪纳莫 + 딥塞克-R1 多达30x 的报告缺少单一主要来源,应视为方向性信息──
- GB300 NVL72 + Dynamo: According to Dynamo 产品页面(developer.nvidia.com,未注明期),相比霍珀,MoE 吞吐最高可可达50x──

**llm-d**(Red Hat + AWS,Kubernetes-native):
- Ön doldurma / çözme / yönlendiricisi 作为独立 Kubernetes Services。
- Rol başına HPA 使用 queue depth (önlenme) / KV kullanımı (decode) signal。
- `topologyConstraint packDomain: rack`Bu yüzden, yüksek genişlikli KV transferini gerçekleştirmek için, ön doldurma + çözme tıklamalarını  aynı raf üzerinde yerleştirmek.
- İllm-d 0.5(2026):hierarşik KV boşaltma, önbelleğe hazır LoRA yönlendirme, UCCL ağları, ölçek-sıfırlılık

Eğer üst kat orkeströr yönetmek istiyorsan Dynamo kullan. Eğer Kubernetes yerli ilkeler istiyorsan ve CNCF 生态'a girmişsen llm-d kullan.

### 经济性

内部 composite (tek bir durum çalışması değil, sadece sayısal bir sınıf olarak yayımlanmıştır):

- Toplu hizmetlerin önerilen harcamaları yılda 2 milyon dolardır.
- 切换到使用 Dynamo'nun ayrıntılı servisleri。
- Aynı istek miktarı, aynı P99 gecikme SLA
- Rapor:$600K–$800K/year (%30~40) %
- Yeni bir parça yok.

Bu rakamı, tek bir alıntı yapılabilir vaka çalışmasından değil, çok sayıda müşteri açıklamasından elde ediyoruz; en yakın yayınlanan veriler Baseten'in Dynamo KV yönlendirme'sidir. 2 kat daha hızlı TTFT / 61% daha yüksek üretimi getirir.

### Ne zaman ayrıştırma

- İletişimler < 512 token 且输出 < 200 token:传输税主导收益。
- 小型集群 ((< 4 GPU): yeterli havuz çeşitliliği yok。
- 团队无法运维两个GPU池并进行每个角色规模化:Dynamo 会有帮助,但并非无复杂性.
- 没有 RDMA fabric:TCP transfer tax 更重──

### Router ve 17 · 11 aşama 集成

Ayrıntılı yönlendirmeler KV-cache-awaredır(Fase 17 · 11);; ವಿನ ವಿನ会落到持有其 tiềnसर्ग的解码池上; eğer uyumsuzsa,就走预填 → dekode。 Hit rate 与分类 会叠加收益, cache-aware yönlendirmeler yeni ön doldurma yapılması gerektiğini hatta gerekli olup olmadığını belirler。

### Blackwell'in MoE'si gerçek bir dijital yer.

GB300 NVL72 + Dynamo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

### Hatırlamalı olduğun bir sayı var.

Benchmark sayı değişimi,NVIDIA 和 sonuç kümesi Her ay her gün yeni sonuçlar yayınlanır.

- GB200 NVL72 + Dynamo 上的 DeepSeek-R1: 中等延迟区间相相相比基线 约 ~6x 吞吐(developer.nvidia.com,2025-06);社区关于全布莱克韦尔 + 迪纳莫堆高达30x的说法是方向性聚合,没有单一的首要来源──
- GB300 NVL72 + Dynamo:相比ホッパー,MOE 吞吐最高可达50x(developer.nvidia.com,未注明期)
- 节省点(内部复合,不是单个案例研究):在 SLA 不变时,从 $2M 年度支出中节省 $600-800K/ yıl.
- Ayrımlık eşiği:Konuşmalar > 512 token + çıkışlar > 200 token。
- NIXL'in KV transfer:70B FP8'e 4K-sürekli KV'ye 20 ila 80 ms gerektirir.


```figure
prefill-decode-split
```

## Kullan

`code/main.py`模拟 colocated vs disaggregated serving── sorguya göre maliyet raporları, yanı sıra kısa sürede yapılacak bir geçiş.

## - Söyle.

本课会产 出 `outputs/skill-disaggregation-decider.md`❖ Gösterilen iş yükü ve klüster, bölünmeli olup olmadığını belirlemek.

## 练习

1. 运行  İşlem`code/main.py`- Ne zaman ayrıştırılır?
2. P99 önbölü uzunluğu için 8K 輸出 için 300 RAG hizmetleri için  tasarım ön doldurma havuzu 和 dekodlama havuzu için
3. Dynamo vs llm-d:为一家纯Kubernetes shop 选择一个方案,且没有Python运行时间 偏好。
4. 計算 KV transfer cost:70B FP8 上 4K prefill = ~500 MB KV──在 RDMA 100 GB/s 下, transfer = 5 ms──在 TCP 10 GB/s 下 = 50 ms── Hangi SLA'yı etkileyecek?
5. MoE uzman yönlendirme KV erişim biçimlerini değiştirir.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Disaggregated serving | “split prefill/decode” | 为每个阶段使用独立 GPU pools |
| NIXL | “NVIDIA transport” | Dynamo 的 inter-node KV transfer（RDMA/TCP） |
| NVIDIA Dynamo | “the orchestrator” | vLLM/SGLang/TRT-LLM 的 stack-above coordinator |
| llm-d | “Kubernetes native” | Red Hat + AWS K8s disaggregated stack |
| Planner Profiler | “Dynamo auto-config” | 测量工作负载，配置 pool ratios |
| SLA Planner | “Dynamo policy” | 自动按速率匹配 prefill:decode 以满足 SLOs |
| `packDomain: rack` | “llm-d topology” | 将 prefill+decode 放在同一 rack 上以实现快速 KV |
| UCCL | “unified collective” | llm-d 0.5 用于 scale-to-zero 的 networking layer |
| MoE expert routing | “expert per token” | DeepSeek-V3 pattern；disaggregation 有帮助 |

## 延伸阅读

- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/)
- [TensorRT-LLM Disaggregated Serving blog](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog5_Disaggregated_Serving_in_TensorRT-LLM.html)
- [llm-d GitHub](https://github.com/llm-d/llm-d)
- [llm-d 0.5 release notes](https://github.com/llm-d/llm-d/releases)
