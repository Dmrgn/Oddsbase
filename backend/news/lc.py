"""
LunarCrush API
It's not as much of a "normaL" news API, but it has social insights that are useful.
"""


import os
import requests
from typing import List, Dict

LC_KEY = os.getenv("LC")

def fetch_lunarcrush(query: str, limit: int = 20, **kwargs) -> List[Dict]:
    """
    LunarCrush provides social and crypto metrics. There is no
    simple 'news' endpoint, so we use the assets or insights endpoints
    filtering for relevant text mentions of query.
    """
    if not LC_KEY:
        return []

    url = "https://api.lunarcrush.com/v4/coins"
    headers = {"Authorization": f"Bearer {LC_KEY}"}
    params = {
        "data": "social",
        "symbol": query.upper(),
        "limit": limit,
        **kwargs,
    }

    resp = requests.get(url, params=params, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    articles = []
    for a in data.get("data", []):
        articles.append({
            "source": "lunarcrush",
            "title": f"{a.get('name')} Social Metrics",
            "description": f"Social score {a.get('social_score', None)}",
            "url": a.get("website_url"),
            "published_at": a.get("timestamp"),
            "raw": a,
        })

    return articles

