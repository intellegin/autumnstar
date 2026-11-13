import Image from "next/image";
import Link from "next/link";
import { GlobeGrid } from "@/components/GlobeGrid";
import { QuickQuote } from "@/components/QuickQuote";
import { Head } from "@/components/Head";
import { ServiceDirectory } from "@/components/ServiceDirectory";
import { RouteProcess } from "@/components/RouteProcess";
import { CtaPanel } from "@/components/CtaPanel";
import { Icon } from "@/components/Icon";
import { getServices, pages, site } from "@/lib/content";

const copy = pages.home;

export const metadata = {
  title: { absolute: `${site.shortName} | ${copy.seo.title}` },
  description: copy.seo.description,
  alternates: { canonical: "/" },
};

export default function Home() {
  const [first, ...rest] = copy.hero.title.split(" Across ");
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <GlobeGrid />
        <div className="hero-photo"><Image src={copy.hero.image} alt={copy.hero.imageAlt} fill priority sizes="(max-width: 1023px) 100vw, 50vw" /></div>
        <svg className="route-arc" viewBox="0 0 300 120" fill="none" aria-hidden="true">
          <path d="M4 112C70 20 220 4 296 40" stroke="currentColor" strokeWidth="2" strokeDasharray="7 7" />
          <circle cx="4" cy="112" r="5" fill="currentColor" /><circle cx="296" cy="40" r="5" fill="currentColor" />
        </svg>
        <div className="container">
          <div className="hero-inner">
            <h1 id="hero-title">{rest.length ? <>{first} <em>Across {rest.join(" Across ")}</em></> : copy.hero.title}</h1>
            <p>{copy.hero.text}</p>
            <div className="hero-actions">
              <Link className="btn btn-orange btn-lg" href={copy.hero.primaryCta.href}>{copy.hero.primaryCta.label} <Icon name="arrow" size={20} /></Link>
              <Link className="btn btn-outline-light btn-lg" href={copy.hero.secondaryCta.href}>{copy.hero.secondaryCta.label}</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container quick-quote-wrap">
        <h2 className="visually-hidden">{copy.quickQuote.title}</h2>
        <QuickQuote modes={copy.quickQuote.modes} />
      </div>

      <section className="section" aria-labelledby="services-title">
        <div className="container">
          <Head id="services-title" title={copy.services.title} text={copy.services.text} link={{ label: "All services", href: "/services" }} />
          <ServiceDirectory services={getServices()} />
        </div>
      </section>

      <section className="section section-tint" aria-labelledby="process-title">
        <div className="container">
          <Head id="process-title" title={copy.process.title} />
          <RouteProcess steps={copy.process.steps} />
        </div>
      </section>

      <section className="section" aria-labelledby="audience-title">
        <div className="container split">
          <div className="split-media notch"><Image src={copy.audience.image} alt={copy.audience.imageAlt} fill sizes="(max-width: 1023px) 100vw, 50vw" /></div>
          <div>
            <h2 id="audience-title">{copy.audience.title}</h2>
            <p className="lead">{copy.audience.text}</p>
            <ul className="checks">{copy.audience.items.map((i) => <li key={i}><Icon name="check" size={20} />{i}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="global-title">
        <GlobeGrid />
        <div className="band-photo"><Image src={copy.global.image} alt={copy.global.imageAlt} fill sizes="(max-width: 1023px) 100vw, 44vw" /></div>
        <div className="container">
          <div className="band-inner">
            <h2 id="global-title">{copy.global.title}</h2>
            <p>{copy.global.text}</p>
            <Link className="btn btn-outline-light" href={copy.global.cta.href}>{copy.global.cta.label} <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>

      <CtaPanel title={copy.cta.title} text={copy.cta.text} />
    </>
  );
}
