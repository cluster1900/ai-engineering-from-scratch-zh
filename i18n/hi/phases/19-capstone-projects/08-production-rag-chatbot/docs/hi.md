# कैपस्टोन 08  面向受监管垂直领域 के उत्पादन RAG चैटबोट

> हार्वे、 ग्लेन、 मेन्डेबल 和 लामाक्लाउड में 2026 साल में सभी एक ही उत्पादन 形态── उपयोग डॉक्लिंग या अनस्ट्रक्चर और ColPali के दृश्य सामग्री के लिए  सेवन करें── हाइब्रिड खोज── उपयोग bge-reranker-v2-gemma 重新排序── उपयोग क्लाउड सोनट 4.7 合成,并通过快速缓存 达到 60-80% हिट दर── उपयोग लामा गार्ड 4 和 नेमो गार्डरेल्स 防护── उपयोग Langfuse 和  Phoenix 观测── उपयोग RAGAS में 200 题金套评分 上分──在受监管领域(法律、临床、保险) एक प्रणाली का निर्माण, इस कैपस्टोन के मानकों के माध्यम से है Golden Set、 drifted team 和 डैशबोर्ड.

**Type:** Capstone
**Languages:** Python (pipeline + API), TypeScript (chat UI)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 小时

## 问题
⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒     ⇒      ⇒ ⇒                                                                       

难点不在模型──难点是司法管辖意识的遵守(HIPAA、GDPR、SOC2) 引用 级别的审计性、成本控制(当击率 很高时,快速缓存可带来 60-90% 折扣) 通过RAGAS निष्ठा 进行幻觉检测,以及当源文档更新但索引未跟上时进行漂移检测──这个顶点 要求你在200题黄金套上交付完整系统,并配套红团套套──

## 概念
पाइपलाइन के दो पक्ष हैं।**Ingestion**:docling या Unstructured 解析结构化文档;ColPali 处理视觉丰富的文档; chunks 会获得总结、टैग्स和角色为基础的访问标签──वेक्टर 进入 pgvector + pgvector scale(50M से कम वेक्टर) या Qdrant Cloud;sparse BM25 并行运行──**Conversation**:LangGraph 处理 memory 和 multi-turn; प्रत्येक क्वेरी  निष्पादित हाइब्रिड रिट्रीवल, bge-reranker-v2-gemma-2b रीरैंक का उपयोग करके, क्लाउड सोनट 4.7(प्रोम्प्ट-कैश) संश्लेषण, Llama Guard 4 और NeMo Guardrails के माध्यम से 处理输出,并发出引用- एंकर प्रतिक्रिया──

मूल्यांकन ढेर चार स्तरों है**Golden set**(200 个带引用的标注 Q/A) को सही करने के लिए**Red team**(जेलब्रेक, पीआईआई निकालने की कोशिशें, डोमेन से बाहर के प्रश्न) सुरक्षा के लिए**RAGAS**आत्म-आधारित निष्ठा / उत्तर प्रासंगिकता / संदर्भ सटीकता का आकलन करें。**Drift dashboard**(अरिज़ फ़ीनिक्स) प्रति सप्ताह निगरानी वसूली गुणवत्ता व हालूसिनेशन स्कोर

त्वरित कैशिंग है लागत杆──Claude 4.5+ 和 GPT-5+ 支持缓存 प्रणाली प्रॉम्प्ट + पुनर्प्राप्त संदर्भ──在 60-80% हिट दर 下,单次查询 成本下降 3-5x── पाइपलाइन 必须围绕稳定前设计(系统提示 + पुनः रैंक किया गया संदर्भ पहले), ताकि उच्च कैश हिट दरों को प्राप्त किया जा सके──

## 架构
```
documents（contracts, protocols, policies）
      |
      v
docling / Unstructured parse + 用于 visuals 的 ColPali
      |
      v
chunks + summaries + role-labels + jurisdiction tags
      |
      v
pgvector + pgvectorscale  +  BM25 (Tantivy)
      |
query + role + jurisdiction
      |
      v
LangGraph conversational agent
   +--- retrieve (hybrid)
   +--- 按 role + jurisdiction 过滤
   +--- rerank (bge-reranker-v2-gemma-2b or Voyage rerank-2)
   +--- synthesize (Claude Sonnet 4.7, prompt cached)
   +--- guard (Llama Guard 4 + NeMo Guardrails + Presidio output PII scrub)
   +--- cite + return
      |
      v
eval:
  RAGAS faithfulness / answer_relevance / context_precision（online）
  Langfuse annotation queue（sampled）
  Arize Phoenix drift（weekly）
  red team suite（pre-release）
```

## 技术
- उपभोगः उपयोग Unstructured.io या docling 处理结构化文档; उपयोग ColPali 处理视觉丰富的 PDFs
- वेक्टर डीबी: 低于50M वेक्टर 时使用 pgvector + pgvector scale;否则使用 Qdrant Cloud
- स्परः 带 फील्ड वज़न 的 Tantivy BM25
- 编排: LlamaIndex वर्कफ़्लोस(इंजेक्शन) + लैंगग्राफ(वार्ता)
- पुनः रैंकः 自托管 bge-reanker-v2-gemma-2b या होस्ट किया गया Voyage पुनः रैंक-2
- LLM: 带快速缓存的Claude Sonnet 4.7;fallback为自主托管 Llama 3.3 70B
- ईवल: RAGAS 0.2 ऑनलाइन, डीपईवल उपयोग किया गया हैल्लूसिनेशन और जेल ब्रेक सूट
- अवलोकनशीलताः स्व-होस्टिंग लैंगफ्यूज,带 एनोटेशन कतार;Arize Phoenix उपयोग में बहाव
- गार्डरेल्स: लामा गार्ड 4 इनपुट/आउटपुट वर्गीकरण,नेमो गार्डरेल्स v0.12 नीति,प्रेसिडियो पीआईआई स्क्रब
- अनुपालनः खण्ड ऊपर के भूमिका आधारित पहुंच लेबल; GDPR/HIPAA के अधिकार क्षेत्र टैग के लिए उपयोग किया जाता है


```figure
canary-rollout
```

##  इसे निर्माण
1. **Ingestion.**उपयोग Unstructured या docling 解析 your corpus( कठोर निर्माण आमतौर पर 1000-10000 个文档 के लिए होता है)。

2. **Index.**घने एम्बेडिंग्स ((Voyage-3 या Nomic-embed-v2) write in pgvector + pgvector scale──Tantivey के माध्यम से 建立 BM25 साइड-इंडेक्स──रोल तथा अधिकार क्षेत्र फ़िल्टर 作为 payload──

3. **Hybrid retrieve.**पहले भूमिका+अधिकार 过; फिर并行 घने + BM25; परस्पर रैंक संलयन 合并; शीर्ष-20 送入重排; शीर्ष-5 送入合成──

4. **Synthesize with prompt caching.**सिस्टम प्रॉम्प्ट + स्थैतिक नीति  कैश हेडर पर रखें; कैश एक्सटेंशन के रूप में संदर्भ को रैंक करें; यूजर प्रश्न  के रूप में अनकैश प्रत्यय── स्थिर स्थिति  लक्ष्य है 60-80% कैश हिट दर──

5. **Guardrails.**输入经过Llama Guard 4;NeMo Guardrails रेल 阻止域外问题或政策禁止主题;Presidio 清理输出中的意外PII;उद्धरण प्रवर्तन पोस्ट-फिल्टर

6. **Golden set.**द्वारा क्षेत्र विशेषज्ञों द्वारा 200 个 Q/A जोड़े, समाहित (उत्तर, उद्धरण) ⋅ सटीक-उद्धरण मैच के अनुसार ⋅उत्तर सटीकता、निष्ठा (RAGAS) 评分──

7. **Red team.**50 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 

8. **Drift dashboard.**Arize Phoenix प्रति सप्ताह ट्रैकिंग रिट्रीवल गुणवत्ता ((nDCG、उद्धरण निष्ठा)   5% 时告警

9. **Cost report.**Langfuse: शीघ्र कैशिंग हिट दर, प्रति क्वेरी टोकन, $/क्वेरी के क्रमबद्ध विभाजन के अनुसार

## इसका उपयोग करें
```
$ chat --role=analyst --jurisdiction=GDPR
> 根据我们的合同，EU 用户资料的数据保留义务是什么？
[retrieve]  hybrid top-20 filtered to GDPR + analyst-role
[rerank]    top-5 kept
[synth]     claude-sonnet-4.7, cache hit 74%, 0.8s
answer:
  该合同（Section 12.4, Master Services Agreement dated 2024-03-11）
  要求在终止后 30 天内删除 EU 用户资料，以遵守 GDPR
  Article 17。DPA amendment（DPA-v2.1, Section 5）将该期限扩展为
  “restricted”类别数据的 14 天。
  citations: [MSA-2024-03-11 s12.4, DPA-v2.1 s5]
```

## 交付 यह
`outputs/skill-production-rag.md`描述 deliverable── एक डिपॉजिट इन रिचार्ज क्षेत्र में चैटबॉट, अनुपालन लेबल के साथ, rubric के माध्यम से,并用现场漂移监测 观测──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | RAGAS faithfulness + answer relevance | golden set（200 Q/A）上的 online scores |
| 20 | Citation correctness | 带可验证 source anchors 的 answers 占比 |
| 20 | Guardrail coverage | Llama Guard 4 pass rate + jailbreak suite results |
| 20 | Cost / latency engineering | Prompt-cache hit rate、p95 latency、$/query |
| 15 | Drift monitoring dashboard | Phoenix live dashboard，带每周 retrieval-quality trend |
| **100** | | |

## अभ्यास
1. एक अन्य न्यायालय में निम्न संरचनाएँ एक दूसरे निकाय का टुकड़ा बनायें (उदाहरण के लिए GDPR के अलावा HIPAA में शामिल हों) ।

2. 测量一周 उत्पादन ट्रैफ़िक का शीघ्र-कैश हिट दर──找出哪些查询 破坏了缓存前置──重新组织──

3. 添加带10k-token सारांश बफर का मल्टी-टर्न मेमोरी──测量 बातचीत के साथ 增长,忠诚性 是否下降──

4. क्लाउड सोनेट 4.7 को स्व-होस्ट किए गए लामा 3.3 70B के लिए प्रतिस्थापित करें

5. 添加 不确定模式: यदि शीर्ष पुनर्व्यवस्थित स्कोर 低于门值, एजेंट कहते हैं  मेरे पास आत्मविश्वास वाले उद्धरण नहीं हैं, बल्कि उत्तर हैं

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Prompt caching | “Cached system + context” | Claude/OpenAI 功能：cache hit 时 cached prefix tokens 可享 60-90% 折扣 |
| RAGAS | “RAG evaluator” | 自动评分 faithfulness、answer relevance、context precision |
| Golden set | “Labeled eval” | 200+ 个专家标注的带 citations 的 Q/A；ground truth |
| Jurisdiction tag | “Compliance label” | 附加到 chunks 的 GDPR/HIPAA/SOC2 scope；由 retrieval filter 强制执行 |
| Citation faithfulness | “Grounded answer rate” | 由可检索 source spans 支撑的 claims 占比 |
| Drift | “Retrieval quality decay” | nDCG 或 citation score 的每周变化；alert threshold 5% |
| Red team | “Adversarial eval” | Pre-release jailbreak、PII extraction、off-domain probes |

## 延伸阅读
- [Harvey AI](https://www.harvey.ai) 参考法律 उत्पादन स्टैक
- [Glean enterprise search](https://www.glean.com) उद्यम पैमाने 下的参考RAG
- [Mendable documentation](https://mendable.ai) डेवलपर-डॉक्स आरएजी 参考
- [LlamaCloud Parse + Index](https://docs.llamaindex.ai/en/stable/examples/llama_cloud/llama_parse/) प्रबंधित सेवन
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) 成本杆参考
- [RAGAS 0.2 documentation](https://docs.ragas.io/) 标准 RAG मूल्यांकन ढांचा
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) 参考 drift observability
- [Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) सुरक्षा वर्गीकरण 2026
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) रेल नीति ढांचा
