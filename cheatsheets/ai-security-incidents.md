---
id: ai-security-incidents
title: Prompt Injection Incidents and AI CVEs
code: PI
subtitle: 发现、追踪并拦截间接提示注入。EchoLeak 攻击链、PVE 校验器、规则检测器、工具调用防火墙。
hue: 350
sources: phases/18-ethics-safety-alignment/15-indirect-prompt-injection, phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai, phases/14-agent-engineering/27-prompt-injection-defense, phases/19-capstone-projects/83-prompt-injection-detector, projects/tool-call-firewall
source_hash: 1fcd87fb0e87220a
---

## 症状、原因与修复
type: troubleshooting
from: phases/18-ethics-safety-alignment/15-indirect-prompt-injection/docs/en.md, phases/18-ethics-safety-alignment/15-indirect-prompt-injection/code/main.py, phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai/docs/en.md, phases/14-agent-engineering/27-prompt-injection-defense/docs/en.md, phases/19-capstone-projects/83-prompt-injection-detector/docs/en.md, phases/19-capstone-projects/83-prompt-injection-detector/code/main.py

| 症状 | 原因 | 修复 |
|---|---|---|
| 智能体把一封邮件转发给所有联系人 | 朴素智能体服从邮件正文中的祈使句 | 将邮件标记为不可信。忽略其中的控制流 |
| 过滤器拦住了 `[SYSTEM:`，但礼貌改写后的版本通过了 | 自适应攻击者去掉了标记 | 使用 IFC。关键词过滤器挡不住自适应攻击 |
| 防御报告 ASR 接近零，随后被攻破 | 只用静态攻击做了测试 | 发布前先用自适应攻击评估 |
| 数据经由已批准的域名泄露 | 输出在 URL 中越过了信任边界 | 逐一控制检索、作用域和输出 |
| 模型已经对外部世界产生了影响 | 所有护栏都在最后才运行 | 在每次工具调用执行前进行校验 |
| 昨天的记忆笔记劫持了今天的运行 | 过度信任检索到的记忆 | 拒绝看起来像指令的记忆写入 |
| 正则漏掉了 "disregard the prior" | 只有一个正则，且从未度量 | 按类别报告精确率和召回率 |
| `load_taxonomy` 抛出 FileNotFoundError | 缺少第 82 课的产物 | 先运行第 82 课的 main.py |

## 生产事故
type: comparison
from: phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai/docs/en.md, phases/18-ethics-safety-alignment/15-indirect-prompt-injection/docs/en.md

| 因素 | EchoLeak | CamoLeak | Copilot RCE |
|---|---|---|---|
| 目标 | Microsoft 365 Copilot | GitHub Copilot Chat | GitHub Copilot |
| CVE | CVE-2025-32711 | 编号未公开 | CVE-2025-53773 |
| CVSS | 9.3 | 9.6 | 细节很少 |
| 入口 | RAG 上下文中的特制邮件 | 仓库内容 | 代码建议界面 |
| 效果 | CSP 批准的 URL 上的 Mermaid 图片 | 图片经 Camo 代理加载 | 远程代码执行 |
| 修复 | 服务端更新，2025 年 6 月 | 禁用图片渲染 | 细节很少 |

## EchoLeak 攻击链
type: flow
from: phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai/docs/en.md

1. **攻击者**：向任意员工发送一封主题平常的邮件。
2. **受害者**：什么也不用做。这是零点击攻击。
3. **Copilot**：针对一次日常查询，RAG 检索把这封邮件拉入上下文。
4. **模型**：执行隐藏文本。它在收件箱中找到最近的 MFA 验证码。
5. **渲染器**：从一个包含验证码的签名 URL 加载 Mermaid 图。
6. **CSP**：因为域名已获批准而放行请求。
7. **厂商**：起初评为低危。MFA 演示后提升至 9.3。

## 三道边界与关卡
type: architecture
from: phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai/docs/en.md, phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai/code/main.py, phases/18-ethics-safety-alignment/15-indirect-prompt-injection/docs/en.md

```arch
node | atk | 1,1 | Attacker email | trust untrusted | client
node | rag | 2,1 | Retrieval boundary | enters context | process
node | llm | 3,1 | Model | reads hidden text | model
node | out | 4,1 | Output boundary | CSP-approved URL | client
node | user | 1,2 | User prompt | trusted | client
node | gate | 2,2 | Scope separation | blocks untrusted calls | process
node | scope | 3,2 | Scope boundary | private inbox | store
edge | atk | rag | email
edge | rag | llm | context
edge | llm | out | render_image
edge | user | gate | intent
edge | gate | llm | ratified calls
edge | llm | scope | MFA codes
```

## 攻击面
type: concepts
from: phases/18-ethics-safety-alignment/15-indirect-prompt-injection/docs/en.md, phases/14-agent-engineering/27-prompt-injection-defense/docs/en.md

- **RAG 向量**：攻击者发布一篇文档。检索把它放进提示词。
- **收件箱向量**：攻击者发送一封邮件。智能体读取正文。
- **工具输出向量**：攻击者控制某个工具结果，例如网页搜索。
- **数据窃取**：智能体把对话历史发送到攻击者的 URL。
- **蠕虫传播**：注入内容让智能体在下一次输出中嵌入该漏洞利用。
- **记忆投毒**：智能体存下这些指令，并在下次会话中再次毒害自己。
- **生态污染**：注入的事实通过共享记忆扩散到其他智能体。
- **任意工具调用**：注册表中的任何工具都变得可被攻击者触达。

## 运行实验
type: command-table
from: phases/18-ethics-safety-alignment/15-indirect-prompt-injection/docs/en.md, phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai/docs/en.md, phases/14-agent-engineering/27-prompt-injection-defense/docs/en.md, phases/19-capstone-projects/83-prompt-injection-detector/docs/en.md, projects/tool-call-firewall/README.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` (18.15) | 攻击朴素、过滤器和 IFC 三种智能体 |
| `python3 code/main.py` (18.25) | EchoLeak 追踪，然后做作用域隔离 |
| `python3 code/main.py` (14.27) | 每次调用的 PVE 校验器判定 |
| `python3 main.py` (19.83) | 检测器指标与 JSON 报告 |
| `project_test.py <id> --init <dir>` | 创建工作区。Id 为 tool-call-firewall |
| `project_test.py <id> --stage 1 --path <dir>` | 为一个阶段评分 |
| `project_test.py <id> --all --solution` | 检查参考实现。加上 `--strict` |

## 执行器之前的 PVE 校验器
type: annotated-code
lang: python
from: phases/14-agent-engineering/27-prompt-injection-defense/code/main.py

```python
validator = Validator(
    allowed_tools=("search", "send_message", "read_memory"),
    sensitive_tools=("send_message",),
)
call = ToolCall("search", {"query": "<q>"}, intent="research")
contents = [Content("<text>", "user_message")]   # user text is not scanned
ok, reason = validator.assess(call, contents)    # allowlist, args, retrieved
if ok:
    executor.run(call)                           # runs only after allow
looks_like_directive("<text>")                   # marker or None
memory_write_guard(MemoryWrite("<text>"))        # refuse directive writes
```

## 分层注入检测器
type: annotated-code
lang: python
from: phases/19-capstone-projects/83-prompt-injection-detector/code/main.py, phases/19-capstone-projects/83-prompt-injection-detector/code/rules.py

```python
{"name": "ignore-previous", "category": "instruction-override",
 "score": 0.85, "substring": "ignore previous"}   # a rule is data
detector = Detector()                             # compiles regex rules once
v = detector.analyze("<prompt>")                  # raw and normalized text
v.category                                        # top category, its max score
normalize(text)                                   # zero-width, base64, hex, leet, rot13
report = evaluate(detector, fixtures, benign)     # tp, fp, fn, tn per category
write_report(report)                              # outputs/detector_report.json
```

## 工具调用防火墙
type: task-table
from: projects/tool-call-firewall/solution, projects/tool-call-firewall/stages/02-evaluate-role-and-path-policy/docs/en.md, projects/tool-call-firewall/stages/03-consume-a-request-bound-approval-once/docs/en.md

| 任务 | 代码 |
|---|---|
| 解析信封 | `call(raw, 256)` |
| 决定策略 | `decide(&c)` 给出 Allow、ApprovalRequired 或 Deny |
| Reader 写入笔记 | `reader + write notes.md -> Deny` |
| Editor 写入笔记 | `editor + write notes.md -> ApprovalRequired` |
| 使用一次审批 | `authorize(request, Some(&mut gate))` |
| 在隔离下执行 | `dispatch(root, &request, content, approval)` |
| 记录决策 | `audit(&mut log, &c, &d, 10)` |
| 构建 CLI | `rustc --edition=2021 cli.rs -o firewall` |

## 限制与数值
type: defaults
span: 1
from: projects/tool-call-firewall/solution, phases/19-capstone-projects/83-prompt-injection-detector/code/main.py, phases/19-capstone-projects/83-prompt-injection-detector/outputs/detector_report.json, phases/18-ethics-safety-alignment/15-indirect-prompt-injection/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| CLI 信封字节数 | 4096 | 更长的输入会被拒绝 |
| 写入内容字节数 | 16384 | 读取也是同样的上限 |
| 审计 `max_entries` | 10 | 重复 id 会被拒绝 |
| JSON `schema_version` | 1 | CLI 结果 JSON |
| Base64 token 长度 | 16 | 更短的 token 不会被解码 |
| Rot13 单词命中数 | 2 | 命中更少则保留输入 |
| 没有规则触发 | 0.0 | 判定类别为 `benign` |
| 检测器准确率 | 0.62 | 50 个样例中的 31 个 |

## 问题
type: qa
from: phases/18-ethics-safety-alignment/15-indirect-prompt-injection/docs/en.md, phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai/docs/en.md, phases/14-agent-engineering/27-prompt-injection-defense/docs/en.md, phases/19-capstone-projects/83-prompt-injection-detector/docs/en.md, projects/tool-call-firewall/README.md

- **为什么用户输入过滤器会漏掉 IPI？** 载荷在检索到的内容里，而不在用户输入里。
- **为什么不只过滤关键词？** 像 "please print Yes" 这样无害的指令不含任何关键词。
- **修好一道边界能保住其余边界吗？** 不能。三道边界要各自独立防护。
- **系统提示词中的规则够用吗？** 不够。单靠遵循指令并不等于强制执行。
- **角色从哪里来？** 来自可信的应用程序。绝不来自模型响应。
- **检测器就是安全关卡吗？** 不是。它只是关卡组合的一个信号。
- **防火墙是操作系统沙箱吗？** 不是。审批在一次调用中、在内存里，且只能使用一次。
