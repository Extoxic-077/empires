import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function Tip({
  content,
  children,
  wide,
}: {
  content: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!show || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({
      x: Math.min(window.innerWidth - (wide ? 320 : 240) - 12, r.left + r.width / 2 - (wide ? 160 : 120)),
      y: r.bottom + 8,
    });
  }, [show, wide]);

  return (
    <span
      ref={ref}
      className="tip-anchor"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(false)}
    >
      {children}
      {show && (
        <span className={`tip-card${wide ? " tip-wide" : ""}`} style={{ left: pos.x, top: pos.y }}>
          {content}
        </span>
      )}
    </span>
  );
}

export function CostList({
  cost,
  res,
}: {
  cost: Partial<Record<"gold" | "wood" | "stone" | "food", number>>;
  res?: Record<string, number>;
}) {
  const entries = Object.entries(cost).filter(([, v]) => (v ?? 0) > 0);
  if (entries.length === 0) return <span className="cost-free">Free</span>;
  return (
    <span className="cost-list">
      {entries.map(([k, v]) => (
        <span key={k} className={`cost-chip${res && (res[k] ?? 0) < (v ?? 0) ? " lack" : ""}`}>
          {String(k)} {v}
        </span>
      ))}
    </span>
  );
}
