# 图表索引

> 本手册的每一张图，按顺序排列，并附上其说明所给出的那一条结论。

每一行都链接到对应的图，结论取自每个图块的 `claim:` 字段。图中每个测量数字都来自我们在一台 DGX Spark 上的运行。图表在构建手册时读取[这些运行的汇总](manuals/miles-101/capture/gpu/summary/miles-gb10-lab.json)。颜色遵循前言中的调色板：

- 蓝色代表训练器：FSDP actor、它的权重和优化器
- 紫色代表 rollout 引擎：生成回答的 SGLang 服务器
- 绿色代表数据和奖励：提示、回答、组和分数
- 琥珀色代表生命周期中的一步，比如训练步的某个阶段或一次权重更新
- 青色代表持久状态：检查点、日志和汇总文件
- 玫红色代表故障：引擎死掉、内存不足被终止或崩溃
- 灰色代表 Miles 之外的部分：主机、Docker 和 Ray

```figure-index
```

Sources: the figure blocks of front.md and of every file under sections/; manual.json (palette)
