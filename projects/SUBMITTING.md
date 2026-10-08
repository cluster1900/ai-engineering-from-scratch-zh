# 项目提交指南（Submitting a project）

构建一个在学完课程后依然能切实复用的实用工具。将其拆解为 4 到 8 个渐进阶段，并确保整个参考实现能够在无任何 API Key 的离线环境下顺利运行。有关清单文件、评测器、机制原理图、动图演示和完成凭证的具体契约，请参阅 [AUTHORING.md](AUTHORING.md)。

## 选择具备实际价值的产出成果

优秀的项目通常交付研报生成器、证据索引器、Skill 校验器、持久化记忆服务、工作流协同工具、协议服务端或评测基准框架。诚实划定技术边界：例如用测试 fixture 后端传授桌面控制协议，应明确标注其为教学 fixture，而非声称直接实现了操作系统级内核集成。

项目必须使用原创的代码实现与教学讲义。协议机制与关键技术细节须准确引用官方文档、公开规范与权威研究论文。严禁包含用户隐私爬取、安全防护绕过（jailbreak/exploit）或缺乏实质性工程深度的简单模型 API 包装调用。

## 创建项目目录

```bash
cp -R projects/_template projects/your-project-id
```

使用与目录名一致的小写连字符 ID。将 `source` 设为 `community`，并在 `author` 中填入你的姓名与 GitHub 主页。在编写各阶段内容期间，保持 `status` 为 `draft`。目录系统将永久保留你的署名，且绝不会擅自自动提升 draft 状态。

模板目录自带一个极简的 Python 阶段用于示范工程契约。请将其扩展为 4 到 8 个阶段，并将示例替换为你自己的实用成果。Python、TypeScript、Rust 和 Go 均使用标准库评测器。多语言项目为每个阶段声明具体的 runner。附带一个崭新学习者工作区运行所需的全部模块与 fixture 夹具。

## 编写教学文档与校验各阶段

清晰解析实用价值、底层不变量、完整推导示例、严格的公开函数签名、异常错误类型以及学习者可直接复制执行的测试命令。每个阶段须配备 5 个高质量的测试用例、明确的异常防御用例、能清晰暴露未实现的初始脚手架（starter），以及原创的已注册机制原理图。测试必须动态加载学习者工作区中的代码，严禁私下导入已提交的参考答案。

后续阶段的 starter 增量添加文件，绝不覆盖前面的工作。初始化脚本会保护已有文件与学习者的实现代码，除非学习者显式指定 `--force`。包含保留测试集或测试数据、可度量的量化评测结果，并为循环与预算明确定义终止状态。

## 录制并展示项目成果

在 `demo` 下声明能够自行正常退出的 argv 命令，例如 `{"command":["python3","demo.py"],"cwd":"solution"}`。录制真实运行输出，并将 GIF 或视频及其海报封面提交到项目目录下的 `media/` 中。在 `demos` 中声明对应的相对路径。构建工具会将文档与录屏打包到静态站点中，确保预览分支无需依赖 GitHub main 分支上尚未发布的文件。

## 本地验证与提交 PR

```bash
python3 scripts/project_test.py your-project-id --all --solution --strict
python3 scripts/project_test.py your-project-id --init /tmp/your-project-check
python3 scripts/project_test.py your-project-id --stage 1 --path /tmp/your-project-check
node --test site/test_projects_data.js
node site/build-projects.js --strict
```

参考答案必须通过全部阶段，且不能有任何测试用例被跳过。初始 starter 必须以具备明确指引的未实现错误清晰报错。在 `--strict` 严格模式下，缺失运行时环境、空测试套件、跳过的测试、缺失的原理图及缺失的演示录屏均会导致验证失败。切勿 commit 自动生成的 `site/projects-data.js` 或 `site/project-content/` 临时文件。

在 GitHub 上提交 feature 分支的 Pull Request。Maintainer 会审查原创讲义、实测参考实现、以学习者身份亲手体验第一阶段，并在网站上核验实际渲染效果。完成证书依托学习者全量评测报告生成；参考实现的运行结果与网页复选框不作为完成凭证。
