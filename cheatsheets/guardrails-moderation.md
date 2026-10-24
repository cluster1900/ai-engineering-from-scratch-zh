---
id: guardrails-moderation
title: Guardrails, Moderation and Redaction
code: GM
subtitle: 检查输入与输出，路由分类器判定，脱敏片段并拦截工具调用。课程中的 Python 与 Rust 实现。
hue: 350
sources: phases/11-llm-engineering/12-guardrails, phases/15-autonomous-systems/18-llama-guard, phases/18-ethics-safety-alignment/29-moderation-systems-openai-perspective-llamaguard, phases/19-capstone-projects/85-content-classifier-integration, projects/sensitive-text-redaction-gate, projects/tool-call-firewall
source_hash: 085673fb0fa20fef
---

## 护栏检查
type: task-table
span: 2
from: phases/11-llm-engineering/12-guardrails/code/guardrails.py

| 任务 | 代码 |
|---|---|
| 查找注入模式 | `detect_injection(text)` |
| 查找输入中的 PII | `detect_pii(text)` |
| 限制 prompt 长度 | `check_length(text, max_chars=5000, max_words=1000)` |
| 拦截有害输出 | `filter_toxicity(text)` |
| 脱敏输出中的 PII | `scrubbed, result = scrub_pii_from_output(text)` |
| 检查输出是否回答了输入 | `check_relevance(input_text, output_text, threshold=0.15)` |
| 捕获系统提示回显 | `check_system_prompt_leak(output_text, system_prompt, threshold=0.4)` |
| 在模型前后运行所有检查 | `pipeline.process(attack)` |

## 过滤栈
type: flow
from: phases/11-llm-engineering/12-guardrails/docs/en.md

1. **长度检查**：拒绝超过 5000 字符的输入。长度检查几乎零成本。
2. **限流**：每个用户 10 req/min。
3. **话题分类器**：在模型之前拒绝离题输入。
4. **PII 检测器**：脱敏或拒绝个人数据。
5. **注入检测器**：分类器耗时 5-20ms。
6. **LLM**：调用耗时 200-2000ms。
7. **毒性过滤器**：对每个输出分类。
8. **PII 清洗与相关性检查**：先脱敏，再检查回答是否切题。

## Moderation API 调用
type: annotated-code
lang: python
from: phases/11-llm-engineering/12-guardrails/docs/en.md, phases/18-ethics-safety-alignment/29-moderation-systems-openai-perspective-llamaguard/docs/en.md

```python
from openai import OpenAI
client = OpenAI()
response = client.moderations.create(
    model="omni-moderation-latest",  # text and images in one call
    input="<text>",
)
result = response.results[0]
print(result.flagged)  # True when a category fires
```

## 代码中的阈值
type: defaults
from: phases/11-llm-engineering/12-guardrails/code/guardrails.py, phases/18-ethics-safety-alignment/29-moderation-systems-openai-perspective-llamaguard/code/main.py, phases/19-capstone-projects/85-content-classifier-integration/code/classifiers.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `check_length` `max_chars` | 5000 | 另有 `max_words` 1000 |
| `detect_injection` 拦截阈值 | 0.75 | 模式置信度最大值 |
| `filter_toxicity` 拦截阈值 | 0.80 | 类别置信度最大值 |
| `check_relevance` `threshold` | 0.15 | 大于等于即通过 |
| `check_system_prompt_leak` `threshold` | 0.4 | 低于即通过 |
| `input_moderator` `threshold` | 0.5 | `output_moderator` 相同 |
| `InstructionLeakageClassifier` `threshold` | 0.55 | 三元组余弦 |
| `_NEGATION_WINDOW` | 20 | 检查 not、never、no 的字符数 |

## 各审核系统并列对比
type: comparison
from: phases/18-ethics-safety-alignment/29-moderation-systems-openai-perspective-llamaguard/docs/en.md, phases/15-autonomous-systems/18-llama-guard/docs/en.md, phases/11-llm-engineering/12-guardrails/docs/en.md

| 维度 | OpenAI Moderation | Llama Guard | Perspective API |
|---|---|---|---|
| 模型 | `omni-moderation-latest`，GPT-4o | Llama-3.1-8B base (v3) | LLM 之前的毒性打分 |
| 类别 | 13 个布尔值 | v4 中 S1 到 S14 | TOXICITY 及 5 个变体 |
| 输入 | 文本与图像 | v4：图像与文本 | 文本 |
| 语言 | 多语言效果提升 42% | 8 种语言 (v3) | 未说明 |
| 成本 | 对多数开发者免费 | 开放权重 | 研究基线 |
| 适用场景 | 想要托管 API | 自托管，S14 代码滥用 | 与研究结果对比 |

## 严重级别规则
type: concepts
from: phases/19-capstone-projects/85-content-classifier-integration/docs/en.md, phases/19-capstone-projects/85-content-classifier-integration/code/classifiers.py

- **high**：拦截。丢弃输出，返回策略拒答。
- **medium**：脱敏。应用每个分类器的脱敏器。
- **low**：警告。记录日志并附加温和提示。
- **none**：记录日志。原样发出输出。
- **取最大**：脱敏加警告结果为脱敏。
- **pii**：ssn 或卡号为 high。三处发现或一个邮箱为 medium。
- **instruction-leakage**：0.85 为 high，0.70 为 medium，0.55 为 low。
- **toxicity**：命中 3 次为 high，2 次 medium，1 次 low。

## 输出路由器
type: architecture
from: phases/19-capstone-projects/85-content-classifier-integration/docs/en.md, phases/19-capstone-projects/85-content-classifier-integration/code/main.py

```arch
node | out | 1,2 | Model output | | model
node | tox | 2,1 | toxicity | slur and harassment | process
node | pii | 2,2 | pii | email, phone, ssn, card, ip | process
node | leak | 2,3 | instruction-leakage | trigram overlap | process
node | router | 3,2 | Router | max severity | process
node | act | 4,2 | Action | block, redact, warn, log | store
edge | out | tox |
edge | out | pii |
edge | out | leak |
edge | tox | router | verdict
edge | pii | router | verdict
edge | leak | router | verdict
edge | router | act |
```

## 故障排查
type: troubleshooting
from: phases/15-autonomous-systems/18-llama-guard/docs/en.md, phases/15-autonomous-systems/18-llama-guard/code/main.py, phases/18-ethics-safety-alignment/29-moderation-systems-openai-perspective-llamaguard/docs/en.md, phases/19-capstone-projects/85-content-classifier-integration/docs/en.md, projects/sensitive-text-redaction-gate/API.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 用 emoji 夹带的请求通过 | tokenizer 合并 emoji 的方式不同 | 增加规范化步骤 |
| 西里尔形近字母通过 | 分类器只用英文训练 | `normalize(text)`：NFKC、形近字映射 |
| 编码攻击得逞 | 只做输入审核 | 增加输出审核 |
| 所有输入都到达模型 | 只做输出审核 | 增加输入审核 |
| "you are not a slur" 触发规则 | 没有否定检查 | 在匹配前设否定窗口 |
| 大片段的其余部分泄露 | 小的嵌套匹配被移除 | 把相交片段合并为一个并集 |

## 工具调用防火墙
type: flow
from: projects/tool-call-firewall/solution/stage1.rs, projects/tool-call-firewall/solution/stage2.rs, projects/tool-call-firewall/solution/stage3.rs, projects/tool-call-firewall/solution/stage4.rs, projects/tool-call-firewall/README.md

1. **call**：`call(line, max_bytes)` 拆分 `id|role|tool|argument` 并拒绝控制字符。
2. **decide**：`read` 为 `Allow`。Editor `write` 为 `ApprovalRequired`。其他角色为 `Deny`。
3. **authorize**：审批必须与完整调用一致且未被使用，否则 `Error::Conflict`。
4. **dispatch**：目标必须是已存在的、受限目录内的文件。内容最多 16384 字节。
5. **audit**：每个 request id 一行制表符分隔记录。重复的 id 为 `Error::Conflict`。

## 脱敏关卡 API
type: task-table
from: projects/sensitive-text-redaction-gate/API.md, projects/sensitive-text-redaction-gate/solution/main.py

| 任务 | 代码 |
|---|---|
| 查找 EMAIL、IPV4、LITERAL 片段 | `detect(text, literals=())` |
| 合并相交片段 | `merge_spans(spans, text_length)` |
| 替换为 `[REDACTED]` | `redact(text, literals=())` |
| 检查最多 10000 条记录 | `process(records, literals=())` |
| 渲染偏移量账本 | `render_html(report)` |

## 运行项目
type: command-table
span: 2
from: projects/sensitive-text-redaction-gate/README.md, projects/tool-call-firewall/README.md

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py <project> --init learning-artifacts/<project>` | 创建学习者工作区 |
| `python3 scripts/project_test.py <project> --all --solution --strict` | 测试参考实现 |
| `python3 cli.py samples/input.jsonl --literals samples/literals.json --output demo-output` | 写出 redacted.jsonl、receipt.json 和 review.html |
| `rustc --edition=2021 <dir>/cli.rs -o <dir>/firewall` | 构建防火墙 CLI |
| `<dir>/firewall <root> reader r1 read notes.md` | 通过关卡读取文件 |

## 问答
type: qa
from: phases/11-llm-engineering/12-guardrails/docs/en.md, phases/15-autonomous-systems/18-llama-guard/docs/en.md, projects/sensitive-text-redaction-gate/API.md, projects/tool-call-firewall/README.md, phases/19-capstone-projects/85-content-classifier-integration/docs/en.md

- **为什么输入和输出都要检查？** 攻击者能绕过任何单独一层。
- **一个守卫分类器够吗？** 不够。Emoji Smuggling 在六个守卫系统上达到 100% ASR。
- **角色由谁提供？** 调用方应用。模型只提供操作。
- **输出检查会增加延迟吗？** 与 token 流式输出并行运行，缓冲最后一块。
