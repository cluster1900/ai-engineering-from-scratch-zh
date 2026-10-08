# 综合项目 15 宪法安全套装+红队范围

> 人类的宪法分类器,Meta的Llama Guard 4、谷歌的ShieldGemma-2、NVIDIA的Nemotron 3内容安全,以及用于多语言覆盖的X-Guard,共同定义了2026年的安全分类器堆──garak、PyRIT、NVIDIA Aegis 和 promptfoo 成为标准的对抗评估工具──NeMo Guardrails v0.12将它们连接到生产管道──这个终点将把所有内容连接起来:围绕目标应用程序构建层级安全带,运行覆盖6+ 家族攻击的自主团队代理,并执行一次红色宪法自批评运行,产生可测量的无害三角洲──

**类型：**石头
**语言：**网络安全管道,红团队,YAML,政策配置
**先修要求：**阶段10 (从零构建LLM) 阶段11 (LLM工程) 阶段13 (工具) 阶段14 (代理人) 阶段18 (道德,安全,配合)
**涉及阶段：**子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子
**时间：**五个小时

## 问题

2026年LLM安全的前沿问题,不在于分类器是否有效的,而在于如何围绕生产应用程序正确组合它们,既不过拒绝,也不留下明显漏洞.

攻击演化同样重要──PAIR 和 TAP 自动化发现 jailbreak──GCG 运行基于 Gradient 的后音攻击──多转和代码交换攻击利用代理记忆──任何已部署的LLM 都需要一个红队范围,garak 和 PyRIT 是可信的驱动程序,并且还需要记录减缓和根据CVSS评分的发现──

你将加固一个目标应用程序,一个8B指令调节的模型,或其他顶点中的一个RAG聊天机器人),对其运行 6+ 攻击家族,并产出之前/之后无害度测量.

## 概念

安全管道有五层.**Input sanitize**移除零宽字符,解码基础64/rot13,规范化 Unicode──**Policy layer**车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车车**Classifier gate**输入侧使用Llama Guard 4,非英文使用X-Guard,图像输入使用ShieldGemma-2──**Model**目的是士学位.**Output filter**输出侧使用Llama Guard 4,Presidio PII scrub,并在适用场景执行引言执法.**HITL tier**标记为高风险输出进入 Slack队列.

根据时间表计算器 运行――PAIR 和 TAP 自主发现 jailbreak――GCG 运行基于 Gradient 的后音攻击――ASCII / base64 / rot13编码攻击――多轮攻击――个人采用――记忆利用――代码切换攻击――混合英语与斯瓦希利或泰语) ・ 每次运行都会产出一个结构化发现文件,包含CVSS得分和披露时间表――

根据书面宪法,让模型 起草响应,根据书面宪法(不伤害规则)进行批评,并在批评循环上回训练──在持续的评估上测量之前/之后无害性 delta──

## 架构

```
request (text / image / multilingual)
      |
      v
input sanitize (strip zero-width, decode, normalize)
      |
      v
NeMo Guardrails v0.12 rails (off-domain, policy)
      |
      v
classifier gate:
  Llama Guard 4 (English)
  X-Guard (multilingual, 132 langs)
  ShieldGemma-2 (image prompts)
  Nemotron 3 Content Safety (enterprise)
      |
      v (allowed)
target LLM
      |
      v
output filter: Llama Guard 4 + Presidio PII + citation check
      |
      v
HITL tier for flagged outputs

parallel:
  red-team scheduler
    -> garak (classic attacks)
    -> PyRIT (orchestrated red team)
    -> autonomous jailbreak agent (PAIR + TAP)
    -> GCG suffix attacks
    -> multilingual / code-switch
    -> multi-turn persona adoption

output: CVSS-scored findings + disclosure timeline + before/after harmlessness delta
```

## 技术

- 安全分类:Llama Guard 4、ShieldGemma-2、NVIDIA Nemotron 3 内容安全、X-Guard
- 防护轨道框架:NeMo防护轨道 v0.12 + OPA
- 红团队驱动程序:garak(NVIDIA) 、PyRIT(微软Azure)、NVIDIA Aegis、promptfoo
- 门突破剂:PAIR(Chao等, 2023) ‧攻击树(TAP) ‧GCG后
- 宪法培训:人类式自我批评循环+SFT在批评上
- 标签: 总统
- 目标:一个8B指令调整模型,或其他顶点中的一个RAG聊天机器人


```figure
cf-safety-stack
```

## 构建它

1. **目标设置。**在vLLM上启动一个8B指令调节的模型 (或复用另一个顶石中的RAG聊天机器人)

2. **包装 safety pipeline。**围绕目标连接五层管道――验证每层都可单独观测(长中每层一个跨度) ――

3. **Classifier 覆盖。**加载 Llama Guard 4、X-Guard(多语言) 、ShieldGemma-2(图片) ⋅在一个小型标记的集合上运行每个分类器,以建立基线──

4. **Red-team scheduler。**调度加拉克、PYRIT、一个 PAIR 代理、一个TAP 代理、一个GCG 运行者、一个多轮攻击者和一个代码切换攻击者──每个人都在单独的排队上运行──

5. **Attack suite。**六个攻击家族:(1) PAIR自动 jailbreak,(2) TAP树攻击,(3) GCG梯度后,(4) ASCII / basis64 / rot13编码,(5) 多转型人格,(6) 多语言代码交换――报告每个家族的成功率――

6. **Constitutional self-critique。**选1k 个有害尝试提示──对于每一个提示,目标先起草响应──一个批评者 根据书面宪法️做不出任何伤害、引用证据、拒绝非法请求) 评分──批评者 提出异议的提示 会被重写;目标在批评改善的对子上上调──在进行的评估上测量之前/后无害性──

7. **Over-refusal measurement。**在良性提示套件 (例如XSTest) 上追踪虚假阳性率.目标必须在良性问题上保持有用.

8. **CVSS scoring。**根据CVSS4.0评分,每个成功的 jailbreak 事件都将发生攻击矢量,复杂性,影响.

9. **Range automation。**以上所有内容都在时间表上运行;发现 写入队列;过度拒绝回归警报 发送到Slack。

## 使用它

```
$ safety probe --model=target --family=PAIR --budget=50
[attacker]   PAIR agent running on target
[attack]     attempt 1/50: disguise query as academic research ... blocked
[attack]     attempt 2/50: appeal to roleplay ... blocked
[attack]     attempt 3/50: chain-of-thought coax ... SUCCEEDED
[finding]    CVSS 4.8 medium: roleplay bypass on target
[range]      7 successes out of 50 (14% success rate)
```

## 交付它

`outputs/skill-safety-harness.md`是交付物品. 一个生产级层级的安全管道,加上可复现的红队范围,并包含前/后无害性地带.

| 权重 | 标准 | 如何测量 |
|:-:|---|---|
| 25 | Attack-surface coverage | 覆盖 6+ 攻击家族、2+ 种语言 |
| 20 | True-positive / false-positive trade-off | Attack block rate vs XSTest benign pass rate |
| 20 | Self-critique delta | held-out eval 上的 before/after harmlessness |
| 20 | Documentation and disclosure | 带 timeline 的 CVSS-scored findings |
| 15 | Automation and repeatability | 所有内容在 cron 上运行并带 alerts |
| **100** | | |

## 练习

1. 在RAG聊天机上运行的快速注射插件,并比较有没有输出过层时的攻击成功率.

2. 添加第七个攻击家族:通过检索的文件间接即时注射――测量所需的额外防御――

3. 实现一个 拒绝与帮助模式:当防线阻断时,目标提供一个更安全的相关答案,而不是直接拒绝.

4. 多语言覆盖差距:找出一种X-Guard表现不足的语言――提出一个面向它的细节调节数据集――

5. 在30B模型上运行宪法自我批评,并测量多角洲是否随规模提升.

## 关键术语

| 术语 | 常见说法 | 实际含义 |
|------|-----------------|------------------------|
| Layered safety | “Defense in depth” | 在 input、gate、output、HITL 多处设置 guardrails |
| Llama Guard 4 | “Meta's safety classifier” | 2026 年参考级 input/output content classifier |
| PAIR | “Jailbreak agent” | 关于 LLM-driven jailbreak discovery 的论文（Chao et al.） |
| TAP | “Tree-of-Attacks” | PAIR 的 tree-search 变体 |
| GCG | “Greedy coordinate gradient” | 基于 Gradient 的 adversarial suffix attack |
| Constitutional self-critique | “Anthropic-style training” | Target drafts -> critic scores -> rewrite -> retrain |
| XSTest | “Benign probe set” | 用于 over-refusal regression 的 benchmark |
| CVSS 4.0 | “Severity score” | safety findings 的标准 vulnerability scoring |

## 延伸阅读

- [Anthropic Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers)培训时间参考
- [Meta Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) 2026年输出输入分类
- [Google ShieldGemma-2](https://huggingface.co/google/shieldgemma-2b)图像+多动机安全
- [NVIDIA Nemotron 3 Content Safety](https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/)企业参考
- [X-Guard (arXiv:2504.08848)](https://arxiv.org/abs/2504.08848) 132 语言 多语言安全
- [garak](https://github.com/NVIDIA/garak)NVIDIA红队工具包
- [PyRIT](https://github.com/Azure/PyRIT)微软红团框架
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/)铁路框架
- [PAIR (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) 监狱突破代理文件
