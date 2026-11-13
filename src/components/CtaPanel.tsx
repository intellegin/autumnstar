import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icon";

/** Closing call to action: deep navy, faint logo mark, orange quote button. */
export function CtaPanel({ title, text, href = "/quote", label = "Request a Quote" }: { title: string; text?: string; href?: string; label?: string }) {
  return (
    <section className="cta" aria-label={title}>
      <Image className="cta-mark" src="/brand/mark.png" alt="" width={600} height={543} aria-hidden="true" />
      <div className="container cta-inner">
        <div>
          <h2>{title}</h2>
          {text && <p>{text}</p>}
        </div>
        <div className="cta-actions">
          <Link className="btn btn-orange btn-lg" href={href}>{label} <Icon name="arrow" size={20} /></Link>
          <Link className="btn btn-outline-light btn-lg" href="/contact">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
