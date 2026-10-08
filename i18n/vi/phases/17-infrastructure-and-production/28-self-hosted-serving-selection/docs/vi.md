# Tham gia tự phục vụ 选择  llama.cpp, Ollama, TGI, vLLM, SGLang

> Năm 2026, bốn động cơ tự quản lý suy luận.**llama.cpp**Trong CPU 上最快  mô hình 支持最广, đối với định lượng và threading 拥有完全控制──**Ollama**là một phần lệnh cài đặt trên development notebook, so với llama.cpp 慢约15-30% ((Go + CGo + HTTP serialization), trong lớp sản xuất tải 差 3x**TGI 于 2025 年 12 月 11 日进入维护模式** Chỉ sửa lỗi, dung lượng thô so với vLLM  chậm khoảng 10%, nhưng trong quá khứ về khả năng quan sát và HF hệ thống sinh thái tích hợp thường là cấp độ cao nhất.**vLLM** v0.15.1(2026 年 2 月) 新增 PyTorch 2.10、RTX Blackwell SM120、H200 tối ưu hóa。**SGLang**Đây là một hệ thống máy tính có tính năng cao hơn 400.000 GPU trong sản xuất. Có hơn 400.000 GPU trong sản xuất.

**Type:** Learn
**Languages:** Python (stdlib, engine-decision tree walker)
**Prerequisites:** 覆盖 engines 的所有 Phase 17 课程（04、06、07、09、18）
**Time:** ~45 分钟

## Học mục tiêu
- Trong một số phần cứng định sẵn, bạn có thể chọn một động cơ.
- Nói ra tình trạng TGI 维护模式状态 (tương tự như năm 2026) và tại sao nó sẽ khiến các dự án mới chuyển hướng sang vLLM hoặc SGLang.
- 描述全程使用相同 GGUF hoặc HF trọng lượng của dev/staging/prod ống ống.
- 解释 tại sao chỉ CPU sẽ buộc phải sử dụng llama.cpp, còn AMD sẽ loại bỏ TRT-LLM。

## 问题
Nhóm của bạn đã khởi động một dự án LLM tự quản mới. Một kỹ sư nói Ollama, một khác nói VLLM, một thứ ba nói TGI không phải là một hộp mở ngay lập tức?

Trong năm 2026, chọn cây rất quan trọng: trước xem phần cứng, sau xem quy mô, sau xem khối lượng công việc.

## 概念
### 5 động cơ

| Engine | Best for | Notes |
|--------|----------|-------|
| **llama.cpp** | CPU / edge / minimal deps / 最广 model 支持 | CPU 上最快，完全控制 |
| **Ollama** | Dev laptops、单用户、一条命令安装 | 比 llama.cpp 慢 15-30%；生产 throughput 差距 3x |
| **TGI** | HF ecosystem、regulated industries | **2025 年 12 月 11 日维护模式** |
| **vLLM** | 通用生产、100+ 用户 | 广泛的生产默认选择；v0.15.1 2026 年 2 月 |
| **SGLang** | Agentic 多轮、prefix-heavy workloads | 生产中有 400,000+ GPUs |

### 硬件 quyết định ưu tiên

**仅 CPU**→ llama.cpp。Ollama cũng có thể sử dụng, nhưng chậm hơn。 không có động cơ khác trên CPU có sức cạnh tranh。

**AMD GPU**→ vLLM(AMD ROCm 支持)。SGLang cũng có thể sử dụng。TRT-LLM 被 NVIDIA 锁定,所以排除──

**NVIDIA Hopper (H100 / H200)**→ vLLM hoặc SGLang hoặc TRT-LLM──三者都是顶级──

**NVIDIA Blackwell (B200 / GB200)**→ TRT-LLM là sản lượng 领先者(Phase 17 · 07)。vLLM 和 SGLang 紧随其后。

**Apple Silicon (M-series)**→ llama.cpp(Metal) ・Ollama đã đóng gói nó

### 规模其次决策

**1 个用户 / local dev**→ Ollama。一条命令,数秒内 đầu tiên-token。

**10-100 个用户 / 小团队**→ VLLM single-GPU。

**100-10k 个用户 / production**→ vLLM sản xuất-phân 17 · 18) hoặc SGLang。

**10k+ 个用户 / enterprise**→ vLLM sản xuất-chống + phân chia(Phase 17 · 17) + LMCache(Phase 17 · 18)。

### Nhiệm vụ làm việc

**General chat / Q&A**→ vLLM 在广泛默认场景中胜出──

**Agentic multi-turn（tools、planning、memory）**→ SGLang 的 RadixAttention(Phase 17 · 06)占优。

**带有大量 prefix reuse 的 RAG**→ SGLang。

**Code generation**→ vLLM có thể;SGLang trong cache 上略好。

**Long context (128K+)**→ vLLM + prefill cho các mảnh;SGLang + KV cấp ấp──

### TGI 维护陷

Hugging Face TGI 于 2025 年 12 月 11 日进入维护模式  之后只做bug fixes──过去:顶级可观测性、同类最佳HF 生态系统集成(模型卡、安全工具),roughput 略落后于vLLM──

Đối với các dự án mới năm 2026: cố định tránh TGI.

### Đường ống 模式

Dev(Ollama)→ giai đoạn(llama.cpp)→ prod(vLLM)。全程使用相同的GGUF或HF权重──工程师在笔记本上快速代;阶段镜像生产量化;prod 是服务目标──

### Ollama 注意事项

Ollama  rất thích hợp với dev. Nó không thích hợp với sản xuất chia sẻ:Go HTTP serialization 会 tăng doanh số, quản lý tiền tệ hơn vLLM 更简单,OpenTelemetry 支持滞后.

### tự quản lý vs quản lý là một quyết định khác

Giai đoạn 17 · 01(được quản lý siêu quy mô) 、· 02(tền tảng phân tích) 覆盖 managed。本课假设你已经决定自托管──自托管的理由:data residency、custom fine-tune、规模化后的总成本所有、托管服务上不可用域名模型──

### Bạn nên nhớ số

- TGI 维护模式:2025 年 12 月 11 日。
- vLLM v0.15.1:2026 年 2 月;PyTorch 2.10;Blackwell SM120 支持──
- SGLang 生产足迹: 400.000+ GPUs
- Tỷ lệ sản lượng của Ollama tương đối với llama.cpp: chậm 15-30%; tải trọng sản xuất dưới 3x。


```figure
data-parallel
```

## Sử dụng nó
`code/main.py`là một người đi bộ cây quyết định: given determined hardware + scale + workload, chọn một engine并解释原因──

## 交付 nó
本课产 出 `outputs/skill-engine-picker.md`❖ Đưa ra một quy tắc, chọn một động cơ và lập kế hoạch di chuyển.

## 练习
1. Sử dụng phần cứng / quy mô / tải trọng làm việc của bạn 运行 `code/main.py`◊ Xuất khẩu có phù hợp với trực giác của bạn không?
2. Tầm của bạn là 12 张 H100 và 8 张 MI300X AMD.
3. Một nhóm đang nghĩ đến việc sử dụng TGI vào năm 2026, bởi vì đây là điều chúng ta quen thuộc.
4. Ollama dev đến vLLM prod: định lượng, cấu hình và khả năng quan sát 会发生什么变化?
5. Dường độ tiền đề P99 của RAG sản phẩm là 8K, và tỷ lệ sử dụng lại rất cao.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| llama.cpp | “CPU 那个” | 最广 model 支持，CPU 上最快 |
| Ollama | “笔记本那个” | 一条命令安装，dev-grade throughput |
| TGI | “HF 的 serving” | 自 2025 年 12 月起维护模式 |
| vLLM | “默认选择” | 2026 年广泛生产 baseline |
| SGLang | “agentic 那个” | Prefix-heavy，RadixAttention |
| TRT-LLM | “NVIDIA 锁定” | Blackwell throughput 领先者，仅 NVIDIA |
| GGUF | “llama.cpp 格式” | Bundled K-quant variants |
| Production-stack | “vLLM K8s” | Phase 17 · 18 reference deployment |
| Pipeline pattern | “dev→stage→prod” | 同一 weights 上的 Ollama → llama.cpp → vLLM |

## 延伸阅读
- [AI Made Tools — vLLM vs Ollama vs llama.cpp vs TGI 2026](https://www.aimadetools.com/blog/vllm-vs-ollama-vs-llamacpp-vs-tgi/)
- [Morph — llama.cpp vs Ollama 2026](https://www.morphllm.com/comparisons/llama-cpp-vs-ollama)
- [n1n.ai — Comprehensive LLM Inference Engine Comparison](https://explore.n1n.ai/blog/llm-inference-engine-comparison-vllm-tgi-tensorrt-sglang-2026-03-13)
- [PremAI — 10 Best vLLM Alternatives 2026](https://blog.premai.io/10-best-vllm-alternatives-for-llm-inference-in-production-2026/)
- [TGI maintenance announcement](https://github.com/huggingface/text-generation-inference) ghi chú phát hành.
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
