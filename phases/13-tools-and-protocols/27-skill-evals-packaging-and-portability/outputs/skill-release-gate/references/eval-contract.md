# Evaluation 契约

只有所有必需层面都通过时，候选版本才算通过：

- 结构：在读取配置之前，先对物理目录树执行预检，拒绝使用符号链接的根目录、父目录或条目、缺失的必需常规文件以及特殊文件。随后确认目录名称与 frontmatter 中的名称匹配、必需元数据存在、runtime 扩展已显式声明、直接引用能够解析、包的大小和类型限制通过、不存在明显的 secret 模式、输出和失败契约存在，并且没有交付任何未被引用的配套文件。
- 触发：正向 Prompt 应激活，而近似但不匹配的负向 Prompt 应保持未激活。报告混淆计数、precision、recall，以及每次运行的全部原始预测结果。本地完整性校验必须将完整的观察序列和路由 fixture 绑定到其来源及 SHA-256 digest，而不只是绑定第零次运行或聚合比率。
- 稳定性：重复运行每个用例，并报告每个用例的通过率。
- 产物：对 baseline 输出和启用 Skill 后的输出应用相同的断言。Skill 输出必须通过并体现改进。生产声明必须将捕获的两个字符串分别绑定到其来源及 SHA-256 digest。
- 脚本：要求提供确定性脚本测试的明确通过/失败证据，包括重复执行的证据。生产证据必须将完整的脚本和安全检查集合绑定到捕获来源及 SHA-256 digest。
- 安全：要求每个已声明的权限边界用例都通过。平均值不能掩盖某一次越界。
- 已安装目录树：激活前，根据记录的文件 manifest 验证干净安装的副本。要求 `manifestVersion: 1` 和 `algorithm: "sha256"`。将 `assets/manifest.json` 视为保留元数据，并从其自身的 `files` map 中排除；通过可信的外部发布渠道或 registry 渠道认证该 manifest。
- 可移植性：说明每个目标 host 是原生支持、需要 adapter，还是不受支持。列出缺失的能力。要求至少有一个 host，并设定正向的原生 host 阈值。本地完整性校验必须将捕获的需求和 host matrix 绑定到其探测来源及 SHA-256 digest。

将路由 eval 与确定性 harness 激活分开。前者衡量可发现性；后者隔离工作流和产物行为。

交付的 JSON 值是用于学习此 gate 的确定性 fixture。它们可以将 `fixturePassed` 设为真，但绝不能将 `productionReady` 或 `passed` 设为真。对于真实发布，将 `evaluationMode` 设为 `captured-observations`，将 `artifactMode` 设为 `captured-artifacts`，将 `evidenceMode` 设为 `captured-results`，并将 `hostMode` 设为 `captured-capabilities`；记录每次运行的一个 boolean 预测值，并将完整观察集合绑定到其来源及 SHA-256 digest；用从相同任务和环境中捕获的产物替换 baseline 字符串和启用 Skill 后的字符串；记录非空捕获来源以及匹配的 SHA-256 产物 digest；用捕获的测试结果替换每项证据 verdict；将完整证据集合绑定到其来源及 SHA-256 digest；用捕获的 host 探测结果替换模拟 capability matrix，并将其绑定到来源和 digest；重新构建 manifest；然后安装到干净的目标位置。

这些本地检查可以将 `localEvidenceReady` 设为真。它们无法证明捕获过程的真实性，因为 bundle 作者可以重新标记 fixture 并重新计算每个 digest。因此，Evaluator 会对完整的五配置证据根进行哈希，并要求提供一个从外部绑定该证据根的 `attestationVersion: 1` JSON 对象。从 bundle 外部提供 attestation，并通过 `--trusted-attestation-sha256` 提供其精确字节的 SHA-256；该值必须来自带外可信策略。只有六层 gate、本地完整性校验和这个信任锚点全部具备时，才能将 `productionReady` 和 `passed` 设为真。
