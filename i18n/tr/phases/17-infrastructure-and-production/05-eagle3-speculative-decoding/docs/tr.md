# 生产环境中的 EAGLE-3 Speküel çözme

> Speküel dekodeleme, hızlı bir taslak modeli ile hedef modelle 配对──草案 提出 K 个 Token;target在一次前进 中验证;接受的 Token 是免费的──2026 yılına kadar, EAGLE-3 üretim sınıfı varyasyonudur, hedef modelin gizli durumlarında üstü üzerinde eğitimler kurar, orijinal token üzerinde eğitimler yerine, böylece genel sohbetlerde kabul oranını alfa 推至 0.6-0.8 区间── doğru soru draft 多快 değil,  Alpha 流量                                                                                                                                                                                                 

**类型：**Öğrenme
**语言：**Python(stdlib,玩具 kabul oranı simülatörü)
**先修要求：**17 · 04(vLLM Serving Internals),10 · 18
**时间：**60 dakika kadar .

## Öğrenme hedefi

- Tahmin edici çözme üç neslin gelişimi,并解释Eagle-3 相比Eagle-2 和经典草案模型 改变了什么──
- 定義接受率 alpha,根据 alpha 和 K(草案长度) hesaplama预期加速,并识别目标并发下 破平式 alpha。
- 解释为什么投机式解码在 vLLM 2026 中是选择式的 (非默认的) ),以及为什么不测量alpha 就启动它是生产反模式──
- 写出测量计划: hangi referans değerini kullanın, hangi hızlı dağılım, hangi eşleşme noktasını kullanın, hangi metrikleri kullanın.

## 问题

Dekode etmek hafıza bağlıdır. Bir bir çalışma süresi Llama 3.3 70B FP8'in H100'inde, her dekode edilmiş token 会读取约140 GB/s'in权重并输出一个 token──GPU hesaplama sırasında dekode 期间几乎空,瓶是HBM bant genişliği,而不是 matmul throughput──

Speküel dekodlama bu farkı kullanıyor. Ucuz bir taslak modeli kullanarak K 个候选 代号 (K 个候选 代号) üretir, sonra hedef modelini bir kez ileriye geçerek tüm K 个的验证中验证中验证中.

经典草案模型 方法使用同一家族的更小模型(Llama 3.2 1B 为 Llama 3.3 70B 起草案)  它能工作,但接受率 一般,因为更小模型的分布会偏离目标──EAGLE、EAGLE-2,再到EAGLE-3,直接在目标模型的内部状态上训练轻量草案头,因此草案的分布更紧跟目标──这就是为 Alpha 会的草案模型的0.4 升至EAGLE-3 的0.6-0.8──

关键限制:EAGLE-3 中中在 vLLM 2026 中中在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在的中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在在中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中中`speculative_config`                                                                                                                                                                                                                                                              

## 概念

### Tahmin edici çözme  Gerçekte getiren ne

没有规范解码时,每个代币的成本是一次目标前进――使用草案长 K 和接受 alpha 的规范解码时,每次目标前进的预期代币数是 时,每个代币的预期代码数是 时,每个代币的成本是一个目标前进的成本.`1 + K * alpha`◊ hızlanmaktan ◊`(1 + K * alpha) / (1 + epsilon)`, epsilon ise taslak ve doğrulama üst ücreti. K=5 için alfa=0.7:`(1 + 5*0.7) / (1 + 0.1) = 4.5 / 1.1 = 4.1x`◊ Gerçek dünya rakamları genellikle 2-3x'e yoğunlaşır, çünkü üretim hacminin alfa ı çok az ve epsilon ı yüksek seri boyutlarında aşağı büyür.

### Alfa neden tek önemli metriktir ?

Yabancı Token yok olmaz, onlar ilk Yabancı Token için ikinci hedef ileri sürmek zorunlu olacaktır. Alfa  düşen 0.4 iş yükü üzerinde, taslak overhead ödemek gerekir, verifikasyon, ve yeniden yuvarlamak.

Alpha 会随着工作负荷变化──在 ShareGPT 风格的通用聊天天, ShareGPT 训练的EAGLE-3 能达到0.6-0.8──在域特异流量中,通用数据训练的草案头会降至0.4-0.6──训练域特异草案头可以恢复 alfa;目标细节调整相比,这是一个轻量、快速的训练任务──

### KİÇİN 代际一览

- **经典 draft model**Aynı aile küçük modeli, Alfa 0.3-0.5,... Altyapı basit, yükle iki modeli, taslak Her hedef ileri 运行 K 次 前へ。
- **EAGLE-1（2024）**: hedef gizli durumlarda (en son kat) üzerinde eğitim tek tek proje başı──Alfa ≈ 0.5-0.6── hedef ≈ üzerinde az miktarda parametreler vardır──
- **EAGLE-2（2025）**:adaptatif taslak uzunluğu 和 ağaç tabanlı taslaklar(在一次目标通过 中验证多个分支) ・Alpha 约 0.6-0.7──taslak planlayıcı 更复杂──
- **EAGLE-3（2025-2026）**:Draf kafa, çok sayıda hedef katmanlı üzerinde eğitim ((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((

### 2026 生产配方

1. Önceden, normal bir şekilde, hedef model.
2. VLLM ' den geçiyor .`speculative_config`ATAGLE-3 taslakını başlatmak.
3. 记录 kabul oranı alfa──vLLM V1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `spec_decode_metrics.accepted_tokens_per_request`❖ Aradığınız taslak uzunluğundan başka alfa elde edilebilir.
4. Eğer üretim akım dağılımı 上 alfa < 0.55, yasaklama spesifik dekode, veya eğitim alan özel EAGLE-3 taslak
5. Yapım ve yeniden çalıştırma. P99 ITL'nin değişmediğini doğrula.

### 生产陷:P99 kuyruğu

Spec dekode edeceğim, ITL'yi düşürürüm. Eğer düzenleme yapılmazsa, P99 değişebilir.

### Eagle-3 nerede yerleştirildi?

Google 2025 yılında AI Özetleri arasında spekülatör kodlama yerleştirdi.`speculative_config`V1'de N-gram GPU spekülasyonu çözme, 兼容 parçalanmış prefill'in değişimidir.

### Birlik birliği

预期加速:`S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`❖ 令`S = 1`Çözülebilir alfa:`alpha_breakeven = verify_overhead / K`❖ Tipik verify_overhead için yaklaşık 0.15 ve K=5:`alpha_breakeven = 0.03`▽ ama bu orijinal dekode sayısı. ▽在高并发下,verify overhead 会上升,而 dekode batch 已在多序列之间摊销记忆读数,因此实践中的有效 alpha_breakeven 会爬升到约0.45-0.55。

### 什么时候不要使用投机解码

- Batch-1 离线生成,且延迟不重要──使用普通目标──
- 输出很短(低于50 Token) ――Trafı genel maliyetleri 和 kontrol maliyeti 占主导。
- 没有领域训练有素的草稿负责人 的专业领域──Alpha 太低──
- vLLM v0.18.0 加 taslak model özellikleri çözme 加 `--enable-chunked-prefill`◊ Bu kompülasyon yapılamaz. Dokümanlaştırma istisnaları V1'de N-gram GPU spesifik kodlamasıdır.


```figure
mx-speculative-tree
```

## Kullan

`code/main.py`Bir dizi alfa değer ve taslak uzunluğu K 上模拟有无投机解码的解码循环――它会打印破等式 alfa、测得的速度和尾行行为──在多个 (alpha, K)组合上运行它,准确观察投机解码 在哪里不再划算──

## - Söyle.

本课产 出 `outputs/skill-eagle3-rollout.md` Görevi model  Trafik dağılım  Açıklama ve eşzamanlılık hedefi, EAGLE-3 dağıtım planını oluşturur:

## 练习

1. 运行  İşlem`code/main.py`K=5'te 2x hızlanmak için ne gerekiyor?
2. 假设生产流量由70%通用聊天、30%代码 组成──通用聊天在使用ShareGPT 训练的EAGLE-3 上达到alfa 0.7;代码 达到alfa 0.4──混合alfa 是多少?
3. 阅读 vLLM `speculative_config`文档──说出三种模式(öntemli model、EAGLE、N-gram),以及哪一种兼容 碎片 prefill──
4. ATAGLE-3'yi etkinleştirmek                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
5. 計算 Llama 3.3 70B'nin EAGLE-3 taslak baş hafıza maliyeti.

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Speculative decoding | “draft plus verify” | 用便宜模型提出 K 个 Token，在一次 target forward 中验证全部 K 个 |
| Acceptance rate alpha | “spec accept rate” | draft Token 被 target 接受的比例；唯一重要的 metric |
| Draft length K | “spec k” | 每次 target forward 中 draft 提出的 Token 数；典型值 4-8 |
| Verify overhead epsilon | “spec overhead” | verify-and-reroll 相比普通 target forward 的额外成本；随 batch 增长 |
| EAGLE-3 | “latest EAGLE” | 2025-2026 变体；在多个 target layers 上训练 draft head；通用聊天上 alpha 0.6-0.8 |
| `speculative_config` | “vLLM spec config” | vLLM V1 中显式 opt-in；没有默认值就没有加速 |
| N-gram spec decode | “N-gram draft” | 使用 prompt 中 N-gram lookups 的 GPU-side draft；兼容 chunked-prefill |
| Break-even alpha | “no-op alpha” | spec decode 提供零加速时的 alpha；在生产并发下关注它 |
| Rejected-draft two-pass | “reroll cost” | drafts 被拒绝时发生两次 target forward；推高 P99 tail |

## 延伸阅读

- [vLLM — Speculative Decoding docs](https://docs.vllm.ai/en/latest/features/spec_decode/) `speculative_config`V1 İçinde parçalanmış prefill 兼容性权威来源──
- [vLLM Speculative Config API](https://docs.vllm.ai/en/latest/api/vllm/config/speculative/) 精确字段集合──
- [EAGLE paper (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) 原始 Eagle Draft-head 表述──
- [EAGLE-2 paper (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) adaptatif taslaklar 和 ağaçlar。
- [UC Berkeley EECS-2025-224](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2025/EECS-2025-224.html) Spekülatör çözme kullanın 
- [BentoML — Speculative Decoding](https://bentoml.com/llm/inference-optimization/speculative-decoding) 生产 rollout kontrol listesi
