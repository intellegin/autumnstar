import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icon";
import type { Service } from "@/lib/content";

/** Services as a directory of rows: photo, name, description, arrow. Ocean freight is flagged as the primary focus. */
/** `headingLevel` 2 when the list sits directly under the page H1 (keeps the outline free of skipped levels). */
export function ServiceDirectory({ services, exclude, headingLevel = 3 }: { services: Service[]; exclude?: string; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="directory">
      {services.filter((s) => s.slug !== exclude).map((s) => (
        <Link key={s.slug} href={`/services/${s.slug}`} className={`dir-row${s.featured ? " dir-row-featured" : ""}`}>
          <div className="dir-thumb notch"><Image src={s.image} alt={s.imageAlt} fill sizes="168px" /></div>
          <div className="dir-name">
            <Icon name={s.icon} size={30} strokeWidth={1.5} />
            <div>
              <H className="h3">{s.name}</H>
              {s.featured && <span className="tag">Primary focus</span>}
            </div>
          </div>
          <p>{s.summary}</p>
          <span className="dir-arrow" aria-hidden="true"><Icon name="arrow" size={20} /></span>
        </Link>
      ))}
    </div>
  );
}
