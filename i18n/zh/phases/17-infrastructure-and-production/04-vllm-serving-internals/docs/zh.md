# 服务内部:页面关注,连续批量,零碎预填

> 2026年,vLLM的主导地位取决于三个相互叠加的默认设置,而不是某个单一技巧――PagedAttention 始终开启――持续批量会在解码演变之间将新请求输入活跃批量――碎片预填会切分长提示,让解码代码标志永远不会饿着――把这三种全部开放后,单张H100 SXM5 上的Llama 3.3 70B FP8 在 128 并发达可达到2,200-2,400 tok/s,比vLLM 自身默认值高约25%,约为简单的 PyTorch 的 3-4倍――本课程深入到你能绘图说明表和并关注内核层级循环,以`code/main.py`玩具中一个连续批量 结束,它会像vLLM 一样调调预填和解码.

**Type:** Learn
**Languages:** Python (stdlib, toy continuous batching scheduler)
**前置要求：**第17阶段 · 01 (服务模式),第11阶段 (LLM工程)
**Time:** ~75 minutes

## 学习目标
- 将 PagedAttention 解释为KV缓存分配器:区块,区块表以及为什么在生产负载下碎片化保持在4%以下.
- 在代层面画出连续批量:完成的序列 如何离开批量,新序列 如何加入,而不需要排水――
- 用一句话描述碎片预填,并说它保护的是哪个延迟度量标 (提示:是TTFT尾,而不是平均吞吐量)
- 让我们知道, 2026年,VLLM v0.18.0 中会影响那些一次性启动所有优化团队的变化.

## 问题
简单的 PyTorch 服务循环 一次运行一个请求:代码化,预填,解码直到EOS 返回. 一个用户时,这能工作. 一百个用户时,它就是一群耐心等待的人.显然,修复方式是静态批量,但它将窗口中的每个请求填充到最长的提示,把每个解码填充到最长的预期输出,并让整个批量由于最慢的序列而停滞.你为未使用的填充付出代价,快速请求也需要等待缓慢请求.

继续批量允许请求在每次解码代中加入和离开批量,因此批量始终充满真实工作──碎片预填32个将k-代币提示解组约512个代币的切片,并与解码交错执行,因此长提示不结论 GPU 上的每个解码代币──

2026年生产默认值是三者全部开放.你需要了解每个机制的作用,因为失败模式都在上调度器上,而不是模型上.

## 概念
### 页面关注 作为虚拟内存系统

对于每个序列,KV缓存是`num_layers × 2 × num_heads × head_dim × seq_len × bytes_per_element`△对于8192个代币的Llama 3.3 70B,在BF16下每个序列中约为1.25GB──如果你为每一个请求预留8192个插槽,但平均要求只使用1500个代币,那么你会浪费约82%的预留HBM──经典批量会支付这个部分的浪费──

页面注意力 借鉴了OS虚拟内存的思想――KV缓存不是按序列连续存储的――它以固定大小的块 分配(默认16个代币) ・每个序列有一个区块表,将其逻辑代币位置映射到物理区块ID――当一个序列超过分配的区块时,会再添加一个区块――当它结束时,它的区块会返回池――

碎片化从6080% (经典方式) 下降到4% 以下(PagedAttention) ――你不会通过某种旗 启动PagedAttention,它是vLLM 提供的唯一分配器──可调控是`--gpu-memory-utilization`预留多少HBM.

### 循环层面的连续批量

旧式 动态批量会等一个窗口 (例如10 ms) 来填充批量,然后运行预填+解码+解码+解码,直到每个序列完成──快序列 会提前离开并置,而GPU 继续处理慢序列──

在每个解码步骤中运行.`RUNNING`在每次代中:

1. `RUNNING`中任何刚达到EOS或max_tokens的序列都会被移除.
2. 如果有空KV块,它会接收新的序列 (预填或恢复)
3. 往前传递 在当前`RUNNING`发出一个新的代币.

批量量永远不会被填充到固定数字. 输出位置不同序列 共享一次融合前进. 在2026年的VLLM中,这叫做`V1 scheduler`△关键不变:调度器 每个解码代一次运行,而不是每一个请求一次运行.

### 碎片预填 保护TTFT尾

在使用过程中,批量中所有其他序列的解码代码都在等待. 在服务循环中,一个长提示的第一个代码延迟(TTFT) 将变成几十个其他用户的互代码延迟(ITL) 动──

零件预填将预填 拆成固定大小的零件 (默认512代币),并以零件为单位调调度――零件之间,规划器可以让解码序列 前进一个代币――你使用少量绝对的预填延迟 增量――每个零件 几分钟) 换来明显更低的解码时间升――在已发布的基准中,混合负载下的 P99 ITL 从约50 ms 降至约15 ms ――

### 三个默认设置会相互作用

这三个功能都假设彼此存在. 页面关注为调度器提供细分量 KV资源以权衡. 持续批量需要这种细分量资源,这样接纳新序列时不需要强制全局调整.`RUNNING`单独的决策,只是另一个规划者政策,而不是独立系统.

你不需要知道每一个旗. 你需要知道时间表. 优化内容:在KV区块预算下,并受到了切片预填切片.

### 2026 年的变化

在 vLLM v0.18.0 中,你不能将`--enable-chunked-prefill`与草案模型的投机解码`--speculative-model`结合使用. 文档说明的例外是V1调度器中的N-gram GPU推测解码. 那些不读取释放说明就打开所有旗的团队,将在启动时遇到运行时间错误,而不是软性回归. 如果你的推测收益值启动零碎预填,那就重新审视选择:2026年正确的答案通常是EAGLE-3 并且不使用零碎预填,而不是草案模型加上无法编译的零碎预填.

### 你应该记住的数字

- 拉马 3.3 70B FP8,H100 SXM5,128 并发,三者全开:2,200-2,400 秒
- 同一模型默认vLLM ((无零碎预填):~1,800tc/s。
- 同一模型,朴素 PyTorch 前进循环:~600个/秒.
- 生产负载下 页面关注的 KV 碎片化浪费:<4%──
- 混合负载下 P99 ITL:使用碎片预填时 ~15 ms,不使用时 ~50 ms──

### 时间表的样子

```
while True:
    finished = [s for s in RUNNING if s.is_done()]
    for s in finished: release_blocks(s); RUNNING.remove(s)

    while WAITING and have_free_blocks_for(WAITING[0]):
        s = WAITING.pop(0)
        allocate_initial_blocks(s)
        RUNNING.append(s)

    # schedule prefill chunks + decode in one batch
    batch = []
    for s in RUNNING:
        if s.in_prefill:
            batch.append(next_prefill_chunk(s))   # e.g. 512 tokens
        else:
            batch.append(decode_one_token(s))     # 1 token

    run_forward(batch)                            # one fused GPU call
```

`code/main.py`正是这个循环的Stdlib Python 版本,使用假的代币数和假的前进延迟――运行它将显示碎片预填 如何在长期预填 期间让解码序列保持活跃――


```figure
tensor-parallel
```

## 使用它
`code/main.py`模拟一个vLLM风格的调度器,并带有可切换功能.

- `NAIVE`模式:一次一次,无批量.
- `STATIC`模式:并等待,经典批量
- `CONTINUOUS`形式:释 级别的录取和释放
- `CONTINUOUS + CHUNKED`模式:预填切片与解码交错――

输出会展示总吞吐量 (图标/虚拟秒) 、TTFT平均和P99 ITL──`CONTINUOUS + CHUNKED`这一行在混合流量上应该占优势.

## 交付它
本课会生成`outputs/skill-vllm-scheduler-reader.md`△给定一个服务配置: ◎批量大小, ◎KV内存使用, ◎预填量大小, ◎推测配置, 它会产生一个调度器诊断, 指出三个默认设置中的哪一个正在成为瓶,以及应该调调什么.

## 练习
1. 运行`code/main.py`△包含短请求和长请求的混合工作负载 上比较 `STATIC`与`CONTINUOUS`通过输出差距来自哪里,是预填效率,解码效率,还是尾延迟?
2. 修改这个玩具安排器,添加`--max-num-batched-tokens`△对于运行 Llama 3.3 70B FP8 的 H100,正确取值是多少?
3. 重新阅读 vLLM v0.18.0发布说明.
4. 针对1000个请求的追踪 计算KV缓存 碎片化浪费,平均1500个输出代币,std600个代币,分别在以下条件下:
5. 用一段话解释为什么碎片预填有助于P99ITL,但单独看不会提高吞吐量――实践中的吞吐量 收益来自哪里?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| PagedAttention | “KV trick” | 用于 KV cache 的固定大小 block allocator；碎片化 <4% |
| Block table | “page table” | 每个 sequence 从 logical token position 到 physical KV block 的映射 |
| Continuous batching | “dynamic batching, but right” | 每个 decode iteration 都做 admit/release 决策 |
| Chunked prefill | “prefill splitting” | 将长 prefill 拆成 512-token 切片并与 decode 交错 |
| TTFT | “first token time” | Prefill + queue + network；在长 prompts 下由 prefill 主导 |
| ITL | “inter-token latency” | 连续 decode tokens 之间的时间；由 batch size 主导 |
| Goodput | “满足 SLO 的 throughput” | 每个 request 仍命中 TTFT 和 ITL targets 时的 tokens/sec |
| V1 scheduler | “new scheduler” | vLLM 的 2026 scheduler；N-gram spec decode 是与 chunked-prefill 兼容的路径 |
| `--gpu-memory-utilization` | “memory knob” | 在 weights 和 activations 之后为 KV blocks 预留的 HBM 比例 |

## 延伸阅读
- [vLLM documentation — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode/) 关于零碎预填和猜测解码的官方来源
- [vLLM Release Notes (NVIDIA)](https://docs.nvidia.com/deeplearning/frameworks/vllm-release-notes/index.html) 2026 发布时间和特定版本行为
- [vLLM Blog — PagedAttention](https://blog.vllm.ai/2023/06/20/vllm.html) 仍然定义如何理解分配器的原始文章──
- [PagedAttention paper (arXiv:2309.06180)](https://arxiv.org/abs/2309.06180) 碎片化分析与规划设计
- [Aleksa Gordic — Inside vLLM](https://www.aleksagordic.com/blog/vllm) 带有火焰图的详细 V1 规划器走过──
