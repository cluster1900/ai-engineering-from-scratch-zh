# Les tests de charge des API de LLM  Pourquoi k6 和 Locust 会说谎

> Les testeurs de charge traditionnels ne sont pas conçus pour les réponses en streaming ∞ longueur de sortie variable ∞ métriques de niveau de jetons ou GPU  et ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ `--mean-input-tokens`+ `--stddev-input-tokens`修复这一点──2026 年工具映射:LLM 专用工具(GenAI-Perf、LLMPerf、LLM-Locust、guidellm) est utilisé pour la précision des jetons;**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）** streaming-conscient、Kubernetes-native, via TestRun/PrivateLoadZone CRDs faire distribué 测试, le plus adapté aux portes CI/CD;Vegeta utilise pour la saturation à taux constant Go;Locust 2.43.3 只有配合LLM-Locust extension 才适用于 streaming──负载模式:steady-state、ramp、spike(autoscaling test)、soak(memory leaks)──

**Type:** Build
**Languages:** Python (stdlib, toy realistic-prompt generator + latency collector)
**前置要求：**La phase 17 · 08 (métrologie d'inférence), la phase 17 · 03 (auto-estimation des GPU)
**Time:** ~75 minutes

## Objectif de l'apprentissage
- 解释让通用负载测试器在LLM API 上说谎的两个反模式(GIL 陷、即刻-uniformity 陷)
- 针对给定目的选择工具:LLMPerf(marque de référence run) 、k6 + extension de streaming(portée CI) 、guidellm(synthétique à grande échelle) 、GenAI-Perf(référence NVIDIA) 。
- 设计四种负载模式 ((stable、ramp、spike、soak),并说出每种模式捕捉的失败模式──
- Utiliser des jetons d'entrée de moyenne + stddev 构建真实的 prompt distribution, plutôt que de longueur fixe。

##  problématique
Vous avez testé le point final de l'LLM avec K6 , vous avez mis en place 500 utilisateurs concurrents. Il est resté en place.

发生了两件事――第一,k6 发送了500 相同的提示 您的请求-coalescing和前缓存 让它看起来像处理500 个同步解码,但实际上只是处理一个──第二,k6 不会以人眼体验的方式跟踪流媒体响应的间接代码延迟; elle voit une connexion HTTP, et non 500 个不同的间隔到达代码──

Les tests de charge des LLM sont une question de formation indépendante.

## 概念
### GIL 陷(Locust)

Locust utilise Python et utilise des tokenisations du côté client 于 GIL 下运行 Tokenization。高并发时,Tokenizer 会排在请求生成 后面。报告的间代码延迟 包含客户端代码后载──你以为服务器 慢;其实是测试慢──

修复:LLM-Locust extension va la jetonisation 移到独立进程, ou utiliser le harness du langage compilé ((k6、使用tokenizers.rs的LLMPerf) 

### rapidité de l'uniformité

Tous les testeurs de charge connus vous permettent de configurer un prompt. Dans les tests de cycle de 10 000 fois, chaque fois, chaque ville envoie le même prompt. Le serveur voit chaque fois le même préfixe.

修复: de la distribution rapide 中采样。LLMPerf 使用 `--mean-input-tokens 500 --stddev-input-tokens 150` 长度多样, contenu多样.

### 4 modes de charge

1. **Steady-state** 以 RPS constant 运行 30-60 分钟──捕捉:baseline performance regressions──
2. **Ramp** En 15 minutes, le RPS sera augmenté de 0 à la valeur cible.
3. **Spike** Soudainement augmenté à 3-10 fois RPS, duré 2 minutes après récupération― Capture: autoscalage de la latence―saturation de la queue―impact de démarrage à froid―
4. **Soak** état stable 运行 4-8 小时――捕捉:leakage de mémoire

### 2026 工具映射

**LLMPerf**(Anyscale)  Python, mais la tokenization est soutenue par Rust 支持──Mean/stddev prompts──Streaming-aware──性能运行的最佳默认选择──

**NVIDIA GenAI-Perf** Reference de NVIDIA── utiliser le client Triton; métrique 覆盖全面── note son ITL n'inclut pas TTFT;LLMPerf 包含── le même serveur 上两个工具会产生不同的 TPOT──

**LLM-Locust**(TrueFoundry) 修复 GIL 陷的 Locust extension──熟悉的 Locust DSL + métriques de diffusion──

**guidellm** référence de synthèse à grande échelle

**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）**- Le numéro de la liste:
- Il y a aussi des statistiques de streaming.
- k6 Opérateur utiliser les CRD TestRun / PrivateLoadZone  effectuer des tests distribués natifs Kubernetes―
- Les tests de CI/CD et de SLA sont les plus adaptés.

**Vegeta** Go,比 k6 更简单──Constant-rate HTTP saturation──不具备LLM-aware 能力,但适合网关/rate-limit testing──

**Locust 2.43.3 stock** Pour le LLM il y a un piège de GIL 🏼

### Porte SLA du centre CI

Dans le cadre de la communication, il est possible de modifier le code de la communication.

- Dans la RPS de base, les itérations sont de 30 à 50 fois.
- Portée: P50/P95 TTFT、5xx < 5%、TPOT 低于值。
- 违规时让建设 失败──

### Réalité rapide

De la vraie circulation de l'échantillon de construction (s'il y a), ou de la distribution publique (s'il y a une distribution publique) de la construction (par exemple, pour le chat, les requêtes ShareGPT, pour le code, HumanEval) de la construction (s'il y a une autre version de la distribution) de la structure (s'il y a une autre version de la structure) de la structure (s'il y a une autre version de la structure) de la structure (par exemple, pour le chat, les requêtes ShareGPT, pour le code, HumanEval) de la structure (s'il y a une autre version de la structure) de la structure (s'il y a une autre version de la structure) de la structure (s'il y a une autre version de la structure) de la structure (s'il y a une autre version de la structure) de la structure (s'il y a une autre version de la structure) de la structure (s'il y a une autre version de la structure) de la structure (s'il y a une autre version de la structure) de la structure (s'il y a un autre version de la structure (s'il y a un autre version) de la structure (s) de la structure (s) de la structure).

### Tu devrais te rappeler le nombre

- k6 Opérateur 1.0 GA:2025 年 9 月。
- k6 v2026.1.0: métriques de diffusion de contenu en continu
- 典型LLMPerf run: dans la concurrence X 下 100-1000 demandes
- 典型 CI gate: pour chaque PR 30 à 50 itérations
- 4 modes: stables, rampes, piqûres, plongées


```figure
load-pattern-waves
```

## Utilisez-le
`code/main.py`模拟带有真实快速分布的负载测试, mesure du TPOT efficace,并演示 陷──

## Je le livre.
本课生成 `outputs/skill-load-test-plan.md` Donner une charge de travail et un SLA 后, sélectionner des outils et concevoir quatre modes de charge 

## 练习
1. 运行  référencement`code/main.py` Comparer une distribution uniforme et réaliste  差距在哪里?
2. Pour la porte CI 编写 k6 script:在100 concurrentielle 下 TTFT P95 < 800 ms,heure de fonctionnement 5 分钟。
3. Le test de trempage de votre mémoire montre une augmentation de 50 Mo par heure.
4. Test de pointe de 10 RPS à 100 RPS. Si la pile de production de Karpenter + vLLM est déjà en place, quelle est la durée de récupération prévue ?
5. GenAI-Perf dans le même serveur 上 rapporter TPOT=6ms;LLMPerf  rapporter TPOT=11ms;; expliquer pourquoi;;

## 关键术语
| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| LLMPerf | "LLM harness" | Anyscale benchmark tool，streaming-aware |
| GenAI-Perf | "NVIDIA tool" | NVIDIA reference harness |
| LLM-Locust | "Locust for LLMs" | 修复 GIL 陷阱的 Locust extension |
| guidellm | "synthetic benchmark" | Large-scale synthetic tool |
| k6 Operator | "K8s k6" | 基于 CRD 的 distributed k6 |
| GIL trap | "Python client overhead" | Tokenization backlog 抬高报告的 latency |
| Prompt-uniformity trap | "single-prompt lie" | 使用相同 prompt 循环命中 cache，抬高 throughput |
| Steady-state | "constant load" | 持续 N 分钟的平坦 RPS |
| Ramp | "linear up" | 在 duration 内从 0 到目标值 |
| Spike | "burst test" | 突然倍增，然后恢复 |
| Soak | "long test" | 用数小时检测 leak |

## 延伸阅读
- [TianPan — Load Testing LLM Applications](https://tianpan.co/blog/2026-03-19-load-testing-llm-applications)
- [PremAI — Load Testing LLMs 2026](https://blog.premai.io/load-testing-llms-tools-metrics-realistic-traffic-simulation-2026/)
- [NVIDIA NIM — Introduction to LLM Inference Benchmarking](https://docs.nvidia.com/nim/large-language-models/1.0.0/benchmarking.html)
- [TrueFoundry — LLM-Locust](https://www.truefoundry.com/blog/llm-locust-a-tool-for-benchmarking-llm-performance)
- [LLMPerf](https://github.com/ray-project/llmperf)
- [k6 Operator](https://github.com/grafana/k6-operator)
