# 术语表

> 本页定义本手册用到的每个术语，并给出对应的 SGLang 术语。

某一节用到你不认识的术语时，查本页。

| 术语 | 含义 | SGLang 术语 |
|---|---|---|
| API 服务器（API server） | 处理 HTTP、做 tokenize 并以流式返回回答的进程 | 主进程中的 tokenizer manager |
| 异步调度（async scheduling） | 在 GPU 运行当前 step 时规划下一个 step | overlap scheduler |
| attention backend | 计算 attention 的 kernel 家族 | attention backend |
| block | KV cache 中固定的一组 16 个 token | page，默认 page 大小为 1 |
| block 池（block pool） | 启动时分配的所有 KV block | KV pool |
| chunked prefill | 把长 prompt 拆到多个 step 中 | chunked prefill |
| 时钟下限（clock floor） | 我们的扫描工具对一次运行接受的最低 SM 中位时钟，低于它就重跑这次运行 | 不是 SGLang 术语 |
| CUDA graph | 一串录制下来、用一次调用回放的 kernel 启动 | CUDA graph |
| engine core | 运行 scheduler 和 KV cache 管理器的进程 | scheduler 进程 |
| 固定池（fixed pool） | 我们用 `--num-gpu-blocks-override` 手动设定的 KV 池，让两个引擎获得相同的空间 | 不是 SGLang 术语 |
| ITL | inter-token latency，同一个流中两个 token 之间的时间 | ITL |
| 拐点（knee） | 延迟开始快速上升、而输出不再增长时的并发数 | 不是 SGLang 术语 |
| KV cache | 过去 token 的 key 和 value，保留给后续 step 使用 | KV cache |
| KV connector | 在 GPU 之外加载和保存 KV block 的接口 | disaggregation 传输 backend 与 HiCache 存储 |
| Model Runner V2 | worker 中构建 batch 并运行前向计算的较新代码 | model runner |
| 抢占（preemption） | 停下一个运行中的请求以释放它的 block，之后再重新计算它 | retraction |
| prefix caching | 复用匹配的 prompt 前缀的 KV block | radix cache |
| reasoning parser | 把推理模型的思考内容从回答文本中移出的服务器选项 | reasoning parser |
| 降频（throttled） | 因为 GPU 过热或与其他工作共享功耗而低于满频运行 | 不是 SGLang 术语 |
| token 预算（token budget） | scheduler 在一个 step 中分配的最多 token 数 | chunked prefill 大小与运行请求上限的组合 |
| TPOT | time per output token，一个请求每个输出 token 的平均时间 | TPOT |
| TTFT | time to first token，首 token 时间 | TTFT |
| 波次（waves） | 我们以 16 个用户发送 64 个 prompt 的负载，用一个长度比例设定长度的变化幅度 | 不是 SGLang 术语 |
| worker | 持有一块 GPU 权重的进程 | TP worker |

Sources: vLLM documentation at v0.31.0 (docs/design/arch_overview.md, docs/design/prefix_caching.md), the SGLang 101 manual of this course.
