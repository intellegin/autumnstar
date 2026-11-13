import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { QuoteForm } from "@/components/QuoteForm";
import { pages } from "@/lib/content";

const copy = pages.quote;

export const metadata: Metadata = { title: copy.seo.title, description: copy.seo.description, alternates: { canonical: "/quote" } };

export default function QuotePage() {
  return (
    <>
      <PageHero title={copy.hero.title} text={copy.hero.text} image={copy.hero.image} imageAlt={copy.hero.imageAlt}
        crumbs={[{ label: "Home", href: "/" }, { label: "Request a Quote", href: "/quote" }]} />
      <section className="section-sm section-tint">
        <div className="container form-layout">
          <QuoteForm modes={copy.modes} directions={copy.directions} packaging={copy.packaging} weightUnits={copy.weightUnits}
            successText={copy.successText} errorText={copy.errorText} />
          <aside className="aside" aria-label="About quote requests">
            <div className="aside-card">
              <h2>{copy.aside.title}</h2>
              <ol>{copy.aside.items.map((i) => <li key={i}>{i}</li>)}</ol>
            </div>
            <div className="aside-card">
              <h2>General question?</h2>
              <p>Use the <a className="link" href="/contact">contact form</a> instead.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
