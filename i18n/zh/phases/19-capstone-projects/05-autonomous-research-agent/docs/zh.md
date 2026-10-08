# 自主研究代理 类型:人工智能科学家

> 萨卡纳的AI-科学家-v2 发布完整论文――代理实验室 运行实验――艾伦AI 分享了痕迹――2026年的形态是实验上进行计划执行-验证树搜索,带有成本预算、沙箱化代码执行、视觉反拉特克斯作家,以及自动化的NeurIPS风格评论员组――这个基石是构建这样的系统,在每篇论文中,以30美元内端运行,并通过萨卡纳记录了沙箱逃走的红团队――

**Type:** Capstone
**Languages:** Python（agent + sandbox）、LaTeX（output）
**Prerequisites:** Phase 2（ML）、Phase 3（Deep Learning）、Phase 7（transformers）、Phase 10（LLMs from scratch）、Phase 14（agents）、Phase 15（autonomous）、Phase 16（multi-agent）、Phase 18（safety）
**Phases exercised:**子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子
**Time:** 40 小时

## 问题
自主研究代理在2026年跨过一个门──Sakana AI的AI科学家-v2发表在Nature 上,生成论文通过了研讨会同行评审──ShinkaEvolve(ICLR 2026) 将扩展到演化假设──AMD的代理实验室发布可复制的痕迹──这些代理并非奇怪它们在候选实验树上运行的计划执行-验证,循环带有成本上限的故事种子、绑定故事盒,以及自动化审查──工艺在循环中、预算和安全性和安全性.

你将通过一个狭窄领域的种子想法实现这样的代理来学习这个循环 (例如,在100M参数变压器上做注意力稀疏性排放) 价值不在第一次运行发现新东西.价值在基础设施:树搜索,实验沙盒,作家评论员循环,红团队报告――萨卡纳团队记录了沙盒逃脱失败;你的代理必须通过同样的红团队――

## 概念
这个代理是最好的第一棵树搜索――节点是实验规格:(假设、配置、代码、预期结果) ――扩大步骤通过小改动提出孩子们的替代优化器、调整批量尺寸、调整一个组件) ――每个孩子在带有硬资源上限的新沙箱中运行――结果反到分分数功能,根据(新品 × 质量 × 剩余预算) 对节点排列尽量量进行预算的增长,然后写出最佳分支――

作者是多模的. 它生成了 LaTeX草案,编译,染色图,并把染色后的 PDF 送回Claude Opus 4.7的视觉模式,用于批判性布局,图像可读性,以及声称证据的配合.由五名LLM法官组成的评论员组会给出NeurIPS风格评分;如果平均值低于值,纸会带着批评回复作者的.

安全是承担重构──每次实验都在没有网络输出、限额的墙钟、固定资源限制的E2B或Daytona沙盒中运行──代理的代码生成步骤将经过政策层,阻止逃离沙盒的系统调用──红团队报告 会复现萨卡纳 记录过的攻击表面(叉子炸弹、文件系统逃脱、LLM 写出的网络调用)──

## 架构
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
- 管弦乐:带检查和人认证门的长图
- 树搜索:基于实验节点的自定义最好-第一(来自 Sakana v2 的 AB-MCTS风格)
- 通过集团 施加资源限制
- 文献:语义学家图 API + OpenAlex + 本地 FAISS抽象缓存
- 作者:LaTeX模板 + 克劳德 Opus 4.7(视觉模式) 用于图像评论和布局
- 评论员:5 个评审员的组合(Opus 4.7、GPT-5.4、Gemini 3 Pro、DeepSeek R1、Qwen3-Max),带有权重的集成
- 实验框架:用于物理实验的 PyTorch 2.5,W&B用于记录
- 长用于代理追踪,每篇论文30美元硬预算


```figure
ce-experiment-tree
```

## 构建它
1. **Seed and domain scoping.**选取一个种子想法 (例如,研究1B变压器的注意力地图中的稀疏性模式) 定义搜索空间:模型、数据集、计算预算──

2. **Literature pass.**查询语义学家 + OpenAlex 中最相关且引用最多的 50篇论文;本地缓存摘要;生成 1 页域名消化──

3. **Tree scaffolding.**用种子假设初始化根.`expand(node) -> children`为了让孩子们变得更好,`score(node)`实现新鲜性 × 质量 × 预算项

4. **Sandbox wrapping.**每次实验都运行.`docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only`(或等价的E2B政策) 种子 写入沙箱;输出以仅阅读方式 装回外部

5. **Plan-execute-verify loop.** `plan`提出孩子们.`execute`运行沙盒,捕获日志和计量量.`verify`对于测量运行单位检查 (),损失是否下降?消耗是否隔离效果?)

6. **Writer.**通过Claude Opus 4.7 生成 LaTeX草案,并把分支的痕迹放入文本中──编译──把编译后的 PDF 送回 Opus 4.7 视觉 进行批评──代──

7. **Reviewer ensemble.**五个评委 根据NeurIPS风格条目,对草案的(新鲜性,严格性,清晰性,可复制性,影响性)打分――如果平均值 <4.0/5,则带有批评 返回作者──3次重写 后硬停止──

8. **Red team.**构建或集成一组针对沙箱的对抗任务:叉子炸弹、网络泄露尝试、文件系统逃脱、LLM 写出的 Shell Metacharacter──确认全部被阻止──写出发现──

9. **Reproducibility.**每篇论文都附带树搜索追踪JSON、种子、W&B运行链接、沙盒配置,以及一个端到端复现它的 README──

## 使用它
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

## 交付它
`outputs/skill-ai-scientist.md`给一个种子想法 +一个域名 +30美元的预算,它会运行完整的管道,并输出一个可复习的论文,以及一个可复制性捆绑.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Paper quality | 根据已发表 workshop paper 做 blind rubric review |
| 20 | Experimental rigor | Baseline、seed、ablation；每个 claim 都由 results table 中的一个 cell 支撑 |
| 20 | Cost and compute discipline | 强制执行 $30/paper 上限，并由 Langfuse trace |
| 20 | Safety | Sandbox red team 通过；network policy 和 kill-switch 已验证 |
| 15 | Reproducibility | 使用相同 seed 一条命令 rerun 可复现 paper |
| **100** | | |

## 练习
1. 用同一领域中三个不同的种子想法运行管道.

2. 在实验执行之前,为估计超过5美元的节点 添加人-在循环门――衡量总成本 下降多少――

3. 将评论员团队 换成单个评委.

4. 引入网络泄露红队测试:代理 写出尝试 `curl`确认  证据`--network=none`政策阻止它.

5. 您的树搜索与平坦的随机基线相比较 ((相同的预算,没有扩张策略) ⋅报告新奇 ×质量增长――

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
- [Sakana AI-Scientist-v2 repository](https://github.com/SakanaAI/AI-Scientist-v2) 参考生产研究机构
- [Sakana AI-Scientist-v1 paper (arXiv:2408.06292)](https://arxiv.org/abs/2408.06292) 原始方法
- [ShinkaEvolve (Sakana ICLR 2026)](https://sakana.ai)进化 扩展
- [Agent Laboratory (AMD)](https://github.com/SamuelSchmidgall/AgentLaboratory)多功能研究实验室框架
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) 参考调整层
- [Semantic Scholar Graph API](https://api.semanticscholar.org/) 搜索文献
- [E2B sandboxes](https://e2b.dev) 参考实验隔离
- [NeurIPS reviewer guidelines](https://neurips.cc/Conferences/2026/Reviewer-Guidelines)评审团编码的条目
