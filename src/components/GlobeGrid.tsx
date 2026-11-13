/** Latitude/longitude line motif taken from the logo's globe. Decorative. */
export function GlobeGrid({ className = "" }: { className?: string }) {
  const meridians = [0.15, 0.32, 0.5, 0.68, 0.85];
  const parallels = [-0.66, -0.36, 0, 0.36, 0.66];
  return (
    <div className={`globe-grid ${className}`} aria-hidden="true">
      <svg viewBox="-100 -100 200 200" fill="none" stroke="currentColor" strokeWidth="0.6">
        <circle r="96" />
        {meridians.map((m) => <ellipse key={m} rx={96 * m} ry="96" />)}
        {parallels.map((p) => {
          const y = 96 * p;
          const half = Math.sqrt(96 * 96 - y * y);
          return <line key={p} x1={-half} x2={half} y1={y} y2={y} />;
        })}
      </svg>
    </div>
  );
}
