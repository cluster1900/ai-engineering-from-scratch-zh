---
name: skill-constitutional-rules-engine
description: 用于输出约束的声明性 YAML 规则引擎，具有严重性、解释、修复程序操作和结构化差异
version: 1.0.0
phase: 19
lesson: 86
tags: [safety, rules, constitutional]
---
# Constitutional Rules Engine

规则集是一个 YAML 文件。每个规则都有 `name`、`severity`（低 | 中 | 高）、`applies_when`（谓词）、`must`（谓词）、`explanation` 和可选的 `fix`。

## 谓词

原子：

- `contains_regex` / `not_contains_regex`
- `starts_with_regex` / `ends_with_regex`
- `max_words` / `min_words`

成分：

- `all_of: [...predicates]`
- `any_of: [...predicates]`
- `not_: predicate`

## 修复操作

- `append_if_missing: <suffix>`
- `prepend_if_missing: <prefix>`
- `replace_regex: { pattern: <regex>, replacement: <text> }`

## 发动机输出

`Engine.evaluate(text) -> EngineReport` 每条规则返回一个 `RuleResult`，`status` 位于 `pass`、`violation`、`not_applicable` 中。 `report.violations()` 过滤违规行为，`report.max_severity()` 返回当前最严重的严重性。

## artifact

`outputs/rules_report.json` 携带每个案例的草稿、修订版和结构化差异。