import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/ContactForm";
import { Icon } from "@/components/Icon";
import { pages, phone, site } from "@/lib/content";

const copy = pages.contact;

export const metadata: Metadata = { title: copy.seo.title, description: copy.seo.description, alternates: { canonical: "/contact" } };

export default function ContactPage() {
  const p = phone();
  const { email, address } = site.contact;
  return (
    <>
      <PageHero title={copy.hero.title} text={copy.hero.text} image={copy.hero.image} imageAlt={copy.hero.imageAlt}
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact", href: "/contact" }]} />
      <section className="section-sm section-tint">
        <div className="container form-layout">
          <ContactForm topics={copy.topics} successText={copy.successText} errorText={copy.errorText} />
          <aside className="aside" aria-label="Other ways to reach us">
            <div className="aside-card">
              <h2>Need a quote?</h2>
              <p>{copy.quoteNote}</p>
              <p style={{ marginTop: "1rem" }}><Link className="btn btn-navy" href="/quote">Request a Quote <Icon name="arrow" size={18} /></Link></p>
            </div>
            {/* Shown automatically once confirmed in content/site.json */}
            {(p || email || address) && (
              <div className="aside-card">
                <h2>Contact details</h2>
                {p && <p><a className="link" href={p.tel}>{p.display}</a></p>}
                {email && <p><a className="link" href={`mailto:${email}`}>{email}</a></p>}
                {address && <p>{address}</p>}
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
