# Função chamada e uso de ferramentas

> Os LLM não podem fazer nada por si mesmos. Eles geram texto. É isso que são todas as capacidades. Eles não podem ver o clima. Eles não podem consultar a base de dados.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 Lesson 03 (Structured Outputs)
**Time:** ~75 minutes
**Related:**Fase 11 · 14 (Modelo Context Protocol)  Quando uma ferramenta 需要跨主共享时,应从在线函数调用 升级为MCP server。本课覆盖在线场景;MCP 覆盖协议 场景。

## Objectivo de aprendizagem
- 实现 a função chamada loop: define ferramentas esquemas 解析模型的工具-call JSON 执行函数,并返回结果
- design com descrições claras e esquemas de ferramentas de parâmetros tipados, para que o modelo possa ser configurado com segurança
- Construir um ciclo de agente multi-turn, através de várias ligações de função para responder a perguntas complexas
- 处理 function calling 边界情况:parallel tool calls、error propagation, bem como prevenir loopes de ferramentas ilimitadas

## 问题
Você construiu um chatbot. Pergunta do usuário: Qual é o tempo em Tóquio agora?

模型回答:Eu não tenho acesso a dados meteorológicos em tempo real, mas com base na estação, Tóquio provavelmente está em torno de 15 graus Celsius...

É uma alucinação de um modelo não sabe o tempo, nunca saberá, o tempo está mudando a cada hora, já há meses que o modelo está treinando.

O modelo não pode usar os APIs. Seu código pode ser usado. Um elemento que está faltando é: um protocolo estruturado, que o modelo possa dizer que eu preciso usar esses argumentos.

É o que é chamado de Função. Output JSON estruturado, descreve quais argumentos usar.

Não há Função chamada, LLMs são uma série de livros.

## 概念
### A função que chama o ciclo

Cada vez que a ferramenta é usada, a comunicação segue o mesmo ciclo de cinco passos.

```mermaid
sequenceDiagram
    participant U as User
    participant A as Application
    participant M as Model
    participant T as Tool

    U->>A: "What's the weather in Tokyo?"
    A->>M: messages + tool definitions
    M->>A: tool_call: get_weather(city="Tokyo")
    A->>T: Execute get_weather("Tokyo")
    T->>A: {"temp": 18, "condition": "cloudy"}
    A->>M: tool_result + conversation
    M->>A: "It's 18C and cloudy in Tokyo."
    A->>U: Final response
```

Passo 1: usuário envia mensagem;. Passo 2: modelo recebe mensagem e definições de ferramenta(descrição de funções JSON disponíveis) Shema) ・ Passo 3: modelo não retorna diretamente ao texto, mas em vez de emitir uma chamada de ferramenta, também é, contém nome de função 和 argumentos de estrutura JSON objeto。 Passo 4: seu código executar função 并捕获结果。 Passo 5: resultados retornar ao modelo, o modelo agora tem dados reais, pode gerar resposta final。

O modelo nunca executa nada. Ele só decide o que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é executado.

### Definições de ferramentas: Contrato de esquema JSON

Cada ferramenta é definida por um esquema JSON, que diz ao modelo que a função faz, recebe quais argumentos e quais tipos de argumentos devem ser.

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Get current weather for a city. Returns temperature in Celsius and conditions.",
    "parameters": {
      "type": "object",
      "properties": {
        "city": {
          "type": "string",
          "description": "City name, e.g. 'Tokyo' or 'San Francisco'"
        },
        "units": {
          "type": "string",
          "enum": ["celsius", "fahrenheit"],
          "description": "Temperature units"
        }
      },
      "required": ["city"]
    }
  }
}
```

`description`Os campos 至关重要──模型会读取它们,以决定何时以及如何使用工具──如get weather这样含糊的描述,比Get current weather for a city. Returns temperature in Celsius and conditions.产生更差的工具选择──描述是用于工具选择的提示──

### Comparação entre os fornecedores

Cada fornecedor principal suporta chamadas de função, mas a superfície da API tem diferenças.

| Provider | API Parameter | Tool Call Format | Parallel Calls | Forced Calling |
|----------|--------------|-----------------|---------------|----------------|
| OpenAI (GPT-5, o4) | `tools` | `tool_calls[].function` | Yes (multiple per turn) | `tool_choice="required"` |
| Anthropic (Claude 4.6/4.7) | `tools` | `content[].type="tool_use"` | Yes (multiple blocks) | `tool_choice={"type":"any"}` |
| Google (Gemini 3) | `function_declarations` | `functionCall` | Yes | `function_calling_config` |
| Open-weight (Llama 4, Qwen3, DeepSeek-V3) | Native `tools` on Llama 4; Hermes or ChatML on others | Mixed | Model-dependent | Prompt-based or `tool_choice` if supported |

Até 2026, três provedores fechados já receberam quase o mesmo formato baseado em JSON Schema.`tools`campo, forma e OpenAI 匹配──Open-weight fine-tunes 仍然各不相同,其中 Hermes format(NousResearch) é o formato mais comum de fitunas de terceiros──Para os anfitriões em geral, prioridade é usar MCP (Phase 11 · 14), em vez de chamar funções inline, pois o servidor para todos os anfitriões são iguais──

### Opção de ferramentas: automática, necessária, específica

Você pode controlar o modelo quando usar ferramentas.

**Auto**(默认):模型自行决定是调用工具 还是直接答案──What's 2+2?会直接答──What's the weather?会调用工具──

**Required**O modelo deve pelo menos usar uma ferramenta. Quando você sabe que o usuário quer uma ferramenta, use-a. Pode impedir que o modelo não consulte dados reais e adivinhe diretamente.

**Specific function**O modelo de força é o de uma função específica.`tool_choice={"type":"function", "function": {"name": "get_weather"}}`Garantizar a ferramenta meteorológica Será utilizada, seja qual for a consulta.

### Chamadas para funções paralelas

GPT-4o 和 Claude pode ser usado em uma única vez para várias funções.

```json
[
  {"name": "get_weather", "arguments": {"city": "Tokyo"}},
  {"name": "get_weather", "arguments": {"city": "New York"}}
]
```

Você executa dois códigos (em ideal caso, é executado), retorna dois resultados, e então o modelo compõe uma resposta única. Isso reduz as viagens de ida e volta de 2 vezes para 1 vez. Para cada consulta, é necessário 5 a 10 vezes para agentes de ferramentas para fazer chamadas paralelas.

### Relação entre as saídas estruturadas e as chamadas de função

Lição 03 covered estruturadas saídas── chamada de função Utilize the same set JSON Schema 机制, but purpose different──

**Structured outputs**O modelo forçado é gerar dados em forma específica.`{name, price, in_stock}`- Não.

**Function calling**Modelo declaração executar uma ação.`get_weather(city="Tokyo")`O modelo é pedir uma ação, em vez de gerar a resposta final.

Quando você precisa de extração de dados, use saídas estruturadas. Quando você precisa de modelos com sistemas externos, use chamadas de função.

### Segurança: regras inconciliáveis

Função chamada é a capacidade mais perigosa de você pode dar LLM. Modelo escolhe executar o que. Se o seu conjunto de ferramentas contém consultas de banco de dados, o modelo irá construir consultas.

**Rule 1: Never pass model-generated SQL directly to a database.**模型可能且确实会生成 DROP TABLE、UNION injeções, ou retornar a cada linha de consultas──始终参数化──始终验证──始终使用操作允许列──

**Rule 2: Allowlist functions.**模型只能调用你显式定义的函数―― nunca constrói um instrumento de execução de qualquer função, sempre que você tenha 50 funções internas, apenas expõe 5 das necessidades do usuário──

**Rule 3: Validate arguments.**模型可能传入一个城市名:`"; DROP TABLE users; --"` Execução de um argumento de acordo com os tipos de expectativa, rangos e formatos

**Rule 4: Sanitize tool results.**Se a ferramenta retornar dados sensíveis (API keys, PII, errors internos), o modelo irá colocar os resultados da ferramenta em sua resposta.

**Rule 5: Rate limit tool calls.**处于循环中的模型可能调调用工具 数百次――设置一个最大值(每一次对话 10-20次电话是合理的) ――打断无限循环──

### Manutenção de erros

Ferramentas 会失败──API 会超时──Databases 会机──Fichos não existem──Modelo precisa saber ferramenta 何时失败以及为何失败──

Returnar erros como resultados de ferramentas de estruturação, em vez de rejeitar exceções:

```json
{
  "error": true,
  "message": "City 'Toky' not found. Did you mean 'Tokyo'?",
  "code": "CITY_NOT_FOUND"
}
```

模型读取这个结果,调整论点,并重试――Modelos 很擅长从结构化错误信息中自我纠正――它们不擅长从空反应或泛泛的有错误中恢复――

### MCP: Modelo de protocolo de contexto

MCP é um padrão aberto de interoperabilidade de ferramentas antropópica. Não permite que cada aplicação defina suas próprias ferramentas, mas fornece um protocolo universal: ferramentas fornecidas pelos servidores MCP, e clientes MCP ((como Claude Code、Cursor ou sua aplicação)

Um servidor MCP pode ser usado para qualquer cliente que seja capaz de exposição de ferramentas.

MCP é chamada de função, assim como HTTP é chamada de rede.


```figure
mx-tool-call-loop
```

## Construí-lo
### 步骤 1: Definir o Registro de Ferramentas

Construir um registro, para definições de ferramentas de armazenamento  e suas implementações.

```python
import json
import math
import time
import hashlib


TOOL_REGISTRY = {}


def register_tool(name, description, parameters, function):
    TOOL_REGISTRY[name] = {
        "definition": {
            "type": "function",
            "function": {
                "name": name,
                "description": description,
                "parameters": parameters,
            },
        },
        "function": function,
    }
```

### 步骤 2: Implementar 5 Ferramentas

Construir uma calculadora, pesquisa do tempo, simulador de pesquisa na web, leitor de arquivos e executor de código.

```python
def calculator(expression, precision=2):
    allowed = set("0123456789+-*/.() ")
    if not all(c in allowed for c in expression):
        return {"error": True, "message": f"Invalid characters in expression: {expression}"}
    try:
        result = eval(expression, {"__builtins__": {}}, {"math": math})
        return {"result": round(float(result), precision), "expression": expression}
    except Exception as e:
        return {"error": True, "message": str(e)}


WEATHER_DB = {
    "tokyo": {"temp_c": 18, "condition": "cloudy", "humidity": 72, "wind_kph": 14},
    "new york": {"temp_c": 22, "condition": "sunny", "humidity": 45, "wind_kph": 8},
    "london": {"temp_c": 12, "condition": "rainy", "humidity": 88, "wind_kph": 22},
    "san francisco": {"temp_c": 16, "condition": "foggy", "humidity": 80, "wind_kph": 18},
    "sydney": {"temp_c": 25, "condition": "sunny", "humidity": 55, "wind_kph": 10},
}


def get_weather(city, units="celsius"):
    key = city.lower().strip()
    if key not in WEATHER_DB:
        suggestions = [c for c in WEATHER_DB if c.startswith(key[:3])]
        return {
            "error": True,
            "message": f"City '{city}' not found.",
            "suggestions": suggestions,
            "code": "CITY_NOT_FOUND",
        }
    data = WEATHER_DB[key].copy()
    if units == "fahrenheit":
        data["temp_f"] = round(data["temp_c"] * 9 / 5 + 32, 1)
        del data["temp_c"]
    data["city"] = city
    return data


SEARCH_DB = {
    "python function calling": [
        {"title": "OpenAI Function Calling Guide", "url": "https://platform.openai.com/docs/guides/function-calling", "snippet": "Learn how to connect LLMs to external tools."},
        {"title": "Anthropic Tool Use", "url": "https://docs.anthropic.com/en/docs/tool-use", "snippet": "Claude can interact with external tools and APIs."},
    ],
    "MCP protocol": [
        {"title": "Model Context Protocol", "url": "https://modelcontextprotocol.io", "snippet": "An open standard for connecting AI models to data sources."},
    ],
    "weather API": [
        {"title": "OpenWeatherMap API", "url": "https://openweathermap.org/api", "snippet": "Free weather API with current, forecast, and historical data."},
    ],
}


def web_search(query, max_results=3):
    key = query.lower().strip()
    for db_key, results in SEARCH_DB.items():
        if db_key in key or key in db_key:
            return {"query": query, "results": results[:max_results], "total": len(results)}
    return {"query": query, "results": [], "total": 0}


FILE_SYSTEM = {
    "data/config.json": '{"model": "gpt-4o", "temperature": 0.7, "max_tokens": 4096}',
    "data/users.csv": "name,email,role\nAlice,alice@example.com,admin\nBob,bob@example.com,user",
    "README.md": "# My Project\nA tool-use agent built from scratch.",
}


def read_file(path):
    if ".." in path or path.startswith("/"):
        return {"error": True, "message": "Path traversal not allowed.", "code": "FORBIDDEN"}
    if path not in FILE_SYSTEM:
        available = list(FILE_SYSTEM.keys())
        return {"error": True, "message": f"File '{path}' not found.", "available_files": available, "code": "NOT_FOUND"}
    content = FILE_SYSTEM[path]
    return {"path": path, "content": content, "size_bytes": len(content), "lines": content.count("\n") + 1}


def run_code(code, language="python"):
    if language != "python":
        return {"error": True, "message": f"Language '{language}' not supported. Only 'python' is available."}
    forbidden = ["import os", "import sys", "import subprocess", "exec(", "eval(", "__import__", "open("]
    for pattern in forbidden:
        if pattern in code:
            return {"error": True, "message": f"Forbidden operation: {pattern}", "code": "SECURITY_VIOLATION"}
    try:
        local_vars = {}
        exec(code, {"__builtins__": {"print": print, "range": range, "len": len, "str": str, "int": int, "float": float, "list": list, "dict": dict, "sum": sum, "min": min, "max": max, "abs": abs, "round": round, "sorted": sorted, "enumerate": enumerate, "zip": zip, "map": map, "filter": filter, "math": math}}, local_vars)
        result = local_vars.get("result", None)
        return {"success": True, "result": result, "variables": {k: str(v) for k, v in local_vars.items() if not k.startswith("_")}}
    except Exception as e:
        return {"error": True, "message": f"{type(e).__name__}: {e}"}
```

### 步骤 3: Registre todas as ferramentas

```python
def register_all_tools():
    register_tool(
        "calculator", "Evaluate a mathematical expression. Supports +, -, *, /, parentheses, and decimals. Returns the numeric result.",
        {"type": "object", "properties": {"expression": {"type": "string", "description": "Math expression, e.g. '(10 + 5) * 3'"}, "precision": {"type": "integer", "description": "Decimal places in result", "default": 2}}, "required": ["expression"]},
        calculator,
    )
    register_tool(
        "get_weather", "Get current weather for a city. Returns temperature, condition, humidity, and wind speed.",
        {"type": "object", "properties": {"city": {"type": "string", "description": "City name, e.g. 'Tokyo' or 'San Francisco'"}, "units": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "Temperature units, defaults to celsius"}}, "required": ["city"]},
        get_weather,
    )
    register_tool(
        "web_search", "Search the web for information. Returns a list of results with title, URL, and snippet.",
        {"type": "object", "properties": {"query": {"type": "string", "description": "Search query"}, "max_results": {"type": "integer", "description": "Maximum results to return", "default": 3}}, "required": ["query"]},
        web_search,
    )
    register_tool(
        "read_file", "Read the contents of a file. Returns the file content, size, and line count.",
        {"type": "object", "properties": {"path": {"type": "string", "description": "Relative file path, e.g. 'data/config.json'"}}, "required": ["path"]},
        read_file,
    )
    register_tool(
        "run_code", "Execute Python code in a sandboxed environment. Set a 'result' variable to return output.",
        {"type": "object", "properties": {"code": {"type": "string", "description": "Python code to execute"}, "language": {"type": "string", "enum": ["python"], "description": "Programming language"}}, "required": ["code"]},
        run_code,
    )
```

### 步骤 4: Construir a função chamada Loop

É o motor central. Ele é o modelo que decide qual ferramenta usar, executar essa ferramenta, e o resultado vai voltar.

```python
def simulate_model_decision(user_message, tools, conversation_history):
    msg = user_message.lower()

    if any(word in msg for word in ["weather", "temperature", "forecast"]):
        cities = []
        for city in WEATHER_DB:
            if city in msg:
                cities.append(city)
        if not cities:
            for word in msg.split():
                if word.capitalize() in [c.title() for c in WEATHER_DB]:
                    cities.append(word)
        if not cities:
            cities = ["tokyo"]
        calls = []
        for city in cities:
            calls.append({"name": "get_weather", "arguments": {"city": city.title()}})
        return calls

    if any(word in msg for word in ["calculate", "compute", "math", "what is", "how much"]):
        for token in msg.split():
            if any(c in token for c in "+-*/"):
                return [{"name": "calculator", "arguments": {"expression": token}}]
        if "+" in msg or "-" in msg or "*" in msg or "/" in msg:
            expr = "".join(c for c in msg if c in "0123456789+-*/.() ")
            if expr.strip():
                return [{"name": "calculator", "arguments": {"expression": expr.strip()}}]
        return [{"name": "calculator", "arguments": {"expression": "0"}}]

    if any(word in msg for word in ["search", "find", "look up", "google"]):
        query = msg.replace("search for", "").replace("look up", "").replace("find", "").strip()
        return [{"name": "web_search", "arguments": {"query": query}}]

    if any(word in msg for word in ["read", "file", "open", "cat", "show"]):
        for path in FILE_SYSTEM:
            if path.split("/")[-1].split(".")[0] in msg:
                return [{"name": "read_file", "arguments": {"path": path}}]
        return [{"name": "read_file", "arguments": {"path": "README.md"}}]

    if any(word in msg for word in ["run", "execute", "code", "python"]):
        return [{"name": "run_code", "arguments": {"code": "result = 'Hello from the sandbox!'", "language": "python"}}]

    return []


def execute_tool_call(tool_call):
    name = tool_call["name"]
    args = tool_call["arguments"]

    if name not in TOOL_REGISTRY:
        return {"error": True, "message": f"Unknown tool: {name}", "code": "UNKNOWN_TOOL"}

    tool = TOOL_REGISTRY[name]
    func = tool["function"]
    start = time.time()

    try:
        result = func(**args)
    except TypeError as e:
        result = {"error": True, "message": f"Invalid arguments: {e}"}

    elapsed_ms = round((time.time() - start) * 1000, 2)
    return {"tool": name, "result": result, "execution_time_ms": elapsed_ms}


def run_function_calling_loop(user_message, max_iterations=5):
    conversation = [{"role": "user", "content": user_message}]
    tool_definitions = [t["definition"] for t in TOOL_REGISTRY.values()]
    all_tool_results = []

    for iteration in range(max_iterations):
        tool_calls = simulate_model_decision(user_message, tool_definitions, conversation)

        if not tool_calls:
            break

        results = []
        for call in tool_calls:
            result = execute_tool_call(call)
            results.append(result)

        conversation.append({"role": "assistant", "content": None, "tool_calls": tool_calls})

        for result in results:
            conversation.append({"role": "tool", "content": json.dumps(result["result"]), "tool_name": result["tool"]})

        all_tool_results.extend(results)
        break

    return {"conversation": conversation, "tool_results": all_tool_results, "iterations": iteration + 1 if tool_calls else 0}
```

### 步骤 5: Validação do argumento

Construir um validador, em execução anterior baseado em JSON Schema Check tool call arguments。

```python
def validate_tool_arguments(tool_name, arguments):
    if tool_name not in TOOL_REGISTRY:
        return [f"Unknown tool: {tool_name}"]

    schema = TOOL_REGISTRY[tool_name]["definition"]["function"]["parameters"]
    errors = []

    if not isinstance(arguments, dict):
        return [f"Arguments must be an object, got {type(arguments).__name__}"]

    for required_field in schema.get("required", []):
        if required_field not in arguments:
            errors.append(f"Missing required argument: {required_field}")

    properties = schema.get("properties", {})
    for arg_name, arg_value in arguments.items():
        if arg_name not in properties:
            errors.append(f"Unknown argument: {arg_name}")
            continue

        prop_schema = properties[arg_name]
        expected_type = prop_schema.get("type")

        type_checks = {"string": str, "integer": int, "number": (int, float), "boolean": bool, "array": list, "object": dict}
        if expected_type in type_checks:
            if not isinstance(arg_value, type_checks[expected_type]):
                errors.append(f"Argument '{arg_name}': expected {expected_type}, got {type(arg_value).__name__}")

        if "enum" in prop_schema and arg_value not in prop_schema["enum"]:
            errors.append(f"Argument '{arg_name}': '{arg_value}' not in {prop_schema['enum']}")

    return errors
```

### 步骤 6: Execute a demonstração

```python
def run_demo():
    register_all_tools()

    print("=" * 60)
    print("  Function Calling & Tool Use Demo")
    print("=" * 60)

    print("\n--- Registered Tools ---")
    for name, tool in TOOL_REGISTRY.items():
        desc = tool["definition"]["function"]["description"][:60]
        params = list(tool["definition"]["function"]["parameters"].get("properties", {}).keys())
        print(f"  {name}: {desc}...")
        print(f"    params: {params}")

    print(f"\n--- Argument Validation ---")
    validation_tests = [
        ("get_weather", {"city": "Tokyo"}, "Valid call"),
        ("get_weather", {}, "Missing required arg"),
        ("get_weather", {"city": "Tokyo", "units": "kelvin"}, "Invalid enum value"),
        ("calculator", {"expression": 123}, "Wrong type (int for string)"),
        ("unknown_tool", {"x": 1}, "Unknown tool"),
    ]
    for tool_name, args, label in validation_tests:
        errors = validate_tool_arguments(tool_name, args)
        status = "VALID" if not errors else f"ERRORS: {errors}"
        print(f"  {label}: {status}")

    print(f"\n--- Tool Execution ---")
    direct_tests = [
        {"name": "calculator", "arguments": {"expression": "(10 + 5) * 3 / 2"}},
        {"name": "get_weather", "arguments": {"city": "Tokyo"}},
        {"name": "get_weather", "arguments": {"city": "Mars"}},
        {"name": "web_search", "arguments": {"query": "python function calling"}},
        {"name": "read_file", "arguments": {"path": "data/config.json"}},
        {"name": "read_file", "arguments": {"path": "../etc/passwd"}},
        {"name": "run_code", "arguments": {"code": "result = sum(range(1, 101))"}},
        {"name": "run_code", "arguments": {"code": "import os; os.system('rm -rf /')"}},
    ]
    for call in direct_tests:
        result = execute_tool_call(call)
        print(f"\n  {call['name']}({json.dumps(call['arguments'])})")
        print(f"    -> {json.dumps(result['result'], indent=None)[:100]}")
        print(f"    time: {result['execution_time_ms']}ms")

    print(f"\n--- Full Function Calling Loop ---")
    test_queries = [
        "What's the weather in Tokyo?",
        "Calculate (100 + 250) * 0.15",
        "Search for MCP protocol",
        "Read the config file",
        "Run some Python code",
        "Tell me a joke",
    ]
    for query in test_queries:
        print(f"\n  User: {query}")
        result = run_function_calling_loop(query)
        if result["tool_results"]:
            for tr in result["tool_results"]:
                print(f"    Tool: {tr['tool']} ({tr['execution_time_ms']}ms)")
                print(f"    Result: {json.dumps(tr['result'], indent=None)[:90]}")
        else:
            print(f"    [No tool called -- direct response]")
        print(f"    Iterations: {result['iterations']}")

    print(f"\n--- Parallel Tool Calls ---")
    multi_city_query = "What's the weather in tokyo and london?"
    print(f"  User: {multi_city_query}")
    result = run_function_calling_loop(multi_city_query)
    print(f"  Tool calls made: {len(result['tool_results'])}")
    for tr in result["tool_results"]:
        city = tr["result"].get("city", "unknown")
        temp = tr["result"].get("temp_c", "N/A")
        print(f"    {city}: {temp}C, {tr['result'].get('condition', 'N/A')}")

    print(f"\n--- Security Checks ---")
    security_tests = [
        ("read_file", {"path": "../../etc/passwd"}),
        ("run_code", {"code": "import subprocess; subprocess.run(['ls'])"}),
        ("calculator", {"expression": "__import__('os').system('ls')"}),
    ]
    for tool_name, args in security_tests:
        result = execute_tool_call({"name": tool_name, "arguments": args})
        blocked = result["result"].get("error", False)
        print(f"  {tool_name}({list(args.values())[0][:40]}): {'BLOCKED' if blocked else 'ALLOWED'}")
```

## Use-o
### Chamadas de função OpenAI

```python
# from openai import OpenAI
#
# client = OpenAI()
#
# tools = [{
#     "type": "function",
#     "function": {
#         "name": "get_weather",
#         "description": "Get current weather for a city",
#         "parameters": {
#             "type": "object",
#             "properties": {
#                 "city": {"type": "string"},
#                 "units": {"type": "string", "enum": ["celsius", "fahrenheit"]}
#             },
#             "required": ["city"]
#         }
#     }
# }]
#
# response = client.chat.completions.create(
#     model="gpt-4o",
#     messages=[{"role": "user", "content": "Weather in Tokyo?"}],
#     tools=tools,
#     tool_choice="auto",
# )
#
# tool_call = response.choices[0].message.tool_calls[0]
# args = json.loads(tool_call.function.arguments)
# result = get_weather(**args)
#
# final = client.chat.completions.create(
#     model="gpt-4o",
#     messages=[
#         {"role": "user", "content": "Weather in Tokyo?"},
#         response.choices[0].message,
#         {"role": "tool", "tool_call_id": tool_call.id, "content": json.dumps(result)},
#     ],
# )
# print(final.choices[0].message.content)
```

OpenAI vai fazer chamadas de ferramenta  retornar para `response.choices[0].message.tool_calls`Toda chamada tem um.`id`, você deve contê-lo quando retornar o resultado. O modelo que usa este ID irá fazer os resultados se combinarem com as chamadas.

### Utilização de Ferramentas Antropicas

```python
# import anthropic
#
# client = anthropic.Anthropic()
#
# response = client.messages.create(
#     model="claude-sonnet-4-20250514",
#     max_tokens=1024,
#     tools=[{
#         "name": "get_weather",
#         "description": "Get current weather for a city",
#         "input_schema": {
#             "type": "object",
#             "properties": {
#                 "city": {"type": "string"},
#                 "units": {"type": "string", "enum": ["celsius", "fahrenheit"]}
#             },
#             "required": ["city"]
#         }
#     }],
#     messages=[{"role": "user", "content": "Weather in Tokyo?"}],
# )
#
# tool_block = next(b for b in response.content if b.type == "tool_use")
# result = get_weather(**tool_block.input)
#
# final = client.messages.create(
#     model="claude-sonnet-4-20250514",
#     max_tokens=1024,
#     tools=[...],
#     messages=[
#         {"role": "user", "content": "Weather in Tokyo?"},
#         {"role": "assistant", "content": response.content},
#         {"role": "user", "content": [{"type": "tool_result", "tool_use_id": tool_block.id, "content": json.dumps(result)}]},
#     ],
# )
```

Antropic vai fazer chamadas de ferramenta  retornar para estar `type: "tool_use"`de blocos de conteúdo. resultado de ferramenta  colocado `type: "tool_result"`Nota: O uso de dados em dados de dados é um dos principais aspectos da sua utilização.`input_schema`definição de parâmetros de ferramenta, enquanto OpenAI utiliza `parameters`- Não.

### Integração dos MCP

```python
# MCP servers expose tools over a standardized protocol.
# Any MCP-compatible client can discover and call these tools.
#
# Example: connecting to a Postgres MCP server
#
# from mcp import ClientSession, StdioServerParameters
# from mcp.client.stdio import stdio_client
#
# server_params = StdioServerParameters(
#     command="npx",
#     args=["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
# )
#
# async with stdio_client(server_params) as (read, write):
#     async with ClientSession(read, write) as session:
#         await session.initialize()
#         tools = await session.list_tools()
#         result = await session.call_tool("query", {"sql": "SELECT count(*) FROM users"})
```

MCP vai implementar ferramentas e consumir ferramentas 解──Postgres servidor 了解 SQL──GitHub servidor 了解 API── Seu agente 只是发现并调用工具,它不需要每个集成 编写供应商特定代码──

## Entrega-o
本课会产出 `outputs/prompt-tool-designer.md`, é um modelo de prompt replicável para definições de ferramentas de design. Dá-lhe uma descrição sobre o que você quer que a ferramenta faça, e gerará uma definição completa de JSON Schema, incluindo descrições, tipos e restrições.

Ele vai voltar a aparecer.`outputs/skill-function-calling-patterns.md`, é um quadro de decisão usado na produção para realizar chamadas de funções, abrangendo o design de ferramentas, manejo de erros, segurança e padrões específicos do fornecedor.

## 练习
1. **Add a 6th tool: database query.**实现 a simulação de uma ferramenta SQL, usar a tabela de memória. 接收表名 和过条件(不是原始SQL) 验证表名 位于允许列中,并且过操作员 仅限于 `=`- Não.`>`- Não.`<`- Não.`>=`- Não.`<=`△将匹配行 作为 JSON 返回──

2. **Implement retry with error feedback.**Quando chamada de ferramenta 失败时(por exemplo, cidade não encontrada),把 error message 回 modelo de decisão função,并让它修正参数──记录每个调用 需要多少次重复尝试──为每个工具调用 设置最多3次重复尝试──

3. **Build a multi-step agent.**某些 queries 需要串联工具调用:Lês o arquivo de configuração e diga-me qual o modelo é configurado, então procure na web para o preço desse modelo. 实现一个循环,持续运行直到模型决定不再需要工具,并把累积结果传进每个决策步――限制为10次回复,以防止无限循环──

4. **Measure tool selection accuracy.**Crear 30 带有预期工具名的测试查询──在所有30 查询 上运行你的决策功能,并衡量它选择正确工具的比例──识别哪些查询最容易导致工具之间的混──

5. **Implement tool call caching.**Se a mesma ferramenta em 60 segundos com os mesmos argumentos for utilizada, retornará o resultado em cache, em vez de re-executar.`(tool_name, frozenset(args.items()))`Por exemplo, o dicionário de palavras-chave, que contém 20 perguntas, tem uma lista de perguntas que podem ser consultadas.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Function calling | “Tool use” | 模型输出结构化 JSON，描述要用特定 arguments 调用的 function，由你的代码执行，而不是模型执行 |
| Tool definition | “Function schema” | 一个 JSON Schema object，描述 tool 的 name、purpose、parameters 和 types，模型读取它来决定何时以及如何使用该 tool |
| Tool choice | “Calling mode” | 控制模型必须调用 tool（required）、可以调用 tool（auto），还是必须调用特定 tool（named） |
| Parallel calling | “Multi-tool” | 模型在单个 turn 中输出多个 tool calls，从而减少 round trips，GPT-4o 和 Claude 都支持这一点 |
| Tool result | “Function output” | 执行 tool 后得到的 return value，作为 message 发回模型，使它能在 response 中使用真实数据 |
| Argument validation | “Input checking” | 在执行 tool 前，验证模型生成的 arguments 是否匹配预期 types、ranges 和 constraints |
| MCP | “Tool protocol” | Model Context Protocol，即 Anthropic 的 open standard，用于通过 servers 暴露 tools，让任何兼容 client 都能发现并调用 |
| Agent loop | “ReAct loop” | model-decides-tool、code-executes-tool、result-feeds-back 的迭代循环，直到模型拥有足够信息作出回答 |
| Tool poisoning | “Prompt injection via tools” | 一种攻击，其中 tool results 包含会操纵模型行为的 instructions，因此要 sanitize 所有 tool outputs |
| Rate limiting | “Call budget” | 设置每个 conversation 中 tool calls 的最大数量，以防止 infinite loops 和失控的 API costs |

## 延伸阅读
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling) Utilização do GPT-4o  Referência de autoridade para o uso de ferramentas, incluindo chamadas paralelas, chamadas forçadas e argumentos estruturados
- [Anthropic Tool Use Guide](https://docs.anthropic.com/en/docs/tool-use) Utilização de ferramentas de Claude 实现, incluindo respostas input_schema、multi-tool 和 tool_choice configuração
- [Model Context Protocol Specification](https://modelcontextprotocol.io) 跨 AI aplicações 工具互操作性 开放标准,包含服务器/client architecture
- [Schick et al., 2023 — “Toolformer: Language Models Can Teach Themselves to Use Tools”](https://arxiv.org/abs/2302.04761)  Relatório básico sobre a formação de LLMs para decidir quando e como utilizar ferramentas externas
- [Patil et al., 2023 — “Gorilla: Large Language Model Connected with Massive APIs”](https://arxiv.org/abs/2305.15334)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) 实时基准,对比 GPT-4o、Claude、Gemini 和 open models的函数调用精度
- [Yao et al., “ReAct: Synergizing Reasoning and Acting in Language Models” (ICLR 2023)](https://arxiv.org/abs/2210.03629) Localidade Pensamento-Ação-Observação, é cada vez chamada ferramenta Localidade de agente de nível externo; este curso termina, é a fase 14 接续之处──
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) Desde um único uso de ferramentas primitivas  construção de cinco tipos de padrões de combinação (quadro de corrida rápida, roteamento, paralelação, orquestração, trabalho, avaliador-optimizador) 
