<a id="phase-13-tools--protocols"></a>

# 阶段 13：工具与协议

> AI 与真实世界之间的接口。

## 逆向工程路径

十四节课讲解如何阅读自己构建的编译程序。第 32–36 课构建核心流程：解析文件、解码指令、提升为伪代码、记录已知事实及证据，并证明重建函数与原函数等价。第 37–45 课介绍这一流程周边的领域知识：历史与主要工具、调用约定、编译器惯用模式、链接与符号剥离、类型恢复、调试、字节码格式、二进制差异分析与符号执行，以及 AI 辅助分析。每课都会在相同样例上运行真实工具。配套手册 [Reverse Engineering 101](https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/manuals/reverse-engineering-101) 使用 rea 6.5.0 和 Ghidra 12.1.4 处理同一样例。

| 课程 | 构建内容 | 时间 |
|---|---|---|
| [32](32-program-anatomy-elf-from-scratch/) | ELF 读取器：头部、节区、符号、重定位 | 2 小时 |
| [33](33-disassembly-and-control-flow/) | x86-64 解码器、线性扫描、递归下降与控制流图 | 2 小时 30 分钟 |
| [34](34-lifting-to-pseudocode/) | 从指令到结构化伪代码的提升器 | 2 小时 30 分钟 |
| [35](35-evidence-confidence-and-unknowns/) | 记录置信度、限制和未知项的证据台账 | 1 小时 45 分钟 |
| [36](36-rebuild-and-prove-equal/) | 差分测试工具，以及屏蔽重定位的字节比较 | 1 小时 50 分钟 |
| [37](37-the-reverse-engineering-landscape/) | 覆盖五种工具的比较工具、历史时间线和四种 IR | 2 小时 30 分钟 |
| [38](38-calling-conventions-and-stack-frames/) | System V、Windows x64 与 AArch64 调用约定分析器 | 2 小时 20 分钟 |
| [39](39-compiler-idioms-and-optimization/) | 解码除法、switch、循环和选择结构的惯用模式识别器 | 2 小时 30 分钟 |
| [40](40-linking-loading-and-stripped-binaries/) | PE、Mach-O 修正及 ELF 链接读取器，以及剥离符号构建的函数查找器 | 2 小时 40 分钟 |
| [41](41-recovering-data-and-types/) | 用 DWARF 读取器核对的结构体与 C++ 类型恢复过程 | 2 小时 20 分钟 |
| [42](42-dynamic-analysis-of-your-own-program/) | 确认或否定静态分析结论的 lldb 工具 | 2 小时 10 分钟 |
| [43](43-bytecode-and-managed-formats/) | 读取 .pyc、JVM class、.NET CIL 与 WebAssembly 的读取器 | 2 小时 30 分钟 |
| [44](44-binary-diffing-and-symbolic-execution/) | 函数差异比较器与小型符号执行器 | 2 小时 30 分钟 |
| [45](45-ai-assisted-reverse-engineering/) | 依据真实答案评估 AI 重建结果及分析报告的评分卡 | 2 小时 20 分钟 |

这条路径中的每个目标都是你自行编写和编译的程序。第 32 课先介绍法律与授权规则。如果希望由导师引导学习这条路径并记录进度，请运行 `learn-reverse-engineering` 技能。其顺序和检查点记录于[逆向工程学习路径清单](https://github.com/rohitg00/ai-engineering-from-scratch/blob/main/learning-paths/reverse-engineering.json)。

查看 [ROADMAP.md](../../ROADMAP.md) 获取完整课程计划。
