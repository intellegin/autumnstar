import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ServiceDirectory } from "@/components/ServiceDirectory";
import { RouteProcess } from "@/components/RouteProcess";
import { Head } from "@/components/Head";
import { CtaPanel } from "@/components/CtaPanel";
import { getServices, pages } from "@/lib/content";

const copy = pages.services;

export const metadata: Metadata = { title: copy.seo.title, description: copy.seo.description, alternates: { canonical: "/services" } };

export default function ServicesPage() {
  return (
    <>
      <PageHero title={copy.hero.title} text={copy.hero.text} image={copy.hero.image} imageAlt={copy.hero.imageAlt}
        crumbs={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }]} />
      <section className="section">
        <div className="container">
          <ServiceDirectory services={getServices()} />
          <p className="lead" style={{ marginTop: "2rem", maxWidth: "60ch" }}>{copy.note}</p>
        </div>
      </section>
      <section className="section section-tint" aria-labelledby="process-title">
        <div className="container">
          <Head id="process-title" title={pages.home.process.title} />
          <RouteProcess steps={pages.home.process.steps} />
        </div>
      </section>
      <CtaPanel title="Tell us about your shipment" text="Ocean, air or ground: one request is all it takes." />
    </>
  );
}
