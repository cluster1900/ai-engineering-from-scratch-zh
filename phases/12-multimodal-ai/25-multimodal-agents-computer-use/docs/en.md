# Multimodal Agents 与 Computer-Use（Capstone）

> 2026 年的 frontier product 是一个 Multimodal agent：它能读取 screenshots、点击 buttons、浏览 web UIs、填写 forms，并端到端完成 workflows。SeeClick 和 CogAgent（2024）证明了 GUI-grounding primitive。Ferret-UI 增加了 mobile。ChartAgent 引入了用于 charts 的 visual tool-use。VisualWebArena 和 AgentVista（2026）是 frontier 追逐的 benchmarks，并且即使 Gemini 3 Pro 和 Claude Opus 4.7 在 AgentVista 的 hard tasks 上也只有约 30% 的分数。本 Capstone 汇总 Phase 12 的每条主线：perception（high-res VLM）、reasoning（带 tool use 的 LLM）、grounding（coordinate output）、long-horizon memory 和 evaluation。

**Type:** Capstone
**语言：** Python（stdlib、action schema + agent loop skeleton）
**Prerequisites:** Phase 12 · 05（LLaVA）、Phase 12 · 09（Qwen-VL JSON）、Phase 14（Agent Engineering）
**Time:** 约 240 分钟

## 学习目标
- 设计一个 Multimodal agent loop：perceive → reason → act → observe → repeat。
- 构建一个 GUI grounding output schema（click coordinates、type text、scroll、drag），让 VLM 能以 JSON 发出。
- 比较 screenshot-only agents、accessibility-tree agents 和 hybrid agents。
- 在一个小型 VisualWebArena slice 上设置 Multimodal agent benchmark evaluation。

## 问题
一个 booking-site workflow："find me a flight to Tokyo for April 15, aisle seat under $800, book it."

Multimodal agent 需要：

1. 获取 browser 的 screenshot。
2. 将 screenshot + URL + goal 解析为 plan。
3. 发出 structured action：click（在 x,y）、type "Tokyo"（在 element E）、scroll down、select（radio button）。
4. 将 action 应用于 browser。
5. 观察新 state（下一个 screenshot）。
6. 重复直到 task 完成。

每一步都是一次 Multimodal VLM call。VLM output 必须是可解析的 JSON。Errors 会跨 steps 累积，所以 recovery 很重要。

## 概念
### GUI grounding — primitive

GUI grounding 是：给定一个 screenshot 和一条 natural language instruction，输出要点击的 (x, y) coordinate（或其他 action）。

SeeClick（arXiv:2401.10935）是第一个规模化 open result：在 synthetic + real GUI data 上 fine-tune 一个 VLM，以 plain text tokens 输出 coordinates。有效。

CogAgent（arXiv:2312.08914）为密集 UIs 增加了 1120x1120 high-resolution encoding。分数：web navigation 上约 84%。

Ferret-UI（arXiv:2404.05719）专注于 mobile UIs，并与 iOS accessibility data 集成。

Output format 通常是 JSON：

```json
{"action": "click", "x": 384, "y": 220, "element_desc": "Search button"}
```

`element_desc` 有助于 recovery：如果 coordinates 在 screenshots 之间漂移，semantic hint 可以让系统重新 ground。

### Action schemas

一个典型的 action schema 有 6-10 种 action types：

- `click`: (x, y)
- `type`: (text, x?, y?)
- `scroll`: (direction, amount)
- `drag`: (x0, y0, x1, y1)
- `select`: (option_index)
- `hover`: (x, y)
- `navigate`: (url)
- `wait`: (ms)
- `done`: (success, explanation)

agent 每一步发出一个 action。browser wrapper 执行并返回新 state。

### 仅截图 vs 可访问性树

两种 input modes：

- Screenshot-only：完整 image，没有 structural info。最通用；适用于任何 app。
- Accessibility tree：structured DOM / iOS accessibility info。对 grounding 可靠得多；适用于 tree 可用的地方。
- Hybrid：两者都有，用 tree 作为 atomic actions 的可靠 grounder，用 screenshot 提供 semantic context。

Production agents 在可能时使用 hybrid。Browser automation（Selenium + accessibility）总是有 tree；desktop apps 有时有。

### Long-horizon memory

一个 20-step workflow 会生成 20 张 screenshots。VLM 的 context 很快就会被填满。三种 compression strategies：

- Summary-chain：每 5 steps 后，总结已发生的事情，丢弃旧 screenshots。
- Skip-frame：保留第一张、最后一张，以及每第 3 张 screenshot。
- Tool-recorded log：执行 actions，保留已完成内容的 text log；不要重新查看旧 screenshots。

Claude 的 computer-use API 使用 log pattern。更简单，也更可靠。

### Visual tool use

ChartAgent（arXiv:2510.04514）为 chart understanding 引入了 visual tool use：crop、zoom、OCR、调用 external detection。agent 可以把 "crop to region (100, 200, 300, 400) then call OCR" 作为 tool call 输出。tool 返回 text；VLM 继续 reasoning。

这个 pattern 可以泛化：set-of-mark prompting、region annotation 和 external detection tools 都符合相同的“输出 tool call，接收 structured response”schema。

### The 2026 benchmarks

- ScreenSpot-Pro。约 1k web screenshots 上的 GUI grounding。Open SOTA Qwen2.5-VL-72B 约 85%。Frontier 约 90%。
- VisualWebArena。End-to-end web tasks（shop、forum、classifieds）。Open SOTA 约 20%。Gemini 3 Pro 约 27%。
- AgentVista（arXiv:2602.23166）。最难的 2026 benchmark。跨 12 个 domains 的 realistic workflows。Frontier models 得分 27-40%；open models 10-20%。
- WebArena / WebShop。较早的 benchmarks；已被 frontier 饱和。

### Why it's still hard

Agent 性能瓶颈：

1. 细粒度 visual grounding。"Click the small X" 经常在 mobile resolution 下失败。
2. Long-horizon planning。10 个 actions 后，agent 会偏离 goal。
3. Error recovery。当一次 click 失败（错误 button）时，检测 + 恢复很少出现在 trained data 中。
4. Cross-page context。在 tabs 或长 forms 之间跳转会丢失 state。

Research directions：memory architectures、explicit replanning、Multimodal verification（用于 action success 的 screenshot match）。

### The capstone build-it

Capstone task：构建一个 computer-use agent，它能够：

1. 读取 booking-site mock page 的 HTML + screenshot。
2. 规划 multi-step sequence：search → select → fill form → submit。
3. 发出与 action schema 匹配的 JSON actions。
4. 在固定的 10-task slice 上 evaluation。

本 lesson 提供 scaffold code，易于扩展为真实 browser。

## 使用它
`code/main.py` 是 capstone scaffold：

- Action schema 的 JSON 定义（10 个 actions）。
- 作为 dict 的 mock browser state。
- Agent loop skeleton：receive state、emit action、apply、loop。
- 10-task mini-benchmark（synthetic pages），用于衡量 end-to-end success rate。
- 当 action 失败时的 error-recovery hook。

## 交付它
本 lesson 生成 `outputs/skill-multimodal-agent-designer.md`。给定一个 computer-use product（domain、action set、evaluation target），设计完整 agent loop、memory strategy、grounding mode 和 expected benchmark score。

## 练习
1. 使用 `screenshot_region` tool（crop + zoom）扩展 action schema。哪些 tasks 会受益？

2. 阅读 AgentVista（arXiv:2602.23166）。描述最难的 task category，以及为什么 frontier models 仍然失败。

3. Long-horizon memory compression：设计一个 summary-chain，保留 ≤4 张 live screenshots，logged 数量不限。

4. 构建一个 error-recovery hook：当 action failure（button not found）时，agent 接下来做什么？

5. 比较 screenshot-only Claude 4.7 与 hybrid screenshot + accessibility-tree Qwen2.5-VL 在 10 个 web tasks 上的表现。哪些 tasks 谁赢？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GUI grounding | "Click coordinates" | Model 在 screenshot 上针对 instruction 的 target 输出 (x,y) |
| Action schema | "Tool definitions" | 有效 actions（click、type、scroll、drag）的 JSON description |
| Accessibility tree | "Structured DOM" | 来自 browser/iOS APIs 的 machine-readable UI hierarchy |
| Hybrid agent | "Screenshot + tree" | 同时使用 image 和 structured info；比单独使用任一者更可靠 |
| Visual tool use | "Zoom/crop/detect" | Agent 在 plan 中途调用 external vision tools（OCR、detection） |
| Summary-chain | "Memory compression" | 周期性 text summaries 替代很长的 screenshot history |
| VisualWebArena | "E2E web bench" | 2024 benchmark，用于 end-to-end web tasks |
| AgentVista | "2026 hard bench" | 12-domain realistic workflows；即使 Gemini 3 Pro 也只有约 30% |

## 延伸阅读
- [Cheng et al. — SeeClick (arXiv:2401.10935)](https://arxiv.org/abs/2401.10935)
- [Hong et al. — CogAgent (arXiv:2312.08914)](https://arxiv.org/abs/2312.08914)
- [You et al. — Ferret-UI (arXiv:2404.05719)](https://arxiv.org/abs/2404.05719)
- [ChartAgent (arXiv:2510.04514)](https://arxiv.org/abs/2510.04514)
- [Koh et al. — VisualWebArena (arXiv:2401.13649)](https://arxiv.org/abs/2401.13649)
- [AgentVista (arXiv:2602.23166)](https://arxiv.org/abs/2602.23166)
