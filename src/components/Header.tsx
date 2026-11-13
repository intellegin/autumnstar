import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "./SiteNav";
import { MobileBar } from "./MobileBar";
import { getServices, site } from "@/lib/content";

export function Header() {
  const services = getServices().map(({ slug, name, short, icon }) => ({ slug, name, short, icon }));
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label={`${site.displayName}, home`}>
            <Image src="/brand/logo.png" alt="" width={1056} height={303} priority />
          </Link>
          <SiteNav nav={site.nav} services={services} cta={site.quoteCta} />
          <Link className="btn btn-orange header-cta" href={site.quoteCta.href}>{site.quoteCta.label}</Link>
        </div>
      </header>
      <MobileBar quote={site.quoteCta} />
    </>
  );
}
