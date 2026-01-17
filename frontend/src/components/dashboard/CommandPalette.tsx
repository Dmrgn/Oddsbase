import { useEffect, useMemo, useRef, useState } from "react";
import { Command } from "cmdk";
import { getCommandEntries, type CommandParamSchema } from "@/commands/registry";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { agentController, type AgentEvent } from "@/commands/agentController";
import { useUIStore } from "@/hooks/useUIStore";

type FocusMode = "list" | "param" | "run";

const buildInitialValues = (params?: CommandParamSchema[]) =>
  params?.reduce<Record<string, string>>((acc, param) => {
    acc[param.name] = param.defaultValue ?? "";
    return acc;
  }, {}) ?? {};

export function CommandPalette() {
  const { isCommandPaletteOpen: isOpen, closeCommandPalette: onClose, initialCommandId, initialParams } = useUIStore();

  const [search, setSearch] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);

  // State for selection & focus
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [focusMode, setFocusMode] = useState<FocusMode>("list");
  const [activeParamIndex, setActiveParamIndex] = useState(0);

  // Refs for focusing elements
  const searchInputRef = useRef<HTMLInputElement>(null);
  const paramRefs = useRef<(HTMLInputElement | null)[]>([]);
  const runButtonRef = useRef<HTMLButtonElement | null>(null);

  const entries = useMemo(
    () =>
      getCommandEntries(async (prompt) => {
        const events = await agentController.processInput(prompt);
        setAgentEvents((prev) => [...events, ...prev].slice(0, 6));
      }),
    []
  );

  const commandMap = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);

  // Handle initial store values when opening
  useEffect(() => {
    if (!isOpen) return;

    if (initialCommandId) {
      const entry = commandMap.get(initialCommandId);
      if (entry) {
        setSelectedValue(initialCommandId);
        const defaults = buildInitialValues(entry.params);
        setParamValues({ ...defaults, ...initialParams });
        if (entry.params && entry.params.length > 0) {
          setFocusMode("param");
          setActiveParamIndex(0);
        } else {
          setFocusMode("run");
        }
      }
      return;
    }

    setSearch("");
    setFocusMode("list");
    setActiveParamIndex(0);
  }, [isOpen, initialCommandId, initialParams, commandMap]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const filteredEntries = entries.filter((entry) => {
    if (!search.trim()) return true;
    const haystack = `${entry.label} ${entry.description ?? ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  // Derived active entry based on what's highlighted in the list
  const activeEntry = useMemo(() => commandMap.get(selectedValue) ?? null, [selectedValue, commandMap]);

  // When activeEntry changes, reset param values (unless we are deep in editing logic, but usually switching command = reset)
  useEffect(() => {
    if (focusMode === "list") {
      setParamValues(buildInitialValues(activeEntry?.params));
      setActiveParamIndex(0);
    }
  }, [activeEntry, focusMode]);

  // Effects to handle focus moves
  useEffect(() => {
    if (!isOpen) return;
    
    if (focusMode === "list") {
      // Focus the search input so up/down arrows work in cmdk list
      searchInputRef.current?.focus();
    } else if (focusMode === "param") {
      requestAnimationFrame(() => {
        paramRefs.current[activeParamIndex]?.focus();
      });
    } else if (focusMode === "run") {
      requestAnimationFrame(() => {
        runButtonRef.current?.focus();
      });
    }
  }, [focusMode, activeParamIndex, isOpen]);

  // Reset state when opening/closing or filtering
  useEffect(() => {
    if (isOpen && filteredEntries.length > 0) {
      // Default select first item if none selected
      if (!selectedValue || !filteredEntries.some(e => e.id === selectedValue)) {
        const first = filteredEntries[0];
        if (first) setSelectedValue(first.id);
      }
    }
  }, [isOpen, filteredEntries, selectedValue]);

  const handleRun = () => {
    if (!activeEntry) return;
    activeEntry.handler(paramValues);
    
    const shouldClose = activeEntry.closeOnRun !== false;
    if (shouldClose) {
      onClose();
    }
    
    // Reset state
    setSearch("");
    setFocusMode("list");
    setActiveParamIndex(0);
    // Select first available again
    if (filteredEntries[0]) {
      setSelectedValue(filteredEntries[0].id);
      setParamValues(buildInitialValues(filteredEntries[0].params));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If we're in the list, cmdk handles Up/Down. We listen for Enter to move to params.
    if (focusMode === "list") {
      if (e.key === "Enter") {
        e.preventDefault();
        // If the command has params, go to first param. Else go to run button.
        if (activeEntry?.params?.length) {
          setFocusMode("param");
          setActiveParamIndex(0);
        } else {
          setFocusMode("run");
        }
      }
      return;
    }

    // If we're editing params
    if (focusMode === "param") {
      if (e.key === "Enter") {
        e.preventDefault();
        const totalParams = activeEntry?.params?.length ?? 0;
        if (activeParamIndex < totalParams - 1) {
          setActiveParamIndex(activeParamIndex + 1);
        } else {
          setFocusMode("run");
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        // Go back up
        if (activeParamIndex > 0) {
          setActiveParamIndex(activeParamIndex - 1);
        } else {
          setFocusMode("list");
        }
      }
      return;
    }

    // If we're on the run button
    if (focusMode === "run") {
      if (e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        const totalParams = activeEntry?.params?.length ?? 0;
        if (totalParams > 0) {
          setFocusMode("param");
          setActiveParamIndex(totalParams - 1);
        } else {
          setFocusMode("list");
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6">
      <div 
        className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl"
        onKeyDown={handleKeyDown}
      >
        <Command
          className="w-full"
          loop
          value={selectedValue}
          onValueChange={(val) => {
            // Only allow changing selection via mouse/keyboard if we are in list mode
            // If we are editing params, we don't want hover to change the active entry on the left
            if (focusMode === "list") {
              setSelectedValue(val);
            }
          }}
          shouldFilter={false} // We filter manually
        >
          <div className="border-b border-border p-3">
            <Input
              ref={searchInputRef}
              autoFocus
              placeholder="Type a command..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setFocusMode("list"); // Typing resets focus to list
              }}
            />
          </div>
          <div className="grid gap-0 md:grid-cols-[1.3fr_1fr]">
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="p-4 text-sm text-muted-foreground">
                No matching commands.
              </Command.Empty>
              {filteredEntries.map((entry) => (
                <Command.Item
                  key={entry.id}
                  value={entry.id}
                  className="flex cursor-pointer flex-col gap-1 rounded-lg px-3 py-2 text-sm text-foreground aria-selected:bg-muted data-[selected=true]:bg-muted"
                  onSelect={() => {
                    // Clicking an item should enter param mode
                    if (focusMode === "list") {
                      if (entry.params?.length) {
                        setFocusMode("param");
                        setActiveParamIndex(0);
                      } else {
                        setFocusMode("run");
                      }
                    }
                  }}
                >
                  <span className="font-medium">{entry.label}</span>
                  {entry.description && (
                    <span className="text-xs text-muted-foreground">{entry.description}</span>
                  )}
                </Command.Item>
              ))}
            </Command.List>

            {/* Right Pane: Preview / Form */}
            <div className="border-l border-border p-4 bg-card/50">
              {activeEntry ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold">{activeEntry.label}</div>
                    {activeEntry.description && (
                      <div className="text-xs text-muted-foreground">{activeEntry.description}</div>
                    )}
                  </div>
                  
                  {activeEntry.params?.length ? (
                    <div className="space-y-3">
                      {activeEntry.params.map((param, index) => (
                        <label key={param.name} className="block space-y-1 text-xs text-muted-foreground">
                          <span>{param.label}</span>
                          <Input
                            ref={(node) => {
                              paramRefs.current[index] = node;
                            }}
                            value={paramValues[param.name] ?? ""}
                            placeholder={param.placeholder}
                            // When clicking directly into an input
                            onFocus={() => {
                              setFocusMode("param");
                              setActiveParamIndex(index);
                            }}
                            onChange={(event) =>
                              setParamValues((prev) => ({
                                ...prev,
                                [param.name]: event.target.value,
                              }))
                            }
                          />
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No parameters required.</div>
                  )}

                  <Button
                    ref={runButtonRef}
                    onClick={handleRun}
                    onFocus={() => setFocusMode("run")}
                    className="w-full"
                  >
                    Run Command
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Select a command to configure.</div>
              )}
            </div>
          </div>

          <div className="border-t border-border p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Agent Activity</div>
            {agentEvents.length === 0 ? (
              <div className="mt-2 text-xs text-muted-foreground">No agent activity yet.</div>
            ) : (
              <div className="mt-2 space-y-2">
                {agentEvents.map((event) => (
                  <div key={event.id} className="rounded-lg bg-muted px-3 py-2 text-xs">
                    {event.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Command>
      </div>
    </div>
  );
}
