"""
FiancialModellingPrep API Wrapper :)

Can add variant for stock news food (it's available) later.

"""

import os
import requests
from typing import List, Dict

FMP_KEY = os.getenv("FMP")

def fetch_fmp(query: str, limit: int = 20, **kwargs) -> List[Dict]:
    """
    Uses the FMP General News API to retrieve market news.
    Querying is approximated by retrieving a page of latest news
    then filtering by keyword presence.
    """
    if not FMP_KEY:
        return []

    base = "https://financialmodelingprep.com/stable/news/general-latest"
    params = {
        "apikey": FMP_KEY,
        "limit": limit,
        **kwargs,
    }

    resp = requests.get(base, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    articles = []
    for a in data:
        title = a.get("title") or a.get("headline") or ""
        if query.lower() in title.lower():
            articles.append({
                "source": "fmp",
                "title": title,
                "description": a.get("text") or a.get("description"),
                "url": a.get("url") or a.get("articleUrl"),
                "published_at": a.get("publishedDate") or a.get("published_at"),
                "raw": a,
            })

    return articles
