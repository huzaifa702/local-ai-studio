import urllib.request
import urllib.parse
import json
import re
import html
from typing import List, Dict, Any, Optional

class WebSearchService:
    @staticmethod
    def search(query: str, max_results: int = 5, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Performs real-time web search.
        Uses DuckDuckGo HTML scraping by default (100% free, zero configuration),
        or Tavily/Search API if an API key is provided.
        """
        query = query.strip()
        if not query:
            return []

        # If Tavily API Key provided in settings
        if api_key and api_key.startswith("tvly-"):
            return WebSearchService._search_tavily(query, api_key, max_results)

        return WebSearchService._search_duckduckgo(query, max_results)

    @staticmethod
    def _search_duckduckgo(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }
        
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                content = response.read().decode("utf-8", errors="ignore")
                
            results = []
            
            # Find result blocks
            # Standard DDG html layout: <a class="result__a" href="...">Title</a> ... <a class="result__snippet" ...>Snippet</a>
            link_matches = re.findall(r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>', content, re.DOTALL)
            snippet_matches = re.findall(r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>', content, re.DOTALL)
            
            if not snippet_matches:
                snippet_matches = re.findall(r'<div[^>]+class="result__snippet"[^>]*>(.*?)</div>', content, re.DOTALL)

            for i, (raw_link, raw_title) in enumerate(link_matches[:max_results]):
                clean_title = html.unescape(re.sub(r'<.*?>', '', raw_title)).strip()
                
                # Extract actual target URL from DDG redirect url
                actual_url = raw_link
                if "uddg=" in raw_link:
                    try:
                        actual_url = urllib.parse.unquote(raw_link.split("uddg=")[1].split("&")[0])
                    except Exception:
                        actual_url = raw_link
                elif raw_link.startswith("//"):
                    actual_url = "https:" + raw_link
                
                # Extract domain name for favicon and citations
                domain = ""
                try:
                    parsed = urllib.parse.urlparse(actual_url)
                    domain = parsed.netloc.replace("www.", "")
                except Exception:
                    pass

                snippet_text = ""
                if i < len(snippet_matches):
                    snippet_text = html.unescape(re.sub(r'<.*?>', '', snippet_matches[i])).strip()

                if clean_title and actual_url and not actual_url.startswith("/"):
                    results.append({
                        "title": clean_title,
                        "url": actual_url,
                        "snippet": snippet_text,
                        "domain": domain,
                        "favicon": f"https://www.google.com/s2/favicons?domain={domain}&sz=32" if domain else ""
                    })

            # If no results parsed via HTML regex, fallback to instant answer API
            if not results:
                return WebSearchService._search_ddg_api(query, max_results)

            return results
        except Exception as e:
            print(f"DuckDuckGo search error: {e}")
            return WebSearchService._search_ddg_api(query, max_results)

    @staticmethod
    def _search_ddg_api(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        try:
            api_url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json&no_html=1&skip_disambig=1"
            req = urllib.request.Request(api_url, headers={"User-Agent": "LocalAIPlatform/1.0"})
            with urllib.request.urlopen(req, timeout=8) as response:
                data = json.loads(response.read().decode("utf-8"))

            results = []
            if data.get("AbstractText") and data.get("AbstractURL"):
                results.append({
                    "title": data.get("Heading") or query,
                    "url": data.get("AbstractURL"),
                    "snippet": data.get("AbstractText"),
                    "domain": urllib.parse.urlparse(data.get("AbstractURL")).netloc.replace("www.", ""),
                    "favicon": "https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=32"
                })

            for topic in data.get("RelatedTopics", [])[:max_results]:
                if "Text" in topic and "FirstURL" in topic:
                    results.append({
                        "title": topic.get("Text", "")[:60] + "...",
                        "url": topic.get("FirstURL"),
                        "snippet": topic.get("Text"),
                        "domain": urllib.parse.urlparse(topic.get("FirstURL")).netloc.replace("www.", ""),
                        "favicon": ""
                    })
            return results
        except Exception as e:
            print(f"DDG API Fallback error: {e}")
            return []

    @staticmethod
    def _search_tavily(query: str, api_key: str, max_results: int = 5) -> List[Dict[str, Any]]:
        try:
            data = json.dumps({
                "api_key": api_key,
                "query": query,
                "max_results": max_results,
                "include_images": False,
                "include_raw_content": False
            }).encode("utf-8")
            
            req = urllib.request.Request(
                "https://api.tavily.com/search",
                data=data,
                headers={"Content-Type": "application/json", "User-Agent": "LocalAIPlatform/1.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res = json.loads(response.read().decode("utf-8"))
            
            results = []
            for item in res.get("results", []):
                url = item.get("url", "")
                domain = urllib.parse.urlparse(url).netloc.replace("www.", "") if url else ""
                results.append({
                    "title": item.get("title", ""),
                    "url": url,
                    "snippet": item.get("content", ""),
                    "domain": domain,
                    "favicon": f"https://www.google.com/s2/favicons?domain={domain}&sz=32" if domain else ""
                })
            return results
        except Exception as e:
            print(f"Tavily search error: {e}")
            return WebSearchService._search_duckduckgo(query, max_results)

    @staticmethod
    def format_search_context(results: List[Dict[str, Any]]) -> str:
        """
        Formats search results into a clean context prompt for the LLM.
        """
        if not results:
            return ""

        context_lines = ["\n[WEB SEARCH RESULTS (Real-time online data)]:\n"]
        for i, r in enumerate(results, 1):
            context_lines.append(f"[{i}] {r.get('title')} ({r.get('url')})")
            if r.get('snippet'):
                context_lines.append(f"    Snippet: {r.get('snippet')}")
            context_lines.append("")
        context_lines.append("Instructions: Use the real-time search results above to answer the user accurately. Cite the source numbers like [1], [2] where appropriate.\n")
        return "\n".join(context_lines)
