
from typing import List, Dict, Callable

from .exa import fetch_exa
from .nd import fetch_newsdata
from .fmp import fetch_fmp
from .lc import fetch_lunarcrush


# Article type alias
Article = Dict[str, object]


class NewsFetcher:
    """
    Dispatcher for news provider fetch functions.

    This class contains no provider logic.
    Providers are registered at runtime.
    """

    def __init__(self) -> None:
        self._providers: dict[str, Callable[..., List[Article]]] = {}

    def register_provider(
        self,
        name: str,
        fetch_fn: Callable[..., List[Article]],
    ) -> None:
        """
        Register a news provider fetch function.

        fetch_fn signature:
            (query: str, limit: int, **kwargs) -> List[Article]
        """
        self._providers[name] = fetch_fn

    def available_providers(self) -> List[str]:
        return list(self._providers.keys())

    def fetch(
        self,
        provider: str,
        query: str,
        limit: int = 20,
        **kwargs,
    ) -> List[Article]:
        """
        Fetch news from a single provider.
        """
        if provider not in self._providers:
            raise ValueError(f"Unknown provider: {provider}")

        return self._providers[provider](
            query=query,
            limit=limit,
            **kwargs,
        )

    def fetch_multiple(
        self,
        providers: List[str],
        query: str,
        limit: int = 20,
        **kwargs,
    ) -> List[Article]:
        """
        Fetch news from multiple providers and aggregate results.
        """
        articles: List[Article] = []

        for provider in providers:
            if provider not in self._providers:
                continue

            try:
                articles.extend(
                    self._providers[provider](
                        query=query,
                        limit=limit,
                        **kwargs,
                    )
                )
            except Exception:
                # Silently skip failed providers per spec
                continue

        return articles


news_fetcher = NewsFetcher()

news_fetcher.register_provider("exa", fetch_exa)
news_fetcher.register_provider("newsdata", fetch_newsdata)
news_fetcher.register_provider("fmp", fetch_fmp)
news_fetcher.register_provider("lunarcrush", fetch_lunarcrush)
