import { useLayoutEffect, useRef, useState } from "react";
import { Responsive } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { PanelRegistry } from "@/components/panels/PanelRegistry";
import { useWorkspaceStore, type PanelInstance } from "@/hooks/useWorkspaceStore";

type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type GridLayout = ReadonlyArray<GridLayoutItem>;

export function DashboardGrid() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const nextWidth = entry.contentRect.width;
      setContainerWidth((prev) =>
        prev !== nextWidth ? nextWidth : prev
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const panels = useWorkspaceStore(
    (state: { panels: PanelInstance[] }) => state.panels
  );

  const updateLayout = useWorkspaceStore(
    (state: {
      updateLayout: (
        id: string,
        layout: Pick<PanelInstance, "x" | "y" | "w" | "h">
      ) => void;
    }) => state.updateLayout
  );

  const layout: GridLayoutItem[] = panels
    .filter((panel) => panel.isVisible)
    .map((panel) => ({
      i: panel.id,
      x: panel.x,
      y: panel.y,
      w: panel.w,
      h: panel.h,
    }));

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(120,120,120,0.35) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        backgroundPosition: "0 0",
      }}
    >
      <Responsive
        className="layout"
        autoSize
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        margin={[16, 16]}
        width={containerWidth}
        draggableHandle=".panel-drag-handle"
        draggableCancel=".panel-content"
        onLayoutChange={(currentLayout: GridLayout) => {
          currentLayout.forEach((item) => {
            updateLayout(item.i, {
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
            });
          });
        }}
      >
        {panels
          .filter((panel) => panel.isVisible)
          .map((panel) => (
            <div
              key={panel.id}
              data-grid={{
                x: panel.x,
                y: panel.y,
                w: panel.w,
                h: panel.h,
              }}
            >
              <PanelRegistry panel={panel} />
            </div>
          ))}
      </Responsive>
    </div>
  );
}