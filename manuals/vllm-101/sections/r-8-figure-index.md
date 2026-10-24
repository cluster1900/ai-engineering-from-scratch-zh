# 图表索引

> 本手册的每一张图，按顺序列出，并附上它表达的那一个论点。

每一行都链接到对应的图。图中的实测数字来自[我们在 GPU 上的运行](manuals/vllm-101/capture/gpu)，每一节都会链接它用到的文件。颜色遵循前言中的调色板：

- 蓝色是 vLLM 服务器：API 服务器进程和 engine core
- 紫罗兰色是模型及其前向计算：kernel、attention backend、CUDA graph
- 绿色是 KV cache：block、block 池、已缓存的前缀
- 梅红色是模型计算：prefill 和 decode step
- 橄榄色是客户端和网络：HTTP、OpenAI API、基准测试客户端
- 靛蓝色是进程之间的流和消息，以及流式输出的 token
- 琥珀色是生命周期：请求状态和 scheduler step
- 青色是持久状态：磁盘上的权重、主机内存、卸载的 KV
- 玫瑰色是故障：内存不足、抢占、中止、崩溃
- 灰色是 vLLM 之外的东西：操作系统、其他程序、GPU 驱动

```figure-index
```

Sources: the figure blocks of front.md and of every file under sections/; manual.json (palette)
