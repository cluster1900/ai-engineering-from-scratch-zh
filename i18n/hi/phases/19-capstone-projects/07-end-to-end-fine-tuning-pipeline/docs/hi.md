# Capstone 07  端到端 फाइन-ट्यूनिंग पाइपलाइन(डेटा एसएफटी तक डीपीओ तक सेवा)

> एक 8 बी श्रेणी का मॉडल जो आपके स्वयं के डेटा प्रशिक्षण पर आधारित है, जो आपकी अपनी पसंद के आधार पर डीपीओ को पूरा करने, क्वांटिज़ेशन को पूरा करने, अनुमानात्मक डिकोडिंग को पूरा करने, और $ 1M टोकनों के लिए एक मापने योग्य मूल्य के साथ उपलब्ध है। 2026 के लिए खुला स्टैक Axolotl v0.8 है।

**Type:** Capstone
**Languages:** Python (pipeline), YAML (configs), Bash (scripts)
**先修要求：**चरण 2 (एमएल), चरण 3 (डीएल), चरण 7 (ट्रांसफॉर्मर), चरण 10 (एलएलएम स्क्रैच से), चरण 11 (एलएलएम इंजीनियरिंग), चरण 17 (इन्फ्रास्ट्रक्चर), चरण 18 (सुरक्षा)
**Phases exercised:**P2 · P3 · P7 · P10 · P11 · P17 · P18
**Time:** 35 小时

## 问题
2026 में, प्रत्येक सख्त एआई टीम किसी भी समय एक ठीक-ठीक पाइपलाइन तैयार करेगी। यह इसलिए नहीं है क्योंकि वे सीमा आधार मॉडल जारी करना चाहते हैं, बल्कि इसलिए है कि डाउन游适配, यानि डोमेन एसएफटी, लक्षित-मार्क अनुकूल डीपीओ, अटकलबाजी के लिए डीपीओ का उपयोग करने के लिए डिस्टिल किए गए मसौदे, तथा ईएजीएल -3 की सेवा का उपयोग करना, केवल तभी है जहां वास्तविक लाभ का माप किया जा सकता है।

आप एक 8B से 14B के आधार को डालेंगे ((Llama 3.1 8B、Qwen3 14B या Gemma 3 12B) कार्य-विशिष्ट डेटा में ऊपर से SFT और DPO को पूरा करने के लिए, फिर से क्वांटिज़ेशन करने के लिए, और lm-मूल्यांकन-हर्नेस, रिवार्डबेंच-2、MT-बेंच-v2 और MMLU-Pro का उपयोग करके स्तर उन्नयन को मापेंगे।

## 概念
इस पाइपलाइन में पांच चरण हैं।**Data**:dedup(MinHash / Datatrove) ∙गुणवत्ता फ़िल्टर(Nemotron-CC 风格 वर्गीकरणकर्ता) PII स्क्रब、 सार्वजनिक बेंचमार्क प्रदूषण के लिए स्प्लिट-हाइजीन जांच―**SFT**:Axolotl YAML、8xH100 上的ZERO-3、कोसिन शेड्यूल、पैक अनुक्रम、2-3 युगों。**DPO or GRPO**:TRL कॉन्फ़िग ∞1 युग ∞ प्राथमिकता जोड़े कृत्रिम लेबल या मॉडल-आधारित ∞beta ट्यूनिंग से आ सकते हैं**Quantize**:GPTQ + AWQ + GGUF,保证 तैनाती लचीलापन──**Serve**:vLLM 0.7 + EAGLE-3 अनुमानित प्रमुखों(या SGLang + SpecForge) 、K8s तैनाती、 लाइन-उत्तरा के आधार पर HPA──

Ablations are交付物:在三个任务-विशेष बेंचमार्क上比较 SFT-केवल、SFT+DPO、SFT+GRPO。सेविंग मेट्रिक्स:बच 1 / 8 / 32 下的 टोकन/s、EAGLE-3 स्वीकृति दर、$/1M टोकन。सुरक्षा मूल्यांकन:Llama Guard 4 पास दर──मोडेल कार्डःपक्षपात मूल्यांकन、पुनर्जनशीलता बीज、डेटा लाइसेंसिंग──

## 架构
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
- डेटाः डेटाट्रोव के लिए उपयोग किया जाता है dedup, नेमोट्रॉन-सीसी वर्गीकरण के लिए उपयोग किया जाता है गुणवत्ता, प्रेसिडियो के लिए उपयोग किया जाता है PII
- आधारः लामा 3.1 8बी、क्वीन3 14बी या जेम्मा 3 12बी
- एसएफटीः एक्सोलोटल v0.8, ZeRO-3 के साथ संयोजन
- प्राथमिकता ट्यूनिंगः TRL 0.15 DPO या GRPO के लिए उपयोग किया जाता है; Unsloth एकल-GPU पुनरावृत्ति के लिए उपयोग किया जाता है
- मात्रा: GPTQ (मार्लिन) 、AWQ、 llama.cpp के माध्यम से 生成 GGUF
- सेवाःvLLM 0.7 + EAGLE-3 अनुमानात्मक डिकोडिंग(या SGLang 0.4 + SpecForge)
- Eval: lm-मूल्यांकन-उपयोग ✓ रिवार्डबेंच-2 ✓ एमटी-बेंच-v2 ✓ एमएमएलयू-प्रो
- सुरक्षा मूल्यांकनः लामा गार्ड 4 ∙ShieldGemma-2
- बुनियादी ढांचाः Kubernetes + NVIDIA डिवाइस प्लगइन, लाइन-उत्तराई मीट्रिक के आधार पर HPA
- अवलोकनशीलता: W&B प्रशिक्षण के लिए, Langfuse निष्कर्ष के लिए उपयोग किया जाता है


```figure
ce-finetune-stages
```

##  इसे निर्माण
1. **Data pipeline.**में कच्चे शरीर 上运行 डेटाट्रॉव डिडप. . .

2. **Contamination check.**प्रत्येक सत्यापन विभाजन के लिए, MMLU-Pro、MT-Bench-v2、RewardBench-2 परीक्षण सेट के MinHash── के साथ गणना करना किसी भी ओवरलैप को अस्वीकार करना।

3. **Axolotl SFT.**यैमल में ज़ेरो-3、एफए3、क्रम पैकिंग शामिल है। 8xH100 का उपयोग करते हुए 2-3 युगों का प्रशिक्षण करते हुए।

4. **TRL DPO / GRPO.**取 SFT चेकपॉइंट, में प्राथमिकता जोड़े 上运行一个时代的 DPO(或在数学/代码上使用可验证奖励的 GRPO) ⋅扫描beta──

5. **Quantize.**生成三种量子:GPTQ-INT4-Marlin、AWQ-INT4、面向 llama.cpp के GGUF-Q4_K_M── रिकॉर्ड आकार 和 नाममात्र आउटपुट──

6. **Serve with speculative decoding.**vLLM 0.7 कॉन्फ़िग, Red Hat Speculators के माध्यम से उपयोग  प्रशिक्षण के EAGLE-3 ड्राफ्ट हेडों ∙ माप बैच 1 / 8 / 32 ∙ स्वीकृति दर 和 पूंछ लटेंसी ∙ रिपोर्ट विथ एंथ्रोपिक / ओपनएआई ∙ उसी मूल्यांकन ∙ $/1M टोकन ∙

7. **Eval matrix.**में आधार、SFT-केवल、SFT+DPO、SFT+GRPO 上运行 lm-eval-harness、RewardBench-2、MT-Bench-v2、MMLU-Pro──产出一张表──

8. **Safety eval.**में डेव सेट 上统计 लामा गार्ड 4 पास दर── उपयोग ShieldGemma-2 आउटपुट फ़िल्टर──

9. **Model card.**MOF 2026 टेम्पलेटःdata、training、evall、safety、license, तथा शामिल है YAML तथा commit SHAs का reproducibility section

## इसका उपयोग करें
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

## 交付 यह
`outputs/skill-finetuning-pipeline.md` विवरण वितरण वस्तुओं ∙ एक आदेश डेटा को SFT से DPO तक मात्रा तक सेवा करने के लिए ∙ पूरा मूल्यांकन के प्रक्रिया, और मॉडल कार्ड + 已服务的终点 ∙

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Eval delta vs base | 在目标任务上的 measured gain（MMLU-Pro、MT-Bench-v2、task-specific） |
| 20 | Pipeline reproducibility | 一个命令用相同 seeds 端到端重跑 |
| 20 | Data hygiene | Dedup rate、PII scrub coverage、contamination check green |
| 20 | Serving efficiency | bs=1/8/32 下的 tokens/s、EAGLE-3 acceptance rate、$/1M tokens |
| 15 | Model card + safety eval | 2026 MOF completeness + Llama Guard 4 pass rate |
| **100** | | |

## अभ्यास
1. एक ही कार्य-विशिष्ट बेंचमार्क में ऊपर चल रहे SFT-केवल SFT+DPO、SFT+GRPO── रिपोर्ट किस प्रकार की प्राथमिकता विधि 胜出,以及领先多少──

2. Llama 3.1 8B को Qwen3 14B के साथ बदला जाएगा।

3. ️ डोमेन डेटा को सामान्य ShareGPT के साथ ️ EAGLE-3 स्वीकृति दर ️ रिपोर्ट अंतर मूल्य, तथा यह लटेंसी बजट के लिए क्या अर्थ रखता है ️

4. 1% प्रदूषण में प्रवेश करना ((把 MMLU-Pro उत्तर 泄漏 into training data)并重跑 eval──观察 MMLU-Pro सटीकता 不真地跃升──构建一个能捕获这个问题的污染检查CI门──

5. 添加LoRA SFT,作为全细调的替代方案──测量在内存 减少10x 时的质量差距──

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
- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) 参考 एसएफटी / डीपीओ प्रशिक्षक
- [TRL documentation](https://huggingface.co/docs/trl) डीपीओ एवं जीआरपीओ  संदर्भ प्राप्ति
- [Unsloth](https://github.com/unslothai/unsloth) एकल जीपीयू पुनरावृत्ति 参考
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) GRPO 方法
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) 参考 सेवा स्टैक
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge)  दूसर प्रकार का अनुमानित डिकोडिंग ट्रेनर
- [Model Openness Framework (arXiv:2403.13784)](https://arxiv.org/abs/2403.13784):खुले-खुले रिलीज 评分标准
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) कैनोनिक मूल्यांकन रनर
