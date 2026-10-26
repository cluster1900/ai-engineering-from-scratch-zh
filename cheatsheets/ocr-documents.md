---
id: ocr-documents
title: OCR and Document Understanding
code: OD
subtitle: 训练 CTC OCR，选择文档技术栈，用 MaxSim 检索页面，并按精确的源文本片段审批字段。
hue: 165
sources: phases/04-computer-vision/19-ocr-document-understanding, phases/12-multimodal-ai/22-document-diagram-understanding, phases/12-multimodal-ai/23-colpali-vision-native-rag, phases/19-capstone-projects/04-multimodal-document-qa, projects/document-extraction-desk
source_hash: 31f050e1ba845909
---

## 经典 OCR 流水线
type: architecture
from: phases/04-computer-vision/19-ocr-document-understanding/docs/en.md

```arch
node | img | 1,1 | Image | | client
node | det | 2,1 | Text detection | DB, EAST, CRAFT | model
node | box | 3,1 | Bounding boxes | word or line | store
node | crop | 4,1 | Crop each region | fixed height | process
node | rec | 4,2 | Recognition | CRNN + CTC | model
node | txt | 3,2 | Text strings | | store
node | lay | 2,2 | Layout ordering | reading order | process
node | out | 1,2 | Reading-order text | | client
edge | img | det |
edge | det | box |
edge | box | crop |
edge | crop | rec |
edge | rec | txt |
edge | txt | lay |
edge | lay | out |
```

## 代码中的任务
type: task-table
from: phases/04-computer-vision/19-ocr-document-understanding/docs/en.md, phases/04-computer-vision/19-ocr-document-understanding/code/main.py, phases/12-multimodal-ai/22-document-diagram-understanding/code/main.py, phases/12-multimodal-ai/23-colpali-vision-native-rag/code/main.py, phases/19-capstone-projects/04-multimodal-document-qa/code/main.py

| 任务 | 代码 |
|---|---|
| CTC 损失 | `ctc_loss(log_probs, targets, ...)` |
| 贪心 CTC 解码 | `greedy_ctc_decode(log_probs, blank=0)` |
| 文本行识别器 | `TinyCRNN(vocab_size=40, hidden=128, feat=32)` |
| 生产级 OCR | `PaddleOCR(lang="en").ocr(image_path)` |
| LayoutLMv3 输入 | `layoutlm_input(tokens)` |
| Donut JSON schema | `donut_schema("invoice")` |
| 按 MaxSim 取 top-k 页面 | `retrieve(query, pages, k=3)` |

## 用 CTC 训练 CRNN
type: annotated-code
lang: python
from: phases/04-computer-vision/19-ocr-document-understanding/docs/en.md, phases/04-computer-vision/19-ocr-document-understanding/code/main.py

```python
vocab = ["_"] + list("0123456789abcdefghijklmnopqrstuvwxyz")  # blank at index 0
model = TinyCRNN(vocab_size=len(vocab))
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
imgs, targets, target_lens = build_batch(strings, vocab)    # height 32
log_probs = model(imgs)                                     # (W', N, vocab)
input_lens = torch.full((8,), log_probs.size(0), dtype=torch.long)
loss = F.ctc_loss(log_probs, targets, input_lens, target_lens,
                  blank=0, reduction="mean", zero_infinity=True)
opt.zero_grad(); loss.backward(); opt.step()                # ~3 to ~0.2 in 200 steps
```

## MaxSim 后期交互
type: annotated-code
lang: python
from: phases/12-multimodal-ai/23-colpali-vision-native-rag/code/main.py, phases/19-capstone-projects/04-multimodal-document-qa/code/main.py

```python
def maxsim(query_tokens, patches):
    s = 0.0
    for q in query_tokens:                      # one vector per query token
        best = max(cosine(q, p) for p in patches)  # best page patch
        s += best                               # sum over query tokens
    return s
scored = [(p.doc_id, maxsim(query.tokens, p.patches)) for p in pages]
scored.sort(key=lambda x: -x[1])                # top-k pages
idx = build_index(prune=True)                   # DocPruner on, 50% patches
hits = idx.retrieve(q, k=3)
```

## 命令
type: command-table
span: 2
from: projects/document-extraction-desk/README.md, projects/document-extraction-desk/solution/cli.py, phases/19-capstone-projects/04-multimodal-document-qa/code/ts/README.md, phases/19-capstone-projects/04-multimodal-document-qa/code/main.py

| 命令 | 作用 |
|---|---|
| `python3 cli.py sample.txt --schema schema.json --output output/review.html` | 生成 HTML 审核台和一份 JSON 报告 |
| `--proposals <file>` | 载入外部 OCR 或模型给出的候选 |
| `--approve <file>` | 应用从 HTML 审核台下载的决定 |
| `python3 scripts/project_test.py document-extraction-desk --all --solution --strict` | 给参考解答评分 |
| `python main.py` | 运行毕业项目的 MaxSim 与 DocPruner 脚手架 |
| `npm start` | 运行一次查看器自检，然后以 0 退出 |
| `npm run serve` | 在 127.0.0.1 上启动查看器 HTTP 服务 |

## 视觉优先的文档问答
type: flow
from: phases/19-capstone-projects/04-multimodal-document-qa/docs/en.md

1. **导入**：把每个 PDF 页面渲染成 1536x2048 的 PNG。保留 `{doc_id, page_num, image_path}`。
2. **嵌入**：运行 ColQwen2.5-v0.2。每页得到约 2048 个 128 维的 patch 向量。
3. **剪枝**：DocPruner 保留信号最强的一半 patch。
4. **查询**：嵌入查询 token。运行 MaxSim。返回 top-k 页面。
5. **合成**：把查询和 top-5 页面图像交给 VLM。引用 (doc_id, page)。
6. **证据**：在查看器里把引用的边界框画成叠加层。
7. **OCR 兜底**：对公式密集的页面运行 Nougat 或 dots.ocr。
8. **评测**：报告 ViDoRe v3 nDCG@5 和 M3DocVQA，并与先 OCR 再走文本的方案对比。

## 公式与数字
type: concepts
from: phases/04-computer-vision/19-ocr-document-understanding/docs/en.md, phases/12-multimodal-ai/23-colpali-vision-native-rag/docs/en.md

- **CTC 折叠**：先合并重复，再去掉 blank。"h h h _ _ e e l l _ l l o _ _" 得到 "hello"。
- **CER**：Levenshtein 距离除以参考文本长度。WER 是按词计算的同一指标。
- **MaxSim**：对查询 token $q_i$ 与页面 patch $p_j$ 求 $\sum_i \max_j \cos(q_i, p_j)$。
- **ColPali 存储**：50 页 x 729 patch x 128 维 x 4 字节 = 原始约 18 MB，8x PQ 后约 2.3 MB。
- **文本 RAG 存储**：50 个 chunk x 768 维 x 4 字节 = 约 150 kB。ColPali 原始约多 120x，PQ 后约多 15x。
- **ViDoRe**：ColPali-v1 的 nDCG@5 约 80%。文本 RAG 约 50-60%。

## 默认值与上限
type: defaults
from: phases/04-computer-vision/19-ocr-document-understanding/docs/en.md, phases/19-capstone-projects/04-multimodal-document-qa/docs/en.md, projects/document-extraction-desk/solution/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| CER 目标 | < 2% | 在干净的扫描件上 |
| CRNN 输入高度 | 32 | CNN 把高度池化到 1。宽度就是时间轴 |
| 页面渲染 | 180 DPI | 毕业项目中用 PyMuPDF |
| DocPruner | 50% | 准确率损失低于 0.5% |
| Schema 字段 | 1 to 30 | 小写名称，标签唯一 |
| 文档大小 | 100000 | 最多这么多字符 |
| 候选数 | 300 | 每次审核最多这么多个候选 |

## 选择文档技术栈
type: concepts
from: phases/12-multimodal-ai/22-document-diagram-understanding/docs/en.md, phases/12-multimodal-ai/23-colpali-vision-native-rag/docs/en.md, phases/04-computer-vision/19-ocr-document-understanding/docs/en.md

- **大规模印刷发票**：LayoutLMv3 + 规则。成本效率高。
- **混合、手写、表单**：VLM 原生方案（PaliGemma 2 或 Qwen2.5-VL）。
- **arXiv 论文**：数学用 Nougat，图用 VLM。
- **受监管场景**：OCR 流水线 + VLM 校验器交叉核对。
- **结构固定的收据**：微调 Donut。
- **纯文本文档**：文本 RAG。更简单，占用存储更少。
- **视觉信息丰富的 PDF**：要质量用 ColPali，要规模用 VisRAG。

## 故障排查
type: troubleshooting
from: projects/document-extraction-desk/solution/main.py, projects/document-extraction-desk/solution/cli.py, projects/document-extraction-desk/stages/03-review-and-approve/docs/en.md, phases/12-multimodal-ai/22-document-diagram-understanding/docs/en.md, phases/12-multimodal-ai/23-colpali-vision-native-rag/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| "Approval belongs to another document version" | 文本变了，`sourceSha256` 不同 | 重新审核新版本 |
| "Proposal does not match its exact source span" | 引文不在 `start`、`end` 处 | 修正候选的偏移量 |
| "Use an ISO date: YYYY-MM-DD" | 日期字段的文本不是 ISO 格式 | 修正源文本 |
| 字段状态为 ambiguous | 有两处 Seats 引文 | 用 `--approve` 选定一个片段 |
| Donut 处理论文失败 | 免 OCR 模型是专才 | 论文改用 Nougat |
| RAG 中缺少图表数据 | OCR 丢掉了图表数据 | 用 ColPali 嵌入页面图像 |

## 缩写
type: glossary
from: phases/04-computer-vision/19-ocr-document-understanding/docs/en.md, phases/12-multimodal-ai/22-document-diagram-understanding/docs/en.md, phases/12-multimodal-ai/23-colpali-vision-native-rag/docs/en.md

- **CTC**：Connectionist Temporal Classification。无需逐时间步标签即可训练。
- **CRNN**：卷积特征 + BiLSTM + CTC。2015 年的基线。
- **VLM-OCR**：为 OCR 训练或提示的视觉语言模型。
- **DocVQA**：文档 VQA 的标准基准。引用最多的分数。
- **ViDoRe**：Visual Document Retrieval Evaluation。指标是 nDCG@5。
- **PQ**：乘积量化。把存储缩小约 8x。

## 问答
type: qa
from: phases/04-computer-vision/19-ocr-document-understanding/docs/en.md, phases/12-multimodal-ai/22-document-diagram-understanding/docs/en.md, phases/12-multimodal-ai/23-colpali-vision-native-rag/docs/en.md, projects/document-extraction-desk/README.md

- **为什么用 CTC？** 它不需要字符级对齐就能训练。
- **OCR 流水线什么时候仍然占优？** 海量扫描件、确定性的失败模式、可审计的输出。
- **为什么用 MaxSim 而不是取平均？** 每个查询 token 挑出自己最匹配的 patch。无关的 patch 不会把它冲淡。
- **偏移量能证明值是对的吗？** 不能。它们证明的是出处。要由审核人确认字段。
