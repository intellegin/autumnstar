import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { Head } from "@/components/Head";
import { CtaPanel } from "@/components/CtaPanel";
import { Icon } from "@/components/Icon";
import { pages } from "@/lib/content";

const copy = pages.about;

export const metadata: Metadata = { title: copy.seo.title, description: copy.seo.description, alternates: { canonical: "/about" } };

export default function AboutPage() {
  return (
    <>
      <PageHero title={copy.hero.title} text={copy.hero.text} image={copy.hero.image} imageAlt={copy.hero.imageAlt}
        crumbs={[{ label: "Home", href: "/" }, { label: "About", href: "/about" }]} />
      <section className="section">
        <div className="container split">
          <div>
            <p className="lead">{copy.intro}</p>
            {(copy.story as string[]).map((p) => <p key={p}>{p}</p>)}
          </div>
          <div className="card card-navy notch">
            <Icon name="globe" size={36} strokeWidth={1.5} />
            <h2 style={{ fontSize: "1.8rem" }}>{copy.mission.title}</h2>
            <p>{copy.mission.text}</p>
          </div>
        </div>
      </section>
      <section className="section section-tint" aria-labelledby="philosophy-title">
        <div className="container">
          <Head id="philosophy-title" title={copy.philosophy.title} />
          <div className="cards cards-4">
            {copy.philosophy.items.map((i) => (
              <div key={i.title} className="card notch"><Icon name={i.icon} size={32} strokeWidth={1.5} /><h3>{i.title}</h3><p>{i.text}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="section-sm">
        <div className="container"><div className="split-media notch" style={{ aspectRatio: "21 / 8" }}><Image src={copy.image} alt={copy.imageAlt} fill sizes="100vw" /></div></div>
      </section>
      <CtaPanel title="Let's talk about your shipping" text="Questions, a new lane or a regular shipment: we're glad to help." />
    </>
  );
}
