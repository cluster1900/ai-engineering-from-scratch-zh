# Fork 指南

本课程采用 MIT 许可。你可以自由 fork，并按自己的需要进行调整。下面是推荐做法。

## 面向团队

想把它用作内部培训？Fork 并自定义：

1. Fork repository
2. 移除团队不需要的 phase
3. 添加公司特定的示例和数据
4. 在 outputs 中添加内部工具集成
5. 保留署名 — 这有助于社区成长

## 面向学校和大学

想把它用作课程材料？

1. Fork repository
2. 将 phase 映射到你的学期安排
3. 为 exercises 添加评分 rubrics
4. 添加你自己的作业和考试
5. 考虑把改进贡献回 upstream

## 面向 Bootcamps

在运营付费 bootcamp？MIT 许可允许这样做。

1. Fork 并按 cohort 时间线组织结构
2. 添加视频内容、直播课程、导师辅导
3. 这些 code 和 docs 都可以作为你的构建基础
4. 考虑赞助该项目或贡献回馈

## 面向其他语言

想用另一种 programming language 教授这套课程？

1. Fork repository
2. 用你的语言重新实现 code examples
3. 保留 lesson 结构和 documentation
4. 提交 PR，把你的 fork 链接到主 README

## 让你的 Fork 保持更新

```bash
git remote add upstream https://github.com/rohitg00/ai-engineering-from-scratch.git

git fetch upstream
git merge upstream/main
```

## 署名

MIT 不要求，但我们会很感谢：

```
Based on AI Engineering from Scratch
https://github.com/rohitg00/ai-engineering-from-scratch
```
