# Kubernetes 上的 GPU Otoscaling  Karpenter, KAI Scheduler, Gang Scheduling

> Yapılan çalışmaların bir kısmı olarak, bir GPU'nun eksikliği nedeniyle 7'den 8'in bölümü dağıtım tuzağından kaçınabilir.`DCGM_FI_DEV_GPU_UTIL`Bu yüzden hafıza asla 触発しない スケールダウンします 本课会教你组合这三层,并避开默认的Karpenter`WhenEmptyOrUnderutilized`策略, çünkü düşünme sürecinde çalışmakta olan GPU işini bitirecektir.

**Type:** Learn
**Languages:** Python (stdlib, toy queue-depth autoscaler simulator)
**前置要求：**17 · 02 aşaması (Inference Platform Economics), 17 · 04 aşaması (vLLM Serving Internals)
**Time:** ~75 minutes

## Öğrenme hedefi
- 画出三层自动扩展 架构 节点供给、帮安排、应用层),并说出每层使用的工具──
- Nedenini açıkla .`DCGM_FI_DEV_GPU_UTIL`HPA sinyalini yanlış kullanmak için iki alternatif sinyal belirtilir.
- 描述团队规划以及 KAI Scheduler 防止的部分分配失败模式(8 个GPU 中有7 个空等待) ⋅
- Görüşmek için GPU'yu çalıştırmak için Karpenter'ın birleştirilmesi 策略(`WhenEmptyOrUnderutilized`), 2026 yılındaki güvenlik alternatif programını açıkladı.

## 问题
Senin takım Kubernetes'te bir LLM servisi yayınladı.`DCGM_FI_DEV_GPU_UTIL`作为信号――业务时间内服务一直卡在100%利用率――HPA 从不扩大 它已经认为你满载了――你手动增加一副本;TTFT 降落来了――HPA 仍然不扩容――这个信号在骗你――

Ayrıca, Cluster Autoscaler'ı kullanıyorsun 管理节点──凌晨2点来一个M-Token提示; cluster花了3分供给节点,请求超时──

Ayrıca, 8 GPU'nın 70B modelini kullanarak 2 noktayı geçmek zorunda olduğunu bir GPU'yu dağıtmak için 7 boş GPU' var. Bir GPU'yu 3 noktaya dağıtmak için daha 1 GPU'yu dağıtmak gerekiyor.

Üç kat, üç farklı başarısızlık modeli. 2026 yılının GPU-açık otomobil ölçeklemesi HPA ︎-ı açmak için değil.

## 概念
### Katman 1  节点供给 (Karpenter)

Karpenter  Gözlem bekleyen kapsüller, ve yaklaşık 45-60 saniye içinde tedarik noktası  Cluster Autoscaler  GPU 节点 genellikle 90-120 saniye gerekir) `NodePool`约束动态选择实例类型  Eğer pod 需要8个 H100,而集群中没有匹配节点,Karpenter 会直接供应一个节点,而不是扩展某个现有组──

**consolidation 陷阱**Karpenter 默认的`consolidationPolicy: WhenEmptyOrUnderutilized`GPU havuzu için  çok tehlikeli  Bu, çalışmakta olan GPU 节imlerini durdurur, pod'u daha ucuz ve daha uygun boyutlu bir örneklere taşır.  İhtiyaçlı iş yükü için, bu çalışmakta olan istekleri sürükleyip yeni bir noktaya 70B modeli yeniden yüklemeyi gerektirir.

GPU havuzunun güvenlik ayarları:

```yaml
disruption:
  consolidationPolicy: WhenEmpty
  consolidateAfter: 1h
```

Karpenter'ın bir saat sonra birleştirilmesine izin verildi. Ama işimden uzaklaştı.

### Katman 2  çete programlaması(KAI Programlayıcı)

KAI Scheduler(项目原名 "Karp",后改名)处理默认 kube-scheduler 不处理的事情:

**Gang scheduling** Tam veya Tam Yer Düzenleme.  8 GPU dağıtımlı sonuçlama podu gerekir, ya da 8 birlikte başlatılır, ya da bir tek başlatılmaz.  Yoksa, bölük dağıtım tuzağına düşersiniz.  8 pod içinde 7 adet, sınırsız süre bekliyor ve yakılıyor.

**拓扑感知** 知道哪些GPU共享 NVLink、哪些位于同一架、哪些之间有InfiniBand──并据此放置 pod──DeepSeek-V3 67B tensor-parallel workload 必须留在一个NVLink域内;KAI Scheduler将遵守这一点──

**分层队列** Çok sayıda ekip öncelikli ve kvota  rekabet ile bir GPU havuzu  A Takımı'nın üretim acil ihtiyacı sadece öncelikli  kuralların izin verdiği zaman, B Takımı'nın eğitim işi 抢占 

KAI 作为二级调节器与 kube-调节器 一起部署;你通过注释 让工作负载 使用它──Ray 和 vLLM üretim-stack 都有集成──

### Katman 3  应用层信号

**HPA 陷阱**- ...`DCGM_FI_DEV_GPU_UTIL`Bu, GPU'nun her bir çalışma aralığında çalışıp çalışmadığını ölçmektedir. %100 kullanım oranı 10 并发请求,也可能是 100 个 anlamına gelir.

Daha da kötüsü, VLLM ve benzer motorlar KV önbelleği hafızasını önceden dağıtır.`--gpu-memory-utilization`)── bir istek bile olsa, hafıza kullanımı da %90'a yakın kalır──── hafıza tabanlı HPA asla ölçeklenmez────────

**2026 年替代信号**- ...

- 队列深度(Prepareful of requests number)。
- KV cache kullanımı oranı( aktif dizinin bloklarına dağıtılmaktadır örneğin)
- Her kopyasının P99 TTFT'sını işaretle.
- Goodput ((( her saniye tüm SLO'nun isteklerini karşılamak için)

NVIDIA Dynamo Planner 和 llm-d Workload Variant Autoscaler 会消费这些信号并扩缩复лика──它们将完全取代用于LLM sunucu HPA──

### Ne zaman ne kullanırsın ?

| Scale decision | Tool |
|----------------|------|
| 添加/移除节点 | Karpenter |
| 调度 multi-GPU job | KAI Scheduler |
| 添加/移除 replica | Dynamo Planner / llm-d WVA（或基于队列深度的自定义 HPA） |
| 选择 GPU type | Karpenter NodePool |
| 抢占 low-priority | KAI Scheduler queues |

### Ayrıntılı prefill/decode 会让一切更复杂

Eğer bir dizi prefill / decode çalıştırırsanız(Fase 17 · 17), iki tür pod vardır ve bunlar farklı ölçeklendirme tetikleyicisi vardır: prefill pod  sırada derinlik genişleme kapasitesine dayalı, decode pod  KV cache basıncı  genişleme kapasitesine dayalı.`Services`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

### Soğuk başlangıç burada da önemli .

Soğuk başlangıç azaltma (Fase 17 · 10) is a point supply time to become user visible delay place──Karpentrin 45-60 saniye ön sıcaklığı, 20GB model yükü, yeniden ek motor başlangıcı, yani sıfırdan 2-5 dakika gerektirir── SLO-kritik yolun                                                                                                                                                                                                                                                                                                                                                                                                                                                           `min_workers=1`), ya da Modal tarzındaki kontrol noktalarını uygulamada kullanmak.

### Hatırlamalı olduğun bir sayı var.

- Karpenter 节点供应: yaklaşık 45-60s, karşı karşıya Kluster Otoscaler 约 90-120s(GPU 节点)
- KAI Programcı 防止部分分配浪费  7/8 陷──
- `DCGM_FI_DEV_GPU_UTIL`作为 HPA 信号:坏掉的;队列深度或 KV利用率的使用队列深度或 KV利用率的使用队列深度或 KV利用率的使用队列深度或 KV利用率的使用队列深度或 KV利用率的使用率的使用队列深度或 KV利用率的使用率的使用队列深度或 KV利用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的使用率的
- Karpenter `WhenEmptyOrUnderutilized`Sonraki makale:`WhenEmpty + consolidateAfter: 1h`- Evet.


```figure
autoscaling
```

## Kullan
`code/main.py`Bu nedenle, bu programın en iyi yönü, bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir sürece bir sürece bir sürece bir sürece bir sürece bir bir bir bir sürece bir sürece bir bir bir sürece bir bir bir bir bir sürece bir sürece bir sürece bir sürece bir bir sürece bir sürece bir sürece

## - Söyle.
本课会生成 `outputs/skill-gpu-autoscaler-plan.md`❖ belirlenmiş kümeler topolojisi、iş yükü şekli 和 SLO, üç katlı otomobil ölçekleme 方案ı tasarlayacak.

## 练习
1. 运行  İşlem`code/main.py`❖ Şiddetli iş yükü altında, saf görev döngüsü HPA kaç sıra derinliği HPA'nın karşılaşabileceği istekleri kaybedecek?
2. H100 SXM5'in üst hizmetinde Llama 3.3 70B FP8'in kümesinin tasarımında Karpenter NodePool olarak belirtilmiştir.`capacity-type`- Evet.`disruption.consolidationPolicy`- Evet.`consolidateAfter`, ve bir GPU olmayan iş yükü  bu noktalarda düzenlenemez 
3. Senin takım rapor dağıtımı 卡在等待中, çünkü GPU kullanılabilir ama pod 调度──诊断一下 
4. Çıkarılmış prefill pod  seçin bir autoscaling  sinyal,并为 dekode pod 选择另一个不同信号──说明两者理由──
5. 计算 `WhenEmptyOrUnderutilized`Bir 24x7 üretim hizmetindeki maliyetin bir kuruluş tuzağı: Bu hizmet ortalama günde 60 kez talep düşüşe neden oluyor ve P99 TTFT > 10s

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Karpenter | "the node provisioner" | Kubernetes 节点 autoscaler；亚分钟级供给 |
| Cluster Autoscaler | "the old scaler" | Kubernetes 节点 autoscaler 的前身；更慢，基于 group |
| KAI Scheduler | "the GPU scheduler" | 用于 gang + topology + queues 的 secondary scheduler |
| Gang scheduling | "all or nothing" | 原子化调度 N 个 pod，或全部延后 |
| Topology awareness | "rack-aware" | 基于 NVLink/IB/rack placement 放置 pod |
| `DCGM_FI_DEV_GPU_UTIL` | "GPU utilization" | Duty-cycle metric；不是 LLM 的 scaling signal |
| Queue depth | "waiting requests" | 对 prefill-bound scaling 正确的 HPA 信号 |
| KV cache utilization | "memory pressure" | 对 decode-bound scaling 正确的 HPA 信号 |
| Consolidation | "Karpenter consolidation" | 终止节点以迁移到更便宜的 instance type |
| `WhenEmpty + 1h` | "safe consolidation" | 不驱逐正在运行 GPU job 的策略 |

## 延伸阅读
- [KAI Scheduler GitHub](https://github.com/kai-scheduler/KAI-Scheduler) 设计文档和配置例──
- [Karpenter Disruption Controls](https://karpenter.sh/docs/concepts/disruption/) konsolidasyon politikası 语义和 GPU-safe 默认值──
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) Dynamo Planner'ın ölçekleme sinyalleri。
- [Ray docs — KAI Scheduler for RayClusters](https://docs.ray.io/en/latest/cluster/kubernetes/k8s-ecosystem/kai-scheduler.html)Ray'in bir araya gelmesi.
- [AWS EKS Compute and Autoscaling Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/aiml-compute.html) yönetilen-Kubernetes-specifik rehberlik
- [llm-d GitHub](https://github.com/llm-d/llm-d) İş yükü Variant Autoscaler デザイン。
