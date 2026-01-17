import { useWorkspaceStore, type PanelInstance } from "@/hooks/useWorkspaceStore";

interface AgentStatusProps {
  messages: string[];
}

export function AgentStatus({ messages }: AgentStatusProps) {
  const panels = useWorkspaceStore((state: { panels: PanelInstance[] }) => state.panels);

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Agent Activity</div>
      <div className="mt-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-muted-foreground">No recent agent activity.</div>
        )}
        {messages.map((message, index) => (
          <div key={`${message}-${index}`} className="rounded-lg bg-muted px-3 py-2 text-xs">
            {message}
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        Active panels: {panels.filter((panel: PanelInstance) => panel.isVisible).length}
      </div>
    </div>
  );
}
