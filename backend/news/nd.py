"""
NewsData API Wrapper
Newsdata’s /latest endpoint supports q, language, and others. English only is sufficient for now. 
"""

import os
import requests
from typing import List, Dict

NDIO_KEY = os.getenv("NDIO")

def fetch_newsdata(query: str, limit: int = 20, **kwargs) -> List[Dict]:
    """
    Uses the /latest endpoint of newsdata.io to fetch articles by keyword.
    """
    if not NDIO_KEY:
        return []

    url = "https://newsdata.io/api/1/latest"
    params = {
        "apikey": NDIO_KEY,
        "q": query,
        "language": "en",
        "page_size": limit,
        **kwargs,
    }

    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    articles = []
    for a in data.get("results", []):
        articles.append({
            "source": "newsdata",
            "title": a.get("title"),
            "description": a.get("description"),
            "url": a.get("link"),
            "published_at": a.get("pubDate"),
            "raw": a,
        })

    return articles
