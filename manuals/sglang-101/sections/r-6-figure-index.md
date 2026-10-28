# 图索引

> 本手册的每一张图，按顺序，按它的说明所下的那一个断言。

每一行链到它的图，断言是每个 figure 块的 `claim:` 字段。图里测到的数字来自我们[在 Mac 上](manuals/sglang-101/capture/out)或[在 GPU 上](manuals/sglang-101/capture/gpu)的运行，每一节链到它用的文件。现场报告里的数字点名那份报告。颜色跟 front matter 的调色板走：

- blue 是 SGLang 服务器进程：tokenizer manager、调度器和 detokenizer
- violet 是模型及其前向：内核、attention 后端和 CUDA graphs
- green 是 KV cache：pool 槽、radix 树节点和缓存的 token
- plum 是模型计算：prefill 和 decode 步
- olive 是客户端和网络
- indigo 是流和消息
- amber 是生命周期状态，例如请求状态或调度器阶段
- teal 是持久状态：主机内存、存储层和磁盘上的权重
- rose 是失败：内存不足、回退、中止或崩溃
- grey 是 SGLang 之外：操作系统、其他程序和 GPU 驱动

```figure-index
```

Sources: the figure blocks of front.md and of every file under sections/; manual.json (palette)
