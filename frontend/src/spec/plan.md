# Frontend Implementation Plan

This plan outlines the steps to implement the Predictive Market Dashboard frontend as specified in `frontend.md`.

## 1. Project Setup & Baseline
- Verify dependencies in `frontend/package.json` (React, TypeScript, Zustand, react-grid-layout, cmdk, Tailwind v4). (Note: use bun instead of node)
- Confirm global styles in `frontend/styles/globals.css` and Tailwind v4 `@theme` conventions.
- Ensure app entry points (`index.tsx`, `App.tsx`) render the root shell.

## 2. Layer 4: Global State & Persistence (Zustand)
- Create the workspace store with `PanelInstance` shape:
  ```ts
  interface PanelInstance {
    id: string;
    type: string;
    x: number; y: number; w: number; h: number;
    isVisible: boolean;
    data: any;
  }
  ```
- Add actions for panel lifecycle (open, close, update, move/resize).
- Wire Zustand `persist` middleware to `localStorage`.
- Rehydrate on load and drive UI from stored panel instances.

## 3. Layer 1: Backend Interface
- Implement typed REST helpers (e.g., `fetchMarketData`, `fetchNews`).
- Add WebSocket manager with subscribe/unsubscribe per market/topic.
- Keep this file as the **single** data source for external calls.
- Use dummy data for now.

## 4. Layer 3: Panel System (Components)
- Define panel “classes” in `components/panels/` for:
  - **Market Aggregator Graph** (historical + live updates via WebSocket).
  - **News Feed** (news list, sentiment badges, timestamps).
- Panels read data from `backendInterface.ts` and configuration from global state only.
- Ensure panels are self-contained (no cross-panel state reach).

## 5. Layer 3: Dashboard Layout (Tiles/Grid)
- Build a grid wrapper using `react-grid-layout` in `components/dashboard/`.
- Map `PanelInstance` list to grid items, passing panel config.
- Enable drag/resize; persist layout updates back to the store.

## 6. Layer 2: Command Layer & Agent
- Implement command registry in `commands/registry.ts`:
  - `OPEN_PANEL(type, data)`
  - `CLOSE_PANEL(id)`
  - `QUERY_MARKET(id)`
- Add agent controller loop (Thought → Action → Observation) in `agentController.ts`.
- Allow panels to access the command layer (e.g. for "Edit" functionality).

## 7. Command Palette & Agent UI
- Add `cmdk` (Shadcn Command) UI for command execution.
- Provide agent chat overlay or palette mode to display AI actions and feedback.

## 8. Formatting & Utility Layer
- Use `lib/utils.ts` to format odds/percentages consistently.
- Confirm all numeric/market values pass through formatter before render.

## 9. Acceptance Checklist
- Panels render from persisted state on reload.
- Drag/resize updates persist across refresh.
- Commands open/close panels correctly.
- Backend interface handles REST + WebSocket data flow.
- UI adheres to Tailwind v4 styling conventions.
