/** Line icons on a 24x24 grid (stroke = currentColor). Decorative unless `label` is set. */
const PATHS = {
  ship: "M3 17.5c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0M4.5 15l-1-4h17l-2 4M7 11V7h4v4M11 9h4v2M14 7h3v4M9 4h2v3",
  plane: "M21 15.5 13.5 11V5a1.5 1.5 0 0 0-3 0v6L3 15.5V17l7.5-2.2V19L8.5 20.5V22l3.5-1 3.5 1v-1.5L13.5 19v-4.2L21 17z",
  truck: "M2 6h12v10H2zM14 9h4.5l3.5 3.5V16h-8M6 19.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM17.5 19.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z",
  route: "M6 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM18 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8.5 16.5h5a3.5 3.5 0 0 0 0-7h-3a3.5 3.5 0 0 1 0-7h5",
  network: "M12 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM5 22a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM19 22a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 7v5M12 12l-5.5 5.2M12 12l5.5 5.2",
  clipboard: "M8 4h8v3H8zM16 5.5h2.5V21h-13V5.5H8M8.5 12h7M8.5 15.5h5",
  doc: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 15.5h6M9 9h2",
  chat: "M4 5h16v11H9l-5 4zM8 9.5h8M8 12.5h5",
  handshake: "m11 17 2 2a1.4 1.4 0 0 0 2-2M14 14l2.5 2.5a1.4 1.4 0 0 0 2-2L15 11M3 7l4-3 5 2 3-1 6 3-2 8M3 7l-1 7 2 2M9 9l-2 2a1.4 1.4 0 0 0 2 2l3-2M9 15l1.5 1.5a1.4 1.4 0 0 0 2-2",
  shield: "M12 3 5 6v5.5c0 4.3 3 7.7 7 9.5 4-1.8 7-5.2 7-9.5V6zM9 12l2 2 4-4",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z",
  box: "M12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 11v10M8 5l8 4",
  check: "m5 12.5 4.5 4.5L19 7.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  chevronDown: "m6 9 6 6 6-6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21ZM12 12.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, className, label, strokeWidth = 1.7 }: { name: IconName | string; size?: number; className?: string; label?: string; strokeWidth?: number }) {
  const d = PATHS[name as IconName] ?? PATHS.box;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label} focusable="false">
      <path d={d} />
    </svg>
  );
}
