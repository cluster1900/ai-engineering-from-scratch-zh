# vLLM 从哪里来

> 本页解释伯克利的项目、从 V0 到 V1 的转变，以及项目的治理。

你今天安装的 vLLM，是同名之下的第二个引擎。读完本节后，你能说出项目从哪里起步、为什么重写了引擎，以及现在由谁决定它的方向。

## 一个只有一个想法的伯克利项目 {#s-where-vllm-came-from-a-berkeley-project-with-one-idea}

这个仓库于 2023-02-09 在加州大学伯克利分校创建，由 Woosuk Kwon 提交了最初的 commit。第一个公开版本 v0.1.0 于 2023-06-20 发布，同时发布了一篇介绍 PagedAttention 的博客文章。关于同一想法的论文发表在 SOSP 2023 上。

这个想法是像操作系统用页存放内存那样，用固定的 block 存放 KV cache。这样一个服务器就能在一块 GPU 上容纳更多请求，请求之间也能共享 block。早期用户在 LMSYS 团队的 Chatbot Arena 和 Vicuna 演示背后运行它。

## 第一个引擎中的功能 {#s-where-vllm-came-from-features-in-the-first-engine}

在 2023 年到 2025 年之间，第一个引擎获得了本手册介绍的大部分功能：

| 版本 | 日期 | 新增了什么 |
|---|---|---|
| v0.3.0 | 2024-01-31 | 实验性的 multi-LoRA、实验性的 prefix caching，以及 FP8 KV cache |
| v0.4.0 | 2024-03-30 | 自动 prefix caching，以及早期的 chunked prefill 和投机解码 |
| v0.6.0 | 2024-09-04 | 默认设置下吞吐约为 v0.5.3 的两倍、异步输出处理器，以及可选的 multi-step scheduler |

我们的解读：每个功能都被加进了一个没有为它做过规划的设计里，代码变得越来越难改。

## 重写 {#s-where-vllm-came-from-the-rewrite}

团队构建了第二个引擎，称为 V1。它的目标是简单、模块化的代码库，几乎没有 CPU 开销，并默认开启主要的优化。V1 在 2025-01-27 的 v0.7.0 中作为测试版出现，默认开启 torch.compile。它在 2025-03-18 的 v0.8.0 中成为默认引擎。2025-10-02 的 v0.11.0 移除了旧引擎。

第 8 部分其他页面上的思想都来自这次重写。一个 token 预算取代了 prefill 和 decode 两条路径。chunked prefill 和 prefix caching 成为默认。进程拆分让 scheduler 有了自己的进程。Model Runner V2 后来重建了 model runner，团队说原来的 runner 有设计错误。

## 现在的发布节奏 {#s-where-vllm-came-from-releases-now}

在 v0.11 之前，每一到五个月发布一个新的 minor 版本。从 2025 年 12 月的 v0.12.0 起，大约每两周发布一个新的 minor 版本。到 2026-10-18，项目已在 GitHub 上发布了 108 个版本。每个版本都会改变默认值并移除已弃用的参数，所以几个月前的配置方案今天可能就是错的。本手册正是因此锁定 0.31.0。

## 谁在运营它 {#s-where-vllm-came-from-who-runs-it}

项目于 2024 年 7 月在 LF AI and Data Foundation 开始孵化流程。2025-05-07，它成为 PyTorch Foundation 托管的项目。五位首席维护者和 55 位活跃 committer 负责审查改动。多家公司向项目贡献工程师。Red Hat 在 2025 年 1 月收购 Neural Magic 时，把那个团队带了进来。

这样的节奏有代价，项目也在公开讨论。2026 年 9 月和 10 月，项目里的两份 RFC 指出，审查跟不上 pull request 的数量。一份提议设立 reviewer 角色。另一份提议由贡献者在自己的 GPU 上运行 eval 和基准测试，让 pull request 附带证据。

```takeaways
- vLLM 于 2023 年在伯克利以 PagedAttention 起步，也就是分页 KV cache 的想法。
- 在 v0.7.0 到 v0.11.0 之间，V1 引擎取代了第一个引擎。
- 大约每两周发布一个新的 minor 版本，所以要锁定你测试过的版本。
```

Sources: the GitHub release list of vllm-project/vllm (fetched 2026-10-22), the commit history of vllm-project/vllm (2023-02-09), the vLLM launch blog post vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention (2023-06-20), the PagedAttention paper Efficient Memory Management for Large Language Model Serving with PagedAttention (arXiv 2309.06180, SOSP 2023), the release notes for v0.1.0, v0.3.0, v0.4.0, v0.6.0, v0.7.0, v0.8.0, v0.11.0, and v0.12.0, the vLLM blog post vLLM V1: A Major Upgrade to vLLM's Core Architecture (2025-01-27), the vLLM blog post vLLM's Open Governance and Performance Roadmap (2024-07-25), the PyTorch Foundation post PyTorch Foundation Welcomes vLLM as a Hosted Project (2025-05-07), the Red Hat press release Red Hat Completes Acquisition of Neural Magic to Fuel Optimized Generative AI Innovation Across the Hybrid Cloud (2025-01-13), vLLM documentation at v0.31.0 (docs/governance/process.md, docs/governance/committers.md, docs/design/model_runner_v2.md), vLLM issues 58253 and 61698.
