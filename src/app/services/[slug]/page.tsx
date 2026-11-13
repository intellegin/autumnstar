import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { ServiceDirectory } from "@/components/ServiceDirectory";
import { Head } from "@/components/Head";
import { CtaPanel } from "@/components/CtaPanel";
import { JsonLd } from "@/components/JsonLd";
import { Icon } from "@/components/Icon";
import { getService, getServices, site } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() { return getServices().map((s) => ({ slug: s.slug })); }

const modeFor: Record<string, string> = { "ocean-freight": "Ocean", "air-freight": "Air", "ground-transportation": "Ground" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getService((await params).slug);
  if (!s) return {};
  return {
    title: s.name,
    description: s.summary,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: { images: [{ url: s.image, alt: s.imageAlt }] },
  };
}

export default async function ServicePage({ params }: Props) {
  const s = getService((await params).slug);
  if (!s) notFound();
  const mode = modeFor[s.slug];
  const quoteHref = mode ? `/quote?mode=${mode}` : "/quote";

  return (
    <>
      <PageHero title={s.name} text={s.summary} image={s.heroImage} imageAlt={s.heroImageAlt}
        crumbs={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: s.name, href: `/services/${s.slug}` }]}>
        {s.featured && <p style={{ marginTop: "1rem" }}><span className="tag">Primary focus</span></p>}
      </PageHero>

      <section className="section">
        <div className="container service-intro">
          <div>
            <p className="lead">{s.intro}</p>
            <div className="feature-list">
              {s.sections.map((x) => (
                <div key={x.title} className={`feature${x.image ? " feature-photo" : ""}`}>
                  {x.image ? (
                    <span className="feature-thumb notch"><Image src={x.image} alt={x.imageAlt ?? ""} fill sizes="200px" /></span>
                  ) : (
                    <span className="feature-icon"><Icon name={s.icon} size={24} /></span>
                  )}
                  <div><h3>{x.title}</h3><p>{x.text}</p></div>
                </div>
              ))}
            </div>
          </div>
          <aside className="quote-card notch" aria-label={`Quote ${s.name}`}>
            <h2>Quote {s.name.toLowerCase()}</h2>
            <p>Include these and we can price it faster:</p>
            <ul className="checks">{s.quoteChecklist.map((c) => <li key={c}><Icon name="check" size={18} />{c}</li>)}</ul>
            <Link className="btn btn-orange btn-block" href={quoteHref}>Request a Quote <Icon name="arrow" size={18} /></Link>
          </aside>
        </div>
      </section>

      <section className="section" aria-labelledby="more-title">
        <div className="container">
          <Head id="more-title" title="Other services" link={{ label: "All services", href: "/services" }} />
          <ServiceDirectory services={getServices()} exclude={s.slug} />
        </div>
      </section>

      <CtaPanel title={`Ready to move your ${s.name.toLowerCase()} shipment?`} text="Send the details and we'll come back with options and a quote." href={quoteHref} />

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Service", name: s.name, description: s.summary, serviceType: s.name,
        url: `${site.url}/services/${s.slug}`, provider: { "@type": "Organization", name: site.displayName, url: site.url },
      }} />
    </>
  );
}
