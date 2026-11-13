import Image from "next/image";
import Link from "next/link";
import { getServices, phone, site } from "@/lib/content";

export function Footer() {
  const p = phone();
  const { email, address } = site.contact;
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Image src="/brand/logo-white.png" alt={site.displayName} width={1000} height={250} />
          <p className="footer-tagline">{site.tagline}</p>
          <p>{site.description}</p>
        </div>
        <nav aria-label="Services">
          <h2 className="footer-h">Services</h2>
          <ul>
            {getServices().map((s) => <li key={s.slug}><Link href={`/services/${s.slug}`}>{s.name}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Company">
          <h2 className="footer-h">Company</h2>
          <ul>
            <li><Link href="/">Home</Link></li>
            {site.nav.map((n) => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}
            <li><Link href={site.quoteCta.href}>{site.quoteCta.label}</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="footer-h">Get started</h2>
          <p>Tell us about your shipment and we&rsquo;ll come back with options and a quote.</p>
          {/* Contact details appear here once confirmed in content/site.json */}
          {p && <p><a href={p.tel}>{p.display}</a></p>}
          {email && <p><a href={`mailto:${email}`}>{email}</a></p>}
          {address && <p>{address}</p>}
          <Link className="btn btn-orange" href={site.quoteCta.href}>{site.quoteCta.label}</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} {site.displayName}</p>
        <p>{site.tagline}</p>
      </div>
    </footer>
  );
}
