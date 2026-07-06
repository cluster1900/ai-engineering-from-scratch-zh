---
name: browser-agent-trust-boundary
description: 在 agent 触达真实站点之前，界定一个拟议 browser-agent deployment——trust zones、authorized writes、required defenses。
version: 1.0.0
phase: 15
lesson: 11
tags: [browser-agents, prompt-injection, trust-boundary, osworld, webarena]
---

给定一个拟议 browser-agent workflow，生成一份 trust-boundary scoping document，枚举每一次 read、每一次 write，以及首次运行所需的最小 defense stack。

生成：

1. **Read surface.** 列出 agent 将 fetch 的每个 origin。将每个 origin 分类为 in-trust（由用户组织运营的 first-party sites）或 out-of-trust（任何 third-party、任何 user-generated content、任何 search result）。所有 out-of-trust reads 都必须被视为潜在 prompt-injection channels。
2. **Write surface.** 列出 agent 被授权执行的每个 consequential action（submit form、post content、call a backend tool、write to memory）。对每一项，说明 blast radius，以及该 action 是否可逆。
3. **Required defenses.** 最小 stack：content sanitizer、read/write boundary（当 content_origin 为 out-of-trust 时，writes 需要新的批准）、每个 task 的 tool allowlist、带 scoped credentials 的 session isolation、persistent memory 上的 canary tokens、对 irreversible actions 的 HITL。
4. **Benchmark-to-distribution fit.** 如果 agent 报告 BrowseComp、OSWorld 或 WebArena-Verified 分数，说明该 benchmark 与真实 task 之间的 distribution overlap。高 BrowseComp 分数不能预测 booking-flow reliability。
5. **Known-attack checklist.** 确认 deployment 已针对以下攻击加固：(a) visible-text injection，(b) URL-fragment / query injection，(c) memory-binding attacks（Tainted Memories 类），(d) authenticated sessions 上的 CSRF-shaped attacks，(e) one-click hijacks。对每一项，命名具体 defense 以及它在哪里触发。

硬性拒绝：
- Browser agents 拥有 production credentials 访问权限且没有 session isolation。
- 任何 deployment 中，由 out-of-trust content 发起的 write 不需要新的 HITL approval。
- 任何仅依赖 content sanitizer 的 deployment（sanitizers 能捕获容易的攻击；复杂 payload 会通过）。
- Persistent memory 没有 canary entries。
- 触达 financial transactions 或 customer data 的 workflows，在 writes 上没有 HITL。

拒绝规则：
- 如果用户无法说明 injection-driven wrong write 的 blast radius，则拒绝并要求提供一句明确说明。
- 如果用户提出在无法使用 scoped credentials 的 stack 上运行 browser agent，则拒绝并要求先建立单独 identity。
- 如果用户引用 benchmark score（BrowseComp、OSWorld、WebArena）作为 agent“能够”执行 production task 的证据，则拒绝并要求在真实 distribution 上进行 internal evals。

输出格式：

返回一份 trust-boundary memo，包含：
- **Read surface table**（读取来源、是否在 trust boundary 内 / 外）
- **Write surface table**（action、blast radius、reversible y/n）
- **Defense stack**（已配置 layers 的项目列表）
- **Benchmark-fit note**（如适用）
- **Known-attack checklist**（五行，每行命名 defense）
- **部署结论**（production / staging / research-only）
