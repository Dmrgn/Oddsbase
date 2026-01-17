import { useEffect, useState } from "react";
import { backendInterface, type NewsItem } from "@/backendInterface";
import { formatTimestamp } from "@/lib/utils";
import type { PanelInstance } from "@/hooks/useWorkspaceStore";

interface NewsFeedPanelProps {
  panel: PanelInstance;
}

const sentimentStyles: Record<NewsItem["sentiment"], string> = {
  positive: "bg-emerald-500/10 text-emerald-600",
  neutral: "bg-slate-500/10 text-slate-600",
  negative: "bg-rose-500/10 text-rose-600",
};

export function NewsFeedPanel({ panel }: NewsFeedPanelProps) {
  const query = String(panel.data.query ?? "");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    backendInterface
      .fetchNews(query)
      .then((data) => {
        if (!isMounted) return;
        setItems(data.items ?? []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message ?? "Unable to load news");
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
      <div className="text-sm text-muted-foreground">Query: {query}</div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      {!error && items.length === 0 && (
        <div className="text-sm text-muted-foreground">Loading news…</div>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-border p-3 transition hover:bg-muted"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-sm leading-tight">{item.title}</div>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  sentimentStyles[item.sentiment]
                }`}
              >
                {item.sentiment}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.source}</span>
              <span>{formatTimestamp(item.publishedAt)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
