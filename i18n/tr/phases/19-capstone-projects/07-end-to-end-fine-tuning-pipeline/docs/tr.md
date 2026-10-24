# Capstone 07  端到端 Fine-Tuning Pipeline ((Data to SFT to DPO to Serve)

> Kendi verilerinize dayalı 8B modeli, kendi tercihlerinize dayalı DPO'yu tamamlamak, kuantitasyonunu tamamlamak, spekülasyonsal çözümü oluşturmak, ölçülebilir $/1M jetonları oluşturmak. 2026 yılının açık yığınında Axolotl v0.8、TRL 0.15、 kullanılacak olan Unsloth'in  generasyonuna GPTQ/AWQ/GGUF'yi kullanmak, ve hizmet veren vLLM 0.7 + EAGLE-3'ye.

**Type:** Capstone
**Languages:** Python (pipeline), YAML (configs), Bash (scripts)
**先修要求：**2. aşama (ML), 3. aşama (DL), 7. aşama (Transformer), 10. aşama (Çoktan LLM), 11. aşama (LLM mühendisliği), 17. aşama (İnfrastruktur), 18. aşama (güvenlik)
**Phases exercised:**P2 · P3 · P7 · P10 · P11 · P17 · P18
**Time:** 35 小时

## 问题
2026 yılında, her ciddi AI ekibi her zaman iyi ayarlama bir boru hattı hazırlayacak. Sınır baz modeli yayınlaması için değil, aşağıdaki ayarlama için, yani domain SFT'ler için, etiketlenmiş tercih edilen DPO'lar için, spekülasyonsal dekodeleme için distil edilmiş taslaklar için, ayrıca EAGLE-3 servisini kullanmak için, sadece gerçek olarak ortaya çıkan kazançları ölçülebilecek yerlerdir.

Siz bir 8B tabanı yerleştireceksiniz(Llama 3.3、Qwen3 veya Gemma 3) Görev-özel verilerde 上依次完成 SFT 和 DPO, sonra ise kvantizasyon yapmak,并使用 lm-evaluation-harness、RewardBench-2、MT-Bench-v2 和 MMLU-Pro 衡量升升级──

## 概念
Bu boru hattının beş aşaması var.**Data**:dedup(MinHash / Datatrove) ✓ kalite filtre(Nemotron-CC 风格 sınıflandırıcısı) ✓PII scrub、 kamu standartı kirliliğinin bölünmüş hijyen kontrolü¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬**SFT**Aksolat YAML  8xH100 上的ZERO-3 柯西斯时间表 包装序列 2-3 epochs **DPO or GRPO**:TRL yapılandırması ∞1 epoch ∞ tercih çiftleri yapay etiketleme veya model değerlendirmesi ∞beta ayarlama ∞**Quantize**:GPTQ + AWQ + GGUF,保证 konuşma esnekliği。**Serve**:vLLM 0.7 + EAGLE-3 spekülasyon başları( veya SGLang + SpecForge) 、K8s dağıtım、 sırada bekleme temelinde HPA──

Ablations is交付物:在三个任务特定基准上比较 SFT-only、SFT+DPO、SFT+GRPO。Serve metrikleri:batch 1 / 8 / 32 下的代币/s、EAGLE-3 kabul oranı、$/1M token──Safety eval:Llama Guard 4 geçiş oranı──Model kart:bias evaluations、reproducibility seeds、data licensing──

## Yapılandırma
```
raw data (HF datasets + internal)
    |
    v
Datatrove dedup + Nemotron-CC quality filter + PII scrub
    |
    v
split hygiene (MMLU-Pro contamination check)
    |
    v
Axolotl SFT config (YAML)  ---> 8xH100, ZeRO-3
    |
    v
TRL DPO / GRPO config       ---> 4xH100, 1 epoch
    |
    v
GPTQ + AWQ + GGUF quantize
    |
    v
vLLM 0.7 + EAGLE-3 speculative decoding
    |
    v
K8s deployment, HPA on queue-wait
    |
    v
lm-eval-harness + RewardBench-2 + MT-Bench-v2 + MMLU-Pro
    |
    v
model card (2026 MOF) + safety eval (Llama Guard 4)
```

## 技术
- Veriler: Detatrove dedup için, Nemotron-CC sınıflandırıcısı kalite için, Presidio PII için
- Üssü: Llama 3.3 8B、Qwen3 14B veya Gemma 3 12B
- SFT: Axolotl v0.8, ZeRO-3 ✓ Flash Attention 3 ✓ Paketlenmiş diziler
- Tercihleri ayarlama: TRL 0.15 DPO veya GRPO için kullanılır; Unsloth tek GPU iterasyon için kullanılır
- Kvantizasyon: GPTQ (Marlin) 、AWQ、 llama.cpp üzerinden 生成 GGUF
- Servis: vLLM 0.7 + EAGLE-3 spekülatör çözme
- Eval: lm-evaluation-harness  RewardBench-2  MT-Bench-v2  MMLU-Pro
- Güvenlik değerlendirme: Llama Guard 4 ∙ ShieldGemma-2
- Altyapı: Kubernetes + NVIDIA cihaz eklentisi, kuyruk bekleme metriklerine dayalı HPA
- Gözlem: W&B eğitim için, Langfuse sonuç için.


```figure
ce-finetune-stages
```

## Yapın onu.
1. **Data pipeline.**Bu nedenle, bu durumun bir diğer nedeni de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de, bir diğerinin de diğerinin de, bir diğerinin de diğerinin de, bir diğerinin de diğerinin de, bir diğerinin de diğerinin de diğerinin de, bir diğerinin de diğerinin de de diğerinin de de, bir diğerinin de diğerinin de diğerinin de de de diğerinin de de de diğerlerinin de de de diğerlerinin de de de diğerlerinin de de de diğerlerinin de de de de diğerlerinin de de diğerlerinin de de de de de diğerlerinin de de de diğerlerinin de de de de de de diğerlerinin de diğerlerinin de de de de de diğerlerinin de de de diğerlerinin de de de de de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de diğer de de de diğer de de de de diğer de diğer de de diğer de de diğer de de de de de diğer de diğer de de diğer de diğer de de de de diğer de diğer de de de de de de diğer de de diğer de de diğer de de diğer de de de de de de de diğer de de de de diğer de de de de de de de de de diğer de de diğer de de de de de diğer de de de de de diğer de de de de de de diğer de de de de de de de de de de de de diğer de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de de

2. **Contamination check.**Her bir doğrulama bölümü için, MMLU-Pro、MT-Bench-v2、RewardBench-2 test setleri ile hesaplanarak MinHash¬ı herhangi bir üst-üstü bırakmak¬¬ı reddedilir.

3. **Axolotl SFT.**YAML'de ZeRO-3、FA3、seksensel paketleme var.

4. **TRL DPO / GRPO.**取 SFT kontrol noktası, preference pairs 上运行一个时代的DPO(或在数学/代码上使用可验证奖励的GRPO) 』扫描beta。

5. **Quantize.**生成三种量子:GPTQ-INT4-Marlin、AWQ-INT4、面向 llama.cpp'in GGUF-Q4_K_M── kayıt boyutu 和 nominal throughput──

6. **Serve with speculative decoding.**vLLM 0.7 yapılandırması, Red Hat Spekülatörleri tarafından kullanılarak  eğitilen EAGLE-3 taslak başları。 ölçüm parti 1 / 8 / 32 │ kabul oranı 和 kuyruk gecikmesi。 rapor ile Anthropic / OpenAI ≠ aynı değerlendirme │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │

7. **Eval matrix.**SFT+DPO、SFT+GRPO 上运行 lm-eval-harness、RewardBench-2、MT-Bench-v2、MMLU-Pro──产出一张表──

8. **Safety eval.**Dev setinde, Llama Guard 4 geçiş oranı kullanılıyor. ShieldGemma-2 çıkış filtresi kullanılıyor.

9. **Model card.**MOF 2026 şablonu: veri, eğitim, evlilik, güvenlik, lisans ve YAML ve komisyon SHAs'ın yeniden üretilebilirlik bölümünü içerir.

## Kullan
```
$ ./pipeline.sh config/llama3.3-8b-domainX.yaml
[data]    300k deduped, 12k filtered, 280k accepted (seed=7)
[SFT]     3 epochs, 8xH100, 6h12m, val loss 1.42 -> 1.03
[DPO]     1 epoch, beta=0.08, 4xH100, 1h40m
[quant]   GPTQ-INT4 4.6 GB, AWQ-INT4 4.8 GB, GGUF-Q4_K_M 5.1 GB
[serve]   vLLM 0.7, EAGLE-3 acceptance 0.74, p99 126ms @ bs=8
[eval]    MMLU-Pro +3.2, MT-Bench-v2 +0.41, RewardBench-2 +0.08
[card]    model-card.md generated under 2026 MOF
```

## - Söyle.
`outputs/skill-finetuning-pipeline.md`描述交付物──一个命令完成数据到 SFT到 DPO到 quant 到 serve到 eval 的全流程,并输出模型卡 + 已服务的终点──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Eval delta vs base | 在目标任务上的 measured gain（MMLU-Pro、MT-Bench-v2、task-specific） |
| 20 | Pipeline reproducibility | 一个命令用相同 seeds 端到端重跑 |
| 20 | Data hygiene | Dedup rate、PII scrub coverage、contamination check green |
| 20 | Serving efficiency | bs=1/8/32 下的 tokens/s、EAGLE-3 acceptance rate、$/1M tokens |
| 15 | Model card + safety eval | 2026 MOF completeness + Llama Guard 4 pass rate |
| **100** | | |

## 练习
1. Aynı görev-özel bir referans değerinde, SFT+DPO、SFT+GRPO¬ olarak kullanılır.

2. Llama 3.3 8B'yi Qwen3 14B'ye değiştirmek için kullanılır.

3. 测量域数据与通用ShareGPT 上的EAGLE-3 kabul oranı──报告差值,以及它对延迟预算意味着什么──

4. %1 kirliliği içine giriyorum. Bu sorunun çözülebileceği bir kirliliği kontrol eden bir kapı oluşturun.

5. 添加 LoRA SFT,作为全细调的替代方案──测量在内存 降低10x 时的质量差──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Axolotl | "SFT trainer" | 由 YAML 驱动的统一 trainer，用于 SFT、DPO 和 distillation |
| TRL | "Preference tuner" | Hugging Face library，用于 LLMs 上的 DPO、GRPO、PPO |
| GRPO | "Group-relative policy optimization" | DeepSeek R1 的 RL recipe，使用可验证 rewards |
| EAGLE-3 | "Speculative decoding draft" | 可提前预测 N 个 tokens 的 draft heads；vLLM 使用 target model 验证 |
| MOF | "Model Openness Framework" | 2026 年用于按 data、code、license 对 model releases 评分的标准 |
| Contamination check | "Split hygiene" | 基于 MinHash 检测 test-set 泄漏进 training |
| Acceptance rate | "EAGLE / MTP metric" | target model 接受 drafted tokens 的比例 |

## 延伸阅读
- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) 参考 SFT / DPO eğitmeni
- [TRL documentation](https://huggingface.co/docs/trl) DPO ve GRPO 参考实现
- [Unsloth](https://github.com/unslothai/unsloth) Tek GPU iterasyonu 参考
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) GRPO 方法
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) 参考 Hizmet toplu
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge)  başka bir tür spekülasyonsal dekodlama eğitmeni
- [Model Openness Framework 2026](https://isocpp.org/) açık yayın 评分标准
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) kanonik değerlendirme koşucusu
