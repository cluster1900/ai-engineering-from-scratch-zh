# Câu hỏi trả lời 系统

> 三类系统塑造了现代QA──Extractive 找到 spans──Retrieval-augmented 将它们地在文件中──Generative 生成答案──每一个现代AI助手都是这三者的混合──

**Type:** Build
**Languages:** Python
**先修要求：**Giai đoạn 5 · 11 (T dịch máy), Giai đoạn 5 · 10 (Lưu ý)
**Time:** ~75 minutes

## 问题

Người dùng nhập mục "Khi nào iPhone đầu tiên ra mắt?", kỳ vọng được "Ngày 29 tháng 6 năm 2007." Không phải "lịch sử của Apple là dài và đa dạng. " cũng không đơn giản là "2007", không có câu trả lời.

Trong thập kỷ qua, 3 kiến trúc đã tạo ra QA.

- **Extractive QA。**给定一个问题 和一个已知包含答案的段落, 在段落中找到答案跨度的开始和结尾指数──SQuAD là một tiêu chuẩn công giáo──
- **Open-domain QA。**đoạn văn không được đưa ra. Trước tiên lấy đoạn văn liên quan, sau đó lấy hoặc tạo ra một câu trả lời. Đó là nền tảng của mỗi đường ống RAG ngày nay.
- **Generative / Closed-book QA。**Một mô hình ngôn ngữ lớn từ bộ nhớ tham số của nó. Không có truy xuất.

Xu hướng năm 2026 là lai: lấy lại một vài đoạn tốt nhất, sau đó đưa ra một mô hình tạo ra, để nó dựa trên những đoạn đó 作答── đó là RAG, bài học 14 sẽ nói sâu về lấy lại, đây là một nửa──本课构建QA, đây là một nửa──

## 概念

![QA architectures: extractive, retrieval-augmented, generative](../assets/qa.svg)

**Extractive。**Với biến đổi (BERT family) cùng mã hóa câu hỏi 和 passage──训练两个头,分别预测答案的开始和结尾符号指数──Loss 是在有效位置上的横向──输出是 passage中的一个 span──按构不会幻觉,也按构无法处理 passage 不能回答问题──

**Retrieval-augmented (RAG)。**Hai giai đoạn. Đầu tiên, lấy lại từ thân xác tìm thấy trên cùng.`k`Các đoạn văn, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người đọc, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng, người dùng dùng dùng, người dùng dùng, người dùng dùng, người dùng dùng dùng dùng dùng, người dùng dùng dùng dùng dùng dùng dùng dùng, người dùng dùng dùng dùng dùng dùng dùng, người dùng dùng dùng dùng dùng dùng dùng dùng dùng dùng để dùng dùng dùng để dùng dùng để dùng dùng dùng dùng để chia sẻ, người dùng dùng để chia sẻ, người dùng dùng để chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia sẻ chia

**Generative。**Một chương trình chỉ có trình giải mã (LLM) GPT、Claude、Llama) từ các trọng lượng học được. Không có bước tìm lại.


```figure
qa-span
```

##  xây dựng nó

### 步骤 1: Sử dụng mô hình được đào tạo trước thực hiện QA chiết xuất

```python
from transformers import pipeline

qa = pipeline("question-answering", model="deepset/roberta-base-squad2")

passage = (
    "Apple Inc. released the first iPhone on June 29, 2007. "
    "The device was announced by Steve Jobs at Macworld in January 2007."
)
question = "When was the first iPhone released?"

answer = qa(question=question, context=passage)
print(answer)
```

```python
{'score': 0.98, 'start': 57, 'end': 70, 'answer': 'June 29, 2007'}
```

`deepset/roberta-base-squad2`Trong SQuAD 2.0 上训练, trong đó bao gồm các câu hỏi không có câu trả lời.`question-answering`pipeline ngay cả khi trong mô hình điểm không có điểm  thắng, cũng sẽ quay lại điểm cao nhất span, nó * sẽ không * tự động quay lại空答案── để có được rõ ràng "không trả lời" hành vi, xin vào trong pipeline call 中传进 `handle_impossible_answer=True`Khi điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không đạt được điểm không chỉ đạt được điểm không chỉ đạt được điểm không được điểm không được điểm không được điểm không được điểm không được điểm không được điểm không được điểm không được điểm không được điểm không được điểm`score`字段。

### 步骤 2: Một đường ống tăng cường thu hồi (草图)

```python
from sentence_transformers import SentenceTransformer
import numpy as np

encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

corpus = [
    "Apple Inc. released the first iPhone on June 29, 2007.",
    "Macworld 2007 featured the iPhone announcement by Steve Jobs.",
    "Android launched in 2008 as Google's mobile operating system.",
    "The first iPod was released in 2001.",
]
corpus_embeddings = encoder.encode(corpus, normalize_embeddings=True)


def retrieve(question, top_k=2):
    q_emb = encoder.encode([question], normalize_embeddings=True)
    sims = (corpus_embeddings @ q_emb.T).squeeze()
    order = np.argsort(-sims)[:top_k]
    return [corpus[i] for i in order]


def answer(question):
    passages = retrieve(question, top_k=2)
    combined = " ".join(passages)
    return qa(question=question, context=combined)


print(answer("When was the first iPhone released?"))
```

两阶段管道──Dense retriever(Sentence-BERT) thông qua sự tương đồng ngữ nghĩa 找到相关段落──Extractive reader(RoBERTa-SquAD) từ các đoạn trên cùng并后 中抽取答 span──适用于小型 corpora──对于百万文档级 corpus,使用 FAISS或向量数据库──

### 步骤 3: Sử dụng RAG làm tạo

```python
def rag_generate(question, llm):
    passages = retrieve(question, top_k=3)
    prompt = f"""Context:
{chr(10).join('- ' + p for p in passages)}

Question: {question}

Answer using only the context above. If the context does not contain the answer, say "I don't know."
"""
    return llm(prompt)
```

mô hình nhanh chóng  rất quan trọng. 明确告诉模型 基于语境 作答,并在语境 不足时回复"Tôi không biết",相比无明提示,可将幻觉率降低 40-60%──更复杂的模式 会加入引用、信心分和结构化提取──

### 步骤 4: 反映 đánh giá thế giới thực

SQUAD 使用 **Exact Match (EM)**和 **token-level F1** EM là sự phù hợp nghiêm ngặt sau bình thường hóa (→ "Em" sau: "Em" vs "Em" ngày 29 tháng 6 năm 2007" thường sẽ có 0 EM (Ordinal)  phá vỡ bình thường hóa), nhưng vẫn vì các token chồng chéo (F1)

 Đối với sản xuất QA:

- **Answer accuracy**(Điều trị của LLM hoặc người, vì các metrics không thể nắm bắt sự tương đương ngữ nghĩa)
- **Citation accuracy。**引用的 passage 是否真的支持答案? có thể thông qua các trích dẫn được tạo ra và các đoạn trích được lấy lại 字符串 phù hợp tự động kiểm tra, độ khó là rất thấp.
- **Refusal calibration。**Khi câu trả lời không trong các đoạn trích 中时,系统是否正确说出"Tôi không biết"? đo lường tỷ lệ tin tưởng sai lầm.
- **Retrieval recall。**Trước khi đánh giá người đọc, hãy đánh giá xem liệu người đọc có đưa đoạn văn đúng hay không.`k`◊ reader 无法修复缺失的段落──

### RAGAS:2026 năm khung đánh giá sản xuất

`RAGAS`Nó được thiết kế chuyên về hệ thống RAG, và là mặc định hàng hóa năm 2026 . Trong trường hợp không cần tham chiếu vàng, nó được phân chia theo bốn chiều:

- **Faithfulness。**Câu trả lời trong mỗi câu hỏi là liệu nó có đến từ ngữ cảnh được lấy lại không?
- **Answer relevance。**Câu trả lời là có trả lời câu hỏi? Bằng cách trả lời tạo ra những câu hỏi giả thuyết,并 với câu hỏi thực sự so sánh để đo lường.
- **Context precision。**Trong các mảnh thu hồi, tỷ lệ liên quan thực tế là bao nhiêu? Độ chính xác thấp = âm thanh nhanh trong số.
- **Context recall。**Set được lấy lại có chứa tất cả các thông tin cần thiết không?

Đánh giá không tham khảo 让你在没有策划的黄金答案的情况下评估现场生产流量── đối với các số liệu phù hợp chính xác 无用的开放式问题, 叠加LLM-as-judge──

`pip install ragas`△ kết nối với máy tìm kiếm + người đọc của bạn ◦ mỗi truy vấn  nhận được bốn thang đo ◦ đối với sự lùi  phát hành cảnh báo ◦

## Sử dụng nó

2026 năm.

| Use case | Recommended |
|---------|-------------|
| 给定 passage，找到 answer span | `deepset/roberta-base-squad2` |
| 在固定 corpus 上，closed-book 不可接受 | RAG: dense retriever + LLM reader |
| 对 document store 做 real-time QA | RAG with hybrid (BM25 + dense) retriever + reranker (lesson 14) |
| Conversational QA（follow-up questions） | LLM with conversation history + RAG on each turn |
| 高度事实性、regulated domains | 对 authoritative corpus 做 Extractive；绝不单独使用 generative |

Quá trình trích xuất đã không phổ biến vào năm 2026, bởi vì RAG của LLM có thể xử lý nhiều hơn tình huống.

## 交付 nó

保存为 `outputs/skill-qa-architect.md`- Có thể là:

```markdown
---
name: qa-architect
description: Choose QA architecture, retrieval strategy, and evaluation plan.
version: 1.0.0
phase: 5
lesson: 13
tags: [nlp, qa, rag]
---

Given requirements (corpus size, question type, factuality constraint, latency budget), output:

1. Architecture. Extractive, RAG with extractive reader, RAG with generative reader, or closed-book LLM. One-sentence reason.
2. Retriever. None, BM25, dense (name the encoder), or hybrid.
3. Reader. SQuAD-tuned model, LLM by name, or "domain-fine-tuned DistilBERT."
4. Evaluation. EM + F1 for extractive benchmarks; answer accuracy + citation accuracy + refusal calibration for production. Name what you are measuring and how you are measuring it.

Refuse closed-book LLM answers for regulatory or compliance-sensitive questions. Refuse any QA system without a retrieval-recall baseline (you cannot evaluate the reader without knowing the retriever surfaced the right passage). Flag questions that require multi-hop reasoning as needing specialized multi-hop retrievers like HotpotQA-trained systems.
```

## 练习

1. **Easy。**Trong 10 đoạn Wikipedia trên, bạn sẽ thấy 7-9 câu hỏi chính xác.
2. **Medium。**添加一个拒绝分类器──当最高检索分 低于值(比如0.3 cosine)时, trả lại "Tôi không biết",而不是调用读者──在保留设置上调整门──
3. **Hard。**Trong một tập hợp 10.000 tài liệu bạn chọn, hãy xây dựng một đường ống dẫn RAG. Thực hiện việc thu thập lai vi khuẩn (BM25 + dày đặc) và hợp nhất RRF.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Extractive QA | 找到 answer span | 在给定 passage 中预测 answer 的 start 和 end indices。 |
| Open-domain QA | 对 corpus 做 QA | 没有给定 passage；必须先 retrieve，再 answer。 |
| RAG | Retrieve then generate | Retrieval-augmented generation。Retriever + reader pipeline。 |
| SQuAD | Canonical benchmark | Stanford Question Answering Dataset。EM + F1 metrics。 |
| Hallucination | 编造出来的 answer | Reader output 不受 retrieved context 支持。 |
| Refusal calibration | 知道什么时候闭嘴 | 系统在无法回答时正确说出 "I don't know"。 |

## 延伸阅读
- [Rajpurkar et al. (2016). SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250) điểm chuẩn 论文。
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR,QA của canonical dense retriever。
- [Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) 命名 RAG 的论文──
- [Gao et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey](https://arxiv.org/abs/2312.10997) toàn diện của RAG khảo sát
