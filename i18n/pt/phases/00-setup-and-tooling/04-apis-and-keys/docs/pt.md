# APIs & Chaves

> Cada API de IA funciona da mesma forma: enviar um pedido, obter resposta.

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~30 分钟

## Objectivo de aprendizagem
- Utilizando variáveis ambientais`.env`arquivos segurança armazenamento API chaves
- Ao mesmo tempo usando o SDK Python Antropico e HTTP cru  lançar uma chamada LLM API
- Comparar formatos de solicitação/resposta baseados em SDK e HTTP crus, para depurar
- Identificação e tratamento de erros comuns de API, incluindo limites de autenticação e taxa

## 问题
A partir da Fase 11  começando, você vai convocar APIs LLM ((Antropic、OpenAI、Google)  Na Fase 13-16, você vai construir em loops usando esses agentes de APIs── você precisa saber como as chaves API  como trabalhar  como armazená-las de forma segura, bem como como como como iniciar sua primeira chamada API──

## 概念
```mermaid
sequenceDiagram
    participant C as Your Code
    participant S as API Server
    C->>S: HTTP Request (with API key)
    S->>C: HTTP Response (JSON)
```

Todas as chamadas da API têm:
1. Um endpoint (URL)
2. Uma chave API (authenticação)
3. Um corpo de solicitação (tú queres o quê)
4. Um corpo de resposta (((tu obtiver o que)


```figure
s0-secret-inject
```

## Construí-lo
### 步骤 1: chave de armazenamento de segurança API

Não deixe de colocar as chaves da API em código.

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

Ou usar `.env`Ficha (((把它加入 `.gitignore`):

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### 步骤 2: primeira API 调用 (Python)

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=256,
    messages=[{"role": "user", "content": "What is a neural network in one sentence?"}]
)

print(response.content[0].text)
```

### 步骤 3: primeira vez API 调用 (TypeScript)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 256,
  messages: [{ role: "user", content: "What is a neural network in one sentence?" }],
});

console.log(response.content[0].text);
```

### 步骤 4: HTTP bruto (sem SDK)

```python
import os
import urllib.request
import json

url = "https://api.anthropic.com/v1/messages"
headers = {
    "Content-Type": "application/json",
    "x-api-key": os.environ["ANTHROPIC_API_KEY"],
    "anthropic-version": "2023-06-01",
}
body = json.dumps({
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 256,
    "messages": [{"role": "user", "content": "What is a neural network in one sentence?"}],
}).encode()

req = urllib.request.Request(url, data=body, headers=headers, method="POST")
with urllib.request.urlopen(req) as resp:
    result = json.loads(resp.read())
    print(result["content"][0]["text"])
```

É o que os SDK fazem por trás. Entender chamadas HTTP crus ajuda a depurar.

## Use-o
对于本课程:

| API | When you need it | Free tier |
|-----|-----------------|-----------|
| Anthropic (Claude) | Phases 11-16（agents, tools） | 注册赠送 $5 credit |
| OpenAI | Phase 11（comparison） | 注册赠送 $5 credit |
| Hugging Face | Phases 4-10（models, datasets） | Free |

Você agora não precisa de todas as configurações.

## Entrega-o
Esta lição 会产出:
- `outputs/prompt-api-troubleshooter.md`- 诊断常见 API erros

## 练习
1. Obter uma chave de API Antropical, fazer a sua primeira chamada de API
2. 尝试 raw HTTP 版本,并将响应格式与SDK 版本进行比较
3. 故意使用错误的API key,并阅读错误消息

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| API key | "Password for the API" | 一个唯一字符串，用于标识你的 account 并授权 requests |
| Rate limit | "They're throttling me" | 每分钟/每小时最大 requests 数量，用于防止滥用并确保公平使用 |
| Token | "A word"（在 API 语境中） | 一个 billing unit：input 和 output Tokens 会被分别计数并收费 |
| Streaming | "Real-time responses" | 逐词获取 response，而不是等待完整 response |
