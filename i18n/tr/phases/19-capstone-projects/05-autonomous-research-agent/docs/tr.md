# Capstone 05  Özgür Araştırma Ajanı(AI-Bilimci 类)

> Sakana'nın AI-Bilimci-v2'si tam bir makale yayınladı.Agent Laboratuarı deney yaptı. Allen AI'nin izlerini paylaşıldı. 2026 yılının şekli, deney üzerinde plan-öğretim-gözden geçirme, maliyetli bütçe ile 沙箱化代码 uygulaması, vizyon-feedback LaTeX yazarı ve otomatik NeurIPS  стиle reviewer ensambli ile birlikte. Bu temel taş, her makalede 30 dolarlık bir sistem inşa etmek ve Sakana'nın kaydedilen kum kaçış kırmızı ekibinden geçmektir.

**Type:** Capstone
**Languages:** Python（agent + sandbox）、LaTeX（output）
**Prerequisites:** Phase 2（ML）、Phase 3（Deep Learning）、Phase 7（transformers）、Phase 10（LLMs from scratch）、Phase 14（agents）、Phase 15（autonomous）、Phase 16（multi-agent）、Phase 18（safety）
**Phases exercised:**P0 · P2 · P3 · P7 · P10 · P14 · P15 · P16 · P18
**Time:** 40 小时

## 问题
Özgür araştırma ajanı 2026 yılında bir kapıdan geçti. Sakana AI'nin AI-Bilimci-v2 Nature'da yayınlandı, üretilen makaleler atölyede eşcinsel incelemeyi geçti. ShinkaEvolve (ICLR 2026) bu yönü gelişim hipoteziye kadar genişletecek. AMD'nin Agent Laboratuarı, geri dönüşümlü izler yayınladı. Bu ajanlar, aday deney ağaçlarında çalışan plan-öğretim-düşünme, döngü ile maliyetli bir öykü çekirdeği, bağlanmış bir kum kutu ve otomatik inceleme yapmaktadır.

Bu döngüyü öğrenmek için, 100M Parametr Transformer'da dikkatle sıvışıklık ablasyonu yaparak, bu döngüyü öğrenmek için, bir tane tane tane ürünü bir fikirle gerçekleştirmek için, bir tane daha çok sıkıntısı içeren bir alanın üzerinde çalışacaksınız.

## 概念
Bu ajan en iyi ilk ağaç aramaıdır. 节点是实验规格:(hypothesis、config、code、expected outcome)  expand 步骤通过小改动提出 children(alternative optimizer、调整批 size、ablate 一个组件)  her çocuk 带有硬资源上限的新沙箱中运行──结果反到得分功能,根据((novelty × quality × remaining budget) 对节点排行尽量而言──树会增长预算 用,然后写出最佳分支──

yazarı ‒ Multimodal ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒

Güvenlik yüklü bir yapıdır. Her deney ağ çıkışı olmaksızın, sınırlı duvar saati, sabit kaynak sınırlaması ile E2B veya Daytona kum kutusunda çalışmaktadır.

## Yapılandırma
```
seed idea + domain
      |
      v
  literature search (Semantic Scholar + OpenAlex + FAISS cache)
      |
      v
  LangGraph plan-execute-verify tree
      |
      v
  +--- expand node ----+      per-node sandbox
  |                    |      (E2B / Daytona)
  v                    v      resource caps
  child_1           child_k   no network egress
  |                    |      deterministic seeds
  v                    v
  run experiment       run experiment
  |                    |
  v                    v
  score nodes by (novelty, quality, budget)
      |
      v
  best branch -> LaTeX writer
      |
      v
  compile + vision critique (Opus 4.7 vision)
      |
      v
  reviewer ensemble (5 LLM judges, NeurIPS rubric)
      |
      v
  paper.pdf + review.md + trace.json
```

## 技术
- Orkestra: Çekim noktaları ve insan onay kapısı
- Ağaç arama: deney düğümüne dayalı  öz tanımlı en iyi ilk 
- Sandbox: Her deney bir E2B, Docker-in-Docker geri dönüş; cgrouplar üzerinden 施加资源 cap
- Edebiyat:Semantic Scholar Graph API + OpenAlex + 本地 FAISS soyut önbelleği
- Yazar:LaTeX şablon + Claude Opus 4.7(görüş modu)
- Reviewer:5 个评审的组合(Opus 4.7、GPT-5.4、Gemini 3 Pro、DeepSeek R1、Qwen3-Max),带权重聚合
- Deneyim çerçevesini: Fiziksel deney için PyTorch 2.5, W&B
- Gözlem:Agent izleme için kullanılan Langfuse, her makale 30 dolarlık bütçe


```figure
ce-experiment-tree
```

## Yapın onu.
1. **Seed and domain scoping.**选取一个种子想法 (örneğin, sub-1B transformörlerinin dikkat haritasında kıtlık kalıplarını araştırmak)  define search space:model、dataset、compute budget──

2. **Literature pass.**查询 Semantic Scholar + OpenAlex 中最相关且引用最多的 50 篇论文;本地缓存抽象;生成 1 页域名消化──

3. **Tree scaffolding.**Tohum hipotezi kullanın.`expand(node) -> children`,with小改动 proposal ((( her çocuk bir yapılandırma değişikliği)`score(node)`实现为加权的新性 × 质性 × 预算 项──

4. **Sandbox wrapping.**Her deney yürür.`docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only`(或等价的E2B politikası) 种子 写入砂箱;输出以只读的方式 方式 装回外部──

5. **Plan-execute-verify loop.** `plan`Çocuklar önermek için.`execute`Sandbox, yakalama logı, metrik.`verify`Metrik 运行单位检查 (), 失败节点会在树上存储故障原因 (), 失败节点会在树上存储故障原因 (), 失败节点会在树上存储单位检查 (), 失败节点会在树上存储故障原因 (), 失败节点会在树上存储故障原因 (), 失败节点会在树上存储故障原因 (), 失败节点会在树上存储故障原因 (), 失败节点会在树上存储故障原因 (), 失败节点会在树上存储故障原因 (), 失败节点会在树上存储故障原因 (), 失败节点会在树上存储失失失的原因 (), 失损失是否下降是否下降是否降是否降降是否降降是否降降是否降降降是否降降降降降降是否降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降降

6. **Writer.**Budjet kullanımı tamamlandıktan sonra, seçen en iyi分支── kullanmak matplotlib 染 figü­re── geçi­rmek Claude Opus 4.7 生成 LaTeX taslak,并把分痕 放入文脈──编译──把编译后的 PDF 送回 Opus 4.7 vizyon──进行批评──代──

7. **Reviewer ensemble.**五个评委 根据 NeurIPS 风格 rubrik,对草案的(novelty、rigor、clearity、reproducibility、impact)打分──如果平均 <4.0/5,则带批判 返回作家──3次重写 后硬停止──

8. **Red team.**构建或集成一组针对砂箱的对抗性任务:fork bomb、网络脱 filtration attempt、file system escape、LLM 写出的 shell metacharacter──确认全部被阻止──写出发现──

9. **Reproducibility.**Her kağıt, ağaç araması izleri, JSON, tohum, W&B çalıştırma bağlantısı, kum kutu yapılandırması ve bir sonundan sonuna kadar tekrarlanmasını sağlar.

## Kullan
```
$ ai-scientist run --seed "attention sparsity in sub-1B transformers" --budget 30
[lit]    50 papers, digest in 12s
[tree]   expanded 8 nodes, budget 12/30
[exec]   node #3 sparsity=top-8, loss=2.83 (best so far)
[exec]   node #6 sparsity=top-4, loss=3.12 (worse)
[exec]   ...
[tree]   chose branch rooted at node #3 (novelty 0.62, quality 0.81)
[write]  LaTeX draft v1 complete
[vision] critique: figure 2 legend too small, claim-evidence ok
[write]  draft v2 after 3 edits
[review] mean 4.2/5 (novelty 3.9, rigor 4.3, clarity 4.1, repro 4.5, impact 4.2)
[done]   paper.pdf + review.md + trace.json     $28.40 spent
```

## - Söyle.
`outputs/skill-ai-scientist.md`Bu da bir tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane tane

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Paper quality | 根据已发表 workshop paper 做 blind rubric review |
| 20 | Experimental rigor | Baseline、seed、ablation；每个 claim 都由 results table 中的一个 cell 支撑 |
| 20 | Cost and compute discipline | 强制执行 $30/paper 上限，并由 Langfuse trace |
| 20 | Safety | Sandbox red team 通过；network policy 和 kill-switch 已验证 |
| 15 | Reproducibility | 使用相同 seed 一条命令 rerun 可复现 paper |
| **100** | | |

## 练习
1. Aynı alanın içindeki üç farklı tohum fikri 运行管eline── trees-search's which parts overlap──识别重复浪费的计算──

2. Deneme yürütülmeden önce, 5 dolardan fazla bir düğüm için değerlendirme yapın.

3. Bu yüzden, bu değerlendirmeyi bir grup kötü yazılı yayınla karşılaştırmak için kullanıyorum.

4. 引入 ağ-ekfiltrasyon kırmızı ekip test:agent 写出尝试 `curl`Dışişleri adresinin kodu:`--network=none`Politika bunu durdurur.

5. Ağaç aramalarınızı düz rastgele başlangıç ile karşılaştırın (Budget aynı, genişleme stratejisi yok)

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Tree search | “AB-MCTS-style expansion” | 用 novelty×quality×budget score 在 experiment node 上进行 best-first exploration |
| Sandbox | “Experiment isolation” | 无 network、CPU/memory 有界、固定 seed、read-only input 的 container |
| Vision critique | “Render-then-read” | 将 paper 编译为 PDF，把 PDF 送回 VLM，用于 layout 和 claim-evidence critique |
| Reviewer ensemble | “Automated peer review” | 多个 LLM judge 使用 NeurIPS rubric 为 paper 打分；weighted aggregate gate 控制 pipeline |
| Novelty score | “Is this new?” | 对接近 50-paper literature cache 的内容施加惩罚的 heuristic |
| Cost ceiling | “$ budget” | 每篇 paper 的总花费硬上限；Langfuse counter + pre-run estimate |
| Red team | “Sandbox-escape audit” | 如果 policy 错误就会逃出 sandbox 的 adversarial task |

## 延伸阅读
- [Sakana AI-Scientist-v2 repository](https://github.com/SakanaAI/AI-Scientist-v2) 参考 üretim araştırma ajanı
- [Sakana AI-Scientist-v1 paper (arXiv:2408.06292)](https://arxiv.org/abs/2408.06292) 原始 yöntem
- [ShinkaEvolve (Sakana ICLR 2026)](https://sakana.ai) evrim 扩展
- [Agent Laboratory (AMD)](https://github.com/SamuelSchmidgall/AgentLaboratory) Çoklu rollü araştırma laboratuvarı çerçevesini
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) 参考 orkestra katmanı
- [Semantic Scholar Graph API](https://api.semanticscholar.org/) Edebiyat aramaları
- [E2B sandboxes](https://e2b.dev) reference deney izolasyonu
- [NeurIPS reviewer guidelines](https://neurips.cc/Conferences/2026/Reviewer-Guidelines) eleştirmen ansambli 编码的 rubrik
