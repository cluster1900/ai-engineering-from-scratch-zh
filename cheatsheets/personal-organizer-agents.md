---
id: personal-organizer-agents
title: Personal Organizer Agents
code: PO
subtitle: 五个本地整理项目。各自构建什么、怎么跑、输入、输出、审阅文件与检查项。
hue: 152
sources: projects/bookmark-path-organizer, projects/calendar-focus-planner, projects/download-folder-sort-desk, projects/field-notes-map-builder, projects/catalog-record-linker
source_hash: 4017cd6c40080599
---

## Node 项目并排对比
type: comparison
span: 2
from: projects/bookmark-path-organizer/README.md, projects/bookmark-path-organizer/solution/cli.ts, projects/calendar-focus-planner/README.md, projects/calendar-focus-planner/solution/cli.ts, projects/field-notes-map-builder/README.md, projects/field-notes-map-builder/solution/cli.ts

| 维度 | Bookmark Path Organizer | Calendar Focus Planner | Field Notes Map Builder |
|---|---|---|---|
| 构建 | 阅读路径页 | 专注计划与 ICS 提案 | GeoJSON 与示意地图 |
| 输入 | `bookmarks` 树，`topics` | `sample.ics`，`tasks.json`，某一天 | `observations`，`radiusMeters` |
| 输出 | `bookmarks.json`，`progress.json`，`report.html` | `focus.ics`，`plan.json`，`plan.html` | `observations.geojson`，`groups.json`，`report.html` |
| 审阅文件 | 第三参数 `progress.json` | 无 | 第三参数 `group-review.json` |
| 从不做 | 抓取链接 | 改账号日历 | 下载照片或瓦片 |

## Python 项目并排对比
type: comparison
from: projects/download-folder-sort-desk/README.md, projects/download-folder-sort-desk/solution/cli.py, projects/catalog-record-linker/README.md, projects/catalog-record-linker/solution/cli.py

| 维度 | Download Folder Sort Desk | Catalog Record Linker |
|---|---|---|
| 构建 | 归档计划与重复组 | 对照表与合并目录 |
| 输入 | `folder`，`occupied` | `left_csv`，`right_csv`，`threshold` |
| 输出 | `moves.json`，`duplicates.json`，`review.html` | `crosswalk.csv`，`merged-catalog.json`，`review.html` |
| 审阅文件 | `--decisions decisions.json` | `--decisions decisions.json` |
| 从不做 | 移动文件 | 仅凭相似度合并 |

## 跑参考实现
type: command-table
span: 2
from: projects/bookmark-path-organizer/README.md, projects/calendar-focus-planner/README.md, projects/calendar-focus-planner/solution/cli.ts, projects/download-folder-sort-desk/README.md, projects/catalog-record-linker/README.md, projects/field-notes-map-builder/README.md

| 命令 | 作用 |
|---|---|
| `node cli.ts sample.json output` | 书签整理器或实地笔记地图 |
| `node cli.ts <input.json> <dir> <review.json>` | 用你下载的审阅再跑一次 |
| `node cli.ts sample.ics tasks.json 2026-10-14 output 10` | 带 10 分钟缓冲的日历计划 |
| `python3 cli.py samples/input.json --output demo-output` | 下载排序台或目录链接器 |
| `python3 cli.py <input.json> --output <dir> --decisions decisions.json` | 应用你的批准 |
| `python3 scripts/project_test.py <project> --all --solution --strict` | 给参考实现打分 |

## 日历规划器步骤
type: flow
from: projects/calendar-focus-planner/solution/main.ts, projects/calendar-focus-planner/solution/cli.ts, projects/calendar-focus-planner/README.md

1. **CLI**：把窗口设为给定日的 09:00 到 17:00 UTC。
2. **parseCalendar**：需要 `UID`、`DTSTART` 和 `DTEND`。跳过已取消和透明事件。
3. **availableSlots**：在事件周围加缓冲，合并重叠，再列出空隙。
4. **schedule**：按优先级、再按 id 排序任务。
5. **schedule**：把每个任务放进最早够长的空隙。
6. **schedule**：放不进任何空隙的任务列为未排程，并给出原因。
7. **exportCalendar**：把提案写到 `focus.ics` 供手动导入。

## 下载排序台
type: architecture
from: projects/download-folder-sort-desk/solution/main.py, projects/download-folder-sort-desk/solution/cli.py, projects/download-folder-sort-desk/API.md

```arch
node | in | 1,1 | input.json | folder, occupied | client
node | inv | 2,1 | inventory() | path, size, sha256 | process
node | cat | 3,1 | categorize() | scores, evidence | process
node | plan | 3,2 | plan_moves() | destination, duplicate_groups | process
node | rev | 2,2 | review_plan() | fingerprint, approved | process
node | out | 1,2 | moves.json | for a file manager | store
edge | in | inv | folder
edge | inv | cat | records
edge | cat | plan | category
edge | plan | rev | plan
edge | rev | out | approved moves
```

## 计分规则
type: concepts
from: projects/bookmark-path-organizer/solution/main.ts, projects/download-folder-sort-desk/API.md, projects/catalog-record-linker/API.md, projects/field-notes-map-builder/solution/main.ts, projects/field-notes-map-builder/README.md

- **书签主题分**：标题中的关键词加 3。笔记中的关键词加 1。
- **书签重复**：去掉 fragment 后 URL 相同。查询串仍然重要。
- **文件类别**：已知扩展名加 3。workshop 和 handout 给 documents 加 1。
- **文件冲突**：目标已被占用时，在扩展名（suffix）前追加 `-2`、`-3`，不区分大小写。
- **目录配对分**：标题 Jaccard 乘 0.8 加创建者 Jaccard 乘 0.2。
- **附近观测**：`distanceMeters()` 用半径 6371008.8 m 的球形地球。
- **地图分组**：半径内的配对并入同一连通分量。

## 默认值与上限
type: defaults
from: projects/calendar-focus-planner/solution/cli.ts, projects/calendar-focus-planner/solution/main.ts, projects/catalog-record-linker/API.md, projects/bookmark-path-organizer/solution/main.ts, projects/field-notes-map-builder/solution/main.ts, projects/download-folder-sort-desk/solution/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| Calendar buffer minutes | 10 | 允许范围 0 到 120 |
| Calendar output folder | `focus-output` | 第四个 CLI 参数 |
| Max tasks | 100 | 分钟 5 到 480，优先级 1 到 5 |
| `threshold` | 0.25 | 有限，从 0 到 1 |
| Folder nesting | 32 | 更深的书签树会失败 |
| Radius | 0..1000000 | 米 |
| `approved` | `False` | 每个计划移动一开始都未批准 |
| `schema_version` | 1 | 在 `moves.json` 和 `merged-catalog.json` 中 |

## 错误消息与修复
type: troubleshooting
from: projects/calendar-focus-planner/solution/main.ts, projects/calendar-focus-planner/README.md, projects/download-folder-sort-desk/solution/main.py, projects/download-folder-sort-desk/solution/cli.py, projects/bookmark-path-organizer/solution/main.ts, projects/catalog-record-linker/solution/main.py, projects/field-notes-map-builder/solution/main.ts

| 症状 | 原因 | 修复 |
|---|---|---|
| `Expand recurrence and timezone values to UTC before importing` | ICS 里有 `RRULE` 或 `TZID` | 先在导出器里展开事件 |
| `Event needs UID, DTSTART and DTEND` | 隐式结束或 `DURATION` | 写显式 `DTEND` |
| `stale approval: source content or destination plan changed` | 审阅后文件或计划变了 | 用新的 `decisions.json` |
| `output must be outside the input folder` | 输出在被扫描文件夹内 | 另选输出路径 |
| `Progress order must contain every current id exactly once` | 下载后书签变了 | 不带第三参数再跑 |
| `one-to-one match violated` | 一条记录被接受了两次 | 每条记录只在一对中接受 |

## 写审阅文件
type: task-table
from: projects/field-notes-map-builder/solution/main.ts, projects/bookmark-path-organizer/solution/main.ts, projects/download-folder-sort-desk/README.md, projects/catalog-record-linker/API.md

| 任务 | 代码 |
|---|---|
| 拆开一个地图组 | `"decisions": {"<id>": "keep-separate"}` |
| 保留一个地图组 | `"decisions": {"<id>": "keep-group"}` |
| 保存阅读顺序 | `"order": [...], "completed": [...]` |
| 批准文件移动 | `"approved": ["<path>"]` |
| 接受一对目录记录 | `"match": true, "values": {}` |
| 给 Node 审阅定版本 | `"schemaVersion": 1` |

## 演算例子
type: qa
from: projects/calendar-focus-planner/solution/sample.ics, projects/calendar-focus-planner/solution/tasks.json, projects/calendar-focus-planner/solution/main.ts, projects/bookmark-path-organizer/solution/sample.json, projects/download-folder-sort-desk/README.md, projects/download-folder-sort-desk/solution/samples/input.json, projects/catalog-record-linker/README.md

- **为什么样例从 09:20 忙到 11:10？** 两个事件重叠，10 分钟缓冲又把它们加宽。
- **哪个任务放不进去？** `deep` 需要 120 分钟。没有空隙那么长。
- **为什么 `map-1` 和 `map-2` 成组？** 规范化后两个 URL 指向同一文档。
- **`handout.txt` 去哪？** `documents/handout.txt` 已被占用，所以在扩展名前追加 `-2`。
- **`left:map-1` 和 `right:r-7` 合并了吗？** 只有你接受这一对之后。不会丢弃任何记录。

## 提示
type: tips
from: projects/calendar-focus-planner/README.md, projects/download-folder-sort-desk/README.md, projects/catalog-record-linker/README.md, projects/field-notes-map-builder/README.md, projects/bookmark-path-organizer/README.md

- 全天 `DTEND;VALUE=DATE` 是排他的。10 月 14 日结束于 `20261015`。
- 文件管理器必须在移动前再次核对身份。计划不是事务。
- `ready` 表示已接受的合并没有未解冲突。并不表示每一对都读过。
- GeoJSON 用经度再纬度的顺序。
- 书签导入器读 JSON 文件夹树，不是浏览器 HTML。
- 集成工具前至少用你自己的一份新输入测一次。
