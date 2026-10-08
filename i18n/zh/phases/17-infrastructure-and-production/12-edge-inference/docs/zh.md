# 果神经引擎,高通六角形,WebGPU/WebLLM,Jetson

> 核心边缘 约束是内存带宽,而不是计算.移动DRAM 位于50-90GB/s;数据中心HBM3 超过2-3TB/s差距为30-50x. 解码受记忆限制,因此这个差距是决定性的.到2026年,格局分为四类.

**类型：**学习
**语言：**字符串的解码器
**前置要求：**阶段17 · 04(vLLM服务内部)
**时间：**时间60分钟

## 学习目标

- 解释为什么移动LLM推断是记忆带宽的,而计算是第二个因素.
- 列举四个边缘目标:果ANE、Qualcomm Hexagon、WebGPU/WebLLM、NVIDIA Jetson),并将每个目标匹配一个使用情况.
- 了解2026年WebGPU覆盖率差距 (Firefox Android正在追赶) 以及Safari iOS 26的落地情况.
- 为每个目标 选择一种量化格式 (ANE 用Core ML INT4 + FP16,六角形用QNN INT8/INT4,浏览器用WebGPU Q4,Jetson Thor用 NVFP4) 👇

## 问题

一位客户想要一个在设备上的聊天机器人:语音首个、私人默认、离线可用──在MacBook Pro M3 Max 上,Llama 3.1 8B Q4 以 ~55个/s 运行可接受──在iPhone 16 Pro 上,同一个模型以 3个/s 运行不可接受──在搭载Snapdragon 8 Gen 3 中端的Android 上,是7个/s──通过Chrome Android v121+ 上的WebGPU 在浏览器中运行时,取决于设备,是4-8个/s──

通过输出的差异不是移植问题. 它是带宽差距. 乘以量化格式,再乘以NPU 是否能从用户空间访问.

## 概念

### 带宽才是真正的上限

解码会为每个代币 读取完整的权重 集合──一个Q4的7B模型是3.5GB──以50GB/s 读取3.5GB 需要70ms理论上约为~14tok/s──在90GB/s(高端移动DRAM) 下,上限移动到~25tok/s──低于这个数字时,再多计算也没有帮助──

数据中心HBM3 以3TB/s 读取同样 3.5GB 只需要1.2ms上限是830tok/s──同一个模型,同样的重量──不同的内存子系统──

### 果神经引擎 (M4 / A18)

- 最高38个顶部存储器.
- 通过核心ML+`.mlmodel`编译模型访问,或通过 PyTorch 经由金属性能遮光器(MPS)访问.
- 使用MPS,不是直接使用ANE;本土ANE 需要Core ML转换──
- 2026年 iOS应用的最佳实践路径:使用INT4重量 + FP16激活的核心ML──

### 果公司的果版

- 最高45个TOPS──集成在SoC中,与CPU和GPU一起,但具有独立的内存域──
- 通过PyTorch/ONNX的转换提供了SDK和AI Hub.
- 聊天模板,Llama 3.2 及Phi-3 都作为AI Hub 上等文物发布.

### 智能/AMD NPUs(月球湖,Ryzen AI 300)

- 软件落后于果/果电脑;OpenVINO正在改进,但仍处于一个领域.
- 最适合Windows ARM副驾驶应用;在AMD/Intel桌面上用于本地首次的本地场景.

### 网络GPU + 网络LLM

- 通过WebGPU计算影子在浏览器中运行模型;无需安装──
- 在M3 Max 上,Llama 3.1 8B Q4 约为 ~41个话/秒通过相同的后端,大约是原生的 70-80%──
- 网络LLM有17.6万个GitHub星;OpenAI兼容的JSAPI;Apache 2.0──
- 据悉,在2026年,该公司的用户数量为75%左右.

### 杰特森家族

- 纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米超级纳米纳米超级纳米超级纳米纳米超级纳米纳米超级纳米纳米纳米超级纳米纳米超级纳米纳米纳米纳米纳米纳米纳米
- 通过vLLM 以 ~40 tok/s 运行 gpt-oss-20b。
- /T4000(JetPack 7.1):性能为 AGX Orin 的 2x,支持EAGLE-3 和 NVFP4──
- 支持EAGLE-3的投机解码,NVFP4重量,分片预填数据中心优化已移植到边缘.

### 每个目标的量化选择

| Target | Format | Notes |
|--------|--------|-------|
| Apple ANE | INT4 weights + FP16 activations | Core ML conversion path |
| Qualcomm Hexagon | QNN INT8 / INT4 | AI Hub converters |
| WebGPU / WebLLM | Q4 MLC（q4f16_1） | 使用 `mlc_llm convert_weight` + 编译后的 `.wasm`；不支持 GGUF |
| Jetson Orin Nano | Q4 GGUF 或 TRT-LLM INT4 | Memory-bound |
| Jetson AGX / Thor | NVFP4 + FP8 KV | Edge-LLM path |

### 边缘上长文本陷

拉马 3.1 的 128K 文本是数据中心 功能. 在 8 GB RAM 的手机上,4 GB 模型 + 32K 代币的 2 GB KV 缓存 + OS 过head = OOM。Edge 部署将将文本保持在 4K-8K,除非接受激进的 KV 量化(Q4 KV) 』

### 声音是杀手应用程序

语音代理对延迟敏感 (第一个代币 < 500 ms) ◎本地推理会完全消除网络延迟――与语音到文字的声波变体可在边缘上运行) 结合后,边缘推理就成为生产质量的语音循环――

### 你应该记住的数字

- 果M4 / A18 ANE:38 果M4 / A18 ANE:38 果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果果
- 通六合式SDX精英:45TOPS
- 网络LLM M3 马克斯:Llama 3.1 8B Q4 上 ~41 个时/秒
- 通过vLLM 在gpt-oss-20b 上 ~40 tok/s
- 数据中心边缘带宽差距30-50x.
- 网络GPU移动覆盖率:~70-75%


```figure
edge-bandwidth-pipe
```

## 使用它

`code/main.py`使用带宽限制 数学计算各边缘目标的理论解码吞吐量上限――它与观测的基准相比,并突出显示带宽在哪里,而不是计算――

## 交付它

本课会生成`outputs/skill-edge-target-picker.md`△给定平台 (iOS/Android/浏览器/Jetson) √模型以及延迟/内存预算,它会选择量化格式和转换管道――

## 练习

1. 运行`code/main.py`△对于Snapdragon 8 Gen 3 ((~77GB/s带宽) 的Q4 7B模型,计算解码天花板──与观测到的 6-8个/s比较运行时间是否高效?
2. 对于较旧的浏览器,设计一个倒退通过相同的OpenAI兼容API使用服务器侧.
3. 你的iOS应用程序需要4K文本流媒体. 哪种模型/格式组合可以让你在iPhone 16上保持低于4GB的活跃内存?
4. 捷特森 AGX Orin 以40个/s 运行gpt-oss-20b――捷特森纳米只能容纳3B――如果你的产品同时面向两者,如何统一推断堆?
5. 论证WebLLM在2026年是否准备生产──引用覆盖性,性能以及Firefox Android缺口──

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ANE | "Apple neural engine" | M-series 和 A-series 中的 on-device NPU；unified memory |
| Hexagon | "Qualcomm NPU" | Snapdragon NPU；用于访问的 QNN SDK |
| WebGPU | "browser GPU" | W3C-standardized browser GPU API；Chrome/Safari 2026 |
| WebLLM | "browser LLM runtime" | MLC-LLM project；Apache 2.0；OpenAI-compatible JS |
| Jetson | "NVIDIA edge" | Orin Nano / AGX / Thor / T4000 family |
| TRT Edge-LLM | "edge TensorRT" | TensorRT-LLM 的 2026 edge port；EAGLE-3 + NVFP4 |
| Unified memory | "shared pool" | CPU 和 NPU 看到同一块 RAM；没有 copy overhead |
| Bandwidth-bound | "memory limited" | Decode 受读取 weights 的 bytes/sec 限制 |
| Core ML | "Apple conversion" | 用于 ANE-native models 的 Apple framework |
| QNN | "Qualcomm stack" | Qualcomm Neural Network SDK |

## 延伸阅读

- [On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/) 格局与基准点――
- [NVIDIA Jetson Edge AI](https://developer.nvidia.com/blog/getting-started-with-edge-ai-on-nvidia-jetson-llms-vlms-and-foundation-models-for-robotics/)           
- [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/) 2026年边缘港 公告──
- [WebLLM（arXiv:2412.15803）](https://arxiv.org/html/2412.15803v2) 设计与基准
- [Apple Core ML](https://developer.apple.com/documentation/coreml)           
- [Qualcomm AI Hub](https://aihub.qualcomm.com/) 为六角形 预先转换的模型――
