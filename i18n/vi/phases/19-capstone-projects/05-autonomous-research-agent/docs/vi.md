# Capstone 05  Thuộc nghiên cứu đại lý 类)

> Sakana's AI-Scientist-v2 đã phát hành một bài báo đầy đủ. Agent Laboratory đã tiến hành một thí nghiệm. Allen AI chia sẻ dấu vết.

**Type:** Capstone
**Languages:** Python（agent + sandbox）、LaTeX（output）
**Prerequisites:** Phase 2（ML）、Phase 3（Deep Learning）、Phase 7（transformers）、Phase 10（LLMs from scratch）、Phase 14（agents）、Phase 15（autonomous）、Phase 16（multi-agent）、Phase 18（safety）
**Phases exercised:**P0 · P2 · P3 · P7 · P10 · P14 · P15 · P16 · P18
**Time:** 40 小时

## 问题
Các nhà nghiên cứu tự do trong 2026 đã trải qua một khóa học. Các nhà khoa học AI của Sakana AI-v2 được xuất bản trên Nature, bài báo được tạo ra đã qua đánh giá đối tác của hội thảo ShinkaEvolve (ICLR 2026) sẽ mở rộng hướng này đến giả thuyết tiến hóa.

Bạn sẽ qua trong một ý tưởng hạt giống trong một lĩnh vực hẹp để thực hiện một đại lý như vậy để học vòng lặp này (ví dụ, trong 100M 参数变压器 trên làm sự trừu tượng sự ít có thể)  Giá trị không phải là lần đầu tiên chạy để tìm thấy thứ mới  giá trị nằm trong cơ sở hạ tầng: cây tìm kiếm  thí nghiệm sandbox  nhà văn-bảo sát viên vòng lặp  báo cáo nhóm đỏ  Sakana 团队 ghi lại thất bại sandbox thoát; đại lý của bạn  phải thông qua cùng một nhóm đỏ 

## 概念
Đây là một đại lý là một tìm kiếm cây tốt nhất đầu tiên. 节点是实验规格:  giả thuyết, cấu hình, mã, kết quả mong đợi)  mở rộng 步骤 thông qua thay đổi nhỏ đưa ra trẻ em.  thay thế tối ưu hóa, điều chỉnh kích thước lô, áp dụng một bộ phận.  Mỗi trẻ em trong một hộp cát mới có nguồn lực cứng lên giới hạn được vận hành.

nhà văn là Multimodal của. Nó tạo ra bản thảo LaTeX, biên dịch, hình ảnh, và chuyển lại hình ảnh của Claude Opus 4.7 sau khi nó được 染, sử dụng chế độ nhìn của định dạng phê bình, hình ảnh có thể đọc được, cũng như sự sắp xếp bằng chứng tuyên bố.

An toàn là chịu trọng cấu trúc. Mỗi thử nghiệm đều trong không có lối thoát mạng, có giới hạn tường-thành-clock, hạn chế nguồn lực cố định của E2B hoặc Daytona sandbox trong hoạt động.

## 架构
```
seed idea + domain
      |
      v
  literature search (Semantic Scholar + OpenAlex + FAISS cache)
      |
      v
  LangGraph plan-execute-verify tree
      |
      v
  +--- expand node ----+      per-node sandbox
  |                    |      (E2B / Daytona)
  v                    v      resource caps
  child_1           child_k   no network egress
  |                    |      deterministic seeds
  v                    v
  run experiment       run experiment
  |                    |
  v                    v
  score nodes by (novelty, quality, budget)
      |
      v
  best branch -> LaTeX writer
      |
      v
  compile + vision critique (Opus 4.7 vision)
      |
      v
  reviewer ensemble (5 LLM judges, NeurIPS rubric)
      |
      v
  paper.pdf + review.md + trace.json
```

## 技术
- Phong nhạc:带 kiểm soát và cổng chấp thuận con người của LangGraph
- Tìm kiếm cây: dựa trên tự định nghĩa nút thử nghiệm tốt nhất-lần đầu tiên(từ Sakana v2 của AB-MCTS-style)
- Sandbox: mỗi thử nghiệm một E2B, Docker-in-Docker fallback; thông qua các nhóm
- Văn học:Semantic Scholar Graph API + OpenAlex + 本地 FAISS kho lưu trữ trừu tượng
- Tác giả:Temple LaTeX + Claude Opus 4.7 (Phương thức xem) được sử dụng để chỉ trích hình ảnh và bố cục
- Đánh giá viên: 5 个 thẩm phán của tập đoàn ((Opus 4.7 √ GPT-5.4 √ Gemini 3 Pro√ DeepSeek R1√ Qwen3-Max),带 trọng lượng tổng hợp
- Khung thí nghiệm: dùng để thử nghiệm vật lý của PyTorch 2.5, W&B dùng để ghi chép
- Hình ảnh: Longfuse dùng để theo dõi đại lý, mỗi bài luận 30 đô la ngân sách


```figure
ce-experiment-tree
```

##  xây dựng nó
1. **Seed and domain scoping.**选取一个种子想法 (ví dụ:调查 các mô hình sự ít tính trong bản đồ chú ý của các biến đổi sub-1B) ) 定义搜索空间:model、dataset、computing budget──

2. **Literature pass.**查询 Semantic Scholar + OpenAlex 中最相关且引用最多的 50 篇论文;本地缓存摘要;生成 1 页域名消化──

3. **Tree scaffolding.**Sử dụng giả thuyết hạt giống  khởi sự gốc.`expand(node) -> children`, dùng một đề xuất thay đổi nhỏ (bọn trẻ em một thay đổi cấu hình)`score(node)`实现为加权的新奇 × chất lượng × ngân sách 项──

4. **Sandbox wrapping.**Mỗi thí nghiệm đều chạy.`docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only`(或等价的 E2B chính sách) 种子 写入沙盒;输出以只读的方式 装回外部。

5. **Plan-execute-verify loop.** `plan` đề xuất con cái.`execute`运行 sandbox, bắt giữ log 和 metric`verify`Đối với metric 运行 đơn vị kiểm tra ((trái hư hỏng có giảm không?ablation có tách effect?)

6. **Writer.**Với số liệu 染 , thông qua Claude Opus 4.7 生成 LaTeX dự thảo,并把分支痕 放入文本──编译──把编译后的 PDF 送回 Opus 4.7 vision 进行批评──代──

7. **Reviewer ensemble.**五个评委 根据 NeurIPS 风格 rubric,对草案的(novelty、rigor、clearity、reproducibility、impact)打分──如果意思 <4.0/5,则带批判 返回作家──3次重写 后硬停止──

8. **Red team.**构建或集成一组针对沙盒的对抗任务:fork bomb、网络脱试图、文件系统逃逸、LLM 写出的 shell metacharacter──确认全部被阻止──写出发现──

9. **Reproducibility.**Mỗi bài báo đều có dấu vết tìm kiếm cây JSON, hạt giống, liên kết chạy W&B, cấu hình hộp số, cũng như một kết thúc đến kết thúc có thể đọc lại nó.

## Sử dụng nó
```
$ ai-scientist run --seed "attention sparsity in sub-1B transformers" --budget 30
[lit]    50 papers, digest in 12s
[tree]   expanded 8 nodes, budget 12/30
[exec]   node #3 sparsity=top-8, loss=2.83 (best so far)
[exec]   node #6 sparsity=top-4, loss=3.12 (worse)
[exec]   ...
[tree]   chose branch rooted at node #3 (novelty 0.62, quality 0.81)
[write]  LaTeX draft v1 complete
[vision] critique: figure 2 legend too small, claim-evidence ok
[write]  draft v2 after 3 edits
[review] mean 4.2/5 (novelty 3.9, rigor 4.3, clarity 4.1, repro 4.5, impact 4.2)
[done]   paper.pdf + review.md + trace.json     $28.40 spent
```

## 交付 nó
`outputs/skill-ai-scientist.md`Đó là một thứ giao hàng. Đưa ra một ý tưởng hạt giống + một tên miền + ngân sách 30 đô la. Nó sẽ chạy toàn bộ đường ống, và xuất ra một bài báo có thể xem xét, cũng như một gói khả năng tái tạo.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Paper quality | 根据已发表 workshop paper 做 blind rubric review |
| 20 | Experimental rigor | Baseline、seed、ablation；每个 claim 都由 results table 中的一个 cell 支撑 |
| 20 | Cost and compute discipline | 强制执行 $30/paper 上限，并由 Langfuse trace |
| 20 | Safety | Sandbox red team 通过；network policy 和 kill-switch 已验证 |
| 15 | Reproducibility | 使用相同 seed 一条命令 rerun 可复现 paper |
| **100** | | |

## 练习
1. Sử dụng cùng một miền trong ba ý tưởng hạt giống khác nhau 运行管道──比较树-search 哪些部分重叠──识别重复浪费的计算──

2. Trong việc thực hiện thí nghiệm, để ước tính hơn 5 đô la, thêm cổng của con người trong vòng.

3. Sẽ tập đoàn đánh giá 换 thành một thẩm phán  đo trên một nhóm bài báo nổi tiếng-rút lên tỷ lệ chấp nhận sai lầm 

4. 引入 mạng-exfiltration nhóm đỏ thử nghiệm: đại lý 写出尝试 `curl`n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n`--network=none`Chính sách ngăn chặn nó.

5. Để tìm kiếm cây của bạn với đường cơ sở ngẫu nhiên phẳng so sánh( cùng ngân sách, không có chiến lược mở rộng)  báo cáo sự mới x tăng chất lượng 

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Tree search | “AB-MCTS-style expansion” | 用 novelty×quality×budget score 在 experiment node 上进行 best-first exploration |
| Sandbox | “Experiment isolation” | 无 network、CPU/memory 有界、固定 seed、read-only input 的 container |
| Vision critique | “Render-then-read” | 将 paper 编译为 PDF，把 PDF 送回 VLM，用于 layout 和 claim-evidence critique |
| Reviewer ensemble | “Automated peer review” | 多个 LLM judge 使用 NeurIPS rubric 为 paper 打分；weighted aggregate gate 控制 pipeline |
| Novelty score | “Is this new?” | 对接近 50-paper literature cache 的内容施加惩罚的 heuristic |
| Cost ceiling | “$ budget” | 每篇 paper 的总花费硬上限；Langfuse counter + pre-run estimate |
| Red team | “Sandbox-escape audit” | 如果 policy 错误就会逃出 sandbox 的 adversarial task |

## 延伸阅读
- [Sakana AI-Scientist-v2 repository](https://github.com/SakanaAI/AI-Scientist-v2) 参考 cơ quan nghiên cứu sản xuất
- [Sakana AI-Scientist-v1 paper (arXiv:2408.06292)](https://arxiv.org/abs/2408.06292) Phương pháp nguyên thủy
- [ShinkaEvolve (Sakana ICLR 2026)](https://sakana.ai) tiến hóa 扩展
- [Agent Laboratory (AMD)](https://github.com/SamuelSchmidgall/AgentLaboratory) Quản lý phòng thí nghiệm nghiên cứu đa vai trò
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) 参考 lớp dàn nhạc
- [Semantic Scholar Graph API](https://api.semanticscholar.org/) Tìm kiếm văn học
- [E2B sandboxes](https://e2b.dev) 参考 thử nghiệm cách ly
- [NeurIPS reviewer guidelines](https://neurips.cc/Conferences/2026/Reviewer-Guidelines) nhóm đánh giá 编码的 Rubric
