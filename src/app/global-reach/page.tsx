import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { CtaPanel } from "@/components/CtaPanel";
import { Icon } from "@/components/Icon";
import { pages } from "@/lib/content";

const copy = pages.globalReach;

export const metadata: Metadata = { title: copy.seo.title, description: copy.seo.description, alternates: { canonical: "/global-reach" } };

export default function GlobalReachPage() {
  const regions = copy.regions as string[];
  return (
    <>
      <PageHero title={copy.hero.title} text={copy.hero.text} image={copy.hero.image} imageAlt={copy.hero.imageAlt}
        crumbs={[{ label: "Home", href: "/" }, { label: "Global Reach", href: "/global-reach" }]} />
      <section className="section">
        <div className="container">
          <p className="lead" style={{ maxWidth: "62ch", marginBottom: "2.5rem" }}>{copy.intro}</p>
          <div className="cards">
            {copy.pillars.map((p, i) => (
              <div key={p.title} className={`card notch${i === 0 ? " card-navy" : ""}`}>
                <Icon name={p.icon} size={34} strokeWidth={1.5} />
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {regions.length > 0 && (
        <section className="section-sm section-tint" aria-labelledby="regions-title">
          <div className="container">
            <h2 id="regions-title">Where we ship</h2>
            <ul className="checks">{regions.map((r) => <li key={r}><Icon name="pin" size={20} />{r}</li>)}</ul>
          </div>
        </section>
      )}

      <section className="section section-tint" aria-labelledby="lanes-title">
        <div className="container split">
          <div>
            <h2 id="lanes-title">{copy.lanes.title}</h2>
            <p className="lead">{copy.lanes.text}</p>
            <Link className="btn btn-orange btn-lg" href="/quote?mode=Ocean">Ask about your lane <Icon name="arrow" size={20} /></Link>
          </div>
          <div className="split-media notch"><Image src={copy.lanes.image} alt={copy.lanes.imageAlt} fill sizes="(max-width: 1023px) 100vw, 50vw" /></div>
        </div>
      </section>

      <CtaPanel title="Shipping internationally?" text="Tell us the origin, destination and cargo, and we'll plan the route." />
    </>
  );
}
