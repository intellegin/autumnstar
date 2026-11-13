import Image from "next/image";
import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { GlobeGrid } from "./GlobeGrid";

type Props = { title: string; text?: string; image: string; imageAlt: string; crumbs?: Crumb[]; children?: ReactNode };

/** Inner-page hero: navy band, globe grid, photo cut on a diagonal at the right edge. */
export function PageHero({ title, text, image, imageAlt, crumbs, children }: Props) {
  return (
    <section className="page-hero">
      <GlobeGrid />
      <div className="page-hero-photo">
        <Image src={image} alt={imageAlt} fill priority sizes="(max-width: 1023px) 100vw, 46vw" />
      </div>
      <div className="container">
        <div className="page-hero-inner">
          {crumbs && <Breadcrumbs items={crumbs} />}
          <h1>{title}</h1>
          {text && <p>{text}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
