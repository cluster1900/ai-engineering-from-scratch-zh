# 如何阅读本手册

> 本手册先让一个 GRPO 训练在一块 GPU 上跑起来，然后讲如何规划它的规模、检查它、修复它。

## 前 30 分钟你要运行什么 {#s-front-what-you-run-in-the-first-30-minutes}

五条命令就能在一块 GPU 上启动一次强化学习训练。它们与[第 1.1 节](#s-run-grpo-on-one-gpu)中的命令相同，那一节会逐条解释。一个小模型学习小学数学，日志会显示它的 reward 上升。第四条命令会一直占用它的终端，直到训练结束。训练运行期间，在第二个终端里启动[第 1.2 节](#s-add-a-watchdog)的 watchdog，因为引擎挂掉的训练不会自己停止。

```bash
docker pull radixark/miles:latest
mkdir -p ~/miles-lab/runs ~/.cache/huggingface && curl -fsSL -o ~/miles-lab/miles_grpo.py https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/manuals/miles-101/capture/gpu/miles_grpo.py
cd ~/miles-lab
docker run --rm --name miles-plain --gpus all --ipc=host --shm-size 32g --ulimit memlock=-1 -v "$HOME/miles-lab:/root/lab" -v "$HOME/.cache/huggingface:/root/.cache/huggingface" -e MILES_NUM_ROLLOUT=12 -e MILES_RUN=plain radixark/miles:latest python /root/lab/miles_grpo.py > runs/plain.log 2>&1
grep -o "'rollout/raw_reward': [0-9.]*" runs/plain.log
```

## 读完本手册后你能做什么 {#s-front-what-you-can-do-after-this-manual}

你会部署模型，也知道 reward 是什么。你想用强化学习训练一个模型，并且想在租用集群之前知道哪些设置重要。

读完本手册后，你能：

- 在一块 GPU 上运行 GRPO，并读懂前十步。
- 停掉一个 rollout 引擎已经挂掉、却还在继续运行的训练。
- 选一个在同一块 GPU 上既能训练又能 rollout 的模型规模。
- 检查一次训练是否正确，而不只是能跑。
- 从失败训练的第一个症状找到原因。

## 我们的发现 {#s-front-what-we-found}

本手册的每个结果都来自同一台机器上的运行，所以每一页都会说明结果的适用范围。有五个结果会改变你的做法：

- 引擎挂掉的训练会继续运行，永远不会报失败。在我们的机器上，它在 63 分钟内记录了 200,533 条错误。每次训练都要配一个 watchdog（[第 1.2 节](#s-add-a-watchdog)）。
- 在一台 128 GB 的机器上，1.7B 模型在 256 token 的短步长下放得下，4B 模型放不下（[第 2.1 节](#s-pick-a-model-size)）。
- 训练器与引擎之间的权重更新只占一步耗时的不到百分之一。先调训练和 rollout（[第 2.4 节](#s-size-the-weight-update)）。
- 确定性推理让引擎的输出可以复现。它不会缩小训练器与引擎之间的差距（[第 4.5 节](#s-use-deterministic-inference)）。
- 因过热而暂停的机器会增加并非工作的耗时。比较训练时要对齐相同的步号，并剔除被暂停影响的步（[第 5.3 节](#s-repeat-a-run)）。

## 我们如何测试 {#s-front-how-we-tested-it}

每条命令都在一台 NVIDIA DGX Spark 上运行，它有一颗 GB10 芯片和 128 GB 由 CPU 与 GPU 共享的内存。模型是 Qwen3-0.6B，数据是 GSM8K。参考部分的实验记录给出镜像、版本、随机种子和完整表格。

我们的 GB10 在数小时的负载下会变热，所以用一个小脚本来保护它。下面三个术语来自这个脚本，本手册中很多耗时数字都取决于它们：

**Heat guard（温控守护）：** 一个脚本，在 GPU 达到 84 C 时暂停 Miles 容器，GPU 降温后再恢复它。[第 1.2 节](#s-add-a-watchdog-guard-the-gpu-heat)介绍如何运行它。

**暂停：** heat guard 让容器静止的时间。一次暂停会给它所在的阶段增加墙钟时间。

**干净步：** 计时窗口与任何暂停都不重叠的步。我们报告的耗时来自干净步，或者来自加上 heat guard 之前的运行。[实验记录](#s-ref-lab-notes)给出确切的规则。

Miles 是为多 GPU 上的大型 mixture-of-experts 训练而构建的。一块 GPU 无法展示它的全部。每一页都会说明哪些是我们测量的，哪些只能从源码中读到。

Miles 一步的概览见 [Inside Miles 指南](https://rohitghumare.com/guides/inside-miles)，colocated 循环见 [SGLang 101 第 7.2 节](https://aiengineeringfromscratch.com/manual-sglang-101.html#s-sglang-as-an-rl-rollout-engine)。本手册不再重复它们。

## 各部分的顺序 {#s-front-how-the-parts-are-ordered}

```parts
```

Sources: manual.json; capture/gpu/heat-guard.sh; capture/gpu/out-gb10/image-identity.txt; capture/gpu/out-gb10/engine-died-count.txt; capture/gpu/out-gb10/ray-oom-4b-lowmem.log; capture/gpu/miles_grpo.py; capture/gpu/summary/miles-gb10-lab.json.
