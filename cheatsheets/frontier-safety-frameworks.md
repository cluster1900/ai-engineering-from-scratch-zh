---
id: frontier-safety-frameworks
title: Frontier Safety Frameworks and External Evals
code: FS
subtitle: RSP v3.0、PF v2 与 FSF v3 对比，以及 METR 时间跨度、WMDP、CAIS、CAISI 和 2025 年的两用证据。
hue: 350
sources: phases/15-autonomous-systems/19-anthropic-rsp, phases/15-autonomous-systems/20-openai-preparedness-deepmind-fsf, phases/15-autonomous-systems/21-metr-external-evaluation, phases/15-autonomous-systems/22-cais-caisi-societal-risk, phases/18-ethics-safety-alignment/17-wmdp-dual-use-evaluation, phases/18-ethics-safety-alignment/18-frontier-safety-frameworks-rsp-pf-fsf, phases/18-ethics-safety-alignment/30-dual-use-risk-cyber-bio-chem-nuclear
source_hash: 5ea1af55b3c4a341
---

## 三家实验室的框架
type: comparison
span: 2
from: phases/18-ethics-safety-alignment/18-frontier-safety-frameworks-rsp-pf-fsf/docs/en.md, phases/18-ethics-safety-alignment/18-frontier-safety-frameworks-rsp-pf-fsf/code/main.py, phases/15-autonomous-systems/19-anthropic-rsp/docs/en.md, phases/15-autonomous-systems/20-openai-preparedness-deepmind-fsf/docs/en.md

| 因素 | Anthropic RSP v3.0 | OpenAI PF v2 | DeepMind FSF v3 |
|---|---|---|---|
| 生效时间 | Feb 24, 2026 | April 15, 2025 | Sept 2025，Apr 2026 增加等级 |
| 阈值术语 | Capability Thresholds | High Capability thresholds | Critical Capability Levels |
| 层级 | ASL-1 到 ASL-5+ | Low、Medium、High、Critical | 按领域划分的 CCL |
| CBRN 门槛 | ASL-3，May 2025 启用 | 生物领域为 High | Bioweapon Uplift CCL |
| AI R&D 门槛 | AI R&D-2 与 AI R&D-4 | AI R&D 为 High | ML R&D autonomy level 1 |
| 自主性 | 具名风险，需肯定性论证 | Research Category，不自动触发 | 并入 ML R&D 与 Cyber |
| 常设报告 | Roadmap 加 Risk Report | Capabilities 加 Safeguards Reports | FSF 更新周期 |
| 调整条款 | 有，同行发布时可降低 | 有，Leadership 可降低 | 有，2025 年加入 |

## 同一能力，三种分类
type: comparison
span: 2
from: phases/15-autonomous-systems/20-openai-preparedness-deepmind-fsf/code/main.py

| 能力 | OpenAI PF v2 | Anthropic RSP v3.0 | DeepMind FSF v3 |
|---|---|---|---|
| `long_range_autonomy` | Research，观察 | 具名风险，需肯定性论证 | 并入 ML R&D、Cyber |
| `sandbagging` | Research，观察 | 通过评估上下文差距 | 欺骗性对齐监控 |
| `autonomous_replication` | Research，观察 | 由 AI R&D-4 覆盖 | 并入 ML R&D |
| `undermining_safeguards` | Research，观察 | 硬编码禁止 | 自动监控加红队 |
| `rnd_automation` | Tracked，SAG 审查 | AI R&D-4，需肯定性论证 | ML R&D autonomy level 1 |
| `cyber_uplift` | Tracked，SAG 审查 | ASL-3 触发 | Cyber CCL |
| `bio_uplift` | Tracked，SAG 审查 | ASL-3 触发 | Bio CCL |

## 何时用哪个
type: concepts
from: phases/15-autonomous-systems/19-anthropic-rsp/docs/en.md, phases/15-autonomous-systems/20-openai-preparedness-deepmind-fsf/docs/en.md, phases/15-autonomous-systems/21-metr-external-evaluation/docs/en.md, phases/15-autonomous-systems/22-cais-caisi-societal-risk/docs/en.md, phases/18-ethics-safety-alignment/17-wmdp-dual-use-evaluation/docs/en.md

- **用 RSP v3.0**：检查 AI R&D-4 门槛及其肯定性论证时。
- **用 PF v2**：检查某个类别是 Tracked（设门槛）还是 Research（仅观察）时。
- **用 FSF v3**：检查按领域的 CCL 或欺骗性对齐监控时。
- **用 METR 时间跨度**：需要一个外部能力数字时。它是上界。
- **用 WMDP**：需要一个不诱发有害输出的两用代理指标时。
- **用 CAISI 报告**：需要关于网络、生物和化学风险的非保密评估时。
- **用 CAIS 四类风险**：为部署标注社会规模风险时。

## 要知道的数字
type: concepts
from: phases/15-autonomous-systems/19-anthropic-rsp/docs/en.md, phases/15-autonomous-systems/21-metr-external-evaluation/docs/en.md, phases/18-ethics-safety-alignment/17-wmdp-dual-use-evaluation/docs/en.md, phases/18-ethics-safety-alignment/30-dual-use-risk-cyber-bio-chem-nuclear/docs/en.md

- **WMDP**：4,157 道题。生物 1,520，网络 2,225，化学 412。
- **生物试验**：2.53x 提升。不足以排除 ASL-3。
- **SaferAI**：2023 RSP 为 2.2，v3.0 为 1.9。量表从 1.0 到 4.0。
- **Opus 4.6 时间跨度**：50% 可靠度下 ~14 小时，Time Horizon 1.1。
- **翻倍时间**：按 2023 年后的拟合约 ~4.3 个月（130.8 天）。
- **任务集**：HCAST 189 个任务，1 分钟到 8+ 小时。RE-Bench 71 个任务。
- **网络攻击行动**：最高 90% 自动化。人只参与 4 到 6 个步骤。
- **湿实验演示**：通过协议优化实现 79x 效率提升。

## 关键概念
type: concepts
from: phases/18-ethics-safety-alignment/18-frontier-safety-frameworks-rsp-pf-fsf/docs/en.md, phases/15-autonomous-systems/19-anthropic-rsp/docs/en.md, phases/15-autonomous-systems/22-cais-caisi-societal-risk/docs/en.md, phases/18-ethics-safety-alignment/17-wmdp-dual-use-evaluation/docs/en.md

- **PF v2 标准**：plausible、measurable、severe、net-new、instantaneous-or-irremediable。
- **安全论证支柱**：monitoring、illegibility、incapability。
- **两层缓解**：Anthropic 单方面行动与全行业建议。
- **CAIS 四类风险**：恶意使用、AI 竞赛、组织风险、失控 AI。
- **组织杠杆**：安全文化、审计、多层防御、信息安全。
- **黄区**：近端的使能知识，而非合成配方。
- **CAIS 与 CAISI**：一个是非营利组织，一个是 NIST 下属中心。看 URL 中是否有 nist.gov。

## 各领域的两用图景
type: comparison
span: 2
from: phases/18-ethics-safety-alignment/30-dual-use-risk-cyber-bio-chem-nuclear/docs/en.md, phases/18-ethics-safety-alignment/30-dual-use-risk-cyber-bio-chem-nuclear/code/main.py

| 因素 | 生物 | 化学 | 网络 | 核 |
|---|---|---|---|---|
| 2024 | 轻度提升 | 轻度提升 | 代码片段协助 | 有限 |
| 2025 | 2.53x 提升，接近 ASL-3 | 借助视觉削弱执行鸿沟 | 最高 90% 行动自动化 | 有限 |
| 拐点 | 获取阶段自动化 | 实时湿实验纠错 | Agentic coding | 未见报告 |
| 剩余瓶颈 | 病原体采购、设备 | 前体采购、设备 | 4 到 6 个人工步骤 | 裂变材料获取 |

## METR 时间跨度，逐步说明
type: flow
from: phases/15-autonomous-systems/21-metr-external-evaluation/docs/en.md

1. **任务集**：收集从分钟级到小时级专家耗时的任务。
2. **运行**：让模型执行每个任务。记录成功或失败。
3. **拟合**：拟合 P(success) 对 log(expert time) 的 logistic 曲线。
4. **读数**：时间跨度是 P(success) = 0.5 时对应的专家耗时。
5. **审计**：检查评估上下文博弈。它会移动观测到的时间跨度。
6. **使用**：把它当作上界。针对你的任务和工具向下调整。

## 时间跨度拟合（L21 代码）
type: annotated-code
lang: python
from: phases/15-autonomous-systems/21-metr-external-evaluation/code/main.py

```python
p = sigmoid(w * math.log(t) + b)  # P(success) vs log expert time
w -= lr * dw / n  # gradient step, default lr 0.05
logit = math.log(p / (1 - p))
return math.exp((logit - b) / w)  # expert time at probability p
h50 = horizon_at(w, b, 0.50)  # METR headline, also 0.10 and 0.90
gamed = inject_gaming(tasks, gaming_rate=rate)  # failures flipped to success
```

## 运行课程代码
type: command-table
from: phases/15-autonomous-systems/19-anthropic-rsp/docs/en.md, phases/15-autonomous-systems/19-anthropic-rsp/code/main.py, phases/15-autonomous-systems/20-openai-preparedness-deepmind-fsf/docs/en.md, phases/15-autonomous-systems/20-openai-preparedness-deepmind-fsf/code/main.py, phases/15-autonomous-systems/21-metr-external-evaluation/code/main.py, phases/15-autonomous-systems/22-cais-caisi-societal-risk/code/main.py, phases/18-ethics-safety-alignment/17-wmdp-dual-use-evaluation/code/main.py, phases/18-ethics-safety-alignment/18-frontier-safety-frameworks-rsp-pf-fsf/code/main.py, phases/18-ethics-safety-alignment/30-dual-use-risk-cyber-bio-chem-nuclear/code/main.py

| 命令 | 作用 |
|---|---|
| `code/main.py`（15.19） | 对两个模型做 AI R&D-4 检查 |
| `code/main.py`（15.20） | 对比五种能力在三份政策中的分类 |
| `code/main.py`（15.21） | 50、10 和 90% 时间跨度，博弈比例 10、20、40% |
| `code/main.py`（15.22） | 标注低、中、高风险部署 |
| `python3 code/main.py`（18.17） | 遗忘前后的 WMDP 形式分数 |
| `python3 code/main.py`（18.18） | 并排打印三个框架 |
| `python3 code/main.py`（18.30） | 打印四领域两用表 |

## 代码中的默认值与阈值
type: defaults
from: phases/15-autonomous-systems/19-anthropic-rsp/code/main.py, phases/15-autonomous-systems/21-metr-external-evaluation/code/main.py, phases/15-autonomous-systems/22-cais-caisi-societal-risk/code/main.py, phases/18-ethics-safety-alignment/17-wmdp-dual-use-evaluation/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `rd_automation_share` | 0.5 | L19 AI R&D-4 触发条件 |
| `metr_horizon_hours` | 40.0 | L19 触发条件，单位小时 |
| `aar_outperform_share` | 0.4 | L19 触发条件 |
| `eval_context_gaming_rate` | 0.2 | 超过时论证增加第 7 节 |
| `iters` | 4000 | L21 logistic 拟合步数 |
| `strength` | 0.9 | L17 遗忘，`collateral` 为 0.03 |
| `agent_autonomy_hours` | 4.0 | L22 在达到或超过它时标注 `rogue_ais` |

## 故障排查
type: troubleshooting
from: phases/15-autonomous-systems/19-anthropic-rsp/docs/en.md, phases/15-autonomous-systems/20-openai-preparedness-deepmind-fsf/docs/en.md, phases/15-autonomous-systems/21-metr-external-evaluation/docs/en.md, phases/15-autonomous-systems/21-metr-external-evaluation/code/main.py, phases/18-ethics-safety-alignment/17-wmdp-dual-use-evaluation/docs/en.md, phases/18-ethics-safety-alignment/30-dual-use-risk-cyber-bio-chem-nuclear/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 类别被观察到，却什么也没触发 | PF v2 中的 Research Category | 检查 Tracked 与 Research |
| 把某项措施当成实验室承诺 | 它属于行业层 | 检查每项承诺所在的层级 |
| 能力数字过低 | 模型在评估中藏拙 | 加入外部对抗性评估 |
| 时间跨度高于部署可靠度 | 理想化工具，没有后果 | 当作上界。测量你自己的任务 |
| 时间跨度远离真实值 | 评估上下文博弈 | 做博弈审计 |
| `horizon undefined` 错误 | 拟合斜率 `w` 约为 ~0 | 覆盖从分钟到小时的任务长度 |
| WMDP 高，真实风险不明 | 是代理指标，不是部署度量 | 加入新手诱导研究 |
| 过滤器只能挡住新手 | 专家绝对上限 | 诱导加固、遗忘、控制 |

## 问答
type: qa
from: phases/15-autonomous-systems/19-anthropic-rsp/docs/en.md, phases/15-autonomous-systems/19-anthropic-rsp/code/main.py, phases/15-autonomous-systems/21-metr-external-evaluation/docs/en.md, phases/18-ethics-safety-alignment/18-frontier-safety-frameworks-rsp-pf-fsf/docs/en.md

- **RSP v3.0 有约束力吗？** 没有。没有什么强制 Anthropic 遵守它。
- **玩具 AI R&D-4 检查何时越线？** 三个触发条件中任意两个触发时。
- **为什么首先看 50% 时间跨度？** 它是最直观的点。
- **什么取代了 2023 年的暂停条款？** 肯定性论证。缓解措施充分即可继续。
- **为什么批评者不喜欢调整条款？** 它们会引发逐底竞争。
