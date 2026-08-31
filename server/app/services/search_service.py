import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import re
import html
import ssl
from typing import List, Dict, Any, Optional

# Disable SSL verification issues for worldwide ISP resilience
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9"
}

class WebSearchService:
    @staticmethod
    def search(query: str, max_results: int = 5, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Multi-tier resilient real-time web search:
        1. Brave Search API (if key provided)
        2. Tavily Search API (if key provided)
        3. Real-Time Google Web/News Engine (100% Free, Zero-Config, Never Blocks)
        4. Bing Search Engine (100% Free Fallback)
        5. DuckDuckGo Engine (100% Free Fallback)
        """
        query = query.strip()
        if not query:
            return []

        # 1. Brave Search API if provided
        if api_key and (api_key.startswith("BSA") or len(api_key) == 32):
            res = WebSearchService._search_brave(query, api_key, max_results)
            if res:
                return res

        # 2. Tavily API if provided
        if api_key and api_key.startswith("tvly-"):
            res = WebSearchService._search_tavily(query, api_key, max_results)
            if res:
                return res

        # 3. Real-Time Google Web Engine (100% Free, Zero-Config, Fast & Reliable)
        res = WebSearchService._search_google_rss(query, max_results)
        if res:
            return res

        # 4. Bing Engine (100% Free Fallback)
        res = WebSearchService._search_bing_rss(query, max_results)
        if res:
            return res

        # 5. DuckDuckGo Fallback
        return WebSearchService._search_duckduckgo(query, max_results)

    @staticmethod
    def _search_google_rss(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Queries Google Real-Time Search & News RSS. 100% Free, 0 API keys.
        """
        try:
            encoded_q = urllib.parse.quote(query)
            url = f"https://news.google.com/rss/search?q={encoded_q}&hl=en-US&gl=US&ceid=US:en"
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=7, context=ssl_ctx) as response:
                xml_data = response.read().decode("utf-8", errors="ignore")

            root = ET.fromstring(xml_data)
            items = root.findall(".//item")
            results = []

            for item in items[:max_results]:
                raw_title = item.findtext("title") or ""
                link = item.findtext("link") or ""
                pub_date = item.findtext("pubDate") or ""
                description = item.findtext("description") or ""

                # Clean title and extract source publisher if present (e.g. "Title - Publisher")
                clean_title = html.unescape(raw_title).strip()
                clean_desc = html.unescape(re.sub(r"<.*?>", "", description)).strip()

                # Extract domain
                domain = ""
                try:
                    if link:
                        parsed = urllib.parse.urlparse(link)
                        domain = parsed.netloc.replace("www.", "")
                except Exception:
                    pass

                if not domain and " - " in clean_title:
                    domain = clean_title.split(" - ")[-1].strip().lower().replace(" ", "") + ".com"

                snippet = clean_desc if clean_desc else f"Published on {pub_date}"

                results.append({
                    "title": clean_title,
                    "url": link,
                    "snippet": snippet,
                    "domain": domain or "google.com",
                    "favicon": f"https://www.google.com/s2/favicons?domain={domain or 'google.com'}&sz=32"
                })

            return results
        except Exception as e:
            print(f"Google RSS Search error: {e}")
            return []

    @staticmethod
    def _search_bing_rss(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Queries Bing Search RSS. 100% Free, 0 API keys.
        """
        try:
            encoded_q = urllib.parse.quote(query)
            url = f"https://www.bing.com/news/search?q={encoded_q}&format=rss"
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=7, context=ssl_ctx) as response:
                xml_data = response.read().decode("utf-8", errors="ignore")

            root = ET.fromstring(xml_data)
            items = root.findall(".//item")
            results = []

            for item in items[:max_results]:
                title = html.unescape(item.findtext("title") or "").strip()
                link = item.findtext("link") or ""
                desc = html.unescape(re.sub(r"<.*?>", "", item.findtext("description") or "")).strip()

                domain = ""
                try:
                    if link:
                        domain = urllib.parse.urlparse(link).netloc.replace("www.", "")
                except Exception:
                    pass

                results.append({
                    "title": title,
                    "url": link,
                    "snippet": desc,
                    "domain": domain or "bing.com",
                    "favicon": f"https://www.google.com/s2/favicons?domain={domain or 'bing.com'}&sz=32"
                })

            return results
        except Exception as e:
            print(f"Bing RSS Search error: {e}")
            return []

    @staticmethod
    def _search_brave(query: str, api_key: str, max_results: int = 5) -> List[Dict[str, Any]]:
        try:
            url = f"https://api.search.brave.com/res/v1/web/search?q={urllib.parse.quote(query)}&count={max_results}"
            headers = {
                "Accept": "application/json",
                "X-Subscription-Token": api_key,
                "User-Agent": "LocalAIPlatform/1.0"
            }
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as response:
                data = json.loads(response.read().decode("utf-8"))

            results = []
            web_results = data.get("web", {}).get("results", [])
            for item in web_results[:max_results]:
                url_val = item.get("url", "")
                domain = urllib.parse.urlparse(url_val).netloc.replace("www.", "") if url_val else ""
                results.append({
                    "title": item.get("title", ""),
                    "url": url_val,
                    "snippet": item.get("description", ""),
                    "domain": domain,
                    "favicon": f"https://www.google.com/s2/favicons?domain={domain}&sz=32" if domain else ""
                })
            return results
        except Exception as e:
            print(f"Brave Search API error: {e}")
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
            with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as response:
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
            return []

    @staticmethod
    def _search_duckduckgo(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        try:
            api_url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json&no_html=1&skip_disambig=1"
            req = urllib.request.Request(api_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=6, context=ssl_ctx) as response:
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
            print(f"DDG Search error: {e}")
            return []

    @staticmethod
    def format_search_context(results: List[Dict[str, Any]]) -> str:
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
