import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icon";
import type { Service } from "@/lib/content";

/** Services as a directory of rows: photo, name, description, arrow. Ocean freight is flagged as the primary focus. */
export function ServiceDirectory({ services, exclude }: { services: Service[]; exclude?: string }) {
  return (
    <div className="directory">
      {services.filter((s) => s.slug !== exclude).map((s) => (
        <Link key={s.slug} href={`/services/${s.slug}`} className={`dir-row${s.featured ? " dir-row-featured" : ""}`}>
          <div className="dir-thumb notch"><Image src={s.image} alt={s.imageAlt} fill sizes="168px" /></div>
          <div className="dir-name">
            <Icon name={s.icon} size={30} strokeWidth={1.5} />
            <div>
              <h3>{s.name}</h3>
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
