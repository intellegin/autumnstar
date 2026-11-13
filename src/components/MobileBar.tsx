"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Sticky thumb bar on small screens. Hidden on the quote page (the form is the page). */
export function MobileBar({ quote }: { quote: { label: string; href: string } }) {
  const path = usePathname();
  if (path === quote.href) return null;
  return (
    <div className={`mobile-bar${path === "/contact" ? " single" : ""}`} role="navigation" aria-label="Quick actions">
      {path !== "/contact" && <Link className="btn btn-outline-light" href="/contact">Contact</Link>}
      <Link className="btn btn-orange" href={quote.href}>{quote.label}</Link>
    </div>
  );
}
