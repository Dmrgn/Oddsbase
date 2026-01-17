from pathlib import Path
from dotenv import load_dotenv

# since .env file is in the root
load_dotenv(Path(__file__).parent.parent / ".env")

from typing import List, Optional, Union
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from news.fetcher import news_fetcher, Article
# Providers will be registered elsewhere at startup
# Example:
#       news_fetcher.register_provider("FMP", fetch_newsapi)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@app.get("/news/search", response_model=List[Article])
def search_news(
    q: str = Query(..., description="Search query"),
    providers: Optional[List[str]] = Query(
        None, description="Providers to query"
    ),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Called when the user presses Enter in the search bar.
    Expected Request shape:
    GET /news/search?q=inflation&providers=newsapi&providers=gnews&limit=25
    """
    
    if providers:
        return news_fetcher.fetch_multiple(
            providers=providers,
            query=q,
            limit=limit,
        )

    return news_fetcher.fetch_multiple(
        providers=news_fetcher.available_providers(),
        query=q,
        limit=limit,
    )
