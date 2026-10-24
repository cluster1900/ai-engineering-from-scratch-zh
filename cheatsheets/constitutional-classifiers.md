---
id: constitutional-classifiers
title: Constitutional AI and Input/Output Classifiers
code: CO
subtitle: 批评-修订训练、层级裁决、输入与输出护栏、它们的绕过方式，以及一个 YAML 规则引擎。
hue: 160
sources: phases/15-autonomous-systems/17-constitutional-ai, phases/15-autonomous-systems/18-llama-guard, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif, phases/19-capstone-projects/86-constitutional-rules-engine
source_hash: c5179b39b7adf239
---

## CAI 训练的两个阶段
type: flow
from: phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/docs/en.md, phases/15-autonomous-systems/17-constitutional-ai/docs/en.md

1. **SFT 模型**：回答一条红队提示。它有帮助，但还不够无害。
2. **批评者**：读取一条随机抽取的原则，对回答进行批评。
3. **修订者**：针对批评修改回答。修改结果就是 SFT 的目标。
4. **策略模型**：生成成对的补全。
5. **反馈模型**：依据抽取的原则给每一对排序。
6. **奖励模型**：在 AI 偏好上训练。PPO 以它为目标运行。

## 分层防御
type: architecture
from: phases/15-autonomous-systems/18-llama-guard/docs/en.md, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/docs/en.md, phases/19-capstone-projects/86-constitutional-rules-engine/docs/en.md

```arch
node | user | 1,1 | User turn | | client
node | inrail | 2,1 | Input rail | Llama Guard, NeMo | process
node | model | 3,1 | Model weights | trained with CAI | model
node | outrail | 4,1 | Output rail | classifier gate | process
node | rules | 4,2 | Rules engine | YAML constitution | process
node | fixer | 3,2 | Fixer | local edits per rule | process
node | out | 2,2 | Verdict | accepted or escalated | client
edge | user | inrail |
edge | inrail | model | allowed
edge | model | outrail | draft
edge | outrail | rules | draft
edge | rules | fixer | violations
edge | fixer | out | 2nd pass
```

## 三层并排对比
type: comparison
span: 2
from: phases/15-autonomous-systems/17-constitutional-ai/docs/en.md, phases/15-autonomous-systems/18-llama-guard/docs/en.md, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/docs/en.md, phases/19-capstone-projects/86-constitutional-rules-engine/docs/en.md

| 维度 | CAI 权重 | 输入/输出分类器 | 规则引擎 |
|---|---|---|---|
| 作用于 | 权重的偏好 | 每一轮输入和输出 | 候选回答 |
| 信号 | 原则、批评、AI 反馈 | 危害分类，S1 到 S14 | YAML 谓词 |
| 结果 | 附带解释的拒绝 | 按类别拦截、标记或分流 | 每条规则一个违规项，外加修复 |
| 擅长 | 未见过的近似变体 | 快速拒绝明显的滥用 | 合同式约束 |
| 漏掉 | 原则歧义、漂移 | Emoji 走私、同形字、改写 | 结构性改写 |
| 例子 | Claude Constitution | Llama Guard 3, NeMo Guardrails | `rules.yml` |

## 层级与区域
type: concepts
from: phases/15-autonomous-systems/17-constitutional-ai/docs/en.md, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/docs/en.md

- **Tier 1**：安全与支持人类监督。最高。
- **Tier 2**：伦理。冲突时优先于准则。
- **Tier 3**：Anthropic 准则。
- **Tier 4**：有帮助性。最低。
- **硬编码**：CBRN 能力提升、CSAM、基础设施攻击、身份欺骗。不可覆盖。
- **软编码**：长度、话题范围、风格、工具使用。运营方可在边界内调整。
- **L18.05 顺序**：灾难性、准则、伦理、有帮助。冲突自上而下裁决。

## 需要知道的数字
type: concepts
from: phases/15-autonomous-systems/17-constitutional-ai/docs/en.md, phases/15-autonomous-systems/18-llama-guard/docs/en.md, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/docs/en.md

- **Claude Constitution**：79 页，CC0，2026 年 1 月。
- **CAI 2022**：宪法中有 16 条原则。
- **Participatory 2023**：~1,000 名美国受访者。与公司文本的一致度约 ~50%。
- **Constitutional Classifiers**：v1 计算开销 23.7%，v2 约 ~1%。
- **Llama Guard 3**：基于 Llama-3.1-8B，13 类危害，8 种语言。
- **1B-INT4 变体**：在移动端 CPU 上超过 30 tokens/sec。
- **Llama Guard 4**：S1 到 S14。S14 是代码解释器滥用。
- **攻击**：Emoji 走私在六个防护模型上 ASR 达 100%。NeMo Guard Detect 为 72.54%。

## 四层裁决器（L15.17）
type: annotated-code
lang: python
from: phases/15-autonomous-systems/17-constitutional-ai/code/main.py

```python
block = hardcoded_block(action)  # substring match, HARDCODED_PROHIBITIONS
if block:
    return "refuse", f"hardcoded prohibition: {block}"
if score.safety >= 3:  # higher tier wins on conflict
    return "refuse", f"safety violation (score={score.safety})"
if score.ethics >= 3:
    return "refuse", f"ethics violation (score={score.ethics})"
if score.guidelines >= 3:  # modify, not refuse
    return "modify", f"guideline conflict (score={score.guidelines}); modify"
return "allow", "all higher tiers clear; helpfulness respected"
```

## 先归一化，再分类（L15.18）
type: annotated-code
lang: python
from: phases/15-autonomous-systems/18-llama-guard/code/main.py

```python
out = unicodedata.normalize("NFKC", text)  # unify compatibility forms
out = _homoglyph_map(out)  # Cyrillic lookalikes to Latin
return "".join(ch for ch in out if not _is_invisible(ch))  # drop zero-width
hits = classify_raw(normalize(text))  # what classify_normalized does
hits = output_rail(o)  # OUTPUT_DISALLOWED on the model turn
```

## rules.yml 中的一条规则
type: annotated-code
lang: yaml
from: phases/19-capstone-projects/86-constitutional-rules-engine/code/rules.yml

```yaml
- name: no-empty-refusal
  severity: medium  # low, medium or high
  applies_when:  # false gives not_applicable
    contains_regex: '\b(i cannot|i will not|i refuse|unable to help)\b'
  must:
    any_of:
      - contains_regex: '\b(try|consider|alternative|instead|suggest)\b'
      - contains_regex: '\bredirect\b'
  explanation: "Refusals must offer a next step (a suggestion, an alternative, or a redirect)."
  fix:
    append_if_missing: "\n\nIf this is something I cannot help with, ..."
```

## 规则语法
type: command-table
from: phases/19-capstone-projects/86-constitutional-rules-engine/docs/en.md, phases/19-capstone-projects/86-constitutional-rules-engine/code/main.py

| 命令 | 作用 |
|---|---|
| `contains_regex`、`not_contains_regex` | 正则匹配到或未匹配到，不区分大小写 |
| `starts_with_regex`、`ends_with_regex` | 在文本开头或结尾匹配 |
| `max_words`、`min_words` | 词数上下限 |
| `all_of`、`any_of`、`not_` | 组合谓词。`any_of` 会短路 |
| `applies_when` | 为 False 时记录 `not_applicable` |
| `append_if_missing`、`prepend_if_missing` | 文本缺失时补上 |
| `replace_regex` | 把 `pattern` 替换为 `replacement` |
| `low`、`medium`、`high` | 严重级别。第 87 课的门禁拦截 `high` |

## 运行与使用
type: task-table
from: phases/15-autonomous-systems/17-constitutional-ai/docs/en.md, phases/15-autonomous-systems/18-llama-guard/docs/en.md, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/code/main.py, phases/19-capstone-projects/86-constitutional-rules-engine/code/main.py, phases/19-capstone-projects/86-constitutional-rules-engine/code/tests.py

| 任务 | 代码 |
|---|---|
| 四层裁决器演示（15.17） | `code/main.py` |
| 分类器与输出护栏演示（15.18） | `code/main.py` |
| CAI 玩具流水线（18.05） | `python3 code/main.py` |
| 规则引擎演示（19.86） | `python3 main.py` |
| 加载宪法 | `engine = Engine()` |
| 评估一份草稿 | `report = engine.evaluate(draft)` |
| 修复违规项 | `fixer.apply(draft, report.violations())` |
| 对比草稿与修订稿 | `diff(draft, revised)` |

## 故障排查
type: troubleshooting
from: phases/15-autonomous-systems/17-constitutional-ai/docs/en.md, phases/15-autonomous-systems/18-llama-guard/docs/en.md, phases/15-autonomous-systems/18-llama-guard/code/main.py, phases/19-capstone-projects/86-constitutional-rules-engine/code/main.py

| 现象 | 原因 | 解决 |
|---|---|---|
| 零宽字符绕过关键词防护 | Emoji 走私把词拆开 | 先 `normalize()` 再 `classify_raw` |
| 西里尔字母形近字蒙混过关 | 同形字替换 | `_homoglyph_map`。扩充映射表 |
| 输入通过后泄漏了机密 | 没有输出护栏 | 在模型回合上加 `output_rail()` |
| 请求在多轮中逐渐偏移 | 分类器只看单轮上下文 | 用 Colang 写对话护栏 |
| “持证实验室”前提占了上风 | 只依赖基于理由的层级 | 硬编码的禁令 |
| `has bad severity` | 严重级别不是 low、medium、high | 使用三者之一 |
| `missing required field` | 缺少 name、explanation 或 must | 补上该字段 |
| `unknown predicate` | 键不在语法中 | 使用原子谓词或组合谓词 |

## 问答
type: qa
span: 2
from: phases/15-autonomous-systems/17-constitutional-ai/docs/en.md, phases/15-autonomous-systems/18-llama-guard/docs/en.md, phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/docs/en.md, phases/19-capstone-projects/86-constitutional-rules-engine/docs/en.md

- **RLAIF 只是更便宜的 RLHF 吗？** 不是。标注者偏差转移到了对原则的解读上。
- **RLAIF 改变了什么？** 谄媚减少了。古德哈特定律依然存在。
- **分类器位于哪一层？** 在宪法层之下、运行时层之上。
- **为什么只做局部修复？** 结构性改写属于独立的“拒绝并提供帮助”层。
- **一层就够了吗？** 不够。CAI 塑造行为，分类器强制执行不变量。
