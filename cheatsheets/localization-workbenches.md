---
id: localization-workbenches
title: Localization and Glossary Tools
code: LG
subtitle: 运行三个先审后发的本地化项目，为它们准备输入并检查结果。选择多语言模型和源语言。
hue: 28
sources: phases/05-nlp-foundations-to-advanced/18-multilingual-nlp, projects/subtitle-localization-desk, projects/ui-string-localization-workbench, projects/glossary-hovercard-publisher
source_hash: 8406a26bb6811eb3
---

## 三个项目并列对比
type: comparison
span: 2
from: projects/subtitle-localization-desk/README.md, projects/subtitle-localization-desk/project.json, projects/subtitle-localization-desk/solution/cli.py, projects/ui-string-localization-workbench/README.md, projects/ui-string-localization-workbench/solution/cli.ts, projects/glossary-hovercard-publisher/README.md, projects/glossary-hovercard-publisher/solution/cli.ts

| 因素 | Subtitle Localization Desk | UI String Localization Workbench | Glossary Hovercard Publisher |
|---|---|---|---|
| 构建 | 已审校的 WebVTT 和一个 HTML 工作台 | 已审校的 locale JSON 和一个预览 | 带注释的 HTML 课文 |
| 语言 | Python 3.10+ | Node 22.18 或更新 | Node 22.18 或更新 |
| 输入键 | `vtt`, `translations`, `glossary`, `cps` | `locale`, `messages`, `proposals`, `values` | `glossary`, `lesson` |
| 输出 | `review.html`, `translation-decisions.json`, `reviewed.vtt` | `locale.json`, `unresolved-strings.json`, `report.html` | `report.html`, `glossary.json`, `coverage.json` |
| 审校文件 | `--decisions decisions.json` | 第三个参数 `locale-review.json` | 无 |
| 硬性关卡 | 仅当所有字幕条都获批准时才生成 `reviewed.vtt` | 只有没有问题时才能批准 | 平衡的 HTML 子集 |

## 运行参考实现
type: command-table
from: projects/subtitle-localization-desk/README.md, projects/ui-string-localization-workbench/README.md, projects/ui-string-localization-workbench/solution/cli.ts, projects/glossary-hovercard-publisher/README.md

| 命令 | 作用 |
|---|---|
| `python3 cli.py samples/input.json --output demo-output` | 在示例上运行字幕工作台 |
| `python3 cli.py <input.json> --output <dir>` | 在你的输入上运行字幕工作台 |
| `node cli.ts sample.json output` | UI 工作台或术语发布器 |
| `node cli.ts <input.json> <dir> <review.json>` | 带上你的审校运行 UI 工作台 |
| `node cli.ts --help` | 打印参数行 |

## 构建并评分你的版本
type: task-table
span: 2
from: projects/subtitle-localization-desk/README.md, projects/ui-string-localization-workbench/README.md, projects/glossary-hovercard-publisher/README.md

| 任务 | 代码 |
|---|---|
| 生成 starter | `python3 scripts/project_test.py <project> --init <dir>` |
| 为一个阶段评分 | `python3 scripts/project_test.py <project> --stage 1 --path <dir> --strict` |
| 为所有阶段评分 | `python3 scripts/project_test.py <project> --all --path <dir> --strict` |
| 保存完成报告 | `--report completion.json` |
| 为参考实现评分 | `python3 scripts/project_test.py <project> --all --solution --strict` |

## 字幕工作台流水线
type: flow
from: projects/subtitle-localization-desk/API.md, projects/subtitle-localization-desk/solution/main.py, projects/subtitle-localization-desk/solution/cli.py

1. **parse_vtt**：把 WebVTT 读成字幕条。保留时间戳字符串，并给没有 id 的字幕条分配 `cue-N`。
2. **propose**：采用提供的译文。先替换最长的源术语。
3. **inspect**：统计可见字符数并设置 `budget=floor(duration*cps)`。
4. **export_localized**：用提案与 cps 的 SHA-256 `fingerprint` 绑定审校。
5. **你**：编辑 `decisions.json`，为每条字幕设置 `approved`，然后带 `--decisions` 再运行一次。
6. **CLI**：只有每条字幕都获批准时才写出 `reviewed.vtt`。

## 字幕输入（samples/input.json）
type: annotated-code
lang: text
from: projects/subtitle-localization-desk/solution/samples/input.json, projects/subtitle-localization-desk/API.md

```text
{
  "vtt": "WEBVTT\n\nmap\n00:00.000 --> 00:03.000\nOpen the map.\n...",
  "translations": {
    "map": "Abre el map.",  # glossary turns it into "Abre el mapa."
    "label": "Escribe un nombre descriptivo ..."  # 2 s at cps 12, budget 24
  },
  "glossary": {"map": "mapa", "marker": "marcador"},  # source to target
  "cps": 12  # optional, the default is 17
}
```

## UI 字符串工作台流程
type: architecture
from: projects/ui-string-localization-workbench/solution/main.ts, projects/ui-string-localization-workbench/solution/cli.ts, projects/ui-string-localization-workbench/README.md

```arch
node | in | 1,1 | sample.json | messages, proposals | client
node | read | 2,1 | readCatalog() | keys, placeholders | process
node | prop | 3,1 | proposeTranslations() | issues, needsContext | process
node | rev | 3,2 | reviewTranslations() | approve, reject, pending | process
node | loc | 1,2 | locale.json | approved strings | store
node | unr | 2,2 | unresolved-strings.json | keys with reasons | store
edge | in | read | messages
edge | read | prop | Message[]
edge | prop | rev | Proposal[]
edge | rev | loc | catalog
edge | rev | unr | unresolved
```

## 术语发布器规则
type: concepts
from: projects/glossary-hovercard-publisher/solution/main.ts, projects/glossary-hovercard-publisher/README.md

- **术语 id**：小写，匹配 `^[a-z][a-z0-9-]*$`，且唯一。
- **短语**：术语或别名在整个术语表中不能重复，不区分大小写。
- **匹配**：`matchTerms()` 先尝试最长的短语，且需要词边界。
- **跳过的文本**：`pre`、`code` 和 `a` 内的文本保持不变。
- **属性**：`a` 上只允许 `class`、`id`、`title`、`lang` 和 `href`。
- **链接**：`href` 必须以 `https://`、`http://` 或 `#` 开头。
- **释义**：带 `aria-expanded` 的原生按钮显示一个 `role="note"` span。

## 错误信息与修复
type: troubleshooting
from: projects/subtitle-localization-desk/solution/main.py, projects/subtitle-localization-desk/solution/cli.py, projects/ui-string-localization-workbench/solution/main.ts, projects/glossary-hovercard-publisher/solution/main.ts

| 症状 | 原因 | 修复 |
|---|---|---|
| `stale review` | 审校后提案或 cps 发生变化 | 使用 `review.html` 中新的 `decisions.json` |
| `resolve glossary or acknowledge reading-budget overflow` | 已批准的字幕条缺少术语或超出预算 | 补上术语，或把 `override_budget` 设为 true |
| `STYLE and REGION are outside the supported subset` | VTT 含有 STYLE 或 REGION 块 | 删除它们。NOTE 块会被忽略 |
| `Placeholder multiset changed` | 译文丢失或多出 `{name}` | 保留源文的每个占位符 |
| `Stale or invalid translation decision` | 审校译文与提案不同 | 下载新的 `locale-review.json` |
| `Resolve translation issues or context before approving` | 有歧义的键未被确认 | 把 `acknowledgeContext` 设为 true |
| `Ambiguous repeated phrase` | 同一短语出现在两个术语中 | 每个短语只属于一个术语 |
| `Unsupported HTML element` | 标签不在允许的子集中 | 只使用列出的标签 |

## 默认值与限制
type: defaults
from: projects/subtitle-localization-desk/solution/main.py, projects/subtitle-localization-desk/solution/cli.py, projects/ui-string-localization-workbench/solution/main.ts, projects/ui-string-localization-workbench/solution/cli.ts

| 设置 | 默认值 | 说明 |
|---|---|---|
| `cps` | 17 | 必须为正的有限数 |
| `schema_version` | 1 | 在 `translation-decisions.json` 中 |
| `approved` | `False` | 每条字幕初始均未批准 |
| `override_budget` | `False` | 超预算批准时需要 |
| 提案长度 | 2000 | 每个提案最多的字符数 |
| `schemaVersion` | 1 | `locale-review.json` 中必需 |
| 输出目录 | `output` | Node CLI 的第二个参数 |
| 出错时的退出码 | 2 | Node CLI 会打印错误信息 |

## 选择多语言模型
type: task-table
from: phases/05-nlp-foundations-to-advanced/18-multilingual-nlp/docs/en.md

| 任务 | 代码 |
|---|---|
| 分类，100 种语言 | 微调后的 `XLM-R-base` |
| 零样本分类 | `joeddav/xlm-roberta-large-xnli` |
| 翻译，200 种语言 | `facebook/nllb-200-distilled-600M` |
| 低资源语言 | `XLM-V` 或在相近语言上微调 |
| 少样本 epoch 数 | `num_train_epochs=5` |
| 少样本学习率 | `learning_rate=2e-5` |
| 长尾文字系统 | `byte_fallback=True` |

## 源语言选择
type: qa
from: phases/05-nlp-foundations-to-advanced/18-multilingual-nlp/docs/en.md, phases/05-nlp-foundations-to-advanced/18-multilingual-nlp/code/main.py

- **英语总是最好的源语言吗？** 不是。语言相似度比语料规模更能预测迁移效果。
- **目标是马拉地语？** `rank_source_languages()` 把印地语排在英语之前。
- **目标语言需要多少标注？** 100 到 500 个样本可达到英语基线的 95% 到 98%。
- **为什么不用更高的学习率？** 多语言对齐会坍缩成只懂英语的模型。
- **什么是 fertility 税？** 印地语可能需要英语 3 到 5 倍的 token。

## 提示
type: tips
from: phases/05-nlp-foundations-to-advanced/18-multilingual-nlp/docs/en.md, projects/subtitle-localization-desk/README.md, projects/ui-string-localization-workbench/README.md, projects/glossary-hovercard-publisher/README.md

- 按语言报告准确率。汇总值会掩盖长尾。
- 训练前先在目标文本上检查分词 fertility。
- 每条译文都需要人工审校。工具只负责标出问题。
- UI 工作台支持简单的具名占位符，不支持 ICU 消息。
- 术语短语绝不跨越元素或实体边界。
- HTML 在本地运行，不向第三方服务发送任何数据。
