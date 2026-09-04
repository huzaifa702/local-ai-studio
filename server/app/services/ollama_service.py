import json
import httpx
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional
from ..config import OLLAMA_BASE_URL, RECOMMENDED_MODELS

class OllamaService:
    def __init__(self, base_url: str = OLLAMA_BASE_URL):
        self.base_url = base_url

    async def is_running(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    async def get_models(self) -> Dict[str, Any]:
        is_online = await self.is_running()
        installed_models = []
        
        if is_online:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(f"{self.base_url}/api/tags")
                    if res.status_code == 200:
                        data = res.json()
                        for m in data.get("models", []):
                            installed_models.append({
                                "name": m.get("name"),
                                "size": f"{m.get('size', 0) / (1024**3):.2f} GB",
                                "rawSize": m.get("size", 0),
                                "modifiedAt": m.get("modified_at"),
                                "format": m.get("details", {}).get("format", "gguf"),
                                "family": m.get("details", {}).get("family", "llama"),
                                "parameterSize": m.get("details", {}).get("parameter_size", "7B"),
                                "quantizationLevel": m.get("details", {}).get("quantization_level", "Q4_0"),
                                "isInstalled": True
                            })
            except Exception as e:
                print(f"Error fetching Ollama models: {e}")

        # Merge with recommended models
        installed_names = {m["name"] for m in installed_models}
        recommended_with_status = []
        for rec in RECOMMENDED_MODELS:
            is_inst = rec["name"] in installed_names or any(rec["name"].split(":")[0] in name for name in installed_names)
            rec_copy = dict(rec)
            rec_copy["isInstalled"] = is_inst
            recommended_with_status.append(rec_copy)

        return {
            "isOllamaRunning": is_online,
            "installedModels": installed_models,
            "recommendedModels": recommended_with_status,
            "hardwareRecommendation": {
                "system": "HP ZBook 15 G3 (i7, 16GB RAM, Quadro M2000M 4GB VRAM)",
                "optimalModel": "qwen2.5-coder:7b (Coding) / llama3.2:3b (Chat)",
                "maxVramRecommended": "4.0 GB",
                "maxRamRecommended": "14.0 GB"
            }
        }

    async def pull_model_stream(self, model_name: str) -> AsyncGenerator[str, None]:
        if not await self.is_running():
            yield json.dumps({"status": "error", "error": "Ollama is not running. Start Ollama first using 'ollama serve' in your terminal."}) + "\n"
            return

        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("POST", f"{self.base_url}/api/pull", json={"name": model_name, "stream": True}) as response:
                    async for chunk in response.aiter_lines():
                        if chunk:
                            yield chunk + "\n"
        except Exception as e:
            yield json.dumps({"status": "error", "error": str(e)}) + "\n"

    def resolve_auto_model(self, model: str, has_images: bool, content: str, think_enabled: bool = False) -> str:
        m_lower = model.lower().strip()
        if m_lower in ["auto", "omni", "auto-smart", "guts-omni", "guts omni", "ox-alpha", "ox_alpha", "oxalpha", "ox alpha"]:
            # 1. Vision Model
            if has_images:
                return "moondream:latest"

            # 2. Explicit Reasoning Model (<think>)
            if think_enabled:
                return "deepseek-r1:7b"
            
            # 3. Explicit Code Block / Programming syntax
            code_keywords = ["```", "def ", "class ", "import React", "from 'react'", "function(", "const [", "async def "]
            if any(k in content for k in code_keywords):
                return "qwen2.5-coder:7b"

            # 4. Default Ultra-Fast Chat Model (llama3.2:3b is 5x faster than 7b)
            return "llama3.2:3b"
            
        # If user passed a model that doesn't exist, fallback safely to llama3.2:3b
        known_models = ["llama3.2:3b", "qwen2.5-coder:7b", "deepseek-r1:7b", "moondream:latest"]
        if model not in known_models and not any(k in model for k in ["llama", "qwen", "deepseek", "moondream"]):
            return "llama3.2:3b"
            
        return model

    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        system_prompt: Optional[str] = None,
        images: Optional[List[str]] = None,
        temperature: float = 0.7,
        cloud_api_key: Optional[str] = None,
        provider: Optional[str] = None,
        think_enabled: bool = False
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # Resolve auto model if requested
        last_text = messages[-1]["content"] if messages else ""
        resolved_model = self.resolve_auto_model(model, bool(images), last_text, think_enabled)
        
        # 1. Cloud Provider Fallback if API key provided
        if cloud_api_key and provider and provider != "ollama":
            async for token in self._stream_cloud_chat(provider, cloud_api_key, model, messages, system_prompt, temperature):
                yield token
            return

        # 2. Local Ollama Execution
        is_online = await self.is_running()
        if is_online:
            formatted_messages = []
            if system_prompt:
                formatted_messages.append({"role": "system", "content": system_prompt})
            
            for msg in messages:
                m_payload = {"role": msg["role"], "content": msg["content"]}
                if "images" in msg and msg["images"]:
                    m_payload["images"] = msg["images"]
                formatted_messages.append(m_payload)

            payload = {
                "model": resolved_model,
                "messages": formatted_messages,
                "stream": True,
                "options": {
                    "temperature": temperature,
                    "num_thread": 8,
                    "num_ctx": 4096,
                    "top_k": 40,
                    "top_p": 0.9
                }
            }

            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                        if response.status_code != 200:
                            err_body = await response.aread()
                            yield {"error": f"Ollama error ({response.status_code}): {err_body.decode('utf-8')}"}
                            return

                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    data = json.loads(line)
                                    msg_content = data.get("message", {}).get("content", "")
                                    done = data.get("done", False)
                                    yield {"content": msg_content, "done": done}
                                except Exception:
                                    continue
                return
            except Exception as e:
                yield {"error": f"Ollama streaming connection error: {str(e)}"}
                return

        # 3. Simulated Fallback Mode when Ollama is offline
        # Guides the user with rich formatting, code blocks, and instructions while running 100% locally
        async for chunk in self._stream_simulated_response(model, messages):
            yield chunk

    async def _stream_cloud_chat(
        self,
        provider: str,
        api_key: str,
        model: str,
        messages: List[Dict[str, Any]],
        system_prompt: Optional[str],
        temperature: float
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # Support OpenAI / Groq / OpenRouter API compatible endpoints
        base_urls = {
            "openai": "https://api.openai.com/v1",
            "groq": "https://api.groq.com/openai/v1",
            "openrouter": "https://openrouter.ai/api/v1",
            "gemini": "https://generativelanguage.googleapis.com/v1beta/openai"
        }
        url = base_urls.get(provider, "https://api.openai.com/v1")
        
        chat_msgs = []
        if system_prompt:
            chat_msgs.append({"role": "system", "content": system_prompt})
        for m in messages:
            chat_msgs.append({"role": m["role"], "content": m["content"]})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{url}/chat/completions",
                    headers=headers,
                    json={"model": model, "messages": chat_msgs, "temperature": temperature, "stream": True}
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            raw = line[6:].strip()
                            if raw == "[DONE]":
                                yield {"content": "", "done": True}
                                break
                            try:
                                parsed = json.loads(raw)
                                delta = parsed["choices"][0]["delta"].get("content", "")
                                if delta:
                                    yield {"content": delta, "done": False}
                            except Exception:
                                continue
        except Exception as e:
            yield {"error": f"Cloud API error ({provider}): {str(e)}"}

    async def _stream_simulated_response(
        self,
        model: str,
        messages: List[Dict[str, Any]]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        last_msg = messages[-1]["content"] if messages else "Hello"
        
        greeting = (
            f"### ⚡ Local AI Studio (Offline / Demo Mode)\n\n"
            f"You selected model **`{model}`**.\n\n"
            f"To run completely **offline & free** with full local GPU/CPU inference on your HP ZBook:\n"
            f"1. Download and install Ollama from [ollama.com](https://ollama.com)\n"
            f"2. In your terminal, run:\n"
            f"```bash\n"
            f"ollama pull {model if ':' in model else 'llama3.2:3b'}\n"
            f"ollama serve\n"
            f"```\n\n"
            f"---\n\n"
            f"#### Response to your inquiry:\n\n"
        )
        
        simulated_text = (
            greeting +
            f"I have received your message: *\"{last_msg}\"*\n\n"
            "Here is a sample code snippet showcasing full Markdown, KaTeX math, and syntax highlighting:\n\n"
            "```python\n"
            "# Fibonacci Generator with Memoization\n"
            "def fibonacci(n: int, memo: dict = None) -> int:\n"
            "    if memo is None:\n"
            "        memo = {}\n"
            "    if n in memo:\n"
            "        return memo[n]\n"
            "    if n <= 1:\n"
            "        return n\n"
            "    memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo)\n"
            "    return memo[n]\n\n"
            "print([fibonacci(i) for i in range(10)])\n"
            "```\n\n"
            "#### Mathematical Formula:\n"
            "$$F_n = \\frac{1}{\\sqrt{5}} \\left( \\left(\\frac{1 + \\sqrt{5}}{2}\\right)^n - \\left(\\frac{1 - \\sqrt{5}}{2}\\right)^n \\right)$$\n\n"
            "All features (File Uploads, Voice STT/TTS, Project Memory, and Settings) are fully active!"
        )

        words = simulated_text.split(" ")
        for i, word in enumerate(words):
            yield {"content": word + " ", "done": False}
            await asyncio.sleep(0.02)
        yield {"content": "", "done": True}

ollama_service = OllamaService()
