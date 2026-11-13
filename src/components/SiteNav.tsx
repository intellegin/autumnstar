"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

type NavLink = { label: string; href: string };
type ServiceLink = { slug: string; name: string; short: string; icon: string };

/** Desktop nav with a Services dropdown, plus the mobile menu drawer. */
export function SiteNav({ nav, services, cta }: { nav: NavLink[]; services: ServiceLink[]; cta: NavLink }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // A click right after hover-open must keep the menu open (mouse users), while keyboard clicks still toggle.
  const openedByHover = useRef(false);

  useEffect(() => { setOpen(false); setDrawer(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setDrawer(false); } };
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, []);
  useEffect(() => { document.body.classList.toggle("lock", drawer); }, [drawer]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const others = nav.filter((n) => n.href !== "/services");

  return (
    <>
      <div ref={ref} className="nav" onMouseLeave={() => { openedByHover.current = false; setOpen(false); }}>
        <button type="button" className="nav-trigger" aria-expanded={open} aria-controls="services-menu" data-active={active("/services")}
          onClick={() => { if (openedByHover.current) { openedByHover.current = false; setOpen(true); } else setOpen((o) => !o); }}
          onMouseEnter={() => { if (!open) openedByHover.current = true; setOpen(true); }}>
          Services <Icon name="chevronDown" size={18} />
        </button>
        <div id="services-menu" className="dropdown" hidden={!open}>
          {services.map((s) => (
            <Link key={s.slug} href={`/services/${s.slug}`}>
              <Icon name={s.icon} size={26} />
              <div><strong>{s.name}</strong><span>{s.short}</span></div>
            </Link>
          ))}
          <Link href="/services" className="dropdown-all">
            <strong>All services</strong><Icon name="arrow" size={20} />
          </Link>
        </div>
        {others.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}>{n.label}</Link>
        ))}
      </div>

      <button type="button" className="menu-btn" aria-expanded={drawer} aria-controls="mobile-menu" onClick={() => setDrawer((d) => !d)}>
        <Icon name={drawer ? "close" : "menu"} size={22} /> {drawer ? "Close" : "Menu"}
      </button>
      <nav id="mobile-menu" className={`drawer${drawer ? " is-open" : ""}`} aria-label="Mobile">
        <h2>Services</h2>
        {services.map((s) => (
          <Link key={s.slug} href={`/services/${s.slug}`}><Icon name={s.icon} size={22} />{s.name}</Link>
        ))}
        <Link href="/services"><Icon name="arrow" size={22} />All services</Link>
        <h2>Company</h2>
        {others.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
        <Link href={cta.href}>{cta.label}</Link>
      </nav>
    </>
  );
}
