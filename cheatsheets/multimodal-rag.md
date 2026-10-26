---
id: multimodal-rag
title: Multimodal and Vision-Native RAG
code: MV
subtitle: 嵌入页面图像，用 MaxSim 打分，融合多种模态，并引用证据区域。Python 和 TypeScript 代码均来自课程。
hue: 285
sources: phases/12-multimodal-ai/23-colpali-vision-native-rag, phases/12-multimodal-ai/24-multimodal-rag-cross-modal, phases/19-capstone-projects/04-multimodal-document-qa, projects/visual-evidence-library
source_hash: f1c3b60c3549aa6a
---

## 视觉优先的文档问答流水线
type: architecture
from: phases/19-capstone-projects/04-multimodal-document-qa/docs/en.md

```arch
node | pdf | 1,1 | PDFs | page renderer, 180 DPI | client
node | emb | 2,1 | ColQwen2.5-v0.2 | ~2048 patches per page | model
node | prune | 3,1 | DocPruner | 50% compression | process
node | idx | 4,1 | Multi-vector index | Vespa or Qdrant | store
node | query | 1,2 | Query | token embeddings | client
node | ret | 2,2 | Retrieve top-k | MaxSim | process
node | vlm | 3,2 | VLM answerer | query + page images | model
node | view | 4,2 | Viewer | boxes on source page | client
edge | pdf | emb | page images
edge | emb | prune | patches
edge | prune | idx |
edge | query | ret |
edge | idx | ret | MaxSim
edge | ret | vlm | top-k pages
edge | vlm | view | cited pages + regions
```

## 代码中的任务
type: task-table
from: phases/12-multimodal-ai/23-colpali-vision-native-rag/code/main.py, phases/19-capstone-projects/04-multimodal-document-qa/code/main.py, phases/12-multimodal-ai/24-multimodal-rag-cross-modal/code/main.py, projects/visual-evidence-library/solution/main.py

| 任务 | 代码 |
|---|---|
| 给一页打分 | `maxsim(query_tokens, patches)` |
| 给玩具页面排序 | `retrieve(query, pages, k=3)` |
| 剪枝 patch | `doc_prune(patches, keep_fraction=0.5)` |
| 带剪枝建索引 | `build_index(prune=True)` |
| 融合三种模态 | `fuse([t, i, a], [0.3, 0.4, 0.3])` |
| 低置信度时重试 | `agentic_loop(query, confidence_floor=0.8)` |
| 检查 manifest | `validate_manifest(manifest, root)` |
| 搜索文本区域 | `search(assets, query, limit=20)` |

## 运行课程与项目
type: command-table
from: phases/19-capstone-projects/04-multimodal-document-qa/code/main.py, phases/19-capstone-projects/04-multimodal-document-qa/code/ts/README.md, phases/19-capstone-projects/04-multimodal-document-qa/code/ts/package.json, projects/visual-evidence-library/README.md
span: 2

| 命令 | 作用 |
|---|---|
| `python main.py` | 毕业项目的 MaxSim 脚手架，外加一次剪枝消融实验 |
| `npm start` | 用 `--demo` 跑一遍查看器自检。以 0 退出 |
| `npm run serve` | 在 127.0.0.1 上启动 HTTP 查看器。未设置 `PORT` 时使用空闲端口 |
| `npm test` | fixture、HTML 转义和路由测试 |
| `python3 scripts/project_test.py visual-evidence-library --init my-visual-evidence-library` | 创建未完成的工作区 |
| `python3 scripts/project_test.py visual-evidence-library --stage 1 --path my-visual-evidence-library` | 给第 1 阶段评分 |
| `python3 main.py --manifest ./fixtures/manifest.json --query "return dry seeds" --out ./visual-output` | 写出 index.html 和 evidence.json |
| `python3 demo.py` | 在原始 fixture 上运行搜索 |

## MaxSim 后期交互
type: annotated-code
lang: python
from: phases/19-capstone-projects/04-multimodal-document-qa/code/main.py

```python
def max_sim_score(query_tokens, doc_patches):
    total = 0.0
    for q in query_tokens:            # one vector per query token
        best = -1e9
        for p in doc_patches:         # every patch on the page
            s = dot(q, p)
            if s > best:
                best = s
        total += best                 # sum of the best match per token
    return total
idx = build_index(prune=True)         # DocPruner keeps 50% of patches
hits = idx.retrieve(q, k=3)           # list of (Page, score)
```

## 分数融合与智能体式重试
type: flow
from: phases/12-multimodal-ai/24-multimodal-rag-cross-modal/code/main.py, phases/12-multimodal-ai/24-multimodal-rag-cross-modal/docs/en.md

1. **拆解**："quiet" 交给音频，"vegan brunch" 交给文本，"natural light" 交给图像。
2. **text_retrieve**：统计评论文本中的关键词次数，再除以关键词个数。
3. **image_retrieve**：查询提示映射到 `natural_light`、`airy` 这类标签。
4. **audio_retrieve**："quiet" 得到 `1.0 - r.ambient_db / 80.0`。否则为 0.5。
5. **fuse**：按权重 0.3、0.4、0.3 加权求和。`top_k` 保留 3 个。
6. **检查**：最高分低于 `confidence_floor` 时追加 " bright windows low noise"。
7. **第 2 轮**：用权重 0.3、0.5、0.2 再融合一次。
8. **grounded_generate**：每个命中都引用评论、图像标签和环境 dB。

## 方案并排对比
type: comparison
from: phases/12-multimodal-ai/23-colpali-vision-native-rag/docs/en.md

| 因素 | ColPali | VisRAG | 文本 RAG |
|---|---|---|---|
| 页面向量 | $N_p$ 个 patch 向量 | 一个池化向量 | 每个 chunk 一个向量 |
| 打分 | MaxSim | 双编码器 | 在 chunk 上算余弦 |
| OCR 步骤 | 无 | 无 | OCR / pdftotext |
| 存储 | PQ 后约为文本 RAG 的 15x | 更小 | 每 50 个 chunk 约 150 kB |
| 召回 | 强 | 较弱 | 丢失图表和表格 |
| 适用于 | 质量 | 规模 | 纯文本文档 |

## 何时用 X
type: tips
from: phases/12-multimodal-ai/23-colpali-vision-native-rag/docs/en.md, phases/12-multimodal-ai/24-multimodal-rag-cross-modal/docs/en.md

- 财报、论文、合同和病历用 ColPali 或 ColQwen2。
- 索引速度和存储比召回更重要时用 VisRAG。
- wiki 文章、聊天记录和数百万页的档案用文本 RAG。
- 监管要求可提取的 OCR 文本时用文本 RAG。
- 文本与图像用 CLIP 或 SigLIP 2。文本与音频用 CLAP。
- 先用分数融合。A/B 显示明显收益后再升级到 MoE 融合。

## 公式与数字
type: concepts
from: phases/12-multimodal-ai/23-colpali-vision-native-rag/docs/en.md, phases/19-capstone-projects/04-multimodal-document-qa/docs/en.md

- **MaxSim**：对查询 token 与页面 patch 求 $\sum_i \max_j \cos(q_i, p_j)$。
- **ColPali 存储**：50 * 729 * 128 * 4 字节 = 原始约 18 MB，8x PQ 后约 2.3 MB。
- **文本 RAG 存储**：50 个 chunk * 768 维 * 4 字节 = 约 150 kB。
- **PQ**：把存储缩小约 8x，并保持向量相似度。
- **ViDoRe**：ColPali-v1 的 nDCG@5 约 80%。文本 RAG 约 50-60%。
- **ColQwen 页面**：约 2048 个 128 维的 patch 嵌入。
- **DocPruner**：压缩 50%，准确率损失 < 0.5%。
- **毕业项目目标**：10k 页，把 top-5 页交给 VLM，回答用时低于 2s。

## 默认值
type: defaults
from: phases/19-capstone-projects/04-multimodal-document-qa/code/main.py, phases/12-multimodal-ai/24-multimodal-rag-cross-modal/code/main.py, projects/visual-evidence-library/solution/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `EMB_DIM` | 16 | 毕业项目里的假 patch 向量 |
| `keep_fraction` | 0.5 | `doc_prune` 至少保留 1 个 patch |
| 检索 k | 5 | 按 MaxSim 取的 top 页面 |
| `confidence_floor` | 0.8 | `main` 传入 0.7 |
| `search` limit | 20 | 必须在 1 到 100 之间 |
| `--query` | seed return | 证据库 CLI |
| `--model` | local-vision-model | 与 `--vision-image` 一起使用 |
| `--out` | visual-output | 存放 index.html 和 evidence.json |

## Manifest 与候选错误
type: troubleshooting
from: projects/visual-evidence-library/solution/main.py, projects/visual-evidence-library/README.md

| 现象 | 原因 | 解决 |
|---|---|---|
| Asset IDs must be nonempty and unique | `id` 为空或重复 | 给每个素材一个唯一 id |
| Image dimensions must be positive integers at most 20000 | `width` 或 `height` 有误 | 声明整数像素尺寸 |
| Asset must be an image inside the manifest directory | 路径逃出了根目录，或后缀不对 | 在根目录下使用 .svg、.png、.jpg 或 .jpeg |
| Asset exceeds 5 MB | 文件过大 | 缩小图像 |
| Bounding box lies outside the declared image dimensions | x + w 或 y + h 过大 | 修正 `bbox` |
| Model-proposed text needs explicit review before indexing | `reviewed` 不为 true | 检查图像后设置 reviewed=true |
| Vision extraction requires --provider-url, --width and --height | 缺少参数 | 三个都要传 |
| Image bytes do not match the extension | PNG 或 JPEG 的魔数不一致 | 使用正确的扩展名 |

## 缩写
type: glossary
from: phases/12-multimodal-ai/23-colpali-vision-native-rag/docs/en.md, phases/12-multimodal-ai/24-multimodal-rag-cross-modal/docs/en.md, phases/19-capstone-projects/04-multimodal-document-qa/docs/en.md

- **MaxSim**：每个查询 token 取最大相似度，再在整个查询上求和。
- **ViDoRe**：Visual Document Retrieval Evaluation。指标是 nDCG@5。
- **PQ / OPQ**：乘积量化。压缩 patch 向量。
- **VisRAG**：用 VLM 把每页池化成一个向量。
- **M3DocRAG**：跨文档检索页面，用于多页推理。
- **MoE 融合**：门控网络路由到各模态专家。
- **MuRAG**：开启多模态 RAG 的 2022 年论文。
- **证据区域**：答案片段在源页面上的 bbox。

## 问答
type: qa
from: phases/12-multimodal-ai/23-colpali-vision-native-rag/code/main.py, phases/12-multimodal-ai/23-colpali-vision-native-rag/docs/en.md, phases/12-multimodal-ai/24-multimodal-rag-cross-modal/docs/en.md, projects/visual-evidence-library/README.md

- **为什么用 MaxSim，而不是平均相似度？** 无关的 patch 会冲淡平均值。
- **混合来源怎么引用？** 文本 `[1]`，图像 `[img 3]`，音频 `[audio 2 at 0:34]`。
- **跨模态 RAG 怎么评分？** 各模态的 Recall@k，以及融合后的 top-k 准确率。
- **证据库会做 OCR 吗？** 不会。它只索引提供的文本矩形。
- **什么是查询覆盖率？** 匹配的词数除以查询词数。它不是置信度。
