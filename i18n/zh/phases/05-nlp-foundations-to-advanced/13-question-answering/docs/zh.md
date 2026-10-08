# 问题答案系统

> 三类系统塑造了现代QA──提取性 找到跨度──恢复增强性 将它们将地带到文件中──生成性 生成答案──每一个现代人工智能助理都是这三者的混合──

**Type:** Build
**Languages:** Python
**先修要求：**五期·11期 (机器翻译),五期·10期 (注意)
**Time:** ~75 minutes

## 问题

用户输入"第一款iPhone发布时间是什么时候?",期望得到"2007年6月29日". 不是"果的历史漫长而多样化.

过去十年,三种建筑主导了QA.

- **Extractive QA。**给定一个问题和一个已知含有答案的段落,在段落中找到答案跨度的开始和结束指标.
- **Open-domain QA。**没有给出.先检索相关的经文,然后提取或生成一个答案.
- **Generative / Closed-book QA。**一个大型语言模型从其参数内存中回答──没有检索──推理 最快,但事实可靠性最小──

2026年的趋势是混合:检索最好的几个段落,然后提示一个生成模型,让它基于这些段落作答.

## 概念

![QA architectures: extractive, retrieval-augmented, generative](../assets/qa.svg)

**Extractive。**用变压器 (BERT家族) 编码问题 和通道――训练两个头,分别预测答案的开始和结尾符号指数――输出是通道中一个跨度――按构造不会幻觉,也按构造无法处理通道 不能回答问题――

**Retrieval-augmented (RAG)。**两个阶段.首先,从体内找到顶部.`k`摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘要: 摘

**Generative。**一个仅用于解码器的LLM (GPT、Claude、Llama) 从学习的权重中回答──没有恢复步骤──对普通知识表现出色,对罕见或近期事实可能灾难性失败──幻觉率与预训数据中事实频率 负相关──


```figure
qa-span
```

## 构建它

### 步骤1:使用预训练模型做提取QA

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

`deepset/roberta-base-squad2`在SQuAD 2.0上训练中,其中包含无法回答的问题.`question-answering`管道即使在模型中获得零分数 胜时,也会返回最高分数的跨度,它*不会*自动返回空答案――要获得明显的"没有答案"行为,请在管道中传入`handle_impossible_answer=True`只有当零分数超过所有跨度分数时,管道才会返回空答案――无论如何,都必须始终检查`score`字段.

### 步骤2:一个提取增长管道

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

两阶段管道――密度检索器 (Sentence-BERT) 通过语义相似性找到相关段落――抽取阅读器 (Extractive reader) (RoBERTa-SquAD) 从合并后的顶部段落中抽取答案跨度――适用于小型 corpora──对百万文档级体,使用 FAISS 或向量数据库──

### 步骤3:使用RAG做生成

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

简单的提示方式 很重要.明确告诉模型 基于文本作答,并在文本中不足时回复"我不知道",相比天真的提示,可将幻觉率降低40-60%.

### 步骤4: 反映真实世界的评估

 使用**Exact Match (EM)**和 **token-level F1**△EM 是规范化后的严格匹配 (以下简体字母,条纹分类,删除文章),要么预测 完全匹配,要么得0 分──F1 基于预测和参考之间的代币重叠 计算,并给予部分分数──两者都会低估表达:"2007年6月29日"vs"2007年6月29日"通常会得到0 EM(ordinal 打破了规范化),但仍然因为观测代币重叠 获得可观的F1──

对于生产QA:

- **Answer accuracy**(LLM判断或人判断,因为指标无法捕捉到语义等效)
- **Citation accuracy。**引用的段落 是否真的支持答案?可以通过生成引用和检索的段落 之间的字符串匹配自动检查,难度很低.
- **Refusal calibration。**当答案 不在检索的段落 中时,系统是否正确说出"我不知道"?衡量虚假的信心率──
- **Retrieval recall。**在评估读者之前,先测试回收者是否正确的通过`k`阅读者无法修复缺失的经文.

### 劳动力资源:26年生产评估框架

`RAGAS`专为RAG系统设计,并且是2026年运输默认.

- **Faithfulness。**根据NLI的含义衡量.这是你的主要幻觉指标.
- **Answer relevance。**通过回答产生假设问题,并与真实的问题比较来衡量.
- **Context precision。**在检索的块中,实际相关比例是多少?低精度 =快速中噪音.
- **Context recall。**获取的集是否包含所有需要的信息? 低回忆 = 读者无法成功──

让你在没有精选的黄金答案的情况下评估现场生产流量.

`pip install ragas`△接入你的回收器+读者──每一个查询都得到四个尺度──对回归发出警报──

## 使用它

现在,我们要做什么?

| Use case | Recommended |
|---------|-------------|
| 给定 passage，找到 answer span | `deepset/roberta-base-squad2` |
| 在固定 corpus 上，closed-book 不可接受 | RAG: dense retriever + LLM reader |
| 对 document store 做 real-time QA | RAG with hybrid (BM25 + dense) retriever + reranker (lesson 14) |
| Conversational QA（follow-up questions） | LLM with conversation history + RAG on each turn |
| 高度事实性、regulated domains | 对 authoritative corpus 做 Extractive；绝不单独使用 generative |

提取QA在2026年已经不流行,因为带 LLM的RAG 能处理更多情况.

## 交付它

保存为`outputs/skill-qa-architect.md`其他:

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

1. **Easy。**在上面的10个维基百科段 上设置SQuAD提取管道――手工制作10个问题――衡量答案 正确的频率――如果段落和问题干净,你应该看到7-9个正确的――
2. **Medium。**添加一个拒绝分类器──当最高检索分数低于值(比如0.3 cosine) 当,返回"我不知道",而不是调用读者──在持久的设置上调整门──
3. **Hard。**在您选择的10,000份文件组中,建一个RAG管道.实现混合检索 (BM25+密集) 和RRF融合 (见14课).

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
- [Rajpurkar et al. (2016). SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250)基准论文──
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR,QA 的正规密集检索器──
- [Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) 命名RAG 的论文──
- [Gao et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey](https://arxiv.org/abs/2312.10997) 全面的RAG调查
