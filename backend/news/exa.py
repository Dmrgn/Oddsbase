"""
EXA.ai News Fetcher
Just the wrapper
Notes:
  - EXA requires POST with JSON body.
  - This uses the search endpoint with basic query + num_results.
  - Also can use filters like start_published_date.
"""

import os
import requests
from typing import List, Dict

EXA_KEY = os.getenv("EXA")

def fetch_exa(query: str, limit: int = 20, **kwargs) -> List[Dict]:
    """
    Query the EXA search API to find relevant pages by keyword.
    EXA's API returns a list of search results. Query params like
    num_results control count. For deeper content extraction use
    other EXA endpoints (contents or search_and_contents).
    """
    if not EXA_KEY:
        return []

    url = "https://api.exa.ai/search"
    headers = {"x-api-key": EXA_KEY}
    payload = {
        "query": query,
        "num_results": limit,
        **kwargs,
    }

    resp = requests.post(url, json=payload, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    articles = []
    for item in data.get("results", []):
        articles.append({
            "source": "exa",
            "title": item.get("title") or item.get("link", ""),
            "description": item.get("snippet"),
            "url": item.get("link"),
            "published_at": item.get("published_at"),
            "raw": item,
        })

    return articles
