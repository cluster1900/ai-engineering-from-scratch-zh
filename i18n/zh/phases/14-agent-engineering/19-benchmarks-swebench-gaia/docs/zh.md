# 标准:SWE-bench、GAIA、AgentBench

> 三个基准构成2026年代理评价的点──SWE-bench 测试代码补丁──GAIA 测试一般主义工具使用──AgentBench 测试多环境推理──要了解它们的组成、污染 叙事,以及它们不衡量什么──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 06 (Tool Use)
**Time:** ~60 minutes

## 学习目标

- 解释为什么它以单元测试作为门.
- 解释为什么SWE-bench Verified (OpenAI,500任务) 存在,以及它移除了什么.
- 描述GAIA的设计:对人类简单,对AI困难;三个难度等级.
- 描述 AgentBench 的八个环境,以及它对开源LLM的主要阻者.
- 总结 SWE-bench+ 的污染发现及其影响

## 问题

排名表会告诉你哪个模型在某个基准上获胜.

- 标准是不是受到污染的?
- 标志 是否衡量你关心的内容(代码与浏览与通用)
- 评估员 是否强的(AST匹配,国家检查,人检查)

在引用某个数字之前,首先了解这些三个点的基准和失败模式.

## 概念

### 博国际娱乐平台 (SWE-bench(Jimenez et al., ICLR 2024 口头)

- 根据Python的数据库,
- 得到:预定提交的代码基础+自然语言问题描述──
- 产出:一个补丁
- 评估者:应用补丁,运行 repo 的测试套件──补丁必须让 FAIL_TO_PASS 测试(之前失败,现在通过)翻转,同时不破坏 PASS_TO_PASS 测试──

据悉,该公司的数据数据数据显示,该数据数据的数据量在1.5%左右.

### 证实的SWE位

移除了模糊的问题,不可靠的测试,以及解决不清楚的任务. 它是您的代理是否能交付真实补丁?

### 污染

- 超过94%的SWE-位问题早于大多数模型的截止.
- **SWE-bench+**发现32.67%的成功补丁在问题文本中泄漏了解决方案 (模型在描述中看到了修正),另有31.08%由于测试覆盖率较低而可疑.
- 经过检查更干净,但并非完全没有污染.

实践影响:一个在SWE-bench得分50%的模型,在SWE-bench+上可能只有35%的模型.

### 美国国家航空航天局 (GAIA)

- 其他问题: 关于如何使用"Girlboard"的信息
- 设计理念:对人类在概念上简单(92%),但对AI 困难(带插件的GPT-4:15%) 
- 测试推理,多元化,网络工具使用.
- 三个难度等级;3级需要跨模式的长工具链.

 GAIA 用于衡量一般性能力.

### ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,

- 八个环境,覆盖代码(Bash、DB、KG) 、游戏(Alfworld、LTP) 、web(WebShop、Mind2Web) 和开放式生成──
- 转换一次,每次分开4K-13K转换.
- 主要发现:长期推理,决策和指导是遵循OSS LLM的

### 这些不衡量什么

- 实际世界运营成本
- 危险条件 下面的安全行为
- 你所在领域的表现,用你的评估,课 30)
- 尾部失败 (标看平均;生产经营者关心最差的1%)

### 常见错误的基准

- **执着于单一数字。**告诉你的信息比50/P75/P95成本少,
- **Contaminated claims。**报告SWE-bench 却不提 验证或SWE-bench+是误导性的.
- **Benchmark-as-development-target。**为基准 优化产品的有用性.


```figure
ae-swebench-gate
```

## 构建它

`code/main.py`实现一个玩具版SWE-bench-like harness:

- 合成 bug-fix任务 (三项任务)
- 一个编写的代理,会提出补丁.
- 一个测试运行员,用来检查失败_TO_PASS.
- 一个基于问题分解深度的GAIA类型难度分类器.

运行它:

```
python3 code/main.py
```

输遇展示每个任务+每个难度的解决率,并让评估员规则变得具体.

## 使用它

- **SWE-bench Verified**总是报告验证分数.
- **GAIA**用于一般主义代理. 用私人排名板分类.
- **AgentBench**用于多环境比较.
- **Custom evals**实际的产品形状:

## 交付它

`outputs/skill-benchmark-harness.md`为了任意的代码基础任务对 构建一个SWE-台式带带有 FAIL_TO_PASS / PASS_TO_PASS门──

## 练习

1. 将这个玩具带移植到一个真实存储器上运行(选择你自己的一个) ――为已知错误编写3个 FAIL_TO_PASS测试――
2. 在你的三个任务中,每次解决需要多少代理步骤?
3. 阅读SWE-bench+纸.实现一个解决方案-泄漏检查.
4. 追踪一个GPT-4级的特工会怎么做?它需要什么工具?
5. 阅读 AgentBench 的环境分解――哪个环境映射你的产品表面?那里的SOTA是什么样子?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| SWE-bench | “Code agent benchmark” | 2,294 个 GitHub issues；patch 必须翻转 FAIL_TO_PASS tests |
| SWE-bench Verified | “Clean SWE-bench” | 500 个由人工 curated 的 tasks，OpenAI |
| FAIL_TO_PASS | “Fix gate” | 之前 failing、patch 后必须 passing 的 tests |
| PASS_TO_PASS | “No-regression gate” | 之前 passing 且必须仍然 passing 的 tests |
| GAIA | “Generalist benchmark” | 466 个 human-easy / AI-hard 的 multi-tool questions |
| AgentBench | “Multi-env benchmark” | 8 个 environments；long-horizon multi-turn |
| Contamination | “Training-set leak” | benchmark tasks 出现在 model training 中 |
| SWE-bench+ | “Contamination audit” | 在 successful SWE-bench patches 中发现 32.67% solution leakage |

## 进一步阅读

- [Jimenez et al., SWE-bench (arXiv:2310.06770)](https://arxiv.org/abs/2310.06770) 原始基准
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选子集
- [Mialon et al., GAIA (arXiv:2311.12983)](https://arxiv.org/abs/2311.12983)一般性基准
- [Liu et al., AgentBench (arXiv:2308.03688)](https://arxiv.org/abs/2308.03688) 多环境套房
