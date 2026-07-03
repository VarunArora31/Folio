"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useEditorStore } from "@/store/use-editor-store";

// Page width in px at screen resolution (816px = 8.5in @ 96dpi)
const PAGE_WIDTH = 816;
// Margins on each side of the ruler container (matching the editor px-4 = 16px each side)
// The ruler sits inside the same overflow-x-auto container and is centered to align with the page.
const RULER_MARGINS = 16; // px
const MIN_MARGIN = 0;
const MAX_MARGIN = PAGE_WIDTH / 2 - 10; // can't overlap past center

// Convert ruler local X → margin px value
// rulerWidth = PAGE_WIDTH, leftHandle is a fraction of that
const clampMargin = (v: number) => Math.max(MIN_MARGIN, Math.min(MAX_MARGIN, v));

// Tick mark config
const MAJOR_TICK_INTERVAL = 96; // px per inch
const MINOR_TICK_COUNT = 8; // minor divisions per inch
const MINOR_TICK_INTERVAL = MAJOR_TICK_INTERVAL / MINOR_TICK_COUNT;

const TriangleHandle = ({
  direction,
  title,
}: {
  direction: "left" | "right";
  title: string;
}) => (
  <svg
    width="10"
    height="8"
    viewBox="0 0 10 8"
    fill="#6e6c68"
    aria-label={title}
    style={{ display: "block" }}
  >
    {direction === "left" ? (
      <polygon points="0,0 10,0 10,8" />
    ) : (
      <polygon points="0,0 10,0 0,8" />
    )}
  </svg>
);

export const Ruler = () => {
  const { leftMargin, rightMargin, setLeftMargin, setRightMargin } =
    useEditorStore();

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Get left edge of the ruler (page start) in client coords
  const getRulerLeft = () => rulerRef.current?.getBoundingClientRect().left ?? 0;

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const onLeftMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
  }, []);

  const onRightMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingLeft && !isDraggingRight) return;
      const rulerLeft = getRulerLeft();
      const x = e.clientX - rulerLeft;

      if (isDraggingLeft) {
        setLeftMargin(clampMargin(x));
      } else {
        // right handle: distance from right edge
        setRightMargin(clampMargin(PAGE_WIDTH - x));
      }
    };

    const onMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight, setLeftMargin, setRightMargin]);

  // ── Build tick marks ───────────────────────────────────────────────────────
  const ticks: { x: number; major: boolean; label?: string }[] = [];
  for (let px = 0; px <= PAGE_WIDTH; px += MINOR_TICK_INTERVAL) {
    const isMajor = Math.round(px) % MAJOR_TICK_INTERVAL === 0;
    const inchLabel = isMajor ? String(Math.round(px / MAJOR_TICK_INTERVAL)) : undefined;
    ticks.push({ x: px, major: isMajor, label: inchLabel !== "0" ? inchLabel : undefined });
  }

  return (
    <div
      className="w-full overflow-x-auto print:hidden hidden sm:block"
      style={{ background: "#e8e6e1", paddingLeft: `${RULER_MARGINS}px`, paddingRight: `${RULER_MARGINS}px` }}
    >
      {/* Centered to match editor page width */}
      <div className="mx-auto relative" style={{ width: `${PAGE_WIDTH}px`, height: "24px" }}>
        {/* Ruler background — shaded regions = margins, white region = content */}
        {/* Left margin shade */}
        <div
          className="absolute top-0 bottom-0 border-b"
          style={{ left: 0, width: leftMargin, background: "#d4d2cd", borderColor: "#c5c3be" }}
        />
        {/* Content area */}
        <div
          className="absolute top-0 bottom-0 border-b"
          style={{ left: leftMargin, right: rightMargin, background: "#f5f4f0", borderColor: "#c5c3be" }}
        />
        {/* Right margin shade */}
        <div
          className="absolute top-0 bottom-0 border-b"
          style={{ right: 0, width: rightMargin, background: "#d4d2cd", borderColor: "#c5c3be" }}
        />

        {/* SVG for tick marks + labels */}
        <svg
          ref={rulerRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${PAGE_WIDTH} 24`}
          preserveAspectRatio="none"
          style={{ width: `${PAGE_WIDTH}px` }}
        >
          {ticks.map(({ x, major, label }) => (
            <g key={x}>
              <line
                x1={x}
                y1={major ? 10 : 16}
                x2={x}
                y2={24}
                stroke="#9e9c98"
                strokeWidth={major ? 1 : 0.7}
              />
              {label && (
                <text
                  x={x}
                  y={9}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#9e9c98"
                  fontFamily="Arial, sans-serif"
                >
                  {label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Left margin handle */}
        <div
          onMouseDown={onLeftMouseDown}
          className="absolute top-0 z-10 cursor-ew-resize flex items-start justify-end"
          style={{
            left: leftMargin - 10,
            width: 10,
            height: 24,
            userSelect: "none",
          }}
          title="Drag to adjust left margin"
        >
          <TriangleHandle direction="left" title="Left margin" />
        </div>

        {/* Right margin handle */}
        <div
          onMouseDown={onRightMouseDown}
          className="absolute top-0 z-10 cursor-ew-resize flex items-start justify-start"
          style={{
            right: rightMargin - 10,
            width: 10,
            height: 24,
            userSelect: "none",
          }}
          title="Drag to adjust right margin"
        >
          <TriangleHandle direction="right" title="Right margin" />
        </div>

        {/* Drag guide line */}
        {(isDraggingLeft || isDraggingRight) && (
          <div className="absolute top-0 bottom-0 w-px z-20 pointer-events-none"
            style={{ background: "#48464240", left: isDraggingLeft ? leftMargin : PAGE_WIDTH - rightMargin }}
          />
        )}
      </div>
    </div>
  );
};
