import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PanelInstance } from "@/hooks/useWorkspaceStore";
import { useNewsSearch } from "@/hooks/useNewsSearch";

interface NewsFeedPanelProps {
  panel: PanelInstance;
}

export function NewsFeedPanel({ panel }: NewsFeedPanelProps) {
  const defaultQuery = String(panel.data.query ?? "stock");
  const [inputValue, setInputValue] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState(defaultQuery);
  const state = useNewsSearch(submittedQuery);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const queryToSearch = inputValue.trim() || defaultQuery;
      setSubmittedQuery(queryToSearch);
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="shrink-0">
        <CardTitle>{String(panel.data.title ?? "News Feed")}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <Input
          type="text"
          placeholder="prediction markets"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full"
        />

        {state.status === "loading" && (
          <div className="text-sm text-muted-foreground">Loading news…</div>
        )}

        {state.status === "error" && (
          <div className="text-sm text-destructive">{state.error}</div>
        )}

        {state.status === "success" && state.articles.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No results for "{submittedQuery}"
          </div>
        )}

        {state.status === "success" && state.articles.length > 0 && (
          <div className="space-y-3">
            {state.articles.map((article, index) => (
              <a
                key={`${article.source}-${index}`}
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-border p-3 transition hover:bg-muted"
              >
                <div className="font-medium text-sm leading-tight">
                  {article.title}
                </div>
                {article.description && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {article.description}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                    {article.source}
                  </span>
                  {article.published_at && (
                    <span>{String(article.published_at)}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
